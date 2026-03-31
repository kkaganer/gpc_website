import { NavLink, Outlet, useNavigate } from 'react-router'
import { LayoutDashboard, CalendarDays, MapPin, Newspaper, Megaphone, Users, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const sidebarLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/events', label: 'Events', icon: CalendarDays },
  { to: '/admin/whats-on', label: "What's On", icon: MapPin },
  { to: '/admin/newsletter', label: 'Newsletter', icon: Newspaper, comingSoon: true },
  { to: '/admin/newsletter-advertisers', label: 'Advertisers', icon: Megaphone },
  { to: '/admin/users', label: 'Users', icon: Users },
]

export default function AdminLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-dark text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10">
          <img src="/images/site-logo.png" alt="GPC" className="h-10" />
          <p className="text-xs text-white/50 mt-2">Admin Panel</p>
        </div>

        <nav className="flex-1 py-4">
          {sidebarLinks.map(({ to, label, icon: Icon, end, comingSoon }) => (
            comingSoon ? (
              <div
                key={to}
                className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-white/30 cursor-not-allowed"
              >
                <Icon size={18} />
                {label}
                <span className="ml-auto text-[10px] uppercase tracking-wider bg-white/10 text-white/40 px-2 py-0.5 rounded-full">
                  Soon
                </span>
              </div>
            ) : (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/20 text-primary border-r-2 border-primary'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            )
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
