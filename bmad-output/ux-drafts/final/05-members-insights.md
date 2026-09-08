## 5. Member records and demand insights

**Covers:** FR-012 (member database), FR-013 (export), FR-014 (demand insights), NFR-010 (1,000 records). Supporting: NFR-002, NFR-004, NFR-006, NFR-013. **Routes:** `/admin/members`, `/admin/members/:memberId`, `/admin/insights`. **Persona throughout:** Ash — volunteer GPC admin, not technical, works in short bursts, must never have to open a database. **Privacy posture:** These are the only screens where private member data is legitimately on screen; five boundaries hold. **(1)** Every read goes through `/api/admin/*` with a server-verified bearer token (NFR-002) — never the browser anon key, which is public in the bundle; 401 returns no data body. **(2) No personal data in a URL:** the detail key is the record uuid, and search/filter state lives in a route-level store, deliberately not the query string, because `?search=hannah@example.com` writes an email into history, referer headers and access logs. This is a conscious divergence from FR-019, which governs the *public* directory where a filter value is a category; filters reset on hard reload and that cost is accepted. **(3) No personal data in logs, notifications, document titles or export filenames** — titles are `"Members | GPC Admin"` and `"Member record | GPC Admin"`, and confirmations name counts, never people. **(4)** Downloading is the one act that moves data outside these protections, so it is the one act that is confirmed (S3). **(5) No "audited" or "only you can see this" language:** every account is a full admin, FR-D04 (tiers) and FR-D05 (read audit) are deferred, and this release mitigates with attribution on *writes* (NFR-013), not restriction on reads.

### Journey J1 — Ash answers "what do you actually hold about me?"

**Goal:** From a member's email, find the record and read back the exact consent wording, version and UTC timestamp per purpose — without Supabase, without asking a developer. **Persona:** Ash; secondary beneficiary Aster Thackery, the named controller, who is accountable for the answer Ash gives. **Time:** 60–90s to find and read, 2–3 min if a portability file is produced. **Entry points:** sidebar → Members · dashboard "Members" tile · `/admin/data-requests` → "Open this member's record" · moderation review → "View full member record" (A17) · a bookmarked uuid URL, safe to share internally because it carries a uuid and nothing else.
**Success criteria:** consent text, version and UTC timestamp readable aloud from one screen, per purpose (FR-004) · every answer visible, unanswered shown as "Not answered" not blank · submitted-vs-published distinguishable where an admin edited (FR-016) · no raw column name, bare uuid or JSON blob · zero clicks into Supabase.

```
  Member emails: "What do you hold about me?"
        v
  /admin/members - tiles over the FULL set, first 100 rows
  Search "hannah@": client-side filter, no round trip.
  Polite live region: "3 members match."
        v
  1 match? --no--> narrow by group / directory / consent, or
                   disambiguate on first name + business
        v
  Opens the row -> /admin/members/:id
  1 Who they are  2 What they told us  3 Directory listing
  4 Consent history <-- THE ANSWER    5 Activity
  NEWSLETTER   WITHDRAWN v1.2 2026-07-22 08:02:55 UTC unsubscribe link
  HOLD MY DATA GIVEN     v1.2 2026-03-04 19:41:07 UTC web form (/join)
        v
  "Copy consent record" (S2) / "Export record" (S3) -> Ash replies.
```

| Trigger | Display | Recovery |
|---|---|---|
| Search matches nothing | **"No member matches that."** / "Try just part of the email, or search their business name instead. If they asked to be erased, their record is gone by design — nothing about them is kept." + **"Clear search and filters"** | Clear restores the full list; focus to search |
| Two people look alike, or they wrote from a different address | Every match shows first name, business, email and joined date — enough to disambiguate; the empty state already points at business name | Add a filter, or open each; Back preserves list state. If still nothing, a real dead end (see Notes) |
| Re-submitted the form (FR-007) | Per A10 the listing carries a `Resubmission` status pill, and the record shows **one activity entry** — "2 Aug 2026 · Re-submitted the form" — with a disclosure **"Show what they answered on 4 Mar 2026"**. No separate Updates view exists anywhere | Disclosure expands the superseded answers in place |
| No directory listing | `Not requested` pill: "This member did not ask to be listed. Nothing about their business is public." | None — an answer, not an error |
| Listing was admin-edited (FR-016) | "As submitted / As published", changed fields marked **"Edited by an admin"** and attributed: "Edited by ash@… on 12 Mar 2026" | Ash can quote both to the member |
| A consent was withdrawn | Grant and withdrawal both appear, each with its own UTC timestamp; nothing is overwritten (FR-004). Effective state is a pill row at the top of the section | None — designed behaviour |
| Consent row has no version | Version reads **"Not recorded"** in an error-tinted row: "This record predates consent versioning. Treat it as unevidenced and re-ask before relying on it." | Escalate to the controller; never rendered as if evidenced |
| 401 mid-read | **"Your session has expired. Sign in again to see member records."** + **"Sign in"**; member data cleared from state first | Sign in, return to the same route |

