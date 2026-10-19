-- Lock the Discovery review queue (and an unused diagnostic view) to signed-in users.
--
-- WHY. Supabase's default privileges on schema `public` grant `anon` ALL on every
-- new table and view. A view runs with its owner's rights, so it bypasses the RLS
-- on the table underneath. Every migration that (re)created `activity_review_queue`
-- (009, 024, 025, 032, 035) granted `authenticated` but never revoked `anon` — so
-- anyone holding the public anon key could read the whole review queue, pending
-- and rejected listings included, while `activities` itself returns nothing to
-- them. Checked live: GET /rest/v1/activity_review_queue with the anon key
-- returned pending rows; GET /rest/v1/activities returned [].
--
-- Only the admin Discovery screen (authenticated) reads the queue. Nothing in the
-- app reads `term_time_coverage`. Other admin views (ingest_batch_status,
-- london_events_duplicate_groups) were already locked; the public_* views stay
-- public on purpose.
--
-- ANY FUTURE MIGRATION THAT RECREATES ONE OF THESE VIEWS MUST REPEAT THE REVOKE —
-- the default privileges re-grant anon on every create.

revoke all on activity_review_queue from anon;
grant select on activity_review_queue to authenticated;

revoke all on term_time_coverage from anon;
