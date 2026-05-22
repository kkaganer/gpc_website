import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// One entry from Perplexity's `search_results` — a page the model actually
// browsed. Richer than `citations` (bare URL strings) so it's our primary pool.
interface SearchResult {
  title?: string
  url?: string
  date?: string
  snippet?: string
  source?: string
}

// Convert a UK postcode to coordinates using the free api.postcodes.io service.
// Tries the full postcode first, then falls back to the outcode (e.g. "SE13").
// Returns { lat, lng } on success, or null if not found / lookup fails. Never throws.
// Mirrors src/lib/geocode.js, reimplemented inline because this edge function
// (Deno) cannot import the frontend ES module.
async function geocodePostcode(
  postcode: string | null | undefined
): Promise<{ lat: number; lng: number } | null> {
  const cleaned = (postcode || '').replace(/\s/g, '').toUpperCase()
  if (cleaned.length < 2) return null

  try {
    const fullRes = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(cleaned)}`
    )
    const fullData = await fullRes.json().catch(() => null)
    if (fullData?.status === 200 && fullData.result) {
      return { lat: fullData.result.latitude, lng: fullData.result.longitude }
    }

    const partRes = await fetch(
      `https://api.postcodes.io/outcodes/${encodeURIComponent(cleaned)}`
    )
    const partData = await partRes.json().catch(() => null)
    if (partData?.status === 200 && partData.result) {
      return { lat: partData.result.latitude, lng: partData.result.longitude }
    }
  } catch {
    /* fall through to null */
  }

  return null
}

// ---------------------------------------------------------------------------
// URL matching: attach the best real, specific event link to each discovered
// event. Per Perplexity's docs we NEVER trust the URL the model writes into the
// JSON; instead we score the real URLs returned in `search_results` (and, as a
// weaker pool, `citations`) and pick the best specific deep link per event.
// Returns a fully-qualified https URL, or null. Always returns; the caller
// always keeps the event regardless.
// ---------------------------------------------------------------------------

// Path segments that mark a generic landing / index page rather than a specific
// dated event page. Compared case-insensitively after decoding + stripping a
// trailing ".html"/".php".
const LANDING_SLUGS = new Set([
  '',
  'whats-on',
  'whatson',
  "what's-on",
  'events',
  'event',
  'calendar',
  'live-calendar',
  'shows-and-events',
  'things-to-do',
  'visit',
  'news',
  'home',
  'index',
  'listings',
  'programme',
  'program',
])

// Stopwords stripped from titles before token comparison so "the", "at", "free"
// etc. don't inflate overlap scores.
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'at', 'in', 'on', 'for', 'to', 'with',
  'by', 'from', 'event', 'events', 'family', 'families', 'kids', 'children',
  'free', 'london', 'workshop', 'session', 'club',
])

// Parse a string into a URL, returning null instead of throwing on garbage.
// Accepts bare hosts ("horniman.ac.uk/foo") by prefixing https:// .
function safeUrl(raw: string | null | undefined): URL | null {
  if (!raw || typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    return new URL(trimmed)
  } catch {
    try {
      return new URL(`https://${trimmed}`)
    } catch {
      return null
    }
  }
}

// Normalise a host for comparison: lowercase + drop a leading "www.".
function normHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, '')
}

// Canonical key for de-dup: strip fragment + trailing slash, lowercase host.
function urlDedupKey(href: string): string {
  const u = safeUrl(href)
  if (!u) return href.toLowerCase()
  u.hash = ''
  return `${normHost(u.host)}${u.pathname.replace(/\/$/, '')}${u.search}`.toLowerCase()
}

// The "registrable-ish" core of a host, for fuzzy domain matching.
// e.g. "www.horniman.ac.uk" -> "horniman". Handles 2-part UK public suffixes
// (.co.uk, .ac.uk, .org.uk, .gov.uk) by dropping the last 3 labels, else last 2.
function hostCore(host: string): string {
  const labels = normHost(host).split('.').filter(Boolean)
  if (labels.length <= 1) return labels[0] || ''
  const last2 = labels.slice(-2).join('.')
  const twoPartSuffix =
    last2 === 'co.uk' || last2 === 'ac.uk' || last2 === 'org.uk' ||
    last2 === 'gov.uk' || last2 === 'net.uk' || last2 === 'me.uk'
  const dropped = twoPartSuffix ? labels.slice(0, -3) : labels.slice(0, -2)
  return (dropped[dropped.length - 1] || labels[0] || '').toLowerCase()
}

