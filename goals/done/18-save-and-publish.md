/goal Editing a pending event can end in one click that publishes it, instead of
only "Update" that saves it back onto the Pending pile where it is hard to find
again.

1. What's On form. `src/pages/admin/LondonEventForm.jsx:423` renders only
   "Update Event" / "Add Event" and preserves the row's existing `approved`
   value, then navigates back to the Pending tab (`:138`). Add a second button,
   "Save & Publish", that saves with `approved: true`. Keep plain "Update" for
   saving without publishing.
2. Discovery panel. The "Edit activity" save
   (`src/hooks/useDiscoveredActivities.js:151`) only republishes if the activity
   was ALREADY published, so editing a pending activity leaves it pending and
   you must separately click "Approve and publish". Add a "Save & publish"
   affordance that writes the edit and calls `publish_activity()` in one step.
3. After publishing, land somewhere useful (the Approved tab or the row), not
   back on Pending.

Out of scope: unifying the two status models (boolean `approved` vs `status`
enum — that is brief 25), bulk actions, and any new status value.

Done when: `npm run build` exits 0 AND `LondonEventForm` exposes a control that
saves with `approved:true` AND editing a pending discovered activity can publish
it without a second click AND `grep -rn "Save & [Pp]ublish" src` finds both. Do
not weaken a check to pass it. Stop after 8 tries.
