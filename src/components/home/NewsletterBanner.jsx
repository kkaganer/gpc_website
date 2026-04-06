import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, CheckCircle2 } from 'lucide-react'
import { ORG } from '../../utils/constants'

export default function NewsletterBanner() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | submitting | success | error

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('submitting')

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error('Subscribe failed')
      setStatus('success')
      setEmail('')
    } catch {
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

        {status === 'success' ? (
          <span className="flex items-center gap-2 text-green-400 text-sm font-semibold">
            <CheckCircle2 size={16} />
            You're subscribed!
          </span>
        ) : (
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

        {status === 'error' && (
          <span className="text-red-400 text-xs">Something went wrong. Try again.</span>
        )}
      </div>
    </motion.section>
  )
}
