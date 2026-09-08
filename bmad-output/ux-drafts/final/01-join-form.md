## 1. Joining — the public form

**Covers:** FR-001, FR-002, FR-006 (member-facing surface), FR-007, FR-009, NFR-007, NFR-008, NFR-009 (second clause). The directory opt-in fields (FR-003) and the granular consent block (FR-004) have their own sections; this one shows where they sit in the flow and stops at their edge. **Tokens, component visuals, sizes, contrast pairs and the WCAG contract live in `DESIGN.md` and are never restated here.**

### Decisions that shape every screen below

**D1 — one scrolling page, not a stepped flow.** `/join` is a single page of numbered sections with one Submit at the bottom. Reason, stated once: a stepped flow charges six navigation taps that do no work, hides the end of the form at the moment the member is deciding whether to continue, and adds per-step focus management — the commonest WCAG failure in multi-step forms. The repo has no form library, no state machine and no multi-step precedent (NFR-012).

**D2 — how a long form is made to feel short.** (a) an honest length signal at the top, per D3; (b) numbered, named, counted sections — `«k» of «T» · Your group` — each gaining a `Done` `Badge` when its required fields are answered (variants per `DESIGN.md` §2.7); (c) the three long-text questions (B7, C4, "What do you hope to gain") ship `required = false`, the largest single completion lever available, and FR-008 lets an admin re-require them without a deploy; (d) a one-tap escape from the day/time grid (S3); (e) a decorative scroll-linked progress rail, `aria-hidden` — scroll-linked, never answer-linked, because an answer-linked bar runs *backwards* when a member picks "Both"; (f) nothing is asked twice (D4). **D3 — the length signal is computed, never authored (A12):** `«N»` is the number of questions **currently rendered for this member's branch**, recomputed on every branch change; `«T»` is the number of sections currently rendered (one more for "Both"). The same computed values appear in the header, in every section heading, and in the wireframes below — `«N»` is notation, not a placeholder for a constant, and **no figure in this document is normative; the rule is.** The signal reads `"⏱ About «M» minutes · «N» questions"`, `«M»` derived from `«N»`, announced only on change.

**D4 — business fields are pre-filled, not re-asked.** FR-002 fixes the Business branch at seven questions (three of them business name / website / Instagram, B3–B5); FR-003 independently requires the same three in the directory section. When both are present the directory section arrives pre-filled and fully editable under *"We've copied these from your business answers above. Edit them if you'd like them to read differently in the directory."* A Career Mum who opts in types them fresh, which FR-003 requires to work.

**D5 — submission is idempotent (A19).** The client generates one idempotency key per form session and sends it with every attempt; retries reuse it. This is what makes S6's retry copy true rather than merely reassuring.  **D6 — one alert region, one polite region, per page (A1, A13).** Errors on submit follow `DESIGN.md` §2.10 exactly: one `ErrorSummary` banner, `role="alert"`, rendered **immediately above the Submit button**, with **focus always moving to the summary** whatever the error count, and each listed error a link to its field. It is the page's **only** `role="alert"`; per-field messages are `aria-describedby` text with `aria-invalid="true"`, never their own regions. The `LengthSignal`, `ChoiceCount`, the matrix count, the loading and sending announcements and §2's character counter all share **one** throttled `aria-live="polite"` region — four simultaneous regions on `/join` would produce interleaved, unintelligible speech. Only rendered questions are validated; hidden-branch questions are never required and never appear in the summary (FR-002).

### Journey J1 — Bea joins as a Business Mum and asks for a directory listing

**Goal / persona:** get her home-run business into a directory local parents actually read, without her postcode or personal email reaching the public internet. Bea is on a phone, in the evening, tired — motivated by visibility, genuinely anxious about exposure.
**Time:** 4:30–5:30 min — the long path, and the one NFR-007's five-minute median is measured against. **Entry points:** navbar CTA `Join` — a `Button`-styled CTA to the right of the nav row, **not** a seventh `NavItem`, which would wrap at 1024px (A11); homepage CTA; `/directory` — *"Run a local business? Add your listing"*, the highest-intent entry because she has just seen what a listing looks like; Instagram bio; weekly newsletter; a redirect from the retired `tally.so/r/RG1M6K` URL.
**Success:** she reaches the confirmation and it says unambiguously that the listing is *pending review* and not yet public; she read which fields become public **before** typing any business detail; three separate consents, none pre-ticked; postcode and signup email absent from the public payload; she never typed her business name twice.

```
  navbar CTA · homepage · /directory · Instagram · newsletter · Tally redirect
       │
  GET /join → form config ── open = false ──→ [S4 · Closed]  FR-009
       │ open = true
  S1   ⏱ About «M» min · «N» questions · 1 of «T» · About you
       first name* · email* · postcode* · how you heard*
  S2   2 of «T» · Your group  ( ) Business Mums ( ) Career Mums ( ) Both
       │ branch mounts · «N» and «T» recompute · announced politely
  S3   3 of «T» · Your business 7 q → Events 3 q → Community 2 q
  §2   Directory opt-in (FR-003) — disclosure panel FIRST, then the 6 fields,
       name / website / Instagram pre-filled from B3–B5; then consent (FR-004)
  [ErrorSummary renders HERE] → [ Send my answers ] → POST /api/join
       + idempotency key + honeypot, origin check, rate limit (FR-006)
  2xx → [S5 · Success] → /directory · /whats-on · /privacy
  non-2xx → [S6 · Errors] → back into the form, or [S4]
```

