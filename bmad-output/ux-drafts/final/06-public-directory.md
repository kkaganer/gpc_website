## 6. The public directory

**Covers:** FR-018 (index), FR-019 (search & filter), FR-020 (detail & enquiry), NFR-008, NFR-009, NFR-010 · **Epic:** EPIC-006 · **Stories:** STORY-027–030. Journey and screen IDs are local to §6.

**Routes** — all four sit inside the existing `<Layout>` route group (`src/App.jsx:48-59`) and inherit `<Navbar>`, `<main id="main-content">`, `<Footer>` and the existing skip link.

| Route | Screen | Notes |
|---|---|---|
| `/directory` | S1 — index | Filter state carried in the query string: `?q=`, `?category=` |
| `/directory/:slug` | S2 — listing detail | Slug is **immutable**: minted once at first publication, never regenerated on rename (A16), so shared links and already-sent publish emails never break. Declared after `/directory`. |
| `/directory/:slug`, no published match | S3 — `listing` variant | |
| `*` | S3 — `page` variant | **NEW site-wide catch-all**, last child of the Layout group. See S3. |

**Navigation.** `{ to: '/directory', label: 'Directory' }` becomes the sixth `NavItem` in `navLinks` (`Navbar.jsx:8-14`); `/join` is a `Button`-styled CTA to the right of the row, not a seventh text link (A11). The label is "Directory", not "Local businesses" — two words overflow the 320px row, and per the honesty note at the end of this section the page cannot truthfully promise "local" of an individual business. The `<h1>` carries the fuller framing.

**Shell correction, stated once.** The site *does* have a skip link — `src/components/layout/Layout.jsx:8-10`, with `<main id="main-content">` at line 14. Do not add a second one to public pages. It uses `focus:` rather than `focus-visible:` and paints white on `#fc16a0` (3.64:1), so it fails AA; because the directory index is one of NFR-008's three named pages and inherits this shell, recolouring it to `--color-primary-700` is in scope for this work.

---

### Journey J1 — Priya finds a member business and enquires

**Goal:** get from a link to a real human's contact details without an account, without reading anything long, and without a dead end.
**Persona:** Priya — public visitor, local parent, arriving cold from Instagram or the newsletter, on a phone, one-handed, likely to abandon inside 15 seconds if the page looks empty or broken. No account, ever. **Secondary beneficiary:** Bea — every screen here is her evidence that being listed was worth the form, and that it cost her no privacy (STORY-030).
**Time:** 45–90 seconds. Budget: ≤3s to interactive (NFR-009), ~10s scanning, ~5s search, ~15s reading a listing, ~20s composing the first line of an email.

**Entry points:** (1) Instagram bio or story link → `/directory`, sometimes pre-filtered `?category=`; (2) weekly newsletter; (3) main nav from `/` or `/whats-on`; (4) a member sharing her own `/directory/:slug`; (5) a search-engine result on a detail page; (6) word of mouth → homepage → nav. **Entry points 4 and 5 land on a detail page first**, which is why S2 must stand alone: its own route back into the directory, and its own one-line explanation of what GPC is.

**Success criteria**
- A listing detail page within 3 taps of arriving, and contact initiated (mail client, dialler, or clipboard) with no registration, login, or acceptance of anything.
- She never sees a member's name, signup email or postcode (FR-011, NFR-001).
- If the directory has nothing for her, she leaves understanding *why* it is thin rather than concluding the site is broken.
- A shared or bookmarked filtered URL reproduces the same view (FR-019).

**Happy path**

```
  Instagram / newsletter link
             ▼
  ┌────────────────────────────────────────┐
  │ GET /directory — shell paints h1 +     │  LCP is static text:
  │ intro + filter bar before data lands   │  no image, no blocking fetch
  └───────────────┬────────────────────────┘
                  │  one request, all published listings
  ┌───────────────▼────────────────────────┐
  │ 6 skeleton cards → 47 cards            │
  │ status region: "47 businesses"         │
  └───────────────┬────────────────────────┘
                  │  types "photog" — filters instantly, client-side;
                  │  URL replaced → ?q=photog; after 400ms idle the
                  │  status region reads "2 businesses match"
  ┌───────────────▼────────────────────────┐
  │ GET /directory/sarah-jones-photography │  taps a card
  │ scroll to top, focus moves to <h1>     │  (stretched link)
  │ name · category · description ·        │
  │ website · Instagram · Get in touch ·   │
  │ "we don't publish locations — ask"     │
  └───────────────┬────────────────────────┘
                  │  Email / call · Copy address · Website ↗ · Instagram ↗
                  ▼
        ENQUIRY MADE ✓ ── Back ──▶ /directory?q=photog restored,
                                   focus returns to the card she left
```

