# EXPERIENCE.md — Data Rights, Errors & Motion

**Draft section for** `bmad-output/EXPERIENCE.md`
**Covers:** FR-023, FR-024, NFR-005, NFR-011, plus the cross-cutting error surface for the whole feature.
**Date:** 2026-08-18
**Status:** Draft for merge into EXPERIENCE.md

> Numbering (`D1`, `D2`, `D-0`…`D-7`, `E-01`…`E-14`) is local to this section and should be
> renumbered on merge into the full EXPERIENCE.md sequence.
> Tokens, personas, primitives and contrast rules come from `bmad-output/ux-shared-context.md`
> and are not restated here except where a value is load-bearing.

**Colour values used below** (all measured against `#fffaf5`):
`#c9107f` primary-700 — button fills with white text, and link text (5.24:1).
`#fc16a0` — display type ≥24px, borders, icons, focus rings only (3.51:1, non-text use).
`#b3261e` error text (6.30:1). `#0f7b3d` success text (5.16:1). `#8a5200` warning text (6.16:1);
`#f59e0b` permitted as a pill border/fill accent, never as text.

---

# Part A — The data-rights journeys

## A.1 What the member is actually being offered

FR-023 requires three *independent* withdrawals, and the last of them is not the same kind of
thing as the first two:

| # | Purpose | What withdrawing it does | Reversible? |
|---|---|---|---|
| 1 | **Publish my business in the directory** | Listing is unpublished. Member record, survey answers and newsletter all continue untouched. | Yes — she can ask to be re-listed via `/join` |
| 2 | **Send me the newsletter** | Newsletter consent withdrawn, `unsubscribed_at` set. Listing and member record untouched. | Yes — re-subscribe any time |
| 3 | **Hold my personal data at all** | Full erasure: member record, listing, survey answers and consent detail deleted. Only an erasure tombstone remains. | **No** |

Purpose 3 is the withdrawal of the FR-004(a) consent that everything else rests on, so
withdrawing it *is* erasure. The UI must say so in those words rather than offering
"withdraw consent to hold my data" as if it were a fourth, milder option.

**The non-negotiable behaviour (FR-023 final criterion):** each control acts on exactly one
purpose. There is no "unsubscribe from everything" shortcut, no cascading checkbox, and taking
a listing down never touches the newsletter. Consent records are append-only (FR-004), so each
withdrawal writes a *new* row citing the same consent version the member originally saw; the
original grant stays visible to admins alongside it.

## A.2 The identity problem, stated plainly

There is no member login and this release does not add one (PRD Out of Scope). So the
withdrawal screen has to identify a person from an email address alone. **A form that acts on
an email address the moment it is typed is not a privacy feature — it is three separate
vulnerabilities.**

**Risk 1 — membership enumeration.** If the form responds differently for a known address
("We found your listing") than for an unknown one ("We have no record of you"), then anyone
with a list of email addresses can test who is a GPC member. GPC's membership is a
1,800-strong group of local mothers. Confirming that a named woman is a member of a
Greenwich parents' group, at a known set of local events, is exactly the disclosure that
matters to someone she has left. This is a safety issue before it is a compliance one.

**Risk 2 — griefing and competitor sabotage.** Directory listings are commercial. A form that
unpublishes a listing on the strength of a typed address lets anyone remove a competitor's
listing, or erase a member's entire record, in ten seconds. Erasure is irreversible by design.

**Risk 3 — mail-bombing and traffic amplification.** An unthrottled "email me a link" form is a
free way to send unsolicited GPC-branded mail to any address.

### The mitigation

**1. The email address only ever causes an email to be sent. It never causes a change.**
Every state-changing action lives behind a link delivered to the inbox that owns the address.
The proof of identity is inbox control, which is the strongest signal available without
building auth, and it is the same standard the member already accepts for password resets.

**2. Two token types, with different powers.** These are the whole security model:

| Token | Where it comes from | Lifetime | Uses | Authorises |
|---|---|---|---|---|
| **Mail token** | Embedded in the footer of every email GPC sends to that member | Rotates on each send; valid until superseded | Many | (a) one-click newsletter unsubscribe, (b) pre-filling her address on D-1. **Nothing else.** |
| **Request token** | Emailed on demand from D-1 | **60 minutes** | **Single use**, invalidated on first successful load | The full request centre (D-3): unlist, unsubscribe, erase |

A forwarded newsletter therefore cannot be used to take someone's listing down or erase
her — the worst it can do is unsubscribe her from a newsletter, which is the tradeoff the
whole email industry already makes and which she can undo in one click. The destructive
powers require a *fresh* round-trip to the inbox, at the moment of the request.

**3. The response to D-1 is constant regardless of whether the address is known.** Same copy,
same screen, same HTTP status, and the server pads its response to a fixed floor (target
≈600ms) so response time does not leak the answer either. Unknown addresses receive no email
at all — GPC does not mail addresses it has no relationship with.

**4. Erasure is never a same-session, irreversible act.** Three things stand between a stolen
token and a deleted member:
   - an explicit second confirmation step (D-4) that names what will be deleted;
   - a confirmation email to the member containing **"This wasn't me — cancel it"**, which
     works for the whole time the request is open. That email is the alarm bell: it reaches the
     genuine owner of the inbox even if someone else initiated the request;
   - an admin action (FR-023) — no request self-executes. Ash sees it, and can see that a
     request was raised and cancelled.

**5. Rate limits on the request endpoint**, shared with the FR-006 limiter: per address
(3 links per hour), per IP (10 per hour), plus the same honeypot field as `/join`. Over-limit
requests return the identical D-2 screen and send nothing (see E-05 for why this exception to
"rate limiting must show an error" is safe here: no member record is at stake, so NFR-011 is
not engaged).

**6. What the verified page may display.** Only what the inbox owner already knows: her first
name, her business name, her listing's public status, and which consents are on. **Never** her
postcode, her survey answers, her signup email in full (masked as `b••••@gmail.com`), or any
admin note. A leaked token must not become a data export.

## A.3 Journey D1 — A member withdraws her listing

**Goal:** Bea takes her business out of the public directory without losing her membership,
her newsletter, or her place in the community — and without emailing an admin and waiting.

**Primary persona:** Bea (Business Mum). Secondary: Ash (admin) actions the request.

**Estimated time:** Member-facing 2–4 minutes, split across two sittings by the email
round-trip (≈40s on D-1, then whenever she opens her inbox, then ≈60s on D-3/D-5).
Admin-facing: under 1 minute (FR-023 requires the *listing* action to be immediate on
approval, not a 20-day wait — the 20-working-day figure is the outer deadline, not the target).

**Entry points:**
1. The footer of any email GPC sends her: *"Manage your data or unsubscribe"* → `/my-data?t=…`
   (mail token, address pre-filled).
2. `/privacy` → the "Your data, your call" block (Screen D-0) → `/my-data` (cold, no token).
3. Direct URL `/my-data`, which must work standalone because it will be pasted into replies
   and shared between members.

**Success criteria:**
- The listing is not returned by any public read within one cache cycle of the admin actioning it.
- Her newsletter consent state is byte-identical before and after (FR-023).
- Her member record, survey answers and consent history are retained.
- The consent ledger gains exactly one new row: a withdrawal of the *publish* purpose, citing
  the version she originally agreed to. The original grant row is unchanged (FR-004).
- She receives one email confirming the listing is down, and the admin panel shows the request
  as complete with the acting admin and timestamp (NFR-013).

### Happy Path

```
   Bea reads the GPC newsletter on her phone
                    │
                    │  footer: "Manage your data or unsubscribe"
                    ▼
   ╔════════════════════════════════════════╗     ┌──────────────────────────────┐
   ║  D-1  /my-data?t=<mail token>          ║◄────┤ ALT entry: /privacy →         │
   ║  "Your data, your call"                ║     │ "Your data, your call" block  │
   ║   · address pre-filled + masked        ║     │ (D-0) → /my-data, cold        │
   ║   · [ Email me a secure link ]         ║     └──────────────────────────────┘
   ╚════════════════════╤═══════════════════╝
                        │  POST /api/data-request/start
                        │  (constant response, constant time)
                        ▼
   ╔════════════════════════════════════════╗
   ║  D-2  "Check your inbox"               ║   Never states whether the address
   ║   · resend available after 60s         ║   is known to GPC. §A.2 risk 1.
   ╚════════════════════╤═══════════════════╝
                        │  she opens the email, taps the link
                        │  (request token: 60 min, single use)
                        ▼
   ╔════════════════════════════════════════╗
   ║  D-3  /my-data/manage                  ║
   ║  "Hi Bea — what would you like to      ║
   ║   change?"                             ║
   ║   ┌ Directory listing   [Take it down] ║ ◄── Bea chooses this
   ║   ┌ Newsletter          [Stop it]      ║
   ║   ┌ Everything          [Delete it all]║
   ╚════════════════════╤═══════════════════╝
                        │  taps "Take my listing down"
                        │  inline confirm inside the card (no modal —
                        │  reversible action, low ceremony)
                        ▼
   ╔════════════════════════════════════════╗
   ║  D-5  /my-data/done                    ║──►  EMAIL 2: "We've got your request"
   ║  "We've got it."                       ║     incl. "This wasn't me — cancel it"
   ║  · what happens next, by when          ║
   ╚════════════════════╤═══════════════════╝
                        │  request row written
                        ▼
   ╔════════════════════════════════════════╗
   ║  D-6  /admin/data-requests             ║   Visible within one page load (NFR-005).
   ║  Nav badge: "Data requests (1)"        ║   Row: "Unlist · Bea's Baby Massage ·
   ║  Admin home tile updates               ║   due Tue 15 Sep · 20 working days left"
   ╚════════════════════╤═══════════════════╝
                        ▼
   ╔════════════════════════════════════════╗
   ║  D-7  Request detail                   ║
   ║  [ Unpublish the listing ]  ← one tap  ║──►  EMAIL 3: "Your listing is down"
   ║  → request auto-marked Complete        ║
   ║  → listing_moderation_log row written  ║
   ╚════════════════════════════════════════╝
                        │
                        ▼
   Public directory no longer returns the listing.
   Member record, survey answers, newsletter: unchanged.
```

### Decision Points & Alternative Paths

| Trigger | Display | Recovery |
|---|---|---|
| Arrives cold at `/my-data` with no token | Empty email field, label "Your email address", hint "The address you signed up with." | Types it. Autofill via `autocomplete="email"`, `inputmode="email"`. |
| Arrives with a **mail token** | Field pre-filled and shown as a read-only chip: `b••••@gmail.com` with a "Not you? Use a different address" text button | Text button clears the chip and reveals the editable field, focus moves into it |
| Email address is not one GPC holds | **Identical** D-2 screen. No email is sent. | Nothing to recover — by design. D-2 carries the line "If you're not sure which address you used, try the other one." |
| Link tapped after 60 minutes | D-1 with an inline notice above the field: *"That link has expired — they only last an hour. Pop your email in and we'll send a fresh one."* Icon `Clock`, `#8a5200`. `role="status"`. | The field is pre-filled from the expired token's address claim (safe — it came from her inbox) and focus lands on the submit button |
| Link tapped a second time | Same expired treatment, copy: *"That link has already been used. Here's a fresh one — pop your email in below."* | As above |
| She has **no listing** (Career Mum, or never opted in) | D-3 renders the listing card in its **Empty** state: *"You're not in the directory. If you'd like to be, you can ask on the join form."* with a link to `/join`. The card's button is absent, not disabled. | Newsletter and erasure cards behave normally |
| Her listing is **pending or held**, not yet published | Listing card status reads "Waiting for review". Button label changes to *"Withdraw my request"*; body copy: *"It hasn't gone live, so nothing of yours is public right now. Withdrawing stops it going live."* | Same flow; admin request type is `withdraw_pending` and the admin action is "Cancel the pending listing" |
| She taps "Take my listing down", then hesitates | Card expands into an inline confirm: heading *"Take your listing down?"*, body *"It'll come off the directory. Your membership and your newsletter stay exactly as they are — this only affects the listing."* Buttons: `Yes, take it down` (primary) / `Keep it up` (secondary) | "Keep it up" collapses the confirm and returns focus to the original button |
| She wants two things (unlist **and** unsubscribe) | D-3 does not navigate away after the first action. The actioned card collapses into a completed state with a `CircleCheck` and *"Requested — we've emailed you the details."* The other cards remain live for the rest of the token's 60 minutes. | She continues; D-5 is reached via a persistent "I'm done" button at the foot of D-3, or automatically after the erasure action (which ends the session) |
| The request POST fails (network/500) | See E-01/E-02. The card stays expanded, nothing is marked done, the button returns to its resting label. | Retry button in the error; idempotency key means a retry cannot create two requests |
| She receives the confirmation email but did not make the request | Email contains *"This wasn't me — cancel it"* → `/my-data/cancel?t=…` → D-5 in its **Cancelled** state | Request is voided, admin queue row moves to `Cancelled by member`, no data changes |

### Drop-off Risk Notes

The email round-trip is the single biggest drop-off point, and it is a deliberate cost. Bea is
on her phone in the evening; leaving the site to check mail is exactly the moment she gets
interrupted. Three mitigations, none of which remove the round-trip:

- **D-2 tells her what the subject line is** — *"Look for 'Manage your GPC data'"* — so she can
  search rather than scroll. Missing this detail is the most common reason these flows fail.
- **The 60-minute expiry is generous on purpose.** A 15-minute token would be more secure and
  would strand a meaningful share of users; an hour survives bedtime.
- **The mail token entry point removes one step entirely** for the majority who arrive from an
  email. She never types her address.

The second risk is *misdirected intent*. A member who wants to stop the newsletter will often
land here from a newsletter footer, and if the listing card is the first and most visually
prominent thing on D-3 she may act on the wrong one. Mitigation: on D-3 the card matching the
`intent` hint carried in the mail token is ordered first and carries a subtle
`ring-2 ring-primary` marker; the other cards are unchanged and unemphasised. The ordering is a
hint, never a pre-selection.

The third risk is *fear of the erasure card*. Putting "Delete everything" on the same screen as
"take my listing down" risks a member abandoning because she thinks she has to choose between
staying and being unlisted. Mitigation: the erasure card is visually and positionally last,
separated by a rule, headed *"Or leave completely"*, and every one of the first two cards
explicitly states what it does **not** touch. The copy does the reassurance work; the layout
does the de-escalation.

Finally: **there is no "are you sure you want to leave?" retention interstitial**, no offer of a
discount, no pause-instead-of-leave. The published policy promises withdrawal at any time.
Anything that adds friction to a withdrawal specifically is a dark pattern and would undermine
the compliance claim the whole feature exists to make.

## A.4 Journey D2 — A member requests full erasure

**Goal:** A member asks GPC to delete everything it holds about her, and can trust that it
happened, without emailing anyone and without having to chase.

**Primary persona:** Any member. In practice most often Carla (Career Mum) who joined, found it
wasn't for her, and wants a clean exit — and occasionally a member in a safeguarding-adjacent
situation for whom the request is urgent. Secondary: Ash (admin), who executes it; the
controller (Aster) is accountable for the 20-working-day commitment.

**Estimated time:** Member-facing 3–5 minutes including the round-trip. Admin-facing 2–3
minutes, of which most is reading what is about to be destroyed.

**Entry points:** identical to D1 — email footer link, the `/privacy` block (D-0), or `/my-data`
direct. There is deliberately **no separate "delete me" URL**; a member arrives at the same
request centre and chooses erasure there, so that the reversible options are always visible
first.

**Success criteria:**
- The request is visible in the admin panel within one page load of being made (NFR-005).
- The admin can complete it in a single workflow, with no database access at any point (NFR-005).
- After completion: no member record, no listing, no survey answers, no consent detail, and no
  newsletter subscription for that person exists in any table.
- What remains is an **erasure tombstone**: request id, request type, date received, date
  completed, acting admin, and a peppered hash of the email — enough to prove the request was
  honoured, not enough to identify her. (See Gaps — the controller must sign off that this is
  acceptable minimisation.)
