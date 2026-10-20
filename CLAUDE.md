# GPC website

Vite + React 19 SPA on Vercel, Supabase for data, EmailOctopus for sending the
newsletter. Brevo is no longer used.
Project ref: `kwpkgcqcdygduzcqvzoa`.

## Database migrations

`SUPABASE_ACCESS_TOKEN` is exported from `~/.zshrc`, so Claude can apply schema
changes directly. That access is deliberately narrow in practice:

**Apply without asking** — additive, idempotent, reversible:

- `add column if not exists`
- `create index if not exists` (use `concurrently` on populated tables)
- `create table if not exists`
- new RLS policies, new functions, new triggers

**Show the SQL and get a yes first** — anything that can lose data or lock a
table:

- `drop` anything: column, table, index, policy, constraint
- `alter column ... type`, or adding `not null` to an existing column
- `update` or `delete` touching existing rows
- renaming anything
- changing or removing an RLS policy

Never run `supabase db reset` against the linked project. Never `db push`
without checking `supabase migration list --linked` first — the CLI's history
may not know about migrations applied by hand in the dashboard, and
`001_create_tables.sql` uses bare `CREATE TABLE`, so a replay errors partway.

Migrations are numbered sequentially (`028_`, `029_`), not timestamped. Write
every one idempotently so a retry is harmless.

Applied by hand and known live: `007_add_postcode`. Checked 2026-09-11: remote
migration history is in sync through `034`, 007 included, so no `migration repair`
is needed. `db push` only replays what remote history lacks, which is why the bare
`CREATE TABLE` in `001` has not bitten.

Applied by hand 2026-10-19 via the Management API: `035`, `036` and `037`, each
recorded in `supabase_migrations.schema_migrations` straight after, so remote
history is in sync through `037` and no `migration repair` is needed. The
"no upcoming dates" guard in `publish_activity` had been applied by hand earlier
and was never in a repo migration; 035 onwards now carry it. `038` (EmailOctopus
sync columns) was applied and recorded the same way on 2026-10-20, so history is
in sync through `038`.

`activity_review_queue` (the Discovery screen's source) is a VIEW with an EXPLICIT
column list, recreated by 009, 024, 025, 032 and 035. A column the UI needs but the
view omits fails SILENTLY — the hook calls `.select('*')`, which expands to the
view's columns, not the table's, so the field is `undefined` on every row with no
error. Adding a field to that screen means recreating the view, and re-issuing
`grant select ... to authenticated`, which a recreated view does not inherit.

A recreated view DOES pick up something else: Supabase's default privileges on
`public` grant `anon` ALL on every new table and view, and a view runs with its
owner's rights, so it bypasses the RLS on `activities`. Every recreate so far left
the review queue readable by anyone with the public key. After recreating it, also
`revoke all on activity_review_queue from anon` (see 037).

## Things that bite

- **Edge functions don't ship with the site.** Vercel deploys the frontend only;
  each Supabase function deploys separately with `supabase functions deploy
  <name> --project-ref kwpkgcqcdygduzcqvzoa`. `newsletter-renderer.ts` and the
  event-section query are shared with `generate-newsletter`, so a renderer or
  resolver change needs that function redeployed too, or Generate and the editor
  preview disagree.
- **No test suite.** Only `npm run build`. Verification means building, plus
  grep or a node script against the specific behaviour.
- **`vercel.json` rewrite order matters.** The SPA catch-all `/(.*)` swallows
  anything below it. New API routes go above it.
- **Serverless functions cannot import from `src/`.** Shared constants are
  duplicated on purpose — `api/subscribe.js` and `api/og/whats-on.js` both say
  so at the point of duplication. If one changes, change the other.
- **Email HTML is not web HTML.** `supabase/functions/_shared/newsletter-renderer.ts`
  uses tables, inline styles and explicit `bgcolor` deliberately. No flexbox,
  no grid, no `<style>` block, no webfonts without a fallback stack.
- **Subscribers: Supabase is the source of truth, EmailOctopus the sending copy.**
  Every push goes through `api/_lib/emailoctopus.js`; the two-way rules live in
  `api/_lib/subscriber-sync.js`. Signups push create-only (a 409 leaves the
  contact untouched, so a form can never re-subscribe someone who left).
  Unsubscribes flow back by webhook (`api/emailoctopus-webhook.js`) and a nightly
  Vercel cron (`api/emailoctopus-sync.js`, 04:00 UTC). Nothing automatic ever
  clears `unsubscribed_at`. Vercel env: `EMAILOCTOPUS_API_KEY`,
  `EMAILOCTOPUS_WEBHOOK_SECRET`, `CRON_SECRET`. The brevo_* columns are history.
- **PostgREST returns at most 1000 rows per request here** (`max_rows`), silently,
  whatever `.limit()` says. `newsletter_subscribers` is past 790 rows; page with
  `.range()` (see `readAllSubscribers`) for anything that must see every row.

## Design system

`docs/design-system.md` is the written spec, and there is a matching Claude
Design project ("GPC Design System") with tokens and components. Poppins for
headings, Nunito for everything else. Brand pink `#fc16a0` is for fills and
rules; use `#d1067f` for text, since the brand pink is 3.6:1 on white.
