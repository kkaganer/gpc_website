import { Fragment, useState } from 'react'
import { useParams, Link } from 'react-router'
import { ORG, NEWSLETTER } from '../utils/constants'
import { useEdition } from '../hooks/useEdition'
import {
  groupEvents,
  regularsGroup,
  regularDayParts,
  REGULARS_KEY,
  priceLabel,
  dayParts,
  supporterSlots,
  clickHref,
} from '../lib/editionGroups'

// One week of the What's On guide, at its own permanent address.
//
// This is not the map browser at /whats-on and does not replace it. That page is
// a tool you search; this is an edition you read, and the date in the URL is the
// whole point -- a link shared in a WhatsApp group in June still shows June when
// somebody opens it in December.

function formatEditionDate(iso) {
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}

function eventMeta(event) {
  return [event.location || event.venue, event.time].filter(Boolean).join(' · ')
}

// A weekly session has no date and no `time`; when it happens lives in
// `recurring_time` instead.
function regularMeta(event) {
  return [event.location || event.venue, event.recurring_time].filter(Boolean).join(' · ')
}

function SectionShell({ children }) {
  return <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10">{children}</div>
}

// The unsold presenting slot: same footprint, same pink top rule, dashed rather
// than solid. It has to read as an offer, not as a gap where something failed.
function PresentingHouseAd() {
  const month = new Date().toLocaleDateString('en-GB', { month: 'long' })
  return (
    <SectionShell>
      <div className="rounded-2xl overflow-hidden bg-white border border-dashed border-gray-200 border-t-[3px] border-t-primary border-t-dashed">
        <div className="px-6 sm:px-9 py-10 text-center">
          <div className="font-bold text-[11px] uppercase tracking-[0.08em] text-[#d1067f]">
            This space
          </div>
          <div className="font-heading font-bold text-2xl sm:text-3xl leading-tight text-dark mt-3">
            Want to feature your business?
          </div>
          <p className="text-base leading-relaxed text-gray-600 mt-3 max-w-[460px] mx-auto">
            One business per edition reaches {ORG.memberCount} Greenwich parents right here.
          </p>
          <Link
            to="/advertise"
            className="inline-flex items-center justify-center min-h-[44px] mt-6 px-6 py-3 border-2 border-primary rounded-full bg-white text-[#d1067f] font-bold text-[15px] hover:bg-[#fff5fb]"
          >
            Talk to us about {month} →
          </Link>
        </div>
      </div>
    </SectionShell>
  )
}

