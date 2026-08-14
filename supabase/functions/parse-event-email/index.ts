// Parse an organiser's email into pending What's On events.
//
// Local organisers email GPC asking for a class or event to be featured. Today
// an admin retypes them into the What's On form. This turns that email into
// rows in `london_events` with `approved: false, source: 'email'`, which is
// exactly what the EXISTING Pending tab in LondonEventsManager already reviews.
// There is no new review UI and no new table — the approval queue is the queue.
//
// It is unrelated to `ingest-activities`/`discover-events` and to the
// newsletter advertiser parser, and shares no state with either.
//
// TWO THINGS THIS FILE IS CAREFUL ABOUT
//
// 1. NOTHING IS SILENTLY LOST. LondonEventsManager filters both tabs with
//    `e.is_recurring || !e.date || e.date >= today`, so a one-off row with a
//    past date inserts happily and is then invisible on every tab — the admin
//    never learns the email was parsed. So a past-dated one-off is NEVER
//    inserted; it comes back in `skipped` with its date and a reason, and the
//    admin decides (usually the model simply guessed the wrong year). Every
//    other rejection is reported the same way.
//
// 2. DATES STAY ON ONE CLOCK. `new Date(iso + 'T00:00:00')` is local midnight
//    and `.toISOString()` is UTC; mixing them lands a day early under any
//    positive offset. The helpers below parse and serialise with the same
//    local-clock components throughout, and "today" is read once off the
//    Europe/London wall clock. The addDays/nearestFriday in
//    _shared/newsletter-renderer.ts have exactly the defect described — they
//    are deliberately not used here.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { normalisePostcode, resolvePostcodes } from '../_shared/discovery/geo.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** A pasted email; generous, but not an open door. */
const MAX_EMAIL_CHARS = 50_000

/** The vocabulary What's On already uses (SubmitEventModal). */
const CATEGORIES = ['Family', 'Outdoor', 'Arts', 'Sports', 'Music', 'Food']

/** Values a model reaches for instead of just omitting a field. */
const NULLISH = new Set([
  '', 'null', 'nil', 'none', 'n/a', 'na', 'unknown', 'unspecified',
  'tbc', 'tbd', 'not specified', 'not stated', 'undefined', '-', '--',
])

const WEEKDAYS: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
}

/** Index matches WEEKDAYS' values, for warnings the admin has to read. */
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** Status carried out of validation so the catch-all can pick 400 vs 500. */
class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// ---------------------------------------------------------------------------
// Dates. Local clock in, local clock out — see the header note.
// ---------------------------------------------------------------------------

function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function shiftDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return toIso(d)
}

function dayOfWeek(iso: string): number {
  return new Date(iso + 'T00:00:00').getDay()
}

/**
 * Strict ISO parse. `new Date('2026-02-31T00:00:00')` silently rolls over to
 * 3 March, so the round-tripped components must match what was written.
 */
