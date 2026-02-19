'use client'

/**
 * JournalHistory Component
 * Displays list of past journal entries with search and pagination
 */

import { useState, useCallback } from 'react'
import { JournalHistoryEntry } from '@/types/journal-history'
import { JournalEntryModal } from './JournalEntryModal'

interface JournalHistoryProps {
  entries: JournalHistoryEntry[]
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  onSearch: (query: string) => void
  searchQuery: string
}

export function JournalHistory({
  entries,
  hasMore,
  isLoading,
  onLoadMore,
  onSearch,
  searchQuery
}: JournalHistoryProps) {
  const [selectedEntry, setSelectedEntry] = useState<JournalHistoryEntry | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleEntryClick = useCallback((entry: JournalHistoryEntry) => {
    setSelectedEntry(entry)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedEntry(null), 300)
  }, [])

  const getPreviewText = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + '...'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getMoodBadgeColor = (mood: string | null) => {
    if (!mood) return 'bg-gray-500/20 border-gray-500/30 text-gray-400'
    const moodLower = mood.toLowerCase()
    if (moodLower.includes('energized') || moodLower.includes('playful')) 
      return 'bg-orange-500/20 border-orange-500/30 text-orange-400'
    if (moodLower.includes('calm') || moodLower.includes('reflective')) 
      return 'bg-blue-500/20 border-blue-500/30 text-blue-400'
    if (moodLower.includes('focused') || moodLower.includes('serious')) 
      return 'bg-purple-500/20 border-purple-500/30 text-purple-400'
    if (moodLower.includes('urgent')) 
      return 'bg-red-500/20 border-red-500/30 text-red-400'
    return 'bg-orange-500/20 border-orange-500/30 text-orange-400'
  }

  return (
    <>
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search your journal entries..."
            className="w-full px-4 py-3 pl-12 bg-zinc-900/50 border border-orange-500/30 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
          />
          <svg 
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Entry Grid */}
        {entries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => handleEntryClick(entry)}
                className="group relative p-6 rounded-xl bg-zinc-900/50 border border-white/10 hover:border-orange-500/50 hover:bg-zinc-900/70 transition-all cursor-pointer"
              >
                {/* Orange glow on hover */}
                <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-orange-500/0 via-orange-500/0 to-orange-500/0 group-hover:from-orange-500/20 group-hover:via-orange-500/10 group-hover:to-orange-500/20 blur transition-all" />

                <div className="relative space-y-3">
                  {/* Header: Date and Mood */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white/90">{formatDate(entry.created_at)}</p>
                      <p className="text-xs text-white/50 mt-0.5">
                        {new Date(entry.created_at).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    {entry.mood && (
                      <div className={`px-2 py-1 rounded-full border text-xs ${getMoodBadgeColor(entry.mood)}`}>
                        <span className="capitalize">{entry.mood}</span>
                      </div>
                    )}
                  </div>

                  {/* Preview Text */}
                  <p className="text-sm text-white/70 line-clamp-3">
                    {getPreviewText(entry.content)}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-white/50">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{entry.word_count} words</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{Math.floor(entry.duration_seconds / 60)} min</span>
                    </div>
                  </div>

                  {/* Read more indicator */}
                  <div className="pt-2 flex items-center gap-2 text-xs text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Read full entry</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-block p-6 rounded-2xl bg-zinc-900/50 border border-white/10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-white/80 mb-2">
                {searchQuery ? 'No entries found' : 'No journal entries yet'}
              </p>
              <p className="text-sm text-white/50">
                {searchQuery 
                  ? 'Try a different search term' 
                  : 'Start journaling to see your entries here'}
              </p>
            </div>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && entries.length > 0 && (
          <div className="text-center pt-4">
            <button
              onClick={onLoadMore}
              disabled={isLoading}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-orange-500/50 disabled:to-orange-600/50 transition-all text-white font-medium disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Loading...
                </span>
              ) : (
                'Load More'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Entry Modal */}
      <JournalEntryModal
        entry={selectedEntry}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  )
}
