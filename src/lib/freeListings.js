// Which free listings have been sold but never actually listed.
//
// A `newsletter_advertisers` row with ad_type 'free-listing' is a SALES RECORD.
// It is read by nothing that renders: not the newsletter, not the edition page.
// The thing a reader sees is a `london_events` row, which somebody has to add by
// hand. Nothing connected the two, so a confirmed free listing could sit in the
// admin looking done while the event never appeared anywhere.
//
// There is no foreign key to join on, so this matches on title text and is
// deliberately called a hint in the UI. It is tuned to under-report rather than
// over-report: a false "not listed yet" on every row would train everybody to
// ignore the flag, which is worse than the silence it replaces.

/** Lowercase, strip punctuation, collapse whitespace. */
export function normaliseTitle(title) {
  return String(title ?? '')
    .toLowerCase()
    .replace(/[‘’“”]/g, "'")
    .replace(/[^a-z0-9'\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Does an event plausibly correspond to this advertiser row?
 *
 * Equality after normalising, or one title containing the other — "Rhyme Time"
 * booked and "Rhyme Time with Abby" listed is the same thing, and treating it as
 * unlisted would be a false alarm. Containment needs a real word behind it, so a
 * two-letter title cannot match half the guide.
 */
const MIN_CONTAINMENT = 6

export function titlesMatch(a, b) {
  const x = normaliseTitle(a)
  const y = normaliseTitle(b)
  if (!x || !y) return false
  if (x === y) return true
  const [shorter, longer] = x.length <= y.length ? [x, y] : [y, x]
  if (shorter.length < MIN_CONTAINMENT) return false
  return longer.includes(shorter)
}

/** The statuses that mean the sale is real. Pending is still a conversation. */
const SOLD = new Set(['confirmed', 'included'])

/**
 * Ids of free listings that look like nobody has added the event yet.
 *
 * @param {Array<{id?: string, ad_type?: string, status?: string, event_title?: string, advertiser_name?: string}>} advertisers
 * @param {Array<{title?: string}>} events approved london_events rows
 * @returns {Set<string>} advertiser ids to flag
 */
export function unlistedFreeListings(advertisers, events) {
  const out = new Set()
  if (!Array.isArray(advertisers)) return out
  const titles = (Array.isArray(events) ? events : [])
    .map((e) => e?.title)
    .filter(Boolean)

  for (const ad of advertisers) {
    if (!ad || ad.ad_type !== 'free-listing') continue
    if (!SOLD.has(String(ad.status))) continue
    // Fall back to the business name: a parsed enquiry sometimes carries the
    // business in event_title and sometimes leaves it blank.
    const candidates = [ad.event_title, ad.advertiser_name].filter(Boolean)
    if (candidates.length === 0) continue
    const listed = titles.some((t) => candidates.some((c) => titlesMatch(c, t)))
    if (!listed && ad.id) out.add(ad.id)
  }
  return out
}
