/goal A weekly What's On URL previews in WhatsApp with its own title,
description and image, instead of the one hardcoded set in index.html.

1. Add `api/og/whats-on.js` — a serverless handler that takes a date, reads that
   edition from Supabase, and returns a full HTML document whose head carries
   per-edition `og:title`, `og:description`, `og:image` and `og:url`, then
   redirects or hydrates into the SPA.
2. Add the rewrite to `vercel.json` so `/whats-on/:date` hits the handler while
   every other path keeps falling through to `index.html`. The existing SPA
   catch-all must still work for all current routes.
3. The handler must degrade: an unknown or malformed date returns the generic
   GPC tags and a 200, never a 500.

Out of scope: no dependency upgrades. Do not build the weekly page's visual
design - that is blocked on the Claude Design output. Do not change existing
routes in App.jsx. Do not touch index.html's existing tags.

Done when: `npm run build` exits 0 AND invoking the handler directly in node with
date 2026-06-12 returns HTML containing an `og:title` that includes "12 June" AND
invoking it with "not-a-date" returns HTML containing GPC's generic og:title AND
`vercel.json` still contains the `/(.*)` catch-all rewrite. Do not weaken a check
to pass it. Stop after 12 tries.
