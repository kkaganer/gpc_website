# EXPERIENCE.md — Section: Admin Directory Moderation

**Covers:** FR-015, FR-016, FR-017, FR-021, FR-022, NFR-013
**Supporting:** NFR-002 (authenticated admin routes), NFR-008 (WCAG 2.1 AA), NFR-011 (no silent loss), NFR-005 (20-working-day window), FR-020 (plain text), FR-011 / NFR-001 (public/private split)
**Primary persona throughout:** **Ash** — GPC volunteer admin. Not technical. Moderates in short bursts on a laptop between other things. Must never open a database, and must never be made to read a listing twice because the screen lost her place.
**Status:** Draft for `EXPERIENCE.md` · 2026-08-18

---

## 0. Section conventions

These are established once here and referenced by every journey and screen below.

### 0.1 Routes and navigation

| Route | Screen | Auth |
|---|---|---|
| `/admin/directory` | Moderation queue (M-S1) | Admin session, server-checked (NFR-002) |
| `/admin/directory/:id` | Listing review & edit (M-S2) | Admin session |
| `/admin/directory/categories` | Category management (M-S4) | Admin session |

Sidebar entry is added to the single array at `src/components/admin/AdminLayout.jsx:5-16`, following the existing shape `{ to, label, icon, end?, comingSoon? }` and the file's convention of a comment explaining placement:

```
{ to: '/admin/directory', label: 'Directory', icon: Store },
```

Placed directly **after** `Subscribers` and before `Users` — the two personal-data screens sit together, and the Directory item is the only one in the sidebar that carries a work count.

### 0.2 Status vocabulary and pill class map

Module-scope class map, following the `statusStyles` / `statusLabels` / `statusHints` triple in `SubscribersManager.jsx:6-27`. **`Badge` is deliberately not reused here.** `Badge` renders white text on 500-weight fills; `bg-amber-500` with white measures ~2.15:1 and `bg-primary` measures 3.64:1 — both fail AA at the 11–12px a status pill actually uses. The class map uses `-50` tints with `-700`/`-800` text instead, which clears 4.5:1.

| Key | Label | Pill classes | Hint (rendered in the legend) |
|---|---|---|---|
| `pending` | Pending | `bg-amber-50 text-amber-800` | "Waiting for a decision. Not on the public site." |
| `published` | Live | `bg-green-50 text-green-800` | "On the public directory right now." |
| `held` | On hold | `bg-indigo-50 text-indigo-800` | "Parked on purpose. Not public, not rejected." |
| `rejected` | Not published | `bg-red-50 text-red-700` | "Declined, with a reason on the record. Not public." |
| `unpublished` | Taken down | `bg-gray-100 text-gray-700` | "Was live, now removed. The member's record is kept." |

Note for the builder: the existing `SubscribersManager` map uses `text-green-600` on `bg-green-50` (~3.4:1) and `text-amber-600` on `bg-amber-50` (~3.1:1). Those fail AA at pill size. This section raises the ramp to `-700`/`-800`; the same correction should be back-ported to Subscribers, but that is out of scope here and is not a blocker.

A pill is **never the only carrier of meaning**: every row also states the status in words in its meta line ("Pending · submitted 10 Aug").

### 0.3 "Waiting too long" treatment (addendum, FR-015 overflow)

The addendum requires that a listing pending "beyond a defined period" is visually distinguished. The PRD's success metric — *median time from submission to moderation decision ≤ 5 working days* — supplies the number. Module-scope constants alongside `PAGE_SIZE`:

```
WAITING_WARN_DAYS = 5    // working days
WAITING_LATE_DAYS = 10   // working days
```

| Age (working days) | Treatment |
|---|---|
| 0–4 | No extra treatment. Meta line reads "submitted 16 Aug". |
| 5–9 | 4px amber left rail on the card (`border-l-4 border-amber-400`); chip `⏳ Waiting 6 days` in `bg-amber-50 text-amber-800`; row sorts above younger rows. |
| ≥ 10 | 4px red left rail (`border-l-4 border-red-500`); chip `⏳ Waiting 12 days — overdue` in `bg-red-50 text-red-700`; row sorts to the very top; counted in the sidebar badge's overdue variant. |

The rail is decorative and duplicates the chip, so colour is never the only signal (WCAG 1.4.1). Default queue sort is **oldest first** for exactly this reason: the thing most likely to be forgotten is the thing at the top.

### 0.4 The private-data boundary — stated explicitly

Every screen in this section is behind an authenticated admin route (NFR-002). **Private member data is legitimately visible on these screens and on no others.** The boundary is:

- **Public fields** (FR-003): business name, category, description, website, Instagram, public enquiry contact. These are what the admin edits, and the only thing that can ever reach the public site.
- **Private fields**: first name, signup email, postcode, group answer, every survey answer, every consent record, every moderation note and reason. Visible here because Ash cannot judge a listing without them — she needs to see that the public enquiry contact is *not* the signup email, that consent to publish was actually given, and who she is emailing.

Three rules follow, and they are testable:

1. Private values are rendered inside a container explicitly labelled **"Member details — private. This is never published."** They are never rendered inside the public-fields region.
2. No control copies a private value into a public field. There is no "use their signup email as the public contact" affordance, by design.
3. Any copy, export, or share affordance on these screens copies **public fields only**. The screens offer no "copy record" button at all.

### 0.5 Attribution line (NFR-013)

Every publish, hold, reject, unpublish and edit records the acting admin and a UTC timestamp, and every one of them is *shown*, not merely stored.

Rendered format, used identically in the queue row, the review screen header, and the history list:

> **Published by Ash Nolan · 18 Aug 2026, 14:07**

- Actor name comes from `user_metadata.full_name` (as `Dashboard.jsx` already does), falling back to the account email when no name is set. The email is always available as the `title` attribute so two admins named Ash are still distinguishable.
- The timestamp is rendered in the reader's local time inside `<time datetime="…Z">` carrying the UTC instant, so the machine-readable value is unambiguous.
- Member-originated entries are attributed to **"the member, via /join"** — never to an admin.
- The history is append-only and has no edit or delete control anywhere in the UI.

### 0.6 Queue-position preservation — the contract (addendum, FR-015 overflow)

> *"Given several listings are pending, when an admin works through them, then their place in the queue is preserved after each decision."*

This codebase has already shipped and fixed this exact bug once (`310e86c`, *"Stop the review queue losing your place"*): `useDiscoveredActivities` set `loading = true` on **every** fetch including the post-action refetch, `loading` drove a full-page spinner that *replaced* the table, so each approve unmounted the list and rebuilt it — scroll gone, open groups shut, back to the top. Fifty reviews meant fifty trips back to the top.

The directory queue must not re-introduce it. Four mechanisms, all required:

**P1 — The list never unmounts on a refetch.** `loading` (which drives the full-surface spinner) is set only when there is nothing on screen yet — the genuine first load. The refetch that follows a decision is `silent`, swapping rows underneath a list that stays mounted. The row count is read through a ref, not a dependency, or the fetch callback rebuilds on every fetch and re-fires its own effect in a loop. This is the fix from `310e86c` applied ahead of the bug rather than after it.

**P2 — A decided row settles in place; it is not removed.** On a decision the card stays exactly where it is, at exactly its previous height where possible, and switches to its settled presentation (§M-S1 "Success"). Nothing above the viewport changes height, so scroll offset stays valid. Settled rows leave the list only when the admin presses **"Clear 6 decided"**, changes tab, changes filter, or reloads. The tab's pending *count* drops immediately; the *rows* do not.

**P3 — Pagination and disclosure state survive a refetch.** The `visible` count (`Show N more`) and the Set of expanded "Member details" disclosures are reset **only** on a tab, search or sort change — matching the `setVisible(PAGE_SIZE)` on filter change in `SubscribersManager.jsx:146`. A silent refetch resets neither.

**P4 — A round trip to the review screen returns her to the same spot.** Queue view state (active tab, search text, sort, `visible` count, expanded id Set, scroll offset) is retained across navigation to `/admin/directory/:id` and back. On return, the row just reviewed is scrolled into view and receives focus. Using the browser Back button and using the on-screen "Back to queue" link behave identically.

**Focus, on every decision:** focus moves from the pressed control to the settled row's **Undo** button. When Undo lapses it is replaced in place by the reverse action ("Unpublish" / "Move back to pending"), which inherits focus if focus was on Undo. Focus is never dropped to `<body>`.

### 0.7 Reversibility, and why there is no timing pressure

Every decision is reversible, permanently:

| Decision | Immediate Undo (10s) | After the Undo window |
|---|---|---|
| Publish | "Undo" → back to Pending, listing off the public site | "Unpublish" (M-S3) |
| Hold | "Undo" → back to Pending | "Move back to pending" |
| Reject | "Undo" → back to Pending | "Move back to pending" |
| Unpublish | "Undo" → back to Live | "Publish" |

Because the reverse action never expires, the 10-second Undo window is a convenience and not a time limit on an essential function — which is what keeps this compliant with WCAG 2.2.1. The countdown is text ("Undo (7)"), not an animated ring.

### 0.8 Existing primitives: what is reused, what must be extended

| Primitive | Use here | Change required |
|---|---|---|
| `Button` | All decision controls | **Extension needed.** No `disabled` styling, no loading state, no size variants. Add: `disabled` (`opacity-60`, `cursor-not-allowed`, no hover transform), `busy` (renders the copy-pasted spinner idiom, sets `aria-busy="true"`, keeps the label so width does not jump). `primary` must use `#c9107f` not `#fc16a0` (white on `#fc16a0` = 3.64:1, fails). `hover:scale-105` must be gated behind `prefers-reduced-motion`. Minimum target 44×44 (current `px-6 py-3` gives ~42px — nudge to `py-3.5`). |
| `Card` | Queue rows, panels on M-S2/M-S4 | None. Consumers add `p-4 md:p-6` as they already must. |
| `SectionHeading` | Sub-section headings within M-S2 and M-S4 | None, but it is always an `<h2>` and **cannot** serve as the page `<h1>` — each screen renders its own `h1` in the `Dashboard.jsx` idiom (`font-heading text-3xl font-bold text-dark`). |
| `Badge` | **Not used.** See §0.2. | — |
| `ConfirmModal` | Reject / Hold / Unpublish / Retire confirmations | **Extension needed and specified in full at M-S3.** Its confirm button label is the hard-coded string `Delete` and its fill is the hard-coded `bg-red-500`. Neither is usable for "Reject" or "Take down", and `bg-red-500` with white text measures 3.76:1 — it fails AA today in every place it is already used. |
| Spinner idiom | Loading states | Reused verbatim (`animate-spin rounded-full border-4 border-primary border-t-transparent`), with the reduced-motion substitute in §0.9. |
| Live region idiom | Decision announcements | `role="status" aria-live="polite"`, copying `NewsletterBanner.jsx` — currently the site's only live region. |

**AdminLayout is not responsive today** — a fixed `w-64` sidebar in a `flex` row, so `/admin` horizontally scrolls below roughly 700px. Meeting the 320px rule on these screens requires an AdminLayout change: below `md:` the sidebar becomes an off-canvas drawer behind a `☰` trigger in a sticky top bar that carries the page title and the pending count. Logged in **Gaps found**, because it is a shared-shell change and larger than this feature.

### 0.9 Motion policy for this section

`prefers-reduced-motion: reduce` is honoured everywhere — the site currently ignores it entirely, and this section must not inherit that.

| Effect | Default | Reduced motion |
|---|---|---|
| Row entry on first load | opacity + 8px rise, 200ms, stagger `i * 0.03s` capped at 300ms total | opacity only, 0ms, no stagger |
| Settled-row transition | 180ms cross-fade of the card body | instant swap |
| "Clear decided" removal | 160ms height collapse | instant removal |
| Dialog entry | 150ms fade + 4px rise | instant, no transform |
| Spinner | `animate-spin` | static ring + the text that always accompanies it ("Loading…" / "Publishing…") |
| Button hover | `scale-105` | no transform; background-tint change only |
| Undo countdown | numeric text | numeric text (unchanged — it is content, not decoration) |

---

## Journey M1 — Ash clears the pending queue

**Goal:** Ash takes every pending directory listing from "waiting" to a recorded decision — published, held, or rejected with a reason — without losing her place, without opening a database, and without opening every listing individually.

**Primary persona:** Ash (volunteer admin, laptop, short bursts, low technical confidence). Secondary: the members waiting for a decision, who never see this screen but feel its latency.

**Estimated time:** 8–15 seconds per straightforward listing decided from the queue row; 60–90 seconds for one that needs opening and editing. A realistic 12-item queue with two edits: **about 5 minutes**, in one sitting. First-ever visit adds ~60 seconds of orientation.

**Entry points:**
1. The batched FR-022 email — *"3 new directory listings to review"* → link to `/admin/directory`.
2. The sidebar item **Directory** with its count badge, from anywhere in the admin panel.
3. The Dashboard quick-link card, which shows the count in place of its usual arrow.
4. A bookmark straight to `/admin/directory`.
5. Returning from `/admin/directory/:id` after reviewing one listing (the highest-frequency entry in practice).

**Success criteria:**
- Every pending listing has a recorded decision, an actor and a UTC timestamp (NFR-013).
- The Pending tab reaches zero and says so in words, not by going blank.
- No decision required more than two clicks; publishing required one.
- Scroll position, expanded disclosures and pagination were preserved across every decision (§0.6).
- Every published listing appears on the public directory on its next load (FR-015).
- Every rejection carries a reason on the record (FR-015) and, where email is working, a courteous member email (FR-021).
- A failed email never rolled back a decision (NFR-011) and is visible and retryable.

