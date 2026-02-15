'use client'

/**
 * LandingCubeRouter - Unified landing component
 * 
 * Routes to the appropriate landing cube design based on configuration.
 * This makes it easy to switch between designs without changing app code.
 */

import { LandingCube } from './LandingCube'
import { TechLandingCube } from './TechLandingCube'
import { landingConfig, type LandingCubeVariant } from '@/config/landing'
import { useSearchParams } from 'next/navigation'

interface LandingCubeRouterProps {
  onComplete: () => void
  isVoiceActive?: boolean
  variant?: LandingCubeVariant
}

export function LandingCubeRouter({ 
  onComplete, 
  isVoiceActive = false,
  variant 
}: LandingCubeRouterProps) {
  const searchParams = useSearchParams()
  
  // Determine which variant to use
  const activeVariant = variant || 
    (landingConfig.allowUrlOverride && searchParams?.get('landing') as LandingCubeVariant) ||
    landingConfig.defaultVariant
  
  // Render the appropriate landing cube
  if (activeVariant === 'tech-wireframe') {
    return (
      <TechLandingCube 
        onComplete={onComplete}
        isVoiceActive={isVoiceActive}
      />
    )
  }
  
  // Default to plasma-wave
  return (
    <LandingCube 
      onComplete={onComplete}
    />
  )
}

export default LandingCubeRouter
