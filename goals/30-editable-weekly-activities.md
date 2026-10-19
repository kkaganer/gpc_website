/goal Aster can update the weekly activities herself — starting with Blackheath
— without a code change.

1. The weekly activities are a static data file, `src/data/weeklyEvents.js`
   (sibling of `activities.js`, `communities.js`). Blackheath is edited there
   today only by changing code.
2. Two options, cheapest first:
   - (a) Stopgap: correct the Blackheath entry in `weeklyEvents.js` now.
   - (b) The real ask: make weekly activities admin-editable — move them to a
     Supabase table + an admin screen (follow the Discovery / What's On admin
     patterns), or at minimum a simple editor over the existing shape.
   Confirm with Aster whether a one-off fix is enough for now or she wants
   ongoing editing.
3. Check everywhere `weeklyEvents.js` is consumed so an admin-backed source is a
   drop-in.

Out of scope: merging weekly activities with the What's On event store, and
recurrence maths beyond what the current shape holds.

Done when: EITHER the Blackheath entry is corrected and `npm run build` exits 0
(stopgap) OR weekly activities are editable from the admin and persist (full) —
whichever Aster chose, stated at the top of the change. Do not weaken a check to
pass it. Stop after 10 tries.
