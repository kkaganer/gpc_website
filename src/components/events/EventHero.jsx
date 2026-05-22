export default function EventHero({ title, date, image }) {
  return (
    <div>
      {image && (
        <div className="bg-gray-100 flex justify-center">
          <img
            src={image}
            alt={title}
            className="w-full max-w-3xl max-h-[80vh] object-contain"
          />
        </div>
      )}
      <div className="max-w-5xl mx-auto w-full px-4 py-8">
        {date && (
          <span className="inline-block bg-primary text-white text-sm font-bold px-4 py-1 rounded-full mb-4">
            {date}
          </span>
        )}
        <h1 className="font-heading text-3xl md:text-5xl font-bold text-dark">
          {title}
        </h1>
      </div>
    </div>
  )
}