| Trigger | Display | Recovery |
|---|---|---|
| Config fetch fails on load | *"We couldn't load the form just now."* / *"This is our end, not yours."* + `Try again`. **Never** falls back to the closed state — a failed fetch must not be mistaken for an admin decision, nor for "open" (submissions would be rejected downstream) | Retry refetches; after two failures the copy adds `gpc.communitynews@gmail.com` |
| Admin closes the form mid-session (409) | Page replaced by S4 with a leading alert: *"Sorry — sign-ups closed while you were filling this in. Nothing was saved."* | `Back to home`. Not recoverable, and we say so rather than implying otherwise |
| She changes her group after answering branch questions | `Dialog` (`DESIGN.md` §2.9) — see S2. FR-002 requires the discard; the dialog is the only warning she gets | "Keep Business Mums" cancels; focus returns to the radio she acted on |
| She opts into the directory having chosen only "Career Mums" | Fields appear with nothing to pre-fill. FR-003 requires this path to work — it is the fix for source-form defect 1 | None needed; a supported path, not an error |
| She types her signup email into the public enquiry contact, or overruns the 300-character description (A8) | *"That's the same address you signed up with. It would be shown publicly on your listing. Use it anyway?"* + a `"Yes, publish this address"` checkbox, with submit blocked until she changes it or ticks. The description's live count flips to `"18 over"`, the field goes `aria-invalid` and submit is blocked — never silently truncated | Changing the value clears the warning; editing restores the count |
| Double-tap on Submit, or a rate limit (FR-006) | Submit enters `loading` — *"Sending…"*, `aria-busy`, `aria-disabled`, pointer-inert, and D5 makes a genuine double-post harmless. On a limit: *"You've sent this a few times in a row. Please wait a moment and try again."* + a countdown. **Never** *"you look like a bot"* — a real member on shared café wi-fi will hit this | Countdown expires; answers untouched |
| She has submitted before with this email, or a bot completes the honeypot | **Nothing different.** FR-006/FR-007: the ordinary confirmation, rendered from the submitted payload and never from stored records (A2) — the response must never reveal whether an email is registered, and reading back the database would tell the bot it was caught | N/A by design |

**Drop-off.** The riskiest moment is the directory section, not the business one: four minutes in, she is asked which of her contact details she will put on the open web — a decision she has probably never made. The disclosure panel therefore sits **above** the fields, so she is thinking about the boundary before a field asks her to act on it. Second: B7, a long-text question at minute two, required in the source form and de-required per D2c. Third: the day/time grid, which as the source renders it is ~1,000px of scroll for one question, so a member thumb-scrolling to "see how long this is" overestimates the form threefold; S3 fixes it. **Where she will not drop off:** the branch moment — `«N»` does not grow when she picks Business Mums, and growth at the moment of commitment is what punishes people. **Unmitigated:** iOS Safari discarding a backgrounded tab; FR-D07 is deferred because identifying a partial submitter before consent is itself processing (see Notes).

### Journey J2 — Carla joins as a Career Mum and declines the directory

**Goal / persona:** support and connection in as few taps as the form can honestly manage, without ever being asked about a business she does not have. Carla is employed or returning after leave, filling forms in fragments between other tasks, and **will abandon the moment she meets an irrelevant question.**
**Time:** 2:15–3:00 min; `«N»` *falls* when she picks Career Mums, and the fall is announced. **Entry points:** as J1 minus `/directory`, plus the one that matters most for her — a link in a GPC WhatsApp group or an event follow-up, tapped one-handed.
**Success:** zero business questions (proof below); the length signal drops and is announced; declining the directory asks none of FR-003's six fields; confirmation in under three minutes.

```
 S1 → S2 (•) Career Mums → the Career section mounts (4 q), Business NEVER
      mounts, «N» and «M» fall, and the polite region announces both
 S3  Your career 4 q — C1 situation* (10 options, de-duplicated: defect 3),
     C2 industry*, C3 support*, C4 challenge (optional). NO stage, NO business
     industry, NO name/website/Instagram, NO business "looking for" or
     challenges. Events: [✓] "I'm flexible" = 1 tap · frequency radio.
     Community: both optional questions skipped → the section reads Done
 §2  Directory (•) "No, not right now" → NOTHING expands (FR-003: not
     requested, not stored). Consent: hold-my-data* only; publish-my-listing
     NOT RENDERED (FR-004b); newsletter left unticked.
 [ Send my answers ] → [S5] "You're in, Carla." No listing paragraph, no
     review timeframe, no newsletter line.  →  /whats-on · /
```

**The zero-business-questions proof (NFR-007 evidence).** Rendered: **0**. In the tab order: **0**. In the heading tree: **0**. In the submitted payload: **0**. The Business section component is **never mounted**, so there is nothing to hide, disable or filter at submit time — which is why branch content is unmounted rather than `hidden`: a `hidden` fieldset is still a payload risk and still a maintenance trap. **Stated with its condition attached:** the guarantee holds for a Career Mum who *declines* the directory, exactly the case NFR-007 names. One who *opts in* is asked FR-003's six listing fields, which are business fields in substance — required by FR-003, and the deliberate fix for source defect 1. Acceptance tests must quote the condition, not round it up.

