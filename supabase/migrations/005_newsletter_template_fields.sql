-- Newsletter template generator: additional fields on london_events and newsletter_advertisers

-- Recurring activity support on london_events
alter table london_events
  add column if not exists is_recurring boolean not null default false,
  add column if not exists day_of_week smallint,
  add column if not exists recurring_time text;

create index if not exists london_events_is_recurring_idx
  on london_events (is_recurring) where is_recurring = true;

-- Image/logo for newsletter advertisers (used by Presenting and Supporter blocks)
alter table newsletter_advertisers
  add column if not exists image_url text;
