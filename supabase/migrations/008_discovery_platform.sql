-- Discovery platform: Activity + Occurrence model.
--
-- WHY A NEW MODEL: ~97% of under-5 provision is weekly recurring and term-time
-- bound (rhyme time, stay & play, church toddler groups). `london_events` stores
-- a single `date` per row, so a recurring session can only be represented as a
-- one-off — which is why discovery skews to museums/theatre/festivals aimed at
-- 5-12s. The correct primitive is an ACTIVITY (a schedule rule + validity window)
-- from which OCCURRENCES are *generated*, not scraped.
--
-- These tables live ALONGSIDE `london_events`; nothing here touches it. The live
-- What's On page keeps reading `london_events` until the new pipeline is proven.

-- Trigram matching for fuzzy de-duplication (see discovery_dedup_key below).
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Normalisation helpers
--
-- Both are IMMUTABLE so they can be used in generated columns and index
-- expressions. NOTE: unaccent() is deliberately NOT used here — it is STABLE,
-- not IMMUTABLE, so Postgres rejects it in a STORED generated column. The usual
-- workaround (wrapping it in a fake-IMMUTABLE function) lies to the planner and
-- silently corrupts the index if the unaccent dictionary is ever altered.
-- translate() covers the accented characters that actually occur in UK venue
-- and activity names and is genuinely immutable.
-- ---------------------------------------------------------------------------

create or replace function discovery_norm_text(input text)
returns text
language sql
immutable
strict
parallel safe
as $$
  select regexp_replace(
           translate(
             lower(input),
             'àáâãäåāăąçćĉċčèéêëēĕėęěìíîïĩīĭįıñńņňòóôõöøōŏőùúûüũūŭůýÿŷžźż',
             'aaaaaaaaaccccceeeeeeeeeiiiiiiiiinnnnooooooooouuuuuuuuyyyzzz'
           ),
           '[^a-z0-9]+', ' ', 'g'
         )
$$;

-- Canonical UK postcode form: uppercase, no stray punctuation, single space
-- before the inward code. Feeds return values like 'Bs31 1he', 'RG304BZ' and
-- 'NE49LG' — all three normalise to the same shape here.
create or replace function discovery_norm_postcode(input text)
returns text
language sql
immutable
parallel safe
as $$
  select case
    when input is null then null
    when length(regexp_replace(upper(input), '[^A-Z0-9]', '', 'g')) between 5 and 7
      then regexp_replace(
             regexp_replace(upper(input), '[^A-Z0-9]', '', 'g'),
             '^(.*)(...)$', '\1 \2'
           )
    else null
  end
$$;

-- Outward code only ("SE10 9NF" -> "SE10"). Used for borough allowlisting.
create or replace function discovery_outcode(input text)
returns text
language sql
immutable
parallel safe
as $$
  select split_part(discovery_norm_postcode(input), ' ', 1)
$$;

-- ---------------------------------------------------------------------------
-- Source registry
--
-- One row per feed/adapter. `cursor` persists the RPDE next-page pointer so
-- OpenActive syncs incrementally instead of re-walking ~5,000 series each run.
-- `licence`/`attribution` are load-bearing, not decorative: the OpenActive feeds
-- are CC-BY 4.0, which permits storing and redisplaying ONLY with attribution.
-- ---------------------------------------------------------------------------

create table if not exists discovery_sources (
  id                    text primary key,
  name                  text not null,
  adapter               text not null,
  config                jsonb not null default '{}'::jsonb,
  licence               text,
  attribution           text,
  enabled               boolean not null default true,
  cursor                text,
  last_run_at           timestamptz,
  last_ok_at            timestamptz,
  consecutive_failures  integer not null default 0,
  notes                 text,
  created_at            timestamptz not null default now()
);

comment on column discovery_sources.cursor is
  'Opaque per-adapter resume pointer (RPDE `next` URL for OpenActive). Null = full resync.';