**Decision points and alternative paths**

| Trigger | Display | Recovery |
|---|---|---|
| **Zero published listings** (the launch condition) | Empty state A in full below. Search and category controls are **rendered but disabled and dimmed**, never hidden, so the shape of the page is visible. | Two live routes off the page: `/join` and `/whats-on`. Bea, arriving from the same post, can be listing #1 in two taps. |
| **1–3 published listings** | Real cards render, followed by a dashed-border `JoinInvitationCard` in the last grid cell: "Is your business missing? / Any GPC member can be listed, free." + Button → `/join`. No apology, no "coming soon" banner. | The grid never looks broken at N=1. |
| Search matches nothing | Empty state B below. | One tap back to the full set; the category select is the spelling-free path. |
| A category with listings, plus a term that eliminates them all | Empty state B, body naming **both** active constraints: "Nothing matches 'wedding' in Childcare." | "Clear filters" resets both; changing the select alone also works. |
| `?category=` names a category that does not exist | Results render **unfiltered** with a dismissible note above them: "We couldn't find that category, so we're showing everything." The bad parameter is dropped from the URL via `replace`. The unknown value is **never** echoed back. | She is browsing, not stuck. |
| Fetch fails (offline, Supabase down, 5xx) | Error state replaces the grid: "We couldn't load the directory. / Something went wrong at our end — it isn't you. Try again in a moment." + Button "Try again". Filter controls visible but disabled. | Retry re-runs the fetch without a page reload. |
| A listing URL shared weeks ago, since unpublished | S3, `listing` variant. The slug is never echoed; nothing reveals whether the listing ever existed, because "this member withdrew" is itself information about a member. | "Browse the directory" / "Go to the homepage". |
| A listing whose owner gave no website and no Instagram | The links section is simply absent — no empty rows, no "Not provided". If neither is present the `<h2>` goes too. The enquiry contact is always present (required at submission, FR-003). | Nothing to recover from; absence is silent by design. |
| No mail client configured, so `mailto:` does nothing — or the Clipboard API is unavailable (non-secure context, old webview) | Every email contact is paired with a "Copy address" button (44×44) and the address is plain selectable text. Where the clipboard is unavailable, that button renders inactive with `aria-disabled="true"` and a hint: "Select the address above to copy it." | Three ways to get the address — tap, copy, select — and at least one always works. |
| She wants someone *near her* | Nothing answers this. The intro and the enquiry panel say so out loud: "We don't publish business locations — if you need someone nearby, ask when you get in touch." | Unrecoverable by design; see the honesty note at the end of this section. |
| 47 listings and no ordering control | First 24 render; "Show 23 more" appends. Sort options are deferred (FR-D09). | Search and category are the discovery mechanism at this volume. |

**Drop-off notes**

- **The empty directory is the biggest risk in this journey and it is a certainty, not a possibility.** On launch day there are zero listings. Priya reads a blank page as disorganisation; Bea reads it as "nobody else joined" and declines to be first — a self-reinforcing failure. Hence real, specific, non-apologetic empty copy with a live route to `/join`, the sparse-variant invitation card, and disabled-not-hidden filter controls: a select reading "Photography (0), Childcare (0), Coaching (0)" tells both visitors what this page is *for*, which a blank page cannot.
- **The location gap costs enquiries and the cost is invisible in analytics.** It surfaces later as members reporting "the directory never got me anything". The mitigation is honesty — telling Priya to ask — not a fix.
- **Search is net-new on this site with nothing to inherit.** One-handed phone typing produces "photograper" and "fotografer"; substring matching catches neither, and no fuzzy-matching library is introduced (NFR-012). The category select is therefore the *primary* defence against search failure, not a secondary convenience, which is why it sits directly under the search field rather than behind a "Filters" disclosure. Relatedly, every keystroke that hits the network fails on 4G: `EventFilters.jsx` debounces its postcode field at 600ms because it calls a geocoding API, and copying that shape here would cost five stalls of ~600ms mid-journey. Fetching once and filtering in memory removes the network from the typing loop entirely.
- **Card-to-detail, and Back, are the two moments most likely to break on a phone.** The existing `LondonEventCard` is a `<div onClick>`: keyboard-unreachable, and on iOS it competes with scroll-momentum taps and fires accidental navigations — the directory card is a real anchor with a stretched-link pseudo-element (DESIGN.md §2.6). And React Router v7 restores neither scroll nor focus, with no `ScrollRestoration` in this codebase; without the explicit handling specified below, backing out of listing 6 of 12 lands her at the top of an unfiltered list, roughly six card-heights of re-scrolling at 320px.

