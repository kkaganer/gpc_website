// Age inference — deterministic, no LLM.
//
// Age is expressed in MONTHS throughout. Years are too coarse for this audience:
// the difference between a 6-month-old and a 4-year-old is the entire product,
// and the incumbent aggregators all lose it. Of 43 competitor listings sampled
// during research, ZERO populated age-in-months despite their schemas supporting
// it — which is precisely where a borough-focused index can win.
//
// Returns nulls when nothing is derivable. A null is honest; a guess is a listing
// a parent turns up to with the wrong-age child.

export interface AgeRange {
  min: number | null
  max: number | null
  /** 0..1 — how directly the range was stated vs. inferred from category words. */
  confidence: number
}

const NONE: AgeRange = { min: null, max: null, confidence: 0 }

/** Phrases that positively mark a listing as NOT for under-5s. */
const SCHOOL_AGE = /\b(?:ks[12]|key stage|school[- ]age|primary school|juniors?|teens?|youth|adults? only|over 1[68]s)\b/i

/**
 * e.g. "50 plus" — senior sessions, common in leisure-centre feeds.
 *
 * The trailing \b means this only ever fires on the WORD "plus": after a literal
 * "+" comes a space, which gives no word boundary. That looks like a bug and is
 * left alone deliberately — "60+ Gentle Swim" falls through to the `plus`
 * pattern further down, which resolves it to {min: 720, max: null} and a verdict
 * of 'exclude'. That is a STRONGER answer than this rule's NONE/'unknown', so
 * closing the gap here would make the classification worse, not better.
 * (Checked by running both forms against the real inferAge.)
 *
 * The lookbehind is the real fix: without it "Baby yoga, £55 plus mat hire"
 * matched as a senior session. Harmless while NONE just meant "drop by another
 * route", but hasExclusionMarker now reads this regex to decide what never
 * reaches the LLM — so a price would have silently dropped a baby class.
 */
const SENIOR = /(?<![£$\d.])\b(?:5\d|6\d|7\d|8\d)\s*(?:\+|plus)\b/

/**
 * Supervision clauses that LOOK like eligibility statements but aren't.
 *
 * "All under 8s must attend with an adult(18+)" appears on virtually every
 * leisure-centre public-swim listing. Read naively it says "this session is for
 * 0-8 year olds"; it actually says "this session is for everyone, and children
 * under 8 need a chaperone". Treating it as eligibility floods the index with
 * generic adult sessions — measured on the live Southwark feed, this single
 * pattern accounted for most false positives.
 *
 * Applied as a lookahead window after an "under N" match, not to the whole text,
 * so a genuine under-5 listing that also mentions supervision still resolves.
 */
const SUPERVISION_AFTER =
  /^\s*(?:'?s)?\s*(?:must|should|need|have to|are required to)\b|^\s*(?:'?s)?\s*(?:must )?(?:be )?(?:attend|accompan|supervis)/i

/** Under-5 words strong enough to overrule a school-age marker in the same text. */
const UNDER5_OVERRIDE = /\b(?:under[- ]?5|pre[- ]?school|toddler|baby|babies)\b/i

/**
 * Did the text POSITIVELY rule itself out, as opposed to saying nothing?
 *
 * This exists because inferAge returns NONE for both — a "60+ swim" and a
 * listing with no age field at all both come back {min: null, max: null}, so
 * classifyUnderFive reports 'unknown' for each and cannot tell them apart. That
 * is harmless while 'unknown' means "drop", but the moment 'unknown' means
 * "send it to an LLM to judge", it means paying a model to second-guess a
 * "Key Stage 2" marker the source stated plainly.
 *
 * Callers that route 'unknown' anywhere expensive must check this first. It is
 * the same two regexes inferAge applies, deliberately not re-derived.
 */
export function hasExclusionMarker(...parts: Array<string | null | undefined>): boolean {
  const text = parts.filter(Boolean).join(' ').toLowerCase()
  if (!text.trim()) return false
  if (SENIOR.test(text)) return true
  return SCHOOL_AGE.test(text) && !UNDER5_OVERRIDE.test(text)
}

