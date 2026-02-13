'use client'

/**
 * CubeScene - Canvas wrapper for the 3D Cube
 * Supports multiple cube shapes, sizes, and customization options
 */

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { FlowingEnergyCube } from '../FlowingEnergyCube'
import { FlowingEnergyCubeWithEyes } from '../FlowingEnergyCubeWithEyes'
import { IsometricCube } from './IsometricCube'
import type { AnimationState } from './Cube'
import type { ColorName } from '@/config/colors'
import type { CubeShape } from '../CubeControls'

interface CubeSceneProps {
  colorName?: ColorName
  animationState?: AnimationState
  className?: string
  cubeSize?: number
  shapeType?: CubeShape
  showEyes?: boolean
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

export function CubeScene({ 
  colorName = 'ORANGE', 
  animationState = 'idle',
  className = '',
  cubeSize = 1.0,
  shapeType = 'energy',
  showEyes = false
}: CubeSceneProps) {
  const intensity = mapIntensity(animationState)
  
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.5,
        }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <group scale={cubeSize}>
            {shapeType === 'energy' ? (
              showEyes ? (
                <FlowingEnergyCubeWithEyes intensity={intensity} showEyes={showEyes} />
              ) : (
                <FlowingEnergyCube intensity={intensity} />
              )
            ) : (
              <IsometricCube 
                animationState={animationState}
                reducedMotion={false}
              />
            )}
          </group>
        </Suspense>
      </Canvas>
    </div>
  )
}
