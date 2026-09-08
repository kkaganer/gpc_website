# EXPERIENCE.md — Admin Member Database & Insights

**Scope of this section:** FR-012 (admin member database), FR-013 (export), FR-014 (demand
insights), NFR-010 (usable at 1,000 records). Supporting: NFR-002 (auth on every private read),
NFR-004 (consent evidenced), NFR-006 (minimisation), NFR-008 (WCAG 2.1 AA), NFR-013 (attribution).

**Routes specified here:** `/admin/members`, `/admin/members/:memberId`, `/admin/insights`.

**Primary persona throughout:** Ash — GPC admin. Volunteer, not technical, works in short bursts
on a laptop, must never have to open a database.

Read alongside `bmad-output/ux-shared-context.md` (tokens, contrast table, existing primitives) and
`DESIGN.md`. Specifications only — no code.

---

## 0. Privacy posture of these three screens

This is stated first because it constrains every decision below, and because these screens are the
**one place in the entire product where private member data is legitimately visible on a screen**.
Everywhere else — the public form, the directory index, a listing detail, an email, a log line — the
answer is "no private data, ever". Here the answer is "yes, and here is exactly how far that
permission reaches".

**What is legitimately visible here**

First name, signup email, postcode, how they heard about GPC, every survey answer including the
three free-text answers, the full append-only consent history, the directory listing in every state,
moderation notes, and the acting-admin attribution on every decision. Ash needs all of it: FR-012
exists so she can answer a member's question about their own data without a developer and without a
database client.

**The boundary conditions**

1. **Behind admin auth, checked server-side, on every request.** These three pages render inside
   `ProtectedRoute` and read exclusively through `/api/admin/*` routes that verify a bearer token
   server-side before returning a byte (NFR-002). Client-side route protection is a convenience, not
   the boundary — a missing, malformed or expired token returns 401 with no data body. No page in
   this section may read member data with the browser anon key, because the anon key is public
   (it is inlined into the JS bundle at build time).
2. **No personal data in any URL.** The detail route key is the member record's uuid
   (`/admin/members/8f2c…`), never an email, name or postcode. Search terms and filter selections
   live in component state and are **deliberately not** mirrored into the query string. This is a
   conscious divergence from FR-019, which requires URL-persisted filters — that requirement is
   about the *public* directory, where the filter value is a category, not a person. Here, a URL of
   `?search=hannah@example.com` would write a member's email into the browser history, the referer
   header of any outbound link, and the deployment's access log. Filters therefore reset on reload;
   that cost is accepted.
3. **No personal data in any log.** Server routes log the record identifier and the operation, never
   the payload (FR-005 acceptance criterion). Client-side, nothing in this section calls
   `console.log` with a member row.
4. **No personal data in any notification.** FR-022's admin alert links to `/admin/members` or the
   moderation queue and embeds nothing. The Insights "Copy summary" affordance produces counts and
   percentages only — it is designed to be pasted into a WhatsApp admin group, so it must be safe
   there by construction.
5. **No personal data in the document title.** `/admin/members` sets `"Members | GPC Admin"`; the
   detail page sets `"Member record | GPC Admin"` — never the member's name. Titles land in browser
   history, tab strips, and screen recordings.
6. **No personal data in a toast.** Toast copy is "Consent record copied." not "Copied Hannah's
   consent record."
7. **No personal data in an export filename.** See §6.
8. **Downloading is the one deliberate act that moves data outside these protections**, and it is
   therefore the one act that gets a confirmation dialog (§6). Everything else in this section is
   read-only.

**What is honestly not protected, and is out of scope for this release**

Every authenticated account is a full admin (there is no role model in 27 migrations, and any
authenticated user can create and delete other admins). FR-D04 (permission tiers) and FR-D05 (a read
audit recording which admin viewed which member) are both deferred in the addendum. The mitigation
for this release is attribution on *write* actions (NFR-013), not restriction on reads. These screens
must not imply otherwise — no "audited" language, no "only you can see this" reassurance.

---

## 1. Journey A — Ash looks up a member to answer a question about their data

**Goal:** Given a member's email arriving in the GPC inbox — "what do you actually hold about me?",
"please take my listing down", "when did I agree to the newsletter?" — Ash finds that member, reads
their complete record including the exact consent text, version and UTC timestamp, and replies
accurately, without opening Supabase and without asking Kristina.

**Primary persona:** Ash (GPC admin). Secondary beneficiary: Aster Thackery, the named data
controller, who is legally accountable for the answer Ash gives.

**Estimated time:** 60–90 seconds to find and read the record. 2–3 minutes if a data-portability
file is also produced (§6).

**Entry points:**
- Admin sidebar → **Members** (the ordinary route).
- Admin dashboard → the "Members" stat tile.
- The withdrawal / erasure request queue (FR-023) → "Open this member's record".
- The moderation queue (FR-015) → a pending listing's "View full member record" link.
- A direct `/admin/members/:memberId` URL Ash bookmarked or was sent by another admin — safe to
  share internally because it carries a uuid and nothing else.

**Success criteria:**
- Ash can read aloud, from one screen, the exact consent wording the member saw, its version
  identifier, and the UTC timestamp — for each of the three consent purposes separately (FR-004).
- Ash can see every answer the member gave, including the three free-text answers, with unanswered
  questions shown as "Not answered" rather than as blank space.
- If the listing was admin-edited, Ash can distinguish what the member submitted from what is
  published (FR-016).
- Ash never sees a raw database column name, a uuid presented as if it were meaningful, or a JSON blob.
- Zero clicks into Supabase.

### Happy Path

```
  Member emails GPC: "What do you hold about me?"
                 |
                 v
  +--------------------------------------------+
  | Ash opens /admin/members                    |
  | (sidebar > Members)                         |
  +--------------------------------------------+
                 |
                 |  list loads: stat tiles over the FULL set,
                 |  first 100 rows rendered
                 v
  +--------------------------------------------+
  | Types part of the email into Search         |
  | "hannah@"                                   |
  +--------------------------------------------+
                 |
                 |  client-side filter, no round trip
                 |  live region: "3 members match."
                 v
        +--------------------+
        |  exactly 1 match?  |
        +--------------------+
           |             |
        yes|             |no  -> narrow further (group / directory /
           |             |       consent filter), or read the 3 rows
           v             |       and pick by first name + business
  +--------------------------------------------+
  | Opens the row  ->  /admin/members/:id       |
  +--------------------------------------------+
                 |
                 v
  +--------------------------------------------+
  | MEMBER DETAIL, top to bottom:               |
  |   1. Who they are      (name, email,        |
  |                         postcode, source)   |
  |   2. Their answers     (branch-aware,       |
  |                         free text in full)  |
  |   3. Directory listing (submitted vs        |
  |                         published)          |
  |   4. Consent history   <-- THE ANSWER       |
  |   5. Activity          (resubmits, admin    |
  |                         actions, dates)     |
  +--------------------------------------------+
                 |
                 v
  +--------------------------------------------+
  | Consent history, newest first:              |
  |                                             |
  |  Hold my data       GIVEN   v1.2            |
  |    2026-03-04 19:41:07 UTC  web form        |
  |    "I agree that GPC Community admins may   |
  |     hold the personal data I submit..."     |
  |                                             |
  |  Publish my listing GIVEN   v1.2            |
  |  Newsletter         WITHDRAWN v1.2          |
  |    2026-07-22 08:02:55 UTC  unsubscribe link|
  |    (original grant still shown below)       |
  +--------------------------------------------+
                 |
        +--------+---------+
        |                  |
        v                  v
  "Copy consent      "Export this member"
   record"            (§6 dialog)
        |                  |
        v                  v
  Plain text on      One file downloaded,
  the clipboard      named by uuid + date
        |                  |
        +--------+---------+
                 v
     Ash replies to the member, accurately.
```

### Decision Points & Alternative Paths

| Trigger | Display | Recovery |
|---|---|---|
| Search returns nothing | Empty state inside the list region: **"No member matches that."** and, below it, "Try just part of the email, or search their business name instead. If they asked to be erased, their record is gone by design — nothing about them is kept." Plus a **"Clear search and filters"** button. | Clear button restores the full list and returns focus to the search input. |
| Search returns several people who look alike (two "Hannah") | All matches render; each row shows first name, email, business name and submitted date, which is enough to disambiguate. Result count is announced. | Ash adds a filter, or opens each in turn — the Back link returns to the list with search and filters intact (see Drop-off notes). |
| The member gave a different email than the one they are writing from | No match. Empty state copy above explicitly suggests searching the business name. | Ash searches by business name or first name. If still nothing, this is a real dead end — see Gaps. |
| Member re-submitted the form (FR-007) | Activity section lists each submission with its date: "Submitted 4 Mar 2026 · Re-submitted 2 Aug 2026". Answers shown are the latest; superseded answers are collapsed under **"Show what they answered on 4 Mar 2026"**. | Disclosure expands the earlier answer set in place. |
| Member has no directory listing | The Directory listing section renders with a `not-requested` badge and the line "This member did not ask to be listed. Nothing about their business is public." | None needed — this is an answer, not an error. |
| Listing was admin-edited (FR-016) | Two-column "As submitted / As published" comparison with changed fields marked **"Edited by an admin"** and attributed: "Edited by ash@… on 12 Mar 2026". | Ash can quote both to the member. |
| A consent was withdrawn | Both the grant and the withdrawal appear as separate rows, each with its own UTC timestamp; nothing is overwritten (FR-004, NFR-004). The current effective state is summarised in a pill at the top of the section. | None — this is the designed behaviour. |
| Consent record is missing a version identifier (legacy or imported row) | The version cell reads **"Not recorded"** in an `alert`-styled row, with "This record predates consent versioning. Treat it as unevidenced and re-ask before relying on it." | Ash escalates to the controller. Never silently rendered as if evidenced. |
| The admin API returns 401 (session expired mid-read) | Full-page error state: **"Your session has expired. Sign in again to see member records."** with a **"Sign in"** button. No stale data left on screen. | Sign in, return to the same route. |
| Ash is on a phone (not the expected device) | List renders as stacked cards, not a table; detail sections stack. No horizontal scroll at 320px. | Fully usable, just slower. |

