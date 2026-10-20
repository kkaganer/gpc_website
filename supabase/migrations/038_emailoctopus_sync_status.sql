-- Track the EmailOctopus push per subscriber, the way 019 tracked Brevo.
--
-- WHY. Newsletters now go out from EmailOctopus and Brevo is no longer used. The
-- EmailOctopus list was loaded by hand on 2026-09-11 and nothing pushed to it
-- after that: website sign-ups landed in Supabase, were "skipped" for Brevo
-- (the Vercel key had been removed) and reached no mailing list at all. These
-- columns record whether each row reached EmailOctopus, so a failure shows up
-- on the admin Subscribers screen instead of silently.
--
-- `emailoctopus_status = 'synced'` also does a second job for the nightly sync
-- (api/_lib/subscriber-sync.js): a synced row that later goes MISSING from the
-- list was deleted there, and is treated as an opt-out rather than re-created.
-- A pending/failed row that is missing simply has not been pushed yet.
--
-- The brevo_* columns from 019 are left in place. Dropping them is a separate,
-- approved step.

alter table newsletter_subscribers
  add column if not exists emailoctopus_status          text not null default 'pending',
  add column if not exists emailoctopus_synced_at       timestamptz,
  add column if not exists emailoctopus_error           text,
  add column if not exists emailoctopus_attempts        integer not null default 0,
  add column if not exists emailoctopus_last_attempt_at timestamptz;

comment on column newsletter_subscribers.emailoctopus_status is
  'pending = not pushed yet; synced = EmailOctopus confirmed the contact is on the list; failed = the push did not land; skipped = EMAILOCTOPUS_API_KEY not configured on the server';
comment on column newsletter_subscribers.emailoctopus_synced_at is
  'Set only when emailoctopus_status = ''synced''.';
comment on column newsletter_subscribers.emailoctopus_error is
  'Last failure message; NULL once synced.';

-- Added only when missing, so a retry is harmless without a DROP.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'newsletter_subscribers_emailoctopus_status_check'
  ) then
    alter table newsletter_subscribers
      add constraint newsletter_subscribers_emailoctopus_status_check
      check (emailoctopus_status in ('pending', 'synced', 'failed', 'skipped'));
  end if;
end $$;

create index if not exists newsletter_subscribers_emailoctopus_unsynced_idx
  on newsletter_subscribers (emailoctopus_status)
  where emailoctopus_status <> 'synced';
