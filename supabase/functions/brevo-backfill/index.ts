// One-off: backfill website signups that never reached Brevo.
//
// 27 of 29 rows in `newsletter_subscribers` were absent from Brevo, spanning
// 2026-03-31 to 2026-08-11 — every month since the form went live. The Brevo
// write was failing while api/subscribe.js still returned success:true, so the
// failure was invisible to both the subscriber and the admin.
//
// Idempotent: `updateEnabled: true` means re-adding an existing contact is a
// no-op rather than an error, so this is safe to run more than once.
//
// dry_run: true (the default) reports what WOULD happen and lists the available
// Brevo lists, without writing anything.

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
  const h = { 'api-key': key, 'accept': 'application/json', 'content-type': 'application/json' }

  let body: Record<string, any> = {}
  try { body = await req.json() } catch { /* defaults */ }
  const dryRun = body.dry_run !== false          // default TRUE — never write by accident
  const listIds: number[] | null = Array.isArray(body.list_ids) ? body.list_ids : null

  // A contact in no list receives no campaign, so surface the options.
  const listsRes = await fetch('https://api.brevo.com/v3/contacts/lists?limit=50', { headers: h })
  const listsBody = await listsRes.json().catch(() => null)
  const lists = (listsBody?.lists ?? []).map((l: any) => ({
    id: l.id, name: l.name, subscribers: l.totalSubscribers,
  }))

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const { data: subs } = await supabase
    .from('newsletter_subscribers')
    .select('email, subscribed_at')
    .order('subscribed_at', { ascending: true })

  const results = { checked: 0, already_present: 0, added: 0, failed: 0 }
  const failures: Array<Record<string, unknown>> = []
  const wouldAdd: string[] = []

  for (const row of subs ?? []) {
    const email = (row as any).email as string
    if (!email) continue
    results.checked++

    const look = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, { headers: h })
    if (look.status === 200) { results.already_present++; continue }

    const [user, domain] = email.split('@')
    const masked = `${user.slice(0, 2)}***@${domain ?? '?'}`

    if (dryRun) { wouldAdd.push(masked); continue }

    const create = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        email,
        updateEnabled: true,
        ...(listIds ? { listIds } : {}),
      }),
    })
    if (create.ok || create.status === 204) {
      results.added++
    } else {
      const err = await create.json().catch(() => ({}))
      // Already-existing is success, not failure.
      if (err?.code === 'duplicate_parameter') results.already_present++
      else { results.failed++; failures.push({ email: masked, status: create.status, code: err?.code }) }
    }
  }

  return new Response(JSON.stringify({
    dry_run: dryRun,
    brevo_lists: lists,
    list_ids_used: listIds,
    ...results,
    would_add: dryRun ? wouldAdd : undefined,
    failures: failures.length ? failures : undefined,
  }, null, 2), { headers: { ...cors, 'Content-Type': 'application/json' } })
})