export function inferAge(...parts: Array<string | null | undefined>): AgeRange {
  const text = parts.filter(Boolean).join(' ').toLowerCase()
  if (!text.trim()) return NONE

  if (SENIOR.test(text)) return NONE
  if (SCHOOL_AGE.test(text) && !UNDER5_OVERRIDE.test(text)) {
    return { min: null, max: null, confidence: 0 }
  }

  // --- Explicit ranges in months: "6-18 months", "3 to 24 months"
  const monthRange = text.match(/\b(\d{1,2})\s*(?:-|–|to)\s*(\d{1,2})\s*months?\b/)
  if (monthRange) {
    return { min: +monthRange[1], max: +monthRange[2], confidence: 1 }
  }

  // --- Mixed units: "18 months - 4 Years" (Unicorn Theatre's house style, and
  //     the most precise age data any source publishes).
  const mixed = text.match(/\b(\d{1,3})\s*months?\s*(?:-|–|to)\s*(\d{1,2})\s*(?:years?|yrs?)\b/)
  if (mixed) return { min: +mixed[1], max: +mixed[2] * 12, confidence: 1 }

  // --- Explicit ranges in years: "0-4 years", "1 to 5 yrs", "ages 2-4"
  const yearRange = text.match(/\b(\d{1,2})\s*(?:-|–|to)\s*(\d{1,2})\s*(?:years?|yrs?|y\/o)\b/)
    ?? text.match(/\bages?\s*(\d{1,2})\s*(?:-|–|to)\s*(\d{1,2})\b/)
  if (yearRange) {
    return { min: +yearRange[1] * 12, max: +yearRange[2] * 12, confidence: 1 }
  }

  // --- "Under 5s" / "under-3" / "under 2's"
  //
  // Scans ALL matches rather than the first, because a listing can carry both a
  // supervision clause and a genuine eligibility statement. Any match immediately
  // followed by supervision language is skipped as a chaperone rule.
  for (const m of text.matchAll(/\bunder[- ]?(\d{1,2})\b/g)) {
    const years = +m[1]
    if (years > 8) continue
    const tail = text.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 44)
    if (SUPERVISION_AFTER.test(tail)) continue
    return { min: 0, max: years * 12, confidence: 0.95 }
  }

  // --- "walking to under 3 yrs" (GLL phrasing)
  if (/\bwalking to under\s*(\d)\b/.test(text)) {
    const m = text.match(/\bwalking to under\s*(\d)\b/)!
    return { min: 12, max: +m[1] * 12, confidence: 0.9 }
  }

  // --- "0-5", "0 to 5" with no unit — years is the overwhelmingly common reading
  const bare = text.match(/\b0\s*(?:-|–|to)\s*([1-8])\b/)
  if (bare) return { min: 0, max: +bare[1] * 12, confidence: 0.75 }

  // --- Open-ended lower bounds: "4+", "Ages 16+", "18+ years only".
  //     Ubiquitous in theatre listings. Kept as {min, max: null}; the under-5
  //     gate then rejects anything starting above 5 years, so "16+" drops out
  //     while a genuinely suitable "4+" family show survives.
  const plus = text.match(/\b(?:ages?\s*)?(\d{1,2})\s*\+/)
  if (plus) return { min: +plus[1] * 12, max: null, confidence: 0.85 }

  // --- "All ages" — a family show, not an absence of information.
  if (/\ball[- ]ages?\b/.test(text)) return { min: 0, max: null, confidence: 0.5 }

  // --- "X months+" / "from 6 months"
  const fromMonths = text.match(/\b(?:from\s*)?(\d{1,2})\s*months?\s*(?:\+|plus|and (?:up|over))\b/)
    ?? text.match(/\bfrom\s*(\d{1,2})\s*months?\b/)
  if (fromMonths) return { min: +fromMonths[1], max: null, confidence: 0.8 }

  // --- Category words. Ranges are conventional, so confidence is capped.
  //     Ordered most-specific first; the first hit wins.
  const CATEGORY: Array<[RegExp, number, number, number]> = [
    [/\bnewborn|neonat/i,                          0,  6, 0.5],
    [/\bbaby massage|baby yoga|baby sensory\b/i,   0, 12, 0.6],
    [/\bbab(?:y|ies)\b/i,                          0, 18, 0.55],
    [/\bbounce (?:and|&) rhyme|rhyme ?time\b/i,    0, 48, 0.6],
    [/\bpre[- ]?school\b/i,                       24, 60, 0.6],
    [/\bparent (?:and|&) toddler|toddler group\b/i, 0, 48, 0.6],
    [/\btoddler|tots?\b/i,                        12, 48, 0.55],
    [/\bstay (?:and|&) play|soft play\b/i,         0, 60, 0.45],
    [/\bstory ?time\b/i,                            0, 60, 0.45],
    [/\bunder ?fives?\b/i,                          0, 60, 0.9],
  ]
  for (const [re, min, max, confidence] of CATEGORY) {
    if (re.test(text)) return { min, max, confidence }
  }

  return NONE
}

