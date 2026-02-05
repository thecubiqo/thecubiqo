'use client'

/**
 * EnergyCubeScene - Canvas wrapper for the Energy Cube
 * 
 * ORANGE uses EtherealCube - isometric 3/4 view, dark background
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

// Standard lights for color cube
function StandardLights() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.5} />
      <pointLight position={[-5, -5, -5]} intensity={0.3} color="#4488ff" />
    </>
  )
}

// Ethereal cube lights - subtle, dramatic
function EtherealLights() {
  return (
    <>
      {/* Very subtle ambient - let the shader do the work */}
      <ambientLight intensity={0.05} />
      
      {/* Key light from above-front for glass highlights */}
      <directionalLight 
        position={[2, 4, 3]} 
        intensity={0.15} 
        color="#ffffff"
      />
      
      {/* Subtle purple rim from behind */}
      <pointLight 
        position={[-3, -2, -4]} 
        intensity={0.1} 
        color="#6622aa"
      />
      
      {/* Blue accent from side */}
      <pointLight 
        position={[4, 1, -2]} 
        intensity={0.08} 
        color="#2244aa"
      />
    </>
  )
}

// Map animation state to cube state
function mapState(animationState: AnimationState): 'idle' | 'listening' | 'thinking' | 'speaking' {
  switch (animationState) {
    case 'listening': return 'listening'
    case 'thinking': return 'thinking'
    case 'speaking': return 'speaking'
    default: return 'idle'
  }
}

export function EnergyCubeScene({ 
  colorName = 'ORANGE', 
  animationState = 'idle',
  className = ''
}: EnergyCubeSceneProps) {
  const isLandingState = colorName === 'ORANGE'
  
  // Isometric 3/4 camera for ethereal cube (slightly top-down, floating)
  // Standard front view for color cubes
  const cameraPosition: [number, number, number] = isLandingState 
    ? [2.5, 2.2, 3.5]  // Isometric 3/4 view - top-right perspective
    : [0, 0, 4]         // Front view for color cubes
    
  const cameraFov = isLandingState ? 40 : 50
  
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ 
          position: cameraPosition, 
          fov: cameraFov,
          near: 0.1,
          far: 100
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          premultipliedAlpha: false
        }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        {isLandingState ? <EtherealLights /> : <StandardLights />}
        
        <Suspense fallback={null}>
          {isLandingState ? (
            <group position={[0, 0.1, 0]}> {/* Slight lift for floating feel */}
              <EtherealCube state={mapState(animationState)} />
            </group>
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
