import { useEffect } from 'react'
import SectionHeading from '../components/ui/SectionHeading'
import EventCard from '../components/events/EventCard'
import { events as easterEvents } from '../data/events'

const additionalEvents = [
  {
    id: 'christmas-fair-2025',
    title: 'Christmas Fair 2025',
    date: '2025-12-07',
    location: 'Greenwich West Community and Arts Centre',
    description:
      "Our biggest event of the year! Stalls, Santa's grotto, festive food, and family fun.",
    image: '/images/christmasfair.jpg',
    status: 'past',
  },
  {
    id: 'summer-fair-2025',
    title: 'Summer Fair 2025',
    date: '2025-07-12',
    location: 'Greenwich Park',
    description:
      'A wonderful day of stalls, activities, and community spirit in Greenwich Park.',
    image: '/images/summerfair.jpg',
    status: 'past',
  },
]

const statusOrder = { upcoming: 0, 'sold-out': 1, past: 2 }

const allEvents = [...easterEvents, ...additionalEvents].sort(
  (a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
)

export default function Events() {
  useEffect(() => {
    document.title = 'Events | Greenwich Parents & Carers';
  }, []);

  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <SectionHeading
          title="Events"
          subtitle="Community events bringing families together"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {allEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  )
}