### Happy Path

```
                    ┌───────────────────────────────────┐
                    │ ENTRY                             │
                    │ • FR-022 batch email link         │
                    │ • Sidebar "Directory  ⬤3"         │
                    │ • Dashboard card "3 waiting"      │
                    │ • Bookmark /admin/directory       │
                    └────────────────┬──────────────────┘
                                     │  click (1)
                                     ▼
   ┌──────────────────────────────────────────────────────────────┐
   │ M-S1  MODERATION QUEUE — Pending tab, oldest first           │
   │ h1 "Directory listings"                                      │
   │ "3 waiting for review · 1 waiting more than 5 working days"  │
   │ Overdue rows pinned to the top, amber/red left rail          │
   │ Each card carries EVERYTHING needed to decide:               │
   │   name · category · full description · links · public        │
   │   contact · ▸ Member details (private, collapsed)            │
   └────────────────┬─────────────────────────────────────────────┘
                    │
                    │  Ash reads the top card. Three ways out:
                    │
     ┌──────────────┼───────────────────────┬─────────────────────┐
     ▼              ▼                       ▼                     ▼
 ┌────────┐   ┌───────────┐          ┌────────────┐      ┌────────────────┐
 │PUBLISH │   │   HOLD    │          │   REJECT   │      │ REVIEW & EDIT →│
 │1 click │   │ 2 clicks  │          │  2 clicks  │      │  (M-S2)        │
 └───┬────┘   └─────┬─────┘          └──────┬─────┘      └───────┬────────┘
     │              │                       │                    │
     │              ▼                       ▼                    │
     │      ┌───────────────┐       ┌───────────────┐            │
     │      │ M-S3 dialog   │       │ M-S3 dialog   │            │
     │      │ pick a reason │       │ pick a reason │            │
     │      │ = the confirm │       │ = the confirm │            │
     │      └───────┬───────┘       └───────┬───────┘            │
     │              │                       │                    │
     └──────────────┴───────────┬───────────┘                    │
                                ▼                                │
        ┌────────────────────────────────────────────┐           │
        │ DECISION WRITTEN (server, service role)    │           │
        │ • status set                               │           │
        │ • actor + UTC timestamp appended (NFR-013) │           │
        │ • reason stored for hold / reject          │           │
        │ • member email QUEUED — separately         │           │
        └──────────────────┬─────────────────────────┘           │
                           ▼                                     │
        ┌────────────────────────────────────────────┐           │
        │ ROW SETTLES IN PLACE  (§0.6 P2)            │           │
        │ ✓ Published · just now                     │           │
        │ Emailing her now… → Emailed 14:07          │           │
        │ [ Undo (9) ]  [ View on the site ↗ ]       │           │
        │                                            │           │
        │ • card does NOT move or disappear          │           │
        │ • list never unmounts (P1)                 │           │
        │ • focus → this row's Undo button           │           │
        │ • live region: "Little Acorns published.   │           │
        │   2 left to review."                       │           │
        └──────────────────┬─────────────────────────┘           │
                           │                                     │
                           │  Ash moves down the page.           │
                           │  Scroll is exactly where she left   │
                           │  it. Repeat per listing.            │
                           ▼                                     │
        ┌────────────────────────────────────────────┐           │
        │ LAST PENDING ITEM SETTLES                  │           │
        │ Empty state appears BELOW the settled rows:│           │
        │ "Queue clear. You decided 3 listings —     │           │
        │  2 published, 1 not published."            │           │
        │ [ Clear 3 decided ]  [ See the live        │           │
        │   directory ↗ ]                            │           │
        │ Sidebar badge disappears.                  │           │
        └──────────────────┬─────────────────────────┘           │
                           │                                     │
                           ▼                                     │
                      ╔═════════╗                                │
                      ║  DONE   ║ ◀──────────────────────────────┘
                      ╚═════════╝     (M-S2 exits back to the
                                       queue, scrolled to and
                                       focused on this row — P4)
```

### Decision Points & Alternative Paths

| Trigger | Display | Recovery |
|---|---|---|
| Ash can decide from the card alone (the common case) | Four controls on the card: **Publish** (`primary`, `#c9107f`), **Hold**, **Reject**, **Review & edit →**. Publish is visually dominant; Hold and Reject are equal-weight `secondary` so neither is the path of least resistance. | Every decision reverses (§0.7). Publish takes one click precisely because it is the cheapest to undo. |
| The description needs tidying before it goes live | She presses **Review & edit →**. Card is not decided; it stays Pending. | Back from M-S2 returns her to this exact row, scrolled and focused (P4). |
| She is not sure and does not want to decide now | **Hold** → M-S3 with hold reasons ("Waiting to hear back from the member", "Want a second opinion", "Needs editing before it goes live", "Something else"). Two clicks. Row settles as **On hold** and the Held tab count increments. | "Move back to pending" from the Held tab or the settled row. |
| She rejects | **Reject** → M-S3. Each reason chip *is* the confirm button, so reason + commit is one click. Row settles as **Not published**, reason shown on the card and on the record. | Undo (10s), then "Move back to pending". The rejection reason stays on the record either way — the addendum requires an earlier rejection reason to remain visible to admins after a resubmission. |
| Reason is not in the list | Last chip: **"Something else — write the reason"**. It does *not* commit; it reveals a required textarea (`aria-required`) and a **"Reject with this reason"** button. Three clicks, deliberately, for the uncommon case. | Cancel or Escape closes without deciding; focus returns to the Reject button that opened it. |
| The public enquiry contact is the member's signup email | Card shows an inline amber warning on the contact line: **"⚠ This is the same as her signup email. Publishing it puts her personal address on the public site."** Publish is **not** blocked — Ash may know it is a business address. | The warning links straight to Reject → "The public contact is a personal address", which produces the matching member email. |
| Description contains HTML, markdown or a script tag | Rendered as literal plain text, exactly as it will render publicly (FR-020). A small note under the description: **"Shown exactly as it will appear — we never treat this as code."** | Ash edits it out in M-S2, or rejects it as spam. |
| Two pending listings look like the same business | Not detected automatically in this release. `duplicate` is offered as a reject reason and the search box lets her check by name. | — (Automated duplicate detection is not in scope; noted in Gaps found.) |
| The member re-submitted while the listing was pending | Card shows a chip **"Updated 14 Aug — this replaces their first submission"** and the meta line keeps the *original* submission date, so the waiting clock is not reset by a resubmission. | The superseded values remain in the M-S2 "As the member submitted it" column and in the history. |
| The member re-submitted against an **already published** listing (FR-007) | The published listing is untouched. A separate item appears in an **Updates** tab: "Hannah sent new details for Little Acorns — currently live." Side-by-side live vs. proposed values in M-S2. | Approve the update (replaces public values, stays published — editing is not re-approval, FR-016) or dismiss it (published listing unchanged, dismissal recorded with actor and timestamp). |
| A decision is in flight | Only that card's four controls go `disabled` + `busy` with the label "Publishing…" / "Saving…". Every other card stays live. | If the request fails, see the error row below. |
| The decision request fails (network, 500) | Card returns to its pre-decision state, and a `role="alert"` banner appears **inside the card**: **"That didn't save. Nothing has changed for this listing — try again."** with a **Try again** button. Not a toast: a toast can be missed, and the whole point is that no decision is silently lost. | Try again. The queue is not refetched, so nothing else moves. |
| The **decision saved but the member email failed** (NFR-011) | The status pill says **Live**. A separate chip below says **"We couldn't email her — your decision was saved."** with **Try again** and **Copy the message**. `role="alert"`. The decision is never rolled back. | Retry; or copy the message and send it from her own mail client. Full state table at §N. |
| Email sending is switched off / not configured | Chip reads **"No email sent — email sending is off for now."** with **Copy the message to send yourself**. Not an error; it is the expected launch configuration (FR-021 is a Should and no transactional send exists in the repo today). | Copy + paste into her own email. |
| She publishes the wrong one | **Undo (10)** on the settled row. If the "your listing is live" email already went, the Undo confirmation says so: **"Undone. Heads up — she was already emailed that it was live, so you may want to drop her a line."** | Manual email; the history records the publish, the email, and the undo. |
| She navigates away mid-queue | Settled rows are already saved server-side; nothing is buffered client-side. Returning shows the same tabs and the reduced count. | None needed. Unsaved *edits* in M-S2 are a different case and warn on exit (see M-S2). |
| More than `PAGE_SIZE` (25) pending | **"Show 25 more"** below the list, matching `SubscribersManager.jsx:596-600`. The count in the button is the true remainder. | Count is not reset by decisions (P3). |
| Session expired (NFR-002 → 401) | Full-surface state: **"You've been signed out. Sign in again to carry on — nothing you decided has been lost."** with a **Sign in** button returning to `/admin/directory`. | Re-auth returns her to the queue, same tab. |

### Drop-off Risk Notes

The honest failure mode for this journey is not that Ash abandons mid-queue — it is that **she never opens the queue at all.** She is a volunteer. Moderation competes with a job and a family, and nothing on the public site breaks if the queue is ignored. FR-022 (the batched email) is a *Could*, so the most likely launch configuration has no push at all, and the queue is only discoverable by someone who remembers to look. The sidebar and dashboard counts are therefore doing more work than their size suggests — they are the only ambient signal that work exists. They must be present from the first render of any admin page, not fetched lazily after the dashboard paints, or Ash will have moved on before the number arrives.

The second risk is **the un-decidable listing**. Faced with something ambiguous — a business she has not heard of, a description that reads oddly, a contact that might be a personal address — the path of least resistance is to skip it and decide "later". Later never arrives, the listing ages, and a member is left waiting weeks for a directory they were promised. This is exactly why **Hold is a first-class control with the same visual weight as Reject, not a hidden option**: giving hesitation a named, recorded, reversible home converts an invisible skip into a tracked state with a reason attached. The waiting chips exist for the residue — the ones she skipped anyway.

Third: **rejection is emotionally expensive** in a small community where Ash may know the member personally. Left unsupported, she will publish marginal listings rather than send a rejection, which quietly degrades the "trusted directory" promise. The mitigations are concrete: reasons are pre-written so she does not have to compose the difficult sentence; **Preview the email** lets her see the tone before committing; the reject copy is warm and always names a route back in ("You're very welcome to submit again"); and Hold gives her a legitimate way to defer without either publishing or rejecting.

Fourth, and the one this codebase has already been burned by: **losing her place**. Reviewing fifty discovery items became fifty trips back to the top before `310e86c`, and the directory queue is structurally the same screen. If the queue jumps on every decision, Ash will do one batch and then treat moderation as unpleasant. §0.6 is not polish; it is the difference between a five-minute task and a task she avoids.

Finally, the queue card is dense — description, links, contact, private disclosure, four buttons. At 320px it is roughly a full screen per listing. The risk is that she scrolls past the actions and reads the *next* listing's description while thinking about the previous one. The settled-in-place treatment helps (the decided card visibly changes under her), and the actions sit immediately after the content they belong to with an 8px gap and 16px of separation from the next card's top edge.

---

## Journey M2 — Ash takes a live listing down

**Goal:** Ash removes a published listing from the public directory quickly, with a recorded reason, in response to a complaint, a member's request, or her own discovery that something is wrong — without deleting the member's record.

**Primary persona:** Ash. In this journey she is usually reacting to someone else's message and is under mild time pressure ("someone has complained about a listing").

**Estimated time:** **Under 90 seconds** from opening the admin panel to the listing being off the public site, including finding it.

**Entry points:**
1. A complaint arrives by email or Instagram DM → Ash opens `/admin/directory`, **Live** tab, searches the business name.
2. A member emails asking to be removed → same path.
3. A member uses the FR-023 withdrawal link → a removal request appears in the **Requests** tab with its 20-working-day deadline (NFR-005). *(The withdrawal-request screen itself belongs to the EPIC-007 section; this journey covers only the unpublish action reached from it.)*
4. Ash spots a problem while browsing the public directory → **Review & edit** from the Live tab.

**Success criteria:**
- The listing is gone from the public directory on its next load (FR-015).
- The old public URL shows a "no longer listed" state, not a broken page (FR-020).
- The member record, survey answers and consent history are all retained (FR-015: "the member record is retained").
- A reason is recorded, attributed and timestamped (NFR-013).
- Where the take-down answers a recorded removal request, the request is marked actioned and drops out of the Requests tab.

### Happy Path

