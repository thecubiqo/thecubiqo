'use client'

/**
 * CubeScene - Canvas wrapper for the advanced shader-based EnergyCube.
 *
 * Uses the cube/EnergyCube directly (with ColorName config and AnimationState)
 * instead of bridging through energy-cube/ wireframe variant.
 */

import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EnergyCube } from './EnergyCube'
import type { AnimationState } from './Cube'
import type { ColorName } from '@/config/colors'

interface CubeSceneProps {
  colorName?: ColorName
  animationState?: AnimationState
  className?: string
}

export function CubeScene({
  colorName = 'ORANGE',
  animationState = 'idle',
  className = ''
}: CubeSceneProps) {
  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  }, [])

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0.5, 3.5], fov: 50 }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <OrbitControls
          enablePan={false}
          enableRotate={false}
          enableZoom={true}
          minDistance={2}
          maxDistance={6}
          dampingFactor={0.05}
          target={[0, 0.1, 0]}
        />

        <ambientLight intensity={0.15} />
        <directionalLight position={[5, 5, 5]} intensity={0.4} color="#ffffff" />
        <directionalLight position={[-5, -2, -5]} intensity={0.2} color="#4488ff" />
        <pointLight position={[0, 3, -3]} intensity={0.3} color="#ffffff" />

        <Suspense fallback={null}>
          <EnergyCube
            colorName={colorName}
            animationState={animationState}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
