-- Bookwhen + ClassForKids sources, a publish guard, and a geocode backfill.

-- ---------------------------------------------------------------------------
-- 1. New sources
-- ---------------------------------------------------------------------------

-- Bookwhen needs NO new adapter: it publishes a CC-BY 4.0 OpenActive RPDE feed,
-- so the existing `openactive` adapter consumes it from a config row alone.
-- Caveat found while verifying: Bookwhen sets `location.address` to a plain
-- STRING rather than a PostalAddress object, so the adapter now also extracts a
-- postcode from the string form — without that every record dropped silently as
-- "no_postcode".
insert into discovery_sources (id, name, adapter, config, licence, attribution, enabled, notes) values
  ('bookwhen-openactive',
   'Bookwhen (OpenActive)',
   'openactive',
   '{"series":"https://bookwhen.com/api/openactive/sessionseries","area_policy":"london"}'::jsonb,
   'https://creativecommons.org/licenses/by/4.0/',
   'Contains information from Bookwhen licensed under CC BY 4.0',
   true,
   'Verified live: 50 items/page, ~1/3 state=deleted. Thin for under-5 SE London (previously measured 1 hit) but free to run.'),

  ('classforkids',
   'ClassForKids',
   'classforkids',
   '{"outcodes":["SE8","SE10","SE13","SE3","SE18","SE9","SE14","SE23"],"area_policy":"london"}'::jsonb,
   null,
   'ClassForKids',
   true,
   'ONLY source publishing age in MONTHS (e.g. 2-13mo). DIRECTORY entries, not dated events — no occurrences, so they cannot be published to london_events. Query by OUTCODE: their slugs are wrong (/blackheath -> Surrey, /deptford -> Wiltshire).')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Publish guard
--
-- ClassForKids entries have no dates. publish_activity() previously selected
-- from `occurrences`, wrote zero rows, and still flipped status to 'published' —
-- so the admin saw a success and nothing appeared. Fail loudly instead.
-- ---------------------------------------------------------------------------
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
  v_available integer := 0;
begin
  select * into a from activities where id = p_activity_id;
  if not found then
    raise exception 'activity % not found', p_activity_id;
  end if;

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
$$;

revoke execute on function publish_activity(uuid, integer, integer) from public, anon;
grant  execute on function publish_activity(uuid, integer, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Geocode backfill — the Discovery-page equivalent of "Fix Map Pins".
--
-- An activity with a postcode but no lat/lng is invisible on the map, and
-- publish_activity() copies lat/lng straight through, so the gap propagates to
-- london_events. This copies coordinates from any already-geocoded activity
-- sharing the same postcode — free, instant, and no external call.
--
-- Returns how many rows were fixed and how many remain unfixable (no postcode
-- to work from) so the admin sees the real state rather than a bare count.
-- ---------------------------------------------------------------------------
create or replace function backfill_activity_coordinates()
returns table (fixed integer, still_missing integer, no_postcode integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fixed integer := 0;
begin
  with known as (
    select postcode, min(lat) as lat, min(lng) as lng
    from activities
    where postcode is not null and lat is not null and lng is not null
    group by postcode
  )
  update activities a
     set lat = k.lat, lng = k.lng
    from known k
   where a.postcode = k.postcode
     and (a.lat is null or a.lng is null);
  get diagnostics v_fixed = row_count;

  -- Propagate to anything already published from those activities.
  update london_events e
     set lat = a.lat, lng = a.lng
    from activities a
   where e.activity_id = a.id
     and (e.lat is null or e.lng is null)
     and a.lat is not null;

  return query
    select v_fixed,
      (select count(*)::integer from activities
        where (lat is null or lng is null) and postcode is not null),
      (select count(*)::integer from activities where postcode is null);
end;
$$;

revoke execute on function backfill_activity_coordinates() from public, anon;
grant  execute on function backfill_activity_coordinates() to authenticated;
