# Product Requirements Document (PRD)

**Project Name:** GPC Mums in Business & Work — Membership Intake & Community Business Directory
**Version:** 1.0
**Date:** 2026-08-18
**Author:** John (PM) — bmad-prd
**Status:** Draft — ready for architecture
**Track:** BMad Method  <!-- escalated from Quick Flow; see decision-log 2026-08-18 -->

> Source of truth for *what* and *why*. It does not prescribe *how* (that is the architecture skill).
> Overflow / deferred detail lives in `addendum.md`. Decisions are logged in `decision-log.md`.
> Companion UX artifacts: `DESIGN.md` and `EXPERIENCE.md`.

---

## Executive Summary

**Problem Statement:** The GPC Mums in Business & Work community collects its members through a third-party Tally form (`tally.so/r/RG1M6K`). That form asks members whether they want to appear in a "trusted directory of local businesses and professionals" — but no directory exists, the form collects almost nothing publishable, and every answer, including personal data, sits outside GPC's own systems in a tool nobody on the site can query. Members opt in to a promise the organisation currently cannot keep, and GPC cannot act on the demand signals (preferred days, event types, support needs) it is already gathering.

**Proposed Solution:** Bring the form in-house as a configurable, GPC-branded public form at `/join`, backed by a strict two-tier data model: a **private member record** (all personal details and survey answers, reachable only through authenticated admin routes) and a **public business listing** (a small, deliberately chosen set of business fields, published only after an admin approves it). Admins get a moderation queue, a member database, and the demand insights the survey was always meant to produce.

**What this release is, precisely:** a **public directory of businesses** run by GPC members. A *member* directory — one covering everyone in the community, including members who do not run a business — is a **separate, later product**: it lists people rather than businesses, so it is personal data by definition and must sit behind a member login that does not yet exist. It is Out of Scope here and parked as `FR-D10`. Keeping the two apart is the point: merging them would put personal details on a public page, which is the exact outcome this plan exists to prevent.

**Business Value:** Delivers the directory that members have already been asked to join; converts an inert spreadsheet of survey answers into event-planning evidence; removes a third-party dependency holding GPC's personal data; and closes a live GDPR exposure — the current form takes a single undifferentiated consent tick and cannot evidence what anyone agreed to.

**Target Outcome:** A member completes one form in under five minutes; their personal data is never publicly reachable by any route; a business listing reaches the public site only by an admin's explicit act; and an admin can answer "which day should we run the next networking breakfast?" from the admin panel without opening a spreadsheet.

---

## Project Overview

### Background

The source form (analysed in full at `bmad-output/inputs/tally-form-RG1M6K-structure.md`) has 153 blocks and one branch key — *"Which group would you like to join?"* — which reveals a **Business Questions** branch (7 groups), a **Career Questions** branch (4 groups), or both. It asks a directory question but collects no category, no description, and no public-safe contact; the only business fields (name, website, Instagram) are optional and live exclusively in the Business branch. The question and the fields that would answer it are therefore never connected — a member who *wants* a listing has no way to supply one.

The source form also **names the wrong product**: it asks *"Would you like to be included in our local **member** directory?"*, which describes the deferred, login-gated product rather than the business directory this release ships. The shipped wording is corrected; FR-008 keeps it admin-editable thereafter.

The receiving codebase (analysed at `bmad-output/inputs/codebase-constraints-brief.md`) is a React 19 + Vite + Supabase site on Vercel with an existing admin panel, 27 migrations, RLS on all tables, and established patterns for status-gated public reads and service-role admin routes. It has **no** rate limiting, CAPTCHA, honeypot, consent versioning, admin role tiers, transactional email, CSV export, or unsubscribe route.

### Current State → Desired State

- **Current:** Data lives in Tally. No directory exists. Consent is one tick with no record of the text agreed to. Survey answers are unqueryable by the site. Publishing anything about a member is a manual, undefined act.
- **Desired:** Data lives in Supabase under GPC's control. A public directory ships. Consent is captured per purpose, timestamped, and versioned. Survey answers drive an insights view. Publication is a deliberate, logged, reversible admin action with an explicit public/private field boundary.

### Stakeholders

| Stakeholder | Role | Interest | Influence |
|---|---|---|---|
| Aster Thackery | Data controller (named in the published GDPR policy, CIC 16387545) | Legal accountability for every field collected and published | Decisive on privacy scope |
| GPC community admins | Operators — moderate listings, plan events | Low-friction moderation; usable member data | High on admin UX |
| Business Mums | Members with a business | Visibility, new clients, collaborations | High on directory design |
| Career Mums | Members in employment or returning to work | Support, networking; **many will not want a listing at all** | High on form length/relevance |
| Public visitors | Local parents seeking a trusted local business | Find a relevant business quickly | Medium |
| Kristina (builder) | Sole developer | Maintainability within existing conventions | High on technical scope |

---

## Goals and Objectives

### Business Goals

1. **G1 — Ship the directory that has already been promised**, so the opt-in question on the form becomes truthful.
2. **G2 — Take custody of member data**, removing the third-party form as the system of record.
3. **G3 — Make the survey actionable**, turning preference answers into event-scheduling evidence.
4. **G4 — Close the privacy gap** between what the site's published policies promise and what the system can actually evidence and honour.
5. **G5 — Keep the public site trustworthy** — no spam, no incomplete entries, no accidental exposure of a member's personal details.

### User Goals

1. **U1** — As a member, complete one short, relevant form and be confident exactly which of my details become public.
2. **U2** — As a Business Mum, get a listing that brings me enquiries without publishing my home postcode or personal email.
3. **U3** — As a Career Mum, not be forced through business questions that do not apply to me.
4. **U4** — As an admin, review, edit and publish a listing in a couple of clicks, and change a form question without a code deploy.
5. **U5** — As a public visitor, find a relevant local business and contact it.
6. **U6** — As a member, withdraw my listing or my data at any time, easily.

---

## Functional Requirements

> Format: `FR-###: <PRIORITY> — <capability>`. Describes WHAT, not HOW. IDs are immutable.