```
   ┌─────────────────────────────────────────────────────────────┐
   │ TRIGGER                                                     │
   │ a) complaint by email / DM                                  │
   │ b) member emails "please take me off"                       │
   │ c) FR-023 withdrawal link → Requests tab (deadline shown)   │
   │ d) Ash spots it herself on the public site                  │
   └───────────────────────────┬─────────────────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              │ (a)(b)(d)                       │ (c)
              ▼                                 ▼
   ┌─────────────────────────┐      ┌──────────────────────────────┐
   │ M-S1 → tab "Live (24)"  │      │ M-S1 → tab "Requests (1)"    │
   │ [🔍 "little acorns"]    │      │ "Hannah asked to be removed  │
   │ 1 result                │      │  on 16 Aug. Due by 12 Sep    │
   │                         │      │  (20 working days)."         │
   └───────────┬─────────────┘      └───────────┬──────────────────┘
               │                                │
               └──────────────┬─────────────────┘
                              │  click (1) "Take down"
                              ▼
        ┌─────────────────────────────────────────────────┐
        │ M-S3  ActionConfirmModal — tone: danger         │
        │ "Take this listing off the site?"               │
        │ "Little Acorns Childminding · live since 12 Aug"│
        │                                                 │
        │ "It disappears from the directory straight      │
        │  away. Her member record, answers and consent   │
        │  history are all kept."                         │
        │                                                 │
        │ Pick a reason — this is the confirm:            │
        │  ▸ The member asked us to remove it             │
        │  ▸ Someone complained about it                  │
        │  ▸ The business has closed                      │
        │  ▸ The details are wrong                        │
        │  ▸ It breaks our directory rules                │
        │  ▸ Something else — write the reason            │
        │                                                 │
        │ Private note (optional) [__________________]    │
        │ ☐ Email the member about this  (see Gaps)       │
        │                              [ Cancel ]         │
        └───────────────────┬─────────────────────────────┘
                            │  click (2) = a reason chip
                            ▼
        ┌─────────────────────────────────────────────────┐
        │ WRITTEN (server, service role)                  │
        │ status → unpublished                            │
        │ reason + optional note stored                   │
        │ actor + UTC timestamp appended (NFR-013)        │
        │ member record UNTOUCHED                         │
        │ if from (c): request marked actioned            │
        └───────────────────┬─────────────────────────────┘
                            ▼
        ┌─────────────────────────────────────────────────┐
        │ ROW SETTLES IN PLACE                            │
        │ "Taken down · just now — Hannah asked us to"    │
        │ [ Undo (9) ]   [ Check the public page ↗ ]      │
        │ live region: "Little Acorns taken down. It's    │
        │  off the public directory."                     │
        │ Live tab count 24 → 23                          │
        └───────────────────┬─────────────────────────────┘
                            ▼
        ┌─────────────────────────────────────────────────┐
        │ PUBLIC EFFECT (FR-015, FR-020)                  │
        │ • gone from the directory index next load       │
        │ • old URL → "This listing is no longer listed"  │
        │ • member record, answers, consent all retained  │
        └───────────────────┬─────────────────────────────┘
                            ▼
                       ╔═════════╗
                       ║  DONE   ║
                       ╚═════════╝
```

### Decision Points & Alternative Paths

| Trigger | Display | Recovery |
|---|---|---|
| Complaint is urgent and Ash cannot find the listing by name | Search matches business name, category, description text, **and** the member's first name and signup email (private-but-admin-visible, §0.4) — a complaint often names the person, not the business. Result count announced: "1 listing matches 'little acorns'." | Clear search; the Live tab is browsable in full, oldest-published first. |
| The right answer is an edit, not a take-down | **Review & edit →** from the row. Correcting a wrong phone number or a dead website does not require removing the listing. Saving keeps it published (FR-016 — editing is not a re-approval). | — |
| The member asked to be removed **and** wants their data erased | Take-down handles only the listing. A note in the dialog: **"This only removes the listing. If she also wants her data deleted, handle that from Requests."** with a link. | Erasure is FR-023 / EPIC-007 and is a separate, deliberate workflow. |
| Take-down answers a request in the **Requests** tab | The dialog pre-selects nothing but shows a context line: **"Answering Hannah's removal request from 16 Aug."** On success the request is marked actioned with the same actor and timestamp. | If Undo is used, the request returns to open with its original deadline intact — the deadline is never reset by an admin's mistake. |
| Ash takes down the wrong listing | **Undo (10)** → straight back to Live. After the window, **Publish** restores it. | The history shows take-down and restore as two separate attributed entries; neither is erased. |
| Someone already took it down | Row shows **Taken down** with the existing attribution line ("Taken down by Priya Shah · 17 Aug 2026, 20:14 — someone complained about it"). No **Take down** control is rendered. | Nothing to do; the reason and actor are on screen. |
| The write fails | `role="alert"` inside the row: **"That didn't save — the listing is still live. Try again."** The public site is unchanged, which is the honest and safe reading of the failure. | **Try again.** |
| The member notification for a take-down fails | Same treatment as any other notification failure (§N). The take-down is never rolled back (NFR-011). | Retry, or copy the message. |
| Two admins act on the same listing at once | The second write returns a conflict; the row refreshes silently in place and shows: **"Priya took this down a moment ago. Nothing more to do."** | None needed; the desired end state is already true. |

### Drop-off Risk Notes

This journey's risk is the opposite of M1's: it is **too fast to be careless with, and slow only in the finding**. When a complaint lands, Ash wants the listing gone in under a minute, and if the admin panel makes her hunt through tabs, page through 24 live listings, or open each one to check which is which, she will do the fastest thing available — which, without a "Take down" control on the row, is emailing the developer. The **Live** tab having its own search and a row-level take-down is what keeps this in Ash's hands.

There is a real tension between speed and deliberation. Making take-down a one-click action would be faster but would let a mis-click remove a member's listing with no reason on the record, which fails NFR-013 and leaves nobody able to answer "why did this disappear?" three weeks later. The two-click shape — where the second click *is* the reason — buys the record at no extra cost in clicks, which is the whole design of M-S3.

The subtler risk is **the take-down that never gets recorded properly**: Ash unpublishes in a hurry, picks "Something else", writes nothing, and the record says only that it happened. That is why "Something else" is the one chip that does not commit and does require typing — the fast paths are all the ones that produce a good record.

Finally, a member-requested take-down that goes quiet is a trust failure, and the PRD does not currently require an email for it (FR-021 covers publish and reject only). The dialog surfaces an explicit "Email the member about this" checkbox rather than silently deciding — and the default per reason is flagged in **Gaps found** rather than invented here.

---

## Screen M-S1 — Moderation queue

**Purpose:** Show every listing that needs, or has had, a decision, with enough on each row to decide **without opening it** (FR-015), and to surface the pending count everywhere Ash might be.

**Entry from:** FR-022 batch email · sidebar **Directory** item · Dashboard quick-link card · bookmark · Back from M-S2 (P4) · post-decision refetch.

**Exits to:** M-S2 (Review & edit) · M-S3 (decision dialog, overlay) · M-S4 (Categories) · the public directory and public listing pages (new tab, marked external) · `/admin` (sidebar).

### Layout Wireframe (mobile-first, 320px)

```
┌──────────────────────────────────────────────┐
│ ☰   Directory                    3    Ash ▾  │  sticky top bar (<md only)
├──────────────────────────────────────────────┤
│                                              │
│  Directory listings                     [h1] │
│  3 waiting for review · 1 waiting more       │
│  than 5 working days                         │
│                                       [gear] │
│                             Categories →     │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │Pending 3│Held 1│Live 24│Not pub.│Req 1│ │  role=tablist, h-scroll strip
│  └────────────────────────────────────────┘  │  (the STRIP scrolls, not the page)
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ 🔍 Search name, category or member     │  │  44px, id/htmlFor labelled
│  └────────────────────────────────────────┘  │
│  Sort  [ Oldest first        ▾ ]             │
│                                              │
│  ┌──────────────────────────────────────────┐│
│  │ ⚠ 1 listing has been waiting more than 5 ││  amber notice, only when >0
│  │   working days. It's at the top.         ││
│  └──────────────────────────────────────────┘│
│                                              │
│ ┃┌───────────────────────────────────────┐   │  ┃ = 4px amber left rail
│ ┃│ [Pending]      ⏳ Waiting 8 days       │   │
│ ┃│                                       │   │
│ ┃│ Little Acorns Childminding      [h2]  │   │
│ ┃│ Childcare & nannies · submitted 6 Aug │   │
│ ┃│                                       │   │
│ ┃│ Ofsted-registered childminder in      │   │
│ ┃│ Blackheath with three spaces from     │   │
│ ┃│ September. Outdoor play every day,    │   │
│ ┃│ homemade food, and a…                 │   │
│ ┃│ [ Show all 240 characters ]           │   │
│ ┃│                                       │   │
│ ┃│ 🌐 littleacorns.co.uk              ↗  │   │
│ ┃│ ◎  @littleacornsse3                ↗  │   │
│ ┃│ ✉  hello@littleacorns.co.uk           │   │
│ ┃│                                       │   │
│ ┃│ ▸ Member details (private)            │   │  44px disclosure
│ ┃│                                       │   │
│ ┃│ ┌───────────────────────────────────┐ │   │
│ ┃│ │           Publish                 │ │   │  #c9107f / white, 44px
│ ┃│ └───────────────────────────────────┘ │   │
│ ┃│ ┌──────────────┐ ┌──────────────────┐ │   │
│ ┃│ │     Hold     │ │      Reject      │ │   │  equal weight, 44px
│ ┃│ └──────────────┘ └──────────────────┘ │   │
│ ┃│ ┌───────────────────────────────────┐ │   │
│ ┃│ │        Review & edit  →           │ │   │
│ ┃│ └───────────────────────────────────┘ │   │
│ ┃└───────────────────────────────────────┘   │
│                                              │
│  ┌───────────────────────────────────────┐   │
│  │ [Pending]                             │   │   next card, no rail
│  │ Sea Glass Sleep Support                │   │
│  │ …                                     │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  ┌───────────────────────────────────────┐   │
│  │        Show 25 more                   │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  ── What the labels mean ──────────────────  │   <dl> legend, §0.2 hints
│  [Pending] Waiting for a decision. Not on    │
│            the public site.                  │
│  [Live]    On the public directory now.      │
│  …                                           │
└──────────────────────────────────────────────┘
```

**Expanded "Member details" disclosure** (replaces the `▸` line in place; the card grows downward, so nothing above it moves):

```
 ┃│ ▾ Member details (private)             │
 ┃│ ┌───────────────────────────────────┐  │  distinct tinted panel,
 ┃│ │ Private — never published.        │  │  dashed border
 ┃│ │                                   │  │
 ┃│ │ Hannah · hannah.w@gmail.com       │  │
 ┃│ │ SE3 9XY · Business Mums           │  │
 ┃│ │ Joined via /join, 6 Aug, 09:12    │  │
 ┃│ │ Consent to publish: given         │  │
 ┃│ │   6 Aug 09:12 · wording v1.0      │  │
 ┃│ │ Newsletter: yes                   │  │
 ┃│ │ ✓ Public contact is different     │  │
 ┃│ │   from her signup email           │  │
 ┃│ └───────────────────────────────────┘  │
```

**Settled row** (after a decision — same position, same width, height held as close as possible):

```
  ┌────────────────────────────────────────┐
  │ ✓ Live · just now                      │
  │ Little Acorns Childminding             │
  │ Published by Ash Nolan · 18 Aug, 14:07 │
  │                                        │
  │ ✉ Emailed hello@littleacorns.co.uk     │
  │                                        │
  │ ┌──────────┐  ┌──────────────────────┐ │
  │ │ Undo (9) │  │ View on the site  ↗  │ │
  │ └──────────┘  └──────────────────────┘ │
  └────────────────────────────────────────┘
```

**Empty state, reached by clearing the queue** (appears *below* the settled rows, never replacing them):

```
  ┌────────────────────────────────────────┐
  │              ✓                         │
  │        Queue clear.                    │
  │  You decided 3 listings — 2 published, │
  │  1 not published.                      │
  │                                        │
  │  [ Clear 3 decided ]                   │
  │  [ See the live directory  ↗ ]         │
  └────────────────────────────────────────┘
```

### Tablet / Desktop variations

**Only the differences:**

- **≥ 768px (`md:`)** — the AdminLayout sidebar returns as a permanent rail and the sticky top bar disappears; the `☰` trigger is not rendered. The tab strip fits without scrolling. Card actions move to a single row, right-aligned, in the order **Review & edit · Reject · Hold · Publish** (destructive furthest from the dominant action). The description clamps to 3 lines with "Show all"; below `md:` it clamps to 5, because a phone-shaped card has vertical room to spare and horizontal room it does not.
- **≥ 1024px** — the card becomes two columns: content left (~62%), a right column holding the status pill, waiting chip, submitted date, attribution line and the "Member details" disclosure. Actions stay full-width along the bottom of the card. Search, sort and the "Categories →" link move onto one line with the `h1` block.
- **≥ 1440px** — content column caps at `max-w-5xl`; the surrounding space stays empty. The card does not stretch further, because a 1400px-wide line of description text is unreadable and Ash is scanning, not reading prose.
- No breakpoint introduces a table. `SubscribersManager` uses a `<table>` in an `overflow-x-auto` wrapper, which horizontally scrolls on a phone; this queue is a card list at every width, so the page itself never scrolls sideways.

### Component Hierarchy

