import { useState, useEffect } from 'react'
import { Check, X, Radar, Repeat, AlertTriangle, ExternalLink, MapPin } from 'lucide-react'
import {
  useDiscoveredActivities,
  publishActivity,
  rejectActivity,
  runIngest,
  backfillCoordinates,
} from '../../hooks/useDiscoveredActivities'

/**
 * Review queue for auto-discovered activities.
 *
 * Deliberately separate from LondonEventsManager: this reviews ACTIVITIES (the
 * rich model — age in months, recurrence, term-time, provenance), and approving
 * one projects it into `london_events`, which is what the public site, map and
 * newsletter already read. Nothing reaches the site without a click here.
 */
export default function DiscoveryManager() {
  const [tab, setTab] = useState('pending')
  const { activities, loading, error, refetch } = useDiscoveredActivities(tab)
  const [selected, setSelected] = useState(() => new Set())
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    document.title = 'Discovered Activities | GPC Admin'
  }, [])

  useEffect(() => { setSelected(new Set()) }, [tab])

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const allSelected = activities.length > 0 && activities.every((a) => selected.has(a.id))

  async function handleBulk(action) {
    setBusy(true)
    setMessage('')
    let ok = 0
    const failures = []
    for (const id of selected) {
      try {
        if (action === 'approve') await publishActivity(id)
        else await rejectActivity(id)
        ok++
      } catch (err) {
        failures.push(err.message)
      }
    }
    setSelected(new Set())
    // Report failures rather than silently showing a success count.
    setMessage(
      failures.length
        ? `${ok} ${action}d, ${failures.length} failed: ${failures[0]}`
        : `${ok} activit${ok === 1 ? 'y' : 'ies'} ${action}d.`,
    )
    setBusy(false)
    refetch()
  }

  async function handleGeocode() {
    setBusy(true)
    setMessage('')
    try {
      const r = await backfillCoordinates()
      setMessage(
        `Fixed ${r?.fixed ?? 0} map pin${r?.fixed === 1 ? '' : 's'}. ` +
        `${r?.still_missing ?? 0} still missing coordinates, ` +
        `${r?.no_postcode ?? 0} have no postcode to geocode from.`,
      )
    } catch (err) {
      setMessage(`Geocoding failed: ${err.message}`)
    }
    setBusy(false)
    refetch()
  }

  async function handleIngest() {
    setBusy(true)
    setMessage('')
    try {
      const result = await runIngest()
      const total = (result?.results ?? []).reduce((n, r) => n + (r.inserted ?? 0), 0)
      const failed = (result?.results ?? []).filter((r) => r.ok === false)
      setMessage(
        `Ingest finished in ${Math.round((result?.elapsed_ms ?? 0) / 1000)}s — ` +
        `${total} new activit${total === 1 ? 'y' : 'ies'} across ${result?.sources_run ?? 0} sources.` +
        (failed.length ? ` ${failed.length} source(s) failed.` : ''),
      )
    } catch (err) {
      setMessage(`Ingest failed: ${err.message}`)
    }
    setBusy(false)
    refetch()
  }

  function when(a) {
    if (a.is_recurring && Array.isArray(a.schedule) && a.schedule.length) {
      const s = a.schedule[0]
      const day = s.by_day ? s.by_day[0].toUpperCase() + s.by_day.slice(1) : ''
      return `${day}s ${s.start_time ?? ''}`.trim()
    }
    if (!a.next_occurrence) return '—'
    return new Date(a.next_occurrence).toLocaleString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-dark">Discovered Activities</h1>
          <p className="text-gray-500 text-sm mt-1">
            Auto-discovered from open feeds. Approving publishes to What&apos;s On.
          </p>
        </div>
        <div className="flex gap-3">
        <button
          onClick={handleGeocode}
          disabled={busy}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
          title="Fill in missing lat/lng from other activities at the same postcode"
        >
          <MapPin size={18} />
          Fix map pins
        </button>
        <button
          onClick={handleIngest}
          disabled={busy}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-primary text-primary text-sm font-bold hover:bg-primary/5 transition-colors disabled:opacity-50"
        >
          <Radar size={18} />
          {busy ? 'Running...' : 'Run discovery'}
        </button>
        </div>
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg px-4 py-3 mb-6">
          {message}
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
        {['pending', 'published', 'rejected'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-white shadow-sm text-dark' : 'text-gray-500 hover:text-dark'
            }`}
          >
            {t} {tab === t ? `(${activities.length})` : ''}
          </button>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-white rounded-xl shadow-sm px-4 py-3 mb-4">
          <span className="text-sm font-semibold text-gray-600">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            {tab === 'pending' && (
              <button
                onClick={() => handleBulk('approve')}
                disabled={busy}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <Check size={16} /> Approve &amp; publish
              </button>
            )}
            <button
              onClick={() => handleBulk('reject')}
              disabled={busy}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <X size={16} /> Reject
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

      {!loading && !error && activities.length === 0 && (
        <p className="text-gray-500 text-sm py-12 text-center">
          Nothing {tab}. Run discovery to pull from the open feeds.
        </p>
      )}

      {!loading && !error && activities.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 w-px">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() =>
                      setSelected(allSelected ? new Set() : new Set(activities.map((a) => a.id)))
                    }
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    aria-label="Select all"
                  />
                </th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Activity</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">When</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Ages</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Where</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Source</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selected.has(a.id)}
                      onChange={() => toggle(a.id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      aria-label={`Select ${a.title}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-dark flex items-center gap-2">
                      {a.title}
                      {a.is_recurring && (
                        <span title="Recurring weekly">
                          <Repeat size={13} className="text-primary" />
                        </span>
                      )}
                      {a.deep_link && (
                        <a href={a.deep_link} target="_blank" rel="noreferrer" title="Open source page">
                          <ExternalLink size={13} className="text-gray-400 hover:text-primary" />
                        </a>
                      )}
                    </p>
                    <p className="text-gray-400 text-xs">{a.venue_name || '—'}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {when(a)}
                    {a.upcoming_count > 1 && (
                      <span className="text-gray-400 text-xs"> · {a.upcoming_count} upcoming</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{a.age_range || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {a.postcode || (
                      // A listing nobody can find is not a listing — surface it
                      // rather than letting it publish with no location.
                      <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-semibold">
                        <AlertTriangle size={13} /> no postcode
                      </span>
                    )}
                    {a.borough && <span className="text-gray-400 text-xs block">{a.borough}</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {a.source_name || a.source_id}
                    </span>
                    {a.confidence != null && a.confidence < 0.5 && (
                      <span className="text-amber-600 text-xs block mt-1">low confidence</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {tab === 'pending' && (
                        <button
                          onClick={async () => { await publishActivity(a.id); refetch() }}
                          className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                          title="Approve and publish"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        onClick={async () => { await rejectActivity(a.id); refetch() }}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        title="Reject"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
