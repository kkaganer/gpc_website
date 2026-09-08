# System Architecture: GPC Membership Intake & Community Business Directory

**Document Version:** 1.1
**Date:** 2026-08-18
**Author:** Winston (Architect)
**Track:** BMad Method
**Status:** Draft
**Source PRD:** `bmad-output/prd.md` · **UX:** `DESIGN.md`, `EXPERIENCE.md` · **Constraints:** `inputs/codebase-constraints-brief.md`

> Single source of truth for cross-cutting technical decisions. Every story compiled by
> `bmad-epics-and-stories` inherits the **LOCKED** decisions recorded here.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Pattern](#2-architecture-pattern)
3. [Architecture Decision Records](#3-architecture-decision-records)
4. [Component Design](#4-component-design)
5. [Data Model](#5-data-model)
6. [API Specifications](#6-api-specifications)
7. [FR / NFR Coverage Matrix](#7-fr--nfr-coverage-matrix)
8. [Technology Stack](#8-technology-stack)
9. [Trade-off Analysis](#9-trade-off-analysis)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Future Considerations](#11-future-considerations)

---

## 1. System Overview

### Purpose

Replace a third-party Tally form with a GPC-owned membership intake form at `/join`, and ship the
public **business directory** it has been promising. The system takes a public, unauthenticated
write from strangers, stores personal data under evidenced consent, and publishes a deliberately
small subset of it — but only after an admin decides to.

### Scope

**In scope**
- Public configurable form at `/join` with code-defined branching.
- One trusted server write path for all submissions, with anti-abuse.
- Private member records, survey answers, and append-only consent records.
- Admin moderation of business listings; admin form configuration; member database and insights.
- Public business directory: index, search/filter, listing detail.
- Data-rights journey (withdrawal, erasure) and the privacy-disclosure update that gates launch.

**Out of scope**
- A member directory covering everyone (separate product, behind a member login — `FR-D10`).
- Member authentication of any kind; listing images; payments; reviews; admin permission tiers.

### Architectural drivers

The NFRs that actually constrain the design, in order of force:

1. **NFR-001 — no public read path exposes private member data.** This is the design. It dictates
   the table split (ADR-001), the write path (ADR-004), and is the only requirement with a
   permanent, zero-tolerance target. The codebase has already shipped an anon-readable view to
   production once and needed a corrective migration (`018_secure_ingest_batch_status.sql`).
2. **NFR-004 — consent must be evidenced.** Forces consent out of the browser entirely: the anon
   key ships in the JS bundle, so a client-written consent record is self-attested and worthless.
   This single requirement is why there is a server write path at all (ADR-004, ADR-010).
3. **NFR-003 — the public write endpoint resists automated abuse.** No rate limiter, CAPTCHA,
   honeypot or origin check exists anywhere in the codebase to inherit, and the endpoint feeds a
   queue a human works (ADR-011).
4. **NFR-008 — WCAG 2.1 AA.** Shapes the frontend component contract; owned by `DESIGN.md`.
5. **NFR-012 — follow existing conventions.** One part-time maintainer. Divergence is a real cost,
   so novelty must earn its place (ADR-002, ADR-006, ADR-007).

Performance and scalability are **not** drivers here. Community scale is hundreds of members and
low-hundreds of listings; every list view fits in one bounded fetch. Designing for more would be
the wrong trade against NFR-012.

### Stakeholders & constraints (from `project-context.md`)

- **Users:** Bea (Business Mum), Carla (Career Mum), Ash (volunteer admin), Priya (public visitor).
- **Team:** **one part-time builder.** This is the dominant constraint on every choice below.
- **Existing constraints:** React 19 + Vite 6 + `react-router` v7 + Tailwind v4 (no config file);
  Supabase Postgres with RLS on all 12 tables; Vercel serverless functions; browser holds the
  **anon key only**; migrations are sequential SQL, next number **028**; **every new third-party
  processor must be added to the published privacy disclosures**, which prices vendors above their
  licence fee.

---

## 2. Architecture Pattern

**Pattern:** **Serverless + Backend-as-a-Service**, extending the existing modular front-end.
No new tier, no new service, no new runtime.

**Justification**

- **It is already the pattern.** The site is a Vite SPA on Vercel with Supabase Postgres behind it
  and three serverless functions in `/api`. This feature adds tables, pages and functions to that
  shape. NFR-012 makes "the pattern already in use" the default, and nothing here overturns it.
- **The load profile does not justify anything more.** Submissions arrive at community scale;
  moderation is a human working a queue.
- **One maintainer.** A separate service, a queue broker or a container tier would each add an
  operational surface with no owner.

**Alternatives considered**

- **Supabase Edge Functions instead of Vercel `/api`** — rejected for the write path. Both exist in
  this repo, but the admin auth pattern (`supabase.auth.getUser(token)` + service-role client) is
  already established in `api/admin/subscribers.js`, and splitting the new endpoints across two
  runtimes would double the deployment surface for one feature.
- **Postgres RPC (`SECURITY DEFINER`) called with the anon key, instead of a serverless route** —
  rejected as the primary write path. It would work, but it puts request-level concerns (origin
  checks, honeypot handling, IP-derived rate limiting) inside SQL where they are awkward and
  untestable, and it forfeits the ability to keep the client's payload away from privileged
  columns. Retained for narrow, well-bounded operations (ADR-015).
- **A dedicated backend service** — rejected outright: no operator, no budget, no need.

**Application:** three planes, described in §4 — a *public read plane* (browser → Postgres via the
anon key, published listings only), a *trusted write plane* (browser → Vercel function →
service-role client), and an *admin plane* (authenticated browser → Vercel function, plus direct
anon-key reads for non-sensitive admin data).

---

## 3. Architecture Decision Records

| ADR | Title | Status | Drives |
|---|---|---|---|
| ADR-001 | Split public and private data across separate tables, and revoke column access on the public one | Accepted | FR-011, NFR-001, NFR-006 |
| ADR-002 | Persistence conventions: Postgres, uuid keys, text+CHECK vocabularies, idempotent migrations | Accepted | NFR-012 |
| ADR-003 | AuthN via Supabase Auth; AuthZ is binary anon/authenticated, with attribution instead of tiers | Accepted | NFR-002, NFR-013 |
| ADR-004 | One trusted server write path; the browser never writes member data | Accepted | FR-005, NFR-002, NFR-004 |
| ADR-005 | Error and response convention: `{ error }` + status, always JSON | Accepted | FR-005, NFR-011 |
| ADR-006 | Naming conventions across SQL, JS, routes and files | Accepted | NFR-012 |
| ADR-007 | Client state: hand-rolled hooks, fetch-once, filter client-side | Accepted | NFR-010, NFR-012 |
| ADR-008 | Form configuration: code-defined registry + database overlay + versioned publish | Accepted | FR-008, FR-009, FR-010 |
| ADR-009 | Answers store option keys **and** a label snapshot | Accepted | FR-008, FR-012, FR-014 |
| ADR-010 | Consent records are append-only and version-bearing, enforced by trigger | Accepted | FR-004, NFR-004 |
| ADR-011 | Anti-abuse in Postgres and the request handler — no new third-party processor | Accepted | FR-006, NFR-003 |
| ADR-012 | Moderation is a text status vocabulary with a reason, not a boolean | Accepted | FR-015, FR-016 |
| ADR-013 | Listing slugs are generated once and never regenerate | Accepted | FR-020, FR-021 |
| ADR-014 | Outbound email is a queue table drained by a pluggable sender | Accepted | FR-021, FR-022, NFR-011 |
| ADR-015 | Erasure and withdrawal run through one `SECURITY DEFINER` function | Accepted | FR-023, NFR-005 |
| ADR-016 | Per-feature route modules and per-domain API clients, so stories do not contend on one file | Accepted | NFR-012, parallel-safety |

---

### ADR-001: Split public and private data across separate tables, and revoke column access on the public one

**Status:** Accepted  **Drives:** FR-011, NFR-001, NFR-006

**Context.** NFR-001 sets a permanent zero-tolerance target: no private field retrievable by an
unauthenticated caller against any table, view or route. Three facts make this harder than it
looks. **(a)** Postgres RLS is *row*-level — a policy cannot hide a column, so "one table, select
only the public columns in the query" is not a boundary, because PostgREST exposes the table and
any caller can ask for `select=*`. **(b)** A view over a private table is not a boundary either;
`018_secure_ingest_batch_status.sql` exists because `ingest_batch_status` was anon-readable in
production, and even with `security_invoker = on` the base table stays reachable. **(c)** The anon
key is public — it is inlined into the JS bundle at build time — so RLS and grants are the *only*
client-side boundary.

**Decision.** Two families of tables, separated structurally.

- **Public-readable:** `directory_listings` and `directory_categories` (see Amendment A1). Their
  column lists contain **no column capable of holding personal data** — no name, no email, no postcode, no survey answer. This is verifiable by
  reading the schema, which is the property being bought.
- **Private:** `members`, `member_submissions`, `member_consents`, `data_requests`,
  `abuse_events`, `outbound_emails`. **RLS enabled with no `anon` policy at all** — the same
  posture as `ingest_runs`.

On top of that, **defence in depth via column grants** on the public table:

```sql
revoke select on directory_listings from anon;
grant select (id, slug, business_name, category_id, description,
              website_url, instagram_url, enquiry_email, published_at)
  on directory_listings to anon;
```

`member_id`, `status`, `reject_reason`, `moderation_note`, `submitted_*` and all timestamps other
than `published_at` are **not** granted to `anon`. Row visibility is still gated by RLS:

```sql
create policy "Public can view published listings" on directory_listings
  for select using (status = 'published');
```

**Consequences — LOCKED for all stories:**
- **No table may hold both public and private fields.** If a story needs a new publishable field it
  goes on `directory_listings` and into the `anon` column grant; anything else goes private.
- **No view is used to create a public projection.** Views may exist for admin convenience only,
  and must carry `security_invoker = on` + `revoke … from anon`.
- **Any new database object defaults closed.** Public read is granted explicitly, per column, in
  the same migration that creates the object.
- Easier: the guarantee is auditable by reading one `create table`.
- Accepted cost: a join between `members` and `directory_listings` for every admin view, and two
  writes on submission. Mitigation: both happen inside one server-side transaction (ADR-004).

**Alternatives considered**

| Alternative | Why rejected |
|---|---|
| One table, public columns selected in the query | Not a boundary. RLS is row-level; `select=*` returns everything the grant allows. |
| One table + column grants only (no split) | Column grants are correct Postgres and PostgREST honours them, but they are invisible in the table definition and have **no precedent in this repo**. Making the sole guarantee depend on a mechanism the maintainer has never used before is the wrong risk for a solo project. Kept as the second layer, not the first. |
| Public view over a private table | The failure mode this codebase has already shipped. Base table stays reachable. |
| Separate Supabase project for public data | Absurd operational cost; no cross-project joins. |

**Revisit when:** a requirement demands column-level publication decisions *per row* (e.g. members
choosing field-by-field what to publish). That would make the split insufficient on its own.

---

### ADR-002: Persistence conventions

**Status:** Accepted  **Drives:** NFR-012

**Context.** 27 migrations establish strict, consistent conventions. A new feature that diverges
costs the single maintainer more than it saves.

**Decision.** All new SQL follows the established pattern, without exception:

- `id uuid primary key default gen_random_uuid()`. No serial, no integer keys.
- `snake_case`; plural table names; `_idx` / `_uidx` index suffixes.
- `timestamptz`, never `timestamp`. Instants use `_at`; calendar dates use `date` + `_on`.
- `updated_at` is **trigger-maintained** via the existing `update_updated_at()`; never set by
  application code.
- **No Postgres ENUMs.** Every closed vocabulary is `text` + `CHECK (col in (...))`, named
  `<table>_<column>_check`, always dropped-then-added so re-running is a no-op.
- Every statement idempotent: `create table if not exists`, `add column if not exists`,
  `create index if not exists`, `create or replace function`, `on conflict … do nothing`.
- Lowercase SQL keywords (the convention from `005` onward).
- **Every function gets the lockdown pair in the same migration** — Postgres grants EXECUTE to
  PUBLIC by default, and `010_lock_down_publish_rpcs.sql` exists because that was missed once and
  anon could call `reject_activity` in production:
  ```sql
  revoke execute on function fn(...) from public, anon;
  grant  execute on function fn(...) to authenticated;   -- or service_role only
  ```
- Header comment: one-sentence intent, `-- WHY.`, measured evidence with `file:line` citations,
  explicit "deliberately not done" blocks, and a commented-out verification query.
- **No invented backfill.** New columns keep an honest default on existing rows.

**Migration sequence (numbers reserved now to avoid the collision that once blocked `db push`).**
**Extended by Amendment A5 — 032–035 are also reserved; no story may invent a number.**

| # | File | Contents |
|---|---|---|
| 028 | `028_directory_core.sql` | `members`, `member_submissions`, `directory_listings`, `directory_categories`, RLS, column grants |
| 029 | `029_consent_records.sql` | `member_consents` + append-only trigger + current-consent function |
| 030 | `030_form_configuration.sql` | `form_config_versions`, `form_question_config`, `form_options` |
| 031 | `031_abuse_and_outbound.sql` | `abuse_events`, `outbound_emails`, `data_requests`, sweep functions |

**Consequences — LOCKED:** any story writing SQL uses these conventions and these file numbers.
Easier: review is pattern-matching. Cost: none that matters.

---

### ADR-003: AuthN via Supabase Auth; AuthZ is binary, with attribution instead of tiers

**Status:** Accepted  **Drives:** NFR-002, NFR-013

**Context.** There is no `admin_users` table, no role claim, and no `auth.uid()` check in 27
migrations. `ProtectedRoute.jsx` tests `!user` and nothing else. **Every authenticated user is a
full admin and can create and delete other admins.** The PRD accepts this (Assumption 3) and
defers tiers (`FR-D04`), mitigating with attribution (NFR-013).

**Decision.**

- **AuthN:** Supabase Auth, email + password, unchanged. Admin session lives in `AuthContext`.
- **AuthZ:** exactly two principals — `anon` and `authenticated`. There are **no roles**.
- **Server-side verification is mandatory on every route returning or writing private data:**
  ```js
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Not authenticated' })
  const { data: { user: caller }, error } = await supabase.auth.getUser(token)
  if (error || !caller) return res.status(401).json({ error: 'Invalid or expired session' })
  ```
  Client-side `ProtectedRoute` is UX, never a security control.
- **Attribution replaces restriction.** Every moderation and erasure action records
  `actioned_by uuid` (the caller's `auth.uid()`) and `actioned_at timestamptz`.

**Consequences — LOCKED:** no story invents a role, a permission flag, or an `is_admin` column.
Every `/api/admin/*` route begins with the verification block above, verbatim. Every state-changing
admin operation writes `actioned_by` and `actioned_at`.
Easier: no auth model to build. Accepted cost: one compromised admin login exposes every member
record, and there is no read audit. Mitigation: write-attribution now; `FR-D04`/`FR-D05` when the
admin group grows beyond people who all legitimately see member data.

**Revisit when:** GPC admits an admin who should not see member personal data — the trigger is
organisational, not technical.

---

### ADR-004: One trusted server write path; the browser never writes member data

**Status:** Accepted  **Drives:** FR-005, NFR-002, NFR-004

**Context.** NFR-004 requires consent that can be evidenced. The anon key is public, so a table
with a public INSERT policy is writable by `curl` — bypassing the form, its validation, and its
consent gate. `019` and `027` both flag this: `with check (true)` lets a caller insert
`newsletter_subscribers` rows with a fabricated `brevo_status` and timestamp. **A submitter who can
write their own consent record has not given evidence of consent; they have asserted it.**

`SubmitEventModal.jsx` writes `london_events` directly with the anon key. That pattern is correct
for an anonymous event tip and **must not be copied here.**

**Decision.** All member and listing writes go through **one** Vercel serverless function using the
service-role client. No public INSERT/UPDATE/DELETE policy exists on any table in this feature.

- **`POST /api/join/submit`** is the only public write endpoint.
- The handler builds the row set **field by field from an allowlist**. The request body is never
  spread into an insert. Any field the server did not ask for — `status`, `published_at`,
  `consent_version`, `actioned_by`, `id` — is ignored, not rejected, so a probing client learns
  nothing.
- Consent text, consent version, `captured_at` and `method` are **assigned server-side** from the
  published form config version. The client sends only booleans.
- Members, submissions, consents and the pending listing are written in **one transaction** via a
  single `SECURITY DEFINER` function, so a partial submission is impossible (NFR-011).
- **No personal data in logs.** `api/subscribe.js:` currently does
  `console.error('[subscribe] conflict on', email, …)` — a real address into Vercel logs. New code
  logs the record `id` only.

**Consequences — LOCKED:** no story adds a public INSERT policy. No story writes member data from
the browser. No handler spreads `req.body`. No log line contains a name, email, phone or postcode.
Easier: one place to enforce anti-abuse, validation and consent integrity.
Accepted cost: a serverless round-trip and a cold start on the submit path. Mitigation: it is one
request at the end of a five-minute form; irrelevant.

---

### ADR-005: Error and response convention

**Status:** Accepted  **Drives:** FR-005, NFR-011

**Context.** `api/subscribe.js` wraps its handler in try/catch and always returns JSON;
`api/admin/users.js` does not, and 500s with an HTML body on an empty request — which the client's
`res.json()` then throws on, turning a server error into an unhandled exception.

**Decision.**

- Every response is JSON. Success: the resource or `{ ok: true }`. Failure: **`{ error: string }`**
  with a human-readable message, plus an HTTP status. No error envelopes, no error codes, no
  `{ data, error }` wrapper.
- **Every handler is wrapped in try/catch** so a throw still returns JSON.
- Status codes: `200` ok · `400` validation · `401` unauthenticated · `403` forbidden ·
  `404` not found · `409` conflict · `429` rate-limited · `500` unexpected.
- Clients parse defensively: `await res.json().catch(() => ({}))`, per `NewsletterBanner.jsx`.
- **Non-disclosure rule:** the submit endpoint returns the *same* success shape for a genuine
  submission, a duplicate email (FR-007) and a honeypot-caught bot (FR-006). Distinguishing them in
  the response would leak registration state and confirm the trap.

**Consequences — LOCKED:** every new route follows this shape. The confirmation UI renders from the
**request payload**, never from a server echo of stored records (`EXPERIENCE.md` A2) — otherwise
the non-disclosure rule is defeated at the presentation layer.

---

### ADR-006: Naming conventions

**Status:** Accepted  **Drives:** NFR-012

**Decision.**

| Layer | Convention | Example |
|---|---|---|
| Tables / columns | `snake_case`, plural tables | `directory_listings.business_name` |
| SQL functions | `snake_case`, verb-first | `submit_membership(...)`, `publish_listing(...)` |
| API routes | kebab-case, resource-first | `/api/admin/directory-listings` |
| React components | `PascalCase.jsx`, one per file | `DirectoryCard.jsx` |
| Hooks | `useThing.js` in `src/hooks/` | `useDirectoryListings.js` |
| JS variables | `camelCase` | `businessName` |
| Public routes | kebab-case | `/directory`, `/join`, `/my-data` |
| Admin routes | `/admin/<section>`, with `new` / `:id/edit` | `/admin/directory/:id/edit` |
| Status vocabularies | lower_snake text values | `pending`, `published`, `held`, `rejected` |

**The DB↔JS boundary:** Supabase returns `snake_case` keys and the codebase uses them as-is in
component state. **No camelCase mapping layer is introduced** — inventing one for this feature
alone would make it the odd one out.

**Consequences — LOCKED:** no story adds a serialisation layer or renames DB fields in transit.

---

### ADR-007: Client state — hand-rolled hooks, fetch-once, filter client-side

**Status:** Accepted  **Drives:** NFR-010, NFR-012

**Context.** No data-fetching library (no React Query, no SWR) and no form library. Every list page
fetches once into `useState` and filters in a `useMemo`. Only `SubscribersManager.jsx` paginates
(`PAGE_SIZE = 100`, "Show N more", reset on filter change).

**Decision.** Keep it. One hook per resource in `src/hooks/`, returning `{ data, loading, error }`.
Filtering and searching happen client-side in a `useMemo` over the fetched set.

**Bounds — mandatory, because "fetch everything" is only safe while it is bounded:**

| View | Bound |
|---|---|
| Public directory index | Fetch published listings only, capped at 500, `order by published_at desc` |
| Admin members list | Server-capped at `MAX_ROWS = 1000` (matching `api/admin/subscribers.js`), `PAGE_SIZE = 100` client-side |
| Moderation queue | `PAGE_SIZE = 25`, "Show 25 more" |
| Insights | Aggregated **server-side**; the browser never receives raw member rows to count |

**Consequences — LOCKED:** no story introduces React Query, SWR, Redux, Zustand or a form library.
Every list view states its bound. Insights aggregation is a SQL function, not a client-side reduce
over member data — sending 1,000 member records to a browser to draw a bar chart would move private
data to the client for no reason (NFR-006).
**Revisit when:** any bound above is reached in production.

---

### ADR-008: Form configuration — code-defined registry, database overlay, versioned publish

**Status:** Accepted  **Drives:** FR-008, FR-009, FR-010

**Context.** The user's decision (decision-log, 2026-08-18) is a **configurable single form**:
admins edit labels, help text, options and required flags; the **field set and branching stay
code-defined**. A runtime-defined field set would mean dynamic-schema storage plus a renderer, has
no precedent here, and roughly triples the work. The interface must make the boundary feel natural,
not arbitrary (`EXPERIENCE.md` §4).

**Decision.** Three layers.

**1 — Code registry (`src/lib/join/questions.js`)** — the structural truth, not editable at runtime:

```js
// shape only — the authority for keys, types, branch membership and validation
{ key: 'business_stage', type: 'single_choice', branch: 'business', maxLength: null }
{ key: 'business_name',  type: 'text',          branch: 'listing',  maxLength: 80 }
```

Question **keys are permanent identifiers**. Branch membership (`always | business | career |
listing`) and type live here and nowhere else.

**2 — Database overlay** — the editable surface:
- `form_question_config` keyed by `question_key`: `label`, `help_text`, `is_required`.
- `form_options` keyed by `(question_key, option_key)`: `label`, `sort_order`, `retired_at`.
- A question key present in the registry but absent from the overlay renders its code default, so
  adding a question in code never requires a data migration.

**3 — Versioned publish (`form_config_versions`)** — a `jsonb` snapshot of the whole resolved
config, plus `version` (text, e.g. `2026-08-18.1`), `published_at`, `published_by`.
- Editing writes to the overlay tables as **draft**. Publishing snapshots the resolved config into
  a new version row and marks it current. This makes FR-004's requirement to publish a *consent
  version* the same act as publishing the form (ADR-010).
- The public form reads the **current published version**; preview (FR-010) resolves the **draft**.
- **Exception:** the open/closed toggle (`form_settings.is_open`) applies **immediately**, not on
  publish — closing the form is an emergency control, and making it wait behind a publish step
  would be a defect.
- **Categories are not here.** They live in `directory_categories`, are owned by the directory
  section, and take effect immediately (`EXPERIENCE.md` A3). The form's category question reads the
  taxonomy at render time. One editor, one home.

**Consequences — LOCKED:** admins cannot add, delete or re-parent a question, or change branching —
there is no table that could express it. Every submission records the `form_config_version` it was
answered under. No story adds a "create question" endpoint.
Easier: the renderer is a switch over known types; validation is code, not data.
Accepted cost: a new question needs a deploy. **Correct** — a new question changes the branching
logic, the answer schema and the privacy disclosure, none of which should be a runtime edit.

---

### ADR-009: Answers store option keys **and** a label snapshot

**Status:** Accepted  **Drives:** FR-008, FR-012, FR-014

**Context.** FR-008 requires that retiring or renaming an option leaves historical answers still
displaying correctly, and that retiring never rewrites stored answers. Storing labels alone breaks
on rename; storing keys alone breaks when an option is retired and its label is gone.

**Decision.** `member_submissions.answers` is `jsonb`, keyed by `question_key`, and every choice
answer stores **both**:

```json
{
  "group_choice":  { "key": "business_mums", "label": "Business Mums" },
  "event_types":   [ { "key": "networking_breakfasts", "label": "Networking breakfasts" } ],
  "hopes_to_gain": { "text": "Meeting other mums who get it." }
}
```

- `key` is the stable identifier — **insights and aggregation group by `key`** (FR-014), so a
  rename does not fracture a chart.
- `label` is the snapshot of what the member actually saw — **the member record displays `label`**
  (FR-012), so a retired option still reads correctly years later.
- Where they disagree (an option renamed since submission), the admin UI shows the current label
  and notes the change; it never silently merges (`EXPERIENCE.md` §5).

**Why `jsonb` and not an answers table:** the answer set is a document belonging to one submission,
always read whole, never queried across members except by aggregation — which a SQL function over
`jsonb` handles. An EAV table would add 25 rows per member and joins to every read for no gain.

**Consequences — LOCKED:** every choice answer is written as `{key, label}`. Aggregation groups by
`key`; display uses `label`. No story stores a bare string for a choice answer.
Accepted cost: `jsonb` is not relationally constrained. Mitigation: the server builds the object
from the registry, so shape is enforced at the only write path (ADR-004).

---

### ADR-010: Consent records are append-only and version-bearing, enforced by trigger

**Status:** Accepted  **Drives:** FR-004, NFR-004

**Context.** No `consent_text`, `consent_version`, `consent_method` or equivalent column exists
anywhere in the schema. The published GDPR policy names **Consent** as the lawful basis, so GPC
currently cannot evidence what any member agreed to. FR-004 requires three separate consents and
NFR-004 requires records that are immutable after creation.

**Decision.** `member_consents`, one row per **consent event**, never updated.

```sql
create table if not exists member_consents (
  id              uuid primary key default gen_random_uuid(),
  member_id       uuid not null references members(id) on delete cascade,
  purpose         text not null check (purpose in ('hold_data','publish_listing','newsletter')),
  granted         boolean not null,
  consent_text    text not null,              -- verbatim, as shown
  consent_version text not null,              -- e.g. 'hold_data@2026-08-18.1'
  method          text not null check (method in ('join_form','admin','withdrawal_link')),
  captured_at     timestamptz not null default now()
);
comment on column member_consents.consent_text is
  'The exact wording shown to the member. Never edited. A revision is a new row under a new consent_version.';
```

- **Withdrawal is a new row with `granted = false`**, never an update. Current state per purpose is
  the latest row by `captured_at` — exposed to admins by a function, not by a mutable column.
- **Append-only is enforced, not merely intended:**
  ```sql
  create or replace function member_consents_no_mutate() returns trigger as $$
  begin raise exception 'member_consents is append-only'; end $$ language plpgsql;
  create trigger member_consents_immutable
    before update or delete on member_consents
    for each row execute function member_consents_no_mutate();
  ```
  A trigger is used rather than grants alone because Supabase's `service_role` bypasses RLS and
  holds broad table grants — so revoking `UPDATE` from `authenticated` would not stop the very
  service-role path this feature writes through. The trigger stops everything except an explicit
  `alter table … disable trigger`.
  **Erasure is the one legitimate deletion**, and it cascades from `members` — which the trigger
  would also block. `ADR-015`'s function therefore disables the trigger for the duration of the
  erasure transaction and re-enables it, which is the single documented exemption.
- `consent_version` ties to the published form config version (ADR-008), so "which wording did she
  see?" is answerable from data alone.

**Consequences — LOCKED:** no story updates or deletes a consent row outside `erase_member()`.
Consent text is never assembled client-side. Every consent write records all six fields.
**Blocking dependency:** the `hold_data` consent text still contains `«RETENTION_PERIOD»`
(addendum Q8). **It cannot go live as a placeholder** — every day it runs produces records citing
text GPC cannot evidence.

---

### ADR-011: Anti-abuse in Postgres and the request handler — no new third-party processor

**Status:** Accepted  **Drives:** FR-006, NFR-003

**Context.** FR-006 is a **Must**. Nothing exists to inherit: no KV, no Redis, no Upstash, no
limiter, no CAPTCHA, no honeypot, no origin check. `vercel.json` is three lines of rewrites — no
WAF, no headers. And the PRD constrains the solution space: **every new third-party processor must
be added to the published privacy disclosures**, so Turnstile or hCaptcha cost a policy revision
and a controller decision on top of the integration.

**Decision.** Four layers, all inside the existing stack, applied in `POST /api/join/submit` in
this order:

1. **Origin check** — reject when `Origin`/`Referer` is absent or not the site's own origin.
   Free, stops naive scripted posting. `403`.
2. **Honeypot** — a visually hidden, `aria-hidden`, `tabindex="-1"` field with an innocuous name.
   If completed: **discard silently, record an `abuse_event`, return the ordinary success shape**
   (ADR-005 non-disclosure). No member row, no listing, no moderation task.
3. **Postgres-backed rate limit** — an `abuse_events` table storing a **salted SHA-256 hash of the
   client IP**, never the IP:
   ```sql
   -- thresholds, enforced in the same transaction as the insert
   -- 3 submissions per IP-hash per hour, 20 per IP-hash per 24h
   ```
   The salt is a server-only env var; rows are swept after 48 hours. Exceeding the limit returns
   `429` and writes **no** member row.
4. **Server-side length limits** from the code registry (ADR-008) — over-long input is **rejected,
   never silently truncated**, per FR-006.

**Why hashed IPs.** An IP is personal data. Hashing with a server-side salt keeps the rate-limit
function (equal IPs hash equally) while making the stored value useless to anyone reading the
table, and the 48-hour sweep bounds retention — which is what data minimisation (NFR-006) and the
20-working-day deletion commitment both want.

**FR-006 criterion 5 — the visible counter.** `abuse_events` is the source for the "Abuse blocked"
tile on Form Settings (`EXPERIENCE.md` §4): counts for 7 and 30 days, split honeypot vs rate-limit
vs origin, plus a warning banner when the 24-hour rate crosses a threshold. **Without a screen this
requirement is unbuilt**, which is why the table carries a `reason` column rather than being a bare
counter.

**Consequences — LOCKED:** no story adds a CAPTCHA vendor without a controller decision and a
privacy-page revision. No raw IP is ever stored or logged. The honeypot path always returns success.
Easier: zero new vendors, zero new cost, nothing to add to the privacy disclosures.
Accepted cost: Postgres rate limiting costs one extra query per submission and is per-IP, so it
does not stop a distributed attack. Mitigation: acceptable at community scale, and the counter makes
escalation visible. If it is ever insufficient, Turnstile becomes a justified vendor addition.

**Revisit when:** the 24-hour rejection count exceeds 100 on any day, or spam reaches the queue at
>5% of pending items (the PRD's own success metric).

---

### ADR-012: Moderation is a text status vocabulary with a reason, not a boolean

**Status:** Accepted  **Drives:** FR-015, FR-016

**Context.** Two incompatible precedents exist: `london_events.approved boolean` and
`activities.status text check (...)` with `reject_reason`. FR-015 needs "held" and "rejected with a
reason", which a boolean cannot express.

**Decision.** Follow the `activities` precedent.

```sql
status text not null default 'pending'
  check (status in ('pending','published','held','rejected','unpublished'))
```

- `pending` → awaiting a decision (never public) · `published` → public · `held` → paused, needs
  more info (never public) · `rejected` → declined with a reason (never public) · `unpublished` →
  was public, taken down.
- Public read policy matches **`status = 'published'` only** (ADR-001).
- `reject_reason text` uses a key vocabulary plus free text, so member-facing copy stays consistent
  (`EXPERIENCE.md` §3, including **STORY-035**'s "this isn't a business listing" reason).
- **Resubmission (FR-007)** sets `status = 'pending'` on the existing listing and populates
  `submitted_*` columns alongside the published ones — it does **not** create a second listing and
  does **not** alter what is currently public (`EXPERIENCE.md` A10).
- **Admin edits do not re-open moderation.** FR-016: editing a published listing leaves it
  published. The member's originally submitted values are retained in `submitted_business_name`,
  `submitted_description` etc. so both remain visible and distinguishable.

**Consequences — LOCKED:** no story adds an `approved boolean`. Every transition writes
`actioned_by`, `actioned_at` and, where applicable, `reject_reason`. Only `published` is public.

---

### ADR-013: Listing slugs are generated once and never regenerate

**Status:** Accepted  **Drives:** FR-020, FR-021

**Context.** `EXPERIENCE.md` §6 and §3 independently found the same trap: FR-016 lets admins rename
a listing, and FR-021 emails the member a link to it. A slug derived from the business name and
regenerated on rename would break **every previously shared link and every link in every
already-sent email**, landing visitors on a "no longer listed" page indistinguishable from a
withdrawal.

**Decision.** `slug text unique` is generated **once, at first publication**, from the business
name at that moment, de-duplicated with a numeric suffix. It is **never** recomputed. Renaming
changes `business_name` only. Slug generation reuses the helper pattern in
`src/hooks/useEventMutations.js` (the only slug machinery in the codebase, currently used by
`gpc_events`).

**Consequences — LOCKED:** no story recomputes a slug. `directory_listings` is addressed publicly by
`slug` and internally by `id`.
Accepted cost: a slug can drift from the displayed name. Mitigation: cosmetic, and preferable to
breaking a link someone put on their own website.

---

### ADR-014: Outbound email is a queue table drained by a pluggable sender

**Status:** Accepted  **Drives:** FR-021, FR-022, NFR-011

**Context.** No transactional email path exists — `api/_lib/brevo.js` only creates *contacts* and
sends nothing. NFR-011 requires that a notification failure must **not** roll back the moderation
decision, and that the failure is visible and retryable.

**Decision.** An `outbound_emails` table written **in the same transaction as the decision**, and
drained separately.

```sql
status text not null default 'queued'
  check (status in ('queued','sent','failed','given_up','not_applicable'))
-- plus: to_member_id, template_key, payload jsonb, attempts int,
--       last_error text, last_attempt_at, sent_at
```

- The moderation decision commits regardless of send outcome — the decision and the queue row are
  one atomic write; the *send* is not part of it.
- Failures are visible on the listing and retryable by an admin (`EXPERIENCE.md` §3), with the real
  error string surfaced rather than a placeholder.
- The sender is **pluggable**: Brevo's transactional API is the intended implementation, but if it
  is unavailable on GPC's plan the queue still records everything and an admin sends manually from
  the visible queue. **The feature degrades to manual without a code change**, which is what makes
  it safe to ship FR-021 (a *Should*) in release one.
- `payload jsonb` holds only what the template needs — a listing id, a slug, a reason key.
  **No personal data beyond the recipient reference.**
- Every email carries the controller identity, a `/privacy` link, and the "Manage your data or
  unsubscribe" mail-token link (`EXPERIENCE.md` A18).

**Consequences — LOCKED:** no story sends email inline from a request handler. No story lets a send
failure roll back a state change. FR-022's admin notification uses the same table with batching.
**Dependency:** Brevo transactional sending needs a verified sender domain — confirm before EPIC-005.

---

### ADR-015: Erasure and withdrawal run through one `SECURITY DEFINER` function

**Status:** Accepted  **Drives:** FR-023, NFR-005

**Context.** NFR-005 requires an admin to complete a data-subject request "in a single workflow
without database access", against the site's published 20-working-day commitment. Erasure must
remove the member record, the survey answers, the consent records and the listing — with no chance
of an orphaned published listing surviving on the public site.

**Decision.**

- `data_requests` (private) records each request: `member_id`, `kind`
  (`unlist | unsubscribe | erase`), `requested_at`, `deadline_on`, `status`, `actioned_by`,
  `actioned_at`. `deadline_on` is computed as 20 **working** days from `requested_at`.
- **One function, `erase_member(p_member_id uuid, p_request_id uuid)`** (signature per Amendment A4), `SECURITY DEFINER`, grantable to
  `service_role` only:
  1. disables the `member_consents` immutability trigger for the transaction (ADR-010's documented
     exemption),
  2. deletes the member — `directory_listings.member_id … on delete cascade` removes the listing,
     so **the public page cannot outlive the erasure**,
  3. writes a minimal non-identifying tombstone (`erased_at`, `request_id`) proving the request was
     honoured without retaining what was erased,
  4. re-enables the trigger.
- Partial withdrawal is **not** erasure: `unlist` sets the listing to `unpublished` and appends a
  `publish_listing:false` consent row; `unsubscribe` appends `newsletter:false`. Neither touches
  the others (FR-023).
- Both functions get the ADR-002 lockdown pair. `erase_member` is **never** granted to
  `authenticated` — it is reachable only through the admin API route, so it cannot be invoked with
  a stolen anon key or directly from a browser session.

**Consequences — LOCKED:** no story deletes member rows ad hoc. Cascade is the mechanism that makes
"unpublish on erasure" impossible to forget.
Accepted cost: cascade delete is irreversible and there is no undo. Mitigation: it is preceded by an
explicit admin confirmation (`EXPERIENCE.md` §7 D-4) and is exactly what the requirement asks for.
**Not in scope:** an automated retention sweep (`FR-D08`) — no cron exists in `vercel.json`; the
six-monthly policy review is the trigger for now.

---

### ADR-016: Per-feature route modules and per-domain API clients

**Status:** Accepted  **Drives:** NFR-012, and the parallel-safety of the story backlog

**Context.** Compiling the 46-story backlog and running the Owned-Scope conflict checker surfaced a
concrete problem this architecture had not addressed: **two files are touched by almost every
story.** `src/App.jsx` accounted for **170 of 274** conflicting story pairs and `src/lib/adminApi.js`
for a further **39** — together 76% of all contention. Every feature adds a route, and every admin
feature appends a client function, so under the current structure most of the backlog would have to
be serialized on two files that have nothing to do with each other.

This is not a story-authoring mistake; it is a structural property of the existing codebase, where
`App.jsx` declares every route inline and `adminApi.js` is a flat list of per-endpoint functions
with no generic helper.

**Decision.** Introduce two thin module boundaries whose only purpose is to give each feature a
file of its own.

- **Routes.** Each feature exports its own route fragment from `src/routes/<feature>Routes.jsx`
  (e.g. `joinRoutes.jsx`, `directoryRoutes.jsx`, `adminDirectoryRoutes.jsx`, `adminMembersRoutes.jsx`,
  `dataRightsRoutes.jsx`). `src/App.jsx` imports and spreads them **once** and is then touched by
  exactly one story. Lazy loading stays where it is today — inside each route module.
- **API clients.** `src/lib/adminApi.js` keeps only the shared helpers it already has —
  `authHeaders()` and `parseResponse()` — and each domain gets `src/lib/api/<domain>.js`
  (`directory.js`, `members.js`, `formConfig.js`, `dataRequests.js`) importing those helpers.

**Consequences — LOCKED for all stories:**
- **No story adds a route directly to `src/App.jsx`.** It creates or edits its feature's route
  module. `App.jsx` is owned by story **1.6** and by nothing else.
- **No story appends a function to `src/lib/adminApi.js`.** It creates or edits its domain client.
  `adminApi.js` is owned by story **1.6** and by nothing else.
- Easier: most of the backlog becomes genuinely parallel-safe, and each feature's routing and API
  surface is legible in one place.
- Accepted cost: two more directories and one indirection hop; a small, real divergence from the
  current flat structure, which NFR-012 would otherwise argue against.
  **Mitigation / why it is worth it:** the divergence is small, mechanical and one-directional, and
  it is bought with a measured 76% reduction in forced serialization. Keeping the flat structure
  would trade a genuine delivery constraint for a cosmetic consistency.

**Alternatives considered**

| Alternative | Why rejected |
|---|---|
| Leave the structure; serialize the stories | 209 forced story-pair serializations for two files nobody is really collaborating on. It makes the backlog effectively sequential. |
| Let stories edit `App.jsx` and merge conflicts manually | Exactly what Owned Scope exists to prevent; guarantees repeated conflicts in the one file that breaks the whole app when merged wrong. |
| A generic `request()` helper in `adminApi.js` instead of per-domain files | Reduces the volume of appends but not the contention — everyone still edits one file. |

**Revisit when:** never, realistically. If the app shrinks to a handful of routes this becomes
unnecessary ceremony, but that direction is not anticipated.

---

## 3a. Amendments — defects found during story compilation

Story compilation surfaced four genuine inconsistencies in v1.0 of this document. They are recorded
here rather than silently edited, so the history survives.

### A1 — ADR-001's "only public-readable table" was overstated

**Found by:** story 1.1. **Resolution:** ADR-001's summary line said `directory_listings` is the
only public-readable table, while §5 correctly describes `directory_categories` as publicly
readable — the directory's category filter needs it. **The correct statement is:** there are
**two** public-readable tables, `directory_listings` and `directory_categories`. The guarantee is
unchanged and is about *content*, not count: **no public-readable table has a column capable of
holding personal data.** `directory_categories` is a taxonomy — `key`, `label`, `sort_order`,
`retired_at` — and holds none.

### A2 — `abuse_events` retention contradicted the abuse tile

**Found by:** stories 2.7 and 1.4. **Resolution:** ADR-011 sweeps `abuse_events` after 48 hours
(correct — it holds hashed IPs, and minimisation applies), but FR-006's admin tile needs **7- and
30-day** counts. Those are irreconcilable on one table. **Add a second, non-identifying table:**

```sql
create table if not exists abuse_daily_counts (
  on_date date not null,
  reason  text not null check (reason in ('honeypot','rate_limit','origin','length')),
  count   integer not null default 0,
  primary key (on_date, reason)
);
```

It contains **no IP data of any kind** and is therefore retained for 90 days without a
minimisation concern. `abuse_events` keeps its 48-hour sweep; the sweep increments the daily
counter before deleting. Story **1.4** owns the table and the sweep; **2.7** reads the counter.

### A3 — `form_settings` mixed draft/publish content with a live control

**Found by:** stories 2.3 and 2.4. **Resolution:** ADR-008 says `intro_text` and `closed_message`
are draft-then-published, while §5 described `form_settings` as a plain live row. **Both are
right about different fields.** `form_settings.is_open` is **live** — an emergency control that
must not wait behind a publish. `intro_text` and `closed_message` are **content**, so they live in
the draft overlay and reach the public form only on publish, exactly like a question label.
`form_settings` therefore holds `is_open` only; the two text fields move into the config overlay.

### A4 — `erase_member()` could not write the tombstone ADR-015 requires

**Found by:** story 8.4b. **Resolution:** ADR-015 requires a tombstone recording that a request was
honoured, but the quoted signature `erase_member(p_member_id uuid)` carries no request reference.
**Corrected signature:** `erase_member(p_member_id uuid, p_request_id uuid)`.

### A5 — migration numbers beyond 031 were unreserved

**Found by:** stories 4.1, 4.4, 5.2a, 5.4, 7.3. **Resolution:** ADR-002 reserved only 028–031, but
several stories legitimately need their own function migrations and were each inventing a number.
**Reserved block, now authoritative — no story may invent a number outside it:**

| # | Owner | Contents |
|---|---|---|
| 028 | story 1.1 | directory core tables, RLS, column grants |
| 029 | story 1.2 | consent records + append-only trigger |
| 030 | story 1.3 | form configuration tables |
| 031 | story 1.4 | abuse events + daily counts + outbound emails + data requests + sweeps |
| 032 | story 4.1 | `submit_membership()` |
| 033 | story 5.2a | moderation transition functions |
| 034 | story 7.3 | `get_member_insights()` |
| 035 | story 8.4b | `erase_member(p_member_id, p_request_id)` |

036+ remain free for follow-on work.

---

## 4. Component Design

### Component overview — three planes

```
                          BROWSER (anon key, public — ships in the JS bundle)
                                        │
       ┌────────────────────────────────┼────────────────────────────────┐
       │                                │                                │
  PUBLIC READ PLANE              TRUSTED WRITE PLANE               ADMIN PLANE
  supabase-js, anon              POST /api/join/submit             /api/admin/*
       │                                │                          (Bearer token
       │ RLS: status='published'        │ service-role client        verified server-side)
       │ + column grants                │ allowlisted fields              │
       ▼                                ▼                                 ▼
 directory_listings            submit_membership()  ──────►  members · member_submissions
 directory_categories            (one transaction)           member_consents · data_requests
 (published rows,                      │                     abuse_events · outbound_emails
  public columns only)                 └──► abuse_events     directory_listings (all statuses)
                                            (hashed IP)
                                                             ── RLS enabled, NO anon policy ──
```

The **only** arrow from an unauthenticated browser to private data is the write path, and it
carries no read. Nothing an anon caller can read touches a private table.

---

### Component: Join Form (public)

**Responsibility:** render the configured form, branch on the group answer, and post one submission.
**Provides:** `/join`.
**Requires:** `GET /api/join/config` (published form config + categories); `POST /api/join/submit`.
**Data owned:** none — it holds draft answers in component state only, never persisted client-side.
**ADRs:** ADR-004, ADR-005, ADR-007, ADR-008, ADR-009, ADR-011.
**NFRs:** NFR-007 (≤5 min — Carla answers zero business questions), NFR-008 (WCAG per `DESIGN.md`),
NFR-009 (≤50KB gzipped over the shell — the component budget in `EXPERIENCE.md` §1 is binding).

Discards abandoned-branch answers on group change (FR-002) so they never reach the payload.
Sends an **idempotency key** generated once per form session (`EXPERIENCE.md` A19), so a retry after
a timeout cannot create a second member.

---

### Component: Submission Service (`POST /api/join/submit`)

**Responsibility:** the single trusted write path. Validate, resist abuse, assign consent metadata,
persist atomically.
**Provides:** one public endpoint.
**Requires:** service-role Supabase client; the published `form_config_versions` row.
**Data owned:** writes `members`, `member_submissions`, `member_consents`, `directory_listings`
(pending), `abuse_events`, `outbound_emails`.
**ADRs:** ADR-004 (allowlist, never spread the body), ADR-005 (JSON + non-disclosure),
ADR-010 (server-assigned consent text/version), ADR-011 (four abuse layers in order).
**NFRs:** NFR-002, NFR-003, NFR-004, NFR-011.

Order of operations is load-bearing: **origin → honeypot → rate limit → validate → transaction.**
The honeypot returns the ordinary success shape *before* any row is written.

---

### Component: Directory (public)

**Responsibility:** browse, search and open published business listings.
**Provides:** `/directory`, `/directory/:slug`.
**Requires:** `supabase.from('directory_listings')` with the anon key — **published rows, granted
columns only**. No API route; there is nothing private to protect and no reason to add a hop.
**Data owned:** none.
**ADRs:** ADR-001, ADR-007 (500-row bound), ADR-013 (immutable slug).
**NFRs:** NFR-001 (the reason the read is safe direct from the browser), NFR-008, NFR-009
(interactive <3s on 4G at 100 listings), NFR-010 (usable at 300).

Search and filter are client-side over the bounded fetch, with filters reflected in the URL so a
filtered view is shareable (FR-019). Submitted text renders as **plain text, never markup** (FR-020)
— the site sets no CSP, so this is the mitigation, not a nicety.

---

### Component: Moderation (admin)

**Responsibility:** decide what becomes public; own the category taxonomy.
**Provides:** `/admin/directory`, `/admin/directory/:id`, `/admin/directory/categories`.
**Requires:** `GET /api/admin/directory` (list + private member context);
`publish_listing()` / `hold_listing()` / `reject_listing()` / `unpublish_listing()`.
**Data owned:** `directory_listings` (all statuses), `directory_categories`.
**ADRs:** ADR-003 (attribution), ADR-012 (status vocabulary), ADR-013, ADR-014.
**NFRs:** NFR-005, NFR-010 (`PAGE_SIZE = 25`), NFR-011 (send failure never rolls back a decision),
NFR-013 (every transition attributed).

Owns the responsive `AdminLayout` drawer (`EXPERIENCE.md` A21) that three admin sections depend on.

---

### Component: Form Configuration (admin)

**Responsibility:** edit form copy and options; open/close the form; preview; surface abuse counts.
**Provides:** `/admin/form`, `/admin/form/preview`.
**Requires:** `GET|PUT /api/admin/form-config`, `POST /api/admin/form-config/publish`,
`GET /api/admin/abuse-summary`.
**Data owned:** `form_question_config`, `form_options`, `form_config_versions`, `form_settings`.
**ADRs:** ADR-008 (draft → publish; open/closed is immediate), ADR-011 (abuse tile).
**NFRs:** NFR-003 (its only visible surface), NFR-012.

There is **no** create-question or delete-question endpoint. The structural boundary is enforced by
the absence of an API, not by a permission check.

---

### Component: Member Records & Insights (admin)

**Responsibility:** find and read member records; aggregate demand.
**Provides:** `/admin/members`, `/admin/members/:id`, `/admin/insights`.
**Requires:** `GET /api/admin/members`, `GET /api/admin/members/:id`,
`GET /api/admin/insights`, `GET /api/admin/members/export`.
**Data owned:** reads `members`, `member_submissions`, `member_consents`.
**ADRs:** ADR-003, ADR-007 (aggregation is server-side), ADR-009 (group by key, display label).
**NFRs:** NFR-002 (the only legitimate window onto private data), NFR-006, NFR-010 (1,000 records).

Insights are computed by a SQL function over `member_submissions.answers`; **raw member rows never
reach the browser for aggregation.**

---

### Component: Data Rights (public + admin)

**Responsibility:** let a member withdraw or erase without emailing anyone; let an admin action it.
**Provides:** `/my-data`, `/my-data/manage`, `/admin/data-requests`, `/admin/data-requests/:id`.
**Requires:** `POST /api/my-data/request` (emails a signed, expiring token — no member login exists),
`GET|POST /api/my-data/manage`, `POST /api/admin/data-requests/:id/action`.
**Data owned:** `data_requests`.
**ADRs:** ADR-005, ADR-014 (token email via the queue), ADR-015 (`erase_member()`).
**NFRs:** NFR-005 (20 working days, visible), NFR-004 (withdrawal appends, never overwrites).

**Security note.** The request form takes an email address and must not become an oracle: it returns
the same response whether or not the address is registered, and the actionable link arrives only in
the mailbox. The token is single-purpose, expiring, and grants access to *that member's* data only.

---

## 5. Data Model

Governed by ADR-001 (split), ADR-002 (conventions), ADR-009 (answers), ADR-012 (status).

### Entity: `directory_listings` — **the only public-readable table**

**Purpose:** a member's published business listing. Its schema contains **no column capable of
holding personal data**, which is the guarantee ADR-001 buys.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `member_id` | uuid FK → `members(id)` **on delete cascade** | **not granted to `anon`**; cascade is what makes erasure safe (ADR-015) |
| `slug` | text unique | generated once at first publication, never regenerated (ADR-013) |
| `business_name` | text not null | public |
| `category_id` | uuid FK → `directory_categories(id)` | public |
| `description` | text not null | public, **≤300 chars** enforced server-side (`EXPERIENCE.md` A8) |
| `website_url` | text | public, nullable |
| `instagram_url` | text | public, nullable |
| `enquiry_email` | text not null | public — the member's **nominated** contact, never the signup email |
| `status` | text not null default `'pending'` | CHECK per ADR-012; **not granted to `anon`** |
| `reject_reason` | text | key + free text; not granted to `anon` |
| `submitted_business_name` / `submitted_description` / `submitted_*` | text | the member's original values, retained when an admin edits (FR-016); not granted to `anon` |
| `published_at` | timestamptz | public |
| `actioned_by` / `actioned_at` | uuid / timestamptz | attribution (NFR-013); not granted to `anon` |
| `created_at` / `updated_at` | timestamptz | trigger-maintained |

**Indexes:** `slug` unique · `(status, published_at desc)` for the public index · `member_id`.
**Policies:** `for select using (status = 'published')` for `anon`; full access for `authenticated`
via the admin plane. **Column grant** per ADR-001.

### Entity: `members` — private

`id` · `first_name` · `email` (citext, unique) · `postcode` · `heard_about` · `group_choice`
(text + CHECK `business_mums | career_mums | both`) · `erased_at` · `created_at` / `updated_at`.
**RLS enabled, no `anon` policy.** Unique email is what makes FR-007 resubmission an upsert.

### Entity: `member_submissions` — private

`id` · `member_id` FK cascade · `answers jsonb` (ADR-009) · `form_config_version` text ·
`idempotency_key` text unique · `submitted_at`.
**One row per submission event**, so a resubmission is an additional row and the history is intact.

### Entity: `member_consents` — private, append-only

Per ADR-010. **Indexes:** `(member_id, purpose, captured_at desc)` — the current-state lookup.

### Entity: `directory_categories`

`id` · `key` (text unique) · `label` · `sort_order` · `retired_at`.
Publicly readable (the directory filter needs it). Retire, never delete, while listings reference it;
delete permitted only at zero references (FR-017).

### Entity: `form_config_versions` / `form_question_config` / `form_options` / `form_settings`

Per ADR-008. `form_settings` is a single-row table holding `is_open`, `closed_message`, `intro_text`.

### Entity: `abuse_events` — private

`id` · `ip_hash` text (salted SHA-256, **never the raw IP**) · `reason` (text + CHECK
`honeypot | rate_limit | origin | length`) · `created_at`. Swept after 48 hours.

### Entity: `outbound_emails` — private

Per ADR-014.

### Entity: `data_requests` — private

Per ADR-015.

### Storage strategy

- **Primary store:** Supabase Postgres. No second store.
- **Cache:** none. Adding one would be premature at this scale and would create a second place for
  private data to live.
- **File/blob:** **none in this release.** Listing images are deferred (`FR-D02`): the only bucket
  (`event-images`) is public, has no policies in any migration, no MIME or size validation, and no
  deletion path — a public upload endpoint against it would be an unauthenticated file dropbox.
- **Retention:** `abuse_events` 48h (swept). Member data per the consented retention period —
  **blocked on addendum Q8.** Erasure is on request via ADR-015; no automated sweep (`FR-D08`).
- **Backup:** Supabase's managed backups, unchanged. No new obligation introduced.

---

## 6. API Specifications

**Protocol:** REST-ish JSON over HTTPS, Vercel serverless functions under `/api` (ADR-004).
**AuthN:** Bearer token verified server-side on every `/api/admin/*` and `/api/my-data/manage` call
(ADR-003). **Versioning:** none — single client, deployed together. Adding `/v1/` would be ceremony.
**Error shape:** `{ error: string }` + status, always JSON (ADR-005).

### `GET /api/join/config` — public
Returns the current **published** form config plus active categories and `is_open`.
`200` config · `500` `{ error }`. No auth. Safe to cache briefly at the edge.

### `POST /api/join/submit` — public, the only public write
**Auth:** none. **Body:** answers keyed by `question_key`, consent booleans, honeypot field,
idempotency key.
Pipeline: origin → honeypot → rate limit → validate → `submit_membership()` transaction.
- `200 { ok: true }` — **the same response for a genuine submission, a duplicate email, and a
  honeypot catch** (ADR-005 non-disclosure).
- `400 { error }` validation · `403 { error }` bad origin · `409 { error }` form closed ·
  `429 { error }` rate-limited · `500 { error }`.
**NFRs:** rate limit 3/hour and 20/24h per IP-hash; no personal data logged.

### `GET /api/admin/directory` · `GET /api/admin/members` · `GET /api/admin/members/:id` · `GET /api/admin/insights` · `GET /api/admin/members/export`
**Auth required.** Service-role reads of private data. `MAX_ROWS = 1000` on member lists.
`401` on missing/invalid/expired token, with no data body.

### `POST /api/admin/directory/:id/action`
**Auth required.** `{ action: 'publish'|'hold'|'reject'|'unpublish', reason?, reasonKey? }`.
Writes the status transition, `actioned_by`, `actioned_at`, and an `outbound_emails` row **in one
transaction** (ADR-012, ADR-014). Send failure never rolls it back.

### `GET|PUT /api/admin/form-config` · `POST /api/admin/form-config/publish` · `PUT /api/admin/form-settings`
**Auth required.** PUT writes draft; publish snapshots a new version (ADR-008).
`form-settings` (open/closed) applies immediately, bypassing draft/publish.

### `POST /api/my-data/request` — public
Takes an email; **always** returns `200 { ok: true }` whether or not it is registered. Queues a
signed, expiring, single-purpose token email (ADR-014, ADR-015).

### `GET|POST /api/my-data/manage` — token-authenticated
Reads and actions one member's own withdrawal/erasure request. `401` on an invalid or expired token.

---

## 7. FR / NFR Coverage Matrix

| ID | Type | Requirement | Component(s) | ADR(s) | Status |
|---|---|---|---|---|---|
| FR-001 | FR | Public membership form | Join Form | ADR-007, ADR-008 | Addressed |
| FR-002 | FR | Conditional branch rendering | Join Form | ADR-008 | Addressed |
| FR-003 | FR | Business listing opt-in captures publishable content | Join Form, Submission Service | ADR-001, ADR-008 | Addressed |
| FR-004 | FR | Granular, evidenced consent | Submission Service | ADR-010 | Addressed |
| FR-005 | FR | Single trusted server write path | Submission Service | ADR-004, ADR-005 | Addressed |
| FR-006 | FR | Abuse and spam protection | Submission Service, Form Configuration | ADR-011 | Addressed |
| FR-007 | FR | Duplicate submission handling | Submission Service | ADR-004, ADR-012 | Addressed |
| FR-008 | FR | Admin edits form question content | Form Configuration | ADR-008, ADR-009 | Addressed |
| FR-009 | FR | Admin opens and closes the form | Form Configuration | ADR-008 | Addressed |
| FR-010 | FR | Admin previews the form | Form Configuration | ADR-008 | Addressed |
| FR-011 | FR | Public and private data separated at rest | *(all)* | ADR-001 | Addressed |
| FR-012 | FR | Admin member database | Member Records | ADR-003, ADR-009 | Addressed |
| FR-013 | FR | Member data export | Member Records | ADR-003, ADR-005 | Addressed |
| FR-014 | FR | Demand insights | Member Records | ADR-007, ADR-009 | Addressed |
| FR-015 | FR | Directory moderation queue | Moderation | ADR-012 | Addressed |
| FR-016 | FR | Admin edits public listing content | Moderation | ADR-012 | Addressed |
| FR-017 | FR | Managed category taxonomy | Moderation | ADR-002, ADR-012 | Addressed |
| FR-018 | FR | Public directory index | Directory | ADR-001, ADR-007 | Addressed |
| FR-019 | FR | Directory search and filtering | Directory | ADR-007 | Addressed |
| FR-020 | FR | Public listing detail and enquiry | Directory | ADR-001, ADR-013 | Addressed |
| FR-021 | FR | Member notification on decision | Moderation | ADR-014 | Addressed |
| FR-022 | FR | Admin notification on new submission | Submission Service | ADR-014 | Addressed |
| FR-023 | FR | Member-initiated withdrawal | Data Rights | ADR-015 | Addressed |
| FR-024 | FR | Published privacy disclosures match collection | *(content — no component)* | — | **Deferred to content work.** Launch gate; owned by the controller. `EXPERIENCE.md` §7 specifies the IA. |
| NFR-001 | NFR | No public read path exposes private data | *(all)* | ADR-001, ADR-004 | Addressed |
| NFR-002 | NFR | Private data only via authenticated admin routes | Admin plane | ADR-003, ADR-004 | Addressed |
| NFR-003 | NFR | Public write endpoint resists abuse | Submission Service, Form Configuration | ADR-011 | Addressed |
| NFR-004 | NFR | Consent is evidenced | Submission Service | ADR-010 | **Partial** — mechanism complete; **blocked** on the retention figure (addendum Q8) before first live submission |
| NFR-005 | NFR | Data-subject requests actionable in 20 working days | Data Rights | ADR-015 | Addressed |
| NFR-006 | NFR | Data minimisation | *(all)* | ADR-001, ADR-011 | Addressed |
| NFR-007 | NFR | Completion ≤5 minutes | Join Form | ADR-008 | Addressed |
| NFR-008 | NFR | WCAG 2.1 AA | Join Form, Directory | — (`DESIGN.md` §3) | Addressed |
| NFR-009 | NFR | Mobile-first performance | Join Form, Directory | ADR-007 | Addressed |
| NFR-010 | NFR | Scales to 1,000 members / 300 listings | *(all list views)* | ADR-007 | Addressed |
| NFR-011 | NFR | No submission silently lost | Submission Service, Moderation | ADR-004, ADR-014 | Addressed |
| NFR-012 | NFR | Existing conventions followed | *(all)* | ADR-002, ADR-006, ADR-007 | Addressed |
| NFR-013 | NFR | Moderation actions attributable | Moderation, Data Rights | ADR-003, ADR-012 | Addressed |

**No orphans.** FR-024 is the one row with no component: it is content, not code, and it **gates
launch**. Recording it as Deferred-to-content rather than omitting it keeps it visible.

### Detailed notes per architectural driver

**NFR-001 (Security — the driver).** Three layers: structural table split (ADR-001), column grants
on the one public table, and no public read path to any private table. **Verification is part of the
release checklist, not a hope:** enumerate every object readable with the anon key and assert the
absence of name, email, postcode, phone, survey answer and consent field. Re-run on any change
touching a policy or a grant. This codebase has shipped that exact failure once.

**NFR-004 (Compliance).** Append-only enforced by trigger, not convention, because `service_role`
bypasses RLS and holds broad grants. Versioned against the published form config, so "which wording
did she agree to?" is answerable from data. **Blocking:** addendum Q8.

**NFR-003 (Security).** Four layers, no new processor, hashed IPs with a 48-hour sweep. Verified by
a scripted burst of 100 submissions in one minute against a non-production deployment before launch.
Known limit: per-IP, so a distributed attack passes — surfaced by the FR-006 counter rather than
silently absorbed.

**NFR-008 (Usability).** Owned by `DESIGN.md` §3. Architecturally relevant only in that the site's
primary button, skip link and input borders fail AA today, and the corrections are scoped to these
surfaces.

**NFR-012 (Maintainability).** The strongest force after security. **Zero new runtime
dependencies.** No new data library, form library, state library, cache, queue broker or vendor.

### NFR categories assessed and consciously not designed for

Recording these prevents a later reader assuming they were forgotten:

- **Availability.** No uptime target is set and none is designed for. Vercel + Supabase managed
  availability is inherited as-is. A community directory being briefly unreachable is not an
  incident worth engineering against, and there is no operator to run failover.
- **Scalability (horizontal).** Serverless functions scale per-request by default; Postgres is a
  single managed instance with no read replicas, sharding or auto-scaling policy. At the stated
  ceilings (NFR-010) this is comfortable by orders of magnitude.
- **Reliability (redundancy, circuit breakers, health checks).** Not designed. The one real
  reliability requirement is NFR-011 — no submission silently lost — met by the single-transaction
  write and the decoupled email queue. Retries: the client's idempotency key makes a user-initiated
  retry safe; there is no automated retry layer.
- **Disaster recovery.** Supabase managed backups; no bespoke RTO/RPO. Unchanged from the rest of
  the site.

---

## 8. Technology Stack

| Layer | Choice | Version | Rationale (→ driver) | ADR |
|---|---|---|---|---|
| Frontend | React + Vite | 19 / 6 | Already the stack; no reason to diverge (NFR-012) | ADR-007 |
| Routing | `react-router` | 7 | Already the stack | ADR-006 |
| Styling | Tailwind | 4 (no config file; tokens in `src/index.css`) | Already the stack; `DESIGN.md` extends the `@theme` block | — |
| Backend | Vercel serverless functions | Node | Already hosts the three existing `/api` routes, including the admin-auth pattern being copied (NFR-002) | ADR-004 |
| Database | Supabase Postgres | managed | Already the store; RLS + column grants are the boundary NFR-001 needs | ADR-001, ADR-002 |
| Auth | Supabase Auth | — | Already the admin auth; no member auth in scope | ADR-003 |
| Email | Brevo transactional | — | Account already exists and is already a declared processor — **adding no new processor is a design constraint, not a preference** | ADR-014 |
| Rate limiting | Postgres table, hashed IPs | — | No KV/Redis exists; a vendor would need a privacy-page revision (NFR-003, NFR-006) | ADR-011 |
| State | `useState` + hooks in `src/hooks/` | — | Matches every existing page; zero new dependencies (NFR-012) | ADR-007 |

**Alternatives rejected:** React Query / SWR (a data library for six list views, against a codebase
with none); Upstash or Vercel KV (a new processor for rate limiting Postgres can do);
Turnstile / hCaptcha (a new processor and a policy revision — held in reserve per ADR-011's revisit
trigger); Zod or a form library (validation lives in the code registry and is shared with the
server); a separate backend service (no operator).

**Zero new runtime dependencies is the target and is achievable.** Any story proposing one needs a
decision-log entry.

---

## 9. Trade-off Analysis

### Trade-off: two tables vs one table with column grants
**Decision:** both — split first, grants as the second layer (ADR-001).
**Options.** *One table + column grants:* fewer objects, no joins; but the guarantee is invisible in
the schema and rests on a mechanism with no precedent here. *Two tables:* the guarantee is legible
in one `create table`; costs a join on every admin view.
**Rationale.** NFR-001 is the only zero-tolerance requirement, and the maintainer is one part-time
person who will review this code months from now. A guarantee you can *see* beats one you must
reason about. **Accepted:** a join per admin view. **Mitigation:** admin reads already go through
service-role API routes where a join is one line.
**Revisit when:** per-row, per-field publication choice is required.

### Trade-off: Postgres rate limiting vs a managed limiter
**Decision:** Postgres (ADR-011).
**Options.** *Upstash/Vercel KV:* purpose-built, sub-millisecond, distributed-attack resistant; but
a new sub-processor, a new secret, a new bill, and a privacy-page revision. *Postgres:* free, no
vendor, one extra query per submission; per-IP only.
**Rationale.** The PRD makes every new processor expensive beyond its price. At community volume,
per-IP limiting plus honeypot plus origin check is proportionate. **Accepted:** a distributed
attack would pass. **Mitigation:** the FR-006 counter makes it visible, and ADR-011 names the
measurable trigger for adding a vendor.

### Trade-off: `jsonb` answers vs a normalised answers table
**Decision:** `jsonb` with `{key, label}` pairs (ADR-009).
**Options.** *Normalised:* referential integrity, trivial aggregation; ~25 rows per member and a
join on every read, and it still needs a label snapshot to satisfy FR-008. *`jsonb`:* the document
is read whole; aggregation is a SQL function.
**Rationale.** The answer set is a submission-scoped document. **Accepted:** no DB-level shape
constraint. **Mitigation:** there is exactly one write path and it builds the object from the code
registry.

### Trade-off: shipping FR-021 email in release one
**Decision:** ship the queue; make the sender pluggable (ADR-014).
**Rationale.** FR-021 is a *Should* and no transactional path exists — the temptation is to defer it
entirely. But NFR-011's "failure visible and retryable, decision not rolled back" needs the queue
table *whether or not sending works*, and with the queue in place the feature degrades to manual
sending with no code change. Building the durable half now and the delivery half whenever Brevo is
verified is cheaper than retrofitting durability later.
**Accepted:** a table that may sit unused for a while. **Cost:** trivial.

### Trade-off: no listing images in release one
**Decision:** defer (`FR-D02`).
**Rationale.** An unauthenticated upload endpoint against the existing public bucket — no policies
in any migration, no MIME or size validation, no deletion path, stable public URLs forever — is a
file dropbox, and the safeguarding policy makes an uploaded photo a live risk rather than a
theoretical one. **Mitigation:** an admin may add an image during review; a private bucket with
signed uploads is a separate piece of work.

---

## 10. Deployment Architecture

### Environments
- **Development** — local Vite dev server against the shared Supabase project. **There is no
  separate dev database**; migrations are tested by applying them and verifying, so the ADR-002
  idempotency rule is what makes that survivable.
- **Staging** — Vercel preview deployments per branch, same Supabase project.
- **Production** — Vercel production, same Supabase project.

**This is a real constraint, not a gap to design around now:** one database across all three means
the pre-launch burst test (NFR-003) must run against a preview deployment with a distinct IP salt,
and its `abuse_events` rows must be swept afterwards. Stories must not seed test member data.

### Topology
Vercel edge/CDN for static assets → serverless functions in the default region → Supabase Postgres.
No load balancer, no queue broker, no cache tier, no cron.

### Strategy
- **Deployment:** Vercel's default atomic deploy on push. Migrations applied by `supabase db push`
  **before** the deploy that depends on them — additive-only, so an old client keeps working against
  a new schema.
- **Rollback:** Vercel instant rollback for code. **Migrations are not rolled back** — forward-fix
  only, which is why ADR-002's idempotency and no-invented-backfill rules matter.
- **Scaling:** per-request serverless; a single Postgres instance. No policy needed at these volumes.
- **Secrets:** `SUPABASE_SERVICE_ROLE_KEY`, the rate-limit salt, and the Brevo key live only in
  Vercel env and are read inside handlers at request time. **None is ever referenced in `src/`.**

### Release gates
1. **FR-024** — privacy page updated. *Blocks launch.*
2. **Addendum Q8** — retention figure in the consent text. *Blocks the first live submission.*
3. **NFR-001 probe** — anon-key enumeration asserting no private field is reachable.
4. **NFR-003 burst test** — 100 submissions in one minute against a preview deployment.
5. **NFR-008 audit** — automated plus manual keyboard and screen-reader pass on `/join`, the
   directory index, and a listing detail page.

---

## 11. Future Considerations

**Anticipated changes**

- *Near term:* the retention figure lands and consent text v1 is published; Brevo transactional
  verified, flipping FR-021 from manual to automatic with no schema change.
- *Medium:* listing images once a private bucket and signed-upload route exist (`FR-D02`); member
  self-service editing when member auth exists (`FR-D01`); an outcode field if addendum Q1 is
  revisited (`FR-D03`) — one column, one badge, one filter key, no rebuild.
- *Longer:* **the member directory (`FR-D10`).** It is a different product, not a phase of this one:
  it lists people, so its entries are personal data by definition and it must sit behind member
  authentication. This architecture supports it *only* in that `member_submissions.answers` already
  captures the raw material (industry, situation, support wanted, interest in mentoring). It would
  need its own tables, its own lawful basis, its own consent wording, and an auth model that does
  not exist. **Nothing in this release may publish any of that data.**

**Scalability path.** Current design is comfortable to ~1,000 members and ~300 listings. Beyond
that: server-side pagination and search on the members list and the directory (ADR-007's bounds are
the trigger), and a materialised view for insights if the aggregation function slows.

**Revisit triggers, aggregated from the ADRs**

| Trigger | ADR | Action |
|---|---|---|
| Per-row, per-field publication choice required | ADR-001 | Revisit the split; column grants alone may not suffice |
| An admin joins who must not see member data | ADR-003 | Build `FR-D04` role tiers and `FR-D05` read audit |
| >100 rejected submissions in a day, or spam >5% of the queue | ADR-011 | Add Turnstile — accepting the processor and policy revision |
| Any ADR-007 bound reached (500 listings / 1,000 members / 25-page queue) | ADR-007 | Move to server-side pagination and search |
| Brevo transactional unavailable at EPIC-005 | ADR-014 | Ship manual sending from the visible queue; no code change |

---

## Appendix

### Glossary

| Term | Definition |
|---|---|
| **Public plane** | Browser reads with the anon key. Reaches `directory_listings` (published rows, granted columns) and `directory_categories`. Nothing else. |
| **Trusted write plane** | `POST /api/join/submit` → service-role client. The only way member data is written. |
| **Admin plane** | Bearer-token-verified `/api/admin/*` routes. The only way private data is read. |
| **Column grant** | `grant select (col, …) on table to anon` — Postgres column-level permission, honoured by PostgREST. ADR-001's second layer. |
| **Consent event** | One append-only row in `member_consents`. A withdrawal is a new event, never an edit. |
| **Form config version** | An immutable `jsonb` snapshot of the resolved form. Every submission and every consent cites one. |
| **Code registry** | `src/lib/join/questions.js` — the code-defined field set and branching. Not editable at runtime. |
| **IP hash** | Salted SHA-256 of the client IP. The raw IP is never stored or logged. |

### References

- PRD: `bmad-output/prd.md` · Addendum: `bmad-output/addendum.md`
- UX: `bmad-output/DESIGN.md`, `bmad-output/EXPERIENCE.md` (+ `ux-drafts/ADJUDICATIONS.md`)
- Constraints: `bmad-output/inputs/codebase-constraints-brief.md`
- Source form: `bmad-output/inputs/tally-form-RG1M6K-structure.md`
- Decision log: `bmad-output/decision-log.md` · Constitution: `bmad-output/project-context.md`

### Document history

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-08-18 | Winston (Architect) | Initial architecture. 15 ADRs; all 24 FRs and 13 NFRs mapped. |
| 1.1 | 2026-08-18 | Winston (Architect) | **ADR-016** (per-feature route/API modules — removes 76% of story-scope contention) and **Amendments A1–A5**, all found during story compilation. |

---

**END OF DOCUMENT** — ready for handoff to `bmad-epics-and-stories` once validation passes.
