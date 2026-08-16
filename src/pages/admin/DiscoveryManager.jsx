import { Fragment, useState, useEffect } from 'react'
import {
  Check,
  X,
  Radar,
  Repeat,
  AlertTriangle,
  ExternalLink,
  MapPin,
  Sparkles,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
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
 * What the queue says when a folded group cannot be trusted to be one thing.
 *
 * `dedup_key` is title + postcode + schedule. Strip the postcode out and the key
 * loses the only field that separates one venue from another, so five library
 * branches each running "Story Time" at 10am hash to a single key and fold into
 * a single line here. Nothing is merged in the database — this screen only
 * groups for display — but approving the fold would approve five unrelated
 * listings on one click, so a group like that has to be opened and read row by
 * row before anything happens to it.
 */
const AMBIGUOUS_GROUP_WARNING =
  'These may be different venues: there is no postcode in the data, so they cannot be told ' +
  'apart. Open the group and check each listing before approving.'

const AMBIGUOUS_GROUP_BLOCKED =
  'Open this group first. With no postcode these listings cannot be told apart, so they must ' +
  'not be approved or rejected as one.'

/** The value `read` returns for every row, or null when the rows disagree. */
function uniform(rows, read) {
  const first = read(rows[0])
  return rows.every((r) => read(r) === first) ? first : null
}

/**
 * Fold rows into display groups on `dedup_key` (activities, migration 008 —
 * title + postcode + schedule, exposed on the review view by 025).
 *
 * Insertion order is kept, so a group lands where its first member would have
 * been and the confidence / next-occurrence ordering the query asked for still
 * holds. A group of one is not a group: it renders as the plain row it always
 * was, which keeps the common case identical.
 */
function buildGroups(rows) {
  const byKey = new Map()
  for (const row of rows) {
    // A row with no dedup_key must group with nothing. Any shared fallback —
    // '', 'none', null — would fold every keyless row into one entry, so the
    // first time the column goes missing the whole queue reads as one line.
    const key = row.dedup_key || `row:${row.id}`
    const group = byKey.get(key)
    if (group) group.rows.push(row)
    else byKey.set(key, { key, rows: [row] })
  }
  return [...byKey.values()].map((group) => ({
    ...group,
    count: group.rows.length,
    // Conservative on purpose: one blank postcode is enough to make the key
    // unreliable for the whole group.
    ambiguous: group.rows.length > 1 && group.rows.some((r) => !(r.postcode || '').trim()),
  }))
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

/**
 * One activity. Identical whether it stands alone or sits inside an open group —
 * same checkbox, same age badge, same per-row Approve and Reject — because a
 * member of a group is still an ordinary row that can be judged on its own.
 * `nested` only indents it so the eye can see which group it belongs to.
 */
function ActivityRow({ a, checked, onToggle, tab, onPublish, onReject, nested = false }) {
  return (
    <tr
      className={`border-b border-gray-50 transition-colors ${
        nested ? 'bg-gray-50/40 hover:bg-gray-50/70' : 'hover:bg-gray-50/50'
      }`}
    >
      <td className={nested ? 'pl-14 pr-6 py-4' : 'px-6 py-4'}>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(a.id)}
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
              onClick={() => onPublish(a.id)}
              className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
              title="Approve and publish"
            >
              <Check size={16} />
            </button>
          )}
          <button
            onClick={() => onReject(a.id)}
            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            title="Reject"
          >
            <X size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}

/**
 * The one line that stands in for 2+ repeats of the same session.
 *
 * Every cell shows the value the members agree on and says so plainly when they
 * do not — "ages vary", "2 sources" — because a fold that hides a disagreement
 * is exactly the fold that gets approved by mistake. Nothing here writes to the
 * database beyond looping the same per-row publish/reject the buttons already
 * call, so an unfolded group is always recoverable: it is still N separate rows.
 */