### Drop-off Risk Notes

The realistic failure here is not visual — it is Ash losing confidence that she is looking at the
right person, or losing her place.

**Losing her place.** The established list convention resets `visible` to `PAGE_SIZE` on every
filter change, which is right. But navigating *into* a member and back must not also reset search,
filters and scroll — at 1,000 records, being dumped at the top of an unfiltered list after every
lookup is the single most likely reason Ash stops using this page and asks a developer instead. This
is the same defect that was already fixed once in this codebase for the discovery review queue. The
Back link therefore restores the list's search string, filter selections, `visible` count and scroll
position, and places focus on the row Ash came from. State survives in a route-level store, not the
URL (§0.2).

**Ambiguous identity.** The form asks for a first name only (source form Q1; addendum Q7 asks whether
a last name should be added). With 1,000 records, "Sarah" is not an identifier. Mitigation on screen:
the row's primary line is first name **plus** business name where one exists, with the email as a
muted second line. If Q7 resolves toward a last name, that becomes the primary line. Until then Ash
will occasionally open the wrong record — which is a privacy event, not just an annoyance, and is why
the detail page never auto-performs anything.

**The erased member.** FR-023 keeps only "a minimal non-identifying record of the erasure". That is
correct and it makes a specific question unanswerable: a member writes "you must still have my data",
and search returns nothing. Ash cannot distinguish "we erased you" from "we never had you". The empty
state copy above tells the truth about this rather than papering over it, and it is logged in Gaps.

**Consent reading fatigue.** The consent section shows the *full* stored text, which can be several
sentences per purpose, three times over. Rendered as three walls of prose it will be skimmed and
misquoted. Mitigation: each consent row leads with a one-line summary (purpose · decision · version ·
UTC timestamp) at full weight, with the verbatim text beneath in a smaller, indented block, always
visible (never behind a disclosure — a DSAR answer that requires a click to reveal is a DSAR answer
that gets given wrong).

**Timezone confusion.** Consent timestamps are stored and displayed in **UTC, labelled UTC**, because
that is what NFR-004 requires GPC to be able to evidence. Everything else on these screens uses local
`en-GB` short dates, matching the rest of the admin panel. Mixing the two without labels is how an
admin ends up telling a member they consented an hour before they did. Every UTC value carries the
literal string "UTC".

---

## 2. Journey B — Ash decides when to run the next networking breakfast

**Goal:** Pick a day, a time slot and a rough cadence for the next networking breakfast, and be able
to say *why* — with a number — in under three minutes, without exporting anything and without opening
a spreadsheet. This journey is the entire payback for the length of the form. If it does not work,
every survey question on `/join` is unjustified collection under NFR-006.

**Primary persona:** Ash. Secondary: whoever Ash has to convince — the other GPC admins in a WhatsApp
group, or the newsletter.

**Estimated time:** 2–3 minutes end to end, including copying the summary out.

**Entry points:**
- Admin sidebar → **Insights**.
- Admin dashboard → "Plan an event from what members told us" link.
- Members list → **"See the insights"** link in the page header (the two screens are a pair; each
  links to the other).

**Success criteria:**
- Within one screenful of the top, Ash can read a sentence that answers the question — not a chart
  she has to interpret.
- Every number on the page is shown as an absolute count **and** a share of respondents, with the
  response base stated for that block (FR-014).
- Ash can narrow to the people who actually said they want networking breakfasts, so the "best day"
  is the best day *for that event*, not the best day on average.
- Ash can apply the group filter and watch every block recalculate (FR-014).
- Ash leaves with a paste-able summary containing counts only and no personal data.

### Happy Path

```
  "We should do another networking breakfast. When?"
                 |
                 v
  +--------------------------------------------+
  | Ash opens /admin/insights                   |
  +--------------------------------------------+
                 |
                 v
  +--------------------------------------------+
  | RESPONSE BASE BANNER (always first)         |
  | "Based on 216 members who have filled in    |
  |  the join form. Not everyone answered every |
  |  question - each section says who it        |
  |  counted."                                  |
  +--------------------------------------------+
                 |
                 v
  +--------------------------------------------+
  | FILTERS (sticky under the heading)          |
  |  Group:      [ Everyone            v ]      |
  |  Interested in: [ Any event type   v ]      |
  +--------------------------------------------+
                 |
                 |  Ash sets "Interested in" =
                 |  "Networking breakfasts"
                 v
  +--------------------------------------------+
  | Every block below recalculates.             |
  | Live region: "Recalculated for 132 members  |
  | who want networking breakfasts."            |
  +--------------------------------------------+
                 |
                 v
  +============================================+
  | THE ANSWER CARD                             |
  |                                             |
  |  Best slot: TUESDAY MORNING                 |
  |  81 of 132 (61%) can make it                |
  |                                             |
  |  Then: Thursday morning  74 (56%)           |
  |        Friday morning    69 (52%)           |
  |                                             |
  |  Base: 132 of 132 in this view answered     |
  |  the days question (100%). Members could    |
  |  pick more than one slot.                   |
  +============================================+
                 |
                 v
  +--------------------------------------------+
  | THE 7 x 3 GRID                              |
  |  mobile:  21 ranked bars, highest first     |
  |  md+:     heat grid, days across,           |
  |           Morning/Afternoon/Evening down,   |
  |           every cell prints "81 (61%)"      |
  +--------------------------------------------+
                 |
                 v
  +--------------------------------------------+
  | HOW OFTEN  (single choice, sums to 100%)    |
  |  Monthly      68 (52%)                      |
  |  Fortnightly  31 (23%)                      |
  |  Quarterly    22 (17%)                      |
  |  Weekly       11 ( 8%)                      |
  |  Base: 132 of 132 (100%)                    |
  +--------------------------------------------+
                 |
                 v
  +--------------------------------------------+
  | WHAT TO PUT ON THE AGENDA                   |
  |  Business branch - what they're looking for |
  |  Career branch  - what support they want    |
  |  (two panels, each with its own base)       |
  +--------------------------------------------+
                 |
                 v
  +--------------------------------------------+
  | [ Copy summary ]                            |
  +--------------------------------------------+
                 |
                 v
  Clipboard now holds, as plain text:
  "GPC insights, 18 Aug 2026. Filter: everyone
   who wants networking breakfasts (132 of 216
   members). Best slot: Tuesday morning, 81 of
   132 (61%). Then Thursday morning 74 (56%),
   Friday morning 69 (52%). Preferred frequency:
   monthly, 68 of 132 (52%). Top asks: networking
   (98, 74%), new clients (81, 61%)."
                 |
                 v
  Ash pastes it into the admin group and books
  Tuesday morning, monthly.
```

### Decision Points & Alternative Paths

| Trigger | Display | Recovery |
|---|---|---|
| Two or more slots tie for first | The answer card shows both, joined: **"Best slots: Tuesday morning and Thursday morning — 81 of 132 (61%) each."** Never an arbitrary tiebreak. | Ash uses the second-tier detail (frequency, branch demand) or the grid to choose. |
| The filtered base drops below 10 respondents | The answer card is replaced by a caution card: **"Only 7 members match this filter. That's too few to plan from — widen the filter or treat this as a hint, not evidence."** The grid still renders, with its base stated. | Widen or clear the filter. |
| The filtered base is 0 | Empty state: **"No members match this filter yet."** with **"Clear filters"**. All blocks below are suppressed rather than rendering rows of zeros. | Clear filters. |
| Group filter set to "Career Mums" | The Business demand panel renders with **"No business-branch members in this view."** rather than disappearing — a panel that vanishes reads as a bug. | None. |
| An option was retired by an admin (FR-008) | The option still appears, with its historical label and a muted **"retired"** badge and the tooltip "No longer offered on the form. These answers were given while it was." Counts are unchanged. | None — retiring must never rewrite history. |
| A question was made optional and some members never saw it | That block's base line reads **"Base: 164 of 216 members in this view answered this question (76%). The other 52 were not asked or skipped it."** | None — stating the base *is* the recovery. |
| Percentages appear not to sum to 100 | Multi-select blocks carry the standing line **"Members could pick more than one, so these add up to more than 100%."** Single-choice blocks (frequency) carry **"One answer each, so these add up to 100%."** | None. |
| Insights fails to load | Error card: **"We couldn't load the insights."** with the message and a **"Try again"** button, matching the list convention. | Retry. |
| Ash wants the underlying people, not the counts | Each block header carries a **"See these members"** link that opens `/admin/members` with the equivalent filter pre-applied (in state, not the URL). | — |

