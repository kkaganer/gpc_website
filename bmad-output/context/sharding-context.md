# Sharding Context — GPC Membership Intake & Business Directory

Read this before compiling any story. It carries the LOCKED decisions and the file-scope map
so parallel story-authors do not diverge or collide.

## Track and sizing

- **Track:** BMad Method. **40 stories across 8 epics** (`bmad-output/epics.md`).
- **Sizing:** one agent session, ~2–8h, one dev-day max. **Split anything larger.**
- **NO story points, NO velocity, NO burndown.** Delivery is count-based.
- Target ~8K tokens per story file. If Dev Notes cannot be written without hand-waving, split.

## Source documents (cite these, never paraphrase from memory)

| Doc | Use for |
|---|---|
| `bmad-output/prd.md` | FR/NFR text and acceptance criteria → `[Source: prd.md#FR-XXX]` |
| `bmad-output/architecture.md` | ADRs, data model, API contracts → `[Source: architecture.md#adr-00N-...]` |
| `bmad-output/DESIGN.md` | tokens, component specs, WCAG contract → `[Source: DESIGN.md#2-component-specifications]` |
| `bmad-output/EXPERIENCE.md` | journeys, wireframes, named states, **actual microcopy** → `[Source: EXPERIENCE.md#N-section]` |
| `bmad-output/addendum.md` | open questions, deferred `FR-D` items |
| `bmad-output/decision-log.md` | why a decision is what it is |
| `bmad-output/inputs/codebase-constraints-brief.md` | existing patterns, file paths, what does NOT exist |
| `bmad-output/epics.md` | epic goals and cross-epic dependencies |

Own inferences must be labelled `[Inference]`. Never present an invented detail as cited.

## LOCKED cross-cutting decisions — every story inherits these

Do not restate them at length; cite the ADR. But no story may contradict one.

1. **ADR-001 — public/private split.** `directory_listings` is the ONLY public-readable table.
   Its column list contains no column capable of holding personal data. Second layer:
   `revoke select … from anon` + `grant select (specific columns)`. **No view is ever used as a
   public projection.** Any new object defaults closed.
2. **ADR-002 — persistence conventions.** `uuid` PKs via `gen_random_uuid()`; `snake_case`;
   `timestamptz`; trigger-maintained `updated_at`; **text + CHECK, never Postgres ENUM**; every
   statement idempotent; lowercase SQL; every function gets
   `revoke execute … from public, anon; grant execute … to <role>;` **in the same migration**;
   header comment with intent + `-- WHY.` + evidence + explicit "deliberately not done" blocks.
   **Migrations 028–031 are reserved** — do not invent new numbers.
3. **ADR-003 — auth.** Supabase Auth. Exactly two principals: `anon`, `authenticated`. **No roles,
   no `is_admin` column.** Every `/api/admin/*` route starts with the verbatim bearer-token block.
   Every state change writes `actioned_by` + `actioned_at`.
4. **ADR-004 — one trusted write path.** The browser NEVER writes member data. `POST /api/join/submit`
   builds rows **field-by-field from an allowlist**; never spreads `req.body`. Consent text, version,
   `captured_at` and `method` are assigned server-side. **No personal data in any log line** — log
   the record `id` only.
5. **ADR-005 — errors.** Always JSON. `{ error: string }` + status. Every handler in try/catch.
   **Non-disclosure:** genuine submission, duplicate email and honeypot catch all return the SAME
   success shape. The confirmation UI renders from the **request payload**, never a server echo.
6. **ADR-006 — naming.** DB `snake_case`; JS `camelCase`; routes kebab-case; components
   `PascalCase.jsx`; hooks `useThing.js`. **No camelCase mapping layer** — Supabase keys are used
   as-is, matching the existing codebase.
7. **ADR-007 — state.** No React Query/SWR/Redux/Zustand, **no form library**, no new runtime
   dependency. Hooks in `src/hooks/` returning `{ data, loading, error }`; filter in `useMemo`.
   Bounds: directory 500 · members `MAX_ROWS=1000` / `PAGE_SIZE=100` · queue `PAGE_SIZE=25`.
   **Insights aggregate server-side** — raw member rows never reach a browser.
8. **ADR-008 — form config.** Code registry (`src/lib/join/questions.js`) owns keys, types,
   branching, validation. DB overlay owns labels/help/required/options. Draft → publish snapshots a
   `jsonb` version. **Open/closed applies immediately**, bypassing publish. **Categories are NOT
   here** — they live in `directory_categories`, owned by Epic 5, immediate effect.
9. **ADR-009 — answers.** `jsonb` keyed by `question_key`; every choice stores `{key, label}`.
   **Aggregate by `key`; display `label`.**
10. **ADR-010 — consent.** Append-only, enforced by **trigger** (not grants — `service_role`
    bypasses RLS). Withdrawal is a new row with `granted=false`. Six fields always.
