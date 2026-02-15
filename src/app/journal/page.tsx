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
              <h2 className="text-2xl font-bold mb-4">Welcome to Daily Journal</h2>
              <p className="text-white/60 mb-6">
                Please start a session to access your daily journal
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all"
              >
                Go to Home
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