- She receives a completion email **before** the delete commits.
- Deadline compliance is evidenced: the request record carries received-date and completed-date,
  feeding the "Data-subject requests completed in ≤ 20 working days" success metric.

### Happy Path

```
   Entry (email footer / D-0 privacy block / direct)
                    │
                    ▼
   ╔════════════════════════════════════════╗
   ║  D-1  /my-data → D-2 "Check inbox"     ║   identical to D1 — same form,
   ╚════════════════════╤═══════════════════╝   same constant response
                        │  request token (60 min, single use)
                        ▼
   ╔════════════════════════════════════════╗
   ║  D-3  /my-data/manage                  ║
   ║  ───────────── Or leave completely ────║  ← separated, last, quieter
   ║   ┌ Delete everything                  ║
   ║   │  [ Delete everything you hold ]    ║  destructive button style
   ╚════════════════════╤═══════════════════╝
                        │  opens a real <dialog>: role=dialog,
                        │  aria-modal, focus trap, Escape closes
                        ▼
   ╔════════════════════════════════════════╗
   ║  D-4  Erasure confirmation dialog      ║
   ║  · itemised list of what goes          ║
   ║  · itemised list of what stays and why ║
   ║  · [ ] I understand this can't be undone
   ║  · [ Yes, delete everything ] (disabled║
   ║      until the box is ticked)          ║
   ╚════════════════════╤═══════════════════╝
                        │  POST /api/data-request/create {type: 'erasure'}
                        ▼
   ╔════════════════════════════════════════╗
   ║  D-5  /my-data/done  (Success)         ║──► EMAIL 2: "We've got your request"
   ║  "We've got it. We'll delete           ║    incl. "This wasn't me — cancel it"
   ║   everything by <date>."               ║    (live until the erasure runs)
   ║  Token is burned here — the session    ║
   ║  ends, D-3 is not reachable again      ║
   ╚════════════════════╤═══════════════════╝
                        ▼
   ╔════════════════════════════════════════╗
   ║  D-6  /admin/data-requests             ║   Row badge: ERASURE (highest
   ║  Erasure rows sort above unlist rows   ║   prominence), due date, days left
   ╚════════════════════╤═══════════════════╝
                        ▼
   ╔════════════════════════════════════════╗
   ║  D-7  Request detail — erasure workflow║
   ║  Step 1  Review what will be deleted   ║   counts, not raw PII, by default
   ║  Step 2  Type the member's email       ║   admin-side typed confirmation
   ║  Step 3  [ Erase this member ]         ║
   ║          ├─ sends EMAIL 3 (completion) ║   ── send FIRST
   ║          └─ commits the delete         ║   ── then delete
   ╚════════════════════╤═══════════════════╝
                        ▼
   Tombstone written. Request row shows "Completed <date> by <admin>".
   Everything else is gone.
```

### Decision Points & Alternative Paths

| Trigger | Display | Recovery |
|---|---|---|
| She opens the erasure card but has a **published listing** | D-4 lists it explicitly first: *"Your directory listing, Bea's Baby Massage — it'll come off the site."* Plus an offer, stated once and neutrally: *"If you only want the listing gone, close this and use 'Take my listing down' instead."* | "Close" returns to D-3 with focus restored to the erasure button |
| She ticks nothing and taps the disabled button | Button is `disabled` + `aria-disabled="true"`; tapping does nothing visually but the associated hint `"Tick the box above to continue"` is already in the accessible description | Ticking the box enables it; the enable is announced via the live region: *"Delete button is now available."* |
| She presses Escape / taps the backdrop | Dialog closes, nothing is sent, focus returns to the "Delete everything you hold" button | Nothing lost |
| The erasure POST fails | E-01/E-02 inside the dialog; the dialog stays open, checkbox stays ticked, button returns to resting state | Retry (idempotency key prevents duplicates) |
| She cancels via the email link, before an admin acts | `/my-data/cancel?t=…` → D-5 **Cancelled** state: *"Cancelled. Nothing has been deleted and nothing has changed."* | Admin row moves to `Cancelled by member`, greyed, retained for evidence |
| She cancels **after** the admin has erased | Cancel link resolves to D-5 **Too late** state: *"This request has already been completed — your data has been deleted. There's nothing left to cancel. If you didn't ask for this, please contact us."* + controller contact | Human path only. This is the residual risk of the design and is stated honestly rather than hidden |
| Admin opens the request and the member has **already been erased** by a different admin | D-7 renders its **Empty/Completed** state: *"This request was completed on <date> by <admin>. There is nothing left to erase."* | No destructive control is rendered at all |
| The completion email fails to send (E-08) | Erasure does **not** proceed. Request stays `Ready to erase` with an error banner. | Admin retries the send, or uses "Erase without emailing" which requires a typed reason recorded against the request |
| 20-working-day deadline approaches / passes | See D-6 states: amber "Due in N working days" at ≤5, red "Overdue by N working days" past due, and the admin-home tile turns from neutral to the same state | Sorting puts overdue first; nothing auto-escalates (no notification channel exists — see Gaps) |

### Drop-off Risk Notes

Erasure has the opposite drop-off profile to a normal funnel: **the member abandoning is not
automatically a bad outcome, but it must never be caused by confusion.** The specific failure
to avoid is a member who wanted only to be unlisted, clicking erasure because it was the
clearest-looking button, and losing her survey answers and newsletter forever. Hence: erasure
is last, quieter, behind a dialog, requires a tick, and D-4 offers the narrower alternative
once, in neutral words.

The mirror-image failure is a member who *does* want erasure being worn down by the ceremony
and giving up — which turns a self-service right into an unanswered email. Two guards: the
ceremony is exactly two taps and one tick, never a typed word or a re-authentication; and the
copy never argues with her.

The delay between request and completion is the other risk. She has no account and cannot check
status. Mitigation: D-5 and the confirmation email both state the *date* by which it will be
done, computed from working days, not a vague "soon" — *"We'll have this done by Tuesday 15
September at the latest, and usually much sooner."* A stated date is the only thing that stops
a follow-up email to a volunteer inbox.

Finally, an honest one: **a stolen inbox is a completed erasure.** The confirmation email plus
the admin step are the only guards, and a genuine attacker with inbox access will delete the
warning email too. This is accepted, because the alternative — refusing self-service erasure —
breaks the published policy. It is recorded in Gaps for the controller.

## A.5 Transactional email copy

Every email carries, per FR-021: the controller's identity (*"Greenwich Parents & Carers CIC,
company 16387545. Data controller: Aster Thackery."*), a link to `/privacy`, and the mail-token
footer link *"Manage your data or unsubscribe"*.

**EMAIL 1 — the secure link** (sent only if the address is known)
> **Subject:** Manage your GPC data
> Hi Bea,
> Someone asked to manage the GPC data held for this email address. If that was you, here's your link:
> **[ Manage my data ]**
> It works once, and it stops working in an hour.
> If it wasn't you, you can ignore this email — nothing has changed and nothing will.

**EMAIL 2a — listing withdrawal requested**
> **Subject:** We've got your request
> Hi Bea,
> You've asked us to take **Bea's Baby Massage** off the GPC directory. We'll do that shortly, and by **Tuesday 15 September** at the very latest.
> Your membership and your newsletter aren't affected — this only takes down the listing.
> Didn't ask for this? **[ This wasn't me — cancel it ]**

**EMAIL 2b — erasure requested**
> **Subject:** We've got your request
> Hi Bea,
> You've asked us to delete everything we hold about you. We'll do that by **Tuesday 15 September** at the latest, and usually much sooner.
> That means your membership record, your answers to the join form, your directory listing and your newsletter subscription. Once it's done we can't get any of it back.
> Changed your mind, or didn't ask for this? **[ This wasn't me — cancel it ]** — that link works right up until we run the deletion.

**EMAIL 3a — listing is down**
> **Subject:** Your listing is down
> Hi Bea,
> **Bea's Baby Massage** is no longer on the GPC directory. Anyone with the old link will see a note saying it's no longer listed.
> You're still a member and your newsletter is unchanged. If you'd like to be listed again one day, just fill in the join form — we'd be glad to have you back.

**EMAIL 3b — erasure complete**
> **Subject:** Everything's been deleted
> Hi Bea,
> We've deleted everything we held about you: your membership record, your form answers, your directory listing and your newsletter subscription.
> We've kept one thing, and only one: a dated note that a deletion request was made and completed, with no name or email in it. We need that to show we did what we said we'd do.
> This is the last email you'll get from us. Thank you for being part of GPC.

---

# Part A (cont.) — Screens

## Screen D-0 — `/privacy` → "Your data, your call" block

**Purpose:** Make FR-024's disclosure page actionable. The privacy page currently tells members
they *have* rights; this block is where the right becomes a button. It also satisfies FR-023's
"the privacy page" entry point.

**Entry from:** `/privacy` (existing page), footer nav, consent copy on `/join` (FR-004 requires
consent text to link here), every GPC email's privacy link.

**Exits to:** `/my-data` (D-1). No other exit.

### Layout Wireframe (mobile-first, 320px)

```
┌──────────────────────────────────────┐
│  … existing privacy page content …   │
│                                      │
│  ══════════════════════════════════  │
│                                      │
│ ┌── Card (rounded-2xl, p-6) ───────┐ │
│ │                                  │ │
│ │  ⚙  Your data, your call     h2  │ │
│ │                                  │ │
│ │  You can take your directory     │ │
│ │  listing down, stop the          │ │
│ │  newsletter, or ask us to delete │ │
│ │  everything we hold — whenever   │ │
│ │  you like, without emailing      │ │
│ │  anyone.                         │ │
│ │                                  │ │
│ │  ┌────────────────────────────┐  │ │
│ │  │   Manage my data           │  │ │ 48px, #c9107f
│ │  └────────────────────────────┘  │ │
│ │                                  │ │
│ │  We'll email you a link to make  │ │
│ │  sure it's you. We aim to        │ │
│ │  action every request within 20  │ │
│ │  working days.                   │ │
│ └──────────────────────────────────┘ │
│                                      │
│  … rest of privacy page …            │
└──────────────────────────────────────┘
```

**Tablet / Desktop variations:** the card is capped at `max-w-2xl` and sits within the existing
prose column rather than spanning it; the button becomes `inline-flex` at its natural width
rather than full-bleed. No other change — a two-column treatment would separate the promise from
the button.

### Component Hierarchy

1. `Card` (existing) — consumer supplies `p-6 border-2 border-primary/30`
2. **NEW** `RightsCallout` — the block itself, so it can be reused verbatim at the foot of `/join`'s
   confirmation state and in the admin-authored form-closed message
3. `SectionHeading` (existing) — **not** usable here: it always renders `<h2>` with centred
   defaults and an underline; acceptable, but the block sits mid-page so `align="left"`,
   `showUnderline={false}` must be passed
4. Lucide `Settings2` icon, 20px, `#c9107f`, `aria-hidden="true"`
5. `Button` (existing, `variant="primary"`) — **requires the primary-variant fix**: current
   gradient `from-primary to-dark` puts white text on `#fc16a0` at 3.64:1 and fails AA. This
   block must use the corrected fill `#c9107f`

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Page load | As wireframed | Static content, `<section aria-labelledby="rights-heading">` |
| **Loading** | N/A — static content rendered with the page, no fetch | — | — |
| **Empty** | N/A — content is authored, never data-driven | — | — |
| **Error** | N/A — nothing can fail; the button is a link to `/my-data` | — | — |
| **Success** | N/A — no action completes here | — | — |
| **Disabled** | N/A — the right cannot be switched off. Even when the join form is closed (FR-009), data rights remain available | — | — |

### Interactions & Animations

| Interaction | Behavior | Timing | prefers-reduced-motion |
|---|---|---|---|
| Card enters viewport | Fade + 12px rise | 400ms, `ease-out`, no stagger | No transform, no fade — rendered at final state |
| Button hover (pointer) | Background darkens `#c9107f` → `#a80d6a` | 150ms `ease-out` | Colour change retained (not motion); the site's existing `hover:scale-105` is **removed** on this button |
| Button focus | 2px `#fc16a0` ring, 2px offset | Instant | Unchanged — focus indicators must never be suppressed |
| Button press | 2% scale-down | 100ms | Suppressed; replaced by an instant background darken |

### Accessibility Annotations

- **Heading level:** `<h2 id="rights-heading">` — the privacy page's `<h1>` already exists.
- **Landmark role:** `<section aria-labelledby="rights-heading">` inside the page's `<main>`.
- **Focus management:** none needed (no state change). The button is a real `<a href="/my-data">`
  so it is in the tab order natively and supports middle-click/open-in-new-tab.
- **Screen-reader notes:** icon is `aria-hidden`. The 20-working-day sentence is part of the
  block's readable text, not a `title` attribute.
- **Keyboard operation:** Tab to the link, Enter activates. Nothing else is interactive.

---

## Screen D-1 — `/my-data` — Start a request

**Purpose:** Take an email address and cause an email to be sent. Nothing else. This screen must
be incapable of changing a member's data (§A.2).

**Entry from:** email footer link (with mail token), D-0, direct URL, expired/used-token redirect.

**Exits to:** D-2 (always, regardless of outcome).

### Layout Wireframe (mobile-first, 320px)

```
┌──────────────────────────────────────┐
│  ☰   GPC                             │  existing Navbar
├──────────────────────────────────────┤
│                                      │
│  Your data, your call            h1  │
│  ▔▔▔▔▔▔                              │
│                                      │
│  Take your listing down, stop the    │
│  newsletter, or ask us to delete     │
│  everything. Nothing changes until   │
│  you confirm from a link we email    │
│  you.                                │
│                                      │
│  ┌─ (expired-link notice, if any) ─┐ │
│  │ 🕐 That link has expired — they │ │  role="status"
│  │    only last an hour. Pop your  │ │  #8a5200 on #fff8ec
│  │    email in and we'll send a    │ │
│  │    fresh one.                   │ │
│  └─────────────────────────────────┘ │
│                                      │
│  Your email address *                │  <label for="dr-email">
│  ┌────────────────────────────────┐  │
│  │ you@example.com                │  │  44px min, rounded-xl
│  └────────────────────────────────┘  │
│  The address you signed up with.     │  #4a4a5e, id=dr-email-hint
│                                      │
│  [ hidden honeypot: "Company"     ]  │  off-screen, tabindex -1,
│                                      │  aria-hidden, autocomplete=off
│  ┌────────────────────────────────┐  │
│  │     Email me a secure link     │  │  48px, #c9107f, white text
│  └────────────────────────────────┘  │
│                                      │
│  ┌──────────────────────────────────┐│
│  │ 🛈 We never say whether an       ││
│  │   address is on our list. That   ││
│  │   keeps everyone's membership    ││
│  │   private, including yours.      ││
│  └──────────────────────────────────┘│
│                                      │
│  How we handle your data →           │  #c9107f link → /privacy
│                                      │
├──────────────────────────────────────┤
│  Footer                              │
└──────────────────────────────────────┘
```

**Mail-token variant** — the input is replaced by a chip:

```
│  Your email address                  │
│  ┌────────────────────────────────┐  │
│  │ ✉  b••••@gmail.com             │  │  read-only chip, not an input
│  └────────────────────────────────┘  │
│  Not you? Use a different address    │  text button, 44px hit area
```

**Tablet / Desktop variations:** content column capped at `max-w-xl` and centred; the button
becomes auto-width, left-aligned under the field. The reassurance callout moves to sit beside
the field at `lg:` as a right-hand aside only if the column is ≥ 960px — otherwise it stays
below. Nothing else differs; this screen is deliberately narrow at every size because it is one
field.

### Component Hierarchy

1. `<main>` → **NEW** `NarrowPage` shell (`max-w-xl mx-auto px-4 py-16 md:py-24`) — reusable by
   D-2 and D-5
2. **NEW** `PageHeading` — an `<h1>` primitive the site does not have (`SectionHeading` is
   hard-coded to `<h2>` and cannot serve as a page heading)
3. **NEW** `Alert` — `{ tone: 'info'|'warning'|'error'|'success', icon, children, live }`.
   Covers the expired-link notice, the reassurance callout, and every error in Part B.
   The site currently has a copy-pasted red `<div>` per page and no shared primitive
