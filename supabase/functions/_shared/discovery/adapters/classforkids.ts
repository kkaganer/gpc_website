// ClassForKids — the only source publishing AGE IN MONTHS.
//
// `classforkids.io/en-GB/classes/{OUTCODE}` with the header `RSC: 1` returns a
// React Server Component payload containing a `serverSideListings` JSON array.
// Each listing carries clubName, venueName, postcode, distancemiles and —
// uniquely — ageFrom/ageTo IN MONTHS:
//
//   { "clubName": "The Baby Cloud Greenwich", "ageFrom": 2, "ageTo": 13, ... }
//
// A 2-to-13-month baby class. No other source in this platform expresses age
// that precisely, and it is exactly the distinction the audience cares about.
//
// ⚠️ AND WHEN IT DOESN'T, IT SAYS NOTHING AT ALL.
// A club that left ageFrom/ageTo empty (or at the 0-0 unset marker) has told us
// nothing about who it teaches — that is a gap in a directory entry, not a claim
// that it is for older children. Those listings used to be dropped on the same
// branch as a positively-excluded one. They are now held back and judged in ONE
// batched call (age-judge.ts) after the loop, and a judged-likely club is
// INGESTED as pending for admin review, never published.
//
// ⚠️ THESE ARE DIRECTORY ENTRIES, NOT DATED EVENTS.
// The payload has no schedule and no dates — a listing says "this club runs
// classes for 2-13 month olds near you", not "there is a class on Tuesday at
// 10am". So activities from here have an EMPTY occurrences list and cannot be
// published to london_events (which requires a date). They are ingested for the
// directory/map value and publish_activity() rejects them explicitly rather
// than silently writing zero rows.
//
// ⚠️ SLUGS ARE BOOBY-TRAPPED. ClassForKids' own location slugs do not match UK
// geography — /blackheath resolves to Surrey, /deptford to Wiltshire,
// /charlton to West Sussex. Always query by OUTCODE and trust the `postcode`
// field on each listing, never the slug.

import type { Adapter, AdapterContext, AdapterResult, ActivityDraft } from '../types.ts'
import { judgeUnderFive, type AgeJudgeItem } from '../age-judge.ts'
// This adapter reads ClassForKids' structured age fields rather than inferring
// from prose, so it has its own ageRange/startsAboveFive and does not otherwise
// use age.ts. hasExclusionMarker is still worth borrowing: a club with blank age
// fields but "Juniors" or "Teens" in its name has ruled itself out in words, and
// should be dropped rather than sent to a judge.
import { hasExclusionMarker } from '../age.ts'
import {
  passesPrefilter,
  passesArea,
  resolvePostcodes,
  normalisePostcode,
  type AreaPolicy,
  type ResolvedPlace,
} from '../geo.ts'

const TIMEOUT_MS = 25_000

/** Provenance of the age range written with a draft — `activities.age_basis` (023). */
type AgeBasis = 'stated' | 'llm_judged'

/** Source-stated months: the strongest age data any adapter here writes. */
const STATED_CONFIDENCE = 0.9

/**
 * Confidence for a range held on a model's word alone. Below the admin UI's
 * `< 0.5` "low confidence" badge, so a judged club is flagged for a reviewer,
 * and far below the 0.9 a club that published its own months earns.
 */
const JUDGED_CONFIDENCE = 0.25

/** Outcodes to query. Each is a separate request. */
export const DEFAULT_OUTCODES = ['SE8', 'SE10', 'SE13', 'SE3', 'SE18', 'SE9', 'SE14', 'SE23']

interface Listing {
  clubName?: string
  venueName?: string
  postcode?: string
  bsurl?: string
  listingdescription?: string
  logoUrl?: string
  distancemiles?: number
  ageFrom?: number
  ageTo?: number
  type?: string
  classActivities?: unknown
}

/**
 * Pull `serverSideListings` out of the RSC payload by brace-matching, rather
 * than regex — the payload embeds arbitrary prose (class descriptions) that
 * routinely contains brackets and quotes.
 */
