import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const { signIn, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Admin Login | Greenwich Parents & Carers'
  }, [])

  useEffect(() => {
    if (user) navigate('/admin', { replace: true })
  }, [user, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await signIn(email, password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError('Invalid email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      })
      if (error) throw error
      setMessage('Check your email for a password reset link.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-warm flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/images/site-logo.png" alt="GPC" className="h-16 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold text-dark">Admin Login</h1>
          <p className="text-gray-500 text-sm mt-1">
            {showReset ? 'Reset your password' : 'Sign in to manage GPC content'}
          </p>
        </div>

        <form onSubmit={showReset ? handleResetPassword : handleSubmit} className="bg-white rounded-2xl shadow-md p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
              {message}
            </div>
          )}

          <label className="block mb-4">
            <span className="text-sm font-semibold text-dark">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              placeholder="your@email.com"
            />
          </label>

          {!showReset && (
            <label className="block mb-2">
              <span className="text-sm font-semibold text-dark">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                placeholder="Enter your password"
              />
            </label>
          )}

          {!showReset && (
            <div className="mb-6 text-right">
              <button
                type="button"
                onClick={() => { setShowReset(true); setError(''); setMessage('') }}
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          {showReset && <div className="mb-2" />}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-dark text-white font-bold text-sm hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 focus:ring-2 focus:ring-primary focus:outline-none"
          >
            {submitting
              ? (showReset ? 'Sending...' : 'Signing in...')
              : (showReset ? 'Send Reset Link' : 'Sign In')
            }
          </button>

          {showReset && (
            <button
              type="button"
              onClick={() => { setShowReset(false); setError(''); setMessage('') }}
              className="w-full mt-3 text-sm text-gray-500 hover:text-dark transition-colors"
            >
              Back to login
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