### FR-001: Public membership form — MUST
**Description:** A publicly reachable, GPC-branded form at a stable path (`/join`) that collects the field set of the source Tally form, rendered from admin-managed configuration.
**Acceptance Criteria:**
- Given a visitor opens `/join`, when the form loads, then it renders every unconditional question from the source form inventory in the documented order.
- Given the form is submitted successfully, when the response returns, then the form is replaced by a confirmation state naming what happens next (and, if a listing was requested, that it awaits review).
- Given a required question is unanswered, when the visitor submits, then submission is blocked and the first offending field receives focus with a text error tied to it programmatically.
- The form is fully operable by keyboard alone and on a 360px-wide viewport.
- No question is answerable only by pointer (no drag, no hover-only control).
**Related Epic:** EPIC-001

### FR-002: Conditional branch rendering — MUST
**Description:** The form shows the Business branch, the Career branch, or both, driven solely by the member's answer to "Which group would you like to join?", matching the source form's logic.
**Acceptance Criteria:**
- Given "Business Mums" is selected, when the form re-renders, then the 7 Business questions appear and no Career question appears.
- Given "Career Mums" is selected, then the 4 Career questions appear and no Business question appears.
- Given "Both" is selected, then all 11 branch questions appear.
- Given a branch was answered and the member then changes the group answer, when the branch is hidden, then its answers are discarded and are absent from the submitted payload.
- Hidden-branch questions are never validated as required and never blocked submission.
**Related Epic:** EPIC-001

### FR-003: Business listing opt-in captures publishable content — MUST
**Description:** This release delivers a **directory of businesses**. A member with a business, practice or freelance service can ask for it to be listed; choosing to do so reveals the fields the listing needs. What is published is **business information only, never personal information**. A general member directory covering everyone is a separate, later product behind a member login (see Out of Scope). This is net-new; the source form has no equivalent.
**Acceptance Criteria:**
- Given the member opts in, when the section expands, then it requests: business name, one category from the managed taxonomy, a short public description (with an enforced character limit), website, Instagram, and a **public enquiry contact** distinct from the signup email.
- Given the member opts in, when they submit, then business name, category, description and public enquiry contact are all required; website and Instagram are optional.
- Given the member declines, when they submit, then none of these fields are requested and none are stored.
- The section states, in plain words adjacent to the fields, that exactly these fields become public and that the signup email, postcode and all survey answers do not.
- **Eligibility is having a business, not the group answer.** The question is offered to every member and explains that it is for anyone who runs a business or works for themselves — including freelancers and sole traders — so a self-employed member who chose "Career Mums" can list, and no member is routed by their branch.
- **Every listing has the same shape.** A listing describes a business and nothing else; no listing carries personal details, and none is fuller or thinner because of the branch its member took.
**Related Epic:** EPIC-001

### FR-004: Granular, evidenced consent — MUST
**Description:** Consent is captured per purpose, not as one tick, and is recorded with enough evidence to satisfy the site's published GDPR policy.
**Acceptance Criteria:**
- Given the form renders, when the consent section appears, then it offers separately: (a) consent to hold the submitted personal data — required; (b) consent to publish the nominated fields in the public directory — required only if the member opted into the directory; (c) newsletter consent — always optional and never pre-ticked.
- Given consent is given, when the submission is stored, then the stored record includes the exact consent text shown, a version identifier for that text, the UTC timestamp, and the capture method.
- Given a member did not tick (c), when the record is stored, then no newsletter subscription is created by any path.
- The consent copy links to the site's own `/privacy` page, not an external file.
- Consent records are append-only: a later withdrawal adds a record and never overwrites the original.
**Related Epic:** EPIC-003

### FR-005: Submissions are written by a single trusted server path — MUST
**Description:** All form submissions are written through one authenticated-by-design server route. No browser-held key may write member data directly.
**Acceptance Criteria:**
- Given a submission, when it is persisted, then it is written by a server route using privileged credentials, never by the browser client.
- Given a caller attempts to write member or listing rows directly with the public browser key, when the database evaluates the request, then it is refused.
- Given a payload contains fields the server did not ask for (including any status, consent-timestamp or moderation field), when it is processed, then those fields are ignored — the client cannot author its own consent or approval state.
- Given the route throws for any reason, when it responds, then it returns a JSON error object and a non-2xx status, never an HTML error page.
- No personal data (name, email, phone, postcode) appears in server logs; failures log the record identifier only.
**Related Epic:** EPIC-003

### FR-006: Abuse and spam protection on the public write endpoint — MUST
**Description:** The public submission endpoint resists automated abuse before launch, not after.
**Acceptance Criteria:**
- Given more submissions arrive from one source than a defined threshold within a defined window, when the limit is exceeded, then further submissions are rejected with a distinct status and no row is written.
- Given a hidden decoy field is completed, when the submission is processed, then it is discarded without creating a moderation task, and the client still receives an ordinary success response.
- Given a request arrives without an expected same-origin indicator, when it is processed, then it is rejected.
- Free-text fields enforce maximum lengths server-side; over-long input is rejected, never silently truncated.
- Rejected submissions increment a counter an admin can see, so a live attack is visible.
**Related Epic:** EPIC-003

### FR-007: Duplicate submission handling — SHOULD
**Description:** A member who submits twice with the same email does not create a second member record or a second listing.
**Acceptance Criteria:**
- Given an email already exists, when a new submission arrives for it, then the system records the new answers against the existing member rather than creating a duplicate.
- Given a duplicate submission, when it completes, then the member sees the ordinary confirmation state — the response never reveals whether the email was already registered.
- Given a duplicate arrives for a member with a published listing, when it is processed, then the published listing is not silently altered; the change is queued for admin review.
- Admins can see that a member re-submitted and on what date.
**Related Epic:** EPIC-003

### FR-008: Admin edits form question content — MUST
**Description:** An admin can change the wording and options of the form's questions without a code change or deploy. The field set and branching structure remain code-defined.
**Acceptance Criteria:**
- Given an admin opens the form settings, when they edit a question's label or help text and save, then the public form shows the new text without a deploy.
- Given a choice question, when the admin adds, renames, reorders or retires an option and saves, then the public form reflects it.
- Given an option is retired, when existing submissions are viewed, then their historical answers still display that option's label — retiring never rewrites stored answers.
- Given an admin toggles a question's required flag, when the public form validates, then it honours the new setting.
- Admins cannot add, delete, or re-parent questions, and cannot alter branching logic.
**Related Epic:** EPIC-002

