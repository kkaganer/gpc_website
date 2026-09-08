# Decision Log — GPC Website

A threaded, append-only record of decisions made across BMAD planning workflows.
Every later skill (brief, PRD, architecture, stories) appends here so the reasoning
behind the plan stays visible and consistent.

**How to use:** add a new entry at the top of the log (newest first). Never rewrite
or delete past entries — supersede them with a new entry that references the old one.

## Entry format

```
### YYYY-MM-DD — <short title>
- **Decision:** <what was decided>
- **Rationale:** <why; alternatives considered>
- **Made by:** <skill/workflow, e.g. bmad-init, prd, architecture>
- **Supersedes:** <link to prior entry, if any>
```

---

### 2026-08-18 — Backlog compiled: 46 ready-for-dev stories, and ADR-016 born from the scope check
- **Decision:** `epics.md` (8 epics) plus **46 story context objects** in `bmad-output/stories/`,
  all `status: ready-for-dev`. Every story carries numbered testable ACs, tasks mapped to ACs,
  source-cited Dev Notes, a testing **strategy**, dependency maps, an explicit Owned File/Module
  Scope, and an empty Dev Agent Record.
- **46 from a 35-story PRD outline:** the PRD sketches user-visible value; this cuts implementable
  units. Six migrations/scaffold stories have no user story of their own, and five stories exceeded
  one dev-day and were split by layer (3.1→a/b, 5.2→a/b, 5.5→a/b, 8.3→a/b, 8.4→a/b). Nothing dropped.
- **The scope check earned its keep.** Run across all 46, it found **274 conflicting story pairs —
  76% of them on two files**: `src/App.jsx` (170 pairs) and `src/lib/adminApi.js` (39), because
  every feature appends a route and an API function to the same two places. Under the original
  structure most of the backlog would have been forced to run sequentially on files nobody is
  really collaborating on. This produced **ADR-016** (per-feature route modules under `src/routes/`,
  per-domain API clients under `src/lib/api/`) and new story **1.6**, which becomes the sole owner
  of both shared files. Consolidating every admin sidebar row into story 5.1 removed a further
  contended file. **Conflicts: 274 → 109**, and the remainder is legitimate within-epic sequencing.
- **Five defects in architecture v1.0, found by story authors and fixed in v1.1** (Amendments A1–A5):
  **A1** ADR-001 claimed `directory_listings` was the only public-readable table while §5 correctly
  made `directory_categories` public too — the guarantee is about *content*, not count, and neither
  holds personal data. **A2** ADR-011's 48-hour `abuse_events` sweep was irreconcilable with the
  abuse tile's 7/30-day windows; added a non-identifying `abuse_daily_counts` table so minimisation
  and visibility can both hold. **A3** `form_settings` mixed live and draft fields — `is_open` is
  live (an emergency control), `intro_text`/`closed_message` are published content. **A4**
  `erase_member()` had no `p_request_id` and so could not write the tombstone ADR-015 requires.
  **A5** only migrations 028–031 were reserved while five stories legitimately needed their own
  function migrations and were each inventing a number — 032–035 are now assigned by owner.
- **Contract validation:** all 46 stories carry every required section, 403 tasks map to ACs
  (one gap found and fixed), Dev Notes average ~20 source citations each with inferences explicitly
  labelled, and every Dev Agent Record is empty.
- **Not resolved, deliberately:** the addendum Q8 retention figure (surfaced in story 3.6, not
  invented), the enquiry-contact shape (Q3/Q4 — built for the email-in-the-clear base case), and
  FR-024's privacy-page content (story 8.1 delivers the page; the controller authors the words).
- **Made by:** bmad-epics-and-stories
- **Supersedes:** none

---

### 2026-08-18 — Architecture accepted: 15 ADRs covering all 24 FRs and 13 NFRs
- **Decision:** `architecture.md` v1.0 accepted. Pattern is **serverless + BaaS on the existing
  stack** — no new tier, no new service, no new runtime, and **zero new runtime dependencies**.
  Validates 30/30. Migrations **028-031** reserved now to avoid the numbering collision that once
  blocked `db push`.
