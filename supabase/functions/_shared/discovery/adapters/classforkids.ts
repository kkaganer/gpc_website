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
import { passesPrefilter, passesArea, resolvePostcodes, normalisePostcode, type AreaPolicy } from '../geo.ts'

const TIMEOUT_MS = 25_000

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

  for (const [key, l] of candidates) {
    const pc = normalisePostcode(l.postcode)!
    const place = resolved.get(pc)
    if (!place || !passesArea(place, policy)) { stats.out_of_area++; continue }

    const age = ageRange(l)
    if (age.min === null && age.max === null) { stats.no_age++; continue }
    // Ages are already MONTHS here — no inference, no guessing.
    if ((age.min ?? 0) > 60) { stats.not_under5++; continue }

    const title = String(l.clubName ?? '').trim()
    if (!title) continue

    activities.push({
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
      // Source-stated months, so high — but it's a directory listing, not a
      // dated session, which the empty occurrences list makes explicit.
      confidence: 0.9,

      occurrences: [],
    })
  }

  return { activities, cursor: null, stats }
}