---

#### Screen S1 — Directory index (`/directory`)

**Purpose:** let a visitor with no account see every published member business and narrow it to the kind of help she needs, in under a minute, on a phone, on mobile data — and prove to prospective members that being listed is worth it. **Exits to:** `/directory/:slug` · `/join` (empty state, invitation card, closing band) · `/whats-on` (empty-state secondary). The index publishes **no outbound business links** (see the link-presence rule below).

```
┌────────────────────────────────────────┐  existing Navbar above
│  Directory                             │  eyebrow
│  Member businesses                     │  h1 (DESIGN.md §2.11)
│  Businesses and services run by        │
│  Greenwich Parents & Carers members.   │
│                                        │
│  We don't publish business locations   │  the honesty line
│  — if you need someone nearby, ask     │
│  when you get in touch.                │
├────────────────────────────────────────┤
│  ┌──────────────────────────────────┐  │  <h2 class="sr-only">
│  │ Search                           │  │    Find a business</h2>
│  │ ┌──────────────────────────────┐ │  │  label + input per §2.4
│  │ │🔍 Try 'photographer' or a  ⊗ │ │  │  ⊗ = 44×44 clear button
│  │ │   business name              │ │  │
│  │ └──────────────────────────────┘ │  │
│  │ Category                         │  │
│  │ ┌ All categories             ▾ ┐ │  │  48px, full width
│  │                  [ Clear filters]│  │
│  └──────────────────────────────────┘  │
├────────────────────────────────────────┤
│  47 businesses                         │  the page's one polite
│ ┌────────────────────────────────────┐ │  live region (A13)
│ │ ┌────┐                             │ │  Card §2.6, p-5 md:p-6
│ │ │ S  │  Sarah Jones Photography    │ │  48px initial tile, decor.
│ │ └────┘                             │ │  h3 > a (stretched link)
│ │  ▐ PHOTOGRAPHY ▌                   │ │  Badge, category variant
│ │  Relaxed newborn and family        │ │  description, 3-line clamp,
│ │  photography at home. Evening…     │ │  plain text only
│ │  🌐 Website   ⌾ Instagram   ✉ Email│ │  presence icons, NOT links
│ └────────────────────────────────────┘ │
│ ┌─ …next card… ──────────────────────┐ │  gap-6
│          [    Show 23 more    ]        │
├────────────────────────────────────────┤
│  Run a business?  Any GPC member can   │  closing CTA band
│  be listed, free. [ List your business]│  → /join, then Footer
└────────────────────────────────────────┘
```

**Responsive (differences only).** `md:` — filter bar collapses to one row (search flex-grows, select ~200px, "Clear filters" trailing right), grid `md:grid-cols-2 gap-8`, intro capped `max-w-2xl`, page in the site container `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`. `lg:` — 3 columns, count line and filter bar share a row; unchanged at 1440px, and a 4th column is refused because it drops descriptions to two lines and cards start reading as tiles. Hover affordances (`md:`+ only) are shadow lift only — no hover-only information anywhere.

**Empty state A — nothing published yet (the launch condition).** Filter controls stay rendered, dimmed and disabled above a centred panel: a decorative `aria-hidden` mark, then, verbatim:

> **The directory is just getting started**
>
> There aren't any businesses listed yet. This is where you'll find photographers, childminders, coaches, bakers and therapists — all run by Greenwich Parents & Carers members.
>
> If that's you, you can be the first. Listing is free and takes about five minutes.
> `[ List your business ]` → `/join`  ·  See what's on locally instead → `/whats-on`

**Empty state B — filters match nothing.** In place of the grid. The typed term is echoed as **plain text truncated at 60 characters** — never re-parsed, never linkified; an unknown category value is never echoed at all.

> **No matches**
>
> Nothing matches "photograper" in Photography.
>
> Try a shorter word — or clear the filters and browse everything.
> `[ Clear filters ]`  ·  Browse all 47 businesses →

