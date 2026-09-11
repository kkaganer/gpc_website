/goal The edition page reads as the newsletter it is: it carries the week's
welcome message from the draft we already generate, points on to the main
What's On page for anything beyond this week, and the WhatsApp message links to
exactly the URL the email's button links to.

1. Migration `034_public_newsletter_intros.sql`: a public, column-limited view
   over `newsletter_drafts` exposing only `week_of` and the intro block's
   `message` and `signature`, newest draft per week. Same reasoning as 030 —
   the base table is authenticated-only and carries the whole unsent edition,
   the page is public and needs two strings. `security_invoker = false`, and
   `grant select ... to anon, authenticated`.
2. `useEdition` fetches that view for the edition's Friday. A missing row is not
   an error: the page renders exactly as it does today.
3. `WhatsOnEdition.jsx` renders the welcome under the masthead when there is
   one, and links to `/whats-on` for events beyond this week.
4. `renderWhatsapp()` builds its URL from the same brand `websiteUrl` root
   `siteUrl()` uses and honours an `editionCta` block `url` override, so the two
   links cannot differ.
5. The Copy WhatsApp button re-renders from the draft's saved config rather than
   reading a column written at generate time, so tonight's draft gets the new
   link without being regenerated.

Out of scope: no dependency upgrades, no column changes to `newsletter_drafts`,
no change to the email HTML output, no redesign of the edition page beyond the
welcome and the link, no sending anything anywhere, and no UPDATE or DELETE
against any existing draft row — tonight's edition is going out as it stands.

Done when: `npm run build` exits 0 AND `034_public_newsletter_intros.sql`
contains `create or replace view` and a grant to `anon` AND `renderWhatsapp()`
on a fixture returns a URL byte-identical to the href `renderEditionCtaBlock()`
emits for the same config AND `WhatsOnEdition.jsx` links to `/whats-on` AND the
view returns the intro for this week's draft when queried with the anon key. Do
not weaken a check to pass it. Stop after 12 tries.
