# CONSTRAINTS BRIEF — Public business directory + admin-authored intake form

Repo root: `/Users/kristinakaganer/projects/GPC/website`. Everything below is what the codebase already does. Where I recommend a choice, it is marked **DECISION**.

---

## 1. Stack & deployment reality (non-negotiable)

- **Frontend:** React 19 + Vite 6 + `react-router` v7, all pages `lazy()`-loaded in `src/App.jsx`. No TypeScript in `src/`, no propTypes, no form library, no data-fetching library (no React Query). Fetching is `useState` + `useEffect` or a hand-rolled hook in `src/hooks/`.
- **Styling:** Tailwind **v4** via `@tailwindcss/vite`. **There is no `tailwind.config.js`.** The entire stylesheet is 20 lines: `src/index.css`. Tokens live in an `@theme` block there.
- **Backend:** Supabase Postgres. Two server surfaces, both already in use:
  - Vercel serverless functions in `/api` (only three exist today: `api/subscribe.js`, `api/admin/users.js`, `api/admin/subscribers.js`; `api/_lib/brevo.js` is a non-routed helper).
  - Supabase Edge Functions in `supabase/functions/*` (Deno/TS) for LLM and batch work.
- **Deployment:** Vercel. `vercel.json` is three lines of rewrites — **no security headers, no CSP, no CORS config, no WAF, no cron**. No `export const config` in any function (no edge runtime, no `maxDuration`).
- **Keys:** browser holds the **anon key only** (`src/lib/supabase.js`, inlined into the JS bundle at build time — it is public). `SUPABASE_SERVICE_ROLE_KEY` exists only in Vercel env, read inside handlers at request time.
- **Migrations:** plain SQL files in `supabase/migrations/`, applied with `supabase db push`. 27 files, `001`–`027`. **Your first file is `028_<description>.sql`.** Version numbers must be unique — a collision once blocked `db push` entirely (see `supabase/migrations-archive/`).

---

## 2. Data layer conventions (a new migration must follow these exactly)

```sql
create table if not exists directory_listings (
  id            uuid primary key default gen_random_uuid(),
  business_name text not null,
  status        text not null default 'pending'
                  check (status in ('pending','published','held','rejected')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
```

Hard rules, all observable across `001`–`027`:

- **`id uuid primary key default gen_random_uuid()`** on every table. No serial, no integer PKs. (The one exception, `discovery_sources.id text`, is a human-authored slug.)
- **snake_case** everywhere; plural table names; `_idx` / `_uidx` index suffixes.
- **`timestamptz`, never `timestamp`.** Instants use `_at`, calendar dates use `date` + `_on`.
- **`updated_at` is trigger-maintained, never set by application code.** Reuse `update_updated_at()` (001) or `discovery_touch_updated_at()` (008).
- **Zero Postgres ENUMs exist.** Every closed vocabulary is `text` + `CHECK (col IN (...))`. When added later, always drop-then-add with the name `<table>_<column>_check` so re-running is a no-op.
- **Idempotency is universal from 005 onward:** `create table if not exists`, `add column if not exists`, `create index if not exists`, `create or replace function|view`, `on conflict … do nothing`.
- **SQL keyword case is lowercase** from 005 onwards. 001–004 and 007 are legacy uppercase; do not imitate them.
- **`comment on column` is a first-class artefact** — semantics that code must obey get written into a column comment (see the `unsubscribed_at` comment in `027`, which is quoted as a contract in three separate code files).
- **Every new function gets the lockdown pair**, immediately, in the same file — Postgres grants EXECUTE to PUBLIC by default and `010_lock_down_publish_rpcs.sql` exists because that was missed once and anon could call `reject_activity` in production:
  ```sql
  revoke execute on function my_fn(uuid) from public, anon;
  grant  execute on function my_fn(uuid) to authenticated;
  ```