**Components.** `DirectoryPage` (owns the single fetch, the flat filter object, the render slice, URL sync, `document.title`) → `DirectoryHero` (`<h1>` per §2.11, not `SectionHeading`, which hard-codes `<h2>`) → `DirectoryFilters` (`{ filters, onChange, categories, disabled }`, mirroring the `EventFilters` contract) → `ResultsStatus` → `DirectoryGrid` → `ListingCard` (`InitialTile`, `<h3><a>`, `Badge`, clamped description, `LinkPresenceRow`) → `ShowMoreButton` → `DirectoryEmptyState` (`reason: 'no-listings' | 'no-matches'`, one component so A and B cannot drift) → `DirectoryErrorState` → `SkeletonCard` → `JoinInvitationCard`.

Two of those carry weight beyond styling. **`LinkPresenceRow` renders indicators, not links** — FR-018 specifies the card shows "the presence of links", and a live `mailto:` on the index would publish every member's enquiry address on one scrapeable page, converting a moderated directory into a harvestable address list; icons are `aria-hidden`, each paired with visually-hidden text ("Has a website" / "On Instagram" / "Accepts enquiries"). **`InitialTile` exists because the directory ships with no images at all** (FR-D02 deferred): it gives each card identity at zero network cost, and is `aria-hidden` as it is redundant with the name beside it. The category `Badge` needs a **new `category` variant** filled `--color-primary-700` per DESIGN.md §2.7 and §3.1; the existing `upcoming` variant must not be reused.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| **Default** | Fetch resolved, ≥1 listing, no active filter | Hero, enabled filter bar, "47 businesses", up to 24 cards, "Show N more", closing CTA band. At 1–3 listings the `JoinInvitationCard` is appended as the final cell. | Results are `<section aria-labelledby>` over a visually-hidden `<h2>Businesses</h2>`, `aria-busy="false"`. Status text "47 businesses". The invitation card is an `<article>` with its own `<h3>` so it is not mistaken for a listing. |
| **Loading** | Route mounted, fetch in flight | Hero and filter bar paint immediately from the shell; controls disabled; six `SkeletonCard`s. Skeletons, not a spinner (A7) — a skeleton grid communicates the shape of what is coming. | `aria-busy="true"` on the results section, skeletons `aria-hidden`. Status text "Loading businesses…", then the resolved count. |
| **Empty (A)** | Fetch resolved, 0 published listings | Empty state A above; filter controls rendered, dimmed, disabled. | Own `<h2>`. Status text "No businesses are listed yet." Disabled controls carry `aria-describedby` → the empty-state heading, so tabbing to a dead search field explains itself. |
| **Empty (B)** | Fetch resolved, ≥1 listing, filters match 0 | Empty state B above. | Status text "No businesses match." Panel has `<h2>No matches</h2>`. **Focus is not moved** — she is still typing, and stealing focus would close her keyboard. |
| **Error** | Fetch rejects, times out, or returns non-2xx | Retryable error panel; filter bar visible but disabled; no stale data shown. | `role="alert"` (the page has no content, so interrupting is correct). Retry is the first tab stop after the filter bar; on success the status region announces the count. |
| **Success** | A filter or search resolves to ≥1 result | Grid updates in place; count becomes "12 of 47 businesses match". No toast, no banner, no motion — the result *is* the feedback (A6). | Status text "12 businesses match." / "1 business matches." Announcement debounced 400ms after the last keystroke, so a fast typist triggers one announcement, not seven; a category change announces immediately, being a discrete act. |
| **Disabled** | (a) 0 listings → search and select disabled; (b) a category with 0 published listings → `<option disabled>` "Photography (0)"; (c) no active filter → "Clear filters" inactive | (a)/(b) use the real `disabled` attribute (the radius-select precedent, `EventFilters.jsx:186-188`). (c) uses `aria-disabled="true"` and stays focusable with a no-op activation, so a keyboard user can reach it and hear there is nothing to clear. Inactive treatment uses `--color-neutral-100` / `--color-text-muted`, not `opacity-40`: on the launch-day page these controls are the main thing on screen. | `aria-describedby` on all three pointing at the sentence explaining why. |

**Search and filter contract (FR-019)** — recorded because no public text-search pattern exists on this site to inherit.

