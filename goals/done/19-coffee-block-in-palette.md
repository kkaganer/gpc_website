/goal "Buy us a coffee" is a block you can add from the editor's Add-block menu
— the thing already renders; it just can't be inserted.

1. The `donationStrip` block fully renders
   (`supabase/functions/_shared/newsletter-renderer.ts:1151`, defaulting to the
   Zeffy "buy the GPC team a coffee" link) and has an editor panel
   (`src/pages/admin/NewsletterSectionEditor.jsx:1255`). It is simply missing
   from the Add-block palette (`NewsletterSectionEditor.jsx:770`, which offers
   only Text / Image / Button / Divider / Guide button).
2. Add "Coffee / donation" to that palette so a fresh `donationStrip` can be
   inserted, seeded from `DEFAULT_BRAND.donateUrl`.

Out of scope: changing the donate provider or URL, adding it to the default
edition, and any new donation block type.

Done when: `npm run build` exits 0 AND the Add-block palette lists a
donation/coffee option AND choosing it appends a `donationStrip` block that
renders the coffee CTA. Do not weaken a check to pass it. Stop after 5 tries.
