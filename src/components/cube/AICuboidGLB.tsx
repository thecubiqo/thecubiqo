'use client'

/**
 * AICuboidGLB - GLB-based AI Cuboid for Landing State
 * 
 * Uses the pre-designed GLB model with:
 * - OuterGlass (rounded cuboid, translucent)
 * - InnerPlasma (inner emissive core that animates when talking)
 * 
 * The outer glass stays still, only the inner plasma animates
 * when CubiQo is speaking - creating that "mercury" feel.
 */

import { useRef, useEffect } from 'react'
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

  // Find InnerPlasma mesh on mount
  useEffect(() => {
    scene.traverse((obj) => {
      if (obj.name === 'InnerPlasma') {
        innerRef.current = obj
        console.log('[AICuboid] Found InnerPlasma mesh')
      }
      // Also check for any mesh with emissive material
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const material = mesh.material as THREE.MeshStandardMaterial
        if (material?.emissive) {
          console.log('[AICuboid] Found mesh with emissive:', obj.name)
        }
      }
    })
  }, [scene])

  useFrame((state) => {
    const t = state.clock.elapsedTime

    // Smoothly blend between idle and talking flow
    const target = isTalking ? 1.0 : (isListening ? 0.4 : 0.08)
    flowRef.current = THREE.MathUtils.lerp(flowRef.current, target, 0.06)

    // Animate inner plasma only
    if (innerRef.current) {
      // Rotation animation - faster when talking
      innerRef.current.rotation.y = t * 0.7 * flowRef.current
      innerRef.current.rotation.x = Math.sin(t * 1.2) * 0.15 * flowRef.current

      // "Mercury" feel: pulsing intensity when talking
      const emissiveIntensity = 0.6 + 0.9 * flowRef.current
      const mat = (innerRef.current as THREE.Mesh).material as THREE.MeshStandardMaterial
      if (mat?.emissiveIntensity !== undefined) {
        mat.emissiveIntensity = emissiveIntensity
      }
    }

    // Very subtle rotation of the whole group when idle
    if (groupRef.current && !isTalking && !isListening) {
      groupRef.current.rotation.y = t * 0.03
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={1.5} />
    </group>
  )
}

// Preload the GLB
useGLTF.preload('/cubiqo_ai_cuboid_static.glb')

export default AICuboidGLB