### FR-009: Admin opens and closes the form — MUST
**Description:** The form can be taken offline without removing the page or deploying.
**Acceptance Criteria:**
- Given the form is set to closed, when a visitor opens `/join`, then they see an admin-authored closed message instead of the fields.
- Given the form is closed, when a submission is posted directly to the endpoint, then it is rejected.
- Given the form is reopened, when a visitor reloads, then the form is available again.
- The current open/closed state is visible at a glance in the admin panel.
**Related Epic:** EPIC-002

### FR-010: Admin previews the form — SHOULD
**Description:** An admin can see exactly what the public form looks like, including each branch, without submitting test data.
**Acceptance Criteria:**
- Given an admin previews the form, when they select each group option, then they can inspect the Business, Career and Both branches.
- Given a preview is submitted, when it completes, then no member record, listing, or consent record is created.
- The preview reflects unsaved draft edits, so wording can be checked before publishing.
**Related Epic:** EPIC-002

### FR-011: Public and private member data are separated at rest — MUST
**Description:** Publishable listing content and private personal data are stored such that no public read path can reach the private data, even if a policy is misconfigured on one object.
**Acceptance Criteria:**
- Given an unauthenticated caller enumerates every publicly readable object with the browser key, when the results are inspected, then no member name, signup email, postcode, or survey answer is present in any of them.
- Given a listing is published, when it is read publicly, then only the fields named in FR-003 as public are returned.
- Given a listing is not in a published state, when it is read publicly, then it is not returned at all.
- Private member data is readable only through an authenticated admin route.
- A written test or documented check exists that an unauthenticated caller cannot read the private data, and it is part of the release checklist.
**Related Epic:** EPIC-003

### FR-012: Admin member database — MUST
**Description:** Admins can find and read the full record of any member, including all survey answers.
**Acceptance Criteria:**
- Given an admin opens the members list, when it loads, then each member shows name, group, submission date, directory status and newsletter consent.
- Given an admin searches by name, email or business name, when results return, then matching members are shown.
- Given an admin filters by group, directory status, or consent state, then the list narrows accordingly.
- Given an admin opens a member, when the detail view renders, then every answer they gave is shown, including free-text answers and the exact consent record with its timestamp and version.
- Given the list exceeds one page of results, when the admin reaches the end, then more can be loaded without losing filters.
**Related Epic:** EPIC-004

### FR-013: Member data export — SHOULD
**Description:** Admins can export member data for offline analysis and for satisfying data-portability requests.
**Acceptance Criteria:**
- Given an admin exports the current filtered view, when the file downloads, then it contains one row per member with all answers as columns.
- Given an admin exports a single member, then the file contains that member's complete record in a portable format.
- The export respects the active filters shown on screen.
- Exports are available only to authenticated admins.
**Related Epic:** EPIC-004

### FR-014: Demand insights from survey answers — SHOULD
**Description:** The admin panel summarises the preference answers so event planning is evidence-led. This is the reason the survey questions exist.
**Acceptance Criteria:**
- Given an admin opens the insights view, when it loads, then it shows the distribution of preferred day/time slots across all members.
- Given the same view, then it shows counts for event types, event frequency, and — split by branch — what business members are looking for and what support career members want.
- Given a group filter is applied, when the summary recalculates, then it reflects only that group.
- Every count is expressed as both an absolute number and a share of respondents.
- The view states the response base it was computed from.
**Related Epic:** EPIC-004

### FR-015: Directory moderation queue — MUST
**Description:** Every listing reaches the public site only through an explicit admin decision.
**Acceptance Criteria:**
- Given a member opts into the directory, when the submission is stored, then a listing is created in a pending state and is not publicly visible.
- Given an admin opens the queue, when it loads, then pending listings are shown with everything needed to decide, and the count of pending items is visible from the admin home.
- Given an admin publishes a listing, when the public directory is next loaded, then the listing appears.
- Given an admin rejects or holds a listing, then it never becomes public and the reason is recorded against it.
- Given a listing is published, when an admin later unpublishes it, then it disappears from the public directory while the member record is retained.
**Related Epic:** EPIC-005

### FR-016: Admin edits public listing content — MUST
**Description:** Admins can correct a listing's public fields before or after publication, without altering the member's own submitted record.
**Acceptance Criteria:**
- Given an admin edits a listing's public fields and saves, when the public directory renders, then the edited values are shown.
- Given a listing has been admin-edited, when an admin views the member record, then the member's originally submitted values are still visible and distinguishable from the published values.
- Given an admin edits a published listing, when they save, then the listing stays published (editing is not a re-approval).
- Edits are attributed to an admin and dated.
**Related Epic:** EPIC-005

### FR-017: Managed category taxonomy — MUST
**Description:** Directory categories are a controlled list an admin maintains, not free text, so the public directory can be filtered coherently.
**Acceptance Criteria:**
- Given an admin manages categories, when they add, rename, reorder or retire one, then the change is reflected in the public form's category choices and the directory filter.
- Given a category is renamed, when published listings are viewed, then they show the new name without needing re-approval.
- Given a category is retired, when it is no longer offered on the form, then existing listings using it remain published and remain filterable.
- A category cannot be deleted outright while listings reference it; it can only be retired.
**Related Epic:** EPIC-005

### FR-018: Public business directory listing index — MUST
**Description:** A public page listing every published business, browsable without an account.
**Acceptance Criteria:**
- Given a visitor opens the directory, when it loads, then every published listing is shown and no listing in any other state is shown.
- Given a listing card renders, then it shows only business name, category, description, and the presence of links — never a member's name, signup email, or postcode.
- Given there are no published listings, when the page loads, then an explanatory empty state is shown, not a blank page or an error.
- Given the page is still loading, then a loading state is shown.
- The directory is reachable from the site's main navigation.
**Related Epic:** EPIC-006

### FR-019: Directory search and filtering — MUST
**Description:** Visitors can narrow the directory to what they are looking for.
**Acceptance Criteria:**
- Given a visitor selects a category, when the results update, then only listings in that category are shown.
- Given a visitor types a search term, when results update, then listings matching the business name, description or category are shown.
- Given a filter combination matches nothing, when results render, then a no-results state offers a way to clear the filters.
- Given filters are applied, when the visitor reloads or shares the URL, then the same filtered view is restored.
- Search and filter controls are operable by keyboard and announce result counts to assistive technology.
**Related Epic:** EPIC-006

