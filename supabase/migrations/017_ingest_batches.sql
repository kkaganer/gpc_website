-- Fire-and-poll ingest.
--
-- WHY. The Discover Events button held an HTTP request open for the whole run.
-- Supabase enforces a 150s REQUEST IDLE TIMEOUT on every plan — this is not a
-- free-tier limit and is not lifted by upgrading (only the worker wall clock
-- goes 150s -> 400s on paid). A 156s run therefore returned a 504 with no
-- results and no ingest_runs rows closed, losing the whole run's work.
--
-- The fix is to stop making the caller wait: create a batch, return its id
-- immediately, and do the work in the background. The admin page polls the
-- batch. Nothing is blocked on an HTTP response, so the idle timeout is
-- irrelevant.

create table if not exists ingest_batches (
  id           uuid primary key default gen_random_uuid(),
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  requested    text[],
  total_sources integer,
  status       text not null default 'running'
                 check (status in ('running','complete','failed')),
  error        text
);

alter table ingest_runs
  add column if not exists batch_id uuid references ingest_batches(id) on delete cascade;

create index if not exists ingest_runs_batch_idx on ingest_runs (batch_id);

alter table ingest_batches enable row level security;
create policy "Authenticated can view ingest batches" on ingest_batches
  for select to authenticated using (true);

-- Everything the polling UI needs in one row, so progress is a single cheap
-- query rather than a join the client has to assemble.
create or replace view ingest_batch_status as
select
  b.id,
  b.status,
  b.started_at,
  b.finished_at,
  b.total_sources,
  b.error,
  count(r.id)                                              as sources_started,
  count(r.id) filter (where r.finished_at is not null)     as sources_finished,
  count(r.id) filter (where r.ok is false)                 as sources_failed,
  coalesce(sum(r.inserted), 0)                             as inserted,
  coalesce(sum(r.updated), 0)                              as updated,
  coalesce(sum(r.occurrences_written), 0)                  as occurrences_written,
  coalesce(
    jsonb_agg(
      jsonb_build_object(
        'source', r.source_id, 'ok', r.ok, 'inserted', r.inserted,
        'occurrences', r.occurrences_written, 'error', r.error,
        'finished', r.finished_at is not null
      ) order by r.started_at
    ) filter (where r.id is not null),
    '[]'::jsonb
  )                                                        as sources
from ingest_batches b
left join ingest_runs r on r.batch_id = b.id
group by b.id;

grant select on ingest_batch_status to authenticated;
