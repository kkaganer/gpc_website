import { useEffect, useMemo, useReducer, useRef, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router'
import {
  ArrowLeft,
  Save,
  Copy,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Eye,
  Type as TypeIcon,
  Image as ImageIcon,
  MousePointerClick,
  Minus,
  Plus,
  Trash2,
  GripVertical,
  AlertTriangle,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '../../lib/supabase'
import {
  createRenderers,
  renderWhatsapp,
  DEFAULT_COLORS,
  nearestFriday,
} from '../../../supabase/functions/_shared/newsletter-renderer'
import { defaultConfig, uid } from '../../lib/newsletter/defaults'
import { resolveDataForConfig } from '../../lib/newsletter/resolveData'
import EventOverrideCard from '../../components/admin/newsletter/EventOverrideCard'
import AdvertiserOverrideCard from '../../components/admin/newsletter/AdvertiserOverrideCard'
import ConfirmModal from '../../components/ui/ConfirmModal'

// ---------- Reducer ----------

const initialState = {
  config: null, // NewsletterConfig — set on mount
  resolvedData: null,
  selectedBlockId: null, // or 'theme'
  focusRequest: null, // { blockId, itemId, field, timestamp } | null — set by click-in-preview
  dirty: false,
  loadingData: false,
  dataError: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_CONFIG':
      return { ...state, config: action.config, dirty: false, selectedBlockId: 'theme' }
    case 'UPDATE_THEME':
      return {
        ...state,
        dirty: true,
        config: {
          ...state.config,
          theme: { ...state.config.theme, ...action.theme },
        },
      }
    case 'RESET_THEME':
      return {
        ...state,
        dirty: true,
        config: { ...state.config, theme: {} },
      }
    case 'UPDATE_METADATA':
      return {
        ...state,
        dirty: true,
        config: {
          ...state.config,
          metadata: { ...state.config.metadata, ...action.metadata },
        },
      }
    case 'UPDATE_BLOCK':
      return {
        ...state,
        dirty: true,
        config: {
          ...state.config,
          blocks: state.config.blocks.map((b) =>
            b.id === action.blockId ? { ...b, ...action.patch } : b
          ),
        },
      }
    case 'TOGGLE_BLOCK':
      return {
        ...state,
        dirty: true,
        config: {
          ...state.config,
          blocks: state.config.blocks.map((b) =>
            b.id === action.blockId ? { ...b, enabled: !b.enabled } : b
          ),
        },
      }
    case 'UPDATE_OVERRIDE':
      // action: { blockId, itemId?, patch }
      // If itemId is present, update overrides[itemId] on the block.
      // Otherwise update the whole-block override bag.
      return {
        ...state,
        dirty: true,
        config: {
          ...state.config,
          blocks: state.config.blocks.map((b) => {
            if (b.id !== action.blockId) return b
            if (action.itemId) {
              const current = b.overrides || {}
              const existing = current[action.itemId] || {}
              const nextItem = { ...existing, ...action.patch }
              // If patch entries match source values (caller's responsibility), we still store them;
              // card UI should use RESET_OVERRIDE to clear fields cleanly.
              return {
                ...b,
                overrides: { ...current, [action.itemId]: nextItem },
              }
            }
            return {
              ...b,
              overrides: { ...(b.overrides || {}), ...action.patch },
            }
          }),
        },
      }
    case 'RESET_OVERRIDE':
      // action: { blockId, itemId?, fields? }
      // fields omitted → reset all
      return {
        ...state,
        dirty: true,
        config: {
          ...state.config,
          blocks: state.config.blocks.map((b) => {
            if (b.id !== action.blockId) return b
            if (action.itemId) {
              const current = { ...(b.overrides || {}) }
              if (!action.fields) {
                delete current[action.itemId]
              } else {
                const item = { ...(current[action.itemId] || {}) }
                for (const f of action.fields) delete item[f]
                if (Object.keys(item).length === 0) {
                  delete current[action.itemId]
                } else {
                  current[action.itemId] = item
                }
              }
              return { ...b, overrides: current }
            }
            if (!action.fields) {
              const { overrides, ...rest } = b
              return rest
            }
            const current = { ...(b.overrides || {}) }
            for (const f of action.fields) delete current[f]
            return { ...b, overrides: current }
          }),
        },
      }
    case 'REORDER_BLOCKS':
      return {
        ...state,
        dirty: true,
        config: { ...state.config, blocks: action.blocks },
      }
    case 'ADD_BLOCK':
      return {
        ...state,
        dirty: true,
        config: {
          ...state.config,
          blocks: [...state.config.blocks, action.block],
        },
        selectedBlockId: action.block.id,
      }
    case 'REMOVE_BLOCK':
      return {
        ...state,
        dirty: true,
        config: {
          ...state.config,
          blocks: state.config.blocks.filter((b) => b.id !== action.blockId),
        },
        selectedBlockId: state.selectedBlockId === action.blockId ? 'theme' : state.selectedBlockId,
      }
    case 'SELECT_BLOCK':
      return { ...state, selectedBlockId: action.blockId, focusRequest: null }
    case 'REQUEST_FOCUS':
      return {
        ...state,
        selectedBlockId: action.blockId,
        focusRequest: {
          blockId: action.blockId,
          itemId: action.itemId || null,
          field: action.field || null,
          timestamp: Date.now(),
        },
      }
    case 'SET_RESOLVED_DATA':
      return { ...state, resolvedData: action.resolvedData, loadingData: false, dataError: null }
    case 'SET_LOADING_DATA':
      return { ...state, loadingData: action.loading, dataError: null }
    case 'SET_DATA_ERROR':
      return { ...state, loadingData: false, dataError: action.error }
    case 'MARK_SAVED':
      return { ...state, dirty: false }
    default:
      return state
  }
}

// ---------- Block type metadata (for sidebar display) ----------

const BLOCK_LABELS = {
  masthead: 'Masthead',
  subscribe: 'Subscribe button',
  intro: 'Intro message',
  featured: 'Featured event',
  eventSection: 'Event list',
  presenting: 'Presenting sponsor',
  donationStrip: 'Donation bar',
  regulars: 'Regular activities',
  supporter: 'Supporter logos',
  editionCta: 'Button to the guide',
  footer: 'Footer',
  textBlock: 'Text block',
  imageBlock: 'Image block',
  ctaBlock: 'Call-to-action',
  divider: 'Divider',
}

function blockLabel(block) {
  if (block.type === 'eventSection') return block.title || 'Event list'
  return BLOCK_LABELS[block.type] || block.type
}

// ---------- Main component ----------

export default function NewsletterSectionEditor() {
  const { id: draftId } = useParams()
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(reducer, initialState)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [copied, setCopied] = useState(false)
  const iframeRef = useRef(null)

  useEffect(() => {
    document.title = 'Newsletter editor | GPC Admin'
  }, [])

  // Initial load: either fetch an existing draft or build a fresh default config
  useEffect(() => {
    let cancelled = false
    async function init() {
      if (draftId) {
        const { data, error } = await supabase
          .from('newsletter_drafts')
          .select('*')
          .eq('id', draftId)
          .single()
        if (cancelled) return
        if (error || !data) {
          setSaveError('Draft not found.')
          dispatch({ type: 'LOAD_CONFIG', config: defaultConfig(nearestFriday(new Date().toISOString().split('T')[0])) })
          return
        }
        if (data.content_json?.version === 2 && data.content_json.config) {
          dispatch({ type: 'LOAD_CONFIG', config: data.content_json.config })
        } else {
          // legacy draft — fall back to a fresh default config
          dispatch({
            type: 'LOAD_CONFIG',
            config: defaultConfig(data.week_of || nearestFriday(new Date().toISOString().split('T')[0])),
          })
        }
      } else {
        const todayIso = new Date().toISOString().split('T')[0]
        dispatch({ type: 'LOAD_CONFIG', config: defaultConfig(nearestFriday(todayIso)) })
      }
    }
    init()
    return () => {
      cancelled = true
    }
  }, [draftId])

  // Resolve data for the current config whenever it changes
  useEffect(() => {
    if (!state.config) return
    let cancelled = false
    dispatch({ type: 'SET_LOADING_DATA', loading: true })
    resolveDataForConfig(state.config)
      .then((resolvedData) => {
        if (cancelled) return
        dispatch({ type: 'SET_RESOLVED_DATA', resolvedData })
      })
      .catch((err) => {
        if (cancelled) return
        dispatch({ type: 'SET_DATA_ERROR', error: err.message || String(err) })
      })
    return () => {
      cancelled = true
    }
  }, [state.config])

  // Render HTML from config + data — two variants:
  //  - editHtml: used in the preview iframe. Has data-edit attributes + hover CSS.
  //  - cleanHtml: used for Save draft and Copy HTML. Byte-identical to what the
  //    edge function produces for the email output. No editor metadata.
  const editHtml = useMemo(() => {
    if (!state.config || !state.resolvedData) return ''
    const { renderNewsletter } = createRenderers(state.config.theme, {}, {}, { editMode: true })
    return renderNewsletter(state.config, state.resolvedData)
  }, [state.config, state.resolvedData])

  const cleanHtml = useMemo(() => {
    if (!state.config || !state.resolvedData) return ''
    const { renderNewsletter } = createRenderers(state.config.theme)
    return renderNewsletter(state.config, state.resolvedData)
  }, [state.config, state.resolvedData])

  // Write HTML to preview iframe + install click-to-edit listener
  useEffect(() => {
    if (!iframeRef.current || !editHtml) return
    const doc = iframeRef.current.contentDocument
    if (!doc) return
    doc.open()
    doc.write(editHtml)
    doc.close()

    function handleClick(e) {
      const el = e.target?.closest?.('[data-edit]')
      if (!el) return
      e.preventDefault()
      e.stopPropagation()
      const raw = el.getAttribute('data-edit') || ''
      const [blockId, itemId, field] = raw.split('|')
      if (!blockId) return
      dispatch({
        type: 'REQUEST_FOCUS',
        blockId,
        itemId: itemId || null,
        field: field || null,
      })
    }
    // Attach on both the document and the body for safety; closest() handles bubbling.
    doc.addEventListener('click', handleClick, true)
    return () => {
      try {
        doc.removeEventListener('click', handleClick, true)
      } catch {
        // ignore — iframe may have been torn down
      }
    }
  }, [editHtml])

  const handleSaveDraft = useCallback(async () => {
    if (!state.config) return
    setSaving(true)
    setSaveError('')
    try {
      const title = `GPC Newsletter - Week of ${state.config.metadata.weekOf}`
      // Regenerated on every save, not just at Generate. The WhatsApp message
      // names the week's highlights and carries the event count, so a draft that
      // was edited -- picks swapped, week changed -- used to be posted alongside a
      // message describing the version before the edit.
      const payload = {
        title,
        content_html: cleanHtml,
        whatsapp_text: renderWhatsapp(state.config, state.resolvedData),
        content_json: {
          version: 2,
          config: state.config,
          resolved_snapshot: state.resolvedData,
        },
        status: 'draft',
        week_of: state.config.metadata.weekOf,
      }
      if (draftId) {
        const { error } = await supabase
          .from('newsletter_drafts')
          .update(payload)
          .eq('id', draftId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('newsletter_drafts')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        dispatch({ type: 'MARK_SAVED' })
        navigate(`/admin/newsletter/editor/${data.id}`, { replace: true })
        return
      }
      dispatch({ type: 'MARK_SAVED' })
    } catch (err) {
      setSaveError(err?.message || 'Failed to save draft')
    } finally {
      setSaving(false)
    }
  }, [state.config, state.resolvedData, cleanHtml, draftId, navigate])

  const handleCopyHtml = useCallback(async () => {
    if (!cleanHtml) return
    try {
      await navigator.clipboard.writeText(cleanHtml)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setSaveError('Failed to copy HTML to clipboard')
    }
  }, [cleanHtml])

  const handleAddBlock = useCallback((type) => {
    const base = { id: uid(), type, enabled: true }
    let block
    switch (type) {
      case 'textBlock':
        block = { ...base, htmlContent: '<p>New text block</p>', align: 'left' }
        break
      case 'imageBlock':
        block = { ...base, imageUrl: '', align: 'center' }
        break
      case 'ctaBlock':
        block = { ...base, label: 'Learn more', url: '', align: 'center' }
        break
      case 'divider':
        block = { ...base, style: 'solid' }
        break
      case 'editionCta':
        block = { ...base }
        break
      default:
        return
    }
    dispatch({ type: 'ADD_BLOCK', block })
  }, [])

  if (!state.config) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const selectedBlock =
    state.selectedBlockId === 'theme'
      ? null
      : state.config.blocks.find((b) => b.id === state.selectedBlockId) || null

  return (
    <div className="h-[calc(100vh-4rem)] -m-8 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/newsletter')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-dark transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <h1 className="font-heading text-lg font-bold text-dark">Newsletter editor</h1>
          {state.dirty && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saveError && (
            <span className="text-xs text-red-600 mr-2">{saveError}</span>
          )}
          <button
            onClick={handleCopyHtml}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-dark border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
          >
            {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy HTML'}
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-dark text-white text-sm font-bold hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save draft'}
          </button>
        </div>
      </header>

      {/* Three-panel body */}
      <div className="flex-1 flex min-h-0">
        {/* Left: section sidebar */}
        <SectionSidebar
          config={state.config}
          resolvedData={state.resolvedData}
          selectedBlockId={state.selectedBlockId}
          onSelect={(blockId) => dispatch({ type: 'SELECT_BLOCK', blockId })}
          onToggle={(blockId) => dispatch({ type: 'TOGGLE_BLOCK', blockId })}
          onRemove={(blockId) => dispatch({ type: 'REMOVE_BLOCK', blockId })}
          onReorder={(blocks) => dispatch({ type: 'REORDER_BLOCKS', blocks })}
          onAddBlock={handleAddBlock}
        />

        {/* Middle: field editor */}
        <div className="w-96 border-r border-gray-200 overflow-y-auto bg-gray-50">
          {state.selectedBlockId === 'theme' ? (
            <ThemeEditor
              theme={state.config.theme}
              onChange={(patch) => dispatch({ type: 'UPDATE_THEME', theme: patch })}
              onReset={() => dispatch({ type: 'RESET_THEME' })}
            />
          ) : selectedBlock ? (
            <BlockFieldEditor
              block={selectedBlock}
              resolvedData={state.resolvedData}
              focusRequest={state.focusRequest}
              onChange={(patch) =>
                dispatch({ type: 'UPDATE_BLOCK', blockId: selectedBlock.id, patch })
              }
              onOverrideChange={(patch, itemId) =>
                dispatch({ type: 'UPDATE_OVERRIDE', blockId: selectedBlock.id, itemId, patch })
              }
              onOverrideReset={(itemId, fields) =>
                dispatch({ type: 'RESET_OVERRIDE', blockId: selectedBlock.id, itemId, fields })
              }
            />
          ) : (
            <div className="p-6 text-center text-gray-500 text-sm">
              Select a block on the left to edit it.
            </div>
          )}
        </div>

        {/* Right: live preview */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <div className="mx-auto max-w-[620px]">
            <div className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
              <Eye size={12} /> Live preview
              {state.loadingData && <span className="text-gray-400">· loading data…</span>}
              {state.dataError && <span className="text-red-500">· {state.dataError}</span>}
            </div>
            <iframe
              ref={iframeRef}
              title="Newsletter preview"
              className="w-full bg-white shadow-xl"
              style={{ minHeight: '80vh', border: 'none' }}
              sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- Section sidebar ----------

// What a block is worth in money, so the sidebar can say so before it is removed.
// Deleting or switching off a slot that somebody has paid for is the one mistake
// in this editor that cannot be fixed after the send.
function paidBooking(block, resolvedData) {
  if (!resolvedData) return null
  if (block.type === 'presenting') {
    const adv = resolvedData.autoAdvertiserByBlockId?.[block.id]
    return adv ? { count: 1, names: [adv.advertiser_name || 'an advertiser'] } : null
  }
  if (block.type === 'supporter') {
    const list = resolvedData.autoAdvertisersByBlockId?.[block.id] || []
    if (list.length === 0) return null
    return { count: list.length, names: list.map((a) => a.advertiser_name || 'an advertiser') }
  }
  return null
}

function SortableBlockRow({ block, selected, booking, onSelect, onToggle, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-1 pr-1 rounded-lg transition-colors ${
        selected ? 'bg-primary/10' : 'hover:bg-gray-50'
      } ${!block.enabled ? 'opacity-50' : ''}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${blockLabel(block)}`}
        className="flex-shrink-0 pl-1.5 py-2 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none focus:outline-none focus:ring-2 focus:ring-primary rounded"
      >
        <GripVertical size={14} />
      </button>
      <button
        type="button"
        onClick={() => onSelect(block.id)}
        className={`flex-1 min-w-0 flex items-center gap-1.5 py-2 text-sm text-left ${
          selected ? 'text-primary font-semibold' : 'text-gray-700'
        }`}
      >
        <span className="flex-1 truncate">{blockLabel(block)}</span>
        {booking && (
          <span
            title={`Paid: ${booking.names.join(', ')}`}
            className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800"
          >
            £{booking.count > 1 ? ` ${booking.count}` : ''}
          </span>
        )}
      </button>
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation()
          onToggle(block.id)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            e.stopPropagation()
            onToggle(block.id)
          }
        }}
        title={block.enabled ? 'Showing in this newsletter' : 'Hidden from this newsletter'}
        className={`flex-shrink-0 cursor-pointer text-[10px] px-1.5 py-0.5 rounded ${
          block.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {block.enabled ? 'ON' : 'OFF'}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(block)
        }}
        aria-label={`Remove ${blockLabel(block)}`}
        title="Remove this block"
        className="flex-shrink-0 p-1 rounded text-gray-300 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function SectionSidebar({
  config,
  resolvedData,
  selectedBlockId,
  onSelect,
  onToggle,
  onRemove,
  onReorder,
  onAddBlock,
}) {
  // A small activation distance so a click on the handle still selects rather
  // than starting a drag the moment the pointer moves a pixel. The keyboard
  // sensor is not decoration: reordering by mouse only would make the block order
  // unreachable without one, and it is the only way to test this without a real
  // pointer. Space picks a block up, arrows move it, Space drops it.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = config.blocks.findIndex((b) => b.id === active.id)
    const to = config.blocks.findIndex((b) => b.id === over.id)
    if (from === -1 || to === -1) return
    onReorder(arrayMove(config.blocks, from, to))
  }

  // Deliberately a confirm and not an undo: removing a block throws away every
  // per-item override typed into it, and there is nothing to restore it from.
  const [pendingRemoval, setPendingRemoval] = useState(null)
  const pendingBooking = pendingRemoval ? paidBooking(pendingRemoval, resolvedData) : null

  const paidBlocks = config.blocks
    .filter((b) => b.enabled === false && paidBooking(b, resolvedData))
    .map((b) => blockLabel(b))

  return (
    <aside className="w-64 border-r border-gray-200 bg-white overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-xs uppercase tracking-wider font-bold text-gray-500">Theme</h2>
        <button
          onClick={() => onSelect('theme')}
          className={`mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedBlockId === 'theme'
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Sparkles size={16} />
          Colours &amp; branding
        </button>
      </div>
      <div className="p-4 border-b border-gray-100 flex-1">
        <h2 className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Sections</h2>
        {paidBlocks.length > 0 && (
          <div className="mb-2 flex gap-2 items-start rounded-lg bg-amber-50 border border-amber-200 p-2 text-[11px] leading-snug text-amber-900">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              {paidBlocks.join(' and ')} {paidBlocks.length === 1 ? 'is' : 'are'} switched off, but
              somebody has paid for {paidBlocks.length === 1 ? 'that slot' : 'those slots'} this week.
            </span>
          </div>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={config.blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-0.5">
              {config.blocks.map((block) => (
                <SortableBlockRow
                  key={block.id}
                  block={block}
                  selected={selectedBlockId === block.id}
                  booking={paidBooking(block, resolvedData)}
                  onSelect={onSelect}
                  onToggle={onToggle}
                  onRemove={setPendingRemoval}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <p className="text-[11px] text-gray-400 mt-3 leading-snug">
          Drag the handle to reorder, or focus it and press space then the arrow keys. The email
          is one column, so this list is the order it arrives in.
        </p>
      </div>
      <div className="p-4 border-t border-gray-100">
        <h2 className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">Add block</h2>
        <div className="grid grid-cols-2 gap-2">
          <AddBlockButton icon={TypeIcon} label="Text" onClick={() => onAddBlock('textBlock')} />
          <AddBlockButton icon={ImageIcon} label="Image" onClick={() => onAddBlock('imageBlock')} />
          <AddBlockButton icon={MousePointerClick} label="Button" onClick={() => onAddBlock('ctaBlock')} />
          <AddBlockButton icon={Minus} label="Divider" onClick={() => onAddBlock('divider')} />
          <AddBlockButton
            icon={MousePointerClick}
            label="Guide button"
            onClick={() => onAddBlock('editionCta')}
          />
        </div>
      </div>
      {pendingRemoval && (
        <ConfirmModal
          title={`Remove ${blockLabel(pendingRemoval)}?`}
          message={
            pendingBooking
              ? `${
                  pendingBooking.count === 1
                    ? 'This slot is sold to'
                    : `${pendingBooking.count} paid logos sit in this block:`
                } ${pendingBooking.names.join(', ')}. Removing it takes them out of the edition they paid for. To hide it just for this week, use OFF instead.`
              : 'This takes the block out of the newsletter along with any wording you have changed inside it. To hide it without losing that, use OFF instead.'
          }
          confirmLabel="Remove"
          onConfirm={() => {
            onRemove(pendingRemoval.id)
            setPendingRemoval(null)
          }}
          onCancel={() => setPendingRemoval(null)}
        />
      )}
    </aside>
  )
}

function AddBlockButton({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-lg border border-dashed border-gray-300 hover:border-primary/50 hover:bg-primary/5 text-gray-600 hover:text-primary transition-colors"
    >
      <Icon size={16} />
      <span className="text-xs">{label}</span>
    </button>
  )
}

// ---------- Theme editor ----------

const THEME_LABELS = {
  pink: 'Brand pink (fills & rules)',
  pinkText: 'Pink text & links',
  dark: 'Headings & dark cards',
  page: 'Page background',
  card: 'Card background',
  body: 'Body text',
  muted: 'Meta text',
  hairline: 'Card borders',
  green: 'FREE badge',
  footer: 'Footer background',
}

function ThemeEditor({ theme, onChange, onReset }) {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="font-heading text-lg font-bold text-dark">Theme &amp; colours</h2>
        <p className="text-xs text-gray-500 mt-1">
          These changes only apply to this newsletter. Each new newsletter starts fresh from the defaults.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Brand pink is for fills and rules. It is 3.6:1 on white, so anything pink that
          has to be <em>read</em> uses the darker pink instead.
        </p>
      </div>
      <div className="space-y-3">
        {Object.entries(THEME_LABELS).map(([key, label]) => {
          const currentValue = theme[key] || DEFAULT_COLORS[key]
          return (
            <label key={key} className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-gray-700 flex-1">{label}</span>
              <input
                type="color"
                value={currentValue}
                onChange={(e) => onChange({ [key]: e.target.value })}
                className="h-8 w-12 rounded border border-gray-200 cursor-pointer"
              />
              <code className="text-xs text-gray-500 w-16">{currentValue}</code>
            </label>
          )
        })}
      </div>
      <button
        onClick={onReset}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-gray-300 transition-colors"
      >
        <RotateCcw size={14} />
        Reset to defaults
      </button>
    </div>
  )
}

// ---------- Block field editor (dispatcher) ----------

function BlockFieldEditor({ block, resolvedData, focusRequest, onChange, onOverrideChange, onOverrideReset }) {
  const label = blockLabel(block)
  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="font-heading text-lg font-bold text-dark">{label}</h2>
        <p className="text-xs text-gray-500 mt-1">
          Block type: <code className="bg-gray-100 px-1 rounded">{block.type}</code>
        </p>
      </div>
      <BlockFields
        block={block}
        resolvedData={resolvedData}
        focusRequest={focusRequest}
        onChange={onChange}
        onOverrideChange={onOverrideChange}
        onOverrideReset={onOverrideReset}
      />
    </div>
  )
}

function BlockFields({ block, resolvedData, focusRequest, onChange, onOverrideChange, onOverrideReset }) {
  // Only apply focus to this block if the request is for this block
  const activeFocus =
    focusRequest && focusRequest.blockId === block.id ? focusRequest : null
  // Lightweight inline field editors. More sophisticated editors can replace
  // these as Phase E lands.
  switch (block.type) {
    case 'intro':
      return (
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Intro message</span>
            <textarea
              value={block.message || ''}
              onChange={(e) => onChange({ message: e.target.value })}
              rows={5}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="Hey folks! Every week…"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Signature</span>
            <input
              type="text"
              value={block.signature || ''}
              onChange={(e) => onChange({ signature: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="- Aster"
            />
          </label>
        </div>
      )
    case 'masthead':
      return (
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Wordmark</span>
            <input
              type="text"
              value={block.wordmark || ''}
              onChange={(e) => onChange({ wordmark: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="What's On Guide"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Tagline</span>
            <input
              type="text"
              value={block.tagline || ''}
              onChange={(e) => onChange({ tagline: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Local events and activities for families"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Logo URL</span>
            <input
              type="url"
              value={block.logoUrl || ''}
              onChange={(e) => onChange({ logoUrl: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="https://…"
            />
          </label>
        </div>
      )
    case 'subscribe':
      return (
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Button label</span>
            <input
              type="text"
              value={block.label || ''}
              onChange={(e) => onChange({ label: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Subscribe"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Signup URL</span>
            <input
              type="url"
              value={block.url || ''}
              onChange={(e) => onChange({ url: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Leave blank to use default"
            />
          </label>
        </div>
      )
    case 'eventSection': {
      const all = resolvedData?.autoEventsByBlockId?.[block.id] || []
      const isPicks = block.layout === 'picks'
      const limit = Number.isInteger(block.limit) && block.limit > 0 ? block.limit : 0
      // Show exactly what will be printed, in order, so the numbers beside the
      // cards in the preview match the cards in this panel.
      const events = limit ? all.slice(0, limit) : all
      const hidden = all.length - events.length
      return (
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Section title</span>
            <input
              type="text"
              value={block.title || ''}
              onChange={(e) => onChange({ title: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-gray-700">Layout</span>
              <select
                value={block.layout || 'list'}
                onChange={(e) => onChange({ layout: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="picks">Picks card (numbered)</option>
                <option value="list">Full list (long form)</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-gray-700">Show at most</span>
              <input
                type="number"
                min="0"
                value={limit || ''}
                placeholder="All"
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10)
                  onChange({ limit: Number.isInteger(n) && n > 0 ? n : undefined })
                }}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </label>
          </div>
          <p className="text-[11px] text-gray-500 leading-snug">
            {isPicks
              ? 'The first pick gets its description; the rest are title and details only. Leave "show at most" blank to print every match.'
              : 'The long-form list, one paragraph per event. Blank means every match.'}
          </p>
          <div className="pt-2">
            <div className="text-xs font-semibold text-gray-700 mb-2">
              Events in this section ({events.length}
              {hidden > 0 ? ` of ${all.length}` : ''})
            </div>
            {hidden > 0 && (
              <div className="text-[11px] text-gray-500 bg-gray-100 rounded-lg p-2 mb-2 leading-snug">
                {hidden} more {hidden === 1 ? 'event matches' : 'events match'} this week and will
                not be printed. They are all on the guide the button links to.
              </div>
            )}
            {events.length === 0 ? (
              <div className="text-xs text-gray-500 bg-gray-100 rounded-lg p-3">
                No events match this section's filters for the current date range. Add events in <code className="bg-gray-200 px-1 rounded">/admin/whats-on</code> and they will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((ev) => (
                  <EventOverrideCard
                    key={ev.id}
                    source={ev}
                    override={block.overrides?.[ev.id]}
                    focusField={activeFocus && activeFocus.itemId === ev.id ? activeFocus.field : null}
                    focusTimestamp={activeFocus && activeFocus.itemId === ev.id ? activeFocus.timestamp : undefined}
                    onFieldChange={(field, value) =>
                      onOverrideChange({ [field]: value }, ev.id)
                    }
                    onFieldReset={(field) => onOverrideReset(ev.id, [field])}
                    onResetAll={() => onOverrideReset(ev.id)}
                    onToggleExclude={() =>
                      onOverrideChange(
                        { excluded: !block.overrides?.[ev.id]?.excluded },
                        ev.id
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )
    }
    case 'featured': {
      const featured = resolvedData?.autoFeaturedEvent
      if (!featured) {
        return (
          <div className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg p-3">
            No upcoming GPC event found. Add one in <code className="bg-amber-100 px-1 rounded">/admin/events</code> (date must be today or later).
          </div>
        )
      }
      return (
        <EventOverrideCard
          source={featured}
          override={block.overrides}
          focusField={activeFocus ? activeFocus.field : null}
          focusTimestamp={activeFocus ? activeFocus.timestamp : undefined}
          onFieldChange={(field, value) => onOverrideChange({ [field]: value })}
          onFieldReset={(field) => onOverrideReset(undefined, [field])}
          onResetAll={() => onOverrideReset()}
          onToggleExclude={() =>
            onOverrideChange({ excluded: !block.overrides?.excluded })
          }
        />
      )
    }
    case 'presenting': {
      const advertiser = resolvedData?.autoAdvertiserByBlockId?.[block.id]
      if (!advertiser) {
        return (
          <div className="text-xs text-gray-600 bg-gray-100 rounded-lg p-3 leading-relaxed">
            No <strong>Featured ad</strong> is booked for this week, so the slot prints GPC&rsquo;s
            own invitation at the same size &mdash; it is never a gap. Book one in{' '}
            <code className="bg-gray-200 px-1 rounded">/admin/newsletter-advertisers</code>.
          </div>
        )
      }
      return (
        <AdvertiserOverrideCard
          source={advertiser}
          override={block.overrides}
          focusField={activeFocus ? activeFocus.field : null}
          focusTimestamp={activeFocus ? activeFocus.timestamp : undefined}
          onFieldChange={(field, value) => onOverrideChange({ [field]: value })}
          onFieldReset={(field) => onOverrideReset(undefined, [field])}
          onResetAll={() => onOverrideReset()}
          variant="presenting"
        />
      )
    }
    case 'supporter': {
      // A list now, not a single advertiser: the block used to render exactly one
      // logo however many were booked for the week.
      const supporters = resolvedData?.autoAdvertisersByBlockId?.[block.id] || []
      return (
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Row heading</span>
            <input
              type="text"
              value={block.heading || ''}
              placeholder="Supported this week by"
              onChange={(e) => onChange({ heading: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </label>
          {supporters.length === 0 ? (
            <div className="text-xs text-gray-600 bg-gray-100 rounded-lg p-3 leading-relaxed">
              No <strong>Logo sponsor</strong> is booked for this week, so the whole row is left
              out of the email &mdash; heading, tiles and all.
            </div>
          ) : (
            <>
              <p className="text-[11px] text-gray-500 leading-snug">
                {supporters.length} {supporters.length === 1 ? 'logo' : 'logos'}, two to a row. An
                odd one at the end spans the full width rather than leaving a hole.
              </p>
              <div className="space-y-3">
                {supporters.map((adv) => (
                  <AdvertiserOverrideCard
                    key={adv.id}
                    source={adv}
                    override={block.overrides?.[adv.id]}
                    focusField={
                      activeFocus && activeFocus.itemId === adv.id ? activeFocus.field : null
                    }
                    focusTimestamp={
                      activeFocus && activeFocus.itemId === adv.id ? activeFocus.timestamp : undefined
                    }
                    onFieldChange={(field, value) => onOverrideChange({ [field]: value }, adv.id)}
                    onFieldReset={(field) => onOverrideReset(adv.id, [field])}
                    onResetAll={() => onOverrideReset(adv.id)}
                    variant="supporter"
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )
    }
    case 'editionCta': {
      const count = resolvedData?.editionEventCount ?? 0
      return (
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Button label</span>
            <input
              type="text"
              value={block.label || ''}
              placeholder="See all {count} events →"
              onChange={(e) => onChange({ label: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <span className="text-[11px] text-gray-500 mt-1 block leading-snug">
              <code className="bg-gray-100 px-1 rounded">{'{count}'}</code> is replaced with the
              number of things on this week&rsquo;s guide &mdash; currently <strong>{count}</strong>.
            </span>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Line underneath</span>
            <input
              type="text"
              value={block.note || ''}
              placeholder="Times, prices and booking links for every one of them."
              onChange={(e) => onChange({ note: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </label>
          <p className="text-[11px] text-gray-500 leading-snug">
            Links to the guide for this edition&rsquo;s week. This is the only filled button in
            the email &mdash; adding a second one costs the first its meaning.
          </p>
        </div>
      )
    }
    case 'regulars': {
      const regulars = resolvedData?.autoRegulars || []
      return (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-700">
            Recurring activities ({regulars.length})
          </div>
          {regulars.length === 0 ? (
            <div className="text-xs text-gray-500 bg-gray-100 rounded-lg p-3">
              No recurring events are marked in <code className="bg-gray-200 px-1 rounded">/admin/whats-on</code>. Tick "Recurring activity" on individual events there to populate this section.
            </div>
          ) : (
            <div className="space-y-3">
              {regulars.map((ev) => (
                <EventOverrideCard
                  key={ev.id}
                  source={ev}
                  override={block.overrides?.[ev.id]}
                  focusField={activeFocus && activeFocus.itemId === ev.id ? activeFocus.field : null}
                  focusTimestamp={activeFocus && activeFocus.itemId === ev.id ? activeFocus.timestamp : undefined}
                  onFieldChange={(field, value) =>
                    onOverrideChange({ [field]: value }, ev.id)
                  }
                  onFieldReset={(field) => onOverrideReset(ev.id, [field])}
                  onResetAll={() => onOverrideReset(ev.id)}
                  onToggleExclude={() =>
                    onOverrideChange(
                      { excluded: !block.overrides?.[ev.id]?.excluded },
                      ev.id
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>
      )
    }
    case 'donationStrip':
      return (
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Message</span>
            <input
              type="text"
              value={block.message || ''}
              onChange={(e) => onChange({ message: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="A big thank you to everyone who has bought us coffees!"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Link label</span>
            <input
              type="text"
              value={block.linkLabel || ''}
              onChange={(e) => onChange({ linkLabel: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="buy our volunteers a coffee"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Link URL</span>
            <input
              type="url"
              value={block.linkUrl || ''}
              onChange={(e) => onChange({ linkUrl: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Leave blank to use default"
            />
          </label>
        </div>
      )
    case 'textBlock':
      return (
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">HTML content</span>
            <textarea
              value={block.htmlContent || ''}
              onChange={(e) => onChange({ htmlContent: e.target.value })}
              rows={6}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              You can use <code>&lt;strong&gt;</code>, <code>&lt;em&gt;</code>, and <code>&lt;a href&gt;</code> tags.
              A full rich-text toolbar is coming in the next update.
            </p>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Alignment</span>
            <select
              value={block.align || 'left'}
              onChange={(e) => onChange({ align: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="left">Left</option>
              <option value="center">Centre</option>
            </select>
          </label>
        </div>
      )
    case 'imageBlock':
      return (
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Image URL</span>
            <input
              type="url"
              value={block.imageUrl || ''}
              onChange={(e) => onChange({ imageUrl: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="https://…"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Link URL (optional)</span>
            <input
              type="url"
              value={block.linkUrl || ''}
              onChange={(e) => onChange({ linkUrl: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Caption</span>
            <input
              type="text"
              value={block.caption || ''}
              onChange={(e) => onChange({ caption: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Width</span>
            <select
              value={block.align || 'center'}
              onChange={(e) => onChange({ align: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="center">Centred (400px)</option>
              <option value="full">Full width (560px)</option>
            </select>
          </label>
        </div>
      )
    case 'ctaBlock':
      return (
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Button label</span>
            <input
              type="text"
              value={block.label || ''}
              onChange={(e) => onChange({ label: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">URL</span>
            <input
              type="url"
              value={block.url || ''}
              onChange={(e) => onChange({ url: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-gray-700">Background</span>
              <input
                type="color"
                value={block.bgColor || DEFAULT_COLORS.blue}
                onChange={(e) => onChange({ bgColor: e.target.value })}
                className="mt-1 h-9 w-full rounded border border-gray-200 cursor-pointer"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-gray-700">Text</span>
              <input
                type="color"
                value={block.textColor || '#ffffff'}
                onChange={(e) => onChange({ textColor: e.target.value })}
                className="mt-1 h-9 w-full rounded border border-gray-200 cursor-pointer"
              />
            </label>
          </div>
        </div>
      )
    case 'divider':
      return (
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Style</span>
            <select
              value={block.style || 'solid'}
              onChange={(e) => onChange({ style: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="solid">Solid</option>
              <option value="dotted">Dotted</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Colour</span>
            <input
              type="color"
              value={block.color || DEFAULT_COLORS.muted}
              onChange={(e) => onChange({ color: e.target.value })}
              className="mt-1 h-9 w-full rounded border border-gray-200 cursor-pointer"
            />
          </label>
        </div>
      )
    default:
      return (
        <div className="text-xs text-gray-500 bg-gray-100 rounded-lg p-3">
          This block has no editable fields in the current release. It will use sensible
          defaults and pull data automatically. More controls are coming soon.
        </div>
      )
  }
}
