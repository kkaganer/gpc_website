# Crawl-the-venue-sites-ourselves: techniques, tooling, cost

**Research leg:** technical feasibility of replacing/augmenting the single Perplexity `sonar-pro` call with direct venue crawling.
**Date of research:** 2026-08-11. All endpoint tests below were executed live on that date from a UK-routed client.
**Baseline being replaced:** 1 Perplexity call over 33 priority venue URLs → 25–30 events/week.

---

## 0. Headline findings (decision-relevant)

1. **Schema.org `Event` JSON-LD is effectively absent from this venue set.** Tested 16 listing pages + 20 individual event pages across the actual 32 priority venues. **Exactly one venue** emits `@type: Event` — and only because a WordPress plugin (Modern Events Calendar) injects it automatically. Building the architecture on JSON-LD would be building on sand.
2. **The real win is Spektrix.** 9 of the target/adjacent venues run on the Spektrix ticketing platform, which exposes an **unauthenticated, public, well-typed JSON API**. Nine HTTP GETs returned **310 forthcoming events** with proper UTC timestamps, prices, durations, images and (on some clients) age recommendations. That is ~10× the current Perplexity yield, for **£0** and ~2 seconds of wall-clock.
3. **WordPress REST adds four more venues** with 319 further event records, and supports `modified_after` for cheap incremental sync.
4. **Sitemaps solve discovery for the rest.** `event-sitemap.xml` yielded 215 URLs (Horniman) and 284 URLs (Deptford Lounge) — cheap enumeration even where no API exists.
5. **Cost is a non-issue.** The recommended stack (Supabase pg_cron → Edge Function → direct `fetch()`, with a paid extraction fallback for the JS-heavy minority) lands at **£0–£2/week** against a £20/week budget. The binding constraint is the Edge Function **2s CPU limit**, not money.
6. **Anti-bot is a minor but real tax.** 4 of 32 priority venues returned 403 to a declared bot User-Agent; one of those is fixed by a browser UA, two are not.

---

## 1. Confirmed machine-readable endpoints on real target venues

All tested live 2026-08-11 with `User-Agent: Mozilla/5.0 (compatible; GPCEventBot/1.0; +<contact-url>)`.

### 1a. Spektrix public API — the single biggest find

Pattern: `https://system.spektrix.com/{client}/api/v3/events`

| Venue | Spektrix client | Total events | Next ~16wks | Data quality |
|---|---|---|---|---|
| Blackheath Halls | `blackheathhalls` | **463** | 47 | Excellent. Has `attribute_EventPostcode` (direct location fix), `attribute_Category`, `attribute_Price`. No age field. |
| Discover Children's Story Centre | `discover` | **391** | 33 | Excellent. Highly relevant to under-5s. |
| Greenwich Theatre | `greenwichtheatre` | **138** | 35 | **Best in class.** `attribute_AgeRecommendation` populated on 136/138 events, with values literally including `0-5`, `2+`, `2-6`, `3+`. |
| Polka Theatre | `polka` | **75** | 46 | Excellent. Dedicated children's theatre. |
| artsdepot | `artsdepot` | **74** | 52 | Excellent. |
| The Albany | `thealbany` | **51** | 15 | Good. `attribute_AgeGuidance`, `attribute_FreeEvent`, `attribute_PWYDEvent`. Only 1/51 has an image. |
| Little Angel Theatre | `littleangeltheatre` | **50** | 35 | Excellent. |
| Woolwich Works | `woolwichworks` | **46** | 42 | Excellent. `attribute_AgeGuidanceAndRestrictions`, `attribute_DoorsOpen`, `attribute_Venue`. |
| Unicorn Theatre | `unicorntheatre` | **22** | 5 | Good. `attribute_AgeCategory`, `attribute_AgeGuide`. |
| | **TOTAL** | **1,310** | **310** | |

Confirmed 404 (not Spektrix clients): `barbican`, `southbankcentre`, `nationaltheatre`, `dulwichpicturegallery`, `rmg`, `horniman`, `trinitylaban`.

**Verified response shape** (`greenwichtheatre`, real record, trimmed):

```json
{
  "id": "109401AHBTMTDQLMPLHKGRMBGGDTKBNQH",
  "name": " Confessions of Sweeney Todd",
  "description": "Look out! Sweeney Todd's about!\r\n\r\nAn original one-man performance...",
  "htmlDescription": "<div id>\r\n\r\n</div>",
  "duration": 100,
  "isOnSale": true,
  "instanceDates": "19 October-19 October",
  "firstInstanceDateTime": "2026-10-19T19:30:00",
  "firstInstanceDateTimeUtc": "2026-10-19T18:30:00Z",
  "lastInstanceDateTime": "2026-10-19T19:30:00",
  "lastInstanceDateTimeUtc": "2026-10-19T18:30:00Z",
  "imageUrl": "", "thumbnailUrl": "",
  "attribute_AgeRecommendation": "12+",
  "attribute_Location": "Studio",
  "attribute_Price": "£12.00 / £14.00 / £17.00",
  "attribute_ProductionCompany": " Don't Go Into The Cellar!  Presents"
}
```

**Confirmed working query parameters:**

| Endpoint | Params CONFIRMED working | Notes |
|---|---|---|
| `/api/v3/events` | `instanceStart_from=YYYY-MM-DD`, `instanceStart_to=YYYY-MM-DD` | Verified: filtered 138 → 16 events. Returns events with *any* instance in window; `firstInstanceDateTime` may still fall outside it. |
| `/api/v3/events` | `onSale`, `name`, `attribute_{name}`, `instanceattribute_{name}` | Per docs. |
| `/api/v3/instances` | **`startFrom`, `startTo`** (camelCase) | **Verified**: returned 58 instances, range 2026-08-11 → 2026-09-29. |
| `/api/v3/instances` | ~~`start_from`, `start_to`~~ | **Verified BROKEN** — silently ignored, returned all 727 instances back to 2023. Easy trap. |
| `/api/v3/events/{id}/instances` | `start_from`, `start_to` (snake_case) | Per docs — *different convention on this endpoint*. |

**Critical caveats for implementation:**

- **`attribute_*` names are per-client, not standardised.** Each venue defines its own. The age field alone is `attribute_AgeRecommendation` / `attribute_AgeGuide` + `attribute_AgeCategory` / `attribute_AgeGuidance` / `attribute_AgeGuidanceAndRestrictions` / *absent* across the five venues checked. **You need a per-venue attribute mapping table, discovered once and stored.**
- **`/events` returns past events too.** Blackheath Halls: 463 total but only 60 in the future. Always pass `instanceStart_from`.
- **One `event` = many performances.** Use `/instances` to expand into individual dated sessions.
- **No pagination.** Spektrix docs advise batching by date window instead.
- **No `ETag` or `Last-Modified`**; responds `Cache-Control: no-cache`. Content-hash for change detection.

**Measured performance of the whole Tier-1 fetch** (all 9 clients, date-filtered to the next ~16 weeks, from a UK client on 2026-08-11):

| | Result |
|---|---|
| Sequential wall-clock | **3.16 s** |
| **Parallel wall-clock** (what an Edge Function would do) | **0.57 s** |
| Total payload | **423 KB** across 9 responses (5–105 KB each) |
| Slowest single call | 0.59 s (polka) |

Against Supabase's **150 s free-tier wall clock** this is 0.4% utilisation. 423 KB of `JSON.parse` is trivially inside the **2 s CPU** budget and the **256 MB** memory limit. **The entire highest-value tier of this architecture runs in a single Edge Function invocation in well under a second, for £0.**

**How to discover a venue's Spektrix client name** (in priority order):
1. Grep page HTML for `client-name="([a-z0-9-]+)"` on `<spektrix-*>` web components. **Confirmed working** on artsdepot: `<spektrix-basket-summary client-name="artsdepot" custom-domain="tickets.artsdepot.co.uk">`.
2. Grep for `system.spektrix.com/([a-z0-9-]+)`. **Confirmed** on greenwichtheatre, blackheathhalls.
3. Presence of `webcomponents.spektrix.com/stable` confirms *that* it is a Spektrix site (found on all 9) but not *which* client — the name is often injected client-side on Next.js sites.
4. Fall back to guessing from the domain — this worked for `woolwichworks`, `unicorntheatre`, `thealbany`, `polka`, `discover`, `littleangeltheatre`. Probe and check for HTTP 200 + a JSON array.

### 1b. WordPress REST API

| Venue | Endpoint confirmed | Records | Data quality |
|---|---|---|---|
| greenwichtheatre.org.uk | `/wp-json/wp/v2/events` | **52** (`X-WP-Total`) | Good. ACF block exposed: `short_descr`, `dates` ("2 October-2 October" — **free text, no year, no time**), `attribute_AgeRecommendation` ("3+"), `attribute_Location`, `RunningTime`, `spektrix_id`. Prefer the Spektrix API for this venue; use WP for editorial copy. |
| mycenaehouse.co.uk | `/wp-json/wp/v2/mec-events` | **243** | Titles + URLs + categories only. `meta` is `null` — **MEC stores dates in postmeta and does not expose them via REST**. Must follow the link and parse the (present!) Event JSON-LD. |
| www.forumatgreenwich.org | `/wp-json/wp/v2/classes` | **20** | Titles + URLs. `acf` is `[]` — no structured schedule. Needs page-level extraction. Relevant: recurring children's classes. |
| www.greenwichpilates.co.uk | `/wp-json/wp/v2/mp-event` | **4** | Low volume. |
| mycenaehouse.co.uk | `/wp-json/tribe/events/v1/events` | **200 OK, `total: 0`** | The Events Calendar is installed but **empty** — the site migrated to MEC. **A 200 response with `total: 0` is not "no events".** Always enumerate `/wp-json/wp/v2/types` first. |

