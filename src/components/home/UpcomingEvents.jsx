import { motion } from 'framer-motion'
import { MapPin, Clock } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import SectionHeading from '../ui/SectionHeading'
import { useEvents } from '../../hooks/useEvents'

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function UpcomingEvents() {
  const { events, loading } = useEvents()

  if (loading) {
    return (
      <section id="events" className="py-16 md:py-24 px-4 max-w-6xl mx-auto">
        <SectionHeading
          title="Upcoming Events"
          subtitle="Don't miss out on our latest community events"
        />
        <div className="flex justify-center mt-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      </section>
    )
  }

  if (!events.length) return null

  return (
    <section id="events" className="py-16 md:py-24 px-4 max-w-6xl mx-auto">
      <SectionHeading
        title="Upcoming Events"
        subtitle="Don't miss out on our latest community events"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        {events.map((event, i) => (
          <motion.div
            key={event.id}
            className="flex"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
          >
            <Card className="flex flex-col w-full">
              <div className="bg-gray-50 h-80 flex items-center justify-center">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex gap-2 mb-3">
                  <Badge variant={event.status === 'upcoming' ? 'upcoming' : event.status}>
                    {event.status === 'upcoming' ? 'Upcoming' : event.status === 'sold-out' ? 'Sold Out' : 'Past'}
                  </Badge>
                  {event.price === 'Free' && (
                    <Badge variant="free">Free</Badge>
                  )}
                </div>

                <h3 className="font-heading font-bold text-xl text-dark mb-2">
                  {event.title}
                </h3>

                <div className="space-y-1 text-sm text-gray-600 mb-3">
                  <p className="flex items-center gap-2">
                    <Clock size={16} className="text-primary" />
                    {formatDate(event.date)} {event.time && <>&middot; {event.time}</>}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin size={16} className="text-primary" />
                    {event.location}
                  </p>
                </div>

                <p className="text-gray-600 text-sm mb-4 flex-grow">
                  {event.description}
                </p>

                {event.ticket_url && event.status === 'upcoming' ? (
                  <Button variant="primary" href={event.ticket_url}>
                    Book Tickets
                  </Button>
                ) : (
                  <Button variant="secondary" href={`/events/${event.slug}`}>
                    View Details
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
