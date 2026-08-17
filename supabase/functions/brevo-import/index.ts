// One-off: pull every Brevo contact into `newsletter_subscribers`.
//
// The mirror image of brevo-backfill. That function pushes Supabase -> Brevo;
// this one pulls Brevo -> Supabase, so the database becomes the source of truth
// and Brevo becomes a downstream copy rather than the only record of who is on
// this list.
//
// WHY. Brevo holds ~765 contacts; this table holds 32. The ~733 difference came
// through the Brevo-hosted signup form, which posts straight to Brevo and never
// touched this database. Those people exist in exactly one place, owned by a
// third party — losing or leaving that account would lose them.
//
// CONSENT — the reason this is not a plain copy. `emailBlacklisted: true` means
// that person unsubscribed or was suppressed. They are imported WITH
// `unsubscribed_at` set (migration 027), never as ordinary active subscribers
// and never silently dropped: a suppression list only works if you keep it.
// Dropping them would mean a later re-import or a re-subscribe silently re-adds
// someone who opted out.
//
// NO CLOBBER. The 32 existing rows include real website signups. An import must
// not rewrite their history, so existing emails are partitioned out BEFORE any
// write rather than blanket-upserted — see api/subscribe.js, which documents the
// same defect class (an upsert's payload columns overwrite on conflict, stamping
// a returning subscriber's `source` back and knocking 'synced' back to
// 'pending').
//
// dry_run: true (the default) reports what WOULD happen, with a masked sample,
// and reaches no write of any kind.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2),
    { status, headers: { ...cors, 'Content-Type': 'application/json' } })

// Brevo's maximum page size for GET /v3/contacts.
const PAGE_SIZE = 1000

// 765 contacts fits one page today, but hardcoding one page is a bug waiting
// for the list to grow. The cap is a runaway guard, not a limit we expect to
// meet — 50 pages is 50,000 contacts. If it ever trips the run is truncated,
// which is reported rather than swallowed.
const MAX_PAGES = 50

// A few hundred rows per statement: large enough that 733 rows is a handful of
// round trips, small enough that one rejected batch is a small blast radius.
const INSERT_BATCH = 250

const MAX_EMAIL_LENGTH = 254

// Deliberately loose, and identical to api/subscribe.js: a junk filter, not an
// RFC 5322 parser. These addresses came FROM Brevo, which is the real authority
// on deliverability, so anything rejected here is malformed rather than merely
// unusual — and it is counted, not dropped in silence.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Postgres unique_violation. `email` is the only UNIQUE constraint on this
// table, so this code can only mean "already subscribed".
const UNIQUE_VIOLATION = '23505'

// Same normalisation as api/subscribe.js. Without it Sam@x.com from the hosted
// form and sam@x.com from the website arrive as two rows for one person.
function normaliseEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const email = raw.trim().toLowerCase()
  if (!email || email.length > MAX_EMAIL_LENGTH) return null
  if (!EMAIL_SHAPE.test(email)) return null
  return email
}

function mask(email: string): string {
  const [user, domain] = email.split('@')
  return `${user.slice(0, 2)}***@${domain ?? '?'}`
}

// Brevo's timestamps are ISO strings, but a missing or unparseable one must not
// become `Invalid Date` in a timestamptz column.
function isoOrNull(value: unknown): string | null {
  if (!value) return null
  const t = Date.parse(String(value))
  return Number.isFinite(t) ? new Date(t).toISOString() : null
}

type BrevoContact = {
  email?: string
  emailBlacklisted?: boolean
  createdAt?: string
  modifiedAt?: string
}

