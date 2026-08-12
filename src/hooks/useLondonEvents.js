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
      .gte('date', today)
      // Chronological means date AND time. Ordering by date alone left events
      // on the same day in arbitrary order, so a 9am rhyme time could appear
      // below an 8pm show. `time` is 'HH:MM' / 'HH:MM - HH:MM', which sorts
      // correctly as text because the hour is zero-padded.
      .order('date', { ascending: true })
      .order('time', { ascending: true, nullsFirst: false })

    if (category && category !== 'All') query = query.eq('category', category)
    if (dateFrom && dateFrom > today) query = query.gte('date', dateFrom)
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
