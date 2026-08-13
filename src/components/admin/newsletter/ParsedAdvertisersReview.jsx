import { useId, useState } from 'react'
import { AlertTriangle, AlertCircle, Copy, ChevronDown, ChevronRight } from 'lucide-react'

/**
 * ParsedAdvertisersReview — the editable review step between LLM extraction and
 * the INSERT into newsletter_advertisers. Nothing reaches the table until an
 * admin has seen it here, so every entry the edge function returns is shown,
 * including the broken ones.
 *
 * Props:
 *  - entries: ParsedEntry[] — straight from parse-advertiser-email. Each has the
 *    advertiser columns plus warnings: string[], missing: string[] and
 *    duplicate_of: { id, status, ad_type } | null.
 *  - onCancel: () => void
 *  - onConfirm: (rows) => void — receives ONLY the included rows, each shaped
 *    exactly for a newsletter_advertisers insert (the ten columns below, empty
 *    strings converted to null). No review-only keys leak into the payload.
 *  - inserting: boolean — parent is mid-insert; every control is disabled.
 *  - error: string — insert error from the parent, rendered when non-empty.
 *
 * The component owns its own editable copy of the rows; the parent holds no
 * per-row state. State is seeded from `entries` once, on mount.
 */

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

// 'pending', deliberately. `status` tracks the BOOKING pipeline — Pending ->
// Confirmed -> Included -> Completed — not whether this extraction was reviewed.
// An advertiser emailing to ask for a slot has not thereby confirmed a booking,
// so auto-setting 'confirmed' would assert a commercial fact the email does not
// establish, and push unconfirmed ads into a newsletter. Ticking a row here means
// "this extraction is correct", which is a different claim.
// The per-row Status select is right there when the email genuinely does confirm.
const DEFAULT_STATUS = 'pending'

// newsletter_date, advertiser_name and event_title are all NOT NULL, so a row
// missing any of them cannot be inserted at all.
const REQUIRED_FIELDS = ['advertiser_name', 'event_title', 'newsletter_date']

