-- Stop duplicate manually-entered events at the database, not in the UI.
--
-- WHY THIS EXISTS
--
-- `london_events_activity_date_uidx` (009:33-35) is the only unique index on
-- this table, and it is declared:
--
--     on london_events (activity_id, date) where activity_id is not null
--
-- so it constrains NOTHING for rows with `activity_id is null` — which is every
-- manually-added row, every public submit-modal submission and every
-- email-parsed row. There are two independent reasons for that, and fixing only
-- one of them would change nothing:
--
--   1. the partial predicate `where activity_id is not null` excludes them
--      outright; and
--   2. a B-tree unique index treats NULLs as distinct (it is not declared
--      `nulls not distinct`), so even dropping the WHERE clause would still let
--      unlimited `(null, '2026-09-01')` rows coexist.
--
-- Hence the rule this migration follows: ANY GUARD FOR THESE ROWS MUST KEY ON
-- SOMETHING OTHER THAN `activity_id`, and every column in that key must be
-- non-null so the unique index actually bites. That is why the normalised parts
-- below are wrapped in `coalesce(...)` rather than indexed raw.
--
-- There is also zero read-side deduplication anywhere — not in
-- useLondonEvents.js, WhatsOn.jsx, EventMap.jsx, resolveData.ts or the
-- newsletter renderer — so every duplicate row today renders as its own card,
-- its own map pin and its own newsletter bullet. The write side is the only
-- place this can be fixed once.
--
-- RUN ORDER: 020 FIRST, THEN THIS FILE.
-- A unique index cannot be created while duplicates already exist, so migration
-- 020 (diagnostics + dry-run cleanup) has to have been run and the duplicates
-- cleared before this migration will succeed. The pre-flight guard below exists
-- to say that in words instead of letting Postgres emit
-- "ERROR: could not create unique index ... Key ... is duplicated".

-- ---------------------------------------------------------------------------
-- PRE-FLIGHT GUARD — runs BEFORE any index is created.
--
-- WHY. Without this, an operator running 021 on a table that still holds
-- duplicates gets a cryptic index-build error naming one arbitrary offending
-- key, with no indication of how many problems remain or what to do next. This
-- block counts the duplicate groups under exactly the same key the indexes
-- below use, and fails with a message that names the numbers and the remedy.
--
-- The key is computed INLINE rather than read from migration 020's
-- `london_events_duplicate_groups` view, so this migration stands on its own and
-- still guards correctly if 020 was never applied or was later dropped.
-- ---------------------------------------------------------------------------
do $$
declare
  v_oneoff_groups     bigint;
  v_oneoff_excess     bigint;
  v_recurring_groups  bigint;
  v_recurring_excess  bigint;
  v_msg               text;
