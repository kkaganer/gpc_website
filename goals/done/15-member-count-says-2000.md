/goal The site and the newsletter say the community is 2,000+, not 1,800+ — one
number, changed everywhere it is written by hand.

1. `src/utils/constants.js:42` — `ORG.memberCount` is `'1,800+'`. This is the
   single source for the homepage stats band (`src/components/home/Stats.jsx`)
   and the hero (`src/components/home/Hero.jsx`). Change it to `'2,000+'`.
2. The number is ALSO hardcoded as prose, not read from the constant, so grep
   and change each: `src/components/about/Story.jsx:39` ("over 1,800 members")
   and the "1,800+ Members" milestone title in
   `src/components/about/Milestones.jsx`.
3. The newsletter carries its own copy: `supabase/functions/_shared/newsletter-renderer.ts:1041`,
   the house-ad line "One business per edition reaches 1,800+ Greenwich parents
   here." Change the number there too.
4. Agree the noun with Aster first: the site says "members" / "parents and
   carers", the feedback says "families". This brief only moves the NUMBER; keep
   the existing noun unless she says otherwise.

Out of scope: the dated historical milestones ("500+ subscribers", "300+
families" in `Milestones.jsx`; "400 families" in `ChristmasFair.jsx`) — those
record a moment, not the live count. No change to the stats layout, no new data
source for the count.

Done when: `npm run build` exits 0 AND `grep -rn "1,800" src supabase/functions/_shared/newsletter-renderer.ts`
returns only dated milestones (no live-count hit) AND the hero and stats band
both render "2,000+". Do not weaken a check to pass it. Stop after 6 tries.
