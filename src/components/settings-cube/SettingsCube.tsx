'use client'

/**
 * Settings Cube Component
 * 3D cube with code textures on side faces
 */

import { useRef, useEffect } from 'react'
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
  const materialsRef = useRef<THREE.Material[]>([])
  const glowRef = useRef<THREE.PointLight>(null)

  // Create textures for code panels
  const commandsTexture = useCodeTexture({ commands, type: 'commands' })
  const configTexture = useCodeTexture({ commands, config, type: 'config' })

  const colorConfig = getColor(config.color)

  // Update materials when color changes
  useEffect(() => {
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
      : baseMaterial.clone()

    const codeMaterialRight = configTexture
      ? new THREE.MeshBasicMaterial({
          map: configTexture,
          transparent: true,
          opacity: 0.95,
        })
      : baseMaterial.clone()

    // Face order: [+X, -X, +Y, -Y, +Z, -Z] = [right, left, top, bottom, front, back]
    materialsRef.current = [
      codeMaterialRight, // Right face - config state
      codeMaterialLeft,  // Left face - command history
      baseMaterial.clone(), // Top
      baseMaterial.clone(), // Bottom
      baseMaterial.clone(), // Front (will have eyes)
      baseMaterial.clone(), // Back
    ]

    // Update glow light color
    if (glowRef.current) {
      glowRef.current.color.setHex(colorConfig.hex)
      glowRef.current.intensity = colorConfig.glowIntensity * 0.3
    }
  }, [colorConfig, commandsTexture, configTexture])

  // Animation
  useFrame((state, delta) => {
    if (!groupRef.current) return

    // Gentle rotation - entire group including eyes
    groupRef.current.rotation.y += delta * 0.15

    // Breathing animation
    const breathe = Math.sin(state.clock.elapsedTime * colorConfig.breathingSpeed) * 0.02
    groupRef.current.scale.setScalar(1 + breathe)
  })

  return (
    <group ref={groupRef}>
      {/* Main cube with materials */}
      <mesh>
        <RoundedBox args={[2, 2, 2]} radius={0.12} smoothness={4}>
          {materialsRef.current.length > 0 ? (
            materialsRef.current.map((mat, i) => (
              <primitive key={`${i}-${config.color}`} object={mat} attach={`material-${i}`} />
            ))
          ) : (
            <meshPhysicalMaterial
              color={colorConfig.hex}
              metalness={0.4}
              roughness={0.3}
              transparent
              opacity={0.9}
              emissive={colorConfig.emissive}
              emissiveIntensity={colorConfig.glowIntensity * 0.5}
            />
          )}
        </RoundedBox>
      </mesh>

      {/* Eyes on front face - inside the group so they rotate together */}
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
