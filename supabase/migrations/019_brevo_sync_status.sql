-- Track what actually happened at Brevo for every newsletter subscriber.
--
-- WHY. /api/subscribe wrote the email to newsletter_subscribers and then POSTed
-- the contact to Brevo, but it returned { success: true } regardless of what
-- Brevo answered, and the UI showed "You're subscribed!" on any HTTP 200. The
-- Brevo leg failed silently for five months: 27 of 29 rows in this table never
-- reached Brevo and nothing in the schema recorded that. The row's existence
-- was being treated as proof of subscription when it only ever proved we had
-- captured the address.
--
-- The fix is to make the Brevo outcome a first-class, queryable column instead
-- of an assumption. Every row now carries the status of its own sync, the last
-- error, and an attempt counter, so a failure is visible on the admin screen
-- and retryable, and the subscriber can be told the truth.

alter table newsletter_subscribers
  add column if not exists brevo_status          text not null default 'pending',
  add column if not exists brevo_synced_at       timestamptz,
  add column if not exists brevo_error           text,
  add column if not exists brevo_attempts        integer not null default 0,
  add column if not exists brevo_last_attempt_at timestamptz,
  add column if not exists source                text not null default 'website';

comment on column newsletter_subscribers.brevo_status is
  'pending = never attempted or awaiting retry; synced = Brevo confirmed the contact exists; failed = the write did not land; skipped = BREVO_API_KEY not configured on the server';
comment on column newsletter_subscribers.brevo_synced_at is
  'Set only when brevo_status = ''synced''.';
comment on column newsletter_subscribers.brevo_error is
  'Last failure message; NULL once synced.';
comment on column newsletter_subscribers.source is
  'website = /api/subscribe; backfill = brevo-backfill edge function; import = manual/CSV load.';

-- Constrain the vocabulary. Guarded so re-running this migration is a no-op
-- rather than a duplicate_object error.
alter table newsletter_subscribers
  drop constraint if exists newsletter_subscribers_brevo_status_check;

alter table newsletter_subscribers
  add constraint newsletter_subscribers_brevo_status_check
  check (brevo_status in ('pending', 'synced', 'failed', 'skipped'));

alter table newsletter_subscribers
  drop constraint if exists newsletter_subscribers_source_check;

alter table newsletter_subscribers
  add constraint newsletter_subscribers_source_check
  check (source in ('website', 'backfill', 'import'));

-- BACKFILL: deliberately none. Existing rows stay at the 'pending' default.
--
-- The brevo-backfill edge function has already been run against the 29 rows
-- that predate this migration, so some of them ARE in Brevo now — but which
-- ones is not knowable from SQL, because nothing recorded the outcome at the
-- time. Guessing 'synced' would recreate exactly the bug this migration
-- exists to kill (claiming a sync we cannot prove). Guessing 'failed' would
-- be equally invented.
--
-- 'pending' is the honest answer and the safe one: the admin retry-all pass
-- picks up everything that is not 'synced' and re-checks it against Brevo,
-- which settles each row to its true state. Re-adding a contact that already
-- exists is a no-op because syncContactToBrevo sends updateEnabled: true, so
-- the retry is idempotent and costs nothing but an API call per row.

-- The admin subscribers screen and the retry-all pass both filter on exactly
-- "not yet synced". Synced rows are expected to be the overwhelming bulk of
-- the table, so a partial index keeps that lookup proportional to the problem
-- rows rather than to the whole list.
create index if not exists newsletter_subscribers_brevo_unsynced_idx
  on newsletter_subscribers (brevo_status)
  where brevo_status <> 'synced';

-- RLS: intentionally unchanged.
--
-- The table already has "Anyone can subscribe" (INSERT), "Authenticated users
-- can view subscribers" (SELECT) and "Authenticated users can delete
-- subscribers" (DELETE). Every write to the new columns happens server-side
-- through the service-role key, which bypasses RLS entirely, so no UPDATE
-- policy is required and adding a permissive one would only widen the surface.
--
-- CAVEAT worth knowing: the anon "Anyone can subscribe" policy has no WITH
-- CHECK restriction on the new columns, so a client holding the anon key can
-- still INSERT a row directly with brevo_status = 'synced' and a fabricated
-- brevo_synced_at. The status column therefore only means something for rows
-- created by /api/subscribe — the public path must go through that endpoint.
-- Not fixed here: tightening the INSERT policy would need coordination with
-- every existing client write path, and is a separate change.

-- Verification — paste into the SQL editor after running:
--
-- select brevo_status,
--        source,
--        count(*)                                  as rows,
--        min(subscribed_at)                        as oldest,
--        max(brevo_last_attempt_at)                as last_attempt,
--        count(*) filter (where brevo_error is not null) as with_error
-- from newsletter_subscribers
-- group by brevo_status, source
-- order by brevo_status, source;
