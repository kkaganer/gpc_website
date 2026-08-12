// Model evaluation harness for LLM-based event discovery.
//
// Runs several (model x prompt x search_context) configurations against the
// OpenAI Responses API with the built-in web_search tool, scores every returned
// event automatically, and records the comparison in `model_evaluations`.
//
// WHAT IT MEASURES, AND WHY
//
// Not "how many events came back" — an LLM will always return a plausible list.
// The research found the failure mode is RECALL, not fluency: successive calls
// surface the same well-indexed venues, which is exactly what the 9 open feeds
// already cover. Since ~620 activities are already held, an event the model
// finds that duplicates one of those is worth nothing.
//
// So the decision metric is COST PER NOVEL VALID EVENT: real postcode in a
// served borough, date inside the window, working link, plausibly under-5, and
// not already in the corpus.
//
// WHY NOT gpt-5-nano: web search requires the Responses API with gpt-5.6 /
// gpt-5.5 / gpt-5.4 / gpt-4.1 / gpt-4.1-mini. The nano tier has no live data
// and cannot answer "what is on next week" at all.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolvePostcodes, normalisePostcode, SERVED_BOROUGHS } from '../_shared/discovery/geo.ts'
import { inferAge, isUnderFive } from '../_shared/discovery/age.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// $ per 1M tokens. Web search is $10 per 1,000 calls for every model, and for
// gpt-4.1-mini / gpt-4o-mini the retrieved content is billed as a fixed 8,000
// input-token block per call.
const PRICING: Record<string, { in: number; out: number; fixedSearchTokens?: number }> = {
  'gpt-4.1-mini': { in: 0.40, out: 1.60, fixedSearchTokens: 8000 },
  'gpt-4.1':      { in: 2.00, out: 8.00 },
  'gpt-5.4':      { in: 0.20, out: 1.25 },
}
const SEARCH_CALL_USD = 0.010

// ---------------------------------------------------------------------------
// Prompt variants.
//
// A deliberately spans the range from "what the old Perplexity call did" to
// "explicitly hunt the long tail", because the whole question is whether an LLM
// adds anything ON TOP OF the feeds rather than restating them.
// ---------------------------------------------------------------------------
const PROMPTS: Record<string, (from: string, to: string, area?: string) => string> = {
  // Mirrors the original discover-events prompt. The control.
  baseline: (from, to) => `
Find family-friendly events happening in South East London between ${from} and ${to}.
Focus on Greenwich, Lewisham, Southwark, Deptford, Blackheath and Woolwich.
For each event give: title, venue, full UK postcode, date (YYYY-MM-DD), start time,
a direct link to the event page, price, and the age range it suits.`.trim(),

  // Targets what the feeds structurally cannot reach: small independent
  // providers, church halls, community centres, one-off pop-ups.
  long_tail: (from, to) => `
Find events for children UNDER 5 and their parents/carers in South East London
between ${from} and ${to}, in Greenwich, Lewisham, Southwark, Deptford,
Blackheath, Woolwich, Eltham, Charlton or New Cross.

IMPORTANT — we already have complete listings from these, so do NOT return them:
leisure centres (Better/GLL), council-run libraries, Spektrix theatres (The Albany,
Greenwich Theatre, Woolwich Works, Blackheath Halls, Unicorn), Tower Hamlets
family hubs, and ClassForKids providers.

Instead prioritise sources those miss: church and community-hall toddler groups,
independent baby classes, children's centres, pop-ups, one-off seasonal events,
NCT and parent-network meetups, and small independent venues.

For each event give: title, venue, full UK postcode, date (YYYY-MM-DD), start time,
a direct link to the specific event page (not a homepage), price, and the age range.
Only include events you can find a real, working link for. If you are unsure an
event is genuinely happening in this window, leave it out.`.trim(),

  // Same long-tail targeting, but explicitly demands MULTIPLE searches. The
  // first evaluation showed the model issuing only ONE web_search call per run
  // regardless of prompt, which caps recall no matter how good the targeting is.
  // Since the $0.01 search fee dominates cost, more searches is the cheapest
  // available lever on yield.
  search_harder: (from, to) => `
Find events for children UNDER 5 and their parents/carers in South East London
between ${from} and ${to}.

Run AT LEAST SIX SEPARATE WEB SEARCHES before answering — do not rely on one.
Search each of these areas individually: Greenwich, Deptford/New Cross, Lewisham,
Blackheath, Woolwich/Charlton, Eltham. Vary the wording between searches
("toddler group", "stay and play", "baby class", "parent and toddler", "under 5s
what's on"). Then combine everything you found.

We already hold complete listings from Better/GLL leisure centres, council
libraries, the Spektrix theatres (The Albany, Greenwich Theatre, Woolwich Works,
Blackheath Halls, Unicorn), Tower Hamlets family hubs and ClassForKids — do NOT
return those. Prioritise church and community-hall toddler groups, independent
baby classes, children's centres, pop-ups and parent-network meetups.

For each event give: title, venue, full UK postcode, date (YYYY-MM-DD), start time,
a direct link to the specific event page (not a homepage), price, and the age range.
Only include events with a real working link. Omit anything aimed at 5s and over,
and anything you are not confident is genuinely running in this window.`.trim(),

  // Same long-tail targeting, but pushes hard on the under-5 specifics the
  // research identified as decision-relevant: age in months, drop-in vs booked,
  // term-time, buggy access.
  under5_specific: (from, to) => `
Find sessions for babies and children UNDER 5 with a parent or carer in South East
London between ${from} and ${to} (Greenwich, Lewisham, Southwark, Deptford,
Blackheath, Woolwich, Eltham, Charlton, New Cross).

We already hold everything from Better/GLL leisure centres, council libraries,
the Spektrix theatres, Tower Hamlets family hubs and ClassForKids — do not return
those. Prioritise church and community-hall parent-and-toddler groups, stay-and-play,
baby sensory and independent classes, and health/feeding drop-ins.

For each, give: title, venue, full UK postcode, date (YYYY-MM-DD), start time,
direct link to the event page, price (or "Free"), the youngest and oldest age in
MONTHS it admits, whether it is drop-in or needs booking, and whether it runs only
in term time. Prefer free, weekly, walk-in sessions. Omit anything you cannot find
a working link for, and anything aimed at children 5 and over.`.trim(),

  // Per-AREA prompt used by the fan-out config below.
  //
  // The evaluation showed the model issuing exactly ONE web_search call per run
  // regardless of how forcefully the prompt demanded more — so search breadth
  // cannot be bought with wording. Fanning out in CODE (one call per area)
  // makes breadth deterministic instead of discretionary, and guarantees even
  // geographic coverage rather than whichever area the model happened to pick.
  area_scoped: (from, to, area?: string) => `
Find events for children UNDER 5 and their parents/carers in ${area ?? 'South East London'}
between ${from} and ${to}.

Search specifically within ${area ?? 'South East London'} — do not broaden to other areas.

We already hold complete listings from Better/GLL leisure centres, council
libraries, the Spektrix theatres (The Albany, Greenwich Theatre, Woolwich Works,
Blackheath Halls, Unicorn), Tower Hamlets family hubs and ClassForKids — do NOT
return those. Prioritise church and community-hall parent-and-toddler groups,
stay-and-play sessions, independent baby classes, children's centres, pop-ups and
parent-network meetups.

For each event give: title, venue, full UK postcode, date (YYYY-MM-DD), start time,
a direct link to the specific event page (not a homepage), price, and the age range.
Only include events with a real working link. Omit anything aimed at 5s and over,
and anything you are not confident is genuinely running in this window.`.trim(),
}

