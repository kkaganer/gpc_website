// Tower Hamlets Best Start Family Hubs.
//
// The cleanest source in the platform. A POST with a date window returns ~550
// dated sessions, and — uniquely — the source STATES the audience rather than
// leaving it to be inferred:
//
//   "EventCategory": ["Best Start in Life (between 0 and 5 years old)"]
//
// 406 of 549 records carried that tag when measured. Where a source declares
// under-5 explicitly we trust it over our own text inference, which is why this
// adapter sets a high confidence and does not fall back to keyword guessing.
//
// Records are already geocoded (VenueLatitude/VenueLongitude) but carry no
// postcode, so the borough is taken from config rather than a lookup.
//
// Family-hub content is the PUREST under-5 tier in the whole study: stay-and-play,
// weigh-in clinics, infant feeding drop-ins. Nothing needs filtering out.

import type { Adapter, AdapterContext, AdapterResult, ActivityDraft } from '../types.ts'
import { inferAge, isUnderFive } from '../age.ts'

const TIMEOUT_MS = 30_000
const HORIZON_DAYS = 56

/** The source's own under-5 declaration. */
const UNDER5_TAG = /best start in life/i
const FAMILY_TAG = /for (?:families|children)/i
const ADULT_ONLY_TAG = /^for adults$/i

/** "10:00 - 12:00" -> ["10:00", "12:00"] */
function parseTimeRange(value: unknown): [string, string | null] | null {
  if (typeof value !== 'string') return null
  const m = value.match(/(\d{1,2}):(\d{2})\s*(?:-|–|to)?\s*(?:(\d{1,2}):(\d{2}))?/)
  if (!m) return null
  const start = `${m[1].padStart(2, '0')}:${m[2]}`
  const end = m[3] && m[4] ? `${m[3].padStart(2, '0')}:${m[4]}` : null
  return [start, end]
}

function categories(row: Record<string, any>): string[] {
  const raw = row.EventCategory
  if (Array.isArray(raw)) return raw.map(String)
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map(String)
    } catch { /* fall through */ }
    return [raw]
  }
  return []
}

export const thFamilyHubsAdapter: Adapter = async (
  ctx: AdapterContext,
): Promise<AdapterResult> => {
  const url = String(ctx.config.url ?? 'https://www.thfamilyhubs.co.uk/api/GetEventSchedules')
  const borough = String(ctx.config.borough ?? 'Tower Hamlets')

  const today = new Date()
  const startDate = today.toISOString().slice(0, 10)
  const endDate = new Date(today.getTime() + HORIZON_DAYS * 86_400_000).toISOString().slice(0, 10)

  const stats: Record<string, number> = {
    fetched: 0, distinct_events: 0, adult_only: 0, not_under5: 0, no_date: 0,
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let rows: Record<string, any>[] = []
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'GPC-Discovery/1.0 (+https://greenwichparents.co.uk; community events index)',
      },
      body: JSON.stringify({ startDate, endDate }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const body = await res.json()
    rows = Array.isArray(body) ? body : (body?.data ?? body?.result ?? [])
  } finally {
    clearTimeout(timer)
  }

  stats.fetched = rows.length
  const activities: ActivityDraft[] = []

  // GROUP BY EventId FIRST. This feed publishes one row per date-INSTANCE, not
  // per event: 791 rows collapse to just 60 distinct EventIds, and a single
  // "Sensory Room" carries 125 dated instances. Emitting one activity per row
  // makes them all share a source_uid, so the batch de-dupe keeps only the last
  // and silently discards every other date. Measured: 650 eligible rows became
  // 39 activities with one occurrence each.
  const byEvent = new Map<string, Record<string, any>[]>()
  for (const row of rows) {
    const key = String(row.EventId ?? row.RowKey ?? `${row.EventName}:${row.StartDate}`)
    const list = byEvent.get(key) ?? []
    list.push(row)
    byEvent.set(key, list)
  }
  stats.distinct_events = byEvent.size

  for (const [eventId, group] of byEvent) {
    // Metadata is identical across the group; dates are not.
    const row = group[0]
    const cats = categories(row)
    const declaredUnder5 = cats.some((c) => UNDER5_TAG.test(c))
    const familyTagged = cats.some((c) => FAMILY_TAG.test(c))

    if (!declaredUnder5 && cats.length && cats.every((c) => ADULT_ONLY_TAG.test(c.trim()))) {
      stats.adult_only++
      continue
    }

    const title = String(row.EventName ?? '').trim()
    if (!title) continue

    // Every dated instance in the group becomes an occurrence.
    const occurrences = []
    for (const inst of group) {
      const d = typeof inst.StartDate === 'string' ? inst.StartDate.slice(0, 10) : null
      if (!d) { stats.no_date++; continue }
      const t = parseTimeRange(inst.EventTime)
      occurrences.push({
        starts_at: t ? `${d}T${t[0]}:00` : `${d}T00:00:00`,
        ends_at: t?.[1] ? `${d}T${t[1]}:00` : null,
        status: 'scheduled' as const,
      })
    }
    if (!occurrences.length) continue

    // Trust the source's own declaration; only infer when it is silent.
    let age = declaredUnder5
      ? { min: 0, max: 60, confidence: 1 }
      : inferAge(title, row.EventDescription, row.EventSubtitle, cats.join(' '))

    if (!declaredUnder5 && !isUnderFive(age)) {
      if (!familyTagged) { stats.not_under5++; continue }
      // "For families" with no age detail — plausible but unconfirmed.
      age = { min: 0, max: 60, confidence: 0.4 }
    }

    const priceText = row.Price != null ? String(row.Price) : null
    const free = priceText === null || /^(?:0|free|£0(?:\.00)?)$/i.test(priceText.trim())

    activities.push({
      source_uid: eventId,
      title,
      description: typeof row.EventDescription === 'string' ? row.EventDescription : null,
      organiser: typeof row.OrganiserName === 'string' ? row.OrganiserName : null,
      category: 'Family',

      venue_name: typeof row.VenueName === 'string' ? row.VenueName : null,
      address: typeof row.VenueLocation === 'string' ? row.VenueLocation : null,
      postcode: null,
      lat: typeof row.VenueLatitude === 'number' ? row.VenueLatitude : Number(row.VenueLatitude) || null,
      lng: typeof row.VenueLongitude === 'number' ? row.VenueLongitude : Number(row.VenueLongitude) || null,
      borough,

      schedule: [],
      starts_on: null,
      ends_on: null,
      term_time_only: null,

      age_min_months: age.min,
      age_max_months: age.max,

      is_free: free,
      price_type: free ? 'free' : 'per_session',
      price_amount: null,
      price_text: free ? 'Free' : priceText,

      booking_mode: row.Bookable === true ? 'book_ahead' : 'drop_in',
      booking_url: typeof row.OrganiserWebsite === 'string' ? row.OrganiserWebsite : null,
      access: {},

      source_url: null,
      deep_link: typeof row.OrganiserWebsite === 'string' ? row.OrganiserWebsite : null,
      confidence: age.confidence,

      occurrences,
    })
  }

  return { activities, cursor: null, stats }
}
