import { useState } from 'react'
import { NavLink, Link } from 'react-router'
import { Menu, X, Instagram } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CONTACT } from '../../utils/constants'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/events', label: 'Events' },
  { to: '/whats-on', label: "What's On" },
]

function NavItem({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `relative px-1 py-2 text-sm font-semibold transition-colors focus:ring-2 focus:ring-primary focus:outline-none rounded ${
          isActive ? 'text-primary' : 'text-dark hover:text-primary'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {label}
          {isActive && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </>
      )}
    </NavLink>
  )
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav aria-label="Main navigation" className="sticky top-0 z-50 bg-warm/95 backdrop-blur-sm border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="focus:ring-2 focus:ring-primary focus:outline-none rounded">
          <img src="/images/site-logo.png" alt="Greenwich Parents & Carers" className="h-16" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <NavItem key={link.to} {...link} />
          ))}
          <a
            href="https://sh1.sendinblue.com/amn2zqxhtxpfe.html?t=1774565443585"
            target="_blank"
            rel="noopener noreferrer"
            className="relative px-1 py-2 text-sm font-semibold transition-colors focus:ring-2 focus:ring-primary focus:outline-none rounded text-dark hover:text-primary"
          >
            Newsletter
          </a>
          <a
            href={CONTACT.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-dark hover:text-primary transition-colors focus:ring-2 focus:ring-primary focus:outline-none rounded p-1"
            aria-label="Follow us on Instagram"
          >
            <Instagram size={20} />
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-dark hover:text-primary transition-colors focus:ring-2 focus:ring-primary focus:outline-none rounded"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              className="fixed top-0 right-0 z-50 h-full w-64 bg-warm shadow-xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <img src="/images/site-logo.png" alt="Greenwich Parents & Carers" className="h-8" />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 text-dark hover:text-primary transition-colors focus:ring-2 focus:ring-primary focus:outline-none rounded"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex flex-col gap-2 p-4">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-lg text-base font-semibold transition-colors focus:ring-2 focus:ring-primary focus:outline-none ${
                        isActive
                          ? 'text-primary bg-primary/10'
                          : 'text-dark hover:text-primary hover:bg-primary/5'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                <a
                  href="https://sh1.sendinblue.com/amn2zqxhtxpfe.html?t=1774565443585"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg text-base font-semibold text-dark hover:text-primary hover:bg-primary/5 transition-colors focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  Newsletter
                </a>
                <a
                  href={CONTACT.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-base font-semibold text-dark hover:text-primary hover:bg-primary/5 transition-colors focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <Instagram size={20} />
                  Instagram
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  )
}