**Drop-off notes.** The failure is not visual — it is losing her place, or losing confidence she has the right person. *(a) Place:* navigating into a record and back must restore search string, filter selections, `visible` count and scroll, with focus on the row she came from; at 1,000 records, being dumped at the top of an unfiltered list after every lookup is the single most likely reason she abandons the page — the same defect already fixed once for the discovery review queue. *(b) Identity:* the form collects a first name only, so the row's primary line is first name **plus** business name with email muted beneath; opening the wrong record is a privacy event, which is why nothing on the detail page auto-performs. *(c) The erased member:* FR-023 keeps only a non-identifying erasure record, so "we erased you" and "we never had you" are indistinguishable — the empty-state copy says so rather than papering over it. *(d) Reading fatigue:* three walls of verbatim prose get skimmed and misquoted, so each consent row leads with a one-line summary at full weight and carries the verbatim text beneath, **always visible, never behind a disclosure** — a DSAR answer that needs a click to reveal is one that gets given wrong. *(e) Timezones:* consent timestamps are UTC and carry the literal string "UTC"; everything else is local `en-GB` short dates, because mixing them unlabelled is how an admin tells a member they consented an hour before they did.

#### Screen S1 — Members list (`/admin/members`)

```
+------------------------------------+  320px
| [=] GPC Admin  [ out ]             |  drawer + top bar (A21)
| Members                        h1  |
| Everyone who has filled in the join|
| form, and what they agreed to.     |
| [ See the insights -> ]            |
+------------------------------------+
| MEMBERS 216 . DIRECTORY 34 pub, 12 |  stat tiles, stacked at
|  pending, 3 held . BUSINESS 112    |  320px; DATA REQUESTS
|  (52%) . CAREER 124 (57%) .        |  links to /admin/data-
|  NEWSLETTER 178 (82%) . REQUESTS 2 |  requests (A5)
| ! Tiles count ALL 216; the filters |
|   below change only the list.      |
+------------------------------------+
| (o) Search name, email or business |  44px, type="search"
| Group [v] Directory [v] Consent [v]|
| [ Export these 216 (CSV) ]         |  label states the live count
+------------------------------------+
| Hannah . Little Fox Photography    |  one card per member below
| hannah@littlefox.example           |  md:, email muted 14px
| [Both] [Published] [News: yes]     |  pills per DESIGN.md 2.7
| Joined 4 Mar 2026        Open >    |  one <a>, min 88px tall
| [ Show 100 more ]   100 of 216     |
+------------------------------------+
```

