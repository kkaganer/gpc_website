import { useState, useEffect, useMemo } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { RefreshCw, Info, Search, AlertTriangle, MailX } from 'lucide-react'
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

// Where the row came from (the `source` CHECK in migration 019). With ~733
// imported rows sitting next to 32 website sign-ups, "who is this person and
// how did we get them" is a question the table has to answer at a glance.
const sourceLabels = {
  website: 'Website form',
  import: 'Brevo import',
  backfill: 'Backfill',
  unknown: 'Unknown',
}

const sourceStyles = {
  website: 'bg-blue-50 text-blue-600',
  import: 'bg-purple-50 text-purple-600',
  backfill: 'bg-gray-100 text-gray-500',
  unknown: 'bg-gray-100 text-gray-400',
}

const sourceHints = {
  website: 'Signed up through the inline form on this site.',
  import: 'Imported from Brevo, where they had signed up through the Brevo-hosted form.',
  backfill: 'Already in our database; pushed up to Brevo by the backfill job.',
  unknown: 'No source recorded for this row.',
}

// Anything outside the CHECK constraint (or a missing column) reads as unknown
// rather than rendering a raw value or blowing up on a lookup.
function sourceKey(row) {
  return sourceLabels[row?.source] ? row.source : 'unknown'
}

// Consent, from migration 027's `unsubscribed_at`. This is deliberately NOT a
// status: brevo_status describes whether a sync worked, unsubscribed_at
// describes a decision a person made about their own data.
//
//   null    -> still subscribed, safe to email
//   a date  -> they opted out. DO NOT EMAIL, and never push them back to Brevo
//   absent  -> the API did not return the column at all, so we do not know
//
// The third case is real and has to be handled: /api/admin/subscribers selects
// an explicit column list, and if unsubscribed_at is not on it the key is
// missing from every row. "Missing" must never be read as "still subscribed" —
// that is precisely how an opted-out person gets mailed again.
const CONSENT = {
  SUBSCRIBED: 'subscribed',
  UNSUBSCRIBED: 'unsubscribed',
  UNKNOWN: 'unknown',
}

function consentOf(row) {
  if (!row || !Object.prototype.hasOwnProperty.call(row, 'unsubscribed_at')) {
    return CONSENT.UNKNOWN
  }
  return row.unsubscribed_at ? CONSENT.UNSUBSCRIBED : CONSENT.SUBSCRIBED
}

