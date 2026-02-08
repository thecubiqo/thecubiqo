/**
 * Founder Login Page
 * 
 * Special login page for founders with email PIN verification
 * Regular users use the standard auth flow
 */

'use client'

import { useState } from 'react'
import { signInWithMagicLink } from '@/lib/auth/actions'
import { isFounder } from '@/lib/auth/founders'

export default function FounderLoginPage() {
  const [email, setEmail] = useState('aditya@cubiqo.ai')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    // Verify it's a founder email
    if (!isFounder(email)) {
      setError('This email is not authorized as a founder account.')
      setLoading(false)
      return
    }

    // Send magic link
    const result = await signInWithMagicLink(email)

    if (result.success) {
      setMessage(result.message || 'Check your email for the login link!')
    } else {
      setError(result.error || 'Failed to send login link')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl mb-4">
            <svg
              className="w-12 h-12 text-purple-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Founder Access</h1>
          <p className="text-gray-400">
            Login with your founder email to access the full system
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Founder Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aditya@cubiqo.ai"
                required
                className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Messages */}
            {message && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <p className="text-green-400 text-sm">{message}</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending login link...
                </span>
              ) : (
                'Send Login Link'
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-sm text-gray-400 text-center">
              A magic link will be sent to your email.
              <br />
              Click the link to login with full founder access.
            </p>
          </div>
        </div>

        {/* Back to regular login */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back to regular login
          </a>
        </div>
      </div>
    </div>
  )
}
