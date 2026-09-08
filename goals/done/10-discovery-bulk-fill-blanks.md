/goal Selected listings missing a postcode, location, website, category or age
can be given one in a single action, and a row that already has a value there is
never overwritten.

1. `planBulkFill(rows, values)` in `src/lib/discoveryFilters.js` — pure, no
   React, no Supabase. Returns `{ writes: [{ id, patch }], filled: {field: n},
   skipped: {field: n} }`. All the fill-or-skip judgement lives here so it can be
   proved by a node script; the component only sends what this returns.
2. FILL BLANKS ONLY, without exception. For each selected row and each supplied
   field, write only where that field is currently empty — null, undefined, or
   whitespace. A row that already carries a value is left alone and counted in
   `skipped`. This is the whole safety property: one careless select-all must not
   be able to stamp one venue's postcode across forty unrelated listings, and
   there is no undo.
3. A "Fill blanks" button in the existing selection toolbar opens a panel with
   postcode, venue name, address, website, category, and age min/max in months.
   Every field optional; a blank field is not applied at all, so leaving one
   empty can never clear a row.
4. Postcode fills also derive lat/lng via `geocodePostcode` — one lookup for the
   value, not one per row — and only onto rows where lat and lng are BOTH blank.
   A postcode with no map pin still never reaches the map.
5. `ConfirmModal` before writing, naming the count and each field about to be
   set. The result line reports both numbers per field, e.g. "Postcode set on 5
   listings. 3 already had one and were not changed." A silent success count
   would hide the skips, which is the number that tells the admin whether the
   fill did what they meant.
6. Rows already at status `published` get `publish_activity` re-run after the
   write, exactly as in goal 08, so a corrected row reaches `london_events`.
   Failures are reported per row and never swallowed, matching `runOn`.
7. Writes go to `activities`, excluding the generated `outcode` and `dedup_key`
   and every view-only column, same constraint as goal 08.

Out of scope: no dependency upgrades. No bulk DELETE, no bulk approve changes —
the existing approve/reject bulk buttons stay as they are. No overwrite mode and
no "force" switch: fill-blanks-only is the feature, not a default. Do not change
the fold, the ambiguous-group gate, the search or the chips from goal 09. Do not
bulk-edit `title` — two rows sharing a title is what the fold is for, and
rewriting titles in bulk would silently reshape `dedup_key`.

Done when: `npm run build` exits 0 AND a node script importing `planBulkFill`
shows: a field supplied for 8 rows of which 3 are already populated produces 5
writes and reports `skipped` 3; a field left blank in `values` appears in no
patch; a row blank in every supplied field yields one patch carrying all of
them; whitespace `'  '` counts as blank; and no returned patch contains
`outcode`, `dedup_key`, `age_range` or `upcoming_count` AND a lat/lng is
included only for rows where both were blank AND `DiscoveryManager.jsx` renders
the Fill blanks button gated on `selected.size > 0`, routes it through
`ConfirmModal`, and reports filled and skipped counts separately AND the
published-row path calls `publish_activity`. Do not weaken a check to pass it.
Stop after 15 tries.
