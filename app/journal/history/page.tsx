'use client'

/**
 * Journal History Page
 * Display all past journal entries with search and pagination
 */

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from '@/hooks/useSession'
import { createClient } from '@/lib/supabase/client'
import { JournalHistory } from '@/components/journal/JournalHistory'
import { JournalHistoryEntry, JournalHistoryResponse } from '@/types/journal-history'

export default function JournalHistoryPage() {
  const { session } = useSession()
  const [userId, setUserId] = useState<string | null>(null)
  const [entries, setEntries] = useState<JournalHistoryEntry[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 30

  // Get auth user
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null)
    })
  }, [])

  // Fetch journal entries
  const fetchEntries = useCallback(
    async (reset: boolean = false, searchTerm?: string, currentOffset?: number) => {
      if (!session?.id && !userId) {
        setIsLoading(false)
        return
      }

      try {
        const offsetToUse = reset ? 0 : (currentOffset ?? offset)
        if (!reset) {
          setIsLoadingMore(true)
        }

        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: offsetToUse.toString(),
          ...(searchTerm && { search: searchTerm })
        })

        const response = await fetch(`/api/journal/history?${params}`)
        const data: JournalHistoryResponse = await response.json()

        if (response.ok && data.success) {
          if (reset) {
            setEntries(data.entries)
            setOffset(limit)
          } else {
            setEntries(prev => [...prev, ...data.entries])
            setOffset(prev => prev + limit)
          }
          setHasMore(data.pagination.hasMore)
          setError(null)
        } else {
          setError(data.error || 'Failed to fetch journal history')
        }
      } catch (err) {
        console.error('Error fetching journal history:', err)
        setError('Failed to fetch journal history')
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [session?.id, userId, offset, limit]
  )

  // Initial load
  useEffect(() => {
    if (session?.id || userId) {
      setIsLoading(true)
      fetchEntries(true, searchQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, userId])

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        setIsLoading(true)
        setOffset(0)
        fetchEntries(true, searchQuery)
      }
    }, 500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  const handleLoadMore = useCallback(() => {
    fetchEntries(false, searchQuery, offset)
  }, [fetchEntries, searchQuery, offset])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
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
              href="/journal"
              className="text-xs px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 transition-colors"
            >
              Daily Journal
            </Link>
            <Link
              href="/chat"
              className="text-xs px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 transition-colors"
            >
              Chat
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8 text-center">
            <div className="relative inline-block mb-4">
              {/* Orange glow */}
              <div className="absolute -inset-4 bg-orange-500/20 rounded-full blur-2xl" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              Journal History
            </h1>
            <p className="text-white/60">
              Your journey through reflection and growth
            </p>
          </div>

          {/* Loading State */}
          {isLoading && entries.length === 0 && (
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

          {/* No Session State */}
          {!isLoading && !error && !session && !userId && (
            <div className="text-center py-12">
              <div className="inline-block p-8 rounded-2xl bg-zinc-900/50 border border-white/10">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-white/80 mb-4">Sign in to view your journal history</p>
                <Link
                  href="/auth"
                  className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all font-medium"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}

          {/* History Component */}
          {!isLoading && !error && (session || userId) && (
            <JournalHistory
              entries={entries}
              hasMore={hasMore}
              isLoading={isLoadingMore}
              onLoadMore={handleLoadMore}
              onSearch={handleSearch}
              searchQuery={searchQuery}
            />
          )}
        </div>
      </main>
    </div>
  )
}
