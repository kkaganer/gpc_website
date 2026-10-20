// The single place the site talks to EmailOctopus.
//
// EmailOctopus is where the newsletter is sent from. Supabase is the source of
// truth for who is subscribed; EmailOctopus holds the sending copy. Every write
// to it — the public signup, the admin retry, the nightly sync — goes through
// here, so "did it reach the list?" is answered the same way everywhere. Brevo
// taught that lesson: two copies of the push drifted, and a failing write kept
// reporting success for five months.
//
// Files under api/_lib are not routed as serverless functions (leading
// underscore), so this is a plain shared module.

const API = 'https://api.emailoctopus.com'

// The "Audience" list, created 2026-09-07. An id, not a secret, so it lives
// here rather than in an env var that could be missing on one environment.
// Webhook events for any OTHER list (a future MIBW list, say) are ignored on
// purpose: leaving that list is not leaving the newsletter.
export const LIST_ID = 'a188187c-aaf3-11f1-ba80-732cb97c3cac'

// Mirrors the emailoctopus_status CHECK constraint in migration 038.
export const EO_STATUS = {
  PENDING: 'pending',
  SYNCED: 'synced',
  FAILED: 'failed',
  SKIPPED: 'skipped',
}

// Rate limit is a 100-token bucket refilling at 10/s. A 429 says how long to
// wait; two waits is plenty for the volumes here (a handful of rows a night).
const MAX_RATE_LIMIT_RETRIES = 2

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export function normaliseEmail(raw) {
  return typeof raw === 'string' ? raw.trim().toLowerCase() : ''
}

async function call(method, path, body) {
  const apiKey = process.env.EMAILOCTOPUS_API_KEY
  if (!apiKey) return { skipped: true }

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })

    if (res.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
      const wait = Number(res.headers.get('X-RateLimit-Retry-After')) || 1
      await sleep(Math.min(wait, 10) * 1000)
      continue
    }

    const data = await res.json().catch(() => ({}))
    return { res, data }
  }
}

function describe(res, data) {
  const detail = data?.detail || data?.title || 'unknown error'
  return `EmailOctopus ${res.status}: ${detail}`.slice(0, 500)
}

/**
 * Put a NEW subscriber on the list.
 *
 * Create-only, on purpose. A contact who is already on the list — including one
 * who unsubscribed there — comes back 409 and is left exactly as it is. Using
 * the upsert endpoint here would let a signup form, or a retry, quietly flip an
 * unsubscribed person back to subscribed.
 *
 * Never throws: the caller has already stored the email and needs an outcome to
 * record, not an exception to unwind.
 *
 * @param {string} email
 * @param {{ signedUpOn?: string, source?: string }} details
 *   Filled into the SignedUpOn and Source fields, which every contact from the
 *   2026-09-11 import carries.
 * @returns {Promise<{status: string, error: string|null, httpStatus: number|null}>}
 */
export async function addContact(email, { signedUpOn, source } = {}) {
  const fields = {}
  if (signedUpOn) fields.SignedUpOn = String(signedUpOn).slice(0, 10)
  if (source) fields.Source = source

  let out
  try {
    out = await call('POST', `/lists/${LIST_ID}/contacts`, {
      email_address: email,
      status: 'subscribed',
      fields,
    })
  } catch (err) {
    return { status: EO_STATUS.FAILED, error: `EmailOctopus request failed: ${err?.message || err}`, httpStatus: null }
  }

  if (out.skipped) {
    return { status: EO_STATUS.SKIPPED, error: 'EMAILOCTOPUS_API_KEY is not configured', httpStatus: null }
  }

  const { res, data } = out
  // 201 = created. 409 = already on the list, which is the end state we want —
  // and its status there is deliberately not touched.
  if (res.status === 201 || res.status === 409) {
    return { status: EO_STATUS.SYNCED, error: null, httpStatus: res.status }
  }
  return { status: EO_STATUS.FAILED, error: describe(res, data), httpStatus: res.status }
}

/**
 * Mark a contact unsubscribed on the list. The one write that may change an
 * existing contact's status, and it only ever moves it towards "do not email".
 * If the contact is not on the list it is created as unsubscribed, which keeps
 * a suppression record there too.
 */
export async function unsubscribeContact(email) {
  let out
  try {
    out = await call('PUT', `/lists/${LIST_ID}/contacts`, {
      email_address: email,
      status: 'unsubscribed',
    })
  } catch (err) {
    return { status: EO_STATUS.FAILED, error: `EmailOctopus request failed: ${err?.message || err}`, httpStatus: null }
  }

  if (out.skipped) {
    return { status: EO_STATUS.SKIPPED, error: 'EMAILOCTOPUS_API_KEY is not configured', httpStatus: null }
  }

  const { res, data } = out
  if (res.ok) return { status: EO_STATUS.SYNCED, error: null, httpStatus: res.status }
  return { status: EO_STATUS.FAILED, error: describe(res, data), httpStatus: res.status }
}

/**
 * Every contact on the list, in every status. Throws on any failure: a partial
 * read would make present contacts look deleted, so the sync must not run on one.
 */
export async function listContacts() {
  if (!process.env.EMAILOCTOPUS_API_KEY) throw new Error('EMAILOCTOPUS_API_KEY is not configured')

  const contacts = []
  // The list endpoint returns `subscribed` only unless asked, so each status is
  // walked separately.
  for (const status of ['subscribed', 'unsubscribed', 'pending']) {
    let after = null
    for (let page = 0; page < 200; page++) {
      const query = new URLSearchParams({ limit: '100', status })
      if (after) query.set('starting_after', after)

      const { res, data } = await call('GET', `/lists/${LIST_ID}/contacts?${query}`)
      if (!res.ok) throw new Error(describe(res, data))

      contacts.push(...(data.data || []))
      after = data.paging?.next?.starting_after
      if (!after) break
    }
  }
  return contacts
}

/**
 * The emailoctopus_* columns to write after a push. Shared by every caller so a
 * synced row always records when it landed and clears the old error, and every
 * attempt bumps the counter and timestamp.
 */
export function outcomePatch(result, previousAttempts) {
  const now = new Date().toISOString()
  const synced = result.status === EO_STATUS.SYNCED

  return {
    emailoctopus_status: result.status,
    // Only a success stamps synced_at; a later failure leaves the earlier
    // genuine timestamp alone.
    ...(synced ? { emailoctopus_synced_at: now } : {}),
    emailoctopus_error: synced ? null : result.error,
    emailoctopus_attempts: (previousAttempts || 0) + 1,
    emailoctopus_last_attempt_at: now,
  }
}
