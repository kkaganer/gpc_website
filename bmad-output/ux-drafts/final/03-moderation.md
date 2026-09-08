## 3. Moderating the directory

**Covers:** FR-015, FR-016, FR-017, FR-021, FR-022, NFR-013. **Supporting:** NFR-002, NFR-005, NFR-008, NFR-010, NFR-011, FR-020.
**Persona throughout:** **Ash**, GPC volunteer admin. Not technical, moderates in short bursts, often on a phone. She must never open a database and never be made to read a listing twice because the screen lost her place.

**Routes** (all admin-session, server-checked, NFR-002): `/admin/directory` moderation queue (M-S1) · `/admin/directory/:id` listing review & edit (M-S2) · `/admin/directory/categories` categories (M-S4), the taxonomy's only home (A3).

### Conventions for this section

- **Status vocabulary.** One set of names, the `Badge` variants ratified in DESIGN.md §2.7: **Pending · Published · Held · Rejected · Unpublished**. A resubmission against a live listing reuses the §2.7 *Pending* pair with the label **Resubmission** (A10). The `SubscribersManager` class-map *idiom* is reused; **its values are not** — its ramp fails AA at pill size (A15). A pill is never the only carrier: every row restates the status in words ("Pending · submitted 6 Aug"), and the `<dl>` legend at the foot of M-S1 gives each in plain English ("Held — parked on purpose. Not public, not rejected.").
- **Waiting too long.** `WAITING_WARN_DAYS = 5`, `WAITING_LATE_DAYS = 10` working days, from the PRD's own median-decision metric. 5–9 days: 4px `--color-warning` left rail plus a chip "⏱ Waiting 6 days", sorted above younger rows. ≥10: `--color-error` rail, "⏱ Waiting 12 days — overdue", pinned to the top and counted in the sidebar badge. The rail duplicates the chip, so colour is never the signal. Default sort is oldest-first for the same reason.
- **The private-data boundary.** These are the only screens where private member data is legitimately visible. Public (FR-003): business name, category, description, website, Instagram, public enquiry contact. Everything else — first name, signup email, postcode, group, survey answers, consent records, moderation notes — renders only inside a container whose first line reads **"Private — never published. This is the admin panel, so you can see it here."** Three testable rules: private values never render inside the public-fields region; no control copies a private value into a public field; no copy or export affordance on these screens emits anything but public fields.
- **Attribution (NFR-013).** Every publish, hold, reject, unpublish, edit and category change records actor and UTC instant and *shows* it — "**Published by Ash Nolan · 18 Aug 2026, 14:07**". Actor from `user_metadata.full_name`, falling back to the account email (in `title`, so two Ashes stay distinct); `<time datetime="…Z">` rendered local. Member-originated entries read "the member, via /join". History is append-only with no edit or delete control anywhere.
- **Keeping her place.** This codebase already shipped and fixed this bug once (`310e86c`). **P1** — `loading` is set only when nothing is on screen yet; the post-decision refetch is `silent`, the list never unmounts, and the row count is read through a ref, not a dependency. **P2** — a decided row *settles in place* at its previous index and height and leaves only on "Clear N decided", tab/filter change or reload; tab counts drop immediately, rows do not. **P3** — `visible` and the Set of expanded disclosures reset only on tab, search or sort change. **P4** — queue state (tab, search, sort, `visible`, expanded ids, scroll) survives a round trip to M-S2; on return the reviewed row is scrolled into view and focused. Back button and "Back to queue" behave identically.
- **Bounded fetch and reversibility.** `PAGE_SIZE = 25`; the query is ranged, never unbounded — oldest-first, `range(0, n*25 - 1)`, with **"Show 25 more"** widening it and appending (NFR-010). Tab counts come from a separate `count: 'exact', head: true` query, so a badge never costs a page of rows. Publish ⇄ Unpublish and Hold/Reject ⇄ Move back to pending reverse permanently, so the 10-second **Undo (n)** is a convenience, not a time limit on an essential function (WCAG 2.2.1); the countdown is text, never an animated ring.
- **Shell.** `AdminLayout` becomes responsive here and this section owns it (A21): below 768px the `w-64` sidebar becomes an off-canvas drawer behind a `☰` in a sticky top bar carrying the page title and the pending count, following the DESIGN.md §2.9 dialog contract. `AdminLayout` has no `Layout` wrapper, so it also gains the skip link (`--color-primary-700`, `focus-visible:`) and `aria-current="page"`. Feedback is the inline banner of DESIGN.md §2.10 beside the thing it describes — **no toaster** (A6). Page loads use skeletons, in-flight actions the in-button `Spinner` (A7). One `aria-live="polite"` region and one `role="alert"` region per screen (A13).