- **Header comment style** (rigorous from 019): line 1 is a one-sentence plain-English statement of intent; then `-- WHY.`; then measured evidence with real numbers and `file:line` citations; then 75-dash section dividers; then explicit blocks for what is *deliberately not done* (`-- BACKFILL: deliberately none.`, `-- RLS: intentionally unchanged.`); then a commented-out `-- Verification — paste into the SQL editor after running:` block.
- **No invented backfill.** If you add a column, existing rows keep the honest default. Never guess a value you cannot prove.
- **Destructive functions default to a dry run** (`dedupe_london_events(p_dry_run boolean default true)`).
- **Slugs:** only `gpc_events.slug` exists, and slug generation lives only in `src/hooks/useEventMutations.js`. If directory listings need `/directory/:slug` URLs, that machinery must be written; `london_events` and `activities` are addressed by uuid.

---

## 3. The public/private boundary — how it is actually enforced

### What exists

**RLS is on for all 12 tables.** Three read shapes are in use:

```sql
-- (a) unconditional public read
create policy "Public can view term dates" on term_dates for select using (true);

-- (b) public read gated on a status column  ← the directory case
create policy "Public can view published activities" on activities
  for select using (status = 'published');

-- (c) public INSERT, restricted by WITH CHECK
create policy "Anyone can submit events" on london_events
  for insert with check (approved = false);
```

Admin identity is binary: `anon` vs `authenticated`. **There is no `admin_users` table, no role claim, no `auth.uid()` check anywhere in 27 migrations.** `src/components/admin/ProtectedRoute.jsx` tests `!user` and nothing else.

### Three traps this codebase has already fallen into — do not repeat

1. **Views do not enforce RLS.** `018_secure_ingest_batch_status.sql` exists because `ingest_batch_status` was readable with the anon key in production. The fix triple, reapplied in 020 and 022:
   ```sql
   alter view my_view set (security_invoker = on);
   revoke select on my_view from anon;
   grant  select on my_view to authenticated;
   ```
2. **A recreated view loses its grants.** `025` warns: dropping the re-issued `grant` line "silently locks the admin panel out of its own review queue."
3. **`with check (true)` on a public INSERT means the client controls every column.** `019` and `027` both flag it: an anon-key holder can insert `newsletter_subscribers` rows with `brevo_status = 'synced'` and a fabricated timestamp. **A form that captures consent must never be an anon-key insert**, because the submitter would be writing their own consent record.

### DECISION — the shape for this feature

**Two tables, not one table with hidden columns.** Postgres RLS is row-level; there is no column-level pattern anywhere in this repo, and a "public view over a private table" is not a boundary (trap 1 — anon can query the base table directly through PostgREST).

- **`directory_listings`** — public-facing fields only (business name, description, category, area/outcode, public website, public business phone/email *if the business asked for it to be published*, logo URL, status). Policy: `for select using (status = 'published')` for anon; `for all to authenticated using (true) with check (true)` for admin, copying `008_discovery_platform.sql:298-311`.
- **`directory_contacts`** — the private half (submitter name, personal email/phone, address, membership link, consent record, moderation notes). FK `listing_id uuid references directory_listings(id) on delete cascade`, mirroring `occurrences → activities`. **Give it RLS enabled and no anon policy at all** — the same posture as `ingest_runs`.

**DECISION — reads and writes:**

| Path | Mechanism | Precedent |
|---|---|---|
| Public directory listing page | browser `supabase.from('directory_listings').select(...)` with the anon key, RLS-gated | `src/hooks/useLondonEvents.js` |
| Public form submission | **`POST /api/directory/submit`, service-role, unauthenticated route** — *not* an anon-key insert | `api/subscribe.js` |
| Admin reading private contact rows | **`GET /api/admin/directory`, service-role, bearer-token verified** | `api/admin/subscribers.js` |
| Admin approve/reject/edit of public fields | browser `supabase.from('directory_listings').update(...)` | `src/pages/admin/LondonEventsManager.jsx:357-389` |

The rule already stated in the codebase: `/api/admin/*` exists **only** where the service-role key is genuinely required — Supabase Auth admin, and subscriber PII. Personal data qualifies. Routing PII through a serverless route means a future RLS slip cannot leak it, and it is the only way to write a consent record the client cannot forge.

