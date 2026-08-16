// LLM long-tail discovery — OpenAI web search, area fan-out, nano verification.
//
// The nine open feeds cover institutions: leisure centres, libraries, theatres,
// family hubs. They structurally cannot reach the long tail — a church-hall
// toddler group with one page, an independent baby class, a one-off pop-up.
// That tail is ~22% of under-5 supply. This adapter targets only that.
//
// EVERYTHING HERE WAS CHOSEN BY MEASUREMENT, not assumption. Five evaluation
// rounds x four prompts, then a fan-out trial (see `model_evaluations`):
//
//   baseline (generic "family events in SE London")   0.0 novel-valid / run
//   long_tail                                          1.8
//   under5_specific                                    0.8
//   search_harder (single call)                        4.4
//   area_scoped FAN-OUT (6 calls)                     20.0   <- this
//
// The baseline prompt returned 7.6 plausible events per run of which ZERO were
// under-5 — a direct reproduction of the defect this platform exists to fix.
//
// WHY FAN OUT IN CODE. The model issued exactly ONE web_search call per run no
// matter how forcefully the prompt demanded six. Search breadth cannot be bought
// with wording, so it is bought with control flow: one request per area. That
// also lifted working-link rate from ~62% to 89%, because an area-scoped query
// surfaces real venue pages rather than aggregator guesses.
//
// WHY gpt-4.1-mini FOR SEARCH. Web search requires the Responses API with
// gpt-5.6/5.5/5.4/4.1/4.1-mini — the nano tier has no live data at all. Since the
// $0.01-per-search fee dominates cost, a larger model only moves the remainder.
//
// WHY gpt-5-nano FOR VERIFY. Reading a fetched page and correcting date/postcode
// is pure extraction, the cheapest possible LLM task, at $0.05/$0.40 per MTok —
// ~17x cheaper than Haiku 4.5 for identical work.

import type { Adapter, AdapterContext, AdapterResult, ActivityDraft } from '../types.ts'
import { resolvePostcodes, normalisePostcode, passesArea, type AreaPolicy } from '../geo.ts'
import { inferAge, isUnderFive } from '../age.ts'
import { inferTermTime } from '../term-time.ts'

const SEARCH_MODEL = 'gpt-4.1-mini'
const VERIFY_MODEL = 'gpt-5-nano'

/** Areas are rotated across runs so one invocation stays inside its budget. */
export const AREAS = [
  'Greenwich and Charlton, London',
  'Deptford and New Cross, London',
  'Lewisham and Catford, London',
  'Blackheath and Lee, London',
  'Woolwich and Plumstead, London',
  'Eltham and Mottingham, London',
]

// Hosts already covered by the nine open feeds. A live run returned a Catford
// Library event and a better.org.uk Family Hub drop-in despite the prompt
// naming both as excluded — and the Better one PASSED every gate and counted as
// a novel find, because novelty is judged against `activities` and the feeds had
// not yet ingested that particular session.
//
// A negative instruction in prose is advisory; a host match is enforceable. This
// list is the enforcement, and the prompt's version of it is only a hint that
// saves tokens when it happens to work. Checked BEFORE stage 2, so an excluded
// result never costs a page fetch or a verify call.
const EXCLUDED_HOSTS = [
  'better.org.uk',           // Better / GLL leisure centres and children's centres
  'mylibrary.digital',       // council library event platforms (all boroughs)
  'classforkids.co.uk',      // ClassForKids — its own adapter
  'bookwhen.com',            // Bookwhen — its own adapter
  'thealbany.org.uk',        // Spektrix venues, below
  'greenwichtheatre.org.uk',
  'woolwich.works',
  'blackheathhalls.com',
  'unicorntheatre.com',
]

/** Suffix match, so subdomains (lewisham.events.mylibrary.digital) are caught. */
function isExcludedHost(url: string | undefined): boolean {
  if (!url) return false
  let host: string
  try {
    host = new URL(url).hostname.toLowerCase()
  } catch {
    return false // Not a parseable URL; the link gate deals with it later.
  }
  return EXCLUDED_HOSTS.some((h) => host === h || host.endsWith('.' + h))
}

const SEARCH_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['events'],
  properties: {
    events: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        // OpenAI strict mode requires EVERY property in `required`; optionality
        // is expressed as a nullable type, never by omission.
        required: ['title', 'venue', 'postcode', 'date', 'start_time', 'url', 'price', 'age_text'],
        properties: {
          title: { type: 'string' },
          venue: { type: 'string' },
          postcode: { type: 'string' },
          date: { type: 'string' },
          start_time: { type: ['string', 'null'] },
          url: { type: 'string' },
          price: { type: ['string', 'null'] },
          age_text: { type: ['string', 'null'] },
        },
      },
    },
  },
}