4. **NEW** `Field` — wraps `<label htmlFor>` + control + hint + error, wiring `aria-describedby`
   and `aria-invalid`. **This is the single most important new component in the feature**: the
   site has no `htmlFor`/`id` pairing anywhere (a11y gap 1) and NFR-008 forbids inheriting that
5. **NEW** `HoneypotField` — visually hidden decoy (FR-006), `tabindex="-1"`, `aria-hidden="true"`,
   `autocomplete="off"`. Hidden with `position:absolute; left:-9999px`, **never** `display:none`
   or `hidden` (bots skip those; assistive tech is excluded by `aria-hidden` instead)
6. `Button` (existing, primary) — **requires the NEW `loading` and `disabled` states**; the
   current component has neither
7. `EmailChip` — **NEW**, the mail-token read-only variant

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Page load, no token or valid mail token | Field empty or chip-filled; button enabled | `<form>` with `noValidate`; label bound by `htmlFor="dr-email"`; hint via `aria-describedby="dr-email-hint"` |
| **Loading** | Submit pressed, request in flight | Button label → "Sending…", button `disabled` + `aria-busy="true"`, static three-dot glyph (no spinner under reduced motion); field becomes `readonly` (not `disabled`, so its value is still submitted and still announced) | Live region `role="status" aria-live="polite"` announces "Sending your request" |
| **Empty** | N/A — the screen has one field and no data to be empty of | — | — |
| **Error** | Client-side: blank or malformed address. Server-side: 500, network failure, timeout (Part B E-01–E-03) | Field-level error under the input, red `#b3261e`, `AlertCircle` icon, 1px `#b3261e` border on the field; form-level errors render in `Alert tone="error"` above the field | `aria-invalid="true"`, `aria-describedby="dr-email-hint dr-email-error"`, error node `role="alert"`. Focus moves to the field |
| **Success** | Server responded 200 (or rate-limited, or address unknown — all identical) | Navigate to D-2 (client-side route change, no reload) | Focus moved to D-2's `<h1>` with `tabIndex={-1}`; D-2's heading text is what gets announced |
| **Disabled** | While `Loading`. Also when a genuine hard-failure state is showing and no retry is possible (rare) | Button `disabled`, `aria-disabled="true"`, opacity 60%, cursor `not-allowed`, **contrast of the disabled label still ≥ 4.5:1** (use `#6b6b7d` on `#e8e8ee`, not a translucent white) | `aria-disabled` in addition to `disabled` so the button is still announced rather than skipped by some AT |

### Interactions & Animations

| Interaction | Behavior | Timing | prefers-reduced-motion |
|---|---|---|---|
| Page enter | Content fades in | 300ms `ease-out` | No animation; final state immediately |
| Field focus | Border `#d4d4dc` → `#fc16a0`, plus 2px offset ring | 120ms | Colour transition retained (no movement); ring appears instantly |
| Inline validation on blur | Error text expands below the field | 180ms height + fade | Appears instantly at full height |
| Submit → Loading | Label crossfades to "Sending…" | 120ms crossfade | Instant text swap |
| Loading indicator | Three-dot animated ellipsis in the button | 1.2s loop | **Static** "Sending…" with no animation; the live region carries the state instead |
| "Not you?" reveals the field | Chip collapses, input expands | 200ms | Instant swap |
| Route change to D-2 | Cross-fade, 8px rise | 250ms | Instant |

### Accessibility Annotations

- **Heading level:** `<h1>` "Your data, your call". One `<h1>` per page.
- **Landmark role:** `<main id="main">`; a skip-to-content link is added (a11y gap 7) since this
  page is reached from an email and the navbar is otherwise the first tab stop.
- **Focus management:** On mount, focus is *not* stolen — the page loads at the top and the
  member tabs in. On validation failure, focus moves to the offending field. On success, the
  route changes and focus is moved programmatically to D-2's `<h1>` (`tabIndex={-1}`, and the
  attribute is removed on blur so it never becomes a permanent tab stop).
- **Screen-reader notes:** the honeypot is `aria-hidden="true"` and out of the tab order, so it
  is never presented; sighted-but-AT users are not tricked into filling it. The reassurance
  callout is ordinary content, not a live region — it must not be announced repeatedly.
- **Keyboard operation:** Tab → skip link → nav → email field → (text button, if chip variant) →
  submit. Enter in the field submits. Nothing requires a pointer.

---

## Screen D-2 — `/my-data` — "Check your inbox"

**Purpose:** Absorb the security requirement that the response is constant. This is the screen
that must be indistinguishable for a known address, an unknown address, a rate-limited request,
and a honeypot-tripped request.

**Entry from:** D-1 submit.
**Exits to:** the member's email client (out of app); "Send another link" returns to D-1.

### Layout Wireframe (mobile-first, 320px)

```
┌──────────────────────────────────────┐
│  ☰   GPC                             │
├──────────────────────────────────────┤
│                                      │
│        ✉                             │  56px, #fc16a0 (decorative)
│                                      │
│  Check your inbox                h1  │
│                                      │
│  If b••••@gmail.com is on our list,  │
│  we've just emailed it a link.       │
│                                      │
│  ┌──────────────────────────────────┐│
│  │ Look for the subject line        ││
│  │ "Manage your GPC data".          ││
│  │ The link works once and stops    ││
│  │ working in an hour.              ││
│  └──────────────────────────────────┘│
│                                      │
│  Nothing has changed yet. Nothing    │
│  will until you use that link.       │
│                                      │
│  Not arrived? Check your spam        │
│  folder, or:                         │
│                                      │
│  ┌────────────────────────────────┐  │
│  │   Send another link  (0:47)    │  │  disabled 60s, then enabled
│  └────────────────────────────────┘  │
│                                      │
│  Used a different email address?     │
│  Start again →                       │
│                                      │
│  🛈 We don't say whether an address  │
│    is on our list — that keeps       │
│    everyone's membership private.    │
│                                      │
└──────────────────────────────────────┘
```

The masked address (`b••••@gmail.com`) is safe to echo: it is the string the member just typed,
not a lookup result.

**Tablet / Desktop variations:** same single column at `max-w-xl`, vertically centred in the
viewport when the content is shorter than the fold. No layout change.

### Component Hierarchy

1. **NEW** `NarrowPage` (shared with D-1, D-5)
2. **NEW** `PageHeading` (`<h1>`)
3. Lucide `MailCheck` icon 56px, `#fc16a0`, `aria-hidden` — permitted at this size as a
   decorative non-text element
4. `Card` (existing) for the "look for the subject line" panel, `p-4 bg-white/60`
5. `Button` (existing, `variant="secondary"`) — with the **NEW disabled state** for the cooldown
6. **NEW** `CooldownButton` — wraps `Button`, owns the 60s countdown and its announcement
7. **NEW** `Alert tone="info"`

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Arrival from D-1 | As wireframed, resend in cooldown | `role="status"` region announces "Check your inbox. If that address is on our list, we've emailed it a link." once on mount |
| **Loading** | Resend pressed | Resend button "Sending…", `aria-busy` | Live region: "Sending another link" |
| **Empty** | N/A — no collection is rendered | — | — |
| **Error** | Resend fails (network/500) | `Alert tone="error"` above the button: *"We couldn't send that. Have a look at your connection and try again."* | `role="alert"`, focus moves to the Alert's container (`tabIndex={-1}`) |
| **Success** | Resend succeeds | Resend button returns to cooldown; `Alert tone="success"`: *"Sent again. Give it a minute to arrive."* | `role="status"`, polite |
| **Disabled** | Resend cooldown active (60s) | Button disabled, label *"Send another link (0:47)"* | `aria-disabled="true"`; the countdown is **not** in a live region (it would announce every second). Instead the accessible name is updated only at 60s/30s/10s/0s, and at 0s the live region says "You can send another link now." |

### Interactions & Animations

| Interaction | Behavior | Timing | prefers-reduced-motion |
|---|---|---|---|
| Screen enter | Envelope icon scales 0.9→1 with fade | 350ms `ease-out` | No scale, no fade — rendered final |
| Cooldown countdown | Numeric text updates each second | 1s tick | Unchanged (text change is not motion) |
| Cooldown ring (optional progress arc around the button) | Sweeps 0→360° over 60s | 60s linear | **Not rendered at all**; the numeric countdown carries the information |
| Resend success alert | Slides down 8px + fades in | 200ms | Appears instantly |

### Accessibility Annotations

- **Heading level:** `<h1>` "Check your inbox".
- **Landmark role:** `<main>`. The status message is a sibling `role="status"` region inside main.
- **Focus management:** focus is moved to the `<h1>` on arrival (route change from D-1) so the
  screen reader starts here rather than at the top of the document.
- **Screen-reader notes:** the reassurance sentence "Nothing has changed yet" is read as part of
  the page, not the live region. The masked email must be announced as an email — render it as
  plain text, not with `•` characters that some screen readers spell out; use the string
  `b` + `••••` inside a `<span aria-label="your email address, first letter b, at gmail dot com">`
  wrapper, or simply omit masking and echo nothing. **Preferred: echo nothing.**
  (See Gaps — echoing a masked address is a usability/verbosity tradeoff, flagged for review.)
- **Keyboard operation:** Tab → resend button (skipped while disabled by some AT — hence
  `aria-disabled` rather than removal) → "Start again" link.

---

## Screen D-3 — `/my-data/manage` — Verified request centre

**Purpose:** The one screen where a member exercises FR-023. Three independent controls, one per
consent purpose, with the destructive one deliberately last and de-emphasised.

**Entry from:** the request-token link in Email 1. **No other entry.** A direct visit without a
valid token redirects to D-1 with the expired-link notice.

**Exits to:** D-5 (after any action), D-1 (expired token), `/privacy`.

### Layout Wireframe (mobile-first, 320px)

```
┌──────────────────────────────────────┐
│  ☰   GPC                             │
├──────────────────────────────────────┤
│                                      │
│  Hi Bea — what would you       h1    │
│  like to change?                     │
│                                      │
│  ┌──────────────────────────────────┐│
│  │ ✓ It's you. This page works for  ││ #0f7b3d on #f0f8f2
│  │   the next 60 minutes.           ││
│  └──────────────────────────────────┘│
│                                      │
│ ┌─ Card ───────────────────────────┐ │
│ │ 📣 Your directory listing    h2  │ │
│ │ Bea's Baby Massage               │ │
│ │ [ Live on the site ]  ← Badge    │ │
│ │                                  │ │
│ │ Taking it down removes it from   │ │
│ │ the public directory. Your       │ │
│ │ membership and your newsletter   │ │
│ │ stay exactly as they are.        │ │
│ │                                  │ │
│ │ ┌──────────────────────────────┐ │ │
│ │ │  Take my listing down        │ │ │ 48px, secondary
│ │ └──────────────────────────────┘ │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌─ Card ───────────────────────────┐ │
│ │ ✉ The GPC newsletter         h2  │ │
│ │ [ Subscribed ]  ← Badge          │ │
│ │                                  │ │
│ │ Stopping the newsletter doesn't  │ │
│ │ affect your listing or your      │ │
│ │ membership.                      │ │
│ │                                  │ │
│ │ ┌──────────────────────────────┐ │ │
│ │ │  Stop sending the newsletter │ │ │
│ │ └──────────────────────────────┘ │ │
│ └──────────────────────────────────┘ │
│                                      │
│  ──────────────────────────────────  │
│  Or leave completely             h2  │
│                                      │
│ ┌─ Card (border #b3261e/30) ───────┐ │
│ │ 🗑 Delete everything             │ │
│ │                                  │ │
│ │ We'll delete your membership     │ │
│ │ record, your answers to the join │ │
│ │ form, your directory listing and │ │
│ │ your newsletter subscription.    │ │
│ │ This can't be undone.            │ │
│ │                                  │ │
│ │ ┌──────────────────────────────┐ │ │
│ │ │ Delete everything you hold   │ │ │ destructive
│ │ └──────────────────────────────┘ │ │
│ └──────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐  │
│  │      I'm done for now          │  │ → D-5 / home
│  └────────────────────────────────┘  │
│                                      │
│  How we handle your data →           │
└──────────────────────────────────────┘
```

**Tablet / Desktop variations:** cards remain a single column at `max-w-2xl`. They are **not**
placed side by side — a three-across row makes the destructive card look like a peer of the
other two, which is precisely the confusion Journey D2's drop-off notes warn about. The only
change above `md:` is increased card padding (`p-6` → `p-8`) and the button becoming auto-width.

### Component Hierarchy

1. **NEW** `NarrowPage`
2. **NEW** `PageHeading` (`<h1>`)
3. **NEW** `Alert tone="success"` — the "It's you" confirmation
4. **NEW** `ConsentCard` — `{ icon, title, statusBadge, body, actionLabel, onConfirm, tone }`.
   One per purpose. Owns its own inline-confirm state so a confirm never becomes a modal for the
   reversible actions
5. `Card` (existing) as `ConsentCard`'s shell
6. `Badge` (existing) — **needs NEW variants**: `live`, `pending`, `subscribed`, `unsubscribed`,
   `not-listed`. Existing variants (`free`/`sold-out`/`new`/`upcoming`/`past`) do not fit
7. `Button` (existing) — `variant="secondary"` for the two reversible actions; **NEW
   `variant="destructive"`** for erasure (`bg-[#b3261e] text-white`, 6.30:1)
8. Lucide `Megaphone`, `Mail`, `Trash2`, `CircleCheck`, all `aria-hidden`
9. **NEW** `ErasureDialog` (Screen D-4) — mounted from card 3

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Valid token, data loaded | Three cards, each in its own resting state | `<h1>` focused on mount; each card is `<section aria-labelledby="card-N-heading">` |
| **Loading** | Token being validated / member snapshot fetching | Skeleton: three `Card`-shaped blocks with a neutral `#ece9f0` fill, heading placeholder bars. **No spinner** — the shape of the answer is known | Live region: "Loading your details". Skeletons are `aria-hidden`; the live region carries the state |
| **Empty** | The member has no listing and no newsletter subscription (data-holding consent only) | Listing card shows *"You're not in the directory. If you'd like to be, you can ask on the join form."* + link. Newsletter card shows *"You're not subscribed. You can sign up any time from the site."* Neither renders a button. Erasure card is unaffected | Cards still render with headings so the page structure is stable for AT; the absence of a button needs no announcement |
| **Error** | Token invalid/expired/used → redirect to D-1. Snapshot fetch fails → E-02 | Full-page `Alert tone="error"`: *"We couldn't load your details just now. Your link still works — try again."* + Retry button | `role="alert"`, focus moved to the Alert |
| **Success** | An action has been requested | The actioned card collapses to a completed state: `CircleCheck` `#0f7b3d`, *"Requested — we've emailed you the details."* Its button is removed. Other cards stay live | `role="status"` announces *"Request received. We've emailed you the details."* Focus moves to the completed card's container |
| **Disabled** | An action is in flight | That card's button only: label → "Sending…", `disabled` + `aria-busy`. **Other cards are not disabled** — a member may queue two requests | `aria-disabled` on the in-flight button |

### Interactions & Animations

| Interaction | Behavior | Timing | prefers-reduced-motion |
|---|---|---|---|
| Cards enter | Staggered fade + 12px rise, `delay: i * 0.08` | 400ms each | No stagger, no transform, no fade — all three render at final state |
| Skeleton shimmer | Left-to-right gradient sweep | 1.4s loop | **No shimmer.** Flat `#ece9f0` blocks; the live region announces "Loading your details" |
| Tap action button → inline confirm | Card expands, confirm block slides down | 220ms `ease-out` height + fade | Confirm appears instantly at full height; focus still moves to the confirm heading |
| "Keep it up" collapses the confirm | Reverse of above | 180ms | Instant |
| Card → completed state | Cross-fade, 4px settle | 300ms | Instant swap |
| Erasure button hover | Background `#b3261e` → `#8f1e18` | 150ms | Retained (colour only) |
| Intent-hint ring on the matching card | Ring fades in 400ms after load | 400ms | Ring rendered immediately, no fade |

