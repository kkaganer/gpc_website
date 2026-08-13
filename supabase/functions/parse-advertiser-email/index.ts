import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// formatDateShort only — see the note above snapToFriday for why addDays and
// nearestFriday must NOT be used for the Friday invariant.
import { formatDateShort } from '../_shared/newsletter-renderer.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ---------- Contract ----------
//
// This function is a PURE EXTRACTOR + VALIDATOR. It writes nothing.
// The client renders an editable review of `entries` and performs the INSERT
// itself through the authenticated browser client (RLS allows it).
//
// POST { emailText: string }
//   200 { success: true, entries: ParsedEntry[], raw_count: number }
//   400 { success: false, error: string }   bad input
//   500 { success: false, error: string }   model / server failure

const AD_TYPES = ['free-listing', 'featured-ad', 'logo-sponsor'] as const
type AdType = (typeof AD_TYPES)[number]

type ParsedEntry = {
  advertiser_name: string | null
  contact_email: string | null
  event_title: string | null
  event_description: string | null
  event_url: string | null
  image_url: string | null
  ad_type: AdType
  newsletter_date: string // ALWAYS 'YYYY-MM-DD' AND ALWAYS A FRIDAY
  notes: string | null
  warnings: string[]
  missing: string[] // 'advertiser_name' | 'event_title'
  duplicate_of: { id: string; status: string; ad_type: string } | null
}

// Length caps so one bad parse cannot produce a megabyte field.
const FIELD_LIMITS = {
  advertiser_name: 200,
  contact_email: 320,
  event_title: 300,
  event_description: 4000,
  event_url: 2048,
  image_url: 2048,
  notes: 2000,
}

const MAX_EMAIL_CHARS = 100_000
// Runaway-output guard. raw_count still reports what the model actually returned,
// so the admin can see when this trips.
const MAX_ENTRIES = 100

class RequestError extends Error {
  status: number
  constructor(message: string, status = 500) {
    super(message)
    this.status = status
  }
}

// ---------- Date handling ----------
//
// THE FRIDAY INVARIANT.
// resolveData.ts pulls advertisers with `.eq('newsletter_date', weekOfIso)` — an
// EXACT match against a Friday. A newsletter_date that is off by a single day can
// never match any newsletter, silently and permanently. So every entry we return
// is snapped to a Friday here, and the move is reported as a warning.
//
// Why not reuse addDays()/nearestFriday() from _shared/newsletter-renderer.ts —
// TWO independent reasons, both fatal here:
//
// 1. DIRECTION. nearestFriday snaps FORWARD only ((5 - dow + 7) % 7). That is
//    right for "which newsletter am I building from today", but wrong for an
//    advertiser's requested date — someone writing "Saturday the 15th" meant the
//    Friday-14th edition that just closed the week, not the 21st a week later.
//    snapToFriday moves in EITHER direction.
//
// 2. TIMEZONE. Both helpers parse with `new Date(iso + 'T00:00:00')` — LOCAL
//    midnight — and then serialize with `.toISOString()` — UTC. In any zone with
//    a positive UTC offset those are different days, so the result lands one day
//    early: at Europe/London in August every non-Friday input would come back a
//    THURSDAY, which is precisely the orphaned-date defect this function exists
//    to eliminate. Supabase's deployed runtime is UTC so it would happen to work
//    in production, but the invariant must not rest on an unstated assumption
//    about the server clock — `supabase functions serve` on a local machine would
//    silently write Thursdays. So we parse and format on the SAME clock (local)
//    via toIso/shiftDays below, which is correct under every timezone.
//    formatDateShort is still imported: it is local-parse and local-format, so it
//    is internally consistent and display-only.

function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Shift a calendar date by whole days, staying on the local clock throughout.
// The shared addDays() cannot be used here — it round-trips through toISOString().
function shiftDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toIso(d)
}

function dayOfWeek(iso: string): number {
  return new Date(iso + 'T00:00:00').getDay() // 0 Sun .. 5 Fri .. 6 Sat
}

// Accepts a leading YYYY-MM-DD (the model is told to emit exactly that) and
// rejects impossible dates like 2026-02-31 that Date would silently roll over.
function parseIsoDate(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const [, y, mo, da] = m
  const d = new Date(`${y}-${mo}-${da}T00:00:00`)
  if (Number.isNaN(d.getTime())) return null
  if (d.getFullYear() !== +y || d.getMonth() + 1 !== +mo || d.getDate() !== +da) return null
  return `${y}-${mo}-${da}`
}