function parseIsoDate(raw: string | null): string | null {
  if (!raw) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim())
  if (!m) return null
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`)
  if (Number.isNaN(d.getTime())) return null
  if (d.getFullYear() !== Number(m[1])) return null
  if (d.getMonth() + 1 !== Number(m[2])) return null
  if (d.getDate() !== Number(m[3])) return null
  return `${m[1]}-${m[2]}-${m[3]}`
}

/** Today on the Europe/London wall clock, as YYYY-MM-DD (en-CA formats ISO). */
function londonToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** Next date falling on `dow`, counting `fromIso` itself. */
function nextOccurrence(dow: number, fromIso: string): string {
  return shiftDays(fromIso, (dow - dayOfWeek(fromIso) + 7) % 7)
}

// Whole-token day matching. A 3-character PREFIX test is not good enough here:
// "Monthly" starts with "mon", so a monthly coffee morning would be silently
// inserted as a WEEKLY Monday class and stand in the newsletter's regulars block
// for ever. The trailing \b is what rejects it — "mon" in "monthly" is followed
// by a word character, so the token never closes.
// Covers: sun/sunday(s), mon/monday(s), tue/tues/tuesday(s), wed/weds/wednesday(s),
// thu/thur/thurs/thursday(s), fri/friday(s), sat/sats/saturday(s).
const DAY_TOKEN = /\b(sun|mon|tues?|wed(?:nes)?|thur?s?|fri|sat(?:ur)?)(?:day)?s?\b/g

/**
 * Every weekday named in the string, in order, de-duplicated.
 * SUNDAY = 0, matching JS getDay() and migration 009's day_of_week convention.
 * Returns [] when nothing matches, so the caller can skip rather than guess.
 */
function toDaysOfWeek(raw: string | null): number[] {
  if (!raw) return []
  const found: number[] = []
  for (const m of raw.toLowerCase().matchAll(DAY_TOKEN)) {
    // Group 1 may be a long stem ("wednes", "satur", "thurs"); the first three
    // characters are the WEEKDAYS key in every case.
    const dow = WEEKDAYS[m[1].slice(0, 3)]
    if (dow !== undefined && !found.includes(dow)) found.push(dow)
  }
  return found
}

// ---------------------------------------------------------------------------
// Field hygiene. Nothing the model returns is trusted.
// ---------------------------------------------------------------------------

function clean(value: unknown, max: number): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' && Number.isFinite(value)) value = String(value)
  if (typeof value !== 'string') return null
  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (NULLISH.has(trimmed.toLowerCase())) return null
  return trimmed.slice(0, max)
}

/** Keep only real http(s) links; anything else is dropped with a warning. */
function cleanUrl(value: unknown, label: string, warnings: string[]): string | null {
  const raw = clean(value, 500)
  if (!raw) return null
  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('scheme')
    return raw
  } catch {
    warnings.push(`${label} "${raw}" is not a valid http(s) link — left blank`)
    return null
  }
}

/** Snap to the six categories What's On filters by, or leave blank. */
function cleanCategory(value: unknown, warnings: string[]): string | null {
  const raw = clean(value, 50)
  if (!raw) return null
  const match = CATEGORIES.find((c) => c.toLowerCase() === raw.toLowerCase())
  if (match) return match
  warnings.push(`category "${raw}" is not one of ${CATEGORIES.join('/')} — left blank`)
  return null
}

/**
 * '10am', '10.30 - 11:30am', '2-4pm' -> 'HH:MM' / 'HH:MM - HH:MM', the shape
 * the rest of the product writes. Anything unrecognisable is passed through as
 * the organiser wrote it rather than thrown away.
 */
function normaliseTime(value: unknown): string | null {
  const raw = clean(value, 60)
  if (!raw) return null

  const found: Array<{ h: number; m: number; mer: string | null }> = []
  const re = /(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(raw)) !== null && found.length < 2) {
    const h = Number(match[1])
    const m = match[2] ? Number(match[2]) : 0
    if (h > 23 || m > 59) return raw
    found.push({ h, m, mer: match[3] ? match[3].toLowerCase() : null })
  }
  if (found.length === 0) return raw

  // '2 - 4pm' means 14:00, not 02:00: a bare start hour before a pm end hour
  // that it cannot precede on a 12-hour clock inherits the pm.
  if (found.length === 2 && !found[0].mer && found[1].mer === 'pm' && found[0].h <= found[1].h) {
    found[0].mer = 'pm'
  }

  const out = found.map(({ h, m, mer }) => {
    if (mer === 'pm' && h < 12) h += 12
    if (mer === 'am' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  })
  return out.join(' - ')
}

function toBool(value: unknown, price: string | null): boolean {
  if (value === true) return true
  if (typeof value === 'string' && /^(true|yes|y|free)$/i.test(value.trim())) return true
  // "Price: Free" and is_free:false is a model slip, not an organiser's intent.
  if (price && /^free$/i.test(price.trim())) return true
  return false
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

function buildPrompt(emailText: string, today: string): string {
  const todayName = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'long',
  }).format(new Date())

  return `A local organiser has emailed Greenwich Parents & Carers asking for their event, class or group to be featured in our What's On listings. Extract every event they are asking us to list.

ONE EMAIL OFTEN CONTAINS SEVERAL SESSIONS — a baby class on Mondays and a toddler class on Wednesdays are TWO events; a half-term programme with three named workshops is THREE. Read the whole email, including any signature, footer or forwarded text, and return one object per distinct listing.

For each event return these fields:
- title: the name of the event or class
- description: a short description in the organiser's own words (no more than a couple of sentences)
- venue: the building or park name, e.g. "Greenwich Park", "Mycenae House"
- location: the street address or the fullest location text given
- postcode: the UK postcode, exactly as written
- area: the London borough, if the email names one
- url: a booking or information link
- image_url: a direct link to an image, only if the email gives one
- category: ONE of Family, Outdoor, Arts, Sports, Music, Food — pick the closest fit, or null if none fits
- age_range: the ages it is for, e.g. "0-4", "All ages"
- price: the price as written, e.g. "£5", "£8 per session", "Free"
- is_free: true only if it is explicitly free
- time: the time of day as written, e.g. "10:00 - 11:30", "10am"

For WHEN it happens, REPORT WHAT THE EMAIL SAYS — do not calculate anything:
- A ONE-OFF (a single dated event, e.g. "our summer fair is on 12 September"):
  set "date" to that date as YYYY-MM-DD, and leave "weekday" null.