**≥768px:** cards become a real `<table>` (sr-only `<caption>`; Member / Group / Joined / Directory / Newsletter / action) with a right-aligned "Open" link — **never a `<div onClick>` row**; tiles 2-up; filters, count and export on one flex row. **≥1024px:** tiles 3-up with the headline spanning 2; the table gains **Postcode** last, being least often needed and most sensitive to shoulder-surfing. No `xl:` — unused in this codebase. **Components:** `MembersManager`; `StatTile` lifted out of `SubscribersManager` into `src/components/admin/StatTile.jsx` and used by both; `WholeSetNotice`; `MemberFilters` (search + three `<select>`, every control `htmlFor`/`id`); `MemberRowCard` / `MemberTable` (one data shape, two renderers); `Badge` with new `group-*`, `dir-*`, `news-*` variants; `ShowMoreButton`; `ExportDialog` over the shared `Dialog` (A14); shared `Spinner` (A7). **Pills reuse `SubscribersManager`'s module-scope class-map *idiom* and none of its values** — that ramp is ~3.4:1 and ~3.1:1 and fails AA at pill size (A15); all values come from DESIGN.md §2.7. The export button carries the standing line "Exports what's in the list below, not the totals above." **Accessibility (screen-specific):** search is debounced 250ms before both filtering and announcing, so the count does not fire per keystroke; below `md:` the list is a `<ul>` of links whose accessible name composes to "Hannah, Little Fox Photography, joined 4 March 2026, both groups, listing published, newsletter yes", so badges are never bare colour or abbreviation; filters sit in `<search aria-label="Find a member">`; and focus goes to the first newly revealed row link after "Show more", to the search input after clearing, and to the originating row on return from a record.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Loaded, ≥1 member | Tiles over the full set; first 100 rows; "Showing 100 of 216" | Page's single polite region (A13): "Showing 100 of 216 members." sr-only `<caption>` on the table |
| Loading | Initial fetch | **Skeletons** for tiles and rows (A7); layout does not collapse; filters render `disabled` and dimmed, never hidden | `aria-busy="true"` on the list region; polite: "Loading members." |
| Empty | Zero rows: tiles read `0`, **"No one has filled in the join form yet."** / "When someone does, they'll appear here with everything they told us."; filters and export disabled. Filters match nothing: tiles unchanged (still the full set) + the J1 copy + **"Clear search and filters"** | — | Polite: "No members match. 216 members in total." Clearing returns focus to the search input |
| Error | Fetch rejects / 500 / 401 | Inline banner per DESIGN.md §2.10: **"We couldn't load the members list."** + **"Try again"**; no stale or partial rows. 401: **"Your session has expired…"** + **"Sign in"**, data cleared first | Single `role="alert"` region; focus to the recovery control |
| Success | "Show more", or an export completes | Rows append in place, count updates. Export confirmation is an inline success banner **directly beneath the export button** — "Downloaded 216 member records." No toasts anywhere (A6) | Polite: "100 more members shown. Showing 200 of 216." |
| Disabled | (a) 0 rows match; (b) filters while loading; (c) nothing left to show | (a) export dimmed, label reads "Export these 0 (CSV)"; (b) selects `disabled`; (c) the Show-more button is **removed**, not disabled | Real `disabled` attribute + `aria-describedby` → "There's nothing to export with these filters." `title` is not reliably announced |

**NFR-010.** the endpoint returns a *summary projection only* (id, first name, business, email, postcode, group, joined, resubmitted, directory status, newsletter state, open-request flag) — never survey answers or consent text, which load on the detail route. ~250 bytes/row ≈ 250KB at 1,000 members: a bounded set. Escape hatch, written into the code as a threshold and a comment: **above 500KB or 2,000 rows, move search and paging server-side.**

#### Screen S2 — Member record (`/admin/members/:memberId`)

```
+------------------------------------+  320px
| < Back (restores search, filters,  |
|   scroll and focus)                |
| Member record h1 Joined 4 Mar 2026 |
| [Both] [Resubmission] [News: yes]  |
| [ Export this member's record ]    |
+------------------------------------+
| 1. WHO THEY ARE                h2  |
|  First name Hannah                 |
|  Email hannah@... [copy]  SE10 8XX |
|  Heard via IG. Never published.    |
+------------------------------------+
| 2. WHAT THEY TOLD US           h2  |
|  Business/Events/Community/Not askd|
|  Looking for Networking, New       |
|   clients, Personal Brand.[retired]|
|  Challenges: "Finding time to      | free text: plain, line
|   market around the school run..." | breaks kept, no truncation,
|  Not asked: "Career questions were | never rendered as markup
|  not shown to this member."        |
+------------------------------------+
| 3. DIRECTORY LISTING           h2  |
|  [Published] since 12 Mar 2026     |
|  Business name  As submitted:      |
|   little fox photo.  As published  |
|   [edited] Little Fox Photo, ash@  |
|  Public enquiry hello@littlefox.ex |
|   (public address, not the signup) |
|  [ Open in moderation queue ]      | A17: reverse link exists too
+------------------------------------+
| 4. CONSENT HISTORY (newest first,  |
|  append-only, all times UTC)   h2  |
|  In force: [Hold] [Publish] [News: |
|   withdrawn]                       |
|  NEWSLETTER . WITHDRAWN . v1.2 .   | verbatim text always
|  2026-07-22 08:02:55 UTC . via     | visible, never behind
|  unsubscribe link                  | a disclosure
|   "I'd like the GPC weekly         |
|    newsletter."           [copy]   |
|  HOLD MY DATA . GIVEN . v1.2 ...   |
|  [ Copy consent record ]           |
+------------------------------------+
| 5. ACTIVITY                    h2  |
|  2 Aug 2026 Re-submitted the form  |
|   [ Show what they answered 4 Mar ]|
|  12 Mar Listing published by ash@  |
|  4 Mar 2026 Joined                 |
+------------------------------------+
```

