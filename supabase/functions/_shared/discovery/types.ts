// Shared types for the discovery platform.
//
// The core primitive is an Activity (a schedule rule + validity window) from
// which Occurrences are generated — NOT a dated event. ~97% of under-5 provision
// is weekly recurring and term-time bound, and a dated-event model structurally
// cannot represent it.

/** A weekly slot. `by_day` is lowercase English, `HH:MM` times are local. */
export interface ScheduleSlot {
  by_day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  start_time: string
  end_time?: string | null
}

export interface AccessFlags {
  step_free?: boolean
  buggy_parking?: boolean
  breastfeeding_friendly?: boolean
  changing_facilities?: boolean
  send_friendly?: boolean
  dad_carer_focus?: boolean
  quiet_low_sensory?: boolean
}

/**
 * What an adapter returns. Deliberately close to the `activities` table, but
 * adapters never write directly — they hand these to upsertActivity().
 */
export interface ActivityDraft {
  source_uid: string
  title: string
  description?: string | null
  organiser?: string | null
  category?: string | null

  venue_name?: string | null
  address?: string | null
  postcode?: string | null
  lat?: number | null
  lng?: number | null
  borough?: string | null

  /** Empty array => one-off. Occurrences then come from `occurrences` below. */
  schedule: ScheduleSlot[]
  timezone?: string
  starts_on?: string | null
  ends_on?: string | null

  /**
   * null means GENUINELY UNKNOWN, not "false". Quality gate G7 holds unknowns
   * rather than publishing them, because a term-time session shown during the
   * school holidays is a false positive that costs more trust than a gap.
   */
  term_time_only?: boolean | null

  age_min_months?: number | null
  age_max_months?: number | null

  is_free?: boolean | null
  price_type?: 'free' | 'donation' | 'per_session' | 'block' | 'membership' | null
  price_amount?: number | null
  price_text?: string | null

  booking_mode?: 'drop_in' | 'book_ahead' | 'waitlist' | 'closed' | null
  booking_url?: string | null

  access?: AccessFlags

  source_url?: string | null
  deep_link?: string | null
  confidence?: number | null

  /**
   * How the age range was arrived at. Four very different grades of evidence
   * write to age_min_months/age_max_months — an explicit "6-18 months" on the
   * source, a category word like "toddler", a venue-level assumption, and an
   * LLM judgement on a listing that stated no age at all — and without this
   * they are indistinguishable in the table and in review.
   * Values must match migration 023's CHECK constraint.
   */
  age_basis?: 'stated' | 'inferred' | 'venue_default' | 'llm_judged' | null

  /** Directly-ingested dated instances (one-offs, or feeds that publish them). */
  occurrences?: OccurrenceDraft[]
}

export interface OccurrenceDraft {
  starts_at: string
  ends_at?: string | null
  status?: 'scheduled' | 'cancelled' | 'full'
  source_uid?: string | null
}

export interface AdapterContext {
  /** Persisted resume pointer; null on a full resync. */
  cursor: string | null
  config: Record<string, unknown>
  /** Wall-clock budget. Edge functions cap at 150s (free) / 400s (paid). */
  deadline: number
}

export interface AdapterResult {
  activities: ActivityDraft[]
  /** New cursor to persist, or null to leave unchanged. */
  cursor?: string | null
  /** Counters the adapter can observe but the writer cannot (e.g. filtered-out). */
  stats?: Record<string, number>
}

export type Adapter = (ctx: AdapterContext) => Promise<AdapterResult>

export interface IngestCounters {
  fetched: number
  in_area: number
  under5: number
  inserted: number
  updated: number
  skipped_duplicate: number
  occurrences_written: number
}
