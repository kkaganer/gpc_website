import { createClient } from '@supabase/supabase-js'
import { runSync } from './_lib/subscriber-sync.js'

// The nightly two-way sync between Supabase and EmailOctopus, called by the Vercel
// cron in vercel.json. The rules live in api/_lib/subscriber-sync.js; the admin
// Subscribers screen runs the same thing from its "Sync now" button.
//
// Vercel sends `Authorization: Bearer $CRON_SECRET` on cron calls when CRON_SECRET
// is set. Without it this refuses to run, so nobody else can trigger it.

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Not authorised' })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    const summary = await runSync(createClient(supabaseUrl, supabaseKey))
    // Counts and masked addresses only, so the log is safe to read.
    console.log('[emailoctopus-sync]', JSON.stringify(summary))
    return res.status(200).json(summary)
  } catch (err) {
    console.error('[emailoctopus-sync] failed:', err)
    return res.status(500).json({ error: err?.message || 'Sync failed' })
  }
}