| Trigger | Display | Recovery |
|---|---|---|
| Career → Both, then Both → Career | Going to "Both" shows **no dialog** — it is a superset, so her career answers stay and the Business section mounts below with a polite announcement of the new `«N»`. Coming back shows the `Dialog`, because the business answers are now the abandoned set (S2) | "Keep Both" cancels |
| She declines the directory after opting in and typing fields | `Dialog`: *"Your listing details will be cleared. Nothing is saved and nothing is sent to GPC."* FR-003 requires declined fields not be stored | "Keep my listing details" cancels |
| She leaves both Community questions blank | The heading reads `Done`. No nag, no asterisk, no "are you sure" | N/A |
| She ignores the day/time matrix and submits | Summary entry: *"Which days and times work for you — pick at least one slot, or tick 'I'm flexible'."* The recovery is named in the error text | One tap on "I'm flexible" |
| Her postcode fails format validation | *"That doesn't look like a UK postcode. Try something like SE10 8XJ."* Debounced 600ms, matching `EventFilters.jsx`'s three-state idiom; not blocking until submit | Corrects it |

**Drop-off.** Her risk is front-loaded and entirely about relevance, which is why the branch question is section 2 — as early as it can be without asking her group before her name, which reads as pushy. The postcode is her specific risk: she has no reason to believe GPC needs her home postcode, so the hint is load-bearing and must sit **under the label, above the input**, read before the field is focused. The events section reads as effortful, which is why the escape hatch is the *first* thing inside the question, not a link under the grid. Quietest risk: the directory question reads like a trap to someone with no business, so *"You can ask to be listed later — just fill this in again."* is present in **both** states of the question, doing its work while she decides.

#### Screen S1 — Intro and identity

**Purpose:** establish this is GPC's own form (not a third-party embed), set an honest expectation of length, and collect the four unconditional identity answers before anything that could feel intrusive. **Entry:** all J1/J2 entry points. **Exit:** S2, by scrolling — there is no navigation event.

```
┌─ 320px ────────────────────────────────────┐
│ GPC                         [Join]     [≡] │ Navbar + CTA button (A11)
│▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ progress rail, aria-hidden
│ Join GPC Mums in Business & Work           │ <h1>, then the admin-authored
│ Local parents running events and           │ intro — plain text, no markup
│ activities for local families…             │ (FR-008 / FR-020)
│ ⏱ About «M» minutes · «N» questions        │ LengthSignal → the shared
│ 🔒 Your email, postcode and answers are     │ polite region, on change only
│    never shown publicly.                   │
│ ── 1 of «T» · About you    4 questions ─── │ <h2> + right-aligned count
│ First name*                                │ every hint sits ABOVE its
│ Email address*  "We'll only use this to    │ input, tied by
│    contact you about GPC."                 │ aria-describedby
│ Postcode*  [ SE10 8XJ ]  "We use this to   │ ← the hint that does the
│    plan events near you. It's never shown  │ persuading
│    publicly and never leaves GPC."         │
│ How did you hear about us?*  GPC · Weekly  │ fieldset/legend, full-row radio
│    newsletter · Instagram · A friend · At  │ targets; "Newletter" typo fixed
│    an event · Google · Something else      │ (defect 7) in the seeded config
└────────────────────────────────────────────┘
```

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Config loaded, `open = true` | As drawn | Heading text carries the count; nothing announced on first paint |
| Loading | Config fetch in flight | `<h1>` paints immediately (it is static); below it, skeletons at the heights of the first three sections — skeletons for page load, the shared `Spinner` only for in-flight actions (A7) | Container `aria-busy="true"`; polite region: *"Loading the form"* → *"Form ready. «N» questions, about «M» minutes."* |
| Empty | N/A — a blank form is the Default state; no data-bearing collection here can be empty | — | — |
| Error | Config fetch failed | Full-page: *"We couldn't load the form just now."* / *"This is our end, not yours."* / `Try again` | The page's single alert region |
| Success | N/A — success is a whole-page state (S5); FR-001 requires the form to be *replaced* | — | — |
| Disabled | N/A — no field here is ever disabled | — | Deliberate: disabled inputs are skipped by some screen readers and cannot be focused to read their own explanation |

**Accessibility and layout (non-obvious only).** Postcode validation is format-only, debounced 600ms with the three-state border borrowed from `EventFilters.jsx`, and does **no geocoding** — a geocoder is a processor we would have to disclose, for a field that is never published. One `<h1>`; every section title an `<h2>`; questions are `<label>`/`<legend>`, never headings, because a 25-heading document is worse to navigate than a 7-heading one. The `<form>` gets no `role="form"` and no `aria-label`: one form in one `<main>` is unambiguous and an extra landmark only adds a rotor stop. **Do not add a skip link** — one already exists at `Layout.jsx:8-10` wrapping every public page; its contrast must be corrected to `--color-primary-700` (it currently paints white on `--color-primary`, 3.64:1) and its `focus:` changed to `focus-visible:`. No programmatic focus on load, and the privacy one-liner is static text placed *before* the first input so it is heard before the member commits anything. **≥768px, differences only:** the column caps at `max-w-2xl` and centres — never two columns, which makes reading order ambiguous for eyes and screen readers alike; the LengthSignal moves inline beside the `<h1>`; at ≥1024px a sticky rail lists the section names with ticks, `aria-hidden` and **read-only**, not jump navigation, because jumping past unanswered required fields is how people submit incomplete forms.

#### Screen S2 — Group choice and the branch change

**Purpose:** capture the one answer that determines the shape of the rest of the form, and change that shape in a way the member expects and can back out of before losing anything. **Entry:** S1. **Exit:** branch sections mount in place; or the `Dialog`, when a change would discard answers.

