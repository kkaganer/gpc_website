/goal (Lower priority — Aster flagged "not essential.") The newsletter composer
offers light formatting (bold, italic, link) and the browser's spell check is on,
so copy can be shaped without hand-writing HTML.

1. Text entry is plain `<input>`/`<textarea>` via
   `src/components/admin/newsletter/EditableText.jsx`; the only way to bold today
   is the `textBlock`, which takes RAW HTML in a monospace box
   (`src/pages/admin/NewsletterSectionEditor.jsx:1290`) and literally says "A
   full rich-text toolbar is coming in the next update".
2. Add a small formatting toolbar (bold / italic / link) over the rich fields —
   a lightweight approach that still emits the email-safe `<strong>`/`<em>`/`<a>`
   the renderer already supports (no flexbox/grid/webfonts per `CLAUDE.md`).
   Avoid a heavy rich-text framework.
3. Spell check: ensure `spellcheck` is not disabled on the text fields so the
   browser's native checker runs (there is no in-app checker and none is needed).

Out of scope: a full WYSIWYG, tables/images inside text (images are brief 23),
and server-side spell checking.

Done when: `npm run build` exits 0 AND the composer's rich fields show
bold/italic/link controls that emit email-safe tags AND text fields allow native
spellcheck. Do not weaken a check to pass it. Stop after 10 tries.