type ExistingRow = { email: string, unsubscribed_at: string | null }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const key = Deno.env.get('BREVO_API_KEY')
  if (!key) {
    return json({ error: 'BREVO_API_KEY not configured' }, 500)
  }
  const h = { 'api-key': key, 'accept': 'application/json' }

  let body: Record<string, any> = {}
  try { body = await req.json() } catch { /* defaults */ }
  const dryRun = body.dry_run !== false          // default TRUE — never write by accident

  const now = new Date().toISOString()

  // ---------------------------------------------------------------------
  // PHASE 1 — read every contact out of Brevo, paginated.
  // ---------------------------------------------------------------------
  const contacts: BrevoContact[] = []
  let brevoTotal: number | null = null
  let pages = 0
  let pageCapReached = false

  for (let offset = 0; ;) {
    if (pages >= MAX_PAGES) {
      // Truncating quietly is exactly the class of failure this whole job
      // exists to undo, so it is logged AND surfaced in the response.
      pageCapReached = true
      console.warn(`[brevo-import] page cap ${MAX_PAGES} reached at offset ${offset};`,
        `fetched ${contacts.length} of ${brevoTotal ?? 'unknown'} — run is TRUNCATED`)
      break
    }

    const res = await fetch(
      `https://api.brevo.com/v3/contacts?limit=${PAGE_SIZE}&offset=${offset}`, { headers: h })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      return json({
        error: `Brevo returned ${res.status} fetching contacts at offset ${offset}`,
        detail: detail.slice(0, 300),
      }, 500)
    }

    const page = await res.json().catch(() => null)
    const batch: BrevoContact[] = Array.isArray(page?.contacts) ? page.contacts : []
    if (typeof page?.count === 'number') brevoTotal = page.count

    contacts.push(...batch)
    pages++

    // Advance by what actually came back rather than by what was asked for, so
    // a server-side cap below `limit` walks the list correctly instead of
    // skipping everyone past the first short page. An empty page ends the loop,
    // which also stops a Brevo that ignores `offset` from spinning to the cap.
    if (batch.length === 0) break
    offset += batch.length
    if (brevoTotal !== null && contacts.length >= brevoTotal) break
  }

  // ---------------------------------------------------------------------
  // PHASE 2 — read the emails already in the table.
  //
  // This is what makes the no-clobber rule structural: existing rows are
  // identified before anything is written, so an import can never reach an
  // UPDATE that would touch their `source`, `subscribed_at` or `brevo_status`.
  // ---------------------------------------------------------------------
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Keyed by NORMALISED email but holding the stored value, because rows
  // predating the lowercasing fix in api/subscribe.js may be stored mixed-case
  // and the UNIQUE constraint is on the raw text. Comparing normalised avoids a
  // duplicate person; updating by the stored value avoids a no-op UPDATE. A
  // legacy mixed-case twin is degenerate but possible, hence a list per key.
  const existing = new Map<string, ExistingRow[]>()

  for (let from = 0; ;) {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('email, unsubscribed_at')
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      return json({
        error: 'Could not read existing subscribers; nothing was written.',
        detail: error.message,
        hint: error.message.includes('unsubscribed_at')
          ? 'Migration 027 (unsubscribed_at) has not been applied yet.'
          : undefined,
      }, 500)
    }

    const rows = (data ?? []) as ExistingRow[]
    for (const row of rows) {
      const norm = normaliseEmail(row.email)
      if (!norm) continue
      const bucket = existing.get(norm)
      if (bucket) bucket.push(row)
      else existing.set(norm, [row])
    }

    // Same reasoning as the Brevo loop: step by the rows returned, because
    // PostgREST enforces its own max-rows ceiling regardless of the range asked
    // for. Under-reading here would mean re-inserting an existing subscriber.
    if (rows.length === 0) break
    from += rows.length
  }

  // ---------------------------------------------------------------------
  // PHASE 3 — partition. Pure: this decides, it does not write.
  // ---------------------------------------------------------------------
  const toInsert: Array<Record<string, unknown>> = []
  const toMark: Array<{ email: string, at: string }> = []
  const seen = new Set<string>()

  let skippedNoEmail = 0
  let duplicateInBrevo = 0
  let alreadyPresent = 0
  let unsubscribedSeen = 0

  for (const c of contacts) {
    const email = normaliseEmail(c?.email)
    if (!email) { skippedNoEmail++; continue }
    if (seen.has(email)) { duplicateInBrevo++; continue }
    seen.add(email)

    // A blacklisted contact is a person who left. Record when, using Brevo's
    // own modifiedAt where it parses so the suppression carries its real date.
    const blacklisted = c?.emailBlacklisted === true
    const unsubscribedAt = blacklisted ? (isoOrNull(c?.modifiedAt) ?? now) : null
    if (blacklisted) unsubscribedSeen++

    const prior = existing.get(email)
    if (prior) {
      alreadyPresent++

      // THE ASYMMETRY, and the subtle part of this function.
      //
      // The ONLY column an import may change on a row that already exists is
      // `unsubscribed_at`, and only to SET it — never to clear it. Setting is
      // safe because honouring an opt-out recorded in Brevo can only ever
      // remove someone from a send. Clearing is not: Brevo contacts can be
      // re-added by anyone with access to that account (a CSV load, the hosted
      // form, a staff member un-blacklisting by hand), and treating that as
      // consent would silently resurrect someone who opted out. When the two
      // stores disagree about consent, the more restrictive answer wins.
      //
      // `source`, `subscribed_at`, `brevo_status` and every other column are
      // untouched — a website signup does not become an 'import', their real
      // signup moment is not the import moment, and 'synced' never moves
      // backwards.
      if (unsubscribedAt) {
        for (const row of prior) {
          if (!row.unsubscribed_at) toMark.push({ email: row.email, at: unsubscribedAt })
        }
      }
      continue
    }

    toInsert.push({
      email,
      // Brevo's createdAt is this person's real signup moment; today's date is
      // only when we noticed. Fall back to now if it does not parse.
      subscribed_at: isoOrNull(c?.createdAt) ?? now,
      source: 'import',
      // 'synced' with a timestamp because we just read this contact OUT of
      // Brevo — that is evidence the contact exists there, not an assumption
      // about a write we made. brevo_attempts and brevo_last_attempt_at keep
      // their defaults on purpose: we attempted nothing against Brevo here.
      brevo_status: 'synced',
      brevo_synced_at: now,
      unsubscribed_at: unsubscribedAt,
    })
  }

  const insertsCarryingUnsubscribe = toInsert.filter((r) => r.unsubscribed_at).length
  const failures: Array<Record<string, unknown>> = []

  // Reported on both paths, so the dry run's numbers are the ones the real run
  // then acts on. `duplicate_in_brevo` and `page_cap_reached` appear only when
  // non-zero: the same address twice in Brevo, or a truncated fetch, are things
  // an operator must be told about, and silence is the wrong way to say "none".
  const tail = {
    ...(duplicateInBrevo ? { duplicate_in_brevo: duplicateInBrevo } : {}),
    ...(pageCapReached ? { page_cap_reached: true } : {}),
  }

  // THE GUARD. Everything above this point is reads and arithmetic; every write
  // in this function is below it. A dry run — the default — returns here, so on
  // that path there is no insert or update to disable, because none is
  // reachable.
  if (dryRun) {
    return json({
      dry_run: true,
      brevo_total: brevoTotal,
      fetched: contacts.length,
      would_insert: toInsert.length,
      already_present: alreadyPresent,
      unsubscribed_seen: unsubscribedSeen,
      // Rows this run would stamp with unsubscribed_at: blacklisted contacts
      // arriving as new rows, plus existing rows newly stamped. Lower than
      // unsubscribed_seen when someone is already recorded as unsubscribed here.
      unsubscribed_marked: insertsCarryingUnsubscribe + toMark.length,
      skipped_no_email: skippedNoEmail,
      // A small masked sample so the operator can sanity-check WHO this would
      // add before letting it write. Presence is the signal; the address is not
      // needed, and this response is not the place to dump 733 of them.
      would_insert_sample: toInsert.slice(0, 10).map((r) => mask(r.email as string)),
      ...tail,
    })
  }

  // ---------------------------------------------------------------------
  // PHASE 4 — write. Reached only with an explicit dry_run: false.
  // ---------------------------------------------------------------------
  let inserted = 0
  let markedUnsubscribed = 0
  let insertedCarryingUnsubscribe = 0

  for (let i = 0; i < toInsert.length; i += INSERT_BATCH) {
    const batch = toInsert.slice(i, i + INSERT_BATCH)
    const { error } = await supabase.from('newsletter_subscribers').insert(batch)

    if (!error) {
      inserted += batch.length
      insertedCarryingUnsubscribe += batch.filter((r) => r.unsubscribed_at).length
      continue
    }

    // A batch is one statement, so a single bad row rejects all 250 of its
    // neighbours. Retry the batch row by row rather than lose good addresses to
    // one bad one — this is a one-off import and correctness beats round trips.
    console.warn(`[brevo-import] batch at ${i} failed (${error.code}); retrying row by row`)
    for (const row of batch) {
      const { error: rowError } = await supabase.from('newsletter_subscribers').insert(row)
      if (!rowError) {
        inserted++
        if (row.unsubscribed_at) insertedCarryingUnsubscribe++
      } else if (rowError.code === UNIQUE_VIOLATION) {
        // Someone subscribed through the website between phase 2 and now. Their
        // row wins untouched — that is the no-clobber rule, not a failure.
        alreadyPresent++
        // EXCEPT the suppression. The no-clobber rule protects their signup
        // details, not their consent: if Brevo says this person opted out, that
        // fact must still land or it is lost entirely — this row was never in
        // phase 2's map, so nothing else will carry it. Queued for the marking
        // pass, which sets it only where the column is still null, so a row
        // that unsubscribed on its own keeps its own earlier timestamp.
        if (row.unsubscribed_at) {
          toMark.push({ email: row.email as string, at: row.unsubscribed_at as string })
        }
      } else {
        failures.push({ email: mask(row.email as string), code: rowError.code, message: rowError.message })
      }
    }
  }

  // Marking runs per row because each carries its own Brevo modifiedAt, and the
  // set is small by construction (only rows that already exist here AND are
  // blacklisted in Brevo AND are not already stamped).
  //
  // `.is('unsubscribed_at', null)` restates the set-only rule as part of the
  // statement itself, so a row that unsubscribed while this run was in flight
  // keeps its own earlier timestamp. The asymmetry is then enforced by the
  // database, not merely by the partition above deciding not to ask.
  for (const { email, at } of toMark) {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .update({ unsubscribed_at: at })
      .eq('email', email)
      .is('unsubscribed_at', null)
      .select('id')

    // Counted from rows actually changed: a statement that matched nothing
    // because the row was already stamped is not a suppression this run made.
    if (error) failures.push({ email: mask(email), code: error.code, message: error.message, op: 'mark_unsubscribed' })
    else markedUnsubscribed += data?.length ?? 0
  }

  return json({
    dry_run: false,
    brevo_total: brevoTotal,
    fetched: contacts.length,
    inserted,
    already_present: alreadyPresent,
    unsubscribed_seen: unsubscribedSeen,
    // Counted from what actually landed, not from what was planned: a batch
    // that failed must not report suppressions it never wrote.
    unsubscribed_marked: insertedCarryingUnsubscribe + markedUnsubscribed,
    skipped_no_email: skippedNoEmail,
    ...tail,
    ...(failures.length ? { failures } : {}),
  })
})
