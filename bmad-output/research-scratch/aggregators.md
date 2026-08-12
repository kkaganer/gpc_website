# Event Aggregator / Ticketing / Listing Platform APIs — Research Findings

**Research leg:** Event aggregator, ticketing and listing platform APIs and feeds
**Target:** Hundreds of under-5 / family events across Greenwich, Lewisham, Southwark, Deptford, Blackheath, Woolwich, Eltham, Bromley, Tower Hamlets / Isle of Dogs
**Constraint:** Weekly refresh, hard budget £20/week total API spend
**All URLs accessed:** 2026-08-11

---

## Headline finding

**The budget is a non-issue.** The single richest, most legally-clean source for this project is **OpenActive** — a UK open-data standard for physical-activity sessions, stewarded by the Open Data Institute and funded by Sport England and the National Lottery. Southwark Council, Tower Hamlets Council and GLL/Better (which operates The Greenwich Centre, The Eltham Centre, Glass Mill in Lewisham, Forest Hill Pools, Charlton Lido, The Plumstead Centre, Thamesmere and Sutcliffe Park) all publish **free, keyless, JSON RPDE feeds under CC-BY 4.0** — an explicit licence to store and redisplay with attribution.

I crawled these feeds live on 2026-08-11 and measured **10,053 dated session instances in a rolling 14-day window** from Southwark and Tower Hamlets alone, plus 2,593 national session-series from GLL. Cost: **£0**. No API key, no quota, no ToS negotiation.

The second finding is **ClassForKids** (`classforkids.io`, also `class4kids.co.uk`): no API, but ~40,000 crawlable location pages, a `robots.txt` disallowing only `/iframe/*`, **no published terms of use at all**, and structured JSON on every listing carrying postcode, distance and **age ranges in months**. A live query for SE10 returned 24 clubs across SE10/SE3/SE7/E14/E16 including providers taking babies from **2 months**.

Conversely, the platforms that look most attractive on paper — **Happity**, **Hoop** and **Pebble** — are the ones with the weakest basis for automated consumption. Pebble in particular exposes an unauthenticated public GraphQL API that answers exactly the right query (37 under-5 activities within 3 miles of Greenwich) while its EULA explicitly forbids precisely this use. And **Eventbrite's public event search API has been dead since February 2020**.

---

## Summary table

| Platform | API/feed exists 2026? | Cost | Geo search | Date filter | Under-5 SE London coverage | ToS risk | Verdict |
|---|---|---|---|---|---|---|---|
| **OpenActive — Southwark Council** | Yes, 5 RPDE feeds | Free | Lat/lng + full postcode in payload | 14-day rolling window in feed | **High** | **None** (CC-BY 4.0) | **Use now** |
| **OpenActive — Tower Hamlets Council** | Yes, 5 RPDE feeds | Free | Lat/lng + postcode | 14-day rolling window | **High** | **None** (CC-BY 4.0) | **Use now** |
| **OpenActive — GLL / Better** | Yes, 4 RPDE feeds | Free | Lat/lng + postcode | `eventSchedule` / ScheduledSession | **Med-High** | **None** (CC-BY 4.0) | **Use now** |
| **OpenActive — wider catalogue (213 hosts)** | Yes, 546 feed URLs | Free | Per-feed | Per-feed | Med | **None** (mostly CC-BY 4.0) | **Use now** |
| **Ticketmaster Discovery API** | Yes | Free tier | `geoPoint`, `postalCode`, `radius` | `startDateTime`/`endDateTime` | **Low** | Med (cache limits) | Consider |
| **Skiddle API** | Yes | Free key; commercial needs approval | `latitude`/`longitude`/`radius` | `minDate`/`maxDate` | **Low-Med** | Med (commercial approval) | Consider |
| **Bookwhen — OpenActive feed** | Yes | Free | Lat/lng + address | Yes | **Low** (measured: 1 in SE London) | None (CC-BY 4.0) | Consider |
| **Bookwhen — v2 REST API** | Yes | Free w/ account | No | Yes | N/A — per-organiser only | Low | Avoid (not aggregatable) |
| **Eventbrite API v3** | Search **withdrawn**; ID/venue/org endpoints remain | Free | **No** (no search) | **No** (no search) | Low (unreachable) | **High** | **Avoid** |
| **Meetup GraphQL API** | Yes, but Pro-gated | Meetup Pro subscription | Limited | Limited | **Low** | Med | **Avoid** |
| **Facebook / Meta Graph API** | Events restricted to Marketing Partners | N/A | N/A | N/A | N/A | **High** | **Avoid** |
| **DICE.fm** | **No public API** | N/A | N/A | N/A | **None** | High | **Avoid** |
| **Happity** | **No API, no feed** | N/A | N/A | N/A | **Highest content value, inaccessible** | **High** | **Avoid** (partner instead) |
| **Hoop** | No API; schema.org Event JSON-LD on pages | N/A | Geo present but **buggy** | `startDate` present | **High content value** | **High** (ToS anti-automation) | **Avoid** (partner instead) |
| **Day Out With The Kids** | No API | N/A | No | No dated events | Low (attractions, not sessions) | **High** (explicit ban) | **Avoid** |
| **Time Out London** | Article RSS only | Free | No | No | **Low** | Med (event RSS disallowed) | **Avoid** |
| **Kidadl** | No | N/A | No | No | **None** (articles) | Low | **Avoid** |
| **Netmums local** | No | N/A | No | No | **None** | Med (`/wp-json/` disallowed) | **Avoid** |
| **Mumsnet Local** | **Discontinued (404)** | N/A | N/A | N/A | **None** | N/A | **Avoid** |
| **ClassForKids / Class4Kids** | No API; ~40k crawlable pages + structured RSC JSON | Free | Yes — postcode URL + `distancemiles` | No (camps carry own dates) | **High** (measured: SE10/SE3/SE7/E14/E16, ages from 2 months) | **Low — no ToS published** | **Use now** |
| **Pebble (bookpebble.co.uk)** | Yes — unauthenticated public GraphQL | Free (undocumented) | Yes — `postcode`+`distance`, lat/lng, bounds | Yes — `startDate`/`endDate` | **High** (measured: 37 hits, SE10 3mi, ages 0–60mo) | **High — explicit scraping ban** | **Consider** (partner first) |
| **Outsavvy** | Yes (global search needs "special access") | Free, 5,000/day | Yes — `range` in miles | Yes — `start_date`/`end_date` | **Low** | **Low** (docs encourage caching) | Consider |
| **WeGotTickets** | Yes — RSS/XML affiliate feed, ~10k events | Free (pays commission) | No | No | **Low** | Low **if** affiliate | Consider |
| **Billetto** | Yes — `/public/events`, partner key | Free (partner gate) | `postal_code` exact only | **No** | **Low** | Med (UTM + canonical required) | Consider |
| **Ticket Tailor** | **Per-box-office only** | No API tier | No | Unestablished | Low (no bulk route) | Low (licence for commercial) | **Avoid** for bulk |
| **TicketSource** | **Per-organiser only** | Free, 240 req/60s | No | On `/dates` only | Low (no bulk route) | **High** (no redistribution) | **Avoid** |
| **TryBooking** | **Per-organiser reporting API** | Free | No | No | Low | **High** (anti-scrape + anti-compete) | **Avoid** |

---

## 1. Eventbrite API v3 — CRITICAL VERIFICATION

### (a) Does a public event search API exist in 2026? **No.**

Eventbrite's own deprecation notice, quoted verbatim in the Automattic `eventbrite-api` issue tracker:

> "Effective December 12, 2019, we'll be removing public access to Eventbrite Event Search API"
> "After February 20, 2020, all requests to the Event Search API will be denied"

**Verified empirically on 2026-08-11:**

```
GET https://www.eventbrite.com/api/v3/events/search/?q=kids   → HTTP 404
```

The endpoint is not merely permission-gated — it is gone.

### What remains available

Eventbrite's notice listed three replacements:

| Endpoint | Use |
|---|---|
| `GET /v3/events/:event_id/` | Retrieve one event you already know the ID of |
| `GET /v3/venues/:venue_id/events/` | List events at a venue |
| `GET /v3/organizations/:organization_id/events/` | List events for an organisation |

**The fatal limitation:** all three require you to *already know* the ID. There is no discovery mechanism. `/v3/organizations/:id/events/` operates on organisations your token is a member of — you cannot enumerate a third party's events. To use Eventbrite at all you would have to manually curate a list of SE London organiser IDs and poll each one. [UNVERIFIED — whether `/v3/organizers/:organizer_id/events/` returns public events for organisers you do not administer needs testing with a live token; the docs site is JavaScript-rendered and could not be fetched.]

### The `/destination/` internal API — not usable

This is the private API Eventbrite's own website calls. Verified 2026-08-11:

```
GET  https://www.eventbrite.co.uk/api/v3/destination/search/  → HTTP 405 (Method Not Allowed)
POST https://www.eventbrite.co.uk/api/v3/destination/search/  → HTTP 401
     {"status_code":401,
      "error_description":"CSRF Failed: Referer checking failed - no Referer.",
      "error":"ACCESS_DENIED"}
```

It is CSRF/Referer-gated. Spoofing the Referer to use it would be an undocumented private API accessed contrary to the Terms of Use — not a viable foundation.

### RSS / iCal — blocked

```
GET https://www.eventbrite.co.uk/rss/organizer_list_events/12345  → HTTP 404
```

And `https://www.eventbrite.co.uk/robots.txt` explicitly disallows the feed paths:

```
Disallow: /atom/
Disallow: /rss/
Disallow: /events/rss/
Disallow: /events/atom/
Disallow: /directory/
Allow: /directory/sitemap/
```

Third-party iCal proxies exist (e.g. `eb-to-ical.daylightpirates.org`) but they are unofficial wrappers around the same API and inherit the same restrictions.

### (f) Terms of Service — restrictive

From the Eventbrite API Terms of Use:

- **Past events may not be stored:** *"you may not store any Site Content relating to events that have occurred in the past"* (§3.1). This directly conflicts with keeping an event archive.
- **Mandatory attribution and linking:** *"your Application must display the event title and display a direct link to the Eventbrite webpage"*, with no `nofollow` attribute (§3.2).
- **Rate limit:** *"1000 calls per hour on each OAuth token"* (§3.5), subject to change without notice.
- **No commercial gain:** may not use the APIs *"for direct commercial or monetary gain"* (§3.6).
- **Scraping prohibited** under the main Terms of Service.

### Verdict: **Avoid**

No search endpoint, no discovery, restrictive storage terms, and a prohibition on the workarounds. Manual curation of a handful of high-value SE London organiser IDs is the only defensible use, and the effort/return is poor relative to OpenActive.

---

## 2. Ticketmaster Discovery API

### (a) Exists — yes

Base: `https://app.ticketmaster.com/discovery/v2/events.json`
Classified by Ticketmaster as an **"OPEN API"** — publicly accessible on registration.

### (b) Pricing and rate limits

- **Free.** API key issued on registration at the developer portal.
- **Default quota: 5,000 API calls per day.**
- **Rate limit: 5 requests per second.**
- Response headers expose quota state: `Rate-Limit`, `Rate-Limit-Available`, `Rate-Limit-Over`, `Rate-Limit-Reset`.
- Exceeding quota returns **HTTP 429**.
- Increases available case-by-case after ToS/branding compliance review.

Triangulated across the Ticketmaster "Getting Started" page and the Discovery API v2 reference; the 5,000/day + 5/sec figures appear in both.

**Verified empirically 2026-08-11:** an unauthenticated request returns `HTTP 401` — the key is genuinely required.

