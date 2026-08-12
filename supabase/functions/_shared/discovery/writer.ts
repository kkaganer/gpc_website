// Persistence for adapter output: upsert activities, regenerate their occurrences.
//
// Two failure modes this file exists to prevent:
//
// 1. ON CONFLICT cardinality violation. If one batch contains the same
//    (source_id, source_uid) twice — trivially easy when a venue page lists the
//    same weekly session under two categories — Postgres raises
//    "ON CONFLICT DO UPDATE command cannot affect row a second time" and aborts
//    the ENTIRE batch, not just the duplicate. Pre-deduping is not optional.
//
// 2. Stale occurrences. Regenerating without clearing the old window leaves
//    sessions on the site after the source has dropped or moved them.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { ActivityDraft, IngestCounters } from './types.ts'
import { generateOccurrences, type HolidayRange } from './occurrences.ts'

/** How far ahead occurrences are materialised. */
export const OCCURRENCE_HORIZON_DAYS = 56

export function emptyCounters(): IngestCounters {
  return {
    fetched: 0,
    in_area: 0,
    under5: 0,
    inserted: 0,
    updated: 0,
    skipped_duplicate: 0,
    occurrences_written: 0,
  }
}

/**
 * Collapse a batch to one row per (source_uid), keeping the LAST occurrence —
 * later records in a feed are the more recently modified ones. This is the JS
 * equivalent of `DISTINCT ON (source_uid) ... ORDER BY modified DESC`.
 */
function dedupeBySourceUid(drafts: ActivityDraft[]): { rows: ActivityDraft[]; dropped: number } {
  const byUid = new Map<string, ActivityDraft>()
  for (const d of drafts) {
    if (!d.source_uid) continue
    byUid.set(d.source_uid, d)
  }
  return { rows: [...byUid.values()], dropped: drafts.length - byUid.size }
}

async function loadHolidays(
  supabase: SupabaseClient,
): Promise<Map<string, HolidayRange[]>> {
  const byBorough = new Map<string, HolidayRange[]>()
  const { data } = await supabase
    .from('term_dates')
    .select('borough, starts_on, ends_on')
    .eq('kind', 'holiday')
  for (const row of data ?? []) {
    const list = byBorough.get(row.borough) ?? []
    list.push({ starts_on: row.starts_on, ends_on: row.ends_on })
    byBorough.set(row.borough, list)
  }
  return byBorough
}

export interface WriteResult {
  counters: IngestCounters
  errors: string[]
}

export async function writeActivities(
  supabase: SupabaseClient,
  sourceId: string,
  drafts: ActivityDraft[],
  counters: IngestCounters = emptyCounters(),
): Promise<WriteResult> {
  const errors: string[] = []
  const { rows, dropped } = dedupeBySourceUid(drafts)
  counters.skipped_duplicate += dropped

  if (!rows.length) return { counters, errors }

  const holidaysByBorough = await loadHolidays(supabase)

  const today = new Date().toISOString().slice(0, 10)
  const horizon = new Date()
  horizon.setUTCDate(horizon.getUTCDate() + OCCURRENCE_HORIZON_DAYS)
  const horizonIso = horizon.toISOString().slice(0, 10)

  // Chunked so one oversized feed page can't blow the request body limit.
  const CHUNK = 200
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)

    const payload = chunk.map((d) => ({
      source_id: sourceId,
      source_uid: d.source_uid,
      source_url: d.source_url ?? null,
      deep_link: d.deep_link ?? null,
      title: d.title,
      description: d.description ?? null,
      organiser: d.organiser ?? null,
      category: d.category ?? null,
      venue_name: d.venue_name ?? null,
      address: d.address ?? null,
      postcode: d.postcode ?? null,
      lat: d.lat ?? null,
      lng: d.lng ?? null,
      borough: d.borough ?? null,
      schedule: d.schedule ?? [],
      timezone: d.timezone ?? 'Europe/London',
      starts_on: d.starts_on ?? null,
      ends_on: d.ends_on ?? null,
      term_time_only: d.term_time_only ?? null,
      age_min_months: d.age_min_months ?? null,
      age_max_months: d.age_max_months ?? null,
      is_free: d.is_free ?? null,
      price_type: d.price_type ?? null,
      price_amount: d.price_amount ?? null,
      price_text: d.price_text ?? null,
      booking_mode: d.booking_mode ?? null,
      booking_url: d.booking_url ?? null,
      access: d.access ?? {},
      confidence: d.confidence ?? null,
      last_verified_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase
      .from('activities')
      .upsert(payload, { onConflict: 'source_id,source_uid' })
      .select('id, source_uid, borough, created_at, updated_at')

    if (error) {
      errors.push(`upsert activities: ${error.message}`)
      continue
    }

    for (const row of data ?? []) {
      // created_at === updated_at on the row we just wrote means it was new.
      if (row.created_at === row.updated_at) counters.inserted++
      else counters.updated++
    }

    // --- occurrences -------------------------------------------------------
    const idByUid = new Map((data ?? []).map((r) => [r.source_uid, r.id]))
    const boroughById = new Map((data ?? []).map((r) => [r.id, r.borough]))

    const occurrenceRows: Array<Record<string, unknown>> = []
    const regeneratedActivityIds: string[] = []

    for (const d of chunk) {
      const activityId = idByUid.get(d.source_uid)
      if (!activityId) continue

      // Directly-ingested dated instances (one-offs, or feeds publishing them).
      if (d.occurrences?.length) {
        for (const o of d.occurrences) {
          occurrenceRows.push({
            activity_id: activityId,
            starts_at: o.starts_at,
            ends_at: o.ends_at ?? null,
            status: o.status ?? 'scheduled',
            source_uid: o.source_uid ?? null,
            generated: false,
          })
        }
      }

      // Generated from the schedule rule.
      if (d.schedule?.length) {
        const borough = boroughById.get(activityId) ?? d.borough ?? ''
        const generated = generateOccurrences({
          schedule: d.schedule,
          from: today,
          to: horizonIso,
          starts_on: d.starts_on,
          ends_on: d.ends_on,
          termTimeOnly: d.term_time_only ?? null,
          holidays: holidaysByBorough.get(borough) ?? [],
        })
        if (generated.length) regeneratedActivityIds.push(activityId)
        for (const o of generated) {
          occurrenceRows.push({
            activity_id: activityId,
            starts_at: o.starts_at,
            ends_at: o.ends_at,
            status: 'scheduled',
            generated: true,
          })
        }
      }
    }

    // Clear the forward window for regenerated activities so a dropped or moved
    // session disappears instead of lingering.
    if (regeneratedActivityIds.length) {
      const { error: delError } = await supabase
        .from('occurrences')
        .delete()
        .in('activity_id', regeneratedActivityIds)
        .eq('generated', true)
        .gte('starts_at', `${today}T00:00:00Z`)
      if (delError) errors.push(`clear occurrences: ${delError.message}`)
    }

    if (occurrenceRows.length) {
      // Same cardinality trap as above, on (activity_id, starts_at).
      const seen = new Set<string>()
      const unique = occurrenceRows.filter((r) => {
        const key = `${r.activity_id}|${r.starts_at}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      for (let j = 0; j < unique.length; j += 500) {
        const slice = unique.slice(j, j + 500)
        const { error: occError } = await supabase
          .from('occurrences')
          .upsert(slice, { onConflict: 'activity_id,starts_at' })
        if (occError) errors.push(`upsert occurrences: ${occError.message}`)
        else counters.occurrences_written += slice.length
      }
    }
  }

  return { counters, errors }
}
