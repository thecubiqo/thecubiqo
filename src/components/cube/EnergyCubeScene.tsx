'use client'

/**
 * EnergyCubeScene - Canvas wrapper for the Plasma Wave Field
 * 
 * Features HD plasma waves that morph into a rotating cube
 * when voice is enabled (listening/speaking states)
 */

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Float } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import { PlasmaWaveField } from './PlasmaWaveField'
import { EnergyCube } from './EnergyCube'
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

// Local Lights component for standard EnergyCube illumination
function Lights() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 10]} intensity={0.5} color="#ffffff" />
      <pointLight position={[-10, 5, -10]} intensity={0.4} color="#4488ff" />
      <pointLight position={[5, -5, 5]} intensity={0.3} color="#ffffff" />
    </>
  )
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
          <Environment preset="city" blur={0.8} />
          <Lights />

          <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
            <EnergyCube
              colorName={colorName}
              animationState={animationState}
            />
          </Float>

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
