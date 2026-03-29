import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useLondonEvents({ area, dateFrom, dateTo, category } = {}) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('london_events')
      .select('*')
      .eq('approved', true)
      .order('date', { ascending: true })

    if (area && area !== 'All') query = query.eq('area', area)
    if (category && category !== 'All') query = query.eq('category', category)
    if (dateFrom) query = query.gte('date', dateFrom)
    if (dateTo) query = query.lte('date', dateTo)

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
      setEvents([])
    } else {
      setEvents(data || [])
    }
    setLoading(false)
  }, [area, dateFrom, dateTo, category])

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
