# EXPERIENCE.md — Section: Public Business Directory

**Status:** Draft for merge into `EXPERIENCE.md`
**Covers:** FR-018 (index), FR-019 (search & filter), FR-020 (detail & enquiry), NFR-008 (WCAG 2.1 AA), NFR-009 (mobile performance)
**Epic:** EPIC-006 · **Stories:** STORY-027, STORY-028, STORY-029, STORY-030
**Primary persona:** Priya — public visitor, local parent, phone, no account, low patience
**Sources:** `prd.md`, `addendum.md`, `ux-shared-context.md`, `inputs/tally-form-RG1M6K-structure.md`, and the live code at `src/pages/WhatsOn.jsx`, `src/components/whatson/EventFilters.jsx`, `src/pages/Events.jsx`, `src/components/layout/Navbar.jsx`, `src/components/layout/Layout.jsx`, `src/components/ui/*`

> Journey and screen numbering is local to this section; reconcile at merge with the intake and moderation sections.

---

## Route map (proposed)

| Route | Screen | Public | Notes |
|---|---|---|---|
| `/directory` | Directory index | ✅ | Filter state carried in the query string: `?q=` and `?category=` |
| `/directory/:slug` | Listing detail | ✅ | Renders the detail screen when a published listing matches |
| `/directory/:slug` (no published match) | Listing no-longer-available | ✅ | Same route, different resolved state. Also the de-facto catch-all for `/directory/anything` |

All three sit inside the existing `<Layout>` route group (`src/App.jsx:48-59`), so they inherit `<Navbar>`, `<main id="main-content">`, `<Footer>` and the existing skip link.

**URL shape is a genuine gap** — the PRD assumes a shareable listing URL (FR-020: *"when the old URL is opened"*) but never defines it. See Gaps found #5.

---

## Navigation placement

**One change, one array:** `src/components/layout/Navbar.jsx:8-14`.

```
const navLinks = [
  { to: '/',           label: 'Home' },
  { to: '/about',      label: 'About' },
  { to: '/events',     label: 'Our Events' },
  { to: '/whats-on',   label: "What's On" },
  { to: '/directory',  label: 'Directory' },   ← NEW, 5th position
  { to: '/volunteers', label: 'Volunteers' },
]
```

**Why 5th, after "What's On":** the array reads as *organisation → things to do → get involved*. `/whats-on` and `/directory` are both "find something near me" surfaces and belong adjacent; `Volunteers` and `About` are about GPC itself. Placing Directory before Volunteers also keeps it above the fold in the mobile drawer, which is where Priya will look after landing from an Instagram bio link that dropped her on the homepage.

**Why the label is "Directory" and not "Local businesses":** two words is one word too many for a 320px nav row, and — per the Q1 tension below — the page cannot honestly promise "local" at the level of an individual business. "Directory" is the word the source Tally form already uses with members ("local member directory"), so it is the word they will look for. The `<h1>` carries the fuller, honest framing.

Six items fit the existing desktop nav (`text-sm font-semibold`, `px-1`) without wrapping at 1024px. The mobile drawer is a vertical list and is unaffected by count.