`/wp-json/wp/v2/types` returned 200 + JSON (i.e. WP REST is open) on: deptfordlounge.org.uk, greenwichtheatre.org.uk, mycenaehouse.co.uk, ornc.org, pandasfoundation.org.uk, quaggydevelopmenttrust.org, www.blackheathhalls.com, www.forumatgreenwich.org, www.greenwichheritage.org, www.greenwichpilates.co.uk, www.lewishamcfc.org.uk. Of these, only the four above had a populated event-like post type.

**Confirmed incremental-sync parameter** — this is the cheap change-detection lever for WordPress:

| Endpoint | `?per_page=1` total | `?modified_after=2026-08-01T00:00:00` total |
|---|---|---|
| greenwichtheatre.org.uk `/wp/v2/events` | 52 | **6** |
| mycenaehouse.co.uk `/wp/v2/mec-events` | 243 | **7** |

`orderby=modified&order=desc` also confirmed working on both.

### 1c. Squarespace

| Venue | Endpoint confirmed | Result |
|---|---|---|
| www.mudchute.org | `/news?format=json` and `?format=json-pretty` | **200, full JSON.** 20 items/page, `collection.itemCount: 132`. Pagination via `pagination.nextPageUrl` = `/news?offset=<epoch-ms>`. |
| www.mudchute.org | `/news/farmer-for-a-day?format=json` | **200** — per-item JSON works on any page URL. |
| www.mudchute.org | `/news?format=rss` | Advertised via `<link rel="alternate">`. |

**Caveat:** Mudchute's "News & Events" is a `blog-basic-grid` collection, **not** a Squarespace *Events* collection — so `startDate`/`endDate` are `null` on every item and the only date is `publishOn` (epoch ms, = publication not event date). A true Squarespace Events collection populates `startDate`/`endDate` as epoch ms; this venue does not use one. Dates must be extracted from `body` (3,059 chars of HTML present in the JSON).

**Squarespace is the only platform tested that supports HTTP conditional requests** — see §5.

### 1d. Everything else on the priority list

| Venue | Platform detected | Machine-readable result |
|---|---|---|
| www.horniman.ac.uk | WordPress (nginx) | `/wp-json/*` **disabled** (404 / 301-to-HTML). CMS origin `cms-live.thehorniman.net` is **HTTP 401**. **But** `/event-sitemap.xml` → **215 event URLs** (see §3). |
| www.rmg.co.uk | **Drupal 11** (`X-Generator` header) | `/jsonapi`, `/jsonapi/node/event` → **404**. JSON:API module not enabled. Sitemap works (402KB). No Event JSON-LD on event pages. |
| www.royalgreenwich.gov.uk | Drupal | `/jsonapi/node/event`, `/events/rss.xml`, `/events.xml`, `/api/events` → all **404**. HTML only. |
| deptfordlounge.org.uk | WordPress + Cloudflare | WP REST open but **no event post type**. `/event-sitemap.xml` → **284 URLs**. `/event-venue-sitemap.xml`, `/event-category-sitemap.xml` also present. Event pages have **no** Event JSON-LD and no `tribe-events` markup. |
| www.woodlandtrust.org.uk | **Umbraco** | `/sitemap.xml` 404. No API found. |
| www.conservatoire.org.uk | **Webflow** | No CMS JSON found. Only `Organization` JSON-LD. |
| www.greenwichwest.org.uk | **Wix** | RSS confirmed: `/blog-feed.xml`. |
| www.greenwichpeninsula.co.uk | Next.js + Cloudflare | No `__NEXT_DATA__`. Sitemap OK. |
| www.tate.org.uk | gunicorn (custom) | Sitemap OK, no event URLs matched. |
| www.londonmuseum.org.uk | Next.js + Cloudflare | Sitemap OK. **No JSON-LD at all** on event pages. |
| www.better.org.uk (GLL) | custom | No API. No `__NEXT_DATA__`/`__NUXT__`. Only `Organization`+`PostalAddress` JSON-LD. |
| www.unicorntheatre.com | Next.js + Spektrix | **RSS confirmed: `/feed.rss`.** Use Spektrix. |
| www.woolwich.works | Next.js + Spektrix | **RSS confirmed: `/feed.rss`.** Use Spektrix. |
| homestartgreenwich.org.uk | WordPress + EventON | `/wp-json/wp/v2/types` → **401** (REST locked down). RSS: `/feed/`. |
| www.creeksidecentre.org.uk | Apache, unknown | All probes return 200 **HTML** (catch-all page) — a classic false-positive trap for endpoint probing. |
| www.ikea.com | custom | Sitemap 404. |
| calicolibraries.com | nginx | **403 on every path**, including `/robots.txt` and `/sitemap.xml`. Hard block. |
| www.bachtobaby.com | nginx | **403 on every path.** Hard block. |

---

## 2. Schema.org `Event` JSON-LD prevalence — the negative result

### 2a. Why venues *should* have it

Google's Event structured data documentation (developers.google.com, accessed 2026-08-11) defines:

- **Required:** `name`, `startDate`, `location` (Place), `location.address` (PostalAddress).
- **Recommended:** `description`, `endDate`, `eventStatus`, `image`, `location.name`, `offers` (+ `.availability`, `.price`, `.priceCurrency`, `.validFrom`, `.url`), `organizer`, `performer`, `previousStartDate`.
- **Timezone rule (verbatim):** *"Specify the timezone by including the UTC or GMT time offset"* — e.g. `2025-07-21T19:00-05:00`. For date-only events, omit the time: `2025-07-21`.
- **Leaf-page rule (verbatim):** *"Each event MUST have a unique URL (a leaf page) and markup on that URL."* Listing pages are explicitly not the target.
- **Recurring events:** *"add a separate `Event` element for each performance"* — no `subEvent` shortcut for the rich result.
- Virtual-only events are not supported; `offers.url` must land on a page where a ticket can actually be bought.

This is a real incentive — Event rich results drive Google Search and Google Maps visibility. **It just has not translated into adoption on this venue set.**

### 2b. What is actually there — measured

**Listing pages (16 tested, incl. Southbank Centre, Barbican, London Museum, V&A, Polka, National Theatre, Dulwich Picture Gallery, artsdepot, Little Angel, Discover):** `@type: Event` found on **0 of 16**.

Because Google's own rule says markup belongs on leaf pages, the listing-page result proves little on its own — so individual event pages were tested separately.

**Individual event pages (20 tested across 10 venues):**

| Venue | Event pages tested | `Event` JSON-LD |
|---|---|---|
| **mycenaehouse.co.uk** (MEC plugin) | 1 | ✅ **YES** |
| www.horniman.ac.uk | 2 | ❌ no |
| greenwichtheatre.org.uk | 1 | ❌ no |
| www.thealbany.org.uk | 2 | ❌ no |
| www.unicorntheatre.com | 2 | ❌ no |
| www.woolwich.works | 2 | ❌ no |
| www.rmg.co.uk | 2 | ❌ no |
| www.londonmuseum.org.uk | 2 | ❌ no (no JSON-LD at all) |
| deptfordlounge.org.uk | 1 | ❌ no |
| www.greenwichheritage.org | 2 | ❌ no |

What these pages emit instead is **SEO-plugin boilerplate** — Yoast and AIOSEO `@graph` structures containing `WebPage`, `WebSite`, `BreadcrumbList`, `ListItem`, `Organization`, `ImageObject`, `SearchAction`, `ReadAction`, `EntryPoint`, `PropertyValueSpecification`. Useful for a title and a canonical URL; useless for a date.

**Conclusion: `Event` JSON-LD appears when — and essentially only when — an events plugin injects it.** It is a bonus path, not a foundation. Detect it opportunistically; never depend on it.

### 2c. Real-world pitfalls, evidenced

Here is the **actual** payload from the one venue that does emit it (mycenaehouse.co.uk, MEC plugin, verbatim):

```json
{
  "@context": "http://schema.org",
  "@type": "Event",
  "eventStatus": "https://schema.org/EventScheduled",
  "startDate": "2026-08-13",
  "endDate": "2026-08-13",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": { "@type": "Place", "name": "", "image": "", "address": "" },
  "organizer": { "@type": "Person", "name": "", "url": "" },
  "offers": {
    "url": "https://mycenaehouse.co.uk/events/what-makes-greenwich-greenwich/",
    "price": "", "priceCurrency": "GBP",
    "availability": "https://schema.org/InStock",
    "validFrom": "2026-08-13T00:00"
  },
  "performer": "",
  "description": "Join the council at Mycenae House on Thursday 13 August at 6pm for a Community Forum..."
}
```

Every classic pitfall in one record:

| Pitfall | Evidence here |
|---|---|
| **No time, no timezone** | `startDate: "2026-08-13"` is date-only. The actual start time — **6pm** — exists only as prose inside `description`. Google's offset rule is simply not followed. |
| **`name` missing entirely** | The required `name` property is **absent**. Fall back to `<title>`/`og:title`. |
| **Empty-string placeholders, not nulls** | `location.name`, `location.address`, `organizer.name`, `performer`, `offers.price` are all `""`. **Truthiness checks must treat `""` as missing**, or you will store blank venues. |
| **`location.address` is a string, not PostalAddress** | Schema allows both; parsers must handle either. |
| **`offers.url` points at the event page**, not a booking flow | Cannot be used to infer "bookable". |
| **`priceCurrency` present with empty `price`** | Do not infer "free" from a missing price. |

Other pitfalls to code defensively against (general, not all observed here):

