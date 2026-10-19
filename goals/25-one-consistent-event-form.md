/goal Adding an event feels the same whichever door you came through: "Add
Manually", "Submit Event" and "Edit activity" share one field contract — same
date model (single or range, recurring), same age input, same required fields.

1. Today they are three separate components with nothing shared: public
   `src/components/whatson/SubmitEventModal.jsx` (single date, free-text age, no
   image, no recurrence), admin `src/pages/admin/LondonEventForm.jsx` (single
   date, free-text age, image, recurrence), and Discovery
   `src/components/admin/ActivityEditPanel.jsx` (NO date field, age in numeric
   MONTHS). They write to different stores (`london_events` vs
   `activities`+`occurrences`), which is the root of the divergence.
2. Define one field contract (title, venue/location, date + optional end date,
   recurring + day, a single agreed age representation, price/free, link,
   description, image) and a shared form component the three screens compose,
   each mapping to its own store on save.
3. Reconcile the age unit FIRST — months (Discovery) vs free text (What's On).
   Pick one canonical representation and convert at the edges.
4. Overlaps brief 24 (Edit-activity dates) — do 24 first or together.

Out of scope: merging the two data stores themselves, the GPC-events form
(`src/pages/admin/EventForm.jsx`, a different domain), and redesigning approval.

Done when: `npm run build` exits 0 AND the three entry points render the same
field set from one shared component AND age is captured the same way in all three
AND each still saves to its correct store. Do not weaken a check to pass it. Stop
after 16 tries.
