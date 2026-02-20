'use client'

/**
 * DealsPanel - Contextual deals panel that appears when user interest is detected.
 * Uses glassmorphism styling consistent with the CubiQo design language.
 */

import { DealCard } from './DealCard'
import type { Deal } from '@/lib/deals/types'

interface DealsPanelProps {
  deals: Deal[]
  isVisible: boolean
  isLoading: boolean
  onDismiss: () => void
}

export function DealsPanel({ deals, isVisible, isLoading, onDismiss }: DealsPanelProps) {
  if (!isVisible || (!isLoading && deals.length === 0)) return null

  return (
    <div className="border-t border-white/10 bg-gradient-to-r from-zinc-900/80 to-zinc-800/80 backdrop-blur-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 text-sm">🏷️</span>
          <span className="text-xs font-semibold text-zinc-300">
            Best Deals For You
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          aria-label="Dismiss deals"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {isLoading ? (
          <div className="flex items-center gap-2 py-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-zinc-400">Finding best deals...</span>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {deals.map(deal => (
              <div key={deal.id} className="min-w-[240px] max-w-[280px] shrink-0">
                <DealCard deal={deal} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
