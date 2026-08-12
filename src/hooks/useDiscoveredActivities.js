import { useState, useEffect, useCallback } from 'react'
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

  const fetchActivities = useCallback(async () => {
    setLoading(true)
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
    } else {
      setActivities(data || [])
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

/** Kick off an ingest run. Optionally limit to specific source ids. */
export async function runIngest(sources = null) {
  const { data, error } = await supabase.functions.invoke('ingest-activities', {
    body: sources ? { sources } : {},
  })
  if (error) throw error
  return data
}
