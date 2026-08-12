# Research Report: Scaling Under-5 Event Discovery in South East London

**Date:** 2026-08-11
**Research Type:** Technical + Domain (combined)
**Mode:** Create
**Project:** GPC Website
**Version:** 1.0
**Status:** Final

---

## Executive Summary

**Research Objective:** Determine how to reliably discover *hundreds* of high-quality activities for parents and carers of children under 5 across South East London, refreshed weekly, within a hard budget of **£20/week** in API spend — replacing a pipeline that currently yields 25–30 events per manual run.

**Key Findings:**

1. **The budget is not the constraint, and never was.** Every viable architecture costs between **4.5% and 47%** of £20/week. The recommended hybrid design costs **£2.60/week (13%)**. Even the current approach scaled to a 96-call borough × category grid fits at £9.42/week. The binding constraints are **recall** (can you reach the long tail?) and **maintenance** (who keeps the source list alive?).

2. **The data model is the actual defect.** ~**97%** of under-5 supply is *weekly recurring and term-time-bound* (~600–825 sessions/week vs ~10–25 genuine one-offs — a 25:1 to 40:1 ratio). A system built on "events in the next 14 days" **structurally cannot see it**, because sources publish "Tuesdays 10:30, term time" and never emit a dated occurrence. This is precisely why the current output skews to museums, theatre and festivals pitched at 5–12s.

3. **~1,000+ under-5 occurrences per week are available for £0 from feeds nobody is using.** Empirically verified on 2026-08-11: OpenActive RPDE feeds (CC-BY 4.0, keyless), the Spektrix ticketing API across 7–9 local venues, Tower Hamlets' Family Hubs JSON API, and Better/GLL's library timetable endpoint. The free tier alone clears the "hundreds of events" target before a single paid API call.

**Bottom Line:** The current system fails not because Perplexity is bad or the budget is small, but because it asks the wrong question ("what events are on in the next 14 days?") of the wrong sources (whatever a search engine has indexed). The under-5 audience's week is built from free, weekly, walkable, drop-in sessions — rhyme time, stay & play, church toddler groups, health drop-ins — which are published as *timetables*, not as *events*, and which sit in structured public feeds that cost nothing. Fixing the primitive from **Event** to **Activity + generated Occurrences**, then ingesting the free structured tier before spending anything, converts a 25–30/week trickle into a 600–1,000/week index at roughly £2.60/week — about 13% of budget — leaving headroom for daily cadence and a quality-escalation tier.

**Primary Recommendation:** Adopt **Scenario C (hybrid)**: migrate the data model to Activity/Occurrence with mandatory `term_time_only` and age-in-months, build feed adapters in strict yield order (OpenActive → Family Hubs → Spektrix → libraries → WordPress REST → HTML+LLM), and demote Perplexity from *the* discovery mechanism to a ~15-call/week novelty probe.

---

## Research Scope

### Objectives

**Primary Questions:**
1. Where does high-quality under-5 activity data for SE London actually live, and which of those sources are machine-readable?
2. What pipeline architecture yields hundreds of quality listings per week within £20/week?
3. Is the current Perplexity-based approach salvageable, replaceable, or complementary?

**Secondary Questions:**
- What does "quality" mean for this audience, expressed as automated, testable rules?
- What are the legal and ToS constraints on storing and redisplaying third-party event data in the UK?
- How should deduplication work given the same session appears in two or three feeds?

### Scope Boundaries

**In Scope:**
- Event aggregator, ticketing and listing platform APIs (Eventbrite, Ticketmaster, Meetup, Skiddle, DICE, Facebook, Happity, Hoop, Pebble, ClassForKids, Bookwhen and 15+ others)
- UK public-sector open data: six borough councils, library services, Family Hubs, Local Offer/FIS directories, Open Referral UK, OpenActive, London Datastore, data.gov.uk
- Structured-data crawl techniques: schema.org/Event JSON-LD, sitemaps, RSS, iCal, CMS REST endpoints
- LLM and search API cost economics (Perplexity, Anthropic, OpenAI, Google, open-weight hosts)
- Under-5 demand taxonomy and the SE London source universe (~510 named sources)

**Out of Scope:**
- Implementation — this report plans; no application code was written or modified
- Paid partnership negotiation with Happity/Hoop/Pebble — identified as the correct route but commercially, not technically, resolved
- User-facing UX and filtering design — downstream of the data model decision made here
- Community submission tooling — named as the correct answer to the residual gap, not designed here

**Time Frame:** Current as of 2026-08-11
**Geographic Focus:** Royal Greenwich, Lewisham, Southwark, Bromley, Tower Hamlets (E14/E3/E1W), Bexley; incl. Deptford, Blackheath, Woolwich, Eltham
**Market Segment:** Parents and carers of children aged 0–5

---

## Methodology

### Research Approach

**Research Type:** Mixed — secondary research plus **primary empirical endpoint testing**

**Methods Used:**
- Five parallel research agents covering aggregator APIs, public-sector data, crawl techniques, cost economics, and domain/demand
- **Live endpoint testing** — several hundred candidate URLs were fetched and their responses measured, not inferred. Counts in this report (e.g. "566 records", "275 cards", "6,059 dated instances") are measured values.
- Direct retrieval of official pricing and developer documentation rather than third-party summaries
- Codebase inspection of the existing `discover-events` edge function and `london_events` schema

**Tools Used:** WebSearch, WebFetch, Bash/curl-equivalent endpoint probing, Read/Grep over the repository

### Data Sources