- **The five decisive questions, answered:**
  1. **Storage split (ADR-001).** Two table families. `directory_listings` is the *only*
     public-readable table and its column list contains **no column capable of holding personal
     data** — the guarantee is verifiable by reading one `create table`. Second layer:
     `revoke select … from anon` then `grant select (specific columns)`, so `member_id`, `status`,
     moderation notes and admin attribution are not readable even though the row is. Chosen over
     column-grants-alone because that mechanism has no precedent in this repo and a solo maintainer
     should not have the sole guarantee resting on something they have never used. Views are
     explicitly not used as a public projection — that is the failure this codebase already shipped
     (`018_secure_ingest_batch_status.sql`).
  2. **Form configuration (ADR-008, ADR-009).** Three layers: a **code registry** owning keys,
     types and branching (so there is no table that could express "add a question"); a **database
     overlay** for labels, help text, required flags and options; and **versioned publish** via a
     `jsonb` snapshot. Answers store `{key, label}` pairs — aggregate by `key` so a rename does not
     fracture a chart, display `label` so a retired option still reads correctly years later.
     Open/closed bypasses draft-publish because closing a form is an emergency control.
  3. **Anti-abuse (ADR-011).** Four layers, **no new processor**: origin check, honeypot
     (returns the ordinary success shape), Postgres rate limiting on a **salted hash of the IP**
     swept after 48 hours, and server-side length limits. Chosen because the PRD makes any new
     sub-processor cost a privacy-page revision and a controller decision on top of integration.
     Known limit — per-IP, so a distributed attack passes; ADR-011 names the measurable trigger
     (>100 rejections/day, or spam >5% of the queue) for accepting Turnstile.
  4. **Consent (ADR-010).** Append-only `member_consents`, one row per consent *event*, withdrawal
     as a new row with `granted = false`. **Enforced by trigger, not by grants** — Supabase's
     `service_role` bypasses RLS and holds broad table grants, so revoking UPDATE would not stop
     the very path this feature writes through. `erase_member()` is the single documented exemption.
  5. **Transactional email (ADR-014).** **Yes, as a queue table** written in the same transaction as
     the moderation decision, with a pluggable sender. This is what satisfies NFR-011 (a send
     failure must not roll back the decision) *and* it means the feature degrades to manual sending
     with no code change if Brevo transactional is not verified in time.
- **Other locked decisions:** binary anon/authenticated auth with **attribution instead of tiers**
  (ADR-003 — every logged-in user is still a full admin, mitigated by `actioned_by`/`actioned_at`
  on every transition); one trusted write path that builds rows **field-by-field from an allowlist**
  and never spreads the request body (ADR-004); `{ error }` + status JSON always, with the **same
  success shape** for a genuine submission, a duplicate and a honeypot catch (ADR-005);
  hand-rolled hooks with **explicit bounds on every list view** and server-side insights aggregation
  so raw member rows never reach a browser (ADR-007); text status vocabulary over boolean
  (ADR-012); **immutable slugs** so a rename never breaks a shared link or an already-sent email
  (ADR-013); erasure through one `SECURITY DEFINER` function relying on `on delete cascade` so a
  published listing **cannot outlive the erasure** (ADR-015).
- **Consciously not designed for**, recorded so a later reader does not assume oversight:
  availability targets, horizontal scaling, redundancy, circuit breakers and disaster recovery.
  Managed platform behaviour is inherited as-is; there is no operator and no target worth
  engineering against at community scale.
- **Carried into the architecture as blocking:** addendum **Q8** (retention figure in consent text)
  blocks the first live submission; **FR-024** (privacy page) blocks launch. Both are in §10's
  release gates alongside the NFR-001 anon-enumeration probe, the NFR-003 burst test and the
  NFR-008 audit.
- **Environment constraint surfaced:** there is **one Supabase project across dev, preview and
  production**. The burst test must run against a preview deployment with a distinct salt and sweep
  its rows afterwards, and stories must not seed test member data.
- **Made by:** bmad-architecture
- **Supersedes:** none

---

### 2026-08-18 — Story outline re-cut for the business-directory scope
- **Decision:** Updated the epics and stories outline, one success metric and the traceability
  matrix in `prd.md` to match the business-directory scope. **All existing STORY IDs are
  unchanged**; two new stories append as **STORY-034** and **STORY-035**, taking the outline from
  33 to 35.