**Footer:** FR-018 requires only "reachable from the site's main navigation", which the nav array satisfies. The footer currently carries policy links only (`Footer.jsx:22-26`) and has no page-link column; adding one is a larger footer change than this section owns — flagged, not decided (Gaps found #14).

**Coordination note:** if the intake section also adds `/join` to the public nav, it should be a `Button`-styled CTA sitting to the right of the nav row, not a seventh `NavItem` — seven text links wrap at 1024px. That decision belongs to the intake section; noted here so the two sections do not both edit the same array in conflicting ways.

---

## Journey D-1 — "Priya finds a local photographer and enquires"

**Goal:** Priya wants newborn photos taken by someone the GPC community vouches for. She wants to go from a link to a real human's contact details without creating an account, without reading anything long, and without a dead end.

**Primary persona:** Priya — public visitor. Local parent, arriving cold from Instagram or the weekly newsletter, on a phone, one-handed, likely to abandon inside 15 seconds if the page looks empty or broken. Has no account and never will.

**Secondary beneficiary:** Bea — Business Mum. Every screen in this journey is also Bea's evidence that being listed was worth filling in the form, and that being listed cost her no privacy (STORY-030).

**Estimated time:** 45–90 seconds from tap to enquiry initiated. Budget: ≤3s to interactive (NFR-009), ~10s scanning, ~5s search, ~15s reading a listing, ~20s composing the first line of an email.

**Entry points:**
1. Instagram bio link or story sticker → `/directory` (or a pre-filtered `/directory?category=photography` if GPC posts about a category)
2. Weekly newsletter link → `/directory`
3. Main nav "Directory" from any page (most often from `/` or `/whats-on`)
4. A member sharing her own listing URL → `/directory/:slug` directly, skipping the index entirely
5. Search engine result on a listing detail page → `/directory/:slug`
6. Word of mouth: "it's on the GPC site" → homepage → nav

Entry points 4 and 5 land *on a detail page first*. That is why the detail page must stand alone — it needs its own route back into the directory and its own explanation of what GPC is, not just a back button.

**Success criteria:**
- Priya reaches a listing detail page within 3 taps of arriving.
- She initiates contact (opens her mail client, dials, or copies the address) without ever being asked to register, log in, or accept anything.
- She never sees a member's name, signup email or postcode (FR-011, NFR-001).
- If the directory has nothing for her, she leaves understanding *why* it is thin rather than concluding the site is broken.
- A shared or bookmarked filtered URL reproduces the same view (FR-019).

### Happy Path

```
   Instagram story / newsletter link
                │
                ▼
   ┌──────────────────────────────────────┐
   │  GET /directory                      │
   │  Shell paints (h1 + intro + filter   │  ← LCP is static text; no
   │  bar) before data resolves           │    image, no blocking fetch
   └──────────────┬───────────────────────┘
                  │  one request, all published listings
                  ▼
   ┌──────────────────────────────────────┐
   │  Skeleton cards → 47 cards render    │
   │  status: "47 businesses"             │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │  Priya types "photog" in Search      │
   │  · filtering is instant, client-side │
   │  · URL replaced → ?q=photog          │
   │  · after 400ms idle, status reads    │
   │    "2 businesses match"              │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │  2 cards. Each shows: name,          │
   │  category badge, 3 lines of          │
   │  description, link-presence icons    │
   └──────────────┬───────────────────────┘
                  │  taps the card (whole card is one link)
                  ▼
   ┌──────────────────────────────────────┐
   │  GET /directory/sarah-jones-photo    │
   │  focus moves to <h1>, scroll to top  │
   │  Detail: name · category · full      │
   │  description · Website · Instagram   │
   │  · "Get in touch" contact            │
   │  · "We don't publish locations —     │
   │     ask when you enquire."           │
   └──────────────┬───────────────────────┘
                  │
        ┌─────────┼──────────┬─────────────┐
        ▼         ▼          ▼             ▼
   ┌─────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
   │ Email / │ │ Copy   │ │Website │ │Instagram │
   │ call    │ │ address│ │new tab │ │ new tab  │
   │(leaves) │ │"Copied"│ │        │ │          │
   └─────────┘ └───┬────┘ └────────┘ └──────────┘
                   │
                   ▼
              ENQUIRY MADE ✓
                   │
                   │  Back
                   ▼
   ┌──────────────────────────────────────┐
   │  /directory?q=photog restored,       │
   │  focus returns to the card she left  │
   └──────────────────────────────────────┘
```

### Decision Points & Alternative Paths

| Trigger | Display | Recovery |
|---|---|---|
| Directory has **zero** published listings (the launch condition) | Empty state A: heading "The directory is just getting started", body explaining what it will be, primary CTA "List your business — it's free" → `/join`, secondary link "See what's on locally instead" → `/whats-on`. Search and category controls are rendered but **dimmed and disabled**, so the shape of the page is visible. | Two live routes off the page. Neither is a dead end. Bea, arriving from the same Instagram post, can be listing #1 in two taps. |
| Directory has **1–3** published listings | Default (sparse) variant: the real cards render, followed by a dashed-border invitation card in the last grid cell: "Is your business missing? / Any GPC member can be listed, free." + Button → `/join`. No apology, no "coming soon" banner. | The grid never looks broken at N=1. The invitation card is a `Card` with a dashed border so it reads as an affordance, not a listing. |
| Priya's search matches nothing | Empty state B: "No matches", body "Nothing matches 'photograper' in Photography. Try a shorter word — or clear the filters and browse everything." Primary Button "Clear filters"; secondary text link "Browse all 47 businesses". | One tap back to the full set. The typed term is echoed **as plain text, truncated at 60 characters** — never re-parsed, never linkified. |
| Priya picks a category that has listings, then types a term that eliminates them all | Same Empty state B, but the body names both active constraints so she can see which one to relax: "…matches 'wedding' in Childcare." | "Clear filters" resets both. She can also just change the category select — filters are flat and independent (WhatsOn convention). |
| A shared URL carries `?category=` naming a category that does not exist | Results render **unfiltered**, and a dismissible note appears above them: "We couldn't find that category, so we're showing everything." The bad parameter is dropped from the URL via `replace`. The unknown value is **not** echoed back to the visitor. | She is browsing, not stuck. One fewer dead end than a strict "no results" would give. |
| The fetch fails (offline, Supabase down, 5xx) | Error state in place of the grid: "We couldn't load the directory. / Something went wrong at our end — it isn't you. Try again in a moment." + Button "Try again". Filter controls stay visible but disabled. | "Try again" re-runs the fetch without a full page reload. |
| Priya opens a listing URL that has been unpublished (shared weeks ago, member since withdrawn) | The "no longer listed" screen, not a broken page and not a blank one: "This listing isn't in the directory / It may have been removed, or the link may be wrong." + "Browse the directory" + "Go to the homepage". `noindex` is set. | Two routes onward. The slug is never echoed. Nothing reveals whether the listing ever existed — which matters, because "this member withdrew" is itself information about a member. |
| Priya taps a listing whose owner gave no website and no Instagram | Detail renders with the links section simply absent — no empty rows, no "Not provided" placeholders. The enquiry contact is always present (required at submission, FR-003). | Nothing to recover from. Absence is silent by design. |
| Priya's phone has no mail client configured, so `mailto:` does nothing | Every email contact is accompanied by a "Copy address" button (44×44) which writes to the clipboard and shows "Copied ✓" for 2 seconds, announced politely. The address is also plain selectable text. | Three ways to get the address: tap, copy, select. |
| Clipboard API unavailable (non-secure context, old iOS webview) | "Copy address" renders in the disabled treatment with `aria-disabled="true"` and a hint: "Select the address above to copy it." | The address remains selectable text, so the task is still completable. |
| Priya wants someone *near her* | Nothing on any screen answers this. The intro line and the enquiry block both say so out loud: "We don't publish business locations — if you need someone nearby, ask when you get in touch." | **This is a real, unrecoverable gap, not a UX bug.** See Gaps found #1. |
| Priya wants to browse but there are 47 listings and no ordering control | The first 24 render, "Show 23 more" appends the rest. Sort options are deferred (FR-D09). Default order needs a decision — see Gaps found #10. | Search and category are the discovery mechanism at this volume; ordering only starts to matter past ~50 listings. |

### Drop-off Risk Notes

**The empty directory is the single biggest risk in this journey, and it is a certainty, not a possibility.** On launch day the directory will have zero listings, and for some weeks after it will have a handful. Priya arriving from an Instagram post to a blank page concludes GPC is disorganised; Bea arriving to a blank page concludes nobody else joined and quietly declines to be first. That second failure is self-reinforcing — a directory that looks abandoned stays abandoned. This is why the empty state gets real, specific, non-apologetic copy and a live route to `/join`, and why the sparse variant (1–3 listings) ships an invitation card rather than a lonely grid. It is also why the filter controls are *rendered and disabled* rather than hidden: seeing a category select that says "Photography (0), Childcare (0), Coaching (0)" tells both visitors what this page is going to be, which a blank page cannot.

**The location gap costs enquiries, and the cost is invisible in the metrics.** Priya will read a listing, like it, and then have no way to know whether the photographer is ten minutes away or in Croydon. Some proportion of visitors will simply not send that email rather than send one that might waste both people's time. This does not show up as a bounce; it shows up as a listing that "never got any enquiries", which members will read as the directory not working. The mitigation in this design is honesty — telling Priya explicitly that she must ask, so that asking feels like the intended step rather than an omission she has to work around. It is a mitigation, not a fix.

**Search is net-new on this site and has no forgiveness built in anywhere else to copy.** Priya types on a phone, one-handed, and will produce "photograper", "photo grapher" and "fotografer". Substring matching over name + category + description catches "photo" and "photog" but none of the misspellings. Deliberately, no fuzzy-matching library is introduced (NFR-012 — zero new runtime dependencies without a logged decision), so the recovery route is the no-results copy telling her to try a *shorter* word, plus the category select as the spelling-free path. The category filter is therefore not a secondary convenience — it is the primary defence against search failure, which is an argument for putting it directly under the search field rather than behind a "Filters" disclosure.

**Card-to-detail is the moment most likely to break on a phone.** The existing `LondonEventCard` is a `<div onClick>` — keyboard-unreachable, no focus ring, and on iOS a click handler on a large div competes with scroll-momentum taps, producing accidental navigations while scrolling. The directory card must be a real anchor, and the whole-card target must come from a stretched link rather than a wrapper click handler. Getting this wrong produces the worst kind of drop-off: Priya scrolls, lands somewhere she did not choose, hits Back, loses her place, and leaves.

**Losing her place on Back is a quiet killer.** React Router v7 does not restore scroll or focus on its own, and this codebase has no `ScrollRestoration` anywhere. Without the explicit focus-and-scroll handling specified below, Priya opens listing 6 of 12, backs out, and finds herself at the top of an unfiltered list. On a 320px screen that is roughly six card-heights of re-scrolling to get back — enough friction to end the session.

**Every keystroke that hits the network is a keystroke that fails on 4G.** The postcode field in `EventFilters.jsx` debounces at 600ms because it calls a geocoding API. If the directory copied that shape for text search, Priya would type five characters and wait roughly three seconds spread across five stalls. Fetching all published listings once and filtering in memory removes the network from the typing loop entirely — the difference between a search that feels instant and one that feels broken.

**iOS auto-zoom on focus is a horizontal-scroll bug in disguise.** The existing postcode input uses `text-xs`; any input under 16px triggers Safari's zoom-on-focus, which leaves the page zoomed and horizontally scrollable after the keyboard dismisses. On the directory's search field this would fire on the very first interaction of the journey. The search input is specified at ≥16px for this reason alone.

---

## Screen D-A — Directory index (`/directory`)

**Purpose:** Let a visitor with no account see every published member business and narrow it to the one kind of help she needs, in under a minute, on a phone, on mobile data. Secondarily: prove to prospective members that being listed is worth it.

**Entry from:** Main nav "Directory" · Instagram / newsletter links (sometimes pre-filtered) · the listing detail page's back link · the "no longer listed" page · the `/join` confirmation state (a member checking the directory she just applied to) · browser bookmark of a filtered URL.

**Exits to:** `/directory/:slug` (a listing) · `/join` (from the empty state, the sparse invitation card, and the footer CTA) · `/whats-on` (empty-state secondary) · external nothing — the index publishes no outbound business links (see Component Hierarchy #7).

### Layout Wireframe (mobile-first, 320px)

```
┌────────────────────────────────────────┐
│ ☰   Greenwich Parents & Carers      IG │  existing Navbar, 64px
├────────────────────────────────────────┤
│                                        │
│  Directory                             │  eyebrow, text-sm, #c9107f
│  Member businesses                     │  h1  text-3xl font-heading
│                                        │
│  Businesses and services run by        │  text-base, #1a1a2e
│  Greenwich Parents & Carers members.   │
│                                        │
│  We don't publish business locations   │  text-sm, gray-600
│  — if you need someone nearby, ask     │
│  when you get in touch.                │
│                                        │
├────────────────────────────────────────┤
│  ┌──────────────────────────────────┐  │  <h2 class="sr-only">Find a
│  │ Search                           │  │       business</h2>
│  │ ┌──────────────────────────────┐ │  │  <label for="dir-search">
│  │ │🔍 Try 'photographer' or a  ⊗ │ │  │  48px tall, 16px text
│  │ │   business name              │ │  │  ⊗ = 44×44 clear button
│  │ └──────────────────────────────┘ │  │
│  │                                  │  │
│  │ Category                         │  │  <label for="dir-category">
│  │ ┌──────────────────────────────┐ │  │
│  │ │ All categories             ▾ │ │  │  48px tall, full width
│  │ └──────────────────────────────┘ │  │
│  │                                  │  │
│  │                  [ Clear filters]│  │  44px, right-aligned
│  └──────────────────────────────────┘  │
├────────────────────────────────────────┤
│  47 businesses                         │  role="status" aria-live
│                                        │  aria-atomic, always present
│ ┌────────────────────────────────────┐ │
│ │ ┌────┐                             │ │  Card, rounded-2xl, p-5
│ │ │ S  │  Sarah Jones Photography    │ │  48px initial tile (decor.)
│ │ └────┘                             │ │  h3 > a  (stretched link)
│ │                                    │ │
│ │  ▐ PHOTOGRAPHY ▌                   │ │  Badge variant "category"
│ │                                    │ │
│ │  Relaxed newborn and family        │ │  description, 3-line clamp
│ │  photography at home. Evening      │ │  plain text only
│ │  and weekend sessions…             │ │
│ │                                    │ │
│ │  🌐 Website   ⌾ Instagram   ✉ Email│ │  presence indicators only —
│ └────────────────────────────────────┘ │  NOT links (see #7)
│                                        │  gap-6
│ ┌────────────────────────────────────┐ │
│ │ …next card…                        │ │
│ └────────────────────────────────────┘ │
│                                        │
│          [    Show 23 more    ]        │  48px, centred
│                                        │
├────────────────────────────────────────┤
│  Run a business?                       │  closing CTA band
│  Any GPC member can be listed, free.   │
│  [       List your business       ]    │  → /join
├────────────────────────────────────────┤
│  existing Footer                       │
└────────────────────────────────────────┘
```

**Empty state A — nothing published yet (the launch condition):**

```
├────────────────────────────────────────┤
│  ┌──────────────────────────────────┐  │
│  │ Search                           │  │  both controls rendered,
│  │ ┌──────────────────────────────┐ │  │  DISABLED and dimmed —
│  │ │🔍 Try 'photographer' or a…   │ │  │  never hidden
│  │ └──────────────────────────────┘ │  │  (WhatsOn radius precedent)
│  │ Category                         │  │
│  │ ┌──────────────────────────────┐ │  │
│  │ │ All categories             ▾ │ │  │
│  │ └──────────────────────────────┘ │  │
│  └──────────────────────────────────┘  │
├────────────────────────────────────────┤
│                                        │
│            ┌──────────┐                │  decorative mark, aria-hidden
│            │    ✦     │                │  #fc16a0 on tinted circle
│            └──────────┘                │
│                                        │
│  The directory is just getting         │  h2, text-2xl
│  started                               │
│                                        │
│  There aren't any businesses listed    │  text-base
│  yet. This is where you'll find        │
│  photographers, childminders, coaches, │
│  bakers and therapists — all run by    │
│  Greenwich Parents & Carers members.   │
│                                        │
│  If that's you, you can be the first.  │
│  Listing is free and takes about five  │
│  minutes.                              │
│                                        │
│  [     List your business      ]       │  primary Button → /join
│                                        │
│  See what's on locally instead →       │  text link → /whats-on
│                                        │
└────────────────────────────────────────┘
```

**Empty state B — filters match nothing:**

```
│  No businesses match                   │  role="status" text
│                                        │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  │  No matches                      │  │  h2, text-xl
│  │                                  │  │
│  │  Nothing matches "photograper"   │  │  q echoed as plain text,
│  │  in Photography.                 │  │  truncated at 60 chars
│  │                                  │  │
│  │  Try a shorter word — or clear   │  │
│  │  the filters and browse          │  │
│  │  everything.                     │  │
│  │                                  │  │
│  │  [      Clear filters      ]     │  │  primary Button
│  │                                  │  │
│  │  Browse all 47 businesses →      │  │  text link
│  └──────────────────────────────────┘  │
```

**Tablet / Desktop variations (differences only):**

- **768px (`md:`)** — the filter bar becomes one row: search input flex-grows, category select fixed at ~200px, "Clear filters" trailing right, matching the `md:flex md:flex-wrap md:items-center gap-3` shape of `EventFilters.jsx`. Card grid goes `md:grid-cols-2 gap-8` (the `Events.jsx` convention). Page padding moves to the site container `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`. The intro paragraph is capped at `max-w-2xl` so the measure stays readable.
- **1024px (`lg:`)** — grid goes to 3 columns. The results count line and the filter bar sit on the same row, count right-aligned. Nothing else changes; `xl:` is not used anywhere on this site and is not introduced here.
- **1440px** — no change. The `max-w-7xl` container centres and the grid stays at 3 columns; a 4th column would drop the description to two lines and make cards read as tiles rather than entries.
- **Hover affordances** (`md:` and up only, and only where a pointer exists): card shadow lift. No hover-only information anywhere — every card's full content is visible without hovering, per FR-001's "no hover-only control" principle applied to the public pages too.

### Component Hierarchy

1. **`DirectoryPage`** **NEW** — route component. Owns the single fetch, the flat filter state object `{ q, category }` (the `WhatsOn.jsx:34-45` `defaultFilters` shape), the render slice size, and the URL sync. Sets `document.title = 'Member Business Directory | Greenwich Parents & Carers'` in a `useEffect`, matching `Events.jsx:14-16`.
2. **`DirectoryHero`** **NEW** — eyebrow + `<h1>` + intro + the location-honesty line. Deliberately **not** `SectionHeading`, which always renders an `<h2>` and cannot serve as a page `<h1>` (shared context). Uses the same type scale (`text-3xl md:text-4xl font-heading font-bold text-dark`) so it reads as the same family.
3. **`DirectoryFilters`** **NEW** — presentational, controlled, `{ filters, onChange, categories, disabled }`. Mirrors the `EventFilters` contract exactly (`onChange` receives a whole new flat filters object; no internal filter state except the raw text input value). Contains:
   1. **`SearchField`** **NEW** — visible `<label htmlFor="dir-search">`, `<input id="dir-search" type="search">`, magnifier icon (`aria-hidden`), and the clear button.
   2. **`ClearButton`** **NEW** (in-field ⊗) — 44×44, `aria-label="Clear search"`. Rendered only when the field has text, following the identical `clearPostcode` affordance at `EventFilters.jsx:167-174`. *This is the one place the "dimmed and disabled, never hidden" rule is not applied, because a permanently-present dead 44×44 target inside the input is worse for touch and for screen readers than an appearing one; the rule is applied to every control that filters.*
   3. **Category `<select>`** — `<label htmlFor="dir-category">`, reusing the `selectClass` idiom from `EventFilters.jsx:48` but with `text-base` (16px) instead of `text-sm` and `placeholder-gray-500` instead of `gray-400`.
   4. **"Clear filters" `Button`** — existing `Button`, `variant="secondary"`, with the **NEW** `aria-disabled` + inactive styling extension described in Named States → Disabled.
4. **`ResultsStatus`** **NEW** — the always-mounted `role="status" aria-live="polite" aria-atomic="true"` region. Follows the site's only existing live region, `NewsletterBanner.jsx`. Mounted on first render with empty text; only its text content changes, because a live region inserted into the DOM together with its content is not reliably announced.
5. **`DirectoryGrid`** **NEW** — `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8`, per `Events.jsx:66`.
6. **`ListingCard`** **NEW** — wraps the existing **`Card`** primitive (which has no internal padding; this consumer adds `p-5 md:p-6`). Contains:
   1. `InitialTile` **NEW** — 48×48 `rounded-xl`, `#fc16a0` at 12% tint, the business name's first character in `#2d1b4e` `font-heading`. `aria-hidden="true"` — it is redundant with the name beside it. **This exists because the directory ships with no images at all** (FR-D02 deferred), and it gives each card visual identity at zero network cost.
   2. `<h3>` containing the **stretched link** to `/directory/:slug`. The anchor's accessible name is the business name; a visually-hidden suffix adds the category (`"Sarah Jones Photography, Photography"`) so a screen-reader link list is unambiguous.
   3. Existing **`Badge`**, requiring a **NEW `category` variant**. The existing variants are event-flavoured (`free|sold-out|new|upcoming|past`) and the `upcoming` variant paints white on `#fc16a0` at `text-xs font-bold` — 3.64:1, which **fails AA for 12px text**. The new variant must fill with `#c9107f` (5.43:1 with white). Flagged in Gaps found #8 as a `DESIGN.md` item.
   4. Description, clamped to 3 lines. Rendered as **plain text only** (FR-020) — no markdown, no `dangerouslySetInnerHTML`, no auto-linking of URLs found in the text.
   5. `LinkPresenceRow` **NEW** — see #7.
7. **`LinkPresenceRow`** **NEW** — small icons indicating that this business has a website / an Instagram / an enquiry contact. **These are indicators, not links.** Two reasons: (a) FR-018 specifies the card shows "the presence of links", not the links; (b) a live `mailto:` on the index would publish every member's enquiry address on one scrapeable page, which converts a moderated directory into a harvestable address list. Each icon is `aria-hidden` and paired with visually-hidden text: "Has a website", "On Instagram", "Accepts enquiries".
8. **`ShowMoreButton`** — existing **`Button`**, `variant="secondary"`. Label is explicit about the remainder: "Show 23 more". Follows the `PAGE_SIZE` + "Show N more" + reset-on-filter-change idiom from `SubscribersManager.jsx`, with `PAGE_SIZE = 24` (divisible by 1, 2 and 3 columns so no ragged final row).
9. **`DirectoryEmptyState`** **NEW** — takes a `reason` of `'no-listings' | 'no-matches'` and renders empty state A or B. Kept as one component so the two can never drift into contradicting each other.
10. **`DirectoryErrorState`** **NEW** — `role="alert"` panel with the retry `Button`.
11. **`SkeletonCard`** **NEW** — `aria-hidden="true"` placeholder matching the real card's height so the grid does not reflow when data arrives (CLS ≈ 0). Six are rendered on load.
12. **`JoinInvitationCard`** **NEW** — the dashed-border `Card` appended to the grid when fewer than 4 listings are published, and the closing CTA band beneath the grid at all volumes. Uses the existing `Button` with the AA-safe primary fill (Gaps found #8).

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Fetch resolved, ≥1 published listing, no active filter | Hero, enabled filter bar, count line "47 businesses", grid of up to 24 cards, "Show N more" if more remain, closing CTA band | Results wrapper is `<section aria-labelledby="results-heading">` with a visually-hidden `<h2 id="results-heading">Businesses</h2>` and `aria-busy="false"`. `ResultsStatus` text = "47 businesses". |
| **Default (sparse, 1–3 listings)** | Fetch resolved, 1–3 published listings | As Default, plus `JoinInvitationCard` as the final grid cell. Category select still lists every active category, with the zero-count ones as disabled options. | Identical. The invitation card is a `<article>` with its own `<h3>`, so it is not mistaken for a listing in a heading list. |
| **Loading** | Route mounted, fetch in flight | Hero and filter bar paint immediately from the shell (they need no data). Filter controls disabled. Six `SkeletonCard`s. No spinner — the `animate-spin` idiom is not used here because a skeleton grid communicates the shape of what is coming and a spinner does not. | `aria-busy="true"` on the results section; skeletons `aria-hidden="true"`; `ResultsStatus` text = "Loading businesses…". Screen reader hears one polite announcement, then the resolved count. |
| **Empty (A — nothing published)** | Fetch resolved, 0 published listings | Full empty state A above: decorative mark, "The directory is just getting started", two-paragraph body, primary CTA to `/join`, secondary link to `/whats-on`. Filter controls rendered, dimmed, disabled. | Empty state is a `<section>` with its own `<h2>`. `ResultsStatus` text = "No businesses are listed yet." Disabled controls carry `aria-describedby` pointing at the empty-state heading so a screen-reader user who tabs to the search field hears *why* it is unavailable. |
| **Empty (B — no matches)** | Fetch resolved, ≥1 published listing, active filters match 0 | Empty state B above. The searched term is echoed as plain text truncated at 60 characters; an unknown category value is **never** echoed. | `ResultsStatus` text = "No businesses match." The panel has `<h2>No matches</h2>`. Focus is **not** moved — Priya is still typing, and stealing focus mid-keystroke would close her keyboard. |
| **Error** | Fetch rejects, times out, or returns non-2xx | "We couldn't load the directory. / Something went wrong at our end — it isn't you. Try again in a moment." + `Button` "Try again". Filter bar visible but disabled. No listing data is shown, even stale. | Panel is `role="alert"` (assertive — the page has no content, so interrupting is correct). Retry button is the first tab stop after the filter bar. On a successful retry, `ResultsStatus` announces the resolved count. |
| **Success** | An applied filter or search resolves to ≥1 result (this is the state Priya's search produces) | Grid updates in place. Count line changes to "12 of 47 businesses match". No toast, no banner, no motion — the result *is* the feedback. | `ResultsStatus` text = "12 businesses match." / "1 business matches." (singular handled). Announcement is debounced 400ms after the last keystroke so a fast typist triggers one announcement, not seven. Category changes announce immediately (a select change is a discrete act, not a stream). |
| **Disabled** | (a) 0 published listings → search input and category select disabled. (b) A category with 0 published listings → that `<option disabled>` shows "Photography (0)". (c) No active filter → "Clear filters" inactive. | (a) and (b) use the real `disabled` attribute, matching the radius-select precedent at `EventFilters.jsx:186-188`. (c) uses `aria-disabled="true"` and remains focusable with a no-op activation, so a keyboard user can reach it and hear that there is nothing to clear. Disabled treatment is `bg-gray-100 text-gray-500 border-gray-200` (4.83:1), **not** the existing `opacity-40` — WCAG exempts inactive controls from contrast, but on the launch-day empty page these controls are the main thing on screen, so they are held to the readable standard anyway. | `disabled` for (a)/(b); `aria-disabled` for (c); both carry `aria-describedby` to the sentence explaining the reason. Disabled `<option>` elements with "(0)" counts are deliberate: at launch they show a visitor what the directory is *for*, which a filtered-down-to-nothing select cannot. |

### Interactions & Animations

| Interaction | Behavior | Timing | `prefers-reduced-motion` |
|---|---|---|---|
| Page load → data arrives | Skeleton cards cross-fade into real cards; grid height is unchanged (skeletons reserve it) | 200ms fade | No cross-fade; skeletons are replaced instantly |
| Card entrance | Fade-in, `opacity 0 → 1`, staggered `delay: min(index, 5) × 0.06s` — **capped at 6**, unlike `Events.jsx`'s uncapped `i * 0.1` which would take 10 seconds to reveal 100 cards | 400ms per card, ≤360ms total stagger | No fade, no stagger; cards render at full opacity immediately |
| Cards re-render after a filter change | **No entrance animation.** Animation runs on first mount only. Re-animating 40 cards on every keystroke is both janky and a motion-sensitivity problem | — | Same (already none) |
| Typing in Search | Results filter on every keystroke (client-side, no network). URL updated with `replace`, and the live-region text updated, both debounced | Filtering: immediate. URL + announcement: 400ms idle. *(Not the 600ms of `EventFilters`' postcode field — that debounce exists to throttle a geocoding API call; here there is no network in the loop, so the debounce only exists to avoid spamming the live region and the history entry.)* | Unaffected — no motion involved |
| Enter pressed in Search | Nothing submits. The input blurs so the iOS keyboard drops and the results become visible | Immediate | Unaffected |
| Tapping ⊗ clear | Search text cleared, full set restored, focus returned to the search input (keyboard stays up so she can retype) | Immediate | Unaffected |
| Changing Category | Results filter, URL replaced, announcement fires immediately (no debounce) | Immediate | Unaffected |
| "Clear filters" | `q` and `category` reset, both params dropped from the URL, render slice reset to 24, focus moves to the search input, count announced | Immediate | Unaffected |
| Card hover (pointer devices ≥768px) | `shadow-md → shadow-lg` (already in the `Card` primitive) plus a 2px upward translate | 150ms ease-out | Shadow change only; no translate |
| Card focus (keyboard) | 2px `#fc16a0` ring at 2px offset around the **whole card**, not just the heading — `focus-visible` only, so a tap does not leave a ring behind | Instant | Instant (rings are never animated) |
| Card tap | Navigates. On the detail page, scroll resets to top and focus moves to its `<h1>` | Immediate | Scroll reset is `behavior: 'auto'`, never `'smooth'` |
| "Show 23 more" | Next 24 cards append. Focus moves to the first newly-revealed card's heading. Button relabels ("Show 23 more" → gone, or → "Show N more"). Count line updates to "Showing 48 of 47…" style | Append instant; the new cards use the same capped fade | New cards appear instantly |
| Skeleton shimmer | Horizontal gradient sweep | 1.2s loop | Static `bg-gray-100` block — no loop, no pulse |
| Back from a listing | Filtered URL restored from history; focus returns to the card just left (matched by listing id passed in `location.state`) if it is inside the current render slice, otherwise to the `<h1>` | Immediate | Unaffected |

### Accessibility Annotations

**Heading structure**
- `<h1>` "Member businesses" — one per page, in `DirectoryHero`. `SectionHeading` cannot be used here (it hard-codes `<h2>`).
- `<h2 class="sr-only">Find a business</h2>` labels the filter region.
- `<h2 class="sr-only">Businesses</h2>` labels the results region.
- `<h2>` visible on the empty-state and error panels ("The directory is just getting started" / "No matches" / "We couldn't load the directory").
- `<h3>` per card, containing the link. No level is skipped.

**Landmarks**
- Inherits `<main id="main-content">` from `Layout.jsx:14`. No new `<main>`.
- Filter region: `<search>` element (or `<section role="search" aria-labelledby=…>` where the `<search>` element is not acceptable to the browser target) — this is a genuine search landmark and should be exposed as one.
- Results region: `<section aria-labelledby="results-heading">`.
- The skip link already exists at `Layout.jsx:8-10` — **contrary to item 7 of the shared-context gap list**. It does, however, use `focus:` (not `focus-visible:`) and paints white on `#fc16a0` (3.64:1), so it fails AA in its own right. Correcting it is a shell fix that the directory index depends on for NFR-008. See Gaps found #12.

**Focus management**
- Every interactive element has a visible `focus-visible` ring: 2px `#fc16a0`, 2px offset. `#fc16a0` on white is 3.64:1, above the 3:1 threshold for non-text UI, so the brand pink is correct here and only here.
- Focus is moved on exactly three events: after "Show more" (to the first new card heading), after "Clear filters" (to the search input), and after clearing the search field (back to the search input). Focus is **never** moved on a keystroke or on a result count change.
- Card focus ring surrounds the whole card. Because the card uses a stretched link, the visual focus target and the click target are the same rectangle.
- Tab order: skip link → nav → search input → clear ⊗ (when present) → category select → clear filters → card 1 → card 2 … → show more → closing CTA → footer. The link-presence icons are not focusable.

**Screen-reader notes**
- `ResultsStatus` is the only live region on the page, mounted from first render, `aria-atomic="true"` so partial counts are never read.
- Counts are announced with correct singular/plural: "1 business matches." / "12 businesses match." / "No businesses match."
- Each card link's accessible name is `"{business name}, {category}"`. The description is inside the card but outside the link, so it is not read as part of the link name; it is reachable in browse mode.
- Link-presence icons are `aria-hidden` with visually-hidden equivalents, so a card reads as "…Has a website. On Instagram. Accepts enquiries."
- Disabled controls reference their explanation via `aria-describedby`, so tabbing to a dead search field on launch day explains itself.

**Keyboard operation**
- Everything is reachable and operable with Tab / Shift+Tab / Enter / Space / arrow keys on the select. No pointer-only interaction exists (fixing the `LondonEventCard` `<div onClick>` pattern — the directory card is an anchor).
- Escape inside the search field clears it and keeps focus there (standard `type="search"` behaviour, made explicit rather than left to the browser).
- No keyboard trap; no custom key handling beyond Escape and Enter on the search field.

**Input & target details**
- Search input: `type="search"`, `enterKeyHint="search"`, `autoComplete="off"`, `autoCorrect="off"`, `autoCapitalize="off"`, `spellCheck={false}`, and the native `-webkit-search-cancel-button` suppressed so there is exactly one clear affordance — ours, at 44×44 (the native one is ~14px and fails target size).
- **Font size ≥16px on the search input and the select**, to prevent iOS Safari's zoom-on-focus, which otherwise leaves the page zoomed and horizontally scrollable. The existing postcode input uses `text-xs` and does exhibit this.
- All touch targets ≥44×44: search field 48px tall, clear ⊗ 44×44, select 48px, "Clear filters" 44px, "Show more" 48px, whole card ≥120px tall.
- No horizontal scroll at 320px: the filter bar is a single stacked column below `md:`, the description is clamped rather than truncated with a nowrap, and the category `<option>` text is allowed to wrap in the native picker.
- Placeholder text uses `gray-500` (4.83:1), not the `gray-400` (2.85:1) used in `EventFilters.jsx` — and the placeholder never carries information that is not also in the visible label.

#### Search & filter contract (FR-019) — additional to the standard blocks

Recorded here because no public text-search pattern exists anywhere on this site to inherit from.

- **Filter state is flat**, exactly as `WhatsOn.jsx:34-45`: `{ q: '', category: 'all' }`. No nesting, no derived state stored, no reducer.
- **URL is the source of truth for sharing, state is the source of truth for rendering.** On mount, `q` and `category` are read from the query string into state. On every change, state is written back with `replace` (never `push`).
- **Why `replace` and not `push`:** with `push`, Back would step Priya through every intermediate keystroke before returning her to Instagram. With `replace`, Back from the index leaves the site (where she came from) and Back from a listing returns to the filtered index. "Clear filters" is the undo, not the Back button. This is a deliberate trade: filter changes are not individually undoable via Back.
- **Empty params are omitted.** `/directory` — not `/directory?q=&category=all`.
- **Matching:** case-insensitive, diacritic-insensitive, trimmed. The term is split on whitespace and **all** tokens must match (so "family photo" finds "Relaxed family photography"). A token matches if it is a substring of the business name, the category name, or the description. Matching begins at 1 character — there is no minimum length, because filtering is local and instant.
- **No fuzzy matching, no stemming, no search library.** NFR-012 forbids new runtime dependencies without a logged decision, and a substring match over ≤300 records is sub-millisecond. The cost is misspellings, which the category select and the no-results copy exist to absorb.
- **Category filtering is by category identifier, not by display name**, so FR-017's "rename a category without re-approving listings" does not break a shared URL.
- **Category options** list every category that is active *or* is used by at least one published listing (FR-017 keeps retired-but-in-use categories filterable). Each option carries a count: "Photography (3)". Counts are computed once over the full published set and do **not** react to the search term — a count that changes on every keystroke turns the select into noise.
- **Unknown `category` param:** results render unfiltered, a dismissible note appears ("We couldn't find that category, so we're showing everything."), and the parameter is dropped from the URL. The unknown value is never rendered back to the visitor.
- **Render slice resets to 24 on any filter change** (the `SubscribersManager` reset-on-filter-change rule), so a filtered view never starts scrolled past its own results.

---

## Screen D-B — Listing detail (`/directory/:slug`)

**Purpose:** Give a visitor everything the member chose to publish, and one obvious way to make contact — and nothing else about the member. This screen is where FR-011's public/private boundary is either visibly honoured or visibly broken, so it is also the screen Bea will check first after her listing goes live.

**Entry from:** A card on the index · a URL shared by the member herself (Instagram bio, WhatsApp) · a search engine result · the confirmation email when a listing is published (FR-021) · a bookmark.

**Exits to:** Back to `/directory` (carrying the query string she arrived with, if any) · the business's website (new tab) · the business's Instagram (new tab) · the enquiry contact (mail client / dialler / the business's own contact page) · `/join` from the closing CTA · `/privacy` from the trust line.

### Layout Wireframe (mobile-first, 320px)

```
┌────────────────────────────────────────┐
│ ☰   Greenwich Parents & Carers      IG │  existing Navbar
├────────────────────────────────────────┤
│                                        │
│  ← Back to directory                   │  44px target; preserves ?q=
│                                        │
│  ▐ PHOTOGRAPHY ▌                       │  Badge, category variant
│                                        │
│  Sarah Jones                           │  h1, text-3xl, tabIndex={-1}
│  Photography                           │  focused on mount
│                                        │
├────────────────────────────────────────┤
│                                        │
│  Relaxed newborn and family            │  full description
│  photography, taken at home so         │  plain text, pre-wrap
│  nobody has to get anyone into a       │  (member's line breaks kept,
│  car.                                  │   markup never rendered,
│                                        │   URLs never auto-linked)
│  Evening and weekend sessions          │
│  available. Digital gallery            │
│  included.                             │
│                                        │
├────────────────────────────────────────┤
│  Find them online                      │  h2, text-lg
│                                        │
│  🌐 sarahjonesphoto.co.uk          ↗   │  hostname shown, not raw URL
│                                        │  ↗ = external icon, 44px row
│  ⌾ @sarahjonesphoto                ↗   │
│                                        │
├────────────────────────────────────────┤
│  Get in touch                          │  h2, text-lg
│                                        │
│  ┌──────────────────────────────────┐  │  tinted panel, rounded-2xl
│  │                                  │  │
│  │  hello@sarahjonesphoto.co.uk     │  │  selectable plain text
│  │                                  │  │
│  │  [ Email Sarah Jones Photog… ]   │  │  primary Button, 48px
│  │  [ Copy address ]                │  │  secondary Button, 44px
│  │                                  │  │
│  │  Sarah chose this contact for    │  │  text-sm, gray-600
│  │  enquiries. We never publish a   │  │
│  │  member's personal email or      │  │
│  │  home address.                   │  │
│  │                                  │  │
│  │  We don't publish business       │  │  ← the Q1 honesty line
│  │  locations either — if you need  │  │
│  │  someone nearby, just ask.       │  │
│  └──────────────────────────────────┘  │
│                                        │
├────────────────────────────────────────┤
│  Listed by a member of Greenwich       │  context for visitors who
│  Parents & Carers — a community CIC    │  landed here from Google
│  run by local parents. [About us →]    │  and have never heard of GPC
│                                        │
│  Run a business? [ List yours free ]   │  → /join
├────────────────────────────────────────┤
│  existing Footer                       │
└────────────────────────────────────────┘
```

**What is deliberately absent, and must stay absent (FR-011, NFR-001, NFR-006):** the member's first name (unless it *is* the business name she submitted), her signup email, her postcode or any area, her phone (unless nominated as the public enquiry contact), her group (Business / Career), any survey answer, any consent record, any moderation note, any date of submission or approval, any admin note, and any "member since" line. There is no author byline, no "posted by", no avatar photo, and no share-count. The page has exactly the six fields FR-020 names, plus GPC's own framing.

**Enquiry contact rendering — pending addendum Q3.** The contact's *shape* is an open question (email / phone / link / member's choice). The screen is specified for all three so the decision does not block the rest of the design:

| Shape | Primary action | Secondary | Plain-text line |
|---|---|---|---|
| Email | `Button` "Email {business name}" → `mailto:` | "Copy address" → clipboard | the address, selectable |
| Phone | `Button` "Call {business name}" → `tel:` | "Copy number" → clipboard | the number, selectable |
| Contact page URL | `Button` "Contact {business name}" → new tab, marked external | none | the hostname, selectable |

If Q3 resolves to "member's choice of any one", the block renders exactly one of these three rows — never a mixture, never an empty row. See Gaps found #2 and #3.

**Tablet / Desktop variations (differences only):**

- **768px (`md:`)** — two-column layout inside `max-w-5xl`: description occupies the left ~62%, the "Find them online" and "Get in touch" blocks stack in a right rail that is `sticky top-24` so the contact panel stays reachable while a long description scrolls. Below `md:` there is no sticky anything — a sticky panel on a 320px screen eats the viewport.
- **1024px (`lg:`)** — no structural change; the container widens to `max-w-5xl` centred and the type measure is capped at `max-w-prose` so the description does not run to 120 characters per line.
- **1440px** — no change.
- The "← Back to directory" link stays above the `<h1>` at every width; it is not moved into a sidebar, because on desktop it is also the only breadcrumb.

### Component Hierarchy

1. **`ListingDetailPage`** **NEW** — route component. Fetches one published listing by slug; resolves to the detail state, the not-found state (Screen D-C), or the error state. Sets `document.title = '{business name} | GPC Member Directory'`, and on the not-found path sets a generic title plus `<meta name="robots" content="noindex">`.
2. **`BackToDirectoryLink`** **NEW** — reads `location.state.from` (set by the card) to rebuild the filtered URL; falls back to plain `/directory` for visitors who arrived cold. Text is always "Back to directory", never "Back" — a browser Back button is not what this is.
3. **`ListingHeader`** **NEW** — existing **`Badge`** (`category` variant, the AA-safe `#c9107f` fill) above an `<h1 tabIndex={-1}>`.
4. **`ListingDescription`** **NEW** — plain-text renderer. Preserves the member's own line breaks with `white-space: pre-wrap` and does nothing else. **No markdown parser, no sanitiser-then-render, no linkifier.** (A sanitiser is the wrong tool here: FR-020 says render as text, and text rendering has no injection surface to sanitise.)
5. **`ExternalLinkRow`** **NEW** — one row per external destination. Displays the hostname (`sarahjonesphoto.co.uk`) or handle (`@sarahjonesphoto`), not the raw URL, which is often 90 characters of tracking parameters and will wrap badly at 320px. Each row: `target="_blank"`, `rel="noopener noreferrer ugc"` (`ugc` because the link is member-supplied), an external-arrow icon that is `aria-hidden`, and a visually-hidden "(opens in a new tab)" appended to the accessible name. Row height 44px minimum.
6. **`EnquiryPanel`** **NEW** — the tinted block. Holds the contact as selectable plain text, the primary action `Button`, the "Copy" secondary `Button` where applicable, and the two trust lines. `Button` needs the **NEW** loading/disabled treatment for the copy action's transient states.
7. **`CopyButton`** **NEW** — writes to the clipboard, swaps its own label to "Copied ✓" for 2 seconds, and announces politely. Reverts to "Copy address" afterwards. Disabled with an explanation when the Clipboard API is unavailable.
8. **`AboutGpcFootnote`** **NEW** — one sentence plus a link to `/about`, for visitors who arrived from Google and have no idea what GPC is. This is the only thing on the page that is not the member's content.
9. **`JoinInvitationBand`** **NEW** — shared with the index (component #12 there).
10. Existing **`Card`** is used for the enquiry panel wrapper (it supplies `rounded-2xl` and the shadow); padding is added by this consumer, as `Card` has none.
11. **`SkeletonDetail`** **NEW** — placeholder matching the header + description block height.

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Slug resolves to a published listing | Full page as wireframed. Optional fields (website, Instagram) are omitted entirely when absent — no "Not provided", no empty row. If neither is present, the whole "Find them online" section including its `<h2>` is omitted. | `<h1>` receives focus on mount via `tabIndex={-1}`, and scroll resets to top — React Router v7 does neither on its own and this codebase has no `ScrollRestoration`. Focusing the `<h1>` (rather than an off-screen announcer) means the first thing a screen-reader user hears after navigating is the business name. |
| **Loading** | Route mounted, fetch in flight | `SkeletonDetail`: a badge-shaped block, a two-line title block, five description lines, a panel-shaped block. Back link is live immediately (it needs no data). | `aria-busy="true"` on the article; skeletons `aria-hidden`. A `role="status"` region reads "Loading listing…". Focus is **not** moved until the real `<h1>` exists, so the announcement is not interrupted. |
| **Empty** | **N/A** — a published listing cannot be empty. Business name, category, description and public enquiry contact are all required at submission (FR-003), and moderation (FR-015) gates publication, so every published listing has all four. Website and Instagram are optional, and their absence is an omission, not an empty state. | — | — |
| **Error** | Fetch rejects, times out, or returns non-2xx — i.e. **we could not find out** whether this listing exists | "We couldn't load this listing. / Something went wrong at our end — it isn't you." + `Button` "Try again" + text link "Back to directory". **Explicitly distinct from Screen D-C**, which means "we found out, and it isn't published." Conflating the two would tell Priya a listing is gone when the network merely hiccupped. | `role="alert"` panel. Retry re-runs the fetch. `robots` is left untouched — a transient error must not deindex a live listing. |
| **Success** | The visitor completes a copy action ("Copy address" / "Copy number") | Button label swaps to "Copied ✓" with a check icon for 2 seconds, then reverts. No toast — `react-hot-toast` is used in exactly one file on this site and there is no global `<Toaster>`; introducing one for a single confirmation is disproportionate. | The button's own label change is announced because the button is focused at that moment; a `role="status"` region additionally carries "Address copied." for AT that does not re-announce a focused element's label change. |
| **Disabled** | Clipboard API unavailable (non-secure context or old webview) | "Copy address" renders in the inactive treatment (`bg-gray-100 text-gray-500`), with a hint beneath: "Select the address above to copy it." | `aria-disabled="true"`, focusable, activation is a no-op; `aria-describedby` points at the hint. The address stays selectable text so the task remains completable. |

### Interactions & Animations

| Interaction | Behavior | Timing | `prefers-reduced-motion` |
|---|---|---|---|
| Arrive from a card | Scroll to top, focus `<h1>` | Immediate; scroll `behavior: 'auto'` — never `'smooth'`, which on a long page delays focus landing and is itself motion | Identical (already instant) |
| Skeleton → content | Cross-fade | 200ms | Instant swap |
| Page content entrance | Single fade-in of the whole article, `opacity 0 → 1`. **No per-section stagger** — this is one document, not a feed | 300ms | No fade; content is present at full opacity |
| External link tap | Opens a new tab | Immediate | Unaffected |
| External link hover/focus | Underline appears; external arrow shifts 1px up-right on hover only | 120ms | Underline only, no icon shift |
| "Email …" tap | Hands off to the OS mail client. The page is left as-is so returning finds it unchanged | Immediate | Unaffected |
| "Copy address" tap | Clipboard write, label swap to "Copied ✓", revert after 2000ms | Swap is instant; a 150ms icon fade in/out | No icon fade; label swaps instantly |
| Sticky right rail (≥768px) | Contact panel sticks below the header while the description scrolls | CSS `position: sticky`, no JS, no animation | Unaffected — sticky is not motion |
| Back to directory | Restores the filtered URL and returns focus to the originating card | Immediate | Unaffected |

### Accessibility Annotations

**Heading structure**
- `<h1>` = business name, exactly once, focusable via `tabIndex={-1}` for post-navigation focus.
- `<h2>` "Find them online" (omitted entirely when there are no external links — an `<h2>` with nothing under it is a broken outline).
- `<h2>` "Get in touch".
- `<h2>` on the About-GPC footnote is not used; it is a plain paragraph, so it does not compete in the outline with the member's own content.
- No `<h3>`. No skipped levels.

**Landmarks**
- Inherits `<main id="main-content">` from `Layout`.
- The listing is an `<article aria-labelledby="listing-title">` so a screen-reader user can jump to it as a unit and knows where the member's content starts and GPC's framing begins.
- The enquiry panel is a `<section aria-labelledby="enquiry-heading">`.

**Focus management**
- Focus moves to the `<h1>` on mount, on every navigation into this route including slug-to-slug moves.
- Back link is the first tab stop inside `<main>`, before the `<h1>`, so a keyboard user can leave without traversing the page.
- `focus-visible` rings on the back link, both external links, both buttons, and the join CTA — 2px `#fc16a0` at 2px offset.
- Focus is never trapped; there is no dialog on this screen.

**Screen-reader notes**
- Every external link's accessible name ends with "(opens in a new tab)" as visually-hidden text, satisfying FR-020's "marked as external to assistive technology". The visible arrow icon is `aria-hidden` and is a redundant visual cue, not the mechanism.
- Link text is the hostname or handle, so a link list reads "sarahjonesphoto.co.uk, opens in a new tab" — not "https://www.sarahjonesphoto.co.uk/?utm_source=…".
- The description is exposed as ordinary text with its line breaks preserved; because nothing is parsed, there is no risk of a member's submitted `<b>` or `<script>` becoming an element in the accessibility tree.
- The enquiry address is real text, not an image and not CSS-obfuscated, so it is readable, selectable and speakable. (Obfuscating it against scrapers would break exactly the users who need it most — see Gaps found #3.)
- The trust lines ("We never publish a member's personal email or home address" / "We don't publish business locations") are ordinary prose in the reading order, not tooltips.

**Keyboard operation**
- Tab reaches: back link → website → Instagram → primary contact action → copy → About link → join CTA. Enter activates all of them; Space also activates the two `<button>`s.
- Nothing on this page requires a pointer, a hover, or a drag.
- Copy confirmation does not move focus, so Enter-Enter does not fire an unrelated control.

**Contrast**
- Body text `#1a1a2e` on white — 16.44:1.
- Category `Badge`: white on `#c9107f` — 5.43:1 (the existing `upcoming` variant's `#fc16a0` fill would be 3.64:1 at 12px bold, a fail).
- Link text `#c9107f` on white — 5.43:1.
- The primary `Button` fill must not be the existing `from-primary` gradient, whose pink end fails with white text; it uses `#c9107f → #2d1b4e`.
- `#fc16a0` appears only as the focus ring, the initial-tile tint and the section underline — non-text uses where 3:1 applies.

---

## Screen D-C — Listing no longer available (`/directory/:slug`, unresolved)

**Purpose:** Make an unpublished, withdrawn or mistyped listing URL a clear, calm dead-stop with two ways forward — never a blank screen, never a JavaScript error, and never a page that leaks the fact that a specific member withdrew.

This screen exists because FR-020 requires it *and* because the site has **no 404 route at all today** (`src/App.jsx:46-89` ends at `/safeguarding-policy`; there is no `path="*"`). Any unmatched path currently renders the shell with an empty `<main>`. This screen is the directory's local fix; the site-wide fix is flagged in Gaps found #4.

**Entry from:** A listing URL shared before the member withdrew or an admin unpublished it (FR-015) · a search-engine result for a listing that has since gone · a mistyped or truncated URL (a WhatsApp link break) · any `/directory/<anything>` that matches no published listing.

**Exits to:** `/directory` (primary) · `/` (secondary) · `/join` is **not** offered here — someone who arrived expecting a specific business is not in the mood to be recruited, and the CTA would read as opportunistic.

### Layout Wireframe (mobile-first, 320px)

```
┌────────────────────────────────────────┐
│ ☰   Greenwich Parents & Carers      IG │  existing Navbar
├────────────────────────────────────────┤
│                                        │
│                                        │
│              ┌──────────┐              │  decorative, aria-hidden
│              │    ⌕     │              │  gray, NOT an error red
│              └──────────┘              │
│                                        │
│  This listing isn't in the             │  h1, text-2xl md:text-3xl
│  directory                             │  tabIndex={-1}, focused
│                                        │
│  It may have been removed, or the      │  text-base, gray-700
│  link may be wrong.                    │
│                                        │
│  Businesses come and go from the       │
│  directory — a member can ask us to    │
│  take their listing down at any time.  │
│                                        │
│  [     Browse the directory     ]      │  primary Button, 48px
│                                        │
│  Go to the homepage →                  │  text link, 44px row
│                                        │
│                                        │
├────────────────────────────────────────┤
│  existing Footer                       │
└────────────────────────────────────────┘
```

**Copy decisions worth defending:**
- **"isn't in the directory"**, not "not found", "404", or "removed". It is true whether the listing was unpublished, never existed, or the URL was mangled — and the visitor cannot tell those apart, so neither should the copy.
- **The slug is never echoed.** Not "We couldn't find *sarah-jones-photography*". Echoing it would confirm to anyone probing URLs which listings once existed, and "this member withdrew" is information about a member.
- **The tone is not an apology and not an error.** No red, no warning triangle, no "Oops!". A withdrawn listing is a member exercising a right the GDPR policy promises (FR-023); the page should read as normal operation.
- **The third sentence exists for Bea, not Priya.** It quietly tells any member reading it that withdrawal works and is respected.

**Tablet / Desktop variations (differences only):**
- **768px+** — the block centres in `max-w-md` with more vertical padding (`py-24`); the two actions sit side by side rather than stacked. Nothing else changes.
- The decorative mark grows from 64px to 96px. It never becomes an illustration — an illustrated 404 would be a new asset and a new download on a page whose entire job is to be fast and unremarkable.

### Component Hierarchy

1. **`ListingNotFound`** **NEW** — presentational, no data. Rendered by `ListingDetailPage` when the query resolves successfully to zero published rows. Takes no props, so it cannot accidentally be handed a slug to render.
2. Decorative mark **NEW** — a gray magnifier glyph in a tinted circle, `aria-hidden="true"`.
3. `<h1 tabIndex={-1}>` — focused on mount.
4. Existing **`Button`** (primary, AA-safe fill) → `/directory`.
5. Text link → `/`.
6. **Head effects** — `document.title = 'Listing not found | Greenwich Parents & Carers'` and `<meta name="robots" content="noindex">` injected for this state only, so search engines drop the URL after a withdrawal. **The response is still HTTP 200** — this is a client-routed SPA on Vercel with no server rendering, so a true 404/410 status is not achievable without an architecture change. `noindex` is the available mitigation; the limitation is recorded in Gaps found #6.

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Fetch resolved successfully and returned no published listing for this slug | The page as wireframed | `<h1>` focused on mount; scroll reset to top; `role="status"` region reads "This listing isn't in the directory." once, so the outcome is announced even if focus lands elsewhere |
| **Loading** | **N/A — this state is only ever reached *after* a resolved fetch.** While the fetch is in flight, Screen D-B's Loading state is showing; this screen never renders a spinner of its own, because doing so would mean guessing the answer before it is known. | — | — |
| **Empty** | **N/A — this screen *is* an empty state.** It has no data to be missing. | — | — |
| **Error** | **N/A — deliberately not this screen.** A failed or timed-out fetch renders Screen D-B's Error state ("We couldn't load this listing"), because "we could not find out" is a different message from "it isn't there". Only a successful zero-row result reaches this screen. | — | — |
| **Success** | **N/A — nothing here can succeed.** The two actions are ordinary navigations to other routes, which have their own states. | — | — |
| **Disabled** | **N/A — both controls are always available.** Neither depends on data, a network call, or a browser capability. | — | — |

### Interactions & Animations

| Interaction | Behavior | Timing | `prefers-reduced-motion` |
|---|---|---|---|
| Arrival on this state | Content fades in as one block | 250ms opacity only, no translate | No fade; content present immediately |
| Scroll & focus | Scroll to top, focus `<h1>` | Immediate, `behavior: 'auto'` | Identical |
| "Browse the directory" | Navigates to `/directory` with no query string — she has no filter context worth preserving | Immediate | Unaffected |
| Button hover (pointer, ≥768px) | Shadow lift only. **The existing `Button` primary variant's `hover:scale-105` is not used here** — a growing button on a not-found page is the wrong register, and a transform is exactly what reduced-motion users have asked not to see | 150ms | No shadow transition; static |
| Button focus | 2px `#fc16a0` ring, 2px offset, `focus-visible` only | Instant | Instant |

### Accessibility Annotations

**Heading structure** — a single `<h1>` ("This listing isn't in the directory"). No other headings; the page is four elements long and does not need an outline.

**Landmarks** — inherits `<main id="main-content">`. The content is wrapped in a `<section aria-labelledby>` pointing at the `<h1>` so the region has a name.

**Focus management** — focus moves to the `<h1>` on mount. Tab order is: skip link → nav → "Browse the directory" → "Go to the homepage" → footer. Two tab stops, both ≥44px tall.

**Screen-reader notes**
- The outcome is announced twice by design: once as the focused `<h1>` and once through a polite `role="status"`, because a visitor who arrived via an in-app navigation may have focus restored elsewhere by the browser.
- The decorative mark is `aria-hidden` and carries no alt text — there is nothing informative in it.
- No `role="alert"` and no assertive announcement: this is not an error, and interrupting is not warranted.

**Keyboard operation** — both actions are reachable by Tab and activate on Enter (and Space for the button). Nothing else is interactive.

**Contrast** — heading `#2d1b4e` on `#fffaf5` (14.69:1); body `#1a1a2e` (16.44:1); the decorative mark is `gray-400`, permitted because it is non-informational; the primary button uses the AA-safe `#c9107f → #2d1b4e` fill.

---

## Performance (NFR-009) — interactive within 3s on 4G with 100 listings

**Threshold:** directory index interactive within 3s on a simulated 4G mid-range mobile profile with 100 published listings. Measured by a Lighthouse mobile run on a production-equivalent build, seeded to 100 published listings.

**What the design does to make that achievable:**

1. **No images. At all.** FR-D02 defers listing logos and photos, and the Out of Scope list excludes image upload. The consequence is that the directory index ships with **zero remote image requests**, which is the single largest reason 3s on 4G is comfortably reachable. The `InitialTile` (a letter in a tinted square) supplies per-card visual identity for zero bytes. *If the addendum's FR-D02 interim note — "an admin may add an image during review" — is actually in scope, this budget changes materially and must be re-run; see Gaps found #7.*
2. **The LCP element is static text.** The `<h1>` and intro paragraph come from the JS shell and paint before any data resolves. LCP is therefore bounded by shell paint, not by Supabase latency — data arriving late degrades the *content*, not the LCP metric or the visitor's sense that the page is alive.
3. **One request, one round trip, bounded.** The index issues a single query against the published-listings public read path, selecting only the card fields (id, slug, business name, category, description, and three link-presence booleans), ordered, with an explicit `.limit()`. Nothing is fetched per card, per category, or per keystroke. NFR-010's "no view loading an unbounded result set" is satisfied by the explicit limit, not by hope.
4. **Payload maths.** At 100 listings with a 400-character public description cap: ~100 × ~550 bytes ≈ **55KB raw, ~15KB gzipped**. At a 1,000-character cap: ~120KB raw, ~28KB gzipped — still acceptable on 4G, but it doubles. The real risk is an *uncapped* description, which is why FR-003's "enforced character limit" needs an actual number. **Recommend ≤400 characters for the public description**, which is also the length that renders in three clamped lines on a card without the truncation feeling arbitrary. The number itself is a form-side decision, flagged rather than taken (Gaps found #13).
5. **Search and filtering never touch the network.** With the full published set already in memory, every keystroke filters an array — sub-millisecond at ≤300 records. The alternative (a query per keystroke) would cost roughly 300–600ms per update on 4G, five times over, in the middle of the journey's most interactive moment. This is a viable design up to roughly **300 listings**, which is exactly NFR-010's two-year projection; past that, search moves server-side with a debounce and this section must be revised.
6. **The DOM is sliced, not the data.** All matching listings are held in memory; only the first 24 are rendered, with "Show N more" appending. This keeps first render cheap without a second round trip.
7. **No new runtime dependencies** (NFR-012): no search library, no virtualisation library, no image CDN client, no data-fetching library. The only JS the directory adds is its own components. **Budget: ≤15KB gzipped added to the shell.** `framer-motion` and `lucide-react` are already in the bundle.
8. **No layout shift.** Skeleton cards reserve the real card height, so the grid does not reflow when data lands (target CLS < 0.1, realistically ~0). The badge, initial tile and clamped description all have deterministic heights.
9. **No new fonts or weights.** Poppins 600/700 and Nunito 400/600/700 are already loaded by the shell; the directory introduces neither a new family nor a new weight, so it adds no font request and no FOUT.
10. **The animation budget is capped.** The entrance stagger is capped at 6 cards (`min(i,5) × 0.06s`) rather than `Events.jsx`'s uncapped `i * 0.1`, which at 100 cards would schedule a 10-second reveal and 100 animation instances — a main-thread cost that directly attacks time-to-interactive. Cards do not re-animate on filter changes.
11. **What is *not* claimed:** this budget covers the index. The listing detail page fetches one row and is trivially inside the same envelope. The 3s figure assumes the existing site shell already meets its own budget; if the shell's JS is the bottleneck, the directory cannot fix that and the measurement must attribute it correctly.

---

## Gaps found

Recorded rather than decided. Items 1–3 need a product or controller answer before EPIC-006 is built.

1. **Addendum Q1 — a "local" directory that publishes no location. This is the honest version.**
   The PRD is explicit and this design obeys it: no location of any kind is published, not even an outcode (FR-003's public field list; Out of Scope: "Publishing any location, even approximate"; FR-D03 deferred). **What that costs Priya, plainly:** she cannot tell a Blackheath childminder from one in Bromley, cannot rule anyone out before writing to them, cannot sort or filter by proximity, and cannot answer the first question she actually has, which is "is this person near me?". Every enquiry she sends carries a real chance of being wasted on both sides. Some proportion of visitors will decline to send that email at all — and that loss is invisible in analytics, surfacing instead as members reporting that "the directory doesn't get me anything", which is the outcome most likely to make them withdraw.
   **What this design does within the constraint, rather than around it:**
   (a) It never uses the word "local" to describe an individual business. The `<h1>` is "Member businesses"; the locality claim is relocated to the thing that is actually true — *membership* of a Greenwich community organisation — in the intro line "Businesses and services run by Greenwich Parents & Carers members."
   (b) It states the absence out loud, twice, where it matters: in the index intro and again inside the enquiry panel — *"We don't publish business locations — if you need someone nearby, just ask."* This converts a missing feature into an explicit instruction, so Priya knows the next step is hers rather than concluding the site is broken or the business is hiding something.
   (c) It leans the discovery burden onto category + text search, and treats the category select as the primary (not secondary) control, since it is the only structured narrowing available.
   (d) It leaves the door open: adding an opt-in outcode later would be one extra `Badge` on the card and one line on the detail page, plus one more `<select>` in the flat filter object. **No part of this design would need to be rebuilt** if Q1 is reconsidered.
   **What has deliberately not been done:** no location field has been invented, no "serves SE3, SE10" free-text field has been slipped into the description, and no map, distance filter or postcode box appears anywhere. Recommendation for the controller, unchanged from the addendum: if Q1 is revisited, publish the **outcode only**, as an explicit separate opt-in, never derived from the private signup postcode.

2. **Addendum Q3 — the shape of the public enquiry contact is unresolved.** The detail screen specifies all three renderings (email / phone / contact-page URL) so the design is not blocked, but the "Get in touch" panel cannot be built until this is settled: the primary button's verb, whether a copy affordance exists at all, and the validation on the form side all change with the answer. Needed before EPIC-001 build, not just EPIC-006.

3. **Addendum Q4 — the enquiry email is specified as shown in the clear, and that needs a controller's explicit sign-off.** This design shows the address as real, selectable, machine-readable text, because every alternative harms the people it is meant to protect: CSS or JS obfuscation breaks screen readers and copy-paste; an image of an address is a WCAG failure; and a relay form creates a message store, which is new personal data, new disclosure, and a build the release has no transactional-email capability to support. The cost is that a scraper can harvest every published enquiry address from the detail pages. Mitigations already in the design: the **index** never renders contact addresses (link-presence icons only), so there is no single harvestable page; and the addendum's FR-003 criterion — warn a member who enters their signup email as their public contact — keeps a personal address out of the directory. If the controller is not comfortable with an address in the clear, the enquiry mechanism needs rethinking and Q4 must be answered before EPIC-006.

4. **The site has no 404 route at all, and this section only fixes part of it.** `src/App.jsx` has no `path="*"`. Screen D-C covers `/directory/*`, but `/anything-else` still renders an empty `<main>` inside the shell. Recommendation: add a global catch-all reusing the same component with generic copy ("This page isn't here"). It is a ~10-line change and it closes a documented NFR-008-adjacent gap — but it is outside FR-018/019/020, so it is flagged, not assumed.

5. **The listing URL shape is undefined in the PRD.** FR-020 assumes a shareable listing URL but never specifies one. This section proposes `/directory/:slug`. Two decisions follow and belong to architecture: (a) is the slug derived from the business name, and if so, what happens on a collision ("Sarah's Cakes" twice)? (b) FR-016 lets an admin edit a listing's public fields including the business name — if the slug regenerates on rename, **every previously shared link breaks and lands on Screen D-C**, which is indistinguishable from the member having withdrawn. Recommendation: mint the slug once at publication and never regenerate it, or keep old slugs as redirects.

6. **Screen D-C is a soft 404.** A client-routed SPA on Vercel returns HTTP 200 for `/directory/gone`. `noindex` is applied so search engines drop the URL, but crawlers, link checkers and any HTTP-status monitoring will see a 200 for a page that says "not found". A true 404/410 needs server rendering or a Vercel rewrite the current deployment does not have. Recorded as a known limitation for architecture.

7. **FR-D02's interim note conflicts with FR-018's card field list.** The addendum says "Interim: an admin may add an image during review", but FR-018 enumerates the card's contents without an image, and the PRD's Out of Scope excludes listing images. This design assumes **no images anywhere**, which is load-bearing for the NFR-009 budget. If admin-added images are genuinely in scope, the card and detail layouts need an image slot with a reserved aspect ratio and lazy loading below the fold, and the performance section must be re-run. Needs one sentence of clarification.

8. **Two existing UI primitives fail AA and both are on the directory's critical path.** (a) `Badge` has no category-appropriate variant, and its `upcoming` variant paints white on `#fc16a0` at `text-xs font-bold` — 3.64:1, a fail for 12px text; the directory needs a `category` variant filled `#c9107f`. (b) `Button`'s `primary` variant is `bg-gradient-to-r from-primary to-dark`, whose pink end fails with white text, and it has no disabled styling and no loading state — all three are needed here (disabled "Clear filters", disabled "Copy address", the "Copied ✓" transient). These are `DESIGN.md` items but they block NFR-008 on two of its three named pages.

9. **No public route exists to report a problem with a listing.** FR-015 lets an admin unpublish, but nothing lets a visitor say "this business has closed" or "this link is dead". At 20+ listings maintained by volunteers, listing rot is certain. Not in the PRD; not invented here. A "Something wrong with this listing?" link to the existing admin contact address would be the cheapest version.

10. **The directory's default sort order is undefined.** FR-D09 defers sort *options*, but something must order the grid and the PRD does not say what. Recommendation: newest-published first, so a new member sees her listing at the top on day one (which is also what makes her share it). Needs confirming; note that "newest first" implies exposing a publication date in the fetch even though it is never displayed.

11. **Newsletter capture on the empty state is an open content decision.** At launch the directory's empty state is the page's whole first impression, and Priya has no reason to return. Adding the existing `NewsletterForm` there would give her one, through an already-consented flow — but it puts a marketing consent surface on a browse page, and that is a PM/controller call, not a UX one. Specified as *optional* and not included in the wireframe.

12. **Correction to the shared context:** item 7 of its accessibility gap list ("No skip-to-content link") is inaccurate — one exists at `src/components/layout/Layout.jsx:8-10` and `<main id="main-content">` is present at line 14. It does, however, use `focus:` rather than `focus-visible:` and paints white on `#fc16a0` (3.64:1), so it fails AA itself. Since the directory index is one of NFR-008's three named pages and inherits this shell, fixing the skip link's contrast is in scope for this work even though it is a shell file.

13. **The public description's character limit needs a number.** FR-003 requires "an enforced character limit" without specifying one, and the addendum requires a live remaining-character count against it. The index's NFR-009 payload budget, the card's 3-line clamp, and the no-silent-truncation rule all depend on that number. **Recommend 400 characters.** It is a form-side decision, so it is flagged here rather than taken.

14. **Footer navigation is out of scope but probably wanted.** FR-018 requires only main-nav reachability, which the one-line `Navbar.jsx` change delivers. The footer currently carries policy links only and has no page-link column, so adding the directory there is a structural footer change this section does not own.

15. **Retired-but-in-use categories will appear in a public filter.** FR-017 says a retired category's existing listings "remain published and remain filterable", which means the public category select must offer a category admins have deliberately retired from the form. This design does that (with its count), on the reading that filterable implies selectable. Worth confirming that an admin retiring "Sleep consultancy" understands it stays visible to the public until the last listing using it is gone.
