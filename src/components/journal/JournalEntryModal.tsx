'use client'

/**
 * JournalEntryModal Component
 * Modal to display full journal entry content
 */

import { useEffect } from 'react'
import { JournalHistoryEntry } from '@/types/journal-history'

interface JournalEntryModalProps {
  entry: JournalHistoryEntry | null
  isOpen: boolean
  onClose: () => void
}

export function JournalEntryModal({ entry, isOpen, onClose }: JournalEntryModalProps) {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !entry) return null

  const entryDate = new Date(entry.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const duration = Math.floor(entry.duration_seconds / 60)

  // Get mood color
  const getMoodColor = (mood: string | null) => {
    if (!mood) return 'text-gray-400'
    const moodLower = mood.toLowerCase()
    if (moodLower.includes('energized') || moodLower.includes('playful')) return 'text-orange-400'
    if (moodLower.includes('calm') || moodLower.includes('reflective')) return 'text-blue-400'
    if (moodLower.includes('focused') || moodLower.includes('serious')) return 'text-purple-400'
    if (moodLower.includes('urgent')) return 'text-red-400'
    return 'text-orange-400'
  }

  // Get color state badge color
  const getColorStateBg = (colorState: string | null) => {
    if (!colorState) return 'bg-zinc-700/50'
    const color = colorState.toLowerCase()
    if (color.includes('red')) return 'bg-red-500/20 border-red-500/30 text-red-400'
    if (color.includes('yellow')) return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
    if (color.includes('green') || color.includes('blue')) return 'bg-green-500/20 border-green-500/30 text-green-400'
    return 'bg-zinc-700/50 border-zinc-600/30 text-zinc-400'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 max-w-3xl w-full max-h-[90vh] bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl border border-orange-500/30 shadow-2xl shadow-orange-500/10 overflow-hidden">
        {/* Orange glow effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl" />

        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-b border-orange-500/30 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Journal Entry</h3>
            <p className="text-sm text-orange-300/80 mt-1">{entryDate}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="relative overflow-y-auto max-h-[calc(90vh-120px)] px-6 py-6 space-y-6">
          {/* Metadata badges */}
          <div className="flex flex-wrap gap-3">
            {entry.mood && (
              <div className={`px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm ${getMoodColor(entry.mood)}`}>
                <span className="capitalize">{entry.mood}</span>
              </div>
            )}
            {entry.color_state && (
              <div className={`px-3 py-1 rounded-full border text-sm ${getColorStateBg(entry.color_state)}`}>
                {entry.color_state.replace('_', ' ')}
              </div>
            )}
            <div className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm text-white/60">
              {entry.word_count} words
            </div>
            <div className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm text-white/60">
              {duration} min
            </div>
          </div>

          {/* Entry content */}
          <div className="prose prose-invert max-w-none">
            <div className="text-white/90 whitespace-pre-wrap leading-relaxed">
              {entry.content}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative border-t border-white/10 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all text-white font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
