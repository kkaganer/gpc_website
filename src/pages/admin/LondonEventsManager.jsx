import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Plus, Check, X, Pencil, Trash2, Sparkles, MapPin, Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { geocodePostcode } from '../../lib/geocode'
import { useAllLondonEvents } from '../../hooks/useLondonEvents'
import { runIngest, pollBatch } from '../../hooks/useDiscoveredActivities'
import ConfirmModal from '../../components/ui/ConfirmModal'

// Index matches london_events.day_of_week (Sunday = 0), the convention
// migration 009 and the newsletter renderer both use.
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function LondonEventsManager() {
  const { events, loading, error, refetch } = useAllLondonEvents()
  const [tab, setTab] = useState('pending')
  const [selected, setSelected] = useState(() => new Set())
  const [confirmBulk, setConfirmBulk] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [discovering, setDiscovering] = useState(false)
  const [discoverError, setDiscoverError] = useState('')
  const [discoverResult, setDiscoverResult] = useState('')
  const [backfilling, setBackfilling] = useState(false)
  const [backfillResult, setBackfillResult] = useState('')
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailText, setEmailText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')
  const [parseResult, setParseResult] = useState(null)

  useEffect(() => {
    document.title = "What's On Manager | GPC Admin"
  }, [])

  // Selection is per-tab; clear it whenever the tab changes so ids don't leak across tabs.
  useEffect(() => {
    setSelected(new Set())
  }, [tab])

  const today = new Date().toISOString().split('T')[0]
  // Both tabs hide past one-off events to cut clutter; recurring events
  // (no single date, repeat weekly) always stay.
  const isCurrent = (e) => e.is_recurring || !e.date || e.date >= today
  const pending = events.filter((e) => !e.approved && isCurrent(e))
  const approved = events.filter((e) => e.approved && isCurrent(e))
  const displayed = tab === 'pending' ? pending : approved

  // Rows the parser skipped were NOT inserted, so unless they are listed in the
  // banner nobody ever learns the email mentioned them.
  const parseSkipped = parseResult?.skipped || []

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allSelected = displayed.length > 0 && displayed.every((e) => selected.has(e.id))

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(displayed.map((e) => e.id)))
  }

  async function bulkApprove() {
    const ids = [...selected]
    if (!ids.length) return
    await supabase.from('london_events').update({ approved: true }).in('id', ids)
    setSelected(new Set())
    refetch()
  }

  async function bulkDelete() {
    const ids = [...selected]
    if (!ids.length) return
    await supabase.from('london_events').delete().in('id', ids)
    setSelected(new Set())
    setConfirmBulk(false)
    refetch()
  }

  async function handleApprove(id) {
    await supabase.from('london_events').update({ approved: true }).eq('id', id)
    refetch()
  }

  async function handleReject(id) {
    await supabase.from('london_events').delete().eq('id', id)
    refetch()
  }

  async function handleDelete() {
    if (!deleting) return
    await supabase.from('london_events').delete().eq('id', deleting)
    setDeleting(null)
    refetch()
  }

  // Unified discovery. This used to invoke the Perplexity `discover-events`
  // function, which wrote straight into london_events as unapproved rows. It now
  // runs the same open-feed ingest as /admin/discovery, so there is ONE
  // discovery backend rather than two writing to different places.
  //
  // Results land in `activities` for review, not in this table — hence the
  // link through rather than a silent refetch.
  async function handleDiscover() {
    setDiscovering(true)
    setDiscoverError('')
    setDiscoverResult('')
    try {
      const { batch_id: batchId, sources_queued: queued } = await runIngest()
      setDiscoverResult(`Discovery started — 0/${queued} sources done...`)

      const final = await pollBatch(batchId, (s) => {
        setDiscoverResult(
          `Discovery running — ${s.sources_finished}/${s.total_sources} sources done, ` +
          `${s.inserted} new so far...`,
        )
      })

      if (final.status === 'timeout') {
        setDiscoverResult('Still running server-side — check Discovery in a minute.')
      } else if (final.status === 'failed') {
        setDiscoverError(`Discovery failed: ${final.error ?? 'unknown error'}`)
      } else {
        setDiscoverResult(
          `Found ${final.inserted} new activit${final.inserted === 1 ? 'y' : 'ies'} ` +
          `across ${final.sources_finished} sources` +
          (final.sources_failed ? `, ${final.sources_failed} failed` : '') +
          '. Review them under Discovery.',
        )
      }
    } catch (err) {
      setDiscoverError(`Discovery failed: ${err.message}`)
    } finally {
      setDiscovering(false)
    }
  }

  async function handleBackfill() {
    setBackfilling(true)
    setBackfillResult('')
    try {
      // Approved events missing coordinates but with something to geocode.
      const missing = events.filter(
        (e) => e.approved && (!e.lat || !e.lng) && (e.postcode || e.location)
      )
      let updated = 0
      // Run sequentially to be gentle on the free postcodes.io API.
      for (const e of missing) {
        const coords = await geocodePostcode(e.postcode || e.location)
        if (coords) {
          const { error: updateError } = await supabase
            .from('london_events')
            .update({ lat: coords.lat, lng: coords.lng })
            .eq('id', e.id)
          if (!updateError) updated++
        }
      }
      setBackfillResult(
        missing.length === 0
          ? 'All approved events already have map coordinates.'
          : `Updated ${updated} of ${missing.length} event${missing.length === 1 ? '' : 's'} missing coordinates.`
      )
      refetch()
    } catch {
      setBackfillResult('Backfill failed. Please try again.')
    } finally {
      setBackfilling(false)
    }
  }

  // Parse an email from a local organiser straight into this table as unapproved
  // rows, so the existing Pending tab below is the review step. Separate from
  // Discover Events — nothing here touches `activities`.
  async function handleParseEmail() {
    setParsing(true)
    setParseError('')
    setParseResult(null)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('parse-event-email', {
        body: { emailText },
      })
      // supabase-js throws on any non-2xx BEFORE reading the body, so fnError.message
      // is only ever the generic "non-2xx status code" and the function's own message
      // is discarded. The real response is stashed on fnError.context — read it there.
      if (fnError) {
        let detail = ''
        try {
          detail = (await fnError.context?.clone()?.json())?.error || ''
        } catch { /* body wasn't JSON */ }
        throw new Error(detail || fnError.message)
      }
      if (!data?.success) throw new Error(data?.error || 'Failed to parse email')
      setParseResult(data)
      setEmailText('')
      setShowEmailModal(false)
      // The new rows are unapproved, so send the admin where they actually landed.
      setTab('pending')
      refetch()
    } catch (err) {
      // Leave the modal open with the pasted text intact so a retry doesn't
      // mean re-copying the whole email.
      setParseError(err.message || 'Failed to parse email. Make sure the edge function is deployed.')
    } finally {
      setParsing(false)
    }
  }

  function formatDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Skipped rows come back exactly as the parser read them, so the date may be
  // missing or malformed — only format what really looks like an ISO date.
  function formatLooseDate(dateStr) {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr || '') ? formatDate(dateStr) : dateStr || ''
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-dark">What's On in London</h1>
          <p className="text-gray-500 text-sm mt-1">Manage London-wide family events</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleBackfill}
            disabled={backfilling}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Geocode approved events missing map coordinates from their postcode"
          >
            <MapPin size={18} />
            {backfilling ? 'Fixing...' : 'Fix Map Pins'}
          </button>
          <button
            onClick={handleDiscover}
            disabled={discovering}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-primary text-primary text-sm font-bold hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            <Sparkles size={18} />
            {discovering ? 'Discovering...' : 'Discover Events'}
          </button>
          <button
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-primary text-primary text-sm font-bold hover:bg-primary/5 transition-colors"
            title="Paste an email from an organiser and extract the event details into Pending"
          >
            <Mail size={18} />
            Parse Email
          </button>
          <Link
            to="/admin/whats-on/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-dark text-white text-sm font-bold hover:scale-[1.02] transition-transform"
          >
            <Plus size={18} />
            Add Manually
          </Link>
        </div>
      </div>

      {discoverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
          {discoverError}
        </div>
      )}

      {discoverResult && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3 mb-6">
          <span>{discoverResult}</span>
          <Link to="/admin/discovery" className="ml-auto font-bold underline whitespace-nowrap">
            Review discovered &rarr;
          </Link>
        </div>
      )}

      {backfillResult && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg px-4 py-3 mb-6">
          {backfillResult}
        </div>
      )}

      {parseResult && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3 mb-6">
          <div className="flex items-start gap-3">
            <span>
              Added {parseResult.inserted} event{parseResult.inserted === 1 ? '' : 's'} to Pending.
              {parseSkipped.length > 0 && ` ${parseSkipped.length} skipped:`}
            </span>
            <button
              onClick={() => setParseResult(null)}
              className="ml-auto font-bold text-green-600 hover:text-green-800 whitespace-nowrap"
            >
              Dismiss
            </button>
          </div>

          {parseSkipped.length > 0 && (
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {parseSkipped.map((s, i) => (
                <li key={i}>
                  <span className="font-semibold">{s.title || 'Untitled event'}</span>
                  {' — '}{s.reason}
                  {s.date && ` (${formatLooseDate(s.date)})`}
                </li>
              ))}
            </ul>
          )}

          {/* EVERY added event, not just the ones carrying warnings. Whether an
              event was read as a weekly regular or a one-off is the judgement
              most likely to be wrong, and it is the one thing the Pending table
              does not show (its columns are Event / Date / Area / Source). A
              summer fair misread as "every Saturday" would otherwise sit on
              What's On for ever with nothing anywhere saying so. */}
          {parseResult.events?.length > 0 && (
            <ul className="list-disc pl-5 mt-2 space-y-1 text-green-700">
              {parseResult.events.map((e, i) => (
                <li key={i}>
                  <span className="font-semibold">{e.title}</span>
                  {' — '}
                  {e.is_recurring
                    ? `every ${DAY_NAMES[e.day_of_week] ?? 'week'}, first listed ${formatLooseDate(e.date)}`
                    : `one-off on ${formatLooseDate(e.date)}`}
                  {e.warnings?.length > 0 && (
                    <span className="text-amber-700"> — {e.warnings.join('; ')}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
        <button
          onClick={() => setTab('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'pending' ? 'bg-white shadow-sm text-dark' : 'text-gray-500 hover:text-dark'
          }`}
        >
          Pending ({pending.length})
        </button>
        <button
          onClick={() => setTab('approved')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'approved' ? 'bg-white shadow-sm text-dark' : 'text-gray-500 hover:text-dark'
          }`}
        >
          Approved ({approved.length})
        </button>
      </div>

      {/* Bulk action toolbar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-white rounded-xl shadow-sm px-4 py-3 mb-4">
          <span className="text-sm font-semibold text-gray-600">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            {tab === 'pending' && (
              <button
                onClick={bulkApprove}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-colors"
              >
                <Check size={16} />
                Approve selected
              </button>
            )}
            <button
              onClick={() => setConfirmBulk(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors"
            >
              {tab === 'pending' ? <X size={16} /> : <Trash2 size={16} />}
              {tab === 'pending' ? 'Reject selected' : 'Delete selected'}
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {!loading && !error && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 w-px">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    aria-label="Select all events"
                  />
                </th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Event</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Date</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Area</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Source</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((event) => (
                <tr key={event.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selected.has(event.id)}
                      onChange={() => toggleSelect(event.id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      aria-label={`Select ${event.title}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-dark">{event.title}</p>
                    <p className="text-gray-400 text-xs">{event.location}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{formatDate(event.date)}</td>
                  <td className="px-6 py-4 text-gray-600">{event.area || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      event.source === 'perplexity' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {event.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!event.approved && (
                        <button
                          onClick={() => handleApprove(event.id)}
                          className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <Link
                        to={`/admin/whats-on/${event.id}/edit`}
                        className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </Link>
                      {tab === 'pending' ? (
                        <button
                          onClick={() => handleReject(event.id)}
                          className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          title="Reject"
                        >
                          <X size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setDeleting(event.id)}
                          className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    {tab === 'pending'
                      ? 'No pending events. Use "Discover Events" to find London events with AI.'
                      : 'No approved events yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {deleting && (
        <ConfirmModal
          title="Delete Event"
          message="Are you sure you want to remove this event?"
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      {confirmBulk && (
        <ConfirmModal
          title={tab === 'pending' ? 'Reject Events' : 'Delete Events'}
          message={`Are you sure you want to remove ${selected.size} event${selected.size === 1 ? '' : 's'}? This cannot be undone.`}
          onConfirm={bulkDelete}
          onCancel={() => setConfirmBulk(false)}
        />
      )}

      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop dismiss is disabled while parsing so an in-flight request isn't orphaned. */}
          <div className="absolute inset-0 bg-black/40" onClick={() => !parsing && setShowEmailModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full mx-4">
            <h3 className="font-heading font-bold text-lg text-dark">Parse Organiser Email</h3>
            <p className="text-gray-500 text-sm mt-1">
              Paste an email from an organiser and the details are extracted into the Pending tab
              for review before anything goes live.
            </p>

            {parseError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mt-4">
                {parseError}
              </div>
            )}

            <textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              rows={10}
              placeholder="Paste the email content here..."
              className="mt-4 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              disabled={parsing}
            />

            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={() => { setShowEmailModal(false); setEmailText(''); setParseError('') }}
                disabled={parsing}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-dark rounded-lg border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleParseEmail}
                disabled={parsing || !emailText.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-primary to-dark rounded-lg hover:scale-[1.02] transition-transform disabled:opacity-50"
              >
                <Sparkles size={16} />
                {parsing ? 'Parsing...' : 'Parse Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
