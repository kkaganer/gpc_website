# EXPERIENCE.md — Section 1: The Public Membership Form (`/join`)

**Covers:** FR-001, FR-002, FR-009, NFR-007, NFR-008
**Companion sections (owned elsewhere):** the directory opt-in fields (FR-003) and the granular
consent block (FR-004) are specified in their own section. This section shows *where they sit in
the flow* and *how the member gets to them*, and stops at their boundary.
**Source of truth for tokens, personas and constraints:** `bmad-output/ux-shared-context.md`.
**Source of truth for the field inventory:** `bmad-output/inputs/tally-form-RG1M6K-structure.md`.

---

## 0. Decisions taken in this section (read first)

These four decisions shape every screen below. They are recorded here so the rest of the document
can just reference them.

### D1 — One long page, not a stepped flow

**Decision:** `/join` is a **single scrolling page** made of seven named sections (eight when the
member picks "Both"). There is one Submit button, at the bottom. There are no Next/Back buttons,
no step router, no per-step validation gate.

**Justified against NFR-007 (five-minute median):**
- A stepped flow adds a mandatory tap plus a re-render between every section. At seven sections
  that is six extra interactions that do no work, on a device where each tap costs a moment of
  re-orientation. The persona ("phone, evenings, tired", "in fragments, often between other tasks")
  is the wrong persona to charge six taps of pure navigation.
- A stepped flow makes the branch moment worse, not better. If the group question is step 2, the
  member cannot see that steps 3–7 are short; all they know is that there are more steps. A single
  page lets them thumb-scroll to the bottom in one gesture and *see* that the end exists. Perceived
  length is dominated by "can I see the end?", and only a single page answers that question honestly.
- Interruption recovery is free. If Carla backgrounds Safari mid-form and returns, one page with
  in-memory state survives; a stepped flow that keeps step position in the URL or in router state
  gives her a step number and no answers, which is worse than useless.

**Justified against the codebase (NFR-012):**
- There is **no multi-step form anywhere in this repo**, no form library, no state-machine library,
  and no data-fetching library. The two public/admin form precedents (`NewsletterBanner.jsx`,
  `LondonEventForm.jsx`) are both single-render forms with a flat state object and one submit.
  A stepped flow would be a net-new architectural pattern maintained by one part-time developer.
- The one precedent that *is* directly reusable — `EventFilters.jsx`'s "dependent controls are
  dimmed + disabled, never hidden" idiom, and its flat filter state — is a single-surface pattern.
  Conditional branch reveal on one page is the same shape of problem.

**Justified against NFR-008 (WCAG 2.1 AA):**
- Multi-step forms fail most often on focus management between steps and on announcing "you are now
  on step 3 of 7". Both are avoidable bugs. A single page has one focus context, one document
  outline, and one heading tree a screen-reader user can navigate with `H`.
- FR-002's discard rule is far easier to make *correct and announceable* on one page: the member can
  hear "Business questions removed, Career questions added" and then immediately encounter the
  changed content, rather than being told about a step they cannot currently see.

**What we give up, and how it is covered:** the psychological "small chunks" benefit of steps. That
is recovered by D2.

### D2 — How a ~25-field form is made to feel short

Seven techniques, all specified concretely on the screens below:

1. **Honest, adaptive length signal at the top.** "About 4 minutes · 17 questions" for a Career Mum;
   "About 5 minutes · 27 questions" for a Business Mum who wants a listing. The number **recomputes
   and is announced** when the group answer or the directory answer changes. Never a fixed marketing
   number — an honest one that goes *down* for Carla is the single strongest anti-abandonment device
   available, and the source form gives us that for free because the Career branch is genuinely shorter.
2. **Numbered, named, counted sections.** Each section is a `Card` headed `2 of 7 · Your group` with
   a right-aligned `1 question`. Small numbers repeated seven times read as short; one big form reads
   as long.
3. **Completion ticks.** When every *required* field in a section is answered, the section heading
   gains a ✓ and the count changes to `Done`. This is the "steps" reward without the steps.
4. **Aggressive de-requiring of open text.** Source-form defect 9 (every branch question required,
   including three long-text ones) is the largest single abandonment risk in the inventory. The
   three long-text questions — B7 "What challenges are you facing?", C4 "Your biggest career
   challenge", and Community "What do you hope to gain?" — ship with `required = false`. FR-008
   lets an admin change that later without a deploy. Recorded in Gaps for PM sign-off.
5. **A one-tap exit from the worst question.** The 21-checkbox day/time grid gets an "I'm flexible —
   any day or time works" checkbox that satisfies the requirement in one tap (see Screen S4).
6. **A decorative, scroll-linked progress rail** — 6px, sticky under the navbar, `aria-hidden`.
   Scroll-linked, **not** answer-linked: an answer-linked bar visibly goes *backwards* when the
   member picks "Both" and the denominator grows, which is a demotivator arriving at exactly the
   wrong moment.
7. **Nothing is asked twice.** Where the Business branch already captured business name, website and
   Instagram (B3/B4/B5), the directory section arrives **pre-filled** from them (see D4).

### D3 — Required-field errors on submit

**On an invalid submit the page does three things, in this order:**

1. Renders an `ErrorSummary` `Card` immediately above section 1, with `role="alert"`, a heading
   `"There are 3 things to fix before we can send this"`, and one link per error. Each link's text
   is the field's own label plus the fix: `"Your email address — enter an email address so we can
   reply"`. Activating a link moves focus to that field.
2. On the next animation frame, moves focus to **the first offending field** (`FR-001` requires this
   literally: *"the first offending field receives focus"*).
3. Marks every offending field `aria-invalid="true"`, gives it an inline message tied by
   `aria-describedby`, and adds a `Badge` (**NEW `error` variant**) reading `2 to fix` to the heading
   of every section containing an error.

The summary is rendered *before* focus moves so the assertive region is announced, then the newly
focused field announces its own label and description. Two utterances, in a predictable order.

**Rejected alternative:** focusing the summary itself (the GOV.UK pattern, and the one most a11y
practitioners would reach for). Rejected because FR-001's acceptance criterion names the field, not
the summary. The double-announcement is flagged in Gaps for verification during the NFR-008
screen-reader pass.

**Only visible questions are validated.** FR-002: hidden-branch questions are never required and
never contribute to the summary count.

### D4 — Business fields appear in two places; they are pre-filled, not re-asked

FR-002 fixes the Business branch at seven questions, three of which are business name, website and
Instagram (B3/B4/B5, all optional). FR-003 independently requires the directory section to ask for
business name (required), website and Instagram. Asking twice would be the most conspicuous
usability failure in the whole form.

**Resolution:** when the directory section opens and the Business branch was answered, business
name, website and Instagram arrive **pre-filled from B3/B4/B5**, fully editable, under the note:

> "We've copied these from your business answers above. Edit them if you'd like them to read
> differently in the directory."

Both FRs are satisfied: seven business questions render, and the directory section requests its six
fields. A Career Mum who opts in has nothing to copy from and types them fresh — which FR-003
explicitly requires her to be able to do.

---

## 1. Journey A — Bea joins as a Business Mum and requests a directory listing

**Goal:** Bea gets her small local business into a directory that local parents actually read,
without her home postcode or her personal email ending up on the public internet.

**Primary persona:** Bea — Business Mum. Runs a childminding/coaching/baking/therapy practice from
home. Motivated by visibility, but genuinely anxious about address and email exposure. On a phone,
in the evening, tired.

**Estimated time:** 4:30–5:30 minutes. 27 questions visible, **18 required**. This is the long path
and it is the one NFR-007's five-minute median is measured against.

**Entry points:**
- Public navbar item `Join` (new entry in the array at `src/components/layout/Navbar.jsx:8-14`).
- Homepage CTA.
- The public directory index: `"Run a local business? Add your listing"` — the highest-intent entry
  point, because she has just seen what a listing looks like.
- Instagram bio link and the weekly newsletter.
- A redirect from the retired `tally.so/r/RG1M6K` URL (PRD Assumption 6).

**Success criteria:**
- She reaches the confirmation state and it tells her, unambiguously, that her listing is *pending
  review* and is not yet public (FR-001).
- Before she typed a single business detail, she read which six fields become public and which four
  categories of data never do (FR-003).
- She gave three separate consents, none of which were pre-ticked (FR-004).
- Her postcode and signup email are nowhere in the public payload (FR-011, NFR-001).
- She never had to type her business name twice (D4).

### Happy Path

```
   Instagram bio  ·  newsletter  ·  /directory "Add your listing"  ·  navbar
                                  │
                                  ▼
                    ┌──────────────────────────────┐
                    │  GET /join                   │
                    │  fetch form config           │
                    │  (labels, options, open flag)│
                    └───────────────┬──────────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     │                             │
                 open = true                  open = false
                     │                             │
                     │                             ▼
                     │                   [S5 · Closed state]  FR-009
                     ▼
   ╔══════════════════════════════════════════════════════════╗
   ║ S1 · "About 5 minutes · 20 questions"                    ║
   ║ 1 of 7 · About you        4 q                            ║
   ║   first name* · email* · postcode* · how did you hear*   ║
   ╚═══════════════════════════┬══════════════════════════════╝
                               ▼
   ╔══════════════════════════════════════════════════════════╗
   ║ 2 of 7 · Your group       1 q                            ║
   ║   ( ) Business Mums   ( ) Career Mums   ( ) Both         ║
   ║        └── selects "Business Mums"                       ║
   ╚═══════════════════════════┬══════════════════════════════╝
                               │  branch reveal, 200ms
                               │  live region: "Business questions added.
                               │  7 questions. The form now has 7 sections."
                               │  length signal: 20 → 20 (unchanged)
                               ▼
   ╔══════════════════════════════════════════════════════════╗
   ║ 3 of 7 · Your business    7 q                            ║
   ║   B1 stage*        B2 industry*      B3 business name    ║
   ║   B4 website       B5 Instagram      B6 looking for*     ║
   ║   B7 challenges (optional, long text)                    ║
   ╚═══════════════════════════┬══════════════════════════════╝
                               ▼
   ╔══════════════════════════════════════════════════════════╗
   ║ 4 of 7 · Events           3 q                            ║
   ║   event types*  ·  day × time matrix*  ·  frequency*     ║
   ║                       └── "I'm flexible" = 1 tap         ║
   ║                       └── frequency is RADIO (defect 4)  ║
   ╚═══════════════════════════┬══════════════════════════════╝
                               ▼
   ╔══════════════════════════════════════════════════════════╗
   ║ 5 of 7 · Community        2 q                            ║
   ║   what you hope to gain (optional) · get involved (opt.) ║
   ╚═══════════════════════════┬══════════════════════════════╝
                               ▼
   ╔══════════════════════════════════════════════════════════╗
   ║ 6 of 7 · The GPC directory                               ║
   ║   "Would you like to be listed?"   (•) Yes   ( ) Not now ║
   ║        └── selects Yes                                   ║
   ║   ┌────────────────────────────────────────────────────┐ ║
   ║   │ PUBLIC / PRIVATE NOTICE  (FR-003) — read before    │ ║
   ║   │ any field is shown                                 │ ║
   ║   └────────────────────────────────────────────────────┘ ║
   ║   business name* (pre-filled from B3)                    ║
   ║   category*  ·  description* (live count)                ║
   ║   website (from B4) · Instagram (from B5)                ║
   ║   public enquiry contact*  ← NOT the signup email        ║
   ╚═══════════════════════════┬══════════════════════════════╝
                               │  if public contact == signup email
                               │  → inline confirm (addendum FR-003)
                               ▼
   ╔══════════════════════════════════════════════════════════╗
   ║ 7 of 7 · Privacy & consent                    FR-004     ║
   ║   [ ] hold my data*        [ ] publish my listing*       ║
   ║   [ ] weekly newsletter  (optional, never pre-ticked)    ║
   ╚═══════════════════════════┬══════════════════════════════╝
                               ▼
                        [ Send my answers ]
                               │
                               │  POST /api/join
                               │  + honeypot, origin check, rate limit (FR-006)
                               │  + form-start elapsed seconds (NFR-007 metric)
                               ▼
                  ┌────────────┴────────────┐
                  │                         │
                2xx                     non-2xx
                  │                         │
                  ▼                         ▼
        [S6 · Success]              [S7 · Error states]
        "Your listing is with        network · validation ·
         us for review"              rate-limited · closed ·
                  │                  server
       ┌──────────┴──────────┐
       ▼          ▼          ▼
  /directory     /        /privacy
```

### Decision Points & Alternative Paths

| Trigger | Display | Recovery |
|---|---|---|
| Form config fetch fails on load | Full-page state: `"We couldn't load the form just now."` + `"This is our end, not yours. Try again in a moment."` + `Button` "Try again" (outline). **Never** falls back to the closed state — a failed fetch must not be mistaken for an admin decision, and must not be mistaken for "open" either (submissions would be rejected downstream). | "Try again" refetches. After two failures the copy adds `"Still stuck? Email us — the address is on our privacy page."` |
| Admin closed the form between page load and submit | On the 409 response, the form is replaced by the closed state with a leading line: `"Sorry — sign-ups closed while you were filling this in. Nothing was saved."` | The admin-authored closed message follows. `Button` "Back to home". State is not recoverable and we say so rather than implying it might be. |
| Bea changes "Business Mums" → "Career Mums" after answering business questions | `ConfirmDialog` (see Screen S2). FR-002 requires discard; the dialog is the only warning she gets. | "Keep Business Mums" cancels; focus returns to the radio she was on and nothing changes. |
| Bea opts into the directory but selected only "Career Mums" earlier | Directory fields appear with nothing pre-filled. FR-003 explicitly requires this path to work — it is the fix for source-form defect 1. | None needed; it is a supported path, not an error. |
| Bea types her signup email into "public enquiry contact" | Inline warning below the field, `role="alert"`: `"That's the same address you signed up with. It would be shown publicly on your listing. Use it anyway?"` + a checkbox `"Yes, publish this address"`. Submission is blocked until she either changes it or ticks. (Addendum, FR-003 overflow.) | Changing the value clears the warning and the checkbox. |
| Description exceeds its character limit | Live remaining count turns to `"18 over"` in `#b91c1c`; the field goes `aria-invalid`; submit is blocked with `"Your description is 18 characters too long. Trim it and we'll save it exactly as you write it."` Never silently truncated. | Editing restores the count. |
| Bea submits with required fields missing | `ErrorSummary` per D3. | Each summary link jumps to its field. |
| Bea double-taps "Send my answers" | Button enters `loading`: label `"Sending…"`, `aria-disabled="true"`, `aria-busy="true"`, pointer events off. The second tap does nothing. | N/A. |
| Rate limit hit (FR-006) | `"You've sent this a few times in a row. Please wait a moment and try again."` + a countdown on the disabled submit button. Never `"you look like a bot"` — a real member on shared café wi-fi will hit this. | Countdown expires, button re-enables. Answers untouched. |
| Bea has submitted before with this email | **Nothing different is shown.** FR-007: the ordinary confirmation state, because the response must never reveal whether an email is already registered. | N/A by design. |
| Honeypot completed (bot) | The ordinary success state (FR-006). No listing, no moderation task, no member record. | N/A. |

