import { useState } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { communities } from '../../data/communities'
import { CONTACT } from '../../utils/constants'

const areas = ['SE10', 'SE3', 'SE7', 'SE8', 'SE18', 'Other']
const referralSources = ['Instagram', 'Friend or family', 'Google', 'At a GPC event', 'Other']

export default function JoinCommunityModal({ onClose }) {
  const [form, setForm] = useState({
    name: '',
    area: '',
    interests: [],
    baby_year: '',
    referral_source: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleInterest(key) {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(key)
        ? prev.interests.filter((k) => k !== key)
        : [...prev.interests, key],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const { error: insertError } = await supabase.from('whatsapp_join_requests').insert({
        name: form.name,
        area: form.area || null,
        interests: form.interests.length > 0 ? form.interests : null,
        baby_year: form.baby_year || null,
        referral_source: form.referral_source || null,
      })
      if (insertError) throw insertError
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-heading font-bold text-lg text-dark">Join our WhatsApp community</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-dark rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-xl">✓</span>
            </div>
            <h3 className="font-heading font-bold text-dark text-lg">You're on the list!</h3>
            <p className="text-gray-500 text-sm mt-2">
              One of our volunteer admins will review your request and get you connected — usually within 24 hours.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-dark text-white text-sm font-bold"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
            <p className="text-gray-500 text-sm">
              Tell us a little about yourself and we'll get you added to the right groups.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <label className="block">
              <span className="text-sm font-semibold text-dark">Your first name *</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                required
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="e.g. Sarah"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-dark">Your area</span>
              <select
                value={form.area}
                onChange={(e) => set('area', e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
              >
                <option value="">Select your postcode area...</option>
                {areas.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </label>

            <fieldset>
              <legend className="text-sm font-semibold text-dark mb-2">Which groups interest you?</legend>
              <div className="space-y-2">
                {communities.general.map((c) => (
                  <label key={c.key} className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.interests.includes(c.key)}
                      onChange={() => toggleInterest(c.key)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">
                      <span className="font-medium text-dark">{c.name}</span>
                      {c.description && (
                        <span className="text-gray-400 ml-1">— {c.description}</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold text-dark mb-2">Baby group by school year</legend>
              <div className="space-y-2">
                {communities.schoolYear.map((c) => (
                  <label key={c.key} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="baby_year"
                      value={c.year}
                      checked={form.baby_year === c.year}
                      onChange={(e) => set('baby_year', e.target.value)}
                      className="w-4 h-4 border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-dark">{c.name}</span>
                  </label>
                ))}
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="baby_year"
                    value=""
                    checked={form.baby_year === ''}
                    onChange={(e) => set('baby_year', '')}
                    className="w-4 h-4 border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-400">Not applicable</span>
                </label>
              </div>
            </fieldset>

            <label className="block">
              <span className="text-sm font-semibold text-dark">How did you find us?</span>
              <select
                value={form.referral_source}
                onChange={(e) => set('referral_source', e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
              >
                <option value="">Select...</option>
                {referralSources.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-dark text-white font-bold text-sm hover:scale-[1.02] transition-transform disabled:opacity-50 mt-2"
            >
              {submitting ? 'Submitting...' : 'Request to join'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
