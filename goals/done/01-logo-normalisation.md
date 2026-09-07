/goal Supporter logos in the newsletter render at identical pixel dimensions,
because every logo is normalised onto a solid plate when it is uploaded.

1. Migration `028_advertiser_logo_bg.sql`: add `logo_bg text not null default
   '#ffffff'` to `newsletter_advertisers`, idempotently with `add column if not
   exists`, matching the pattern in 005 and 006.
2. New `src/lib/logoNormalise.js` exporting a pure `fitBox({srcW, srcH, tileW,
   tileH})` that returns the draw rect, sized by orientation: aspect > 2:1 ->
   92% of tile width; 0.7-2:1 -> 72% of tile height; < 0.7:1 -> 65% of tile
   height. Always centred, never upscaled beyond the source.
3. `ImageUpload.jsx` uses it: draw to a canvas at 2x, fill the plate colour,
   draw the logo into `fitBox`'s rect, export PNG. Accept a `normalise` prop so
   event images keep uploading unchanged.
4. `NewsletterAdvertiserForm.jsx` exposes `logo_bg` as a colour input, default white.
5. `newsletter-renderer.ts`: the Supporter block sets explicit `width` AND
   `height` from a shared `SUPPORTER_LOGO` constant, and puts `logo_bg` as
   `bgcolor` on the containing `<td>`.

Out of scope: no dependency upgrades. Do not touch the Brevo sync, the discovery
pipeline, or london_events. Do not redesign the newsletter layout or change the
Presenting block. Do not apply the migration to any database.

Done when: `npm run build` exits 0 AND `028_advertiser_logo_bg.sql` contains "if
not exists" AND node can import `fitBox` and it returns a rect within tile bounds
for all three orientations (600x100, 400x400, 200x600) with the wide one wider
than the square one AND `ImageUpload.jsx` imports `fitBox` AND the Supporter img
carries `width="` and `height="` and no `height:auto`. Do not weaken a check to
pass it. Stop after 12 tries.
