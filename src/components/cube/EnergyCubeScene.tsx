'use client'

/**
 * EnergyCubeScene - Canvas wrapper for the Energy Cube
 * Drop-in replacement for CubeScene with shader-based effects
 * 
 * ORANGE uses IsometricCube (different geometry, landing state)
 * Other colors use EnergyCube (rounded cube, voice states)
 */

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { EnergyCube } from './EnergyCube'
import { IsometricCube } from './IsometricCube'
import type { ColorName } from '@/config/colors'
import type { AnimationState } from './EnergyCube'
import * as THREE from 'three'

interface EnergyCubeSceneProps {
  colorName?: ColorName
  animationState?: AnimationState
  className?: string
}

// Target colors for transition from ORANGE
const TARGET_COLORS: Record<string, THREE.Color> = {
  GREEN_BLUE: new THREE.Color(0.0, 0.54, 0.48),
  YELLOW: new THREE.Color(1.0, 0.63, 0.0),
  RED: new THREE.Color(0.76, 0.09, 0.36),
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 5, 5]} intensity={0.4} />
      <directionalLight position={[-5, -2, -5]} intensity={0.2} color="#4488ff" />
      <pointLight position={[0, 3, -3]} intensity={0.3} />
    </>
  )
}

export function EnergyCubeScene({ 
  colorName = 'ORANGE', 
  animationState = 'idle',
  className = ''
}: EnergyCubeSceneProps) {
  // ORANGE uses special IsometricCube (landing state)
  const isLandingState = colorName === 'ORANGE'
  
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0.5, 5], fov: 45 }}
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
          {isLandingState ? (
            // Isometric geometry for ORANGE landing state
            <IsometricCube 
              transitionProgress={0}
              targetColor={TARGET_COLORS.GREEN_BLUE}
              reducedMotion={false}
            />
          ) : (
            // Rounded cube for voice states
            <EnergyCube 
              colorName={colorName} 
              animationState={animationState} 
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  )
}

export default EnergyCubeScene
