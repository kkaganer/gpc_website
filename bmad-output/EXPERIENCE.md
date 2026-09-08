# EXPERIENCE.md — User Experience Plan

> **LOCKED PLANNING ARTIFACT.** The external dev tool reads this document but must not
> edit it. All UX changes go through the bmad-ux skill and are recorded in `decision-log.md`.

**Project:** GPC Mums in Business & Work — Membership Intake & Community Business Directory
**Track:** BMad Method
**Date:** 2026-08-18
**Version:** 1.0
**Design system reference:** [`DESIGN.md`](./DESIGN.md) — tokens, components and the WCAG 2.1 AA
contract live there and are referenced, never restated, below.
**Requirements:** [`prd.md`](./prd.md) · open questions: [`addendum.md`](./addendum.md)

---

## Overview

This plan covers one member-facing journey and five operator surfaces built around a single
guarantee: **a member's personal details are never publicly reachable, and nothing about her
business becomes public until an admin publishes it.**

The product replaces a third-party Tally form (`tally.so/r/RG1M6K`) that asks members to join a
"trusted directory of local businesses" which does not exist, collects almost nothing publishable,
and takes one undifferentiated consent tick it cannot evidence. Every one of that form's ten
documented defects is fixed here rather than reproduced.

**Personas covered:** Bea (Business Mum), Carla (Career Mum), Ash (GPC volunteer admin),
Priya (public visitor). Full descriptions in `ux-drafts/ux-shared-context.md`.

**Platform targets:** Mobile-first from 320px. iOS Safari is the priority browser — most of this
audience arrives from Instagram on a phone. Breakpoints 320 / 768 / 1024 / 1440, hinged on the
site's existing `md:` (768px).

### Section map

| § | Section | Persona | Requirements |
|---|---|---|---|
| 1 | Joining — the public form | Bea, Carla | FR-001, FR-002, FR-007, FR-009, NFR-007, NFR-009 |
| 2 | The directory opt-in and consent | Bea | FR-003, FR-004, NFR-004, NFR-006 |
| 3 | Moderating the directory | Ash | FR-015, FR-016, FR-017, FR-021, FR-022, NFR-013 |
| 4 | Configuring the form | Ash | FR-008, FR-009, FR-010, FR-006 (abuse counter) |
| 5 | Member records and demand insights | Ash | FR-012, FR-013, FR-014, NFR-010 |
| 6 | The public directory | Priya | FR-018, FR-019, FR-020, NFR-009 |
| 7 | Data rights, errors and edge cases | all | FR-023, **FR-024**, NFR-005, NFR-011 + cross-cutting |

### How this document was produced, and what that means for trust

Seven sections were drafted independently, then audited by a separate critic which found
**two uncovered requirements, seventeen cross-section contradictions, four screens nobody
owned, and eight places where copy had been promised and not written.** Every finding was
adjudicated before this document was assembled.

Where a ruling overturned a draft, the reasoning is recorded in
[`ux-drafts/ADJUDICATIONS.md`](./ux-drafts/ADJUDICATIONS.md) (A1–A21). The audit itself is at
[`ux-drafts/CRITIQUE.md`](./ux-drafts/CRITIQUE.md), and the long-form drafts are retained in
`ux-drafts/` as supporting detail. **This document and the adjudications win over anything in
those drafts.**

Three findings worth naming here, because they change what gets built:

1. **The primary button fails accessibility today.** White on `--color-primary` `#fc16a0` measures
   **3.64:1** against a 4.5:1 requirement. So does the existing skip link. `DESIGN.md` §0 carries
   the corrections.
2. **FR-006's abuse counter and FR-024's privacy-page content had no design at all.** Both are now
   specified — §4 and §7 respectively. FR-024 gates launch.
3. **One consent string still contains a placeholder.** The retention period in the "hold my data"
   consent is unresolved (addendum Q8) and is marked as blocking in §2. It cannot ship as a
   placeholder: every day the form is live with it produces consent records citing text the
   organisation cannot evidence.

### Conventions used below

- Screen IDs are local to their section (S1, D-1, M-S1, …) and are stable references for story authors.
- ASCII wireframes are drawn at **320px** proportions. Tablet and desktop are described as differences only.
- Named states are tabulated as **State | Trigger | Display | ARIA**. Every screen carries all six,
  or an explicit N/A with a reason.
- Microcopy inside quotation marks is **the copy**, not an illustration of its tone.
- The consolidated error catalogue, the single animation table, and the `/privacy` specification
  are all in §7 — no other section duplicates them.

---

## 1. Joining — the public form

**Covers:** FR-001, FR-002, FR-006 (member-facing surface), FR-007, FR-009, NFR-007, NFR-008, NFR-009 (second clause).
**Boundary:** the directory opt-in fields (FR-003) and the granular consent block (FR-004) have their own sections. This one shows where they sit in the flow and stops at their edge.
**Tokens, component visuals, contrast pairs and the WCAG contract live in `DESIGN.md` and are never restated here.**

### Decisions that shape every screen below

**D1 — one scrolling page, not a stepped flow.** `/join` is a single page of numbered sections with one Submit at the bottom. Reason, stated once: a stepped flow charges six navigation taps that do no work, hides the end of the form at the moment the member is deciding whether to continue, and adds per-step focus management — the commonest WCAG failure in multi-step forms. The repo has no form library, no state machine and no multi-step precedent (NFR-012).

**D2 — how a long form is made to feel short.** (a) an honest length signal at the top, per D3; (b) numbered, named, counted sections — `«k» of «T» · Your group` — each gaining a `Done` `Badge` when its required fields are answered (variants per `DESIGN.md` §2.7); (c) the three long-text questions (B7, C4, "What do you hope to gain") ship `required = false`, the largest single completion lever available, and FR-008 lets an admin re-require them without a deploy; (d) a one-tap escape from the day/time grid (S3); (e) a decorative scroll-linked progress rail, `aria-hidden` — scroll-linked, never answer-linked, because an answer-linked bar runs *backwards* when a member picks "Both"; (f) nothing is asked twice (D4).

**D3 — the length signal is computed, never authored (A12).** `«N»` is the number of questions **currently rendered for this member's branch**, recomputed on every branch change; `«T»` is the number of sections currently rendered (one more for "Both"). The same computed values appear in the header, in every section heading, and in the wireframes below — `«N»` is notation, not a placeholder for a constant. **No figure in this document is normative; the rule is.** The signal reads `"⏱ About «M» minutes · «N» questions"`, `«M»` derived from `«N»`, announced only on change.

**D4 — business fields are pre-filled, not re-asked.** FR-002 fixes the Business branch at seven questions (three of them business name / website / Instagram, B3–B5); FR-003 independently requires the same three in the directory section. When both are present the directory section arrives pre-filled and fully editable under: *"We've copied these from your business answers above. Edit them if you'd like them to read differently in the directory."* A Career Mum who opts in types them fresh, which FR-003 requires to work.

**D5 — submission is idempotent (A19).** The client generates one idempotency key per form session and sends it with every attempt; retries reuse it. This is what makes S6's retry copy true rather than merely reassuring.

**D6 — errors on submit follow `DESIGN.md` §2.10 exactly (A1).** One `ErrorSummary` banner, `role="alert"`, rendered **immediately above the Submit button**. **Focus always moves to the summary**, whatever the error count. Each listed error is a link to its field. Per-field messages are `aria-describedby` text with `aria-invalid="true"` — they are **not** their own alert regions (A13). Only rendered questions are validated; hidden-branch questions are never required and never appear in the summary (FR-002).

**D7 — one polite region, one alert region, per page (A13).** The `LengthSignal`, `ChoiceCount`, the matrix count, the loading and sending announcements and §2's character counter all write into the **same** throttled `aria-live="polite"` region. The `ErrorSummary` is the **only** `role="alert"`. Four simultaneous regions on `/join` would produce interleaved, unintelligible speech.

---

### Journey J1 — Bea joins as a Business Mum and asks for a directory listing

**Goal:** get her home-run business into a directory local parents actually read, without her postcode or personal email reaching the public internet.
**Persona:** Bea — Business Mum. Phone, evening, tired. Motivated by visibility, genuinely anxious about exposure.
**Time:** 4:30–5:30 min — the long path, and the one NFR-007's five-minute median is measured against.
**Entry points:** navbar CTA `Join` — a `Button`-styled CTA to the right of the nav row, **not** a seventh `NavItem`, which would wrap at 1024px (A11); homepage CTA; `/directory` — *"Run a local business? Add your listing"*, the highest-intent entry because she has just seen what a listing looks like; Instagram bio; weekly newsletter; a redirect from the retired `tally.so/r/RG1M6K` URL.
**Success:** she reaches the confirmation and it says unambiguously that the listing is *pending review* and not yet public; she read which fields become public **before** typing any business detail; three separate consents, none pre-ticked; postcode and signup email absent from the public payload; she never typed her business name twice.

```
 navbar CTA · homepage · /directory · Instagram · newsletter · Tally redirect
                      │
              GET /join → fetch form config
                      │
         open = false ─┴─ open = true → S1  ⏱ About «M» min · «N» questions
              ▼                             1 of «T» · About you   4 q
        [S4 · Closed]                       name* email* postcode* how-heard*
          FR-009                                        │
                                            S2  2 of «T» · Your group  1 q
                                            ( ) Business ( ) Career ( ) Both
                                                        │ branch mounts,
                                                        │ «N»/«T» recompute,
                                                        │ polite announcement
                                            S3  3 of «T» · Your business  7 q
                                                4 of «T» · Events        3 q
                                                5 of «T» · Community     2 q
                                                        │
                                            Directory opt-in (FR-003, §2) —
                                            disclosure panel FIRST, then the
                                            6 fields; name/web/IG pre-filled
                                                        │
                                            Privacy & consent (FR-004, §2)
                                                        │
                                            [ErrorSummary renders HERE]
                                            [ Send my answers ]
                                                        │ POST /api/join
                                                        │ + idempotency key
                                                        │ + honeypot, origin,
                                                        │   rate limit FR-006
                                              2xx ──────┴────── non-2xx
                                               ▼                   ▼
                                       [S5 · Success]      [S6 · Errors]
                                    /directory · /whats-on · /privacy
```

| Trigger | Display | Recovery |
|---|---|---|
| Config fetch fails on load | *"We couldn't load the form just now."* / *"This is our end, not yours."* + `Try again`. **Never** falls back to the closed state — a failed fetch must not be mistaken for an admin decision, nor for "open" (submissions would be rejected downstream) | Retry refetches; after two failures the copy adds `gpc.communitynews@gmail.com` |
| Admin closes the form mid-session (409) | Page replaced by S4 with a leading alert: *"Sorry — sign-ups closed while you were filling this in. Nothing was saved."* | `Back to home`. Not recoverable, and we say so rather than implying otherwise |
| She changes her group after answering branch questions | `Dialog` (`DESIGN.md` §2.9) — see S2. FR-002 requires the discard; the dialog is the only warning | "Keep Business Mums" cancels; focus returns to the radio she acted on |
| She opts into the directory having chosen only "Career Mums" | Fields appear with nothing to pre-fill. FR-003 requires this path to work — it is the fix for source-form defect 1 | None needed; a supported path, not an error |
| She types her signup email into the public enquiry contact | *"That's the same address you signed up with. It would be shown publicly on your listing. Use it anyway?"* + a `"Yes, publish this address"` checkbox; submit blocked until she changes it or ticks | Changing the value clears both |
| Public description exceeds 300 characters (A8) | Live count flips to `"18 over"`; field `aria-invalid`; submit blocked. Never silently truncated | Editing restores the count |
| Double-tap on Submit | Button enters `loading` — *"Sending…"*, `aria-busy`, `aria-disabled`, pointer-inert. D5 makes a genuine double-post harmless | N/A |
| Rate limit hit (FR-006) | *"You've sent this a few times in a row. Please wait a moment and try again."* + countdown on Submit. **Never** *"you look like a bot"* — a real member on shared café wi-fi will hit this | Countdown expires; answers untouched |
| She has submitted before with this email | **Nothing different.** FR-007: the ordinary confirmation, because the response must never reveal whether an email is registered | N/A by design |
| Honeypot completed (bot) | The ordinary confirmation (FR-006), rendered from the submitted payload and never from stored records (A2) — reading back the database would tell the bot it was caught | N/A |

**Drop-off.** The riskiest moment is the directory section, not the business one: four minutes in, she is asked which of her contact details she will put on the open web — a decision she has probably never made. The disclosure panel therefore sits **above** the fields, so she is thinking about the boundary before a field asks her to act on it. Second: B7, a long-text question at minute two, required in the source form and de-required per D2c. Third: the day/time grid, which as the source renders it is ~1,000px of scroll for one question, so a member thumb-scrolling to "see how long this is" overestimates the form threefold; S3 fixes it. **Where she will not drop off:** the branch moment — `«N»` does not grow when she picks Business Mums, and growth at the moment of commitment is what punishes people. **Unmitigated:** iOS Safari discarding a backgrounded tab; FR-D07 is deferred because identifying a partial submitter before consent is itself processing (see Notes).

---

### Journey J2 — Carla joins as a Career Mum and declines the directory

**Goal:** support and connection in as few taps as the form can honestly manage, without ever being asked about a business she does not have.
**Persona:** Carla — Career Mum, employed or returning after leave, filling forms in fragments between other tasks. **Will abandon the moment she meets an irrelevant question.**
**Time:** 2:15–3:00 min. `«N»` *falls* when she picks Career Mums, and the fall is announced.
**Entry points:** as J1 minus `/directory`, plus the one that matters most for her — a link in a GPC WhatsApp group or an event follow-up, tapped one-handed.
**Success:** zero business questions (proof below); the length signal drops and is announced; declining the directory asks none of FR-003's six fields; confirmation in under three minutes.

```
 S1 identity → S2 (•) Career Mums → Career section mounts (4 q);
      Business NEVER mounts; «N», «M» fall; polite region announces both
                      ▼
 S3  Your career 4 q — C1 situation* (10 options, de-duplicated: defect 3),
     C2 industry*, C3 support*, C4 challenge (optional)
     ✗ no stage · ✗ no business industry · ✗ no name/website/Instagram
     ✗ no business "looking for" · ✗ no business challenges
     Events: [✓] "I'm flexible" = 1 tap · frequency radio
     Community: 2 optional questions skipped → section reads Done
                      ▼
 Directory: (•) "No, not right now" → NOTHING expands. FR-003: none of these
     fields are requested and none are stored.
 Consent: hold-my-data* ticked. Publish-my-listing consent NOT RENDERED
     (FR-004b — required only on opt-in). Newsletter left off.
                      ▼
 [ Send my answers ] → [S5]  "You're in, Carla." No listing paragraph, no
     review timeframe, no newsletter line.   →   /whats-on · /
```

**The zero-business-questions proof (NFR-007 evidence).** Rendered: **0**. In the tab order: **0**. In the heading tree: **0**. In the submitted payload: **0**. The Business section component is **never mounted**, so there is nothing to hide, disable or filter at submit time — which is why branch content is unmounted rather than `hidden`: a `hidden` fieldset is still a payload risk and still a maintenance trap. **Stated with its condition attached:** the guarantee holds for a Career Mum who *declines* the directory, exactly the case NFR-007 names. One who *opts in* is asked FR-003's six listing fields, which are business fields in substance — required by FR-003, and the deliberate fix for source defect 1. Acceptance tests must quote the condition, not round it up.

| Trigger | Display | Recovery |
|---|---|---|
| Career → Both | **No dialog.** "Both" is a superset; her career answers stay and the Business section mounts below, with a polite announcement of the new `«N»` | N/A |
| Both → Career, having answered business questions | `Dialog`; the business answers are the abandoned set (S2) | "Keep Both" cancels |
| She declines the directory after opting in and typing fields | `Dialog`: *"Your listing details will be cleared. Nothing is saved and nothing is sent to GPC."* FR-003 requires declined fields not be stored | "Keep my listing details" cancels |
| She leaves both Community questions blank | Heading reads `Done`. No nag, no asterisk, no "are you sure" | N/A |
| She ignores the day/time matrix and submits | Summary entry: *"Which days and times work for you — pick at least one slot, or tick 'I'm flexible'."* The recovery is named in the error text | One tap on "I'm flexible" |
| Her postcode fails format validation | *"That doesn't look like a UK postcode. Try something like SE10 8XJ."* Debounced 600ms, matching `EventFilters.jsx`'s three-state idiom; not blocking until submit | Corrects it |

**Drop-off.** Her risk is front-loaded and entirely about relevance, which is why the branch question is section 2 — as early as it can be without asking her group before her name, which reads as pushy. The postcode is her specific risk: she has no reason to believe GPC needs her home postcode, so the hint is load-bearing and must sit **under the label, above the input**, read before the field is focused. The events section reads as effortful, which is why the escape hatch is the *first* thing inside the question, not a link under the grid. Quietest risk: the directory question reads like a trap to someone with no business, so *"You can ask to be listed later — just fill this in again."* is present in **both** states of the question, doing its work while she decides.

---

#### Screen S1 — Intro and identity

**Purpose:** establish this is GPC's own form (not a third-party embed), set an honest expectation of length, and collect the four unconditional identity answers before anything that could feel intrusive. **Entry:** all J1/J2 entry points. **Exit:** S2, by scrolling — there is no navigation event.

```
┌──────────────────────────────────────────────┐ 320px
│  GPC                          [Join]     [≡] │  Navbar + CTA button (A11)
│▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  progress rail, aria-hidden
│  Join GPC Mums in Business & Work            │  <h1>, DESIGN.md §2.11
│  Local parents running events and activities │  admin-authored intro,
│  for local families…                         │  plain text (FR-008/FR-020)
│  ┌────────────────────────────────────────┐  │
│  │ ⏱ About «M» minutes · «N» questions    │  │  LengthSignal → the shared
│  │ 🔒 Your email, postcode and answers     │  │  polite region, on change
│  │    are never shown publicly.           │  │  only, silent on first paint
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │  Card, DESIGN.md §2.6
│  │ 1 of «T» · About you       4 questions │  │  <h2>, count right-aligned
│  │ What's your first name?              * │  │  label + htmlFor/id
│  │ [__________________________________]   │  │  DESIGN.md §2.4
│  │ What's your email address?           * │  │
│  │ We'll only use this to contact you     │  │  hint ABOVE the input,
│  │ about GPC.  [_____________________]    │  │  aria-describedby
│  │ What's your postcode?                * │  │
│  │ We use this to plan events near you.   │  │  ← the hint that does the
│  │ It's never shown publicly and never    │  │  persuading. 600ms debounce,
│  │ leaves GPC.  [ SE10 8XJ ___________]   │  │  3-state border, NO geocoding
│  │ How did you hear about us?           * │  │  (a geocoder is a processor
│  │ ( ) Greenwich Parents & Carers         │  │  we would have to disclose,
│  │ ( ) Weekly newsletter   ( ) Instagram  │  │  for a private field)
│  │ ( ) A friend  ( ) At an event          │  │  fieldset/legend, full-row
│  │ ( ) Google    ( ) Something else       │  │  44px targets, DESIGN.md §2.5
│  └────────────────────────────────────────┘  │  ← "Newletter" typo fixed
└──────────────────────────────────────────────┘
```

**≥768px, differences only:** the column caps at `max-w-2xl` and centres — never two columns, which makes reading order ambiguous for eyes and screen readers alike; the LengthSignal moves inline beside the `<h1>`; at ≥1024px a sticky rail lists section names with ticks, `aria-hidden` and **read-only**, not jump navigation, because jumping past unanswered required fields is how people submit incomplete forms.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Config loaded, `open = true` | As drawn | Heading text carries the count; nothing announced on first paint |
| Loading | Config fetch in flight | `<h1>` paints immediately (it is static); below it, skeletons at the heights of the first three sections — skeletons for page load, the shared `Spinner` only for in-flight actions (A7) | Skeleton container `aria-busy="true"`; polite region: *"Loading the form"* → *"Form ready. «N» questions, about «M» minutes."* |
| Empty | N/A — a blank form is the Default state; no data-bearing collection here can be empty | — | — |
| Error | Config fetch failed | Full-page: *"We couldn't load the form just now."* / *"This is our end, not yours."* / `Try again` | The page's single alert region |
| Success | N/A — success is a whole-page state (S5); FR-001 requires the form to be *replaced* | — | — |
| Disabled | N/A — no field here is ever disabled | — | Deliberate: disabled inputs are skipped by some screen readers and cannot be focused to read their own explanation |

**Accessibility (non-obvious only).** One `<h1>`; every section title an `<h2>`; questions are `<label>`/`<legend>`, never headings — a 25-heading document is worse to navigate than a 7-heading one. The `<form>` gets no `role="form"` and no `aria-label`: one form in one `<main>` is unambiguous and an extra landmark only adds a rotor stop. **Do not add a skip link** — one already exists at `Layout.jsx:8-10` wrapping every public page; its contrast must be corrected to `--color-primary-700` (it currently paints white on `--color-primary`, 3.64:1) and its `focus:` changed to `focus-visible:`. No programmatic focus on load. The privacy one-liner is static text placed *before* the first input, so it is heard before the member commits anything.

---

#### Screen S2 — Group choice and the branch change

**Purpose:** capture the one answer that determines the shape of the rest of the form, and change that shape in a way the member expects and can back out of before losing anything. **Entry:** S1. **Exit:** branch sections mount in place; or the `Dialog`, when a change would discard answers.

```
┌──────────────────────────────────────────────┐ 320px
│  ┌────────────────────────────────────────┐  │
│  │ 2 of «T» · Your group      1 question  │  │  <h2>
│  │ Which group would you like to join?  * │  │  <legend>
│  │ This is the only answer that changes   │  │  hint — sets the
│  │ the rest of the form.                  │  │  expectation up front
│  │ ┌────────────────────────────────────┐ │  │
│  │ │ ( ) Business Mums                  │ │  │  56px rows (two-line
│  │ │     I run or am starting a         │ │  │  options); whole row is
│  │ │     business        +7 questions   │ │  │  the target
│  │ │ ( ) Career Mums                    │ │  │
│  │ │     Employed, freelancing or       │ │  │  the "+N questions" line
│  │ │     returning       +4 questions   │ │  │  is aria-hidden — the count
│  │ │ ( ) Both                           │ │  │  already sits in each
│  │ │     A business and a job or        │ │  │  radio's accessible name,
│  │ │     career plans   +11 questions   │ │  │  so it is announced once
│  │ └────────────────────────────────────┘ │  │
│  └────────────────────────────────────────┘  │
│        ══ branch section mounts below ══     │
└──────────────────────────────────────────────┘
```

**≥768px, differences only:** the three options become a 3-up card row with equalised heights so the counts align — the comparison the member is actually making is "how much work is each?". The `Dialog` centres at `max-w-lg`, buttons side by side, cancel left and holding initial focus.

**FR-002 discard rule.** The abandoned set is `branchFields(old) \ branchFields(new)`. Business→Both and Career→Both abandon nothing (superset) and show **no dialog**. The four other transitions show the dialog **only if at least one abandoned field has a value** — a non-empty trimmed string, a selected radio, or ≥1 checked box. Directory fields are never in the abandoned set: once copied per D4 they belong to a section the member can see, and silently emptying visible fields is the exact surprise the dialog exists to prevent.

> **Change your group to Career Mums?**
> You've answered 3 of the 7 business questions. Changing your group will clear those answers. Nothing is saved and nothing is sent to GPC.
> *[only when the directory section holds values]* Your directory listing details will stay as they are.
> `[ Keep Business Mums ]`  `[ Clear and change ]`

The count is **real and computed** — a member who answered one question and one who answered six deserve different amounts of warning; singular reads *"You've answered 1 of the 7 business questions."* On **Clear and change**: abandoned fields are **deleted from the state object**, not blanked, so they cannot serialise as empty strings into the payload (FR-002 requires them *absent*); their errors drop and the summary recomputes; sections renumber and `«N»`/`«T»` recompute; focus returns to the radio the member acted on, not into the new section, which would hide the consequence of their own choice; the polite region announces once: *"Business questions removed. Career questions added, 4 questions. This form now has «N» questions, about «M» minutes."* On **cancel** the radio reverts and the live region says nothing — a cancelled action should be silent. **No undo is offered**; the dialog *is* the undo, which is why cancel holds initial focus.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | No group chosen | Three unselected radios; no branch section below | `<fieldset>`+`<legend>`; nothing announced |
| Loading | N/A — options arrive with the already-fetched form config | — | — |
| Empty | Identical to Default. An unanswered question is not an empty state and gets no empty-state treatment | — | — |
| Error | Submit with no group chosen | *"Choose the group you'd like to join — this decides which questions we ask you next."* Summary links here | `aria-describedby="group-hint group-error"` on the fieldset, `aria-invalid` on the first radio; describedby text, not its own alert (D7) |
| Success | Group chosen, branch mounted | `Done` `Badge`; count becomes `Done` | Tick `aria-hidden`; heading reads *"2 of «T», Your group, completed"* |
| Disabled | While the `Dialog` is open the page behind it is inert | Radios visually unchanged — the scrim already signals modality | Page container `inert` (`aria-hidden` fallback), never `disabled` on individual controls |

**Accessibility (non-obvious only).** The radio group is one tab stop and arrows **move and select** (native behaviour), so arrowing from Business to Career **can open the discard dialog on a key press**. That is intended: the dialog is the guard and cancel restores the previous value, so no keyboard user can destroy answers without a second explicit action. Do not "fix" it by switching to arrow-moves-without-selecting — that breaks the native radio contract screen-reader users rely on. Dialog contract is `DESIGN.md` §2.9 verbatim (one shared primitive, A14); initial focus is the **safe** action, per WCAG 3.3.4.

---

#### Screen S3 — The question sections: branch, events, community

**Purpose:** ask the branch-specific questions and *only* those, then collect the demand signals FR-014's insights view is built on — without letting the *when* question consume a third of the form. **Entry:** S2. **Exit:** the directory section; or unmount, on a confirmed group change.

**Fields.** *Business (7):* B1 stage (radios), B2 industry (text), B3–B5 business name / website / Instagram (all optional, "Optional" shown as a visible word while required is marked `*` only; a missing URL scheme is normalised on blur, not rejected), B6 "What are you currently looking for?" (18 chips), B7 challenges (optional long text, hinted *"Skip this if you'd rather — it helps us plan workshops, that's all."*, and deliberately **no** character counter: a counter on an optional question implies a target). *Career (4):* C1 current situation (**10** chips — the source has 11 with "Looking for work" duplicated; defect 3 is fixed in the seeded config, not just the component), C2 industry, C3 support that would help, C4 challenge (optional). *Both:* two sibling cards, business then career, `«T»` becomes 8. Nothing is merged — "Which industry are you in?" (the business) and "What industry do you work in?" (the job) are different questions for someone with both, and collapsing them loses the split FR-014 depends on. *Community (2):* both optional — nobody should be forced to volunteer.

**The 21-checkbox problem.** The source asks "which days work best?" as one multi-select of **21 options** (7 days × 3 slots, flattened): ~1,000px of continuous scroll at 320px against a whole-form height of ~2,800px, landing early enough that a member sizing the form up overestimates it threefold. Splitting it into "which days?" + "which times?" was **rejected** — it destroys the cross product, the only thing FR-014 needs (*"the distribution of preferred day/time slots"*, answering *"which day should we run the next networking breakfast?"*); a member choosing {Tue, Sat} × {morning, evening} would be recorded as free for four slots when she meant two. An inner scroll box was also rejected: a scroll trap inside a scrolling page, invisible to `Ctrl+F`.

```
┌──────────────────────────────────────────────┐ 320px
│  ┌────────────────────────────────────────┐  │
│  │ 4 of «T» · Events         3 questions  │  │
│  │ What kinds of events would you love   *│  │  10 chips, ChoiceChipGroup
│  │ to attend?                  3 chosen   │  │  = real checkboxes, chip is
│  │ Which days and times usually work     *│  │  the <label>; ChoiceCount
│  │ best for you?                          │  │  → the SHARED polite region
│  │ Tap any slot that could work — we're   │  │  <legend> + hint
│  │ just looking for a pattern.            │  │
│  │ [ ☐ I'm flexible — any day or time     │  │  ← FIRST tab stop, 48px,
│  │     works                            ] │  │  one tap satisfies it
│  │        Morn    Aft     Eve             │  │  header buttons = column
│  │       [ all ] [ all ] [ all ]          │  │  toggles (aria-pressed)
│  │  Mon ⇢[     ] [     ] [     ]          │  │  day label = row toggle
│  │  Tue ⇢[  ✓  ] [     ] [     ]          │  │  56px label + 3 × 63px
│  │  Wed ⇢[     ] [     ] [     ]          │  │  cells at 44px tall — fits
│  │  Thu ⇢[  ✓  ] [  ✓  ] [     ]          │  │  288px usable with room
│  │  Fri ⇢[     ] [     ] [     ]          │  │  Cells are real checkboxes
│  │  Sat ⇢[     ] [     ] [     ]          │  │  with visually hidden names
│  │  Sun ⇢[     ] [     ] [     ]          │  │  ("Tuesday morning")
│  │ Morn = before 12 · Aft = 12–5 ·        │  │
│  │ Eve = after 5           3 selected     │  │
│  │ How often would you like events?      *│  │  DEFECT 4 FIXED: RADIO, not
│  │ ( ) Weekly ( ) Fortnightly             │  │  checkboxes, so "Weekly +
│  │ (•) Monthly ( ) Quarterly              │  │  Quarterly" is unrepresent-
│  └────────────────────────────────────────┘  │  able, not just discouraged
└──────────────────────────────────────────────┘
```

**Vertical cost ~440px against ~1,000px**, and the question is answerable in **1 tap** (flexible), **2** (two whole days) or **4** (all mornings) — still exactly expressible at 21 taps. Row and column toggles cost **zero** extra targets: the label column and header row existed anyway. The question stays `required` because "I'm flexible" makes the requirement cost one tap, and the error names the escape hatch. **≥768px, differences only:** cells widen to ~96px, headers show full words and the abbreviation legend drops; a `Weekdays / Weekend / Clear all` shortcut row appears — deliberately **not** at 320px, where three more targets would undo the saving that is the whole point; business name / website / Instagram pair into two columns (the one place a two-column form is safe: short, related, low-stakes fields where visual order still matches reading order).

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Sections mounted, nothing answered | As drawn; matrix live, "I'm flexible" unticked | Fieldsets + legends; nothing announced on paint |
| Loading | N/A — branch and option content ship with the form config; no per-section request | — | — |
| Empty | Group not chosen → **the branch card does not exist**; it is unmounted, not empty | Nothing renders between section 2 and Events | Nothing in the DOM, tab order, heading tree or payload — the mechanism enforcing J2's guarantee |
| Error | Submit with a required field unanswered | `Badge` `2 to fix` on the heading; inline messages: *"Pick at least one kind of event."* / *"Pick at least one slot, or tick 'I'm flexible'."* / *"Choose how often you'd like events."* | Chip-group and matrix errors attach to the `<fieldset>` via `aria-describedby` — **never** to the 21 individual cells. One control, one error |
| Success | Every required field answered | Heading gains `Done`. Community shows `Done` from first paint, having no required fields — itself a length signal | Heading reads *"4 of «T», Events, completed"* |
| Disabled | "I'm flexible" ticked → 21 cells + 10 toggles `disabled` and dimmed. Branches are never disabled — a branch is mounted and live, or not mounted | The grid stays **visible** so she can see what she opted out of and untick to get it back (`EventFilters.jsx`'s idiom, correct here because the grid is a dependent control; wrong for a branch, where a disabled Business fieldset would still sit in Carla's heading tree) | Native `disabled` removes them from the tab order; wrapper `aria-describedby` a hidden note: *"Day and time choices are turned off because you said you're flexible."* Prior selections are **retained in state and restored** on unticking, but excluded from the payload while flexible is on |

