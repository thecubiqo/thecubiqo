'use client'

/**
 * Settings Cube Component
 * 3D cube with code textures on side faces and smooth color transitions
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { useCodeTexture } from './useCodeTexture'
import { getColor } from '@/config/colors'
import type { SettingsCommand, CubeConfig } from '@/lib/settings-cube/types'

interface SettingsCubeProps {
  config: CubeConfig
  commands: SettingsCommand[]
}

export function SettingsCube({ config, commands }: SettingsCubeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null)
  const glowRef = useRef<THREE.PointLight>(null)

  // Create textures for code panels
  const commandsTexture = useCodeTexture({ commands, type: 'commands' })
  const configTexture = useCodeTexture({ commands, config, type: 'config' })

  // Get color config - memoized
  const colorConfig = useMemo(() => getColor(config.color), [config.color])

  // Animation state (persistent across renders)
  const stateRef = useRef({
    // Color transition
    currentColor: new THREE.Color(colorConfig.hex),
    targetColor: new THREE.Color(colorConfig.hex),
    currentEmissive: new THREE.Color(colorConfig.emissive),
    targetEmissive: new THREE.Color(colorConfig.emissive),
    currentGlowIntensity: colorConfig.glowIntensity,
    targetGlowIntensity: colorConfig.glowIntensity,
    currentBreathingSpeed: colorConfig.breathingSpeed,
    targetBreathingSpeed: colorConfig.breathingSpeed,
    // Breathing phase
    breathingPhase: 0,
  })

  // Update targets when color changes
  useMemo(() => {
    const state = stateRef.current
    state.targetColor = new THREE.Color(colorConfig.hex)
    state.targetEmissive = new THREE.Color(colorConfig.emissive)
    state.targetGlowIntensity = colorConfig.glowIntensity
    state.targetBreathingSpeed = colorConfig.breathingSpeed
  }, [colorConfig])

  // Animation loop
  useFrame((_, delta) => {
    if (!groupRef.current || !materialRef.current) return

    const state = stateRef.current

    // Smooth color transition (lerp)
    state.currentColor.lerp(state.targetColor, delta * 3)
    state.currentEmissive.lerp(state.targetEmissive, delta * 3)

    // Update material colors
    materialRef.current.color.copy(state.currentColor)
    materialRef.current.emissive.copy(state.currentEmissive)

    // Smooth glow intensity transition
    state.currentGlowIntensity += (state.targetGlowIntensity - state.currentGlowIntensity) * delta * 3
    state.currentBreathingSpeed += (state.targetBreathingSpeed - state.currentBreathingSpeed) * delta * 3

    // Accumulate breathing phase
    state.breathingPhase += delta * state.currentBreathingSpeed

    // Breathing animation on emissive intensity
    const breathe = Math.sin(state.breathingPhase) * 0.15
    materialRef.current.emissiveIntensity = state.currentGlowIntensity * 0.5 + breathe

    // Gentle rotation
    groupRef.current.rotation.y += delta * 0.15

    // Breathing scale
    const scaleBreath = Math.sin(state.breathingPhase) * 0.02
    groupRef.current.scale.setScalar(1 + scaleBreath)

    // Update glow light
    if (glowRef.current) {
      glowRef.current.color.copy(state.currentColor)
      glowRef.current.intensity = state.currentGlowIntensity * 0.3
    }
  })

  return (
    <group ref={groupRef}>
      {/* Main cube with single material */}
      <RoundedBox args={[2, 2, 2]} radius={0.12} smoothness={4}>
        <meshPhysicalMaterial
          ref={materialRef}
          color={colorConfig.hex}
          metalness={0.4}
          roughness={0.3}
          transparent
          opacity={0.9}
          emissive={colorConfig.emissive}
          emissiveIntensity={colorConfig.glowIntensity * 0.5}
        />
      </RoundedBox>

      {/* Left face - command history overlay */}
      {commandsTexture && (
        <mesh position={[-1.01, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[1.9, 1.9]} />
          <meshBasicMaterial
            map={commandsTexture}
            transparent
            opacity={0.95}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Right face - config state overlay */}
      {configTexture && (
        <mesh position={[1.01, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.9, 1.9]} />
          <meshBasicMaterial
            map={configTexture}
            transparent
            opacity={0.95}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Eyes on front face */}
      {/* Left eye */}
      <group position={[-0.35, 0.2, 1.02]}>
        <mesh>
          <circleGeometry args={[0.18, 32]} />
          <meshBasicMaterial color={0x000000} />
        </mesh>
        {/* Pupil */}
        <mesh position={[0, 0, 0.01]}>
          <circleGeometry args={[0.08, 32]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>
      </group>

      {/* Right eye */}
      <group position={[0.35, 0.2, 1.02]}>
        <mesh>
          <circleGeometry args={[0.18, 32]} />
          <meshBasicMaterial color={0x000000} />
        </mesh>
        {/* Pupil */}
        <mesh position={[0, 0, 0.01]}>
          <circleGeometry args={[0.08, 32]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>
      </group>

      {/* Glow effect */}
      <pointLight
        ref={glowRef}
        position={[0, 0, 2]}
        color={colorConfig.hex}
        intensity={colorConfig.glowIntensity * 0.3}
        distance={5}
      />
    </group>
  )
}