comment on column discovery_sources.config is
  'Adapter-specific. `area_policy` controls INGEST-time geo filtering: '
  '"curated" (explicit venue/branch list, no filter), "london" (Greater London — '
  'the default for broad feeds), "served" (served boroughs only). The map filters '
  'by distance at DISPLAY time, so ingest is deliberately generous.';
comment on column discovery_sources.attribution is
  'Displayed next to listings from this source. Required for CC-BY feeds.';

-- ---------------------------------------------------------------------------
-- Activities — the series/definition. One row per recurring session or one-off.
-- ---------------------------------------------------------------------------

create table if not exists activities (
  id                uuid primary key default gen_random_uuid(),

  -- provenance
  source_id         text not null references discovery_sources(id) on delete cascade,
  source_uid        text not null,
  source_url        text,
  deep_link         text,
  last_verified_at  timestamptz not null default now(),
  confidence        numeric(3,2),

  -- identity
  title             text not null,
  description       text,
  organiser         text,
  category          text,

  -- place
  venue_name        text,
  address           text,
  postcode          text,
  outcode           text generated always as (discovery_outcode(postcode)) stored,
  lat               double precision,
  lng               double precision,
  borough           text,

  -- schedule: [{ by_day: 'tuesday', start_time: '10:30', end_time: '11:00' }]
  -- Empty array => one-off; occurrences are ingested directly rather than generated.
  schedule          jsonb not null default '[]'::jsonb,
  timezone          text not null default 'Europe/London',
  starts_on         date,
  ends_on           date,

  -- MANDATORY correctness field. Term-time sessions published during a school
  -- holiday are false positives that destroy trust faster than a missing listing:
  -- in August this alone would wrongly publish ~72% of library sessions.
  -- NULL = genuinely unknown (gate G7 holds these rather than publishing).
  term_time_only    boolean,

  -- audience, in MONTHS. Years are too coarse for this audience — the difference
  -- between a 6-month-old and a 4-year-old is the whole product.
  age_min_months    integer,
  age_max_months    integer,

  -- money
  is_free           boolean,
  price_type        text check (price_type in ('free','donation','per_session','block','membership')),
  price_amount      numeric(8,2),
  price_text        text,

  -- booking
  booking_mode      text check (booking_mode in ('drop_in','book_ahead','waitlist','closed')),
  booking_url       text,

  -- access flags: step_free, buggy_parking, breastfeeding_friendly,
  -- changing_facilities, send_friendly, dad_carer_focus, quiet_low_sensory
  access            jsonb not null default '{}'::jsonb,

  -- review workflow
  quality_score     integer,
  status            text not null default 'pending'
                      check (status in ('pending','published','held','rejected')),
  reject_reason     text,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  unique (source_id, source_uid)
);

-- Fuzzy-match key for cross-source de-duplication. The same rhyme time can
-- legitimately arrive from a council page, a library feed and an aggregator.
create or replace function discovery_dedup_key(
  p_title text, p_postcode text, p_schedule jsonb
) returns text
language sql
immutable
parallel safe
as $$
  select discovery_norm_text(coalesce(p_title,''))
      || ' | ' || coalesce(discovery_norm_postcode(p_postcode), '')
      || ' | ' || coalesce(p_schedule -> 0 ->> 'by_day', '')
      || ' ' || coalesce(p_schedule -> 0 ->> 'start_time', '')
$$;

alter table activities
  add column if not exists dedup_key text
  generated always as (discovery_dedup_key(title, postcode, schedule)) stored;

-- GiST, NOT GIN. The "5 most similar existing activities" query is a KNN lookup
-- (ORDER BY col <-> 'query' LIMIT n), which GiST accelerates and GIN does not.
create index if not exists activities_dedup_trgm_idx
  on activities using gist (dedup_key gist_trgm_ops);

create index if not exists activities_outcode_idx   on activities (outcode);
create index if not exists activities_status_idx    on activities (status);
create index if not exists activities_source_idx    on activities (source_id);
create index if not exists activities_under5_idx    on activities (age_min_months, age_max_months);

