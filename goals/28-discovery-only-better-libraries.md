/goal Work out why Discovery mostly returns Better Libraries and get Spektrix
(and the other seeded feeds) yielding events again — then write down what "the
list of websites I sent you" maps to now.

1. The sources are NOT hard-wired to Better Libraries. `ingest-activities/index.ts`
   loads enabled rows from the `discovery_sources` table and dispatches to
   adapters: `openactive`, `spektrix`, `better-libraries`, `rss`,
   `th-family-hubs`, `classforkids`, `llm-discovery`. Spektrix is seeded AND
   enabled with 7 venues (Albany, Unicorn, Greenwich, Woolwich Works, Blackheath
   Halls, Polka, Little Angel) — `supabase/migrations/008_discovery_platform.sql:367`.
2. Most likely causes, check in order:
   - **Wall-clock starvation.** `ingest-activities` runs `llm-discovery` FIRST
     with `LLM_SOURCE_BUDGET_MS = 150_000` against a `WALL_CLOCK_BUDGET_MS =
     128_000`; remaining feeds get recorded `skipped: 'wall-clock budget
     exhausted'`. Spektrix can be starved every run. Consider reordering, raising
     the wall-clock, or running the feeds before the LLM.
   - **Live `enabled` flags.** The table is authoritative; migrations only seed.
     Check the live `discovery_sources` (SUPABASE_ACCESS_TOKEN is available) for
     disabled rows and high `consecutive_failures` (Spektrix is flagged most
     legally exposed; Lewisham RSS is Cloudflare-sensitive).
   - **Adapter failures** returning zero quietly.
3. "The list of websites I sent you" is almost certainly the legacy 33-URL
   `prioritySources` array in `supabase/functions/discover-events/index.ts:370`
   (the Perplexity path), which the UI NO LONGER calls
   (`LondonEventsManager.jsx:391` now runs the open-feed ingest). Map each of
   those URLs to a live adapter/source, note which are covered (Spektrix covers
   Albany/Greenwich/Woolwich/Blackheath/Unicorn) and which have no feed, and tell
   Aster the gap.

Out of scope: writing brand-new adapters in this brief (log the gaps as
follow-ups), and retiring the legacy Perplexity function (handle separately).

Done when: the cause is written down with evidence (live source flags + a timed
ingest run showing which feeds ran vs skipped) AND after the fix a normal ingest
returns events from Spektrix and at least one non-library feed AND a short map of
the old URL list → current sources exists. Do not weaken a check to pass it. Stop
after 12 tries.
