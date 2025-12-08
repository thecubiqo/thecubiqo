'use client'

/**
 * World Badge - Shows current world in dev mode only
 *
 * Displays a small badge with world info for testing.
 * Works for both product worlds (Headlines, Vocspad) and regional worlds (UK).
 * Hidden in production.
 */

import { useWorld } from '@/contexts/WorldContext'

// Icons for product worlds
const WORLD_ICONS: Record<string, string> = {
  headlines: '📰',
  vocspad: '📝',
  dicey: '🎲',
  coqo: '🔮',
}

// Flag emojis for regional worlds
const REGION_FLAGS: Record<string, string> = {
  uk: '🇬🇧',
  in: '🇮🇳',
  jp: '🇯🇵',
  us: '🇺🇸',
  de: '🇩🇪',
}

export function WorldBadge() {
  const { config, worldId, worldType } = useWorld()

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  // Only show when in a world context
  if (!config || !worldId) {
    return null
  }

  // Get icon based on world type
  const icon = worldType === 'product'
    ? WORLD_ICONS[worldId] || '🌐'
    : REGION_FLAGS[worldId] || '🌍'

  // Badge color based on world type
  const badgeColor = worldType === 'product'
    ? 'bg-blue-600/90 border-blue-400/30'
    : 'bg-purple-600/90 border-purple-400/30'

  return (
    <div className="fixed top-16 right-4 z-[100] pointer-events-none">
      <div className={`px-3 py-1.5 rounded-full text-white text-xs font-medium shadow-lg backdrop-blur-sm border ${badgeColor}`}>
        <span className="mr-1">{icon}</span>
        <span>{config.name}</span>
        <span className="ml-2 opacity-60">{worldType?.toUpperCase()}</span>
      </div>
    </div>
  )
}
