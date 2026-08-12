# Missed Machine-Readable Event Sources — SE8 / SE10 / SE13 Priority

Research date: **2026-08-12**. All endpoints tested empirically with `curl` using a declared
User-Agent (`GreenwichParentCompass/0.1 (+research)`), unless a host required a browser-like UA.

**Out of scope (already built, not re-reported):** OpenActive RPDE (better-admin.org.uk,
opendata.leisurecloud.live Southwark/Tower Hamlets), Spektrix v3 (albany/greenwich/woolwich/
blackheath/unicorn/polka/littleangel), Better/GLL library timetables, Lewisham Libraries Solus RSS,
Tower Hamlets Family Hubs.

Status labels: **CONFIRMED WORKING** = fetched live, real response shape + count recorded.
**LIKELY** = strong structural evidence, not fully proven. **NOT FOUND** = tested, no feed.

---

## 1. Priority table

| # | Source | Exact URL | Type | Status | Est. under-5 items | SE8/SE10/SE13? | ToS risk | Effort |
|---|--------|-----------|------|--------|--------------------|----------------|----------|--------|
| 1 | **Quaggy Development Trust / Greenwich West CC** | `https://calendar.google.com/calendar/ical/quaggychildrenscentre%40gmail.com/public/basic.ics` | Public Google Calendar iCal | **CONFIRMED WORKING** | 1,912 VEVENTs; 1,067 in SE8/SE10/SE13; ~44 live recurring series | **YES — SE13 543, SE10 397, SE8 127** | Low (public ICS; `Crawl-Delay: 20` on site, not on Google) | **S** |
| 2 | **Deptford Lounge (Event Organiser AJAX)** | `https://deptfordlounge.org.uk/wp/wp-admin/admin-ajax.php?action=eventorganiser-fullcal&start=2026-08-12&end=2026-12-31` | WP plugin JSON | **CONFIRMED WORKING** | 210 forward occurrences; **61 under-5**; `children` cat = 225 | **YES — SE8 (Deptford Lounge, SE8 4RJ)** | Low — robots.txt explicitly `Allow: /wp/wp-admin/admin-ajax.php` | **S** |
| 3 | **Greenwich Community Directory (bulk geocoded JSON)** | `https://greenwichcommunitydirectory.org.uk/services` → `drupal-settings-json` script block | Embedded Drupal/Leaflet JSON | **CONFIRMED WORKING** | 1,136 geocoded features / 1,065 services; 0-4 subset 769 (realistically ~300–450) | **Partial — SE10 116 (68 under-5). SE8 8, SE13 28 (RBG directory, so Lewisham is thin)** | Low for `/services` + sitemap; ⚠️ `Disallow: /services?f*` blocks facet URLs | **M** |
| 4 | **The Play Map — Lewisham** | `https://www.theplaymap.co.uk/playgroups/stay-and-play-in-lewisham` (`wix-warmup-data`) | Embedded Wix Data JSON | **CONFIRMED WORKING** | 11 in-borough groups (SE13×2, SE4×2, SE6×3, SE8, SE10, SE12, SE26) | **YES — SE13, SE8, SE10** | Low (`Allow: /`; only `*?lightbox=` disallowed) | **S** |
| 5 | **The Play Map — Greenwich** | `https://www.theplaymap.co.uk/playgroups/stay-and-play-in-greenwich` (`wix-warmup-data`) | Embedded Wix Data JSON | **CONFIRMED WORKING** | 24 in-borough groups (SE10×4, SE3×4, SE9×5, SE18×4, SE7×2, SE8, SE13, SE2, SE28) | **YES — SE10×4, SE8, SE13** | Low | **S** |
| 6 | **Greenwich Peninsula (Prismic CMS API)** | `https://greenwichpeninsula.cdn.prismic.io/api/v2/documents/search?ref={masterRef}&q=[[at(document.type,"event")]]` | Public headless-CMS REST | **CONFIRMED WORKING** | 352 event docs total; family subset TBC | **YES — SE10 (Peninsula/Design District)** | Low — public CDN API. Site robots disallows `*category=*`/`*location=*`/`*relativeDate=*` **on the website**, not the CDN API | **S** |
| 7 | **Royal Borough of Greenwich events** | `https://www.royalgreenwich.gov.uk/events?start=2026-08-12&end=2026-09-30&neighbourhood=9` | Drupal Views, exposed date filters | **CONFIRMED WORKING** (HTML only) | 28 events/page × 7 pages in a 7-week window | **YES — SE10 via `neighbourhood=9` (Greenwich)**; also Blackheath=6, Charlton=7 | Low; `_format=json` returns 406 → HTML parse required | **M** |
| 8 | **Calico Libraries (Modern Events Calendar)** | `https://calicolibraries.com/wp-json/wp/v2/mec-events?per_page=100` | WP REST | **CONFIRMED WORKING** (dates missing) | `x-wp-total: 181` | Partial — Calico operates Lewisham/Manor House venues | Low | **M** (dates need per-page scrape) |
| 9 | **Greenwich 0–4 (NHS) infant feeding clinics** | `https://greenwich0to4.co.uk/clinics/infant-feeding-clinics` | Clean server-rendered HTML | **CONFIRMED WORKING** | 6 weekly clinics w/ postcodes | **YES — SE10 8DX (Parkside/Quaggy)**; + SE7, SE18, SE9, SE3, SE28 | ⚠️ see §9 robots gotcha | **S** |
| 10 | **Greenwich 0–4 (NHS) well-baby clinics** | `https://greenwich0to4.co.uk/clinics/well-baby-clinics` | Clean server-rendered HTML | **CONFIRMED WORKING** | ~9 weekly weigh-in clinics, day + time | Indirect (children's-centre venues incl. Robert Owen SE10) | ⚠️ see §9 | **S** |
| 11 | **ClassForKids cross-provider search** | `https://classforkids.io/en-GB/classes/SE10` (send header `RSC: 1`) | Next.js RSC JSON-in-HTML | **CONFIRMED WORKING** | **82 unique clubs across 8 postcodes; 47 under-5**; ages in **months** | **YES — SE8 13, SE10 17, SE13 17 under-5** | Low — robots blocks only `/iframe/*`; **no website ToS exists** | **S** |
| 12 | **Little Kickers locator API** | `https://www.littlekickers.co.uk/wp-json/jpl-locator/v1/locations/?lat=51.4826&lng=-0.0077&radius=5&units=mi` | WP REST (custom) | **CONFIRMED WORKING** | 42 venues, **12 in target postcodes**, with timetable + age + booking | **YES — SE10 9JU, SE10 8JA, SE8 4QF, SE13 7BN** | Low | **S** |
| 13 | **Baby Sensory / WOW World Group** | `https://www.wowworldgroup.com/find-a-class` → inline `const allVenues = [...]` | Inline JS array | **CONFIRMED WORKING** | 2,538 venues, **11 in SE3/4/8/10/13**; 3 brands in one call | **YES** | Low | **S** |
| 14 | **Tumble Tots locator** | `https://www.tumbletots.com/wp-admin/admin-ajax.php?action=wd_tt_all_locations_data&limit=500&postcode=SE10%208XJ&radius=10` | WP admin-ajax JSON | **CONFIRMED WORKING** | 6 rows, true server-side radius filter | **YES — SE10** | Low — robots explicitly `Allow: /wp-admin/admin-ajax.php` | **S** |
| 15 | **Bookwhen OpenActive RPDE** | `https://bookwhen.com/api/openactive/sessionseries` + `/scheduledsessions` | OpenActive RPDE | **CONFIRMED WORKING** | National feed; live 2026 data; `ageRange` on only ~16% | Requires full national walk to reach SE | **Very low — CC-BY 4.0** | **M** (reuses existing RPDE harness) |
| 16 | **Old Royal Naval College** | `https://ornc.org/wp-json/wp/v2/posts?per_page=100` | WP REST | **CONFIRMED WORKING** (no dates) | `X-WP-Total: 68`; `family-fun` category = 10 | **YES — SE10** | Low — robots `Disallow:` empty | **M** |
| 17 | **Surrey Docks Farm** | `https://surreydocksfarm.org.uk/wp-json/wc/store/v1/products?per_page=50` | WooCommerce Store API | **CONFIRMED WORKING** (no dates) | `X-WP-Total: 18`, several under-5 | SE16 (secondary) | Low | **M** |
| 18 | Rugbytots / Sing and Sign / Water Babies | see §11c | Inline JSON / WP REST | **CONFIRMED WORKING** | Rugbytots 541 venues (richest per-class data) | Partial | Low | M |
| 19 | Horniman Museum | `https://www.horniman.ac.uk/sitemap_index.xml` → `event-sitemap.xml` | Sitemap + HTML scrape | **LIKELY** | 215 event URLs | SE23 (secondary) | `Crawl-delay: 5` | **L** |
| 20 | Royal Museums Greenwich | `https://www.rmg.co.uk/sitemap.xml` | Sitemap + HTML scrape | **LIKELY** | 552 `/whats-on/` URLs | **YES — SE10** | robots.txt 404 | **L** |
| 21 | Discover Children's Story Centre | `https://discover.org.uk/sitemap_index.xml` | Sitemap; REST 401 | **LIKELY** | 67 events; age taxonomy `0-1/2-3/4-5` | E15 (out of area) | robots 404 | **L** (needs Spektrix) |
| 22 | Greenwich+Docklands Festival | `https://festival.org/wp-sitemap.xml` | WP core sitemap | **LIKELY** | 237 event URLs (mostly historical) | SE10/SE18, seasonal | Low | **L** |
| 23 | **Happity** | `happity.co.uk` | — | **DO NOT CRAWL** | — | — | 🔴 **robots `Disallow: /` for ClaudeBot + `Content-Signal: ai-train=no`; 403 to curl** | — |
| 24 | Bookwhen per-calendar `.ics` | `https://bookwhen.com/{slug}.ics` | — | **NOT FOUND** — HTTP 406 on all 13 real slugs | — | — | — | — |
| 25 | TeamUp calendar API | `https://api.teamup.com/{key}/events` | — | **NOT FOUND** — 400 `Teamup-Token header is missing`; robots disallows `/c/`, `/events/`, `/ks*` | — | — | — | — |
| 26 | Mudchute Park & Farm | `https://www.mudchute.org/?format=json` | — | **BLOCKED** — robots disallows `/*?format=json` and `/*?format=ical`; sitemap only | — | E14 | 🔴 | — |
| 27 | **Christ Church East Greenwich (Tribe API)** | `https://www.christchurcheastgreenwich.org.uk/wp-json/tribe/events/v1/events?per_page=50` | The Events Calendar REST | **CONFIRMED WORKING** | **523 events**, 11 pages; `venue.zip` + `geo_lat/lng` | **YES — SE10 9EQ** | Low | **S** |
| 28 | **A Church Near You internal JSON API** | `https://www.achurchnearyou.com/api/internal/venues/venue/?filter_geo_lat=51.4781&filter_geo_lon=-0.0219&filter_geo_radius=3&ordering=filter_geo_distance` | Undocumented DRF JSON | **CONFIRMED WORKING** | 94 venues in 3mi; **SE8 3, SE10 7, SE13 5**; `tags=parentstoddlers` → 13 | **YES — all three** | Low — robots `Allow: /` | **M** |
| 29 | **ACNY per-church iCal** | `https://www.achurchnearyou.com/church/{id}/service-and-events/feed/` | iCal | **CONFIRMED WORKING** | church 621 → 448 VEVENT; 691 → 27 | **YES** | Low | **S** |
| 30 | **ChurchSuite public JSON** | `https://{slug}.churchsuite.com/embed/calendar/json` | JSON array | **CONFIRMED WORKING** | `stpetersbrockley` 433, `stjamesse3` 121, `kingsconnect` 44, `stjohnsblackheath` 2 | SE4/SE3/SE6 — **no live slug in SE8/SE10/SE13** | Low — `Allow: /`, `ai-train=yes` | **S** |
| 31 | St John's Blackheath (Tribe API) | `https://www.stjohnsblackheath.org.uk/wp-json/tribe/events/v1/events` | Tribe REST | **CONFIRMED WORKING** | 27 events (SE3 7TD) + JSON-LD `Event` | SE3 (secondary) | Low | S |
| 32 | ChurchSuite iCal / HTML widget | `https://{slug}.churchsuite.com/embed/calendar/ical` | — | **NOT FOUND** — 403 Cloudflare challenge; only `/json` is allowlisted | — | — | — | — |
| 33 | Deptford Lounge children RSS | `https://deptfordlounge.org.uk/events/category/children/feed/` | RSS 2.0 | **CONFIRMED WORKING** | 6 items (latest only) | YES — SE8 | Low | S (superseded by #2) |
| 34 | Lewisham Council `/events` | `https://lewisham.gov.uk/events` | — | **NOT FOUND** | 0 | — | — | — |
| 35 | Lewisham Family Hubs | `https://www.lewishamfamilyhubs.org.uk/rss` | RSS | **NOT FOUND** (empty channel) | 0 | — | — | — |
| 36 | Deptford Lounge Tribe REST | `.../wp-json/tribe/events/v1/events` | — | **NOT FOUND** (`rest_no_route`) | — | — | — | — |
| 37 | Royal Greenwich JSON:API | `https://www.royalgreenwich.gov.uk/jsonapi` | — | **NOT FOUND** (404) | — | — | — | — |
| 38 | Wix Data public query API | `https://www.theplaymap.co.uk/_api/cloud-data/v1/wix-data/collections/query` | — | **NOT FOUND** (`WDE0117 MetaSite not found`) | — | — | — | — |

> Sources 1–6 are the build-next set. Detail follows.

---

## 2. Quaggy Development Trust — public Google Calendar ICS ★ TOP FIND

**CONFIRMED WORKING**

```
https://calendar.google.com/calendar/ical/quaggychildrenscentre%40gmail.com/public/basic.ics
→ HTTP 200, content-type: text/calendar; charset=utf-8, 1,392,222 bytes, 1,912 VEVENT
```

### How it was found
`https://quaggydevelopmenttrust.org/live-calendar/` embeds a Google Calendar iframe whose `src`
query param is base64: `src=cXVhZ2d5Y2hpbGRyZW5zY2VudHJlQGdtYWlsLmNvbQ`
→ decodes to `quaggychildrenscentre@gmail.com`, which is the public calendar ID.

`full.ics` returns a byte-identical response to `basic.ics` (same 1,392,222 bytes / 1,912 events) —
use either.

### Calendar identity
```
X-WR-CALNAME:Greenwich West CC
X-WR-TIMEZONE:Europe/London
X-WR-CALDESC:This calendar shows all the events taking place across Greenwi[ch...]
```
Despite the Quaggy-branded calendar ID this is the **combined Royal Greenwich children's-centre
calendar** — Quaggy, Sherington, Pound Park, Charlton Family Centre, Robert Owen and others all
appear. That is why the yield is so high.

### Real VEVENT (verbatim)
```
BEGIN:VEVENT
DTSTART:20251013T083000Z
DTEND:20251013T093000Z
DTSTAMP:20260812T065003Z
UID:2i4vuuv7gaalcdli2vbdkjnnm1@google.com
CREATED:20250828T170156Z
DESCRIPTION:Speech and Language sessions for children aged 13-24 months.\nCall to book a place on 020 8465 9785
LAST-MODIFIED:20260416T011410Z
LOCATION:Quaggy Children Centre\, Orchard Hill\, London SE13 7QZ\, UK
SEQUENCE:1
STATUS:CONFIRMED
SUMMARY:Quaggy Small Talk
TRANSP:OPAQUE
END:VEVENT
```

### Field mapping
| Need | iCal property | Notes |
|---|---|---|
| title | `SUMMARY` | e.g. `Quaggy Small Talk`, `Quaggy Baby Massage`, `Sherington Bouncing Babies`, `Quaggy Being Dad` |
| start / end | `DTSTART` / `DTEND` | UTC (`Z`); calendar TZ is `Europe/London` |
| **postcode** | `LOCATION` | Full postal address, comma-escaped. Regex `[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}` extracts it cleanly — **83% hit rate** |
| **age range** | `DESCRIPTION` | Free text but highly regular: `children aged 13-24 months`, `3 - 12 months`, `non crawling baby` |
| booking | `DESCRIPTION` | Phone numbers and Eventbrite links (`eventbrite.co.uk/e/...-tickets-123346184759`) |
| recurrence | `RRULE` | 997 of 1,912 |
| stable id | `UID` | `…@google.com` |
| change detection | `LAST-MODIFIED` | drives incremental sync |

`DESCRIPTION` contains HTML (`<b>`, `<br>`, `<a href>`) inside the iCal text — strip tags on ingest.

### Postcode district distribution (measured, n=1,912)
| District | Events | | District | Events |
|---|---|---|---|---|
| **SE13** | **543** | | SE3 | 54 |
| SE7 | 460 | | SE23 | 1 |
| **SE10** | **397** | | E14 | 1 |
| (none) | 327 | | E2 | 1 |
| **SE8** | **127** | | DA16 | 1 |

**SE8 + SE10 + SE13 = 1,067 of 1,912 (56%).** No other single source comes close.

### Freshness — IMPORTANT CAVEAT
- `LAST-MODIFIED` in 2026: **1,871 of 1,912** → the calendar is actively maintained.
- Max `DTSTART` = **2026-08-10** (two days before research date).
- Non-recurring events **dated ≥ 2026-08-12: 0**.
- `RRULE` with `UNTIL ≥ today`: **0**. `RRULE` with no `UNTIL`: 374 (nearly all bounded by `COUNT=`).
- Series still generating occurrences on/after 2026-08-12 (after expanding `COUNT`): **44**.

Interpretation: staff populate the calendar rolling-forward roughly to the current date rather than
publishing a full term in advance. So the adapter must **(a)** expand `RRULE` (`COUNT=`-bounded
weekly series dominate) to derive forward occurrences, and **(b)** re-poll frequently (daily) to
pick up newly added near-term events. Treat it as a *nowcast* feed, not a season-ahead feed.
Historic events are still valuable for building the venue/series registry.

`UNTIL` year histogram shows the calendar has run since 2014: `{2014:1, 2015:52, 2016:32, 2017:46,
2018:36, 2019:45, 2020:103, 2021:48, 2022:56, 2023:63, 2024:50, 2025:58, 2026:33}`.

### ToS / robots
`https://quaggydevelopmenttrust.org/robots.txt` → `User-agent: * / Crawl-Delay: 20`. The ICS is served
by Google, not the charity's host, so the crawl-delay does not bind the feed fetch; still, poll once
daily. No ToS prohibition found.

---

## 3. Deptford Lounge — Event Organiser AJAX JSON ★ BEST SE8 SOURCE

**CONFIRMED WORKING**

```
https://deptfordlounge.org.uk/wp/wp-admin/admin-ajax.php?action=eventorganiser-fullcal
  &start=2026-08-12&end=2026-12-31&timeformat=g:ia
→ HTTP 200, application/json; charset=UTF-8, 299,867 bytes, 488 occurrences
```

### Discovery path
1. `/wp-json/wp/v2/types` does **not** list an event CPT (`show_in_rest` is off) — a dead end that
   would have caused a false negative.
2. `robots.txt` → `Sitemap: https://deptfordlounge.org.uk/sitemap_index.xml`, which contains
   `event-sitemap.xml` (**284 event URLs**), `event-category-sitemap.xml`, `event-venue-sitemap.xml`.
3. An event page revealed the plugin: `app/plugins/event-organiser`.
4. Event Organiser ships a FullCalendar AJAX action — and `robots.txt` explicitly permits it:
   ```
   User-agent: *
   Disallow: /wp/wp-admin/
   Allow: /wp/wp-admin/admin-ajax.php
   ```

Note the non-standard `/wp/wp-admin/` path (Bedrock layout) — `/wp-admin/admin-ajax.php` will 404.

### Real response object (verbatim, first element)
```json
{
  "title": "Under 5s Rhymes and Stories",
  "url": "https://deptfordlounge.org.uk/whats-on/event/under-5s-rhymes-and-stories/",
  "allDay": false,
  "start": "2023-11-04T10:30:00",
  "end": "2026-08-01T11:00:00",
  "description": "November 4, 2023  10:30am - August 1, 2026  11:00am</br></br>Age Guidance: 0-5 Join us every Saturday at 10.30 for half an hour of stories, nursery rhymes and songs, ideal for children under 5 and their families. We WILL expect...",
  "organiser": 1,
  "className": ["eo-event-cat-children","eo-event-past","eo-multi-day","eo-event","eo-past-event","category-children"],
  "category": ["children"],
  "textColor": "#ffffff"
}
```

### Field mapping
| Need | Field | Notes |
|---|---|---|
| title | `title` | |
| start / end | `start` / `end` | ISO 8601 local (`Europe/London`), no offset |
| all-day | `allDay` | boolean |
| **age** | `description` → `Age Guidance: 0-5` | **explicit, machine-parseable** — regex `Age Guidance:\s*([0-9\-+ ]+)` |
| category | `category[]` / `className[]` | see values below |
| detail URL | `url` | |
| past/future flag | `className` contains `eo-past-event` | free filter |
| postcode | **not in feed** | single venue: Deptford Lounge, 9 Giffin St, London **SE8 4RJ** — hardcode from `event-venue-sitemap.xml` (only one venue) |

### Measured counts (window 2026-08-12 → 2026-12-31)
- occurrences returned: **488**; with `start >= 2026-08-12`: **210**
- category histogram: `club 241, children 225, advice 25, film 21, sport 7, community 7, featured 5, workshop 5, exhibition 2`
- **under-5 forward occurrences: 61**, across 3 distinct series:
  - `Thursday Baby Bounce` — Thu 14:15–14:45, `Age Guidance: 0-5`, cat `children`
  - `Under 5s Rhymes and Stories` — Sat 10:30–11:00, `Age Guidance: 0-5`, cat `children`
  - `Colouring Club` — Sat 11:00–12:00, cat `club`

### Secondary route
`https://deptfordlounge.org.uk/events/category/children/feed/` → HTTP 200, `application/rss+xml`,
**6 `<item>`** (most-recent only). Useful as a cheap change-detector, not as the primary feed.
`https://deptfordlounge.org.uk/events/feed/` → 404. `?feed=eo-events` → 404 (invalid feed template).
`/whats-on/feed/` → 403 (comments closed). No JSON-LD on event pages (Yoast graph is `WebPage` only).

### Reusable pattern
`action=eventorganiser-fullcal` works on **any** WordPress site running Event Organiser. Worth
probing across other in-area venues — it is a one-line adapter change per host.

---

## 4. The Play Map — Wix `wix-warmup-data` borough registers

**CONFIRMED WORKING**

Two sites share the name; the UK one is the Wix site at **theplaymap.co.uk**
(`theplaymap.com` is an unrelated US site with an empty sitemap).

```
https://www.theplaymap.co.uk/playgroups/stay-and-play-in-lewisham   → HTTP 200, 1,690,777 bytes
https://www.theplaymap.co.uk/playgroups/stay-and-play-in-greenwich  → HTTP 200, 1,799,474 bytes
```

Site self-description: *"An up-to-date list of stay & play groups for 0 – 5 years old in Lewisham
including Brockley, Catford, Forest Hill and New Cross… filter playgroups by day of the week, baby
groups, dad/male carer groups and groups that happen in the afternoon."* — i.e. purpose-built for
exactly this product's audience.

### The machine-readable route
The borough pages are server-rendered and embed the full Wix Data collection rows in
`<script type="application/json" id="wix-warmup-data">` (185 KB Lewisham / 258 KB Greenwich).
Parse that script tag — **no browser or JS execution needed**.

Collection name: `Locations`. Schema (from `/appsWarmupData/dataBinding/schemas/Locations/fields`):
`title, _id, _createdDate, _updatedDate, _owner, type (richtext), address (Wix address),
url, arraystring (displayName "Tags"), email, mapReference, reference, textDescription, type1,
url1, visitWebsite`.

### Real record (verbatim, trimmed)
```json
{
  "title": "Toddler Train",
  "arraystring": ["Tuesday"],
  "textDescription": "Tuesday: 13.30 - 15.00",
  "type": "<p class=\"font_8\">Tuesday: 13.30 - 15.00</p>",
  "visitWebsite": "Visit Website",
  "url1": "https://www.google.com/maps/search/?api=1&query=Western Rd, Hawkhurst, Cranbrook TN18 4BT, UK",
  "address": {
    "formatted": "Western Rd, Hawkhurst, Cranbrook TN18 4BT, UK",
    "postalCode": "TN18 4BT",
    "city": "Hawkhurst",
    "country": "GB",
    "subdivision": "ENG",
    "location": { "latitude": 51.0496135, "longitude": 0.5089306 },
    "streetAddress": { "name": "Western Road", "number": "", "apt": "" }
  },
  "reference": "e25cae1c-e7c9-418d-af77-0cfdc1276672",
  "_id": "3b9b3c75-3a87-44f1-b10c-696432ec5d86"
}
```

### Field mapping
| Need | Field | Notes |
|---|---|---|
| title | `title` | |
| **postcode** | `address.postalCode` | clean, already normalised |
| **lat/lng** | `address.location.latitude/longitude` | geocoding already done |
| **day of week** | `arraystring[]` | `Monday`…`Sunday` (plus stray `Wed`, `Thur` — normalise) |
| **time** | `textDescription` | e.g. `Tuesday: 13.30 - 15.00`; `type` is the same as HTML |
| **dad/carer tag** | `arraystring[]` contains `For Dads/Male Carers` | direct product feature |
| **afternoon tag** | `arraystring[]` contains `Afternoon Groups` | |
| provider link | `url1` / `visitWebsite` | `url1` is often a Google Maps search link |
| stable id | `_id` | plus `_updatedDate` for change detection |

Age is **not** a per-record field — the whole collection is scoped 0–5 by the page, so it can be
assumed.

### Measured contents
Each page returns 23 (Lewisham) / 36 (Greenwich) records with addresses. The **first 12 records are
identical on both pages** — a shared advertiser/featured block from outside London
(TN18, SW7, RH10, AL8, RH1, CR4, E18, ME15, BN2, TW13, TW1, KT1). Filter those out by postcode.

**Lewisham in-borough (11):**

| Group | Postcode | Tags |
|---|---|---|
| St Margaret's Playgroup | SE13 5BU | Wednesday, Monday |
| Bouncy Bunnies Hither Green | SE13 5QL | Friday, Thursday |
| **Dads & Male Carers Group** | **SE8 3PZ** | For Dads/Male Carers, Tuesday |
| The Ark Playgroup | SE10 8AW | Wednesday |
| Chatterbox Toddler Group | SE4 2JD | Friday |
| Explorers | SE4 1JJ | Wednesday, Afternoon Groups |
| DUPLO Stay & Play | SE6 1RQ | Wednesday |
| Stay & Play | SE6 1SQ | Monday |
| Explorers | SE6 3HB | Monday, Afternoon Groups |
| Little Angels Playgroup | SE26 4HH | Monday, Wednesday, Tuesday |
| Phoenix Carers And Toddlers' Group | SE12 8RA | Wednesday |

**Greenwich in-borough (24):** SE10 ×4 (`AvoCuddle Playroom` SE10 9NY, `Ship Mates` SE10 9HT,
`Stay & Play` SE10 0EA, `Stay & Play` SE10 0LB), SE3 ×4, SE9 ×5, SE18 ×4, SE7 ×2,
**SE8 3EH ×1**, **SE13 7QZ ×1**, SE2, SE28, DA15.

**SE8/SE10/SE13 yield across both pages: ~10 distinct groups** — modest in count but these are the
recurring parent-and-toddler groups that no ticketing feed carries, with day/time/postcode already
structured.

### Other boroughs available (same pattern, secondary postcodes)
`stay-and-play-in-southwark` (SE16), `…-bexley` (DA5–DA18), `…-bromley` (BR1–BR8),
`…-tower-hamlets` (E14), `…-lambeth`, `…-croydon`. Sitemap:
`https://www.theplaymap.co.uk/dynamic-playgroups_p_bd8bba01_a575_4f2f_b9da_0fdce23dafd2_0_5000-sitemap.xml`
→ 106 borough pages nationally, `lastmod 2026-03-18`.

### ToS / robots
```
User-agent: * / Allow: / / Disallow: *?lightbox=
Sitemap: https://www.theplaymap.co.uk/sitemap.xml
```
Borough pages are explicitly allowed. Crawl-delay 10 applies only to `dotbot`/`AhrefsBot`.
The site invites listings (`/submit-a-listing`) and sells advertising, so an attribution link back
is the courteous approach and reduces any relationship risk.

**Wix Data REST API is NOT usable:** `POST /_api/cloud-data/v1/wix-data/collections/query` →
HTTP 400 `{"message":"WDE0117: MetaSite not found."}` (needs an instance token). Warmup-data parsing
is the supported-in-practice route.

---

## 5. Greenwich Peninsula — Prismic headless CMS API

**CONFIRMED WORKING**

The site is Next.js backed by **Prismic**, whose content API is public and CDN-served.

```
1) https://greenwichpeninsula.cdn.prismic.io/api/v2
   → HTTP 200, application/json, 2,442 bytes. masterRef at research time: ansmwhEAAC4AxLOW

2) https://greenwichpeninsula.cdn.prismic.io/api/v2/documents/search
     ?ref={masterRef}&q=%5B%5Bat(document.type%2C%22event%22)%5D%5D&pageSize=3
   → HTTP 200, total_results_size: 352, total_pages: 118
```

Always fetch `/api/v2` first to read the current `masterRef` — refs rotate on publish.

Document types include: `event`, `event_category`, `event_tag`, `location`, `venue`,
`venue_category`, `place`, `place_category`, `whats_on`, `whats_here`, `food_drink`, `route`.

### `data` fields on an `event` document (full list observed)
`event_title, title, start_date, end_date, time, date_description, monday, tuesday, wednesday,
thursday, friday, saturday, sunday, category (link→event_category), event_tag, location
(link→location), location_description, location_link, price, book_link, book_label,
show_book_button, description, event_description, listing_description, listing_image,
listing_sort_order, featured, hide_from_listing, schema_markup, image, slices, …`

### Real values (verbatim, trimmed)
```json
{
  "start_date": "2026-10-08",
  "end_date": "2026-10-08",
  "price": "From £10",
  "category": { "type": "event_category", "uid": "art--design", "link_type": "Document" },
  "location": { "type": "location", "uid": "design-district", "link_type": "Document" }
}
```

### Field mapping
| Need | Field |
|---|---|
| title | `data.event_title` (fall back to `data.title`) |
| date | `data.start_date` / `data.end_date` (`YYYY-MM-DD`) |
| time | `data.time` + `data.date_description` |
| **recurring days** | `data.monday` … `data.sunday` (per-day booleans — recurrence is first-class) |
| venue | `data.location` → resolve the linked `location` doc (`uid` e.g. `design-district`) |
| category | `data.category` → `event_category` doc (`uid` e.g. `art--design`) |
| age / audience | `data.event_tag` → `event_tag` doc; **verify whether a family/under-5 tag exists** |
| price | `data.price` (free text, e.g. `From £10`) |
| booking | `data.book_link` / `data.book_label` |
| stable id | `id`, `uid`, `last_publication_date` |

Postcode is not a direct field — resolve via the linked `location`/`venue` documents (the Peninsula
is entirely **SE10**, so a default is safe).

### Alternative route
`https://www.greenwichpeninsula.co.uk/_next/data/6oWcwrHUD8IjMOcLXxssp/whats-on.json` → HTTP 200,
37,901 bytes. Works but the `buildId` changes on every deploy — **prefer the Prismic API**.
`/api/v2/documents/search` on the *website* host returns 404; only the `.cdn.prismic.io` host serves it.

Sitemap `https://www.greenwichpeninsula.co.uk/sitemap.xml` → 737 URLs, of which **344 under
`/whats-on`** and 69 under `/whats-here`.

### ToS / robots
```
User-agent: *
  Disallow: *category=*
  Disallow: *location=*
  Disallow: *relativeDate=*
  Allow: /
  Sitemap: https://www.greenwichpeninsula.co.uk/sitemap.xml
```
The disallows target faceted-search query strings on the website; they do not cover the Prismic CDN
API. Avoid crawling the website's filtered listing URLs.

---

## 6. Greenwich Community Directory (LocalGov Drupal) ★ BULK JSON FOUND

**CONFIRMED WORKING.** The headline result is a bulk JSON payload hiding in plain sight: every
`/services` listing response embeds the Leaflet map data for the **entire result set**, not just the
12 cards rendered on screen. One request returns the whole geocoded corpus.

```
GET https://greenwichcommunitydirectory.org.uk/services
→ HTTP 200, 1,730,106 bytes
   <script type="application/json" data-drupal-selector="drupal-settings-json">
     .leaflet["leaflet-map-view-localgov-directory-channel-embed-map"].features
→ 1,136 feature objects = 1,065 distinct services
```
(Services with multiple venues emit multiple markers, hence 1,136 > 1,065.)

Each feature carries `lat`, `lon`, `entity_id`, `tooltip.value` (service name) and `popup.value`
(HTML containing the `/services/{slug}` href, `"Locality, POSTCODE"` and the description).
The payload honours whatever facets are active, so any filtered query returns its own complete
geocoded subset in a single request.

Sitemap (independently verified): `https://greenwichcommunitydirectory.org.uk/sitemap.xml`
→ HTTP 200, `application/xml`, 256,259 bytes, **1,361 `<loc>`**, of which **1,347 are `/services/…`**
(remaining 14 are policy/about/util pages). `www.` 301-redirects to the bare domain.
Generator: `<meta name="Generator" content="Drupal 10 (LocalGov Drupal | …)" />`.

**294 services have no geocoded location** (the "multiple locations" / address-less tail) — cover
them from the sitemap rather than the map payload.

### Service detail page — no JSON-LD, but clean semantic HTML
Zero `application/ld+json` blocks and no OpenGraph. Exactly one microdata attribute exists, and it
is the useful one (`openingHours`). Extraction selectors:

| Field | Exact markup |
|---|---|
| Name | `<h1 class="rbg-heading rbg-heading--h1"><span>…</span></h1>` |
| Container | `<article class="rbg-service-details">` |
| Description | `.rbg-service-details__description > .rbg-rich-text` |
| Organisation | `.rbg-field-key-value` with `<strong>Organisation:</strong>` |
| **Age range** | `<h2 class="rbg-service-details__item-heading">Suitable for</h2>` → `Ages 0 to 2` / `Ages 1 to 5` / `Ages 3 and up` / `All ages` |
| **Day + time (machine-readable)** | `<meta property="openingHours" itemprop="openingHours" content="Fr 13:30-14:45"/>` |
| Day + time (human) | `<dl class="rbg-regular-schedules">` → `<dt class="office-hours__item-label">Friday</dt>` |
| Recurrence / dated sessions | `<ul class="rbg-list rbg-list--event">` → `<strong>Every three weeks on Friday starting 24 July 2026 until 28 August 2026:</strong>` + a `<details>` list of upcoming dates |
| **Postcode** | `<p class="address">…<span class="postal-code">SE18 6BD</span>` (with `.organization`, `.address-line1`, `.locality`) |
| Cost | `…item-heading">Cost</h2>` → `Free` / `£1.00 per session` |
| Booking | `…item-heading">How to book</h2>` → `No booking required` |
| Accessibility | `.rbg-access-needs > ul` → `Baby changing`, `Lift`, … |
| Numeric service ID | "Suggest an edit" href → `manage-services.greenwichcommunitydirectory.org.uk/services/2155/feedback` |

Postcode present on **29/29** sampled detail pages (27 full unit; 2 outward-only — childminders
publish only `SE10`/`SE2` for privacy).

`itemprop="openingHours"` in the `Fr 13:30-14:45` format is the single most valuable field here —
it is a genuine machine-readable day+time for a recurring group.

### Postcode coverage (full census, not a sample)
| Set | SE18 | SE9 | SE3 | SE10 | SE28 | SE7 | SE2 | SE13 | SE8 | SE12 |
|---|---|---|---|---|---|---|---|---|---|---|
| All 1,065 services | 333 | 172 | 117 | **116** | 86 | 65 | 47 | **28** | **8** | 8 |
| 0-4 subset (702) | 214 | 121 | 80 | **68** | 71 | 42 | 40 | **17** | **6** | – |
| Nurseries ∪ Pre-schools ∪ Childminders (285) | 79 | 67 | 32 | **33** | 28 | 14 | 18 | **3** | **4** | – |

**Priority SE8+SE10+SE13: 152 total / 91 in the 0-4 subset / 40 early-years-specific.**
38 distinct outward codes overall; RBG core (SE3/7/9/18/28) = 773.

> **Structural caveat:** this is a *Royal Borough of Greenwich* directory. **SE8 (Deptford) and
> SE13 (Lewisham) sit in Lewisham**, so they will never be well covered here — SE10 is the only
> priority district with real depth. Sources §2, §3 and §4 remain the SE8/SE13 answer.

### Facets — work, but are robots-disallowed
Drupal Facets syntax `?f[0]=family:value` (URL-encoded `f%5B0%5D=`), stackable via `f[1]`, `f[2]`;
plus free-text `?search=baby` (427 results).

**Gotcha: `age_range` is a *dependent* facet** — it is silently ignored unless
`gcd_outpost_directory:743` is also active. Proof: `?f[0]=age_range:0-4 years` alone returns 1,346,
identical to a nonsense facet `?f[0]=zzz:qqq`, i.e. no filter applied. The real 0-5 URL is:
```
/services?f%5B0%5D=gcd_outpost_directory%3A743&f%5B1%5D=age_range%3A0-4%20years
→ HTTP 200 — 769 results — 737 map features — 702 distinct slugs
```

| Filter | Results | | Filter | Results |
|---|---|---|---|---|
| `/services` baseline | 1,339 | | `outpost_category:746` Childcare | 359 |
| `gcd_outpost_directory:743` Families/children/YP | 898 | | `outpost_category:651` Activities | 455 |
| `gcd_outpost_directory:742` Adults | 510 | | `cost:1` Free | 476 |
| `gcd_outpost_directory:744` SEND local offer | 103 | | `day:1` Monday | 395 |
| **743 + `age_range:0-4 years`** | **769** | | 743 + 0-4 + `cost:1` | 229 |
| 743 + `age_range:5-11 years` | 745 | | 743 + 0-4 + `gcd_locality:Greenwich` | 96 |

Childcare subcategories (revealed only under `outpost_category:746`) are the highest-precision
under-5 filters: `751` Nurseries 140, `752` Childminders 133, `757` Pre-schools 63,
`747` Breakfast/after-school 54, `750` Holiday clubs 29.
`funded_places` is another strong early-years signal: `9 month olds` 160, `2 year olds` 203,
`3 to 4 year olds` 233.

Facet families: `gcd_outpost_directory` (3), `outpost_category` (9 top-level + subcategories),
`outpost_suitabilities` (7 SEND), `age_range` (5, dependent), `gcd_locality` (11),
`funded_places` (4), `day` (0=Sun…6=Sat), `accessibility_list` (12), `cost` (1), `organisation`.

### Facet precision — measured, do not trust `age_range`
29 detail pages sampled from the 0-4 filtered set, reading the actual "Suitable for" field:
41% early-years specific (`Ages 0 to 5`, `Ages 2 to 5`, `Ages 0 to 2`), 17% span under-5 but wider
(`Ages 0 to 18`, `Ages 0 to 25`), **34% say "All ages"** (genuinely ambiguous), 7% open-ended
(`Ages 3 and up`). The filter also leaks school-age entries — `Ages 4 to 11` wraparound care passes
`0-4` because 4 ≤ 4.

**So 769 is an upper bound; realistically ~300–450 are genuinely under-5 relevant.** The
`outpost_category` 751 ∪ 757 ∪ 752 union (285) is the reliable floor. Derive under-5 relevance from
the detail page's `Suitable for` text, not from the facet.

### `/events` exists but is empty
`/events` → HTTP 200, view `views-exposed-form-localgov-events-listing-page-all-events`, GET form
with fields `start` (type=date, default `today`), `end`, `category`, `neighbourhood`, `price`.
So `?start=2026-08-12&end=2026-09-12` **is** the correct date-range syntax the brief anticipated —
but the page renders "No results found" and every dropdown contains only `- Any -`. The events
content type is unpopulated. `/whats-on`, `/activities` → 404. **All recurring-activity data lives
in `/services`, not `/events`.**

### Not available
- `/jsonapi`, `/jsonapi/`, `/jsonapi/node/localgov_directory_page` → **HTTP 404** (module not enabled)
- `/node/2155` → 404 (no canonical node paths)
- `/services.json`, `/api/services`, `/api`, `/directory.json`, `/directories` → **404**
- `/services?_format=json` and `/services/{slug}?_format=json` → **HTTP 406**
  `{"message":"A route that returns a rendered array as its response only supports the HTML format."}`
- `manage-services.greenwichcommunitydirectory.org.uk` (Outpost/Rails admin) → `/` and `/services/2155`
  both **302 → /users/sign_in**; `/api` 404. No public API.

### robots.txt — ⚠️ one rule that shapes the design
HTTP 200, single `User-agent: *` group, **no `Crawl-delay` at all**. `/services` and
`/services/{slug}` are **not** disallowed. Three site-specific rules matter:
```
Disallow: /kb5/                # legacy Jadu paths
Disallow: /services?f*         # ← every facet filter URL
Disallow: /services/*/feedback
Disallow: /search/             # trailing slash; /search itself is not matched
```
**`Disallow: /services?f*` covers every faceted URL above.** Use facets for interactive/manual
exploration only. This is not a blocker: the sitemap and unfiltered `/services` are both allowed
and already yield the complete 1,136-feature geocoded payload.

### Recommended ingestion path
1. `GET /sitemap.xml` — 1,346 service URLs (allowed).
2. `GET /services` — one request, parse `drupal-settings-json` → 1,136 geocoded features with name,
   slug, locality, postcode, description. Cheap to re-fetch for change detection.
3. Fetch detail pages for what the map payload lacks: `Suitable for`, `itemprop="openingHours"`,
   recurrence/dated sessions, cost, booking, accessibility, organisation.
4. Derive under-5 relevance from `Suitable for` text, **not** the `age_range` facet.

Treat as an **M**-effort enrichment source (venue + recurring-group registry), sequenced after the
dated-event feeds.

---

## 7. Royal Borough of Greenwich — Drupal Views with exposed date filters

**CONFIRMED WORKING (HTML)**

```
https://www.royalgreenwich.gov.uk/events?start=2026-08-12&end=2026-09-30
→ HTTP 200, text/html, 67,391 bytes, 28 distinct /events/{slug} links, pager shows 7 pages
```

This is the date-range query-param route the brief anticipated — the real param names are
**`start`** and **`end`** (not `event_from`/`event_to`), read off the exposed-filter form:
`start`, `end`, `neighbourhood`, `search_keys`, `op`, `form_build_id`, `form_id`, `antibot_key`.

### `neighbourhood` filter values (verbatim from the `<select>`)
| Value | Neighbourhood | | Value | Neighbourhood |
|---|---|---|---|---|
| `All` | – Any – | | `12` | Shooters Hill |
| `5` | Abbey Wood | | `13` | Thamesmead |
| `6` | **Blackheath** | | `14` | Woolwich |
| `7` | **Charlton** | | `15` | Online |
| `8` | Eltham | | `16` | New Eltham |
| `9` | **Greenwich** | | `10` | Kidbrooke |
| `11` | Plumstead | | | |

`neighbourhood=9` is the SE10 slice.

### Event page structure (`/events/circus-works-circus-workshops-kids`)
No JSON-LD (0 blocks). Server-rendered, but with a very regular labelled layout:
```
Circus Works: Circus Workshops for Kids
Location:
Woolwich Works (The Fireworks Factory
11 No 1 St
Royal Arsenal, London )
London
SE18 6HD
United Kingdom
Next event date and time:
Monday 10 August 2026 at 10am
to 3pm
See more dates
Tuesday 11 August 2026 at 10am
to 3pm
How to book:
Book on the Woolwich Works website.
Price:
Child: £22 | Ticket includes a £2 booking fee per ticket
…
Monday 10 August, 10am -12pm, Workshop for ages 4 - 7 years old.
```
Carries: venue name, **street address + postcode on its own line**, `Next event date and time`,
a `See more dates` list of all occurrences, `How to book:` link, `Price:`, and age in body text
(`ages 4 - 7 years old`). Under-5 relevance must be inferred from the description — there is no
structured age field.

Observed in-area events include `bach-baby-family-concert-blackheath-2` and
`deptford-ravens-inclusive-beginner-friendly-kickabouts`, so it does reach SE3/SE8 as well as SE18.

### Not available
- `?_format=json` → **HTTP 406** `{"message":"No route found for the specified format. Supported formats: html."}`
- `/jsonapi` → **HTTP 404** (JSON:API module not enabled)
- Sitemap index `https://www.royalgreenwich.gov.uk/sitemap.xml` → only 2 children
  (`/default/sitemap.xml`, `/jadusitemap`)

**Effort M** — HTML parsing required, but the date-range + neighbourhood params make targeted,
low-volume polling easy, and the layout is stable and label-driven.

---

## 8. Calico Libraries — Modern Events Calendar (WordPress)

**CONFIRMED WORKING (collection); dates NOT exposed**

```
https://calicolibraries.com/wp-json/wp/v2/types
→ includes: "mec-events" | rest_base=mec-events | name="Events"

https://calicolibraries.com/wp-json/wp/v2/mec-events?per_page=100&page=1
→ HTTP/2 200, x-wp-total: 181, x-wp-totalpages: 2
```

Namespaces present include `mec/v1`. Its routes are only `/mec/v1` and `/mec/v1/events`, and
`GET https://calicolibraries.com/wp-json/mec/v1/events` → HTTP 200 returning **`[]`** (empty —
it needs parameters that are not publicly documented on this install).

### Real item (verbatim, trimmed)
```json
{
  "id": 5210,
  "date": "2026-08-10T13:47:39",
  "slug": "indie-press-fair",
  "status": "publish",
  "type": "mec-events",
  "link": "https://calicoprojects.com/indie-press-fair/",
  "title": { "rendered": "Indie Press Fair" },
  "content": { "rendered": "" },
  "mec_category": [63, 19, 25, 52],
  "class_list": ["post-5210","mec-events","mec_category-adults","mec_category-events",
                 "mec_category-manor-house-events","mec_category-paid"],
  "meta": { "_links_to": "https://calicoprojects.com/indie-press-fair/", "_links_to_target": "_blank" }
}
```

### The catch
MEC stores event dates in post-meta keys (`mec_start_date`, `mec_start_time`, …) that are **not
registered with `show_in_rest`**, so the REST payload has **no start/end date at all**. `date` is the
*post-publish* timestamp, not the event date. Usable fields: `id`, `title.rendered`, `link`,
`mec_category[]`, `class_list[]` (category slugs are readable here), `modified`.

Category slugs are the useful signal — `mec_category-adults`, `mec_category-paid`,
`mec_category-manor-house-events`. Fetch
`https://calicolibraries.com/wp-json/wp/v2/mec_category` to enumerate the taxonomy and find the
children/family terms.

Many items `_links_to` **calicoprojects.com**, so events are split across two hosts.

**Effort M** — REST gives a reliable, paginated *index* (181 items) and change detection via
`modified`; the dates require a follow-up fetch of each `link` (JSON-LD/HTML). Worth doing only
after the SE8/SE10/SE13 sources above, since Calico's under-5 share looks small and adult-skewed.

---

## 9. NHS — Greenwich 0–4 clinics (weigh-in & infant feeding)

**CONFIRMED WORKING** — clean, server-rendered, weekday-grouped HTML. No JSON-LD (0 blocks),
no API, but the markup is simple and stable.

### Infant feeding drop-ins — `https://greenwich0to4.co.uk/clinics/infant-feeding-clinics`
HTTP 200, 55,192 bytes. Postcodes are inline in the listing text:
```
41-42 Shirley House Drive, Charlton SE7 7EL
Slade Children's Centre, 10.00AM - 11.30AM Erindale Road, SE18 2QQ
Vista Field Children's Centre 10.00AM - 11.30AM Middle Park Ave, London SE9 5SD
Storkway Children's Centre, 10.00AM - 11.30AM Ridgebrook Rd, London SE3 9QX
Waterways Children's Centre, 10.00AM - 11.30AM Southwood Rd, London SE28 8EZ
Brookhill Children's Centre, 1.00PM - 2.30PM 42 Brumwell Ave, London SE18 6BD
Parkside Infant Feeding Drop in at Parkside Community Centre
  Quaggy Development Trust, Greenwich SE10 8DX
```
Structure: `Monday:` / `Tuesday:` / … headings, then one line per clinic containing
**venue name + time range + street + postcode**. Extraction is a weekday-section split plus a
postcode regex and a `\d{1,2}[.:]\d{2}\s*(AM|PM)` time regex. Also carries dated closure notes
(`(closed Monday 7 September 2026)`) that should be honoured as exceptions.

### Well-baby (weigh-in) clinics — `https://greenwich0to4.co.uk/clinics/well-baby-clinics`
HTTP 200, 53,014 bytes. Same weekday structure, **venue + time but no postcodes**:
```
Tuesday:   Mulberry Park Children Centre 1:30pm-4:00pm
           Vista Field Children and Family Centre 1:30pm-4:00pm
Wednesday: Slade Children's Centre, 9:30am-12:00 noon
           Charlton Family Centre Drop-In 9:30am-12:00 noon
           Brookhill Children's Centre, 1:30pm-3:30pm (closed 8 April)
Thursday:  Storkway Children's Centre, 9:30am-12:00 noon
           Robert Owen Children's Centre 1:00pm-3:30pm (closed …)
Friday:    Waterways Children's Centre 1:00pm-3:30pm
```
Resolve postcodes by joining venue names against the Quaggy ICS `LOCATION` values (§2) — the same
children's centres appear there with full addresses. Robert Owen CC is SE10.

Also: `Clinics closed Tuesday 21 July` style banners appear at weekday level.

### ⚠️ robots.txt gotcha — read this before building
`https://greenwich0to4.co.uk/robots.txt` contains, among ~30 blocked bots:
```
User-agent: *
crawl-delay: 10
...
User-Agent: AppleWebKit
Disallow: /
```
A **`Disallow: /` for the token `AppleWebKit`**. Any browser-mimicking User-Agent string (every
Chrome/Safari UA contains `AppleWebKit`) is therefore arguably disallowed site-wide by a strict
token match. Use a clean product UA such as `GreenwichParentCompass/0.1 (+contact)` that contains
no `AppleWebKit` token, and honour `crawl-delay: 10`. This is a low-volume source (2 pages), so
polling weekly at 10s spacing is trivially compliant.

The `greenwich0to4.co.uk` sitemap (296 URLs) is a shared multi-tenant sitemap that also lists
`bexley0to19.co.uk` and `bromleytalkingtherapies.nhs.uk/greenwich-0-4/…` — the same platform serves
several NHS trusts. The Bexley twin (`bexley0to19.co.uk/0-4-years/well-baby-clinics`,
`/infant-feeding-clinics`) is an identical-shape source for the **DA5–DA18** secondary geography.

---

## 10. Tested and NOT FOUND (recorded so they are not re-tried)

| Target | Tested URL | Result |
|---|---|---|
| Deptford Lounge — The Events Calendar API | `/wp-json/tribe/events/v1/events?per_page=50&start_date=2026-08-12` | HTTP 404 `rest_no_route` — site uses Event Organiser, not Tribe |
| Deptford Lounge — event CPT via core REST | `/wp-json/wp/v2/types` | Event CPT absent (`show_in_rest` off); only core types listed |
| Deptford Lounge — iCal | `/events/feed/` → 404; `/?feed=eo-events` → 404; `/whats-on/?ical=1` → returns HTML, 0 VEVENT; `/whats-on/feed/` → 403 | No iCal |
| Quaggy — WP event CPT | `https://quaggydevelopmenttrust.org/wp-json/wp/v2/types` | No event post type — calendar is the Google embed only |
| Lewisham Council events | `https://lewisham.gov.uk/events` | HTTP 200 but it is a hand-written festivals landing page: 0 JSON-LD, 0 `/events/{slug}` links, no feed |
| Lewisham Council | `https://lewisham.gov.uk/whats-on` | HTTP 404 |
| Lewisham Family Hubs | `https://www.lewishamfamilyhubs.org.uk/rss` | HTTP 200, valid RSS, **0 `<item>`** — advice content only, no events. robots: `Disallow: /professionals` |
| Lewisham Local Offer | `https://lewisham.gov.uk/localoffer` | CMS pages under `/myservices/children-and-young-people-service/local-offer/…`; no directory database, no feed |
| Lewisham FIS directory hosts | `familyinfo.lewisham.gov.uk`, `lewisham.fsd.org.uk`, `lewishamlocaloffer.org.uk` | DNS does not resolve / TLS failure — no Lewisham equivalent of the Greenwich Community Directory exists |
| Royal Greenwich JSON:API | `https://www.royalgreenwich.gov.uk/jsonapi` | HTTP 404 |
| Royal Greenwich REST export | `https://www.royalgreenwich.gov.uk/events?_format=json` | HTTP 406, `Supported formats: html` |
| Calico MEC v1 | `https://calicolibraries.com/wp-json/mec/v1/events` | HTTP 200 but `[]` |
| Calico / Quaggy / Deptford — third-party embeds | grep for bookwhen / eventbrite / churchsuite / teamup / calendar.google | none found except Quaggy's Google Calendar |
| The Play Map — Wix Data API | `POST /_api/cloud-data/v1/wix-data/collections/query` | HTTP 400 `WDE0117: MetaSite not found` (requires instance token) |
| theplaymap.com | `https://theplaymap.com/sitemap.website.xml` | Unrelated US site (Starfield generator); not the UK register |
| RMG robots | `https://www.rmg.co.uk/robots.txt` | HTTP 404 — no robots.txt published (treat as unrestricted but crawl politely) |

---

## 11. Class & booking platforms

### 11a. ClassForKids — CONFIRMED WORKING ★ best cross-provider source for the three districts

`class4kids.co.uk` **301-redirects to `classforkids.io`** — same company, one platform. The brief's
items 1 and 3 collapse into a single source.

```
https://classforkids.io/en-GB/classes/SE10          → 200, text/html, 345 KB
https://classforkids.io/en-GB/classes/SE10  (header: RSC: 1)
                                                    → 200, text/x-component, 66 KB — 5× smaller, identical data
```
Next.js App Router. **No Algolia, no public REST API, no `__NEXT_DATA__`.** The data sits in the RSC
flight payload under the key **`serverSideListings`**, recovered by concatenating the
`self.__next_f.push([1,"…"])` chunks and JSON-parsing. Sending `RSC: 1` is the cheap route.

**Real record (SE10):**
```json
{"type":"KIDS_CLASS","bsurl":"thebabycloudgreenwich.classforkids.io",
 "clubName":"The Baby Cloud Greenwich","distancemiles":0.25,
 "ageFrom":2,"ageTo":13,"postcode":"SE109EQ","clientId":15415,
 "venueName":"The Forum","listingdescription":"…","logoUrl":"…",
 "classActivities":{"10":{"classActivityId":10,"activityName":"Baby Development","activityType":"education"}}}
```

| Need | Field | Notes |
|---|---|---|
| title | `clubName` | |
| venue | `venueName` | |
| **postcode** | `postcode` | no space, e.g. `SE109EQ` — normalise |
| **age range** | `ageFrom` / `ageTo` | **in MONTHS** — under-5 filter is `ageFrom < 60`. Best age data in the whole survey. |
| category | `classActivities[].activityName` + `.activityType` | |
| distance | `distancemiles` | |
| booking | `https://{bsurl}` | `bsurl` is the club *account*, not the venue |

**Measured counts:**

| Postcode | Listings | KIDS_CLASS | Under-5 |
|---|---|---|---|
| **SE8** | 48 | 24 | **13** |
| **SE10** | 48 | 24 | **17** |
| **SE13** | 48 | 24 | **17** |
| SE3 / SE4 / SE14 / SE16 / SE23 | 48 each | 24 each | 10–17 each |

**Union across all 8 postcodes: 82 unique club+venue rows, 47 under-5 relevant, 38 with an SE postcode.**

**Gotchas that shape the adapter:**
- **Hard cap of 24 per type** (24 classes + 24 camps). No pagination — `?page=2` and activity-suffix
  routes return byte-identical results. **Multi-postcode fan-out is the only way to widen coverage.**
- **Never use place names.** `/classes/Deptford` returned a *Wiltshire* village — results 9–13 miles
  away with BA12/SP2 postcodes. Always pass postcodes.
- `KIDS_CLASS` carries **no date, time or price**. Only `KIDS_CAMP` has `campStartDate`,
  `campEndDate`, `campStartTime`, `campEndTime`, `dayPart`. Session times require a second fetch to
  `{bsurl}`, which is Vue-rendered behind session-authed `/api/*` routes
  (`/api/camps/all`, `/api/club/club`, `/api/bookings/*`).

**ToS/robots:** `robots.txt` disallows only `/iframe/*` — the discovery routes are explicitly
permitted. **No website terms-of-use page exists** (`/terms`, `/terms-and-conditions`, `/legal/` all
404 or resolve only to a cookie policy). No scraping prohibition found.

---

### 11b. Bookwhen — the `.ics` pattern is DISPROVEN, but an OpenActive feed exists

**The per-calendar iCal pattern in the brief does not work.**
`https://bookwhen.com/{slug}.ics` → **HTTP 406, zero bytes**, on all 13 real slugs tested
(`dfagreenwich`, `acornplay`, `whippersnappers`, `piece-of-health`, `greenwich-lewisham`,
`playtimes93`, `startstrongfitness`, `ravenyoga`, `secretadventurersclub`, `amcdancetots`,
`allsortstotssuffolk`, `aboutbirthandbabies`, `baby-toddler`). The route resolves but has no iCal
representation. `/{slug}/ical`, `/ical.ics`, `/calendar.ics`, `/feed.ics`, `/events.ics` → 404.
`.ics?entries=all` returns HTML. `bookwhen.com/demo.ics` → 200 HTML is a **false positive**
(`/demo` is Bookwhen's own marketing page).
API: `https://api.bookwhen.com/v2/events` → **401 JSON, key required**.

#### ★ But Bookwhen publishes an official OpenActive RPDE feed — CONFIRMED WORKING

Found via the OpenActive data-catalog collection (see §11d). **Licensed CC-BY 4.0** — the cleanest
ToS position of any source in this report.

```
https://data.bookwhen.com/                                   ← dataset landing page (HTML + JSON-LD)
https://bookwhen.com/api/openactive/sessionseries            → 200, application/json
https://bookwhen.com/api/openactive/scheduledsessions        → 200
https://bookwhen.com/api/openactive/events                   → 200
https://bookwhen.com/api/openactive/courseinstances          → 200
```

Standard RPDE envelope `{next, license, items}`. Feeds are ordered by modification timestamp from
the beginning of time; jump forward with `?afterTimestamp={unix}&afterId=0`.
Verified live 2026 data: `?afterTimestamp=1770000000&afterId=0` → 50 items, 20 with `data`.

**`ScheduledSession`** (the occurrence) — real item:
```json
{"@type":"ScheduledSession",
 "@id":"https://bookwhen.com/api/openactive/scheduledsessions/cyrxtljgp0ue_2026-09-04T08:00:00Z",
 "superEvent":"https://bookwhen.com/api/openactive/sessionseries/cyrxtljgp0ue",
 "startDate":"2026-09-04T08:00:00Z","endDate":"2026-09-04T09:00:00Z","duration":"PT1H",
 "remainingAttendeeCapacity":6,
 "url":"https://bookwhen.com/api/openactive/schedules/fitnesswithfaye/s9ovm/2026-09-04T08:00:00Z",
 "beta:attendeeCount":0}
```

**`SessionSeries`** (the descriptive parent, reached via `superEvent`) — key union observed:
`name, description, activity, ageRange, location, offers, organizer, leader, category, level,
isCoached, genderRestriction, isAccessibleForFree, accessibilityInformation, accessibilitySupport,
eventSchedule, subEvent, maximumAttendeeCapacity, specialRequirements, attendeeInstructions,
eventAttendanceMode, image, url, beta:formattedDescription, beta:isWheelchairAccessible`.

| Need | Field |
|---|---|
| title | `SessionSeries.name` |
| start/end/duration | `ScheduledSession.startDate` / `.endDate` / `.duration` |
| **postcode** | `SessionSeries.location.address` — **a free-text string** in 28 of 31 sampled (3 null); extract by regex |
| **age** | `SessionSeries.ageRange.minValue/maxValue` — **present on only 5 of 31 (16%)**, and those sampled were adult classes |
| price | `SessionSeries.offers[].name/.description` |
| activity | `SessionSeries.activity[].prefLabel` (OpenActive activity-list concepts) |
| capacity | `ScheduledSession.remainingAttendeeCapacity` |
| booking | `SessionSeries.url` → `https://bookwhen.com/{slug}?entry={id}&r=oa` (reveals the provider slug) |

**Honest assessment:** it is national and time-ordered, so reaching SE8/SE10/SE13 means walking the
whole feed and filtering on a postcode regex over a free-text address. `ageRange` is too sparse to
drive under-5 filtering. **But** the project already has an RPDE harness for Better/Southwark/
Tower Hamlets, so the marginal build cost is low and the licence is impeccable.

#### Fallback: Bookwhen schedule pages are server-rendered and public
```html
<tr data-hook="agenda_list_item" data-event="ev-s34dy-20260812103000"
    data-tickets="ti-s34dy-20260812103000-ti4xv …" class="clickable">
  <td class="dom">12</td><td class="dow">Wed</td>
  <td class="duration"><span class="time_span">10:30am <span class="timezone_label">BST</span></span></td>
  <td class="summary"><button…>Baby &amp; Toddler Music (12 months to 4 years) - 10.30am - 11.00am - Brockwell Lido - Any Tutor</button></td>
</tr>
```
`data-event` encodes **`ev-{entryId}-{YYYYMMDDHHMMSS}`** — a reliable machine-readable timestamp.
`data-options` exposes `{"calendar":"ayag8mzyxbns","offset":0,"row_count":20,"limit":20,"cursor":[…]}`.
**Weakness:** title, venue and age are all free text jammed into one `summary` string, and there is
no postcode anywhere. `row_count` is provider-configured (20 or 100), not a URL param.

**Real SE-London slugs confirmed HTTP 200:** `piece-of-health` (Deptford SE8, parent-and-baby),
`greenwich-lewisham`, `greenwichpantryevents`, `ravenyoga` (SE10), `wellnessbylaura` (SE4),
`precision-yoga` + `chgroupclasses` (SE23), `whippersnappers` (baby/toddler music, SE21/SE24),
`secretadventurersclub`, `cadleydance`, `globefitkidsclubs`, `sportworkslondon`.

**Slug-discovery trick worth keeping:** the Wayback CDX API is unblocked and yields slugs in bulk —
`http://web.archive.org/cdx/search/cdx?url=bookwhen.com*&output=json&fl=original&collapse=urlkey&limit=40000&filter=statuscode:200`
→ **3,356 distinct real slugs.**

**ToS/robots:** `robots.txt` disallows only `*/basket` and `*/checkout`. Terms scanned for
scrap/automat/robot/spider/crawl/harvest — **no prohibition on automated access** (it is a B2B
subscription agreement for organisers).

---

### 11c. Franchise networks — 3 strong, 3 usable, 4 dead

**Little Kickers — CONFIRMED WORKING, best franchise source**
```
https://www.littlekickers.co.uk/wp-json/jpl-locator/v1/locations/?lat=51.4826&lng=-0.0077&radius=5&units=mi
→ 200, application/json, 279 KB, 42 items, 12 in target postcodes
```
| Venue | Postcode | Distance |
|---|---|---|
| Greenwich New Haddo Centre | **SE10 9JU** | 0.41 mi |
| Greenwich West Community Arts Centre | **SE10 8JA** | 0.52 mi |
| Deptford Oak Gardens Primary | **SE8 4QF** | 1.19 mi |
| Lewisham Prendergast Vale School | **SE13 7BN** | 1.36 mi |

Fields: `data.title`, `data.zip_code`, `data.lat/lng`, `data.distance`; the `html` field carries the
timetable as `<tr data-class_program data-class_day>` with **age range, time and booking link**.
The only source combining venue + day + time + age + booking in one call.
*Caveat: `zip_code` is dirty — `"se30tp"`, `"SE13 7BN NB"` — normalise.*

**Tumble Tots — CONFIRMED WORKING, cleanest contract**
```
https://www.tumbletots.com/wp-admin/admin-ajax.php?action=wd_tt_all_locations_data&limit=500&postcode=SE10%208XJ&radius=10
→ 200, application/json, 6 rows — genuine server-side radius filtering
```
Fields: `name`, `address` (postcode on the last line), `class_days[]`, `lat/lng`, `distance_miles`,
`franchise_url`. `robots.txt` explicitly `Allow: /wp-admin/admin-ajax.php`.

**Baby Sensory / WOW World Group — CONFIRMED WORKING, best coverage per request**
```
https://www.wowworldgroup.com/find-a-class → 200, 1 MB, inline `const allVenues = [...]`
→ 2,538 venues, 11 in SE3/4/8/10/13
```
Covers **Baby Sensory + Toddler Sense + Mini Professors** via a `ProductStream` field. Fields:
`Name`, `PostCode`, `AddressLine1/2`, `Latitude`, `Longitude`, `RunningDays[]`, `MiniSiteUrl`.
No times, prices or ages.

**Also usable:**
- **Rugbytots** — 541 venues inline; per-class pages (enumerable from `sitemap.xml`) give the richest
  data anywhere: date range, day, time, age, duration, spaces, `£96.00 total / £9.50 per session`,
  venue, postcode. Cost: one request per class.
- **Sing and Sign** — 572 rows inline, 6 SE-London venues. ⚠️ the `?postcode=` param **does not
  filter** — responses are byte-identical; filter client-side.
- **Water Babies** — `/wp-json/wp/v2/location?region=60` (london-south-east) → 485 pools, but
  **no postcode or lat/lng in the REST `meta`**. See the robots caution below.

**NOT FOUND:** Hartbeeps (403 Cloudflare), Monkey Music (`monkeymusic.com` NXDOMAIN; `.co.uk` 403),
Diddi Dance (no API, though a Lewisham franchise exists), Gymboree (US-only, no UK operation).
Boogie Beat has a working ASL JSON endpoint but **zero SE London presence**.

---

### 11d. OpenActive — publishers in the catalogue that are NOT yet built

The catalogue collection enumerates **174 datasets** across 4 catalogues:
```
https://openactive.io/data-catalogs/data-catalog-collection.jsonld → 200, 4 catalogues
  ├ https://opendata.leisurecloud.live/api/datacatalog                        (32)
  ├ https://openactivedatacatalog.legendonlineservices.co.uk/api/DataCatalog  (31)
  ├ https://openactive.io/data-catalogs/singular.jsonld                       (23)
  └ https://app.bookteq.com/api/openactive/catalogue                          (88)
```
Only **Southwark** and **Tower Hamlets** appear with SE-London borough names, and both are already
built. But several **aggregator and national-operator** feeds are unbuilt and do reach SE London:

| Publisher | Feed URLs | Licence | Verdict |
|---|---|---|---|
| **Bookwhen** | `https://bookwhen.com/api/openactive/{sessionseries,scheduledsessions,events,courseinstances}` | CC-BY 4.0 | **CONFIRMED WORKING** — see §11b |
| **TeamUp (goteamup)** | `https://goteamup.com/api/openactive/v1/{sessionseries,scheduledsessions,events}` | CC-BY 4.0 | **CONFIRMED WORKING** — 100 items/page; data keys `@id, @type, name, startDate, endDate, duration, superEvent, url`. Note: this is the *fitness-business* TeamUp, **not** the `teamup.com` calendar product in §11e. |
| **Open Sessions** | `https://opensessions.io/api/rpde/session-series`, `/api/rpde/events` | CC-BY 4.0 | **CONFIRMED WORKING** — 500 items/page |
| **Our Parks** | `https://ourparks.org.uk/api/events` | CC-BY 4.0 | **CONFIRMED WORKING but NOT RELEVANT** — 222 items/page, rich schema (`ageRange`, `location.address.postalCode`, `geo`, `activity`, `isAccessibleForFree`), **but every sampled item had `ageRange.minValue: 10`** — adult/teen outdoor fitness. Postcodes seen: SE2, SE24, DA14–DA17, RM9. |
| GLL via Legend | `https://gll-openactive.legendonlineservices.co.uk/OpenActive` | — | **LIKELY** — a *second* GLL feed distinct from the already-built `better-admin.org.uk`. Worth diffing for extra Greenwich/Lewisham sites. |
| Everyone Active | `https://data.everyoneactive.com/OpenActive/` | — | LIKELY (national operator) |
| Places Leisure | `https://placesleisure.gs-signature.cloud/OpenActive/` | — | LIKELY (national operator) |
| Southwark via Bookteq | `https://southwarkcouncil.bookteq.com/api/open-active` | — | LIKELY — a *different* Southwark feed from the leisurecloud one already built |

All four confirmed feeds are **CC-BY 4.0**, which is the lowest ToS risk of anything in this report.

---

### 11e. TeamUp (teamup.com calendars) — NOT FOUND

`https://api.teamup.com/{key}/events?startDate=&endDate=` → **HTTP 400,
`"Teamup-Token header is missing"`** — confirmed key-gated. `.ics` on non-existent keys 404s as
expected. **Zero real in-area calendars found** — TeamUp keys are shared by direct link and are
effectively unindexed. `robots.txt` disallows `/ks*`, `/events/`, `/c/` — **the calendar URLs
themselves are robots-disallowed.** Deprioritise; acquire keys directly from providers if ever needed.

---

### 11f. 🔴 Happity — DO NOT CRAWL

`happity.co.uk` is the closest competitor and gives the clearest possible opt-out signal:
- returns **403 to curl** (Cloudflare)
- `robots.txt` has explicit **`Disallow: /` for ClaudeBot**, GPTBot, CCBot, Google-Extended, Bytespider
- sends **`Content-Signal: ai-train=no`**

Treat as fully off-limits. Recorded here so nobody re-tests it.

---

## 12. Museums & attractions

### 12a. Old Royal Naval College (SE10) — CONFIRMED WORKING (metadata only)
```
https://ornc.org/wp-json/            → 200, 20 namespaces, 361 routes (no tribe namespace)
https://ornc.org/wp-json/wp/v2/posts?per_page=100  → 200, X-WP-Total: 68
```
Key quirk: **there is no event CPT — the default `post` type is relabelled "Events"**
(`name: "Events"`, `rest_base: "posts"`). All `link` values are `https://ornc.org/whats-on/{slug}/`.

**Under-5 identifiability: GOOD.** `https://ornc.org/wp-json/wp/v2/categories?per_page=100` → 11 terms:
`whats-on` (46), `concerts`/"Performance" (13), `after-hours` (12), **`family-fun` id=65 (10)**,
`exhibition` (9), `outdoor` (9), `talks-tours` (9), `wellbeing` (7), `christmas` (5), `film-tv` (5).
Tags include **`events-for-kids` (6), `family-events-london` (7), `greenwich-family-events` (5),
`family-fun` (3), `baby-yoga` (1)**.

**Critical gap:** start date, time, price and venue are **not in the API**. `acf` is `[]` on all 10
posts sampled; `meta` holds only `_acf_changed`/`footnotes`; the Yoast schema graph is
`Article/WebPage/BreadcrumbList/WebSite/Person` — **no Event**. The `date` field is the WP publish
date. Real values exist only as page text (`"Thu 9 Apr | 11am-3pm"`, `"Tickets: £ Free"`,
`"King William Lawns"`), so a detail-page scrape is required for scheduling.
robots: `Disallow:` (nothing blocked).

### 12b. Surrey Docks Farm (SE16) — CONFIRMED WORKING (catalogue, no dates)
Canonical host is the apex `https://surreydocksfarm.org.uk` (`www.` 301s away). WordPress +
WooCommerce + WooCommerce Bookings + FacetWP. Types: `post, page, faq, product, bookable_resource, wc_booking`.
```
https://surreydocksfarm.org.uk/wp-json/wc/store/v1/products?per_page=50 → 200, X-WP-Total: 18
```
Fields: `id, name, slug, permalink, short_description, description, prices.price` (**minor units** —
`1000` = £10.00), `prices.currency_code`, `price_html`, `categories[]`, `tags`, `is_in_stock`, `add_to_cart`.

The 18 products *are* the activities, several under-5 relevant: `Family Piglets Club £30`,
`Summer Family Farmers £9`, `Lamb Feeding £10`, `Calf Feeding £10`, `Forest School at the Farm £10`,
`Froglets After-School Club £0`, `Farm Club £42`, `Yoga on the Farm £5`.

**NOT FOUND:** dates/times — scheduling lives in WooCommerce Bookings; `wc-bookings/v1`,
`bookable_resource` and `wc_booking` are all auth-gated. Taxonomy is useless
(`room-hire` 1, `uncategorized` 6) — age is inferable only from the product name.

### 12c. Royal Museums Greenwich (SE10) — LIKELY (sitemap + scrape)
Drupal 10. **JSON:API is disabled** — tested thoroughly: `/jsonapi`, `/jsonapi/`,
`/jsonapi/node/event`, `/api`, `/views/ajax` all → **404**. No JSON-LD on `/whats-on` or on a single
event page (0 `application/ld+json`, 0 `itemprop`, 0 `<time datetime>`). No Algolia/Elastic/Solr.
`/events.ics` → 404. `/rss.xml` → 200 (540 KB) but only 10 items, all `/stories/` articles.

**Working:** `https://www.rmg.co.uk/sitemap.xml` → 200, 402,408 bytes, **2,363 URLs of which 552 are
under `/whats-on/`**. `/whats-on` renders `.event-teaser` cards server-side (40 unique links):
`.event-teaser__title`, `.event-teaser__description`, `.event-teaser__times`
(`"Daily until 30 September 2026"`, `"Thursday 24 September 2026 | 6.30-8.30pm"`),
`.event-teaser__price` (`"Free entry"`), `.event-teaser__lozenge` (venue), container class `location-{venue}`.

Venue is machine-readable via `location-*`: `national-maritime-museum`, `cutty-sark`, `queens-house`,
`royal-observatory`, `prince-philip-maritime-collections-centre`, `in-greenwich`, `online`.
Type vocabulary from slider `data-filter-value`: `exhibitions`, `events and festivals`,
**`family fun`**, `talks and tours`, `experiences`, `courses`, `workshops`.
Real under-5 events identifiable by slug: `play-tuesdays`, `sensory-sailors`, `sensory-social-club`,
`discover-sundays`, `lgbtq-family-network`. **All dates are human-readable strings — no ISO anywhere.**
robots.txt → 404 (no constraints).

**Cutty Sark** has no separate site (`cuttysark.org.uk` does not resolve); it is covered under
`rmg.co.uk/whats-on/cutty-sark/*` and the `location-cutty-sark` class.

### 12d. Horniman Museum & Gardens (SE23) — LIKELY (sitemap + scrape)
WordPress, headless-ish (CMS origin `cms-live.thehorniman.net`). `/wp-json/` → 404, but
`?rest_route=/` → **200** and exposes the full route table. However **every collection is 401**
(`itsec_rest_api_access_restricted`): `?rest_route=/wp/v2/posts`, `/wp/v2/types`, `/wp/v2/categories`,
`/wp/v2/Product`, `/wp/v2/Season`. `/event/feed/` → 500. JSON-LD is the Yoast WebPage graph only.

**Working:** `https://www.horniman.ac.uk/sitemap_index.xml` → `event-sitemap.xml` = **215 event URLs**,
plus `series-`, `workshop-`, `event_type-`, `price_type-`, `location-`, `access-`, `subject-` sitemaps.

**Under-5 vocabulary is excellent but NOT joined to events.** `audience-sitemap.xml` → 23 terms
including **`children-under-5`, `under-3s`, `children-6-and-under`, `children-2`, `children-3`,
`children-3-7`, `children-4-6`, `all-children`, `children-0-11`, `families`**.
`age-sitemap.xml` → 10 school terms (`nursery-aged-3`, `reception`, `key-stage-1`…).
But `/audience/children-under-5/` → 200 with **0 event links server-rendered**, and the `/whats-on/`
filter UI is client-side — `data-filter-key="audience|type|access"` appears only on dropdown items,
**not on the event cards**. So audience-per-event is not publicly machine-readable.

`/whats-on/` → 200, **14 current events**, no pagination, clean scrapeable cards:
```html
<div class="meta-section">Event</div>
<h3>Music Jerk &#8216;n Tings</h3>
<div class="date">22 August 2026</div>
<div class="time">2pm – 6pm</div>
<div class="excerpt">Celebrate Caribbean culture with festival of live music, food and family friendly…</div>
```
Detail pages carry `.date`, `.time`, `.prices` (`"Child £10"`), `.tickets`.
robots: **`Crawl-delay: 5`**, no Disallow.

### 12e. Discover Children's Story Centre (E15) — LIKELY; best age taxonomy found anywhere
WordPress with an **`Event` CPT (capital E)**. **REST is blocked:** `/wp-json/` root → 200 (route
table readable) but every collection → **401**
`{"code":"itsec_rest_api_access_restricted", …"Kadence Security settings"}` — including
`/wp/v2/Event`, `/wp/v2/types`, `/wp/v2/taxonomies`, even `/wp/v2/pages/24`.
RSS `/feed/` → 500, `/event/feed/` → 404. No Event JSON-LD.

**Working:** `https://discover.org.uk/sitemap_index.xml` → `event-sitemap.xml` = **67 event URLs**;
and **`spektrix_age_range-sitemap.xml` → 5 terms: `/age-range/0-1/`, `/2-3/`, `/4-5/`, `/6-8/`,
`/9-11/`** — three of five are under-5. This is exactly the product's segmentation.

**Caveat:** the age-range archives return **200 with a 0-byte body**, and the REST taxonomy is 401 —
so the terms are visible but event→age-band membership is not machine-readable publicly. Under-5 is
still inferable from slugs (`wakey-wakey-0-5-storytelling…`, `baby-and-toddler-sensory-story-space`).
Ticketing is **Spektrix** (`webcomponents.spektrix.com/...`) — **the Spektrix API for this client is
the real integration path**, and the project already has a Spektrix adapter. robots.txt → 404.

### 12f. Greenwich+Docklands International Festival — LIKELY (seasonal)
WordPress. `/wp-json/` → 200, 9 namespaces. `event`, `season`, `venue` CPTs exist **but are not
REST-exposed** — `/wp/v2/event`, `/wp/v2/season`, `/wp/v2/venue`, `/wp/v2/event-type`, `/wp/v2/genre`,
`/wp/v2/access` all → 404. `/wp/v2/posts` → 200 but `X-WP-Total: 8` (blog only).
`/sitemap_index.xml` → 404; **`https://festival.org/wp-sitemap.xml` (WP core) → 200**:
- `wp-sitemap-posts-event-1.xml` → **237 event URLs** (`/gdif/whats-on/{slug}/`)
- **`wp-sitemap-taxonomies-event-type-1.xml` → 15 terms** including **`family-friendly`,
  `great-for-kids`, `sensory-spectacle`, `speech-free`**, plus access terms `audio-description`,
  `bsl`, `captioned`, `touch-tour`, `easy-read-information`

Most of the 237 are historical (slugs like `gdif-oyd-plumstead-2020`). GDIF is a ~10-day festival —
a seasonal, not continuous, source. robots: `Allow: /wp-admin/admin-ajax.php`.

### 12g. 🔴 Mudchute Park & Farm (E14) — BLOCKED by robots
**Squarespace.** No events collection: `/events` → 404, `/calendar` → 404, `/whats-on` → 200 with an
**empty `mainContent` layout div**. `robots.txt` explicitly disallows the Squarespace JSON and iCal APIs:
```
User-agent: *
Disallow: /api/
Disallow:/*?format=json      Disallow:/*&format=json
Disallow:/*?format=ical      Disallow:/*&format=ical
Disallow:/*?format=page-context   Disallow:/*?format=main-content
Disallow:/*?tag=   Disallow:/*?view=   Disallow:/*?month=   Disallow:/*?author=
```
So although `?format=json` does respond 200, **do not use it in production.**
For the record (so the loss can be judged): `/news?format=json` → collection `"News & Events"`,
`itemCount 132`, cursor pagination. **Every item had `tags: []` and `categories: []`** and
`publishOn` is the post date, not an event date — so even if permitted it carries no scheduling.
**Only robots-allowed source:** `https://www.mudchute.org/sitemap.xml` → 615 URLs. Events are
announced as prose news posts (`easter-at-mudchute-2026`, `may-half-term-2026`).

### Cross-cutting museum findings
- **No venue runs The Events Calendar (Tribe)** — `tribe/events/v1` was absent everywhere.
- **No venue emitted a schema.org `@type: Event`** on any page.
- **No working iCal anywhere** across all 8 venues.
- Two venues (Horniman, Discover) have exactly the under-5 age vocabulary this product needs, but
  both gate it behind a 401 REST API and empty archive pages. **Both are worth a direct data request
  — the data demonstrably exists in their CMS.**

---

## 13. Churches — ChurchSuite, A Church Near You, and what actually pays off

Churches were hypothesised to be ~22% of under-5 supply and the largest unindexed pool. The feeds
**exist and work**, but the honest empirical answer is: **the platforms are machine-readable; the
under-5 content in them is not.** Details below, including the two genuinely valuable finds.

### 13a. ChurchSuite — CONFIRMED WORKING, but near-zero under-5 yield in-area

**1,909 candidate slugs were tested.** Response codes discriminate cleanly:

| Code | Meaning |
|---|---|
| `302` → `https://churchsuite.com/` | slug does not exist |
| `200 application/json` | live public calendar |
| `200` + body `[]` | account exists, calendar empty/private |
| `403` (1,257-byte ChurchSuite page) | account exists, embed disabled |

**Only `/embed/calendar/json` gets past Cloudflare.** Plain curl + a UA string suffices — no cookies,
no Referer.

| Path | Result |
|---|---|
| `/embed/calendar/json` | **200 `application/json`** ✅ |
| `/embed/calendar/json?merge_practices=1` | 200, byte-identical to base |
| `/embed/calendar/ical` | **403 — Cloudflare managed challenge** (`cf_chl_opt`) |
| `/embed/calendar/` (HTML widget) | **403 — same challenge** |
| `/embed/calendar.ics`, `/calendar/ical`, `/embed/calendar/ics` | 403 |

**Query params — confirmed** (baseline 433 events): `?date_start=YYYY-MM-DD&date_end=YYYY-MM-DD`
works and reaches beyond the default ~110-day window (2027-01→06 returned 84);
`?category=22` → 48; `?num_results=5` → 5; `?featured=1` → 49. `?page=` and `?site_id=` are ignored.

**Confirmed shape** — top level is a **bare array**. Keys: `id, identifier, sequence, name,
datetime_start, datetime_end, description, category, status, visible_to, brand, capacity, images,
location, signup_options, site, site_ids, pin, public_visible, mtime, muser, ctime, cuser,
merged_by_strategy`.

```json
{"id":9141,"identifier":"pxc2wga9","name":"Social Supermarket Volunteer - Set Up & Prep",
 "datetime_start":"2026-08-12 09:30:00","datetime_end":"2026-08-12 11:30:00",
 "description":null,"category":{"id":22,"name":"Love Brockley","color":"#fa5252"},
 "status":"confirmed",
 "location":{"address":"SE4 1LT","latitude":51.464391,"longitude":-0.031386,"name":"","type":"physical"},
 "signup_options":{"signup_enabled":"1","tickets":{"url":"https://stpetersbrockley.churchsuite.com/events/pxc2wga9"}},
 "site":{"id":1,"name":"Main site","address":{"line1":"St Peter's Brockley","line2":"Wickham Road","city":"London","postcode":"SE4 1LT"}}}
```

| Need | Field |
|---|---|
| title | `name` |
| start/end | `datetime_start` / `datetime_end` — `"YYYY-MM-DD HH:MM:SS"`, local, **no TZ offset** |
| **postcode** | ⚠️ `location.address` is unreliable free text — **use `site.address.postcode`**, a structured `{line1,line2,line3,city,county,postcode,country}` object |
| lat/lng | `location.latitude` / `.longitude` |
| category | `category.{id,name,color}` |
| signup | `signup_options.signup_enabled` (`"1"`/`"0"`), `signup_options.tickets.url` |

**Live in-area slugs found:**

| Slug | Church | Postcode | Events | Range | with lat/lng | with signup |
|---|---|---|---|---|---|---|
| `stpetersbrockley` | St Peter's Brockley | **SE4 1LT** | **433** | 2026-08-12 → 11-30 | 356 | 360 |
| `stjamesse3` | St James' Kidbrooke | **SE3 0DU** | **121** | 2026-08-16 → 11-30 | 62 | 62 |
| `kingsconnect` | King's Church London (Lee 26, Downham 17, Catford 1) | SE6/BR3 | 44 | 2026-08-13 → 11-26 | 24 | 20 |
| `stjohnsblackheath` | St John the Evangelist | **SE3 7TH** | 2 | 2026-08-25 → 09-11 | 2 | 2 |

Accounts that exist but return `[]` (operationally useless): `elimlewisham`, `hgbc`, `stnicks`,
`ichthus`, `bridgechurch`. `crossway` → 403 (embed disabled).

> **⚠️ No live ChurchSuite slug exists in SE8, SE10 or SE13**, and under-5 content in the four live
> feeds is essentially nil: Brockley's 433 events are 327 "Dance" + 50 "Services" + 48 "Love
> Brockley", with only *"Little Stars Ballet"* (a private hirer) matching; St James Kidbrooke's 121
> are all `category: "General"`.

**Discovery:** guessing slugs is low-yield; **grepping real church website HTML is high-yield**
(`kingsconnect` would never have been guessed). `churchsuite.com/sitemap.xml`, `/customers/` and
`/case-studies/` are all 403 — **there is no public slug directory.** The best discovery source
found was the **OpenStreetMap Overpass API** (free, unauthenticated):
```
POST https://overpass-api.de/api/interpreter
data=[out:json];nwr["amenity"="place_of_worship"](51.440,-0.075,51.500,0.030);out tags center;
→ 178 places of worship, 37 with website tags
```
⚠️ **Send no custom User-Agent to Overpass — it returns 406.**
⚠️ **False-positive warning:** `greenwichbaptistchurch.org` is Greenwich, **New Jersey**. Verify by postcode.

**robots/ToS:** `churchsuite.com/robots.txt` → `User-Agent: * / Allow: /` plus
`Content-Signal: ai-train=yes, search=yes, ai-input=yes`. Fully permissive, no crawl-delay.

### 13b. ★ Christ Church East Greenwich — the standout SE10 church feed
```
https://www.christchurcheastgreenwich.org.uk/wp-json/tribe/events/v1/events?per_page=50
→ 200, 523 events, total_pages: 11
https://www.christchurcheastgreenwich.org.uk/events/?ical=1 → 200, text/calendar
```
Fields: `id, title, description, excerpt, url, start_date, end_date, utc_start_date, timezone,
all_day, cost, website, categories[], tags[], venue{}, organizer{}` — with **`venue.zip` = `"SE10 9EQ"`**
and `venue.geo_lat` / `venue.geo_lng`. **The cleanest geodata of anything tested in this report**,
and it sits in a top-priority postcode. Build this.

`https://www.stjohnsblackheath.org.uk/wp-json/tribe/events/v1/events` → 200, **27 events** (SE3 7TD)
— *more than its own ChurchSuite feed's 2*. Its `/events` page also emits schema.org
`@type: Event` JSON-LD with `startDate` + `location.Place`.

### 13c. ★ A Church Near You — undocumented public JSON API, CONFIRMED WORKING
ACNY is **Django/DRF, not Next.js** — `buildId` and `__NEXT_DATA__` grep to 0 on every church page;
no `/_next/data/` route exists. The API was found inside `/static/js/search_map.51338448ec38.js`
and independently re-verified: 200 `application/json`, **no auth, cookie or Referer needed**.

```
GET https://www.achurchnearyou.com/api/internal/venues/venue/
      ?filter_geo_lat=51.4781&filter_geo_lon=-0.0219&filter_geo_radius=3&ordering=filter_geo_distance
→ count: 94
GET https://www.achurchnearyou.com/api/internal/venues/venue/621/   → 200 (detail)
```
Params: `filter_geo_lat`, `filter_geo_lon`, `filter_geo_radius` (**miles**),
`ordering=filter_geo_distance`, `tags=` (repeatable), `limit`/`offset` (default 100, 500 works).
⚠️ **`postcode=` is silently ignored** (returns all 20,685 venues) — filter client-side.

```json
{"id":621,"is_church":true,"church_reference":637206,
 "name":"S. Paul's, Deptford","postcode":"SE8 3DS","lat":51.479706,"lon":-0.024497,
 "acny_url":"/church/621/","filter_geo_distance":0.157,
 "tags":["toilets","baby","parking","access_lav","wheel","largep", …],
 "church":{"benefice":{…},"diocese":37,"parish":370206},
 "upcoming_events":[{"id":76172,"name":"Morning Prayer","next":"2026-08-12T09:15:00+01:00"}]}
```
`upcoming_events` is **capped at 3** and gives only the *next* occurrence.
`tags=` matches venue-level **and** event-level tags — `?tags=parentstoddlers` on the 3-mile Deptford
query → **count 13**.

**Per-church iCal — CONFIRMED WORKING (undocumented).** The shapes in the brief all 404; the real routes are:
```
/church/{id}/service-and-events/feed/                    → whole-church .ics
/church/{id}/service-and-events/events/{eventId}/feed/   → single-event .ics
```
Verified: church 621 → **200 `text/calendar; charset=utf8`, 318,990 bytes, 448 VEVENT**;
691 → 27 VEVENT; 647 → 246; 683 → 232; 555 → 150; 689 → 60. Recurrences are **pre-expanded
(no RRULE)**, ~6 months forward, with `GEO:` and `LOCATION:`.
⚠️ **`CATEGORIES:` is always empty — the iCal carries no tags.**

**JSON-LD — confirmed, with a split:** `/church/{id}/` → `@type: "Church"` only (name, postalCode,
geo), **no Event**. `/church/{id}/service-and-events/` → the Church object gains an **`events[]`
array with real `@type:"Event"` + `startDate`/`endDate`** (~8–9 max), but **no tags** — a toddler
group is indistinguishable from a Eucharist there.

**Church counts in the priority districts — SE8 = 3, SE10 = 7, SE13 = 5 (15 total; 26 across all six):**
- **SE8:** 617 Deptford St John · 620 St Nicholas Deptford · **621 S. Paul's Deptford**
- **SE10:** 554 The Ascension (SE10 8AW — *not* SE3) · 631 Christ Church East Greenwich · 647 St Alfege ·
  7344 ORNC Chapel · 19605 Holy Trinity Greenwich Peninsula · 33193 Grace Church Greenwich · 33269 Okutendereza
- **SE13:** 618 Deptford Holy Trinity · 683 St Margaret's Lee · 689 St Mary the Virgin Lewisham ·
  690 St Stephen's Lewisham · 691 St Swithun's Hither Green
- SE3: 552, 553, 555, 632, 669, 671 · SE4: **622 St Peter's Brockley** · SE14: 651, 652, 653, 654

The sitemap (`/sitemap.xml` → `sitemap-church-home.xml`, 15,778 URLs) is **useless for geo-targeting**
— bare numeric IDs, no postcodes. `/search/?q=` is not a real param, `/benefice/` is 404, and
`/search/` results are never server-rendered (XHR-filled), so scraping it is pointless.

**robots:** `Allow: /`, sole exclusion `Disallow: /christmas/events/`. No crawl-delay.

**Recommended ACNY pipeline:** one `venue/` call at `radius=5` around `51.47/-0.025` with
`limit=500` → filter `is_church && postcode` client-side → re-query with the under-5 `tags=` set to
shortlist → scrape `/church/{id}/facilities/` for prose and
`/church/{id}/service-and-events/events-all/` for dated tagged events → optionally pull the `.ics`.

### 13d. Other church platforms tested
- **Squarespace** (New Life Church SE10, `ichthusnewlife.org.uk`): `/events?format=json` → 200,
  `{upcoming:[], past:[30]}`, dates as **epoch millis**. Currently 0 upcoming; `location` lat/lng is
  a Squarespace default (NYC) — untrustworthy.
- **EventON** (Winners Chapel Lewisham): `/wp-json/wp/v2/ajde_events` → 200, 20 items.
- **ChurchDesk** (All Saints Blackheath, org 2649): **NOT FOUND** — every `api2.churchdesk.com` path
  404s; no JSON-LD Event.
- **ChurchInsight** (St Alfege SE10, Blackheath Quakers): no feed, no JSON-LD.
- **No feed at all:** St Nicholas Deptford (SE8), `sswsml.com` (St Stephen SE13), `se3.org.uk`,
  Hither Green Baptist (SE13), St George's Westcombe Park — their `/rss`, `/feed`, `/events/feed` are
  plain WordPress blog feeds.

### 13e. ⚠️ The honest verdict on church under-5 data
Under-5 provision demonstrably exists but is **prose, not data**:
- Hither Green Baptist (SE13): *"Kingdom Tots! Our midweek drop in for Toddlers and babies… Mondays 9:30"*
- St Saviour's Brockley Rise: *"Little Church: …for under 5s (with their carers), baby and toddler friendly"*
- St George's Westcombe Park: *"Messy Church Goes Wild"*

Across **all 49 events at all 15 SE8/SE10/SE13 churches, only 7 carry a core under-5 tag, and every
one is a Sunday service with creche/Sunday-school attached** — not a standalone group. The genuine
toddler groups have **no dated event record at all**, existing only as venue tags plus prose:
- **683 St Margaret's Lee (SE13)** — richest: *"Newborn to 5 years welcome… Mondays and Wednesdays
  9:30–11:15… Kingswood Halls, **SE13 5BU**"* (note: venue postcode ≠ church postcode)
- **691 St Swithun's Hither Green (SE13)** — tags `[messychurch, parentstoddlers, playgroup]`, **no descriptions**
- **689 St Mary Lewisham (SE13)** — *"Creche available."*
- **555 St Michael & All Angels Blackheath Park (SE3)** — Pond Road Parent & Toddler, Thu 9:45–11:45 term time

Only **4 of 26** churches carry a venue-level core under-5 tag; only **2** have prose good enough to publish.

Relevant tag slugs: `parentstoddlers`, `Baby_and_toddler_group`, `playgroup`, `preschool`, `creche`,
`messychurch`, `sunday_school`, `holidayclub`. (⚠️ `baby` = baby-changing **facility**, not an activity.)

**Realistic expectation:** these feeds are good enough to build a reliable *"which churches near me
have under-5s provision"* **index**, but **not** to auto-populate day/time listings for SE8/SE10/SE13.
Budget for hand-verifying ~4–5 records (and phoning St Swithun's). The original ~22%-of-supply
hypothesis is **not realisable from feeds alone** — it needs an outreach/claim flow.

---

## 14. Additional in-area venue probes (reusable-pattern sweep)

Probing `/wp-json/wp/v2/types` for an event CPT across further SE8/SE10/SE13 venues:

| Venue | Host | Result |
|---|---|---|
| **Deptford X** (SE8) | `www.deptfordx.org` | **`tribe_events` present.** `https://www.deptfordx.org/wp-json/tribe/events/v1/events?per_page=10&start_date=2026-08-12` → HTTP 200, valid Tribe envelope, but `total: 0` (festival is autumn-seasonal). **LIKELY** — endpoint works, re-check nearer the festival; low under-5 relevance. |
| Age Exchange (SE3) | `www.age-exchange.org.uk` | WordPress, **no event CPT** — NOT FOUND |
| Creekside Discovery Centre (SE8) | `www.creeksidecentre.org.uk` | HTTP 200 but **zero-byte body** under both a product UA and a browser UA — JS-only or misconfigured. NOT FOUND via HTTP; would need a headless browser. |
| Woodlands Farm Trust | `www.thewoodlandsfarmtrust.org` | `/wp-json/wp/v2/types` → 404 — not WordPress / REST disabled. NOT FOUND |
| Charlton House | `www.charltonhouse.org` | DNS does not resolve |
| Greenwich Cooperative | `www.greenwichcooperative.org.uk` | DNS does not resolve |

Takeaway: the two reusable probes (`tribe/events/v1/events` and `action=eventorganiser-fullcal`)
are cheap enough to run against any new venue host as a standing discovery step.

---

## 15. Ranked "build next" list — optimised for SE8 / SE10 / SE13

| Rank | Source | Why | Effort | SE8/SE10/SE13 yield |
|---|---|---|---|---|
| **1** | **Quaggy / Greenwich West CC Google ICS** | Single URL, standard iCal, 1,067 of 1,912 events in the three target districts, postcode in `LOCATION`, age range in `DESCRIPTION`. Nothing else is close. | **S** | ★★★★★ |
| **2** | **ClassForKids RSC search** | Fan out across the 8 postcodes with header `RSC: 1`; dedupe on (clubName, postcode, venueName). **82 rows, 47 under-5, ages in months** — the only source with true age precision. SE8 13 / SE10 17 / SE13 17. No auth, robots-permitted, no ToS. | **S** | ★★★★★ |
| **3** | **Deptford Lounge Event Organiser AJAX** | The only confirmed structured *dated* feed for an SE8 venue. Explicit `Age Guidance: 0-5`, `children` category, 61 forward under-5 occurrences. robots explicitly permits the endpoint. | **S** | ★★★★☆ (SE8) |
| **4** | **Christ Church East Greenwich (Tribe API)** | 523 events with `venue.zip` = `SE10 9EQ` and `geo_lat/lng` — the cleanest geodata found anywhere, in a priority postcode. Also exposes `?ical=1`. | **S** | ★★★★☆ (SE10) |
| **5** | **The Play Map (Lewisham + Greenwich)** | Parse one `<script id="wix-warmup-data">` per borough. Delivers the parent-and-toddler-group layer that no ticketing feed carries, with postcode, lat/lng, day-of-week and a `For Dads/Male Carers` tag that maps straight to product filters. | **S** | ★★★☆☆ |
| **6** | **Little Kickers locator** | One call returns 12 target-postcode venues (SE10 9JU, SE10 8JA, SE8 4QF, SE13 7BN) **with timetable, age and booking link in the `html` field** — the only source combining all of those. Normalise the dirty `zip_code`. | **S** | ★★★☆☆ |
| **7** | **Greenwich Peninsula Prismic API** | Clean public headless-CMS REST, 352 events, per-day recurrence booleans, price, booking link, and postcode inside `location_description` (`…London, SE10 0EB`). Pure SE10. Weak family tagging — only 1 event carries the `family` tag. | **S** | ★★★☆☆ (SE10) |
| **8** | **A Church Near You JSON API + per-church iCal** | The only machine-readable route into SE8 and SE13 churches (SE8 3, SE10 7, SE13 5). Use it to build a *"which churches have under-5 provision"* index via `tags=parentstoddlers`; do **not** expect dated listings. | **M** | ★★★☆☆ (index only) |
| **9** | **Baby Sensory / WOW + Tumble Tots** | Two more single-call franchise locators: WOW gives 11 target venues across 3 brands; Tumble Tots has a genuine server-side radius filter and is explicitly robots-allowed. | **S** | ★★☆☆☆ |
| **10** | **Greenwich 0–4 NHS clinics (2 pages)** | Tiny build, high parent value: weekly weigh-in and feeding drop-ins with day + time + postcode, incl. SE10 8DX. Join venue names to the Quaggy ICS to backfill missing postcodes. Mind the `AppleWebKit` robots rule. | **S** | ★★☆☆☆ |
| **11** | **Royal Greenwich `/events`** | `start`/`end`/`neighbourhood` params give targeted low-volume polling; `neighbourhood=9` is SE10, `6` Blackheath, `7` Charlton. HTML parse, labelled layout, postcode on its own line. | **M** | ★★☆☆☆ (SE10) |
| **12** | **Greenwich Community Directory** | One `GET /services` yields 1,136 geocoded services as embedded JSON; detail pages add `itemprop="openingHours"` (`Fr 13:30-14:45`) and `Suitable for` ages. A provider/recurring-group registry, not a dated feed. SE10 116 (68 under-5); SE8/SE13 structurally thin (Greenwich-only directory). | **M** | ★★☆☆☆ (SE10) |
| **13** | **Bookwhen OpenActive RPDE** | CC-BY 4.0 — the cleanest licence in the report, and the existing RPDE harness makes the marginal cost low. But it is a national feed needing a full walk, addresses are free text, and `ageRange` is present on only ~16%. | **M** | ★★☆☆☆ (after full walk) |
| **14** | **ChurchSuite (4 live slugs)** | Endpoint is confirmed and permissive (`ai-train=yes`), but **no live slug in SE8/SE10/SE13** and near-zero under-5 content in the four that work. Build only as part of a wider church strategy. | **S** | ★☆☆☆☆ (SE3/SE4) |
| **15** | **Old Royal Naval College** | 68 posts with a real `family-fun` category (10) and `baby-yoga`/`events-for-kids` tags — but **no dates in the API**, so it needs a paired detail-page scrape. | **M** | ★★☆☆☆ (SE10) |
| **16** | **The Play Map — Southwark / Tower Hamlets / Bexley / Bromley** | Same parser as #5, zero marginal design cost, covers SE16, E14, DA5–DA18, BR1–BR8. | **XS** (once #5 exists) | secondary geography |
| **17** | **Bexley 0–19 NHS clinics** | Same parser as #10, covers DA5–DA18. | **XS** (once #10 exists) | secondary geography |
| **18** | **RMG / Horniman (sitemap + scrape)** | 552 and 215 event URLs, but human-readable date strings only and no public age→event join. Highest effort, lowest structure. | **L** | ★☆☆☆☆ |
| **19** | **Calico Libraries MEC** | 181 items but no dates in REST; needs a per-event follow-up fetch and skews adult. Defer. | **M** | ★☆☆☆☆ |

### Two direct data requests worth making (data exists, is just not public)
- **Horniman (SE23)** — has an `audience` vocabulary of exactly `children-under-5`, `under-3s`,
  `children-6-and-under`, `children-2/3`, `children-3-7`, `children-4-6`, but the archives render
  0 events and WP REST is 401. Ask for the join.
- **Discover Children's Story Centre** — has a `spektrix_age_range` taxonomy of `0-1 / 2-3 / 4-5`,
  which *is* the product's segmentation. It is Spektrix-ticketed and the project already has a
  Spektrix adapter — **asking for Spektrix API access unlocks age bands, dates and ticketing at once.**

### Two reusable patterns worth generalising
1. **`action=eventorganiser-fullcal`** — works on any WordPress site running the Event Organiser
   plugin. Probe other in-area venue sites with it; each new host is a config line, not new code.
2. **`<script id="wix-warmup-data">` parsing** — every Wix site with a Data collection embeds its
   rows server-side. Applies to The Play Map today and to any Wix-based local provider later.

### Engineering notes for the top sources
- **RRULE expansion is mandatory** for the Quaggy feed — 997 of 1,912 events are recurring masters
  and the forward view depends entirely on expanding `COUNT=`-bounded weekly series.
- **Poll Quaggy daily.** Staff populate roughly up to the current date, so forward visibility is
  short; `LAST-MODIFIED` (1,871 records touched in 2026) makes incremental sync cheap.
- **Prismic `masterRef` rotates on every publish** — always fetch `/api/v2` first.
- **Next.js `buildId` routes are fragile** (`_next/data/{buildId}/…`); prefer the CMS API behind them.
- **Deptford Lounge uses a Bedrock layout** — the AJAX path is `/wp/wp-admin/admin-ajax.php`,
  not `/wp-admin/admin-ajax.php`.

---

## 16. Bibliography — all URLs accessed 2026-08-12

**Confirmed working endpoints**
1. `https://calendar.google.com/calendar/ical/quaggychildrenscentre%40gmail.com/public/basic.ics` — 200, text/calendar, 1,912 VEVENT
2. `https://calendar.google.com/calendar/ical/quaggychildrenscentre%40gmail.com/public/full.ics` — 200, byte-identical to basic
3. `https://quaggydevelopmenttrust.org/live-calendar/` — 200; source of the base64 calendar ID
4. `https://deptfordlounge.org.uk/wp/wp-admin/admin-ajax.php?action=eventorganiser-fullcal&start=…&end=…` — 200, 488 occurrences
5. `https://deptfordlounge.org.uk/events/category/children/feed/` — 200, RSS, 6 items
6. `https://deptfordlounge.org.uk/sitemap_index.xml` / `event-sitemap.xml` — 200, 284 event URLs
7. `https://deptfordlounge.org.uk/event-category-sitemap.xml` — 200, 17 categories
8. `https://www.theplaymap.co.uk/playgroups/stay-and-play-in-lewisham` — 200, 23 rows in warmup data
9. `https://www.theplaymap.co.uk/playgroups/stay-and-play-in-greenwich` — 200, 36 rows in warmup data
10. `https://www.theplaymap.co.uk/dynamic-playgroups_p_bd8bba01_a575_4f2f_b9da_0fdce23dafd2_0_5000-sitemap.xml` — 200, 106 borough pages
11. `https://greenwichpeninsula.cdn.prismic.io/api/v2` — 200, masterRef `ansmwhEAAC4AxLOW`
12. `https://greenwichpeninsula.cdn.prismic.io/api/v2/documents/search?ref=…&q=[[at(document.type,"event")]]` — 200, 352 results
13. `https://www.greenwichpeninsula.co.uk/_next/data/6oWcwrHUD8IjMOcLXxssp/whats-on.json` — 200, 37,901 bytes
14. `https://www.greenwichpeninsula.co.uk/sitemap.xml` — 200, 737 URLs (344 `/whats-on`)
15. `https://greenwichcommunitydirectory.org.uk/sitemap.xml` — 200, 1,361 URLs (1,347 `/services`)
15a. `https://greenwichcommunitydirectory.org.uk/services` — 200, 1,730,106 bytes, `drupal-settings-json` → 1,136 geocoded features / 1,065 services
15b. `https://greenwichcommunitydirectory.org.uk/services?f%5B0%5D=gcd_outpost_directory%3A743&f%5B1%5D=age_range%3A0-4%20years` — 200, 769 results (⚠️ robots-disallowed by `/services?f*`)
15c. `https://greenwichcommunitydirectory.org.uk/events` — 200, exposed filters `start`/`end`/`category`/`neighbourhood`/`price`, **0 results (unpopulated)**
16. `https://www.royalgreenwich.gov.uk/events?start=2026-08-12&end=2026-09-30` — 200, 28 links, 7 pages
17. `https://www.royalgreenwich.gov.uk/events/circus-works-circus-workshops-kids` — 200, postcode SE18 6HD in markup
18. `https://calicolibraries.com/wp-json/wp/v2/mec-events?per_page=100` — 200, `x-wp-total: 181`
19. `https://calicolibraries.com/wp-json/wp/v2/types` — 200, `mec-events` present
20. `https://calicolibraries.com/wp-json/` — 200, namespaces incl. `mec/v1`
21. `https://greenwich0to4.co.uk/clinics/infant-feeding-clinics` — 200, 6 clinics with postcodes
22. `https://greenwich0to4.co.uk/clinics/well-baby-clinics` — 200, ~9 clinics with day + time
23. `https://greenwich0to4.co.uk/sitemap.xml` — 200, 296 URLs (multi-tenant)

**Confirmed working — class & booking platforms**
23a. `https://classforkids.io/en-GB/classes/SE10` (header `RSC: 1`) — 200, `text/x-component`, 66 KB, `serverSideListings`
23b. `https://classforkids.io/en-GB/classes/SE8` / `/SE13` — 200, 24 KIDS_CLASS each
23c. `https://www.littlekickers.co.uk/wp-json/jpl-locator/v1/locations/?lat=51.4826&lng=-0.0077&radius=5&units=mi` — 200, 279 KB, 42 items
23d. `https://www.tumbletots.com/wp-admin/admin-ajax.php?action=wd_tt_all_locations_data&limit=500&postcode=SE10%208XJ&radius=10` — 200, 6 rows
23e. `https://www.wowworldgroup.com/find-a-class` — 200, 1 MB, 2,538 venues inline
23f. `https://bookwhen.com/api/openactive/sessionseries?afterTimestamp=1770000000&afterId=0` — 200, 50 items / 31 with data
23g. `https://bookwhen.com/api/openactive/scheduledsessions?afterTimestamp=1770000000&afterId=0` — 200, 50 items / 20 with data
23h. `https://data.bookwhen.com/` — 200, dataset JSON-LD, CC-BY 4.0
23i. `https://goteamup.com/api/openactive/v1/scheduledsessions` — 200, 100 items
23j. `https://opensessions.io/api/rpde/session-series` — 200, 500 items
23k. `https://ourparks.org.uk/api/events` — 200, 222 items (all `ageRange.minValue: 10` — not relevant)
23l. `https://openactive.io/data-catalogs/data-catalog-collection.jsonld` — 200, 4 catalogues / 174 datasets

**Confirmed working — churches**
23m. `https://stpetersbrockley.churchsuite.com/embed/calendar/json` — 200, 433 events (SE4 1LT)
23n. `https://stjamesse3.churchsuite.com/embed/calendar/json` — 200, 121 events (SE3 0DU)
23o. `https://kingsconnect.churchsuite.com/embed/calendar/json` — 200, 44 events
23p. `https://stjohnsblackheath.churchsuite.com/embed/calendar/json` — 200, 2 events
23q. `https://www.christchurcheastgreenwich.org.uk/wp-json/tribe/events/v1/events?per_page=50` — 200, **523 events, `venue.zip` SE10 9EQ**
23r. `https://www.stjohnsblackheath.org.uk/wp-json/tribe/events/v1/events` — 200, 27 events
23s. `https://www.achurchnearyou.com/api/internal/venues/venue/?filter_geo_lat=51.4781&filter_geo_lon=-0.0219&filter_geo_radius=3&ordering=filter_geo_distance` — 200, count 94
23t. `https://www.achurchnearyou.com/api/internal/venues/venue/621/` — 200 (S. Paul's Deptford, SE8 3DS)
23u. `https://www.achurchnearyou.com/church/621/service-and-events/feed/` — 200, `text/calendar`, 318,990 bytes, 448 VEVENT
23v. `https://overpass-api.de/api/interpreter` (place_of_worship bbox query) — 200, 178 places (⚠️ no custom UA)

**Confirmed working — museums & attractions**
23w. `https://ornc.org/wp-json/wp/v2/posts?per_page=100` — 200, `X-WP-Total: 68`
23x. `https://ornc.org/wp-json/wp/v2/categories?per_page=100` — 200, 11 terms incl. `family-fun` (10)
23y. `https://surreydocksfarm.org.uk/wp-json/wc/store/v1/products?per_page=50` — 200, `X-WP-Total: 18`
23z. `https://www.rmg.co.uk/sitemap.xml` — 200, 2,363 URLs (552 `/whats-on/`)
23aa. `https://www.horniman.ac.uk/sitemap_index.xml` → `event-sitemap.xml` — 215 events; `audience-sitemap.xml` — 23 terms
23ab. `https://discover.org.uk/sitemap_index.xml` → `event-sitemap.xml` 67; `spektrix_age_range-sitemap.xml` 5 terms (`0-1`, `2-3`, `4-5`, `6-8`, `9-11`)
23ac. `https://festival.org/wp-sitemap.xml` → `wp-sitemap-posts-event-1.xml` 237 events
23ad. `https://www.deptfordx.org/wp-json/tribe/events/v1/events?per_page=10&start_date=2026-08-12` — 200, valid envelope, `total: 0`

**robots.txt / ToS checked**
24. `https://quaggydevelopmenttrust.org/robots.txt` — 200, `Crawl-Delay: 20`
25. `https://deptfordlounge.org.uk/robots.txt` — 200, `Allow: /wp/wp-admin/admin-ajax.php`
26. `https://www.theplaymap.co.uk/robots.txt` — 200, `Allow: /`, `Disallow: *?lightbox=`
27. `https://www.greenwichpeninsula.co.uk/robots.txt` — 200, disallows `*category=*`, `*location=*`, `*relativeDate=*`
28. `https://greenwichcommunitydirectory.org.uk/robots.txt` — 200, standard Drupal
29. `https://www.royalgreenwich.gov.uk/robots.txt` — 200, standard Drupal
30. `https://greenwich0to4.co.uk/robots.txt` — 200, `crawl-delay: 10`, **`User-Agent: AppleWebKit / Disallow: /`**
31. `https://lewisham.gov.uk/robots.txt` — 200, `Disallow:` (nothing blocked)
32. `https://www.horniman.ac.uk/robots.txt` — 200, `Crawl-delay: 5`
33. `https://ornc.org/robots.txt` — 200, Yoast block, `Disallow:` empty, sitemap index
34. `https://www.achurchnearyou.com/robots.txt` — 200, `Allow: /`, only `/christmas/events/` blocked
35. `https://www.rmg.co.uk/robots.txt` — **404**
36. `https://www.lewishamfamilyhubs.org.uk/robots.txt` — 200, `Disallow: /professionals`
36a. `https://churchsuite.com/robots.txt` — 200, `Allow: /`, `Content-Signal: ai-train=yes, search=yes, ai-input=yes`
36b. `https://www.achurchnearyou.com/robots.txt` — 200, `Allow: /`, only `Disallow: /christmas/events/`
36c. `https://classforkids.io/robots.txt` — 200, `Disallow: /iframe/*` only; **no website ToS page exists** (`/terms`, `/terms-and-conditions`, `/legal/` all 404)
36d. `https://bookwhen.com/robots.txt` — 200, `Disallow: */basket`, `*/checkout`; ToS has no automated-access prohibition
36e. `https://www.tumbletots.com/robots.txt` — 200, explicitly `Allow: /wp-admin/admin-ajax.php`
36f. `https://teamup.com/robots.txt` — 200, `Disallow: /ks*`, `/c/`, `/events/` — calendar URLs themselves disallowed
36g. 🔴 `https://happity.co.uk/robots.txt` — `Disallow: /` for **ClaudeBot**, GPTBot, CCBot, Google-Extended, Bytespider; `Content-Signal: ai-train=no`; site 403s to curl. **DO NOT CRAWL.**
36h. ⚠️ `https://www.waterbabies.co.uk/robots.txt` — `User-agent: *` allow-all, but ClaudeBot/GPTBot/CCBot/PerplexityBot each `Disallow: /`. Seek permission.
36i. 🔴 `https://www.mudchute.org/robots.txt` — `Disallow: /api/`, `/*?format=json`, `/*?format=ical`, `/*?tag=`, `/*?view=`, `/*?month=`
36j. `https://surreydocksfarm.org.uk/robots.txt` — 200, disallows `/wp-content/uploads/wc-logs/`, `woocommerce_uploads/`, `/*?add-to-cart=`, `/?s=`, `/search/`
36k. `https://festival.org/robots.txt` — 200, `Allow: /wp-admin/admin-ajax.php`
36l. `https://discover.org.uk/robots.txt` — **404** (no constraints)

**Negative results**
37. `https://deptfordlounge.org.uk/wp-json/tribe/events/v1/events` — 404 `rest_no_route`
38. `https://deptfordlounge.org.uk/events/feed/` — 404 · `…/?feed=eo-events` — 404 · `…/whats-on/feed/` — 403
39. `https://quaggydevelopmenttrust.org/wp-json/wp/v2/types` — 200, no event CPT
40. `https://lewisham.gov.uk/events` — 200, no structured events · `https://lewisham.gov.uk/whats-on` — 404
41. `https://www.lewishamfamilyhubs.org.uk/rss` — 200, 0 items
42. `https://www.royalgreenwich.gov.uk/jsonapi` — 404 · `…/events?_format=json` — 406
43. `https://calicolibraries.com/wp-json/mec/v1/events` — 200, `[]`
44. `https://www.theplaymap.co.uk/_api/cloud-data/v1/wix-data/collections/query` — 400 `WDE0117`
45. `familyinfo.lewisham.gov.uk`, `lewisham.fsd.org.uk`, `lewishamlocaloffer.org.uk` — DNS/TLS failure
46. `https://lewisham.gov.uk/sitemap.xml` — 200, 2,062 URLs, no events section
47. `https://greenwichcommunitydirectory.org.uk/jsonapi` (+ `/jsonapi/node/localgov_directory_page`) — 404
48. `https://greenwichcommunitydirectory.org.uk/services?_format=json` — 406 (`only supports the HTML format`)
49. `https://greenwichcommunitydirectory.org.uk/services.json`, `/api/services`, `/api`, `/directory.json` — 404
50. `https://manage-services.greenwichcommunitydirectory.org.uk/services/2155` — 302 → `/users/sign_in`
51. `https://bookwhen.com/{slug}.ics` — **406, zero bytes on all 13 real slugs tested**; `/{slug}/ical`, `/ical.ics`, `/calendar.ics`, `/feed.ics`, `/events.ics` — 404
52. `https://api.bookwhen.com/v2/events` — 401 (key required)
53. `https://api.teamup.com/{key}/events` — 400 `Teamup-Token header is missing`
54. `https://{slug}.churchsuite.com/embed/calendar/ical` (+ `/embed/calendar/`, `.ics` variants) — 403 Cloudflare managed challenge
55. `https://churchsuite.com/sitemap.xml`, `/customers/`, `/case-studies/` — 403 (no public slug directory)
56. `https://www.rmg.co.uk/jsonapi`, `/jsonapi/node/event`, `/api`, `/views/ajax`, `/events.ics` — 404
57. `https://www.horniman.ac.uk/?rest_route=/wp/v2/posts` (and all collections) — 401 `itsec_rest_api_access_restricted`
58. `https://discover.org.uk/wp-json/wp/v2/Event` — 401 `itsec_rest_api_access_restricted` (Kadence Security)
59. `https://festival.org/wp-json/wp/v2/event` (+ `season`, `venue`, `event-type`, `genre`, `access`) — 404
60. `https://www.mudchute.org/events`, `/calendar` — 404; `/whats-on` — 200 with empty `mainContent`
61. `https://www.age-exchange.org.uk/wp-json/wp/v2/types` — 200, no event CPT
62. `https://www.creeksidecentre.org.uk/` — 200 but zero-byte body under both product and browser UA
63. `https://www.thewoodlandsfarmtrust.org/wp-json/wp/v2/types` — 404
64. `https://api2.churchdesk.com/...` (All Saints Blackheath, org 2649) — all paths 404
