import { createClient } from '@supabase/supabase-js'
import { syncContactToBrevo, BREVO_STATUS } from './_lib/brevo.js'

// Client-side twin lives in src/utils/constants.js as NEWSLETTER.hostedFormUrl.
// Serverless functions cannot import from src/, so the URL is duplicated here on
// purpose. If one changes, change the other.
const HOSTED_FORM_URL = 'https://sh1.sendinblue.com/amn2zqxhtxpfe.html?t=1774565443585'

// Postgres unique_violation. `newsletter_subscribers.email` is the only UNIQUE
// constraint on the table, so this code can only mean "already subscribed".
const UNIQUE_VIOLATION = '23505'

const MAX_EMAIL_LENGTH = 254

// Deliberately loose: this is a junk filter, not an RFC 5322 parser. Brevo is
// the real authority on whether an address is deliverable.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function readBody(req) {
  // Vercel parses application/json for us, but a text/plain or missing
  // content-type arrives as a raw string. Parse defensively rather than
  // throwing on `req.body.email`.
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return req.body && typeof req.body === 'object' ? req.body : {}
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Any unexpected throw below must still leave the caller with JSON. Without
  // this the platform returns an HTML error page and the client's res.json()
  // blows up on "<", which reads as a network fault rather than a server bug.
  try {
    return await subscribe(req, res)
  } catch (err) {
    console.error('[subscribe] unhandled error:', err)
    if (res.headersSent) return
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}

async function subscribe(req, res) {
  const { email: rawEmail } = readBody(req)

  if (!rawEmail || typeof rawEmail !== 'string') {
    return res.status(400).json({ error: 'Email is required' })
  }

  // Store lowercased so the UNIQUE constraint actually dedupes: without this,
  // Sam@x.com and sam@x.com are two rows and two Brevo contacts.
  const email = rawEmail.trim().toLowerCase()

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }
  if (email.length > MAX_EMAIL_LENGTH) {
    return res.status(400).json({ error: 'That email address is too long' })
  }
  if (!EMAIL_SHAPE.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

  // HARD FAIL, by design. The previous version logged this and carried on to
  // return `success: true` — the subscriber was told they had signed up while
  // nothing was written anywhere. A misconfigured server is our problem to fix,
  // and the caller must be told to retry rather than be quietly dropped.
  if (!supabaseUrl || !supabaseKey) {
    console.error(
      '[subscribe] Supabase env vars missing.',
      'url:', !!supabaseUrl,
      'key:', !!supabaseKey
    )
    return res.status(500).json({ error: 'Newsletter signup is temporarily unavailable. Please try again later.' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Why insert-then-select-on-conflict rather than a single upsert:
  //
  // PostgREST's upsert compiles to INSERT ... ON CONFLICT DO UPDATE and returns
  // the row either way, with no signal for which branch ran — so it cannot
  // populate `alreadySubscribed`. Worse, whatever columns appear in the payload
  // get overwritten on conflict, so an upsert carrying `source` or any brevo_*
  // field would stamp a returning subscriber's original `source` back to
  // 'website' and knock a row that is already 'synced' back to 'pending'.
  // A distinct insert path and select path keep both hazards impossible instead
  // of merely avoided.
  //
  // The payload is `{ email }` alone on purpose: `subscribed_at`, `source` and
  // every brevo_* column take their database defaults, so this insert stays
  // correct without restating the schema here.
  let row = null
  let alreadySubscribed = false

  const { data: inserted, error: insertError } = await supabase
    .from('newsletter_subscribers')
    .insert({ email })
    .select()
    .single()

  if (!insertError) {
    row = inserted
  } else if (insertError.code === UNIQUE_VIOLATION) {
    alreadySubscribed = true

    const { data: existing, error: selectError } = await supabase
      .from('newsletter_subscribers')
      .select()
      .eq('email', email)
      .single()

    if (selectError || !existing) {
      // The row conflicted and then could not be read back — a delete raced us,
      // or the key is unreadable under this key's RLS policy. Either way we hold
      // no row to attach a Brevo outcome to, and nothing is reliably stored, so
      // this is the 500-and-retry branch rather than a claim of success.
      console.error('[subscribe] conflict on', email, 'but row not readable:', selectError)
      return res.status(500).json({ error: 'Could not save your email. Please try again.' })
    }

    row = existing
  } else {
    // Nothing was stored. The caller must retry — never report a subscription
    // we did not persist.
    console.error('[subscribe] database error:', insertError)
    return res.status(500).json({ error: 'Could not save your email. Please try again.' })
  }

  // The email is now durably stored. From here on the response is always 200:
  // whatever Brevo does, we already hold the address and can retry it later
  // from /api/admin/subscribers.
  const result = await syncContactToBrevo(email)

  await recordBrevoOutcome(supabase, row, result)

  return res.status(200).json({
    success: true,
    brevo: result.status,
    alreadySubscribed,
    fallbackUrl: HOSTED_FORM_URL,
  })
}

/**
 * Write the Brevo outcome back onto the subscriber row.
 *
 * Failures here are logged and swallowed: the sync already happened, and the
 * subscriber's answer is determined by what Brevo did, not by whether we
 * managed to record it.
 */
async function recordBrevoOutcome(supabase, row, result) {
  const now = new Date().toISOString()
  const synced = result.status === BREVO_STATUS.SYNCED

  // Read-modify-write on brevo_attempts, using the count already returned by
  // the insert/select above — no extra round trip. A true atomic increment
  // needs a SQL expression PostgREST cannot express without an RPC, and the
  // only writers to a given subscriber row are that subscriber's own signup
  // and an admin retry. A lost update here miscounts attempts by one; it can
  // never misreport brevo_status, which is the field anyone acts on.
  const attempts = Number.isFinite(row?.brevo_attempts) ? row.brevo_attempts : 0

  const patch = {
    brevo_status: result.status,
    brevo_error: synced ? null : result.error,
    brevo_attempts: attempts + 1,
    brevo_last_attempt_at: now,
    // Only stamped on success, per the column's contract. Left untouched on a
    // failure so an earlier genuine sync timestamp is not erased by a later
    // transient error.
    ...(synced ? { brevo_synced_at: now } : {}),
  }

  const { error } = await supabase
    .from('newsletter_subscribers')
    .update(patch)
    .eq('id', row.id)

  if (error) {
    console.error('[subscribe] failed to record brevo status for', row.id, error)
  }
}
