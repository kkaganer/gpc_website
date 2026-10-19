// Turning a Discovery review row into an `activities` UPDATE, and back again.
//
// The review screen reads `activity_review_queue`, a VIEW, and writes to
// `activities`, the TABLE. They are not the same shape, and three classes of
// column on the view must never reach an update:
//
//   GENERATED   `outcode` and `dedup_key` are `generated always as ... stored`
//               (008). Postgres rejects any write to them outright — one in the
//               payload fails the whole save, including the fields that were fine.
//   DERIVED     `age_range`, `is_recurring`, `next_occurrence`, `upcoming_count`
//               are computed in the view's select list. There is nothing behind
//               them to write to.
//   JOINED      `source_name` and `attribution` live on `discovery_sources`.
//
// So the payload is built from an explicit ALLOW-list, never by subtracting a
// deny-list from the row. A deny-list silently admits every column a future
// migration adds to the view; an allow-list silently ignores them, which is the
// direction that fails safe.

/** The only columns the Discovery screen may write. Order is the form's order. */
export const ACTIVITY_EDITABLE_FIELDS = [
  'title',
  'venue_name',
  'address',
  'postcode',
  'borough',
  'deep_link',
  'booking_url',
  'description',
  'category',
  'age_min_months',
  'age_max_months',
  'is_free',
  'price_text',
  'term_time_only',
  'lat',
  'lng',
  // Admin-pinned dates (migration 035). publish_activity uses them to emit ONE
  // london_events row spanning [start, end] instead of per-occurrence rows.
  'admin_start_date',
  'admin_end_date',
  'admin_time',
]

/** Never writable, for whatever reason. Exported so a check can assert on it. */
export const ACTIVITY_UNWRITABLE_FIELDS = [
  'outcode', 'dedup_key',
  'age_range', 'is_recurring', 'next_occurrence', 'upcoming_count',
  'source_name', 'attribution',
  'id', 'source_id', 'source_uid', 'status', 'created_at',
]

const NUMERIC_FIELDS = ['age_min_months', 'age_max_months', 'lat', 'lng']
const INTEGER_FIELDS = ['age_min_months', 'age_max_months']
// Both are genuinely THREE-state in the database and must stay that way.
// `term_time_only` especially: 008 calls NULL "genuinely unknown" and gate G7
// holds those back rather than publishing them. Coercing NULL to false here
// would tell the gate a holiday-closed session runs in August.
const TRISTATE_FIELDS = ['is_free', 'term_time_only']

/** '' and '   ' are the same as absent, everywhere on this screen. */
export const isBlank = (v) =>
  v === null || v === undefined || (typeof v === 'string' && v.trim() === '')

/**
 * A review-queue row -> the panel's form state. Every value is a string, so the
 * inputs stay controlled. '' means absent — and on the two tri-state fields it
 * is the "unknown" branch, which is a real value the database keeps, not a gap.
 */
export function activityFormFromRow(row) {
  const form = {}
  for (const field of ACTIVITY_EDITABLE_FIELDS) {
    const value = row?.[field]
    form[field] = value === null || value === undefined ? '' : String(value)
  }
  // The panel shows age as ONE free-text box, like the other two event forms,
  // instead of two "months" inputs. Months stay the system of record (the
  // under-5 publish gating keys off them); age_range here is the derived text
  // from the row, and on save we parse it back to months only if it was edited.
  form.age_range = row?.age_range == null ? '' : String(row.age_range)
  return form
}

/**
 * The panel's form state -> an `activities` update payload.
 *
 * Blank text becomes NULL rather than ''. The database asks "is this missing?"
 * with `coalesce(nullif(trim(x), ''), null)` in several places precisely because
 * both spellings exist in the ingested data; writing NULL stops this screen
 * adding more of the second kind, and keeps `hasGap` a single check.
 */
