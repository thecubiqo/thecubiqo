'use client'

/**
 * PlasmaWaveField - HD Plasma Wave Animation with Morph to Cube
 * 
 * Features:
 * - Default: Flowing plasma waves with orange soul nodes
 * - Active: Smooth morph transition to isometric rotating plasma cube
 * - AI state color palette support
 * - 120,000+ particles for HD effect
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Color palettes for different AI states
const COLOR_PALETTES = {
  neutral: [
    new THREE.Color('#00ffff'),  // Cyan
    new THREE.Color('#0088ff'),  // Blue
    new THREE.Color('#8800ff'),  // Purple
    new THREE.Color('#ff00ff'),  // Magenta
    new THREE.Color('#ff0088'),  // Pink
    new THREE.Color('#ff4400'),  // Red-Orange
  ],
  thinking: [
    new THREE.Color('#00ffff'),  // Cyan
    new THREE.Color('#00aa88'),  // Teal
    new THREE.Color('#4400ff'),  // Indigo
    new THREE.Color('#8800ff'),  // Violet
    new THREE.Color('#ff8800'),  // Orange
    new THREE.Color('#ffaa00'),  // Amber
  ],
  speaking: [
    new THREE.Color('#00ff88'),  // Emerald
    new THREE.Color('#00aa88'),  // Teal
    new THREE.Color('#0088ff'),  // Blue
    new THREE.Color('#8800ff'),  // Violet
    new THREE.Color('#ff0088'),  // Pink
    new THREE.Color('#ffff00'),  // Yellow
  ],
  listening: [
    new THREE.Color('#00ffcc'),  // Aqua
    new THREE.Color('#00ffff'),  // Cyan
    new THREE.Color('#0088ff'),  // Blue
    new THREE.Color('#8800ff'),  // Violet
    new THREE.Color('#ff00ff'),  // Magenta
    new THREE.Color('#ff0088'),  // Pink
    new THREE.Color('#ff8800'),  // Orange
  ],
  error: [
    new THREE.Color('#ff0000'),
    new THREE.Color('#ff2200'),
    new THREE.Color('#ff4400'),
    new THREE.Color('#ff0044'),
    new THREE.Color('#ff0088'),
    new THREE.Color('#ff4488'),
  ],
}

type AIState = keyof typeof COLOR_PALETTES

interface PlasmaWaveFieldProps {
  isEnabled?: boolean
  aiState?: AIState
}

export function PlasmaWaveField({
  isEnabled = false,
  aiState = 'neutral'
}: PlasmaWaveFieldProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const soulNodesRef = useRef<THREE.Points>(null)
  const morphProgress = useRef(0)
  const targetMorph = useRef(0)

  // Configuration
  const PARTICLE_COUNT = 40000
  const SOUL_NODE_COUNT = 100
  const WAVE_LAYERS = 4
  const CUBE_SIZE = 1.2

  // Generate wave positions
  const { wavePositions, cubePositions, colors, sizes } = useMemo(() => {
    const wavePos = new Float32Array(PARTICLE_COUNT * 3)
    const cubePos = new Float32Array(PARTICLE_COUNT * 3)
    const cols = new Float32Array(PARTICLE_COUNT * 3)
    const szs = new Float32Array(PARTICLE_COUNT)

    const palette = COLOR_PALETTES[aiState] || COLOR_PALETTES.neutral

    const particlesPerLayer = Math.floor(PARTICLE_COUNT / WAVE_LAYERS)

    for (let layer = 0; layer < WAVE_LAYERS; layer++) {
      const layerOffset = layer * particlesPerLayer
      const layerDepth = (layer - WAVE_LAYERS / 2) * 0.4
      const layerDensity = layer === 1 ? 1.2 : (layer === 2 ? 1.1 : 1.0)

      // Ribbon structure
      const ribbonCount = 20 + layer * 5
      const particlesPerRibbon = Math.floor(particlesPerLayer / ribbonCount)

      for (let ribbon = 0; ribbon < ribbonCount; ribbon++) {
        const ribbonY = (ribbon / ribbonCount - 0.5) * 3.0

        for (let p = 0; p < particlesPerRibbon; p++) {
          const idx = layerOffset + ribbon * particlesPerRibbon + p
          if (idx >= PARTICLE_COUNT) break

          const i3 = idx * 3

          // Wave position - flowing ribbon
          const t = p / particlesPerRibbon
          const x = (t - 0.5) * 6.0
          const waveFreq = 2.0 + ribbon * 0.1
          const y = ribbonY + Math.sin(t * Math.PI * waveFreq) * 0.3
          const z = layerDepth + Math.sin(t * Math.PI * 3 + ribbon) * 0.2

          wavePos[i3] = x
          wavePos[i3 + 1] = y
          wavePos[i3 + 2] = z

          // Cube position - distribute on cube surface and interior
          const cubeT = idx / PARTICLE_COUNT
          const face = Math.floor(Math.random() * 6)
          const u = (Math.random() - 0.5) * CUBE_SIZE
          const v = (Math.random() - 0.5) * CUBE_SIZE
          const half = CUBE_SIZE / 2

          // Mix surface and interior particles
          const isInterior = Math.random() < 0.3
          if (isInterior) {
            cubePos[i3] = (Math.random() - 0.5) * CUBE_SIZE
            cubePos[i3 + 1] = (Math.random() - 0.5) * CUBE_SIZE
            cubePos[i3 + 2] = (Math.random() - 0.5) * CUBE_SIZE
          } else {
            switch (face) {
              case 0: cubePos[i3] = half; cubePos[i3 + 1] = u; cubePos[i3 + 2] = v; break
              case 1: cubePos[i3] = -half; cubePos[i3 + 1] = u; cubePos[i3 + 2] = v; break
              case 2: cubePos[i3] = u; cubePos[i3 + 1] = half; cubePos[i3 + 2] = v; break
              case 3: cubePos[i3] = u; cubePos[i3 + 1] = -half; cubePos[i3 + 2] = v; break
              case 4: cubePos[i3] = u; cubePos[i3 + 1] = v; cubePos[i3 + 2] = half; break
              case 5: cubePos[i3] = u; cubePos[i3 + 1] = v; cubePos[i3 + 2] = -half; break
            }
          }

          // Color based on position in wave
          const colorIdx = Math.floor(t * (palette.length - 1))
          const nextColorIdx = Math.min(colorIdx + 1, palette.length - 1)
          const colorT = (t * (palette.length - 1)) % 1

          const color = new THREE.Color().lerpColors(
            palette[colorIdx],
            palette[nextColorIdx],
            colorT
          )

          cols[i3] = color.r
          cols[i3 + 1] = color.g
          cols[i3 + 2] = color.b

          // Size varies by layer
          szs[idx] = 0.015 + Math.random() * 0.01 + (layer === 1 ? 0.005 : 0)
        }
      }
    }

    return {
      wavePositions: wavePos,
      cubePositions: cubePos,
      colors: cols,
      sizes: szs
    }
  }, [aiState])

  // Soul nodes (orange floating particles)
  const soulNodeData = useMemo(() => {
    const positions = new Float32Array(SOUL_NODE_COUNT * 3)
    const velocities = new Float32Array(SOUL_NODE_COUNT * 3)

    for (let i = 0; i < SOUL_NODE_COUNT; i++) {
      const i3 = i * 3
      // Start within a sphere
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = Math.random() * 1.5

      positions[i3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = r * Math.cos(phi)

      velocities[i3] = (Math.random() - 0.5) * 0.02
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02
    }

    return { positions, velocities }
  }, [])

  // Update morph target
  useEffect(() => {
    targetMorph.current = isEnabled ? 1 : 0
  }, [isEnabled])

  // Animation loop
  useFrame((state) => {
    const time = state.clock.elapsedTime

    // Smooth morph transition
    const morphSpeed = 0.03
    if (morphProgress.current < targetMorph.current) {
      morphProgress.current = Math.min(morphProgress.current + morphSpeed, 1)
    } else if (morphProgress.current > targetMorph.current) {
      morphProgress.current = Math.max(morphProgress.current - morphSpeed, 0)
    }

    const morph = morphProgress.current

    // Update main particles
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3

        // Wave animation
        const waveX = wavePositions[i3]
        const waveY = wavePositions[i3 + 1]
        const waveZ = wavePositions[i3 + 2]

        // Animate wave position
        const waveOffset = Math.sin(time * 0.5 + waveX * 0.5) * 0.1
        const animatedWaveY = waveY + waveOffset
        const animatedWaveZ = waveZ + Math.sin(time * 0.3 + waveY) * 0.05

        // Cube position with rotation
        const cubeX = cubePositions[i3]
        const cubeY = cubePositions[i3 + 1]
        const cubeZ = cubePositions[i3 + 2]

        // Rotate cube
        const rotY = time * 0.3
        const rotatedX = cubeX * Math.cos(rotY) - cubeZ * Math.sin(rotY)
        const rotatedZ = cubeX * Math.sin(rotY) + cubeZ * Math.cos(rotY)

        // Add pulse effect when active
        const pulse = isEnabled ? Math.sin(time * 2) * 0.05 : 0

        // Lerp between wave and cube
        positions[i3] = THREE.MathUtils.lerp(waveX, rotatedX * (1 + pulse), morph)
        positions[i3 + 1] = THREE.MathUtils.lerp(animatedWaveY, cubeY * (1 + pulse), morph)
        positions[i3 + 2] = THREE.MathUtils.lerp(animatedWaveZ, rotatedZ * (1 + pulse), morph)
      }

      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }

    // Update soul nodes
    if (soulNodesRef.current) {
      const positions = soulNodesRef.current.geometry.attributes.position.array as Float32Array
      const velocities = soulNodeData.velocities

      for (let i = 0; i < SOUL_NODE_COUNT; i++) {
        const i3 = i * 3

        // Update position with velocity
        positions[i3] += velocities[i3]
        positions[i3 + 1] += velocities[i3 + 1]
        positions[i3 + 2] += velocities[i3 + 2]

        // Contain within bounds (tighter when cube mode)
        const bounds = isEnabled ? CUBE_SIZE * 0.4 : 1.8

        for (let j = 0; j < 3; j++) {
          if (Math.abs(positions[i3 + j]) > bounds) {
            velocities[i3 + j] *= -0.8
            positions[i3 + j] = Math.sign(positions[i3 + j]) * bounds
          }
        }

        // Add slight attraction to center
        velocities[i3] += -positions[i3] * 0.001
        velocities[i3 + 1] += -positions[i3 + 1] * 0.001
        velocities[i3 + 2] += -positions[i3 + 2] * 0.001

        // Add orbital motion when in cube mode
        if (isEnabled) {
          const orbitSpeed = 0.01
          velocities[i3] += -positions[i3 + 2] * orbitSpeed
          velocities[i3 + 2] += positions[i3] * orbitSpeed
        }
      }

      soulNodesRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <group>
      {/* Main plasma particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[wavePositions.slice(), 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
          <bufferAttribute
            attach="attributes-size"
            args={[sizes, 1]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
          vertexColors
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* Soul nodes (orange floating particles) */}
      <points ref={soulNodesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[soulNodeData.positions.slice(), 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#ff8844"
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* Glow core */}
      <mesh scale={isEnabled ? 0.3 : 0.15}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#ff6633"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

export default PlasmaWaveField
