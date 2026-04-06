import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { useEvents } from '../../hooks/useEvents';
import { activities } from '../../data/activities';

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

const compactActivities = activities.slice(0, 4);

export default function WhatHappensHere() {
  const { events, loading } = useEvents({ status: 'upcoming', limit: 1, ascending: true });
  const event = events[0];

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-dark mb-12">
          What happens here
        </h2>

        <div className="grid md:grid-cols-12 gap-8 items-start">
          {/* Featured event */}
          <div className="md:col-span-7">
            {loading ? (
              <div className="rounded-2xl bg-gray-100 aspect-[4/3] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
              </div>
            ) : event ? (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative rounded-2xl overflow-hidden aspect-[4/3] group"
              >
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="flex gap-2 mb-3">
                    <Badge variant="upcoming">Upcoming</Badge>
                    {event.price === 'Free' && <Badge variant="free">Free</Badge>}
                  </div>
                  <h3 className="font-heading font-bold text-2xl mb-2">{event.title}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-white/90 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {formatDate(event.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {event.location}
                    </span>
                  </div>
                  {event.ticket_url && (
                    <Button href={event.ticket_url}>Book Tickets</Button>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="rounded-2xl bg-warm aspect-[4/3] flex items-center justify-center p-8">
                <p className="text-gray-500 text-center">
                  No upcoming events right now. Check back soon!
                </p>
              </div>
            )}
          </div>

          {/* Compact activity list */}
          <div className="md:col-span-5 space-y-6">
            {compactActivities.map((activity, i) => {
              const Icon = activity.icon;
              return (
                <motion.div
                  key={activity.title}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-dark">{activity.title}</h3>
                    <p className="text-gray-600 text-sm mt-0.5">{activity.description}</p>
                  </div>
                </motion.div>
              );
            })}

            <Link
              to="/events"
              className="inline-flex items-center gap-1 text-primary font-bold text-sm hover:underline mt-4"
            >
              See all events <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
