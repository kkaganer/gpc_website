import { Calendar, MapPin, Clock, Users, Ticket, CalendarPlus, ExternalLink } from 'lucide-react'
import { generateGoogleCalendarUrl } from '../../utils/googleCalendar'

export default function LondonEventCard({ event, isActive, onClick }) {
  const formattedDate = new Date(event.date + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

  const eventUrl = event.url
    ? event.url.startsWith('http') ? event.url : `https://${event.url}`
    : null

  const calendarUrl = generateGoogleCalendarUrl({
    title: event.title,
    date: event.date,
    time: event.time,
    location: [event.venue, event.location].filter(Boolean).join(', '),
    description: event.description,
  })

  return (
    <div
      onClick={() => onClick?.(event.id)}
      className={`border-b border-gray-100 px-4 py-4 cursor-pointer transition-colors hover:bg-primary/5 ${
        isActive ? 'bg-primary/5 border-l-2 border-l-primary' : ''
      }`}
    >
      {/* Image */}
      {event.image_url && (
        <img
          src={event.image_url}
          alt={event.title}
          className="w-full h-40 object-cover rounded-lg mb-2"
        />
      )}

      {/* Badges */}
      <div className="flex items-center gap-2 mb-1.5">
        {event.category && (
          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {event.category}
          </span>
        )}
        {event.is_free && (
          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            Free
          </span>
        )}
      </div>

      {/* Title + Venue */}
      <h3 className="font-heading font-bold text-dark text-[15px] leading-snug">
        {event.title}
        {event.venue && (
          <span className="text-gray-400 font-normal"> – {event.venue}</span>
        )}
      </h3>

      {/* Description */}
      {event.description && (
        <p className="text-gray-500 text-xs mt-1 line-clamp-2 leading-relaxed">
          {event.description}
        </p>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar size={12} className="text-primary" />
          {formattedDate}
        </span>
        {event.time && (
          <span className="flex items-center gap-1">
            <Clock size={12} className="text-primary" />
            {event.time}
          </span>
        )}
        {event.price && !event.is_free && (
          <span className="flex items-center gap-1">
            <Ticket size={12} className="text-primary" />
            {event.price}
          </span>
        )}
        {event.age_range && (
          <span className="flex items-center gap-1">
            <Users size={12} className="text-primary" />
            Age {event.age_range}
          </span>
        )}
        <a
          href={calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 py-2 text-primary hover:text-primary/70 transition-colors font-bold"
          title="Add to Google Calendar"
        >
          <CalendarPlus size={16} />
          <span>Add to Calendar</span>
        </a>
        {eventUrl && (
          <a
            href={eventUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 py-2 text-primary hover:text-primary/70 transition-colors font-bold"
            title="View event page"
          >
            <ExternalLink size={14} />
            <span>View event</span>
          </a>
        )}
      </div>

      {/* Location */}
      <p className="flex items-center gap-1 text-xs text-gray-400 mt-1.5">
        <MapPin size={12} className="shrink-0" />
        {event.location}
      </p>
    </div>
  )
}
