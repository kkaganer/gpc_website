-- A public, column-limited view of the advertisers shown on the weekly page.
--
-- `newsletter_advertisers` is authenticated-only by design (004): its rows carry
-- `contact_email` and internal `notes`. The weekly edition page is public and
-- needs the presenting slot and the supporter logos, so it needs *some* of those
-- rows -- but must never be able to reach the contact details.
--
-- Hence a view rather than a new policy on the table. RLS is row-level, not
-- column-level, so an anon SELECT policy on the base table would expose every
-- column of a matching row. The view names the safe columns explicitly and is
-- the only thing anon is granted.
--
-- It deliberately runs with definer's rights (security_invoker = false) so it
-- sees past the base table's authenticated-only policies. That is the point of
-- it: the filtering is the WHERE clause and the column list, both fixed here.
-- Supabase's linter flags definer views as a category; this one is intentional.
--
-- Only confirmed and included bookings are public. Pending is a sales
-- conversation, not a placement, and must not appear on the site.

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
    newsletter_date
  from newsletter_advertisers
  where status in ('confirmed', 'included');

alter view public_newsletter_advertisers set (security_invoker = false);

grant select on public_newsletter_advertisers to anon, authenticated;