### FR-020: Public listing detail and enquiry — MUST
**Description:** A visitor can view a listing in full and contact the business.
**Acceptance Criteria:**
- Given a visitor opens a listing, when it renders, then it shows business name, category, full description, website, Instagram, and the public enquiry contact — and nothing else about the member.
- Given the visitor uses the enquiry contact, when they act on it, then they reach the contact the member nominated for public use, never the signup email.
- Given a listing is unpublished after being shared, when the old URL is opened, then a clear "no longer listed" state is shown rather than a broken page.
- External links open in a new tab and are marked as external to assistive technology.
- Submitted text is rendered as plain text and never as markup.
**Related Epic:** EPIC-006

### FR-021: Member notification on decision — SHOULD
**Description:** Members learn the outcome of their directory request.
**Acceptance Criteria:**
- Given an admin publishes a listing, when the decision is saved, then the member is emailed with a link to their live listing.
- Given an admin rejects a listing, then the member is emailed a courteous explanation and how to resubmit.
- Given sending fails, when the admin views the listing, then the failure is visible and can be retried; the moderation decision itself is not rolled back.
- Every such email includes the controller's identity and a link to the privacy page.
**Related Epic:** EPIC-005

### FR-022: Admin notification on new submission — COULD
**Description:** Admins are alerted when a submission needs review, so the queue is not something they must remember to check.
**Acceptance Criteria:**
- Given a submission creates a pending listing, when it is stored, then a notification is sent to the admin address.
- Given several arrive in quick succession, when notifications are sent, then they are batched rather than sent one per submission.
- The notification contains no member personal data beyond what is needed to act — it links to the admin panel rather than embedding details.
**Related Epic:** EPIC-005

### FR-023: Member-initiated withdrawal — MUST
**Description:** Members can withdraw their listing and their data without emailing an admin, as the published GDPR policy promises.
**Acceptance Criteria:**
- Given a member follows the withdrawal link from any email or the privacy page, when they confirm, then a removal request is recorded and the admin panel surfaces it.
- Given a listing removal is requested, when an admin actions it, then the listing is unpublished.
- Given a full erasure is requested, when an admin actions it, then the member record, listing, and survey answers are deleted, and only a minimal non-identifying record of the erasure is kept.
- Given a request is recorded, when an admin views it, then the deadline implied by the published policy (20 working days) is shown.
- Withdrawing consent for one purpose does not withdraw it for the others.
**Related Epic:** EPIC-007

### FR-024: Published privacy disclosures match what is collected — MUST
**Description:** The site's privacy page accurately describes the new collection and publication before the form goes live.
**Acceptance Criteria:**
- Given the form is live, when the privacy page is read, then every category of data the form collects is described there.
- Given the directory is live, when the privacy page is read, then it states which fields are published publicly and on what lawful basis.
- Given a visitor is at the point of submitting, when they read the consent section, then it links to that page.
- The retention period applied to member data is stated.
- This requirement gates launch: the form does not go live before the page is updated.
**Related Epic:** EPIC-007

---

## Non-Functional Requirements

> Every NFR is measurable, with a stated measurement method.

### NFR-001: No public read path exposes private member data — MUST (Security)
**Description:** The public/private split must hold under direct probing, not just through the site's own UI.
**Acceptance / Threshold:** Zero private fields (name, signup email, postcode, phone, any survey answer, any consent record) retrievable by an unauthenticated caller using the public browser key against any table, view, or route.
**Measurement Method:** Pre-launch check enumerating every publicly readable object with the anon key and asserting the absence of those fields; repeated after any change touching read policies. Recorded on the release checklist.

### NFR-002: Private data is served only over authenticated admin routes — MUST (Security)
**Description:** Reading private member data requires a verified admin session, checked server-side on every request.
**Acceptance / Threshold:** 100% of endpoints returning private data reject requests with a missing, malformed, or expired token, returning a 401 and no data body.
**Measurement Method:** Per-endpoint verification against absent, malformed, and expired tokens before release.

### NFR-003: Public write endpoint resists automated abuse — MUST (Security)
**Description:** The submission endpoint is rate-limited, decoy-protected and origin-checked.
**Acceptance / Threshold:** A scripted burst of 100 submissions from one source within one minute results in no more than the configured allowance being stored, with the remainder rejected; automated submissions completing the decoy field result in zero moderation tasks.
**Measurement Method:** Scripted burst test against a non-production deployment before launch.

### NFR-004: Consent is evidenced — MUST (Compliance)
**Description:** For any member, GPC can produce what they consented to, when, and to which version of the wording.
**Acceptance / Threshold:** 100% of stored consents carry consent text, version identifier, UTC timestamp and capture method. Zero consent records are mutable after creation.
**Measurement Method:** Inspection of stored records for a sample of submissions; a schema-level guarantee that consent history is append-only.

### NFR-005: Data-subject requests are actionable within the published window — MUST (Compliance)
**Description:** The system supports the 20-working-day deletion commitment already published on the site.
**Acceptance / Threshold:** A withdrawal or erasure request is visible to an admin within one page load of being made, and an admin can complete it in a single workflow without database access.
**Measurement Method:** Walkthrough of a request end-to-end during acceptance, timed and recorded.

### NFR-006: Data minimisation — MUST (Compliance)
**Description:** Nothing is collected that no requirement uses, and nothing is published that the member did not nominate for publication.
**Acceptance / Threshold:** Every stored field traces to at least one FR; the set of publicly readable fields is exactly the FR-003 public list, verified field by field.
**Measurement Method:** Field-by-field audit against this PRD at architecture sign-off and again at release.

### NFR-007: Form completion is achievable in five minutes — MUST (Usability)
**Description:** The form must not become longer than the one it replaces, despite adding directory fields.
**Acceptance / Threshold:** Median completion time ≤ 5 minutes across at least 5 observed sessions; a Career Mum declining the directory answers no business question.
**Measurement Method:** Timed walkthroughs with real members before launch; thereafter, submission timestamps compared against form-start.

### NFR-008: Accessibility — MUST (Usability)
**Description:** The public form and directory meet WCAG 2.1 AA. This is a raise on the current site, which has known gaps (no label/input association, no focus-visible styling, motion preferences ignored).
**Acceptance / Threshold:** Zero WCAG 2.1 AA failures on `/join`, the directory index, and a listing detail page. Every input has a programmatically associated label; every error is announced; visible focus is present on every interactive element; `prefers-reduced-motion` is honoured; contrast ≥ 4.5:1 for body text.
**Measurement Method:** Automated audit plus a manual keyboard-only and screen-reader pass on the three pages, before launch.

