import { createClient } from '@supabase/supabase-js'

// The newsletter's web home: the edition exactly as it was emailed.
//
// WhatsApp is delivery, the same as email is, but it had nothing to deliver --
// the message linked straight at /whats-on/{date}, which is the listings tool,
// so a WhatsApp reader never saw the edition an email subscriber sees. This
// route is the missing first step: newsletter, then the week, then everything.
//
// It serves the STORED content_html rather than re-rendering. "The same one
// they see in the email" is only true if it is the same bytes, and a second
// renderer for the web would be a second thing to keep in step with the first.
//
// Read with the service role, the way api/admin/* reads privileged tables:
// newsletter_drafts is authenticated-only by design (001) and stays that way.
// One column, one route, one date -- rather than a public view that would make
// the column queryable by anyone for any week.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const SITE = 'https://gpccommunity.co.uk'

// MIRROR: GENERIC in api/og/whats-on.js and the tags in index.html. Serverless
// functions cannot import from src/, so the shape is duplicated on purpose. If
// one changes, change the others.
const OG_IMAGE = `${SITE}/images/hero-banner.png`

export function isValidEditionDate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  // Rejects 2026-02-31 and friends, which Date happily rolls over.
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}

export function formatEditionDate(iso) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Everything the email carries that must not survive the trip to a browser.
 *
 * Two separate problems, both invisible until someone opens the page:
 *
 * The ESP merge tag. An email client has EmailOctopus substitute
 * `{{UnsubscribeURL}}` before the message is sent; nothing substitutes it here,
 * so the footer would offer an Unsubscribe link whose href is the literal
 * tag -- and offer it to a WhatsApp reader who never subscribed to anything.
 * The whole row goes, rather than the href alone.
 *
 * The click source. Every paid slot links through /click?...&source=email so
 * the weekly number in the rate card can be counted. Served here those clicks
 * are not email clicks, and left alone they would inflate the figure Tier 1 and
 * Tier 2 advertisers are quoted with traffic that came from WhatsApp. `web` is
 * the honest half of the existing two-value taxonomy (migration 031) and needs
 * no change to the CHECK constraint to say so.
 */
export function scrubForWeb(html) {
  if (typeof html !== 'string') return ''
  return (
    html
      // Any <div> holding a merge tag, whole — the unsubscribe row and the ESP
      // attribution link. Removing the tag alone would leave an <a href=""> with
      // its label intact: a dead link that still looks clickable.
      //
      // `<div\b[^>]*>` rather than `<div>`, because the attribution div carries a
      // style attribute and the bare form matched only the unsubscribe row.
      // Tempered on both sides of the tag so a match can never run past its own
      // closing tag and swallow the rest of the footer.
      .replace(
        /<div\b[^>]*>(?:(?!<\/div>)[\s\S])*?\{\{(?:(?!<\/div>)[\s\S])*?<\/div>\s*/gi,
        ''
      )
      // Any merge tag that survived the line above, so none is ever rendered as
      // literal braces to a reader.
      .replace(/\{\{[^}]*\}\}/g, '')
      // `&amp;` as well as `&`: every href in the stored HTML is escaped, so a
      // separator class of [?&] alone matches none of the real links -- the
      // character before `source` is a semicolon.
      .replace(/([?&]|&amp;)source=email\b/g, '$1source=web')
  )
}

/**
 * Give the email document a head a crawler can read.
 *
 * The stored HTML is built for inboxes: it has a <head>, but nothing in it
 * beyond the reset, because an email has no need of OG tags. Shared into a
 * WhatsApp group with no tags at all, the link previews as a bare URL.
 */
export function injectMeta(html, date) {
  const long = formatEditionDate(date)
  const title = `What's On in Greenwich — ${long}`
  const description =
    'This week for families in Greenwich, from Greenwich Parents & Carers.'
  const url = `${SITE}/newsletter/${date}`
  const tags = `<title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="canonical" href="${escapeHtml(url)}" />`

  if (typeof html !== 'string' || !html.includes('</head>')) return html
  return html.replace('</head>', `  ${tags}\n  </head>`)
}

function client() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

/**
 * The newest draft's HTML for a week, or null.
 *
 * Newest rather than first: a week regenerated three times has three rows, and
 * the reader must get the one the editor last touched.
 *
 * Not filtered on status. The editor saves every draft as 'draft' and 'sent' is
 * set by hand afterwards, so a status filter would blank the page during the
 * exact hours the link is being shared. Nothing in a draft is private that the
 * dated page does not already show publicly.
 */
async function fetchEdition(date) {
  const supabase = client()
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('newsletter_drafts')
      .select('content_html')
      .eq('week_of', date)
      .order('updated_at', { ascending: false })
      .limit(1)
    if (error) return null
    return data?.[0]?.content_html || null
  } catch {
    return null
  }
}

// Never a 500 and never a dead end, for the same reason api/click.js never
// fails closed: a parent who taps a link in a WhatsApp group must land
// somewhere useful even when our side is having a bad day. The listings are
// always there, so that is where everything else goes.
function redirectToListings(res, date) {
  const target = isValidEditionDate(date) ? `${SITE}/whats-on/${date}` : `${SITE}/whats-on`
  res.setHeader('Location', target)
  return res.status(302).end()
}

export default async function handler(req, res) {
  const date = String(req.query?.date || '')
  if (!isValidEditionDate(date)) return redirectToListings(res, date)

  const stored = await fetchEdition(date)
  if (!stored) return redirectToListings(res, date)

  const html = injectMeta(scrubForWeb(stored), date)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  // Short edge cache with a long stale window, same as the OG route: an edition
  // edited after the link went out should correct itself within minutes, and a
  // Friday evening's worth of taps must not each hit the database.
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400')
  return res.status(200).send(html)
}