type SnapResult = { date: string; warning: string | null }

function snapToFriday(value: unknown, todayIso: string): SnapResult {
  const iso = parseIsoDate(value)

  if (!iso) {
    // Forward-only is correct for this case: with no date in the email, the ad
    // belongs in the next newsletter that has not gone out yet.
    const fallback = shiftDays(todayIso, (5 - dayOfWeek(todayIso) + 7) % 7)
    const had = typeof value === 'string' && value.trim().length > 0
    return {
      date: fallback,
      warning: had
        ? `Could not read the requested date ("${truncate(String(value).trim(), 60)}") — defaulted to the next newsletter, ${formatDateShort(fallback)}. Check this.`
        : `No newsletter date found in the email — defaulted to the next newsletter, ${formatDateShort(fallback)}. Check this.`,
    }
  }

  const dow = dayOfWeek(iso)
  if (dow === 5) return { date: iso, warning: null }

  const forward = (5 - dow + 7) % 7 // days ahead to the next Friday
  const backward = (dow - 5 + 7) % 7 // days back to the previous Friday

  // Tie-break: prefer the LATER Friday, i.e. move forward when the two distances
  // are equal. On a 7-day cycle the only exact tie is distance 0 (already Friday,
  // returned above), so in practice this decides the Mon/Tue boundary the same way
  // strict comparison would: Mon (4 fwd / 3 back) snaps back to the Friday just
  // gone, Tue (3 fwd / 4 back) snaps forward to the Friday coming.
  const snapped = forward <= backward ? shiftDays(iso, forward) : shiftDays(iso, -backward)

  // Belt and braces. Everything downstream — the client's insert, and
  // resolveData.ts's `.eq('newsletter_date', weekOfIso)` — trusts this to be a
  // Friday, and a violation would be invisible until an advertiser silently
  // failed to appear in a newsletter. If this ever fires it is a bug here, not
  // bad data, so fail loudly rather than write a date that can never match.
  if (dayOfWeek(snapped) !== 5) {
    throw new RequestError(
      `Internal date error: snapped ${iso} to ${snapped}, which is not a Friday.`,
      500
    )
  }

  return {
    date: snapped,
    warning: `Date moved from ${formatDateShort(iso)} to ${formatDateShort(snapped)} — newsletters go out on Fridays.`,
  }
}

// ---------- Field validation ----------

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) : s
}

// Trims, coerces empty strings and the model's stray "null"/"n/a" strings to null,
// and caps length. Returns the cleaned value plus a warning when it was truncated.
function cleanString(value: unknown, max: number, label: string): { value: string | null; warning: string | null } {
  if (value === null || value === undefined) return { value: null, warning: null }
  if (typeof value === 'object') return { value: null, warning: null }

  const s = String(value).trim()
  if (!s) return { value: null, warning: null }
  if (['null', 'undefined', 'n/a', 'na', 'none', 'unknown'].includes(s.toLowerCase())) {
    return { value: null, warning: null }
  }

  if (s.length > max) {
    return { value: truncate(s, max), warning: `${label} was longer than ${max} characters and has been truncated.` }
  }
  return { value: s, warning: null }
}

function cleanUrl(value: unknown, max: number, label: string): { value: string | null; warning: string | null } {
  const { value: s, warning } = cleanString(value, max, label)
  if (!s) return { value: null, warning }

  try {
    const url = new URL(s)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('bad protocol')
    return { value: s, warning }
  } catch {
    return {
      value: null,
      warning: `${label} was not a valid http(s) URL and has been cleared. The email said: "${truncate(s, 120)}"`,
    }
  }
}

function cleanEmail(value: unknown): { value: string | null; warning: string | null } {
  const { value: s, warning } = cleanString(value, FIELD_LIMITS.contact_email, 'Contact email')
  if (!s) return { value: null, warning }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
    return { value: null, warning: `Contact email did not look like an address and has been cleared. The email said: "${truncate(s, 120)}"` }
  }
  return { value: s, warning }
}

