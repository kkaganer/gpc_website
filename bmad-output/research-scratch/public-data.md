# Public-Sector & Third-Sector Machine-Readable Event Sources — SE London

**Research leg:** UK public-sector / third-sector free, high-volume, high-trust event feeds
**Target boroughs:** Royal Greenwich, Lewisham, Southwark, Bromley, Tower Hamlets, Bexley
**Audience:** parents/carers of children under 5
**Budget context:** hard cap £20/week on paid APIs — everything in this document is **free**
**All endpoints below were empirically tested with `curl` on 2026-08-11** unless explicitly marked LIKELY or NOT FOUND.

---

## 0. Headline verdict

**The free public-sector tier alone comfortably clears "hundreds of under-5 events weekly", at £0 against the £20/week budget.** Conservative measured total: **~1,000+ under-5-relevant occurrences/week**, before any paid API is touched.

But the value is **not** where the brief assumed. Ranked by actual yield:

1. **OpenActive is the single biggest win — and it was nearly invisible.** Three RPDE JSON feeds (Better/GLL, Southwark Council, Tower Hamlets Council) deliver **~5,750 bookable sessions/week in target postcodes, ~810 of them under-5** (Soft Play, Toddler Splash, Family Swim, Parent & Child Free Swim). Proper JSON, CC-BY 4.0, **no API key, no auth, no registration**. Critically, **it is the only machine-readable source that covers Lewisham**.
2. **Spektrix ticketing has a fully public, unauthenticated JSON API — and seven relevant venues use it.** One adapter covers Polka, Blackheath Halls, Greenwich Theatre, The Albany (Deptford), Woolwich Works, Unicorn and Little Angel: **~2,600 future performance instances**. Polka additionally publishes an explicit **per-year age array** (`agesApplicable`), the most precise under-5 filter found anywhere.
3. **Family Hubs / children's centres are the *purest* under-5 tier — nothing needs filtering out.** Tower Hamlets publishes an open, unauthenticated JSON API (`POST /api/GetEventSchedules`) returning **566 dated sessions/31 days, 421 of them tagged 0-5**. Greenwich's Community Directory yields **113 dated sessions/week** plus **69/week** from five GLL children's centres. Lewisham Family Hubs adds ~40-70/week pre-banded by age.
4. **Library rhyme-times are the highest-*quality* content: ~150-170 sessions/week.** The best-structured data in the entire study is GLL/Better's turbo-frame timetable endpoint, which returns title, description, day/date/time, **full address with postcode**, audience tag and booking requirement in one fragment.
5. **Councils are the weakest tier, not the strongest.** There is **no JSON or iCal event API anywhere in the six councils**. Not one emits `application/ld+json` schema.org `Event` markup; the three Drupal councils explicitly refuse REST (`{"message":"No route found for the specified format. Supported formats: html."}`). Only two council RSS feeds exist. Councils yield ~220-250 occurrences/week all-ages, ~80-120 under-5.
6. **Open Referral UK — the brief's hoped-for jackpot — is a dead end for London.** The standard is live and excellent (8 working publishers nationally, Buckinghamshire returns 4,181 services with full `regular_schedules` recurrence and `age_band_under_2` fields), but **all six target boroughs plus ~25 other London boroughs returned zero JSON 200s** across three host patterns. The DfE's national aggregator is NXDOMAIN and its repos were archived in August 2024.
7. **Open data portals are a dead end for events.** Neither London Datastore nor data.gov.uk carries a single family-event dataset for these boroughs. Take venue reference data only.

**Cross-cutting: the big brands are the ones that block you.** National Trust (Radware bot wall), Historic Royal Palaces, Dulwich Picture Gallery and Southbank Centre are all hard-blocked and unscrapeable. Meanwhile mid-size local venues — Horniman, RMG, the Spektrix theatres — are wide open. **Invest in local venues, not national brands.**

**One strategic lead worth acting on:** Greenwich's Community Directory runs LocalGov Drupal's `localgov_outpost` module, importing from FutureGov's **Outpost** platform — the same product family behind Buckinghamshire's ORUK feed, with an identical JSON shape. **Greenwich's data already exists in an ORUK-shaped upstream API; it is simply not publicly exposed.** That is a specific, credible ask to put to the council.

**Known hard gaps to plan around:**
- **Lewisham Council** publishes no dated events at all (covered instead by OpenActive + Lewisham Libraries RSS).
- **Tower Hamlets under-5 library sessions** are not published in machine-readable form anywhere (the Idea Store feed contains zero rhyme/story times).
- **Bromley and Bexley** have no OpenActive publisher (Mytime Active and Bexley's operator don't participate) and thin council calendars — these two boroughs need a different acquisition strategy.

### Measured weekly occurrence volume (empirical, not estimated)

| Borough | Occurrences/week (all ages) | Method of measurement |
|---|---|---|
| Royal Greenwich | **88** | Parsed 800 dated occurrence rows off 20 listing pages; counted those falling 11-18 Aug 2026 |
| Southwark (Children & families only) | **~65** | 6-event sample → 94 occurrences over next 3 months, extrapolated across 54 category events |
| Tower Hamlets | ~60-90 | 299 RSS items, rolling ~2-month window |
| Bexley | ~5-10 | 92 unique events over an 18-page/multi-month calendar |
| Bromley | ~5 | Entire borough calendar is ~19-30 events |
| Lewisham | **0** | No dated calendar exists |

---

## 1. Summary table — all sources tested

### 1a. Borough councils

| Source | Platform | Type | Concrete URL | Status | Est. events/wk | Under-5 relevance |
|---|---|---|---|---|---|---|
| **Tower Hamlets events RSS** | Contensis | **RSS 2.0** | `https://www.towerhamlets.gov.uk/News_events/Events/Events.aspx?Calendar_List_SyndicationType=1` | **CONFIRMED WORKING** — 299 items, 249KB | ~60-90 | **Medium** — 52 items tagged `children and families`, but skews school-age/youth |
| Tower Hamlets events Atom | Contensis | Atom 1.0 | `https://www.towerhamlets.gov.uk/News_events/Events/Events.aspx?Calendar_List_SyndicationType=2` | **CONFIRMED WORKING** — 229KB, same payload | same | same |
| **Bromley events RSS** | Jadu CMS | **RSS 2.0** | `https://www.bromley.gov.uk/rss/events` | **CONFIRMED WORKING** — 20 items (hard cap) | ~5 | **Low** — whole borough calendar is only ~19 events |
| **Southwark Presents** | LocalGov Drupal | HTML (paged, filterable) | `https://www.southwark.gov.uk/southwark-presents` | **CONFIRMED WORKING** (scrape) | ~100+ occurrences | **HIGH** — 65 "Children and families"; full library rhymetime network |
| Southwark Presents — Children & families filter | LocalGov Drupal | HTML | `https://www.southwark.gov.uk/southwark-presents?event_categories%5B%5D=269` | **CONFIRMED WORKING** — 65 unique events | ~40-60 | **HIGH** |
| **Greenwich events** | Drupal 10 + `localgov_event` | HTML (paged) | `https://www.royalgreenwich.gov.uk/events` | **CONFIRMED WORKING** (scrape) | 195 unique / ~1350 occurrence rows | **Low-Medium** — only ~2-8 clearly under-5 |
| **Bexley events** | Drupal 10 (custom view) | HTML (paged, filterable) | `https://www.bexley.gov.uk/events` | **CONFIRMED WORKING** (scrape) | 92 unique | **Medium** — weekly `Sparkles Babies` series |
| Lewisham "What's on" | ASP.NET / IIS 10 | HTML editorial only | `https://lewisham.gov.uk/events` | **CONFIRMED — but NO dated calendar** | ~0 | **None** — 17 campaign pages, some stale to Nov 2025 |
| Greenwich `/jsonapi`, `/events?_format=json` | Drupal | JSON | — | **NOT FOUND** (404 / 406) | — | — |
| Southwark `/jsonapi`, `/events/feed` | Drupal | JSON/RSS | — | **NOT FOUND** (404 / 406) | — | — |
| Bexley `/jsonapi`, `/events.xml` | Drupal | JSON | — | **NOT FOUND** (404) | — | — |
| Any borough `/wp-json/tribe/events/v1/events` | — | JSON | — | **NOT FOUND** — no borough runs WordPress | — | — |
| Greenwich/Southwark `/rss.xml` | Drupal | RSS | `https://www.royalgreenwich.gov.uk/rss.xml` | **CONFIRMED WORKING but USELESS** — 10 items, *news* not events | 0 | None |

### 1c. OpenActive — **THE SINGLE BIGGEST WIN IN THIS STUDY**

Proper machine-readable open data: JSON, CC-BY 4.0, **no API key, no auth, no registration**. ~810 under-5 sessions/week for £0.

| Source | Type | Concrete URL | Status | Est. sessions/wk (target boroughs) | Under-5 relevance |
|---|---|---|---|---|---|
| **Better / GLL** | OpenActive RPDE JSON | `https://better-admin.org.uk/api/openactive/better/scheduled-sessions` (+ `/session-series`) | **CONFIRMED WORKING** — verified 500 items/page, CC-BY | **1,403** | **HIGH** — 542/wk under-5 |
| **Southwark Council** | OpenActive RPDE JSON | `https://opendata.leisurecloud.live/api/feeds/SouthwarkCouncil-live-scheduled-sessions` (+ `-session-series`) | **CONFIRMED WORKING** — verified | **2,623** | **HIGH** — ~125/wk |
| **Tower Hamlets Council** | OpenActive RPDE JSON | `https://opendata.leisurecloud.live/api/feeds/TowerHamletsCouncil-live-scheduled-sessions` (+ `-session-series`) | **CONFIRMED WORKING** — verified | **1,730** | **HIGH** — ~146/wk |
| OpenActive root catalogue | JSON-LD | `https://openactive.io/data-catalogs/data-catalog-collection.jsonld` | **CONFIRMED WORKING** — verified, 4 sub-catalogues / 174 dataset sites | — | — |
| Feed health dashboard | HTML | `https://status.openactive.io/` | **CONFIRMED WORKING** — 660 rows, 446 ✅ | — | — |
| Southwark (Bookteq) | RPDE | `https://southwarkcouncil.bookteq.com/api/open-active/slots` | **CONFIRMED WORKING** | facility hire only | LOW |
| Everyone Active | RPDE | `https://opendata.leisurecloud.live/api/feeds/EveryoneActive-live-session-series` | **CONFIRMED WORKING but IRRELEVANT** — nearest venue BR8 is Sevenoaks, not Bromley | ~0 | — |
| Places Leisure | RPDE | `.../PlacesLeisure-live-session-series` | **CONFIRMED WORKING but IRRELEVANT** — 0 SE London venues | 0 | — |
| Bookwhen | RPDE | `https://bookwhen.com/api/openactive/sessionseries` | **CONFIRMED but THIN** — 1,530 series nationally, 2 in SE London | ~1 | LOW |
| GLL Legend endpoint | RPDE | `https://gll-openactive.legendonlineservices.co.uk/api/sessions` | **BROKEN — HTTP 500.** Use `better-admin.org.uk` | 0 | — |
| Serco Leisure | RPDE | `https://serco-openactive.legendonlineservices.co.uk/OpenActive` | **BROKEN — HTTP 403** | 0 | — |
| **Mytime Active (Bromley)** | — | — | **NOT FOUND — hard gap** | 0 | — |
| **Bexley leisure operator** | — | — | **NOT FOUND — hard gap** | 0 | — |
| **postcodes.io** | JSON API | `https://api.postcodes.io/postcodes` (bulk POST + reverse lat/lon) | **CONFIRMED WORKING** — free, no key | n/a | **CRITICAL — postcode→borough** |

### 1d. Open data portals — tested, and essentially barren for events

| Source | Type | Concrete URL | Status | Events | Notes |
|---|---|---|---|---|---|
| London Datastore | CKAN-ish JSON | `https://data.london.gov.uk/api/action/package_search` | **CONFIRMED WORKING but `q` IS SILENTLY IGNORED** | **0 event datasets** | Every query returns the same 1,297 records / 10.3 MB. Results nest at `result.result`, not `result.results` |
| GLA Cultural Infrastructure Map | xlsx/csv | `https://data.london.gov.uk/dataset/2rj5o` (2026-06-22) | **CONFIRMED WORKING** | 0 | Useful **venue reference data** (libraries, community centres) |
| data.gov.uk | CKAN v3 JSON | `https://data.gov.uk/api/3/action/package_search?q=...` | **CONFIRMED WORKING (`q` works)** | **0 for our 6 boroughs** | Children's-centre datasets exist only for Lincolnshire, Lambeth, N. Somerset, York — none of ours |
| ONS Open Geography | ArcGIS REST | `https://services1.arcgis.com/ESMARspQHYMw9BZ9/...` | **CONFIRMED WORKING** | 0 | Borough polygons (EPSG:27700, not WGS84) |

### 1f. Family Hubs / Local Offer / FIS directories — where the *purest* under-5 content lives

This tier is 100% on-target for under-5s (stay-and-play, weigh-in clinics, baby feeding drop-ins, rhyme time) — no filtering out of adult or teen content needed.

