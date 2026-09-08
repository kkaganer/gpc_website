# Epics — GPC Membership Intake & Community Business Directory

> The epic **MAP**. A thin index, not a context object. Story detail lives in
> `bmad-output/stories/{epic}.{story}.{slug}.story.md`.
>
> **Track:** BMad Method
> **Sources:** `prd.md`, `architecture.md`, `DESIGN.md`, `EXPERIENCE.md`, `decision-log.md`,
> `inputs/codebase-constraints-brief.md`

**Note on numbering.** These epics are cut for **implementation order**, which is not the same as
the PRD's thematic grouping. Each epic below cites the PRD epic(s) it delivers. The main
divergence is deliberate and required by the sizing rule: **schema migrations are split out into
Epic 1** rather than bundled with the feature logic that uses them
[Source: REFERENCE.md#2-sizing-rule — "bundles a schema migration with feature logic — split the
migration out first"].

---

## Epic 1: Data foundation

**Goal:** Every table, policy, grant, trigger and function this feature needs exists in Postgres,
with the public/private boundary provably enforced — before any code depends on it.

**In scope (cited):**
- FR-011 — public and private data separated at rest [Source: prd.md#FR-011]
- NFR-001 — no public read path exposes private member data [Source: prd.md#NFR-001]
- NFR-004 — consent is evidenced (the append-only mechanism) [Source: prd.md#NFR-004]
- NFR-012 — existing conventions followed [Source: prd.md#NFR-012]
- Delivers the data layer for PRD **EPIC-003**.

**Architecture touchpoints:** ADR-001 (split + column grants), ADR-002 (conventions, migrations
028–031), ADR-010 (append-only consent), ADR-012 (status vocabulary), ADR-015 (`erase_member`)
[Source: architecture.md#3-architecture-decision-records], data model
[Source: architecture.md#5-data-model].

**Out of scope:** any API route or UI; the `submit_membership()` transaction function (Epic 4,
because it encodes submission logic rather than schema).

**Stories (ordered):**

| ID | Slug | Intent | Status |
|---|---|---|---|
| 1.1 | directory-core-migration | Migration 028: `members`, `member_submissions`, `directory_listings`, `directory_categories`, RLS, **column grants** | ready-for-dev |
| 1.2 | consent-records-migration | Migration 029: `member_consents` + append-only trigger + current-consent function | ready-for-dev |
| 1.3 | form-configuration-migration | Migration 030: `form_config_versions`, `form_question_config`, `form_options`, `form_settings` | ready-for-dev |
| 1.4 | abuse-outbound-requests-migration | Migration 031: `abuse_events`, `outbound_emails`, `data_requests`, sweep + `erase_member()` | ready-for-dev |
| 1.5 | privacy-boundary-probe | The NFR-001 anon-key enumeration probe and its release-checklist entry | ready-for-dev |
| 1.6 | route-and-api-module-scaffold | Per-feature route modules + per-domain API clients (ADR-016). **Sole owner of `App.jsx` and `adminApi.js`** | ready-for-dev |

**Cross-epic dependencies:**
- Blocks: **every** other epic — nothing can be built against a schema that does not exist.

---

## Epic 2: Form configuration

**Goal:** An admin can change the form's wording, options and required flags, close the form, and
preview each branch — without a deploy, and without being able to alter its structure.

**In scope (cited):**
- FR-008 — admin edits form question content [Source: prd.md#FR-008]
- FR-009 — admin opens and closes the form [Source: prd.md#FR-009]
- FR-010 — admin previews the form [Source: prd.md#FR-010]
- FR-006 criterion 5 — the admin-visible rejected-submission counter, and with it the **only UX
  surface of NFR-003** [Source: prd.md#FR-006]
- Delivers PRD **EPIC-002**.

**Architecture touchpoints:** ADR-008 (code registry + DB overlay + versioned publish), ADR-011
(abuse tile) [Source: architecture.md#adr-008-form-configuration--code-defined-registry-database-overlay-and-versioned-publish];
Form Configuration component [Source: architecture.md#component-form-configuration-admin];
screens [Source: EXPERIENCE.md#4-configuring-the-form].

**Out of scope:** category management (owned by Epic 5 — one home, immediate effect, per
adjudication A3); the public renderer (Epic 3).

**Stories (ordered):**

| ID | Slug | Intent | Status |
|---|---|---|---|
| 2.1 | question-code-registry | `src/lib/join/questions.js` — the code-defined field set, types, branch membership, validation | ready-for-dev |
| 2.2 | join-config-endpoint | `GET /api/join/config` — resolve published config + categories + open state | ready-for-dev |
| 2.3 | admin-form-settings | `/admin/form` shell, open/close toggle (immediate), intro and closed message | ready-for-dev |
| 2.4 | admin-question-editor | Edit labels, help text, required flags; add / rename / reorder / retire options | ready-for-dev |
| 2.5 | form-config-publish | Draft → publish, `jsonb` version snapshot, unsaved-changes guard | ready-for-dev |
| 2.6 | admin-form-preview | Preview each branch against draft edits, creating no data | ready-for-dev |
| 2.7 | abuse-blocked-tile | "Abuse blocked" counters (7/30 day, split by reason) + threshold banner | ready-for-dev |

**Cross-epic dependencies:**
- Blocked by: **1.3** (config tables), **1.4** (`abuse_events` for 2.7).
- Blocks: **Epic 3** (the public form renders what 2.1/2.2 define).

---

## Epic 3: The public form

**Goal:** A member can complete one accessible, branded, mobile-first form at `/join` in under five
minutes, and understands exactly which of her answers become public.

**In scope (cited):**
- FR-001 — public membership form [Source: prd.md#FR-001]
- FR-002 — conditional branch rendering [Source: prd.md#FR-002]
- FR-003 — business listing opt-in captures publishable content [Source: prd.md#FR-003]
- FR-004 — granular consent, member-facing half [Source: prd.md#FR-004]
- NFR-007 — completion ≤5 minutes [Source: prd.md#NFR-007]
- NFR-008 — WCAG 2.1 AA [Source: prd.md#NFR-008]
- NFR-009 — `/join` ≤50KB gzipped over the shell [Source: prd.md#NFR-009]
- Delivers PRD **EPIC-001**.

**Architecture touchpoints:** ADR-007 (state), ADR-008 (renders the registry), ADR-009
(`{key,label}` answers) [Source: architecture.md#component-join-form-public]; visual system
[Source: DESIGN.md#2-component-specifications]; journeys and screens
[Source: EXPERIENCE.md#1-joining--the-public-form], [Source: EXPERIENCE.md#2-the-directory-opt-in-and-consent].

**Out of scope:** the server write path and anti-abuse (Epic 4).

**Stories (ordered):**

| ID | Slug | Intent | Status |
|---|---|---|---|
| 3.1 | form-primitives | Accessible field primitives: label/id pairing, fieldset/legend, error text, character counter, one live region | ready-for-dev |
| 3.2 | join-page-shell | `/join` route, page shell, intro, identity section, navbar CTA, closed state | ready-for-dev |
| 3.3 | branch-rendering | Group choice, branch reveal, discard-on-change, Business and Career question sets | ready-for-dev |
| 3.4 | events-community-sections | Event types, the 21-slot day/time control, frequency (single-select), community questions | ready-for-dev |
| 3.5 | listing-opt-in | Opt-in question, listing fields, and the public/private disclosure panel with live echo | ready-for-dev |
| 3.6 | consent-section | Three separate consents, none pre-ticked, linked to `/privacy` | ready-for-dev |
| 3.7 | validation-and-error-summary | On-blur validation, error summary above submit, focus always to summary | ready-for-dev |
| 3.8 | confirmation-and-errors | Confirmation rendered from the request payload; network / 429 / closed / duplicate states | ready-for-dev |

**Cross-epic dependencies:**
- Blocked by: **2.1**, **2.2**.
- Blocks: **Epic 4** (nothing to submit without it) — though 4.x can be built against a stub.

---

## Epic 4: Submission pipeline

**Goal:** Every submission is written once, atomically, by a trusted server path that a stranger
cannot abuse and a submitter cannot use to author their own consent.

**In scope (cited):**
- FR-004 — evidenced consent, server half [Source: prd.md#FR-004]
- FR-005 — single trusted server write path [Source: prd.md#FR-005]
- FR-006 — abuse and spam protection [Source: prd.md#FR-006]
- FR-007 — duplicate submission handling [Source: prd.md#FR-007]
- NFR-002, NFR-003, NFR-004, NFR-011 [Source: prd.md#non-functional-requirements]
- Delivers PRD **EPIC-003**.

**Architecture touchpoints:** ADR-004 (allowlist, never spread the body), ADR-005 (non-disclosure),
ADR-010 (server-assigned consent), ADR-011 (four abuse layers, in order)
[Source: architecture.md#component-submission-service-post-apijoinsubmit].

**Out of scope:** UI (Epic 3); email delivery (Epic 5, via the queue).

**Stories (ordered):**

| ID | Slug | Intent | Status |
|---|---|---|---|
| 4.1 | submit-membership-transaction | `submit_membership()` — members + submission + consents + pending listing in one transaction | ready-for-dev |
| 4.2 | submit-endpoint | `POST /api/join/submit` — allowlist mapping, validation, server-assigned consent, JSON errors | ready-for-dev |
| 4.3 | anti-abuse-layers | Origin check, honeypot (silent success), Postgres rate limit on hashed IP, length limits | ready-for-dev |
| 4.4 | duplicate-and-idempotency | Idempotency key, email upsert, resubmission → `pending` without altering the public listing | ready-for-dev |

**Cross-epic dependencies:**
- Blocked by: **1.1**, **1.2**, **1.4**, **2.1**.
- Blocks: **Epic 5** (nothing to moderate until submissions exist).

---

## Epic 5: Moderation and shared admin

**Goal:** Nothing reaches the public site without an admin's explicit act, and Ash can decide in
two clicks on a laptop or a phone.

**In scope (cited):**
- FR-015 — moderation queue [Source: prd.md#FR-015]
- FR-016 — admin edits public listing content [Source: prd.md#FR-016]
- FR-017 — managed category taxonomy [Source: prd.md#FR-017]
- FR-021 — member notification on decision [Source: prd.md#FR-021]
- FR-022 — admin notification on new submission [Source: prd.md#FR-022]
- NFR-011, NFR-013 [Source: prd.md#non-functional-requirements]
- Delivers PRD **EPIC-005**.

**Architecture touchpoints:** ADR-012 (status vocabulary), ADR-013 (immutable slug), ADR-014
(outbound queue, pluggable sender) [Source: architecture.md#component-moderation-admin];
screens [Source: EXPERIENCE.md#3-moderating-the-directory].

**Out of scope:** the public directory itself (Epic 6).

**Stories (ordered):**

| ID | Slug | Intent | Status |
|---|---|---|---|
| 5.1 | shared-admin-chrome | Responsive `AdminLayout` drawer, one `Dialog` primitive, shared `Spinner`, global reduced-motion reset, admin skip link | ready-for-dev |
| 5.2 | moderation-queue | `/admin/directory` list, pending count on the shell, overdue treatment, place preserved after each decision | ready-for-dev |
| 5.3 | listing-review-and-decide | Review/edit screen, submitted-vs-published values, publish / hold / reject-with-reason / unpublish, attribution | ready-for-dev |
| 5.4 | category-management | `/admin/directory/categories` — add, rename, reorder, retire; delete only at zero references | ready-for-dev |
| 5.5 | outbound-email-queue | Queue drain, pluggable Brevo sender, failure visible and retryable, decision never rolled back | ready-for-dev |

**Cross-epic dependencies:**
- Blocked by: **1.1**, **1.4**, **4.1**.
- Blocks: **Epic 6** (publishing is what makes the directory non-empty).

---

## Epic 6: The public business directory

**Goal:** A local parent can find a member business and contact it, and a listed member's personal
details are nowhere on the page.

**In scope (cited):**
- FR-018 — public directory index [Source: prd.md#FR-018]
- FR-019 — search and filtering [Source: prd.md#FR-019]
- FR-020 — listing detail and enquiry [Source: prd.md#FR-020]
- NFR-008, NFR-009, NFR-010 [Source: prd.md#non-functional-requirements]
- Delivers PRD **EPIC-006**.

**Architecture touchpoints:** ADR-001 (direct anon read is safe *because* of the split), ADR-007
(500-listing bound), ADR-013 (slug) [Source: architecture.md#component-directory-public];
screens [Source: EXPERIENCE.md#6-the-public-directory].

**Out of scope:** listing images (`FR-D02`); any location (`FR-D03`); sort options (`FR-D09`).

**Stories (ordered):**

| ID | Slug | Intent | Status |
|---|---|---|---|
| 6.1 | directory-index | `/directory` card grid, category filter, text search, URL-reflected filters, empty state, nav entry | ready-for-dev |
| 6.2 | listing-detail-and-not-found | `/directory/:slug`, plain-text rendering, external links, "no longer listed", **site catch-all 404** | ready-for-dev |

**Cross-epic dependencies:**
- Blocked by: **1.1**, **5.3**.

---

## Epic 7: Member records and insights

**Goal:** Ash can answer "what do you hold about me?" from one screen, and schedule the next event
from evidence rather than guesswork.

**In scope (cited):**
- FR-012 — admin member database [Source: prd.md#FR-012]
- FR-013 — member data export [Source: prd.md#FR-013]
- FR-014 — demand insights [Source: prd.md#FR-014]
- NFR-002, NFR-006, NFR-010 [Source: prd.md#non-functional-requirements]
- Delivers PRD **EPIC-004**.

**Architecture touchpoints:** ADR-003, ADR-007 (server-side aggregation), ADR-009 (group by key,
display label) [Source: architecture.md#component-member-records--insights-admin];
screens [Source: EXPERIENCE.md#5-member-records-and-demand-insights].

**Out of scope:** anything that publishes survey answers — this is the admin plane only.

**Stories (ordered):**

| ID | Slug | Intent | Status |
|---|---|---|---|
| 7.1 | members-list | `/admin/members` — search, filters, `MAX_ROWS`/`PAGE_SIZE` bounds, stat tiles over the full set | ready-for-dev |
| 7.2 | member-record | `/admin/members/:id` — every answer, consent history, listing link, copyable consent record | ready-for-dev |
| 7.3 | insights-aggregation | SQL aggregation function over `answers` — day/time grid, event demand, branch split | ready-for-dev |
| 7.4 | insights-view | `/admin/insights` — the readable 7×3 grid, counts as absolute + share, response base, group filter | ready-for-dev |
| 7.5 | member-export | Filtered-view and single-member export | ready-for-dev |

**Cross-epic dependencies:**
- Blocked by: **1.1**, **1.2**, **5.1**.

---

## Epic 8: Data rights and privacy

**Goal:** Make the promises the site already publishes true — a member can withdraw or erase without
emailing anyone, and the privacy page describes what is actually collected.

**In scope (cited):**
- FR-023 — member-initiated withdrawal [Source: prd.md#FR-023]
- FR-024 — published privacy disclosures match collection [Source: prd.md#FR-024]
- NFR-005 — actionable within 20 working days [Source: prd.md#NFR-005]
- Delivers PRD **EPIC-007**.

**Architecture touchpoints:** ADR-015 (`erase_member()`, cascade), ADR-014 (token email)
[Source: architecture.md#component-data-rights-public--admin];
screens and the `/privacy` IA [Source: EXPERIENCE.md#7-data-rights-errors-and-edge-cases].

**Out of scope:** an automated retention sweep (`FR-D08`) — no cron exists.

**Stories (ordered):**

| ID | Slug | Intent | Status |
|---|---|---|---|
| 8.1 | privacy-page-update | `/privacy` rewritten to the specified IA. **LAUNCH GATE.** Content authored by the controller | ready-for-dev |
| 8.2 | my-data-request | `/my-data` + `POST /api/my-data/request` — non-oracle response, signed expiring token by email | ready-for-dev |
| 8.3 | my-data-manage | `/my-data/manage` — token-authenticated; unlist / unsubscribe / erase, each independent | ready-for-dev |
| 8.4 | admin-data-requests | `/admin/data-requests` queue with 20-working-day deadline, and the erasure workflow | ready-for-dev |

**Cross-epic dependencies:**
- Blocked by: **1.4**, **5.1**, **5.5**.
- **Ships in the same release as everything else** — the site already promises withdrawal at any
  time, so deferring this epic would widen the gap this project exists to close.

---

## Delivery Tracking (count-based)

No story points, velocity, or burndown. Track by COUNT only:

- **Total stories:** 46
- **Done:** 0
- **Remaining:** 46
- **Completion rate:** 0 / 46

| Epic | Stories | Notes |
|---|---|---|
| 1 — Data foundation | 6 | +1.6 route/API scaffold, added after the scope-conflict check |
| 2 — Form configuration | 7 | |
| 3 — The public form | 9 | 3.1 split → 3.1a / 3.1b |
| 4 — Submission pipeline | 4 | |
| 5 — Moderation and shared admin | 7 | 5.2 → 5.2a/5.2b · 5.5 → 5.5a/5.5b |
| 6 — Public business directory | 2 | |
| 7 — Member records and insights | 5 | |
| 8 — Data rights and privacy | 6 | 8.3 → 8.3a/8.3b · 8.4 → 8.4a/8.4b |

## Notes

**Why 46 stories from a 35-story PRD outline.** The PRD outline sketches *user-visible value*; this
map cuts *implementable units*. Five migrations and shared admin chrome are real work with no user
story of their own, and several PRD stories exceeded one dev-day and were split by layer
[Source: REFERENCE.md#2-sizing-rule]. No PRD story was dropped.

**Sequencing rationale.** Epic 1 first because everything depends on the schema and because
NFR-001 — the only zero-tolerance requirement — is proved there, before any code can accidentally
undermine it. Epics 2→3→4 follow the dependency chain: the registry defines the form, the form
produces a payload, the pipeline persists it. Epic 5 must precede Epic 6 so nothing can reach the
public site un-moderated. Epics 7 and 8 depend only on the schema and shared chrome, so they are the
most parallelisable.

**Risk epics.** **Epic 4** carries the security surface — it is the only public write path, and the
order of its abuse layers is load-bearing. **Epic 1** carries NFR-001; a mistake there is invisible
until probed, which is exactly why 1.5 exists as its own story.

**Parallel safety.** The Owned-Scope conflict checker was run across all 46 stories. It initially
found **274 conflicting pairs, 76% of them on just two files** — `src/App.jsx` (170) and
`src/lib/adminApi.js` (39) — because every feature appends to both. That produced **ADR-016** and
story **1.6**: per-feature route modules and per-domain API clients, after which those two files
have a single owner. Conflicts fell to **109**, and what remains is legitimate *within-epic*
sequencing (one page, one hook, one queue screen built by successive stories) rather than avoidable
contention. `bmad-parallel-plan` can now build real waves from this.

**Two blockers sit outside the backlog** and are not stories any dev agent can close:
addendum **Q8** (the retention figure inside the consent text) blocks the first live submission, and
**FR-024**'s content is the controller's to author. Story 8.1 delivers the page; it cannot deliver
the decision.
