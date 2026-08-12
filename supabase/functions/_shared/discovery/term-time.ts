// Term-time detection.
//
// Only sets `term_time_only = true` for activities that SAY SO. Everything else
// stays null (unknown) and is never suppressed. That is deliberate: guessing
// that a session is term-time-only and hiding it for six weeks is a worse error
// than showing one that happens to be paused.
//
// The tri-state matters, because the language cuts BOTH ways:
//
//   true  "Rhymetime, term time only"          -> suppress during holidays
//   false "School holiday fun with toys and     -> runs ONLY in the holidays;
//          stories"                                suppressing it would be
//                                                  exactly backwards
//   null  no mention                           -> never suppressed
//
// Measured across the live sources: 26 of 692 Better library cards and 11 of
// 311 Lewisham RSS items carry any term-time language at all, and 8 of the
// Better hits are "school holiday" (i.e. the false case). OpenActive mentions
// it in 0 of 500 series. So this fires on a small, deliberate minority.

export type TermTime = boolean | null

/** Runs during term only — pause it in the school holidays. */
const TERM_TIME_ONLY = [
  /\bterm[- ]?time only\b/i,
  /\bonly (?:runs?|during) (?:in )?term[- ]?time\b/i,
  /\bduring term[- ]?time\b/i,
  /\bterm[- ]?time\b(?![^.]*\b(?:and|plus|as well as)\s+(?:school )?holidays?)/i,
  /\bnot (?:on|during|in) (?:the )?school holidays?\b/i,
  /\bno sessions? (?:in|during) (?:the )?(?:school )?holidays?\b/i,
  /\bexcludes? (?:the )?school holidays?\b/i,
]

/**
 * Runs ONLY in the holidays (or explicitly through them). Must resolve to
 * false, never true — otherwise the holiday programme is hidden exactly when
 * it runs. This is checked FIRST because "school holiday fun" also matches the
 * looser term-time patterns above.
 */
const RUNS_IN_HOLIDAYS = [
  /\bschool holidays?\b/i,
  /\bholiday (?:fun|club|programme|program|activities|session|scheme|camp)\b/i,
  /\bhalf[- ]?term\b/i,
  /\bsummer (?:fun|holiday|programme|scheme|club)\b/i,
  /\beaster (?:fun|holiday|programme|scheme|club)\b/i,
  /\bruns? (?:all year|through(?:out)? the holidays?|year[- ]round)\b/i,
]

/**
 * Infer whether an activity is restricted to term time.
 * Returns null unless the source states it — see the note above on why.
 */
export function inferTermTime(...parts: Array<string | null | undefined>): TermTime {
  const text = parts.filter(Boolean).join(' ')
  if (!text.trim()) return null

  // Order matters: a "school holiday" session also matches /term.time/ in
  // phrases like "during term time we run X, in the school holidays Y".
  if (RUNS_IN_HOLIDAYS.some((re) => re.test(text))) return false
  if (TERM_TIME_ONLY.some((re) => re.test(text))) return true
  return null
}