/**
 * The three answers the age data can actually give.
 *
 * 'admit'   — age data exists and it admits an under-5.
 * 'exclude' — age data exists and it rules the listing out.
 * 'unknown' — no age data was derivable at all.
 */
export type AgeVerdict = 'admit' | 'exclude' | 'unknown'

/**
 * Quality gate G4, stated honestly: does this listing plausibly serve under-5s?
 *
 * The distinction that matters here is between 'exclude' and 'unknown', because
 * they are not the same claim and were being treated as one.
 *
 * 'exclude' is EVIDENCE ABOUT THE AUDIENCE. The source said "16+", "Key Stage 2",
 * "60 plus"; we know who it is for and it is not us. Dropping it is free and
 * correct, and it is the overwhelming majority of what this gate rejects — the
 * OpenActive and library feeds are leisure-centre timetables full of adult swim
 * and gym sessions.
 *
 * 'unknown' is A GAP IN THE SOURCE. Nobody said anything about age. That is a
 * fact about the feed's metadata, not about the children who would be welcome.
 * Conflating the two is what was losing spektrix's theatre listings: 258 items
 * in recent runs, every single one of them dropped for having no age field
 * rather than for carrying a disqualifying one.
 *
 * 'unknown' is NOT an invitation to guess. Nothing in this file may infer an
 * audience from silence — the header's promise holds, a null is honest and a
 * guess is a listing a parent turns up to with the wrong-age child. The verdict
 * only marks an item as ELIGIBLE for a judgement made elsewhere and recorded as
 * such. Callers that do not want a judgement made must keep dropping 'unknown',
 * which is exactly what `isUnderFive` below does.
 */
export function classifyUnderFive(age: AgeRange): AgeVerdict {
  // Nothing was derivable. Says nothing either way.
  if (age.min === null && age.max === null) return 'unknown'

  const min = age.min ?? 0

  // Must admit a child of 5 or under. This is the load-bearing half of the test:
  // it drops "12+", "16+", "18+" theatre programming outright.
  if (min > 60) return 'exclude'

  // An open-ended upper bound ("4+", "All ages", "from 6 months") is a genuine
  // family listing — a 4-year-old really can attend a 4+ show.
  if (age.max === null) return 'admit'

  // A bounded range must not extend so far up that it is really a 5-12 activity
  // wearing an "all ages" label.
  return age.max <= 96 ? 'admit' : 'exclude'
}

/**
 * Quality gate G4 as a boolean: does this listing plausibly serve under-5s?
 * A listing with NO age data fails unless its category is inherently under-5.
 *
 * Delegates to `classifyUnderFive` rather than repeating its thresholds. Seven
 * adapters call this and only two are being moved onto the three-way verdict, so
 * the two forms have to stay in lockstep indefinitely — sharing one implementation
 * is the only way they can never drift.
 */
export function isUnderFive(age: AgeRange): boolean {
  // 'unknown' collapses back into false here, preserving today's behaviour
  // exactly for every caller that has not opted into judging the gaps.
  return classifyUnderFive(age) === 'admit'
}