function PresentingSlot({ advertiser, editionDate }) {
  if (!advertiser) return <PresentingHouseAd />

  const isBrand = Boolean(advertiser.is_brand_sponsor)
  // Migration 033. Rows are dropped when empty rather than printed blank: a
  // booking taken before those columns existed has none of them.
  const details = [
    ['When', advertiser.event_when],
    ['Price', advertiser.event_price],
    ['Where', advertiser.event_where],
  ].filter(([, value]) => Boolean(value))
  const ctaLabel = advertiser.cta_label || (isBrand ? 'Visit website' : 'Find out more')

  return (
    <SectionShell>
      <a
        href={clickHref(advertiser.id, editionDate, advertiser.event_url)}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block rounded-2xl overflow-hidden bg-white border border-gray-100 border-t-[3px] border-t-primary shadow-[0_8px_30px_rgba(252,22,160,.12)] focus:ring-2 focus:ring-primary focus:outline-none"
      >
        <div className="bg-[#fff5fb] px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#d1067f]">
          Presenting partner · paid placement
        </div>
        <div className={isBrand ? '' : 'grid grid-cols-1 md:grid-cols-[440px_1fr] items-stretch'}>
          {!isBrand && advertiser.image_url && (
            <div className="min-h-[200px] md:min-h-[280px] bg-gray-50">
              <img
                src={advertiser.image_url}
                alt={advertiser.advertiser_name || ''}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}
          <div className="p-6 sm:p-8">
            <div className="font-heading font-bold text-2xl sm:text-3xl leading-tight text-dark">
              {advertiser.event_title || advertiser.advertiser_name}
            </div>
            {advertiser.event_description && (
              <p className="text-base sm:text-[17px] leading-relaxed text-gray-600 mt-2.5 max-w-[460px]">
                {advertiser.event_description}
              </p>
            )}
            {!isBrand && details.length > 0 && (
              <dl className="grid grid-cols-[76px_1fr] gap-x-4 gap-y-2.5 mt-5 text-[15px] leading-normal text-gray-600">
                {details.map(([label, value]) => (
                  <Fragment key={label}>
                    <dt className="font-bold text-xs uppercase tracking-[0.025em] text-gray-500 pt-0.5">
                      {label}
                    </dt>
                    <dd className="m-0">{value}</dd>
                  </Fragment>
                ))}
              </dl>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-6">
              <span className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 border-2 border-primary rounded-full bg-white text-[#d1067f] font-bold text-[15px]">
                {ctaLabel} →
              </span>
              <span className="text-xs text-gray-400">
                Paid placement. GPC does not run this.
              </span>
            </div>
          </div>
        </div>
      </a>
    </SectionShell>
  )
}

function SupporterRail({ supporters, editionDate }) {
  // Always rendered, even with nothing sold: the whole point of the unsold state
  // is that the rail is where a business finds out it could be here.
  const slots = supporterSlots(supporters)
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
      <div className="font-bold text-[11px] uppercase tracking-[0.08em] text-gray-500 text-center">
        Supported by
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3.5">
        {slots.map((slot, i) =>
          slot.house ? (
            <Link
              key="house"
              to="/advertise"
              // Spans whatever is unsold, so the grid never shows a hole.
              className={`${slot.span > 1 ? 'col-span-2' : ''} flex items-center justify-center text-center min-h-[66px] p-2.5 border-2 border-dashed border-primary/40 rounded-xl font-bold text-[13px] leading-tight text-[#d1067f] hover:bg-[#fff5fb] focus:ring-2 focus:ring-primary focus:outline-none`}
            >
              {slot.spaces} {slot.spaces === 1 ? 'space' : 'spaces'} left this week →
            </Link>
          ) : (
            <a
              key={slot.supporter.id ?? i}
              href={clickHref(slot.supporter.id, editionDate, slot.supporter.event_url)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex items-center justify-center text-center min-h-[66px] p-2.5 border border-gray-100 rounded-xl font-bold text-[13px] leading-tight text-dark focus:ring-2 focus:ring-primary focus:outline-none"
              style={{ backgroundColor: slot.supporter.logo_bg || '#ffffff' }}
            >
              {slot.supporter.image_url ? (
                <img
                  src={slot.supporter.image_url}
                  alt={slot.supporter.advertiser_name || ''}
                  className="max-h-[46px] w-auto"
                  loading="lazy"
                />
              ) : (
                slot.supporter.advertiser_name
              )}
            </a>
          )
        )}
      </div>
      <Link
        to="/advertise"
        className="block text-center text-[13px] text-[#d1067f] mt-3.5 leading-8 hover:underline"
      >
        Want to feature your business?
      </Link>
    </div>
  )
}

function SubscribeCard() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('submitting')
    setMessage('')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage(data.error || 'Something went wrong. Try again.')
        setStatus('error')
        return
      }
      setEmail('')
      setStatus('success')
    } catch {
      setMessage('Something went wrong. Try again.')
      setStatus('error')
    }
  }

  return (
    <div className="bg-[#fffbeb] rounded-2xl p-5">
      <div className="font-heading font-bold text-lg leading-snug text-dark">
        Get this every Friday
      </div>
      <p className="text-sm leading-relaxed text-gray-600 mt-2 mb-3.5">One email a week. Nothing else.</p>
      {status === 'success' ? (
        <p className="text-sm font-bold text-dark">
          You&apos;re in. Check your inbox to confirm.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label htmlFor="edition-subscribe" className="sr-only">
            Email address
          </label>
          <input
            id="edition-subscribe"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="block w-full min-h-[44px] px-4 py-3 border border-gray-200 rounded-full bg-white text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="block w-full min-h-[44px] mt-2.5 px-5 py-3 rounded-full bg-gradient-to-r from-primary to-dark text-white font-bold text-[15px] disabled:opacity-60"
          >
            {status === 'submitting' ? 'Joining…' : `Join ${ORG.memberCount} parents`}
          </button>
          {status === 'error' && (
            <p className="text-xs text-red-600 mt-2">
              {message}{' '}
              <a href={NEWSLETTER.hostedFormUrl} className="underline" target="_blank" rel="noopener noreferrer">
                Sign up here instead
              </a>
              .
            </p>
          )}
        </form>
      )}
    </div>
  )
}