- **Flat filter state**, exactly as `WhatsOn.jsx:34-45`: `{ q: '', category: 'all' }`. No nesting, no reducer, no derived state stored.
- **URL is the source of truth for sharing; state is the source of truth for rendering.** Read from the query string on mount; written back on change with `replace`, never `push` — with `push`, Back would step Priya through every intermediate keystroke instead of returning her to Instagram. "Clear filters" is the undo, not the Back button. Empty params are omitted: `/directory`, not `/directory?q=&category=all`.
- **Matching:** case-insensitive, diacritic-insensitive, trimmed; split on whitespace with **all** tokens required (so "family photo" finds "Relaxed family photography"); a token matches a substring of the business name, category name, or description; no minimum length, because filtering is local and instant. **No fuzzy matching, no stemming, no search library** (NFR-012) — the cost is misspellings, which the category select and empty state B absorb.
- **Filtering is by category identifier, not display name**, so FR-017's rename-without-re-approval does not break a shared URL. Options list every category that is active *or* used by at least one published listing, each with a count computed once over the full published set — counts do **not** react to the search term, because a count that changes on every keystroke turns the select into noise.
- **Render slice resets to 24 on any filter change** (the `SubscribersManager` idiom), so a filtered view never starts scrolled past its own results.

**Accessibility (non-obvious only; DESIGN.md §3 owns the rest).**
- The filter region is a `<search>` landmark (or `<section role="search">`), not a plain div — this is a genuine search landmark and should be exposed as one.
- `ResultsStatus` is the page's **single** polite live region (A13), mounted from first render with empty text; a live region inserted into the DOM together with its content is not reliably announced. `aria-atomic="true"` so partial counts are never read. Counts are pluralised correctly.
- Each card link's accessible name is "{business name}, {category}" via a visually-hidden suffix, so a link list is unambiguous. The description sits inside the card but outside the link, so it is not read as part of the link name.
- Focus moves on exactly three events: after "Show more" (to the first newly revealed card heading), after "Clear filters" (to the search input), and after clearing the search field (back to the search input). **Never** on a keystroke or a count change. The card's focus ring surrounds the whole card, matching the stretched-link click target.
- Search input: `type="search"`, `enterKeyHint="search"`, `autoComplete`/`autoCorrect`/`autoCapitalize` off, `spellCheck={false}`, native `-webkit-search-cancel-button` suppressed so there is exactly one clear affordance at 44×44 (the native one is ~14px and fails target size). Enter blurs the field rather than submitting, so the iOS keyboard drops and results become visible; Escape clears and keeps focus.
- Returning from a listing: the filtered URL is restored from history and focus returns to the originating card (matched by listing id in `location.state`) when it is inside the current render slice, otherwise to the `<h1>`.

---

#### Screen S2 — Listing detail (`/directory/:slug`)

**Purpose:** give a visitor everything the member chose to publish and one obvious way to make contact — and nothing else about the member. This is where FR-011's public/private boundary is visibly honoured or visibly broken, so it is the screen Bea checks first after going live.

```
┌────────────────────────────────────────┐  existing Navbar above
│  ← Back to directory                   │  44px; preserves ?q=
│  ▐ PHOTOGRAPHY ▌                       │  Badge, category variant
│  Sarah Jones                           │  h1, tabIndex={-1},
│  Photography                           │  focused on mount
├────────────────────────────────────────┤
│  Relaxed newborn and family            │  full description,
│  photography, taken at home so         │  plain text, pre-wrap —
│  nobody has to get anyone into a car.  │  markup never rendered,
│                                        │  URLs never auto-linked
│  Evening and weekend sessions          │
│  available. Digital gallery included.  │
├────────────────────────────────────────┤
│  Find them online                      │  h2 (omitted entirely
│  🌐 sarahjonesphoto.co.uk          ↗   │  when both links absent)
│  ⌾ @sarahjonesphoto                ↗   │  hostname/handle, not URL
├────────────────────────────────────────┤
│  Get in touch                          │  h2
│  ┌──────────────────────────────────┐  │  tinted panel
│  │  hello@sarahjonesphoto.co.uk     │  │  selectable plain text
│  │  [ Email Sarah Jones Photog… ]   │  │  primary Button, 48px
│  │  [ Copy address ]                │  │  secondary Button, 44px
│  │  Sarah chose this contact for    │  │
│  │  enquiries. We never publish a   │  │
│  │  member's personal email or      │  │
│  │  home address.                   │  │
│  │  We don't publish business       │  │
│  │  locations either — if you need  │  │
│  │  someone nearby, just ask.       │  │
│  └──────────────────────────────────┘  │
├────────────────────────────────────────┤
│  Listed by a member of Greenwich       │  for visitors who landed
│  Parents & Carers — a community CIC    │  from Google and have
│  run by local parents. [About us →]    │  never heard of GPC
│  Run a business? [ List yours free ]   │  → /join · then Footer
└────────────────────────────────────────┘
```

