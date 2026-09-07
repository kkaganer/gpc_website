/goal Every paid slot's clicks are counted, so the weekly click count promised to
Tier 1 and Tier 2 advertisers is a number we actually hold.

1. Migration `031_advertiser_clicks.sql`: `create table if not exists
   advertiser_clicks` with `advertiser_id` referencing `newsletter_advertisers`,
   `edition_date date`, `source text check (source in ('email','web'))`,
   `clicked_at timestamptz not null default now()`, plus
   `create index if not exists` on `(advertiser_id, edition_date)`. Idempotent
   throughout, and an insert-only RLS policy for the anon role — this table is
   written by an unauthenticated redirect.
2. New `api/click.js`: takes an advertiser id, an edition date and a source,
   records one row, then 302s to the advertiser's stored `event_url`. It must
   never 500 and never redirect anywhere but a URL held in the database — an
   unknown advertiser redirects to the site root without recording, and a
   recording failure still redirects.
3. The rewrite in `vercel.json`, above the SPA catch-all.
4. The Presenting card and Supporter tiles link through it, in both
   `newsletter-renderer.ts` and `WhatsOnEdition.jsx`.
5. `NewsletterManager.jsx` shows clicks per advertiser for the edition.

Out of scope: no dependency upgrades. Do not add third-party analytics. Do not
record anything about the person clicking — no IP, no user agent, no cookie. Do
not apply the migration to any database. Do not change the advertiser schema
beyond the new table.

Done when: `npm run build` exits 0 AND `031_advertiser_clicks.sql` contains both
"if not exists" and "check (source in" AND node can invoke the handler with an
unknown advertiser id and gets a 302 whose Location is the site root and no
insert attempted AND a handler invocation whose database call throws still
returns a 302 and not a 500 AND `vercel.json` lists the click route above the
`/(.*)` catch-all. Do not weaken a check to pass it. Stop after 12 tries.
