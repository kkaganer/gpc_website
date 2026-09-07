/goal An unsold advertising slot renders as GPC's own invitation at the same
footprint as the paid one, in both the email and the weekly page, so nothing
collapses and nothing looks broken.

1. `renderPresentingBlock` in `newsletter-renderer.ts` currently does
   `if (!advertiser) return ''`. Replace that with a house ad at the same table
   width and the same pink top rule, dashed rather than solid: "This space" /
   "Want to feature your business?" / one line on reach / a "Talk to us about
   {month} →" mailto to the news address. Keep it tables-and-inline-styles only.
2. The Supporter block never shows an empty cell. NOTE, found on implementation:
   the EMAIL supporter block is single-slot ("Give some love to our supporter!"),
   not the four-up row this step assumed — the four-up row exists only in the web
   rail. So the email gets a house tile on its one unsold slot, and the
   fill-the-remainder logic belongs to the web: a pure `supporterSlots(supporters,
   capacity)` in `editionGroups.js` returns the cells, with the unsold remainder
   as ONE house tile spanning the leftover columns, reading "{n} spaces left this
   week →". At capacity there is no house tile.
3. The same two states on `WhatsOnEdition.jsx` from goal 04, matching the web
   artboard's dashed-border treatment.

Out of scope: no dependency upgrades. Do not change the sold-state markup of
either block. Do not touch the picks, the masthead, or the footer. Do not add
click tracking. Do not build the advertise page.

Done when: `npm run build` exits 0 AND calling `renderPresentingBlock` with a
null advertiser returns a non-empty string containing "This space" and matching
no `<img`, while the sold path still renders its image and says no such thing AND
`renderSupporterBlock` with a null advertiser returns a non-empty string saying
"spaces left" while the sold path does not AND `supporterSlots` returns 3 cells
for 2 of 4 with the house cell spanning 2, returns 4 cells and no house cell at
capacity, and one full-span house cell for none sold AND `WhatsOnEdition.jsx`
contains both house branches. Do not weaken a check to pass it. Stop after 12 tries.
