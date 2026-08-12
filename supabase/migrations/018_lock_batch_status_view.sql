-- Views do not enforce the underlying table's RLS by default, so
-- `ingest_batch_status` was readable with the anon key despite ingest_batches
-- being authenticated-only. Verified against production: an anon PostgREST read
-- returned live batch rows.
--
-- The data is aggregate counts rather than anything sensitive, but it should
-- match the stated intent — and it exposes source names and error strings.
alter view ingest_batch_status set (security_invoker = on);
revoke select on ingest_batch_status from anon;
grant  select on ingest_batch_status to authenticated;