const VERIFY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['verdicts'],
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['index', 'confirmed', 'date', 'start_time', 'postcode', 'age_min_months', 'age_max_months'],
        properties: {
          index: { type: 'integer' },
          // false when the page does not actually show this event in the window.
          confirmed: { type: 'boolean' },
          date: { type: ['string', 'null'] },
          start_time: { type: ['string', 'null'] },
          postcode: { type: ['string', 'null'] },
          age_min_months: { type: ['integer', 'null'] },
          age_max_months: { type: ['integer', 'null'] },
        },
      },
    },
  },
}

// Revised after reading a live run, then A/B'd against the old prompt on the
// same window (run_label 'ab-v1-vs-v2', 6 areas each, both at $0.10).
//
//   old: 29 returned, 20 novel-valid, $0.00515 per novel-valid
//   new: 46 returned, 23 novel-valid, $0.00460 per novel-valid
//
// More yield for the same money, so it stays — but the per-change results are
// worth recording honestly, because two of the three barely moved and one did
// not work at all. THE CODE BELOW IS WHAT ACTUALLY ENFORCES THIS. The prompt is
// a hint that sometimes saves a page fetch.
//
//  1. Excluded sources as LINK DOMAINS rather than brand names.
//     PARTIAL: leaked results fell 2/29 -> 1/46. Still leaking, so EXCLUDED_HOSTS
//     does the real work. Worth keeping only because a result the model never
//     returns costs nothing to filter.
//  2. Date window RESTATED LAST as a hard filter.
//     PARTIAL: violations fell 2/29 -> 1/46. The out-of-window date gate in
//     stage 3 remains the guarantee.
//  3. ONE ENTRY PER GROUP rather than one per session.
//     FAILED. Repeated groups went from 3 (16 extra rows) to 6 (20 extra rows).
//     The model enumerates sessions no matter how it is asked. The instruction
//     is kept because the extras-per-row RATE did improve (55% -> 43%) and it
//     costs a few tokens, but the URL-keyed dedup below is what stops the
//     duplicates reaching the paid verify stage.
//
// Also measured and worth knowing: age_text came back populated on 46/46 and
// 29/29 entries. The model is NOT withholding age information, so under-5
// rejections are inferAge()/isUnderFive() reading it, not the prompt failing to
// ask. Do not try to fix that here.
function searchPrompt(area: string, from: string, to: string): string {
  return `
Find events and regular groups for children UNDER 5 and their parents/carers in
${area}, running between ${from} and ${to}.

Search specifically within ${area} — do not broaden to other areas.

WHAT WE ALREADY HAVE — do not return anything whose link is on these domains:
better.org.uk, any *.mylibrary.digital site, classforkids.co.uk, bookwhen.com,
thealbany.org.uk, greenwichtheatre.org.uk, woolwich.works, blackheathhalls.com,
unicorntheatre.com. These are already covered by our own data feeds, so a result
from any of them is worth nothing to us no matter how good the event is.

WHAT WE WANT instead is the long tail those feeds cannot reach: church and
community-hall parent-and-toddler groups, stay-and-play sessions, independent
baby classes, children's centres, pop-ups and parent-network meetups.

ONE ENTRY PER GROUP. If something runs weekly or repeatedly, return it ONCE,
using its FIRST date inside the window — do not list the same group again for
each of its other dates. Two genuinely different groups at the same venue are
two entries; the same group on Tuesday and Thursday is one.

For each entry give: title, venue, full UK postcode, date (YYYY-MM-DD), start
time, a direct link to that specific group or event page (not a site homepage),
price, and the age range. Give the age range as the page states it, and leave it
null if the page does not say — do not guess, we would rather know it is unknown.
Only include entries with a real working link, and omit anything aimed at 5s and
over or anything you are not confident is genuinely running.

Finally, check every date before answering: it must fall between ${from} and
${to} inclusive. If a group's next session is outside that window, omit the entry
entirely — do not adjust its date to fit.`.trim()
}

interface Candidate {
  title?: string; venue?: string; postcode?: string; date?: string
  start_time?: string | null; url?: string; price?: string | null; age_text?: string | null
}

async function openai(key: string, body: unknown, timeoutMs: number): Promise<any | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    return res.ok ? json : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function textOf(json: any): string {
  return (json?.output ?? [])
    .flatMap((o: any) => o?.content ?? [])
    .map((c: any) => c?.text)
    .filter(Boolean)
    .join('')
}

