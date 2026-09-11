/goal A WhatsApp reader gets the newsletter first, then the week, then
everything: the message opens the edition exactly as it was emailed, that
page's own button goes to /whats-on/{date}, and that page goes to /whats-on.

1. `api/newsletter.js` serves a week's stored `content_html` at
   `/newsletter/{YYYY-MM-DD}`, read with `SUPABASE_SERVICE_ROLE_KEY` the way
   `api/admin/*` already reads privileged tables — no public view, so the draft
   row never becomes queryable, only this one column through this one route.
   Newest draft for the week. An unknown date redirects to `/whats-on`.
2. The rewrite goes ABOVE the SPA catch-all in `vercel.json`.
3. Two things the email leaves behind have to be fixed on the way out: the ESP
   merge tag `{{UnsubscribeURL}}` renders as literal text in a browser, and
   `/click?…&source=email` would book a WhatsApp reader's click against the
   email number Tier 1 and Tier 2 are quoted. Strip the unsubscribe line,
   rewrite the source to `web`.
4. Inject OG tags into the head — the stored HTML is an email document and
   carries none, so the WhatsApp preview has nothing to read. Same shape as
   `api/og/whats-on.js`.
5. `renderWhatsapp()` points at `/newsletter/{weekOf}` and stops sharing
   `editionUrl()` with the email's button, which keeps pointing at
   `/whats-on/{weekOf}`. The two are deliberately different now.
6. `Help.jsx` step 3 says both the email and the WhatsApp message point at the
   edition page. They no longer do.

Out of scope: no dependency upgrades, no change to the HTML the renderer
produces, no second renderer for the web — the page is the stored bytes, no
change to the `advertiser_clicks` source CHECK constraint, no subscribe CTA on
the hosted copy, no redesign of `/whats-on/{date}`, no sending anything
anywhere, and no UPDATE or DELETE against a draft row.

Done when: `npm run build` exits 0 AND `vercel.json` lists the `/newsletter/`
rewrite before `/(.*)` AND a request to `/newsletter/2026-09-11` (deployment or
`vercel dev`) returns 200 whose body contains `whats-on/2026-09-11`, contains
an `og:title`, and contains neither `{{` nor `source=email` AND
`renderWhatsapp()` on a fixture returns a link containing `/newsletter/` and no
`/whats-on/` AND `renderEditionCtaBlock()` on that same fixture still emits
`/whats-on/{weekOf}`. Do not weaken a check to pass it. Stop after 14 tries.