### Accessibility Annotations

- **Heading level:** `<h1>` page heading; each card `<h2>`; "Or leave completely" is also `<h2>`
  and the erasure card's own title is `<h3>` beneath it. No level is skipped.
- **Landmark role:** `<main>`; each card `<section aria-labelledby>`.
- **Focus management:** focus moves to `<h1>` on mount. Opening an inline confirm moves focus to
  the confirm's heading. Cancelling returns focus to the button that opened it. Completing an
  action moves focus to the completed card. Opening D-4 traps focus in the dialog; closing
  returns it to the erasure button.
- **Screen-reader notes:** each card's body copy explicitly names what the action does *not*
  affect — this is not decoration, it is the FR-023 guarantee made audible. Status `Badge`
  content is real text, not colour alone.
- **Keyboard operation:** every card is reachable by Tab in DOM order; the destructive card is
  last in DOM order as well as visually. No keyboard trap outside the dialog. Escape closes an
  inline confirm as well as the dialog.

---

## Screen D-4 — Erasure confirmation dialog

**Purpose:** The last reversible moment. It must state exactly what is destroyed, offer the
narrower alternative once, and require one deliberate act.

**Entry from:** D-3, erasure card button.
**Exits to:** D-5 (confirmed) or back to D-3 (cancelled/Escape).

### Layout Wireframe (mobile-first, 320px)

```
┌──────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓ backdrop ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  #2d1b4e @ 55%
│ ┌──────────────────────────────────┐ │
│ │                             [✕]  │ │  44x44 close
│ │  Delete everything?          h2  │ │
│ │                                  │ │
│ │  We'll delete:                   │ │
│ │   • Your membership record       │ │
│ │   • Your answers to the join     │ │
│ │     form                         │ │
│ │   • Your listing, Bea's Baby     │ │
│ │     Massage                      │ │
│ │   • Your newsletter subscription │ │
│ │                                  │ │
│ │  We'll keep one thing:           │ │
│ │   • A dated note that a deletion │ │
│ │     was asked for and done, with │ │
│ │     no name or email in it. We   │ │
│ │     need it to show we did what  │ │
│ │     we said we'd do.             │ │
│ │                                  │ │
│ │  This can't be undone.           │ │  bold, #b3261e
│ │                                  │ │
│ │  ┌──────────────────────────────┐│ │
│ │  │☐ I understand this can't be  ││ │  44px row
│ │  │  undone.                     ││ │
│ │  └──────────────────────────────┘│ │
│ │                                  │ │
│ │  ┌──────────────────────────────┐│ │
│ │  │   Yes, delete everything     ││ │  destructive, disabled
│ │  └──────────────────────────────┘│ │  until box ticked
│ │  ┌──────────────────────────────┐│ │
│ │  │   Cancel                     ││ │
│ │  └──────────────────────────────┘│ │
│ │                                  │ │
│ │  Only want the listing gone?     │ │
│ │  Close this and use "Take my     │ │
│ │  listing down" instead.          │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

**Tablet / Desktop variations:** dialog capped at `max-w-lg`, vertically centred rather than
bottom-anchored. On mobile it is a bottom sheet occupying up to 90vh with internal scroll, so
the confirm controls are within thumb reach; the checkbox and both buttons must remain visible
without scrolling on a 320×568 viewport — if the list overflows, the list scrolls, not the
footer.

**Why a checkbox and not a typed word:** typing `DELETE` on a phone keyboard, at night, is a
cognitive and motor tax on the person exercising a legal right, and it is precisely the
"ceremony that wears her down" failure named in D2's drop-off notes. The checkbox plus the
cancel-by-email guard gives equivalent protection against accidental activation. The admin side
(D-7) *does* use a typed confirmation, because there the risk profile is inverted: Ash is acting
on someone else's data, on a laptop, and the mistake is unrecoverable for a third party.

### Component Hierarchy

1. **NEW** `Dialog` — `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`,
   focus trap, Escape handler, backdrop click, scroll lock, focus restore. **The site has no real
   dialog anywhere** (a11y gap 2); this primitive is a prerequisite for NFR-008 and is reused by
   the moderation queue's reject dialog
2. **NEW** `Field` (checkbox variant) — `<input type="checkbox" id>` + `<label htmlFor>`
3. `Button` — `variant="destructive"` (**NEW**) and `variant="secondary"`
4. Lucide `X` (close), `Trash2`, both `aria-hidden`; the close button has
   `aria-label="Close without deleting"`

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Dialog opened | As wireframed, checkbox unticked, primary button disabled | Focus moves to the dialog `<h2>`; `aria-describedby` points at the "we'll delete" list |
| **Loading** | Confirm pressed | Button → "Deleting…" (label is honest: the *request* is being sent, so use *"Sending your request…"*), `aria-busy`, checkbox and Cancel disabled, close button disabled, Escape suppressed | Live region inside the dialog: "Sending your request" |
| **Empty** | N/A — the dialog always has content; the "we'll delete" list is computed and always has at least the membership record | — | — |
| **Error** | POST fails (E-01/E-02) | `Alert tone="error"` inserted directly above the buttons, dialog stays open, checkbox stays ticked | `role="alert"`; focus moves to the Alert; the retry button is the same confirm button, re-enabled |
| **Success** | 2xx received | Dialog closes and the route changes to D-5 | Focus moves to D-5's `<h1>` |
| **Disabled** | Checkbox unticked (primary button); or any control while Loading | Primary button `disabled` + `aria-disabled`, 60% opacity, label contrast still ≥4.5:1 | Hint `id="erase-hint"` — "Tick the box above to continue" — is in the button's `aria-describedby` from the start, so AT users learn the requirement before pressing |

### Interactions & Animations

| Interaction | Behavior | Timing | prefers-reduced-motion |
|---|---|---|---|
| Dialog open | Backdrop fades 0→55%; sheet slides up 24px + fades | 250ms `ease-out` | Backdrop and sheet appear instantly at final state |
| Dialog close | Reverse | 180ms | Instant |
| Checkbox tick → button enable | Button opacity 60%→100% | 150ms | Instant |
| Confirm press | Button label crossfade | 120ms | Instant |
| Error alert insert | 8px slide + fade | 200ms | Instant |

### Accessibility Annotations

- **Heading level:** `<h2>` "Delete everything?" — the dialog is a child of the D-3 document, so
  its heading continues that outline. `aria-labelledby` points at it.
- **Landmark role:** `role="dialog"` `aria-modal="true"`. Content behind is `inert` (or
  `aria-hidden="true"` on the app root) while open.
- **Focus management:** focus moves to the heading on open (not the destructive button — never
  put initial focus on the destructive control). Tab cycles within the dialog only. Escape
  closes and restores focus to the erasure button on D-3. Focus restore also runs on backdrop
  click and on the `X`.
- **Screen-reader notes:** the two lists ("we'll delete" / "we'll keep") are real `<ul>`s so item
  counts are announced. "This can't be undone" is bold *and* in the accessible description — not
  conveyed by colour alone.
- **Keyboard operation:** Space toggles the checkbox; Enter on the confirm button submits;
  Escape cancels at any point before the request is in flight.

---

## Screen D-5 — `/my-data/done` — Request received / cancelled

**Purpose:** Close the loop with a date, not a vague promise, and burn the token.

**Entry from:** D-3 (via "I'm done for now" or an erasure confirm), D-4, or the
`/my-data/cancel?t=…` link in a confirmation email.

**Exits to:** site home, `/privacy`, or the public directory. The token is invalidated on
arrival, so there is no route back into D-3.

### Layout Wireframe (mobile-first, 320px)

```
┌──────────────────────────────────────┐
│  ☰   GPC                             │
├──────────────────────────────────────┤
│                                      │
│        ✓                             │  56px, #0f7b3d
│                                      │
│  We've got it.                   h1  │
│                                      │
│  You've asked us to take Bea's Baby  │
│  Massage off the directory.          │
│                                      │
│  ┌──────────────────────────────────┐│
│  │ What happens now                 ││
│  │                                  ││
│  │ 1. An admin will action this —   ││
│  │    usually within a day or two.  ││
│  │ 2. We'll email you when it's     ││
│  │    done.                         ││
│  │ 3. It'll be done by              ││
│  │    Tue 15 September at the very  ││
│  │    latest.                       ││
│  └──────────────────────────────────┘│
│                                      │
│  Your membership and your newsletter │
│  aren't affected.                    │
│                                      │
│  Didn't mean to do this? The email   │
│  we've just sent has a cancel link.  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │      Back to the site          │  │
│  └────────────────────────────────┘  │
│                                      │
│  How we handle your data →           │
└──────────────────────────────────────┘
```

**Erasure variant** — same layout, copy swaps to:
> **h1** "We've got it."
> "You've asked us to delete everything we hold about you."
> Step 3: *"It'll all be gone by **Tue 15 September** at the very latest."*
> Closing line: *"This page is the last one that works from your link — it's now used up."*

**Cancelled variant** — icon `CircleSlash` `#8a5200`, h1 *"Cancelled."*, body:
> *"Nothing has been deleted and nothing has changed. Your membership, your listing and your newsletter are all exactly as they were."*

**Too-late variant** — icon `Info` `#8a5200`, h1 *"That's already done."*, body:
> *"This request was completed on **Mon 8 September**, so there's nothing left to cancel. If you didn't ask for it, please email us at gpc.communitynews@gmail.com."*

**Tablet / Desktop variations:** `max-w-xl`, centred. No structural change.

### Component Hierarchy

1. **NEW** `NarrowPage`, **NEW** `PageHeading`
2. `Card` (existing) for the "What happens now" panel
3. **NEW** `StepList` — an ordered list with numbered markers; the site has no numbered-step
   pattern. Could be plain `<ol>` with styled markers rather than a component
4. `Button` (existing, `variant="secondary"`) → home
5. Lucide `CircleCheck` / `CircleSlash` / `Info`, 56px, `aria-hidden`

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Arrival with a completed request in session | Success variant as wireframed | `role="status"` on the confirmation block, announced once on mount; focus on `<h1>` |
| **Loading** | Only for the cancel-link entry, while the token is being resolved | Centred skeleton block, no spinner | Live region: "Checking that link" |
| **Empty** | Someone reaches `/my-data/done` with no request in session and no token | *"There's nothing to show here. If you want to manage your data, start from the beginning."* + link to D-1 | Ordinary content; focus on `<h1>` |
| **Error** | The cancel token is invalid/expired/already used | *"That cancel link doesn't work any more. If you're not sure what's happening with your request, email us at gpc.communitynews@gmail.com and we'll check."* | `role="alert"`, focus moved to the alert |
| **Success** | Cancel succeeded | Cancelled variant | `role="status"` |
| **Disabled** | N/A — the only control is a navigation link | — | — |

### Interactions & Animations

| Interaction | Behavior | Timing | prefers-reduced-motion |
|---|---|---|---|
| Tick/cross icon enter | Scale 0.8→1 with a single 200ms overshoot | 400ms spring | No scale, no spring — icon rendered at final size |
| Content enter | Fade + 12px rise | 350ms | Instant |
| Step list | Items stagger `delay: i * 0.1` | 350ms each | All items rendered at once |

### Accessibility Annotations

- **Heading level:** `<h1>`; "What happens now" is `<h2>`.
- **Landmark role:** `<main>`.
- **Focus management:** focus moves to `<h1>` on mount. The confirmation block is a
  `role="status"` region so it is announced without stealing focus a second time.
- **Screen-reader notes:** the date is written out in full (`Tuesday 15 September 2026`) in the
  accessible text, even where the visual shows `Tue 15 Sep`, so it is unambiguous when spoken.
- **Keyboard operation:** two tab stops — "Back to the site", "How we handle your data".

---

## Screen D-6 — `/admin/data-requests` — Data requests queue

**Purpose:** Make NFR-005 true. A request must be visible within one page load, carry its
20-working-day deadline on its face, and be actionable without anyone opening a database.

**Entry from:** admin sidebar item `{ to: '/admin/data-requests', label: 'Data requests', icon: ShieldCheck }`
added to the single nav array at `AdminLayout.jsx:5-16`; admin home tile "Data requests (2)";
a direct link from the member-record view.

**Exits to:** D-7 (request detail), the member detail view, the listing moderation queue.

### Layout Wireframe (mobile-first, 320px)

```
┌──────────────────────────────────────┐
│ ☰  GPC Admin              Ash ▾      │
├──────────────────────────────────────┤
│  Data requests                   h1  │
│  People asking us to unlist,         │
│  unsubscribe or delete.              │
│                                      │
│ ┌──────────┐┌──────────┐┌──────────┐ │  stat tiles, computed
│ │ OVERDUE  ││ DUE ≤5wd ││ OPEN     │ │  over ALL open requests,
│ │    1     ││    1     ││    4     │ │  not the filtered view
│ └──────────┘└──────────┘└──────────┘ │
│                                      │
│  [ Open ][ Completed ][ Cancelled ]  │  segmented, Open default
│  [ All types ▾ ]                     │
│                                      │
│ ┌─ Card (border-l-4 #b3261e) ──────┐ │
│ │ ⚠ OVERDUE by 2 working days      │ │  #b3261e text
│ │ ERASURE                          │ │  Badge, destructive
│ │ Received Mon 4 Aug               │ │
│ │ Due Mon 1 Sep                    │ │
│ │ Member: Carla T. · carla@…       │ │
│ │ Listing: none                    │ │
│ │ ┌──────────────────────────────┐ │ │
│ │ │       Open request           │ │ │ 44px
│ │ └──────────────────────────────┘ │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌─ Card (border-l-4 #f59e0b) ──────┐ │
│ │ ⏱ Due in 3 working days          │ │  #8a5200 text
│ │ UNLIST                           │ │
│ │ Received Thu 14 Aug              │ │
│ │ Due Thu 11 Sep                   │ │
│ │ Member: Bea M. · bea@…           │ │
│ │ Listing: Bea's Baby Massage      │ │
│ │          [ Live on the site ]    │ │
│ │ ┌──────────────────────────────┐ │ │
│ │ │       Open request           │ │ │
│ │ └──────────────────────────────┘ │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌─ Card (border-l-4 #d4d4dc) ──────┐ │
│ │ Due in 17 working days           │ │
│ │ UNSUBSCRIBE  …                   │ │
│ └──────────────────────────────────┘ │
│                                      │
│  Showing 4 of 4                      │
└──────────────────────────────────────┘
```

**Tablet / Desktop variations:** above `md:` the cards become a table with columns
`Status | Type | Member | Subject | Received | Due | Action`, matching the density of
`SubscribersManager.jsx`. The deadline column keeps its colour-coded left border as a row-level
`border-l-4`. Stat tiles go from a 3-across compressed row to three equal `Card`s. The filter
controls move onto one line. **Pagination follows the established idiom exactly**: `PAGE_SIZE = 100`
with a "Show 100 more" button, reset on filter change — never infinite scroll, never a page-number
control that does not exist elsewhere in this admin.

### Component Hierarchy

1. `AdminLayout` (existing) — nav array gains one entry
2. **NEW** `PageHeading` (`<h1>`) — the admin pages currently use ad-hoc `<h1>`s; reuse the
   primitive so focus management is consistent
3. **NEW** `StatTile` — extracted from the copy-pasted pattern in `SubscribersManager.jsx`;
   `{ label, value, tone }`
4. **NEW** `SegmentedFilter` — Open / Completed / Cancelled. Rendered as a
   `role="radiogroup"` of real radios, not buttons, so arrow keys work
5. **NEW** `DataRequestCard` (mobile) / `DataRequestRow` (desktop)
6. **NEW** `DeadlinePill` — `{ dueDate, receivedDate }`, computes working days, renders one of
   three tones. **This is the NFR-005 component**; it must be a single source of truth so the
   list, the detail view and the admin-home tile cannot disagree
