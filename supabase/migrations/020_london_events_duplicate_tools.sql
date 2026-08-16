-- Duplicate rows in `london_events`: find them, and clean them up.
--
-- WHY NOTHING STOPS DUPLICATES TODAY
--
-- `london_events_activity_date_uidx` (009) is the only unique index on this
-- table anywhere in the codebase, and it is declared
--     on london_events (activity_id, date) where activity_id is not null
-- so it constrains NOTHING for rows where activity_id is null — which is every
-- manually-added row, every public submit-modal submission and every
-- email-parsed row. Two independent reasons, and fixing either one alone
-- changes nothing: the partial predicate excludes those rows outright, AND a
-- b-tree unique index treats NULLs as distinct (it is not `nulls not
-- distinct`), so dropping the WHERE clause would still let unlimited
-- activity_id-null duplicates through. Any real guard has to key on something
-- other than activity_id.
--
-- There is no read-side deduplication either — no DISTINCT, group-by or filter
-- in the What's On query, the map, or the newsletter renderer. So every
-- duplicate row renders as its own card, its own map pin and its own
-- newsletter bullet. The duplicates are visible to the public.
--
-- WHY THIS MIGRATION CREATES NO CONSTRAINT
--
-- A unique index cannot be created while the rows it forbids are already in the
-- table; the CREATE simply fails. So the work ships as two migrations run in
-- sequence with a cleanup in between:
--
--   020 (this file) — diagnostics + a DRY-RUN-BY-DEFAULT cleanup. Creates no
--                     constraint, writes nothing unless explicitly told to, and
--                     is safe to run against the live table at any time.
--   021             — the unique indexes themselves, once the table is clean.
--
-- The runbook at the foot of this file is the order the admin runs them in.
-- The dry-run default follows the precedent already set by the brevo-backfill
-- edge function: the bare call never writes.
--
-- SCOPE: `activity_id is null` ROWS ONLY
--
-- Discovery-published rows are deliberately untouched. They already have a
-- unique index that works for them, publish_activity() depends on that exact
-- index shape for its ON CONFLICT clause, and two feeds legitimately describing
-- the same class is a normal state for that pipeline rather than a bug.
-- Widening the blast radius to those rows could break ingest and fixes nothing.
--
-- THE DUPLICATE KEY
--
-- Normalised parts, used identically here and in 021:
--     norm_title    = lower(trim(title))
--     norm_venue    = coalesce(lower(trim(venue)), '')
--     norm_postcode = coalesce(upper(replace(trim(postcode), ' ', '')), '')
--
-- Two keys, because a recurring row's `date` is "next occurrence" and drifts
-- week to week, so a date cannot identify a recurring class:
--     ONE-OFF    (not is_recurring):  (norm_title, date, norm_venue, norm_postcode)
--     RECURRING  (is_recurring):      (norm_title, coalesce(day_of_week, -1),
--                                      norm_venue, norm_postcode)
--
-- Venue and postcode are IN the key on purpose. Two libraries can both
-- legitimately run "Rhyme Time" on the same Tuesday morning, and a key of
-- title + date alone would call the second one a duplicate and delete it. A
-- rule that rejects legitimate data is worse than no rule.

-- ---------------------------------------------------------------------------
-- How much information a row actually carries.
--
-- When two rows describe the same event, the one with a description, a booking
-- link, an image and coordinates is the one worth keeping — those columns are
-- what the card, the map pin and the newsletter bullet are rendered from.
-- Counting them turns "the richest record" into a number the keep rule can
-- sort on instead of a judgement call.
--
-- Blank strings count as missing. A row whose description is '' tells the
-- reader nothing, and scoring it as populated would let an empty submission
-- outrank a real one.
-- ---------------------------------------------------------------------------
create or replace function london_event_richness(e london_events)
returns integer
language sql
immutable
parallel safe
as $$
  select (nullif(trim(e.description), '') is not null)::int
       + (nullif(trim(e.url),         '') is not null)::int
       + (nullif(trim(e.image_url),   '') is not null)::int
       + (e.lat is not null)::int
       + (e.lng is not null)::int
       + (nullif(trim(e.postcode),    '') is not null)::int
       + (nullif(trim(e.venue),       '') is not null)::int
       + (nullif(trim(e.age_range),   '') is not null)::int
       + (nullif(trim(e.price),       '') is not null)::int
