import { Link } from 'react-router'
import { Instagram, Mail, MapPin } from 'lucide-react'
import { CONTACT, ORG } from '../../utils/constants'

const quickLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/events', label: 'Events' },
  { to: '/gallery', label: 'Gallery' },
]

export default function Footer() {
  return (
    <footer className="bg-dark text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-heading font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-gray-300 hover:text-white transition-colors focus:ring-2 focus:ring-primary focus:outline-none rounded"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-heading font-bold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors focus:ring-2 focus:ring-primary focus:outline-none rounded"
                >
                  <Mail size={16} />
                  {CONTACT.email}
                </a>
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <MapPin size={16} />
                {CONTACT.location}
              </li>
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="text-lg font-heading font-bold mb-4">Follow Us</h3>
            <a
              href={CONTACT.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors focus:ring-2 focus:ring-primary focus:outline-none rounded"
            >
              <Instagram size={20} />
              {CONTACT.instagram}
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-400">
          <p>{ORG.name} CIC | Company No. {ORG.cicNumber}</p>
          <p>&copy; {new Date().getFullYear()} {ORG.shortName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