**Primary Sources:**
1. **OpenActive data catalogue** — `https://openactive.io/data-catalogs/data-catalog-collection.jsonld` — Open data standard (ODI / Sport England) — Reliability: **High** — Accessed 2026-08-11
2. **Spektrix API v3** — `https://system.spektrix.com/{client}/api/v3/events` — Vendor API, unauthenticated — Reliability: **High** — Accessed 2026-08-11
3. **Tower Hamlets Family Hubs API** — `POST https://www.thfamilyhubs.co.uk/api/GetEventSchedules` — Public-sector API — Reliability: **High** — Accessed 2026-08-11
4. **Perplexity pricing documentation** — `https://docs.perplexity.ai/getting-started/pricing` — Vendor pricing — Reliability: **High** — Accessed 2026-08-11
5. **DfE/DHSC Family Hubs and Start for Life programme guide** — statutory 0–5 service taxonomy — Reliability: **High** — Accessed 2026-08-11

**Secondary Sources:** Mumsnet Local (Greenwich/Lewisham threads), Happity/Play Map/Toddle About category taxonomies, borough library and Local Offer pages, Google structured-data documentation, ~110 further cited sources across the five detailed appendices.

### Limitations

- **Seasonal sampling bias.** All volume counts were measured on **11 August 2026 — mid school-holiday**. Term-time and holiday provision move in *opposite* directions. Library rhyme times and church groups are largely suspended; holiday programmes are inflated. **Re-sample against ~2026-09-15 before treating any figure as a steady-state baseline.**
- **Login-walled sources deliberately unfilled.** Facebook groups and Instagram curators are significant under-5 channels but are not machine-accessible; no names or URLs were fabricated to fill the gap.
- Several vendor free-tier quotas are stated on pricing pages but not independently verifiable; these are marked `[UNVERIFIED]` in the detailed appendices.
- One open question is cheaply resolvable in production: whether Perplexity bills retrieved search-context tokens as `input_tokens` on top of the request fee. Read `usage.input_tokens` off one live response to close it.

---

## Detailed Findings

### Finding 1: The primitive is wrong — under-5 supply is ~97% recurring

**Summary:** The under-5 activity universe is dominated by weekly, term-time-bound, undated sessions. A 14-day dated-event window cannot represent them.

**Details:**
- Measured supply split across the five target areas:

| Supply type | Est. sessions/week | Share |
|---|---|---|
| Library under-5 sessions | ~90–110 | ~14% |
| Family hub / children's centre stay & play | ~140–180 | ~22% |
| Church & community hall toddler groups | ~120–200 | ~22% |
| Paid classes (franchise + independent) | ~200–260 | ~33% |
| Health drop-ins (feeding, weigh-in, SLT) | ~35–50 | ~6% |
| Museum/theatre/farm **recurring** under-5 sessions | ~15–25 | ~3% |
| **Recurring subtotal** | **~600–825/week** | **~97%** |
| Genuine dated one-off events for under-5s | ~10–25/week | ~3% |

- A generic "family-friendly London events" search reaches **3 of 25** demand categories — museum sessions, theatre, and seasonal one-offs — and those three are the **lowest-frequency, highest-cost, most-travel-required** categories in the set.
- The mechanism of the failure is measurable in a competitor's own data: **44% of Hoop's organiser-submitted listings are weekly, versus ~5% of its aggregated ones.** Event aggregators strip recurrence on ingest.
- **Term-time is a first-class field, not a note.** Without it, ~72% of library sessions would be published as running during the summer holiday. A naive scrape of Southwark's page on 2026-08-11 produces **18 false listings per week**.

**Supporting Evidence:**
```
"Recurring sessions outnumber one-off under-5 events by roughly 25:1 to 40:1
in a normal week."
Source: research-scratch/domain-under5.md §2.3, grounded in verified library,
family-hub, health and directory harvests, accessed 2026-08-11
```

**Implications for Planning:**
- The core schema must become **Activity (with a schedule rule + validity window) → generated Occurrences**, not `london_events` rows with a single `date`.
- `term_time_only` and `age.min_months`/`max_months` become **mandatory**, not enrichment.
- Refresh cadence for recurring content should be **termly with change-detection**, not daily. Daily re-crawling of a timetable PDF is waste.
- Freshness must be modelled as **`last_verified_at`**, not event proximity.

**Confidence:** [VERIFIED] — triangulated across statutory taxonomy, three competitor taxonomies, and direct source harvests.

---

### Finding 2: ~1,000+ under-5 occurrences/week are available free from unused structured feeds

**Summary:** The free public/third-sector tier clears the "hundreds of events" target on its own, at £0, from feeds that are keyless, unauthenticated, and in several cases explicitly open-licensed.

**Details — the four highest-yield discoveries, all empirically verified 2026-08-11:**

