import { motion } from 'framer-motion'
import { Mail, CheckCircle2 } from 'lucide-react'
import { CONTACT, ORG } from '../../utils/constants'
import { useNewsletterSignup } from '../../hooks/useNewsletterSignup'

// Inline signup strip at the top of the homepage. The flow itself lives in
// useNewsletterSignup, shared with every other newsletter form on the site.
export default function NewsletterBanner() {
  const { email, setEmail, status, error, submit } = useNewsletterSignup()
  const done = status === 'success' || status === 'already' || status === 'optedOut'

  return (
    <motion.section
      id="newsletter-banner"
      className="bg-dark py-3 px-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
        <p className="text-white text-sm flex items-center gap-2">
          <Mail size={16} className="text-primary shrink-0" />
          Stay in the loop. Join {ORG.memberCount} Greenwich parents
        </p>

        {!done && (
          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              required
              className="rounded-full py-2 px-4 text-sm bg-white/10 text-white placeholder-white/50 border border-white/20 focus:border-primary focus:outline-none w-full sm:w-48"
            />
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="bg-primary text-white rounded-full py-2 px-5 text-sm font-bold hover:bg-primary/90 transition-colors focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
            >
              {status === 'submitting' ? '...' : 'Subscribe'}
            </button>
          </form>
        )}

        <div role="status" aria-live="polite">
          {(status === 'success' || status === 'already') && (
            <span className="flex items-center gap-2 text-green-400 text-sm font-semibold">
              <CheckCircle2 size={16} />
              {status === 'already' ? "You're already on the list!" : "You're subscribed!"}
            </span>
          )}

          {status === 'optedOut' && (
            <span className="text-amber-300 text-xs">
              You unsubscribed from this address before, so we haven't re-added it. To rejoin, email{' '}
              <a
                href={`mailto:${CONTACT.email}`}
                className="underline font-semibold text-amber-200 hover:text-white focus:ring-2 focus:ring-amber-300 focus:outline-none"
              >
                {CONTACT.email}
              </a>
            </span>
          )}

          {status === 'error' && (
            <span className="text-red-400 text-xs">{error}</span>
          )}
        </div>
      </div>
    </motion.section>
  )
}
