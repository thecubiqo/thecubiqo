'use client'

/**
 * LandingCubeRouter - Unified landing component
 * 
 * Routes to the appropriate landing cube design based on configuration.
 * This makes it easy to switch between designs without changing app code.
 */

import { LandingCube } from './LandingCube'
import { TechLandingCube } from './TechLandingCube'
import { SilverWireLandingCube } from './SilverWireLandingCube'
import { LandingPage } from './landing/LandingPage'
import { getLandingVariant, type LandingCubeVariant } from '@/config/landing'
import { useSearchParams } from 'next/navigation'

interface LandingCubeRouterProps {
  onComplete: () => void
  isVoiceActive?: boolean
  variant?: LandingCubeVariant
  showTopRightCTA?: boolean
}

export function LandingCubeRouter({
  onComplete,
  isVoiceActive = false,
  variant,
  showTopRightCTA = false
}: LandingCubeRouterProps) {
  const searchParams = useSearchParams()

  // Determine which variant to use (with proper validation)
  const activeVariant = variant || (searchParams?.get('landing') as LandingCubeVariant) || getLandingVariant(searchParams || undefined)

  // Render the appropriate landing cube
  if (activeVariant === 'silver-wireframe') {
    return (
      <SilverWireLandingCube
        onComplete={onComplete}
        isVoiceActive={isVoiceActive}
      />
    )
  }

  if (activeVariant === 'particle') {
    return (
      <LandingPage
        onComplete={onComplete}
        showTopRightCTA={showTopRightCTA}
      />
    )
  }

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
