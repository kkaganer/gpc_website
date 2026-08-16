-- Cross-source duplicates in `london_events`: the same class listed twice,
-- once by discovery and once by a human.
--
-- WHAT 020 MISSED
--
-- 020 scoped every one of its objects to `activity_id is null` (020:135, :251)
-- and said so in its SCOPE header. That was the right call for the CONSTRAINT
-- in 021, and it is still the right call there — see "WHY NO INDEX" below. But
-- it also silently excluded the most likely real-world duplicate of all:
--
--   * discovery ingests a class from a feed (Bookwhen, ClassForKids,
--     OpenActive, a library timetable) and `publish_activity()` writes it into
--     london_events WITH an activity_id; and
--   * the organiser ALSO emails the same class to the inbox, and the parser
--     writes it into london_events with activity_id NULL.
--
-- Two rows, one class, and nothing anywhere notices: not the unique indexes
-- (partial, `activity_id is null`), not the parser's pre-insert check, not the
-- admin duplicate badge, and not 020's own diagnostics or cleanup — because
-- both rows have to be VISIBLE to the same query before they can be compared,
-- and 020 never looked at the discovery half.
--
-- Since nothing deduplicates on read anywhere — no DISTINCT, group-by or filter
-- in useLondonEvents.js, WhatsOn.jsx, EventMap.jsx, resolveData.ts or the
-- newsletter renderer — that pair is a second public card, a second map pin and
-- a second newsletter bullet. This migration widens the DETECTION and the
-- CLEANUP to see it.
--
-- TWO SCOPES, PREVIOUSLY CONFLATED
--
--   DETECTION (this file: the view, the cleanup's reporting) spans ALL rows
--   regardless of activity_id. Looking at a row carries no risk.
--
--   THE HARD CONSTRAINT (021's two partial unique indexes) STAYS NARROW,
--   `activity_id is null` only, and is not touched here.
--
-- WHY NO INDEX IS CREATED HERE
--
-- A unique index spanning discovery rows would make `publish_activity()`
-- (011:35) fail mid-ingest the first time two feeds legitimately describe one
-- class from different sources — a broken ingest run is a far worse outcome
-- than a duplicate listing, and it would fail on data that is NORMAL for that
-- pipeline rather than wrong. 021 is correct as it stands and this migration
-- creates no index and alters none.
--
-- THE RESURRECTION RULE — the reason the keep rule had to change
--
-- `publish_activity()` re-publishes from `activities` / `occurrences` on every
-- ingest run and upserts with `on conflict (activity_id, date) do update`
-- (011:93). A discovery-published row is therefore NOT DELETABLE in any
-- meaningful sense: delete it and the next ingest run puts it straight back.
--
-- So in any group holding BOTH a discovery row and a manual / public / email
-- row, THE DISCOVERY ROW IS ALWAYS THE KEEPER — ahead of approved-ness,
-- richness and age. Keeping the manual row and deleting the discovery one would
-- delete something that comes back within the hour, leaving the duplicate in
-- place and churning for ever.
--
-- (In practice the discovery row is usually approved and usually rich, so 020's
-- old ordering would often have picked it anyway. "Often" is not "always", and
-- the failure mode of getting it wrong is permanent churn rather than a wrong
-- row, so the rule is made explicit rather than left to a tie-break.)
--
-- THE DUPLICATE KEY — unchanged, identical to 020 and 021
--
--     norm_title    = lower(trim(title))
--     norm_venue    = coalesce(lower(trim(venue)), '')
--     norm_postcode = coalesce(upper(replace(trim(postcode), ' ', '')), '')
--
--     ONE-OFF    (not is_recurring):  (norm_title, date, norm_venue, norm_postcode)
--     RECURRING  (is_recurring):      (norm_title, coalesce(day_of_week, -1),
--                                      norm_venue, norm_postcode)
--
-- Widening the SCOPE and changing the KEY are different things. The key is not
-- touched: it has to stay character-for-character identical to 021's index
-- expressions and to the JS in the parser and the admin panel, or the layers
-- stop agreeing about what a duplicate is.
--
-- PREREQUISITE: 020 must have been applied — `london_event_richness()` lives
-- there and this file reuses it rather than restating the richness scoring.

-- ---------------------------------------------------------------------------
-- london_events_duplicate_groups — REPLACED
--
-- Same name, same key, same member_ids contract. The single change of substance
-- is that the `where e.activity_id is null` filter on the source scan is GONE,
-- so a discovery row and an emailed row describing one class now land in the
-- same group and the group becomes visible for the first time.
--
-- COLUMNS ARE APPENDED, NEVER REORDERED. `create or replace view` requires the
-- replacement to produce the existing columns with the same names, the same
-- types and in the same order; it may only ADD columns at the end. 020's ten
-- columns are therefore reproduced verbatim and in order —
--   kind, norm_title, key_date, key_day_of_week, norm_venue, norm_postcode,
--   group_size, member_ids, first_created_at, has_approved
-- — and the new ones follow. That keeps `create or replace` viable, which
-- matters: a `drop view` would silently revoke the grants below and drop the
-- security_invoker setting with them.
--
-- NEW COLUMNS
--   discovery_count  rows in the group with activity_id not null
--   manual_count     rows in the group with activity_id null
--   composition      'manual' | 'mixed' | 'discovery' — the shape of the group,
--                    which is what decides whether anything is actionable
--   removable_ids    the ids the cleanup would actually delete. See below.
--
-- WHY removable_ids IS IN THE VIEW AND NOT IN THE FUNCTION. 020 put the keep
-- ordering in member_ids precisely so the cleanup would have no second copy of
-- that logic to get wrong. The same argument applies with more force now that
-- "everything after the survivor" is no longer the answer: in a mixed group of
-- two discovery rows and one manual row, member_ids[2:] names a discovery row
-- that must NOT be deleted. Computing the deletable set once, here, means the
-- dry run and the real run cannot disagree about it.
--
-- member_ids IS STILL ORDERED BY THE KEEP RULE and member_ids[1] is still the
-- survivor — the rule simply gained a new first term, `is_discovery desc`.
-- ---------------------------------------------------------------------------
create or replace view london_events_duplicate_groups as
with keyed as (
  select
    e.id,
    e.created_at,
    coalesce(e.approved, false)                             as approved,
    -- The resurrection rule's sort key. A discovery row is one publish_activity
    -- owns and re-creates; nothing outside that pipeline can remove it.
    (e.activity_id is not null)                             as is_discovery,
    london_event_richness(e)                                as richness,
    (case when e.is_recurring then 'recurring' else 'one-off' end)::text as kind,
    lower(trim(e.title))                                    as norm_title,
    -- A recurring row's date is just its next occurrence and moves every week,
    -- so it is keyed on the weekday instead. -1 is the sentinel for "recurring
    -- but no weekday recorded", which groups those rows with each other rather
    -- than making each one unique.
    case when e.is_recurring then null::date else e.date end as key_date,
    case when e.is_recurring
         then coalesce(e.day_of_week, -1)::smallint
         else null::smallint end                            as key_day_of_week,
    coalesce(lower(trim(e.venue)), '')                      as norm_venue,
    coalesce(upper(replace(trim(e.postcode), ' ', '')), '') as norm_postcode
  from london_events e
  -- NO activity_id FILTER. This one missing line is the whole migration; every
  -- object below only inherits what this scan can see.
),
grouped as (
  select
    k.kind,
    k.norm_title,
    k.key_date,
    k.key_day_of_week,
    k.norm_venue,
    k.norm_postcode,
    count(*)                                                as group_size,
    -- Keep rule, in order. `is_discovery desc` is new and comes FIRST: a
    -- discovery row outranks everything because deleting it is futile, not
    -- because it is better. Nulls sort last under `asc`, so a row with no
    -- created_at cannot pass itself off as the oldest. The final `k.id` makes
    -- the ordering total, so repeated calls always name the same survivor.
    array_agg(k.id order by k.is_discovery desc,
                            k.approved     desc,
                            k.richness     desc,
                            k.created_at   asc,
                            k.id           asc)             as member_ids,
    min(k.created_at)                                       as first_created_at,
    bool_or(k.approved)                                     as has_approved,
    count(*) filter (where k.is_discovery)                  as discovery_count,
    count(*) filter (where not k.is_discovery)              as manual_count,
    -- The manual members alone, in keep order. Everything the cleanup is
    -- allowed to consider deleting is in here and nothing else ever is.
    coalesce(
      array_agg(k.id order by k.is_discovery desc,
                              k.approved     desc,
                              k.richness     desc,
                              k.created_at   asc,
                              k.id           asc)
        filter (where not k.is_discovery),
      '{}'::uuid[]
    )                                                       as manual_ids
  from keyed k
  group by k.kind, k.norm_title, k.key_date, k.key_day_of_week,
           k.norm_venue, k.norm_postcode
  having count(*) > 1
)
select
  g.kind,
  g.norm_title,
  g.key_date,
  g.key_day_of_week,
  g.norm_venue,
  g.norm_postcode,
  g.group_size,
  g.member_ids,
  g.first_created_at,
  g.has_approved,
  -- ---- appended in 022 ----
  g.discovery_count,
  g.manual_count,
  (case when g.manual_count    = 0 then 'discovery'
        when g.discovery_count = 0 then 'manual'
        else                            'mixed' end)::text  as composition,
  -- What the cleanup may delete, derived once:
  --   manual      — the survivor is manual_ids[1], so drop the head.
  --   mixed       — the survivor is a discovery row, so EVERY manual row goes.
  --   discovery   — manual_ids is empty, so nothing goes. publish_activity
  --                 owns those rows; this migration only reports them.
  (case when g.discovery_count = 0 then g.manual_ids[2:]
        else                            g.manual_ids end)   as removable_ids
from grouped g
order by g.group_size desc, g.norm_title;

comment on view london_events_duplicate_groups is
  'Groups of 2+ london_events rows sharing the duplicate key, across ALL rows including discovery-published ones (022 widened this from 020''s activity_id is null scope). member_ids is ordered by the keep rule — [1] is the survivor, and a discovery row always sorts first because publish_activity re-creates it. removable_ids is the deletable subset: always manual rows only, and empty for a discovery-only group.';

-- Re-asserted rather than assumed. `create or replace view` does carry the
-- existing ACL and reloptions forward, but this file must also be correct when
-- it is the statement that CREATES the view (a fresh database, or 020 applied
-- and the view since dropped by hand). A view does not enforce the underlying
-- table's RLS by default (see 018), and this one exposes unapproved
-- submissions. Run it as the caller.
alter view london_events_duplicate_groups set (security_invoker = on);
revoke select on london_events_duplicate_groups from anon;
grant  select on london_events_duplicate_groups to authenticated;

-- ---------------------------------------------------------------------------
-- dedupe_london_events(p_dry_run) — REPLACED
--
-- Same name, same argument, same dry-run-by-default guarantee. What changed:
--
--   1. IT NOW SEES MIXED GROUPS. The view it reads no longer hides the
--      discovery half of a cross-source duplicate.
--   2. THE RESURRECTION RULE. In a mixed group the discovery row is the
--      keeper, ahead of approved / richest / oldest. Deleting it would achieve
--      nothing: publish_activity re-creates it on the next ingest run.
--   3. IT CAN NEVER DELETE A DISCOVERY ROW, in any group, under any
--      circumstances — see SAFETY.
--   4. A `composition` column on the return, appended after 020's columns, so
--      the operator can tell at a glance which groups were cross-source.
--
-- KEEP RULE, in order, and why:
--
--   0. A DISCOVERY ROW (activity_id not null) BEATS EVERYTHING. Not because it
--      is better, but because it is not removable: publish_activity upserts it
--      back on (activity_id, date) every run. Ranking it below an approved or
--      richer manual row would delete the wrong half of the pair, and the
--      duplicate would reappear unchanged.
--   1. Then APPROVED beats unapproved. Someone has already looked at that row
--      and said yes; throwing away the vetted copy in favour of an unreviewed
--      one would silently un-approve a live listing.
--   2. Then the RICHEST record (london_event_richness, 020). Duplicates are
--      usually the same event submitted twice with different amounts of care;
--      the fuller row is the one the site should render.
--   3. Then the OLDEST created_at — the original submission, and the row most
--      likely to be referenced elsewhere.
--   4. Then the lowest id, purely so the ordering is total and the choice is
--      reproducible rather than dependent on scan order.
--
-- Terms 1-4 are 020's rule, unchanged, and they are the ONLY terms that apply
-- inside a manual-only group. Term 0 exists solely to resolve mixed groups.
--
-- SAFETY:
--   * p_dry_run defaults to TRUE. The bare call `select * from
--     dedupe_london_events();` performs no writes at all — the dry-run branch
--     contains no DELETE to accidentally fire.
--   * NEVER deletes a row with activity_id not null. Two independent
--     mechanisms, either of which alone would be sufficient:
--       (a) the view's removable_ids only ever contains manual rows; and
--       (b) `and e.activity_id is null` is written on the DELETE itself.
--     (b) is not decoration. This is the one irreversible statement in the
--     file, and it must stay correct even if the view is later edited by
--     someone who has not read this comment.
--   * A discovery-only group is reported with removed_count = 0 and an empty
--     removed_ids. Those rows belong to publish_activity and duplicates among
--     them are a normal state for that pipeline, not a bug to clean up here.
--   * Can never delete a lone row: the view only emits groups of 2+, and the
--     survivor is excluded from removable_ids by construction.
--
-- WHY THE DROP. `create or replace function` cannot change a function's return
-- type, and adding `composition` to the RETURNS TABLE does exactly that — the
-- replace would fail with "cannot change return type of existing function".
-- So the old signature is dropped first. The consequence is that the grants
-- below are NOT optional: a dropped-and-recreated function is a new object,
-- and PostgreSQL grants EXECUTE on a new function to PUBLIC, which `anon`
-- inherits. Without the revoke, 010's lockdown would be quietly undone by this
-- migration and a DELETE-capable function would be reachable with the anon key
-- that ships in the client bundle.
--
-- STILL NOT SECURITY DEFINER, deliberately, and the argument is stronger than
-- it was in 020. 010 was written because SECURITY DEFINER functions here
-- bypassed RLS and ended up reachable by anon. This function needs no
-- elevation — `authenticated` already holds full select/delete on
-- london_events through RLS — so running as the caller means it can never
-- delete anything the caller could not have deleted directly. Now that its
-- reach has been widened to see discovery rows, definer rights would also mean
-- a bug in the delete predicate could reach rows RLS would otherwise have
-- protected. Invoker rights keep that second failure mode closed too.
-- ---------------------------------------------------------------------------
drop function if exists dedupe_london_events(boolean);

create or replace function dedupe_london_events(p_dry_run boolean default true)
returns table (
  kind            text,
  norm_title      text,
  key_date        date,
  key_day_of_week smallint,
  norm_venue      text,
  norm_postcode   text,
  kept_id         uuid,
  removed_ids     uuid[],
  removed_count   integer,
  composition     text
)
language plpgsql
set search_path = public
as $$
begin
  if p_dry_run then
    -- Report only. No DELETE exists on this path.
    return query
      select g.kind, g.norm_title, g.key_date, g.key_day_of_week,
             g.norm_venue, g.norm_postcode,
             g.member_ids[1],
             g.removable_ids,
             coalesce(cardinality(g.removable_ids), 0)::integer,
             g.composition
        from london_events_duplicate_groups g;
  else
    return query
      with cleanup as (
        select g.kind                          as kind,
               g.norm_title                    as norm_title,
               g.key_date                      as key_date,
               g.key_day_of_week               as key_day_of_week,
               g.norm_venue                    as norm_venue,
               g.norm_postcode                 as norm_postcode,
               g.member_ids[1]                 as kept_id,
               g.removable_ids                 as removed_ids,
               coalesce(cardinality(g.removable_ids), 0)::integer
                                               as removed_count,
               g.composition                   as composition
          from london_events_duplicate_groups g
      ),
      -- This DELETE runs even though the final SELECT never reads it: Postgres
      -- executes every data-modifying CTE exactly once and to completion,
      -- referenced or not. Both arms see the same statement snapshot, so
      -- `cleanup` still reports the groups as they stood before the delete —
      -- which is what makes the returned rows a usable record of what went.
      deleted as (
        delete from london_events e
         using cleanup c
         where e.id = any(c.removed_ids)
           -- THE RESURRECTION GUARD. removable_ids already excludes discovery
           -- rows, so on today's view this predicate removes nothing extra —
           -- that is the point. It is the last line of defence for the only
           -- irreversible statement in this file, and it must survive any
           -- future edit to the view above.
           and e.activity_id is null
        returning e.id
      )
      select c.kind, c.norm_title, c.key_date, c.key_day_of_week,
             c.norm_venue, c.norm_postcode,
             c.kept_id, c.removed_ids, c.removed_count, c.composition
        from cleanup c;
  end if;
end;
$$;

comment on function dedupe_london_events(boolean) is
  'Collapses duplicate london_events rows across ALL sources, including cross-source pairs where discovery published one copy and the email parser or a human added another (022 widened this from 020''s activity_id is null scope). In a mixed group the discovery row is ALWAYS kept, ahead of approved > richest > oldest, because publish_activity re-creates it on every ingest run. NEVER deletes a row with activity_id not null. p_dry_run defaults to true and writes nothing; p_dry_run => false DELETES the losing manual rows and cannot be undone.';

-- Mandatory, not idempotent housekeeping: the function above was dropped and
-- recreated, so it carries PostgreSQL's default EXECUTE grant to PUBLIC, which
-- `anon` inherits. See 010.
revoke execute on function dedupe_london_events(boolean) from public, anon;
grant  execute on function dedupe_london_events(boolean) to authenticated;

-- No index is created here, and none of 021's are altered. The reason is in the
-- header: a unique key spanning discovery rows could make publish_activity()
-- fail mid-ingest on data that is legitimate for that pipeline.

-- ---------------------------------------------------------------------------
-- COVERAGE — what this DOES and DOES NOT catch. Read before assuming.
--
-- IT CATCHES
--   A discovery-published row and a manual / public-form / email-parsed row
--   that share the one-off key (title, date, venue, postcode) after
--   normalisation. That is the common cross-source case: publish_activity
--   writes `is_recurring = false` on every row it creates (011:82), even for a
--   weekly class, because recurring rows are filtered out of What's On — so
--   discovery rows always land on the ONE-OFF key, and a manual row for the
--   same session on the same date meets them there.
--
-- IT DOES NOT CATCH
--   1. A RECURRING manual row paired with its discovery equivalent. The manual
--      row is keyed on (title, day_of_week, venue, postcode) and the discovery
--      rows are keyed on (title, date, venue, postcode), so they are never in
--      the same group however similar they look. Catching that would mean
--      matching one row against a SET of dated rows — a different shape of
--      query, not a widened scope, and out of scope here.
--   2. The same event under a different spelling. This is exact matching on a
--      normalised key, not fuzzy matching, exactly as in 021: "Rhyme Time" and
--      "Rhymetime" remain two events. The trigram machinery for that already
--      exists and is wired to nothing (activities.dedup_key, 008:199-206;
--      discovery_is_novel(), 015:71-94).
--   3. Duplicates WITHIN the discovery set. Reported as composition =
--      'discovery' so they are at least visible, but deliberately never acted
--      on — two feeds describing one class is normal for that pipeline, and
--      the fix belongs upstream in activity matching, not in a delete here.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- RUNBOOK — paste into the Supabase SQL editor, in this order.
--
-- READ THIS FIRST — A FEED LISTING IS NEVER DELETED.
--   Rows with activity_id not null are published by publish_activity() from
--   `activities` / `occurrences`, and it upserts them back on every ingest run.
--   This function will not delete one, and DELETING ONE BY HAND DOES NOT STICK
--   — the next run recreates it, the duplicate returns, and nothing has been
--   fixed. When a feed listing is genuinely wrong, fix or unpublish it at the
--   source: the `activities` row it came from.
--
-- STEP 1 — See what is duplicated, and of what kind. Read-only.
--
--   select kind, composition, norm_title, key_date, key_day_of_week,
--          norm_venue, norm_postcode, group_size, discovery_count, manual_count,
--          member_ids, removable_ids, first_created_at, has_approved
--   from london_events_duplicate_groups
--   order by composition, group_size desc;
--
--   composition tells you what you are looking at:
--     'manual'    — two human/email rows. 020's case; fully cleanable.
--     'mixed'     — a feed listing AND a human/email row for one class. The
--                   feed listing is kept; the human rows are the removals.
--     'discovery' — feed listings only. REPORTED, NEVER CLEANED. Nothing below
--                   will touch these; fix them upstream in `activities`.
--
--   No rows at all means the table is clean; there is nothing to do.
--
-- STEP 2 — Dry run. Shows which row survives each group and which ids would go.
--          Writes NOTHING; p_dry_run defaults to true, so the bare call is
--          always the safe one.
--
--   select * from dedupe_london_events();
--
--   Expect removed_count = 0 on every composition = 'discovery' row. If one is
--   ever non-zero, STOP and do not run step 3 — the guard has been broken.
--
--   Spot-check a group before going further — paste one member_ids array in.
--   activity_id is in the list on purpose: it is what tells you which row of
--   the pair is the feed listing.
--
--   select id, activity_id, title, date, venue, postcode, approved, created_at,
--          description, url, image_url, lat, lng, age_range, price
--   from london_events
--   where id = any('{...paste member_ids here...}'::uuid[])
--   order by activity_id nulls last, created_at;
--
-- STEP 3 — The real thing.
--
--   ***********************************************************************
--   *  THIS DELETES ROWS FROM london_events. IT CANNOT BE UNDONE.         *
--   *  There is no soft-delete column and no archive table — the rows are *
--   *  gone. Take a database backup first if you want a way back.         *
--   *  Only activity_id-null rows are ever deleted; feed listings are not.*
--   ***********************************************************************
--
--   select * from dedupe_london_events(p_dry_run => false);
--
--   Save that output. One row per group, naming the kept id and the removed
--   ids, and it is the only record of what was deleted.
--
-- STEP 4 — Confirm. Manual and mixed groups should be gone; discovery-only
--          groups will remain and that is expected and correct.
--
--   select composition, count(*) as remaining_groups
--   from london_events_duplicate_groups
--   group by composition
--   order by composition;
--   -- expect no 'manual' and no 'mixed' rows; any 'discovery' rows are fine
--
--   021's unique indexes keep the 'manual' case from coming back. Nothing
--   prevents a NEW 'mixed' pair — no constraint can, without risking ingest —
--   so this runbook is worth re-running after a large ingest or a busy month
--   of inbox submissions.
-- ---------------------------------------------------------------------------

-- Verification — paste into the SQL editor after running. Group counts by
-- composition, with the rows and the deletable rows behind each.
--
-- select composition,
--        count(*)                                        as groups,
--        sum(group_size)                                 as rows_in_groups,
--        sum(discovery_count)                            as discovery_rows,
--        sum(manual_count)                               as manual_rows,
--        sum(coalesce(cardinality(removable_ids), 0))    as deletable_rows
-- from london_events_duplicate_groups
-- group by composition
-- order by composition;
--
-- Sanity check on the guard — must return 0 rows, always. Any row here means a
-- discovery row is listed as deletable, which the DELETE predicate would still
-- refuse but which would mean the view has been broken.
--
-- select g.composition, g.norm_title, e.id, e.activity_id
-- from london_events_duplicate_groups g
-- join london_events e on e.id = any(g.removable_ids)
-- where e.activity_id is not null;
