/goal Submitting an event is one obvious click: a labelled route on the homepage
and nav, and a "Submit your event" link in the newsletter — not a modal you can
only reach by hunting the What's On header.

1. Today submission is a modal (`src/components/whatson/SubmitEventModal.jsx`)
   opened only from the What's On header button (`src/pages/WhatsOn.jsx:123`).
   There is no URL to link to. Give it a linkable entry: a query param
   `/whats-on?submit=1` that auto-opens the modal (read the param in
   `WhatsOn.jsx`), or a dedicated `/submit` route in `src/App.jsx`.
2. Homepage route. Add a clear "Submit an event" call to action — a secondary
   button in the hero (`src/components/home/Hero.jsx`, beside "See What's On")
   and/or a nav item (`src/components/layout/Navbar.jsx:9`).
3. Newsletter link. The renderer has no submit CTA anywhere
   (`supabase/functions/_shared/newsletter-renderer.ts` footer ~1033/1291 only
   advertises and asks for support). Add a "Got an event? Submit it" link
   pointing at the public submit URL, in BOTH the email footer and
   `renderWhatsapp()`.

Out of scope: redesigning the submit form itself (briefs 24/25), the approval
workflow, and any change to how a submitted event is stored
(`source:'community', approved:false`).

Done when: `npm run build` exits 0 AND there is a URL that opens the submit form
directly AND the homepage renders a visible "Submit an event" control AND the
rendered email HTML and the WhatsApp text each contain a submit link. Do not
weaken a check to pass it. Stop after 10 tries.