- A WEEKLY REPEAT (e.g. "every Tuesday 10am", "Wednesdays in term time"):
  set "weekday" to the day name ("Tuesday"), leave "date" null, and put the
  time in "time". If the email says when the term or block STARTS, put that
  date in "start_date" as YYYY-MM-DD — do NOT put it in "date".
- If the email gives neither a date nor a repeating weekday, set all of them to null.

Today is ${today} (${todayName}). Use it to resolve relative phrases like "next Saturday", "this Thursday" or "starting next month". If the email names a day and month but no year, choose the year that makes the date fall on or after today.

Return null for anything the email does not say. NEVER invent a postcode, price, link, date or age range. It is far better to leave a field null than to guess it.

EMAIL:
${emailText}

Return ONLY a valid JSON array of event objects. No markdown, no explanation.`
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let body: any
    try {
      body = await req.json()
    } catch {
      throw new HttpError(400, 'Request body must be JSON: { emailText: string }')
    }

    const emailText = typeof body?.emailText === 'string' ? body.emailText.trim() : ''
    if (!emailText) {
      throw new HttpError(400, 'emailText is required')
    }
    if (emailText.length > MAX_EMAIL_CHARS) {
      throw new HttpError(400, `emailText is too long (${emailText.length} characters, max ${MAX_EMAIL_CHARS})`)
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      throw new HttpError(500, 'OPENAI_API_KEY is not configured')
    }

    const today = londonToday()

    // ---------------------------------------------------------------- extract
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        input: [
          {
            role: 'system',
            content: 'You are a helpful assistant that extracts structured event data from emails. Always respond with valid JSON arrays only, no markdown or extra text.',
          },
          { role: 'user', content: buildPrompt(emailText, today) },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new HttpError(500, `OpenAI API error: ${response.status} ${errorText.slice(0, 500)}`)
    }

    const result = await response.json()
    const messages = (result.output || []).filter((item: any) => item.type === 'message')
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage) {
      throw new HttpError(500, 'No message found in OpenAI response')
    }

    const content = lastMessage.content?.[0]?.text || ''
    if (!content) {
      throw new HttpError(500, 'No text content in OpenAI response')
    }

    let entries: any[]
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      entries = JSON.parse(cleaned)
    } catch {
      throw new HttpError(500, 'Failed to parse the OpenAI response as JSON')
    }
    if (!Array.isArray(entries)) {
      throw new HttpError(500, 'The OpenAI response was not a JSON array of events')
    }

    // --------------------------------------------------------------- validate
    interface Candidate {
      row: Record<string, unknown>
      warnings: string[]
      postcode: string | null
    }
    const candidates: Candidate[] = []
    const skipped: Array<{ title: string; date: string | null; reason: string }> = []

    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') {
        skipped.push({ title: '(unreadable)', date: null, reason: 'The model returned something that was not an event object' })
        continue
      }

      const warnings: string[] = []
      const title = clean(entry.title, 200)
      const rawDate = clean(entry.date, 40)
      const rawWeekday = clean(entry.weekday, 20)

      if (!title) {
        skipped.push({ title: '(untitled)', date: rawDate, reason: 'No event title found — `title` is NOT NULL' })
        continue
      }

      // -- when ------------------------------------------------------------
      // A weekday alone means a weekly regular. A date wins over a weekday when
      // both come back: a one-off shown once is a smaller mistake than a
      // one-off pinned to What's On for ever as a weekly class.
      const allDows = toDaysOfWeek(rawWeekday)
      const dow = allDows.length ? allDows[0] : null
      // london_events carries ONE day_of_week per row, so a class running on two
      // days ("Mondays and Wednesdays") can only be listed under the first. Say
      // so rather than dropping the second silently.
      if (allDows.length > 1) {
        warnings.push(
          `email mentioned ${allDows.length} days ("${rawWeekday}") — listed on ${DAY_NAMES[dow!]} only; ` +
          `add the other${allDows.length > 2 ? 's' : ''} as separate events if needed`
        )
      }
      // A weekday-shaped word that is not a day at all (the classic being
      // "Monthly") leaves allDows empty, so the entry falls through to the
      // skipped path with a reason instead of being guessed into a weekly slot.
      if (rawWeekday && !allDows.length) {
        warnings.push(`could not read "${rawWeekday}" as a day of the week`)
      }
      const statedDate = parseIsoDate(rawDate)
      if (rawDate && !statedDate) {
        warnings.push(`date "${rawDate}" was not a usable calendar date and was ignored`)
      }

      let date: string
      let isRecurring: boolean
      let dayOfWeekValue: number | null = null
      let recurringTime: string | null = null
      const time = normaliseTime(entry.time)

      if (statedDate && dow !== null) {
        warnings.push(`email also mentioned ${rawWeekday} — treated as a one-off on ${statedDate}; check whether it repeats weekly`)
      }

      if (statedDate) {
        // THE VISIBILITY TRAP: a past one-off inserts fine and is then hidden
        // on BOTH tabs. Report it instead of losing it.
        if (statedDate < today) {
          skipped.push({
            title,
            date: statedDate,
            reason: `Date has already passed (today is ${today}) — it would be invisible in the Pending tab, so it was not added. Check the year.`,
          })
          continue
        }
        date = statedDate
        isRecurring = false
      } else if (dow !== null) {
        // Recurring rows still need a real, non-past `date` (NOT NULL, and the
        // UI ignores it for regulars) — the convention `publish_activity` set
        // in migration 009. A stated start date is used when it is still ahead
        // and falls on the right weekday; otherwise the next occurrence,
        // counting today.
        const startDate = parseIsoDate(clean(entry.start_date, 40))
        date = startDate && startDate >= today && dayOfWeek(startDate) === dow
          ? startDate
          : nextOccurrence(dow, today)
        isRecurring = true
        dayOfWeekValue = dow
        recurringTime = time
        if (startDate && date !== startDate) {
          warnings.push(`stated start date "${startDate}" did not fall on a ${rawWeekday} on or after today — first listing set to ${date}`)
        }
      } else {
        skipped.push({
          title,
          date: rawDate,
          reason: 'No usable date and no repeating weekday found in the email',
        })
        continue
      }

      // -- location ---------------------------------------------------------
      const venue = clean(entry.venue, 200)
      const postcode = normalisePostcode(clean(entry.postcode, 20))
      const area = clean(entry.area, 100)
      // `location` is NOT NULL. Fall through the fields most likely to be
      // populated rather than letting the insert fail — as migration 009 does.
      const location = clean(entry.location, 300) || venue || postcode || area
      if (!location) {
        skipped.push({
          title,
          date,
          reason: 'No location, venue, postcode or area in the email — `location` is NOT NULL',
        })
        continue
      }

      const price = clean(entry.price, 100)

      candidates.push({
        warnings,
        postcode,
        row: {
          title,
          date,
          time,
          venue,
          location,
          postcode,
          area,
          lat: null,
          lng: null,
          description: clean(entry.description, 2000),
          url: cleanUrl(entry.url, 'link', warnings),
          image_url: cleanUrl(entry.image_url, 'image link', warnings),
          category: cleanCategory(entry.category, warnings),
          age_range: clean(entry.age_range, 100),
          price,
          is_free: toBool(entry.is_free, price),
          source: 'email',
          approved: false,
          is_recurring: isRecurring,
          day_of_week: dayOfWeekValue,
          recurring_time: recurringTime,
        },
      })
    }

    // ---------------------------------------------------------------- geocode
    // ONE batched postcodes.io lookup for every event in the email, not one per
    // event. It never throws; unresolvable postcodes are simply absent.
    const places = await resolvePostcodes(candidates.map((c) => c.postcode))
    const geocoded = new Map<Candidate, boolean>()

    for (const candidate of candidates) {
      const place = candidate.postcode ? places.get(candidate.postcode) : undefined
      if (place) {
        candidate.row.lat = place.lat
        candidate.row.lng = place.lng
        // The borough is only a fallback — an area the organiser stated wins.
        if (!candidate.row.area) candidate.row.area = place.borough || null
        geocoded.set(candidate, true)
      } else {
        geocoded.set(candidate, false)
        candidate.warnings.push(
          candidate.postcode
            ? `postcode ${candidate.postcode} could not be looked up — added without map coordinates`
            : 'no postcode in the email — added without map coordinates',
        )
      }
    }

    // ----------------------------------------------------------------- insert
    // ONE batch insert, because Postgres makes it a single round trip. It is
    // all-or-nothing though, so if it fails the rows are retried individually:
    // one malformed event must not take the rest of the email down with it.
    const inserted: Candidate[] = []
    if (candidates.length > 0) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      )

      const { error: batchError } = await supabase
        .from('london_events')
        .insert(candidates.map((c) => c.row))

      if (!batchError) {
        inserted.push(...candidates)
      } else {
        for (const candidate of candidates) {
          const { error } = await supabase.from('london_events').insert(candidate.row)
          if (error) {
            skipped.push({
              title: String(candidate.row.title),
              date: String(candidate.row.date),
              reason: `Database insert failed: ${error.message}`,
            })
          } else {
            inserted.push(candidate)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        inserted: inserted.length,
        events: inserted.map((c) => ({
          title: c.row.title,
          date: c.row.date,
          is_recurring: c.row.is_recurring,
          day_of_week: c.row.day_of_week,
          geocoded: geocoded.get(c) ?? false,
          warnings: c.warnings,
        })),
        // Never omitted: reporting what did NOT land is the whole point.
        skipped,
        raw_count: entries.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500
    const message = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
