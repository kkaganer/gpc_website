import { useEffect } from 'react'
import { Link } from 'react-router'
import {
  CalendarDays,
  MapPin,
  Newspaper,
  Megaphone,
  Users,
  ArrowRight,
  BookOpen,
  Sparkles,
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
    description: 'Generate and edit newsletters with AI assistance, then export HTML for distribution.',
    icon: Newspaper,
    color: 'bg-blue-50 text-blue-600',
    comingSoon: true,
  },
  {
    to: '/admin/newsletter-advertisers',
    label: 'Advertisers',
    description: 'Manage newsletter advertisers and track their status through the booking pipeline.',
    icon: Megaphone,
    color: 'bg-amber-50 text-amber-600',
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
  'Newsletters can be generated with AI — just pick the events and click Generate.',
  'Advertiser statuses track the full pipeline: Pending, Confirmed, Included, Completed.',
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
          This is the GPC Admin Portal — your central hub for managing all Greenwich Parents &amp; Carers content.
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

      {/* Tips section */}
      <div className="bg-gradient-to-br from-dark to-dark/90 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen size={20} className="text-primary" />
          <h2 className="font-heading text-lg font-semibold">Tips &amp; How-To</h2>
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