```
┌─ 320px ────────────────────────────────────┐
│ ── 2 of «T» · Your group   1 question ──── │ <h2>
│ Which group would you like to join?      * │ <legend>
│  "This is the only answer that changes the │ hint — sets the expectation
│   rest of the form."                       │ up front
│ ( ) Business Mums   I run or am starting   │ two-line options; the whole
│     a business             +7 questions    │ row is the target. The
│ ( ) Career Mums     Employed, freelancing  │ "+N questions" line is
│     or returning           +4 questions    │ aria-hidden — the count is
│ ( ) Both            A business and a job   │ already inside each radio's
│     or career plans       +11 questions    │ accessible name, so it is
│      ══ the branch section mounts here ══  │ announced once, not twice
└────────────────────────────────────────────┘
```

> **Change your group to Career Mums?**
> You've answered 3 of the 7 business questions. Changing your group will clear those answers. Nothing is saved and nothing is sent to GPC.
> *[only when the directory section holds values]* Your directory listing details will stay as they are.
> `[ Keep Business Mums ]`  `[ Clear and change ]`

**FR-002 discard rule.** The abandoned set is `branchFields(old) \ branchFields(new)`. Business→Both and Career→Both abandon nothing (superset) and show **no dialog**. The four other transitions show the dialog **only if at least one abandoned field has a value** — a non-empty trimmed string, a selected radio, or ≥1 checked box. Directory fields are never in the abandoned set: once copied per D4 they belong to a section the member can see, and silently emptying visible fields is the exact surprise the dialog exists to prevent. The count is **real and computed** — a member who answered one question and one who answered six deserve different amounts of warning, so the singular reads *"You've answered 1 of the 7 business questions."* On **Clear and change**: abandoned fields are **deleted from the state object**, not blanked, so they cannot serialise as empty strings into the payload (FR-002 requires them *absent*); their errors drop and the summary recomputes; sections renumber and `«N»`/`«T»` recompute; focus returns to the radio the member acted on, not into the new section, which would hide the consequence of their own choice; the polite region announces once — *"Business questions removed. Career questions added, 4 questions. This form now has «N» questions, about «M» minutes."* On **cancel** the radio reverts and the live region says nothing: a cancelled action should be silent. **No undo is offered**; the dialog *is* the undo, which is why cancel holds initial focus.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | No group chosen | Three unselected radios; no branch section below | `<fieldset>`+`<legend>`; nothing announced |
| Loading | N/A — options arrive with the already-fetched form config | — | — |
| Empty | Identical to Default. An unanswered question is not an empty state and gets no empty-state treatment | — | — |
| Error | Submit with no group chosen | *"Choose the group you'd like to join — this decides which questions we ask you next."* The summary links here | `aria-describedby="group-hint group-error"` on the fieldset, `aria-invalid` on the first radio; describedby text, not its own alert (D6) |
| Success | Group chosen, branch mounted | `Done` `Badge`; the count becomes `Done` | Tick `aria-hidden`; heading reads *"2 of «T», Your group, completed"* |
| Disabled | While the `Dialog` is open the page behind it is inert | Radios visually unchanged — the scrim already signals modality | Page container `inert` (`aria-hidden` fallback), never `disabled` on individual controls |

**Accessibility and layout (non-obvious only).** The radio group is one tab stop and arrows **move and select** (native behaviour), so arrowing from Business to Career **can open the discard dialog on a key press**. That is intended: the dialog is the guard and cancel restores the previous value, so no keyboard user can destroy answers without a second explicit action. Do not "fix" it by switching to arrow-moves-without-selecting — that breaks the native radio contract screen-reader users rely on. The dialog implements `DESIGN.md` §2.9 verbatim (one shared primitive, A14) and its initial focus is the **safe** action, per WCAG 3.3.4. **≥768px:** the three options become a 3-up card row with equalised heights so the counts align — the comparison the member is actually making is "how much work is each?"; the `Dialog` centres at `max-w-lg`, buttons side by side, cancel left and still holding focus.

#### Screen S3 — The question sections: branch, events, community

**Purpose:** ask the branch-specific questions and *only* those, then collect the demand signals FR-014's insights view is built on — without letting the *when* question consume a third of the form. **Entry:** S2. **Exit:** the directory section; or unmount, on a confirmed group change.

**Fields and controls.** *Business (7):* B1 stage (radios), B2 industry (text), B3–B5 business name / website / Instagram — all optional, with "Optional" shown as a visible word while required is marked `*` only, and a missing URL scheme normalised on blur rather than rejected; B6 "What are you currently looking for?" (18 chips); B7 challenges (optional long text, hinted *"Skip this if you'd rather — it helps us plan workshops, that's all."* and deliberately given **no** character counter, since a counter on an optional question implies a target). *Career (4):* C1 current situation (**10** chips — the source has 11 with "Looking for work" duplicated; defect 3 is fixed in the seeded config, not just the component), C2 industry, C3 support that would help, C4 challenge (optional). *Both:* two sibling cards, business then career, `«T»` becomes 8; nothing is merged, because "Which industry are you in?" (the business) and "What industry do you work in?" (the job) are different questions for someone with both, and collapsing them loses the split FR-014 depends on. *Community (2):* both optional — nobody should be forced to volunteer. **The 21-checkbox problem:** The source asks "which days work best?" as one multi-select of **21 options** (7 days × 3 slots, flattened): ~1,000px of continuous scroll at 320px against a whole-form height of ~2,800px, landing early enough that a member sizing the form up overestimates it threefold. Splitting it into "which days?" + "which times?" was **rejected** — it destroys the cross product, the only thing FR-014 needs (*"the distribution of preferred day/time slots"*, answering *"which day should we run the next networking breakfast?"*); a member choosing {Tue, Sat} × {morning, evening} would be recorded as free for four slots when she meant two. An inner scroll box was also rejected: a scroll trap inside a scrolling page, invisible to `Ctrl+F`. The matrix below costs ~440px instead of ~1,000; it is answerable in **1 tap** (flexible), **2** (two whole days) or **4** (all mornings), still exactly expressible at 21 taps; its row and column toggles cost **zero** extra targets because the label column and header row existed anyway; and it stays `required`, because "I'm flexible" makes the requirement cost one tap and the error names that escape hatch.

