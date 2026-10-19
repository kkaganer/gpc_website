-- Admin-set dates for a discovered activity — fix runs like a theatre show.
--
-- WHY. publish_activity (011, later hardened with a "no upcoming dates" guard)
-- turns an activity into london_events rows ONE PER OCCURRENCE. A run such as the
-- Unicorn's "Pocket Money" only carries its OPENING occurrence, so it published as
-- a single opening-night row with no sense of the weeks it actually runs. Nothing
-- let an admin say "this runs from X to Y".
--
-- WHAT. Three nullable columns an admin can set on the activity, and a new branch
-- in publish_activity: when admin_start_date is set, the activity publishes as ONE
-- london_events row with date + end_date, so effective_end_date (coalesce(end_date,
-- date), migration 026) spans the whole run and the existing date filters show it
-- on every day it runs — exactly how a manually-added or email-parsed run behaves.
-- Absent (the default for every existing row) = behave precisely as today.

-- 1. Additive, nullable. -----------------------------------------------------
alter table activities add column if not exists admin_start_date date;
alter table activities add column if not exists admin_end_date   date;
alter table activities add column if not exists admin_time        text;

comment on column activities.admin_start_date is
  'Admin-pinned start date. When set, publish_activity emits ONE london_events row (date=this, end_date=admin_end_date) instead of per-occurrence rows. NULL = use occurrences.';

-- 2. publish_activity: admin-dates branch in front of the occurrence path. ----
-- Reproduces the live function verbatim, with v_location hoisted above the two
-- branches and the admin branch added first. The admin branch deliberately skips
-- the "no upcoming dates" guard: pinning dates is exactly how an admin publishes a
-- directory-style listing that has no scheduled occurrences.
create or replace function public.publish_activity(
  p_activity_id uuid,
  p_horizon_days integer default 28,
  p_max_occurrences integer default 12
)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  a           activities%rowtype;
  v_location  text;
  v_written   integer := 0;
  v_available integer := 0;
begin
  select * into a from activities where id = p_activity_id;
  if not found then
    raise exception 'activity % not found', p_activity_id;
  end if;

  v_location := coalesce(
    nullif(a.address, ''), nullif(a.venue_name, ''),
    nullif(a.postcode, ''), nullif(a.borough, ''), 'Location to be confirmed'
  );

  -- ADMIN-PINNED DATES: one row spanning [admin_start_date, admin_end_date].
  if a.admin_start_date is not null then
    -- Clear any per-occurrence rows this activity published before, keeping the
    -- row that already sits on the start date so its id (and any newsletter
    -- override keyed to it) survives the upsert below.
    delete from london_events
      where activity_id = a.id
        and date is distinct from a.admin_start_date;

    insert into london_events (
      activity_id, title, venue, date, end_date, time, location, postcode, area,
      lat, lng, description, url, category, age_range, price, is_free,
      source, approved, is_recurring
    ) values (
      a.id, a.title, a.venue_name,
      a.admin_start_date, a.admin_end_date, coalesce(a.admin_time, ''),
      v_location, a.postcode, a.borough,
      a.lat, a.lng, a.description, coalesce(a.deep_link, a.booking_url, a.source_url),
      a.category, discovery_age_text(a.age_min_months, a.age_max_months),
      a.price_text, coalesce(a.is_free, false),
      a.source_id, true, false
    )
    on conflict (activity_id, date) where activity_id is not null
    do update set
      title = excluded.title, venue = excluded.venue, end_date = excluded.end_date,
      time = excluded.time, location = excluded.location, postcode = excluded.postcode,
      area = excluded.area, lat = excluded.lat, lng = excluded.lng,
      description = excluded.description, url = excluded.url,
      category = excluded.category, age_range = excluded.age_range,
      price = excluded.price, is_free = excluded.is_free, is_recurring = false;

    get diagnostics v_written = row_count;
    update activities set status = 'published' where id = p_activity_id;
    return v_written;
  end if;

  -- OCCURRENCE PATH (unchanged). ---------------------------------------------
  select count(*) into v_available
    from occurrences o
   where o.activity_id = a.id
     and o.status = 'scheduled'
     and o.starts_at >= now();

  if v_available = 0 then
    raise exception
      'activity "%" has no upcoming dates and cannot be published. Directory listings (e.g. ClassForKids) describe a provider, not a dated session.',
      a.title
      using errcode = 'check_violation';
  end if;

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
  from (
    select o.*
    from occurrences o
    where o.activity_id = a.id
      and o.status = 'scheduled'
      and o.starts_at >= now()
      and o.starts_at < now() + make_interval(days => p_horizon_days)
    order by o.starts_at
    limit p_max_occurrences
  ) o
  on conflict (activity_id, date) where activity_id is not null
  do update set
    title = excluded.title, venue = excluded.venue, time = excluded.time,
    location = excluded.location, postcode = excluded.postcode,
    area = excluded.area, lat = excluded.lat, lng = excluded.lng,
    description = excluded.description, url = excluded.url,
    category = excluded.category, age_range = excluded.age_range,
    price = excluded.price, is_free = excluded.is_free,
    is_recurring = false;

  get diagnostics v_written = row_count;
  update activities set status = 'published' where id = p_activity_id;
  return v_written;
end;
$function$;

-- Postgres grants EXECUTE on a replaced function to PUBLIC by default; re-apply
-- the lockdown from 010 so this migration does not quietly undo it.
revoke execute on function public.publish_activity(uuid, integer, integer) from public, anon;
grant  execute on function public.publish_activity(uuid, integer, integer) to authenticated;

-- 3. Expose the three admin fields on the review view so the edit panel can read
--    and write them. Recreated in full (create-or-replace cannot append a column);
--    032's list, in order, with the three appended last. Re-grant: a recreated
--    view does not inherit its grants (see 032).
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
  a.address,
  a.lat,
  a.lng,
  a.booking_url,
  a.source_url,
  -- NEW: admin-pinned dates (migration 035). The edit panel's Dates section.
  a.admin_start_date,
  a.admin_end_date,
  a.admin_time
from activities a
left join discovery_sources s on s.id = a.source_id;

grant select on activity_review_queue to authenticated;
