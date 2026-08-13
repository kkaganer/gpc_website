import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, CheckCircle2 } from 'lucide-react'
import { NEWSLETTER, ORG } from '../../utils/constants'

// Inline signup path: posts to /api/subscribe, which stores the email in Supabase and
// then tries to push it to Brevo. A 200 only means the row was stored — the `brevo`
// field says whether the Brevo write actually landed, so we never claim success for it.
export default function NewsletterBanner() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | submitting | success | partial | error
  const [alreadySubscribed, setAlreadySubscribed] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [fallbackUrl, setFallbackUrl] = useState(NEWSLETTER.hostedFormUrl)

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMessage('')
    setAlreadySubscribed(false)

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      // An edge failure can return HTML or an empty body, so never assume JSON.
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setErrorMessage(data.error || 'Something went wrong. Try again.')
        setStatus('error')
        return
      }

      if (data.brevo === 'synced') {
        setAlreadySubscribed(Boolean(data.alreadySubscribed))
        setStatus('success')
        setEmail('')
        return
      }

      // Stored with us, but Brevo did not take it. Point them at the hosted form and
      // keep what they typed so they are not asked to retype it.
      setFallbackUrl(data.fallbackUrl || NEWSLETTER.hostedFormUrl)
      setStatus('partial')
    } catch {
      setErrorMessage('Something went wrong. Try again.')
      setStatus('error')
    }
  }

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

        {status !== 'success' && (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
          {status === 'success' && (
            <span className="flex items-center gap-2 text-green-400 text-sm font-semibold">
              <CheckCircle2 size={16} />
              {alreadySubscribed ? "You're already on the list!" : "You're subscribed!"}
            </span>
          )}

          {status === 'partial' && (
            <span className="text-amber-300 text-xs">
              We've got your email, but couldn't finish signing you up —{' '}
              <a
                href={fallbackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-200 hover:text-white focus:ring-2 focus:ring-amber-300 focus:outline-none"
              >
                complete it here
              </a>
            </span>
          )}

          {status === 'error' && (
            <span className="text-red-400 text-xs">{errorMessage}</span>
          )}
        </div>
      </div>
    </motion.section>
  )
}
