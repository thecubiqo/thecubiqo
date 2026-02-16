'use client'

/**
 * EnergyCubeScene - Wrapper for the Plasma Wave Field
 * 
 * Features HD plasma waves that morph into a rotating cube
 * when voice is enabled (listening/speaking states)
 * 
 * NOTE: PlasmaWaveField now uses vanilla Three.js with its own renderer,
 * so we no longer need React Three Fiber Canvas wrapper.
 */

import { PlasmaWaveField } from './PlasmaWaveField'
import type { ColorName } from '@/config/colors'
import type { AnimationState } from './EnergyCube'

interface EnergyCubeSceneProps {
  colorName?: ColorName
  animationState?: AnimationState
  className?: string
}

// Map animation state to AI state for color palettes
function mapAIState(animationState: AnimationState): 'neutral' | 'thinking' | 'speaking' | 'listening' | 'error' {
  switch (animationState) {
    case 'speaking':
      return 'speaking'
    case 'thinking':
      return 'thinking'
    case 'listening':
      return 'listening'
    case 'idle':
    default:
      return 'neutral'
  }
}

export function EnergyCubeScene({ 
  colorName = 'ORANGE', 
  animationState = 'idle',
  className = ''
}: EnergyCubeSceneProps) {
  // Voice is enabled when listening or speaking
  const isVoiceEnabled = animationState === 'listening' || animationState === 'speaking'
  const aiState = mapAIState(animationState)
  
  return (
    <div className={`w-full h-full ${className}`}>
      <PlasmaWaveField isEnabled={isVoiceEnabled} aiState={aiState} />
    </div>
  )
}

export default EnergyCubeScene
