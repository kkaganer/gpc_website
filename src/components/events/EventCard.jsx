import { Calendar, MapPin } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

const statusLabels = {
  upcoming: 'Upcoming',
  'sold-out': 'Sold Out',
  past: 'Past',
}

export default function EventCard({ event }) {
  const { slug, title, date, location, description, image_url, image, status } = event

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Card>
      <div className="bg-gray-50">
        <img src={image_url || image} alt={title} className="w-full h-auto" loading="lazy" />
      </div>
      <div className="p-6">
        <Badge variant={status}>{statusLabels[status] || status}</Badge>
        <h3 className="font-heading font-bold text-xl mt-2">{title}</h3>
        <div className="flex items-center gap-2 text-gray-600 mt-2">
          <Calendar className="w-4 h-4 shrink-0" />
          <span className="text-sm">{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 mt-1">
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="text-sm">{location}</span>
        </div>
        <p className="text-gray-600 mt-3 text-sm line-clamp-2">{description}</p>
        <div className="mt-4">
          <Button variant="secondary" href={`/events/${slug || id}`}>
            View Details
          </Button>
        </div>
      </div>
    </Card>
  )
}
