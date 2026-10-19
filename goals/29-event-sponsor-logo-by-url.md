/goal On an event, a sponsor logo can be added by pasting an http link (an image
URL plus the site it links to) — e.g. Wayfable on the "Sing" event — not only by
uploading a file.

1. Confirm WHICH event type Aster means first: "Sing" sounds like a What's On
   listing (`london_events`), not a GPC flagship event (`gpc_events`). The field
   belongs wherever that is.
2. The GPC event form `src/pages/admin/EventForm.jsx` has sponsors and uses
   `src/components/ui/ImageUpload.jsx`, which already has a URL-paste fallback —
   but the intent here is a sponsor logo WITH an outbound link. Make the sponsor
   shape carry both a logo (upload OR http URL) and a `url` the logo links to.
3. Render the logo as a link on the event page; reuse `src/lib/logoNormalise.js`
   for plating if a raw logo is pasted.

Out of scope: a reusable sponsor library, newsletter advertiser logos (that path
already uploads — `src/pages/admin/NewsletterAdvertiserForm.jsx`), and
payment/booking.

Done when: `npm run build` exits 0 AND an event sponsor logo can be set from an
http image URL and given a click-through URL AND it renders as a linked logo. Do
not weaken a check to pass it. Stop after 8 tries.
