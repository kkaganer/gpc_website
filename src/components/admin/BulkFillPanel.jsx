import { useState, useEffect } from 'react'
import { X, Loader2, AlertTriangle, Wand2 } from 'lucide-react'
import { planBulkFill, BULK_FILL_LABELS } from '../../lib/discoveryFilters'
import { isBlank } from '../../lib/discoveryActivity'
import ConfirmModal from '../ui/ConfirmModal'

/**
 * Give many selected listings the one thing they are missing.
 *
 * FILL BLANKS ONLY. A field is written to a row only where that row's value is
 * currently blank; a row that already has one is left alone and counted. There
 * is no override switch, because there is no undo on this screen and the
 * failure mode of the other design is silent: one careless select-all stamping
 * a single venue's postcode across forty unrelated listings, with nothing on
 * screen to say it happened.
 *
 * The counting and the fill-or-skip judgement all live in `planBulkFill`, which
 * is pure and checkable outside a browser. This component only shows what that
 * plan says and asks before sending it.
 */

const CATEGORIES = ['Family', 'Outdoor', 'Arts', 'Sports', 'Music', 'Food']

const EMPTY = {
  postcode: '',
  venue_name: '',
  address: '',
  deep_link: '',
  category: '',
  age_min_months: '',
  age_max_months: '',
}

const inputClass =
  'mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50'

function Row({ label, hint, blanks, total, children }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-dark">{label}</span>
        <span className={`text-xs font-bold ${blanks ? 'text-amber-700' : 'text-gray-300'}`}>
          {blanks} of {total} blank
        </span>
      </span>
      {hint && <span className="block text-xs text-gray-400 mt-0.5">{hint}</span>}
      {children}
    </label>
  )
}

export default function BulkFillPanel({ rows, onClose, onApply, busy }) {
  const [values, setValues] = useState(EMPTY)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, busy])

  function set(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  // The dry run. Recomputed as you type, so the panel can say what WOULD happen
  // before anything is written — including the number it will refuse to touch.
  const plan = planBulkFill(rows, values)
  const total = rows.length
  // How many of the selected rows this field could actually be written to. Shown
  // next to every input so the panel answers "is this worth filling in?" before
  // you type, not after.
  const blanksFor = (field) => rows.filter((r) => isBlank(r[field])).length

  const willWrite = plan.writes.length
  const nothingSupplied = plan.supplied.length === 0

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (nothingSupplied) {
      setError('Fill in at least one field. A blank field is never applied, so nothing would change.')
      return
    }
    if (willWrite === 0) {
      setError('Every selected listing already has a value for the fields you filled in, so nothing would change.')
      return
    }
    setConfirming(true)
  }

  const summary = plan.supplied
    .map((f) => `${BULK_FILL_LABELS[f]} on ${plan.filled[f]}${plan.skipped[f] ? ` (${plan.skipped[f]} already set)` : ''}`)
    .join(', ')

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close bulk editor"
        onClick={() => !busy && onClose()}
        className="absolute inset-0 bg-dark/20"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Fill blanks on ${total} listings`}
        className="relative w-full max-w-lg h-full bg-white shadow-xl overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between gap-4 z-10">
          <div>
            <h2 className="font-heading text-lg font-bold text-dark flex items-center gap-2">
              <Wand2 size={18} className="text-primary" />
              Fill blanks
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {total} listing{total === 1 ? '' : 's'} selected
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="p-2 -mr-2 rounded-lg text-gray-400 hover:text-dark hover:bg-gray-50 transition-colors disabled:opacity-40"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mx-6 mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
          Only <strong>blank</strong> fields are filled. A listing that already has a
          value keeps it — nothing here can overwrite one. Leave a field empty to skip it.
        </p>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <Row
            label="Postcode"
            hint="Also sets the map pin, on rows that have neither coordinate."
            blanks={blanksFor('postcode')} total={total}
          >
            <input type="text" value={values.postcode} className={inputClass}
              onChange={(e) => set('postcode', e.target.value)} />
          </Row>

          <Row label="Venue" blanks={blanksFor('venue_name')} total={total}>
            <input type="text" value={values.venue_name} className={inputClass}
              onChange={(e) => set('venue_name', e.target.value)} />
          </Row>

          <Row label="Address" blanks={blanksFor('address')} total={total}>
            <input type="text" value={values.address} className={inputClass}
              onChange={(e) => set('address', e.target.value)} />
          </Row>

          <Row
            label="Website"
            hint="Rows with a booking link or a source page already count as having one."
            blanks={blanksFor('deep_link')} total={total}
          >
            <input type="url" value={values.deep_link} placeholder="https://" className={inputClass}
              onChange={(e) => set('deep_link', e.target.value)} />
          </Row>

          <Row label="Category" blanks={blanksFor('category')} total={total}>
            <select value={values.category} className={inputClass}
              onChange={(e) => set('category', e.target.value)}>
              <option value="">— leave alone —</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Row>

          <div className="grid grid-cols-2 gap-4">
            <Row label="Youngest age" hint="Months." blanks={blanksFor('age_min_months')} total={total}>
              <input type="number" min="0" value={values.age_min_months} className={inputClass}
                onChange={(e) => set('age_min_months', e.target.value)} />
            </Row>
            <Row label="Oldest age" hint="Months. 60 = 5 years." blanks={blanksFor('age_max_months')} total={total}>
              <input type="number" min="0" value={values.age_max_months} className={inputClass}
                onChange={(e) => set('age_max_months', e.target.value)} />
            </Row>
          </div>

          {/* Ages are the field most likely to genuinely differ per listing, so
              say so at the point of entry rather than after the write. */}
          {(values.age_min_months || values.age_max_months) && total > 1 && (
            <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
              <AlertTriangle size={13} className="shrink-0 mt-px" />
              <span>
                Ages usually differ between listings. This only fills the ones with no
                age at all, but check they really are the same session.
              </span>
            </p>
          )}

          {/* The dry run, in words, before the button that commits it. */}
          <div className="rounded-xl border-2 border-gray-100 px-4 py-3 text-sm">
            {nothingSupplied ? (
              <span className="text-gray-400">Fill in a field above to see what would change.</span>
            ) : (
              <>
                <p className="font-bold text-dark">
                  {willWrite} of {total} listing{total === 1 ? '' : 's'} would change.
                </p>
                <p className="text-gray-500 text-xs mt-1">{summary}</p>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 pt-1 sticky bottom-0 bg-white pb-1">
            <button
              type="submit"
              disabled={busy || nothingSupplied}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {busy && <Loader2 size={15} className="animate-spin" />}
              {busy ? 'Filling...' : `Fill ${willWrite || ''} blank${willWrite === 1 ? '' : 's'}`.replace('  ', ' ')}
            </button>
            <button
              type="button" onClick={onClose} disabled={busy}
              className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </aside>

      {confirming && (
        <ConfirmModal
          title={`Fill blanks on ${willWrite} listing${willWrite === 1 ? '' : 's'}?`}
          message={`${summary}. Listings that already have a value are not changed. This cannot be undone.`}
          confirmLabel="Fill blanks"
          destructive={false}
          onConfirm={() => { setConfirming(false); onApply(values) }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  )
}

