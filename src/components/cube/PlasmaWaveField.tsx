'use client'

/**
 * PlasmaWaveField - R3F Compatible Version
 * Used in FullscreenApp (Chat Background).
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface PlasmaWaveFieldProps {
  isEnabled?: boolean
  aiState?: string
}

export function PlasmaWaveField({
  isEnabled = false,
  aiState = 'neutral'
}: PlasmaWaveFieldProps) {
  const pointsRef = useRef<THREE.Points>(null)

  // Safe generic particles for background
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.001
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
    }
  })

  // Optimize: Memoize particles to avoid re-creation on every render
  const { positions, colors } = useMemo(() => {
    const count = 5000
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      // Random positions cloud
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10

      // Subtle blue-ish color
      col[i * 3] = 0.2 // R
      col[i * 3 + 1] = 0.5 // G
      col[i * 3 + 2] = 0.8 // B
    }
    return { positions: pos, colors: col }
  }, []) // Stable across renders

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

export default PlasmaWaveField
