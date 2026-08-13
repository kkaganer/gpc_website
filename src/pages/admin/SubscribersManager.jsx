import { useState, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { RefreshCw, Info } from 'lucide-react'
import { fetchSubscribers, retryBrevoSync } from '../../lib/adminApi'

const statusStyles = {
  synced: 'bg-green-50 text-green-600',
  failed: 'bg-red-50 text-red-600',
  pending: 'bg-amber-50 text-amber-600',
  skipped: 'bg-gray-100 text-gray-500',
}

const statusLabels = {
  synced: 'Synced',
  failed: 'Failed',
  pending: 'Pending',
  skipped: 'Skipped',
}

const statusHints = {
  synced: 'Brevo confirmed this contact exists.',
  failed: 'The write to Brevo did not land. Retry it.',
  pending: 'Stored here but not confirmed at Brevo yet.',
  skipped: 'The server has no Brevo API key configured, so nothing was sent.',
}

const emptyCounts = { total: 0, synced: 0, failed: 0, pending: 0, skipped: 0 }

// Falls back to counting rows so the tiles stay correct even if the API omits `counts`.
function countRows(rows) {
  const counts = { ...emptyCounts, total: rows.length }
  for (const row of rows) {
    if (statusLabels[row.brevo_status]) counts[row.brevo_status] += 1
  }
  return counts
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

export default function SubscribersManager() {
  const [subscribers, setSubscribers] = useState([])
  const [counts, setCounts] = useState(emptyCounts)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryingAll, setRetryingAll] = useState(false)
  const [retryingId, setRetryingId] = useState(null)

  useEffect(() => {
    document.title = 'Subscribers | GPC Admin'
    loadSubscribers()
  }, [])

  async function loadSubscribers() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchSubscribers()
      const rows = Array.isArray(data) ? data : data?.subscribers || []
      setSubscribers(rows)
      setCounts({ ...countRows(rows), ...(Array.isArray(data) ? {} : data?.counts || {}) })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRetry(id) {
    if (retryingAll || retryingId) return
    if (id) setRetryingId(id)
    else setRetryingAll(true)

    try {
      const result = await retryBrevoSync(id)
      const synced = result?.synced ?? 0
      const failed = result?.failed ?? 0
      const retried = result?.retried ?? 0

      if (retried === 0) {
        toast('Nothing to retry.')
      } else if (failed === 0) {
        toast.success(`${plural(synced, 'subscriber')} synced to Brevo.`)
      } else if (synced === 0) {
        toast.error(`${plural(failed, 'subscriber')} still failing.`)
      } else {
        toast.error(`${synced} synced, ${failed} still failing.`)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setRetryingId(null)
      setRetryingAll(false)
      await loadSubscribers()
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return 'Never attempted'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const unsynced = Math.max(counts.total - counts.synced, 0)
  const notYetSynced = counts.pending + counts.skipped
  const busy = retryingAll || Boolean(retryingId)

  const tiles = [
    {
      label: 'Total',
      value: counts.total,
      hint: 'Signed up through the form on this site',
      boxClass: 'bg-white border-gray-100',
      valueClass: 'text-dark',
    },
    {
      label: 'In Brevo',
      value: counts.synced,
      hint: 'Brevo confirmed the contact',
      boxClass: 'bg-white border-gray-100',
      valueClass: counts.synced > 0 ? 'text-green-600' : 'text-gray-400',
    },
    {
      label: 'Failed',
      value: counts.failed,
      hint: counts.failed > 0 ? 'These people are NOT on the mailing list' : 'Nothing failing right now',
      boxClass: counts.failed > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100',
      valueClass: counts.failed > 0 ? 'text-red-600' : 'text-gray-400',
    },
    {
      label: 'Not yet synced',
      value: notYetSynced,
      hint: `${counts.pending} pending · ${counts.skipped} skipped`,
      boxClass: notYetSynced > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100',
      valueClass: notYetSynced > 0 ? 'text-amber-600' : 'text-gray-400',
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-dark">Subscribers</h1>
          <p className="text-gray-500 text-sm mt-1">
            Everyone who signed up through the form on this site, and whether they reached Brevo
          </p>
        </div>
        <button
          onClick={() => handleRetry()}
          disabled={busy || unsynced === 0 || loading}
          title={unsynced === 0 ? 'Everyone is already in Brevo' : `Retry ${plural(unsynced, 'subscriber')}`}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-dark text-white text-sm font-bold hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
        >
          <RefreshCw size={18} className={retryingAll ? 'animate-spin' : ''} />
          {retryingAll ? 'Retrying...' : `Retry all unsynced${unsynced > 0 ? ` (${unsynced})` : ''}`}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <p>{error}</p>
          <button
            onClick={loadSubscribers}
            className="mt-2 font-bold underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {tiles.map((tile) => (
            <div key={tile.label} className={`rounded-2xl border p-5 ${tile.boxClass}`}>
              <p className="text-xs uppercase font-semibold text-gray-500">{tile.label}</p>
              <p className={`font-heading text-3xl font-bold mt-1 ${tile.valueClass}`}>{tile.value}</p>
              <p className="text-xs text-gray-500 mt-1">{tile.hint}</p>
            </div>
          ))}
        </div>
      )}

      {/* Two signup paths exist — only one of them lands in this table. */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
        <h2 className="font-heading font-semibold text-dark text-sm mb-3 flex items-center gap-2">
          <Info size={16} className="text-amber-600 shrink-0" />
          This is not the whole mailing list
        </h2>
        <ul className="space-y-2.5 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-amber-600 shrink-0">•</span>
            <span className="leading-relaxed">
              The <strong>inline form on the homepage</strong> saves to our database first, then sends the
              contact to Brevo. Those sign-ups are the ones tracked in this table.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600 shrink-0">•</span>
            <span className="leading-relaxed">
              The <strong>Brevo-hosted form</strong> linked from the Home and Events pages goes straight to
              Brevo and never touches our database, so those subscribers will <strong>not</strong> appear
              here. Check Brevo itself for the full list.
            </span>
          </li>
        </ul>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && (
        <>
          <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Newsletter subscribers stored in our database, with the status of their sync to Brevo.
              </caption>
              <thead>
                <tr className="border-b border-gray-100">
                  <th scope="col" className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Email</th>
                  <th scope="col" className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Signed Up</th>
                  <th scope="col" className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Brevo Status</th>
                  <th scope="col" className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Attempts</th>
                  <th scope="col" className="text-right px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors align-top">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-dark">{s.email}</p>
                      {s.source && s.source !== 'website' && (
                        <span className="inline-block mt-1 text-[10px] uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {s.source}
                        </span>
                      )}
                      {s.brevo_error && (
                        <p
                          className="text-xs text-red-500 mt-1 max-w-xs truncate"
                          title={s.brevo_error}
                        >
                          {s.brevo_error}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatDate(s.subscribed_at)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusStyles[s.brevo_status] || 'bg-gray-100 text-gray-500'}`}
                        title={
                          s.brevo_status === 'synced' && s.brevo_synced_at
                            ? `Synced ${formatDateTime(s.brevo_synced_at)}`
                            : statusHints[s.brevo_status] || ''
                        }
                      >
                        {statusLabels[s.brevo_status] || s.brevo_status}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 text-gray-600"
                      title={`Last attempt: ${formatDateTime(s.brevo_last_attempt_at)}`}
                    >
                      {s.brevo_attempts ?? 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {s.brevo_status !== 'synced' && (
                        <button
                          onClick={() => handleRetry(s.id)}
                          disabled={busy}
                          aria-label={`Retry Brevo sync for ${s.email}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-bold hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw size={14} className={retryingId === s.id ? 'animate-spin' : ''} />
                          {retryingId === s.id ? 'Retrying...' : 'Retry'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {subscribers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      No subscribers yet. Sign-ups from the homepage form will appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Legend — the meaning of "skipped" in particular is not guessable. */}
          <dl className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-xs text-gray-500">
            {Object.keys(statusLabels).map((key) => (
              <div key={key} className="flex items-center gap-2">
                <dt>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusStyles[key]}`}>
                    {statusLabels[key]}
                  </span>
                </dt>
                <dd>{statusHints[key]}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      {/* This page owns its own Toaster: no global one is mounted in the app yet. */}
      <Toaster position="top-right" />
    </div>
  )
}
