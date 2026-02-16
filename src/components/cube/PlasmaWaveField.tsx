'use client'

/**
 * PlasmaWaveField - HD Plasma Wave Animation with Morph to Cube
 * Optimized for Stability/Performance (40k particles)
 */

import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Color palettes
const COLOR_PALETTES: Record<string, string[]> = {
  neutral: ['#00ffff', '#00d4ff', '#0099ff', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#ef4444'],
  thinking: ['#00ffff', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#f59e0b', '#f97316', '#ef4444'],
  speaking: ['#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e', '#fbbf24'],
  listening: ['#22d3ee', '#06b6d4', '#3b82f6', '#8b5cf6', '#c026d3', '#ec4899', '#f97316', '#f59e0b'],
  error: ['#f43f5e', '#ef4444', '#dc2626', '#b91c1c', '#f43f5e', '#ec4899', '#ef4444']
}

interface PlasmaWaveFieldProps {
  isEnabled?: boolean
  aiState?: string // Loosen type for safety
}

export function PlasmaWaveField({
  isEnabled = false,
  aiState = 'neutral'
}: PlasmaWaveFieldProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const morphProgress = useRef(isEnabled ? 1 : 0)

  // Configuration - Reduced for stability
  const PARTICLE_COUNT = 40000
  const WAVE_LAYERS = 4
  const CUBE_SIZE = 1.2

  // Audio handling hook (simplified for internal use)
  const [audioLevel] = useState(0)

  // Generate particle data
  const { wavePositions, cubePositions, colors, sizes, wavePhase, xNorm, localY } = useMemo(() => {
    const wavePos = new Float32Array(PARTICLE_COUNT * 3)
    const cubePos = new Float32Array(PARTICLE_COUNT * 3)
    const cols = new Float32Array(PARTICLE_COUNT * 3)
    const szs = new Float32Array(PARTICLE_COUNT)

    // Wave specific data
    const wPhase = new Float32Array(PARTICLE_COUNT)
    const xN = new Float32Array(PARTICLE_COUNT)
    const lY = new Float32Array(PARTICLE_COUNT)

    // Safety check for palette
    const paletteStrings = (aiState && COLOR_PALETTES[aiState]) ? COLOR_PALETTES[aiState] : COLOR_PALETTES.neutral
    // Pre-parse colors to avoid thousands of new THREE.Color() in loops (optimization)
    const paletteColors = paletteStrings.map(hex => new THREE.Color(hex))

    const particlesPerLayer = Math.floor(PARTICLE_COUNT / WAVE_LAYERS)
    let idx = 0

    for (let layer = 0; layer < WAVE_LAYERS; layer++) {
      const layerOffset = layer * particlesPerLayer
      const layerDepth = (layer - WAVE_LAYERS / 2) * 0.4

      // Ribbon structure
      const ribbonCount = 20 + layer * 5
      const particlesPerRibbon = Math.floor(particlesPerLayer / ribbonCount)

      for (let ribbon = 0; ribbon < ribbonCount; ribbon++) {
        const ribbonY = (ribbon / ribbonCount - 0.5) * 3.0

        for (let p = 0; p < particlesPerRibbon; p++) {
          if (idx >= PARTICLE_COUNT) break
          const i3 = idx * 3

          // Wave position
          const t = p / particlesPerRibbon
          const x = (t - 0.5) * 6.0
          const thickness = 0.3 + Math.random() * 0.4
          const yVar = (Math.random() - 0.5) * thickness
          const zVar = (Math.random() - 0.5) * thickness * 2

          wavePos[i3] = x
          wavePos[i3 + 1] = ribbonY + yVar
          wavePos[i3 + 2] = layerDepth + zVar

          // Wave Metadata
          wPhase[idx] = t * Math.PI * 4 + ribbon * 0.6 + Math.random() * 0.5
          xN[idx] = t
          lY[idx] = ribbonY + yVar

          // Cube position (Target)
          const face = Math.floor(Math.random() * 6)
          const u = (Math.random() - 0.5) * CUBE_SIZE
          const v = (Math.random() - 0.5) * CUBE_SIZE
          const half = CUBE_SIZE / 2

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

          // Initial Color (Ribbon Gradient) - Optimized
          const cBlend = t
          const cIdx = Math.floor(cBlend * (paletteColors.length - 1))
          const nextCIdx = Math.min(cIdx + 1, paletteColors.length - 1)

          const col1 = paletteColors[cIdx]
          const col2 = paletteColors[nextCIdx]
          const mix = cBlend % 1

          // Lerp manually (faster than creating new objects?) - just use THREE lerp
          colors[i3] = THREE.MathUtils.lerp(col1.r, col2.r, mix)
          colors[i3 + 1] = THREE.MathUtils.lerp(col1.g, col2.g, mix)
          colors[i3 + 2] = THREE.MathUtils.lerp(col1.b, col2.b, mix)

          szs[idx] = 0.015 + Math.random() * 0.01
          idx++
        }
      }
    }

    return { wavePositions: wavePos, cubePositions: cubePos, colors: cols, sizes: szs, wavePhase: wPhase, xNorm: xN, localY: lY }
  }, [aiState]) // Depend only on aiState string

  // Animation Loop
  useFrame((state) => {
    const time = state.clock.elapsedTime

    // Morph logic
    const target = isEnabled ? 1 : 0
    morphProgress.current += (target - morphProgress.current) * 0.05
    const morph = morphProgress.current

    if (pointsRef.current && pointsRef.current.geometry && pointsRef.current.geometry.attributes.position) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3

        // 1. Calculate Wave Position
        const wP = wavePhase[i]
        const xN_val = xNorm[i]

        // Optimize sin/cos calls?
        const w1 = Math.sin(wP + time) * 0.5
        const w2 = Math.cos(wP * 0.5 + time * 0.7) * 0.2

        const waveX = (xN_val - 0.5) * 6.0
        const waveY = localY[i] + (w1 + w2) * (1 + audioLevel) * 0.5
        const waveZ = (Math.floor(i / (PARTICLE_COUNT / WAVE_LAYERS)) - WAVE_LAYERS / 2) * 0.4 + Math.sin(time + xN_val * 10) * 0.1

        // 2. Calculate Cube Position
        const cX = cubePositions[i3]
        const cY = cubePositions[i3 + 1]
        const cZ = cubePositions[i3 + 2]

        const rot = time * 0.2
        const cos = Math.cos(rot)
        const sin = Math.sin(rot)

        const rX = cX * cos - cZ * sin
        const rZ = cX * sin + cZ * cos

        const pulse = isEnabled ? Math.sin(time * 2) * 0.05 : 0
        const factor = 1 + pulse

        const fX = rX * factor
        const fY = cY * factor
        const fZ = rZ * factor

        // 3. Lerp
        positions[i3] = THREE.MathUtils.lerp(waveX, fX, morph)
        positions[i3 + 1] = THREE.MathUtils.lerp(waveY, fY, morph)
        positions[i3 + 2] = THREE.MathUtils.lerp(waveZ, fZ, morph)
      }

      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[wavePositions.slice(), 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
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
    </group>
  )
}

export default PlasmaWaveField
