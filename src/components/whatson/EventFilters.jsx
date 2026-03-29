const areas = ['All', 'Greenwich', 'Lewisham', 'Southwark', 'Central London', 'Tower Hamlets', 'Bromley']
const categories = ['All', 'Family', 'Outdoor', 'Arts', 'Sports', 'Music', 'Food']
const priceOptions = ['All', 'Free', 'Paid']
const datePresets = [
  { label: 'Any date', value: 'all' },
  { label: 'This Week', value: 'week' },
  { label: 'This Weekend', value: 'weekend' },
  { label: 'This Month', value: 'month' },
]

function getDateRange(preset) {
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  if (preset === 'all') return { from: null, to: null }

  if (preset === 'week') {
    const end = new Date(now)
    end.setDate(end.getDate() + (7 - end.getDay()))
    return { from: today, to: end.toISOString().split('T')[0] }
  }

  if (preset === 'weekend') {
    const day = now.getDay()
    const satOffset = day === 0 ? -1 : 6 - day
    const sat = new Date(now)
    sat.setDate(sat.getDate() + satOffset)
    const sun = new Date(sat)
    sun.setDate(sun.getDate() + 1)
    return {
      from: sat.toISOString().split('T')[0],
      to: sun.toISOString().split('T')[0],
    }
  }

  if (preset === 'month') {
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { from: today, to: end.toISOString().split('T')[0] }
  }

  return { from: null, to: null }
}

const selectClass = 'px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white text-dark font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer'

export default function EventFilters({ filters, onChange }) {
  function setFilter(key, value) {
    if (key === 'datePreset') {
      const range = getDateRange(value)
      onChange({ ...filters, datePreset: value, dateFrom: range.from, dateTo: range.to })
    } else {
      onChange({ ...filters, [key]: value })
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Category */}
      <select
        value={filters.category}
        onChange={(e) => setFilter('category', e.target.value)}
        className={selectClass}
      >
        {categories.map((c) => (
          <option key={c} value={c}>{c === 'All' ? 'Event type' : c}</option>
        ))}
      </select>

      {/* Date */}
      <select
        value={filters.datePreset}
        onChange={(e) => setFilter('datePreset', e.target.value)}
        className={selectClass}
      >
        {datePresets.map((d) => (
          <option key={d.value} value={d.value}>{d.label}</option>
        ))}
      </select>

      {/* Price */}
      <select
        value={filters.price}
        onChange={(e) => setFilter('price', e.target.value)}
        className={selectClass}
      >
        {priceOptions.map((p) => (
          <option key={p} value={p}>{p === 'All' ? 'Price' : p}</option>
        ))}
      </select>

      {/* Age range */}
      <input
        type="text"
        value={filters.ageRange || ''}
        onChange={(e) => setFilter('ageRange', e.target.value)}
        placeholder="Child's age"
        className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white text-dark font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 w-28 placeholder-gray-400"
      />

      {/* Area */}
      <select
        value={filters.area}
        onChange={(e) => setFilter('area', e.target.value)}
        className={selectClass}
      >
        {areas.map((a) => (
          <option key={a} value={a}>{a === 'All' ? 'Location' : a}</option>
        ))}
      </select>
    </div>
  )
}
