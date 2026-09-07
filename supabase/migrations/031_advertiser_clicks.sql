-- Click counts for paid advertising slots.
--
-- Tiers 1 and 2 both promise the advertiser a weekly click count, and until now
-- there was nothing to produce that number from.
--
-- Deliberately records nothing about the person clicking: no IP, no user agent,
-- no cookie, no session. The promise to advertisers is a COUNT, and a count is
-- all this table can answer. Anything more would be surveillance we did not ask
-- parents to accept in exchange for reading a listings page.

create table if not exists advertiser_clicks (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references newsletter_advertisers(id) on delete cascade,
  edition_date date not null,
  -- Which surface the click came from, so email and web can be reported apart.
  source text not null check (source in ('email', 'web')),
  clicked_at timestamptz not null default now()
);

-- The reporting query is always "this advertiser, this edition".
create index if not exists advertiser_clicks_advertiser_edition_idx
  on advertiser_clicks (advertiser_id, edition_date);

alter table advertiser_clicks enable row level security;

-- Insert-only for anon: the redirect endpoint runs unauthenticated, because the
-- person clicking a link in an email is not signed in to anything of ours.
-- There is no anon SELECT policy, so a click cannot be read back by the public.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'advertiser_clicks' and policyname = 'Anyone can record a click'
  ) then
    create policy "Anyone can record a click" on advertiser_clicks
      FOR INSERT TO anon, authenticated WITH CHECK (true);
  end if;
end $$;

-- Reading the counts is an admin job.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'advertiser_clicks' and policyname = 'Authenticated users can read clicks'
  ) then
    create policy "Authenticated users can read clicks" on advertiser_clicks
      FOR SELECT TO authenticated USING (true);
  end if;
end $$;
