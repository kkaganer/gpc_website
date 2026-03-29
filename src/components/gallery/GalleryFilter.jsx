export default function GalleryFilter({ categories, activeCategory, onCategoryChange }) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`rounded-full px-6 py-2 font-semibold cursor-pointer transition focus:ring-2 focus:ring-primary focus:outline-none ${
            activeCategory === category
              ? 'bg-primary text-white'
              : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  )
}
