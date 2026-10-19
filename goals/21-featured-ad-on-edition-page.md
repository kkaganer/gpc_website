/goal Settle whether the featured advertiser really is missing from the "see all
events" click-through page, then make sure it shows.

1. The edition page already renders the presenting advertiser:
   `src/pages/WhatsOnEdition.jsx:502` (`<PresentingSlot advertiser={presenting} …>`)
   with data from `src/hooks/useEdition.js:102` (`presenting = featured-ad` from
   the `public_newsletter_advertisers` view). So this may not be a bug.
2. First reproduce against the week Aster meant: check whether that edition
   actually had a `featured-ad` advertiser (an unsold week shows the house ad or
   nothing), and whether the view/date lookup returns it. The email button
   points at `/whats-on/{weekOf}` (`newsletter-renderer.ts:187`).
3. If it is a real gap (e.g. the slot renders only when sold, or a date
   mismatch between email and page), fix the lookup/fallback so the featured
   advertiser shows at the top of the edition page exactly as it does in the
   email.

Out of scope: redesigning the slot, supporter-rail changes, and click tracking.

Done when: the cause is written down (unsold week vs bug) AND, if a bug,
`npm run build` exits 0 and the edition page for a week with a sold featured slot
renders that advertiser at the top. Do not weaken a check to pass it. Stop after
6 tries.