begin
  with manual as (
    -- Scope: manual / public-form / email-parsed rows only. Discovery-published
    -- rows (activity_id is not null) are deliberately out of scope — see the
    -- COVERAGE note at the foot of this file.
    select
      is_recurring,
      day_of_week,
      date,
      lower(trim(title))                                    as norm_title,
      coalesce(lower(trim(venue)), '')                      as norm_venue,
      coalesce(upper(replace(trim(postcode), ' ', '')), '') as norm_postcode
    from london_events
    where activity_id is null
  ),
  oneoff as (
    select count(*) as groups, coalesce(sum(n), 0) - count(*) as excess
    from (
      select count(*) as n
      from manual
      where not is_recurring
      group by norm_title, date, norm_venue, norm_postcode
      having count(*) > 1
    ) g
  ),
  recurring as (
    -- A recurring row's `date` is "next occurrence" and drifts week to week, so
    -- it cannot identify a recurring class. day_of_week replaces it.
    select count(*) as groups, coalesce(sum(n), 0) - count(*) as excess
    from (
      select count(*) as n
      from manual
      where is_recurring
      group by norm_title, coalesce(day_of_week, -1), norm_venue, norm_postcode
      having count(*) > 1
    ) g
  )
  select oneoff.groups, oneoff.excess, recurring.groups, recurring.excess
    into v_oneoff_groups, v_oneoff_excess, v_recurring_groups, v_recurring_excess
    from oneoff, recurring;

  if (v_oneoff_groups + v_recurring_groups) > 0 then
    v_msg := format(
      'london_events still contains %s duplicate group(s) under the manual-entry dedup key: '
      || '%s one-off (title + date + venue + postcode) and %s recurring '
      || '(title + day_of_week + venue + postcode). %s excess row(s) would have to be removed. '
      || 'The unique indexes in migration 021 cannot be created until these are resolved.',
      v_oneoff_groups + v_recurring_groups,
      v_oneoff_groups,
      v_recurring_groups,
      v_oneoff_excess + v_recurring_excess
    );

    raise exception '%', v_msg
      using hint =
        'Run migration 020 first, then, in order: '
        || '(1) select * from london_events_duplicate_groups; -- see every affected group. '
        || '(2) select * from dedupe_london_events(); -- DRY RUN by default, writes nothing, '
        || 'reports exactly what it would delete (same convention as supabase/functions/brevo-backfill). '
        || '(3) select * from dedupe_london_events(p_dry_run => false); -- DELETES the extra rows. '
        || 'This cannot be undone: there is no soft-delete column and no archive table. '
        || 'Then re-run this migration. The full runbook is at the foot of migration 020.';
  end if;

  raise notice
    'london_events dedup pre-flight passed: no duplicate groups among activity_id is null rows.';
end;
$$;

-- ---------------------------------------------------------------------------
-- THE GUARD ITSELF — two partial unique indexes.
--
-- Normalised parts, identical in both indexes, in migration 020's diagnostics
-- and in every application write path:
--
--     norm_title    = lower(trim(title))
--     norm_venue    = coalesce(lower(trim(venue)), '')
--     norm_postcode = coalesce(upper(replace(trim(postcode), ' ', '')), '')
--
-- `replace(..., ' ', '')` already strips the spaces that `trim` would have
-- removed, so the trim is technically redundant. It is kept anyway, because the
-- expression has to be character-for-character identical to the one the submit
-- modal, the admin form, the email parser and 020 use — a "tidy-up" that
-- changes one copy and not the others silently un-guards a write path.
--
-- IMMUTABILITY. Every function here — lower, trim/btrim, upper, replace,
-- coalesce — is marked IMMUTABLE in Postgres, which is a hard requirement:
-- a non-immutable expression cannot be indexed and the CREATE would be rejected.
-- Nothing volatile (now(), current_date, timezone conversion, ::text of a
-- timestamptz) appears in either key. `date` and `day_of_week` are indexed as
-- stored columns, not derived from the clock.
--
-- WHY TWO INDEXES. A recurring row's `date` column holds "next occurrence" and
-- is rewritten as the weeks roll forward, so date cannot identify a recurring
-- class; day_of_week can. One-offs have no day_of_week and are identified by
-- their actual date. The two populations are disjoint by `is_recurring`, which
-- is NOT NULL DEFAULT false (005:5), so the two predicates partition the manual
-- rows cleanly with no row falling through both or neither.
--
-- WHY VENUE AND POSTCODE ARE IN THE KEY. Two libraries can both legitimately
-- run "Rhyme Time" on the same Tuesday morning. A key of title + date alone
-- would reject the second one as a duplicate. A unique index that rejects
-- legitimate data is worse than no index at all, so the venue is part of the
-- identity.
-- ---------------------------------------------------------------------------

-- ONE-OFF manual rows: one event per (title, date, venue, postcode).
create unique index if not exists london_events_manual_oneoff_uidx
  on london_events (
    lower(trim(title)),
    date,
    coalesce(lower(trim(venue)), ''),
    coalesce(upper(replace(trim(postcode), ' ', '')), '')
  )
  where activity_id is null and not is_recurring;

