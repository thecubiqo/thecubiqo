'use client'

/**
 * PlasmaWaveField - Pure Particle Cloud Implementation
 * Matches "CubiQo SIGNAL" design (Right Screenshot)
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface PlasmaWaveFieldProps {
  isEnabled?: boolean // Always true in new design
  aiState?: 'neutral' | 'thinking' | 'speaking' | 'listening' | 'error'
}

export function PlasmaWaveField({
  isEnabled = true,
  aiState = 'neutral'
}: PlasmaWaveFieldProps) {
  const pointsRef = useRef<THREE.Points>(null)

  // Configuration
  const PARTICLE_COUNT = 150000 // High density
  const CLOUD_RADIUS = 2.5

  // Generate particle cloud data
  const { positions, colors, randoms } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    const cols = new Float32Array(PARTICLE_COUNT * 3)
    const rnds = new Float32Array(PARTICLE_COUNT)

    const color1 = new THREE.Color('#00ffff') // Cyan
    const color2 = new THREE.Color('#8800ff') // Purple
    const color3 = new THREE.Color('#0044ff') // Deep Blue

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3

      // Spherical distribution with density variations
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = Math.pow(Math.random(), 0.5) * CLOUD_RADIUS

      // Add noise/structure
      const noise = Math.sin(theta * 5) * Math.cos(phi * 5) * 0.2
      const finalR = r + noise

      pos[i3] = finalR * Math.sin(phi) * Math.cos(theta)
      pos[i3 + 1] = finalR * Math.sin(phi) * Math.sin(theta)
      pos[i3 + 2] = finalR * Math.cos(phi)

      // Gradient coloring based on position
      const mix = (pos[i3] / CLOUD_RADIUS + 1) / 2
      const col = new THREE.Color().lerpColors(color1, color2, mix)
      if (Math.random() > 0.8) col.lerp(color3, 0.5)

      cols[i3] = col.r
      cols[i3 + 1] = col.g
      cols[i3 + 2] = col.b

      rnds[i] = Math.random()
    }

    return { positions: pos, colors: cols, randoms: rnds }
  }, [])

  useFrame((state) => {
    if (!pointsRef.current) return
    const time = state.clock.elapsedTime * 0.1

    // Rotate the entire cloud slowly
    pointsRef.current.rotation.y = time * 0.5
    pointsRef.current.rotation.z = time * 0.2

    // Pulse effect for speaking/thinking
    const pulseSpeed = aiState === 'thinking' ? 2 : (aiState === 'speaking' ? 4 : 1)
    const pulseIntensity = aiState === 'neutral' ? 0.02 : 0.05
    const scale = 1 + Math.sin(state.clock.elapsedTime * pulseSpeed) * pulseIntensity
    pointsRef.current.scale.setScalar(scale)
  })

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.012} // Very fine dots
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* Central glow core */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial
          color="#4400ff"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

export default PlasmaWaveField
