import { Link } from 'react-router'
import { ORG, CONTACT } from '../utils/constants'

// The rate card, as a page.
//
// The point of publishing it rather than answering enquiries one at a time is
// that the free tier is stated as plainly as the paid ones. A community listing
// is free forever and looks like every other listing; saying so here is what
// makes the paid tiers honest rather than a shakedown.

const NEWS_EMAIL = 'gpc.communitynews@gmail.com'

const SPEC_LABELS = ['Placement', 'Frequency', 'You supply', 'Click target', 'Reporting']

const TIERS = [
  {
    key: 'presenting',
    tier: 'Tier 1',
    name: 'Presenting',
    blurb:
      'One per edition. Top of the email and top of the web page. Photo, full details, your own action.',
    spec: {
      Placement: 'Email above the picks; web page above the list',
      Frequency: 'Once per edition, exclusive',
      'You supply': 'Photo 1104×400, 25-word description, details, one link',
      'Click target': 'The whole card',
      Reporting: 'Click count, weekly',
    },
  },
  {
    key: 'supporter',
    tier: 'Tier 2',
    name: 'Supporter',
    blurb:
      'Several per edition. Your logo in the row — email footer area, and every page of the web guide, all week.',
    spec: {
      Placement: 'Email footer area; web rail, persistent',
      Frequency: 'Up to four per edition',
      'You supply': 'Logo (PNG/SVG, any shape), business name, one link',
      'Click target': 'The whole tile',
      Reporting: 'Click count, weekly',
    },
  },
  {
    key: 'listing',
    tier: 'Tier 3',
    name: 'Community listing',
    blurb:
      'Free, and always will be. Your event appears as an ordinary line in the list, exactly like every other.',
    spec: {
      Placement: 'Web list only, in date order',
      Frequency: 'Unlimited, subject to space',
      'You supply': 'Title, date, venue, price',
      'Click target': 'Row links to the venue, shared with all listings',
      Reporting: 'None',
    },
  },
]

function SpecTable({ spec }) {
  return (
    <dl className="grid grid-cols-[104px_1fr] gap-x-4 gap-y-2.5 text-sm">
      {SPEC_LABELS.map((label) => (
        <div key={label} className="contents">
          <dt className="font-bold text-[11px] uppercase tracking-wider text-gray-500 pt-0.5">
            {label}
          </dt>
          <dd className="text-gray-700 leading-snug">{spec[label]}</dd>
        </div>
      ))}
    </dl>
  )
}

function ExampleFrame({ label, children }) {
  return (
    <div>
      <div className="font-bold text-[11px] uppercase tracking-wider text-gray-400 mb-2">
        {label}
      </div>
      {children}
    </div>
  )
}

// Tier 1, event mode: a photo, the details, and the advertiser's own action.
function PresentingEventExample() {
  return (
    <div className="rounded-xl overflow-hidden bg-white border border-gray-100 border-t-[3px] border-t-primary">
      <div className="bg-[#fff5fb] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#d1067f]">
        Presenting partner · paid placement
      </div>
      <div className="h-24 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
        Your photo
      </div>
      <div className="p-4">
        <div className="font-heading font-bold text-lg text-dark">Latino Bambino</div>
        <p className="text-sm text-gray-600 mt-1">
          Baby-wearing Salsa for new mums, plus toddler dance.
        </p>
        <div className="text-[13px] text-gray-600 mt-2 leading-snug">
          Wed 10:30–11:10am (1–4 yrs) · £15 trial
          <br />
          Unit 24, 53 Norman Rd, SE10 9QF
        </div>
        <span className="inline-flex items-center min-h-[40px] mt-3 px-4 py-2 border-2 border-primary rounded-full text-[#d1067f] font-bold text-sm">
          Book a trial class →
        </span>
      </div>
    </div>
  )
}

