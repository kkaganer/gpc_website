-- Bridge: publish reviewed activities into `london_events`.
--
-- WHY A PROJECTION RATHER THAN A REPLACEMENT
--
-- The site already has a working approval process: `london_events` + an
-- `approved` flag, a Pending/Approved admin UI, a public What's On page, a map,
-- a submit-an-event modal and a newsletter generator. All of that reads
-- `london_events` and none of it should have to change.
--
-- But `london_events` cannot express what discovery produces — it has one `date`
-- per row and no age-in-months, term-time flag, provenance or quality score.
-- Collapsing the new model into it would throw away the whole point of the work.
--
-- So the two coexist with a clear split of responsibility:
--
--   activities/occurrences  = SYSTEM OF RECORD. Rich, source-linked, re-ingested
--                             on every run, never shown to the public directly.
--   london_events           = PUBLISHED VIEW. What the site renders. A row only
--                             appears here when a human approves it.
--
-- Nothing is auto-published. `publish_activity()` is called by the admin UI on
-- approve, exactly like the existing approve button.

-- Link published rows back to their source activity. Nullable, so every existing
-- manually-added or Perplexity-discovered row is untouched.
alter table london_events
  add column if not exists activity_id uuid references activities(id) on delete set null;

create index if not exists london_events_activity_idx on london_events (activity_id);

-- One published row per (activity, date). Re-publishing updates in place rather
-- than duplicating — the same ON CONFLICT cardinality discipline used at ingest.
create unique index if not exists london_events_activity_date_uidx
  on london_events (activity_id, date)
  where activity_id is not null;

-- ---------------------------------------------------------------------------
-- Render age in months back to the free-text `age_range` the UI already shows.
-- Months are the system of record; this is presentation only.
-- ---------------------------------------------------------------------------
create or replace function discovery_age_text(min_m integer, max_m integer)
returns text
language sql
immutable
parallel safe
as $$
  select case
    when min_m is null and max_m is null then null
    when min_m is null then 'Up to ' || (max_m / 12) || ' years'
    when max_m is null then (min_m / 12) || '+ years'
    -- Keep months where months are meaningful; a "0-18 months" session reads
    -- very differently to "0-1 years" for the audience this is built for.
    when max_m <= 24 then min_m || '-' || max_m || ' months'
    when min_m < 12 then '0-' || (max_m / 12) || ' years'
    when min_m % 12 = 0 then (min_m / 12) || '-' || (max_m / 12) || ' years'
    else min_m || ' months - ' || (max_m / 12) || ' years'
  end
$$;

