/goal The Discovery queue can be narrowed by free text and by what is missing,
and the header checkbox selects exactly the rows the narrowing left on screen.

1. `src/lib/discoveryFilters.js` — pure, node-importable, no React, in the style
   of `editionGroups.js`. Exports `matchesSearch(row, term)` and
   `hasGap(row, gap)`. Putting the predicates here rather than inline in the
   component is what makes them checkable without a browser; there is no test
   suite, so a helper that cannot be imported cannot be verified.
2. A search box above the table, following `SubscribersManager`'s pattern —
   `Search` icon absolutely positioned left, real `aria-label`. Matches
   case-insensitively, on any of title, venue_name, address, postcode, borough,
   source_name, category, description. Trimmed; empty means no narrowing.
3. Three gap chips, each a toggle carrying its own count for the current tab.
   Each is defined by the downstream damage it causes, not by a hunch:
   - **no postcode** — `postcode` blank. No postcode also means no map pin and a
     `dedup_key` that collides across unrelated venues (025).
   - **no location** — `address` AND `venue_name` both blank. `publish_activity`
     coalesces address → venue → postcode → borough into the NOT NULL
     `london_events.location`, so these publish as "Location to be confirmed".
   - **no website** — `deep_link`, `booking_url` and `source_url` all blank.
     That coalesce is `london_events.url`, so these publish with no way to book.
4. Chips OR with each other, and AND with the search box and the existing
   AI-guessed-ages filter. OR is deliberate: the chips build a worklist of
   broken rows, so a second chip must GROW the list. Under AND the second click
   would almost always empty the screen, which reads as the filter being broken.
5. `visible` becomes the search + chip + AI-ages filtered set. `groups`,
   `blockedIds`, `selectableRows` and `allSelected` already derive from
   `visible`, so select-all inherits the narrowing with no new selection logic —
   and the ambiguous-group exclusion keeps working unchanged. The header
   checkbox's title must say how many rows it will take.
6. Selection survives a change of search or chips, but the bulk buttons act on
   `selected` INTERSECTED with what is on screen, and the toolbar says so when
   the two differ ("8 listings selected · 3 hidden by the current filter"). The
   existing `useEffect` clears selection on every filter change; keeping that
   would wipe the selection on each keystroke, making "search, then select all"
   impossible — which is the thing this goal exists to enable. The safety
   property it protected (never act on an off-screen row) is preserved by the
   intersection instead. Changing tab still clears everything.

Out of scope: no dependency upgrades. No debounce library — plain state is
enough at 500 rows. Do not change the fold, the ambiguous-group gate, the
approve/reject flow, or the edit panel from goal 08. No server-side search: the
hook already caps at 500 rows and filters in memory. No bulk edit — goal 10.

Done when: `npm run build` exits 0 AND a node script importing
`src/lib/discoveryFilters.js` shows `matchesSearch` is case-insensitive and
matches on venue and postcode as well as title, and that `hasGap` returns true
for the blank case and false for the populated case of each of the three gaps,
including a row with a `booking_url` but no `deep_link` counting as HAVING a
website AND `DiscoveryManager.jsx` renders a search input and three gap chips
AND `selectableRows` is still derived from `visible` and `visible` is the
filtered set, so a search of one row makes select-all select one row AND no
`useEffect` clears `selected` on a search-term change AND the bulk handlers
intersect `selected` with the on-screen ids before acting. Do not weaken a check
to pass it. Stop after 14 tries.
