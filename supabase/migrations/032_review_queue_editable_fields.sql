-- Expose the fields the Discovery screen needs in order to CORRECT a listing.
--
-- WHY. This is the FOURTH migration to recreate `activity_review_queue` for a
-- column the UI needed — 009 created it, 024 added `age_basis`, 025 added
-- `dedup_key`, and this one adds the five fields an admin has to be able to see
-- and fix before approving. 025's header called the view a CONTRACT that must be
-- updated in step every time the Discovery screen reads a new field on
-- `activities`; this is that, done again.
--
-- A column missing from the list below fails SILENTLY. The admin panel calls
-- `.select('*')` on the view (src/hooks/useDiscoveredActivities.js), and `*`
-- expands to the VIEW's columns, not the table's — so an absent field returns no
-- error, no warning, just `undefined` on every row. An edit panel bound to those
-- fields would render permanently blank inputs and save nulls over good data.
--
-- WHAT THE FIVE ARE FOR. `publish_activity` (011) is the only thing that turns an
-- activity into a public listing, and it reads exactly these:
--
--   location := coalesce(address, venue_name, postcode, borough,
--                        'Location to be confirmed')   -- NOT NULL on london_events
--   url      := coalesce(deep_link, booking_url, source_url)
--   lat, lng := copied straight through
--
-- So `address` decides whether a published row says where it is; `booking_url`
-- and `source_url` decide whether it has any link at all when `deep_link` is
-- null; and `lat`/`lng` decide whether it ever appears on the map. All five were
-- invisible to the review screen, which is why a listing could only be judged,
-- never repaired — the admin's only options were approve-it-broken or reject it.
--
-- NOT ADDED, deliberately: `outcode` and `dedup_key` are already here and are
-- GENERATED columns — Postgres rejects any write to them, so the edit panel must
-- keep them out of its update payload. `organiser`, `starts_on`, `ends_on`,
-- `price_type`, `price_amount`, `access` and `reject_reason` stay off the view
-- until something actually reads them; an unread column is another line to keep
-- in step for no gain.

-- Recreated in full rather than patched: `create or replace view` cannot add a
-- column in the middle, and refuses to reorder or retype existing ones. The list
-- below is 025's, unchanged and in its order, with the five appended last.
-- PostgREST reads by name, so appending is safe for every existing caller.
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
  a.dedup_key,
  -- NEW. The repairable fields. See the header for what each one decides.
  a.address,
  a.lat,
  a.lng,
  a.booking_url,
  a.source_url
from activities a
left join discovery_sources s on s.id = a.source_id;

-- A recreated view does not inherit its grants. Dropping this line silently
-- locks the admin panel out of its own review queue.
grant select on activity_review_queue to authenticated;

comment on view activity_review_queue is
  'Pending activities for admin review, with source attribution, age provenance, the generated dedup_key, and the repairable fields (address, lat, lng, booking_url, source_url) the Discovery edit panel writes back to activities. dedup_key groups apparent repeats FOR DISPLAY only. outcode and dedup_key are GENERATED — never include them in an update payload.';

-- Verification — paste into the SQL editor after running:
--
-- 1. All five new columns present:
--
-- select column_name from information_schema.columns
-- where table_name = 'activity_review_queue'
--   and column_name in ('address','lat','lng','booking_url','source_url')
-- order by column_name;   -- expect 5 rows
--
-- 2. How much of the pending queue is actually repairable — the size of the
--    problem the edit panel and the gap filters exist to solve:
--
-- select count(*) filter (where coalesce(nullif(trim(postcode),''),null) is null)
--          as no_postcode,
--        count(*) filter (where coalesce(nullif(trim(address),''),null) is null
--                           and coalesce(nullif(trim(venue_name),''),null) is null)
--          as no_location,
--        count(*) filter (where coalesce(nullif(trim(deep_link),''),null) is null
--                           and coalesce(nullif(trim(booking_url),''),null) is null
--                           and coalesce(nullif(trim(source_url),''),null) is null)
--          as no_website,
--        count(*) filter (where lat is null or lng is null) as no_map_pin,
--        count(*) as pending_rows
-- from activity_review_queue where status = 'pending';