-- ---------------------------------------------------------------------------
-- publish_activity(activity_id, horizon_days)
--
-- Projects one reviewed activity into `london_events` as approved rows.
--
--   RECURRING activity (schedule non-empty)
--     -> ONE row with is_recurring = true, day_of_week + recurring_time set.
--        This is why `london_events` already has those columns (migration 005);
--        the newsletter's regulars block reads them and the public list filters
--        them out, both of which stay correct.
--
--   ONE-OFF activity (schedule empty)
--     -> one dated row per upcoming occurrence inside the horizon.
--
-- Returns the number of london_events rows written.
-- ---------------------------------------------------------------------------
create or replace function publish_activity(
  p_activity_id uuid,
  p_horizon_days integer default 56
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  a           activities%rowtype;
  v_location  text;
  v_written   integer := 0;
  v_dow       smallint;
  v_time      text;
begin
  select * into a from activities where id = p_activity_id;
  if not found then
    raise exception 'activity % not found', p_activity_id;
  end if;

  -- `london_events.location` is NOT NULL. Fall back through the fields most
  -- likely to be populated rather than letting the insert fail.
  v_location := coalesce(
    nullif(a.address, ''), nullif(a.venue_name, ''),
    nullif(a.postcode, ''), nullif(a.borough, ''), 'Location to be confirmed'
  );

  if jsonb_array_length(coalesce(a.schedule, '[]'::jsonb)) > 0 then
    ------------------------------------------------------------------ recurring
    -- Postgres/JS day numbering: sunday = 0, matching london_events.day_of_week
    -- as used by the newsletter renderer.
    v_dow := case lower(a.schedule -> 0 ->> 'by_day')
               when 'sunday' then 0 when 'monday' then 1 when 'tuesday' then 2
               when 'wednesday' then 3 when 'thursday' then 4
               when 'friday' then 5 when 'saturday' then 6 end;

    v_time := trim(both ' -' from
                concat_ws(' - ',
                  a.schedule -> 0 ->> 'start_time',
                  a.schedule -> 0 ->> 'end_time'));

    insert into london_events (
      activity_id, title, venue, date, time, location, postcode, area,
      lat, lng, description, url, category, age_range, price, is_free,
      source, approved, is_recurring, day_of_week, recurring_time
    ) values (
      a.id, a.title, a.venue_name,
      -- Recurring rows still need a date (NOT NULL); the earliest upcoming
      -- occurrence is the most useful value and the UI ignores it for regulars.
      coalesce(
        (select min(o.starts_at)::date from occurrences o
          where o.activity_id = a.id and o.starts_at >= now()),
        current_date),
      v_time, v_location, a.postcode, a.borough,
      a.lat, a.lng, a.description, coalesce(a.deep_link, a.booking_url, a.source_url),
      a.category, discovery_age_text(a.age_min_months, a.age_max_months),
      a.price_text, coalesce(a.is_free, false),
      a.source_id, true, true, v_dow, v_time
    )
    on conflict (activity_id, date) where activity_id is not null
    do update set
      title = excluded.title, venue = excluded.venue, time = excluded.time,
      location = excluded.location, postcode = excluded.postcode,
      area = excluded.area, lat = excluded.lat, lng = excluded.lng,
      description = excluded.description, url = excluded.url,
      category = excluded.category, age_range = excluded.age_range,
      price = excluded.price, is_free = excluded.is_free,
      is_recurring = true, day_of_week = excluded.day_of_week,
      recurring_time = excluded.recurring_time;

    v_written := 1;

  else
    -------------------------------------------------------------------- one-off
    insert into london_events (
      activity_id, title, venue, date, time, location, postcode, area,
      lat, lng, description, url, category, age_range, price, is_free,
      source, approved, is_recurring
    )
    select
      a.id, a.title, a.venue_name,
      (o.starts_at at time zone 'Europe/London')::date,
      to_char(o.starts_at at time zone 'Europe/London', 'HH24:MI')
        || case when o.ends_at is not null
             then ' - ' || to_char(o.ends_at at time zone 'Europe/London', 'HH24:MI')
             else '' end,
      v_location, a.postcode, a.borough,
      a.lat, a.lng, a.description, coalesce(a.deep_link, a.booking_url, a.source_url),
      a.category, discovery_age_text(a.age_min_months, a.age_max_months),
      a.price_text, coalesce(a.is_free, false),
      a.source_id, true, false
    from occurrences o
    where o.activity_id = a.id
      and o.status = 'scheduled'
      and o.starts_at >= now()
      and o.starts_at < now() + make_interval(days => p_horizon_days)
    on conflict (activity_id, date) where activity_id is not null
    do update set
      title = excluded.title, venue = excluded.venue, time = excluded.time,
      location = excluded.location, postcode = excluded.postcode,
      area = excluded.area, lat = excluded.lat, lng = excluded.lng,
      description = excluded.description, url = excluded.url,
      category = excluded.category, age_range = excluded.age_range,
      price = excluded.price, is_free = excluded.is_free;

    get diagnostics v_written = row_count;
  end if;

  update activities set status = 'published' where id = p_activity_id;
  return v_written;
end;
$$;

-- Reverse it: pull the published rows and send the activity back to the queue.
create or replace function unpublish_activity(p_activity_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_deleted integer;
begin
  delete from london_events where activity_id = p_activity_id;
  get diagnostics v_deleted = row_count;
  update activities set status = 'pending' where id = p_activity_id;
  return v_deleted;
end;
$$;

create or replace function reject_activity(p_activity_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from london_events where activity_id = p_activity_id;
  update activities
     set status = 'rejected', reject_reason = p_reason
   where id = p_activity_id;
end;
$$;

grant execute on function publish_activity(uuid, integer)   to authenticated;
grant execute on function unpublish_activity(uuid)          to authenticated;
grant execute on function reject_activity(uuid, text)       to authenticated;

-- ---------------------------------------------------------------------------
-- Review queue: what the admin UI lists. One row per pending activity with the
-- next occurrence and a count, so a recurring session shows as one line rather
-- than 8 weeks of duplicates.
-- ---------------------------------------------------------------------------
create or replace view activity_review_queue as
select
  a.id, a.title, a.venue_name, a.postcode, a.borough, a.outcode,
  a.category, a.description, a.deep_link, a.booking_mode,
  a.age_min_months, a.age_max_months,
  discovery_age_text(a.age_min_months, a.age_max_months) as age_range,
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
