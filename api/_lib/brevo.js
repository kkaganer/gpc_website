// The single place a contact is pushed to Brevo.
//
// Both the public subscribe endpoint and the admin retry endpoint go through
// here, so "did the Brevo signup work?" is answered identically in both. The
// previous split — one copy in api/subscribe.js, another in the edge function —
// is how a failing write kept reporting success for five months.
//
// Files under api/_lib are not routed as serverless functions (leading
// underscore), so this is a plain shared module.

const BREVO_CONTACTS_URL = 'https://api.brevo.com/v3/contacts'

// Mirrors the brevo_status CHECK constraint in migration 019.
export const BREVO_STATUS = {
  PENDING: 'pending',
  SYNCED: 'synced',
  FAILED: 'failed',
  SKIPPED: 'skipped',
}

/**
 * Push one contact to Brevo.
 *
 * Contacts are created in Brevo's general contact pool, deliberately not
 * assigned to any list — the goal here is capturing the address. A list can be
 * built from the contacts later, in Brevo, when a campaign needs one.
 *
 * Never throws — a transport failure is a `failed` result, not an exception,
 * because the caller has already captured the email and needs to record the
 * outcome rather than unwind.
 *
 * @param {string} email
 * @returns {Promise<{status: string, error: string|null, httpStatus: number|null}>}
 *   status is one of BREVO_STATUS. `synced` means Brevo confirmed the contact
 *   exists (created, updated, or already present).
 */
export async function syncContactToBrevo(email) {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    return {
      status: BREVO_STATUS.SKIPPED,
      error: 'BREVO_API_KEY is not configured',
      httpStatus: null,
    }
  }

  let res
  try {
    res = await fetch(BREVO_CONTACTS_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        email,
        // Re-adding an existing contact becomes a no-op update rather than an
        // error, which is what makes retry and backfill safe to run repeatedly.
        updateEnabled: true,
      }),
    })
  } catch (err) {
    return {
      status: BREVO_STATUS.FAILED,
      error: `Brevo request failed: ${err?.message || String(err)}`,
      httpStatus: null,
    }
  }

  // 201 = created, 204 = updated (no body).
  if (res.ok || res.status === 204) {
    return { status: BREVO_STATUS.SYNCED, error: null, httpStatus: res.status }
  }

  const body = await res.json().catch(() => ({}))

  // The contact already exists — that is the desired end state, not a failure.
  if (body?.code === 'duplicate_parameter') {
    return { status: BREVO_STATUS.SYNCED, error: null, httpStatus: res.status }
  }

  const detail = body?.message || body?.code || 'unknown error'
  return {
    status: BREVO_STATUS.FAILED,
    error: `Brevo ${res.status}: ${detail}`.slice(0, 500),
    httpStatus: res.status,
  }
}
