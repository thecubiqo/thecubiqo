'use client'

/**
 * CubeScene - Canvas wrapper for the 3D Cube
 *
 * Staging UI swap: replace legacy cuboid-with-eyes with the shader-based EnergyCube.
 */

import { useMemo } from 'react'
import { EnergyCubeScene } from '@/components/energy-cube'
import type { EnergyCubeColor, EnergyCubeMode } from '@/components/energy-cube'
import type { AnimationState } from './Cube'
import type { ColorName } from '@/config/colors'

interface CubeSceneProps {
  colorName?: ColorName
  animationState?: AnimationState
  className?: string
}

function mapColor(colorName: ColorName): EnergyCubeColor {
  // Default in Cubiqo is ORANGE; user explicitly asked for an orange placeholder.
  switch (colorName) {
    case 'RED':
      return 'red'
    case 'YELLOW':
      return 'yellow'
    case 'ORANGE':
      return 'orange'
    // Map any other colors to green until we design a fuller palette.
    default:
      return 'green'
  }
}

function mapMode(animationState: AnimationState): EnergyCubeMode {
  switch (animationState) {
    case 'speaking':
      return 'speaking'
    case 'thinking':
      return 'processing'
    case 'listening':
      return 'listening'
    case 'idle':
    default:
      return 'listening'
  }
}

export function CubeScene({
  colorName = 'ORANGE',
  animationState = 'idle',
  className = ''
}: CubeSceneProps) {
  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  }, [])

  return (
    <div className={`w-full h-full ${className}`}>
      <EnergyCubeScene
        color={mapColor(colorName)}
        mode={mapMode(animationState)}
        reducedMotion={reducedMotion}
      />
    </div>
  )
}
