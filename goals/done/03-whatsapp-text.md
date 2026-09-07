/goal Each newsletter draft carries a ready-to-paste WhatsApp message, copyable
from the admin in one click.

1. Migration `029_newsletter_whatsapp_text.sql`: add `whatsapp_text text` to
   `newsletter_drafts`, idempotently.
2. Add a `renderWhatsapp()` export to `supabase/functions/_shared/newsletter-renderer.ts`
   that builds the message from the same draft data the HTML uses: a bold title
   line, one sentence naming 3-4 highlights, and the edition URL last. Plain text
   only - WhatsApp supports `*bold*` and `_italic_` and nothing else. No HTML
   tags, no markdown links.
3. `generate-newsletter` populates `whatsapp_text` alongside `content_html`.
4. `NewsletterManager.jsx` gets a "Copy WhatsApp text" button beside the existing
   Copy HTML, using the same clipboard-and-confirm pattern already there.

Out of scope: no dependency upgrades. Do not touch the Brevo sync or the HTML
renderer's existing output. Do not send anything anywhere. Do not apply the
migration to any database.

Done when: `npm run build` exits 0 AND `supabase/migrations/029_newsletter_whatsapp_text.sql`
contains "if not exists" AND calling `renderWhatsapp()` on a fixture draft returns
a string of 1000 characters or fewer that contains "gpccommunity.co.uk" and
matches no `<[a-z]` HTML tag AND `NewsletterManager.jsx` contains a WhatsApp copy
handler. Do not weaken a check to pass it. Stop after 12 tries.
