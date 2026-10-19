/goal The "Edit activity" panel can set an activity's date, a date range, and
whether it recurs — so a show like the Unicorn's "Pocket Money" reads as its full
run, not just the opening date.

1. Why it can't today: the editable allow-list `ACTIVITY_EDITABLE_FIELDS` in
   `src/lib/discoveryActivity.js:21` contains no date fields, and
   `is_recurring`/`next_occurrence` are listed as derived/unwritable (`:41`). A
   discovered activity's dates live in the `occurrences` table and are
   materialised into `london_events` by the `publish_activity()` RPC — the panel
   (`src/components/admin/ActivityEditPanel.jsx`) has no occurrence editor.
2. Give the panel date controls: a single date, an optional end date (a run),
   and a recurring toggle with day-of-week — matching what the What's On "Add
   Manually" form already models (`is_recurring` + `day_of_week`,
   `src/pages/admin/LondonEventForm.jsx`). Persist to `occurrences` (and/or the
   activity recurrence fields), then let `publish_activity()` project the range
   into `london_events.effective_end_date` (migration `026`).
3. This likely needs an RPC or a widened write path for occurrences; follow
   `CLAUDE.md` migration rules (additive, idempotent). If the `activity_review_queue`
   view needs a new column, recreate it AND re-issue `grant select … to
   authenticated` — a recreated view drops grants and fails SILENTLY otherwise.

Out of scope: unifying all three forms (brief 25) — this brief only gives the
existing panel date/range/recurrence. No change to `publish_activity()` dedupe.

Done when: `npm run build` exits 0 AND the Edit-activity panel can set date, end
date and recurring AND publishing an edited activity with an end date yields a
`london_events` row whose `effective_end_date` reflects the range. Do not weaken
a check to pass it. Stop after 14 tries.
