import { useState, useEffect } from 'react'
import { X, Loader2, ExternalLink, AlertTriangle } from 'lucide-react'
import {
  activityFormFromRow,
  buildActivityPatch,
  validateActivityPatch,
} from '../../lib/discoveryActivity'
import { geocodePostcode } from '../../lib/geocode'

/**
 * Correct one discovered activity, over the top of the review queue.
 *
 * A SLIDE-OVER, not a route, and that is the whole point. The queue underneath
 * never unmounts, so scroll position, open groups and ticked rows all survive
 * the edit — the same property `useDiscoveredActivities` protects by not
 * setting `loading` on a refetch. Reviewing fifty listings should not mean fifty
 * trips back to the top of the page.
 *
 * Everything here writes to `activities`, the table behind the review view, so a
 * fix made BEFORE approval is carried into `london_events` by publish_activity()
 * rather than needing a second correction on the What's On screen afterwards.
 */

const CATEGORIES = ['Family', 'Outdoor', 'Arts', 'Sports', 'Music', 'Food']

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-dark">{label}</span>
      {hint && <span className="block text-xs text-gray-400 mt-0.5">{hint}</span>}
      {children}
    </label>
  )
}

const inputClass =
  'mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50'

export default function ActivityEditPanel({ activity, onClose, onSaved }) {
  const [form, setForm] = useState(() => activityFormFromRow(activity))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Re-seed when the panel is pointed at a different row without closing.
  useEffect(() => {
    setForm(activityFormFromRow(activity))
    setError('')
  }, [activity])

  // Escape closes. A panel over a long queue is easy to lose the close button
  // for once you have scrolled the form.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !saving) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, saving])

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const patch = buildActivityPatch(form)
    const problems = validateActivityPatch(patch)
    if (problems.length) {
      setError(problems.join(' '))
      return
    }

    setSaving(true)
    try {
      // A postcode with no coordinates never reaches the map: publish_activity
      // copies lat/lng straight through to london_events. A hand-typed pair
      // always wins — this only fills a genuine blank.
      if (patch.postcode && (patch.lat == null || patch.lng == null)) {
        const coords = await geocodePostcode(patch.postcode)
        if (coords) {
          patch.lat = coords.lat
          patch.lng = coords.lng
        }
      }
      await onSaved(patch)
    } catch (err) {
      setError(err.message || 'Failed to save.')
      setSaving(false)
    }
  }

  const website = activity.deep_link || activity.booking_url || activity.source_url

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close editor"
        onClick={() => !saving && onClose()}
        className="absolute inset-0 bg-dark/20"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${activity.title}`}
        className="relative w-full max-w-lg h-full bg-white shadow-xl overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between gap-4 z-10">
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-bold text-dark truncate">Edit activity</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {activity.source_name || activity.source_id}
              {activity.status === 'published' && ' · live on What’s On'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-2 -mr-2 rounded-lg text-gray-400 hover:text-dark hover:bg-gray-50 transition-colors disabled:opacity-40"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Editing a published row rewrites what the public already sees, so say
            so before the fields rather than after the save. */}
        {activity.status === 'published' && (
          <p className="mx-6 mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
            <AlertTriangle size={14} className="shrink-0 mt-px" />
            <span>
              This listing is already on What&apos;s On. Saving republishes it, so the
              change goes live immediately.
            </span>
          </p>
        )}

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <Field label="Title *">
            <input
              type="text" value={form.title} required
              onChange={(e) => set('title', e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Venue">
            <input
              type="text" value={form.venue_name}
              onChange={(e) => set('venue_name', e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field
            label="Address"
            hint="Published listings show address, then venue, then postcode — the first one filled in wins."
          >
            <input
              type="text" value={form.address}
              onChange={(e) => set('address', e.target.value)}
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Postcode" hint="Fills the map pin if it is blank.">
              <input
                type="text" value={form.postcode}
                onChange={(e) => set('postcode', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Borough">
              <input
                type="text" value={form.borough}
                onChange={(e) => set('borough', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Latitude" hint="Leave blank to derive from the postcode.">
              <input
                type="number" step="any" value={form.lat}
                onChange={(e) => set('lat', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Longitude">
              <input
                type="number" step="any" value={form.lng}
                onChange={(e) => set('lng', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Website" hint="Used as the listing's link. Falls back to the booking link, then the source page.">
            <input
              type="url" value={form.deep_link}
              onChange={(e) => set('deep_link', e.target.value)}
              placeholder="https://"
              className={inputClass}
            />
          </Field>

          <Field label="Booking link">
            <input
              type="url" value={form.booking_url}
              onChange={(e) => set('booking_url', e.target.value)}
              placeholder="https://"
              className={inputClass}
            />
          </Field>

          {/* Provenance, not an editable field: rewriting where a row came from
              would make the source column lie. Shown because it is the third
              fallback for the published link, so it decides "has a website". */}
          {activity.source_url && (
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              Source page:
              <a
                href={activity.source_url} target="_blank" rel="noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1 truncate max-w-[22rem]"
              >
                {activity.source_url}
                <ExternalLink size={11} className="shrink-0" />
              </a>
            </p>
          )}
          {!website && (
            <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
              <AlertTriangle size={13} /> No link at all — this publishes with no way to book.
            </p>
          )}

          <Field label="Description">
            <textarea
              rows={4} value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className={inputClass}
            >
              <option value="">—</option>
              {/* Keep whatever the feed sent even if it is not one of ours,
                  otherwise opening the panel would silently blank it on save. */}
              {!CATEGORIES.includes(form.category) && form.category && (
                <option value={form.category}>{form.category}</option>
              )}
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Youngest age" hint="In MONTHS.">
              <input
                type="number" min="0" value={form.age_min_months}
                onChange={(e) => set('age_min_months', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Oldest age" hint="In months. 60 = 5 years.">
              <input
                type="number" min="0" value={form.age_max_months}
                onChange={(e) => set('age_max_months', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Price">
            <input
              type="text" value={form.price_text}
              onChange={(e) => set('price_text', e.target.value)}
              placeholder="e.g. £4 per child"
              className={inputClass}
            />
          </Field>

          {/* Both are genuinely three-state in the database. term_time_only in
              particular: NULL means nobody knows, and the publish gate holds
              those back rather than guessing. A yes/no checkbox would turn every
              unknown into a confident "runs in the school holidays". */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Free?">
              <select
                value={form.is_free}
                onChange={(e) => set('is_free', e.target.value)}
                className={inputClass}
              >
                <option value="">Not known</option>
                <option value="true">Free</option>
                <option value="false">Paid</option>
              </select>
            </Field>
            <Field label="Term time only?" hint="Leave unknown rather than guessing.">
              <select
                value={form.term_time_only}
                onChange={(e) => set('term_time_only', e.target.value)}
                className={inputClass}
              >
                <option value="">Not known</option>
                <option value="true">Term time only</option>
                <option value="false">Runs in holidays too</option>
              </select>
            </Field>
          </div>

          <div className="flex items-center gap-3 pt-2 sticky bottom-0 bg-white pb-1">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </aside>
    </div>
  )
}