-- ---------------------------------------------------------------------------
-- Occurrences — dated instances. GENERATED from schedule x validity x term
-- calendar for recurring activities; ingested directly for one-offs.
-- ---------------------------------------------------------------------------

create table if not exists occurrences (
  id            uuid primary key default gen_random_uuid(),
  activity_id   uuid not null references activities(id) on delete cascade,
  starts_at     timestamptz not null,
  ends_at       timestamptz,
  status        text not null default 'scheduled'
                  check (status in ('scheduled','cancelled','full')),
  source_uid    text,
  generated     boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (activity_id, starts_at)
);

create index if not exists occurrences_starts_at_idx on occurrences (starts_at);
create index if not exists occurrences_activity_idx  on occurrences (activity_id);

-- ---------------------------------------------------------------------------
-- Term dates — per-borough school holidays. Gates term_time_only (quality gate
-- G7). Without this the system cannot tell a running session from a suspended
-- one, which is the single highest-impact correctness field in the model.
-- ---------------------------------------------------------------------------

create table if not exists term_dates (
  id          uuid primary key default gen_random_uuid(),
  borough     text not null,
  label       text not null,
  kind        text not null default 'holiday' check (kind in ('holiday','term','inset')),
  starts_on   date not null,
  ends_on     date not null,
  source_url  text,
  created_at  timestamptz not null default now(),
  unique (borough, label, starts_on)
);

create index if not exists term_dates_lookup_idx on term_dates (borough, starts_on, ends_on);

-- ---------------------------------------------------------------------------
-- Ingest observability. A source that silently stops returning data is the most
-- likely long-run failure mode, so per-run yield is recorded rather than inferred.
-- ---------------------------------------------------------------------------

create table if not exists ingest_runs (
  id                uuid primary key default gen_random_uuid(),
  source_id         text references discovery_sources(id) on delete set null,
  started_at        timestamptz not null default now(),
  finished_at       timestamptz,
  ok                boolean,
  fetched           integer not null default 0,
  in_area           integer not null default 0,
  under5            integer not null default 0,
  inserted          integer not null default 0,
  updated           integer not null default 0,
  skipped_duplicate integer not null default 0,
  occurrences_written integer not null default 0,
  error             text,
  detail            jsonb
);

create index if not exists ingest_runs_source_idx on ingest_runs (source_id, started_at desc);

-- ---------------------------------------------------------------------------
-- RLS. Public may read PUBLISHED activities and their occurrences only.
-- All writes are service-role (edge functions); nothing here is client-writable.
-- ---------------------------------------------------------------------------

alter table activities          enable row level security;
alter table occurrences         enable row level security;
alter table discovery_sources   enable row level security;
alter table term_dates          enable row level security;
alter table ingest_runs         enable row level security;

create policy "Public can view published activities" on activities
  for select using (status = 'published');

create policy "Public can view occurrences of published activities" on occurrences
  for select using (
    exists (select 1 from activities a
            where a.id = occurrences.activity_id and a.status = 'published')
  );

create policy "Authenticated can view all activities" on activities
  for select to authenticated using (true);
create policy "Authenticated can manage activities" on activities
  for all to authenticated using (true) with check (true);
create policy "Authenticated can view all occurrences" on occurrences
  for select to authenticated using (true);
create policy "Authenticated can view sources" on discovery_sources
  for select to authenticated using (true);
create policy "Authenticated can view term dates" on term_dates
  for select to authenticated using (true);
create policy "Public can view term dates" on term_dates
  for select using (true);
create policy "Authenticated can view ingest runs" on ingest_runs
  for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Seed the source registry. Every endpoint below was verified returning live
-- data on 2026-08-12; `enabled` is false for adapters not yet written.
-- ---------------------------------------------------------------------------