- **`@graph` nesting** — Yoast/AIOSEO wrap everything in `{"@context":..., "@graph":[...]}`. A naive `json.@type === 'Event'` check fails. **You must walk the tree recursively.** (Observed on Horniman, Greenwich Theatre, Deptford Lounge, ORNC, Mycenae House.)
- **Arrays at the top level** — a `<script>` may contain `[{...},{...}]`.
- **Multiple `<script type="application/ld+json">` blocks per page** — observed 1–4 per page (Unicorn Theatre had 4; Mycenae House had 2, with `Event` in the *second*). Parse them all.
- **`@type` may be an array** — `["Event","TheaterEvent"]`.
- **Subtypes** — `TheaterEvent`, `ChildrensEvent`, `MusicEvent`, `ExhibitionEvent`, `SocialEvent` all count. Match on a regex like `\w*Event$`, not equality with `"Event"`.
- **`subEvent` recurrence** — a parent `Event` with nested `subEvent` performances; each needs expanding into its own row.
- **Invalid JSON** — trailing commas and unescaped newlines are common; wrap every parse in try/except and continue.

---

## 3. Sitemaps + RSS + iCal as the discovery layer

Where there is no API, **enumeration is still cheap**. This is the fallback tier and it works well.

### 3a. Sitemaps — confirmed

`/sitemap.xml` returned 200 + XML on **28 of 32** priority venues (failures: calicolibraries 403, bachtobaby 403, woodlandtrust 404, ikea 404; creeksidecentre 404).

**Dedicated event sitemaps confirmed:**

| Venue | Sitemap | Event URLs |
|---|---|---|
| www.horniman.ac.uk | `/event-sitemap.xml` | **215** |
| deptfordlounge.org.uk | `/event-sitemap.xml` | **284** |
| www.blackheathhalls.com | `/event-sitemap.xml` (+ `event_cat`, `event_location`) | via `/sitemap_index.xml` |
| www.horniman.ac.uk | also `/workshop-sitemap.xml`, `/series-sitemap.xml` | |

**Two real gotchas found:**

1. **Sitemap index vs. urlset.** Yoast/AIOSEO serve `/sitemap.xml` as a `<sitemapindex>` of child sitemaps; Squarespace/Wix/custom serve a flat `<urlset>`. Handle both.
2. **Leaked internal hostnames.** Horniman's `/event-sitemap.xml` is served correctly from `www.horniman.ac.uk` but every `<loc>` points at `https://cms-live.thehorniman.net/event/...`, which returns **HTTP 401**. **Rewriting the host to `www.horniman.ac.uk` makes the URLs resolve (verified 200).** A host-rewrite step is mandatory, not optional.

Also useful: `<lastmod>` in sitemaps is a free change-detection signal where present — cheaper than fetching the page.

**Where there is no event sitemap, the listing page itself enumerates cleanly.** Confirmed by regexing `href` values matching `/(event|whats-on|exhibition|activit)/` off a single fetch:

| Venue | Event URLs from one listing fetch | Booking platform detected |
|---|---|---|
| ornc.org `/whats-on/` | **20** | `ornc.digitickets.co.uk` (DigiTickets) |
| www.greenwichheritage.org `/events/` | **17** | — |

Both have current, forward-looking events (e.g. "Fabulous Fridays Summer Holiday Craft Sessions") — directly relevant to the under-5s audience. One listing fetch + N detail fetches is entirely affordable at this scale.

### 3b. RSS / Atom — confirmed

Discovered via `<link rel="alternate" type="application/rss+xml">`:

| Venue | Feed |
|---|---|
| www.unicorntheatre.com | `/feed.rss` |
| www.woolwich.works | `/feed.rss` |
| www.mudchute.org | `/news?format=rss` |
| www.greenwichwest.org.uk | `/blog-feed.xml` (Wix) |
| greenwichtheatre.org.uk, blackheathhalls.com, mycenaehouse.co.uk, ornc.org, pandasfoundation.org.uk, quaggydevelopmenttrust.org, lewishamcfc.org.uk, homestartgreenwich.org.uk | `/feed/` (WordPress default) |

**Caveat:** WordPress `/feed/` carries *posts*, not the events custom post type, unless explicitly extended. Per-post-type feeds are at `/{post_type}/feed/` or `/?post_type=events&feed=rss2` — worth probing but unverified here. RSS is best treated as a *change signal* ("something new was published"), not a source of event dates.

### 3c. iCal / .ics — the ideal format, largely absent

`.ics` links were searched for on every page fetched. **Zero found** across the priority venues. Specifically confirmed absent on Horniman event pages, Mycenae House MEC event pages, and Deptford Lounge event pages.

This is a shame, because `.ics` is by far the best-structured free option when present (`DTSTART` with `TZID`, `DTEND`, `SUMMARY`, `LOCATION`, `DESCRIPTION`, `URL`, `UID` — and `UID` is a *perfect* natural dedup key).

Where it **is** worth probing on a per-venue basis:

- **The Events Calendar** exposes `?ical=1` on any event or listing URL, and `/events/?ical=1` for the whole calendar. Not confirmed on this venue set (no live TEC install found with data).
- **Bookwhen** publishes a public iCal feed per calendar — the canonical pattern for small under-5s class providers. **Not confirmed:** `https://bookwhen.com/demo/ical` returned 404 and the help-centre article URL 404'd; web-search budget was exhausted before the correct pattern could be verified. **Flagged as [UNCONFIRMED] — worth 10 minutes of manual checking against a real Bookwhen calendar, as it would be high-value for exactly the class-provider long tail.**
- **Google Calendar** public feeds: `https://calendar.google.com/calendar/ical/{id}/public/basic.ics`.
- **Squarespace Events collections** expose per-event `.ics`; Mudchute's collection is a blog, so none were present.

### 3d. Tier-4 extraction is cheaper than expected — labelled fields, no LLM needed

The assumption that non-API venues require LLM extraction is **not borne out** on the largest one. Horniman event pages render a consistent labelled block. Raw extracted text from `/event/wheres-wally-spooky-museum-search/`:

```
Dates Sat 24 October – Sun 1 November 2020
Times 10:30am – 5:30pm
Tickets Free
Location Across the Museum
Perfect for Families
ACCESS Wheelchair accessible
```

Every field a listing needs — date range, times, price, location, **and an audience tag (`Perfect for`)** — is present behind a stable label. Confirmed regex-extractable:

| Field | Pattern | Extracted |
|---|---|---|
| Date range | `\d{1,2}\s*[–-]\s*\d{1,2}\s+(Jan\|Feb\|…)` | `24-26 December` |
| Full date | `\d{1,2}\s+(Jan\|Feb\|…)[a-z]*\s+\d{4}` | `1 November 2020` |
| Times | `\d{1,2}[:.]\d{2}\s*(am\|pm)?\s*[–-]\s*…` | `10:30am – 5:30pm` |
| Price | `(Free\|£\d+(\.\d{2})?)` | `Free` |

Titles come free from `og:title` (`"Where's Wally? Spooky Museum Search! - Horniman Museum and Gardens"` — strip the ` - <venue>` suffix), descriptions from `og:description`.

**Implication:** write a small per-venue label map for the handful of high-volume non-API venues (Horniman 215 URLs, Deptford Lounge 284) and Tier 4 costs **£0 in API spend**, only CPU. Reserve LLM/Zyte extraction for the genuinely unstructured long tail.

**Caveat:** the sitemap includes **archived** events — the page above is from **2020**. Filter by parsed date and drop anything in the past *before* storing, or the 215 Horniman URLs will flood the database with a decade of history.

---

## 4. CMS endpoint pattern cheat-sheet

Status key: ✅ confirmed working on a real UK venue in this study · ⚠️ present but empty/unusable · ❌ confirmed absent/disabled here · ◻️ not encountered, pattern from docs.

