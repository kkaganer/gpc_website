// Grouping and price labelling for the weekly edition page.
//
// Grouping is a curated map from `category` to a display group, never the raw
// category. The live data does not support raw grouping: of 402 approved rows,
// 230 are "Family" and the tail includes a venue name ("Move Games Camberwell"),
// a lone "Museum", a lone "History" and an empty string. Grouping on that gives
// one enormous bucket, several groups of one, a heading named after a Camberwell
// venue, and a "Jump to" nav whose shape changes every week.
//
// So the group list is fixed here and everything unrecognised falls into a
// single catch-all. Cleaning the underlying rows is a separate job; absorbing
// them is this module's.

/** Display groups, in the order they appear on the page. */
export const GROUPS = [
  {
    key: 'family',
    label: 'Family & play',
    note: 'Playgroups, story times and drop-ins.',
    categories: ['Family'],
  },
  {
    key: 'arts',
    label: 'Arts & making',
    note: 'Crafting, theatre and workshops.',
    categories: ['Arts', 'Art', 'Theatre', 'Crafts'],
  },
  {
    key: 'music',
    label: 'Music & movement',
    note: 'Singing, dancing and rhyme time.',
    categories: ['Music', 'Dance'],
  },
  {
    key: 'outdoors',
    label: 'Outdoors',
    note: 'Parks, walks and open air.',
    categories: ['Outdoor', 'Outdoors', 'Nature'],
  },
  {
    key: 'discovery',
    label: 'Museums & discovery',
    note: 'Collections, history and hands-on science.',
    categories: ['Museum', 'Museums', 'History', 'Science'],
  },
  {
    key: 'active',
    label: 'Sport & active',
    note: 'Swimming, climbing and running about.',
    categories: ['Sports', 'Sport'],
  },
  {
    key: 'food',
    label: 'Food & markets',
    note: 'Markets, tastings and family eating.',
    categories: ['Food', 'Markets'],
  },
]

/** Where anything unrecognised lands. Never omitted from the order. */
export const CATCH_ALL = {
  key: 'more',
  label: 'More this week',
  note: 'Everything else on around Greenwich.',
}

// Built once: category (lowercased) -> group key.
const CATEGORY_TO_GROUP = new Map()
for (const group of GROUPS) {
  for (const category of group.categories) {
    CATEGORY_TO_GROUP.set(category.toLowerCase(), group.key)
  }
}

/**
 * Sort events into display groups.
 *
 * Every event lands in exactly one group; empty groups are dropped. Group order
 * follows GROUPS, with the catch-all last regardless of how full it is.
 *
 * @param {Array<{category?: string}>} events
 * @returns {Array<{key: string, label: string, note: string, count: number, events: Array}>}
 */
export function groupEvents(events) {
  if (!Array.isArray(events) || events.length === 0) return []

  const buckets = new Map()
  for (const group of [...GROUPS, CATCH_ALL]) {
    buckets.set(group.key, [])
  }

  for (const event of events) {
    const raw = typeof event?.category === 'string' ? event.category.trim().toLowerCase() : ''
    const key = CATEGORY_TO_GROUP.get(raw) || CATCH_ALL.key
    buckets.get(key).push(event)
  }

  return [...GROUPS, CATCH_ALL]
    .map((group) => ({
      key: group.key,
      label: group.label,
      note: group.note,
      count: buckets.get(group.key).length,
      events: buckets.get(group.key),
    }))
    .filter((group) => group.count > 0)
}

// Real `price` values are sentences, not amounts: "£1 per child payable at the
// session", "£7.50 adults, children free". Rendered whole they wrap to three
// lines inside a pill and every row grows to match. The pill wants the number;
// the terms belong on the event page the row links to.
const LEADING_AMOUNT = /^(?:from\s+)?([£$€]\s?\d+(?:[.,]\d{2})?)/i
const MAX_PILL_CHARS = 12

/**
 * The price pill.
 *
 * Free is the thing parents scan for, so it gets the only coloured plate;
 * everything else stays neutral so the page does not turn into a fruit salad.
 *
 * `text` is always short enough to sit on one line. `full` keeps the original
 * so the row can carry it as a tooltip rather than losing it.
 *
 * @param {{is_free?: boolean, price?: string}} event
 * @returns {{text: string, full: string, bg: string, fg: string}}
 */
export function priceLabel(event) {
  if (event?.is_free) {
    return { text: 'Free', full: 'Free', bg: '#ecfdf5', fg: '#047857' }
  }
  const price = typeof event?.price === 'string' ? event.price.trim() : ''
  if (!price) {
    return { text: 'See details', full: '', bg: '#f9fafb', fg: '#6a7282' }
  }

  const neutral = { full: price, bg: '#f9fafb', fg: '#4a5565' }
  if (price.length <= MAX_PILL_CHARS) return { text: price, ...neutral }

  const amount = price.match(LEADING_AMOUNT)
  if (amount) return { text: amount[1].replace(/\s/g, ''), ...neutral }

  return { text: `${price.slice(0, MAX_PILL_CHARS - 1).trimEnd()}…`, ...neutral }
}

