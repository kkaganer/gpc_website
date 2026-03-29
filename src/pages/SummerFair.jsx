import { useEffect } from 'react'
import EventHero from '../components/events/EventHero'
import SponsorsBar from '../components/events/SponsorsBar'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { sponsors } from '../data/sponsors'

export default function SummerFair() {
  useEffect(() => {
    document.title = 'Summer Fair 2025 | Greenwich Parents & Carers';
  }, []);

  return (
    <div>
      <EventHero
        title="Summer Fair 2025"
        date="Saturday, 12 July 2025"
        image="/images/summerfair.jpg"
      />

      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-dark">
              Thank You!
            </h2>
            <div className="w-16 h-1 bg-primary mx-auto mt-4 rounded-full" />
            <p className="text-gray-600 mt-6 leading-relaxed">
              What an incredible day! Our Summer Fair 2025 brought together hundreds
              of families for a wonderful afternoon of community spirit, amazing
              stalls, delicious food, and fun activities for all ages.
            </p>
            <p className="text-gray-600 mt-4 leading-relaxed">
              None of this would have been possible without our amazing volunteers,
              stallholders, and of course — our wonderful sponsors.
            </p>
          </div>

          <SponsorsBar
            sponsors={sponsors.summerFair}
            showDescriptions
            title="Our Sponsors"
          />

          <div className="mt-8">
            <h3 className="font-heading font-bold text-xl text-dark text-center mb-6">
              Meet Our Sponsors
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {sponsors.summerFair.map((sponsor, index) => (
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

          <div className="text-center mt-12 py-8 border-t border-gray-100">
            <Button href="/events">See Our Upcoming Events</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
