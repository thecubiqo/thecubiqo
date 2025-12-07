'use client'

/**
 * Settings Cube Component
 * 3D cube with code textures on side faces
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
  const meshRef = useRef<THREE.Mesh>(null)
  const eyeLeftRef = useRef<THREE.Mesh>(null)
  const eyeRightRef = useRef<THREE.Mesh>(null)

  // Create textures for code panels
  const commandsTexture = useCodeTexture({ commands, type: 'commands' })
  const configTexture = useCodeTexture({ commands, config, type: 'config' })

  const colorConfig = useMemo(() => getColor(config.color), [config.color])

  // Create materials for each face
  const materials = useMemo(() => {
    const baseMaterial = new THREE.MeshPhysicalMaterial({
      color: colorConfig.hex,
      metalness: 0.4,
      roughness: 0.3,
      transparent: true,
      opacity: 0.9,
      emissive: colorConfig.emissive,
      emissiveIntensity: colorConfig.glowIntensity * 0.5,
    })

    const codeMaterialLeft = commandsTexture
      ? new THREE.MeshBasicMaterial({
          map: commandsTexture,
          transparent: true,
          opacity: 0.95,
        })
      : baseMaterial

    const codeMaterialRight = configTexture
      ? new THREE.MeshBasicMaterial({
          map: configTexture,
          transparent: true,
          opacity: 0.95,
        })
      : baseMaterial

    // Face order: [+X, -X, +Y, -Y, +Z, -Z] = [right, left, top, bottom, front, back]
    return [
      codeMaterialRight, // Right face - config state
      codeMaterialLeft,  // Left face - command history
      baseMaterial,      // Top
      baseMaterial,      // Bottom
      baseMaterial,      // Front (will have eyes)
      baseMaterial,      // Back
    ]
  }, [colorConfig, commandsTexture, configTexture])

  // Animation based on state
  useFrame((state, delta) => {
    if (!meshRef.current) return

    // Gentle rotation
    meshRef.current.rotation.y += delta * 0.15

    // Breathing animation
    const breathe = Math.sin(state.clock.elapsedTime * colorConfig.breathingSpeed) * 0.02
    meshRef.current.scale.setScalar(1 + breathe)

    // Eye tracking (simplified)
    if (eyeLeftRef.current && eyeRightRef.current) {
      const lookX = Math.sin(state.clock.elapsedTime * 0.5) * 0.05
      const lookY = Math.cos(state.clock.elapsedTime * 0.3) * 0.03

      eyeLeftRef.current.position.x = -0.35 + lookX
      eyeLeftRef.current.position.y = 0.2 + lookY
      eyeRightRef.current.position.x = 0.35 + lookX
      eyeRightRef.current.position.y = 0.2 + lookY
    }
  })

  return (
    <group>
      {/* Main cube */}
      <mesh ref={meshRef}>
        <RoundedBox args={[2, 2, 2]} radius={0.12} smoothness={4}>
          {materials.map((mat, i) => (
            <primitive key={i} object={mat} attach={`material-${i}`} />
          ))}
        </RoundedBox>
      </mesh>

      {/* Eyes on front face - positioned outside the cube rotation */}
      <group position={[0, 0, 0]}>
        {/* Left eye */}
        <mesh ref={eyeLeftRef} position={[-0.35, 0.2, 1.02]}>
          <circleGeometry args={[0.18, 32]} />
          <meshBasicMaterial color={0x000000} />
          {/* Pupil */}
          <mesh position={[0, 0, 0.01]}>
            <circleGeometry args={[0.08, 32]} />
            <meshBasicMaterial color={0xffffff} />
          </mesh>
        </mesh>

        {/* Right eye */}
        <mesh ref={eyeRightRef} position={[0.35, 0.2, 1.02]}>
          <circleGeometry args={[0.18, 32]} />
          <meshBasicMaterial color={0x000000} />
          {/* Pupil */}
          <mesh position={[0, 0, 0.01]}>
            <circleGeometry args={[0.08, 32]} />
            <meshBasicMaterial color={0xffffff} />
          </mesh>
        </mesh>
      </group>

      {/* Glow effect */}
      <pointLight
        position={[0, 0, 2]}
        color={colorConfig.hex}
        intensity={colorConfig.glowIntensity * 0.3}
        distance={5}
      />
    </group>
  )
}