/**
 * The date window an edition covers: its own day plus the following six.
 *
 * Returned as ISO strings so they drop straight into a Supabase range filter.
 *
 * @param {string} iso edition date, YYYY-MM-DD
 * @returns {{from: string, to: string} | null}
 */
export function editionRange(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const start = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(start.getTime())) return null
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 6)
  return { from: iso, to: end.toISOString().slice(0, 10) }
}

/**
 * The link a paid slot points at, so the click is counted.
 *
 * Twin of `clickUrl` in api/click.js. Serverless functions cannot import from
 * src/, so the shape is duplicated on purpose. If one changes, change the other.
 *
 * Falls back to the raw destination when there is no advertiser id: a click we
 * cannot attribute is not worth sending the reader through a redirect for.
 */
export function clickHref(advertiserId, editionDate, rawUrl, source = 'web') {
  if (!advertiserId) return rawUrl || '#'
  const params = new URLSearchParams({ id: String(advertiserId), source })
  if (editionDate) params.set('date', editionDate)
  return `/click?${params.toString()}`
}

/** How many supporter tiles the rail holds before it stops taking more. */
export const SUPPORTER_CAPACITY = 4

/**
 * Lay out the supporter rail so it never shows an empty cell.
 *
 * Below capacity, the unsold remainder becomes ONE house tile spanning the
 * leftover columns rather than several holes — a grid with gaps in it reads as
 * broken, whereas a single "two spaces left" tile reads as an offer. At capacity
 * there is no house tile at all.
 *
 * @param {Array} supporters
 * @param {number} capacity
 * @returns {Array<{house: boolean, span: number, spaces?: number, supporter?: object}>}
 */
export function supporterSlots(supporters, capacity = SUPPORTER_CAPACITY) {
  const filled = Array.isArray(supporters) ? supporters.slice(0, capacity) : []
  const cells = filled.map((supporter) => ({ house: false, span: 1, supporter }))
  const remaining = Math.max(0, capacity - filled.length)
  if (remaining > 0) {
    cells.push({ house: true, span: remaining, spaces: remaining })
  }
  return cells
}

/**
 * The day block on the left of each row: "WED" over "17".
 *
 * @param {string} iso
 * @returns {{dow: string, day: string}}
 */
export function dayParts(iso) {
  if (typeof iso !== 'string') return { dow: '', day: '' }
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return { dow: '', day: '' }
  return {
    dow: d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }).toUpperCase(),
    day: String(d.getUTCDate()),
  }
}

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** The group key the regular activities section uses, in the nav and the anchor. */
export const REGULARS_KEY = 'regulars'

// Day order for recurring rows. Sunday is 0 in the column but reads last in a
// week that starts on Monday, and a row with no day at all sorts to the end
// rather than to Sunday. Same rule the newsletter's regulars block has always
// used -- kept identical so the email and the page list them in one order.
function regularSortOrder(day) {
  if (day === null || day === undefined) return 99
  return day === 0 ? 7 : day
}

/**
 * The "Regular activities" group.
 *
 * Kept apart from `groupEvents` rather than folded into it: a recurring row has
 * no date, so it cannot be sorted, dated or grouped by the same rules, and the
 * curated category map would scatter one weekly playgroup across four headings.
 * It is always last, and always its own section.
 *
 * @param {Array} regulars rows where is_recurring is true
 * @returns {{key: string, label: string, note: string, count: number, events: Array} | null}
 */
export function regularsGroup(regulars) {
  if (!Array.isArray(regulars) || regulars.length === 0) return null
  const events = [...regulars].sort(
    (a, b) => regularSortOrder(a?.day_of_week) - regularSortOrder(b?.day_of_week)
  )
  return {
    key: REGULARS_KEY,
    label: 'Regular activities',
    note: 'Every week, all term. Some only run in term-time, so check before you travel.',
    count: events.length,
    events,
  }
}

/**
 * The day block for a recurring row: "EVERY" over "MON".
 *
 * The twin of `dayParts`, which needs a date. A weekly session has a weekday and
 * no date at all, so the same two-line block is filled from `day_of_week`.
 *
 * @param {{day_of_week?: number | null}} event
 * @returns {{dow: string, day: string}}
 */
export function regularDayParts(event) {
  const day = event?.day_of_week
  if (day === null || day === undefined || !DAY_NAMES_SHORT[day]) {
    return { dow: 'EVERY', day: 'Week' }
  }
  return { dow: 'EVERY', day: DAY_NAMES_SHORT[day] }
}