// The one gate on every Brevo push from this page. Only a row we positively
// know is still subscribed, and is not already synced, may be retried.
function canRetry(row) {
  return consentOf(row) === CONSENT.SUBSCRIBED && row?.brevo_status !== 'synced'
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

// Consent is always tallied here, from the rows themselves, and never taken
// from the API's `counts` object — that object predates migration 027 and has
// no idea unsubscribed people exist.
function tallyConsent(rows) {
  const tally = { subscribed: 0, unsubscribed: 0, unknown: 0 }
  for (const row of rows) tally[consentOf(row)] += 1
  return tally
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

// How many rows render before "show more". The table is ~765 rows now; putting
// all of them in the DOM at once makes the page crawl on a laptop.
const PAGE_SIZE = 100

function Tile({ label, value, hint, boxClass, valueClass, valueSize = 'text-3xl', className = '' }) {
  return (
    <div className={`rounded-2xl border p-5 ${boxClass} ${className}`}>
      <p className="text-xs uppercase font-semibold text-gray-500">{label}</p>
      <p className={`font-heading font-bold mt-1 ${valueSize} ${valueClass}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{hint}</p>
    </div>
  )
}

export default function SubscribersManager() {
  const [subscribers, setSubscribers] = useState([])
  const [counts, setCounts] = useState(emptyCounts)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryingAll, setRetryingAll] = useState(false)
  const [retryingId, setRetryingId] = useState(null)
  const [search, setSearch] = useState('')
  const [consentFilter, setConsentFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [visible, setVisible] = useState(PAGE_SIZE)

  useEffect(() => {
    document.title = 'Subscribers | GPC Admin'
    loadSubscribers()
  }, [])

  // A narrowed list starts at the top again, otherwise a search that matches
  // 3 rows can still be sitting behind a "show more" from the previous view.
  useEffect(() => {
    setVisible(PAGE_SIZE)
  }, [search, consentFilter, sourceFilter])

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

    // Consent gate, checked here as well as at the button, so no path into a
    // Brevo push skips it.
    if (id) {
      const row = subscribers.find((s) => s.id === id)
      if (!row || !canRetry(row)) {
        toast.error('That contact opted out, so they are never pushed back to Brevo.')
        return
      }
      setRetryingId(id)
    } else {
      setRetryingAll(true)
    }

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

  // Every tile below reads `counts` and `consent`, both computed over the FULL
  // result set — never over `filtered`. Searching for one address must not
  // change what "how many can we email" says.
  const consent = useMemo(() => tallyConsent(subscribers), [subscribers])
  const consentKnown = consent.unknown === 0

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return subscribers.filter((s) => {
      if (needle && !(s.email || '').toLowerCase().includes(needle)) return false
      if (consentFilter !== 'all' && consentOf(s) !== consentFilter) return false
      if (sourceFilter !== 'all' && sourceKey(s) !== sourceFilter) return false
      return true
    })
  }, [subscribers, search, consentFilter, sourceFilter])

  const shown = filtered.slice(0, visible)

  // The retry-all count is the number of rows this page is willing to push:
  // unsynced AND known to still be subscribed. It is not total - synced.
  const retryable = useMemo(() => subscribers.filter(canRetry).length, [subscribers])
  const notYetSynced = counts.pending + counts.skipped
  const busy = retryingAll || Boolean(retryingId)

  const retryAllTitle = retryable > 0
    ? `Retry ${plural(retryable, 'subscriber')}. Contacts who unsubscribed are excluded and are never pushed to Brevo.`
    : consentKnown
      ? 'Nothing to retry — every contact who can be emailed is already in Brevo.'
      : 'Disabled: we cannot tell who has opted out until the admin API returns the unsubscribed_at column.'

  const tiles = [
    {
      label: 'Total',
      value: counts.total,
      hint: 'Everyone we hold, opted out included',
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
            Everyone in our database — website sign-ups and the contacts imported from Brevo — and
            whether we may still email them
          </p>
        </div>
        {/*
          Unsubscribed rows are excluded from this count. NOTE for whoever owns
          /api/admin/subscribers: the bulk retry there selects on
          `.neq('brevo_status', 'synced')` alone, so it must also filter
          `.is('unsubscribed_at', null)` — otherwise this exclusion is only a
          label on a button and the server still pushes opted-out people.
        */}
        <button
          onClick={() => handleRetry()}
          disabled={busy || retryable === 0 || loading}
          title={retryAllTitle}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-dark text-white text-sm font-bold hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
        >
          <RefreshCw size={18} className={retryingAll ? 'animate-spin' : ''} />
          {retryingAll ? 'Retrying...' : `Retry all unsynced${retryable > 0 ? ` (${retryable})` : ''}`}
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

      {/*
        Fail loud rather than guess. If the admin API is not returning
        unsubscribed_at, every row reads as "unknown" and this page refuses to
        push anyone to Brevo, because it cannot prove they did not opt out.
      */}
      {!loading && !error && !consentKnown && subscribers.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <p className="font-bold flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            Opt-out information is missing
          </p>
          <p className="mt-1 leading-relaxed">
            The admin API is not returning the <code className="font-mono">unsubscribed_at</code>{' '}
            column, so we cannot tell who has unsubscribed. Sending to this list, or retrying a
            Brevo sync, could reach people who opted out — so retry is switched off until that
            column comes through.
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/*
            The headline pair: the question actually being asked of this page is
            "how many people can we email", so that number is the big one, and
            the opt-outs sit next to it as the plain reason for the difference.
          */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <Tile
              className="lg:col-span-2"
              label="Can be emailed"
              value={consentKnown ? consent.subscribed : '—'}
              valueSize="text-5xl"
              hint={
                consentKnown
                  ? 'Still subscribed. This is the number a send actually reaches.'
                  : 'Unknown until the admin API returns the unsubscribed_at column.'
              }
              boxClass="bg-white border-gray-200 shadow-sm"
              valueClass={consentKnown ? 'text-dark' : 'text-gray-400'}
            />
            <Tile
              label="Unsubscribed"
              value={consentKnown ? consent.unsubscribed : '—'}
              hint="Opted out. Kept on record so they are never re-added."
              boxClass="bg-white border-gray-100"
              valueClass="text-gray-500"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {tiles.map((tile) => (
              <Tile key={tile.label} {...tile} />
            ))}
          </div>
        </>
      )}

      {/* Two signup paths exist — they now both land here, but not at the same moment. */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
        <h2 className="font-heading font-semibold text-dark text-sm mb-3 flex items-center gap-2">
          <Info size={16} className="text-amber-600 shrink-0" />
          There are two ways people sign up
        </h2>
        <ul className="space-y-2.5 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-amber-600 shrink-0">•</span>
            <span className="leading-relaxed">
              The <strong>inline form on the homepage</strong> saves to our database first, then sends
              the contact to Brevo. Those arrive here immediately, marked{' '}
              <strong>Website form</strong>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600 shrink-0">•</span>
            <span className="leading-relaxed">
              The <strong>Brevo-hosted form</strong> linked from the Home and Events pages posts
              straight to Brevo and never touches our database. Those contacts are here because they
              were <strong>imported from Brevo</strong>, and they carry that source — but a sign-up
              made through that form <strong>after</strong> the last import will not appear until the
              next one runs.
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
          {/* Find-one-person controls. These narrow the table only; the tiles above stay whole-set. */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email"
                aria-label="Search subscribers by email address"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <select
              value={consentFilter}
              onChange={(e) => setConsentFilter(e.target.value)}
              aria-label="Filter by whether we may email them"
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:border-primary"
            >
              <option value="all">Everyone</option>
              <option value={CONSENT.SUBSCRIBED}>Can be emailed</option>
              <option value={CONSENT.UNSUBSCRIBED}>Unsubscribed</option>
              <option value={CONSENT.UNKNOWN}>Opt-out unknown</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              aria-label="Filter by where the contact came from"
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:border-primary"
            >
              <option value="all">All sources</option>
              {Object.keys(sourceLabels).map((key) => (
                <option key={key} value={key}>{sourceLabels[key]}</option>
              ))}
            </select>

            <p className="text-xs text-gray-500 whitespace-nowrap">
              Showing {shown.length} of {filtered.length}
              {filtered.length !== subscribers.length && ` · filtered from ${subscribers.length}`}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Newsletter subscribers stored in our database, where each came from, whether they
                have opted out, and the status of their sync to Brevo.
              </caption>
              <thead>
                <tr className="border-b border-gray-100">
                  <th scope="col" className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Email</th>
                  <th scope="col" className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Source</th>
                  <th scope="col" className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Signed Up</th>
                  <th scope="col" className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Brevo Status</th>
                  <th scope="col" className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Attempts</th>
                  <th scope="col" className="text-right px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((s) => {
                  const state = consentOf(s)
                  const optedOut = state === CONSENT.UNSUBSCRIBED
                  const unknownConsent = state === CONSENT.UNKNOWN
                  const src = sourceKey(s)

                  return (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors align-top">
                      <td className="px-6 py-4">
                        {/*
                          Struck through AND labelled in words: the strike alone
                          is a visual cue that colour-blind or screen-reader
                          users would not get, and this is the one fact on the
                          row you cannot afford to miss.
                        */}
                        <p className={`font-semibold ${optedOut ? 'text-gray-400 line-through decoration-gray-400' : 'text-dark'}`}>
                          {s.email}
                        </p>
                        {optedOut && (
                          <span
                            className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full"
                            title={`This person opted out${s.unsubscribed_at ? ` on ${formatDate(s.unsubscribed_at)}` : ''}. Do not email them, and do not push them back to Brevo. The row is kept so a future import can never re-add them.`}
                          >
                            <MailX size={11} className="shrink-0" />
                            Unsubscribed — do not email
                          </span>
                        )}
                        {unknownConsent && (
                          <span
                            className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full"
                            title="We do not know whether this person opted out, because the admin API is not returning the unsubscribed_at column. Treat as do-not-email until it does."
                          >
                            Opt-out unknown
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
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap ${sourceStyles[src]}`}
                          title={sourceHints[src]}
                        >
                          {sourceLabels[src]}
                        </span>
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
                        {/*
                          No retry button for an opted-out row — not a disabled
                          one, none at all. Re-pushing them to Brevo is the exact
                          thing the consent record exists to prevent.
                        */}
                        {canRetry(s) && (
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
                        {optedOut && s.brevo_status !== 'synced' && (
                          <span
                            className="text-xs text-gray-400"
                            title="They opted out, so this row is never pushed to Brevo — by this button or by Retry all."
                          >
                            Not sent
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      {subscribers.length === 0
                        ? 'No subscribers yet. Sign-ups from the homepage form will appear here.'
                        : 'No subscriber matches those filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > shown.length && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setVisible((n) => n + PAGE_SIZE)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:border-primary hover:text-primary transition-colors"
              >
                Show {Math.min(PAGE_SIZE, filtered.length - shown.length)} more
              </button>
            </div>
          )}

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
            <div className="flex items-center gap-2">
              <dt>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                  <MailX size={11} className="shrink-0" />
                  Unsubscribed
                </span>
              </dt>
              <dd>They opted out. Never email them and never re-add them to Brevo.</dd>
            </div>
          </dl>
        </>
      )}

      {/* This page owns its own Toaster: no global one is mounted in the app yet. */}
      <Toaster position="top-right" />
    </div>
  )
}