1. `AdminLayout` — **extension required** (off-canvas sidebar below `md:`, sticky top bar, count badge on the Directory nav item). Provides `<main>`.
2. `DirectoryQueue` **NEW** — page component. Owns tab, search, sort, `visible`, `expanded` (a `Set`, per `DiscoveryManager.jsx:437`), `settled` (a `Map` of id → outcome), and the P1 silent-refetch behaviour.
   1. Page header — plain `<h1>` in the `Dashboard.jsx` idiom (`SectionHeading` cannot be an `h1`), plus the summary line and the "Categories →" link.
   2. `QueueTabs` **NEW** — `role="tablist"` with roving tabindex. Counts in the label, following `LondonEventsManager.jsx:667-680` (`Pending ({pending.length})`), upgraded from plain buttons to real tab semantics.
   3. `QueueFilters` **NEW** — labelled search input (`htmlFor`/`id`) + sort `<select>`. Flat filter state, per `WhatsOn.jsx` / `EventFilters.jsx`. Changing any filter resets `visible` to `PAGE_SIZE` and clears `expanded`, per `SubscribersManager.jsx:146`.
   4. `OverdueNotice` **NEW** — rendered only when the ≥5-working-day count is non-zero. Silent at zero, mirroring the duplicate-count chip in `LondonEventsManager.jsx:684-698`.
   5. `ListingQueueCard` **NEW** — one per listing. Composes `Card` (which has no internal padding; this consumer adds `p-4 md:p-6`).
      1. `StatusPill` **NEW** — module-scope class map (§0.2). Not `Badge`.
      2. `WaitingChip` **NEW** — the two-tier treatment from §0.3.
      3. `<h2>` business name.
      4. Meta line — category, submitted date, attribution line (§0.5) where one exists.
      5. `PlainText` **NEW** — renders submitted text as text, never as markup (FR-020), with `whitespace-pre-line`, line clamp and a "Show all N characters" toggle.
      6. `ExternalLink` **NEW** — `target="_blank" rel="noopener noreferrer"`, `↗` icon, and a visually-hidden "(opens in a new tab)". *(Also needed by the public directory section; specify once, share.)*
      7. `PublicContactRow` **NEW** — includes the "same as her signup email" warning.
      8. `PrivateMemberPanel` **NEW** — `<button aria-expanded aria-controls>` disclosure over a visually distinct dashed-border panel carrying the §0.4 label.
      9. `DecisionBar` **NEW** — `Button` × 4 (`primary` for Publish; `secondary` for Hold and Reject; `secondary` for Review & edit as a `Link`). Requires the `Button` `disabled`/`busy` extension in §0.8.
      10. `NotificationStatus` **NEW** — §N. Rendered only once a decision exists.
   6. `SettledCard` **NEW** — the post-decision presentation of `ListingQueueCard`, rendered at the same index.
   7. `ShowMoreButton` **NEW** — verbatim behaviour from `SubscribersManager.jsx:593-601`, including the true-remainder count in the label.
   8. `StatusLegend` **NEW** — `<dl>` of pill + hint, per `SubscribersManager.jsx:604-620`.
   9. `QueueLiveRegion` **NEW** — one `role="status" aria-live="polite"` for the whole screen, per `NewsletterBanner.jsx`.
3. `ActionConfirmModal` **NEW** (M-S3) — portalled overlay.
4. `useDirectoryListings` **NEW** hook — the P1 contract lives here, modelled directly on the fixed `useDiscoveredActivities.js`: `loading` is set only when nothing is on screen yet, `fetch({ silent: true })` after a decision, and the row count read through a **ref** rather than a dependency (a dependency rebuilds the callback on every fetch and re-fires its own effect in a loop — the exact trap documented in `310e86c`).

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Tab has ≥ 1 listing and the fetch has resolved | Header, tabs with counts, filters, overdue notice if any, cards oldest-first, "Show N more" if truncated, legend | `<main>` from AdminLayout; `<h1>`; `role="tablist"` / `role="tab"` / `aria-selected`; panel is `role="tabpanel" tabIndex={-1} aria-labelledby` its tab; cards are `<li><article aria-labelledby={nameId}>` inside `<ul>` |
| **Loading (first load only)** | No rows on screen yet | Full-panel centred spinner idiom + "Loading listings…" | `aria-busy="true"` on the tabpanel; the text is inside the `role="status"` region so it is announced once |
| **Loading (refetch after a decision)** | Any decision resolves | **No spinner. Nothing unmounts.** Only the acting card shows `busy`. | The acting card's buttons carry `aria-busy="true"`; the live region announces the outcome, not the fetch |
| **Empty (nothing ever)** | Tab returns zero rows and no decisions this session | "Nothing here yet. When a member asks to be listed in the directory, it lands in this tab for you to review." + "See the live directory ↗" | Inside the tabpanel; announced by the `role="status"` region on tab change ("Pending: no listings") |
| **Empty (cleared this session)** | Last pending row settles | Panel below the settled rows: "Queue clear. You decided 3 listings — 2 published, 1 not published." + "Clear 3 decided" + "See the live directory ↗" | `role="status"` announces "Queue clear. Three listings decided." Focus is **not** moved — Ash's focus is on the last Undo button and moving it would undo P2 |
| **Empty (filtered to nothing)** | Search or sort matches zero of a non-empty tab | "No listing matches 'sleep'. [ Clear the search ]" — distinguishing "nothing here" from "nothing matched", as `SubscribersManager.jsx:581-587` already does | `role="status"` announces the result count on every debounced settle: "No listings match" |
| **Error (fetch failed)** | Listing fetch rejects | Full-panel: "We couldn't load the listings. That's usually a connection blip. [ Try again ]" — no stack trace, no status code | `role="alert"`; focus moves to the **Try again** button |
| **Error (decision failed)** | Decision write rejects | In-card banner: "That didn't save. Nothing has changed for this listing — try again." + **Try again**. Card returns to its pre-decision state; queue is not refetched | `role="alert"` inside the card; focus moves to **Try again** |
| **Error (email failed, decision saved)** | FR-021 send fails | Status pill unchanged (**Live**). Separate chip: "We couldn't email her — your decision was saved." + **Try again** + **Copy the message** | `role="alert"`; the pill and the chip are separate nodes so a screen reader hears "Live" and "email failed" as two distinct facts (NFR-011) |
| **Error (401 / session expired)** | Any request returns 401 | Full-panel: "You've been signed out. Sign in again to carry on — nothing you decided has been lost." + **Sign in** | `role="alert"`; focus to **Sign in** |
| **Success** | A decision resolves | Card settles in place (§0.6 P2): outcome line, attribution line, notification chip, **Undo (n)**, contextual secondary action. Tab counts update | `role="status" aria-live="polite"`: "Little Acorns Childminding published. Emailed hello@littleacorns.co.uk. 2 left to review." Focus moves to **Undo** |
| **Disabled** | (a) A decision is in flight for that card; (b) "Show N more" while a page is loading; (c) **Publish** on a card whose consent-to-publish is missing | (a) That card's four buttons only — `opacity-60`, `cursor-not-allowed`, label becomes "Publishing…". (b) Button reads "Loading…". (c) Publish is `aria-disabled="true"` (focusable, not removed) with a persistent explanation: "She didn't consent to being published, so this can't go live. Reject it, or ask her to submit again." | `aria-disabled="true"` rather than the `disabled` attribute for case (c), so the control stays focusable and its explanation is reachable by keyboard — following the site's "dimmed + disabled, never hidden" convention from `EventFilters.jsx`. `aria-describedby` links the button to the explanation |

### Interactions & Animations

| Interaction | Behavior | Timing | `prefers-reduced-motion` |
|---|---|---|---|
| First render of the card list | opacity 0→1 + 8px rise, staggered `i * 0.03s` capped at 300ms total (not `i * 0.1` as in `Events.jsx` — 25 cards would take 2.5s) | 200ms each | Opacity only, 0ms, no stagger, no transform |
| Tab change | Panel content swaps; no cross-fade | instant | Identical |
| Search typing | 400ms debounce, then filter; result count announced on settle | 400ms | Identical (a debounce is not motion) |
| Press **Publish** | Button → `busy`, label "Publishing…", spinner; on resolve the card cross-fades to `SettledCard` | request-bound; 180ms cross-fade | Spinner static; instant swap |
| Press **Hold** / **Reject** / **Take down** | M-S3 opens; focus to the dialog heading | 150ms fade + 4px rise | Instant, no transform |
| **Undo** countdown | Text only: "Undo (10)" → "Undo (1)", then the button is replaced in place by the reverse action | 1s ticks | Identical (numeric content, not decoration) |
| **Clear N decided** | Settled cards collapse height 160ms and are removed; remaining cards close the gap | 160ms | Instant removal, no height animation |
| Expand **Member details** | Card grows *downward*; nothing above the disclosure moves, so scroll offset stays valid | 150ms height | Instant |
| **Show N more** | New cards append; scroll position untouched; focus moves to the first newly added card's `<h2>` (`tabIndex={-1}`) | append, no animation | Identical |
| Button hover | `secondary` background tint; `primary` `scale-105` | 150ms | No transform on `primary`; tint only |
| Focus | 2px `#fc16a0` ring, 2px offset — non-text UI, so the 3:1 threshold applies and `#fc16a0` clears it | instant | Identical |
| Overdue left rail | Static. No pulse, no flash — nothing on this screen blinks | — | Identical |

### Accessibility Annotations

- **Headings:** `<h1>` "Directory listings" (one per page). Each card's business name is an `<h2>`. The legend is an `<h2>` "What the labels mean". `SectionHeading` is not used at the top of this screen because it always renders an `<h2>`.
- **Landmarks:** `<main>` from `AdminLayout`; sidebar (or off-canvas drawer) is `<nav aria-label="Admin sections">`; the filter block is `<search>` (or `role="search"`); the legend is a `<dl>` inside a `<section aria-labelledby>`.
- **Tabs:** `role="tablist"` with `aria-label="Listing status"`. Roving tabindex: ←/→ move, Home/End jump, Tab enters the panel. Panel is `role="tabpanel" tabIndex={-1} aria-labelledby={tabId}`. Each tab's accessible name includes its count ("Pending, 3 listings").
- **Focus management:** first load → focus stays at the document start so the `h1` is read; tab change → focus to the tabpanel; decision → focus to that row's **Undo**; Undo lapse → focus to the reverse action that replaces it; dialog open → dialog heading; dialog close → the invoking button, or the settled row's Undo if the invoker no longer exists; "Show N more" → the first new card's heading; return from M-S2 → the reviewed row's heading, scrolled into view (P4).
- **Screen reader notes:** one `role="status" aria-live="polite"` region per screen carries decision outcomes, result counts and tab changes — never more than one sentence at a time, and never both a status and an alert simultaneously. Failures use a separate `role="alert"` node so a saved decision and a failed email are heard as two independent facts (NFR-011). The private panel's first line is its label, so expanding it announces "Member details, private, never published" before any personal data. External links carry a visually-hidden "(opens in a new tab)". The waiting chip's text is the full sentence fragment ("Waiting 8 days"), never a bare number.
- **Keyboard operation:** everything is reachable and operable with Tab / Shift+Tab / Enter / Space / arrows within the tablist. No hover-only affordance exists — the "same as signup email" warning is rendered inline, not in a tooltip. Disclosures are `<button aria-expanded>`, not click-handling `<div>`s (`LondonEventCard` is a keyboard-unreachable `<div onClick>` today; this screen must not repeat it). The whole card is **not** a click target: only its named controls are.
- **Targets & reflow:** every control is ≥ 44×44 including the disclosure row and the tab buttons. At 320px nothing overflows horizontally; the tab strip is the only horizontally scrollable element and it is a strip, not the page. Text reflows to 320px at 200% zoom without loss.
- **Contrast:** body text `#1a1a2e` on white; **Publish** is white on `#c9107f` (5.43:1); all links `#c9107f`; `#fc16a0` appears only as focus ring, left rail and icon fill, all non-text at ≥3:1. No body-size text sits on or in `#fc16a0` in either direction.

---

## Screen M-S2 — Listing review & edit

**Purpose:** Let Ash tidy a listing's **public** fields before or after publication (FR-016) while keeping the member's **originally submitted values visible and distinguishable** (FR-016), and give her the private member context she needs to judge (§0.4) — then decide, from the same screen.

**Entry from:** M-S1 "Review & edit →" on any row (any tab) · the Updates tab (a resubmission against a live listing) · a direct link in the FR-022 admin email.

**Exits to:** M-S1 (Back to queue — restores tab, scroll, expansion, and focuses this row, P4) · M-S3 (decision dialog) · M-S4 (Categories, via "Manage categories") · the public listing page (new tab).

### Layout Wireframe (mobile-first, 320px)