| Source | Platform | Type | Concrete URL | Status | Est. records | Under-5 |
|---|---|---|---|---|---|---|
| **Tower Hamlets Best Start Family Hubs** | `apollo-api` (.NET/Azure) | **JSON API, POST, no auth** | `POST https://www.thfamilyhubs.co.uk/api/GetEventSchedules` body `{"startDate":"2026-08-11","endDate":"2026-09-11"}` | **CONFIRMED WORKING** — verified 566 records / 49 fields / 2.0 MB, **421 tagged 0-5** | **~95/wk** | ★★★★★ **DATED EVENTS** |
| **Greenwich Community Directory** | LocalGov Drupal 10 + `localgov_outpost` | HTML + XML sitemap | `https://greenwichcommunitydirectory.org.uk/sitemap.xml` | **CONFIRMED WORKING** — verified **1,346 service URLs** | 380 under-5 | ★★★★★ **DATED EVENTS** |
| Greenwich date-range query | " | HTML, deterministic params | `…/services?event_from=2026-08-11&event_to=2026-08-18` | **CONFIRMED WORKING** | **113 dated/7d**, 35 today | ★★★★★ |
| **Greenwich GLL children's centres** | Better (Rails) | HTML timetable grid | `https://www.better.org.uk/children-centre/london/greenwich/storkway-childrens-centre/timetable` | **CONFIRMED WORKING** | **69 sessions/wk** across 5 centres | ★★★★★ |
| **Lewisham Family Hubs** | ASP.NET WebForms | HTML, dated occurrences | `https://lewishamfamilyhubs.org.uk/events/birth-to-5-years` | **CONFIRMED WORKING** | 24 event types, 17 venues | ★★★★★ **~40-70/wk** |
| **Tower Hamlets children's centres** | Contensis | **HTML tables (no PDFs)** | `…/Early_Help/Children-and-Family-Centres/North-East-Locality-activity-timetable.aspx` | **CONFIRMED WORKING** | 17 tables / 267 rows | ★★★★★ |
| **Southwark Family Information Directory** | LocalGov Drupal | HTML pagination | `https://www.southwark.gov.uk/children-young-people-and-families/family-information-directory?page=0..26` | **CONFIRMED WORKING** — 267 entries | "Age group: 0 to 5 years" | ★★★★ directory |
| **Bromley parent & toddler directory** | Jadu | HTML + "Open hours" recurrence | `https://www.bromley.gov.uk/directory/44/a-to-z/A` | **CONFIRMED WORKING** — 49 records | day + time + term-time | ★★★★ |
| Bromley nurseries / childminders / SEND | Jadu | HTML | `directoryID=42` (186), `40` (316), `52` (170) | **CONFIRMED WORKING** | 2,992 total directory URLs | ★★★ directory |
| **Lewisham FIS search API** | Contensis → Azure AI Search | **JSON API, POST, no auth** | `POST https://lewisham.gov.uk/lew-api/search/list` (multipart, field `searchQuery`) | **CONFIRMED WORKING** — 129 FIS orgs / 4,064 all-directory | **but age tags null on 112/129** | ★★ thin directory |
| Southwark hub timetables | WordPress / Squarespace / Wix | **PDF + images** | `https://br-cc.org.uk/wp-json/wp/v2/pages/6031` (change-detect) | **CONFIRMED WORKING** | 20+ live PDFs, ~60-100 sessions/wk | ★★★★ but **needs PDF/OCR** |
| Tower Hamlets Local Offer | FocusGov (Rails) | **JSON GET** | `…/events.json?search_event[start_date]=…&[end_date]=…` | **CONFIRMED WORKING** | 140 events / 3,701 occurrences | ★★ SEND/youth-skewed |
| Bexley Local Offer calendar | SLA Online / FrontlineData | JSON envelope | `https://bexleylocaloffer.uk/Training/LargeCalendar?date=2026-09-01` | **CONFIRMED WORKING but BLOCKED** — `robots.txt` = `Disallow: /` for all but Google/Bing/Apple | 3-5 events/month | ★ — **needs agreement** |
| **Bexley children's centre timetables** | — | — | — | **NOT FOUND — genuine gap**, phone signposting only | 0 | ✗ |
| Bromley children's centre timetables | Issuu + Facebook | PDF flipbook | `https://issuu.com/bromleychildrenproject` | **CONFIRMED but NOT machine-readable** | 6 centres | ✗ format |
| **Open Referral UK — any target borough** | — | — | `/api/v1/services`, `/openreferral/v1/services`, `<borough>.openplace.directory` | **NOT FOUND — ZERO London adoption** | 0 | ✗ |
| DfE "Find support for your family" | — | — | `find-support-for-your-family.education.gov.uk` | **NOT FOUND — NXDOMAIN, service dead**; repos archived Aug 2024 | 0 | ✗ |
| `royalgreenwich.gov.uk/fish` | — | — | — | **NOT FOUND (404)** — superseded by Community Directory | — | — |
| `southwark.gov.uk/localoffer`, `bexley.gov.uk/localoffer` | — | — | — | **NOT FOUND (404)** | — | — |
| `bromleylocaloffer.org.uk` | — | — | — | **NOT FOUND — NXDOMAIN** | — | — |

### 1e. Cultural venues — Spektrix is a second, unexpected jackpot

| Source | Location | Type | Concrete URL | Status | Est./wk | Under-5 |
|---|---|---|---|---|---|---|
| **Spektrix API v3 (7 venues)** | SE London + | **JSON, unauthenticated** | `https://system.spektrix.com/{client}/api/v3/events` + `/instances?startFrom=` | **CONFIRMED WORKING** — verified all 7 | **~2,600 future instances** | **High** |
| — Polka Theatre | Wimbledon | " | client `polka` | **CONFIRMED** — 75 events | — | **High** |
| — Blackheath Halls | Greenwich | " | client `blackheathhalls` | **CONFIRMED** — 463 events | — | Med |
| — Greenwich Theatre | Greenwich | " | client `greenwichtheatre` | **CONFIRMED** — 138 events | — | Med |
| — The Albany | Deptford, **Lewisham** | " | client `thealbany` | **CONFIRMED** — 51 events | — | **High** |
| — Woolwich Works | Greenwich | " | client `woolwichworks` | **CONFIRMED** — 46 events | — | Med |
| — Unicorn Theatre | Southwark | " | client `unicorntheatre` | **CONFIRMED** — 22 events, 395 future instances | — | **High** |
| — Little Angel Theatre | Islington | " | client `littleangeltheatre` | **CONFIRMED** — 463 future instances | — | **High** |
| **Polka `calendar-events`** | Wimbledon | **JSON, per-year age array** | `https://polkatheatre.com/wp-json/polka/v1/calendar-events` | **CONFIRMED WORKING** — verified 334 instances, **197 under-5** | ~11 | **Highest precision** |
| **London Wildlife Trust** | Southwark, Lewisham | **Drupal JSON:API** | `https://www.wildlondon.org.uk/jsonapi/node/event` | **CONFIRMED WORKING** — verified 1,879 total, 46 upcoming | ~5 | **High** |
| **English Heritage** | Eltham Palace, Ranger's House (Greenwich) | Internal JSON API | `https://www.english-heritage.org.uk/api/eventsearch/1/200/datetime/0/all/none/none/none/none/0/0` | **CONFIRMED WORKING** — verified `total: 149` | ~10 | Med |
| **Horniman Museum** | Forest Hill, **Lewisham** | admin-ajax HTML | `https://www.horniman.ac.uk/wp-admin/admin-ajax.php?action=getEvents&page=N` | **CONFIRMED WORKING** (HTML) | 26 events | **High** |
| **Royal Museums Greenwich** | Greenwich | HTML, single page | `https://www.rmg.co.uk/whats-on` | **CONFIRMED WORKING** (HTML) | 40 events | **High** |
| **London Museum Docklands** | Tower Hamlets | Wagtail+htmx HTML | `https://www.londonmuseum.org.uk/whats-on/?p=N` | **CONFIRMED WORKING** (HTML) | 19/page ×3+ | **High** |
| **Greenwich Theatre WP REST** | Greenwich | JSON | `https://www.greenwichtheatre.org.uk/wp-json/wp/v2/events?per_page=100` | **CONFIRMED WORKING** — 52 events | — | Med |
| **Charlton House / RGHT** | Greenwich | Sitemap + HTML | `https://www.greenwichheritage.org/rght_events-sitemap.xml` | **CONFIRMED WORKING** | 15 events | **High** |
| Royal Parks (Greenwich Park) | Greenwich | Drupal Views AJAX | `POST https://www.royalparks.org.uk/views/ajax` | **CONFIRMED WORKING** | ~45 total | Med |
| Tate Modern | Southwark | HTML `?page=N` | `https://www.tate.org.uk/whats-on?page=N` | **LIKELY** (scrape) | 20/page ×8 | Med |
| Old Royal Naval College | Greenwich | HTML | `https://www.ornc.org/whats-on/` | **LIKELY** (scrape) | ~7 | Low |
| City of London / Woodland Trust | — | HTML | — | **LIKELY but WRONG GEOGRAPHY** | ~0 in SE London | Low |
| **National Trust** | — | — | — | **NOT FOUND — Radware bot wall** | 0 | — |
| **Historic Royal Palaces** | Tower Hamlets | — | — | **NOT FOUND — Cloudflare 403** | 0 | — |
| **Dulwich Picture Gallery** | Southwark | — | — | **NOT FOUND — Cloudflare 403** | 0 | — |
| **Southbank Centre** | Lambeth | — | `/wp-json/v1/search` | **NOT FOUND — Cloudflare challenge** | 0 | — |
| Any venue `/wp-json/tribe/events/v1/events` | — | — | — | **NOT FOUND** — no venue tested runs The Events Calendar | 0 | — |

### 1b. Library services — THE HIGHEST-VALUE *CURATED* TIER FOR UNDER-5s

Bounce & Rhyme / Rhymetime / Storytime turned out to be the single biggest win in this study. **~150-170 under-5 sessions/week across the six boroughs**, all free.

| Source | Platform | Type | Concrete URL | Status | Est. under-5/wk | Under-5 relevance |
|---|---|---|---|---|---|---|
| **Greenwich Libraries (GLL/Better)** | Better Rails + Turbo Frame | **Structured HTML fragment** | `https://www.better.org.uk/library/dynamic_pages/panels/{panelId}/timetables/items` | **CONFIRMED WORKING** — verified 275 cards on panel 11000 | **~84** | **Very high** |
| **Bromley Libraries (GLL/Better)** | same | same (13 Bromley panel IDs) | same endpoint | **CONFIRMED WORKING** | ~12 | **High** |
| **Lewisham Libraries** | Solus "Library Magic" | **RSS 2.0** | `https://lewisham.events.mylibrary.digital/rss` | **CONFIRMED WORKING** — verified 299 items, 336KB | **~16** | **Very high** |
| **Southwark Libraries** | council CMS page (Spydus has no events module) | HTML (recurrence table) | `https://www.southwark.gov.uk/culture-and-sport/libraries/library-activities-babies-and-toddlers/story-music-and-play-sessions` | **CONFIRMED WORKING** (scrape) | **~26** | **Very high** |
| **Bexley Libraries** | Axiell Arena (Liferay) | HTML, undated recurrence text | `https://arena.yourlondonlibrary.net/web/bexley/regular-events-for-children` | **LIKELY** (scrape; no dated feed) | ~15-25 | High |
| **Tower Hamlets Idea Store** | Solus "Library Magic" | RSS 2.0 | `https://idea.events.mylibrary.digital/rss` | **CONFIRMED WORKING but LOW VALUE** — 133 items, **zero rhyme/story times** | ~6 (Lego Club only) | Low — **coverage gap** |
| Eventbrite organiser pages (all 6 services) | — | — | `eventbrite.co.uk/o/{...}-libraries` | **NOT FOUND** — all 404 | 0 | — |
| Bookwhen / LibCal / Ticketsource (all 6) | — | — | tested `.ics` + subdomains | **NOT FOUND** — 404 / NXDOMAIN | 0 | — |
| Southwark Spydus events module | Civica Spydus | — | `southwark.spydus.co.uk/.../WPAC/EVENTS` | **NOT FOUND** — all paths fall through to OPAC home | 0 | — |
| `capitadiscovery.co.uk/{bromley,bexley}` | — | — | — | **DO NOT WIRE** — domain expired, now redirects to a payday-loan site | 0 | — |


---

## 2. Detail by borough

### 2.1 Tower Hamlets — BEST COUNCIL FEED

**Platform:** Contensis (`.aspx`, `/aspnet_client/ContensisThemes/`). The events calendar module natively syndicates.

**Confirmed feed:**
```
https://www.towerhamlets.gov.uk/News_events/Events/Events.aspx?Calendar_List_SyndicationType=1   (RSS 2.0)
https://www.towerhamlets.gov.uk/News_events/Events/Events.aspx?Calendar_List_SyndicationType=2   (Atom 1.0)
```
- HTTP 200, `application/xml`, 248,647 bytes, **299 `<item>` elements**, 196 unique titles.
- No auth, no key, no rate limit observed.
- `Calendar_List_Page=2` is **ignored** — the feed always returns the full 299. No paging needed.
- The equivalent News feed URL pattern (`News.aspx?News_List_SyndicationType=1`) 404s — events only.

