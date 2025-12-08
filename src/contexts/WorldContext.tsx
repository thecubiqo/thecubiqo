'use client'

/**
 * World Context Provider
 *
 * Provides world configuration to all child components.
 * Replaces the old RegionContext with unified world support.
 */

import { createContext, useContext, ReactNode } from 'react'
import type { WorldConfig, WorldType } from '@/lib/config/worlds'

interface WorldContextType {
  config: WorldConfig | null
  worldId: string | null
  worldType: WorldType | null
  isRegional: boolean      // true if type === 'region'
  isProduct: boolean       // true if type === 'product'
}

const WorldContext = createContext<WorldContextType>({
  config: null,
  worldId: null,
  worldType: null,
  isRegional: false,
  isProduct: false,
})

interface WorldProviderProps {
  children: ReactNode
  config: WorldConfig | null
}

export function WorldProvider({ children, config }: WorldProviderProps) {
  const value: WorldContextType = {
    config,
    worldId: config?.id || null,
    worldType: config?.type || null,
    isRegional: config?.type === 'region',
    isProduct: config?.type === 'product',
  }

  return (
    <WorldContext.Provider value={value}>
      {children}
    </WorldContext.Provider>
  )
}

/**
 * Hook to access world configuration
 */
export function useWorld() {
  return useContext(WorldContext)
}

// Backward compatibility alias
export const useRegion = useWorld

// Re-export provider for legacy imports
export const RegionProvider = WorldProvider
