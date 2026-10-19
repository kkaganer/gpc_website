-- Fix two edges of 035's admin-pinned dates, and restore the view comment.
--
-- 1. CLEARING THE DATES LEFT THE RUN LIVE. 035's admin branch replaces an
--    activity's per-occurrence rows with one run row (date + end_date). But the
--    occurrence path never removed that run row when the dates were cleared and
--    the activity republished: it only upserted occurrence rows on
--    (activity_id, date), and its `do update` never reset end_date. Verified on
--    live data in a rolled-back transaction — after clearing, the run row
--    (10-22..11-28) stayed live beside the five occurrence rows. The occurrence
--    path now deletes this activity's run rows (only the admin branch ever writes
--    end_date on an activity-linked row) and resets end_date on update.
--
-- 2. A BLANK ADMIN TIME WIPED THE SESSION TIME. The admin branch wrote time = ''
--    when Time was left empty, overwriting the occurrence time on the start-date
--    row. It now falls back to the next upcoming occurrence's time, and an update
--    keeps the existing time rather than blanking it.
--
-- Additive in effect: same signature, same grants, same behaviour for every
-- activity that has no admin dates and never had any.

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
    delete from london_events
      where activity_id = a.id
        and date is distinct from a.admin_start_date;

    insert into london_events (
      activity_id, title, venue, date, end_date, time, location, postcode, area,
      lat, lng, description, url, category, age_range, price, is_free,
      source, approved, is_recurring
    ) values (
      a.id, a.title, a.venue_name,
      a.admin_start_date, a.admin_end_date,
      -- Blank admin time: use the next session's time rather than none at all.
      coalesce(
        nullif(a.admin_time, ''),
        (select to_char(o.starts_at at time zone 'Europe/London', 'HH24:MI')
                || case when o.ends_at is not null
                     then ' - ' || to_char(o.ends_at at time zone 'Europe/London', 'HH24:MI')
                     else '' end
           from occurrences o
          where o.activity_id = a.id and o.status = 'scheduled' and o.starts_at >= now()
          order by o.starts_at
          limit 1),
        ''
      ),
      v_location, a.postcode, a.borough,
      a.lat, a.lng, a.description, coalesce(a.deep_link, a.booking_url, a.source_url),
      a.category, discovery_age_text(a.age_min_months, a.age_max_months),
      a.price_text, coalesce(a.is_free, false),
      a.source_id, true, false
    )
    on conflict (activity_id, date) where activity_id is not null
    do update set
      title = excluded.title, venue = excluded.venue, end_date = excluded.end_date,
      time = coalesce(nullif(excluded.time, ''), london_events.time),
      location = excluded.location, postcode = excluded.postcode,
      area = excluded.area, lat = excluded.lat, lng = excluded.lng,
      description = excluded.description, url = excluded.url,
      category = excluded.category, age_range = excluded.age_range,
      price = excluded.price, is_free = excluded.is_free, is_recurring = false;

    get diagnostics v_written = row_count;
    update activities set status = 'published' where id = p_activity_id;
    return v_written;
  end if;

  -- OCCURRENCE PATH. -----------------------------------------------------------
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

  -- A run row left by previously-pinned admin dates. Only the admin branch writes
  -- end_date on an activity-linked row, so this removes exactly those.
  delete from london_events
    where activity_id = a.id
      and end_date is not null;

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
    end_date = null,
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

revoke execute on function public.publish_activity(uuid, integer, integer) from public, anon;
grant  execute on function public.publish_activity(uuid, integer, integer) to authenticated;

-- 035 recreated the view and dropped 032's comment; restore it.
comment on view activity_review_queue is
  'Pending activities for admin review, with source attribution, age provenance, the generated dedup_key, the repairable fields (address, lat, lng, booking_url, source_url) and the admin-pinned dates (admin_start_date, admin_end_date, admin_time) the Discovery edit panel writes back to activities. dedup_key groups apparent repeats FOR DISPLAY only. outcode and dedup_key are GENERATED — never include them in an update payload.';