- **Changes made:**
  - **STORY-002** (Carla answers only career questions) — narrowed from "no business question" to
    "no question from the Business *survey* branch", plus a second criterion that a self-employed
    Career Mum can still list. The old wording would have been implemented as a rule that locked
    her out.
  - **STORY-003** — re-cast from *"As a Business Mum"* to *"As a member who runs a business"*. The
    persona was doing eligibility work it should never have been doing.
  - **STORY-034 (new)** — the member can tell at a glance whether the directory is for her, and
    declining does not read as missing out on something she was entitled to. Traces to FR-003.
  - **STORY-035 (new)** — a standard, kindly-worded reject reason for a submission that is not a
    business, so an admin declining an off-scope listing does not have to improvise wording that
    might read as "you are not welcome here". Traces to FR-015.
  - **EPIC-001 User Segments** — annotated that the listing question cuts across both groups.
- **Success metric corrected:** "Directory opt-in rate among Business Mums", measured as
  *opt-ins / Business-or-Both submissions*, was **measuring the wrong denominator** under the
  corrected scope — it would have hidden every self-employed member who chose "Career Mums" and
  reported an opt-in rate that looked healthier than reality. Re-cut as "Listing opt-in rate among
  members with a business", denominated on **eligibility, not group**.
- **Also corrected:** the Executive Summary now states what the release is precisely and names the
  deferred member directory so the two cannot be re-merged by a later reader; the Background
  records that the source form's own question names the wrong product.
- **Note:** no story *files* exist yet — `bmad-output/stories/` is empty and the outline in
  `prd.md` is the only story artifact. Nothing needed re-sharding; when `bmad-epics-and-stories`
  compiles the story files it will cite the corrected outline.
- **Made by:** bmad-prd (UPDATE intent)
- **Supersedes:** none — implements the scope correction in the entry below.

---

### 2026-08-18 — Scope: this release ships a BUSINESS directory; a member directory is a separate later product
- **Decision:** The brief is a **directory of businesses** in the GPC community, and that is what
  this release delivers. A **member directory** — covering everyone, including members who do not
  run a business — is a **separate, later product that sits behind a member login** and is now an
  explicit Out of Scope entry plus a parked requirement (**FR-D10**). Eligibility for a listing is
  **having a business, practice or freelance service**, not which group the member picked: a
  self-employed member who chose "Career Mums" can list; a salaried member with no business is not
  listed in this release, and member-facing copy does not hint at the future product.
- **Rationale:** User correction. The previous entry framed the opt-in as "open to every member",
  which quietly merged two different products. They are not phases of one thing: a business
  directory publishes **business** information and can be **public**; a member directory publishes
  information about **people**, is personal data by definition, and therefore has to be behind
  authentication that does not exist. Merging them would have produced a public page carrying
  personal details — precisely the outcome this whole plan exists to prevent.
- **What this fixes downstream:** the "what does a salaried member put as her business name?"
  problem dissolves, because she is not listing. **Addendum Q10 is closed as moot.** The source
  form's own wording — *"Would you like to be included in our local member directory?"* — names the
  wrong product and is reworded to "business directory"; FR-008 makes such wording admin-editable,
  but the shipped default must be correct.
- **What is retained:** the survey answers that would feed a future member directory (industry,
  current situation, support wanted, interest in speaking / mentoring / collaborating) are still
  collected and still drive the insights view (FR-014). Collecting them is useful; **publishing any
  of them now is not in scope.**
- **Made by:** bmad-prd / bmad-ux (user correction)
- **Supersedes:** the 2026-08-18 entry "The directory is open to every member; only work details
  are ever published" — its uniform-publication rule stands (business information only, never
  personal, identical listing shape for everyone), but its eligibility rule is replaced by the
  above.

---

### 2026-08-18 — The directory is open to every member; only work details are ever published
- **Decision:** The directory opt-in is offered to **every member**, independent of the
  Business/Career group answer, and the listing fields are attached to the **opt-in** rather than
  to a branch. The **published field set is identical for everyone** — name to be listed under,
  category, description, website, Instagram, public enquiry contact — and **nothing personal is
  published for any member, whatever their position**. No listing is fuller or thinner because of
  the branch its member took.
- **Rationale:** User decision, and it matches the form's own promise — the intro offers a
  directory of "local businesses **and professionals**", and the Career branch already offers
  **Self-employed** and **Freelance** as situations, so some Career Mums plainly have something to
  list. Attaching the fields to the opt-in rather than the branch is what makes the rule uniform:
  the group answer routes the *survey*, not the *listing*.
