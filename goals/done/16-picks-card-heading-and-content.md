/goal The picks section is headed "This week's top picks", and every pick — not
just the first — shows its venue and its description, so Aster can edit copy down
rather than having nothing to edit.

1. Heading. The default title "This week's picks" lives in two MIRRORED files
   that must change together: `src/lib/newsletter/defaults.ts:39` and
   `supabase/functions/generate-newsletter/index.ts:62`. The empty-title
   fallback is `supabase/functions/_shared/newsletter-renderer.ts:926`
   (`block.title || "This week's picks"`). The admin help mentions it at
   `src/pages/admin/Help.jsx:264`. Change all to "This week's top picks".
2. Description on every pick. `renderPickRow` (`newsletter-renderer.ts:903`)
   suppresses the description on picks #2–#5 with
   `const description = lead && ev.description ? … : ''`. Drop the `lead &&`
   guard so every pick that has a description renders one; keep the lead's
   larger type.
3. Update the editor note that says "The first pick gets its description; the
   rest are title and details only" (`src/pages/admin/NewsletterSectionEditor.jsx:1037`,
   and the same claim in `Help.jsx:262`).
4. Venue already renders when present — `eventMetaLine`
   (`newsletter-renderer.ts:700`) uses `ev.location || ev.venue`. Picks with a
   blank location show no venue; that blank gap is brief 22, not this one.

Out of scope: the long-form list layout (unused), the per-event override cards
(they already carry location + description fields), and the no-area drop
(brief 22). No redesign of the card.

Done when: `npm run build` exits 0 AND `grep -rn "This week's picks" src supabase/functions`
returns nothing (all now "top picks") AND `renderPickRow` on a fixture of 3
events each with a description emits 3 description divs, not 1. Do not weaken a
check to pass it. Stop after 8 tries.
