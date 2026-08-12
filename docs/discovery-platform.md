# Discovery Platform

How the GPC event discovery system works, as of 2026-08-12.

Finds activities for parents and carers of under-5s in South East London from 10
sources, holds them for review, and publishes approved ones to the public
What's On page.

---

## 1. Why it exists

The previous system made one Perplexity call and returned 25–30 dated events.
It consistently surfaced museums, theatre and festivals aimed at 5–12 year olds
and missed almost everything an under-5 parent actually uses.

The cause was the **data model, not the model or the budget**:

> **~97% of under-5 provision is weekly recurring and term-time bound** —
> rhyme time, stay-and-play, church toddler groups. Roughly 600–825 sessions a
> week versus 10–25 genuine one-offs. Sources publish *"Tuesdays 10:30, term
> time"* and never emit a dated occurrence, so a system built around "events in
> the next 14 days" structurally cannot see them.

A generic "family events in SE London" search reaches 3 of 25 demand categories,
and they are the lowest-frequency, highest-cost, most-travel-required three.

This was later measured directly. Across five evaluation rounds, that generic
prompt returned **7.6 plausible events per run of which ZERO passed the under-5
gate**.

---

## 2. Architecture

```
 ┌─ 9 open feeds ──────────┐   ┌─ LLM long-tail ───────────┐
 │ OpenActive ×4           │   │ gpt-4.1-mini + web_search │
 │ Spektrix ×7 venues      │   │   fan-out, 2 areas/run    │
 │ Better libraries ×7     │   │ gpt-5-nano verifies each  │
 │ Lewisham RSS            │   │   page                    │
 │ TH Family Hubs          │   └───────────┬───────────────┘
 │ ClassForKids            │               │
 └────────────┬────────────┘               │
              └───────────┬────────────────┘
                          ▼
              activities + occurrences         ← system of record
                          │
                  /admin/discovery             ← human approval
                          │  publish_activity()
                          ▼
                   london_events               ← published view
                          │
        ┌─────────────────┼─────────────────┐
     What's On         EventMap          Newsletter
```

**`london_events` is the published view; `activities` is the system of record.**
Discovery never writes to `london_events` directly — only an approval click
does. That is why `activity_id` cleanly separates discovered rows from the
pre-existing ones, and why nothing reaches the public site unreviewed.

---

## 3. Data model

`london_events` has one `date` per row and no age-in-months, term-time flag,
provenance or quality score. It cannot express what discovery produces, so a
richer model sits alongside it.

| Table | Purpose |
|---|---|
| `activities` | The series/definition — schedule rule, validity window, age in months, term-time flag, provenance, confidence |
| `occurrences` | Dated instances. **Generated** from schedule × validity × term calendar for recurring activities; ingested directly for one-offs |
| `discovery_sources` | Source registry — adapter name, endpoint config, `enabled`, `area_policy`, RPDE cursor |
| `term_dates` | Per-borough school holidays. Gates `term_time_only` |
| `ingest_runs` | Per-source yield and errors, one row per source per run |
| `ingest_batches` | One row per Discover click; what the UI polls |
| `model_evaluations` | LLM prompt/model comparison results |

### Age is in months, not years

The difference between a 6-month-old and a 4-year-old is the entire product.
Of 43 competitor listings sampled during research, **zero** populated
age-in-months despite their schemas supporting it.

### `term_time_only` is a tri-state

| Value | Meaning | Effect |
|---|---|---|
| `true` | Source says "term time only" | Suppressed during school holidays |
| `false` | Source says "school holiday fun" | Runs **only** in holidays — never suppressed |
| `null` | No mention | **Never suppressed** |

The `false` case is why this is not a boolean. `"School holiday fun with toys
and stories"` also matches loose term-time patterns; treating it as term-time-only
would hide it exactly when it runs.

---

## 4. The 10 sources

All keyless and free except the last.

