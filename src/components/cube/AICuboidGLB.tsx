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

interface AICuboidGLBProps {
  isTalking?: boolean
  isListening?: boolean
  url?: string
}

export function AICuboidGLB({ 
  isTalking = false, 
  isListening = false,
  url = '/cubiqo_ai_cuboid_static.glb' 
}: AICuboidGLBProps) {
  const { scene } = useGLTF(url)
  const innerRef = useRef<THREE.Object3D | null>(null)
  const flowRef = useRef(0.08)
  const groupRef = useRef<THREE.Group>(null)

  // Clone scene to avoid shared state issues
  const clonedScene = useMemo(() => scene.clone(), [scene])

  // Find InnerPlasma mesh on mount
  useEffect(() => {
    console.log('[AICuboid] Searching for InnerPlasma in GLB...')
    clonedScene.traverse((obj) => {
      console.log('[AICuboid] Found node:', obj.name, obj.type)
      if (obj.name === 'InnerPlasma') {
        innerRef.current = obj
        console.log('[AICuboid] ✓ Found InnerPlasma mesh!')
      }
    })
    if (!innerRef.current) {
      console.warn('[AICuboid] ✗ InnerPlasma mesh NOT found!')
    }
  }, [clonedScene])

  // Main animation loop - RUNTIME CONTROL
  useFrame((state) => {
    const t = state.clock.elapsedTime

    // Smooth flow transition (CRITICAL for mercury feel)
    const targetFlow = isTalking ? 1.0 : (isListening ? 0.4 : 0.08)
    flowRef.current += (targetFlow - flowRef.current) * 0.06

    // Animate InnerPlasma only
    if (innerRef.current) {
      // Mercury-like internal motion
      innerRef.current.rotation.y = t * 0.7 * flowRef.current
      innerRef.current.rotation.x = Math.sin(t * 1.2) * 0.15 * flowRef.current

      // Subtle emissive pulse while talking
      const mat = (innerRef.current as THREE.Mesh).material as THREE.MeshStandardMaterial
      if (mat && mat.emissiveIntensity !== undefined) {
        mat.emissiveIntensity = 0.6 + flowRef.current * 0.9
      }
    }

    // Very subtle whole-model sway when idle (almost imperceptible)
    if (groupRef.current) {
      if (!isTalking && !isListening) {
        groupRef.current.rotation.y = t * 0.02
      }
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