**Real item shape:**
```xml
<item>
  <title>Splash pool</title>
  <link>https://www.towerhamlets.gov.uk/News_events/Events/2026/July/Splash-pool.aspx</link>
  <description>Vicky Park Splash Pool is a great place to cool off in the summer heat</description>
  <pubDate>Wed, 08 Jul 2026 14:57:00 GMT</pubDate>
  <media:thumbnail url="https://www.towerhamlets.gov.uk/images_and_video/.../splash-pool-...-150x150.jpg" />
  <category>summer activities</category>
  <category>children and families</category>
  <category>victoria park</category>
</item>
```

**CRITICAL GOTCHA:** `<pubDate>` is the **publication** date, not the event date. You must fetch the detail page for the real date. Fortunately detail pages are cleanly structured — visible text renders as labelled blocks:
```
Location   → Idea Store Bow 1 Gladstone Place London E3 5GT
Category   → Free to attend, Libraries and literature, Summer events, Summer holidays
Date(s)    → Tuesday 11th August 2026 (15:00-16:00)
Description→ ...
```
This is a reliable label→value parse; no LLM needed. Cost: 299 detail fetches/week (trivial).

**Parse reliability measured: 12/12 on a random sample.** Extracting the line following the `Date(s)` and `Location` labels:

| Event | Date(s) parsed | Location parsed |
|---|---|---|
| `Wee-Movers-19-Aug` | `Wednesday 19th August 2026 (13:00-14:00)` | `Cubitt Town Library Strattondale St...` |
| `Paper-plate-tambourine` | `Tuesday 11th August 2026 (15:00-16:00)` | `Idea Store Whitechapel 321 Whitech...` |
| `Musical-Beat-Instruments` | `Wednesday 12th August 2026 (15:00-16:00)` | `Idea Store Canary Wharf Churchill...` |
| `Arts-and-crafts-13-August` | `Thursday 13th August 2026 (11:00-15:00)` | `Mile End Children's Park Locksley...` |
| `Library-treasure-hunt` | `Saturday 22nd (09:00) - Monday 31st August 2026 (16:00)` | `Idea Store Canary Wharf Churchill...` |