```
┌─ 320px ────────────────────────────────────┐
│ ── 4 of «T» · Events     3 questions ───── │
│ What kinds of events would you love to   * │ 10 chips. ChoiceChipGroup =
│ attend?                     3 chosen       │ real checkboxes, the chip is
│ Which days and times usually work best   * │ the <label>; the count is
│ for you?  "Tap any slot that could work —  │ debounced 500ms into the
│  we're just looking for a pattern."        │ SHARED polite region
│ [ ☐ I'm flexible — any day or time works ] │ ← FIRST tab stop; one tap
│         Morn    Aft     Eve                │ satisfies the question
│        [ all ] [ all ] [ all ]             │ header buttons = column
│   Mon ⇢[     ] [     ] [     ]             │ toggles (aria-pressed); the
│   Tue ⇢[  ✓  ] [     ] [     ]             │ day label = row toggle. Cells
│    ⋮       ⋮       ⋮       ⋮               │ are real checkboxes with
│   Sun ⇢[     ] [     ] [     ]             │ visually hidden names
│ Morn = before 12 · Aft = 12–5 ·            │ ("Tuesday morning"); a 56px
│ Eve = after 5             3 selected       │ label column + three 63px
│ How often would you like events?         * │ cells fit the 288px usable
│ ( ) Weekly ( ) Fortnightly (•) Monthly     │ width. DEFECT 4 FIXED: RADIO,
│ ( ) Quarterly                              │ so "Weekly + Quarterly" is
└────────────────────────────────────────────┘ unrepresentable, not just
                                               discouraged
```

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Sections mounted, nothing answered | As drawn; matrix live, "I'm flexible" unticked | Fieldsets + legends; nothing announced on paint |
| Loading | N/A — branch and option content ship with the form config; there is no per-section request | — | — |
| Empty | Group not chosen → **the branch card does not exist**; it is unmounted, not empty | Nothing renders between section 2 and Events | Nothing in the DOM, tab order, heading tree or payload — the mechanism enforcing J2's guarantee |
| Error | Submit with a required field unanswered | `Badge` `2 to fix` on the heading; inline messages: *"Pick at least one kind of event."* / *"Pick at least one slot, or tick 'I'm flexible'."* / *"Choose how often you'd like events."* | Chip-group and matrix errors attach to the `<fieldset>` via `aria-describedby` — **never** to the 21 individual cells. One control, one error |
| Success | Every required field answered | The heading gains `Done`. Community shows `Done` from first paint, having no required fields — itself a length signal | Heading reads *"4 of «T», Events, completed"* |
| Disabled | "I'm flexible" ticked → 21 cells and 10 toggles `disabled` and dimmed. Branches are never disabled — a branch is mounted and live, or not mounted | The grid stays **visible** so she can see what she opted out of and untick to get it back (`EventFilters.jsx`'s idiom, right here because the grid is a dependent control; wrong for a branch, where a disabled Business fieldset would still sit in Carla's heading tree) | Native `disabled` removes them from the tab order; the wrapper `aria-describedby` a hidden note — *"Day and time choices are turned off because you said you're flexible."* Prior selections are **retained in state and restored** on unticking, but excluded from the payload while flexible is on |

**Accessibility and layout (non-obvious only).** Sections are `<section>` inside the single `<form>` — deliberately **not** `role="region"` + `aria-labelledby`, which adds rotor stops for information the heading tree already carries. The matrix gets **no heading**: it is one question and its `<legend>` carries the text; promoting it would imply it is a section, the exact perception this design shrinks. It uses plain checkboxes rather than `role="grid"` on purpose — a grid asks the member to hold a two-dimensional coordinate space announced as row and column headers, whereas 21 fully named checkboxes need no spatial model at all. Tab order is **`I'm flexible` → the three column toggles → `Mon` → Mon's three cells → `Tue` → …**, so a keyboard user finishes in one, two or four stops without ever entering the cells. Focus is never moved into a newly mounted branch — S2's announcement, worded *"Career questions added, 4 questions"*, is what tells a non-sighted member where to navigate with `H`. Each chip group's `<legend>` carries the question **plus its hint**, so it is re-announced on entry rather than relying on memory after 18 checkboxes, and chips must not change width on selection: a wrapping group that reflows on every tap is unusable one-handed (a layout rule, not a motion rule). The matrix's header labels and abbreviation legend may be 14px, because the 16px rule governs `input`/`textarea`/`select` and applying it to every label would push the grid past 320px. **≥768px:** cells widen and headers show full words, so the abbreviation legend drops; a `Weekdays / Weekend / Clear all` shortcut row appears — deliberately **not** at 320px, where three more targets would undo the saving that is the whole point; business name / website / Instagram pair into two columns, the one place a two-column form is safe.

