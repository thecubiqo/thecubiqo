'use client'

/**
 * OpportunityFeed - Display matched opportunities for user
 * Shows AI-discovered opportunities with express interest functionality
 */

import { useState, useEffect } from 'react'
import type { DiscoveryResult, Match, RGYContext } from '@/types/rgy-matching'

interface OpportunityFeedProps {
  isOpen: boolean
  onClose: () => void
  isDark?: boolean
  rgyContext?: RGYContext
}

const CONTEXT_CONFIG = {
  green: {
    name: 'Progressive',
    color: '#22c55e',
    icon: '🎯',
  },
  yellow: {
    name: 'Sit back',
    color: '#eab308',
    icon: '✨',
  },
  red: {
    name: 'Indulge',
    color: '#ef4444',
    icon: '💫',
  },
}

const TYPE_ICONS = {
  room: '🏠',
  event: '📅',
  connection: '🤝',
  activity: '🎨',
}

export function OpportunityFeed({
  isOpen,
  onClose,
  isDark = true,
  rgyContext,
}: OpportunityFeedProps) {
  const [opportunities, setOpportunities] = useState<DiscoveryResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [interestedIds, setInterestedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isOpen) {
      loadOpportunities()
    }
  }, [isOpen, rgyContext])

  const loadOpportunities = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/rgy/opportunities/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rgy_context: rgyContext,
          limit: 20,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to load opportunities')
      }

      const data = await response.json()
      setOpportunities(data.discoveries || [])
    } catch (err) {
      console.error('Error loading opportunities:', err)
      setError('Failed to load opportunities. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleExpressInterest = async (opportunityId: string) => {
    try {
      const response = await fetch('/api/rgy/opportunities/express-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity_id: opportunityId }),
      })

      if (!response.ok) {
        throw new Error('Failed to express interest')
      }

      setInterestedIds(new Set([...interestedIds, opportunityId]))
    } catch (err) {
      console.error('Error expressing interest:', err)
      alert('Failed to express interest. Please try again.')
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`min-h-screen p-6 ${isDark ? 'text-white' : 'text-black'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Discover Opportunities</h1>
              {rgyContext && (
                <p className="text-white/60">
                  {CONTEXT_CONFIG[rgyContext].icon} {CONTEXT_CONFIG[rgyContext].name} Context
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="max-w-4xl mx-auto text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white"></div>
            <p className="mt-4 text-white/60">Discovering opportunities for you...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-4xl mx-auto">
            <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30">
              <p className="text-red-400">{error}</p>
              <button
                onClick={loadOpportunities}
                className="mt-4 px-6 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Opportunities Grid */}
        {!loading && !error && opportunities.length > 0 && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {opportunities.map((opp) => (
              <div
                key={opp.opportunity_id}
                className="p-6 rounded-2xl border transition-all hover:scale-[1.02]"
                style={{
                  borderColor: `${CONTEXT_CONFIG[opp.rgy_context].color}40`,
                  background: `linear-gradient(180deg, ${CONTEXT_CONFIG[opp.rgy_context].color}10 0%, transparent 100%)`,
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{TYPE_ICONS[opp.opportunity_type]}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{opp.title}</h3>
                      <p className="text-sm text-white/50 capitalize">{opp.opportunity_type}</p>
                    </div>
                  </div>
                  <div
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${CONTEXT_CONFIG[opp.rgy_context].color}20`,
                      color: CONTEXT_CONFIG[opp.rgy_context].color,
                    }}
                  >
                    {Math.round(opp.similarity_score * 100)}% match
                  </div>
                </div>

                {/* Description */}
                {opp.description && (
                  <p className="text-white/70 text-sm mb-4">{opp.description}</p>
                )}

                {/* Keywords */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {opp.keywords.slice(0, 5).map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full text-xs bg-white/5 text-white/70 border border-white/10"
                    >
                      {keyword}
                    </span>
                  ))}
                  {opp.keywords.length > 5 && (
                    <span className="px-3 py-1 rounded-full text-xs text-white/50">
                      +{opp.keywords.length - 5} more
                    </span>
                  )}
                </div>

                {/* Metadata */}
                {opp.metadata && Object.keys(opp.metadata).length > 0 && (
                  <div className="mb-4 space-y-1">
                    {opp.metadata.schedule && (
                      <p className="text-xs text-white/50">📅 {opp.metadata.schedule}</p>
                    )}
                    {opp.metadata.location && (
                      <p className="text-xs text-white/50">📍 {opp.metadata.location}</p>
                    )}
                    {opp.metadata.format && (
                      <p className="text-xs text-white/50">💻 {opp.metadata.format}</p>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleExpressInterest(opp.opportunity_id)}
                  disabled={interestedIds.has(opp.opportunity_id)}
                  className="w-full px-6 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: interestedIds.has(opp.opportunity_id)
                      ? '#666'
                      : CONTEXT_CONFIG[opp.rgy_context].color,
                  }}
                >
                  {interestedIds.has(opp.opportunity_id) ? '✓ Interested' : 'Express Interest'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && opportunities.length === 0 && (
          <div className="max-w-4xl mx-auto text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No opportunities found</h3>
            <p className="text-white/60 mb-6">
              Set your interests to start discovering opportunities that match you.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              Set Interests
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default OpportunityFeed
