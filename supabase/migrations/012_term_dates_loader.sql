-- School holiday dates, and a loader for them.
--
-- HOW THIS GATES PUBLISHING
--
-- Occurrence generation suppresses a date only when BOTH are true:
--     activities.term_time_only = true      (the source SAID so)
--     the date falls inside a term_dates holiday row for that borough
--
-- Everything else is untouched. `term_time_only` is null for the overwhelming
-- majority of activities (measured: 0 of 500 OpenActive series mention term
-- time; 26 of 692 Better library cards; 11 of 311 Lewisham RSS items), and null
-- is NEVER suppressed. So this affects a small, deliberate minority — activities
-- that explicitly say "term time only".
--
-- DEGRADES SAFELY. With this table empty, `term_time_only = true` still matches
-- no holiday and nothing is suppressed — identical to current behaviour. Loading
-- dates turns the gate on; it cannot break anything by being absent.
--
-- WHY THE TABLE SHIPS EMPTY
--
-- I could not source verified 2026/27 dates: Royal Greenwich's term-dates page
-- 404s, Southwark's yields nothing parseable, and Lewisham's page covers
-- 2027-2030 but has already dropped the current academic year. Rather than
-- invent dates — which would hide real sessions for six weeks — the table is
-- left empty and filled with `load_term_holidays()` below.

-- ---------------------------------------------------------------------------
-- load_term_holidays(borough, holidays)
--
-- Upserts a borough's holiday ranges. `holidays` is a JSON array of
--   { "label": "Summer 2026", "starts_on": "2026-07-22", "ends_on": "2026-09-02" }
--
-- Example:
--   select load_term_holidays('Lewisham', '[
--     {"label":"October half term 2026","starts_on":"2026-10-26","ends_on":"2026-10-30"},
--     {"label":"Christmas 2026","starts_on":"2026-12-21","ends_on":"2027-01-01"}
--   ]'::jsonb);
--
-- Idempotent on (borough, label, starts_on), so re-running with corrected dates
-- updates in place. Returns the number of ranges written.
-- ---------------------------------------------------------------------------
create or replace function load_term_holidays(
  p_borough text,
  p_holidays jsonb,
  p_source_url text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_written integer;
begin
  if jsonb_typeof(p_holidays) <> 'array' then
    raise exception 'p_holidays must be a JSON array of {label, starts_on, ends_on}';
  end if;

  insert into term_dates (borough, label, kind, starts_on, ends_on, source_url)
  select
    p_borough,
    h ->> 'label',
    coalesce(h ->> 'kind', 'holiday'),
    (h ->> 'starts_on')::date,
    (h ->> 'ends_on')::date,
    p_source_url
  from jsonb_array_elements(p_holidays) h
  where h ? 'label' and h ? 'starts_on' and h ? 'ends_on'
  on conflict (borough, label, starts_on) do update
    set ends_on = excluded.ends_on,
        kind = excluded.kind,
        source_url = excluded.source_url;

  get diagnostics v_written = row_count;
  return v_written;
end;
$$;

revoke execute on function load_term_holidays(text, jsonb, text) from public, anon;
grant  execute on function load_term_holidays(text, jsonb, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Visibility: which activities the gate would actually affect, and whether the
-- borough has dates loaded. Without this, "term-time is on" is unverifiable.
-- ---------------------------------------------------------------------------
create or replace view term_time_coverage as
select
  a.borough,
  count(*) filter (where a.term_time_only is true)  as term_time_only_activities,
  count(*) filter (where a.term_time_only is false) as runs_in_holidays_activities,
  count(*) filter (where a.term_time_only is null)  as unknown_activities,
  (select count(*) from term_dates t
    where t.borough = a.borough and t.kind = 'holiday'
      and t.ends_on >= current_date)                as upcoming_holiday_ranges
from activities a
group by a.borough;

grant select on term_time_coverage to authenticated;
