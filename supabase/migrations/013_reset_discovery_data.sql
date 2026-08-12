-- Clear all discovered data and start over.
--
-- Verified before writing this: `london_events` held 0 rows with a non-null
-- activity_id, i.e. NOTHING discovered had been published. All 256 rows there
-- are pre-existing (manually added, Perplexity-discovered, or from the March
-- newsletter seed) and are NOT touched by anything below.
--
-- The activity_id column is the safety boundary and every delete is guarded by
-- it. `activity_id is null` => created before this platform existed => leave
-- alone. There is no path here that can remove a row this platform did not
-- create.
--
-- Schema, adapters, functions and source registry all survive; only the
-- harvested data goes. Re-running ingest repopulates from scratch.

-- ---------------------------------------------------------------------------
-- reset_discovery() — reusable, so a future reset needs no migration.
-- ---------------------------------------------------------------------------
create or replace function reset_discovery()
returns table (published_removed integer, activities_removed integer, occurrences_removed integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_published   integer := 0;
  v_activities  integer := 0;
  v_occurrences integer := 0;
begin
  -- Only ever rows this platform published. Guarded, not filtered by convention.
  delete from london_events where activity_id is not null;
  get diagnostics v_published = row_count;

  select count(*) into v_occurrences from occurrences;

  -- occurrences cascade via activity_id fk, but delete explicitly so the count
  -- is truthful rather than inferred.
  delete from occurrences;
  delete from activities;
  get diagnostics v_activities = row_count;

  -- Null the RPDE cursors so the next run is a FULL resync rather than resuming
  -- mid-feed and silently harvesting only the tail.
  update discovery_sources
     set cursor = null,
         last_run_at = null,
         last_ok_at = null,
         consecutive_failures = 0;

  return query select v_published, v_activities, v_occurrences;
end;
$$;

revoke execute on function reset_discovery() from public, anon;
grant  execute on function reset_discovery() to authenticated;

-- Run it now.
do $$
declare r record;
begin
  select * into r from reset_discovery();
  raise notice 'reset_discovery: % published rows, % activities, % occurrences removed',
    r.published_removed, r.activities_removed, r.occurrences_removed;
end $$;

-- Keep the run history: it records what each source yielded and is the only
-- evidence of the adapters' behaviour over time. Clearing it would throw away
-- the ability to spot a source that has quietly stopped returning data.