**≥768px:** field pairs go two-column (~180px label column); submitted-vs-published becomes truly side-by-side under a shared field-name row. **≥1024px:** main column (sections 1–3) ~66% with a sticky right rail ~33% carrying Consent history and Activity — "what did they agree to" is why Ash opened the page and should stay on screen while she reads the answers. **Components:** `MemberDetail`; `BackToListLink`; `RecordSection` (titled `Card`, used five times); `FieldPair` (renders **"Not answered"** in muted text — never blank, never "null", never a lone dash); `FreeTextBlock` (**no truncation, no "read more"** — a truncated free-text answer is a wrong DSAR answer; never `dangerouslySetInnerHTML`); `AnswerList` (retired options keep the historical label with a muted `retired` pill); `SubmittedVsPublished`; `ConsentHistory` (**no write path at all, by construction**); `ActivityTimeline` (acting admin on every action, NFR-013); `CopyButton` (44×44px). **Accessibility (screen-specific):** `FieldPair` is `<dl>`/`<dt>`/`<dd>`, so label–value association is programmatic; consent entries are an `<ol>` whose each `<li>` opens with the summary line, so purpose, decision, version and timestamp are heard *before* the verbatim text; timestamps are `<time datetime="2026-03-04T19:41:07Z">` with visible text ending "UTC", spoken not implied; the `[edited]` badge's accessible name is "Edited by an admin"; free text sits in a region labelled "Their answer, in their own words"; disclosures are `<button aria-expanded aria-controls>`; and nothing depends on hover, because `SubscribersManager`'s `title`-only pills are replaced by visible text or `aria-describedby`.

**"Copy consent record" — exact clipboard serialisation.** This is the artefact Ash pastes into a DSAR reply, so it is specified rather than left to the implementer. Written as `text/plain` **only** — no `text/html` flavour, because a pasted HTML blob is not evidence — matching the stored form: **plain text with link URLs expanded inline**, never re-rendered from markup, never truncated. One block per consent row, newest first, in on-screen order, blank line between blocks:

```
GPC consent record
Record: 8f2c4a1b-19d7-4b0e-9a3c-77e1f0c2ab54
Copied: 2026-08-18 14:22:10 UTC by ash@example.org

NEWSLETTER - WITHDRAWN
Version: newsletter@1.2.0
Recorded: 2026-07-22 08:02:55 UTC
Captured via: unsubscribe link
Text shown at the time:
"I'd like the GPC weekly newsletter."

HOLD MY DATA - GIVEN
Version: hold_data@1.2.0
Recorded: 2026-03-04 19:41:07 UTC
Captured via: web form (/join)
Text shown at the time:
"I agree that GPC Community admins may hold the personal data I submit in this form. I've read the privacy notice (https://greenwichparentsandcarers.co.uk/privacy)."
```

`consent_text` is reproduced byte-for-byte from storage — the URL is already expanded there, so nothing is transformed at copy time and the link destination is part of the record. Every timestamp is the stored UTC value carrying the literal "UTC". **Name and email are deliberately absent:** the uuid identifies the record and the recipient already knows who they are, so the artefact stays safe if pasted into the wrong window. A per-row `[copy]` emits that row's block under the same three header lines. A row with no version serialises as `Version: NOT RECORDED - treat as unevidenced`.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Record loaded | All five sections; branches the member never saw render as a "Not asked" section, not as absence | `<h1 tabindex="-1">` takes focus on mount, so a screen-reader user hears "Member record" |
| Loading | Fetch in flight | Header and section skeletons (A7); export button `disabled` | `aria-busy="true"` on `<main>`; polite: "Loading member record." |
| Empty | Unreachable — a record cannot exist without identity and the `hold_data` consent that created it; field-level absence is `FieldPair`'s "Not answered" | — | — |
| Error | 404 / 500 / 401 | 404: **"We couldn't find that member."** / "The link may be out of date, or the record may have been erased at the member's request." + **"Back to members"**. 500: **"We couldn't load this member's record."** + **"Try again"** — nothing partial renders, because a half-loaded record is worse than none when the output is a legal answer. 401 as S1 | `role="alert"`; focus to the recovery control |
| Success | Copy or export completes | Inline text beside the button — "Copied." — held 4s; export uses the §2.10 success banner beneath its button. No toasts (A6); no personal data in either string | Polite region mirrors the same words |
| Disabled | Export while the record loads, or while a previous export builds | Dimmed, genuinely inert | Real `disabled` + `aria-describedby` → "Still loading this record." |

