import { useState } from 'react'

// The one signup flow behind every newsletter form on the site (homepage banner,
// homepage section, Events page, What's On edition page). Each posts to
// /api/subscribe, which stores the email in Supabase and pushes it to
// EmailOctopus. A 200 means the email is stored; if the push did not land, the
// nightly sync retries it, so the visitor is told they are subscribed.
//
// status: idle | submitting | success | already | optedOut | error
//   optedOut -> they unsubscribed before. The API does not re-add them from a
//               form, so the form says how to rejoin instead of claiming success.
export function useNewsletterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  async function submit(e) {
    e?.preventDefault()
    setStatus('submitting')
    setError('')

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      // An edge failure can return HTML or an empty body, so never assume JSON.
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Try again.')
        setStatus('error')
        return
      }

      if (data.optedOut) {
        setStatus('optedOut')
        return
      }

      setStatus(data.alreadySubscribed ? 'already' : 'success')
      setEmail('')
    } catch {
      setError('Something went wrong. Try again.')
      setStatus('error')
    }
  }

  return { email, setEmail, status, error, submit }
}
