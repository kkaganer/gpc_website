-- Surface age provenance in the review queue.
--
-- WHY. Migration 023 added `activities.age_basis`, and the Discovery review
-- screen badges it so an admin can tell "the venue stated this age" from "an AI
-- guessed it from the title". But that screen does not read `activities` — it
-- reads the `activity_review_queue` view (009:229), which selects an explicit
-- column list. A column missing from that list cannot be returned even by
-- `select('*')`, so without this migration every badge, the count and the
-- filter added in 023 are dead code that fails silently: no error, just an
-- always-empty value.
--
-- This is the same shape of bug as the writer payload omitting the field. An
-- explicit column list is a contract that has to be updated in step with the
-- table, in every place one exists.

-- Recreated in full rather than patched: `create or replace view` cannot add a
-- column in the middle, and the column order below is 009's, with age_basis
-- placed next to the age fields it describes. Anything reading positionally
-- would be wrong either way; PostgREST reads by name.
drop view if exists activity_review_queue;

create view activity_review_queue as
select
  a.id, a.title, a.venue_name, a.postcode, a.borough, a.outcode,
  a.category, a.description, a.deep_link, a.booking_mode,
  a.age_min_months, a.age_max_months,
  discovery_age_text(a.age_min_months, a.age_max_months) as age_range,
  -- NEW. Null on every row that predates 023, which is honest: their
  -- provenance genuinely was not recorded.
  a.age_basis,
  a.is_free, a.price_text, a.term_time_only, a.confidence, a.quality_score,
  a.status, a.source_id, s.name as source_name, s.attribution,
  jsonb_array_length(coalesce(a.schedule, '[]'::jsonb)) > 0 as is_recurring,
  a.schedule,
  (select min(o.starts_at) from occurrences o
    where o.activity_id = a.id and o.starts_at >= now())    as next_occurrence,
  (select count(*) from occurrences o
    where o.activity_id = a.id and o.starts_at >= now())    as upcoming_count,
  a.last_verified_at, a.created_at
from activities a
left join discovery_sources s on s.id = a.source_id;

grant select on activity_review_queue to authenticated;

comment on view activity_review_queue is
  'Pending activities for admin review, with source attribution and age provenance. age_basis distinguishes a stated age from an inferred, assumed or AI-judged one — an llm_judged row is a guess and must be checked before publishing.';

-- Verification — paste into the SQL editor after running:
--
-- select age_basis, count(*)
-- from activity_review_queue
-- group by age_basis
-- order by count(*) desc;