```
┌──────────────────────────────────────────────┐
│ ☰   Directory                    3    Ash ▾  │
├──────────────────────────────────────────────┤
│  ← Back to queue (3 pending)                 │  44px, first tab stop
│                                              │
│  Little Acorns Childminding             [h1] │
│  [Pending]   ⏳ Waiting 8 days                │
│  Submitted by the member, via /join          │
│  6 Aug 2026, 09:12                           │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Nothing here is public until you       │  │  info panel, indigo tint
│  │ press Publish.                         │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ══ What goes on the website ══════════════  │  <h2> via SectionHeading
│  Only these six fields are ever published.   │     (align="left")
│                                              │
│  Business name *                             │
│  ┌────────────────────────────────────────┐  │
│  │ Little Acorns Childminding             │  │  rounded-xl, 44px
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │ ✎ You changed this.                    │  │  amber "edited" panel
│  │ She wrote: "little acorns childminding"│  │
│  │ [ Use her version ]                    │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Category *                                  │
│  ┌────────────────────────────────────────┐  │
│  │ Childcare & nannies                 ▾  │  │
│  └────────────────────────────────────────┘  │
│  She chose: Childcare & nannies              │  grey "unchanged" line
│  Manage categories →                         │
│                                              │
│  Short description *                         │
│  ┌────────────────────────────────────────┐  │
│  │ Ofsted-registered childminder in       │  │
│  │ Blackheath with three spaces from      │  │
│  │ September. Outdoor play every day,     │  │
│  │ homemade food, and a garden the        │  │
│  │ children help to grow.                 │  │
│  └────────────────────────────────────────┘  │
│  212 of 300 characters                       │  live count
│  ┌────────────────────────────────────────┐  │
│  │ ✎ You changed this.        [ Compare ] │  │
│  │ She wrote:                             │  │
│  │ "ofsted registered childminder         │  │
│  │  blackheath 3 spaces from sept…"       │  │
│  │ [ Use her version ]                    │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Website                                     │
│  ┌────────────────────────────────────────┐  │
│  │ https://littleacorns.co.uk             │  │
│  └────────────────────────────────────────┘  │
│  She wrote: littleacorns.co.uk               │
│  [ Open it ↗ ]                               │
│                                              │
│  Instagram                                   │
│  ┌────────────────────────────────────────┐  │
│  │ @littleacornsse3                       │  │
│  └────────────────────────────────────────┘  │
│  [ Open it ↗ ]                               │
│                                              │
│  Public enquiry contact *                    │
│  ┌────────────────────────────────────────┐  │
│  │ hello@littleacorns.co.uk               │  │
│  └────────────────────────────────────────┘  │
│  ✓ Different from her signup email — good.   │  green confirm line
│  This is the only contact that goes public.  │
│                                              │
│  ══ Member details ════════════════════════  │  <h2>
│  ┌────────────────────────────────────────┐  │
│  │ 🔒 PRIVATE — never published.          │  │  dashed border,
│  │ This is the admin panel, so you can    │  │  distinct tint
│  │ see it here. It is not on the public   │  │
│  │ site and no public page can reach it.  │  │
│  │────────────────────────────────────────│  │
│  │ First name      Hannah                 │  │
│  │ Signup email    hannah.w@gmail.com     │  │
│  │ Postcode        SE3 9XY                │  │
│  │ Group           Business Mums          │  │
│  │ Submitted       6 Aug 2026, 09:12      │  │
│  │ Resubmitted     never                  │  │
│  │────────────────────────────────────────│  │
│  │ Consent to publish these fields        │  │
│  │   Given 6 Aug 2026, 09:12 UTC          │  │
│  │   Wording version 1.0                  │  │
│  │   [ Read what she agreed to ]          │  │
│  │ Consent to hold her data   Given       │  │
│  │ Newsletter                 Yes         │  │
│  │────────────────────────────────────────│  │
│  │ ▸ Her survey answers (11)              │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ══ History ═══════════════════════════════  │  <h2>, NFR-013
│  • Submitted by the member, via /join        │
│    6 Aug 2026, 09:12                         │
│  • Description and business name edited      │
│    by Ash Nolan · 18 Aug 2026, 14:05         │
│                                              │
├──────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐ │  sticky bottom bar
│ │        Save and publish                  │ │  #c9107f, 44px
│ └──────────────────────────────────────────┘ │
│ ┌────────────┐┌────────────┐┌─────────────┐  │
│ │ Save only  ││    Hold    ││   Reject    │  │
│ └────────────┘└────────────┘└─────────────┘  │
│ Unsaved changes to 2 fields                  │
└──────────────────────────────────────────────┘
```

**Published-listing variant** — the sticky bar becomes:

```
│ ┌──────────────────────────────────────────┐ │
│ │           Save changes                   │ │
│ └──────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────┐ │
│ │           Take it down                   │ │  danger tone
│ └──────────────────────────────────────────┘ │
│ Saving keeps it live — editing isn't a       │  FR-016, said plainly
│ re-approval.                                 │
```

### Tablet / Desktop variations

**Only the differences:**

- **≥ 768px (`md:`)** — two columns. Left (~58%): the public fields. Right (~42%): a sticky column holding the info panel, **Member details**, and **History**. The "She wrote…" original values move out of the stacked panels and into a right-hand gutter **aligned to each field**, so the edit and the original sit on one line and comparison needs no scrolling — the FR-016 "distinguishable" requirement becomes visual as well as textual. The action bar leaves the bottom edge and becomes a sticky header strip under the `h1`.
- **≥ 1024px** — the description gets a genuine side-by-side compare: submitted on the left, edited on the right, changed runs highlighted (`bg-amber-100`, plus `<ins>`/`<del>` so the difference is not colour-only). The `[ Compare ]` toggle that exists at 320px is redundant here and is not rendered.
- **≥ 1440px** — content caps at `max-w-6xl`; no further stretch.
- The private panel keeps its dashed border and label at every width. It is never merged into the public-fields column, at any breakpoint, so "which of these is public?" is answerable at a glance from across the room.

### Component Hierarchy

1. `AdminLayout` (extension per §0.8).
2. `ListingReview` **NEW** — page component. Follows the `LondonEventForm.jsx` admin-form idiom: a module-level `emptyForm`, a small number of state atoms, `|| ''` hydration, and a single `set(field, value)` updater.
   1. `BackToQueueLink` **NEW** — restores queue state (P4). A `Link`, not `navigate(-1)`, so a direct arrival still works.
   2. Page header — `<h1>`, `StatusPill`, `WaitingChip`, attribution line (§0.5).
   3. `PublishBoundaryNotice` **NEW** — "Nothing here is public until you press Publish" (or, when live, "This is on the public site right now").
   4. `SectionHeading` (`align="left"`) × 3 — "What goes on the website", "Member details", "History". **Reused as-is**; it is an `<h2>`, which is correct here.
   5. `PublicFieldGroup` **NEW**, one per public field:
      1. `<label htmlFor>` + input/textarea/select with matching `id` — **the site has no `htmlFor`/`id` pairing anywhere today and this is where it starts** (NFR-008).
      2. `CharacterCounter` **NEW** on the description ("212 of 300 characters"), announced politely at 90% and at the limit.
      3. `OriginalValuePanel` **NEW** — the FR-016 mechanism. Three presentations: *unchanged* (grey, "She chose: …"), *edited* (amber, "✎ You changed this. She wrote: …" + **Use her version**), *empty from the member* (grey italic, "She left this blank").
      4. `FieldError` **NEW** — `role="alert"`, wired by `aria-describedby`.
   6. `PublicContactField` **NEW** — a `PublicFieldGroup` plus the signup-email comparison line (green confirm or amber warning).
   7. `PrivateMemberPanel` **NEW** — shared with M-S1, in its fuller form: identity, consent records with version and UTC timestamp, a "Read what she agreed to" disclosure showing the exact stored consent text, and a collapsed disclosure over the 11 survey answers.
   8. `ModerationHistory` **NEW** — reverse-chronological `<ol>`; every entry carries actor + `<time datetime>` (NFR-013). Read-only, no edit or delete control.
   9. `DecisionBar` **NEW** (sticky) — `Button` × 3–4 plus a dirty-state line. `Save and publish` when pending-and-dirty; `Publish` when pending-and-clean; `Save changes` + `Take it down` when live.
   10. `NotificationStatus` **NEW** — §N.
   11. `UnsavedChangesGuard` **NEW** — intercepts in-app navigation and `beforeunload`.
3. `ActionConfirmModal` **NEW** (M-S3).

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Listing loaded, form pristine | All fields hydrated with the current public values; every `OriginalValuePanel` in its *unchanged* presentation; dirty line absent; primary action is **Publish** (pending) or **Save changes** (live) | `<h1>`; three `<h2>` sections; every input has `htmlFor`/`id`; `aria-required` on the four required fields |
| **Default (dirty)** | Any field changed | Changed fields' panels switch to the amber *edited* presentation with **Use her version**; dirty line reads "Unsaved changes to 2 fields"; primary becomes **Save and publish** | The dirty line lives in the `role="status"` region and is announced on transition to dirty, once — not per keystroke |
| **Loading** | Fetching the listing | Full-panel spinner + "Loading this listing…". Nothing else renders — unlike the queue, there is no prior content to preserve, so a replacing spinner is correct here | `aria-busy="true"` on `<main>`; text inside `role="status"` |
| **Empty** | **N/A** — this screen always concerns exactly one listing. The nearest cases are handled as errors: a bad or deleted id renders the *Not found* error state; an individual blank field renders "She left this blank" inside its `OriginalValuePanel`, which is a field presentation, not a screen state. | — | — |
| **Error (not found / deleted)** | 404 for `:id` | "We can't find that listing. It may have been removed. [ Back to the queue ]" | `role="alert"`; focus to **Back to the queue** |
| **Error (validation)** | Save attempted with a required field empty, or the description over its limit | Inline message under each offending field ("Give the listing a business name."; "This is 340 characters — the limit is 300. Trim 40."). Focus moves to the **first** offending field. A summary above the action bar: "2 things need fixing before this can be saved." | `aria-invalid="true"` + `aria-describedby` → the message; message is `role="alert"`; the summary is a `role="alert"` list of in-page links to each field |
| **Error (save failed)** | Write rejects | Single inline red banner above the action bar — one banner, matching the `LondonEventForm.jsx` convention: "That didn't save. Your changes are still on screen — try again." **Nothing is cleared.** | `role="alert"`; focus to **Try again** |
| **Error (conflict)** | Another admin edited or decided while this was open | Banner: "Priya changed this listing while you had it open. [ See what changed ] [ Reload and lose my edits ]" | `role="alert"`; the edits stay on screen until Ash chooses |
| **Error (email failed after decision)** | FR-021 send fails | Decision stands; `NotificationStatus` shows failure with **Try again** / **Copy the message** (§N, NFR-011) | `role="alert"` on the notification node only; the status pill is a separate node and still reads **Live** |
| **Success (saved, no status change)** | Save resolves | `role="status"`: "Saved." Pill unchanged. History gains "Description and business name edited by Ash Nolan · 18 Aug 2026, 14:05". For a live listing an extra line: "Still live — editing isn't a re-approval." (FR-016) | `role="status" aria-live="polite"`; focus stays on the pressed button, which returns from `busy` to its resting label |
| **Success (published)** | Publish resolves | Pill → **Live**. Sticky bar reshapes to the published variant. Banner: "Published. It's on the public directory now. [ View it ↗ ]" + `NotificationStatus`. History gains the attributed entry | `role="status"`; focus to **View it ↗** |
| **Success (held / rejected / taken down)** | Decision resolves via M-S3 | Pill updates; the recorded reason renders under it in words; banner "Not published — the public contact is a personal address. Hannah has been emailed."; **Move back to pending** available | `role="status"`; focus to **Move back to pending** |
| **Disabled** | (a) Save/Publish while a request is in flight; (b) **Save changes** while the form is pristine; (c) **Publish** with consent-to-publish absent; (d) all public fields while the listing is being taken down | (a) `busy`, label "Saving…" / "Publishing…". (b) `aria-disabled`, with a hint "Nothing to save yet." (c) `aria-disabled` + "She didn't consent to being published, so this can't go live." (d) inputs `readOnly` with a notice, not `disabled`, so their values stay selectable and announced | `aria-disabled="true"` (focusable, explanation reachable) for (b) and (c); `aria-describedby` to the hint; `aria-busy` for (a); `readOnly` + `aria-readonly` for (d) |

### Interactions & Animations

| Interaction | Behavior | Timing | `prefers-reduced-motion` |
|---|---|---|---|
| Typing in a public field | `OriginalValuePanel` flips to *edited* on the first keystroke that differs from the submitted value, and back to *unchanged* if the value is restored exactly | 120ms tint change | Instant tint change, no fade |
| Character counter | Updates per keystroke; turns amber at 90%, red at 100% | live | Identical |
| **Use her version** | Restores that field to the submitted value; panel returns to *unchanged*; focus returns to the field with the caret at the end | 120ms | Instant |
| **Compare** (description, <1024px) | Expands an inline before/after with `<ins>`/`<del>` and an amber highlight | 150ms height | Instant |
| Expand **Her survey answers** | Grows downward | 150ms | Instant |
| Sticky action bar | Fixed to the bottom below `md:`; gains a top shadow only once the page has scrolled | 100ms shadow fade | Shadow appears instantly |
| Press **Save and publish** | Saves and publishes in one request; button `busy`; on success the bar reshapes | request-bound; 180ms reshape | Instant reshape |
| Press **Reject** / **Hold** / **Take it down** | Opens M-S3 | 150ms fade + 4px rise | Instant |
| Leaving with unsaved edits | `UnsavedChangesGuard` opens `ActionConfirmModal` (tone `neutral`): "Leave without saving? Your edits to 2 fields will be lost." — confirm label **"Leave without saving"**, cancel **"Stay here"** | 150ms | Instant |
| Focus on any input | 2px `#fc16a0` ring, 2px offset, plus a 2px border-colour shift | instant | Identical |

### Accessibility Annotations

