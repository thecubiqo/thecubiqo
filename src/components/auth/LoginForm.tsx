'use client'

/**
 * Magic Link Login Form - Premium Style
 * Fixed: Added proper data-testid, improved error handling, rate limiting
 */

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { BiometricLogin } from '@/components/auth/BiometricLogin'

const RATE_LIMIT_WINDOW = 60000 // 60 seconds
const MAX_ATTEMPTS = 3
const SUPABASE_RATE_LIMIT_COOLDOWN = 120 // 2 minutes in seconds
const SUCCESS_MESSAGE_DURATION_MS = 10000 // 10 seconds

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [attemptCount, setAttemptCount] = useState(0)

  const { signInWithEmail, signInAsDeveloper } = useAuth() as any

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setInterval(() => {
        setCooldownSeconds(prev => {
          const newValue = prev - 1
          if (newValue <= 0) {
            setAttemptCount(0)
            return 0
          }
          return newValue
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [cooldownSeconds])

  // Cleanup success message timeout on unmount
  useEffect(() => {
    let successTimeout: NodeJS.Timeout | null = null

    if (message?.type === 'success') {
      successTimeout = setTimeout(() => {
        setMessage(null)
      }, SUCCESS_MESSAGE_DURATION_MS)
    }

    return () => {
      if (successTimeout) {
        clearTimeout(successTimeout)
      }
    }
  }, [message])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Check rate limit
    if (attemptCount >= MAX_ATTEMPTS) {
      setMessage({
        type: 'error',
        text: `Too many attempts. Please wait ${cooldownSeconds}s before trying again.`,
      })
      return
    }

    if (!email || isLoading) return

    setIsLoading(true)
    setMessage(null)

    try {
      console.log('[LoginForm] Attempting sign in for:', email)
      await signInWithEmail(email)
      console.log('[LoginForm] Magic link sent successfully')

      // Success - increment attempt counter and set cooldown
      const newAttemptCount = attemptCount + 1
      setAttemptCount(newAttemptCount)

      setMessage({
        type: 'success',
        text: 'Check your email for the magic link!',
      })
      setEmail('')

      // Start cooldown timer if this was the last allowed attempt
      if (newAttemptCount >= MAX_ATTEMPTS) {
        setCooldownSeconds(RATE_LIMIT_WINDOW / 1000)
      }
    } catch (error) {
      console.error('[LoginForm] Sign in error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to send magic link'

      // Check if it's a rate limit error from Supabase
      if (errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('too many')) {
        setMessage({
          type: 'error',
          text: 'Too many sign-in attempts. Please wait a few minutes before trying again.',
        })
        // Set a longer cooldown for Supabase rate limits
        setCooldownSeconds(SUPABASE_RATE_LIMIT_COOLDOWN)
        setAttemptCount(MAX_ATTEMPTS)
      } else {
        setMessage({
          type: 'error',
          text: errorMessage,
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [email, isLoading, signInWithEmail, attemptCount, cooldownSeconds])

  const isRateLimited = attemptCount >= MAX_ATTEMPTS || cooldownSeconds > 0

  return (
    <div className="w-full" data-testid="login-form-container">
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          required
          disabled={isLoading || isRateLimited}
          autoComplete="email"
          autoFocus
          data-testid="login-email-input"
          className="w-full px-4 py-3.5 rounded-[12px] text-[15px] text-gray-900 placeholder-gray-400 outline-none transition-all bg-white/95 border border-transparent focus:border-white/40 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={isLoading || !email || isRateLimited}
          data-testid="login-submit-button"
          className="w-full py-3.5 rounded-[12px] bg-white text-gray-900 text-[15px] font-medium transition-opacity hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : 'Continue'}
        </button>

        {process.env.NODE_ENV === 'development' && (
          <button
            type="button"
            onClick={() => {
              signInAsDeveloper(email || 'aditya@cubiqo.ai')
                .then(() => setMessage({ type: 'success', text: 'Dev login successful!' }))
                .catch((err: any) => setMessage({ type: 'error', text: err.message }));
            }}
            className="w-full py-2.5 rounded-[12px] bg-yellow-500/20 text-yellow-400 text-[13px] font-medium border border-yellow-500/30 hover:bg-yellow-500/30 transition-all mt-2"
          >
            Manual Login (Dev Bypass)
          </button>
        )}
      </form>

      <p className="text-center text-[12px] text-white/35 mt-4">
        We&apos;ll email you a secure sign-in link.
      </p>

      <div className="mt-6 border-t border-white/10 pt-6">
        <BiometricLogin />
      </div>

      {message && (
        <div
          data-testid={`login-message-${message.type}`}
          className={`mt-4 p-3 rounded-[12px] text-[13px] ${message.type === 'success'
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
                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
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
                    <path d="M24 7.387v9.226a.614.614 0 0 1-.614.614h-8.745a.614.614 0 0 1-.614-.614v-2.826h-2.641v2.826a.614.614 0 0 1-.614.614H2.027a.614.614 0 0 1-.614-.614V7.387c0-.339.275-.614.614-.614h8.745c.339 0 .614.275.614.614v2.826h2.641V7.387c0-.339.275-.614.614-.614h8.745c.339 0 .614.275.614.614z" />
                  </svg>
                  Outlook
                </button>
              </div>
            </div>
          )}

          {message.type === 'success' && cooldownSeconds > 0 && (
            <p className="text-xs mt-2 text-green-300/80">
              You can request another link in {cooldownSeconds} seconds.
            </p>
          )}
          {message.type === 'error' && message.text.toLowerCase().includes('rate limit') && (
            <p className="text-xs mt-2 text-red-300/80">
              This is a security measure to prevent abuse. Please wait before trying again.
            </p>
          )}
        </div>
      )}

      {attemptCount > 0 && attemptCount < MAX_ATTEMPTS && !message && (
        <div className="mt-4 p-3 rounded-[12px] text-[13px] bg-yellow-500/10 text-yellow-400">
          <p className="text-xs">
            Attempts used: {attemptCount}/{MAX_ATTEMPTS}
          </p>
        </div>
      )}
    </div>
  )
}
