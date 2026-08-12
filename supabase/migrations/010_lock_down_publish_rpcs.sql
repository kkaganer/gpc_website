-- SECURITY FIX for migration 009.
--
-- 009 created publish_activity / unpublish_activity / reject_activity as
-- SECURITY DEFINER and granted EXECUTE to `authenticated`. That grant was
-- redundant and did NOT restrict anything: PostgreSQL grants EXECUTE on new
-- functions to PUBLIC by default, so `anon` retained access. Because the
-- functions are SECURITY DEFINER they also bypass RLS.
--
-- Verified against production: an anonymous PostgREST call to
--   POST /rest/v1/rpc/reject_activity   returned 204
--   POST /rest/v1/rpc/unpublish_activity returned 200
-- i.e. an unauthenticated visitor could delete published rows from
-- `london_events` and flip activities to rejected.
--
-- The fix is to REVOKE from PUBLIC (which is what actually holds the grant),
-- then grant only to `authenticated`. Admin pages already require auth, so no
-- application change is needed.

revoke execute on function publish_activity(uuid, integer)  from public;
revoke execute on function unpublish_activity(uuid)         from public;
revoke execute on function reject_activity(uuid, text)      from public;

-- `anon` and `authenticated` inherit from PUBLIC, but revoke explicitly too so
-- the intent is unambiguous and survives a role-grant change.
revoke execute on function publish_activity(uuid, integer)  from anon;
revoke execute on function unpublish_activity(uuid)         from anon;
revoke execute on function reject_activity(uuid, text)      from anon;

grant execute on function publish_activity(uuid, integer)   to authenticated;
grant execute on function unpublish_activity(uuid)          to authenticated;
grant execute on function reject_activity(uuid, text)       to authenticated;

-- Same defaulting applies to the helper functions. They are read-only and
-- IMMUTABLE so exposure is harmless, but keep the surface tight.
revoke execute on function discovery_age_text(integer, integer) from public, anon;
grant  execute on function discovery_age_text(integer, integer) to authenticated;