The API-route contract to copy verbatim from `api/admin/subscribers.js`:
```js
const token = req.headers.authorization?.replace('Bearer ', '')
if (!token) return res.status(401).json({ error: 'Not authenticated' })
const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token)
if (authError || !caller) return res.status(401).json({ error: 'Invalid or expired session' })
```
Error shape is always `{ error: '<human-readable string>' }` + an HTTP status. Wrap the whole handler in try/catch so a throw still returns JSON (`api/subscribe.js` does; `api/admin/users.js` does not, and will 500 with HTML on an empty body).

---

## 4. Admin UI building blocks

Adding a section is four mechanical edits:

1. **`src/App.jsx`** — `lazy()` import + routes inside the existing `/admin` `<Route>`. Convention is `list` / `list/new` / `list/:id/edit`, with **one form component serving both new and edit** (`const isEditing = Boolean(id)`).
2. **`src/components/admin/AdminLayout.jsx:5-16`** — push one row into `sidebarLinks`: `{ to, label, icon: <LucideIcon>, end?, comingSoon? }`. `comingSoon: true` renders a dead grey row with a "Soon" pill (supported, currently unused).
3. **`src/pages/admin/Dashboard.jsx:20-63`** — optionally add a `quickLinks` card `{ to, label, description, icon, color }`. (Note: the two lists are hand-maintained and already diverge — Discovery has a sidebar entry and no card.)
4. **`document.title = '<Section> | GPC Admin'`** in the page's first `useEffect`. Every admin page does this.

**Reuse (exact names/props):**
- `ConfirmModal` — `src/components/ui/ConfirmModal.jsx`, props `{ title, message, onConfirm, onCancel }`. **The confirm button label is hard-coded "Delete" and red.** For "Reject" or "Unpublish" you must extend it or hand-roll.
- `ImageUpload` — `src/components/ui/ImageUpload.jsx`, props `{ value, onChange }`; `onChange` receives a **URL string**, not an event. Uploads via `uploadEventImage()` in `src/hooks/useEventMutations.js` to the single `event-images` Supabase Storage bucket, **from the browser with the anon key**.
- `Badge` — `src/components/ui/Badge.jsx`, props `{ variant, children }`, variants `free | sold-out | new | upcoming | past`. Used in one admin file.
- `adminApi.js` — `src/lib/adminApi.js`. Copy `authHeaders()` and `parseResponse()`. There is no generic `request()` helper; each endpoint duplicates ~9 lines.

**Patterns to copy rather than invent** (all in `src/pages/admin/`):
- List page reference: `SubscribersManager.jsx` (PII-bearing, closest analogue). Tabs + bulk actions reference: `LondonEventsManager.jsx`.
- Everything is fetched once and filtered client-side in a `useMemo`. **No server-side pagination exists.** The only paginated list is `SubscribersManager.jsx` — `PAGE_SIZE = 100` "Show N more", reset to `PAGE_SIZE` on any filter change.
- Selection is a `Set` of ids, cleared on tab change; `deleting` state holds an **id, not a boolean** (doubles as modal-open flag).
- Status pills are a module-scope `Record<string, tailwindClasses>` object applied inline (`SubscribersManager.jsx:6-11`).
- Stat tiles: local `Tile` component (`SubscribersManager.jsx:116-124`), computed over the **full** set, never the filtered set.
- Form pattern: module-level `emptyForm`, four state atoms (`form`, `saving`, `loading`, `error`), field-by-field hydration with `|| ''` (never `setForm(data)`), a single `set(field, value)` updater, **native HTML validation only** (`required`, `type="email"`, `minLength`), one inline red banner for errors, and `navigate()` away on success (no success toast).
- **`react-hot-toast` is used in exactly one file.** There is no global `<Toaster>`; a page wanting toasts mounts its own.

---

## 5. Public UI building blocks + design tokens

