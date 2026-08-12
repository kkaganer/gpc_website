// Postcode normalisation and served-area filtering.
//
// This module is what keeps a NATIONAL feed from becoming a national database.
// Better/GLL publishes ~5,000 session series covering Cardiff, Belfast, York and
// Bath alongside Greenwich and Woolwich. Filtering is therefore not a nicety.
//
// Two-stage by design:
//   1. cheap outcode prefilter  — no network, discards the ~90% obviously out of area
//   2. postcodes.io bulk lookup — authoritative borough + coordinates for survivors
//
// Do NOT replace stage 2 with a lat/lng bounding box: Cardiff (51.4965 N) sits at
// almost exactly Greenwich's latitude, so a sloppy box passes it straight through.

/** Canonical form: uppercase, single space before the 3-char inward code. */
export function normalisePostcode(raw: string | null | undefined): string | null {
  if (!raw) return null
  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (compact.length < 5 || compact.length > 7) return null
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`
}

export function outcode(raw: string | null | undefined): string | null {
  const norm = normalisePostcode(raw)
  return norm ? norm.split(' ')[0] : null
}

/**
 * Outward codes touching the served boroughs. Deliberately GENEROUS — this is a
 * prefilter, not the decision. Postcode districts straddle borough boundaries
 * (SE9 spans Greenwich and Bromley; SE1 spans Southwark, Lambeth and the City),
 * so anything plausible is passed through to the authoritative check.
 */
export const SERVED_OUTCODES = new Set<string>([
  // Greenwich
  'SE2', 'SE3', 'SE7', 'SE9', 'SE10', 'SE12', 'SE18', 'SE28',
  // Lewisham
  'SE4', 'SE6', 'SE8', 'SE13', 'SE14', 'SE23', 'SE26',
  // Southwark
  'SE1', 'SE5', 'SE11', 'SE15', 'SE16', 'SE17', 'SE21', 'SE22', 'SE24',
  // Bromley / Penge / Crystal Palace fringe
  'SE19', 'SE20', 'SE25', 'SE27',
  'BR1', 'BR2', 'BR3', 'BR4', 'BR5', 'BR6', 'BR7', 'BR8',
  // Tower Hamlets (Isle of Dogs and west)
  'E1', 'E1W', 'E2', 'E3', 'E14',
  // Bexley
  'DA1', 'DA5', 'DA6', 'DA7', 'DA8', 'DA14', 'DA15', 'DA16', 'DA17', 'DA18',
])

/** Authoritative — matched against postcodes.io `admin_district`. */
export const SERVED_BOROUGHS = new Set<string>([
  'Greenwich',
  'Lewisham',
  'Southwark',
  'Bromley',
  'Tower Hamlets',
  'Bexley',
])

/**
 * How aggressively a source is geo-filtered at INGEST.
 *
 * The map filters by distance at DISPLAY time, so ingest should be generous —
 * an activity we never ingested can never be shown, whereas one that's slightly
 * out of area simply gets filtered out client-side. But "generous" is not
 * "unfiltered": Better/GLL publishes ~5,000 series nationally (Cardiff, Belfast,
 * York, Bath) and library panel 13695 spans 45 outcodes including Lincoln.
 *
 *   'curated' — the adapter's targets are an explicit hand-picked list
 *               (Spektrix's 7 venues, Lewisham's branches, a single borough).
 *               No geo filter: everything the source returns is wanted.
 *   'london'  — Greater London. The default for broad feeds; keeps SW19 (Polka)
 *               and N1 (Little Angel), drops Lincoln and Cardiff.
 *   'served'  — served boroughs only. The tightest setting; rarely needed now.
 */
export type AreaPolicy = 'curated' | 'london' | 'served'

/**
 * Postal AREAS (the alpha prefix of an outcode) that are London or London-fringe.
 * Enumerating areas rather than outcodes keeps this maintainable; the
 * authoritative `region === 'London'` check below does the real work.
 */
const LONDON_POSTAL_AREAS = new Set<string>([
  'E', 'EC', 'N', 'NW', 'SE', 'SW', 'W', 'WC',          // London proper
  'BR', 'CR', 'DA', 'EN', 'HA', 'IG', 'KT', 'RM', 'SM', 'TW', 'UB', 'WD', // fringe
])

function postalArea(oc: string): string {
  return oc.replace(/\d.*$/, '')
}

/** Stage 1. Cheap, no network. */
export function passesPrefilter(
  raw: string | null | undefined,
  policy: AreaPolicy = 'london',
): boolean {
  if (policy === 'curated') return true
  const oc = outcode(raw)
  if (!oc) return false
  if (policy === 'served') return SERVED_OUTCODES.has(oc)
  return LONDON_POSTAL_AREAS.has(postalArea(oc))
}

/** Back-compat alias for the original served-boroughs-only prefilter. */
export function passesOutcodePrefilter(raw: string | null | undefined): boolean {
  return passesPrefilter(raw, 'served')
}

/** Stage 2, authoritative. Applied to a resolved place. */
export function passesArea(place: ResolvedPlace, policy: AreaPolicy = 'london'): boolean {
  if (policy === 'curated') return true
  if (policy === 'served') return SERVED_BOROUGHS.has(place.borough)
  // 'london': Greater London, plus served boroughs that some datasets file
  // under a South East / Kent region rather than London.
  return place.region === 'London' || SERVED_BOROUGHS.has(place.borough)
}

export interface ResolvedPlace {
  postcode: string
  lat: number
  lng: number
  /** postcodes.io `admin_district` — the London borough. */
  borough: string
  /** postcodes.io `region` — "London" for anything inside Greater London. */
  region: string
  /** Convenience: passes the SERVED_BOROUGHS test. */
  inArea: boolean
}

/**
 * Stage 2. postcodes.io bulk lookup — free, no key, 100 postcodes per request.
 * Returns a map keyed by NORMALISED postcode. Never throws; unresolvable
 * postcodes are simply absent from the map.
 */
export async function resolvePostcodes(
  raw: Array<string | null | undefined>,
): Promise<Map<string, ResolvedPlace>> {
  const out = new Map<string, ResolvedPlace>()

  const unique = [...new Set(raw.map(normalisePostcode).filter((p): p is string => !!p))]
  if (unique.length === 0) return out

  for (let i = 0; i < unique.length; i += 100) {
    const batch = unique.slice(i, i + 100)
    try {
      const res = await fetch('https://api.postcodes.io/postcodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postcodes: batch }),
      })
      if (!res.ok) continue
      const body = await res.json().catch(() => null)
      for (const row of body?.result ?? []) {
        const r = row?.result
        if (!r) continue
        const pc = normalisePostcode(r.postcode)
        if (!pc) continue
        const borough = r.admin_district ?? ''
        out.set(pc, {
          postcode: pc,
          lat: r.latitude,
          lng: r.longitude,
          borough,
          region: r.region ?? '',
          inArea: SERVED_BOROUGHS.has(borough),
        })
      }
    } catch {
      // Network hiccup on one batch shouldn't lose the others.
    }
  }

  return out
}
