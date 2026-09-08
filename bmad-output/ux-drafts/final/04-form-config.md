## 4. Configuring the form

**Covers:** FR-008 (edit question wording) · FR-009 (open/close the form) · FR-010 (preview) · FR-006 criterion 5 (admin-visible count of rejected submissions).
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

**Absent, not disabled.** A capability that never exists for anyone (add/delete/move a question, rewire branching, change a question's type) renders **no control at all**; its absence is explained once, in prose. A capability that exists but is unavailable *for this specific thing right now* (retire the last remaining option; make the branch-key question optional) renders **visible, dimmed, `aria-disabled="true"` so it stays focusable, with a permanently visible reason beside it** — never hover-only, never a lock icon. Reasons are stated as consequence, never as permission: "The rest of the form depends on this answer", not "You cannot change this." A greyed-out button is a promise the product cannot keep; a missing button with a paragraph explaining the shape of the tool is just how the tool is shaped. The explanation sits permanently at the foot of every question list — an `InlineDisclosure`, never dismissible:

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
   │ Publish ────────────┬───────────────────────────┐
   ▼ success             │                           ▼ failure
   ✓ "Published. Members see    "Couldn't publish — the changes
     your changes now."          are still saved as a draft."
     [View the live form ↗]      [Try again] · the draft survives
   Both transform the bar in place; Ash stays on this screen.
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
│  Everything members see at /join       │  lede under the h1
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
│ │ Intro text — plain text + [links]  │ │  textarea 6 rows; counter
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
│ │ [Preview draft][Publish][Discard]  │ │  ="Unpublished changes"
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
│ │   ▲  ▼                      Retire │ │  three 44×44 buttons
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
│ │ Retired 3 Jun 2026 · still on 47   │ │  never strikethrough alone
│ │ past answers  [ See those 47 → ]   │ │  ← EVIDENCE, then PROOF
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
│ ║   ┌──────────────────────────────┐   ║  "Preview of the public
│ ║   │ The Business and Career      │   ║  join form"
│ ║   │ questions appear once a group│   ║  shown when "Not chosen
│ ║   │ is chosen. Use Viewing as.   │   ║  yet" — an unexplained
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
- **`config_version` is unspecified in the PRD and this section depends on it.** Publish increments it; submissions declare the version they rendered from; the server validates against the declared version. Without it a required-flag change can reject a member who never saw the rule — the most consequential item here. Insights also reads question and option labels from this configuration rather than a hard-coded list, and what it shows for answers collected under earlier wording is unspecified between the two sections.
- **Two backend assumptions:** the configuration row is seeded from `FORM_STRUCTURE` by migration (which makes S1's Empty state unreachable and guarantees `/join` renders on first deploy), and the config row supports optimistic concurrency (without it the publish-conflict state above cannot exist and the last publish silently wins).
- **Question *type* is not admin-editable**, so the source form's checkbox/radio defect ("How often would you like events?" accepting Weekly + Quarterly) must be fixed in `FORM_STRUCTURE` before launch. No FR assigns it.
- **The abuse counter needs a queryable store of rejections** with a reason enum (`honeypot` / `rate_limit`) and a timestamp, retaining no personal data — the tile, the 24-hour rate and the 7/30-day windows all read from it.
- **The admin sidebar reaches ~13 flat items** across these epics and wants grouping (no single FR owns it), and `gpc.communitynews@gmail.com` should be confirmed as the right destination for "we couldn't take your sign-up" mail before launch.
