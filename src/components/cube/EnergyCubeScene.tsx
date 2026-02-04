'use client'

/**
 * EnergyCubeScene - Canvas wrapper for the Energy Cube
 * Drop-in replacement for CubeScene with shader-based effects
 * 
 * ORANGE uses AICuboidGLB (GLB model, landing state)
 * Other colors use EnergyCube (rounded cube, voice states)
 */

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { EnergyCube } from './EnergyCube'
import { AICuboidGLB } from './AICuboidGLB'
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
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} />
      <directionalLight position={[-5, -2, -5]} intensity={0.3} color="#4488ff" />
      <pointLight position={[0, 3, -3]} intensity={0.4} />
      <pointLight position={[0, -2, 2]} intensity={0.2} color="#ff6622" />
    </>
  )
}

export function EnergyCubeScene({ 
  colorName = 'ORANGE', 
  animationState = 'idle',
  className = ''
}: EnergyCubeSceneProps) {
  // ORANGE uses GLB-based AI Cuboid (landing state)
  const isLandingState = colorName === 'ORANGE'
  const isTalking = animationState === 'speaking'
  const isListening = animationState === 'listening'
  
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
            // GLB model for ORANGE landing state
            <AICuboidGLB 
              isTalking={isTalking}
              isListening={isListening}
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
