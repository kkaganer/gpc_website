// Spektrix ticketing adapter — one adapter, seven venues.
//
// Spektrix exposes a public, unauthenticated JSON API. Two endpoints, joined on
// event id:
//   /api/v3/events                          -> metadata, incl. an age attribute
//   /api/v3/instances?startFrom=&startTo=    -> dated performances
//
// Unlike OpenActive these are ONE-OFF dated performances, not weekly rules, so
// `schedule` stays empty and occurrences are ingested directly.
//
// TWO THINGS THIS ADAPTER HAS TO WORK AROUND:
//
// 1. The age attribute has a DIFFERENT NAME AT EVERY VENUE — attribute_AgeGuidance
//    (Albany), attribute_AgeRecommendation (Greenwich), attribute_AgeGuide and
//    attribute_AgeCategory (Unicorn), attribute_AgeRange (Polka),
//    attribute_AgeGuidanceAndRestrictions (Woolwich Works), attribute_AgeNotes
//    (Little Angel). Rather than maintain a brittle per-client map we scan every
//    key matching /age/i. Blackheath Halls populates none at all.
//
// 2. There is NO postcode in the payload. Venue location comes from the config
//    below, which is why each client carries its own.
//
// LEGAL NOTE: of every source in this platform, Spektrix is the most exposed —
// database right is strongest over data that is *obtained*, and a ticketing
// platform aggregates. Prefer venue-origin data where both exist, and keep
// deep links pointing at the venue's own site.

import type { Adapter, AdapterContext, AdapterResult, ActivityDraft, OccurrenceDraft } from '../types.ts'
import { inferAge, isUnderFive } from '../age.ts'
import { normalisePostcode, resolvePostcodes } from '../geo.ts'

export interface SpektrixVenue {
  client: string
  venue_name: string
  postcode: string
  borough: string
  /** Venue's own site — deep links should point here, not at the ticketing host. */
  site?: string
  /**
   * Venue whose ENTIRE programme is for young children.
   *
   * Little Angel and Unicorn are children's theatres that leave their age
   * attributes empty on every current show (measured: 22 and 3 live shows, all
   * blank). Applying the normal "no age data => reject" rule scored both at
   * zero, which is plainly wrong. For these venues an absent age is treated as
   * plausibly-under-5 at low confidence so the listing is captured for review
   * rather than silently dropped.
   */
  child_focused?: boolean
}

/**
 * Venue registry. Postcodes are config, not API data.
 *
 * Note which of these actually fall in SE8 / SE10 / SE13: only The Albany (SE8)
 * and Greenwich Theatre (SE10). Polka is in Wimbledon (SW19) and Little Angel in
 * Islington (N1) — both are strong under-5 programmers but neither is in SE London.
 */
export const SPEKTRIX_VENUES: SpektrixVenue[] = [
  { client: 'thealbany',          venue_name: 'The Albany',            postcode: 'SE8 4AG',  borough: 'Lewisham',      site: 'https://www.thealbany.org.uk' },
  { client: 'greenwichtheatre',   venue_name: 'Greenwich Theatre',     postcode: 'SE10 8ES', borough: 'Greenwich',     site: 'https://greenwichtheatre.org.uk' },
  { client: 'woolwichworks',      venue_name: 'Woolwich Works',        postcode: 'SE18 6HD', borough: 'Greenwich',     site: 'https://www.woolwich.works' },
  { client: 'blackheathhalls',    venue_name: 'Blackheath Halls',      postcode: 'SE3 9RQ',  borough: 'Greenwich',     site: 'https://www.blackheathhalls.com' },
  { client: 'unicorntheatre',     venue_name: 'Unicorn Theatre',       postcode: 'SE1 2HZ',  borough: 'Southwark',     site: 'https://www.unicorntheatre.com', child_focused: true },
  { client: 'polka',              venue_name: 'Polka Theatre',         postcode: 'SW19 1SB', borough: 'Merton',        site: 'https://polkatheatre.com', child_focused: true },
  { client: 'littleangeltheatre', venue_name: 'Little Angel Theatre',  postcode: 'N1 2DN',   borough: 'Islington',     site: 'https://littleangeltheatre.com', child_focused: true },
]

const HORIZON_DAYS = 56
const TIMEOUT_MS = 20_000

async function getJson(url: string): Promise<any | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
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

/** Collect every age-ish attribute value; field names vary per venue. */
function ageText(event: Record<string, any>): string {
  const parts: string[] = []
  for (const [key, value] of Object.entries(event)) {
    if (!/age/i.test(key)) continue
    if (/image|thumbnail/i.test(key)) continue
    if (typeof value === 'string' && value.trim()) parts.push(value)
  }
  return parts.join(' ; ')
}