Two things worth noting for the ingestion layer:
- **Location strings include full postcodes** (`E14 3HA`, `E1 1QN`, `E3 5GT`). This plugs straight into the site's existing postcode-based location model — no separate geocoding lookup needed for Tower Hamlets.
- **Multi-day ranges occur** (`Saturday 22nd (09:00) - Monday 31st August 2026 (16:00)`) where the month/year is stated only once at the end. A naive single-date regex will mis-parse these; handle the range form explicitly.
- A meaningful share of Tower Hamlets events are hosted at **Idea Stores** (the borough's library brand) and include genuine under-5 sessions such as `Wee Movers`, which the title-only keyword scan missed. Under-5 yield here is better than a title scan suggests — classify on venue + description, not title.

**Categories present in feed (top):** `children and families` (52), `victoria park` (36), `summer activities` (34), `Summer of Fun 2026` (29), `library` (11), `idea store` (9), `arts and crafts` (3). Note the `<category>` field is polluted — venue addresses and stray title words leak in as categories (`hunt`, `treasure`, `wee`, `movers`, `London E1 4ER`). Filter on a whitelist, don't trust it as a taxonomy.

**Date coverage:** rolling near-term — 2026-August (624 URL refs), 2026-July (66), 2026-September (12). Weekly harvest is appropriate; it will not give you months of lead time.

**Under-5 caveat:** despite 52 `children and families` items, only 1 title strictly matches under-5 vocabulary (`Stay and play`). The bulk is youth-centre / school-age holiday provision. Treat as **Medium** relevance, and note that Tower Hamlets' true under-5 content sits in the **Idea Store** library service.

**robots.txt:** returns 404 — no crawl restrictions published.

---

### 2.2 Southwark — BEST COUNCIL SOURCE FOR UNDER-5s

**Platform:** LocalGov Drupal (`x-generator: LocalGov Drupal powered by Big Blue Door`), with the `localgov_event` module. Site search is Cludo (`cludo_engineId = 13695`).

**Important:** `/events` is a signposting page. The **actual event catalogue is `/southwark-presents`**.

**Confirmed working (HTML scrape):**
```
https://www.southwark.gov.uk/southwark-presents
https://www.southwark.gov.uk/southwark-presents?page=N        (8 occurrences per page, N goes 80+)
```
Pagination is **occurrence-level**, not event-level — a weekly class appears once per date. Crawling pages 0-12 yielded 104 rows → 82 unique events, confirming real (not looping) pagination.

**Queryable GET filters — all confirmed working:**

| Param | Values | Notes |
|---|---|---|
| `event_categories[]` | `269`=Children and families, `447`=Libraries Summer Programme, `448`=Holiday Activities and Food, `60`=Libraries, `131`=Free, `133`=Into nature, `127`=Health and wellbeing | **Works** |
| `event_price` | `1`=Free, `2`=Paid, `41`=Pay what you can, `168`=Special offer | Works but appears to AND aggressively — combining with category over-narrows |
| `localgov_event_locality[]` | `42`=Bankside, `43`=Bermondsey, `44`=Borough, `50`=Elephant and Castle, `45`=Camberwell, `47`=Denmark Hill, `49`=Dulwich, `239`=East Dulwich, `55`=Nunhead, `56`=Peckham, `57`=Rotherhithe, `58`=Surrey Quays, `59`=Walworth | Works |
| `date_min` / `date_max` | `YYYY-MM-DD` | Works |
| `search_keys` | free text | Present but did **not** filter in testing |

**The money query:**
```
https://www.southwark.gov.uk/southwark-presents?event_categories%5B%5D=269&page=N
```
→ **65 unique "Children and families" events**, including the complete library rhymetime network:
`jump-beat-storytime-and-rhymes-{blue-anchor,camberwell,canada-water,grove-vale,john-harvard,kingswood,nunhead,una-marson}-library`, plus `music-classes-for-under-fives-canada-water-library`, `storymakers-under-5s-free-class`, `bach-baby-family-concert-{east-dulwich,dulwich-village}`, `crafts-summer-vibes-grove-vale-library`, `craft-create-celebrate-sound-{john-harvard,una-marson}-library`.

**Detail pages carry machine-readable ISO dates including every recurrence:**
```html
<time datetime="2026-08-12T10:00:00Z">  <time datetime="2026-08-19T10:00:00Z">
<time datetime="2027-03-11T10:45:00Z">  <time datetime="2027-03-18T10:45:00Z">
```
Extracting `<time datetime>` from a detail page gives you the full recurrence set in one fetch — you do **not** need to crawl every listing page to expand a weekly series. This is the cheapest recurrence expansion available in any council in this study.

**Southwark also accepts public event submissions** (`/list-your-event`), which is why the catalogue is large and includes third-party providers (Bach to Baby, JL Tennis Academy, private classes). Good for volume; means provenance/quality varies.

**robots.txt:** stock Drupal — only `/core/`, `/profiles/`, README files disallowed. `/southwark-presents` fully permitted.

---

### 2.3 Royal Greenwich — HIGHEST RAW VOLUME, LOW UNDER-5 DENSITY

**Platform:** Drupal 10 (`x-generator: Drupal 10`) with the `localgov_event` module (confirmed present in markup).

**Confirmed working (HTML scrape):**
```
https://www.royalgreenwich.gov.uk/events
https://www.royalgreenwich.gov.uk/events?page=N     (~29-34 occurrence rows/page)
```
Crawled 45 pages (~1,350 occurrence rows) → **195 unique event URLs**. Pagination had still not terminated at page 45; it is occurrence-expanded across many months.

**BIG WIN — the listing page is self-sufficient.** Unlike every other council here, Greenwich renders date, recurrence rule, neighbourhood and price directly in the listing:
```
Greenwich
Pebbles Parent and toddler group
Tuesday 11 August 2026 at 10am (Weekly on Tuesday)

Kidbrooke
Circus Works: Circus Workshops for Kids
Tuesday 11 August 2026 at 10am (Daily)
Child: £22 | Ticket includes a £2 booking fee per ticket
```
You get title + ISO-able date + recurrence + neighbourhood + price **without any detail fetch**. Scraping ~45 listing pages weekly replaces ~195 detail fetches.

**Filters:**

| Param | Status |
|---|---|
| `neighbourhood` = `5`Abbey Wood, `6`Blackheath, `7`Charlton, `8`Eltham, `16`New Eltham, `9`Greenwich, `10`Kidbrooke, `11`Plumstead, `12`Shooters Hill, `13`Thamesmead, `14`Woolwich, `15`Online | **WORKS** (`?neighbourhood=9` → 18 hits) |
| `start` / `end` (`YYYY-MM-DD`) | Present; window query returns results |
| `search_keys` | **DOES NOT FILTER** — returns unfiltered 29 rows for both `toddler` and `baby`. Do not rely on it. |

**Detail pages have no `<time datetime>`** — dates appear only as free text (`Monday 10 August, 10am -12pm, Workshop for ages 4 - 7 years old.`). Another reason to prefer the listing page.

**Under-5 density is poor:** of 152-195 unique events, only ~2 strictly match under-5 vocabulary (`Pebbles Parent and toddler group`, `Bach to Baby Family Concert in Blackheath`). Greenwich's under-5 provision is **not** in the council events calendar — it lives in Greenwich Libraries, the FiSH/Local Offer directory and children's centres.

**robots.txt:** stock Drupal; `/events` permitted.

---

### 2.4 Bexley — SMALL BUT CLEAN, GOOD BABY SERIES

**Platform:** Drupal 10 (`x-generator: Drupal 10`), custom events view (the `localgov_event` module is **not** present).

**Confirmed working (HTML scrape):**
```
https://www.bexley.gov.uk/events
https://www.bexley.gov.uk/events?page=N      (5 rows/page; terminates at page 18)
```
→ **92 unique events**. Note `/events/feed` and `/events/rss.xml` return HTTP 200 but serve the **HTML page**, not a feed — a soft-404 trap. Do not treat as feeds.

**Listing carries everything you need:**
```
12 Aug
Sparkles Babies - 12 August
A group for parents of babies up to one year old to meet others
Wednesday 12 August 11 am to 12 pm
```

**Filters — confirmed working:**
- `category` = `51`Animals and wildlife, `144`Christmas, `156`Easter, `141`Halloween, `52`Charity fundraiser, `53`Comedy and entertainment, `54`Community, `55`Cycling, `56`Education and courses, `57`Exhibitions, `58`Fostering and adoption, `50`Fun Craft and Fairs, `59`Music art and theatre
- `date` = month-bucket term IDs (e.g. `212`=August 2026, `210`=September 2026, `211`=November 2026)
- Example: `https://www.bexley.gov.uk/events?category=50&date=All` → 5 hits (verified filtering).

**Under-5 content:** 10 strict matches, dominated by the weekly **`Sparkles Babies`** series (parents of babies up to one year) running `12 Aug, 19 Aug, 26 Aug, 2 Sep, 9 Sep, 16 Sep, 23 Sep, 30 Sep...`, plus `Bexley Mum2mum Nearly New Market`. Bexley pre-expands recurrences into separate nodes with dates in the slug — easy to ingest, but you must dedupe into a series for display.

Caveat: a large share of Bexley's calendar is `Duplicate Bridge` repeated ~40 times. Filter it out.

---

### 2.5 Bromley — WORKING FEED, NEGLIGIBLE VOLUME

**Platform:** Jadu CMS (`<generator>Jadu CMS</generator>`).

**Confirmed working:**
```
https://www.bromley.gov.uk/rss/events     → HTTP 200, text/xml, 20 items (hard cap)
https://www.bromley.gov.uk/rss/news       → HTTP 200, 20 items
```
Other Jadu channels tested (`/rss/whatson`, `/rss/consultations`, `/rss/jobs`, `/rss/alerts`) all **404**.

**GOOD NEWS on date semantics:** unlike Tower Hamlets, Bromley's `<pubDate>` **is the event date**:
```xml
<item>
  <title>Baby Gospel family concert in Crystal Palace - August 2026</title>
  <link>https://www.bromley.gov.uk/events/event/787/baby-gospel-family-concert-in-crystal-palace-august-2026</link>
  <description>Baby Gospel is an uplifting family concert of soul, Motown and gospel music...</description>
  <pubDate>Thu, 27 Aug 2026 00:00:00 +0100</pubDate>
</item>
```
So the RSS alone is ingestible with **zero detail fetches**. Time-of-day is missing (always 00:00) — fetch detail if you need it.

**BAD NEWS:** the entire Bromley events calendar is only **~19-30 events** (`/events?page=0,1` populated, `page=2+` empty). The 20-item RSS is therefore ~all of it. Under-5 content: essentially one item (`Baby Gospel family concert`).

Bromley HTML listing renders `Date:` / `27th August 2026` label pairs if you prefer scraping.

**robots.txt:** none (serves a 404 page).

---

### 2.6 Lewisham — NO MACHINE-READABLE EVENTS, NO CALENDAR AT ALL

**Platform:** Microsoft-IIS/10.0, ASP.NET (`ASP.NET_SessionId`, `shell#lang` cookie). Not Drupal, not WordPress, not Jadu, not Contensis.

**Findings — all negative:**
- `https://lewisham.gov.uk/events` → HTTP 200 but it is an **editorial signposting page**, not a calendar. It lists ~17 campaign/festival pages (`Catford Community Festival`, `Refugee Week`, `Lewisham in Bloom`, `Black History Lewisham 365`, `Open House London`, `Blackheath fireworks`). Several are **stale** — Blackheath fireworks still shows *Saturday 1 November 2025*.
- No dated event objects, no recurrence, no times, no venues.
- `https://lewisham.gov.uk/rss` → 404. `https://lewisham.gov.uk/inmyarea/events/rss` → 404.
- `https://lewisham.gov.uk/sitemap.xml` → **CONFIRMED WORKING**, 2,062 URLs, but only 41 contain "event" and those are the same campaign pages.
- No references to Eventbrite / Bookwhen / LibCal / Spydus / Ticketsource anywhere on the events page.
- `robots.txt` → `User-agent: * / Disallow:` (i.e. **everything allowed**) + sitemap pointer.

**Conclusion:** Lewisham Council itself contributes **zero** usable event data. Lewisham coverage must come from Lewisham Libraries, the Lewisham Local Offer, the Horniman Museum (which is in Lewisham), the Albany/Deptford Lounge, and community sources. This is a significant coverage hole to plan around.

---

## 2B. Library services — detail

Library services are a **separate integration surface from the councils** — in four of six boroughs the library events live on an entirely different platform from the council website. This is where the under-5 content actually is.

### 2B.1 Greenwich + Bromley — GLL / "Better" (richest structured data found anywhere)

Both library services are operated by **Greenwich Leisure Limited trading as "Better"** (confirmed: `bromley.gov.uk/libraries` links out to `better.org.uk/library/london/bromley`).

Branch `/whats-on` pages look empty to `curl` because events load via a **Turbo Frame**:
```html
<turbo-frame id="dynamic_pages_panel_11000" src="/library/dynamic_pages/panels/11000/timetables/items">
```

Fetching that `src` directly works — **no auth, no key, no bot challenge**:
```
https://www.better.org.uk/library/dynamic_pages/panels/11000/timetables/items
→ HTTP 200, text/html, 111,231 bytes, 275 activity cards   [independently re-verified]
```

Card structure — richer than any RSS in this study:
```html
<div class="activities-item-card">
  <div class="activities-item-card__content--top">Woolwich Centre Library <span>No booking needed</span></div>
  <h5>Baby Rhyme Time</h5>
  <div class="trix-content"><div>Help your little ones learn, with songs and rhymes for children aged 0-2.</div></div>
  • Tuesday 11 Aug 11:00 AM - 11:30 AM
  • 35 Wellington Street, Woolwich, London, SE18 6HQ
  • Children's Activities
  • Children
```

Every field you need in one place: branch, **booking requirement**, title, description, day + date + time range, **full address with postcode**, category, audience. The postcode drops straight into the site's existing postcode-based location model.

Verified title distribution on panel 11000 (Woolwich) alone: `Baby Rhyme Time` ×10, `Story Time` ×2, `Stay & Play` ×2, `Lego Busy Builders (Term time only)` ×2, plus `ZooLab: Live Animal Handling Workshop`, `Cook, Create, Taste` and others. Across 25 branches: **Greenwich 96, Bromley 14** dated under-5 sessions.

**Panel ID map** (discovered via `https://www.better.org.uk/library/sitemap.xml` — 337 URLs, 27 branch pages):

*Greenwich:* `4558` abbey-wood · `4830` blackheath · `5170` charlton-house · `5510` coldharbour · `5850` eltham · `6190` greenwich-centre · `6870` new-eltham · `7210` plumstead · `7550` slade-centre · `7890` thamesmere · `8230` west-greenwich · `11000` woolwich-centre

*Bromley:* `149` beckenham · `5034` biggin-hill-memorial · `5714` bromley-historic-collections · `6394` burnt-ash · `6734` chislehurst · `7074` hayes · `7414` mottingham · `7754` orpington · `8094` penge · `10728` petts-wood · `10796` shortlands · `10864` southborough · `11204` st-paul-s-cray · `11408` west-wickham

`bromley/bromley-central-library/whats-on` yields **no panel ID** — handle as a null case.

**Operational constraint:** the window is a **rolling ~8 days** (observed 11-18 Aug 2026). Poll at least weekly or you will lose sessions. No JSON API exists (`/api/library/events` returns the HTML catch-all); the turbo-frame HTML *is* the interface.

Bromley's 14 is genuinely sparse — Shortlands, Southborough, Burnt Ash, Hayes and Orpington returned zero under-5 hits. Re-sample in term time before assuming a parser bug.

### 2B.2 Lewisham + Tower Hamlets — Solus "Library Magic" (`*.events.mylibrary.digital`)

Vendor is **Solus** (sol.us). This is the find that **rescues Lewisham**, which contributes nothing via its council site.

```
https://lewisham.events.mylibrary.digital/rss  → HTTP 200, application/rss+xml, 336,239 B, 299 items  [re-verified]
https://idea.events.mylibrary.digital/rss      → HTTP 200, application/rss+xml, 115,656 B, 133 items
```

**CRITICAL OPERATIONAL GOTCHA:** the HTML pages on these hosts sit behind a **Cloudflare managed challenge** (plain `curl` gets `<title>Just a moment...</title>`, HTTP 403), **but `/rss` is exempt and returns clean XML**. The per-event `/ics?id=` endpoint **is** challenged on Lewisham and Idea Store. **Never build a server-side fallback that scrapes the HTML or `.ics` on these hosts — it will 403.** RSS is the only reliable path.

Real item:
```xml
<item>
  <title>Under 5s Rhymes and Stories</title>
  <link>https://lewisham.events.mylibrary.digital/event?id=338367</link>
  <description><p><strong>Date/Time:</strong> Wed, 12 Aug 2026, 10:30am - 11:00am</p>
  <p>Join us at Catford Library every Wednesday morning at 10.30 am for a session of
  songs, rhymes and stories for 5 year olds and under.</p></description>
  <pubDate>Tue, 11 Aug 2026 20:35:01 +0100</pubDate>
</item>
```

Lewisham: 299 items, ~59-103 under-5 matches depending on keyword breadth, 73 with parseable dates spanning 2026-08-12 → 2026-09-11 → **median 16 under-5 sessions/week**. Top titles: Story and Song Time (9), Baby Bounce (9), Lego Club (9), Under 5s Rhymes and Stories (5), Under 5s Storytime (5), Under 5s Songtime (8), Baby Bounce & Storytime (4), Hartbeeps (4).

**Parsing notes:** date/time exists **only as text inside `<description>`**, prefixed `<strong>Date/Time:</strong>`, format `Wed, 12 Aug 2026, 10:30am - 11:00am`. **Venue is not a field** — it appears in prose ("at Catford Library") in only 51/299 descriptions. You need a venue-name matcher against a branch list. Unlike Better, this feed runs ~1 month ahead.

**Idea Store caveat — a real coverage gap.** The Tower Hamlets feed works, but its 133 items contain **no rhyme time, storytime or baby bounce whatsoever**: Lego Club (25), Art Club (24), Get Online (19), Prime Time (18), Conversation Club (13), Debt Together (9), Refugee Group (5), Citizens Advice (5). Idea Store's early-years sessions are drop-in and are simply not published in machine-readable form anywhere (`ideastore.co.uk/whats-on` is a JS app; `/our-services/children-and-families` has no timetable). **Tower Hamlets under-5s needs a partnership or manual-entry route.** Partial mitigation: the Tower Hamlets *council* RSS (§2.1) does carry some Idea Store under-5 sessions such as `Wee Movers`.

**Bonus — same parser unlocks adjacent boroughs** if the catchment ever widens: `sutton` (471KB / 349 items), `merton` (307KB), `ealing` (131KB), `croydon` (122KB) all return 200. `hackney`, `brent`, `lbbd` are empty shells.

### 2B.3 Southwark — events are on the council CMS, not the LMS

`southwark.spydus.co.uk` is **confirmed Spydus (Civica)** — the only one of the six on Spydus (`{greenwich,lewisham,bromley,bexley,towerhamlets}.spydus.co.uk` all NXDOMAIN). But **the Spydus events module is not in use**: all four candidate paths (`/MSGTRN/WPAC/EVENTS`, `/ENQ/WPAC/EVENTENQ`, etc.) return byte-identical 74,561-byte OPAC-home responses. No `.ics` anywhere.

Events live on a plain council page instead:
```
https://www.southwark.gov.uk/culture-and-sport/libraries/library-activities-babies-and-toddlers/story-music-and-play-sessions
```
→ **~26 under-5 sessions/week** across Blue Anchor, Brandon, Camberwell, Canada Water, Grove Vale, John Harvard, Peckham, Una Marson, Nunhead and Walworth libraries, plus Albrighton Community Centre and Ann Bernadt Children and Family Centre. Types: Bookstart, Rhymetime, Baby and toddler, Toddler Time. Most marked "term time"; none require booking.

This is a **static weekly recurrence table, not a dated feed** — model as recurrence rules with term-time suppression. Note this **overlaps with Southwark Presents** (§2.2), which publishes the same rhyme-time network as dated events; prefer Southwark Presents as the primary and use this page to fill gaps.

### 2B.4 Bexley — Axiell Arena, no dated feed

Confirmed **Axiell Arena** on the shared "Your London Library" tenancy (theme `arenanovatheme_WAR_arenanovatheme`; calendar portlet `...CalendarEventListPortlet` present). Bexley is the only one of the six on this instance.

Working pages: `/web/bexley/regular-events-for-children` (105KB — Toddlertime, Story Time, Lego Club, Stay and Play, "rhymes for 0 to 3 year olds"), `/web/bexley/whats-on` (82KB), `/web/bexley/toddlertime`, `/web/bexley/lego-club`.

**NOT FOUND:** `/events`, `/calendar`, `/rss` all 404; no `.ics` in markup. Bexley is **day-of-week + time text on static pages** — scrapeable into recurrence rules, but no dated feed and no volume signal.

### 2B.5 Ruled out by direct test

- **Eventbrite** organiser pages — all six 404 (`southwark-libraries`, `idea-store`, `lewisham-libraries`, `greenwich-libraries`, `bromley-libraries`, `bexley-libraries`). No library service in scope uses Eventbrite.
- **Bookwhen** — `bookwhen.com/{southwarklibraries,ideastore,lewishamlibraries,greenwichlibraries}.ics` all 404.
- **Springshare LibCal** — every candidate subdomain NXDOMAIN. **No London borough in scope uses LibCal.**
- **Council vanity domains** — `events.{lewisham,ideastore,towerhamlets,royalgreenwich,bromley,bexley}.gov.uk` all NXDOMAIN.

> **Seasonality warning on all library figures:** measured 11 August, mid-summer-holiday. Greenwich's ~84/week includes holiday-programme extras; Southwark's page marks most sessions "term time". The two move in *opposite* directions in September. Re-sample in term time before treating any figure as steady-state.

---

## 2C. OpenActive — detail (the primary recommendation)

**What it is:** the UK open data standard for physical-activity sessions, funded by Sport England. Publishers expose **RPDE** (Realtime Paged Data Exchange) JSON feeds. Everything is **CC-BY 4.0**, **no API key, no registration, no auth**.

### 2C.1 Catalogue structure

Root (verified, 886 bytes): `https://openactive.io/data-catalogs/data-catalog-collection.jsonld`
```json
"hasPart": [
  "https://opendata.leisurecloud.live/api/datacatalog",                        // Gladstone MRM — 32 datasets
  "https://openactivedatacatalog.legendonlineservices.co.uk/api/DataCatalog",  // Legend — 31
  "https://openactive.io/data-catalogs/singular.jsonld",                       // standalone — 23
  "https://app.bookteq.com/api/openactive/catalogue"                           // Bookteq — 88
]
```
**174 dataset sites total.** Each is an HTML page with embedded `<script type="application/ld+json">` carrying a `distribution[]` array of feed `contentUrl`s.

### 2C.2 The three feeds that matter — all independently verified returning live data

| Publisher | ScheduledSession feed | SessionSeries feed |
|---|---|---|
| **Better / GLL** | `https://better-admin.org.uk/api/openactive/better/scheduled-sessions` | `https://better-admin.org.uk/api/openactive/better/session-series` |
| **Southwark Council** | `https://opendata.leisurecloud.live/api/feeds/SouthwarkCouncil-live-scheduled-sessions` | `.../SouthwarkCouncil-live-session-series` |
| **Tower Hamlets Council** | `https://opendata.leisurecloud.live/api/feeds/TowerHamletsCouncil-live-scheduled-sessions` | `.../TowerHamletsCouncil-live-session-series` |

(Each publisher also exposes `-course-instance`, `-facility-uses`, `-slots`.)

Verified response shape — 500 items/page, CC-BY licence declared inline:
```
better-admin.org.uk/.../scheduled-sessions   → HTTP 200, application/json, 680,122 B, items: 500
SouthwarkCouncil-live-scheduled-sessions     → HTTP 200, application/json,  54,798 B, items: 500
TowerHamletsCouncil-live-scheduled-sessions  → HTTP 200, application/json, 116,009 B, items: 500
SouthwarkCouncil-live-session-series         → HTTP 200, application/json, 1,416,275 B, items: 500
```

### 2C.3 Measured borough coverage (venues verified via postcodes.io)

| Venue | Postcode | Borough | Sessions/next 7 days |
|---|---|---|---|
| The Eltham Centre | SE9 1HQ | **Greenwich** | 226 |
| Crystal Palace National Sports Centre | SE19 2BB | **Bromley** | 151 |
| Bellingham Leisure & Lifestyle Centre | SE6 3BT | **Lewisham** | 124 |
| Forest Hill Pools | SE23 3HZ | **Lewisham** | 117 |
| The Plumstead Centre | SE18 1JL | **Greenwich** | 110 |
| Charlton Lido and Lifestyle Club | SE18 4LX | **Greenwich** | 106 |
| Sutcliffe Park Sports Centre | SE9 5LW | **Greenwich** | 92 |
| Glass Mill Leisure Centre | SE13 7FT | **Lewisham** | 87 |
| Thamesmere Leisure Centre | SE28 8RE | **Greenwich** | 85 |
| The Greenwich Centre | SE10 9GB | **Greenwich** | 33 |
| Better Gym Sidcup | DA14 6EH | **Bexley** | low |

Plus Southwark's own: Peckham Pulse 516, Canada Water 462, Camberwell 460, The Castle Centre 408, Dulwich 337, Surrey Docks 290. And Tower Hamlets': Mile End Park 706, Whitechapel 339, Poplar Baths 310, Tiller 264, John Orwell 110.

**Critically, this covers Lewisham** — the borough with no council event data at all.

### 2C.4 Under-5 yield (~810/week)

| Publisher | Under-5 session types | Per week |
|---|---|---|
| Better/GLL | Soft Play 386, Toddler Splash 67, Toddlers' World 46, Family Fun Swim 31, Toddlers World Under 2's 3, SEND Soft Play 3, Inclusive Swim 1 | **542** |
| Tower Hamlets | Soft Play Session 108, Parent & Child Free Swim 27, Family Fun Swim 6, Soft & Wet Play Under 2's 2, Swim & Play 2, Sen Family Swim 1 | **146** |
| Southwark | Family Swim 40, Soft Play 0-8yr 51, Family Fun Swim 8, Family Disability Swim 8, U5 Fun Swim 8, Move Games Family Swim 5 | **~125** |

### 2C.5 How to consume RPDE — the non-obvious parts

**Page shape:** `{next, items[], license}`; each item is `{state, kind, id, modified, data}`, `state ∈ {updated, deleted}` (`data` omitted on delete).

**THE FEED IS ORDERED BY MODIFICATION TIME, NOT START DATE.** The first item pulled from Better had `startDate: 2023-02-11`. You must page to the end and filter on `startDate` yourself. Server ordering is literally:
```sql
WHERE (modified = @afterTimestamp AND id > @afterId) OR (modified > @afterTimestamp)
ORDER BY modified, id
```

**Always follow the opaque `next` URL** — never construct `afterTimestamp`/`afterId` yourself.

**Last-page detection (empirically confirmed):** both conditions must hold — `items` is empty **AND** `next` equals the current URL.

**Incremental harvest:** persist the final `next` URL per feed. Next run, GET it → only items modified since. Upsert on `updated`, delete on `deleted`. Items never vanish without first passing through `deleted`, so a consumer honouring delete state never accumulates stale rows. Poll every 15-60 min; a quiescent poll is one cheap request returning `items: []`.

**THE TWO-FEED JOIN IS MANDATORY.** `ScheduledSession.superEvent` → `SessionSeries.@id`.
- **SessionSeries** holds `name`, `description`, `location{address, geo}`, `offers`, `ageRestriction`.
- **ScheduledSession** holds only `startDate`/`endDate`/`capacity`.

Harvest SessionSeries **first**, or you get dated rows with no title and no venue.

Real SessionSeries payload (note the geo + postcode, exactly what the postcode-based location model needs):
```json
{"@type":"SessionSeries","name":"Core Conditioning",
 "offers":[{"price":9.85,"priceCurrency":"GBP",
            "ageRestriction":{"@type":"QuantitativeValue","minValue":16,"maxValue":110}}],
 "location":{"@type":"Place","name":"Herne Hill Lifestyle Centre",
   "address":{"postalCode":"SE24 0AG","streetAddress":"Ferndene Rd","addressLocality":"Brixton"},
   "geo":{"latitude":51.460666,"longitude":-0.09653}}}
```

**Classify under-5s from text, not from `activity[]`.** The three publishers that matter do **not** populate the OpenActive activity taxonomy. High-yield name strings: `Soft Play`, `Toddler Splash`, `Toddlers' World`, `Family Swim`, `Family Fun Swim`, `Parent & Child Free Swim`, `U5 Fun Swim`, `Swim & Play`, `Under 2`. Also mine `offers[].name` — `"1 Adult and 1 Under 3"`, `"1 Adult and 2 Under 3's"` — and `offers[].ageRestriction.minValue`. **Normalise names**: `Soft Play Session 0-8 Yr` and `0-8yr` are distinct series in Southwark.

**Rate limits & cost.** Better publishes `x-ratelimit-limit: 600` (per hour; a full harvest used ~158). Gladstone publishes none and served 59 pages in 5 s. RPDE spec guidance: on **HTTP 503**, retry after a random 60-120 min interval. Measured cold-harvest cost: Southwark 59 pages/5 s, Tower Hamlets 57 pages/4 s, Better SessionSeries 11 pages/16 s, Better ScheduledSessions 600+ pages/~8 min/430 MB. **Total ongoing cost: £0.**

**Licence obligation:** CC-BY 4.0 is declared in every response and is **required**. Budget a per-source attribution line ("Activity data from Better/GLL, CC BY 4.0").

**Tooling:** the reference consumer is `openactive-broker-microservice` (in `openactive/openactive-test-suite`), but it is built for publisher conformance testing, not production ingest. For three feeds, ~60 lines of your own paging loop is the right call.

### 2C.6 Geocoding — postcodes.io solves borough assignment outright

```
GET  https://api.postcodes.io/postcodes/SE10%209GB
POST https://api.postcodes.io/postcodes           {"postcodes":[...]}   ← bulk, sub-second for 25
GET  https://api.postcodes.io/postcodes?lon=-0.070885&lat=51.474074&limit=1   ← reverse
```
Returns `admin_district` (e.g. `"Greenwich"`) plus ONS codes. Free, no key. Since every OpenActive venue carries `postalCode`, this gives authoritative borough assignment with no guessing.

**Caveat found empirically:** `SE24 0AG` and `SE16 7HP` returned NOT FOUND — some operator-supplied postcodes are wrong or retired. Fall back to the lat/long reverse lookup, which every one of these records also carries.

### 2C.7 Open data portals — skip them for events

**London Datastore has a serious gotcha:** `https://data.london.gov.uk/api/action/package_search` returns HTTP 200, but **the `q` and `rows` parameters are silently ignored** — every query (`q=events`, `q=children`, `q=libraries`) returns the identical 1,297-record, **10.3 MB** payload. Do not write query-driven code against it; download the catalogue once and filter client-side. Results nest at `result.result` (not the CKAN-standard `result.results`); `organization_list` returns HTTP 410.

**There are no event datasets and no children's-centre datasets for our boroughs** on either portal. `data.gov.uk` search works properly but per-borough results are parking zones and cycle parking only. Children's-centre datasets exist nationally — for Lincolnshire, Lambeth, North Somerset, York — **none of our six**.

Worth taking as **venue reference data** only:
- GLA Cultural Infrastructure Map 2025 — `https://data.london.gov.uk/dataset/2rj5o` (updated 2026-06-22)
- CIM 2023 per-category CSVs incl. Libraries and Community centres — `https://data.london.gov.uk/dataset/23697`

---

## 2D. Cultural venues — detail

### 2D.1 Spektrix API v3 is public and unauthenticated — one adapter, seven venues

Seven London venues run Spektrix ticketing, and its **read API needs no API key, no auth header, no cookies**:
```
https://system.spektrix.com/{clientName}/api/v3/events
https://system.spektrix.com/{clientName}/api/v3/instances?startFrom=YYYY-MM-DD&startTo=YYYY-MM-DD
https://system.spektrix.com/{clientName}/api/v3/venues
```

**Client names are discoverable** by grepping the venue's own HTML for:
```html
<spektrix-login-status custom-domain="tickets.woolwich.works" client-name="woolwichworks">
```

**Independently re-verified, all HTTP 200:**

| Client | Venue | Borough | Events | Bytes |
|---|---|---|---|---|
| `blackheathhalls` | Blackheath Halls | Greenwich | **463** | 863,739 |
| `greenwichtheatre` | Greenwich Theatre | Greenwich | **138** | 179,783 |
| `polka` | Polka Theatre | Wimbledon | **75** | 84,877 |
| `thealbany` | The Albany, Deptford | **Lewisham** | **51** | 61,472 |
| `woolwichworks` | Woolwich Works | Greenwich | **46** | 87,366 |
| `unicorntheatre` | Unicorn Theatre | Southwark | **22** | 30,416 |
| `littleangeltheatre` | Little Angel Theatre | Islington | — | — |

Upcoming *instances* (performances) from 2026-08-11: Polka 1,132 · Little Angel 463 · Unicorn 395 · Greenwich Theatre 214 · The Albany 201 · Woolwich Works 107 · Blackheath Halls 88. **~2,600 total.**

Real payload (The Albany):
```json
{"name":"Albany AGM 2026","description":"Join us to celebrate the Albany's achievements...",
 "duration":210,"instanceDates":"20 May-20 May","id":"346937AGVMJCDNTBQNPMKJDJBNRGHDHKL",
 "firstInstanceDateTime":"2026-05-20T18:00:00","firstInstanceDateTimeUtc":"2026-05-20T17:00:00Z",
 "attribute_FreeEvent":true,"attribute_Grouping":"Talk","attribute_Venue":"the Albany",
 "attribute_AgeGuidance":"","attribute_ConfirmationText":"...The Albany, Douglas Way, London, SE8 4AG."}
```
`/instances` gives one row per performance with `start`, `startUtc`, `cancelled`, `isOnSale`, `event.id` (join key), plus accessibility attributes (`attribute_AutismFriendly`, `attribute_SensoryAdapted`, `attribute_Relaxed`, `attribute_BSL`, `attribute_TouchTour`).

**Two implementation warnings:**
- `/instances` returns **one row per performance**, not per event. Good for a "sessions this week" count, but **de-duplicate by `event.id` for listing pages** or you will show *There's a Tiger in the Garden* fourteen times.
- Ruled out as non-Spektrix (all 404): `trinitylaban`, `dulwichpicturegallery`, `charltonhouse`, `horniman`, `ornc`, `theatrepeckham`, `unicorn`, `albany`, `woolwich`.

### 2D.2 Polka `calendar-events` — the most precise under-5 filter found anywhere

```
https://polkatheatre.com/wp-json/polka/v1/calendar-events
→ HTTP 200, 144,678 bytes, 334 performance instances, 2026-08-04 → 2027-03-13
```
**Verified: 197 of 334 instances are under-5 applicable.** Uniquely, it publishes an **explicit per-year age array**:
```json
{"title":"There's a Tiger in the Garden","start":"2026-08-05T10:30:00",
 "extendedProps":{"time":"10.30am","status":"Available","statusClass":"in-stock",
   "permalink":"https://polkatheatre.com/event/theres-a-tiger-in-the-garden/",
   "venue":["Y C Chan Theatre"],"type":["Show"],
   "ageRange":["3-7 yrs"],"agesApplicable":["3","4","5","6","7"]}}
```
Filter `agesApplicable ∩ {0,1,2,3,4}`. Verified age-range distribution includes `0-4 yrs` (16), `1-4 yrs` (12), `6-18 mths` (22), `6 mths-3 yrs` (10), `12 mths-4 yrs` (10), `0-5 yrs` (10). Take this **in addition to** Spektrix — it also carries live `status`/`statusClass` stock information.

### 2D.3 London Wildlife Trust — the only true Drupal JSON:API found

```
https://www.wildlondon.org.uk/jsonapi            → HTTP 200, application/vnd.api+json, 126 resource types
https://www.wildlondon.org.uk/jsonapi/node/event → verified "meta":{"count":1879}
```
Full JSON:API filtering, sorting and sparse fieldsets confirmed working:
```
/jsonapi/node/event
  ?filter[date][condition][path]=field_event_date.value
  &filter[date][condition][operator]=%3E%3D
  &filter[date][condition][value]=2026-08-11
  &sort=field_event_date.value&page[limit]=50
  &fields[node--event]=title,field_event_date,field_event_summary,field_event_suitable_for,path
```
→ 46 upcoming. SE London hits: *Urban Nature Club at Sydenham Hill Wood* (Southwark/Lewisham border), *Urban Nature Club at Centre for Wildlife Gardening* (Peckham).

**Field richness is outstanding for a parent-facing site:** `field_event_suitable_for:["families"]`, **`field_event_baby_changing:true`**, `field_event_toilets`, `field_event_picnic_area`, `field_event_wheelchair`, `field_event_capacity`, `field_event_price_donation`, `field_event_booking_url`, `field_event_time_value:{"from":56700,"to":61200}` (seconds since midnight). Pagination via `page[offset]`/`page[limit]` + `links.next`. No auth.

Because this is the **shared Wildlife Trusts Drupal platform**, the same `/jsonapi/node/event` pattern is very likely to work on the other 45 county trusts (LIKELY, untested).

### 2D.4 English Heritage — best national feed (Eltham Palace + Ranger's House are in Greenwich)

Optimizely/Episerver with a path-segment JSON API found inline in `/visit/whats-on/`:
```
/api/eventsearch/{page}/{pageSize}/{sort}/{itemId}/{location}/{type}/{dateFrom}/{dateTo}/none/{lat}/{lng}
```
`none`/`all` are the literal "unset" tokens; dates are `DD-MM-YYYY`. **No auth, no nonce.** Verified:
- `…/1/200/datetime/0/all/none/none/none/none/0/0` → **`"total":149`**
- `…/1/50/datetime/0/london/none/none/none/none/0/0` → `"total":89`
- **Geo radius works:** `…/1/200/datetime/0/my%20location/none/none/none/none/51.4934/0.0098` → 89 events **sorted by distance**: `1.5mi Ranger's House`, `3.6mi Eltham Palace`, `9.2mi Kenwood`
- Date window: `…/11-08-2026/30-09-2026/…` → `"total":125`

Every row carries `latitude`/`longitude`, `region`, `county`, `TownOrCity`, `startDate`/`endDate` and `eventDateDescription` (e.g. `"Every first Friday of each month"`).

### 2D.5 Horniman Museum — no REST event type; use the admin-ajax route

`/wp-json/` **404s** (pretty-permalink REST routing broken) but `https://www.horniman.ac.uk/?rest_route=/` returns 310 routes. **The Events Calendar is not installed**, and `wp/v2` has no `event` type. Detail pages have only Yoast `WebPage`/`BreadcrumbList` JSON-LD — **zero `"@type":"Event"`**.

The working route was reverse-engineered from the theme bundle (`horniman-theme/assets/js/main.min.js`, 996 KB) which contains `p.get(HNM.ajaxurl,{params:{action:"getEvents",page:1,...}})`:
```
GET https://www.horniman.ac.uk/wp-admin/admin-ajax.php?action=getEvents&page=1
→ HTTP 200, text/html, 22,821 bytes. No nonce required.
```
Paginate until `data-next-page` disappears: page 1 = 11, page 2 = 9, page 3 = 6 → **26 events**. Cards expose `.meta-categories` ("Free, drop in"), `h3`, `.date` ("13 August 2026"), `.time` ("11am - 3pm"), `.excerpt`.

**Do not pass filters** — `filters[date]=all`, `filters[dateRange]` and `template=simple` all return **HTTP 500**. Paginate and filter client-side.

Bonus: public sitemaps expose the whole taxonomy — `event-sitemap.xml` (**215 event URLs**), `audience-sitemap.xml` (incl. `children-0-11`, `children-3-7`, `children-4-6`), `age-sitemap.xml` (incl. `nursery-aged-3`, `reception`).

### 2D.6 Royal Museums Greenwich — one request returns everything

`/jsonapi`, `/graphql`, `/api` all 404. `rss.xml` is 200 (540 KB) but contains **only 10 blog stories, no events**.

**Best route: a single GET of `https://www.rmg.co.uk/whats-on`** (185,264 bytes) returns **all 40 events on one page** — `?page=0..3` return byte-identical output and the filter checkboxes are **client-side only**. One request = the full dataset.

Markup is unambiguous: `.event-teaser__title`, `.event-teaser__description`, `.event-teaser__times` ("Second Saturday of the month | 11am-12.30pm"), `.event-teaser__price` ("Free | Pre-booking required"), `.event-teaser__lozenge` (venue). Locations span Cutty Sark, National Maritime Museum, Queen's House, Royal Observatory. Under-5 example found: *SENsory Sailors*.

### 2D.7 London Museum Docklands — Tower Hamlets under-5 content

Wagtail + htmx; all Wagtail API guesses 404 (`/api/v2/pages/`, `/api/v2/`, `/api/pages/`). Working route `https://www.londonmuseum.org.uk/whats-on/?p=N` (htmx uses `hx-get="?p=2"`), 19 event links/page, confirmed to `?p=3`.

Under-5 content is exactly on target: `/whats-on/mini-mondays-seaside-toddler-sessions/`, `/whats-on/mini-mondays-seaside-baby-session/`, `/whats-on/mudlarks-family-gallery/`, `/whats-on/booklove-storytelling-corner/`. Docklands is **in Tower Hamlets** — this partially offsets the Idea Store gap.

### 2D.8 Greenwich Theatre — two routes, join them

`https://www.greenwichtheatre.org.uk/wp-json/wp/v2/events?per_page=100` → HTTP 200, `x-wp-total: 52`. ACF payload:
```json
"acf":{"spektrix_id":"","short_descr":"This October children's charity, Radio Lollipop…",
       "dates":"2 October-2 October","attribute_AgeRecommendation":"3+",
       "attribute_Location":"Main House","RunningTime":"140 minutes"}
```
`acf.dates` is a human string — **join to Spektrix on `acf.spektrix_id`** for real datetimes, and take `attribute_AgeRecommendation` from here.

### 2D.9 Hard blocks — do not attempt

| Venue | Block |
|---|---|
| **National Trust** | Every URL returns an identical 118,411-byte **Radware Bot Manager** page (`<title>Radware Page</title>`). No content at all. |
| **Historic Royal Palaces** (Tower of London) | HTTP 403 Cloudflare `Just a moment...` on every path incl. `/sitemap.xml` |
| **Dulwich Picture Gallery** | HTTP 403 Cloudflare on `/`, `/whats-on/`, `/sitemap.xml`, `/wp-json/` |
| **Southbank Centre** | `/wp-json/` is 200 and lists a private `v1` namespace, but **every `/wp-json/v1/*` request is Cloudflare-challenged (403)** with and without browser headers |
| `charltonhouse.org` | **DNS failure** — the real site is `greenwichheritage.org` (Royal Greenwich Heritage Trust) |
| `capitadiscovery.co.uk` | Domain expired, now redirects to a payday-loan site |

No amount of header spoofing got through these four in testing. Fall back to manual curation or a partnership email.

---

## 2E. Family Hubs / Local Offer / FIS — detail

This is the **purest** under-5 tier: stay-and-play, baby feeding drop-ins, weigh-in clinics, midwife appointments, bumps-to-babies. Nothing needs filtering out.

### 2E.1 VERDICT ON OPEN REFERRAL UK: live, excellent — and **zero London adoption**

The brief called this a potential jackpot. It is not, for us.

The standard is real and actively maintained (`oruk-validator` last pushed 2026-08-06). Of 11 listed publishers, 8 return data:

| Publisher | Endpoint | Services |
|---|---|---|
| Shropshire | `shropshire.openplace.directory/o/OpenReferralService/v3/services` | 5,298 |
| Buckinghamshire | `api.familyinfo.buckinghamshire.gov.uk/api/v1/services` | 4,181 |
| CQC (Porism) | `api.porism.com/ServiceDirectoryServiceCQC/services` | 2,999 (care homes — irrelevant) |
| Dorset aggregator | `dorset.localplacedirectory.org.uk/aggregator/services` | 2,119 |
| Southampton | `directory.southampton.gov.uk/api/services` | 1,199 |
| Bristol | `bristol.openplace.directory/o/OpenReferralService/v3/services` | 874 |
| North Lincolnshire | `northlincs.openplace.directory/…/services` | 841 |
| Open Sessions | `opensessions.io/api/rpde/OpenReferralFeed/services` | 50 |
| Hull | `lgaapi.connecttosupport.org/services` | **0 — empty feed** |
| Cumbria, Pennine Lancs | — | **DNS failure** |

Buckinghamshire proves the standard carries exactly what this project needs:
```json
{"name": "My First Playtime at Burnham Family Hub",
 "regular_schedules": [{"weekday":"Thursday","opens_at":"09:30","closes_at":"10:30",
   "dtstart":"2026-09-10T00:00:00.000Z","freq":"week","interval":1,"byday":"TH"}]}
```
…plus `age_band_under_2` / `age_band_3_4` fields and working `min_age`/`max_age` filtering.

**But all six target boroughs plus ~25 other London boroughs were tested across three host patterns** (`<borough>.openplace.directory/o/OpenReferralService/v3/services`, `directory.<borough>.gov.uk/api/services`, `api.familyinfo.<borough>.gov.uk/api/v1/services`) — **not a single JSON 200.** No Connect to Support or `familyservicesdirectory.org.uk` tenants either.

**One strategic lead worth acting on:** Greenwich's directory runs LocalGov Drupal with the **`localgov_outpost`** module, importing from FutureGov's **Outpost** platform — the same product family behind Buckinghamshire's ORUK feed, with an identical `content`/`updated_at` JSON shape. **Greenwich's data already exists in an ORUK-shaped upstream API; it is simply not publicly exposed.** That makes Greenwich by far the most likely borough to light up ORUK, and a specific, credible ask to put to the council.

**The DfE national aggregator is dead.** `find-support-for-your-family.education.gov.uk` (and its `test.`/`dev.` environments) return **NXDOMAIN**; the `fh-service-directory-api`/`-ui` repos were **archived in August 2024**. Do not build on it.

### 2E.2 Tower Hamlets Best Start Family Hubs — the cleanest JSON API in the entire study

An open, unauthenticated .NET/Azure API. **Independently re-verified:**
```
GET  https://www.thfamilyhubs.co.uk/api/health
→ {"status":"healthy","service":"apollo-api","version":"1823-ae97d69","environment":"live"}

POST https://www.thfamilyhubs.co.uk/api/GetEventSchedules
     Content-Type: application/json
     {"startDate":"2026-08-11","endDate":"2026-09-11"}
→ HTTP 200 | application/json | 2,012,928 bytes | 566 records | 49 fields each
→ 421 tagged "Best Start in Life (between 0 and 5 years old)"
```
Fields include `EventCategory`, `EventName`, `EventSubtitle`, `OrganiserName`, `PartnerName`, `ScheduleName`, `StartDate`, `EndDate`, `VenueId`, `VenueName`, `VenueLocation`, `VenueLatitude`/`VenueLongitude`, capacity and booking flags. **31 geocoded venues.** No key, no cookie, no rate limit encountered.

Top session types: Sensory Room 74, Family Stay and Play 34, Art Club 32, Sensory Play for Toddlers 30, Baby Feeding drop-in 26, Active Stay and Play 24.

Sibling endpoints also live: `/api/GetEventSummaries`, `/api/GetEventDetails`, `/api/GetInitialFacets`.

**This single endpoint largely solves Tower Hamlets' under-5 problem** — the borough that looked weakest after the library leg (Idea Store has no rhyme times) turns out to have the best API. Complement with the four locality **HTML tables** (17 tables / 267 rows, zero PDFs) covering midwife clinics and weigh-ins.

### 2E.3 Greenwich Community Directory — best HTML source; `royalgreenwich.gov.uk/fish` is dead

`royalgreenwich.gov.uk/fish` **404s**. The real directory is **`greenwichcommunitydirectory.org.uk`** (LocalGov Drupal 10 + `localgov_outpost`).

No JSON (`/jsonapi` 404; `?_format=json` → 406). But the HTML is excellent and the query params are deterministic. **Verified:**
```
https://greenwichcommunitydirectory.org.uk/sitemap.xml            → 1,346 service URLs   [re-verified]
/services                                                          → 1,339 results
/services?event_from=2026-08-11&event_to=2026-08-11                → 35 results (today)
/services?event_from=2026-08-11&event_to=2026-08-18                → 113 results (7 days)
```
Of the 1,346 sitemap URLs, **380 match under-5 keywords** (nursery 134, childrens-centre 66, childminder 56, baby 48, stay-and-play 44, rhyme 20).

A real record (`/services/summer-rhyme-time-slade-library`) carries everything:
> Suitable for **Ages 1 to 5** · **Every six weeks on Friday starting 24 July 2026 until 28 August 2026: 10:30am to 11:00am** · Cost **Free** · No booking required · **Slade Children's Centre, Erindale Road, Plumstead SE18 2QQ** · Access needs: Baby changing, Bus stop nearby

Records also list **10 explicit upcoming dates** each and carry lat/lon in `drupalSettings`.

**COMPLIANCE — important:** `robots.txt` disallows `/services?f*` (facet URLs) but permits the sitemap and canonical `/services/<slug>` pages. **Ingest via sitemap → record, not facet enumeration.** `lastmod` in the sitemap gives you free incremental sync.

Plus **GLL/Better children's-centre timetables**, counted directly: Storkway 29 + Vista Field 20 + Waterways 11 + Eltham 5 + Mulberry Park 4 = **69 sessions/week**, including midwife clinics, weigh-ins and Bumps-to-Babies. Note GLL children's centres exist for **Greenwich only** — Lewisham/Southwark/Bromley/Bexley/TH all 404.

### 2E.4 Lewisham — a second JSON API, but the events are in the HTML

```
POST https://lewisham.gov.uk/lew-api/search/list      (multipart form, field "searchQuery")
→ HTTP 200 | application/json | 418,597 bytes | totalCount: 129 | 71 fields/record
```
Setting `directoryType:[]` returns **4,064** records across all directories.

**Caveat worth heeding:** despite being a clean API, `lewDirectoryAgeRange` is **null on 112 of 129 records** and only **1** is tagged "Children 0-5 years". Treat this as a thin *organisation* directory, not an age-filtered event feed.

The real event value is **`lewishamfamilyhubs.org.uk`**, pre-banded by age: `/events/under-6-months`, `/events/up-to-18-months`, `/events/birth-to-5-years`. Verified dated occurrences:
> Rhythm and Rhyme — 12/08/2026 10:00-11:00, Deptford Family Hub (Clyde Nursery School), 14 places · 12/08/2026 10:00-11:00, Bellingham Family Hub, 15 places

24 event types across 17 venues. Filtering requires an ASP.NET `__VIEWSTATE` round-trip. **Together with the Solus library RSS and OpenActive, this fully rescues Lewisham** from the council's zero-event position.

### 2E.5 Southwark — good directory, but the timetables are PDFs on third-party sites

`southwark.gov.uk/localoffer` **404s**; `localoffer.southwark.gov.uk` is ~10 editorial pages with no directory and no API.

The usable directory is the Drupal FID — pagination verified directly (pages 0-26 return 10/10/9/9 links, page 27 returns 0 → **267 entries**):
```
https://www.southwark.gov.uk/children-young-people-and-families/family-information-directory?page=0..26
```
Records carry `Age group: 0 to 5 years`, `Target audience: Parents with children under 5`, venue + postcode. All Drupal API surfaces closed.

**The actual timetables sit on four third-party provider sites in three formats:** `br-cc.org.uk` (WordPress REST → 20+ live PDFs, `modified: 2026-08-10` — use `https://br-cc.org.uk/wp-json/wp/v2/pages/6031` for change detection), `1stplace.uk.com` (Squarespace `?format=json` → PDF), `dulwichwood.com` (thin), `pprncfc.com` (**Wix, timetable published as images — needs OCR**). Estimated **60-100 sessions/week**, none of it on council infrastructure. Budget for a PDF pipeline or skip.

### 2E.6 Bromley — no API, but two viable routes

No FIS API. `bromley.mylifeportal.co.uk` redirects away; `bromleylocaloffer.org.uk` NXDOMAIN. `bromleysend.org` is WordPress with an open REST API but **no event or directory post types**.

The council runs a **Jadu directory** — enumerated via sitemap: **2,992 `/directory-record/` URLs**, 28 categories:

| directoryID | Category | Records |
|---|---|---|
| **44** | **Parent and toddler groups** | **49** (verified by A-Z sweep) |
| 42 | Nurseries / pre-schools / creches | 186 |
| 40 | Childminders | 316 |
| 52 | SEND Local Offer services | 170 |

Records carry a usable recurrence field — `/directory-record/7829/lighthouse-toddler-group`:
> Open hours: **9.30am-11.30am Thursdays, Term-time** · Christ Church Hall, Highland Road, **BR1 4AA**

No JSON (`?format=json`/`.json` return HTML). Second route: **GLL Better library timetables** via Turbo-frame POST to `https://www.better.org.uk/library/dynamic_pages/panels/455/timetables/items/borough`, with genuinely useful audience IDs (`11`=0-12mo, `12`=0-18mo, `13`=0-2y, `5`=0-4y, `19`=2-4y).

**Gap:** the six children & family centre timetables are published **only as Issuu flipbooks and Facebook posts** — the council states this explicitly. Best fix is a data request to `bcpadmin@bromley.gov.uk`.

### 2E.7 Bexley — the real gap, and the only robots.txt block in the study

`bexley.gov.uk/localoffer` 404s; the real site is `bexleylocaloffer.uk` (SLA Online / FrontlineData, ASP.NET MVC 5.2). One genuine JSON endpoint works:
```
GET https://bexleylocaloffer.uk/Training/LargeCalendar?date=2026-09-01
→ HTTP 200 | application/json | 42,139 bytes | {"MonthName":"Sep 2026","EventCount":"4",...}
```
…but content is SEND/parent-carer (ages 7-17, autism workshops), **3-5 events/month**.

**Two blockers.** Bexley publishes **no children's centre timetable in any format** — sessions are signposted by phone only. And `bexleylocaloffer.uk/robots.txt` is:
```
User-agent: *
Disallow: /
```
with `Allow: /` granted **only** to Googlebot, Bingbot, Applebot and ia_archiver. **This is the one source in the entire study where crawling is explicitly disallowed — it needs an agreement, not a scraper.**

Routes forward: email `childrenscentres@bexley.gov.uk`, use Bexley's public event-submission form, and investigate the CloudFront-403'd `bexley.gov.uk/libraries/` app via a browser session. **Bexley is a relationship problem, not an engineering one.**

---

## 3. Cross-cutting technical notes for the councils

### 3.1 Measured recurrence yield (the key volume finding)

**Southwark — one detail fetch returns the entire recurrence set.** Fetching 6 sample children/family events and extracting `<time datetime>`:

| Event | Total occurrences on page | Future | Next 3 months |
|---|---|---|---|
| `afterschool-art-craft-club` | 197 | 196 | 26 |
| `bach-baby-family-concert-east-dulwich` | 205 | 204 | 30 |
| `craft-create-celebrate-sound-john-harvard-library` | 11 | 10 | 10 |
| `craft-create-celebrate-sound-una-marson-library` | 11 | 10 | 10 |
| `crafts-summer-vibes-grove-vale-library` | 9 | 8 | 8 |
| `jump-beat-storytime-and-rhymes-blue-anchor-library` | 11 | 10 | 10 |

6 events → 94 occurrences over 3 months = **7.2/week from six events alone**. Extrapolated across the 54-65 "Children and families" events: **~65 children/family occurrences per week from Southwark**, obtained with **54 HTTP requests**. This is the best volume-per-request ratio of any free source tested.

**Greenwich — recurrence rules are stated in plain text on the listing.** Parsing 20 listing pages produced **800 dated occurrence rows** spanning 2026-07-28 → 2026-10-25, of which **88 fall in the next 7 days**. The recurrence vocabulary is small and maps cleanly to RRULE:

| Recurrence string | Count | RRULE equivalent |
|---|---|---|
| `Weekly on Monday, Tuesday, Wednesday, Thursday, Friday, Saturday and Sunday` | 151 | `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU` |
| `Weekly on Tuesday` | 66 | `FREQ=WEEKLY;BYDAY=TU` |
| `Weekly on Sunday` | 66 | `FREQ=WEEKLY;BYDAY=SU` |
| `Monthly on Monday...Sunday` | 60 | `FREQ=MONTHLY;BYDAY=...` |
| `Weekly on Wednesday` | 58 | `FREQ=WEEKLY;BYDAY=WE` |
| `Weekly on Monday, Wednesday, Thursday, Saturday and Sunday` | 55 | `FREQ=WEEKLY;BYDAY=MO,WE,TH,SA,SU` |
| `Weekly on Thursday` | 55 | `FREQ=WEEKLY;BYDAY=TH` |
| `Daily` | 35 | `FREQ=DAILY` |

Only ~8 distinct patterns cover the calendar — a small deterministic parser handles it, no LLM required.



**No JSON-LD anywhere.** Tested detail pages on Greenwich, Bexley, Bromley and Tower Hamlets: `application/ld+json` count = **0** on all four. Do not build a generic schema.org Event extractor expecting councils to feed it.

**Drupal REST is explicitly off.** Both error bodies are worth recording:
- Greenwich/Bexley: `{"message":"No route found for the specified format. Supported formats: html."}`
- Southwark: `{"message":"A route that returns a rendered array as its response only supports the HTML format."}`

There is no point retrying `?_format=json`, `/jsonapi`, or `/api/*` on these sites.

**Soft-404 hazard.** `bexley.gov.uk/events/feed` and `/events/rss.xml` both return **HTTP 200 with HTML**. Any feed-discovery code must assert on `content-type` and on parseability, not on status code alone.

**Occurrence vs. event modelling.** Greenwich and Southwark paginate *occurrences*; Bexley pre-expands recurrences into separate nodes with the date baked into the slug; Tower Hamlets and Bromley list *events*. Your ingestion layer needs an explicit series/occurrence model or you will either duplicate ("Sparkles Babies - 12 August", "- 19 August", ...) or collapse legitimately distinct sessions.

**Scraping legality/politeness.** All six permit crawling of their events paths — the Drupal trio ship stock robots.txt restricting only `/core/`, `/profiles/` and READMEs; Lewisham explicitly allows all; Bromley and Tower Hamlets serve no robots.txt. Weekly harvest at ~1 req/sec is well within courteous use. Content is Crown/council copyright — most councils publish under OGL v3 but **none of the six state a licence on the events pages**, so attribute and link back.

**Total weekly harvest cost (councils):** ~45 (Greenwich) + ~85 (Southwark paged) + ~19 (Bexley) + 1 (Bromley RSS) + 1 + 299 (Tower Hamlets RSS + details) ≈ **450 HTTP requests/week. £0.**

---

## 4. MASTER PRIORITISED LIST — free feeds to wire up first

Ranked across **all** tiers by (under-5 value × volume) ÷ engineering cost. **Total cost of everything below: £0.**

### Wave 1 — pure JSON, no auth, ship this week (~5 days total)

| # | Source | Endpoint | Under-5/wk | Effort |
|---|---|---|---|---|
| **1** | **Tower Hamlets Best Start Family Hubs** | `POST https://www.thfamilyhubs.co.uk/api/GetEventSchedules` | **~95** | 0.5 day |
| **2** | **OpenActive × 3** (Better/GLL, Southwark, Tower Hamlets) | `better-admin.org.uk/api/openactive/better/{session-series,scheduled-sessions}` + `opendata.leisurecloud.live/api/feeds/{SouthwarkCouncil,TowerHamletsCouncil}-live-{session-series,scheduled-sessions}` | **~810** | 2 days |
| **3** | **Spektrix multi-venue adapter** (7 venues) | `https://system.spektrix.com/{polka,thealbany,unicorntheatre,greenwichtheatre,woolwichworks,blackheathhalls,littleangeltheatre}/api/v3/events` + `/instances` | ~2,600 instances total | 1 day |
| **4** | **Polka `calendar-events`** | `https://polkatheatre.com/wp-json/polka/v1/calendar-events` | 197 of 334 instances | 2 hours |
| **5** | **London Wildlife Trust JSON:API** | `https://www.wildlondon.org.uk/jsonapi/node/event` | ~5 | 2 hours |
| **6** | **English Heritage** | `https://www.english-heritage.org.uk/api/eventsearch/1/200/datetime/0/all/none/none/none/none/0/0` | ~10 | 2 hours |
| **7** | **postcodes.io** (infrastructure, not a source) | `https://api.postcodes.io/postcodes` | n/a | 1 hour |

### Wave 2 — structured HTML, high yield (next ~5 days)

| # | Source | Endpoint | Under-5/wk | Notes |
|---|---|---|---|---|
| **8** | **GLL/Better library timetables** (Greenwich + Bromley) | `https://www.better.org.uk/library/dynamic_pages/panels/{panelId}/timetables/items` — 26 panel IDs mapped in §2B.1 | **~96** | Best-structured HTML found; full postcodes |
| **9** | **Greenwich Community Directory** | `https://greenwichcommunitydirectory.org.uk/sitemap.xml` → 1,346 records; `+ /services?event_from=&event_to=` | **~113** | `lastmod` gives free incremental sync |
| **10** | **Lewisham Libraries Solus RSS** | `https://lewisham.events.mylibrary.digital/rss` | **~16** | One URL. **RSS only — HTML/ICS are Cloudflare-blocked** |
| **11** | **Greenwich GLL children's centres** (5) | `https://www.better.org.uk/children-centre/london/greenwich/{...}/timetable` | **~69** | Midwife clinics, weigh-ins, Bumps-to-Babies |
| **12** | **Lewisham Family Hubs** | `https://lewishamfamilyhubs.org.uk/events/birth-to-5-years` | **~40-70** | Pre-banded by age; needs `__VIEWSTATE` round-trip |
| **13** | **Southwark Presents** `event_categories[]=269` | `https://www.southwark.gov.uk/southwark-presents?event_categories%5B%5D=269&page=N` | **~65** | Detail pages expose full recurrence as `<time datetime>` |
| **14** | **Tower Hamlets events RSS** | `.../Events.aspx?Calendar_List_SyndicationType=1` | ~60-90 (all ages) | 299 items; 12/12 detail parse success |
| **15** | **Horniman Museum** | `https://www.horniman.ac.uk/wp-admin/admin-ajax.php?action=getEvents&page=N` | 26 events | **Do not pass filters — they 500** |
| **16** | **Royal Museums Greenwich** | `https://www.rmg.co.uk/whats-on` | 40 events | **One request = the whole dataset** |
| **17** | **London Museum Docklands** | `https://www.londonmuseum.org.uk/whats-on/?p=N` | 19/page | Mini Mondays baby/toddler sessions |

### Wave 3 — lower yield, do if capacity allows

18. Greenwich council events listing (`?page=N`) — 88 occurrences/wk all-ages, but only ~2 under-5
19. Southwark Family Information Directory (267 entries) · 20. Tower Hamlets children's-centre HTML tables (267 rows) · 21. Bromley parent & toddler directory (`directoryID=44`, 49 records) · 22. Charlton House/RGHT sitemap · 23. Bexley Libraries Arena scrape · 24. Bexley council events (18 pages) · 25. Bromley events RSS (trivial, ~5/wk) · 26. Royal Parks views/ajax · 27. Tate `?page=N`

### Do NOT build

| Source | Reason |
|---|---|
| **Lewisham Council events scraper** | No dated calendar exists at all. Covered instead by #10, #12 and OpenActive |
| **National Trust** | Radware bot wall — 100% blocked |
| **Historic Royal Palaces / Dulwich Picture Gallery / Southbank `/v1/*`** | Cloudflare 403 — no header spoofing got through |
| **Bexley Local Offer scraper** | `robots.txt` = `Disallow: /`. **The only explicit crawl prohibition in the study.** Needs an agreement |
| **Open Referral UK integration** | Zero London adoption. Revisit only if Greenwich exposes its Outpost upstream |
| **DfE "Find support for your family"** | NXDOMAIN; repos archived Aug 2024 |
| **London Datastore / data.gov.uk for events** | No relevant event datasets exist. Take venue reference data only |

### Sequencing advice

**Ship #1 first** — a single unauthenticated POST returning 566 well-structured records proves the whole ingestion pipeline end-to-end in half a day, with zero parsing risk. Then #2, which alone clears the "hundreds per week" bar.

**Two modelling decisions to get right before writing ingest code**, because retrofitting them is expensive:

1. **Series vs. occurrence.** Sources disagree fundamentally. Greenwich and Southwark paginate *occurrences*; Bexley pre-expands recurrences into separate nodes with the date in the slug; Tower Hamlets, Bromley and Spektrix list *events* with separate instance data. Without an explicit series/occurrence model you will either duplicate (`Sparkles Babies - 12 August`, `- 19 August`, …) or collapse genuinely distinct sessions. **This is higher leverage than adding another source.**
2. **Deduplication across tiers.** The same session frequently appears in two or three feeds — Southwark library rhyme times are in *both* Southwark Presents and the library page; Better/GLL sessions are in *both* OpenActive and the library timetable endpoint; Greenwich Theatre is in *both* Spektrix and its WP REST API. Plan a match key on (venue postcode + start datetime + normalised title) from day one.

### Three non-obvious traps found by testing

- **Soft-404s.** `bexley.gov.uk/events/feed` returns **HTTP 200 with HTML**. Assert on `content-type` and parseability, never on status code alone.
- **RPDE is ordered by modification time, not start date.** The first Better item pulled had `startDate: 2023-02-11`. You must page to the end and filter on `startDate` yourself.
- **Cloudflare is selective.** On `*.events.mylibrary.digital`, `/rss` is exempt but the HTML and `/ics` are challenged. Never build a "fall back to scraping the page" path for those hosts.

### Seasonality caveat on every number in this document

All counts were measured on **11 August 2026 — school holidays**. Holiday programmes inflate some figures (Greenwich libraries ~84/wk); term-time-only sessions deflate others (most of Southwark's library page is marked "term time"). These move in **opposite** directions in September. **Re-sample against a term-time date such as 2026-09-15 before treating any figure as steady-state.**

---

## 5. Bibliography

All URLs accessed **2026-08-11** and verified by direct `curl` request from this session.

**Borough councils**
1. Royal Borough of Greenwich — events listing. https://www.royalgreenwich.gov.uk/events (accessed 2026-08-11)
2. Royal Borough of Greenwich — robots.txt. https://www.royalgreenwich.gov.uk/robots.txt (accessed 2026-08-11)
3. Royal Borough of Greenwich — site RSS (news, not events). https://www.royalgreenwich.gov.uk/rss.xml (accessed 2026-08-11)
4. Royal Borough of Greenwich — sample event detail. https://www.royalgreenwich.gov.uk/events/circus-works-circus-workshops-kids (accessed 2026-08-11)
5. Lewisham Council — What's on. https://lewisham.gov.uk/events (accessed 2026-08-11)
6. Lewisham Council — sitemap. https://lewisham.gov.uk/sitemap.xml (accessed 2026-08-11)
7. Lewisham Council — robots.txt. https://lewisham.gov.uk/robots.txt (accessed 2026-08-11)
8. Southwark Council — Southwark Presents events catalogue. https://www.southwark.gov.uk/southwark-presents (accessed 2026-08-11)
9. Southwark Council — Children and families filter. https://www.southwark.gov.uk/southwark-presents?event_categories%5B%5D=269 (accessed 2026-08-11)
10. Southwark Council — sample event detail with recurrence markup. https://www.southwark.gov.uk/southwark-presents/storymakers-under-5s-free-class (accessed 2026-08-11)
11. Southwark Council — events signposting page. https://www.southwark.gov.uk/events (accessed 2026-08-11)
12. London Borough of Bromley — events RSS. https://www.bromley.gov.uk/rss/events (accessed 2026-08-11)
13. London Borough of Bromley — events listing. https://www.bromley.gov.uk/events (accessed 2026-08-11)
14. London Borough of Bromley — sample event detail. https://www.bromley.gov.uk/events/event/787/baby-gospel-family-concert-in-crystal-palace-august-2026 (accessed 2026-08-11)
15. Tower Hamlets Council — events RSS 2.0. https://www.towerhamlets.gov.uk/News_events/Events/Events.aspx?Calendar_List_SyndicationType=1 (accessed 2026-08-11)
16. Tower Hamlets Council — events Atom 1.0. https://www.towerhamlets.gov.uk/News_events/Events/Events.aspx?Calendar_List_SyndicationType=2 (accessed 2026-08-11)
17. Tower Hamlets Council — sample event detail. https://www.towerhamlets.gov.uk/News_events/Events/2026/August/Beat-the-Bow.aspx (accessed 2026-08-11)
18. London Borough of Bexley — events listing. https://www.bexley.gov.uk/events (accessed 2026-08-11)
19. London Borough of Bexley — sample event detail. https://www.bexley.gov.uk/events/sparkles-babies-12-august (accessed 2026-08-11)

**Library services**
20. Solus "Library Magic" — Lewisham Libraries events RSS. https://lewisham.events.mylibrary.digital/rss (accessed 2026-08-11)
21. Solus — Tower Hamlets Idea Store events RSS. https://idea.events.mylibrary.digital/rss (accessed 2026-08-11)
22. Solus — Sutton reference instance (used to reverse-engineer the platform). https://sutton.events.mylibrary.digital/rss and /ics?id=348744 (accessed 2026-08-11)
23. GLL/Better — library timetable turbo-frame endpoint. https://www.better.org.uk/library/dynamic_pages/panels/11000/timetables/items (accessed 2026-08-11)
24. GLL/Better — library sitemap (source of panel IDs). https://www.better.org.uk/library/sitemap.xml (accessed 2026-08-11)
25. Southwark Council — library story, music and play sessions. https://www.southwark.gov.uk/culture-and-sport/libraries/library-activities-babies-and-toddlers/story-music-and-play-sessions (accessed 2026-08-11)
26. Axiell Arena — Bexley regular events for children. https://arena.yourlondonlibrary.net/web/bexley/regular-events-for-children (accessed 2026-08-11)
27. Civica Spydus — Southwark Libraries OPAC. https://southwark.spydus.co.uk/ (accessed 2026-08-11)

**OpenActive and open data**
28. OpenActive — root data catalogue collection. https://openactive.io/data-catalogs/data-catalog-collection.jsonld (accessed 2026-08-11)
29. OpenActive — feed health dashboard. https://status.openactive.io/ (accessed 2026-08-11)
30. Better/GLL — OpenActive ScheduledSession feed. https://better-admin.org.uk/api/openactive/better/scheduled-sessions (accessed 2026-08-11)
31. Better/GLL — OpenActive SessionSeries feed. https://better-admin.org.uk/api/openactive/better/session-series (accessed 2026-08-11)
32. Southwark Council — OpenActive feeds. https://opendata.leisurecloud.live/api/feeds/SouthwarkCouncil-live-scheduled-sessions and -session-series (accessed 2026-08-11)
33. Tower Hamlets Council — OpenActive feeds. https://opendata.leisurecloud.live/api/feeds/TowerHamletsCouncil-live-scheduled-sessions and -session-series (accessed 2026-08-11)
34. postcodes.io — free UK postcode/geocoding API. https://api.postcodes.io/postcodes (accessed 2026-08-11)
35. London Datastore — CKAN-style API (note: `q` is silently ignored). https://data.london.gov.uk/api/action/package_search (accessed 2026-08-11)
36. GLA Cultural Infrastructure Map 2025. https://data.london.gov.uk/dataset/2rj5o (updated 2026-06-22; accessed 2026-08-11)
37. data.gov.uk — CKAN v3 API. https://data.gov.uk/api/3/action/package_search (accessed 2026-08-11)

**Cultural venues**
38. Spektrix API v3 — events and instances, 7 clients. https://system.spektrix.com/{polka,thealbany,unicorntheatre,greenwichtheatre,woolwichworks,blackheathhalls,littleangeltheatre}/api/v3/events (accessed 2026-08-11)
39. Polka Theatre — custom calendar-events JSON. https://polkatheatre.com/wp-json/polka/v1/calendar-events (accessed 2026-08-11)
40. Greenwich Theatre — WP REST events. https://www.greenwichtheatre.org.uk/wp-json/wp/v2/events?per_page=100 (accessed 2026-08-11)
41. London Wildlife Trust — Drupal JSON:API. https://www.wildlondon.org.uk/jsonapi/node/event (accessed 2026-08-11)
42. English Heritage — internal event search API. https://www.english-heritage.org.uk/api/eventsearch/1/200/datetime/0/all/none/none/none/none/0/0 (accessed 2026-08-11)
43. Horniman Museum — admin-ajax events endpoint. https://www.horniman.ac.uk/wp-admin/admin-ajax.php?action=getEvents&page=1 (accessed 2026-08-11)
44. Horniman Museum — event sitemap (215 URLs). https://www.horniman.ac.uk/event-sitemap.xml (accessed 2026-08-11)
45. Royal Museums Greenwich — What's On. https://www.rmg.co.uk/whats-on (accessed 2026-08-11)
46. London Museum — What's On. https://www.londonmuseum.org.uk/whats-on/?p=1 (accessed 2026-08-11)
47. Royal Greenwich Heritage Trust (Charlton House) — events sitemap. https://www.greenwichheritage.org/rght_events-sitemap.xml (accessed 2026-08-11)
48. The Royal Parks — Drupal Views AJAX. POST https://www.royalparks.org.uk/views/ajax (accessed 2026-08-11)
49. Tate — What's On. https://www.tate.org.uk/whats-on?page=1 (accessed 2026-08-11)
50. Old Royal Naval College — What's On. https://www.ornc.org/whats-on/ (accessed 2026-08-11)

**Family Hubs / Local Offer / FIS**
51. Tower Hamlets Best Start Family Hubs — health check. https://www.thfamilyhubs.co.uk/api/health (accessed 2026-08-11)
52. Tower Hamlets Best Start Family Hubs — event schedules API. POST https://www.thfamilyhubs.co.uk/api/GetEventSchedules (accessed 2026-08-11)
53. Greenwich Community Directory — sitemap (1,346 services). https://greenwichcommunitydirectory.org.uk/sitemap.xml (accessed 2026-08-11)
54. Greenwich Community Directory — date-range query. https://greenwichcommunitydirectory.org.uk/services?event_from=2026-08-11&event_to=2026-08-18 (accessed 2026-08-11)
55. Greenwich Community Directory — robots.txt (disallows `/services?f*`). https://greenwichcommunitydirectory.org.uk/robots.txt (accessed 2026-08-11)
56. GLL/Better — Greenwich children's centre timetable. https://www.better.org.uk/children-centre/london/greenwich/storkway-childrens-centre/timetable (accessed 2026-08-11)
57. Lewisham Family Hubs — events by age band. https://lewishamfamilyhubs.org.uk/events/birth-to-5-years (accessed 2026-08-11)
58. Lewisham Council — FIS search API. POST https://lewisham.gov.uk/lew-api/search/list (accessed 2026-08-11)
59. Southwark Council — Family Information Directory. https://www.southwark.gov.uk/children-young-people-and-families/family-information-directory?page=0 (accessed 2026-08-11)
60. Bromley Council — parent and toddler groups directory. https://www.bromley.gov.uk/directory/44/a-to-z/A (accessed 2026-08-11)
61. Bexley Local Offer — calendar JSON. https://bexleylocaloffer.uk/Training/LargeCalendar?date=2026-09-01 (accessed 2026-08-11)
62. Bexley Local Offer — robots.txt (`Disallow: /`). https://bexleylocaloffer.uk/robots.txt (accessed 2026-08-11)

**Open Referral UK (national — none in London)**
63. Open Referral UK — publisher directory. https://openreferraluk.org/community/directory (accessed 2026-08-11)
64. Open Referral UK — validator. https://github.com/OpenReferralUK/oruk-validator (last push 2026-08-06; accessed 2026-08-11)
65. Buckinghamshire — ORUK services feed (4,181 services). https://api.familyinfo.buckinghamshire.gov.uk/api/v1/services (accessed 2026-08-11)
66. Shropshire — ORUK feed (5,298). https://shropshire.openplace.directory/o/OpenReferralService/v3/services (accessed 2026-08-11)
67. Bristol / North Lincolnshire / Southampton / Dorset / CQC / Open Sessions ORUK feeds — see §2E.1 table (all accessed 2026-08-11)
68. LocalGov Drupal — `localgov_outpost` module. https://github.com/localgovdrupal/localgov_outpost (accessed 2026-08-11)
69. FutureGov Outpost platform. https://outpost-platform.wearefuturegov.com/ (accessed 2026-08-11)
70. DfE — `fh-service-directory-api` (**archived August 2024**). https://github.com/DFE-Digital/fh-service-directory-api (accessed 2026-08-11)
