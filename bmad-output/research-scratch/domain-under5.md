# Domain Research: What Under-5 Parents & Carers in South East London Actually Want Listed

**Research leg:** Demand taxonomy + source universe
**Geography:** Greenwich, Lewisham, Southwark, Bromley + Deptford / Blackheath / Woolwich / Eltham, plus Isle of Dogs (Tower Hamlets)
**Audience:** Parents and carers of children aged 0–5 (pre-school)
**Date of research:** 2026-08-11
**Method:** Web search + direct page fetches of council, library, family hub, provider and directory pages

---

## 0. Executive summary — the five findings that matter

1. **The under-5 audience is not the "family events" audience.** Generic "family-friendly London events" surfaces museums, festivals and theatre pitched at 5–12s. The under-5 demand set is dominated by *free, weekly, local, walk-to-it, drop-in* sessions — rhyme time, stay & play, and church/community toddler groups — which almost never appear in an events search.
2. **Roughly 80–90% of the under-5 activity universe is weekly recurring, term-time-bound, and undated.** A discovery system built around "events in the next 14 days" structurally cannot see it, because the source publishes "Tuesdays 10:30, term time" and never emits a dated occurrence.
3. **The highest-value sources are mostly the least machine-readable — but there are four free, structured feeds nobody is using.** Family hubs publish PDF/JPEG timetables, Bromley's children's centres publish via Issuu, and church groups often exist only as a line on a parish page or a Facebook post. Against that, this research found four genuinely ingestible high-yield channels that appear entirely unexploited: **ChurchSuite's public JSON calendar**, **The Play Map's server-rendered borough registers**, the **Greenwich Community Directory sitemap** (~450 under-5 records), and **Quaggy's public Google Calendar ICS**. See §3.0 and §3.8.
4. **Term-time is a first-class field.** A very large share of the corpus does not run in school holidays. Listing a term-time session during August half of the year is a *false positive* that destroys trust faster than a missing listing.
5. **The metadata that decides whether a parent goes is age-in-months, cost, drop-in-vs-booking, buggy access and walkability** — none of which a generic event search captures. Happity and the Play Map capture some of it; nobody captures all of it for SE London.

---

## 1. The real demand taxonomy for under-5s

### 1.1 How this was grounded

Evidence base for the taxonomy (full citations in the bibliography):

- **Parent-stated demand:** Mumsnet Local threads for Greenwich and Lewisham, and the national Mumsnet thread *"How do you find baby and toddler activities in London?"* — where the original poster's complaint is the exact problem statement for this project: *"Everything is scattered across all manner of websites, Instagram, blog posts"* and she *"slightly loses the will to scroll."* Replies name Happity, local Facebook groups, museum mailing lists, **library story/rhyme time, children's centre stay-and-play, and church toddler groups** as the actual discovery channels.
- **Supply-side taxonomy:** the category lists actually used by Happity, the Play Map, Toddle About and Pebble; and the borough library session names (Rhymetime, Bookstart, Baby and Toddler Session, Toddler Time, Baby Bounce).
- **Statutory taxonomy:** the DfE/DHSC *Family Hubs and Start for Life programme guide* defines the services every family hub must offer 0–5 — this is a reliable spine for the "support" half of the taxonomy (infant feeding, parenting support, perinatal mental health, SEND, home learning environment).
- **Local round-ups:** Greenwich Mums, SilverSpoon London, Lewisham Council Local Offer under-5s page.

### 1.2 The taxonomy table

Cost bands: **Free** | **£** (≤£5) | **££** (£6–£12) | **£££** (£13+)
Discovery difficulty: **1 = easy** (dated, structured, linkable) → **5 = very hard** (undated, PDF/social only, or unpublished)

