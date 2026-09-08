# EXPERIENCE.md — Section D: Directory Opt-In Disclosure & Granular Consent

**Covers:** FR-003, FR-004, NFR-004, NFR-006 (with FR-015 expectation-setting, FR-020 plain-text, FR-008 editability boundary)
**Status:** Draft for merge into `EXPERIENCE.md`
**Author:** UX — bmad-ux
**Date:** 2026-08-18

> This is the trust core. Everything else in the product is machinery; this is the moment a
> tired woman on a phone decides whether to believe us. Every string in this section is a
> **deliverable**, not a placeholder — the consent strings in particular are stored verbatim
> and versioned (NFR-004), so changing them later costs a version bump and a second cohort of
> records citing different text.
>
> Journey and screen IDs are prefixed `D-` so they merge cleanly with the parallel sections
> (form shell / branching, moderation, public directory). Cross-references to the shared
> `/join` shell are marked `[shell]` and are owned by the form-shell section, not this one.

---

## Proposed semantic tokens (extension to DESIGN.md)

The existing token set (`--color-primary`, `--color-dark`, `--color-warm`, `--color-amber`)
has no accessible status colours, and `#f59e0b` fails contrast at 2.15:1. This section needs
five, all measured against `#fffaf5` / white. **These are proposals for DESIGN.md to ratify —
listed again under "Gaps found".**

| Token | Value | Used for | Contrast on `#fffaf5` |
|---|---|---|---|
| `--color-primary-700` | `#c9107f` | button fills w/ white text, link text | 5.24:1 ✅ (already agreed in shared context) |
| `--color-public` | `#0f5132` | "Public" column heading, check glyph | 9.6:1 ✅ |
| `--color-private` | `#2d1b4e` | "Private" column heading, lock glyph | 14.69:1 ✅ (existing `--color-dark`) |
| `--color-warn-text` | `#92400e` | warning text + icon | 6.1:1 ✅ |
| `--color-warn-edge` | `#b45309` | 4px warning rule (non-text, needs 3:1) | 4.7:1 ✅ |
| `--color-error-text` | `#b91c1c` | error text + icon | 5.9:1 ✅ |
| `--color-error-edge` | `#b91c1c` | 2px invalid field border (non-text) | 5.9:1 ✅ |

Surfaces: warning `#fff7ed`, error `#fef2f2`, success `#f0fdf4`, disclosure card `#ffffff` on
the `#fffaf5` page. `#fc16a0` appears in this section **only** as a focus ring and as the
selected-radio fill — never carrying text.

---

## JOURNEY D — "Do I want to be findable, and what does that cost me?"

**Goal:** A member reaches an informed, unhurried decision about being listed publicly, gives
(or withholds) three separate permissions, and leaves knowing exactly which of her details are
now on the internet and which are not.

**Primary persona:** Bea — Business Mum. Phone, evening, tired, works from her kitchen table,
and is genuinely frightened of her home address or personal email appearing on a public page.
**Secondary:** Carla — Career Mum, who must be able to pass through this entire journey in two
taps and answer zero business questions (NFR-007).

**Estimated time:**
- Carla (declines): **~15 seconds** — one radio, two consent boxes (hold data + newsletter).
- Bea (opts in): **~2 min 10 sec** — 20s reading the disclosure, ~90s on six fields (the
  description is the long pole), ~20s on three consents.
- Both fit inside the 5-minute NFR-007 budget with the rest of the form.

**Entry points:**
1. Sequential scroll through `/join` — the normal path. This section sits after "Community &
   Involvement" and before the submit button, matching the source form's order.
2. Deep-link `/join#directory` from a newsletter or Instagram post that says "get listed".
3. Return-from-error: a failed submit focuses a field inside this section.
4. `/join` re-entry after a rejected listing (FR-015 resubmission) — same screens, no special case.

**Success criteria:**
- A member who opted in can state, unprompted, that her email and postcode are not published.
- A Career Mum who declines is never shown a business field and is never blocked by one.
- Every stored submission carries 2 or 3 consent records, each with verbatim text, version,
  UTC timestamp and capture method (NFR-004). Zero submissions stored with a missing required consent.
- Zero fields collected in this section that are not either published (FR-003 public list) or
  required to evidence a consent (NFR-006).
- **Proposed metric (see Gaps):** ≥80% of opted-in submissions nominate an enquiry contact that
  differs from the sign-up email. Below that, the privacy design is failing from the inside
  (named as a live risk in the PRD).
- PRD metric already in scope: directory opt-in rate among Business Mums ≥60%.

---

### Happy Path

```
                       [shell] /join, scrolled to the Directory section
                                          |
                                          v
                        +---------------------------------+
                        |  SCREEN D-1  Directory opt-in   |
                        |  payoff copy + at-a-glance      |
                        |  disclosure + Yes/No radio      |
                        +---------------------------------+
                                          |
                     +--------------------+--------------------+
                     |                                         |
              "No, not right now"                   "Yes, please - list
                     |                                my business"
                     |                                         |
                     |                                         v
                     |                        +-----------------------------+
                     |                        |  SCREEN D-2  Listing details|
                     |                        |                             |
                     |                        |  1. PUBLIC / PRIVATE card    |
                     |                        |     (two columns, always     |
                     |                        |      above the first field)  |
                     |                        |  2. Business or practice name|
                     |                        |  3. Category (taxonomy)      |
                     |                        |  4. Short description + live |
                     |                        |     remaining-character count|
                     |                        |  5. Website        (optional)|
                     |                        |  6. Instagram      (optional)|
                     |                        |  7. Public contact email     |
                     |                        |     [Shown publicly] badge   |
                     |                        |     -> same-as-signup warning|
                     |                        |  8. "What happens next" box  |
                     |                        +-----------------------------+
                     |                                         |
                     +--------------------+--------------------+
                                          |
                                          v
                        +---------------------------------+
                        |  SCREEN D-3  Privacy & consent  |
                        |                                 |
                        |  [ ] A. Hold my data   REQUIRED |
                        |  [ ] B. Publish my listing      |
                        |         (only if opted in)      |
                        |         REQUIRED WHEN SHOWN     |
                        |  [ ] C. Newsletter    OPTIONAL  |
                        |  none pre-ticked, each links    |
                        |  to /privacy                    |
                        +---------------------------------+
                                          |
                                          v
                              [shell] Submit  ->  server
                                          |
                                          v
                        +---------------------------------+
                        |  SCREEN D-4  Submitted          |
                        |  "what happens next" for the    |
                        |  listing: reviewed, not live yet|
                        +---------------------------------+
```

---

### Decision Points & Alternative Paths

| Trigger | Display | Recovery |
|---|---|---|
| Member selects "Yes, please — list my business" | D-2 panel is inserted into the DOM immediately after the radio fieldset. Polite live region: *"Directory details opened. Six more questions below."* | Selecting "No" removes it again. |
| Member selects "No, not right now" | D-2 panel is removed from the DOM. Consent B disappears from D-3. Polite live region: *"Directory details closed. Your business details won't be submitted."* Values stay in component memory only. | Re-selecting "Yes" restores everything she already typed, unchanged. Nothing was sent. |
| Member flips Yes → No **after typing** | Same as above, plus a quiet inline note under the radio group: *"We've set your business details aside. They won't be submitted. Choose 'Yes' again to bring them back."* No modal, no confirm dialog. | Re-select "Yes". |
| Member types her sign-up email into the public contact field | Inline warning below the field (`--color-warn-*`), plus a confirmation checkbox. Submit is blocked until she either changes the address or ticks the box. | Change the address (warning disappears, tick state resets to unticked) **or** tick *"I understand this address will be public. Use it anyway."* |
| Description passes the 300-character limit | Counter flips from *"N characters left"* to *"N characters over the limit"* in `--color-error-text`; field border goes 2px `--color-error-edge`; **nothing is truncated and typing is not blocked.** | Delete characters until the counter returns to a positive number. |
| Description reaches ≤30 characters remaining | Counter switches to `--color-warn-text`. No error, no block. | None needed — informational. |
| Submit with opt-in = Yes and required listing fields empty | Per-field errors; focus moves to the first offending field; `role="alert"` announces the count. Below the block, an escape hatch button: *"Not ready to write a listing? Change my answer to 'No, not right now'."* | Fill the fields **or** take the escape hatch, which flips the radio to No, removes D-2 and Consent B, clears the errors, and lets the form submit. |
| Submit with Consent A unticked | Error on Consent A; focus moves to it. | Tick it. There is no path to submit without it — the copy says so. |
| Submit with opt-in = Yes and Consent B unticked | Error on Consent B, with two named routes out. | Tick Consent B **or** follow the inline link *"change your directory answer"*, which scrolls to and focuses the D-1 radio group. |
| Category taxonomy returns zero rows (misconfiguration, FR-017) | Category `<select>` renders disabled with the single option *"No categories available right now"*; helper replaces the normal one: *"We'll choose a category for you when we review your listing."* The required rule is suspended. | Member submits normally. The listing enters the queue flagged `category_missing` so the moderator must set one before publishing. |
| Category taxonomy request is still in flight | `<select>` disabled, `aria-busy="true"`, option text *"Loading categories…"*. | Resolves on its own; if it errors, falls through to the empty-taxonomy behaviour above. |
| Website / Instagram entered without a scheme | No error. Normalised on the server (`greenwichparents.co.uk` → `https://greenwichparents.co.uk`; `@handle` → `https://instagram.com/handle`). | N/A — this is deliberately forgiving (addendum FR-003 criterion). |
| Website / Instagram genuinely unparseable | Field-level error naming a working example. | Correct it, or clear the field — both are optional. |
| Form is closed by an admin between page load and submit (FR-009) | `[shell]`-owned closed state replaces the form. This section contributes one line to it: *"Nothing you typed has been saved or sent."* | Owned by the form-shell section. |
| Member reaches D-3 having declined the directory | Only Consents A and C render. Consent B is absent from the DOM entirely — not disabled, not greyed. | N/A. |

