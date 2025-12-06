'use client'

/**
 * Region Context
 *
 * Provides regional configuration to components.
 * Used for multi-region support (UK, IN, JP, etc.)
 */

import { createContext, useContext, ReactNode } from 'react'
import type { RegionConfig } from '@/lib/config/regions'

interface RegionContextType {
  config: RegionConfig | null
  isRegional: boolean
  regionId: string | null
}

const RegionContext = createContext<RegionContextType>({
  config: null,
  isRegional: false,
  regionId: null,
})

interface RegionProviderProps {
  children: ReactNode
  config: RegionConfig | null
}

export function RegionProvider({ children, config }: RegionProviderProps) {
  const value: RegionContextType = {
    config,
    isRegional: !!config,
    regionId: config?.id || null,
  }

  return (
    <RegionContext.Provider value={value}>
      {children}
    </RegionContext.Provider>
  )
}

export function useRegion() {
  return useContext(RegionContext)
}

/**
 * Hook to get regional greeting based on time of day
 */
export function useRegionalGreeting() {
  const { config } = useRegion()

  if (!config) {
    return 'Hello'
  }

  const hour = new Date().getHours()

  if (hour < 12) {
    return config.cultural.greetings.morning
  } else if (hour < 17) {
    return config.cultural.greetings.afternoon
  } else {
    return config.cultural.greetings.evening
  }
}
