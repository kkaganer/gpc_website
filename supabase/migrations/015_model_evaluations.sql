-- Model evaluation harness for LLM-based event discovery.
--
-- WHY EVALUATE BEFORE BUILDING
--
-- The research concluded that open-ended LLM search has a RECALL ceiling, not a
-- cost ceiling: successive calls return the same well-indexed venues, which is
-- precisely the subset the 9 open feeds already cover. So the question is not
-- "does it return events" — it will, plausibly and confidently — but "does it
-- return events we DON'T ALREADY HAVE, that are real, and that a parent could
-- actually turn up to."
--
-- That makes NOVELTY the metric, not volume. We already hold 622 activities, so
-- an event the model finds that duplicates one of those is worth nothing.
--
-- Scoring is fully automated against the existing corpus — no hand-labelling:
--   valid_postcode  postcodes.io resolves it, inside a served borough
--   valid_date      falls in the requested window
--   link_ok         deep link returns HTTP 200
--   under5          age inference says it admits an under-5
--   novel           no trigram match against an existing activity
--
-- The decision metric is cost_per_novel_valid — dollars per event that is real,
-- in-area, in-window AND new. A config that returns 30 events we already have
-- scores zero regardless of how good the events look.

create table if not exists model_evaluations (
  id                uuid primary key default gen_random_uuid(),
  run_label         text not null,
  model             text not null,
  prompt_variant    text not null,
  search_context    text,

  -- what came back
  returned          integer not null default 0,
  valid_postcode    integer not null default 0,
  valid_date        integer not null default 0,
  link_ok           integer not null default 0,
  under5            integer not null default 0,
  novel             integer not null default 0,
  novel_valid       integer not null default 0,

  -- economics
  input_tokens      integer,
  output_tokens     integer,
  search_calls      integer,
  cost_usd          numeric(10,5),
  cost_per_novel_valid numeric(10,5),

  elapsed_ms        integer,
  error             text,
  -- Every returned event with its per-gate verdict, so a bad score can be
  -- inspected rather than guessed at.
  results           jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists model_evaluations_run_idx
  on model_evaluations (run_label, created_at desc);

alter table model_evaluations enable row level security;

create policy "Authenticated can view evaluations" on model_evaluations
  for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Novelty check. Uses the same normalisation and trigram index as ingest
-- de-duplication, so "already have it" means the same thing in both places.
--
-- Returns true when nothing in `activities` looks like this event.
-- ---------------------------------------------------------------------------
create or replace function discovery_is_novel(
  p_title text,
  p_postcode text,
  p_threshold real default 0.55
)
returns boolean
language sql
stable
parallel safe
as $$
  select not exists (
    select 1
    from activities a
    where
      -- Same postcode is a strong signal; compare titles loosely.
      (
        discovery_norm_postcode(a.postcode) is not distinct from discovery_norm_postcode(p_postcode)
        and similarity(discovery_norm_text(a.title), discovery_norm_text(p_title)) > p_threshold
      )
      -- Or a very close title anywhere, to catch a venue we hold under a
      -- different postcode spelling.
      or similarity(discovery_norm_text(a.title), discovery_norm_text(p_title)) > 0.85
  )
$$;

grant execute on function discovery_is_novel(text, text, real) to authenticated;
revoke execute on function discovery_is_novel(text, text, real) from public, anon;