### Journey M1 — Ash clears the pending queue

**Goal:** every pending listing reaches a recorded decision — published, held, or rejected with a reason — without losing her place and without opening each one.
**Time:** 8–15s per listing decided from the row; 60–90s for one needing an edit. A 12-item queue with two edits: about 5 minutes.
**Entry points:** the FR-022 batch email ("3 new directory listings to review") · the sidebar **Directory** item and its count · the dashboard quick-link card · a bookmark · returning from M-S2 (the highest-frequency entry in practice).
**Success criteria:** every listing has a decision, an actor and a UTC timestamp · the Pending tab reaches zero and *says so in words* rather than going blank · no decision costs more than two clicks and publishing costs one · scroll, disclosures and pagination survived every decision · published listings appear on the public directory on its next load · every rejection carries a reason on the record and, where email works, a courteous member email · a failed email never rolled back a decision.

```
 ENTRY  batch email · sidebar "Directory ⬤3" · dashboard card · bookmark
   ▼
 M-S1 QUEUE — Pending, oldest first, overdue pinned to the top
 "3 waiting for review · 1 waiting more than 5 working days"
 Each card carries all she needs to decide: name · category · full
 description · links · public contact · ▸ member details (private)
   │
   ├─▶ PUBLISH (1 click) ──────────────────────────────────┐
   ├─▶ HOLD (2 clicks) ──┐                                 │
   ├─▶ REJECT (2 clicks) ┴─▶ M-S3 — the reason chip IS ────┤
   │                        the confirm button             │
   └─▶ REVIEW & EDIT → M-S2, still undecided ─▶ (P4 back)  │
                                                           ▼
 WRITTEN, server-side: status · actor + UTC · reason · member email
 queued as a SEPARATE operation (NFR-011)
   ▼
 ROW SETTLES IN PLACE (P2): "✓ Published · just now" · attribution ·
 "Emailing her now…" → "Emailed 14:07" · [ Undo (9) ] [ View ↗ ] ·
 the list never unmounts · focus → Undo · live "…published. 2 left"
   ▼
 LAST ITEM SETTLES → empty panel BELOW the settled rows: "Queue clear.
 You decided 3 — 2 published, 1 rejected."  [ Clear 3 decided ]  DONE
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
| The decision write fails | `role="alert"` **inside the card**: "That didn't save. Nothing has changed for this listing — try again." + **Try again**. The queue is not refetched, so nothing else moves | Try again |
| Decision saved, email failed (NFR-011) | The pill still reads **Published**. A separate chip: "We couldn't email her — your decision was saved." + **Try again** + **Copy the message**. Never rolled back | Retry, or copy and send from her own mail client (§ Notifications) |
| She publishes the wrong one | **Undo (10)**. If the email has already gone: "Undone. Heads up — she was already emailed that it was live, so you may want to drop her a line." | Manual email; publish, email and undo all stay in the history |

**Drop-off risk.** The honest failure mode is not abandonment mid-queue — it is never opening the queue at all. FR-022 is a *Could*, so the likely launch configuration has no push, and the sidebar and dashboard counts are the only ambient signal that work exists; they must arrive with the admin shell, not lazily after the dashboard paints. Second, the *un-decidable* listing: the path of least resistance is to skip and decide "later", so **Hold is a first-class control with the same weight as Reject** — it converts an invisible skip into a tracked, reversible state with a reason attached. Third, rejection is emotionally expensive in a small community and, unsupported, produces published-anyway listings; the mitigations are pre-written reasons, **Preview the email**, and copy that always names a route back in. Fourth, losing her place: P1–P4 is not polish, it is the difference between a five-minute task and one she avoids.

### Journey M2 — Ash takes a live listing down

**Goal:** get a published listing off the public site quickly, with a recorded reason, without deleting the member's record.
**Time:** under 90 seconds from opening the admin panel, including finding it.
**Entry points:** a complaint by email or Instagram DM · a member emailing "please take me off" · `/admin/data-requests`, whose "Unpublish the listing" action deep-links here with the dialog primed and the request context shown (A5) · spotting it herself on the public site.
**Success criteria:** gone from the directory on its next load · the old URL shows "no longer listed", not a broken page · member record, answers and consent history all retained · a reason recorded, attributed and timestamped · where it answers a data-rights request, that request is marked actioned with the same actor and timestamp.

```
 TRIGGER  complaint · member email · /admin/data-requests · she spots it
   ▼  M-S1 → tab "Published (24)" → 🔍 "little acorns" → 1 result
   ▼  click (1) "Take it down"
 M-S3 Dialog, tone destructive — "Take this listing off the site?"
 "It disappears from the directory straight away. Her member record,
  answers and consent history are all kept."
 Pick a reason — the chip IS the confirm · private note ·
 ☑ Email Hannah about this  [ Preview the email ]
   ▼  click (2) = a reason chip
 WRITTEN: Unpublished · reason + note · actor + UTC · member record
 untouched · any linked data request marked actioned
   ▼  ROW SETTLES: "Taken down · just now — Hannah asked us to"
      [ Undo (9) ] [ Check the public page ↗ ] · Published 24 → 23
   ▼  PUBLIC: off the index next load · the old URL says "no longer
      listed" — the slug is never reused, so links stay meaningful
                                                              DONE
