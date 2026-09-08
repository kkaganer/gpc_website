# EXPERIENCE.md — Section: Admin Form Configuration (EPIC-002)

**Covers:** FR-008 (edit question content), FR-009 (open/close the form), FR-010 (preview).
**Persona:** Ash — GPC admin. Volunteer, not technical, works in short bursts on a laptop, must never open a database.
**Related:** FR-002 (branching), FR-003 (directory section), FR-017 (category taxonomy — see the cross-epic note in Journey B).

> Source docs read: `ux-shared-context.md`, `prd.md`, `addendum.md`, `inputs/tally-form-RG1M6K-structure.md`.
> Tokens, contrast rules, radius grammar and primitive inventory are inherited from `ux-shared-context.md` and not restated.
> Canonical public domain (from `index.html` `og:url`): `greenwichparentsandcarers.co.uk`.
> Community contact address (from `src/`): `gpc.communitynews@gmail.com`.

---

## 0. The design problem, and how this section solves it

Ash may edit **labels, help text, choice options, required flags, the intro text, the closed message, and the open/closed state.** She may **not** add, delete or re-parent questions, or change branching.

That boundary is real and permanent — it is what keeps every already-stored answer attached to the question that produced it. The risk is that it *reads* as a permissions lock: a greyed "+ Add question" button that never becomes available, which teaches Ash that the tool is withholding something from her personally. Every time she meets it she re-learns that she is not trusted.

The whole section is built on four moves.

### Move 1 — Absent, not disabled, for capabilities that never exist

**The rule, applied everywhere in this section:**

- A capability that **never** exists for anyone (add a question, delete a question, move a question between branches, rewire branching) has **no control at all**. There is no dimmed button, no lock icon, no tooltip. Its absence is explained **once**, at section level, in prose.
- A capability that **does** exist but is unavailable **right now, for this specific thing** (retire the last remaining option; make the branch key optional) is **visible, dimmed, and explained inline** — following the site's established `EventFilters` idiom of dimming dependent controls rather than hiding them.

A greyed-out button is a promise the product cannot keep. A missing button with a paragraph explaining the shape of the tool is just how the tool is shaped. This distinction is the load-bearing one; every "Disabled" state below traces back to it.

### Move 2 — Explain in terms of members' data, never in terms of permission

The single piece of copy that carries the boundary, shown permanently at the foot of the question list (never dismissible, never behind a tooltip):

> **Why can't I add or remove questions?**
> The questions, their order, and the branching — which questions appear after "Which group would you like to join?" — are built into the site, so that every answer already stored stays attached to the right question. Wording is safe to change and takes a few seconds. Changing the *set* of questions would leave answers hanging off questions that no longer exist, so it's a code change. Email Kristina; it's a small job.