11. **ADR-011 — anti-abuse.** Four layers **in order**: origin → honeypot (silent success) →
    Postgres rate limit on **salted SHA-256 IP hash** (3/hr, 20/24h, swept 48h) → server-side length
    limits (reject, never truncate). **No new third-party processor.** Raw IP never stored or logged.
12. **ADR-012 — moderation.** `status text` CHECK `pending|published|held|rejected|unpublished`.
    Only `published` is public. Admin edits do NOT re-open moderation. Resubmission sets the
    existing listing to `pending` and does not alter what is currently public.
13. **ADR-013 — slugs are immutable.** Generated once at first publication; renaming never
    regenerates.
14. **ADR-014 — outbound email is a queue table** written in the same transaction as the decision.
    Send failure never rolls back the decision. Sender pluggable; degrades to manual.
15. **ADR-015 — erasure** through one `SECURITY DEFINER` `erase_member()`; cascade removes the
    listing so it cannot outlive the erasure. Partial withdrawal ≠ erasure.

## UX rulings that override the long-form drafts

From `ux-drafts/ADJUDICATIONS.md` (A1–A21). The ones stories most often get wrong:

- **A1** error summary sits **above the submit button**; focus **always** moves to it.
- **A2** confirmation renders from the **request payload**.
- **A6** **no global toaster** — inline banners (`DESIGN.md` §2.10).
- **A7** one shared `Spinner` honouring `prefers-reduced-motion`; skeletons for page loads.
- **A13** **one** `aria-live="polite"` region and **one** `role="alert"` region per page.
- **A14** one `Dialog` primitive; `ConfirmModal` rebuilt on it.
- **A15** do NOT copy `SubscribersManager`'s pill colours — they fail AA. Use `DESIGN.md` §2.7.
- **A20** `prefers-reduced-motion` reset applied **globally**.
- Skip link **already exists** at `src/components/layout/Layout.jsx:8-10` for public pages — do not
  add a second; fix its contrast to `--color-primary-700`. `AdminLayout` needs one added.

## Accessibility floor (NFR-008) — applies to every UI story

Every input has `id` + `<label htmlFor>` (**the site does this nowhere today**). Groups are
`<fieldset>`/`<legend>`. Errors: `role="alert"` + `aria-describedby` + `aria-invalid`. 16px minimum
on inputs. Visible `:focus-visible`. Touch targets ≥44×44px. No horizontal scroll at 320px.
`<button>` for actions, `<a>` for navigation — never `<div onClick>`. Submitted text renders as
**plain text, never markup**.

## Design tokens (do not restate values in stories — cite `DESIGN.md` §1)

Critical correction every UI story inherits: brand `#fc16a0` is **3.64:1** and must NEVER carry
body-size text in either direction. Use `--color-primary-700` `#c9107f` for button fills with white
text and for link text. Input borders `--color-border` `#6b7280` (the existing `#d1d5db` is 1.47:1
and fails WCAG 1.4.11).

## Owned File/Module Scope — the collision map

Declare paths precisely. These are the **contended** files; if your story needs one, say so
explicitly under "Shared/contended" and add a Dependency Map link:

| Contended path | Owned by | Everyone else |
|---|---|---|
| `src/App.jsx` | each story adds its own routes | list as shared/contended; serialize |
| `src/components/layout/Navbar.jsx` | **3.2** (`/join` CTA) and **6.1** (`/directory` NavItem) | nobody else |
| `src/components/admin/AdminLayout.jsx` | **5.1** (drawer, skip link) | others list as shared/contended |
| `src/index.css` | **3.1** (token additions) | nobody else |
| `src/components/ui/Button.jsx` | **3.1** (size/disabled/loading variants) | nobody else |
| `src/components/ui/Badge.jsx` | **5.1** (moderation pill variants) | nobody else |
| `supabase/migrations/028–031` | **1.1–1.4**, one file each | nobody else may edit a migration |
| `src/lib/join/questions.js` | **2.1** | others read it only |
| `src/lib/adminApi.js` | each admin story appends its own function | shared/contended; serialize |

**Never** list a broad glob like `src/**`. Prefer named files. Include the test paths you expect.

## Status and handoff

Author every story with `status: backlog`. The orchestrator runs the scope-conflict check across
all 40 and flips clean ones to `ready-for-dev`. **Leave `Dev Agent Record` empty.**

## Known blockers to reference, not solve

- **Addendum Q8** — the retention figure inside the `hold_data` consent text is still
  `«RETENTION_PERIOD»`. Blocks the first live submission. Stories touching consent text must
  surface this, not invent a period.
- **FR-024** — the `/privacy` content is the controller's to author. Story 8.1 delivers the page.
- **Brevo transactional** — needs a verified sender domain. Story 5.5 must degrade to manual.
