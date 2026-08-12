# Archived migrations

Migrations that were applied to production but are unsafe or unnecessary to
replay. They are kept for history and are NOT part of the `supabase db push`
sequence.

## 002_insert_newsletter_events.APPLIED.sql

A one-off data seed: ~40 events from the 27 Mar 2026 newsletter, inserted into
`london_events` with `approved = true`.

Archived because it shared version `002` with `002_add_map_fields.sql`. Two files
cannot share a version — the migration history table holds one row per version —
which blocked `supabase db push` entirely.

It is an unguarded `INSERT` with no `ON CONFLICT`, so re-running it would
DUPLICATE those rows in production. It has already been applied; every event in
it is dated March 2026 and is in the past. Do not move it back.
