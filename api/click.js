import { createClient } from '@supabase/supabase-js'

// The click counter for paid slots.
//
// Every paid placement links here rather than straight at the advertiser, so the
// weekly click count promised in the rate card is a number we actually hold.
//
// Two rules govern everything below.
//
// It never sends anyone anywhere the database did not already say. The
// destination is looked up from the advertiser row by id -- it is NOT taken from
// the query string. A redirector that forwards to a caller-supplied URL is an
// open redirect, and an open redirect on a domain parents trust is worth more to
// a phisher than the ad slot is to us.
//
// And it never fails closed. If the lookup breaks, the insert breaks, or the
// environment is missing, the visitor still lands somewhere sensible. A parent
// clicking a link in a newsletter must never see a 500 because our analytics had
// a bad day.

const SITE = 'https://gpccommunity.co.uk'

// Must match the CHECK constraint on advertiser_clicks.source in migration 031.
const SOURCES = ['email', 'web']

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function client() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  try {
    return createClient(url, key)
  } catch {
    return null
  }
}

/**
 * Only http(s), and only a URL the database gave us.
 *
 * Belt and braces on top of "we never read the target from the request": a
 * javascript: or data: URL stored in the advertiser row by mistake must not
 * become a redirect.
 */
export function safeDestination(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return null
  try {
    const parsed = new URL(raw.trim())
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed.toString()
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  const advertiserId = String(req.query?.id || '')
  const editionDate = String(req.query?.date || '')
  const rawSource = String(req.query?.source || '')
  const source = SOURCES.includes(rawSource) ? rawSource : 'web'

  const redirect = (to) => {
    res.setHeader('Location', to)
    // Never cached: a cached redirect would count one click and then send every
    // later visitor straight past the counter.
    res.setHeader('Cache-Control', 'no-store')
    return res.status(302).end()
  }

  if (!UUID.test(advertiserId)) return redirect(SITE)

  const supabase = client()
  if (!supabase) return redirect(SITE)

  let destination = null
  try {
    const { data, error } = await supabase
      .from('public_newsletter_advertisers')
      .select('event_url')
      .eq('id', advertiserId)
      .maybeSingle()
    if (!error && data) destination = safeDestination(data.event_url)
  } catch {
    destination = null
  }

  // An advertiser we cannot resolve gets no click recorded, because there is
  // nothing to attribute it to and a row referencing a missing advertiser would
  // fail the foreign key anyway.
  if (!destination) return redirect(SITE)

  try {
    await supabase.from('advertiser_clicks').insert({
      advertiser_id: advertiserId,
      edition_date: ISO_DATE.test(editionDate) ? editionDate : new Date().toISOString().slice(0, 10),
      source,
    })
  } catch {
    // Counted or not, the visitor is going where they meant to go.
  }

  return redirect(destination)
}

/** The link a paid slot points at. Shared by the email renderer and the web page. */
export function clickUrl(advertiserId, editionDate, source) {
  const params = new URLSearchParams({ id: String(advertiserId), source })
  if (editionDate) params.set('date', editionDate)
  // The short path, not /api/click: this URL is printed in emails and
  // WhatsApp messages, where every character is visible.
  return `${SITE}/click?${params.toString()}`
}
