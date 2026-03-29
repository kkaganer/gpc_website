export default function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow overflow-hidden ${className}`}
    >
      {children}
    </div>
  )
}
