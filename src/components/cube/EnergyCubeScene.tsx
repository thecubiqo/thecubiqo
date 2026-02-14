'use client'

/**
 * EnergyCubeScene - Canvas wrapper for the Plasma Wave Field
 * 
 * Features HD plasma waves that morph into a rotating cube
 * when voice is enabled (listening/speaking states)
 */

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
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
      <Canvas
        camera={{ 
          position: [0, 0, 5], // Front view for waves
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[5, 5, 5]} intensity={0.3} color="#00ffff" />
        <pointLight position={[-5, -5, -5]} intensity={0.2} color="#ff00ff" />
        
        <Suspense fallback={null}>
          <PlasmaWaveField
            isEnabled={isVoiceEnabled}
            aiState={aiState}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default EnergyCubeScene