- **Corrects an earlier framing:** an earlier note in this planning set described a Career Mum
  opting in as producing an "empty directory entry", implying a data-integrity defect. That
  overstated it — a member with nothing to list simply has nothing to list, and an admin would not
  publish it. The genuine issue was narrower: the opt-in question and the fields that would answer
  it were never connected, so a member who wanted a listing could not supply one. That is what
  FR-003 fixes.
- **Copy consequence:** member-facing wording no longer assumes a business. The opt-in reads
  *"Yes, please - list me"*, the field is *"The name to list you under"*, and the directory
  describes itself as "businesses and professionals in the GPC community" rather than "businesses
  run by members".
- **Follow-on raised:** for a salaried member the listed name is ambiguous, and naming an employer
  would publish her employment (personal data) and a third party's brand. Recorded as **addendum
  Q10** with a proposed steer — list what you do, not who employs you — as helper text plus a
  moderation check rather than a validation rule.
- **Alternatives considered:** *Hide the directory question from Career Mums* — rejected: it locks
  out self-employed and freelance members the form already identifies. *Gate the fields on the
  Self-employed/Freelance answers* — rejected as the most conditional logic for the least benefit,
  and it would still exclude an employed member who wants to be findable for mentoring or
  collaboration.
- **Made by:** bmad-prd / bmad-ux (user decision)
- **Supersedes:** none

---

### 2026-08-18 — UX: the brand pink fails AA and is corrected for new surfaces
- **Decision:** On the new surfaces (`/join`, the directory, the new admin screens), any fill
  carrying white body-size text and any pink text uses a new **`--color-primary-700` `#c9107f`**
  (5.43:1 on white, 5.24:1 on warm). The brand `--color-primary` `#fc16a0` is retained for large
  display type (>=24px, or >=18.66px bold) and for non-text UI — borders, icons, focus rings —
  where the 3:1 threshold applies. Input borders move from `#d1d5db` to **`#6b7280`**. The
  existing skip link's fill is corrected likewise. `--color-amber` `#f59e0b` is not used.
- **Rationale:** Measured, not estimated. White on `#fc16a0` is **3.64:1** against a 4.5:1
  requirement — every primary button on the site fails AA for normal text today, as does the
  skip link at `src/components/layout/Layout.jsx:8-10`. The input border `#d1d5db` is **1.47:1**
  against WCAG 1.4.11's 3:1 requirement for control boundaries. `#f59e0b` is 2.15:1 on white.
  NFR-008 makes AA a hard requirement for this feature, so none of these could be inherited.
  `#c9107f` is the same hue, so the pages still read as GPC.
- **Alternatives considered:** *Dark text on `#fc16a0`* — 4.18:1, still failing. *Enlarge button
  text to 24px* — absurd on mobile. *Drop the brand pink entirely* — over-correction; it passes
  at the thresholds that actually apply to large text and to non-text UI.
- **Scope:** corrections apply to the new surfaces. Retrofitting the rest of the site is real and
  worth doing, but is separate work and is not smuggled into this feature.
- **Made by:** bmad-ux
- **Supersedes:** none

---

### 2026-08-18 — UX: the public/private split is a visible component, not a footnote
- **Decision:** The directory opt-in carries a persistent **public/private disclosure panel** —
  two labelled lists, "What other people will see" and what stays private, that **echo the
  member's actual entered values live** as she types. It is never collapsed, never behind a
  toggle, and is coloured `--color-info` blue rather than brand pink.
- **Rationale:** FR-003 requires the split to be understood at the point of collection, and the
  persona this protects — a woman running a business from her home address — has a specific fear
  that a paragraph of reassurance does not answer. A tooltip she never opens, or small print below
  the fields, is the pattern that produced the problem in the first place. Echoing her real values
  makes the guarantee literal rather than abstract. Blue because it is a factual guarantee, not a
  promotion; brand pink would read as marketing and be discounted.
- **Related:** consent copy is set at 16px body size, never small print — consent must be informed
  to be valid, and the text is stored verbatim and versioned (FR-004, NFR-004).
- **Made by:** bmad-ux
- **Supersedes:** none

---

### 2026-08-18 — UX: seven parallel drafts were audited and adjudicated before assembly
- **Decision:** `EXPERIENCE.md` was assembled from seven independently-drafted sections that were
  first audited by a separate critic. The audit found **two entirely uncovered requirements, 17
  cross-section contradictions, four screens no section owned, and eight places where copy had
  been promised and left as a placeholder.** All were adjudicated (A1-A21) before assembly; the
  rulings bind over the drafts.
