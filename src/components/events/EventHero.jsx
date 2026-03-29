export default function EventHero({ title, date, image }) {
  return (
    <div
      className="relative min-h-[40vh] flex items-end bg-cover bg-center"
      style={{ backgroundImage: `url(${image})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/50 to-dark/20" />
      <div className="relative z-10 max-w-5xl mx-auto w-full px-4 py-12">
        {date && (
          <span className="inline-block bg-primary text-white text-sm font-bold px-4 py-1 rounded-full mb-4">
            {date}
          </span>
        )}
        <h1 className="font-heading text-3xl md:text-5xl font-bold text-white">
          {title}
        </h1>
      </div>
    </div>
  )
}