```
GET https://app.ticketmaster.com/discovery/v2/events.json?postalCode=SE10&countryCode=GB&includeFamily=only  → HTTP 401
```

### (c) Geo/radius search — yes, good

| Parameter | Behaviour |
|---|---|
| `geoPoint` | Filter by geoHash |
| `latlong` | **Deprecated** — do not use |
| `postalCode` | Filter by postal code |
| `radius` | Radius of search area |
| `unit` | `miles` or `km` |
| `city` | Filter by city |
| `countryCode` | e.g. `GB` |

### (d) Date filtering — yes

`startDateTime` (start date after) and `endDateTime` (start date before).

### Family filtering

- `includeFamily` — *"Filter by classification that are family-friendly"*
- `classificationName`, `segmentId` for segment filtering

### Pagination constraint — important

> "Deep Paging: we only support retrieving the 1000th item. i.e. ( size * page < 1000)"

You cannot page beyond 1,000 results per query. Work around this by slicing queries by date window and postcode.

### (e) Under-5 SE London coverage: **Low**

Ticketmaster UK inventory is arenas, theatres, large attractions and touring shows. `includeFamily` surfaces pantomimes, arena family shows and large-venue kids' theatre — not toddler groups, stay-and-play, library rhyme time or baby sensory classes. Useful as a *supplementary* source for occasional big-ticket family events; will not deliver hundreds of under-5 listings.

### (f) ToS

From the Ticketmaster Developer Terms of Use, under "You shall not":

> "Cache or store any Event Content other than for reasonable periods in order to provide the service you are providing."

This permits operational caching for your service but not building a permanent archive. Also prohibited (§11):

> "Sell, lease, or sublicense the Ticketmaster API or access thereto or derive revenues from the use or provision of the Ticketmaster API"

No explicit attribution/link-back requirement was found in the general terms.

### Verdict: **Consider** — free, well-documented, genuinely geo+date capable, but low yield for this specific audience. Cheap to add; do not rely on it.

---

## 3. Meetup

### (a) Exists — GraphQL only, Pro-gated

The open REST API is retired. What remains is a GraphQL API at `https://api.meetup.com/gql`, documented at `https://www.meetup.com/graphql/`.

The docs page lists **"API access"** as a Meetup Pro exclusive feature — *"Get API access and more with Meetup Pro"*.

Following the February 2025 transition, **only members with an active Meetup Pro subscription can create new OAuth consumers.**

### (b) Pricing

Meetup Pro is an organiser subscription with location-varying pricing. **[UNVERIFIED — exact 2026 price not established; `help.meetup.com` returned HTTP 403 to automated fetch.]** It is materially more than £20/week is comfortable with for a single supplementary source.

### (c)/(d) Geo and date filtering

GraphQL search supports keyword and location-scoped queries, but capability is tied to authenticated scope. Not established in detail — the docs page did not enumerate queries or rate limits.

### (e) Under-5 SE London coverage: **Low**

Meetup's UK community skews tech, professional networking, hobbies and adult social. Parent/baby groups exist but are sparse and inconsistently maintained compared with Happity/Hoop.

### (f) ToS

Governed by Meetup Terms of Service plus additional API License Terms (`https://help.meetup.com/hc/articles/360028705532`).

### Verdict: **Avoid** — paywalled, low relevance. Poor value against the budget.

---

## 4. Skiddle API

### (a) Exists — yes, and it is a genuine public search API

Endpoint: `https://www.skiddle.com/api/v1/events/search/` (GET)
Docs: `https://github.com/Skiddle/web-api/wiki/Events-API`
Key registration: `https://www.skiddle.com/api/join.php`

### (b) Pricing and rate limits

- **Free API key** on application.
- **Commercial use requires written approval** from `dev@skiddle.com`.
- Skiddle state: *"We monitor all requests and reserve the right to rate-limit or block any excessive requests."*
- A daily limit and hourly rate limit exist; **exact numbers are not published** on the API landing page. **[UNVERIFIED — specific quota figures]**

### (c) Geo search — yes, exactly what's needed

`latitude`, `longitude`, `radius` (miles) — *all three must be supplied together*. Also `country` (e.g. `GB`) and `getdistance` to return distance from the search point.

Example from the docs:
```
https://www.skiddle.com/api/v1/events/search/?api_key=KEY&latitude=53.4839&longitude=-2.2446&radius=5&eventcode=LIVE&order=distance&description=1
```

### (d) Date filtering — yes

`minDate` and `maxDate`, format `YYYY-MM-DD`.

### Category filtering

`eventcode` includes **`KIDS` = Kids/Family Event**, alongside `FEST`, `LIVE`, `CLUB`, `DATE`, `THEATRE`, `COMEDY`, `EXHIB`, `BARPUB`, `LGB`, `SPORT`, `ARTS`.

Pagination: `limit` (max 100, default 20) and `offset`.

### (e) Under-5 SE London coverage: **Low-Medium**

Skiddle's centre of gravity is gigs, clubs and festivals. The `KIDS` eventcode and the "Experiences → family & kids" category do carry family events, but coverage of recurring under-5 classes is thin. Worth a single exploratory query against SE10/SE8/SE13 to size the actual yield before investing.

### (f) ToS

Not addressed on the API landing page; the requirement for written commercial approval is the operative constraint. A community website with any monetisation should email `dev@skiddle.com` first.

### Verdict: **Consider** — free, correct query shape (geo + date + kids category), low integration cost. Size the yield first.

---

## 5. DICE.fm

### (a) No public or partner API

Verified 2026-08-11:
```
https://api.dice.fm/v1/events        → HTTP 404
https://dice.fm/api/v1/events        → HTTP 404
https://api.dice.fm/unlisted_events  → HTTP 404
partners.dice.fm                     → DNS NXDOMAIN (getaddrinfo ENOTFOUND)
https://dice.fm/partners             → HTTP 403
```

`https://dice.fm/robots.txt` uses the Cloudflare **Content-Signal** convention, with a preamble asserting that restrictions expressed via content signals are *"EXPRESS RESERVATIONS OF RIGHTS UNDER ARTICLE 4 OF THE EUROPEAN UNION DIRECTIVE 2019/790"*.

### (e) Under-5 coverage: **None.** DICE is music, nightlife and comedy.

### Verdict: **Avoid.** No API, no relevant inventory, explicit rights reservation.

---

## 6. Facebook / Meta Graph API Events

### (a) Public event search — long dead; Page events severely restricted

From the Graph API Event reference:

> "Access to Events on Users and Pages is only available to Facebook Marketing Partners."

Remaining access paths:
- **App Events** — require an App access token from the app that created the event
- **Group Events** — require a User access token from an Event Admin *plus* Groups API feature approval

There is no public event search. The historical `/search?type=event` endpoint is not available.

### Verdict: **Avoid.** Marketing-Partner gating puts this out of reach. Note that a large share of genuine SE London under-5 activity is *only* advertised in Facebook groups — this is a real coverage gap with no API solution. Manual/community submission is the only route.

---

## 7. Happity (happity.co.uk) — HIGH VALUE, INACCESSIBLE

Happity is the UK's main baby/toddler class directory and would be the single best content match for this project. **It offers no route to automated access.**

### (a) API / partner feed: none found

`/api/search`, `/api/v1/classes`, `/api/classes`, `/search.json` all returned **HTTP 403** — the Cloudflare challenge, not a 404, so this is not positive evidence of absence. The Wayback CDX index has **zero captures** under `happity.co.uk/api*`.

**Happity does NOT publish an OpenActive feed.** Verified against the full catalogue tree: `data-catalog-collection.jsonld` and all four child catalogues (leisurecloud 32 datasets, Legend 31, Bookteq 88, singular 23). Happity appears in none, and `status.openactive.io` returns no match.

### (b) Structured data: could not be established

Every HTML page on the domain is behind a Cloudflare interactive challenge:
```
cf-mitigated: challenge
server: cloudflare
<title>Just a moment...</title>
```
`https://www.happity.co.uk/`, borough search pages, `providers.happity.co.uk`, `sitemap.xml` and `sitemaps/sitemap.xml.gz` **all returned HTTP 403** to both curl (full browser header sets, HTTP/2) and WebFetch. **Not a single page was retrievable.** Whether class pages carry JSON-LD Event/Course markup is therefore unknown.

### (c) robots.txt — `https://www.happity.co.uk/robots.txt` (this file *is* served)

```
User-agent: *
Content-Signal: search=yes,ai-train=no,use=reference
Allow: /
```
```
User-agent: *
Disallow: /users/
Disallow: /admin/
Disallow: /tmp/
Disallow: /engagements/
Disallow: /provider_section/
Disallow: /events/

Disallow: *source=book-now*

Disallow: /*?weekday=
```

Two lines are decisive:
- **`Disallow: /events/`** — almost certainly the individual class/session detail pages
- **`Disallow: /*?weekday=`** — blocks the filtered search URLs

Plus full-site bans on AI crawlers including **`ClaudeBot`, `GPTBot`, `CCBot`, `Google-Extended`**, Amazonbot, Applebot-Extended, Bytespider, meta-externalagent, CloudflareBrowserRenderingCrawler.

The `Content-Signal: ai-train=no,use=reference` line is an express reservation of rights under Article 4 of EU Directive 2019/790, asserted as a condition of access.

### (f) ToS: **not retrievable** (403).

### (e) Under-5 SE London coverage: **highest of any source researched** — borough search pages confirmed to exist in the Wayback index for Greenwich, Greenwich borough, Lewisham, Southwark, Woolwich, Eltham, Blackheath and Bromley. This is exactly the target inventory.

### Verdict: **Avoid automated ingest. Pursue a commercial/partner conversation.**

Cloudflare challenge + `/events/` disallowed + AI-crawler bans + unreadable ToS is both a technical wall and an unambiguous statement of intent. The only legitimate route is contacting Happity directly (`providers.happity.co.uk`).

**Strategic note — tested and largely disproved.** The obvious workaround is that Happity's *underlying supply* (independent baby/toddler class providers) books through **Bookwhen, TeamUp and Class4Kids**, so consuming those platforms' open feeds should reach the same providers at source. **I measured this and it does not work.** Bookwhen's entire OpenActive feed is 1,857 records nationally, 82 in SE London, **1** under-5. TeamUp's is 265 SessionSeries nationally, **3** in SE London, **0** under-5. Open-data publication on these platforms is opt-in per provider, and under-5 providers have overwhelmingly not opted in. See §11 and §13.

---

## 8. Hoop (hoop.co.uk)

### (a) No public API

Homepage JSON-LD self-describes as a `SoftwareApplication` (iOS/Android), operated by **Hoop Health Ltd**. Publicly claimed scale: 100,000+ activities/month, 1M families, 10,000+ providers, revenue from ~10% booking commission.

### (b) Structured data — the best of any consumer site researched

Activity detail pages carry **full schema.org `Event` JSON-LD**. Verified live on a real listing:

```json
{"@context":"https://schema.org/","@type":"Event","name":"Soft play stay and play",
 "startDate":"2026-09-11T08:30:00Z","endDate":"2026-09-11T10:30:00Z",
 "location":{"@type":"Place","geo":{"@type":"GeoCoordinates",
 "latitude":51.5334708,"longitude":51.5334708}, ...
```

**Data-quality bug worth recording: `longitude` is populated with the latitude value.** Hoop's geo coordinates are unreliable — geocode from `PostalAddress` instead.

Site is **Next.js**; every page embeds `__NEXT_DATA__` (route `/areas/[...slug]`), which is a clean JSON parse target. No separate public `/api/` path was found.

**Sitemap index** `https://hoop.co.uk/sitemap.xml` — 6 children:

| Sitemap | URLs | lastmod |
|---|---|---|
| sitemap-activities.xml | 1,000 | 2026-08-11 (daily) |
| sitemap-organisers.xml | 1,000 | 2026-01-27 |
| sitemap-blog.xml | 154 | 2025-07-22 |
| sitemap-organisers-list.xml | 28 | — |
| sitemap-static.xml | 13 | 2025-12-29 |
| sitemap-areas.xml | 13 | 2026-02-22 |

Both large sitemaps are **hard-capped at exactly 1,000 URLs** against 100,000+ claimed activities — a rotating sample, not the corpus. `sitemap-areas.xml` covers only Gloucestershire and Hertfordshire.

However **the area URL pattern is predictable and SE London pages exist despite sitemap absence**. Verified: `https://hoop.co.uk/areas/london/greenwich/` → HTTP 200, `<title>Kids Activities in Greenwich, London | Hoop</title>`.

### (c) robots.txt — maximally permissive

```
User-agent: *
Allow: /

Sitemap: https://hoop.co.uk/sitemap.xml
```
No disallows, no crawl-delay, no AI-bot bans.

### (f) ToS — **conflicts with robots.txt**

From `https://hoop.co.uk/terms-of-service/`:

> "not to use or create software which automatically interacts with the Hoop Service, such that the level of user interaction required is less than would be required without that software (except to the extent required for web accessibility purposes)"

> "not to copy the Hoop Service (or any part of it) except where such copying is incidental to your use of the Hoop Service in accordance with the Terms"

**robots.txt says yes; the ToS says no.** The anti-automation clause is broad enough to cover a scraper. This is a legal-risk decision, not a technical one.

### Partnership route — likely the right play

`sitemap-static.xml` reveals a purpose-built partner surface:
```
https://hoop.co.uk/organisers/
https://hoop.co.uk/partners/
https://hoop.co.uk/health-visitors/
https://hoop.co.uk/send/
```
The existence of `/partners/` and `/health-visitors/` indicates an established institutional-partnership route. **[UNVERIFIED — page contents not fetched.]**

### (e) Under-5 SE London coverage: **High content value.** Volume not quantified — the 1,000-URL sitemap cap prevented a census.

### Verdict: **Avoid automated ingest; approach as a partner.** Submitting your events to Hoop (and negotiating a reciprocal feed) sidesteps the ToS problem entirely.

---

## 9. Day Out With The Kids

### (a) No API, affiliate feed or partnership mentioned in the terms.

### (c) robots.txt — `https://www.dayoutwiththekids.co.uk/robots.txt`, full file:
```
User-agent: *
crawl-delay: 5
Disallow: /account/
Disallow: /umbraco/
Disallow: /umbraco_client/
Disallow: /things-to-do?keyword*

Sitemap: https://www.dayoutwiththekids.co.uk/sitemapindex.xml
Sitemap: https://dayoutwiththekids.co.uk/sitemap.xml
```

### (f) ToS — the clearest prohibition of any site researched

From `https://www.dayoutwiththekids.co.uk/terms-and-conditions`:

> "You must not link (including deep linking) to our website or access, monitor or copy any content or information of this website using any robot, spider, scraper or other automated means or any manual process for any purpose without our prior written consent."

### (b) Structure

`sitemapindex.xml` → ~130 regional children. `greater-london.xml` alone holds **43,692 URLs** (6.4 MB). `sitemap-events.xml` has 206 URLs but these are **seasonal category hubs** (`/events/christmas`, `/events/halloween`, `/events/easter`, `/events/summer`, `/events/may-half-term`) — *not* dated event instances. Umbraco CMS + Next.js. Listing pages carry only `ItemList`/`BreadcrumbList`/`WebPage` JSON-LD — **no `Event` type, no `startDate`**.

### (e) This is an **attractions directory** (farms, museums, playgrounds), not a dated under-5 session listing. Wrong shape.

### Verdict: **Avoid.** Explicit scraping ban plus wrong data shape.

---

## 10. Time Out London, Kidadl, Netmums, Mumsnet Local

### Time Out London

**robots.txt** (`https://www.timeout.com/robots.txt`, updated 4 March 2026) contains a deliberate RSS policy:
```
# --- RSS CLEANUP (Targets legacy folders only) ---
Disallow: */rss/
Disallow: */rss/Events
Disallow: */rss/Venues
# Note: New feeds like /blog/feed.rss remain ALLOWED
```
**Legacy event and venue RSS feeds are explicitly disallowed.** Also `Disallow: /search*`, `/*/search*`, `/search-listings?*`, `*/paginate`, `*/pages-ajax`.

`https://www.timeout.com/london/feed.rss` → HTTP 200, `application/rss+xml`, 612 KB, 100 items — but the content is **editorial articles, not events** ("The best wine bars in London", "The best restaurants in Mayfair"). Has `<pubDate>`; **no `startDate`, no event-date fields**. `https://www.timeout.com/london/rss.xml` → 404.

`https://www.timeout.com/london/kids` → HTTP 200, but JSON-LD is only `WebPage`/`Person`/`Organization`/`ImageObject`/`AdministrativeArea` — **no Event markup, zero `startDate` occurrences**.

**No public API. Verdict: Avoid** — event feeds disallowed, and kids content skews to paid attractions and school-age, London-wide rather than borough-level.

### Kidadl

`https://kidadl.com/robots.txt` — permissive (`Disallow: /core/*`, `/r/*`, `/mnt/*` only). Sitemap index → `https://kidadl.com/feeds/sitemaps/sitemap_N.xml`.

Homepage JSON-LD types: `Organization`, `WebSite`, `SearchAction`, `ContactPoint`, `PostalAddress` — **no Event markup**. Location/event URL patterns do not exist: `/things-to-do/london`, `/days-out`, `/location/london` all **404**.

**Kidadl is an article/listicle publisher, not a dated-event directory. Verdict: Avoid** — no usable event data.

### Netmums local

`https://www.netmums.com/robots.txt`:
```
User-agent: *
Disallow: /search/
Disallow: /user/
Disallow: /wp-json/
Disallow: /?rest_route=
Disallow: /esi/forumanswers/
Allow: /
```
**The WordPress REST API is explicitly off-limits.**

`https://www.netmums.com/local/greenwich` → HTTP 200, but JSON-LD contains only `CollectionPage`, `BreadcrumbList`, `WebSite`, `SearchAction`, `Organization`, `ImageObject`, `ListItem` — **no `Event` type, `startDate` appears zero times**. WordPress + Yoast; most `post-sitemap` children have lastmod dates from **2020** (stale).

**Verdict: Avoid** — not machine-readable as events.

### Mumsnet Local — **discontinued**

Two independent signals:
1. `https://www.mumsnet.com/local` → **HTTP 404**; `https://www.mumsnet.com/local/greenwich` → **HTTP 404**
2. `https://www.mumsnet.com/sitemap.xml` (840 KB) contains **no `/local` URLs at all** — only `/articles/*`

`robots.txt` disallows `/api/`, `/ajax/*`, `/search?query=*` with a long AI-crawler blocklist. Notably **Googlebot alone** is granted `Allow: /api/v3/talk/topics/*/threads` and `/api/v3/feeds/trending` — an internal API exists but is disallowed for everyone else.

**Verdict: Avoid — dead for this purpose.**

---

## 11. Bookwhen — measured, and weaker than expected

Bookwhen is a booking platform used by many independent UK class providers, so it looked like a high-value proxy for Happity's supply. **I crawled its entire OpenActive feed and the SE London yield is very low.**

### Two separate things exist:

**(i) The Bookwhen v2 REST API** — `https://api.bookwhen.com/v2`
- Read-only: Events (single or list), Locations, Attachments, Tickets, Passes
- Auth: account access token, `curl "https://api.bookwhen.com/v2/events" -u 'token:'`
- **Per-organiser only** — returns *your own* account's events. Not aggregatable across providers.
- Default window: today and into the future
- Rate limits/plan requirements not documented
- **Verdict: not usable for aggregation.**

**(ii) The Bookwhen OpenActive feed** — `https://data.bookwhen.com/` — publisher Bookwhen Ltd, **CC-BY 4.0**, updated every minute:

```
CourseInstance    https://bookwhen.com/api/openactive/courseinstances
ScheduledSession  https://bookwhen.com/api/openactive/scheduledsessions
SessionSeries     https://bookwhen.com/api/openactive/sessionseries
Event             https://bookwhen.com/api/openactive/events
```

### Measured live, 2026-08-11 (full crawl to end of feed)

| Feed | Pages | Live records | Crawl time |
|---|---|---|---|
| sessionseries | 61 | 1,530 | 142 s |
| events | 61 | 127 | 33 s |
| courseinstances | 61 | 200 | 37 s |
| **Total** | | **1,857** | ~3.5 min |

**SE London (bbox 51.39–51.56 N, −0.12–0.16 E): 82 records.**
Postcode districts: SE5 (36), BR3 (10), SE3 (9), SE9 (7), SE16 (3), SE8 (2), E2 (2), E7 (2), SE1, SE25, SE6, E13, E15, SW16, DA5, RM8, N1.

**Under-5 keyword matches in SE London: 1** — *"Squats and Coffee Shots — Parent and Baby Classes"*, Unit 11 Ffinch Street, Deptford SE8 5QA.

The bulk of SE London records are adult fitness (Rasa Yoga BR3, circuits SE8) and forest-school day sessions (Brunswick Park Camberwell SE5, Blackheath SE3).

### Why the yield is low

Bookwhen's OpenActive publication is **opt-in per provider**. 1,857 records nationally is a small fraction of Bookwhen's real customer base. The under-5 providers who use Bookwhen mostly have *not* enabled open-data publication.

Record quality where present is excellent — full geo, address with postcode, price, organiser contact, `eventSchedule` with `repeatFrequency`/`byDay`/`startTime`, and rich descriptions:

```json
{"@type":"SessionSeries","name":"9.45am Gosforth Little Movers ",
 "description":"...suitable for independent walkers to 5 year olds",
 "offers":[{"name":"Sibling","price":25.0,"priceCurrency":"GBP"}],
 "location":{"address":"Trinity Church\nHigh Street\nGosforth\nNE3 4AG",
   "geo":{"latitude":55.0055032,"longitude":-1.6204905}},
 "eventSchedule":[{"repeatFrequency":"P1W","startDate":"2026-09-08",
   "duration":"PT45M","byDay":["https://schema.org/Tuesday"],"startTime":"09:45:00"}]}
```

### Verdict: **Consider** — free, CC-BY, trivially cheap to crawl (3.5 min for the whole feed), and worth including for the handful of genuine hits. But it is **not** the Happity substitute it appears to be.

---

## 12. Ticketing / booking platforms used by UK venues and class providers

**Method note:** the WebSearch budget was exhausted partway through this research. Everything below comes from directly fetching official developer docs, live API endpoints, `robots.txt`, sitemaps and legal pages — no blog summaries. Cloudflare-protected pages (tickettailor.com, ticketsource.co.uk) were retrieved via a real browser after curl/WebFetch returned 403.

### Headline

Only **three** of these nine offer a genuine public/global *search* API: **Pebble** (undocumented but fully functional), **Outsavvy** (documented, access-gated) and **Billetto** (documented, partner-gated). **Ticket Tailor and TicketSource are strictly per-organiser** — one API key per box office, no cross-organiser search. **ClassForKids has no API at all**, but its public discovery site is the single most harvestable under-5 dataset found in this entire research leg.

### Comparison