function extractListings(payload: string): Listing[] {
  const key = '"serverSideListings":'
  const out: Listing[] = []
  let from = 0

  while (true) {
    const at = payload.indexOf(key, from)
    if (at === -1) break
    const start = at + key.length
    if (payload[start] !== '[') { from = start; continue }

    let depth = 0
    let end = -1
    let inString = false
    let escaped = false
    for (let i = start; i < payload.length; i++) {
      const c = payload[i]
      if (escaped) { escaped = false; continue }
      if (c === '\\') { escaped = true; continue }
      if (c === '"') { inString = !inString; continue }
      if (inString) continue
      if (c === '[') depth++
      else if (c === ']') { depth--; if (depth === 0) { end = i + 1; break } }
    }
    if (end === -1) break

    try {
      const parsed = JSON.parse(payload.slice(start, end))
      if (Array.isArray(parsed)) out.push(...parsed)
    } catch { /* skip an unparseable block rather than losing the whole page */ }
    from = end
  }

  return out
}

/** 0-0 is ClassForKids' "unset" marker, not a real newborn-only range. */
function ageRange(l: Listing): { min: number | null; max: number | null } {
  const from = typeof l.ageFrom === 'number' ? l.ageFrom : null
  const to = typeof l.ageTo === 'number' ? l.ageTo : null
  if (from === 0 && to === 0) return { min: null, max: null }
  return { min: from, max: to }
}

/**
 * Ages here are already MONTHS — no inference, no guessing. A club whose intake
 * starts above five years is not for this audience. Applied to the judge's range
 * as well, so a model cannot talk its way past the gate the source data obeys.
 */
function startsAboveFive(min: number | null): boolean {
  return (min ?? 0) > 60
}

/**
 * A listing whose age is UNKNOWN, parked with everything needed to build its
 * draft later. Held so the judge can be asked about every outcode's unknowns in
 * ONE call after the loop.
 */
interface PendingListing {
  key: string
  title: string
  listing: Listing
  place: ResolvedPlace
}

/**
 * Build the draft for one listing.
 *
 * Extracted so the judge-kept clubs are built by exactly the same code as the
 * ordinary ones. Only the age range, its confidence and its basis differ between
 * the two paths; a second copy of this literal would drift.
 */
function buildDraft(
  pending: PendingListing,
  age: { min: number | null; max: number | null },
  confidence: number,
  ageBasis: AgeBasis,
): ActivityDraft {
  const { key, title, listing: l, place } = pending

  return {
    source_uid: key,
    title,
    description: typeof l.listingdescription === 'string'
      ? l.listingdescription.slice(0, 800) : null,
    organiser: title,
    category: 'Family',

    venue_name: typeof l.venueName === 'string' ? l.venueName : null,
    address: null,
    postcode: place.postcode,
    lat: place.lat,
    lng: place.lng,
    borough: place.borough,

    // Directory entry: no schedule and no dates. See the header note.
    schedule: [],
    starts_on: null,
    ends_on: null,
    term_time_only: null,

    age_min_months: age.min,
    age_max_months: age.max,

    is_free: false,
    price_type: 'block',
    price_amount: null,
    price_text: null,

    booking_mode: 'book_ahead',
    booking_url: l.bsurl ? `https://${l.bsurl}` : null,
    access: {},

    source_url: l.bsurl ? `https://${l.bsurl}` : null,
    deep_link: l.bsurl ? `https://${l.bsurl}` : null,
    confidence,
    age_basis: ageBasis,

    occurrences: [],
  }
}

