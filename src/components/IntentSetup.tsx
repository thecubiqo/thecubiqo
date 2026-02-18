'use client'

/**
 * IntentSetup - Setup user intents and keywords for RGY matching
 * Enhanced version of KeywordPanel that saves to backend
 */

import { useState, useEffect } from 'react'
import type { RGYContext, UserIntent } from '@/types/rgy-matching'

interface IntentSetupProps {
  isOpen: boolean
  onClose: () => void
  isDark?: boolean
  rgyContext: RGYContext
}

const CONTEXT_CONFIG = {
  green: {
    name: 'Progressive',
    displayName: 'Sattva',
    icon: '🎯',
    subtitle: 'Growth · Wellness · Achievement',
    color: '#22c55e',
    description: 'Professional growth, wellness, purposeful ambition',
    placeholders: ['yoga', 'career growth', 'meditation', 'fitness'],
  },
  yellow: {
    name: 'Sit back',
    displayName: 'Rajas',
    icon: '✨',
    subtitle: 'Social · Energy · Daily Life',
    color: '#eab308',
    description: 'Social connections, energy, everyday interactions',
    placeholders: ['coffee chats', 'board games', 'movies', 'casual hangouts'],
  },
  red: {
    name: 'Indulge',
    displayName: 'Tamas',
    icon: '⚡',
    subtitle: 'Attraction · Desire · Exploration',
    color: '#ef4444',
    description: 'Intimate connections, desires, deep exploration',
    placeholders: ['creative writing', 'deep conversations', 'philosophy', 'art'],
  },
}

export function IntentSetup({
  isOpen,
  onClose,
  isDark = true,
  rgyContext,
}: IntentSetupProps) {
  const [keywords, setKeywords] = useState<string[]>([])
  const [intentDescription, setIntentDescription] = useState('')
  const [newKeyword, setNewKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const config = CONTEXT_CONFIG[rgyContext]

  useEffect(() => {
    if (isOpen) {
      loadIntent()
    }
  }, [isOpen, rgyContext])

  const loadIntent = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/rgy/intents?context=${rgyContext}`)
      if (response.ok) {
        const data = await response.json()
        if (data.intents && data.intents.length > 0) {
          const intent = data.intents[0]
          setKeywords(intent.keywords || [])
          setIntentDescription(intent.intent_description || '')
        }
      }
    } catch (err) {
      console.error('Error loading intent:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim().toLowerCase()
    if (trimmed && !keywords.includes(trimmed) && keywords.length < 50) {
      setKeywords([...keywords, trimmed])
      setNewKeyword('')
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword))
  }

  const handleSave = async () => {
    if (keywords.length === 0) {
      alert('Please add at least one keyword')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/rgy/intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rgy_context: rgyContext,
          keywords,
          intent_description: intentDescription.trim() || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save intent')
      }

      alert('Intent saved successfully! Pro Match will now discover opportunities for you.')
      onClose()
    } catch (err) {
      console.error('Error saving intent:', err)
      alert('Failed to save intent. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl rounded-2xl ${isDark ? 'bg-zinc-900/95' : 'bg-white/95'} overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-6 border-b"
          style={{ borderColor: `${config.color}40` }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{config.icon}</span>
              <div>
                <h2 className="text-xl font-semibold">{config.name} Context</h2>
                <p className="text-sm text-white/60">{config.subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-white/60 text-sm">{config.description}</p>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-white/20 border-t-white"></div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Keywords Input */}
            <div>
              <label className="block font-medium mb-3">
                Your Interests ({keywords.length}/50)
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                  placeholder={`e.g., ${config.placeholders.join(', ')}`}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                />
                <button
                  onClick={handleAddKeyword}
                  disabled={!newKeyword.trim() || keywords.length >= 50}
                  className="px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
                  style={{ backgroundColor: config.color }}
                >
                  Add
                </button>
              </div>

              {/* Keywords Display */}
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword) => (
                  <div
                    key={keyword}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10"
                  >
                    <span className="text-sm">{keyword}</span>
                    <button
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="text-white/50 hover:text-white transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {keywords.length === 0 && (
                  <p className="text-white/40 text-sm py-4">
                    Add keywords that describe your interests in this context
                  </p>
                )}
              </div>
            </div>

            {/* Description (Optional) */}
            <div>
              <label className="block font-medium mb-3">
                Description <span className="text-white/40 text-sm">(Optional)</span>
              </label>
              <textarea
                value={intentDescription}
                onChange={(e) => setIntentDescription(e.target.value)}
                placeholder="Describe what you're looking for in more detail..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
              />
            </div>

            {/* Info */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <p className="text-sm text-blue-400">
                ℹ️ Your interests will be used to discover matching opportunities. The more specific you are, the better your matches will be.
              </p>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || keywords.length === 0}
              className="w-full px-6 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-50"
              style={{ backgroundColor: config.color }}
            >
              {saving ? 'Saving...' : 'Save & Discover Opportunities'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default IntentSetup
