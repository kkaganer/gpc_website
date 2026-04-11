import { useRef, useEffect } from 'react'
import { RotateCcw } from 'lucide-react'
import EditableText from './EditableText'

/**
 * AdvertiserOverrideCard — edits a single advertiser for the Presenting or
 * Supporter block. Field set matches newsletter_advertisers rows.
 *
 * Props:
 *  - source: AdvertiserData — the unmodified DB row
 *  - override: Partial<AdvertiserData> | undefined
 *  - onFieldChange: (field, value) => void
 *  - onFieldReset: (field) => void
 *  - onResetAll: () => void
 *  - variant: 'presenting' | 'supporter'  (controls labels)
 *  - focusField: string | null — when set, the matching EditableText focuses
 *  - focusTimestamp: number — monotonic trigger
 */
export default function AdvertiserOverrideCard({
  source,
  override,
  onFieldChange,
  onFieldReset,
  onResetAll,
  variant = 'presenting',
  focusField,
  focusTimestamp,
}) {
  const cardRef = useRef(null)
  useEffect(() => {
    if (!focusField || !cardRef.current) return
    cardRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [focusField, focusTimestamp])
  const trigger = (field) => (focusField === field ? focusTimestamp : undefined)
  const ov = override || {}
  const merged = { ...source, ...ov }

  const isBrandSponsor = Boolean(merged.is_brand_sponsor)

  const anyDirty = Object.keys(ov).some((k) => ov[k] !== source[k])

  if (!source) {
    return (
      <div className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg p-3">
        No advertiser has been matched for this block. Add or confirm one in{' '}
        <code className="bg-amber-100 px-1 rounded">/admin/newsletter-advertisers</code>{' '}
        for the current newsletter date, then reopen this editor.
      </div>
    )
  }

  return (
    <div ref={cardRef} className="rounded-lg border border-gray-200 p-3 bg-white space-y-2">
      {/* Advertiser name */}
      <div>
        <Label>Advertiser name</Label>
        <EditableText
          value={ov.advertiser_name}
          defaultValue={source.advertiser_name}
          onChange={(v) => onFieldChange('advertiser_name', v)}
          onReset={() => onFieldReset('advertiser_name')}
          placeholder="Sponsor name"
          variant="single"
          style={{ fontSize: '15px', fontWeight: 'bold' }}
          focusTrigger={trigger('advertiser_name')}
        />
      </div>

      {/* Brand vs event mode toggle */}
      <label className="flex items-start gap-2 cursor-pointer bg-primary/5 border border-primary/20 rounded p-2">
        <input
          type="checkbox"
          checked={isBrandSponsor}
          onChange={(e) => onFieldChange('is_brand_sponsor', e.target.checked)}
          className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <span className="text-[11px] text-gray-700 leading-snug">
          <strong>Brand sponsor</strong> (no specific event)
        </span>
      </label>

      {/* Event title — only in event mode */}
      {!isBrandSponsor && (
        <div>
          <Label>Event title</Label>
          <EditableText
            value={ov.event_title}
            defaultValue={source.event_title}
            onChange={(v) => onFieldChange('event_title', v)}
            onReset={() => onFieldReset('event_title')}
            placeholder="e.g. Easter Music Party"
            variant="single"
            style={{ fontSize: '14px' }}
            focusTrigger={trigger('event_title')}
          />
        </div>
      )}

      {/* Description / tagline */}
      <div>
        <Label>{variant === 'supporter' ? 'Quote' : isBrandSponsor ? 'Tagline' : 'Event description'}</Label>
        <EditableText
          value={ov.event_description}
          defaultValue={source.event_description}
          onChange={(v) => onFieldChange('event_description', v)}
          onReset={() => onFieldReset('event_description')}
          placeholder={
            variant === 'supporter'
              ? 'A short quote or testimonial'
              : isBrandSponsor
                ? 'What the sponsor does'
                : 'Describe the event'
          }
          variant="multi"
          style={{ fontSize: '13px', lineHeight: '1.5' }}
          focusTrigger={trigger('event_description')}
        />
      </div>

      {/* URL */}
      <div>
        <Label>{isBrandSponsor ? 'Website URL' : 'Event URL'}</Label>
        <EditableText
          value={ov.event_url}
          defaultValue={source.event_url}
          onChange={(v) => onFieldChange('event_url', v)}
          onReset={() => onFieldReset('event_url')}
          placeholder="https://…"
          variant="single"
          style={{ fontSize: '12px', color: '#0092ff' }}
          focusTrigger={trigger('event_url')}
        />
      </div>

      {/* Contact email — supporter only */}
      {variant === 'supporter' && (
        <div>
          <Label>Contact email</Label>
          <EditableText
            value={ov.contact_email}
            defaultValue={source.contact_email}
            onChange={(v) => onFieldChange('contact_email', v)}
            onReset={() => onFieldReset('contact_email')}
            placeholder="email@example.com"
            variant="single"
            style={{ fontSize: '12px', color: '#6b6b7d' }}
            focusTrigger={trigger('contact_email')}
          />
        </div>
      )}

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