// Tier 1, brand mode: no event, so no date block and no photo — just the name,
// a line, and where to go.
function PresentingBrandExample() {
  return (
    <div className="rounded-xl overflow-hidden bg-white border border-gray-100 border-t-[3px] border-t-primary">
      <div className="bg-[#fff5fb] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#d1067f]">
        Presenting partner · paid placement
      </div>
      <div className="p-4">
        <div className="font-heading font-bold text-lg text-dark">Hera Therapy</div>
        <p className="text-sm text-gray-600 mt-1">
          Baby massage and postnatal support in West Greenwich.
        </p>
        <span className="inline-block mt-3 text-[#d1067f] font-bold text-sm">
          heratherapy.co.uk →
        </span>
      </div>
    </div>
  )
}

function SupporterRowExample() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="grid grid-cols-2 gap-2">
        {['Hera Therapy', 'Waves Massage', 'Little Feet', 'Bloom Studio'].map((name) => (
          <div
            key={name}
            className="flex items-center justify-center text-center min-h-[56px] p-2 border border-gray-100 rounded-lg bg-white font-bold text-xs text-dark"
          >
            {name}
          </div>
        ))}
      </div>
      <p className="text-[13px] text-gray-500 mt-3 leading-snug">
        Every logo sits in an equal tile with the same padding, so a wide wordmark and a square
        badge read as one set. The tile falls back to your business name when images are blocked.
      </p>
    </div>
  )
}

