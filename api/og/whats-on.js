import { createClient } from '@supabase/supabase-js'

// Vercel rewrites /whats-on/:date here so a shared link previews with that
// edition's own title, description and image. Without this every link shares
// index.html's single hardcoded set, and WhatsApp — which caches previews hard —
// shows the same generic card for every week.

const SITE = 'https://gpccommunity.co.uk'

// Client-side twin of the tags in index.html. Serverless functions cannot import
// from src/, and index.html is not parsed here, so the fallback is duplicated on
// purpose. If one changes, change the other.
const GENERIC = {
  title: 'Greenwich Parents & Carers | Community for Local Families',
  description:
    'Greenwich Parents & Carers (GPC) - A community of 1,800+ local parents running events and activities for families in Greenwich, London.',
  image: `${SITE}/images/hero-banner.svg`,
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

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
 * Build the meta set for an edition.
 *
 * Never throws and never returns nothing: an unknown date still gets a valid
 * card, because a missing preview is worse than a generic one.
 */
export function buildMeta(date, eventCount) {
  if (!isValidEditionDate(date)) return { ...GENERIC, url: `${SITE}/whats-on` }

  const long = formatEditionDate(date)
  const count = Number.isInteger(eventCount) && eventCount > 0 ? eventCount : null
  return {
    title: `What's On in Greenwich — ${long}`,
    description: count
      ? `${count} things to do with the family in Greenwich this week, from Greenwich Parents & Carers.`
      : 'Things to do with the family in Greenwich this week, from Greenwich Parents & Carers.',
    image: `${SITE}/images/hero-banner.png`,
    url: `${SITE}/whats-on/${date}`,
  }
}

// The meta tags this route exists to serve.
function metaTags(meta) {
  const t = escapeHtml(meta.title)
  const d = escapeHtml(meta.description)
  return `<title>${t}</title>
    <meta name="description" content="${d}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(meta.url)}" />
    <meta property="og:image" content="${escapeHtml(meta.image)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="canonical" href="${escapeHtml(meta.url)}" />`
}

/**
 * Put this edition's meta into the real built document.
 *
 * The handler used to return a hand-written shell whose script tag pointed at
 * Vite's DEV entry under the source directory. The production build rewrites that
 * to a hashed `/assets/index-<hash>.js` and never emits the source path, so the
 * shell 404ed its own bundle. Crawlers were fine -- they only read the head --
 * but a human following a shared link got a blank page.
 *
 * So: take the built index.html and swap its head, rather than reinventing it.
 * The hash changes every build, which is exactly why nothing here may hardcode
 * the script path.
 *
 * Existing head tags this replaces are dropped; everything else in the document,
 * the script tag above all, is left exactly as the build wrote it.
 */
export function injectMeta(baseHtml, meta) {
  if (typeof baseHtml !== 'string' || !baseHtml.includes('</head>')) {
    return baseHtml
  }
  const stripped = baseHtml
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+name=["']description["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+property=["']og:[^"']*["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+name=["']twitter:[^"']*["'][^>]*>\s*/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, '')

  return stripped.replace('</head>', `  ${metaTags(meta)}\n  </head>`)
}

// Fetched from the deployment's own origin: the SPA catch-all rewrites unknown
// paths to index.html, but /index.html itself resolves to the built file.
const FALLBACK_SHELL = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body><div id="root"></div></body>
</html>`

async function fetchShell(req) {
  const host = req?.headers?.host
  if (!host) return FALLBACK_SHELL
  const proto = host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https'
  try {
    const res = await fetch(`${proto}://${host}/index.html`)
    if (!res.ok) return FALLBACK_SHELL
    const html = await res.text()
    return html.includes('</head>') ? html : FALLBACK_SHELL
  } catch {
    // A preview with correct tags and no app still beats a 500.
    return FALLBACK_SHELL
  }
}

async function countEvents(date) {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  try {
    const supabase = createClient(url, key)
    const { count, error } = await supabase
      .from('london_events')
      .select('id', { count: 'exact', head: true })
      .eq('approved', true)
      .lte('date', date)
      .gte('effective_end_date', date)
    return error ? null : count
  } catch {
    // A preview with no number still works. A 500 does not.
    return null
  }
}

export default async function handler(req, res) {
  const date = String(req.query?.date || '')
  const [count, shell] = await Promise.all([
    isValidEditionDate(date) ? countEvents(date) : Promise.resolve(null),
    fetchShell(req),
  ])
  const html = injectMeta(shell, buildMeta(date, count))

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=86400')
  return res.status(200).send(html)
}
