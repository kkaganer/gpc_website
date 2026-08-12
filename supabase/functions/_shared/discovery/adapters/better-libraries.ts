// Better / GLL library timetables — Greenwich and Bromley library services.
//
// This is the highest-QUALITY under-5 content in the platform: Rhymetime,
// Bounce & Rhyme, Storytime and Baby Bounce are free, weekly, walkable and
// the actual backbone of an under-5 parent's week. Nothing in the leisure or
// theatre feeds substitutes for it.
//
// The endpoint returns a full HTML page (not a fragment) of repeating
// `.activities-item-card` blocks. Each card is unusually complete:
//
//   <div class="activities-item-card__content--top"> Petts Wood Library
//       <span>No booking needed</span> </div>
//   <h5>Toys and Stories</h5>
//   <div class="trix-content"> ...description... </div>
//   • Thursday 13 Aug 11:00 AM - 12:00 PM
//   • Frankswood Avenue, Petts Wood, Greater London, BR5 1BP
//   • Children's Activities
//   • Children
//
// i.e. venue, booking mode, title, description, datetime, FULL POSTCODE,
// category and audience — richer than most JSON feeds in this project.
//
// Cards are DATED instances, so `schedule` stays empty and occurrences are
// ingested directly.

import type { Adapter, AdapterContext, AdapterResult, ActivityDraft } from '../types.ts'
import { passesPrefilter, passesArea, resolvePostcodes, normalisePostcode, type AreaPolicy } from '../geo.ts'
import { inferAge, isUnderFive } from '../age.ts'
import { inferTermTime } from '../term-time.ts'

const TIMEOUT_MS = 20_000

/** Panel IDs are per library service/branch; discovered from better.org.uk. */
export const DEFAULT_PANELS = [11000, 10728, 10796, 10864, 11204, 11408, 13695]

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}

function decode(html: string): string {
  return html
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripTags(html: string): string {
  return decode(html.replace(/<[^>]+>/g, ' '))
}

/**
 * "Thursday 13 Aug 11:00 AM - 12:00 PM" -> ISO start/end.
 *
 * The source omits the YEAR. Assuming the current year would silently place
 * every January session eleven months in the past when run in December, so a
 * month more than one behind "now" is rolled forward to next year.
 */
function parseCardDateTime(text: string, now: Date): { start: string; end: string | null } | null {
  const m = text.match(
    /\b(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{1,2}):(\d{2})\s*(AM|PM)(?:\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM))?/i,
  )
  if (!m) return null

  const [, dayStr, monStr, sh, sm, sap, eh, em, eap] = m
  const month = MONTHS[monStr.toLowerCase().slice(0, 3)]
  if (!month) return null

  let year = now.getUTCFullYear()
  if (month < now.getUTCMonth() + 1 - 1) year += 1

  const to24 = (h: string, ap: string) => {
    let hour = +h % 12
    if (ap.toUpperCase() === 'PM') hour += 12
    return String(hour).padStart(2, '0')
  }

  const date = `${year}-${String(month).padStart(2, '0')}-${dayStr.padStart(2, '0')}`
  const start = `${date}T${to24(sh, sap)}:${sm}:00`
  const end = eh && em && eap ? `${date}T${to24(eh, eap)}:${em}:00` : null
  return { start, end }
}

const UK_POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/i