function normaliseAdType(value: unknown): { value: AdType; warning: string | null } {
  if (value === null || value === undefined || value === '') return { value: 'free-listing', warning: null }

  const raw = String(value).trim()
  const key = raw.toLowerCase().replace(/[\s_]+/g, '-')
  if ((AD_TYPES as readonly string[]).includes(key)) return { value: key as AdType, warning: null }

  return {
    value: 'free-listing',
    warning: `Ad type "${truncate(raw, 60)}" is not one of free-listing / featured-ad / logo-sponsor — defaulted to free-listing.`,
  }
}

// Key used for in-memory dedup matching: same newsletter_date, same advertiser and
// same event title, compared case-insensitively with whitespace collapsed.
function dedupKey(dateIso: string, advertiser: string, title: string): string {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
  return `${dateIso}|${norm(advertiser)}|${norm(title)}`
}

// ---------- Prompt ----------

function buildPrompt(emailText: string, todayIso: string): string {
  return `Extract advertiser event requests from this email thread. The email is from an advertiser asking to have their events included in a weekly newsletter for parents and carers in Greenwich, sent every Friday. Today is ${todayIso}.

For each event mentioned, extract:
- advertiser_name: the company/person requesting (look at the email signature or who they represent)
- contact_email: their email address
- event_title: the name of the event they want advertised
- event_description: any description or details about the event
- event_url: any URL/link for the event (booking page, event page)
- image_url: any logo or image URL they offer for the ad
- ad_type: what kind of placement they are asking for. Return EXACTLY one of these three strings:
    "featured-ad"   - a paid, featured, promoted or "presenting" slot
    "logo-sponsor"  - logo placement, sponsorship or a "supporter" slot
    "free-listing"  - a plain request to be listed
  Choose "free-listing" whenever it is unclear.
- newsletter_date: your best ISO date (YYYY-MM-DD) for the edition they want to appear in. Do NOT try to work out which day is a Friday — just give the date they are talking about. The server does the Friday arithmetic.
- notes: anything the admin would want to know that does not fit another field, e.g. a budget mentioned, a deadline, "will send artwork later", a question they asked. Use null when there is nothing.

Rules:
- Return null for any field the email does not tell you. Do NOT invent, guess or infer values that are not there.
- Return a JSON array of objects. Each object = one event to advertise. If several events are mentioned for different dates or months, create a separate entry for each.
- If the thread contains replies, use the most recent information for each event rather than repeating an entry per reply.

EMAIL:
${emailText}

Return ONLY a valid JSON array. No markdown, no explanation.`
}

