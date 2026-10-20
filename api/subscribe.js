import { createClient } from '@supabase/supabase-js'
import { addContact, outcomePatch } from './_lib/emailoctopus.js'

// Postgres unique_violation. `newsletter_subscribers.email` is the only UNIQUE
// constraint on the table, so this code can only mean "already subscribed".
const UNIQUE_VIOLATION = '23505'

const MAX_EMAIL_LENGTH = 254

// Deliberately loose: this is a junk filter, not an RFC 5322 parser.
// EmailOctopus is the real authority on whether an address is deliverable.
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
  // Sam@x.com and sam@x.com are two rows and two EmailOctopus contacts.
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

  // SERVICE ROLE ONLY — no anon-key fallback, deliberately.
  //
  // This endpoint needs to read the inserted row back and then UPDATE it with
  // the EmailOctopus outcome, and the anon key can do neither:
  //   - RLS grants SELECT only TO authenticated, so `.insert().select()` runs
  //     INSERT ... RETURNING against a denying SELECT policy and the insert
  //     fails outright — every signup would 500.
  //   - There is no UPDATE policy at all, so recording emailoctopus_status would
  //     match zero rows and silently do nothing.
  // Falling back to the anon key would therefore not degrade gracefully, it
  // would fail confusingly. Name the missing variable instead.
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // HARD FAIL, by design. The previous version logged this and carried on to
  // return `success: true` — the subscriber was told they had signed up while
  // nothing was written anywhere. A misconfigured server is our problem to fix,
  // and the caller must be told to retry rather than be quietly dropped.
  if (!supabaseUrl || !supabaseKey) {
    console.error(
      '[subscribe] Supabase env vars missing.',
      'SUPABASE_URL/VITE_SUPABASE_URL:', !!supabaseUrl,
      'SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey
    )
    return res.status(500).json({ error: 'Newsletter signup is temporarily unavailable. Please try again later.' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Why insert-then-select-on-conflict rather than a single upsert:
  //
  // PostgREST's upsert compiles to INSERT ... ON CONFLICT DO UPDATE and returns
  // the row either way, with no signal for which branch ran — so it cannot
  // populate `alreadySubscribed`. Worse, whatever columns appear in the payload
  // get overwritten on conflict, so an upsert carrying `source` or any
  // emailoctopus_* field would stamp a returning subscriber's original `source`
  // back to 'website' and knock a row that is already 'synced' back to 'pending'.
  // A distinct insert path and select path keep both hazards impossible instead
  // of merely avoided.
  //
  // The payload is `{ email }` alone on purpose: `subscribed_at`, `source` and
  // every emailoctopus_* column take their database defaults, so this insert
  // stays correct without restating the schema here.
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
      // no row to attach an outcome to, and nothing is reliably stored, so
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

  // They unsubscribed before. Typing an address into a form is not proof it is
  // theirs, so it does not undo an opt-out: nothing is pushed, and the form tells
  // them how to rejoin. `unsubscribed_at` is never cleared from here.
  if (row.unsubscribed_at) {
    return res.status(200).json({ success: true, alreadySubscribed: true, optedOut: true })
  }

  // Already confirmed on the list. Pushing again would only spend an API call —
  // or, if they were deleted there since, re-create someone the nightly sync is
  // about to record as gone.
  if (row.emailoctopus_status === 'synced') {
    return res.status(200).json({ success: true, emailoctopus: 'synced', alreadySubscribed, optedOut: false })
  }

  // The email is now durably stored. From here on the response is always 200:
  // if EmailOctopus does not take it now, the nightly sync pushes it, and the
  // admin Subscribers screen shows it as failed until then.
  const result = await addContact(email, { signedUpOn: row.subscribed_at, source: row.source })

  await recordOutcome(supabase, row, result)

  return res.status(200).json({
    success: true,
    emailoctopus: result.status,
    alreadySubscribed,
    optedOut: false,
  })
}

/**
 * Write the EmailOctopus outcome back onto the subscriber row.
 *
 * Failures here are logged and swallowed: the push already happened, and the
 * subscriber's answer does not depend on whether we managed to record it.
 *
 * Read-modify-write on emailoctopus_attempts, using the count the insert/select
 * above already returned. A lost update miscounts attempts by one; it can never
 * misreport emailoctopus_status, which is the field anyone acts on.
 */
async function recordOutcome(supabase, row, result) {
  const { error } = await supabase
    .from('newsletter_subscribers')
    .update(outcomePatch(result, row?.emailoctopus_attempts))
    .eq('id', row.id)

  if (error) {
    console.error('[subscribe] failed to record emailoctopus status for', row.id, error)
  }
}
