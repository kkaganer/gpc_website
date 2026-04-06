import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, ExternalLink } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import EventCard from '../components/events/EventCard';
import NewsletterForm from '../components/ui/NewsletterForm';
import { useEvents } from '../hooks/useEvents';
import { weeklyEvents } from '../data/weeklyEvents';

export default function Events() {
  const { events, loading, error } = useEvents();

  useEffect(() => {
    document.title = 'Events | Greenwich Parents & Carers';
  }, []);

  const upcoming = events.filter(e => e.status === 'upcoming');
  const past = events.filter(e => e.status === 'past');

  return (
    <>
      {/* Page header with jump links */}
      <section className="bg-warm py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-dark">
            Our Events
          </h1>
          <p className="text-gray-600 mt-2">
            Bringing families together since 2021
          </p>
          <div className="flex justify-center gap-6 mt-6">
            <a href="#upcoming" className="text-base md:text-lg font-bold text-primary hover:underline">
              Upcoming events
            </a>
            <span className="text-gray-300 text-lg">|</span>
            <a href="#weekly" className="text-base md:text-lg font-bold text-primary hover:underline">
              Weekly meet-ups
            </a>
          </div>
        </div>
      </section>

      {error && (
        <p className="text-center text-red-500 py-8 px-4">
          Unable to load events. Please try again later.
        </p>
      )}

      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Upcoming events */}
          <div id="upcoming">
            <h2 className="font-heading text-2xl font-bold text-dark mb-8">
              Upcoming events
            </h2>

            {loading && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
              </div>
            )}

            {!loading && upcoming.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {upcoming.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                  >
                    <EventCard event={event} />
                  </motion.div>
                ))}
              </div>
            )}

            {!loading && upcoming.length === 0 && !error && (
              <p className="text-gray-500 text-sm">No upcoming events right now. Check back soon!</p>
            )}
          </div>

          {/* Weekly meet-ups */}
          <div id="weekly" className="mt-16">
            <h2 className="font-heading text-2xl font-bold text-dark mb-8">
              Weekly meet-ups
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {weeklyEvents.map((event, i) => (
                <motion.div
                  key={event.title}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <Card className="h-full border-2 border-amber-200 bg-amber-50/50">
                    <div className="p-6">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="free">Free</Badge>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          GPC
                        </span>
                      </div>
                      <h3 className="font-heading font-bold text-xl text-dark">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-600 mt-2 text-sm">
                        <Clock size={14} className="text-primary shrink-0" />
                        {event.time}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 mt-1 text-sm">
                        <MapPin size={14} className="text-primary shrink-0" />
                        {event.location}
                      </div>
                      <p className="text-gray-600 text-sm mt-3">{event.description}</p>
                      <div className="mt-4">
                        {event.contact ? (
                          <span className="text-sm font-bold text-primary">
                            {event.contact}
                          </span>
                        ) : event.link && (
                          <a
                            href={event.link}
                            target={event.link.startsWith('http') ? '_blank' : undefined}
                            rel={event.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                            className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
                          >
                            {event.linkLabel}
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Past events */}
          {past.length > 0 && (
            <div className="mt-16">
              <h2 className="font-heading text-2xl font-bold text-dark mb-8">
                Past events
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {past.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <EventCard event={event} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-warm py-12 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-heading text-2xl font-bold text-dark">
            Want to know about events first?
          </h2>
          <p className="text-gray-600 mt-2 mb-6">
            Subscribe to our weekly newsletter
          </p>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