- **Headings:** `<h1>` = the business name (it is what the page is about, and it makes browser history and screen-reader page titles useful). `<h2>` × 3 via `SectionHeading` (`align="left"`): "What goes on the website", "Member details", "History". Field labels are `<label>`, never headings.
- **Landmarks:** `<main>` from `AdminLayout`. Public fields are in a `<form>` with `aria-labelledby` pointing at its `<h2>`. Member details is `<section aria-labelledby>`. History is `<section aria-labelledby>` containing an `<ol>`. The sticky action bar is inside the `<form>` so Enter in a text input submits nothing destructive — the form's default submit is **Save only**, never **Publish**.
- **Focus management:** on load focus is at the document start. **Back to queue** is the first tab stop. Validation failure → first offending field. Save success → focus held on the pressed button (it does not unmount). Publish success → **View it ↗**. Dialog open → dialog heading; dialog close → the invoking button. **Use her version** → returns focus to the field it restored.
- **Labelling (this is the NFR-008 line in the sand):** every input has `<label htmlFor="x">` + `id="x"`. Help text and the original-value panel are joined by `aria-describedby`, so a screen reader hears, in order: the label, the current value, the character limit, and "You changed this; she wrote: …". This is the single most important accessibility change in the section, because the site's current pattern — a wrapping `<label>` with no association — is what NFR-008 explicitly forbids inheriting.
- **Screen-reader notes:** the private panel's first child is the text "Private — never published. This is the admin panel, so you can see it here." — announced before any personal data, so context always precedes content. Consent records are a `<dl>`; the timestamp is a `<time datetime>` carrying the UTC instant. History is an `<ol>` in reverse-chronological order, with each entry a single sentence including actor and time. `<ins>`/`<del>` carry the diff semantically so the highlight colour is never the only signal.
- **Keyboard operation:** fully operable. The category `<select>` is a native select (no custom combobox). The compare toggle and every disclosure are `<button aria-expanded aria-controls>`. No drag interaction exists on this screen. Escape inside a dialog cancels; Escape outside a dialog does nothing (it must not discard edits).
- **Targets & reflow:** inputs are `rounded-xl` per the radius grammar, minimum 44px tall. Sticky bar buttons are 44px with 8px gaps. At 320px the bar takes two rows rather than shrinking the targets. Nothing scrolls horizontally; the description textarea wraps and grows.
- **Contrast:** the amber *edited* panel is `bg-amber-50` with `text-amber-900` (≈8.9:1) — the amber token `#f59e0b` is 2.15:1 on white and is used **only** as a 4px rule and an icon fill, never for text. The green confirm line is `text-green-800` on `bg-green-50`. **Publish** is white on `#c9107f`.

---

## Screen M-S3 — Decision dialog (`ActionConfirmModal`)

