import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { createEvent, updateEvent } from '../../hooks/useEventMutations'
import ImageUpload from '../../components/admin/ImageUpload'

const emptyForm = {
  title: '',
  date: '',
  time: '',
  location: '',
  description: '',
  image_url: '',
  ticket_url: '',
  price: '',
  status: 'upcoming',
  featured: false,
  notes: '',
  sponsors: [],
}

const emptySponsor = { name: '', logo: '', url: '', description: '' }

export default function EventForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEditing)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = isEditing ? 'Edit Event | GPC Admin' : 'New Event | GPC Admin'
  }, [isEditing])

  useEffect(() => {
    if (!isEditing) return
    async function load() {
      const { data, error: fetchError } = await supabase
        .from('gpc_events')
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
          location: data.location || '',
          description: data.description || '',
          image_url: data.image_url || '',
          ticket_url: data.ticket_url || '',
          price: data.price || '',
          status: data.status || 'upcoming',
          featured: data.featured || false,
          notes: data.notes || '',
          sponsors: data.sponsors || [],
        })
      }
      setLoading(false)
    }
    load()
  }, [id, isEditing])

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function addSponsor() {
    setForm((prev) => ({ ...prev, sponsors: [...prev.sponsors, { ...emptySponsor }] }))
  }

  function updateSponsor(index, field, value) {
    setForm((prev) => {
      const sponsors = [...prev.sponsors]
      sponsors[index] = { ...sponsors[index], [field]: value }
      return { ...prev, sponsors }
    })
  }

  function removeSponsor(index) {
    setForm((prev) => ({
      ...prev,
      sponsors: prev.sponsors.filter((_, i) => i !== index),
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      if (isEditing) {
        await updateEvent(id, form)
      } else {
        await createEvent(form)
      }
      navigate('/admin/events')
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
        onClick={() => navigate('/admin/events')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-dark mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Events
      </button>

      <h1 className="font-heading text-2xl font-bold text-dark mb-8">
        {isEditing ? 'Edit Event' : 'Create New Event'}
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-dark">Title *</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              required
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. Easter Egg Hunt 2026"
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
            <span className="text-sm font-semibold text-dark">Location *</span>
            <input
              type="text"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              required
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. Greenwich Park, London"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-dark">Description *</span>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              required
              rows={4}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="Describe the event..."
            />
          </label>

          <div>
            <span className="text-sm font-semibold text-dark block mb-2">Event Image</span>
            <ImageUpload value={form.image_url} onChange={(url) => set('image_url', url)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-dark">Price</span>
              <input
                type="text"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="e.g. Free or £5"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-dark">Status *</span>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
              >
                <option value="upcoming">Upcoming</option>
                <option value="sold-out">Sold Out</option>
                <option value="past">Past</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-dark">Ticket URL</span>
            <input
              type="url"
              value={form.ticket_url}
              onChange={(e) => set('ticket_url', e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. https://www.zeffy.com/..."
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-dark">Notes</span>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="e.g. Dogs not permitted at this venue"
            />
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => set('featured', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-semibold text-dark">Featured event</span>
          </label>
        </div>

        {/* Sponsors section */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg text-dark">Sponsors</h2>
            <button
              type="button"
              onClick={addSponsor}
              className="text-sm text-primary font-semibold hover:underline"
            >
              + Add Sponsor
            </button>
          </div>

          {form.sponsors.length === 0 && (
            <p className="text-gray-400 text-sm">No sponsors added yet.</p>
          )}

          {form.sponsors.map((sponsor, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 mb-3">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase">Sponsor {i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeSponsor(i)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={sponsor.name}
                  onChange={(e) => updateSponsor(i, 'name', e.target.value)}
                  placeholder="Sponsor name"
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="url"
                  value={sponsor.url}
                  onChange={(e) => updateSponsor(i, 'url', e.target.value)}
                  placeholder="Website URL"
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="text"
                  value={sponsor.logo}
                  onChange={(e) => updateSponsor(i, 'logo', e.target.value)}
                  placeholder="Logo URL"
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="text"
                  value={sponsor.description}
                  onChange={(e) => updateSponsor(i, 'description', e.target.value)}
                  placeholder="Short description"
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-dark text-white font-bold text-sm hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEditing ? 'Update Event' : 'Create Event'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/events')}
            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:border-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