### Drop-off Risk Notes

**The chart-that-isn't-an-answer failure.** The obvious build of this screen is a page of charts, and
the obvious outcome is that Ash looks at it once, cannot turn it into a decision, and goes back to
guessing. The answer card at the top is not decoration — it is the requirement. It must render a
sentence in words with numbers in it, before any visualisation. If the answer card is cut for scope,
FR-014 has not been delivered, whatever else ships.

**The average-of-everyone trap.** Without the "Interested in" cross-filter, the top slot is the best
slot for *the whole membership* — dominated by whoever is most numerous, which at GPC is likely the
Career branch. Ash books a Tuesday morning breakfast on that basis and the people who wanted a
breakfast are the ones who cannot come. The cross-filter is what makes this journey load-bearing
rather than decorative. It is an addition beyond FR-014's stated group filter and is logged in Gaps
for PM confirmation.

**Small-base overconfidence.** A community list will produce filters that match six people. Six people
agreeing looks identical to sixty people agreeing once it is a percentage. The under-10 caution card
is therefore not a nicety; without it this screen actively manufactures false confidence, which is
worse than no screen.

**The 7 × 3 grid at 320px.** Twenty-one cells across seven columns cannot carry a readable number at
320px — roughly 40px per column before padding. Any attempt to render the grid on a phone produces
either horizontal scroll or unreadable type. Mobile therefore gets the ranked bar list, which is
strictly *better* for the actual question ("which slot wins?") and is the same data. The grid appears
at `md:` and up, where Ash actually works. The ranked list remains available at every width via a
disclosure, so nobody has to read colour to get the answer.

**Slot vocabulary.** The source form records 21 options as 7 days × 3 slots but the extracted
inventory does not name the three slots. Insights labels must exactly match the form's option labels,
including if an admin renames them (FR-008). Logged in Gaps.

---

## 3. Screen — Members list (`/admin/members`)

**Purpose:** Find one member fast, and see the shape of the membership at a glance. The single
entry point to every private member record.

**Entry from:** Admin sidebar (**Members**, a new row in the `sidebarLinks` array at
`AdminLayout.jsx:5-16`); admin dashboard tile; "See these members" links from Insights; Back from a
member detail page.

**Exits to:** `/admin/members/:memberId` (row); `/admin/insights` (header link); the moderation queue
(a pending-count tile); the export dialog (§6); the withdrawal/erasure queue (the open-requests tile).

### Layout Wireframe (mobile-first, 320px)

```
+------------------------------------+  <- 320px
| [=]  GPC Admin            [ out ]  |  admin top bar (see Gaps: the
+------------------------------------+     current 256px sidebar does
|                                    |     not fit 320px)
| Members                        h1  |
| Everyone who has filled in the     |
| join form, and what they agreed    |
| to.                                |
|                                    |
| [ See the insights -> ]   (link)   |
+------------------------------------+
|                                    |
| +--------------------------------+ |
| | MEMBERS                        | |
| | 216                            | |  <- headline tile, text-5xl
| | Everyone who has submitted     | |
| +--------------------------------+ |
| +--------------------------------+ |
| | IN THE DIRECTORY               | |
| | 34 published                   | |
| | 12 pending . 3 held            | |
| +--------------------------------+ |
| +--------------------------------+ |
| | BUSINESS BRANCH                | |
| | 112  (52%)                     | |
| | 92 Business Mums + 20 Both     | |
| +--------------------------------+ |
| +--------------------------------+ |
| | CAREER BRANCH                  | |
| | 124  (57%)                     | |
| | 104 Career Mums + 20 Both      | |
| +--------------------------------+ |
| +--------------------------------+ |
| | NEWSLETTER CONSENT             | |
| | 178  (82%)                     | |
| | Ticked the newsletter box      | |
| +--------------------------------+ |
| +--------------------------------+ |
| | DATA REQUESTS OPEN             | |
| | 2                              | |
| | Withdrawal or erasure, waiting | |
| +--------------------------------+ |
|                                    |
| ! Every tile above counts ALL 216  |
|   members. Filters below change    |
|   the list only, never the tiles.  |
+------------------------------------+
|                                    |
| +--------------------------------+ |
| | (o) Search name, email or      | |  <- 44px tall, type="search"
| |     business                   | |
| +--------------------------------+ |
| +--------------------------------+ |
| | Group: Everyone            v   | |  <- 44px tall selects
| +--------------------------------+ |
| +--------------------------------+ |
| | Directory: Any status      v   | |
| +--------------------------------+ |
| +--------------------------------+ |
| | Consent: Any state         v   | |
| +--------------------------------+ |
|                                    |
| Showing 100 of 216                 |
| . filtered from 1,000              |
|                                    |
| [ Export these 216 (CSV) ]         |  <- full-width, 44px
+------------------------------------+
|                                    |
| +--------------------------------+ |  <- one CARD per member
| | Hannah                         | |     (no table below md:)
| | Little Fox Photography         | |
| | hannah@littlefox.example       | |  <- muted, 14px
| |                                | |
| | [Both] [Published] [News: yes] | |  <- Badge row, wraps
| | Joined 4 Mar 2026              | |
| |                    Open  >     | |  <- whole card is one link,
| +--------------------------------+ |     min height 88px
| +--------------------------------+ |
| | Sarah                          | |
| | sarah.k@example.com            | |
| | [Career] [Not listed] [News: no]| |
| | Joined 11 Mar 2026             | |
| |                    Open  >     | |
| +--------------------------------+ |
|              ...                   |
+------------------------------------+
|                                    |
|   [   Show 100 more   ]            |  <- full-width, 44px
|   Showing 100 of 216               |
+------------------------------------+
```

**Tablet / Desktop variations (differences only)**

- **≥768px (`md:`):** The card list becomes a real `<table>` with a visually-hidden `<caption>`
  ("Members who have filled in the join form, their group, when they joined, their directory status
  and their newsletter consent."). Columns, left to right: **Member** (first name on line 1, business
  name and email on a muted line 2), **Group**, **Joined**, **Directory**, **Newsletter**,
  **(row action)**. Row action is a right-aligned "Open" link; the whole row is *not* a click handler
  — `LondonEventCard`'s `<div onClick>` is exactly the keyboard-unreachable pattern this feature must
  not inherit. Stat tiles go to a 2-column grid. Search and the three selects sit on one wrapping
  flex row, with the count and the export button pushed right.
- **≥1024px (`lg:`):** Stat tiles go to a 3-column grid with the headline tile spanning 2 (matching
  `SubscribersManager`). The filter row no longer wraps. The table gains a **Postcode** column —
  the last column to earn space, because it is the field Ash least often needs and the one most
  sensitive to shoulder-surfing.
- **≥1440px:** No further change. `xl:` is unused across this codebase; do not introduce it.

### Component Hierarchy

1. `AdminLayout` (existing) — sidebar/topbar shell, `<Outlet>`. **Requires modification**: the
   fixed `w-64` sidebar must collapse below `md:` (see Gaps).
