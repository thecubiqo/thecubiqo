'use client'

/**
 * Magic Link Login Form - Premium Style
 * Fixed: Added proper data-testid, improved error handling
 */

import { useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { signInWithEmail } = useAuth()

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!email || isLoading) return

    setIsLoading(true)
    setMessage(null)

    try {
      console.log('[LoginForm] Attempting sign in for:', email)
      await signInWithEmail(email)
      console.log('[LoginForm] Magic link sent successfully')
      setMessage({
        type: 'success',
        text: 'Check your email for the magic link!',
      })
      setEmail('')
    } catch (error) {
      console.error('[LoginForm] Sign in error:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to send magic link',
      })
    } finally {
      setIsLoading(false)
    }
  }, [email, isLoading, signInWithEmail])

  return (
    <div className="w-full" data-testid="login-form-container">
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          required
          disabled={isLoading}
          autoComplete="email"
          autoFocus
          data-testid="login-email-input"
          className="w-full px-4 py-3.5 rounded-[12px] text-[15px] text-gray-900 placeholder-gray-400 outline-none transition-all bg-white/95 border border-transparent focus:border-white/40 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={isLoading || !email}
          data-testid="login-submit-button"
          className="w-full py-3.5 rounded-[12px] bg-white text-gray-900 text-[15px] font-medium transition-opacity hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : 'Continue'}
        </button>
      </form>

      <p className="text-center text-[12px] text-white/35 mt-4">
        We'll email you a secure sign-in link.
      </p>

      {message && (
        <div
          data-testid={`login-message-${message.type}`}
          className={`mt-4 p-3 rounded-[12px] text-[13px] ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-400'
              : 'bg-red-500/10 text-red-400'
          }`}
        >
          {message.text}
          
          {/* Show provider buttons on success */}
          {message.type === 'success' && (
            <div className="mt-4 space-y-2">
              <p className="text-white/50 text-[11px]">Quick access:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    console.log('[LoginForm] Gmail button clicked')
                    window.open('https://mail.google.com', '_blank')
                  }}
                  className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[8px] text-white text-[12px] transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                  </svg>
                  Gmail
                </button>
                <button
                  onClick={() => {
                    console.log('[LoginForm] Outlook button clicked')
                    window.open('https://outlook.live.com', '_blank')
                  }}
                  className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[8px] text-white text-[12px] transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 7.387v9.226a.614.614 0 0 1-.614.614h-8.745a.614.614 0 0 1-.614-.614v-2.826h-2.641v2.826a.614.614 0 0 1-.614.614H2.027a.614.614 0 0 1-.614-.614V7.387c0-.339.275-.614.614-.614h8.745c.339 0 .614.275.614.614v2.826h2.641V7.387c0-.339.275-.614.614-.614h8.745c.339 0 .614.275.614.614z"/>
                  </svg>
                  Outlook
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