### NFR-009: Mobile-first performance — SHOULD (Performance)
**Description:** These pages are reached mostly on phones, often on mobile data.
**Acceptance / Threshold:** Directory index interactive within 3s on a simulated 4G mid-range mobile profile with 100 published listings; the form's initial render adds no more than 50KB gzipped over the existing site shell.
**Measurement Method:** Lighthouse mobile run on a production-equivalent build.

### NFR-010: Directory scales to the expected two-year volume — SHOULD (Scalability)
**Description:** Growth must not force a rewrite of the list views.
**Acceptance / Threshold:** Admin members list and public directory remain usable at 1,000 member records and 300 published listings, with no view loading an unbounded result set.
**Measurement Method:** Seeded-data test at those volumes, measuring page render and payload size.

### NFR-011: No submission is silently lost — MUST (Reliability)
**Description:** A member who sees a success message has been recorded.
**Acceptance / Threshold:** Zero cases where a success response is returned without a persisted record. Partial failures (e.g. notification email fails) still persist the submission and surface the failure to admins.
**Measurement Method:** Failure-injection on the notification path during acceptance, verifying the record persists and the error is visible.

### NFR-012: Conventions of the existing codebase are followed — SHOULD (Maintainability)
**Description:** A single maintainer must be able to work on this a year from now; divergence from established patterns is a real cost.
**Acceptance / Threshold:** New migrations follow the documented conventions (uuid primary keys, `timestamptz`, trigger-maintained `updated_at`, text+CHECK vocabularies, idempotent statements, explicit function grants, documented header). New admin pages reuse the existing layout, navigation and list/form patterns. Zero new runtime dependencies without a logged decision.
**Measurement Method:** Review against `bmad-output/inputs/codebase-constraints-brief.md` at architecture sign-off.

### NFR-013: Moderation actions are attributable — SHOULD (Maintainability / Operability)
**Description:** Because every logged-in account is currently a full admin, decisions about publishing personal data must at least be traceable.
**Acceptance / Threshold:** 100% of publish, reject, unpublish, edit and erasure actions record the acting admin and a UTC timestamp, retrievable per listing.
**Measurement Method:** Inspection of the recorded history after a moderation walkthrough.

---

## Epics and User Stories (Outline)

> An OUTLINE. Ready-for-dev story files are compiled later by the sprint/story skills.

### EPIC-001: Public membership form
**Business Value:** Delivers G1 and G2 — the member-facing front door, in GPC's own hands.
**User Segments:** Business Mums, Career Mums. Note that the **business-listing question cuts across both**: eligibility is having a business, practice or freelance service, not which group was chosen.
**Related Requirements:** FR-001, FR-002, FR-003
**User Stories (sketch):**
- **STORY-001:** As a prospective member, I want to fill in one form on the GPC site, so that I can join without being sent to a third-party tool.
  - Given I open `/join`, when the page loads, then I see a branded GPC form with the intro text an admin wrote.
- **STORY-002:** As a Career Mum, I want to answer only career questions, so that the form stays short and relevant.
  - Given I select "Career Mums", when the form updates, then no question from the Business *survey* branch is shown or required.
  - Given I am self-employed or freelance, when I reach the directory question, then I can still list my business — the survey branch routes my questions, not my eligibility.
- **STORY-003:** As a member who runs a business, I want to give my business details for the directory, so that local parents can find me.
  - Given I opt in, when the section expands, then I am asked for a business name, category, description and a public contact.
  - Given I chose "Career Mums" but work for myself, when I reach the question, then it is offered to me on the same terms as anyone else.
- **STORY-004:** As a member, I want to know exactly which of my answers become public, so that I can decide with confidence.
  - Given I am in the directory section, when I read it, then it names the public fields and confirms my email and postcode stay private.
- **STORY-005:** As a member using a screen reader, I want every field labelled and every error announced, so that I can complete the form independently.
- **STORY-034:** As a member, I want to see at a glance whether the directory is for me, so that I neither fill in business fields I do not have nor miss out because I assumed it was only for people who chose "Business Mums".
  - Given I reach the directory question, when I read it, then it says plainly that it is for members who run a business or work for themselves, freelancers and sole traders included.
  - Given I have no business, when I decline, then I am asked nothing further and nothing suggests I have missed out on something I was entitled to.

### EPIC-002: Admin form configuration
**Business Value:** Delivers U4 — wording changes without a deploy, which is the entire reason for not hard-coding the form.
**User Segments:** GPC admins
**Related Requirements:** FR-008, FR-009, FR-010
**User Stories (sketch):**
- **STORY-006:** As an admin, I want to edit a question's wording, so that I can fix a typo (the live form says "Weekly Newletter") without asking a developer.
- **STORY-007:** As an admin, I want to add and retire choice options, so that the categories and interests stay current.
  - Given I retire an option, when I view past submissions, then their historical answers still read correctly.
- **STORY-008:** As an admin, I want to close the form, so that I can pause intake while we catch up on moderation.
- **STORY-009:** As an admin, I want to preview each branch, so that I can check my edits before members see them.

### EPIC-003: Submission pipeline, consent and anti-abuse
**Business Value:** Delivers G4 and G5 — the trust boundary. This epic is where the privacy guarantees are actually made or lost.
**User Segments:** All (cross-cutting)
**Related Requirements:** FR-004, FR-005, FR-006, FR-007, FR-011
**User Stories (sketch):**
- **STORY-010:** As the data controller, I want every submission written by a trusted server path, so that a member's consent record cannot be forged by whoever holds the public key.
- **STORY-011:** As the data controller, I want consent stored with its exact wording, version and timestamp, so that I can evidence what each member agreed to.
- **STORY-012:** As a member, I want to choose separately whether to be listed and whether to get the newsletter, so that one tick does not sign me up to everything.
- **STORY-013:** As an admin, I want spam blocked before it reaches my queue, so that moderation stays a few minutes a week.
- **STORY-014:** As the data controller, I want private data physically separated from public data, so that one misconfigured policy cannot expose a member's home postcode.
- **STORY-015:** As a member, I want to resubmit without creating a duplicate of myself.