**Responsive (differences only).** `md:` — two columns inside `max-w-5xl`: description left (~62%), "Find them online" and "Get in touch" stacked in a `sticky top-24` right rail; below `md:` nothing is sticky, because a sticky panel on a 320px screen eats the viewport. `lg:` and 1440px — no structural change; the measure is capped at `max-w-prose`. The back link stays above the `<h1>` at every width, since on desktop it is also the only breadcrumb.

**What is deliberately absent and must stay absent (FR-011, NFR-001, NFR-006):** the member's first name (unless it *is* the business name she submitted), her signup email, her postcode or any area, her phone unless nominated as the public contact, her group, any survey answer, any consent record, any moderation note, any submission or approval date, any admin note, any "member since" line. No byline, no avatar, no share count. The page has exactly the six fields FR-020 names, plus GPC's own framing.

**Enquiry contact rendering — pending addendum Q3/Q4.** The shape is an open product/privacy call; the panel renders exactly one of these rows, never a mixture and never an empty row:

| Shape | Primary action | Secondary | Plain-text line |
|---|---|---|---|
| Email | "Email {business name}" → `mailto:` | "Copy address" | the address, selectable |
| Phone | "Call {business name}" → `tel:` | "Copy number" | the number, selectable |
| Contact page | "Contact {business name}" → new tab, marked external | none | the hostname, selectable |

The base case is **email, shown in the clear, as real selectable text**: CSS or JS obfuscation breaks screen readers and copy-paste, an image of an address is a WCAG failure, and a relay form creates a new message store — new personal data this release has no transactional-email capability to support. The mitigation already in the design is that the **index never renders contact addresses**, so no single page is harvestable.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| **Default** | Slug resolves to a published listing | Page as wireframed; absent optional fields are omitted entirely, heading included | `<article aria-labelledby>`; `<h1 tabIndex={-1}>` receives focus on mount and scroll resets to top — React Router v7 does neither and there is no `ScrollRestoration`. Focusing the `<h1>` means the first thing announced is the business name. |
| **Loading** | Route mounted, fetch in flight | `SkeletonDetail`: badge block, two-line title, five description lines, panel block. The back link is live immediately, needing no data. | `aria-busy="true"`, skeletons `aria-hidden`; the page's single polite region reads "Loading listing…". Focus is not moved until the real `<h1>` exists. |
| **Empty** | **N/A.** Name, category, description and public contact are all required at submission (FR-003) and moderation gates publication (FR-015), so a published listing cannot be empty. Absent website/Instagram is an omission, not an empty state. | — | — |
| **Error** | Fetch rejects, times out, or returns non-2xx — i.e. **we could not find out** whether this listing exists | "We couldn't load this listing. / Something went wrong at our end — it isn't you." + "Try again" + "Back to directory". **Explicitly distinct from S3**, which means "we found out, and it isn't published"; conflating them would tell Priya a listing is gone when the network merely hiccupped. | `role="alert"`. `robots` is left untouched — a transient error must not deindex a live listing. |
| **Success** | A copy action completes | The button's own label swaps to "Copied ✓" for 2 seconds, then reverts. No toast (A6). | The label change is announced because the button holds focus; the shared polite region additionally carries "Address copied." for AT that does not re-announce a focused element's label. Focus does not move, so Enter-Enter cannot fire an unrelated control. |
| **Disabled** | Clipboard API unavailable | Inactive "Copy address" with a hint beneath: "Select the address above to copy it." | `aria-disabled="true"`, focusable, no-op activation, `aria-describedby` → the hint. |

**Accessibility (non-obvious only).**
- External links: `target="_blank"`, `rel="noopener noreferrer ugc"` (`ugc` because they are member-supplied), visible arrow `aria-hidden`, and a visually-hidden "(opens in a new tab)" appended to the accessible name — that text, not the icon, is what satisfies FR-020's "marked as external to assistive technology". Link text is the hostname or handle, so a link list reads "sarahjonesphoto.co.uk, opens in a new tab" rather than 90 characters of tracking parameters (which also wrap badly at 320px).
- `ListingDescription` is a plain-text renderer: `white-space: pre-wrap` and nothing else. No markdown parser, no sanitise-then-render, no linkifier — FR-020 says render as text, and text rendering has no injection surface to sanitise, so nothing a member typed can enter the accessibility tree as an element. The trust lines are ordinary prose in the reading order, never tooltips.
- The back link is the first tab stop inside `<main>`, before the `<h1>`, so a keyboard user can leave without traversing the page. It reads "Back to directory", never "Back", and rebuilds the filtered URL from `location.state.from`, falling back to plain `/directory` for cold arrivals.
- Heading order is `<h1>` name → `<h2>` "Find them online" (omitted with its section) → `<h2>` "Get in touch". The About-GPC footnote is a paragraph, not a heading, so GPC's framing does not compete in the outline with the member's own content.

