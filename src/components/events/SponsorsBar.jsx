import SectionHeading from '../ui/SectionHeading'

export default function SponsorsBar({ sponsors, showDescriptions = false, title = 'Event Sponsors' }) {
  return (
    <section className="py-12">
      <SectionHeading title={title} />
      <div className="flex flex-wrap justify-center gap-8 mt-8">
        {sponsors.map((sponsor) => (
          <div key={sponsor.name} className="flex flex-col items-center text-center max-w-xs">
            <a
              href={sponsor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity focus:ring-2 focus:ring-primary focus:outline-none rounded"
            >
              <img
                src={sponsor.logo}
                alt={`${sponsor.name} logo`}
                className="h-16 object-contain"
                loading="lazy"
              />
            </a>
            <p className="mt-2 font-heading font-semibold text-dark text-sm">
              {sponsor.name}
            </p>
            {showDescriptions && sponsor.description && (
              <p className="mt-1 text-gray-500 text-xs leading-relaxed">
                {sponsor.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