#### Screen S4 — Closed form (FR-009)

**Purpose:** tell a member who arrived at a live URL that intake is paused, in GPC's own voice, and send them somewhere useful instead of nowhere. **Entry:** `open = false` on load, or a `form_closed` response mid-session. **Exit:** `/whats-on`, `/directory`, the newsletter, `/`.

```
┌─ 320px ────────────────────────────────────┐
│ Join GPC Mums in Business & Work           │ <h1> — the same heading as the
│ ── ⏸ Sign-ups are paused ───────────────── │ open form; the page's identity
│  "We've closed the form for a little while │ does not change because its
│   so we can catch up with everyone who's   │ state did. ADMIN-AUTHORED
│   already joined. We'll open it again      │ (FR-009), plain text (FR-020),
│   soon."                                   │ whitespace-pre-line so the
│ ── In the meantime ─────────────────────── │ admin's line breaks survive
│ 📅 See what's on — events for local     →  │ whole-row links; each accessible
│ 🔎 Browse the directory — businesses    →  │ name is the full pair, so the
│ ✉  Get the weekly newsletter — we'll    →  │ rotor's link list reads as
│    say when sign-ups reopen                │ sentences, not three "→"s; the
│ [          Back to home              ]     │ last reuses NewsletterBanner
└────────────────────────────────────────────┘
```

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Config loaded, `open = false` | As drawn. **No form fields exist anywhere in the DOM** — not hidden, not `disabled`, **absent**: a closed form must not be 25 dead inputs a keyboard or screen-reader user tabs through before discovering there is nothing to do | Static content in document order; **not** a live region — the member arrived here, they did not watch it change |
| Loading | Config fetch in flight | The open form's skeletons, **not** this state. The closed state is never the default while the answer is unknown | `aria-busy`; the polite region resolves to *"Form ready…"* or *"Sign-ups are currently paused."* |
| Empty | Admin message blank or whitespace | *"We've closed the form for now. We'll open it again soon — sign up to the newsletter below and we'll let you know."* Never an empty card, never a raw `null` | Same as Default |
| Error | Config fetch failed | **Not this screen** — S1's config-error state with a retry. Fail-closed misrepresents a decision GPC never made; fail-open lets a member fill 25 fields and then be rejected. Fail-*explicit* is the only honest option | The page's single alert region |
| Success | N/A — nothing submits here except the reused newsletter form, which owns its own states | — | — |
| Disabled | N/A — the point is that the form is absent rather than dead. *(Mid-session variant: a 409 replaces the page with this screen plus a leading `tabindex="-1"` alert, focused — "Sorry — sign-ups closed while you were filling this in. Nothing was saved." We do not promise recovery we cannot deliver, and we do not leave 25 filled fields on screen implying they might still go somewhere.)* | — | — |

**Accessibility and layout (non-obvious only).** No `<form>` element is rendered at all. The ⏸/📅/🔎/✉ glyphs are `aria-hidden`, with the meaning carried by adjacent text. The reused `NewsletterBanner` inherits the **global** reduced-motion reset (A20) and the shared `Spinner` (A7), so no per-screen gating is needed — which is precisely why A20 is global rather than scoped to the new routes; its email input must be verified at ≥16px, since the closed page is where it will get the most use. **≥768px:** the three alternatives become a 3-up grid and the notice caps at `max-w-2xl`.

#### Screen S5 — Confirmation

**Purpose:** confirm the answers are saved, say honestly what happens next (which differs for Bea and Carla), and hand the member somewhere to go. FR-001 requires the form to be **replaced** by this state, not merely followed by a message. **Entry:** a 2xx from `POST /api/join` — and identically for a duplicate (FR-007) and a honeypot discard (FR-006). **Exit:** `/directory`, `/whats-on`, `/`, `/privacy`.

```
┌─ 320px ────────────────────────────────────┐
│            ( ✓ )                           │ aria-hidden
│ You're in, Bea.                            │ <h1> tabindex="-1" — FOCUS
│ Thanks for joining GPC Mums in Business &  │ LANDS HERE
│ Work. We've saved your answers.            │
│ ── What happens next ───────────────────── │ a real <ol>, so "list, 4 items"
│ 1. Your directory listing is with us for   │ is announced — itself
│    review. A GPC admin checks every        │ reassurance that the process
│    listing before it goes live. We usually │ is finite. ← A9: NOT "within 5
│    review new listings within a week.      │ working days", which is an
│ 2. Once approved it'll appear on the       │ internal median target and
│    directory and anyone can find it.       │ never a promise GPC made
│ 3. If we need to check anything we'll      │
│    email the address you gave us.          │ ← item 4 ONLY if the newsletter
│ 4. You'll start getting the newsletter.    │ box was ticked; else omitted
│ ── 🔒 What stays private ───────────────── │ restates FR-003's promise AFTER
│ Your email, postcode, first name and every │ the fact — the moment people
│ answer you gave stay inside GPC. They are  │ most want reassurance.
│ never shown on the directory. Changed your │ FR-023 · links to /privacy ·
│ mind? Ask us to remove your listing or all │ the contact is the real
│ your data at any time — see our privacy    │ address, not a hedge
│ page, or email gpc.communitynews@gmail.com │
│ [ Browse the directory ] [ See what's on ] │ primary + outline
└────────────────────────────────────────────┘
```

