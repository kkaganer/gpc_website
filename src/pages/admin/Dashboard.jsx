import { useEffect } from 'react'
import { Link } from 'react-router'
import {
  CalendarDays,
  MapPin,
  Newspaper,
  Megaphone,
  MailCheck,
  Users,
  ArrowRight,
  BookOpen,
  Sparkles,
  MousePointerClick,
  Palette,
  Copy,
  Eye,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const quickLinks = [
  {
    to: '/admin/events',
    label: 'Events',
    description: 'Create and manage GPC community events, set pricing, upload images, and add sponsors.',
    icon: CalendarDays,
    color: 'bg-pink-50 text-pink-600',
  },
  {
    to: '/admin/whats-on',
    label: "What's On",
    description: 'Manage London events listings. Review, approve, or discover new events to feature.',
    icon: MapPin,
    color: 'bg-purple-50 text-purple-600',
  },
  {
    to: '/admin/newsletter',
    label: 'Newsletter',
    description: 'Generate weekly newsletters, edit them visually by clicking any text, then copy the HTML to paste into Brevo.',
    icon: Newspaper,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    to: '/admin/newsletter-advertisers',
    label: 'Advertisers',
    description: 'Manage newsletter advertisers and track their status through the booking pipeline.',
    icon: Megaphone,
    color: 'bg-amber-50 text-amber-600',
  },
  {
    to: '/admin/subscribers',
    label: 'Subscribers',
    description: 'List everyone who signed up to the newsletter and see whether each one reached Brevo.',
    icon: MailCheck,
    color: 'bg-rose-50 text-rose-600',
  },
  {
    to: '/admin/users',
    label: 'Users',
    description: 'Add or remove admin users who can access this portal.',
    icon: Users,
    color: 'bg-emerald-50 text-emerald-600',
  },
]

const tips = [
  'Use the sidebar on the left to navigate between sections at any time.',
  'When creating events, you can upload images or paste an image URL.',
  "The What's On section has a Discover feature to find London events automatically.",
  'Advertiser statuses track the full pipeline: Pending, Confirmed, Included, Completed.',
  'GPC-hosted events (titles containing "GPC") get a yellow highlight in the newsletter automatically.',
  'Signups from the inline form on the homepage are tracked in Subscribers; the Brevo-hosted form links straight out to Brevo, so those signups only ever appear in Brevo itself.',
]

// Newsletter help — step-by-step walkthrough for the full flow from empty draft to Brevo.
const newsletterSteps = [
  {
    icon: Sparkles,
    title: 'Open the editor',
    body: (
      <>
        Go to <strong>Newsletter</strong> in the sidebar. Click <strong>Open editor</strong> to
        start a fresh draft, or click the pink <strong>Edit</strong> button on an existing draft
        to reopen it exactly how you left it.
      </>
    ),
  },
  {
    icon: Palette,
    title: 'Pick what goes in the newsletter',
    body: (
      <>
        The left sidebar lists every section (Masthead, Featured event, This Week, Coming up,
        Presenting sponsor, Donation bar, Regular activities, Supporter, Footer). Use the{' '}
        <strong>ON / OFF</strong> pill next to a section to include or hide it for this
        newsletter. Click <strong>Colours &amp; branding</strong> at the top to change any theme
        colour for this week only — your changes don&rsquo;t affect future newsletters.
      </>
    ),
  },
  {
    icon: MousePointerClick,
    title: 'Click any text in the preview to edit it',
    body: (
      <>
        Hover over the preview on the right — every editable piece of text (event titles,
        descriptions, dates, sponsor names, button labels, the intro message) gets a pink dashed
        outline. <strong>Click the text you want to change</strong> and the middle panel jumps
        straight to the right field, ready for you to type. The preview updates as you type.
        Click the small <strong>↺</strong> icon to reset a field back to the original value, or
        the eye icon to exclude an event from this newsletter entirely.
      </>
    ),
  },
  {
    icon: Eye,
    title: 'Save your draft',
    body: (
      <>
        Click <strong>Save draft</strong> in the top bar. Your draft is stored with every edit
        intact — come back any time and click the pink <strong>Edit</strong> button on the
        drafts list to resume where you left off. Drafts never overwrite source data in Events
        or What&rsquo;s On; your edits are scoped to this one newsletter.
      </>
    ),
  },
  {
    icon: Copy,
    title: 'Copy HTML and paste into Brevo',
    body: (
      <>
        When you&rsquo;re ready, click <strong>Copy HTML</strong> in the top bar. Open a new
        campaign in Brevo, pick the <strong>Paste HTML</strong> option, and paste. Send a test
        email to yourself first to check it looks right, then schedule or send.
      </>
    ),
  },
]

const newsletterNotes = [
  <>
    <strong>Sponsors</strong> don&rsquo;t come from events — they live in{' '}
    <Link to="/admin/newsletter-advertisers" className="text-primary underline">
      Advertisers
    </Link>
    . For a sponsor to appear in this week&rsquo;s newsletter, their <em>Newsletter Date</em>{' '}
    must match the nearest Friday and their <em>Status</em> must be <em>Confirmed</em> or{' '}
    <em>Included</em>.
  </>,
  <>
    The <strong>Presenting</strong> block pulls a sponsor with ad type <em>Featured Ad</em>; the{' '}
    <strong>Supporter</strong> block pulls one with ad type <em>Logo Sponsor</em>. Only one
    advertiser per slot per week.
  </>,
  <>
    Events from <Link to="/admin/whats-on" className="text-primary underline">What&rsquo;s On</Link>{' '}
    are auto-sorted into <strong>This Week</strong> (next 7 days, SE London),{' '}
    <strong>Coming up</strong> (days 8–21, SE London), or <strong>Further to travel</strong>{' '}
    (outside SE London). Events marked <em>Recurring activity</em> go into the{' '}
    <strong>Regular activities</strong> section instead.
  </>,
  <>
    The <strong>Featured event</strong> block uses the next upcoming row from{' '}
    <Link to="/admin/events" className="text-primary underline">Events</Link>.
  </>,
]

export default function Dashboard() {
  const { user } = useAuth()

  useEffect(() => {
    document.title = 'Dashboard | GPC Admin'
  }, [])

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  return (
    <div className="max-w-4xl">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-dark flex items-center gap-3">
          <Sparkles className="text-primary" size={28} />
          Welcome back, {firstName}!
        </h1>
        <p className="text-gray-500 mt-2">
          This is the GPC Admin Portal, your central hub for managing all Greenwich Parents &amp; Carers content.
        </p>
      </div>

      {/* Quick links grid */}
      <div className="mb-10">
        <h2 className="font-heading text-lg font-semibold text-dark mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickLinks.map(({ to, label, description, icon: Icon, color, comingSoon }) => (
            comingSoon ? (
              <div
                key={to}
                className="bg-white rounded-2xl border border-gray-100 p-5 opacity-50 cursor-not-allowed"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-semibold text-dark">{label}</h3>
                      <span className="text-[10px] uppercase tracking-wider bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                        Soon
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={to}
                to={to}
                className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-primary/20 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-semibold text-dark">{label}</h3>
                      <ArrowRight
                        size={16}
                        className="text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                  </div>
                </div>
              </Link>
            )
          ))}
        </div>
      </div>

      {/* Newsletter walkthrough */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <Newspaper size={20} className="text-primary" />
          <h2 className="font-heading text-lg font-semibold text-dark">How to build a newsletter</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          The five steps below take you from an empty draft to HTML ready to paste into Brevo.
        </p>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
          {newsletterSteps.map(({ icon: Icon, title, body }, i) => (
            <div key={i} className="flex items-start gap-4 p-5">
              <div className="flex items-center justify-center shrink-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon size={18} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-mono text-gray-400">0{i + 1}</span>
                  <h3 className="font-heading font-semibold text-dark">{title}</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* How data flows into the newsletter */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h3 className="font-heading font-semibold text-dark text-sm mb-3">
            Where the newsletter content comes from
          </h3>
          <ul className="space-y-2.5 text-sm text-gray-700">
            {newsletterNotes.map((note, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-600 shrink-0">•</span>
                <span className="leading-relaxed">{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* General tips section */}
      <div className="bg-gradient-to-br from-dark to-dark/90 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen size={20} className="text-primary" />
          <h2 className="font-heading text-lg font-semibold">Other tips</h2>
        </div>
        <ul className="space-y-3">
          {tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-white/80">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