$$;

comment on function london_event_richness(london_events) is
  'Count of populated informative columns (description, url, image_url, lat, lng, postcode, venue, age_range, price). Blank strings count as missing. Used as the richest-record tie-break in dedupe_london_events().';

-- ---------------------------------------------------------------------------
-- london_events_duplicate_groups
--
-- One row per group of 2+ rows sharing the duplicate key. Read-only, and safe
-- to select at any time.
--
-- ONE PASS, NOT A UNION OF TWO SHAPES. Both keys are computed in a single
-- `keyed` CTE and grouped once: key_date is null for every recurring row and
-- key_day_of_week is null for every one-off row, so GROUP BY can never mix the
-- two kinds even before `kind` itself discriminates them. The result is
-- identical to a UNION of the two shapes, but the normalisation is written
-- once, which is what stops the one-off and recurring definitions silently
-- drifting apart later.
--
-- member_ids IS ORDERED BY THE KEEP RULE. member_ids[1] is the row
-- dedupe_london_events() would keep and member_ids[2:] is what it would delete,
-- so the view alone answers "what would the cleanup do?" and the function has
-- no second copy of that logic to get wrong.
-- ---------------------------------------------------------------------------
create or replace view london_events_duplicate_groups as
with keyed as (
  select
    e.id,
    e.created_at,
    coalesce(e.approved, false)                             as approved,
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
  where e.activity_id is null
)
select
  k.kind,
  k.norm_title,
  k.key_date,
  k.key_day_of_week,
  k.norm_venue,
  k.norm_postcode,
  count(*)                                                  as group_size,
  -- Keep rule, in order. Nulls sort last under `asc`, so a row with no
  -- created_at cannot pass itself off as the oldest. The final `k.id` makes the
  -- ordering total, so repeated calls always name the same survivor.
  array_agg(k.id order by k.approved  desc,
                          k.richness  desc,
                          k.created_at asc,
                          k.id         asc)                 as member_ids,
  min(k.created_at)                                         as first_created_at,
  bool_or(k.approved)                                       as has_approved
from keyed k
group by k.kind, k.norm_title, k.key_date, k.key_day_of_week,
         k.norm_venue, k.norm_postcode
having count(*) > 1
order by count(*) desc, k.norm_title;

comment on view london_events_duplicate_groups is
  'Groups of 2+ london_events rows sharing the duplicate key, for activity_id is null rows only. member_ids is ordered by the dedupe keep rule: [1] is the survivor, [2:] are the removals.';

-- A view does not enforce the underlying table's RLS by default (see 018), and
-- this one exposes unapproved submissions. Run it as the caller.
alter view london_events_duplicate_groups set (security_invoker = on);
revoke select on london_events_duplicate_groups from anon;
grant  select on london_events_duplicate_groups to authenticated;