export function buildActivityPatch(form) {
  const patch = {}
  for (const field of ACTIVITY_EDITABLE_FIELDS) {
    const raw = form[field]
    if (TRISTATE_FIELDS.includes(field)) {
      patch[field] = raw === '' || raw === null || raw === undefined ? null : raw === 'true' || raw === true
    } else if (NUMERIC_FIELDS.includes(field)) {
      if (isBlank(raw)) { patch[field] = null; continue }
      const n = INTEGER_FIELDS.includes(field) ? parseInt(raw, 10) : parseFloat(raw)
      patch[field] = Number.isFinite(n) ? n : null
    } else {
      patch[field] = isBlank(raw) ? null : String(raw).trim()
    }
  }
  return patch
}

/**
 * Validate before saving. Returns an array of messages; empty means fine.
 * Kept here rather than in the component so it can be checked without a browser.
 */
export function validateActivityPatch(patch) {
  const errors = []
  if (isBlank(patch.title)) errors.push('Title is required.')
  const { age_min_months: lo, age_max_months: hi } = patch
  if (lo != null && hi != null && lo > hi) {
    errors.push('Youngest age cannot be older than the oldest age.')
  }
  for (const [field, label] of [['age_min_months', 'Youngest'], ['age_max_months', 'Oldest']]) {
    if (patch[field] != null && patch[field] < 0) errors.push(`${label} age cannot be negative.`)
  }
  if (patch.lat != null && (patch.lat < -90 || patch.lat > 90)) errors.push('Latitude must be between -90 and 90.')
  if (patch.lng != null && (patch.lng < -180 || patch.lng > 180)) errors.push('Longitude must be between -180 and 180.')
  if (patch.admin_start_date && patch.admin_end_date && patch.admin_end_date < patch.admin_start_date) {
    errors.push('End date cannot be before the start date.')
  }
  return errors
}

/**
 * Parse a free-text age ("0-5", "0-18 months", "3+", "All ages") into
 * { min, max } months. Months are the system of record on the Discovery side,
 * so this lets the panel offer the same free-text age box as the other two
 * forms without losing the structured months. Rough inverse of the SQL
 * discovery_age_text(); unparseable text (e.g. "pre-walkers") becomes all ages.
 */
export function ageTextToMonths(text) {
  const s = String(text ?? '').trim().toLowerCase()
  if (s === '' || s === 'all ages' || s === 'all' || s === 'any' || s === 'all welcome') {
    return { min: null, max: null }
  }
  const yToM = (y) => Math.round(parseFloat(y) * 12)
  let m
  if ((m = s.match(/^(\d+)\s*[-–]\s*(\d+)\s*months?$/))) return { min: +m[1], max: +m[2] }
  if ((m = s.match(/^(\d+)\s*months?\s*[-–]\s*(\d+(?:\.\d+)?)\s*years?$/))) return { min: +m[1], max: yToM(m[2]) }
  if ((m = s.match(/^(?:up to|under)\s*(\d+(?:\.\d+)?)/))) return { min: null, max: yToM(m[1]) }
  if ((m = s.match(/^(\d+)\s*months?\s*\+$/)) || (m = s.match(/^(\d+)\s*\+\s*months?$/))) return { min: +m[1], max: null }
  if ((m = s.match(/^(\d+(?:\.\d+)?)\s*years?\s*\+$/)) || (m = s.match(/^(\d+(?:\.\d+)?)\s*\+\s*(?:years?)?$/))) return { min: yToM(m[1]), max: null }
  if ((m = s.match(/^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*(?:years?)?$/))) return { min: yToM(m[1]), max: yToM(m[2]) }
  if ((m = s.match(/^(\d+(?:\.\d+)?)\s*years?$/))) return { min: yToM(m[1]), max: yToM(m[1]) }
  // Unparseable free text: no structured months, treat as all ages.
  return { min: null, max: null }
}

/**
 * Return `form` with age_min_months/age_max_months derived from the free-text
 * age_range — but ONLY when the text was actually edited. An untouched activity
 * keeps its exact months (and so its publish gating), round-trip safe.
 */
export function withAgeMonths(form, originalAgeText) {
  if ((form.age_range ?? '') === (originalAgeText ?? '')) return form
  const { min, max } = ageTextToMonths(form.age_range)
  return {
    ...form,
    age_min_months: min == null ? '' : String(min),
    age_max_months: max == null ? '' : String(max),
  }
}
