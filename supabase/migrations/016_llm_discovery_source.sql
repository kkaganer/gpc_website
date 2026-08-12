-- Register LLM long-tail discovery as a source, so the single "Discover Events"
-- click runs it alongside the nine open feeds.
--
-- Configuration is the OUTPUT OF MEASUREMENT, not a guess. Five evaluation
-- rounds x four prompts plus a fan-out trial (recorded in `model_evaluations`):
--
--   baseline (generic "family events in SE London")   0.0 novel-valid / run
--   long_tail                                          1.8
--   under5_specific                                    0.8
--   search_harder (single call)                        4.4
--   area_scoped FAN-OUT across 6 areas                20.0   <- adopted
--
-- The generic prompt returned 7.6 plausible events per run of which ZERO passed
-- the under-5 gate — the exact defect this platform was built to fix, now
-- measured rather than argued.
--
-- areas_per_run = 2 because six area searches plus a verification pass alongside
-- the nine feeds would exceed the edge-function wall clock. The adapter stores
-- its rotation position in `cursor`, so three consecutive runs cover all six
-- areas and the cost is spread rather than spiked.

insert into discovery_sources (id, name, adapter, config, licence, attribution, enabled, notes) values
  ('llm-discovery',
   'LLM long-tail discovery (OpenAI)',
   'llm-discovery',
   '{"areas_per_run":2,"horizon_days":7,"area_policy":"london"}'::jsonb,
   null,
   null,
   true,
   'gpt-4.1-mini + web_search for discovery, gpt-5-nano to verify each page. ~$0.035/run at 2 areas. Targets ONLY the long tail (church halls, independent classes, pop-ups) that the institutional feeds structurally cannot reach.')
on conflict (id) do update
  set config = excluded.config,
      notes = excluded.notes,
      enabled = true;
