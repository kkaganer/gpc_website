import { Link } from 'react-router'
import { Instagram, Mail, MapPin } from 'lucide-react'
import { CONTACT, ORG } from '../../utils/constants'

export default function Footer() {
  return (
    <footer className="bg-dark text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/60">
        <span>{ORG.name} CIC | No. {ORG.cicNumber}</span>

        <div className="flex items-center gap-5">
          <a href={`mailto:${CONTACT.email}`} className="hover:text-primary transition-colors" aria-label="Email">
            <Mail size={16} />
          </a>
          <a href={CONTACT.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" aria-label="Instagram">
            <Instagram size={16} />
          </a>
          <span className="flex items-center gap-1.5 text-xs">
            <MapPin size={12} />
            {CONTACT.location}
          </span>
          <Link to="/privacy" className="hover:text-white transition-colors text-xs">Privacy</Link>
          <span className="text-white/30">|</span>
          <Link to="/gdpr-policy" className="hover:text-white transition-colors text-xs">GDPR</Link>
          <span className="text-white/30">|</span>
          <Link to="/safeguarding-policy" className="hover:text-white transition-colors text-xs">Safeguarding</Link>
        </div>
      </div>
    </footer>
  )
}
