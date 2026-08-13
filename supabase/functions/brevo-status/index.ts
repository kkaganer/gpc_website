// Diagnostic: report the Brevo account's plan and whether inbound parsing is
// available, WITHOUT the key leaving the server.
//
// BREVO_API_KEY lives only in Supabase secrets — it is not in .env and
// `secrets list` shows digests, not values. This function reads it from the
// runtime environment and returns only the account metadata, never the key.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const key = Deno.env.get('BREVO_API_KEY')
  if (!key) {
    return new Response(JSON.stringify({ error: 'BREVO_API_KEY not configured' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
  const h = { 'api-key': key, 'accept': 'application/json' }

  const account = await fetch('https://api.brevo.com/v3/account', { headers: h })
  const accountBody = await account.json().catch(() => null)

  // The capability test that actually matters: can this account read inbound
  // events? 200 = available, 403 = plan does not include it.
  const inbound = await fetch('https://api.brevo.com/v3/inbound/events?limit=1', { headers: h })
  const inboundBody = await inbound.text()

  // Fingerprint only — enough to identify WHICH key is stored (so it can be
  // matched against the Brevo dashboard) without exposing the secret itself.
  const fingerprint = {
    length: key.length,
    prefix: key.slice(0, 8),
    last4: key.slice(-4),
  }

  // Brevo total contact count (limit=1 still returns the full `count`).
  const contacts = await fetch('https://api.brevo.com/v3/contacts?limit=1', { headers: h })
  const contactsBody = await contacts.json().catch(() => null)

  // Supabase subscribers, bucketed by month, to show exactly when signups
  // stopped reaching one side or the other. Column is `subscribed_at`.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const { data: subs } = await supabase
    .from('newsletter_subscribers')
    .select('email, subscribed_at')
    .order('subscribed_at', { ascending: true })

  const byMonth: Record<string, number> = {}
  for (const r of subs ?? []) {
    const m = String(r.subscribed_at ?? '').slice(0, 7) || 'unknown'
    byMonth[m] = (byMonth[m] ?? 0) + 1
  }

  // THE DEFINITIVE TEST: take the most recent Supabase signups and ask Brevo
  // whether it holds them. Counts alone cannot answer "did the Brevo write
  // fail", because the two stores are written independently and Brevo's total
  // is dominated by contacts from other sources.
  // Addresses are masked — presence is the signal, the address is not needed.
  const recent = (subs ?? []).slice().reverse()
  const crossCheck: Array<Record<string, unknown>> = []
  for (const r of recent) {
    const email = (r as any).email as string | undefined
    if (!email) continue
    const look = await fetch(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, { headers: h })
    const [user, domain] = email.split('@')
    crossCheck.push({
      email_masked: `${user.slice(0, 2)}***@${domain ?? '?'}`,
      subscribed_at: String((r as any).subscribed_at ?? '').slice(0, 10),
      in_brevo: look.status === 200,
    })
  }

  const inBrevo = crossCheck.filter((c) => c.in_brevo).length
  const missing = crossCheck.filter((c) => !c.in_brevo)

  return new Response(JSON.stringify({
    key_fingerprint: fingerprint,
    overlap: {
      supabase_total: crossCheck.length,
      present_in_brevo: inBrevo,
      missing_from_brevo: missing.length,
      earliest_missing: missing.length ? missing[missing.length - 1].subscribed_at : null,
      latest_missing: missing.length ? missing[0].subscribed_at : null,
    },
    cross_check: crossCheck,
    supabase_subscribers_total: subs?.length ?? 0,
    supabase_subscribers_by_month: byMonth,
    supabase_latest: subs?.length ? subs[subs.length - 1].subscribed_at : null,
    brevo_contacts_total: contactsBody?.count ?? null,
    account_status: account.status,
    plan: accountBody?.plan ?? null,
    company: accountBody?.companyName ?? null,
    inbound_status: inbound.status,
    inbound_available: inbound.status === 200,
    inbound_message: inboundBody.slice(0, 300),
  }, null, 2), { headers: { ...cors, 'Content-Type': 'application/json' } })
})