| # | Category | Recurring? | Typical frequency | Typical cost | Where it is published | Discovery difficulty |
|---|---|---|---|---|---|---|
| 1 | **Rhyme Time / Baby Bounce / Bookstart / Storytime at libraries** | Recurring | Weekly, often 2–4 slots per branch per week; **term time only** in most branches | **Free**, no booking | Council library pages (Southwark: full HTML table); Better/GLL library pages (Greenwich, Bromley — generic, no per-branch times); Lewisham LUCi events system; borough round-up blogs | **4** — highest demand, worst structured data |
| 2 | **Stay & Play / drop-in play at children's centres & family hubs** | Recurring | Weekly, Mon–Fri mornings, most hubs run daily | **Free** (some £1–2) | Family hub sites (Lewisham: **PDF + JPEG** timetables); centre-operator sites (1st Place, PPRN CFC, Bermondsey & Rotherhithe, Dulwich Wood); Better children's centre pages | **5** — PDF/image timetables, changes termly |
| 3 | **Church / faith-run parent & toddler groups** | Recurring | Weekly, term time, usually one morning | **Free–£** (often £1–2 incl. refreshments) | A single line on a parish website; parish Facebook page; A-Change-of-notice noticeboard; frequently nowhere online | **5** — the largest unindexed pool in the borough set |
| 4 | **Baby sensory & structured baby classes** (Baby Sensory, Toddler Sense, Sensory Stories, Baby College, Adventure Babies) | Recurring | Weekly, sold in **termly blocks** | **£££** (£10–15/session, block-booked) | Franchise sites; **Happity**; Class4Kids / Bookwhen / Pebble booking platforms; Instagram | **2** — well structured, but behind booking platforms |
| 5 | **Music & movement classes** (Monkey Music, Hartbeeps, Jo Jingles, Boogie Beat, Tappy Toes, Moo Music, Musical Bumps, Rhythm Time, Caterpillar Music, Lucy Sparkles, Foxtots, Singalong Sally, Boppin' Bunnies) | Recurring | Weekly, term time | **££–£££** | Franchise/local sites; Happity; Class4Kids/Bookwhen; local Facebook groups | **2–3** |
| 6 | **Physical / sport classes** (Tumble Tots, Little Kickers, Rugbytots, Diddi Dance, Baby Buzzers, Tots Tennis, baby ballet) | Recurring | Weekly, term time | **££–£££** | Franchise sites, Class4Kids, Happity | **2** |
| 7 | **Swimming lessons for babies & toddlers** (Water Babies, Puddle Ducks, Turtle Tots, Aquababies, plus Better/GLL learn-to-swim) | Recurring | Weekly, termly blocks; often 6-month waiting lists | **£££** | Franchise booking systems; GLL/Better swim pages | **2** but low marginal value — parents already know these |
| 8 | **Baby massage, baby yoga, postnatal fitness, buggy fit, Mummy & Me** | Recurring | Weekly, 4–6 week courses | **££–£££**; **free** versions at family hubs | Happity; hub timetables; independent instructor sites/Instagram | **3** |
| 9 | **Soft play, indoor play centres, play barns, play cafés** | Venue (open hours) not event | Daily opening hours; some run under-5-only sessions | **£–££** (£5–9 per child) | Venue websites; Better leisure centre soft play pages; Soft Play Finder | **2** for venues, **4** for the under-5-only sessions inside them |
| 10 | **Under-5 museum & gallery sessions** (RMG *Play Tuesdays* / *Cutty Sark Toddler Time*, Museum of London Docklands *Tots at the Docks*, Horniman, Young V&A Mini Museum, Tate under-5s, London Transport Museum) | **Mixed** — some weekly recurring, some monthly, some one-off | Weekly / monthly | **Free–£** (Cutty Sark Toddler Time £5/adult) | Museum what's-on systems — **the best-structured source in the whole set** (dated occurrences, age filters, booking links) | **1** |
| 11 | **Toddler-friendly / relaxed & sensory theatre** (Polka Theatre under-5s and drop-ins, Unicorn under-5s + relaxed performances, The Albany Deptford, Greenwich Theatre, Bromley Churchill) | Mixed — seasons + weekly drop-ins | Seasonal runs; Polka runs a weekly 0m–5y sensory session Fri 09:45 | **£–£££** | Theatre ticketing systems (dated, structured) | **1–2** |
| 12 | **Farms, city farms, animal parks** (Mudchute, Surrey Docks Farm, Woodlands Farm Welling, Maryon Wilson Animal Park) | Mixed — venue open daily + weekly toddler clubs | Woodlands Farm Toddler Club; Mudchute Play every Saturday | **Free–£** | Farm websites, Eventbrite, Visit Greenwich | **2–3** |
| 13 | **Parks, playgrounds, paddling pools, splash pads, nature play** (Greenwich Park, Charlton Park, Well Hall Pleasaunce, Sutcliffe Park, Horniman Gardens playground, The Cove at NMM, Greenwich Peninsula Ecology Park) | Venue / seasonal | Daily; paddling pools seasonal Jun–Sep | **Free** | Council parks pages, ecology park event pages | **3** — seasonal opening rarely published as dated data |
| 14 | **Breastfeeding cafés / infant feeding drop-ins / peer support** | Recurring | Weekly, fixed day per centre | **Free** | NHS trust pages (Lewisham & Greenwich NHS, `myhv.lgt.nhs.uk`), `greenwich0to4.co.uk`, family hub timetables | **3** — structured-ish but on NHS microsites nobody crawls |
| 15 | **Well baby clinics / weigh-in / health visitor drop-ins** | Recurring | Weekly, fixed day per centre | **Free** | `greenwich0to4.co.uk` (clean HTML list); NHS health visiting pages; hub timetables | **2** — but almost never treated as an "event" |
| 16 | **Speech & language drop-ins, early development sessions** | Recurring | Weekly/fortnightly | **Free** | NHS 0-to-4 microsites, family hubs | **3** |
| 17 | **Perinatal & parental mental health support** (Mindful Mums / SE London Mind, PANDAS, NCT, Home-Start, Lewisham Talking Therapies perinatal) | Recurring — fixed-length courses | 5–8 week course cycles | **Free** | Charity sites, NHS talking therapies, hub timetables, Facebook | **4** — cohort-based, dates announced ad hoc |
| 18 | **Dad / male-carer specific groups** | Recurring | Usually **monthly Saturdays** (e.g. Lewisham Dads Stay & Play) | **Free** | Family hub timetables; Play Map has a dad/male-carer filter | **4** — high demand, tiny supply, badly indexed |
| 19 | **SEND / additional-needs inclusive sessions** (SENsational Stay & Play Southwark, CASPA Tots Bromley, Tom Tom Group / Drumbeat Lewisham, Big Little Fun sensory room) | Recurring | Weekly/termly | **Free–£** | Borough **Local Offer** pages (Lewisham Local Offer under-5s is a genuinely good structured source), charity sites | **3** |
| 20 | **Multiple-birth / twins clubs** (Greenwich & Lewisham Twins Club) | Recurring | Weekly/fortnightly | **£** | Happity, Facebook, Twins Trust | **4** |
| 21 | **Single-parent, young-parent, migrant/refugee parent groups** (YoungMumsAid Greenwich, Lewisham Irish parent & toddler) | Recurring | Weekly | **Free** | Charity sites, council Local Offer | **4** |
| 22 | **Toy libraries, book swaps, uniform/equipment swaps** | Recurring | Weekly/monthly | **Free–£** (membership) | Lewisham Toy Library; library pages; Facebook | **4** |
| 23 | **Nature / forest toddler groups, ecology & outdoor play** | Recurring | Weekly, weather-dependent | **£–££** | Ecology park pages, Eventbrite, independent providers | **3** |
| 24 | **Antenatal, birth prep, weaning, sleep, baby first aid** | Course-based | 1-day or 4–6 week courses | **£££** | NCT, Happity (has dedicated antenatal + baby-led weaning categories), hub free versions | **2** |
| 25 | **Seasonal one-offs** — Christmas grottos, Easter egg trails, half-term under-5 programmes, summer paddling pools, festivals (Greenwich+Docklands International Festival, Greenwich Fair) | **One-off** | Annual/seasonal | **Free–£££** | Museum/theatre/council what's-on; Eventbrite; Visit Greenwich | **1–2** — the *only* part a generic event search does well |

### 1.3 What this tells you about the current system's blind spot

A generic "family-friendly London events" search hits categories **10, 11 and 25** — and essentially nothing else. Those are three of twenty-five categories, and they are the three **lowest-frequency, highest-cost, most-travel-required** categories in the set. Categories 1, 2, 3, 14, 15 and 18 — free, weekly, walkable, and the actual backbone of an under-5 parent's week — are almost entirely missed.

---

## 2. Recurring vs one-off: the central structural finding

### 2.1 The claim

**The overwhelming majority of the under-5 activity universe in SE London is weekly recurring and term-time-scoped, not one-off dated events.**

### 2.2 The evidence

**(a) Library provision is 100% recurring.** Southwark Council publishes a complete under-5 session table across 12 venues. Every single entry is a weekday-recurring session, and **17 of 22 listed sessions are explicitly "term time only."** None are dated events. Verbatim policy: *"They are free and there's no need to book."*

Southwark under-5 library sessions counted from the council page (2026-08-11):

| Venue | Sessions/week | Term-time-only sessions |
|---|---|---|
| Albrighton Community Centre | 1 | 1 |
| Ann Bernadt Children & Family Centre | 1 | 1 |
| Blue Anchor Library | 1 | 1 |
| Brandon Library | 2 | 1 |
| Camberwell Library | 3 | 3 |
| Canada Water Library | 3 | 2 |
| Grove Vale Library | 2 | 2 |
| John Harvard Library | 2 | 0 |
| Nunhead Library | 2 | 2 |
| Peckham Library | 4 | 3 |
| Una Marson Library | 2 | 1 |
| Walworth Library | 2 | 1 |
| **Total** | **25/week** | **18 (72%)** |

**That is ~25 recurring free under-5 sessions per week in Southwark libraries alone, and zero of them are dated events.**

**(b) Greenwich libraries: 28 recurring rhyme-time slots across 13 branches**, per the Greenwich Mums round-up — again all weekly-recurring, none dated. Better's own Greenwich and Bromley rhyme-time pages confirm the model in prose (*"free and don't require booking"*) but publish **no per-branch times at all**, pushing the parent to "get in touch with your local library."

**(c) Family hubs are recurring by statutory design.** Lewisham Family Hubs run *"Stay & Play sessions Monday through Friday from 10.00am – 11.30am"* across six hubs (Deptford, Honor Oak, Ladywell, Downham, Eliot Bank, Bellingham). That alone is ~30 recurring sessions/week in one borough. Their one-off content — e.g. Dads Stay & Play on four named Saturdays across a whole year — is a rounding error by comparison.

**(d) Health provision is recurring.** Greenwich 0-to-4 publishes 8 Well Baby Clinics per week at fixed weekday slots, plus infant feeding clinics at 7+ named centres and speech-and-language drop-ins. All weekly, none dated.

**(e) Paid classes are sold as recurring termly blocks.** Happity's own help centre discusses pricing for *block-booked term courses*; franchise providers (Baby Sensory, Monkey Music, Water Babies) sell terms, not tickets. Happity describes many listed classes as *"weekly sessions during term time only."*

**(f) Parents describe the artefact they want as a weekly timetable, not an event feed.** The Mumsnet London thread and the Greenwich/Lewisham local threads consistently answer the question "what's on" with recurring anchors — *"all the libraries in Lewisham run under 5s story time which is free"*, *"soft play at the Arches everyday"*, *"Little Rascals is free at the Waterfront Leisure Centre every Tuesday"*, *"Boppin' Bunnies at St Marks most days of the week."* Not one recommendation in these threads is a dated one-off event.

**(g) Measured directly from a competitor's own data — and the contrast is the finding.** Parsing `__NEXT_DATA__` on every activity URL in Hoop's sitemap (accessed 11 Aug 2026):

| Listing origin | Sample | Explicitly weekly (`rules[0].repeats: "W"`) |
|---|---|---|
| **Organiser-submitted** listings | 43 | **19 (44%)** |
| **Scraped/aggregated** listings (`source: "scraper_selenium_dt"`, traced to datathistle.com) | 22 | **1 (~5%)** |

**Recurrence is dominant in provider-submitted under-5 content and almost absent from the aggregated event feeds a generic search surfaces.** Data Thistle is a performance-listings business (500,000+ future performances, ~12,000 venues, music/theatre/comedy/cinema). When a weekly library rhyme time passes through it the recurrence is *stripped*: three separate "Toddler Rhyme Time" records were each published as isolated dated events with no `repeats` value. **This is a precise mechanical explanation of the current system's failure mode** — it is consuming feeds that have already destroyed the recurrence information.

**(h) Term-time exists in prose and never in the field.** Of the same 43 Hoop organiser listings, **7 mention "term time" in the description and 0 set the `excludesSchoolHolidays` flag** — despite the schema supporting it. One Rugbytots listing reads "Classes at Poynton Civic hall (term time) on Fridays" while its flag is `false` and `repeatsUntil` is set to **2030-07-24**. Likewise, **0 of 43 used a month-level age boundary**; `ageMode` was `"Y"` on 40 of 43, even though Hoop stores `ageMin`/`ageMax` in months. *The incumbents' schemas already support the two fields that matter most, and nobody populates them — which is precisely where a competitor can win.*

**(i) The asymmetry confirmed from the opposite direction.** DayOutWithTheKids indexes **8,960 attractions against 206 "events"** — and those 206 are seasonal landing pages (`/events/christmas`, `/easter`, `/may-half-term`), not dated occurrences. `/classes` and `/baby-and-toddler` both 404. A platform built for one-off days out carries **no weekly under-5 provision whatsoever**.

**(j) Happity's entire operating rhythm is the academic term.** Its year-in-review is titled *"Happity's End of Term Round Up (Sept 2024 – July 2025)"*; booking types are "sibling tickets, blocks, term bookings and drop-ins"; category pages list providers "and their timetables". Scale stated there: 250,000 spaces sold across the academic year, **80,000 class searches a week**, 6,000+ active providers, 2.6M parents reached.

### 2.3 Quantified estimate

Counting only the sources actually verified in this research (four boroughs' libraries, family hubs, health clinics, plus a conservative allowance for church groups and paid classes):

| Supply type | Est. sessions/week across the 5 areas | Share |
|---|---|---|
| Library under-5 sessions | ~90–110 | ~14% |
| Family hub / children's centre stay & play + groups | ~140–180 | ~22% |
| Church & community hall toddler groups | ~120–200 | ~22% |
| Paid classes (franchise + independent) | ~200–260 | ~33% |
| Health drop-ins (feeding, weigh-in, SLT) | ~35–50 | ~6% |
| Museum/theatre/farm **recurring** under-5 sessions | ~15–25 | ~3% |
| **Recurring subtotal** | **~600–825/week** | **~97%** |
| Genuine dated one-off events suitable for under-5s | **~10–25/week** (spiking in school holidays and December) | **~3%** |

Even with generous error bars, the conclusion is not close: **recurring sessions outnumber one-off under-5 events by roughly 25:1 to 40:1 in a normal week.**

### 2.4 Implications for a system built on "events in the next 14 days"

1. **A 14-day event window is the wrong primitive.** The correct primitive is a **recurring session with a schedule rule** (`FREQ=WEEKLY;BYDAY=TU`) plus **validity windows** (term dates, season, start/end date), from which dated occurrences are *generated*, not scraped.
2. **The system will systematically over-represent expensive, distant, older-child activities**, because those are the ones that publish dated event records. This is exactly the observed failure mode ("museums, theatre, festivals aimed at 5–12s").
3. **Term-time is a required field, not a note.** Without it, ~72% of library sessions and most church groups will be shown as running during the six-week summer holiday — when they are not. In August (i.e. right now, 2026-08-11) a naive scrape of Southwark's page would produce 18 false listings per week.
4. **Refresh cadence should be termly, not daily.** Recurring timetables change ~3–4 times a year (September, January, April, plus summer-programme overlays). Daily re-crawling of a PDF timetable is waste; termly re-verification with a change-detection hash is the right shape.
5. **Freshness must be modelled as "last verified", not "date of event."** A rhyme time verified on 2026-07-01 is more trustworthy than an undated Facebook event from 2026-08-09. The trust signal is verification recency, not event proximity.
6. **The 14-day window still has a job** — for category 25 (seasonal one-offs) and category 10/11 (museum/theatre programming). Keep it, but as a *secondary* feed layered on top of a recurring-session spine, not as the spine itself.

---

## 3. The source universe

### 3.0 Three structural discoveries about machine-readability

Before the table, three findings that change how the source universe should be attacked:

**(a) The Play Map (`theplaymap.co.uk`) is a fully scrapeable, borough-partitioned register of stay-and-play groups that nobody appears to be using.**
It is a Wix site, but the listings are **server-rendered in the HTML** — no JS execution needed. URL pattern: `https://www.theplaymap.co.uk/playgroups/stay-and-play-in-{borough}` for all 32 London boroughs. Verified by direct fetch on 2026-08-11 (HTTP 200, ~1.7 MB HTML per borough). Each card carries **group name, full address with postcode, day(s)-of-week, start/end time, an outbound link to the organiser's own site, and — where known — cost and age range in months** (e.g. *Kiddie DayCare … £2.50 Donation … 10 – 36 months*). It also tags **SEN Group**, **Baby Only Group**, **Dad/Male Carer Group**, **Young Parents Group (Under 26)** and **Outdoors**.
Counts harvested on 2026-08-11: **Bromley 27–33, Tower Hamlets 26–31, Greenwich 24, Southwark 18, Lewisham 11** — roughly **110 named groups** across the target geography from a single scrapeable source. Its own header states the critical caveat: *"Most playgroups will be term time only and some will require pre-booking or a fee/donation."*
Coverage is uneven (Lewisham at 11 is clearly under-populated versus Bromley at 33), so it is a **seed**, not a complete register.

**(b) ChurchSuite exposes a free, public, fully-structured JSON event feed — and SE London churches use it.**
Endpoint pattern: `https://{church-slug}.churchsuite.com/embed/calendar/json?merge=1` — returns HTTP 200 JSON with **no authentication**. Verified 2026-08-11 against `stlukesmillwall.churchsuite.com` (41 events), `citygatechurch.churchsuite.com` (30 events), `stjohnsblackheath.churchsuite.com` (2 events).
Fields returned: `name`, `datetime_start`, `datetime_end`, `description` (HTML), `category` (id/name/colour), `location` (name, address, lat, lon), `capacity`, `signup_options`, `status`, `images`, `public_visible`, `identifier`.
**Critically, the feed returns recurring series already expanded into dated occurrences** — St Luke's Millwall's weekly *Bubble Church* appears as individual dated entries from 2026-08-16 through 2026-10-18, and *Power of Play* as dated entries. This is precisely the recurring-to-dated expansion the discovery system needs, delivered for free.
Not universal: of 10 SE London church slugs probed, 3 returned live feeds and 7 returned 302 (no ChurchSuite account). Treat as a **high-yield partial channel**, not a complete one.

**(c) Better/GLL publishes nothing useful at borough level, but its *branch* and *children's-centre* pages are far better than the hub suggests — and the two are out of sync.**
The rhyme-time hub pages for Greenwich and Bromley describe the offer in prose (*"free and don't require booking"*, *"Baby Rhyme Time sessions happen at most Greenwich libraries"*) and publish **no branch names, no days and no times at all**, instructing parents to *"get in touch with your local library."* `better.org.uk/library/london/greenwich/whats-on` is a 404.

Dig one level down and the picture improves sharply:
- **Greenwich library branch pages** (`/library/london/greenwich/{branch}/whats-on`) carry **schema.org `Library` JSON-LD** with geo and opening hours, plus activity cards whose days and times sit in free text. 12 branches confirmed. Blackheath alone runs 5 under-5 sessions a week.
- **Better children's-centre pages** (`/children-centre/london/greenwich/{centre}/timetable`) publish a **genuinely structured weekly HTML timetable** with day, time, session name, venue and drop-in / booking / term-time / 0-2 flags. Waterways carries 17 under-5 services.

But the layers disagree. **Beckenham Library's what's-on page lists zero under-5 events while the borough timetable shows two Baby Rhyme Time sessions there every Monday**; Plumstead and Woolwich Centre both omit rhyme time from their pages while the Greenwich Community Directory lists 5–6 under-5 services at each. And Bromley's only complete dataset lives in a **news article** (`/library/news/what-s-on-in-bromley-libraries`), the worst possible home for a canonical timetable.

**The operational conclusion: never trust a single Better surface.** Cross-reference branch pages against the borough timetable and the council directory, and treat disagreement as a prompt to verify rather than a reason to drop the session.

**Contrast: Southwark Council publishes the same class of data perfectly** — a single HTML page listing all 12 venues × session name × day × time × term-time flag. This is the benchmark other boroughs fail.

### 3.1 Verified harvest: stay-and-play and toddler groups (from The Play Map, fetched 2026-08-11)

Every row below was extracted from live HTML on 2026-08-11. `Recurring` is weekly unless noted. Cost is blank where the source does not state it (most are free or a £1–2 donation).

#### Greenwich (24 groups)

| Name | Venue / postcode | Day & time | Organiser type |
|---|---|---|---|
| AvoCuddle Playroom | 60 Old Woolwich Road, SE10 9NY | Mon–Sun 10:00–15:00 | Commercial play café |
| Christchurch Baby and Toddler Group | Christchurch Priory, Eltham High St, SE9 1TX | Mon 09:30–11:30 | Church |
| All Saints Mums & Tots | All Saints Function Hall, Bishops Close, SE9 3TZ | Mon 09:30–12:00; Thu 12:30–14:30; Fri 09:30–12:00 | Church |
| Play Cafe | St Richard's Church Centre, Swallowfield Rd, SE7 7NR | Wed 09:30–11:00 | Church |
| Pebbles Baby & Toddler Group | St Nicholas Church, Whetstone Rd, SE3 8PZ | Tue 10:00–11:45 | Church |
| Pond Rd Mother/Toddler Group | St Michael & All Angels, Pond Rd, SE3 9JL | Thu 09:30–11:45 | Church |
| Stay & Play | Abbey Wood Children's Centre, Dahlia Rd, SE2 0SX | Tue & Fri 09:30–11:00 | Children's centre |
| Spinglets | Avery Hill Christian Fellowship, Southspring, DA15 8EA | Mon 10:00–11:30 | Church |
| Guavatree Stay & Play | RCCG Victory Assembly, 367A Footscray Rd | Wed 09:45–11:45 | Church (Pentecostal) |
| Tots Play Room | Court Road, SE9 4TU | Mon 09:30–12:00; Tue/Thu/Fri 09:30–15:00 | Commercial |
| Stay & Play | Eltham Green Community Church, Westhorne Ave, SE9 6DH | Wed 10:00–11:30; Fri 09:30–11:30 | Church |
| Stay & Play | Glyndon Community Centre, Raglan Rd | Wed 09:30–11:30; Fri 13:15–15:15 | Community centre |
| Footprints Stay & Play | St John's Blackheath, Stratheden Rd, SE3 7TH | Mon 10:00–11:30 | Church (ChurchSuite) |
| Toddlers Group | Christ Church Shooters Hill | Wed 09:15–11:00 | Church |
| Stay & Play | 18 Invicta Rd, SE3 7HF | Thu 13:30–15:00 | Children's centre |
| Stay & Play | Pound Park Nursery School, SE7 8AF | Mon 13:30–15:00 | Maintained nursery |
| Stay & Play | Robert Owen Nursery School & CC, Commerell St | Wed 09:45–11:15 | Children's centre |
| Stay & Play | Rachel McMillan Nursery School & CC, McMillan St | Thu 09:30–11:00 | Children's centre |
| Stay & Play | The Bridge, Chevening Rd, SE10 0LB | Tue & Fri 10:15–12:00 | Community |
| Stay & Play | Quaggy Children's Centre, Orchard Hill | Wed 13:30–15:00 | Children's centre |
| Stay & Play | Cardwell Primary School, Frances St, SE18 5LP | Tue 13:30–15:00; Wed 09:30–11:30 | School |
| Stay & Play | Brookhill Road, SE18 6UF | Fri 13:30–15:00 | Children's centre |
| **Ship Mates** | Cutty Sark, King William Walk | Wed 10:00–11:30 & 13:00–14:30 | **Museum (RMG)** |
| Stay & Play | Waterways Children's Centre, Southwood Rd, SE28 8EZ | Mon 09:30–11:00; Thu 13:00–14:30 | Children's centre |

#### Lewisham (11 groups — source under-populated)

| Name | Venue / postcode | Day & time | Organiser type |
|---|---|---|---|
| St Margaret's Playgroup | Kingswood Halls, Dacre Park, SE13 5BU | Mon & Wed 09:30–11:15 | Church |
| Chatterbox Toddler Group | Honor Oak Community Centre, Turnham Rd, SE4 2JD | Fri 10:00–11:30 | Community centre |
| Little Angels Playgroup | St Michael & All Angels, Champion Cres, SE26 4HH | Mon–Wed 09:30–11:30 | Church |
| The Ark Playgroup | Church of the Ascension Blackheath, Dartmouth Row | Wed 10:00–11:30 | Church |
| Phoenix Carers & Toddlers' Group | Lee Green URC, Burnt Ash Rd, SE12 8RA | Wed 09:30–11:30 | Church (URC) |
| DUPLO Stay & Play | Corbett Community Library, Torridon Rd, SE6 1RQ | Wed 09:00–10:00 | **Community library** |
| Bouncy Bunnies Hither Green | Lochaber Hall, Manor Lane Terrace, SE13 5QL | Thu & Fri 10:00–11:15 | Church hall |
| Stay & Play | Abbotshall Healthy Lifestyle Centre, SE6 1SQ | Mon 09:30–13:30 | Leisure/health centre |
| Explorers | Ladywell Children's Centre, Rushey Mead | Wed 13:00–14:00 | Children's centre |
| Explorers | Bellingham Children's Centre, Randlesdown Rd | Mon 13:00–14:00 | Children's centre |
| Dads & Male Carers Group | Evelyn Children's Centre, Grove St | Tue 13:30–14:30 | **Dad-specific** |

#### Southwark (18 groups)

| Name | Venue / postcode | Day & time | Organiser type |
|---|---|---|---|
| Walworth Living Room Stay 'n Play | All Saints Hall, Surrey Sq, SE17 2JU | Fri 09:15–10:15 | Church |
| Stay & Play @ LPS | Lyndhurst Primary School, Grove Ln, SE5 8SN | Fri 09:00–10:30 | School |
| **SENsational Stay & Play** | Coin Street Neighbourhood Centre, SE1 9NH | Fri 13:00–14:30 | **SEND** |
| **SENsational Stay & Play** | Cherry Garden School, Bellenden Rd, SE15 5BB | Thu 10:00–11:30 | **SEND** |
| **SENsational Stay & Play** | Ellen Brown Children's Centre, Grange Rd, SE1 3BW | Tue 13:30–15:00 | **SEND** |
| **SENsational Stay & Play** | 1st Place Children & Parents' Centre, SE5 0RN | Mon 14:00–15:30 | **SEND** |
| **SENsational Stay & Play** | Camberwell & Dulwich CFC, Tower Mill Rd, SE15 6BP | Mon & Fri 10:00–11:30 | **SEND** |
| Little Fishes | Grove Chapel Evangelical Church, SE5 8RF | Wed 10:15–11:45 | Church |
| Teacups and Teenies | The Well Community Church, Wells Way, SE5 7SY | Thu 10:00–11:45 | Church |
| Little Smiles Stay & Play | East Dulwich Community Centre, Darrell Rd, SE22 9NL | Mon & Wed 10:00–12:00 | Community centre |
| Moonbeams | Herne Hill Baptist Church, SE24 9HU | Wed 10:00–11:30 | Church (Baptist) |
| Stay & Play | Camberwell & Dulwich CFC, Lyall Ave, SE21 8QS | Mon 13:30–15:00 | Children's centre |
| Stay & Play | Albrighton Community Centre, SE22 8AH | Wed 10:00–11:30 | Community centre |
| Playtime | St Barnabas with Christ's Chapel, Calton Ave, SE21 7DG | Fri 09:30–11:00 | Church |
| Stay & Play | Rye Oak Primary School, Whorlton Rd, SE15 3PD | Thu 13:15–15:00 | School |
| Stay & Play | Christ Church Peckham, Old Kent Rd, SE15 1JF | Wed 10:30–12:00 | Church |
| Stay & Play | Coin Street Neighbourhood Centre, Stamford St | Fri 10:00–11:30 | Community centre |
| Kiddie DayCare | 3 Chatteris Way, SE17 1GQ | Mon–Thu 09:00–11:00 & 15:00–17:00 | Commercial — **£2.50 donation, 10–36 months** |

#### Bromley (27 groups — overwhelmingly church-run)

| Name | Venue / postcode | Day & time | Organiser type |
|---|---|---|---|
| Tiddlers | Orpington Baptist Church, Station Rd, BR6 0RZ | Wed 13:15–14:45 | Church (Baptist) |
| Little Acorns | Bromley | School holidays only, dates TBA | Seasonal |
| Stay & Play | New Life Church, Biggin Hill, TN16 3BB | Fri 10:30–12:00 | Church |
| Play and Stay Toddlers Group | St Edward the Confessor CofE, SE9 4AA | Tue 10:00–12:00 | Church |
| Stay & Play | Trinity CE Primary School, Prince's Plain, BR2 8LD | Wed 08:45–10:15 | School |
| Little Action Stars | Wickham Hall, Sussex Rd, West Wickham, BR4 0JX | Mon, Tue, Fri 10:15–11:45 | Community hall |
| **Mini Explorers Outdoor Playgroup** | Ex Blues Sports Club, Pickhurst Rise, BR4 0AW | Mon, Tue, Thu, Fri 09:45–11:45 | **Outdoor / nature** |
| Little Gems (Hope Centre) | The Walnuts Centre, Orpington, BR6 0TW | Wed 10:00–11:45 | Church |
| Little Gems (St Luke's) | Hope Church Bromley, BR2 9PD | Wed 10:00–11:45 | Church |
| Bubbles Group | Bromley Common Methodist Church, BR2 9RZ | Mon 10:00–11:30 | Church (Methodist) |
| First Steps | Hayes Lane Baptist Church, BR2 9EA | Thu 10:00–12:00 | Church (Baptist) |
| Sunbeams | Christ Church, Anerley Rd, SE20 8ER | Thu 10:30–12:00 | Church |
| Funshine Toddler Group | St Andrew's Parish Church, Orpington, BR5 4AL | Wed 09:30–11:00 | Church |
| Parent & Toddler Group | St James the Great RC, Petts Wood, BR5 1AY | Fri 13:30–15:00 | Church (Catholic) |
| The ARK Toddler Group | St Augustine's, Bickley, BR2 8AT | Wed 10:00–11:30 | Church |
| Little Stars | Jubilee Centre, Southlands Rd, BR2 9QZ | Thu 10:00–11:30 | Church |
| Toddler Praise | St Peter & St Paul Parish Church, BR2 0EG | Tue 11:00–12:00 | Church |
| CCBaby & Toddlers | Christ Church Beckenham, BR3 3LE | Wed 09:45–11:15 | Church |
| Little Fish | St John the Evangelist | Mon & Wed 09:30–11:00 | Church |
| Stay & Play | **St Paul's Cray Library**, Mickleham Rd | Tue 10:00–10:45 | **Library** |
| Nursery 'Stay & Play' | St Paul's Cray CE Primary, BR5 3WD | Tue 14:00–15:00 | School |
| Toddler Time | **Penge Library**, Green Ln, SE20 7JX | Tue 10:30–11:15 | **Library** |
| Tuesday Toddlers | Christ Church URC, Petts Wood, BR5 1LH | Tue 10:30–12:00 | Church (URC) |
| Diddy Dinos | Crystal Palace Park Rd, SE26 6UF | Mon–Fri 09:30–12:30 & 13:30–16:30 | Commercial soft play |
| Razzle Dazzle | Citygate Church Beckenham, BR3 1JA | Tue–Thu 10:00–11:30 | Church (**ChurchSuite feed**) |
| Tots | All Saints Church Orpington, BR6 0QD | Thu 10:00–11:30 | Church |
| Toddler Group | St Martin of Tours, Chelsfield, Orpington | Tue 10:30–12:00 | Church |

#### Isle of Dogs / Tower Hamlets (26 groups)

| Name | Venue / postcode | Day & time | Organiser type |
|---|---|---|---|
| Little Ducklings | **St Peter's Barge**, West India Quay, E14 4AL | Fri 10:00–11:15 | Church (floating church) |
| Young Parents Group | St Luke's Millwall, Alpha Grove, E14 8LH | Wed 13:30–14:30 | **Young parents (U26)** |
| Sunbeams | St Luke's Millwall, Alpha Grove, E14 8LH | Wed 10:30–11:30 | Church (**ChurchSuite feed**) |
| Tiny Tots | St Nicholas Church, Poplar, Aberfeldy St | Wed 10:00–12:00 | Church — **0–3 years** |
| Baby Bounce | Tower Hamlets Community Church, Ricardo St, E14 6EQ | Tue 09:30–11:30 | Church |
| **Who Let The Dads Out?** | St Anne's Limehouse, Three Colt St, E14 7HA | Occasional Saturdays | **Dad/male carer** |
| Chatterbox | St Anne's Limehouse, E14 7HA | Wed 10:00–11:30 | Church |
| Tiny Tower Tots | All Saints Church, Newby Place, E14 0EY | Thu 10:00–12:00 | Church — **baby only** |
| Coborn Street Toddler Group | Christ Church Mile End, E3 2AB | Thu 10:30–12:00 | Church |
| Active Stay and Play | Chrisp Street, E14 6NH | Thu 13:30–15:00 | Children's centre |
| Stay & Play | Around Poplar CFC, Three Colt St, E14 8AP | Mon 10:00–11:30; Fri 10:00–11:30 & 13:30–15:00 | Children's centre |
| Stay & Play | **Isle of Dogs CFC (Millwall Park)**, Stebondale St, E14 3BX | Mon & Tue 10:00–11:30 | Children's centre |
| Bethnal Green Bumblebees | St Matthew's Bethnal Green, E2 6DT | Fri 10:00–12:00 | Church |
| Tiny Tower Tots | St John on Bethnal Green, E2 9PA | Wed 14:00–16:00 | Church — **baby only** |
| Baby Song | Harford Health Centre, E1 4FG | Thu 10:00–12:00 | **Health centre** |
| Active Stay and Play | Meath Gardens CC, Smart St, E2 0SN | Mon & Thu 10:00–11:30; Wed 13:00–14:30 | Children's centre |
| **Dad's Stay and Play** | Ocean CFC – Whitehorse, White Horse Rd, E1 | Sat 10:00–11:30 | **Dad/male carer** |
| Active Stay and Play | Ocean CFC – Whitehorse, E1 | Mon 10:00–11:30 | Children's centre |
| Play Together | John Smith CFC, Stepney Way, E1 2ES | Mon 13:30–15:00 | Children's centre |
| Play Together | Marner CFC, Devas St, E3 3LL | Tue 10:00–11:30 | Children's centre |
| Stay & Play | Overland Children's Centre (Roman), Parnell Rd | Mon 13:30–15:00; Wed 10:00–11:30; Thu 15:30–16:45 | Children's centre |
| Baby Hub | St James-the-Less, E2 9JD | Mon 10:00–12:00 | Church — **0–3 years** |
| Tots & Toddlers | Christ Church Spitalfields, E1 6LY | Wed 09:30–11:30 | Church |
| Tiny Tower Tots | St Paul's Shadwell, E1W 3DH | Fri 10:00–12:00 | Church — **baby only** |
| Tower Tots | St Paul's Shadwell, E1W 3DH | Wed 09:30–11:30 | Church |
| The Cookie Jar | Bow Baptist Church, Payne Rd, E3 2SP | (see site) | Church (Baptist) |

**Organiser-type breakdown of these ~106 groups: churches/faith venues ~55%, children's centres & family hubs ~25%, community centres & schools ~12%, commercial ~5%, libraries & museums ~3%.**
This is the single clearest quantitative answer to "where does under-5 supply actually come from": **it comes from churches and children's centres, not from event venues.**

### 3.2 Verified harvest: library under-5 sessions

**Southwark (12 venues, 25 sessions/week — source: council HTML, fully structured)** — enumerated in §2.2(a). Venues: Albrighton Community Centre, Ann Bernadt CFC, Blue Anchor, Brandon, Camberwell, Canada Water, Grove Vale, John Harvard, Nunhead, Peckham, Una Marson, Walworth. *Dulwich Library is closed for refurbishment until autumn 2026* — a live currency trap for any scraper using cached data.

**Greenwich (13 branches, 28 rhyme-time slots/week — source: Greenwich Mums round-up, since Better publishes nothing)**

| Library | Postcode | Sessions/week |
|---|---|---|
| Abbey Wood Library | SE2 9PT | 1 (Fri 10:30) |
| Blackheath Library | SE3 7BT | 4 (Tue/Thu 14:00, Fri 10:30, Sat 11:00) |
| Charlton Library | SE7 8RE | 4 (Mon 10:00 under-2s + 11:00 over-2s, Tue 14:45, Thu 14:00) |
| Claude Ramsey / Thamesmere Library | SE28 8DT | 1 (Wed 10:30) |
| Coldharbour Library | SE9 3AY | 1 (Tue 14:15) |
| The Greenwich Centre | SE10 9HB | 2 (Mon 11:30, Sat 11:00) |
| New Eltham Library | SE9 3QT | 7 (Mon–Fri, several double slots) |
| Ferrier Library | SE3 9YR | 2 (Wed & Sat 10:30) |
| West Greenwich Library | SE10 8NN | 2 (Tue 10:30, Thu 14:30) |
| Plumstead Library | SE18 1JL | 1 (Tue 10:00) |
| Slade Centre Library | SE18 2QQ | 2 (Mon 10:00, Tue 14:45) |
| Woolwich Centre Library | SE18 6QT | 5 (Mon 11:00, Thu ×2, Sat ×2) |

> **Serious currency caveat.** GreenwichMums is **effectively abandoned**: its newest article is dated **July 2024**, its "What's On" calendar renders the current month but reports "No upcoming events", and the rhyme-time page still carries dead `greenwich.gov.uk/Greenwich/Learning/Libraries/...` links from a site structure retired years ago. **Every time in this table must be re-verified per branch before publication.**
>
> The finding stands, and is worse than it first appears: **the most complete published record of Greenwich's free weekly under-5 library provision is a two-year-stale page on an abandoned volunteer blog**, because neither the operator (Better/GLL) nor the council publishes the data at all. Greenwich is the single largest data gap in the borough set — compounded by Hoop's Greenwich region being empty and the Greenwich Community Directory's pretty URLs being broken.

**Lewisham** — runs on **LUCi by SOLUS** at `lewisham.events.mylibrary.digital` (fronted by `libraries.lewisham.gov.uk/events`). Event URL pattern `…/event?id={numeric}`. Has **category filters** including Children's, Families, Educational. This is the **best-structured library events platform of the four boroughs** — genuinely dated occurrences with stable IDs. Includes community-managed libraries (Manor House, Crofton Park, Forest Hill, Deptford Lounge, Corbett) alongside council branches. Direct scraping returned 403 to automated agents; the HTML page is fetchable via a normal browser UA.

**Bromley (14 branches, Better/GLL)** — same failure mode as Greenwich: prose only, no branch times published. Play Map independently confirms at least Penge Library (Toddler Time Tue 10:30) and St Paul's Cray Library (Stay & Play Tue 10:00) run under-5 sessions, i.e. **Better's own site omits sessions a volunteer directory has found.**

### 3.3 Verified harvest: health and family-hub sources

| Source | Area | URL | What it publishes | Machine-readable? |
|---|---|---|---|---|
| Greenwich 0 to 4 (Bromley Healthcare/NHS) | Greenwich | `greenwich0to4.co.uk/clinics/well-baby-clinics` | 8 Well Baby Clinics/wk at named centres with day+time | **Yes** — clean HTML list |
| Greenwich 0 to 4 — infant feeding | Greenwich | `greenwich0to4.co.uk/clinics/infant-feeding-clinics` | Feeding drop-ins at Brookhill, Slade, Waterways, Quaggy/Parkside, Storkway, Vista Field, Charlton | **Yes** |
| Lewisham & Greenwich NHS health visiting | Lewisham+Greenwich | `myhv.lgt.nhs.uk` | Baby Hubs, breastfeeding drop-ins, antenatal contact | Partial HTML |
| Lewisham Family Hubs | Lewisham | `lewishamfamilyhubs.org.uk/p/activities-and-timetables` + `/events` | 6 hubs, Stay & Play Mon–Fri 10:00–11:30, Dads Sat sessions | **PDF + JPEG timetables** — worst case; `/events` booking system is better |
| Lewisham CFC (Early Years Alliance) | Lewisham | `lewishamcfc.org.uk` | Breastfeeding hubs, Explorers Plus; **now redirects to Family Hubs** | Partial, stale |
| Royal Greenwich children's centres directory | Greenwich | `royalgreenwich.gov.uk/directory/15/childrens_centres` | 10 named centres: Brookhill, Charlton Family Centre, Eglinton, Eltham, Mulberry Park, Quaggy, Slade, Storkway, Vista Field, Waterways | **Yes** — `/directory_record/{id}/` pattern |
| **Greenwich Community Directory** | Greenwich | `greenwichcommunitydirectory.org.uk/services` and `/kb5/greenwich/directory/home.page` | **~450 services tagged ages 0–5** (~292 strictly 0–4), 23 children's centres | **CORRECTED — this is the single richest source in the borough set.** Only the *pretty* URLs are broken (`/children-and-families` 301s to `royalgreenwich.gov.uk`, which links back — a circular reference). The `/services` tree and **`sitemap.xml` (1,346 service pages)** are live, each record carrying age range, cost, booking method, opening hours, full address + postcode and access needs. Runs on **Outpost** (open-source LA directory) — the most promising route to a structured export. **Crawl the sitemap, not the facet search** (server-side search returns the same 12 defaults) |
| Southwark children & family centres | Southwark | `southwark.gov.uk/children-young-people-and-families/parenting/children-and-family-centres` | Best Start Family Hubs; operators 1st Place (`1stplace.uk.com`), PPRN CFC (`pprncfc.com`), Bermondsey & Rotherhithe (`br-cc.org.uk`), Camberwell & Dulwich (`dulwichwood.com`) | Operator sites publish HTML/PDF timetables |
| Lewisham Local Offer — Under 5s | Lewisham | `lewisham.gov.uk/…/local-offer/activities-and-events/under-5s` | Curated named list incl. SEND-specific | **Yes** — good HTML |

---

### 3.4 Source universe — Southwark & Bromley

*Verified by direct fetch 2026-08-11 unless marked (unverified). "Est." = estimated under-5 sessions per week.*

| Name | Borough | URL | Category | Machine-readable? | Est. | Notes |
|---|---|---|---|---|---|---|
| **Southwark Libraries — Story, music & play sessions** | Southwark | `southwark.gov.uk/culture-and-sport/libraries/library-activities-babies-and-toddlers/story-music-and-play-sessions` | Library master timetable | **HTML — benchmark quality** | 25 | Whole borough on one page, term-time flags inline |
| Southwark library finder | Southwark | `southwark.gov.uk/culture-and-sport/libraries/find-library` | Library index | HTML, paginated | — | Slug pattern `/find-library/{name}-library` |
| Blue Anchor Library | Southwark | `…/find-library/blue-anchor-library` | Library | HTML | 1 | Bookstart Mon 10:00 (term time) |
| Brandon Library | Southwark | `…/find-library/brandon-library` | Library | HTML | 2 | **Listed temporarily closed** — suppress |
| Camberwell Library | Southwark | `…/find-library/camberwell-library` | Library | HTML | 3 | |
| Canada Water Library | Southwark | `…/find-library/canada-water-library` | Library | HTML | 3 | |
| Grove Vale Library | Southwark | `…/find-library/grove-vale-library` | Library | HTML | 2 | |
| John Harvard Library | Southwark | `…/find-library/john-harvard-library` | Library | HTML | 2 | Not term-time-limited |
| Nunhead Library | Southwark | `…/find-library/nunhead-library` | Library | HTML | 2 | |
| Peckham Library | Southwark | `…/find-library/peckham-library` | Library | HTML | 4 | Busiest branch |
| Una Marson Library | Southwark | `…/find-library/una-marson-library` | Library | HTML | 2 | |
| Southwark Heritage Centre & Walworth Library | Southwark | `…/find-library/southwark-heritage-centre-and-walworth-library` | Library / museum | HTML | 2 | Also one-off "Little Buds" events |
| Kingswood Library | Southwark | `…/find-library/kingswood-library` | Library | HTML | 0 | On branch index but absent from under-5 timetable |
| Dulwich Library | Southwark | `…/find-library/dulwich-library` | Library | HTML | 0 | **Closed for refurbishment to autumn 2026** — suppress |
| Southwark Presents | Southwark | `southwark.gov.uk/southwark-presents/` | Council one-off events | HTML what's-on | varies | Where one-off under-5 library/heritage events land |
| **Bromley Libraries — What's On (borough timetable)** | Bromley | `better.org.uk/library/news/what-s-on-in-bromley-libraries` | Library master timetable | **HTML — but published as a news post** | ~16 | **Verified**: full Baby Rhyme Time + Story Time grid, per-branch phone/email, term-time flags, Orpington via Eventbrite. Canonical data in a fragile URL |
| Bromley Central Library (The Pavilion) | Bromley | `better.org.uk/library/london/bromley/bromley-central-library/whats-on` | Library | HTML cards | 4 | Relocated to Kentish Way BR1 3EF |
| Beckenham Library | Bromley | `better.org.uk/library/london/bromley/beckenham-library/whats-on` | Library | HTML cards — **out of sync** | 2 | Page lists no under-5 events though borough timetable shows Baby Rhyme Time Mon 10:00 & 11:00 |
| Penge Library | Bromley | `better.org.uk/library/london/bromley/penge-library/whats-on` | Library | HTML cards | 2 | Baby Bounce Thu 10:00 (0–18m); Toddler Time (3–5) |
| St Paul's Cray Library | Bromley | `better.org.uk/library/london/bromley/st-paul-s-cray-library-community-support-centre/whats-on` | Library | HTML cards | 2 | |
| Shortlands Library | Bromley | `better.org.uk/library/london/bromley/shortlands-library` | Library | HTML cards | 1 | Baby Rhyme Mon 09:45 |
| Southborough Library | Bromley | `better.org.uk/library/london/bromley/southborough-library` | Library | HTML cards | 1 | Wed 10:30 |
| Hayes Library | Bromley | `better.org.uk/library/london/bromley/hayes-library` (unverified slug) | Library | HTML cards | 1 | Tue 09:45 term time |
| Petts Wood Library | Bromley | `…/petts-wood-library` (unverified slug) | Library | HTML cards | 2 | Tue 09:45 & 10:45 |
| Orpington Library | Bromley | `…/orpington-library` (unverified slug) | Library | HTML cards | 1 | Story Time Mon 14:00 — **bookings via Eventbrite** |
| Mottingham Library | Bromley | `…/mottingham-library` (unverified slug) | Library | HTML cards | 2 | |
| Burnt Ash Library | Bromley | `…/burnt-ash-library` (unverified slug) | Library | HTML cards | 1 | |
| Biggin Hill Memorial Library | Bromley | `…/biggin-hill-memorial-library` (unverified slug) | Library | HTML cards | 2 | |
| Chislehurst Library | Bromley | `…/chislehurst-library` (unverified slug) | Library | HTML cards | 0–1 | Not in rhyme-time grid |
| West Wickham Library | Bromley | `better.org.uk/library/london/bromley/west-wickham-library` | Library | HTML cards | 0–1 | |
| Bromley Libraries help centre | Bromley | `better.org.uk/library/london/bromley/help-centre` | Library index | HTML | — | All 14 branches + phones. **Anerley is not a Bromley library** |
| **1st Place / Borough, Bankside & Walworth hub** | Southwark | `1stplace.uk.com/timetable` | Family hub | PDF + partial HTML | 8–12 | 1st Place SE5 0RN, Victory CFC SE17 1PT, Coin Street SE1 9NH |
| Bermondsey & Rotherhithe CFCs | Southwark | `br-cc.org.uk` | Family hub | HTML nav + timetable subpage | 8–12 | Ellen Brown SE1 3EU, Pilgrims' Way SE15 1EF, South Bermondsey SE16 3PN, Rotherhithe SE16 2PF |
| Camberwell & Dulwich Children & Family Hub | Southwark | `dulwichwood.com/aardvarkcc/` | Family hub | Seasonal timetable, **format opaque** | 8–12 | Dulwich Wood SE21 8QS, Albrighton SE22 8AH, Crawford SE5 9NF, The Grove SE15 6BP |
| Peckham, Peckham Rye & Nunhead CFC | Southwark | `pprncfc.com/current-timetable` | Family hub | Embedded timetable, not plain HTML | 8–12 | Rye Oak SE15 3PD, Ivydale SE15 3DE, Leyton Square SE15 6TP, Ann Bernadt SE15 6DT |
| Southwark Family Information Directory | Southwark | `southwark.gov.uk/children-young-people-and-families/family-information-directory` | Borough FIS | Searchable DB, 27 pages | — | Record slugs under `/family-information-directory-unpublished/` — unstable path |
| Bromley Children & Family Centres | Bromley | `bromley.gov.uk/ChildrenAndFamilyCentres` | Children's centre index | HTML index → **Issuu PDFs** | — | 6 centres; timetables monthly via Issuu + social |
| Community Vision CFC, Penge | Bromley | `bromley.gov.uk/directory-record/7072/…` | Children's centre | Directory record + PDF | 4–8 | SE20 8UX |
| Biggin Hill CFC | Bromley | `bromley.gov.uk/directory-record/7077/…` | Children's centre | Directory record + PDF | 4–8 | TN16 3TN |
| Blenheim CFC, Orpington | Bromley | `bromley.gov.uk/directory-record/7076/…` | Children's centre | Directory record + PDF | 4–8 | BR6 9BH |
| Burnt Ash CFC | Bromley | `bromley.gov.uk/directory-record/7075/…` | Children's centre | Directory record + PDF | 4–8 | BR1 4QX |
| Castlecombe CFC, Mottingham | Bromley | `bromley.gov.uk/directory-record/7074/…` | Children's centre | Directory record + PDF | 4–8 | SE9 4AT |
| Cotmandene CFC, Orpington | Bromley | `bromley.gov.uk/directory-record/7080/…` | Children's centre | Directory record + PDF | 4–8 | BR5 2RB |
| Bromley Children Project (Issuu) | Bromley | `issuu.com/bromleychildrenproject` | CC timetable publisher | **PDF/Issuu only — worst case** | — | Session grids baked into page images |
| Move Southwark — Kids Activities | Southwark | `movesouthwark.co.uk/activities/kids-activities` | Leisure / soft play | HTML + online booking + app | 10+ | 8 centres |
| Peckham Pulse Leisure Centre | Southwark | `movesouthwark.co.uk/centres/peckham-pulse-leisure-centre` | Soft play | Online booking, pre-book | 10+ | Main Southwark council soft play |
| Southwark free swimming lessons | Southwark | `southwark.gov.uk/culture-and-sport/leisure-and-sport/swimming/free-swimming-lessons` | Swim | HTML | — | Free 12-week courses, 5 pools |
| Mytime Active — The Pavilion | Bromley | `mytimeactive.co.uk/locations/pavilion` | Leisure / soft play | HTML + booking | 7+ | BR1 3EF |
| Buzz Zone Soft Play, The Pavilion | Bromley | `mytimeactive.co.uk/locations/pavilion/buzz-zone-soft-play-pavilion` | Soft play | Booking; **no session times published** | daily | Under-4 zone; 1–3yr £8.80 |
| The Spa at Beckenham | Bromley | `mytimeactive.co.uk/locations/the-spa-at-beckenham` (unverified) | Swim | HTML + booking | 3–5 | |
| Walnuts Leisure Centre, Orpington | Bromley | `mytimeactive.co.uk/locations/walnuts` (unverified) | Swim | HTML + booking | 3–5 | Family splash pool |
| **Bromley 0–19 — Well Baby Clinics** | Bromley | `bromley0to19.co.uk/0-4-years/well-baby-clinics` | Weigh-in clinic | **HTML, fully structured** | 6 | Venue, day, time, postcode. Excellent scrape target |
| Bromley 0–19 — Infant Feeding Clinics | Bromley | `bromley0to19.co.uk/0-4-years/infant-feeding-clinics` | Feeding clinic | HTML | 3–5 | |
| Evelina London breastfeeding drop-ins | Southwark | `evelinalondon.nhs.uk/our-services/community/breastfeeding/overview.aspx` | Breastfeeding | HTML | 4 | Mon 1st Place, Tue Crawford, Thu Southwark Park, Fri Rye Oak — all 10:00–12:00 |
| Breastfeeding Network Southwark | Southwark | `localoffer.southwark.gov.uk/health-and-wellbeing/universal-health-services/breastfeeding-support-group/` | Breastfeeding | HTML; live updates on **social only** | 4 | @bfnsouthwark |
| Southwark infant feeding (council) | Southwark | `southwark.gov.uk/public-health-and-safety/health-and-wellbeing/staying-healthy/infant-feeding-and-breastfeeding-0` | Breastfeeding | HTML | — | Tessa Jowell Mon, Aylesbury Wed, Coin Street Thu |
| **NCT Bromley & Chislehurst** | Bromley | `nct.org.uk/local-activities-meet-ups/bromley-and-chislehurst` | NCT branch | **Eventbrite per session** | 2–3 | Genuinely machine-readable |
| NCT Bromley — breastfeeding support | Bromley | `nct.org.uk/local-activities-meet-ups/bromley-and-chislehurst/breastfeeding-support-bromley-chislehurst` | Breastfeeding | Eventbrite | 1–2 | Baby Cafés, free drop-in |
| NCT Beckenham & Borders — Happy Mondays | Bromley | `bromley.gov.uk/directory-record/5894/…` | NCT playgroup | Directory record | 1 | Newborn–4 |
| NCT Bumps and Babies (Bromley) | Bromley | `bromley.gov.uk/directory-record/8015/nct-bumps-and-babies` | NCT peer support | Directory record | 1 | |
| NCT Southwark & Waterloo (Riverside) | Southwark | `nct.org.uk/courses-workshops/locations/riverside-antenatal-classes` | NCT branch | HTML + booking | — | Antenatal-led |
| St Barnabas with Christ's Chapel — PlayTime! | Southwark | `stbarnabasdulwich.org/worship-services/playtime/` | Church toddler group | HTML; email booking, cap 50 families | 1 | Fri 09:30–11:00 term time, **free** |
| St Paul's Beckenham — Babies & Toddlers | Bromley | `stpaulsbeckenham.org.uk/babies-and-toddlers` | Church toddler group | HTML | 1 | Thu 10:00–11:30, £1 donation |
| St John's Beckenham — Babies & Toddlers | Bromley | `stjohnsbeckenham.org/groups-old` | Church toddler group | HTML groups list | 1 | Tue 09:15–11:00 term time |
| Bromley Parish Church — Toddler Praise | Bromley | `facebook.com/toddlerpraisebpc/` | Church toddler group | **Facebook only** | 1 | No website presence |
| Bromley Parish Church — Boppin Tots | Bromley | `bromleyparishchurch.org/room-events-groups` | Church venue / music | HTML | 2 | Mon + Thu, pay-as-you-go |
| Christ Church Bromley — Lighthouse Toddler Group | Bromley | Happity schedule page | Church toddler group | **Happity** | 1 | Thu 09:30–11:30 |
| Beckenham Methodist Church | Bromley | Happity venue page | Church venue | **Happity** | 3 | BR3 5JE |
| Beckenham Baptist Church | Bromley | Happity venue page | Church venue | **Happity** | 1–3 | |
| Bromley Community Church (BCC) | Bromley | Happity venue page | Church venue | **Happity** | 1–3 | |
| Petts Wood Methodist Church | Bromley | Happity venue page | Church venue | **Happity** | 2–4 | Little Kicks Wed/Thu (18m–2y6m) |
| Orpington Baptist Church — Tiddlers | Bromley | Happity schedule page | Church toddler group | **Happity** | 1 | Wed 13:15–14:45, £1/family |
| Chislehurst Methodist Church | Bromley | `methodistlondon.org.uk/churches/orpington-and-chislehurst` | Church venue | HTML circuit directory | 2 | Caterpillar Music ×2 |
| Orpington Methodist Church | Bromley | `orpingtonmethodist.org.uk` | Church venue | HTML, dated | 1 | Hosts NCT Mothers & Others |
| Orpington & Chislehurst Methodist Circuit | Bromley | `orpchiscircuit.org.uk` | Church circuit directory | HTML | — | Gateway to Methodist groups |
| Diocese of Southwark — find a church | Southwark + Bromley | `southwark.anglican.org/find-a-church/` | Anglican directory | Searchable HTML by deanery | — | Best systematic route to Anglican parishes in **both** boroughs |
| **A Church Near You** (national CofE) | All | `achurchnearyou.com` | Church directory | **schema.org `Church` JSON-LD** with geo + postcode; per-church events pages | — | ~16k parishes; verified JSON-LD on church pages |
| **Happity — Southwark** | Southwark | `happity.co.uk/southwark/baby-toddler-classes` | Aggregator / booking | **403 to server-side fetch** | 100+ | Densest paid-class source; needs browser client or partnership |
| **Happity — Bromley** | Bromley | `happity.co.uk/bromley/baby-toddler-classes` | Aggregator / booking | 403 to server fetch | 100+ | Also `/bromley-beckenham/`, `/bromley-orpington/`, `/petts-wood/` |
| The Play Map — Southwark | Southwark | `theplaymap.co.uk/playgroups/stay-and-play-in-southwark` | Free stay-&-play aggregator | **HTML, server-rendered** | 18 verified | Day/SEN/dad filters |
| The Play Map — Bromley | Bromley | `theplaymap.co.uk/playgroups/stay-and-play-in-bromley` | Free stay-&-play aggregator | **HTML, server-rendered** | 27 verified | |
| Bromley directory of parent & toddler groups | Bromley | `bromley.gov.uk/directory/44/directory-of-parent-and-toddler-groups` | Borough FIS | Searchable DB by area | — | |
| Simply Connect Bromley | Bromley | `bromley.simplyconnect.uk` | Community directory | Searchable, **0–5 age filter** | — | Services, not dated events |
| Community Links Bromley | Bromley | `communitylinksbromley.org.uk/calendar/` | VCS calendar | HTML events calendar | few | `/calendar/item/{id}` |
| What's On In Bromley | Bromley | `whatsoninbromley.com/family-kids-activities/` | Local listings | HTML + calendar + **user submissions** | varies | |
| Southwark Local Offer | Southwark | `localoffer.southwark.gov.uk` | SEND directory | HTML + PDF | — | Route to SENsational Stay & Play |
| **Dulwich Picture Gallery — ArtPlay Pavilion** | Southwark | `dulwichpicturegallery.org.uk/visit-us/artplay-pavilion/` | Gallery under-5 programme | HTML + ticketing (403 to bots) | 2–3 | **0–2yrs** Sat 11:00 & Wed 15:00; monthly New Parent meet-up |
| Dulwich Picture Gallery — Mini Masterpieces | Southwark | `dulwichpicturegallery.org.uk/whats-on/mini-masterpieces/` | Gallery under-5 | HTML + ticketing | monthly | Under-5s, first Friday monthly |
| **Unicorn Theatre** | Southwark | `unicorntheatre.com/age/0-2` | Theatre early years | **Age-sliced URLs + schema.org, booking** | seasonal | **Verified**: age filters 0–3 / 4–7 / 8–13; listings state ages in months (Home Song 6–18m; Huddle 1–4; Creatures 3–6) |
| Southwark Playhouse | Southwark | `southwarkplayhouse.co.uk` | Theatre | HTML what's-on | rare | Little early-years output |
| Tate Modern | Southwark | `tate.org.uk/visit/tate-modern` | Gallery | HTML + ticketing | varies | Family/early-years programme exists; exact URL (unverified) |
| Imperial War Museum London | Southwark | `iwm.org.uk/events` | Museum | HTML, JS-rendered | varies | Few dedicated under-5 |
| Shakespeare's Globe | Southwark | `shakespearesglobe.com/whats-on/` (unverified) | Theatre | HTML + ticketing | rare | Minimal under-5 |
| Churchill Theatre, Bromley | Bromley | `trafalgartickets.com/churchill-theatre-bromley/en-GB` | Theatre | Trafalgar Tickets system | seasonal | Under-18m free on lap; panto buggy park |
| Surrey Docks Farm | Southwark | `surreydocksfarm.org.uk` | City farm | HTML events; **no recurring under-5 found** | 0 recurring | SE16, free entry, toddler-friendly |
| Dulwich Park | Southwark | `southwark.gov.uk/culture-and-sport/parks-and-open-spaces/find-park/dulwich-park` | Park / playground | HTML | 0 recurring | Toddler playground; Francis Peek Centre programme |
| Burgess Park | Southwark | `…/find-park/burgess-park` (unverified) | Park | HTML | 0 recurring | Two playgrounds |
| Beckenham Place Park | Bromley | `beckenhamplacepark.co.uk` | Park / nature | HTML → separate events site | few | Sand pit, nature playground, story trail |
| **Beckenham Place Park — What's On** | Bromley | `beckenhamplace.org/whatson/` | Park events | **The Events Calendar** (list/month/week + categories) | 1–2 | Best-structured park events source found. e.g. "little folk — Nursery Rhymes Sing-song for Early Years" |
| High Elms Country Park (BEECHE) | Bromley | `bromleyparks.co.uk/high-elms-country-park/` | Forest school | Site returned 503 (availability unverified) | 1–2 | Woodland Explorers, 18m–school age |
| Gymboree Play & Music, Peckham Rye | Southwark | Happity soft-play page | Indoor play / classes | **Happity** + own booking | 10+ | Play & Learn, baby massage, open gym |
| Gambado Beckenham | Bromley | via `whatsoninbromley.com` (own site unverified) | Soft play | Aggregator listing | daily | |
| The Play Rooms, Bromley | Bromley | via `whatsoninbromley.com` (own site unverified) | Soft play | Aggregator listing | daily | |
| Baby Sensory Bromley/Orpington/Chislehurst | Bromley | `babysensory.com/bromley/` | Franchise class | Own booking system | 10+ | |
| The Family Grapevine — Bromley | Bromley | `thefamilygrapevine.co.uk/bromley/directory/baby-and-toddler-groups/` | Local family directory | HTML + **Issuu toddler timetable** | — | |
| MyBump2Baby Bromley | Bromley | `mybump2baby.com/directories/baby-and-toddler-groups/bromley-baby-and-toddler-groups/` | Aggregator | HTML | — | Moderate coverage |

**Currency flags to encode as suppression rules:** Dulwich Library closed to autumn 2026; Brandon Library temporarily closed; Bromley Central Library relocated to The Pavilion (BR1 3EF); Anerley is not a Bromley library.


### 3.5 Source universe — class providers and franchises operating in SE London

Booking platform is the decisive machine-readability signal. "n/p" = price not published. All checked 2026-08-11.

| Provider | Borough / area | SE London URL | Booking platform | Price | Ages | Weekly? |
|---|---|---|---|---|---|---|
| Baby Sensory Blackheath–Eltham | Greenwich, Lewisham | `babysensory.com/blackheath-eltham/` | WOW World Group custom (JS) | £11–14 | 0–13m | Yes |
| Baby Sensory Woolwich–Greenwich | Greenwich | `babysensory.com/woolwich-greenwich/` | WOW custom | £11–14 | 0–13m | Yes |
| Baby Sensory Dulwich | Southwark, Lewisham | `babysensory.com/dulwich/` | WOW custom | £12–15 | 0–13m | Yes |
| Baby Sensory Bromley | Bromley | `babysensory.com/bromley/` | WOW custom | £12–15 | 0–13m | Yes |
| Baby Sensory Southwark | Southwark | Pebble supplier page (unverified) | **Pebble** | n/p | 0–13m | Yes |
| Toddler Sense Greenwich | Greenwich SE10 | `toddlersense.com/greenwich/` | WOW custom | n/p | 13m–5y | Yes — **franchise advertised for sale** |
| Toddler Sense Bromley & Beckenham | Bromley | `toddlersense.com/bromley/` | WOW custom + Happity | £11 | 12m–5y | Yes |
| Hartbeeps South London | Lewisham, Greenwich | `hartbeeps.com/south-london` (403) | Own + Happity | £14.50 | 1m–5y | Yes |
| Hartbeeps South East London | Southwark, Lewisham | `hartbeeps.com/south-east-london` (unverified) | Own + Happity | £10–15 | 1m–5y | Yes |
| Monkey Music Blackheath & Greenwich | Greenwich SE10 | `monkeymusic.co.uk/area/blackheath-greenwich` (403) | Franchise custom | £10.50–14.50 | 3m–4y | Yes |
| Monkey Music Bromley/Chislehurst/Hayes | Bromley | `wwwapi.monkeymusic.co.uk/Classes/Venue+Details/?id=2100005` | Franchise custom | £10.50–14.50 | 3m–4y | Yes |
| Monkey Music Dulwich/Herne Hill/Norwood | Southwark | `monkeymusic.co.uk/area/dulwich-village-…` (unverified) | Franchise custom | n/p | 3m–4y | Yes |
| Sing and Sign Greenwich & Lewisham | Greenwich, Lewisham | `singandsign.co.uk/classes/classes-near-you/greenwich-&-lewisham` | **BookMyClass** | ~£13 (£130/10wk) | 6m–2.5y | Yes |
| Sing and Sign Southwark | Southwark | `singandsign.co.uk/classes/classes-near-you/Southwark` | BookMyClass | n/p | 6m–2.5y | Yes — page still says "April 2025 term" |
| Sing and Sign Bromley/Beckenham/Orpington | Bromley | (HTTP 500, unverified) | Email / BookMyClass | n/p | 6m–2.5y | Yes |
| Lucy Sparkles — Brockley/Forest Hill/Sydenham | Lewisham | `lucysparkles.com/find-a-class/music-dance-brockley-forest-hill-sydenham/` | **Bookwhen** `/lucysparklesbfs` | £8.50–10 | 0–6y | Yes |
| Lucy Sparkles — Crystal Palace/Dulwich/Herne Hill | Southwark, Lewisham | `…/music-dance-crystal-palace-dulwich-herne-hill/` | **Bookwhen** `/lucysparklescdh` | £8.50–10 | 0–6y | Yes |
| Lucy Sparkles — Bermondsey/Southbank/Kennington | Southwark SE1 | `…/music-dance-classes-in-bermondsey-southbank-kennington/` | **Bookwhen** `/lucysparklesbsk` | £6–8.50 | 0–6y | Yes |
| Tappy Toes Greenwich & Blackheath | Greenwich | `tappytoes.com/franchisees/toddler-classes-greenwich-blackheath/` | ThinkSmart | ~£11 | 6m–5y | Yes |
| Tappy Toes Forest Hill/East Dulwich/Peckham | Lewisham, Southwark | `tappytoes.com/toddler-classes-near-me/` | **Happity** | £11 | 6m–6y | Yes |
| Baby College Lewisham | Lewisham, Southwark | `babycollege.co.uk/location/baby-college-lewisham/` | Franscape | n/p | 0–3y+ | Yes (term) |
| Singalong Sally | Lewisham | `singalongsally.co.uk/classes` | **Happity** | £2–8 | 3m–5y | Yes |
| Greenwich Music School — Early Years | Greenwich | `greenwichmusicschool.org.uk/courses-tuition/early-years/find-a-class` | **Happity** | subsidised places | 0–5y | Yes |
| diddi dance Royal Greenwich | Greenwich SE3 | `diddidance.com/diddi-dance-se-london/` | `booking.diddidance.com` | £8 | 16m–5y | Yes |
| diddi dance Lewisham | Lewisham SE12 | `diddidance.com/diddi-dance-lewisham/` | `booking.diddidance.com` | £9 | 18m–5y | Yes |
| Water Babies SE London & Bromley | Greenwich, Southwark, Bromley | `waterbabies.co.uk/baby-swimming/london-south-east/` | Own portal | ~£20 | 0–5y | Yes (term) |
| Water Babies — Charlton Park Academy | Greenwich SE7 | `…/charlton-park-academy-charlton-pool/` | Own portal | n/p | 0–5y | Yes |
| Water Babies — Nuffield Health Bromley | Bromley BR1 | (403, unverified) | Own portal | n/p | 0–4y | Yes |
| Puddle Ducks — Skeet Hill, Orpington | Bromley BR6 | `puddleducks.com/local-teams/east-kent-north-kent-south-east-london/our-pools-classes` | `my.puddleducks.com` | £20 | 0–4y | Yes |
| Turtle Tots London SE & Bexley | Greenwich SE18 | `turtletots.com/uk/pool/shooters-hill-sixth-form-college/` | Own | ~£15 | 0–4y | Yes |
| Tumble Tots Bromley | Bromley BR2 | `tumble-tots-bromley.classforkids.io` | **Class4Kids** | ~£9 | 6m–7y | Yes |
| Little Kickers Blackheath | Greenwich, Lewisham | `littlekickers.co.uk/en-gb/locations/blackheath/` | Own (monthly auto-billing) | n/p | 18m–8y | Yes (rolling) |
| Little Kickers Bromley | Bromley | `littlekickers.co.uk/en-gb/locations/bromley/` | Own | n/p | 18m–8y | Yes |
| Little Kickers South East London | Southwark SE22 | `littlekickers.co.uk/en-gb/locations/south-east-london/` | Own | n/p | 18m–8y | Yes |
| Rugbytots Dulwich | Southwark SE21 | `rugbytots.co.uk/Dulwich/Class/Details/78864` | Own centralised | £10 + £35 joining | 2–7y | Yes (11-wk blocks) |
| Rugbytots Bromley / Greenwich-Eltham | Bromley, Greenwich | deep links only (unverified) | Own centralised | £9 | 2–5y | Yes |
| Gymboree Play & Music East Dulwich | Southwark SE22 (only SE London centre) | `gymbo.co.uk/east-dulwich/` | Own (membership) | £16.50 PAYG / £75+pm | 0–5y | Yes |
| babyballet Greenwich & Dulwich | Greenwich, Southwark | `babyballet.co.uk/babyballet-school/greenwich-dulwich/` | Own | £10.25 | 6m–6y | Yes |
| babyballet Crystal Palace & Forest Hill | Lewisham, Bromley | `babyballet.co.uk/babyballet-school/crystal-palace-forest-hill/` | Own | £10.25 | 6m–6y | Yes |
| Aquatots Catford | Lewisham SE6 | `aquatots.com/pool-site/greater%20london/catford-bromley-road` | `aquatotsonline.com` | ~£15–16 | 10wk–7y | Yes (term) |
| Aquatots Peckham | Southwark SE15 | `aquatots.com/page/aquatots-peckham` | `aquatotsonline.com` | £162/term | 10wk–7y | Yes |
| Synergy Gymnastics (Camberwell LC) | Southwark SE5 | `synergygymnastics.co.uk/preschool-gymnastics/` | **iClassPro** | £10 | 2–4y | Yes (48wk/yr) |
| Ladywell Gymnastics Club | Lewisham SE6 | `ladywellgym.com/Want%20to%20join/timetable.htm` | **Happity** | £10 | 18m–5y | Yes (waiting lists) |
| Tiptoes & Tappers | Greenwich SE3/9/10 | `tiptoesandtappers.co.uk` | Own form | n/p | 2y+ | Yes |
| Little Crocs Football | Greenwich SE9 | `little-crocs.com` | **Acuity Scheduling** | £7 | 18m–4y | Yes |
| My Sports (Brockley) | Lewisham SE4 | `my-sports.co.uk/find-a-class` | Email + **Happity** | £10 | 2–5y | Yes |
| Footie Fanatics | Lewisham, Bromley | `footiefanatics.co.uk/book-a-class` | Own + **Happity** | £10–12 | 1–5y | Yes |
| Busylizzy Greenwich & Blackheath | Greenwich SE3 | `busylizzy.co.uk/greenwich/` | Own membership + Happity | £80–120/mo | antenatal–12m | Yes — **club advertised for sale** |
| Whippersnappers | Southwark SE21/24 (Dulwich Park, Brockwell) | `bookwhen.com/whippersnappers` | **Bookwhen** | £9 / £108 per 12wk | 0–5y | Yes |
| Boppin' Bunnies | Greenwich SE3, Lewisham SE12/14, Southwark SE1 | via Happity (own site TLS failure) | **Happity** | £9–12 | 0–5y | Yes |
| Trinity Laban — Creative Dance for carers & preschoolers | Lewisham SE8 | `trinitylaban.ac.uk/whats-on/creative-dance-classes-carers-and-preschoolers-3-4yrs/` | Own + waiting list | £120–174/term | 3–4y | Yes (Sat, term) |
| **RMG — Play Tuesdays (NMM)** | Greenwich SE10 | `rmg.co.uk/whats-on/national-maritime-museum/play-tuesdays` | `tickets.rmg.co.uk` | £4/child | under 5 | **Yes (term)** |
| **RMG — Ship Mates (Cutty Sark)** | Greenwich SE10 | `rmg.co.uk/whats-on/cutty-sark/ship-mates` | `tickets.rmg.co.uk` | £5 adult, under-5s free | under 5 | **Yes (term)** |
| RMG — toddlers hub | Greenwich SE10 | `rmg.co.uk/plan-your-visit/families/things-do-toddlers-greenwich` | Ticketing + free drop-in | £0–10 | 0–5y | Mixed |
| Bananadrama | Greenwich SE3/18 | `bananadrama.co.uk` | Own form | £9 | 3–6y | Yes |
| Montage Theatre Arts | Lewisham SE13 | `montagetheatre.com/classes/` | WooCommerce | £47–96/term | 3–5y | Yes |
| Little Splodgers | Greenwich SE10, Blackheath | `littlesplodgers.com/classes/find-classes/` | Own | n/p | 12m+ | Yes — **newest content 2023, verify still trading** |
| Blackheath Conservatoire | Greenwich/Lewisham SE3 | `conservatoire.org.uk` | Own shop | n/p | early years | Yes |
| The Baby Cloud Greenwich | Greenwich SE10 (The Forum) | `thebabycloudgreenwich.classforkids.io` | **Class4Kids** | n/p | 2–13m | Yes |
| Blossom Babies | Isle of Dogs E14 (3 venues) | `blossombabies.classforkids.io` | **Class4Kids** | n/p | 0–3y | Yes |
| ProInfinity Coaching | Greenwich SE10 | `proinfinity.classforkids.io` | **Class4Kids** | n/p | 2–5y | Yes |
| Rugby Munchkins | Lewisham SE12, Bromley BR3/6 | `rugby-munchkins.classforkids.io` | **Class4Kids** | n/p | 2–5y | Yes |
| Football Munchkins | Lewisham SE6, Bromley BR1/3 | `football-munchkins.classforkids.io` | **Class4Kids** | n/p | 2–7y | Yes |
| Multi Sport Munchkins | Greenwich SE9 | `multisport-munchkins.classforkids.io` | **Class4Kids** | n/p | 2–7y | Yes |
| Awfootball Coaching | Greenwich SE9, Bromley BR1/7 | `awfootball-coaching.classforkids.io` | **Class4Kids** | n/p | 20m–4y | Yes |
| Tots Tennis | Southwark SE15/21/22 | `tots-tennis.classforkids.io` | **Class4Kids** | n/p | 2–5y | Yes |
| Pro Elite South London | Southwark SE1/16 | `proelite-southlondon.classforkids.io` | **Class4Kids** | n/p | 18m–7y | Yes |
| Penguins Palace (swim) | Southwark SE1/15/22 | `penguins-palace.classforkids.io` | **Class4Kids** | n/p | 0m+ | Yes |
| El Recreo (Spanish) Greenwich & Kidbrooke | Greenwich SE3/10 | `elrecreo-greenwichkidbrooke.classforkids.io` | **Class4Kids** | n/p | 6m–3y | Yes |
| El Recreo Spanish Eltham | Greenwich SE9 | `el-recreo-spanish-eltham.classforkids.io` | **Class4Kids** | n/p | 6m+ | Yes |
| LMJDance | Bromley BR2 | `lmjdance.classforkids.io` | **Class4Kids** | n/p | 18m–5y | Yes |
| PopTots / Minipops | Bromley BR3 | `pop-star-ltd.classforkids.io` | **Class4Kids** | n/p | 12m+ | Yes |
| TTKR Dulwich (rugby) | Southwark SE21 | `ttkr-dulwich.classforkids.io` | **Class4Kids** | n/p | 2–7y | Yes |
| Dulwich Ballet School | Southwark SE21 | `dulwich-ballet-school.classforkids.io` | **Class4Kids** | n/p | 2–18y | Yes |
| Beckenham Ballet Academy | Lewisham SE26 | `beckenhamballetacademy.classforkids.io` | **Class4Kids** | n/p | 3.5y+ | Yes |
| BB Soccer (Soccer Tots) | Bromley/Penge SE20 | `bb-soccer.classforkids.io` | **Class4Kids** | n/p | 2–5y | Yes |
| London Parkour School | Isle of Dogs E14 | `london-parkour-school.classforkids.io` | **Class4Kids** | n/p | 18m+ | Yes |
| J'ace Rotherhithe Gymnastics | Southwark SE16 | `j-ace-rotherhithe-gymnastics.classforkids.io` | **Class4Kids** | n/p | 18m+ | Yes |
| Cheer London Allstarz | Greenwich, Lewisham, Bromley | `cheer-london-allstarz.classforkids.io` | **Class4Kids** | n/p | 3y+ | Yes |
| Theatre Peckham | Southwark SE5 | `theatre-peckham.classforkids.io` | **Class4Kids** | n/p | 3y+ | Yes |
| Wolfpack Dance Collective | Southwark SE1 | `wolfpack-dance-collective.classforkids.io` | **Class4Kids** | n/p | 3y+ | Yes |
| Mini Mozart Blackheath | Greenwich SE3 | `minimozart.com/venue/blackheath/` (unverified) | Own | n/p | 0–4y | Yes |
| Little Quavers Blackheath | Greenwich SE3 | Happity (unverified) | **Happity** | n/p | 0–5y | Yes |
| Foxtots | Penge SE20 / Bromley | Happity (unverified) | **Happity** | £5–70 | 0–6y | Yes |
| Margaret's Music | Southwark SE15 | Happity (unverified) | **Happity** | £3–70 | 0–5y | Yes |
| Miss Rhyme Time | Deptford SE8 | Happity (unverified) | **Happity** | £5 | 0–4y | Yes |
| Bach to Baby | Southwark SE1 (St Mary Magdalen) | `bachtobaby.com` (unverified) | Own | n/p | 0–5y | Yes |
| SwimKidz SE London & Bromley | Greenwich SE7, Southwark SE1/17 | Happity (unverified) | Own (fixed-date courses) | £153–170/course | 1m–8y | Yes |
| Better/GLL Swim School | All four boroughs | `bookings.better.org.uk` | Own | £25/30min 1:1 | family/teaching pool | Yes |
| Greenwich children's centres — Storkway | Greenwich | `better.org.uk/children-centre/london/greenwich/storkway-childrens-centre/timetable` | Drop-in (Baby Sensory booked) | **£1/family** | 0–5 | Yes |
| Idea Store Canary Wharf | Isle of Dogs E14 | `ideastore.co.uk/our-services/children-and-families` | Drop-in | Free | 0–5 | Yes |

**Additional independents confirmed in the final pass**

| Provider | Borough / area | SE London URL | Booking platform | Price | Ages | Weekly? |
|---|---|---|---|---|---|---|
| Baby Steps Fitness | Manor House Gardens, Lee SE12 | *(unverified)* | Own | £6.50 | 2m+ | Yes |
| Post-Partum Power | Kidbrooke Community Hub SE3 | *(unverified)* | Own | £12–40 | 2–16m | Yes |
| Bumptomama | Docklands Settlements E14 | *(unverified)* | Own | n/p | 0–12m | Yes |
| Yogarise Peckham | Peckham SE15 | *(unverified)* | Own | £12 | 0–12m | Yes |
| Frogprince Baby Music | Mercato Metropolitano SE1 | *(unverified)* | **Free drop-in** | Free | 0–4 | Yes |
| Infinitely Different CIC — Babble Boost | Docklands Settlements E14 | *(unverified)* | **Happity** | £16.50–115 | 0–18m | Yes |
| Giggle and Grow — Little Musical Explorers | Waitrose/John Lewis café E14 | *(unverified)* | **Happity** | £5–12 | 0–3 | Yes |
| Blackheath Halls | Blackheath SE3 | `blackheathhalls.com/whats-on/` | Own box office | n/p | family shows | No — one-off |
| Big Little Fun — arts & crafts | Greenwich, Lewisham, Bromley | `biglittlefun.co.uk/classes/arts-crafts-class/` *(unverified)* | Own | n/p | under 5 | Yes |

**Verified NOT operating in SE London — remove from the source universe.** Jo Jingles (Bromley page 404s), Rhythm Time (no London), Caterpillar Music, Musical Bumps (nearest Croydon), Boogie Beat (no London), Adventure Babies (SW only), Pyjama Drama, ARTventurers, Little Learners, Little Voices, The Creation Station (Blackheath/Greenwich URL 404s), Stagecoach Early Stages, Socatots, Buggyfit, Aquababies, Moo Music (Bromley page dormant), **Sensory Stories ("launching soon" placeholder only)**, Messy Monsters (domain repurposed), Mucky Pups (domain for sale), Bloomin' Babies (DNS fails), Tea Dance for Little People (domain lapsed), Greenwich Music Hub (DNS fails). **Splash About is a swimwear brand, not a class provider.** Tots Play covers Bexley (DA), not our boroughs. Polka Theatre is SW19 — outside the patch, though still worth listing as a destination.

### 3.6 Source universe — aggregators, local media, directories and community groups

| Name | Coverage | URL | What it lists | Machine-readable? | Notes |
|---|---|---|---|---|---|
| **ClassForKids directory** | UK; area pages for every SE borough | `classforkids.io/classes/{greenwich\|lewisham\|catford\|peckham\|dulwich\|bermondsey\|rotherhithe\|eltham\|woolwich\|bromley\|beckenham\|orpington\|millwall\|canary-wharf\|blackheath-park}` | Provider, venue + postcode, category, **exact age range**, booking subdomain | **BEST TARGET.** Server-rendered; sitemap index (9 children); robots blocks only `/iframe/*`; **no AI-crawler block**. Category filter `/classes/{area}/baby-and-toddler` | **Slug trap:** `/blackheath`→Surrey, `/deptford`→Wiltshire, `/sydenham` & `/new-cross`→Somerset, `/charlton`→West Sussex, `/south-bromley`→E14. Pin verified slugs and filter by postcode prefix |
| **Pebble** | UK borough pages | `activities.bookpebble.co.uk/activities/parent-and-baby-toddler/near-{greenwich\|lewisham\|southwark}` | Baby/toddler classes by supplier | Sitemap index; no AI block; **but listing pages are client-rendered** — server fetch returns title only | Needs headless browser or their internal JSON endpoint |
| **Happity** | UK; postcode + brand pages | `happity.co.uk` | The richest UK under-5 class dataset | **Explicitly forbidden.** robots.txt sets `Content-Signal: ai-train=no` and `Disallow: /` for **ClaudeBot, GPTBot, CCBot, Google-Extended, Bytespider, meta-externalagent**; `/events/` disallowed; sitemaps gzipped and 403 | **Do not scrape — partnership target only.** Business is very much alive (blog posts Aug 2026) |
| **Bookwhen** | Per-organiser | `bookwhen.com/{slug}` | Individual provider schedules | Permissive robots; **no sitemap, no directory** — must know the slug; page is JS-rendered; `.ics` → 406 | Discovery must come from provider sites |
| **Hoop** | Lewisham, Southwark, Bromley, Tower Hamlets populated | `hoop.co.uk` | Dated, timed children's activities by borough | Sitemap index (static/activities/areas/organisers/blog); robots `Allow: /`, **no AI block**; no public API | **Still operating.** Closed 2020, **relaunched 22 June 2023**, now Hoop Health Ltd, © 2026, sitemap lastmods Feb 2026, real listings from 11 Aug 2026. **`/areas/london/greenwich/` is EMPTY** — "This region has no activities currently listed" |
| Toddle About | Greenwich borough page live | `toddleabout.co.uk/near-me/greenwich/mums-and-tots-groups` | Mums & tots groups, classes; postcode + radius | Sitemap; no AI block; HTML-only | © 2026, "powered by Book That In". No per-listing verification dates; visible duplication |
| Day Out With The Kids | UK; **London is the finest granularity** | `dayoutwiththekids.co.uk` | 8,500+ attractions with ages and prices | **`sitemapindex.xml` with 147 child sitemaps**, no AI block — but **no lastmod dates, no API, no affiliate feed** (`/partners` 404s) | `/things-to-do/london/greenwich` 404s. Attractions, not recurring classes |
| Kidadl | UK/international | `kidadl.com` | Family activity ideas | HTML-only; no sitemap/API found | **Editorially stalled** — footer still "© 2024", no article dates, `/things-to-do`, `/things-to-do/greater-london` and `/about-us` all 404. Deprioritise |
| MyBump2Baby | UK directory | `mybump2baby.com/directory/` | Baby/toddler groups, swimming, nurseries | HTML-only, DB-driven | Town granularity patchy; SE boroughs not distinct "towns" |
| **Families SE London** (Families Magazine) | **South East London, 0–12** | `issuu.com/familiesonline/stacks/cf5b53fc171a4095a7234f14c19b36fd` | Bi-monthly free local magazine: what's on, activities | **Issuu flipbook — effectively unextractable**; no RSS/JSON-LD | **Best editorial fit and demonstrably current**: Jul/Aug 2026 issue published 22 Jun 2026; archive to 2021. Worth a relationship for source files |
| **The Greenwich Wire** (was 853) | Greenwich, Woolwich, Charlton, Eltham, Blackheath, Thamesmead, Lewisham | `greenwichwire.co.uk` | Public-interest local news | **Working RSS at `/feed/`** (hourly); WordPress/Newspack | `853london.com` 301s here. Freshest items 11 Aug 2026. **No `/whats-on/`** — news, not listings. Effectively the last reliably-updating independent outlet in the patch |
| News Shopper | Greenwich, Lewisham, Bromley, Bexley | `newsshopper.co.uk` (unverified) | Newsquest regional what's-on | Unknown — fetcher-blocked | Context: **South London Press closed after 160 years** (reported 11 Aug 2026) |
| Southwark News | Southwark, Peckham, Bermondsey, Rotherhithe | `southwarknews.co.uk` (unverified) | Local paper what's-on | 403 | |
| Time Out London — Kids | London-wide | `timeout.com/london/kids` | Kids' things to do incl. babies-and-toddlers guide | HTML-only, no per-item dates | Live, 2026 summer content. Weak borough granularity |
| The Nudge | London-wide incl. Peckham, London Bridge, Greenwich | `thenudge.com` | "Kid-Friendly London" | HTML-only | Live Aug 2026. Under-5s thin but SE geography genuinely covered |
| London Mums Magazine | London-wide | `londonmumsmagazine.com` | Parenting + "What's On" | WordPress (RSS expected) | Live, most recent post 11 Aug 2026. Generalist |
| Muddy Stilettos (Kent) | Kent + Bromley fringe | `muddystilettos.co.uk/kent/` (unverified) | Lifestyle what's-on | 403 | |
| Nappy Valley Net | **South WEST** London | `nappyvalleynet.com` (unverified) | Under-5 classes, forums | 403 | **Geography mismatch** — low relevance |
| **Netmums local boards** | UK boroughs | `netmums.com/local/` (unverified) | Historically local boards + listings | Unknown | **Hard fetcher-level block — genuinely unresolved.** Needs a manual browser check |
| **Mumsnet Local** | — | `mumsnet.com/local` → **404** | — | — | **RETIRED.** Both `/local` and `/local/` 404; homepage nav has no Local section. **Do not build against it** |
| Peanut | UK/global | `peanut-app.io` | Mum-to-mum social | **App-only / login-walled** | A social network, not a listings source |
| **Greenwich Community Directory** (RBG FIS) | Royal Greenwich | `greenwichcommunitydirectory.org.uk/kb5/greenwich/directory/home.page` | Childcare, **baby and toddler groups**, children & families; 23 children's centres | Runs on **Outpost** (open-source LA directory, Drupal); no AI block; no sitemap declared; no API surfaced | **Strongest Greenwich source.** Must use the `/kb5/greenwich/directory/` path form — pretty URLs 301 to royalgreenwich.gov.uk or 404. FIS: fis@royalgreenwich.gov.uk. **Outpost being open-source is the most promising route to a structured export** |
| RBG Families Information Service | Greenwich | `royalgreenwich.gov.uk/homepage/50/families_information_service` | Gateway to centres/hubs | HTML-only, no last-updated | Signpost page |
| Greenwich 0 to 4 | Greenwich | `greenwich0to4.co.uk` | **Health visiting** — clinics, development, SEND | HTML-only, clean | Live and maintained. Clinics only, not activities |
| Lewisham Family Information & Services Directory | Lewisham | `lewisham.gov.uk/myservices/children-and-families-information-service/family-information-and-services-directory` | Childcare, family support, recreation | Keyword + category browse; **no age or postcode filter** | Live © 2026 |
| **Lewisham Family Hubs** | Lewisham (6 hubs) | `lewishamfamilyhubs.org.uk` | **Dated under-5 session timetables** + online booking | **PDF/image timetables + login booking** — not machine-readable | Genuinely current: "Summer Timetable 20 Jul–14 Aug". `/whats-on/` works; `/timetables-bookings/` 404s |
| Southwark Family Information Directory | Southwark | `southwark.gov.uk/children-young-people-and-families/family-information-directory` | Childcare, activities, health, SEND; area filter; ~27 pages | HTML-only; no API/export | **Page last updated 7 Jul 2026.** `cypdirectory.southwark.gov.uk` 301s here. Entries carry age ranges but **not session times** |
| Southwark Best Start Family Hubs | Southwark, 4 localities / 16 settings | `southwark.gov.uk/children-and-families/parenting/children-and-family-centres` | Family hubs, Stay and Play 0–5 | HTML-only | Last updated **12 Nov 2025** — staler than the directory |
| **Bromley Children & Family Centres** | Bromley (6 centres) | `bromley.gov.uk/ChildrenAndFamilyCentres` | **Monthly** under-5 activity timetables per centre | **Issuu — effectively unextractable**; also on social | 2026–27 Activities & Services Directory (Apr 2026–Mar 2027) exists. Monthly refresh + Issuu is a real blocker |
| Bromley Parenting Hub | Bromley | `bromleyparentinghub.info/servicedirectory` | Support orgs, find-a-centre | HTML-only | Live © 2026. **Organisations, not sessions** |
| Bromley Brighter Beginnings | Bromley | `bromleybrighterbeginnings.org.uk/index.php/local-support-directory/` | Breastfeeding support, family centres, activities | HTML-only | Charity-run; entries reference 2024–25 |
| **Tower Hamlets Local Offer** | Tower Hamlets incl. Isle of Dogs | `localoffertowerhamlets.co.uk` | Provider directory + **Events and Activities** with date filters | Platform: focusgov; Today/This-week filters; **no RSS/iCal/export** | References Aug 2026 events but `/events` rendered "No results found!" on fetch. Isle of Dogs Family Hub: Stebondale St E14 3BX |
| **GreenwichMums** | Greenwich | `greenwichmums.com` | Kids activities directory, "What's On Calendar", babychange finder | HTML-only | **Effectively abandoned** — calendar renders "Aug 2026" but "No upcoming events"; newest article **July 2024**. Good brand, dead content. *(This is the source of the §3.2 Greenwich library table — treat those times as needing re-verification.)* |
| **SE London Dads** | Greenwich, Woolwich | `selondondads.weebly.com/whats-on-in-greenwich.html` | Dads Stay & Play (Sherington CC), Sing-a-Song Dads (Woolwich Library), Dads' Forest School, separated-dads drop-in | HTML-only, Weebly | Specific and useful, **entirely undated** — recurring patterns only. **A distinctive niche nobody else covers** |
| Brockley Central | Brockley SE4, Deptford, Ladywell, New Cross | `brockleycentral.blogspot.com` | Formerly local news + events | Blogspot RSS | **DEAD — last post 15 Aug 2018** |
| The Deptford Dame | Deptford SE8 | `deptforddame.blogspot.com` | Formerly local news + events | Blogspot RSS | **DEAD — last post 8 Feb 2022** |
| Isle of Dogs Life | Isle of Dogs E14 | `isleofdogslife.wordpress.com` | Local history/culture | WordPress RSS | **Semi-dormant — last post 24 Jun 2025.** Heritage, not under-5s |
| **Mumbler** | — | `mumbler.co.uk` | Hyper-local parenting hubs | — | **No SE London franchise exists** — all territories Northern/regional. An **open territory**, i.e. a competitive gap |
| Eventbrite (Greenwich/toddler) | Greenwich | `eventbrite.co.uk/d/united-kingdom--greenwich/toddler/` | — | No JSON-LD Event data on search pages | **Returned zero matching events** — not a viable SE London under-5 source in its own right (though individual organisers like NCT Bromley do use it) |
| **Facebook groups** (Greenwich Mums, Lewisham Mums, SE London Parents, Blackheath & Greenwich Mums, Isle of Dogs Mums, Bromley Mums, Dulwich Mums, Peckham Mums) | SE London | `facebook.com/groups/*` | Peer recommendations, ad-hoc event posts | **Login-walled** — Meta serves only the word "Facebook" to server-side fetchers | **Not one group name, URL or member count could be verified.** No speculative URLs listed here by design |
| **Instagram curators** | SE London | none verified | — | Login-walled | **No account verified — the largest open gap in this research.** Needs a browser session or manual review |


### 3.7 Source universe — Greenwich and Isle of Dogs / Tower Hamlets

> **This harvest corrects two earlier findings.** (i) The Greenwich Community Directory is **not** broken — only its pretty URLs are; the `/services` tree and `sitemap.xml` are live and it is the richest single source in the borough set. (ii) Better/GLL's *branch-level* `/whats-on` pages **do** carry under-5 times and JSON-LD, even though its borough-level rhyme-time hub publishes nothing. See §3.0(c) as amended.

| Name | Borough | URL | Category | Machine-readable? | Est. u5/wk | Notes |
|---|---|---|---|---|---|---|
| **Greenwich Community Directory** (Outpost/Drupal) | Greenwich | `greenwichcommunitydirectory.org.uk/services` | Council directory | **BEST IN SLICE — 1,346 service pages in `sitemap.xml`**, each with structured age range, cost, booking, opening hours, full address + postcode, access needs. On-site search is JS/facet-driven → **crawl the sitemap, not the search**. No API (`/api*` all 404) | **~450 services tagged 0–5** (~292 strictly 0–4) | `/children-and-families` 301s away, but `/services` is live |
| Royal Greenwich events system | Greenwich | `royalgreenwich.gov.uk/site/scripts/events_info.php?locationID=247` | Council events | HTML + **RSS feed** + per-location filter | ~0 | **Stale** — Woolwich Centre Library still lists 2019–2024 events. Low value |
| Better/GLL Greenwich Libraries hub | Greenwich | `better.org.uk/library/london/greenwich/events-and-activities/rhyme-time` | Library hub | Prose only, no dates. `/greenwich/whats-on` is 404 | n/a | The hub is useless; the branch pages are not |
| Abbey Wood Library | Greenwich | `better.org.uk/library/london/greenwich/abbey-wood-library/whats-on` | Library | **HTML cards + JSON-LD `Library`** (geo, opening hours); days/times in free text | 1 | Eynsham Drive **SE2 9PT**. Baby rhyme time Fri 10:00–10:30 |
| **Blackheath Library** | Greenwich | `…/blackheath-library/whats-on` | Library | as above | **5** | Old Dover Rd **SE3 7BT**. Rhyme time **Tue/Wed/Thu/Fri 10:00–10:30 (0–5)**; **Stay & Play Mon 10:00–12:00**. Busiest branch |
| Charlton House Library | Greenwich | `…/charlton-house-library/whats-on` | Library | as above | 2 | Charlton House, Charlton Rd **SE7 8RE**. Rhyme time Mon & Thu 10:30–11:00 |
| Coldharbour Library | Greenwich | `…/coldharbour-library/whats-on` | Library | as above | 2 | William Barefoot Dr **SE9 3AY**. Rhyme time Fri 10:30; **Stay & Play Thu 10:00–11:30, £1/family, term time** |
| Eltham Library | Greenwich | `…/eltham-library/whats-on` | Library | as above | 1–2 | Archery Rd **SE9 1HA**. **Slug is `eltham-library`, not `eltham-centre`.** GCD lists 5 u5 services here |
| Greenwich Centre Library | Greenwich | `…/greenwich-centre-library/whats-on` | Library | as above | 2 | 12 Lambarde Sq **SE10 9GB**. **Italian Baby Rhyme Time Fri 11:00–11:30 (0–2)** |
| New Eltham Library | Greenwich | `…/new-eltham-library/whats-on` | Library | as above | 2 | Southwood Rd **SE9 3QT**. Rhyme time Mon 14:30 & Thu 10:30 |
| Plumstead Library | Greenwich | `…/plumstead-library/whats-on` | Library | as above | 3+ | 232 Plumstead High St **SE18 1JL**. Page omits rhyme time; GCD lists 6 u5 services incl. **SMILES Neurodiverse-Friendly Baby & Toddler Group, Sat 10:30–11:30, free** |
| Slade Centre Library | Greenwich | `…/slade-centre-library/whats-on` | Library | as above | 2 | Erindale **SE18 2QQ**. Times only in GCD |
| Thamesmere Library | Greenwich | `…/thamesmere-library/whats-on` | Library | as above | 1 | Thamesmere Drive **SE28 8RE**. **Stay & Play + Baby Rhyme Time Wed 09:30–11:30 (term time)** |
| West Greenwich Library | Greenwich | `…/west-greenwich-library/whats-on` | Library | as above | 3 | Greenwich High Rd **SE10 8NN**. Rhyme time + **German Baby Rhyme Time Sat 10:30–11:00 (0–2)** + messy play |
| Woolwich Centre Library | Greenwich | `…/woolwich-centre-library/whats-on` | Library | as above | 2–3 | 35 Wellington St **SE18 6HQ**. Page shows no rhyme time; GCD lists 5 u5 services |
| Greenwich libraries index (council) | Greenwich | `royalgreenwich.gov.uk/directory/26/libraries` | Library index | HTML | — | **12 libraries confirmed. No Ferrier or Middle Park library exists** (404 on Better) — a direct staleness check that the GreenwichMums table in §3.2 fails |
| **Better Children's Centres — Greenwich index** | Greenwich | `better.org.uk/children-centre/london/greenwich` | Children's centre | HTML index | — | 5 GLL-run centres |
| **Waterways Children's Centre & Family Hub** | Greenwich | `better.org.uk/children-centre/london/greenwich/waterways/timetable` | Children's centre | **Fully structured weekly HTML timetable** — day, time, session name, venue, drop-in/booking/term-time/0-2 flags | 8–12 | **SE28 8EZ** Thamesmead. **17 under-5 services in GCD — highest-volume single venue in the borough** |
| Storkway Children's Centre & Family Hub | Greenwich | `…/storkway-childrens-centre/timetable` | Children's centre | same structured timetable | 8–12 | **SE3 9QX** Kidbrooke. Infant feeding, Sensory SEND, Baby Sensory, Bumps to Babies, HV clinics |
| Vista Field Children's Centre | Greenwich | `…/vista-field-childrens-centre/timetable` | Children's centre | same | 6–8 | **SE9 5SD** Eltham. Stay & Play 0–5 Tue/Thu/Fri, Forest School, Welcome Space |
| Mulberry Park Children's Centre | Greenwich | `…/mulberry-park-childrens-centre/timetable` | Children's centre | same | 4–6 | **SE2 9JP** Abbey Wood. Runs Gallions Pop Up (SE28 8BE), soft play trips to Plumstead Centre |
| Eltham Children's Centre | Greenwich | `…/eltham-childrens-centre/timetable` | Children's centre | same | 3–5 | **SE9 1HA**. Family Hub Drop-in Tue & Fri 09:30–11:30 |
| **Home-Start Greenwich** | Greenwich | `homestartgreenwich.org.uk/activities-events/` | Children's centres (3) | **PDF ONLY** — e.g. `HSG-Summer-Programme-2026-Final-6.pdf` | 12–18 across 3 centres | Runs **Brookhill SE18 6BD**, **Eglinton SE18 3PY**, **Slade SE18 2QQ** + 7 partnership settings. **Worst format in the borough** |
| Brookhill Children's Centre & Family Hub | Greenwich | `homestartgreenwich.org.uk/brookhill-childrenscentre-html/` | Children's centre | HTML + PDF timetable | 5–7 | **SE18 6BD** Woolwich. 7 u5 services in GCD |
| Eglinton Children's Centre | Greenwich | `homestartgreenwich.org.uk/eglinton-childrens-centre/` | Children's centre | HTML + PDF | 4–6 | **SE18 3PY** Plumstead |
| Slade Children's Centre | Greenwich | `homestartgreenwich.org.uk/slade-childrens-centre/` | Children's centre | HTML + PDF | 5–7 | **SE18 2QQ** |
| **Quaggy Development Trust** | Greenwich/Lewisham border | `quaggydevelopmenttrust.org/live-calendar/` | Children's centre | **PUBLIC GOOGLE CALENDAR ICS** → `calendar.google.com/calendar/ical/quaggychildrenscentre%40gmail.com/public/basic.ics` (1,912 events). Also PDF/JPG posters | 6–10 term time | **Quaggy CC SE13 7QZ**; **Charlton Family Centre SE7 7EL**; Margaret Bondfield SE18 7LB. Only 3 events for Aug–Oct 2026 — autumn programme published late |
| Charlton Family Centre — Stay and Play | Greenwich | `greenwichcommunitydirectory.org.uk/services/stay-and-play-charlton-family-centre` | CC session | GCD structured | 1 | **SE7 7EL**, Fri 10:59–11:30, £1/child, no booking |
| South East London Slingers (sling library) | Greenwich | `selphub.com` | Peer support | HTML | 1 | Thu 13:00–14:30 at Charlton Family Centre SE7 7EL |
| **Greenwich 0 to 4 — feeding / well baby / SALT** | Greenwich | `greenwich0to4.co.uk/clinics/infant-feeding-clinics`, `/well-baby-clinics`, `/speech-and-language-drop-ins` | Health | Static HTML tables | ~6 feeding + well-baby + SALT | Feeding: Mon Charlton SE7 7EL 13:00–14:30; Tue Slade SE18 2QQ & Vista Field SE9 5SD 10:00–11:30; Wed Storkway SE3 9QX; Thu Waterways SE28 8EZ & Brookhill SE18 6BD |
| Breastfeeding Network — Greenwich | Greenwich | `breastfeedingnetwork.org.uk/project/greenwich/` | Breastfeeding | HTML | 3–6 | Council-commissioned; peer supporters at QEH + home visits |
| NCT Greenwich | Greenwich | `nct.org.uk/local-activities-meet-ups/greenwich` | Peer support | HTML event feed — **currently "no events match those filters"** | 0–2 | Branch appears dormant on the national site |
| Royal Greenwich family hubs | Greenwich | `royalgreenwich.gov.uk/family-hub`, `/directory/15/childrens_centres` | Council | HTML, no timetables | — | Council states **23 children's centres + 4 family hubs**; directory names only 10 |
| **Woolwich Waves** | Greenwich | `better.org.uk/leisure-centre/london/greenwich/woolwich-waves/soft-play` | Leisure / soft play | HTML + Better booking | 14+ | 49 Woolwich New Rd **SE18 6EU**. Toddler Zone u5, Sensory Zone, soft play daily 09:00–20:00, Aqua Park toddler pool + splash pad. **Replaced Waterfront Leisure Centre** — an important currency correction for older round-ups |
| The Plumstead Centre | Greenwich | `…/the-plumstead-centre` | Leisure / soft play | HTML + booking | 7+ | **SE18 1JL**. Children's centres run trips here |
| The Greenwich Centre | Greenwich | `…/greenwichcentre/timetable` | Leisure | HTML timetable | 5+ | **SE10 9GB**. Learner pool 0.9m, parent-and-baby lessons |
| The Eltham Centre | Greenwich | `…/eltham-centre` | Leisure | HTML timetable | 4+ | **SE9 1HA** |
| Thamesmere Leisure Centre | Greenwich | `…/thamesmere-leisure-centre` | Leisure | HTML timetable | 3+ | **SE28 8RE** |
| Charlton Lido & Lifestyle Club | Greenwich | `…/charlton-lido` | Lido / soft play | HTML + booking | 4+ | Hornfair Park **SE18 4LX** |
| Sutcliffe Park Sports Centre | Greenwich | `…/sutcliffe-park-sports-centre` | Leisure / soft play | HTML | 3+ | **SE9 5LW** |
| Coldharbour Leisure Centre | Greenwich | `…/coldharbour-leisure-centre` | Leisure | HTML | 2+ | **SE9 3LX** |
| **RMG — What's On** | Greenwich | `rmg.co.uk/whats-on?audience=families` | Museum | HTML + query filters; events load dynamically; **Tessitura** booking at `tickets.rmg.co.uk` | 5–8 | **No under-5 audience filter — "families" only** |
| RMG — Ship Mates (Cutty Sark) | Greenwich | `rmg.co.uk/whats-on/cutty-sark/ship-mates` | Museum u5 | HTML + Tessitura | 3 | **Term-time Wed 10:30, 12:00, 13:30**, £5/adult, u5 free. Replaced "Toddler Time" |
| RMG — Play Tuesdays (NMM) | Greenwich | `rmg.co.uk/whats-on/national-maritime-museum/play-tuesdays` | Museum u5 | HTML + Tessitura | 1–3 | Tuesdays, £4/child+adult, under-6m free |
| RMG — Little Stars (NMM) | Greenwich | `rmg.co.uk/whats-on/national-maritime-museum/little-stars` | Museum u5 | HTML + Tessitura | 1 | **Thu 10:30–12:30, free, pre-book.** Storytelling social club for u5s |
| RMG — Baby Yoga (NMM) | Greenwich | `rmg.co.uk/whats-on/national-maritime-museum/baby-yoga` | Museum u5 | HTML + Tessitura | 0.5 | 1st/2nd Fri monthly, 10:15 & 11:00, £10/baby+adult |
| RMG — AHOY! gallery + The Cove playground | Greenwich | `rmg.co.uk/plan-your-visit/families/things-do-toddlers-greenwich` | Drop-in | HTML | daily | AHOY! 0–7 play gallery; The Cove outdoor playground, free |
| Greenwich Theatre | Greenwich | `greenwichtheatre.org.uk/whats-on/` | Theatre | HTML list, no age filter | 0–1 | Family shows + panto — one-off, not weekly |
| Woolwich Works | Greenwich | `woolwich.works/whats-on` | Arts venue | JS-rendered (unverified) | ~1 | |
| Greenwich Dance | Greenwich | `greenwichdance.org.uk/whats-on` | Dance | HTML | 1–2 | u5 dance courses listed in GCD |
| Mycenae House (Reach Out Projects) | Greenwich | `mycenaereachout.co.uk` | Community venue | HTML | 2–4 | Blackheath; hosts multiple u5 classes |
| Shrewsbury House Community Centre | Greenwich | `shrewsburyhouse.org` | Community venue | HTML | 1–3 | **SE18 3EG** Shooters Hill |
| Greenwich West Community & Arts Centre | Greenwich | `greenwichwest.org.uk` | Community venue | HTML | 1–3 | |
| Clockhouse Community Centre | Greenwich | `tophorizonlimited.co.uk` | Community venue | HTML | 2–3 | **SE18 5QL**. Hosts babyballet, Perform |
| **The Big Red Bus Club** | Greenwich | `thebigredbusclub.com/dailystayandplay` | Stay & play | HTML | **5** | Charlton Park **SE7 8UB**. Mon/Tue 12:30–14:15, Wed/Thu 10:00–12:00, Fri 12:30–14:15, **free, no booking** |
| The Bridge, East Greenwich Pleasaunce | Greenwich | `thebridgese10.co.uk` (+ `/send`, `/basecamp`) | Play facility | HTML | 3–5 | **SE10 0LB** |
| The Under 5's Project | Greenwich | `under5sproject.org` | Playgroup | HTML | 3–5 | **SE18 5AR**, **SE18 4HY** |
| Superkidz Trust — Stay and Play | Greenwich | `superkidztrust.org/for-parents/stay-and-play/` | Stay & play | HTML | 1–2 | **SE9 5JH** |
| **Autistic Inclusive Meets — Monday Playgroup** | Greenwich | `autisticinclusivemeets.org/play-social-groups/monday-playgroup` | SEND-inclusive | HTML | 1 | **SE18 6UZ** |
| Greenwich Mencap | Greenwich | `greenwichmencap.org.uk/our-services/sibling-support/` | SEND | HTML | 1 | **SE18 4HX** |
| The Anchor SENDfriendly (TAS) | Greenwich | `thetascentre.co.uk` | SEND | HTML | 1–2 | **SE18 1BS** |
| Greenwich SENDIASS | Greenwich | `greenwichsendiass.uk` | SEND advice | HTML | — | |
| MumsAid / YoungMumsAid | Greenwich | `mums-aid.org/information-and-support/youngmumsaid/` | Perinatal MH | HTML | 2–3 | At Storkway SE3 9QX, Vista Field SE9 5SD, Mulberry Park SE2 9JP |
| SE London Mind — Mindful Mums / Being Dad | Greenwich | `selmind.org.uk/mindful-mums/`, `/being-dad/` | Perinatal MH | HTML | 2–4 | Also **Pride Parents LGBTQ+ group**, Young Mums, Diversity Matters |
| Mama2Mama Baby Bank Woolwich | Greenwich | `mama2mama.org.uk` | Baby bank | HTML | — | **SE18 6BD** |
| Parent Power | Greenwich | `parentpower-ed.co.uk/home-1` | Parenting | HTML | 2–3 | At Waterways SE28 8EZ |
| Future Men — Future Dads | Greenwich | `futuremen.org/fatherhood/future-dads/` | Dads | HTML | 1 | |
| The Proper Blokes Club drop-ins | Greenwich | `theproperblokesclub.co.uk/drop-ins` | Dads | HTML | 1 | South Greenwich CCs |
| **SE London Dads** | Greenwich | `selondondads.weebly.com/whats-on-in-greenwich.html` | Dads | HTML, **undated** | 3–4 | Dads Stay & Play (Sherington CC), Sing-a-Song Dads (Woolwich Library), Dads' Forest School, separated-dads drop-in |
| St Michael & All Angels, Blackheath Park | Greenwich | `se3.org.uk/get-involved/groups/` | Church | HTML | 1 | **Friday Mums' group Fri 09:45–11:00, free**, 1 Pond Rd **SE3 9JL** |
| Christchurch Priory, Eltham | Greenwich | `christchurcheltham.org.uk/Groups/Parent-and-Toddler-Group/` | Church | HTML | 1 | **SE9 1TX** |
| Eltham Green Community Church | Greenwich | `egcc.co.uk/community-activities` | Church | HTML | 1–2 | **SE9 6DH** |
| Christ Church Shooters Hill | Greenwich | `christchurchshootershill.org.uk/events` | Church | HTML events page | 1–2 | |
| Christchurch East Greenwich | Greenwich | `christchurcheastgreenwich.org.uk/connect-groups/` | Church | HTML | 1–2 | Baby & Toddler Group (0–5, refreshments) |
| St James Kidbrooke — Mums' Nest | Greenwich | `stjameskidbrooke.org` | Church | HTML | 1 | **SE3 0DU** |
| St Nicholas Kidbrooke — Pebbles | Greenwich | `achurchnearyou.com/church/671/service-and-events/calendar/` | Church | **ACNY per-church calendar with iCal export**; no JSON-LD/API | 1 | Whetstone Rd **SE3 8PX/8PZ** |
| St Mary's Community Centre, Eltham | Greenwich | `stmarys-eltham.co.uk/groups/` | Church/community | HTML | 1–2 | |
| Charlton Church | Greenwich | `charlton.church` | Church | HTML | 1 | **SE7 7NR** |
| All Saints Mums and Tots | Greenwich | *(no website — GCD record only)* | Church | none | 1 | **SE9 3TZ** New Eltham |
| St George's Westcombe Park | Greenwich | `stgeorgeswestcombepark.org.uk/community-cafe/` | Church/community | HTML | 1 | |
| Avery Hill Christian Fellowship — Springlets | Greenwich/Bexley | `springlets.org.uk/about.html` | Church | HTML (dated site) | 1 | DA15 8EA |
| Fresh Ground, Eltham — Messy Play | Greenwich | `freshgroundeltham.co.uk` | Church café | HTML | 1 | |
| **Greenwich Church network directory** | Greenwich | `greenwich-church.net`, `/roman-catholic-churches.html` | Church index | HTML by denomination/area | — | Covers Abbey Wood, Blackheath, Charlton, Coldharbour, Eltham, Kidbrooke, Mottingham, New Eltham, Plumstead, Shooters Hill, Thamesmead, Woolwich. **Good crawl seed** |
| Greenwich Peninsula Ecology Park (TCV) | Greenwich | `tcv.org.uk/greenwichpeninsula/events/` | Park / nature | HTML, no calendar, **email booking only** | 0–1 | **No dedicated u5 sessions found** — wellbeing clubs are 16+/18+ |
| Greenwich Park — Eco Tots (Field Studies Council) | Greenwich | `field-studies-council.org/courses-and-experiences/static-courses/eco-adventures-at-greenwich-park/` | Park / nature | HTML + FSC booking | 1 | **Eco Tots, 18 months–5 years** |
| Woodlands Farm Trust, Welling | Greenwich/Bexley | `thewoodlandsfarmtrust.org` | City farm | HTML, no structured listing, no postcode on site | 0–1 | Tue–Sun 09:30–16:30. One-off family events; **no weekly u5 session confirmed** |
| Charlton House & Gardens | Greenwich | *(unverified — `charltonhouse.org`, `charltonhouseandgardens.org.uk`, `royalgreenwichheritage.org` all failed to resolve)* | Heritage | unknown | ? | Charlton House Library is inside it and does publish rhyme time |
| The Tramshed, Woolwich | Greenwich | `tramshed.org` (`/whats-on` = 404) | Arts venue | HTML | ? | What's-on path needs re-check |
| AirCraft Circus — Trapeze Tots | Greenwich | `aircraftcircus.com/collections/aircraft-circus-classes-for-kids` | Classes | **Shopify** booking | 1 | **SE18 5NR**. Ages 4–6, £185/13wk |
| Crafty Wizards | Greenwich | `craftywizards.com/kids-playnow-club/` | Play / classes | HTML + online booking | 6 | **SE9 6NX**, **SE9 2JH**, **SE9 1HA** |
| Loopy Lou's Fun Factory | Greenwich | `facebook.com/loopylousfunfactory.co.uk/` | Soft play | **Facebook only** | 5+ | **SE9 2AF** |
| Perform (Greenwich/Eltham/Kidbrooke/Blackheath) | Greenwich | `perform.org.uk/free-drama-class/` | Classes | HTML + booking | 4–6 | SE10 9LA, SE9 1TX, SE3 0DU, SE3 9JL, SE3 0TP |
| Miss Rhyme Time | Greenwich | `missrhymetime.co.uk` | Classes | HTML | 2–3 | **SE3 9LA** |
| LIFT Music (Headsoup) | Greenwich | `liftmusic.org` | Classes | HTML | 2–3 | |
| Band for Babies (GAMD) | Greenwich | `gamd.org.uk/band-for-babies-concert-series` | Concerts | HTML + booking | one-off | £10 adults |
| Baby Broadway | Greenwich | `babybroadway.co.uk` | Concerts | HTML + ticketing | one-off | |
| Nature Vibezzz | Greenwich | `naturevibezzz.org` | Forest school | HTML | 1–2 | |
| Visit Greenwich — What's On | Greenwich | `visitgreenwich.org.uk/whats-on` | Tourism DMS | HTML listing | few u5 | Also lists Mudchute, Ecology Park as venue pages |
| **Idea Store / Tower Hamlets Libraries** | Tower Hamlets | `ideastore.co.uk/whats-on`; `ideastore.towerhamlets.gov.uk/events` | Library | **LUCi by SOLUS** — listing is client-side JS (no ids/JSON in HTML), but **individual event pages server-render with `og:` metadata** at `…/events?id=NNNNNN`. Booking on `idea.events.mylibrary.digital` (403 to bots) | **~30–40/wk across 7 sites** | **Story Time for under-5s Mon–Sat 10:30–11:15 at every site**, free, no booking. Verified: Bow Tue 20 Jan 2026; Watney Market Tue 13 Jan & Mon 16 Feb 2026. **Two-stage crawl works** |
| Idea Store Canary Wharf | Tower Hamlets | `ideastore.co.uk/visit-us/idea-store-canary-wharf` | Library | JS-rendered | ~6 | Churchill Place **E14** *(postcode unverified)* |
| Cubitt Town Library | Tower Hamlets | `ideastore.co.uk/visit-us/cubitt-town-library` | Library | JS-rendered | ~6 | Isle of Dogs *(address unverified)* |
| Idea Store Chrisp Street | Tower Hamlets | `ideastore.co.uk/visit-us/idea-store-chrisp-street` | Library | JS-rendered | ~6 | Poplar |
| Idea Store Bow | Tower Hamlets | `ideastore.co.uk/visit-us/idea-store-bow` | Library | JS-rendered | ~6 | Story Time verified via event record |
| Idea Store Watney Market | Tower Hamlets | `ideastore.co.uk/visit-us/idea-store-watney-market` | Library | JS-rendered | ~6 | 260 Commercial Rd **E1 2FB** |
| Idea Store Whitechapel | Tower Hamlets | `ideastore.co.uk/visit-us/idea-store-whitechapel` | Library | JS-rendered | ~6 | |
| Bethnal Green Library | Tower Hamlets | `ideastore.co.uk/visit-us/bethnal-green-library` | Library | JS-rendered | ~6 | |
| **Tower Hamlets Local Offer** | Tower Hamlets | `localoffertowerhamlets.co.uk` | SEND directory | Structured org records (address, hours, **age eligibility, 2-year-old grant**, child-protection flags). Platform: focusgov. No API found | 100s of orgs | Good structured source for SEND + early years |
| Tower Hamlets Connect | Tower Hamlets | `towerhamletsconnect.org/search/#/directory`, `#/events` | Council directory + events | Hash-routed SPA; `/api*`, `/rest*` all 404 | ? | Has a dedicated **events** tab — worth an API hunt via the JS bundle |
| Tower Hamlets Family Hubs | Tower Hamlets | `thfamilyhubs.co.uk` (e.g. `/Page/34145`) | Family hubs | **Pure SPA** — server HTML is "Loading…" behind a 4.8MB JS bundle | ? | Isle of Dogs hub coverage **unverified** |
| **London Museum Docklands — Tots at the Docks** | Isle of Dogs | `londonmuseum.org.uk/whats-on/tots-at-the-docks/` | Museum u5 | HTML + museum booking | 0.25 (monthly) | No.1 Warehouse, West India Quay **E14 4AL**. **Last Wed monthly 10:30–14:00/15:00, free** (26 Aug, 30 Sep, 28 Oct 2026) |
| London Museum Docklands — Mudlarks family gallery | Isle of Dogs | `londonmuseum.org.uk/whats-on/mudlarks-family-gallery/` | Museum play | HTML + **timed-entry booking, released Sat 10:00 two weeks ahead** | daily (many sessions) | Up to 8yrs. £3.95 term-time weekdays / £4.95 weekends+holidays. 40-min play slots |
| Mudchute Park & Farm | Isle of Dogs | `mudchute.org/whats-on` | City farm | **No structured listing** — no dates/times; defers to Facebook/Instagram | drop-in daily | 32 acres, free entry, 09:00–16:00. Animal feeding 09:00–09:45 & 15:00–16:00 |
| **Parish of the Isle of Dogs** (Christ Church + St John's + St Luke's) | Isle of Dogs | `parishiod.org.uk/faith-action/user-groups-and-their-impact` | Church | HTML | **2** | **Toy Library / playgroup 0–5, Mon & Wed 09:30–11:30**, Christ Church Isle of Dogs |
| Christ Church Isle of Dogs (social) | Isle of Dogs | `facebook.com/ChristChurchIOD/`, `instagram.com/christchurchiod/` | Church | **Facebook/Instagram only** | 2 | Where session changes actually get posted |
| Poplar Union | Poplar | `poplarunion.com` | Arts / community | HTML what's-on | 2–4 *(unverified)* | Known family/early-years programme |
| The Space, Isle of Dogs | Isle of Dogs | `space.org.uk` | Arts venue | **HTTP 406 to scrapers**, browser-only | 1–2 *(unverified)* | 269 Westferry Rd E14 |
| Millwall Community Trust | TH / Lewisham | `millwallcommunity.org.uk` | Sport | HTML | 1–2 *(unverified for u5)* | |
| **A Church Near You** | Greenwich + Tower Hamlets | `achurchnearyou.com` | Church index + events | Per-church "service and events" calendar with **iCal / Apple Calendar export**; church pages carry schema.org `Church` JSON-LD; no public API | **30+ groups across both boroughs** | The single best systematic route to CofE parent-and-toddler groups; also carries Messy Church |

**Follow-up gaps in this slice** (flagged, not resolved — WebSearch budget exhausted): Idea Store branch addresses/postcodes; Tower Hamlets family hubs and Isle of Dogs children's centres; Charlton House's live domain; the Tramshed's what's-on path; Woolwich Works and Poplar Union early-years listings; Isle of Dogs community venues (Island House, Docklands Settlements, ASTA, Spotlight).

### 3.8 Platform-level machine-readability assessment (tested 2026-08-11)

This is the most operationally useful table in the report: it says *how* to ingest each class of source, and it corrects the naive assumption that "uses a booking platform" means "easy to ingest."

| Platform / pattern | Who uses it in SE London | Access method tested | Result | Verdict |
|---|---|---|---|---|
| **ChurchSuite public calendar JSON** — `https://{slug}.churchsuite.com/embed/calendar/json?merge=1` | St Luke's Millwall (E14), Citygate Church Beckenham, St John's Blackheath, Christ Church London | `curl`, no auth | **HTTP 200 JSON.** 41/30/2 events respectively. Recurring series **already expanded into dated occurrences** (e.g. weekly *Bubble Church* dated 16 Aug → 18 Oct 2026). Fields: name, datetime_start, datetime_end, description, category, location{name,address,lat,lon}, capacity, signup_options, status, images | **BEST-IN-CLASS. Free, no auth, no JS, occurrence-expanded.** ~30% of probed SE London churches have a live feed (3 live / 10 probed; 7 returned 302 = no account) |
| **The Play Map** — `theplaymap.co.uk/playgroups/stay-and-play-in-{borough}` | 32 London boroughs; ~106 groups in our 5 areas | `curl` with browser UA | **HTTP 200, server-rendered HTML.** Name, full address+postcode, day(s), start/end time, organiser outbound link; sometimes cost and age-in-months; tags for SEN / baby-only / dad-carer / young-parent / outdoors | **EXCELLENT SEED.** Wix-hosted but no JS needed. Coverage uneven (Lewisham thin) |
| **Council HTML timetable (Southwark model)** | Southwark libraries | `WebFetch` | Whole borough on one page: venue × session × day × time × term-time flag | **BENCHMARK.** Scrape once per term |
| **A Church Near You** — `achurchnearyou.com` | ~16k CofE parishes nationally; the systematic route into Anglican toddler groups | `curl` | Church pages carry **schema.org `Church` JSON-LD** with postcode + lat/lon. Per-church "Services and events" pages. No public JSON API (`/api/search/` → 404) | **GOOD, medium effort.** Parse per-parish |
| **NHS / public-health microsites** — `greenwich0to4.co.uk`, `bromley0to19.co.uk` | Greenwich + Bromley health visiting | `WebFetch` / `curl` | Clean HTML lists: clinic, venue, day, time (Bromley also postcodes). No JSON-LD | **GOOD.** Small, stable, high-trust |
| **Better / GLL library + leisure pages** | Greenwich (13 libraries), Bromley (14), most leisure centres, some children's centres | `WebFetch` + `curl` | Category landing pages carry **prose only — no branch, no day, no time**. Branch "what's on" pages are hand-curated cards that are **demonstrably out of sync** with the borough timetable (Beckenham shows zero under-5 events despite two weekly sessions). The only complete Bromley dataset lives in a **news article** URL | **WORST MAJOR SOURCE.** Largest free supply block, least published. Must be reconstructed from the news post + third parties |
| **LUCi by SOLUS** — `lewisham.events.mylibrary.digital` | Lewisham libraries | `WebFetch` OK; `curl` **403** | Real dated occurrences, stable `/event?id={n}` URLs, category filters (Children's, Families) | **GOOD data behind bot protection.** Needs browser-like client |
| **Happity** — `happity.co.uk` | The densest paid-class source; also many church halls list here | `WebFetch` **403**, `curl` **403** | Blocked to all server-side fetching | **RICH BUT CLOSED.** Requires a browser client or, better, a data partnership |
| **Bookwhen — OpenActive RPDE feeds** at `data.bookwhen.com` | Opt-in subset of Bookwhen providers (skews adult fitness; only 4 SE postcodes in a 1,250-record sample) | Direct feed fetch | **4 unauthenticated RPDE feeds, licensed CC-BY 4.0, near-real-time.** Models `SessionSeries` + `PartialSchedule` with `repeatFrequency:"P1W"`, `byDay`, **`exceptDate`**, `idTemplate`, and `ScheduledSession` occurrences carrying live `remainingAttendeeCapacity`. Also `beta:isWheelchairAccessible` (8% populated), `accessibilitySupport` (3%), `isAccessibleForFree` (4%) | **CORRECTED — THE ONLY LICENSED CROSS-PROVIDER FEED FOUND.** The best recurrence model surveyed anywhere. Weaknesses: **no pricing at all**, and `ageRange` is in years and only ~6% populated |
| Bookwhen — public booking pages `bookwhen.com/{slug}` | Same providers | `curl` + `.ics` with `Accept: text/calendar` | Page states *"Javascript must be enabled"*; schedule client-rendered; no JSON-LD; `.ics` → **406**; no sitemap or directory, so slugs must be discovered from provider sites | **Poor — but irrelevant now.** Use the RPDE feeds instead of the HTML |
| **Better/GLL OpenActive feed** — `better-admin.org.uk/api/openactive/better` | **GLL — which runs the Greenwich children's centres whose timetables are the best-structured under-5 data in this research**, plus Greenwich and Bromley libraries and all the leisure centres | Not yet fetched — **highest-priority follow-up** | Expected OpenActive RPDE | **POTENTIALLY THE SINGLE HIGHEST-VALUE UNCHECKED SOURCE IN THE WHOLE REPORT.** If it carries children's-centre and library sessions, it solves the Greenwich/Bromley gap outright |
| **Bromley Simply Connect API** — `bromley.simplyconnect.uk/api/activities` | Bromley borough directory | Direct | **`GET` → JSON, 1,679 records.** Carries `age_range` (band only: `0-5`), `cost_band`, gender, "Disability friendly" Y/N, postcode + 1–50 mile radius, `is_quality_assured` | **The only open council endpoint in the region.** Schedule is free text ("Recurs weekly on Wednesday") — no structured recurrence |
| **Eventbrite** | NCT Bromley & Chislehurst Baby Cafés; Orpington Library story time | — | Each session is a discrete event with structured data and a public API | **EXCELLENT where used** — but used by few under-5 organisers |
| **Issuu PDF** | Bromley Children Project (all 6 children's centres); The Family Grapevine toddler timetable | — | Monthly PDFs with the session grid **baked into page images**; no HTML, no stable per-month URL | **WORST CASE.** Needs OCR or human transcription |
| **PDF / JPEG timetables** | Lewisham Family Hubs; Southwark locality centres (1st Place, br-cc, dulwichwood, pprncfc) | `WebFetch` | Seasonal PDFs/images whose filenames change every term | **HARD.** Termly manual or OCR pipeline |
| **The Events Calendar (WordPress)** | Beckenham Place Park (`beckenhamplace.org/whatson/`) | — | List/month/week views, category filters, well-known REST API | **GOOD, standard plugin** — worth detecting generically across small venues |
| **Museum / theatre ticketing** | RMG, Horniman, Unicorn, Polka, Dulwich Picture Gallery, Museum of London Docklands | `curl` | Dated occurrences, **age filters, ages stated in months** (Unicorn: "6–18 months", "1–4"), booking links, schema.org present | **BEST STRUCTURED but smallest volume.** The part a generic event search already finds |
| **Facebook-only** | Bromley Parish Church Toddler Praise; Breastfeeding Network Southwark live updates; many church groups | — | Recurring-event data effectively inaccessible without Graph API access | **INACCESSIBLE at scale** |
| **Council FIS / Local Offer directories** | Greenwich Community Directory (kb5/Idox — root now **301s in a redirect loop** with royalgreenwich.gov.uk), Southwark FID (slugs under `…-unpublished/`), Bromley `/directory/44/`, Simply Connect Bromley (has a **0–5 age filter**), Lewisham Local Offer under-5s (clean HTML) | `WebFetch` | Services, rarely dated sessions; unstable URL patterns | **MIXED.** Good for discovering organisations, poor for sessions |

**Additional platforms confirmed by the provider harvest**

| Platform | Who uses it | Machine-readable? | Verdict |
|---|---|---|---|
| **ClassForKids** (`classforkids.io`) | 25+ named SE London providers, each on a `{slug}.classforkids.io` subdomain | Directory pages **server-rendered**, sitemap index (9 children), robots blocks only `/iframe/*`, **no AI block**. Provider subdomains themselves are JS-rendered | **BEST TARGET for paid classes.** Scrape the *directory*, not the provider subdomains. `class4kids.co.uk` 301s to `classforkids.io`. See the slug warning immediately below |
| **Hoop** (`hoop.co.uk`) | Lewisham, Southwark, Bromley, Tower Hamlets | Sitemap index, robots `Allow: /`, no AI block, no public API | **Viable.** Note Greenwich is empty |
| **Pebble** (`bookpebble.co.uk`) | Baby Sensory Southwark and others | Sitemap + permissive robots, **but listing pages are client-rendered** | Needs headless browser or internal JSON endpoint |
| **iClassPro / Acuity / BookMyClass / ThinkSmart / Book That In / Franscape / WOW World Group** | Synergy Gymnastics, Little Crocs, Sing and Sign, Tappy Toes, Tots Play, Baby College, Baby Sensory | Mostly JS-rendered, no public feeds | **Long tail — not worth individual integration.** Reach them via ClassForKids/Happity/provider pages |
| **Outpost** (open-source LA directory, Drupal) | Greenwich Community Directory | No sitemap declared, no API surfaced, no AI block | **Most promising route to a structured export** — being open-source, an export or DB view can be requested from the FIS team |
| **Issuu** | Bromley Children & Family Centres (monthly), Families SE London (bi-monthly), The Family Grapevine | Flipbook; text baked into page images | **Effectively unextractable.** Ask for source files |

> ### ⚠ ClassForKids slug trap — this will silently poison the index
>
> ClassForKids area slugs are geographically ambiguous. Several SE London place names resolve to **completely different parts of the country**:
>
> | Slug you would guess | What it actually returns |
> |---|---|
> | `/classes/blackheath` | Blackheath near **Guildford, Surrey** |
> | `/classes/deptford` | **Wiltshire** |
> | `/classes/new-cross` | **Somerset** |
> | `/classes/sydenham` | **Somerset** |
> | `/classes/charlton` | **West Sussex** |
> | `/classes/south-bromley` | **Bromley-by-Bow, E14/E15** — not BR |
>
> **The correct SE London slugs are:** `greenwich`, `blackheath-park`, `woolwich`, `eltham`, `lewisham`, `catford`, `peckham`, `dulwich`, `bermondsey`, `rotherhithe`, `bromley`, `beckenham`, `orpington`, `millwall`, `canary-wharf`.
>
> **Validate every ingested row by postcode prefix, never by slug.** This rule generalises: any place-name-keyed third-party source needs a postcode assertion before the record is trusted.

**Other currency corrections found during the provider harvest**
- **Woolwich Waves (SE18 6EU) has replaced Waterfront Leisure Centre.** Older round-ups (and the Mumsnet thread cited in §1.1) still name the Waterfront — suppress it.
- **Horniman's "Under the Sea" soft play ended September 2023.** Still cited in blog round-ups.
- **RMG's "Cutty Sark Toddler Time" is now "Ship Mates."** Both names are in circulation.
- **Puddle Ducks' "Dulwich Cranbrook" pool is in Cranbrook, Kent** — only Orpington BR6 7QA is genuinely in the patch.
- Two live franchises are **advertised for sale** (Toddler Sense Greenwich, Busylizzy Greenwich & Blackheath) — elevated churn risk.
- **Little Splodgers'** newest dated content is 2023; **Sing and Sign Southwark's** page still references an "April 2025 term". Both need trading-status confirmation.

**Recommended ingestion tiers**
1. **Tier 1 — automate now (high yield, low effort):** ChurchSuite JSON, The Play Map, **ClassForKids directory** (with the postcode assertion above), **Greenwich Community Directory sitemap**, **Quaggy's public Google Calendar ICS**, Better children's-centre timetables, Southwark library page, Bromley library news post, `greenwich0to4` / `bromley0to19`, **Hoop**, Eventbrite, Bookwhen per-provider iCal, museum/theatre what's-on, The Events Calendar sites, Greenwich Wire RSS.
2. **Tier 2 — needs a headless browser:** Lewisham LUCi, Pebble, Bookwhen, Dulwich Picture Gallery, Better branch pages. **Happity is excluded — it forbids AI crawling in robots.txt; pursue a partnership instead.**
3. **Tier 3 — human/OCR, refresh termly:** Issuu PDFs, family-hub PDF/JPEG timetables, Facebook-only groups, church sites with no platform.
4. **Tier 4 — partnership or community submission:** the long tail of church and community-hall groups. A "submit a group" form plus a termly verification email to organisers is likely cheaper and more accurate than any crawler. The Play Map's own "Amend playgroup information" link on every card shows this model works.

---

### 3.9 Two strategic findings from the source universe

**(a) Booking-platform split across the ~90 verified SE London under-5 providers**

| Platform class | Share | Implication |
|---|---|---|
| Proprietary franchise systems (WOW World Group for Baby Sensory/Toddler Sense, Monkey Music, Hartbeeps, Water Babies, Puddle Ducks, Turtle Tots, diddi dance, Rugbytots, Little Kickers, babyballet, Gymboree, Aquatots) | **~40%** | Each needs bespoke handling; most are JS-rendered. **Low priority — high effort per provider** |
| **ClassForKids** | **~30%** | **The single best machine-readable surface available.** One integration reaches a third of the market |
| Happity (blocked), Bookwhen (OpenActive feeds), iClassPro, BookMyClass/Zebranet, ThinkSmart, Franscape, Acuity, Book That In, own-site forms | ~30% | Long tail |

Notably, **zero Pebble and zero Eventbrite usage was found among verified SE London under-5 *class providers*** — though both appear at the *institutional* layer (NCT Bromley's Baby Cafés and Orpington Library's story time are on Eventbrite). Eventbrite is an institutional channel here, not a provider channel.

**(b) Greenwich is genuinely unserved — and that is the commercial opening**

The evidence converges from five independent directions:
- **Hoop's Greenwich region is empty** ("This region has no activities currently listed") while Lewisham, Southwark, Bromley and Tower Hamlets are populated.
- **GreenwichMums is abandoned** (newest article July 2024) yet still holds the most complete published record of the borough's library rhyme times.
- **Better/GLL publishes no borough-level timetable** for Greenwich at all, and its branch pages disagree with the council directory.
- **No Mumbler franchise exists** anywhere in SE London — an open territory.
- **The independent local blog scene has collapsed**: Brockley Central (last post Aug 2018), The Deptford Dame (Feb 2022), Isle of Dogs Life (Jun 2025), and the South London Press closed in August 2026 after 160 years. The Greenwich Wire's RSS feed is the last reliably-updating independent outlet in the patch — and it has no what's-on section.

Against that vacuum sits the **Greenwich Community Directory's ~450 under-5 records** — the richest structured dataset in the borough set, sitting behind broken pretty-URLs on an open-source platform. **Greenwich is simultaneously the worst-served borough and the one with the best available raw data.** That is the highest-leverage place to start.

---

## 4. Competitive / comparative analysis

### 4.1 The comparison

| Platform | Coverage | Taxonomy depth | Age granularity | Recurring handling | Signals captured | Machine-readable? | What it gets right that generic AI event search misses |
|---|---|---|---|---|---|---|---|
| **Happity** | UK-wide; the dominant baby/toddler class platform. Area pages per borough *and* per postcode district (`/se13-5bu/`, `/greenwich-se10/`, `/petts-wood/`) | **Deepest of any platform.** Category URLs `/{area}/c/{category}` observed for: baby-led weaning, antenatal, gym & gymnastics, baby yoga, dance, soft play, plus music, sensory, swimming, signing, massage, postnatal fitness, first aid, sleep | Age ranges per class; classes indexed by stage (bump / baby / toddler) | Native — classes are **weekly term-time series with a per-week timetable**, sold as blocks | Venue, day/time, price, provider, booking, online-vs-in-person, map + distance | **No, and deliberately so.** HTTP 403 to every method tried; robots.txt sets `Content-Signal: ai-train=no` and `Disallow: /` for ClaudeBot, GPTBot, CCBot, Google-Extended, Bytespider and meta-externalagent | It is built around *classes*, not events. Search is postcode-first and timetable-shaped. It indexes church halls and community centres, which no events platform does. **Partnership target, never a scrape target** |
| **ClassForKids** | UK; area pages for every SE borough | Category filter incl. `baby-and-toddler` | **Exact age ranges per class** | Provider schedules, weekly | Provider, venue + postcode, category, age range, booking subdomain | **Best available.** Server-rendered, sitemapped, robots blocks only `/iframe/*`, no AI block | The single most ingestible structured source of *paid* SE London under-5 classes |
| **The Play Map** | 32 London boroughs + 8 counties. **Free stay-and-play only** | Narrow but exactly right for the free tier | Occasional explicit months ("10–36 months"); tags **Baby Only Group** | Native — every listing *is* a weekly recurrence (day + time) | Name, full address + postcode, day(s), start/end, organiser link, sometimes cost, **SEN Group / Dad-Male-Carer / Young Parents / Outdoors / Afternoon** tags | **Yes** — server-rendered HTML | Captures the *church and community hall* layer that is invisible everywhere else, and tags the two most under-served audiences (dads, SEND) as first-class filters |
| **Hoop** | **Still operating** — closed 2020, relaunched 22 Jun 2023, now Hoop Health Ltd (© 2026). Lewisham, Southwark, Bromley and Tower Hamlets pages populated; **Greenwich is empty** ("This region has no activities currently listed") | Broad "things to do" categories | Age filtering is its distinguishing feature | Dated, timed activities by borough | Age, date, time, price, distance, organiser | **Yes** — sitemap index, robots `Allow: /`, no AI block, no public API | Age-first filtering — the single most important under-5 filter. Its Greenwich gap is a direct opening |
| **Netmums** | Borough-level boards | None (unstructured) | None | None | Free text | **Unresolved** — hard fetcher-level block | **Trust and recency via peer recommendation.** Threads are where parents validate that a group is still running |
| **Mumsnet Local** | **RETIRED** — `/local` 404s; the live homepage has no Local section (Mumsnet is now topic-organised) | — | — | — | — | — | **Do not build against it.** Topic threads remain valuable as evidence, but there is no local listings product |
| **Kidadl** | National, editorial | Editorial round-ups ("best things to do with toddlers in…") | Loose age bands in prose | Poor — evergreen articles, not dated | Prose only | Partially (article scraping) | SEO-shaped inspiration, not a live index. Structurally similar to what a generic AI event search produces — and shares its failure mode |
| **Peanut** | National, social | Not a listings product | N/A | N/A | Social meetups | No | Peer connection, not discovery of provision |
| **Toddle About** | Regional UK incl. London | Kids activities, advice, childcare, days out, health, parties | Age ranges (0–4 prominent) | Directory + filters for day/time/availability | Distance, age range, **ratings/reviews**, address, online vs face-to-face | Partially | Reviews — a trust signal absent from all council sources |
| **London for Toddlers (`toddlerldn.com`)** | London, under-5 specific | Places (farms, museums, parks, playgrounds, soft play, theatres, playcafés) + events + guides | "All ages"/age suitability | Places (opening hours) + monthly events | Price, opening times, address, transport links, dog policy | Partially | Explicitly under-5 framed, and mixes *places* with *events* — which matches how parents actually plan |
| **Council FIS / Local Offer** (Greenwich Community Directory, Southwark FID, Bromley directory, Simply Connect Bromley, Lewisham Local Offer) | Borough | Service categories; **Simply Connect Bromley has a 0–5 age filter** | Age bands on some | Poor — services, not sessions | Contact details, address, eligibility, SEND flags | Mixed; unstable URLs | Authoritative and free-tier-complete; carries SEND eligibility that no commercial platform has |
| **Museum / theatre what's-on** (RMG, Unicorn, Polka, Dulwich Picture Gallery, Horniman) | Venue-level | Rich, with audience filters | **Best in class — ages in months** (Unicorn: "6–18 months", "1–4"; DPG ArtPlay: 0–2yrs) | Both — seasonal runs *and* weekly drop-ins | Dated occurrences, price, booking, **relaxed/sensory performance flags**, access info | **Yes** — schema.org, age-sliced URLs | Precision. This is the one part of the corpus already fit to ingest |
| **A generic "family-friendly London events" AI search** (the current system) | London-wide | Shallow: events, festivals, exhibitions | Usually "family" or "kids" — no under-5 distinction | **None** — dated events only | Title, date, venue, sometimes price | N/A | *Nothing.* It systematically returns the 3% of the corpus that is one-off, ticketed and pitched at 5–12s |

### 4.2 The signal inventory — what the specialists capture that a generic event search does not

Every one of these is a field an under-5 parent actively filters on, and none appears in a typical "family events" result:

**Age and stage**
- Minimum and maximum age **in months**, not years (the difference between 6 months and 18 months is decisive)
- Stage labels: bump / newborn / pre-crawling / crawling / walking / pre-school
- Baby-only vs mixed-age sessions (a non-mobile baby in a room of running three-year-olds is a bad experience)

**Cost and commitment**
- Free vs donation vs pay-as-you-go vs **term block** — a £120 termly block and a £2 drop-in are not comparable products
- Whether siblings are charged; whether under-1s are free
- Trial/taster session availability

**Booking and access mechanics**
- **Drop-in vs must-book** — the single most consulted field for a parent with an unpredictable nap schedule
- Booking platform and whether a place is likely to be available
- Waiting-list status (routine for swimming)

**Physical access**
- Step-free access and **buggy parking** (where do 20 prams go?)
- Lift vs stairs to the hall
- Changing facilities; **breastfeeding-friendly**
- Whether there is somewhere to warm a bottle / a kettle
- Parking, and walkability from home — under-5 catchment is measured in **hundreds of metres**, not miles

**Suitability and inclusion**
- **SEND-friendly / quiet / low-sensory / relaxed performance**
- Dad and male-carer focused
- Multiple-birth, young-parent, single-parent, language-specific groups
- Whether a snack is provided

**Temporal reality**
- **Term-time only vs all-year** — the field that decides whether a listing is true in August
- Start and end time (not just start — "how long do I need to fill?")
- Recurrence rule and validity window
- Cancellations and one-week closures

**Trust**
- Last-verified date; who verified it
- Peer reviews / "still running?" confirmations
- Whether the organiser is the source

### 4.3 What this implies

The specialists' advantage is not better crawling — it is a **different unit of record**. Happity, the Play Map and Toddle About model a *weekly class or group*; Kidadl and generic event search model an *article or a ticketed event*. The current GPC system shares the losing model, which is why it returns museums and festivals.

The three cheapest high-impact moves visible from this comparison:
1. **Adopt the class/session record** with age-in-months, term-time flag and drop-in flag as required fields (§5.1).
2. **Steal the Play Map's tag vocabulary wholesale** — SEN, baby-only, dad/male-carer, young-parent, outdoors, afternoon. It is small, it is exactly what the audience filters on, and it is already populated for ~106 local groups.
3. **Copy the museum sector's age precision.** Unicorn's `/age/0-2` URL and "for ages 6–18 months" copy is the standard the rest of the index should be normalised to.


## 5. Proposed "quality event" definition and scoring rubric

### 5.1 First, fix the data model

No scoring rubric can rescue the wrong primitive. The rubric below assumes the object being scored is an **Activity** with an optional **Occurrence** set, not an "event":

```
Activity
  id, title, organiser, venue{name, address, postcode, lat, lon}
  schedule: [ {rrule|freeform_day, start_time, end_time} ]
  validity: {starts_on, ends_on, term_time_only: bool, school_holidays_only: bool}
  age: {min_months, max_months}
  price: {type: free|donation|per_session|block|membership, amount, currency}
  booking: {mode: drop_in|book_ahead|waitlist|closed, url, platform}
  access: {step_free, buggy_parking, breastfeeding_friendly, changing_facilities,
           send_friendly, dad_carer_focus, quiet_low_sensory}
  provenance: {source_url, deep_link, last_verified_at, verification_method, confidence}
Occurrence  (generated from schedule × validity × term calendar; or ingested directly)
  activity_id, starts_at, ends_at, status: scheduled|cancelled|full
```

**Term-time and age-in-months are mandatory fields, not optional enrichment.** Everything else follows from them.

### 5.2 Hard gates (a listing failing ANY gate is not publishable)

These are pass/fail, evaluated before scoring. Automated, deterministic.

| # | Gate | Test | Rationale |
|---|---|---|---|
| G1 | **Real, resolvable occurrence** | The activity yields ≥1 occurrence in the requested window after applying term-time and validity rules. For recurring activities this is *computed*, not scraped. | Prevents "this happens sometimes" listings |
| G2 | **Working deep link** | `deep_link` returns HTTP 200 (following ≤2 redirects) within 10s, and resolves to a page whose text contains the activity title OR the venue name. Not just the site homepage. | Kills the single most common failure: linking to a homepage or a dead page |
| G3 | **Locatable venue** | A valid UK postcode that geocodes, AND falls inside the served polygon (Greenwich, Lewisham, Southwark, Bromley, Tower Hamlets E14/E3/E1W, or ≤ configured radius of the user's postcode) | Prevents "family day out in Kew" appearing for a Woolwich parent |
| G4 | **Explicit under-5 suitability** | `age.min_months ≤ 60` AND (`age.max_months ≤ 84` OR the source explicitly labels it under-5 / pre-school / baby / toddler). A listing with no age data at all fails unless the category is inherently under-5 (rhyme time, stay & play, baby massage). | The core defect being fixed: 5–12 content leaking in |
| G5 | **Not-a-duplicate** | No other published activity with the same normalised (title, venue postcode, day-of-week, start_time) | Aggregators + source sites double-count heavily |
| G6 | **Currency** | `last_verified_at` within 120 days for recurring activities; within 30 days for one-off events. Source not on the suppression list (closed venues). | Guards against Dulwich Library-style stale listings |
| G7 | **Not term-time-violating** | If `term_time_only` is true, no occurrence is emitted inside the relevant borough's school holiday dates | In August this alone removes ~72% of library sessions |

### 5.3 Weighted quality score (0–100), applied to listings that pass all gates

Score determines ranking and whether a listing is "featured", "listed", or "listed with caveat".

| Signal | Weight | Scoring rule |
|---|---|---|
| **Age precision** | 15 | 15 = explicit min/max in months (e.g. "6–18 months"); 10 = explicit year range ("0–4 years"); 5 = category-inferred; 0 = absent (also fails G4) |
| **Price clarity** | 14 | 14 = exact amount or explicitly "Free"; 10 = "donation"/"£1 suggested"; 6 = "from £X"; 0 = unstated |
| **Booking clarity** | 12 | 12 = `drop_in, no booking` stated, OR a working booking URL; 6 = "contact to book" with an email/phone; 0 = unknown |
| **Schedule precision** | 12 | 12 = day + start + end time + recurrence rule + validity window; 8 = day + start time; 4 = day only; 0 = "weekly" |
| **Proximity / walkability** | 12 | 12 = ≤0.8 mi (walkable with a buggy); 8 = ≤1.5 mi; 4 = ≤3 mi; 0 = beyond. *Distance matters far more for under-5s than for older children* |
| **Source authority** | 10 | 10 = organiser's own site or the operating council/NHS body; 7 = a booking platform (Eventbrite/Bookwhen/Class4Kids/ChurchSuite/Happity); 4 = a curated third-party directory; 1 = a social post |
| **Access & inclusion metadata** | 10 | 2 points each for: step-free/buggy access, buggy parking, breastfeeding friendly, changing facilities, SEND/quiet-friendly |
| **Freshness** | 8 | 8 = verified ≤30 days; 5 = ≤90 days; 2 = ≤120 days; 0 = older (also fails G6) |
| **Description usefulness** | 7 | 7 = says what actually happens (songs, messy play, snack, sensory); 3 = generic; 0 = title only |

**Publication thresholds**
- **≥70** — featured / eligible for "top picks" and notifications
- **50–69** — listed normally
- **35–49** — listed with a "details unconfirmed — check before you go" caveat
- **<35** — held for enrichment, not shown

### 5.4 Category-specific bonuses and penalties

| Modifier | Adjustment | Reason |
|---|---|---|
| Free AND drop-in AND within 0.8 mi | **+10** | This is the single most-wanted combination for the audience |
| Recurring weekly (vs one-off) | **+5** | Recurring has repeat value; a parent can build a week around it |
| Dad/male-carer, SEND-inclusive, multiple-birth, or young-parent focus | **+8** | Severe under-supply; high user value per listing |
| Under-5-only session (not a general family session) | **+5** | Signals genuine age fit |
| Requires block/term booking with no drop-in option | **−5** | High commitment barrier; less useful as "what's on this week" |
| Age range extends beyond 8 years | **−10** | Strong signal it is really a 5–12 activity |
| Source is a social post with no website | **−8** | Unverifiable, decays fast |
| Venue outside served boroughs but within radius | **−5** | Still useful, ranked lower |

### 5.5 Automated red-flag detector (anti-patterns to reject outright)

Regex/classifier rules that should force a fail regardless of score — these encode the exact failure mode described in the brief:

1. Title or description matches `\b(?:5|6|7|8|9|1[0-6])\s*[-–]\s*1[0-8]\b` years without a separate under-5 offering
2. Category is `exhibition|gig|comedy|adult workshop|talk|lecture|screening` with no explicit under-5 element
3. Description contains "suitable for ages 7+", "KS1", "KS2", "school age", "primary school children" and no under-5 alternative
4. Venue is a general "family attraction" with no dated, age-scoped session (e.g. a museum's opening hours dressed up as an event)
5. Deep link host ≠ organiser host AND is a ticket-reseller aggregator with no session detail
6. Same title appears at >5 venues on the same day with identical text — franchise spam or scraped duplicate
7. The occurrence date falls in a school holiday and `term_time_only` is unset **and** the source category is library/church/children's centre → force to "unconfirmed" rather than publish

### 5.6 Worked examples against the rubric

| Candidate | Gates | Score | Verdict |
|---|---|---|---|
| *Rhymetime, Peckham Library, Fri 10:30–11:00, term time, free, no booking* | All pass | ~88 (free+drop-in+walkable bonus, exact schedule, authoritative council source) | **Featured** |
| *Ship Mates, Cutty Sark, Wed 10:00–11:30, £5/adult, booking essential, under-5s* | All pass | ~72 | **Featured** — dated, structured, age-scoped |
| *Toddler Praise, Bromley Parish Church, Tue, Facebook page only* | G2 borderline, G6 risk | ~42 (social-only penalty, no price, no end time) | **Listed with caveat** |
| *"Family Fun Day, South Bank" — ages 4–12, one-off* | **Fails G4** | — | **Rejected** — the exact class of listing the current system over-produces |
| *Bookstart, Blue Anchor Library, Mon 10:00, term time only — evaluated on 2026-08-11* | **Fails G7** | — | **Suppressed until September** |

### 5.7 Coverage metric (measure the system, not just the listing)

Listing-level quality is necessary but not sufficient. Track two system-level metrics:

- **Recurring share** — % of published activities that are weekly recurring. Target **≥75%**. If this drops toward the current ~10–20%, the system has regressed to being an events search.
- **Free share** and **walkable share** — % free, and % within 0.8 mi of the median user postcode per borough. Under-5 provision is genuinely mostly free and local; if the index does not look like that, it is mis-sampling the universe.
- **Borough balance** — no borough should have <10% of the index if it has comparable population; a skew signals a source gap, not a supply gap.

---

## 6. Bibliography

All URLs accessed **2026-08-11** unless otherwise stated. Fetch outcome noted where it bears on machine-readability.

### Council, library and family-hub sources
1. Southwark Council — *Story, music and play sessions* (library under-5 timetable). `https://www.southwark.gov.uk/culture-and-sport/libraries/library-activities-babies-and-toddlers/story-music-and-play-sessions` — fetched OK. **Primary evidence for §2.2(a).**
2. Southwark Council — *Library activities for under 5s*. `https://services.southwark.gov.uk/libraries/babies-and-children/library-activities-for-under-5s`
3. Southwark Council — *Canada Water Library*, *Peckham Library* branch pages. `https://www.southwark.gov.uk/culture-and-sport/libraries/find-library/…`
4. Southwark Council — *Children and family centres*. `https://www.southwark.gov.uk/children-young-people-and-families/parenting/children-and-family-centres` — fetched; defers to "Find a hub near you".
5. Southwark Council — *Early Help: Children and Family Centres*. `https://www.southwark.gov.uk/childcare-and-parenting/children-s-social-care/family-early-help-feh/children-and-family-centres`
6. Southwark Council — *Family Information Directory*. `https://www.southwark.gov.uk/children-young-people-and-families/family-information-directory`
7. Southwark Local Offer. `https://localoffer.southwark.gov.uk/`
8. Better / GLL — *Baby Rhyme Time & Story Time, Greenwich Libraries*. `https://www.better.org.uk/library/london/greenwich/events-and-activities/rhyme-time` — fetched; **no branch names, days or times published**. Evidence for §3.0(c).
9. Better / GLL — *Baby Rhyme Time & Story Time, Bromley Libraries*. `https://www.better.org.uk/library/london/bromley/events-and-activities/rhyme-time` — same failure mode.
10. Better / GLL — *What's on in Bromley Libraries* (news post). `https://www.better.org.uk/library/news/what-s-on-in-bromley-libraries` — fetched OK via browser UA; **contains the full Baby Rhyme Time and Story Time grid** with per-branch phone/email, term-time flags, and an Eventbrite note for Orpington. The canonical Bromley timetable, published in a news article.
11. Better / GLL — Bromley branch what's-on pages (Central/Pavilion, Beckenham, Penge, St Paul's Cray, Shortlands, Southborough). Beckenham verified as **out of sync** with the borough timetable.
12. Better / GLL — *Kids' Activities & Games Clubs, Greenwich Libraries*. `https://www.better.org.uk/library/london/greenwich/events-and-activities/childrens-activities`
13. Better / GLL — Greenwich and Bromley library landing pages. `https://www.better.org.uk/library/london/greenwich`, `/bromley` — fetched; **branch lists not exposed**.
14. Lewisham Libraries events (LUCi by SOLUS). `https://libraries.lewisham.gov.uk/events` and `https://lewisham.events.mylibrary.digital/event?id={n}` — WebFetch OK, `curl` **403**.
15. Lewisham Council — *Local Offer: Under 5s*. `https://lewisham.gov.uk/myservices/children-and-young-people-service/local-offer/activities-and-events/under-5s` — fetched OK; named list incl. SEND provision.
16. Lewisham Family Hubs — *Activities and timetables*. `https://lewishamfamilyhubs.org.uk/p/activities-and-timetables` — fetched; **PDF + JPEG timetables**; booking at `/events`.
17. Lewisham Family Hubs — Summer timetable PDF. `https://lewishamfamilyhubs.org.uk/assets/519a225a/final_draft_summer_timetable_lnb_-_31.07.26.pdf`
18. Lewisham Family Hubs — *Changes to our Stay & Plays* (naming of Stay & Play vs Baby Stay & Play from 6 Jan 2025).
19. Lewisham Children & Family Centre / Early Years Alliance. `https://www.lewishamcfc.org.uk/` — fetched; now redirects users to Lewisham Family Hubs. `/timetable/` and `/bookings-and-timetable/` both returned **404** — stale link rot.
20. Lewisham Council — *Family Hubs*. `https://lewisham.gov.uk/myservices/children-and-families-information-service/family-hubs/lewisham-family-hubs`
21. Royal Borough of Greenwich — *Children's centres directory*. `https://www.royalgreenwich.gov.uk/directory/15/childrens_centres` — fetched; 10 named centres with `/directory_record/{id}/` pattern.
22. Greenwich Community Directory. `https://greenwichcommunitydirectory.org.uk/children-and-families` — **301 redirect to `royalgreenwich.gov.uk/children-young-people-and-families`, which links back to the directory: a circular reference.** Deep `kb5/greenwich/directory/results.action` URLs still resolve.
23. Royal Borough of Greenwich — *Children, young people and families*. `https://www.royalgreenwich.gov.uk/children-young-people-and-families`
24. Bromley Council — *Children and Family Centres*. `https://www.bromley.gov.uk/ChildrenAndFamilyCentres`; six centre directory records under `/directory-record/{id}/`.
25. Bromley Children Project timetables on Issuu. `https://issuu.com/bromleychildrenproject` — **PDF/image only**.
26. Bromley Council — *Directory of parent and toddler groups*. `https://www.bromley.gov.uk/directory/44/directory-of-parent-and-toddler-groups`
27. Simply Connect Bromley. `https://bromley.simplyconnect.uk/` — has a 0–5 age filter.
28. Tower Hamlets — South East Locality family hub timetable (DOCX). `https://www.towerhamlets.gov.uk/Documents/Children-and-families-services/Early_help/Children-and-family-hubs/South-East-locality-timetable.docx`

### Health and support
29. Greenwich 0 to 4 — *Well Baby Clinics*. `https://www.greenwich0to4.co.uk/clinics/well-baby-clinics` — fetched OK; 8 clinics/week with day + time. Clean HTML.
30. Greenwich 0 to 4 — *Infant Feeding clinics*. `https://www.greenwich0to4.co.uk/clinics/infant-feeding-clinics`
31. Bromley 0 to 19 — *Well Baby clinics*. `https://www.bromley0to19.co.uk/0-4-years/well-baby-clinics` — fetched OK; venue, day, time, postcode.
32. Bromley 0 to 19 — *Infant Feeding clinics*. `https://www.bromley0to19.co.uk/0-4-years/infant-feeding-clinics`
33. Lewisham and Greenwich NHS Trust — *Breastfeeding*. `https://www.lewishamandgreenwich.nhs.uk/breastfeeding/`; *Health Visiting* `…/health-visiting-ks/`; *Baby Hubs* `https://myhv.lgt.nhs.uk/page/baby-hubs/`
34. Evelina London — community breastfeeding support (Southwark drop-ins). `https://www.evelinalondon.nhs.uk/our-services/community/breastfeeding/overview.aspx`
35. Breastfeeding Network Southwark. `https://localoffer.southwark.gov.uk/health-and-wellbeing/universal-health-services/breastfeeding-support-group/`
36. Royal Borough of Greenwich — *Best start in life: feeding advice*. `https://www.royalgreenwich.gov.uk/children-young-people-and-families/parenting-and-family-support/best-start-in-life/feeding-advice`
37. Lewisham Talking Therapies — perinatal. `https://lewishamtalkingtherapies.nhs.uk/who-we-help/perinatal/`
38. Mindful Mums (South East London Mind, Bromley/Lewisham/Greenwich) — via Lewisham Family Hubs Facebook post. `https://www.facebook.com/familyhubslewisham/posts/…`
39. NCT Bromley & Chislehurst. `https://www.nct.org.uk/local-activities-meet-ups/bromley-and-chislehurst` — Baby Cafés ticketed individually on **Eventbrite**.
40. Home-Start Greenwich — *Children's Centres*. `https://homestartgreenwich.org.uk/childrens-centres/`

### Statutory / policy taxonomy
41. DfE & DHSC — *Family Hubs and Start for Life programme guide* (Aug 2022). `https://assets.publishing.service.gov.uk/media/62f0ef83e90e07142da01845/Family_Hubs_and_Start_for_Life_programme_guide.pdf`
42. DfE & DHSC — *Family Hubs and Start for Life programme guide 2025–26* (Feb 2025). `https://assets.publishing.service.gov.uk/media/67cacd6ba175f08d198d80c1/Family_Hubs_and_Start_for_Life_programme_guide_2025-26.pdf`
43. DfE — *Annex F: family hub service expectations*. `https://assets.publishing.service.gov.uk/media/62f0e6f58fa8f5033718e2a7/Annex_F_-_family_hub_service_expectations.pdf`

### Aggregators, directories and booking platforms
44. **The Play Map** — borough stay-and-play registers. `https://www.theplaymap.co.uk/playgroups/stay-and-play-in-{lewisham|greenwich|southwark|bromley|tower-hamlets}` — all fetched **HTTP 200, server-rendered HTML**, ~1.7–1.9 MB each. **Primary evidence for §3.1** (~106 named groups). Site-wide caveat quoted: *"Most playgroups will be term time only and some will require pre-booking or a fee/donation."*
45. **ChurchSuite public calendar JSON** — `https://stlukesmillwall.churchsuite.com/embed/calendar/json?merge=1` (41 events), `https://citygatechurch.churchsuite.com/…` (30), `https://stjohnsblackheath.churchsuite.com/…` (2). All **HTTP 200, unauthenticated**. Primary evidence for §3.0(b). 7 of 10 probed slugs returned 302 (no account).
46. Bookwhen — `https://bookwhen.com/thevillagelondon` (JS-required, no JSON-LD; `.ics` → **406**); `https://bookwhen.com/diddydinos` (**404**, dead link in the Play Map data).
47. **Happity** — `https://www.happity.co.uk/greenwich-lewisham/baby-toddler-classes`, `/london/baby-toddler-classes`, `/about`, and borough pages. **All returned HTTP 403 to both WebFetch and curl.** Category structure inferred from indexed URL patterns: `/{area}/c/{category}` with categories including baby-led-weaning, antenatal, gym-gymnastics, baby-yoga, dance, soft-play.
48. Happity Help Centre — *Pricing baby & toddler classes*. `https://support.happity.co.uk/en/articles/4519498-pricing-baby-toddler-classes` — block/term pricing model.
49. A Church Near You (Church of England). `https://www.achurchnearyou.com/` — church pages carry **schema.org `Church` JSON-LD** with postcode and geo. `/api/search/` → 404.
50. Diocese of Southwark — *Find a church*. `https://southwark.anglican.org/find-a-church/`
51. Toddle About — London mums-and-tots groups. `https://www.toddleabout.co.uk/near-me/london/mums-and-tots-groups` — fetched; age ranges, distance, ratings, day/time filters.
52. London for Toddlers (`toddlerldn.com`) — e.g. `https://www.toddlerldn.com/places/surrey-docks-farm`, `/places/mudchute-farm`. Places + events + guides; age suitability and price fields.
53. Pebble — `https://activities.bookpebble.co.uk/activities/parent-and-baby-toddler/near-lewisham`
54. MyBump2Baby — London baby & toddler groups directory. `https://www.mybump2baby.com/directories/baby-and-toddler-groups/london-baby-and-toddler-groups/`
55. Soft Play Finder — Greater London. `https://softplayfinder.co.uk/location/greater-london/london/`
56. What's On In Bromley — family & kids. `https://www.whatsoninbromley.com/family-kids-activities/`
57. The Family Grapevine Bromley. `https://thefamilygrapevine.co.uk/bromley/directory/baby-and-toddler-groups/`

### Cultural venues with under-5 programmes
58. Royal Museums Greenwich — *Cutty Sark Toddler Time* (transitioning to **Ship Mates**). `https://www.rmg.co.uk/whats-on/cutty-sark/cutty-sark-toddler-time` — term-time Wednesdays, £5/adult, members free, booking essential.
59. Horniman Museum — *What's On*. `https://www.horniman.ac.uk/whats-on/` — age filters "Children 2+", "Children 3+", "Children 0–11"; under-5 sessions not surfaced on the overview page.
60. Unicorn Theatre — age-sliced listings. `https://www.unicorntheatre.com/age/0-2` — verified: filters Ages 0–3 / 4–7 / 8–13; **ages stated in months** (Home Song 6–18 months; Huddle 1–4; Creatures 3–6).
61. Unicorn Theatre — *Accessible performance information* (relaxed performances). `https://www.unicorntheatre.com/accessible-performance-information`
62. Polka Theatre — *Drop-in Sessions* (0 months–5 years, Fridays 09:45–10:30). `https://polkatheatre.com/take-part/drop-in-sessions/`; *Relaxed Performances* `https://polkatheatre.com/relaxed-performances-at-polka-find-out-more/`; *Weekly Clubs* `https://polkatheatre.com/take-part/weekly-clubs/`
63. The Albany, Deptford. `https://www.thealbany.org.uk/visit/venues/the-albany`
64. Dulwich Picture Gallery — *ArtPlay Pavilion* (0–2yrs, Sat 11:00 & Wed 15:00) `https://www.dulwichpicturegallery.org.uk/visit-us/artplay-pavilion/`; *Mini Masterpieces* `…/whats-on/mini-masterpieces/`
65. Beckenham Place Park — *What's On*. `https://beckenhamplace.org/whatson/` — runs **The Events Calendar**.
66. Mudchute Park and Farm — children's services. `https://www.mudchute.org/childrens-young-people-services`
67. Surrey Docks Farm. `https://www.surreydocksfarm.org.uk/`
68. Woodlands Farm Welling — *Toddler Club*, via Visit Greenwich. `https://www.visitgreenwich.org.uk/whats-on/toddler-club-at-woodlands-farm-p1855471`
69. Churchill Theatre Bromley (Trafalgar Tickets). `https://trafalgartickets.com/churchill-theatre-bromley/en-GB`

### Parent-voice evidence (demand)
70. **Mumsnet — *How do you find baby and toddler activities in London?*** `https://www.mumsnet.com/talk/_chat/5505524-how-do-you-find-baby-and-toddler-activities-in-london` — fetched OK. **The single best statement of the problem.** OP: *"Everything is scattered across all manner of websites, Instagram, blog posts"*; *"slightly lose the will to scroll."* Replies name Happity ("searchable by postcode"), local Facebook groups, museum mailing lists, library story/rhyme time, children's centres and church toddler groups.
71. Mumsnet Local — *Fun Baby Classes/Activities in Greenwich area?* `https://www.mumsnet.com/talk/local/980536-Fun-Baby-Classes-Activities-in-Greenwich-area` — fetched OK. Names St Marks West Greenwich, The Arches soft play, Boppin' Bunnies, Monkey Music @ West Greenwich Community Centre, Brookhill Children's Centre, Little Rascals @ Waterfront Leisure Centre (free, Tuesdays), Forum@Greenwich baby interactive play, Yumi Yoga, Yoga Lounge, NCT, Greenwich Mums Facebook group.
72. Mumsnet Local — *Any Mum and baby groups in Lewisham?* `https://www.mumsnet.com/talk/local/901046-Any-Mum-and-baby-groups-in-lewisham` — *"All the libraries in Lewisham run under 5s story time which is free"*; Horniman Museum storytimes; postnatal groups at Good Hope Cafe and the Healthy Lifestyle Centre (£5).
73. Mumsnet Local — *Lewisham/Greenwich mums*. `https://www.mumsnet.com/talk/primary/1640647-Lewisham-Greenwich-mums`
74. Greenwich Mums — *Baby & Toddler Rhyme Time*. `https://www.greenwichmums.com/baby-toddler-rhyme-time/` — fetched OK. **The most complete Greenwich library rhyme-time listing in existence** (13 branches, 28 weekly slots) — more complete than the operator's own site. Carries stale `greenwich.gov.uk/Greenwich/Learning/Libraries/…` links.
75. Greenwich Mums (site). `https://www.greenwichmums.com/`
76. Netmums Coffeehouse (local boards) — referenced in Lewisham thread.
77. Padlet — *Wellbeing hub for parents in South East London* (Mindful Mums). `https://padlet.com/mindfulmums/wellbeing-hub-for-parents-in-south-east-london-u8e1xf55z5w78f9i`

### Local round-ups and blogs
78. SilverSpoon London — *Best Things to Do in London with Babies and Toddlers* (Jan 2026) and *…for Summer 2026* (Jul 2026). Sources for NMM *Play Tuesdays* (weekly, under-5s), Museum of London Docklands *Tots at the Docks* (free, monthly, under-5s), The Cove playground at NMM.
79. MyBaba — *The Best Baby & Toddler Music Sessions In London, By Area*. `https://www.mybaba.com/music-classes-kids-london/`
80. Visit London — *Things to do with toddlers in London*. `https://www.visitlondon.com/things-to-do/family-activities/things-to-do-with-toddlers-in-london`
81. Time Out London — *101 things to do in London with kids, babies and toddlers*. `https://timeout.com/london/kids/101-things-to-do-in-london-with-kids-babies-and-toddlers`
82. MummyTravels — *The 26 best things to do in London with toddlers and preschoolers*. `https://www.mummytravels.com/london-with-toddlers-and-preschoolers/`
83. Little Splodgers (Greenwich & Blackheath art classes). `https://littlesplodgers.com/`
84. Lewisham Irish Community Centre — parent & toddler playgroup (Fri 09:30–11:30, term time). `https://lewishamirish.org.uk/social-clubs-classes/playgroup/`
85. Lewisham Toy Library. `http://lewishamtoylibrary.org.uk/`
86. Big Little Fun (Greenwich SE8 3BU; Bromley). `https://biglittlefun.co.uk/`
87. Baby Buzzers, Catford SE6 1SQ. `https://www.buzzersacademies.com/activities/baby-buzzers/`
88. CASPA Tots, West Wickham BR4 9AE. `https://www.caspabromley.org.uk/`
89. Drumbeat / Tom Tom Group (SEND, Beecroft Garden CC SE4 2BS). `https://www.drumbeatasd.org/web/tom_tom_group/441510`
90. Singalong Sally. `http://singalongsally.co.uk/`
91. Baby College Lewisham. `https://babycollege.co.uk/location/baby-college-lewisham/`
92. Kubz Klub, Eltham. `https://www.kubzklub.co.uk/`

### Method notes and limitations
- **WebSearch budget was exhausted** part-way through this leg (200/200 calls, shared with parallel research agents). Later verification was done with direct `WebFetch` and `curl` against known URLs, which is why some sources are marked *(unverified slug)* — the page pattern is confirmed but the exact branch slug was inferred.
- **Happity could not be fetched at all** (403 to every method tried). Its taxonomy is reconstructed from indexed URL patterns and third-party descriptions, not from the live site. Any figure attributed to Happity should be treated as indicative.
- Counts of "sessions per week" are **estimates** except where a source publishes an explicit timetable (Southwark libraries, Bromley libraries news post, Greenwich Mums, Greenwich 0-to-4, Bromley 0-to-19, The Play Map), which are exact as at the access date.
- Term dates were not resolved per borough; the term-time analysis assumes standard English school terms. **A borough-level term-date calendar is a prerequisite for implementing gate G7.**

### Addendum — sources verified in the final research pass (all accessed 11–12 Aug 2026)

93. **Bookwhen OpenActive RPDE feeds.** `data.bookwhen.com` — 4 unauthenticated feeds, **CC-BY 4.0**. `SessionSeries` + `PartialSchedule` (`repeatFrequency:"P1W"`, `byDay`, `exceptDate`, `idTemplate`) and `ScheduledSession` with live `remainingAttendeeCapacity`. **The only licensed cross-provider feed found in this research.**
94. **Better/GLL OpenActive feed.** `better-admin.org.uk/api/openactive/better` — **not yet fetched; highest-priority follow-up.** GLL runs the Greenwich children's centres, Greenwich and Bromley libraries, and the leisure centres.
95. **Bromley Simply Connect API.** `bromley.simplyconnect.uk/api/activities` — `GET` → JSON, 1,679 records with `age_range`, `cost_band`, radius search, `is_quality_assured`. The only open council endpoint in the region.
96. Hoop — `hoop.co.uk/sitemap-activities.xml` and per-activity `__NEXT_DATA__`. Basis for the 44%-vs-5% recurrence measurement and the 0/43 term-time and month-age findings. Schema carries `ageMin`/`ageMax` in months, `excludesSchoolHolidays`, `excludesBankHolidays`, `mustAttendFirstDay`, `send`, `disabilityURL`, `source` provenance.
97. Data Thistle — `datathistle.com`. Performance-listings aggregator (500,000+ future performances, ~12,000 venues) supplying ~86% of Hoop's scraped records; **strips recurrence on ingest**.
98. Happity — *End of Academic Year Roundup 2024–2025*. `happity.co.uk/blog/article/end-of-academic-year-roundup-2024-2025/` (the blog is the only part of the site that responds). Source for the 250k spaces / 80k weekly searches / 6,000 providers figures.
99. Happity robots.txt — `Content-Signal: search=yes, ai-train=no, use=reference`; `Disallow: /` for ClaudeBot, GPTBot, CCBot, Bytespider, Google-Extended, meta-externalagent. **Basis for the do-not-scrape recommendation.**
100. ClassForKids — `classforkids.io/sitemap.xml` (9 child sitemaps), area pages `/classes/{area}` and `/classes/{area}/baby-and-toddler`. `ageFrom`/`ageTo` are **integers in months** — the best age granularity found anywhere. Slug-ambiguity trap documented in §3.8.
101. Greenwich Community Directory — `greenwichcommunitydirectory.org.uk/sitemap.xml` (1,346–1,347 service URLs; ~450 tagged 0–5; **168 baby-and-toddler groups**). Runs on **Outpost** (open-source LocalGov Drupal). No JSON-LD, no API, no ORUK.
102. Quaggy Development Trust — public Google Calendar ICS: `calendar.google.com/calendar/ical/quaggychildrenscentre%40gmail.com/public/basic.ics` (1,912 events).
103. Idea Store / Tower Hamlets — `ideastore.co.uk/whats-on`; event records server-render with `og:` metadata at `…/events?id=NNNNNN`. Story Time for under-5s Mon–Sat 10:30–11:15 across 7 sites.
104. London Museum Docklands — *Tots at the Docks* `londonmuseum.org.uk/whats-on/tots-at-the-docks/` (last Wed monthly, free); *Mudlarks family gallery* (timed-entry booking released Sat 10:00 two weeks ahead).
105. Pebble — **pivoted to "Pebble Care"** (nursery extra-session booking). Legacy activity categories now under `old-` URLs; `api.bookpebble.co.uk` → 403. **The activity marketplace is retired.**
106. Kidadl Ltd (Companies House 08936944) — Active, but footer reads "© 2024" and `/events`, `/whats-on`, `/things-to-do`, `/about-us` all 404. Editorially stalled.
107. MyBump2Baby robots.txt — disallows `/whats-on/`, `/local/`, `/location/`, `/profile/`, `/feed/`. **Explicitly off-limits.**
108. Open Referral UK — the verified publisher list contains **eleven publishers and zero London boroughs**. Modelling internally to ORUK shapes would let GPC become the SE London publisher rather than a consumer.
109. Hoop relaunch history — closed 17 Jul 2020, **relaunched 22 Jun 2023** as Hoop v9 (now Hoop Health Ltd, © 2026). The widely-linked Happity blog post announcing Hoop's closure is a stale 2020 competitor page.
110. Local-media collapse timeline: Brockley Central (last post 15 Aug 2018), The Deptford Dame (8 Feb 2022), GreenwichMums (Jul 2024), Isle of Dogs Life (24 Jun 2025), South London Press (closed Aug 2026 after 160 years). The Greenwich Wire (`greenwichwire.co.uk/feed/`, ex-853London) is the last reliably-updating independent outlet.

**Residual open questions for a follow-up pass**
- Fetch the **Better/GLL OpenActive feed** — potentially resolves the Greenwich and Bromley library/children's-centre gap outright.
- Enumerate the remaining **OpenActive publishers** for other under-5 operators.
- Manually browser-check **Netmums local** (hard fetcher-level block; genuinely unresolved).
- Identify **Instagram curators and Facebook groups** for SE London under-5s — login-walled, so nothing could be verified. This is the largest single evidence gap in the report; no speculative names or URLs were invented.
- Confirm trading status for **Little Splodgers**, **Sing and Sign Southwark**, **Tots Play Bromley**, and the two franchises advertised for sale (**Toddler Sense Greenwich**, **Busylizzy Greenwich & Blackheath**).
- Resolve Idea Store branch postcodes and Tower Hamlets family-hub / Isle of Dogs children's-centre coverage.
