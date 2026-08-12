// Discovery ingest orchestrator.
//
// Runs the enabled adapters, writes activities + occurrences, and records a row
// in `ingest_runs` per source. Designed to be driven by pg_cron on a schedule and
// invokable manually from the admin UI.
//
// Deliberately NOT fire-and-forget: a source that quietly stops returning data is
// the most likely long-run failure of this platform, so every run records its
// yield and `consecutive_failures` is tracked per source. Zero-yield is a
// monitored condition, not a silent success.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Adapter, AdapterContext } from '../_shared/discovery/types.ts'
import { openactiveAdapter } from '../_shared/discovery/adapters/openactive.ts'
import { spektrixAdapter } from '../_shared/discovery/adapters/spektrix.ts'
import { betterLibrariesAdapter } from '../_shared/discovery/adapters/better-libraries.ts'
import { lewishamLibrariesAdapter } from '../_shared/discovery/adapters/lewisham-libraries.ts'
import { thFamilyHubsAdapter } from '../_shared/discovery/adapters/th-family-hubs.ts'
import { writeActivities, emptyCounters } from '../_shared/discovery/writer.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ADAPTERS: Record<string, Adapter> = {
  'openactive': openactiveAdapter,
  'spektrix': spektrixAdapter,
  'better-libraries': betterLibrariesAdapter,
  'rss': lewishamLibrariesAdapter,
  'th-family-hubs': thFamilyHubsAdapter,
}

// Supabase edge functions cap at 150s wall clock (free) / 400s (paid). Leave
// headroom so the run can always finish writing and record its ingest_runs row
// rather than being killed mid-flight with no trace.
const WALL_CLOCK_BUDGET_MS = 110_000
const PER_SOURCE_BUDGET_MS = 45_000

interface SourceRow {
  id: string
  name: string
  adapter: string
  config: Record<string, unknown>
  cursor: string | null
  consecutive_failures: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const started = Date.now()
  const deadline = started + WALL_CLOCK_BUDGET_MS

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Optional { sources: ["openactive-better"] } to run a subset.
  let requested: string[] | null = null
  try {
    const body = await req.json()
    if (Array.isArray(body?.sources) && body.sources.length) requested = body.sources
  } catch {
    // No body is the normal cron case.
  }

  let query = supabase
    .from('discovery_sources')
    .select('id, name, adapter, config, cursor, consecutive_failures')
    .eq('enabled', true)
  if (requested) query = query.in('id', requested)

  const { data: sources, error: sourcesError } = await query
  if (sourcesError) {
    return new Response(
      JSON.stringify({ success: false, error: `load sources: ${sourcesError.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const results: Array<Record<string, unknown>> = []

  for (const source of (sources ?? []) as SourceRow[]) {
    if (Date.now() > deadline) {
      results.push({ source: source.id, skipped: 'wall-clock budget exhausted' })
      continue
    }

    const adapter = ADAPTERS[source.adapter]
    if (!adapter) {
      results.push({ source: source.id, skipped: `no adapter "${source.adapter}"` })
      continue
    }

    const { data: runRow } = await supabase
      .from('ingest_runs')
      .insert({ source_id: source.id })
      .select('id')
      .single()
    const runId = runRow?.id

    const ctx: AdapterContext = {
      cursor: source.cursor,
      config: source.config ?? {},
      deadline: Math.min(deadline, Date.now() + PER_SOURCE_BUDGET_MS),
    }

    try {
      const result = await adapter(ctx)

      const counters = emptyCounters()
      counters.fetched = Number(result.stats?.seen ?? 0)
      counters.in_area = result.activities.length
      counters.under5 = result.activities.length

      const { counters: finalCounters, errors } = await writeActivities(
        supabase, source.id, result.activities, counters,
      )

      const ok = errors.length === 0

      await supabase.from('discovery_sources').update({
        cursor: result.cursor ?? source.cursor,
        last_run_at: new Date().toISOString(),
        ...(ok ? { last_ok_at: new Date().toISOString(), consecutive_failures: 0 } : {}),
        ...(ok ? {} : { consecutive_failures: source.consecutive_failures + 1 }),
      }).eq('id', source.id)

      if (runId) {
        await supabase.from('ingest_runs').update({
          finished_at: new Date().toISOString(),
          ok,
          ...finalCounters,
          error: errors.length ? errors.join('; ') : null,
          detail: result.stats ?? null,
        }).eq('id', runId)
      }

      results.push({ source: source.id, ok, ...finalCounters, stats: result.stats, errors })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)

      await supabase.from('discovery_sources').update({
        last_run_at: new Date().toISOString(),
        consecutive_failures: source.consecutive_failures + 1,
      }).eq('id', source.id)

      if (runId) {
        await supabase.from('ingest_runs')
          .update({ finished_at: new Date().toISOString(), ok: false, error: message })
          .eq('id', runId)
      }

      results.push({ source: source.id, ok: false, error: message })
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      elapsed_ms: Date.now() - started,
      sources_run: results.length,
      results,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