- **Notable rulings:** the confirmation screen renders from the **request payload, never from
  stored records** (rendering from the database leaks honeypot and duplicate-email state, breaking
  FR-006/FR-007 non-disclosure); **categories have exactly one owner** — the directory section,
  with immediate effect — while form copy is drafted-then-published, which removes a double-edit
  conflict at its root; **listing slugs are immutable**, so renames never break shared links or
  links in already-sent emails; **no global toast provider**; **one dialog primitive**; **one live
  region per page**; and the member-facing review timeframe is *"usually within a week"*, never
  the PRD's five-working-day figure, which is an internal median and not a promise.
- **Requirements that had no design at all, now specified:** FR-006's admin-visible rejection
  counter (EXPERIENCE.md section 4) and FR-024's privacy-page content (section 7). Both would
  otherwise have shipped unbuilt while appearing complete.
- **Known blocker carried forward:** the retention period in the "hold my data" consent text is
  still `RETENTION_PERIOD` (addendum Q8). It is marked as blocking in `EXPERIENCE.md` section 2
  and cannot ship as a placeholder — the string is stored verbatim in every consent record.
- **Artifacts:** `ux-drafts/CRITIQUE.md` (the audit), `ux-drafts/ADJUDICATIONS.md` (the rulings),
  `ux-drafts/*-draft.md` (long-form source, superseded by `EXPERIENCE.md`).
- **Made by:** bmad-ux
- **Supersedes:** none

---

### 2026-08-18 — Track escalated to BMad Method for the directory feature
- **Decision:** Planning for the **membership intake form + community business directory**
  runs on the **BMad Method** track (PRD + architecture + epics), not Quick Flow.
  `config.yaml` keeps `track: quick-flow` as the project default; this feature is an
  explicit, scoped exception recorded here.
- **Rationale:** The bmad-init entry set Quick Flow with a standing scope check —
  "if story count exceeds ~15 during scoping, redirect to bmad-prd + bmad-architecture".
  Scoping produced **24 FRs, 13 NFRs and 7 epics with 33 sketched stories**, well past
  that threshold. Three factors make it genuinely larger than the incremental features
  Quick Flow was chosen for: (1) it is a *public write* surface, the site's first that
  collects and publishes personal data, so the trust boundary needs designing rather
  than following a precedent; (2) it carries a **legal gate** — the published GDPR
  policy names Consent as the lawful basis, and the current form cannot evidence what
  anyone agreed to; (3) it spans a public form, an admin configuration surface, a
  moderation workflow, a public browse experience, and privacy content — five distinct
  surfaces rather than one.
- **Alternatives considered:** *Stay on Quick Flow with a tech-spec* — rejected: a single
  tech-spec cannot carry the traceability from consent requirements to the storage split
  to the launch gate, and this is exactly the case the escalation rule was written for.
  *Escalate the whole project to bmad-method* — rejected as overreach: routine work on
  this site (an event field, a filter fix) is still Quick Flow work.
- **Made by:** bmad-prd
- **Supersedes:** none (scopes the track choice in the 2026-08-11 bmad-init entry)

---

### 2026-08-18 — Configurable single form, not a form builder
- **Decision:** Build **one purpose-built membership form** whose field set and branching
  are defined in code, with labels, help text, choice options, required flags, intro and
  closed messages, and open/closed state editable from admin at runtime (FR-008, FR-009).
  A generic drag-and-drop form builder is **Won't** for this release.
- **Rationale:** User decision. The recon of the codebase flagged the ambiguity in
  "admin-authored" directly: a runtime-defined field set means dynamic-schema storage plus
  a renderer, has no precedent anywhere in this codebase, and roughly triples the work.
  The actual need is that admins can fix wording and keep option lists current without a
  deploy — the live form's "Weekly Newletter" typo is the standing example. That need is
  fully met by editable content over a fixed structure.
- **Alternatives considered:** *Full form builder* — rejected as rebuilding Tally to serve
  one form. *Fully hard-coded form* — rejected: every wording change would need a deploy,
  which fails the user's stated requirement.
- **Made by:** bmad-prd
- **Supersedes:** none

---

### 2026-08-18 — Every directory listing is admin-approved before publication
- **Decision:** Opting into the directory creates a **pending** listing. Nothing is publicly
  visible until an admin publishes it. Admins can also hold, reject with a reason, edit the
  public fields, and unpublish (FR-015, FR-016).