-- RECURRING manual rows: one class per (title, weekday, venue, postcode).
-- day_of_week is nullable, and NULLs are distinct in a unique B-tree, so it is
-- coalesced to -1 (never a valid weekday; Postgres/JS use sunday = 0 .. 6).
create unique index if not exists london_events_manual_recurring_uidx
  on london_events (
    lower(trim(title)),
    coalesce(day_of_week, -1),
    coalesce(lower(trim(venue)), ''),
    coalesce(upper(replace(trim(postcode), ' ', '')), '')
  )
  where activity_id is null and is_recurring;

comment on index london_events_manual_oneoff_uidx is
  'Duplicate guard for one-off manually-added / publicly-submitted / email-parsed events. Key: lower(trim(title)), date, normalised venue, normalised postcode. Scope: activity_id is null and not is_recurring. Violations raise SQLSTATE 23505 and must be caught by the write path.';

comment on index london_events_manual_recurring_uidx is
  'Duplicate guard for recurring manually-added / publicly-submitted / email-parsed events. Key: lower(trim(title)), coalesce(day_of_week, -1), normalised venue, normalised postcode — date is excluded because it drifts to the next occurrence. Scope: activity_id is null and is_recurring. Violations raise SQLSTATE 23505 and must be caught by the write path.';

-- ---------------------------------------------------------------------------
-- COVERAGE — what these indexes DO and DO NOT protect. Read before assuming.
--
-- THEY COVER
--   Rows where `activity_id is null`: everything inserted by the public submit
--   modal, the admin manual-entry form and the email parser. An insert that
--   collides now raises SQLSTATE 23505 (unique_violation). Every one of those
--   three write paths must catch 23505 and say something a human understands —
--   "we already have this event listed" — never a raw Postgres error.
--
-- THEY DO NOT COVER
--   1. Discovery-published rows (`activity_id is not null`). Those remain
--      governed solely by `london_events_activity_date_uidx` (009:33) and are
--      deliberately left untouched. Adding a title/venue key across them could
--      make `publish_activity()` (009:76) fail when two feeds legitimately
--      describe the same class from different sources — which would break
--      ingest, a much worse outcome than a duplicate card. This boundary is a
--      considered choice, not an oversight.
--
--   2. The same event submitted under a different spelling. This is an
--      EXACT-MATCH guard on a normalised key, not fuzzy matching: "Rhyme Time"
--      and "Rhymetime", or "Baby Sensory" and "Baby Sensory (0-13m)", are
--      different keys and both will be accepted. If fuzzy matching is ever
--      wanted, the machinery already exists and is currently wired to nothing:
--      `activities.dedup_key` with its GiST trigram index (008:199-206) and
--      `discovery_is_novel()` (015:71-94), which today is called only by the
--      evaluation harness.
--
--   3. Rows that differ only in a field outside the key — a different `time`,
--      `price` or `description` on the same title/date/venue is still one
--      event by this definition and the second insert is rejected. That is
--      intended: those are edits, not new events.
--
-- RLS is intentionally unchanged here. The "Anyone can submit events" policy
-- (002:8-9) is `for insert with check (approved = false)`, so the anon key that
-- ships in the client bundle can still insert unapproved rows — these indexes
-- cap how many IDENTICAL rows it can create, which is the duplicate problem,
-- but they are not a rate limit and were never meant to be one.
-- ---------------------------------------------------------------------------

-- Verification — paste into the SQL editor after running. Expect exactly 2 rows.
--
-- select indexname, indexdef
-- from pg_indexes
-- where schemaname = 'public'
--   and tablename  = 'london_events'
--   and indexname in ('london_events_manual_oneoff_uidx',
--                     'london_events_manual_recurring_uidx')
-- order by indexname;
--
-- And confirm both are unique and valid (indisunique / indisvalid both true):
--
-- select c.relname as index_name, i.indisunique, i.indisvalid, pg_get_expr(i.indpred, i.indrelid) as predicate
-- from pg_index i
-- join pg_class c on c.oid = i.indexrelid
-- where i.indrelid = 'public.london_events'::regclass
--   and c.relname in ('london_events_manual_oneoff_uidx',
--                     'london_events_manual_recurring_uidx')
-- order by c.relname;