#### Screen S3 — Export dialog (FR-013)

```
+------------------------------------+  320px dialog
| Download 216 member records?   h2  |
| [ the warning paragraph, quoted    |
|   in full below ]                  |
| Format  (o) Spreadsheet (CSV)      |
|         ( ) Data file (JSON)       |
| [   Download   ]   [   Cancel   ]  |
+------------------------------------+
```

There is no export helper anywhere in the codebase — no download utility, no serialiser, no `Blob` — so this is net-new and needs its own module and tests, because the failure mode is silently emitting a broken or over-broad file of personal data. Built on the one shared `Dialog` primitive (A14, DESIGN.md §2.9). The single-member variant differs only in heading — **"Download this member's record?"** — and body: "This file contains their name, email, postcode, every answer they gave, and their full consent history. This is the file to send if they've asked for a copy of their data." The list trigger's label tracks the live filtered count exactly (FR-013): "Export these 216 (CSV)".

**Filenames carry no personal data** `gpc-members-2026-08-18-216-records.csv`; `gpc-member-8f2c4a1b-2026-08-18.json`. A filename appears in the Downloads shelf, in file pickers and in screen shares; it is a leak surface and is treated as one. **Contents.** CSV: one row per member; one column per question using the question's **current published label**; identity columns; per-purpose consent columns (decision, version, UTC timestamp, capture method); multi-selects semicolon-joined in one quoted cell; retired options export their historical label; line 1 is a comment row stating the export date and the filters applied. JSON: the complete record with the append-only consent history as an array and ISO-8601 `Z` timestamps — the shape to hand a member exercising portability. **Accessibility (screen-specific):** no modal on this site is currently a real dialog — no role, no `aria-modal`, no trap, no Escape — and that is fixed once, in the shared primitive; Format is a real `<fieldset>`/`<legend>` with two labelled radios, and the JSON option's help text is tied to its radio with `aria-describedby`, not left as adjacent grey text.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Trigger pressed | Dialog as drawn; CSV pre-selected | `role="dialog" aria-modal="true"`; `aria-labelledby` the `<h2>` and `aria-describedby` the warning paragraph so it is *spoken* on open; focus to heading; trapped; Escape closes; background `inert` |
| Loading | "Download" pressed | In-button spinner (A7); label becomes **"Building the file…"**; both buttons and both radios `disabled` | `aria-busy` on the dialog; polite: "Building the file." |
| Empty | Unreachable — the trigger is `disabled` at 0 matching rows, so an empty export cannot be requested | — | — |
| Error | Serialisation or fetch fails | Dialog stays open; inline error banner **"We couldn't build that file."** + **"Try again"**; nothing downloads and no partial file is written | `role="alert"`; focus to "Try again" |
| Success | File written | Dialog closes; §2.10 success banner beneath the triggering button — "Downloaded 216 member records." / "Downloaded 1 member record." Never a name | Focus returns to the trigger; polite region mirrors it |
| Disabled | Trigger at 0 rows or mid-load; both dialog buttons while building | Dimmed, genuinely inert | Real `disabled` + `aria-describedby`, because `title` alone is not reliably announced |

### Journey J2 — Ash decides when to run the next networking breakfast

**Goal:** Pick a day, a slot and a cadence, and say *why* with a number, in under three minutes, without exporting anything. **This journey is the entire payback for the length of the form** — if it fails, every survey question on `/join` is unjustified collection under NFR-006. **Persona:** Ash; secondary, the admins she has to convince in a WhatsApp group. **Time:** 2–3 minutes including copying the summary out. **Entry points:** sidebar → Insights · dashboard "Plan an event from what members told us" · Members list header link (the two screens are a pair and link to each other).
**Success criteria:** within one screenful, a *sentence* that answers the question rather than a chart to interpret · every number as an absolute count **and** a share, with the base stated per block (FR-014) · narrowable to the people who actually want that event type · every block recalculates on filter change · a paste-able summary of counts only.