| Platform | Public/global API? | Postcode radius | Date window | Structured data on public pages | ToS posture |
|---|---|---|---|---|---|
| **Pebble** | **Yes — unauthenticated GraphQL** | Yes (`postcode`+`distance`, lat/lng, bounds) | Yes (`startDate`/`endDate`) | `__NEXT_DATA__` (no JSON-LD) | **Explicit scraping / data-mining ban** |
| **ClassForKids** | No API | Yes, via public URL + `distancemiles` | No | RSC flight payload (no JSON-LD) | **No ToS published at all** |
| **Outsavvy** | Yes (request "special access") | Yes (`range` in miles) | Yes (`start_date`/`end_date`) | postcode + geo + offers | None found; docs *encourage* local caching |
| **Billetto** | Yes (partner key) | `postal_code` exact only; geo in response | **None** | postcode + geo + offers | API sanctioned; scraping banned |
| **WeGotTickets** | Global RSS/XML feed | No | No | postcode, no lat/lng | No redistribution without permission → **join affiliate** |
| **Ticket Tailor** | **Per-box-office only** | No | Unestablished | postcode + offers (no geo) | Commercial use needs licence; no anti-bot clause |
| **TicketSource** | **Per-organiser only** | No | On `/dates` only | None; `/booking/` robots-disallowed | No redistribution of API data; anti-robot clause |
| **TryBooking** | **Per-organiser reporting API** | No | No | Thin / malformed JSON-LD | Anti-scrape + anti-compete + non-commercial |
| **DICE.fm** | None official | No | Yes (unofficial only) | postcode + geo | Art. 4 reservation; ToS unreadable |

---

### 12.1 Pebble (bookpebble.co.uk) — best technical fit, contractually closed

Operated by **Sprout Care Ltd**. Marketplace at `activities.bookpebble.co.uk`.

**(a) A working, undocumented, unauthenticated public GraphQL API.**

**Endpoint: `https://api.bookpebble.co.uk/graphql/`** — note the **trailing slash** (`/graphql` 301s and drops POST bodies). No authentication required; **introspection fully enabled**, exposing 133 query fields.

```graphql
marketplaceActivities(
  offset:Int, limit:Int,
  ageStart:Int, ageEnd:Int,            # months
  dayOfTheWeek:…, time:…, bookingType:…,
  startDate:Date, endDate:Date,        # date window
  postcode:String, latitude:String, longitude:String, distance:Int,  # geo + radius
  bounds:GeoBoundsInput, categories:UUID, isOnline:Boolean,
  text:String, searchTerms:String, supplierSlug:String, franchise:UUID
): ActivitySearchResult   # { items:[ActivityCard], total, latitude, longitude }
```

`ActivityCard` carries 37 fields including `name, supplierName, postcode, latitude, longitude, distanceInMiles, ageRange, activityType, bookingType, times, dateRange, weekdays, categories, nextSessionDate, priceRange, anySpotsLeft, trialAvailable`.

**I verified this live against the target area on 2026-08-11.** Query: postcode `SE10 8EW`, 3-mile radius, ages 0–60 months, 2026-08-11 → 2026-09-10:

```
total: 37    centre: 51.476494, -0.020038  (correct for Greenwich)
```
Genuine under-5 results returned:
- *Tippy Toes Ballet Greenwich 2–4 years Saturday 9.40am* — SE10 8JA, **0.2 mi**, 05 Sep – 19 Dec
- *Tippy Toes Ballet Greenwich 2–4 years Saturday 10.15am* — SE10 8JA, 0.2 mi
- *Tippy Toe Twinkles Lewisham 2–4 years 9.15am* — SE13 5QL, 1.7 mi, 05 Sep – 19 Dec
- *Summer Music & Song on The Green* — SE15 3QF, 1.8 mi, **0–5 yrs**, 14 Aug – 04 Sep
- *Beyond Gymnastics, Newlands* — SE15 3AZ, 3 yrs 6 mths – 6 yrs 11 mths
- *Tippy Toe Sparkles Greenwich 3–6 years* — SE10 8JA, 0.2 mi

**This is the single best-shaped query result of the entire research leg** — native postcode-radius *and* date window *and* age-in-months filtering, returning exactly the target inventory.

**(c) Entirely undocumented.** No developer portal, no pricing, **no published rate limits**, no support, no stability guarantee. `marketplaceActivities` with no geo filter caps `total` at 500; filtered queries return true counts. `marketplaceActivitySitemapInfo` reports **8,351 activities** total (`pageSize` 200, 42 pages).

**(e)** `activities.bookpebble.co.uk/robots.txt` disallows only `/activities/*/search`; sitemaps at `https://api.bookpebble.co.uk/sitemap/{franchise,supplier,activities}.xml`. Activity pages have no JSON-LD but a complete `__NEXT_DATA__` GraphQL payload including `ageMonthsStart/End` and `location{postCode, latitude, longitude}`. No ICS, no RSS. **Pebble does not publish OpenActive feeds** — verified against `data-catalog-collection.jsonld` and `singular.jsonld`; direct probes of `/openactive` and `/feeds/sessions` returned 403/404.

**(f) Among the strongest anti-scraping language found anywhere in this research.** Pebble User EULA (`https://bookpebble.co.uk/terms/care-seeker`, updated 16 Jun 2026), use-restrictions ~§9. Users must not:

> "conduct, facilitate, authorise or permit any **text or data mining or web scraping** in relation to the Pebble Platform **for any purpose**"

> "**collect or harvest any information or data** from the Pebble Platform or our systems"

> "use **automated scripts** to collect information from or interact with the Pebble Platform (or any part thereof) in any way"

> "…or otherwise **commercially exploit** the Pebble Platform or **any content made available on or from the Pebble Platform**"

> "…**display, publish, copy, print, post or otherwise use the Pebble Platform and the information contained therein for the benefit of any third party or website**"

**Verdict: the open endpoint reads as an oversight, not an offer.** Do not build on it. **Approach Sprout Care Ltd for a written agreement** — Pebble is used by many UK councils and libraries for under-5 sessions, and a sanctioned feed would be transformative for this project.

---

### 12.2 ClassForKids (classforkids.io) — highest-value *open* under-5 target

`classforkids.co.uk`, `class4kids.co.uk` and `classforkids.io` all resolve to `https://classforkids.io/en-GB`. Corporate site `www.classforkids.com`. Claimed scale: **4,500+ clubs, 1.5M parents**.

**(a) No public API and no documented API of any kind.** All probes 404: `/api/search`, `/api/listings`, `/api/locations`, `/api/discovery/search`, `/api/autocomplete`. `api.classforkids.io` does not resolve. The corporate `/partnerships/` page covers brand marketing partnerships only — no API, integration or data offering.

**(c)/(d) Geo search via public URLs — and it works for SE London.** Route pattern `/{lang}/classes/{location}[/{activity}]`:
- `https://classforkids.io/en-GB/classes/Greenwich`
- `https://classforkids.io/en-GB/classes/SE10%205JQ` — **postcodes work**, geocoded server-side
- `https://classforkids.io/en-GB/classes/Edinburgh/football` — activity filter

Each page returns ~24 server-rendered listings, each with a `distancemiles` value. **No date-window parameter** (camp listings carry their own start/end dates).

**Verified live on 2026-08-11.** All four target queries returned HTTP 200 with full payloads:

| Query | HTTP | Size |
|---|---|---|
| `/classes/SE10%205JQ` | 200 | 344,957 bytes |
| `/classes/Greenwich` | 200 | 349,334 bytes |
| `/classes/Lewisham` | 200 | 345,132 bytes |
| `/classes/Blackheath` | 200 | 332,669 bytes |

Parsing the SE10 page: **24 clubs, 48 listings**, each with `ageFrom`/`ageTo`, `postcode`, `distancemiles` and `classActivities`. Age ranges are **in months**, so under-5 filtering is exact. Sample from the SE10 page:

```
ageFrom/ageTo (months): (24,60) (48,143) (60,84) (48,144) (2,13) (6,36) (48,216) …
postcodes:  SE100LB  SE100LB  SE100LB  SE100DZ  SE109EQ  SE37SE  SE37SE
            SE37HF   SE77JP   E143EB   E143DW   E161TU   E162BB   SE30TP
clubs:      ProInfinity Coaching · ASG Sports in Schools · The Baby Cloud Greenwich
            El Recreo Greenwich & Kidbrooke · JK Performing Arts · The PE Specialists
            London Bulls Basketball Academy · Strawberry Kiwi Arts
```

Genuine under-5 providers confirmed: **The Baby Cloud Greenwich (2–13 months)**, **El Recreo Greenwich & Kidbrooke (6–36 months)**, plus a 24–60-month class. Postcodes land squarely across SE10, SE3, SE7, E14 and E16 — Greenwich, Blackheath, Charlton, Isle of Dogs and Docklands.

**(e) Sitemaps plus a rich embedded JSON payload.**
- `robots.txt` disallows **only `/iframe/*`**. Declares `https://classforkids.io/sitemap.xml` and `https://classforkids.io/clubs/sitemap.xml` (the latter currently **HTTP 500**).
- `sitemap.xml` → `sitemap-0.xml` … `sitemap-7.xml`, 5,000 URLs each ≈ **40,000 location pages**, all `/en-GB/classes/{place}`.
- **No JSON-LD, no ICS, no RSS.** But pages are Next.js App Router and the RSC flight payload (`self.__next_f`) carries fully structured JSON per listing: `type` (KIDS_CLASS/KIDS_CAMP), `bsurl` (booking subdomain), `clubName`, `distancemiles`, `classActivities{activityName, activityType}`, `ageFrom`/`ageTo` (months), `listingdescription`, `logoUrl`, `postcode`, `venueName`, and for camps `campStartDate`, `campEndDate`, `campStartTime`, `campEndTime`, `dayPart`.
- The flight payload is directly fetchable: `curl -H "RSC: 1" "https://classforkids.io/en-GB/classes/Abbeyhill?_rsc=1"` → `text/x-component`. **[UNVERIFIED / unofficial — undocumented internal transport, may change without notice.]**

⚠️ **Postcode geocoding looked imprecise in one test** — `SW1A 1AA` resolved to `51.46158, -0.17300` (Clapham-ish, not Westminster). Validate before relying on it; prefer geocoding postcodes yourself from the returned `postcode` field.