- **Rationale:** User decision, and it is what the form already promises — the intro text
  says GPC is building a "trusted directory". It is also the only defence that works given
  the constraints: the public write endpoint is unauthenticated, no anti-abuse mechanism
  exists anywhere in the codebase to inherit, and the source form collects nothing that
  guarantees a complete entry. Auto-publishing would put spam and empty listings on the
  public site first and clean up after.
- **Alternatives considered:** *Auto-publish with post-hoc removal* — rejected on the above.
  *Approve the first listing only* — rejected: later edits are exactly where a listing can
  turn into an advert or worse, and the review cost at community volume is minutes a week.
- **Follow-on:** moderation states copy the `activities` precedent (text + CHECK vocabulary
  with a reason column), not the `london_events` boolean, which cannot express "held" or
  "rejected with a reason".
- **Made by:** bmad-prd
- **Supersedes:** none

---

### 2026-08-18 — Public listing fields are an explicit allowlist; location is not published
- **Decision:** A published listing shows **only**: business name, category, description,
  website, Instagram, and a **new public enquiry contact** nominated separately by the
  member. Signup email, first name, postcode, every survey answer, every consent record and
  all moderation notes are **private, admin-only, and not readable by any public route**
  (FR-003, FR-011, NFR-001). **No location is published — not even an approximate area.**
- **Rationale:** User decision on the field list. Two design consequences follow. First, the
  source form has no public-safe description, category or contact at all — its only business
  fields are name, website and Instagram, all optional and confined to the Business branch,
  so a member could opt in and produce an empty entry. Those fields are net-new. Second,
  publishing the signup email was never acceptable: for a sole trader it is usually a
  personal address, so a separate nominated contact is the only way to make a listing
  contactable without exposing one.
- **Enforcement:** the split is structural, not a matter of which columns a query selects.
  Recon showed this codebase has already shipped an anon-readable view to production once
  and needed a corrective migration; row-level policies do not restrict columns, and a view
  over a private table is not a boundary because the base table stays reachable.
- **Noted tension:** the form calls this a *"local member directory"* and locality is the
  value proposition, but with no location published a visitor cannot tell a Blackheath
  business from one in another borough. Recorded as **addendum Q1**, with outcode-only
  publication (e.g. "SE3") as an explicit opt-in field held as the fallback (FR-D03) if
  revisited. Proceeding as decided.
- **Alternatives considered:** *One table with public and private columns* — rejected;
  row-level security cannot express it and there is no column-level precedent in the repo.
  *Publish approximate area* — declined by the user.
- **Made by:** bmad-prd
- **Supersedes:** none

---

### 2026-08-18 — Consent is captured per purpose, evidenced, and versioned
- **Decision:** Replace the source form's single "I agree" tick with **three separate
  consents**: holding the submitted data (required), publishing the nominated fields
  publicly (required only if opting into the directory), and the newsletter (always
  optional, never pre-ticked). Each stored consent carries the exact text shown, a version
  identifier, a UTC timestamp and the capture method, and consent history is append-only
  (FR-004, NFR-004).
- **Rationale:** The site's published GDPR policy names **Consent** as the lawful basis for
  opt-in data, and no `consent_text`, `consent_version`, `consent_method` or equivalent
  column exists anywhere in the schema today — GPC currently cannot evidence what any
  member agreed to. Publishing someone's business details is a materially different
  permission from holding their data, and neither is a newsletter subscription; one tick
  cannot carry all three. Versioning matters because the wording will be revised, and
  existing records must keep citing the version their member actually saw.
- **Consequence for the write path:** consent cannot be captured by a browser-key insert.
  The public key ships in the JS bundle, and a public insert policy lets the submitter
  author their own consent record — which is worthless as evidence. All submissions go
  through one server route with privileged credentials (FR-005), which also makes it the
  single place to enforce anti-abuse (FR-006).
- **Made by:** bmad-prd
- **Supersedes:** none

---

### 2026-08-18 — Updating the published privacy disclosures is a launch gate
- **Decision:** The form does not go live until `/privacy` describes every category of data
  it collects, states which fields the directory publishes, and names the lawful basis and
  retention period (FR-024, Must). The consent copy links to that page, not to the Google
  Drive PDF the current form points at.
