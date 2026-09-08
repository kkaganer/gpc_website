/goal Every row in the Discovery queue can be corrected before it is approved,
in a slide-over panel that leaves the queue exactly where it was.

1. Migration `032_review_queue_editable_fields.sql`: recreate
   `activity_review_queue` adding `address`, `lat`, `lng`, `booking_url`,
   `source_url`. The view is an EXPLICIT column list and a missing column fails
   silently — the hook calls `.select('*')`, which expands to the view's columns,
   not the table's, so the panel would render blank fields with no error. 025's
   header says exactly this; this is the fourth recreate for the same reason.
   Drop and recreate in full (`create or replace` cannot insert a column), and
   re-issue `grant select on activity_review_queue to authenticated` — a
   recreated view does not inherit its grants, and dropping that line locks the
   admin panel out of its own queue.
2. A pencil button on `ActivityRow`, standalone and nested alike, opens
   `ActivityEditPanel` — a fixed right-hand slide-over, NOT a route. Nothing in
   the queue unmounts, so scroll position, `expanded` and `selected` all survive
   the edit. That is the same property the `loading` comment in
   `useDiscoveredActivities` exists to protect; a route would throw it away.
3. The panel writes to `activities` directly — RLS "Authenticated can manage
   activities" (008:300) already allows it — never to the view. The update
   payload must EXCLUDE the generated columns `outcode` and `dedup_key`
   (Postgres rejects a write to either) and the view-only fields `age_range`,
   `source_name`, `attribution`, `is_recurring`, `next_occurrence`,
   `upcoming_count`. Editable: title, venue_name, address, postcode, borough,
   deep_link, booking_url, description, category, age_min_months,
   age_max_months, is_free, price_text, term_time_only, lat, lng.
4. A postcode saved with lat/lng blank derives them via `geocodePostcode`, as
   `LondonEventForm` does. A hand-typed lat/lng always wins.
5. Saving a row already at status `published` re-runs `publish_activity` for it.
   That RPC upserts on `(activity_id, date)` (011), so the correction reaches
   `london_events`; without it an edit on the Published tab changes nothing the
   public can see, which is the failure that looks like the feature not working.

Out of scope: no dependency upgrades. Do not change `publish_activity`,
`reject_activity`, or the approve/reject flow. Do not touch `buildGroups`, the
fold, or the ambiguous-group gate. No search, no gap filters, no bulk edit —
those are goals 09 and 10. Do not add an image field: `activities` has no image
column, and inventing one is a schema change.

Done when: `npm run build` exits 0 AND
`supabase/migrations/032_review_queue_editable_fields.sql` exists naming all of
`address`, `lat`, `lng`, `booking_url`, `source_url` and
`grant select on activity_review_queue to authenticated` AND that migration is
applied (`supabase migration list --linked` shows 032 on the remote side) AND a
node script confirms the live view returns those five columns AND
`DiscoveryManager.jsx` renders a per-row edit control and a panel whose save
calls `.from('activities').update(`, with a payload naming none of `outcode`,
`dedup_key`, `age_range`, `source_name`, `upcoming_count` AND that save path
calls `publish_activity` guarded on the row being `published` AND opening or
closing the panel runs no `setExpanded(new Set())` or `setSelected(new Set())`.
Do not weaken a check to pass it. Stop after 14 tries.