| Platform | Endpoint pattern | Status | Notes |
|---|---|---|---|
| **Spektrix** | `https://system.spektrix.com/{client}/api/v3/events` | ✅ **9 venues** | Unauthenticated. Filters `instanceStart_from` / `instanceStart_to` (`YYYY-MM-DD`). No pagination. |
| Spektrix | `.../api/v3/instances?startFrom=&startTo=` | ✅ | **camelCase**. Per-performance datetimes. |
| Spektrix | `.../api/v3/events/{id}/instances?start_from=&start_to=` | ◻️ | **snake_case on this endpoint** — inconsistent with the above. |
| Spektrix | `.../api/v3/help` | ◻️ | Per-client endpoint list. `https://system.spektrix.com/apitesting/api/v3/Help` for the full catalogue. |
| **WordPress core** | `/wp-json/wp/v2/types` | ✅ 11 venues | **Always call this first** to discover the real event post type. |
| WordPress core | `/wp-json/wp/v2/{rest_base}` | ✅ 4 venues | `?per_page=100` (max), `?page=N`, `?modified_after=ISO8601`, `?orderby=modified&order=desc`, `?_embed`. Totals in `X-WP-Total` / `X-WP-TotalPages` headers. |
| **The Events Calendar** | `/wp-json/tribe/events/v1/events` | ⚠️ | Reachable on mycenaehouse but `total: 0` (migrated away). Envelope: `{events:[], rest_url, total, total_pages, next_rest}`. Params: `start_date`, `end_date`, `page`, `per_page`, `categories`, `tags`, `search`. Event objects carry `start_date`, `utc_start_date`, `timezone`, `venue{}`, `cost`, `image{}` — genuinely the richest WP option **when populated**. |
| The Events Calendar | `/wp-json/tribe/events/v1/venues`, `/organizers` | ◻️ | |
| The Events Calendar | `{any-event-url}?ical=1` | ◻️ | |
| **Modern Events Calendar (MEC)** | `/wp-json/wp/v2/mec-events` | ✅ mycenaehouse (243) | **No dates in REST** (`meta: null`). But MEC **does** inject `Event` JSON-LD on the event page — follow the link. |
| **EventON** | detected on homestartgreenwich, pandasfoundation | ❌ | No public REST route found; `wp/v2/types` was 401 on homestartgreenwich. |
| **Events Manager** | `/wp-json/wp/v2/event`, `/events/?format=ical` | ◻️ | Not encountered with data. |
| **Squarespace** | `{any-url}?format=json` / `?format=json-pretty` | ✅ mudchute | Works on collection *and* item URLs. Paginate via `pagination.nextPageUrl` (`?offset=<epoch-ms>`). Events collections give `startDate`/`endDate` as **epoch ms**; blog collections give `null`. |
| Squarespace | `{collection}?format=rss` | ✅ mudchute | |
| **Wix** | `/blog-feed.xml` | ✅ greenwichwest | Wix Events data is behind an internal `_api/*` endpoint requiring instance tokens — not viable. |
| **Webflow** | — | ❌ conservatoire | CMS collections are not publicly queryable without an API token. |
| **Drupal JSON:API** | `/jsonapi`, `/jsonapi/node/event` | ❌ **rmg.co.uk (Drupal 11), royalgreenwich.gov.uk** | Module not enabled on either. Do not assume Drupal ⇒ JSON:API. |
| Drupal | `/rest/...`, Views REST exports | ◻️ | Site-specific; would need per-site discovery. |
| **Umbraco** | — | ❌ woodlandtrust | Delivery API (`/umbraco/delivery/api/v2/content`) requires opt-in; sitemap also 404. |
| **Next.js** | `/_next/data/{buildId}/{path}.json`, `__NEXT_DATA__` | ❌ | Checked on greenwichpeninsula (no `__NEXT_DATA__`), better.org.uk (none). App-router sites use RSC payloads, not JSON. |
| **Eventbrite** | embed detected on lewishamcfc | ◻️ | Public API v3 requires an OAuth token; the public search endpoint was retired. Embeds expose an event ID that can be resolved with a free personal token. |
| **Bookwhen / Class4Kids / TicketSource / Pebble** | — | ◻️ | **None detected** on the 32 priority venues. Likely relevant for the class-provider long tail rather than these venues. |
| **Shopify** | `/products.json`, `/collections/{c}/products.json` | ◻️ | False-positive `Shopify` fingerprint on an rmg.co.uk page (shop widget). Not an events source. |

---

## 5. Crawl infrastructure options and cost (2026)

*FX used throughout: USD 1 ≈ GBP 0.79 (approximate, not verified against a live rate on 2026-08-11).*
*Workload modelled: 300–2,000 pages/week → ~1,300–8,667 pages/month.*
*Budget: £20/week ≈ £86.7/month ≈ $110/month.*

### 5a. Supabase Edge Functions — confirmed limits

| Limit | Value |
|---|---|
| Wall-clock timeout — Free | **150 s** |
| Wall-clock timeout — Paid | **400 s** |
| **CPU time** | **2 s per request** ← *the real constraint* |
| Memory | **256 MB** |
| Bundle size | 20 MB (CLI) / 5 MB (server-bundled) |
| Functions per project | Free 100 · Pro 500 · Team 1,000 |
| Invocations — Free | **500,000 / billing period** |
| Invocations — Pro/Team | 2,000,000, then **$2 per 1M** |

At 2,000 pages/week batched ~20 URLs per invocation ≈ **433 invocations/month against a 500,000 free quota — 0.09% utilisation. Invocation cost is effectively £0.**

**The 2s CPU limit is the design constraint.** HTML parsing in JS burns CPU fast. Use targeted regex/streaming extraction rather than a full DOM parse, and keep most of the 150s wall-clock as I/O wait (network time is not CPU time).

*[UNCONFIRMED]:* max request/response body size and concurrent-invocation ceiling are not published on the limits page. A March 2026 change added a 5,000 req/min budget for function→function calls within a project; **calls to external APIs (i.e. your crawling) are explicitly exempt.**

### 5b. pg_cron + pg_net

**Supabase Cron / pg_cron:** granularity from every second to once a year; runs recorded in `cron.job_run_details`. Supabase guidance: **≤8 concurrent jobs**, **each job ≤10 minutes**.

**pg_net:** async HTTP from SQL (`net.http_get/post/delete`), returns a request ID immediately; requests fire on transaction commit.

**Verdict: use pg_cron to trigger an Edge Function; do NOT use pg_net to fetch the pages.** Reasons:

1. **Storage blowup.** Every response body is written to `net._http_response`. 2,000 pages × ~200 KB ≈ **400 MB** — against a **500 MB free-tier database**. This alone can kill the project.
2. `net._http_response` is **UNLOGGED** (data loss on unclean shutdown) and **auto-purged after 6 hours**.
3. **Default timeout 2,000 ms** — far too short for slow council/venue sites; produces phantom failures on exactly the pages you care about.
4. **Fire-and-forget**: no callback; you need a second polling job plus your own retry logic.
5. Designed for ~200 req/s max; JSON body only; PATCH/PUT unsupported.
6. *[UNCONFIRMED]* max response size.

### 5c. Cost per 1,000 pages — comparison

"Basic" = plain HTTP, no JS. "JS" = headless-browser render. "Effective" includes any monthly floor you pay regardless of usage, at 8,667 pages/month.

| Option | £/1k basic | £/1k JS | Monthly floor | **Effective £/1k @ 8,667/mo** |
|---|---|---|---|---|
| **Supabase Edge Fn `fetch()`** | ~£0 | n/a | £0 (Free) | **£0** |
| **Zyte API PAYG** (tier 1) | **£0.10** | **£0.80** | **$0** | **£0.10 / £0.80** |
| **Jina Reader** (paid, $50/1B tok) | £0.20 | £0.20 | $0 prepaid | **£0.20** |
| **Apify** (Website Content Crawler) | £0.16 | £0.40–£3.95 | $0 (free $5/mo) | **£0 at this volume** |
| **Cloudflare Workers** (fetch only) | ~£0 | n/a | $0 Free / $5 Paid | **£0 / £0.46** |
| **Cloudflare Browser Rendering** | n/a | £0.16 | $5 (Workers Paid) | **£0.53** |
| **Bright Data Web Unlocker** | £1.19 | £1.19 | $0 (5k free/mo) | **£0.50** |
| **GitHub Actions** (public repo) | £0 | £0 | £0 | **£0** ⚠️ ToS + reliability risk |
| **Hetzner CX23 + Playwright** | — | — | ~€6.10 all-in | **£0.60** |
| **Railway Hobby** (weekly job) | — | — | $5 (incl. $5 credit) | **£0.46** (actual use ~$0.12/mo) |
| **Fly.io** shared-cpu-1x 2GB | — | — | $11.11 always-on | **£1.01** (far less if auto-stopped) |
| **ScrapingBee Freelance** | £0.15 | £0.77 | **$49** | **£4.47** (floor dominates) |
| **ScraperAPI Hobby** | £0.39 | £3.87 | **$49** | **£4.47** (floor dominates) |
| **Firecrawl Standard** | £0.66 | £0.66 | **$83** | **£7.57** |
| **Firecrawl Hobby** | £2.53 | £2.53 | $16 | **cannot serve 8,667/mo** (5,000 credit cap) |

**Key per-provider detail:**

- **Zyte API** — PAYG, **no monthly minimum**, $5 free credit, only successful responses charged. Tier 1 (Simple) $0.13/1k HTTP, $1.01/1k browser-rendered; 5 difficulty tiers up to $1.27/$16.08.
- **Jina Reader** — free tier is **20 RPM without a key**, 500 RPM with a free key. **The free 10M-token tier is CC-BY-NC, non-commercial only** — budget for the paid key on a commercial site. Paid: **$0.050/1M tokens** ($50 → 1B tokens). *Note: several 2026 third-party review sites claim $0.02/1M — the official page says $0.050.* At ~5,000 output tokens/page **[assumption; Jina publishes no figure]**, $50 ≈ 200,000 pages ≈ 2 years at 2,000/week.
- **Cloudflare** — Workers Free: 100k req/day but only **10ms CPU** and **50 subrequests per invocation**. Paid $5/mo: 10M requests, 30M CPU-ms, **10 browser hours + 10 concurrent browsers included**, then $0.09/browser-hour. Browser Rendering Free tier is **10 minutes/day** and 1 request/10s — too slow to matter.
- **Apify** — 1 CU = 1 GB-RAM-hour at $0.20. Official actor page quotes **~$0.20/1,000 pages raw HTTP**, $0.50–$5.00 headless. Free plan's $5/mo credit covers this workload outright.
- **GitHub Actions** — free minutes are ample (public repos unlimited; private Free 2,000/mo). **But three real risks:** scheduled runs are *"delayed during periods of high load"* and *"some queued jobs may be dropped"*; public-repo schedules are **auto-disabled after 60 days of no repository activity**; and GitHub's terms prohibit GitHub-hosted-runner activity *"unrelated to the production, testing, deployment, or publication of the software project associated with the repository."* **Fine as a backup or for backfills; not as the thing a live site depends on.**
- **Hetzner** — **prices rose 15 June 2026**; CX23 (2 vCPU/4GB) €3.99 → **€5.49** ex-VAT ex-IPv4; some lines rose 140%+. CX23 was showing **"not available"** at time of check.
- **Oracle Always Free** — Oracle **halved** the Ampere allowance (4 OCPU/24GB → 2 OCPU/12GB) effective 15 June 2026 **with no announcement**, and began terminating over-limit instances. £0, but treat as unpriced risk.

