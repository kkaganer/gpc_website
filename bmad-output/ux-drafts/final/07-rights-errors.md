## 7. Data rights, errors and edge cases

**Owns:** FR-023 (withdrawal), **FR-024 (`/privacy` content — gates launch)**, NFR-005 (20-working-day deadline), NFR-011 (partial-failure safety); and for the whole feature, the consolidated error catalogue (§7.4), the single interaction & animation contract (§7.5) and the shared admin dashboard (§7.3). Tokens, contrast pairs and component specs are fixed in `DESIGN.md` §1–2, the WCAG contract in §3 — referenced, never restated.

### 7.1 The three withdrawals, and the identity model

| # | Purpose | Withdrawing it does | Reversible |
|---|---|---|---|
| 1 | Publish my business in the directory | Listing unpublished. Record, answers, newsletter untouched. | Yes, via `/join` |
| 2 | Send me the newsletter | `unsubscribed_at` set. Listing and record untouched. | Yes |
| 3 | Hold my personal data at all | Full erasure: record, listing, answers, consent detail. Only a tombstone remains. | **No** |

Purpose 3 is withdrawal of the FR-004(a) consent everything else rests on, so it *is* erasure and the UI says so in those words. Each control acts on exactly one purpose — no "unsubscribe from everything", no cascade. Each withdrawal appends a new consent row citing the version she originally saw (FR-004); the original grant stays visible to admins.

