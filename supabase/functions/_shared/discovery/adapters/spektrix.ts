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
// THREE THINGS THIS ADAPTER HAS TO WORK AROUND:
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
// 3. HALF THE DROPS ARE BLANK FIELDS, NOT REJECTIONS. Measured across recent
//    runs this adapter dropped 258 events for a blank age attribute — exactly as
//    many as it dropped for stating an age that ruled them out. A blank field is
//    a gap in a venue's data entry, not a statement that a show is for adults,
//    so those events are no longer dropped unseen: they are held back and judged
//    in ONE batched call (age-judge.ts) after the venue loop. A judged-likely
//    event is INGESTED as pending for admin review, never published.
//
// LEGAL NOTE: of every source in this platform, Spektrix is the most exposed —
// database right is strongest over data that is *obtained*, and a ticketing
// platform aggregates. Prefer venue-origin data where both exist, and keep
// deep links pointing at the venue's own site.

import type { Adapter, AdapterContext, AdapterResult, ActivityDraft, OccurrenceDraft } from '../types.ts'
import { classifyUnderFive, hasExclusionMarker, inferAge, type AgeRange } from '../age.ts'
import { judgeUnderFive, type AgeJudgeItem } from '../age-judge.ts'
import { normalisePostcode, resolvePostcodes, type ResolvedPlace } from '../geo.ts'

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

/** Provenance of the age range written with a draft — `activities.age_basis` (023). */
type AgeBasis = 'stated' | 'inferred' | 'venue_default' | 'llm_judged'

/** A children's theatre with a blank age field. See SpektrixVenue.child_focused. */
const VENUE_DEFAULT_CONFIDENCE = 0.3

/**
 * Confidence for a range held on a model's word alone.
 *
 * Below the admin UI's `< 0.5` "low confidence" badge, so a judged listing is
 * flagged for a reviewer — and below VENUE_DEFAULT_CONFIDENCE, because a venue
 * whose ENTIRE programme is for young children is stronger evidence than a model
 * reading one blurb. This is the weakest thing the adapter emits and it should
 * sort last in a review queue ordered by confidence.
 */
const JUDGED_CONFIDENCE = 0.25

const apiBase = (client: string) => `https://system.spektrix.com/${client}/api/v3`

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

/**
 * 'stated' vs 'inferred' turns on whether the SOURCE published a number.
 *
 * Spektrix's age attributes are free text, so "the venue stated an age" is not
 * the field being populated — it is that field carrying a range inferAge could
 * actually read. inferAge scores every explicit numeric pattern at 0.75 or above
 * and every category-word reading ("baby", "toddler", "storytime") below it, so
 * requiring BOTH a digit in the age text and a numeric-strength confidence
 * separates "the venue said 18 months - 4 years" from "we decided a show called
 * Baby Rave is for babies". The second is our reading, and 023 calls it
 * 'inferred' for exactly that reason.
 */
function ageBasisFor(ages: string, age: AgeRange): AgeBasis {
  return /\d/.test(ages) && age.confidence >= 0.75 ? 'stated' : 'inferred'
}

/**
 * An event whose age is UNKNOWN — the venue populated no age attribute at all —
 * parked with everything needed to build its draft later. Held so the judge can
 * be asked about every venue's unknowns in ONE call after the loop.
 */
interface PendingEvent {
  client: string
  venue: SpektrixVenue
  event: Record<string, any>
  perfs: Record<string, any>[]
}

/**
 * Build the draft for one event, or null when it has no usable performance times
 * — the same drop the loop has always made.
 *
 * Extracted so the judge-kept items are built by exactly the same code as the
 * ordinary ones. Only the age range, its confidence and its basis differ between
 * the two paths; a second copy of this literal would drift.
 */
