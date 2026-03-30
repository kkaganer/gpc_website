import { useState, useRef } from 'react'
import { MapPin, X } from 'lucide-react'

const categories = ['All', 'Family', 'Outdoor', 'Arts', 'Sports', 'Music', 'Food']
const priceOptions = ['All', 'Free', 'Paid']
const radiusOptions = [1, 2, 3, 5, 10, 15, 25]
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
  const [postcodeInput, setPostcodeInput] = useState(filters.postcode || '')
  const [postcodeError, setPostcodeError] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const debounceRef = useRef(null)

  function setFilter(key, value) {
    if (key === 'datePreset') {
      const range = getDateRange(value)
      onChange({ ...filters, datePreset: value, dateFrom: range.from, dateTo: range.to })
    } else {
      onChange({ ...filters, [key]: value })
    }
  }

  async function lookupPostcode(pc) {
    const cleaned = pc.replace(/\s/g, '').toUpperCase()
    if (cleaned.length < 2) {
      setPostcodeError('')
      onChange({ ...filters, postcode: '', postcodeLat: null, postcodeLng: null })
      return
    }
    setLookingUp(true)
    setPostcodeError('')
    try {
      // Try full postcode first, then fall back to partial (outcode like SE13)
      let lat, lng
      const fullRes = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(cleaned)}`)
      const fullData = await fullRes.json()
      if (fullData.status === 200 && fullData.result) {
        lat = fullData.result.latitude
        lng = fullData.result.longitude
      } else {
        const partialRes = await fetch(`https://api.postcodes.io/outcodes/${encodeURIComponent(cleaned)}`)
        const partialData = await partialRes.json()
        if (partialData.status === 200 && partialData.result) {
          lat = partialData.result.latitude
          lng = partialData.result.longitude
        }
      }
      if (lat && lng) {
        setPostcodeError('')
        onChange({ ...filters, postcode: cleaned, postcodeLat: lat, postcodeLng: lng })
      } else {
        setPostcodeError('Postcode not found')
        onChange({ ...filters, postcode: '', postcodeLat: null, postcodeLng: null })
      }
    } catch {
      setPostcodeError('Lookup failed')
    } finally {
      setLookingUp(false)
    }
  }

  function handlePostcodeChange(e) {
    const val = e.target.value
    setPostcodeInput(val)
    clearTimeout(debounceRef.current)
    if (!val.trim()) {
      setPostcodeError('')
      onChange({ ...filters, postcode: '', postcodeLat: null, postcodeLng: null })
      return
    }
    debounceRef.current = setTimeout(() => lookupPostcode(val), 600)
  }

  function clearPostcode() {
    setPostcodeInput('')
    setPostcodeError('')
    onChange({ ...filters, postcode: '', postcodeLat: null, postcodeLng: null })
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

      {/* Child's age */}
      <select
        value={filters.childAge}
        onChange={(e) => setFilter('childAge', e.target.value)}
        className={selectClass}
      >
        <option value="">Child's age</option>
        <option value="0">Under 1</option>
        {[1,2,3,4,5,6,7,8,9,10,11,12].map((a) => (
          <option key={a} value={a}>{a} year{a !== 1 ? 's' : ''}</option>
        ))}
      </select>

      {/* Postcode */}
      <div className="relative">
        <div className="flex items-center">
          <MapPin size={14} className="absolute left-2.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={postcodeInput}
            onChange={handlePostcodeChange}
            placeholder="Postcode"
            className={`pl-8 pr-7 py-2 rounded-xl border text-sm bg-white text-dark font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 w-28 placeholder-gray-400 ${
              postcodeError ? 'border-red-300' : filters.postcodeLat ? 'border-green-300' : 'border-gray-200'
            }`}
          />
          {postcodeInput && (
            <button
              onClick={clearPostcode}
              className="absolute right-1.5 p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {postcodeError && (
          <p className="absolute text-[10px] text-red-500 mt-0.5 left-0 whitespace-nowrap">{postcodeError}</p>
        )}
      </div>

      {/* Radius */}
      <select
        value={filters.radius}
        onChange={(e) => setFilter('radius', Number(e.target.value))}
        className={`${selectClass} ${!filters.postcodeLat ? 'opacity-40 cursor-not-allowed' : ''}`}
        disabled={!filters.postcodeLat}
      >
        {radiusOptions.map((r) => (
          <option key={r} value={r}>{r} mile{r !== 1 ? 's' : ''}</option>
        ))}
      </select>
    </div>
  )
}