/** Polka flags school Key Stages explicitly — a reliable NOT-under-5 signal. */
function isKeyStageOnly(event: Record<string, any>): boolean {
  const ks = ['attribute_KeyStage1', 'attribute_KeyStage2', 'attribute_KeyStage3AndUp']
    .some((k) => event[k] === true)
  const ageRange = String(event.attribute_AgeRange ?? '')
  return ks && !/0|1|2|3|4|all/i.test(ageRange)
}

function accessFlags(instances: Record<string, any>[]): Record<string, boolean> {
  const relaxed = instances.some((i) =>
    i.attribute_Relaxed === true || i.attribute_RelaxedPerformance === true)
  return relaxed ? { quiet_low_sensory: true, send_friendly: true } : {}
}

export const spektrixAdapter: Adapter = async (ctx: AdapterContext): Promise<AdapterResult> => {
  const clients: string[] = Array.isArray(ctx.config.clients)
    ? ctx.config.clients as string[]
    : SPEKTRIX_VENUES.map((v) => v.client)

  const today = new Date()
  const from = today.toISOString().slice(0, 10)
  const until = new Date(today.getTime() + HORIZON_DAYS * 86_400_000).toISOString().slice(0, 10)

  // Venue coordinates come from their configured postcodes, resolved once.
  // No geo FILTER is applied here: these seven venues are an explicit curated
  // list, so Polka (SW19) and Little Angel (N1) are ingested deliberately and
  // the map filters them out by distance at display time.
  const venuePlaces = await resolvePostcodes(
    clients.map((c) => SPEKTRIX_VENUES.find((v) => v.client === c)?.postcode),
  )

  const activities: ActivityDraft[] = []
  const stats: Record<string, number> = {
    venues: 0, events: 0, instances: 0, cancelled: 0, no_age: 0, not_under5: 0, no_instances: 0,
  }

  for (const client of clients) {
    if (Date.now() > ctx.deadline) break
    const venue = SPEKTRIX_VENUES.find((v) => v.client === client)
    if (!venue) continue

    const base = `https://system.spektrix.com/${client}/api/v3`
    const events = await getJson(`${base}/events`)
    if (!Array.isArray(events)) continue
    const instances = await getJson(`${base}/instances?startFrom=${from}&startTo=${until}`)
    if (!Array.isArray(instances)) continue

    stats.venues++
    stats.events += events.length
    stats.instances += instances.length

    // Group performances by their parent event.
    const byEvent = new Map<string, Record<string, any>[]>()
    for (const inst of instances) {
      const eventId = inst?.event?.id
      if (!eventId) continue
      if (inst?.cancelled === true) { stats.cancelled++; continue }
      const list = byEvent.get(eventId) ?? []
      list.push(inst)
      byEvent.set(eventId, list)
    }

    for (const event of events) {
      const perfs = byEvent.get(event?.id)
      if (!perfs?.length) { stats.no_instances++; continue }

      if (isKeyStageOnly(event)) { stats.not_under5++; continue }

      const ages = ageText(event)
      let age = inferAge(ages, event?.name, event?.description)

      if (!ages.trim()) {
        stats.no_age++
        // See SpektrixVenue.child_focused: a children's theatre with blank age
        // fields is a data gap at source, not evidence the show is for adults.
        if (!venue.child_focused) continue
        age = { min: 0, max: 60, confidence: 0.3 }
      } else if (!isUnderFive(age)) {
        stats.not_under5++
        continue
      }

      const occurrences: OccurrenceDraft[] = perfs
        .filter((p) => typeof p.start === 'string')
        .map((p) => ({
          starts_at: p.startUtc ? `${p.startUtc}Z` : p.start,
          ends_at: null,
          status: 'scheduled' as const,
          source_uid: String(p.id ?? ''),
        }))
      if (!occurrences.length) continue

      const free = event?.attribute_FreeEvent === true

      activities.push({
        source_uid: `${client}:${event.id}`,
        title: String(event.name ?? '').trim() || '(untitled)',
        description: typeof event.description === 'string' ? event.description : null,
        organiser: venue.venue_name,
        category: 'Arts',

        venue_name: venue.venue_name,
        address: null,
        postcode: normalisePostcode(venue.postcode),
        lat: venuePlaces.get(normalisePostcode(venue.postcode) ?? '')?.lat ?? null,
        lng: venuePlaces.get(normalisePostcode(venue.postcode) ?? '')?.lng ?? null,
        borough: venue.borough,

        // Dated performances, not a weekly rule.
        schedule: [],
        starts_on: null,
        ends_on: null,
        term_time_only: false,

        age_min_months: age.min,
        age_max_months: age.max,

        is_free: free ? true : null,
        price_type: free ? 'free' : null,
        price_amount: free ? 0 : null,
        price_text: free ? 'Free' : null,

        booking_mode: 'book_ahead',
        booking_url: venue.site ?? null,
        access: accessFlags(perfs),

        source_url: `${base}/events/${event.id}`,
        deep_link: venue.site ?? null,
        confidence: age.confidence,

        occurrences,
      })
    }
  }

  return { activities, cursor: null, stats }
}
