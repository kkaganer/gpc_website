// Lewisham Libraries — Solus "Library Magic" RSS.
//
// Directly relevant to the SE8 / SE13 priority: this covers Deptford Lounge,
// Lewisham, Catford, New Cross, Blackheath and Forest Hill libraries, and it is
// the ONLY machine-readable route into Lewisham's library programme — Lewisham
// Council itself publishes no dated calendar at all.
//
// ⚠️ CLOUDFLARE: on this host `/rss` is exempt but the HTML pages and the .ics
// export are NOT. Never add an HTML or iCal fallback here — it will be blocked
// and will look like an intermittent parser bug rather than a wall.
//
// The feed carries no structured date field. Dates live inside the HTML-escaped
// <description> as:
//     <strong>Date/Time:</strong> Mon, 3 Aug 2026, 9:00am - Fri, 4 Sep 2026, 5:00pm
// and the venue/postcode are not exposed at all, so location comes from a branch
// lookup keyed on the venue name in the title/description.

import type { Adapter, AdapterContext, AdapterResult, ActivityDraft } from '../types.ts'
import { inferAge, isUnderFive } from '../age.ts'
import { inferTermTime } from '../term-time.ts'
import { normalisePostcode, resolvePostcodes } from '../geo.ts'

const TIMEOUT_MS = 25_000

/**
 * Branch postcodes. The feed names the branch in prose but never gives an
 * address, so this map is the only route to a location — and location is a hard
 * publication gate (a listing a parent can't find is not a listing).
 */
export const LEWISHAM_BRANCHES: Array<{ match: RegExp; name: string; postcode: string }> = [
  { match: /deptford lounge|deptford/i,        name: 'Deptford Lounge',           postcode: 'SE8 4RJ' },
  // SE13 6LG (the address published for Lewisham Library) is RETIRED and 404s on
  // postcodes.io — it would have produced a listing with no coordinates, invisible
  // on the map. SE13 6JG is the nearest live postcode, 38m away.
  { match: /lewisham library/i,                name: 'Lewisham Library',          postcode: 'SE13 6JG' },
  { match: /catford/i,                         name: 'Catford Library',           postcode: 'SE6 4RU' },
  { match: /new cross|new x/i,                 name: 'New Cross Learning',        postcode: 'SE14 6AQ' },
  { match: /blackheath/i,                      name: 'Blackheath Village Library', postcode: 'SE3 9LA' },
  { match: /forest hill/i,                     name: 'Forest Hill Library',       postcode: 'SE23 3HZ' },
  { match: /sydenham/i,                        name: 'Sydenham Library',          postcode: 'SE26 5SE' },
  { match: /torridon/i,                        name: 'Torridon Library',          postcode: 'SE6 1RQ' },
  { match: /downham/i,                         name: 'Downham Library',           postcode: 'BR1 5LE' },
  { match: /grove park/i,                      name: 'Grove Park Library',        postcode: 'SE12 0PY' },
  { match: /manor house/i,                     name: 'Manor House Library',       postcode: 'SE13 5QY' },
  { match: /pepys/i,                           name: 'Pepys Resource Centre',     postcode: 'SE8 3EX' },
  { match: /crofton park/i,                    name: 'Crofton Park Library',      postcode: 'SE4 2AG' },
  { match: /wavelengths|deptford park/i,       name: 'Wavelengths Library',       postcode: 'SE8 3PQ' },
  { match: /bell green/i,                      name: 'Bell Green Library',        postcode: 'SE26 4PU' },
]

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}

function unescapeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&rsquo;/g, '’').replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

function stripTags(s: string): string {
  return unescapeXml(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function tag(xml: string, name: string): string | null {
  const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))
  if (!m) return null
  return unescapeXml(m[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '')).trim()
}

/** "Mon, 3 Aug 2026, 9:00am" -> "2026-08-03T09:00:00" */
function parseDateTime(part: string): string | null {
  const m = part.match(/(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})(?:,\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm))?/i)
  if (!m) return null
  const month = MONTHS[m[2].toLowerCase().slice(0, 3)]
  if (!month) return null

  let hour = m[4] ? +m[4] % 12 : 0
  if (m[6]?.toLowerCase() === 'pm') hour += 12
  const minute = m[5] ?? '00'

  return `${m[3]}-${String(month).padStart(2, '0')}-${m[1].padStart(2, '0')}` +
         `T${String(hour).padStart(2, '0')}:${minute}:00`
}