const FIELD_LABELS = {
  advertiser_name: 'Advertiser Name',
  event_title: 'Event Title',
  newsletter_date: 'Newsletter Date',
  contact_email: 'Contact Email',
  event_description: 'Event Description',
  event_url: 'Event URL',
  image_url: 'Image / Logo URL',
  notes: 'Notes',
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function parseIsoDate(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

/** "Tue 18 Aug" — the same shorthand the warnings from the edge function use. */
function formatDayLabel(iso) {
  const d = parseIsoDate(iso)
  if (!d) return iso || ''
  const month = d.toLocaleDateString('en-GB', { month: 'short' })
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${month}`
}

function isFriday(iso) {
  const d = parseIsoDate(iso)
  return d ? d.getDay() === 5 : false
}

function str(value) {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

/** Empty string / whitespace becomes null so we never write '' into a text column. */
function toNull(value) {
  const trimmed = str(value).trim()
  return trimmed === '' ? null : trimmed
}

function seedRow(entry, index) {
  const missing = Array.isArray(entry?.missing) ? entry.missing : []
  const warnings = Array.isArray(entry?.warnings) ? entry.warnings : []
  const duplicateOf = entry?.duplicate_of || null
  return {
    key: `parsed-${index}`,
    // Duplicates and incomplete rows start unticked so re-parsing an email
    // thread is safe and nothing half-extracted slips in unnoticed.
    included: !duplicateOf && missing.length === 0,
    expanded: false,
    advertiser_name: str(entry?.advertiser_name),
    contact_email: str(entry?.contact_email),
    event_title: str(entry?.event_title),
    event_description: str(entry?.event_description),
    event_url: str(entry?.event_url),
    image_url: str(entry?.image_url),
    ad_type: entry?.ad_type || 'free-listing',
    newsletter_date: str(entry?.newsletter_date),
    status: DEFAULT_STATUS,
    notes: str(entry?.notes),
    warnings,
    missing,
    duplicate_of: duplicateOf,
  }
}

/** Required fields still blank after the admin's edits — blocks inclusion. */
function emptyRequired(row) {
  return REQUIRED_FIELDS.filter((field) => str(row[field]).trim() === '')
}

/** The ten insert columns, in the order the contract lists them. */
function toInsertRow(row) {
  return {
    advertiser_name: toNull(row.advertiser_name),
    contact_email: toNull(row.contact_email),
    event_title: toNull(row.event_title),
    event_description: toNull(row.event_description),
    event_url: toNull(row.event_url),
    image_url: toNull(row.image_url),
    ad_type: row.ad_type,
    newsletter_date: toNull(row.newsletter_date),
    status: row.status,
    notes: toNull(row.notes),
  }
}

export default function ParsedAdvertisersReview({
  entries = [],
  onCancel,
  onConfirm,
  inserting = false,
  error = '',
}) {
  const [rows, setRows] = useState(() => entries.map(seedRow))

  function setField(key, field, value) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)))
  }

  // A row can only be included once its required fields are filled in.
  const includable = (row) => emptyRequired(row).length === 0
  const isIncluded = (row) => row.included && includable(row)

  const selected = rows.filter(isIncluded)
  const duplicateCount = rows.filter((r) => r.duplicate_of).length
  const attentionCount = rows.filter(
    // Live state only — see the note on `flagged` below. Counting r.missing here
    // kept the header saying "needs attention" for rows the admin had just fixed.
    (r) => emptyRequired(r).length > 0 || !isFriday(r.newsletter_date)
  ).length

  const selectableRows = rows.filter(includable)
  const allSelected = selectableRows.length > 0 && selectableRows.every((r) => r.included)

  function toggleAll() {
    const next = !allSelected
    setRows((prev) => prev.map((r) => (includable(r) ? { ...r, included: next } : r)))
  }

  function handleConfirm() {
    onConfirm(rows.filter(isIncluded).map(toInsertRow))
  }

  const counts = [
    `${rows.length} found`,
    `${selected.length} selected`,
    duplicateCount > 0 && `${duplicateCount} duplicate${duplicateCount === 1 ? '' : 's'}`,
    attentionCount > 0 && `${attentionCount} needs attention`,
  ].filter(Boolean)

  if (rows.length === 0) {
    return (
      <div>
        <p className="text-gray-500 text-sm">
          No advertiser entries were found in that email. Try pasting the full message, including
          the event details.
        </p>
        <div className="flex justify-end pt-5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-dark rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header — counts and the bulk toggle */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <h4 className="font-heading font-bold text-base text-dark">Review parsed entries</h4>
          <p className="text-gray-500 text-sm mt-0.5">{counts.join(' · ')}</p>
        </div>
        <button
          type="button"
          onClick={toggleAll}
          disabled={inserting || selectableRows.length === 0}
          className="text-sm font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline"
        >
          {allSelected ? 'Clear selection' : 'Select all'}
        </button>
      </div>

      <p className="text-gray-500 text-xs mt-2">
        Nothing is saved until you press Add. Edit anything that looks wrong — these values go
        straight into the advertiser table.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mt-4">
          {error}
        </div>
      )}

      <ul className="space-y-3 mt-4">
        {rows.map((row) => (
          <ParsedRow
            key={row.key}
            row={row}
            included={isIncluded(row)}
            includable={includable(row)}
            inserting={inserting}
            onFieldChange={(field, value) => setField(row.key, field, value)}
          />
        ))}
      </ul>

      {/* Footer */}
      <div className="flex flex-wrap gap-3 justify-end items-center pt-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={inserting}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-dark rounded-lg border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={inserting || selected.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-primary to-dark rounded-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
        >
          {inserting && (
            <span
              aria-hidden="true"
              className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"
            />
          )}
          {inserting
            ? 'Adding…'
            : `Add ${selected.length} advertiser${selected.length === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  )
}

/**
 * One parsed entry. Primary fields are always visible so the list stays
 * scannable; everything else sits behind the "More details" disclosure.
 */
function ParsedRow({ row, included, includable, inserting, onFieldChange }) {
  const uid = useId()
  const detailsId = `${uid}-details`
  const emptyFields = emptyRequired(row)
  // The model's `missing` plus anything the admin has since blanked out.
  // Live emptiness ONLY. `row.missing` is a parse-time snapshot of what the model
  // could not fill and is never revised, so unioning it here kept a field flagged
  // red and aria-invalid after the admin had typed the value in — telling them the
  // row was unaddable at the exact moment it became addable. It still seeds the
  // initial ticked state in seedRow; nothing else should read it.
  const flagged = emptyFields
  const isFlagged = (field) => flagged.includes(field)
  const dateSet = str(row.newsletter_date).trim() !== ''
  const badFriday = dateSet && !isFriday(row.newsletter_date)

  return (
    <li
      className={`rounded-xl border p-4 transition-colors ${
        included ? 'border-primary/30 bg-white' : 'border-gray-200 bg-gray-50/70'
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={included}
          disabled={!includable || inserting}
          onChange={(e) => onFieldChange('included', e.target.checked)}
          aria-label={`Add ${row.advertiser_name || 'this untitled entry'} to the advertiser list`}
          aria-describedby={flagged.length > 0 ? `${uid}-missing` : undefined}
          className="mt-1.5 w-4 h-4 shrink-0 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-40"
        />

        <div className="flex-1 min-w-0">
          {/* Flags — every one pairs an icon and words with its colour */}
          {(row.duplicate_of || flagged.length > 0 || badFriday || row.warnings.length > 0) && (
            <div className="space-y-1.5 mb-3">
              {row.duplicate_of && (
                <p className="flex items-start gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                  <Copy size={13} className="mt-px shrink-0" aria-hidden="true" />
                  <span>
                    Looks like an existing entry (status: {row.duplicate_of.status}
                    {row.duplicate_of.ad_type ? `, ${row.duplicate_of.ad_type}` : ''}). Leave it
                    unticked unless this is a genuine re-booking.
                  </span>
                </p>
              )}

              {flagged.length > 0 && (
                <p
                  id={`${uid}-missing`}
                  className="flex items-start gap-1.5 text-xs font-semibold text-red-700"
                >
                  <AlertCircle size={13} className="mt-px shrink-0" aria-hidden="true" />
                  <span>
                    Needs {flagged.map((f) => FIELD_LABELS[f] || f).join(', ')} before this entry
                    can be added.
                  </span>
                </p>
              )}

              {badFriday && (
                <p className="flex items-start gap-1.5 text-xs font-semibold text-amber-700">
                  <AlertTriangle size={13} className="mt-px shrink-0" aria-hidden="true" />
                  <span>
                    {formatDayLabel(row.newsletter_date)} is not a Friday — this advertiser will
                    not appear in any newsletter.
                  </span>
                </p>
              )}

              {row.warnings.map((warning, i) => (
                <p
                  key={i}
                  className="flex items-start gap-1.5 text-xs text-amber-600/90"
                >
                  <AlertTriangle size={13} className="mt-px shrink-0" aria-hidden="true" />
                  <span>{warning}</span>
                </p>
              ))}
            </div>
          )}

          {/* Primary fields — always visible */}
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            <label className="block sm:col-span-3">
              <Label>Advertiser Name *</Label>
              <input
                type="text"
                value={row.advertiser_name}
                onChange={(e) => onFieldChange('advertiser_name', e.target.value)}
                disabled={inserting}
                aria-invalid={isFlagged('advertiser_name') || undefined}
                placeholder="e.g. Boppin' Bunnies"
                className={inputClass(isFlagged('advertiser_name'))}
              />
            </label>
            <label className="block sm:col-span-3">
              <Label>Event Title *</Label>
              <input
                type="text"
                value={row.event_title}
                onChange={(e) => onFieldChange('event_title', e.target.value)}
                disabled={inserting}
                aria-invalid={isFlagged('event_title') || undefined}
                placeholder="e.g. Easter Music Party"
                className={inputClass(isFlagged('event_title'))}
              />
            </label>
            <label className="block sm:col-span-2">
              <Label>Newsletter Date *</Label>
              <input
                type="date"
                value={row.newsletter_date}
                onChange={(e) => onFieldChange('newsletter_date', e.target.value)}
                disabled={inserting}
                aria-invalid={isFlagged('newsletter_date') || badFriday || undefined}
                className={inputClass(isFlagged('newsletter_date'), badFriday)}
              />
              {dateSet && (
                <span
                  className={`block text-[11px] mt-1 ${
                    badFriday ? 'text-amber-700 font-semibold' : 'text-gray-400'
                  }`}
                >
                  {formatDayLabel(row.newsletter_date)}
                  {badFriday ? ' — not a Friday' : ''}
                </span>
              )}
            </label>
            <label className="block sm:col-span-2">
              <Label>Ad Type</Label>
              <select
                value={row.ad_type}
                onChange={(e) => onFieldChange('ad_type', e.target.value)}
                disabled={inserting}
                className={`${inputClass(false)} bg-white`}
              >
                {adTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <Label>Status</Label>
              <select
                value={row.status}
                onChange={(e) => onFieldChange('status', e.target.value)}
                disabled={inserting}
                className={`${inputClass(false)} bg-white`}
              >
                {statuses.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Secondary fields — collapsed so the list stays scannable */}
          <button
            type="button"
            onClick={() => onFieldChange('expanded', !row.expanded)}
            aria-expanded={row.expanded}
            aria-controls={detailsId}
            className="flex items-center gap-1 mt-3 text-xs font-medium text-gray-500 hover:text-primary transition-colors"
          >
            {row.expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            More details
          </button>

          {row.expanded && (
            <div id={detailsId} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <label className="block">
                <Label>Contact Email</Label>
                <input
                  type="email"
                  value={row.contact_email}
                  onChange={(e) => onFieldChange('contact_email', e.target.value)}
                  disabled={inserting}
                  placeholder="email@example.com"
                  className={inputClass(false)}
                />
              </label>
              <label className="block">
                <Label>Event URL</Label>
                <input
                  type="url"
                  value={row.event_url}
                  onChange={(e) => onFieldChange('event_url', e.target.value)}
                  disabled={inserting}
                  placeholder="https://…"
                  className={inputClass(false)}
                />
              </label>
              <label className="block sm:col-span-2">
                <Label>Image / Logo URL</Label>
                <input
                  type="url"
                  value={row.image_url}
                  onChange={(e) => onFieldChange('image_url', e.target.value)}
                  disabled={inserting}
                  placeholder="https://…"
                  className={inputClass(false)}
                />
                <span className="block text-[11px] text-gray-400 mt-1">
                  Shown in the newsletter&rsquo;s Presenting or Supporter block.
                </span>
              </label>
              <label className="block sm:col-span-2">
                <Label>Event Description</Label>
                <textarea
                  value={row.event_description}
                  onChange={(e) => onFieldChange('event_description', e.target.value)}
                  disabled={inserting}
                  rows={3}
                  placeholder="Details to include in the newsletter"
                  className={`${inputClass(false)} resize-none`}
                />
              </label>
              <label className="block sm:col-span-2">
                <Label>Notes</Label>
                <textarea
                  value={row.notes}
                  onChange={(e) => onFieldChange('notes', e.target.value)}
                  disabled={inserting}
                  rows={2}
                  placeholder="Internal notes (not included in newsletter)"
                  className={`${inputClass(false)} resize-none`}
                />
              </label>
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

function inputClass(invalid, warn = false) {
  const border = invalid
    ? 'border-red-300 bg-red-50/50 focus:ring-red-400/50'
    : warn
      ? 'border-amber-300 bg-amber-50/40 focus:ring-amber-400/50'
      : 'border-gray-200 focus:ring-primary/50'
  return `mt-1 w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 disabled:opacity-60 ${border}`
}

function Label({ children }) {
  return (
    <span className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
      {children}
    </span>
  )
}
