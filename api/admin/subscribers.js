import { createClient } from '@supabase/supabase-js'
import { addContact, outcomePatch, EO_STATUS } from '../_lib/emailoctopus.js'
import { runSync, readAllSubscribers } from '../_lib/subscriber-sync.js'

// The columns the admin contract returns. Kept as one string so GET and the
// retry reload cannot drift apart from each other.
const SUBSCRIBER_COLUMNS =
  'id, email, subscribed_at, unsubscribed_at, emailoctopus_status, emailoctopus_synced_at, ' +
  'emailoctopus_error, emailoctopus_attempts, emailoctopus_last_attempt_at, source'

// Bounds the retry-all set. PostgREST caps any single read at 1000 rows here
// anyway; the GET pages past that with readAllSubscribers.
const MAX_ROWS = 1000

// The four states of the emailoctopus_status CHECK constraint in migration 038.
const COUNTED_STATUSES = [
  EO_STATUS.SYNCED,
  EO_STATUS.FAILED,
  EO_STATUS.PENDING,
  EO_STATUS.SKIPPED,
]

function countByStatus(rows) {
  const counts = { total: 0, synced: 0, failed: 0, pending: 0, skipped: 0 }
  for (const row of rows) {
    counts.total++
    if (COUNTED_STATUSES.includes(row.emailoctopus_status)) {
      counts[row.emailoctopus_status]++
    }
  }
  return counts
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
    // GET — list every subscriber with its EmailOctopus sync state
    if (req.method === 'GET') {
      // Paged, because the table is near PostgREST's 1000-row cap and a single
      // read would silently drop the oldest sign-ups. Newest first, as before.
      const subscribers = (await readAllSubscribers(supabase, SUBSCRIBER_COLUMNS))
        .sort((a, b) => String(b.subscribed_at).localeCompare(String(a.subscribed_at)))

      return res.status(200).json({
        subscribers,
        counts: countByStatus(subscribers),
      })
    }

    if (req.method === 'POST') {
      const { action, id } = req.body || {}

      // The full two-way sync the nightly job runs, on demand.
      if (action === 'sync') {
        const summary = await runSync(supabase)
        return res.status(200).json(summary)
      }

      if (action !== 'retry') {
        return res.status(400).json({ error: "Unknown action. Expected { action: 'retry' } or { action: 'sync' }" })
      }

      // Re-attempt the push for one row, or for every unsynced row.
      let query = supabase
        .from('newsletter_subscribers')
        .select('id, email, subscribed_at, source, emailoctopus_attempts, unsubscribed_at')

      if (id) {
        query = query.eq('id', id)
      } else {
        // Already-synced rows are the desired end state — retrying them would
        // only burn API calls and reset timestamps that are already correct.
        //
        // AND NEVER AN UNSUBSCRIBED ROW. `unsubscribed_at` is a consent record:
        // pushing that contact back re-adds someone to a list they left, which is
        // the single thing the whole consent design exists to prevent. It has to
        // be enforced HERE and not only in the admin screen, because retry-all
        // sends no row ids at all — the server picks the set, so a client-side
        // gate cannot reach it.
        query = query
          .neq('emailoctopus_status', EO_STATUS.SYNCED)
          .is('unsubscribed_at', null)
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

      // The bulk branch filters unsubscribed rows out in SQL; the single-id
      // branch selects one row by id, so it needs its own check. Refused rather
      // than silently skipped: the admin asked for something specific and is
      // owed the reason, and a silent no-op would read as a failed retry and
      // invite them to try again.
      if (id && rows[0].unsubscribed_at) {
        return res.status(409).json({
          error: 'That person unsubscribed, so they cannot be pushed back to EmailOctopus. ' +
            'Re-adding a contact who opted out is exactly what this record prevents.',
        })
      }

      let retried = 0
      let synced = 0
      let failed = 0

      // Sequential on purpose — NOT Promise.all. EmailOctopus rate-limits per
      // API key (10 requests a second), and the backlog is normally a handful.
      for (const row of rows || []) {
        if (!row.email) continue

        const result = await addContact(row.email, { signedUpOn: row.subscribed_at, source: row.source })
        retried++
        if (result.status === EO_STATUS.SYNCED) synced++
        else failed++

        const { error: updateError } = await supabase
          .from('newsletter_subscribers')
          .update(outcomePatch(result, row.emailoctopus_attempts))
          .eq('id', row.id)

        // A failed write-back must not abort the run: the remaining rows still
        // deserve their retry, and the stale row will simply show up unsynced
        // on the next load.
        if (updateError) {
          console.error('Failed to record EmailOctopus outcome for', row.id, updateError.message)
        }
      }

      return res.status(200).json({ retried, synced, failed })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Admin subscribers error:', err)
    return res.status(500).json({ error: err?.message || 'Something went wrong' })
  }
}