export const betterLibrariesAdapter: Adapter = async (
  ctx: AdapterContext,
): Promise<AdapterResult> => {
  const panels: number[] = Array.isArray(ctx.config.panels) && (ctx.config.panels as number[]).length
    ? ctx.config.panels as number[]
    : DEFAULT_PANELS

  const template = String(
    ctx.config.endpoint ??
    'https://www.better.org.uk/library/dynamic_pages/panels/{panelId}/timetables/items',
  )

  // Panels 10728-11408 are single-branch, but 13695 is a national aggregate
  // spanning 45 outcodes (incl. Lincoln), so a filter is still required.
  const policy = (ctx.config.area_policy as AreaPolicy) ?? 'london'

  const stats: Record<string, number> = {
    panels: 0, cards: 0, no_postcode: 0, no_datetime: 0,
    out_of_area: 0, not_under5: 0,
  }

  interface Parsed {
    uid: string
    title: string
    description: string | null
    venue: string | null
    booking: string | null
    postcode: string
    address: string | null
    start: string
    end: string | null
    tail: string
  }
  const parsed: Parsed[] = []
  const now = new Date()

  for (const panelId of panels) {
    if (Date.now() > ctx.deadline) break

    const url = template.replace('{panelId}', String(panelId))
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    let html = ''
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'GPC-Discovery/1.0 (+https://greenwichparents.co.uk; community events index)',
        },
      })
      if (!res.ok) continue
      html = await res.text()
    } catch {
      continue
    } finally {
      clearTimeout(timer)
    }
    stats.panels++

    // Split on the card boundary rather than trying to balance nested divs.
    const chunks = html.split('<div class="activities-item-card">').slice(1)
    for (const chunk of chunks) {
      stats.cards++

      const titleMatch = chunk.match(/<h5>([\s\S]*?)<\/h5>/)
      const title = titleMatch ? stripTags(titleMatch[1]) : ''
      if (!title) continue

      const topMatch = chunk.match(/activities-item-card__content--top">([\s\S]*?)<\/div>/)
      const topRaw = topMatch ? topMatch[1] : ''
      const bookingMatch = topRaw.match(/<span>([\s\S]*?)<\/span>/)
      const booking = bookingMatch ? stripTags(bookingMatch[1]) : null
      const venue = stripTags(topRaw.replace(/<span>[\s\S]*?<\/span>/, '')) || null

      const descMatch = chunk.match(/trix-content">([\s\S]*?)<\/div>\s*<\/div>/)
      const description = descMatch ? stripTags(descMatch[1]) : null

      // Everything after </h5> holds the bullet-separated metadata line.
      const tail = stripTags(chunk.slice(chunk.indexOf('</h5>') + 5))

      const pcMatch = tail.match(UK_POSTCODE)
      if (!pcMatch) { stats.no_postcode++; continue }
      const postcode = normalisePostcode(`${pcMatch[1]}${pcMatch[2]}`)
      if (!postcode) { stats.no_postcode++; continue }

      const when = parseCardDateTime(tail, now)
      if (!when) { stats.no_datetime++; continue }

      parsed.push({
        uid: `${panelId}:${title}:${when.start}:${postcode}`,
        title,
        description,
        venue,
        booking,
        postcode,
        address: tail.split('•').map((s) => s.trim()).find((s) => UK_POSTCODE.test(s)) ?? null,
        start: when.start,
        end: when.end,
        tail,
      })
    }
  }

  const inArea = parsed.filter((p) => {
    if (!passesPrefilter(p.postcode, policy)) { stats.out_of_area++; return false }
    return true
  })

  const resolved = await resolvePostcodes(inArea.map((p) => p.postcode))
  const activities: ActivityDraft[] = []

  for (const p of inArea) {
    const place = resolved.get(p.postcode)
    if (!place || !passesArea(place, policy)) { stats.out_of_area++; continue }

    // The card's trailing bullets carry audience ("Children", "Under 5s") —
    // include the whole tail so audience labels feed the age inference.
    const age = inferAge(p.title, p.description, p.tail)
    if (!isUnderFive(age)) { stats.not_under5++; continue }

    activities.push({
      source_uid: p.uid,
      title: p.title,
      description: p.description,
      organiser: p.venue,
      category: 'Family',

      venue_name: p.venue,
      address: p.address,
      postcode: place.postcode,
      lat: place.lat,
      lng: place.lng,
      borough: place.borough,

      // Dated cards, not a weekly rule.
      schedule: [],
      starts_on: null,
      ends_on: null,
      // Only set when the card SAYS so — "term time only" -> true, "school
      // holiday fun" -> false, silence -> null (never suppressed).
      term_time_only: inferTermTime(p.title, p.description, p.tail),

      age_min_months: age.min,
      age_max_months: age.max,

      is_free: true,
      price_type: 'free',
      price_amount: 0,
      price_text: 'Free',

      booking_mode: /no booking/i.test(p.booking ?? '') ? 'drop_in' : 'book_ahead',
      booking_url: null,
      access: {},

      source_url: null,
      deep_link: null,
      confidence: age.confidence,

      occurrences: [{ starts_at: p.start, ends_at: p.end, status: 'scheduled' }],
    })
  }

  return { activities, cursor: null, stats }
}