---

### Drop-off Risk Notes

**The disclosure is the drop-off risk and also the drop-off cure.** Bea's fear is specific and
correct: she works from home, and a directory that leaks her postcode or personal email is worse
for her than no directory at all. If we hedge — "we may publish some details" — she leaves. If we
are blunt and exhaustive — a visible two-column list where the private side is *longer* than the
public side — she stays. That asymmetry is deliberate: the private column has six items to the
public column's six, and the closing line names the postcode explicitly, because the postcode is
the thing she is actually worried about. Vagueness here reads as evasion.

**The description field is the single longest dwell on `/join`.** It is the only place in this
section where a member has to compose rather than choose, and it lands at roughly the four-minute
mark. Two mitigations: the helper tells her how long it needs to be ("one or two sentences"), and
the counter starts at "300 characters left" rather than "0/300" so the framing is *permission*
rather than *quota*. We do not enforce a minimum length — a thin description is a moderation
problem (FR-016 lets an admin tidy it), not a reason to block a member at 9pm.

**Blocking on the same-email warning is a calculated risk.** The addendum requires a warn-and-confirm,
which means an extra tap for the member who genuinely only has one address. We accept that friction
because the failure it prevents — a personal inbox published on an indexed page — is unrecoverable
in the way a form abandonment is not. The confirmation copy is therefore written to be *tickable*
without shame: it says "use it anyway", not "are you sure?". A member who has thought about it
should be through in three seconds.

**Three consent boxes look like more work than one.** The old form had a single tick; this has two
or three, and there is a real risk it reads as bureaucracy. Countermeasures: they are the last
thing on the page, they are short, the optional one is visibly optional (`Badge: Optional`), and
the required ones carry a one-line "why" underneath in smaller text so nobody has to parse the legal
sentence to know what to do. Consent B only exists for people who already said yes to the directory,
so a Career Mum sees two boxes, not three.

**Consent B is where an opted-in member may reverse.** Reading "anyone can see them and search
engines can index them" is the first genuinely concrete moment. Some members will balk here, and
that is a *success*, not a failure — but only if reversing is cheap. Hence the inline
"change your directory answer" link inside the Consent B error, and hence the rule that flipping
the opt-in back to No preserves what she typed rather than destroying it. A member who has to
retype six fields to undo a decision will abandon the whole form instead.

**"Why hasn't my listing appeared?" is a post-submission drop-off** — of trust rather than of the
form. Without D-4's expectation-setting, the first thing a newly-joined member does is check the
directory, not find herself, and conclude the site is broken. The review promise has to appear
twice: once before she submits (in D-2, so the wait is part of the deal she agreed to) and once
after (in D-4, with a timeframe).

---

## SCREEN D-1 — Directory opt-in

**Purpose:** Present the payoff and the cost of a public listing in the same eyeful, then take a
single unambiguous yes/no. This screen must be answerable without scrolling past it, and must be
answerable "No" by a Career Mum without her reading anything else.

**Entry from:** `[shell]` `/join` scroll position after "Community & Involvement"; deep link `/join#directory`.

**Exits to:** SCREEN D-2 (on Yes) · SCREEN D-3 (on No, or after D-2) · `[shell]` submit.

### Layout Wireframe (mobile-first, 320px)

```
|<------------------ 320px ------------------>|
+---------------------------------------------+
|  16px                                  16px |
|  <-->                                  <--> |
|                                             |
|  == The GPC member directory ========= (h2) |
|                                             |
|  The directory is a public page on this     |
|  site where local parents can find          |
|  businesses run by GPC members. It's free,  |
|  and you can ask us to take your listing    |
|  down at any time.                          |
|                                             |
|  +-------------------------------------+    |
|  |  AT A GLANCE                        |    |
|  |  Six things go public. Your email,  |    |
|  |  postcode and survey answers        |    |
|  |  never do.                          |    |
|  +-------------------------------------+    |
|   ^ Card, p-4, white, rounded-2xl,          |
|     2px left rule in --color-primary        |
|                                             |
|  <fieldset>                                 |
|  <legend> Would you like to be included     |
|           in the GPC member directory?      |
|                                             |
|  Open to everyone - you don't need to       |
|  have chosen "Business Mums" above.         |
|                                             |
|  +-------------------------------------+    |
|  | (o)  Yes, please - list my business |    | <- 56px tall
|  +-------------------------------------+    |
|                                             |
|  +-------------------------------------+    |
|  | ( )  No, not right now              |    | <- 56px tall
|  +-------------------------------------+    |
|  </fieldset>                                |
|                                             |
|  ....... if "Yes": SCREEN D-2 renders .....|
|  ....... here, in DOM order, no modal ......|
|                                             |
+---------------------------------------------+
```

Radio rows are full-width tappable cards: 56px tall (well over the 44px minimum), `rounded-xl`,
1px `#e5e0ea` border, selected state = 2px `#fc16a0` border + `#fdf2f9` fill + filled dot.
Selection is never signalled by colour alone — the dot is the primary indicator.

**Tablet / Desktop variations (differences only):**
- ≥768px: the two radio cards sit side by side in a 2-column grid, `gap-4`, equal height. Copy is unchanged.
- ≥768px: the "At a glance" card and the intro paragraph sit side by side (60/40), so the whole
  decision is above the fold on a laptop.
- ≥1024px: content is capped at `max-w-2xl` inside the page container so the intro paragraph never
  exceeds ~70 characters per line. No other change; `xl:` is not used, per site convention.

### Component Hierarchy

1. `SectionHeading` *(existing)* — renders the `<h2>` "The GPC member directory". `showUnderline` on, `align="left"`.
2. Intro paragraph — plain `<p>`, admin-editable help text (FR-008).
3. `Card` *(existing)* + `p-4` — the "At a glance" summary. **Not admin-editable** (see Accessibility/Editability note).
4. `DirectoryOptInFieldset` **NEW** — `<fieldset>` + `<legend>`, wrapping:
   1. `RadioCardGroup` **NEW** — the two full-width tappable radio rows. Reuses the visual grammar of
      `EventFilters.jsx` chips but as real `<input type="radio">` elements, not `<div onClick>`.
      (The existing site has no radio pattern at all; this is net-new.)
   2. `FieldHelpText` **NEW** — `<p id="…-help">`, wired via `aria-describedby` on the fieldset.