2. **`MembersManager`** page component — **NEW**. Follows `SubscribersManager` exactly: four-ish state
   atoms, one `useEffect` load, `useMemo` for `filtered`, `visible` reset on filter change.
   1. Page header — plain `<h1>` + description paragraph (**not** `SectionHeading`, which always
      renders an `<h2>` and cannot serve as a page `<h1>`), plus a `Button variant="outline"` link to
      `/admin/insights`.
   2. **`StatTileGrid`** — **NEW**, but lift the existing private `Tile` from
      `SubscribersManager.jsx` into `src/components/admin/StatTile.jsx` and use it in both places
      rather than copying it a third time. Props unchanged: `{ label, value, hint, boxClass,
      valueClass, valueSize, className }`.
   3. **`WholeSetNotice`** — **NEW**, a small `Card` with `p-4` carrying the standing sentence about
      tiles counting the full set. This convention has bitten before; state it on screen, not only in
      a code comment.
   4. **`MemberFilters`** — **NEW**. One search input + three `<select>`s, flat state, modelled on
      `EventFilters.jsx`. Every control gets `htmlFor`/`id` pairing — the site has none anywhere and
      must start here (NFR-008).
   5. `Button` (existing) — export trigger. **Needs three extensions** that do not exist today:
      a size variant (the fixed `px-6 py-3` is too large for a filter row), disabled styling, and a
      loading state. Specify these once in `DESIGN.md` and reuse.
   6. **`MemberRowCard`** (< md) / **`MemberTable`** (≥ md) — **NEW**. One data shape, two renderers.
   7. `Badge` (existing) — **needs new variants**: `group-business`, `group-career`, `group-both`;
      `dir-published`, `dir-pending`, `dir-held`, `dir-rejected`, `dir-unpublished`,
      `dir-not-requested`; `news-yes`, `news-no`, `news-withdrawn`. Existing variants
      (`free|sold-out|new|upcoming|past`) do not cover any of these. Implement as a module-scope class
      map, matching the `statusStyles` idiom already in `SubscribersManager`.
   8. **`ShowMoreButton`** — **NEW**. Label is `"Show 100 more"` when ≥ 100 remain, otherwise
      `"Show the last N"`. Absent — not disabled — when nothing remains.
   9. **`ListLiveRegion`** — **NEW**, a `role="status" aria-live="polite"` element. The site has
      exactly one of these today (`NewsletterBanner`); this is the second.
   10. **`ExportDialog`** — **NEW**, see §6.
   11. Spinner idiom (existing, copy-pasted everywhere) — extract to **`Spinner`** while adding a
       second consumer, rather than pasting it a fourth time.

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Load resolved, ≥ 1 member, no filters | Tiles over the full set; first 100 rows; "Showing 100 of 216". | `role="status"` region holds "Showing 100 of 216 members." Table has a visually-hidden `<caption>`. |
| **Loading** | Initial fetch, or a manual refresh | Tiles and list replaced by the centred spinner. Filters render but are `disabled` (dimmed, not hidden — the established convention from `EventFilters`). | `aria-busy="true"` on the list region; `role="status"` announces "Loading members." The spinner div is `aria-hidden`. |
| **Empty (no members at all)** | Fetch succeeds, zero rows | Tiles all render `0`. In place of the list: **"No one has filled in the join form yet."** / "When someone does, they'll appear here with everything they told us." Filters and export are disabled. | `role="status"` announces the same sentence once. |
| **Empty (filters match nothing)** | ≥ 1 member, `filtered.length === 0` | Tiles unchanged (still the full set). In place of the list: **"No member matches that."** / "Try just part of the email, or search their business name instead. If they asked to be erased, their record is gone by design — nothing about them is kept." + `Button variant="outline"` **"Clear search and filters"**. | `role="status"` announces "No members match. 216 members in total." Clearing returns focus to the search input. |
| **Error** | Fetch rejects (network, 500) | `Card` with a red border: **"We couldn't load the members list."** + the returned message + a **"Try again"** button. No partial or stale rows shown. | `role="alert"` on the card, so it is announced without polling. |
| **Error (401)** | Token missing/expired | Distinct card: **"Your session has expired. Sign in again to see member records."** + **"Sign in"**. All member data cleared from state first. | `role="alert"`; focus moves to the "Sign in" button. |
| **Success** | "Show more" pressed, or export completed | List grows in place; count line updates. Export success is a toast: **"Downloaded 216 member records."** (no names). | `role="status"` announces "100 more members shown. Showing 200 of 216." Toast is rendered inside the same polite live region — do **not** rely on `react-hot-toast` alone, which is used in exactly one file today and has no global `<Toaster>`. |
| **Disabled** | (a) Export with 0 rows matching; (b) all filters while loading; (c) "Show more" when nothing remains | (a) Export button dimmed to 50% with `title`/`aria-describedby` "There's nothing to export with these filters." (b) Selects dimmed and `disabled`. (c) The button is removed entirely, not disabled. | `disabled` attribute (not `aria-disabled` alone) so the control is genuinely inert; the explanatory sentence is a `<p id>` referenced by `aria-describedby`, because `title` is not reliably announced. |

### Interactions & Animations

| Interaction | Behavior | Timing | prefers-reduced-motion |
|---|---|---|---|
| Typing in search | Client-side filter over the loaded set. Debounce **250ms** before recomputing and before announcing the count — the count announcement must not fire per keystroke. | 250ms debounce; filter itself is synchronous | No motion involved; unchanged |
| Changing any filter | `visible` resets to 100; list re-renders; count line updates | Immediate | Unchanged |
| Card / row hover (≥ md) | Background shifts to `gray-50/50` | 150ms `transition-colors` | Colour transition removed; the end colour still applies |
| Card / row focus | 2px `#fc16a0` focus ring, 2px offset (non-text UI, 3.64:1 vs white — passes the 3:1 threshold) | Instant, no transition | Unchanged (focus indicators must never animate away) |
| "Show 100 more" | Rows append; focus moves to the first newly revealed row's link | Fade-in of new rows, 200ms, **no stagger** | Fade removed entirely — new rows appear at once. Do not inherit `Events.jsx`'s `delay: i*0.1` stagger; at 100 rows that is a 10-second animation |
| Stat tile value change (after refresh) | Value swaps | No count-up animation, ever | N/A — there is no motion to reduce |
| Opening the export dialog | Dialog fades and rises 8px; backdrop fades | 200ms ease-out | Fade and translate both removed; dialog appears instantly |
| Toast | Slides in from the top | 200ms | Appears without motion; dismiss timing unchanged |

`prefers-reduced-motion` is currently ignored everywhere on this site (framer-motion is used
throughout with no guard). These pages must honour it — a single shared `useReducedMotion` guard,
specified once in `DESIGN.md`, applied to every animated element listed above.

### Accessibility Annotations

- **Headings:** `<h1>` "Members" (one per page). `<h2>` "At a glance" (visually hidden) above the tile
  grid. `<h2>` "Find a member" (visually hidden) above the filters. `<h2>` "Members" (visually hidden)
  above the list region. No level is skipped.
- **Landmarks:** `AdminLayout` provides `<nav aria-label="Admin">` and `<main>`. This page renders
  inside `<main>` and adds `<search role="search" aria-label="Find a member">` around the filter
  block and `<section aria-labelledby="members-list-heading">` around the list. A skip link to
  `#main` must exist in `AdminLayout` — the site has none today.
- **Focus management:**
  - On mount, focus is not moved (the page was reached by a normal link).
  - After "Show more", focus moves to the first newly revealed row link.
  - After "Clear search and filters", focus returns to the search input.
  - Returning from a member detail, focus lands on the row that was opened.
  - Every interactive element has a visible `focus-visible` ring; the site currently has none.
- **Screen reader notes:**
  - Below `md:` the list is a `<ul>` of `<li>`s, each containing one link whose accessible name is
    composed as "Hannah, Little Fox Photography, joined 4 March 2026, both groups, listing published,
    newsletter yes" — badges are not left as bare colour or bare abbreviations.
  - At `md:` and up the `<table>` has a `<caption class="sr-only">`, `scope="col"` on every `<th>`,
    and the member cell as `scope="row"`.
  - Status is never colour-only: every badge carries a word.
  - The result count and the "tiles count everything" sentence are real text, not `title` attributes.
- **Keyboard operation:** Tab order is header link → search → group → directory → consent → export →
  row 1 … row N → "Show more". `Enter` on a row opens the member. `Escape` in the search field clears
  it (native `type="search"` behaviour, kept). No control requires hover or pointer. All touch targets
  ≥ 44 × 44px, including the select controls and the row card (min-height 88px on mobile).
- **NFR-010 (1,000 records):** The list endpoint returns a **summary projection only** — id, first
  name, business name, email, postcode, group, submitted date, resubmitted date, directory status,
  newsletter consent state, open-request flag. It must **not** return survey answers or consent text;
  those load only on the detail route. At ~250 bytes per row that is ~250KB at 1,000 members, which
  the established fetch-all-then-filter-client-side pattern can carry. This is a bounded set, not an
  unbounded one, which is what NFR-010 asks for. **Escape hatch, to be written into the code as a
  comment and a threshold:** if the summary payload exceeds 500KB or the row count exceeds 2,000,
  move search and paging to the server. Do not let it grow silently past that.

---

## 4. Screen — Member detail (`/admin/members/:memberId`)

**Purpose:** Show one member's complete record — every answer, the free text in full, the consent
history verbatim, the directory listing in both its submitted and published forms — so that a
data-subject request can be answered from this page alone.

**Entry from:** A row on `/admin/members`; the moderation queue; the withdrawal/erasure queue; a
bookmarked uuid URL.

**Exits to:** Back to `/admin/members` (restoring search, filters, `visible` and scroll); the
listing's entry in the moderation queue; the export dialog (§6).

### Layout Wireframe (mobile-first, 320px)