### EPIC-004: Admin member database and insights
**Business Value:** Delivers G3 — turns the survey from data collection into decision-making.
**User Segments:** GPC admins
**Related Requirements:** FR-012, FR-013, FR-014
**User Stories (sketch):**
- **STORY-016:** As an admin, I want to search and filter members, so that I can find someone quickly.
- **STORY-017:** As an admin, I want to see a member's full record including their consent history, so that I can answer a data-subject request accurately.
- **STORY-018:** As an admin, I want to see which day and time slots members prefer, so that I schedule events when people can actually come.
- **STORY-019:** As an admin, I want to see what business members are looking for and what support career members want, so that I can plan the right workshops.
- **STORY-020:** As an admin, I want to export the member list, so that I can work offline and satisfy portability requests.

### EPIC-005: Directory moderation
**Business Value:** Delivers G5 — the guarantee that nothing reaches the public site by accident.
**User Segments:** GPC admins, members awaiting a decision
**Related Requirements:** FR-015, FR-016, FR-017, FR-021, FR-022
**User Stories (sketch):**
- **STORY-021:** As an admin, I want a queue of pending listings with a visible count, so that nothing waits unnoticed.
- **STORY-022:** As an admin, I want to publish, hold or reject with a reason, so that decisions are consistent and explicable.
- **STORY-023:** As an admin, I want to tidy up a description before publishing, so that the directory reads well — without overwriting what the member actually submitted.
- **STORY-024:** As an admin, I want to maintain the category list, so that the directory's filters stay coherent as the community grows.
- **STORY-025:** As a member, I want to be told when my listing goes live, so that I know it worked and can share it.
- **STORY-026:** As an admin, I want to unpublish a listing immediately, so that I can respond to a complaint or a member's request.
- **STORY-035:** As an admin, I want a standard, kindly-worded reason for "this isn't a business listing", so that I can decline an off-scope submission without improvising an explanation or implying the member is unwelcome.
  - Given a submission is not a business, when I reject it, then the member is told the directory lists businesses, that nothing else about her membership changes, and how to resubmit if she does have one.

### EPIC-006: Public business directory
**Business Value:** Delivers G1 and U5 — the visible product, and the reason members opt in at all.
**User Segments:** Public visitors, listed members
**Related Requirements:** FR-018, FR-019, FR-020
**User Stories (sketch):**
- **STORY-027:** As a local parent, I want to browse local businesses run by members, so that I can support the community.
- **STORY-028:** As a local parent, I want to filter by category and search by name, so that I can find the right kind of business.
  - Note: the site has no existing public text-search pattern — this is net-new.
- **STORY-029:** As a local parent, I want to open a listing and contact the business, so that I can make an enquiry.
- **STORY-030:** As a listed member, I want my listing to show my business and not my personal details, so that being listed costs me no privacy.

### EPIC-007: Privacy, rights and retention
**Business Value:** Delivers G4 — makes the site's published promises true. Gates launch.
**User Segments:** All members, the data controller
**Related Requirements:** FR-023, FR-024
**User Stories (sketch):**
- **STORY-031:** As the data controller, I want the privacy page to describe everything this form collects and publishes, so that our disclosures are accurate before we collect anything.
- **STORY-032:** As a member, I want to withdraw my listing or my data myself, so that I do not have to email and wait.
- **STORY-033:** As an admin, I want withdrawal requests to appear as actionable work with their deadline, so that we meet the 20-working-day commitment we published.

---

## Prioritization Summary (MoSCoW)

| Priority | Requirements | Rationale |
|---|---|---|
| **Must** | FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-008, FR-009, FR-011, FR-012, FR-015, FR-016, FR-017, FR-018, FR-019, FR-020, FR-023, FR-024; NFR-001–008, NFR-011 | This is the irreducible product: a form that collects publishable content, a boundary that keeps personal data private, a moderation gate, a public directory, and disclosures that make it lawful. Removing any one either breaks the privacy guarantee or leaves the directory undeliverable. FR-008/FR-009 are Must because "configurable from admin" is the user's stated requirement, not a nice-to-have. |
| **Should** | FR-007, FR-010, FR-013, FR-014, FR-021; NFR-009, NFR-010, NFR-012, NFR-013 | Real value, but each has a workaround for a first release: duplicates can be merged by hand at low volume, preview can be done on a staging URL, export and insights can wait one cycle, and approval emails can be sent manually while volume is small. |
| **Could** | FR-022 | Admin notification is convenience; the visible pending count in FR-015 already prevents work being lost. |
| **Won't (this release)** | Generic form builder; member self-service login and self-editing of listings; logo/image upload on listings; paid or featured listings; public reviews or ratings; geographic search; a public map; admin role tiers; directory analytics for members; automated approval | Each is either a large independent build or depends on capabilities this release deliberately defers. See Out of Scope. |

Note: 18 of 24 FRs are Must, which is above the usual 60% guideline. This is defensible here because the release is a single indivisible user journey (submit → moderate → publish) plus a legal gate — a partial build would either collect data with nowhere to show it or publish without lawful disclosure. The Should/Could items are the genuinely severable parts. Logged in `decision-log.md`.

---

## Success Metrics

