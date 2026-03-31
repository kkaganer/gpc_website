import { useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { AlertTriangle } from 'lucide-react'
import { useEvent } from '../hooks/useEvents'
import { generateGoogleCalendarUrl } from '../utils/googleCalendar'
import EventHero from '../components/events/EventHero'
import EventDetails from '../components/events/EventDetails'
import SponsorsBar from '../components/events/SponsorsBar'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function EventPage() {
  const { slug } = useParams()
  const { event, loading, error } = useEvent(slug)

  useEffect(() => {
    if (event) {
      document.title = `${event.title} | Greenwich Parents & Carers`
    }
  }, [event])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h1 className="font-heading text-2xl font-bold text-dark mb-4">Event not found</h1>
        <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
        <Button href="/events">View All Events</Button>
      </div>
    )
  }

  const sponsors = event.sponsors || []
  const formattedDate = formatDate(event.date)

  return (
    <div>
      <EventHero
        title={event.title}
        date={formattedDate}
        image={event.image_url}
      />

      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {event.status !== 'upcoming' && (
            <div className="mb-6">
              <Badge variant={event.status}>
                {event.status === 'sold-out' ? 'Sold Out' : 'Past'}
              </Badge>
            </div>
          )}

          <EventDetails
            date={formattedDate}
            time={event.time}
            location={event.location}
            price={event.price}
            description={event.description}
            calendarUrl={event.status === 'upcoming' ? generateGoogleCalendarUrl({
              title: event.title,
              date: event.date,
              time: event.time,
              location: event.location,
              description: event.description,
            }) : undefined}
          />

          {event.notes && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-xl p-4 mt-6">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-amber-800 text-sm">{event.notes}</p>
            </div>
          )}

          {event.ticket_url && event.status === 'upcoming' && (
            <div className="mt-6">
              <Button variant="primary" href={event.ticket_url}>
                Book Tickets
              </Button>
            </div>
          )}

          {sponsors.length > 0 && (
            <>
              <SponsorsBar sponsors={sponsors} showDescriptions title="Our Sponsors" />

              {sponsors.length > 1 && (
                <div className="mt-8">
                  <h3 className="font-heading font-bold text-xl text-dark text-center mb-6">
                    Meet Our Sponsors
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {sponsors.map((sponsor, index) => (
                      <Card key={`${sponsor.name}-${index}`} className="p-6 text-center">
                        <img
                          src={sponsor.logo}
                          alt={`${sponsor.name} logo`}
                          className="h-16 object-contain mx-auto"
                          loading="lazy"
                        />
                        <h4 className="font-heading font-bold text-dark mt-3">
                          {sponsor.name}
                        </h4>
                        <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                          {sponsor.description}
                        </p>
                        <a
                          href={sponsor.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-4 text-primary font-bold text-sm hover:underline focus:ring-2 focus:ring-primary focus:outline-none rounded"
                        >
                          Visit Website
                        </a>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="text-center mt-8 py-8 border-t border-gray-100">
            <p className="text-gray-600 mb-4">
              {event.status === 'upcoming'
                ? 'Check out our other events!'
                : 'Missed this one? Check out our upcoming events!'}
            </p>
            <Button href="/events">View All Events</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
