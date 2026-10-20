import { CheckCircle2 } from 'lucide-react'
import { CONTACT } from '../../utils/constants'
import { useNewsletterSignup } from '../../hooks/useNewsletterSignup'

// Inline signup for the light sections (homepage "Stay in the loop", Events page).
// This used to link out to a Brevo-hosted form, which put sign-ups in Brevo only:
// never in our database, never on the EmailOctopus list. It now goes through
// /api/subscribe like every other form on the site.
export default function NewsletterForm() {
  const { email, setEmail, status, error, submit } = useNewsletterSignup()

  if (status === 'success' || status === 'already') {
    return (
      <p role="status" className="flex items-center justify-center gap-2 text-sm font-bold text-dark">
        <CheckCircle2 size={18} className="text-green-600 shrink-0" />
        {status === 'already' ? "You're already on the list!" : "You're subscribed! The next one lands on Friday."}
      </p>
    )
  }

  if (status === 'optedOut') {
    return (
      <p role="status" className="text-sm text-gray-700">
        You unsubscribed from this address before, so we haven't re-added it. To rejoin, email{' '}
        <a href={`mailto:${CONTACT.email}`} className="text-[#d1067f] font-bold underline">{CONTACT.email}</a>.
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="max-w-md mx-auto">
      <div className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="newsletter-email" className="sr-only">Email address</label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          required
          className="flex-1 min-h-[44px] rounded-full py-3 px-5 text-sm bg-white border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="min-h-[44px] px-6 py-3 rounded-full bg-gradient-to-r from-primary to-dark text-white text-sm font-bold hover:scale-105 transition-transform focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-60 disabled:hover:scale-100"
        >
          {status === 'submitting' ? 'Subscribing…' : 'Subscribe'}
        </button>
      </div>
      {status === 'error' && (
        <p role="alert" className="text-xs text-red-600 mt-2">{error}</p>
      )}
    </form>
  )
}
