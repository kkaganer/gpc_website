# Adjudications — resolving the cross-draft conflicts

> Seven agents drafted EXPERIENCE.md sections in parallel; an independent critic found the
> conflicts in `CRITIQUE.md`. This file records the binding resolution for each. `../EXPERIENCE.md`
> is written to these rulings — where a draft disagrees, **this file and EXPERIENCE.md win**.

## Verified facts that settle three disputes

| Claim | Verified | Consequence |
|---|---|---|
| "The site has no skip-to-content link" (shared context gap #7) | **FALSE.** One exists at `src/components/layout/Layout.jsx:8-10`, wrapping all public pages. | Do **not** add a second one to public pages. It uses `focus:` not `focus-visible:` and paints white on `--color-primary` `#fc16a0` = **3.64:1, fails AA** — fix its contrast to `--color-primary-700`. `AdminLayout` has no `Layout` wrapper and genuinely needs one added. |
| Canonical domain | `greenwichparentsandcarers.co.uk` (`index.html:10`, `og:url`) | Every email, consent string and absolute URL uses this. `greenwichparents.co.uk` is wrong and must not appear — it is currently baked into a draft's verbatim-stored `consent_text`. |
| Contact address | `gpc.communitynews@gmail.com` (`src/utils/constants.js`, `CONTACT.email`) | Replaces all "the address on our privacy page" hedges. |

---

## A. Conflicts resolved

### A1 — Error summary (three specs → one). *Critique §2.1*
**Ruling:** The summary renders **above the submit button**, not at the top of the form.
`role="alert"`. On failed submit, **focus always moves to the summary**, regardless of the
error count. Each listed error is a link to its field.

*Why:* the "above the submit button" placement is right — on a 320px screen a member who
scrolled down to press Submit must see the result without hunting. On focus, one
unconditional rule beats a count-dependent one: a conditional ("field if 1, summary if 2+")
is a bug factory for a solo maintainer and the summary announces the single error anyway.
**`DESIGN.md` §2.10 is amended to match** (it previously implied a top-of-form banner).

### A2 — Confirmation rendered from payload, not stored records. *Critique §2.2*
**Ruling:** The confirmation screen is rendered **from the request payload the client sent**,
never from the database result. The "what you agreed to" recap echoes what the member
submitted.

*Why:* this is a security property, not a preference. Rendering from stored records tells a
honeypot-caught bot it was caught (no records exist), and tells a duplicate submitter that
their email was already registered — breaking FR-006 and FR-007's non-disclosure rule. The
security rule outranks the "reflects what the server persisted" nicety.

### A3 — Categories have exactly one home. *Critique §2.3*
**Ruling:** Categories are a **directory-domain object**, managed at
`/admin/directory/categories`, with **immediate effect** (no draft/publish). The form's
category question is **generated from the taxonomy** and is not separately editable in form
configuration — which removes the double ownership entirely. **Delete** exists only at zero
referencing listings (PRD FR-017 permits exactly this); otherwise **Retire** only.

*Why:* a category is data referenced by published listings, not form copy. Two editors for
one list was the root cause. Form config owning only its own copy, and reading the taxonomy,
is the clean seam.

### A4 — Form-configuration edits use draft → publish. *Critique §2.3*
**Ruling:** Labels, help text, required flags, choice options (other than categories), intro
text and closed message are **drafted, previewed, then published as one atomic set**.
FR-010 requires preview to reflect *unsaved* edits, so a draft state must exist. The
open/closed toggle is the one exception — it applies immediately, because closing a form is
an emergency control.

*Why:* it is what FR-010 already implies, and it makes A3's distinction principled rather
than arbitrary: **form copy is drafted; directory data is live.** The Form Settings screen
states this in one line so an admin is never guessing.

### A5 — Data-rights requests live at `/admin/data-requests`. *Critique §2.4*
**Ruling:** One route, `/admin/data-requests`, with its own sidebar entry. The directory
moderation queue shows a **badge and link** on any listing with an open request, but does not
own the queue.

*Why:* erasure spans the member record, the listing and newsletter state. Nesting it inside
directory moderation would leave newsletter-only and record-only requests homeless.

### A6 — No global toaster. *Critique §2.10*
**Ruling:** No `<Toaster>` is introduced. All confirmation and error feedback uses the inline
banner in `DESIGN.md` §2.10, placed adjacent to the thing it describes. Four of five drafts
independently reached this; the fifth is overruled.

*Why:* a toast can be missed, cannot be re-read, and is the wrong shape for a moderation
decision or a save confirmation. Adding a global provider for one message is disproportionate.

### A7 — One shared `Spinner`, gated on reduced motion. *Critique §2.11*
**Ruling:** Extract the copy-pasted `animate-spin` idiom into one `Spinner` component that
honours `prefers-reduced-motion` internally. Page loads use **skeletons**; in-flight actions
use the in-button spinner. This is the one change this feature makes to a shared component
outside its own routes, and it is deliberate.

### A8 — Public description limit is **300 characters**. *Critique §2.12*
**Ruling:** 300, not 400. It is already fixed in the counter microcopy, the server-side
limit and the moderation review screen. The directory's performance budget is recomputed
against 300.

### A9 — One confirmation screen, and no delivery promise. *Critique §2.13*
**Ruling:** One heading, one body, one timeframe phrasing across every draft. The
member-facing wording is **"We usually review new listings within a week"** — *not*
"within 5 working days".

*Why:* the PRD's 5-working-day figure is an **internal median target** (a success metric),
not a commitment to members. Publishing it as a promise converts a metric into an obligation
the organisation never agreed to, and three drafts each invented a different phrasing of it.

### A10 — Resubmission surfaces as one thing. *Critique §2.16*
**Ruling:** A resubmission sets a **`Resubmission` status on the existing listing**, which
surfaces as a pill in the moderation queue's normal flow and a submitted-vs-published diff on
the review screen. There is **no separate "Updates" tab**, and the member record shows it as
an activity entry. One data shape, three views of it.

### A11 — `/join` enters the navbar as a CTA button, not a seventh text link. *Critique §5.5*
**Ruling:** A `Button`-styled CTA to the right of the nav row. Seven text links wrap at
1024px. The directory takes the sixth `NavItem` slot.

### A12 — Question count. *Critique §2.17*
**Ruling:** The progress signal shows **only the count actually rendered for that member's
branch**, recomputed when the branch changes, and the same number appears in the header and
the wireframes. No draft's hard-coded figure is normative; the rule is.

### A13 — One live region per page. *Critique §4.8*
**Ruling:** **One** `aria-live="polite"` region per page, reused for all polite
announcements, plus **one** `role="alert"` region for errors. Character counters and choice
counters write into the shared polite region, throttled — they do **not** instantiate their
own. Four simultaneous regions on `/join` would produce interleaved, unintelligible speech.

### A14 — Modals: one dialog primitive. *Critique §4.4*
**Ruling:** One `Dialog` primitive implementing the `DESIGN.md` §2.9 contract, with
`ConfirmModal` re-implemented over it. Five independently-specified dialogs collapse to one.

### A15 — Status pill colours come from `DESIGN.md` §2.7. *Critique §2.9, §4.2*
**Ruling:** The `SubscribersManager` pill ramp (`text-green-600` on `bg-green-50` ≈ 3.4:1,
`text-amber-600` on `bg-amber-50` ≈ 3.1:1) **fails AA at pill size and must not be copied**.
All new pills use the verified tokens in `DESIGN.md` §2.7. The module-scope class-map *idiom*
is reused; its *values* are not.

### A16 — Listing URLs use an immutable slug. *Critique §5.7*
**Ruling:** A listing's slug is generated once at first publication and **never regenerates
on rename**. Renaming changes the display name only.

*Why:* a regenerating slug breaks every previously shared link and every link in every
already-sent publish email, landing visitors on a "no longer listed" page indistinguishable
from a withdrawal. An immutable slug costs nothing.

### A17 — Admin ↔ member record links are bidirectional. *Critique §5.2*
**Ruling:** The moderation review screen links to the member record, and the member record
links to the listing. Both halves are specified.

### A18 — Every GPC email carries the data-rights footer. *Critique §5.3*
**Ruling:** Every member-facing email carries the controller identity, a `/privacy` link, and
the **"Manage your data or unsubscribe"** mail-token link. The "just reply to this email"
wording is removed — it reinstates exactly the email-an-admin-and-wait loop FR-023 exists to
eliminate.

### A19 — Idempotency key on submission. *Critique §5.4*
**Ruling:** The client generates an idempotency key per form session and sends it with the
submission; retries reuse it. This is what makes the retry copy ("if you try again you won't
end up with two") a true statement rather than a reassuring one.

### A20 — `prefers-reduced-motion` is reset globally. *Critique §4.6*
**Ruling:** Applied globally in this change, not scoped to the new routes. A scoped reset
leaves the shared components this feature *reuses* still animating, which is the failure
mode the requirement exists to prevent.

### A21 — `AdminLayout` gets a responsive drawer. *Critique §5.6*
**Ruling:** Off-canvas drawer plus sticky top bar below 768px, owned by this feature since
three sections depend on it. The alternative — declaring admin desktop-only — is rejected: Ash
moderates in short bursts, and the phone is where short bursts happen.

---

## B. Coverage holes to fill in EXPERIENCE.md

| Hole | Ruling |
|---|---|
| **FR-006 criterion 5** — no screen shows the rejected-submission counter | **New:** an "Abuse blocked" stat tile on the Form Settings screen (last 7 days / 30 days, honeypot vs rate-limit split), plus a warning banner when the 24-hour rate crosses a threshold. Without it the requirement is unbuilt. |
| **FR-024** — `/privacy` content unspecified, and it gates launch | **New:** a `/privacy` content specification listing the required sections. Content is the controller's to write; the IA and the required headings are UX's. |
| **Retention period placeholder** in stored consent text | **Blocking.** `«RETENTION_PERIOD»` cannot ship: every day it is live produces consent records citing unevidenceable text. Escalated to the user as an open decision (addendum Q8). |
| **NFR-009 second clause** — `/join`'s own 50KB budget unowned | **Assigned** to the `/join` section, with the component-count consequence stated. |
| **NFR-010** — moderation queue unbounded | **Ruling:** the queue fetches a bounded page like every other list; `PAGE_SIZE = 25` with "Show 25 more". |
| **Admin dashboard** — four drafts modify it, none specifies it | **New:** one dashboard specification owning all four counts, with its own loading and error states. |
| **404 route** — nobody fixes it | **Ruling:** in scope. A catch-all route is a precondition for the "no longer listed" state to be distinguishable from a typo. |

## C. Deliberately left open (escalated, not decided)

| # | Question | Why it is not a UX call |
|---|---|---|
| Q8 | The retention period stated in consent text | The controller's decision. **Blocks first live submission.** |
| Q3/Q4 | Whether the public enquiry contact is an email, a phone, a link, or a member's choice — and whether an email is shown in the clear or relayed | Product + privacy call. EXPERIENCE.md designs for "email, shown in the clear, with a scraper-resistant rendering" as the base case and states what changes otherwise. |
| Q1 | Whether the directory publishes any location | Already decided (no location). Recorded as a known cost to the visitor, not reopened. |