```
+------------------------------------+
| [=]  GPC Admin            [ out ]  |
+------------------------------------+
| < Back to members                  |  <- restores list state
+------------------------------------+
|                                    |
| Member record                  h1  |
| Joined 4 Mar 2026                  |
| Re-submitted 2 Aug 2026            |
|                                    |
| [Both] [Published] [News: yes]     |
|                                    |
| [ Export this member's record ]    |  <- 44px, opens dialog
+------------------------------------+
|                                    |
| 1. WHO THEY ARE                h2  |
| +--------------------------------+ |
| | First name   Hannah            | |
| | Email        hannah@littlefox. | |
| |              example    [copy] | |
| | Postcode     SE10 8XX          | |
| | Heard via    Instagram         | |
| +--------------------------------+ |
| Private. Never published anywhere. |
+------------------------------------+
|                                    |
| 2. WHAT THEY TOLD US           h2  |
|                                    |
| Business questions             h3  |
| +--------------------------------+ |
| | Stage of business              | |
| | I'm growing my business        | |
| |                                | |
| | Industry                       | |
| | Photography                    | |
| |                                | |
| | Looking for                    | |
| | Networking, New clients,       | |
| | Marketing & Social Media,      | |
| | Personal Branding [retired]    | |
| |                                | |
| | Challenges right now           | |
| | +----------------------------+ | |
| | | Finding time to market the | | |  <- free text, plain text,
| | | business around school run.| | |     line breaks preserved,
| | | ...                        | | |     no truncation, never
| | +----------------------------+ | |     rendered as markup
| +--------------------------------+ |
|                                    |
| Career questions               h3  |
| +--------------------------------+ |
| | ...                            | |
| +--------------------------------+ |
|                                    |
| Events                         h3  |
| +--------------------------------+ |
| | Event types                    | |
| | Networking breakfasts,         | |
| | Workshops, Family-friendly     | |
| |                                | |
| | Days that work                 | |
| | Tue morning, Thu morning,      | |
| | Fri morning, Wed afternoon     | |
| |                                | |
| | How often                      | |
| | Monthly                        | |
| +--------------------------------+ |
|                                    |
| Community & involvement        h3  |
| +--------------------------------+ |
| | Hopes to gain                  | |
| | [free text in full]            | |
| |                                | |
| | Would be interested in         | |
| | Running a workshop,            | |
| | Collaborating                  | |
| +--------------------------------+ |
|                                    |
| Not asked                      h3  |
| +--------------------------------+ |
| | Career questions were not      | |
| | shown to this member, so there | |
| | is nothing to display.         | |
| +--------------------------------+ |
+------------------------------------+
|                                    |
| 3. DIRECTORY LISTING           h2  |
| +--------------------------------+ |
| | [Published]  since 12 Mar 2026 | |
| | Published by ash@...           | |
| |                                | |
| | Business name                  | |
| |  As submitted                  | |
| |   little fox photography       | |
| |  As published    [edited]      | |
| |   Little Fox Photography       | |
| |   Edited by ash@... 12 Mar     | |
| |                                | |
| | Category                       | |
| |   Photography    (unchanged)   | |
| |                                | |
| | Description                    | |
| |  As submitted                  | |
| |   [full submitted text]        | |
| |  As published    [edited]      | |
| |   [full published text]        | |
| |                                | |
| | Public enquiry contact         | |
| |   hello@littlefox.example      | |
| |   (public - not their signup   | |
| |    email)                      | |
| |                                | |
| | [ Open in moderation queue ]   | |
| +--------------------------------+ |
+------------------------------------+
|                                    |
| 4. CONSENT HISTORY             h2  |
| Append-only. Newest first.         |
| All times UTC.                     |
|                                    |
| Now in force:                      |
| [Hold data: given] [Publish: given]|
| [Newsletter: withdrawn]            |
|                                    |
| +--------------------------------+ |
| | NEWSLETTER . WITHDRAWN         | |
| | v1.2 . 2026-07-22 08:02:55 UTC | |
| | via: unsubscribe link          | |
| |  "I'd like the GPC weekly      | |
| |   newsletter."                 | |
| |                        [copy]  | |
| +--------------------------------+ |
| +--------------------------------+ |
| | HOLD MY DATA . GIVEN           | |
| | v1.2 . 2026-03-04 19:41:07 UTC | |
| | via: web form (/join)          | |
| |  "I agree that the GPC         | |
| |   Community admins may hold    | |
| |   the personal data I submit   | |
| |   in this form. See our        | |
| |   privacy notice."             | |
| |                        [copy]  | |
| +--------------------------------+ |
| +--------------------------------+ |
| | PUBLISH MY LISTING . GIVEN     | |
| | v1.2 . 2026-03-04 19:41:07 UTC | |
| +--------------------------------+ |
| +--------------------------------+ |
| | NEWSLETTER . GIVEN             | |
| | v1.2 . 2026-03-04 19:41:07 UTC | |
| +--------------------------------+ |
|                                    |
| [ Copy the whole consent record ]  |
+------------------------------------+
|                                    |
| 5. ACTIVITY                    h2  |
| +--------------------------------+ |
| | 2 Aug 2026  Re-submitted the   | |
| |             form               | |
| |   [ Show what they answered    | |
| |     on 4 Mar 2026 ]            | |
| | 12 Mar 2026 Listing published  | |
| |             by ash@...         | |
| | 12 Mar 2026 Listing edited     | |
| |             by ash@...         | |
| | 4 Mar 2026  Joined             | |
| +--------------------------------+ |
+------------------------------------+
```

**Tablet / Desktop variations (differences only)**

- **≥768px:** Each section's field pairs go from stacked to a two-column definition layout (label
  column ~180px, value column fills). The submitted-vs-published comparison becomes genuinely
  side-by-side, two columns with a shared field-name row above them; the `[edited]` badge sits on the
  published column. Consent entries keep the one-line summary on a single line with the verbatim text
  indented beneath.
- **≥1024px:** Two-column page layout — main column (sections 1, 2, 3) at ~66%, sticky right rail at
  ~33% carrying **Consent history** and **Activity**, because "what did they agree to" is the reason
  Ash opened the page and should stay on screen while she scrolls their answers. The right rail
  scrolls independently and collapses back into the normal flow below `lg:`.
- **≥1440px:** No change.

### Component Hierarchy

1. `AdminLayout` (existing).
2. **`MemberDetail`** page — **NEW**. Loads one record from `/api/admin/members/:id`.
   1. **`BackToListLink`** — **NEW**. Restores list state from the route-level store.
   2. Page header: `<h1>` "Member record", dates, `Badge` row, `Button` "Export this member's record".
   3. **`RecordSection`** — **NEW**, a titled `Card` wrapper (`Card` has no internal padding; this
      adds `p-6`). Used five times.
   4. **`FieldPair`** — **NEW**. `{ label, value, empty }`. Renders `"Not answered"` in muted grey
      when the value is absent — never a blank cell, never "null", never "—" alone.
   5. **`FreeTextBlock`** — **NEW**. Renders long text as plain text with line breaks preserved and
      **no truncation and no "read more"** — a truncated free-text answer is a wrong DSAR answer.
      Never `dangerouslySetInnerHTML` (FR-020; the site sets no CSP).
   6. **`AnswerList`** — **NEW**. Multi-select answers as a comma-joined list at 320px, as chips at
      `md:`. Retired options render with a muted `Badge` **"retired"**.
   7. **`SubmittedVsPublished`** — **NEW**. Per FR-016: shows both values, marks the differing ones
      **"edited"**, and attributes the edit. Fields that were not changed render once with
      "(unchanged)" rather than duplicating the value.
   8. **`ConsentHistory`** — **NEW**. An ordered list, newest first, each entry carrying purpose,
      decision, version, UTC timestamp, capture method and the verbatim text. Plus an effective-state
      summary row at the top. Read-only by construction — this component has no write path at all.
   9. **`ActivityTimeline`** — **NEW**. Includes the acting admin on every moderation action
      (NFR-013).
   10. `Badge` (existing, new variants as listed in §3), `Button` (existing, extensions as in §3).
   11. **`CopyButton`** — **NEW**, icon button (`rounded-lg` per the radius grammar), 44 × 44px.
       Copies a single value or the whole consent record. Confirmation is a toast with **no personal
       data** in it: "Consent record copied."

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Record loaded | All five sections render. Branches the member did not see render as a "Not asked" section, not as absence. | `<h1>` receives focus on mount (see focus management). |
| **Loading** | Fetch in flight | Page header renders skeleton lines; sections replaced by the spinner. Export button `disabled`. | `aria-busy="true"` on `<main>`; `role="status"` announces "Loading member record." |
| **Empty** | N/A — a member record always has at least identity and one consent record; a record with no answers is impossible because consent (a) is required to create one. Individual *fields* have their own empty rendering ("Not answered"), specified on `FieldPair`. | — | — |
| **Error (404 / bad uuid)** | The id does not resolve | Full-page state: **"We couldn't find that member."** / "The link may be out of date, or the record may have been erased at the member's request." + **"Back to members"**. | `role="alert"`; focus moves to the "Back to members" link. |
| **Error (network / 500)** | Fetch rejects | **"We couldn't load this member's record."** + message + **"Try again"**. Nothing partial is rendered — a half-loaded record is worse than none when the output is a legal answer. | `role="alert"`. |
| **Error (401)** | Token missing/expired | **"Your session has expired. Sign in again to see member records."** + **"Sign in"**. Record cleared from state. | `role="alert"`; focus to "Sign in". |
| **Success** | Copy or export completes | Toast: "Consent record copied." / "Downloaded 1 member record." No page change. | Toast text mirrored into the page's polite live region. |
| **Disabled** | Export while loading or while a previous export is running | Button dimmed, `disabled`, with `aria-describedby` pointing at "Still loading this record." | `disabled` attribute + `aria-describedby`. |

### Interactions & Animations

