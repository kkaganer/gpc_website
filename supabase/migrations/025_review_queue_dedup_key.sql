-- Surface the de-duplication key in the review queue.
--
-- WHY. This is the THIRD migration to recreate `activity_review_queue` because a
-- column the UI needed was missing from the view's explicit list — 009 created
-- it, 024 recreated it for `age_basis`, and this one recreates it for
-- `dedup_key`. That repetition is the point of this header: the view is a
-- CONTRACT, and it has to be updated in step every time the Discovery screen
-- needs a field that lives on `activities`.
--
-- A column missing from that list fails SILENTLY. The admin panel calls
-- `.select('*')` on the view (src/hooks/useDiscoveredActivities.js:21), and `*`
-- expands to the view's columns, not the table's — so an absent field returns no
-- error, no warning, just `undefined` on every row. The feature that reads it
-- looks broken rather than erroring, which is the slowest kind of bug to find.
--
-- What this unlocks: the review queue currently shows the same session over and
-- over — 12 'soft play session' rows at one postcode from one feed, 8 at
-- another. `activities.dedup_key` is a stored generated column
-- (`discovery_dedup_key(title, postcode, schedule)`, 008:186-206) populated on
-- 100% of rows and indexed, but it has never been read by anything: no
-- constraint, no ON CONFLICT, no query. Exposing it here lets the UI GROUP those
-- rows FOR DISPLAY.
--
-- The hazard, and why `postcode` matters as much as `dedup_key`. The key hashes
-- title + postcode + first schedule slot. A source that emits a BLANK postcode
-- makes genuinely different venues collapse onto one key: five library branches
-- each running "Story Time" become a single group. So the view carries
-- `postcode` (024's list already did, at position 4 — verified, not assumed) and
-- the UI must warn on any group formed with it blank. Nothing here merges,
-- rejects or deletes: grouping is a display concern, every row stays its own
-- row, and a wrongly-grouped set stays visible and recoverable.

-- Recreated in full rather than patched: `create or replace view` cannot add a
-- column in the middle, and it refuses to reorder or retype existing ones. The
-- column list below is 024's, unchanged and in its order, with `dedup_key`
-- appended last. PostgREST reads by name, so appending is safe.
drop view if exists activity_review_queue;

create view activity_review_queue as
select
  a.id, a.title, a.venue_name, a.postcode, a.borough, a.outcode,
  a.category, a.description, a.deep_link, a.booking_mode,
  a.age_min_months, a.age_max_months,
  discovery_age_text(a.age_min_months, a.age_max_months) as age_range,
  a.age_basis,
  a.is_free, a.price_text, a.term_time_only, a.confidence, a.quality_score,
  a.status, a.source_id, s.name as source_name, s.attribution,
  jsonb_array_length(coalesce(a.schedule, '[]'::jsonb)) > 0 as is_recurring,
  a.schedule,
  (select min(o.starts_at) from occurrences o
    where o.activity_id = a.id and o.starts_at >= now())    as next_occurrence,
  (select count(*) from occurrences o
    where o.activity_id = a.id and o.starts_at >= now())    as upcoming_count,
  a.last_verified_at, a.created_at,
  -- NEW. Non-null on every row (generated, stored). Read it as a grouping hint
  -- only — it is never unique-constrained, and a blank `postcode` above makes it
  -- collide across distinct venues.
  a.dedup_key
from activities a
left join discovery_sources s on s.id = a.source_id;

-- A recreated view does not inherit its grants. Dropping this line silently
-- locks the admin panel out of its own review queue.
grant select on activity_review_queue to authenticated;

comment on view activity_review_queue is
  'Pending activities for admin review, with source attribution, age provenance and the generated dedup_key. dedup_key groups apparent repeats FOR DISPLAY only — it is not unique-constrained and collides across distinct venues when postcode is blank, so always check postcode before treating a group as one activity.';

-- Verification — paste into the SQL editor after running:
--
-- 1. Group sizes by dedup_key across the pending queue. Anything above 1 is a
--    candidate group; check its postcode column before trusting it.
--
-- select dedup_key, count(*) as group_size,
--        count(distinct source_name) as sources,
--        count(distinct coalesce(postcode, '')) as postcodes,
--        min(title) as sample_title
-- from activity_review_queue
-- where status = 'pending'
-- group by dedup_key
-- having count(*) > 1
-- order by group_size desc, dedup_key;
--
-- 2. Separately: how many pending rows carry a BLANK postcode. These are the
--    false-grouping risk — their keys can merge unrelated venues, so the UI must
--    warn rather than present them as confident duplicates.
--
-- select count(*) filter (where coalesce(nullif(trim(postcode), ''), null) is null)
--          as blank_postcode_rows,
--        count(*) as pending_rows
-- from activity_review_queue
-- where status = 'pending';
