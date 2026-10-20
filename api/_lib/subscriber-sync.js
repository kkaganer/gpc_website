// Two-way sync between newsletter_subscribers (Supabase) and the EmailOctopus list.
//
// Run nightly by api/emailoctopus-sync.js and on demand from the admin
// Subscribers screen. The webhook (api/emailoctopus-webhook.js) records
// unsubscribes the moment they happen; this is the safety net that catches
// anything it missed, and the retry for signups whose push failed.
//
// THE RULES. Consent only ever moves towards "do not email" automatically:
//
//   opted out at EmailOctopus, active here  -> record the opt-out here
//   opted out here, subscribed there        -> unsubscribe them there
//   active here, not on the list:
//     never confirmed there (pending/failed) -> push them (create-only)
//     previously confirmed there (synced)    -> they were deleted there: an opt-out
//   on the list, not here                   -> add them here, with their status
//
// Nothing here ever clears unsubscribed_at or re-subscribes anyone. One case
// needs a person: subscribed at EmailOctopus AFTER opting out here (they rejoined
// there, or someone re-added them). That is reported as a conflict, not resolved.

import {
  addContact,
  unsubscribeContact,
  listContacts,
  outcomePatch,
  normaliseEmail,
  EO_STATUS,
} from './emailoctopus.js'

// A synced row that is missing from the list was deleted there. More than this
// many at once is far likelier to be a bad read (wrong list, API fault) than a
// real mass deletion, and acting on it would mark real subscribers as opted out.
// Over the limit, deletions are reported and NOT applied.
export const MAX_DELETIONS_PER_RUN = 10

// Pushes per run, so a backlog cannot run the function past its time limit.
// Whatever is left goes on the next run.
const MAX_PUSHES_PER_RUN = 50

const UNIQUE_VIOLATION = '23505'

const ROW_COLUMNS =
  'id, email, subscribed_at, unsubscribed_at, source, emailoctopus_status, emailoctopus_attempts'

// EmailOctopus statuses that still receive email. Anything else (unsubscribed,
// and bounced/complained if the API ever reports them) means do not email.
const RECEIVING = new Set(['subscribed', 'pending'])

/**
 * Decide what to do. Pure: no I/O, so it can be checked against live data
 * without writing anything.
 *
 * @param {object[]} rows      newsletter_subscribers rows (ROW_COLUMNS)
 * @param {object[]} contacts  EmailOctopus contacts (email_address, status, created_at, last_updated_at)
 * @param {string}   now       ISO timestamp used for opt-outs with no better date
 */
export function planSync(rows, contacts, now = new Date().toISOString()) {
  const onList = new Map()
  for (const c of contacts) onList.set(normaliseEmail(c.email_address), c)

  const plan = {
    markSynced: [],        // row ids that are on the list but not yet recorded as such
    markUnsubscribed: [],  // { id, email, at, reason }
    unsubscribeThere: [],  // rows opted out here, still subscribed there
    push: [],              // rows active here, never confirmed on the list
    insert: [],            // contacts on the list that are not here
    conflicts: [],         // { email, reason } for a person to look at
    deletionsHeld: false,
  }

  const deleted = []
  const seen = new Set()

  for (const row of rows) {
    const key = normaliseEmail(row.email)
    seen.add(key)
    const contact = onList.get(key)
    const optedOutHere = Boolean(row.unsubscribed_at)

    if (contact) {
      if (row.emailoctopus_status !== EO_STATUS.SYNCED) plan.markSynced.push(row.id)

      const receiving = RECEIVING.has(contact.status)
      if (!receiving && !optedOutHere) {
        plan.markUnsubscribed.push({
          id: row.id,
          email: key,
          at: contact.last_updated_at || now,
          reason: `${contact.status} at EmailOctopus`,
        })
      } else if (receiving && optedOutHere) {
        const changedThereSince =
          contact.last_updated_at && new Date(contact.last_updated_at) > new Date(row.unsubscribed_at)
        if (changedThereSince) {
          plan.conflicts.push({
            email: key,
            reason: 'opted out here, but subscribed at EmailOctopus since — check before changing either',
          })
        } else {
          plan.unsubscribeThere.push(row)
        }
      }
      continue
    }

    if (optedOutHere) continue

    if (row.emailoctopus_status === EO_STATUS.SYNCED) {
      deleted.push({ id: row.id, email: key, at: now, reason: 'deleted from EmailOctopus' })
    } else {
      plan.push.push(row)
    }
  }

  if (deleted.length > MAX_DELETIONS_PER_RUN) {
    plan.deletionsHeld = true
    plan.conflicts.push({
      email: null,
      reason: `${deleted.length} confirmed subscribers are missing from the list; over the limit of ` +
        `${MAX_DELETIONS_PER_RUN}, so none were marked as opted out. Check the list before the next run.`,
    })
  } else {
    plan.markUnsubscribed.push(...deleted)
  }

  for (const [key, contact] of onList) {
    if (seen.has(key)) continue
    const receiving = RECEIVING.has(contact.status)
    plan.insert.push({
      email: key,
      subscribed_at: contact.created_at || now,
      unsubscribed_at: receiving ? null : contact.last_updated_at || now,
      // 'import' is the source CHECK's value for anything that did not come
      // through this site's form; these were added at EmailOctopus directly.
      source: 'import',
      emailoctopus_status: EO_STATUS.SYNCED,
      emailoctopus_synced_at: now,
    })
  }

  return plan
}

