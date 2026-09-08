# Project Context — GPC Website

> The project **constitution**. This document is loaded by every BMAD planning skill
> so they all share the same ground truth. Keep it tight, current, and authoritative.
> When a major decision changes scope, update this file and append the change to
> `decision-log.md`.

- **Track:** quick-flow (project default) — _individual features may escalate; see decision-log_
- **Created:** 2026-08-11T21:55:47Z
- **Last updated:** 2026-08-18

---

## Project Goal

Run and grow the public website for Greenwich Parents & Carers (GPC), a community CIC
serving 1,800+ local parents and carers in south-east London. "Done and successful" is a
site that reliably tells local families what is on, brings them into the community, and
handles their personal data in a way that matches the policies GPC publishes.

## Primary Users

- **Local parents and carers** — mostly mothers, mostly on phones, often one-handed and
  interrupted. They want to know what is on near them, this week, for their child's age.
- **GPC community admins** — volunteers, not technical. They publish events, send the
  newsletter, moderate submissions, and must never need database access to do their job.
- **Under-5 families specifically** — the hardest segment to serve, because most under-5
  provision is published as recurring term-time timetables rather than as dated events.

## Scope

Capabilities currently in play:

- **Public site** — home, about, events, event pages, What's On listings, gallery,
  volunteers, and the published privacy / GDPR / safeguarding policies.
- **Admin panel** (`/admin`) — events, What's On listings, discovery review queue,
  newsletter composition and advertisers, subscribers, and admin users.
- **Event discovery pipeline** — ingests London family events from structured feeds and
  LLM-assisted extraction into a review queue for admin approval.
- **Newsletter** — composition in admin, contacts synced to Brevo.
- **In planning:** membership intake form + public community business directory
  (`prd.md`, `DESIGN.md`, `EXPERIENCE.md`).

## Core Constraints

- **Stack is fixed:** React 19 + Vite 6 + `react-router` v7, Tailwind **v4** (no config
  file — tokens live in `src/index.css`), Supabase Postgres with RLS on every table,
  Vercel serverless functions, Supabase Edge Functions for batch/LLM work.
- **No TypeScript in `src/`**, no form library, no data-fetching library. Fetching is
  `useState`/`useEffect` or a hand-rolled hook. New runtime dependencies need a logged decision.
- **The browser holds only the Supabase anon key**, which ships in the JS bundle and is
  public. RLS is the only client-side boundary. `SUPABASE_SERVICE_ROLE_KEY` lives only in
  Vercel env and is used only inside `/api` handlers.
- **Migrations are sequential SQL** in `supabase/migrations/`, applied with `supabase db push`.
  Conventions are strict and documented — uuid primary keys, `timestamptz`, trigger-maintained
  `updated_at`, text + CHECK instead of Postgres enums, idempotent statements, explicit
  function grants, and a header comment stating intent and evidence.
- **One builder, part-time.** Community-organisation budget; recurring per-seat or
  per-request costs need justification.
- **Every new third-party processor must be added to the published privacy disclosures**,
  which makes adding vendors more expensive than their licence fee.
- **Published policies are binding:** the GDPR policy names Consent as the lawful basis for
  opt-in data, commits to data minimisation, to deletion within 20 working days, to
  informing data subjects before sharing data, and to ICO breach notification.

## Non-Goals

- Rebuilding the site or migrating frameworks.
- A members' area, member accounts, or any member-facing authentication.
- Paid features, payments, ticketing, or e-commerce.
- Becoming a general events platform beyond the local family audience.
- Native mobile apps.
- Any collection of data about children through a web form. (The safeguarding policy
  governs images identifying a child; no form collects child data.)
- Ingesting sources whose terms or robots policy forbid it — Happity, Hoop and Pebble are
  partnership targets, not data sources.

## Key Stakeholders / Roles

| Person | Role |
|---|---|
| **Aster Thackery** | Data controller (named in the published GDPR policy) and Senior Safeguarding Lead. Decides on anything touching personal data or safeguarding. |
| **Clare Macgregor** | Deputy Safeguarding Lead. |
| **Kristina Kaganer** | Sole builder — designs, implements, deploys, and reviews. |
| **GPC community admins** | Operate the admin panel day to day; the primary internal users. |

Organisation: Greenwich Parents & Carers, CIC **16387545**, founded 2021.
Values: Inclusivity, Kindness, Connection.

## Glossary

| Term | Definition |
|---|---|
| **GPC** | Greenwich Parents & Carers — the community CIC that owns this site. |
| **What's On** | The public listing of discovered London family events, distinct from GPC's own events. |
| **Activity** | A recurring offering (a weekly class), as opposed to a single dated event. |
| **Occurrence** | A single dated instance generated from an Activity. |
| **Discovery** | The pipeline that finds London family events from feeds and LLM extraction. |
| **Review queue** | Discovered items awaiting an admin's publish/reject decision. |
| **Term-time only** | An activity that does not run in school holidays — a mandatory attribute, because most under-5 provision is term-bound. |
| **Member** | A person who submitted the membership form. Their record is private and admin-only. |
| **Listing** | A member's public directory entry, visible only after an admin publishes it. |
| **Controller** | The data controller named in the published GDPR policy. |

---

## Decision Thread

Running decisions live in [`decision-log.md`](./decision-log.md). Consult it before making
decisions that might contradict earlier ones. Current thread, newest first:

- 2026-08-18 — six entries covering the membership form + directory feature (track
  escalation, configurable-not-builder form, admin approval of every listing, the public
  field allowlist, per-purpose consent, and the privacy-disclosure launch gate).
- 2026-08-11 — research into scaling under-5 event discovery (recommended Scenario C:
  Activity + generated Occurrences, free structured feeds in yield order, Perplexity
  demoted to a novelty probe).
- 2026-08-11 — track selected: quick-flow.

## Planning Status (count-based)

- **Track:** quick-flow by default; the membership form + directory feature runs on
  **bmad-method** (`prd.md` + architecture + epics).
- **Stories defined:** **46 compiled story context objects**, all `ready-for-dev`, across 8 epics
  (`epics.md` + `stories/`).
- **Stories remaining:** 46 (count-based delivery — no points, no velocity).
- **Next skill:** `bmad-parallel-plan` (build waves from the 109 remaining scope conflicts), then
  `bmad-sprint-planning` and `bmad-handoff`.

_This document plans the work. Implementation is handed to external dev tools via
ready-for-dev story files; the planning plugin never writes or tests application code._
