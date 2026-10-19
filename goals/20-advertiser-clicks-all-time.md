/goal Advertiser clicks can be read for any past week AND as an all-time total
per advertiser — the data is all captured already; only the view is single-week.

1. Today the only clicks UI is `src/pages/admin/NewsletterManager.jsx:92`, a
   table filtered to one edition via `.eq('edition_date', weekOf)`. A previous
   week already works (change the week picker). Missing: no query without the
   date filter, and the advertiser manager shows no clicks at all.
2. Add an all-time / date-range rollup per advertiser from `advertiser_clicks`
   (migration `031_advertiser_clicks.sql`: `advertiser_id`, `edition_date`,
   `source`, `clicked_at`; anon INSERT, authenticated SELECT). Group by
   `advertiser_id`, split Email/Web/Total, order by total.
3. Surface it where an advertiser is managed —
   `src/pages/admin/NewsletterAdvertisersManager.jsx` — e.g. a per-advertiser
   total plus a short history.

Out of scope: per-click PII (none is stored), changing the `source` CHECK, and
the redirector `api/click.js`.

Done when: `npm run build` exits 0 AND there is a query path that reads
`advertiser_clicks` WITHOUT an `edition_date` filter AND the UI shows an all-time
total per advertiser. Do not weaken a check to pass it. Stop after 8 tries.