### 5d. Recommended stack — £0–£2/week

1. **Schedule:** Supabase `pg_cron` → Edge Function. **£0.**
2. **Tier 1 — APIs (covers ~13 venues, ~630 event records):** 9 Spektrix calls + 4 WordPress REST calls, direct `fetch()` from the Edge Function. **£0.** Sub-second per call. This alone is ~10× the current Perplexity yield.
3. **Tier 2 — sitemap enumeration + static HTML fetch** for Horniman (215), Deptford Lounge (284), RMG, councils. Direct `fetch()`. **£0.** Batch ~20 URLs/invocation; watch the 2s CPU limit.
4. **Tier 3 — extraction fallback** for pages where dates only exist in prose. Either the existing LLM call over *pre-fetched* text (far cheaper than Perplexity search), or **Zyte PAYG** / **Jina Reader**. Even if *every* page needed browser rendering at 2,000/week, Zyte tier 1 = **$8.75/mo ≈ £1.60/week**.

**Total: £0.20–£6.20/week — 1–31% of budget**, leaving headroom for Supabase Pro and an LLM extraction step.

**Avoid:** Firecrawl Standard ($83/mo = 75% of budget for ~9% utilisation); ScrapingBee/ScraperAPI ($49/mo floors for 9–35% utilisation).

---

## 6. Anti-bot and legal

### 6a. Measured blocking on the priority venues

| Venue | Bot UA | Browser UA | Diagnosis |
|---|---|---|---|
| calicolibraries.com | **403** | — | Blocks every path incl. `/robots.txt`. Hard block. |
| www.bachtobaby.com | **403** | — | Blocks every path. Hard block. |
| www.southbankcentre.co.uk | **403** | **403** | Not UA-based — likely TLS/JS fingerprinting. |
| www.dulwichpicturegallery.org.uk | **403** | **403** | Same. |
| www.nationaltheatre.org.uk | **403** | **200** | **Pure UA sniffing** — a browser UA passes. |

**Cloudflare presence ≠ blocking.** `cf-ray` headers were observed on deptfordlounge, blackheathhalls, greenwichpeninsula, lewishamcfc, barbican, londonmuseum, polkatheatre, littleangeltheatre, ikea — **all returned 200 to a declared bot UA.** Cloudflare in front of a site is not by itself an obstacle at this request volume.

**Detecting a Cloudflare challenge — the definitive signal is a header, not a status code.** Per Cloudflare's own detection guidance, a challenge response *"regardless of the Challenge Page type"* carries **`cf-mitigated: challenge`**, and `challenge` is the only valid value. Check that first; everything else is heuristic:

```
1. cf-mitigated == "challenge"                  → challenged. Definitive.
2. status 403 or 429 AND cf-ray present         → Cloudflare blocked you.
3. body ~ "Just a moment..." / "challenges.cloudflare.com"  → interstitial [heuristic]
4. body ~ /error (10\d\d)/  → 1020 WAF rule · 1010 browser signature
                              1015 rate limited · 1006-1008 IP banned
5. status 402                                   → pay-per-crawl (misclassified as AI crawler)
```

Two corrections to common assumptions: **HTTP 401 is *not* a Cloudflare bot signal** (it is ordinary authentication); and Cloudflare's 1xxx codes appear **in the HTML body, not the status line**.

**Critically: once a site challenges you, a plain `fetch()` cannot pass — no header, UA, or retry strategy fixes it.** Cloudflare's supported-browsers documentation states that command-line tools *"such as `wget`, `curl`, or others that lack JavaScript execution capabilities required for Cloudflare Challenges"* are unsupported, and that *"Challenges are specifically designed to identify and block headless browser traffic."* The correct behaviour is **detect and stop** — mark the source blocked, do not retry, do not rotate, and surface it for a human to email the venue. Retrying or evading is precisely what converts a civil argument into the CMA s.1 territory described in §6d.

Always **log the `cf-ray`** — it is the ID a site owner needs to find you in their Security Events, which turns "your site blocks us" into a two-minute allowlist fix for them.

*Note on Cloudflare's 2025–26 AI-crawler changes* (default AI blocking from 1 Jul 2025; Content Signals Policy; Training/Agent crawlers blocked by default on ad-bearing pages for free-tier sites from **15 Sept 2026**): these act on **identified AI crawlers**, and a named event crawler is not on those lists — so they do not target you. But they are pushing the web toward default-deny for unrecognised automation, and free-tier Cloudflare is exactly where small UK venues sit. Two cheap consequences: **honour the Content Signals Policy** if a venue publishes one (it is an unambiguous expression of intent, which is what the reg. 16 and CMA s.1(1)(c) analyses turn on), and **handle HTTP 402** as a stop-and-flag rather than a mystery failure.

**Practical policy:** 28 of 32 venues are reachable with a polite declared bot UA. For the 4 that are not, prefer (a) their Spektrix/API path if one exists, (b) leaving them to the existing Perplexity call, or (c) manual curation — rather than escalating to fingerprint evasion, which changes the legal and ethical posture considerably.

### 6b. robots.txt observed

| Venue | Directive |
|---|---|
| www.horniman.ac.uk | `Crawl-delay: 5` |
| www.blackheathhalls.com | `Crawl-delay: 10` |
| greenwichtheatre.org.uk | `Sitemap:` ×2, no crawl-delay |
| www.rmg.co.uk, unicorntheatre, woolwich.works, thealbany | **404 — no robots.txt at all** |

**RFC 9309 (the standardised Robots Exclusion Protocol, accessed 2026-08-11) — the rules a compliant crawler must implement:**

| Rule | Requirement |
|---|---|
| Allow/Disallow matching | **Case-sensitive**; the **most specific match wins** (rule with the most octets). No match ⇒ allowed. `/robots.txt` itself is implicitly allowed. |
| User-Agent token matching | **Case-insensitive**. If multiple groups match, their rules **MUST be combined into one group**. Falls back to `*`. Tokens: letters, `_`, `-` only. |
| Caching | **SHOULD NOT** reuse a cached robots.txt for **more than 24 hours** (unless unreachable). |
| Parse limit | **MUST parse at least 500 KiB**. |
| HTTP 2xx | Follow the parsed rules. |
| HTTP 4xx | Crawler **MAY access any resource** on the server. |
| **HTTP 5xx** | **Assume complete disallow.** |
| Redirects | Follow **at least five** consecutive redirects; beyond that, treat as unavailable. |

Two of these have teeth here: the **404 ⇒ fully allowed** rule means the seven venues serving no robots.txt (RMG, Unicorn, Woolwich Works, The Albany, etc.) are unrestricted; and the **5xx ⇒ complete disallow** rule means a transient venue outage must *pause* crawling that host rather than being treated as "no rules".

**`Crawl-delay` is explicitly NOT part of RFC 9309** and is ignored by Google — but honouring it is the cheapest available evidence of good faith, and directly relevant to the reg. 16(2) "repeated and systematic" analysis above. **Blackheath Halls' 10s delay × 284-ish pages would be ~47 minutes** — which is precisely why the Spektrix API path (one request, 0.46s) matters: it is both cheaper *and* markedly more polite.

### 6c. Etiquette and UA convention

- Declare identity: `GPCEventBot/1.0 (+https://<site>/about-our-bot; contact@<site>)` — a UA with a contact URL is the single most effective de-escalation.
- Honour `Crawl-delay`; default to 1 request per 2–5 s per host where unspecified.
- Honour `429` + `Retry-After`; exponential backoff on 5xx.
- Send `Accept-Encoding: gzip`; send conditional headers where validators exist (see §7).
- Crawl weekly, off-peak (UK small hours), and prefer the API over the HTML every time — one Spektrix call replaces hundreds of page fetches.

### 6d. UK legal position

Public event listings are low-risk to crawl, but the risk is **not zero** and it is concentrated in two places:

- **Database Right** — Copyright and Rights in Databases Regulations 1997, **reg. 16** (legislation.gov.uk, accessed 2026-08-11), verbatim:

  > "a person infringes database right in a database if, without the consent of the owner of the right, he **extracts or re-utilises all or a substantial part of the contents** of the database."

  and, critically for a *weekly recurring* crawler:

  > "the **repeated and systematic extraction or re-utilisation of insubstantial parts** of the contents of a database **may amount to** the extraction or re-utilisation of a substantial part of those contents."

  This is the single most relevant UK exposure for an event aggregator, and it operates **independently of copyright**. A weekly crawl that accumulates a venue's whole forward listing over time is squarely the pattern reg. 16(2) contemplates. Two mitigations matter most: **(a)** take only the factual fields you need and write your own summaries rather than mirroring the listing wholesale, and **(b)** link back to the venue's own page as the canonical booking URL so you are driving traffic to the database owner rather than substituting for them.

  **The "created vs obtained" distinction is the decisive point, and it favours you.** Reg. 13(1) protects "substantial investment in **obtaining, verifying or presenting** the contents". In **BHB v William Hill (C-203/02, 9 Nov 2004)** the CJEU held that investment in **creating** the data does *not* count toward that test — only investment in collecting, checking and presenting **pre-existing** data does. Applied here:

  | Target | Analysis |
  |---|---|
  | **A venue's own what's-on page** (Horniman, Greenwich Theatre, Mycenae House…) | The venue *creates* its event data — it decides to run a toddler group at 10am. That is creation, not obtaining. Database right is **weak to non-existent**. **This covers the large majority of your targets.** |
  | **An aggregator or ticketing platform** (a council listings site, Spektrix, a "things to do with kids" site) | *Obtains* and *verifies* third-party data — textbook protected investment. Database right very likely subsists. **These are the genuinely risky sources.** |

  Note the sharp edge for this project: **the Spektrix API sits on the wrong side of that line.** It is a ticketing platform aggregating many venues' data, so it is far more likely to attract database right than the venue websites themselves — even though it is technically the easiest source to consume. Its terms of use should be read before large-scale ingestion, and the per-venue linking/attribution discipline below matters most there.

  Two further points from **Football Dataco v Stan James & Sportradar [2013] EWCA Civ 27** (CA, 6 Feb 2013), which is the UK authority to rely on rather than any of the commonly-miscited alternatives:

  - **Small extracts were held to be a "substantial part"** — the Court reversed the trial judge on this. Per Sir Robin Jacob at [87]: *"What matters is the investment which in fact went into collecting the data."* "We only take a few fields" is not a defence.
  - **The publishing site was liable as a joint tortfeasor** with its UK users, at [97]: *"The provider of such a website is causing each and every UK user who accesses his site to infringe."* Knowledge was not required. **"We only aggregate, we didn't scrape it" is not a shield** — liability can attach to the site that displays the data.

  Also relevant: **Ryanair v PR Aviation (C-30/14, 15 Jan 2015)** held that the Database Directive does not apply *at all* to a database protected by neither copyright nor sui generis right — with the counter-intuitive consequence that the owner of an *unprotected* database may restrict scraping **purely by contract**. So for the many venue pages where database right is weak, **the terms of use become the operative constraint**, not the IP position.
