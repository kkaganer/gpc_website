/goal A listing with no area is no longer silently dropped from the picks, and
the editor can add a "Further to travel" section for one or two events outside
SE London, like the old newsletter had.

1. Root cause of "community listings sometimes don't show". The picks query
   filters by `area`: `se-london` → `area IN SE_LONDON_AREAS`,
   `outside-se-london` → `area NOT IN (...)`. A row with a NULL/blank `area`
   matches NEITHER (SQL `NOT IN` is not-true for NULL), so it vanishes. See the
   mirrored queries `supabase/functions/generate-newsletter/index.ts` and
   `src/lib/newsletter/resolveData.ts:34`; `SE_LONDON_AREAS` at
   `newsletter-renderer.ts:393`. Decide the fix: treat blank-area approved
   events as includable (an explicit "unspecified" bucket) and/or warn in the
   admin list so blank areas get filled. Note "Central London" is selectable in
   the admin dropdown (`LondonEventForm.jsx:31`) but is NOT in `SE_LONDON_AREAS`,
   so it is excluded too.
2. "Further to travel" section. The renderer/resolver already understand
   `areas:'outside-se-london'`, but the editor exposes no area control (the
   eventSection panel only has title/layout/limit,
   `NewsletterSectionEditor.jsx:989`). Add an area selector to that panel
   (SE London / Outside SE London / All) so Aster can drop in a small "Further
   to travel" picks block.

Out of scope: sub-borough Greenwich filtering (brief 31), the
free-listings-to-`london_events` gap (`src/lib/freeListings.js`), and changing
the default edition's single SE-London picks block.

Done when: `npm run build` exits 0 AND an approved event with a blank `area` is
no longer dropped from a default edition (resolver fixture) AND the eventSection
editor panel offers an area choice that produces an `outside-se-london` section.
Do not weaken a check to pass it. Stop after 10 tries.