```
  "We should do another networking breakfast. When?"
        v
  /admin/insights
  RESPONSE BASE BANNER (always first, always visible)
  "Based on 216 members who have filled in the join form. Not
   everyone answered every question - each section says who it
   counted."
        v
  FILTERS: Group [Everyone v]  Interested in [Any v]
     Ash sets "Networking breakfasts". Every block recalculates.
     Polite region: "Recalculated for 132 members who want
     networking breakfasts."
        v
  THE ANSWER CARD
    Best slot: TUESDAY MORNING - 81 of 132 (61%)
    Then: Thursday morning 74 (56%), Friday 69 (52%)
    Base: 132 of 132 answered (100%). More than one slot allowed,
    so shares exceed 100%.
        v
  DAY/TIME GRID  mobile: 21 ranked bars; md+: heat grid (below)
        v
  HOW OFTEN / WHAT KIND OF EVENT / WHAT THEY'RE ASKING FOR
        v
  [ Copy summary ] -> plain text, counts only: "GPC insights,
  18 Aug 2026. Filter: everyone who wants networking breakfasts
  (132 of 216 members). Best slot: Tuesday morning, 81 of 132
  (61%). Then Thursday morning 74 (56%), Friday morning 69 (52%).
  Preferred frequency: monthly, 68 of 132 (52%). Top asks:
  networking (98, 74%)." Ash pastes it into the admin group.
```

| Trigger | Display | Recovery |
|---|---|---|
| Two slots tie for first | **"Best slots: Tuesday morning and Thursday morning — 81 of 132 (61%) each."** Never an arbitrary tiebreak | Use frequency or branch demand to choose |
| Filtered base 1–9 | Answer card replaced by a caution card: **"Only 7 members match this filter. That's too few to plan from — widen the filter, or treat this as a hint rather than evidence."** Blocks still render, each with its base | Widen or clear the filter |
| Filtered base 0 | **"No members match this filter yet."** + **"Clear filters"**; blocks suppressed rather than rendering rows of zeros. The banner still states the unfiltered total, so Ash can see the data exists | Clear filters |
| Group = "Career Mums" | The business-demand panel renders **"No business-branch members in this view."** rather than vanishing — a panel that disappears reads as a bug | None |
| An option was retired (FR-008) | It still appears with its historical label, a muted **`retired`** pill and "No longer offered on the form. These answers were given while it was." Counts unchanged | None — retiring must never rewrite history |
| A question's *wording* changed mid-collection | Show the **current published label**, aggregate, and print a note under the block: **"The wording of this question changed on 12 Jun 2026. 74 of these 132 answers were given to the earlier wording — [show it]."** Never silently merge two wordings under one label | The disclosure prints the previous wording verbatim with its own count |
| A question was made optional | Base line reads **"Base: 164 of 216 members in this view answered this question (76%). The other 52 were not asked or skipped it."** | Stating the base *is* the recovery |
| Shares appear not to sum to 100 | Multi-select blocks carry **"Members could pick more than one, so these add up to more than 100%."**; single-choice blocks carry **"One answer each, so these add up to 100%."** | None |
| Ash wants the people, not the counts | Each block header carries **"See these members"**, opening `/admin/members` with the equivalent filter pre-applied in state, not the URL | — |

**Drop-off notes.** *(a) The chart that isn't an answer:* the obvious build is a page of charts, and the obvious outcome is that Ash looks once, cannot turn it into a decision, and goes back to guessing — the answer card is the requirement, not decoration, and if it is cut for scope FR-014 has not been delivered whatever else ships. *(b) The average-of-everyone trap:* without the "Interested in" cross-filter the top slot is the best slot for the whole membership, dominated by whichever branch is most numerous, and Ash books a breakfast the breakfast-wanters cannot attend. *(c) Small-base overconfidence:* six people agreeing looks identical to sixty once it is a percentage, so the under-10 caution card is load-bearing — without it the screen manufactures false confidence, which is worse than no screen. *(d) The grid at 320px:* seven columns leave ~40px each, which cannot carry a readable number, so mobile gets the ranked bar list — strictly better for "which slot wins?" and the same data — and the ranked list stays available at every width behind a disclosure, so nobody has to read colour to get the answer.

#### Screen S4 — Insights (`/admin/insights`)

