import { useState, useEffect, useRef } from 'react'
import { Plus, List, Map as MapIcon } from 'lucide-react'
import EventFilters from '../components/whatson/EventFilters'
import LondonEventCard from '../components/whatson/LondonEventCard'
import EventMap from '../components/whatson/EventMap'
import SubmitEventModal from '../components/whatson/SubmitEventModal'
import { useLondonEvents } from '../hooks/useLondonEvents'

const defaultFilters = {
  area: 'All',
  datePreset: 'all',
  dateFrom: null,
  dateTo: null,
  category: 'All',
  price: 'All',
  ageRange: '',
}

export default function WhatsOn() {
  const [filters, setFilters] = useState(defaultFilters)
  const [activeEventId, setActiveEventId] = useState(null)
  const [flyTo, setFlyTo] = useState(null)
  const [showSubmit, setShowSubmit] = useState(false)
  const [mobileView, setMobileView] = useState('list')
  const listRef = useRef(null)

  const { events: rawEvents, loading, error } = useLondonEvents({
    area: filters.area,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    category: filters.category,
  })

  // Client-side filtering for price and age (not in Supabase query)
  const events = rawEvents.filter((e) => {
    if (filters.price === 'Free' && !e.is_free) return false
    if (filters.price === 'Paid' && e.is_free) return false
    return true
  })

  useEffect(() => {
    document.title = "What's On | Greenwich Parents & Carers"
  }, [])

  function handleCardClick(id) {
    setActiveEventId(id)
    const event = events.find((e) => e.id === id)
    if (event?.lat && event?.lng) {
      setFlyTo({ lat: event.lat, lng: event.lng })
    }
  }

  function handleMarkerClick(id) {
    setActiveEventId(id)
    // Scroll the list to the active card
    const el = document.getElementById(`event-card-${id}`)
    if (el && listRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="font-heading text-xl font-bold text-dark">
                Greenwich Parents & Carers
              </h1>
              <p className="text-gray-500 text-xs">What's On Guide · Local events for families</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile view toggle */}
              <div className="flex md:hidden gap-1 bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setMobileView('list')}
                  className={`p-1.5 rounded-md transition-colors ${mobileView === 'list' ? 'bg-white shadow-sm' : ''}`}
                >
                  <List size={18} />
                </button>
                <button
                  onClick={() => setMobileView('map')}
                  className={`p-1.5 rounded-md transition-colors ${mobileView === 'map' ? 'bg-white shadow-sm' : ''}`}
                >
                  <MapIcon size={18} />
                </button>
              </div>

              <button
                onClick={() => setShowSubmit(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                <Plus size={16} />
                Submit Event
              </button>
            </div>
          </div>

          <EventFilters filters={filters} onChange={setFilters} />
        </div>
      </div>

      {/* Split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Event list — left panel */}
        <div
          ref={listRef}
          className={`w-full md:w-[45%] lg:w-[40%] overflow-y-auto border-r border-gray-100 bg-white ${
            mobileView === 'map' ? 'hidden md:block' : ''
          }`}
        >
          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
            </div>
          )}

          {error && (
            <p className="text-center text-red-500 py-12 px-4 text-sm">Unable to load events.</p>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="text-center py-16 px-4">
              <p className="text-gray-500">No events found matching your filters.</p>
              <button
                onClick={() => setFilters(defaultFilters)}
                className="mt-3 text-primary font-semibold text-sm hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}

          {!loading && !error && events.map((event) => (
            <div key={event.id} id={`event-card-${event.id}`}>
              <LondonEventCard
                event={event}
                isActive={event.id === activeEventId}
                onClick={handleCardClick}
              />
            </div>
          ))}

          {!loading && !error && events.length > 0 && (
            <div className="px-4 py-6 text-center text-gray-400 text-xs">
              {events.length} event{events.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>

        {/* Map — right panel */}
        <div
          className={`flex-1 ${
            mobileView === 'list' ? 'hidden md:block' : ''
          }`}
        >
          <EventMap
            events={events}
            activeEventId={activeEventId}
            onMarkerClick={handleMarkerClick}
            flyTo={flyTo}
          />
        </div>
      </div>

      {/* Submit modal */}
      {showSubmit && <SubmitEventModal onClose={() => setShowSubmit(false)} />}
    </div>
  )
}