/** Fetch a page and reduce it to readable text for the verifier. */
async function pageText(url: string): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'GPC-Discovery/1.0 (+https://greenwichparents.co.uk; verification)' },
    })
    if (!res.ok) return null
    const html = await res.text()
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000)
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export const llmDiscoveryAdapter: Adapter = async (ctx: AdapterContext): Promise<AdapterResult> => {
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) throw new Error('OPENAI_API_KEY is not configured')

  const policy = (ctx.config.area_policy as AreaPolicy) ?? 'london'
  const areasPerRun = Number(ctx.config.areas_per_run ?? 2)
  const horizonDays = Number(ctx.config.horizon_days ?? 7)

  // Rotate through the areas across runs. Six areas in one invocation would
  // blow the edge-function wall clock alongside the nine feed adapters, so the
  // cursor records where the last run stopped and this one resumes.
  const start = Number.parseInt(ctx.cursor ?? '0', 10) || 0
  const chosen: string[] = []
  for (let i = 0; i < Math.min(areasPerRun, AREAS.length); i++) {
    chosen.push(AREAS[(start + i) % AREAS.length])
  }
  const nextCursor = String((start + chosen.length) % AREAS.length)

  const today = new Date()
  const from = today.toISOString().slice(0, 10)
  const to = new Date(today.getTime() + horizonDays * 86_400_000).toISOString().slice(0, 10)

  const stats: Record<string, number> = {
    areas: 0, returned: 0, deduped: 0,
    // Results dropped for being on a feed we already ingest. Worth its own
    // counter rather than folding into `deduped`: a number that stays high run
    // after run means the prompt's exclusion list has stopped working, and that
    // is a prompt problem, not a data problem.
    excluded_host: 0,
    // Split so a bad run is diagnosable: an unfetchable page, a verifier that
    // rejected the claim, and a verifier call that itself failed are three very
    // different problems and were previously all counted as "unverified".
    no_page: 0, rejected: 0, verify_failed: 0,
    bad_postcode: 0, out_of_area: 0, not_under5: 0, bad_date: 0,
  }

  // ---- stage 1: search, one request per area -------------------------------
  const raw: Candidate[] = []
  for (const area of chosen) {
    if (Date.now() > ctx.deadline) break
    const json = await openai(key, {
      model: SEARCH_MODEL,
      input: searchPrompt(area, from, to),
      tools: [{ type: 'web_search', search_context_size: 'medium' }],
      text: { format: { type: 'json_schema', name: 'events', schema: SEARCH_SCHEMA, strict: true } },
    }, 60_000)
    if (!json) continue
    stats.areas++
    try {
      raw.push(...(JSON.parse(textOf(json) || '{}')?.events ?? []))
    } catch { /* a malformed area response shouldn't lose the others */ }
  }
  stats.returned = raw.length

  // Drop excluded hosts FIRST, before anything is paid for. The prompt asks for
  // this too, but a live run proved the ask alone is not enough — and an excluded
  // result is worse than useless: it can pass every gate and be counted as a
  // novel find, because novelty is judged against `activities`, which will not
  // hold that particular session until the owning feed next ingests it.
  const allowed = raw.filter((c) => {
    if (isExcludedHost(c.url)) { stats.excluded_host++; return false }
    return true
  })

  // Areas overlap at their edges, so collapse before doing any paid work.
  //
  // The key is URL-first and DELIBERATELY DATE-FREE. `source_uid` is
  // `llm:<url>`, so two rows for the same page collapse into one activity at
  // write time no matter what — but only AFTER stage 2 has fetched and verified
  // that page once per copy. Including the date here (as this did) meant the
  // same weekly group returned on three dates cost three page fetches and three
  // verify calls to produce one activity. Collapsing on the identity the
  // database will actually use keeps the paid work proportional to the output.
  //
  // Sort by date first so the copy we keep is the EARLIEST in the window, which
  // is what the prompt asks the model for and the most useful next session to
  // show. Without this the survivor was whichever the model happened to list.
  const ordered = [...allowed].sort((a, b) => String(a.date ?? '').localeCompare(String(b.date ?? '')))
  const seen = new Set<string>()
  const candidates = ordered.filter((c) => {
    const k = c.url
      ? `u|${c.url.trim().toLowerCase()}`
      // No URL means the link gate will drop it anyway; fall back to the old
      // shape so an untitled/urlless pair still cannot both survive.
      : `t|${(c.title ?? '').toLowerCase().trim()}|${(c.postcode ?? '').replace(/\s/g, '').toUpperCase()}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  stats.deduped = allowed.length - candidates.length

  // ---- stage 2: fetch each page, verify the batch with nano ----------------
  //
  // The model's own output is a claim, not evidence: measured link-failure ran
  // at ~11% even on the best prompt, and dates drift. Fetching the page and
  // asking a cheap model to confirm turns a claim into something checked.
  const pages = await Promise.all(
    candidates.map(async (c) => (c.url ? await pageText(c.url) : null)),
  )

  const verifiable = candidates
    .map((c, i) => ({ c, i, text: pages[i] }))
    .filter((x) => x.text)

  stats.no_page = candidates.length - verifiable.length

  const verdicts = new Map<number, any>()
  let verifyRan = false
  if (verifiable.length && Date.now() < ctx.deadline) {
    const payload = verifiable.map((x) => ({
      index: x.i,
      claimed: { title: x.c.title, date: x.c.date, start_time: x.c.start_time, postcode: x.c.postcode },
      page_text: x.text,
    }))
    const json = await openai(key, {
      model: VERIFY_MODEL,
      input: `For each item, read page_text and decide whether it really shows the claimed event happening between ${from} and ${to}.
Set confirmed=false if the page does not show this event in that window, or is a generic homepage.
Correct date (YYYY-MM-DD), start_time (HH:MM) and the full UK postcode from the page where possible.
Give the age range the session admits in MONTHS (e.g. "0-4 years" -> 0 and 48); use null if the page does not say.

${JSON.stringify(payload)}`,
      text: { format: { type: 'json_schema', name: 'verdicts', schema: VERIFY_SCHEMA, strict: true } },
    }, 60_000)
    if (json) {
      try {
        for (const v of JSON.parse(textOf(json) || '{}')?.verdicts ?? []) verdicts.set(v.index, v)
        verifyRan = verdicts.size > 0
      } catch { /* verifyRan stays false -> degrade, see below */ }
    }
    if (!verifyRan) stats.verify_failed = verifiable.length
  }

  // ---- stage 3: gate and build --------------------------------------------
  const withPostcode = candidates.map((c, i) => {
    const v = verdicts.get(i)
    return { c, i, v, postcode: normalisePostcode(v?.postcode ?? c.postcode) }
  })
  const resolved = await resolvePostcodes(withPostcode.map((x) => x.postcode))

  const activities: ActivityDraft[] = []
  for (const { c, i, v, postcode } of withPostcode) {
    // Verification RAISES precision; it must not silently zero the yield when
    // it fails. If the verify call itself did not return usable verdicts, fall
    // back to "the page fetched successfully" as weaker evidence rather than
    // discarding everything the search found.
    if (verifyRan) {
      if (!v || v.confirmed !== true) { stats.rejected++; continue }
    } else if (!pages[i]) {
      stats.no_page++
      continue
    }
    if (!postcode) { stats.bad_postcode++; continue }

    const place = resolved.get(postcode)
    if (!place || !passesArea(place, policy)) { stats.out_of_area++; continue }

    const date = (v.date ?? c.date ?? '').slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < from || date > to) { stats.bad_date++; continue }

    // Prefer the verifier's months; fall back to inference over the text.
    let min = typeof v.age_min_months === 'number' ? v.age_min_months : null
    let max = typeof v.age_max_months === 'number' ? v.age_max_months : null
    if (min === null && max === null) {
      const a = inferAge(c.title, c.age_text)
      min = a.min; max = a.max
    }
    if (!isUnderFive({ min, max, confidence: 1 })) { stats.not_under5++; continue }

    const time = (v.start_time ?? c.start_time ?? '').match(/^\d{1,2}:\d{2}/)?.[0] ?? null
    const startsAt = time
      ? `${date}T${time.padStart(5, '0')}:00`
      : `${date}T10:00:00`

    const free = /free/i.test(c.price ?? '')

    activities.push({
      source_uid: `llm:${c.url ?? `${c.title}:${date}`}`,
      title: String(c.title ?? '').trim() || '(untitled)',
      description: null,
      organiser: c.venue ?? null,
      category: 'Family',

      venue_name: c.venue ?? null,
      address: null,
      postcode: place.postcode,
      lat: place.lat,
      lng: place.lng,
      borough: place.borough,

      schedule: [],
      starts_on: null,
      ends_on: null,
      term_time_only: inferTermTime(c.title, c.age_text),

      age_min_months: min,
      age_max_months: max,

      is_free: free ? true : null,
      price_type: free ? 'free' : null,
      price_amount: null,
      price_text: c.price ?? null,

      booking_mode: null,
      booking_url: c.url ?? null,
      access: {},

      source_url: c.url ?? null,
      deep_link: c.url ?? null,
      // Verified against the live page, but still machine-generated — kept below
      // the feed adapters so it sorts lower in the review queue.
      confidence: verifyRan ? 0.7 : 0.45,

      occurrences: [{ starts_at: startsAt, ends_at: null, status: 'scheduled' }],
    })
  }

  return { activities, cursor: nextCursor, stats }
}