7. `Badge` (existing) — **NEW variants** `erasure`, `unlist`, `unsubscribe`, `withdraw-pending`
8. `Button` (existing) — "Open request"
9. Lucide `ShieldCheck`, `AlertTriangle`, `Clock`, `ShieldOff`

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Open requests exist | As wireframed, sorted: overdue first, then by due date ascending, erasure above unlist above unsubscribe within the same day | List is `<ul>`; each card `<li>`. Result count in a `role="status"` region: "4 open requests. 1 overdue." |
| **Loading** | Initial fetch | Three skeleton cards (fixed height, neutral fill). Stat tiles show `—`, not `0` — a zero that later becomes a one is a lie | `aria-busy="true"` on the list container; live region "Loading data requests" |
| **Empty** | No requests match the filter | `Card` with `ShieldCheck` icon: *"Nothing waiting. When someone asks to unlist, unsubscribe or delete their data, it'll show up here with its deadline."* If a filter is active, add *"Clear filters"* button | `role="status"` announces the empty message. Stat tiles still render (all zeroes) so the page structure is stable |
| **Error** | Fetch fails | `Alert tone="error"`: *"Couldn't load the request queue. This is our end, not yours — try again in a moment."* + Retry | `role="alert"`, focus moved to the alert container |
| **Success** | Returning from D-7 after completing a request | Toast (mounted `<Toaster>` — the site currently has none): *"Done. Carla's data has been deleted."* The completed row is removed from the Open view and the stat tiles recompute | `role="status"`; the toast is polite, dismissible, and 6s (long enough to read, per WCAG 2.2.1 — with a pause control since the message is informational) |
| **Disabled** | Filter controls while the first load is in flight | Segmented control `aria-disabled`, 60% opacity | `aria-disabled` rather than `disabled`, so the current selection is still announced |

### Interactions & Animations

| Interaction | Behavior | Timing | prefers-reduced-motion |
|---|---|---|---|
| Cards enter on load | Fade + 8px rise, `delay: i * 0.05`, capped at 6 items | 300ms | No stagger, no transform — list renders at final state |
| Filter change | Old list crossfades out, new fades in | 180ms | Instant swap. **The live region announcement is the feedback**, not the transition |
| Row removal after completing a request | Row collapses (height→0) then the list closes the gap | 300ms | Row disappears instantly; the toast and live region carry the change |
| Overdue pill | Slow 2s opacity pulse to draw the eye | 2s loop | **No pulse.** The pill relies on its icon, its text ("Overdue by 2 working days") and its colour |
| Toast enter/exit | Slide up 16px + fade | 250ms / 200ms | Fade only removed too — appears and disappears instantly, in place |
| "Show 100 more" | New rows fade in | 250ms | Instant; live region announces "Showing 200 of 340" |

### Accessibility Annotations

- **Heading level:** `<h1>` "Data requests". Stat tiles are not headings. The segmented filter is
  labelled by a visually hidden `<legend>` "Show requests that are".
- **Landmark role:** `<main>` from `AdminLayout`; the filter block is `<search>` or
  `role="search"` if text search is added later (it is not needed at this volume).
- **Focus management:** on filter change focus stays on the control that changed. Returning from
  D-7, focus is moved to the `<h1>` and the toast announces the outcome — the completed row no
  longer exists to return focus to. This is the *"don't lose your place"* rule already learned on
  the review queue (commit 310e86c): the scroll position and the "Show N more" count are
  preserved across a round-trip to D-7.
- **Screen-reader notes:** the deadline is never colour-only. `DeadlinePill` always renders text
  ("Overdue by 2 working days" / "Due in 3 working days" / "Due in 17 working days"). The
  member's email is truncated visually with an ellipsis but the full value is in the accessible
  name, since an admin may need to read it aloud on a call.
- **Keyboard operation:** Tab reaches each card's single "Open request" button. The card itself is
  **not** a click-handling `div` — that is the exact defect `LondonEventCard` has (a11y gap 3)
  and it must not be repeated.

---

## Screen D-7 — `/admin/data-requests/:id` — Request detail & erasure workflow

**Purpose:** Let Ash complete any request type in one workflow, with no database access, and with
the destruction preceded by a plain statement of what will be destroyed. This screen is the whole
of NFR-005's "single workflow" claim.

**Entry from:** D-6. Also directly from a member's admin record ("This member has an open request").

**Exits to:** D-6 (on completion, with a toast), the member record, the listing moderation queue.

### Layout Wireframe (mobile-first, 320px)

```
┌──────────────────────────────────────┐
│ ← Data requests                      │  back link, 44px
├──────────────────────────────────────┤
│  Erasure request                 h1  │
│  [ ERASURE ]  ⚠ Overdue by 2 wd      │
│                                      │
│ ┌─ Card ───────────────────────────┐ │
│ │ Timeline                     h2  │ │
│ │ Requested   Mon 4 Aug, 21:14 UTC │ │
│ │ Confirmed   by email link        │ │
│ │ Due         Mon 1 Sep            │ │
│ │ Status      Open                 │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌─ Card ───────────────────────────┐ │
│ │ Who this is                  h2  │ │
│ │ Carla T. · carla@example.com     │ │
│ │ Member since 12 Jun 2026         │ │
│ │ [ Open full member record → ]    │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌─ Card (#b3261e/30 border) ───────┐ │
│ │ What will be deleted         h2  │ │
│ │                                  │ │
│ │ • Member record            1     │ │
│ │ • Survey answers          14     │ │
│ │ • Consent records          3     │ │
│ │ • Directory listing        0     │ │
│ │ • Newsletter subscription  1     │ │
│ │                                  │ │
│ │ ▸ Show the actual values         │ │  collapsed by default
│ │                                  │ │
│ │ What we keep:                    │ │
│ │ • A dated erasure note with no   │ │
│ │   name or email in it.           │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌─ Card ───────────────────────────┐ │
│ │ Complete this request        h2  │ │
│ │                                  │ │
│ │ Type the member's email to       │ │
│ │ confirm:                         │ │
│ │ ┌──────────────────────────────┐ │ │
│ │ │                              │ │ │
│ │ └──────────────────────────────┘ │ │
│ │ carla@example.com                │ │  shown above the field
│ │                                  │ │
│ │ ☑ Email Carla to confirm it's    │ │  ticked by default
│ │   done (sent before we delete)   │ │
│ │                                  │ │
│ │ ┌──────────────────────────────┐ │ │
│ │ │      Erase this member       │ │ │  destructive, disabled
│ │ └──────────────────────────────┘ │ │  until email matches
│ │ ┌──────────────────────────────┐ │ │
│ │ │  Can't action this? Add a    │ │ │
│ │ │  note instead                │ │ │
│ │ └──────────────────────────────┘ │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌─ Card ───────────────────────────┐ │
│ │ Notes & history              h2  │ │
│ │ 4 Aug 21:14 Request received     │ │
│ │ 5 Aug 09:02 Viewed by Ash        │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

**Unlist variant** — the "What will be deleted" card is replaced by **"What will change"**:
> • The listing *Bea's Baby Massage* comes off the public directory.
> • Her member record, survey answers and newsletter stay exactly as they are.

and the action becomes a single `Unpublish the listing` button with **no typed confirmation** —
it is reversible, so the ceremony would be theatre. A tick box *"Email Bea to say it's done"* is
present and ticked by default.

**Unsubscribe variant** — action is `Unsubscribe from the newsletter`, no typed confirmation, and
a note that the existing opt-out semantics apply (`unsubscribed_at` is the contract; the Brevo
backfill must not re-subscribe — the behaviour fixed in commit c50bbf6).

**Tablet / Desktop variations:** two columns above `md:` — left column Timeline / Who this is /
Notes, right column the deletion manifest and the action card, with the action card sticky at the
top of the right rail so it is reachable without scrolling past a long manifest. Nothing is
hidden at any width.

### Component Hierarchy

1. `AdminLayout` (existing)
2. **NEW** `PageHeading` (`<h1>`), `Badge` with **NEW** request-type variants, **NEW** `DeadlinePill`
3. `Card` (existing) × 5, each `p-6`
4. **NEW** `DeletionManifest` — `{ counts, revealable }`. Renders counts by default and the actual
   values behind a `<details>`/disclosure. **Counts-first is deliberate**: Ash should not have to
   read a member's answers in order to delete them, and FR-D05 (read audit) does not exist, so the
   less she is forced to look at, the better
5. **NEW** `Field` (text) for the typed confirmation, and `Field` (checkbox) for the email toggle
6. `Button` — **NEW** `variant="destructive"`, plus `variant="secondary"`
7. **NEW** `ActivityLog` — reused by the listing moderation history (NFR-013)
8. Lucide `ChevronLeft`, `ShieldOff`, `Trash2`, `MailCheck`, `AlertTriangle`

### Named States

| State | Trigger | Display | ARIA mechanism |
|---|---|---|---|
| **Default** | Open request loaded | As wireframed; destructive button disabled until the typed email matches exactly (case-insensitive, trimmed) | `<h1>`; each card `<section aria-labelledby>`; the typed field's requirement is in its `aria-describedby` |
| **Loading** | Initial fetch | Skeleton cards. **The action card is not rendered at all while loading** — a destructive control must never be visible before its manifest is | `aria-busy` on main; live region "Loading request" |
| **Empty** | The manifest is empty (member already erased by another admin, or record never existed) | Manifest card: *"There's nothing left to delete — this member's data has already been removed."* Action card is replaced by a `Mark this request complete` button | `role="status"`; the destructive control is absent from the DOM, not merely disabled |
| **Error** | Fetch fails, or the erase call fails | `Alert tone="error"` at the top of the action card: *"That didn't go through, and nothing has been deleted. Try again, or come back in a few minutes."* Typed email is preserved | `role="alert"`; focus moved to the alert; the button re-enables |
| **Success** | Erase completed | Navigate to D-6 with a toast: *"Done. Carla's data has been deleted."* On this screen, before navigating, the action card is replaced by a green completed panel for 800ms so the state change is visible | `role="status"` before navigation; then D-6's focus rules apply |
| **Disabled** | Typed email does not match; or any control while the erase is in flight; or the request is already `Completed`/`Cancelled` | Destructive button `disabled` + `aria-disabled`, 60% opacity, contrast-safe label. For a completed request the whole action card is replaced by *"Completed on Mon 8 Sep by Ash."* | `aria-describedby="erase-hint"` — *"Type carla@example.com above to enable this."* Announced when the match becomes true: live region *"Confirmation matches. The erase button is now available."* |

### The email-then-delete ordering (NFR-011 applied in reverse)

NFR-011 says a partial failure must not lose the record. Here the equivalent hazard is
**deleting the address you need in order to tell her you deleted it**. So the workflow is
strictly ordered:

```
   [ Erase this member ]
          │
          ▼
   1. Send Email 3b (completion) ──── fails ──► STOP.
          │                                     Request stays "Ready to erase".
          │ success                             Alert: "We couldn't email Carla, so we
          ▼                                     haven't deleted anything yet. Try again,
   2. Write the erasure tombstone               or use 'Erase without emailing' and tell
          │                                     us why."
          ▼
   3. Delete listing → survey answers →
      consent detail → newsletter row →
      member record   (single transaction)
          │
          ▼
   4. Mark request Completed, attribute to Ash, stamp UTC
```

"Erase without emailing" is a secondary control that appears **only after a send failure**,
requires a typed reason, and records that reason on the tombstone. It is never the default and
never visible on a first visit.

### Interactions & Animations

| Interaction | Behavior | Timing | prefers-reduced-motion |
|---|---|---|---|
| Cards enter | Fade + 8px rise, `delay: i * 0.06` | 300ms | Instant, no stagger |
| "Show the actual values" disclosure | Height auto-expand + fade | 250ms `ease-out` | Instant expand, no fade. `aria-expanded` toggles either way |
| Typed email matches → button enables | Opacity 60%→100%, 1px border settles | 200ms | Instant; the live-region announcement is the real feedback |
| Erase in flight | Button label → "Erasing…", static dot ellipsis | — | No animated ellipsis; static "Erasing…" |
| Completed panel | Green panel crossfades in, holds 800ms, then route change | 300ms + 800ms | No crossfade; panel appears instantly and still holds 800ms so the change is perceivable |
| Sticky action rail (desktop) | Sticks on scroll | — | Unchanged — position stickiness is not animation |

### Accessibility Annotations

- **Heading level:** `<h1>` "Erasure request"; each card `<h2>`; the manifest's sub-lists are
  plain `<ul>`s.
- **Landmark role:** `<main>` from `AdminLayout`. The action card is
  `<section aria-labelledby="complete-heading">`.
- **Focus management:** focus to `<h1>` on mount. On the disclosure opening, focus stays on the
  summary. On error, focus moves to the alert. On success, focus is handed to D-6's `<h1>`.
  The back link is the first tab stop so Ash can bail out without traversing a destructive form.
- **Screen-reader notes:** the manifest counts are announced as a list with item counts; the
  "What we keep" section is not visually de-emphasised into invisibility for AT. The typed
  confirmation field is `type="text"` with `autocomplete="off"` and `spellcheck="false"` — never
  `type="email"`, which would let a browser autofill defeat the confirmation.
- **Keyboard operation:** the destructive button is reachable by Tab but is never the first focus
  target. Enter inside the typed field does **not** submit — an accidental Enter must not erase a
  member. The field's `onKeyDown` swallows Enter and the live region says nothing; only the
  button activates the workflow.

---

# Part B — Consolidated Error & Edge Case Catalogue

## B.0 The shared rules every entry below obeys

**One primitive.** All of it renders through the **NEW** `Alert` component
(`{ tone, icon, title?, children, live?, action? }`). Tones and their tokens:

| Tone | Text | Background | Border / icon | Icon (lucide) | Live region |
|---|---|---|---|---|---|
| `error` | `#b3261e` (6.30:1) | `#fdf2f1` | `#b3261e` | `AlertCircle` | `role="alert"` (assertive) |
| `warning` | `#8a5200` (6.16:1) | `#fff8ec` | `#f59e0b` | `AlertTriangle` | `role="status"` (polite) |
| `info` | `#1a1a2e` | `#f2f0f7` | `#2d1b4e` | `Info` | none |
| `success` | `#0f7b3d` (5.16:1) | `#f0f8f2` | `#0f7b3d` | `CircleCheck` | `role="status"` (polite) |

No error is ever conveyed by colour alone: every one carries an icon **and** a text string.
Icons are `aria-hidden`; the text is the message.

**Three copy rules, applied to every string in this section.**
1. *Say whose fault it is, and it is never hers.* "This is our end, not yours."
2. *Say whether her data is safe.* Every error states explicitly whether anything was saved,
   sent, changed or lost. This is the single thing a member most wants to know and the thing
   generic error copy always omits.
3. *Give exactly one next action.* A retry button, a field to fix, or a human address — never
   a choice of three.

**Never** an error code as the headline, never "Something went wrong", never a raw exception,
never a `toast` for an error that has a place on the page (toasts are for *completed* work; an
error the member must act on belongs next to the thing she must act on).

**Placement rule.** Field-level problems render under the field. Submission-level problems render
immediately above the submit button — not at the top of a long form, where a member on a 320px
screen will never see them.

---

### E-01 — Network failure mid-submit

**Trigger:** `fetch` rejects (offline, DNS failure, connection dropped, iOS Safari backgrounding
the tab mid-request). The request may or may not have reached the server.

**Affected journeys / screens:** `/join` submit; D-1 "email me a link"; D-3 action confirm;
D-4 erasure confirm; D-7 erase; D-6 filter fetch; directory search.

**Display:**
`Alert tone="error"`, icon `WifiOff`, placed above the submit control; the submit button returns
to its resting label and re-enables.

> **We couldn't reach us just then.**
> Nothing has been sent, and everything you've typed is still here. Have a look at your
> connection and try again.
> **[ Try again ]**

For D-4 (inside the dialog) the same alert appears above the buttons and the dialog stays open
with the checkbox still ticked.

**Recovery path:** "Try again" re-posts the **same payload with the same idempotency key**
generated at form mount (see E-15). If the first attempt did in fact land, the server recognises
the key and returns the original result rather than creating a second record — so a retry is
always safe and the member is never told to "check whether it worked".
Form state is held in component state and is **not** cleared on error. On `/join`, state is
additionally mirrored to `sessionStorage` under a key that is cleared on success, so a tab crash
mid-error does not lose a five-minute form. *(sessionStorage holds unsubmitted answers only —
see Gaps: the controller should confirm this is acceptable, since it is transient local storage
of personal data before consent is recorded.)*

