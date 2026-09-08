// Narrowing the Discovery review queue, and planning a bulk fill over it.
//
// Pure and React-free on purpose, in the style of `editionGroups.js`. There is
// no test suite in this project — verification is `npm run build` plus a node
// script — so predicates that decide what gets approved and what gets written
// have to be importable outside a browser or they cannot be checked at all.

// Extension included deliberately: this module is verified by running it under
// plain node (there is no test runner here), and node's ESM resolver does not
// guess extensions the way Vite does.
import { isBlank } from './discoveryActivity.js'

/** Every field the search box looks at. Ordered by how people actually search. */
const SEARCH_FIELDS = [
  'title', 'venue_name', 'address', 'postcode', 'borough',
  'source_name', 'category', 'description',
]

/**
 * Does this row match a free-text query?
 *
 * Case-insensitive substring across the fields above. An empty or whitespace
 * query matches everything — "no query" is not "no results".
 */
export function matchesSearch(row, term) {
  const q = (term ?? '').trim().toLowerCase()
  if (!q) return true
  return SEARCH_FIELDS.some((f) => String(row?.[f] ?? '').toLowerCase().includes(q))
}

/**
 * The three gaps worth filtering on, each named for the damage it causes rather
 * than for the column it reads. All three are read by publish_activity (011),
 * so a row carrying one of them publishes broken:
 *
 *   location := coalesce(address, venue_name, postcode, borough,
 *                        'Location to be confirmed')
 *   url      := coalesce(deep_link, booking_url, source_url)
 *
 * That coalesce is why `no_website` checks all THREE link columns: a row with a
 * booking_url and no deep_link still publishes with a working link, so calling
 * it "no website" would send an admin to fix something that is not broken.
 */
export const GAPS = {
  no_postcode: {
    label: 'No postcode',
    title:
      'No postcode at all. These never get a map pin, and their dedup key collides with ' +
      'other venues, so repeats fold together that are not actually repeats.',
    test: (r) => isBlank(r.postcode),
  },
  no_location: {
    label: 'No location',
    title:
      'Neither an address nor a venue name. Published, these say only the postcode or ' +
      'borough — and with neither of those, "Location to be confirmed".',
    test: (r) => isBlank(r.address) && isBlank(r.venue_name),
  },
  no_website: {
    label: 'No website',
    title:
      'No link of any kind — no website, no booking link, no source page. Published, ' +
      'there is no way for anyone to book or find out more.',
    test: (r) => isBlank(r.deep_link) && isBlank(r.booking_url) && isBlank(r.source_url),
  },
}

export const GAP_KEYS = Object.keys(GAPS)

/** Does this row have the named gap? Unknown gap names match nothing. */
export function hasGap(row, gap) {
  return GAPS[gap] ? GAPS[gap].test(row) : false
}

/**
 * Does this row pass the active gap chips?
 *
 * The chips OR with each other, deliberately. They are used to build a worklist
 * of broken rows, so a second chip has to GROW the list — under AND, the second
 * click would almost always empty the screen, which reads as the filter being
 * broken rather than as an empty intersection. No chips at all means no
 * narrowing, which is why this returns true on an empty set.
 */
export function matchesGaps(row, activeGaps) {
  const gaps = [...(activeGaps ?? [])]
  if (gaps.length === 0) return true
  return gaps.some((g) => hasGap(row, g))
}

/**
 * The whole narrowing, in the order the UI applies it. Search AND chips AND the
 * pre-existing AI-ages filter — the chips only OR among themselves.
 */
export function filterActivities(rows, { search = '', gaps = new Set(), onlyLlmJudged = false } = {}) {
  return rows.filter(
    (r) =>
      (!onlyLlmJudged || r.age_basis === 'llm_judged') &&
      matchesSearch(r, search) &&
      matchesGaps(r, gaps),
  )
}

/** How many rows on this tab carry each gap. Drives the count on each chip. */
export function gapCounts(rows) {
  const counts = {}
  for (const key of GAP_KEYS) counts[key] = rows.filter((r) => hasGap(r, key)).length
  return counts
}

// ---------------------------------------------------------------------------
// Bulk fill
// ---------------------------------------------------------------------------

/** The fields a bulk fill may set, and how each one decides "already has one". */
export const BULK_FILL_FIELDS = [
  'postcode', 'venue_name', 'address', 'deep_link',
  'category', 'age_min_months', 'age_max_months',
]

/** Human names for those fields. Used by the panel AND by the result message,
 *  so the confirm dialog and the line reporting what happened cannot drift. */
export const BULK_FILL_LABELS = {
  postcode: 'Postcode',
  venue_name: 'Venue',
  address: 'Address',
  deep_link: 'Website',
  category: 'Category',
  age_min_months: 'Youngest age',
  age_max_months: 'Oldest age',
}

const BULK_INTEGER_FIELDS = ['age_min_months', 'age_max_months']

/**
 * Work out what a bulk fill would actually write, without writing anything.
 *
 * FILL BLANKS ONLY, with no override and no force switch. For each selected row
 * and each supplied value, the value is written only where that field is
 * currently blank; a row that already carries one is left alone and counted in
 * `skipped`. There is no undo on this screen, and one careless select-all would
 * otherwise stamp a single venue's postcode across forty unrelated listings.
 *
 * `coords` is an already-resolved { lat, lng } for the supplied postcode — one
 * lookup for the value, not one per row — and is applied only to rows where lat
 * and lng are BOTH blank, since a postcode without a pin still never reaches
 * the map.
 *
 * Returns { writes: [{ id, patch }], filled: {field: n}, skipped: {field: n} },
 * where `filled` and `skipped` sum to the number of selected rows for every
 * field that was supplied at all.
 */
export function planBulkFill(rows, values, { coords = null } = {}) {
  const supplied = BULK_FILL_FIELDS.filter((f) => !isBlank(values?.[f]))
  const filled = {}
  const skipped = {}
  for (const f of supplied) { filled[f] = 0; skipped[f] = 0 }

  const writes = []
  for (const row of rows ?? []) {
    const patch = {}
    for (const field of supplied) {
      if (!isBlank(row[field])) { skipped[field]++; continue }
      const raw = values[field]
      patch[field] = BULK_INTEGER_FIELDS.includes(field)
        ? parseInt(raw, 10)
        : String(raw).trim()
      filled[field]++
    }
    // Coordinates ride along with a postcode fill, never on their own, and only
    // onto a row missing both. Half a pair is not a map pin.
    if (patch.postcode && coords && isBlank(row.lat) && isBlank(row.lng)) {
      patch.lat = coords.lat
      patch.lng = coords.lng
    }
    if (Object.keys(patch).length) writes.push({ id: row.id, patch })
  }

  return { writes, filled, skipped, supplied }
}