-- ---------------------------------------------------------------------------
-- dedupe_london_events(p_dry_run)
--
-- Reports what it did — or, with the default p_dry_run = true, what it WOULD
-- do — one row per duplicate group: the kind, the key, the id it kept, the ids
-- it removed, and how many.
--
-- KEEP RULE, in order, and why:
--
--   1. APPROVED beats unapproved. Someone has already looked at that row and
--      said yes; throwing away the vetted copy in favour of an unreviewed one
--      would silently un-approve a live listing.
--   2. Then the RICHEST record (london_event_richness above). Duplicates are
--      usually the same event submitted twice with different amounts of care;
--      the fuller row is the one the site should render.
--   3. Then the OLDEST created_at — the original submission, and the row most
--      likely to be referenced elsewhere.
--   4. Then the lowest id, purely so the ordering is total and the choice is
--      reproducible rather than dependent on scan order.
--
-- SAFETY:
--   * p_dry_run defaults to TRUE. The bare call `select * from
--     dedupe_london_events();` performs no writes at all — the dry-run branch
--     contains no DELETE to accidentally fire.
--   * Only ever touches `activity_id is null` rows.
--   * Can never delete a lone row: the view only emits groups of 2+, and the
--     survivor is member_ids[1], so member_ids[2:] is empty for a group of one.
--
-- NOT security definer, deliberately. 010 was written because SECURITY DEFINER
-- functions here bypassed RLS and ended up reachable by anon. This function
-- needs no elevation — `authenticated` already holds full select/delete on
-- london_events through RLS — so running as the caller means it can never
-- delete anything the caller could not have deleted directly.
-- ---------------------------------------------------------------------------
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
  removed_count   integer
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
             g.member_ids[2:],
             (g.group_size - 1)::integer
        from london_events_duplicate_groups g;
  else
    return query
      with cleanup as (
        select g.kind                       as kind,
               g.norm_title                 as norm_title,
               g.key_date                   as key_date,
               g.key_day_of_week            as key_day_of_week,
               g.norm_venue                 as norm_venue,
               g.norm_postcode              as norm_postcode,
               g.member_ids[1]              as kept_id,
               g.member_ids[2:]             as removed_ids,
               (g.group_size - 1)::integer  as removed_count
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
           and e.activity_id is null   -- belt and braces; the view filters too
        returning e.id
      )
      select c.kind, c.norm_title, c.key_date, c.key_day_of_week,
             c.norm_venue, c.norm_postcode,
             c.kept_id, c.removed_ids, c.removed_count
        from cleanup c;
  end if;
end;
$$;

comment on function dedupe_london_events(boolean) is
  'Collapses duplicate london_events rows (activity_id is null only). Keeps approved > richest > oldest. p_dry_run defaults to true and writes nothing; p_dry_run => false DELETES the losing rows and cannot be undone.';

-- Grants follow 010: PostgreSQL grants EXECUTE on a new function to PUBLIC by
-- default, and `anon` inherits from PUBLIC, so the grant to `authenticated`
-- only means something once PUBLIC has been revoked.
revoke execute on function dedupe_london_events(boolean)        from public, anon;
grant  execute on function dedupe_london_events(boolean)        to authenticated;

revoke execute on function london_event_richness(london_events) from public, anon;
grant  execute on function london_event_richness(london_events) to authenticated;

-- No supporting index is created here on purpose. The normalised key gets its
-- indexes in 021, and adding a throwaway one now would only be dropped again.

-- ---------------------------------------------------------------------------
-- RUNBOOK — paste into the Supabase SQL editor, in this order.
--
-- STEP 1 — See what is actually duplicated. Read-only.
--
--   select kind, norm_title, key_date, key_day_of_week, norm_venue,
--          norm_postcode, group_size, member_ids, first_created_at, has_approved
--   from london_events_duplicate_groups;
--
--   No rows means the table is already clean: skip to step 4.
--
-- STEP 2 — Dry run. Shows which row survives each group and which ids would go.
--          Writes NOTHING; p_dry_run defaults to true, so the bare call is
--          always the safe one.
--
--   select * from dedupe_london_events();
--
--   Spot-check a group before going further — paste one member_ids array in:
--
--   select id, title, date, venue, postcode, approved, created_at,
--          description, url, image_url, lat, lng, age_range, price
--   from london_events
--   where id = any('{...paste member_ids here...}'::uuid[])
--   order by created_at;
--
-- STEP 3 — The real thing.
--
--   ***********************************************************************
--   *  THIS DELETES ROWS FROM london_events. IT CANNOT BE UNDONE.         *
--   *  There is no soft-delete column and no archive table — the rows are *
--   *  gone. Take a database backup first if you want a way back.         *
--   ***********************************************************************
--
--   select * from dedupe_london_events(p_dry_run => false);
--
--   Save that output. One row per group cleaned, naming the kept id and the
--   removed ids, and it is the only record of what was deleted.
--
-- STEP 4 — Confirm the table is clean, then run 021 to add the unique indexes
--          that stop the duplicates coming back. 021 will refuse to run while
--          this count is above zero.
--
--   select count(*) as remaining_groups from london_events_duplicate_groups;
--   -- expect 0
-- ---------------------------------------------------------------------------
