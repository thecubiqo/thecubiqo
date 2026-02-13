'use client'

/**
 * EnergyCubeScene - Canvas wrapper for the Energy Cube
 * 
 * ORANGE uses EtherealCube (transparent glass + wispy plasma)
 * Other colors use EnergyCube (rounded cube, voice states)
 */

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { NextGenPlasmaCube } from './NextGenPlasmaCube'
import type { ColorName } from '@/config/colors'
import type { AnimationState } from './EnergyCube'

interface EnergyCubeSceneProps {
  colorName?: ColorName
  animationState?: AnimationState
  className?: string
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
  className = ''
}: EnergyCubeSceneProps) {
  const isLandingState = colorName === 'ORANGE'
  const isTalking = animationState === 'speaking'
  const isListening = animationState === 'listening'
  const intensity = mapIntensity(animationState)
  
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
          <NextGenPlasmaCube
            isTalking={isTalking}
            isListening={isListening}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default EnergyCubeScene
