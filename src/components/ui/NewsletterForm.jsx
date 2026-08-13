import { NEWSLETTER } from '../../utils/constants'

// Hosted signup path: this hands the visitor straight to the Brevo-hosted form in a new
// tab. Nothing is stored on our side and Brevo owns the confirmation, so we have no way
// of reporting on the outcome here. The inline path (NewsletterBanner) is the one that
// talks to /api/subscribe and can tell you what actually happened.
export default function NewsletterForm() {
  return (
    <div className="flex justify-center">
      <a
        href={NEWSLETTER.hostedFormUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-6 py-3 rounded-full bg-gradient-to-r from-primary to-dark text-white text-sm font-bold hover:scale-105 transition-transform focus:ring-2 focus:ring-primary focus:outline-none text-center"
      >
        Subscribe to Our Newsletter
      </a>
    </div>
  )
}
