/goal A dated What's On URL serves the weekly edition as a real page — hero,
presenting slot, events grouped by theme, sticky rail — alongside the existing
map browser at `/whats-on`, which does not change.

1. New `src/lib/editionGroups.js` exporting two pure functions.

   `groupEvents(events)` returns an ordered array of `{key, label, note, count,
   events}`. Grouping is a fixed, curated map from `category` to group, NOT the
   raw category — the live data is 57% "Family" with a tail that includes a venue
   name ("Move Games Camberwell"), a lone "Museum" and an empty string, so raw
   categories would give one enormous bucket, several groups of one, and a
   nav that changes shape every week. Define the group order in the module, map
   known categories onto it, and send everything unrecognised to a final catch-all
   group. Empty groups are dropped; every input event lands in exactly one group.

   `priceLabel(event)` returns `{text, bg, fg}` — "Free" on a mint plate when
   `is_free`, otherwise the `price` string on a neutral one.
2. New `src/pages/WhatsOnEdition.jsx` rendering artboard B: hero (edition date,
   pink rule, event count), presenting slot, a "Jump to" row of group pills with
   counts, the grouped list as rows of `dow / day | title + meta | price pill`,
   and a sticky rail. Use the existing `font-heading`, `text-dark`, `bg-primary`
   tokens; the design's `<image-slot>` is a canvas-only placeholder, so render a
   plain `<img>` from `image_url`.
3. Rail: supporters from `newsletter_advertisers` where `ad_type = 'logo-sponsor'`
   in equal tiles using `logo_bg`, the subscribe box posting to the existing
   `/api/subscribe`, and the Summer Fair card.
4. Presenting slot from `ad_type = 'featured-ad'`, honouring `is_brand_sponsor`
   for the brand-mode variant, with the "paid placement" label the design shows.
5. Route `/whats-on/:date` in `App.jsx`. The existing `/whats-on` route and the
   map page stay exactly as they are.
6. Fix `api/og/whats-on.js`: it currently emits `/src/main.jsx`, Vite's dev entry,
   which 404s in production. Replace `renderDocument(meta)` with a pure exported
   `injectMeta(baseHtml, meta)` that swaps the title and og tags in the built
   `index.html` while leaving its hashed `/assets/` script tag untouched, and have
   the handler fetch that document from its own origin. Keep the existing
   degrade-to-generic behaviour on a bad date.

7. Responsive behaviour, which the design file does not cover — it is a 1280px
   desktop comp with no `@media` anywhere, and the audience is mostly on phones.
   Mobile first, using the breakpoints already in the project: the rail moves
   below the list rather than beside it, the presenting card stacks image above
   text, the "Jump to" pills scroll horizontally instead of wrapping, and an
   event row keeps its date block, title and price legible without truncation.
8. The three data states the design also does not cover: a loading state while
   the edition fetches, an empty state for a date with no approved events that
   links back to `/whats-on` rather than rendering a bare page, and a fetch
   failure that shows a message instead of blanking. An empty week is a normal
   outcome, not an error.

Out of scope: no dependency upgrades. Do not touch `src/pages/WhatsOn.jsx`, the
map, the filters, or the submit modal. Do not clean up or re-categorise the
`london_events` rows — the catch-all group is how bad categories are absorbed.
Do not build the advertise page. Do not build the unsold-slot house ads. Do not
add click tracking. Do not change the newsletter renderer.

Done when: `npm run build` exits 0 AND `App.jsx` contains both `whats-on/:date`
and `path="/whats-on"` AND node can import `groupEvents` and on a 41-event
fixture whose categories include "Family", "Arts", "" and "Move Games Camberwell"
the group counts sum to 41, no group is empty, and both the empty string and the
venue-name category land in the same catch-all group AND `priceLabel` returns
text "Free" for `{is_free:true}` AND node can import `injectMeta` and passing a
document containing `<script type="module" crossorigin src="/assets/index-abc.js">`
returns HTML that still contains `/assets/index-abc.js` and contains the new
og:title AND `api/og/whats-on.js` contains no `/src/main.jsx` AND `groupEvents([])`
returns an empty array without throwing AND `WhatsOnEdition.jsx` carries a
responsive breakpoint class on the list/rail container and distinct loading,
empty and error branches. Do not weaken a check to pass it. Stop after 12
tries.