function EventRow({ event }) {
  const { dow, day } = dayParts(event.date)
  const price = priceLabel(event)
  return (
    <a
      href={event.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="grid grid-cols-[52px_1fr] sm:grid-cols-[68px_1fr_132px] gap-3 sm:gap-5 items-center px-4 sm:px-5 py-3 border-t border-gray-50 first:border-t-0 min-h-[44px] hover:bg-warm focus:bg-warm focus:outline-none"
    >
      <div className="text-center leading-tight">
        <div className="font-bold text-[11px] uppercase tracking-wider text-gray-400">{dow}</div>
        <div className="font-heading font-bold text-lg text-dark mt-0.5">{day}</div>
      </div>
      <div className="min-w-0">
        <div className="font-bold text-base leading-snug text-dark">{event.title}</div>
        <div className="text-[13px] leading-snug text-gray-500 mt-0.5">{eventMeta(event)}</div>
        <span
          className="sm:hidden inline-block font-bold text-xs px-2.5 py-1 rounded-full mt-1.5 whitespace-nowrap"
          style={{ backgroundColor: price.bg, color: price.fg }}
          title={price.full || undefined}
        >
          {price.text}
        </span>
      </div>
      <div className="hidden sm:block text-right">
        <span
          className="inline-block font-bold text-[13px] px-3 py-1 rounded-full whitespace-nowrap"
          style={{ backgroundColor: price.bg, color: price.fg }}
          title={price.full || undefined}
        >
          {price.text}
        </span>
      </div>
    </a>
  )
}

// The same row as EventRow with the date block swapped for "EVERY / MON". Kept as
// its own component rather than a prop on EventRow: the two differ in what the
// left block reads from and in which field carries the time, and threading both
// through one component made every line of it conditional.
function RegularRow({ event }) {
  const { dow, day } = regularDayParts(event)
  const price = priceLabel(event)
  return (
    <a
      href={event.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="grid grid-cols-[52px_1fr] sm:grid-cols-[68px_1fr_132px] gap-3 sm:gap-5 items-center px-4 sm:px-5 py-3 border-t border-gray-50 first:border-t-0 min-h-[44px] hover:bg-warm focus:bg-warm focus:outline-none"
    >
      <div className="text-center leading-tight">
        <div className="font-bold text-[11px] uppercase tracking-wider text-gray-400">{dow}</div>
        <div className="font-heading font-bold text-lg text-dark mt-0.5">{day}</div>
      </div>
      <div className="min-w-0">
        <div className="font-bold text-base leading-snug text-dark">{event.title}</div>
        <div className="text-[13px] leading-snug text-gray-500 mt-0.5">{regularMeta(event)}</div>
        <span
          className="sm:hidden inline-block font-bold text-xs px-2.5 py-1 rounded-full mt-1.5 whitespace-nowrap"
          style={{ backgroundColor: price.bg, color: price.fg }}
          title={price.full || undefined}
        >
          {price.text}
        </span>
      </div>
      <div className="hidden sm:block text-right">
        <span
          className="inline-block font-bold text-[13px] px-3 py-1 rounded-full whitespace-nowrap"
          style={{ backgroundColor: price.bg, color: price.fg }}
          title={price.full || undefined}
        >
          {price.text}
        </span>
      </div>
    </a>
  )
}

function EditionSkeleton() {
  return (
    <SectionShell>
      <div className="py-16 animate-pulse" aria-hidden="true">
        <div className="h-4 w-40 bg-gray-200 rounded mx-auto" />
        <div className="h-10 w-2/3 max-w-lg bg-gray-200 rounded mx-auto mt-5" />
        <div className="h-1 w-16 bg-gray-200 rounded mx-auto mt-5" />
        <div className="mt-10 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-white border border-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
      <p className="sr-only" role="status">
        Loading this week&apos;s guide.
      </p>
    </SectionShell>
  )
}

function EditionMessage({ title, children }) {
  return (
    <SectionShell>
      <div className="py-20 text-center max-w-xl mx-auto">
        <h1 className="font-heading font-bold text-3xl text-dark">{title}</h1>
        <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-5" />
        <p className="text-base leading-relaxed text-gray-600 mt-5">{children}</p>
        <Link
          to="/whats-on"
          className="inline-flex items-center justify-center min-h-[44px] mt-7 px-6 py-3 rounded-full bg-primary text-white font-bold text-sm hover:bg-primary/90"
        >
          Browse everything that&apos;s on →
        </Link>
      </div>
    </SectionShell>
  )
}

export default function WhatsOnEdition() {
  const { date } = useParams()
  const { events, regulars, presenting, supporters, loading, error } = useEdition(date)

  if (loading) return <EditionSkeleton />

  if (error) {
    return (
      <EditionMessage title="We couldn&rsquo;t load this week">
        Something went wrong fetching this edition. It is usually temporary — try again in a
        moment, or browse the full listings instead.
      </EditionMessage>
    )
  }

  // Regulars are appended, never interleaved: they are the one group with no date,
  // so they read as a reference list at the end rather than as part of the week.
  const groups = [...groupEvents(events), regularsGroup(regulars)].filter(Boolean)
  const totalCount = events.length + regulars.length

  if (groups.length === 0) {
    return (
      <EditionMessage title="Nothing listed for this week yet">
        No events have been published for {formatEditionDate(date) || 'this date'} so far. A quiet
        week is normal — new listings go up through the week, so it is worth checking back.
      </EditionMessage>
    )
  }

  return (
    <div className="py-8 sm:py-12">
      {/* hero */}
      <SectionShell>
        <div className="text-center pb-8">
          <div className="font-bold text-[13px] uppercase tracking-[0.08em] text-gray-500">
            {formatEditionDate(date)}
          </div>
          <h1 className="font-heading font-bold text-3xl sm:text-5xl leading-none text-dark mt-4">
            What&rsquo;s On in Greenwich
          </h1>
          <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-5" />
          <p className="text-base sm:text-lg leading-relaxed text-gray-700 max-w-[620px] mx-auto mt-4 text-pretty">
            {totalCount} {totalCount === 1 ? 'event' : 'events'} this week and beyond, with
            times, prices and booking links. Free things are marked.
          </p>
        </div>
      </SectionShell>

      <PresentingSlot advertiser={presenting} editionDate={date} />

      {/* jump to — scrolls sideways on a phone rather than wrapping into a wall of pills */}
      <SectionShell>
        <div className="flex items-center gap-2 pt-8 pb-2 border-b border-gray-100 overflow-x-auto lg:flex-wrap lg:overflow-visible">
          <span className="font-bold text-xs uppercase tracking-[0.08em] text-gray-500 mr-2 shrink-0">
            Jump to
          </span>
          {groups.map((g) => (
            <a
              key={g.key}
              href={`#group-${g.key}`}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-full bg-white border border-gray-100 shadow-sm font-bold text-sm text-dark whitespace-nowrap mb-4 shrink-0 hover:border-primary focus:ring-2 focus:ring-primary focus:outline-none"
            >
              {g.label} <span className="text-gray-400 font-semibold">{g.count}</span>
            </a>
          ))}
        </div>
      </SectionShell>

      {/* list + rail — one column on a phone, rail underneath */}
      <SectionShell>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 lg:gap-11 pt-9 pb-12 items-start">
          <div className="flex flex-col gap-11 min-w-0">
            {groups.map((g) => (
              <section key={g.key} id={`group-${g.key}`} className="scroll-mt-24">
                <div className="flex items-baseline gap-3">
                  <h2 className="font-heading font-bold text-2xl leading-tight text-dark">
                    {g.label}
                  </h2>
                  <span className="text-sm font-semibold text-gray-500">
                    {g.count} {g.count === 1 ? 'event' : 'events'}
                  </span>
                </div>
                <div className="w-16 h-1 bg-primary rounded-full mt-3 mb-1" />
                <div className="text-sm text-gray-500 mb-2.5">{g.note}</div>
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                  {g.events.map((event) =>
                    g.key === REGULARS_KEY ? (
                      <RegularRow key={event.id} event={event} />
                    ) : (
                      <EventRow key={event.id} event={event} />
                    )
                  )}
                </div>
              </section>
            ))}
          </div>

          <aside className="flex flex-col gap-5 lg:sticky lg:top-6">
            <SupporterRail supporters={supporters} editionDate={date} />
            <SubscribeCard />
            <div className="bg-dark rounded-2xl p-5">
              <div className="font-bold text-[11px] uppercase tracking-[0.08em] text-primary">
                Coming up
              </div>
              <div className="font-heading font-bold text-xl leading-snug text-white mt-2">
                {ORG.name} events
              </div>
              <div className="text-sm leading-relaxed text-white/60 mt-2">
                Meet-ups, fairs and everything we run ourselves.
              </div>
              <Link
                to="/events"
                className="inline-flex items-center min-h-[44px] mt-3 font-bold text-sm text-white hover:underline"
              >
                See GPC events →
              </Link>
            </div>
          </aside>
        </div>
      </SectionShell>
    </div>
  )
}