1. **OpenActive** — the single biggest win. Three RPDE JSON feeds, **CC-BY 4.0, no API key, no quota, no registration**:
   - `https://better-admin.org.uk/api/openactive/better/scheduled-sessions` (+ `/session-series`)
   - `https://opendata.leisurecloud.live/api/feeds/SouthwarkCouncil-live-scheduled-sessions`
   - `https://opendata.leisurecloud.live/api/feeds/TowerHamletsCouncil-live-scheduled-sessions`

   Measured: Southwark **6,059** dated instances (3,086 in the next 7 days), Tower Hamlets **3,994** (2,030 next 7 days), GLL 2,593 national session-series / 301,572 scheduled sessions. **~5,750 sessions/week in target postcodes, ~810 of them under-5** (Toddlers' World, Toddler Splash, Under 5 Swim, Soft Play, Family Swim). Southwark's entire feed crawls in **4 seconds**. Critically, **this is the only machine-readable source covering Lewisham.**

2. **Spektrix API v3** — public and unauthenticated. One adapter covers **7 relevant venues** on the existing priority list: `thealbany`, `unicorntheatre`, `greenwichtheatre`, `woolwichworks`, `blackheathhalls`, `polka`, `littleangeltheatre` — **~2,600 future performance instances**. Polka additionally publishes a per-year `agesApplicable` array via `https://polkatheatre.com/wp-json/polka/v1/calendar-events` (334 instances, **197 under-5**) — the most precise under-5 filter found anywhere.

3. **Tower Hamlets Family Hubs** — the cleanest API in the study. `POST https://www.thfamilyhubs.co.uk/api/GetEventSchedules` with `{"startDate":"...","endDate":"..."}` returns **566 records / 49 fields / 421 tagged 0-5**, geocoded, unauthenticated. Roughly half a day's work.

4. **Better/GLL library timetables** — the best-structured data found anywhere: `https://www.better.org.uk/library/dynamic_pages/panels/{panelId}/timetables/items` returns title, description, day/date/time, **full address with postcode**, audience tag and booking requirement in one fragment. **275 cards on Woolwich alone**; all 26 Greenwich/Bromley panel IDs are mapped in the appendix. Postcodes drop straight into the existing `postcode`-based geocoding.

**Further verified free sources:** Lewisham Libraries RSS (`lewisham.events.mylibrary.digital/rss`, 299 items), Greenwich Community Directory sitemap (1,346 service URLs, ~450 tagged 0–5, 168 baby-and-toddler groups), Lewisham Family Hubs (~40–70/wk pre-banded by age), London Wildlife Trust Drupal JSON:API, English Heritage event search API (Eltham Palace + Ranger's House), Bromley Simply Connect (1,679 JSON records), Quaggy's public Google Calendar ICS (1,912 events), ChurchSuite public JSON (`{slug}.churchsuite.com/embed/calendar/json` — recurring series already expanded, live on 3 of 10 SE London churches probed), The Play Map borough registers (~106 groups with postcode, day, time, SEN/dad-carer/baby-only tags).

**Supporting Evidence:**
```
"~5,750 bookable sessions/week in target postcodes, ~810 of them under-5.
Proper JSON, CC-BY 4.0, no API key, no auth, no registration."
Source: research-scratch/public-data.md §1c, endpoints verified by live fetch
2026-08-11
```

**Implications for Planning:**
- Build feed adapters **before** any crawling or LLM work. The yield-per-engineering-hour is not close.
- Ship Tower Hamlets Family Hubs first as a pipeline proof — smallest, cleanest, fully on-target.
- CC-BY 4.0 requires **attribution on display**; budget a source-credit field in the UI.

**Confidence:** [VERIFIED] — all endpoints fetched live; counts are measured, not estimated.

---

### Finding 3: Councils are the weakest tier; Open Referral UK is a dead end in London

**Summary:** The intuitive first stop — borough council event APIs — is nearly barren, and the national services-directory standard has zero London adoption.

**Details:**
- **No JSON or iCal event API exists across any of the six councils.** Not one emits `application/ld+json` schema.org `Event` markup. The three Drupal councils explicitly refuse REST: `{"message":"No route found for the specified format. Supported formats: html."}`. No borough runs WordPress, so `/wp-json/tribe/events/v1/events` is absent everywhere.
- Only **two** council RSS feeds exist at all: Tower Hamlets (`Events.aspx?Calendar_List_SyndicationType=1`, 299 items, verified) and Bromley (`/rss/events`, 20-item hard cap).
- **Lewisham Council publishes zero dated events** — 17 campaign pages, some stale to November 2025. It is rescued entirely by OpenActive + Lewisham Libraries RSS + `lewishamfamilyhubs.org.uk`.
- **Open Referral UK is live and excellent nationally** — Buckinghamshire returns 4,181 services with full `regular_schedules` recurrence and `age_band_under_2` fields — but **all six target boroughs plus ~25 other London boroughs returned zero** across three host patterns. The DfE national aggregator (`find-support-for-your-family.education.gov.uk`) is **NXDOMAIN**; its repos were archived August 2024.
- **Open data portals are barren for events.** Neither London Datastore nor data.gov.uk carries a single family-event dataset for these boroughs. (London Datastore's `q` parameter is also **silently ignored** — every query returns the same 1,297 records.) Take venue reference data only.

**Supporting Evidence:**
```
Greenwich /jsonapi, /events?_format=json → 404 / 406
Southwark /jsonapi, /events/feed        → 404 / 406
Bexley    /jsonapi, /events.xml         → 404
Any borough /wp-json/tribe/events/v1/events → NOT FOUND (no borough runs WordPress)
Source: research-scratch/public-data.md §1a, tested 2026-08-11
```

**Implications for Planning:**
- Do not invest engineering time in council REST discovery. Treat councils as HTML-scrape targets of last resort.
- **One credible relationship play:** Greenwich's Community Directory runs LocalGov Drupal's `localgov_outpost`, importing from FutureGov's **Outpost** platform — the same product family behind Buckinghamshire's ORUK feed, with an identical JSON shape. **Greenwich's data already exists in an ORUK-shaped upstream API; it is simply not publicly exposed.** That is a specific, low-cost ask to put to the council.

**Confidence:** [VERIFIED] — negative results confirmed by direct fetch.

---

### Finding 4: Eventbrite is dead for discovery; the attractive platforms are the legally closed ones

**Summary:** Of 25+ aggregator and ticketing platforms evaluated, the ones with the best under-5 content are the ones you may not automate against, and the one everybody reaches for first no longer works.

**Details:**

| Platform | Status | Verdict |
|---|---|---|
| **OpenActive (Southwark, Tower Hamlets, GLL)** | Keyless RPDE JSON, CC-BY 4.0 | **Use now** |
| **ClassForKids** | No API, ~40k crawlable pages, robots.txt disallows only `/iframe/*`, **no published terms of use**, structured JSON with **ages in months** | **Use now** (assert on postcode) |
| **Ticketmaster Discovery** | Genuinely free (5,000 calls/day), correct query shape (`postalCode`+`radius`+dates) — but yields arena family shows, not toddler groups | Consider |
| **Skiddle** | Free key, geo+date+kids category, correct shape; low under-5 yield | Consider |
| **Eventbrite API v3** | **Search withdrawn Feb 2020.** `GET /api/v3/events/search/` returns **404** today. `/destination/search/` is CSRF-gated (401), organiser RSS 404s, robots.txt disallows `/rss/` and `/atom/`. ToS forbids storing past events. | **Avoid** |
| **Happity** | Highest content value, **completely inaccessible** — every page 403s behind Cloudflare, robots.txt `Disallow: /` for ClaudeBot with `ai-train=no`, no OpenActive feed | **Partner, don't crawl** |
| **Pebble** | Best API found (unauthenticated GraphQL; live test: 37 activities, SE10, 3mi, ages 0–60 months) but EULA **explicitly bans** scraping, harvesting and commercial exploitation | **Partner first** |
| **Hoop** | Clean schema.org JSON-LD, permissive robots.txt, but ToS forbids automated interaction. **Alive** (relaunched 2023) — the "Hoop is dead" claim online is a stale 2020 page | **Partner** |
| **Meetup / Facebook Events / DICE** | Pro-gated / Marketing-Partner-only / no API | Avoid |
| **TicketSource, Ticket Tailor, TryBooking** | **Per-organiser only** — no cross-organiser search exists at all | Avoid for bulk |
| **Mumsnet Local** | Discontinued (404) | — |
| **Bookwhen / TeamUp OpenActive feeds** | Measured: 1,857 records nationally, 82 in SE London, **1** under-5. Open-data publication is opt-in and under-5 providers haven't opted in | Low value — **hypothesis failed on measurement** |

**Supporting Evidence:**
```
Pebble live test: postcode SE10, 3 miles, ages 0–60 months → 37 activities
returned, including Tippy Toes Ballet Greenwich at 0.2mi.
Its EULA explicitly forbids scraping, harvesting and commercial exploitation.
Source: research-scratch/aggregators.md §Pebble, accessed 2026-08-11
```

**Implications for Planning:**
- Remove Eventbrite from any architectural plan; it cannot serve discovery.
- Treat Happity, Hoop and Pebble as **business development targets**, not data sources. Their existence validates the demand; their walls are why a borough-focused index has room.
- ClassForKids is the notable exception — genuinely crawlable, and the only source using **age in months**. Its slugs are booby-trapped (`/blackheath` → Surrey, `/deptford` → Wiltshire, `/charlton` → West Sussex): **assert on postcode, never slug.**

**Confidence:** [VERIFIED] — all platform states confirmed by live request.

---

### Finding 5: schema.org/Event JSON-LD is effectively absent from this venue set

**Summary:** The obvious "just parse the structured data" strategy fails on the actual priority venues. Building on JSON-LD would be building on sand.

**Details:**
- Tested **16 listing pages + 20 individual event pages across the 32 priority venues.** **Exactly one** emits `@type: Event` — and only because a WordPress plugin (Modern Events Calendar) injects it automatically.
- What *does* work, confirmed on real target venues:
  - **Spektrix** — 9 venues, 310 forthcoming events from nine GETs, ~2s wall clock, £0
  - **WordPress REST** — 4 more venues, 319 event records, supports `modified_after` for cheap incremental sync. **Always call `/wp-json/wp/v2/types` first** to discover the real event post type.
  - **Squarespace** `?format=json` — works on collection *and* item URLs (confirmed on Mudchute); events collections give `startDate`/`endDate` as **epoch ms**
  - **Sitemaps** solve enumeration where no API exists: `event-sitemap.xml` yielded **215 URLs** (Horniman) and **284 URLs** (Deptford Lounge)
- **Confirmed absent:** Drupal JSON:API on rmg.co.uk and royalgreenwich.gov.uk (module not enabled — *do not assume Drupal ⇒ JSON:API*); Umbraco Delivery API on Woodland Trust; Webflow (token-gated); Wix Events (instance-token-gated); Next.js `__NEXT_DATA__` on greenwichpeninsula and better.org.uk.
- **The big brands block you; local venues don't.** National Trust (Radware bot wall), Historic Royal Palaces, Dulwich Picture Gallery and Southbank Centre are hard-blocked. Horniman, RMG and the Spektrix theatres are wide open. **Invest in local venues, not national brands.**
- 4 of 32 priority venues returned 403 to a declared bot UA; one is fixed by a browser UA, two are not. Cloudflare challenges have a definitive signal — the **`cf-mitigated: challenge` header** — and once challenged a plain `fetch()` **cannot** pass, so **detect-and-stop is the only correct behaviour** (and is also what keeps you clear of Computer Misuse Act s.1).

**Implications for Planning:**
- Order the ingest tiers by *confirmed* mechanism, not by elegance: **vendor API → CMS REST → sitemap+HTML → LLM extraction**.
- Reserve LLM extraction for the minority of pages where dates exist only in prose. It is a fallback tier, not the engine.

**Confidence:** [VERIFIED] — negative result measured across 36 pages.

---

### Finding 6: Decoupling search from inference is a 40–120× unit-cost reduction

**Summary:** Perplexity bundles retrieval and inference at $0.1325/call. Doing the same work as [free search] + [self-hosted fetch] + [nano-class extraction] costs ~$0.001–0.003 per event.

**Details:**
- **True cost of the current single call: ≈ $0.13 (£0.098)** — $0.014 request fee (`sonar-pro` at `search_context_size: high` = $14/1K requests) + ~$0.024 input + ~$0.09 output. That is **~0.5 US cents per event, 0.5% of the weekly budget** — the current pipeline is not remotely budget-limited.
- **Hard ceiling: ~204 `sonar-pro` calls/week** at £20/week. Switching `sonar-pro` → `sonar` cuts the same call ~79% (to ~$0.028) and lifts the ceiling to ~964/week.
- **Extraction cost per page** (10k in → 600 out): `gpt-5-nano` **$0.00074** · Groq `llama-3.1-8b-instant` $0.00055 · OpenRouter `ling-2.6-flash` $0.00012 · Gemini 2.5 Flash-Lite $0.00124 · Claude Haiku 4.5 $0.01300 · Fable 5 $0.13000 — a **176× spread** for a task the cheap model does correctly.
- **Do not micro-optimise within the nano class.** At 600 pages/week the entire spread from cheapest to Haiku 4.5 is **£0.05 → £5.78/week**. Choose on **schema-adherence reliability, not price**; saving £0.28/week is not worth an hour of debugging malformed JSON.
- **~8,430 free searches/month exist before spending anything**: Gemini grounding 5,000 + Brave 1,000 + Tavily 1,000 + Exa ~1,430. Serper is cheapest paid at ~$0.30/1K.
- **Prompt caching amplifies this.** The extraction system prompt + JSON schema (~2,000 tokens) is byte-identical every call. Order prompts as `[stable schema + instructions] → [volatile page HTML]` so the cache prefix never breaks.
- **Dead ends confirmed:** Bing Search API retired 2025-08-11; Google Custom Search JSON API closed to new customers, discontinued 2027-01-01. Neither is adoptable.
- **Embeddings are free at this scale** — $0.005 per 1,000 events. Dedup cost should never enter an architecture decision.

**Supporting Evidence:**
```
FX basis: £1 = $1.3498 (Federal Reserve H.10, rate dated 2026-08-07).
Budget = $27.00/week / $117.00/month.
Source: research-scratch/cost-economics.md §0
```

**Implications for Planning:**
- Keep Perplexity, but demote it to **~15 calls/week of genuine open-ended novelty discovery**, at `search_context_size: 'medium'` rather than `'high'`.
- Spend the headroom on **cadence** (daily runs cost £2.30–£8/week) and a **quality-escalation tier**, not on a bigger model.

**Confidence:** [VERIFIED] against official pricing pages. Note three corrections to commonly-cited figures: Claude Sonnet 5 remains **$2/$10** (the Sept 2026 rise to $3/$15 was cancelled); there is **no standalone `sonar-reasoning`** model, only `sonar-reasoning-pro`; Together's "up to 50%" batch discount applies to six models, none of them its cheap ones.

---

### Finding 7: The legal position is favourable — but not where intuition says

**Summary:** UK database right is weak over venues' own listings, and strongest over exactly the aggregated feeds that are easiest to consume.

**Details:**
- ***BHB v William Hill* (C-203/02)** holds that investment in **creating** data does not count toward database right — only **obtaining or verifying pre-existing** data does. A venue's own what's-on page is *created* data, so database right there is weak to non-existent. **This covers most targets.**
- The sharp edge runs counter to intuition: **the Spektrix API is the most legally exposed source precisely because it aggregates** — even though it is the easiest to consume.
- ***Football Dataco v Stan James* [2013] EWCA Civ 27** establishes that the **publishing** site can be liable as a joint tortfeasor *without knowledge*. "We only aggregate" is not a shield.
- **CC-BY 4.0 on the OpenActive feeds is an explicit licence to store and redisplay with attribution** — the cleanest legal position available, and it happens to sit on the highest-yield source.
- **Explicit prohibitions found:** `bexleylocaloffer.uk/robots.txt` is `Disallow: /` (the only outright crawl prohibition in the study); Happity disallows ClaudeBot with `ai-train=no`; Pebble, Hoop, Day Out With The Kids, TicketSource and TryBooking all carry anti-automation or anti-redistribution terms.
- One commonly-miscited authority to avoid: **Trailfinders is not a database-right case** — it concerns ex-employee confidence.

**Implications for Planning:**
- Attribute CC-BY sources visibly; treat this as a UI requirement, not a footnote.
- Prefer venue-origin data over aggregator data where both exist — cheaper legally *and* fresher.
- Implement `cf-mitigated: challenge` detection with hard stop, and a declared, contactable User-Agent.

**Confidence:** [VERIFIED] on case law; ToS positions confirmed by direct reading.

---

## Technical Assessment

### Source tier evaluation

| Tier | Mechanism | Est. under-5/week | Cost | Effort | Verdict |
|---|---|---|---|---|---|
| **T1 — OpenActive RPDE** | Keyless JSON, CC-BY 4.0 | ~810 | £0 | Low (1 adapter, 3 feeds) | **Recommend — build first** |
| **T1 — Family Hubs APIs** | JSON POST, no auth | ~95 (TH) + ~110 (Gwch) + ~55 (Lew) | £0 | Low | **Recommend** |
| **T2 — Spektrix** | Unauthenticated JSON, 7–9 venues | ~2,600 instances (all-age) | £0 | Low (1 adapter) | **Recommend** |
| **T2 — Library feeds** | Better turbo-frame, Solus RSS, HTML | ~150–170 | £0 | Medium | **Recommend — highest quality** |
| **T3 — CMS REST** | WordPress REST, Squarespace JSON, Drupal JSON:API | ~300 records | £0 | Medium | **Recommend** |
| **T4 — Sitemap + HTML + LLM** | fetch → nano-class extraction | Long tail | £0.33–0.91/wk | High (maintenance) | **Recommend as fallback tier** |
| **T5 — Novelty search** | Free search allowances + Serper overflow | Discovery only | £0.22/wk | Low | Consider |
| **T6 — Perplexity** | `sonar-pro`, ~15 calls/wk, medium context | Novelty only | £1.47/wk | Already built | **Keep, demoted** |
| **T7 — Community submission** | Human-submitted | The residual gap | £0 | Medium | **Recommend — the only answer to church halls & Facebook groups** |
| — Councils | HTML scrape | ~80–120 | £0 | High per borough | Consider late |
| — Eventbrite / Meetup / Facebook / DICE | — | 0 | — | — | **Avoid** |
| — Happity / Pebble / Hoop | — | High value, closed | — | — | **Partner, don't crawl** |

### Cost model — three scenarios at 400 events/week

| | A: Perplexity scaled | B: Crawl + cheap LLM | **C: Hybrid (recommended)** |
|---|---|---|---|
| **£/week** | £2.45 – £9.42 | £0.90 | **£2.60** |
| **£/month** | £10.63 – £40.83 | £3.92 | **£11.27** |
| **% of £20/wk** | 12% – 47% | 4.5% | **13%** |
| **Daily cadence affordable?** | ❌ (£66/wk) | ✅ (£2.30/wk) | ✅ (~£8/wk) |
| **Long-tail coverage** | Poor — SEO-indexed only | Good | **Best** |
| **Marginal £/extra event** | ~$0.008 | ~$0.0011 | ~$0.0035 |
| **Main risk** | Recall ceiling | Source-list maintenance | Complexity |

**Scenario C line items:** free structured feeds £0 · fetch £0 · `gpt-5-nano` extraction on 600 pages £0.33 · Haiku 4.5 escalation on ~60 pages £0.58 · free search allowances £0 · Serper overflow £0.22 · Perplexity 15 calls £1.47 · dedup embeddings £0. **Total £2.60/week, leaving £17.40/week headroom.**

### Deduplication design (Postgres/Supabase)

- **Use trigram similarity, not embeddings.** Embeddings encode the *wrong* similarity here: "Toddler Yoga" and "Baby Yoga" are semantically close but are **different activities**. Trigrams correctly separate them. (Cost is not the reason — 50,000 titles embeds for about 1.5p.)
- **`unaccent()` is `STABLE`, not `IMMUTABLE`** — it cannot be used inside a `STORED` generated column (Postgres rejects it: `generation expression is not immutable`). The common workaround of wrapping it in a fake-`IMMUTABLE` function lies to the planner and corrupts the index if the dictionary changes. **Use `translate()` instead.**
- **Index with GiST, not GIN.** KNN queries (`ORDER BY col <-> 'query' LIMIT n`) — which is exactly the "5 most similar existing activities" shape — are accelerated by GiST and **not** by GIN.
- **Pre-dedupe with `DISTINCT ON` before `ON CONFLICT DO UPDATE`.** A venue page listing the same weekly session twice triggers a cardinality violation that aborts the **entire batch**. This is not optional.
- Natural dedup key: normalised `(title, venue_postcode, day_of_week, start_time)`.
- Change detection: HTTP `ETag`/`Last-Modified` plus content hashing to skip unchanged pages.

**Risks / trade-offs:**
- The 600–825/week recurring figure was measured mid-holiday; term-time re-sampling is required before it becomes a target.
- Source-list maintenance is the real long-run cost, not API spend.
- Cross-tier dedup must be designed **before** ingest code is written — the same session appears in two or three feeds and sources disagree fundamentally on series-vs-occurrence modelling.

---

## Gaps & Opportunities

### Gaps Identified

1. **Church and community-hall toddler groups — the largest unindexed pool**
   - Description: ~120–200 sessions/week, ~55% of groups harvested in the domain leg. Often a single line on a parish page, a Facebook post, or nowhere online.
   - Competitive coverage: **None.** No aggregator covers this.
   - Opportunity: **ChurchSuite public JSON** (`{slug}.churchsuite.com/embed/calendar/json` — no auth, recurring series pre-expanded) was live on 3 of 10 SE London churches probed. A Church Near You provides schema.org JSON-LD plus per-parish iCal. Beyond that, community submission tooling.

2. **Bromley and Bexley have no OpenActive publisher**
   - Description: Mytime Active and Bexley's leisure operator do not participate; council calendars are thin (Bromley's whole calendar is ~19–30 events). Bexley has **no** children's-centre timetables in any format, and `bexleylocaloffer.uk` prohibits crawling outright.
   - Opportunity: These two boroughs need a relationship-led acquisition strategy, not more code.

3. **Tower Hamlets library rhyme-times are unpublished machine-readably**
   - Description: The Idea Store Solus feed contains **zero** rhyme/story times despite the service running them.
   - Opportunity: Direct ask to the service; or community submission.

4. **Term-time calendars are a missing dependency**
   - Description: Nothing in the current system knows borough school-holiday dates, yet `term_time_only` is the single highest-impact correctness field.
   - Opportunity: Borough term dates are published annually and are trivially ingestible — a small, high-leverage build.

### Underserved Segments

- **Greenwich specifically is an open field** — Hoop's Greenwich region is **empty**, GreenwichMums died in July 2024 (yet still holds the borough's most complete library timetable, listing a branch that no longer exists), no Mumbler franchise exists, and the local blog scene has collapsed — all sitting atop the **richest structured dataset in the borough set**.
- **Dad/male-carer, SEND-inclusive, multiple-birth and young-parent groups** — high demand, tiny supply, badly indexed everywhere. High user value per listing.
- **Age-in-months precision** — incumbent schemas already support age-in-months and `excludesSchoolHolidays`; **0 of 43 listings sampled populate either.** This is precisely where a borough-focused index can beat national aggregators.

---

## Risks & Challenges

### Delivery Risks

1. **Seasonal mis-measurement**
   - Probability: High | Impact: Medium
   - Mitigation: Re-sample all volume figures against ~2026-09-15 before setting targets or judging the pipeline's yield.

2. **Source-list maintenance burden becomes the real cost**
   - Probability: High | Impact: High
   - Mitigation: Instrument per-source yield and failure rate from day one; treat a source that stops returning data as a monitored incident, not a silent zero. Prefer feeds over scrapes wherever both exist.

3. **Term-time false positives destroy trust faster than missing listings**
   - Probability: High if unmitigated | Impact: High
   - Mitigation: Make `term_time_only` mandatory and gate publication on it (Gate G7). In August this alone removes ~72% of library sessions from the published set.

4. **Cross-tier duplication**
   - Probability: Certain | Impact: Medium
   - Mitigation: Decide the series-vs-occurrence model and the dedup key **before** writing ingest code.

### External Threats

- **Feed withdrawal** — any single free feed can disappear. OpenActive's CC-BY status and public catalogue make it the most durable; single-vendor endpoints (Spektrix, Better turbo-frame) are less so. Monitor `https://status.openactive.io/` and alert on per-source zero-yield.
- **Cloudflare escalation on currently-open venues** — mitigate with `cf-mitigated` detection and hard stop; never attempt to defeat a challenge.

---

## Recommendations

### Primary Recommendations

1. **Fix the data model before writing any adapter**
   - Action: Migrate from `london_events` (single `date`) to **Activity + generated Occurrence**. Add mandatory `term_time_only`, `age_min_months`/`age_max_months`, a schedule rule (`rrule` or day/time), a validity window (`starts_on`/`ends_on`), `booking_mode` (drop-in vs book-ahead), access flags, and provenance (`source_url`, `deep_link`, `last_verified_at`, `confidence`). Add the normalised dedup key with a GiST trigram index and a unique constraint.
   - Rationale: Finding 1 — no adapter or rubric can rescue the wrong primitive; ~97% of supply is invisible to the current schema.
   - Priority: **Critical — blocks everything else**
   - Note: `is_recurring`, `day_of_week` and `recurring_time` already exist on `london_events` (migration 005) but `discover-events` never populates them, and there is no unique constraint, so re-running discovery inserts duplicates.
   - Handoff: `bmad-tech-spec` or `bmad-architecture` (data model ADR)

2. **Build free feed adapters in strict yield order**
   - Action: (a) Tower Hamlets Family Hubs API as the pipeline proof — smallest, cleanest, 421 records tagged 0-5, ~half a day. (b) OpenActive RPDE across the three feeds — highest volume, CC-BY, only Lewisham coverage. (c) Spektrix one-adapter-seven-venues. (d) Better/GLL library timetables + Lewisham Libraries RSS. (e) WordPress REST + Squarespace JSON. Only then (f) sitemap+HTML with nano-class LLM extraction.
   - Rationale: Finding 2 — ~1,000+ under-5 occurrences/week at £0, with yield-per-engineering-hour an order of magnitude above crawling.
   - Priority: **High**
   - Handoff: `bmad-epics-and-stories` (one epic per tier, one story per adapter)

3. **Demote Perplexity to a novelty probe and decouple search from inference**
   - Action: Reduce to ~15 `sonar-pro` calls/week at `search_context_size: 'medium'`; move bulk extraction to a nano-class model over pre-fetched HTML with a cached system prompt; use free search allowances (~8,430/month) before any paid search.
   - Rationale: Finding 6 — a 40–120× unit-cost reduction, and Perplexity's real weakness is recall on the long tail, not price.
   - Priority: **Medium** (do after tiers 1–3 land; the current call can keep running meanwhile)
   - Handoff: `bmad-tech-spec`

4. **Implement the quality gates and scoring rubric as code**
   - Action: Seven hard gates (resolvable occurrence, working deep link, locatable venue in-polygon, explicit under-5 suitability, not-a-duplicate, currency, term-time compliance) plus a weighted 0–100 score with publication thresholds at 70/50/35.
   - Rationale: Findings 1 and 4 — this is where "quality" stops being a wish and becomes testable.
   - Priority: **High**
   - Handoff: `bmad-epics-and-stories`

### Secondary Recommendations

- **Ingest borough term-date calendars** — small build, gates the highest-impact correctness field.
- **Build community submission tooling** — the only realistic answer to church halls and Facebook groups (~22% of supply).
- **Open partnership conversations with Happity and Hoop**, and put the Outpost/ORUK ask to Royal Greenwich. All three are relationship plays, not engineering.
- **Track system-level coverage metrics, not just listing quality**: recurring share (target ≥75%), free share, walkable share (≤0.8 mi), and borough balance (no borough <10% of the index).
- **Add visible source attribution in the UI** — required by CC-BY 4.0 on the highest-yield feeds.

---

## Next Steps

### Immediate Planning Actions

- [ ] Decide the series-vs-occurrence data model and the cross-tier dedup key (blocks all ingest work)
- [ ] Re-sample volume figures against ~2026-09-15 to get a term-time baseline
- [ ] Run `select * from pg_available_extensions where name in ('pg_trgm','fuzzystrmatch')` to confirm extension availability (near-certain, 30 seconds)
- [ ] Read `usage.input_tokens` off one live Perplexity response to close the last cost unknown

### Follow-Up Research Needed

- Term-time baseline re-measurement — method: re-run the same endpoint probes mid-September
- Happity / Hoop / Pebble partnership terms — method: direct commercial contact
- Bromley and Bexley acquisition strategy — method: relationship mapping, not code
- Facebook group and Instagram curator coverage — method: manual survey; deliberately left unfilled rather than fabricated

### Recommended BMAD Handoff

**Next skill:** `bmad-tech-spec` — but note the scope check. This is a Quick Flow project (1–15 stories); the work described here plausibly exceeds that. If story count passes ~15 during scoping, redirect to `bmad-prd` + `bmad-architecture`.

**Key inputs for next skill from this report:**
- The Activity/Occurrence data model and mandatory fields (Recommendation 1)
- The tier-ordered adapter list with measured yields (Technical Assessment)
- The seven hard gates and 0–100 scoring rubric (Recommendation 4)
- The £2.60/week Scenario C cost envelope

---

## Appendices

### Appendix A: Detailed research legs

The five detailed research legs are retained in full under `bmad-output/research-scratch/` — **4,860 lines** of measured endpoint results, per-borough detail, concrete URLs, panel-ID maps, SQL, and ~510 named SE London sources. These are working reference material for implementation, not disposable notes:

| File | Lines | Contents |
|---|---|---|
| `public-data.md` | 1,133 | Per-borough council/library/family-hub feeds; 50 CONFIRMED WORKING endpoints, 23 NOT FOUND; all 26 Better panel IDs; OpenActive RPDE consumption notes |
| `domain-under5.md` | 1,186 | 25-category demand taxonomy; recurring-vs-one-off evidence; ~510 named sources with URLs; competitor comparison; full quality rubric |
| `aggregators.md` | 1,193 | 25+ platform evaluations with live test results, quotas, ToS positions |
| `crawl-tech.md` | 882 | Confirmed venue endpoints; CMS cheat-sheet; crawl-infra cost table; UK legal analysis; dedup SQL |
| `cost-economics.md` | 466 | Master pricing tables; search API free tiers; three-scenario cost model |

### Appendix B: Source bibliography

Full bibliographies with access dates are held per-leg in the files above (~110 cited sources in `domain-under5.md`, 70 in `public-data.md`, plus 24 in `cost-economics.md`). Headline sources:

1. OpenActive. "Data Catalog Collection." https://openactive.io/data-catalogs/data-catalog-collection.jsonld. Accessed 2026-08-11.
2. GLL/Better. "OpenActive scheduled sessions feed." https://better-admin.org.uk/api/openactive/better/scheduled-sessions. Accessed 2026-08-11.
3. Southwark Council. "OpenActive live scheduled sessions." https://opendata.leisurecloud.live/api/feeds/SouthwarkCouncil-live-scheduled-sessions. Accessed 2026-08-11.
4. Tower Hamlets Council. "OpenActive live scheduled sessions." https://opendata.leisurecloud.live/api/feeds/TowerHamletsCouncil-live-scheduled-sessions. Accessed 2026-08-11.
5. Tower Hamlets Best Start Family Hubs. "GetEventSchedules API." https://www.thfamilyhubs.co.uk/api/GetEventSchedules. Accessed 2026-08-11.
6. Spektrix. "API v3 — events and instances." https://system.spektrix.com/{client}/api/v3/events. Accessed 2026-08-11.
7. GLL/Better. "Library timetable items." https://www.better.org.uk/library/dynamic_pages/panels/{panelId}/timetables/items. Accessed 2026-08-11.
8. Lewisham Libraries (Solus). "Events RSS." https://lewisham.events.mylibrary.digital/rss. Accessed 2026-08-11.
9. Perplexity. "Pricing." https://docs.perplexity.ai/getting-started/pricing. Accessed 2026-08-11.
10. Google. "Event structured data." https://developers.google.com/search/docs/appearance/structured-data/event. Accessed 2026-08-11.
11. DfE/DHSC. "Family Hubs and Start for Life programme guide." Accessed 2026-08-11.
12. Court of Justice of the EU. *British Horseracing Board v William Hill* (C-203/02).
13. Court of Appeal. *Football Dataco v Stan James* [2013] EWCA Civ 27.
14. Federal Reserve. "H.10 Foreign Exchange Rates" (rate dated 2026-08-07). Accessed 2026-08-11.
15. OpenActive. "Feed status dashboard." https://status.openactive.io/. Accessed 2026-08-11.

### Appendix C: Methodology notes

- Five parallel research agents, each with an independent brief, writing to separate scratch files; synthesis performed against the source files rather than agent summaries.
- Agents were instructed to **test candidate endpoints empirically** and label results CONFIRMED WORKING / LIKELY / NOT FOUND. Negative results (Eventbrite 404, Drupal JSON:API absent, Open Referral UK zero London adoption) carry equal weight to positive ones and were retained.
- Three self-corrections were made during research and are recorded here for traceability: an initial Bookwhen-as-Happity-proxy hypothesis **failed on measurement** (1 under-5 record in SE London); an initial claim that embedding cost argued against pgvector was **wrong** (cost is negligible — the real objection is semantic); and three SQL defects in the proposed dedup design (`unaccent` immutability, GIN vs GiST, `ON CONFLICT` cardinality) were caught and fixed before publication.
- All measurements taken 2026-08-11 unless stated. **Mid-school-holiday sampling is a known bias** — see Limitations.

---

**Report Generated By:** BMAD Research Skill (bmad-planning-orchestrator)
**Output Path:** bmad-output/research-report.md
**Related Documents:** bmad-output/project-context.md | bmad-output/decision-log.md | bmad-output/research-scratch/
**Last Updated:** 2026-08-11
