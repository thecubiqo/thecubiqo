'use client'

/**
 * DealCard - Individual deal/offer card with glassmorphism styling
 */

import type { Deal } from '@/lib/deals/types'

interface DealCardProps {
  deal: Deal
}

export function DealCard({ deal }: DealCardProps) {
  return (
    <a
      href={deal.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3 hover:bg-white/10 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white truncate group-hover:text-emerald-300 transition-colors">
            {deal.title}
          </h4>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
            {deal.description}
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400">
          {deal.discount}
        </span>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 line-through">${deal.originalPrice.toFixed(2)}</span>
          <span className="text-sm font-bold text-emerald-400">${deal.dealPrice.toFixed(2)}</span>
        </div>
        {deal.rating && (
          <div className="flex items-center gap-1">
            <span className="text-yellow-400 text-xs">★</span>
            <span className="text-xs text-zinc-400">{deal.rating}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-zinc-500 capitalize">{deal.category}</span>
        <span className="text-[10px] text-zinc-500">{deal.provider}</span>
      </div>
    </a>
  )
}
