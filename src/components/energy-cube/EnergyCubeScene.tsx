'use client'

import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EnergyCube, type EnergyCubeColor, type EnergyCubeMode } from './EnergyCube'

export function EnergyCubeScene({
  color,
  mode,
  reducedMotion
}: {
  color: EnergyCubeColor
  mode: EnergyCubeMode
  reducedMotion?: boolean
}) {
  // Zoom only (no orbit), per your request.
  const controls = useMemo(
    () => ({
      enablePan: false,
      enableRotate: false,
      enableZoom: true,
      minDistance: 2,
      maxDistance: 6,
      dampingFactor: 0.05,
      rotateSpeed: 0.5,
      target: [0, 0.1, 0] as [number, number, number]
    }),
    []
  )

  return (
    <Canvas
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0.5, 3.5], fov: 50 }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
    >
      <OrbitControls {...controls} />

      {/* Lighting (ported) */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 5, 5]} intensity={0.4} color="#ffffff" />
      <directionalLight position={[-5, -2, -5]} intensity={0.2} color="#4488ff" />
      <pointLight position={[0, 3, -3]} intensity={0.3} color="#ffffff" />

      <Suspense fallback={null}>
        <EnergyCube color={color} mode={mode} reducedMotion={reducedMotion} />
      </Suspense>
    </Canvas>
  )
}
