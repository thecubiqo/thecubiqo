'use client'

/**
 * EnergyCubeScene - Canvas wrapper for the Energy Cube
 * 
 * ORANGE uses EtherealCube (transparent glass + wispy plasma)
 * Other colors use EnergyCube (rounded cube, voice states)
 */

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { EnergyCube } from './EnergyCube'
import { EtherealCube } from './EtherealCube'
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

export function EnergyCubeScene({ 
  colorName = 'ORANGE', 
  animationState = 'idle',
  className = ''
}: EnergyCubeSceneProps) {
  const isLandingState = colorName === 'ORANGE'
  const isTalking = animationState === 'speaking'
  const isListening = animationState === 'listening'
  
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
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
            <EtherealCube 
              isTalking={isTalking}
              isListening={isListening}
            />
          ) : (
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