- **Copyright** subsists in descriptive prose and photographs, **not** in the facts (date, time, venue, price). **Store the facts; write your own summaries; do not republish full descriptions verbatim; do not hotlink or copy images without permission.**
- **Computer Misuse Act 1990** is generally not engaged by fetching public pages, but bypassing an access control (auth, or a deliberate block) moves toward "unauthorised access". **This is the concrete reason not to defeat the 403s on calicolibraries/bachtobaby/Southbank/Dulwich.**
- **UK GDPR** is usually minimal for venue events, but can be engaged where a named individual organiser/contact appears.

**Risk-reduction that costs nothing:** attribute every event to its venue, link back to the source page as the canonical booking URL, store facts + short original summaries rather than copied prose, publish a bot page explaining what you do, and honour takedown requests immediately.

---

## 7. Deduplication and change detection (Postgres/Supabase)

### 7a. Measured change-detection support — this drives the design

| Endpoint | `ETag` | `Last-Modified` | Conditional request result |
|---|---|---|---|
| **www.mudchute.org `/news?format=json`** | `W/"332e6cde...--gzip"` | — | **`If-None-Match` → 304** ✅ |
| system.spektrix.com `/api/v3/events` | none | none | `Cache-Control: no-cache` |
| greenwichtheatre.org.uk `/wp/v2/events` | none | none | — |
| mycenaehouse.co.uk `/wp/v2/mec-events` | none | none | — |
| deptfordlounge.org.uk `/event-sitemap.xml` | none | none | — |

**Conclusion: HTTP validators are the exception, not the rule.** Only Squarespace supported them.

**And WordPress core explains exactly why.** Reading `WP::send_headers()`, core sets `Last-Modified` and `ETag` **only on feed requests** — an ordinary HTML or REST "what's on" response gets no validators at all, which matches the measurements above. Worse, even the feed ETag is **site-global, not page-specific**:

```php
$wp_last_modified_post    = mysql2date($date_format, get_lastpostmodified('GMT'), false);
$wp_last_modified_comment = mysql2date($date_format, get_lastcommentmodified('GMT'), false);
$wp_etag = '"' . md5( $wp_last_modified ) . '"';
```

It is an `md5()` of the most recent post-or-comment modification **anywhere on the site** — so a single new blog comment invalidates the validator for the events feed. On WordPress, a validator change means *"something on this site changed"*, not *"this page changed"*. Treat it as a coarse hint only.

Two implementation details worth getting right: RFC 9110 §13.1.4 requires a server to **ignore `If-Modified-Since` when `If-None-Match` is present**, so sending both is safe and correct; and some servers **omit `ETag` on the 304** — if you blindly overwrite your stored validator with the absent value you lose it, and every subsequent request goes out unconditional. Only update the stored validator when the response actually carries one. Store `Last-Modified` as the **exact received string** and echo it back byte-for-byte rather than round-tripping it through a date parser. Send `If-None-Match`/`If-Modified-Since` opportunistically (store whatever validator you receive; it is free when it works), but **the primary change-detection mechanisms must be:**

1. **`?modified_after=` on WordPress REST** — *confirmed working*, and dramatic: Greenwich Theatre 52 → **6** changed records; Mycenae House 243 → **7**. This is the single most effective incremental-sync lever available.
2. **`instanceStart_from` on Spektrix** — bounds the window rather than detecting change, but cuts Blackheath Halls from 463 → 47.
3. **`<lastmod>` in sitemaps** — free per-URL change signal where present.
4. **Content hashing** for everything else.

**Hash the extracted content, not the raw HTML.** Raw pages carry nonces, CSRF tokens, "generated on <timestamp>" comments (AIOSEO literally emits `<!-- This sitemap was dynamically generated on August 11, 2026 at 11:05 pm -->`), rotating ad slots and session IDs — all of which produce false "changed" verdicts on every fetch. Normalise to the fields you care about, then hash.

### 7b. Recommended composite dedup strategy

A three-tier cascade — cheap exact match first, fuzzy candidate generation second, expensive semantic tiebreak only where needed.

**Tier 1 — natural-key hash (catches ~90%+, costs nothing).**

Normalise then hash `title + start_datetime + venue`:

> ⚠️ **Three traps that will reject or silently break this DDL** — all confirmed against PostgreSQL source/docs:
>
> 1. **`unaccent()` is `STABLE`, not `IMMUTABLE`.** Confirmed in `contrib/unaccent/unaccent--1.1.sql` (it reads a runtime-redefinable dictionary). It **cannot** be used in a `STORED` generated column or index expression — you get `ERROR: generation expression is not immutable`. Wrapping it in a fake-IMMUTABLE function lies to the planner and silently corrupts the index if the dictionary is ever altered. **Use `translate()` instead, which is immutable.**
> 2. **`timestamptz::date` is `STABLE`** (it depends on the `TimeZone` GUC) and is likewise rejected. Store a plain `starts_on date` + `starts_time time` populated by the application. (`AT TIME ZONE` with a *literal* zone is immutable, so `to_char(starts_at at time zone 'Europe/London', ...)` is legal — but the explicit columns are clearer and index better.)
> 3. **`STORED` is mandatory on PG 15/17** (Supabase). On **PG 18** generated columns default to **VIRTUAL** — so always write `STORED` explicitly, or a migration replayed on 18 silently produces a column you cannot index as intended.

```sql
-- immutable throughout: lower/regexp_replace/translate/btrim/encode/sha256/convert_to
alter table events
  add column title_norm text generated always as (
    btrim(regexp_replace(
      regexp_replace(
        regexp_replace(
          translate(lower(coalesce(title,'')),
                    'áàâäãåéèêëíìîïóòôöõúùûüçñ''’',
                    'aaaaaaeeeeiiiiooooouuuucn  '),
          '&', ' and ', 'g'),
        '^\s*the\s+', '', ''),
      '[^a-z0-9]+', ' ', 'g'))
  ) stored;

alter table events
  add column dedup_key text generated always as (
    encode(sha256(convert_to(
      coalesce(venue_id::text,'') || '|' ||
      coalesce(starts_on::text,'') || '|' ||   -- plain date column, NOT a timestamptz cast
      coalesce(starts_time::text,'') || '|' ||
      btrim(regexp_replace(lower(coalesce(title,'')), '[^a-z0-9]+', ' ', 'g')),
    'UTF8')), 'hex')
  ) stored;

create unique index events_dedup_key_uidx on events (dedup_key);
```

Including `starts_time` in the key is what keeps the 9:30 and 11:00 toddler sessions distinct — collapsing them is a worse failure than a duplicate, because a parent turns up at the wrong time.

Then ingest idempotently:

> ⚠️ **The `ON CONFLICT DO UPDATE` cardinality violation is the bug you will actually hit.** Postgres will not let one statement affect the same existing row twice: *"a cardinality violation error will be raised when this situation arises."* A venue page that lists the same weekly session twice, batched into one multi-row insert, **aborts the entire batch** with `ON CONFLICT DO UPDATE command cannot affect row a second time`. **Dedupe the batch before it reaches Postgres** — the `DISTINCT ON` below is not optional.

```sql
insert into events (venue_id, title, starts_on, starts_time, source_url, content_hash, last_seen_at)
select distinct on (venue_id, starts_on, starts_time, title)
       venue_id, title, starts_on, starts_time, source_url, content_hash, now()
from   staged_events
order  by venue_id, starts_on, starts_time, title, scraped_at desc
on conflict (dedup_key) do update
  set description  = excluded.description,
      price        = excluded.price,
      source_url   = excluded.source_url,
      last_seen_at = now()
  where events.content_hash is distinct from excluded.content_hash;
```

Note the action `WHERE` suppresses no-op writes (avoiding dead tuples and `updated_at` churn) — but it also means `last_seen_at` only advances when something changed. If you want a true "still listed" heartbeat, update it in a separate cheap statement.

Via the Supabase JS client, `onConflict` columns **must** have a unique constraint, and **upserted rows are not returned unless you chain `.select()`**:

```js
await supabase.from('events')
  .upsert(rows, { onConflict: 'dedup_key', ignoreDuplicates: false })
  .select()
```

**Normalisation pitfalls that matter for this data** (all observed in the live payloads above):