| Interaction | Behavior | Timing | prefers-reduced-motion |
|---|---|---|---|
| Page mount | Sections render in place | **No entrance animation.** This page is read carefully, not scanned; fading in five sections delays the one answer Ash came for | N/A |
| "Show what they answered on 4 Mar" | Disclosure expands the superseded answer set in place | Height transition 200ms ease-out | Expands instantly; `aria-expanded` still toggles |
| Copy button | Value to clipboard; icon swaps to a tick for 1.5s; toast | Icon swap 150ms | Icon swaps without transition; toast appears without motion |
| Consent card hover | Border darkens slightly | 150ms | Colour applied without transition |
| Focus on any control | 2px `#fc16a0` ring, 2px offset | Instant | Unchanged |
| Sticky right rail (`lg:`) | Follows scroll | Native sticky, no JS | Unchanged (not motion in the WCAG 2.3.3 sense) |
| Opening the export dialog | As §3 | 200ms | Motion removed |

### Accessibility Annotations

- **Headings:** `<h1>` "Member record". `<h2>` per numbered section: "Who they are", "What they told
  us", "Directory listing", "Consent history", "Activity". `<h3>` for the question groups inside
  section 2 ("Business questions", "Career questions", "Events", "Community & involvement", "Not
  asked"). Never skipped, never chosen for size.
- **Landmarks:** renders inside `AdminLayout`'s `<main>`. Section 4 is
  `<section aria-labelledby="consent-heading">`; at `lg:` the right rail is
  `<aside aria-label="Consent and activity">`.
- **Focus management:** on mount, focus moves to the `<h1>` (`tabindex="-1"`) so a screen-reader user
  landing from the list hears "Member record" rather than being left at the top of the document.
  "Back to members" restores focus to the originating row. The export dialog traps focus and returns
  it to the export button on close.
- **Screen-reader notes:**
  - `FieldPair` uses a `<dl>`/`<dt>`/`<dd>` structure so label-value association is programmatic, not
    visual.
  - Consent entries are an `<ol>`; each `<li>` begins with the summary line, so the purpose, decision,
    version and timestamp are heard before the verbatim text.
  - Timestamps use `<time datetime="2026-03-04T19:41:07Z">` with the visible text "2026-03-04
    19:41:07 UTC" — the literal "UTC" is spoken, not implied.
  - The `[edited]` badge's accessible name is "Edited by an admin", not "edited".
  - Free text is inside a region with `aria-label="Their answer, in their own words"`.
- **Keyboard operation:** every copy button, disclosure and link is reachable in DOM order.
  Disclosures are `<button aria-expanded>` controlling an element by `aria-controls`. Nothing here
  requires hover: the `title` attributes used on `SubscribersManager`'s pills are supplemented by
  visible text or `aria-describedby` on every element that carries meaning.
- **Contrast:** every value is `#1a1a2e` on white (16.4:1); labels are `#4b5563` or darker, never a
  grey below 4.5:1. No text anywhere in this section is `#fc16a0`. Link text and button fills use
  `#c9107f` (5.43:1 on white with white text).

---

## 5. Screen — Insights (`/admin/insights`)

**Purpose:** Turn the survey answers into an event-planning decision. Every count as an absolute
number **and** a share of respondents, with the response base stated for each block (FR-014).

**Entry from:** Admin sidebar (**Insights**, a second new row in `sidebarLinks`); admin dashboard;
the Members list header link.

**Exits to:** `/admin/members` with an equivalent filter pre-applied ("See these members" links);
clipboard (Copy summary).

### Layout Wireframe (mobile-first, 320px)

```
+------------------------------------+
| [=]  GPC Admin            [ out ]  |
+------------------------------------+
|                                    |
| Insights                       h1  |
| What members told us on the join   |
| form, so events can be planned     |
| from evidence instead of guesswork.|
|                                    |
| [ Back to members ]  (link)        |
+------------------------------------+
| +--------------------------------+ |
| | Based on 216 members who have  | |  <- RESPONSE BASE BANNER
| | filled in the join form.       | |     always first, always
| | Not everyone answered every    | |     visible
| | question - each section says   | |
| | who it counted.                | |
| +--------------------------------+ |
+------------------------------------+
| +--------------------------------+ |  <- FILTERS, sticky under
| | Group                          | |     the header on scroll
| | [ Everyone              v ]    | |
| | Interested in                  | |
| | [ Any event type        v ]    | |
| |                                | |
| | 132 of 216 members match       | |
| | [ Clear filters ]              | |
| +--------------------------------+ |
+------------------------------------+
|                                    |
| When to run it                 h2  |
| +================================+ |
| | BEST SLOT                      | |
| |                                | |
| | Tuesday morning                | |  <- text-3xl, #2d1b4e
| | 81 of 132 (61%)                | |  <- text-xl
| |                                | |
| | Then                           | |
| |  Thursday morning  74 (56%)    | |
| |  Friday morning    69 (52%)    | |
| |                                | |
| | Base: 132 of 132 in this view  | |
| | answered this question (100%). | |
| | Members could pick more than   | |
| | one slot, so shares add up to  | |
| | more than 100%.                | |
| +================================+ |
|                                    |
| All 21 slots                   h3  |
| (ranked, highest first)            |
|                                    |
| Tuesday morning                    |
| [##################----]  81 (61%) |
| Thursday morning                   |
| [#################-----]  74 (56%) |
| Friday morning                     |
| [###############-------]  69 (52%) |
| Wednesday morning                  |
| [############----------]  55 (42%) |
| Tuesday afternoon                  |
| [#########-------------]  41 (31%) |
| ...                                |
| Sunday evening                     |
| [#---------------------]   4 ( 3%) |
|                                    |
| [ See these members -> ]           |
+------------------------------------+
|                                    |
| How often they want events     h2  |
| +--------------------------------+ |
| | Monthly      68 (52%)          | |
| | [##############--------]       | |
| | Fortnightly  31 (23%)          | |
| | [######----------------]       | |
| | Quarterly    22 (17%)          | |
| | [####------------------]       | |
| | Weekly       11 ( 8%)          | |
| | [##--------------------]       | |
| |                                | |
| | Base: 132 of 132 (100%).       | |
| | One answer each, so these add  | |
| | up to 100%.                    | |
| +--------------------------------+ |
+------------------------------------+
|                                    |
| What kind of event             h2  |
| +--------------------------------+ |
| | Networking breakfasts          | |
| | [####################-]132(100%)| |
| | Workshops                      | |
| | [##############-------] 89(67%)| |
| | Family-friendly events         | |
| | [############---------] 78(59%)| |
| | ... 10 event types in all      | |
| |                                | |
| | Base: 132 of 132 (100%).       | |
| | More than one allowed.         | |
| +--------------------------------+ |
+------------------------------------+
|                                    |
| What they're asking for        h2  |
|                                    |
| Business branch                h3  |
| +--------------------------------+ |
| | Networking       58 (74%)      | |
| | [####################--]       | |
| | New clients      48 (61%)      | |
| | Collaborations   39 (50%)      | |
| | Marketing        31 (40%)      | |
| | Personal Branding [retired]    | |
| |                  12 (15%)      | |
| | ... 18 options in all          | |
| |                                | |
| | Base: 78 of the 132 members in | |
| | this view are in the business  | |
| | branch, and all 78 answered.   | |
| | More than one allowed.         | |
| +--------------------------------+ |
|                                    |
| Career branch                  h3  |
| +--------------------------------+ |
| | Networking       44 (69%)      | |
| | Confidence Build 38 (59%)      | |
| | Flexible Working 33 (52%)      | |
| | ... 16 options in all          | |
| |                                | |
| | Base: 64 of the 132 members in | |
| | this view are in the career    | |
| | branch; 64 answered.           | |
| | More than one allowed.         | |
| +--------------------------------+ |
+------------------------------------+
|                                    |
| [   Copy summary   ]               |  <- full width, 44px
| Counts only. No names, no emails.  |
+------------------------------------+
```

**Tablet / Desktop variations (differences only)**

- **≥768px (`md:`):** The 21 ranked bars are **replaced by the 7 × 3 heat grid**, with the ranked list
  moved behind a disclosure — **"Show all 21 slots as a list"** — that is closed by default but always
  present. The grid:

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
           ** = highest, outlined 2px #fc16a0 with a "Best" label
```

  **Heat ramp (measured, not assumed).** Six steps, banded on each cell's share of the *maximum* cell,
  and every step's printed number passes AA against its own background:

  | Step | Band | Background | Number colour | Measured contrast |
  |---|---|---|---|---|
  | L0 | 0 responses | `#ffffff` | `#6b7280` | 4.83:1 ✅ |
  | L1 | 1–20% of max | `#f4effa` | `#1a1a2e` | 15.09:1 ✅ |
  | L2 | 21–40% | `#e9def7` | `#1a1a2e` | 13.20:1 ✅ |
  | L3 | 41–60% | `#cbb6e8` | `#1a1a2e` | 9.26:1 ✅ |
  | L4 | 61–80% | `#6d5296` | `#ffffff` | 6.37:1 ✅ |
  | L5 | 81–100% | `#2d1b4e` | `#ffffff` | 15.24:1 ✅ |

  The text colour flips between L3 and L4; no step is allowed to sit in the luminance band between
  them, which is where a 3-point-something near-miss lives. `#fc16a0` appears only as the 2px "best
  cell" outline — non-text UI at 3.64:1 against white, which clears the 3:1 threshold. **Colour is
  never the only carrier:** every cell prints its count and its share as text, and the best cell also
  carries the word "Best".

  Bars (mobile, and the desktop disclosure list) use fill `#fc16a0` on track `#f4effa` — 3.22:1, which
  clears the 3:1 non-text threshold. Bars carry no text inside them.

- **≥1024px (`lg:`):** The answer card and the grid sit side by side (answer card ~40%, grid ~60%).
  "How often" and "What kind of event" become a two-column pair. The two branch panels become a
  two-column pair. Filters move into a single sticky row.
- **≥1440px:** No change.

### Component Hierarchy

1. `AdminLayout` (existing).
2. **`InsightsPage`** — **NEW**.
   1. Page header: `<h1>` "Insights" + description + `Button variant="outline"` back-link.
   2. **`ResponseBaseBanner`** — **NEW**. A `Card` with `p-5`. Always rendered, always first.
   3. **`InsightsFilters`** — **NEW**. Two labelled `<select>`s (`htmlFor`/`id`), a live match count,
      and a "Clear filters" `Button variant="outline"`. Sticky below `md:` header on scroll.
   4. **`AnswerCard`** — **NEW**. The written answer. This is the requirement, not decoration.
   5. **`SlotHeatGrid`** — **NEW**, `md:` and up. A real `<table>` with `<caption>`, `scope="col"` day
      headers and `scope="row"` slot headers.
   6. **`RankedBarList`** — **NEW**. Used for the 21 slots below `md:` and inside the desktop
      disclosure, and reused for event types, frequency and both branch panels. Props:
      `{ items: [{label, count, share, retired}], base, baseNote, multiSelect }`.
   7. **`InsightBlock`** — **NEW**. `SectionHeading`-style titled `Card` carrying a `RankedBarList`
      plus its own **`BaseLine`** and a "See these members" link. Note `SectionHeading` renders an
      `<h2>` and is reusable here (unlike on the list pages, where an `<h1>` is needed).
   8. **`BaseLine`** — **NEW**. Renders "Base: N of M …(P%)" plus the multi-select or single-choice
      caveat. Never optional — a block without a base line must not render.
   9. **`SmallBaseCaution`** — **NEW**. Replaces `AnswerCard` when the filtered base < 10.
   10. **`CopySummaryButton`** — **NEW**. Builds a plain-text paragraph of counts and shares.
       Mirrors the existing copy-to-clipboard idiom in `NewsletterManager.jsx:58-66` (the only
       export-shaped affordance in the codebase today).
   11. `Badge` (existing) — the muted **"retired"** variant is **NEW**.
   12. **`Spinner`** (extracted, see §3).

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Aggregates loaded, base ≥ 10 | Banner, filters, answer card, grid/bars, frequency, event types, both branch panels, copy button. | `role="status"` holds "Showing insights for 216 members." |
| **Loading** | Initial fetch or a filter change that requires a refetch | Banner and filters stay (filters `disabled`, dimmed — never hidden); blocks replaced by the spinner. | `aria-busy="true"` on the results region; `role="status"` announces "Recalculating." |
| **Empty (no members at all)** | Zero member records exist | Banner reads "No one has filled in the join form yet." All blocks suppressed. Body: **"There's nothing to summarise yet. As soon as members start joining, this page will tell you when to run things."** Filters and Copy summary `disabled`. | `role="status"` announces the sentence once. |
| **Empty (filters match nobody)** | ≥ 1 member, filtered base 0 | Blocks suppressed. **"No members match this filter yet."** + **"Clear filters"**. Banner still states the unfiltered total, so Ash can see the data exists. | `role="status"`; focus moves to "Clear filters". |
| **Caution (base 1–9)** | Filtered base under 10 | `AnswerCard` replaced by `SmallBaseCaution`: **"Only 7 members match this filter. That's too few to plan from — widen the filter, or treat this as a hint rather than evidence."** Grid and blocks still render, each with its base. | `role="status"` (not `alert` — it is information, not a failure). |
| **Error** | Aggregate fetch rejects | **"We couldn't load the insights."** + message + **"Try again"**. | `role="alert"`. |
| **Error (401)** | Token missing/expired | **"Your session has expired. Sign in again to see insights."** + **"Sign in"**. | `role="alert"`; focus to "Sign in". |
| **Success** | Copy summary pressed | Button icon swaps to a tick for 1.5s; toast **"Summary copied. It contains counts only — no names or emails."** | Toast text mirrored into the polite live region. |
| **Disabled** | (a) Copy summary while loading or with base 0; (b) filters while loading | Dimmed to 50%, `disabled`, with `aria-describedby` → "There's nothing to copy yet." | `disabled` attribute + `aria-describedby`. |

### Interactions & Animations

| Interaction | Behavior | Timing | prefers-reduced-motion |
|---|---|---|---|
| Change group filter | All blocks recalculate; answer card headline may change | Immediate if aggregates are client-side; ≤ 400ms with a spinner if refetched | Unchanged |
| Change "Interested in" filter | Same, plus the base-count line updates | As above | Unchanged |
| Bar / cell value change after a filter | Bars animate width from old to new; heat cells cross-fade their background | 250ms ease-out | **No transition** — bars and cells snap to their new value. Nothing is lost: the numbers are text |
| Bar first render | Bars grow from 0 to their width, all at once, no stagger | 300ms ease-out | No growth; bars render at final width |
| Hover a heat cell (`md:`) | Cell lifts its border to `#2d1b4e` 2px; a tooltip is **not** used — the number is already printed | 150ms | Border applied without transition |
| Focus a heat cell | Same 2px `#fc16a0` focus ring as everywhere else | Instant | Unchanged |
| "Show all 21 slots as a list" disclosure | Expands in place | 200ms height | Expands instantly; `aria-expanded` toggles |
| Sticky filter bar | Sticks on scroll, gains a 1px bottom border | Native | Unchanged |
| Copy summary | Icon tick for 1.5s + toast | 150ms icon swap | No transitions; tick and toast still appear |

### Accessibility Annotations

- **Headings:** `<h1>` "Insights". `<h2>` "When to run it", "How often they want events", "What kind
  of event", "What they're asking for". `<h3>` "All 21 slots", "Business branch", "Career branch".
  No skips.
- **Landmarks:** inside `AdminLayout`'s `<main>`. Filters wrapped in
  `<search role="search" aria-label="Filter the insights">`. Each `<h2>` block is a `<section
  aria-labelledby>`.
- **Focus management:** filters do not steal focus on change — focus stays on the control Ash used,
  and the recalculation is announced via the live region instead. "Clear filters" returns focus to
  the group select. The disclosure keeps focus on its own button.
- **Screen-reader notes:**
  - The heat grid is a data table, so it is navigable cell by cell with row and column headers
    announced: "Tuesday, Morning, 81, 61 percent, best".
  - Bars are `aria-hidden` decoration; the count and share beside them are the real content.
  - The base line is real text inside the block, not a `title`, not a footnote elsewhere on the page.
  - The multi-select caveat is spoken as part of the block, so a screen-reader user is not left
    wondering why the shares exceed 100%.
  - Filter changes announce once, debounced: "Recalculated for 132 members who want networking
    breakfasts."
- **Keyboard operation:** tab order is back-link → group → interested-in → clear → answer-card link →
  grid (as a table, arrow-key navigable in screen-reader table mode; a single tab stop in browse
  mode) → disclosure → per-block "See these members" links → Copy summary. Every target ≥ 44 × 44px,
  including heat cells, which are sized at a 48px minimum height at `md:`.
- **Contrast:** every printed number meets AA against its own cell (table above). The `#fc16a0`
  "best" outline and the `#fc16a0` bar fills are non-text UI at ≥ 3:1. No body-size text on this page
  is `#fc16a0` in either direction. "See these members" links are `#c9107f` (5.43:1) and underlined.

---

## 6. Export (FR-013)

**Note on the codebase:** there is **no export helper anywhere** — no download utility, no
serialiser, no `Blob`, no `createObjectURL`. The only export-shaped affordance today is
copy-HTML-to-clipboard in `NewsletterManager.jsx:58-66`. Everything below is net-new and needs a small
shared module (`src/lib/exportCsv.js` or equivalent) plus its own tests, because the failure mode
here is silently emitting a broken or over-broad file of personal data.

### What the admin sees, and where the control lives

**Filtered-view export** — on `/admin/members`, at the end of the filter row (below `md:` it is a
full-width button directly beneath the count line). Its label always states the live count so there
is no ambiguity about scope:

- `"Export these 216 (CSV)"` when nothing is filtered
- `"Export these 34 (CSV)"` when filters narrow the set
- Disabled with `"Export these 0 (CSV)"` and `aria-describedby` "There's nothing to export with these
  filters." when nothing matches

It respects the active filters exactly (FR-013), which is why the count is in the label rather than in
a tooltip. Beside it, permanently: **"Exports what's in the list below, not the totals above."** —
because the stat tiles deliberately count the full set and that difference will otherwise be
misread.

**Single-member export** — on `/admin/members/:memberId`, in the page header beside the badges:
**"Export this member's record"**. This is the data-portability path (FR-013, and the mechanism
behind FR-023 and NFR-005).

### The confirmation

Both controls open the same dialog. This is the one deliberate act in the whole admin panel that moves
personal data outside the system's protections, so it is confirmed — not with a nag, but with a
statement of what is about to leave.

```
+------------------------------------+
|                              [ x ] |
| Download 216 member records?   h2  |
|                                    |
| This file contains first names,    |
| email addresses, postcodes and     |
| every answer these members gave,   |
| including their free-text answers. |
|                                    |
| Once it's on your computer it's    |
| outside the admin panel's          |
| protections. Keep it somewhere     |
| safe and delete it when you're     |
| done with it.                      |
|                                    |
| Format                             |
| ( o ) Spreadsheet (CSV)            |
| (   ) Data file (JSON) - for a     |
|       member asking for a copy of  |
|       their data                   |
|                                    |
| [   Download   ] [   Cancel   ]    |
+------------------------------------+
```

Single-member variant differs only in its heading — **"Download this member's record?"** — and its
body: "This file contains their name, email, postcode, every answer they gave, and their full consent
history. This is the file to send if they've asked for a copy of their data."

**Filenames carry no personal data.** Filtered view: `gpc-members-2026-08-18-216-records.csv`.
Single member: `gpc-member-8f2c4a1b-2026-08-18.csv` — the record uuid, never a name or email. A
filename appears in the Downloads shelf, in file pickers, in screen shares, and in any subsequent
email attachment; it is a leak surface and is treated as one.

**Contents.**
- CSV, filtered view: one row per member, one column per question, plus identity columns and consent
  columns (per purpose: decision, version, UTC timestamp, capture method). Multi-select answers are
  semicolon-joined inside a single quoted cell. Retired options export their historical label. A
  header row uses the question's current label, and the first line of the file is a comment row
  stating the export date and the filters applied.
- JSON, single member: the complete record including the full append-only consent history as an
  array, with UTC timestamps in ISO-8601 and a `Z` suffix. This is the shape to hand to a member
  exercising portability.

**After the download.** The dialog closes, focus returns to the button that opened it, and a toast
plus polite live-region announcement fires: **"Downloaded 216 member records."** / **"Downloaded 1
member record."** — never a name. If serialisation fails, the dialog stays open and shows an inline
`role="alert"`: **"We couldn't build that file."** + the message + a **"Try again"** button; nothing
is downloaded and no partial file is written.

### Named States (export dialog)

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Button pressed | Dialog as drawn, CSV pre-selected | `role="dialog" aria-modal="true"` + `aria-labelledby` on the `<h2>`; focus moves to the heading; focus trapped; Escape closes |
| **Loading** | "Download" pressed, file being built | Download button shows a spinner and reads **"Building the file…"**; both buttons `disabled`; the format radios `disabled` | `aria-busy="true"` on the dialog; `role="status"` announces "Building the file." |
| **Empty** | N/A — the dialog cannot be opened with zero matching rows; the trigger is `disabled` in that state, so an empty export is unreachable by design | — | — |
| **Error** | Serialisation or fetch fails | Inline red banner inside the dialog: "We couldn't build that file." + message + "Try again". Dialog stays open. | `role="alert"` on the banner; focus moves to "Try again" |
| **Success** | File written to disk | Dialog closes; toast + live region as above | Focus returns to the triggering button; `role="status"` announcement |
| **Disabled** | (a) The trigger, when 0 rows match or the page is loading; (b) both dialog buttons while building | Dimmed to 50%; the trigger carries `aria-describedby` → "There's nothing to export with these filters." | `disabled` attribute (genuinely inert), plus `aria-describedby` — `title` alone is not announced reliably |

### Interactions & Animations (export dialog)

| Interaction | Behavior | Timing | prefers-reduced-motion |
|---|---|---|---|
| Open | Backdrop fades; panel fades and rises 8px | 200ms ease-out | Both removed; panel appears in place |
| Close (Escape, ✕, Cancel, backdrop click) | Reverse | 150ms | Removed |
| Format radio change | Selection moves | Instant | Unchanged |
| "Download" | Spinner in the button | Indeterminate | Spinner is a rotating element; under reduced motion, substitute a static "Building the file…" label with no spin |

### Accessibility Annotations (export dialog)

- **Heading level:** `<h2>` inside the dialog, referenced by `aria-labelledby`. The body paragraph is
  referenced by `aria-describedby` so the warning is spoken on open, not merely displayed.
- **Landmark role:** `role="dialog"` with `aria-modal="true"`. **No modal on this site is currently a
  real dialog** — no role, no `aria-modal`, no focus trap, no Escape handling. This is where that
  stops.
- **Focus management:** focus moves to the dialog heading on open; a trap keeps Tab inside; Escape and
  every close affordance return focus to the trigger. Background content receives `inert` (or
  `aria-hidden`) while the dialog is open.
- **Screen-reader notes:** the format choice is a real `<fieldset>` with a `<legend>` "Format" and two
  associated radios with `htmlFor`/`id`. The JSON option's help text is tied to it with
  `aria-describedby`, not left as adjacent grey text.
- **Keyboard operation:** Tab cycles heading → radios (arrow keys within the group) → Download →
  Cancel → ✕ → back to heading. Enter activates Download. Escape cancels. All targets ≥ 44 × 44px.
- **Contrast:** dialog panel is white on a `rgba(45,27,78,0.5)` backdrop; the Download button is
  `#c9107f` with white text (5.43:1); Cancel is an outline button with `#1a1a2e` text.

---

## Gaps found

1. **The admin shell does not fit 320px.** `AdminLayout` renders a fixed `w-64` (256px) `shrink-0`
   sidebar, leaving 64px of content at 320px. No admin page in this section can meet the
   no-horizontal-scroll rule until that sidebar collapses to a top bar with a menu button below
   `md:`. This is a change to a shared existing component, outside this section's nominal scope, and
   needs a decision: fix the shell, or formally scope admin pages to ≥ 768px. Ash's stated context is
   a laptop, so scoping is defensible — but it should be a recorded decision, not an accident.
2. **The "Interested in" cross-filter on Insights exceeds FR-014.** FR-014 names only a group filter.
   The event-type cross-filter is what turns Journey B from a chart page into a decision, and it is
   specified above on that basis — but it is a scope addition and needs PM confirmation. If it is cut,
   the answer card must be reworded to say plainly that it is the best slot for *everyone*, not for
   the event being planned.
3. **Erased members are unfindable by design, and no requirement covers the consequence.** FR-023
   keeps only "a minimal non-identifying record of the erasure", so Ash cannot answer "did you ever
   hold my data, and did you delete it?" — search returns nothing either way. Needs a controller
   decision: either accept it and standardise the reply wording, or keep a one-way hash of the email
   in the erasure record so a lookup can confirm an erasure without re-identifying anyone. The second
   is itself processing and needs disclosing under FR-024.
4. **Single-member export format is undecided.** FR-013 says "a portable format" without naming one.
   This draft offers CSV and JSON with JSON recommended for portability requests. Confirm, and confirm
   whether a member-facing copy should be a rendered PDF instead — several DSAR responses in practice
   are.
5. **The three time-slot labels are unknown.** The Tally extraction records 21 options as "7 days × 3
   slots" without naming the slots. This draft assumes Morning / Afternoon / Evening. Insights labels
   must match the form's option labels exactly, including after an admin renames them under FR-008 —
   which also means insights must read labels from the form configuration, not from a hard-coded list.
6. **A question whose wording changed mid-collection has no defined presentation.** FR-008 lets an
   admin rewrite a question's label at any time, and FR-008's own criterion protects retired *options*
   — but nothing covers what Insights shows when the *question* text changed between two cohorts of
   respondents. Options: aggregate anyway and show the current label (simple, slightly dishonest), or
   note "wording changed on <date>" on the block (honest, more work). Needs a decision before FR-014
   is built.
7. **Whether the members list should show email at all.** This draft shows it, because search is by
   email and Ash needs to confirm she has the right person — but it puts up to 100 email addresses on
   screen at once on a laptop that may be in a café. An alternative is to show it only on the detail
   page and only reveal it in the list when the search term matched it. Needs a call; relates to
   FR-D05 (read audit), which is deferred.
8. **Addendum Q7 (last name) changes the Member column.** With first name only, "Sarah" is not an
   identifier at 1,000 records. This draft mitigates with business name and email on the second line.
   If Q7 resolves toward collecting a last name, the list's primary line and the search behaviour
   both change.
9. **Nothing covers what happens to an exported file.** FR-013 delivers the download; no requirement
   states a retention expectation for the file afterwards, and the confirmation copy above ("delete it
   when you're done with it") is currently the only control. If GPC wants more than an instruction,
   that is a new requirement.
