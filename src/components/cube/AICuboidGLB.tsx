'use client'

/**
 * AICuboidGLB - GLB-based AI Cuboid for Landing State
 * 
 * RUNTIME THREE.JS CONTROL:
 * - Loads GLB with OuterGlass + InnerPlasma meshes
 * - useFrame provides render loop (requestAnimationFrame)
 * - isTalking prop controls animation state
 * - Smooth lerp transition between idle (0.08) and talking (1.0)
 * 
 * TTS LIFECYCLE:
 * - isTalking=false → idle state, flow=0.08, almost still
 * - isTalking=true → active state, flow=1.0, mercury animation
 */

import { useRef, useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export type SpecialMove = 'Resonance' | 'Breakthrough' | 'Trust Earned' | 'Co-Presence' | 'Wink' | 'Deep Focus' | 'Memory Thread' | 'Handoff' | 'none';

interface AICuboidGLBProps {
  isTalking?: boolean
  isListening?: boolean
  specialMove?: SpecialMove
  color?: 'TEAL' | 'RED' | 'YELLOW'
  url?: string
}

export function AICuboidGLB({
  isTalking = false,
  isListening = false,
  specialMove = 'none',
  color = 'TEAL',
  url = '/cubiqo_ai_cuboid_static.glb'
}: AICuboidGLBProps) {
  const { scene } = useGLTF(url)
  const innerRef = useRef<THREE.Mesh | null>(null)
  const flowRef = useRef(0.08)
  const groupRef = useRef<THREE.Group>(null)
  const moveTimerRef = useRef(0)

  // Clone scene to avoid shared state issues
  const clonedScene = useMemo(() => scene.clone(), [scene])

  // Find InnerPlasma mesh on mount
  useEffect(() => {
    clonedScene.traverse((obj) => {
      if (obj.name === 'InnerPlasma' && obj instanceof THREE.Mesh) {
        innerRef.current = obj
      }
    })
  }, [clonedScene])

  // Main animation loop - RUNTIME CONTROL
  useFrame((state) => {
    const t = state.clock.elapsedTime

    // 1. Base Flow Logic
    const targetFlow = isTalking ? 1.0 : (isListening ? 0.4 : 0.08)
    flowRef.current += (targetFlow - flowRef.current) * 0.06

    // 2. Color Mapping (Flagship Spec)
    const colorMap = {
      TEAL: new THREE.Color('#00897b'),
      RED: new THREE.Color('#c2185b'),
      YELLOW: new THREE.Color('#ffa000')
    }
    const baseColor = colorMap[color]

    // 3. Special Moves Physics
    if (innerRef.current) {
      const mat = innerRef.current.material as THREE.MeshStandardMaterial
      let emissiveModifier = 1.0
      let rotationMultiplier = 1.0

      if (specialMove !== 'none') {
        moveTimerRef.current += 0.01

        switch (specialMove) {
          case 'Resonance':
            emissiveModifier = 1.0 + Math.sin(t * 10) * 0.5
            break
          case 'Breakthrough':
            emissiveModifier = (Math.floor(t * 20) % 2) ? 1.5 : 0.5
            break
          case 'Memory Thread':
            rotationMultiplier = 5.0
            break
          case 'Deep Focus':
            innerRef.current.scale.setScalar(0.8 + Math.sin(t * 2) * 0.1)
            break
          case 'Co-Presence':
            innerRef.current.rotation.z = t * 2
            break
        }
      } else {
        moveTimerRef.current = 0
        innerRef.current.scale.setScalar(1.0)
      }

      // Mercury-like internal motion
      innerRef.current.rotation.y = t * 0.7 * flowRef.current * rotationMultiplier
      innerRef.current.rotation.x = Math.sin(t * 1.2) * 0.15 * flowRef.current

      // Apply Color & Emissive
      mat.color.copy(baseColor)
      mat.emissive.copy(baseColor)
      mat.emissiveIntensity = (0.6 + flowRef.current * 0.9) * emissiveModifier
    }

    // Subtle whole-model sway
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.02
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} scale={1.5} />
    </group>
  )
}

// Preload the GLB for faster initial load
useGLTF.preload('/cubiqo_ai_cuboid_static.glb')

export default AICuboidGLB
