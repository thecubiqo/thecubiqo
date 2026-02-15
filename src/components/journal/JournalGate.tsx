'use client'

/**
 * JournalGate Component
 * Shows when user has already journaled today
 * Displays entry summary and next available time
 */

import { useEffect, useState } from 'react'

interface JournalGateProps {
  todayEntry: any
  nextAvailable: string | null
}

export function JournalGate({ todayEntry, nextAvailable }: JournalGateProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  useEffect(() => {
    if (!nextAvailable) return

    const updateTimeRemaining = () => {
      const now = new Date()
      const next = new Date(nextAvailable)
      const diff = next.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining('Available now! Refresh the page.')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      setTimeRemaining(`${hours}h ${minutes}m`)
    }

    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [nextAvailable])

  const entryDate = todayEntry?.created_at
    ? new Date(todayEntry.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Today'

  return (
    <div className="relative min-h-[60vh] flex items-center justify-center">
      {/* Orange glow effects */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 max-w-2xl w-full">
        {/* Card */}
        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl border border-orange-500/30 shadow-2xl shadow-orange-500/10 overflow-hidden">
          {/* Header with orange accent */}
          <div className="relative bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-b border-orange-500/30 px-8 py-6">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative">
              <h2 className="text-3xl font-bold text-white mb-2">
                ✨ Journal Complete
              </h2>
              <p className="text-orange-300/80 text-sm">
                {entryDate}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-8 space-y-6">
            {/* Message */}
            <div className="text-center">
              <p className="text-xl text-white/90 mb-4">
                You've already journaled today.
              </p>
              <p className="text-white/60">
                Your thoughts are safe. Come back tomorrow for your next reflection session.
              </p>
            </div>

            {/* Stats */}
            {todayEntry && (
              <div className="grid grid-cols-3 gap-4 py-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {todayEntry.word_count || 0}
                  </div>
                  <div className="text-xs text-white/50 mt-1">Words</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {Math.floor((todayEntry.duration_seconds || 0) / 60)}
                  </div>
                  <div className="text-xs text-white/50 mt-1">Minutes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400 capitalize">
                    {todayEntry.mood || 'Neutral'}
                  </div>
                  <div className="text-xs text-white/50 mt-1">Mood</div>
                </div>
              </div>
            )}

            {/* Countdown */}
            {timeRemaining && (
              <div className="text-center pt-6 border-t border-white/10">
                <p className="text-sm text-white/50 mb-2">Next journal available in</p>
                <p className="text-2xl font-bold text-orange-400">{timeRemaining}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <a
                href="/"
                className="flex-1 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 transition-all text-center"
              >
                Back to Home
              </a>
              <a
                href="/chat"
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all text-center font-medium"
              >
                Continue Chatting
              </a>
            </div>
          </div>
        </div>

        {/* Quote */}
        <div className="text-center mt-8">
          <p className="text-sm text-white/40 italic">
            "The unexamined life is not worth living." — Socrates
          </p>
        </div>
      </div>
    </div>
  )
}
