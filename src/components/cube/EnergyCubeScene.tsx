'use client'

/**
 * EnergyCubeScene - Canvas wrapper for the Energy Cube
 * 
 * ORANGE uses EtherealCube (transparent glass + wispy plasma)
 * Other colors use EnergyCube (rounded cube, voice states)
 */

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { FlowingEnergyCube } from '../FlowingEnergyCube'
import { EtherealCube } from './EtherealCube'
import type { ColorName } from '@/config/colors'
import type { AnimationState } from './EnergyCube'

interface EnergyCubeSceneProps {
  colorName?: ColorName
  animationState?: AnimationState
  className?: string
  visualVariant?: 'A' | 'B'
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.5} />
      <pointLight position={[-5, -5, -5]} intensity={0.3} color="#4488ff" />
    </>
  )
}

function mapIntensity(animationState: AnimationState): number {
  switch (animationState) {
    case 'speaking':
      return 1.0
    case 'thinking':
      return 0.7
    case 'listening':
      return 0.5
    case 'idle':
    default:
      return 0.3
  }
}

export function EnergyCubeScene({
  colorName = 'ORANGE',
  animationState = 'idle',
  className = '',
  visualVariant = 'A'
}: EnergyCubeSceneProps) {
  // A: Existing Logic (Orange = Ethereal, Others = Flowing)
  // B: Force Ethereal (New Plasma look) for all states

  const isLandingState = colorName === 'ORANGE'
  const isTalking = animationState === 'speaking'
  const isListening = animationState === 'listening'
  const intensity = mapIntensity(animationState)

  // Logic:
  // If B: Always use EtherealCube
  // If A: Use EtherealCube only if isLandingState (Orange), else FlowingEnergyCube
  const useEthereal = visualVariant === 'B' || (visualVariant === 'A' && isLandingState)

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{
          position: [4, 3.5, 4], // Isometric-style elevated angle
          fov: 35,
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
        <Lights />

        <Suspense fallback={null}>
          {useEthereal ? (
            <EtherealCube
              isTalking={isTalking}
              isListening={isListening}
            />
          ) : (
            <FlowingEnergyCube intensity={intensity} />
          )}
        </Suspense>
      </Canvas>
    </div>
  )
}

export default EnergyCubeScene
