/goal A public advertise page sets out the three tiers with what each one costs
you to supply and what it gets you, so an enquiry arrives already knowing the
shape of the offer.

1. New `src/pages/Advertise.jsx` rendering artboard C: the three tiers side by
   side — Presenting, Supporter, Community listing — each with a header, a worked
   example, and a spec table of Placement / Frequency / You supply / Click target
   / Reporting.
2. Tier 1 shows both modes the renderer already supports: event mode with a photo
   and details, brand mode with just the name, line and URL.
3. Tier 3 is shown as three ordinary list rows, with the design's own note that
   the plainness is deliberate — a free listing looks like every other listing.
4. The "When a slot doesn't sell" section showing the unsold presenting card and
   the part-filled supporter row.
5. Route `/advertise` in `App.jsx`, and the nav link in the shared layout.

Out of scope: no dependency upgrades. Do not add a form, a payment flow, or a
booking calendar — the page ends in a mailto. Do not change
`newsletter_advertisers` or any renderer. Do not touch the edition page.

Done when: `npm run build` exits 0 AND `App.jsx` contains `path="/advertise"` AND
`Advertise.jsx` contains all of "Presenting", "Supporter", "Community listing",
"Placement", "Frequency", "You supply", "Click target" and "Reporting" AND the
shared layout contains a link to `/advertise`. Do not weaken a check to pass it.
Stop after 12 tries.
