import { useEffect } from 'react'
import SectionHeading from '../components/ui/SectionHeading'
import EventCard from '../components/events/EventCard'
import { useEvents } from '../hooks/useEvents'

export default function Events() {
  const { events, loading, error } = useEvents()

  useEffect(() => {
    document.title = 'Events | Greenwich Parents & Carers'
  }, [])

  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <SectionHeading
          title="Events"
          subtitle="Community events bringing families together"
        />

        {loading && (
          <div className="flex justify-center mt-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          </div>
        )}

        {error && (
          <p className="text-center text-red-500 mt-12">
            Unable to load events. Please try again later.
          </p>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