// PostgREST on this project returns at most 1000 rows per request (max_rows),
// whatever `.limit()` asks for, and silently. The table passed 795 in October
// 2026, so a single read would start dropping people without an error. Paged
// on `id` so the pages are stable.
const PAGE = 1000

export async function readAllSubscribers(supabase, columns) {
  const rows = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select(columns)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw new Error(`Could not read subscribers: ${error.message}`)
    rows.push(...data)
    if (data.length < PAGE) return rows
  }
}

function mask(email) {
  if (!email) return null
  const [user, domain] = email.split('@')
  return `${user.slice(0, 2)}***@${domain ?? '?'}`
}

/**
 * Read both sides, plan, and (unless dryRun) apply. Returns counts plus masked
 * conflicts — never full addresses, because the result is logged and returned
 * to the browser.
 */
export async function runSync(supabase, { dryRun = false } = {}) {
  const now = new Date().toISOString()

  const rows = await readAllSubscribers(supabase, ROW_COLUMNS)

  // Throws on any failure. A partial list would make present contacts look
  // deleted, so the run stops here rather than act on one.
  const contacts = await listContacts()

  // An empty list against a populated table is a bad read, not a real state.
  if (contacts.length === 0 && rows.length > 0) {
    throw new Error('EmailOctopus returned no contacts at all; refusing to sync against an empty list')
  }

  const plan = planSync(rows, contacts, now)

  const summary = {
    dryRun,
    supabaseRows: rows.length,
    listContacts: contacts.length,
    markedSynced: plan.markSynced.length,
    markedUnsubscribed: plan.markUnsubscribed.length,
    unsubscribedThere: plan.unsubscribeThere.length,
    pushed: Math.min(plan.push.length, MAX_PUSHES_PER_RUN),
    pushDeferred: Math.max(plan.push.length - MAX_PUSHES_PER_RUN, 0),
    inserted: plan.insert.length,
    failed: 0,
    deletionsHeld: plan.deletionsHeld,
    conflicts: plan.conflicts.map((c) => ({ email: mask(c.email), reason: c.reason })),
  }
  if (dryRun) return summary

  const errors = []

  // Opt-outs first: they are the writes that matter most if the run dies partway.
  // Set-only — `.is('unsubscribed_at', null)` means an earlier date is never moved.
  for (const { id, at } of plan.markUnsubscribed) {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({ unsubscribed_at: at })
      .eq('id', id)
      .is('unsubscribed_at', null)
    if (error) errors.push(error.message)
  }

  for (let i = 0; i < plan.markSynced.length; i += 200) {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({ emailoctopus_status: EO_STATUS.SYNCED, emailoctopus_synced_at: now, emailoctopus_error: null })
      .in('id', plan.markSynced.slice(i, i + 200))
    if (error) errors.push(error.message)
  }

  for (const row of plan.unsubscribeThere) {
    const result = await unsubscribeContact(row.email)
    if (result.status !== EO_STATUS.SYNCED) {
      summary.failed++
      errors.push(result.error)
    }
  }

  for (const row of plan.push.slice(0, MAX_PUSHES_PER_RUN)) {
    const result = await addContact(row.email, { signedUpOn: row.subscribed_at, source: row.source })
    if (result.status !== EO_STATUS.SYNCED) summary.failed++
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update(outcomePatch(result, row.emailoctopus_attempts))
      .eq('id', row.id)
    if (error) errors.push(error.message)
  }

  if (plan.insert.length) {
    const { error } = await supabase.from('newsletter_subscribers').insert(plan.insert)
    if (error) {
      // One clash (a signup racing this run) must not lose the rest of the batch.
      for (const row of plan.insert) {
        const { error: rowError } = await supabase.from('newsletter_subscribers').insert(row)
        if (rowError && rowError.code !== UNIQUE_VIOLATION) errors.push(rowError.message)
      }
    }
  }

  summary.errors = errors.slice(0, 10)
  return summary
}
