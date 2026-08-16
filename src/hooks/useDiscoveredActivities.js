import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Review queue for the discovery platform.
 *
 * Reads `activity_review_queue` (activities + next occurrence + source), NOT
 * `london_events`. Approving calls publish_activity(), which projects the
 * activity into london_events as approved rows — so the public What's On page,
 * the map and the newsletter keep reading london_events exactly as they do now.
 */
export function useDiscoveredActivities(status = 'pending') {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Read inside fetchActivities to decide whether this is a first load, without
  // putting `activities` in its dependency list — that would rebuild the
  // callback on every fetch and re-fire the effect below in a loop.
  const activitiesRef = useRef([])

  // `loading` drives a FULL-PAGE SPINNER that replaces the table. Setting it on
  // every call meant approving a single row blanked the entire queue and rebuilt
  // it — scroll position gone, open groups shut, back to the top of the list,
  // after every action. Reviewing fifty items became fifty trips back to the top.
  //
  // So it is set only when there is nothing on screen yet, i.e. the first load.
  // A refetch after an action swaps the rows underneath a table that never
  // unmounts, which is what keeps your place.
  const fetchActivities = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading((prev) => prev || activitiesRef.current.length === 0)
    let query = supabase
      .from('activity_review_queue')
      .select('*')
      .order('confidence', { ascending: false, nullsFirst: false })
      .order('next_occurrence', { ascending: true, nullsFirst: false })
      .limit(500)

    if (status) query = query.eq('status', status)

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
      setActivities([])
      activitiesRef.current = []
    } else {
      setError(null)
      setActivities(data || [])
      activitiesRef.current = data || []
    }
    setLoading(false)
  }, [status])

  useEffect(() => { fetchActivities() }, [fetchActivities])

  return { activities, loading, error, refetch: fetchActivities }
}

/** Approve -> project into london_events. Returns rows written. */
export async function publishActivity(id) {
  const { data, error } = await supabase.rpc('publish_activity', { p_activity_id: id })
  if (error) throw error
  return data
}

/** Reject -> remove any published rows and mark rejected. */
export async function rejectActivity(id, reason = null) {
  const { error } = await supabase.rpc('reject_activity', {
    p_activity_id: id,
    p_reason: reason,
  })
  if (error) throw error
}

/** Pull a published activity back off the site without rejecting it. */
export async function unpublishActivity(id) {
  const { data, error } = await supabase.rpc('unpublish_activity', { p_activity_id: id })
  if (error) throw error
  return data
}

/**
 * Fill in missing lat/lng from other activities sharing the same postcode.
 * The Discovery-page equivalent of What's On's "Fix Map Pins": an activity with
 * no coordinates never appears on the map, and publish_activity() copies
 * lat/lng straight through, so the gap propagates to london_events.
 */
export async function backfillCoordinates() {
  const { data, error } = await supabase.rpc('backfill_activity_coordinates')
  if (error) throw error
  return Array.isArray(data) ? data[0] : data
}

/**
 * Start an ingest run. Returns immediately with a batch id — the work continues
 * server-side. Supabase enforces a 150s request idle timeout on EVERY plan, so
 * holding the request open for a ~156s run returned a 504 and lost the whole
 * run. Nothing waits on the response now.
 */
export async function runIngest(sources = null) {
  const { data, error } = await supabase.functions.invoke('ingest-activities', {
    body: sources ? { sources } : {},
  })
  if (error) throw error
  return data // { batch_id, sources_queued }
}

/** One progress snapshot for a batch. */
export async function getBatchStatus(batchId) {
  const { data, error } = await supabase
    .from('ingest_batch_status')
    .select('*')
    .eq('id', batchId)
    .maybeSingle()
  if (error) throw error
  return data
}

/**
 * Poll a batch to completion, calling onProgress after each check.
 * Gives up after `timeoutMs` and reports that plainly rather than hanging —
 * the run may still be going server-side, which the message says.
 */
export async function pollBatch(batchId, onProgress, { intervalMs = 3000, timeoutMs = 420000 } = {}) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const status = await getBatchStatus(batchId)
    if (status) {
      onProgress?.(status)
      if (status.status === 'complete' || status.status === 'failed') return status
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  return { status: 'timeout', id: batchId }
}
