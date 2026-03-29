import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import EventHero from '../components/events/EventHero'
import EventDetails from '../components/events/EventDetails'
import SponsorsBar from '../components/events/SponsorsBar'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { sponsors } from '../data/sponsors'

export default function ChristmasFair() {
  useEffect(() => {
    document.title = 'Christmas Fair 2025 | Greenwich Parents & Carers';
  }, []);

  return (
    <div>
      <EventHero
        title="Christmas Fair 2025"
        date="Saturday, 7 December 2025"
        image="/images/christmasfair.jpg"
      />

      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Badge variant="sold-out">Sold Out</Badge>
          </div>

          <EventDetails
            date="Saturday, 7 December 2025"
            time="11:00 - 16:00"
            location="Greenwich West Community and Arts Centre"
            price="Adults £3 / Children Free"
            description="Our sold-out Christmas Fair was a huge success! Over 400 families joined us for a magical day of festive stalls, Santa's grotto, face painting, craft activities, and delicious food. Thank you to everyone who came and made it such a special day."
          />

          <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-xl p-4 mt-6">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-amber-800 text-sm">
              Please note: dogs are not permitted at this venue.
            </p>
          </div>

          <SponsorsBar sponsors={sponsors.christmasFair} />

          <div className="text-center mt-8 py-8 border-t border-gray-100">
            <p className="text-gray-600 mb-4">
              Missed this one? Check out our upcoming events!
            </p>
            <Button href="/events">View Upcoming Events</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
