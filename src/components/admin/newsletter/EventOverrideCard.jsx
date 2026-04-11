import { useRef, useEffect } from 'react'
import { EyeOff, Eye, RotateCcw } from 'lucide-react'
import EditableText from './EditableText'

/**
 * EventOverrideCard — displays a single event from the resolved data with
 * every text field replaceable. Edits become overrides in the enclosing block.
 *
 * Props:
 *  - source: EventData — the unmodified DB row
 *  - override: Partial<EventData> | undefined
 *  - onFieldChange: (field, value) => void
 *  - onFieldReset: (field) => void
 *  - onResetAll: () => void
 *  - onToggleExclude: () => void
 *  - focusField: string | null — when set, the matching EditableText focuses
 *    and the card scrolls into view.
 *  - focusTimestamp: number — monotonic trigger so repeated clicks on the
 *    same field refocus.
 */
export default function EventOverrideCard({
  source,
  override,
  onFieldChange,
  onFieldReset,
  onResetAll,
  onToggleExclude,
  focusField,
  focusTimestamp,
}) {
  const cardRef = useRef(null)
  // Scroll the whole card into view when focus is requested
  useEffect(() => {
    if (!focusField || !cardRef.current) return
    cardRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [focusField, focusTimestamp])

  const trigger = (field) => (focusField === field ? focusTimestamp : undefined)
  const ov = override || {}
  const excluded = Boolean(ov.excluded)

  const get = (field) => (ov[field] !== undefined ? ov[field] : source[field] ?? '')
  const isDirty = (field) => ov[field] !== undefined && ov[field] !== source[field]

  const anyDirty = Object.keys(ov).some((k) => k !== 'excluded' && ov[k] !== source[k])

  return (
    <div
      ref={cardRef}
      className={`rounded-lg border p-3 bg-white transition-opacity ${
        excluded ? 'opacity-50 border-gray-200' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          {/* Title — main heading, large bold */}
          <EditableText
            value={ov.title}
            defaultValue={source.title}
            onChange={(v) => onFieldChange('title', v)}
            onReset={() => onFieldReset('title')}
            placeholder="Event title"
            variant="single"
            style={{ fontSize: '15px', fontWeight: 'bold', lineHeight: '1.3' }}
            focusTrigger={trigger('title')}
          />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleExclude}
            title={excluded ? 'Include in this newsletter' : 'Exclude from this newsletter'}
            className={`p-1.5 rounded transition-colors ${
              excluded
                ? 'text-gray-400 hover:text-primary bg-gray-50'
                : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
            }`}
          >
            {excluded ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        </div>
      </div>

      {/* Venue — inline smaller */}
      {(source.venue || ov.venue !== undefined) && (
        <div className="mb-1.5">
          <EditableText
            value={ov.venue}
            defaultValue={source.venue}
            onChange={(v) => onFieldChange('venue', v)}
            onReset={() => onFieldReset('venue')}
            placeholder="Venue (optional)"
            variant="single"
            style={{ fontSize: '13px', color: '#6b6b7d' }}
            focusTrigger={trigger('venue')}
          />
        </div>
      )}

      {/* Date / time / age / location — each one in a compact input */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 mb-1.5">
        <div>
          <Label>Date</Label>
          <EditableText
            value={ov.date}
            defaultValue={source.date}
            onChange={(v) => onFieldChange('date', v)}
            onReset={() => onFieldReset('date')}
            placeholder="YYYY-MM-DD"
            variant="single"
            style={{ fontSize: '12px', color: '#6b6b7d' }}
            focusTrigger={trigger('date')}
          />
        </div>
        <div>
          <Label>Time</Label>
          <EditableText
            value={ov.time}
            defaultValue={source.time}
            onChange={(v) => onFieldChange('time', v)}
            onReset={() => onFieldReset('time')}
            placeholder="e.g. 10am"
            variant="single"
            style={{ fontSize: '12px', color: '#6b6b7d' }}
            focusTrigger={trigger('time')}
          />
        </div>
        <div>
          <Label>Age</Label>
          <EditableText
            value={ov.age_range}
            defaultValue={source.age_range}
            onChange={(v) => onFieldChange('age_range', v)}
            onReset={() => onFieldReset('age_range')}
            placeholder="e.g. 0-5"
            variant="single"
            style={{ fontSize: '12px', color: '#6b6b7d' }}
            focusTrigger={trigger('age_range')}
          />
        </div>
        <div>
          <Label>Price</Label>
          <EditableText
            value={ov.price}
            defaultValue={source.price}
            onChange={(v) => onFieldChange('price', v)}
            onReset={() => onFieldReset('price')}
            placeholder={source.is_free ? 'FREE' : 'e.g. £5'}
            variant="single"
            style={{ fontSize: '12px', color: '#6b6b7d' }}
            focusTrigger={trigger('price')}
          />
        </div>
        <div className="col-span-2">
          <Label>Location</Label>
          <EditableText
            value={ov.location}
            defaultValue={source.location}
            onChange={(v) => onFieldChange('location', v)}
            onReset={() => onFieldReset('location')}
            placeholder="e.g. SE10 9NF"
            variant="single"
            style={{ fontSize: '12px', color: '#6b6b7d' }}
            focusTrigger={trigger('location')}
          />
        </div>
      </div>

      {/* Description — multi-line */}
      <div className="mb-1.5">
        <Label>Description</Label>
        <EditableText
          value={ov.description}
          defaultValue={source.description}
          onChange={(v) => onFieldChange('description', v)}
          onReset={() => onFieldReset('description')}
          placeholder="Short description of the event"
          variant="multi"
          style={{ fontSize: '13px', lineHeight: '1.5' }}
          focusTrigger={trigger('description')}
        />
      </div>

      {/* URL */}
      <div>
        <Label>Info link (URL)</Label>
        <EditableText
          value={ov.url}
          defaultValue={source.url}
          onChange={(v) => onFieldChange('url', v)}
          onReset={() => onFieldReset('url')}
          placeholder="https://…"
          variant="single"
          style={{ fontSize: '12px', color: '#0092ff' }}
          focusTrigger={trigger('url')}
        />
      </div>

      {anyDirty && (
        <button
          type="button"
          onClick={onResetAll}
          className="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors"
        >
          <RotateCcw size={11} />
          Reset all fields
        </button>
      )}
    </div>
  )
}

function Label({ children }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
      {children}
    </div>
  )
}