**Accessibility (non-obvious only).** Sections are `<section>` inside the single `<form>` — deliberately **not** `role="region"` + `aria-labelledby`, which adds rotor stops for information the heading tree already carries. The matrix gets **no heading**: it is one question and its `<legend>` carries the text; promoting it would imply it is a section, the exact perception this design shrinks. It uses plain checkboxes rather than `role="grid"` on purpose — a grid asks the member to hold a two-dimensional coordinate space announced as row and column headers, whereas 21 fully named checkboxes need no spatial model. Tab order is **`I'm flexible` → three column toggles → `Mon` → Mon's three cells → `Tue` → …**, so a keyboard user finishes in one, two or four stops without entering the cells. Focus is never moved into a newly mounted branch — S2's announcement, worded *"Career questions added, 4 questions"*, is what tells a non-sighted member where to navigate with `H`. Each chip group's `<legend>` carries the question **plus its hint**, so it is re-announced on entry rather than relying on memory after 18 checkboxes; the count is debounced 500ms into the shared polite region. Chips must not change width on selection — a wrapping group that reflows on every tap is unusable one-handed (a layout rule, not a motion rule). Header labels and the abbreviation legend at 14px are permitted: the 16px rule governs `input`/`textarea`/`select`, and applying it to every label would push the matrix past 320px.

---

#### Screen S4 — Closed form (FR-009)

**Purpose:** tell a member who arrived at a live URL that intake is paused, in GPC's own voice, and send them somewhere useful instead of nowhere. **Entry:** `open = false` on load, or a `form_closed` response mid-session. **Exit:** `/whats-on`, `/directory`, the newsletter, `/`.

```
┌──────────────────────────────────────────────┐ 320px
│  Join GPC Mums in Business & Work            │  <h1> — the same heading as
│  ┌────────────────────────────────────────┐  │  the open form; the page's
│  │ ⏸ Sign-ups are paused                  │  │  identity does not change
│  │ We've closed the form for a little     │  │  because its state did
│  │ while so we can catch up with everyone │  │  ADMIN-AUTHORED (FR-009),
│  │ who's already joined. We'll open it    │  │  plain text (FR-020) with
│  │ again soon.                            │  │  whitespace-pre-line so
│  └────────────────────────────────────────┘  │  admin line breaks survive
│  In the meantime                             │  <h2>
│  ┌────────────────────────────────────────┐  │
│  │ 📅 See what's on                    →  │  │  48px rows, whole row is
│  │    Events for local families           │  │  the link; the accessible
│  │ 🔎 Browse the directory             →  │  │  name is the full pair, so
│  │    Local businesses run by members     │  │  the rotor's link list reads
│  │ ✉  Get the weekly newsletter        →  │  │  as sentences, not three "→"s
│  │    We'll say when sign-ups reopen      │  │  existing NewsletterBanner
│  └────────────────────────────────────────┘  │  reused inline
│  [           Back to home              ]     │  Button, outline
└──────────────────────────────────────────────┘
```

**There are no form fields anywhere in the DOM** — not hidden, not `disabled`, **absent**. A closed form must not be 25 dead inputs a keyboard or screen-reader user tabs through before discovering there is nothing to do. **If the admin left the message blank:** the `<h2>` stays and the body becomes *"We've closed the form for now. We'll open it again soon — sign up to the newsletter below and we'll let you know."* Never an empty card, never a raw `null`. **≥768px:** the three alternatives become a 3-up grid; the notice caps at `max-w-2xl` and centres.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Config loaded, `open = false` | As drawn | Static content in document order; **not** a live region — the member arrived here, they did not watch it change |
| Loading | Config fetch in flight | The open form's skeletons, **not** this state. The closed state is never the default while the answer is unknown | `aria-busy`; the polite region resolves to *"Form ready…"* or *"Sign-ups are currently paused."* |
| Empty | Admin message blank or whitespace | The fallback copy above | Same as Default |
| Error | Config fetch failed | **Not this screen** — S1's config-error state with a retry. Fail-closed misrepresents a decision GPC never made; fail-open lets a member fill 25 fields and then be rejected. Fail-*explicit* is the only honest option | The page's single alert region |
| Success | N/A — nothing submits here except the reused newsletter form, which owns its own states | — | — |
| Disabled | N/A — the point is that the form is absent rather than dead. *(Mid-session variant: a 409 replaces the page with this screen plus a leading `tabindex="-1"` alert, focused — "Sorry — sign-ups closed while you were filling this in. Nothing was saved." We do not promise recovery we cannot deliver, and we do not leave 25 filled fields on screen implying they might still go somewhere.)* | — | — |

**Accessibility (non-obvious only).** No `<form>` element is rendered at all. The ⏸/📅/🔎/✉ glyphs are `aria-hidden`, meaning carried by adjacent text. The reused `NewsletterBanner` inherits the **global** reduced-motion reset (A20) and the shared `Spinner` (A7), so no per-screen gating is needed — which is precisely why A20 is global rather than scoped to the new routes. Its email input must be verified at ≥16px, since the closed page is where it will get the most use.

---

#### Screen S5 — Confirmation

**Purpose:** confirm the answers are saved, say honestly what happens next (which differs for Bea and Carla), and hand the member somewhere to go. FR-001 requires the form to be **replaced** by this state, not merely followed by a message. **Entry:** a 2xx from `POST /api/join` — and identically for a duplicate (FR-007) and a honeypot discard (FR-006). **Exit:** `/directory`, `/whats-on`, `/`, `/privacy`.

```
┌──────────────────────────────────────────────┐ 320px
│              ( ✓ )                           │  72px disc, aria-hidden
│  You're in, Bea.                             │  <h1> tabindex="-1" — FOCUS
│  Thanks for joining GPC Mums in Business &   │  LANDS HERE
│  Work. We've saved your answers.             │
│  ┌────────────────────────────────────────┐  │
│  │ What happens next                      │  │  a real <ol>, so "list, 4
│  │ 1. Your directory listing is with us   │  │  items" is announced — itself
│  │    for review. A GPC admin checks      │  │  reassurance that the process
│  │    every listing before it goes live.  │  │  is finite
│  │    We usually review new listings      │  │  ← A9. NOT "within 5 working
│  │    within a week.                      │  │  days": that is an internal
│  │ 2. Once approved it'll appear on the   │  │  median target, not a promise
│  │    directory and anyone can find it.   │  │  the organisation made
│  │ 3. If we need to check anything we'll  │  │
│  │    email the address you gave us.      │  │
│  │ 4. You'll start getting the weekly     │  │  ← ONLY if the newsletter box
│  │    newsletter.                         │  │  was ticked; else omitted
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │ 🔒 What stays private                  │  │  restates FR-003's promise
│  │ Your email, postcode, first name and   │  │  AFTER the fact — the moment
│  │ every answer you gave stay inside GPC. │  │  people most want reassurance
│  │ They are never shown on the directory. │  │
│  │ Changed your mind? Ask us to remove    │  │  FR-023 · link to /privacy ·
│  │ your listing or all your data at any   │  │  contact is the real address:
│  │ time — see our privacy page, or email  │  │  gpc.communitynews@gmail.com
│  │ gpc.communitynews@gmail.com.           │  │
│  └────────────────────────────────────────┘  │
│  [       Browse the directory          ]     │  primary
│  [          See what's on              ]     │  outline
└──────────────────────────────────────────────┘
```

**Carla's variant, differences only:** *"You're in, Carla."*; the list loses the listing, review and newsletter items and becomes (1) *"We've added you to the GPC Mums in Business & Work community."* (2) *"We use your answers to plan events people can actually come to — that's the whole reason we asked."* (3) *"Watch out for our next event."* — item 2 pays back the survey questions. Buttons become `See what's on` / `Back to home`. There is no generic "thanks!" fallback: every member sees a list describing *their* submission. **≥768px:** content caps at `max-w-2xl`, the two cards sit side by side, buttons become a row with primary left.

**Rendered from the request payload the client sent, never from the database (A2).** A security property, not a preference: reading back stored records would tell a honeypot-caught bot that no record exists, and tell a duplicate submitter their email was already registered, breaking FR-006 and FR-007's non-disclosure rule. The first name comes from in-memory client state — never a URL parameter, query string or route segment — so it appears in no shareable link, referrer, analytics path or history entry. If a build ever needs to survive a reload here it must re-render the generic *"You're in."* rather than persist the name.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | 2xx received | As drawn, tailored by `{ listingRequested, newsletterConsented, group }` | `<h1 tabindex="-1">` takes focus ~100ms **after** the polite region announces *"Your answers have been sent. Your directory listing is with us for review."* — the live region gives the outcome, focus gives navigable position, in that order |
| Loading | Submit in flight | **This screen does not exist yet.** The form stays on screen; Submit shows the shared `Spinner` and *"Sending…"*. Fields are **not** disabled — if the request fails we want them editable and focusable | Submit `aria-busy`/`aria-disabled`; polite region: *"Sending your answers"* |
| Empty | N/A — the list always has at least the community item | — | — |
| Error | N/A — by the time this renders the write has succeeded (NFR-011). A downstream partial failure (e.g. a notification email) must **not** downgrade this screen; it surfaces to admins | — | — |
| Success | This screen *is* the success state | — | — |
| Disabled | N/A — two links, neither disabled | — | — |

**Accessibility (non-obvious only).** The `<h1>` **replaces** the form's, so there is still exactly one. Focus goes to the heading, not the first button: a member who cannot see the screen needs the outcome before the options, and the heading is where `H`-key navigation resumes. **No confetti, in either motion mode** — a full-screen particle effect on a page that has just handled someone's personal data reads as flippant. **Back-button:** the route is still `/join`, so Back leaves the page rather than returning to a filled-in form; D5 makes a duplicate harmless, but inviting one is still a bad experience.

---

#### Screen S6 — Submission errors

**Purpose:** never lose 25 answers, never blame the member for our failure, always name the next action. **Entry:** a non-2xx or a failed `fetch`. **Exit:** back into the form, or S4. **Universal rule:** the form and every answer in it **stay on screen and stay editable**. Nothing is cleared, nothing is disabled, no field loses its value. Only two things change — an alert appears above Submit, and Submit becomes actionable again.

```
┌──────────────────────────────────────────────┐ 320px
│  │ … Privacy & consent (last section)      │ │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │  ErrorSummary — the page's
│  │ ⚠ There are 3 things to fix before we  │  │  ONE role="alert" region,
│  │   can send this                        │  │  tabindex="-1", ALWAYS
│  │ • Your email address — enter an email  │  │  focused on failure (A1)
│  │   address so we can reply              │  │  <ul> of links in DOM order,
│  │ • Which group would you like to join?  │  │  so the list matches the
│  │   — choose the group you'd like to     │  │  form. Link text = the
│  │   join                                 │  │  field's own label + the fix
│  │ • Which days and times work? — pick at │  │  Singular: "There's 1 thing
│  │   least one slot, or tick "I'm         │  │  to fix…"
│  │   flexible"                            │  │
│  └────────────────────────────────────────┘  │  ↑ ABOVE the submit button —
│  [          Send my answers            ]     │  DESIGN.md §2.10
└──────────────────────────────────────────────┘
```

Placement is the point: on a 320px screen a member who scrolled down to press Submit must see the result without hunting for it. **≥768px:** the banner caps at `max-w-2xl` with the form column and its action button becomes inline-width; summary links go to two columns past six entries. The banner is **never** a floating toast at any breakpoint (A6) — a toast can be missed, cannot be re-read, and is the wrong shape for an error that requires acting on specific fields elsewhere on the page.

| Kind | Trigger | Heading + body | Action |
|---|---|---|---|
| **validation** (client) | ≥1 rendered required field unanswered or invalid | *"There are «n» things to fix before we can send this"* + one link per error | Each link focuses its field |
| **validation** (server, 400) | Server rejected a field (e.g. over-length text, FR-006) | Same component and wording shape; server field keys map to the same client messages, and unmapped keys fall back to *"Something in this answer isn't accepted. Please shorten or simplify it."* | Same |
| **network** | `fetch` rejected, or no response | *"We couldn't reach GPC just now"* / *"Your answers are still here. Check your connection and try again — nothing has been lost."* | `Try again` re-posts with the **same idempotency key** (D5), so a retry after a response we never saw cannot create a second record |
| **rate_limited** (429) | FR-006 threshold exceeded | *"Just a moment"* / *"You've sent this a few times in a row. Please wait a moment and try again. Your answers are still here."* **Never** *"you look like a bot"* — a real member on shared café or nursery wi-fi will hit this and must not be accused | `Try again in 47s`, counting down; announced at 60s / 30s / 10s / ready only, **never per second** |
| **server** (5xx, or a non-JSON body) | Any other non-2xx, or `res.json()` threw | *"Something went wrong at our end"* / *"That's our fault, not yours. Your answers are still here — please try again in a moment. If it keeps happening, email gpc.communitynews@gmail.com."* | `Try again` |
| **form_closed** (409) | Admin closed the form mid-session | Page **replaced** by S4 with its leading alert | `Back to home` |

**Duplicate submission has no error state here, and must never gain one.** FR-007 requires the response never reveal whether the email was already registered; a duplicate renders S5 identically to a first submission. A *"you've already joined"* message would be an email-enumeration oracle on an unauthenticated public endpoint, leaking membership of a group whose members may not want that known.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | No error | The summary is **not rendered at all** — not rendered-empty. A permanently-present alert container has a habit of announcing stale content on re-render | — |
| Loading | Submit in flight | Any previous summary is removed at the *start* of the request, so a stale error never sits next to a live spinner | Polite region: *"Sending your answers"* |
| Empty | N/A — an error state with no errors is the Default state | — | — |
| Error | Any row above | As above | `role="alert"`; focus moves to the summary on the next animation frame, **always**, whatever the count |
| Success | N/A — success replaces the whole form (S5) | — | — |
| Disabled | Rate-limited only; no field is ever disabled by an error | Submit shows the countdown | `aria-disabled="true"` rather than the `disabled` attribute, so the button stays focusable and a screen-reader user can read the countdown off it |

**Accessibility (non-obvious only).** Exactly **one** assertive announcement fires per failed submit. Per-field messages are `aria-describedby` text with `aria-invalid="true"` and are **not** alert regions (D7) — the summary does all the announcing, which also removes the need for the draft's fiddly "role=alert only when they appear individually" rule. Focus is **never** moved to the retry button: that would let a member re-submit by reflex before reading why the last attempt failed. From the summary's last link, Tab continues into the form, so the summary is never a trap. Errors clear on `blur`, not on `change`, so a message never vanishes mid-typing. **No shake, in either motion mode** — it communicates nothing a red border and a sentence do not.

---

### NFR-009, second clause — the `/join` weight budget

**`/join`'s initial render adds no more than 50KB gzipped over the existing site shell.** This section owns that clause, and the component count is what puts it at risk: `/join` specifies roughly a dozen net-new components (`LengthSignal`, `FormSection`, `TextField`, `PostcodeField`, `RadioGroup`, `ChoiceChipGroup`, `LongTextField`, `DayTimeMatrix` plus four internals, `ErrorSummary`, `SuccessPanel`, `ClosedNotice`). Consequences, all binding:

- **No form library, no validation library, no state-machine library, no data-fetching library.** `react-hook-form` (~25KB) plus a schema validator (~13KB) would spend three-quarters of the budget before a single field renders. `/join` uses the flat state object and hand-rolled submit already established by `NewsletterBanner.jsx` and `LondonEventForm.jsx` (NFR-012).
- **The dozen components are markup, not machinery.** `DayTimeMatrix` is 21 native checkboxes and 10 toggle buttons; the reason it is plain checkboxes rather than an ARIA grid is accessibility first and payload second, but both point the same way.
- **`/join` is a lazily-loaded route**, so its weight never lands on visitors who never join, and the 50KB is measured on the built chunk, not estimated from source. Icons are imported individually (tree-shaken), never from a barrel.
- **Shared primitives come out of the shell, not this budget** — `Button`, `Card`, `Badge`, the one shared `Spinner` (A7) and the one `Dialog` (A14) are shared across the whole feature; extracting `Spinner` once is cheaper than five copies of `animate-spin`.
- **Form config is fetched, not bundled**: labels, options and the open flag arrive as JSON, outside the JS budget and capped separately at 20KB gzipped. It is on the critical path, so it is requested with the page shell and covered by skeletons (A7) — never lazily after paint, which would briefly make the closed state indistinguishable from a loading one.
- **Motion adds nothing**: framer-motion is already in the shell, and the `prefers-reduced-motion` reset is global CSS (A20), not per-component JavaScript.

## Notes for architecture

