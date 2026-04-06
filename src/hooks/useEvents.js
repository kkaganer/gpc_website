import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const statusOrder = { upcoming: 0, 'sold-out': 1, past: 2 }

function computeStatus(event) {
  if (event.status === 'sold-out') return 'sold-out'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const eventDate = new Date(event.date + 'T00:00:00')
  return eventDate >= today ? 'upcoming' : 'past'
}

export function useEvents({ featured, status, limit, ascending = false } = {}) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchEvents() {
      let query = supabase
        .from('gpc_events')
        .select('*')
        .order('date', { ascending })

      if (featured) query = query.eq('featured', true)

      const { data, error: fetchError } = await query

      if (fetchError) {
        setError(fetchError.message)
        setEvents([])
      } else {
        const withStatus = (data || []).map(e => ({ ...e, status: computeStatus(e) }))
        const filtered = status ? withStatus.filter(e => e.status === status) : withStatus
        const sorted = filtered.sort(
          (a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
        )
        setEvents(limit ? sorted.slice(0, limit) : sorted)
      }
      setLoading(false)
    }

    fetchEvents()
  }, [featured, status, limit, ascending])

  return { events, loading, error }
}

export function useEvent(slug) {
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) return

    async function fetchEvent() {
      const { data, error: fetchError } = await supabase
        .from('gpc_events')
        .select('*')
        .eq('slug', slug)
        .single()

      if (fetchError) {
        setError(fetchError.message)
        setEvent(null)
      } else {
        setEvent(data ? { ...data, status: computeStatus(data) } : null)
      }
      setLoading(false)
    }

    fetchEvent()
  }, [slug])

  return { event, loading, error }
}