| Metric | Baseline | Target | Measurement Method | Frequency |
|---|---|---|---|---|
| Directory listings published | 0 (no directory exists) | ≥ 20 within 3 months of launch | Count of published listings in admin | Monthly |
| Form completion rate | Unknown (Tally analytics not in GPC's hands) | ≥ 70% of starts reach submission | Form starts vs. submissions | Monthly |
| Median completion time | ~5 min claimed, unverified | ≤ 5 min | Timed walkthroughs pre-launch; timestamps after | Pre-launch, then quarterly |
| Private data exposed publicly | Not currently testable | **Zero**, permanently | The NFR-001 probe, on the release checklist | Every release touching read policies |
| Time from submission to moderation decision | n/a | Median ≤ 5 working days | Timestamps on listing state changes | Monthly |
| Spam submissions reaching the queue | n/a | < 5% of pending items | Rejected-vs-accepted counters (FR-006) | Monthly |
| Listing opt-in rate among members with a business | Unknown | ≥ 60% | Opt-ins / (Business Mums + Both + Career Mums who selected "Self-employed" or "Freelance"). The denominator is **eligibility, not group** — measuring against Business-or-Both alone would hide every self-employed member who chose "Career Mums". | Quarterly |
| Data-subject requests completed in ≤ 20 working days | Not tracked | 100% | Request records with dates | Per request |

---

## Assumptions and Dependencies

### Assumptions

1. Members submitting the form are adults acting for themselves; the form collects no data about children. (If that changes, the safeguarding policy applies and this PRD must be revisited.)
2. Volume is community-scale — order of hundreds of members, not thousands — so a moderation queue worked by a small admin team is viable.
3. Every logged-in admin may see every member's private data. There are no admin tiers today, and this release does not add them; the mitigation is attribution (NFR-013), not restriction.
4. The existing Supabase project, Vercel deployment and Brevo account remain the platform; no new vendor is introduced without a logged decision.
5. Business Mums are willing to nominate a public contact separate from their personal email. If many are not, the enquiry mechanism needs rethinking — flagged as an open question.
6. The Tally form will be retired, or redirected to `/join`, once this ships. Historic Tally responses will need a migration decision — see the addendum.
7. The published Google Drive privacy notice referenced by the current form is superseded by the on-site `/privacy` page.

### Dependencies

| Dependency | Type | Owner | Status | Risk | Mitigation |
|---|---|---|---|---|---|
| Privacy page updated with new collection and publication disclosures | Legal / content | Aster Thackery (controller) | Not started | **High — gates launch (FR-024)** | Draft alongside the build, not after; treat as a release blocker |
| Category taxonomy agreed | Content | GPC admins | Not started | Medium — shapes the form and the directory filter | Ship a starter list from the source form's industry answers; FR-017 makes it editable |
| Consent wording approved | Legal / content | Controller | Not started | High — it is versioned and stored, so late changes create two versions | Approve before first live submission |
| Transactional email capability (FR-021/022) | Technical | Builder | Absent — Brevo integration creates contacts only, sends nothing | Medium | Both notification FRs are Should/Could; launch can proceed with manual emails |
| Anti-abuse mechanism chosen | Technical | Builder | Absent — no rate limiter, CAPTCHA or honeypot exists | **High — FR-006 is Must** | Architecture must select an approach; prefer one that adds no new third party, for privacy-disclosure reasons |
| Existing Tally responses | Data | GPC admins | Held in Tally | Low | Decide import vs. fresh start; addendum Q6 |

---

## Constraints

- **Technical:** React 19 + Vite + Tailwind v4 (no config file; tokens live in `src/index.css`), Supabase Postgres with RLS on all tables, Vercel serverless functions, `react-router` v7. No TypeScript in `src/`, no form library, no data-fetching library. The browser holds only the public anon key, so RLS is the only client-side boundary. Migrations are sequential SQL starting at `028`. New runtime dependencies require a logged decision.
- **Business:** One builder, part-time. Community organisation budget — solutions with recurring per-seat or per-request cost need justification. Every new third-party processor must be added to the published privacy disclosures, which raises the cost of adding vendors beyond the licence fee.
- **Timeline:** No fixed external deadline, but the current form is live and collecting data under a consent record that cannot be evidenced. That exposure argues for shipping EPIC-003 and EPIC-007 early rather than last.
- **Legal:** The site's published GDPR policy names Consent as the lawful basis for opt-in data, commits to data minimisation, to deletion within 20 working days, to informing data subjects before sharing data with third parties, and to no non-safeguarded transfers outside the UK. The directory publishes personal data (a sole trader's business contact is personal data) and therefore needs its own stated basis and its own explicit consent.

---

## Out of Scope

| Excluded | Reason | Revisit? |
|---|---|---|
| Generic drag-and-drop form builder | User decision: a configurable single form meets the need at a fraction of the cost. A dynamic-schema builder has no precedent in this codebase and roughly triples the work. | Only if GPC needs several unrelated public forms |
| **A member directory (all members, not just businesses)** | A **separate, later product**, and a different thing from this release: it lists people rather than businesses, so it carries personal details and must sit **behind a member login** — which needs an authentication system that does not exist. This release ships the public *business* directory only. | Yes — as its own piece of work, once member authentication exists |
| Member login and self-service listing editing | Requires a member auth system that does not exist; admin-mediated edits (FR-016) cover the need at this volume | When listings exceed what admins can maintain by hand |
| Logo / image upload on listings | Public upload would be an unauthenticated file dropbox — the one storage bucket is public, has no policies in any migration, no size or MIME validation, and no deletion path | After a private bucket with a signed-upload path exists |
| Paid, featured or sponsored listings | No payment capability; changes the directory's character and its lawful basis | If the directory becomes a revenue stream |
| Public reviews, ratings or comments | A whole moderation problem of its own, with defamation exposure | Not before the directory has real traffic |
| Geographic search, distance filtering, map view | Follows directly from the decision to keep location entirely private; nothing to search on | If the location decision is revisited (addendum Q1) |
| Publishing any location, even approximate | Explicit user decision — postcode and area stay admin-only | See addendum Q1; flagged as a product tension for a "local" directory |
| Admin permission tiers | Every authenticated user is a full admin today; adding tiers means a role model plus checks in every route and policy | If GPC admits admins who should not see member personal data |
| Directory analytics for members ("your listing got N views") | Requires view tracking, which is new collection and new disclosure | Later, if members ask |
| Automatic approval of any listing | Contradicts the moderation decision and the "trusted directory" promise | No |
| Importing historical Tally responses | Consent basis for the imported records is unclear and needs a controller decision | Addendum Q6, before Tally is retired |

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation | Owner |
|---|---|---|---|---|
| A member's personal data becomes publicly readable through a misconfigured policy or a view | **Severe** — reportable breach; the site publishes an ICO-notification commitment | Medium — this has already happened once on this codebase (a view was anon-readable in production and needed a corrective migration) | Physical table separation (FR-011), private data served only via authenticated routes (NFR-002), and the NFR-001 probe on the release checklist for every release touching read policies | Builder |
| The public write endpoint is abused | High — junk floods the queue and the database; moderation becomes unworkable | **High** — the existing public endpoint has no rate limit, CAPTCHA, honeypot or origin check | FR-006 as a Must, with the NFR-003 burst test before launch | Builder |
| Members submit consent that cannot be evidenced | High — the published lawful basis is Consent; unevidenced consent is no consent | Medium — this is the current state | FR-004 append-only records with text, version and timestamp; wording approved before the first live submission | Controller |
| The privacy page is not updated before launch | High — collecting and publishing beyond what is disclosed | Medium — it is content work, easily deprioritised behind code | FR-024 is a Must and an explicit launch gate; drafted in parallel with the build | Controller |
| A directory with no location is not useful for a *local* directory | Medium — weakens the core value proposition | Medium | Category filter and search do the discovery work; revisit via addendum Q1 with a member-visible outcode as the fallback | PM |
| Members will not nominate a separate public contact and put their personal email in anyway | Medium — defeats the privacy design from the inside | Medium | Field-level guidance at the point of collection; admins can flag it at moderation | UX / admins |
| Every admin can read every member's data, with no tiers and no read audit | Medium — a shared or compromised login exposes the whole member base | Low-Medium | Attribution on all moderation actions (NFR-013); admin tiers logged as deferred, revisit if the admin group grows | Builder |
| Scope grows into a form builder mid-build | High — triples the work | Low — decided explicitly | The Won't list; FR-008 fixes the field set and branching in code | PM |
| Free-text descriptions carry markup or scripts | Medium — the site sets no CSP and no security headers | Low | Render submitted content as text only, never as markup (FR-020); enforce server-side length limits (FR-006) | Builder |
| Notification email is unavailable, so members never learn their listing is live | Low | Medium — no transactional send exists today | FR-021 is a Should; partial failure must not roll back the decision (NFR-011) | Builder |