function ListingExample() {
  const rows = [
    { dow: 'Tue', day: '16', title: 'Story & Rhyme Time', meta: 'Eltham Library · 10.15am', price: 'Free' },
    { dow: 'Wed', day: '17', title: 'Latino Bambino', meta: 'Norman Rd · 10.30am', price: '£15' },
    { dow: 'Wed', day: '17', title: 'Sensory Play Session', meta: 'Charlton House · 1pm', price: '£5' },
  ]
  return (
    <div>
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {rows.map((r) => (
          <div
            key={r.title}
            className="grid grid-cols-[52px_1fr_auto] gap-3 items-center px-4 py-2.5 border-t border-gray-50 first:border-t-0"
          >
            <div className="text-center leading-tight">
              <div className="font-bold text-[10px] uppercase text-gray-400">{r.dow}</div>
              <div className="font-heading font-bold text-base text-dark">{r.day}</div>
            </div>
            <div>
              <div className="font-bold text-sm text-dark">{r.title}</div>
              <div className="text-xs text-gray-500">{r.meta}</div>
            </div>
            <span className="font-bold text-xs px-2.5 py-1 rounded-full bg-gray-50 text-gray-600">
              {r.price}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[13px] text-gray-500 mt-3 leading-snug">
        Same advertiser as Tier 1, listed free: one line, no photo, no link of your own, no
        guarantee anyone reaches row 34. The plainness is the point.
      </p>
    </div>
  )
}

const EXAMPLES = {
  presenting: (
    // Stacked, not side by side: these sit inside a third-width column on
    // desktop, and two-up in there squeezed every line to three words.
    <div className="grid grid-cols-1 gap-5">
      <ExampleFrame label="Event mode">
        <PresentingEventExample />
      </ExampleFrame>
      <ExampleFrame label="Brand mode">
        <PresentingBrandExample />
      </ExampleFrame>
    </div>
  ),
  supporter: (
    <ExampleFrame label="Full row">
      <SupporterRowExample />
    </ExampleFrame>
  ),
  listing: (
    <ExampleFrame label="In context">
      <ListingExample />
    </ExampleFrame>
  ),
}

export default function Advertise() {
  return (
    <div className="py-10 sm:py-16">
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-10">
        <header className="text-center max-w-[720px] mx-auto">
          <h1 className="font-heading font-bold text-3xl sm:text-5xl leading-tight text-dark">
            Advertise in the What&rsquo;s On Guide
          </h1>
          <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-5" />
          <p className="text-base sm:text-lg leading-relaxed text-gray-700 mt-5 text-pretty">
            One email every Friday to {ORG.memberCount} Greenwich parents, and a web guide they
            come back to all week. Three tiers. Every paid slot has one clickable target, so we
            report click counts back to you.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12">
          {TIERS.map((tier) => (
            <section
              key={tier.key}
              className="flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100">
                <div className="font-bold text-[11px] uppercase tracking-[0.08em] text-[#d1067f]">
                  {tier.tier}
                </div>
                <h2 className="font-heading font-bold text-2xl text-dark mt-1.5">{tier.name}</h2>
                <p className="text-sm leading-relaxed text-gray-600 mt-2">{tier.blurb}</p>
              </div>
              <div className="p-6 border-b border-gray-100 bg-warm/60 flex-1">
                {EXAMPLES[tier.key]}
              </div>
              <div className="p-6">
                <SpecTable spec={tier.spec} />
              </div>
            </section>
          ))}
        </div>

        {/* Unsold states, shown deliberately: an advertiser should know what the
            page looks like on a week nobody bought it. */}
        <section className="mt-16">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-dark text-center">
            When a slot doesn&rsquo;t sell
          </h2>
          <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-4" />
          <p className="text-base leading-relaxed text-gray-700 max-w-[620px] mx-auto mt-4 text-center">
            An unfilled slot renders as GPC&rsquo;s own invitation, at the same size as the paid
            one. Nothing collapses, nothing looks broken.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div>
              <div className="font-bold text-[11px] uppercase tracking-wider text-gray-400 mb-2">
                Presenting, unsold
              </div>
              <div className="rounded-xl bg-white border border-dashed border-gray-200 border-t-[3px] border-t-primary p-6 text-center">
                <div className="font-bold text-[11px] uppercase tracking-wider text-[#d1067f]">
                  This space
                </div>
                <div className="font-heading font-bold text-xl text-dark mt-2">
                  Want to feature your business?
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  One business per edition reaches {ORG.memberCount} Greenwich parents here.
                </p>
                <span className="inline-flex items-center min-h-[40px] mt-4 px-5 py-2 border-2 border-primary rounded-full text-[#d1067f] font-bold text-sm">
                  Talk to us →
                </span>
              </div>
              <p className="text-[13px] text-gray-500 mt-3 leading-snug">
                Same footprint, same pink top rule, dashed instead of solid. It reads as an offer,
                not a gap.
              </p>
            </div>
            <div>
              <div className="font-bold text-[11px] uppercase tracking-wider text-gray-400 mb-2">
                Supporter row, two of four sold
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-2">
                  {['Hera Therapy', 'Waves Massage'].map((n) => (
                    <div
                      key={n}
                      className="flex items-center justify-center min-h-[56px] p-2 border border-gray-100 rounded-lg font-bold text-xs text-dark"
                    >
                      {n}
                    </div>
                  ))}
                  <div className="col-span-2 flex items-center justify-center min-h-[56px] p-2 border-2 border-dashed border-primary/40 rounded-lg font-bold text-xs text-[#d1067f]">
                    2 spaces left this week →
                  </div>
                </div>
              </div>
              <p className="text-[13px] text-gray-500 mt-3 leading-snug">
                Below four logos the remainder becomes one house tile rather than leaving holes.
                The grid never shows an empty cell.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16 bg-dark rounded-2xl p-8 sm:p-10 text-center">
          <h2 className="font-heading font-bold text-2xl text-white">Talk to us</h2>
          <p className="text-base leading-relaxed text-white/70 mt-3 max-w-[560px] mx-auto">
            Tell us which tier you are after and the week you have in mind. We will confirm what is
            still free and what it costs.
          </p>
          <a
            href={`mailto:${NEWS_EMAIL}?subject=${encodeURIComponent("Advertising in the What's On Guide")}`}
            className="inline-flex items-center justify-center min-h-[44px] mt-6 px-7 py-3 rounded-full bg-primary text-white font-bold text-sm hover:bg-primary/90"
          >
            Email {NEWS_EMAIL}
          </a>
          <p className="text-sm text-white/50 mt-5">
            Running a free community event?{' '}
            <Link to="/whats-on" className="text-white underline">
              Submit it for the listings
            </Link>{' '}
            — that is always free.
          </p>
        </section>
      </div>
    </div>
  )
}