**Identity without login.** No member account exists and this release adds none, so a form acting on a typed email address would be three vulnerabilities at once: **enumeration** (confirming a named woman belongs to a Greenwich parents' group is a safety issue before a compliance one), **griefing** (anyone could unlist a competitor or erase a member in ten seconds) and **mail-bombing**. Hence: (1) **an email address only ever causes an email to be sent, never a change**; (2) two tokens — the **mail token** in every email footer (A18) rotates each send, is multi-use, and authorises *only* one-click unsubscribe and pre-filling the address on D-1, so a forwarded newsletter cannot take someone's listing down, while the **request token** emailed from D-1 lasts **60 minutes, single use**, and authorises the request centre; (3) **D-1's response is constant** — same copy, screen, status, padded to a common time floor (≈600ms) — for a known address, an unknown one, a rate-limited request and a honeypot trip, and unknown addresses get no email; (4) **erasure is never same-session** — a second confirm step, a "This wasn't me — cancel it" email live until the erase runs, and an admin action; (5) **the verified page shows only what the inbox owner already knows** — first name, business name, listing status, consents on; never postcode, answers, full email or admin notes, because a leaked token must not become a data export. **New components** (all else is `DESIGN.md` §2): `RightsCallout` (the `/privacy` rights block, reused on `/join`'s confirmation), `EmailChip`, `CooldownButton`, `ConsentCard` (one per purpose, owns its inline confirm), `DeadlinePill` (**the NFR-005 single source of truth** — queue, detail and dashboard tile must not be able to disagree), `DeletionManifest`, `StatTile`, `ActivityLog` (shared with moderation history, NFR-013).

**Transactional email copy.** Every email carries, per FR-021 and **A18**: controller identity ("Greenwich Parents & Carers CIC, company 16387545. Data controller: Aster Thackery."), a link to `greenwichparentsandcarers.co.uk/privacy`, and the mail-token link **"Manage your data or unsubscribe"**. *"Just reply to this email"* is never used — it reinstates the email-an-admin-and-wait loop FR-023 exists to remove. **1, "Manage your GPC data"** (only if the address is known): *"It works once, and it stops working in an hour. If it wasn't you, you can ignore this email — nothing has changed and nothing will."* **2a/2b, "We've got your request"**: names the date (*"by Tuesday 15 September at the very latest"*), states what is and is not affected (erasure: *"your membership record, your answers to the join form, your directory listing and your newsletter subscription. Once it's done we can't get any of it back"*), and carries **[ This wasn't me — cancel it ]**, live until the erase runs. **3a, "Your listing is down"**: *"Anyone with the old link will see a note saying it's no longer listed. You're still a member and your newsletter is unchanged."* **3b, "Everything's been deleted"**: *"We've kept one thing, and only one: a dated note that a deletion request was made and completed, with no name or email in it. This is the last email you'll get from us."*

### Journey J1 — Bea takes her listing out of the directory

**Goal:** remove her business from the public directory without losing her membership, her newsletter or her place in the community — and without emailing an admin and waiting. **Persona:** Bea (Business Mum); Ash actions it. **Time:** member 2–4 min across two sittings (the email round-trip); admin under 1 min.
**Entry points:** the "Manage your data or unsubscribe" footer of any GPC email → `/my-data?t=` with the address pre-filled; `/privacy` → the "Your data, your call" block; `/my-data` direct, which must work cold because the URL gets pasted between members.
**Success criteria:** gone from every public read within one cache cycle of the admin action; newsletter state byte-identical before and after; record, answers and consent history retained; the ledger gains exactly one withdrawal row citing the original version; one confirmation email; the queue shows it complete with acting admin and UTC timestamp (NFR-013).

```
 Email footer "Manage your data or unsubscribe"  │ ALT: /privacy → the "Your
   ▼ D-1 /my-data [ Email me a secure link ]      │ data, your call" block
   ▼ D-2 "Check your inbox" — constant response, constant time; never says
   ▼  whether the address is known. EMAIL 1: 60-minute single-use link
 D-3 /my-data/manage  Listing [Take my listing down] ◄ chooses · News'r
   ▼  [Stop sending it] · ─ Or leave completely ─ [Delete everything]
 D-5 /my-data/done "We've got it." + a date ── EMAIL 2 + "This wasn't me"
   ▼ visible in the admin panel within one page load (NFR-005)
 D-6 "Unlist · Bea's Baby Massage · due Tue 15 Sep" ──► D-7 [ Unpublish ] →
   Complete, log row written ── EMAIL 3 "Your listing is down". Listing gone;
   record, answers and newsletter unchanged.
```

| Trigger | Display | Recovery |
|---|---|---|
| Arrives cold at `/my-data`, or with a mail token | Empty field + hint "The address you signed up with."; or a read-only `EmailChip` `b••••@gmail.com` with "Not you? Use a different address". If the address is not one GPC holds, **the identical D-2** appears and no email is sent; D-2 adds "If you're not sure which address you used, try the other one." | Types it (`autocomplete="email"`); or the button clears the chip, reveals the field, focus into it. For an unknown address there is nothing to recover — by design |
| Link expired, or used twice | D-1 + warning: *"That link has expired — they only last an hour. Pop your email in and we'll send a fresh one."* (used: *"…has already been used. Here's a fresh one."*) | Address pre-filled from the token's claim; focus on submit |
| She has no listing / it is pending | Card **Empty**: *"You're not in the directory. If you'd like to be, you can ask on the join form."* (button absent, not disabled). Pending: button becomes *"Withdraw my request"*, body *"It hasn't gone live, so nothing of yours is public right now."* | Other cards unaffected; the admin action becomes "Cancel the pending listing" |
| She hesitates, or wants two things | Card expands inline: *"Take your listing down? It'll come off the directory. Your membership and your newsletter stay exactly as they are."* → `Yes, take it down` / `Keep it up`. D-3 never navigates away; the actioned card collapses to *"Requested — we've emailed you the details."* and the others stay live for the rest of the 60 minutes | "Keep it up" collapses the confirm and returns focus to the opening button; "I'm done for now" → D-5 |
| POST fails, or she didn't make the request | E-01/E-02 in-card, nothing marked done; or Email 2's *"This wasn't me — cancel it"* → D-5 **Cancelled** | Retry reuses the idempotency key (A19) so it cannot create two requests; the queue row moves to `Cancelled by member` and nothing changes |

**Drop-off.** The email round-trip is the biggest loss point and a deliberate cost. Mitigations that do not remove it: D-2 names the subject line (*"Look for 'Manage your GPC data'"*) so she can search rather than scroll; the 60-minute expiry is generous on purpose (15 minutes would strand people at bedtime); the mail-token entry removes the typing step for the majority. Second risk, **misdirected intent** — someone arriving from a newsletter footer acting on the listing card because it is first: the card matching the token's `intent` hint is ordered first with a `ring-2 ring-primary` marker; ordering is a hint, never a pre-selection. Third, **fear of the erasure card**: it is last, below a rule, under "Or leave completely", and both reversible cards state what they do *not* touch. There is deliberately **no retention interstitial and no "are you sure you want to leave?"** — friction applied specifically to a withdrawal is a dark pattern and would undermine the compliance claim this feature exists to make.

### Journey J2 — A member asks for full erasure

**Goal:** delete everything GPC holds, and be able to trust it happened, without chasing anyone. **Persona:** most often Carla (Career Mum) making a clean exit; occasionally someone in a safeguarding-adjacent situation for whom it is urgent. Ash executes; Aster is accountable for the deadline. **Time:** member 3–5 min including the round-trip; admin 2–3 min, most of it reading what is about to be destroyed. **Entry points:** identical to J1 — there is deliberately **no separate "delete me" URL**, so the reversible options are always seen first. **Success criteria:** visible in the admin panel within one page load (NFR-005); completable in one workflow with no database access; afterwards no record, listing, answers, consent detail or newsletter row exists; the completion email is sent **before** the delete commits; received and completed dates stored, feeding the ≤20-working-day metric.

```
 D-1 → D-2 (identical to J1) ──► D-3 ── Or leave completely ──
   ▼  D-4, on the one Dialog (§2.9): itemised "we'll delete" · "we'll keep" ·
   ▼  [ ] I understand this can't be undone · [ Yes, delete everything ]
 D-5 "We've got it. We'll delete everything by <date>." EMAIL 2b + a cancel
   ▼  link live until the erase runs. Token burned — D-3 is gone for good.
 D-6 (erasure sorts above unlist) ──► D-7  1 Review what will be deleted
   (counts, not raw PII)  2 Type the member's email  3 [ Erase this member ]
   → send EMAIL 3b FIRST, then commit the delete. Tombstone written; the
   request row reads "Completed <date> by <admin>." 
```

| Trigger | Display | Recovery |
|---|---|---|
| She has a published listing | D-4 names it first, then offers the narrower option **once**, neutrally: *"If you only want the listing gone, close this and use 'Take my listing down' instead."* | Close returns to D-3, focus restored to the erasure button |
| Nothing ticked; POST fails; or Escape | Button disabled with *"Tick the box above to continue"* already in its accessible description; or an error banner **inside** the dialog with the checkbox still ticked; or the dialog closes and nothing is sent | Ticking enables it (polite: *"Delete button is now available."*); retry via the idempotency key; focus returns to the trigger |
| Cancels before, or after, the admin acts | D-5 **Cancelled**: *"Nothing has been deleted and nothing has changed."* Or **Too late**: *"This request was completed on Mon 8 September, so there's nothing left to cancel. If you didn't ask for it, please email us at gpc.communitynews@gmail.com."* | Queue row → `Cancelled by member`, retained for evidence. The too-late case is a human path only — the residual risk, stated rather than hidden |
| Admin opens an already-erased request; or the completion email fails | D-7 **Empty**: *"There's nothing left to delete."*, destructive control absent from the DOM; or the erase does **not** proceed at all (D-7 ordering) | `Mark this request complete`; or retry the send, or "Erase without emailing" with a typed reason recorded on the tombstone |
| Deadline near / passed | `DeadlinePill` amber at ≤5 working days, red past due; overdue sorts first; the dashboard tile takes the same state | Nothing auto-escalates — no channel exists (see Notes) |

**Drop-off.** Erasure inverts the usual funnel: abandonment is not automatically bad, but it must never be caused by confusion. The failure to avoid is a member who only wanted to be unlisted clicking erasure because it looked like the clearest button — hence last, quieter, behind a dialog, one tick, and the narrower alternative offered once. The mirror failure is a member who *does* want erasure being worn down by ceremony until she gives up, turning a self-service right into an unanswered email — hence exactly two taps and one tick, never a typed word, and copy that never argues with her. She has no account and cannot check status, so D-5 and the email both state a **date** computed from working days, not "soon". Honest residual risk: **a stolen inbox is a completed erasure**, and an attacker with inbox access will delete the warning email too.

#### Screen D-0 — `/privacy` (FR-024) — content specification; **this gates launch**

The page must be written and published **before `/join` accepts its first submission**: FR-004's consent copy links here, and a stored consent record citing a page that does not yet say these things is not evidence. Content is the controller's to write; the IA and required headings are fixed here. One `<h1>` ("How we handle your data"), then these `<h2>`s **in order** — where **6, "Your data, your call"** is the `RightsCallout` block wireframed below, i.e. the rights *entry point* rather than a paragraph about rights:

| # | Required `<h2>` | Must contain |
|---|---|---|
| 1 | Who we are | Controller identity and company number; `gpc.communitynews@gmail.com` as the contact |
| 2 | What we collect when you join | **Every** category the form gathers, one row each: name, email, postcode, household/children, group and branch answers, the free-text survey answers, business details — plus technical data (IP and timestamp, kept for FR-006 rate limiting) and **the mail token**, a persistent per-member identifier embedded in every outbound email, with its rotation policy |
| 3 | What goes on the public directory, and what never does | Two lists, **string-identical to the `DESIGN.md` §2.8 disclosure panel on `/join`**. If they diverge, the panel is the promise and the page is the breach |
| 4 | Why we're allowed to hold it | Lawful basis per purpose: consent for directory publication, consent for the newsletter, and the FR-004(a) consent to hold the record at all |
| 5 | How long we keep it | The retention period. **BLOCKING: `«RETENTION_PERIOD»` (open question Q8) must be a real figure here before launch, because the identical string is stored verbatim in every consent record** |
| 7 | Who else sees it | Processor list, one row each with what it holds and where: Supabase (database + hosting region), Brevo (newsletter delivery), the site host, the shared Google mailbox |
| 8–9 | Cookies and what we measure · If you're not happy | If nothing beyond essential, one sentence saying exactly that; then the ICO complaint route and the contact address again |

```
┌──────────────────────────────────────┐
│ ⚙  Your data, your call         h2   │
│ You can take your directory listing  │
│ down, stop the newsletter, or ask us │
│ to delete everything we hold — when- │
│ ever you like, without emailing any- │
│ one.  [     Manage my data      ]    │
│ We'll email you a link to make sure  │
│ it's you. We aim to action every     │
│ request within 20 working days.      │
└──────────────────────────────────────┘
```

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Page load | As wireframed | `<section aria-labelledby>` inside the page's `<main>` |
| Loading / Empty / Error / Success | N/A — authored static content; nothing fetches, nothing completes | — | — |
| Disabled | **N/A by design.** Even when the join form is closed (FR-009), data rights stay available | — | — |

#### Screen D-1 — `/my-data` — start a request, then "check your inbox"

One route, two phases. Phase 1 takes an email address and causes an email to be sent — nothing else; this screen must be *incapable* of changing a member's data. Phase 2 must be indistinguishable for a known address, an unknown one, a rate-limited request and a honeypot trip; the masked address it echoes is the string she just typed, not a lookup result. **In:** email footer, D-0, direct URL, expired-token redirect. *Wider viewports:* `max-w-xl` centred, button auto-width — deliberately narrow at every size, it is one field. *A11y (non-obvious):* the honeypot is hidden with `position:absolute; left:-9999px` — **never** `display:none` or `hidden`, which sophisticated bots skip — and removed from AT by `aria-hidden` + `tabindex="-1"`; its name is non-credential-shaped (`company_website_2`, `autocomplete="off"`) so password managers do not autofill it. This page is reached straight from an email, so it relies on the **existing** skip link (`Layout.jsx:8-10`) — do not add a second; do fix its `focus:` → `focus-visible:` and repaint it on `--color-primary-700`.

```
┌─ phase 1 ────────────────────────────┐  ┌─ phase 2 ────────────────────────┐
│ Your data, your call            h1   │  │        ✉  (56px, aria-hidden)    │
│ Take your listing down, stop the     │  │ Check your inbox            h1   │
│ newsletter, or ask us to delete      │  │ If b••••@gmail.com is on our     │
│ everything. Nothing changes until    │  │ list, we've just emailed it a    │
│ you confirm from a link we email.    │  │ link. Look for the subject line  │
│ ┌ 🕐 That link has expired — they  ┐ │  │ "Manage your GPC data". Nothing  │
│ └   only last an hour. [fresh one] ┘ │  │ has changed yet, and nothing     │
│ Your email address *                 │  │ will until you use that link.    │
│ [ you@example.com               ]    │  │ Not arrived? Check your spam, or │
│ The address you signed up with.      │  │ [ Send another link  (0:47) ]    │
│ [ honeypot "Company" — off-screen ]  │  │ Used a different address?        │
│ [    Email me a secure link     ]    │  │ Start again →                    │
│ 🛈 We never say whether an address   │  └──────────────────────────────────┘
│   is on our list.                    │
└──────────────────────────────────────┘
```

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Load, no token or a valid mail token | Field empty or chip-filled | `<form noValidate>`; `htmlFor`/`id` pairing (the site has none today — NFR-008 forbids inheriting that) |
| Loading | Submit or resend in flight | Label → "Sending…", in-button `Spinner` (A7); the field goes `readonly`, **not** `disabled`, so its value is still submitted and still in the accessibility tree | The page's one polite region: "Sending your request" |
| Error (Empty is N/A — one field, no collection) | Blank/malformed address, or E-01–E-03 | Field error under the input; submission-level errors in a banner **above the submit button** | `aria-invalid`; `aria-describedby="hint error"`; the page's one alert region; focus to the banner |
| Success | 200, **or** rate-limited, **or** address unknown — all identical | Phase 2, no reload. Resend: *"Sent again. Give it a minute to arrive."* | Focus to phase 2's `<h1>` (`tabIndex={-1}`, removed on blur); one polite announcement |
| Disabled | While Loading; resend cooldown | 60% opacity; *"Send another link (0:47)"*; the disabled label is still ≥4.5:1, never translucent white | `aria-disabled` alongside `disabled`. **The countdown is not in a live region** — it would announce every second; the accessible name updates at 60/30/10/0s only, then "You can send another link now." |

#### Screen D-3 — `/my-data/manage` — verified request centre, and the D-4 erasure dialog

The one screen where FR-023 is exercised. **In:** the request-token link in Email 1 and nothing else — a direct visit without a valid token redirects to D-1 with the expired notice. *Wider viewports:* cards stay a **single column** at `max-w-2xl`; a three-across row makes the destructive card look like a peer of the other two, which is exactly J2's drop-off failure. D-4 is the one `Dialog` primitive (§2.9, A14) — bottom sheet ≤768px, centred `max-w-lg` above; if its list overflows at 320×568 the **list** scrolls, not the footer, so the tick and both buttons stay visible. Typing `DELETE` on a phone at night is a tax on someone exercising a legal right, so the member confirms with a tick; D-7 *does* require typing, because there Ash is acting on someone else's data and the mistake is unrecoverable for a third party. *A11y (non-obvious):* each card's body names what the action does *not* affect — the FR-023 guarantee made audible, not decoration; "This can't be undone" is bold **and** in the accessible description, never colour alone; the destructive card is last in **DOM order** as well as visually; Escape closes an inline confirm as well as the dialog; headings run `<h1>` → `<h2>` per card → "Or leave completely" `<h2>` with the erasure card's title `<h3>`, no level skipped.

```
┌──────────────────────────────────────┐  ┌ D-4 ─────────────────────[ ✕ ]──┐
│ Hi Bea — what would you like    h1   │  │ Delete everything?           h2  │
│ to change?                           │  │ We'll delete (real <ul>): your   │
│ ┌ ✓ It's you. This page works for  ┐ │  │ membership record · your answers │
│ └   the next 60 minutes.           ┘ │  │ to the join form · your listing, │
│ ┌ ConsentCard: 📣 Your directory   ┐ │  │ Bea's Baby Massage · your        │
│ │ listing · Bea's Baby Massage     │ │  │ newsletter subscription.         │
│ │ [Published] · "Taking it down    │ │  │ We'll keep one thing: a dated    │
│ │ removes it from the public       │ │  │ note that a deletion was asked   │
│ │ directory. Your membership and   │ │  │ for and done, with no name or    │
│ │ newsletter stay as they are."    │ │  │ email in it. Can't be undone.    │
│ │ [   Take my listing down    ]    │ │  │ [ ☐ I understand this can't be   │
│ ├ ✉ The GPC newsletter [Subscribed]┤ │  │     undone. ]        44px row    │
│ │ [ Stop sending the newsletter ]  │ │  │ [ Yes, delete everything ]       │
│ ├ ─── Or leave completely ───  h2  ┤ │  │ [ Cancel ]                       │
│ │ 🗑 Delete everything (error card)│ │  │ Only want the listing gone? Close│
│ └ [ Delete everything you hold ]   ┘ │  └ this and use "Take my listing    ┘
│ [       I'm done for now        ]    │    down" instead.
└──────────────────────────────────────┘
```

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Valid token, snapshot loaded | Three cards at rest. D-4 opens unticked with its primary disabled | Focus to `<h1>`; each card `<section aria-labelledby>`. In D-4, focus goes to the `<h2>`, **never** the destructive button |
| Loading | Snapshot fetching; or D-4 confirm pressed | Three card-shaped skeletons (§2.12), **no spinner** — the shape of the answer is known. In D-4: label → *"Sending your request…"* (honest — the request is being sent, not the delete run), Escape suppressed | Skeletons `aria-hidden`; the page's polite region carries "Loading your details" |
| Empty / Error | No listing and no subscription; or a fetch or POST fails | *"You're not in the directory. If you'd like to be, you can ask on the join form."* / *"You're not subscribed."* — neither renders a button, the erasure card is unaffected, and D-4's list always has at least the membership record. On failure: *"We couldn't load your details just now. Your link still works — try again."* + Retry; in D-4 the banner sits above the buttons, the dialog stays open and the checkbox stays ticked | Headings still render so page structure is stable. The error is an alert, focus moves to the banner, and the confirm button is the retry |
| Success | An action requested | That card collapses to *"Requested — we've emailed you the details."*, button removed. **Other cards stay live.** D-4 closes and routes to D-5 | Polite: "Request received."; focus to the completed card, or to D-5's `<h1>` |
| Disabled | Action in flight; D-4 unticked | That card's button only — others are **not** disabled, she may queue two requests | The hint *"Tick the box above to continue"* is in D-4's `aria-describedby` **from the start**, so AT users learn the requirement before pressing |

**Screen D-5 — `/my-data/done`.** Closes the loop with a date, not a promise, and burns the token — there is no route back into D-3. Same `max-w-xl` narrow shell as D-1: a success token, `<h1>` *"We've got it."*, a "What happens now" card (*"1. An admin will action this — usually within a day or two. 2. We'll email you when it's done. 3. It'll be done by Tue 15 September at the very latest."*), *"Your membership and your newsletter aren't affected."*, and *"Didn't mean to do this? The email we've just sent has a cancel link."* *Variants:* **erasure** — step 3 becomes *"It'll all be gone by Tue 15 September at the very latest"*, closing *"This page is the last one that works from your link — it's now used up."*; **cancelled** — h1 "Cancelled.", *"Nothing has been deleted and nothing has changed."*; **too late** — h1 "That's already done." plus the contact address. Dates are written in full in the accessible text (`Tuesday 15 September 2026`) even where the visual shows `Tue 15 Sep`.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default / Success | Arrival with a completed request; or a cancel that succeeded | Success or Cancelled variant | Polite region announces the confirmation block once; focus on `<h1>` |
| Loading | Cancel-link entry, token resolving | Centred skeleton, no spinner | Polite: "Checking that link" |
| Empty | No request in session and no token | *"There's nothing to show here. If you want to manage your data, start from the beginning."* + link to D-1 | Ordinary content |
| Error | Cancel token invalid/expired/used | *"That cancel link doesn't work any more. If you're not sure what's happening with your request, email us at gpc.communitynews@gmail.com and we'll check."* | Alert; focus to it |
| Disabled | N/A — the only control is a navigation link | — | — |

#### Screen D-6 — `/admin/data-requests` — the requests queue

**A5: this route owns data-rights requests.** One sidebar entry (`{ to: '/admin/data-requests', label: 'Data requests', icon: ShieldCheck }`, added to the single array at `AdminLayout.jsx:5-16`). The moderation queue shows a badge and link on any listing with an open request but does **not** own the queue — erasure spans the member record, the listing and newsletter state, so nesting it under directory moderation would leave newsletter-only and record-only requests homeless. *Wider viewports:* cards become a table (`Status | Type | Member | Subject | Received | Due | Action`) keeping the colour-coded `border-l-4` at row level, filters on one line; pagination follows the established idiom — `PAGE_SIZE = 25`, "Show 25 more", reset on filter change, never infinite scroll. *A11y (non-obvious):* `DeadlinePill` always renders text ("Overdue by 2 working days"), never colour alone; a visually truncated email keeps its full value in the accessible name, since an admin may need to read it aloud on a call; scroll position and the "Show 25 more" count survive a round-trip to D-7 (the lesson of commit 310e86c).

```
┌──────────────────────────────────────┐
│ Data requests                   h1   │
│ People asking us to unlist,          │
│ unsubscribe or delete.               │
│ [OVERDUE 1][DUE ≤5wd 1][OPEN 4]      │
│ [ Open ][ Completed ][ Cancelled ]   │
│ [ All types ▾ ]                      │
│ ┌ Card, error left border ─────────┐ │
│ │ ⚠ OVERDUE by 2 working days ·    │ │
│ │ [ERASURE] · Received Mon 4 Aug · │ │
│ │ Due Mon 1 Sep · Carla T. ·       │ │
│ │ carla@… · Listing: none          │ │
│ │ [       Open request        ]    │ │
│ ├ Card, warning border: ⏱ Due in 3 ┤ │
│ └ wd [UNLIST] · Bea M. · Bea's …   ┘ │
│ Showing 4 of 4                       │
└──────────────────────────────────────┘
```

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Open requests exist | Sorted overdue first, then due date ascending; erasure above unlist above unsubscribe within a day | `<ul>`/`<li>`; polite: "4 open requests. 1 overdue." |
| Loading | Initial fetch | Three skeleton cards. **Tiles show `—`, not `0`** — a zero that becomes a one is a lie | `aria-busy` on the list; polite "Loading data requests" |
| Empty / Error | Nothing matches the filter; or the fetch fails | *"Nothing waiting. When someone asks to unlist, unsubscribe or delete their data, it'll show up here with its deadline."* + "Clear filters" if one is active; or *"Couldn't load the request queue. This is our end, not yours — try again in a moment."* + Retry | Empty is polite and tiles still render (zeroes) so structure is stable; the error is an alert and takes focus |
| Success | Returning from D-7 | **Inline success banner at the top of the list** (A6 — no toast): *"Done. Carla's data has been deleted."* The row leaves the Open view; tiles recompute | Polite; focus to `<h1>`, because the row it came from no longer exists |
| Disabled | Filters during first load | 60% opacity | `aria-disabled`, not `disabled`, so the current selection is still announced |

#### Screen D-7 — `/admin/data-requests/:id` — request detail and erasure workflow

The whole of NFR-005's "single workflow, no database access" claim. **In:** D-6, and the member record's "This member has an open request" link — the other half of A17's bidirectional pair. *Variants:* **unlist** — the manifest becomes "What will change" (*"The listing Bea's Baby Massage comes off the public directory. Her member record, survey answers and newsletter stay exactly as they are."*) and the action is a single `Unpublish the listing` with **no typed confirmation**, since it is reversible and the ceremony would be theatre; **unsubscribe** — `unsubscribed_at` is the contract and the Brevo backfill must not re-subscribe (fixed in commit c50bbf6). *Wider viewports:* two columns above `md:`, the action card sticky in the right rail so it is reachable without scrolling past a long manifest; nothing hidden at any width.

```
┌──────────────────────────────────────┐
│ ← Data requests                      │
│ Erasure request                 h1   │
│ [ERASURE]  ⚠ Overdue by 2 wd         │
│ ┌ Timeline: requested Mon 4 Aug,   ┐ │
│ │ 21:14 UTC · confirmed by email   │ │
│ │ link · due Mon 1 Sep · Open      │ │
│ ├ Who this is: Carla T. ·          ┤ │
│ │ carla@example.com                │ │
│ │ [ Open full member record → ]    │ │
│ ├ What will be deleted: member     ┤ │
│ │ record 1 · answers 14 · consent  │ │
│ │ 3 · listing 0 · newsletter 1 ·   │ │
│ │ ▸ Show the actual values · We    │ │
│ │ keep a dated erasure note with   │ │
│ │ no name or email in it.          │ │
│ ├ Complete this request: type the  ┤ │
│ │ member's email to confirm —      │ │
│ │ carla@example.com  [           ] │ │
│ │ ☑ Email Carla to confirm it's    │ │
│ │   done (sent before we delete)   │ │
│ │ [    Erase this member      ] ·  │ │
│ └ [ Can't action this? Add a note ]┘ │
│ Notes & history (ActivityLog)        │
└──────────────────────────────────────┘
```

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Open request loaded | Destructive button disabled until the typed email matches (trimmed, case-insensitive) | The requirement is in the field's `aria-describedby` |
| Loading | Initial fetch | Skeleton cards. **The action card is not rendered at all** — a destructive control must never be visible before its manifest | `aria-busy`; polite "Loading request" |
| Empty / Error | Already erased or no record; or the fetch or erase fails | *"There's nothing left to delete."* with the action card replaced by `Mark this request complete`; or *"That didn't go through, and nothing has been deleted. The member's record is exactly as it was."* with the typed email preserved | The destructive control is **absent from the DOM**, not merely disabled. The error is an alert, takes focus, and re-enables the button |
| Success | Erase completed | The action card becomes a green completed panel that **holds 800ms** so the change is perceivable, then routes to D-6 with its inline banner | Polite before navigating |
| Disabled | Email doesn't match; erase in flight; request already Completed/Cancelled | 60% opacity; a completed request replaces the whole card with *"Completed on Mon 8 Sep by Ash."* | `aria-describedby`: *"Type carla@example.com above to enable this."* On match, polite: *"Confirmation matches. The erase button is now available."* |

**The email-then-delete ordering (NFR-011 inverted).** NFR-011 says a partial failure must not lose the record; here the equivalent hazard is **deleting the address you need in order to say you deleted it**. So: (1) send Email 3b — on failure **STOP**, the request stays "Ready to erase" with *"We couldn't email Carla, so we haven't deleted anything yet. Try again, or use 'Erase without emailing' and tell us why."*; (2) write the tombstone; (3) delete listing → answers → consent detail → newsletter row → member record in one transaction; (4) mark Completed, attribute, stamp UTC. "Erase without emailing" appears **only** after a send failure, requires a typed reason, and records it on the tombstone.

### 7.3 Shared admin dashboard (`/admin`)

Four sections modify this page and none owned it. One specification owns all four counts; each is a link, not a statistic — the count replaces the chevron on its quick-link card. The **Join form** line is the primary defence against form-config's biggest failure mode, edits drafted and never published (A4), so it states the draft count and not just "Open". **Abuse blocked** is where FR-006's rejection counter becomes visible on the admin's home screen; the fuller 7-day/30-day split lives on Form Settings. `AdminLayout` gains an off-canvas drawer plus sticky top bar below 768px (A21) and a skip-to-content link — it has no `Layout` wrapper today, so unlike the public pages it genuinely needs one added.

```
┌──────────────────────────────────────┐
│ Hello Ash                       h1   │
│ ┌ Listings waiting            3 → ─┐ │  → /admin/directory
│ │ Oldest has been waiting 12 days  │ │  → /admin/data-requests
│ ├ Data requests · 1 overdue   2 → ─┤ │  → /admin/form; also "Open · up to
│ ├ Join form · Open · 3         → ─ ┤ │     date" / "Closed since 12 Aug"
│ │ unpublished changes              │ │  → form settings (FR-006 crit. 5)
│ ├ Abuse blocked (7 days)     14 → ─┤ │
│ └ 11 honeypot · 3 rate-limited     ┘ │
└──────────────────────────────────────┘
```

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | All four counts resolved | As wireframed | `<h1>`; the cards are a `<ul>` of links; each count sits inside its link's accessible name ("Data requests, 2, 1 overdue") |
| Loading | Initial fetch | All four rows render with their labels and a skeleton bar where the count goes. **Counts arrive with the shell in one request, not lazily** — four independently-arriving numbers make the page twitch and make "0" briefly true | `aria-busy` on the list; polite "Loading your dashboard" |
| Empty | Every count zero and the form up to date | Rows stay, reading *"Nothing waiting"* / *"Up to date"* / *"Nothing blocked"*. The page never collapses to a blank state — a stable shape is how Ash learns where things live | Polite, once: "Nothing needs you right now." |
| Error | The counts request fails | Rows render as plain links **without** counts, above one banner: *"We couldn't load your counts just now. The links below still work."* + Retry | Alert; focus to the banner. Degrading to working links beats an empty page |
| Success / Disabled | N/A — nothing completes here and every row is a link | — | — |

### 7.4 Consolidated error and edge-case catalogue

**Shared rules.** Everything renders through the inline banner (`DESIGN.md` §2.10) — **no toasts** (A6). No error is ever colour alone: icon **and** text, icons `aria-hidden`. Three copy rules: *say whose fault it is, and it is never hers*; *say whether her data is safe* — every error states explicitly whether anything was saved, sent, changed or lost, the thing generic error copy always omits; *give exactly one next action*. Never an error code as a headline, never "Something went wrong", never a raw exception. **Placement:** field problems under the field, submission problems immediately above the submit button (A1). **Per page: one `aria-live="polite"` region and one `role="alert"` region, both reused** (A13) — four simultaneous regions on `/join` produce interleaved, unintelligible speech. Every retry re-posts the same payload with the same **idempotency key**, generated once at form mount (A19).

| # | Trigger | Where | Display + copy | Recovery | ARIA |
|---|---|---|---|---|---|
| E-01 / E-02 | `fetch` rejects (offline, dropped connection, backgrounded tab); or the route throws — FR-005 requires JSON `{error}` + non-2xx, **never** an HTML page | Every POST, admin list loads | Banner, `WifiOff` / `ServerCrash`: **"We couldn't reach us just then."** / "Nothing has been sent, and everything you've typed is still here." — or **"That didn't go through — and it's our end, not yours."** / "Nothing has been saved… If it keeps happening, email us at gpc.communitynews@gmail.com." + **[ Try again ]** | Idempotent re-post; state is never cleared on error | Alert; focus to the banner so Retry is the next tab stop. The server string is never shown to members (it may leak internals) and is logged with the record id only — never name, email, phone or postcode. Admin screens may show it |
| E-03 | No response within the client timeout | Every POST; likeliest on `/join` over mobile data | **8s** warning: *"Still going. Please don't close this page."* **30s** abort: *"That took too long… It may have gone through — if you try again we'll make sure you don't end up with two."* | Idempotent retry — that sentence is a literal description of A19, not reassurance theatre | 8s polite (must not interrupt mid-sentence); 30s assertive and takes focus |
| E-04 | Rate limit exceeded (FR-006) | `/join`, D-1 | **Warning, not error** — nothing is broken and she did nothing wrong: *"That's more tries than we can take right now. Give it a couple of minutes… Everything you've typed is still here."* **[ Try again in 2:00 ]** | Countdown self-enables. After a failed retry: *"Still stuck? Email us at gpc.communitynews@gmail.com and we'll add you by hand."* Never discloses the threshold — that is an instruction manual for an attacker | Polite. The countdown updates the accessible name at 60/30/10/0s only, never every second |
| E-05 | Honeypot field non-empty (FR-006) | `/join`, D-1 | The **exact** success state of that screen | **A2: the confirmation is rendered from the request payload the client sent, never from the database result** — rendering from stored records would tell a caught bot it was caught, and would leak FR-007 duplicate state too. Also pad to a common time floor and keep headers, cookies, body length and analytics byte-identical | The decoy is off-screen positioned, `aria-hidden`, `tabindex="-1"`. A genuine human caught by it never learns why — which is why `/join`'s confirmation says "if you don't hear from us within a week, email us" |
| E-06 | Submission for an email that already has a record (FR-007) | `/join` confirmation | Ordinary success (A9): **"Thanks, Bea — that's in."** / "We've saved your answers. If you've filled this in before, your latest answers sit alongside what we already had — you won't end up on our list twice." / "You asked to be listed, so one of our admins will have a look. **We usually review new listings within a week.**" / "Nothing you've told us is public until we've checked it with you." | Admin-side the listing takes a `Resubmission` status, surfacing as a pill in the normal queue plus a submitted-vs-published diff (A10) | Every sentence is unconditionally true; the conditional *"if you've filled this in before"* is not a claim about which branch applies, so FR-001 and FR-007 are satisfied at once. The `<form>` is removed from the DOM, not hidden |
| E-07 | Required fields unanswered or malformed | `/join`, D-1, D-7 | Two layers. **Summary above the submit button** (A1): *"There are 3 things to fix before we can send this."*, each item an in-page link to its field. **Field errors** under each control, specific and instructive — *"Please write a line or two about what you do — this is what people will read in the directory."*, never "This field is required" fourteen times | Errors clear on `blur`, not on every keystroke; the summary re-counts live | Summary `role="alert"` + `tabIndex={-1}`; **focus always moves to the summary, whatever the error count** (A1). `<form noValidate>` — native bubbles are not SR-reliable, cannot meet contrast, and vanish on scroll. Hidden-branch fields are unmounted, so they cannot be in the list at all (FR-002) |
| E-08 | Form closed between load and submit (FR-009) | `/join` | Warning, `Lock`: *"We've just closed the form. Sorry — that's terrible timing. Your answers are still on this page and nothing has been sent."* + the admin-authored closed message + **[ Copy my answers ]** | Copies plain labelled text to the clipboard (the `NewsletterManager.jsx:58-66` idiom). Fields become `readonly`, not `disabled`, so she can still select; submit is **removed**, not disabled — there is nothing to retry | Polite, not assertive — she is mid-task. Then focus to the banner so the next Tab reaches Copy |
| E-09 | Category retired after page load | `/join` directory section | Field-level on the category control plus a summary line: *"That category isn't available any more. Please pick another one — everything else you've typed is still here."* The retired option shows once, greyed, suffixed *"(no longer available)"* | Focus to the control; nothing else is touched. **Fires only where the server validates against the live taxonomy**; where the form pins its config version at load, her answer is accepted and this entry does not apply | The explanation lives in the option text, since `aria-disabled` on `<option>` is inconsistently supported |
| E-10 | Listing unpublished while a visitor has its URL | Public listing detail | **HTTP 200, not 404** — a known URL with a known outcome: *"This listing isn't on the directory any more. It may have been taken down at the member's request, or while we check something."* + [ Browse the directory ]. Must **not** name the business, quote the description or show the category — that would republish what was just withdrawn. Generic `<title>`, `noindex` | Warm tab: revalidate on `visibilitychange`, replace in place, announce politely. **Nothing auto-navigates.** Slugs are immutable (A16), so an old link never lands here by accident | Cold load announces via its `<h1>`; only the warm case moves focus and updates `document.title` |
| E-11 | Transactional send fails (NFR-011, FR-021) | Moderation, D-6/D-7, FR-022 | **The decision is never rolled back** — publishing succeeded, only the telling failed. The listing keeps its `Published` pill **and** carries an `email-failed` badge; the two are never merged into one ambiguous "Error". *"Published — but we couldn't email her. Last tried Mon 18 Aug, 21:14."* + [ Try sending again ] [ Copy the email text ] | Copy puts the rendered body on the clipboard so Ash can send it by hand while FR-021 is a *Should*. Every attempt appends to `ActivityLog` (NFR-013). **Member side: nothing** — she never learns an email failed | The badge carries text, not colour. The one inversion is D-7's erasure completion email, which blocks the workflow |
| E-12 | Free text over its limit | `/join` public description (**300 chars**, A8), long answers, admin edit | Three stages on one control: quiet *"300 characters left"* → warning *"42 characters left"* → error *"You're 18 characters over. Trim it a little and we're good to go."* **No `maxLength` attribute** — a hard cap silently swallows a pasted paragraph's ending with no signal at all to a screen-reader user | Submit is not disabled; pressing it gives the E-07 treatment with focus on the field, so the reason is stated rather than mimed | The counter writes into the **page's shared polite region** (A13), throttled to band transitions only — never per keystroke. `aria-invalid` is set on `blur`, not on the keystroke that crossed |
| E-13 | Markup or a script pasted into a description | `/join`, moderation preview, public detail, CSV export | **Member side: nothing.** She is not blocked and not warned — rejecting `<3`, `Mum & Co` or `Bea > Baby` punishes ordinary people, and FR-020 already requires plain-text rendering everywhere. Admin side, a warning flag: *"This description contains code-like characters. It'll show on the site exactly as typed, tags and all."* | Ash edits with FR-016, which preserves the submitted value alongside the published one. **No automatic stripping** — silently rewriting what a member wrote breaks FR-016's distinguishability criterion | Escaping applies identically in the admin preview (that is where an admin's browser is) and in CSV export, where a cell starting `=`, `+`, `-` or `@` is prefixed against formula injection |
| E-14 | JS disabled, or the bundle fails | Every screen (React SPA) | `<noscript>` in `index.html`, styled inline so it survives with no stylesheet: *"This site needs JavaScript… email gpc.communitynews@gmail.com and we'll add you to the community by hand, and answer any question about your data. You can also read our privacy notice at greenwichparentsandcarers.co.uk/privacy."* Bundle failure: an error boundary with **[ Reload the page ]** | Hard `location.reload()` — the actual fix for a stale `index.html` with a missing chunk. **No-JS parity is out of scope**; the human fallback is not, because the policy promises withdrawal "at any time" | Real `<h1>` and `mailto:`, no ARIA and no CSS dependency; the boundary's fallback uses `role="alert"` and moves focus to its heading |
| E-15 | Slow 3G — Bea's median case, not an edge case | `/join` above all | t=0 button → "Sending…", fields `readonly` (values still visible), polite "Sending your answers", **page does not scroll, navigate or dim**; t=2s a quiet progress line; then E-03's 8s and 30s stages. The form is deliberately **not** replaced by a full-page spinner — wiping five minutes of visible work while the network hangs is the most anxiety-producing thing this feature could do | Four independent layers against double submission: disabled button; an in-flight state guard (the layer that catches keyboard users); **the idempotency key** (the only layer surviving a reload or restore, and what makes "try again" honest); a `beforeunload` guard registered only during the request | Fields go `readonly`, never `disabled` — `disabled` removes them from the accessibility tree, so a screen-reader user mid-submit would find the form had vanished. The submit keeps `aria-disabled` so it is still announced; its name becomes "Sending your answers, please wait" |
| E-16 | Any unmatched URL | Site-wide | `App.jsx` has no `path="*"` today, so `/anything-else` renders an empty `<main>`. A catch-all 404 is in scope: *"We couldn't find that page."* + links to home, the directory and `/join` | Precondition for E-10 — without it a typo and a withdrawn listing are indistinguishable | Real `<h1>`, focus moved to it, `<title>` updated |

### 7.5 Interaction and animation contract (whole feature)

**The reset is global (A20).** A scoped reset would leave every shared component this feature *reuses* still animating, which is the failure it exists to prevent. Two mechanisms, both required: a `useMotionSafe()` hook wrapping framer's `useReducedMotion()`, returning variants where `initial === animate` and `duration: 0` — **the animation is removed, not sped up; a 50ms slide is still a slide** — and a global `@media (prefers-reduced-motion: reduce)` block in `src/index.css` zeroing `animation-duration`, `animation-iteration-count`, `transition-duration` and `scroll-behavior` on `*`, `*::before`, `*::after`, which catches Tailwind's `transition-*`, `animate-spin` and the `hover:scale-105` baked into the existing `Button`. **Three carve-outs:** focus indicators never animate away and are never suppressed; colour-only transitions are kept where they are the sole hover affordance (colour is not vestibular motion); and **state that only motion communicates must be replaced, not deleted** — every row below whose fallback removes an animation names what carries the information instead. **Motion tokens** (for `DESIGN.md` §1): `--motion-instant` 100ms · `--motion-fast` 150–200ms · `--motion-base` 250–300ms · `--motion-slow` 400ms · `--ease-out` `cubic-bezier(0.16,1,0.3,1)` · `--ease-in` `cubic-bezier(0.7,0,0.84,0)` · `--stagger` 0.08s public / 0.05s admin, **capped at 6 items** (`Events.jsx`'s `i * 0.1` on a 100-card grid would make the last card wait ten seconds). Nothing exceeds 400ms; nothing loops except the loading indicators below, each of which has a static form.

| Interaction | Where | Behaviour | Timing | Reduced-motion fallback |
|---|---|---|---|---|
| Route change; skip link; focus ring | Every route; every page (`Layout.jsx`); every interactive element | Fade out / fade in + 8px rise; slide down on focus; 2px ring at 2px offset on `:focus-visible` | 250 / 150ms; instant | Instant swap; both indicators appear in place. Focus still moves to the new `<h1>` and the live region still announces. Focus styling is **never suppressed and never animated away, in either mode** |
| Button hover / press / loading | All variants | Background darkens; 2% press scale; label crossfade + in-button `Spinner` (A7) | 150 / 100 / 120ms | Colour retained, scale suppressed, instant label swap with a static indicator and the polite region carrying state. **The existing `hover:scale-105` is removed for all users** — a motion trigger that also shifts adjacent layout |
| Inline banner; dialog open/close | Every error/success/warning; D-4, reject, unpublish confirm | Slide down 8px + fade; backdrop to 55% and panel slides up 24px | 200 / 250 / 180ms | All at final state instantly. `role="alert"`, focus trap, Escape and focus restore unchanged |
| Skeleton shimmer; disclosure/accordion; scroll-into-view | Every list/detail load; `/join` sections and the D-7 manifest; error focus and anchors | Gradient sweep; height auto + fade; `smooth`, `block:'center'` | 1.4s loop; 250ms; native | **No sweep** — flat blocks, with the polite region ("Loading your details") telling a reduced-motion user something is happening. Instant expand at full height (`aria-expanded` identical); `behavior:'auto'`, focus landing identically |
| Branch reveal / discard (FR-002); directory opt-in expand (FR-003) | `/join` | Section expands from 0 height 60ms after the radio commits; the disclosure panel fades in **before** the fields | 300ms | Instant at full height, disclosure **above** the fields in DOM order — the ordering is the requirement, the timing only a nicety. **Focus does not move** (it would yank a member mid-choice); the polite region says *"Business questions added below — 7 more to answer."* — **required in both modes**, it is the only thing telling a screen-reader user the form grew |
| Character counter / postcode validity; form → confirmation | `/join` | Colour transitions; crossfade + 0.8→1 tick icon | 150–200 / 300 + 400ms | Instant colour, icon and content swap, icon at final size. **The 600ms postcode debounce is unchanged** — timing, not animation; shortening it fires validation mid-typing. Focus to `<h1>` and the polite announcement unchanged |
| Card grid enter; hover/focus; search-as-you-type | Directory index (FR-019) | Fade + 12px rise staggered; shadow deepens and the card rises 4px; results crossfade | 400 / 200 / 180ms after a 300ms debounce | All at final state instantly; shadow only, no rise; instant result swap with the **debounce unchanged**. Cards are `<a>`-wrapped, never `<div onClick>`. Polite *"12 businesses found"* — required in both modes, the only non-visual result feedback |
| "No longer listed" swap | Listing detail (E-10) | Content crossfades | 250ms | Instant. The polite announcement and the `document.title` update are what tell the visitor |
| Rows enter / "Show 25 more" / filter change / row removal after a decision | All admin lists; moderation, D-6 | Fade + 8px rise, staggered, capped at 6; list crossfade on filter; row collapses and the list closes the gap | 300 / 180 / 300ms | Instant throughout. Polite *"Showing 50 of 340."*; the inline banner and live region carry a decision's outcome; **scroll position, "Show N more" state and queue position are preserved in both modes** — the admin's place is state, not animation (commit 310e86c) |
| Overdue / pending-too-long emphasis | D-6, moderation | 2s opacity pulse | 2s loop | **No pulse.** The text ("Overdue by 2 working days"), the icon and the border carry it |
| Stat tile value change; insights chart draw (FR-014) | Dashboard, D-6, insights | Number counts up; bars grow from 0, staggered | 600ms | Value snaps, bars at final height, announced only when a count crosses a threshold (0→1 open request). **The data table is present in both modes** — a chart's meaning must never depend on its animation |
| Erasure completed panel; copy-to-clipboard; open/closed toggle (FR-009) | D-7; E-08, E-11; form settings | Green panel crossfades and holds 800ms; icon crossfades to a tick for 2s; switch thumb slides | 300 + 800 / 150 / 200ms | Panel and tick appear instantly and **still hold** — the hold is perception time, not decoration; the thumb jumps and its text label ("Form is open"/"Form is closed") is what changes and is announced. Polite: *"Copied."* |

**Never animated, in either mode:** anything that would move a focused element out from under a cursor or caret; anything triggered by scroll position on `/join` (scrolling back to check an answer must not re-trigger reveals); error text — it appears, it does not fade in over 400ms while she is trying to read it; the focus indicator; content a live region has already announced as present; and anything at all while a destructive request is in flight.

### Notes for architecture

- **No right of access or portability exists in the UI.** FR-023 covers withdrawal and erasure; the published policy also lists access and portability, and FR-013 gives only *admins* an export. D-3 has three cards where the policy implies four. Either add a fourth card fulfilled by FR-013's export, or state on `/privacy` that access requests go to the controller by email.
- **Erasure must reach Brevo.** FR-023 names the record, listing and answers and is silent on the `newsletter_subscribers` row and the Brevo contact. An erasure leaving a live Brevo contact is not an erasure — and a deleted contact could be re-imported by a later backfill with no `unsubscribed_at`, undoing commit c50bbf6.
- **The erasure tombstone's shape, and when the 20-working-day clock starts, are both controller calls, not UX ones.** The tombstone is specified as request id, type, received/completed dates, acting admin and a peppered email hash — the hash is what lets GPC answer "did you delete me?", but with a retained pepper it is arguably still personal data. The clock is specified as running *from the confirmed request* (D-5), not from the D-1 submission, since an unconfirmed submission may not be from the data subject.
- **Routes** `/my-data`, `/my-data/manage`, `/my-data/done`, `/my-data/cancel` and `/admin/data-requests` are invented here. Decide whether the promised `/unsubscribe` is a distinct route — needed for RFC 8058 one-click headers, which most mailbox providers now expect — or an alias into this flow.
- **E-04's countdown assumes the rate limiter returns a retry-after value** — if it cannot, the copy degrades to "Give it a couple of minutes and have another go" with a plain enabled button. And **the `sessionStorage` draft of unsubmitted answers** (relied on by E-01 and E-08) stores personal data on the device before consent is recorded: almost certainly fine, but currently disclosed nowhere.
- **Nothing escalates an overdue request**, and **D-2's masked-email echo** costs screen-reader verbosity (`•` is spelled out by some readers). The queue and dashboard tile satisfy NFR-005 only for an admin who opens the panel; FR-022 is a *Could* covering new submissions, not deadlines. Recommend echoing no address at all and keeping the conditional sentence.
