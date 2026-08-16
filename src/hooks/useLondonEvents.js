import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useLondonEvents({ dateFrom, dateTo, category } = {}) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    let query = supabase
      .from('london_events')
      .select('*')
      .eq('approved', true)
      .eq('is_recurring', false)
      // Show an event for its whole run, not just its opening day. A multi-week
      // show (The Gruffalo, Dinosaur World Live) is stored as `date` = first day
      // and `end_date` = last day; `effective_end_date` is the generated column
      // coalesce(end_date, date), so a one-off is unchanged and a run stays here
      // until it actually finishes.
      .gte('effective_end_date', today)
      // Chronological means date AND time. Ordering by date alone left events
      // on the same day in arbitrary order, so a 9am rhyme time could appear
      // below an 8pm show. `time` is 'HH:MM' / 'HH:MM - HH:MM', which sorts
      // correctly as text because the hour is zero-padded.
      .order('date', { ascending: true })
      .order('time', { ascending: true, nullsFirst: false })

    if (category && category !== 'All') query = query.eq('category', category)
    // The asymmetry below is deliberate, not a typo: together the two lines are
    // an overlap test, "does this event's run intersect [dateFrom, dateTo]?".
    // It has not finished before the window opens (effective_end_date >= dateFrom)
    // AND it starts on or before the window closes (date <= dateTo). Making the
    // first one .gte('date', dateFrom) would hide a run that began earlier and is
    // still going, which is exactly the bug this fixes. Do not "tidy" them to match.
    if (dateFrom && dateFrom > today) query = query.gte('effective_end_date', dateFrom)
    if (dateTo) query = query.lte('date', dateTo)

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
      setEvents([])
    } else {
      setEvents(data || [])
    }
    setLoading(false)
  }, [dateFrom, dateTo, category])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return { events, loading, error, refetch: fetchEvents }
}

// Admin hook. Deliberately NOT given the overlap filter above: it has no date
// filter at all, by design — the admin screen must see past, pending and
// unapproved rows in order to manage them, and it decides what counts as
// current in JS (LondonEventsManager's `isCurrent`). Adding a date filter here
// would delete rows from the admin's Past tab. `select('*')` already returns the
// generated `effective_end_date`, so the JS filter has what it needs.
export function useAllLondonEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchEvents() {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('london_events')
      .select('*')
      .order('date', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setEvents([])
    } else {
      setEvents(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  return { events, loading, error, refetch: fetchEvents }
}
