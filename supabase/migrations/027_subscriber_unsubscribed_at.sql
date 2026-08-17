-- Give newsletter_subscribers somewhere to record that a person opted out.
--
-- WHY. Brevo holds 765 contacts; this table holds 32. The ~733 difference came
-- in through the Brevo-hosted signup form, which posts straight to Brevo and
-- never touched this database, so Brevo is currently the only record those
-- people exist. The import that follows makes this table the source of truth
-- for who gets emailed, and Brevo the downstream copy.
--
-- The problem that forces this column: some of those contacts carry
-- emailBlacklisted = true, which is Brevo's way of saying they unsubscribed or
-- were suppressed. That flag is the ONLY record of their opt-out, and there is
-- nowhere in this schema to put it. Without somewhere to put it an import has
-- exactly two options, and both are wrong:
--
--   * Import them as ordinary rows. They arrive indistinguishable from active
--     subscribers, and the next send goes to people who explicitly left. Under
--     UK PECR/GDPR that is not untidiness, it is mailing someone who withdrew
--     consent.
--   * Drop them. The opt-out disappears with them. A suppression list only
--     works if you keep it: the moment anyone re-imports from Brevo, or one of
--     them fills in the signup form again, the person is silently re-added with
--     no trace that they ever opted out. The record of a "no" has to outlive
--     the person's absence from the list.
--
-- So the opt-out gets imported too, with unsubscribed_at set. This is a consent
-- record, not a status field. brevo_status describes whether a sync worked and
-- is safe to change on retry; unsubscribed_at describes a decision a human made
-- about their own data and is only ever set by that human's action.
-- Downstream queries can then exclude these people explicitly, by a stated
-- "where unsubscribed_at is null", rather than by their happening not to be in
-- the table.

-- Nullable, and deliberately NOT defaulted: null means "still subscribed", and
-- every one of the existing 32 rows is. A default would date-stamp an opt-out
-- nobody made.
alter table newsletter_subscribers
  add column if not exists unsubscribed_at timestamptz;

comment on column newsletter_subscribers.unsubscribed_at is
  'Consent record, not a status. Non-null = DO NOT EMAIL: this person unsubscribed or was suppressed (imported from Brevo emailBlacklisted, or set when they opt out here), and the value is the moment we learned of it. Every send query must filter "where unsubscribed_at is null". Any future import, re-import or Brevo sync MUST preserve a non-null value and must never clear it back to null — clearing it silently re-subscribes someone who left.';

-- Every "who do we send to" query filters to still-subscribed, and after the
-- Brevo import the still-subscribed rows are the overwhelming majority of the
-- table. A partial index on the null side keeps that lookup covering only the
-- rows a send actually touches, and stays small because the unsubscribed set is
-- never scanned by the mailing path — it only has to be preserved and consulted
-- on import. (A plain b-tree over the whole column would index the opt-outs too
-- and buy nothing: nothing queries "where unsubscribed_at is not null" in bulk.)
create index if not exists newsletter_subscribers_subscribed_idx
  on newsletter_subscribers (unsubscribed_at)
  where unsubscribed_at is null;

-- BACKFILL: deliberately none. Every existing row stays null, which is the
-- truthful reading — nothing in the current schema recorded an opt-out, so
-- there is no opt-out here to migrate. The Brevo import supplies the non-null
-- values, from emailBlacklisted, at the moment it reads them.

-- RLS: intentionally unchanged, for the same reason as 019. The import runs
-- server-side under the service-role key, which bypasses RLS, so no new policy
-- is needed. Note the caveat 019 already flagged still applies: "Anyone can
-- subscribe" has no WITH CHECK on the new column, so a client holding the anon
-- key could INSERT a row with unsubscribed_at pre-set. That direction is
-- harmless (it suppresses rather than exposes); the dangerous direction,
-- clearing an existing non-null value, needs UPDATE, which anon does not have.

-- Verification — paste into the SQL editor after running:
--
-- select source,
--        count(*)                                           as rows,
--        count(*) filter (where unsubscribed_at is null)     as subscribed,
--        count(*) filter (where unsubscribed_at is not null) as unsubscribed,
--        min(unsubscribed_at)                                as first_optout,
--        max(unsubscribed_at)                                as last_optout
-- from newsletter_subscribers
-- group by rollup (source)
-- order by source nulls last;