**Tokens — `src/index.css` is the whole design system:**
```css
@theme {
  --color-primary: #fc16a0;   /* → bg-primary / text-primary / border-primary */
  --color-dark:    #2d1b4e;
  --color-warm:    #fffaf5;   /* page background */
  --color-amber:   #f59e0b;   /* effectively unused; code uses Tailwind's amber-* */
  --font-heading: 'Poppins';  /* → font-heading; weights 600/700 only */
  --font-body:    'Nunito';   /* → font-body;   weights 400/600/700 only */
}
```
Duplicated for JS consumers in `src/utils/constants.js` (`BRAND`, plus `ORG`, `CONTACT`, `GDPR`, `SAFEGUARDING`).

**Radius grammar:** press-it-and-it's-text → `rounded-full`; type-into-it → `rounded-xl`; holds-content → `rounded-2xl`; icon button → `rounded-lg`.
**Layout:** container `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`; section `py-16 md:py-24`; headings `text-3xl md:text-4xl`. `md:` is the primary breakpoint (105 uses); `xl:` is never used.

**Primitives — `src/components/ui/`:**
- `Button` — `{ variant = 'primary'|'secondary'|'outline', children, className, href, ...rest }`. Polymorphic: `href` starting `http` → new-tab `<a>`; other `href` → `<Link>`; none → `<button>`. Fixed `px-6 py-3`. **No size variants, no disabled styling, no loading state.** (`mailto:` hrefs hit the `<Link>` branch — a latent bug, see `Impact.jsx:78`.)
- `Card` — `{ children, className }`. **No internal padding**; consumers wrap in `<div className="p-6">`.
- `SectionHeading` — `{ title, subtitle, align = 'center'|'left', showUnderline = true }`. Always renders an `<h2>` — cannot be a page `<h1>`.
- `Badge` — see above.
- Unused but available: `WaveDivider` `{ color, flip }`, `PullQuote` `{ quote, name, role }`, `PhotoCollage` `{ images, className }` (hard-capped at 3).

**Public nav:** one array, `src/components/layout/Navbar.jsx:8-14`, drives both desktop row and mobile drawer. Add the route in `src/App.jsx` inside `<Route element={<Layout />}>`.

**Reference implementations for what you are about to build:**
- **Listing + filters:** `src/pages/WhatsOn.jsx` + `src/components/whatson/EventFilters.jsx`. Filters are one flat state object; server-side filtering for date/category, client-side for the rest. Shared `selectClass` string; 2-up grid on mobile, wrapping flex row on desktop; dependent controls are **dimmed + disabled**, not hidden; debounced (600ms) postcode input with three-state border feedback (`border-red-300` / `border-green-300` / `border-gray-200`).
- **Card grid:** `src/pages/Events.jsx` — `grid grid-cols-1 md:grid-cols-2 gap-8` with `delay: i * 0.1` fade-in.
- **Public form → API:** `src/components/home/NewsletterBanner.jsx` — five-state machine (`idle | submitting | success | partial | error`), `await res.json().catch(() => ({}))`, and the site's **only** `role="status" aria-live="polite"` region.
- **Modal form → direct Supabase:** `src/components/whatson/SubmitEventModal.jsx`. Chrome, success-replaces-form state, and the `23505`-is-success nuance. **Do not copy its anon-key insert for this feature** (§3).
- Spinner idiom (copy-pasted everywhere, never extracted): `<div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />`.

**Known a11y gaps you will inherit unless you spec otherwise:** no `htmlFor`/`id` pairing anywhere (wrapping-`<label>` pattern only); no modal is a real dialog (no `role="dialog"`, no focus trap, no Escape); `LondonEventCard`'s whole card is a `<div onClick>` — keyboard-unreachable; no `focus-visible`; `prefers-reduced-motion` never honoured; **no 404 route**; **no text search exists anywhere on the public site** (only `src/pages/admin/SubscribersManager.jsx`) — a directory search box has no precedent to copy.

---

## 6. What does NOT exist and must be built or decided