insert into discovery_sources (id, name, adapter, config, licence, attribution, enabled, notes) values
  ('openactive-better',
   'Better / GLL (OpenActive)',
   'openactive',
   '{"series":"https://better-admin.org.uk/api/openactive/better/session-series","sessions":"https://better-admin.org.uk/api/openactive/better/scheduled-sessions","area_policy":"london"}'::jsonb,
   'https://creativecommons.org/licenses/by/4.0/',
   'Contains public sector information licensed under CC BY 4.0 — Better (GLL)',
   true,
   'NATIONAL feed (~5k series incl. Cardiff/Belfast/York). MUST filter by outcode.'),

  ('openactive-southwark',
   'Southwark Council (OpenActive)',
   'openactive',
   '{"series":"https://opendata.leisurecloud.live/api/feeds/SouthwarkCouncil-live-session-series","sessions":"https://opendata.leisurecloud.live/api/feeds/SouthwarkCouncil-live-scheduled-sessions","area_policy":"london"}'::jsonb,
   'https://creativecommons.org/licenses/by/4.0/',
   'Contains public sector information licensed under CC BY 4.0 — Southwark Council',
   true,
   'Page 1 is ~80% Gym Session; under-5 content is deeper in the feed.'),

  ('openactive-towerhamlets',
   'Tower Hamlets Council (OpenActive)',
   'openactive',
   '{"series":"https://opendata.leisurecloud.live/api/feeds/TowerHamletsCouncil-live-session-series","sessions":"https://opendata.leisurecloud.live/api/feeds/TowerHamletsCouncil-live-scheduled-sessions","area_policy":"london"}'::jsonb,
   'https://creativecommons.org/licenses/by/4.0/',
   'Contains public sector information licensed under CC BY 4.0 — Tower Hamlets Council',
   true,
   'Covers Isle of Dogs / E14.'),

  ('better-libraries',
   'Better Libraries timetables',
   'better-libraries',
   '{"endpoint":"https://www.better.org.uk/library/dynamic_pages/panels/{panelId}/timetables/items","panels":[11000,10728,10796,10864,11204,11408,13695],"area_policy":"london"}'::jsonb,
   null,
   'Better Libraries (GLL)',
   true,
   'Highest-QUALITY under-5 content (Rhymetime/Bounce & Rhyme). HTML cards carry full postcode, booking mode and audience.'),

  ('lewisham-libraries',
   'Lewisham Libraries (Solus RSS)',
   'rss',
   '{"url":"https://lewisham.events.mylibrary.digital/rss","area_policy":"curated"}'::jsonb,
   null,
   'Lewisham Libraries',
   true,
   'Verified 313 items. Covers SE8 (Deptford Lounge) and SE13 (Lewisham Library). NOTE: /rss is Cloudflare-exempt but HTML and .ics are NOT — never build an HTML fallback on this host.'),

  ('spektrix',
   'Spektrix venues',
   'spektrix',
   '{"clients":["thealbany","unicorntheatre","greenwichtheatre","woolwichworks","blackheathhalls","polka","littleangeltheatre"],"area_policy":"curated"}'::jsonb,
   null,
   null,
   true,
   'Public unauthenticated API, 7 venues. Albany=SE8, Greenwich Theatre=SE10; Polka(SW19) and Little Angel(N1) are OUT of SE London. Most legally exposed source (it aggregates) — prefer venue-origin data where both exist.'),

  ('th-family-hubs',
   'Tower Hamlets Best Start Family Hubs',
   'th-family-hubs',
   '{"url":"https://www.thfamilyhubs.co.uk/api/GetEventSchedules","borough":"Tower Hamlets","area_policy":"curated"}'::jsonb,
   null,
   'Tower Hamlets Best Start Family Hubs',
   true,
   'POST {startDate,endDate}. 549 records, 406 explicitly tagged "Best Start in Life (0-5)" — the only source that DECLARES under-5 rather than requiring inference.')
on conflict (id) do nothing;

-- updated_at maintenance
create or replace function discovery_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists activities_touch_updated_at on activities;
create trigger activities_touch_updated_at
  before update on activities
  for each row execute function discovery_touch_updated_at();