```
+------------------------------------+  320px
| Insights                       h1  |
| What members told us on the join   |
| form, so events can be planned     |
| from evidence, not guesswork.      |
+------------------------------------+
| Based on 216 members who have      |  RESPONSE BASE BANNER,
| filled in the join form. Not       |  always first and always
| everyone answered every question.  |  visible
+------------------------------------+
| Group [v]  Interested in [v]       |  sticky filters
| 132 of 216 match [ Clear filters ] |
+------------------------------------+
| When to run it                 h2  |
| +================================+ |
| | BEST SLOT                      | |
| | Tuesday morning                | |  30px display, --color-dark
| | 81 of 132 (61%)                | |
| | Then Thursday 74, Friday 69    | |
| | Base: 132 of 132 (100%). More  | |
| | than one slot allowed.         | |
| +================================+ |
| All 21 slots (ranked)          h3  |
| Tuesday morning  [######--] 81(61%)|
| ... Sunday evening [#-----]  4( 3%)|
| [ See these members -> ]           |
+------------------------------------+
| How often they want events     h2  |
| Monthly 68 (52%) [#######--] ...   |
| Base: 132 of 132. One answer each. |
| What kind of event h2 / What       |
| they're asking for h2 (both with   |
| Business and Career panels + base) |
+------------------------------------+
| [ Copy summary ]  Counts only.     |
| No names, no emails.               |
+------------------------------------+
```

**≥768px:** the 21 ranked bars are **replaced by the 7 × 3 day/time heat grid** — the one visualisation this section keeps, because it is what makes the form's 21-option question worth having asked — with the ranked list moved behind a closed-by-default disclosure, **"Show all 21 slots as a list"**, that is always present. **≥1024px:** answer card and grid side by side (~40/60); "How often" pairs with "What kind of event"; the two branch panels pair; filters become one sticky row.

```
              Mon      Tue      Wed      Thu      Fri      Sat      Sun
           +--------+--------+--------+--------+--------+--------+--------+
  Morning  |  38    |**81**  |  55    |  74    |  69    |  22    |   9    |
           |  29%   |**61%** |  42%   |  56%   |  52%   |  17%   |   7%   |
           +--------+--------+--------+--------+--------+--------+--------+
  Afternoon|  27    |  41    |  33    |  35    |  30    |  18    |  11    |
           |  20%   |  31%   |  25%   |  27%   |  23%   |  14%   |   8%   |
           +--------+--------+--------+--------+--------+--------+--------+
  Evening  |  19    |  24    |  21    |  26    |  14    |   7    |   4    |
           |  14%   |  18%   |  16%   |  20%   |  11%   |   5%   |   3%   |
           +--------+--------+--------+--------+--------+--------+--------+
           ** = highest cell: 2px outline + the word "Best"
```

**Heat ramp.** Six steps banded on each cell's share of the maximum cell; this ramp is specific to this grid and is not a DESIGN.md token set. Every step's printed number clears AA against its own background: L0 (0 responses) `#6b7280` on `#ffffff` 4.83:1 · L1 (1–20%) `#1a1a2e` on `#f4effa` 15.09:1 · L2 (21–40%) `#1a1a2e` on `#e9def7` 13.20:1 · L3 (41–60%) `#1a1a2e` on `#cbb6e8` 9.26:1 · L4 (61–80%) `#ffffff` on `#6d5296` 6.37:1 · L5 (81–100%) `#ffffff` on `#2d1b4e` 15.24:1. The text colour flips between L3 and L4 and no step may sit in the luminance band between them, which is where a 3-point-something near-miss lives. **The "best cell" outline is `#fc16a0` drawn on the L5 background `#2d1b4e` — ≈4.0:1, which clears the 3:1 non-text threshold (WCAG 1.4.11) for that pairing;** the 3.64:1 figure in DESIGN.md §3.1 is `#fc16a0` against *white*, the wrong comparison here, because this outline never renders on white. Bars use `#fc16a0` fill on `#f4effa` track (3.22:1, non-text) and carry no text inside them. **Colour is never the only carrier:** every cell prints its count and share as text, and the best cell also carries the word "Best".

