'use client'

/**
 * CubeScene - Canvas wrapper for the 3D Cube
 */

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment } from '@react-three/drei'
import { Cube, type AnimationState } from './Cube'
import type { ColorName } from '@/config/colors'

interface CubeSceneProps {
  colorName?: ColorName
  animationState?: AnimationState
  className?: string
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <spotLight
        position={[5, 8, 5]}
        angle={Math.PI / 6}
        penumbra={0.5}
        intensity={0.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <spotLight
        position={[-5, 5, -5]}
        angle={Math.PI / 4}
        penumbra={0.5}
        intensity={0.5}
      />
    </>
  )
}

export function CubeScene({ 
  colorName = 'ORANGE', 
  animationState = 'idle',
  className = ''
}: CubeSceneProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 2, 5], fov: 50 }}
        shadows
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
          <Cube colorName={colorName} animationState={animationState} />
          
          <ContactShadows
            position={[0, -1.5, 0]}
            opacity={0.4}
            scale={10}
            blur={2}
            far={4}
          />
          
          <Environment preset="city" />
        </Suspense>
        
{/* OrbitControls disabled - cube has internal mouse tracking */}
      </Canvas>
    </div>
  )
}
