'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AuthNudgeModalProps {
  isOpen: boolean
  onClose: () => void
  cta: string // AI-generated personalized CTA
}

export function AuthNudgeModal({ isOpen, onClose, cta }: AuthNudgeModalProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {!sent ? (
            <>
              {/* CTA from AI */}
              <h2 className="text-2xl font-light text-white mb-2 pr-8">
                {cta || "Let's stay connected"}
              </h2>

              {/* Subtitle */}
              <p className="text-zinc-400 text-sm mb-8">
                Just your email. One magic link. No passwords, ever.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Send Magic Link'
                  )}
                </button>
              </form>

              {/* Footer */}
              <p className="text-center text-zinc-600 text-xs mt-6">
                We'll remember everything. Forever.
              </p>
            </>
          ) : (
            /* Success state */
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-light text-white mb-2">
                Check your email
              </h2>
              <p className="text-zinc-400 text-sm mb-6">
                We sent a magic link to <span className="text-white">{email}</span>
              </p>
              <p className="text-zinc-500 text-xs mb-6">
                Click the link to connect. I'll be waiting.
              </p>

              {/* Quick access buttons for email providers */}
              <div className="space-y-2">
                <p className="text-zinc-600 text-xs mb-3">Quick access:</p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      console.log('[AuthNudgeModal] Gmail button clicked')
                      window.open('https://mail.google.com', '_blank')
                    }}
                    className="flex-1 px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                    </svg>
                    Gmail
                  </button>
                  <button
                    onClick={() => {
                      console.log('[AuthNudgeModal] Outlook button clicked')
                      window.open('https://outlook.live.com', '_blank')
                    }}
                    className="flex-1 px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 7.387v9.226a.614.614 0 0 1-.614.614h-8.745a.614.614 0 0 1-.614-.614v-2.826h-2.641v2.826a.614.614 0 0 1-.614.614H2.027a.614.614 0 0 1-.614-.614V7.387c0-.339.275-.614.614-.614h8.745c.339 0 .614.275.614.614v2.826h2.641V7.387c0-.339.275-.614.614-.614h8.745c.339 0 .614.275.614.614z"/>
                    </svg>
                    Outlook
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