**Labels come from the published form configuration, never a hard-coded list.** Insights reads every question label, option label and the three slot names from the currently *published* form config (per A4's draft→publish model), so an FR-008 rename propagates here without a code change and a retired option keeps the historical label it was answered under. There is no `SLOT_LABELS` constant anywhere in this feature; if the published config has not yet named the three slots — the extracted form inventory does not — the block renders the config's raw option labels rather than inventing "Morning / Afternoon / Evening". **Components:** `InsightsPage`; `ResponseBaseBanner`; `InsightsFilters` (two labelled selects, live match count, "Clear filters"); `AnswerCard`; `SlotHeatGrid` (a real `<table>` with `<caption>`, `scope="col"` days, `scope="row"` slots); `RankedBarList` (reused for slots, event types, frequency and both branch panels); `InsightBlock`; `BaseLine` — **never optional: a block without a base line must not render**; `SmallBaseCaution`; `CopySummaryButton`; shared `Spinner` (A7).

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Aggregates loaded, base ≥10 | Banner, filters, answer card, grid/bars, frequency, event types, both branch panels, copy button | Polite: "Showing insights for 216 members." |
| Loading | Initial fetch, or a filter change needing a refetch | Banner and filters stay (filters `disabled`, dimmed, never hidden); blocks become skeletons of the same height, so the page does not jump | `aria-busy` on the results region; polite: "Recalculating." |
| Empty | Zero members: banner reads "No one has filled in the join form yet." + **"There's nothing to summarise yet. As soon as members start joining, this page will tell you when to run things."**, filters and Copy disabled. Filtered to zero: the J2 row above; blocks suppressed, never rows of zeros | — | Polite region announces once; focus to "Clear filters" in the filtered case |
| Caution | Filtered base 1–9 | `AnswerCard` replaced by `SmallBaseCaution` (copy in J2); grid and blocks still render with their bases | `role="status"`, **not** `alert` — information, not a failure |
| Error | Aggregate fetch rejects | **"We couldn't load the insights."** + **"Try again"**. 401: **"Your session has expired. Sign in again to see insights."** + **"Sign in"** | `role="alert"`; focus to the recovery control |
| Success | Copy summary pressed | Inline confirmation beside the button, held 4s: **"Summary copied. It contains counts only — no names or emails."** No toast (A6) | Polite region mirrors the same words |
| Disabled | Copy while loading or at base 0; filters while loading | Dimmed, genuinely inert | Real `disabled` + `aria-describedby` → "There's nothing to copy yet." |

**Accessibility (screen-specific).** The heat grid is a data table, navigable cell by cell with headers announced: "Tuesday, Morning, 81, 61 percent, best". Bars are `aria-hidden` decoration — the count and share beside them are the content. Base lines and the multi-select caveat are real text inside the block, never a `title` and never a footnote elsewhere, so a screen-reader user is not left wondering why shares exceed 100%. Filter changes announce once, debounced, through the page's single polite region (A13); filters never steal focus. Heat cells are ≥48px tall at `md:` and form a single tab stop in browse mode. **Error-message bounding, all four screens:** an error card always shows our own fixed sentence, and a server message is appended on a second muted line only when it belongs to our own known error set, truncated to 120 characters and rendered as plain text — never markup, never a raw stack or database string.

## Notes for architecture

- The **"Interested in" cross-filter exceeds FR-014**, which names only a group filter. It is what turns J2 from a chart page into a decision. Needs PM confirmation; if cut, the answer card must say plainly that it is the best slot for *everyone*, not for the event being planned.
- **Erased members are unfindable by design.** FR-023 keeps only a non-identifying erasure record, so Ash cannot confirm an erasure happened. Either standardise the reply wording, or keep a one-way hash of the email in the erasure record — itself processing, and disclosable under FR-024.
- **Single-member export format is undecided.** FR-013 says "a portable format"; this section offers CSV and JSON with JSON recommended. Confirm whether a member-facing copy should be a rendered PDF, as many DSAR responses in practice are. Separately, **naming the three time slots is a form-config authoring task** — Insights reads them from the published config, but nothing is named yet, so it blocks a legible S4.
- **Whether the list should show email at all**, and whether addendum Q7 adds a last name. Email is shown here because search is by email and Ash must confirm identity, but that is up to 100 addresses on screen in a café; the alternative is revealing it only when the search term matched it. Both relate to deferred FR-D05, and Q7 would change the Member column and the search behaviour.
- **Nothing states a retention expectation for an exported file** once it is on Ash's laptop. The dialog's "delete it when you're done with it" is the only control; more than an instruction would be a new requirement.
