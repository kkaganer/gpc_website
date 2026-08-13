import { supabase } from './supabase'

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')
  return { Authorization: `Bearer ${session.access_token}` }
}

async function parseResponse(res) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('API not available - run "npx wrangler pages dev dist" instead of "vite dev" for local development')
  }
}

export async function fetchAdminUsers() {
  const res = await fetch('/api/admin/users', { headers: await authHeaders() })
  const data = await parseResponse(res)
  if (!res.ok) throw new Error(data.error || 'Failed to fetch users')
  return data.users
}

export async function createAdminUser(email, password) {
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({ email, password }),
  })
  const data = await parseResponse(res)
  if (!res.ok) throw new Error(data.error || 'Failed to create user')
  return data.user
}

export async function deleteAdminUser(userId) {
  const res = await fetch('/api/admin/users', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({ userId }),
  })
  const data = await parseResponse(res)
  if (!res.ok) throw new Error(data.error || 'Failed to delete user')
  return data
}

// Returns the whole payload, not just the rows — the counts are what tell the
// admin at a glance how many signups never reached Brevo.
export async function fetchSubscribers() {
  const res = await fetch('/api/admin/subscribers', { headers: await authHeaders() })
  const data = await parseResponse(res)
  if (!res.ok) throw new Error(data.error || 'Failed to fetch subscribers')
  return data
}

// Called with an id, retries that one subscriber. Called with no argument, it
// retries every row that is not already synced.
export async function retryBrevoSync(id) {
  const res = await fetch('/api/admin/subscribers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({ action: 'retry', ...(id ? { id } : {}) }),
  })
  const data = await parseResponse(res)
  if (!res.ok) throw new Error(data.error || 'Failed to retry Brevo sync')
  return data
}