const FANOUT_AREAS = [
  'Greenwich and Charlton, London',
  'Deptford and New Cross, London',
  'Lewisham and Catford, London',
  'Blackheath and Lee, London',
  'Woolwich and Plumstead, London',
  'Eltham and Mottingham, London',
]

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['events'],
  properties: {
    events: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        // OpenAI strict mode requires EVERY property to appear in `required`;
        // optionality is expressed as a nullable type, not by omission.
        // Omitting start_time/price/age_text here failed with:
        //   "'required' ... must include every key in properties. Missing 'start_time'."
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

interface Candidate {
  title?: string; venue?: string; postcode?: string
  date?: string; start_time?: string | null; url?: string
  price?: string | null; age_text?: string | null
}

/** HEAD-then-GET; some venue sites reject HEAD but serve GET fine. */
async function linkWorks(url: string): Promise<boolean> {
  if (!/^https?:\/\//i.test(url)) return false
  for (const method of ['HEAD', 'GET'] as const) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    try {
      const res = await fetch(url, {
        method,
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'GPC-Discovery/1.0 (+https://greenwichparents.co.uk; link check)' },
      })
      if (res.ok) return true
    } catch { /* try next method */ } finally { clearTimeout(timer) }
  }
  return false
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiKey) {
    return new Response(
      JSON.stringify({ success: false, error: 'OPENAI_API_KEY is not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  let body: Record<string, any> = {}
  try { body = await req.json() } catch { /* defaults */ }

  const runLabel: string = body.run_label ?? `eval-${new Date().toISOString().slice(0, 16)}`
  const configs: Array<{ model: string; prompt: string; search_context?: string }> =
    body.configs ?? [
      { model: 'gpt-4.1-mini', prompt: 'baseline',        search_context: 'medium' },
      { model: 'gpt-4.1-mini', prompt: 'long_tail',       search_context: 'medium' },
      { model: 'gpt-4.1-mini', prompt: 'under5_specific', search_context: 'high' },
    ]

  const from = new Date().toISOString().slice(0, 10)
  const to = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)

  const summary: Array<Record<string, unknown>> = []

  for (const cfg of configs) {
    const started = Date.now()
    const promptFn = PROMPTS[cfg.prompt]
    if (!promptFn) { summary.push({ ...cfg, error: `unknown prompt "${cfg.prompt}"` }); continue }

    let candidates: Candidate[] = []
    let inputTokens = 0, outputTokens = 0, searchCalls = 0, errorMsg: string | null = null

    // `fanout: true` issues one request PER AREA instead of one for the whole
    // patch. Costs ~6x per run but buys deterministic geographic coverage, which
    // the prompt alone provably could not.
    const areas: Array<string | undefined> = (cfg as any).fanout ? FANOUT_AREAS : [undefined]

    for (const area of areas) {
    try {
      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: cfg.model,
          input: promptFn(from, to, area),
          tools: [{ type: 'web_search', search_context_size: cfg.search_context ?? 'medium' }],
          text: { format: { type: 'json_schema', name: 'events', schema: SCHEMA, strict: true } },
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`)

      inputTokens += json?.usage?.input_tokens ?? 0
      outputTokens += json?.usage?.output_tokens ?? 0
      searchCalls += (json?.output ?? []).filter((o: any) => o?.type === 'web_search_call').length

      // Structured output arrives as text on the message item.
      const text = (json?.output ?? [])
        .flatMap((o: any) => o?.content ?? [])
        .map((c: any) => c?.text)
        .filter(Boolean)
        .join('')
      candidates.push(...(JSON.parse(text || '{}')?.events ?? []))
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : String(err)
    }
    }

    // Areas overlap at their edges, so collapse before scoring — otherwise the
    // same event counts several times and inflates the yield.
    const seenKey = new Set<string>()
    candidates = candidates.filter((c) => {
      const k = `${(c.title ?? '').toLowerCase().trim()}|${(c.postcode ?? '').replace(/\s/g, '').toUpperCase()}|${c.date ?? ''}`
      if (seenKey.has(k)) return false
      seenKey.add(k)
      return true
    })

    // ---------------- score ----------------
    const resolved = await resolvePostcodes(candidates.map((c) => c.postcode))
    const scored: Array<Record<string, unknown>> = []
    let validPostcode = 0, validDate = 0, linkOk = 0, under5 = 0, novel = 0, novelValid = 0

    for (const c of candidates) {
      const pc = normalisePostcode(c.postcode)
      const place = pc ? resolved.get(pc) : undefined
      const gPostcode = !!place && SERVED_BOROUGHS.has(place.borough)
      const gDate = !!c.date && c.date >= from && c.date <= to
      const gLink = c.url ? await linkWorks(c.url) : false
      const gUnder5 = isUnderFive(inferAge(c.title, c.age_text))

      let gNovel = false
      if (pc) {
        const { data } = await supabase.rpc('discovery_is_novel', {
          p_title: c.title ?? '', p_postcode: pc,
        })
        gNovel = data === true
      }

      if (gPostcode) validPostcode++
      if (gDate) validDate++
      if (gLink) linkOk++
      if (gUnder5) under5++
      if (gNovel) novel++
      const allValid = gPostcode && gDate && gLink && gUnder5
      if (allValid && gNovel) novelValid++

      scored.push({
        title: c.title, venue: c.venue, postcode: pc, date: c.date, url: c.url,
        borough: place?.borough ?? null,
        gates: { postcode: gPostcode, date: gDate, link: gLink, under5: gUnder5, novel: gNovel },
        verdict: allValid && gNovel ? 'NOVEL_VALID' : allValid ? 'valid_duplicate' : 'rejected',
      })
    }

    const price = PRICING[cfg.model] ?? { in: 0, out: 0 }
    const searchContentTokens = (price.fixedSearchTokens ?? 0) * searchCalls
    const cost =
      searchCalls * SEARCH_CALL_USD +
      ((inputTokens + searchContentTokens) / 1e6) * price.in +
      (outputTokens / 1e6) * price.out

    const row = {
      run_label: runLabel,
      model: cfg.model,
      prompt_variant: cfg.prompt,
      search_context: cfg.search_context ?? 'medium',
      returned: candidates.length,
      valid_postcode: validPostcode,
      valid_date: validDate,
      link_ok: linkOk,
      under5,
      novel,
      novel_valid: novelValid,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      search_calls: searchCalls,
      cost_usd: Number(cost.toFixed(5)),
      cost_per_novel_valid: novelValid > 0 ? Number((cost / novelValid).toFixed(5)) : null,
      elapsed_ms: Date.now() - started,
      error: errorMsg,
      results: scored,
    }

    await supabase.from('model_evaluations').insert(row)
    // Drop the per-event detail from the response; it lives in the table.
    const { results: _omit, ...compact } = row
    summary.push(compact)
  }

  return new Response(
    JSON.stringify({ success: true, run_label: runLabel, window: { from, to }, summary }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
