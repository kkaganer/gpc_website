-- Publish recurring activities as DATED OCCURRENCES rather than one summary row.
--
-- WHY THIS CHANGED
--
-- 009 projected a recurring activity as a single `london_events` row with
-- is_recurring = true. But the public What's On hook filters those out:
--
--     .eq('approved', true).eq('is_recurring', false)
--
-- so every recurring activity was invisible on the site and reachable only by
-- the newsletter's regulars block. Since ~97% of under-5 provision IS recurring
-- — free, weekly, walkable rhyme times and stay-and-play — that hid exactly the
-- content this platform exists to surface. 228 of 611 activities were affected.
--
-- Now BOTH branches project occurrences, so a weekly session appears on What's
-- On and the map on each date it actually runs, and the existing date filters
-- work on it unchanged. No frontend change required.
--
-- TWO CAPS, because the raw data is far larger than a listings page can carry:
--
--   p_horizon_days (default 28)
--     The ingest horizon is 56 days, but What's On answers "what's on soon".
--     28 days keeps the page current and halves the row count.
--
--   p_max_occurrences (default 12)
--     Some Better/GLL soft-play series run hourly, 17+ slots a week — over 500
--     occurrences each in the ingest window. Publishing those verbatim would put
--     >21,000 rows into london_events and show 17 identical rows for one Tuesday.
--     The cap keeps a weekly session intact (4 rows in 28 days) while bounding
--     the pathological ones. Occurrences are taken earliest-first.
--
-- Re-running publish_activity() on an already-published activity is safe: rows
-- are upserted on (activity_id, date) and the window rolls forward.

create or replace function publish_activity(
  p_activity_id uuid,
  p_horizon_days integer default 28,
  p_max_occurrences integer default 12
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
begin
  select * into a from activities where id = p_activity_id;
  if not found then
    raise exception 'activity % not found', p_activity_id;
  end if;

  -- `london_events.location` is NOT NULL; fall through the fields most likely
  -- to be populated rather than letting the insert fail.
  v_location := coalesce(
    nullif(a.address, ''), nullif(a.venue_name, ''),
    nullif(a.postcode, ''), nullif(a.borough, ''), 'Location to be confirmed'
  );

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
    a.source_id, true,
    -- Deliberately FALSE even for recurring activities: is_recurring = true is
    -- what excluded them from What's On. The recurrence lives in `activities`;
    -- these rows are the published, dated view of it.
    false
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
$$;

-- The 2-arg signature from 009 is now superseded; drop it so callers can't
-- silently bind to the old one-summary-row behaviour.
drop function if exists publish_activity(uuid, integer);

-- Re-apply the lockdown from 010 to the NEW signature. Postgres grants EXECUTE
-- on a newly created function to PUBLIC by default, so without this the
-- security fix would be quietly undone by this migration.
revoke execute on function publish_activity(uuid, integer, integer) from public, anon;
grant  execute on function publish_activity(uuid, integer, integer) to authenticated;