export const lewishamLibrariesAdapter: Adapter = async (
  ctx: AdapterContext,
): Promise<AdapterResult> => {
  const url = String(ctx.config.url ?? 'https://lewisham.events.mylibrary.digital/rss')

  const stats: Record<string, number> = {
    items: 0, no_datetime: 0, no_branch: 0, not_under5: 0, multi_day_skipped: 0,
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let xml = ''
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'User-Agent': 'GPC-Discovery/1.0 (+https://greenwichparents.co.uk; community events index)',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    xml = await res.text()
  } finally {
    clearTimeout(timer)
  }

  const items = xml.split('<item>').slice(1).map((chunk) => chunk.split('</item>')[0])
  const activities: ActivityDraft[] = []

  // Resolve branch coordinates once. The map filters by DISTANCE at display
  // time, so an activity with no lat/lng is invisible regardless of how good
  // its other data is — geocoding here is what makes these listings usable.
  const branchPlaces = await resolvePostcodes(LEWISHAM_BRANCHES.map((b) => b.postcode))

  for (const item of items) {
    stats.items++

    const title = tag(item, 'title')
    const link = tag(item, 'link')
    const descRaw = tag(item, 'description') ?? ''
    if (!title) continue

    const description = stripTags(descRaw)

    // "Date/Time: Mon, 3 Aug 2026, 9:00am - Fri, 4 Sep 2026, 5:00pm"
    const dtMatch = description.match(/Date\/Time:\s*([^|]+?)(?:\s{2,}|$|Location:)/i)
    const dtText = dtMatch ? dtMatch[1] : description.slice(0, 120)
    const [startPart, endPart] = dtText.split(/\s+-\s+/)

    const startsAt = parseDateTime(startPart ?? '')
    if (!startsAt) { stats.no_datetime++; continue }
    const endsAt = endPart ? parseDateTime(endPart) : null

    // A range spanning many days is an exhibition/display, not a session a
    // parent turns up to at a time. Keep the start only.
    if (endsAt && endsAt.slice(0, 10) !== startsAt.slice(0, 10)) stats.multi_day_skipped++

    const haystack = `${title} ${description}`
    const branch = LEWISHAM_BRANCHES.find((b) => b.match.test(haystack))

    const age = inferAge(title, description)
    if (!isUnderFive(age)) { stats.not_under5++; continue }

    // ~3 in 4 under-5 items name no branch anywhere in the feed text, and the
    // event page that would resolve it is behind Cloudflare on this host.
    // CAPTURE them with a null postcode rather than discarding: an unlocatable
    // listing fails the publication gate anyway, but silently dropping it loses
    // real SE8/SE13 content that an admin could place in seconds.
    if (!branch) stats.no_branch++

    activities.push({
      source_uid: link ?? `${title}:${startsAt}`,
      title,
      description: description.slice(0, 800),
      organiser: 'Lewisham Libraries',
      category: 'Family',

      venue_name: branch?.name ?? null,
      address: null,
      postcode: branch ? normalisePostcode(branch.postcode) : null,
      lat: branch ? branchPlaces.get(normalisePostcode(branch.postcode) ?? '')?.lat ?? null : null,
      lng: branch ? branchPlaces.get(normalisePostcode(branch.postcode) ?? '')?.lng ?? null : null,
      borough: branch
        ? branchPlaces.get(normalisePostcode(branch.postcode) ?? '')?.borough ?? 'Lewisham'
        : 'Lewisham',

      schedule: [],
      starts_on: null,
      ends_on: null,
      term_time_only: inferTermTime(title, description),

      age_min_months: age.min,
      age_max_months: age.max,

      is_free: true,
      price_type: 'free',
      price_amount: 0,
      price_text: 'Free',

      booking_mode: 'drop_in',
      booking_url: link,
      access: {},

      source_url: link,
      deep_link: link,
      // Halve confidence when the venue is unresolved — it signals to the
      // review queue that this one needs a human to place it.
      confidence: branch ? age.confidence : age.confidence * 0.5,

      occurrences: [{
        starts_at: startsAt,
        ends_at: endsAt && endsAt.slice(0, 10) === startsAt.slice(0, 10) ? endsAt : null,
        status: 'scheduled',
      }],
    })
  }

  return { activities, cursor: null, stats }
}