- The payload needs a **form-start elapsed-seconds integer** (non-personal) for NFR-007's post-launch median. No FR names it; it must exist in the data model and be disclosed if retained.
- The **idempotency key**'s server-side lifetime and collision behaviour are undefined here — D5 specifies only the client half.
- The **rate-limit window and threshold** are undecided; *"Try again in 47s"* needs a real number, and a window measured in minutes changes both the copy and the control.
- **`sessionStorage` draft-saving** for tab discard is the obvious mitigation and is deliberately unspecified: whether a same-tab draft of pre-consent answers counts as processing is a controller call, not a UX one.
- **Roving tabindex for the day/time matrix is deferred.** Plain Tab is fully conformant, has no custom-widget bug surface, and the row/column toggles mean no keyboard user is forced through 21 stops. An ARIA grid is the upgrade path if testing says otherwise.
- **The seeded config carries three defect fixes**, not component code: the de-duplicated C1 list (10 options), the "Weekly newsletter" typo, and `required = false` on B7 / C4 / "What do you hope to gain".
- **A "No preference" option for event frequency** is recommended but not added: making the control single-select (defect 4) means a member with genuinely no preference must now pick one. Within FR-008's admin powers, but PM sign-off rather than a UX decision — as is whether a last name is collected, which would add a field to S1 and change every computed `«N»`.
- **Whether the admin-authored intro and closed message may contain a link** is undecided; both currently render as plain text with preserved line breaks (FR-020's principle applied to admin-authored config). Allowing links is a config-shape change, not a copy change.
- **D4 is an inference, not a stated requirement** — FR-002 and FR-003 both claim the same three fields and the PRD never resolves the overlap. Asking twice is indefensible, and moving the fields would contradict FR-002's explicit seven.


---

## 2. The directory opt-in and consent

**Covers:** FR-003, FR-004, NFR-004, NFR-006 — with FR-015 (expectation-setting), FR-020 (plain text), FR-008 (editability boundary). Screens are prefixed `D-`; blocks marked `[shell]` belong to the `/join` form-shell section. Tokens, input/checkbox/card/pill/banner specs and the WCAG contract are fixed in **DESIGN.md** and referenced here, never restated.

> The three consent texts below are **deliverables**, stored verbatim and versioned (NFR-004). Changing one costs a version bump and a second cohort of records citing different text. They are the one thing in this section that must not be paraphrased.

### Journey J2 — "Do I want to be findable, and what does that cost me?"

**Goal:** a member reaches an informed, unhurried decision about being listed publicly, gives or withholds three separate permissions, and leaves knowing exactly which of her details are now on the internet and which are not.

**Persona:** Bea, Business Mum — phone, evening, tired, works from her kitchen table, genuinely frightened of her home address or personal email appearing on a public page. Secondary: Carla, Career Mum, who must pass through this whole journey in two taps and answer zero business questions (NFR-007).

**Time:** ~15s declining (one radio, two consent boxes); ~2m10s opting in (20s reading the disclosure, ~90s on six fields, ~20s on three consents). Both fit inside the NFR-007 five-minute budget with the rest of the form.

**Entry points:** sequential scroll through `/join` after "Community & Involvement" (the normal path) · deep link `/join#directory` · return from a failed submit, focused into this section · `/join` re-entry after a rejected listing (FR-015), with no special case.

**Success criteria:** a member who opted in can state unprompted that her email and postcode are not published · a Career Mum who declines is never shown a business field and is never blocked by one · every stored submission carries 2 or 3 consent records with verbatim text, version, UTC timestamp and capture method, and none is stored with a required consent missing · zero fields collected here that are not either published (FR-003 list) or required to evidence a consent (NFR-006) · directory opt-in among Business Mums ≥60% (PRD metric).

**Happy path**

```
  [shell] /join, scrolled to the Directory section
        v
  D-1  Directory opt-in - payoff copy + at-a-glance disclosure + Yes/No radio
        |
   +----+---------------------------------------------+
   | "No, not right now"      "Yes - list my business"
   |                                                  v
   |                          D-2  Your listing details
   |                            public/private panel, above field 1
   |                            name . category . description (300)
   |                            website . instagram . enquiry email
   |                            + "what happens next"
   +----+---------------------------------------------+
        v
  D-3  Privacy & consent   A hold_data REQUIRED . B publish_listing REQUIRED
                           WHEN SHOWN . C newsletter OPTIONAL
                           none pre-ticked; each links to /privacy
        v
  [shell] Submit -> server -> D-4  Submitted: what happens next
```

**Decision points**

| Trigger | Display | Recovery |
|---|---|---|
| Selects "Yes - list my business" | D-2 mounts in DOM order after the radio fieldset. Shared polite region: *"Directory details opened. Six more questions below."* | Selecting "No" removes it. |
| Selects "No, not right now" | D-2 unmounts; Consent B disappears from D-3. Shared polite region: *"Directory details closed. Your business details won't be submitted."* Values stay in component memory only. | Re-selecting "Yes" restores everything she typed, unchanged. |
| Flips Yes → No **after typing** | As above, plus a quiet inline note under the radio group: *"We've set your business details aside. They won't be submitted. Choose 'Yes' again to bring them back."* **No modal, no confirm dialog** — preserving is cheaper than re-typing six fields. | Re-select "Yes". |
| Types her sign-up email into the public contact field | Inline warning below the field plus a confirmation checkbox; submit blocked until she changes it or ticks. | Change the address (warning goes, tick resets to unticked) **or** tick *"I understand this address will be public. Use it anyway."* |
| Description passes 300 characters | Counter flips to *"N characters over the limit"*; textarea takes the §2.4 error border. **Nothing is truncated and typing is not blocked.** | Delete characters until the count is positive. |
| Description reaches ≤30 remaining | Counter switches to `--color-warning`. No error, no block. | None — informational. |
| Submit, opt-in = Yes, listing fields empty | Per-field errors; summary per §2.10. Below the last field error, an escape hatch: *"Not ready to write a listing? Change my answer to 'No, not right now'."* | Fill the fields, **or** take the escape hatch — it flips the radio to No, unmounts D-2 and Consent B, clears the errors, and lets the form submit. |
| Submit with Consent A unticked | Error on Consent A. There is no path to submit without it and the copy says so. | Tick it. |
| Submit, opt-in = Yes, Consent B unticked | Error on Consent B with two named routes out. | Tick it **or** follow the inline link *"change your directory answer"*, which scrolls to and focuses the D-1 radio group. |
| Category taxonomy in flight, then zero rows (FR-017) | In flight: `<select>` disabled, `aria-busy`, *"Loading categories…"*. Zero rows (or a failed fetch): disabled, *"No categories available right now"*; helper becomes *"We'll choose a category for you when we review your listing."*; required rule suspended. | Member submits normally; the listing enters the queue flagged `category_missing` so a moderator must set one before publishing. |
| Website / Instagram without a scheme | No error. Normalised server-side (`greenwichparentsandcarers.co.uk` → `https://…`; `@handle` → `https://instagram.com/handle`). | N/A — deliberately forgiving. |
| Form closed by an admin mid-session (FR-009) | `[shell]`-owned closed state; this section contributes one line: *"Nothing you typed has been saved or sent."* | Owned by `[shell]`. |
| Reaches D-3 having declined | Only Consents A and C render. Consent B is **absent from the DOM** — not disabled, not greyed. | N/A. |

**Drop-off notes**

- **The disclosure is both the risk and the cure.** Hedging ("we may publish some details") loses Bea; a blunt two-column list that names the postcode outright keeps her. Vagueness here reads as evasion.
- **The description is the longest dwell on `/join`**, near the four-minute mark. Mitigated by a helper that says how long it should be and a counter framed as permission ("300 characters left"), not quota ("0/300"). No minimum length — a thin description is a moderation problem (FR-016), not a reason to block a member at 9pm.
- **Blocking on the same-email warning is a calculated risk:** one extra tap for the member with one address, against a personal inbox on an indexed page, which is unrecoverable in a way an abandonment is not. The confirm copy is written to be tickable without shame — "use it anyway", not "are you sure?".
- **Three boxes can read as bureaucracy.** Countered by putting them last, keeping them short, marking the optional one visibly optional, and giving each required one a one-line "why". A Career Mum sees two boxes, not three.
- **Consent B is where an opted-in member may reverse** — "search engines can index them" is the first concrete moment. That reversal is a success, but only if it is cheap: hence the inline link and the preserve-don't-destroy rule.
- **"Why hasn't my listing appeared?" is a post-submission loss of trust.** The review expectation appears twice: in D-2 before she submits, so the wait is part of the deal she agreed to, and in D-4 after.

#### Screen D-1 — Directory opt-in

**Purpose:** present the payoff and the cost in one eyeful, then take a single unambiguous yes/no — answerable "No" by a Career Mum without her reading anything else.

```
|<------------------ 320px ------------------>|
|  == The GPC business directory ======= (h2) |
|  The directory is a public page on this     |
|  site where local parents can find           |
|  businesses run by GPC members. It's free,   |
|  and you can ask us to take your listing     |
|  down at any time.                           |
|  +-------------------------------------+    |
|  |  AT A GLANCE                        |    | Card, DESIGN.md 2.6
|  |  Six things go public. Your email,  |    |
|  |  postcode and survey answers        |    |
|  |  never do.                          |    |
|  +-------------------------------------+    |
|  <fieldset><legend> Would you like to be    |
|   included in the GPC business directory?   |
|  For any member who runs a business or      |
|  works for themselves - freelancers and     |
|  sole traders included. You don't need to   |
|  have chosen "Business Mums" above.         |
|  +-------------------------------------+    |
|  | (o)  Yes - list my business        |    | card-style radio,
|  +-------------------------------------+    | DESIGN.md 2.5
|  | ( )  No, not right now              |    |
|  +-------------------------------------+    |
|  </fieldset>                                |
|  ... if "Yes": D-2 renders here, in DOM ... |
|  ... order, no modal ...................... |
```

*Differences only:* ≥768px the two radio cards sit side by side and the intro paragraph and "At a glance" card sit 60/40, so the whole decision is above the fold; ≥1024px content caps at `max-w-2xl`. Copy is identical at every breakpoint.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Section renders | Neither radio selected; no error; no D-2 panel | `<fieldset>`/`<legend>` carries the question; `aria-describedby` → help-text id |
| Loading | N/A — static config already fetched with the form; if the whole config is loading, `[shell]` owns the skeleton and this section is not mounted | — | — |
| Empty | N/A — a fixed binary defined in code, not in the taxonomy or form config | — | — |
| Error | Submit with neither radio selected | *"Please choose yes or no — we need to know whether to list you."* below the group | Error `<p id>` appended to the fieldset's `aria-describedby`; linked from the §2.10 summary |
| Success | N/A at screen level — success is the whole-form outcome on D-4 | — | — |
| Disabled | Form closed by an admin (FR-009) | Whole section unmounts with the form; individual radios are never disabled | — |

**Accessibility (non-obvious only)**

- **No focus moves when "Yes" is selected.** The panel is inserted immediately after the fieldset in DOM order, so the next Tab lands on the first new field. Moving focus would rip a screen-reader user out of the radio group before she has heard her choice register. The reveal is announced once through the page's single polite region (A13).
- The radios carry **neither `aria-expanded`** (invalid on a radio) **nor `aria-controls`** (poorly supported, and unnecessary with DOM-adjacent insertion).
- **Deliberate divergence from `EventFilters.jsx`**, which dims dependent controls: declining **removes** the panel. Dimming six business fields in front of Carla presents them as work she is failing to do and breaks NFR-007. Hiding is right for a branch, dimming for a filter.
- **Editability boundary:** the intro paragraph and question label are admin-editable (FR-008); the "At a glance" card is **not** — it is a factual statement about system behaviour, and an admin editing it could make the site's disclosure untrue without anyone noticing.

#### Screen D-2 — Your listing details

**Purpose:** collect exactly the six publishable fields and make the public/private boundary impossible to misread while she is typing into it. This is where NFR-006 is honoured or quietly broken.

```
|<------------------ 320px ------------------>|
|  --- Your listing details ----------- (h3)  |
|  +=====================================+    |
|  | What other people will see     (h4) |    | Panel per DESIGN.md
|  | (globe) PUBLIC - anyone can see(h5) |    | 2.8: stacked at 320,
|  |   Business name . Category . Short  |    | side-by-side >=768px,
|  |   description . Website . Instagram |    | --color-info; items
|  |   . Public contact email            |    | echo her typed values
|  | (lock) PRIVATE - never shown   (h5) |    | live as she fills the
|  |   Your first name . Sign-up email . |    | fields.
|  |   Postcode . Your answers about     |    |
|  |   your business or career . Event   |    |
|  |   preferences . Anything typed in a |    |
|  |   comment box                       |    |
|  |  We never publish your location.    |    |
|  |  Not your postcode, not your area,  |    |
|  |  not a map.                         |    |
|  +=====================================+    |
|  Business name *                            | every field: label,
|  helper text (see table)                    | then helper ABOVE
|  [                                     ]    | the input (2.4)
|  Category *      [ Choose a category   v ]  | native <select>
|  Short description *   [ textarea      ]    |
|                        300 characters left  |
|  Website (optional) . Instagram (optional)  |
|  Email for enquiries *  [Shown publicly]    | Badge inside <label>
|  [                                     ]    |
|  +-------------------------------------+    |
|  |! That's the email you signed up with|    | warning banner 2.10;
|  |  [ ] I understand this address will |    | body copy below
|  |      be public. Use it anyway.      |    |
|  +-------------------------------------+    |
|  +-------------------------------------+    |
|  |  WHAT HAPPENS AFTER YOU SUBMIT      |    |
|  |  1. We check your listing - we      |    |
|  |     usually review new listings     |    |
|  |     within a week.                  |    |
|  |  2. If it's fine, we publish it and |    |
|  |     email you the link.             |    |
|  |  3. If something needs changing,    |    |
|  |     we'll email and explain.        |    |
|  |  Your listing won't appear straight |    |
|  |  away. That's normal, not a fault.  |    |
|  +-------------------------------------+    |
```

*Differences only:* ≥768px Website and Instagram sit side by side — every other field stays full width, including the description and the enquiry email, which must never be visually diminished; ≥1024px the "What happens after you submit" box moves to a right-hand rail, never sticky. Copy is identical at every breakpoint and no disclosure text is ever truncated responsively.

**The panel's content is this section's; its presentation is DESIGN.md §2.8's.** Two `<ul>`s under real `<h5>`s — **not a table**: the rows do not pair, and a `<table>` invites a screen reader to read "Business name" and "Your first name" as related. Glyphs are `aria-hidden`; the headings carry the meaning. The panel sits **above the first field and stays there** — FR-003 says "adjacent to the fields", and a disclosure that requires a tap has not been made.

| Field | Req | Helper text, verbatim, above the input | Limit (FR-006) | Type |
|---|---|---|---|---|
| Business name | ✔ | "Your business, practice or trading name — whatever you'd like shown at the top of your listing." | 80 | `text`, `autocomplete="organization"` |
| Category | ✔ (suspended if taxonomy empty) | "Pick the one that fits best. Local parents use these to filter the directory." | must match a live category id | native `<select>`, **generated from the directory taxonomy** (A3) |
| Short description | ✔ | "One or two sentences about what you do and who you help. This is the main thing people read. Plain text only — links and formatting won't show." | **300**, rejected not truncated | `textarea`, no `maxlength` |
| Website | — | "You can leave off the https:// — we'll add it." | 200 | `url`, `inputmode="url"`, `autocomplete="url"` |
| Instagram | — | "Your handle or the full link — either works." | 100 | `text`, `inputmode="url"` |
| Email for enquiries | ✔ | "This is the address your listing will show, so anyone can see it. Use a business address, or a free address you're happy to make public — not the personal one you signed up with." / "Don't have one? A free address like yourbusiness@gmail.com works well." | 254 | `email`, `inputmode="email"`, **`autocomplete="off"`** |

`autocomplete="off"` on the enquiry email is deliberate: autofill will otherwise offer exactly the personal address this field exists to avoid. The warning banner's body copy is: *"If you use it here, it will be shown on your public listing where anyone — including people sending spam — can see it. Most members use a separate address for enquiries."*

| Condition | Error message |
|---|---|
| Business name empty | "Please add the name you'd like shown on your listing." |

**This is a business directory, so an employed member with no business simply is not in it.**
That is not an exclusion to apologise for — it is what the product is. A general member directory
covering everyone is a separate, later product that will sit behind a member login (PRD, Out of
Scope), and because it lists people rather than businesses it carries a different privacy shape
entirely. Nothing in this release should hint at it or promise it. The practical consequence here
is that the "who employs you" ambiguity never arises: a salaried member is not listing, so no
listing ever needs to name an employer.
| Category not chosen | "Please choose a category so people can find you." |
| Description empty | "Please add a short description — it's the main thing people read." |
| Description over limit | "Your description is {N} characters too long. Please shorten it to 300 characters or fewer." |
| Website unparseable | "That doesn't look like a web address. Try something like greenwichparentsandcarers.co.uk" |
| Instagram unparseable | "That doesn't look like an Instagram handle or link. Try @yourbusiness" |
| Enquiry email empty | "Please add an email address for enquiries — it's how people will reach you." |
| Enquiry email malformed | "That doesn't look like an email address. Check for a typo." |
| Enquiry email = sign-up email, unconfirmed | "Please either use a different email for enquiries, or tick the box to confirm you're happy for your sign-up address to be public." |

**Counter.** "{N} characters left" from 300 down to 1, then "0 characters left", then "{N} characters over the limit". Tone rides §2.4's threshold: neutral to 31 left, `--color-warning` from 30, `--color-error` past the limit. Per **A13** the counter does **not** own a live region — it writes into the page's single shared polite region, throttled to at most one announcement every 1.5s, and stays silent until fewer than 30 characters remain. An un-throttled counter on a 300-character field is a screen-reader denial of service.

**The public enquiry contact field** does not exist on the source form and is the whole reason the directory is safe for Bea. Its second helper sentence names a free alternative because the PRD names "members use their personal email anyway" as a live risk, and an alternative converts better than a warning.

- The `Shown publicly` badge sits **inside the `<label>`**, so the accessible name is "Email for enquiries, shown publicly, edit text, required". Public-ness is part of the name, not a visual afterthought.
- **Match detection:** trimmed, lower-cased comparison against the sign-up address, also matching after normalising `+tag` suffixes and — for `gmail.com`/`googlemail.com` only — after removing dots from the local part. Anything more elaborate is over-fitting. Runs on blur and on a 400ms debounce.
- **The warning is advisory, not corrective:** it never rewrites or clears the field. It sits inside the field's `aria-describedby` and is announced once through the shared polite region. Editing to a non-matching value removes it **and resets the checkbox to unticked**, so an old confirmation can never silently authorise a new address.
- The acknowledgement is recorded as `enquiry_contact_matches_signup: true` so a moderator can query it before publishing. It is **not** a consent record — conflating a UI acknowledgement with consent evidence pollutes the evidence.
- **Q3/Q4 (ADJUDICATIONS §C):** base case is email, shown in the clear. If Q3 becomes member's choice, a radio group is inserted above the field and label/type/validation/warning switch with it, with a phone-specific warning; recommendation is **email only for v1**. If Q4 resolves to a relay, the field is unchanged but "Email for enquiries" moves to the **private** column and Consent B must reissue as `publish_listing@2.0.0` — a versioning event, and the strongest argument for settling Q4 before the first live submission.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Opt-in = Yes, nothing typed | Panel, six empty fields, counter at "300 characters left", "What happens next" box | `id`↔`htmlFor` on every field; `aria-describedby` lists helper id (plus counter id on the textarea); `aria-required="true"` on the four required fields |
| Loading | Category taxonomy in flight | Only the `<select>` is affected — disabled, option "Loading categories…"; every other field usable | `aria-busy="true"`; resolution is **silent** — announcing "Categories loaded" would be noise |
| Empty | Taxonomy resolves with zero rows | `<select>` disabled, option "No categories available right now"; helper replaced; `*` removed; submission proceeds | `aria-disabled` + updated `aria-describedby`; category excluded from client validation, server flags `category_missing` |
| Error | Submit with missing/invalid fields | Per-field border and message per §2.4; summary above the submit button per §2.10; escape-hatch `Button` below the last field error | `aria-invalid="true"`; error `<p id>` appended to that field's `aria-describedby`; **focus always moves to the summary** (A1), each summary row a link to its field |
| Success | N/A at screen level — no per-section save; success is the whole-form outcome on D-4 | — | — |
| Disabled | Whole-form submission in flight | Inputs disabled, section dimmed | `[shell]` sets `aria-busy` on the `<form>` |

**Accessibility (non-obvious only)**

- Heading ladder `<h3>` → `<h4>` → `<h5>`×2, no level skipped. The `<h5>`s are visually small but are real headings, because they are the semantic carrier of the entire disclosure. Verify in the manual NFR-008 pass that the "Public" `<h5>` is announced before its first list item; if a tested reader skips it, add a visually-hidden prefix per `<li>` rather than restructuring.
- Required fields use `aria-required="true"` and a visible `*` but **not** native `required` — browser bubbles pre-empt our error handling and are neither stylable nor reliably announced.
- Category is a **native `<select>`** so iOS uses the platform picker; a custom listbox would be a needless keyboard and VoiceOver risk on the one page that must not have any.
- **Data minimisation (NFR-006):** six fields and nothing else, every one in the FR-003 public list. Nothing is collected here "for admin use". A future field that is not published belongs in the private member record — the panel's contract with the member is that *everything in it is public*.

#### Screen D-3 — Privacy & consent

**Purpose:** take two or three separate, un-pre-ticked permissions in language a parent can read at 9pm without a lawyer, and capture the evidence NFR-004 demands. Replaces the source form's single undifferentiated tick, the live GDPR exposure named in the PRD.

```
|<------------------ 320px ------------------>|
|  == Privacy & consent ================ (h2) |
|  Each of these is a separate choice.        |
|  Nothing is ticked for you.                 |
|  +-------------------------------------+    |
|  | [ ] Yes - Greenwich Parents & Carers|    | CONSENT A. The full
|  |     CIC can keep the information... |    | verbatim text below
|  |     ...I've read the privacy notice.|    | IS the checkbox's
|  |                     ^ link /privacy |    | accessible name.
|  | You can't join without this one -   |    | helper, 14px
|  | it's how we're allowed to hold your |    |
|  | details at all.                     |    |
|  +-------------------------------------+    |
|  ... Consent B renders ONLY if she opted ...|
|  ... into the directory ................... |
|  +-------------------------------------+    |
|  | [ ] Yes - GPC can publish my        |    | CONSENT B
|  |     business name, category...      |    |
|  | We only need this because you asked |    |
|  | to be listed. Change your directory |    |
|  | answer if you'd rather not.         |    |
|  |          ^^^^^^^^^^^^^^ in-page link|    |
|  +-------------------------------------+    |
|  +-------------------------------------+    |
|  | [ ] Yes please - send me the GPC    |    | CONSENT C
|  |     weekly newsletter...            |    |
|  | [Optional] Saying no here changes   |    |
|  | nothing else.                       |    |
|  +-------------------------------------+    |
|  Who holds your data: Greenwich Parents &   |
|  Carers CIC (company 16387545). Read the    |
|  full privacy notice.                       |
|  ---- [shell] error summary + submit ----   |
```

*Differences only:* the consent cards stay full width and stacked at **every** breakpoint — a three-across row invites treating them as one decision, which is the defect being fixed; ≥768px text caps at `max-w-2xl`. Each consent is a `Card` (§2.6) with a checkbox per §2.5, and **the card as a whole is not clickable** — only the checkbox and its label text are, so a thumb scrolling the card cannot accidentally consent.

##### The consent artifact register — THE DELIVERABLE

Stored verbatim with each submission (FR-004, NFR-004). Any change to a `text` value is a version bump, not an edit.

**Consent A — `hold_data@1.0.0`** · Required always. Submission is rejected server-side without it and no partial member record is created.

> Yes — Greenwich Parents & Carers CIC can keep the information I've given here, and use it to run the Mums in Business & Work community, contact me about it, and plan events. GPC won't sell it, and won't share it with anyone outside GPC without telling me first. I can ask to see it, change it or have it deleted at any time, and GPC will do that within 20 working days. GPC will keep it for **«RETENTION_PERIOD — addendum Q8»** unless I ask sooner. I've read the [privacy notice](/privacy).

> ⛔ **UNRESOLVED — blocks first live submission.** `«RETENTION_PERIOD — addendum Q8»` is a literal placeholder and **must not go live**. The published GDPR policy makes the consented period the retention basis, so the text has to name one; every day the form runs with a placeholder produces records citing unevidenceable text. This section does **not** invent a period — it is the controller's decision (ADJUDICATIONS §C, Q8). The sentence is drafted both ways so answering Q8 is a drop-in, not a rewrite:
> - **(a) a fixed period** — "GPC will keep it for **___ years** unless I ask sooner." *Only the number is missing.*
> - **(b) no fixed period** — "GPC will keep it for **as long as I'm part of the community**, and delete it within 20 working days of my asking." *No number needed.*
>
> Either way the string ships as `hold_data@1.0.0`. The placeholder version is never used for a live submission.

*Helper (not stored, freely editable):* "You can't join without this one — it's how we're allowed to hold your details at all."

**Consent B — `publish_listing@1.0.0`** · Required only when the member opted into the directory; absent from the DOM otherwise.

> Yes — GPC can publish my business name, category, description, website, Instagram and public enquiry contact on the public directory page of the GPC website, where anyone can see them and search engines can index them. My name, sign-up email, postcode and survey answers stay private. I can ask GPC to take my listing down at any time and they'll remove it within 20 working days. I've read the [privacy notice](/privacy).

*Helper (not stored):* "We only need this because you asked to be listed. [Change your directory answer](#directory) if you'd rather not."

Every clause is working: it **names the six published fields**, because a consent that does not name what is published is not specific consent; "…and search engines can index them" is the sentence members most underestimate and it stays; the private-fields guarantee sits inside the consent text, not only in the panel, so it is part of the evidenced record; "within 20 working days" matches the published policy exactly.

**Consent C — `newsletter@1.0.0`** · Never required, never pre-ticked; declining has no other effect.

> Yes please — send me the GPC weekly newsletter with local events and news. GPC will use my email address only for the newsletter. I know I can unsubscribe from any email, at any time. I've read the [privacy notice](/privacy).

*Helper (not stored):* "Optional. Saying no here changes nothing else."

This replaces the source form's "Weekly Newletter" typo. If she does not tick it, **no newsletter subscription is created by any path** (FR-004) — and per addendum Q5 the existing Brevo sync's opt-out semantics must not be overridden by this new write path.

**Storage contract** — what the UI hands the server per ticked consent:

| Field | Value |
|---|---|
| `consent_key` | `hold_data` \| `publish_listing` \| `newsletter` |
| `consent_version` | e.g. `publish_listing@1.0.0` |
| `consent_text` | the exact rendered string, **plain text with link URLs expanded inline** — "…I've read the privacy notice (https://greenwichparentsandcarers.co.uk/privacy)." Evidence can then be produced without rendering markup, and the link destination is itself part of the record. |
| `granted_at` | UTC ISO-8601, set **server-side**; the client never authors a timestamp (FR-005) |
| `capture_method` | `web_form:/join` |
| `granted` | `true`. Withdrawals **append** a row with `granted: false`; nothing is ever updated (FR-004) |

**Deliberately not stored:** IP address, user agent, geolocation. Rate limiting (FR-006) may use an IP transiently, but attaching one to a consent record collects personal data no requirement asks for — a direct NFR-006 violation.

**Version bump triggers:** any change to the rendered `consent_text`, including punctuation and including a change to a link destination. **Not** a bump: helper text, badge labels, card styling, or the order the consents appear in.

**Where the strings live:** a versioned code module or read-only reference table — **not** the admin-editable form configuration. FR-008 scopes admin editing to labels, help text, options and required flags; consent strings are not questions, and an admin silently rewording one produces a cohort of records citing `1.0.0` whose text differs from `1.0.0`, destroying the evidence NFR-004 exists to create. The admin panel *displays* the current text and version read-only, with a note saying why.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Section renders | 2 or 3 unticked checkboxes. **None pre-ticked, at any time, for any reason — including on a resubmission by a returning member** | `<fieldset>` + visually-hidden `<legend>` "Your permissions"; `id`↔`htmlFor`; `aria-describedby` → helper id |
| Loading | N/A — consent text is bundled at its pinned version, not fetched. It must be identical to what is stored, so it cannot depend on a network response that might fail open | — | — |
| Empty | N/A — the consent set is code-defined; a missing definition is a build failure, not a runtime state | — | — |
| Error | Submit with A unticked, or B unticked while opted in | Error rule on the card, message below the checkbox | Error `<p id>` appended to `aria-describedby`; linked from the §2.10 summary, which holds focus (A1) |
| Success | N/A at screen level — the evidence of success is the consent record, echoed on D-4 | — | — |
| Disabled | Submission in flight | Checkboxes disabled, cards dimmed | `[shell]` sets `aria-busy` on the `<form>` |

**Consent error strings.** A unticked: *"We can't accept the form without this. It's the permission that lets us hold your details at all."* B unticked while opted in: *"You asked to be listed in the directory, so we need your permission to publish it. Tick this box, or change your directory answer."* — the last five words are an in-page link to the D-1 radio group. C never errors.

**Accessibility (non-obvious only)**

- **Each checkbox's accessible name is its full consent sentence.** That is long, deliberately. Truncating to "I agree to the terms" would mean the sentence a screen-reader user hears is not the sentence stored as her consent — exactly the failure NFR-004 exists to prevent.
- The `/privacy` link sits **inside the label** and is duplicated in the controller footnote below the group as a plain, non-nested route to the same page. A label-wrapped link is a known screen-reader edge case: verify it in the manual NFR-008 pass, and **if a tested reader fails to expose it, move the link to the line immediately below rather than removing it** — FR-004 requires the consent copy to link to `/privacy`.
- The `/privacy` link opens in a **new tab**, `rel="noopener"`, with a visually-hidden "(opens in a new tab)". This is the one place on `/join` where that is correct: there is no saved-progress feature, so a member who navigates away mid-form and comes back loses everything she typed. The new tab *is* the mitigation.
- Consent B's appearance is announced through the page's single polite region: *"One more permission added: publishing your directory listing."* No focus move — it is inserted after Consent A in DOM order and reached naturally.
- **No dark patterns:** no "select all", no pre-fill from a previous session, no consent implied by proceeding, no visual emphasis making the optional one look required. The optional one is last.

#### Screen D-4 — Submitted: what happens next

**Purpose:** close the loop — her listing is real, is not live yet, and that is correct rather than broken (FR-015). The confirmation screen as a whole is owned by `[shell]`; this section specifies only the listing-and-consent blocks nested inside it.

```
|<------------------ 320px ------------------>|
|        (check glyph, --color-success)       |
|  == Thanks - you're in ================ (h1)|
|  We've got your details and you're part of  |
|  the GPC Mums in Business & Work community. |
|  +-------------------------------------+    |
|  |  YOUR DIRECTORY LISTING        (h2) |    |
|  |  [ (clock) Pending ]                |    | status pill, 2.7
|  |  Your listing isn't live yet - and  |    |
|  |  that's normal. A GPC admin reads   |    |
|  |  every listing before it goes on    |    |
|  |  the site.                          |    |
|  |  1. We check it - we usually review |    |
|  |     new listings within a week.     |    |
|  |  2. If it's all fine, we publish it |    |
|  |     and email you the link.         |    |
|  |  3. If something needs changing,    |    |
|  |     we'll email and explain how to  |    |
|  |     fix it.                         |    |
|  |  Nothing about your listing is      |    |
|  |  public until then.                 |    |
|  +-------------------------------------+    |
|  +-------------------------------------+    |
|  |  WHAT YOU AGREED TO            (h2) |    |
|  |  v  We can hold your details        |    |
|  |  v  We can publish your listing     |    |
|  |  x  Weekly newsletter - you said no |    |
|  |  Change your mind at any time -     |    |
|  |  manage your data, read the privacy |    |
|  |  notice, or email                   |    |
|  |  gpc.communitynews@gmail.com.       |    |
|  +-------------------------------------+    |
|  [ Browse the directory ]                   |
|  [ See what's on ]         (outline)        |
```

*Differences only:* ≥768px the two cards sit side by side, equal height, and the buttons form a single row. No copy changes.

**A2 — this screen renders from the request payload the client sent, never from the database result.** "What you agreed to" echoes what she submitted. Rendering from stored records would tell a honeypot-caught bot that no records exist, and tell a duplicate submitter that her email was already registered, breaking FR-006 and FR-007's non-disclosure rule. This is a security property, not a preference.

**A9 — one confirmation, one timeframe.** The member-facing wording is *"We usually review new listings within a week"*, in the D-2 box and here, and nowhere is it phrased differently. The PRD's five-working-day figure is an internal median target and is never shown to a member: publishing it converts a metric into an obligation the organisation never agreed to.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Submission succeeded, member opted in | Both cards; `Pending` status pill from §2.7 — no new variant | Confirmation container is `role="status"` and takes focus (`tabindex="-1"`) on mount |
| Loading | N/A — this screen only renders after the request resolves; the in-flight state is `[shell]`'s submit button | — | — |
| Empty | Submission succeeded, member declined the directory | Listing card absent; "What you agreed to" shows two lines. Not an error and not an empty-state illustration — just a shorter page | — |
| Error | N/A — a failed submit never reaches this screen. `[shell]` keeps the form mounted with every value intact and shows the failure inline. **The form is never cleared on error** | — | — |
| Success | This screen *is* the success state | As Default | Focus + `role="status"` |
| Disabled | N/A — nothing here is disableable | — | — |

**Accessibility (non-obvious only)**

- Focus moves to the confirmation container on mount so a screen-reader user is not left focused on a submit button that no longer exists; the container is `tabindex="-1"` and leaves the tab order after blur.
- "What you agreed to" uses **words** ("you said yes" / "you said no"), not tick and cross glyphs alone; the glyphs are `aria-hidden`.
- No auto-redirect, no timed dismissal, no focus trap — the page stays until she leaves it. Everything echoed back is plain text (FR-020); if a description preview is ever added it must not interpret markup.

### Notes for architecture

- `Button` needs `size="sm"` (the D-2 escape hatch), a disabled style and a busy state; all three are absent today.
- "Shown publicly" and "Optional" are **field labels, not statuses** — they must not enter the §2.7 status ramp or add variants to it. D-4 uses §2.7's existing `Pending` pill rather than a new `awaiting-review` one.
- The `FormField` wrapper (`id`/`htmlFor`/`aria-describedby` composition) is specified here but should be shared across all of `/join`; it is the fix for the site-wide missing-label gap.
- Whether the public/private panel and the consent strings are admin-editable is not stated in FR-008. This section specifies that **neither is**, which constrains the FR-008 admin UI.
- Addendum Q7 (last name): if collected, it joins the **private** column of the panel in the same change. Consent B's "My name … stays private" already covers it, but a stale panel list makes the disclosure incomplete.
- Proposed success metric, not currently in the PRD: ≥80% of opted-in submissions nominate an enquiry contact different from the sign-up email — the only direct measure of whether the privacy design survives contact with real members.
- The 300-character limit (A8) is fixed in three places at once — counter microcopy, client validation, server limit. They change together or not at all.


---

## 3. Moderating the directory

**Covers:** FR-015, FR-016, FR-017, FR-021, FR-022, NFR-013. **Supporting:** NFR-002, NFR-005, NFR-008, NFR-010, NFR-011, FR-020.
**Persona throughout:** **Ash**, GPC volunteer admin. Not technical, moderates in short bursts, often on a phone. She must never open a database and never be made to read a listing twice because the screen lost her place.

| Route | Screen |
|---|---|
| `/admin/directory` | Moderation queue (M-S1) |
| `/admin/directory/:id` | Listing review & edit (M-S2) |
| `/admin/directory/categories` | Categories (M-S4) — the taxonomy's only home (A3) |

### Conventions for this section

- **Status vocabulary.** One set of names, the `Badge` variants ratified in DESIGN.md §2.7: **Pending · Published · Held · Rejected · Unpublished**. A resubmission against a live listing reuses the §2.7 *Pending* pair with the label **Resubmission** (A10). The `SubscribersManager` class-map *idiom* is reused; **its values are not** — its ramp fails AA at pill size (A15). A pill is never the only carrier: every row restates the status in words ("Pending · submitted 6 Aug"), and the `<dl>` legend at the foot of M-S1 gives each in plain English ("Held — parked on purpose. Not public, not rejected.").
- **Waiting too long.** `WAITING_WARN_DAYS = 5`, `WAITING_LATE_DAYS = 10` working days, from the PRD's own median-decision metric. 5–9 days: 4px `--color-warning` left rail plus a chip "⏱ Waiting 6 days", sorted above younger rows. ≥10: `--color-error` rail, "⏱ Waiting 12 days — overdue", pinned to the top and counted in the sidebar badge. The rail duplicates the chip, so colour is never the signal. Default sort is oldest-first for the same reason.
- **The private-data boundary.** These are the only screens where private member data is legitimately visible. Public (FR-003): business name, category, description, website, Instagram, public enquiry contact. Everything else — first name, signup email, postcode, group, survey answers, consent records, moderation notes — renders only inside a container whose first line reads **"Private — never published. This is the admin panel, so you can see it here."** Three testable rules: private values never render inside the public-fields region; no control copies a private value into a public field; no copy or export affordance on these screens emits anything but public fields.
- **Attribution (NFR-013).** Every publish, hold, reject, unpublish, edit and category change records actor and UTC instant and *shows* it — "**Published by Ash Nolan · 18 Aug 2026, 14:07**". Actor from `user_metadata.full_name`, falling back to the account email (in `title`, so two Ashes stay distinct); `<time datetime="…Z">` rendered local. Member-originated entries read "the member, via /join". History is append-only with no edit or delete control anywhere.
- **Keeping her place.** This codebase already shipped and fixed this bug once (`310e86c`). **P1** — `loading` is set only when nothing is on screen yet; the post-decision refetch is `silent`, the list never unmounts, and the row count is read through a ref, not a dependency. **P2** — a decided row *settles in place* at its previous index and height and leaves only on "Clear N decided", tab/filter change or reload; tab counts drop immediately, rows do not. **P3** — `visible` and the Set of expanded disclosures reset only on tab, search or sort change. **P4** — queue state (tab, search, sort, `visible`, expanded ids, scroll) survives a round trip to M-S2; on return the reviewed row is scrolled into view and focused. Back button and "Back to queue" behave identically.
- **Bounded fetch (NFR-010).** `PAGE_SIZE = 25`. The query is ranged, never unbounded: oldest-first, `range(0, n*25 - 1)`; **"Show 25 more"** widens the range and appends. Tab counts come from a separate `count: 'exact', head: true` query, so a badge never costs a page of rows.
- **Reversibility.** Publish ⇄ Unpublish and Hold/Reject ⇄ Move back to pending, permanently. The 10-second **Undo (n)** is therefore a convenience, not a time limit on an essential function (WCAG 2.2.1). The countdown is text, never an animated ring.
- **Shell.** `AdminLayout` becomes responsive here and this section owns it (A21): below 768px the `w-64` sidebar becomes an off-canvas drawer behind a `☰` in a sticky top bar carrying the page title and the pending count, following the DESIGN.md §2.9 dialog contract. `AdminLayout` has no `Layout` wrapper, so it also gains the skip link (`--color-primary-700`, `focus-visible:`) and `aria-current="page"`. Feedback is the inline banner of DESIGN.md §2.10 beside the thing it describes — **no toaster** (A6). Page loads use skeletons, in-flight actions the in-button `Spinner` (A7). One `aria-live="polite"` region and one `role="alert"` region per screen (A13).

---

### Journey M1 — Ash clears the pending queue

**Goal:** every pending listing reaches a recorded decision — published, held, or rejected with a reason — without losing her place and without opening each one.
**Time:** 8–15s per listing decided from the row; 60–90s for one needing an edit. A 12-item queue with two edits: about 5 minutes.
**Entry points:** the FR-022 batch email ("3 new directory listings to review") · the sidebar **Directory** item and its count · the dashboard quick-link card · a bookmark · returning from M-S2 (the highest-frequency entry in practice).
**Success criteria:** every listing has a decision, an actor and a UTC timestamp · the Pending tab reaches zero and *says so in words* rather than going blank · no decision costs more than two clicks and publishing costs one · scroll, disclosures and pagination survived every decision · published listings appear on the public directory on its next load · every rejection carries a reason on the record and, where email works, a courteous member email · a failed email never rolled back a decision.

```
 ENTRY: batch email · sidebar "Directory ⬤3" · dashboard card · bookmark
 ┌──────────────────────────────▼───────────────────────────────┐
 │ M-S1 QUEUE — Pending, oldest first, overdue pinned to top    │
 │ "3 waiting for review · 1 waiting more than 5 working days"  │
 │ Every card carries all she needs to decide: name · category  │
 │ · full description · links · public contact · ▸ private      │
 └───────┬──────────┬──────────────┬───────────────┬────────────┘
         ▼          ▼              ▼               ▼
    ┌─────────┐┌────────┐   ┌──────────┐  ┌─────────────────┐
    │ PUBLISH ││  HOLD  │   │  REJECT  │  │ REVIEW & EDIT → │
    │ 1 click ││2 clicks│   │ 2 clicks │  │ M-S2, undecided │
    └────┬────┘└───┬────┘   └────┬─────┘  └────────┬────────┘
         │         └──────┬──────┘                 │
         │      M-S3: the reason chip IS the       │
         │      confirm button                     │
         └────────────┬────────────────────────────┤
   WRITTEN (server): status · actor + UTC · reason │· member email
   QUEUED AS A SEPARATE OPERATION                  │
   ROW SETTLES IN PLACE (P2): "✓ Published · just now" · attribution
   "Emailing her now…" → "Emailed 14:07" · [ Undo (9) ] [ View ↗ ]
   list never unmounts · focus → Undo · live: "…published. 2 left"
   LAST ITEM SETTLES → empty panel BELOW the settled rows: "Queue
   clear. You decided 3 — 2 published, 1 rejected." [ Clear 3 ]
                    ╔═════════╗ ◀────────────────────┘ P4: back to
                    ║  DONE   ║   the same row, focused
                    ╚═════════╝
```

| Trigger | Display | Recovery |
|---|---|---|
| She can decide from the card (the common case) | **Publish** (primary), **Hold** and **Reject** (equal-weight secondary, so neither is the path of least resistance), **Review & edit →** | Everything reverses; Publish costs one click precisely because it is the cheapest to undo |
| She is unsure | **Hold** → M-S3 reasons ("Waiting to hear back from her", "Want a second opinion", "Needs editing before it goes live", "Something else"). Hold is admin-internal and silent | "Move back to pending", from the Held tab or the settled row |
| Reason isn't in the list | The last chip, **"Something else — write the reason"**, does *not* commit: it reveals a required textarea and a real confirm. Three clicks, deliberately, for the uncommon case | Escape closes without deciding; focus returns to the invoking button |
| Public enquiry contact = her signup email | Inline warning on the contact line: **"⚠ This is the same as her signup email. Publishing it puts her personal address on the public site."** Publish is **not** blocked — it may genuinely be her business address | The warning links straight to Reject → "The public contact is a personal address", producing the matching email |
| Description contains HTML or markdown | Rendered as literal plain text, exactly as it will render publicly (FR-020), under "Shown exactly as it will appear — we never treat this as code." | Edit it in M-S2, or reject as spam |
| Re-submitted while still pending | Chip **"Updated 14 Aug — this replaces their first submission"**; the meta line keeps the *original* date, so a resubmission never resets the waiting clock | Superseded values stay in M-S2's submitted column and in the history |
| Re-submitted against a **published** listing (FR-007) | The live listing is untouched. The row returns to Pending with a **Resubmission** pill and M-S2 shows a submitted-vs-published diff. **There is no separate Updates tab** (A10) | Approve (replaces the public values, stays published — editing is not re-approval, FR-016) or dismiss, recorded with actor and timestamp |
| The listing has an open data-rights request | Badge on the row — **"Data request open — due 12 Sep"** — linking to `/admin/data-requests`. The queue shows it; it does not own it (A5) | Actioned from `/admin/data-requests` |
| A decision is in flight | Only that card's controls go `busy` ("Publishing…"); every other card stays live | — |
| The decision write fails | `role="alert"` **inside the card**: "That didn't save. Nothing has changed for this listing — try again." + **Try again**. The queue is not refetched, so nothing else moves | Try again |
| Decision saved, email failed (NFR-011) | The pill still reads **Published**. A separate chip: "We couldn't email her — your decision was saved." + **Try again** + **Copy the message**. Never rolled back | Retry, or copy and send from her own mail client (§ Notifications) |
| She publishes the wrong one | **Undo (10)**. If the email has already gone: "Undone. Heads up — she was already emailed that it was live, so you may want to drop her a line." | Manual email; publish, email and undo all stay in the history |
| More than 25 in a tab | **"Show 25 more"**, the label carrying the true remainder | Not reset by decisions (P3) |
| Session expired (401) | "You've been signed out. Sign in again to carry on — nothing you decided has been lost." + **Sign in**, returning to `/admin/directory` | Re-auth returns her to the same tab |

**Drop-off risk.** The honest failure mode is not abandonment mid-queue — it is never opening the queue at all. FR-022 is a *Could*, so the likely launch configuration has no push, and the sidebar and dashboard counts are the only ambient signal that work exists; they must arrive with the admin shell, not lazily after the dashboard paints. Second, the *un-decidable* listing: the path of least resistance is to skip and decide "later", so **Hold is a first-class control with the same weight as Reject** — it converts an invisible skip into a tracked, reversible state with a reason attached. Third, rejection is emotionally expensive in a small community and, unsupported, produces published-anyway listings; the mitigations are pre-written reasons, **Preview the email**, and copy that always names a route back in. Fourth, losing her place: P1–P4 is not polish, it is the difference between a five-minute task and one she avoids.

---

### Journey M2 — Ash takes a live listing down

**Goal:** get a published listing off the public site quickly, with a recorded reason, without deleting the member's record.
**Time:** under 90 seconds from opening the admin panel, including finding it.
**Entry points:** a complaint by email or Instagram DM · a member emailing "please take me off" · `/admin/data-requests`, whose "Unpublish the listing" action deep-links here with the dialog primed and the request context shown (A5) · spotting it herself on the public site.
**Success criteria:** gone from the directory on its next load · the old URL shows "no longer listed", not a broken page · member record, answers and consent history all retained · a reason recorded, attributed and timestamped · where it answers a data-rights request, that request is marked actioned with the same actor and timestamp.

```
 TRIGGER: complaint · member email · /admin/data-requests · she spots it
   │ M-S1 → tab "Published (24)" → 🔍 "little acorns" → 1 result
   ▼ click (1) "Take it down"
 ┌──────────────────────────────────────────────────┐
 │ M-S3 Dialog — tone: destructive                  │
 │ "Take this listing off the site?"                │
 │ "It disappears from the directory straight away. │
 │  Her member record, answers and consent history  │
 │  are all kept."                                  │
 │ Pick a reason — the chip IS the confirm · note   │
 │ ☑ Email Hannah about this  [ Preview the email ] │
 └──────────────────┬───────────────────────────────┘
   │ click (2) = a reason chip
   ▼ WRITTEN: Unpublished · reason + note · actor + UTC · member
   │ record untouched · any linked data request marked actioned
   ▼ ROW SETTLES: "Taken down · just now — Hannah asked us to"
   │ [ Undo (9) ] [ Check the public page ↗ ] · 24 → 23
   ▼ PUBLIC: off the index next load · old URL → "no longer listed"
     (the slug is never reused, so the link stays meaningful) → DONE
```

| Trigger | Display | Recovery |
|---|---|---|
| She can't find it by business name | Search matches name, category, description **and** the member's first name and signup email — a complaint usually names the person, not the business. "1 listing matches 'little acorns'." | Clear the search; the Published tab browses in full |
| The right answer is an edit, not a take-down | **Review & edit →**. Saving keeps it live — editing is not a re-approval (FR-016), said in those words on screen | — |
| She also wants the data erased | In the dialog: **"This only removes the listing. If she also wants her data deleted, do that from Data requests."** with a link to `/admin/data-requests` | Erasure is a separate, deliberate workflow (A5) |
| Someone already took it down | Row shows **Unpublished** with the existing attribution line; no **Take it down** control is rendered | Nothing to do; the reason and actor are on screen |
| Two admins act at once | The second write conflicts; the row refreshes silently in place: "Priya took this down a moment ago. Nothing more to do." | None needed — the desired end state is already true |
| The write fails | `role="alert"` in the row: "That didn't save — the listing is still live. Try again." The public site is unchanged, which is the honest reading of the failure | Try again |

**Drop-off risk.** This journey's risk is the inverse of M1's: it is slow only in the *finding*. When a complaint lands and the panel makes her hunt through tabs or open listings one at a time, the fastest thing available is emailing the developer — which is why the Published tab has its own search and a row-level take-down. Speed versus deliberation is resolved by making the second click *be* the reason: one-click take-down would be faster but would leave nobody able to answer "why did this disappear?" three weeks later (NFR-013). The residual risk is the badly-recorded take-down — "Something else" with nothing typed — so that is the one chip that does not commit until she writes something.

---

#### Screen M-S1 — Moderation queue

**Purpose:** show everything needing (or having had) a decision, with enough on each row to decide **without opening it** (FR-015), and surface the pending count wherever Ash might be.

```
┌────────────────────────────────────────────┐
│ ☰  Directory               3      Ash ▾    │ sticky top bar (<768)
├────────────────────────────────────────────┤
│ Directory listings                    [h1] │
│ 3 waiting for review · 1 waiting more than │
│ 5 working days           Categories →      │
│ │Pending 3│Held 1│Published 24│Rejected│…│ │ tablist; the STRIP
│ [ 🔍 Search name, category or member     ] │ scrolls, not the page
│ Sort [ Oldest first                    ▾ ] │
│ [ ⚠ 1 listing has been waiting more than ] │ warning banner,
│ [   5 working days. It's at the top.     ] │ absent at zero
│┃┌───────────────────────────────────────┐  │ ┃ = 4px warning rail
│┃│ [⏱ Pending]        ⏱ Waiting 8 days   │  │
│┃│ Little Acorns Childminding      [h2]  │  │
│┃│ Childcare & nannies · submitted 6 Aug │  │
│┃│ Ofsted-registered childminder in      │  │
│┃│ Blackheath with three spaces from…    │  │
│┃│ [ Show all 240 characters ]           │  │
│┃│ 🌐 littleacorns.co.uk  ◎ @littleac… ↗ │  │
│┃│ ✉  hello@littleacorns.co.uk           │  │
│┃│ ▸ Member details (private)            │  │ 44px disclosure
│┃│ [             Publish             ]   │  │ primary, 44px
│┃│ [    Hold    ]  [    Reject    ]      │  │ equal weight, 44px
│┃│ [      Review & edit  →           ]   │  │
│┃└───────────────────────────────────────┘  │
│  … 2 more cards, no rail …                 │
│ [            Show 25 more              ]   │
│ ── What the labels mean ── <dl>, one line  │
│    per status, from the legend hints       │
└────────────────────────────────────────────┘
```

**Differences only:** ≥768px the drawer becomes a permanent rail and the top bar disappears; card actions move to one right-aligned row ordered **Review & edit · Reject · Hold · Publish**, destructive furthest from the dominant action; the description clamps to 3 lines rather than 5. ≥1024px the card is two columns (content left ~62%; pill, waiting chip, dates, attribution and the private disclosure right), capped at `max-w-5xl`. **No breakpoint introduces a table** — a card list at every width, so the page never scrolls sideways.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| **Default** | Tab has ≥1 row | Header, tabs with counts, filters, warning banner if any, cards oldest-first, "Show 25 more" if truncated, legend | `<h1>`; `role="tablist"/"tab"`/`aria-selected`; panel `role="tabpanel" tabIndex={-1} aria-labelledby`; cards are `<li><article aria-labelledby={nameId}>` in a `<ul>` |
| **Loading** | First load only, nothing on screen | Three skeleton cards in the real card's shape. **A refetch after a decision shows no skeleton and unmounts nothing** — only the acting card is `busy` | `aria-busy="true"` on the tabpanel; "Loading listings…" in the polite region |
| **Empty** | Zero rows, three flavours | (a) never any: "Nothing here yet. When a member asks to be listed, it lands in this tab for you to review." (b) cleared this session: a panel **below** the settled rows — "Queue clear. You decided 3 listings — 2 published, 1 rejected." + **Clear 3 decided** + **See the live directory ↗** (c) filtered out: "No listing matches 'sleep'. [ Clear the search ]" | Polite region announces the case. In (b) focus is **not** moved — it is on the last Undo, and moving it would defeat P2 |
| **Error** | (a) fetch rejects (b) decision write rejects (c) 401 | (a) "We couldn't load the listings. That's usually a connection blip. [ Try again ]" (b) in-card: "That didn't save. Nothing has changed for this listing — try again." (c) "You've been signed out. Sign in again to carry on — nothing you decided has been lost." No stack trace, no status code | `role="alert"`; focus to **Try again** / **Sign in** |
| **Success** | A decision resolves | The card settles in place: outcome line, attribution, notification chip, **Undo (n)**, contextual secondary action. Tab counts update immediately | Polite: "Little Acorns Childminding published. Emailed hello@littleacorns.co.uk. 2 left to review." Focus → **Undo**; when Undo lapses the reverse action replaces it in place and inherits focus |
| **Disabled** | (a) decision in flight (b) "Show 25 more" loading (c) **Publish** where consent to publish is absent | (a) that card's buttons only, label "Publishing…" (b) "Loading…" (c) Publish stays visible with a persistent explanation: "She didn't consent to being published, so this can't go live. Reject it, or ask her to submit again." | (c) is `aria-disabled="true"` + `aria-describedby`, so the control stays focusable and its reason reachable — the site's "dimmed, never hidden" convention |

**Accessibility, specific to this screen:** the tablist uses a roving tabindex (←/→ move, Home/End jump, Tab enters the panel) and each tab's accessible name carries its count ("Pending, 3 listings"). Focus on decision → that row's Undo; on "Show 25 more" → the first new card's `<h2>`; on return from M-S2 → the reviewed row's heading, scrolled into view (P4). The private panel's first child is its label, so expanding it announces "Private — never published" *before* any personal data. A saved decision and a failed email are separate nodes with separate roles, heard as two independent facts (NFR-011). The whole card is **not** a click target — only its named controls are — and the signup-email warning is inline text, never a tooltip.

---

#### Screen M-S2 — Listing review & edit

**Purpose:** tidy a listing's **public** fields (FR-016) while keeping the member's originally submitted values visible and distinguishable, with the private context needed to judge, and decide from the same screen.

```
┌────────────────────────────────────────────┐
│ ← Back to queue (3 pending)                │ 44px, first tab stop
│ Little Acorns Childminding            [h1] │
│ [⏱ Pending] ⏱ Waiting 8 days · Submitted   │
│ by the member, via /join · 6 Aug, 09:12    │
│ [ Nothing here is public until you press ] │ info panel
│ [ Publish.                               ] │
│ ══ What goes on the website ══════════ [h2]│
│ Only these six fields are ever published.  │
│ Business name *                            │
│ [ Little Acorns Childminding             ] │
│ ┌────────────────────────────────────────┐ │
│ │ ✎ You changed this.                    │ │ warning-tint panel
│ │ She wrote: "little acorns childminding"│ │
│ │ Renaming changes the display name only │ │ A16, said on screen
│ │ — the web address stays the same, so   │ │
│ │ links already shared still work.       │ │
│ │ [ Use her version ]                    │ │
│ └────────────────────────────────────────┘ │
│ Category *   [ Childcare & nannies      ▾] │
│ She chose: Childcare & nannies             │ grey "unchanged" line
│ Manage categories →                        │
│ Short description *                        │
│ [ Ofsted-registered childminder in       ] │
│ [ Blackheath with three spaces from…     ] │
│ 212 of 300 characters                      │
│ [ ✎ You changed this.      [ Compare ]   ] │
│ Website [ https://littleacorns.co.uk   ] ↗ │
│ Instagram [ @littleacornsse3           ] ↗ │
│ Public enquiry contact *                   │
│ [ hello@littleacorns.co.uk               ] │
│ ✓ Different from her signup email — good.  │
│ This is the only contact that goes public. │
│ ══ Member details ════════════════════ [h2]│
│ ┌────────────────────────────────────────┐ │ dashed border,
│ │ 🔒 Private — never published.          │ │ distinct tint
│ │ Hannah · hannah.w@gmail.com · SE3 9XY  │ │
│ │ Business Mums · joined 6 Aug 09:12     │ │
│ │ Consent to publish: given 6 Aug 09:12, │ │
│ │  wording v1.0 [ Read what she agreed ] │ │
│ │ Newsletter: yes  ▸ Her answers (11)    │ │
│ │ [ View full member record → ]          │ │ A17 — the other half
│ └────────────────────────────────────────┘ │
│ ══ History ═══════════════════════════ [h2]│ <ol>, NFR-013
│ • Description edited by Ash Nolan ·        │
│   18 Aug 2026, 14:05                       │
├────────────────────────────────────────────┤
│ [          Save and publish             ]  │ sticky bottom bar
│ [ Save only ][   Hold   ][   Reject    ]   │
│ Unsaved changes to 2 fields                │
└────────────────────────────────────────────┘
```

Published-listing variant of the bar: **Save changes** / **Take it down**, under *"Saving keeps it live — editing isn't a re-approval."* A **Resubmission** renders this same screen with the public fields holding the *proposed* values and each original-value panel holding the *currently published* one, so the diff is the normal mechanism rather than a new screen (A10).

**Differences only:** ≥768px is two columns — public fields left (~58%), a sticky right column holding the info panel, Member details and History, with each "She wrote…" original moving into a gutter *aligned to its field* so comparison needs no scrolling. ≥1024px the description gets a true side-by-side compare using `<ins>`/`<del>` (so the highlight is never the only signal) and the `[ Compare ]` toggle is not rendered.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| **Default** | Loaded, pristine or dirty | Fields hydrated with current public values, originals in their *unchanged* presentation. On the first differing keystroke a field's panel flips to *edited* with **Use her version**; the bar reads "Unsaved changes to 2 fields" and the primary becomes **Save and publish** | Every input has `<label htmlFor>` + `id` — **the NFR-008 line in the sand**, since the site associates no label anywhere today. The dirty line is announced once on transition, never per keystroke |
| **Loading** | Fetching the listing | Skeleton of the field stack. Unlike the queue there is no prior content to preserve, so replacing is correct | `aria-busy="true"` on `<main>` |
| **Empty** | **N/A** — this screen always concerns exactly one listing. A blank submitted field renders "She left this blank" in its original-value panel (a field presentation, not a screen state); a bad id is the not-found error | — | — |
| **Error** | (a) 404 (b) validation (c) save failed (d) conflict | (a) "We can't find that listing. It may have been removed. [ Back to the queue ]" (b) inline per field ("This is 340 characters — the limit is 300. Trim 40.") plus a summary **above the action bar** listing each as a link (DESIGN.md §2.10, A1) (c) "That didn't save. Your changes are still on screen — try again." — nothing is cleared (d) "Priya changed this listing while you had it open. [ See what changed ] [ Reload and lose my edits ]", where **See what changed** expands the same field-by-field diff used for a resubmission, attributed ("Description changed by Priya Shah, 14:20") | `role="alert"`; `aria-invalid` + `aria-describedby` on offending fields; focus moves to the summary always |
| **Success** | Save / publish / decision resolves | "Saved." (live listings add "Still live — editing isn't a re-approval."), or "Published. It's on the public directory now. [ View it ↗ ]", or the decision outcome with its recorded reason in words plus **Move back to pending** | Polite region; focus held on the pressed button, or moved to **View it ↗** |
| **Disabled** | (a) request in flight (b) **Save changes** while pristine (c) **Publish** without consent (d) fields during a take-down | (a) `busy`, "Saving…" (b) "Nothing to save yet." (c) "She didn't consent to being published, so this can't go live." (d) inputs `readOnly` with a notice, **not** `disabled`, so values stay selectable and announced | `aria-disabled` (focusable, explanation reachable) for (b)(c); `readOnly` + `aria-readonly` for (d) |

**Accessibility, specific to this screen:** `<h1>` is the business name — it is what the page is about, and it makes browser history and page titles useful. The sticky bar sits inside the `<form>` whose default submit is **Save only**, never **Publish**, so Enter in a text field can never publish. `aria-describedby` chains label → helper → counter → original-value panel, so a screen reader hears "Short description, 212 of 300 characters, you changed this; she wrote…" in that order. **Use her version** returns focus to the field it restored, caret at the end. Escape inside a dialog cancels; Escape outside a dialog does nothing, because it must never discard edits. Leaving dirty opens the Dialog: *"Leave without saving? Your edits to 2 fields will be lost."* — confirm **"Leave without saving"**, cancel **"Stay here"**.

---

#### Screen M-S3 — Decision dialog

**Purpose:** take a decision that needs a recorded reason — Hold, Reject, Take down, category Retire/Delete — in one further click, while showing exactly what the member will be told.

This is **the** `Dialog` primitive of DESIGN.md §2.9, not a second one (A14); `ConfirmModal` is re-implemented over it so its six existing call sites inherit the dialog semantics and the AA-passing destructive fill without changing at the call site. Beyond §2.9's props it takes **`choices`** — the reason chips, where each chip *is* a confirm button and the footer renders **Cancel** only — plus `busy` (disables both buttons and backdrop dismissal, sets `aria-busy`) and a `children` slot for the private note, the "Email the member" checkbox and the preview.

```
   ░┌──────────────────────────────────┐░
   ░│ Don't publish this listing?  [×] │░  h2 = the dialog's name
   ░│ Little Acorns Childminding       │░
   ░│ Nothing goes public. Pick a      │░  aria-describedby target
   ░│ reason — that's the button. We'll│░
   ░│ email her a short, kind note.    │░
   ░│ [ Not enough detail to publish ] │░  each chip = confirm,
   ░│ [ The public contact is a      ] │░  full width, ≥44px
   ░│ [   personal address           ] │░
   ░│ [ This isn't a business listing] │░
   ░│ [ Duplicate of one we have     ] │░
   ░│ [ Not a fit for the directory  ] │░
   ░│ [ Spam                         ] │░  no email; checkbox off
   ░│ [ Something else — write the   ] │░  does NOT commit: reveals
   ░│ [   reason                     ] │░  a required textarea and
   ░│ Private note (optional) [      ] │░  a real confirm button
   ░│ Only admins ever see this.       │░
   ░│ ☑ Email Hannah about this        │░  44px row
   ░│   [ Preview the email ]          │░  expands inline, read-only
   ░│              [    Cancel    ]    │░
   ░└──────────────────────────────────┘░
```

**Differences only:** ≥768px the dialog caps at `max-w-lg` and the chips become a two-column grid; ≥1024px it widens to `max-w-2xl` when the preview is open so chips and message sit side by side. It is never a full-screen sheet — at 320px it is `mx-4` and scrolls internally, so the backdrop stays visible and the modal reads as modal.

**Reason vocabularies** (module-scope maps; each key carries a chip label *and* the sentence used in the member email). **Reject:** `incomplete` "Not enough detail to publish" · `contact_unsafe` "The public contact is a personal address" · `not_a_business` "This isn't a business listing" · `duplicate` "Duplicate of a listing we already have" · `not_appropriate` "Not a fit for the GPC directory" · `spam` (no email) · `other` (her words, verbatim). **Hold:** `awaiting_member` · `second_opinion` · `needs_editing` · `other`; email defaults **off**. **Take down:** `member_request` · `complaint` · `closed` · `details_wrong` · `policy` · `other`; email defaults **on** except `member_request` — she asked, so telling her is noise.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| **Default** | Dialog opens | Heading, subject, consequence, chips, note, email checkbox, preview toggle, Cancel | `role="dialog" aria-modal="true"`, labelled by the heading and described by the consequence; focus to the heading; background inert; focus trapped |
| **Loading** | **N/A** — reason vocabularies are module-scope constants and the preview is composed client-side, so the dialog opens with everything it needs | — | — |
| **Empty** | **N/A** — a dialog with no choices is never rendered; every action opening it has at least four reasons defined in code | — | — |
| **Error** | (a) confirm rejects (b) `other` chosen with an empty textarea | (a) the dialog **stays open**, banner above the footer: "That didn't save. Nothing has changed — try again."; chips re-enable and the typed note is preserved (b) "Write the reason so it's on the record." | `role="alert"`; focus to the pressed chip / the textarea |
| **Success** | Confirm resolves | The dialog closes. The announcement is made by the **parent** screen's live region, never spoken into a closing container | Parent polite region: "Little Acorns Childminding rejected — not enough detail. Hannah has been emailed." Focus → the settled row's Undo |
| **Disabled** | `busy` | Every chip and both buttons disabled; the pressed chip shows the Spinner and reads "Saving…"; backdrop dismissal and Escape off, so an in-flight request is never orphaned | The real `disabled` attribute is correct here — the condition is transient and needs no explanation |

**Accessibility, specific to this screen:** each chip's accessible name is the *whole* action ("Reject: not enough detail to publish"), so a chip heard out of context is still unambiguous. The consequence sentence is the `aria-describedby` target, so opening announces both the question and what will happen. Focus returns on close to the invoking element — or to the settled row's Undo when the invoker no longer exists.

---

#### Screen M-S4 — Categories

**Purpose:** add, rename, reorder and retire the directory taxonomy. **This is the taxonomy's only home** (A3): form configuration generates its category question *from* this list and cannot edit it. Changes take effect **immediately** — a category is data referenced by published listings, not form copy, so there is no draft/publish step here. **Delete** exists only at zero referencing listings (FR-017); otherwise **Retire**.

```
┌────────────────────────────────────────────┐
│ ← Back to listings                         │
│ Categories                            [h1] │
│ 9 on the form · 2 retired · used by 24     │
│ published listings                         │
│ [ This order is the order members see on ] │
│ [ the form and visitors see in the       ] │
│ [ directory filter. Changes are live as  ] │
│ [ soon as you save them.                 ] │
│ [           + Add a category           ]   │ 44px, expands in place
│ ══ On the form ═══════════════════════ [h2]│
│ ┌────────────────────────────────────────┐ │
│ │ 1. Childcare & nannies  · 12 listings  │ │ count links to the
│ │    [ ↑ ][ ↓ ][ Rename ][ Retire ]      │ │ filtered tab; 44px each
│ │    [ Delete                       ]    │ │ aria-disabled
│ │    12 listings use this, so it can't   │ │ always-visible text,
│ │    be deleted. Retire it instead.      │ │ never a tooltip
│ ├────────────────────────────────────────┤ │
│ │ 2. Photography · 0 listings            │ │
│ │    [ ↑ ][ ↓ ][ Rename ][ Retire ]      │ │
│ │    [ Delete                       ]    │ │ ENABLED at zero
│ │    Nothing uses this yet, so it can be │ │ (FR-017)
│ │    deleted outright.                   │ │
│ ├─ in rename mode ───────────────────────┤ │
│ │ 3. Name [ Sleep & feeding support    ] │ │ label htmlFor/id
│ │    [ Cancel ][ Save name ]             │ │
│ │    4 published listings show the new   │ │
│ │    name straight away. They don't need │ │
│ │    approving again, and their web      │ │
│ │    addresses don't change.             │ │
│ └────────────────────────────────────────┘ │
│ ══ Retired ═══════════════════════════ [h2]│
│ Not offered on the form any more. Listings │
│ that already use them stay published and   │
│ stay filterable.                           │
│ [ Doula & birth support     [Retired]    ] │ dimmed AND the word,
│ [ 3 listings · Retired by Ash Nolan ·    ] │ never opacity alone
│ [ 2 Aug 2026  [ Put it back on the form ]] │
└────────────────────────────────────────────┘
```

**Differences only:** ≥768px each category is one row with its actions right-aligned, and pointer drag-and-drop is added **alongside** the ↑/↓ buttons, which remain at every width — drag is never the only way to reorder. ≥1024px a right-hand panel previews the category `<select>` exactly as `/join` renders it, so the order is verifiable without leaving the screen.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| **Default** | ≥1 category | Counts, order notice, Add button, "On the form" in order, "Retired" below — not rendered at all when empty, since an empty heading is noise | Each list is an `<ol>` inside `<section aria-labelledby>`, so order is structural and not merely a printed numeral |
| **Loading** | Fetching | Skeleton rows | `aria-busy="true"` on `<main>` |
| **Empty** | No categories at all | "There are no categories yet. Members can't pick one until you add at least one — and until then the category question is skipped rather than blocking them. [ + Add the first category ]" | Polite region; focus **not** moved — she is reading, not recovering |
| **Error** | (a) load failed (b) duplicate name (c) empty name (d) **Delete** pressed with listings (e) write failed | (a) "We couldn't load the categories. [ Try again ]" (b) "There's already a category called 'Photography'." — Save stays enabled, she may be mid-edit (c) "Give the category a name." (d) `role="alert"` replacing the hint: "'Childcare & nannies' can't be deleted — 12 published listings use it. Retiring it takes it off the form, and those 12 stay published and stay filterable." + **Retire it instead** (e) row banner "That didn't save — nothing has changed. [ Try again ]"; a failed reorder snaps back | (d) focus → **Retire it instead**, so the alternative is one keystroke away rather than something to hunt for |
| **Success** | add / rename / reorder / retire / delete | One polite sentence each, naming the item *and* the consequence: "Added 'Tutoring'. It's now the 10th choice on the form." · "Renamed to 'Sleep & feeding support'. 4 published listings show the new name straight away." · "Moved 'Wellbeing' to position 3 of 9." · "'Doula & birth support' retired. It's off the form. Its 3 listings stay published and stay filterable." · "Deleted 'Photography'. Nothing was using it." | Reorder keeps focus on the button that moved, which travels with the row, so repeated presses keep working |
| **Disabled** | (a) ↑ on first / ↓ on last (b) **Delete** with listings (c) any control mid-write | (a) dimmed and kept in place so the grid does not reflow (b) dimmed with the always-visible explanation (c) `busy` on that row only | `aria-disabled` for (a)(b), so both stay focusable and their explanations reachable |

Retire opens the Dialog with confirm **"Retire it"**: *"Retire 'Doula & birth support'? It comes off the form so no new member can pick it. Its 3 published listings stay published and stay filterable."* Delete (only at zero) uses tone `destructive` and confirm **"Delete it"**: *"Delete 'Photography'? Nothing is using it, so nothing is affected. This one can't be undone."*

**Accessibility, specific to this screen:** category names are list-item content, not headings — promoting nine of them would clutter the heading map for no navigational gain. Each row's accessible name reads "3 of 9, Childcare & nannies, 12 listings". The "can't be deleted" text is `aria-describedby` on the Delete button, so a keyboard user hears the reason *on focus*, before activating it; the alert on activation is a second chance, not the first. Rename commits on Enter and cancels on Escape.

---

### Notification states (FR-021, FR-022)

No transactional email path exists in the repo today, so the *first* state below is not an error — it is the expected launch configuration, and the UI makes manual sending easy rather than pretending sends happen. **NFR-011 governs: the decision and the send are two operations. A failed send never rolls back a decision, and the pill and the notification chip are always separate nodes with separate roles.**

| State | Display |
|---|---|
| `disabled` | "No email sent — email sending is off for now. [ Copy the message to send yourself ]" (plain text; the copy action also offers a pre-filled `mailto:`) |
| `queued` / `retrying` | "Emailing Hannah now…" / "Trying again…" + Spinner, in the polite region |
| `sent` | "✉ Emailed hello@littleacorns.co.uk at 14:07, 18 Aug 2026." |
| `failed` | `role="alert"`: "We couldn't email her — **your decision was saved**. Last tried Mon 18 Aug, 21:14. *«reason»*" + **Try again** + **Copy the message** |
| `given_up` | After three attempts: "Still not sending after three tries. Copy the message and email her yourself — her address is hello@littleacorns.co.uk." + **Copy the message** + **Mark as sent by hand**, which writes an attributed history entry so the record stays honest |
| `not_applicable` | "No email sent — you chose not to." + **Email her after all**, which re-opens the preview |

**The failure reason is a mapped string, never the provider's raw message or status code** (raw responses are logged server-side, without PII):

| Class | String shown to Ash |
|---|---|
| Address rejected / hard bounce | "That address didn't accept it — hello@littleacorns.co.uk may be wrong." |
| Auth or configuration (401/403, missing key) | "Our email service turned us away. It probably needs reconnecting — nothing you did." |
| Rate limited (429) | "Our email service is busy. It usually clears on its own — try again in a few minutes." |
| Provider 5xx or timeout | "Our email service didn't answer. Try again in a moment." |
| Browser lost the network | "Your connection dropped before we could send. Check you're online and try again." |
| Anything else | "Something went wrong at our end. Try again, or copy the message and send it yourself." |

A queue-level rollup keeps failures out of hiding: a warning banner under the tab strip — **"2 members haven't been emailed about your decision. [ Show them ]"** — filtering the tab to those rows. Silent at zero.

**Member emails.** Every one ends with the same footer (A18): *"Greenwich Parents & Carers CIC 16387545. Data controller: Aster Thackery. How we handle your data: greenwichparentsandcarers.co.uk/privacy. **Manage your data or unsubscribe:** [mail-token link]."* There is no "just reply to this email" anywhere — that reinstates the email-an-admin-and-wait loop FR-023 exists to remove. Each is shown verbatim in **Preview the email** before Ash commits; she is never asked to send something she has not read.

- **Published.** Subject *"Your GPC directory listing is live"*. "Hi Hannah, Your listing for Little Acorns Childminding is now live in the Greenwich Parents & Carers business directory. Have a look: greenwichparentsandcarers.co.uk/directory/little-acorns-childminding. Want to change something, or come off the list? You can do both from the link at the bottom of this email." + footer.
- **Rejected.** Subject *"About your GPC directory listing"*. "Hi Hannah, Thanks for asking to be listed in the GPC business directory." + the reason sentence for the chosen key + "You're very welcome to send it again — it takes two minutes: greenwichparentsandcarers.co.uk/join. You're still a GPC member and nothing else changes." + footer.
- **Taken down.** Subject *"Your GPC directory listing has come off the site"*. "Hi Hannah, Your listing for Little Acorns Childminding is no longer showing in the Greenwich Parents & Carers business directory." + the reason sentence — `member_request` "You asked us to take it down, so we have." · `complaint` "Someone got in touch with a concern about it, so we've taken it down while we look into it." · `closed` "We heard the business has closed." · `details_wrong` "Some of the details looked out of date, so we've taken it down until we can put them right." · `policy` "It didn't fit our directory rules." · `other` her words verbatim — then "You're still a GPC member and nothing else changes. If you'd like it back up, or you think we've got this wrong, email gpc.communitynews@gmail.com." + footer.
- **Admin batch (FR-022).** Subject *"3 new directory listings to review"*; body "3 listings are waiting in the GPC admin queue. Review them here: greenwichparentsandcarers.co.uk/admin/directory. We don't put member details in these emails." No names, no business names, no addresses — the link is the payload. If a batch send fails, a dismissible alert on the dashboard and M-S1 reads "We couldn't send this morning's 'new listings' email. **The count below is still right** — nothing has been missed."

**Pending count (FR-015: visible from the admin home).** Sidebar **Directory** item — a pill at `ml-auto` following the existing "Soon" pill, accessible name "Directory, 3 pending" (with overdue: "…, 1 waiting more than 5 working days", using the §2.7 warning pair). Dashboard quick-link card — the count replaces the arrow, "3 waiting", description "3 listings are waiting for you to review." M-S1's header and tab labels carry it as content. Browser title `Directory (3) | GPC Admin`. The count is fetched **with the admin shell**, not lazily after the dashboard paints — it is the only ambient signal that work exists, and a number arriving two seconds late arrives after Ash has moved on. Zero renders as **no pill at all**, never "0".

## Notes for architecture

- No requirement covers notifying a member when an admin *edits* their listing (FR-016). Take-down now has an email; edits deliberately do not. Confirm.
- Hold has no defined maximum duration; held rows age with the same waiting chips as pending, which is the only pressure on them.
- Working-day arithmetic for `WAITING_WARN_DAYS` / `WAITING_LATE_DAYS` needs a bank-holiday source; calendar days would be simpler and slightly stricter.
- The publish email's URL depends on the slug being generated once at first publication and never regenerated (A16) — enforce that in the data layer, not only in the UI.
- Admin display names are optional in `user_metadata`, so the NFR-013 fallback shows admins each other's email addresses. Consistent with "every admin is a full admin", but recorded as an acceptance.
- Undo after the publish email has gone leaves the member holding a link to a "no longer listed" page. The Undo confirmation says so; whether a correction email is offered is a product call.
- A retired category must stay in the public filter while it still has listings and drop out at zero. The public directory section must match; the transition when the last listing is unpublished is unspecified.
- No duplicate detection between pending listings. `duplicate` exists as a reject reason and search exists; nothing surfaces two pending listings for one business.
- Addendum Q3/Q4 (whether the public enquiry contact is an email, a phone or a link, and whether it is relayed) changes the signup-email warning, the M-S2 field and the public contact row.


---

## 4. Configuring the form

**Covers:** FR-008 (edit question wording) · FR-009 (open/close the form) · FR-010 (preview) · FR-006 criterion 5 (admin-visible count of rejected submissions), which is also the **only UX surface of NFR-003** — the anti-abuse threshold is enforced server-side, and this screen is where a live attack becomes visible to a human.
**Persona:** Ash — GPC admin. Volunteer, not technical, laptop, works in short bursts, must never open a database.
**Public form:** `greenwichparentsandcarers.co.uk/join`. **Contact address in member-facing copy:** `gpc.communitynews@gmail.com`.

| Route | Screen |
|---|---|
| `/admin/join-form` | S1 — Form settings |
| `/admin/join-form/questions/:questionId` | S2 — Question editor |
| `/admin/join-form/preview` | S3 — Preview |

One sidebar entry appended to `sidebarLinks` (`AdminLayout.jsx:5-16`): `{ to: '/admin/join-form', label: 'Join form', icon: ClipboardList }`, above `Subscribers`. The admin dashboard's card for it carries a live status line — **"Open · 3 unpublished changes"** / **"Open · up to date"** / **"Closed since 12 Aug"**. That line is this section's contribution to the dashboard spec and its main defence against a fix that is never published.

### The editing boundary, and what is drafted vs live

Ash may edit labels, help text, choice options, required flags, the intro text, the closed message and the open/closed state. She may not add, delete or re-parent questions, or change branching — that constraint is what keeps every stored answer attached to the question that produced it.

**Absent, not disabled.** A capability that never exists for anyone (add/delete/move a question, rewire branching, change a question's type) renders **no control at all**; its absence is explained once, in prose. A capability that exists but is unavailable *for this specific thing right now* (retire the last remaining option; make the branch-key question optional) renders **visible, dimmed, `aria-disabled="true"` so it stays focusable, with a permanently visible reason beside it** — never hover-only, never a lock icon. Reasons are stated as consequence, never as permission: "The rest of the form depends on this answer", not "You cannot change this." A greyed-out button is a promise the product cannot keep; a missing button with a paragraph explaining the shape of the tool is just how the tool is shaped.

The explanation, permanent at the foot of every question list (an `InlineDisclosure`, never dismissible):

> **Why can't I add or remove questions?**
> The questions, their order, and the branching are built into the site, so that every answer already stored stays attached to the right question. Wording is safe to change and takes a few seconds. Changing the *set* of questions would leave answers hanging off questions that no longer exist, so it's a code change. Email Kristina; it's a small job.

The lede above each list: **"You can change how every question is worded. The questions themselves, and which ones follow from which, are built into the site."** Present tense, factual, no modal verbs about Ash. Vocabulary throughout: *form settings* not form builder; *question* not field or block; *retire* not delete. Options are content and behave like content — **"Options are just words on a list — add, rename, reorder and retire them as much as you like."** — while questions are structure and behave like structure.

**Draft → publish (A4).** Printed verbatim on S1: *"If it changes what the public sees, it stays a draft until you publish it. The one exception is the switch at the top of this page."* Labels, help text, required flags, options, intro text and closed message are drafted, previewed and published as one atomic set; publish is all-or-nothing, which is what makes a multi-step edit land in a single instant. The open/closed toggle applies **immediately** — it is an emergency control, and a fire alarm with a second confirmation step in another part of the page is a broken fire alarm.

**Categories are not edited here (A3).** Form copy is drafted; directory data is live — the category question's options are the directory taxonomy, owned by `/admin/directory/categories` and applied immediately. S2 shows them read-only with a full-strength `[Manage categories →]` button. **Links in admin-authored member-facing copy:** the intro text and closed message may contain a link, written as `[text](url)` and rendered as a real anchor. Everything else is plain text with newlines preserved; no other markup is accepted anywhere in this section. (Resolves the draft's open question; stated once.)

**A change published while a member is mid-form.** The public form fetches its configuration once at page load and pins the `config_version` it rendered from; every submission declares that version and the server validates against **the version the member declared**, not the current one. Every content change is therefore a non-event for someone mid-form — including a required flag switched on, which cannot fail a member who never saw the rule, and a retired option, whose answer is still accepted. Closing the form is the one lossy case, and it is disclosed to Ash before she does it.

### Journey J1 — Ash fixes a typo on the live form

**Goal:** Correct "Weekly Newletter" → "Weekly Newsletter" and be certain nothing else changed. It lives as an *option* of question 4, so this exercises the rename path — the safest operation in the section, and the one that must be fast.
**Persona:** Ash. **Time:** 45–70 seconds, admin home to corrected public form.
**Entry points:** dashboard "Join form" card (primary) · sidebar · bookmark · already on S1 and spots it.
**Success criteria:** `/join` reads "Weekly Newsletter" with no deploy; Ash saw *before committing* that the 312 members who chose it keep their answer; she was never asked to confirm anything about approval or re-publishing member data; she ends on the screen she started editing, not ejected to a list.

```
/admin  dashboard card "Join form — Open · up to date"   │ click
   ▼
/admin/join-form  FORM SETTINGS
   [Open ●──] Form open to new members    Abuse blocked: 3 / 11
   ▶ 4  How did you hear about us?   Everyone · Required · 7 options
   │ click row 4
   ▼
/admin/join-form/questions/how_heard  QUESTION EDITOR
   Question 4 of 12 · Asked of everyone · Single choice
   ⠿ [Weekly Newletter          ] chosen by 312  ▲ ▼ Retire  ◄ edit
   │ type the fix
   ▼
   ⠿ [Weekly Newsletter         ] chosen by 312          Draft
      ┌──────────────────────────────────────────────┐
      │ 312 members chose this. Renaming updates what│  polite region,
      │ their record shows — it doesn't change what  │  grey, no icon,
      │ they picked.                                 │  no red
      └──────────────────────────────────────────────┘
   │ blur → draft autosaves → STICKY PUBLISH BAR (shared, one draft)
   ▼
   "1 unpublished change." [Discard] [Preview draft] [Publish changes]
   │ Publish ─────────────┬──────────────────────────┐
   ▼ success              │                          ▼ failure
   Bar becomes, in place: │   Error banner above the bar:
   ✓ "Published. Members see    "Couldn't publish — the changes are
     your changes now."          still saved as a draft." [Try again]
```

| Decision point / trigger | Display | Recovery |
|---|---|---|
| Ash can't find where the form lives (13-item flat sidebar) | Dashboard card described as "Edit the wording of the membership form at /join, open or close it, and preview each branch." | `/join`, viewed by an authenticated admin, shows a fixed bottom-right chip **"Admin: edit this form"**. Optional; the journey succeeds without it. |
| She looks for the typo among the *questions* and doesn't see it | Choice rows show an option count; the whole row is one `<Link>` | S1 carries **"Find a word in the form"** — matches labels, help text *and* option labels, showing matching options inline beneath their question. Typing "newletter" surfaces the row. |
| She fears the fix will break 312 existing answers | The rename-impact note above, on first keystroke, debounced 600ms | The count is the evidence. `[See those members →]` opens the members list filtered to that answer. |
| She saves but never publishes | Sticky bar never scrolls away; dashboard card reads "1 unpublished change"; navigating away triggers the guard | The guard's primary button is **"Publish now"**, not "Save". |
| She typed the fix into the question *label* by mistake | Label sits in a bordered card under a heading; options sit in the handled list. The bar counts "2 unpublished changes", flagging the extra edit | `[Discard]` reverts all draft edits behind a confirm. Per-field revert is out of scope. |

**Drop-off risk.** The dominant risk is not failure but **false success**: fix the typo, feel finished, close the laptop, and `/join` still says "Newletter". Every non-accessibility mitigation here targets that one failure — the sticky bar, the dashboard change count, and the guard whose primary button publishes. If testing shows Ash still walks away with an unpublished draft, the fix is a reminder, not abandoning draft/publish: the alternative failure (a half-finished edit live on the public form) is worse and silent. Second risk is **discovery** — "Join form" is not how Ash names the thing with the typo in it, which is why the card names `/join` and the word search matches text by its text rather than by its container. Third is **fear**: a volunteer editing a form 1,800 members will see may simply not touch it, so the impact note is grey and factual, never a red warning triangle.

### Journey J2 — Ash closes the form while she catches up

**Goal:** Take `/join` offline immediately, with a closed message members can act on, and know what it does to anyone mid-form.
**Persona:** Ash, usually under pressure — spam is arriving, or moderation is weeks behind.
**Time:** 20 seconds to close; 2 minutes if she writes and previews the message first.
**Entry points:** S1 status card · the "Abuse blocked" warning banner's `[Close the form to new members]` · dashboard card when already closed.
**Success criteria:** `/join` serves the closed message within seconds and no deploy; Ash saw the consequence for in-flight members *before* confirming; the closed message was previewable while the form was still open; reopening costs one tap and no confirmation.

```
/admin/join-form   [Open ●──]  ──► tap
   ▼
┌═══════════════════════════════════════════════════════════┐
║ DIALOG (the one Dialog primitive, A14)                    ║
║ Close the form to new members?                            ║
║ Members visiting /join will see your closed message       ║
║ instead of the form. This takes effect straight away.     ║
║                                                           ║
║ Anyone part-way through the form right now won't be able  ║
║ to send it. They'll see a message asking them to email us ║
║ instead. You can reopen it any time.                      ║
║          [Cancel]              [Close the form]           ║
└═══════════════════════════════════════════════════════════┘
   ▼ confirm — applies at once, no publish step
Status card: ● Closed · "Closed since 18 Aug"; dashboard card matches.
Publish bar unaffected: a pending draft is still a draft.
```

The member who was mid-submission when it closed sees this — mapped from the distinct "form closed" status, not the generic error path, with her typed answers **never cleared**:

> **The form closed while you were filling this in**
> We're really sorry. GPC has just paused new sign-ups, so we couldn't send this.
> Nothing you typed has been lost — it's all still on this page. Copy your answers and email them to gpc.communitynews@gmail.com and we'll add you by hand.
> `[Copy my answers]`

| Decision point / trigger | Display | Recovery |
|---|---|---|
| Ash wants the closed message right before closing | The closed-message textarea is **never dimmed while the form is open** — she must be able to write it before she needs it | `[Preview draft]` → S3 with `Form state: Closed` renders it against the real page. |
| She previews the closed state and forgets the form is still open | `StatePreviewWarning` under the frame: "The form is currently Open. This is just a preview of the closed state." | Persistent while the two differ. |
| She closes with an unpublished draft in flight | The toggle is exempt from publish; the draft is untouched and the bar keeps its count | Nothing to recover — the two systems are deliberately independent. |
| Blocked sign-ups spike and she doesn't know what to do | The abuse banner's action button is the close toggle itself, focused not just scrolled to | Closing is presented as an available response, never as the required one. |

**Drop-off risk.** The failure mode is a form left closed and forgotten — a silent front door. Mitigations: the dashboard card reads "Closed since 12 Aug" with the date rather than a bare pill, and the status card repeats it. The second risk is Ash refusing to close at all because she cannot predict the damage; the dialog's in-flight sentence exists to make the one destructive consequence of the one immediate control visible at the moment of the decision.

### Screens

#### Screen S1 — Form settings

**Purpose:** the single home for whether the form is open, where it lives, what it says before the questions start, what it says when closed, how every question is worded, and how much abuse is being turned away.
**Exits to:** S2 · S3 · `/admin/directory/categories` · live `/join` in a new tab.

```
320px viewport · 16px gutters
┌────────────────────────────────────────┐
│ ☰  GPC Admin                   Sign out│  sticky bar + drawer (A21)
├────────────────────────────────────────┤
│  Admin home ›   Join form           h1 │
│  Everything members see at             │
│  greenwichparentsandcarers.co.uk/join  │
│ ┌────────────────────────────────────┐ │
│ │ ● Open  Form open to new members   │ │  pill per DESIGN.md §2.7
│ │                         [ ●── ]    │ │  Toggle role=switch 44px
│ │ Members can fill in the form now.  │ │  both lines chained into
│ │ This switch takes effect straight  │ │  the switch's
│ │ away. It isn't part of Publish.    │ │  aria-describedby
│ ├────────────────────────────────────┤ │
│ │ Abuse blocked        h2 · FR-006   │ │
│ │  3 last 7 days   11 last 30 days   │ │  28px figures
│ │  Honeypot 9 · Rate limit 2         │ │
│ ├────────────────────────────────────┤ │
│ │ Public link                        │ │  readonly + truncate
│ │ [greenwichparentsandcarers.co.…]   │ │  [ ⧉ Copy ] [ ↗ Open ],
│ ├────────────────────────────────────┤ │  two 44px buttons
│ │ Intro text — plain text, and       │ │  textarea 6 rows; counter
│ │ [ Welcome to the GPC Mums in …   ] │ │  "487 left" → shared region
│ ├────────────────────────────────────┤ │
│ │ Closed message — "Say when you'll  │ │  textarea 5 rows
│ │ [ We've paused new sign-ups …    ] │ │  reopen if you know."
│ └────────────────────────────────────┘ │
│  The questions members are asked    h2 │  the lede and the one-rule
│  [ 🔍 Find a word in the form        ] │  box sit here, both quoted
│  ASKED OF EVERYONE                  h3 │  verbatim above
│ ┌────────────────────────────────────┐ │
│ │ 4  How did you hear about us?    › │ │
│ │    Single choice · Required · 7    │ │
│ │ 5  Which group would you join?   › │ │
│ │    Single choice · Always required │ │
│ │    ⤷ This answer decides which     │ │
│ │      questions come next.          │ │
│ └────────────────────────────────────┘ │
│  ONLY IF THEY CHOOSE BUSINESS MUMS     │  group labels are h3 —
│  OR BOTH      ▸ 6 What stage best…  ›  │  branching stated as
│  ONLY IF THEY OPT INTO THE DIRECTORY   │  fact, never as a control
│  ▸ 10 Which category… 12 · managed  ›  │  read-only here (A3)
│  ▸ Why can't I add or remove questions?│  InlineDisclosure
├────────────────────────────────────────┤
│ │ 3 unpublished changes. Members     │ │  STICKY PUBLISH BAR,
│ │ still see the published version.   │ │  role=region aria-label
│ │ [ Preview draft ] [Publish changes]│ │  ="Unpublished changes"
└────────────────────────────────────────┘
```

**≥768px (differences only):** sidebar returns to the persistent rail; content capped `max-w-4xl` (settings read badly at `max-w-7xl` — the textarea line length becomes unreadable); status / abuse / public-link cards form a two-column grid; question-row badges move to the right of the row; the publish bar becomes a horizontal strip, buttons `w-auto`. No `xl:` changes.

**"Abuse blocked" tile (FR-006 criterion 5).** It sits directly under the status card because the evidence and the only control that answers it belong together. Counts are of *rejected* submissions over rolling windows — last 7 and last 30 days — split honeypot vs rate-limit, because the two mean different things (a bot script vs a flood). It shows **no personal data**: no IPs, no addresses, no payloads. Preview never increments any of these counters. Zero state: "Nothing blocked in the last 30 days." The tile fetches independently of the config and fails independently: on error it shows "Couldn't load the blocked count" and `[Try again]` without touching the rest of the page.

A **warning banner** (DESIGN.md §2.10 warning, `role="status"`) appears above the status card when blocked submissions in the rolling 24 hours exceed **20 and are at least 3× the trailing 7-day daily average** — both conditions, so a steady low hum never cries wolf: The banner's action moves focus to the toggle rather than closing anything — closing is offered, never automatic.

> **Unusual number of blocked sign-ups**
> 47 in the last 24 hours, against a usual 2 a day. None of them reached your queue and members can still join normally. If it keeps rising you can close the form for a while.
> `[Close the form to new members]`

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Config loaded, nothing unpublished | Everything editable. Publish bar **absent** — absence is the honest signal that there is nothing to publish, where a dimmed bar would imply there is | Standard structure, no live traffic |
| Loading | Initial config fetch | `<h1>` and breadcrumb render immediately; skeletons match card and row geometry (DESIGN.md §2.12). Never a centred spinner on a blank page — this screen's shape is predictable | `aria-busy="true"` on the content region; "Loading form settings." once; skeletons `aria-hidden` |
| Empty | Config row absent (seed migration not run) | Card: "The join form isn't set up yet. Setting it up copies the questions and wording that ship with the site, so you can start editing them." `[Set up the join form]` | `role="status"`; focus to the card's `<h2>` |
| Error | Load / draft-save / publish failure | Inline banner (DESIGN.md §2.10) below `<h1>`. Load: "Couldn't load the form settings. The form itself is unaffected — members can still fill it in." Save: "Couldn't save your draft. Your changes are still here on screen — don't reload." Publish: "Couldn't publish — your 3 changes are still saved as a draft." Each `[Try again]` | `role="alert"`; focus moves to the banner; implicated fields get `aria-invalid` + `aria-describedby` |
| Success | Publish 2xx | The publish bar **transforms in place** to the success banner — no toast, no navigation (A6): "Published. Members see your changes now." + `[View the live form ↗]`. Collapses after 6s or on the next edit. Draft autosave shows "Draft saved 14:32" on the bar's second line | Bar's nested `role="status"`; focus is **not** moved — Ash is mid-flow |
| Disabled | Per the boundary rule | No control at all for add/delete/move/re-parent a question or edit branching. `Publish changes` dims with "Fix 1 problem before publishing" + `[Show me]`; with zero changes the whole bar is absent. The closed-message textarea is never dimmed while the form is open | Dimmed controls use `aria-disabled="true"`, stay focusable, reason via `aria-describedby` |

**Accessibility (screen-specific).** `<h3>` group labels ("Asked of everyone", "Only if they choose Business Mums or Both") present branching as a stated fact, which is how it reaches a screen-reader user as information rather than as a missing control. The publish bar is a named `role="region"` so it is reachable from the landmark list — it is visually always "there" for sighted users and must be equally always-reachable. The switch announces "Form open to new members, switch, on", with its two supporting lines chained in `aria-describedby`. `AdminLayout` gains the skip link it lacks today (public pages already have one — do not add a second). Returning from S2 puts focus on the row that was edited, so Ash never loses her place in a twelve-row list.

#### Screen S2 — Question editor

**Purpose:** edit one question's wording, help text and required flag, and manage its options — add, rename, reorder, retire, restore. This is where FR-008's retire guarantee becomes *visible* rather than promised.

```
320px viewport
┌────────────────────────────────────────┐
│  ‹ Join form                           │  44px back link
│  How did you hear about us?         h1 │  the PUBLISHED label,
│  Question 4 of 12 · Asked of everyone  │  stable while editing
│  · Single choice                       │  ← provenance, read-only
│ ┌────────────────────────────────────┐ │
│ │ Question label                     │ │  FieldGroup: label htmlFor,
│ │ What members see as the question.  │ │  help id in describedby
│ │ [ How did you hear about us?     ] │ │  94 left
│ │ Help text (optional)  [          ] │ │  3 rows
│ │ Members must answer this  [ ●── ]  │ │  Toggle
│ └────────────────────────────────────┘ │
│  Options                    7 live· h2 │
│  Options are just words on a list —    │  verbatim; options are
│  add, rename, reorder and retire them  │  content, so they behave
│  as much as you like.                  │  like content
│ ┌────────────────────────────────────┐ │
│ │ ⠿ [Weekly Newsletter             ] │ │  handle 44×44
│ │   chosen by 312             Draft  │ │  pill per DESIGN.md §2.7
│ │   ┌──────────────────────────────┐ │ │  rename-impact note:
│ │   │ 312 members chose this.      │ │ │  grey, no icon, no red,
│ │   │ Renaming updates what their  │ │ │  600ms debounce, only
│ │   │ record shows — it doesn't    │ │ │  when usage > 0
│ │   │ change what they picked.     │ │ │
│ │   └──────────────────────────────┘ │ │
│ └────────────────────────────────────┘ │
│ [           + Add option            ]  │  full width, 44px
│ ┌────────────────────────────────────┐ │
│ │ ▼ Retired options (1)           h3 │ │  button aria-expanded
│ │  Retiring hides an option from the │ │  ← THE GUARANTEE: a plain
│ │  form. It never changes an answer  │ │  <p> in the region, read
│ │  anyone has already given.         │ │  in normal order — not a
│ │  Retiring is reversible; nothing   │ │  tooltip, not behind a
│ │  here can be deleted.              │ │  disclosure
│ │ F̶a̶c̶e̶b̶o̶o̶k̶ ̶G̶r̶o̶u̶p̶            Retired │ │  strike + pill + date,
│ │ Retired 3 Jun 2026 · on 47 past │ │  ← THE EVIDENCE; never
│ │ answers                        │ │  strikethrough alone
│ │ [ Restore this option     ]        │ │  ← REVERSIBILITY
│ └────────────────────────────────────┘ │
│  … same sticky publish bar, same draft │
└────────────────────────────────────────┘
```

**≥768px (differences only):** content capped `max-w-3xl`; option rows become single-line with the impact note beneath rather than pushing controls down; retired-row actions sit inline right; the provenance strip moves to a right-hand rail so the unchangeable facts stay visible while editing. Drag-to-reorder is enabled only under `@media (pointer: fine)`; the `▲ ▼` buttons exist at every size and are the guaranteed path.
**Variants.** *Branch-key question (Q5):* the Required toggle is dimmed with "Always required. The rest of the form depends on this answer — Business Mums and Career Mums see different questions after it." *Consent question:* dimmed with "Always required. We can't store a submission without it." *Branch question:* fully enabled, with "Either way, it's only asked of people who chose Business Mums or Both — nobody else is ever blocked by it." *Category question:* options render as **plain text, not dimmed inputs** — dimmed inputs read as "you may not edit these", plain text reads as "shown here for reference" — above a full-strength `[Manage categories →]`.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Question loaded, clean | Fields hydrate from `override ?? shipped default`, never `''`; an untouched field carries a grey "Default wording" note so Ash can tell what she has changed | Standard structure |
| Loading | Question + usage counts fetching | `<h1>` and provenance render immediately from the route param and the code-defined structure; wording panel and rows show skeletons; counts show "counting…" and resolve independently so the editor is usable first | `aria-busy` on the form region; "Loading question." |
| Empty | Nothing retired | The retired group is **absent entirely** — no empty box, no "0 retired". The first retirement creates it | — |
| Error | Label emptied / duplicate option / request failure | "Give this question a label — members will see nothing to read otherwise." · "There's already an option called 'Instagram'. It's currently retired — restore it instead of adding a second one." + `[Restore it]` · request failures use the S1 banner | Field errors `role="alert"` on first appearance; error id appended to `aria-describedby` **after** the help id, so help is heard before error |
| Success | Retire / restore / save | Retired row moves into the group, which auto-expands: "Accounting & Tax retired. It's in the retired group and will disappear from the form when you publish." Restore: "…restored. It's now the last option and will appear when you publish." | Announced in the page's polite region; focus follows the moved row |
| Disabled | Last live option; branch-key and consent Required toggles; publish with a validation problem | Visible, dimmed, reason permanently beside it: "Can't retire the last option — this question has to offer members something to choose. Add another option first." | `aria-disabled="true"`, focusable, reason in `aria-describedby` and always read |

**Accessibility (screen-specific).** The `<h1>` is the **published** label, not the draft one, so a screen-reader user's page name does not change under them mid-edit. On entry, focus lands on the back link rather than the first input — auto-focusing the field would mean the provenance strip, which is what makes the boundary comprehensible, is never heard. Each option input has a visually-hidden label "Option 2 of 7, label" with "Chosen by 312 members." in `aria-describedby`; the `Draft` pill carries visually-hidden text "unpublished change" so state is never colour alone. Retire moves focus to the new row's `[Restore this option]`, putting undo one key away. Enter in an option input commits and moves to the next option (the spreadsheet convention Ash expects); `⌘Enter` adds an option; drag is never the only route to reorder.

#### Screen S3 — Preview (FR-010)

**Purpose:** let Ash see exactly what a member sees, in every branch, **including unsaved draft edits**, without creating a member record, a listing, or a consent record.

```
320px viewport
┌────────────────────────────────────────┐
│ ▓ Preview — nothing here is saved   ✕ ▓│  dark chrome, sticky,
│ ▓ Draft · 3 unpublished changes      ▓ │  deliberately unlike the
├────────────────────────────────────────┤  public site
│ Viewing as        (radiogroup, 44px)   │
│ [ Not chosen yet ] [ Business Mums ]   │
│ [ Career Mums ✓  ] [ Both          ]   │
│ Directory opt-in [ ●── ]   ← reach the │
│ Form state       [ Open  ▾ ]  FR-003   │
│ Width            [ Phone ▾ ]  section  │
├────────────────────────────────────────┤
│ ╔══════════════════════════════════════╗
│ ║ Draft preview · 3 unpublished changes║  in-frame banner
│ ║   THE REAL PUBLIC FORM COMPONENT,    ║  4px pink frame = non-text
│ ║   rendered from the DRAFT config     ║  UI, and role="region"
│ ║   with isPreview set by the ROUTE    ║  "Preview of the public
│ ║   ┌──────────────────────────────┐   ║  join form"
│ ║   │ The Business and Career      │   ║
│ ║   │ questions appear here once a │   ║  yet" — an unexplained
│ ║   └──────────────────────────────┘   ║  gap would read as a bug
│ ╚══════════════════════════════════════╝
│ ⓘ The form is currently Open. This is  │  shown whenever the chrome
│   just a preview of the closed state.  │  and reality differ
│ … publish bar travels here; [Preview   │
│   draft] becomes [Back to settings]    │
└────────────────────────────────────────┘
```

**≥768px (differences only):** chrome collapses to one horizontal strip; the frame is centred at 390px (Phone) or 768px (Full) on a neutral backdrop so its edge is unambiguous. **≥1024px:** side-by-side becomes the default — question list left, preview right, clicking a question scrolls and outlines it; `[Single column]` toggles back. This is the mode that earns preview its keep during a multi-question edit.

**Preview safety contract.** `isPreview` is set by the route, never by a user-supplied value, so it cannot be forged into a real submission path. On submit the preview runs the form's **real client-side validation** — checking a required-flag change is the main reason to preview — then returns **without issuing any network request**: no endpoint, so no rate-limit, honeypot or rejection counter moves and no server log line appears. The chrome's `Form state` affects only the render and never the real open/closed state. The previewed form is the real `JoinForm` component, not a mock: if preview and production can diverge, preview is worthless.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Opened with unpublished changes | Chrome + "Draft preview · 3 unpublished changes included" + the form in the selected branch | On entry: "Preview. Nothing you do here is saved. Showing the draft with 3 unpublished changes, as Career Mums." |
| Loading | Draft resolving on direct navigation | Chrome renders with controls dimmed and the reason "Loading the form…"; frame shows a skeleton of the form's shape | `aria-busy` on the frame |
| Empty | `Viewing as: Not chosen yet`, **or** no unpublished changes | Dashed placeholder inside the frame but visibly marked as chrome (see wireframe). With no draft: "Showing the published version — you have no unpublished changes." — not an error; previewing the live form is legitimate | The placeholder is a `<p>` read in document order, never `aria-hidden` |
| Error | Draft fails to load | Banner inside the frame: "Couldn't load the preview. Your draft is safe — go back to settings and try again." `[Back to settings]` `[Try again]` | `role="alert"` |
| Success | Preview submit passes validation | "Preview only — nothing was saved. On the live form this would have created a member record and a pending directory listing for review." (second clause drops if the directory opt-in was off). `[Back to the form]` keeps the answers; `[Clear and start again]` resets | `role="status"`; focus to the result heading |
| Disabled | Nothing here is permanently disabled | Chrome controls are the screen's whole purpose. The preview's own submit is **never** disabled — disabling it would prevent Ash checking the validation behaviour she came to check | Contextual dimming during load carries its reason |

**Accessibility (screen-specific).** The frame is a named `role="region"` — "Preview of the public join form" — so a screen-reader user can tell from the landmark list alone where the admin interface ends and the simulated public page begins; that is the accessibility equivalent of the pink border. The previewed form's headings are **demoted one level** in preview mode, the single deliberate divergence from production rendering, required to keep the admin page's outline valid. Tab order never enters the previewed form before the chrome controls: Ash always meets "this is a preview" before she meets anything that looks real, and the same sentence is announced on mount, shown as the first visible text, and carried in the frame's label — a screen-reader user who believes she is on the live form and fills it in has wasted several minutes.

### Cross-screen behaviour

The three screens share **one draft and one publish bar**, held above the routes at the `/admin/join-form` layout level — which is what makes several edits land in a single instant rather than aspirationally.

- **Autosave:** 800ms after the last keystroke, immediately on blur, immediately on any discrete action (retire, restore, reorder, add, toggle). Success is a timestamp on the bar's second line, announced at most once per 30s. Failure retries three times with backoff before surfacing the banner, sets the bar to "Not saved yet", and dims Publish with "Save your draft first." **On-screen values are never reverted or reloaded on a save failure** — Ash's typing is the only copy.
- **Unsaved-changes guard** (`Dialog`, A14; plus `beforeunload` for tab close): fires on navigation *out of* `/admin/join-form/*`, never between the three screens. "You have unpublished changes — your 3 changes are saved as a draft, so they'll still be here when you come back. Members won't see them until you publish." `[Publish now]` (primary) · `[Stay here]` · `[Leave without publishing]` (text). **No path in this dialog discards anything**; discarding needs the explicit `[Discard changes]`, which has its own confirm: "Discard all 3 unpublished changes? This puts everything back to what members currently see. It can't be undone."
- **Publish conflict:** "Someone else published a change while you were editing. Review what changed, then publish again." `[See what changed]` renders a plain-language diff — "'Weekly Newletter' renamed to 'Weekly Newsletter' by Kristina, 14:20". Ash's draft is never overwritten.
- **Live regions:** all polite announcements on these screens — character counters (throttled to 50/20/10/0 remaining), reorder position, save timestamp, branch switch, change count — write into the page's single shared polite region (A13). Errors go to the single `role="alert"` region.
- **Departures from the `LondonEventForm` pattern this section deliberately makes:** never `navigate()` away on success (a settings screen is a place you stay, and ejecting Ash to a list after each edit turns one editorial act into three errands); autosave instead of a Save button, so **Publish is the only button that means "done"**; JS validation alongside native, because "at least one live option must remain" cannot be expressed in HTML; and two error surfaces — inline field errors for what Ash can fix by typing, the page banner reserved strictly for request failure.

### Notes for architecture

- **`FORM_STRUCTURE` in the bundle is the mechanism, not the UI.** An ordered array of `{ id, type, branch, editable[], defaultLabel, defaultOptions }`; the admin configuration is a sparse overlay keyed by question id. The UI does not "prevent" adding a question — there is nowhere to put one. Hydration is `draft[id]?.label ?? FORM_STRUCTURE[id].defaultLabel ?? ''`.
- **`config_version` is unspecified in the PRD and this section depends on it.** Publish increments it; submissions declare the version they rendered from; the server validates against the declared version. Without it a required-flag change can reject a member who never saw the rule. Most consequential item here.
- **Two backend assumptions:** the configuration row is seeded from `FORM_STRUCTURE` by migration (which makes S1's Empty state unreachable and guarantees `/join` renders on first deploy), and the config row supports optimistic concurrency (without it the publish-conflict state above cannot exist and the last publish silently wins).
- **Question *type* is not admin-editable**, so the source form's checkbox/radio defect ("How often would you like events?" accepting Weekly + Quarterly) must be fixed in `FORM_STRUCTURE` before launch. No FR assigns it.
- **The abuse counter needs a queryable store of rejections** with a reason enum (`honeypot` / `rate_limit`) and a timestamp, retaining no personal data — the tile, the 24-hour rate and the 7/30-day windows all read from it.
- **Insights reads question and option labels from this configuration**, not from a hard-coded list; what it shows for answers collected under earlier wording is unspecified between the two sections.
- **The admin sidebar reaches ~13 flat items** across these epics and wants grouping (no single FR owns it), and `gpc.communitynews@gmail.com` should be confirmed as the right destination for "we couldn't take your sign-up" mail before launch.


---

## 5. Member records and demand insights

**Covers:** FR-012 (member database), FR-013 (export), FR-014 (demand insights), NFR-010 (1,000 records). Supporting: NFR-002, NFR-004, NFR-006, NFR-013.
**Routes:** `/admin/members`, `/admin/members/:memberId`, `/admin/insights`.
**Persona:** Ash — volunteer GPC admin, not technical, works in short bursts, must never open a database.

**Privacy posture.** These are the only screens where private member data is legitimately on screen. Six boundaries hold.
1. Every read goes through `/api/admin/*` with a server-verified bearer token (NFR-002) — never the browser anon key, which is public in the bundle. 401 returns no data body.
2. **No personal data in a URL.** The detail key is the record uuid; search and filter state live in a route-level store, deliberately not the query string — `?search=hannah@example.com` writes an email into history, referer headers and access logs. A conscious divergence from FR-019, which governs the *public* directory where a filter value is a category. Filters reset on hard reload; that cost is accepted.
3. **No personal data in logs, notifications, document titles or filenames.** Titles are `"Members | GPC Admin"` / `"Member record | GPC Admin"`.
4. Confirmations name counts, never people: "Downloaded 216 member records."
5. Downloading is the one act that moves data outside these protections, so it is the one act confirmed (S3).
6. **No "audited" or "only you can see this" language.** Every account is a full admin; FR-D04 (tiers) and FR-D05 (read audit) are deferred. This release mitigates with attribution on *writes* (NFR-013), not restriction on reads.

---

### Journey J1 — Ash answers "what do you actually hold about me?"

**Goal:** From a member's email, find the record and read back the exact consent wording, version and UTC timestamp per purpose — without Supabase, without asking a developer.
**Persona:** Ash. Secondary beneficiary: Aster Thackery, the named controller, accountable for the answer Ash gives.
**Time:** 60–90s to find and read; 2–3 min if a portability file is produced.
**Entry points:** sidebar → Members · dashboard "Members" tile · `/admin/data-requests` → "Open this member's record" · moderation review → "View full member record" (A17) · a bookmarked uuid URL, safe to share internally because it carries a uuid and nothing else.
**Success criteria:** consent text, version and UTC timestamp readable aloud from one screen, per purpose (FR-004) · every answer visible, unanswered shown as "Not answered" not blank · submitted-vs-published distinguishable where an admin edited (FR-016) · no raw column name, bare uuid or JSON blob · zero clicks into Supabase.

```
  Member emails: "What do you hold about me?"
                 v
  /admin/members  -- tiles over the FULL set, first 100 rows
                 v
  Types "hannah@" into Search
     client-side filter, no round trip
     polite live region: "3 members match."
                 v
        +--------------------+
        |  exactly 1 match?  |
        +--------------------+
      yes |          | no -> narrow by group / directory / consent,
          v          |       or disambiguate on first name + business
  Opens the row -> /admin/members/:id
                 v
  1 Who they are  2 What they told us  3 Directory listing
  4 Consent history <-- THE ANSWER     5 Activity
                 v
  Consent history, newest first, all UTC:
    NEWSLETTER   WITHDRAWN v1.2  2026-07-22 08:02:55 UTC  unsubscribe link
    HOLD MY DATA GIVEN     v1.2  2026-03-04 19:41:07 UTC  web form (/join)
    PUBLISH      GIVEN     v1.2  2026-03-04 19:41:07 UTC  web form (/join)
    NEWSLETTER   GIVEN     v1.2  2026-03-04 19:41:07 UTC  web form (/join)
                 v
   "Copy consent record"        "Export this member's record"
    plain text, link URLs        one file, named by uuid + date
    expanded inline (S2)         (S3 dialog)
                 v
     Ash replies to the member, accurately.
```

| Trigger | Display | Recovery |
|---|---|---|
| Search matches nothing | **"No member matches that."** / "Try just part of the email, or search their business name instead. If they asked to be erased, their record is gone by design — nothing about them is kept." + **"Clear search and filters"** | Clear restores the full list; focus to search |
| Two people look alike | Every match shows first name, business, email, joined date — enough to disambiguate | Add a filter, or open each; Back preserves list state |
| They wrote from a different email | No match; the copy above already points at business name | If still nothing, a real dead end (see Notes) |
| Re-submitted the form (FR-007) | Per A10 the listing carries a `Resubmission` status pill; the record shows **one activity entry** — "2 Aug 2026 · Re-submitted the form" — with a disclosure **"Show what they answered on 4 Mar 2026"**. No separate Updates view exists anywhere | Disclosure expands the superseded answers in place |
| No directory listing | `Not requested` pill: "This member did not ask to be listed. Nothing about their business is public." | None — an answer, not an error |
| Listing was admin-edited (FR-016) | "As submitted / As published", changed fields marked **"Edited by an admin"** and attributed: "Edited by ash@… on 12 Mar 2026" | Ash can quote both |
| A consent was withdrawn | Grant and withdrawal both appear, each with its own UTC timestamp; nothing overwritten (FR-004). Effective state is a pill row at the top | None — designed behaviour |
| Consent row has no version | Version reads **"Not recorded"** in an error-tinted row: "This record predates consent versioning. Treat it as unevidenced and re-ask before relying on it." | Escalate to the controller; never rendered as if evidenced |
| 401 mid-read | **"Your session has expired. Sign in again to see member records."** + **"Sign in"**; member data cleared from state first | Sign in, return to the same route |

**Drop-off notes.** The failure is not visual — it is losing her place, or losing confidence she has the right person. *(a) Place:* navigating into a record and back must restore search string, filter selections, `visible` count and scroll, with focus on the row she came from; at 1,000 records, being dumped at the top of an unfiltered list after every lookup is the single most likely reason she abandons the page — the same defect already fixed once for the discovery review queue. *(b) Identity:* the form collects a first name only, so the row's primary line is first name **plus** business name, email muted beneath; opening the wrong record is a privacy event, which is why nothing on the detail page auto-performs. *(c) The erased member:* FR-023 keeps only a non-identifying erasure record, so "we erased you" and "we never had you" are indistinguishable — the empty-state copy says so rather than papering over it. *(d) Reading fatigue:* three walls of verbatim prose get skimmed and misquoted, so each row leads with a one-line summary at full weight and carries the verbatim text beneath, **always visible, never behind a disclosure** — a DSAR answer that needs a click to reveal is one that gets given wrong. *(e) Timezones:* consent timestamps are UTC and carry the literal string "UTC"; everything else is local `en-GB` short dates. Mixing them unlabelled is how an admin tells a member they consented an hour before they did.

---

#### Screen S1 — Members list (`/admin/members`)

```
+------------------------------------+  320px
| [=]  GPC Admin           [ out ]   |  AdminLayout drawer + top bar (A21)
| Members                        h1  |
| Everyone who has filled in the     |
| join form, and what they agreed to.|
| [ See the insights -> ]            |
+------------------------------------+
| MEMBERS             216            |
| IN THE DIRECTORY    34 published   |
|                     12 pending 3 held
| BUSINESS BRANCH     112 (52%)      |
| CAREER BRANCH       124 (57%)      |
| NEWSLETTER CONSENT  178 (82%)      |
| DATA REQUESTS OPEN    2  ->        |  -> /admin/data-requests (A5)
| ! Every tile counts ALL 216        |
|   members. Filters below change    |
|   the list only, never the tiles.  |
+------------------------------------+
| (o) Search name, email or business |  44px, type="search"
| Group [Everyone v] Directory [Any v]
| Consent [Any state v]              |
| Showing 100 of 216                 |
| [ Export these 216 (CSV) ]         |  label always states the live count
| Exports what's in the list below,  |
| not the totals above.              |
+------------------------------------+
| Hannah                             |  one card per member below md:
| Little Fox Photography             |
| hannah@littlefox.example           |  muted 14px
| [Both] [Published] [News: yes]     |  pills per DESIGN.md §2.7
| Joined 4 Mar 2026        Open >    |  whole card is one <a>, min 88px
+------------------------------------+
| Sarah                              |
| sarah.k@example.com                |
| [Career] [Not listed] [News: no]   |
| Joined 11 Mar 2026       Open >    |
+------------------------------------+
| [   Show 100 more   ]              |
+------------------------------------+
```

**≥768px:** cards become a real `<table>` (sr-only `<caption>`; Member / Group / Joined / Directory / Newsletter / action) with a right-aligned "Open" link — **never a `<div onClick>` row**; tiles 2-up; filters, count and export on one flex row. **≥1024px:** tiles 3-up with the headline spanning 2; the table gains **Postcode** last, being least often needed and most sensitive to shoulder-surfing. No `xl:` — unused in this codebase.

**Components.** `MembersManager`; `StatTile` lifted out of `SubscribersManager` into `src/components/admin/StatTile.jsx` and used by both; `WholeSetNotice`; `MemberFilters` (search + three `<select>`, every control `htmlFor`/`id`); `MemberRowCard` / `MemberTable` (one data shape, two renderers); `Badge` with new `group-*`, `dir-*`, `news-*` variants; `ShowMoreButton`; `ExportDialog` over the shared `Dialog` (A14); shared `Spinner` (A7). **Pills reuse `SubscribersManager`'s module-scope class-map *idiom* and none of its values** — that ramp is ~3.4:1 and ~3.1:1 and fails AA at pill size (A15). All values come from DESIGN.md §2.7.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Loaded, ≥1 member | Tiles over the full set; first 100 rows; "Showing 100 of 216" | Page's single polite region (A13): "Showing 100 of 216 members." sr-only `<caption>` on the table |
| Loading | Initial fetch | **Skeletons** for tiles and rows (A7), layout does not collapse; filters render `disabled` and dimmed, never hidden | `aria-busy="true"` on the list region; polite: "Loading members." |
| Empty | Zero rows: tiles read `0`; **"No one has filled in the join form yet."** / "When someone does, they'll appear here with everything they told us." Filters and export disabled. Filters match nothing: tiles unchanged (still the full set) + the J1 copy + **"Clear search and filters"** | — | Polite: "No members match. 216 members in total." Clearing focuses search |
| Error | Fetch rejects / 500 | Inline banner per DESIGN.md §2.10: **"We couldn't load the members list."** + **"Try again"**. No stale or partial rows. 401 variant: **"Your session has expired…"** + **"Sign in"** | Single `role="alert"` region; focus to the recovery control |
| Success | "Show more", or an export completes | Rows append in place; count updates. Export confirmation is an inline success banner **directly beneath the export button** — "Downloaded 216 member records." No toasts anywhere (A6) | Polite: "100 more members shown. Showing 200 of 216." |
| Disabled | (a) 0 rows match; (b) filters while loading; (c) nothing left to show | (a) export dimmed, label reads "Export these 0 (CSV)"; (b) selects `disabled`; (c) the Show-more button is **removed**, not disabled | Real `disabled` attribute + `aria-describedby` → "There's nothing to export with these filters." `title` is not reliably announced |

**Accessibility (screen-specific).** Search is debounced 250ms before both filtering and announcing, so the count does not fire per keystroke. Below `md:` the list is a `<ul>` of links whose accessible name composes to "Hannah, Little Fox Photography, joined 4 March 2026, both groups, listing published, newsletter yes" — badges are never bare colour or abbreviation. Filters sit in `<search aria-label="Find a member">`. Focus: after "Show more" → first newly revealed row link; after clearing → search input; returning from a record → the originating row. **NFR-010:** the list endpoint returns a *summary projection only* (id, first name, business, email, postcode, group, joined, resubmitted, directory status, newsletter state, open-request flag) — never survey answers or consent text, which load on the detail route. ~250 bytes/row ≈ 250KB at 1,000 members: a bounded set. Escape hatch, written into the code as a threshold and a comment: **above 500KB or 2,000 rows, move search and paging server-side.**

---

#### Screen S2 — Member record (`/admin/members/:memberId`)

```
+------------------------------------+  320px
| < Back to members                  |  restores list state + focus
| Member record                  h1  |
| Joined 4 Mar 2026                  |
| [Both] [Resubmission] [News: yes]  |
| [ Export this member's record ]    |
+------------------------------------+
| 1. WHO THEY ARE                h2  |
|   First name Hannah                |
|   Email      hannah@...    [copy]  |
|   Postcode   SE10 8XX              |
|   Heard via  Instagram             |
|   Private. Never published.        |
+------------------------------------+
| 2. WHAT THEY TOLD US           h2  |
|   Business questions           h3  |
|     Looking for                    |
|       Networking, New clients,     |
|       Personal Branding [retired]  |
|     Challenges right now           |
|       +------------------------+   |
|       | Finding time to market |   |  free text: plain, line breaks
|       | around the school run. |   |  kept, NO truncation, never
|       +------------------------+   |  rendered as markup
|   Events                       h3  |
|     Days that work                 |
|       Tue morning, Thu morning     |
|     How often  Monthly             |
|   Not asked                    h3  |
|     Career questions were not      |
|     shown to this member, so there |
|     is nothing to display.         |
+------------------------------------+
| 3. DIRECTORY LISTING           h2  |
|   [Published] since 12 Mar 2026    |
|   Business name                    |
|     As submitted little fox photo. |
|     As published [edited]          |
|       Little Fox Photography       |
|       Edited by ash@... 12 Mar     |
|   Category Photography (unchanged) |
|   Description  As submitted / As   |
|                published [edited]  |
|   Public enquiry contact           |
|     hello@littlefox.example        |
|     (public - not their signup     |
|      email)                        |
|   [ Open in moderation queue ]     |  A17 - the reverse link exists too
+------------------------------------+
| 4. CONSENT HISTORY             h2  |
|   Append-only. Newest first. UTC.  |
|   Now in force: [Hold: given]      |
|   [Publish: given] [News: withdrawn]
|   +------------------------------+ |
|   | NEWSLETTER . WITHDRAWN       | |
|   | v1.2 . 2026-07-22 08:02:55UTC| |
|   | via: unsubscribe link        | |
|   |  "I'd like the GPC weekly    | |
|   |   newsletter."       [copy]  | |
|   +------------------------------+ |
|   | HOLD MY DATA . GIVEN         | |
|   | v1.2 . 2026-03-04 19:41:07UTC| |
|   | via: web form (/join)        | |
|   |  "I agree that GPC Community | |
|   |   admins may hold the        | |
|   |   personal data I submit..." | |
|   +------------------------------+ |
|   [ Copy consent record ]          |
+------------------------------------+
| 5. ACTIVITY                    h2  |
|   2 Aug 2026  Re-submitted the form|
|     [ Show what they answered on   |
|       4 Mar 2026 ]                 |
|   12 Mar 2026 Listing published    |
|                by ash@...          |
|   4 Mar 2026  Joined               |
+------------------------------------+
```

**≥768px:** field pairs go two-column (~180px label column); submitted-vs-published becomes truly side-by-side under a shared field-name row. **≥1024px:** main column (sections 1–3) ~66% with a sticky right rail ~33% carrying Consent history and Activity — "what did they agree to" is why Ash opened the page and should stay on screen while she reads the answers.

**Components.** `MemberDetail`; `BackToListLink`; `RecordSection` (titled `Card`, used five times); `FieldPair` (renders **"Not answered"** in muted text — never blank, never "null", never a lone dash); `FreeTextBlock` (**no truncation, no "read more"** — a truncated free-text answer is a wrong DSAR answer; never `dangerouslySetInnerHTML`); `AnswerList` (retired options keep their historical label with a muted `retired` pill); `SubmittedVsPublished`; `ConsentHistory` (**no write path at all, by construction**); `ActivityTimeline` (acting admin on every action, NFR-013); `CopyButton` (44×44px).

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

`consent_text` is reproduced byte-for-byte from storage — the URL is already expanded there, so nothing is transformed at copy time and the link destination is part of the record. Every timestamp is the stored UTC value carrying the literal "UTC". **Name and email are deliberately absent**: the uuid identifies the record and the recipient already knows who they are, so the artefact stays safe if pasted into the wrong window. A per-row `[copy]` emits that row's block under the same three header lines. A row with no version serialises as `Version: NOT RECORDED - treat as unevidenced`.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Record loaded | All five sections; branches the member never saw render as a "Not asked" section, not as absence | `<h1 tabindex="-1">` takes focus on mount, so a screen-reader user hears "Member record" |
| Loading | Fetch in flight | Header and section skeletons (A7); export button `disabled` | `aria-busy="true"` on `<main>`; polite: "Loading member record." |
| Empty | Unreachable — a record cannot exist without identity and the `hold_data` consent that created it. Field-level absence is `FieldPair`'s "Not answered" | — | — |
| Error | 404 / 500 / 401 | 404: **"We couldn't find that member."** / "The link may be out of date, or the record may have been erased at the member's request." + **"Back to members"**. 500: **"We couldn't load this member's record."** + **"Try again"** — nothing partial renders, because a half-loaded record is worse than none when the output is a legal answer. 401 as S1 | `role="alert"`; focus to the recovery control |
| Success | Copy or export completes | Inline text beside the button — "Copied." — held 4s; export uses the §2.10 success banner beneath its button. No toasts (A6); no personal data in either string | Polite region mirrors the same words |
| Disabled | Export while the record loads, or while a previous export builds | Dimmed, genuinely inert | Real `disabled` + `aria-describedby` → "Still loading this record." |

**Accessibility (screen-specific).** `FieldPair` is `<dl>`/`<dt>`/`<dd>`, so label–value association is programmatic. Consent entries are an `<ol>`; each `<li>` opens with the summary line, so purpose, decision, version and timestamp are heard *before* the verbatim text. Timestamps are `<time datetime="2026-03-04T19:41:07Z">` with visible text ending "UTC" — spoken, not implied. The `[edited]` badge's accessible name is "Edited by an admin". Free text sits in a region labelled "Their answer, in their own words". Disclosures are `<button aria-expanded aria-controls>`. Nothing depends on hover: `SubscribersManager`'s `title`-only pills are replaced by visible text or `aria-describedby`.

---

#### Screen S3 — Export dialog (FR-013)

There is no export helper anywhere in the codebase — no download utility, no serialiser, no `Blob`. This is net-new and needs its own module and tests, because the failure mode is silently emitting a broken or over-broad file of personal data. Built on the one shared `Dialog` primitive (A14, DESIGN.md §2.9).

```
+------------------------------------+  320px
|                              [ x ] |
| Download 216 member records?   h2  |
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
| Format            (fieldset/legend)|
| (o) Spreadsheet (CSV)              |
| ( ) Data file (JSON) - for a member|
|     asking for a copy of their data|
|                                    |
| [   Download   ]  [   Cancel   ]   |
+------------------------------------+
```

Single-member variant differs only in heading — **"Download this member's record?"** — and body: "This file contains their name, email, postcode, every answer they gave, and their full consent history. This is the file to send if they've asked for a copy of their data."

**Filenames carry no personal data:** `gpc-members-2026-08-18-216-records.csv`; `gpc-member-8f2c4a1b-2026-08-18.json`. A filename appears in the Downloads shelf, in file pickers and in screen shares; it is a leak surface and is treated as one.

**Contents.** CSV: one row per member; one column per question using the question's **current published label**; identity columns; per-purpose consent columns (decision, version, UTC timestamp, capture method); multi-selects semicolon-joined in one quoted cell; retired options export their historical label; line 1 is a comment row stating the export date and the filters applied. JSON: the complete record with the append-only consent history as an array and ISO-8601 `Z` timestamps — the shape to hand a member exercising portability.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Trigger pressed | Dialog as drawn; CSV pre-selected | `role="dialog" aria-modal="true"`; `aria-labelledby` the `<h2>` and `aria-describedby` the warning paragraph so it is *spoken* on open; focus to heading; trapped; Escape closes; background `inert` |
| Loading | "Download" pressed | In-button spinner (A7); label becomes **"Building the file…"**; both buttons and both radios `disabled` | `aria-busy` on the dialog; polite: "Building the file." |
| Empty | Unreachable — the trigger is `disabled` at 0 matching rows, so an empty export cannot be requested | — | — |
| Error | Serialisation or fetch fails | Dialog stays open; inline error banner **"We couldn't build that file."** + **"Try again"**. Nothing downloads; no partial file is written | `role="alert"`; focus to "Try again" |
| Success | File written | Dialog closes; §2.10 success banner beneath the triggering button — "Downloaded 216 member records." / "Downloaded 1 member record." Never a name | Focus returns to the trigger; polite region mirrors it |
| Disabled | Trigger at 0 rows or mid-load; both dialog buttons while building | Dimmed, genuinely inert | Real `disabled` + `aria-describedby`, because `title` alone is not reliably announced |

**Accessibility (screen-specific).** No modal on this site is currently a real dialog — no role, no `aria-modal`, no trap, no Escape. That is fixed once, in the shared primitive. Format is a real `<fieldset>`/`<legend>` with two labelled radios; the JSON option's help text is tied to its radio with `aria-describedby`, not left as adjacent grey text.

---

### Journey J2 — Ash decides when to run the next networking breakfast

**Goal:** Pick a day, a slot and a cadence, and say *why* with a number, in under three minutes, without exporting anything. **This journey is the entire payback for the length of the form** — if it fails, every survey question on `/join` is unjustified collection under NFR-006.
**Persona:** Ash. Secondary: the admins she has to convince, in a WhatsApp group.
**Time:** 2–3 minutes including copying the summary out.
**Entry points:** sidebar → Insights · dashboard "Plan an event from what members told us" · Members list header link (the two screens are a pair and link to each other).
**Success criteria:** within one screenful, a *sentence* that answers the question rather than a chart to interpret · every number as an absolute count **and** a share, with the base stated per block (FR-014) · narrowable to the people who actually want that event type · every block recalculates on filter change · a paste-able summary of counts only.

```
  "We should do another networking breakfast. When?"
                 v
  /admin/insights
                 v
  RESPONSE BASE BANNER (always first, always visible)
  "Based on 216 members who have filled in the join form.
   Not everyone answered every question - each section
   says who it counted."
                 v
  FILTERS: Group [Everyone v]  Interested in [Any v]
     Ash sets "Networking breakfasts"
                 v
  Every block recalculates. Polite region:
  "Recalculated for 132 members who want networking breakfasts."
                 v
  THE ANSWER CARD
    Best slot: TUESDAY MORNING - 81 of 132 (61%)
    Then: Thursday morning 74 (56%), Friday 69 (52%)
    Base: 132 of 132 answered (100%). More than one slot
    allowed, so shares exceed 100%.
                 v
  DAY/TIME GRID  mobile: 21 ranked bars, highest first
                 md+:    7 x 3 heat grid, every cell
                         prints "81 (61%)"
                 v
  HOW OFTEN / WHAT KIND OF EVENT / WHAT THEY'RE ASKING FOR
                 v
  [ Copy summary ] -> plain text, counts only:
  "GPC insights, 18 Aug 2026. Filter: everyone who wants
   networking breakfasts (132 of 216 members). Best slot:
   Tuesday morning, 81 of 132 (61%). Then Thursday morning
   74 (56%), Friday morning 69 (52%). Preferred frequency:
   monthly, 68 of 132 (52%). Top asks: networking (98, 74%),
   new clients (81, 61%)."
                 v
  Ash pastes it into the admin group and books
  Tuesday morning, monthly.
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

**Drop-off notes.** *(a) The chart that isn't an answer:* the obvious build is a page of charts, and the obvious outcome is that Ash looks once, cannot turn it into a decision, and goes back to guessing. The answer card is the requirement, not decoration — if it is cut for scope, FR-014 has not been delivered whatever else ships. *(b) The average-of-everyone trap:* without the "Interested in" cross-filter the top slot is the best slot for the whole membership, dominated by whichever branch is most numerous, and Ash books a breakfast the breakfast-wanters cannot attend. *(c) Small-base overconfidence:* six people agreeing looks identical to sixty once it is a percentage, so the under-10 caution card is load-bearing — without it the screen manufactures false confidence, which is worse than no screen. *(d) The grid at 320px:* seven columns leave ~40px each, which cannot carry a readable number, so mobile gets the ranked bar list — strictly better for "which slot wins?" and the same data. The ranked list stays available at every width behind a disclosure, so nobody has to read colour to get the answer.

---

#### Screen S4 — Insights (`/admin/insights`)

```
+------------------------------------+  320px
| Insights                       h1  |
| What members told us on the join   |
| form, so events can be planned     |
| from evidence, not guesswork.      |
| [ Back to members ]                |
+------------------------------------+
| Based on 216 members who have      |  RESPONSE BASE BANNER
| filled in the join form. Not       |  always first, always visible
| everyone answered every question - |
| each section says who it counted.  |
+------------------------------------+
| Group         [ Everyone      v ]  |  sticky filters
| Interested in [ Any event type v ] |
| 132 of 216 members match           |
| [ Clear filters ]                  |
+------------------------------------+
| When to run it                 h2  |
| +================================+ |
| | BEST SLOT                      | |
| | Tuesday morning                | |  30px display, --color-dark
| | 81 of 132 (61%)                | |
| | Then Thursday morning 74 (56%) | |
| |      Friday morning   69 (52%) | |
| | Base: 132 of 132 answered      | |
| | (100%). Members could pick more| |
| | than one slot, so shares add up| |
| | to more than 100%.             | |
| +================================+ |
| All 21 slots (ranked)          h3  |
| Tuesday morning                    |
| [##################----]  81 (61%) |
| Thursday morning                   |
| [#################-----]  74 (56%) |
| ...                                |
| Sunday evening                     |
| [#---------------------]   4 ( 3%) |
| [ See these members -> ]           |
+------------------------------------+
| How often they want events     h2  |
| Monthly     68 (52%)  [#######--]  |
| Fortnightly 31 (23%)  [###------]  |
| Quarterly   22 (17%)  [##-------]  |
| Weekly      11 ( 8%)  [#--------]  |
| Base: 132 of 132 (100%). One       |
| answer each, so these add to 100%. |
+------------------------------------+
| What kind of event             h2  |
| What they're asking for        h2  |
|   Business branch h3 / Career h3   |
|   (each panel states its own base) |
+------------------------------------+
| [   Copy summary   ]               |
| Counts only. No names, no emails.  |
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

**Heat ramp.** Six steps banded on each cell's share of the maximum cell. This ramp is specific to this grid and is not a DESIGN.md token set; every step's printed number clears AA against its own background: L0 (0 responses) `#6b7280` on `#ffffff` 4.83:1 · L1 (1–20%) `#1a1a2e` on `#f4effa` 15.09:1 · L2 (21–40%) `#1a1a2e` on `#e9def7` 13.20:1 · L3 (41–60%) `#1a1a2e` on `#cbb6e8` 9.26:1 · L4 (61–80%) `#ffffff` on `#6d5296` 6.37:1 · L5 (81–100%) `#ffffff` on `#2d1b4e` 15.24:1. The text colour flips between L3 and L4, and no step may sit in the luminance band between them, which is where a 3-point-something near-miss lives.

**The "best cell" outline is `#fc16a0` drawn on the L5 background `#2d1b4e` — ≈4.0:1, which clears the 3:1 non-text threshold (WCAG 1.4.11) for that pairing.** The 3.64:1 figure in DESIGN.md §3.1 is `#fc16a0` against *white* and is the wrong comparison here, because this outline never renders on white. Bars use `#fc16a0` fill on `#f4effa` track (3.22:1, non-text) and carry no text inside them. **Colour is never the only carrier:** every cell prints its count and share as text, and the best cell also carries the word "Best".

**Labels come from the published form configuration, never a hard-coded list.** Insights reads every question label, option label and the three slot names from the currently *published* form config (per A4's draft→publish model), so an FR-008 rename propagates here without a code change and a retired option keeps the historical label it was answered under. There is no `SLOT_LABELS` constant anywhere in this feature; if the published config has not yet named the three slots, the block renders the config's raw option labels rather than inventing "Morning / Afternoon / Evening".

**Components.** `InsightsPage`; `ResponseBaseBanner`; `InsightsFilters` (two labelled selects, live match count, "Clear filters"); `AnswerCard`; `SlotHeatGrid` (a real `<table>` with `<caption>`, `scope="col"` days, `scope="row"` slots); `RankedBarList` (reused for slots, event types, frequency and both branch panels); `InsightBlock`; `BaseLine` — **never optional: a block without a base line must not render**; `SmallBaseCaution`; `CopySummaryButton`; shared `Spinner` (A7).

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Aggregates loaded, base ≥10 | Banner, filters, answer card, grid/bars, frequency, event types, both branch panels, copy button | Polite: "Showing insights for 216 members." |
| Loading | Initial fetch, or a filter change needing a refetch | Banner and filters stay (filters `disabled`, dimmed, never hidden); blocks become skeletons of the same height, so the page does not jump | `aria-busy` on the results region; polite: "Recalculating." |
| Empty | Zero members: banner reads "No one has filled in the join form yet." + **"There's nothing to summarise yet. As soon as members start joining, this page will tell you when to run things."** Filters and Copy disabled. Filtered to zero: the J2 row above; blocks suppressed, never rows of zeros | — | Polite region announces once; focus to "Clear filters" in the filtered case |
| Caution | Filtered base 1–9 | `AnswerCard` replaced by `SmallBaseCaution` (copy in J2); grid and blocks still render with their bases | `role="status"`, **not** `alert` — information, not a failure |
| Error | Aggregate fetch rejects | **"We couldn't load the insights."** + **"Try again"**. 401: **"Your session has expired. Sign in again to see insights."** + **"Sign in"** | `role="alert"`; focus to the recovery control |
| Success | Copy summary pressed | Inline confirmation beside the button, held 4s: **"Summary copied. It contains counts only — no names or emails."** No toast (A6) | Polite region mirrors the same words |
| Disabled | Copy while loading or at base 0; filters while loading | Dimmed, genuinely inert | Real `disabled` + `aria-describedby` → "There's nothing to copy yet." |

**Accessibility (screen-specific).** The heat grid is a data table, navigable cell by cell with headers announced: "Tuesday, Morning, 81, 61 percent, best". Bars are `aria-hidden` decoration — the count and share beside them are the content. Base lines and the multi-select caveat are real text inside the block, never a `title` and never a footnote elsewhere, so a screen-reader user is not left wondering why shares exceed 100%. Filter changes announce once, debounced, through the page's single polite region (A13); filters never steal focus. Heat cells are ≥48px tall at `md:` and form a single tab stop in browse mode.

**Error-message bounding (all four screens).** An error card always shows our own fixed sentence. A server message is appended on a second muted line only when it belongs to our own known error set, truncated to 120 characters and rendered as plain text — never markup, never a raw stack or database string.

---

## Notes for architecture

- The **"Interested in" cross-filter exceeds FR-014**, which names only a group filter. It is what turns J2 from a chart page into a decision. Needs PM confirmation; if cut, the answer card must say plainly that it is the best slot for *everyone*, not for the event being planned.
- **Erased members are unfindable by design.** FR-023 keeps only a non-identifying erasure record, so Ash cannot confirm an erasure happened. Either standardise the reply wording, or keep a one-way hash of the email in the erasure record — itself processing, and disclosable under FR-024.
- **Single-member export format is undecided.** FR-013 says "a portable format"; this section offers CSV and JSON with JSON recommended. Confirm whether a member-facing copy should be a rendered PDF, as many DSAR responses in practice are.
- **The three time-slot labels do not exist yet** in the extracted form inventory. Insights reads them from the published config, so this is a form-config authoring task, not a code change.
- **Whether the list should show email at all.** It does here, because search is by email and Ash must confirm identity — but that is up to 100 addresses on screen in a café. Alternative: reveal it in the list only when the search term matched it. Relates to deferred FR-D05.
- **Addendum Q7 (last name)** changes the Member column and the search behaviour if it resolves toward collecting one; "Sarah" is not an identifier at 1,000 records.
- **Nothing states a retention expectation for an exported file** once it is on Ash's laptop. The dialog's "delete it when you're done with it" is the only control; more than an instruction would be a new requirement.


---

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
| **1–3 published listings** | Real cards render, followed by a dashed-border `JoinInvitationCard` in the last grid cell: "Is your business missing? / Any GPC member who runs a business can be listed, free." + Button → `/join`. No apology, no "coming soon" banner. | The grid never looks broken at N=1. |
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


---

## 7. Data rights, errors and edge cases

**Owns:** FR-023 (withdrawal), **FR-024 (`/privacy` content — gates launch)**, NFR-005 (20-working-day
deadline), NFR-011 (partial-failure safety); and for the whole feature: the consolidated error
catalogue (§7.10), the single interaction & animation contract (§7.11), and the shared admin
dashboard (§7.9). Tokens, contrast pairs, `Button`/`Badge`/`Dialog`/banner/skeleton specs are fixed
in `DESIGN.md` §1–§2 and the WCAG contract in `DESIGN.md` §3 — referenced here, never restated.

### 7.1 The three withdrawals, and the identity model

| # | Purpose | Withdrawing it does | Reversible |
|---|---|---|---|
| 1 | Publish my business in the directory | Listing unpublished. Member record, survey answers, newsletter untouched. | Yes, via `/join` |
| 2 | Send me the newsletter | `unsubscribed_at` set. Listing and record untouched. | Yes |
| 3 | Hold my personal data at all | Full erasure: record, listing, answers, consent detail. Only a tombstone remains. | **No** |

Purpose 3 is the withdrawal of the FR-004(a) consent everything else rests on, so withdrawing it
*is* erasure and the UI says so in those words. Each control acts on exactly one purpose: no
"unsubscribe from everything" shortcut, no cascade. Each withdrawal appends a new consent row
citing the version she originally saw (FR-004); the original grant stays visible to admins.

**Identity without login.** There is no member account and this release adds none, so a form that
acted on a typed email address would be three vulnerabilities at once: **enumeration** (confirming
a named woman belongs to a Greenwich parents' group is a safety issue before a compliance one),
**griefing** (anyone could unlist a competitor or erase a member in ten seconds), and
**mail-bombing**. The model, in five rules:

1. **An email address only ever causes an email to be sent. It never causes a change.**
2. Two token types, with different powers:

| Token | Source | Lifetime | Uses | Authorises |
|---|---|---|---|---|
| **Mail token** | Footer of every GPC email (A18) | Rotates each send | Many | One-click unsubscribe; pre-filling the address on D-1. **Nothing else** |
| **Request token** | Emailed on demand from D-1 | **60 min** | **Single use** | The request centre (D-3): unlist, unsubscribe, erase |

3. **D-1's response is constant** — same copy, same screen, same status, padded to a fixed time
   floor (≈600ms) — for a known address, an unknown one, a rate-limited request and a honeypot
   trip. Unknown addresses receive no email.
4. **Erasure is never a same-session irreversible act:** a second confirm step, a
   "This wasn't me — cancel it" email that works until the erase runs, and an admin action.
5. **The verified page shows only what the inbox owner already knows:** first name, business name,
   listing status, which consents are on. Never postcode, survey answers, full email, or admin
   notes. A leaked token must not become a data export.

**New components this section adds** (everything else is `DESIGN.md` §2): `RightsCallout` (the
`/privacy` rights block, reused on the `/join` confirmation), `EmailChip` (masked read-only
address), `CooldownButton` (60s resend + its announcement), `ConsentCard` (one per purpose, owns
its inline confirm), `DeadlinePill` (**the NFR-005 single source of truth** — the queue, the detail
view and the dashboard tile must not be able to disagree), `DeletionManifest` (counts first, values
behind a disclosure), `StatTile`, `ActivityLog` (shared with moderation history, NFR-013).

### Journey J1 — Bea takes her listing out of the directory

**Goal:** remove her business from the public directory without losing her membership, her
newsletter, or her place in the community — and without emailing an admin and waiting.
**Persona:** Bea (Business Mum); Ash actions it. **Time:** member 2–4 min across two sittings
(the email round-trip); admin under 1 min.
**Entry points:** (1) the "Manage your data or unsubscribe" footer of any GPC email → `/my-data?t=`
with the address pre-filled; (2) `/privacy` → the "Your data, your call" block; (3) `/my-data`
direct, which must work cold because the URL gets pasted between members.
**Success criteria:** the listing is gone from every public read within one cache cycle of the
admin action; newsletter state is byte-identical before and after; record, answers and consent
history retained; the ledger gains exactly one withdrawal row citing the original version; she gets
one confirmation email; the queue shows the request complete with acting admin and UTC timestamp
(NFR-013).

```
  GPC email footer: "Manage your data or unsubscribe"
              │                    ┌─────────────────────────────┐
              ▼                    │ ALT: /privacy → "Your data,  │
  ┌───────────────────────────┐◄───┤ your call" block → /my-data  │
  │ D-1  /my-data             │    └─────────────────────────────┘
  │ address pre-filled+masked │
  │ [ Email me a secure link ]│
  └────────────┬──────────────┘  POST — constant response, constant time
               ▼
  ┌───────────────────────────┐   Never says whether the address is known
  │ D-2  "Check your inbox"   │   ── EMAIL 1: the 60-min single-use link
  └────────────┬──────────────┘
               ▼  she taps the link in her inbox
  ┌───────────────────────────┐
  │ D-3  /my-data/manage      │  Listing  [Take my listing down] ◄── chooses
  │ "Hi Bea — what would you  │  News'r   [Stop sending it]
  │  like to change?"         │  ─── Or leave completely ───
  └────────────┬──────────────┘  Delete  [Delete everything you hold]
               ▼  inline confirm inside the card (reversible → no modal)
  ┌───────────────────────────┐
  │ D-5  /my-data/done        │ ── EMAIL 2: "We've got your request"
  │ "We've got it." + a date  │    incl. "This wasn't me — cancel it"
  └────────────┬──────────────┘
               ▼  visible in the admin panel within one page load (NFR-005)
  ┌───────────────────────────┐   ┌──────────────────────────────────┐
  │ D-6 /admin/data-requests  │──►│ D-7 [ Unpublish the listing ]    │
  │ "Unlist · Bea's Baby      │   │ → request auto-marked Complete   │
  │  Massage · due Tue 15 Sep"│   │ → moderation log row written     │
  └───────────────────────────┘   └───────────────┬──────────────────┘
                                                  ▼ EMAIL 3: "Your listing is down"
        Listing gone from the directory. Record, answers, newsletter unchanged.
```

| Trigger | Display | Recovery |
|---|---|---|
| Arrives cold at `/my-data` | Empty field, "Your email address", hint "The address you signed up with." | Types it; `autocomplete="email"`, `inputmode="email"` |
| Arrives with a mail token | Read-only `EmailChip` `b••••@gmail.com` + text button "Not you? Use a different address" | Button clears the chip, reveals the field, moves focus into it |
| Address is not one GPC holds | **Identical** D-2. No email sent. D-2 carries "If you're not sure which address you used, try the other one." | None — by design |
| Link tapped after 60 min, or a second time | D-1 with a warning banner: *"That link has expired — they only last an hour. Pop your email in and we'll send a fresh one."* (used: *"…has already been used. Here's a fresh one."*) | Address pre-filled from the token's claim; focus lands on the submit button |
| She has no listing | Listing card **Empty**: *"You're not in the directory. If you'd like to be, you can ask on the join form."* Button absent, not disabled | Other cards behave normally |
| Listing is pending or held | Status reads "Pending"; button becomes *"Withdraw my request"*; body: *"It hasn't gone live, so nothing of yours is public right now."* | Admin action is "Cancel the pending listing" |
| She hesitates at the confirm | Card expands inline: *"Take your listing down?"* / *"It'll come off the directory. Your membership and your newsletter stay exactly as they are."* → `Yes, take it down` / `Keep it up` | "Keep it up" collapses it and returns focus to the opening button |
| She wants two things | D-3 does not navigate away. The actioned card collapses to *"Requested — we've emailed you the details."*; other cards stay live for the rest of the 60 minutes | "I'm done for now" → D-5 |
| POST fails | E-01/E-02 inside the card; nothing marked done; button returns to its resting label | Retry reuses the idempotency key (A19), so a retry cannot create two requests |
| She didn't make the request | Email 2's *"This wasn't me — cancel it"* → `/my-data/cancel?t=` → D-5 **Cancelled** | Request voided, queue row shows `Cancelled by member`, nothing changed |

**Drop-off.** The email round-trip is the biggest loss point and a deliberate cost. Mitigations that
do not remove it: D-2 names the subject line (*"Look for 'Manage your GPC data'"*) so she can
search rather than scroll; the 60-minute expiry is generous on purpose (15 minutes would strand
people at bedtime); the mail-token entry removes the typing step entirely for the majority who
arrive from an email. Second risk, **misdirected intent** — someone who came from a newsletter
footer acting on the listing card because it is first: the card matching the token's `intent` hint
is ordered first with a `ring-2 ring-primary` marker; ordering is a hint, never a pre-selection.
Third, **fear of the erasure card**: it is last, below a rule, under "Or leave completely", and both
reversible cards state what they do *not* touch. There is deliberately **no retention interstitial,
no "are you sure you want to leave?", no pause-instead-of-leave** — friction applied specifically to
a withdrawal is a dark pattern and would undermine the compliance claim this feature exists to make.

### Journey J2 — A member asks for full erasure

**Goal:** delete everything GPC holds, and be able to trust it happened, without chasing anyone.
**Persona:** most often Carla (Career Mum) making a clean exit; occasionally someone in a
safeguarding-adjacent situation for whom it is urgent. Ash executes; Aster is accountable for the
20-working-day commitment. **Time:** member 3–5 min including the round-trip; admin 2–3 min, most of
it reading what is about to be destroyed. **Entry points:** identical to J1 — there is deliberately
**no separate "delete me" URL**, so the reversible options are always seen first.
**Success criteria:** visible in the admin panel within one page load (NFR-005); completable in one
workflow with no database access; afterwards no record, listing, answers, consent detail or
newsletter row exists; the completion email is sent **before** the delete commits; received and
completed dates are stored, feeding the ≤20-working-day metric.

```
  D-1 → D-2 (identical to J1)  ──►  D-3  ─── Or leave completely ───
                                          [ Delete everything you hold ]
                                                       │ opens the Dialog (DESIGN.md §2.9)
                                                       ▼
  ┌────────────────────────────────────────────────────────────────┐
  │ D-4  · itemised "we'll delete"  · itemised "we'll keep"        │
  │      · [ ] I understand this can't be undone                   │
  │      · [ Yes, delete everything ]  disabled until ticked       │
  └───────────────────────────┬────────────────────────────────────┘
                              ▼
  ┌───────────────────────────────────┐ ── EMAIL 2b, incl. a cancel link that
  │ D-5  "We've got it. We'll delete  │    works right up until the erase runs
  │  everything by <date>."           │    Token burned here; D-3 unreachable
  └───────────────┬───────────────────┘
                  ▼  erasure rows sort above unlist rows in D-6
  ┌───────────────────────────────────────────────────────────────┐
  │ D-7  1. Review what will be deleted   (counts, not raw PII)   │
  │      2. Type the member's email        (admin-side confirm)   │
  │      3. [ Erase this member ] → send EMAIL 3b FIRST,          │
  │                                 then commit the delete        │
  └───────────────────────────────────────────────────────────────┘
        Tombstone written. Request row: "Completed <date> by <admin>."
```

| Trigger | Display | Recovery |
|---|---|---|
| She has a published listing | D-4 names it first, then offers the narrower option **once**, neutrally: *"If you only want the listing gone, close this and use 'Take my listing down' instead."* | Close returns to D-3, focus restored to the erasure button |
| Nothing ticked | Button `disabled` + `aria-disabled`; the hint *"Tick the box above to continue"* is in its accessible description from the start | Ticking enables it; the polite region says *"Delete button is now available."* |
| Escape / backdrop | Dialog closes, nothing sent, focus returns to the trigger | Nothing lost |
| POST fails | E-01/E-02 **inside** the dialog; it stays open, checkbox stays ticked | Retry — idempotency key prevents duplicates |
| Cancels before the admin acts | D-5 **Cancelled**: *"Nothing has been deleted and nothing has changed."* | Queue row → `Cancelled by member`, retained for evidence |
| Cancels **after** the erase | D-5 **Too late**: *"This request was completed on Mon 8 September, so there's nothing left to cancel. If you didn't ask for it, please email us at gpc.communitynews@gmail.com."* | Human path only. This is the residual risk, stated rather than hidden |
| Admin opens an already-erased request | D-7 **Empty**: *"There's nothing left to delete — this member's data has already been removed."* Destructive control absent from the DOM | `Mark this request complete` |
| Completion email fails | Erase does **not** proceed (see §7.8) | Retry the send, or "Erase without emailing" with a typed reason recorded on the tombstone |
| Deadline near / passed | `DeadlinePill` amber at ≤5 working days, red past due; overdue sorts first; the dashboard tile takes the same state | Nothing auto-escalates — no channel exists (see Notes) |

**Drop-off.** Erasure inverts the usual funnel: abandonment is not automatically a bad outcome, but
it must never be caused by confusion. The failure to avoid is a member who only wanted to be
unlisted clicking erasure because it looked like the clearest button — hence last, quieter, behind a
dialog, one tick, and the narrower alternative offered once. The mirror failure is a member who
*does* want erasure being worn down by ceremony until she gives up, turning a self-service right
into an unanswered email — hence exactly two taps and one tick, never a typed word, and copy that
never argues with her. She has no account and cannot check status, so D-5 and the email both state
a **date** computed from working days, not "soon": *"We'll have this done by Tuesday 15 September at
the latest, and usually much sooner."* Honest residual risk: **a stolen inbox is a completed
erasure**, and an attacker with inbox access will delete the warning email too.

### 7.2 Transactional email copy

Every email carries, per FR-021 and **A18**: the controller identity ("Greenwich Parents & Carers
CIC, company 16387545. Data controller: Aster Thackery."), a link to
`greenwichparentsandcarers.co.uk/privacy`, and the mail-token link **"Manage your data or
unsubscribe"**. *"Just reply to this email"* is never used — it reinstates the email-an-admin-and-wait
loop FR-023 exists to remove.

| Email | Subject | Load-bearing line |
|---|---|---|
| 1 — secure link (only if the address is known) | Manage your GPC data | "It works once, and it stops working in an hour. If it wasn't you, you can ignore this email — nothing has changed and nothing will." |
| 2a — unlist requested | We've got your request | "We'll do that shortly, and by **Tuesday 15 September** at the very latest. Your membership and your newsletter aren't affected." + **[ This wasn't me — cancel it ]** |
| 2b — erasure requested | We've got your request | "That means your membership record, your answers to the join form, your directory listing and your newsletter subscription. Once it's done we can't get any of it back." + cancel link, live until the erase runs |
| 3a — listing down | Your listing is down | "Anyone with the old link will see a note saying it's no longer listed. You're still a member and your newsletter is unchanged." |
| 3b — erasure complete | Everything's been deleted | "We've kept one thing, and only one: a dated note that a deletion request was made and completed, with no name or email in it. This is the last email you'll get from us." |

#### Screen D-0 — `/privacy` (FR-024) — **content specification; this gates launch**

The page must be written and published **before `/join` accepts its first submission**: FR-004's
consent copy links here, and a stored consent record that cites a page which does not yet say these
things is not evidence. Content is the controller's to write; the IA and the required headings are
fixed here. One `<h1>` ("How we handle your data"), then these `<h2>`s **in this order**:

| # | Required `<h2>` | Must contain |
|---|---|---|
| 1 | Who we are | Controller identity and company number; `gpc.communitynews@gmail.com` as the contact |
| 2 | What we collect when you join | **Every** category the form gathers, one row each: name, email, postcode, household/children, group and branch answers, the three free-text survey answers, business details, plus technical data (IP and timestamp, kept for FR-006 rate limiting) and **the mail token** — a persistent per-member identifier embedded in every outbound email, with its rotation policy |
| 3 | What goes on the public directory, and what never does | Two lists, **string-identical to the `DESIGN.md` §2.8 disclosure panel on `/join`**. If the two ever diverge, the panel is the promise and the page is the breach |
| 4 | Why we're allowed to hold it | Lawful basis per purpose: consent for directory publication, consent for the newsletter, and the FR-004(a) consent to hold the record at all |
| 5 | How long we keep it | The retention period. **BLOCKING: `«RETENTION_PERIOD»` (open question Q8) must be a real figure here before launch, because the identical string is stored verbatim in every consent record** |
| 6 | Your data, your call | The `RightsCallout` block (below) — the rights entry point, not a paragraph about rights |
| 7 | Who else sees it | Processor list, one row each, with what it holds and where: Supabase (database + hosting region), Brevo (newsletter delivery), the site host, and the shared Google mailbox |
| 8 | Cookies and what we measure | If nothing beyond essential, one sentence saying exactly that |
| 9 | If you're not happy | The ICO complaint route, plus the contact address again |

```
┌──────────────────────────────────────┐
│ ⚙  Your data, your call         h2   │  RightsCallout, Card p-6
│                                      │  2px primary/30 border
│ You can take your directory listing  │
│ down, stop the newsletter, or ask us │
│ to delete everything we hold —       │
│ whenever you like, without emailing  │
│ anyone.                              │
│ ┌──────────────────────────────────┐ │
│ │        Manage my data            │ │  48px, real <a href="/my-data">
│ └──────────────────────────────────┘ │
│ We'll email you a link to make sure  │
│ it's you. We aim to action every     │
│ request within 20 working days.      │
└──────────────────────────────────────┘
```

**Wider viewports:** capped at `max-w-2xl` inside the existing prose column; the button becomes
`inline-flex` at its natural width. No two-column treatment — it would separate the promise from the
button.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Page load | As wireframed | `<section aria-labelledby>`; the button is a real `<a>`, so middle-click and open-in-new-tab work |
| Loading / Empty / Error / Success | N/A — authored static content, nothing fetches and nothing completes here | — | — |
| Disabled | **N/A by design.** Even when the join form is closed (FR-009), data rights stay available | — | — |

#### Screen D-1 — `/my-data` — start a request

Takes an email address and causes an email to be sent. Nothing else; this screen must be incapable
of changing a member's data. **In:** email footer (mail token), D-0, direct URL, expired-token
redirect. **Out:** D-2, always, whatever the outcome.

```
┌──────────────────────────────────────┐
│  Your data, your call           h1   │
│  Take your listing down, stop the    │
│  newsletter, or ask us to delete     │
│  everything. Nothing changes until   │
│  you confirm from a link we email.   │
│ ┌──────────────────────────────────┐ │
│ │ 🕐 That link has expired — they  │ │  warning banner, if any
│ │    only last an hour. Pop your   │ │  DESIGN.md §2.10
│ │    email in for a fresh one.     │ │
│ └──────────────────────────────────┘ │
│  Your email address *                │  <label for>
│ ┌──────────────────────────────────┐ │
│ │ you@example.com                  │ │  44px min
│ └──────────────────────────────────┘ │
│  The address you signed up with.     │  hint, aria-describedby
│  [ honeypot "Company" — off-screen ] │  tabindex -1, aria-hidden
│ ┌──────────────────────────────────┐ │
│ │     Email me a secure link       │ │  48px primary
│ └──────────────────────────────────┘ │
│ 🛈 We never say whether an address   │  info banner, NOT live
│   is on our list. That keeps         │
│   everyone's membership private,     │
│   including yours.                   │
│  How we handle your data →           │
└──────────────────────────────────────┘
```

**Mail-token variant:** the input is replaced by a read-only `EmailChip` `✉ b••••@gmail.com` plus a
"Not you? Use a different address" text button (44px hit area).
**Wider viewports:** `max-w-xl` centred, button auto-width and left-aligned. Deliberately narrow at
every size — it is one field.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Load, no token or a valid mail token | Field empty or chip-filled | `<form noValidate>`; `htmlFor`/`id` pairing (the site has none today — NFR-008 forbids inheriting that) |
| Loading | Submit in flight | Button label → "Sending…", `disabled`, in-button `Spinner` (A7); the field becomes `readonly`, **not** `disabled`, so its value is still submitted and still in the accessibility tree | The page's one polite region: "Sending your request" |
| Empty | N/A — one field, no collection | — | — |
| Error | Blank/malformed address, or E-01–E-03 | Field error under the input; submission-level errors in the banner **above the submit button** | `aria-invalid`, `aria-describedby="hint error"`; the page's one alert region |
| Success | 200, **or** rate-limited, **or** address unknown — all identical | Route change to D-2, no reload | Focus to D-2's `<h1>` (`tabIndex={-1}`, removed on blur) |
| Disabled | While Loading | 60% opacity; disabled label contrast still ≥4.5:1 — never translucent white | `aria-disabled` alongside `disabled`, so AT still announces it |

**Accessibility (non-obvious only).** The honeypot is hidden with `position:absolute; left:-9999px`
— **never** `display:none` or `hidden`, which sophisticated bots skip — and excluded from AT by
`aria-hidden` + `tabindex="-1"`, so a screen-reader user is never tricked into filling it. Its name
is non-credential-shaped (`company_website_2`, `autocomplete="off"`) so password managers do not
autofill it. The reassurance callout is ordinary content, not a live region. This page is reached
straight from an email, so it relies on the **existing** site skip link (`Layout.jsx:8-10`) — do not
add a second; do fix its `focus:` → `focus-visible:` and repaint it on `--color-primary-700`.

#### Screen D-2 — `/my-data` — "Check your inbox"

The screen that must be indistinguishable for a known address, an unknown one, a rate-limited
request and a honeypot trip. **Out:** the member's mail client; "Send another link" → D-1.

```
┌──────────────────────────────────────┐
│           ✉                          │  56px, decorative, aria-hidden
│  Check your inbox               h1   │
│  If b••••@gmail.com is on our list,  │
│  we've just emailed it a link.       │
│ ┌──────────────────────────────────┐ │
│ │ Look for the subject line        │ │
│ │ "Manage your GPC data". The link │ │
│ │ works once and stops working in  │ │
│ │ an hour.                         │ │
│ └──────────────────────────────────┘ │
│  Nothing has changed yet. Nothing    │
│  will until you use that link.       │
│  Not arrived? Check your spam, or:   │
│ ┌──────────────────────────────────┐ │
│ │   Send another link  (0:47)      │ │  CooldownButton, 60s
│ └──────────────────────────────────┘ │
│  Used a different email address?     │
│  Start again →                       │
└──────────────────────────────────────┘
```

The masked address is safe to echo: it is the string she just typed, not a lookup result.
**Wider viewports:** same single column at `max-w-xl`; no layout change.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Arrival from D-1 | As wireframed, resend in cooldown | Polite region announces the heading sentence once on mount; focus on `<h1>` |
| Loading | Resend pressed | "Sending…", in-button spinner | Polite: "Sending another link" |
| Empty | N/A — no collection rendered | — | — |
| Error | Resend fails | Error banner above the button: *"We couldn't send that. Have a look at your connection and try again."* | Alert region; focus to the banner |
| Success | Resend succeeds | Success banner: *"Sent again. Give it a minute to arrive."*; cooldown restarts | Polite |
| Disabled | Cooldown active | Label *"Send another link (0:47)"* | `aria-disabled`. **The countdown is not in a live region** — it would announce every second. The accessible name updates only at 60/30/10/0s; at 0s the polite region says "You can send another link now." |

#### Screen D-3 — `/my-data/manage` — verified request centre

The one screen where FR-023 is exercised. **In:** the request-token link in Email 1, and nothing
else — a direct visit without a valid token redirects to D-1 with the expired notice.

```
┌──────────────────────────────────────┐
│ Hi Bea — what would you like    h1   │
│ to change?                           │
│ ┌──────────────────────────────────┐ │
│ │ ✓ It's you. This page works for  │ │  success banner
│ │   the next 60 minutes.           │ │
│ └──────────────────────────────────┘ │
│ ┌─ ConsentCard ────────────────────┐ │
│ │ 📣 Your directory listing    h2  │ │
│ │ Bea's Baby Massage  [Published]  │ │  Badge, DESIGN.md §2.7
│ │ Taking it down removes it from   │ │
│ │ the public directory. Your       │ │
│ │ membership and your newsletter   │ │
│ │ stay exactly as they are.        │ │
│ │ [    Take my listing down    ]   │ │
│ └──────────────────────────────────┘ │
│ ┌─ ConsentCard ────────────────────┐ │
│ │ ✉ The GPC newsletter  [Subscribed]│ │
│ │ Stopping the newsletter doesn't  │ │
│ │ affect your listing or your      │ │
│ │ membership.                      │ │
│ │ [ Stop sending the newsletter ]  │ │
│ └──────────────────────────────────┘ │
│ ────────────────────────────────────  │
│ Or leave completely             h2   │
│ ┌─ ConsentCard (error border) ─────┐ │
│ │ 🗑 Delete everything             │ │
│ │ We'll delete your membership     │ │
│ │ record, your answers, your       │ │
│ │ listing and your newsletter.     │ │
│ │ This can't be undone.            │ │
│ │ [ Delete everything you hold ]   │ │  destructive, §2.3
│ └──────────────────────────────────┘ │
│ [        I'm done for now        ]   │
└──────────────────────────────────────┘
```

**Wider viewports:** cards stay a **single column** at `max-w-2xl` — a three-across row makes the
destructive card look like a peer of the other two, which is exactly J2's drop-off failure. Only
padding and button width change.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Valid token, snapshot loaded | Three cards at rest | Focus to `<h1>` on mount; each card `<section aria-labelledby>` |
| Loading | Token validating / snapshot fetching | Three card-shaped skeletons (`DESIGN.md` §2.12), **no spinner** — the shape of the answer is known | Skeletons `aria-hidden`; polite region carries "Loading your details" |
| Empty | No listing and no subscription | Listing card: *"You're not in the directory. If you'd like to be, you can ask on the join form."*; newsletter card: *"You're not subscribed."* Neither renders a button. Erasure card unaffected | Headings still render so page structure is stable |
| Error | Snapshot fetch fails | Full-width error banner: *"We couldn't load your details just now. Your link still works — try again."* + Retry | Alert region; focus to the banner |
| Success | An action has been requested | That card collapses to *"Requested — we've emailed you the details."*, button removed. **Other cards stay live** | Polite: "Request received. We've emailed you the details."; focus to the completed card |
| Disabled | An action in flight | That card's button only — other cards are **not** disabled; she may queue two requests | `aria-disabled` on the in-flight button |

**Accessibility (non-obvious only).** Each card's body names what the action does *not* affect —
that is the FR-023 guarantee made audible, not decoration. The destructive card is last in **DOM
order** as well as visually. Escape closes an inline confirm as well as the dialog. Heading order:
`<h1>` page, `<h2>` per card, "Or leave completely" `<h2>` with the erasure card's title `<h3>`
beneath it — no level skipped.

#### Screen D-4 — erasure confirmation dialog

The last reversible moment. Built on the one `Dialog` primitive (`DESIGN.md` §2.9, adjudication
A14) — bottom sheet ≤768px, centred `max-w-lg` above.

```
┌──────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓ backdrop 55% ▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│ ┌──────────────────────────────[✕]─┐ │  44×44, "Close without deleting"
│ │ Delete everything?           h2  │ │
│ │ We'll delete:                    │ │
│ │  • Your membership record        │ │  real <ul> — item counts
│ │  • Your answers to the join form │ │  are announced
│ │  • Your listing, Bea's Baby      │ │
│ │    Massage                       │ │
│ │  • Your newsletter subscription  │ │
│ │ We'll keep one thing:            │ │
│ │  • A dated note that a deletion  │ │
│ │    was asked for and done, with  │ │
│ │    no name or email in it.       │ │
│ │ This can't be undone.            │ │  bold + in the a11y description,
│ │ ┌──────────────────────────────┐ │ │  never colour alone
│ │ │☐ I understand this can't be  │ │ │  44px row
│ │ │  undone.                     │ │ │
│ │ └──────────────────────────────┘ │ │
│ │ [   Yes, delete everything   ]   │ │  destructive, disabled
│ │ [   Cancel                   ]   │ │  until ticked
│ │ Only want the listing gone?      │ │
│ │ Close this and use "Take my      │ │
│ │ listing down" instead.           │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

The checkbox and both buttons must remain visible without scrolling at 320×568; if the list
overflows, **the list scrolls, not the footer**. **Why a checkbox and not a typed word:** typing
`DELETE` on a phone at night is a motor and cognitive tax on someone exercising a legal right —
precisely the "ceremony that wears her down" failure in J2. The admin side (D-7) *does* use a typed
confirmation, because there the risk inverts: Ash is acting on someone else's data, on a laptop, and
the mistake is unrecoverable for a third party.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Opened | Unticked, primary disabled | Focus to the `<h2>`, **never** to the destructive button; `aria-describedby` → the "we'll delete" list |
| Loading | Confirm pressed | Label → *"Sending your request…"* (honest: the request is being sent, not the delete run); checkbox, Cancel, close disabled; Escape suppressed | Dialog-scoped polite announcement |
| Empty | N/A — the list always has at least the membership record | — | — |
| Error | POST fails | Error banner above the buttons; dialog stays open, checkbox stays ticked | Alert; focus to the banner; the confirm button is the retry |
| Success | 2xx | Dialog closes, route → D-5 | Focus to D-5's `<h1>` |
| Disabled | Unticked, or any control while Loading | 60% opacity, contrast-safe label | Hint *"Tick the box above to continue"* is in `aria-describedby` **from the start**, so AT users learn the requirement before pressing |

#### Screen D-5 — `/my-data/done` — outcome

Closes the loop with a date, not a promise, and burns the token — there is no route back into D-3.

```
┌──────────────────────────────────────┐
│           ✓                          │  56px, success token
│  We've got it.                  h1   │
│  You've asked us to take Bea's Baby  │
│  Massage off the directory.          │
│ ┌──────────────────────────────────┐ │
│ │ What happens now             h2  │ │
│ │ 1. An admin will action this —   │ │
│ │    usually within a day or two.  │ │
│ │ 2. We'll email you when it's     │ │
│ │    done.                         │ │
│ │ 3. It'll be done by Tue 15       │ │
│ │    September at the very latest. │ │
│ └──────────────────────────────────┘ │
│  Your membership and your newsletter │
│  aren't affected.                    │
│  Didn't mean to do this? The email   │
│  we've just sent has a cancel link.  │
│ [      Back to the site      ]       │
└──────────────────────────────────────┘
```

**Variants:** *erasure* — "You've asked us to delete everything we hold about you", step 3 becomes
*"It'll all be gone by Tue 15 September at the very latest"*, closing line *"This page is the last
one that works from your link — it's now used up."* *Cancelled* — `CircleSlash`, h1 "Cancelled.",
*"Nothing has been deleted and nothing has changed."* *Too late* — h1 "That's already done." with the
contact address. **Wider viewports:** `max-w-xl` centred, no structural change.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Arrival with a completed request | Success variant | Polite region announces the confirmation block once; focus on `<h1>` |
| Loading | Cancel-link entry, token resolving | Centred skeleton, no spinner | Polite: "Checking that link" |
| Empty | No request in session and no token | *"There's nothing to show here. If you want to manage your data, start from the beginning."* + link to D-1 | Ordinary content |
| Error | Cancel token invalid/expired/used | *"That cancel link doesn't work any more. If you're not sure what's happening with your request, email us at gpc.communitynews@gmail.com and we'll check."* | Alert; focus to it |
| Success | Cancel succeeded | Cancelled variant | Polite |
| Disabled | N/A — the only control is a navigation link | — | — |

Dates are written in full in the accessible text (`Tuesday 15 September 2026`) even where the visual
shows `Tue 15 Sep`, so they are unambiguous when spoken.

#### Screen D-6 — `/admin/data-requests` — the requests queue

**A5: this route owns data-rights requests.** One sidebar entry
(`{ to: '/admin/data-requests', label: 'Data requests', icon: ShieldCheck }` added to the single
array at `AdminLayout.jsx:5-16`). The directory moderation queue shows a badge and a link on any
listing with an open request but does **not** own the queue — erasure spans the member record, the
listing and newsletter state, so nesting it under directory moderation would leave newsletter-only
and record-only requests homeless.

```
┌──────────────────────────────────────┐
│  Data requests                  h1   │
│  People asking us to unlist,         │
│  unsubscribe or delete.              │
│ ┌────────┐┌────────┐┌──────────────┐ │  StatTiles, computed over
│ │OVERDUE ││DUE ≤5wd││ OPEN         │ │  ALL open requests, not the
│ │   1    ││   1    ││   4          │ │  filtered view
│ └────────┘└────────┘└──────────────┘ │
│ [ Open ][ Completed ][ Cancelled ]   │  radiogroup, arrow keys
│ [ All types ▾ ]                      │
│ ┌─ Card, error left border ────────┐ │
│ │ ⚠ OVERDUE by 2 working days      │ │  DeadlinePill
│ │ [ERASURE]  Received Mon 4 Aug    │ │
│ │ Due Mon 1 Sep                    │ │
│ │ Carla T. · carla@…  Listing: none│ │
│ │ [        Open request        ]   │ │  44px <button>, never a
│ └──────────────────────────────────┘ │  click-handling <div>
│ ┌─ Card, warning left border ──────┐ │
│ │ ⏱ Due in 3 working days [UNLIST] │ │
│ │ Bea M. · Bea's Baby Massage      │ │
│ │ [        Open request        ]   │ │
│ └──────────────────────────────────┘ │
│  Showing 4 of 4                      │
└──────────────────────────────────────┘
```

**Wider viewports:** cards become a table (`Status | Type | Member | Subject | Received | Due |
Action`) keeping the colour-coded `border-l-4` at row level; filters move onto one line.
Pagination follows the established idiom: `PAGE_SIZE = 25` with "Show 25 more", reset on filter
change — never infinite scroll.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Open requests exist | Sorted overdue first, then due date ascending, erasure above unlist above unsubscribe within a day | `<ul>`/`<li>`; polite region: "4 open requests. 1 overdue." |
| Loading | Initial fetch | Three skeleton cards. **Stat tiles show `—`, not `0`** — a zero that becomes a one is a lie | `aria-busy` on the list; polite "Loading data requests" |
| Empty | Nothing matches | *"Nothing waiting. When someone asks to unlist, unsubscribe or delete their data, it'll show up here with its deadline."* + "Clear filters" if a filter is on | Polite; tiles still render (zeroes) so structure is stable |
| Error | Fetch fails | Error banner: *"Couldn't load the request queue. This is our end, not yours — try again in a moment."* + Retry | Alert; focus to it |
| Success | Returning from D-7 | **Inline success banner at the top of the list** (A6 — no toast): *"Done. Carla's data has been deleted."* The row leaves the Open view; tiles recompute | Polite. Focus to `<h1>`, because the row it came from no longer exists |
| Disabled | Filters during first load | 60% opacity | `aria-disabled`, not `disabled`, so the current selection is still announced |

**Accessibility (non-obvious only).** `DeadlinePill` always renders text ("Overdue by 2 working
days"), never colour alone. The truncated email keeps its full value in the accessible name — an
admin may need to read it aloud on a call. Scroll position and the "Show 25 more" count survive a
round-trip to D-7 (the lesson of commit 310e86c).

#### Screen D-7 — `/admin/data-requests/:id` — request detail and erasure workflow

The whole of NFR-005's "single workflow, no database access" claim. **In:** D-6, and the member
record's "This member has an open request" link (the other half of A17's bidirectional pair).

```
┌──────────────────────────────────────┐
│ ← Data requests                      │  first tab stop: bail out without
├──────────────────────────────────────┤  traversing a destructive form
│ Erasure request                 h1   │
│ [ERASURE]  ⚠ Overdue by 2 wd         │
│ ┌─ Timeline ───────────────────────┐ │
│ │ Requested Mon 4 Aug, 21:14 UTC   │ │
│ │ Confirmed by email link          │ │
│ │ Due Mon 1 Sep · Status Open      │ │
│ └──────────────────────────────────┘ │
│ ┌─ Who this is ────────────────────┐ │
│ │ Carla T. · carla@example.com     │ │
│ │ [ Open full member record → ]    │ │  A17
│ └──────────────────────────────────┘ │
│ ┌─ What will be deleted ───────────┐ │
│ │ • Member record            1     │ │  DeletionManifest:
│ │ • Survey answers          14     │ │  counts by default
│ │ • Consent records          3     │ │
│ │ • Directory listing        0     │ │
│ │ • Newsletter subscription  1     │ │
│ │ ▸ Show the actual values         │ │  collapsed <details>
│ │ What we keep: a dated erasure    │ │
│ │ note with no name or email.      │ │
│ └──────────────────────────────────┘ │
│ ┌─ Complete this request ──────────┐ │
│ │ Type the member's email to       │ │
│ │ confirm:  carla@example.com      │ │
│ │ [                              ] │ │  type=text, autocomplete=off
│ │ ☑ Email Carla to confirm it's    │ │  ticked by default
│ │   done (sent before we delete)   │ │
│ │ [     Erase this member      ]   │ │  disabled until it matches
│ │ [ Can't action this? Add a note ]│ │
│ └──────────────────────────────────┘ │
│ ┌─ Notes & history (ActivityLog) ──┐ │
└──────────────────────────────────────┘
```

**Unlist variant:** the manifest becomes "What will change" (*"The listing Bea's Baby Massage comes
off the public directory. Her member record, survey answers and newsletter stay exactly as they
are."*) and the action is a single `Unpublish the listing` with **no typed confirmation** — it is
reversible, so the ceremony would be theatre. **Unsubscribe variant:** `unsubscribed_at` is the
contract and the Brevo backfill must not re-subscribe (the behaviour fixed in commit c50bbf6).
**Wider viewports:** two columns above `md:`, the action card sticky in the right rail so it is
reachable without scrolling past a long manifest. Nothing is hidden at any width.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Open request loaded | Destructive button disabled until the typed email matches (trimmed, case-insensitive) | The requirement is in the field's `aria-describedby` |
| Loading | Initial fetch | Skeleton cards. **The action card is not rendered at all** — a destructive control must never be visible before its manifest | `aria-busy`; polite "Loading request" |
| Empty | Already erased, or no record | *"There's nothing left to delete."*; action card replaced by `Mark this request complete` | The destructive control is **absent from the DOM**, not merely disabled |
| Error | Fetch or erase fails | Error banner at the top of the action card: *"That didn't go through, and nothing has been deleted. The member's record is exactly as it was."* Typed email preserved | Alert; focus to it; button re-enables |
| Success | Erase completed | The action card is replaced by a green completed panel that **holds 800ms** so the change is perceivable, then routes to D-6 with its inline banner | Polite before navigating |
| Disabled | Email doesn't match; erase in flight; request already Completed/Cancelled | 60% opacity; for a completed request the whole card becomes *"Completed on Mon 8 Sep by Ash."* | `aria-describedby`: *"Type carla@example.com above to enable this."* On match, polite: *"Confirmation matches. The erase button is now available."* |

**The email-then-delete ordering (NFR-011 inverted).** NFR-011 says a partial failure must not lose
the record; here the equivalent hazard is **deleting the address you need in order to say you
deleted it**. So: (1) send Email 3b — on failure **STOP**, request stays "Ready to erase" with
*"We couldn't email Carla, so we haven't deleted anything yet. Try again, or use 'Erase without
emailing' and tell us why."*; (2) write the tombstone; (3) delete listing → answers → consent detail
→ newsletter row → member record in one transaction; (4) mark Completed, attribute, stamp UTC.
"Erase without emailing" appears **only** after a send failure, requires a typed reason, and records
that reason on the tombstone.

**Accessibility (non-obvious only).** The typed confirmation is `type="text"` with
`autocomplete="off"` and `spellcheck="false"` — never `type="email"`, which lets a browser autofill
defeat the confirmation. **Enter inside that field does not submit**; only the button activates the
workflow, because an accidental Enter must not erase a member. Counts-first in the manifest is
deliberate: Ash should not have to read a member's answers in order to delete them.

### 7.9 Shared admin dashboard (`/admin`)

Four sections modify this page and none owned it. One specification owns all four counts. Each is a
link, not a statistic: the count replaces the chevron on its quick-link card.

```
┌──────────────────────────────────────┐
│  Hello Ash                      h1   │
│ ┌──────────────────────────────────┐ │
│ │ Listings waiting            3 →  │ │  → /admin/directory
│ │ Oldest has been waiting 12 days  │ │  (amber past the FR-015 age)
│ ├──────────────────────────────────┤ │
│ │ Data requests               2 →  │ │  → /admin/data-requests
│ │ 1 overdue                        │ │  DeadlinePill's tone, shared
│ ├──────────────────────────────────┤ │
│ │ Join form                        │ │  → /admin/form
│ │ Open · 3 unpublished changes  →  │ │  or "Open · up to date"
│ │                                  │ │  or "Closed since 12 Aug"
│ ├──────────────────────────────────┤ │
│ │ Abuse blocked (7 days)     14 →  │ │  FR-006 criterion 5
│ │ 11 honeypot · 3 rate-limited     │ │  → /admin/form settings
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

The **Join form** line is the primary defence against form-config's biggest failure mode (edits
drafted and never published, A4), so it states the draft count, not just "Open". **Abuse blocked**
is the only screen that renders FR-006's rejection counter as a dashboard signal; the fuller
7-day/30-day split with its honeypot-vs-rate-limit breakdown lives on Form Settings.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | All four counts resolved | As wireframed | `<h1>`; the card list is a `<ul>` of links; each count is inside its link's accessible name ("Data requests, 2, 1 overdue") |
| Loading | Initial fetch | All four rows render with their labels and a skeleton bar where the count goes. **Counts arrive with the shell, in one request, not lazily** — four independently-arriving numbers make the page twitch and make "0" briefly true | `aria-busy` on the list; polite "Loading your dashboard" |
| Empty | Every count is zero and the form is up to date | Rows stay, each reading *"Nothing waiting"* / *"Up to date"* / *"Nothing blocked"*. The page never collapses to a blank state — a stable shape is how Ash learns where things live | Polite announces once: "Nothing needs you right now." |
| Error | The counts request fails | The rows render as plain links **without** counts, above one error banner: *"We couldn't load your counts just now. The links below still work."* + Retry | Alert; focus to the banner. Degrading to working links beats an empty page |
| Success | N/A — nothing completes here | — | — |
| Disabled | N/A — every row is a link | — | — |

`AdminLayout` gains an off-canvas drawer plus sticky top bar below 768px (A21) and a skip-to-content
link — it has no `Layout` wrapper today, so unlike the public pages it genuinely needs one added.

### 7.10 Consolidated error and edge-case catalogue

**Shared rules.** Everything renders through the inline banner (`DESIGN.md` §2.10) — **no toasts**
(A6). No error is ever colour alone: icon **and** text, icons `aria-hidden`. Three copy rules:
*say whose fault it is, and it is never hers*; *say whether her data is safe* — every error states
explicitly whether anything was saved, sent, changed or lost, which is the thing generic error copy
always omits; *give exactly one next action*. Never an error code as a headline, never "Something
went wrong", never a raw exception. **Placement:** field problems under the field; submission
problems immediately above the submit button (A1). **Per page: one `aria-live="polite"` region and
one `role="alert"` region, both reused** (A13) — four simultaneous regions on `/join` produce
interleaved, unintelligible speech. Every retry re-posts the same payload with the same
**idempotency key**, generated once at form mount (A19).

| # | Trigger | Where | Display + copy | Recovery | ARIA |
|---|---|---|---|---|---|
| E-01 | `fetch` rejects (offline, dropped connection, tab backgrounded) | Every POST | Error banner, `WifiOff`: **"We couldn't reach us just then."** / "Nothing has been sent, and everything you've typed is still here." + **[ Try again ]** | Idempotent re-post; state is never cleared on error | Alert; focus to the banner so Retry is the next tab stop |
| E-02 | Route throws. FR-005: JSON `{error}` + non-2xx, **never** an HTML page | Every POST, admin list loads | **"That didn't go through — and it's our end, not yours."** / "Nothing has been saved… If it keeps happening, email us at gpc.communitynews@gmail.com." | Same idempotent retry | The server string is never shown to members (may leak internals) and logged with the record id only — never name, email, phone or postcode. Admin screens may show it |
| E-03 | No response within the client timeout | Every POST; likeliest on `/join` over mobile data | **8s**, warning: *"Still going. Please don't close this page."* **30s**, abort, error: *"That took too long… It may have gone through — if you try again we'll make sure you don't end up with two."* | Idempotent retry — the quoted sentence is a literal description of A19, not reassurance theatre | 8s polite (must not interrupt mid-sentence); 30s assertive and takes focus |
| E-04 | Rate limit exceeded (FR-006) | `/join`, D-1 | **Warning, not error** — nothing is broken and she did nothing wrong: *"That's more tries than we can take right now. Give it a couple of minutes… Everything you've typed is still here."* **[ Try again in 2:00 ]** | Countdown enables itself. After a failed retry: *"Still stuck? Email us at gpc.communitynews@gmail.com and we'll add you by hand."* Never discloses the threshold | Polite. Countdown updates the accessible name at 60/30/10/0s only, never every second |
| E-05 | Honeypot field non-empty (FR-006) | `/join`, D-1 | The **exact** success state of that screen | None for the bot, by design. **A2: the confirmation is rendered from the request payload the client sent, never from the database result** — rendering from stored records would tell a caught bot it was caught. Also pad the response to a common time floor and keep headers, cookies, body length and analytics byte-identical | The decoy is off-screen positioned, `aria-hidden`, `tabindex="-1"`; a genuine human caught by it never learns why, which is why `/join`'s confirmation says "if you don't hear from us within a week, email us" |
| E-06 | Submission for an email that already has a record (FR-007) | `/join` confirmation | Ordinary success (A9): **"Thanks, Bea — that's in."** / "We've saved your answers. If you've filled this in before, your latest answers sit alongside what we already had — you won't end up on our list twice." / "You asked to be listed, so one of our admins will have a look. **We usually review new listings within a week.**" / "Nothing you've told us is public until we've checked it with you." | Admin-side: the listing takes a `Resubmission` status surfacing as a pill in the normal queue plus a submitted-vs-published diff (A10) | Every sentence is unconditionally true; the conditional *"if you've filled this in before"* is not a claim about which branch applies, so it satisfies FR-001 and FR-007 at once. The `<form>` is removed from the DOM, not hidden |
| E-07 | Required fields unanswered or malformed | `/join`, D-1, D-7 | Two layers. **Summary above the submit button** (A1): *"There are 3 things to fix before we can send this."* with each item an in-page link to its field; **field errors** under each control, specific and instructive — *"Please write a line or two about what you do — this is what people will read in the directory."*, never "This field is required" fourteen times | Errors clear on `blur`, not on every keystroke; the summary re-counts live | Summary `role="alert"` + `tabIndex={-1}`; **focus always moves to the summary, whatever the count** (A1). `<form noValidate>` — native bubbles are not SR-reliable, cannot meet contrast, and vanish on scroll. Hidden-branch fields are unmounted, so they cannot be in the list at all (FR-002) |
| E-08 | Form closed between load and submit (FR-009) | `/join` | Warning, `Lock`: *"We've just closed the form. Sorry — that's terrible timing. Your answers are still on this page and nothing has been sent."* + the admin-authored closed message + **[ Copy my answers ]** | Copies plain labelled text to the clipboard (the `NewsletterManager.jsx:58-66` idiom). Fields become `readonly`, not `disabled`, so she can still select; submit is **removed**, not disabled — there is nothing to retry | Polite, not assertive — she is mid-task. Then focus to the banner so the next Tab reaches Copy |
| E-09 | Category retired after page load | `/join` directory section | Field-level on the category control + a summary line: *"That category isn't available any more. Please pick another one — everything else you've typed is still here."* The retired option shows once, greyed, suffixed *"(no longer available)"* | Focus to the control. **This applies only where the server rejects on the live taxonomy**; where the form pins its config version at load, the answer is accepted and this entry does not fire | The explanation is in the option text, since `aria-disabled` on `<option>` is inconsistently supported |
| E-10 | Listing unpublished while a visitor has the URL | Public listing detail | **HTTP 200, not 404** — a known URL with a known outcome: *"This listing isn't on the directory any more. It may have been taken down at the member's request, or while we check something."* + [ Browse the directory ]. Must **not** name the business, quote the description or show the category — that would republish what was just withdrawn. Generic `<title>`, `noindex` | Warm tab: revalidate on `visibilitychange`, replace in place, announce politely. **Nothing auto-navigates.** Slugs are immutable (A16), so an old link never lands here by accident | Cold load announces via its `<h1>`; only the warm case moves focus and updates `document.title` |
| E-11 | Transactional send fails (NFR-011, FR-021) | Moderation, D-6/D-7, FR-022 | **The decision is never rolled back** — publishing succeeded, only the telling failed. The listing keeps its `Published` pill **and** carries an `email-failed` badge; the two are never merged into one ambiguous "Error". *"Published — but we couldn't email her. Last tried Mon 18 Aug, 21:14."* + [ Try sending again ] [ Copy the email text ] | Copy puts the rendered body on the clipboard so Ash can send it by hand while FR-021 is a *Should*. Every attempt appends to `ActivityLog` (NFR-013). **Member side: nothing** — she never learns an email failed | The one inversion is D-7's erasure completion email, which blocks the workflow (§7.8) |
| E-12 | Free text over its limit | `/join` description (**300 chars**, A8), long answers, admin edit | Three stages on one control: quiet *"300 characters left"* → warning *"42 characters left"* → error *"You're 18 characters over. Trim it a little and we're good to go."* **No `maxLength` attribute** — a hard cap silently swallows a pasted paragraph's ending with no signal at all to a screen-reader user | Submit is not disabled; pressing it gives the E-07 treatment with focus on the field, so the reason is stated rather than mimed | The counter writes into the **page's shared polite region** (A13), throttled to band transitions only — never per keystroke. `aria-invalid` is set on `blur`, not on the keystroke that crossed |
| E-13 | Markup or a script pasted into a description | `/join`, moderation preview, public detail, CSV export | **Member side: nothing.** She is not blocked and not warned — rejecting `<3`, `Mum & Co` or `Bea > Baby` punishes ordinary people, and FR-020 already requires plain-text rendering everywhere. Admin side, a warning flag: *"This description contains code-like characters. It'll show on the site exactly as typed, tags and all."* | Ash edits with FR-016, which preserves the submitted value alongside the published one. **No automatic stripping** — silently rewriting what a member wrote breaks FR-016's distinguishability criterion | Escaping applies identically in the admin preview (that is where an admin's browser is) and in CSV export, where a cell starting `=`, `+`, `-` or `@` is prefixed against formula injection |
| E-14 | JS disabled, or the bundle fails | Every screen (React SPA) | `<noscript>` in `index.html`, styled inline so it survives with no stylesheet: *"This site needs JavaScript… email gpc.communitynews@gmail.com and we'll add you to the community by hand, and answer any question about your data. You can also read our privacy notice at greenwichparentsandcarers.co.uk/privacy."* Bundle failure: an error boundary with **[ Reload the page ]** | Hard `location.reload()` — the actual fix for a stale `index.html` with a missing chunk. **No-JS parity is deliberately out of scope**; the human fallback is, because the policy promises withdrawal "at any time" | Real `<h1>` and `mailto:`, no ARIA and no CSS dependency; the boundary's fallback uses `role="alert"` and moves focus to its heading |
| E-15 | Slow 3G — Bea's median case, not an edge case | `/join` above all | t=0 button → "Sending…", fields `readonly` (values still visible), polite "Sending your answers", **page does not scroll, navigate or dim**; t=2s a quiet progress line; t=8s and t=30s per E-03. The form is deliberately **not** replaced by a full-page spinner — wiping five minutes of visible work while the network hangs is the most anxiety-producing thing this feature could do | Four independent layers against double submission: disabled button; an in-flight state guard (the layer that catches keyboard users); **the idempotency key** (the only layer surviving a reload or restore, and what makes "try again" honest); a `beforeunload` guard registered only during the request | Fields go `readonly`, never `disabled` — `disabled` removes them from the accessibility tree, so a screen-reader user mid-submit would find the form had vanished. The submit keeps `aria-disabled` so it is announced, name → "Sending your answers, please wait" |
| E-16 | Any unmatched URL | Site-wide | `App.jsx` has no `path="*"` today, so `/anything-else` renders an empty `<main>`. A catch-all 404 is in scope: *"We couldn't find that page."* + links to home, the directory and `/join` | Precondition for E-10: without it, a typo and a withdrawn listing are indistinguishable | Real `<h1>`, focus to it, `<title>` updated |

### 7.11 Interaction and animation contract (whole feature)

**The reset is global (A20).** A scoped reset would leave every shared component this feature
*reuses* still animating, which is the failure it exists to prevent. Two mechanisms, both required:
a `useMotionSafe()` hook wrapping framer's `useReducedMotion()`, returning variants where
`initial === animate` and `duration: 0` — **the animation is removed, not sped up; a 50ms slide is
still a slide**; and a global `@media (prefers-reduced-motion: reduce)` block in `src/index.css`
zeroing `animation-duration`, `animation-iteration-count`, `transition-duration` and
`scroll-behavior` on `*`, `*::before`, `*::after`, which catches Tailwind's `transition-*`,
`animate-spin` and the `hover:scale-105` baked into the existing `Button`.

**Three carve-outs, deliberate:** focus indicators never animate away and are never suppressed;
colour-only transitions are kept where they are the sole hover affordance (colour change is not
vestibular motion); and **state that only motion communicates must be replaced, not deleted** —
every row below whose fallback removes an animation names what carries the information instead.

**Motion tokens** (for `DESIGN.md` §1): `--motion-instant` 100ms (press, tick) · `--motion-fast`
150–200ms (hover, focus, inline expand) · `--motion-base` 250–300ms (card enter, dialog, route) ·
`--motion-slow` 400ms (section reveal, success icon) · `--ease-out` `cubic-bezier(0.16,1,0.3,1)` ·
`--ease-in` `cubic-bezier(0.7,0,0.84,0)` · `--stagger` 0.08s public / 0.05s admin, **capped at 6
items** (`Events.jsx`'s `i * 0.1` on a 100-card grid would make the last card wait ten seconds).
Nothing exceeds 400ms; nothing loops except the loading indicators below, each of which has a static
form.

| Interaction | Where | Behaviour | Timing | Reduced-motion fallback |
|---|---|---|---|---|
| Route change | Every route | Fade out / fade in + 8px rise | 250ms `--ease-out` | Instant swap. Focus still moves to the new `<h1>`; the live region still announces |
| Skip-to-content link | Existing, `Layout.jsx` | Slides down on focus | 150ms | Appears instantly, same position. Never suppressed |
| Focus ring | Everything interactive | 2px, 2px offset, `:focus-visible` | Instant | Unchanged in both modes |
| Button hover | All variants | Background darkens one step | 150ms | Colour retained. **The existing `hover:scale-105` is removed for all users** — it is a motion trigger and it shifts adjacent layout |
| Button press | All | 2% scale-down | 100ms | Suppressed; background darkens instead |
| Button → loading | All submitting buttons | Label crossfade + in-button `Spinner` (A7) | 120ms | Instant label swap, static indicator; the polite region carries the state |
| Inline banner appear | Every error/success/warning | Slide down 8px + fade | 200ms | Instant at full height. `role="alert"` fires identically |
| Dialog open / close | D-4, reject, unpublish confirm | Backdrop to 55%; panel slides up 24px + fades | 250ms / 180ms | Both at final state instantly. Focus trap, Escape and focus restore unchanged |
| Skeleton shimmer | Every list/detail load | Gradient sweep | 1.4s loop | **No sweep** — flat blocks. The polite region ("Loading your details") is what tells a reduced-motion user something is happening |
| Disclosure / accordion | `/join` sections, D-7 manifest | Height auto + fade | 250ms | Instant at full height; `aria-expanded` toggles identically |
| Scroll-into-view | Error focus, anchor links | `smooth`, `block: 'center'` | Native | `auto` — instant jump. Focus lands identically |
| Branch reveal / discard (FR-002) | `/join` | Section expands from 0 height, 60ms after the radio commits | 300ms | Instant at full height. **Focus does not move** (it would yank a member mid-choice); the polite region says *"Business questions added below — 7 more to answer."* — **required in both modes**, it is the only thing telling a screen-reader user the form grew |
| Directory opt-in expand (FR-003) | `/join` | Disclosure panel fades in **before** the fields | 300ms | Both instant, disclosure **above** the fields in DOM order — the ordering is the requirement, the timing was only a nicety |
| Character counter change | `/join` (E-12) | Colour quiet → warning → error | 150ms | Instant colour and icon swap |
| Postcode validity border | `/join` | Colour transition | 200ms | Instant. **The 600ms debounce is unchanged** — it is timing, not animation; shortening it fires validation mid-typing |
| Form → confirmation | `/join` success | Crossfade + 0.8→1 tick icon | 300ms + 400ms | Instant swap, icon at final size. Focus to `<h1>` and the polite announcement unchanged |
| Card grid enter | Directory index | Fade + 12px rise, staggered | 400ms, `--stagger` | All at final state instantly |
| Search-as-you-type | Directory (FR-019) | Results crossfade | 180ms after a 300ms debounce | Instant swap; **debounce unchanged**. Polite *"12 businesses found"* — required in both modes, it is the only non-visual result feedback |
| Card hover / focus | Directory | Shadow deepens, card rises 4px | 200ms | Shadow only, no rise. Cards are `<a>`-wrapped, never `<div onClick>` |
| "No longer listed" swap | Listing detail (E-10) | Content crossfades | 250ms | Instant. The polite announcement and the `document.title` update are what tell the visitor |
| List rows enter / "Show 25 more" | All admin lists | Fade + 8px rise, staggered, capped at 6 | 300ms | Instant. Polite *"Showing 50 of 340."* — both modes |
| Filter change | All admin lists | List crossfades | 180ms | Instant. Live region announces the new count; scroll position and "Show N more" state survive in both modes (commit 310e86c) |
| Row removal after a decision | Moderation, D-6 | Row collapses, list closes the gap | 300ms | Instant. The inline banner and the live region carry the outcome; **queue position is preserved in both modes** — the admin's place is state, not animation |
| Overdue / pending-too-long emphasis | D-6, moderation | 2s opacity pulse | 2s loop | **No pulse.** The text ("Overdue by 2 working days"), the icon and the border carry it |
| Stat tile value change | Dashboard, D-6, insights | Number counts up | 600ms | Snaps. Announced only when it crosses a threshold (0→1 open request) |
| Insights chart draw (FR-014) | Insights | Bars grow from 0, staggered | 600ms | Bars at final height instantly. **The data table is present in both modes** — a chart's meaning must never depend on its animation |
| Open/closed toggle (FR-009) | Form settings | Switch thumb slides | 200ms | Thumb jumps; the text label ("Form is open"/"Form is closed") is what changes and is what is announced |
| Erasure completed panel | D-7 | Green panel crossfades, holds 800ms, routes away | 300ms + 800ms | Appears instantly and **still holds 800ms** — the hold is perception time, not decoration |
| Copy-to-clipboard | E-08, E-11 | Icon crossfades to a tick for 2s | 150ms | Instant swap, same 2s hold. Polite: *"Copied."* |

**Never animated, in either mode:** anything that would move a focused element out from under a
cursor or caret; anything triggered by scroll position on `/join` (scrolling back to check an answer
must not re-trigger reveals); error text (it appears — it does not fade in over 400ms while she is
trying to read it); the focus indicator; content a live region has already announced as present; and
anything at all while a destructive request is in flight, so it is unambiguous the system is
mid-action.

### Notes for architecture

- **No right of access or portability exists in the UI.** FR-023 covers withdrawal and erasure; the
  published policy also lists access and portability, and FR-013 gives only *admins* an export. D-3
  has three cards where the policy implies four. Either add a fourth card fulfilled by FR-013's
  export, or state on `/privacy` that access requests go to the controller by email.
- **Erasure must reach Brevo.** FR-023 names the record, listing and answers, and is silent on the
  `newsletter_subscribers` row and the Brevo contact. An erasure leaving a live Brevo contact is not
  an erasure — and a deleted contact could be re-imported by a later backfill with no
  `unsubscribed_at`, undoing commit c50bbf6.
- **The erasure tombstone's shape is a minimisation decision.** Specified as request id, type,
  received/completed dates, acting admin and a peppered email hash. The hash is what lets GPC answer
  "did you delete me?"; with a retained pepper it is arguably still personal data.
- **When the 20-working-day clock starts** is a legal reading, not a UX one. Specified as *from the
  confirmed request* (D-5), not from the D-1 submission, since an unconfirmed submission may not be
  from the data subject.
- **Routes** `/my-data`, `/my-data/manage`, `/my-data/done`, `/my-data/cancel` and
  `/admin/data-requests` are invented here. Decide whether the promised `/unsubscribe` is a distinct
  route (needed for RFC 8058 one-click headers, which most mailbox providers now expect) or an alias.
- **E-04's countdown assumes the rate limiter returns a retry-after value.** If it cannot, the copy
  degrades to "Give it a couple of minutes and have another go" with a plain enabled button.
- **`sessionStorage` drafts of unsubmitted answers** (relied on by E-01 and E-08) store personal data
  on the device before consent is recorded. Almost certainly fine; currently disclosed nowhere.
- **Nothing escalates an overdue request.** The queue and the dashboard tile satisfy NFR-005 only for
  an admin who opens the panel; FR-022 is a *Could* and covers new submissions, not deadlines.
- **D-2's masked-email echo** costs screen-reader verbosity (`•` is spelled out by some readers).
  Recommend echoing nothing and keeping the conditional sentence.


---

## Dev Handoff Notes

> Planning guidance for the external dev tool. Read-only — do not edit during implementation.

### Implementation order

The order below is driven by risk, not by visible progress. The two riskiest things — the
privacy boundary and the legal gate — come first, because both become far more expensive once
real member data exists.

1. **§7 privacy-page specification + §2 consent copy approval** — *precondition, not a phase.*
   FR-024 gates launch and the retention period blocks the consent text. Neither is code, both
   need the controller, and both take calendar time. Start them on day one.
2. **§1 + §2 — the form and the consent capture.** The trust boundary is made or lost here.
3. **§3 — moderation.** Nothing may reach the public site before this exists.
4. **§6 — the public directory.** The visible payoff, but useless before §3 gates it.
5. **§4 — form configuration**, including the FR-006 abuse counter.
6. **§5 — member records and insights.** The payback for the form's length; last because the
   data accumulates whether or not the views exist.
7. **§7 — the data-rights journey.** Must ship in the same release, not after: the site already
   promises withdrawal at any time.

### Cross-cutting work that belongs to no single section

These are shared changes several sections depend on. Assign them explicitly or they will be
built three times or not at all.

| Item | Owner section | Note |
|---|---|---|
| `AdminLayout` responsive drawer (<768px) | §3 | Three admin sections assume it. Currently desktop-only. |
| One `Dialog` primitive; `ConfirmModal` rebuilt on it | §3 | Five dialogs were independently specified; A14 collapses them to one. |
| Shared `Spinner` honouring `prefers-reduced-motion` | §1 | The one deliberate change to a shared component outside these routes. |
| Global `prefers-reduced-motion` reset | §1 | Scoped resets leave reused components animating (A20). |
| Skip-link contrast fix (`#fc16a0` → `--color-primary-700`) + `focus-visible` | §6 | The link **already exists** at `Layout.jsx:8-10`. Do not add a second. |
| Skip link added to `AdminLayout` | §3 | `AdminLayout` has no `Layout` wrapper. |
| Catch-all 404 route | §6 | Without it, "no longer listed" is indistinguishable from a typo. |
| Admin dashboard counts (pending / data requests / unpublished changes / abuse blocked) | §7 | Four sections modify the dashboard; §7 owns its states. |
| Status pill tokens | `DESIGN.md` §2.7 | Reuse `SubscribersManager`'s *idiom*, never its values — they fail AA. |

### Assets required before dev start

- [x] Logo — exists.
- [x] Icon set — `lucide-react`, already a dependency.
- [ ] **Consent copy approved by the controller**, including the retention period (addendum Q8). **Blocking.**
- [ ] **Privacy page content** per §7's specification. **Blocking — gates launch (FR-024).**
- [ ] Starter category taxonomy (addendum Q2).
- [ ] Decision on the public enquiry contact's form (addendum Q3/Q4).
- [x] All other screen copy — written inline in §§1–7.
- No listing images at v1; logo upload is deferred (`FR-D02`).

### Non-negotiables

These trace directly to NFR-008 and to the privacy guarantee. A build that misses one has not
met the spec, however finished it looks.

- Every input has an `id` and a `<label htmlFor>`. **The site does this nowhere today** — it is
  the single largest departure from existing patterns.
- Every choice group is a `<fieldset>` with a `<legend>`.
- Errors: `role="alert"` + `aria-describedby` + `aria-invalid`. The submit-failure summary sits
  above the submit button and always takes focus (A1).
- **One** `aria-live="polite"` region and **one** `role="alert"` region per page (A13).
- Validation on blur; re-validation on change once a field is in error.
- 16px minimum on every input, or iOS Safari zooms and breaks the layout mid-form.
- `<button>` for actions, `<a>` for navigation. No `<div onClick>` — the existing
  `LondonEventCard` is the anti-pattern.
- Focus visible everywhere, via `:focus-visible`; modals trap focus and close on Escape.
- No horizontal scroll at 320px. Admin tables scroll inside their own container.
- `prefers-reduced-motion` honoured globally.
- **Submitted text renders as plain text, never as markup.** The site sets no CSP.
- **No personal data** in any URL, notification, log line, or page title. Log the record `id` only.
- The confirmation screen renders from the **request payload**, never from stored records —
  otherwise it leaks honeypot and duplicate-email state (A2).

### Open questions for product / stakeholders

1. **What retention period is stated in the consent text?** (addendum Q8) — *blocks the first live
   submission.* Everything else on this list can be worked around; this one cannot.
2. **What form does the public enquiry contact take**, and is an email shown in the clear or
   relayed? (addendum Q3/Q4) — §2 designs for a clear email and states what changes otherwise.
3. **The starter category taxonomy** (addendum Q2) — §6's filter and §2's field both depend on it.
4. **Does the directory publish any location?** (addendum Q1) — decided as *no*. §6 records what
   that costs a visitor of a directory whose whole premise is locality, and designs around it
   rather than quietly reopening it.
5. **What happens to existing Tally responses?** (addendum Q6) — those members consented to a
   different notice and were never asked about a directory that did not exist.

---

*Part of the BMAD Planning & Orchestrator plugin. Produced by the `bmad-ux` skill.*
