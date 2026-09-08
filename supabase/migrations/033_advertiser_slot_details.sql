-- Structured details for the presenting slot.
--
-- The Tier 1 card shows When / Price / Where as a labelled table and carries the
-- advertiser's own call to action ("Book a trial class"), not the hardcoded
-- "Tickets" the renderer used to emit. Until now there was nowhere to put any of
-- that, so it was crammed into event_description as prose and lost its structure
-- the moment it was rendered.
--
-- Nullable on purpose. A booking taken before this migration has none of these,
-- and the card must render without them rather than showing empty label rows.

alter table newsletter_advertisers
  add column if not exists event_when text,
  add column if not exists event_price text,
  add column if not exists event_where text,
  add column if not exists cta_label text;

-- The weekly edition page reads the column-limited view from 030, not the base
-- table, so the new columns have to be named there too or the public presenting
-- slot silently renders without them: the page selects '*', which expands to the
-- VIEW's columns, and a missing field arrives as undefined with no error.
--
-- Appended at the end of the list so `create or replace` is legal -- changing the
-- position or type of an existing column would require a drop, and dropping this
-- view would take its grants with it.
create or replace view public_newsletter_advertisers as
  select
    id,
    advertiser_name,
    event_title,
    event_description,
    event_url,
    image_url,
    logo_bg,
    is_brand_sponsor,
    ad_type,
    newsletter_date,
    event_when,
    event_price,
    event_where,
    cta_label
  from newsletter_advertisers
  where status in ('confirmed', 'included');

alter view public_newsletter_advertisers set (security_invoker = false);

-- Re-issued deliberately: a recreated view does not inherit the grants of the one
-- it replaced, and without this the public edition page loses its advertisers.
grant select on public_newsletter_advertisers to anon, authenticated;
