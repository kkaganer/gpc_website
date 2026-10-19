/goal The What's On listings can be filtered within Greenwich — peninsula,
Eltham, and so on — and it is written down what the site does with events outside
Greenwich.

1. Today `london_events` has a borough-level `area` (`Greenwich`, `Lewisham`, …)
   plus a `postcode`; there is no sub-borough/neighbourhood field. The public
   filter lives in `src/pages/WhatsOn.jsx`.
2. Introduce a neighbourhood dimension: either a new `neighbourhood` field
   (additive column, idempotent per `CLAUDE.md`) populated for Greenwich events,
   or a postcode-prefix → neighbourhood map (SE10 Greenwich/peninsula, SE9
   Eltham, SE3 Blackheath, SE18 Woolwich, …). Add a sub-area filter control on
   What's On, shown when area = Greenwich.
3. Document the outside-Greenwich behaviour: What's On currently shows
   everything approved (map + list) regardless of area; the newsletter default
   is SE-London only (brief 22). Write the current behaviour and the intended
   behaviour down so the two stay deliberate.

Out of scope: the newsletter "further to travel" section (brief 22), redrawing
the map, and official boundary data — a pragmatic postcode/neighbourhood map is
fine.

Done when: `npm run build` exits 0 AND What's On offers a within-Greenwich
sub-area filter that narrows the list AND a short note records what the site does
with non-Greenwich events. Do not weaken a check to pass it. Stop after 12 tries.