// Split text into lowercase alphanumeric tokens, dropping stopwords + short bits.
function tokenize(text: string | null | undefined): Set<string> {
  const out = new Set<string>()
  if (!text || typeof text !== 'string') return out
  for (const tok of text.toLowerCase().split(/[^a-z0-9]+/)) {
    if (tok.length >= 3 && !STOPWORDS.has(tok)) out.add(tok)
  }
  return out
}

// Decode "%20"-style path segments and lowercase them for slug comparison.
function pathSegments(u: URL): string[] {
  return u.pathname
    .split('/')
    .map((s) => {
      let d = s
      try { d = decodeURIComponent(s) } catch { /* keep raw */ }
      return d.replace(/\.(html?|php|aspx?)$/i, '').toLowerCase().trim()
    })
    .filter((s) => s.length > 0)
}

// A "landing page" = no path, or a single known landing slug, or two segments
// that are both landing-ish. Anything with a real slug is "specific".
function isLandingPage(u: URL): boolean {
  const segs = pathSegments(u)
  if (segs.length === 0) return true
  if (segs.length === 1 && LANDING_SLUGS.has(segs[0])) return true
  if (segs.length === 2 && LANDING_SLUGS.has(segs[0]) && LANDING_SLUGS.has(segs[1])) {
    return true
  }
  return false
}

// The venue's plausible domain core(s), from every signal we have: the model's
// own url host, plus any prioritySources whose host core or path tokens overlap
// the event's venue/title tokens (e.g. "Horniman Museum" -> horniman.ac.uk).
function expectedHostCores(event: any, prioritySources: string[]): Set<string> {
  const cores = new Set<string>()

  const modelUrl = safeUrl(event?.url)
  if (modelUrl) cores.add(hostCore(modelUrl.host))

  const venueTokens = tokenize(`${event?.venue || ''} ${event?.title || ''}`)
  if (venueTokens.size > 0) {
    for (const src of prioritySources) {
      const su = safeUrl(src)
      if (!su) continue
      const core = hostCore(su.host)
      let hit = false
      for (const t of venueTokens) {
        if (t === core || (core.length >= 4 && (t.includes(core) || core.includes(t)))) {
          hit = true
          break
        }
      }
      if (!hit) {
        for (const seg of pathSegments(su)) {
          for (const t of tokenize(seg)) {
            if (venueTokens.has(t)) { hit = true; break }
          }
          if (hit) break
        }
      }
      if (hit) cores.add(core)
    }
  }

  return cores
}

// Does the URL or the result's date string reference the event's date?
function dateMatches(event: any, resultDate: string | undefined, u: URL): boolean {
  const d = typeof event?.date === 'string' ? event.date.trim() : ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false
  const [y, , day] = d.split('-')
  const haystack = `${resultDate || ''} ${u.href}`.toLowerCase()
  if (haystack.includes(d)) return true
  if (haystack.includes(y) && new RegExp(`\\b0?${Number(day)}\\b`).test(haystack)) {
    return true
  }
  return false
}

// Score a candidate URL against an event. Higher is better. `specific` means a
// real deep link (not a landing page) on a plausibly-correct domain.
function scoreCandidate(
  candidateUrl: string | undefined,
  candidateTitle: string | undefined,
  candidateSnippet: string | undefined,
  candidateDate: string | undefined,
  event: any,
  expectedCores: Set<string>
): { url: string; score: number; specific: boolean } | null {
  const u = safeUrl(candidateUrl)
  if (!u) return null
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null

  let score = 0
  const core = hostCore(u.host)
  const hostMatch = expectedCores.has(core)

  if (hostMatch) score += 100 // (a) host match to the venue — strongest signal

  const landing = isLandingPage(u)
  if (!landing) {
    score += 40 // (c) path specificity
    const segs = pathSegments(u)
    score += Math.min(segs.length, 4) * 5
    const last = segs[segs.length - 1] || ''
    if (/[a-z].*[-0-9]|[-0-9].*[a-z]/.test(last)) score += 10 // slug-ish last segment
  } else {
    score -= 20 // penalise bare landing/index pages
  }

  // (b) title / snippet / slug token overlap with the event title
  const eventTokens = tokenize(event?.title)
  const candTokens = tokenize(`${candidateTitle || ''} ${candidateSnippet || ''}`)
  for (const seg of pathSegments(u)) for (const t of tokenize(seg)) candTokens.add(t)
  let overlap = 0
  if (eventTokens.size > 0) {
    for (const t of eventTokens) if (candTokens.has(t)) overlap++
    score += overlap * 12
  }

  const hasDateMatch = dateMatches(event, candidateDate, u)
  if (hasDateMatch) score += 25 // (d) optional date match

  // A deep link is only "specific" (eligible to win Tier 1) if it shares at least
  // one meaningful signal with THIS event — slug/title/snippet token overlap, or a
  // date match. A bare host match is NOT enough: shared multi-event hosts
  // (*.gov.uk/events/*, museum /whats-on/*, etc.) carry hundreds of unrelated pages,
  // so a host-only deep link is noise. When nothing clears this bar, pickEventUrl
  // falls through to a landing page or null (admin fixes it) — far safer than a
  // confidently-wrong link.
  const relevant = overlap >= 1 || hasDateMatch
  const specific = !landing && relevant
  return { url: u.href, score, specific }
}