export const classForKidsAdapter: Adapter = async (
  ctx: AdapterContext,
): Promise<AdapterResult> => {
  const outcodes: string[] = Array.isArray(ctx.config.outcodes) && (ctx.config.outcodes as string[]).length
    ? ctx.config.outcodes as string[]
    : DEFAULT_OUTCODES
  const policy = (ctx.config.area_policy as AreaPolicy) ?? 'london'

  const stats: Record<string, number> = {
    outcodes: 0, listings: 0, unique: 0, no_postcode: 0,
    no_age: 0, not_under5: 0, out_of_area: 0,
    age_judged: 0, age_likely: 0,
  }

  // Adjacent outcodes return overlapping results (radius search), so dedupe on
  // the provider's own booking subdomain before doing any geocoding work.
  const byClub = new Map<string, Listing>()

  for (const outcode of outcodes) {
    if (Date.now() > ctx.deadline) break

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(`https://classforkids.io/en-GB/classes/${outcode}`, {
        signal: controller.signal,
        headers: {
          // Without this header the endpoint returns the rendered HTML shell
          // rather than the RSC payload holding serverSideListings.
          'RSC': '1',
          'Accept': '*/*',
          'User-Agent': 'GPC-Discovery/1.0 (+https://greenwichparents.co.uk; community events index)',
        },
      })
      if (!res.ok) continue
      const body = await res.text()
      stats.outcodes++

      for (const l of extractListings(body)) {
        stats.listings++
        const key = String(l.bsurl ?? `${l.clubName}:${l.postcode}`)
        if (!byClub.has(key)) byClub.set(key, l)
      }
    } catch {
      continue
    } finally {
      clearTimeout(timer)
    }
  }

  stats.unique = byClub.size

  const candidates: Array<[string, Listing]> = []
  for (const [key, l] of byClub) {
    if (!l.postcode || !normalisePostcode(l.postcode)) { stats.no_postcode++; continue }
    if (!passesPrefilter(l.postcode, policy)) { stats.out_of_area++; continue }
    candidates.push([key, l])
  }

  const resolved = await resolvePostcodes(candidates.map(([, l]) => l.postcode))
  const activities: ActivityDraft[] = []
  /** Age-unknown listings from EVERY outcode, judged in one call after the loop. */
  const pending: PendingListing[] = []

  for (const [key, l] of candidates) {
    const pc = normalisePostcode(l.postcode)!
    const place = resolved.get(pc)
    if (!place || !passesArea(place, policy)) { stats.out_of_area++; continue }

    const title = String(l.clubName ?? '').trim()
    const age = ageRange(l)

    if (age.min === null && age.max === null) {
      stats.no_age++
      // A GAP, not a statement about who the club teaches. Held for the one
      // batched judge call below; a listing with no club name is unusable
      // whatever a judge says about it, so it is not worth sending.
      //
      // Except when the text ruled itself out. A null age range does NOT mean
      // "nothing was said" — inferAge deliberately returns NONE when it sees a
      // school-age or senior marker (age.ts:47-50), so "juniors" and "KS2" land
      // here looking identical to a genuinely blank listing. Paying an LLM to
      // reconsider those is the one thing this tier must not do.
      const desc = typeof l.listingdescription === 'string' ? l.listingdescription : null
      if (title && hasExclusionMarker(title, desc)) { stats.not_under5++; continue }
      if (title) pending.push({ key, title, listing: l, place })
      continue
    }
    if (startsAboveFive(age.min)) { stats.not_under5++; continue }

    if (!title) continue

    // Source-stated months, so high — but it's a directory listing, not a dated
    // session, which the empty occurrences list makes explicit.
    activities.push(buildDraft({ key, title, listing: l, place }, age, STATED_CONFIDENCE, 'stated'))
  }

  // --- the age judge ---------------------------------------------------------
  //
  // ONE call for every outcode's unknowns, after the loop rather than inside it.
  // A judged-likely club is INGESTED, not published: it lands with the normal
  // `status = 'pending'` and RLS only exposes `status = 'published'`, so an admin
  // still approves it in Discovery. The cost of a wrong `likely` is a minute of
  // review time, never a wrong listing on the site.
  //
  // If the deadline has already passed the judge is skipped entirely and every
  // held listing falls back to today's behaviour: dropped, already counted in
  // `no_age`. Same for a judge that fails, times out or returns nothing.
  if (pending.length && Date.now() < ctx.deadline) {
    stats.age_judged = pending.length

    const verdicts = await judgeUnderFive(
      pending.map((p): AgeJudgeItem => ({
        key: p.key,
        title: p.title,
        description: typeof p.listing.listingdescription === 'string'
          ? p.listing.listingdescription : null,
        venue: typeof p.listing.venueName === 'string' ? p.listing.venueName : null,
      })),
      { deadline: ctx.deadline },
    )

    for (const p of pending) {
      const judged = verdicts.get(p.key)
      // No verdict is treated exactly like `likely: false` — drop and count, as
      // today. Absence is the judge's documented failure mode, not an error.
      if (!judged?.likely) continue

      // A model can contradict itself: `likely: true` beside a range starting at
      // seven years. The deterministic gate wins that argument. Null months are
      // not a contradiction — they are the judge declining to guess, and null is
      // what gets written, because this source's whole value is honest months.
      if (startsAboveFive(judged.min_months)) continue

      stats.age_likely++
      activities.push(buildDraft(
        p,
        { min: judged.min_months, max: judged.max_months },
        JUDGED_CONFIDENCE,
        'llm_judged',
      ))
      // The verdict's reason has no column to live in, and an admin looking at a
      // judged row deserves to know which words it went on.
      console.log(`classforkids: age-judged likely — ${p.title} (${judged.reason})`)
    }
  }

  return { activities, cursor: null, stats }
}
