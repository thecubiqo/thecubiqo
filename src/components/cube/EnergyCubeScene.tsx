'use client'

/**
 * EnergyCubeScene - Canvas wrapper for the Energy Cube
 * Drop-in replacement for CubeScene with shader-based effects
 */

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { EnergyCube, type AnimationState } from './EnergyCube'
import type { ColorName } from '@/config/colors'

interface EnergyCubeSceneProps {
  colorName?: ColorName
  animationState?: AnimationState
  className?: string
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
          <EnergyCube colorName={colorName} animationState={animationState} />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default EnergyCubeScene