Three things this copy does deliberately: it gives the reason (members' stored answers), it names the tradeoff (wording is cheap, structure is not), and it gives a route forward (email a person). It never uses the words *permission*, *allowed*, *locked*, or *restricted*.

### Move 3 — Draw the line where Ash already feels it: content vs. structure

The screens use a vocabulary that puts the boundary somewhere Ash already believes it is:

| Never used in this UI | Used instead |
|---|---|
| Form builder | Form settings |
| Field, schema, block | Question |
| Add / delete question | *(no such action)* |
| Delete option | Retire option |
| Conditional logic, branch config | "Only shown if they choose Business Mums or Both" (stated as fact, read-only) |

Crucially, **options are freely addable and removable while questions are not** — and that could be the most arbitrary-feeling part of the whole boundary. It is disarmed with one line at the top of the options panel:

> "Options are just words on a list — add, rename, reorder and retire them as much as you like."

Options are content, so they behave like content. Questions are structure, so they behave like structure. Ash never has to hold that distinction abstractly; each panel behaves consistently with what it says it contains.

### Move 4 — Give Ash real power where she has it

The boundary is easier to accept when the permitted territory is genuinely powerful and front-and-centre. The open/closed switch is the first thing on the settings screen and takes effect **immediately** — Ash can take the public form offline in one tap. The intro text and closed message are full editors, not tiny inputs. Every question is editable, including the required flags. Nothing that is permitted is buried.

### The one-sentence summary Ash actually reads

Printed at the top of the question list, under the section heading:

> "You can change how every question is worded. The questions themselves, and which ones follow from which, are built into the site."

**Present tense, factual, no modal verbs about her.** "The questions are built into the site" is a statement about the software. "You cannot add questions" is a statement about Ash. The first one is true and neutral; the second one is true and insulting.

---

## 1. Routes and navigation

| Route | Screen |
|---|---|
| `/admin/join-form` | Form settings overview |
| `/admin/join-form/questions/:questionId` | Question editor |
| `/admin/join-form/preview` | Preview |
| `/admin/directory/categories` | Categories (specified in the EPIC-005 section — see Journey B) |

Sidebar entry appended to the single array at `src/components/admin/AdminLayout.jsx:5-16`:
`{ to: '/admin/join-form', label: 'Join form', icon: ClipboardList }`, placed directly above `Subscribers`.

Admin home (`Dashboard.jsx`) gains a `quickLinks` entry:
label **"Join form"**, description **"Edit the wording of the membership form at /join, open or close it to new members, and preview each branch."**, colour `bg-fuchsia-50 text-fuchsia-700`.
The card carries a live status line: **"Open · 3 unpublished changes"** or **"Open · up to date"** or **"Closed since 12 Aug"**. This status line is the primary defence against Journey A's biggest failure mode (editing and never publishing).

---

## 2. Draft vs published edits — the decision

### Decision

**Content edits are drafts and require an explicit "Publish changes". The open/closed switch is the single exception and takes effect immediately.**

> **One rule:** if it changes what the public sees, it stays a draft until you publish it.
> **One exception:** the open/closed switch, which is an emergency control and acts at once.

That two-line rule is printed verbatim on the settings screen, at the top of the question list section.

### Justification

1. **The PRD asks for it.** FR-010's third acceptance criterion is "The preview reflects unsaved draft edits, so wording can be checked **before publishing**." The PRD's own language presumes a publish step distinct from saving. Immediate-on-save would make that criterion incoherent — there would be no "before publishing" to be in.

2. **FR-008 is satisfied either way.** Its guarantee is "the public form shows the new text **without a deploy**". Publish is not a deploy; it is a state change on a row. The requirement is met.

3. **Multi-step edits pass through incoherent intermediate states.** Journey B is *add one category, retire another* — two saves. Under immediate-on-save the public form spends the interval between them offering both the new and the retired category, or neither, depending on order. Under draft/publish both land in the same instant. This generalises: any edit that is really one editorial intention but several form interactions needs a transaction, and Publish is that transaction.

4. **Ash is a volunteer working in short bursts.** She will be interrupted mid-edit — the persona says so explicitly. Immediate-on-save means every interruption leaves the public form in whatever half-considered state she reached before her kid shouted. Draft/publish means an interruption costs nothing: the public form is untouched until she comes back and commits.

5. **It creates a natural place to preview.** Preview with nothing to preview against is a weak feature. "Preview draft" sitting next to "Publish changes" makes FR-010 a step in the flow rather than a thing Ash must remember exists.

### Why the open/closed switch is exempt

Closing the form is what Ash does when spam is arriving, when moderation is three weeks behind, or when something has gone wrong. It is a fire alarm. A fire alarm that requires a second confirmation step in a different part of the page is a broken fire alarm. It is also **state, not content** — it changes whether the form is served, not what the form says — so exempting it does not muddy the rule.

The exemption is stated on screen, directly under the switch, so it is never a surprise:
> "This switch takes effect straight away. It isn't part of Publish."

### What a member mid-submission experiences

The public form fetches its configuration **once, at page load**, and holds the `config_version` it was rendered from. Every submission declares that version, and the server validates the payload **against the version the member declared**, not against the current one. That single decision makes almost every mid-flight change a non-event.

| Change published while a member is mid-form | What she experiences |
|---|---|
| A label or help text is edited | Nothing. Her page is not refetched and does not re-render. She finishes on the wording she started with. |
| An option is **renamed** | Nothing on screen. Her stored answer resolves to the new label when anyone later views it — correct, because a rename is a spelling fix on the same option, not a different option. |
| An option is **retired** | Nothing on screen; the option she can see stays selectable and her answer is accepted, because it was live in the version she declared. This is FR-008's "retiring never rewrites stored answers" extended to the in-flight case. |
| An option is **added** | She does not see it. Harmless. |
| A required flag is switched **on** | She is not blocked. The server validates against her declared version, so a rule she never saw cannot fail her. This is the case that most justifies version-pinned validation. |
| A required flag is switched **off** | She still sees the asterisk and is still asked. Mildly stale, harmless. |
| The intro text is edited | Nothing — it is already on screen. |
| The **form is closed** | **The only lossy case.** Her submission is rejected (FR-009 requires this). Handled explicitly below. |

**The closed-mid-submission case.** Her submit returns the distinct "form closed" status, and the client maps that specific status — not the generic error path — to a dedicated state. Her typed answers are **never cleared**.

> **The form closed while you were filling this in**
> We're really sorry. GPC has just paused new sign-ups, so we couldn't send this.
> Nothing you typed has been lost — it's all still on this page. Copy your answers and email them to gpc.communitynews@gmail.com and we'll add you by hand.
> `[Copy my answers]`

Rendered with `role="alert"`, focus moved to its heading, and the form left intact and editable beneath it so a retry works if Ash reopens.

**And Ash is told this will happen**, in the close confirmation dialog, before she does it:
> "Anyone part-way through the form right now won't be able to send it. They'll see a message asking them to email us instead."

That honesty is the reason the immediate-effect exemption is defensible: the one destructive consequence of the one immediate control is disclosed at the moment of the decision.

---

## JOURNEY A — "Ash fixes a typo"

**Goal:** Correct "Weekly Newletter" → "Weekly Newsletter" on the live form, and be certain nothing else changed.

**Primary persona:** Ash — GPC admin. Volunteer, not technical, laptop, short burst.

**Estimated time:** 45–70 seconds from admin home to corrected public form.

**Entry points:**
- Admin home → "Join form" quick-link card (primary).
- Admin sidebar → "Join form".
- A member emails to say the form has a typo; Ash pastes `/admin/join-form` from a bookmark.
- Ash is already on the settings screen doing something else and spots it.

**Success criteria:**
- The public `/join` form reads "Weekly Newsletter" without a code deploy.
- Ash saw, before committing, that the ~312 members who already chose this option keep their answer and simply have its spelling corrected on their record.
- Ash was never asked to confirm anything about approval, moderation, or re-publishing member data.
- Ash ends on the settings screen, not ejected to a list.

> **Note on where the typo lives.** Per the source-form inventory, "Weekly Newletter" is an **option** of question 4, *"How did you hear about us?"* — not a question label. So this journey exercises the **option rename** path, which is the right thing to make fast, because renaming is the safest operation in the whole section.

### Happy Path

```
┌─────────────────────────────────────────────────────────────────┐
│ /admin  Admin home                                              │
│   Card: "Join form"    Open · up to date                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │ click card
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ /admin/join-form   FORM SETTINGS                                │
│   [Open ●───] Form open to new members                          │
│   greenwichparentsandcarers.co.uk/join      [Copy]              │
│   Intro text …                                                  │
│   Closed message …                                              │
│   ── The questions members are asked ──                         │
│    1 What's your first name?        Everyone   Required         │
│    2 What's your email address      Everyone   Required         │
│    3 What's your postcode?          Everyone   Required         │
│  ▶ 4 How did you hear about us?     Everyone   Required 7 opts  │
│    5 Which group would you like…    Everyone   Required 3 opts  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ click row 4
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ /admin/join-form/questions/how_heard   QUESTION EDITOR          │
│   H1  How did you hear about us?                                │
│   Question 4 of 12 · Asked of everyone · Single choice          │
│                                                                 │
│   Question label  [How did you hear about us?          ]        │
│   Help text       [                                    ]        │
│   Required        [●──] Members must answer this                │
│                                                                 │
│   ── Options · 7 live ──                                        │
│   ⠿ [Greenwich Parents & Carers ] chosen by 604  Retire         │
│   ⠿ [Weekly Newletter           ] chosen by 312  Retire   ◄──┐  │
│   ⠿ [Instagram                  ] chosen by 401  Retire      │  │
└───────────────────────────┬──────────────────────────────────┼──┘
                            │ click into the label, fix spelling
                            ▼                                  │
┌─────────────────────────────────────────────────────────────────┐
│   ⠿ [Weekly Newsletter          ] chosen by 312  Retire         │
│      ┌───────────────────────────────────────────────────┐      │
│      │ 312 members chose this. Renaming updates what     │      │
│      │ their record shows — it doesn't change what       │      │
│      │ they picked.                     aria-live=polite │      │
│      └───────────────────────────────────────────────────┘      │
└───────────────────────────┬─────────────────────────────────────┘
                            │ blur / Enter
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│   STICKY PUBLISH BAR appears (slides up from bottom)            │
│   1 unpublished change. Members still see the published version.│
│   [Discard]              [Preview draft]   [Publish changes]    │
└───────────────────────────┬─────────────────────────────────────┘
                            │ click "Publish changes"
                            ▼
                    ┌───────────────┐
                    │ Publishing…   │  spinner, button disabled,
                    │               │  aria-busy on the bar
                    └───────┬───────┘
                            │
              ┌─────────────┴──────────────┐
              │ success                    │ failure
              ▼                            ▼
┌─────────────────────────────┐  ┌──────────────────────────────┐
│ Bar becomes, in place:      │  │ Red inline banner above bar: │
│ ✓ Published. Members see    │  │ "Couldn't publish — the      │
│   your changes now.         │  │  changes are still saved as  │
│   [View the live form ↗]    │  │  a draft. Try again."        │
│ role="status"               │  │ role="alert" · [Try again]   │
│ Ash stays on this screen.   │  │ Bar stays; nothing is lost.  │
└──────────┬──────────────────┘  └──────────────────────────────┘
           │ optional
           ▼
┌─────────────────────────────────────────────────────────────────┐
│ greenwichparentsandcarers.co.uk/join  (new tab)                 │
│ "How did you hear about us?"  ○ Weekly Newsletter  ✓ FIXED      │
└─────────────────────────────────────────────────────────────────┘
```

### Decision Points & Alternative Paths

| Trigger | Display | Recovery |
|---|---|---|
| Ash cannot find where the form lives (13-item flat sidebar) | Admin home card **"Join form"** with description "Edit the wording of the membership form at /join, open or close it to new members, and preview each branch." Sidebar entry sits directly above Subscribers. | The `/join` public page, when opened by an authenticated admin, shows a small fixed-position chip bottom-right: **"Admin: edit this form"** linking to `/admin/join-form`. Non-admins never see it. |
| Ash looks for the typo among the *questions* and doesn't see it there | Each choice-question row in the list shows an option count — "7 options" — and the row is clickable as a whole. | Settings screen has a filter input above the list: **"Find a word in the form"** — matches question labels, help text **and** option labels, and shows matching options inline beneath their question. Typing "newletter" surfaces the row directly. |
| Ash edits the label but the change looks like it did nothing | The publish bar slides up the moment the first edit lands, and the edited option row gains a **`Draft`** badge. | Nothing to recover — the feedback is immediate and persistent. |
| Ash worries the fix will break the 312 existing answers | Inline note under the dirty input, `aria-live="polite"`: "312 members chose this. Renaming updates what their record shows — it doesn't change what they picked." | The count itself is the evidence. Optional deep link **"See those members →"** opens the members list filtered to this answer. |
| Ash saves but never publishes | Publish bar is **sticky** and does not scroll away. Admin home card reads "Open · 1 unpublished change". Attempting to navigate away triggers the unsaved-changes guard. | The guard dialog's primary button is **"Publish now"**, not "Save" — the guard is the last chance to convert a draft into a live fix. |
| Ash clicks Publish and the request fails | Red inline banner above the bar, `role="alert"`: "Couldn't publish — the changes are still saved as a draft. Try again." | `[Try again]` retries; draft is untouched on the server. Ash can close the laptop and publish tomorrow. |
| Ash meant to retire, not rename | Retire is a separate, clearly-labelled button on the same row with its own confirmation dialog. Rename is in-place typing. They cannot be confused by mis-click. | Retire is reversible via **Restore** in the retired group. |
| Ash publishes and wants to check | Success bar carries `[View the live form ↗]` opening `/join` in a new tab. | — |
| Ash typed the fix into the *question label* by mistake | The label input and the option inputs are visually distinct: label sits in a bordered `FieldGroup` under a heading, options sit in the drag-handled list under "Options". Publish bar counts "2 unpublished changes", which flags the extra edit. | `[Discard]` on the publish bar reverts **all** draft edits with a confirm; per-field revert is out of scope (see Gaps). |

### Drop-off Risk Notes

The dominant risk is not that Ash fails — it is that **Ash believes she has succeeded when she has not**. A draft/publish model creates exactly one new way to be wrong: fix the typo, feel finished, close the laptop, and the public form still says "Newletter". Every mitigation in this section that is not about accessibility is about that specific failure: the sticky bar that will not scroll away, the "N unpublished changes" line on the admin home card, and the unsaved-changes guard whose primary button is *Publish now* rather than *Save*. If usability testing shows Ash still walks away with an unpublished draft, the correct fix is a nightly reminder, not abandoning draft/publish — because the alternative failure mode (a half-finished category rename live on the public form) is worse and silent.

The second risk is **discovery**. The admin sidebar is currently eight flat items and this epic set adds up to five more. "Join form" is a phrase Ash will not necessarily map to "the thing with the typo in it" — she thinks of it as "the sign-up form" or "the Tally form". The admin-home card description names `/join` explicitly for that reason, and the settings screen carries a word-search across labels, help text and options so that Ash can find text by the text itself rather than by guessing its container.

The third risk is **fear**. A volunteer who is not technical, editing a form that 1,800 members will see, may simply not touch it. The rename note showing "312 members chose this" is doing double duty here: it is a warning to the careless and a reassurance to the anxious. The critical thing is that it appears **before** commit and reads as information rather than as a warning triangle. No red, no alarm icon — grey text, `aria-live="polite"`, factual.

The fourth, smaller risk: Ash fixes the typo in the form and does not realise the same misspelling may exist elsewhere on the site (newsletter templates, the Brevo signup copy). Out of scope here, but worth a line in the release notes.

---

## JOURNEY B — "Ash adds a new directory category and retires an old one"

**Goal:** Add "Photography" to the directory categories and retire "Accounting & Tax", which nobody has used in a year — without breaking the 23 published listings that use retired or renamed categories, and without leaving the public form in a half-changed state.

**Primary persona:** Ash — GPC admin.

**Estimated time:** 2–4 minutes, including reading the retire confirmation properly.

**Entry points:**
- Admin home → "Join form" → the category question row (the intuitive but *wrong* entry — this journey deliberately tests the signposting).
- Admin home → "Directory" → "Categories" (the direct entry).
- From the moderation queue, when a listing arrives that fits no existing category.

**Success criteria:**
- "Photography" appears in the `/join` directory section's category choice **and** in the public directory filter.
- "Accounting & Tax" no longer appears on the form, but the listings already in it stay published and stay filterable (FR-017).
- Both changes go live in the same instant — the public form is never in a state where one has landed and the other has not.
- Ash saw, before confirming, exactly how many listings the retirement affects.
- Ash was never offered a Delete.

> **Cross-epic note.** Directory categories are FR-017 (EPIC-005), not FR-008 (EPIC-002), because they drive the **public directory filter** as well as the form. They therefore live in **one** place: `/admin/directory/categories`, specified in the EPIC-005 section of this document. Form settings does **not** duplicate the control — it links to it. The category editor reuses the same **NEW** `OptionListEditor` component specified in Screen 2 below, with identical retire/rename/reorder semantics and the same draft/publish discipline, so Ash learns the interaction once. The journey is documented here because it starts in Form settings and because the retire mechanics are the ones FR-008 requires to be visible.

### Happy Path

```
┌─────────────────────────────────────────────────────────────────┐
│ /admin/join-form   FORM SETTINGS                                │
│   ── The questions members are asked ──                         │
│   … Only shown if they opt into the directory …                 │
│   ▶ 10 Which category best describes your business?             │
│        Directory   Required   12 options   ⓘ Managed elsewhere  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ click row 10
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ QUESTION EDITOR — category question                             │
│   Question label  [Which category best describes…      ]  ✎     │
│   Help text       [                                    ]  ✎     │
│   Required        [●──] Members must answer this          ✎     │
│                                                                 │
│   ── Options · 12 ──                          READ-ONLY         │
│   Accounting & Tax · Childcare · Coaching · Fitness · …         │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐     │
│   │ These options are the directory categories. They're   │     │
│   │ managed in one place, because they also drive the     │     │
│   │ filter on the public directory.                       │     │
│   │                          [Manage categories →]        │     │
│   └───────────────────────────────────────────────────────┘     │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Manage categories
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ /admin/directory/categories   CATEGORIES  (EPIC-005 screen,     │
│                                shared OptionListEditor)         │
│   ⠿ [Accounting & Tax  ]  4 listings   Retire                   │
│   ⠿ [Childcare         ] 17 listings   Retire                   │
│   ⠿ [Coaching          ] 11 listings   Retire                   │
│   …                                                             │
│   [+ Add category]                                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Add category
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│   ⠿ [Photography        ]  0 listings   Retire     Draft        │
│      new empty row, focus placed in it, appended at the bottom  │
│   Publish bar: "1 unpublished change."                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Retire on "Accounting & Tax"
                            ▼
┌═════════════════════════════════════════════════════════════════┐
║  DIALOG  role="dialog" aria-modal="true"  focus trapped         ║
║                                                                 ║
║  Retire "Accounting & Tax"?                                     ║
║                                                                 ║
║  It disappears from the form as soon as you publish.            ║
║                                                                 ║
║  The 4 listings already in this category stay published and     ║
║  stay filterable — they keep reading "Accounting & Tax".        ║
║  Nothing is rewritten.                                          ║
║                                                                 ║
║  You can restore it at any time.                                ║
║                                                                 ║
║              [Cancel]            [Retire category]              ║
└═════════════════════════════════════════════════════════════════┘
                            │ Retire category
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│   ── Options · 12 live ──                                       │
│   ⠿ [Childcare         ] 17 listings   Retire                   │
│   ⠿ [Coaching          ] 11 listings   Retire                   │
│   ⠿ [Photography       ]  0 listings   Retire     Draft         │
│                                                                 │
│   ▼ Retired (1)                                                 │
│   ┌───────────────────────────────────────────────────────┐     │
│   │ Retiring hides an option from the form. It never       │    │
│   │ changes anything anyone has already chosen. Retiring   │    │
│   │ is reversible; nothing here can be deleted.            │    │
│   └───────────────────────────────────────────────────────┘     │
│   ~~Accounting & Tax~~   Retired  Draft                         │
│     Retired 18 Aug 2026 by Ash · still shown on 4 listings      │
│     [See those listings →]        [Restore]                     │
│                                                                 │
│   Publish bar: "2 unpublished changes."                         │
│   [Discard]        [Preview draft]      [Publish changes]       │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Publish changes  (BOTH land together)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  ✓ Published. Members see your changes now.                     │
│    [View the live form ↗]  [View the directory ↗]               │
│                                                                 │
│  /join                → offers Photography, not Accounting & Tax│
│  /directory filter    → "Accounting & Tax (4)" still selectable │
│  4 published listings → still say "Accounting & Tax", still live│
└─────────────────────────────────────────────────────────────────┘
```

### Decision Points & Alternative Paths

| Trigger | Display | Recovery |
|---|---|---|
| Ash goes to Form settings expecting to edit categories there | The category question's options panel is **read-only**, with a bordered explanation card: "These options are the directory categories. They're managed in one place, because they also drive the filter on the public directory." + `[Manage categories →]` | The link is a real button (44px), not a text crumb. The question's label, help text and required flag remain editable in place, so the trip is not wasted. |
| Ash reaches for **Delete** on a category | There is no Delete anywhere in this section. The retired group's explanation says so outright: "Retiring is reversible; nothing here can be deleted." | If Ash asks why, the same disclosure pattern answers it: deleting would orphan the listings and answers that reference it. |
| Ash retires the old category **before** adding the new one | Both are drafts. Nothing is public. The publish bar counts up. | Draft/publish is the recovery — order of operations cannot leak to the public. This is the single strongest argument for the model. |
| **Ash renames "Accounting & Tax" to "Photography" instead of add + retire** | The rename note fires with category-specific copy: "4 published listings are in this category. Renaming changes what they're **called** — it doesn't move them. If you want a different category, add a new one instead." `aria-live="polite"`. | Ash reverts the input (or `[Discard]`), then uses Add. This is the genuinely dangerous mistake in this journey and it is caught by copy, before publish, at the moment of typing. |
| Ash retires the last remaining live category | The Retire button on the final live row is **visible and dimmed**, with an inline reason: "Can't retire the last category — the form has to offer members something to choose. Add another first." (contextual unavailability → dimmed + reason) | Add a category; the button re-enables. |
| Ash adds a category whose name duplicates an existing one (including a retired one) | Inline field error under the new row, `role="alert"`, tied by `aria-describedby`: "There's already a category called 'Photography'. It's currently retired — restore it instead of adding a second one." with `[Restore it]`. | One click restores the retired original, preserving its listing history. |
| Ash adds a category and leaves it blank | Publish is blocked. Inline error on the empty row: "Give this category a name, or remove the empty row." Publish bar shows "Fix 1 problem before publishing" and the button is dimmed **with a reason** (this is contextual, not permanent). | `[Remove]` on an unnamed, never-published draft row deletes the row outright — the one place removal exists, and only because nothing references it yet. |
| Ash reorders by drag and it is fiddly on a trackpad | Every row also carries **Move up** / **Move down** icon buttons (44×44), keyboard-operable, announcing "Photography moved to position 12 of 12" via `aria-live="polite"`. | Drag is an enhancement; the buttons are the guaranteed path. |
| Ash wants to confirm the guarantee rather than trust it | `[See those listings →]` on the retired row opens the moderation/listings view filtered to that category, showing 4 real published listings still reading "Accounting & Tax". | This is the proof-by-observation layer. |
| Publish fails mid-way | `role="alert"` banner: "Couldn't publish — your 2 changes are still saved as a draft. Try again." Both changes remain a single unpublished unit. | `[Try again]`. Publish is all-or-nothing; there is no partial publish. |

### Drop-off Risk Notes

The failure that matters here is **rename-as-replace**. It is a completely reasonable mental model — "this category is wrong, I'll make it right" — and it silently reclassifies every listing in it. It produces no error, no warning from the database, and nobody notices until a member emails to ask why her bookkeeping business is now filed under Photography. The mitigation is the usage-count note firing on the *first keystroke* in a category name that has listings attached, with copy that names the alternative ("add a new one instead") rather than merely describing the risk. If the note only said "4 listings use this", Ash would read it as a fact and carry on.

The second risk is **retirement anxiety**. Ash is a volunteer publishing other people's businesses. "Retire" sounds soft but she has no way to know what it does to real data, and the rational response to an unknown destructive-sounding action is to not take it — leaving the category list to accrete forever and the form to grow a 30-item dropdown that nobody can use. The retired group is designed as an answer to that specifically: it never leaves the screen, it shows the date and who did it, it shows a live count of what still references it, it links to those records, and it offers Restore. Five separate signals that this is a reversible move-to-a-different-shelf, not a deletion.

The third risk is **the split ownership itself**. Categories being managed outside Form settings is a real seam, and Ash will hit it at least once. The mitigation is that the seam is signposted with a full explanation card and a real button rather than a disabled control or an unexplained absence, and that the trip is not wasted — the question's own wording is still editable where she landed. The alternative (duplicating the category editor into Form settings) would create two publish surfaces for one list, which is worse. Flagged in Gaps.

The fourth risk is **volume**. At 12 categories the list is fine on a laptop. At 30 it needs a search input and the reorder buttons become tedious. FR-D09 and the addendum both suggest low volumes for now; revisit above ~25.

---

## SCREEN 1 — Form settings overview

**Purpose:** The single home for everything about the public membership form: whether it is open, where it lives, what it says before the questions start, what it says when it is closed, and how every question is worded. It is also where the boundary between content and structure is established, once, in prose.

**Entry from:** Admin home quick-link card · Admin sidebar "Join form" · the `/join` page's admin edit chip · `[Manage categories →]` return path · browser bookmark.

**Exits to:** Question editor (`/admin/join-form/questions/:id`) · Preview (`/admin/join-form/preview`) · Categories (`/admin/directory/categories`) · the live `/join` page in a new tab · admin home.

### Layout Wireframe (mobile-first, 320px)

> The existing `AdminLayout` uses a fixed `w-64 shrink-0` sidebar with no responsive treatment, which leaves ~64px of content at 320px. This screen therefore **requires** the sidebar to become an off-canvas drawer below `md:`, toggled by a hamburger in a sticky top bar. See Gaps.

```
320px viewport · 16px gutters · 288px content
┌────────────────────────────────────────┐
│ ☰   GPC Admin                  Sign out│  sticky, 56px
├────────────────────────────────────────┤
│                                        │
│  Admin home ›                          │  breadcrumb, 44px hit
│                                        │
│  Join form                             │  h1, Poppins 700, 28px
│  Everything members see at             │  Nunito 400, 15px, #4a4a5e
│  greenwichparentsandcarers.co.uk/join  │
│                                        │
│ ┌────────────────────────────────────┐ │  Card, rounded-2xl, p-5
│ │  ● Open                            │ │  Badge variant="open"
│ │                                    │ │
│ │  Form open to new members          │ │  label, htmlFor=form-open
│ │                       ┌─────────┐  │ │
│ │                       │  ●───   │  │ │  Toggle, 52×32, 44px tap
│ │                       └─────────┘  │ │
│ │  Members can fill in the form      │ │  15px, #4a4a5e
│ │  right now.                        │ │
│ │                                    │ │
│ │  This switch takes effect straight │ │  13px, #5b5b70
│ │  away. It isn't part of Publish.   │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │  Public link                       │ │  h2 (SectionHeading)
│ │  ┌──────────────────────────────┐  │ │
│ │  │greenwichparentsandcarers.co.…│  │ │  readonly input, truncate
│ │  └──────────────────────────────┘  │ │  rounded-xl
│ │  ┌───────────┐  ┌───────────────┐  │ │
│ │  │ ⧉  Copy   │  │ ↗  Open       │  │ │  two 44px buttons
│ │  └───────────┘  └───────────────┘  │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │  Intro text                        │ │  h2
│ │  Shown above the first question.   │ │  help, id=intro-help
│ │  Plain text — no formatting.       │ │
│ │  ┌──────────────────────────────┐  │ │
│ │  │ Welcome to the GPC Mums in   │  │ │  textarea, 6 rows
│ │  │ Business & Work community!   │  │ │  rounded-xl
│ │  │ Tell us a bit about you and  │  │ │
│ │  │ we'll do the rest.           │  │ │
│ │  └──────────────────────────────┘  │ │
│ │                        487 left    │ │  counter, aria-live=polite
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │  Closed message                    │ │  h2
│ │  Shown instead of the form while   │ │
│ │  it's closed. Say when you'll      │ │
│ │  reopen if you know.               │ │
│ │  ┌──────────────────────────────┐  │ │
│ │  │ We've paused new sign-ups    │  │ │  textarea, 5 rows
│ │  │ while we catch up with       │  │ │
│ │  │ everyone who's already       │  │ │
│ │  │ joined. Do check back soon…  │  │ │
│ │  └──────────────────────────────┘  │ │
│ │                        243 left    │ │
│ └────────────────────────────────────┘ │
│                                        │
│  ──────────────────────────────────    │
│  The questions members are asked       │  h2, SectionHeading
│                                        │
│  You can change how every question is  │  15px, #4a4a5e
│  worded. The questions themselves,     │
│  and which ones follow from which,     │
│  are built into the site.              │
│                                        │
│  If it changes what the public sees,   │  Card, bg-warm, 14px
│  it stays a draft until you publish    │  the one-rule box
│  it. The one exception is the switch   │
│  at the top of this page.              │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ 🔍 Find a word in the form       │  │  search, rounded-xl
│  └──────────────────────────────────┘  │
│                                        │
│  ASKED OF EVERYONE                     │  group label, 12px caps
│ ┌────────────────────────────────────┐ │
│ │ 1  What's your first name?       › │ │  min-height 64px
│ │    Short text · Required           │ │
│ ├────────────────────────────────────┤ │
│ │ 2  What's your email address     › │ │
│ │    Email · Required                │ │
│ ├────────────────────────────────────┤ │
│ │ 3  What's your postcode?         › │ │
│ │    Postcode · Required             │ │
│ ├────────────────────────────────────┤ │
│ │ 4  How did you hear about us?    › │ │
│ │    Single choice · Required        │ │
│ │    7 options                       │ │
│ ├────────────────────────────────────┤ │
│ │ 5  Which group would you like    › │ │
│ │    to join?                        │ │
│ │    Single choice · Always required │ │
│ │    3 options                       │ │
│ │    ⤷ This answer decides which     │ │  12px, #5b5b70
│ │      questions come next.          │ │
│ └────────────────────────────────────┘ │
│                                        │
│  ONLY IF THEY CHOOSE                   │  group label
│  BUSINESS MUMS OR BOTH                 │
│ ┌────────────────────────────────────┐ │
│ │ 6  What stage best describes     › │ │
│ │    your business?                  │ │
│ │    Single choice · Required        │ │
│ │    6 options                       │ │
│ ├────────────────────────────────────┤ │
│ │ …                                  │ │
│ └────────────────────────────────────┘ │
│                                        │
│  ONLY IF THEY CHOOSE                   │
│  CAREER MUMS OR BOTH                   │
│ ┌────────────────────────────────────┐ │
│ │ …                                  │ │
│ └────────────────────────────────────┘ │
│                                        │
│  ONLY IF THEY OPT INTO THE DIRECTORY   │
│ ┌────────────────────────────────────┐ │
│ │ 10 Which category best           › │ │
│ │    describes your business?        │ │
│ │    Single choice · Required        │ │
│ │    12 options · Managed elsewhere  │ │
│ └────────────────────────────────────┘ │
│                                        │
│  ASKED OF EVERYONE                     │
│ ┌────────────────────────────────────┐ │
│ │ 12 Consent                       › │ │
│ │    Checkbox · Always required      │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │  InlineDisclosure
│ │ ▸ Why can't I add or remove        │ │  always present,
│ │   questions?                       │ │  not dismissible
│ └────────────────────────────────────┘ │
│                                        │
│         (space for the publish bar)    │  pb-32 when bar visible
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │  STICKY PUBLISH BAR
│ │ 3 unpublished changes.             │ │  bottom, above safe-area
│ │ Members still see the published    │ │  rounded-2xl, shadow-lg
│ │ version.                           │ │
│ │ ┌──────────────┐ ┌───────────────┐ │ │
│ │ │Preview draft │ │Publish changes│ │ │  full-width stacked
│ │ └──────────────┘ └───────────────┘ │ │  44px each
│ │            Discard changes         │ │  text button, 44px
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

**Tablet / Desktop variations (differences only):**

- **≥768px (`md:`):** Sidebar returns to the persistent `w-64` rail; the hamburger and drawer disappear. Content column is `max-w-4xl` (settings screens read badly at `max-w-7xl` — the line length in the intro/closed textareas becomes unreadable). The status card, public link, intro and closed-message cards sit in a two-column grid (`grid-cols-2 gap-6`) with the status card and public-link card sharing the top row. Question rows put the badges (`Everyone` / `Required` / `N options`) on the right of the row rather than beneath the label. The publish bar becomes a horizontal strip: message left, `Discard · Preview draft · Publish changes` right, buttons `w-auto`.
- **≥1024px:** No further change. The site never uses `xl:` and this screen does not introduce it. Content stays capped at `max-w-4xl`; extra width goes to margin.
- **Reduced-height viewports (laptop, ~700px):** The publish bar is sticky at all sizes and never scrolls away. On desktop it also gains a keyboard shortcut hint — `⌘S to save · ⌘⇧P to publish` — shown only when a physical keyboard is detected (`hover: hover`), never on touch.

### Component Hierarchy

1. `AdminLayout` — **modified**: sidebar becomes an off-canvas drawer below `md:` (**NEW** behaviour on an existing component; see Gaps).
2. **NEW** `AdminPageHeader` — breadcrumb + `<h1>` + lede. Needed because `SectionHeading` is hard-coded to `<h2>` and cannot serve as a page `<h1>`.
3. `Card` (existing) × 4 — status, public link, intro text, closed message. Consumers supply `p-5 md:p-6` since `Card` has no internal padding.
4. `Badge` (existing) — **NEW variants** required: `open` (green `#15803d` on `#dcfce7`), `closed` (slate `#334155` on `#e2e8f0`), `draft` (`#7c2d12` on `#ffedd5`), `retired` (`#334155` on `#f1f5f9`). The existing `free | sold-out | new | upcoming | past` set does not cover state-of-configuration.
5. **NEW** `Toggle` — accessible switch. `role="switch"` + `aria-checked`, 52×32 visual with a 44×44 hit area, `htmlFor`/`id` paired with a real `<label>`. No switch primitive exists on the site.
6. **NEW** `CopyField` — read-only input + `[Copy]` + `[Open ↗]`. Copy uses the clipboard API with a `document.execCommand` fallback; on success the button label becomes "Copied" for 2s and a visually-hidden `role="status"` region announces "Link copied".
7. **NEW** `FieldGroup` — the primitive that makes NFR-008 reachable: renders `<label htmlFor>` + control + help text + error, and wires `aria-describedby` to the help and error ids automatically. **This closes documented site gap #1 (no `htmlFor`/`id` pairing anywhere) and every input in this section goes through it.**
8. **NEW** `CharacterCounter` — "487 left"; `aria-live="polite"` but throttled to announce only at 50, 20, 10 and 0 remaining, so it does not chatter on every keystroke. Turns `#b91c1c` at 0 and the field gets `aria-invalid`.
9. `SectionHeading` (existing, `<h2>`) — "Public link", "Intro text", "Closed message", "The questions members are asked". `showUnderline={false}`, `align="left"`.
10. **NEW** `QuestionList` — grouped list. Group headers are `<h3>`; the list is a `<ul>`; each row is an `<li>` containing a single `<Link>` wrapping the whole row (**not** a `div onClick` — the site's existing `LondonEventCard` bug, gap #3, is explicitly not reproduced).
11. **NEW** `QuestionRow` — number, label, type, required state, option count, optional branch note, chevron. `min-height: 64px`.
12. **NEW** `FormWordSearch` — client-side filter over labels, help text and option labels. Result count announced via `aria-live="polite"`: "3 questions match 'newletter'."
13. **NEW** `InlineDisclosure` — `<button aria-expanded aria-controls>` + region. Used for "Why can't I add or remove questions?". Always rendered, never dismissible, closed by default.
14. **NEW** `PublishBar` — sticky region containing the change count, `[Discard changes]`, `[Preview draft]`, `[Publish changes]`, and the success/error surface. `role="region"` with `aria-label="Unpublished changes"`; the count and outcome live in a nested `role="status"`.
15. `Button` (existing) — **three extensions required**, all named as gaps in the shared context: a `size="sm"` variant (the fixed `px-6 py-3` is too heavy for row-level actions), real `disabled` styling (`opacity-60`, `cursor-not-allowed`, `aria-disabled`), and a `loading` state wrapping the copy-pasted spinner idiom. `Publish changes` uses `variant="primary"` with the corrected fill `#c9107f` and white text (5.43:1), never `#fc16a0`.
16. **NEW** `Dialog` — used by the close-the-form confirmation. `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap, Escape to dismiss, focus returned to the invoking control. **Closes documented site gap #2 (no modal on the site is a real dialog).**
17. **NEW** `UnsavedChangesGuard` — a `Dialog` triggered by in-app navigation plus a `beforeunload` handler for tab close.

### Named States

**Default**
- *Trigger:* Config loaded, no unpublished changes.
- *Display:* Everything editable. Publish bar **absent** (not a disabled bar — absence is the honest signal that there is nothing to publish). Status card shows the true open/closed state. Admin home card reads "Open · up to date".
- *Aria:* Standard document structure. No live-region traffic.

**Loading**
- *Trigger:* Initial fetch of the form configuration.
- *Display:* `<h1>` and breadcrumb render immediately (the page is identifiable before its data arrives). Below it, skeleton blocks matching the card and row geometry — never a centred spinner on an otherwise blank page, because the settings screen's shape is stable and predictable.
- *Aria:* The content region carries `aria-busy="true"`. A visually-hidden `role="status"` announces "Loading form settings." once. Skeletons are `aria-hidden="true"`.

**Empty**
- *Trigger:* The configuration row does not exist — reachable only if the seeding migration has not run.
- *Display:* Full-width `Card`: "The join form isn't set up yet. Setting it up copies the questions and wording that ship with the site, so you can start editing them." `[Set up the join form]`.
- *Aria:* `role="status"`; focus moves to the `<h2>` of the card after load.
- *Note:* If the migration seeds the configuration (it should — see Gaps), this state is unreachable in production. It is specified rather than assumed away.

**Error**
- *Trigger (load):* The config fetch fails.
- *Display:* Inline red banner below the `<h1>`, following the established `LondonEventForm` idiom — `bg-red-50 border border-red-200 text-red-800`, `rounded-xl`, `p-4`: "Couldn't load the form settings. The form itself is unaffected — members can still fill it in." `[Try again]`.
- *Trigger (save):* Autosave of a draft fails.
- *Display:* Same banner: "Couldn't save your draft. Your changes are still here on screen — don't reload. Try again." `[Try again]`. The publish bar switches its message to "Not saved yet" and `Publish changes` is dimmed **with a reason** ("Save your draft first").
- *Trigger (publish):* Publish fails.
- *Display:* "Couldn't publish — your 3 changes are still saved as a draft. Try again." `[Try again]`.
- *Aria:* `role="alert"` on the banner. On appearance, focus moves to the banner (`tabIndex={-1}`). Any field the error implicates gets `aria-invalid="true"` and `aria-describedby` pointing at the banner's id.

**Success**
- *Trigger:* Publish returns 2xx.
- *Display:* **The publish bar transforms in place** — it does not become a toast, and the screen does not navigate. Bar contents become a check glyph + "Published. Members see your changes now." + `[View the live form ↗]`. Background shifts to `bg-green-50` with `#166534` text (7.3:1). The bar auto-collapses after 6 seconds, or immediately on the next edit.
- *Rationale:* `react-hot-toast` exists in exactly one file with no global `<Toaster>` (gap #8). Introducing a toast here would mean introducing a global toaster for one message, and a toast is the wrong shape anyway — the outcome belongs to the bar that initiated it, and Ash's eyes are already there.
- *Aria:* The bar's nested `role="status"` `aria-live="polite"` announces the message. Focus is **not** moved — Ash is mid-flow and stealing focus would cost her her place.
- *Trigger (save):* Draft saved.
- *Display:* Bar's secondary line reads "Draft saved 14:32". No colour change, no animation beyond a 150ms opacity fade of the timestamp.

**Disabled**

This is where the boundary is expressed, and the two categories behave differently on purpose.

| Control | Category | Treatment |
|---|---|---|
| Add a question · Delete a question · Move a question between branches · Edit branching | **Never exists** | **No control rendered at all.** Explained once by the `InlineDisclosure` at the foot of the list, and by the lede under the section heading. No dimmed button, no lock icon, no tooltip. |
| Reorder questions | **Never exists** | No drag handles on question rows (options *do* have them — the contrast is deliberate and teaches the distinction). The group labels ("Asked of everyone", "Only if they choose Business Mums or Both") present order as a property of the form, stated as fact. |
| `Publish changes` when a draft has a validation problem | **Contextually unavailable** | Visible, dimmed (`opacity-60`, `aria-disabled="true"`, still focusable so screen readers reach the reason), with an inline note above the bar: "Fix 1 problem before publishing." plus a `[Show me]` button that scrolls to and focuses the offending field. |
| `Publish changes` with zero unpublished changes | **Contextually unavailable** | The entire bar is absent. |
| The closed-message textarea while the form is **open** | **Fully available** | Not dimmed. Ash must be able to write the closed message *before* she needs it. |
| `Discard changes` with zero changes | **Contextually unavailable** | Absent along with the bar. |

- *Aria:* Every dimmed control uses `aria-disabled="true"` rather than the `disabled` attribute, so it stays in the tab order and its `aria-describedby` reason is reachable by a screen-reader user. Nothing is disabled without an adjacent, visible, non-hover reason.

### Interactions & Animations

| Interaction | Behavior | Timing | prefers-reduced-motion |
|---|---|---|---|
| Toggle form open → closed | `Dialog` opens with the consequence copy and the in-flight-member warning. On confirm, the switch animates and the state applies immediately. | Dialog fade+scale 180ms `ease-out`; switch knob slide 160ms | Dialog appears with no transform, opacity only, 0ms. Switch knob snaps to position. |
| Toggle form closed → open | Applies immediately, **no confirmation** — reopening is never destructive. | Knob slide 160ms | Snap. |
| Copy public link | Button label → "Copied", check glyph swaps in. | Label swap instant; reverts after 2000ms | Identical — this is a content change, not motion. |
| First edit lands anywhere | Publish bar slides up from below the viewport. | 220ms `cubic-bezier(.2,.8,.2,1)` | Bar appears in place with a 120ms opacity fade. No translate. |
| Publish bar → publishing | Button label → "Publishing…", spinner appears (site's existing `animate-spin` idiom), bar gets `aria-busy`. | Spinner continuous | Spinner is replaced by a static three-dot glyph and the text "Publishing…". The `animate-spin` class is not applied. |
| Publish bar → published | Bar cross-fades to the green success state in place. | 200ms cross-fade; auto-collapse after 6000ms | Instant swap, no cross-fade. Auto-collapse still fires (a timed content change is not motion). |
| Character counter crosses a threshold | Colour shifts amber at 20 remaining, red at 0. | 120ms colour transition | Instant colour change. |
| Question row hover / focus | Background `#fffaf5` → `#fdf2f8`; chevron nudges 2px right on hover only. | 120ms | Background change kept (it is not motion). Chevron nudge removed. |
| Question row focus-visible | 2px `#fc16a0` ring at 2px offset — non-text UI, so the 3:1 threshold applies and `#fc16a0` is legal here. | Instant | Unchanged. |
| Word-search filtering | Non-matching rows are removed; the list reflows. | No animation at all — reflow animation on a filtered list is nausea-inducing and slows perception of the result | Unchanged (there was nothing to remove). |
| Textarea autosave | Debounced 800ms after the last keystroke; timestamp fades in. | 150ms opacity | Instant timestamp swap. |
| Scroll to an errored field via `[Show me]` | Smooth scroll, then focus. | `behavior: 'smooth'` | `behavior: 'auto'` — jump straight there, then focus. |

### Accessibility Annotations

- **Heading levels:** `<h1>` "Join form" (from `AdminPageHeader`). `<h2>` for "Public link", "Intro text", "Closed message", "The questions members are asked" (`SectionHeading`). `<h3>` for each question-group label ("Asked of everyone", "Only if they choose Business Mums or Both", …). No level is skipped. The status card has no heading — its `Badge` and switch label carry it.
- **Landmarks:** `AdminLayout` provides `<nav aria-label="Admin">` (drawer or rail) and `<main>`. This screen adds `<form aria-labelledby="join-form-settings-h1">` around the editable region and `role="region" aria-label="Unpublished changes"` on the publish bar so a screen-reader user can jump to it directly from the landmark list — important, because it is visually sticky and therefore always "there" for sighted users and must be equally always-reachable.
- **A skip-to-content link is added to `AdminLayout`** (site gap #7) — this section is the first admin screen with a sticky bottom bar and a long list, and skipping the nav matters more here than anywhere else on the site.
- **Focus management:**
  - On route entry, focus is on `<body>`; the `<h1>` carries `tabIndex={-1}` and is the target of the skip link.
  - Returning from the question editor moves focus to the row that was edited, which also scrolls it into view — Ash never loses her place in a 12-row list.
  - Opening the close-form dialog moves focus to its `<h2>`; Escape or Cancel returns focus to the switch; confirming returns focus to the switch in its new state.
  - The error banner takes focus on appearance (`tabIndex={-1}`).
  - Publish success does **not** take focus.
- **Screen-reader notes:**
  - The switch announces "Form open to new members, switch, on". Its `aria-describedby` chains the two supporting lines: "Members can fill in the form right now. This switch takes effect straight away. It isn't part of Publish."
  - Each question row announces its full context in one string: "Question 4, How did you hear about us? Single choice. Required. 7 options. Asked of everyone. Link." The group membership is repeated per row via visually-hidden text, because a screen-reader user navigating by link does not hear the `<h3>` group header.
  - The branch key row appends: "This answer decides which questions come next."
  - The publish bar's change count is in a `role="status"`, so "3 unpublished changes" is announced when it changes — but the count is debounced 1000ms so a burst of edits announces once.
  - The `InlineDisclosure` button announces "Why can't I add or remove questions? Collapsed, button". This is deliberately worded as a question the user might ask, so it is meaningful when encountered out of context in a list of links and buttons.
- **Keyboard operation:**
  - Tab order follows the visual order: breadcrumb → switch → copy → open → intro → closed message → search → each question row → disclosure → publish bar.
  - The publish bar is last in the DOM and last in tab order, which matches its visual position and its role as the commit step.
  - `⌘S` / `Ctrl+S` saves the draft, `⌘⇧P` / `Ctrl+Shift+P` publishes. Both are announced once via the `role="status"` region on first use of the screen per session: "Press Command S to save, Command Shift P to publish." Neither is the only route to its action.
  - Escape in the search input clears it and announces "Search cleared, showing all 12 questions."
  - Every interactive element has `focus-visible` styling (site gap #4): 2px `#fc16a0` ring, 2px offset, on every button, link, input and switch.
- **Contrast:** All body text is `#1a1a2e` on `#fffaf5` (16.44:1) or `#4a4a5e` on `#fffaf5` (8.9:1). Help text at 13px uses `#5b5b70` (6.8:1). `#fc16a0` carries **no** text on this screen — it appears only as focus rings and the preview frame border. `Publish changes` is `#c9107f` fill with white text (5.43:1).
- **Touch:** Every row is ≥64px tall. The switch, both link buttons, both publish buttons and `Discard changes` are all ≥44×44. The `Discard changes` text button gets `py-3 px-4` to reach 44px height despite being visually a text link.

---

## SCREEN 2 — Question editor

**Purpose:** Edit one question's wording, help text and required flag; and for choice questions, manage its options — add, rename, reorder, retire, restore. This is the screen where FR-008's retire guarantee has to become *visible* rather than promised.

**Entry from:** A row in the question list on Screen 1 · `[Show me]` from a publish-blocking validation error · a deep link from the word search.

**Exits to:** Form settings (back, or on the unsaved-changes guard) · Preview · `/admin/directory/categories` (for the category question only) · the members list filtered to a given answer (`[See those members →]`).

### Layout Wireframe (mobile-first, 320px)

Shown for question 4, *"How did you hear about us?"* — the Journey A case.

```
320px viewport
┌────────────────────────────────────────┐
│ ☰   GPC Admin                  Sign out│
├────────────────────────────────────────┤
│  ‹ Join form                           │  back link, 44px
│                                        │
│  How did you hear about us?            │  h1 (the PUBLISHED label,
│                                        │  stable while editing)
│  Question 4 of 12 · Asked of everyone  │  13px, #5b5b70
│  · Single choice                       │
│                                        │
│ ┌────────────────────────────────────┐ │  Card
│ │  Question label                    │ │  <label htmlFor=q-label>
│ │  What members see as the question. │ │  help, id=q-label-help
│ │  ┌──────────────────────────────┐  │ │
│ │  │How did you hear about us?    │  │ │  input, rounded-xl, 44px
│ │  └──────────────────────────────┘  │ │
│ │                        94 left     │ │
│ │                                    │ │
│ │  Help text (optional)              │ │
│ │  Shown under the question in       │ │
│ │  smaller type. Leave blank for     │ │
│ │  none.                             │ │
│ │  ┌──────────────────────────────┐  │ │
│ │  │                              │  │ │  textarea, 3 rows
│ │  └──────────────────────────────┘  │ │
│ │                        200 left    │ │
│ │                                    │ │
│ │  Members must answer this          │ │
│ │                       ┌─────────┐  │ │
│ │                       │  ●───   │  │ │  Toggle
│ │                       └─────────┘  │ │
│ │  If this is off, members can skip  │ │
│ │  the question.                     │ │
│ └────────────────────────────────────┘ │
│                                        │
│  ──────────────────────────────────    │
│  Options                        7 live │  h2 + count
│                                        │
│  Options are just words on a list —    │  15px, #4a4a5e
│  add, rename, reorder and retire them  │
│  as much as you like.                  │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ ⠿  ┌────────────────────────────┐  │ │  drag handle 44×44
│ │    │Greenwich Parents & Carers  │  │ │  inline input
│ │    └────────────────────────────┘  │ │
│ │    chosen by 604                   │ │  13px, #5b5b70
│ │    ▲   ▼            Retire         │ │  3 × 44px buttons
│ ├────────────────────────────────────┤ │
│ │ ⠿  ┌────────────────────────────┐  │ │
│ │    │Weekly Newsletter           │  │ │  ← being edited
│ │    └────────────────────────────┘  │ │
│ │    chosen by 312           Draft   │ │  Badge variant="draft"
│ │  ┌──────────────────────────────┐  │ │
│ │  │ 312 members chose this.      │  │ │  aria-live=polite
│ │  │ Renaming updates what their  │  │ │  bg-warm, rounded-xl,
│ │  │ record shows — it doesn't    │  │ │  grey text, NO icon,
│ │  │ change what they picked.     │  │ │  NO red
│ │  └──────────────────────────────┘  │ │
│ │    ▲   ▼            Retire         │ │
│ ├────────────────────────────────────┤ │
│ │ ⠿  ┌────────────────────────────┐  │ │
│ │    │Instagram                   │  │ │
│ │    └────────────────────────────┘  │ │
│ │    chosen by 401                   │ │
│ │    ▲   ▼            Retire         │ │
│ ├────────────────────────────────────┤ │
│ │ …  Friend · Event · Google · Other │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │        +  Add option               │ │  full-width, 44px,
│ └────────────────────────────────────┘ │  variant="outline"
│                                        │
│ ┌────────────────────────────────────┐ │  RETIRED GROUP
│ │ ▼  Retired options (1)             │ │  <button aria-expanded>
│ ├────────────────────────────────────┤ │
│ │ ┌────────────────────────────────┐ │ │  the GUARANTEE panel,
│ │ │ Retiring hides an option from  │ │ │  always visible when
│ │ │ the form. It never changes an  │ │ │  the group is expanded
│ │ │ answer anyone has already      │ │ │
│ │ │ given — those members' records │ │ │
│ │ │ still read exactly what they   │ │ │
│ │ │ chose. Retiring is reversible; │ │ │
│ │ │ nothing here can be deleted.   │ │ │
│ │ └────────────────────────────────┘ │ │
│ │                                    │ │
│ │  F̶a̶c̶e̶b̶o̶o̶k̶ ̶G̶r̶o̶u̶p̶        Retired  │ │  strikethrough + Badge
│ │  Retired 3 Jun 2026 by Ash         │ │  13px
│ │  still shown on 47 past answers    │ │  ← THE EVIDENCE
│ │                                    │ │
│ │  ┌──────────────────────────────┐  │ │
│ │  │ See those 47 members  →      │  │ │  ← THE PROOF
│ │  └──────────────────────────────┘  │ │  44px
│ │  ┌──────────────────────────────┐  │ │
│ │  │ Restore this option          │  │ │  ← REVERSIBILITY
│ │  └──────────────────────────────┘  │ │  44px
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ ▸ Why can't I add or remove        │ │  same InlineDisclosure
│ │   questions?                       │ │  as Screen 1
│ └────────────────────────────────────┘ │
│                                        │
│         (space for the publish bar)    │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │  same PublishBar
│ │ 1 unpublished change.              │ │  as Screen 1 —
│ │ Members still see the published    │ │  ONE bar, one draft,
│ │ version.                           │ │  shared across all
│ │ ┌──────────────┐ ┌───────────────┐ │ │  three screens
│ │ │Preview draft │ │Publish changes│ │ │
│ │ └──────────────┘ └───────────────┘ │ │
│ │            Discard changes         │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

**Variant — the branch key question (question 5), showing contextual unavailability:**

```
│ │  Members must answer this          │ │
│ │                       ┌─────────┐  │ │
│ │                       │  ●───   │  │ │  dimmed, aria-disabled,
│ │                       └─────────┘  │ │  still focusable
│ │  ┌──────────────────────────────┐  │ │
│ │  │ Always required. The rest of │  │ │  id=q-required-reason,
│ │  │ the form depends on this     │  │ │  referenced by
│ │  │ answer — Business Mums and   │  │ │  aria-describedby
│ │  │ Career Mums see different    │  │ │
│ │  │ questions after it.          │  │ │
│ │  └──────────────────────────────┘  │ │
```

**Variant — a branch question's required toggle, making FR-002 legible without making it editable:**

```
│ │  Members must answer this          │ │
│ │                       ┌─────────┐  │ │  fully enabled
│ │                       │  ●───   │  │ │
│ │  If this is off, members can skip  │ │
│ │  the question. Either way, it's    │ │
│ │  only asked of people who chose    │ │
│ │  Business Mums or Both — nobody    │ │
│ │  else is ever blocked by it.       │ │
```

**Variant — the category question, read-only options (Journey B):**

```
│  Options                    12 total  │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ These options are the directory    │ │
│ │ categories. They're managed in one │ │
│ │ place, because they also drive the │ │
│ │ filter on the public directory.    │ │
│ │  ┌──────────────────────────────┐  │ │
│ │  │  Manage categories      →    │  │ │  44px, variant="outline"
│ │  └──────────────────────────────┘  │ │
│ └────────────────────────────────────┘ │
│                                        │
│  Accounting & Tax · Childcare ·        │  plain text, not inputs,
│  Coaching · Fitness · …                │  no drag handles
```

**Tablet / Desktop variations (differences only):**

- **≥768px:** Content capped at `max-w-3xl`. Option rows become single-line: `⠿ [label input, flex-1] · chosen by 312 · ▲ ▼ · Retire`, with the rename note appearing as a row beneath rather than pushing the controls down. The retired group's `[See those members]` and `[Restore]` sit inline on the right of the retired row. The provenance strip moves to a right-hand rail alongside the editable card, so the "this can't be moved" facts are permanently visible while editing rather than scrolled past.
- **≥1024px:** No further change.
- **Drag-and-drop** is enabled only where a pointer is present (`@media (pointer: fine)`); on touch, the `▲ ▼` buttons are the sole reorder mechanism and the drag handle renders as a non-interactive grip glyph. The `▲ ▼` buttons are present at all sizes regardless.

### Component Hierarchy

1. **NEW** `AdminPageHeader` — back link + `<h1>` (published label) + provenance strip.
2. **NEW** `QuestionProvenance` — "Question 4 of 12 · Asked of everyone · Single choice". Read-only, always present. This is the boundary rendered as **information**: parentage and position are facts about the question, stated the way a file's size is stated.
3. `Card` (existing) — the wording panel.
4. **NEW** `FieldGroup` × 2 — question label, help text. Each with `htmlFor`/`id`, help text id in `aria-describedby`, error id appended when invalid.
5. **NEW** `Toggle` — required flag. In the branch-key and consent cases: `aria-disabled="true"`, `aria-describedby` pointing at the reason block.
6. **NEW** `UnavailableNote` — the dimmed-control reason block. Grey (`#5b5b70` on `#fffaf5`, 6.8:1), no icon, no colour alarm. Renders as a `<p>` with a stable id.
7. `SectionHeading` (existing, `<h2>`) — "Options".
8. **NEW** `OptionListEditor` — **the shared component**, used here and on `/admin/directory/categories`. Props determine the noun ("option" / "category"), the usage-count noun ("past answers" / "listings"), and the deep-link target for `[See those …]`. Contains:
   - 8.1 **NEW** `OptionRow` — drag handle, inline label input (a `FieldGroup` with a visually-hidden label "Option 2 label"), usage count, `Draft` badge when dirty, `▲ ▼` reorder buttons, `Retire` button.
   - 8.2 **NEW** `RenameImpactNote` — appears on first keystroke when usage > 0. `aria-live="polite"`, debounced 600ms.
   - 8.3 `Button` (existing, `variant="outline"`, **NEW** `size="sm"`) — `Retire`, `▲`, `▼`.
   - 8.4 `Button` (existing, `variant="outline"`) — `+ Add option`, full width.
   - 8.5 **NEW** `RetiredOptionGroup` — `<button aria-expanded aria-controls>` + region containing `RetireGuaranteePanel` and `RetiredOptionRow`s.
   - 8.6 **NEW** `RetireGuaranteePanel` — the always-visible guarantee prose. Not a tooltip, not a dismissible hint.
   - 8.7 **NEW** `RetiredOptionRow` — struck label, `Badge variant="retired"`, retirement date + actor, live usage count, `[See those N members →]`, `[Restore this option]`.
9. **NEW** `Dialog` — the retire confirmation.
10. `Badge` (existing) — **NEW variants** `draft`, `retired`.
11. **NEW** `PublishBar` — **the same instance as Screen 1**. There is one draft for the whole form configuration and one publish action; the bar follows Ash across all three screens with a running count. This is what makes "add a category and retire another land together" true rather than aspirational.
12. **NEW** `InlineDisclosure` — the same "Why can't I add or remove questions?" block, repeated here so the explanation is where the question arises.
13. **NEW** `UnsavedChangesGuard`.

### Named States

**Default**
- *Trigger:* Question loaded, no unpublished changes to it.
- *Display:* Wording panel populated from `config ?? shippedDefault` — never an empty input. A question with no admin overrides shows its shipped wording with a small grey note beside the label: "Default wording". Options listed in order with usage counts. Retired group present only if something is retired.
- *Aria:* Standard structure.

**Loading**
- *Trigger:* Question and usage counts fetching.
- *Display:* Provenance strip and `<h1>` render immediately from the route param and the code-defined structure (both are known without a fetch — this is a benefit of structure living in the bundle). The wording panel and option rows show skeletons. Usage counts show "counting…" and resolve independently, so the editor is usable before the counts arrive.
- *Aria:* `aria-busy="true"` on the form region. `role="status"`: "Loading question." Usage counts announce on arrival only if a `RenameImpactNote` is already open.

**Empty**
- *Trigger:* The retired group with nothing retired.
- *Display:* The group is **absent entirely** — no empty box, no "0 retired". The first retirement creates it.
- *Trigger:* A choice question with zero live options.
- *Display:* Unreachable by design — the last live option's `Retire` button is dimmed with the reason "Can't retire the last option — this question has to offer members something to choose. Add another option first." If it is somehow reached (bad seed data), the panel shows: "This question has no options, so members will see nothing to choose. Add at least one." with `role="alert"`, and Publish is blocked with a reason.
- *Aria:* `role="status"` on the second case's message; focus moves to `+ Add option`.

**Error**
- *Trigger:* Label emptied.
- *Display:* Inline field error under the input, `#b91c1c` on `#fef2f2`: "Give this question a label — members will see nothing to read otherwise." Input gets `aria-invalid="true"`; the error's id is appended to `aria-describedby` **after** the help text id, so a screen reader hears the help then the error.
- *Trigger:* Option label emptied.
- *Display:* "Give this option a name, or retire it." For a never-published draft row: "Give this option a name, or remove the empty row." with `[Remove]`.
- *Trigger:* Duplicate option label.
- *Display:* "There's already an option called 'Instagram'." — and if the duplicate is retired: "There's already an option called 'Instagram'. It's currently retired — restore it instead of adding a second one." with `[Restore it]`.
- *Trigger:* Save or publish request fails.
- *Display:* The Screen 1 red banner idiom, above the publish bar.
- *Aria:* Field errors are `role="alert"` on first appearance. The publish bar's blocking note is "Fix 2 problems before publishing" with `[Show me]` moving focus to the first offending field.

**Success**
- *Trigger:* Draft saved.
- *Display:* Publish bar secondary line: "Draft saved 14:32". Edited rows keep their `Draft` badge until publish.
- *Trigger:* Retire confirmed.
- *Display:* The row animates out of the live list and into the retired group, which auto-expands. `role="status"`: "Accounting & Tax retired. It's in the retired group and will disappear from the form when you publish."
- *Trigger:* Restore confirmed.
- *Display:* Row moves to the bottom of the live list, focus follows it. `role="status"`: "Facebook Group restored. It's now the last option and will appear on the form when you publish."
- *Trigger:* Publish succeeds.
- *Display:* Screen 1's in-place publish-bar success. `Draft` badges clear. Retired rows lose their `Draft` badge and keep `Retired`.

**Disabled**

| Control | Category | Treatment |
|---|---|---|
| Add / delete / move / re-parent a **question** | Never exists | No control. Explained by the `InlineDisclosure` and the `QuestionProvenance` strip. |
| Change which branch a question belongs to | Never exists | No control. The provenance strip states it as a fact: "Asked of everyone" / "Only if they choose Business Mums or Both". |
| Change the question **type** (single choice → multi-select, etc.) | Never exists | No control. The type appears in the provenance strip as a fact. *(Note: the source form's defect #4 — "How often would you like events?" being a checkbox group — must therefore be fixed in code, not by Ash. Flagged in Gaps.)* |
| `Required` toggle on the **branch key** question | Contextually unavailable | Visible, dimmed, `aria-disabled`, focusable, with `UnavailableNote`: "Always required. The rest of the form depends on this answer — Business Mums and Career Mums see different questions after it." |
| `Required` toggle on the **consent** question | Contextually unavailable | Visible, dimmed, with: "Always required. We can't store a submission without it." |
| `Retire` on the **last live option** | Contextually unavailable | Visible, dimmed, with: "Can't retire the last option — this question has to offer members something to choose. Add another option first." |
| The **option list** on the category question | Managed elsewhere | Rendered as plain text, not as dimmed inputs. Dimmed inputs would read as "you may not edit these"; plain text reads as "these are shown here for reference". The `[Manage categories →]` button is full-strength. |
| `Publish changes` with a validation problem | Contextually unavailable | Dimmed + "Fix N problems before publishing" + `[Show me]`. |

- *Aria:* All dimmed controls use `aria-disabled="true"` (not `disabled`) and remain focusable so the reason is reachable. No reason is hover-only.

### Interactions & Animations

| Interaction | Behavior | Timing | prefers-reduced-motion |
|---|---|---|---|
| Type in an option label with usage > 0 | `RenameImpactNote` fades in beneath the row after a 600ms debounce, `aria-live="polite"`. Persists while the field is dirty. | 160ms fade | Appears instantly, no fade. |
| Type in an option label with usage = 0 | No note. Nothing is at stake. | — | — |
| Click `Retire` | `Dialog` opens with the count-bearing confirmation. | Fade+scale 180ms | Opacity only, 0ms transform. |
| Confirm retire | Row height-collapses out of the live list; retired group auto-expands and the new row height-expands in; focus moves to the restored/retired row. | 240ms height + opacity, `ease-in-out` | Row is removed and re-added instantly; group expands instantly; focus still moves. **The focus move is not motion and is never suppressed.** |
| Click `Restore this option` | No dialog — restoring is never destructive. Row moves to the bottom of the live list; focus follows. | 240ms | Instant. |
| `+ Add option` | New empty row appended, focus placed in its input, list scrolls it into view. | Scroll `smooth`, row fade-in 160ms | Scroll `auto`, row appears instantly. Focus still placed. |
| `▲` / `▼` reorder | Rows swap position; `aria-live="polite"` announces "Instagram moved to position 2 of 7". | 180ms transform swap | Positions swap instantly. Announcement unchanged. |
| Drag reorder (pointer only) | Row lifts (`shadow-lg`, 2° tilt), others shift to make room; drop settles. | Follows pointer; 200ms settle | **Drag is disabled entirely** under `prefers-reduced-motion` — the `▲ ▼` buttons remain and are announced as the reorder mechanism. Drag has no non-motion equivalent, so it is removed rather than degraded. |
| Expand / collapse the retired group | Height animation; chevron rotates 90°. | 200ms | Instant toggle, chevron swaps glyph rather than rotating. |
| `See those N members →` | Navigates to the members list pre-filtered. The unsaved-changes guard fires first if there is a draft. | — | — |
| Focus any input | 2px `#fc16a0` focus ring, 2px offset. | Instant | Unchanged. |

### Accessibility Annotations

- **Heading levels:** `<h1>` = the question's **published** label (stable during editing, so the page's accessible name does not change under a screen-reader user mid-edit). `<h2>` "Options". `<h3>` "Retired options (1)" — rendered as the `InlineDisclosure` button inside an `<h3>`, which is the correct pattern for a collapsible section heading.
- **Landmarks:** `<main>` from `AdminLayout`. `<form aria-labelledby>` around the wording panel and option list. The publish bar is `role="region" aria-label="Unpublished changes"`.
- **Focus management:**
  - On entry, focus lands on the back link ("‹ Join form") — not on the label input. Auto-focusing the first field would mean a screen-reader user never hears the `<h1>` or the provenance strip, which is precisely the context that makes the boundary comprehensible.
  - Retire → focus to the retired row's `[Restore this option]` button (so undo is one key away).
  - Restore → focus to the restored row's label input.
  - Add option → focus to the new row's label input.
  - Dialog open → focus to the dialog's `<h2>`; close → focus to the invoking `Retire` button; confirm → focus to the retired row.
  - `[Show me]` on a validation error → smooth-scroll then focus the offending input.
  - Back to Screen 1 → focus lands on the question's row in the list.
- **Screen-reader notes:**
  - Each option's label input has a visually-hidden `<label>`: "Option 2 of 7, label". The usage count is in the input's `aria-describedby`: "Chosen by 312 members."
  - The `Draft` badge is announced via visually-hidden text "unpublished change", not by colour alone.
  - Retired rows announce: "Facebook Group, retired 3 June 2026 by Ash, still shown on 47 past answers."
  - **The guarantee panel is a plain `<p>` inside the retired region, read in normal document order.** It is not a tooltip, not `aria-label` text, and not behind a disclosure — a screen-reader user encounters the guarantee at exactly the same point in the reading order as a sighted user does.
  - Dimmed toggles announce "Members must answer this, switch, on, dimmed" followed by their `aria-describedby` reason. The reason is *always* read, because it is what makes the dimming non-arbitrary.
  - The `QuestionProvenance` strip is inside the `<h1>`'s following paragraph and is not `aria-hidden` — it is the primary context for the whole screen.
- **Keyboard operation:**
  - Tab: back link → label input → help textarea → required toggle → each option (input → ▲ → ▼ → Retire) → Add option → retired group toggle → retired rows → disclosure → publish bar.
  - Space/Enter toggles the switch and the disclosure.
  - Escape in the retire dialog cancels.
  - Enter in an option label input commits the rename and moves focus to the next option's input (a list-editing convention Ash will expect from spreadsheets); Shift+Enter moves to the previous.
  - `⌘Enter` in any option input triggers `+ Add option`.
  - Drag is never the only route to reorder.
- **Contrast:** Struck retired labels use `#4a4a5e` on `#fffaf5` (8.9:1) with a `line-through` **plus** the `Retired` badge and the "Retired 3 Jun 2026" text — retirement is never conveyed by strikethrough alone. `Draft` badge: `#7c2d12` on `#ffedd5` (7.1:1). Errors: `#b91c1c` on `#fef2f2` (6.4:1).
- **Touch:** Drag handle 44×44 (non-interactive on touch). `▲`, `▼`, `Retire` each 44×44. Option label inputs 44px tall. `[See those N members →]` and `[Restore this option]` full-width 44px on mobile.

---

## SCREEN 3 — Preview (FR-010)

**Purpose:** Let Ash see exactly what a member sees, in every branch, **including her unsaved draft edits**, without creating a member record, a listing, or a consent record.

**Entry from:** `[Preview draft]` on the publish bar (any screen) · a `Preview` link in the settings header · directly at `/admin/join-form/preview`.

**Exits to:** Form settings · Question editor (via "Edit this question" affordances in the preview chrome) · Publish (the bar travels with Ash into preview).

### Layout Wireframe (mobile-first, 320px)

```
320px viewport
┌────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓ PREVIEW CHROME ▓▓▓▓▓▓▓▓▓▓▓▓▓ │  bg-dark #2d1b4e,
│  Preview — nothing here is saved    ✕ │  white text (14.7:1),
│                                        │  sticky top
│  Draft · 3 unpublished changes         │  13px, #fbcfe8 on dark
│  included                              │
├────────────────────────────────────────┤
│  Viewing as                            │  13px caps, #cbd5e1
│ ┌────────────────────────────────────┐ │
│ │ Not chosen yet                     │ │  segmented, radiogroup
│ ├────────────────────────────────────┤ │  each 44px tall
│ │ Business Mums                      │ │
│ ├────────────────────────────────────┤ │
│ │ ▸ Career Mums                  ✓   │ │  selected
│ ├────────────────────────────────────┤ │
│ │ Both                               │ │
│ └────────────────────────────────────┘ │
│                                        │
│  Directory opt-in    ┌──────────┐      │
│                      │  ●───    │      │  Toggle, 44px
│                      └──────────┘      │
│  Form state          ┌──────────┐      │
│                      │Open ▾    │      │  select, 44px
│                      └──────────┘      │
│  Width               ┌──────────┐      │
│                      │Phone ▾   │      │  Phone (390) / Full
│                      └──────────┘      │
├────────────────────────────────────────┤
│ ╔══════════════════════════════════════╗│  4px #fc16a0 border
│ ║ ┌──────────────────────────────────┐ ║│  (non-text UI, 3:1 ok)
│ ║ │ Draft preview · 3 unpublished    │ ║│  in-frame banner,
│ ║ │ changes included                 │ ║│  bg-pink-50, #831843
│ ║ └──────────────────────────────────┘ ║│  text (10.9:1)
│ ║                                      ║│
│ ║   THE REAL PUBLIC FORM COMPONENT,   ║│
│ ║   rendered from the DRAFT config     ║│
│ ║                                      ║│
│ ║   Welcome to the GPC Mums in         ║│  ← intro text (draft)
│ ║   Business & Work community!         ║│
│ ║                                      ║│
│ ║   What's your first name? *          ║│
│ ║   ┌────────────────────────────┐     ║│
│ ║   │                            │     ║│
│ ║   └────────────────────────────┘     ║│
│ ║                                      ║│
│ ║   How did you hear about us? *       ║│
│ ║   ○ Greenwich Parents & Carers       ║│
│ ║   ○ Weekly Newsletter    ← DRAFT FIX ║│
│ ║   ○ Instagram                        ║│
│ ║   ○ Friend  ○ Event  ○ Google        ║│
│ ║   ○ Other                            ║│
│ ║                                      ║│
│ ║   Which group would you like to      ║│
│ ║   join? *                            ║│
│ ║   ○ Business Mums                    ║│
│ ║   ● Career Mums     ← set by chrome  ║│
│ ║   ○ Both                             ║│
│ ║                                      ║│
│ ║   ── Career Questions ──             ║│  ← only this branch
│ ║   Which best describes your          ║│
│ ║   current situation? *               ║│
│ ║   ☐ Looking for work                 ║│
│ ║   ☐ Employed full-time  …            ║│
│ ║                                      ║│
│ ║   … events, community, directory,    ║│
│ ║     consent …                        ║│
│ ║                                      ║│
│ ║   ┌────────────────────────────┐     ║│
│ ║   │      Join the community    │     ║│  real submit button
│ ║   └────────────────────────────┘     ║│
│ ╚══════════════════════════════════════╝│
│                                        │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │  PublishBar travels here
│ │ 3 unpublished changes.             │ │
│ │ ┌──────────────┐ ┌───────────────┐ │ │
│ │ │Back to       │ │Publish changes│ │ │
│ │ │settings      │ │               │ │ │
│ │ └──────────────┘ └───────────────┘ │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

**After pressing the preview's submit button:**

```
│ ╔══════════════════════════════════════╗│
│ ║ ┌──────────────────────────────────┐ ║│  role="status",
│ ║ │  Preview only — nothing was      │ ║│  focus moves here
│ ║ │  saved.                          │ ║│
│ ║ │                                  │ ║│
│ ║ │  On the live form this would     │ ║│
│ ║ │  have created a member record    │ ║│
│ ║ │  and a pending directory         │ ║│
│ ║ │  listing for review.             │ ║│
│ ║ │                                  │ ║│
│ ║ │  ┌────────────────────────────┐  │ ║│
│ ║ │  │ Back to the form           │  │ ║│  returns with answers
│ ║ │  └────────────────────────────┘  │ ║│  intact
│ ║ │  ┌────────────────────────────┐  │ ║│
│ ║ │  │ Clear and start again      │  │ ║│
│ ║ │  └────────────────────────────┘  │ ║│
│ ║ └──────────────────────────────────┘ ║│
│ ╚══════════════════════════════════════╝│
```

**With "Form state: Closed" selected in the chrome:**

```
│ ╔══════════════════════════════════════╗│
│ ║ ┌──────────────────────────────────┐ ║│
│ ║ │ Draft preview · showing the      │ ║│
│ ║ │ closed message                   │ ║│
│ ║ └──────────────────────────────────┘ ║│
│ ║                                      ║│
│ ║   Join the GPC Mums in Business &    ║│
│ ║   Work community                     ║│
│ ║                                      ║│
│ ║   We've paused new sign-ups while    ║│  ← closed message
│ ║   we catch up with everyone who's    ║│    (draft)
│ ║   already joined. Do check back      ║│
│ ║   soon — and in the meantime you     ║│
│ ║   can find us at our next event.     ║│
│ ║                                      ║│
│ ║   ┌────────────────────────────┐     ║│
│ ║   │   See what's on            │     ║│
│ ║   └────────────────────────────┘     ║│
│ ╚══════════════════════════════════════╝│
│                                        │
│  ⓘ The form is currently Open. This is │  13px, #5b5b70
│    just a preview of the closed state. │  ← prevents the worst
│                                        │    possible confusion
```

**Tablet / Desktop variations (differences only):**

- **≥768px:** The chrome bar becomes a single horizontal strip: title left; `Viewing as` as a real segmented control (four buttons in a row, `radiogroup`); the three toggles/selects right; close `✕` far right. The preview frame is centred with `max-width: 390px` in Phone mode and `max-width: 768px` in Full mode, on a `#e5e7eb` backdrop so the frame edge is unambiguous. Above 1024px, an optional side-by-side mode places the question list on the left (280px) and the preview on the right, with clicking a question scrolling the preview to it and highlighting it — this is the mode Ash will actually use on a laptop, and it is where preview earns its keep during a multi-question edit.
- **≥1024px:** Side-by-side becomes the default; `[Single column]` toggles back.
- The preview frame is **never** an `<iframe>`. An iframe would isolate the draft state, break the shared `PublishBar`, and require postMessage for the branch switcher. It is the same React component tree with an `isPreview` flag.

### Component Hierarchy

1. **NEW** `PreviewChrome` — the dark sticky bar. `role="region" aria-label="Preview controls"`. Deliberately `bg-dark`, deliberately not styled like the public site, so it can never be mistaken for part of the form.
2. **NEW** `BranchSwitcher` — `role="radiogroup" aria-label="Preview the form as"` with four `role="radio"` options: `Not chosen yet`, `Business Mums`, `Career Mums`, `Both`. Arrow-key navigable per the radiogroup pattern.
3. **NEW** `Toggle` — "Directory opt-in", so the FR-003 section can be inspected. Necessary because that section is revealed by an in-form answer, and Ash must be able to reach it without pretending to be a member.
4. Native `<select>` × 2 — "Form state" (Open / Closed) and "Width" (Phone / Full). Native selects rather than custom dropdowns: no custom listbox exists on the site, and building one for two three-item lists is unjustified.
5. **NEW** `PreviewFrame` — 4px `#fc16a0` border, `rounded-2xl`, containing the in-frame draft banner and the form. Pink is legal here: it is a border, i.e. non-text UI, where the 3:1 threshold applies.
6. **NEW** `DraftBanner` — "Draft preview · 3 unpublished changes included", or "Showing the published version — you have no unpublished changes."
7. `JoinForm` — **the real public form component** (EPIC-001), rendered with `isPreview`. Not a mock, not a re-implementation. If preview and production diverge, preview is worthless; sharing the component makes divergence impossible.
8. **NEW** `PreviewSubmitResult` — replaces the form body on submit. `role="status"`.
9. **NEW** `PublishBar` — the same instance, travelling with Ash. `[Preview draft]` is replaced by `[Back to settings]` while on this screen.
10. `Button` (existing) — all chrome and result actions.
11. **NEW** `StatePreviewWarning` — "The form is currently Open. This is just a preview of the closed state." Shown whenever the chrome's Form state differs from the real state.

**Preview safety contract (specification, not implementation):**

- The `isPreview` flag is set by the route, not by any user-supplied value, so it cannot be forged into a real submission path.
- On submit, the preview runs the form's **real client-side validation** — this is the point, since checking a `required` flag change is the main reason to preview — and then **returns without issuing any network request**. No endpoint is called, so no rate-limit counter, honeypot counter, or rejection counter (FR-006) is incremented, and no server log line is produced.
- The preview never renders or transmits real member data.
- The chrome's "Form state: Closed" affects only the preview render. It never touches the real open/closed state, and `StatePreviewWarning` says so whenever they differ.

### Named States

**Default**
- *Trigger:* Preview opened with unpublished changes present.
- *Display:* Chrome + `DraftBanner` reading "Draft preview · 3 unpublished changes included" + the form rendered from the draft config in the selected branch.
- *Aria:* On entry, `role="status"` announces "Preview. Nothing you do here is saved. Showing the draft with 3 unpublished changes, as Career Mums."

**Loading**
- *Trigger:* Draft config resolving on a direct navigation to `/admin/join-form/preview`.
- *Display:* Chrome renders immediately with its controls disabled-with-reason ("Loading the form…"). Frame shows a skeleton of the form's shape.
- *Aria:* `aria-busy="true"` on the frame; `role="status"` "Loading preview."

**Empty**
- *Trigger:* `Viewing as: Not chosen yet` — no branch question renders.
- *Display:* The form renders its unconditional questions and, where the branch questions would appear, a dashed-outline placeholder **inside the frame but visually marked as chrome** (dashed `#94a3b8` border, `#4a4a5e` text): "The Business and Career questions appear here once a member chooses a group. Use *Viewing as* above to see them."
- *Rationale:* An unexplained gap where 11 questions should be would read as a bug. The placeholder is the honest rendering of FR-002's behaviour.
- *Aria:* The placeholder is a `<p>`, read in document order, not `aria-hidden`.
- *Trigger:* No unpublished changes exist.
- *Display:* `DraftBanner` reads "Showing the published version — you have no unpublished changes." Publish bar is absent. This is not an error; previewing the live form is a legitimate thing to want.

**Error**
- *Trigger:* Draft config fails to load.
- *Display:* Red banner inside the frame: "Couldn't load the preview. Your draft is safe — go back to settings and try again." `[Back to settings]` `[Try again]`.
- *Trigger:* The preview's own validation blocks its fake submit.
- *Display:* The **real** public form error behaviour — first offending field focused, `role="alert"` message tied by `aria-describedby` (FR-001). This is not a preview-specific error state; it is the thing being previewed, and it must be indistinguishable from production.
- *Aria:* As per the public form's own specification.

**Success**
- *Trigger:* Preview submit passes validation.
- *Display:* `PreviewSubmitResult` — "Preview only — nothing was saved. On the live form this would have created a member record and a pending directory listing for review." (The second sentence adapts: if the directory opt-in was off, it reads "…would have created a member record.")
- *Aria:* `role="status"`; focus moves to the result heading. `[Back to the form]` restores the entered answers; `[Clear and start again]` resets them.
- *Trigger:* Publish from within preview.
- *Display:* The same in-place publish-bar success as the other screens. The `DraftBanner` flips to "Showing the published version — you have no unpublished changes." **without re-rendering the form**, so Ash's branch selection and typed test answers survive the publish.

**Disabled**
- *Trigger:* Nothing on this screen is permanently disabled. The chrome controls are all fully available — that is the screen's entire purpose.
- *Contextual:* While the draft is loading, the chrome controls are dimmed with the reason "Loading the form…".
- *Contextual:* `[Publish changes]` is absent when there are no unpublished changes, and dimmed-with-reason when validation is blocking.
- *Note:* The preview's own submit button is **never** disabled. Disabling it would prevent Ash checking the validation behaviour, which is one of the two things previewing a required-flag change is for.

### Interactions & Animations

| Interaction | Behavior | Timing | prefers-reduced-motion |
|---|---|---|---|
| Change `Viewing as` | The form re-renders showing that branch. Scroll position is preserved if the target branch exists at a comparable offset, otherwise scrolls to the branch's first question. `aria-live="polite"`: "Showing the Business branch. 7 questions." | Branch sections fade in 180ms, staggered `delay: i*0.04` | Sections appear instantly, no stagger. The `delay: i*0.1` idiom from `Events.jsx` is **not** reused here — 11 questions × 100ms is 1.1s of waiting for an admin doing a fast check. |
| Toggle `Directory opt-in` | The FR-003 section expands or collapses in the preview, exactly as it does for a member. | Matches the public form's own 200ms expand | Matches the public form's reduced-motion behaviour (instant). |
| Change `Form state` to Closed | Frame swaps to the closed message. `StatePreviewWarning` appears. | 160ms cross-fade | Instant swap. |
| Change `Width` | Frame `max-width` animates. | 200ms | Instant resize. |
| Preview submit | Validation runs; on pass, the frame body cross-fades to `PreviewSubmitResult`. | 200ms | Instant swap. Focus still moves. |
| `Back to the form` | Result cross-fades out, answers intact. | 200ms | Instant. |
| Close `✕` | Returns to whichever screen invoked the preview, restoring its scroll position. Unsaved-changes guard does **not** fire — the draft persists; leaving preview is not leaving the editor. | — | — |
| Side-by-side (desktop): click a question in the left list | Preview scrolls to that question and outlines it in `#fc16a0` for 1.5s. | Smooth scroll; outline fades after 1500ms | `behavior: 'auto'`; the outline appears and disappears without fading, and persists 2500ms instead (a longer static cue compensates for the absent motion cue). |

### Accessibility Annotations

- **Heading levels:** `<h1>` "Preview the join form" — visually hidden inside the chrome bar (the chrome shows the shorter "Preview — nothing here is saved"), so the page has a proper accessible name without the visual bar carrying a heavy heading. `<h2>` "Preview controls" (visually hidden) on the chrome's control group. Inside the frame, the public form's own heading structure begins at `<h2>` so it nests correctly beneath the preview's `<h1>`. **The previewed form's headings are demoted one level in preview mode** — this is the single deliberate divergence between preview and production rendering, and it is required to keep the admin page's outline valid.
- **Landmarks:** `<main>` from `AdminLayout`. Chrome is `role="region" aria-label="Preview controls"`. The frame is `role="region" aria-label="Preview of the public join form"` — so a screen-reader user can tell, from the landmark list alone, where the admin interface ends and the simulated public page begins. This is the accessibility equivalent of the pink border.
- **Focus management:**
  - On entry, focus moves to the chrome's `<h1>` (`tabIndex={-1}`), so the "nothing here is saved" context is heard first.
  - Changing `Viewing as` keeps focus on the radio. Focus is never yanked into the newly-revealed branch.
  - Preview submit → focus to the `PreviewSubmitResult` heading.
  - `[Back to the form]` → focus to the form's first field.
  - `✕` → focus returns to whichever control opened the preview.
  - Tab order never enters the previewed form before the chrome controls. Ash always meets "this is a preview" before she meets anything that looks real.
- **Screen-reader notes:**
  - The entry announcement is the most important string on this screen: "Preview. Nothing you do here is saved." It is announced via `role="status"` on mount, and the same sentence is the first visible text and the frame's `aria-label` context. Three independent channels, because a screen-reader user who believes she is on the live form and fills it in has wasted several minutes.
  - `BranchSwitcher` announces "Preview the form as, Career Mums, radio button, 3 of 4."
  - The empty-branch placeholder is read in document order — it explains the absence rather than leaving silence.
  - The previewed form's `required` fields announce exactly as they will in production (`aria-required`), because verifying that is the point.
  - `StatePreviewWarning` is `role="status"` and announces on appearance.
- **Keyboard operation:**
  - Chrome is fully keyboard-operable: `BranchSwitcher` by arrow keys (radiogroup pattern), toggles by Space, selects natively.
  - Escape closes the preview and returns focus to the invoking control.
  - The previewed form is operated exactly as a member would operate it — this is a keyboard test of the public form, and FR-001 requires the public form be fully keyboard-operable, so preview doubles as the manual check for that.
- **Contrast:** Chrome is white on `#2d1b4e` (14.69:1) with secondary text `#fbcfe8` on `#2d1b4e` (9.8:1). The in-frame draft banner is `#831843` on `#fdf2f8` (10.9:1). The `#fc16a0` frame border and the question-highlight outline carry no text.
- **Touch:** Every chrome control ≥44px. On mobile the `BranchSwitcher` stacks as four full-width 44px rows rather than a cramped horizontal segmented control.

---

## 3. Cross-screen states: the guard, save, failure, and disabling

These behave identically on all three screens and are specified once.

### Unsaved-changes guard

- **Trigger:** In-app navigation away from `/admin/join-form/*` while a draft has **unsaved** edits (edits made since the last autosave). Moving *between* the three screens does not trigger it — they share one draft.
- **Also:** `beforeunload` for tab close / reload, which shows the browser's own generic string (unavoidable).
- **Display:** `Dialog`, `role="dialog"`, `aria-modal`, focus trapped, Escape = Stay.

> **You have unpublished changes**
> Your 3 changes are saved as a draft, so they'll still be here when you come back. Members won't see them until you publish.
> `[Stay here]`  `[Publish now]`  `[Leave without publishing]`

- **Button order and emphasis:** `Publish now` is `variant="primary"` (`#c9107f` fill, white text). `Stay here` is `outline`. `Leave without publishing` is a text button, last. The primary action is *publish*, because Journey A's dominant failure is a fix that never goes live.
- **Never destructive:** No path in this dialog discards anything. "Leave without publishing" leaves the draft on the server. Discarding requires the explicit `[Discard changes]` on the publish bar, which has its own confirmation: "Discard all 3 unpublished changes? This puts everything back to what members currently see. It can't be undone." `[Cancel]` `[Discard changes]`.
- **Aria:** Focus to the dialog `<h2>` on open; returned to the triggering link on cancel.

### Save (draft autosave)

- **When:** 800ms debounce after the last keystroke; immediately on blur; immediately on any discrete action (retire, restore, reorder, add, toggle).
- **Success:** Publish bar secondary line — "Draft saved 14:32". No toast, no motion, no focus change. `role="status"` but announced at most once per 30s (a save announcement on every pause in typing is intolerable on a screen reader).
- **Failure:** Red banner (the `LondonEventForm` idiom) + the publish bar's message becomes "Not saved yet" and `Publish changes` dims with the reason "Save your draft first." Retry is automatic with backoff (3 attempts) before the banner appears; the banner's `[Try again]` retries manually. **On-screen values are never reverted or reloaded on save failure** — Ash's typing is the only copy and must not be thrown away.
- **Aria:** Banner is `role="alert"` and takes focus.

### Publish

- **Success:** In-place publish-bar transformation, described per screen. `role="status"`. No navigation, no focus move.
- **Failure:** `role="alert"` banner: "Couldn't publish — your 3 changes are still saved as a draft. Try again." Publish is **all-or-nothing**; there is no partial publish, which is what makes the Journey B guarantee (both changes land together) true.
- **Conflict (a second admin published in between):** "Someone else published a change while you were editing. Review what changed, then publish again." `[See what changed]` shows a plain-language diff ("'Weekly Newletter' renamed to 'Weekly Newsletter' by Kristina, 14:20"). Ash's draft is not overwritten. *Low likelihood at GPC's admin count, but the failure is silent and data-losing if unhandled, so it is specified.*

### Disabled controls — the discipline, restated

Repeated here because it is the section's central claim and must be applied consistently by whoever builds it:

1. **A capability that never exists for anyone renders no control at all.** Its absence is explained once, in prose, at the level of the section it would have belonged to. Never a dimmed button, never a lock icon, never a tooltip.
2. **A capability that exists but is unavailable for this specific thing right now renders visibly, dimmed, with a permanently visible reason beside it.** `aria-disabled="true"` rather than `disabled`, so it stays focusable and the reason is reachable.
3. **No reason is ever hover-only.** Ash is on a laptop; a member of the team on a tablet is not.
4. **Reasons are stated in terms of consequence, never permission.** "The rest of the form depends on this answer" — not "You cannot change this."
5. **Nothing in this section can be deleted.** Options and categories are retired. Questions are structural. The only removal that exists is `[Remove]` on an unnamed draft row that has never been published and that nothing references.

---

## 4. Reuse of the established admin form pattern — and where this departs from it

The reference pattern is `src/pages/admin/LondonEventForm.jsx`: module-level `emptyForm`, four state atoms (`form`, `saving`, `loading`, `error`), `|| ''` hydration, one `set(field, value)` updater, native HTML validation only, one inline red banner, `navigate()` away on success.

### Kept

| Pattern | How it applies here |
|---|---|
| **Module-level constant defining the shape** | Kept, and load-bearing. See the first departure below. |
| **Small number of state atoms** | `config`, `draft`, `saving`, `publishing`, `loading`, `error`. Six rather than four, because save and publish are genuinely distinct operations with distinct failure copy. No state library. |
| **`\|\| ''` hydration** | Kept, with one change — see departure 5. |
| **A single `set()` updater** | Kept in spirit; see departure 2. |
| **One inline red banner, `bg-red-50 border-red-200 text-red-800 rounded-xl p-4`** | Kept verbatim as the *request-failure* surface. |
| **Native HTML validation where it suffices** | Kept for `required`, `maxlength`, `type`. |
| **No new runtime dependencies** | Kept. The `Toggle`, `Dialog`, `OptionListEditor` and focus-trap behaviour are hand-built. Drag-and-drop is the only candidate for a dependency and is explicitly optional (`▲ ▼` buttons are the guaranteed path), so it can ship without one. NFR-012 requires a logged decision for any dependency. |

### Departures — and why each is forced by this being a settings screen

**1. No `emptyForm`, because there is no create mode.** There is exactly one form configuration. It always exists, is never created by an admin, and is never deleted. The module-level constant is therefore not an empty record but a **shape descriptor** — `FORM_STRUCTURE`, an ordered array of `{ id, type, branch, editable: ['label','help','required','options'], defaultLabel, defaultOptions }`.

This is not a stylistic change: **`FORM_STRUCTURE` is the mechanism that enforces the boundary.** It lives in the bundle, so it cannot be edited at runtime by anyone. The admin-editable configuration is a **sparse overlay keyed by question id**, containing only the properties an admin has actually changed. Adding a question means adding an entry to `FORM_STRUCTURE`, which means a code change, which is exactly the constraint FR-008 states. The UI does not "prevent" adding questions; there is simply nowhere to put one. That is why the boundary can be explained as a property of the software rather than as a rule about Ash.

**2. `set(field, value)` becomes `set(path, value)`.** Settings state is nested (question → property; question → options → option → label). A flat single-key updater cannot address it. The single-updater discipline is kept, with a dotted path: `set('questions.how_heard.options.opt_weekly.label', 'Weekly Newsletter')`. One updater, one call site shape, no reducer, no immer.

**3. Never `navigate()` away on success. This is the most important departure.** The record-form pattern treats saving as the end of a task and ejects you to the list. A settings screen is a place you *stay*: Journey B is two edits and one publish, and being thrown to a list after each would make a coherent editorial act feel like three unrelated errands. It would also destroy scroll position in a twelve-row question list and lose Ash's place — the same failure the addendum already names for the moderation queue ("their place in the queue is preserved after each decision"). **Success is therefore an in-place state change of the publish bar, never a navigation and never a toast.**

**4. Not native-validation-only.** Native HTML validation cannot express the rules this screen needs: "at least one live option must remain on a choice question", "option labels must be unique within a question, including retired ones", "the closed message cannot be empty". These are JS-validated, surfaced as field-level errors via `aria-describedby` + `role="alert"`, and they block publish with a stated reason and a `[Show me]` jump.

**5. Two error surfaces, not one.** The reference pattern has a single banner because it has a single failure mode (the save request). Here there are two, and conflating them would be misleading:
- **Field-level errors** (`aria-describedby` + `role="alert"`, inline, red) for validation problems Ash can fix by typing.
- **The page-level red banner** reserved strictly for **request failure** — load, save, publish. If the banner appears, something outside Ash's control went wrong.

**6. Hydration falls back to the shipped default, not to `''`.** `draft[id]?.label ?? FORM_STRUCTURE[id].defaultLabel ?? ''`. A question Ash has never edited must show its live wording, not an empty box — an empty box reads as "this question has no label", which is both false and alarming. Where the value is the shipped default, a small grey "Default wording" note sits beside the field so Ash can tell what she has and has not touched.

**7. An unsaved-changes guard is added.** The record-form pattern needs none, because navigating away *is* the success path. Here navigating away is the risk path.

**8. Autosave replaces an explicit Save button.** The reference pattern has a Save that both persists and completes. Here persistence (draft autosave) and completion (publish) are different acts, and giving them two adjacent buttons would be the single most confusing thing this screen could do. Draft persistence becomes ambient and invisible; **Publish is the only button that means "done".** `⌘S` still maps to an immediate draft save for muscle memory, announced once per session.

**9. The `PublishBar` is shared across three routes.** The reference pattern's state is per-page. Here one draft spans settings, question editor and preview, so the draft and the bar live above the routes (context or a hook at the `/admin/join-form` layout level). Without this, "add a category and retire another land together" is not achievable and Journey B's guarantee fails.

**10. `Button` gains three props the reference pattern never needed.** `size`, real `disabled` styling, and `loading`. All three are already documented as gaps in the shared context; this section is where they become mandatory rather than nice.

---

## Gaps found

1. **`AdminLayout` has no mobile treatment.** `src/components/admin/AdminLayout.jsx` renders `<div className="min-h-screen flex">` with `<aside className="w-64 ... shrink-0">` and no responsive class. At 320px the content area is ~64px wide. Every wireframe in this section assumes an off-canvas drawer below `md:` with a hamburger in a sticky top bar. **This is a change to an existing shared component affecting all eight current admin screens**, and it is not in any FR. It needs an owner and a story. (Ash is described as working on a laptop, so a defensible alternative is to declare the admin panel desktop-only and drop the 320px requirement for admin screens — but that should be an explicit, logged decision, not a silent one.)

2. **The admin sidebar array will reach ~13 items.** EPIC-002/004/005/007 add Join form, Members, Insights, Directory queue, Categories and Withdrawal requests to an already-flat eight-item list. Grouping (e.g. a "Membership" section) is needed but spans epics and belongs to no single FR. Not decided here.

3. **Category ownership is a cross-epic seam.** FR-017 (EPIC-005) makes categories a managed taxonomy that drives both the form and the public directory filter. FR-008 (EPIC-002) makes choice options editable in the question editor. This section resolves it by making `/admin/directory/categories` the single owner and rendering the form's category options read-only with a link — but that is a design decision made here, not one the PRD states. It should be confirmed, and if confirmed, FR-008's acceptance criteria may want a note that the category question is the documented exception.

4. **Whether the form configuration is seeded by migration.** The Empty state on Screen 1 exists only if it is not. Seeding from `FORM_STRUCTURE` defaults at migration time is strongly preferable (it makes the Empty state unreachable and guarantees `/join` renders on first deploy). An architecture decision, not a UX one.

5. **The publish/version model needs an architecture counterpart.** This section specifies member-facing behaviour that requires a `config_version` integer incrementing on publish, submissions declaring the version they were rendered from, and the server validating against the declared version. The PRD does not mention versioning of form configuration anywhere. Without it, the mid-submission guarantees in section 2 cannot be delivered, and a required-flag change could reject a member who never saw the rule. **This is the most consequential gap in this section.**

6. **Question *type* is not admin-editable, which leaves source-form defect #4 unfixed by admins.** "How often would you like events?" is a checkbox group that accepts Weekly + Quarterly. FR-008 permits editing labels, options and required flags — not types. So this defect must be fixed in `FORM_STRUCTURE` in code before launch. It is listed in the shared context as a defect the UX must fix, but no FR assigns it. Needs a line in EPIC-001.

7. **The public `/join` "Admin: edit this form" chip** (a recovery path in Journey A) requires the public page to know whether the viewer is an authenticated admin. That is a small auth read on a public page and may be unwanted for performance or caching reasons. Marked optional; the journey succeeds without it.

8. **Multi-admin publish conflicts.** GPC has a handful of admins and no role tiers (PRD assumption 3). The conflict state is specified above, but whether the backend supports optimistic concurrency on the config row is an architecture question. If it does not, the last publish silently wins.

9. **Per-field revert is not specified.** `[Discard changes]` is all-or-nothing. If Ash makes one good edit and one bad one, she must fix the bad one by hand. Acceptable at this scale; worth revisiting if the draft routinely spans many edits.

10. **The contact address in the closed-mid-submission message** is `gpc.communitynews@gmail.com`, taken from four occurrences in `src/`. Confirm this is the right destination for "we couldn't take your sign-up" mail before launch — it may want to be the admin address decided in addendum Q9.

11. **Whether the intro text and closed message should support any formatting.** Specified here as plain text (consistent with FR-020's "rendered as plain text, never as markup"). But an admin writing a closed message will want a link ("see what's on") and possibly a paragraph break. Paragraph breaks are handled (newlines preserved); links are not. If a link is needed, the safe pattern is a separate optional "Button label" + "Button link" pair rather than any markup in the text. Not decided.

12. **Announcement throttling thresholds** (character counter at 50/20/10/0; save at most once per 30s; change count debounced 1000ms) are judgement calls that should be validated in the NFR-008 manual screen-reader pass rather than taken as final.