| Source | Endpoint | Notes |
|---|---|---|
| `openactive-better` | `better-admin.org.uk/api/openactive/better/session-series` | **National** feed (~5,000 series incl. Cardiff, Belfast, York). CC-BY 4.0 |
| `openactive-southwark` | `opendata.leisurecloud.live/api/feeds/SouthwarkCouncil-live-session-series` | CC-BY 4.0 |
| `openactive-towerhamlets` | `.../TowerHamletsCouncil-live-session-series` | CC-BY 4.0 |
| `bookwhen-openactive` | `bookwhen.com/api/openactive/sessionseries` | CC-BY 4.0. Thin for SE London |
| `spektrix` | `system.spektrix.com/{client}/api/v3/events` + `/instances` | 7 venues. Albany=SE8, Greenwich Theatre=SE10 |
| `better-libraries` | `better.org.uk/library/dynamic_pages/panels/{id}/timetables/items` | Highest-**quality** under-5 content (Rhymetime, Bounce & Rhyme) |
| `lewisham-libraries` | `lewisham.events.mylibrary.digital/rss` | Only machine-readable route into Lewisham libraries |
| `th-family-hubs` | `POST thfamilyhubs.co.uk/api/GetEventSchedules` | Only source that **declares** under-5 (`"Best Start in Life (0-5)"`) |
| `classforkids` | `classforkids.io/en-GB/classes/{OUTCODE}` + header `RSC: 1` | Only source with **age in months**. Directory entries, no dates |
| `llm-discovery` | OpenAI Responses API | Long tail only — church halls, independent classes, pop-ups |

Plus `api.postcodes.io` for postcode → borough and coordinates.

**CC-BY 4.0 requires attribution on display.** `discovery_sources.attribution`
holds the required string.

---

## 5. Running it

Either admin button — **What's On → Discover Events**, or **Discovery → Run
discovery** — triggers the same single call.

```
POST /functions/v1/ingest-activities   →  202 in ~1.3s
                                          { batch_id, sources_queued: 10 }
       work continues via EdgeRuntime.waitUntil()
       UI polls ingest_batch_status every 3s
```

**Fire-and-poll is not optional.** Supabase enforces a **150s request idle
timeout on every plan** — this is not a free-tier limit and upgrading does not
lift it (only the worker wall clock goes 150s → 400s). Holding the request open
for a ~156s run returned a 504 with no results and no `ingest_runs` rows closed,
losing the entire run.

The internal budget is **128s**, so a click may skip the last one or two
sources. They are reported as skipped, not silently dropped, and resume cheaply
next click because RPDE cursors persist. `llm-discovery` runs **first** — the
feeds recover on the next run, whereas a skipped LLM run loses that day's novel
events outright.

---

## 6. Review and publish

`/admin/discovery` lists pending activities from the `activity_review_queue`
view. Approving calls `publish_activity(id)`, which projects **up to 12
occurrences within 28 days** into `london_events` as approved rows.

Recurring activities publish as **dated rows with `is_recurring = false`**.
This is deliberate: the public hook filters `.eq('is_recurring', false)`, so
`true` would hide them. A weekly session therefore appears on each date it runs
and the existing date filters work unchanged.

| Function | Effect |
|---|---|
| `publish_activity(id, horizon_days, max_occurrences)` | Projects occurrences → `london_events`. Raises if the activity has **no dates** |
| `unpublish_activity(id)` | Removes published rows, returns activity to pending |
| `reject_activity(id, reason)` | Removes published rows, marks rejected |
| `backfill_activity_coordinates()` | Fills missing lat/lng from same-postcode activities |
| `reset_discovery()` | Clears all discovered data. Guarded on `activity_id IS NOT NULL` |
| `load_term_holidays(borough, jsonb)` | Loads school-holiday ranges |

**The caps exist because the raw data dwarfs a listings page.** Some Better/GLL
soft-play series run hourly — 17+ slots a week, 500+ occurrences each. Without
the caps, approving the recurring set would write >21,000 rows and show 17
identical entries for one Tuesday.

---

## 7. Configuration

`discovery_sources` is the control panel — it is **data, not code**. Disabling a
source or repointing a URL is a row edit, no deploy.

### `area_policy`

The map filters by distance at *display* time, so ingest is deliberately
generous — but not unfiltered.

| Policy | Applied to | Behaviour |
|---|---|---|
| `curated` | Spektrix, Lewisham, TH Family Hubs | No geo filter — targets are hand-picked |
| `london` | OpenActive ×4, Better libraries, ClassForKids, LLM | Greater London via postcodes.io `region` |
| `served` | *(none currently)* | Served boroughs only |

Filtering happens in two stages: a cheap outcode prefilter (no network), then an
authoritative postcodes.io lookup. **Do not replace stage 2 with a lat/lng
box** — Cardiff sits at almost exactly Greenwich's latitude.

---

## 8. LLM discovery

Targets only what the institutional feeds structurally cannot reach — roughly
22% of under-5 supply.

Configuration was chosen by measurement, recorded in `model_evaluations`:

| Prompt | Novel valid events / run |
|---|---:|
| `baseline` (generic) | **0.0** |
| `long_tail` | 1.8 |
| `under5_specific` | 0.8 |
| `search_harder` (single call) | 4.4 |
| **`area_scoped` fan-out (6 areas)** | **20.0** |

**Fan-out happens in code, not the prompt.** The model issued exactly **one**
`web_search` call per run however forcefully the prompt demanded six. Search
breadth cannot be bought with wording. One request per area also lifted
working-link rate from ~62% to **89%**.

Two stages:
1. `gpt-4.1-mini` + `web_search` — web search requires the Responses API with
   `gpt-5.6`/`5.5`/`5.4`/`4.1`/`4.1-mini`. **The nano tier has no live data.**
2. `gpt-5-nano` fetches each candidate page and confirms the event really runs
   in the window, correcting date/postcode/age.

Verification raises precision but **must not zero the yield** — if the verify
call itself fails, the adapter degrades to "page fetched successfully" at
reduced confidence rather than discarding everything. Stats separate
`no_page` / `rejected` / `verify_failed`.

**Cost:** ~$0.035 per run at 2 areas ≈ **£0.18/week** if run daily.

---

## 9. Gotchas found by measuring

Each of these was a live bug caught by checking yield rather than trusting the
parser. They are documented because they will recur.

| Finding | Consequence if forgotten |
|---|---|
| Better/GLL `eventSchedule` is an **archive**, not a timetable — entries expired in 2022 | Publishes sessions that stopped running four years ago |
| Slots must be deduped | 18 activities produced **10,146** "weekly" occurrences |
| `"All under 8s must attend with an adult"` is a **supervision** clause | Southwark went 83 → 15 once fixed; the rest were generic adult swims |
| TH Family Hubs publishes one row **per date-instance** (791 rows → 60 events) | 92% of dates silently discarded |
| `leisurecloud.live` blocks `Python-urllib` but allows a declared UA | Both council feeds die silently if the User-Agent header is dropped |
| ClassForKids slugs are wrong (`/blackheath` → Surrey) | Always query by outcode, trust the `postcode` field |
| Bookwhen sets `location.address` to a **string** | Every record drops as "no postcode" |
| OpenAI strict schema requires **every** property in `required` | Request rejected outright |
| `GRANT ... TO authenticated` does **not** restrict | Postgres grants EXECUTE to PUBLIC by default — anon could call `SECURITY DEFINER` RPCs |
| Views don't enforce the underlying table's RLS | `ingest_batch_status` was anon-readable; needs `security_invoker = on` |

---

## 10. Known gaps

- **`term_dates` is empty.** The term-time gate matches nothing, so library
  sessions publish through the school holidays. Verified 2026/27 dates could not
  be sourced (Greenwich 404s, Southwark unparseable, Lewisham has dropped the
  current year), and were not invented. Load with `load_term_holidays()`.
- **No cron.** Ingest only runs on a click, so data is as fresh as the last one.
- **No quality scoring.** The 7-gate / 0–100 rubric from the research is not
  implemented; `quality_score` is an unpopulated column.
- **Churches need outreach, not a scraper.** Across all 15 churches in
  SE8/SE10/SE13 only 7 of 49 events carry an under-5 tag. Real toddler groups
  exist only as prose. This ~22% of supply needs a claim/submit flow.
- **SE13 is thin.** Lewisham Library produced no under-5 items in the RSS.
- **Do not crawl Happity** (robots.txt disallows ClaudeBot, `ai-train=no`),
  **greenwich0to4.co.uk** (`Disallow: /` for browser UAs), or **Mudchute**.

---

## 11. File map

```
supabase/
  migrations/008–018_*.sql          schema, publish fns, security fixes
  functions/
    ingest-activities/index.ts      orchestrator (fire-and-poll)
    evaluate-discovery/index.ts     LLM eval harness
    _shared/discovery/
      types.ts  geo.ts  age.ts  term-time.ts  occurrences.ts  writer.ts
      adapters/openactive.ts  spektrix.ts  better-libraries.ts
               lewisham-libraries.ts  th-family-hubs.ts
               classforkids.ts  llm-discovery.ts
src/
  hooks/useDiscoveredActivities.js  queue reader, RPCs, polling
  pages/admin/DiscoveryManager.jsx  review UI  (/admin/discovery)
bmad-output/                        research reports behind every adapter
```