### Drop-off Risk Notes

**The riskiest moment is section 6, not section 3.** Bea has already invested four minutes by the
time she is asked to nominate a public contact. That question asks her to make a decision she has
probably never made before — "which of my contact details am I willing to put on the open web?" —
while tired, on a phone. PRD Risk register already names this ("Members will not nominate a separate
public contact and put their personal email in anyway"). The mitigation here is that the
public/private notice appears **above** the fields, not beside the submit button, so she is thinking
about the boundary *before* the field asks her to act on it, and the warning-plus-confirm on the
signup-email case makes the consequence explicit at the exact moment she would otherwise do the
wrong thing. It is a friction we are adding deliberately.

**Section 3 is the second risk, for a different reason.** B7 "What challenges are you currently
facing?" is a long-text question at minute two, and in the source form it is *required*. A tired
member with a paragraph to write will close the tab. Making it optional (D2.4) is the single cheapest
completion-rate intervention available; it costs FR-014 some qualitative depth, which is a trade the
PM should confirm rather than one this document should quietly make.

**Section 4's day/time grid is the third risk and the worst *visual* one.** Rendered as the source
form renders it — 21 stacked checkbox rows — it is roughly 1,000px of scroll for one question on a
320px screen, more than a third of the whole form's height. A member thumb-scrolling to "see how
long this is" hits that wall in section 4 and forms an impression of the form's length that is
wrong by a factor of three. Screen S4 fixes this.

**Where she will *not* drop off:** the branch moment. She picks "Business Mums", seven questions
appear, and the length signal at the top does not move (20 → 20) because the estimate was already
computed against her likely branch. Growth in the visible form at the moment of committing is what
punishes people; here nothing grows.

**A real risk this design does not solve:** iOS Safari discarding a backgrounded tab. Bea is
interrupted, comes back twenty minutes later, and the form is empty. FR-D07 (save and resume) is
explicitly deferred because identifying a partial submitter before consent is itself processing.
There is currently **no mitigation** other than keeping the form to five minutes. Recorded in Gaps.

---

## 2. Journey B — Carla joins as a Career Mum and declines the directory

**Goal:** Carla gets support and connection with a community of other mothers, in as few taps as the
form can honestly manage, and is never asked about a business she does not have.

**Primary persona:** Carla — Career Mum. Employed or returning after leave. Wants support, not a
listing. **Will abandon the moment she is asked a business question that does not apply.** On a
phone, in fragments, between other tasks.

**Estimated time:** 2:15–3:00 minutes. 17 questions visible, **13 required**, **0 business questions**.

**Entry points:** the same as Journey A, minus the directory index (she is not coming from there),
plus one that matters more for her — a link in a GPC WhatsApp group or an event follow-up message,
tapped one-handed while doing something else.

**Success criteria (NFR-007's explicit test):**
- She answers **zero business questions**. Not "zero required business questions" — zero *rendered*
  business questions. B1–B7 are absent from the DOM, absent from the tab order, absent from the
  heading tree, and absent from the submitted payload.
- The visible length signal *drops* when she picks "Career Mums", and the drop is announced.
- She declines the directory and is asked **none** of FR-003's six fields.
- She reaches the confirmation state in under three minutes.

### Happy Path

```
   WhatsApp group link  ·  navbar  ·  newsletter
                                  │
                                  ▼
                    ┌──────────────────────────────┐
                    │  GET /join · config loads    │
                    │  open = true                 │
                    └───────────────┬──────────────┘
                                    ▼
   ╔══════════════════════════════════════════════════════════╗
   ║ "About 5 minutes · 20 questions"    ← pre-branch estimate ║
   ║ 1 of 7 · About you        4 q                            ║
   ║   first name* · email* · postcode* · how did you hear*   ║
   ╚═══════════════════════════┬══════════════════════════════╝
                               ▼
   ╔══════════════════════════════════════════════════════════╗
   ║ 2 of 7 · Your group       1 q                            ║
   ║   ( ) Business Mums   (•) Career Mums   ( ) Both         ║
   ╚═══════════════════════════┬══════════════════════════════╝
                               │
             ┌─────────────────┴──────────────────┐
             │  BRANCH TRANSITION                 │
             │  · Career section mounts (4 q)     │
             │  · Business section NEVER mounts   │
             │  · length signal 20 → 17           │
             │  · time estimate  5m → 4m          │
             │  · live region (polite):           │
             │    "Career questions added.        │
             │     4 questions. This form now     │
             │     has 17 questions, about        │
             │     4 minutes."                    │
             └─────────────────┬──────────────────┘
                               ▼
   ╔══════════════════════════════════════════════════════════╗
   ║ 3 of 7 · Your career      4 q                            ║
   ║   C1 current situation*   (10 options — de-duplicated,   ║
   ║                            defect 3 fixed)               ║
   ║   C2 industry*                                           ║
   ║   C3 support that would help*                            ║
   ║   C4 biggest career challenge   (optional, long text)    ║
   ║                                                          ║
   ║   ✗ NO "What stage is your business?"                    ║
   ║   ✗ NO "Which industry is your business in?"             ║
   ║   ✗ NO business name / website / Instagram               ║
   ║   ✗ NO "What are you looking for?" (business version)    ║
   ║   ✗ NO "What challenges is your business facing?"        ║
   ║   → 0 business questions rendered.  NFR-007 satisfied.   ║
   ╚═══════════════════════════┬══════════════════════════════╝
                               ▼
   ╔══════════════════════════════════════════════════════════╗
   ║ 4 of 7 · Events           3 q                            ║
   ║   event types*                                           ║
   ║   [✓] I'm flexible — any day or time works   ← 1 tap     ║
   ║        └── the 7×3 matrix dims + disables (not hidden)   ║
   ║   frequency*  ( ) Weekly (•) Monthly ( ) Fortnightly ...  ║
   ╚═══════════════════════════┬══════════════════════════════╝
                               ▼
   ╔══════════════════════════════════════════════════════════╗
   ║ 5 of 7 · Community        2 q      both optional         ║
   ║   → she skips both.  Section shows "Done".               ║
   ╚═══════════════════════════┬══════════════════════════════╝
                               ▼
   ╔══════════════════════════════════════════════════════════╗
   ║ 6 of 7 · The GPC directory                               ║
   ║   ( ) Yes, list my business                              ║
   ║   (•) No, not right now                                  ║
   ║        └── NOTHING expands. No business name, no         ║
   ║            category, no description, no public contact.  ║
   ║            FR-003: "none of these fields are requested   ║
   ║            and none are stored."                         ║
   ║   Reassurance line stays visible:                        ║
   ║   "You can ask to be listed later — just fill this in    ║
   ║    again."                                               ║
   ╚═══════════════════════════┬══════════════════════════════╝
                               ▼
   ╔══════════════════════════════════════════════════════════╗
   ║ 7 of 7 · Privacy & consent                               ║
   ║   [✓] hold my data*                                      ║
   ║   ── publish-my-listing consent NOT SHOWN (FR-004b:      ║
   ║      required only if she opted into the directory)      ║
   ║   [ ] weekly newsletter   (optional, she leaves it)      ║
   ╚═══════════════════════════┬══════════════════════════════╝
                               ▼
                        [ Send my answers ]
                               ▼
                        [S6 · Success]
              "You're in." — no listing paragraph,
              no "awaiting review", no newsletter line.
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
              /whats-on                  /
```

**Business-question count, stated for the record:** rendered `0`, in the tab order `0`, in the
heading tree `0`, in the submitted payload `0`. The Business section component is never mounted, so
there is nothing to hide, disable, or filter out at submit time. This is why branch content is
**unmounted** rather than `hidden` — a `hidden` fieldset is still a payload risk and still a
maintenance trap.

### Decision Points & Alternative Paths

| Trigger | Display | Recovery |
|---|---|---|
| Carla picks "Career Mums" first, then reconsiders and picks "Both" | **No dialog.** "Both" is a superset — nothing is abandoned. Her 3 career answers stay. The Business section mounts below the Career section. Live region: `"Business questions added. The form now has 24 questions, about 5 minutes."` | N/A. |
| Carla picks "Both", answers two business questions, then goes back to "Career Mums" | `ConfirmDialog` — the business answers are the abandoned set. See Screen S2 for exact copy. | "Keep Both" cancels. |
| Carla ticks the newsletter box | No visual change to the form. The confirmation state gains one line. FR-004: never pre-ticked, always optional; if unticked, no subscription is created **by any path**. | Untick it. |
| Carla declines the directory *after* having opted in and typed three fields | `ConfirmDialog`, same mechanism as the branch discard: `"Your listing details will be cleared. Nothing is saved and nothing is sent to GPC."` FR-003 requires that declined fields are not stored. | "Keep my listing details" cancels. |
| Carla leaves both Community questions blank | Section heading shows `✓ Done` (no required fields outstanding). No nag, no asterisk, no "are you sure". | N/A. |
| Carla ignores the day/time matrix entirely and submits | The question is required. `ErrorSummary` entry: `"Which days and times work for you — pick at least one slot, or tick 'I'm flexible'."` The recovery is named in the error text, which is the point of making the escape hatch a first-class option rather than a footnote. | One tap on "I'm flexible". |
| Carla's postcode fails format validation | Border goes `#b91c1c`, message `"That doesn't look like a UK postcode. Try something like SE10 8XJ."` Debounced 600ms, matching `EventFilters.jsx`'s existing three-state postcode idiom. Not blocking until submit. | Corrects it; border goes green. |

### Drop-off Risk Notes

**Carla's abandonment risk is front-loaded and almost entirely about relevance.** She is the persona
who quits on sight of an irrelevant question, and the form asks her four unconditional identity
questions before it knows anything about her. The mitigation is that the branch question is
**section 2 of 7** — as early as it can be without asking for her group before her name, which reads
as pushy. Everything after that point is either hers or universal.

**The postcode question is a live risk for her specifically.** She has no business and no reason to
believe GPC needs her home postcode. If it renders as a bare labelled box, a meaningful number of
Carlas will stop. The hint text is therefore not optional decoration: `"We use this to plan events
near you. It's never shown publicly and never leaves GPC."` — and it must sit *under the label,
above the input*, so it is read before the field is focused, not after.

**The second risk is the events section, which is universal but reads as effortful.** Three
questions, one of which is a 21-cell grid. For Carla — the persona filling this in "in fragments" —
the escape hatch has to be the *first* thing in the question, above the grid, not a link underneath
it. That is why "I'm flexible" is the first tab stop in the fieldset.

**The third risk is a quiet one: the directory question reads like a trap.** "Would you like to be
included in our local member directory?" is, to someone with no business, a question about whether
she will be listed *somewhere*. If the No option is not visibly and immediately consequence-free,
some Carlas will hesitate and some will bounce. The reassurance line — `"You can ask to be listed
later — just fill this in again."` — is present in both states of the question, not only after she
answers, so it is doing its work while she is deciding.

**Where she will not drop off:** the consent section. Three checkboxes, one of which is not shown to
her at all, and the required ones are one tap each. This is the section the source form got wrong
(defect 5, one undifferentiated tick), and making it *more* granular has, counter-intuitively, made
it shorter for her.

**Honest note on the "zero business questions" claim.** It holds for a Career Mum who **declines**
the directory, which is exactly the case NFR-007 names. A Career Mum who *opts in* will be asked
FR-003's six listing fields, which are business fields in substance. That is required by FR-003 and
is the deliberate fix for source-form defect 1 — but it means the NFR-007 guarantee must be quoted
precisely and not rounded up to "Career Mums never see business questions".

---

## 3. Screen S1 — Join: intro + identity

**Purpose:** Establish that this is GPC's own form (not a third-party embed), set an honest
expectation of length, and collect the four unconditional identity answers before asking anything
that could feel intrusive.

**Entry from:** navbar, homepage CTA, directory index CTA, Instagram, newsletter, retired Tally URL.

**Exits to:** S2 (scroll — there is no navigation event), or away.

### Layout Wireframe (mobile-first, 320px)

```
┌──────────────────────────────────────────────┐ 320px
│  GPC                                     [≡] │  existing Navbar
├──────────────────────────────────────────────┤
│▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  6px rail, sticky
│                                              │  aria-hidden, scroll-linked
│                                              │
│  Join GPC Mums in                            │  <h1> text-3xl, #2d1b4e
│  Business & Work                             │  font-heading 700
│                                              │
│  Local parents running events and            │  admin-authored intro
│  activities for local families. Tell us      │  (FR-008; plain text FR-020)
│  a bit about you and we'll take it from      │  font-body, #1a1a2e
│  there.                                      │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ ⏱  About 5 minutes · 20 questions      │  │  LengthSignal (NEW)
│  │ 🔒  Your email, postcode and answers    │  │  role="status" on the
│  │    are never shown publicly.           │  │  number, polite
│  └────────────────────────────────────────┘  │  rounded-2xl, border pink
│                                              │
│  ┌────────────────────────────────────────┐  │  Card · rounded-2xl · p-6
│  │  1 of 7 · About you        4 questions │  │  <h2> · count right-aligned
│  │  ────────────────────────────────────  │  │
│  │                                        │  │
│  │  What's your first name?             * │  │  <label htmlFor="firstName">
│  │  ┌──────────────────────────────────┐  │  │
│  │  │                                  │  │  │  16px min · rounded-xl
│  │  └──────────────────────────────────┘  │  │  h-12 (48px)
│  │                                        │  │
│  │  What's your email address?          * │  │
│  │  We'll only use this to contact you    │  │  hint, ABOVE the input
│  │  about GPC.                            │  │  id="email-hint"
│  │  ┌──────────────────────────────────┐  │  │  aria-describedby
│  │  │                                  │  │  │  type="email"
│  │  └──────────────────────────────────┘  │  │  inputMode="email"
│  │                                        │  │  autocomplete="email"
│  │  What's your postcode?               * │  │
│  │  We use this to plan events near you.  │  │  ← does the persuading
│  │  It's never shown publicly and never   │  │
│  │  leaves GPC.                           │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │ SE10 8XJ                         │  │  │  autocomplete="postal-code"
│  │  └──────────────────────────────────┘  │  │  600ms debounce,
│  │                                        │  │  3-state border
│  │  How did you hear about us?          * │  │  <fieldset><legend>
│  │  ┌──────────────────────────────────┐  │  │  radios, 44px rows,
│  │  │ ( ) Greenwich Parents & Carers   │  │  │  full row is the target
│  │  │ ( ) Weekly newsletter            │  │  │  ← typo fixed (defect 7)
│  │  │ ( ) Instagram                    │  │  │
│  │  │ ( ) A friend                     │  │  │
│  │  │ ( ) At an event                  │  │  │
│  │  │ ( ) Google                       │  │  │
│  │  │ ( ) Something else               │  │  │
│  │  └──────────────────────────────────┘  │  │
│  └────────────────────────────────────────┘  │
│                                              │
│           ▼  section 2 continues             │
└──────────────────────────────────────────────┘
```

**Tablet / Desktop variations (differences only):**
- `md:` (768px) — the form column is capped at `max-w-2xl` and centred inside the site's existing
  `max-w-7xl` container. It does **not** become two columns; a two-column form on a survey like this
  creates ambiguous reading order for screen readers and for eyes.
- `md:` — the LengthSignal moves inline beside the `h1` as a right-aligned block rather than sitting
  below it.
- `md:` — the seven "How did you hear" radios wrap into two columns of ~4; each row keeps its full
  44px height.
- `lg:` (1024px) — a sticky right-hand rail appears showing the seven section names as a read-only
  outline with completion ticks. Read-only: it is **not** a jump navigation, because jumping past
  unanswered required fields is how people submit incomplete forms. `aria-hidden="true"`; the
  heading tree already provides the same information to assistive tech.
- No `xl:` treatment (the codebase never uses `xl:`).

### Component Hierarchy

1. `Navbar` — **existing** (`src/components/layout/Navbar.jsx`); a `Join` entry is added to the
   array at lines 8–14.
2. `SkipLink` — **NEW**. Site-wide gap #7. `/join` is the page that most needs it.
3. `ProgressRail` — **NEW**. 6px, `sticky top-[navbar]`, `aria-hidden="true"`, scroll-linked.
4. `PageHeading` — **NEW**. `SectionHeading` is hard-coded to `<h2>` and cannot serve as the page
   `<h1>`; rather than change a component used across the site, `/join` renders its own `<h1>`.
5. `LengthSignal` — **NEW**. Time estimate + question count + the privacy one-liner. Contains the
   only `role="status"` region on this screen besides the error/submit region.
6. `FormSection` — **NEW**. Wraps `Card` (**existing**, no internal padding — this component supplies
   `p-6`). Props: index, total, title, questionCount, completion state, error count.
   6.1 `Badge` (**existing**) — used with a **NEW `error` variant** for `2 to fix`; and a **NEW
   `done` variant** for the `✓ Done` pill.
7. `TextField` — **NEW**. `label` + `htmlFor`/`id` + hint + input + error. This is the component that
   ends site-wide a11y gap #1.
8. `PostcodeField` — **NEW**. `TextField` plus the 600ms debounce and three-state border borrowed
   from `EventFilters.jsx`. Format validation only — **no geocoding** (a geocoder is a processor
   that would have to be added to the privacy disclosures, for a private field).
9. `RadioGroup` — **NEW**. `<fieldset>` + `<legend>`, one 44px row per option, whole row labelled.
10. `LiveRegion` — **NEW**. Extracted from the pattern in `NewsletterBanner.jsx`, which is currently
    the site's only `role="status" aria-live="polite"` region. One instance per page.

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Config loaded, `open = true`, nothing typed | As drawn. Section heading shows `4 questions`. | `<h2>` text carries the count; no live announcement on first paint. |
| **Loading** | Config fetch in flight | Page `<h1>` renders immediately (it is static). Below it, three skeleton `Card`s at the heights of sections 1–3, plus centred text `"Loading the form…"`. The existing `animate-spin` idiom is used **only** where reduced motion is not requested. | The skeleton container is `aria-busy="true"`; `LiveRegion` announces `"Loading the form"` then `"Form ready. 20 questions, about 5 minutes."` |
| **Empty** | N/A — a fresh form is the Default state; there is no data-bearing collection on this screen that can be empty. | — | — |
| **Error** | (a) config fetch failed; (b) one or more identity fields invalid after submit | (a) Full-screen: `"We couldn't load the form just now."` / `"This is our end, not yours."` / `Button` "Try again". (b) `ErrorSummary` above section 1 + per-field inline messages + `2 to fix` `Badge` on the heading. | (a) container `role="alert"`. (b) `ErrorSummary` is `role="alert"`; each field gets `aria-invalid="true"` and `aria-describedby="<id>-error <id>-hint"`; each inline message is `role="alert"`. |
| **Success** | N/A on this screen — success is a whole-page state (Screen S6), because FR-001 requires the form to be *replaced* by the confirmation. | — | — |
| **Disabled** | Per-field: none on this screen. Whole-form: only in the closed state (S5), where fields are **absent**, not disabled. | — | — Deliberate: disabled inputs are skipped by some screen readers and cannot be focused to read their explanation. Absence is honest; a dead form is not. |

### Interactions & Animations

| Interaction | Behavior | Timing | `prefers-reduced-motion: reduce` |
|---|---|---|---|
| Section card enters viewport | Fade + 8px rise | 300ms `ease-out`, `delay: i * 0.06` | No transform, no fade — rendered in final position immediately. |
| Input focus | 2px `#fc16a0` focus ring, 2px offset (non-text UI, 3:1 threshold applies — passes) | 100ms | Ring appears with no transition. Ring itself is retained (it is not motion). |
| Postcode validation feedback | Border colour crossfades neutral → green/red | 600ms debounce, then 150ms crossfade | Debounce unchanged; colour changes instantly. |
| Radio row tap | Background tints `#fdf2f8`, dot scales 0 → 1 | 120ms | Background tints instantly; dot appears at full size. |
| Progress rail | Width tracks scroll | `transition: width 200ms linear` | No transition — width still tracks scroll (that is user-driven, not animation). |
| Section completion tick | ✓ scales 0.8 → 1 with a 6px rise | 180ms `ease-out` | Appears instantly. |
| Scroll to an errored field | `scrollIntoView({ behavior: 'smooth', block: 'center' })` | ~400ms | `behavior: 'auto'` — instant jump. |

### Accessibility Annotations

- **Heading level:** `<h1>` "Join GPC Mums in Business & Work" (one per page). Every `FormSection`
  title is an `<h2>`. No `<h3>` on this screen. Individual questions are `<label>` or `<legend>`,
  never headings — a 25-heading document is worse to navigate than a 7-heading one.
- **Landmark roles:** `<main id="main">` wraps everything below the navbar; the seven sections live
  inside a single `<form>`. The form is **not** given `role="form"` or an `aria-label` — one form in
  one main is unambiguous, and an extra landmark just adds a stop to the landmark rotor.
- **Focus management:** no programmatic focus movement on load — the page starts at the top and the
  skip link is the first tab stop. Focus is moved only by (a) submit validation failure, to the first
  offending field, and (b) `ErrorSummary` link activation.
- **Screen-reader notes:** the length signal's number is inside the page's single `LiveRegion` and is
  announced **only on change**, never on first paint. The privacy one-liner is static text, read in
  document order, and is deliberately placed *before* the first input so it is heard before the
  member commits anything.
- **Keyboard operation:** Tab reaches every control. The radio group is a single tab stop with arrow
  keys moving and selecting within it (native behaviour — do not intercept). Every target is
  ≥ 44 × 44px; radio rows are full-width so the whole row, not just the 20px dot, is the target.
- **iOS 16px rule:** every text input, `textarea` and `select` on this page has a computed
  `font-size ≥ 16px`. `text-sm` (14px) is **forbidden** on any focusable text-entry control, including
  the postcode field, which is the one most likely to be styled small "because it's short". Below
  16px iOS Safari zooms the viewport on focus, which on a 320px screen produces exactly the horizontal
  scroll the hard rules forbid — the zoom is the mechanism by which the layout rule gets broken.
  Hint and error text may be 14px because they are not focusable.

---

## 4. Screen S2 — Join: group selection and the branch transition

**Purpose:** Capture the single answer that determines the shape of the rest of the form, and change
that shape in a way the member understands, expects, and can back out of before losing anything.

**Entry from:** S1 (scroll).

**Exits to:** S3 Business / S3 Career / S3 Both (in place, no navigation), or the `ConfirmDialog`
when a change would discard answers.

### Layout Wireframe (mobile-first, 320px)

```
┌──────────────────────────────────────────────┐ 320px
│  ┌────────────────────────────────────────┐  │
│  │  2 of 7 · Your group        1 question │  │  <h2>
│  │  ────────────────────────────────────  │  │
│  │                                        │  │
│  │  Which group would you like to join? * │  │  <legend>
│  │  This is the only answer that changes  │  │  hint — sets the
│  │  the rest of the form.                 │  │  expectation UP FRONT
│  │                                        │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │ ( )  Business Mums               │  │  │  56px row (not 44 —
│  │  │      I run or am starting a      │  │  │  two-line option)
│  │  │      business        +7 questions│  │  │  ← cost, stated
│  │  ├──────────────────────────────────┤  │  │
│  │  │ ( )  Career Mums                 │  │  │
│  │  │      I'm employed, freelancing   │  │  │
│  │  │      or returning to work        │  │  │
│  │  │                      +4 questions│  │  │
│  │  ├──────────────────────────────────┤  │  │
│  │  │ ( )  Both                        │  │  │
│  │  │      I've got a business and a   │  │  │
│  │  │      job or career plans         │  │  │
│  │  │                     +11 questions│  │  │
│  │  └──────────────────────────────────┘  │  │
│  └────────────────────────────────────────┘  │
│                                              │
│         ══ BRANCH TRANSITION ══              │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  3 of 7 · Your business    7 questions │  │  mounts below,
│  │  ────────────────────────────────────  │  │  expands 0 → auto
│  │  ...                                   │  │
└──────────────────────────────────────────────┘
```

**The `ConfirmDialog` — shown only when changing the answer would discard entered answers:**

```
┌──────────────────────────────────────────────┐ 320px
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  scrim rgba(45,27,78,.55)
│░┌──────────────────────────────────────────┐░│  dialog, rounded-2xl
│░│                                          │░│  max-w-[288px], p-6
│░│  Change your group to Career Mums?       │░│  <h2 id="dlg-title">
│░│                                          │░│  text-xl, #2d1b4e
│░│  You've answered 3 of the 7 business     │░│  <p id="dlg-desc">
│░│  questions. Changing your group will     │░│  the count is REAL —
│░│  clear those answers. Nothing is saved   │░│  computed, not "some"
│░│  and nothing is sent to GPC.             │░│
│░│                                          │░│
│░│  Your directory listing details will     │░│  ← only rendered when
│░│  stay as they are.                       │░│  the directory section
│░│                                          │░│  has values
│░│  ┌────────────────────────────────────┐  │░│
│░│  │      Keep Business Mums            │  │░│  ← INITIAL FOCUS
│░│  └────────────────────────────────────┘  │░│  outline variant, 48px
│░│  ┌────────────────────────────────────┐  │░│
│░│  │      Clear and change              │  │░│  primary, #c9107f fill
│░│  └────────────────────────────────────┘  │░│  + white text (5.43:1)
│░│                                          │░│  48px
│░└──────────────────────────────────────────┘░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└──────────────────────────────────────────────┘
```

**Tablet / Desktop variations (differences only):**
- `md:` — the three group options become a 3-up card row; each card keeps its description and its
  `+N questions` line. Card height is equalised so the counts align, which makes the comparison the
  member is actually making (how much work is each?) legible at a glance.
- `md:` — the dialog is centred at `max-w-md` with the two buttons side by side, **destructive
  action on the right, cancel on the left**, cancel still holding initial focus.
- No other differences.

### FR-002 discard behaviour — exact specification

**The abandoned set.** When the group answer changes from `old` to `new`, the abandoned set is
`branchFields(old) \ branchFields(new)`:

| From → To | Abandoned set | Dialog? |
|---|---|---|
| (unset) → any | ∅ | No |
| Business → Career | B1–B7 | Yes, if any B field has a value |
| Business → Both | ∅ (superset) | **No** — Business answers are preserved verbatim |
| Career → Business | C1–C4 | Yes, if any C field has a value |
| Career → Both | ∅ (superset) | **No** |
| Both → Business | C1–C4 | Yes, if any C field has a value |
| Both → Career | B1–B7 | Yes, if any B field has a value |
| X → X | ∅ | No (no-op; the radio is already selected) |

**"Has a value" means:** a text/textarea field with a non-empty trimmed string, a radio group with a
selection, or a checkbox group with ≥ 1 selection. Fields the member focused and left empty do not
count. The dialog body quotes the real count (`"3 of the 7 business questions"`), never a vague
"some of your answers" — a member who answered one question and a member who answered six deserve
different amounts of warning.

**Warning copy, in full (the abandoned branch is Business):**

> **Change your group to Career Mums?**
>
> You've answered 3 of the 7 business questions. Changing your group will clear those answers.
> Nothing is saved and nothing is sent to GPC.
>
> *[only when the directory section holds values]* Your directory listing details will stay as
> they are.
>
> `[ Keep Business Mums ]`  `[ Clear and change ]`

**Career-abandoned variant** (identical structure): *"You've answered 2 of the 4 career questions.
Changing your group will clear those answers. Nothing is saved and nothing is sent to GPC."* with
buttons `[ Keep Both ]` / `[ Clear and change ]`.

**Singular variant:** *"You've answered 1 of the 7 business questions."*

**On "Clear and change":**
1. The radio's value commits to `new`.
2. Every field in the abandoned set is deleted from form state — not blanked, **deleted from the
   state object**, so it cannot be serialised as an empty string into the payload (FR-002: *"absent
   from the submitted payload"*).
3. Any validation errors attached to abandoned fields are dropped, and the `ErrorSummary` (if
   showing) recomputes. Hidden-branch questions are never required (FR-002).
4. The abandoned section unmounts; the new section mounts.
5. The section numbering renumbers, and the `LengthSignal` recomputes.
6. Focus returns to the now-selected radio input. The member is left exactly where they acted —
   not teleported into the new section, which would hide the consequence of their own choice.
7. `LiveRegion` announces, politely, as one utterance:
   `"Business questions removed. Career questions added, 4 questions. This form now has 17
   questions, about 4 minutes."`

**On "Keep Business Mums":** the dialog closes, the radio reverts to `old` (the DOM radio is
controlled, so it never visually flipped in the first place), focus returns to the radio the member
activated, and `LiveRegion` says nothing. A cancelled action should be silent.

**No undo is offered after "Clear and change".** Retaining the discarded answers in a client-side
buffer would technically still satisfy FR-002's payload clause, but it would make "we've cleared
those answers" untrue in the only sense the member cares about. The dialog *is* the undo, which is
why it exists and why cancel holds initial focus.

**Directory fields are never part of the abandoned set.** Per D4 they may have been pre-filled from
B3/B4/B5, but once copied they belong to section 6 — a section the member can see. Silently emptying
visible fields elsewhere on the page would be the exact surprise the dialog is meant to prevent.

### Component Hierarchy

1. `FormSection` (**NEW**) → `Card` (**existing**).
2. `RadioGroup` (**NEW**) — here in its "rich" configuration: title + description + cost line per
   option. Same component as S1, different density.
   2.1 `OptionCostLine` (**NEW**) — the `+7 questions` text. `aria-hidden="true"`; the count is
   already inside each radio's accessible name (`"Business Mums, I run or am starting a business,
   adds 7 questions"`) so it is announced once, not twice.
3. `ConfirmDialog` (**NEW**) — **the first real dialog in this codebase.** Closes site-wide a11y gap
   #2. Contract: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="dlg-title"`,
   `aria-describedby="dlg-desc"`, focus trap, Escape closes as cancel, background scroll locked,
   focus returned to the trigger on close, rendered in a portal at the end of `<body>`.
   3.1 `Button` (**existing**) × 2 — requires the **`size` extension** noted in the shared context
   (`Button` has fixed `px-6 py-3` and no size variants; the dialog needs full-width 48px buttons).
   Primary fill is `#c9107f` with white text, never `#fc16a0`.
4. `LiveRegion` (**NEW**) — shared page-level instance.
5. `BranchSection` (**NEW**) — the mount/unmount wrapper. Unmounts on change; does not use `hidden`.

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | No group chosen yet | Three unselected radios. No branch section exists below. | `<fieldset>` + `<legend>`; nothing announced. |
| **Loading** | N/A — this section's options come from the already-loaded form config; there is no per-section fetch. | — | — |
| **Empty** | Identical to Default: an unanswered branch key means sections below section 2 are sections 4–7 only, renumbered. There is no "empty state" illustration — an unanswered question is not an empty state. | — | — |
| **Error** | Submit attempted with no group chosen | `ErrorSummary` links here; the `<fieldset>` gets a `#b91c1c` left rule; inline message `"Choose the group you'd like to join — this decides which questions we ask you next."` | Message `id="group-error"`, `role="alert"`; `aria-describedby="group-hint group-error"` on the fieldset; `aria-invalid` on the first radio. |
| **Success** | Group chosen and the branch has mounted | `✓ Done` `Badge` (**NEW variant**) on the heading; count changes `1 question` → `Done`. | The tick is `aria-hidden`; the heading's accessible text becomes `"2 of 7, Your group, completed"`. |
| **Disabled** | While the `ConfirmDialog` is open, the whole page behind it is inert. | Radios are visually unchanged (no grey-out — the scrim already communicates modality). | The page container gets `inert` (with `aria-hidden="true"` as the fallback). Not `disabled` on individual controls. |

### Interactions & Animations

| Interaction | Behavior | Timing | `prefers-reduced-motion: reduce` |
|---|---|---|---|
| Choosing a group for the first time | New `BranchSection` expands height `0 → auto` and fades in | 220ms `ease-out` | Mounts at full height instantly. **This matters:** an animated expansion under reduced motion is a vestibular trigger, and the transition is also the moment the page height jumps most. |
| Changing a group with no answers to discard | Old section collapses (160ms) then new expands (220ms), sequential | 380ms total | Both instant, single reflow. |
| Changing a group with answers to discard | `ConfirmDialog` scrim fades in, panel scales 0.96 → 1 | 150ms `ease-out` | Scrim and panel appear instantly, no scale. |
| Dialog dismiss (either button, or Escape) | Reverse of the above | 120ms | Instant. |
| Section renumbering after a change | The changed `<h2>` numbers crossfade | 200ms | Instant text swap. |
| `LengthSignal` number change | Old number fades out, new fades in (no counting animation) | 180ms | Instant swap. A rolling-odometer count-up is never used, in either mode — it is unreadable at 320px and it delays the announcement. |
| Radio row press | Background tint + dot scale | 120ms | Tint only. |

### Accessibility Annotations

- **Heading level:** `<h2>` for the section. The dialog's title is also an `<h2>` — it is in a
  separate `aria-modal` context, so it does not disturb the page outline while open.
- **Landmark role:** none added. The dialog is `role="dialog"` in a portal; while it is open the
  `<main>` is `inert`, so the landmark rotor contains only the dialog.
- **Focus management:** (a) first selection — focus stays on the radio; nothing is stolen. (b) change
  with discard — focus moves into the dialog, initial focus on **"Keep <old group>"**, i.e. the
  *safe* action, per WCAG 3.3.4 error-prevention guidance for reversible/destructive choices.
  Escape = cancel. On close, focus returns to the radio that was activated, in both outcomes.
- **Screen-reader notes:** each radio's accessible name is the full
  `"Business Mums, I run or am starting a business, adds 7 questions"` — built from the visible text,
  with the `+7 questions` line `aria-hidden` so it is not read twice. The branch change is announced
  once, politely, from the shared `LiveRegion`; the dialog's own `aria-describedby` carries the
  discard warning, so a member who cannot see the count still hears it.
- **Keyboard operation:** the radio group is one tab stop; arrows move *and select* (native
  behaviour). This means arrowing from Business to Career **can trigger the discard dialog on a key
  press**. That is correct and intended — the dialog is the guard, and its cancel button restores the
  previous value, so no keyboard user can destroy answers without an explicit second action. Do not
  "fix" this by switching to arrow-moves-without-selecting; that breaks the native radio contract
  screen-reader users rely on.
- **iOS 16px rule:** no text inputs on this screen; the rule is not engaged. Option descriptions are
  15px and the cost line 14px, which is permitted — they are not focusable text-entry controls.

---

## 5. Screen S3 — Join: Business branch (7), Career branch (4), Both (11)

**Purpose:** Ask the branch-specific questions, and *only* those, so that NFR-007's "a Career Mum
answers zero business questions" is structurally true rather than a filtering convention.

**Entry from:** S2, on the group answer committing.

**Exits to:** S4 (scroll); or unmount, on a group change confirmed at S2.

### Layout Wireframe (mobile-first, 320px) — Business variant

```
┌──────────────────────────────────────────────┐ 320px
│  ┌────────────────────────────────────────┐  │
│  │  3 of 7 · Your business   7 questions  │  │  <h2>
│  │  ────────────────────────────────────  │  │
│  │                                        │  │
│  │  What stage best describes your      * │  │  B1 · radios
│  │  business?                             │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │ ( ) I want to get inspired       │  │  │  44px rows
│  │  │ ( ) I'm exploring a business idea│  │  │
│  │  │ ( ) I'm preparing to launch      │  │  │
│  │  │ ( ) I've recently launched       │  │  │
│  │  │ ( ) I'm growing my business      │  │  │
│  │  │ ( ) I run an established business│  │  │
│  │  └──────────────────────────────────┘  │  │
│  │                                        │  │
│  │  Which industry are you in?          * │  │  B2 · text, 16px
│  │  ┌──────────────────────────────────┐  │  │
│  │  │                                  │  │  │
│  │  └──────────────────────────────────┘  │  │
│  │                                        │  │
│  │  Business name              Optional   │  │  B3 · "Optional" is a
│  │  ┌──────────────────────────────────┐  │  │  visible word, right-
│  │  │                                  │  │  │  aligned. Required is
│  │  └──────────────────────────────────┘  │  │  marked with * only.
│  │                                        │  │
│  │  Website                    Optional   │  │  B4 · inputMode="url"
│  │  ┌──────────────────────────────────┐  │  │  scheme normalised,
│  │  │ yourbusiness.co.uk               │  │  │  not rejected
│  │  └──────────────────────────────────┘  │  │
│  │                                        │  │
│  │  Instagram                  Optional   │  │  B5
│  │  ┌──────────────────────────────────┐  │  │
│  │  │ @yourhandle                      │  │  │
│  │  └──────────────────────────────────┘  │  │
│  │                                        │  │
│  │  What are you currently looking     *  │  │  B6 · 18 chips,
│  │  for?  Pick as many as you like.       │  │  multi-select
│  │  ┌──────────────────────────────────┐  │  │
│  │  │ (Networking) (New clients)       │  │  │  ChoiceChipGroup
│  │  │ (Collaborations) (Marketing &    │  │  │  44px tall, wraps,
│  │  │ Social Media) (AI & Automation)  │  │  │  rounded-full
│  │  │ (Personal Branding) (Business    │  │  │  selected = #c9107f
│  │  │ Strategy) (Finance & Funding)    │  │  │  fill + white text
│  │  │ (Accounting & Tax) (Legal) (HR & │  │  │  unselected = white +
│  │  │ Employment) (Hiring Staff)       │  │  │  #2d1b4e text +
│  │  │ (Childcare & Work-Life Balance)  │  │  │  1px #e5d9f2 border
│  │  │ (Insurance) (Business Workshops) │  │  │
│  │  │ (Mentoring) (Accountability)     │  │  │
│  │  │ (Other)                          │  │  │
│  │  └──────────────────────────────────┘  │  │
│  │                              4 chosen  │  │  live count, polite
│  │                                        │  │
│  │  What challenges are you                │  │  B7 · long text,
│  │  currently facing?          Optional   │  │  DE-REQUIRED (defect 9)
│  │  Skip this if you'd rather — it helps  │  │
│  │  us plan workshops, that's all.        │  │  ← says why it exists
│  │  ┌──────────────────────────────────┐  │  │
│  │  │                                  │  │  │  rows=4, 16px,
│  │  │                                  │  │  │  rounded-xl
│  │  └──────────────────────────────────┘  │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Career variant (differences only):**

```
│  ┌────────────────────────────────────────┐  │
│  │  3 of 7 · Your career     4 questions  │  │
│  │  ────────────────────────────────────  │  │
│  │  Which best describes your current   * │  │  C1 · multi-select
│  │  situation?  Pick as many as apply.    │  │  chips · 10 options
│  │  ┌──────────────────────────────────┐  │  │  ← 11 in the source;
│  │  │ (Looking for work) (Employed     │  │  │  "Looking for work"
│  │  │ full-time) (Employed part-time)  │  │  │  appeared TWICE.
│  │  │ (Self-employed) (Freelance)      │  │  │  DEFECT 3 FIXED:
│  │  │ (Returning after maternity leave)│  │  │  de-duplicated to a
│  │  │ (Returning after a career break) │  │  │  single option.
│  │  │ (Exploring a career change)      │  │  │
│  │  │ (Student) (Other)                │  │  │
│  │  └──────────────────────────────────┘  │  │
│  │  What industry do you work in?       * │  │  C2 · text
│  │  What type of support would be       * │  │  C3 · 16 chips
│  │  most valuable to you?                 │  │
│  │  What is your biggest career            │  │  C4 · long text,
│  │  challenge right now?       Optional   │  │  DE-REQUIRED
│  └────────────────────────────────────────┘  │
```

**Both variant (differences only):** two sibling `FormSection` cards — `3 of 8 · Your business`
(7 questions) then `4 of 8 · Your career` (4 questions), in the source form's order. Total sections
becomes 8 and every following section renumbers. Nothing is merged, deduplicated, or reordered
between the two: "Which industry are you in?" (B2, about the business) and "What industry do you
work in?" (C2, about the job) are genuinely different questions for a member who has both, and
collapsing them would lose the distinction FR-014's split-by-branch insight depends on.

**Tablet / Desktop variations (differences only):**
- `md:` — B3/B4/B5 (business name / website / Instagram) sit in a 2-column grid, name spanning both.
  These three are short, related, and low-stakes; pairing them is the one place a two-column form is
  safe because reading order and visual order still match.
- `md:` — chip groups get more per row naturally (they already wrap); no layout change is needed.
- `md:` — long-text fields go from `rows=4` to `rows=5`.
- `lg:` — for "Both", the two sections remain stacked, not side by side. Side-by-side branches invite
  the member to fill them in parallel and lose their place.

### Component Hierarchy

1. `BranchSection` (**NEW**) → `FormSection` (**NEW**) → `Card` (**existing**).
2. `RadioGroup` (**NEW**) — B1.
3. `TextField` (**NEW**) — B2, B3, B4, B5, C2.
   3.1 `UrlField` (**NEW**, thin wrapper on `TextField`) — B4, B5. Normalises a missing scheme on
   blur rather than rejecting it (addendum, FR-003 overflow). Shows the normalised value so the
   member sees what will be stored.
4. `ChoiceChipGroup` (**NEW**) — B6, C1, C3. A `<fieldset>` of real `<input type="checkbox">`
   elements with the chip as the `<label>`; not buttons, so state is native and announced natively.
   Options and their order come from form config (FR-008); retired options still render as labels on
   historical answers in the admin views, never here.
   4.1 `ChoiceCount` (**NEW**) — `"4 chosen"`, inside the page `LiveRegion`, polite, debounced 500ms
   so rapid multi-select does not produce a stream of announcements.
5. `LongTextField` (**NEW**) — B7, C4. No character counter here (unlike the directory description,
   which has an enforced limit); a counter on an optional question implies a target.
6. `Badge` (**existing**) — `done` / `error` variants (**NEW**).

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Branch has mounted, nothing answered | As drawn. Heading shows `7 questions` / `4 questions`. | Section `<h2>`; no announcement beyond the one made at S2. |
| **Loading** | N/A — branch content is part of the already-fetched form config; there is no per-branch request. | — | — |
| **Empty** | Group not chosen → **this screen does not exist**. The component is unmounted, not empty. | Nothing renders between sections 2 and 4. | Nothing in the DOM, nothing in the tab order, nothing in the heading tree, nothing in the payload. This is the mechanism by which NFR-007's zero-business-questions guarantee is enforced. |
| **Error** | Submit with a required branch field unanswered | `Badge` `2 to fix` on the heading; per-field inline messages; `ErrorSummary` links in. Example: `"Which industry are you in? — tell us your industry, even roughly."` | Per-field `aria-invalid` + `aria-describedby`; each message `role="alert"`. Chip groups put the error on the `<fieldset>` via `aria-describedby`, not on individual checkboxes. |
| **Success** | Every required field in the section answered | Heading gains `✓ Done`. | Accessible heading text becomes `"3 of 7, Your business, completed"`. |
| **Disabled** | N/A — no control in this section is ever disabled. A branch is either mounted and live, or not mounted. | — | — Deliberate departure from the `EventFilters.jsx` "dimmed + disabled, never hidden" idiom: that idiom is right for *filters*, where a disabled control teaches the user what is available. It is wrong here, because a rendered-but-disabled Business fieldset would still appear in the heading tree and would still read to Carla as "questions I am expected to deal with", which is the precise failure NFR-007 forbids. |

### Interactions & Animations

| Interaction | Behavior | Timing | `prefers-reduced-motion: reduce` |
|---|---|---|---|
| Branch section mount | Height `0 → auto` + fade | 220ms `ease-out` | Instant, full height. |
| Branch section unmount | Fade + height `auto → 0` | 160ms `ease-in` | Removed instantly. |
| Chip toggle | Fill and text colour crossfade; 1px border → 0 as the fill lands | 120ms | Colour swaps instantly; no scale, no bounce. |
| Chip group reflow when a chip changes width on selection | Chips must **not** change width on selection (same padding and font-weight in both states) — the reflow is prevented, not animated. | — | Same. This is a layout rule, not a motion rule; a wrapping chip group that reflows on every tap is unusable one-handed regardless of motion preference. |
| URL normalisation on blur | Value updates in place | Instant | Same. |
| Long-text autogrow | `rows` grows 4 → 8 max, then scrolls | 100ms height transition | Height changes instantly. |
| Section completion tick | Scale + rise | 180ms | Instant. |

### Accessibility Annotations

- **Heading level:** `<h2>` per branch section. For "Both", two sibling `<h2>`s. No `<h3>`.
- **Landmark role:** none; these are `<section>` elements inside the single `<form>` inside `<main>`.
  They are **not** given `role="region"` + `aria-labelledby` — seven regions would bloat the rotor
  for no gain, since the heading tree already exposes them.
- **Focus management:** none on mount. Focus is never moved into a newly revealed branch — the member
  is reading, and stealing focus mid-scroll is disorienting on a phone. The `LiveRegion`
  announcement from S2 is what tells a non-sighted member that content appeared, and its wording
  (`"Career questions added, 4 questions"`) tells them where to navigate with `H`.
- **Screen-reader notes:** every chip group is a `<fieldset>` with a `<legend>` carrying the full
  question text plus its hint, so the question is re-announced on entering the group rather than
  relying on the member remembering it after 18 checkboxes. The live `"4 chosen"` count is debounced
  500ms; without the debounce, tapping five chips produces five interruptions.
- **Keyboard operation:** chips are checkboxes — Tab between them, Space toggles. 18 tab stops in B6
  is real but is the conformant, zero-bug option for a solo maintainer; a roving-tabindex composite
  is noted in Gaps as a deferred enhancement. Radios in B1 are one stop with arrow keys. Every chip
  is ≥ 44px tall with ≥ 12px horizontal padding.
- **iOS 16px rule:** B2, B3, B4, B5, C2 inputs and the B7/C4 textareas are all ≥ 16px. The `@handle`
  and `yourbusiness.co.uk` placeholders are also 16px — placeholder text at 14px in a 16px field
  still triggers no zoom, but the mixed sizing looks broken and encourages someone to "fix" the field
  down to 14px later.

---

## 6. Screen S4 — Join: Events + Community sections

**Purpose:** Collect the demand signals FR-014's insights view is built on — which events, when, how
often, and who will help run them — without letting the *when* question consume a third of the form.

**Entry from:** S3 (scroll), or S2 directly (numbering shifts if no branch has mounted yet).

**Exits to:** S5 directory section (scroll).

### The 21-checkbox problem, and the control that replaces it

**What the source form does.** "Which days usually work best for you?" is one multi-select with
**21 options** — 7 days × 3 slots, flattened into a single list (`Monday morning`, `Monday
afternoon`, `Monday evening`, `Tuesday morning`, …). Rendered as a vertical checkbox list at 320px
that is 21 rows at ~48px, roughly **1,000px of continuous scroll for one question**. The whole form
is about 2,800px. One question is therefore ~35% of the page. It is also the fourth question of ten
on a first scroll-through, which means a member sizing up the form hits it early and over-estimates
the total by a factor of about three. This is not a cosmetic problem: it is the single largest
contributor to the perceived length that NFR-007 is measured against.

**Two designs were rejected.**

*Rejected A — split into two questions ("which days?" 7 chips, "which times?" 3 chips).* Ten targets
instead of 21, ~250px instead of 1,000. But it destroys the cross product, which is the only thing
FR-014 actually needs: *"shows the distribution of preferred day/time slots"*, and the admin question
it exists to answer is literally *"which day should we run the next networking breakfast?"* A member
who picks {Tue, Sat} × {morning, evening} would be recorded as available for four slots when she
meant two, and at community scale that noise is the difference between a well-attended breakfast and
an empty room. Rejecting a design because it damages the requirement that justifies the question is
the right call even when it is the shorter design.

*Rejected B — keep 21 checkboxes but put them in a scrollable inner box.* Creates a scroll trap
inside a scrolling page, which on iOS is a well-known one-handed disaster, and hides content from
`Ctrl+F` and from screen-reader scanning.

**The control we specify — a 7 × 3 toggle matrix with a one-tap escape hatch.**

- **"I'm flexible — any day or time works"** is a single checkbox, placed **first**, above the grid
  and first in the fieldset's tab order. Ticking it satisfies the requirement in one tap and **dims
  and disables** the grid — reusing the site's established dependent-control idiom from
  `EventFilters.jsx` ("dimmed + disabled, never hidden"), which is the right idiom *here* because the
  grid is a dependent control whose availability the member benefits from still seeing.
- **The grid** is 7 rows (days) × 3 columns (Morn / Aft / Eve). Each cell is a real
  `<input type="checkbox">` with a visually hidden accessible name — `"Tuesday morning"` — so no
  table or grid semantics are needed and native checkbox behaviour is preserved.
- **The day label is itself the row toggle** (`aria-pressed` button, `"Select all Tuesday slots"`).
  This costs **zero** extra targets, because the 56px label column existed anyway.
- **The column headers are the column toggles** (`"Select every morning slot"`). Again zero extra
  rows.
- Result: the whole question is answerable in **1 tap** (flexible), **2 taps** (two whole days),
  or **3 taps** (all mornings + two evenings) — and still exactly expressible at 21 taps if someone
  wants that.

**It fits 320px without horizontal scroll.** Viewport 320 − page padding 2 × 16 = 288. Card padding
2 × 12 = 264 usable. Day-label column 56 + gap 6 + (3 cells + 2 gaps of 6) → each cell **63 × 44px**.
63 ≥ 44 and 44 ≥ 44, so every target clears the minimum with room to spare.

**Vertical cost:** header row 44 + 7 rows × 48 + the flexible checkbox 48 + legend ≈ **440px**,
against ~1,000px. The question stops being the thing you remember about the form.

**Required, but one tap satisfies it.** The question keeps `required = true` (FR-014 needs the data)
because "I'm flexible" makes the requirement cost one tap. The error message names the escape hatch
explicitly: *"Pick at least one slot, or tick 'I'm flexible'."*

### Defect fixes landed on this screen

| Defect | Source behaviour | Fix |
|---|---|---|
| **4 — event frequency is a checkbox group** | "How often would you like events?" renders as checkboxes, so `Weekly + Quarterly` is submittable and the answer is meaningless. | Rendered as a **`RadioGroup`, single-select**, four options in source order: Weekly · Fortnightly · Monthly · Quarterly. Native radio semantics make the contradictory answer unrepresentable rather than merely discouraged. A "No preference" option is *recommended* but not added here — see Gaps. |
| **3 — "Looking for work" appears twice** | C1's option list has 11 entries, two of which are identical. | De-duplicated to **10 options** at Screen S3. Flagged here because it is the same class of defect: an option list that was never proofread. FR-008 makes both lists admin-editable, so the fix must land in the seeded config, not only in the component. |
| **7 — "Weekly Newletter" typo** | Option 2 of "How did you hear about us?". | Corrected to "Weekly newsletter" at Screen S1. Same class; same seeded-config fix. |

### Layout Wireframe (mobile-first, 320px)

```
┌──────────────────────────────────────────────┐ 320px
│  ┌────────────────────────────────────────┐  │
│  │  4 of 7 · Events         3 questions   │  │  <h2>
│  │  ────────────────────────────────────  │  │
│  │                                        │  │
│  │  What kinds of events would you      * │  │  10 chips
│  │  love to attend?                       │  │  ChoiceChipGroup
│  │  ┌──────────────────────────────────┐  │  │
│  │  │ (Networking breakfasts)          │  │  │
│  │  │ (Evening networking)             │  │  │
│  │  │ (Guest speakers) (Workshops)     │  │  │
│  │  │ (Business masterclasses)         │  │  │
│  │  │ (Career talks)                   │  │  │
│  │  │ (Co-working sessions)            │  │  │
│  │  │ (Family-friendly events)         │  │  │
│  │  │ (Wellness sessions)              │  │  │
│  │  │ (Social meet-ups)                │  │  │
│  │  └──────────────────────────────────┘  │  │
│  │                              3 chosen  │  │
│  │                                        │  │
│  │  Which days and times usually work   * │  │  <legend>
│  │  best for you?                         │  │
│  │  Tap any slot that could work — we're  │  │  hint, id="dt-hint"
│  │  just looking for a pattern.           │  │
│  │                                        │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │ ☐  I'm flexible — any day or     │  │  │  ← FIRST tab stop
│  │  │    time works                    │  │  │  48px, one tap = done
│  │  └──────────────────────────────────┘  │  │
│  │                                        │  │
│  │           Morn    Aft     Eve          │  │  header buttons =
│  │          ┌────┐ ┌────┐ ┌────┐          │  │  column toggles
│  │          │all │ │all │ │all │          │  │  63 × 44 each
│  │          └────┘ └────┘ └────┘          │  │
│  │   Mon ⇢  ┌────┐ ┌────┐ ┌────┐          │  │  day label = row
│  │          │    │ │    │ │    │          │  │  toggle, 56 × 44
│  │          └────┘ └────┘ └────┘          │  │
│  │   Tue ⇢  ┌────┐ ┌────┐ ┌────┐          │  │
│  │          │ ✓  │ │    │ │    │          │  │  selected: #c9107f
│  │          └────┘ └────┘ └────┘          │  │  fill, white ✓
│  │   Wed ⇢  ┌────┐ ┌────┐ ┌────┐          │  │
│  │          │    │ │    │ │    │          │  │  unselected: white,
│  │          └────┘ └────┘ └────┘          │  │  1px #e5d9f2 border
│  │   Thu ⇢  ┌────┐ ┌────┐ ┌────┐          │  │
│  │          │ ✓  │ │ ✓  │ │    │          │  │
│  │          └────┘ └────┘ └────┘          │  │
│  │   Fri ⇢  ┌────┐ ┌────┐ ┌────┐          │  │
│  │          │    │ │    │ │    │          │  │
│  │          └────┘ └────┘ └────┘          │  │
│  │   Sat ⇢  ┌────┐ ┌────┐ ┌────┐          │  │
│  │          │    │ │    │ │    │          │  │
│  │          └────┘ └────┘ └────┘          │  │
│  │   Sun ⇢  ┌────┐ ┌────┐ ┌────┐          │  │
│  │          │    │ │    │ │    │          │  │
│  │          └────┘ └────┘ └────┘          │  │
│  │                                        │  │
│  │  Morn = before 12 · Aft = 12–5 ·       │  │  legend line, 14px,
│  │  Eve = after 5            3 selected   │  │  + live count
│  │                                        │  │
│  │  How often would you like events?    * │  │  DEFECT 4 FIXED —
│  │  ┌──────────────────────────────────┐  │  │  RADIO, not checkbox
│  │  │ ( ) Weekly                       │  │  │  44px rows
│  │  │ ( ) Fortnightly                  │  │  │
│  │  │ (•) Monthly                      │  │  │
│  │  │ ( ) Quarterly                    │  │  │
│  │  └──────────────────────────────────┘  │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  5 of 7 · Community      2 questions   │  │  <h2>
│  │  ────────────────────────────────────  │  │
│  │  What do you hope to gain from this    │  │  DE-REQUIRED (defect 9)
│  │  community?                 Optional   │  │
│  │  A sentence is plenty.                 │  │
│  │  ┌──────────────────────────────────┐  │  │  rows=4, 16px
│  │  │                                  │  │  │
│  │  └──────────────────────────────────┘  │  │
│  │                                        │  │
│  │  Would you be interested in any of     │  │  DE-REQUIRED — nobody
│  │  these?                     Optional   │  │  should be forced to
│  │  No pressure — it's just useful for us │  │  volunteer
│  │  to know.                              │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │ (Speaking at an event)           │  │  │  7 chips
│  │  │ (Running a workshop)             │  │  │
│  │  │ (Volunteering) (Becoming a       │  │  │
│  │  │ mentor) (Sponsorship             │  │  │
│  │  │ opportunities) (Collaborating    │  │  │
│  │  │ with other members)              │  │  │
│  │  │ (Hosting an event)               │  │  │
│  │  └──────────────────────────────────┘  │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Tablet / Desktop variations (differences only):**
- `md:` — the matrix cell width grows to ~96px and the column headers show the full words
  `Morning` / `Afternoon` / `Evening`; the abbreviation legend line is dropped because it is no
  longer needed. The `all` sub-label in the header buttons becomes `Select all`.
- `md:` — a `Weekdays` / `Weekend` / `Clear all` shortcut row appears above the grid. It is
  deliberately **not** shown at 320px: three more targets there would undo the vertical saving that
  is the whole point of the redesign, and the row/column toggles already cover the same intents in
  two taps.
- `md:` — the four frequency radios go to a single wrapping row of pills.
- `lg:` — no further change. The matrix is not widened further; a 7 × 3 grid stretched across
  1,000px increases pointer travel for no benefit.

### Component Hierarchy

1. `FormSection` (**NEW**) → `Card` (**existing**) × 2 (Events, Community).
2. `ChoiceChipGroup` (**NEW**) — event types (10), get-involved (7). Same component as S3.
3. `DayTimeMatrix` (**NEW**) — the flagship new control on this page.
   3.1 `FlexibleToggle` (**NEW**, internal) — the "I'm flexible" checkbox; owns the dim+disable of
   the grid below it.
   3.2 `MatrixColumnToggle` (**NEW**, internal) × 3 — the header buttons, `aria-pressed`.
   3.3 `MatrixRowToggle` (**NEW**, internal) × 7 — the day labels, `aria-pressed`.
   3.4 `MatrixCell` (**NEW**, internal) × 21 — a real `<input type="checkbox">` with a visually
   hidden label.
   3.5 `ChoiceCount` (**NEW**) — `"3 selected"`, in the page `LiveRegion`, debounced 500ms.
4. `RadioGroup` (**NEW**) — event frequency. **This is the defect-4 fix and it is a component swap,
   not a validation rule.**
5. `LongTextField` (**NEW**) — "What do you hope to gain".
6. `Badge` (**existing**) with **NEW** `done` / `error` variants.

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Sections mounted, nothing answered | As drawn. Matrix all-unselected, "I'm flexible" unticked, grid live. | Fieldsets + legends; nothing announced on paint. |
| **Loading** | N/A — no per-section fetch; options arrive with the form config. | — | — |
| **Empty** | N/A — these are unconditional sections that always render. An unanswered question is not an empty state and gets no empty-state treatment. | — | — |
| **Error** | Submit with event types, day/time, or frequency unanswered | `Badge` `1 to fix`; inline messages. Day/time: `"Pick at least one slot, or tick 'I'm flexible'."` Frequency: `"Choose how often you'd like events."` Event types: `"Pick at least one kind of event."` | Message on the `<fieldset>` via `aria-describedby="dt-hint dt-error"`; `role="alert"` on the message; `aria-invalid="true"` on the fieldset's first control. Errors are **never** attached to all 21 cells — one control, one error. |
| **Success** | All three Events questions answered (and Community needs none) | `✓ Done` on both headings. Community shows `Done` from first paint, since it has no required fields — which is itself a length signal. | Heading accessible text `"4 of 7, Events, completed"`. |
| **Disabled** | "I'm flexible" is ticked → the 21 cells, 7 row toggles and 3 column toggles are all `disabled` and rendered at 45% opacity with a `#e5d9f2` tint. | Grid stays visible so the member can see what they have opted out of and can untick to get it back. | Cells get the native `disabled` attribute (removed from the tab order automatically). The grid wrapper gets `aria-describedby` pointing at a visually hidden note: `"Day and time choices are turned off because you said you're flexible."` The `LiveRegion` announces once on toggle: `"Flexible selected. Day and time grid turned off."` Selections made before ticking are **retained in state and restored** on unticking — but are excluded from the payload while flexible is on. |

### Interactions & Animations

| Interaction | Behavior | Timing | `prefers-reduced-motion: reduce` |
|---|---|---|---|
| Cell tap | Fill crossfades white → `#c9107f`; ✓ fades in | 120ms | Instant colour and ✓ swap. No scale. |
| Row toggle (day label) | All 3 cells in the row fill, staggered left→right | 120ms each, 40ms stagger | All 3 change simultaneously and instantly — the stagger is removed, not just shortened. |
| Column toggle | All 7 cells in the column fill, staggered top→bottom | 120ms each, 30ms stagger | Simultaneous, instant. |
| "I'm flexible" ticked | Grid opacity 1 → 0.45, 200ms; grid height unchanged | 200ms `ease-out` | Opacity changes instantly. Height never animates, in either mode — a collapsing 440px block under the member's thumb is a scroll-position jump. |
| "I'm flexible" unticked | Reverse; prior selections reappear | 200ms | Instant. |
| Chip toggle | As S3 | 120ms | Instant colour. |
| Live count update | Text swap | Instant, announcement debounced 500ms | Same (the debounce is an announcement rule, not an animation). |
| Frequency radio select | Row tint + dot | 120ms | Tint only, no dot scale. |
| Long-text autogrow | 4 → 8 rows | 100ms | Instant. |

### Accessibility Annotations

- **Heading level:** two `<h2>`s (`Events`, `Community`). The matrix is **not** given a heading — it
  is one question and its `<legend>` carries the question text. Promoting it to a heading would
  imply it is a section, which is the perception this design is trying to shrink.
- **Landmark role:** none added.
- **Focus management:** no programmatic focus movement. Ticking "I'm flexible" disables 31 controls
  below it; because focus is on the checkbox itself and not inside the grid, no focus is destroyed.
  If a member somehow has focus inside the grid when it is disabled (only reachable via an assistive
  script), focus falls back to the fieldset — specify a guard that moves focus to the "I'm flexible"
  checkbox rather than letting it land on `<body>`.
- **Screen-reader notes:** each cell's accessible name is the full `"Tuesday morning"`, built from a
  visually hidden `<span>` inside its `<label>`. This is why the control uses plain checkboxes rather
  than `role="grid"`: a `grid` would require the member to understand a two-dimensional coordinate
  space announced as row and column headers, whereas 21 uniquely and fully named checkboxes need no
  spatial model at all. The row/column toggles announce as
  `"Select all Tuesday slots, toggle button, not pressed"`.
- **Keyboard operation:** the fieldset's tab order is deliberately: **`I'm flexible` → `Morn all` →
  `Aft all` → `Eve all` → `Mon` → `Mon morning` → `Mon afternoon` → `Mon evening` → `Tue` → …**
  A keyboard user can therefore complete the question in **one** stop (flexible), **four** (all
  mornings), or **two** (two day toggles), without ever entering the 21 cells. Plain Tab throughout;
  no roving tabindex, no arrow-key interception — see Gaps for why that enhancement is deferred.
  Space toggles cells and toggles the row/column buttons.
- **iOS 16px rule:** the two textareas are 16px. The matrix's `Morn` / `Aft` / `Eve` header labels
  and the `Morn = before 12` legend are 14px, which is **permitted** — they are buttons and static
  text, not focusable text-entry controls, so iOS's focus-zoom behaviour is not engaged. The rule is
  specifically about `input`, `textarea` and `select`; applying it indiscriminately to every label
  would push the matrix past 320px.
- **Contrast:** a selected cell is white on `#c9107f` (5.43:1) — the brand `#fc16a0` is used only for
  the cell's focus ring and the unselected-hover border, both non-text UI where the 3:1 threshold
  applies.

---

## 7. Screen S5 — Join: closed state (FR-009)

**Purpose:** Tell a member who arrived at a live URL that intake is paused, in GPC's own voice, and
send them somewhere useful instead of nowhere.

**Entry from:** `GET /join` when the form config reports `open = false`; or from a submit that
returns `form_closed` (the "closed while you were filling it in" variant).

**Exits to:** `/whats-on`, `/`, the newsletter sign-up, GPC's Instagram.

### Layout Wireframe (mobile-first, 320px)

```
┌──────────────────────────────────────────────┐ 320px
│  GPC                                     [≡] │
├──────────────────────────────────────────────┤
│                                              │
│  Join GPC Mums in                            │  <h1> — same heading as
│  Business & Work                             │  the open form. The page
│                                              │  is the same page.
│                                              │
│  ┌────────────────────────────────────────┐  │  Card, rounded-2xl, p-6
│  │                                        │  │  border-l-4 #fc16a0
│  │   ⏸   Sign-ups are paused              │  │  <h2>, text-xl
│  │                                        │  │
│  │   We've closed the form for a          │  │  ADMIN-AUTHORED
│  │   little while so we can catch up      │  │  message (FR-009),
│  │   with everyone who's already          │  │  rendered as PLAIN TEXT
│  │   joined. We'll open it again          │  │  (FR-020) — never markup
│  │   soon — thank you for your            │  │
│  │   patience.                            │  │  whitespace-pre-line
│  │                                        │  │  so admin line breaks
│  │                                        │  │  survive
│  └────────────────────────────────────────┘  │
│                                              │
│  In the meantime                             │  <h2>
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  📅  See what's on                     │  │  48px row, whole row
│  │      Events for local families    →    │  │  is the link target
│  ├────────────────────────────────────────┤  │
│  │  🔎  Browse the directory              │  │  → /directory
│  │      Local businesses run by      →    │  │
│  │      GPC members                       │  │
│  ├────────────────────────────────────────┤  │
│  │  ✉   Get the weekly newsletter         │  │  existing
│  │      We'll say when sign-ups      →    │  │  NewsletterBanner
│  │      reopen                            │  │  reused inline
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │            Back to home                │  │  Button, outline, 48px
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

**There are no form fields anywhere in the DOM.** Not hidden, not `disabled` — **absent**. A closed
form must not be a page of 25 dead inputs that a keyboard or screen-reader user tabs through before
discovering there is nothing to do.

**Fallback when the admin left the closed message blank:** the `<h2>` stays `"Sign-ups are paused"`
and the body becomes: *"We've closed the form for now. We'll open it again soon — sign up to the
newsletter below and we'll let you know."* Never an empty card, never the raw string `null`.

**Tablet / Desktop variations (differences only):**
- `md:` — the "In the meantime" rows become a 3-up card grid, matching `Events.jsx`'s
  `grid grid-cols-1 md:grid-cols-2 gap-8` idiom extended to 3 columns.
- `md:` — the closed-message card caps at `max-w-2xl` and centres.
- No `lg:`/`xl:` treatment.

### Component Hierarchy

1. `PageHeading` (**NEW**) — the same `<h1>` as the open form.
2. `ClosedNotice` (**NEW**) → `Card` (**existing**) with a left rule. Renders the admin string with
   `whitespace-pre-line` and **no** markup interpretation (FR-020).
3. `AlternativeActions` (**NEW**) → `Card` (**existing**) × 3, each a whole-row `<a>`.
4. `NewsletterBanner` — **existing** (`src/components/home/NewsletterBanner.jsx`), reused as-is. It
   already has the five-state machine and the site's only live region, so the closed page inherits a
   working, accessible fallback conversion path for free.
5. `Button` (**existing**, `variant="outline"`) — "Back to home". Needs the **`size` extension**
   for the 48px full-width mobile treatment.

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Config loaded, `open = false` | As drawn, with the admin message. | `<h1>` then `<h2>`; the notice is static content in document order and is **not** a live region — the member arrived at this page, they did not watch it change. |
| **Loading** | Config fetch in flight | Identical to the open form's loading state — a skeleton, not the closed state. **The closed state is never the default while unknown.** | `aria-busy="true"`; `LiveRegion` announces `"Loading the form"` then either `"Form ready…"` or `"Sign-ups are currently paused."` |
| **Empty** | Admin closed message is blank or whitespace | The fallback copy above. | Same as Default; nothing announced. |
| **Error** | Config fetch failed | **Not this screen.** A failed fetch shows the S1 config-error state with a retry, never the closed state. Fail-closed here would silently mislead members about a decision GPC never made; fail-open would let them fill 25 fields and then be rejected. Fail-*explicit* is the only honest option. | `role="alert"` on the error container. |
| **Success** | N/A — nothing is submitted from this screen except the reused newsletter form, which owns its own success state. | — | — |
| **Disabled** | N/A — nothing on this screen is disabled; the whole point is that the form is absent rather than dead. | — | — |

**The "closed while you were filling it in" variant** (submit returned `form_closed`): the form is
replaced by this screen with one extra paragraph inserted **above** the admin message, `role="alert"`
and focused: *"Sorry — sign-ups closed while you were filling this in. Nothing was saved."* We do not
promise recovery we cannot deliver, and we do not leave the 25 filled-in fields on screen implying
they might still go somewhere.

### Interactions & Animations

| Interaction | Behavior | Timing | `prefers-reduced-motion: reduce` |
|---|---|---|---|
| Page enter | Notice card fades + rises 8px; the three alternatives stagger | 300ms, `delay: i * 0.08` | No fade, no rise, no stagger — final positions on first paint. |
| Alternative row hover / focus | Background `#fffaf5` → `#fdf2f8`; the `→` shifts 4px right | 150ms | Background changes instantly; **the arrow does not move at all.** |
| "Back to home" press | Standard `Button` press state | 100ms | Colour only. |
| Newsletter submit | Inherited from `NewsletterBanner` — including its `animate-spin` | — | The inherited spinner **must** be gated: under reduced motion it becomes a static dot row with the text `"Sending…"`. This is a change to an existing shared component and is the one place this screen touches code outside `/join`. |

### Accessibility Annotations

- **Heading level:** `<h1>` "Join GPC Mums in Business & Work" (unchanged from the open form — the
  page's identity does not change because its state did), then `<h2>` "Sign-ups are paused" and
  `<h2>` "In the meantime".
- **Landmark role:** `<main id="main">`. No `<form>` element is rendered at all.
- **Focus management:** none on a normal load. On the "closed while filling in" variant, focus moves
  to the `role="alert"` paragraph, which has `tabindex="-1"`.
- **Screen-reader notes:** the ⏸ / 📅 / 🔎 / ✉ glyphs are all `aria-hidden="true"` with the meaning
  carried by adjacent text. Each alternative row is a single `<a>` whose accessible name is
  `"See what's on — events for local families"`, so the rotor's link list is self-describing rather
  than seven "→"s.
- **Keyboard operation:** four tab stops (three alternatives + Back to home), plus the newsletter
  form's own. Every target ≥ 48px tall and full-width.
- **iOS 16px rule:** the only input on the page is the newsletter email field inherited from
  `NewsletterBanner`; it must be verified at ≥ 16px as part of this work, since the closed page is
  where it will get the most use.

---

## 8. Screen S6 — Join: submission success / confirmation

**Purpose:** Confirm that the answers are saved, state honestly what happens next (which differs for
Bea and Carla), and hand the member somewhere to go. FR-001 requires the form to be **replaced** by
this state, not merely followed by a message.

**Entry from:** a 2xx response from `POST /api/join`. Also the state shown for a duplicate
submission (FR-007) and for a honeypot-triggered discard (FR-006) — both indistinguishable from
a genuine first submission, deliberately.

**Exits to:** `/directory`, `/whats-on`, `/`, `/privacy`.

### Layout Wireframe (mobile-first, 320px) — Bea's variant (listing requested)

```
┌──────────────────────────────────────────────┐ 320px
│  GPC                                     [≡] │
├──────────────────────────────────────────────┤
│                                              │
│           ┌────────────┐                     │
│           │     ✓      │                     │  72px disc, #c9107f
│           └────────────┘                     │  white ✓, aria-hidden
│                                              │
│  You're in, Bea.                             │  <h1>, tabindex="-1",
│                                              │  FOCUS LANDS HERE
│  Thanks for joining GPC Mums in              │
│  Business & Work. We've saved your           │
│  answers.                                    │
│                                              │
│  ┌────────────────────────────────────────┐  │  Card
│  │  What happens next                     │  │  <h2>
│  │  ────────────────────────────────────  │  │
│  │                                        │  │
│  │  1.  Your directory listing is with    │  │  <ol> — ordered,
│  │      us for review. A GPC admin        │  │  because it IS a
│  │      checks every listing before it    │  │  sequence
│  │      goes live. We aim to do that      │  │
│  │      within 5 working days.            │  │  ← matches the PRD's
│  │                                        │  │  own success metric
│  │  2.  Once it's approved, it'll         │  │
│  │      appear on the GPC directory       │  │
│  │      and anyone can find it.           │  │
│  │                                        │  │
│  │  3.  If we need to check anything,     │  │
│  │      we'll email you at the address    │  │
│  │      you gave us.                      │  │
│  │                                        │  │
│  │  4.  You'll start getting the weekly   │  │  ← ONLY if the
│  │      newsletter.                       │  │  newsletter box was
│  │                                        │  │  ticked. Omitted
│  └────────────────────────────────────────┘  │  entirely if not.
│                                              │
│  ┌────────────────────────────────────────┐  │  Card, #fffaf5 tint
│  │  🔒  What stays private                │  │  <h2>
│  │  ────────────────────────────────────  │  │
│  │  Your email, postcode, first name      │  │  restates the FR-003
│  │  and every answer you gave in this     │  │  promise AFTER the
│  │  form stay inside GPC. They are        │  │  fact — the moment
│  │  never shown on the directory.         │  │  people most want
│  │                                        │  │  reassurance
│  │  Changed your mind? You can ask us     │  │
│  │  to remove your listing or all your    │  │  FR-023
│  │  data at any time — see our            │  │
│  │  privacy page.                         │  │  link, #c9107f
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │         Browse the directory           │  │  Button primary,
│  └────────────────────────────────────────┘  │  #c9107f, 48px
│  ┌────────────────────────────────────────┐  │
│  │         See what's on                  │  │  Button outline, 48px
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

**Carla's variant (directory declined) — differences only:**

```
│  You're in, Carla.                           │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  What happens next                     │  │
│  │  ────────────────────────────────────  │  │
│  │  1.  We've added you to the GPC Mums   │  │  ← NO listing item,
│  │      in Business & Work community.     │  │  NO "awaiting review",
│  │                                        │  │  NO newsletter item
│  │  2.  We use your answers to plan       │  │  (she left it unticked)
│  │      events people can actually        │  │
│  │      come to — that's the whole        │  │  ← pays back the
│  │      reason we asked.                  │  │  survey questions
│  │                                        │  │
│  │  3.  Watch out for our next event —    │  │
│  │      we'd love to see you there.       │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │         See what's on                  │  │  primary
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │         Back to home                   │  │  outline
│  └────────────────────────────────────────┘  │
```

**The first name is used, and it is safe.** The confirmation is rendered from **in-memory client
state**, never from a URL parameter, a query string, or a route segment. The name therefore appears
in no shareable link, no referrer header, no analytics path, and no browser-history entry. If a build
ever needs to survive a reload here, it must re-render the generic `"You're in."` rather than
persist the name — that is the rule, not a preference.

**Tablet / Desktop variations (differences only):**
- `md:` — content caps at `max-w-2xl`, centred; the two `Button`s become a side-by-side row, primary
  on the left (reading order matches priority order).
- `md:` — "What happens next" and "What stays private" sit side by side as a 2-up grid.
- No `lg:`/`xl:` treatment.

### Component Hierarchy

1. `SuccessPanel` (**NEW**) — replaces the entire `<form>` subtree.
   1.1 `SuccessMark` (**NEW**) — the 72px disc. `aria-hidden="true"`.
2. `PageHeading` (**NEW**) — the `<h1>`, given `tabindex="-1"` so focus can land on it.
3. `Card` (**existing**) × 2 — "What happens next", "What stays private". Consumer supplies `p-6`.
4. `NextStepsList` (**NEW**) — an `<ol>` whose items are assembled conditionally from
   `{ listingRequested, newsletterConsented, group }`. There is no generic "thanks!" fallback: every
   member sees a list that describes *their* submission.
5. `Button` (**existing**) × 2 — needs the **`size` extension** for the 48px full-width mobile form.
   Primary fill `#c9107f`, white text (5.43:1). Never `#fc16a0` behind white text (3.64:1, fails AA).
6. `LiveRegion` (**NEW**) — the page-level instance, reused for the announcement.

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | 2xx received; success panel mounted | As drawn, tailored by `{ listingRequested, newsletterConsented }`. | `<h1 tabindex="-1">` receives focus. `LiveRegion` (polite) announces `"Your answers have been sent. Your directory listing is with us for review."` The announcement and the focus move are complementary: focus gives navigable position, the live region gives the outcome. |
| **Loading** | Submit in flight, before the response | **This screen does not exist yet.** The form remains on screen with its submit button in the loading state: label `"Sending…"`, `aria-busy="true"`, `aria-disabled="true"`, spinner (gated on reduced motion). Fields are **not** disabled — if the request fails we want them still editable and still focusable. | Submit button `aria-busy="true"`; `LiveRegion` announces `"Sending your answers"` once. |
| **Empty** | N/A — a success state is never empty; the "what happens next" list always has at least the community item. | — | — |
| **Error** | N/A on this screen — by the time it renders the write has succeeded (NFR-011: *"a member who sees a success message has been recorded"*). A partial failure downstream (e.g. a notification email) must **not** downgrade this screen; it surfaces to admins instead. | — | — |
| **Success** | This screen *is* the success state. | — | — |
| **Disabled** | N/A — two links, neither disabled. | — | — |

**Back-button behaviour.** The route is still `/join`. Pressing Back leaves the page entirely rather
than returning to a filled-in form, which is correct: returning to a form whose answers were already
accepted invites a duplicate submission. FR-007 makes a duplicate harmless, but inviting one is still
a bad experience.

### Interactions & Animations

| Interaction | Behavior | Timing | `prefers-reduced-motion: reduce` |
|---|---|---|---|
| Form → success swap | Form fades out (150ms), success panel fades + rises 12px (300ms) | 450ms total | Straight swap, no fade, no rise. Focus still moves to the `<h1>`. |
| Success mark | Disc scales 0.6 → 1, ✓ stroke draws | 400ms `ease-out` | Rendered complete and static. No draw, no scale, no bounce, no confetti — and no confetti in *either* mode: a full-screen particle effect on a page that has just handled someone's personal data reads as flippant. |
| Next-steps list items | Stagger in | `delay: i * 0.08` | All present at once. |
| Button press | Standard | 100ms | Colour only. |
| Scroll to top on mount | `window.scrollTo({ behavior: 'smooth' })` | ~400ms | `behavior: 'auto'` — instant. |

### Accessibility Annotations

- **Heading level:** `<h1>` "You're in, Bea." — this **replaces** the form's `<h1>`; there is still
  exactly one `<h1>` on the page. Then `<h2>` "What happens next" and `<h2>` "What stays private".
- **Landmark role:** `<main id="main">`, unchanged. The `<form>` element is removed from the DOM.
- **Focus management:** focus moves to the `<h1>` (`tabindex="-1"`) on mount. Not to the first button
  — a member who cannot see the screen needs the outcome before the options. The `<h1>` is also the
  natural place to resume `H`-key navigation from.
- **Screen-reader notes:** the announcement is fired from the existing polite `LiveRegion` about
  100ms *before* focus moves, so a member hears `"Your answers have been sent…"` and then
  `"You're in, Bea, heading level 1"`. The ordered list is a real `<ol>` so the count
  (`"list, 4 items"`) is announced — which is itself reassurance that the process is finite.
- **Keyboard operation:** after the `<h1>`, Tab reaches the privacy link, then the two buttons. Three
  stops. Every target ≥ 48px.
- **iOS 16px rule:** no inputs on this screen; not engaged.

---

## 9. Screen S7 — Join: submission error states

**Purpose:** Never lose a member's twenty-five answers, never blame them for our failure, and always
name the next action. This screen is a set of states layered on the *still-populated* form, not a
separate page — with one exception (form closed), which is a page replacement.

**Entry from:** a non-2xx response from `POST /api/join`, or a failed `fetch`.

**Exits to:** back into the form (every recoverable case), or S5 (form closed).

**Universal rule for every error state below:** the form, and every answer in it, **stays on screen
and stays editable**. Nothing is cleared, nothing is disabled, no field loses its value. The only
thing that changes is that an alert appears and the submit button becomes actionable again.

### Layout Wireframe (mobile-first, 320px) — the error banner in context

```
┌──────────────────────────────────────────────┐ 320px
│  GPC                                     [≡] │
├──────────────────────────────────────────────┤
│                                              │
│  Join GPC Mums in Business & Work            │  <h1> unchanged
│                                              │
│  ┌────────────────────────────────────────┐  │  ErrorSummary
│  │ ⚠  We couldn't reach GPC just now      │  │  role="alert"
│  │                                        │  │  tabindex="-1"
│  │    Your answers are still here.        │  │  border-l-4 #b91c1c
│  │    Check your connection and try       │  │  bg #fef2f2
│  │    again — nothing has been lost.      │  │  text #7f1d1d (8.1:1)
│  │                                        │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │           Try again              │  │  │  Button, 48px
│  │  └──────────────────────────────────┘  │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  1 of 7 · About you         ✓ Done     │  │  form intact below,
│  │  ────────────────────────────────────  │  │  every value retained
│  │  What's your first name?             * │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │ Bea                              │  │  │  ← still there
│  │  └──────────────────────────────────┘  │  │
│  │  ...                                   │  │
└──────────────────────────────────────────────┘
```

**Validation-error variant — differences only:**

```
│  ┌────────────────────────────────────────┐  │
│  │ ⚠  There are 3 things to fix before    │  │  <h2> inside the alert
│  │    we can send this                    │  │
│  │                                        │  │
│  │  • Your email address — enter an       │  │  <ul> of links.
│  │    email address so we can reply       │  │  Each link jumps to
│  │  • Which group would you like to       │  │  and focuses its field.
│  │    join? — choose the group you'd      │  │  Link text = the
│  │    like to join                        │  │  field's own label
│  │  • Which days and times usually        │  │  + the fix.
│  │    work best? — pick at least one      │  │
│  │    slot, or tick "I'm flexible"        │  │  Ordered top-to-bottom
│  │                                        │  │  in DOM order, so it
│  └────────────────────────────────────────┘  │  matches the form.
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  1 of 7 · About you       ⚠ 1 to fix   │  │  Badge NEW `error`
│  │  ────────────────────────────────────  │  │  variant
│  │  What's your email address?          * │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │ bea@                             │  │  │  border #b91c1c 2px
│  │  └──────────────────────────────────┘  │  │  aria-invalid="true"
│  │  ⚠ Enter an email address so we can    │  │  role="alert"
│  │    reply — like bea@example.com        │  │  id="email-error"
│  └────────────────────────────────────────┘  │  linked by
                                                  aria-describedby
```

**Rate-limited variant — differences only:**

```
│  ┌────────────────────────────────────────┐  │
│  │ ⏳ Just a moment                        │  │  amber left rule
│  │                                        │  │  (#b45309 text — the
│  │    You've sent this a few times in     │  │  token #f59e0b is
│  │    a row. Please wait a moment and     │  │  2.15:1 and MUST NOT
│  │    try again. Your answers are         │  │  carry text)
│  │    still here.                         │  │
│  │                                        │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │      Try again in 47s            │  │  │  disabled Button,
│  │  └──────────────────────────────────┘  │  │  counts down, then
│  └────────────────────────────────────────┘  │  becomes "Try again"
```

**Tablet / Desktop variations (differences only):**
- `md:` — the alert caps at `max-w-2xl` and centres with the form column. Its "Try again" button
  becomes inline-width rather than full-width.
- `md:` — validation summary links go to two columns when there are more than six.
- The alert is **never** made a sticky/floating toast at any breakpoint. `react-hot-toast` exists in
  exactly one file and there is no global `<Toaster>`; a transient toast is also the wrong pattern for
  an error that requires the member to act on specific fields further down the page.

### Component Hierarchy

1. `ErrorSummary` (**NEW**) — one component, five renderings, selected by an `errorKind` prop:
   `network | validation | rate_limited | server | form_closed`. Same DOM position (immediately above
   section 1), same `role="alert"`, same `tabindex="-1"`.
   1.1 `ErrorSummaryLinkList` (**NEW**) — validation only.
   1.2 `RetryCountdownButton` (**NEW**) — rate-limited only. Wraps `Button` (**existing**) and needs
   both the **`disabled` styling extension** and the **`loading` extension** noted in the shared
   context.
2. `FieldError` (**NEW**) — the inline per-field message; `role="alert"`, id-linked via
   `aria-describedby`.
3. `Badge` (**existing**) with a **NEW `error` variant** — `⚠ 1 to fix` on section headings.
4. `LiveRegion` (**NEW**) — page-level instance; used only for the rate-limit countdown milestones.

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | No error | `ErrorSummary` is **not rendered** at all — not rendered-empty. An empty `role="alert"` container that later gains content is the more common implementation and it works, but an unconditionally present alert region has a habit of announcing stale content on re-render. | — |
| **Loading** | Submit in flight | Any previous `ErrorSummary` is removed at the *start* of the request, so a stale error is never on screen next to a live spinner. Submit button: `"Sending…"`, `aria-busy`, `aria-disabled`. Fields stay enabled. | `LiveRegion`: `"Sending your answers"`. |
| **Empty** | N/A — an error state with no errors is the Default state. | — | — |
| **Error** | See the five kinds below. | See below. | `role="alert"` on the summary, rendered *before* focus moves; `requestAnimationFrame` then moves focus per kind. |
| **Success** | N/A — success replaces the whole form (S6). | — | — |
| **Disabled** | Rate-limited only: the submit button is disabled for the cool-off window. No field is ever disabled by an error state. | Button shows the live countdown. | `aria-disabled="true"` **rather than** the `disabled` attribute, so the button stays focusable and a screen-reader user can read the countdown from it. `aria-describedby` points at the alert. |

**The five error kinds, in full:**

| Kind | Trigger | Heading | Body | Action | Focus | Announcement |
|---|---|---|---|---|---|---|
| **network** | `fetch` rejected, or no response | `"We couldn't reach GPC just now"` | `"Your answers are still here. Check your connection and try again — nothing has been lost."` | `Try again` (re-posts the identical payload) | The `ErrorSummary` container | assertive, via `role="alert"` |
| **validation** (client, on submit) | ≥ 1 visible required field unanswered or invalid | `"There are 3 things to fix before we can send this"` (count is real; singular `"There's 1 thing to fix…"`) | A link per error: `"<field label> — <the fix>"` | Each link jumps to and focuses its field | **The first offending field** (FR-001), on the frame after the alert renders | the alert, then the focused field's label + `aria-describedby` |
| **validation** (server, 400) | Server rejected a field (e.g. over-length free text, FR-006) | Same component, same wording shape | Server-returned field keys are mapped to the same client messages; any unmapped key falls back to `"Something in this answer isn't accepted. Please shorten or simplify it."` | Same | Same | Same |
| **rate_limited** (429) | FR-006 threshold exceeded | `"Just a moment"` | `"You've sent this a few times in a row. Please wait a moment and try again. Your answers are still here."` **Never** `"you look like a bot"` — a real member on shared café or nursery wi-fi will hit this and must not be accused. | `Try again in 47s`, counting down, then re-enabled | The `ErrorSummary` container | polite; the countdown is announced at 60s / 30s / 10s / ready only — **never** per second |
| **server** (5xx, or a non-JSON body) | Any other non-2xx; or `res.json()` threw (the `NewsletterBanner.jsx` `.catch(() => ({}))` idiom) | `"Something went wrong at our end"` | `"That's our fault, not yours. Your answers are still here — please try again in a moment. If it keeps happening, the contact address is on our privacy page."` | `Try again` | The `ErrorSummary` container | assertive |
| **form_closed** (409) | Admin closed the form mid-session (FR-009) | — | Page is **replaced** by Screen S5 with the leading alert `"Sorry — sign-ups closed while you were filling this in. Nothing was saved."` | `Back to home` | The alert paragraph | assertive |

**Duplicate submission — N/A by design.** FR-007 requires that *"the response never reveals whether
the email was already registered"* and that the member sees *"the ordinary confirmation state"*.
There is therefore **no duplicate error state on this screen, and there must never be one**. A
duplicate renders Screen S6, identically to a first submission. Any future "you've already joined"
message would be an email-enumeration oracle on an unauthenticated public endpoint, and would leak
membership of a group whose members include people who may not want that known.

**Double-submit protection** is the adjacent concern and is handled at the button, not here: the
submit button is `aria-disabled` and pointer-inert for the duration of the request, so a double tap
posts once.

### Interactions & Animations

| Interaction | Behavior | Timing | `prefers-reduced-motion: reduce` |
|---|---|---|---|
| `ErrorSummary` appears | **No entrance animation, in either mode.** It is an assertive alert; animating it delays the moment it is readable and can race the screen-reader announcement. It renders at full opacity in final position. | 0ms | Identical. |
| Scroll to the first offending field | `scrollIntoView({ behavior: 'smooth', block: 'center' })` | ~400ms | `behavior: 'auto'` — instant jump. |
| Summary link activation | Focus + scroll to the target field | ~400ms | Instant. |
| Field error border | Border colour `#e5d9f2` → `#b91c1c`, 2px | 150ms crossfade | Instant. **No shake, in either mode** — a shake is a motion trigger and communicates nothing a red border and a sentence do not. |
| Error clears as the member fixes a field | Border and message fade out on `blur` (not on `change`, which would clear the message mid-typing) | 150ms | Instant removal. |
| Rate-limit countdown | Number updates every second | 1s tick | Identical — a text update is not an animation. Announcements stay at the four milestones. |
| Submit button `loading` → `idle` after an error | Spinner out, label back | 150ms | The `animate-spin` is replaced by static `"Sending…"` text for the whole duration. |

### Accessibility Annotations

- **Heading level:** the page `<h1>` is unchanged (the form is still the page). The `ErrorSummary`
  heading is an `<h2>` placed *before* the first section's `<h2>`, so the document outline stays flat
  and correct.
- **Landmark role:** none added. The alert lives inside `<main>`, inside the `<form>`, immediately
  before section 1 — in DOM order, so it is encountered on the way down rather than being an
  out-of-flow surprise.
- **Focus management:** the alert renders first; focus moves on the next animation frame. For
  validation, focus goes to **the first offending field** (FR-001's literal wording). For every other
  kind, focus goes to the `ErrorSummary` container itself (`tabindex="-1"`), because there is no
  field to blame. Focus is **never** moved to the retry button — that would let a member re-submit
  by reflex before reading why the last attempt failed.
- **Screen-reader notes:** exactly one `role="alert"` fires per failed submit. Per-field `FieldError`
  messages also carry `role="alert"`, but they mount in the same commit as the summary; to avoid a
  storm of simultaneous assertive announcements, the per-field messages mount with `role="alert"`
  **only when they appear individually** (i.e. on blur validation after the first submit). On the
  submit that creates them all at once, they mount as plain `aria-describedby` text and the summary
  does the announcing. This is the one genuinely fiddly rule in this document and it must be checked
  during the NFR-008 screen-reader pass.
- **Keyboard operation:** the summary's links are a normal list of links — Tab through them, Enter
  to jump. From the last link, Tab continues into section 1, so the summary never becomes a trap.
  The rate-limited button stays focusable (via `aria-disabled`, not `disabled`) so its countdown is
  readable.
- **Contrast:** error text `#7f1d1d` on `#fef2f2` = 8.1:1. Error borders `#b91c1c` = 3:1+ against the
  card, meeting the non-text threshold. The rate-limit notice uses `#b45309` for text, **not** the
  `--color-amber` token `#f59e0b`, which is 2.15:1 on white and must never carry text. The brand
  `#fc16a0` appears nowhere in any error state.
- **iOS 16px rule:** unchanged from the underlying form — every field is still 16px and still
  editable. Error and hint text at 14px is permitted (not focusable). The rate-limit countdown is
  inside a button, so 16px is not required, but it is set to 16px anyway because it is a number the
  member is reading under mild stress.

---

## Gaps found

Items where this section hit a genuine gap rather than deciding silently. Each names who resolves it
and what is blocked.

1. **FR-001 mandates focusing the first offending field; the established a11y pattern focuses the
   error summary.** D3 satisfies FR-001 literally and renders the summary as a `role="alert"` on the
   preceding frame, producing two announcements. This has not been verified against a real screen
   reader. *Owner:* UX + builder, during the NFR-008 manual pass. *Blocks:* nothing; may require a
   copy or sequencing tweak.

2. **De-requiring the three long-text questions (B7, C4, "What do you hope to gain") is a change to
   the source form's required flags.** It is the largest single completion-rate lever available
   (source defect 9) and FR-008 makes the flags admin-editable, so no code change is implied. But it
   trades away qualitative depth that FR-014's insights view would otherwise get for free.
   *Owner:* PM, before the EPIC-001 seeded config is written. *Blocks:* the seeded form config.

3. **A "No preference" option for event frequency is recommended but not specified.** Defect 4 is
   fixed by making the control single-select, which means a member with genuinely no preference must
   now pick a lie. Adding the option is within FR-008's admin powers but is a change to the source
   option list, so it needs PM sign-off rather than a UX decision. *Owner:* PM. *Blocks:* the seeded
   config for the Events section.

4. **The public enquiry contact's field type is undecided (addendum Q3), and whether it is displayed
   in the clear is undecided (Q4).** Journey A's highest-risk moment is a field whose input type,
   validation, keyboard, and warning copy all depend on Q3. This section specifies the *warning* for
   the signup-email case but cannot specify the field. *Owner:* PM/UX. *Blocks:* the FR-003 section
   of `/join`.

5. **The starter category taxonomy is undecided (addendum Q2).** Whether the category control is a
   `<select>`, a searchable combobox, or a chip group depends entirely on whether the list is 8
   items or 60. At 320px those are three different designs. *Owner:* GPC admins. *Blocks:* the FR-003
   section.

6. **No support/contact email address exists anywhere in the PRD or addendum.** Three pieces of
   microcopy in this section ("If it keeps happening…", "Changed your mind?…", the config-error
   fallback) currently point at "the address on our privacy page" as a hedge. If the privacy page
   does not carry one, these strings are dead ends. *Owner:* controller. *Blocks:* final copy.

7. **Whether a last name is collected is open (addendum Q7).** It would add a field to Screen S1 and
   change every question count and time estimate quoted in this document. *Owner:* PM. *Blocks:*
   Screen S1's final field list.

8. **Tab discard / session loss has no mitigation.** FR-D07 (save and resume) is deferred because
   identifying a partial submitter before consent is itself processing. But iOS Safari discards
   backgrounded tabs, and Carla's persona is explicitly "in fragments, often between other tasks".
   A same-tab-only `sessionStorage` draft of the non-sensitive answers would cost little and is
   arguably not new processing (it never leaves the device) — but that is a controller call, not a
   UX one. *Owner:* controller + PM. *Currently:* no mitigation specified. This is the most likely
   cause of a lost submission that no requirement covers.

9. **NFR-007's post-launch measurement needs a form-start timestamp in the payload** ("submission
   timestamps compared against form-start"). No FR names this field. This section assumes the form
   posts elapsed seconds since mount — a non-personal integer. It needs to exist in the data model
   and be disclosed if it is retained. *Owner:* architecture. *Blocks:* the NFR-007 metric.

10. **The rate-limit window and threshold are undecided (FR-006 is a Must; the mechanism is an open
    architecture dependency).** The countdown copy `"Try again in 47s"` needs a real number, and if
    the window is measured in minutes rather than seconds the copy and the control both change.
    *Owner:* architecture. *Blocks:* Screen S7's rate-limited state.

11. **Roving-tabindex for the day/time matrix is deferred.** Plain checkboxes with plain Tab are
    specified because they are fully WCAG-conformant, have no custom-widget bug surface, and are
    maintainable by one part-time developer (NFR-012). The row/column toggles mean no keyboard user
    is forced through all 21 stops. If usability testing shows otherwise, an ARIA grid with arrow-key
    navigation is the upgrade path. *Owner:* builder. *Blocks:* nothing.

12. **D4 (pre-filling the directory's business name/website/Instagram from B3/B4/B5) is an inference,
    not a stated requirement.** FR-002 fixes the Business branch at 7 questions and FR-003
    independently requires the same three fields in the directory section; nothing in the PRD says
    what to do about the overlap. Pre-fill is specified here because the alternative — asking twice —
    is indefensible. The other resolution (move the fields entirely, leaving 4 business questions)
    would contradict FR-002's explicit "7 Business questions". *Owner:* PM, to confirm the reading.

13. **FR-009 does not say whether the admin-authored closed message may contain a link.** This
    section renders it as plain text with preserved line breaks (FR-020: submitted text is never
    rendered as markup — the same principle applied to admin-authored config). If admins need to
    link to an Instagram post or an event, that is a config-shape change, not a copy change.
    *Owner:* PM.

14. **Restating NFR-007 precisely:** "a Career Mum declining the directory answers zero business
    questions" holds structurally. A Career Mum who *opts in* is asked FR-003's six listing fields,
    which are business fields in substance — required by FR-003 and the deliberate fix for source
    defect 1. The guarantee should be quoted with its condition attached in any acceptance test, not
    rounded up to "Career Mums never see business questions". *Owner:* PM/QA, at acceptance.
