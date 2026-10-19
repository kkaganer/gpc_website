/goal Aster can put a photo straight into the newsletter — both as an image
block and alongside a short "what we've been up to" note — by uploading, not by
hosting a file elsewhere and pasting a URL.

1. The `imageBlock` editor is a URL text field only
   (`src/pages/admin/NewsletterSectionEditor.jsx:1319`). A real uploader already
   exists — `src/components/ui/ImageUpload.jsx` (file → Supabase storage via
   `uploadEventImage`, with a URL-paste fallback) — but is only wired into the
   advertiser/event forms. Wire it into the imageBlock editor, keeping the URL
   field as the fallback.
2. The intro / "message from Aster" block is text-only
   (`newsletter-renderer.ts:760`). Allow a photo with the note — either an
   optional image on the intro block, or make it natural to drop an imageBlock
   right after the intro.
3. Remember email HTML rules (`CLAUDE.md`): tables + inline styles, fixed width,
   no webfonts — the rendered image must keep `max-width` and a width attribute.

Out of scope: a media library / reusing past uploads, image editing beyond what
`ImageUpload` already does, and galleries.

Done when: `npm run build` exits 0 AND the newsletter image block offers an
upload (not only a URL) that stores to Supabase and renders in the email HTML
AND a photo can sit with the intro note. Do not weaken a check to pass it. Stop
after 10 tries.