**Accessibility mechanism:** `role="alert"` so it interrupts. Focus moves to the alert container
(`tabIndex={-1}`, removed on blur) so the retry button is the next tab stop. `aria-busy` is
cleared on the form. The submit button's accessible name returns to its resting value.

---

### E-02 — Server 500 / unhandled server error

**Trigger:** the route throws. Per FR-005 it must return `{ error: '…' }` JSON with a non-2xx
status and never an HTML error page — the client parses defensively
(`await res.json().catch(() => ({}))`, the existing `NewsletterBanner` idiom).

**Affected journeys / screens:** all POSTs above, plus admin list loads.

**Display:** `Alert tone="error"`, icon `ServerCrash`, above the submit control.

> **That didn't go through — and it's our end, not yours.**
> Nothing has been saved. Please try again in a moment. If it keeps happening, email us at
> gpc.communitynews@gmail.com and we'll sort it out.
> **[ Try again ]**

On D-7 (erase), the wording is stronger about the safety of state, because the admin needs to
know whether a partial delete occurred:

> **That didn't go through, and nothing has been deleted.**
> The member's record is exactly as it was. Try again, or come back in a few minutes.

**Recovery path:** same idempotent retry as E-01. The server-side `{ error }` string is *not*
displayed verbatim to members (it may leak internals); it is logged with the record identifier
only — never with a name, email, phone or postcode (FR-005, and the existing
`console.error('[subscribe] conflict on', email)` defect must not be repeated). Admin screens
**may** show the server string, since admins are trusted and it shortens debugging.

**Accessibility mechanism:** `role="alert"`; focus to the alert; retry button labelled
"Try again" (not "Retry", not an icon-only button).

---

### E-03 — Request timeout

**Trigger:** no response within the client timeout. Two thresholds:
**8s** → reassurance, still waiting. **30s** → abort and treat as failure.

**Affected journeys / screens:** every POST; most likely on `/join` (largest payload) over
mobile data.

**Display, at 8s** — the button stays in its loading state and a `warning` alert appears beneath
it:

> **Still going.** This is taking longer than usual — please don't close this page. We'll tell
> you as soon as it's done.

**Display, at 30s** — abort, `error` alert replaces the warning, button re-enables:

> **That took too long, so we've stopped waiting.**
> Your answers are still on this page. It may have gone through — if you try again we'll make
> sure you don't end up with two.
> **[ Try again ]**

The sentence *"if you try again we'll make sure you don't end up with two"* is a literal
description of the idempotency key, not reassurance theatre, and it is the difference between a
member retrying and a member giving up.

**Recovery path:** idempotent retry. If the original request eventually lands after the client
gave up, the record exists and the retry returns the same result — NFR-011 is satisfied because
nothing was lost, and FR-007 is satisfied because nothing was duplicated.

**Accessibility mechanism:** the 8s message is `role="status"` (polite — it must not interrupt a
member mid-sentence). The 30s message is `role="alert"` (assertive) and takes focus. The
`aria-busy` state is maintained on the form throughout the wait and cleared on abort.

---

### E-04 — Rate-limited submission (FR-006)

**Trigger:** submissions from one source exceed the configured window. FR-006 requires a
**distinct status** and no row written; the architecture will choose the numbers (429 is the
expected status).

**Affected journeys / screens:** `/join` submit; D-1 "email me a link"; the public enquiry
action if it ever posts.

**Display:** `Alert tone="warning"`, icon `Clock`, above the submit button. **Warning, not
error** — nothing is broken and she has done nothing wrong.

> **That's more tries than we can take right now.**
> Give it a couple of minutes and have another go. Everything you've typed is still here —
> nothing's been lost.
> **[ Try again in 2:00 ]**

The retry button counts down and enables itself when the window clears. It does not disclose the
threshold ("you may submit 5 per hour") — that is an instruction manual for an attacker.

**Recovery path:** wait and retry; the payload and idempotency key survive. If a member is
genuinely stuck behind a shared IP (a school, a library, a mobile carrier NAT), the alert's
second line offers the human path after the first retry fails:
*"Still stuck? Email us at gpc.communitynews@gmail.com and we'll add you by hand."*

**Why this one is NOT disguised as success — the important design subtlety.**
E-05 (honeypot) *must* look successful. E-04 must not, and the reasoning is NFR-011: *a member
who sees a success message has been recorded.* A rate limit can and will catch real people —
a mum on a train re-submitting because the first attempt looked stuck, a group of members
joining from the same café wifi. Showing them a success screen would be a lie that costs them
their membership. A bot, by contrast, is not a member, has no record to lose, and no human ever
reads its screen. **So: honeypot lies, rate limiter tells the truth.** The two anti-abuse
mechanisms deliberately have opposite UX contracts, and any implementation that unifies them
into one "reject quietly" path breaks NFR-011.

**Accessibility mechanism:** `role="status"` (polite — it is not an emergency). The countdown is
rendered as text in the button label and updated at 60s/30s/10s/0s intervals in the accessible
name only, never every second. On enable, a polite announcement: *"You can try again now."*

---

### E-05 — Honeypot-caught submission (FR-006)

**Trigger:** the hidden decoy field arrives non-empty. FR-006: the submission is discarded
without creating a moderation task, **and the client still receives an ordinary success
response.**

**Affected journeys / screens:** `/join`; D-1.

**Display:** the **exact** success state of the affected screen. `/join` renders its ordinary
confirmation; D-1 navigates to D-2's ordinary "Check your inbox".

**The design subtlety, stated for implementers.** "Looks successful" is harder than returning
`200`, and there are three ways to leak:

1. **Content leak.** FR-001 requires the confirmation to name what happens next, *"and, if a
   listing was requested, that it awaits review."* If the confirmation were rendered from the
   *persisted result*, a discarded submission would render the no-listing variant and the bot
   would learn it was caught. **Rule: the confirmation is rendered from the request payload the
   client sent, never from the database result.** The server echoes back a
   `confirmation: { listingRequested: true, newsletter: false }` object derived from the input.
   A genuine member sees the same thing either way, so nothing is lost by this.
2. **Timing leak.** A discarded submission does no database work and returns in 20ms while a
   real one takes 400ms. The endpoint pads every response — success, honeypot, unknown-address —
   to a common floor (≈600ms).
3. **Side-channel leak.** No `Set-Cookie`, no differing cache header, no differing response
   body length, no analytics event that fires only on the real path. The honeypot path must be
   byte-identical in everything the client can observe.

**Recovery path:** none for the bot, by design. For the vanishingly rare genuine user who
somehow fills the decoy (a password manager auto-filling an off-screen field is the realistic
case — mitigated with `autocomplete="off"` and a non-credential-shaped name like
`company_website_2`), the recovery is the human path: her submission silently vanishes and she
never learns why. **This is an accepted, real cost of the honeypot pattern** and it is the reason
the confirmation copy on `/join` says *"If you don't hear from us within a week, email us"* —
that sentence is the only safety net a honeypot-caught human has.

**Accessibility mechanism:** the decoy is `aria-hidden="true"`, `tabindex="-1"`,
`autocomplete="off"`, positioned off-screen with `position:absolute; left:-9999px` — **not**
`display:none` or the `hidden` attribute, which sophisticated bots skip. Screen-reader users
never encounter it, and keyboard users cannot tab into it.

---

### E-06 — Duplicate email resubmission (FR-007)

**Trigger:** a submission arrives for an email that already has a member record. FR-007: record
the new answers against the existing member; **"the response never reveals whether the email was
already registered."**

**Affected journeys / screens:** `/join` confirmation state.

**Display:** the ordinary success state, with confirmation copy written so that it is *true for
both cases* and *complete for neither reader in a way that discloses which they are*:

> **Thanks, Bea — that's in.** ✓
>
> We've saved your answers. If you've filled this in before, your latest answers sit alongside
> what we already had — you won't end up on our list twice.
>
> You asked to be listed in the directory, so one of our admins will have a look and get back to
> you by email. That's usually a few days.
>
> Nothing you've told us is public until we've checked it with you.

**How this achieves non-disclosure without lying.** Each sentence is *unconditionally true*. The
second sentence is a conditional — *"if you've filled this in before"* — and a conditional
statement is not a claim about which branch applies. A first-time member reads it as
housekeeping and is not misled; a returning member reads it as an answer and is not misled
either. The alternatives all fail:

- *"You're already registered"* — discloses. Fails FR-007.
- *"We've created your membership"* — a lie to the returning member, and a false statement about
  what the system did.
- *"Thanks!"* with nothing else — fails FR-001, which requires the confirmation to name what
  happens next.

