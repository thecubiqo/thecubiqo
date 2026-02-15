'use client'

/**
 * Daily Journal Page
 * 15-20 minute guided journaling flow with BigBoss confessional style
 * Gated: Once per 24 hours
 */

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from '@/hooks/useSession'
import { createClient } from '@/lib/supabase/client'
import { JournalFlow } from '@/components/journal/JournalFlow'
import { JournalGate } from '@/components/journal/JournalGate'

export default function JournalPage() {
  const { session, isGuest } = useSession()
  const [userId, setUserId] = useState<string | null>(null)
  const [canJournal, setCanJournal] = useState<boolean | null>(null)
  const [todayEntry, setTodayEntry] = useState<any>(null)
  const [nextAvailable, setNextAvailable] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get auth user
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null)
    })
  }, [])

  // Check if user can journal today
  useEffect(() => {
    const checkJournalStatus = async () => {
      if (!session?.id) {
        setIsLoading(false)
        return
      }

      try {
        const params = new URLSearchParams({
          sessionId: session.id,
          ...(userId && { userId })
        })

        const response = await fetch(`/api/journal?${params}`)
        const data = await response.json()

        if (response.ok) {
          setCanJournal(data.canJournal)
          setTodayEntry(data.todayEntry)
          setNextAvailable(data.nextAvailableAt)
        } else {
          setError(data.error || 'Failed to check journal status')
        }
      } catch (err) {
        console.error('Error checking journal status:', err)
        setError('Failed to check journal status')
      } finally {
        setIsLoading(false)
      }
    }

    checkJournalStatus()
  }, [session?.id, userId])

  const handleJournalComplete = useCallback(() => {
    // Refresh status after completing journal
    setCanJournal(false)
    window.location.reload()
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-zinc-950/90 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">Q</span>
            </div>
            <span className="font-bold tracking-widest text-sm">CubiQo™</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="text-xs px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 transition-colors"
            >
              Chat
            </Link>
            <Link
              href="/"
              className="text-xs px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 transition-colors"
            >
              Voice Mode
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="relative">
                <div className="absolute -inset-4 bg-orange-500/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-12">
              <div className="inline-block p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <p className="text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Gate: Already Journaled Today */}
          {!isLoading && !error && canJournal === false && (
            <JournalGate
              todayEntry={todayEntry}
              nextAvailable={nextAvailable}
            />
          )}

          {/* Journal Flow: Can Journal */}
          {!isLoading && !error && canJournal === true && (
            <JournalFlow
              sessionId={session?.id || null}
              userId={userId}
              onComplete={handleJournalComplete}
            />
          )}

          {/* No Session State */}
          {!isLoading && !error && !session && (
            <div className="text-center py-12">
              {/* Hero Section */}
              <div className="mb-12">
                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Daily Journal
                </h2>
                <p className="text-xl text-white/80 mb-2">
                  Your private space for guided reflection
                </p>
                <p className="text-white/60 max-w-2xl mx-auto">
                  8 powerful prompts • 15-20 minutes • Once per day
                </p>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
                <div className="p-6 rounded-xl bg-purple-500/10 border border-purple-500/30">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2 text-purple-300">Daily Ritual</h3>
                  <p className="text-sm text-white/60">Start or end your day with intentional reflection</p>
                </div>

                <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2 text-blue-300">Private & Secure</h3>
                  <p className="text-sm text-white/60">Your thoughts are encrypted and never shared</p>
                </div>

                <div className="p-6 rounded-xl bg-pink-500/10 border border-pink-500/30">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-pink-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2 text-pink-300">AI-Guided</h3>
                  <p className="text-sm text-white/60">Thoughtful prompts that evolve with your journey</p>
                </div>
              </div>

              {/* Preview Section */}
              <div className="max-w-2xl mx-auto mb-12 p-8 rounded-2xl bg-zinc-900/50 border border-white/10">
                <h3 className="text-lg font-semibold mb-4 text-white/90">What you'll explore:</h3>
                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-400 text-xs">1</span>
                    </div>
                    <p className="text-white/70 text-sm">How are you feeling right now?</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-400 text-xs">2</span>
                    </div>
                    <p className="text-white/70 text-sm">What's on your mind today?</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-400 text-xs">3</span>
                    </div>
                    <p className="text-white/70 text-sm">What are you grateful for?</p>
                  </div>
                  <div className="text-center pt-2">
                    <span className="text-white/40 text-xs">+ 5 more reflective prompts</span>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-4 max-w-md mx-auto">
                <Link
                  href="/auth"
                  className="block w-full px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all font-semibold shadow-lg shadow-purple-500/30 text-lg"
                >
                  Sign In to Start Journaling
                </Link>
                <p className="text-xs text-white/40">
                  New to CubiQo? Signing in will create your account automatically
                </p>
                <Link
                  href="/"
                  className="block text-sm text-white/60 hover:text-white/80 transition-colors"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
