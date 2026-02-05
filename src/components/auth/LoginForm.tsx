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
        </div>
      )}
    </div>
  )
}