- **Rationale:** The published privacy page currently lists only newsletter email, event
  booking contact details, and basic analytics. Everything this form adds is undisclosed
  collection, and a public directory is a new processing purpose that needs its own stated
  basis. It is content work rather than code, which makes it the item most likely to slip
  behind the build — naming it an explicit gate is the mitigation, not a formality.
- **Noted, not in scope:** recon surfaced pre-existing divergences on the same page
  (collection by an existing modal that is undisclosed, several processors unlisted, and
  analytics loading with no consent gate). They are not this feature's defects, but a new
  PII-collecting surface widens the exposure, so they are recorded here for the controller.
- **Made by:** bmad-prd
- **Supersedes:** none

---

### 2026-08-11 — Research: scaling under-5 event discovery in SE London
- **Decision:** Recorded a combined Technical + Domain research report to inform the
  redesign of the event discovery pipeline. Recommended direction: **Scenario C
  (hybrid)** — migrate the data model from Event to **Activity + generated
  Occurrences** (with mandatory `term_time_only` and age-in-months), ingest the free
  structured-feed tier in strict yield order (OpenActive → Family Hubs → Spektrix →
  library feeds → CMS REST → sitemap+HTML with nano-class LLM extraction), and demote
  Perplexity from *the* discovery mechanism to a ~15-call/week novelty probe.
- **Rationale:** Three findings drove this. (1) **~97% of under-5 supply is weekly
  recurring and term-time-bound** (~600–825 sessions/week vs ~10–25 one-offs), so a
  "next 14 days" event window structurally cannot see it — this, not model quality,
  explains the observed skew to museums/theatre/festivals aimed at 5–12s. (2)
  **~1,000+ under-5 occurrences/week are available for £0** from empirically verified
  keyless feeds (OpenActive RPDE under CC-BY 4.0, Spektrix API across 7 local venues,
  Tower Hamlets Family Hubs JSON API, Better/GLL library timetables). (3) **The £20/week
  budget is not the binding constraint** — every viable scenario costs 4.5–47% of it;
  the recommendation runs at **£2.60/week (13%)**. Binding constraints are recall and
  source-list maintenance.
- **Alternatives considered:** *Scenario A — scale up Perplexity* (a 96-call
  borough×category grid fits at £9.42/week): rejected as budget-viable but
  coverage-limited; marginal net-new events collapse with overlap and it cannot reach
  the long tail. *Scenario B — pure crawl + cheap LLM* (£0.90/week): rejected as
  slightly cheaper but forgoing the free feed tier and the novelty probe. *Eventbrite
  as a source*: rejected — public event search withdrawn Feb 2020, returns 404 today.
  *Happity / Hoop / Pebble as data sources*: rejected on ToS/robots grounds despite
  being the highest-value content; reclassified as partnership targets. *Open Referral
  UK*: rejected — zero adoption across all six target boroughs.
- **Key finding:** The defect is the primitive, not the model or the budget — under-5
  activity is published as timetables, not events.
- **Report:** bmad-output/research-report.md (detail legs in bmad-output/research-scratch/)
- **Next skill:** bmad-tech-spec — with a scope check: if story count exceeds ~15 during
  scoping, redirect to bmad-prd + bmad-architecture.
- **Made by:** bmad-research
- **Supersedes:** none

---

### 2026-08-11 — Track selected: quick-flow
- **Decision:** Initialized this project on the **quick-flow** track.
- **Rationale:** GPC is an existing (brownfield) production site rather than a
  greenfield build, and work arrives as focused, incremental features — recent
  examples: the What's On listing, postcode-based location, bulk admin actions,
  and event-URL resolution in discover-events. Scope signals: **one builder**, no
  cross-team coordination, and no formal compliance/regulatory programme driving
  planning (the site has GDPR and safeguarding policy pages, but these are
  published content, not a compliance workstream). Under the standard heuristic
  that puts 10+ stories or a clear PRD/architecture need on bmad-method, none of
  those triggers apply, so a full PRD + architecture pair would be ceremony
  without payoff. Quick Flow keeps the artifact set to a single tech-spec per
  piece of work, which matches how this project actually ships.
- **Alternatives considered:** *bmad-method* — deferred, not rejected; revisit if
  a large multi-epic push arrives (a membership system, a rebuild, or anything
  spanning many stories at once). *enterprise* — rejected as clearly
  disproportionate for a solo-maintained community site.
- **Made by:** bmad-init
- **Supersedes:** none