**Carla's variant, differences only:** *"You're in, Carla."*; the list loses the listing, review and newsletter items and becomes (1) *"We've added you to the GPC Mums in Business & Work community."* (2) *"We use your answers to plan events people can actually come to — that's the whole reason we asked."* (3) *"Watch out for our next event."* — item 2 pays back the survey questions. The buttons become `See what's on` / `Back to home`. There is no generic "thanks!" fallback: every member sees a list describing *their* submission. **≥768px:** content caps at `max-w-2xl`, the two cards sit side by side, and the buttons become a row with primary left. **Rendered from the request payload the client sent, never from the database (A2)** — a security property, not a preference: reading back stored records would tell a honeypot-caught bot that no record exists, and tell a duplicate submitter their email was already registered, breaking FR-006 and FR-007's non-disclosure rule. The first name comes from in-memory client state — never a URL parameter, query string or route segment — so it appears in no shareable link, referrer, analytics path or history entry. If a build ever needs to survive a reload here it must re-render the generic *"You're in."* rather than persist the name.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | 2xx received | As drawn, tailored by `{ listingRequested, newsletterConsented, group }` | `<h1 tabindex="-1">` takes focus ~100ms **after** the polite region announces *"Your answers have been sent. Your directory listing is with us for review."* — the live region gives the outcome, focus gives navigable position, in that order |
| Loading | Submit in flight | **This screen does not exist yet.** The form stays on screen; Submit shows the shared `Spinner` and *"Sending…"*. Fields are **not** disabled — if the request fails we want them editable and focusable | Submit `aria-busy`/`aria-disabled`; polite region: *"Sending your answers"* |
| Empty | N/A — the list always has at least the community item | — | — |
| Error | N/A — by the time this renders the write has succeeded (NFR-011). A downstream partial failure (e.g. a notification email) must **not** downgrade this screen; it surfaces to admins | — | — |
| Success | This screen *is* the success state | — | — |
| Disabled | N/A — two links, neither disabled | — | — |

**Accessibility (non-obvious only).** The `<h1>` **replaces** the form's, so there is still exactly one. Focus goes to the heading, not the first button: a member who cannot see the screen needs the outcome before the options, and the heading is where `H`-key navigation resumes. **No confetti, in either motion mode** — a full-screen particle effect on a page that has just handled someone's personal data reads as flippant. **Back-button:** the route is still `/join`, so Back leaves the page rather than returning to a filled-in form; D5 makes a duplicate harmless, but inviting one is still a bad experience.

#### Screen S6 — Submission errors

**Purpose:** never lose 25 answers, never blame the member for our failure, always name the next action. **Entry:** a non-2xx or a failed `fetch`. **Exit:** back into the form, or S4. **Universal rule:** the form and every answer in it **stay on screen and stay editable** — nothing is cleared, nothing is disabled, no field loses its value. Only two things change: an alert appears above Submit, and Submit becomes actionable again.

```
┌─ 320px ────────────────────────────────────┐
│ … Privacy & consent (the last section)     │
│ ── ⚠ There are 3 things to fix before we   │ ErrorSummary — the page's ONE
│      can send this ─────────────────────── │ role="alert" region,
│ • Your email address — enter an email      │ tabindex="-1", and ALWAYS
│   address so we can reply                  │ focused on failure (A1). A
│ • Which group would you like to join? —    │ <ul> of links in DOM order, so
│   choose the group you'd like to join      │ the list matches the form;
│ • Which days and times work? — pick at     │ link text = the field's own
│   least one slot, or tick "I'm flexible"   │ label + the fix. Singular:
│ [         Send my answers            ]     │ "There's 1 thing to fix…"
└────────────────────────────────────────────┘ ↑ the summary sits ABOVE the
                                                 submit button (DESIGN.md §2.10)
```

Placement is the point — on a 320px screen a member who scrolled down to press Submit must see the result without hunting for it — and the banner is **never** a floating toast at any breakpoint (A6) — a toast can be missed, cannot be re-read, and is the wrong shape for an error that requires acting on specific fields elsewhere on the page. **≥768px:** it caps at `max-w-2xl` with the form column, its action button becomes inline-width, and the links go to two columns past six entries.

| Kind | Trigger | Heading + body | Action |
|---|---|---|---|
| **validation** | ≥1 rendered required field unanswered or invalid (client), or a 400 rejecting a field such as over-length text (server) | *"There are «n» things to fix before we can send this"* + one link per error. Server field keys map to the same client messages; unmapped keys fall back to *"Something in this answer isn't accepted. Please shorten or simplify it."* | Each link focuses its field |
| **network** | `fetch` rejected, or no response | *"We couldn't reach GPC just now"* / *"Your answers are still here. Check your connection and try again — nothing has been lost."* | `Try again` re-posts with the **same idempotency key** (D5), so a retry after a response we never saw cannot create a second record |
| **rate_limited** (429) | FR-006 threshold exceeded | *"Just a moment"* / *"You've sent this a few times in a row. Please wait a moment and try again. Your answers are still here."* **Never** *"you look like a bot"* — a real member on shared café or nursery wi-fi will hit this and must not be accused | `Try again in 47s`, counting down; announced at 60s / 30s / 10s / ready only, **never per second** |
| **server** (5xx, or a non-JSON body) | Any other non-2xx, or `res.json()` threw | *"Something went wrong at our end"* / *"That's our fault, not yours. Your answers are still here — please try again in a moment. If it keeps happening, email gpc.communitynews@gmail.com."* | `Try again` |
| **form_closed** (409) | Admin closed the form mid-session | The page is **replaced** by S4 with its leading alert | `Back to home` |

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | No error | The summary is **not rendered at all** — not rendered-empty. A permanently-present alert container has a habit of announcing stale content on re-render | — |
| Loading | Submit in flight | Any previous summary is removed at the *start* of the request, so a stale error never sits next to a live spinner | Polite region: *"Sending your answers"* |
| Empty | N/A — an error state with no errors is the Default state | — | — |
| Error | Any row above | As above | `role="alert"`; focus moves to the summary on the next animation frame, **always**, whatever the count |
| Success | N/A — success replaces the whole form (S5) | — | — |
| Disabled | Rate-limited only; no field is ever disabled by an error | Submit shows the countdown | `aria-disabled="true"` rather than the `disabled` attribute, so the button stays focusable and a screen-reader user can read the countdown off it |