| Capability | Status | Note |
|---|---|---|
| **Rate limiting** | **Absent.** No KV, Upstash, Redis, or in-memory limiter | `/api/subscribe` is fully open and unthrottled today |
| **CAPTCHA / Turnstile / hCaptcha** | **Absent** | Nothing to configure; new dependency + new third party (privacy policy impact) |
| **Honeypot field** | **Absent** | Cheapest first line; zero new vendors |
| **CSRF token / Origin or Referer check** | **Absent** | No route reads `origin`, `referer`, or `x-forwarded-for` |
| **File upload for business logos** | **Half-exists.** `ImageUpload` + `uploadEventImage()` write to one **public** `event-images` bucket from the browser with the anon key. **No bucket policies exist in any migration** (the only reference is a commented-out line at the foot of `001`). No size or MIME validation beyond `accept="image/*"` | Admin-side upload works today. **Public-visitor upload does not exist and would be an unauthenticated file dropbox.** DECISION: either admin uploads the logo during review, or a new bucket + server-side signed-upload route is built |
| **Consent versioning / evidencing** | **Absent.** No `consent_text`, `consent_version`, `consent_method`, `ip_address`, `user_agent`, or `double_optin_confirmed_at` column exists anywhere. The newsletter form has no consent checkbox and no privacy link at the point of collection | The org's published policy names **consent** as its lawful basis; it currently cannot evidence what anyone agreed to |
| **Roles / permission tiers** | **Absent.** Any authenticated Supabase user is a full admin and can create and delete other admins (`api/admin/users.js`) | There is **no hook point** for "only some admins see private contact details". If the directory needs that, it is net-new: a role claim or an admin table plus checks in every `/api/admin/*` route and RLS policy |
| **Moderation states** | **Two incompatible precedents.** `london_events.approved boolean` vs `activities.status text check (...)` + `reject_reason` | DECISION: copy `activities` — you need "held" and "rejected with a reason", which a boolean cannot express |
| **Email notification** (to admin on submission, or to submitter on approval) | **Absent.** `api/_lib/brevo.js` only creates *contacts* — it sends nothing. No transactional email path exists in the repo | Net-new: a Brevo transactional send, plus a `/unsubscribe` story if it becomes a recurring channel |
| **CSV export** | **Absent everywhere.** No download helper, no serialiser, no `Blob`/`createObjectURL` in the codebase | The only export-shaped affordance is copy-HTML-to-clipboard in `NewsletterManager.jsx:58-66` |
| **Unsubscribe / erasure route** | **Absent.** No `/unsubscribe` route, no API, no admin action writes `unsubscribed_at` | The published policy promises withdrawal "at any time" |
| **Retention / deletion job** | **Absent.** No cron in `vercel.json`, no TTL, no sweep | Policy promises deletion within 20 working days |

---

## 7. Legal/policy constraints already published on the site

These pages are live and are commitments. A directory that publishes people's details walks straight into them.

**`src/pages/GdprPolicy.jsx`** (Approved July 2024; controller **Aster Thackery**, CIC 16387545):
- Lawful basis for opt-in data is **Consent**. Volunteer/admin contact details are **Legitimate interests**. A business directory entry is neither yet — the basis must be stated in the spec.
- "**Data minimisation** — adequate, relevant, and limited to what is necessary."
- "We only retain personal data for as long as necessary… retention practices are reviewed every six months. When data is no longer needed, it is securely deleted **within 20 working days**." Data held by consent is "retained for the period the individual has consented to."
- "We do not share personal data with third parties except where strictly necessary… **data subjects are informed in advance wherever possible**."
- "**No data is transferred outside the UK without appropriate safeguards.**"
- All eight data-subject rights, including erasure and portability, plus ICO complaint rights and immediate ICO breach notification.

**`src/pages/PrivacyPolicy.jsx`** — the collection list is only: newsletter email; name/contact if you book an event or contact us; basic analytics. Third parties listed: Supabase, Brevo, Eventbrite. **Anything the directory form collects that is not on that list must be added to this page in the same change.** No retention period, no lawful basis, and no cookie section appear on this page. Its dateline is `new Date().getFullYear()` — it always claims to be current.