5. `FieldError` **NEW** — hidden until invalid; `role="alert"` when populated.
6. Live-region announcer — the page-level `role="status" aria-live="polite"` region, reusing the
   idiom established in `NewsletterBanner.jsx` (the site's only existing live region). One shared
   region for the whole of `/join`, owned by `[shell]`.

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Section renders, nothing selected | Both radios unselected. No error. No D-2 panel. | `<fieldset>` + `<legend>` carries the question; `aria-describedby` points at the help text id. |
| **Loading** | N/A — this screen's content is static config already fetched with the form. If the whole form config is still loading, `[shell]` owns the skeleton and this section is not mounted. | — | — |
| **Empty** | N/A — the choice is a fixed binary defined in code, not in the taxonomy or in form config. It cannot be empty. | — | — |
| **Error** | Submit attempted with neither radio selected (the question is required, per source form) | Error text below the radio group: *"Please choose yes or no — we need to know whether to list you."* Fieldset gains a 2px `--color-error-edge` left rule. | Error `<p id="directory-optin-error">` added to the fieldset's `aria-describedby`; `role="alert"`; focus moves to the first radio. |
| **Success** | N/A at screen level — success is a whole-form outcome, shown on D-4. | — | — |
| **Disabled** | Form is closed by an admin (FR-009) | The whole section is unmounted along with the rest of the form; `[shell]` shows the closed message. Individual radios are never disabled. | — |

### Interactions & Animations

| Interaction | Behavior | Timing | prefers-reduced-motion |
|---|---|---|---|
| Tap/space/enter a radio card | Selection dot fills; border and background change | 120ms ease-out on background/border colour | Colour change applied instantly; no transition |
| Select "Yes" | D-2 panel mounts below the fieldset and expands from 0 → auto height with opacity 0 → 1 | 200ms ease-out | Panel appears at full height instantly; live-region announcement is unchanged |
| Select "No" after D-2 was open | D-2 collapses and unmounts | 160ms ease-in | Unmounts instantly |
| Arrow keys within the radio group | Native roving selection; moving selection also fires the expand/collapse | Native | Native |
| Focus a radio card | 2px `#fc16a0` focus ring, 2px offset, on the card | Instant | Instant (focus indication is never animated) |
| Inline note "we've set your details aside" appears | Fade in | 150ms | Instant |

### Accessibility Annotations

- **Heading level:** `<h2>` "The GPC member directory". The page `<h1>` is owned by `[shell]`.
  `SectionHeading` already renders `<h2>`, so it is used as-is.
- **Landmark role:** none of its own. The section lives inside the `[shell]` `<form>` inside `<main>`.
  It is a `<section aria-labelledby="directory-heading">` for navigability, not a landmark.
- **Focus management:** no focus is moved on selecting Yes. The new panel is inserted *immediately
  after* the fieldset in DOM order, so the next Tab lands on the first new field naturally. Moving
  focus automatically would rip a screen-reader user out of the radio group before she has confirmed
  her choice was registered.
- **Screen-reader notes:** the expansion is announced once, politely, via the shared live region:
  *"Directory details opened. Six more questions below."* / *"Directory details closed. Your business
  details won't be submitted."* The radios do **not** carry `aria-expanded` (invalid on a radio) and
  do not carry `aria-controls` (poorly supported and, with DOM-adjacent insertion, unnecessary).
- **Deliberate divergence from site convention:** `EventFilters.jsx` dims and disables dependent
  controls rather than hiding them. Here, declining **removes** the panel. Dimming six business
  fields in front of Carla would present them as work she is failing to do and would violate
  NFR-007's "answers zero business questions". Hiding is correct for a branch; dimming is correct
  for a filter.
- **Editability boundary:** the intro paragraph and the question label are admin-editable (FR-008).
  The "At a glance" card is **not** — it is a factual statement about system behaviour, and an admin
  editing it could make the site's disclosure untrue without anyone noticing. See "Gaps found".
- **Keyboard operation:** Tab reaches the group once; Arrow keys move and select; Space selects.
  Every target ≥ 44px (actual: 56px tall, full content width).

---

## SCREEN D-2 — Your listing details

**Purpose:** Collect exactly the six publishable fields, and make the public/private boundary
impossible to misread while she is typing into it. This is the screen FR-003's disclosure clause
is about, and it is where NFR-006 is either honoured or quietly broken.

**Entry from:** SCREEN D-1, on selecting "Yes, please — list my business".

**Exits to:** SCREEN D-3 (scroll) · back to D-1 (selecting "No", or the escape-hatch button).

### Layout Wireframe (mobile-first, 320px)

```
|<------------------ 320px ------------------>|
+---------------------------------------------+
|                                             |
|  --- Your listing details ----------- (h3)  |
|                                             |
|  +=====================================+    |
|  |  What goes public, and what         |    | (h4)
|  |  doesn't                            |    |
|  |                                     |    |
|  |  PUBLIC          |  PRIVATE         |    | (h5 x2)
|  |  anyone can see  |  never shown     |    |
|  |  - - - - - - - - + - - - - - - - -  |    |
|  |  v Business      |  # Your first    |    |
|  |    name          |    name          |    |
|  |  v Category      |  # Your sign-up  |    |
|  |  v Short         |    email         |    |
|  |    description   |  # Your postcode |    |
|  |  v Website       |  # Your answers  |    |
|  |  v Instagram     |    about your    |    |
|  |  v Public        |    business or   |    |
|  |    contact       |    career        |    |
|  |    email         |  # Your event    |    |
|  |                  |    preferences   |    |
|  |                  |  # Anything you  |    |
|  |                  |    typed in a    |    |
|  |                  |    comment box   |    |
|  |  ---------------------------------  |    |
|  |  We never publish your location.    |    |
|  |  Not your postcode, not your area,  |    |
|  |  not a map.                         |    |
|  +=====================================+    |
|    ^ v = check glyph (--color-public)       |
|      # = lock glyph (--color-private)       |
|      both aria-hidden; headings carry       |
|      the meaning                            |
|                                             |
|  Business or practice name *                |
|  +-------------------------------------+    |
|  |                                     |    | 48px, rounded-xl
|  +-------------------------------------+    |
|  This is the name shown at the top of       |
|  your listing.                              |
|                                             |
|  Category *                                 |
|  +-------------------------------------+    |
|  | Choose a category            v      |    |
|  +-------------------------------------+    |
|  Pick the one that fits best. Local         |
|  parents use these to filter the            |
|  directory.                                 |
|                                             |
|  Short description *                        |
|  +-------------------------------------+    |
|  |                                     |    |
|  |                                     |    | textarea, 5 rows
|  |                                     |    |
|  +-------------------------------------+    |
|                        300 characters left  | <- right-aligned
|  One or two sentences about what you do     |
|  and who you help. This is the main thing   |
|  people read. Plain text only - links and   |
|  formatting won't show.                     |
|                                             |
|  Website (optional)                         |
|  +-------------------------------------+    |
|  +-------------------------------------+    |
|  You can leave off the https:// - we'll     |
|  add it.                                    |
|                                             |
|  Instagram (optional)                       |
|  +-------------------------------------+    |
|  +-------------------------------------+    |
|  Your handle or the full link - either      |
|  works.                                     |
|                                             |
|  Email for enquiries *  [Shown publicly]    | <- Badge
|  +-------------------------------------+    |
|  +-------------------------------------+    |
|  This is the address your listing will      |
|  show, so anyone can see it. Use a          |
|  business address, or a free address        |
|  you're happy to make public - not the      |
|  personal one you signed up with.           |
|  Don't have one? A free address like        |
|  yourbusiness@gmail.com works well.         |
|                                             |
|  ..... same-as-signup warning slots here ...|
|                                             |
|  +-------------------------------------+    |
|  |  WHAT HAPPENS AFTER YOU SUBMIT      |    |
|  |  1. We check your listing - usually |    |
|  |     within 5 working days.          |    |
|  |  2. If it's all fine, we publish it |    |
|  |     and email you the link.         |    |
|  |  3. If something needs changing,    |    |
|  |     we'll email and explain.        |    |
|  |                                     |    |
|  |  Your listing won't appear straight |    |
|  |  away. That's normal, not a fault.  |    |
|  +-------------------------------------+    |
|                                             |
+---------------------------------------------+
```

**The same-as-signup warning, expanded:**

```
|  +-------------------------------------+    |
|  |! That's the email you signed up     |    |
|  |  with                               |    | (strong, --color-warn-text)
|  |                                     |    |
|  |  If you use it here, it will be     |    |
|  |  shown on your public listing where |    |
|  |  anyone - including people sending  |    |
|  |  spam - can see it. Most members    |    |
|  |  use a separate address for         |    |
|  |  enquiries.                         |    |
|  |                                     |    |
|  |  [ ] I understand this address will |    |
|  |      be public. Use it anyway.      |    |
|  +-------------------------------------+    |
|   ^ bg #fff7ed, 4px left rule                |
|     --color-warn-edge, rounded-2xl, p-4      |
```

**Two-column geometry, specified precisely (this is the load-bearing device):**

- Container: `Card` at full content width. At 320px: viewport 320 − 32 page padding = **288px**;
  card padding 16px each side → **256px** of inner width.
- Two columns, `display: flex`, `gap: 16px` → each column **120px** wide at 320px. It stays two
  columns at 320px. It never stacks. Stacking would destroy the whole point, which is that the
  two lists are seen *at the same time, in contrast*.
- 120px at 15px/1.45 body type fits roughly 15 characters per line, so multi-word items wrap to
  two or three lines. That is accepted and designed for: `hyphens: none`, `overflow-wrap: normal`,
  no truncation, no ellipsis, no tooltip. Nothing in this card is ever hidden behind an interaction.
- The right column carries a 1px `#e5e0ea` left border as the divider, plus its 16px gap.
- Semantics: **not a table.** The rows do not pair — "Business name" and "Your first name" have no
  relationship, and a `<table>` would invite screen readers to read them as a pair. Instead: two
  `<ul>`s, each preceded by its own `<h5>`, laid out side by side. A screen reader reads
  *"Public, anyone can see. List with 6 items: business name, category…"* then
  *"Private, never shown. List with 6 items: your first name, your sign-up email…"* — which is
  exactly the intended meaning, in the intended order.
- Column headings are the semantic carrier. The check and lock glyphs are inline SVG, `aria-hidden="true"`,
  and are shape-differentiated as well as colour-differentiated, so the card survives greyscale
  and colour-blindness (WCAG 1.4.1).
- DOM order = visual order. No CSS reordering, ever.
- The card is **rendered above the first field and stays there** — it is not collapsible, not
  behind a "learn more", not in a modal. FR-003 says "adjacent to the fields"; a disclosure that
  requires a tap has not been made.

**Tablet / Desktop variations (differences only):**
- ≥768px: column width grows to ~230px so most items fit on one line. Layout is otherwise identical.
- ≥768px: Website and Instagram sit side by side in a 2-column grid (both optional, both short).
  All other fields remain full width — including the description and the enquiry email, which must
  never be visually diminished.
- ≥768px: the "What happens after you submit" box moves to a right-hand rail alongside the last two
  fields **only if** the container is ≥1024px; below that it stays in flow. It is never sticky.
- Copy is identical at every breakpoint. No responsive truncation of any disclosure text.

### Component Hierarchy

1. `<h3>` "Your listing details" — plain heading, not `SectionHeading` (which is hard-wired to `<h2>`).
2. `PublicPrivateDisclosure` **NEW** — built on `Card` *(existing)* + `p-4`.
   1. `<h4>` "What goes public, and what doesn't"
   2. `DisclosureColumn` **NEW** ×2 — `<h5>` + `<ul>`; prop `tone: 'public' | 'private'` selects glyph and heading colour.
   3. Footer rule + the location sentence.
3. `FormField` **NEW** — the wrapper every input in this section uses. Owns `htmlFor`/`id` pairing,
   the required marker, help-text id, error-text id, and `aria-describedby` composition. **This
   component is the fix for accessibility gap #1** (the site currently has no `htmlFor` anywhere) and
   should be shared with the rest of `/join`.
   1. `TextInput` **NEW** — business name, website, instagram, enquiry email.
   2. `SelectInput` **NEW** — category. Native `<select>`; no custom listbox.
   3. `TextArea` **NEW** — description.
4. `CharacterCounter` **NEW** — sits between the textarea and its help text; three tones
   (neutral / warn / error).
5. `Badge` *(existing)* — the "Shown publicly" pill on the enquiry email label. **Requires a NEW
   variant** `public` (the existing variants are `free | sold-out | new | upcoming | past`).
   A second **NEW** variant `optional` is used on the Website/Instagram labels.
6. `InlineWarning` **NEW** — the same-as-signup block, containing a `ConsentStyleCheckbox` **NEW**
   (visually identical to the D-3 consent boxes so the "this is a deliberate acknowledgement"
   grammar is consistent).
7. `WhatHappensNext` **NEW** — `Card` *(existing)* + ordered list. Content is admin-editable except
   the final sentence.
8. `Button` *(existing)*, `variant="outline"` — the escape hatch
   *"Change my answer to 'No, not right now'"*, shown only inside the error state.
   **Requires NEW `size="sm"` support** — `Button` has fixed `px-6 py-3` and no size variants.

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Opt-in = Yes; nothing typed yet | Disclosure card, six empty fields, counter reading *"300 characters left"*, "What happens next" box. No errors. | Each input `id` ↔ `<label for>`; `aria-describedby` lists help-text id (and counter id for the textarea); `aria-required="true"` on the four required fields. |
| **Loading** | Category taxonomy request in flight | Only the category `<select>` is affected: `disabled`, single option *"Loading categories…"*. Every other field is usable. | `aria-busy="true"` on the select; on resolve, a polite announcement *"Categories loaded."* is **not** made — it would be noise. Resolution is silent. |
| **Empty** | Taxonomy resolves with zero categories (FR-017 misconfiguration) | `<select>` `disabled`, single option *"No categories available right now"*. Help text replaced with *"We'll choose a category for you when we review your listing."* The `*` required marker is removed. Submission proceeds. | `aria-disabled` + updated `aria-describedby`. Category is excluded from client validation and the server flags the listing `category_missing` for the queue. |
| **Error** | Submit with missing/invalid listing fields | Per-field: 2px `--color-error-edge` border, error text below the input in `--color-error-text` prefixed with a triangle glyph (`aria-hidden`). Above the submit button: a non-live summary list linking to each bad field. Below the last error: the escape-hatch `Button`. | Error `<p id>` appended to that field's `aria-describedby`; focus moves to the first offending field (FR-001); a `role="alert"` region is populated in the same tick with only *"3 answers need fixing."* The summary list itself is `role="group"`, **not** live, so it does not double-announce. |
| **Success** | N/A at screen level — there is no per-section save. Success is the whole-form outcome on D-4. | — | — |
| **Disabled** | Whole-form submission in progress | All inputs in the section receive `disabled`; the section dims to 60% opacity. | `[shell]` sets `aria-busy="true"` on the `<form>`; the submit `Button` carries the busy state. |

**Field-level specification**

| Field | Required | Client limit | Server limit (FR-006) | Type / mode |
|---|---|---|---|---|
| Business or practice name | ✅ | — | 80 | `text`, `autocomplete="organization"` |
| Category | ✅ (suspended if taxonomy empty) | — | must match a live category id | native `<select>` |
| Short description | ✅ | 300, **not** enforced by `maxlength` | 300, rejected not truncated | `textarea`, 5 rows |
| Website | ❌ | — | 200 | `url`, `inputmode="url"`, `autocomplete="url"` |
| Instagram | ❌ | — | 100 | `text`, `inputmode="url"` |
| Email for enquiries | ✅ | — | 254 | `email`, `inputmode="email"`, **`autocomplete="off"`** |

`autocomplete="off"` on the enquiry email is deliberate and important: browser autofill will
otherwise helpfully offer exactly the personal address this field exists to avoid.

**Exact error strings**

| Condition | Message |
|---|---|
| Business name empty | "Please add the name you'd like shown on your listing." |
| Category not chosen | "Please choose a category so people can find you." |
| Description empty | "Please add a short description — it's the main thing people read." |
| Description over limit | "Your description is {N} characters too long. Please shorten it to 300 characters or fewer." |
| Website unparseable | "That doesn't look like a web address. Try something like greenwichparents.co.uk" |
| Instagram unparseable | "That doesn't look like an Instagram handle or link. Try @yourbusiness" |
| Enquiry email empty | "Please add an email address for enquiries — it's how people will reach you." |
| Enquiry email malformed | "That doesn't look like an email address. Check for a typo." |
| Enquiry email = sign-up email, unconfirmed | "Please either use a different email for enquiries, or tick the box to confirm you're happy for your sign-up address to be public." |
| Error summary heading | "3 answers need fixing." (count pluralised: "1 answer needs fixing.") |

**Counter strings, in order of appearance**

| Remaining | Text | Tone |
|---|---|---|
| 300 → 31 | "{N} characters left" | neutral (`#1a1a2e` at 87% ≈ `#4a4a58`) |
| 30 → 1 | "{N} characters left" | warn (`--color-warn-text`) |
| 0 | "0 characters left" | warn |
| −1 and beyond | "{N} characters over the limit" | error (`--color-error-text`) |

The counter is `aria-live="polite"` with `aria-atomic="true"` but is **throttled to announce at most
once every 1.5 seconds**, and does not announce at all until fewer than 30 characters remain. An
un-throttled counter on a 300-character field is a screen-reader denial of service.

### The public enquiry contact field — detailed specification

This field is the whole reason the directory is safe for Bea, and it does not exist on the source
form. It has four jobs: be findable, be obviously public, be obviously *not* the sign-up email, and
be fillable by someone who has only ever had one email address.

**Label:** `Email for enquiries` + `Badge` reading `Shown publicly` (variant `public`).
The badge is inside the `<label>` element, so screen readers announce
*"Email for enquiries, shown publicly, edit text, required."* The public-ness is part of the
accessible name, not a visual afterthought.

**Help text (both paragraphs, in this order):**
> "This is the address your listing will show, so anyone can see it. Use a business address, or a
> free address you're happy to make public — not the personal one you signed up with."
>
> "Don't have one? A free address like yourbusiness@gmail.com works well."

The second paragraph exists because the PRD names this exact risk: members who will not nominate a
separate contact and put their personal email in anyway. Telling her the alternative is free and
takes two minutes converts more people than a warning does.

**Match detection.** Compare the trimmed, lower-cased enquiry address against the trimmed,
lower-cased sign-up address. Also match after normalising `+tag` suffixes, and (for `gmail.com` and
`googlemail.com` only) after removing dots from the local part. Anything more elaborate is
over-fitting. Detection runs on `blur` and on a 400ms debounce while typing — matching the site's
existing 600ms debounced-postcode idiom in spirit, at a snappier interval because the payoff is a
warning rather than a network call.

**Warning behaviour.**
- The warning is **advisory, not corrective**: it never rewrites the field, never clears it.
- It appears below the field, inside the field's `aria-describedby`, so a screen-reader user hears it
  when she returns to the field.
- It is announced once via the shared polite live region when it first appears:
  *"Warning: that's the email you signed up with."*
- It contains a checkbox: **"I understand this address will be public. Use it anyway."**
- Submission is blocked while the warning is showing and the checkbox is unticked.
- Editing the field to a non-matching value removes the warning **and resets the checkbox to
  unticked**, so an old confirmation can never silently authorise a new address.
- The confirmation state is recorded on the submission (`enquiry_contact_matches_signup: true`) so
  the moderator sees it in the queue and can query it before publishing. It is **not** a consent
  record — it is a UI acknowledgement, and conflating the two would pollute the consent evidence.

**Open questions Q3 / Q4 — what changes.** The base case above assumes the contact is an **email
address**. Both questions are open in the addendum; here is precisely what moves if they resolve
differently:

- **If Q3 becomes "member's choice" (email / phone / contact-page link):** a `RadioCardGroup`
  labelled *"How should people contact you?"* is inserted directly above the field, with three
  options. The field below it is a single input whose `<label>`, help text, `type`, `inputmode`,
  validation and warning all switch with the choice. The `Shown publicly` badge stays on all three.
  The same-as-sign-up warning applies only to the email option. The **phone** option needs its own
  warning, because a personal mobile is at least as sensitive as a personal email — proposed copy:
  *"This number will be shown publicly. Use a business number if you have one — a personal mobile
  is hard to take back once it's out there."* The **link** option gets no warning but does get
  scheme normalisation, and a validation rule rejecting `mailto:` and `tel:` links (which would
  smuggle the private cases through the public case). Time cost: roughly +12 seconds and one extra
  decision, on the persona least able to spare either. This section's recommendation is **email only
  for v1**, with Q3 revisited once we can see how many members ask for the alternatives.
- **If Q4 resolves to masking behind a relay:** the field, its label and its warning stay exactly
  as specified — the member still nominates an address, and it is still the address that receives
  enquiries. What changes is the **disclosure card**: the public column's sixth item becomes
  *"A contact button that emails you"* and *"Email for enquiries"* moves into the **private** column.
  Consent B's stored text changes accordingly and must be issued as `publish_listing@2.0.0`, because
  the sentence "…and public enquiry contact on the public directory page… where anyone can see them"
  would no longer be true. That is a versioning event, not a copy tweak — which is the strongest
  practical argument for settling Q4 before the first live submission.

### Interactions & Animations

| Interaction | Behavior | Timing | prefers-reduced-motion |
|---|---|---|---|
| Panel mounts (opt-in = Yes) | Expand height 0 → auto, opacity 0 → 1 | 200ms ease-out | Appears instantly at full height |
| Typing in the description | Counter number updates on every keystroke; colour tone crosses thresholds | Text updates instantly; colour transitions 100ms | Colour changes instantly |
| Counter crosses into error | Textarea border → 2px `--color-error-edge` | 100ms | Instant |
| Enquiry email matches sign-up | Warning block fades and expands in | 150ms ease-out | Appears instantly |
| Enquiry email edited to differ | Warning collapses out | 150ms ease-in | Disappears instantly |
| Focus any input | 2px `#fc16a0` ring, 2px offset. **This is net-new** — the site has no `focus-visible` styling anywhere | Instant | Instant |
| Submit with errors | Page scrolls to the first offending field (`scroll-margin-top` clears the sticky header), then focuses it | Smooth scroll, ~300ms | `scroll-behavior: auto` — jumps instantly, then focuses |
| Escape-hatch button pressed | D-2 unmounts; radio flips to "No"; page scrolls to the radio group | 160ms + instant scroll | No transition |
| Field hover (pointer only) | Border darkens one step | 100ms | Instant |

### Accessibility Annotations

- **Heading levels:** `<h3>` "Your listing details" → `<h4>` "What goes public, and what doesn't"
  → `<h5>` ×2 "Public" / "Private". No level is skipped. The `<h5>`s are visually small-caps but
  are real headings, because they are the semantic carrier of the entire disclosure.
- **Landmark role:** none. Contained in the `[shell]` `<form>` in `<main>`.
- **Focus management:** focus is never moved on mount. On failed submit, focus moves to the first
  offending field, which satisfies FR-001; the `role="alert"` count is populated in the same tick so
  a screen reader queues *"3 answers need fixing"* ahead of the field announcement. The error summary
  list is keyboard-navigable but not a live region, so it never competes.
- **Screen-reader notes:**
  - The disclosure card reads as two labelled lists in DOM order. Verify in the manual NFR-008 pass
    that the `<h5>` "Public — anyone can see this" is announced before the first list item; if a
    tested reader skips it, add a visually-hidden prefix to each `<li>` rather than restructuring.
  - The counter is polite, atomic, throttled to 1.5s, and silent above 30 remaining.
  - The "Shown publicly" badge is inside the `<label>` and therefore part of the accessible name.
  - Required fields use `aria-required="true"` **and** a visible `*` with a legend at the top of
    `/join` explaining it (`[shell]`-owned). `required` is not used on the DOM node, because native
    browser bubbles would pre-empt our own error handling and are not stylable or announceable.
  - All submitted text is rendered as plain text everywhere it is echoed back (FR-020); the
    description preview, if one is ever added, must not interpret markup.
- **Keyboard operation:** plain Tab order, top to bottom, matching visual order. The category control
  is a native `<select>` specifically so it uses the platform picker on iOS — a custom listbox here
  would be a needless keyboard and voiceover risk on the one page that must not have any.
- **Touch targets:** inputs 48px tall; the escape-hatch button 44px; the warning's confirmation
  checkbox has a 44×44px hit area with the label as part of the target.
- **Data minimisation (NFR-006):** this panel collects six fields and nothing else. Every one of the
  six appears in the FR-003 public list. Nothing is collected here "for admin use" or "in case we
  need it". If a future field is proposed for this panel and it is not published, it belongs in the
  private member record elsewhere in the form, not here — the panel's contract with the member is
  that *everything in it is public*, and that contract is worth more than the convenience.

---

## SCREEN D-3 — Privacy & consent

**Purpose:** Take two or three separate, un-pre-ticked permissions in language a parent can read at
9pm without a lawyer, and capture the evidence NFR-004 demands. This screen replaces the source
form's single undifferentiated tick, which is the live GDPR exposure named in the PRD.

**Entry from:** SCREEN D-1 (if declined) or SCREEN D-2 (if opted in), by scroll.

**Exits to:** `[shell]` submit → SCREEN D-4.

### Layout Wireframe (mobile-first, 320px)

```
|<------------------ 320px ------------------>|
+---------------------------------------------+
|                                             |
|  == Privacy & consent ================ (h2) |
|                                             |
|  Each of these is a separate choice.        |
|  Nothing is ticked for you.                 |
|                                             |
|  +-------------------------------------+    |
|  |  [ ]  Yes - Greenwich Parents &     |    |
|  |       Carers CIC can keep the       |    |
|  |       information I've given here,  |    |
|  |       and use it to run the Mums    |    |
|  |       in Business & Work community, |    |
|  |       contact me about it, and      |    |
|  |       plan events. GPC won't sell   |    |
|  |       it, and won't share it with   |    |
|  |       anyone outside GPC without    |    |
|  |       telling me first. I can ask   |    |
|  |       to see it, change it or have  |    |
|  |       it deleted at any time, and   |    |
|  |       GPC will do that within 20    |    |
|  |       working days. GPC will keep   |    |
|  |       it for <<RETENTION - Q8>>     |    |
|  |       unless I ask sooner. I've     |    |
|  |       read the privacy notice.      |    |
|  |                          ^^^^^^^^^^ |    |
|  |                          link -> /privacy|
|  |                                     |    |
|  |  You can't join without this one -  |    | <- helper, 14px
|  |  it's how we're allowed to hold     |    |
|  |  your details at all.               |    |
|  +-------------------------------------+    |
|                                             |
|  ... Consent B renders here ONLY if the ....|
|  ... member opted into the directory ....... |
|                                             |
|  +-------------------------------------+    |
|  |  [ ]  Yes - GPC can publish my      |    |
|  |       business name, category,      |    |
|  |       description, website,         |    |
|  |       Instagram and public enquiry  |    |
|  |       contact on the public         |    |
|  |       directory page of the GPC     |    |
|  |       website, where anyone can see |    |
|  |       them and search engines can   |    |
|  |       index them. My name, sign-up  |    |
|  |       email, postcode and survey    |    |
|  |       answers stay private. I can   |    |
|  |       ask GPC to take my listing    |    |
|  |       down at any time and they'll  |    |
|  |       remove it within 20 working   |    |
|  |       days. I've read the privacy   |    |
|  |       notice.                       |    |
|  |                                     |    |
|  |  We only need this because you      |    |
|  |  asked to be listed. Change your    |    |
|  |  directory answer if you'd rather   |    |
|  |  not.                               |    |
|  |  ^^^^^^^^^^^^^^^^^^^^^^ in-page link |    |
|  +-------------------------------------+    |
|                                             |
|  +-------------------------------------+    |
|  |  [ ]  Yes please - send me the GPC  |    |
|  |       weekly newsletter with local  |    |
|  |       events and news. GPC will use |    |
|  |       my email address only for the |    |
|  |       newsletter. I know I can      |    |
|  |       unsubscribe from any email,   |    |
|  |       at any time. I've read the    |    |
|  |       privacy notice.               |    |
|  |                                     |    |
|  |  [Optional]  Saying no here changes |    | <- Badge + helper
|  |  nothing else.                      |    |
|  +-------------------------------------+    |
|                                             |
|  Who holds your data: Greenwich Parents &   |
|  Carers CIC (company 16387545). Read the    |
|  full privacy notice.                       |
|                                             |
|  ---- [shell] submit button below ----      |
|                                             |
+---------------------------------------------+
```

Each consent is a `Card` with `p-4`, 1px `#e5e0ea` border, `rounded-2xl`, and a 24×24px checkbox in
a 44×44px hit area at the top-left, with the text block beside it. The **entire card is not**
clickable — only the checkbox and its label text are, so a member scrolling with a thumb on the card
does not accidentally consent.

**Tablet / Desktop variations (differences only):**
- ≥768px: consent cards remain full width and stacked. They are never placed side by side — a
  three-across row invites treating them as one decision, which is precisely the defect being fixed.
- ≥768px: text is capped at `max-w-2xl` so no consent line exceeds ~75 characters.
- No other differences. This screen is identical at every breakpoint by design.

### Component Hierarchy

1. `SectionHeading` *(existing)* — `<h2>` "Privacy & consent".
2. Intro `<p>` — "Each of these is a separate choice. Nothing is ticked for you."
3. `ConsentGroup` **NEW** — `<fieldset>` with a visually-hidden `<legend>` "Your permissions",
   containing:
   1. `ConsentCheckbox` **NEW** ×2–3. Props: `consentKey`, `version`, `required`, `text` (rendered
      verbatim from the versioned source), `helper`, `optional`. Each renders a real
      `<input type="checkbox">` with `id` ↔ `<label for>`, never a styled `<div>`.
   2. `Badge` *(existing)* — **NEW variant** `optional` on consent C; **NEW variant** `required` on A and B.
4. `FieldError` **NEW** — per consent.
5. Controller footnote `<p>` — names the CIC and its company number, links to `/privacy`.
   Required because FR-021's emails must carry the controller identity; carrying it at the point of
   collection too costs one line and closes the loop.

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Section renders | 2 or 3 unticked checkboxes. **None pre-ticked, at any time, for any reason, including on a resubmission by a returning member.** | `<fieldset>` + visually-hidden `<legend>`; each checkbox `id` ↔ `<label for>`; `aria-describedby` → helper text id. |
| **Loading** | N/A — consent text is bundled with the app at its pinned version, not fetched. It must be identical to what is stored, so it cannot depend on a network response that might fail open. | — | — |
| **Empty** | N/A — the consent set is code-defined. A missing consent definition is a build failure, not a runtime state. | — | — |
| **Error** | Submit with A unticked, or with B unticked while opted in | Card gains a 2px `--color-error-edge` left rule; error text below the checkbox; focus moves to the offending checkbox. | Error `<p id>` appended to `aria-describedby`; the shared `role="alert"` carries the count. |
| **Success** | N/A at screen level. The evidence of success is the consent record, shown to the member on D-4 as "You said yes to…". | — | — |
| **Disabled** | Submission in progress | Checkboxes `disabled`; cards dim to 60%. The submit `Button` shows the busy state. | `[shell]` sets `aria-busy` on the `<form>`. |

**Consent-specific error strings**

| Condition | Message |
|---|---|
| Consent A unticked | "We can't accept the form without this. It's the permission that lets us hold your details at all." |
| Consent B unticked while opted in | "You asked to be listed in the directory, so we need your permission to publish it. Tick this box, or change your directory answer." (the last five words are an in-page link to the D-1 radio group) |
| Consent C | Never errors. It is optional and always will be. |

### The consent artifact register — THE DELIVERABLE

These strings are stored verbatim with each submission (FR-004, NFR-004). Treat them as approved
copy pending the controller's sign-off, not as drafts to be reworded during implementation. Any
change to a `text` value below is a version bump, not an edit.

---

**Consent A — `hold_data`**
**Version:** `hold_data@1.0.0`
**Required:** always. Submission is rejected server-side without it, and no partial member record is
created (addendum FR-004 criterion).
**Rendered text (stored verbatim):**

> Yes — Greenwich Parents & Carers CIC can keep the information I've given here, and use it to run
> the Mums in Business & Work community, contact me about it, and plan events. GPC won't sell it, and
> won't share it with anyone outside GPC without telling me first. I can ask to see it, change it or
> have it deleted at any time, and GPC will do that within 20 working days. GPC will keep it for
> **«RETENTION_PERIOD — addendum Q8»** unless I ask sooner. I've read the [privacy notice](/privacy).

**Helper (not stored, freely editable):** "You can't join without this one — it's how we're allowed
to hold your details at all."

> ⚠ **This string cannot be issued as `1.0.0` final until addendum Q8 resolves.** The published GDPR
> policy states that consent-based data is kept for "the period the individual has consented to",
> which means the consent text has to actually name a period. A number is required before the first
> live submission, or every record collected before the answer will cite a version containing a
> placeholder. Flagged in "Gaps found".

---

**Consent B — `publish_listing`**
**Version:** `publish_listing@1.0.0`
**Required:** only when the member opted into the directory. Absent from the DOM otherwise.
**Rendered text (stored verbatim):**

> Yes — GPC can publish my business name, category, description, website, Instagram and public
> enquiry contact on the public directory page of the GPC website, where anyone can see them and
> search engines can index them. My name, sign-up email, postcode and survey answers stay private. I
> can ask GPC to take my listing down at any time and they'll remove it within 20 working days.
> I've read the [privacy notice](/privacy).

**Helper (not stored):** "We only need this because you asked to be listed. [Change your directory
answer](#directory) if you'd rather not."

Notes on the wording, since each clause is doing work:
- It **enumerates the six fields by name** rather than saying "your listing details". A consent that
  does not name what is published is not specific consent.
- "…and search engines can index them" is the sentence members most underestimate. It is uncomfortable
  and it stays.
- The private sentence is included inside the consent text, not only in the disclosure card, so the
  guarantee is part of the evidenced record and not merely part of the UI.
- "within 20 working days" matches the published policy exactly. If the policy changes, this is a
  version bump.

---

**Consent C — `newsletter`**
**Version:** `newsletter@1.0.0`
**Required:** never. Always optional, never pre-ticked, and declining it has no effect on anything else.
**Rendered text (stored verbatim):**

> Yes please — send me the GPC weekly newsletter with local events and news. GPC will use my email
> address only for the newsletter. I know I can unsubscribe from any email, at any time. I've read
> the [privacy notice](/privacy).

**Helper (not stored):** "Optional. Saying no here changes nothing else."

Note: this replaces the source form's "Weekly Newletter" typo (source defect #7). If the member does
not tick it, **no newsletter subscription is created by any path** (FR-004) — and per addendum Q5 the
existing Brevo sync's opt-out semantics must not be overridden by this new write path.

---

**Storage contract (what the UI must hand to the server for each ticked consent):**

| Field | Value | Note |
|---|---|---|
| `consent_key` | `hold_data` \| `publish_listing` \| `newsletter` | |
| `consent_version` | e.g. `publish_listing@1.0.0` | |
| `consent_text` | the exact rendered string, **plain text, with link URLs expanded inline** — e.g. "…I've read the privacy notice (https://greenwichparents.co.uk/privacy)." | So an admin can produce evidence without needing to render markup, and so the destination of the link is itself part of the record. |
| `granted_at` | UTC ISO-8601, set **server-side** | The client never authors a timestamp (FR-005). |
| `capture_method` | `web_form:/join` | |
| `granted` | `true` | Withdrawals append a new row with `granted: false`; nothing is ever updated (FR-004 append-only). |

**Deliberately not stored:** IP address, user agent, geolocation. Rate limiting (FR-006) may use an
IP transiently, but attaching one to a consent record would be collecting personal data no
requirement asks for — a direct NFR-006 violation. "Capture method" is what FR-004 asks for and is
what we store.

**What triggers a version bump:** any change to the rendered `consent_text`, including punctuation,
including a change to the link destination. **Not** a version bump: changes to helper text, badge
labels, card styling, or the order the consents appear in.

**Where the strings live:** in a versioned code module or a read-only reference table — **not** in the
admin-editable form configuration. FR-008 scopes admin editing to question labels, help text, options
and required flags; consent strings are not questions, and an admin silently rewording one would
produce a cohort of records citing `1.0.0` whose text differs from `1.0.0`, which destroys the
evidence NFR-004 exists to create. The admin panel should *display* the current text and its version,
read-only, next to a note explaining why it is read-only.

### Interactions & Animations

| Interaction | Behavior | Timing | prefers-reduced-motion |
|---|---|---|---|
| Tick a consent checkbox | Box fills `--color-primary-700`, white check draws in | 120ms; check draw 150ms | Fill and check appear instantly, no draw |
| Consent B mounts (member opts in) | Card expands 0 → auto height, opacity 0 → 1 | 200ms ease-out | Appears instantly |
| Consent B unmounts (member opts out) | Card collapses and unmounts | 160ms ease-in | Disappears instantly |
| Focus a checkbox | 2px `#fc16a0` ring, 2px offset, drawn around the checkbox **and** its label text | Instant | Instant |
| Tap the `/privacy` link | Opens in a **new tab**, `rel="noopener"`, with a visually-hidden "(opens in a new tab)" suffix | — | — |
| Submit with a required consent unticked | Scroll to and focus the offending checkbox | Smooth ~300ms | Instant jump, then focus |
| Follow "change your directory answer" | Scroll to D-1 and move focus to the checked radio | Smooth ~300ms | Instant jump, then focus |

The `/privacy` link opening in a new tab is deliberate and is the one place on `/join` where that is
correct: a member who navigates away from a partially-filled form to read the notice and then hits
back has, in the worst case, lost everything she typed. There is no saved-progress feature
(deferred as FR-D07), so the new tab *is* the mitigation.

### Accessibility Annotations

- **Heading level:** `<h2>` "Privacy & consent", peer of "The GPC member directory".
- **Landmark role:** none. `<fieldset>` with a visually-hidden `<legend>` "Your permissions" groups
  the checkboxes so a screen reader announces the grouping once.
- **Focus management:** none on mount, including when Consent B appears — it is inserted in DOM order
  after Consent A, so it is reached naturally. On failed submit, focus moves to the first unticked
  required consent.
- **Screen-reader notes:**
  - Each checkbox's accessible name is its full consent sentence. That is long — deliberately.
    Truncating it into "I agree to the terms" with the real text elsewhere would mean the sentence a
    screen-reader user hears is not the sentence stored as her consent, which is exactly the failure
    NFR-004 is written to prevent.
  - The `/privacy` link inside the label is reachable: screen readers expose links within labels, and
    the link is also duplicated in the controller footnote below the group as a plain, non-nested
    route to the same page for any reader that does not.
  - Consent B's appearance is announced via the shared polite region:
    *"One more permission added: publishing your directory listing."*
  - The `Optional` badge is inside consent C's `<label>`, so optionality is part of the accessible name.
- **Keyboard operation:** Tab to each checkbox, Space to toggle. The links inside labels are in the
  tab order between checkboxes; this is expected and correct, and must be verified in the manual
  NFR-008 pass because a label-wrapped link is a known screen-reader edge case. **If any tested
  reader fails to expose it, move the link out of the label to the line immediately below rather than
  removing it — FR-004 requires the consent copy to link to `/privacy`.**
- **Never pre-ticked, and no dark patterns:** no "select all", no checkbox pre-filled from a previous
  session, no consent implied by proceeding, no visual emphasis making the optional one look required
  or vice versa. The optional one is the *last* item, not the first.

---

## SCREEN D-4 — Submitted: what happens next

**Purpose:** Close the loop. Tell the member her listing is real, is not live yet, and why that is
correct rather than broken (FR-015). Restate which consents she gave, so the record she now has is
the record we have.

**Entry from:** `[shell]` successful submit.
**Exits to:** `/` home · `/whats-on` · `/privacy` · `/directory` (browse what she is joining).

> **Overlap note:** the confirmation screen as a whole is owned by the form-shell section. This
> section specifies only the **listing-and-consent portion** of it. Merge by nesting these blocks
> inside the shell's confirmation layout.

### Layout Wireframe (mobile-first, 320px)

```
|<------------------ 320px ------------------>|
+---------------------------------------------+
|                                             |
|      (check glyph, --color-public)          |
|                                             |
|  == Thanks - you're in ================ (h1)|
|                                             |
|  We've got your details and you're part of  |
|  the GPC Mums in Business & Work community. |
|                                             |
|  +-------------------------------------+    |
|  |  YOUR DIRECTORY LISTING             |    | (h2)
|  |                                     |    |
|  |  [Awaiting review]                  |    | <- Badge, NEW variant
|  |                                     |    |
|  |  Your listing isn't live yet - and  |    |
|  |  that's normal. A GPC admin reads    |    |
|  |  every listing before it goes on     |    |
|  |  the site.                          |    |
|  |                                     |    |
|  |  1. We check it - usually within 5  |    |
|  |     working days.                   |    |
|  |  2. If it's all fine, we publish it |    |
|  |     and email you the link.         |    |
|  |  3. If something needs changing,    |    |
|  |     we'll email and explain how to  |    |
|  |     fix it.                         |    |
|  |                                     |    |
|  |  Nothing about your listing is      |    |
|  |  public until then.                 |    |
|  +-------------------------------------+    |
|                                             |
|  +-------------------------------------+    |
|  |  WHAT YOU AGREED TO                 |    | (h2)
|  |  v  We can hold your details        |    |
|  |  v  We can publish your listing     |    |
|  |  x  Weekly newsletter - you said no |    |
|  |                                     |    |
|  |  Change your mind at any time -     |    |
|  |  see the privacy notice.            |    |
|  +-------------------------------------+    |
|                                             |
|  [ Browse the directory ]  <- Button        |
|  [ See what's on ]         <- Button, outline|
|                                             |
+---------------------------------------------+
```

If the member did **not** opt into the directory, the "Your directory listing" card is absent
entirely and the "What you agreed to" card lists two lines instead of three.

**Tablet / Desktop variations (differences only):**
- ≥768px: the two cards sit side by side, equal height, `gap-8`. The buttons form a single row.
- No copy changes.

### Component Hierarchy

1. `<h1>` "Thanks — you're in" — this is the shell's confirmation heading; on `/join` the form's own
   `<h1>` is replaced by it (FR-001: "the form is replaced by a confirmation state").
2. `Card` *(existing)* — "Your directory listing", conditional on opt-in.
   1. `Badge` *(existing)* — **NEW variant** `awaiting-review` (amber-toned, using `--color-warn-text`
      on `#fff7ed`; the existing `upcoming` variant is close but semantically wrong).
   2. Ordered list of the three steps.
3. `Card` *(existing)* — "What you agreed to". Rendered from the consent records actually stored,
   not from local form state, so it reflects what the server persisted.
4. `Button` *(existing)* ×2 — "Browse the directory" (`variant="primary"`, fill `--color-primary-700`,
   white text) and "See what's on" (`variant="outline"`).

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Submission succeeded, member opted in | Both cards; `Awaiting review` badge. | Confirmation container is `role="status"` and receives focus (`tabindex="-1"`) on mount, reusing the `NewsletterBanner.jsx` live-region idiom. |
| **Loading** | N/A — this screen only renders after the request resolves. The in-flight state belongs to `[shell]`'s submit button. | — | — |
| **Empty** | Submission succeeded, member declined the directory | The listing card is absent; "What you agreed to" shows two lines. Not an error, not an empty-state illustration — just a shorter page. | — |
| **Error** | N/A — a failed submit never reaches this screen; `[shell]` keeps the form mounted with all values intact and shows the failure inline. **The form is never cleared on error.** | — | — |
| **Success** | This screen *is* the success state. | As Default. | Focus + `role="status"`. |
| **Disabled** | N/A — nothing here is disableable. | — | — |

### Interactions & Animations

| Interaction | Behavior | Timing | prefers-reduced-motion |
|---|---|---|---|
| Confirmation replaces the form | Cross-fade: form out, confirmation in | 250ms | Instant swap, no fade |
| Check glyph at the top | Draws in once | 400ms | Rendered complete, static |
| Card entrance | Staggered fade-in, `delay: i * 0.1` (the `Events.jsx` idiom) | 300ms each | All cards visible instantly, no stagger |
| Focus the confirmation container | Moved programmatically on mount | Instant | Instant |
| Button hover/press | Existing `Button` behaviour | Existing | Existing |

### Accessibility Annotations

- **Heading level:** `<h1>` "Thanks — you're in" replaces the form's `<h1>`; the two cards use `<h2>`.
- **Landmark role:** `<main>`; the confirmation container is `role="status"` with `aria-live="polite"`.
- **Focus management:** focus moves to the confirmation container on mount so a screen-reader user is
  not left focused on a submit button that no longer exists. The container is `tabindex="-1"` and is
  removed from the tab order after blur.
- **Screen-reader notes:** the "What you agreed to" list uses text ("you said yes" / "you said no"),
  not a tick/cross glyph alone. The glyphs are `aria-hidden`.
- **Keyboard operation:** two buttons in the tab order, both ≥44px. No focus traps, no auto-redirect,
  no timed dismissal — the page stays until she leaves it.

---

## Cross-cutting requirements traceability

| Requirement | Where satisfied in this section |
|---|---|
| FR-003 — opt-in captures publishable content | D-2 field set (6 fields, 4 required); D-1 opt-in reachable by Career-only members via the explicit helper "Open to everyone" |
| FR-003 — adjacent public/private statement | D-2 `PublicPrivateDisclosure`, rendered above the first field, non-collapsible, two columns at every breakpoint |
| FR-003 overflow — live counter, blocking, no truncation | D-2 `CharacterCounter`; no `maxlength`; blocking error string specified |
| FR-003 overflow — scheme normalisation | D-2 field table; forgiving client, normalising server |
| FR-003 overflow — sign-up-email warning + confirm | D-2 "public enquiry contact" detailed spec |
| FR-003 overflow — empty category does not block | D-2 **Empty** state; `category_missing` flag to the queue |
| FR-004 — three separate consents, none pre-ticked | D-3 `ConsentGroup`; consent B conditional on opt-in |
| FR-004 — consent copy links to `/privacy` | All three strings in the consent register |
| FR-004 — text, version, timestamp, method stored | D-3 storage contract |
| FR-004 — append-only | D-3 storage contract (`granted: false` appends) |
| FR-004 — no newsletter without consent C | D-3 consent C note; addendum Q5 dependency named |
| FR-008 — editability boundary | D-1 note (disclosure not editable); D-3 note (consent strings not editable) |
| FR-015 — review expectation set | D-2 "What happens after you submit"; D-4 "Your directory listing" |
| FR-020 — plain text | D-2 description helper; D-4 echoes are plain text |
| NFR-004 — consent evidenced | D-3 consent register + storage contract |
| NFR-006 — minimisation | D-2 six fields only; D-3 no IP/UA on consent records |
| NFR-007 — five minutes; Career Mum answers zero business questions | D-1 removes (not dims) the panel on "No"; journey timings |
| NFR-008 — WCAG 2.1 AA | Every screen's Accessibility Annotations; `FormField` **NEW** fixes gap #1 site-wide; focus rings fix gap #4; reduced-motion columns fix gap #5 |

---

## Gaps found

1. **Description character limit is unspecified in the PRD.** FR-003 and the addendum require "an
   enforced character limit" but name no number. This draft specifies **300 characters** — chosen so a
   description fills roughly four lines on a 320px directory card without truncation. Needs a product
   decision to confirm. If it changes, the counter strings and the server limit change together.
2. **Retention period (addendum Q8) blocks Consent A from being finalised.** The consent text has to
   name a period, because the published GDPR policy makes the consented period the retention basis.
   Until Q8 resolves, `hold_data@1.0.0` contains a placeholder and **must not be used for a live
   submission**. This is the single hardest blocker in this section: every day the form is live with a
   placeholder produces records citing unevidenceable text.
3. **Addendum Q3 (contact type) and Q4 (masking) are open, and Q4 is a versioning event.** If enquiry
   contact is masked behind a relay, Consent B's text becomes false and must ship as
   `publish_listing@2.0.0`, splitting the member base across two versions. Recommendation: settle Q4
   before the first live submission; settle Q3 as "email only" for v1.
4. **Semantic status colours do not exist in the token set.** Seven values are proposed at the top of
   this document. DESIGN.md must ratify them; without them there is no accessible way to render an
   error, a warning, or the public/private distinction.
5. **`Badge` needs five new variants** — `public`, `private`, `required`, `optional`,
   `awaiting-review` — beyond the existing `free | sold-out | new | upcoming | past`.
   **`Button` needs `size="sm"`, a disabled style, and a loading/busy state**, all three of which the
   shared context confirms are absent.
6. **Whether the public/private disclosure card and the consent strings are admin-editable is not
   stated in FR-008.** This draft specifies that **neither is** — an admin who can reword a factual
   disclosure or a stored consent can make the site's evidence untrue without a deploy or a review.
   Needs confirmation from the controller, since it constrains FR-008's admin UI.
7. **The proposed success metric "≥80% of opted-in submissions use a non-sign-up enquiry contact" is
   not in the PRD.** It is the only direct measure of whether the privacy design survives contact
   with real members, and the PRD already names the failure as a live risk. Proposed for addition to
   the Success Metrics table.
8. **"Usually within 5 working days" is copy that makes a promise.** The PRD's target is a *median* of
   5 working days for a moderation decision, which is not the same as a commitment shown to members.
   Either the copy softens to "usually within a week" or the admin process commits to the number.
   Flagged because the string is member-facing and appears twice.
9. **Addendum Q7 (last name) touches this section.** If a last name is collected, it must be added to
   the **private** column of the disclosure card, and Consent B's "My name … stays private" clause
   already covers it — but the disclosure card list must be updated in the same change, or the card
   becomes incomplete.