**(f) No published terms of use at all.** The only legal documents linked from either `classforkids.io` or `www.classforkids.com` are a **Cookie Policy** and a **Privacy Policy** (`/legal/cookie-policy/`, `/legal/privacy-policy/`). No website terms, no acceptable-use policy, and therefore **no contractual anti-scraping or anti-redistribution clause found**. Combined with a robots.txt disallowing only `/iframe/*`, the public-page route is unusually unencumbered. *[Single-source by nature — this is the absence of a document. Re-check before relying on it, and treat politely: low request rates, clear User-Agent, attribution and deep links back to the club's booking page.]*

**Verdict: the highest-value openly-accessible under-5 source found.** ~40k crawlable pages, permissive robots.txt, no ToS restrictions located, structured JSON with postcode + distance + **exact age ranges in months**, and confirmed SE London under-5 inventory.

---

### 12.3 Outsavvy — the best *sanctioned* general-events fit

- **API:** `https://api.outsavvy.com/v1/`, docs `https://partners.outsavvy.com/developer`, OAuth2 bearer. Live probe of `/v1/events/search` → `401 {"error":"NO_AUTH"}`.
- **Global search, with a gate:** `/events/search` returns events "public on OutSavvy", but "The events API requires **special access** to retrieve events that are not linked to your partner account." Default token = your own events only.
- **Free. 5,000 calls per account per 24h**, increases on request. `page_number` / `page_size`.
- **Geo + date natively:** `latitude`, `longitude`, `range` (**miles**), `start_date`, `end_date`, `q`, `categories`, `organiser_id` — exactly the aggregator query shape.
- **Public pages:** robots.txt disallows only `*/profile/`; XML sitemap of `/event/{id}/{slug}`; JSON-LD with **`postalCode` AND `GeoCoordinates`** plus `AggregateOffer`. No ICS/RSS.
- **ToS: no anti-scraping clause found anywhere**, and the docs actively state "we suggest that you **store the data locally** so that you do not go over rate limits." Consumer T&C §2 non-commercial restriction binds ticket buyers, not API partners.
- ⚠️ **Coverage is the constraint** — Outsavvy is LGBTQ+/independent-focused and comparatively small. Under-5 yield likely **Low**.

### 12.4 WeGotTickets — the XML feed is still live in 2026

- **Confirmed live, not a legacy artifact.** Format docs at `https://services.wegottickets.com/feeds/` rendered `<lastBuildDate>Tue, 11 Aug 2026 23:09:14 +0100</lastBuildDate>` — generated today. Two formats: **RSS 2.0** and **custom XML** (`<wegottickets><event id>` with title, genre, description, image, date start/end, time, price min/max split into facevalue + bookingfee, venue, link, dateAdded, status).
- **Affiliate programme** (`https://clients.wegottickets.com/affiliates.php`): "Receive event data as **RSS or XML**"; already used by **Songkick, Ents24, Bandsintown, TickX, The List**; "**around 10,000 events** on sale at any one time".
- **Global, filterable by genre/region — but server-side, agreed at setup**, not by query parameter. Feed URLs issued on approval (`/af/{affiliate_id}/`); guessed endpoints 404.
- **Free, and pays commission.** Onboarding is a human-reviewed contact form — budget lead time.
- **No geo-radius, no date query.** Filter client-side. JSON-LD has `postalCode` but **no lat/lng** — geocoding required.
- **ToS:** blanket "None of this material may be reproduced or redistributed without our express written permission." **The affiliate programme is that express permission** — and it explicitly invites "Building a new event discovery platform?"
- Under-5 yield: **Low** (music/comedy/spoken word).

### 12.5 Billetto — viable, three questions to resolve first

- **Genuine public, platform-wide search API.** UK base `https://billetto.co.uk/api/v3`; `GET /public/events`, `/public/events/{id}`. Auth header **`Api-Keypair`**. Live-verified: no key → `401 Missing access key id`; bogus key → `401 Invalid credentials`. Docs `https://api.billetto.com/` (plus `llms.txt`; every page fetchable as `.md`). Version `2026-02-10`.
- **Explicitly global:** "Retrieve a list of publicly available events **across Billetto's platform**." Sibling endpoints carry an explicit "*Scoping: response is scoped to the organizer that owns the API Keypair*" note — `/public/events` does **not**.
- **Partner gate, not a paywall** — contact `support@billetto.com`. No API tier on the pricing page.
- **Rate limiting is cost-based**, with `X-Ratelimit-Cost/-Limit/-Remaining/-Retry-After` headers and 429s, but **no rpm/rph numbers published** ("will be explained in the future"). **[UNVERIFIED]**
- **Geo partial, date absent:** `postal_code` (exact match, **not radius**) plus NUTS1/2/3 `macroregion`/`region`/`subregion`; response carries full `coordinates{latitude,longitude}` so radius maths is client-side. **No `from`/`to` date parameter at all**, and `limit` maxes at 100 with **no documented offset/page/cursor**.
- **Publisher obligations are contractual:** retain all **UTM tags** on outbound links, add `<link rel="canonical">` back to Billetto, **rehost images**, respect rate limits.
- **Do not scrape instead:** §11 "Ban on Commercial Use" — "Users have no right to and agree not to **use any means to extract data from the Site(s)**."
- ⚠️ **[UNVERIFIED]** Docs consistently say "publicly **advertised**" events and the sample URL carries `utm_source=Billetto+Advertising`. Whether that means the whole public catalogue or only advertising-enrolled events is **unresolvable from the docs and materially affects coverage.**

### 12.6 Ticket Tailor — per-box-office only

- Docs `https://developers.tickettailor.com` (note: `developer.` singular does not resolve); base `https://api.tickettailor.com`, v1. ~90 endpoints; also an **MCP server** (`/docs/mcp/`) and webhooks. Event-relevant: `GET /v1/events`, `/v1/events/{id}`, `/v1/event_series`, `/v1/event_occurrences`.
- Auth: HTTP Basic, API key as username (key format `sk_1000_1000_…`).
- **PER-BOX-OFFICE — stated explicitly:** *"Api keys are associated to the box office, meaning **an api key can only access data from the box office that issued it**."* `GET /v1/events` — "Returns a list of events **belonging to the box office**."
- **No plan gate** — Ticket Tailor has no subscription tiers ("We don't run a subscription model"). Free events free up to 5,000 tickets/yr; £0.60/ticket pay-as-you-sell; from £0.22 on prepaid credits.
- **Rate limits: 5,000 requests per 30 minutes**, plus endpoint-specific limits (`POST /v1/issued_memberships` — 30/hour). Headers `X-Rate-Limit-Limit`, `-Remaining`.
- **No geo/radius.** Cursor pagination (`starting_after`, `ending_before`, `limit` max 100). **Date-window filtering on `GET /v1/events` could not be confirmed** — the Docusaurus parameter tables render client-side and the underlying data chunks 404. **Flag as unestablished, not absent.**
- **Public discovery site** at `https://www.tickettailor.com/discover` with category pages (`/discover/categories/{theatre|workshops-and-classes|…}`) linking to `www.tickettailor.com/events/{boxoffice}/{event_id}`. Verified live: one `schema.org/Event` block with `name`, `description`, `organizer`, `startDate`, `endDate`, `location.address` as `PostalAddress` with **`postalCode`** — but **no `GeoCoordinates`** — and `offers[]` per ticket type. `www.tickettailor.com/sitemap.xml` holds 650 URLs and **zero event pages**. No ICS/RSS. robots.txt permissive.
- **ToS — the mildest in the set.** Website Terms of Use §4 is the only relevant clause: *"You must not use any part of the content on our Website for **commercial purposes without obtaining a licence** to do so from us."* Searching the ToU for *scrape / robot / spider / crawl / automated / data mining / harvest* returned **no matches**.
- **Verdict:** no bulk route; `/discover` + JSON-LD is technically clean but commercial redisplay needs a licence. Worth a low-cost conversation given zero anti-bot language.

### 12.7 TicketSource — the most hostile position found

- Developer guide `https://ticketsource.io`; base `https://api.ticketsource.io`; **public OpenAPI 3.1 spec** at `https://raw.githubusercontent.com/ticketsource/openapi-spec/main/reference/TicketSource-API.json`; reference `https://reference.ticketsource.io`. (`developer.ticketsource.io` and `docs.ticketsource.io` **do not resolve**.)
- 16 paths: `/events`, `/events/{id}`, `/events/{id}/venues`, `/events/{id}/dates`, `/venues/{id}`, `/venues/{id}/dates`, `/dates/{id}`, `/dates/{id}/bookings`, `/customers`(+), `/bookings/{id}`, `/bookings/{id}/seats`, `/seats/{id}`.
- Auth: API key (`skl-xxxxxxxxxx`) as HTTP Basic username or Bearer.
- **PER-ORGANISER ONLY.** `/events` returns "the events on **your** TicketSource account". Unauthenticated → `401 unauthorized — No valid API Key provided`. No search/discovery endpoint anywhere in the spec.
- Free (no API tier). **Rate limit 240 requests per 60 seconds** (stated identically in the guide's Best Practices and API Terms §2.4). §2.4 also imposes "a restriction to the data fields displayed per Application"; §2.6 reserves the right to **charge for API access in future**.
- **No geo/radius** — Venue carries a `postcode` string only. Date filtering exists but **on `/dates`, not `/events`**: `filter[start][operator]=on|before|after|between`. Pagination `?page=N&per_page=` (max 100).
- **Nothing harvestable:** public event pages live under `/booking/…` which **robots.txt explicitly disallows** (along with `/feed/`, `/services/`, `/webhooks/`). A live booking page had **zero JSON-LD, no ICS, no RSS**. Consumer "What's On" city pages carry **only `BreadcrumbList`** JSON-LD. `ticketsource.com/sitemap.xml` enumerates no event pages.
- **ToS closes both routes.** API Terms of Use (`https://www.ticketsource.com/kb/terms-of-use/api-terms-of-use`) §3.6: *"You shall not **redistribute** or re-sell, or sub-licence access to the API, **any data obtained using the API**… unless expressly permitted… pursuant to a separate duly executed written agreement."* §3.4: *"parse or scrape any of TicketSource's data"*; and no App "whose primary purpose is to **redirect Users from the Services**." Main T&Cs §2.3 prohibit "**Unauthorised use of any robot, spider, or other automated devices**"; §8.2 bars derivative works for "**competition**".
- **Verdict: unusable without a signed agreement.**

### 12.8 TryBooking — not viable

- Only API is an account-scoped **Reporting API**: `https://api.trybooking.com/uk/reporting/v1/` (docs `https://developer.trybooking.com/uk/`; `developers.` plural and `help.` both fail TLS). Basic Auth, key + secret from the organiser's portal.
- **Per-organiser decisively** — the event endpoint is named "Get By AccountId" and takes no query/location/organiser parameter. Aggregating would need every organiser's key **and secret**, which also exposes bookings, customer names and financial balances — a data-protection problem in itself.
- No rate limits documented (zero matches for rate/throttle/quota/429 in the full spec). Free (5% + 15p per ticket).
- **No geo query, no date query** on events; response does carry `venueLatitude`/`venueLongitude`.
- Harvest: **4,335 UK event URLs** in `https://www.trybooking.com/sitemap/uk-events-sitemap.xml` with `lastmod`; JSON-LD present but **thin and often malformed** — no `postalCode`, no `geo`, one sample `streetAddress` was literally `", , ,  "`. No ICS/RSS.
- **ToS kills it:** "Websites" is defined to **include APIs**; prohibits "any **automated device, software, process or means to access, retrieve, scrape, or index**" and "use or index any content or data… for purposes of **competing** with us"; downloads permitted "**only for private and non-commercial purposes**." Note the conflict — robots.txt grants `ClaudeBot`/`GPTBot` blanket `Allow: /`, but that is not the "express written consent" the ToU requires.

### 12.9 DICE.fm — see also §5

- **No official API, no developer programme.** `developer.dice.fm` and `partners.dice.fm` **do not resolve**; `/developers`, `/api`, `docs.dice.fm` all 404. `dice.fm/partners` is a sales page for **MIO**, their promoter dashboard.
- **Unofficial internal API [UNOFFICIAL — do not build on]:** page source leaks `window.EVENTS_API='https://events-api.dice.fm'`, `EVENTS_API_BASE='/v1'` and a client-side `EVENTS_API_KEY`. `GET /v1/events` with `x-api-key` → 200 JSON:API, globally scoped, rich `location{lat,lng,zip,city,street,region}`. `filter[cities][]` and `filter[date_from]`/`[date_to]` work; **lat/lng/radius params were silently ignored** (London coords returned Las Vegas events). The key is shipped to every visitor and can be rotated without notice.
- **Harvest:** ~30,000 event URLs across `dice.fm/sitemaps/sitemap{1,2,3}.xml` (`lastmod` 2026-08-11); good server-rendered `MusicEvent` JSON-LD with UK postcode **and** `GeoCoordinates`. No ICS/RSS.
- **robots.txt is an express Article 4 (EU DSM Directive 2019/790) reservation of rights**: `Content-Signal: search=yes, ai-train=no, use=reference`, with `ClaudeBot`, `GPTBot`, `CCBot`, `Google-Extended`, `Bytespider`, `Amazonbot`, `Applebot-Extended`, `meta-externalagent` all `Disallow: /`, plus `Disallow: /api/`.
- ⚠️ **DICE's ToS could not be retrieved.** `dice.fm/terms_and_conditions.html` 301s to a Zendesk section that returned 403 (ClaudeBot is banned) and a Cloudflare JS challenge to curl. **No claim is made about DICE's ToS clauses.**
- Under-5 relevance: **None.**

### Cross-cutting engineering note

**No platform in this set offers ICS or RSS on public event pages.** Only Outsavvy, Billetto, DICE and Pebble expose lat/lng; TicketSource, WeGotTickets, Ticket Tailor and ClassForKids give postcode only. **A postcode → lat/lng geocoding step (postcodes.io, free; or the ONS Postcode Directory) is a hard prerequisite** for radius search across most of these sources. This is also true of several OpenActive feeds' `Slot` records.

---

## 13. OpenActive — THE MAJOR FREE SOURCE

### What it is

OpenActive is the UK open data standard for the sport and physical activity sector, **stewarded by the Open Data Institute (ODI) and supported by Sport England and the National Lottery**. Over 50 organisations — from the UK's biggest leisure operators to community groups — publish open opportunity data.

Feeds use **RPDE (Real-time Paged Data Exchange)**, a paged JSON sync protocol designed for exactly this use case: keeping a downstream database in near-realtime sync without repeated full crawls.

### Discovery: the catalogue tree

```
https://openactive.io/data-catalogs/data-catalog-collection.jsonld
  ├── https://opendata.leisurecloud.live/api/datacatalog              (32 datasets)
  ├── https://openactivedatacatalog.legendonlineservices.co.uk/api/DataCatalog  (31 datasets)
  ├── https://openactive.io/data-catalogs/singular.jsonld             (23 datasets)
  └── https://app.bookteq.com/api/openactive/catalogue                (88 datasets)
```

Also `https://status.openactive.io/` — the OpenActive API Dashboard. Measured 2026-08-11: **213 distinct hosts, 546 distinct feed URLs**.

Preview and test variants exist at `data-catalog-collection-preview.jsonld` and `-test.jsonld`.

### The SE London publishers — all confirmed live

| Publisher | Dataset site | Feed base |
|---|---|---|
| **Southwark Council** | `https://southwarkcouncil-oa.leisurecloud.net/OpenActive/` | `https://opendata.leisurecloud.live/api/feeds/SouthwarkCouncil-live-*` |
| **LB Tower Hamlets** (Be Well) | `https://towerhamletscouncil.gs-signature.cloud/OpenActive/` | `https://opendata.leisurecloud.live/api/feeds/TowerHamletsCouncil-live-*` |
| **GLL / Better** | `https://better-admin.org.uk/api/openactive/better` | `https://better-admin.org.uk/api/openactive/better/*` |
| **GLL (Legend)** | `https://gll-openactive.legendonlineservices.co.uk/OpenActive` | `/api/sessions`, `/api/facility-uses`, `/api/facility-uses/events` |
| **GLL swim lessons (CoursePro)** | — | `https://betterflow.coursepro.co.uk/odi/session-series`, `/odi/scheduled-sessions`, `/odi/feed` |
| **Southwark Council (Bookteq)** | — | `https://southwarkcouncil.bookteq.com/api/open-active` |
| **Better (legacy)** | `http://data.better.org.uk/` | `https://www.better.org.uk/odi/sessions.json` (RPDE v0.2.3) |

Southwark and Tower Hamlets each expose five feeds:
```
CourseInstance    .../{Council}-live-course-instance
SessionSeries     .../{Council}-live-session-series
ScheduledSession  .../{Council}-live-scheduled-sessions
FacilityUse       .../{Council}-live-facility-uses
Slot              .../{Council}-live-slots
```
All conform to *"OpenActive RPDE v1.0 Endpoints conforming to Modelling Specification 2.0"*, with a **14-day rolling lookahead window** and **updates every minute**.

GLL/Better exposes four:
```
SessionSeries     https://better-admin.org.uk/api/openactive/better/session-series
ScheduledSession  https://better-admin.org.uk/api/openactive/better/scheduled-sessions
FacilityUse       https://better-admin.org.uk/api/openactive/better/facility-uses
Slot              https://better-admin.org.uk/api/openactive/better/slots
```

### Measured volumes, 2026-08-11

| Feed | Live records | SE London | Under-5/family | Crawl cost |
|---|---|---|---|---|
| GLL/Better SessionSeries | 2,593 | 530 | 18 named series | 10 pages, 15 s |
| GLL/Better FacilityUse | 1,889 | 326 | 29 | 4 pages, 7 s |
| GLL/Better ScheduledSession | **301,572** | — | — | 668 pages, 472 s |
| Southwark SessionSeries | 2,887 | 2,351 | 73 | 6 pages, 1 s |
| Southwark ScheduledSession | **6,059** | — | — | 59 pages, 4 s |
| Southwark CourseInstance | 7 | 7 | 0 | 1 page |
| Tower Hamlets SessionSeries | 755 | — | — | 6 pages, 0 s |
| Tower Hamlets ScheduledSession | **3,994** | — | — | 57 pages, 4 s |
| GLL swim (betterflow) SessionSeries | 905 | — | under-5 products present | 5 pages, 9 s |

*"SE London" = venue postcode matching `^(SE|BR|E14|E3|E16)` or falling inside bbox 51.39–51.56 N, −0.12–0.16 E. This is deliberately broad and includes some Lambeth/Croydon SE-postcode venues. A strict-borough filter on GLL SessionSeries yields ~159 records across The Eltham Centre (43), Forest Hill Pools (35), Charlton Lido (30), Glass Mill (28), The Greenwich Centre (16) and Sutcliffe Park (7).*

**Dated instance volume — the number that matters for a weekly what's-on:**

| Feed | Instances in feed | Date range | **Next 7 days** |
|---|---|---|---|
| Southwark ScheduledSession | 6,059 | 2026-08-11 → 2026-08-25 | **3,086** |
| Tower Hamlets ScheduledSession | 3,994 | 2026-08-11 → 2026-08-25 | **2,030** |
| GLL/Better ScheduledSession | 301,572 | 2023-02-11 → 2027-09-01 | (national, needs date+geo filter) |

That is **5,116 dated session instances in the next 7 days** from two councils alone, before GLL is added.

**Note on the GLL ScheduledSession feed:** unlike the council feeds it is *not* a rolling 14-day window — it carries 301,572 records spanning **2023-02-11 to 2027-09-01**, i.e. historic sessions as well as forward-dated ones. Filter by `startDate` on ingest. A full crawl takes 668 pages / ~8 minutes; after that, RPDE incremental sync makes weekly refresh near-instant. For most purposes the 2,593-record **SessionSeries** feed (15 seconds) plus local expansion of `eventSchedule` is the cheaper route.

### Confirmed under-5 / family sessions in the target boroughs

**GLL / Better:**
- *Toddlers' World* — The Greenwich Centre (SE10 9GB)
- *Toddlers' World* — Forest Hill Pools (SE23 3HZ)
- *Toddlers World Under 2's* — Charlton Lido and Lifestyle Club (SE18 4LX)
- *Toddler Splash* — Glass Mill Leisure Centre (SE13 7FT)
- *Toddler Splash* — Charlton Lido (SE18 4LX)
- *Family Fun Swim* — Glass Mill (SE13 7FT), Thamesmere (SE28 8RE)
- *Soft Play* and *SEND Soft Play* — Sutcliffe Park Sports Centre (SE9 5LW)
- *Parent & Baby Yoga* — Britannia Leisure Centre (N1 5FT, out of area)

**Southwark Council:**
- *Under 5 Swim* — Dulwich Leisure Centre (SE22 9HB)
- *Family Swim* — Dulwich (SE22 9HB), The Castle Centre (SE1 6FG), Peckham Pulse (SE15 5QN), Camberwell (SE5 8TS)
- *Family Fun Swim* / *Family Disability Swim* — Peckham Pulse (SE15 5QN)
- *Move Games — Family Swim* — Camberwell (SE5 8TS), The Castle Centre (SE1 6FG)
- *Family Fun Day* (incl. SEND Hour) — Southwark Athletics Track (SE16 2PE)

**GLL swim lessons (betterflow):** genuine under-5 product lines exist — *Swimbies — Dippers (3–12 months)*, *Swimbies — Splashers (13–24 months)*, *Swimbies — Paddlers (2–3 yrs)*, *Pre School 3–5yrs (Adult required in water)*, *Pre School 3–5yrs (Adult not req in water)*. **However**, locations in this feed carry only `name` + `geo` (no postcode) and no SE London venues matched in my location-name test — this feed appears to cover non-London GLL centres. **[Partially verified — worth a second pass with geo-only matching.]**

### Data richness

Records carry everything needed for a listings site:

```json
{"@type":"SessionSeries","identifier":"PP2SW0900SS1023","name":"Silver Swim",
 "eventSchedule":[{"@type":"PartialSchedule","byDay":["https://schema.org/Tuesday"],
   "duration":"PT1H","startTime":"09:00","endTime":"10:00",
   "scheduleTimezone":"Europe/London","startDate":"2023-10-24"}],
 "location":{"@type":"Place","name":"Peckham Pulse Leisure Centre",
   "address":{"@type":"PostalAddress","streetAddress":"10 Melon Road",
     "addressLocality":"Southwark","addressRegion":"London",
     "postalCode":"SE15 5QN","addressCountry":"GB"},
   "geo":{"latitude":51.474074,"longitude":-0.070885},
   "openingHoursSpecification":[...]}}
```

Plus `offers` (price, currency, ageRestriction), `ageRange` (minValue/maxValue), `organizer`, `url`, `maximumAttendeeCapacity`, `genderRestriction`, `activity` (controlled vocabulary from `https://openactive.io/activity-list`), and `eventAttendanceMode`.

### (c) Geo search

Not a query parameter — feeds are **bulk sync, not search**. You ingest everything and index locally. Every record carries `geo.latitude`/`geo.longitude` and a full `PostalAddress` with `postalCode`, so **radius search around a UK postcode is trivial once ingested** — and it runs against your own database at zero marginal cost.

### (d) Date filtering

Same: not a query parameter. `ScheduledSession` records carry `startDate`/`endDate`; `SessionSeries` carry `eventSchedule` with `repeatFrequency`, `byDay`, `startTime`, `repeatCount`, `exceptDate` and `idTemplate`/`urlTemplate` for expanding into instances. Southwark and Tower Hamlets publish a 14-day rolling window; filter locally.

### How RPDE consumption works

From the RPDE specification:

- Records are ordered **deterministically and chronologically by modification time**; each record appears once, positioned by `modified`.
- The `next` property gives a precomputed URL for the following page — *"The `next` URL MUST be calculated from the last item used to generate the current page, and use the current page's own URL if no items exist."*
- Cursors are `afterTimestamp` (modified threshold) and `afterId` (tiebreak for equal timestamps). An alternative `afterChangeNumber` counter is permitted.
- **Critical implementation note:** *"Misreading the query in the specification is the single most common cause of incorrect implementation"* — use `>` not `>=`.
- **Last page detection requires BOTH:** `items` is an empty array **AND** `next` matches the current page URL.
- **Deletions:** *"items must never disappear from the feed without first passing through the `deleted` state"* — so you get explicit tombstones (`{"state":"deleted","kind":"SessionSeries","id":"...","modified":...}`) and can prune correctly.
- **Incremental refresh:** after the initial sequential crawl, *"the consumer MAY poll the endpoint infrequently at the last page URL to check for updates"*, resuming sequential paging when new items appear.

**This is the operational win.** The initial crawl is a one-off; the weekly refresh only pulls changed records. Southwark's entire ScheduledSession feed (6,059 records, 59 pages) crawls in **4 seconds**.

### (f) Terms of Service — the best of any source

Every feed measured carries, in its payload:

```json
"license": "https://creativecommons.org/licenses/by/4.0/"
```

Dataset sites confirm: *"Creative Commons Attribution Licence (CC-BY v4.0)"* with required attribution to the publisher (Southwark Council / London Borough of Tower Hamlets / Better / Bookwhen / Open Sessions).

**This is explicit, irrevocable permission to store, transform and redisplay the data on a third-party site, commercially, provided you attribute.** No rate limits, no API key, no quota, no ToS negotiation, no takedown risk.

Caveat noted on the catalogue collection metadata: *"although these feeds were compliant when they were built, they may not be compliant at the time of access"* — build defensively.

### Other OpenActive publishers worth evaluating

From `singular.jsonld` (23 datasets):
```
https://data.bookwhen.com/                        (measured — see §11)
https://goteamup.com/api/openactive/v1/           (TeamUp — used by many class providers)
https://openactive.opensessions.io/               (Open Sessions, owned by London Sport Ltd)
https://ourparks.org.uk/openactive                (Our Parks — free outdoor London sessions)
https://openactive.upshot.org.uk/                 (Upshot)
https://playwaze.com/opendata/openactive
https://opendata.exercise-anywhere.com/
https://www.goodgym.org/api/openactive/
https://api.findmyfacility.com/v1/openactive
https://data.englandnetball.co.uk/
https://data.runtogether.co.uk/
```

**I measured the two most promising of these on 2026-08-11. Both are weaker than expected:**

| Feed | Live records | SE London | Under-5 matches |
|---|---|---|---|
| Open Sessions SessionSeries | 1,499 | **184** | **1** (*Infants Boxing, Ages 5–9* — SE3 8ND, not actually under-5) |
| Open Sessions Events | 85 | 7 | 0 |
| TeamUp SessionSeries | 265 | 3 | 0 |
| TeamUp Events | 667 | 21 | 0 |

**Open Sessions** (`https://opensessions.io/api/rpde/session-series`, `/api/rpde/events`) is owned by **London Sport Ltd** and is CC-BY 4.0. Its 184 SE London session-series make it a worthwhile *general community activity* source, but it yields essentially **nothing for under-5s**.

**TeamUp** (`https://goteamup.com/api/openactive/v1/`) is, like Bookwhen, **opt-in per provider and thinly populated** — 265 SessionSeries nationally, 3 in SE London, zero under-5. The hypothesis that TeamUp/Bookwhen would serve as an open-licensed proxy for Happity's provider base **does not hold up on measurement**. The independent baby/toddler providers who use these platforms have overwhelmingly not enabled open-data publication.

**Our Parks** (`https://ourparks.org.uk/api/events`) runs free outdoor sessions across London parks. Measured (partial crawl, 10 pages / 90 s cap): **1,481 records, 501 in SE London, 0 under-5 keyword matches.** Good London density but it is an adult outdoor-fitness programme — useful for parent-focused (rather than child-focused) listings, e.g. buggy fitness, but not for under-5 sessions.

**Bookteq — Southwark Council** (`https://southwarkcouncil.bookteq.com/api/open-active`, CC-BY 4.0) publishes only **FacilityUse** and **Slot** feeds (`/facility-uses`, `/slots`) — i.e. bookable pitch/hall slots, not programmed sessions. Measured: 100 slots, no SE London geo matches. **Low value** for a what's-on listing. The same shape applies to most of the 88 Bookteq datasets (schools, sports clubs, parish councils).

Bookteq's catalogue (88 datasets) includes `https://southwarkcouncil.bookteq.com/api/open-active` — a **second, separate** Southwark feed covering community/school facility bookings, plus Haringey, Ealing, Waltham Forest and Corams Fields.

### Verdict: **Use now — this is the foundation of the whole project.**

---

## Top 5 highest-value sources for under-5 SE London

### 1. OpenActive — Southwark Council + Tower Hamlets Council feeds
**Why:** 10,053 dated session instances in a rolling 14-day window, of which 5,116 fall in the next 7 days. Full postcode and lat/lng on every record. CC-BY 4.0 — explicit permission to redisplay. Entire Southwark ScheduledSession feed crawls in 4 seconds. Confirmed under-5 inventory: *Under 5 Swim* (Dulwich), *Family Swim* (Peckham Pulse, Camberwell, Castle Centre, Dulwich), *Family Fun Day* with SEND Hour (Southwark Athletics Track). **Cost: £0.** Two of the nine target areas covered natively, at production quality, today.

### 2. OpenActive — GLL / Better feeds
**Why:** GLL operates the leisure centres across the *rest* of the target patch — The Greenwich Centre, The Eltham Centre, Glass Mill (Lewisham), Forest Hill Pools, Charlton Lido, The Plumstead Centre, Thamesmere, Sutcliffe Park, Bellingham, Waterfront (Woolwich), Coldharbour. Confirmed under-5 sessions: *Toddlers' World*, *Toddlers World Under 2's*, *Toddler Splash*, *Family Fun Swim*, *Soft Play*, *SEND Soft Play*. 2,593 national SessionSeries crawl in 15 seconds. CC-BY 4.0. **Cost: £0.** Together with #1 this covers Greenwich, Lewisham, Eltham, Woolwich, Charlton, Forest Hill and Southwark.

### 3. ClassForKids (classforkids.io) — the highest-value *openly accessible* under-5 source
**Why:** This is the biggest surprise of the research. No API, but ~**40,000 crawlable location pages**, a `robots.txt` that disallows only `/iframe/*`, and **no published terms of use whatsoever** — only a cookie policy and a privacy policy. Every listing carries structured JSON (Next.js RSC payload) with `postcode`, `distancemiles`, `clubName`, `classActivities` and — critically — **`ageFrom`/`ageTo` in months**, so under-5 filtering is exact rather than keyword-guessed.

**Verified live 2026-08-11:** `/en-GB/classes/SE10%205JQ`, `/Greenwich`, `/Lewisham` and `/Blackheath` all returned HTTP 200 with full payloads (~340 KB each). The SE10 page alone yielded 24 clubs / 48 listings across SE10, SE3, SE7, E14 and E16, including **The Baby Cloud Greenwich (2–13 months)** and **El Recreo Greenwich & Kidbrooke (6–36 months)**. **Cost: £0.**

*Caveats:* their postcode geocoding was imprecise in one test — geocode the returned `postcode` yourself. The RSC transport is undocumented and may change. And "no ToS found" is the absence of a document, not a grant — crawl politely (low rate, honest User-Agent, attribution and deep links back to each club's booking page), and re-check for a published ToS before scaling.

### 4. Pebble, Happity and Hoop — as *partners*, not as sources
**Why:** These three hold the richest under-5 SE London inventory of anything researched, and none can be consumed lawfully today.

- **Pebble** has the single best-shaped API found anywhere in this research — unauthenticated public GraphQL with native postcode+radius **and** date window **and** age-in-months. My live test (SE10 8EW, 3 miles, ages 0–60 months, 30 days) returned **37 activities** including Tippy Toes Ballet Greenwich (0.2 mi), Tippy Toe Twinkles Lewisham and a 0–5yrs music session in Peckham. **But its EULA explicitly forbids web scraping, data harvesting, automated collection and commercial exploitation of platform content.** The open endpoint reads as an oversight, not an offer. Pebble is also widely used by UK councils and libraries for under-5 sessions — a sanctioned feed from **Sprout Care Ltd** would be transformative.
- **Happity** is behind a Cloudflare challenge with `/events/` disallowed, ClaudeBot/GPTBot banned and an Article 4 rights reservation.
- **Hoop**'s robots.txt is fully permissive but its ToS forbids automated interaction; it maintains `/partners/` and `/health-visitors/` pages.

**The correct move is a relationship, not a crawler.** Submitting your events to these platforms and negotiating reciprocal feeds converts the project's biggest legal risk into its biggest content win. **Cost: relationship-building time, £0 API spend.**

### 5. Sanctioned general-event APIs — Ticketmaster, Outsavvy, WeGotTickets
**Why:** Breadth and resilience at zero cost, for the occasional big family event that the session feeds miss.

- **Ticketmaster Discovery** — free, 5,000 calls/day, 5 req/sec; `postalCode` + `radius` + `startDateTime`/`endDateTime` + `includeFamily`. Watch the cache-only ToS clause and the `size * page < 1000` deep-paging cap. Under-5 yield **Low** (arena family shows, pantomime).
- **Outsavvy** — the best *sanctioned* fit on paper: free, 5,000 calls/day, native lat/lng + `range` in miles + `start_date`/`end_date`, no anti-scraping clause, and docs that explicitly *encourage* local caching. Requires requesting "special access" for platform-wide search. Under-5 yield **Low** (small, independent/LGBTQ+-focused catalogue).
- **WeGotTickets** — the RSS/XML affiliate feed is confirmed live in 2026 (`lastBuildDate` generated today), ~10,000 events, free, pays commission, and the affiliate programme *is* the express permission their copyright notice otherwise withholds. No geo or date query — filter client-side, and geocode (postcode only, no lat/lng). Apply early; onboarding is human-reviewed. Under-5 yield **Low**.

**Cost: £0 across all three.**

### Honourable mention (tier 2) — the wider OpenActive catalogue
546 feed URLs across 213 hosts, nearly all CC-BY 4.0. Measured SE London density is genuinely useful: **Open Sessions** (London Sport Ltd) 184 SE London session-series; **Our Parks** 501 SE London records. Both free, keyless, openly licensed.

**But measurement says this tier delivers breadth, not under-5s.** Across Open Sessions, Our Parks, TeamUp, Bookwhen and Bookteq-Southwark I found **essentially zero genuine under-5 sessions** (the single hit, *Infants Boxing Ages 5–9*, is out of range). TeamUp (265 records nationally, 3 in SE London) and Bookwhen (1,857 nationally, 82 in SE London, 1 under-5) do **not** work as open-licensed proxies for Happity's provider base. Bookteq's Southwark dataset is facility slots, not programmed sessions. Use this tier for general family/community breadth and source resilience.

**Explicitly ranked out:** Eventbrite (no search since Feb 2020), Meetup (Pro-gated, low relevance), Facebook (Marketing-Partner only), DICE (no API, no relevant inventory), Day Out With The Kids (explicit scraping ban, wrong data shape), Kidadl/Netmums/Mumsnet Local (no event-shaped machine-readable data; Mumsnet Local is dead), TicketSource / TryBooking / Ticket Tailor (all per-organiser only — no cross-organiser search exists, so aggregation is structurally impossible without collecting every provider's own API key), Billetto (viable but unresolved coverage question and no date filtering; low under-5 yield).

---

## Budget verdict

**The £20/week budget is never touched.** Every recommended source costs **£0**:

- OpenActive: no key, no quota, CC-BY 4.0. Only cost is compute and bandwidth — Southwark's full ScheduledSession feed is 59 pages in 4 seconds; GLL SessionSeries is 10 pages in 15 seconds; Bookwhen's entire feed is 3.5 minutes. A full weekly re-crawl of everything is well under 10 minutes of compute. RPDE incremental sync makes even that unnecessary after the first run.
- Ticketmaster: free tier, 5,000 calls/day (35,000/week) against a need of perhaps 50.
- Skiddle, Outsavvy: free keys. WeGotTickets: free, and pays commission.
- ClassForKids: public pages, no key. A weekly crawl of ~40 SE London location pages is trivial.

**Geocoding is free too.** `postcodes.io` is a free, unlimited, open-licensed UK postcode → lat/lng API (or use the ONS Postcode Directory offline). This is a hard prerequisite: TicketSource, WeGotTickets, Ticket Tailor and ClassForKids all give postcode without coordinates, as do several OpenActive `Slot` records.

Budget is therefore better spent on **editorial and community-submission tooling** — the Facebook-group, church-hall, children's-centre and library inventory that no API reaches is where the remaining coverage gap lives, and no amount of API spend closes it.

---

## Things that could not be established

- **Eventbrite `/v3/organizers/:organizer_id/events/`** — whether it returns events for organisers you do not administer. Eventbrite's developer docs at `eventbrite.com/platform/api`, `/platform/docs/introduction` and `/platform/docs/changelog` are JavaScript-rendered and returned only a page title to automated fetch. Needs testing with a live OAuth token.
- **Meetup Pro exact 2026 pricing** — `help.meetup.com` returned HTTP 403.
- **Skiddle exact daily/hourly rate-limit numbers** — acknowledged to exist but not published on the API landing page.
- **Happity** — no page on the domain was retrievable (403 on both curl with full browser headers and WebFetch). JSON-LD presence, internal API existence and ToS text all remain unknown.
- **Hoop total SE London volume** — the 1,000-URL sitemap cap prevented a census.
- **Hoop `/partners/` page contents** — not fetched.
- **GLL betterflow (CoursePro) SE London coverage** — under-5 swim products confirmed to exist in the feed, but locations lack postcodes and no SE London venue names matched. Needs a geo-coordinate pass.
- **Ticket Tailor date filtering** on `GET /v1/events` — the Docusaurus parameter tables render client-side and the underlying data chunks return 404. **Unestablished, not absent.**
- **Billetto coverage semantics** — docs consistently say "publicly **advertised**" events. Whether `/public/events` returns the whole public catalogue or only advertising-enrolled events is unresolvable from the docs and materially affects value. Also: no published rpm/rph rate-limit numbers, and no documented pagination beyond `limit=100`.
- **DICE's Terms of Service** — `dice.fm/terms_and_conditions.html` 301s to a Zendesk section that returned 403 (ClaudeBot is banned there) and a Cloudflare JS challenge to curl. **No claim is made about DICE's ToS clauses.**
- **ClassForKids ToS** — none found, but this is the *absence* of a document rather than positive permission. Re-check before scaling.
- **Pebble rate limits** — none published; the API is entirely undocumented and may change or be locked down without notice.
- **Skiddle, Outsavvy, WeGotTickets and Billetto under-5 SE London yield** — not measured. All four need an API key or affiliate approval before a real query can be run.
- **WebSearch budget was exhausted (200/200)** partway through this research; all later verification was done via direct WebFetch and curl only.

---

## Bibliography

All URLs accessed **2026-08-11**.

**Eventbrite**
- Automattic. "Eventbrite v3 Search API is deprecated. Turning off Feb 20, 2020 · Issue #83." https://github.com/Automattic/eventbrite-api/issues/83
- Eventbrite. "API Terms of Use." https://www.eventbrite.com/help/en-us/articles/833731/eventbrite-api-terms-of-use/
- Eventbrite. "Eventbrite Terms of Service." https://www.eventbrite.com/help/en-us/articles/251210/eventbrite-terms-of-service/
- Eventbrite. "robots.txt." https://www.eventbrite.co.uk/robots.txt
- Eventbrite. "403 Forbidden when using events search API endpoint." https://groups.google.com/g/eventbrite-api/c/-E0MG7THMsc

**Ticketmaster**
- Ticketmaster. "Getting Started — Ticketmaster Developer Portal." https://developer.ticketmaster.com/products-and-docs/apis/getting-started/
- Ticketmaster. "Discovery API v2." https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
- Ticketmaster. "Terms of Use." https://developer.ticketmaster.com/support/terms-of-use/

**Meetup**
- Meetup. "API Doc Introduction." https://www.meetup.com/graphql/
- Meetup. "How can I get access to Meetup's API?" https://help.meetup.com/hc/en-us/articles/41453576628749-How-can-I-get-access-to-Meetup-s-API (HTTP 403 to automated fetch)
- Meetup. "API License Terms." https://help.meetup.com/hc/articles/360028705532

**Skiddle**
- Skiddle. "Skiddle API." https://www.skiddle.com/api/
- Skiddle. "Events API — web-api Wiki." https://github.com/Skiddle/web-api/wiki/Events-API
- Skiddle. "Skiddle Events API: Join." https://www.skiddle.com/api/join.php

**DICE**
- DICE. "robots.txt." https://dice.fm/robots.txt

**Meta / Facebook**
- Meta. "Event — Graph API Reference." https://developers.facebook.com/docs/graph-api/reference/event/

**OpenActive**
- OpenActive. "Home." https://www.openactive.io/
- OpenActive. "Data Feeds — OpenActive Developers." https://developer.openactive.io/publishing-data/data-feeds
- OpenActive. "How an RPDE data feed works." https://developer.openactive.io/publishing-data/data-feeds/how-a-data-feed-works
- OpenActive. "Realtime Paged Data Exchange (RPDE) specification." https://www.openactive.io/realtime-paged-data-exchange/
- OpenActive. "Data Catalog Collection." https://openactive.io/data-catalogs/data-catalog-collection.jsonld
- OpenActive. "Singular Data Catalog." https://openactive.io/data-catalogs/singular.jsonld
- OpenActive. "OpenActive Data Catalogs." https://openactive.io/data-catalogs/
- OpenActive. "OpenActive API Dashboard." https://status.openactive.io/
- OpenActive. "dataset-utils." https://github.com/openactive/dataset-utils
- Leisurecloud. "Data Catalog." https://opendata.leisurecloud.live/api/datacatalog
- Legend Online Services. "OpenActive Data Catalog." https://openactivedatacatalog.legendonlineservices.co.uk/api/DataCatalog
- Bookteq. "OpenActive Catalogue." https://app.bookteq.com/api/openactive/catalogue

**OpenActive publishers (SE London)**
- Southwark Council. "OpenActive Dataset Site." https://southwarkcouncil-oa.leisurecloud.net/OpenActive/
- Southwark Council. SessionSeries feed. https://opendata.leisurecloud.live/api/feeds/SouthwarkCouncil-live-session-series
- Southwark Council. ScheduledSession feed. https://opendata.leisurecloud.live/api/feeds/SouthwarkCouncil-live-scheduled-sessions
- London Borough of Tower Hamlets (Be Well). "OpenActive Dataset Site." https://towerhamletscouncil.gs-signature.cloud/OpenActive/
- Tower Hamlets Council. ScheduledSession feed. https://opendata.leisurecloud.live/api/feeds/TowerHamletsCouncil-live-scheduled-sessions
- Better (GLL). "OpenActive Dataset Site." https://better-admin.org.uk/api/openactive/better
- Better (GLL). SessionSeries feed. https://better-admin.org.uk/api/openactive/better/session-series
- Better (GLL). "Legacy ODI dataset site." http://data.better.org.uk/ and https://www.better.org.uk/odi/sessions.json
- GLL. Legend feeds. https://gll-openactive.legendonlineservices.co.uk/OpenActive
- GLL / CoursePro. https://betterflow.coursepro.co.uk/odi/session-series
- Open Sessions (London Sport Ltd). https://openactive.opensessions.io/ and https://opensessions.io/api/rpde/session-series
- Our Parks. https://ourparks.org.uk/openactive and https://ourparks.org.uk/api/events
- TeamUp. https://goteamup.com/api/openactive/v1/ and /sessionseries, /events
- Bookteq. "Southwark Council OpenActive dataset." https://southwarkcouncil.bookteq.com/api/open-active

**Bookwhen**
- Bookwhen. "OpenActive Dataset Site." https://data.bookwhen.com/
- Bookwhen. "Bookwhen API — Help Centre." https://support.bookwhen.com/en/articles/753664-bookwhen-api
- Bookwhen. "Link your events to Calendar feeds." https://support.bookwhen.com/en/articles/753352-link-your-events-to-calendar-feeds
- Bookwhen. API v2 reference. https://api.bookwhen.com/v2

**Consumer listing sites**
- Happity. "robots.txt." https://www.happity.co.uk/robots.txt
- Happity. "Home." https://www.happity.co.uk/ (HTTP 403 — Cloudflare challenge)
- Happity. "Happity for Providers." https://providers.happity.co.uk/ (unreachable)
- Hoop. "robots.txt." https://hoop.co.uk/robots.txt
- Hoop. "Sitemap index." https://hoop.co.uk/sitemap.xml
- Hoop. "Terms of Service." https://hoop.co.uk/terms-of-service/
- Hoop. "How Hoop Works." https://hoop.co.uk/how-hoop-works/
- Day Out With The Kids. "robots.txt." https://www.dayoutwiththekids.co.uk/robots.txt
- Day Out With The Kids. "Terms and Conditions." https://www.dayoutwiththekids.co.uk/terms-and-conditions
- Time Out. "robots.txt." https://www.timeout.com/robots.txt
- Time Out London. "RSS feed." https://www.timeout.com/london/feed.rss
- Kidadl. "robots.txt." https://kidadl.com/robots.txt
- Netmums. "robots.txt." https://www.netmums.com/robots.txt
- Mumsnet. "robots.txt." https://www.mumsnet.com/robots.txt
- Mumsnet. "Sitemap." https://www.mumsnet.com/sitemap.xml

**Ticketing / booking platforms**
- Pebble (Sprout Care Ltd). GraphQL API. https://api.bookpebble.co.uk/graphql/
- Pebble. "Pebble User EULA (care seeker)." https://bookpebble.co.uk/terms/care-seeker (updated 16 Jun 2026)
- Pebble. Marketplace and robots.txt. https://activities.bookpebble.co.uk/robots.txt
- ClassForKids. "Find classes." https://classforkids.io/en-GB and https://classforkids.io/en-GB/classes/SE10%205JQ
- ClassForKids. "robots.txt." https://classforkids.io/robots.txt and https://classforkids.io/sitemap.xml
- ClassForKids. "Cookie Policy / Privacy Policy." https://www.classforkids.com/legal/cookie-policy/ , /legal/privacy-policy/
- Outsavvy. "Developer documentation." https://partners.outsavvy.com/developer (API base https://api.outsavvy.com/v1/)
- WeGotTickets. "Feeds." https://services.wegottickets.com/feeds/
- WeGotTickets. "Affiliates." https://clients.wegottickets.com/affiliates.php
- Billetto. "API documentation." https://api.billetto.com/ (UK base https://billetto.co.uk/api/v3)
- Ticket Tailor. "Developer documentation." https://developers.tickettailor.com (API base https://api.tickettailor.com)
- Ticket Tailor. "Discover." https://www.tickettailor.com/discover
- TicketSource. "Developer guide." https://ticketsource.io and reference https://reference.ticketsource.io
- TicketSource. "OpenAPI 3.1 spec." https://raw.githubusercontent.com/ticketsource/openapi-spec/main/reference/TicketSource-API.json
- TicketSource. "API Terms of Use." https://www.ticketsource.com/kb/terms-of-use/api-terms-of-use
- TryBooking. "Reporting API developer docs." https://developer.trybooking.com/uk/
- TryBooking. "UK events sitemap." https://www.trybooking.com/sitemap/uk-events-sitemap.xml
- DICE. "Sitemaps." https://dice.fm/sitemaps/sitemap1.xml

**Councils**
- Royal Borough of Greenwich. "Events." https://www.royalgreenwich.gov.uk/events
- Lewisham Council. "Events." https://lewisham.gov.uk/events
- Lewisham Libraries. "Events." https://libraries.lewisham.gov.uk/events
