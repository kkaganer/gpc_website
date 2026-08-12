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
