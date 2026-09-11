-- The week's welcome message, readable by the public edition page.
--
-- The guide lives on the website now (029), which left the intro written in the
-- editor reaching the email and nothing else -- so the page carried the week's
-- listings under a stock sentence and read as a directory rather than as the
-- edition it is. This is the one piece of the draft the page is missing.
--
-- A view rather than a policy on the table, for exactly the reason 030 gives:
-- `newsletter_drafts` is authenticated-only by design (001) and a row carries
-- the whole unsent edition -- content_html, events_included, the resolved
-- snapshot. RLS is row-level, not column-level, so an anon SELECT policy would
-- hand all of that over. The view names the two safe strings explicitly and is
-- the only thing anon is granted.
--
-- Definer's rights (security_invoker = false) so it sees past the base table's
-- authenticated-only policies. That is the point of it: the filtering is the
-- column list, fixed here. Supabase's linter flags definer views as a category;
-- this one is intentional, same as 030.
--
-- NOT gated on status. The editor saves every draft as 'draft' and 'sent' is set
-- by hand afterwards, so a status filter would hide the welcome during the only
-- hours it matters -- the Friday the link is shared. The trade is that a week
-- drafted ahead shows its intro early, which costs nothing: /whats-on/{date} is
-- already public for future dates and already lists those events.
--
-- One row per week. A week regenerated three times has three drafts, and the
-- page must show the newest rather than whichever the planner happened to pick.

create or replace view public_newsletter_intros as
  select distinct on (d.week_of)
    d.week_of,
    intro.block ->> 'message'   as message,
    intro.block ->> 'signature' as signature
  from newsletter_drafts d
  -- LEFT, so a draft with no intro block still contributes its week and can win
  -- the distinct-on. An inner join would silently fall through to an older draft
  -- whose intro the editor had since removed.
  left join lateral (
    select b as block
    from jsonb_array_elements(
           case jsonb_typeof(d.content_json -> 'config' -> 'blocks')
             when 'array' then d.content_json -> 'config' -> 'blocks'
             else '[]'::jsonb
           end
         ) as b
    where b ->> 'type' = 'intro'
      -- A block switched off in the editor is off on the page too. Absent means
      -- on: every config the editor writes sets it, but a legacy one may not.
      and coalesce((b ->> 'enabled')::boolean, true)
    limit 1
  ) intro on true
  order by d.week_of, d.updated_at desc nulls last;

alter view public_newsletter_intros set (security_invoker = false);

grant select on public_newsletter_intros to anon, authenticated;
