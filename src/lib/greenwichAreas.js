// "Within Greenwich" neighbourhood filter for What's On, derived from each
// event's POSTCODE — no DB column and no backfill. Royal Borough of Greenwich
// postcode districts mapped to neighbourhoods; SE10 is split so the Peninsula
// (North Greenwich, SE10 0xx) can be picked on its own, which Aster asked for.
//
// WHAT WHAT'S ON DOES WITH NON-GREENWICH EVENTS: the public What's On is a browse
// tool. With no neighbourhood chosen it shows EVERY approved event regardless of
// borough (alongside the postcode-radius filter). This neighbourhood filter only
// NARROWS to a Greenwich area when one is picked; a non-Greenwich event — or one
// with no postcode — simply isn't matched by a Greenwich-area selection, and is
// shown again the moment the filter is cleared. (The newsletter is the opposite:
// it defaults to the SE-London boroughs — see SE_LONDON_AREAS in
// newsletter-renderer.ts.)

export const GREENWICH_NEIGHBOURHOODS = [
  'Greenwich',
  'Greenwich Peninsula',
  'Blackheath & Westcombe Park',
  'Charlton',
  'Eltham & Mottingham',
  'Woolwich & Plumstead',
  'Thamesmead & Abbey Wood',
]

// Postcode district (outward code) -> neighbourhood. SE10 is handled separately
// below so Greenwich town and the Peninsula can be told apart.
const DISTRICT_TO_NEIGHBOURHOOD = {
  SE3: 'Blackheath & Westcombe Park',
  SE7: 'Charlton',
  SE9: 'Eltham & Mottingham',
  SE18: 'Woolwich & Plumstead',
  SE2: 'Thamesmead & Abbey Wood',
  SE28: 'Thamesmead & Abbey Wood',
}

/**
 * The Greenwich neighbourhood an event sits in, or null if it's outside Greenwich
 * (or has no usable postcode). Accepts postcodes with or without the space.
 */
export function neighbourhoodForPostcode(postcode) {
  if (!postcode) return null
  const pc = String(postcode).toUpperCase().replace(/\s+/g, ' ').trim()
  if (!pc) return null
  const parts = pc.split(' ')
  const outward = parts.length > 1 ? parts[0] : pc.slice(0, -3).trim()
  if (outward === 'SE10') {
    const inward = parts.length > 1 ? parts[1] : pc.slice(-3)
    return /^0/.test(inward) ? 'Greenwich Peninsula' : 'Greenwich'
  }
  return DISTRICT_TO_NEIGHBOURHOOD[outward] || null
}