// ---------- Handler ----------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      throw new RequestError('Request body must be JSON of the shape { emailText }', 400)
    }

    const emailText = (body as { emailText?: unknown }).emailText
    if (!emailText || typeof emailText !== 'string' || !emailText.trim()) {
      throw new RequestError('emailText is required and must be a non-empty string', 400)
    }
    if (emailText.length > MAX_EMAIL_CHARS) {
      throw new RequestError(
        `emailText is ${emailText.length} characters, which is over the ${MAX_EMAIL_CHARS} limit. Paste a smaller portion of the thread.`,
        400
      )
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      throw new RequestError('OPENAI_API_KEY is not configured on this project', 500)
    }

    // Service-role client. Used ONLY for the read-only dedup lookup below —
    // this function inserts nothing.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const todayIso = new Date().toISOString().split('T')[0]

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
            content: 'You are a helpful assistant that extracts structured data from emails. Always respond with valid JSON arrays only, no markdown or extra text.',
          },
          { role: 'user', content: buildPrompt(emailText, todayIso) },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new RequestError(`OpenAI API error: ${response.status} ${errorText}`, 500)
    }

    const result = await response.json()

    // Extract text from the message
    const messages = (result.output || []).filter((item: any) => item.type === 'message')
    const lastMessage = messages[messages.length - 1]

    if (!lastMessage) {
      throw new RequestError('OpenAI returned no message to read (empty output)', 500)
    }

    const content = lastMessage.content?.[0]?.text || ''
    if (!content) {
      throw new RequestError('OpenAI returned a message with no text content', 500)
    }

    let rawEntries: unknown
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      rawEntries = JSON.parse(cleaned)
    } catch {
      throw new RequestError('Failed to parse the OpenAI response as JSON', 500)
    }

    if (!Array.isArray(rawEntries)) {
      throw new RequestError('OpenAI response was valid JSON but not an array of entries', 500)
    }

    const rawCount = rawEntries.length

    // ---------- Validate ----------
    // Nothing is ever dropped. An entry the old code would have skipped comes back
    // with `missing` populated so the admin can see it and fill it in.
    const entries: ParsedEntry[] = rawEntries.slice(0, MAX_ENTRIES).map((raw): ParsedEntry => {
      const warnings: string[] = []
      const missing: string[] = []

      // A non-object in the array still becomes an entry — an empty one the admin can see.
      const src = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        warnings.push('The model returned something that was not an event object here. Fill this in by hand or remove it.')
      }

      const push = (w: string | null) => {
        if (w) warnings.push(w)
      }

      const name = cleanString(src.advertiser_name, FIELD_LIMITS.advertiser_name, 'Advertiser name')
      push(name.warning)
      const title = cleanString(src.event_title, FIELD_LIMITS.event_title, 'Event title')
      push(title.warning)
      const description = cleanString(src.event_description, FIELD_LIMITS.event_description, 'Event description')
      push(description.warning)
      const notes = cleanString(src.notes, FIELD_LIMITS.notes, 'Notes')
      push(notes.warning)
      const email = cleanEmail(src.contact_email)
      push(email.warning)
      const eventUrl = cleanUrl(src.event_url, FIELD_LIMITS.event_url, 'Event URL')
      push(eventUrl.warning)
      const imageUrl = cleanUrl(src.image_url, FIELD_LIMITS.image_url, 'Image URL')
      push(imageUrl.warning)
      const adType = normaliseAdType(src.ad_type)
      push(adType.warning)

      // The single most important line in this function: a non-Friday date orphans
      // the advertiser from every newsletter, forever and silently.
      const snapped = snapToFriday(src.newsletter_date, todayIso)
      push(snapped.warning)

      if (!name.value) missing.push('advertiser_name')
      if (!title.value) missing.push('event_title')

      return {
        advertiser_name: name.value,
        contact_email: email.value,
        event_title: title.value,
        event_description: description.value,
        event_url: eventUrl.value,
        image_url: imageUrl.value,
        ad_type: adType.value,
        newsletter_date: snapped.date,
        notes: notes.value,
        warnings,
        missing,
        duplicate_of: null,
      }
    })

    if (rawCount > MAX_ENTRIES && entries.length > 0) {
      entries[entries.length - 1].warnings.push(
        `The model returned ${rawCount} entries; only the first ${MAX_ENTRIES} are shown. Parse the rest of the thread separately.`
      )
    }

    // ---------- Dedup ----------
    // One round trip: fetch every existing row on any of the candidate Fridays
    // (usually one or two dates), then match in memory on
    // newsletter_date + advertiser_name + event_title, case-insensitively.
    // No unique constraint exists on purpose — legitimate re-bookings happen — so
    // this is advisory only and the admin decides in the review step.
    const candidateDates = [...new Set(entries.map((e) => e.newsletter_date))]
    const dedupable = entries.filter((e) => e.advertiser_name && e.event_title)

    if (candidateDates.length > 0 && dedupable.length > 0) {
      const { data: existing, error: dedupError } = await supabase
        .from('newsletter_advertisers')
        .select('id, status, ad_type, advertiser_name, event_title, newsletter_date')
        .in('newsletter_date', candidateDates)

      if (dedupError) {
        // A failed dedup lookup must not fail the whole parse — but it must not be
        // silent either, so every candidate entry says so.
        console.error('Dedup lookup failed:', dedupError.message)
        for (const entry of dedupable) {
          entry.warnings.push('Could not check for existing duplicates — check the advertiser list by hand before adding.')
        }
      } else {
        const byKey = new Map<string, { id: string; status: string; ad_type: string }>()
        for (const row of existing || []) {
          const key = dedupKey(
            String(row.newsletter_date || ''),
            String(row.advertiser_name || ''),
            String(row.event_title || '')
          )
          // First match wins — keep the earliest row we saw for a given key.
          if (!byKey.has(key)) {
            byKey.set(key, { id: row.id, status: row.status, ad_type: row.ad_type })
          }
        }

        for (const entry of dedupable) {
          const match = byKey.get(
            dedupKey(entry.newsletter_date, entry.advertiser_name || '', entry.event_title || '')
          )
          entry.duplicate_of = match || null
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, entries, raw_count: rawCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const status = error instanceof RequestError ? error.status : 500
    const message = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
