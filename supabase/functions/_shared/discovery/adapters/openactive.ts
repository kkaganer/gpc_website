// OpenActive RPDE adapter — Better/GLL, Southwark Council, Tower Hamlets Council.
//
// The single highest-yield free source: keyless JSON, CC-BY 4.0 (an explicit
// licence to store and redisplay WITH ATTRIBUTION), no quota, no registration.
//
// DESIGN NOTE — we read `session-series` only, not `scheduled-sessions`.
// A ScheduledSession is a thin record: {startDate, endDate, superEvent, capacity}.
// Everything that matters (name, location, postcode, age hints, price) lives on
// the SessionSeries, which also carries `eventSchedule` with byDay + startTime.
// That is enough to generate occurrences ourselves, so consuming the sessions
// feed would double the network cost to add only capacity and cancellations.
// Those are a later refinement, not a v1 requirement.
//
// RPDE is a CHANGE feed, not a snapshot: page 1 is the oldest changes (Southwark's
// is ~80% "Gym Session"), and the `next` cursor is persisted so subsequent runs
// resume rather than re-walking ~5,000 series.

import type { Adapter, AdapterContext, AdapterResult, ActivityDraft, ScheduleSlot } from '../types.ts'
import { passesPrefilter, passesArea, resolvePostcodes, normalisePostcode, type AreaPolicy } from '../geo.ts'
import { inferAge, isUnderFive } from '../age.ts'
import { inferTermTime } from '../term-time.ts'
import { parseIsoDuration } from '../occurrences.ts'

const MAX_PAGES = 25
const PAGE_TIMEOUT_MS = 20_000

const DAY_NAMES = new Set([
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
])

/** "https://schema.org/Tuesday" | "Tuesday" -> "tuesday" */
function parseDay(value: unknown): ScheduleSlot['by_day'] | null {
  if (typeof value !== 'string') return null
  const name = value.split('/').pop()?.toLowerCase() ?? ''
  return DAY_NAMES.has(name) ? (name as ScheduleSlot['by_day']) : null
}

/** OpenActive times arrive as "09:00" or occasionally "09:00:00". */
function normaliseTime(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const m = value.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  return `${m[1].padStart(2, '0')}:${m[2]}`
}

/**
 * Extract live weekly slots from `eventSchedule`.
 *
 * CRITICAL: `eventSchedule` is an ARCHIVE, not the current timetable. A single
 * Better/GLL series carries ~17 PartialSchedule entries each with its own
 * startDate/endDate, some expired years ago:
 *
 *   ('Friday', '15:00:00', '2022-04-01', '2022-05-29')   <- ended in 2022
 *   ('Friday', '10:00:00', '2023-03-17', null)           <- still running
 *
 * Two things follow, and both were real bugs caught by measuring yield:
 *   1. Entries whose endDate has passed MUST be dropped. Merging them publishes
 *      sessions that stopped running years ago.
 *   2. Slots must be deduped. Without it one series emitted hundreds of
 *      identical weekly slots (measured: 18 activities -> 10,146 "weekly" slots).
 */
