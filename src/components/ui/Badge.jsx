const variantStyles = {
  free: 'bg-green-500',
  'sold-out': 'bg-red-500',
  new: 'bg-amber-500',
  upcoming: 'bg-primary',
  past: 'bg-gray-400',
}

export default function Badge({ variant = 'upcoming', children }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase text-white ${variantStyles[variant] || variantStyles.upcoming}`}
    >
      {children}
    </span>
  )
}
