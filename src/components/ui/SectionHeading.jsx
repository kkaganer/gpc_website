export default function SectionHeading({ title, subtitle, align = 'center', showUnderline = true }) {
  const isLeft = align === 'left';
  return (
    <div className={isLeft ? 'text-left' : 'text-center'}>
      <h2 className="font-heading text-3xl md:text-4xl font-bold text-dark">
        {title}
      </h2>
      {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
      {showUnderline && (
        <div className={`w-16 h-1 bg-primary mt-4 rounded-full ${isLeft ? '' : 'mx-auto'}`} />
      )}
    </div>
  )
}