**Purpose:** Take a decision that needs a recorded reason — **Hold**, **Reject**, **Take down**, and category **Retire**/**Delete** — in one further click, while showing exactly what the member will be told.

**Entry from:** M-S1 row actions · M-S2 sticky bar · M-S4 category actions.
**Exits to:** the invoking screen, decided or cancelled. It never navigates.

### The `ConfirmModal` problem, and the extension

The existing `src/components/ui/ConfirmModal.jsx` is used in six places and cannot serve this section:

1. **The confirm button's label is the hard-coded string `Delete`.** "Delete" is wrong for Reject, Hold, Take down and Retire — and actively misleading, since none of them delete anything. `LondonEventsManager.jsx:899-905` already works around this by writing `title={tab === 'pending' ? 'Reject Events' : 'Delete Events'}` while the button underneath still says **Delete**. The title says reject; the button says delete; they are the same action. That is a real defect in production today.
2. **The confirm fill is the hard-coded `bg-red-500` with white text — 3.76:1, which fails WCAG AA** in every existing usage.
3. **It is not a dialog.** No `role="dialog"`, no `aria-modal`, no focus trap, no Escape, no focus return, no accessible name. It is a `position: fixed` div with a click-handling backdrop `<div>`.
4. **The buttons are `px-4 py-2 text-sm`** — roughly 34px tall, below the 44px minimum.
5. **There is no busy state**, so a slow confirm can be double-fired.

**`ActionConfirmModal` (NEW)** — a superset, with `ConfirmModal` re-implemented on top of it so the six existing call sites keep working unchanged:

| Prop | Type | Purpose |
|---|---|---|
| `title` | string | Dialog heading. Wired as `aria-labelledby`. |
| `message` | node | Body. Wired as `aria-describedby`. |
| `confirmLabel` | string | **The fix.** Defaults to `"Delete"` for back-compatibility; every new call site passes its own verb. |
| `tone` | `'danger' \| 'primary' \| 'neutral'` | `danger` = white on `#b91c1c` (6.2:1) — replaces `bg-red-500`. `primary` = white on `#c9107f` (5.43:1). `neutral` = `#1a1a2e` on white with a grey border. |
| `cancelLabel` | string | Defaults to `"Cancel"`. |
| `busy` | boolean | Disables both buttons, shows the spinner in the confirm, sets `aria-busy`, and disables backdrop dismissal — the pattern `LondonEventsManager.jsx:909` already uses ad hoc for its email modal. |
| `choices` | array | **The reason chips.** When present, each chip *is* a confirm button and the footer renders **Cancel** only. Each chip's accessible name is the whole action ("Reject: not enough detail to publish"). |
| `children` | node | Slot for the optional note field, the "Email the member" checkbox, and the email preview. |
| `onConfirm(choiceKey?, note?)` | fn | Receives the chosen reason key and any note. |
| `onCancel` | fn | Also fired by Escape and by backdrop click when not `busy`. |

Accessibility contract, all of it new: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`, focus moved to the heading on open, focus **trapped** within the dialog, Escape cancels, focus returned to the invoking element on close, backdrop is `aria-hidden` and inert, body scroll locked, and every control ≥44px.

### Reason vocabularies (module-scope maps, per §0.2)

**Reject** — each key maps to a chip label *and* the sentence used in the member email:

| Key | Chip label (Ash sees) | Member email sentence |
|---|---|---|
| `incomplete` | "Not enough detail to publish" | "there wasn't quite enough detail yet for local parents to know what you offer" |
| `contact_unsafe` | "The public contact is a personal address" | "the contact you gave looks like your personal email — we'd rather not publish that without checking with you first" |
| `not_a_business` | "This isn't a business listing" | "the directory is for local businesses and services, and this one didn't quite fit" |
| `duplicate` | "Duplicate of a listing we already have" | "we already have a listing for this business" |
| `not_appropriate` | "Not a fit for the GPC directory" | "this one isn't a fit for our directory" |
| `spam` | "Spam" | *(no email sent; the checkbox defaults to unticked)* |
| `other` | "Something else — write the reason" | the admin's own words, sent verbatim |

**Hold:** `awaiting_member` "Waiting to hear back from her" · `second_opinion` "Want a second opinion" · `needs_editing` "Needs editing before it goes live" · `other`. Hold is admin-internal: the "Email the member" checkbox is present and defaults **unticked**. *(Whether a held member should ever hear anything is flagged in Gaps found.)*

**Take down:** `member_request` "The member asked us to remove it" · `complaint` "Someone complained about it" · `closed` "The business has closed" · `details_wrong` "The details are wrong" · `policy` "It breaks our directory rules" · `other`.

**Category:** `retire` and `delete` — see M-S4.

### Layout Wireframe (mobile-first, 320px)

```
        ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
        ░┌────────────────────────────────┐░
        ░│ Don't publish this listing? [×]│░   h2, dialog label
        ░│ Little Acorns Childminding     │░
        ░│                                │░
        ░│ Nothing goes public. Pick a    │░
        ░│ reason — that's the button.    │░
        ░│ We'll email her a short, kind  │░
        ░│ note based on it.              │░
        ░│                                │░
        ░│ ┌────────────────────────────┐ │░
        ░│ │ Not enough detail to       │ │░   each chip = confirm
        ░│ │ publish                    │ │░   ≥44px, full width
        ░│ ├────────────────────────────┤ │░
        ░│ │ The public contact is a    │ │░
        ░│ │ personal address           │ │░
        ░│ ├────────────────────────────┤ │░
        ░│ │ This isn't a business      │ │░
        ░│ │ listing                    │ │░
        ░│ ├────────────────────────────┤ │░
        ░│ │ Duplicate of a listing we  │ │░
        ░│ │ already have               │ │░
        ░│ ├────────────────────────────┤ │░
        ░│ │ Not a fit for the GPC      │ │░
        ░│ │ directory                  │ │░
        ░│ ├────────────────────────────┤ │░
        ░│ │ Spam                       │ │░
        ░│ ├────────────────────────────┤ │░
        ░│ │ Something else — write     │ │░   does NOT commit
        ░│ │ the reason                 │ │░
        ░│ └────────────────────────────┘ │░
        ░│                                │░
        ░│ Private note (optional)        │░   label htmlFor/id
        ░│ ┌────────────────────────────┐ │░
        ░│ │                            │ │░
        ░│ └────────────────────────────┘ │░
        ░│ Only admins ever see this.     │░
        ░│                                │░
        ░│ ☑ Email Hannah about this      │░   44px row
        ░│   [ Preview the email ]        │░
        ░│                                │░
        ░│      ┌──────────────────────┐  │░
        ░│      │       Cancel         │  │░
        ░│      └──────────────────────┘  │░
        ░└────────────────────────────────┘░
        ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

**"Something else" chosen** — the chip stays pressed (`aria-pressed="true"`), a required textarea appears below it, and a real confirm button joins the footer:

```
        ░│ ┌────────────────────────────┐ │░
        ░│ │ ▣ Something else — write   │ │░
        ░│ │   the reason               │ │░
        ░│ └────────────────────────────┘ │░
        ░│ Your reason *                  │░
        ░│ ┌────────────────────────────┐ │░
        ░│ │                            │ │░
        ░│ └────────────────────────────┘ │░
        ░│ She'll be sent these words.    │░
        ░│ ┌──────────┐ ┌───────────────┐ │░
        ░│ │  Cancel  │ │ Don't publish │ │░   tone: danger, #b91c1c
        ░│ └──────────┘ └───────────────┘ │░
```

**Email preview** (expands inline; the dialog scrolls internally, the page behind does not):

```
        ░│ ── What Hannah will get ──────  │░
        ░│ Subject: About your GPC          │░
        ░│ directory listing                │░
        ░│                                  │░
        ░│ Hi Hannah,                       │░
        ░│ Thanks for asking to be listed   │░
        ░│ in the GPC member directory.     │░
        ░│ We haven't published your        │░
        ░│ listing yet: there wasn't quite  │░
        ░│ enough detail yet for local      │░
        ░│ parents to know what you offer.  │░
        ░│                                  │░
        ░│ You're very welcome to send it   │░
        ░│ again with a bit more —          │░
        ░│ greenwichparents.co.uk/join      │░
        ░│                                  │░
        ░│ You're still a GPC member and    │░
        ░│ nothing else changes.            │░
        ░│                                  │░
        ░│ Greenwich Parents & Carers CIC   │░
        ░│ 16387545. Data controller:       │░
        ░│ Aster Thackery. How we handle    │░
        ░│ your data: /privacy              │░   FR-021 requirement
        ░│ [ Collapse ]                     │░
```

### Tablet / Desktop variations

- **≥ 768px** — dialog caps at `max-w-lg`. Reason chips become a two-column grid (chips are short; two columns removes most of the internal scrolling). The footer is right-aligned, matching the existing `ConfirmModal` footer.
- **≥ 1024px** — `max-w-2xl` when the email preview is expanded, so preview and chips sit side by side and Ash can read the message without collapsing the choices.
- The dialog never becomes a full-screen sheet at any width; at 320px it is `mx-4` with internal scroll, so the backdrop stays visible and the modal reads as modal.

### Component Hierarchy

1. `ActionConfirmModal` **NEW** — portalled to `document.body`, focus-trapped.
   1. `<h2 id>` — the dialog's accessible name.
   2. Subject line — the listing or category the action concerns.
   3. `<p id>` — the consequence, in plain words. Wired as `aria-describedby`.
   4. `ReasonChoiceList` **NEW** — `<ul>` of `<button>`s; each chip's accessible name is the full action.
   5. `<label htmlFor>` + `<textarea id>` — the private note. Always labelled.
   6. `EmailPreview` **NEW** — `<button aria-expanded aria-controls>` over the rendered member email, built from the chosen reason. Read-only.
   7. "Email the member" — `<input type="checkbox" id>` + `<label htmlFor>`, 44px row.
   8. Footer — `Button` `secondary` (Cancel) and, only in the `other` path, `Button` in the requested `tone`.
2. `ConfirmModal` — **re-implemented as a thin wrapper** over `ActionConfirmModal` with `confirmLabel="Delete"`, `tone="danger"`, so the six existing call sites gain the dialog semantics and the AA-passing red without any change at the call site.

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Dialog opens | Heading, subject, consequence, reason chips, note field, email checkbox, preview toggle, Cancel | `role="dialog" aria-modal="true"`, `aria-labelledby` → heading, `aria-describedby` → consequence. Focus to the heading (`tabIndex={-1}`). Background inert |
| **Loading** | **N/A** — the dialog opens with everything it needs; reason vocabularies are module-scope constants, not fetched. The email preview is composed client-side from the chosen reason. | — | — |
| **Empty** | **N/A** — a dialog with no choices is never rendered. Every action that opens it has at least four reasons defined in code. | — | — |
| **Error (action failed)** | Confirm rejects | Dialog **stays open**. Inline banner above the footer: "That didn't save. Nothing has changed — try again." Chips return to enabled. The typed note is preserved | `role="alert"`; focus to the chip that was pressed |
| **Error (note required, empty)** | `other` chosen and confirm pressed with an empty textarea | "Write the reason so it's on the record." under the textarea; focus to the textarea | `aria-invalid="true"` + `aria-describedby`; message is `role="alert"` |
| **Success** | Confirm resolves | Dialog closes. The announcement is made by the **parent** screen's live region, not by the dialog, so it is not spoken into a closing container | Parent `role="status"`: "Little Acorns Childminding not published — not enough detail. Hannah has been emailed." Focus returns to the settled row's Undo |
| **Disabled** | `busy` (request in flight) | Every chip and both footer buttons disabled; the pressed chip shows the spinner and reads "Saving…"; backdrop dismissal off; Escape off | `aria-busy="true"` on the dialog; `disabled` on the controls — here the real `disabled` attribute is correct, because the condition is transient and needs no explanation |

### Interactions & Animations

| Interaction | Behavior | Timing | `prefers-reduced-motion` |
|---|---|---|---|
| Open | Backdrop fades to `bg-black/40`; panel fades + rises 4px | 150ms | Both instant, no transform |
| Close (Cancel / Escape / backdrop) | Reverse | 120ms | Instant |
| Hover/focus a reason chip | Border → `#c9107f`, background → `#c9107f`/5% | 120ms | Identical (colour only) |
| Press a reason chip (commit path) | That chip goes `busy` with a spinner; every other chip dims | request-bound | Spinner static; dimming instant |
| Press **"Something else"** | Chip becomes `aria-pressed="true"`; textarea appears; focus moves into it; footer gains the confirm button | 150ms height | Instant |
| Toggle **Preview the email** | Expands inline; dialog scrolls internally | 150ms height | Instant |
| Escape | Cancels — unless `busy`, when it is ignored so an in-flight request is not orphaned (the guard `LondonEventsManager.jsx:909` already applies to backdrop clicks) | instant | Identical |
| Focus trap | Tab from the last control returns to the first; Shift+Tab from the first goes to the last | instant | Identical |

### Accessibility Annotations

- **Heading level:** `<h2>` inside the dialog. The dialog does not contribute to the page outline; its heading exists to name the dialog.
- **Landmark role:** `role="dialog"` with `aria-modal="true"`. The rest of the document is `inert` / `aria-hidden` while it is open. This is entirely new — no modal on the site is a real dialog today.
- **Focus management:** focus to the heading on open; trapped; returned on close to the invoking element, or to the settled row's Undo when the invoker has been replaced. Body scroll is locked and restored to the same offset.
- **Screen-reader notes:** the consequence sentence is the `aria-describedby` target, so opening the dialog announces the heading *and* what will happen ("Don't publish this listing? Nothing goes public. Pick a reason — that's the button."). Each chip's accessible name is the whole action, not the fragment, so a chip heard out of context is still unambiguous. The email preview is inside a region labelled "What Hannah will get" and is read-only text, not a form. Success is announced by the parent screen so it is not spoken into a closing container.
- **Keyboard operation:** Tab/Shift+Tab cycle within the trap; Enter or Space fires a chip; Escape cancels except while `busy`. No control needs a pointer.
- **Targets & reflow:** every chip is a full-width ≥44px block at 320px. The dialog scrolls internally rather than pushing the page; the page never scrolls horizontally.
- **Contrast:** danger confirm is white on `#b91c1c` (6.2:1) — replacing `bg-red-500`'s 3.76:1. Primary confirm is white on `#c9107f`. Chip text is `#1a1a2e` on white; chip borders are `#e5e7eb` at rest and `#c9107f` on hover/focus (3:1+ as non-text UI).

---

## Screen M-S4 — Category management (FR-017)

**Purpose:** Let Ash add, rename, reorder and retire the directory's category taxonomy, with the guarantee that a category in use **cannot be deleted**, only retired (FR-017), and with the consequences of each action stated before she takes it.

**Entry from:** M-S1 header link "Categories →" · M-S2 "Manage categories →" beside the category field · direct URL.
**Exits to:** M-S1 · M-S2 (back, with the newly added category selectable without a reload).

### Layout Wireframe (mobile-first, 320px)

```
┌──────────────────────────────────────────────┐
│ ☰   Directory                    3    Ash ▾  │
├──────────────────────────────────────────────┤
│  ← Back to listings                          │
│                                              │
│  Categories                             [h1] │
│  9 in use on the form · 2 retired            │
│  Used by 24 published listings               │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ This order is the order members see    │  │
│  │ on the form, and the order visitors    │  │
│  │ see in the directory filter.           │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │        + Add a category                │  │  44px
│  └────────────────────────────────────────┘  │
│                                              │
│  ══ On the form ═══════════════════════════  │  <h2>
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ 1.  Childcare & nannies                │  │
│  │     12 listings                        │  │
│  │     ┌────┐┌────┐┌────────┐┌─────────┐  │  │
│  │     │ ↑  ││ ↓  ││ Rename ││ Retire  │  │  │  44px each
│  │     └────┘└────┘└────────┘└─────────┘  │  │
│  │     ┌──────────────────────────────┐   │  │
│  │     │ Delete                       │   │  │  aria-disabled
│  │     └──────────────────────────────┘   │  │
│  │     12 listings use this, so it can't  │  │  always visible,
│  │     be deleted. Retire it instead.     │  │  not a tooltip
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ 2.  Photography                        │  │
│  │     0 listings                         │  │
│  │     ┌────┐┌────┐┌────────┐┌─────────┐  │  │
│  │     │ ↑  ││ ↓  ││ Rename ││ Retire  │  │  │
│  │     └────┘└────┘└────────┘└─────────┘  │  │
│  │     ┌──────────────────────────────┐   │  │
│  │     │ Delete                       │   │  │  ENABLED (0 listings)
│  │     └──────────────────────────────┘   │  │
│  │     Nothing uses this yet, so it can   │  │
│  │     be deleted outright.               │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ── in rename mode ──────────────────────────│
│  ┌────────────────────────────────────────┐  │
│  │ 3.  Name                               │  │
│  │     ┌──────────────────────────────┐   │  │
│  │     │ Sleep & feeding support      │   │  │  label htmlFor/id
│  │     └──────────────────────────────┘   │  │
│  │     ┌──────────┐ ┌───────────────┐     │  │
│  │     │  Cancel  │ │  Save name    │     │  │
│  │     └──────────┘ └───────────────┘     │  │
│  │     4 published listings will show the │  │
│  │     new name straight away. They don't │  │
│  │     need approving again.              │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ══ Retired ═══════════════════════════════  │  <h2>
│  Not offered on the form any more. Listings  │
│  that already use them stay published and    │
│  stay filterable.                            │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Doula & birth support     [Retired]   │  │  greyed card
│  │  3 listings                            │  │
│  │  Retired by Ash Nolan · 2 Aug 2026      │  │  NFR-013
│  │  ┌──────────────────────────────────┐  │  │
│  │  │  Put it back on the form         │  │  │
│  │  └──────────────────────────────────┘  │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**"Add a category", expanded in place:**

```
│  ┌────────────────────────────────────────┐  │
│  │  New category                          │  │
│  │  Name *                                │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │ Tutoring                         │  │  │
│  │  └──────────────────────────────────┘  │  │
│  │  Goes to the bottom of the list. Drag  │  │
│  │  or use ↑ to move it.                  │  │
│  │  ┌──────────┐ ┌───────────────────┐    │  │
│  │  │  Cancel  │ │  Add it           │    │  │
│  │  └──────────┘ └───────────────────┘    │  │
│  └────────────────────────────────────────┘  │
```

**What she sees when she tries to delete a category in use** — she can reach and activate the control, and gets a real answer rather than a dead button:

```
│  ┌────────────────────────────────────────┐  │
│  │ ⚠ "Childcare & nannies" can't be       │  │  role="alert"
│  │   deleted — 12 published listings use  │  │
│  │   it. Retiring it takes it off the     │  │
│  │   form, and those 12 listings stay     │  │
│  │   published and stay filterable.       │  │
│  │   ┌────────────────────────────────┐   │  │
│  │   │ Retire it instead              │   │  │
│  │   └────────────────────────────────┘   │  │
│  └────────────────────────────────────────┘  │
```

### Tablet / Desktop variations

- **≥ 768px** — each category is one row: order number, drag handle, name, listing count, then the actions right-aligned on the same line. The always-visible "can't be deleted" explanation collapses into an inline hint beside the disabled Delete; it remains **text on the page**, not a tooltip, because a hover-only explanation is unreachable by keyboard and by touch. Pointer drag-and-drop reordering is enabled here **in addition to** the ↑/↓ buttons, which remain at every width — drag is never the only way to reorder (WCAG 2.5.7, and the same "no pointer-only control" rule FR-001 sets for the public form).
- **≥ 1024px** — a right-hand panel shows a live preview of the category `<select>` exactly as it appears on `/join`, so the order is verifiable without leaving the screen. Also shows "Used by N of 24 published listings" per row as a small bar.
- **≥ 1440px** — content caps at `max-w-4xl`.

### Component Hierarchy

1. `AdminLayout` (extension per §0.8).
2. `CategoryManager` **NEW** — page component. State: `categories`, `loading`, `error`, `editingId`, `adding`, `pendingOrder`.
   1. `<h1>` "Categories" + the counts line.
   2. `OrderMeaningNotice` **NEW** — "This order is the order members see on the form…".
   3. `AddCategoryPanel` **NEW** — collapsed to a 44px button; expands in place with a labelled input (`htmlFor`/`id`).
   4. `SectionHeading` (`align="left"`) × 2 — "On the form", "Retired". **Reused as-is.**
   5. `CategoryRow` **NEW**, composing `Card`:
      1. Order number + drag handle (`≥md` only).
      2. Name — or, in rename mode, a labelled input with **Save name** / **Cancel** and the consequence line.
      3. `ListingCountChip` **NEW** — "12 listings", linking to M-S1 Live tab pre-filtered to that category.
      4. Actions: `Button` × 5 — ↑, ↓, Rename, Retire, Delete.
      5. `DeleteBlockedExplanation` **NEW** — always-rendered text when `count > 0`.
   6. `RetiredCategoryRow` **NEW** — greyed `CategoryRow` variant with the retirement attribution line (§0.5) and **Put it back on the form**.
   7. `ActionConfirmModal` **NEW** (M-S3) for Retire and for Delete.
   8. `CategoryLiveRegion` **NEW** — `role="status"` for reorder, rename and add announcements.

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | ≥1 category loaded | Counts line, order notice, Add button, "On the form" list in order, "Retired" list below | `<h1>`; two `<h2>`; each list is `<ol>` so the order is conveyed structurally, not only by the printed numeral |
| **Loading** | Fetching | Spinner + "Loading categories…". No prior content to preserve, so a replacing spinner is correct | `aria-busy="true"` on `<main>`; text in `role="status"` |
| **Empty** | No categories at all | "There are no categories yet. Members can't pick one until you add at least one — and until then, the category question on the form is skipped rather than blocking them. [ + Add the first category ]" (the addendum's FR-003 overflow requires an empty taxonomy not to block submission) | `role="status"`; focus **not** moved — she is reading, not recovering |
| **Empty (no retired)** | No retired categories | The "Retired" section is not rendered at all. There is nothing to explain and an empty heading is noise | — |
| **Error (load failed)** | Fetch rejects | "We couldn't load the categories. [ Try again ]" | `role="alert"`; focus to **Try again** |
| **Error (duplicate name)** | Add or rename to an existing name (case-insensitive) | Under the input: "There's already a category called 'Photography'." Save stays enabled — she may be about to change it | `aria-invalid="true"` + `aria-describedby`; `role="alert"` |
| **Error (empty name)** | Save with an empty input | "Give the category a name." | Same |
| **Error (delete blocked)** | **Delete** activated on a category with `count > 0` | `role="alert"` panel replacing the hint: "'Childcare & nannies' can't be deleted — 12 published listings use it. Retiring it takes it off the form, and those 12 listings stay published and stay filterable." + **Retire it instead** | `role="alert"`; focus to **Retire it instead**, so the alternative is one keystroke away rather than something she must hunt for |
| **Error (save failed)** | Any write rejects | Inline banner on that row: "That didn't save — nothing has changed. [ Try again ]". A failed reorder snaps the row back to its previous position | `role="alert"` scoped to the row |
| **Success (added)** | Add resolves | New row appended to "On the form"; `role="status"`: "Added 'Tutoring'. It's now the 10th choice on the form." Focus to the new row's **↑** | `role="status" aria-live="polite"` |
| **Success (renamed)** | Rename resolves | Row exits rename mode; `role="status"`: "Renamed to 'Sleep & feeding support'. 4 published listings show the new name straight away — they don't need approving again." (FR-017) | `role="status"` |
| **Success (reordered)** | ↑/↓ or drop resolves | `role="status"`: "Moved 'Wellbeing' to position 3 of 9." Focus **stays on the button that moved it**, which has travelled with the row — so repeated presses keep working without re-finding the control | `role="status"`; focus preserved through the DOM move |
| **Success (retired)** | Retire resolves | Row moves to "Retired" with its attribution line; `role="status"`: "'Doula & birth support' retired. It's off the form. Its 3 listings stay published and stay filterable." | `role="status"` |
| **Success (deleted)** | Delete resolves (only possible at `count = 0`) | Row removed; `role="status"`: "Deleted 'Photography'. Nothing was using it." | `role="status"` |
| **Disabled** | (a) **↑** on the first row / **↓** on the last; (b) **Delete** with `count > 0`; (c) any control during a write; (d) **Retire** on an already-retired row (not rendered) | (a) `aria-disabled="true"`, dimmed, kept in place so the button grid does not reflow. (b) `aria-disabled="true"` with the always-visible explanation and, on activation, the `role="alert"` above. (c) `busy` on that row only. (d) not rendered; **Put it back on the form** in its place | `aria-disabled` rather than `disabled` for (a) and (b), so both stay focusable and their explanations are reachable — the site's "dimmed + disabled, never hidden" convention from `EventFilters.jsx` |

### Interactions & Animations

| Interaction | Behavior | Timing | `prefers-reduced-motion` |
|---|---|---|---|
| ↑ / ↓ | Row swaps with its neighbour; both slide; focus rides with the pressed button | 160ms | Instant swap, no slide |
| Pointer drag (≥md) | Handle grabs; other rows part to show the drop target; drop commits and announces | 160ms | No parting animation; a static insertion line marks the drop target |
| **Rename** | Row expands into edit mode; focus into the input with the current name selected | 150ms height | Instant |
| **Add a category** | Panel expands in place; focus into the input | 150ms | Instant |
| **Retire** | `ActionConfirmModal`, `tone: neutral`, confirm label **"Retire it"**: "Retire 'Doula & birth support'? It comes off the form so no new member can pick it. Its 3 published listings stay published and stay filterable." | 150ms | Instant |
| **Delete** (`count = 0`) | `ActionConfirmModal`, `tone: danger`, confirm label **"Delete it"**: "Delete 'Photography'? Nothing is using it, so nothing is affected. This one can't be undone." | 150ms | Instant |
| **Delete** (`count > 0`) | No dialog. The inline `role="alert"` above, with focus moved to **Retire it instead** | instant | Identical |
| Save name | Button `busy`; row collapses out of edit mode on success | request-bound | Instant collapse |
| Focus on any control | 2px `#fc16a0` ring, 2px offset | instant | Identical |

### Accessibility Annotations

- **Headings:** `<h1>` "Categories"; `<h2>` "On the form" and `<h2>` "Retired" via `SectionHeading` (`align="left"`). Category names are **not** headings — they are the content of list items, and promoting nine of them to headings would clutter the heading map for no navigational gain.
- **Landmarks:** `<main>` from `AdminLayout`. Each list is an `<ol>` inside a `<section aria-labelledby>` — ordered, because the order is the product behaviour.
- **Focus management:** reorder keeps focus on the pressed button as it moves with the row. Rename moves focus into the input and returns it to **Rename** on cancel or save. Add moves focus into the input and, on success, to the new row's **↑**. A blocked delete moves focus to **Retire it instead**. Dialog open/close follows the M-S3 contract.
- **Screen-reader notes:** each row's accessible name reads "3 of 9, Childcare & nannies, 12 listings". Reorder, rename, add, retire and delete each produce exactly one polite announcement naming the item and the consequence. The "can't be deleted" explanation is `aria-describedby` on the Delete button, so a keyboard user hears the reason on focus, before activating it — the alert on activation is a second chance, not the first. The retired section's intro sentence is inside the section and read on entry.
- **Keyboard operation:** every action is reachable without a pointer. Reordering is fully keyboard-operable via ↑/↓ buttons at **every** breakpoint; drag is an addition at `≥md`, never a replacement. Rename inputs commit on Enter and cancel on Escape.
- **Targets & reflow:** ↑ and ↓ are 44×44 icon buttons (`rounded-lg` per the radius grammar). At 320px the five actions wrap onto two rows rather than shrinking. No horizontal scroll.
- **Contrast:** retired rows are dimmed with `text-gray-600` on white (5.7:1) — never below AA. Dimming is paired with the word "Retired" in a pill, so opacity is not the only signal. The disabled Delete keeps `text-gray-600`, not `text-gray-400`, because its explanation must stay readable.

---

## N. Notification states (FR-021, FR-022) — `NotificationStatus` **NEW**

FR-021 tells members the outcome; FR-022 tells admins that work has arrived. Both are Should/Could, and **no transactional email path exists in the repo today** (the PRD's dependency table records Brevo as contact-creation only). So the *first* state below is not an error — it is the expected launch configuration, and the UI must make manual sending easy rather than pretending sends happen.

**NFR-011 is the governing rule: the decision and the send are two separate operations. A failed send never rolls back a decision, and the UI never lets the two look like one fact.** The status pill and the notification chip are always separate DOM nodes with separate ARIA roles, so a screen reader hears "Live" and "email failed" as two independent statements.

### Member notification (FR-021) — states as Ash sees them

| State | Trigger | Display (microcopy) | ARIA | Recovery |
|---|---|---|---|---|
| `disabled` | Email sending is not configured | "No email sent — email sending is off for now. [ Copy the message to send yourself ]" | plain text, no role — it is not news | Copy + paste into her own mail client. `mailto:` link pre-filled with subject and body |
| `queued` | Decision saved; send accepted | "Emailing Hannah now…" + spinner | inside `role="status"` | — |
| `sent` | Provider accepted | "✉ Emailed hello@littleacorns.co.uk at 14:07, 18 Aug 2026." | `role="status"` once, then plain text | — |
| `failed` | Send rejected | "We couldn't email her. **Your decision was saved** — the listing is live. [ Try again ] [ Copy the message ]" | `role="alert"` on this node only; the pill still reads **Live** | Retry, or copy and send manually |
| `retrying` | Retry in flight | "Trying again…" + spinner; both buttons `busy` | `aria-busy` | — |
| `given_up` | 3 failed attempts | "Still not sending after three tries. Copy the message and email her yourself — her address is hello@littleacorns.co.uk. [ Copy the message ]" | `role="alert"` | Manual send, then **Mark as sent by hand** — which records an attributed history entry so the record stays honest |
| `not_applicable` | Reject reason is `spam`, or "Email the member" was unticked | "No email sent — you chose not to." | plain text | **Email her after all** re-opens the preview |

**Queue-level rollup on M-S1**, so a failure is not hidden inside one card: an amber banner under the tab strip — **"2 members haven't been emailed about your decision. [ Show them ]"** — filtering the current tab to those rows. Silent at zero, following the duplicate-count convention at `LondonEventsManager.jsx:684-698`.

**Member email content (FR-021 requires the controller's identity and a privacy link in every one):**

- **Published.** Subject: *"Your GPC directory listing is live"*. Body: *"Hi Hannah, Your listing for Little Acorns Childminding is now live in the Greenwich Parents & Carers member directory. Have a look: [link]. Want to change something, or come off the list? Just reply to this email. — Greenwich Parents & Carers CIC 16387545. Data controller: Aster Thackery. How we handle your data: [/privacy]"*
- **Not published.** Subject: *"About your GPC directory listing"*. Body opens *"Hi Hannah, Thanks for asking to be listed in the GPC member directory."*, then the reason sentence from the M-S3 table, then *"You're very welcome to send it again — it takes two minutes: [/join]. You're still a GPC member and nothing else changes."*, then the same controller footer.
- Both are shown verbatim in the M-S3 **Preview the email** panel before Ash commits. She is never asked to send something she has not read.

### Admin notification (FR-022) — states

| State | Trigger | Display | ARIA | Recovery |
|---|---|---|---|---|
| `on` | Configured | Small line under the M-S1 header: "New listings are emailed to admin@greenwichparents.co.uk, batched hourly." | plain text | — |
| `off` | Not configured | "New listings aren't emailed to anyone yet — this queue is the only place they show up." | plain text | — |
| `batch_failed` | A batch send fails | Dashboard + M-S1 banner: "We couldn't send this morning's 'new listings' email. **The count below is still right** — nothing has been missed." | `role="alert"`, dismissible | Dismiss; the queue itself is unaffected. The alert is deliberately about the *email*, not the *work* |

Batched content (FR-022 requires no personal data beyond what is needed to act): subject *"3 new directory listings to review"*; body *"3 listings are waiting in the GPC admin queue. Review them here: [/admin/directory]. We don't put member details in these emails."* No names, no business names, no email addresses — the link is the payload.

### Pending count surfacing (FR-015: "the count of pending items is visible from the admin home")

| Surface | Presentation | Accessible name | Contrast |
|---|---|---|---|
| Sidebar **Directory** item | Pill at `ml-auto`, following the existing "Soon" pill's position in `AdminLayout.jsx:44-46` | "Directory, 3 pending" (visually-hidden suffix) | `bg-white text-[#2d1b4e]` on the `bg-dark` sidebar ≈ 15:1. **Not** white-on-`#fc16a0`, which is 3.64:1 and fails |
| Sidebar item, with overdue | Same pill, `bg-amber-200 text-amber-900` | "Directory, 3 pending, 1 waiting more than 5 working days" | ≈ 9:1 |
| Dashboard quick-link card | The count replaces the `ArrowRight`: a pill reading "3 waiting"; the card description becomes "3 listings are waiting for you to review." | "Directory, 3 listings waiting for review" | `bg-amber-50 text-amber-800` |
| M-S1 header | "3 waiting for review · 1 waiting more than 5 working days" | read as page content | `#1a1a2e` on white |
| Tab label | "Pending (3)", per `LondonEventsManager.jsx:673` | "Pending, 3 listings" | — |
| Browser tab title | `Directory (3) \| GPC Admin`, following the `document.title` idiom in every admin page's mount effect | — | — |

The count is fetched with the admin shell, not lazily after the dashboard paints — it is the only ambient signal that work exists, and a number that arrives two seconds late arrives after Ash has moved on. Zero is rendered as **no pill at all**, not "0": a badge showing zero is visual noise that trains her to ignore badges.

---

## Gaps found

Genuine gaps, recorded rather than silently decided. Each names the requirement it sits beside and what this draft did in the meantime.

1. **No requirement covers notifying a member when their listing is unpublished or admin-edited.** FR-021 covers publish and reject only. A member whose listing disappears — especially after a complaint they know nothing about — gets no word. This draft puts an explicit "Email the member about this" checkbox in the take-down dialog and proposes defaults (unticked for `member_request`, since they asked; ticked for `complaint`, `policy`, `details_wrong`), but the defaults and the email wording need a PM/controller decision. Same question for FR-016 edits: if Ash rewrites a member's description, is the member told?
2. **"Hold" has no defined member-facing consequence.** FR-015 names hold as a state with a recorded reason, but does not say whether the member hears anything or how long a hold may last. Ash needs to know what she is committing them to. This draft treats hold as admin-internal and silent, with the same ageing chips as pending, and flags it here.
3. **The FR-007 "resubmission against a published listing" state has no name in the PRD.** FR-007 says the change is "queued for admin review" while the published listing is not silently altered — that is a distinct state needing a name, a tab and a data shape. This draft proposes an **Updates** tab holding a proposed-changes record against an unchanged published listing. Needs confirmation before the architecture fixes the data model.
4. **The "waiting too long" period is undefined.** The addendum says "beyond a defined period". This draft derives 5 and 10 **working** days from the PRD's own success metric (median decision time ≤ 5 working days). Working-days arithmetic needs a decision on bank holidays; calendar days would be simpler and slightly stricter.
5. **The public listing URL shape is undefined**, but FR-021 requires the publish email to carry "a link to their live listing", and the settled row's "View on the site ↗" needs the same. Slug source (business name? id?) and collision behaviour on rename are open.
6. **`AdminLayout` is not responsive**, so the 320px rule cannot be met on any of these screens without changing the shared admin shell (fixed `w-64` sidebar in a `flex` row). This is a change to a file every admin page depends on and is larger than this feature. Needs an explicit decision on whether it lands in EPIC-005 or as separate work.
7. **`ConfirmModal`'s AA failure is pre-existing and wider than this feature.** `bg-red-500` with white text is 3.76:1 in six existing call sites, and no modal on the site is a real dialog. This draft re-implements `ConfirmModal` over `ActionConfirmModal` so all six inherit the fix — which is the right outcome, but it changes files outside this feature's scope and should be acknowledged rather than smuggled in.
8. **Admin display names are not guaranteed.** NFR-013 requires attribution, but `user_metadata.full_name` is optional, so the fallback is the account email — which means admins see each other's email addresses. Consistent with PRD assumption 3 (every admin is a full admin), but worth recording as a deliberate acceptance rather than an accident.
9. **Retired categories and the public directory filter.** FR-017 says retired categories are off the form but existing listings stay published and filterable — so the public filter must offer a retired category **while it still has listings**, and presumably drop it when it reaches zero. This draft assumes exactly that. The public directory section must be written to match, and the transition (last listing in a retired category is unpublished → the filter option disappears) needs confirming.
10. **Addendum Q3/Q4 are unresolved and this section depends on them.** The "public enquiry contact" is specified here as displayable text with a "same as her signup email" check that assumes it can be an email address. If it becomes a member's choice of email / phone / contact-page link (Q3), or is masked behind a relay (Q4), the warning rule, the display, and the M-S2 field all need restating.
11. **Undo after the member has already been emailed.** If a publish is undone within the 10-second window but the "your listing is live" email has already gone, the member holds a link that now shows "no longer listed". This draft surfaces it honestly in the Undo confirmation ("she was already emailed…"), but whether a correction email should be offered is a product decision.
12. **No duplicate detection between pending listings.** `duplicate` exists as a reject reason and search exists, but nothing surfaces two pending listings for the same business — unlike `LondonEventsManager`, which computes duplicate groups. At community volume that is probably fine; recorded so it is a choice rather than an oversight.