- **Leading/trailing whitespace in titles** — Spektrix returned `" Confessions of Sweeney Todd"` and `" Don't Go Into The Cellar!  Presents"` with leading spaces and doubled internal spaces. Always `btrim` + collapse whitespace.
- **HTML entities** — WordPress returns `title.rendered` as `"Radio Lollipop&#8217;s Talent Showcase"`. Decode entities *before* normalising, or `&#8217;` vs `'` will split one event into two.
- **Curly vs straight apostrophes**, en-dash vs hyphen.
- **`&` vs `and`** — normalise one way.
- **Trailing venue names in titles** — "Baby Sensory at Mycenae House" vs "Baby Sensory".
- **Date-only vs timed** — the MEC JSON-LD gives `2026-08-13` with the real 6pm time only in prose. Decide a policy: either bucket to the date when no time is known, or keep a `time_confidence` flag. Mixing them silently creates duplicates.
- **One event, many performances** — a Spektrix "event" spans `firstInstanceDateTime`→`lastInstanceDateTime`. Expand via `/instances` and dedup at the *instance* level, or you will collapse a 20-performance run into one row.
- **Timezone** — Spektrix helpfully gives both local and `...Utc`. Store UTC + an explicit timezone; do not store naive local times. BST/GMT transitions will otherwise produce off-by-one-hour duplicates twice a year.

**Tier 2 — trigram fuzzy candidate generation (`pg_trgm`, available on Supabase).**

> Checked against this repo: migrations `001`–`007` enable **no** extensions. `pg_trgm`, `unaccent`, `fuzzystrmatch` and `vector` would each need an explicit `create extension` in a new migration.

> ⚠️ **Use GiST, not GIN.** The Postgres docs are explicit that KNN queries (`ORDER BY col <-> 'query' LIMIT n`) "can be implemented quite efficiently by GiST indexes, **but not by GIN indexes**". Your query shape is exactly "give me the 5 most similar existing events" — the KNN case GIN cannot accelerate. GIN is the right choice for `LIKE`/`ILIKE` filtering, not for nearest-neighbour ranking.

```sql
create extension if not exists pg_trgm;
create index events_title_trgm_idx on events using gist (title_norm gist_trgm_ops);

-- candidates: same venue, same/adjacent day, ranked by trigram distance (KNN)
select e.id, e.title, similarity(e.title_norm, $1) as sim
from   events e
where  e.venue_id = $2
  and  e.starts_on between $3::date - 1 and $3::date + 1
order  by e.title_norm <-> $1      -- GiST KNN
limit  5;
```

**Thresholds — write them explicitly, never rely on the GUC defaults** (`similarity_threshold` 0.3, `word_similarity_threshold` 0.6, `strict_word_similarity_threshold` 0.5). 0.3 is far too permissive for event titles and will pair "Baby Sensory" with "Baby Yoga". Suggested bands: **≥0.75 auto-merge · 0.45–0.75 escalate to tiebreak · <0.45 treat as new**. Putting the number in the query keeps it visible at code review instead of hidden in server config.

