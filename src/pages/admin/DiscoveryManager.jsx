import { useState, useEffect } from 'react'
import { Check, X, Radar, Repeat, AlertTriangle, ExternalLink, MapPin, Sparkles } from 'lucide-react'
import {
  useDiscoveredActivities,
  publishActivity,
  rejectActivity,
  runIngest,
  pollBatch,
  backfillCoordinates,
} from '../../hooks/useDiscoveredActivities'

// flex + w-fit, not inline-flex: the pill sits on its own line under the age
// text rather than trailing off the end of it.
const AGE_BADGE_BASE =
  'flex w-fit items-center gap-1 mt-1 rounded-full px-2 py-0.5 text-[11px] font-bold border'

/**
 * Where a row's age range came from (`activities.age_basis`).
 *
 * Every variant carries its own words, so the difference still reads without
 * colour. Amber means "we filled this in ourselves"; grey means the listing
 * told us. The two amber ones are ordered by how much of a leap they are —
 * a venue's usual ages is a small one, an AI guess is the largest.
 */
const AGE_BASIS = {
  stated: {
    label: 'age stated',
    className: `${AGE_BADGE_BASE} text-gray-500 bg-gray-50 border-gray-200`,
    title: 'The listing itself said which ages this is for, and we used exactly what it said.',
  },
  inferred: {
    label: 'age inferred',
    className: `${AGE_BADGE_BASE} text-gray-500 bg-gray-50 border-gray-200`,
    title:
      'The listing gave no age range, so we read one from its own wording, such as ' +
      '"toddlers", "babies" or "under 5s".',
  },
  venue_default: {
    label: 'age assumed from venue',
    className: `${AGE_BADGE_BASE} text-amber-800 bg-amber-50 border-amber-200`,
    title:
      'Nothing in the listing mentioned age, so we assumed the ages this kind of venue or ' +
      'session usually serves — worth a quick look before publishing.',
  },
  llm_judged: {
    label: 'age guessed by AI — check',
    className: `${AGE_BADGE_BASE} text-amber-900 bg-amber-100 border-amber-300`,
    icon: true,
    title:
      'Nothing in the listing mentioned age at all, so AI judged it likely to be for under-5s ' +
      '— that is a guess rather than a fact, so open the source page and check before publishing.',
  },
}

/**
 * One pill saying why this row claims the ages it does.
 *
 * A wrong AI guess costs review time and nothing else: a judged row is ingested
 * as 'pending' like any other and only reaches the public site when someone
 * approves it on this screen. That is what this badge is for — so the person
 * clicking Approve knows which claims nobody has actually verified.
 *
 * Most rows predate `age_basis` and carry null; an empty pill on every one of
 * them would be noise, so an unknown or missing basis renders nothing at all.
 */
function AgeBasisBadge({ basis }) {
  const meta = AGE_BASIS[basis]
  if (!meta) return null
  return (
    <span className={meta.className} title={meta.title}>
      {meta.icon && <Sparkles size={11} className="shrink-0" />}
      {meta.label}
    </span>
  )
}

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
  const [onlyLlmJudged, setOnlyLlmJudged] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  // The rows whose age nobody stated and nobody checked — the ones worth working
  // through as a batch. Counted on the current tab so the button can say how much
  // is waiting, and so it can stay quiet when there is nothing to look at.
  const llmJudgedCount = activities.filter((a) => a.age_basis === 'llm_judged').length
  const visible = onlyLlmJudged
    ? activities.filter((a) => a.age_basis === 'llm_judged')
    : activities

  useEffect(() => {
    document.title = 'Discovered Activities | GPC Admin'
  }, [])

  // Clear on filter as well as tab: a tick on a row that is no longer on screen
  // would still be approved or rejected by the bulk buttons.
  useEffect(() => { setSelected(new Set()) }, [tab, onlyLlmJudged])

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const allSelected = visible.length > 0 && visible.every((a) => selected.has(a.id))

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
      const { batch_id: batchId, sources_queued: queued } = await runIngest()
      setMessage(`Discovery started — 0/${queued} sources done...`)

      const final = await pollBatch(batchId, (s) => {
        setMessage(
          `Discovery running — ${s.sources_finished}/${s.total_sources} sources done, ` +
          `${s.inserted} new activit${s.inserted === 1 ? 'y' : 'ies'} so far...`,
        )
      })

      if (final.status === 'timeout') {
        setMessage('Still running server-side — reload in a minute to see the results.')
      } else if (final.status === 'failed') {
        setMessage(`Discovery failed: ${final.error ?? 'unknown error'}`)
      } else {
        setMessage(
          `Discovery finished — ${final.inserted} new activit${final.inserted === 1 ? 'y' : 'ies'} ` +
          `from ${final.sources_finished} sources` +
          (final.sources_failed ? `, ${final.sources_failed} failed` : '') + '.',
        )
      }
    } catch (err) {
      setMessage(`Discovery failed: ${err.message}`)
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

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
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

        {/* Quiet when there is nothing AI-judged on this tab — but still shown while
            the filter is on, so it can never hide the only way to switch itself off. */}
        {(llmJudgedCount > 0 || onlyLlmJudged) && (
          <button
            onClick={() => setOnlyLlmJudged((on) => !on)}
            aria-pressed={onlyLlmJudged}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-colors ${
              onlyLlmJudged
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'border-amber-200 text-amber-800 hover:bg-amber-50'
            }`}
            title={
              'Show only the rows whose listing gave no age at all, where AI judged it likely ' +
              'to be for under-5s. Nobody has confirmed those ages, so they are the ones to ' +
              'check against the source page before approving. Click again to show everything.'
            }
          >
            <Sparkles size={14} />
            {onlyLlmJudged
              ? `Showing AI-guessed ages only (${llmJudgedCount})`
              : `AI-guessed ages (${llmJudgedCount})`}
          </button>
        )}
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

      {!loading && !error && visible.length === 0 && (
        <p className="text-gray-500 text-sm py-12 text-center">
          {onlyLlmJudged
            ? `No AI-guessed ages ${tab === 'pending' ? 'waiting' : tab} — nothing left to double-check here.`
            : `Nothing ${tab}. Run discovery to pull from the open feeds.`}
        </p>
      )}

      {!loading && !error && visible.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 w-px">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() =>
                      setSelected(allSelected ? new Set() : new Set(visible.map((a) => a.id)))
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
              {visible.map((a) => (
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
                  <td className="px-6 py-4 text-gray-600">
                    {a.age_min_months == null && a.age_max_months == null ? (
                      // A blank cell reads as "not looked at yet". The source giving
                      // us no age at all is itself worth knowing before approving.
                      <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-semibold">
                        <AlertTriangle size={13} /> no age given
                      </span>
                    ) : (
                      a.age_range || '—'
                    )}
                    <AgeBasisBadge basis={a.age_basis} />
                  </td>
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