---

## Traceability Matrix

| Requirement | Business Goal | Epic | User Story | Status |
|---|---|---|---|---|
| FR-001 | G1, G2 | EPIC-001 | STORY-001, STORY-005 | draft |
| FR-002 | G2, U3 | EPIC-001 | STORY-002 | draft |
| FR-003 | G1, U2 | EPIC-001 | STORY-003, STORY-004, STORY-034 | draft |
| FR-004 | G4 | EPIC-003 | STORY-011, STORY-012 | draft |
| FR-005 | G4, G5 | EPIC-003 | STORY-010 | draft |
| FR-006 | G5 | EPIC-003 | STORY-013 | draft |
| FR-007 | G2 | EPIC-003 | STORY-015 | draft |
| FR-008 | G2, U4 | EPIC-002 | STORY-006, STORY-007 | draft |
| FR-009 | U4 | EPIC-002 | STORY-008 | draft |
| FR-010 | U4 | EPIC-002 | STORY-009 | draft |
| FR-011 | G4, G5 | EPIC-003 | STORY-014 | draft |
| FR-012 | G3 | EPIC-004 | STORY-016, STORY-017 | draft |
| FR-013 | G3, G4 | EPIC-004 | STORY-020 | draft |
| FR-014 | G3 | EPIC-004 | STORY-018, STORY-019 | draft |
| FR-015 | G5 | EPIC-005 | STORY-021, STORY-022, STORY-026, STORY-035 | draft |
| FR-016 | G5 | EPIC-005 | STORY-023 | draft |
| FR-017 | G1, G5 | EPIC-005 | STORY-024 | draft |
| FR-018 | G1, U5 | EPIC-006 | STORY-027, STORY-030 | draft |
| FR-019 | U5 | EPIC-006 | STORY-028 | draft |
| FR-020 | G1, U5 | EPIC-006 | STORY-029 | draft |
| FR-021 | U1 | EPIC-005 | STORY-025 | draft |
| FR-022 | G5 | EPIC-005 | (admin convenience) | draft |
| FR-023 | G4, U6 | EPIC-007 | STORY-032, STORY-033 | draft |
| FR-024 | G4 | EPIC-007 | STORY-031 | draft |
| NFR-001 | G4, G5 | (cross-cutting) | STORY-014 | draft |
| NFR-002 | G4 | (cross-cutting) | STORY-010 | draft |
| NFR-003 | G5 | (cross-cutting) | STORY-013 | draft |
| NFR-004 | G4 | (cross-cutting) | STORY-011 | draft |
| NFR-005 | G4 | (cross-cutting) | STORY-033 | draft |
| NFR-006 | G4 | (cross-cutting) | — | draft |
| NFR-007 | U1, U3 | (cross-cutting) | STORY-002 | draft |
| NFR-008 | U1 | (cross-cutting) | STORY-005 | draft |
| NFR-009 | U5 | (cross-cutting) | — | draft |
| NFR-010 | G3 | (cross-cutting) | — | draft |
| NFR-011 | G2 | (cross-cutting) | STORY-010 | draft |
| NFR-012 | — (maintainer constraint) | (cross-cutting) | — | draft |
| NFR-013 | G4, G5 | (cross-cutting) | STORY-022 | draft |

No orphan requirements: every FR and NFR traces to at least one business goal and one epic or is explicitly cross-cutting. NFR-012 traces to the sole-maintainer constraint rather than a business goal, recorded here deliberately rather than by inventing a goal for it.

---

## Handoff

- **To Architecture:** The decisive questions are (1) the storage split that satisfies FR-011 and NFR-001 given that RLS is row-level and views do not enforce it; (2) how form configuration is stored so admins can edit labels and options while the field set and branching stay code-defined, and how retired options keep historical answers readable (FR-008); (3) the anti-abuse mechanism for FR-006, preferring an option that introduces no new third-party processor, since any new vendor must be added to the published privacy disclosures; (4) the consent record's shape, which must be append-only and version-bearing (FR-004, NFR-004); and (5) whether transactional email is in the first release at all. The constraints brief at `bmad-output/inputs/codebase-constraints-brief.md` documents the existing patterns, the traps this codebase has already fallen into, and what does not exist — treat it as binding input.
- **To UX:** `DESIGN.md` and `EXPERIENCE.md` cover the form's branching journey, the public/private disclosure moment (FR-003, FR-004), the moderation queue, and the directory browse-and-enquire flow, against the WCAG 2.1 AA bar in NFR-008.
- **To Sprint/Story Planning:** the epic outline above is the source for story compilation. EPIC-003 and EPIC-007 carry the legal gate and should not be scheduled last.
- **Open questions / overflow:** see `addendum.md`.

---

## Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-08-18 | John (PM) — bmad-prd | Initial draft. Track escalated Quick Flow → BMad Method. Inputs: Tally form analysis, codebase constraints brief, three user scope decisions. |