Always **constrain by venue and date first**, so the scan runs over a handful of same-day rows rather than the whole table. For containment cases ("Storytime" inside "Saturday Storytime for Under 5s") use **`strict_word_similarity()`**, not plain `word_similarity()` — the latter allows extents to end mid-word and over-matches on prefixes (the documented example scores `word_similarity('word','two words')` at 0.8 vs strict's 0.571).

**On `fuzzystrmatch`: use `levenshtein_less_equal()` only, and skip the phonetic family entirely.** The Postgres docs state plainly that "`soundex`, `metaphone`, `dmetaphone`, and `dmetaphone_alt` … do not work well with multibyte encodings (such as UTF-8)" — and Supabase is UTF-8 with "Café", "Crèche" and curly apostrophes in real listings. `levenshtein_less_equal(a, b, 3)` short-circuits once the distance exceeds the bound, which is the only question worth asking ("within 3 edits?"). Note the **255-character input cap** on `levenshtein` — fine for titles, never point it at page bodies.

**Tier 3 — semantic (`pgvector`) — probably unnecessary; hold in reserve.**

`pgvector` **0.8.0** is confirmed available on Supabase (PG 15/17), with both HNSW and IVFFlat. Supabase's own guidance is *"we recommend using HNSW because of its performance and robustness against changing data"* — and for a continuously-crawled table that starts empty, HNSW is the only practical choice, since it can be created before any data exists whereas IVFFlat must be built *after* the table is populated and rebuilt as the distribution shifts.

**But do not build this, and do not argue cost as the reason.** Cost is not the objection and a reviewer will catch it: at `text-embedding-3-small` ($0.02/1M tokens), 50,000 titles × ~15 tokens ≈ **1.5p**, and weekly re-embedding for a year is under **$1**. The honest arguments are:

1. **It is the wrong notion of similarity.** "Toddler Yoga" and "Baby Yoga" are semantically close, and an embedding model will say so — but they are **different events**, and you would merge them. You want near-*lexical* identity, not semantic relatedness. Trigram distance separates them correctly; embeddings actively work against you here.
2. **Storage, not tokens.** 1,536 dims × 4 B × 50,000 rows ≈ **307 MB** for the column alone, before the HNSW index — material against a 500 MB free-tier database.
3. **A network dependency in the write path** — a new failure mode, a secret to rotate, latency on a job that today touches only Postgres.
4. **15 tokens carry little signal.** Embedding quality is benchmarked on passages, not three-word noun phrases.

**Recommendation: no embeddings for dedup.** Use `levenshtein_less_equal(a, b, 3)` as the free in-database tiebreak, and an LLM adjudication only for the rare ambiguous band — logged for review. Revisit vectors only for a user-facing "find me something similar" feature, which *is* genuinely semantic, and where 1.5p is trivially affordable.

*(Note: Anthropic does not offer a first-party embedding model — its docs point to Voyage AI. Budget for OpenAI or Voyage if this is ever built.)*

**Page-level change detection:**

```sql
create table crawl_state (
  url text primary key,
  etag text,
  last_modified text,
  content_hash text,      -- sha256 of EXTRACTED fields, not raw HTML
  last_fetched_at timestamptz,
  last_changed_at timestamptz,
  consecutive_failures int default 0
);
```

Send stored validators on the next fetch; on 304, skip parsing entirely. Where no validator exists, compare `content_hash` after extraction and skip the write (and any LLM enrichment) when unchanged. Back off hosts with rising `consecutive_failures`.

> **Note on §6d/§7 sourcing:** §6d is primary-cited (legislation.gov.uk regs. 12/13/16; RFC 9309) and incorporates a parallel legal research leg that returned late in the session with case law verified against nationalarchives/EUR-Lex. §7 combines that leg's PostgreSQL-source findings with this leg's own empirical measurements (validator support, `modified_after` behaviour, live payload normalisation traps).
>
> ⚠️ **One correction worth recording:** *Trailfinders v Travel Counsellors* [2020] EWHC 591 (IPEC) is **not** a database-right or scraping case — database right and copyright were neither pleaded nor decided; it concerns ex-employees using customer lists (breach of contract and equitable confidence). It is commonly miscited in scraping write-ups. **Football Dataco v Stan James [2013] EWCA Civ 27** is the UK authority that actually applies. Likewise, no reported **Ordnance Survey *database right*** decision could be verified — the known OS matter is the 2001 *OS v Automobile Association* **copyright** dispute, which settled. Do not cite either as database-right authority.

---

## 8. Recommendation

**Do not build a general-purpose crawler. Build a source-type router.**

| Tier | Mechanism | Venues | Yield | Cost |
|---|---|---|---|---|
| 1 | Spektrix public API | 9 | **310 events / 16 wks** | £0 |
| 2 | WordPress REST (`wp/v2/{type}` + `modified_after`) | 4 | 319 records | £0 |
| 3 | Squarespace `?format=json` | 1 | 132 items | £0 |
| 4 | Sitemap enumeration + static fetch + extraction | ~14 | 500+ URLs | £0 fetch, LLM/Zyte on text only |
| 5 | Leave to Perplexity / manual | 4 (hard 403s) | — | existing |

Tier 1 alone, at nine unauthenticated HTTP GETs costing nothing and taking about two seconds, returns roughly **ten times** the events the current single Perplexity call produces. **That is the finding that should drive the architecture.** JSON-LD, by contrast, is present on one venue out of thirty-two and should be treated strictly as an opportunistic bonus.

---

## 9. Bibliography

All URLs accessed **2026-08-11**.

**Legal & protocol standards**
- Copyright and Rights in Databases Regulations 1997 — Part III: https://www.legislation.gov.uk/uksi/1997/3032/part/III · reg. 12 (definitions): .../regulation/12 · reg. 13 (subsistence): .../regulation/13 · **reg. 16 (infringement)**: https://www.legislation.gov.uk/uksi/1997/3032/regulation/16/made
- CDPA 1988 — s.3A (databases): https://www.legislation.gov.uk/ukpga/1988/48/section/3A · s.30 (fair dealing): .../section/30 · s.29A (TDM): .../section/29A
- Computer Misuse Act 1990 — s.1: https://www.legislation.gov.uk/ukpga/1990/18/section/1 · s.17 (definitions): .../section/17
- Sui generis database rights after the transition period (post-Brexit qualification): https://www.gov.uk/guidance/sui-generis-database-rights-after-the-transition-period
- Report on Copyright and AI (18 Mar 2026; no broad TDM exception): https://www.gov.uk/government/publications/report-and-impact-assessment-on-copyright-and-artificial-intelligence/report-on-copyright-and-artificial-intelligence
- RFC 9309 — Robots Exclusion Protocol: https://www.rfc-editor.org/rfc/rfc9309.html
- RFC 9110 — HTTP Semantics (§8.8 validators, §13.1.3–4 precedence, §15.4.5 304): https://www.rfc-editor.org/rfc/rfc9110.html
- RFC 6585 — 429 Too Many Requests: https://www.rfc-editor.org/rfc/rfc6585.html
- IETF draft-illyes-aipref-cbcp-00 — Crawler best practices (7 Jul 2025, expired): https://www.ietf.org/archive/id/draft-illyes-aipref-cbcp-00.html
- Google robots.txt spec (crawl-delay unsupported): https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt

**Case law**
- Football Dataco v Stan James & Sportradar [2013] EWCA Civ 27: https://caselaw.nationalarchives.gov.uk/ewca/civ/2013/27
- BHB v William Hill, C-203/02: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A62002CJ0203
- Trailfinders v Travel Counsellors [2020] EWHC 591 (IPEC) — *not* a database-right case: https://caselaw.nationalarchives.gov.uk/ewhc/ipec/2020/591
- Ryanair v PR Aviation, C-30/14 (commentary): https://www.medialaws.eu/ecj-clarifies-database-directive-scope-in-screen-scraping-case/
- Racing Partnership v SIS [2020] EWCA Civ 1300: https://uk.practicallaw.thomsonreuters.com/D-105-1766

**Cloudflare bot management**
- Detect a challenge response (`cf-mitigated`): https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/detect-response
- Bot score concepts: https://developers.cloudflare.com/bots/concepts/bot-score/
- Verified bots policy: https://developers.cloudflare.com/bots/concepts/bot/verified-bots/policy/
- Supported browsers (curl/wget cannot pass challenges): https://developers.cloudflare.com/cloudflare-challenges/reference/supported-browsers/
- Cloudflare 1xxx error codes: https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/
- AI Crawl Control: https://developers.cloudflare.com/ai-crawl-control/

**PostgreSQL / Supabase (dedup)**
- pg_trgm (GiST vs GIN, KNN, thresholds): https://www.postgresql.org/docs/current/pgtrgm.html
- fuzzystrmatch (UTF-8 caveat, 255-char cap): https://www.postgresql.org/docs/current/fuzzystrmatch.html
- Generated columns — PG 17 (STORED required): https://www.postgresql.org/docs/17/ddl-generated-columns.html · PG 18 (VIRTUAL default): https://www.postgresql.org/docs/current/ddl-generated-columns.html
- INSERT … ON CONFLICT (cardinality violation): https://www.postgresql.org/docs/current/sql-insert.html
- Binary string / hashing functions: https://www.postgresql.org/docs/current/functions-binarystring.html
- `unaccent` is STABLE (source proof): https://raw.githubusercontent.com/postgres/postgres/master/contrib/unaccent/unaccent--1.1.sql
- Supabase extensions: https://supabase.com/docs/guides/database/extensions · pgvector: .../pgvector · vector indexes ("we recommend HNSW"): https://supabase.com/docs/guides/ai/vector-indexes
- Supabase JS upsert: https://supabase.com/docs/reference/javascript/upsert
- WordPress `WP::send_headers()` (validators on feeds only): https://developer.wordpress.org/reference/classes/wp/send_headers/
- OpenAI embedding pricing: https://developers.openai.com/api/docs/pricing

**Standards & structured data**
- Google Search Central — Event structured data: https://developers.google.com/search/docs/appearance/structured-data/event
- Google Search Central — Intro to structured data: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- Google Search Central — General structured data guidelines: https://developers.google.com/search/docs/appearance/structured-data/sd-policies

**Spektrix**
- Overview / API v3: https://integrate.spektrix.com/docs/API3
- Filtering Events and Instances: https://integrate.spektrix.com/docs/apieventfiltering
- API Authentication: https://integrate.spektrix.com/docs/authentication
- Third Parties: https://integrate.spektrix.com/docs/thirdparties
- Support — What is the API: https://support.spektrix.com/hc/en-us/articles/16578053006749-What-is-the-API
- Full endpoint catalogue: https://system.spektrix.com/apitesting/api/v3/Help

**Supabase**
- Edge Function limits: https://supabase.com/docs/guides/functions/limits
- Pricing: https://supabase.com/pricing
- Edge Function invocations billing: https://supabase.com/docs/guides/platform/manage-your-usage/edge-function-invocations
- Edge Function rate limits changelog (Mar 2026): https://supabase.com/changelog/43644-edge-functions-rate-limits-on-recursive-nested-edge-functions-calls
- pg_net: https://supabase.com/docs/guides/database/extensions/pg_net
- pg_cron: https://supabase.com/docs/guides/database/extensions/pg_cron
- Cron guide: https://supabase.com/docs/guides/cron

**Crawl services**
- Firecrawl pricing: https://www.firecrawl.dev/pricing
- Jina AI Reader (rate limits + pricing): https://jina.ai/reader/
- ScrapingBee pricing: https://www.scrapingbee.com/pricing/
- ScrapingBee credit system: https://help.scrapingbee.com/en/article/credit-system-explained-1h2ackp/
- ScraperAPI pricing: https://www.scraperapi.com/pricing/
- ScraperAPI credit costs: https://docs.scraperapi.com/getting-started/quick-start/credits-and-requests-costs
- Zyte pricing: https://www.zyte.com/pricing/
- Zyte API pricing docs: https://docs.zyte.com/zyte-api/pricing.html
- Bright Data Web Unlocker: https://brightdata.com/pricing/web-unlocker
- Apify pricing: https://apify.com/pricing
- Apify usage & resources: https://docs.apify.com/platform/actors/running/usage-and-resources
- Apify Website Content Crawler (per-1k costs): https://apify.com/apify/website-content-crawler

**Cloudflare**
- Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Browser Rendering limits: https://developers.cloudflare.com/browser-rendering/platform/limits/
- Browser Rendering pricing: https://developers.cloudflare.com/browser-rendering/platform/pricing/

**GitHub Actions**
- Billing for GitHub Actions: https://docs.github.com/en/billing/managing-billing-for-your-products/about-billing-for-github-actions
- Events that trigger workflows (schedule caveats): https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- Disable/enable workflows: https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows
- Terms for Additional Products and Features: https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features

**Self-hosted / VPS**
- Hetzner price adjustment (15 Jun 2026): https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/
- Hetzner cost-optimized plans: https://www.hetzner.com/cloud/cost-optimized/
- Fly.io pricing: https://fly.io/docs/about/pricing/
- Railway pricing: https://railway.com/pricing
- Oracle Cloud Always Free reduction (InfoQ, Jul 2026): https://www.infoq.com/news/2026/07/oracle-cloud-free-tier-limits/

**Live endpoints tested (selected)**
- https://system.spektrix.com/greenwichtheatre/api/v3/events
- https://system.spektrix.com/greenwichtheatre/api/v3/instances?startFrom=2026-08-11&startTo=2026-09-30
- https://system.spektrix.com/{blackheathhalls,woolwichworks,unicorntheatre,thealbany,polka,littleangeltheatre,artsdepot,discover}/api/v3/events
- https://greenwichtheatre.org.uk/wp-json/wp/v2/events
- https://mycenaehouse.co.uk/wp-json/wp/v2/mec-events
- https://www.forumatgreenwich.org/wp-json/wp/v2/classes
- https://www.greenwichpilates.co.uk/wp-json/wp/v2/mp-event
- https://www.mudchute.org/news?format=json
- https://www.horniman.ac.uk/event-sitemap.xml
- https://deptfordlounge.org.uk/event-sitemap.xml
- https://mycenaehouse.co.uk/events/what-makes-greenwich-greenwich/ (Event JSON-LD sample)

**Unresolved / [UNCONFIRMED]**
- Bookwhen public iCal URL pattern — `https://bookwhen.com/demo/ical` 404'd; help-centre article 404'd; web-search budget exhausted. Worth manual verification.
- Supabase Edge Functions max request/response body size; concurrent-invocation ceiling.
- pg_net max response body size.
- Firecrawl month-to-month (non-annual) prices — derived from stated annual savings; `/extract` credit cost not listed.
- GitHub Actions exact per-minute overage rate — page internally inconsistent.
- Hetzner CX23 included traffic, IPv4 surcharge, current stock (shown "not available").
- Oracle Always Free current limits (oracle.com/cloud/free returned 403; relying on InfoQ).
- Bright Data Scraping Browser per-GB pricing (secondary sources only).
- Jina "tokens per page" — assumption of ~5,000 output tokens/page; Jina publishes no figure.
- GBP/USD 0.79 and GBP/EUR 0.85 — approximate, not checked live.
- `pg_trgm` and `fuzzystrmatch` availability on Supabase — **near-certain but not closable from a Supabase primary source** (`supabase.com/docs/guides/database/extensions/pg_trgm` returns 404). Both are standard PostgreSQL *trusted* contrib modules, which is what matters on a managed platform. **Verify in 30 seconds before relying on it:** `select name, default_version, installed_version from pg_available_extensions where name in ('pg_trgm','fuzzystrmatch','vector','unaccent');`
- Prevalence of HTTP validators across UK CMS platforms generally — only WordPress core was read at source; the rest is this leg's 5-endpoint measurement.
- ICO web-scraping guidance wording — the ICO page returns 403 to automated fetch; summarised from a search extract and **should be checked in a browser before being quoted**.
- Cloudflare challenge **status codes** (403/503) are widely observed but not stated in Cloudflare's primary docs; only the `cf-mitigated` header is documented.
- `daitch_mokotoff()` was added in PG 16 and may be absent on Supabase PG 15 — not that it matters, since the phonetic family is ruled out on UTF-8 grounds anyway.
</content>
</invoke>
