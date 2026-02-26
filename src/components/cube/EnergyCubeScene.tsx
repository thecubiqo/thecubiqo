'use client'

/**
 * EnergyCubeScene - Canvas wrapper for the Plasma Wave Field
 * 
 * Features HD plasma waves that morph into a rotating cube
 * when voice is enabled (listening/speaking states)
 */

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import { PlasmaWaveField } from './PlasmaWaveField'
import { BiometricWatcher } from '../studio/BiometricWatcher'
import type { ColorName } from '@/config/colors'
import type { AnimationState } from './EnergyCube'

interface EnergyCubeSceneProps {
  colorName?: ColorName
  animationState?: AnimationState
  isWatching?: boolean
  facePosition?: { x: number; y: number }
  engagement?: 'low' | 'medium' | 'high'
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

function Lights() {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
      <pointLight position={[10, 10, 10]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.6} color="#4444ff" />
      <pointLight position={[0, 10, 0]} intensity={0.4} color="#00ffff" />
    </>
  )
}

export function EnergyCubeScene({
  colorName = 'ORANGE',
  animationState = 'idle',
  isWatching = false,
  facePosition = { x: 0, y: 0 },
  engagement = 'medium',
  className = ''
}: EnergyCubeSceneProps) {
  // Voice is enabled when listening or speaking
  const isVoiceEnabled = animationState === 'listening' || animationState === 'speaking'
  const aiState = mapAIState(animationState)

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true
        }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Lights />

          <group>
            <PlasmaWaveField
              isEnabled={isVoiceEnabled}
              aiState={aiState}
            />
            <BiometricWatcher
              isActive={isWatching}
              facePosition={facePosition}
              engagement={engagement}
            />
          </group>

          <EffectComposer>
            <Bloom
              intensity={1.2}
              luminanceThreshold={0.1}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
            <Noise opacity={0.02} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  )
}

export default EnergyCubeScene