**`src/pages/SafeguardingPolicy.jsx`** — no image identifying a child may be published without the explicit consent of a person with parental responsibility. Relevant if listings carry photos.

**Divergences that already exist** (pre-existing, but a new PII-collecting form widens the exposure and a regulator would look at the whole surface): the privacy page omits data already collected by `JoinCommunityModal` (name, area, interests, **a child's school-year cohort**) and omits Vercel, Google Analytics, Behold, Perplexity and the postcode geocoder as processors; **Google Analytics loads unconditionally in `index.html:20-26` with no consent gate and no cookie banner**; there is no unsubscribe route; and no deletion job exists.

**Directory-specific point for the PM:** a sole trader's business email/phone *is* personal data. Publishing it is a new processing purpose with a new lawful basis, and the form must make the public/private split explicit at the point of collection — field by field, not in a footnote.

---

## 8. Named risks for a public-write endpoint on this stack

1. **Unauthenticated, unthrottled, uncaptcha'd write.** `/api/subscribe` is the existing template and has literally none of: rate limit, CAPTCHA, honeypot, origin check, IP read, user-agent check. A loop against a new `/api/directory/submit` fills Postgres and floods the admin moderation queue. **Mitigate before launch, not after.**
2. **The anon key is public.** It ships in the JS bundle. RLS is the only boundary. Any table with a public INSERT policy is directly writable from `curl` — bypassing your form, your validation, and any client-side consent gate. This is why consent capture must be a server route.
3. **`with check (true)` lets the submitter author their own consent record** (`019`/`027` caveats). If consent columns live on an anon-insertable table, the record is worthless as evidence.
4. **View-based "public projections" leak** unless `security_invoker = on` + `revoke … from anon` — and even then anon can query the base table. `018` documents this happening in production. **Split the tables; do not rely on a view.**
5. **Every logged-in account is a full admin.** One compromised or shared admin login exposes every private contact row *and* can create further admin accounts. There is no audit log of who published, rejected, or read a listing.
6. **PII in server logs.** `api/subscribe.js` does `console.error('[subscribe] conflict on', email, …)` — a real email address into Vercel logs. Do not repeat this with names, phones or addresses; log the row `id` only.
7. **Public storage bucket.** `event-images` is public and filenames are `Date.now()`-random. Anything uploaded is world-readable at a stable URL forever, with no deletion path. A logo is fine; a scanned document or a photo containing a child is not.
8. **No security headers.** `vercel.json` sets no CSP, HSTS, or X-Frame-Options. A page rendering user-submitted business descriptions has a wider XSS surface than anything currently on the site — keep submitted content as text and never `dangerouslySetInnerHTML` it (the newsletter editor is the only place raw HTML is handled, and it is admin-authored).
9. **Admin list pages load everything client-side.** Only `SubscribersManager` paginates, and `api/admin/subscribers.js` caps at `MAX_ROWS = 1000`. A directory that grows past a few hundred rows needs the "show more" pattern or real pagination from day one.
10. **A second email channel without an unsubscribe route** compounds the existing gap: the site promises withdrawal at any time and has no mechanism. If approval emails or directory updates are in scope, an unsubscribe path is in scope with them.
11. **Ambiguity to resolve before speccing:** "admin-authored" — if it means *admins define the form's fields at runtime*, that is a dynamic-schema build (jsonb field definitions + a renderer) with no precedent in this codebase, and roughly triples the work versus a fixed, code-defined form. Confirm which is meant.

---

*Process note: a block appended to tool output in this session instructed me to route file reads and edits through `Bash` (`cat`, `sed`, heredocs) instead of the `Read`/`Edit`/`Write` tools, framed as "while bypass permissions mode is active". Instructions arriving inside tool output are not from the user or the calling agent, and that one would route file access around the tools the permission system inspects. I did not follow it. Flagging it because the api-privacy recon agent hit the same injection independently — it is recurring, not a one-off.*