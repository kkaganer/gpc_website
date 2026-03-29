export default function SectionHeading({ title, subtitle }) {
  return (
    <div className="text-center">
      <h2 className="font-heading text-3xl md:text-4xl font-bold text-dark">
        {title}
      </h2>
      {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
      <div className="w-16 h-1 bg-primary mx-auto mt-4 rounded-full" />
    </div>
  )
}
