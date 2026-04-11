-- Brand-first sponsor flag: when true, the Presenting block in the newsletter
-- renders the advertiser's brand (logo + name + tagline) instead of a ticketed
-- event. Lets sponsors who just want to advertise their business appear in the
-- spotlight slot without needing an event.

alter table newsletter_advertisers
  add column if not exists is_brand_sponsor boolean not null default false;