**Accessibility (non-obvious only).** **Duplicate submission has no error state here and must never gain one:** FR-007 requires the response never reveal whether the email was already registered, so a duplicate renders S5 identically to a first submission — a *"you've already joined"* message would be an email-enumeration oracle on an unauthenticated public endpoint, leaking membership of a group whose members may not want that known. Exactly **one** assertive announcement fires per failed submit; per-field messages are `aria-describedby` text with `aria-invalid="true"` and are **not** alert regions (D6), so the summary does all the announcing — which also removes the need for the draft's fiddly "role=alert only when they appear individually" rule. Focus is **never** moved to the retry button: that would let a member re-submit by reflex before reading why the last attempt failed. From the summary's last link, Tab continues into the form, so the summary is never a trap. Errors clear on `blur`, not on `change`, so a message never vanishes mid-typing. **No shake, in either motion mode** — it communicates nothing a red border and a sentence do not.

### NFR-009, second clause — the `/join` weight budget

**`/join`'s initial render adds no more than 50KB gzipped over the existing site shell.** This section owns that clause, and the component count is what puts it at risk: `/join` specifies roughly a dozen net-new components (`LengthSignal`, `FormSection`, `TextField`, `PostcodeField`, `RadioGroup`, `ChoiceChipGroup`, `LongTextField`, `DayTimeMatrix` plus four internals, `ErrorSummary`, `SuccessPanel`, `ClosedNotice`). Consequences, all binding:

- **No form library, no validation library, no state-machine library, no data-fetching library.** `react-hook-form` (~25KB) plus a schema validator (~13KB) would spend three-quarters of the budget before a single field renders. `/join` uses the flat state object and hand-rolled submit already established by `NewsletterBanner.jsx` and `LondonEventForm.jsx` (NFR-012). The dozen components are **markup, not machinery**: `DayTimeMatrix` is 21 native checkboxes and 10 toggle buttons; the reason it is plain checkboxes rather than an ARIA grid is accessibility first and payload second, but both point the same way.
- **`/join` is a lazily-loaded route**, so its weight never lands on visitors who never join, and the 50KB is measured on the built chunk rather than estimated from source. Icons are imported individually (tree-shaken), never from a barrel.
- **Shared primitives come out of the shell, not this budget** — `Button`, `Card`, `Badge`, the one shared `Spinner` (A7) and the one `Dialog` (A14) serve the whole feature, and extracting `Spinner` once is cheaper than five copies of `animate-spin`. Motion adds nothing either: framer-motion is already in the shell, and the `prefers-reduced-motion` reset is global CSS (A20), not per-component JavaScript. **Form config is fetched, not bundled**: labels, options and the open flag arrive as JSON, outside the JS budget and capped separately at 20KB gzipped. It is on the critical path, so it is requested with the page shell and covered by skeletons (A7) — never lazily after paint, which would briefly make the closed state indistinguishable from a loading one.

## Notes for architecture

- The payload needs a **form-start elapsed-seconds integer** (non-personal) for NFR-007's post-launch median. No FR names it; it must exist in the data model and be disclosed if retained. The **idempotency key**'s server-side lifetime and collision behaviour are likewise undefined — D5 specifies only the client half. The **rate-limit window and threshold** are undecided too; *"Try again in 47s"* needs a real number, and a window measured in minutes changes both the copy and the control. **`sessionStorage` draft-saving** for tab discard is the obvious mitigation and is deliberately unspecified: whether a same-tab draft of pre-consent answers counts as processing is a controller call, not a UX one. **Roving tabindex for the day/time matrix is deferred.** Plain Tab is fully conformant, has no custom-widget bug surface, and the row/column toggles mean no keyboard user is forced through 21 stops. An ARIA grid is the upgrade path if testing says otherwise.
- **The seeded config carries three defect fixes**, not component code: the de-duplicated C1 list (10 options), the "Weekly newsletter" typo, and `required = false` on B7 / C4 / "What do you hope to gain". **A "No preference" option for event frequency** is recommended but not added: single-select (defect 4) means a member with genuinely no preference must now pick one. Within FR-008's admin powers, but PM sign-off — as is whether a last name is collected, which would add a field to S1 and change every computed `«N»`, and **whether the admin-authored intro and closed message may contain a link**. Both currently render as plain text with preserved line breaks (FR-020's principle applied to admin-authored config). Allowing links is a config-shape change, not a copy change.
- **D4 is an inference, not a stated requirement** — FR-002 and FR-003 both claim the same three fields and the PRD never resolves the overlap. Asking twice is indefensible, and moving the fields would contradict FR-002's explicit seven.