---

#### Screen S3 — Not found (`/directory/:slug` unresolved, and the site catch-all `*`)

**Purpose:** make an unpublished, withdrawn or mistyped URL a calm dead-stop with two ways forward — never a blank screen, never a JavaScript error, and never a page that leaks the fact that a specific member withdrew.

**The catch-all route is in scope.** `src/App.jsx` has no `path="*"` today, so any unmatched path renders the shell with an empty `<main>`. Add `<Route path="*" element={<NotFoundPage variant="page" />} />` as the **last child of the `<Layout>` route group**, so the nav, skip link and footer are present. Without it the "no longer listed" state cannot be distinguished from a typo: `/directoy/sarah` (a mistyped path) and `/directory/sarah` (a withdrawn listing) would render entirely different things, one of them blank. One component, two copy variants:

| Variant | Route | `<h1>` | Body | Actions |
|---|---|---|---|---|
| `listing` | `/directory/:slug`, resolved to zero published rows | "This listing isn't in the directory" | "It may have been removed, or the link may be wrong. Businesses come and go from the directory — a member can ask us to take their listing down at any time." | `[ Browse the directory ]` · Go to the homepage → |
| `page` | `*` | "This page isn't here" | "The link may be wrong, or the page may have moved." | `[ Go to the homepage ]` · Browse the directory → |

```
┌────────────────────────────────────────┐  existing Navbar above
│              ┌──────────┐              │  decorative, aria-hidden,
│              │    ⌕     │              │  grey — NOT error red
│              └──────────┘              │
│  This listing isn't in the             │  h1, tabIndex={-1},
│  directory                             │  focused on mount
│  It may have been removed, or the      │
│  link may be wrong.                    │
│  Businesses come and go from the       │
│  directory — a member can ask us to    │
│  take their listing down at any time.  │
│  [     Browse the directory     ]      │  primary Button, 48px
│  Go to the homepage →                  │  text link, then Footer
└────────────────────────────────────────┘
```

**Responsive (differences only).** 768px+: the block centres in `max-w-md` with `py-24` and the two actions sit side by side; the decorative mark grows 64px → 96px and never becomes an illustration, since an illustrated 404 is a new asset on a page whose whole job is to be fast and unremarkable.

**Copy decisions worth defending.** "isn't in the directory", not "not found", "404" or "removed" — it is true whether the listing was unpublished, never existed, or the URL was mangled, and the visitor cannot tell those apart, so neither should the copy. **The slug is never echoed**: doing so would confirm to anyone probing URLs which listings once existed. The tone is neither an apology nor an error — no red, no warning triangle, no "Oops!" — because a withdrawn listing is a member exercising a right FR-023 promises. The third sentence exists for Bea, not Priya: it quietly tells any member reading it that withdrawal works and is respected. `/join` is deliberately **not** offered here — someone who arrived expecting a specific business is not in the mood to be recruited.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| **Default** | Fetch resolved successfully with zero published rows, or an unmatched path | The page as wireframed | `<section aria-labelledby>` over the `<h1>`, which is focused on mount with scroll reset; the polite region reads the heading once, so the outcome is announced even if the browser restores focus elsewhere. No `role="alert"` — this is not an error. |
| **Loading** | **N/A** — reached only *after* a resolved fetch. While in flight, S2's Loading state shows; rendering a spinner here would mean guessing the answer before it is known. | — | — |
| **Empty** | **N/A** — this screen *is* an empty state; it has no data to be missing. | — | — |
| **Error** | **N/A, deliberately** — a failed or timed-out fetch renders S2's Error state, because "we could not find out" is a different message from "it isn't there". Only a successful zero-row result reaches here. | — | — |
| **Success** | **N/A** — both actions are ordinary navigations with their own states. | — | — |
| **Disabled** | **N/A** — neither control depends on data, network, or a browser capability. | — | — |

`document.title` and `<meta name="robots" content="noindex">` are set for both variants, so search engines drop a withdrawn listing's URL. **The response is still HTTP 200** — a client-routed SPA on Vercel with no server rendering cannot return a true 404/410 without an architecture change; `noindex` is the available mitigation and the limitation is recorded below.

---

### Performance — NFR-009 (index interactive within 3s on 4G, 100 listings)

Measured by a Lighthouse mobile run on a production-equivalent build seeded to 100 published listings.

