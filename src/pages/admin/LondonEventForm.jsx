import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const emptyForm = {
  title: '',
  date: '',
  time: '',
  venue: '',
  location: '',
  area: '',
  description: '',
  url: '',
  image_url: '',
  category: '',
  age_range: '',
  price: '',
  is_free: false,
  approved: true,
  lat: '',
  lng: '',
}

const areas = ['Greenwich', 'Lewisham', 'Southwark', 'Central London', 'Tower Hamlets', 'Bromley']
const categories = ['Family', 'Outdoor', 'Arts', 'Sports', 'Music', 'Food']

export default function LondonEventForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEditing)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = isEditing ? 'Edit London Event | GPC Admin' : 'Add London Event | GPC Admin'
  }, [isEditing])

  useEffect(() => {
    if (!isEditing) return
    async function load() {
      const { data, error: fetchError } = await supabase
        .from('london_events')
        .select('*')
        .eq('id', id)
        .single()
      if (fetchError || !data) {
        setError('Event not found.')
      } else {
        setForm({
          title: data.title || '',
          date: data.date || '',
          time: data.time || '',
          venue: data.venue || '',
          location: data.location || '',
          area: data.area || '',
          description: data.description || '',
          url: data.url || '',
          image_url: data.image_url || '',
          category: data.category || '',
          age_range: data.age_range || '',
          price: data.price || '',
          is_free: data.is_free || false,
          approved: data.approved ?? true,
          lat: data.lat ?? '',
          lng: data.lng ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [id, isEditing])

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const payload = {
        ...form,
        source: 'manual',
        lat: form.lat !== '' ? parseFloat(form.lat) : null,
        lng: form.lng !== '' ? parseFloat(form.lng) : null,
      }
      if (isEditing) {
        const { error: updateError } = await supabase
          .from('london_events')
          .update(payload)
          .eq('id', id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('london_events')
          .insert(payload)
        if (insertError) throw insertError
      }
      navigate('/admin/whats-on')
    } catch (err) {
      setError(err.message || 'Failed to save event.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate('/admin/whats-on')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-dark mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to What's On
      </button>

      <h1 className="font-heading text-2xl font-bold text-dark mb-8">
        {isEditing ? 'Edit London Event' : 'Add London Event'}
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
        <label className="block">
          <span className="text-sm font-semibold text-dark">Title *</span>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            required
            className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-dark">Date *</span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              required
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-dark">Time</span>
            <input
              type="text"
              value={form.time}
              onChange={(e) => set('time', e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. 10:00 - 14:00"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-dark">Venue Name</span>
          <input
            type="text"
            value={form.venue}
            onChange={(e) => set('venue', e.target.value)}
            className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="e.g. National Maritime Museum"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-dark">Address / Location *</span>
            <input
              type="text"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              required
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-dark">Area</span>
            <select
              value={form.area}
              onChange={(e) => set('area', e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
            >
              <option value="">Select area...</option>
              {areas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-dark">Description</span>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-dark">Category</span>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
            >
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-dark">Age Range</span>
            <input
              type="text"
              value={form.age_range}
              onChange={(e) => set('age_range', e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. 0-5, All ages"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-dark">Price</span>
            <input
              type="text"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. £5 per family"
            />
          </label>
          <label className="flex items-center gap-3 self-end pb-3">
            <input
              type="checkbox"
              checked={form.is_free}
              onChange={(e) => set('is_free', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-semibold text-dark">Free event</span>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-dark">Event URL</span>
          <input
            type="url"
            value={form.url}
            onChange={(e) => set('url', e.target.value)}
            className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Link to event page"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-dark">Image URL</span>
          <input
            type="url"
            value={form.image_url}
            onChange={(e) => set('image_url', e.target.value)}
            className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Image URL (optional)"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-dark">Latitude</span>
            <input
              type="number"
              step="any"
              value={form.lat}
              onChange={(e) => set('lat', e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. 51.4769"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-dark">Longitude</span>
            <input
              type="number"
              step="any"
              value={form.lng}
              onChange={(e) => set('lng', e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. -0.0005"
            />
          </label>
        </div>
        <p className="text-xs text-gray-400 -mt-3">Optional. Events with coordinates will show as pins on the map.</p>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-dark text-white font-bold text-sm hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEditing ? 'Update Event' : 'Add Event'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/whats-on')}
            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:border-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
