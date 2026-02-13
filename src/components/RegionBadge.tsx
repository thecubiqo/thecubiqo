'use client'

/**
 * Region Badge - Shows current region in dev mode only
 *
 * Displays a small badge with region info for testing.
 * Hidden in production.
 */

import { useRegion } from '@/contexts/RegionContext'

// Flag emojis for regions
const REGION_FLAGS: Record<string, string> = {
  uk: '🇬🇧',
  in: '🇮🇳',
  jp: '🇯🇵',
  us: '🇺🇸',
  de: '🇩🇪',
}

export function RegionBadge() {
  const { config, isRegional, regionId } = useRegion()

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  // Only show when in a regional context
  if (!isRegional || !config || !regionId) {
    return null
  }

  const flag = REGION_FLAGS[regionId] || '🌍'

  return (
    <div className="fixed top-16 right-4 z-[100] pointer-events-none">
      <div className="px-3 py-1.5 rounded-full bg-purple-600/90 text-white text-xs font-medium shadow-lg backdrop-blur-sm border border-purple-400/30">
        <span className="mr-1">{flag}</span>
        <span>{config.name}</span>
        <span className="ml-2 opacity-60">DEV</span>
      </div>
    </div>
  )
}