function extractSchedule(data: Record<string, any>, today: string): {
  schedule: ScheduleSlot[]
  starts_on: string | null
  ends_on: string | null
} {
  const seen = new Set<string>()
  const schedule: ScheduleSlot[] = []
  let starts_on: string | null = null
  let ends_on: string | null = null
  let anyOpenEnded = false

  const entries = Array.isArray(data.eventSchedule) ? data.eventSchedule : []
  for (const entry of entries) {
    const start = normaliseTime(entry?.startTime)
    if (!start) continue

    // Drop expired schedule windows.
    const entryEnd = typeof entry?.endDate === 'string' ? entry.endDate.slice(0, 10) : null
    if (entryEnd && entryEnd < today) continue

    const durationMins = parseIsoDuration(entry?.duration ?? data?.duration)
    let end = normaliseTime(entry?.endTime)
    if (!end && durationMins) {
      const [h, m] = start.split(':').map(Number)
      const total = h * 60 + m + durationMins
      end = `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
    }

    const days = Array.isArray(entry?.byDay) ? entry.byDay : []
    for (const raw of days) {
      const day = parseDay(raw)
      if (!day) continue
      const key = `${day}|${start}|${end ?? ''}`
      if (seen.has(key)) continue
      seen.add(key)
      schedule.push({ by_day: day, start_time: start, end_time: end })
    }

    // Validity window is derived from LIVE entries only.
    if (typeof entry?.startDate === 'string') {
      const d = entry.startDate.slice(0, 10)
      if (!starts_on || d < starts_on) starts_on = d
    }
    if (entryEnd) {
      if (!ends_on || entryEnd > ends_on) ends_on = entryEnd
    } else {
      anyOpenEnded = true
    }
  }

  // An open-ended entry means the series has no known end; don't let a sibling
  // entry's endDate cut off generation early.
  return { schedule, starts_on, ends_on: anyOpenEnded ? null : ends_on }
}

function extractPrice(data: Record<string, any>): Pick<
  ActivityDraft, 'is_free' | 'price_type' | 'price_amount' | 'price_text'
> {
  const offers = Array.isArray(data.offers) ? data.offers : []
  const prices = offers
    .map((o: any) => (typeof o?.price === 'number' ? o.price : null))
    .filter((p: number | null): p is number => p !== null)

  if (!prices.length) return { is_free: null, price_type: null, price_amount: null, price_text: null }

  const min = Math.min(...prices)
  if (min === 0) {
    return { is_free: true, price_type: 'free', price_amount: 0, price_text: 'Free' }
  }
  return {
    is_free: false,
    price_type: 'per_session',
    price_amount: min,
    price_text: `£${min.toFixed(2).replace(/\.00$/, '')}`,
  }
}

async function fetchPage(url: string): Promise<Record<string, any> | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PAGE_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        // Declared, contactable UA — crawl etiquette, and it keeps us on the
        // right side of anyone reviewing their logs.
        'User-Agent': 'GPC-Discovery/1.0 (+https://greenwichparents.co.uk; community events index)',
      },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export const openactiveAdapter: Adapter = async (ctx: AdapterContext): Promise<AdapterResult> => {
  const seriesUrl = String(ctx.config.series ?? '')
  if (!seriesUrl) throw new Error('openactive adapter requires config.series')

  // Better/GLL is a NATIONAL feed, so this stays filtered — but at 'london'
  // rather than 'served', since the map filters by distance at display time.
  const policy = (ctx.config.area_policy as AreaPolicy) ?? 'london'

  const stats = {
    pages: 0,
    seen: 0,
    deleted: 0,
    expired_or_no_schedule: 0,
    no_postcode: 0,
    out_of_area_prefilter: 0,
    out_of_area_resolved: 0,
    not_under5: 0,
  }

  // --- walk the change feed -------------------------------------------------
  type Candidate = { uid: string; data: Record<string, any> }
  const candidates: Candidate[] = []

  let url: string | null = ctx.cursor || seriesUrl
  let lastUrl: string | null = null

  while (url && stats.pages < MAX_PAGES && Date.now() < ctx.deadline) {
    const page = await fetchPage(url)
    if (!page) break
    stats.pages++

    const items = Array.isArray(page.items) ? page.items : []
    if (!items.length) {
      // Exhausted: this `next` is the resume point for the following run.
      lastUrl = typeof page.next === 'string' ? page.next : url
      url = null
      break
    }

    for (const item of items) {
      stats.seen++
      if (item?.state === 'deleted') { stats.deleted++; continue }
      const data = item?.data
      if (!data || typeof data !== 'object') continue
      candidates.push({ uid: String(item.id ?? data['@id'] ?? ''), data })
    }

    const next = typeof page.next === 'string' ? page.next : null
    lastUrl = next ?? url
    if (!next || next === url) { url = null; break }
    url = next
  }

  // Bookwhen publishes `location.address` as a plain STRING rather than a
  // PostalAddress object, so reaching for `.postalCode` silently yields
  // undefined and every record is dropped as no_postcode. Pull a postcode out
  // of the string form too.
  const UK_PC = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i
  const postcodeOf = (data: Record<string, any>): string | null => {
    const addr = data?.location?.address
    if (addr && typeof addr === 'object' && addr.postalCode) return String(addr.postalCode)
    if (typeof addr === 'string') return addr.match(UK_PC)?.[0] ?? null
    const name = data?.location?.name
    if (typeof name === 'string') return name.match(UK_PC)?.[0] ?? null
    return null
  }

  // --- cheap prefilter before any network geocoding -------------------------
  const prefiltered: Candidate[] = []
  for (const c of candidates) {
    const postcode = postcodeOf(c.data)
    if (!postcode) { stats.no_postcode++; continue }
    if (!passesPrefilter(postcode, policy)) { stats.out_of_area_prefilter++; continue }
    prefiltered.push(c)
  }

  // --- authoritative borough + coordinates ---------------------------------
  const resolved = await resolvePostcodes(prefiltered.map((c) => postcodeOf(c.data)))

  const activities: ActivityDraft[] = []
  const today = new Date().toISOString().slice(0, 10)

  for (const { uid, data } of prefiltered) {
    const pc = normalisePostcode(postcodeOf(data))
    const place = pc ? resolved.get(pc) : undefined
    if (!place || !passesArea(place, policy)) { stats.out_of_area_resolved++; continue }

    const title = String(data.name ?? '').trim()
    if (!title) continue

    const age = inferAge(
      title,
      data.description,
      data.attendeeInstructions,
      Array.isArray(data.category) ? data.category.join(' ') : data.category,
    )
    if (!isUnderFive(age)) { stats.not_under5++; continue }

    const { schedule, starts_on, ends_on } = extractSchedule(data, today)
    if (!schedule.length) { stats.expired_or_no_schedule++; continue }

    const location = data.location ?? {}
    const address = location.address ?? {}

    activities.push({
      source_uid: uid || String(data['@id']),
      title,
      description: typeof data.description === 'string' ? data.description : null,
      organiser: typeof data.organizer?.name === 'string' ? data.organizer.name : null,
      category: Array.isArray(data.category) ? data.category[0] ?? null : data.category ?? null,

      venue_name: typeof location.name === 'string' ? location.name : null,
      address: typeof address === 'string'
        ? address
        : [address?.streetAddress, address?.addressLocality].filter(Boolean).join(', ') || null,
      postcode: place.postcode,
      // Prefer the feed's own coordinates; fall back to the postcode centroid.
      lat: typeof location.geo?.latitude === 'number' ? location.geo.latitude : place.lat,
      lng: typeof location.geo?.longitude === 'number' ? location.geo.longitude : place.lng,
      borough: place.borough,

      schedule,
      timezone: 'Europe/London',
      starts_on,
      ends_on,

      // Measured: 0 of 500 Southwark series mention term time, so this is
      // almost always null. Detect anyway in case a publisher starts saying it.
      term_time_only: inferTermTime(title, data.description, data.attendeeInstructions),

      age_min_months: age.min,
      age_max_months: age.max,

      ...extractPrice(data),

      booking_mode: 'book_ahead',
      booking_url: typeof location.url === 'string' ? location.url : null,
      access: {},

      source_url: typeof data['@id'] === 'string' ? data['@id'] : null,
      deep_link: typeof location.url === 'string' ? location.url : null,
      confidence: age.confidence,
    })
  }

  return { activities, cursor: lastUrl, stats }
}