1. **No images anywhere.** FR-D02 defers logos and photos, so the index ships **zero remote image requests** — the single largest reason 3s on 4G is reachable — and `InitialTile` supplies per-card identity for zero bytes. The LCP element is therefore static text: `<h1>` and intro paint from the shell before any data resolves, bounding LCP by shell paint rather than Supabase latency.
2. **One request, one round trip, bounded.** A single query on the published-listings read path selecting only card fields (id, slug, name, category, description, three link-presence booleans), ordered, with an explicit `.limit()`. Nothing is fetched per card, per category, or per keystroke; NFR-010 is satisfied by the limit, not by hope.
3. **Payload at the 300-character description cap (A8):** ~100 × ~450 bytes ≈ **45KB raw, ~12KB gzipped** — about 20% cheaper than the 400-character figure this section was originally costed at. That number is load-bearing in three places: this budget, the card's 3-line clamp, and the form's remaining-character counter.
4. **Search never touches the network.** Each keystroke filters an in-memory array — sub-millisecond at ≤300 records, which is NFR-010's two-year projection. Past ~300 listings, search moves server-side with a debounce and this screen must be revised. The DOM is sliced, not the data: first 24 rendered, "Show N more" appends without a second round trip.
5. **No new runtime dependencies** (NFR-012) — no search, virtualisation, image or data-fetching library. **Budget: ≤15KB gzipped added to the shell.** No new fonts or weights either, so no extra font request and no FOUT; skeletons reserve the real card height, so CLS is ~0. **Not claimed:** the detail page fetches one row and is trivially inside the same envelope, but the 3s figure assumes the existing shell already meets its own budget. If shell JS is the bottleneck, the directory cannot fix that and the measurement must attribute it correctly.

---

### The honesty note (addendum Q1) — a local directory that publishes no location

This is a directory of businesses run by members of a Greenwich community organisation, and it publishes no location of any kind — not a postcode, not an outcode, not an area name (FR-003's public field list; Out of Scope: "Publishing any location, even approximate"; FR-D03 deferred). A visitor cannot tell a Blackheath childminder from one in Bromley, cannot rule anyone out before writing to them, cannot filter by proximity, and cannot answer the first question she actually has. Every enquiry she sends risks wasting both people's time, some proportion of visitors will decline to send it at all, and that loss never appears in analytics — it surfaces as members reporting the directory got them nothing. The design works inside the constraint rather than around it: it never uses "local" of an individual business (the `<h1>` is "Member businesses", and the locality claim is relocated to the thing that is true — membership of a Greenwich organisation); it states the absence out loud twice, in the index intro and the enquiry panel, converting a missing feature into an explicit instruction; and it leans discovery onto category plus text search. Nothing has been invented to paper over it — no location field, no "serves SE3, SE10" free text in the description, no map, distance filter or postcode box. Adding an opt-in outcode later would be one `Badge`, one detail line and one more key in the flat filter object, so no part of this design would need rebuilding.

---

### Notes for architecture

- **Slug minting.** A16 fixes immutability; the generation rule and collision policy ("Sarah's Cakes" twice) are still architecture's to specify.
- **Default sort order is undefined.** FR-D09 defers sort *options*, but something must order the grid. Recommendation: newest-published first, which puts a new member's listing at the top on day one — note this implies fetching a publication date that is never displayed.
- **FR-D02's interim note conflicts with FR-018's card field list.** "An admin may add an image during review" versus a card enumeration with no image. This section assumes no images, which is load-bearing for NFR-009. One sentence of clarification needed.
- **S3 is a soft 404.** HTTP 200 for a page that says "not found" will be seen by crawlers, link checkers and status monitoring. A true 404/410 needs server rendering or a Vercel rewrite this deployment does not have.
- **No public route exists to report a problem with a listing.** At 20+ volunteer-maintained listings, rot is certain. Cheapest version: a "Something wrong with this listing?" link to `gpc.communitynews@gmail.com`.
- **Retired-but-in-use categories appear in the public filter.** FR-017 says their listings stay published and filterable, so the select must offer a category admins deliberately retired, until its last listing goes. Who removes the option, and what a visitor with that filtered URL open sees when it disappears, is unspecified — shared with the moderation section.
- **Footer navigation** is out of scope (FR-018 only requires main-nav reachability, and the footer has no page-link column), and **newsletter capture on the empty state** — which would give Priya a reason to return through an already-consented flow, at the cost of a marketing consent surface on a browse page — is specified as optional, not included, and is a PM/controller call.
