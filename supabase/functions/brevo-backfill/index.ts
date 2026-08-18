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
  // `.is('unsubscribed_at', null)` IS NOT OPTIONAL. This function predates the
  // consent column: without the filter it walked every row and pushed each one
  // to Brevo, which after the import means re-adding the 51 people who had
  // unsubscribed — putting them back on a list they left. Same defect, and the
  // same fix, as the retry-all branch in api/admin/subscribers.js.
  const { data: subs } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, subscribed_at, brevo_status, brevo_attempts')
    .is('unsubscribed_at', null)
    .order('subscribed_at', { ascending: true })

  const results = { checked: 0, already_present: 0, added: 0, failed: 0, status_written: 0 }

  // Mirrors api/subscribe.js exactly: synced stamps the time and clears any
  // error, anything else keeps the error visible, and every attempt bumps the
  // counter. Failures here are logged and swallowed — what Brevo did is already
  // true whether or not we managed to record it.
  async function record(row: any, status: string, error: string | null) {
    if (dryRun) return
    const now = new Date().toISOString()
    const { error: upErr } = await supabase
      .from('newsletter_subscribers')
      .update({
        brevo_status: status,
        brevo_error: status === 'synced' ? null : error,
        brevo_attempts: (Number(row.brevo_attempts) || 0) + 1,
        brevo_last_attempt_at: now,
        ...(status === 'synced' ? { brevo_synced_at: now } : {}),
      })
      .eq('id', row.id)
    if (upErr) console.error('[brevo-backfill] could not record status for', row.id, upErr.message)
    else results.status_written++
  }
  const failures: Array<Record<string, unknown>> = []
  const wouldAdd: string[] = []

  for (const row of subs ?? []) {
    const email = (row as any).email as string
    if (!email) continue
    results.checked++

    const look = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, { headers: h })
    if (look.status === 200) {
      results.already_present++
      // Present in Brevo is exactly what 'synced' means. This is the branch that
      // settles the rows migration 019 deliberately left at 'pending' rather
      // than guess about — now it is checked, not assumed.
      await record(row, 'synced', null)
      continue
    }

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
      await record(row, 'synced', null)
    } else {
      const err = await create.json().catch(() => ({}))
      // Already-existing is success, not failure.
      if (err?.code === 'duplicate_parameter') {
        results.already_present++
        await record(row, 'synced', null)
      } else {
        results.failed++
        failures.push({ email: masked, status: create.status, code: err?.code })
        await record(row, 'failed', `Brevo ${create.status}: ${err?.code ?? 'unknown'}`)
      }
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
