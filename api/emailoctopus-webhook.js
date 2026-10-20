import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { LIST_ID, normaliseEmail } from './_lib/emailoctopus.js'

// EmailOctopus calls this when a contact unsubscribes, complains, bounces or is
// deleted, and the opt-out is recorded on newsletter_subscribers straight away.
// The nightly sync (api/emailoctopus-sync.js) catches anything this misses.
//
// Set up in EmailOctopus under Settings -> Webhooks, pointing at
// https://<site>/api/emailoctopus-webhook, with that endpoint's secret in the
// EMAILOCTOPUS_WEBHOOK_SECRET env var on Vercel.
//
// Web-standard handler rather than (req, res): the signature is an HMAC over the
// RAW body, and Vercel's req.body helper hands over parsed JSON, which cannot be
// re-serialised byte-for-byte.

// Events that mean "do not email this person again".
const OPT_OUT_EVENTS = new Set([
  'contact.unsubscribed',
  'contact.complained',
  'contact.bounced',
  // Deleting someone at EmailOctopus is treated as an opt-out, not as "gone":
  // with no row marked here, the next signup sync would re-create them.
  'contact.deleted',
])

// contact.updated carries the new status; these mean the same as the events above.
const OPT_OUT_STATUSES = new Set(['UNSUBSCRIBED', 'COMPLAINED', 'BOUNCED'])

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// "sha256=" + hex HMAC-SHA256 of the raw body, keyed with the endpoint's secret.
function signatureIsValid(rawBody, header, secret) {
  if (!header) return false
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(header)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function isOptOut(event) {
  if (event?.list_id !== LIST_ID) return false
  if (OPT_OUT_EVENTS.has(event.type)) return true
  return event.type === 'contact.updated' &&
    OPT_OUT_STATUSES.has(String(event.contact_status || '').toUpperCase())
}

export async function POST(request) {
  const secret = process.env.EMAILOCTOPUS_WEBHOOK_SECRET
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // A 500, not a 200: EmailOctopus retries a failed delivery for about ten days,
  // so a missing variable fixed tomorrow still gets today's unsubscribes.
  if (!secret || !supabaseUrl || !supabaseKey) {
    console.error('[emailoctopus-webhook] missing env:',
      'EMAILOCTOPUS_WEBHOOK_SECRET', !!secret, 'SUPABASE_URL', !!supabaseUrl, 'SUPABASE_SERVICE_ROLE_KEY', !!supabaseKey)
    return json({ error: 'Not configured' }, 500)
  }

  const rawBody = await request.text()
  if (!signatureIsValid(rawBody, request.headers.get('emailoctopus-signature'), secret)) {
    return json({ error: 'Invalid signature' }, 401)
  }

  let events
  try {
    events = JSON.parse(rawBody)
  } catch {
    return json({ error: 'Body is not JSON' }, 400)
  }
  if (!Array.isArray(events)) events = [events]

  const supabase = createClient(supabaseUrl, supabaseKey)
  let recorded = 0

  for (const event of events.filter(isOptOut)) {
    const email = normaliseEmail(event.contact_email_address)
    if (!email) continue

    // Set-only: `.is('unsubscribed_at', null)` leaves an earlier opt-out date
    // alone and never clears one. A row with no match (a contact added at
    // EmailOctopus directly, or a legacy mixed-case address) is picked up by
    // the nightly sync, which compares normalised addresses.
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .update({ unsubscribed_at: event.occurred_at || new Date().toISOString() })
      .eq('email', email)
      .is('unsubscribed_at', null)
      .select('id')

    if (error) {
      // Let EmailOctopus retry the whole delivery; the update is idempotent.
      console.error('[emailoctopus-webhook] update failed for event', event.id, error.message)
      return json({ error: 'Could not record opt-out' }, 500)
    }
    recorded += data?.length || 0
  }

  return json({ received: events.length, recorded })
}