```

| Trigger | Display | Recovery |
|---|---|---|
| She can't find it by business name | Search matches name, category, description **and** the member's first name and signup email — a complaint usually names the person, not the business. "1 listing matches 'little acorns'." | Clear the search; the Published tab browses in full |
| The right answer is an edit, not a take-down | **Review & edit →**. Saving keeps it live — editing is not a re-approval (FR-016), said in those words on screen | — |
| She also wants the data erased | In the dialog: **"This only removes the listing. If she also wants her data deleted, do that from Data requests."** with a link to `/admin/data-requests` | Erasure is a separate, deliberate workflow (A5) |
| Someone already took it down | Row shows **Unpublished** with the existing attribution line; no **Take it down** control is rendered | Nothing to do; the reason and actor are on screen |
| Two admins act at once | The second write conflicts; the row refreshes silently in place: "Priya took this down a moment ago. Nothing more to do." | None needed — the desired end state is already true | Try again |

**Drop-off risk.** This journey's risk is the inverse of M1's: it is slow only in the *finding*. When a complaint lands and the panel makes her hunt through tabs or open listings one at a time, the fastest thing available is emailing the developer — which is why the Published tab has its own search and a row-level take-down. Speed versus deliberation is resolved by making the second click *be* the reason: one-click take-down would be faster but would leave nobody able to answer "why did this disappear?" three weeks later (NFR-013). The residual risk is the badly-recorded take-down — "Something else" with nothing typed — so that is the one chip that does not commit until she writes something.

#### Screen M-S1 — Moderation queue

**Purpose:** show everything needing (or having had) a decision, with enough on each row to decide **without opening it** (FR-015), and surface the pending count wherever Ash might be.

```
┌────────────────────────────────────────────┐
│ ☰  Directory              3       Ash ▾    │ sticky top bar (<768)
│ Directory listings                    [h1] │
│ 3 waiting · 1 over 5 working days · Cats → │
│ │Pending 3│Held 1│Published 24│Rejected│…│ │ tablist; the STRIP
│ [ 🔍 Search name, category or member     ] │ scrolls, not the page
│ Sort [ Oldest first ▾ ]                    │ 44px, label htmlFor/id
│ [ ⚠ 1 listing has been waiting more than 5 │ warning banner,
│   working days. It's at the top.         ] │ absent at zero
│┃┌───────────────────────────────────────┐  │ ┃ = 4px warning rail
│┃│ [⏱ Pending]        ⏱ Waiting 8 days   │  │
│┃│ Little Acorns Childminding      [h2]  │  │
│┃│ Childcare & nannies · submitted 6 Aug │  │
│┃│ Ofsted-registered childminder in Bla… │  │
│┃│ [ Show all 240 characters ]           │  │
│┃│ 🌐 littleacorns.co.uk ◎ @littleac…  ↗ │  │
│┃│ ✉ hello@littleacorns.co.uk            │  │
│┃│ ▸ Member details (private)            │  │ 44px disclosure
│┃│ [            Publish              ]   │  │ primary, 44px
│┃│ [   Hold   ] [   Reject   ]           │  │ equal weight, 44px
│┃│ [     Review & edit  →            ]   │  │
│┃└───────────────────────────────────────┘  │ … 2 more cards, no rail
│ [           Show 25 more               ]   │
│ ── What the labels mean ── <dl>, one line  │ per status, from the
└────────────────────────────────────────────┘ §Conventions hints
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

#### Screen M-S2 — Listing review & edit

**Purpose:** tidy a listing's **public** fields (FR-016) while keeping the member's originally submitted values visible and distinguishable, with the private context needed to judge, and decide from the same screen.

```
┌────────────────────────────────────────────┐
│ ← Back to queue (3 pending)                │ 44px, first tab stop
│ Little Acorns Childminding            [h1] │
│ [⏱ Pending] ⏱ 8 days · via /join, 6 Aug    │
│ [ Nothing here is public until you press ] │ info panel
│ [ Publish.                               ] │
│ ══ What goes on the website ══════════ [h2]│ only these six fields
│ Business name * [ Little Acorns Child…  ]  │ are ever published
│ [ ✎ You changed this. She wrote "little   ]│ renaming never changes
│ [ acorns childminding" [ Use her version ]]│ the web address (A16)
│ Category * [ Childcare & nannies       ▾]  │ She chose: Childcare &
│ Manage categories →                        │ nannies  (unchanged)
│ Short description * [ Ofsted-registered  ] │
│ 212 of 300 characters  [ ✎ changed·Compare]│
│ Website [ littleacorns.co.uk ] ↗ Instagram │
│ [ @littleacornsse3 ] ↗                     │
│ Public enquiry contact *                   │
│ [ hello@littleacorns.co.uk              ]  │
│ ✓ Different from her signup email — good.  │ the only public contact
│ ══ Member details ════════════════════ [h2]│
│ [ 🔒 Private — never published.          ]│ dashed, distinct tint
│ [ Hannah · hannah.w@gmail.com · SE3 9XY  ]│
│ [ Business Mums · consent to publish     ]│ never merged into the
│ [ given 6 Aug 09:12, v1.0 [ Read it ]    ]│ public column, at any
│ [ ▸ Her answers (11)                     ]│ width
│ [ View full member record → ]             │ A17 — the other half
│ ══ History (NFR-013) ═════════════════ [h2]│ • Description edited by
│ [        Save and publish             ]    │ Ash Nolan · 14:05
│ [ Save only ][ Hold ][ Reject ]            │ sticky bottom bar
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

#### Screen M-S3 — Decision dialog

**Purpose:** take a decision needing a recorded reason — Hold, Reject, Take down, category Retire/Delete — in one further click, while showing exactly what the member will be told. This is **the** `Dialog` primitive of DESIGN.md §2.9, not a second one (A14); `ConfirmModal` is re-implemented over it so its six existing call sites inherit the dialog semantics and the AA-passing destructive fill without changing at the call site. Beyond §2.9's props it takes **`choices`** — the reason chips, where each chip *is* a confirm button and the footer renders **Cancel** only — plus `busy` (disables both buttons and backdrop dismissal, sets `aria-busy`) and a `children` slot for the private note, the "Email the member" checkbox and the preview.

```
   ░┌──────────────────────────────────┐░
   ░│ Don't publish this listing?  [×] │░ h2 = the dialog's name
   ░│ Little Acorns Childminding       │░
   ░│ Nothing goes public. Pick a      │░ aria-describedby target
   ░│ reason — that's the button. We'll│░
   ░│ email her a short, kind note.    │░
   ░│ [ Not enough detail to publish ] │░ each chip IS a confirm,
   ░│ [ The public contact is a…     ] │░ full width, ≥44px
   ░│ [ This isn't a business listing] │░
   ░│ [ Duplicate ] [ Not a fit ]     │░
   ░│ [ Spam ] (no email sent)        │░
   ░│ [ Something else — write the…  ] │░ does NOT commit: reveals a
   ░│ Private note (optional) [      ] │░ required textarea and a
   ░│ Only admins ever see this.       │░ real confirm button
   ░│ ☑ Email Hannah [ Preview it ]    │░ 44px row; the preview is
   ░│             [    Cancel    ]     │░ inline and read-only
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

#### Screen M-S4 — Categories

**Purpose:** add, rename, reorder and retire the directory taxonomy. **This is the taxonomy's only home** (A3): form configuration generates its category question *from* this list and cannot edit it. Changes take effect **immediately** — a category is data referenced by published listings, not form copy, so there is no draft/publish step here. **Delete** exists only at zero referencing listings (FR-017); otherwise **Retire**.

```
┌────────────────────────────────────────────┐
│ ← Back to listings                         │
│ Categories                            [h1] │
│ 9 on the form · 2 retired · 24 listings    │
│ [ This order is the order members see on ] │ changes are live as
│ [ the form and visitors see in the filter] │ soon as you save them
│ [          + Add a category            ]   │ 44px, expands in place
│ ══ On the form ═══════════════════════ [h2]│
│ ┌ 1. Childcare & nannies · 12 listings ──┐ │ the count links to the
│ │ [↑][↓][ Rename ][ Retire ]             │ │ filtered tab, 44px each
│ │ [ Delete                    ]          │ │ aria-disabled, with the
│ │ 12 listings use this, so it can't be   │ │ reason as always-visible
│ │ deleted. Retire it instead.            │ │ text, never a tooltip
│ ├ 2. Photography · 0 listings ───────────┤ │
│ │ [↑][↓][ Rename ][ Retire ][ Delete ]   │ │ Delete ENABLED at zero
│ │ Nothing uses this yet, so it can be    │ │ (FR-017)
│ │ deleted outright.                      │ │
│ ├ 3. Name [ Sleep & feeding support    ] ┤ │ rename mode; label
│ │ [ Cancel ][ Save name ] · 4 published  │ │ htmlFor/id. Web
│ │ listings show the new name straight    │ │ addresses don't change
│ │ away, and don't need approving again.  │ │
│ └────────────────────────────────────────┘ │
│ ══ Retired ═══════════════════════════ [h2]│ not offered on the form
│ [ Doula & birth support [Retired] · 3     ]│ any more; listings using
│ [ listings · Retired by Ash Nolan, 2 Aug  ]│ them stay published and
│ [ [ Put it back on the form ]             ]│ stay filterable
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
| Rate limited, 5xx or timeout | "Our email service is busy. It usually clears on its own — try again in a few minutes." |
| Browser lost the network | "Your connection dropped before we could send. Check you're online and try again." |
| Anything else | "Something went wrong at our end. Try again, or copy the message and send it yourself." |

A queue-level rollup keeps failures out of hiding: a warning banner under the tab strip — **"2 members haven't been emailed about your decision. [ Show them ]"** — filtering the tab to those rows. Silent at zero.

**Member emails.** Every one ends with the same footer (A18): *"Greenwich Parents & Carers CIC 16387545. Data controller: Aster Thackery. How we handle your data: greenwichparentsandcarers.co.uk/privacy. **Manage your data or unsubscribe:** [mail-token link]."* There is no "just reply to this email" anywhere — that reinstates the email-an-admin-and-wait loop FR-023 exists to remove. Each is shown verbatim in **Preview the email** before Ash commits; she is never asked to send something she has not read.

- **Published.** Subject *"Your GPC directory listing is live"*. "Hi Hannah, Your listing for Little Acorns Childminding is now live in the Greenwich Parents & Carers member directory. Have a look: greenwichparentsandcarers.co.uk/directory/little-acorns-childminding. Want to change something, or come off the list? You can do both from the link at the bottom of this email." + footer.
- **Rejected.** Subject *"About your GPC directory listing"*. "Hi Hannah, Thanks for asking to be listed in the GPC member directory." + the reason sentence for the chosen key + "You're very welcome to send it again — it takes two minutes: greenwichparentsandcarers.co.uk/join. You're still a GPC member and nothing else changes." + footer.
- **Taken down.** Subject *"Your GPC directory listing has come off the site"*. "Hi Hannah, Your listing for Little Acorns Childminding is no longer showing in the Greenwich Parents & Carers member directory." + the reason sentence — `member_request` "You asked us to take it down, so we have." · `complaint` "Someone got in touch with a concern about it, so we've taken it down while we look into it." · `closed` "We heard the business has closed." · `details_wrong` "Some of the details looked out of date, so we've taken it down until we can put them right." · `policy` "It didn't fit our directory rules." · `other` her words verbatim — then "You're still a GPC member and nothing else changes. If you'd like it back up, or you think we've got this wrong, email gpc.communitynews@gmail.com." + footer.
- **Admin batch (FR-022).** Subject *"3 new directory listings to review"*; body "3 listings are waiting in the GPC admin queue. Review them here: greenwichparentsandcarers.co.uk/admin/directory. We don't put member details in these emails." No names, no business names, no addresses — the link is the payload. If a batch send fails, a dismissible alert on the dashboard and M-S1 reads "We couldn't send this morning's 'new listings' email. **The count below is still right** — nothing has been missed."

**Pending count (FR-015: visible from the admin home).** Sidebar **Directory** item — a pill at `ml-auto` following the existing "Soon" pill, accessible name "Directory, 3 pending" (with overdue: "…, 1 waiting more than 5 working days", using the §2.7 warning pair). Dashboard quick-link card — the count replaces the arrow, "3 waiting", description "3 listings are waiting for you to review." M-S1's header and tab labels carry it as content. Browser title `Directory (3) | GPC Admin`. The count is fetched **with the admin shell**, not lazily after the dashboard paints — it is the only ambient signal that work exists, and a number arriving two seconds late arrives after Ash has moved on. Zero renders as **no pill at all**, never "0".

## Notes for architecture

- No requirement covers notifying a member when an admin *edits* their listing (FR-016). Take-down now has an email; edits deliberately do not. Confirm.
- Hold has no defined maximum duration; held rows age with the same waiting chips as pending, which is the only pressure on them.
- Working-day arithmetic for `WAITING_WARN_DAYS` / `WAITING_LATE_DAYS` needs a bank-holiday source; calendar days would be simpler and slightly stricter.
- The publish email's URL depends on the slug being generated once at first publication and never regenerated (A16) — enforce that in the data layer, not only in the UI.
- Undo after the publish email has gone leaves the member holding a link to a "no longer listed" page. The Undo confirmation says so; whether a correction email is offered is a product call.
- A retired category must stay in the public filter while it still has listings and drop out at zero. The public directory section must match; the transition when the last listing is unpublished is unspecified.
- Addendum Q3/Q4 (whether the public enquiry contact is an email, a phone or a link, and whether it is relayed) changes the signup-email warning, the M-S2 field and the public contact row.