function GroupRow({ group, open, onToggleOpen, selected, onToggleSelect, tab, onGroupAction, busy }) {
  const rows = group.rows
  const selectedCount = rows.filter((r) => selected.has(r.id)).length
  const allChecked = selectedCount === rows.length
  const someChecked = selectedCount > 0 && !allChecked

  // A group nobody can tell apart is not approvable as a group. Opening it is
  // the whole gate: once the members are on screen they can be ticked one by
  // one, or the group can be taken as a whole having actually been looked at.
  const blocked = group.ambiguous && !open

  const title = rows[0].title
  const venue = uniform(rows, (r) => r.venue_name || '')
  const whenText = uniform(rows, when)
  const noAge = rows.every((r) => r.age_min_months == null && r.age_max_months == null)
  const ageText = uniform(rows, (r) => r.age_range || '')
  // Not uniform(): age_basis is null on every row predating migration 023, and
  // "they all agree it is null" must not read as "they disagree".
  const sameBasis = rows.every((r) => r.age_basis === rows[0].age_basis)
  const postcode = uniform(rows, (r) => r.postcode || '')
  const borough = uniform(rows, (r) => r.borough || '')
  const source = uniform(rows, (r) => r.source_name || r.source_id)

  // Did every summarised cell actually agree? Only then may the fold describe
  // its members as identical — otherwise the summary line would contradict the
  // cells beside it, which is the version an admin approves without opening.
  const allAgree = venue !== null && whenText !== null && ageText !== null && postcode !== null

  // How many members carry the low-confidence mark. ActivityRow shows this per
  // row, so folding rows into a group made the warning vanish for exactly the
  // listings most in need of a look.
  const lowConfidence = rows.filter((r) => r.confidence != null && r.confidence < 0.5).length

  return (
    <tr className="border-b border-gray-100 bg-gray-50/70">
      <td className="px-6 py-4">
        <input
          type="checkbox"
          checked={allChecked}
          disabled={blocked}
          ref={(el) => { if (el) el.indeterminate = someChecked }}
          onChange={() => onToggleSelect(group)}
          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Select all ${group.count} listings of ${title}`}
          title={blocked ? AMBIGUOUS_GROUP_BLOCKED : `Select all ${group.count} listings`}
        />
      </td>
      <td className="px-6 py-4">
        <button
          type="button"
          onClick={() => onToggleOpen(group)}
          aria-expanded={open}
          className="flex items-center gap-1.5 text-left font-semibold text-dark hover:text-primary transition-colors"
        >
          {open ? (
            <ChevronDown size={15} className="shrink-0 text-gray-400" />
          ) : (
            <ChevronRight size={15} className="shrink-0 text-gray-400" />
          )}
          <span>
            {title} <span className="text-gray-500 font-bold">({group.count})</span>
          </span>
        </button>
        <p className="text-gray-400 text-xs mt-0.5 pl-[22px]">
          {venue === null
            // Count DISTINCT names, not rows. Printing group.count for both made
            // 12 listings across 2 venues read "12 listings under 12 different
            // venue names" — a claim the row's own cells contradict.
            ? `${group.count} listings under ${new Set(rows.map((r) => r.venue_name || '—')).size} different venue names`
            // "identical" only when every summarised cell actually agreed. If the
            // when/ages/postcode cells are already saying values differ, calling
            // the members identical in the same breath tells the admin the fold
            // is safer than it is.
            : allAgree
              ? `${venue || '—'} · ${group.count} identical listings`
              : `${venue || '—'} · ${group.count} listings, some details differ`}
          {' · '}
          <span className="text-gray-400">{open ? 'showing each one' : 'click to open'}</span>
        </p>
        {group.ambiguous && (
          <p className="mt-2 ml-[22px] flex items-start gap-1.5 max-w-md rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-[11px] font-semibold text-amber-900">
            <AlertTriangle size={13} className="shrink-0 mt-px" />
            <span>{AMBIGUOUS_GROUP_WARNING}</span>
          </p>
        )}
      </td>
      <td className="px-6 py-4 text-gray-600">
        {whenText ?? <span className="text-gray-400 text-xs">times vary — open to see</span>}
      </td>
      <td className="px-6 py-4 text-gray-600">
        {noAge ? (
          <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-semibold">
            <AlertTriangle size={13} /> no age given
          </span>
        ) : ageText == null ? (
          <span className="text-gray-400 text-xs">ages vary — open to see</span>
        ) : (
          ageText || '—'
        )}
        {sameBasis ? (
          <AgeBasisBadge basis={rows[0].age_basis} />
        ) : (
          <span className="text-gray-400 text-[11px] block mt-1">ages come from different places</span>
        )}
      </td>
      <td className="px-6 py-4 text-gray-600">
        {postcode === null ? (
          <span className="text-gray-400 text-xs">postcodes differ — open to see</span>
        ) : (
          postcode || (
            <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-semibold">
              <AlertTriangle size={13} /> no postcode
            </span>
          )
        )}
        {borough && <span className="text-gray-400 text-xs block">{borough}</span>}
      </td>
      <td className="px-6 py-4">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
          {source ?? `${new Set(rows.map((r) => r.source_name || r.source_id)).size} sources`}
        </span>
        {/* Carried up from ActivityRow. Folding hid this for every grouped row,
            which silently removed the warning from the listings that most need
            checking — the fold must never be quieter than the rows it replaces. */}
        {lowConfidence > 0 && (
          <span className="text-amber-600 text-xs block mt-1">
            {lowConfidence === group.count
              ? 'low confidence'
              : `low confidence on ${lowConfidence} of ${group.count}`}
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {tab === 'pending' && (
            <button
              onClick={() => onGroupAction(group, 'approve')}
              disabled={blocked || busy}
              className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              title={blocked ? AMBIGUOUS_GROUP_BLOCKED : `Approve and publish all ${group.count}`}
            >
              <Check size={16} />
            </button>
          )}
          <button
            onClick={() => onGroupAction(group, 'reject')}
            disabled={blocked || busy}
            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            title={blocked ? AMBIGUOUS_GROUP_BLOCKED : `Reject all ${group.count}`}
          >
            <X size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}

/**
 * Review queue for auto-discovered activities.
 *
 * Deliberately separate from LondonEventsManager: this reviews ACTIVITIES (the
 * rich model — age in months, recurrence, term-time, provenance), and approving
 * one projects it into `london_events`, which is what the public site, map and
 * newsletter already read. Nothing reaches the site without a click here.
 *
 * Repeats are folded by `dedup_key` FOR DISPLAY ONLY. The queue held 152 rows of
 * which 68 were repeats inside a single feed — twelve identical soft play
 * sessions at one postcode is one decision, not twelve. Nothing is merged,
 * deleted or rewritten: a group is N rows wearing one line, every action still
 * runs per row, and opening it puts every row back on screen.
 */
export default function DiscoveryManager() {
  const [tab, setTab] = useState('pending')
  const { activities, loading, error, refetch } = useDiscoveredActivities(tab)
  const [selected, setSelected] = useState(() => new Set())
  const [expanded, setExpanded] = useState(() => new Set())
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

  // Group AFTER filtering: with the AI-ages filter on, a group has to mean
  // "the repeats you are looking at", not "the repeats that exist".
  const groups = buildGroups(visible)

  // Rows sitting inside a shut ambiguous group. They are on the screen but not
  // yet reviewable, so select-all steps over them and the count below ignores
  // them — otherwise one click on the header checkbox would arm exactly the
  // listings that must not be actioned as a batch.
  const blockedIds = new Set(
    groups
      .filter((g) => g.ambiguous && !expanded.has(g.key))
      .flatMap((g) => g.rows.map((r) => r.id)),
  )
  const selectableRows = visible.filter((a) => !blockedIds.has(a.id))
  const allSelected = selectableRows.length > 0 && selectableRows.every((a) => selected.has(a.id))
  const foldedCount = visible.length - groups.length

  useEffect(() => {
    document.title = 'Discovered Activities | GPC Admin'
  }, [])

  // Clear on filter as well as tab: a tick on a row that is no longer on screen
  // would still be approved or rejected by the bulk buttons. Open groups reset
  // too — the keys belong to the set of rows that just went away.
  useEffect(() => {
    setSelected(new Set())
    setExpanded(new Set())
  }, [tab, onlyLlmJudged])

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleGroupOpen(group) {
    const wasOpen = expanded.has(group.key)
    setExpanded((prev) => {
      const next = new Set(prev)
      wasOpen ? next.delete(group.key) : next.add(group.key)
      return next
    })
    // Shutting an ambiguous group takes its ticks with it, so the rule holds
    // without exception: nothing from a group that cannot be told apart is ever
    // armed for a bulk action while that group is shut.
    if (wasOpen && group.ambiguous) {
      setSelected((prev) => {
        const next = new Set(prev)
        for (const r of group.rows) next.delete(r.id)
        return next
      })
    }
  }

  // One tick on a group is a tick on each of its rows — never a tick on the
  // group as an object. `selected` only ever holds activity ids, which is what
  // keeps the toolbar count, the bulk loop and "12 selected" all agreeing.
  function toggleGroupSelection(group) {
    const allChecked = group.rows.every((r) => selected.has(r.id))
    setSelected((prev) => {
      const next = new Set(prev)
      for (const r of group.rows) {
        if (allChecked) next.delete(r.id)
        else next.add(r.id)
      }
      return next
    })
  }

  async function runOn(ids, action) {
    setBusy(true)
    setMessage('')
    let ok = 0
    const failures = []
    for (const id of ids) {
      try {
        if (action === 'approve') await publishActivity(id)
        else await rejectActivity(id)
        ok++
      } catch (err) {
        failures.push(err.message)
      }
    }
    // Report failures rather than silently showing a success count.
    setMessage(
      failures.length
        ? `${ok} ${action}d, ${failures.length} failed: ${failures[0]}`
        : `${ok} activit${ok === 1 ? 'y' : 'ies'} ${action}d.`,
    )
    setBusy(false)
    refetch()
  }

  async function handleBulk(action) {
    const ids = [...selected]
    setSelected(new Set())
    await runOn(ids, action)
  }

  // A group action is the per-row action run over the group's members. There is
  // no group-level publish and there is no group row in the database.
  async function handleGroupAction(group, action) {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const r of group.rows) next.delete(r.id)
      return next
    })
    await runOn(group.rows.map((r) => r.id), action)
  }

  // Both prune the id from `selected` before refetching. Without it a row acted
  // on individually stayed selected after leaving the queue, so the toolbar kept
  // counting it ("3 listings selected" when two remain) and a following bulk
  // action re-sent it. handleGroupAction already did this; these did not.
  function deselect(id) {
    setSelected((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  async function publishOne(id) {
    await publishActivity(id)
    deselect(id)
    refetch()
  }

  async function rejectOne(id) {
    await rejectActivity(id)
    deselect(id)
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
      const startedAt = Date.now()
      setMessage(`Discovery started — 0/${queued} sources done...`)

      // WHY THIS SHOWS MORE THAN "n of m done".
      //
      // `inserted` is sum(ingest_runs.inserted), and a run row is only written
      // when its source FINISHES. So across ten sources — some of which scan
      // hundreds of events, and one of which runs web searches — both the done
      // count and the inserted count are genuinely frozen for a minute or more.
      // The old message showed only those two numbers, so a working run looked
      // hung, which is what it was reported as.
      //
      // sources_started moves the moment a source begins, and elapsed seconds
      // move every poll, so between them the line is always visibly alive. The
      // view has carried both all along; nothing was reading them.
      const final = await pollBatch(batchId, (s) => {
        const secs = Math.round((Date.now() - startedAt) / 1000)
        const inFlight = Math.max((s.sources_started ?? 0) - (s.sources_finished ?? 0), 0)
        const found = s.inserted
          ? `${s.inserted} new activit${s.inserted === 1 ? 'y' : 'ies'} so far`
          : 'nothing new yet'
        setMessage(
          `Discovery running (${secs}s) — ${s.sources_finished}/${s.total_sources} sources done` +
          (inFlight ? `, ${inFlight} still working` : '') +
          `, ${found}...`,
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
          {/* Listings, not entries: ticking one folded group arms every row in it,
              so the number here has to be the number of things about to change. */}
          <span className="text-sm font-semibold text-gray-600">
            {selected.size} listing{selected.size === 1 ? '' : 's'} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            {tab === 'pending' && (
              <button
                onClick={() => handleBulk('approve')}
                disabled={busy}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <Check size={16} /> Approve &amp; publish {selected.size}
              </button>
            )}
            <button
              onClick={() => handleBulk('reject')}
              disabled={busy}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <X size={16} /> Reject {selected.size}
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
        <>
          {/* Only when folding actually happened — on a queue with no repeats this
              line would just be a sentence explaining that nothing occurred. */}
          {foldedCount > 0 && (
            <p className="text-gray-500 text-xs mb-3">
              {groups.length} entr{groups.length === 1 ? 'y' : 'ies'} for {visible.length} listings
              — {foldedCount} repeat{foldedCount === 1 ? '' : 's'} of the same title, place and time
              folded in. Nothing has been deleted or merged; open an entry to see every listing.
            </p>
          )}

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 w-px">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() =>
                        setSelected(
                          allSelected ? new Set() : new Set(selectableRows.map((a) => a.id)),
                        )
                      }
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      aria-label="Select all"
                      title={
                        blockedIds.size
                          ? `Selects every listing except the ${blockedIds.size} inside groups with ` +
                            'no postcode — open those and check them first.'
                          : 'Select all'
                      }
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
                {groups.map((group) =>
                  group.count === 1 ? (
                    <ActivityRow
                      key={group.rows[0].id}
                      a={group.rows[0]}
                      checked={selected.has(group.rows[0].id)}
                      onToggle={toggle}
                      tab={tab}
                      onPublish={publishOne}
                      onReject={rejectOne}
                    />
                  ) : (
                    <Fragment key={group.key}>
                      <GroupRow
                        group={group}
                        open={expanded.has(group.key)}
                        onToggleOpen={toggleGroupOpen}
                        selected={selected}
                        onToggleSelect={toggleGroupSelection}
                        tab={tab}
                        onGroupAction={handleGroupAction}
                        busy={busy}
                      />
                      {expanded.has(group.key) &&
                        group.rows.map((a) => (
                          <ActivityRow
                            key={a.id}
                            a={a}
                            checked={selected.has(a.id)}
                            onToggle={toggle}
                            tab={tab}
                            onPublish={publishOne}
                            onReject={rejectOne}
                            nested
                          />
                        ))}
                    </Fragment>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
