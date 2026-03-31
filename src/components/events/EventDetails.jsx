import { Calendar, Clock, MapPin, Ticket, CalendarPlus } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'

const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
    <Icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
    <div>
      <span className="text-xs font-bold uppercase text-gray-400">{label}</span>
      <p className="text-dark font-medium">{value}</p>
    </div>
  </div>
)

export default function EventDetails({ date, time, location, price, description, calendarUrl }) {
  return (
    <Card className="p-6 md:p-8">
      <DetailRow icon={Calendar} label="Date" value={date} />
      <DetailRow icon={Clock} label="Time" value={time} />
      <DetailRow icon={MapPin} label="Location" value={location} />
      <DetailRow icon={Ticket} label="Admission" value={price} />
      {description && (
        <p className="text-gray-600 mt-6 leading-relaxed">{description}</p>
      )}
      {calendarUrl && (
        <div className="mt-6">
          <Button variant="secondary" href={calendarUrl}>
            <CalendarPlus className="w-4 h-4 mr-2" />
            Add to Google Calendar
          </Button>
        </div>
      )}
    </Card>
  )
}