function buildDraft(
  pending: PendingEvent,
  age: { min: number | null; max: number | null },
  confidence: number,
  ageBasis: AgeBasis,
  places: Map<string, ResolvedPlace>,
): ActivityDraft | null {
  const { client, venue, event, perfs } = pending

  const occurrences: OccurrenceDraft[] = perfs
    .filter((p) => typeof p.start === 'string')
    .map((p) => ({
      starts_at: p.startUtc ? `${p.startUtc}Z` : p.start,
      ends_at: null,
      status: 'scheduled' as const,
      source_uid: String(p.id ?? ''),
    }))
  if (!occurrences.length) return null

  const free = event?.attribute_FreeEvent === true
  const postcode = normalisePostcode(venue.postcode)

  return {
    source_uid: `${client}:${event.id}`,
    title: String(event.name ?? '').trim() || '(untitled)',
    description: typeof event.description === 'string' ? event.description : null,
    organiser: venue.venue_name,
    category: 'Arts',

    venue_name: venue.venue_name,
    address: null,
    postcode,
    lat: places.get(postcode ?? '')?.lat ?? null,
    lng: places.get(postcode ?? '')?.lng ?? null,
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

    source_url: `${apiBase(client)}/events/${event.id}`,
    deep_link: venue.site ?? null,
    confidence,
    age_basis: ageBasis,

    occurrences,
  }
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
  /** Age-unknown events from EVERY venue, judged in one call after the loop. */
  const pending: PendingEvent[] = []
  const stats: Record<string, number> = {
    venues: 0, events: 0, instances: 0, cancelled: 0, no_age: 0, not_under5: 0, no_instances: 0,
    age_judged: 0, age_likely: 0,
  }

  for (const client of clients) {
    if (Date.now() > ctx.deadline) break
    const venue = SPEKTRIX_VENUES.find((v) => v.client === client)
    if (!venue) continue

    const base = apiBase(client)
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
      const age = inferAge(ages, event?.name, event?.description)
      const verdict = classifyUnderFive(age)

      if (!ages.trim()) {
        stats.no_age++

        // See SpektrixVenue.child_focused: a children's theatre with blank age
        // fields is a data gap at source, not evidence the show is for adults.
        if (venue.child_focused) {
          const draft = buildDraft(
            { client, venue, event, perfs },
            { min: 0, max: 60 },
            VENUE_DEFAULT_CONFIDENCE,
            'venue_default',
            venuePlaces,
          )
          if (draft) activities.push(draft)
          continue
        }

        // No age field, and nothing derivable from the title or description
        // either: a GAP, not a statement about who the show is for. Held for the
        // one batched judge call after the venue loop.
        //
        // Only 'unknown' is held, and only when the text did not rule itself
        // out. Both conditions are load-bearing and the second is not implied
        // by the first: inferAge returns NONE for a SENIOR or SCHOOL_AGE match
        // (age.ts:47-50), so "60+ screening" and "Key Stage 2 holiday club"
        // arrive here as 'unknown' rather than 'exclude'. Held on the verdict
        // alone, they would be sent to an LLM to re-decide something the source
        // stated plainly. hasExclusionMarker re-reads that same evidence.
        const ruledOut = hasExclusionMarker(ages, event?.name, event?.description)
        if (verdict === 'unknown' && !ruledOut) pending.push({ client, venue, event, perfs })
        else if (ruledOut) stats.not_under5++
        continue
      }

      // Identical to the old `!isUnderFive(age)`: 'admit' is the only pass.
      if (verdict !== 'admit') {
        stats.not_under5++
        continue
      }

      const draft = buildDraft(
        { client, venue, event, perfs },
        age,
        age.confidence,
        ageBasisFor(ages, age),
        venuePlaces,
      )
      if (draft) activities.push(draft)
    }
  }

  // --- the age judge ---------------------------------------------------------
  //
  // ONE call for every venue's unknowns, after the loop rather than inside it.
  // A judged-likely event is INGESTED, not published: it lands with the normal
  // `status = 'pending'` and RLS only exposes `status = 'published'`, so an admin
  // still approves it in Discovery. The cost of a wrong `likely` is a minute of
  // review time, never a wrong listing on the site.
  //
  // If the deadline has already passed the judge is skipped entirely and every
  // held event falls back to today's behaviour: dropped, already counted in
  // `no_age`. Same for a judge that fails, times out or returns nothing.
  if (pending.length && Date.now() < ctx.deadline) {
    stats.age_judged = pending.length

    const verdicts = await judgeUnderFive(
      pending.map((p): AgeJudgeItem => ({
        key: `${p.client}:${p.event.id}`,
        title: String(p.event?.name ?? '').trim(),
        description: typeof p.event?.description === 'string' ? p.event.description : null,
        venue: p.venue.venue_name,
      })),
      { deadline: ctx.deadline },
    )

    for (const p of pending) {
      const judged = verdicts.get(`${p.client}:${p.event.id}`)
      // No verdict is treated exactly like `likely: false` — drop and count, as
      // today. Absence is the judge's documented failure mode, not an error.
      if (!judged?.likely) continue

      // A model can contradict itself: `likely: true` beside a range starting at
      // seven years. The deterministic gate wins that argument. Null months are
      // not a contradiction — they are the judge declining to guess, and null is
      // what gets written.
      const judgedAge = { min: judged.min_months, max: judged.max_months, confidence: JUDGED_CONFIDENCE }
      if (classifyUnderFive(judgedAge) === 'exclude') continue

      const draft = buildDraft(p, judgedAge, JUDGED_CONFIDENCE, 'llm_judged', venuePlaces)
      if (!draft) continue

      stats.age_likely++
      activities.push(draft)
      // The verdict's reason has no column to live in, and an admin looking at a
      // judged row deserves to know which words it went on.
      console.log(`spektrix: age-judged likely — ${draft.title} (${judged.reason})`)
    }
  }

  return { activities, cursor: null, stats }
}
