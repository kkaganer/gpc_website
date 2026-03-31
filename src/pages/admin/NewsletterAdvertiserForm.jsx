import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const emptyForm = {
  advertiser_name: '',
  contact_email: '',
  event_title: '',
  event_description: '',
  event_url: '',
  newsletter_date: '',
  ad_type: 'free-listing',
  status: 'pending',
  notes: '',
}

const adTypes = [
  { value: 'free-listing', label: 'Free Listing' },
  { value: 'featured-ad', label: 'Featured Ad' },
  { value: 'logo-sponsor', label: 'Logo Sponsor' },
]

const statuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'included', label: 'Included' },
  { value: 'completed', label: 'Completed' },
]

export default function NewsletterAdvertiserForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEditing)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = isEditing ? 'Edit Advertiser | GPC Admin' : 'Add Advertiser | GPC Admin'
  }, [isEditing])

  useEffect(() => {
    if (!isEditing) return
    async function load() {
      const { data, error: fetchError } = await supabase
        .from('newsletter_advertisers')
        .select('*')
        .eq('id', id)
        .single()
      if (fetchError || !data) {
        setError('Advertiser not found.')
      } else {
        setForm({
          advertiser_name: data.advertiser_name || '',
          contact_email: data.contact_email || '',
          event_title: data.event_title || '',
          event_description: data.event_description || '',
          event_url: data.event_url || '',
          newsletter_date: data.newsletter_date || '',
          ad_type: data.ad_type || 'free-listing',
          status: data.status || 'pending',
          notes: data.notes || '',
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
      const payload = { ...form }
      if (isEditing) {
        const { error: updateError } = await supabase
          .from('newsletter_advertisers')
          .update(payload)
          .eq('id', id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('newsletter_advertisers')
          .insert(payload)
        if (insertError) throw insertError
      }
      navigate('/admin/newsletter-advertisers')
    } catch (err) {
      setError(err.message || 'Failed to save advertiser.')
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
        onClick={() => navigate('/admin/newsletter-advertisers')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-dark mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Advertisers
      </button>

      <h1 className="font-heading text-2xl font-bold text-dark mb-8">
        {isEditing ? 'Edit Advertiser' : 'Add Advertiser'}
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-dark">Advertiser Name *</span>
            <input
              type="text"
              value={form.advertiser_name}
              onChange={(e) => set('advertiser_name', e.target.value)}
              required
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. Boppin' Bunnies"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-dark">Contact Email</span>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => set('contact_email', e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="email@example.com"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-dark">Event Title *</span>
          <input
            type="text"
            value={form.event_title}
            onChange={(e) => set('event_title', e.target.value)}
            required
            className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="e.g. Easter Music Party"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-dark">Event Description</span>
          <textarea
            value={form.event_description}
            onChange={(e) => set('event_description', e.target.value)}
            rows={3}
            className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            placeholder="Details to include in the newsletter"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-dark">Event URL</span>
          <input
            type="url"
            value={form.event_url}
            onChange={(e) => set('event_url', e.target.value)}
            className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Link to event page"
          />
        </label>

        <div className="grid grid-cols-3 gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-dark">Newsletter Date *</span>
            <input
              type="date"
              value={form.newsletter_date}
              onChange={(e) => set('newsletter_date', e.target.value)}
              required
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-dark">Ad Type</span>
            <select
              value={form.ad_type}
              onChange={(e) => set('ad_type', e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
            >
              {adTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-dark">Status</span>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-dark">Notes</span>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={2}
            className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            placeholder="Internal notes (not included in newsletter)"
          />
        </label>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-dark text-white font-bold text-sm hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEditing ? 'Update Advertiser' : 'Add Advertiser'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/newsletter-advertisers')}
            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:border-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