// Pick the best real URL for an event. Fallback order (always returns):
//   1. Best SPECIFIC deep link (right domain + non-landing path).
//   2. Best LANDING match on an expected domain, else the model's own url IF its
//      host matches an expected venue domain.
//   3. null.
// Each event scores the pool independently, so siblings from one venue don't all
// collapse to the same landing URL when better matches exist.
function pickEventUrl(
  event: any,
  searchResults: SearchResult[],
  citations: string[],
  prioritySources: string[],
  usedSpecificUrls: Set<string>
): string | null {
  const expectedCores = expectedHostCores(event, prioritySources)
  const scored: { url: string; score: number; specific: boolean }[] = []

  for (const r of searchResults) {
    const s = scoreCandidate(r?.url, r?.title, r?.snippet, r?.date, event, expectedCores)
    if (s) scored.push(s)
  }
  for (const c of citations) {
    const s = scoreCandidate(c, undefined, undefined, undefined, event, expectedCores)
    if (s) scored.push(s)
  }

  // Tier 1: best specific deep link not already claimed by an earlier event. A
  // specific page belongs to exactly one event, so we never assign the same deep
  // link twice in a run; landing pages (Tier 2a) may legitimately repeat.
  const specifics = scored
    .filter((s) => s.specific && !usedSpecificUrls.has(urlDedupKey(s.url)))
    .sort((a, b) => b.score - a.score)
  if (specifics.length > 0) {
    usedSpecificUrls.add(urlDedupKey(specifics[0].url))
    return specifics[0].url
  }

  // Tier 2a: best landing-page match on an expected venue domain.
  const landingOnDomain = scored
    .filter((s) => {
      const su = safeUrl(s.url)
      return su ? expectedCores.has(hostCore(su.host)) : false
    })
    .sort((a, b) => b.score - a.score)
  if (landingOnDomain.length > 0) return landingOnDomain[0].url

  // Tier 2b: the model's own url, only if its host matches an expected domain.
  const modelUrl = safeUrl(event?.url)
  if (modelUrl && expectedCores.has(hostCore(modelUrl.host))) {
    return modelUrl.href
  }

  // Tier 3: nothing trustworthy. Keep the event; admin fixes the URL later.
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY')
    if (!perplexityKey) {
      throw new Error(
        'PERPLEXITY_API_KEY is not configured. Run: supabase secrets set PERPLEXITY_API_KEY=<your-key>'
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Date window: today → today + 14
    const now = new Date()
    const twoWeeksOut = new Date(now)
    twoWeeksOut.setDate(twoWeeksOut.getDate() + 14)
    const fromDate = now.toISOString().split('T')[0]
    const toDate = twoWeeksOut.toISOString().split('T')[0]

    // Human-readable day/month labels for the prompt — Sonar handles natural
    // date phrasing better than bare ISO strings.
    const longFormatter = new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const todayLabel = longFormatter.format(now)
    const endLabel = longFormatter.format(twoWeeksOut)

    // Curated, hard-priority sources the user always checks. Perplexity should
    // search these FIRST, then fill gaps with other SE London / London events.
    const prioritySources = [
      'https://www.bachtobaby.com/greenwich-music-concerts-for-baby-and-family',
      'https://www.better.org.uk/library/london/greenwich/events-and-activities',
      'https://www.conservatoire.org.uk/events',
      'https://www.blackheathhalls.com/whats-on/',
      'https://calicolibraries.com/whats-on/',
      'https://www.greenwichheritage.org/events/',
      'https://www.creeksidecentre.org.uk/events/',
      'https://deptfordlounge.org.uk/whats-on/',
      'https://www.londonmuseum.org.uk/visit/families/',
      'https://www.lewishamcfc.org.uk/a-big-welcome-to-all-our-dads-and-male-carers/',
      'https://www.forumatgreenwich.org/',
      'https://www.greenwichpeninsula.co.uk/whats-on',
      'https://www.greenwichpilates.co.uk/',
      'https://greenwichtheatre.org.uk/whats-on/',
      'https://www.greenwichwest.org.uk/',
      'https://homestartgreenwich.org.uk/',
      'https://www.horniman.ac.uk/whats-on/',
      'https://www.rmg.co.uk/whats-on/other/lgbtq-family-network',
      'https://www.mudchute.org/news',
      'https://mycenaehouse.co.uk/whats-on/',
      'https://pandasfoundation.org.uk/how-we-can-support-you/pandas-therapy-programme/',
      'https://quaggydevelopmenttrust.org/live-calendar/',
      'https://www.royalgreenwich.gov.uk/events',
      'https://www.royalgreenwich.gov.uk/news/2025/royal-greenwich-festivals-free-summer-programme-here',
      'https://www.rmg.co.uk/whats-on?page=1&audience=families',
      'https://ornc.org/whats-on/',
      'https://www.tate.org.uk/whats-on',
      'https://www.thealbany.org.uk/shows-and-events/',
      'https://www.unicorntheatre.com/whats-on',
      'https://www.woodlandtrust.org.uk/visiting-woods/things-to-do/events/',
      'https://www.woolwich.works/whats-on',
      'https://www.ikea.com/gb/en/stores/events/ikea-greenwich/',
    ]

    const prompt = `Today is ${todayLabel} (${fromDate}).

Find 25–30 family-friendly things to do in London between ${todayLabel} and ${endLabel} (${fromDate} to ${toDate}).

PRIORITY AREA: South East London — Greenwich, Lewisham, Southwark, Deptford, Blackheath, Woolwich, Eltham and Bromley. The MAJORITY of events you return should be in or very close to these areas. You may also search all of London and include notable London-wide family events to fill out the list, but SE London comes first.

HARD-PRIORITY SOURCES (check these FIRST, before anything else):
${prioritySources.map((u) => `- ${u}`).join('\n')}

Search every one of the sources above first and pull any qualifying events from them — these are the venues and organisations the user cares about most. After you have exhausted the listed sources, fill any remaining gaps with other reputable SE London / London family-event sources (council "what's on" pages, museums, theatres, farms, parks, Eventbrite/Time Out family listings, English Heritage / National Trust London properties).

Include a mix across categories: museum activities, theatre, outdoor/nature, craft workshops, baby/toddler groups, sports, food markets, seasonal activities.

DATE RULES:
- Every event must happen on or between ${fromDate} and ${toDate}.
- Do NOT include past events.
- If an event recurs weekly, pick the next occurrence in the date window.

URL RULES:
- For each event, actually open and browse the specific, dated event page on the venue's own website (not just the "what's on" index). Visiting the real page is what matters — we capture the link from your browsing automatically, so you don't need to write a perfect URL.
- Still set the "url" field to the best link you have (specific event page if you found it, otherwise the venue's "what's on" page). Prefer the venue's own site over aggregators.

POSTCODE RULES:
- For each event, provide the venue's real UK postcode in the "postcode" field, as accurate as you can (e.g. "SE10 9NF"). Use the venue's actual address, not a guess.
- If you genuinely cannot determine the postcode, set "postcode" to null rather than inventing one. Do NOT fabricate postcodes. An approximate area outcode (e.g. "SE10") is acceptable when the full postcode is unknown.
- Leave "lat" and "lng" null. Coordinates are derived from the postcode on our side, so the accuracy of the postcode matters far more than lat/lng.

Return 25–30 events. It's fine to include some that are a bit borderline; the admin will review each one before publishing, so err on the side of more suggestions rather than fewer. Return a JSON object with a single "events" key whose value is an array. Each event object has these fields:
- title: event name
- venue: place name (e.g. "Horniman Museum")
- date: YYYY-MM-DD
- time: e.g. "10:00 - 14:00" or null
- location: address or postcode
- postcode: the venue's real UK postcode (e.g. "SE10 9NF"), or null if genuinely unknown
- area: one of "Greenwich" | "Lewisham" | "Southwark" | "Central London" | "Tower Hamlets" | "Bromley"
- lat: number or null (optional — leave null, we geocode from the postcode)
- lng: number or null (optional — leave null, we geocode from the postcode)
- description: 1-2 sentences
- url: best link you have — ideally the specific dated event page on the venue's own site
- category: one of "Family" | "Outdoor" | "Arts" | "Sports" | "Music" | "Food"
- age_range: e.g. "All ages", "0-5"
- price: e.g. "Free", "£5"
- is_free: true/false`

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        max_tokens: 8000,
        web_search_options: { search_context_size: 'high' },
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that finds local family-friendly events in London. You suggest 25-30 candidate events per request so an admin can review and approve them. Prioritise South East London and the user-supplied source list. Return a JSON object with a single "events" key whose value is an array. Never include markdown fences or explanatory prose.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            schema: {
              type: 'object',
              properties: {
                events: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['title', 'date', 'location'],
                    properties: {
                      title: { type: 'string' },
                      venue: { type: 'string' },
                      date: { type: 'string' },
                      time: { type: ['string', 'null'] },
                      location: { type: 'string' },
                      postcode: { type: ['string', 'null'] },
                      area: { type: 'string' },
                      lat: { type: ['number', 'null'] },
                      lng: { type: ['number', 'null'] },
                      description: { type: 'string' },
                      url: { type: 'string' },
                      category: { type: 'string' },
                      age_range: { type: 'string' },
                      price: { type: 'string' },
                      is_free: { type: 'boolean' },
                    },
                  },
                },
              },
              required: ['events'],
            },
          },
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Perplexity API error: ${response.status} ${errorText}`)
    }

    const result = await response.json()

    // Perplexity returns a standard chat-completions envelope
    const content: string = result?.choices?.[0]?.message?.content || ''

    // PRIMARY pool of real, browsed URLs. Per Perplexity docs we attach links
    // from here in code rather than trusting URLs the model writes into JSON.
    // Each item: { title, url, date?, snippet?, source? }. May be empty/missing.
    const searchResults: SearchResult[] = Array.isArray(result?.search_results)
      ? result.search_results
      : []
    // SECONDARY pool: bare URL strings. Used only if search_results lacks a match.
    const citations: string[] = Array.isArray(result?.citations) ? result.citations : []

    if (!content) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No text content in Perplexity response',
          debug: {
            rawKeys: Object.keys(result || {}),
            choicesLength: result?.choices?.length,
            firstChoiceKeys: result?.choices?.[0] ? Object.keys(result.choices[0]) : null,
            citations,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse JSON — strip any stray markdown fences as a safety net
    let parsed: any
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch (_parseError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to parse Perplexity response as JSON',
          debug: {
            contentPreview: content.substring(0, 500),
            citations,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // The schema wraps the array in an `events` key. Unwrap it, but also
    // accept a top-level array in case Perplexity drops the wrapper.
    const events: any[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.events)
        ? parsed.events
        : []

    if (events.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Perplexity returned zero events',
          debug: {
            parsedType: typeof parsed,
            parsedKeys: parsed && typeof parsed === 'object' ? Object.keys(parsed) : null,
            contentPreview: content.substring(0, 500),
            citations,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert events as pending (approved = false)
    let inserted = 0
    let geocoded = 0
    let urlSpecific = 0
    let urlLanding = 0
    let urlNull = 0
    const insertErrors: string[] = []
    // Track specific deep links already assigned this run so no two events share one.
    const usedSpecificUrls = new Set<string>()
    for (const event of events) {
      if (!event.title || !event.date || !event.location) continue

      // Derive map coordinates from a real UK postcode server-side. We do NOT
      // trust the LLM's guessed lat/lng — an unfound postcode stores null coords
      // (the event still shows in the list and is recoverable via "Fix Map Pins").
      const rawPostcode =
        typeof event.postcode === 'string' && event.postcode.trim()
          ? event.postcode.trim()
          : null
      const coords = await geocodePostcode(rawPostcode)
      if (coords) geocoded++

      // Attach the best real, specific link from Perplexity's search_results —
      // never the model's written URL (except as a domain-gated last resort).
      const resolvedUrl = pickEventUrl(event, searchResults, citations, prioritySources, usedSpecificUrls)
      if (resolvedUrl === null) {
        urlNull++
      } else {
        const ru = safeUrl(resolvedUrl)
        if (ru && isLandingPage(ru)) urlLanding++
        else urlSpecific++
      }

      const { error } = await supabase.from('london_events').insert({
        title: event.title,
        venue: event.venue || null,
        date: event.date,
        time: event.time || null,
        location: event.location,
        postcode: rawPostcode,
        area: event.area || null,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        description: event.description || null,
        url: resolvedUrl,
        category: event.category || null,
        age_range: event.age_range || null,
        price: event.price || null,
        is_free: event.is_free ?? (event.price?.toLowerCase() === 'free'),
        source: 'perplexity',
        approved: false,
      })

      if (error) {
        insertErrors.push(`${event.title}: ${error.message}`)
      } else {
        inserted++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        discovered: events.length,
        inserted,
        geocoded,
        searchResultsCount: searchResults.length,
        urlBreakdown: { specific: urlSpecific, landing: urlLanding, null: urlNull },
        insertErrors: insertErrors.length > 0 ? insertErrors : undefined,
        citations: citations.slice(0, 10),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
