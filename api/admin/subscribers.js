import { createClient } from '@supabase/supabase-js'
import { syncContactToBrevo, BREVO_STATUS } from '../_lib/brevo.js'

// The columns the admin contract returns. Kept as one string so GET and the
// retry reload cannot drift apart from each other.
const SUBSCRIBER_COLUMNS =
  'id, email, subscribed_at, brevo_status, brevo_synced_at, brevo_error, brevo_attempts, brevo_last_attempt_at, source'

// newsletter_subscribers is ~29 rows, so the admin screen deliberately does not
// paginate. The cap exists only so a runaway table can never dump unbounded
// rows (every one of them a personal email address) into an admin response.
const MAX_ROWS = 1000

// The four states of the brevo_status CHECK constraint in migration 019.
const COUNTED_STATUSES = [
  BREVO_STATUS.SYNCED,
  BREVO_STATUS.FAILED,
  BREVO_STATUS.PENDING,
  BREVO_STATUS.SKIPPED,
]

function countByStatus(rows) {
  const counts = { total: 0, synced: 0, failed: 0, pending: 0, skipped: 0 }
  for (const row of rows) {
    counts.total++
    if (COUNTED_STATUSES.includes(row.brevo_status)) {
      counts[row.brevo_status]++
    }
  }
  return counts
}

// The write-back rules here must stay identical to /api/subscribe: a synced row
// records when it landed and clears the old error, anything else keeps the
// error visible, and every attempt — success or not — bumps the counter and the
// timestamp so a row that keeps failing is obvious in the admin list.
function outcomePatch(result, previousAttempts) {
  const now = new Date().toISOString()
  const synced = result.status === BREVO_STATUS.SYNCED

  return {
    brevo_status: result.status,
    // Only a synced row stamps brevo_synced_at; a failed retry leaves whatever
    // was there rather than inventing a sync time it did not earn.
    ...(synced ? { brevo_synced_at: now } : {}),
    brevo_error: synced ? null : result.error,
    brevo_attempts: (previousAttempts || 0) + 1,
    brevo_last_attempt_at: now,
  }
}

export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Verify the caller is authenticated. This endpoint returns subscriber email
  // addresses, so nothing below this guard may run for an anonymous caller.
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !caller) {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }

  try {
    // GET — list every subscriber with its Brevo sync state
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select(SUBSCRIBER_COLUMNS)
        .order('subscribed_at', { ascending: false })
        .limit(MAX_ROWS)

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      const subscribers = data || []
      return res.status(200).json({
        subscribers,
        counts: countByStatus(subscribers),
      })
    }

    // POST — re-attempt the Brevo write for one row, or for every unsynced row
    if (req.method === 'POST') {
      const { action, id } = req.body || {}

      if (action !== 'retry') {
        return res.status(400).json({ error: "Unknown action. Expected { action: 'retry' }" })
      }

      let query = supabase
        .from('newsletter_subscribers')
        .select('id, email, brevo_attempts')

      if (id) {
        query = query.eq('id', id)
      } else {
        // Already-synced rows are the desired end state — retrying them would
        // only burn Brevo quota and reset timestamps that are already correct.
        query = query
          .neq('brevo_status', BREVO_STATUS.SYNCED)
          .order('subscribed_at', { ascending: true })
          .limit(MAX_ROWS)
      }

      const { data: rows, error: loadError } = await query
      if (loadError) {
        return res.status(500).json({ error: loadError.message })
      }
      if (id && (!rows || rows.length === 0)) {
        return res.status(404).json({ error: 'Subscriber not found' })
      }

      let retried = 0
      let synced = 0
      let failed = 0

      // Sequential on purpose — NOT Promise.all. Brevo rate-limits per API key,
      // and the backfill edge function already proved a serial loop over this
      // volume (~29 rows) completes well inside the function timeout.
      for (const row of rows || []) {
        if (!row.email) continue

        const result = await syncContactToBrevo(row.email)
        retried++
        if (result.status === BREVO_STATUS.SYNCED) synced++
        else failed++

        const { error: updateError } = await supabase
          .from('newsletter_subscribers')
          .update(outcomePatch(result, row.brevo_attempts))
          .eq('id', row.id)

        // A failed write-back must not abort the run: the remaining rows still
        // deserve their retry, and the stale row will simply show up unsynced
        // on the next load.
        if (updateError) {
          console.error('Failed to record Brevo outcome for', row.id, updateError.message)
        }
      }

      return res.status(200).json({ retried, synced, failed })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Admin subscribers error:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
}
