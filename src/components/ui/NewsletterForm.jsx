// TODO: Replace this placeholder form with the actual Brevo newsletter iframe embed

import { useState } from 'react'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        // TODO: Replace with Brevo iframe — this is a placeholder
      }}
      className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
      />
      <button
        type="submit"
        className="px-6 py-3 rounded-full bg-gradient-to-r from-primary to-dark text-white text-sm font-bold hover:scale-105 transition-transform focus:ring-2 focus:ring-primary focus:outline-none"
      >
        Subscribe
      </button>
    </form>
  )
}