The conditional construction is the only one that satisfies FR-001 and FR-007 simultaneously.
It is used again, in the same shape, on D-2 (*"If b••••@gmail.com is on our list, we've just
emailed it a link"*), and the two should be reviewed together so their voice matches.

**Recovery path:** none needed by the member. Admin-side: FR-007 requires the change to be
queued for review rather than silently applied to a published listing, so the moderation queue
gains a `Resubmission` badge and the listing detail shows a side-by-side "submitted / published"
diff. The member record shows *"Resubmitted 18 Aug 2026"* (FR-007's fourth criterion).

**Accessibility mechanism:** the confirmation replaces the form in the DOM; focus moves to the
confirmation's `<h1>`; the block is `role="status"` so it is also announced. The `<form>` element
is removed, not merely hidden, so a screen-reader user cannot tab back into stale fields.

---

### E-07 — Validation failure on submit

**Trigger:** the member submits with one or more required fields unanswered or malformed.
FR-001: *"submission is blocked and the first offending field receives focus with a text error
tied to it programmatically."*

**Affected journeys / screens:** `/join` (the big one — up to 14 questions visible); D-1;
D-7's typed confirmation.

**Display — two layers, both required.**

*Layer 1, the summary,* rendered immediately above the submit button as `Alert tone="error"`,
icon `AlertCircle`:

> **There are 3 things to fix before we can send this.**
> 1. What's your first name? — *[link]*
> 2. Which group would you like to join? — *[link]*
> 3. A short description of what you do — *[link]*

Each numbered item is an in-page anchor to that field. The count is a real number, not "some".
For a single error the heading becomes *"There's one thing to fix before we can send this."*

*Layer 2, the field-level error,* under each offending input: 1px `#b3261e` border on the
control, `AlertCircle` 16px, message in `#b3261e`, e.g.
> "Please tell us your first name."
> "Please pick one so we know which questions to show you."
> "Please write a line or two about what you do — this is what people will read in the directory."

Field errors are specific and instructive, never "This field is required" repeated 14 times.

**Where the summary lives, and why not at the top.** Conventional error summaries sit above the
form. On a 320px viewport, a member who has scrolled to the bottom to press Submit would then
see nothing happen. So the summary renders **above the submit button** (where her eyes already
are) and *also* announces the count. Anchoring links carry her upward to each field.

**Recovery path:** focus moves to the **first offending field in DOM order** (not the first in
the summary list, if those ever differ — they must not; the summary is generated in DOM order).
The field is scrolled into view with `scrollIntoView({ block: 'center' })`, respecting
`prefers-reduced-motion` for the smooth-scroll behaviour (instant jump when reduced). Fixing a
field clears its error on `blur` (not on every keystroke, which punishes a slow typist);
the summary re-counts live and its heading updates.

**Accessibility mechanism:**
- Each field: `aria-invalid="true"`, `aria-describedby="<hint-id> <error-id>"` (hint retained,
  not replaced), error node `role="alert"`.
- The summary is `role="alert"` with `tabIndex={-1}`; it receives focus **only if** more than one
  field is in error. For a single error, focus goes straight to the field — a summary of one is
  an extra hop.
- `<form noValidate>`: native browser validation bubbles are suppressed, because they are not
  screen-reader-reliable, cannot be styled to meet contrast, and vanish on scroll. All validation
  is authored. (The existing admin forms use native validation only — that pattern is
  deliberately **not** inherited here; NFR-008 forbids it.)
- Hidden-branch fields are excluded from validation entirely (FR-002) — they are unmounted, not
  `hidden`, so they cannot be in the error list at all.

---

### E-08 — Form closed between page load and submit (FR-009)

**Trigger:** an admin closes the form while a member is filling it in. The POST is rejected.

**Affected journeys / screens:** `/join` only.

**Display:** the form is **not** wiped. `Alert tone="warning"`, icon `Lock`, above the submit
button, with the admin-authored closed message rendered beneath it:

> **We've just closed the form.**
> Sorry — that's terrible timing. Your answers are still on this page and nothing has been sent.
>
> *[admin-authored closed message, e.g. "We've paused new joins while we catch up. We'll reopen
> on 1 September — do come back!"]*
>
> **[ Copy my answers ]**   **[ Read the closed notice ]**

**Recovery path:** "Copy my answers" writes the member's answers to the clipboard as plain
labelled text so five minutes of typing is not destroyed — the only clipboard-shaped affordance
in the codebase today is `NewsletterManager.jsx:58-66`, so this reuses that idiom. The form
controls become `readonly` (not `disabled` — she must still be able to select and copy) and the
submit button is removed rather than disabled, because there is nothing to retry.
`sessionStorage` retains the draft in case she reloads.

**Accessibility mechanism:** `role="status"` (polite — she is mid-task and an assertive
interruption is hostile), then focus is moved to the alert so the next Tab reaches "Copy my
answers". The copy action confirms via a polite live region: *"Answers copied to your clipboard."*
The `readonly` state is announced natively; `aria-disabled` is **not** used, since the fields are
genuinely still readable and selectable.

---

### E-09 — Category retired between page load and submit

**Trigger:** an admin retires a directory category (FR-017) after the member's page loaded. The
submitted `category_id` is no longer selectable.

**Affected journeys / screens:** `/join` directory section; also `/admin` listing edit (FR-016).

**Display:** field-level, on the category control, plus a summary line (E-07 layer 1):

> **That category isn't available any more.** Please pick another one — everything else you've
> typed is still here.

The select's options are refreshed in place from a re-fetched config, and the previously chosen
(now retired) option is shown once, greyed, with the suffix *"(no longer available)"* and
`disabled`, so the member can see what she had chosen and why it went. It is removed on her next
selection.

**Recovery path:** focus moves to the category control. Nothing else in the form is touched. A
single re-fetch of the whole form config happens at the same time (labels, help text, required
flags may also have changed under her — FR-008), and if any *other* visible question changed, a
second polite alert says: *"We've refreshed a couple of questions — have a quick look before you
send."* No answer is silently discarded by a refresh; only the retired option is.

**Accessibility mechanism:** `aria-invalid="true"` on the select, `aria-describedby` pointing at
the error, error node `role="alert"`. The refreshed option list is announced by moving focus to
the control (which re-reads its current value and options). The greyed retired option carries its
explanation in the option text itself, since `aria-disabled` on an `<option>` is inconsistently
supported.

---

### E-10 — Listing unpublished while a visitor has its URL open

**Trigger:** an admin unpublishes (FR-015) or actions a withdrawal (FR-023) while Priya has the
listing detail page open, or has the URL saved from Instagram. FR-020: *"a clear 'no longer
listed' state is shown rather than a broken page."*

**Affected journeys / screens:** the public listing detail page; a shared/bookmarked URL; search
engine results.

**Display — cold load** (she opens the URL after it went): a full page, HTTP 200 (**not** a 404 —
this is a known, valid URL with a known outcome), `<main>` containing:

> 🔍 **This listing isn't on the directory any more.**
>
> It may have been taken down at the member's request, or while we check something. We haven't
> kept any details about it on this page.
>
> **[ Browse the directory ]**  ·  Looking for something specific? **[ Search ]**

It must not name the business, quote the description, or show the category — that would republish
what was just withdrawn. The `<title>` is generic: *"Listing not available — GPC directory"*, and
the page is served with `noindex`.

**Display — warm tab** (the page is already open in a backgrounded tab): on `visibilitychange` →
visible, and on any interaction with the enquiry control, the page revalidates. If the listing is
gone, the content region is replaced in place with the same block, and a polite live region
announces *"This listing has been taken down. Showing the directory instead."* Nothing
auto-navigates — an unexpected navigation is worse than a stale page.

**Recovery path:** links onward to the directory index and to search. If she arrived from a
search engine, that is the whole recovery. There is no "notify me if it comes back" — that would
be new collection requiring new disclosure (FR-024).

**Accessibility mechanism:** the replacement block is `role="status"` for the warm case and
ordinary page content for the cold case (a fresh page load announces itself via the `<h1>`, and
an alert would double up). Focus is moved to the `<h1>` in the warm case only, because the
member's context has changed underneath her. `document.title` is updated so a tab-switching
screen-reader user hears the new state.

---

### E-11 — Notification email fails to send (NFR-011, FR-021)

**Trigger:** the transactional send fails — Brevo down, quota exceeded, a bounce, or the
capability simply not built yet (it does not exist in the repo today).

**Affected journeys / screens:** listing moderation queue and listing detail (FR-021 publish/reject
emails); D-6 / D-7 (data-request confirmations); the admin new-submission notification (FR-022).

**The rule (NFR-011):** *the moderation decision is never rolled back.* Publishing succeeded; only
the telling failed. Two separate outcomes must be tracked and shown separately.

**Display — admin side, on the listing row and detail:** `Badge` variant **NEW** `email-failed`:

> ⚠ **Published — but we couldn't email her.**
> Last tried Mon 18 Aug, 21:14. *[error summary]*
> **[ Try sending again ]**   **[ Copy the email text ]**

The listing keeps its `Published` status pill *and* carries the email-failed badge; the two are
not merged into one ambiguous "Error" state. The admin queue's stat tiles gain a
*"Emails to resend: N"* tile so a silent backlog is visible.

**Display — member side:** nothing. She never learns an email failed; from her side the listing
simply went live. This is correct: the fallback is that she finds it herself, or an admin resends.

**Special case — the D-7 erasure completion email.** Here the rule inverts: the send happens
*before* the delete and a failure **stops** the workflow (see D-7's ordering diagram), because
the alternative is deleting the address needed to tell her. This is the one place where a
notification failure blocks the decision, and it is a deliberate, documented exception.

**Recovery path:** "Try sending again" re-queues with the same message id. "Copy the email text"
puts the rendered body on the clipboard so Ash can send it from the shared mailbox by hand — a
necessary affordance while FR-021 is a *Should* and the transactional path may not exist at
launch. Every attempt is appended to the listing's `ActivityLog` (NFR-013).

**Accessibility mechanism:** the failure badge carries text, not colour alone. The retry result
announces via a polite live region: *"Email sent."* / *"Still couldn't send — the address may be
wrong."* The stat tile's number is in a `role="status"` region that updates when the count
changes.

---

### E-12 — Over-long free text

**Trigger:** a description, challenge answer or "what do you hope to gain" exceeds its limit.
FR-006: *"over-long input is rejected, never silently truncated."*
Addendum FR-003: *"a live remaining-character count is shown and submission is blocked with a
specific message rather than silent truncation."*

**Affected journeys / screens:** `/join` public description (the FR-003 field with the hard
public limit), the three long-text survey answers, D-7's typed reason, admin listing edit.

**Display — three stages on the same control:**

| Remaining | Counter appearance | Message |
|---|---|---|
| > 20% left | `#4a4a5e`, quiet | "300 characters left" |
| ≤ 20% left | `#8a5200`, `AlertTriangle` | "42 characters left" |
| Over | `#b3261e`, `AlertCircle`, 1px `#b3261e` border on the textarea | "You're 18 characters over. Trim it a little and we're good to go." |

The textarea has **no `maxLength` attribute.** A hard `maxLength` silently swallows keystrokes,
which is worse than an error: a member pasting a prepared paragraph loses its ending with no
signal, and a screen-reader user gets no feedback at all. She may type past the limit; she just
cannot submit.

**Recovery path:** the submit button is not disabled — pressing it produces the E-07 treatment
with focus moved to the over-long field, so the reason is stated rather than mimed. The counter's
message names the exact overage so the member knows how much to cut.

**Accessibility mechanism:** the counter lives in a `role="status" aria-live="polite"` region
that is throttled to announce only on the transitions above (entering the ≤20% band, crossing the
limit, and returning under it) — **never on every keystroke**, which makes a textarea unusable
with a screen reader. `aria-describedby` on the textarea points at both the hint and the counter.
When over the limit, `aria-invalid="true"` is set on `blur`, not on the keystroke that crossed it.

---

### E-13 — Markup or a script pasted into a description

**Trigger:** a member pastes `<script>`, HTML, or markdown into a free-text field — usually
innocently (a copied bio with `<p>` tags), occasionally not.

**Affected journeys / screens:** `/join` description and long-text answers; the moderation queue
preview; the public listing detail; admin member detail; any CSV export (FR-013).

**Display — member side: nothing.** She is **not** blocked and **not** warned. Rejecting `<3`,
`Mum & Co`, or `Bea > Baby` would be a bug that punishes ordinary people, and the guarantee is
already made elsewhere: FR-020 requires submitted text to be *rendered as plain text, never as
markup*, everywhere it appears. The risk is handled by rendering, not by validation.

**Display — admin side, in the moderation queue:** a `warning` flag on the listing card:

> ⚠ **This description contains code-like characters.** It'll show on the site exactly as typed,
> tags and all. Worth tidying before you publish.

**Recovery path:** Ash edits the description with FR-016's admin edit, which preserves the
member's original submitted value alongside the published one. No automatic stripping — silently
rewriting what a member wrote is a data-integrity problem and would break FR-016's "originally
submitted values are still visible and distinguishable" criterion.

**Accessibility mechanism:** the flag is text plus icon. The rendered-as-text guarantee applies
to the accessible name too: the description must be inserted as a text node, so a screen reader
reads `<b>` aloud as "less than b greater than" rather than the browser silently applying bold.
That is the correct, honest behaviour — it shows the member exactly what everyone else sees.
**Escaping applies identically in the admin preview and in CSV export** (a cell beginning `=`,
`+`, `-` or `@` must be prefixed to defeat spreadsheet formula injection) — the moderation
preview is not a safe place to relax the rule, because it is where an admin's browser is.

---

### E-14 — JavaScript disabled, or the bundle fails to load

**Trigger:** JS is off; a corporate proxy strips the bundle; the chunk 404s after a deploy while
an old `index.html` is cached; a mobile browser aborts the download on a flaky connection.

**Affected journeys / screens:** every screen. This is a React SPA with client-side routing —
without JS there is no content at all, only an empty `<div id="root">`.

**Display — JS disabled.** A `<noscript>` block in `index.html`, styled inline so it works with
no stylesheet either:

> **This site needs JavaScript.**
> We're sorry — the GPC site doesn't work without it. If you can't turn it on, we'd still love to
> hear from you: email **gpc.communitynews@gmail.com** and we'll add you to the community by hand,
> and answer any question about your data.
> You can also read our privacy notice at **greenwichparents.co.uk/privacy**.

The human fallback is the point. FR-023 and the published policy promise withdrawal "at any
time"; a member who cannot run JS still has a right, so the address must be there and must be
reachable without the app.

**Display — bundle fails after `index.html` loaded.** A top-level error boundary plus a
`window.onerror` guard renders a static fallback:

> **This page didn't load properly.**
> Reloading usually fixes it. If it doesn't, try again in a few minutes — we may be mid-update.
> **[ Reload the page ]**  ·  Email us: gpc.communitynews@gmail.com

The reload does a hard `location.reload()` (cache-busting), which is the actual fix for the
stale-`index.html`/missing-chunk case.

**Recovery path:** reload; otherwise the email address. **Honest scope note:** full no-JS parity
for `/join` and the directory is *not* in scope — the PRD does not require it and delivering it
would mean server-rendering the whole feature. What is in scope is that a no-JS visitor is told
so, in plain words, with a working human alternative, rather than seeing a blank page. Recorded
in Gaps so it is a decision rather than an omission.

**Accessibility mechanism:** the `<noscript>` content is plain semantic HTML with a real `<h1>`
and a real `mailto:` link; it needs no JS, no ARIA and no stylesheet. The error boundary's
fallback uses `role="alert"` and moves focus to its heading. Neither is dependent on the app's
CSS having loaded — colours and spacing are inline, and the text meets AA against a white
background by default.

---

### E-15 — Slow 3G: the gap between submit and confirmation, and double-submission

**Trigger:** a 5-minute form posted over a 400kbps connection with 400ms round-trip latency. The
response can take 3–10 seconds. This is Bea's actual median case, not an edge case.

**Affected journeys / screens:** `/join` submit above all; D-1, D-3, D-4, D-7.

**Display — the timeline the member actually sees:**

```
  t=0      she taps "Send my answers"
           ├─ button: label → "Sending…", disabled, aria-busy="true"
           ├─ static three-dot glyph (no spinner under reduced motion)
           ├─ form fields → readonly (values still visible, still selectable)
           ├─ live region (polite): "Sending your answers."
           └─ page does NOT scroll, does NOT navigate, does NOT dim

  t=0.6s   nothing new. (Below this, changing anything is noise.)

  t=2s     a quiet progress line appears under the button:
           "Sending your answers — this can take a moment on mobile data."

  t=8s     E-03 reassurance (warning tone):
           "Still going. Please don't close this page. We'll tell you as
            soon as it's done."

  t=30s    E-03 abort → error, idempotent retry offered

  success  form is removed from the DOM, confirmation replaces it,
           focus moves to the confirmation <h1>, live region announces it,
           sessionStorage draft cleared
```

The form is deliberately **not** replaced by a full-page spinner. Wiping five minutes of visible
work off the screen while the network hangs is the single most anxiety-producing thing this
feature could do, and if the request then fails the member has no evidence her answers survived.
The answers stay on screen, greyed to `readonly`, until the server has confirmed.

**Double-submission prevention — four independent layers, because any one of them can fail:**

1. **Disabled button.** `disabled` + `aria-disabled="true"` from the first click until a terminal
   state. Prevents the double-tap and the impatient repeat-tap.
2. **In-flight guard in state.** A `submitting` flag checked at the top of the handler, so an
   Enter keypress, a form `submit` event and a click cannot each fire a request. This is the layer
   that catches keyboard users, whom a disabled button does not fully protect.
3. **Idempotency key.** A UUID generated once at form mount, sent with every attempt of that
   submission. The server treats a repeat key as a replay and returns the original result. This is
   the only layer that survives a page reload mid-request, a browser restore, or a retry after
   E-01/E-03 — and it is what makes "try again" safe to offer. It is also what makes the E-03
   copy (*"if you try again we'll make sure you don't end up with two"*) a true statement.
4. **`beforeunload` guard while in flight.** Native browser prompt if she tries to close the tab
   mid-submit. Registered **only** during the request and removed immediately after, so it never
   fires on ordinary navigation.

Layer 3 also satisfies FR-007 at the transport level, independently of the email-matching logic:
even a genuine duplicate *submission* (same key) collapses to one record before the duplicate
*member* logic is reached.

**Recovery path:** covered by E-01/E-03. The key insight is that all recovery paths are safe to
offer *because* of layer 3 — without an idempotency key, "try again" is a dangerous instruction
and the honest copy would have to be "check your email before retrying", which no one does.

**Accessibility mechanism:**
- `aria-busy="true"` on the `<form>` for the duration.
- One `role="status" aria-live="polite"` region carries every stage message. It is **one** region
  reused, not one per message — multiple simultaneous live regions produce interleaved,
  unintelligible speech. (The site's only existing live region, in `NewsletterBanner.jsx`, is the
  right pattern and should be generalised into the `Alert` primitive.)
- The 2s and 8s messages are polite. Only the 30s abort is assertive.
- Fields go `readonly`, not `disabled`: `disabled` removes them from the accessibility tree, so a
  screen-reader user mid-submit would find the form had vanished.
- The disabled submit button keeps `aria-disabled="true"` alongside `disabled` so it is still
  announced in the tab order rather than silently skipped, and its accessible name changes to
  "Sending your answers, please wait".

---

# Part C — Interaction & Animation Spec (whole feature)

## C.0 The implementation contract

The site currently honours `prefers-reduced-motion` **nowhere** (a11y gap 5), while using
framer-motion throughout. NFR-008 makes that a failure on `/join`, the directory index and a
listing detail page. This section is the contract for the new work.

**Two mechanisms, both required, because the site animates in two ways:**

1. **framer-motion components** — a single `useMotionSafe()` hook wrapping framer's
   `useReducedMotion()`, returning the variant set to use. Reduced mode returns variants with
   `initial === animate` and `transition: { duration: 0 }`. **The animation is not sped up; it is
   removed.** A 50ms version of a slide is still a slide.
2. **CSS transitions and keyframes** — a global block in `src/index.css`:
   `@media (prefers-reduced-motion: reduce)` setting `animation-duration: 0.01ms !important`,
   `animation-iteration-count: 1 !important`, `transition-duration: 0.01ms !important`,
   `scroll-behavior: auto !important` on `*`, `*::before`, `*::after`. This catches Tailwind's
   `transition-*`, `animate-spin`, and the `hover:scale-105` baked into the existing `Button`.

**Three carve-outs from the blanket rule**, applied deliberately rather than by accident:
- **Focus indicators never animate away.** They appear instantly in both modes; the blanket rule
  is fine here because the indicator is a static outline, not a transition.
- **Colour-only transitions are kept** in reduced mode where they are the sole hover/active
  affordance (buttons, links). Colour change is not vestibular motion. Implemented by giving
  those elements an explicit `transition-duration` inside the media query rather than relying on
  the `!important` reset — or, more simply, by treating the instant colour change as acceptable
  (it is).
- **State that only motion communicates must be replaced, not deleted.** Every row below whose
  reduced-motion cell removes an animation names what carries the information instead — usually a
  live region, a text label, or a static icon. This is the rule that makes the difference between
  honouring the preference and degrading the experience.

**Motion tokens** (to be added to `DESIGN.md`):

| Token | Value | Used for |
|---|---|---|
| `--motion-instant` | 100ms | Press feedback, checkbox tick |
| `--motion-fast` | 150–200ms | Hover, focus, inline expand/collapse |
| `--motion-base` | 250–300ms | Card enter, dialog, route change |
| `--motion-slow` | 400ms | Hero/section reveals, success icon |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Everything entering |
| `--ease-in` | `cubic-bezier(0.7, 0, 0.84, 0)` | Everything leaving |
| `--stagger` | 0.08s (public), 0.05s (admin lists) | Sequential item entry, capped at 6 items |

Nothing in this feature exceeds 400ms. Nothing loops indefinitely except the `Loading` indicators
named below, and every one of those has a static reduced-motion form.

## C.1 Global / cross-cutting

| Interaction | Where | Behaviour | Timing / easing | prefers-reduced-motion |
|---|---|---|---|---|
| Route change | Every new route | Outgoing fades out, incoming fades in + 8px rise | 250ms `--ease-out` | Instant swap. Focus still moves to the new `<h1>`; the live region still announces |
| Skip-to-content link | Every page (**NEW** — a11y gap 7) | Slides down from off-screen on focus | 150ms | Appears instantly on focus, same position |
| Focus ring | Every interactive element (**NEW** — a11y gap 4) | 2px `#fc16a0`, 2px offset, appears on `:focus-visible` | Instant, both modes | Unchanged — never suppressed, never animated away |
| Button hover (pointer only) | All `Button` variants | Background darkens one step | 150ms `--ease-out` | Colour retained. **The existing `hover:scale-105` on `variant="primary"` is removed for all users** — a scaling button is a motion trigger and it also shifts adjacent layout |
| Button press | All buttons | 2% scale-down | 100ms | Suppressed; background darkens instead |
| Button → loading | All submitting buttons | Label crossfades; animated three-dot ellipsis | 120ms / 1.2s loop | Instant label swap; **static** ellipsis. The polite live region carries the state |
| Toast enter / exit | Admin only (**NEW** global `<Toaster>` — currently mounted in exactly one file) | Slide up 16px + fade | 250ms / 200ms | Appears and disappears in place, instantly. Auto-dismiss extends 6s → 10s in reduced mode, on the assumption that a user who reduces motion may also read more slowly. Always dismissible |
| Scroll-into-view (error focus, anchor links) | `/join`, D-3, admin detail | `behavior: 'smooth'`, `block: 'center'` | Browser-native | `behavior: 'auto'` — instant jump. Focus lands identically either way |
| Modal / dialog open | D-4, moderation reject dialog, unpublish confirm | Backdrop fades to 55% `#2d1b4e`; panel slides up 24px + fades | 250ms `--ease-out` | Backdrop and panel appear at final state instantly. Focus trap, Escape and focus restore are unchanged |
| Modal close | Same | Reverse | 180ms `--ease-in` | Instant |
| Skeleton shimmer | Every list/detail loading state | Left-to-right gradient sweep | 1.4s loop | **No sweep.** Flat `#ece9f0` blocks. The polite live region ("Loading your details") is what tells a reduced-motion user something is happening |
| Spinner (`animate-spin`, the copy-pasted idiom) | Legacy pattern — **not used in this feature** | — | — | Replaced everywhere by skeletons (list/detail) or in-button ellipses (submits). If it survives anywhere, the global CSS block freezes it, so it must not be the only loading signal |
| Accordion / disclosure expand | `/join` branch sections, D-7 manifest, FAQ blocks | Height auto + fade | 250ms `--ease-out` | Instant expand at full height. `aria-expanded` toggles identically |
| Live region announcement | Everywhere | — | — | Unchanged in both modes. **This is the channel that survives when motion is off, so no message may exist only as an animation** |

## C.2 `/join` — the public membership form (EPIC-001)

| Interaction | Where | Behaviour | Timing / easing | prefers-reduced-motion |
|---|---|---|---|---|
| Page/section reveal on scroll | Form sections | Fade + 16px rise as each section enters the viewport | 400ms `--ease-out` | Everything rendered at final state on load. No scroll-linked animation of any kind |
| Branch reveal (FR-002) | Business / Career / Both sections appearing after the group answer | Section expands from 0 height, fades in, `delay: 60ms` after the radio commits | 300ms `--ease-out` | Section appears instantly at full height. **Focus does not move** (it would yank a member mid-choice); instead a polite live region says *"Business questions added below — 7 more to answer."* That announcement is required in **both** modes; it is the only thing telling a screen-reader user the form grew |
| Branch discard (FR-002) | Changing the group answer | Old branch collapses to 0 height and fades out; answers discarded | 250ms `--ease-in` | Removed instantly. Polite announcement: *"Career questions removed."* |
| Directory opt-in expand (FR-003) | The public-fields section revealed by the opt-in radio | Same as branch reveal, plus the public/private disclosure block fades in **first** so it is read before the fields | 300ms, disclosure at 0ms, fields at 100ms | Both appear instantly, disclosure **above** the fields in DOM order — which is what actually guarantees the reading order. The staggered timing is a nicety, the DOM order is the requirement |
| Character counter state change | Description and long-text fields (E-12) | Colour transition quiet → amber → red | 150ms | Instant colour change. Icon swap is instant in both modes |
| Postcode three-state border feedback | Postcode field (matching `EventFilters.jsx`'s established 600ms debounce) | Border colour transitions between neutral / valid / invalid | 200ms + 600ms debounce | Colour change instant; **the 600ms debounce is unchanged** — it is a timing behaviour, not an animation, and shortening it would cause validation to fire mid-typing |
| Inline field error appear | Every field (E-07) | Expands below the field + fades | 180ms | Appears instantly at full height. `role="alert"` fires identically |
| Error summary appear | Above submit (E-07) | Slides down 8px + fades | 200ms | Instant. Focus behaviour unchanged |
| Submit → loading | Submit button (E-15) | Label crossfade, animated ellipsis, fields grey to `readonly` | 120ms / 1.2s loop | Instant label swap, static ellipsis, instant grey. All three stage messages (2s / 8s / 30s) unchanged |
| Form → confirmation | On success | Form crossfades out, confirmation crossfades in with a 0.8→1 tick icon | 300ms + 400ms spring | Instant swap; tick icon at final size, no spring. Focus to `<h1>`, `role="status"` announcement — both unchanged |
| Progress indication | Optional section-progress bar, if adopted | Width transition as sections complete | 300ms | Width changes instantly. The textual "Section 3 of 5" is what carries it |

## C.3 Public directory — index and detail (EPIC-006)

| Interaction | Where | Behaviour | Timing / easing | prefers-reduced-motion |
|---|---|---|---|---|
| Card grid enter | Directory index (matching `Events.jsx`'s `delay: i * 0.1`) | Fade + 12px rise, staggered | 400ms, `--stagger` 0.08s, **capped at 6 cards** (the existing `i * 0.1` on a 100-card grid would make the last card wait 10 seconds) | All cards at final state instantly, no stagger, no cap needed |
| Search-as-you-type results update | Directory index (FR-019) | Old results crossfade out, new in | 180ms, after a 300ms input debounce | Instant swap. **The debounce is unchanged.** A polite live region announces *"12 businesses found"* — required in both modes, since it is the only non-visual result feedback |
| Category filter chip toggle | Directory index | Background and border transition; chip lifts 1px | 150ms | Colour transition only, no lift |
| No-results state | Directory index | Fades in with a 0.9→1 icon | 300ms | Instant, icon at final size |
| Card hover (pointer) | Directory index | Shadow deepens, card rises 4px | 200ms `--ease-out` | Shadow deepens only, no rise. Focus ring behaviour identical |
| Card focus (keyboard) | Directory index | Focus ring, no transform | Instant | Identical. **Cards are `<a>`-wrapped, never `<div onClick>`** — the `LondonEventCard` defect (a11y gap 3) must not be repeated |
| Navigate to listing detail | Index → detail | Route crossfade | 250ms | Instant |
| External link (website / Instagram) | Listing detail (FR-020) | Icon shifts 2px on hover | 150ms | No shift. The `ExternalLink` icon plus the visually-hidden "(opens in a new tab)" text is what marks it, in both modes |
| Enquiry contact reveal, if masked (addendum Q4) | Listing detail | Fades in on activation | 200ms | Instant |
| "No longer listed" replacement (E-10, warm tab) | Listing detail | Content crossfades to the replacement block | 250ms | Instant replacement. Polite live region announcement and `document.title` update are unchanged — those are what tell the visitor, not the fade |
| Loading state | Index and detail | Skeleton cards | 1.4s shimmer | Flat blocks, no shimmer, polite "Loading the directory" |

## C.4 Admin — moderation, members, insights, data requests (EPICs 002/004/005/007)

| Interaction | Where | Behaviour | Timing / easing | prefers-reduced-motion |
|---|---|---|---|---|
| List rows enter | Moderation queue, members list, D-6 | Fade + 8px rise, `--stagger` 0.05s, capped at 6 | 300ms | All rows at final state instantly |
| "Show 100 more" (the established `PAGE_SIZE` idiom) | Members list, D-6 | New rows fade in | 250ms | Instant. Polite live region: *"Showing 200 of 340."* Required in both modes |
| Filter change | All admin lists | List crossfades | 180ms | Instant swap. Live region announces the new count. Scroll position and "Show N more" state are preserved across filter changes in both modes (the lesson of commit 310e86c) |
| Row removal after a decision | Moderation queue, D-6 | Row collapses to 0 height, list closes the gap | 300ms `--ease-in` | Row disappears instantly; the toast carries the outcome and the live region carries the new count |
| Publish / reject decision | Moderation queue (FR-015) | Status `Badge` crossfades to its new variant; row animates out of the pending filter | 200ms + 300ms | Instant badge swap, instant removal. **Queue position is preserved in both modes** — the admin's place in the list is state, not animation |
| Pending-too-long emphasis (addendum FR-015) | Moderation queue | 2s opacity pulse on the age badge | 2s loop | **No pulse.** The badge's text ("Waiting 12 days") and its amber border carry it |
| Overdue emphasis | D-6 (NFR-005) | 2s opacity pulse on the overdue pill | 2s loop | **No pulse.** Text ("Overdue by 2 working days"), `AlertTriangle` icon, and red left border carry it |
| Stat tile value change | D-6, moderation home, insights | Number counts up from the previous value | 600ms ease-out | Value snaps to the new number. Live region announces the change only when it crosses a threshold (0→1 open request) |
| Insights chart draw (FR-014) | Insights view | Bars grow from 0, staggered | 600ms, `--stagger` 0.05s | Bars rendered at final height instantly. **The accompanying data table is present in both modes** — a chart's meaning must never depend on its animation, and every count is also written as text (FR-014 requires absolute number and share anyway) |
| Form settings save (FR-008) | Form config screens | Button → loading, then a success toast | 250ms | Instant, toast appears in place |
| Open/closed toggle (FR-009) | Form settings | Switch thumb slides | 200ms | Thumb jumps. The switch's text label ("Form is open" / "Form is closed") changes in both modes and is what is announced |
| Preview branch switcher (FR-010) | Form preview | Branch sections expand/collapse as in C.2 | 300ms | Instant |
| Destructive confirm dialog | D-4, D-7, unpublish, reject | As C.1 modal | 250ms | Instant. Focus trap, Escape, focus restore unchanged |
| Erasure completed panel | D-7 | Green panel crossfades in, holds 800ms, then routes away | 300ms + 800ms hold | Panel appears instantly, **still holds 800ms**. The hold is perception time, not decoration, and is required in both modes so the state change is not missed |
| Copy-to-clipboard feedback | E-08 "Copy my answers", E-11 "Copy the email text" | Icon crossfades to a tick for 2s | 150ms | Instant icon swap, same 2s hold. Polite live region: *"Copied."* |

## C.5 What must never animate, in either mode

- Anything that would move a focused element out from under the user's cursor or caret.
- Anything triggered by scroll position on `/join` — a member scrolling back to check an answer
  must not re-trigger reveals.
- Error text. It appears; it does not fade in over 400ms while she is trying to read it.
- The focus indicator.
- Content that a live region has already announced as present — the announcement and the paint
  must not be separated by an animation, or a screen-reader user will hear about a thing that is
  not yet on screen for a sighted companion.
- Anything at all while a destructive request is in flight (D-4, D-7): the screen freezes into its
  loading state so it is unambiguous that the system is mid-action.

---

## Gaps found

Items I could not resolve from `prd.md`, `addendum.md` or `ux-shared-context.md` without inventing
product or legal decisions. Each names who should decide.

1. **No member-facing right of *access* or *portability*.** FR-023 covers withdrawal and erasure.
   The site's published GDPR policy also lists Access and Portability as rights, and FR-013 gives
   only *admins* an export. So D-3 has three cards where the policy implies four — there is no
   *"Send me a copy of everything you hold"* control, and no journey for it. **This is the largest
   gap in this section.** Decide: add a fourth consent-centre card and a corresponding admin
   request type (reusing FR-013's export as the fulfilment mechanism), or state explicitly that
   access requests remain an email-to-the-controller path and say so on `/privacy`.
   *Owner: Controller / PM. Needed before EPIC-007 build.*

2. **Erasure does not obviously reach Brevo.** FR-023 names "the member record, listing, and survey
   answers". It is silent on the `newsletter_subscribers` row and on the Brevo contact, which is a
   third-party processor holding the same email. An erasure that leaves a live Brevo contact is not
   an erasure. Also unresolved: whether deleting the Brevo contact conflicts with the opt-out
   semantics that commit c50bbf6 exists to protect (an erased contact could be re-imported by a
   later backfill as a *new* contact with no `unsubscribed_at`). *Owner: Builder + Controller.
   Needed before EPIC-007 build. Related: addendum Q5.*

3. **The erasure tombstone's shape is a minimisation decision I should not make.** I have specified
   request id, type, received date, completed date, acting admin, and a peppered hash of the email.
   The hash is what lets GPC answer "did you delete me?" later, but a hash of an email with a
   retained pepper is arguably still personal data. The alternative is a bare dated counter, which
   is unambiguously anonymous but cannot answer that question. *Owner: Controller. Needed before
   EPIC-007 build. Bears on NFR-006.*

4. **When does the 20-working-day clock start?** NFR-005 and the published policy give the window
   but not its origin. I have specified *from the confirmed request* (D-5, i.e. after the email
   round-trip), not from the D-1 form submission, because an unconfirmed D-1 submission may not be
   from the data subject at all. This is defensible but it is a legal reading, not a UX one.
   *Owner: Controller. Needed before EPIC-007 build.*

5. **No route path is defined for the data-rights journey.** The PRD names `/join`, `/privacy` and
   the directory but not this. I have used `/my-data`, `/my-data/manage`, `/my-data/done`,
   `/my-data/cancel` and `/admin/data-requests`. The addendum separately notes that a
   `/unsubscribe` route is absent and promised. Decide whether `/unsubscribe` is a distinct route
   (needed if RFC 8058 one-click unsubscribe headers are used on the newsletter, which most
   mailbox providers now expect) or an alias into this flow. *Owner: Builder. Needed before
   EPIC-007 build.*

6. **The mail token is a persistent per-member identifier embedded in every outbound email.** That
   is new processing and belongs in the FR-024 privacy disclosure, alongside its rotation policy
   and lifetime. I have specified "rotates on each send, valid until superseded" but that is a
   proposal, not a decision. *Owner: Controller + Builder. Gates launch with FR-024.*

7. **Nothing escalates an overdue data request.** NFR-005 requires visibility within one page load,
   which the queue and the admin-home tile deliver — but only to an admin who opens the panel.
   FR-022 (admin notification) is a *Could* and covers new submissions, not deadlines. At current
   volumes a weekly habit is probably enough; if it is not, this needs an FR. *Owner: PM. Recorded
   rather than solved.*

8. **A stolen inbox is a completed erasure.** Stated in Journey D2's drop-off notes and repeated
   here so it is not lost: the confirmation email's cancel link and the admin action step are the
   only guards, and an attacker with inbox access can delete the warning. The alternative —
   refusing self-service erasure — breaks the published policy. I have accepted the risk; the
   controller should accept it explicitly. *Owner: Controller.*

9. **Transient local storage of unsubmitted answers.** E-01 and E-08 rely on a `sessionStorage`
   draft so a five-minute form survives a network error. That stores personal data on the device
   *before* consent has been recorded. It is almost certainly fine (it is her own device, her own
   typing, cleared on success) but it is processing and it is not disclosed anywhere.
   *Owner: Controller. One line on `/privacy` if accepted.*

10. **No-JS parity is deliberately out of scope.** E-14 specifies a `<noscript>` block with a human
    fallback rather than a server-rendered form. Nothing in the PRD requires no-JS operation, and
    delivering it would mean server-rendering the whole feature. Recorded as a decision needing
    sign-off rather than an omission. *Owner: PM / Builder.*

11. **E-04's countdown assumes the rate limiter returns a retry-after value.** If the chosen
    mechanism (FR-006, architecture's call) cannot, the copy degrades to *"Give it a couple of
    minutes and have another go"* with a plain enabled button and no countdown. Flagging so the
    architecture decision is made knowing the UX depends on it. *Owner: Builder.*

12. **Honouring `prefers-reduced-motion` only on the new pages leaves the site inconsistent.**
    Part C's global CSS block would in fact fix the whole site at once, which is the right outcome
    but is scope beyond this feature and would change the feel of existing pages (notably the
    `hover:scale-105` on every primary button). Decide: apply globally in this change, or scope the
    reset to the new routes. *Owner: Builder. NFR-008 is satisfied either way; NFR-012
    (conventions) argues for global.*

13. **D-2's masked-email echo.** I have specified echoing `b••••@gmail.com` for orientation, then
    flagged in the accessibility notes that bullet characters are announced badly and that echoing
    nothing may be better. It is a small usability call with a screen-reader cost either way, and
    it wants a decision rather than a note. *Owner: UX. Recommend: echo nothing.*
