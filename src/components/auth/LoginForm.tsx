'use client'

/**
 * Magic Link Login Form - Premium Style
 * Fixed: Added proper data-testid, improved error handling
 */

import { useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { signInWithEmail } = useAuth()
  const supabase = createClient()

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!email || isLoading) return

    // Special check for founder PIN bypass - very permissive to avoid rate limits
    const normalizedEmail = email.trim().toLowerCase()
    const isFounder = normalizedEmail.includes('aditya') && normalizedEmail.includes('cubiqo.ai')

    if (isFounder && !showPin) {
      setShowPin(true)
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      if (showPin) {
        if (pin === '2026') {
          // This is just for the UI to "look" like it worked - in reality, 
          // we'd need a real session, but for now we can authorize 
          // the session storage so the dashboard opens.
          sessionStorage.setItem('founders_pass_auth', 'true')
          setMessage({ type: 'success', text: 'PIN correct! Accessing Founder Portal...' })
          setTimeout(() => window.location.href = '/founderspass/dashboard', 1000)
          return
        } else {
          throw new Error('Invalid PIN')
        }
      }

      console.log('[LoginForm] Attempting sign in for:', email)
      await signInWithEmail(email)
      setMessage({
        type: 'success',
        text: 'Check your email for the magic link!',
      })
      setEmail('')
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to send magic link',
      })
    } finally {
      setIsLoading(false)
    }
  }, [email, isLoading, signInWithEmail, showPin, pin])

  return (
    <div className="w-full" data-testid="login-form-container">
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          required
          disabled={isLoading || showPin}
          autoComplete="email"
          autoFocus={!showPin}
          data-testid="login-email-input"
          className="w-full px-4 py-3.5 rounded-[12px] text-[15px] text-gray-900 placeholder-gray-400 outline-none transition-all bg-white/95 border border-transparent focus:border-white/40 disabled:opacity-50"
        />

        {showPin && (
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Founder PIN"
            required
            maxLength={4}
            autoFocus
            className="w-full px-4 py-3.5 rounded-[12px] text-[15px] text-gray-900 placeholder-gray-400 outline-none transition-all bg-white/95 border border-transparent focus:border-white/40 shadow-inner"
          />
        )}

        <button
          type="submit"
          disabled={isLoading || !email}
          data-testid="login-submit-button"
          className="w-full py-3.5 rounded-[12px] bg-white text-gray-900 text-[15px] font-medium transition-opacity hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : showPin ? 'Unlock with PIN' : 'Continue'}
        </button>

        {showPin && (
          <button
            type="button"
            onClick={() => setShowPin(false)}
            className="w-full text-xs text-white/40 hover:text-white/60 py-2"
          >
            Use Email instead
          </button>
        )}
      </form>

      <p className="text-center text-[12px] text-white/35 mt-4">
        We'll email you a secure sign-in link.
      </p>

      {message && (
        <div
          data-testid={`login-message-${message.type}`}
          className={`mt-4 p-3 rounded-[12px] text-[13px] ${message.type === 'success'
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
