'use client'

/**
 * EnergyCubeWireframe - SIMPLIFIED WORKING VERSION
 * Basic wireframe cube without complex shaders
 */

import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function EnergyCube() {
  const groupRef = useRef<THREE.Group>(null)
  const edgesRef = useRef<THREE.LineSegments>(null)
  
  // Create wireframe geometry
  const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
  const edges = new THREE.EdgesGeometry(geometry)
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    
    if (groupRef.current) {
      // Elegant rotation
      groupRef.current.rotation.y = time * 0.15
      groupRef.current.rotation.x = Math.sin(time * 0.08) * 0.15
      groupRef.current.rotation.z = Math.sin(time * 0.06) * 0.08
      // Floating
      groupRef.current.position.y = Math.sin(time * 0.4) * 0.08
    }
    
    // Pulse edges
    if (edgesRef.current) {
      const material = edgesRef.current.material as THREE.LineBasicMaterial
      material.opacity = 0.4 + Math.sin(time * 2) * 0.1
    }
  })
  
  return (
    <group ref={groupRef}>
      {/* Main wireframe cube */}
      <lineSegments ref={edgesRef} geometry={edges}>
        <lineBasicMaterial
          color="#88ccff"
          transparent
          opacity={0.5}
          linewidth={1}
        />
      </lineSegments>
      
      {/* Inner core sphere */}
      <mesh scale={0.3}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial 
          color="#ff6633" 
          transparent 
          opacity={0.5}
        />
      </mesh>
      
      {/* Simple particles */}
      {[...Array(20)].map((_, i) => {
        const x = (Math.random() - 0.5) * 1.2
        const y = (Math.random() - 0.5) * 1.2
        const z = (Math.random() - 0.5) * 1.2
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial 
              color={i % 3 === 0 ? "#ff9944" : "#66ccff"}
              transparent
              opacity={0.6}
            />
          </mesh>
        )
      })}
    </group>
  )
}

interface EnergyCubeWireframeProps {
  onComplete?: () => void
  isVoiceActive?: boolean
}

export function EnergyCubeWireframe({ onComplete, isVoiceActive = false }: EnergyCubeWireframeProps) {
  return (
    <div className="fixed inset-0 bg-[#0a0f1a]">
      <Canvas
        camera={{ position: [3, 3, 3], fov: 50 }}
      >
        <color attach="background" args={['#0a0f1a']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        
        <EnergyCube />
      </Canvas>
      
      {/* Labels for cube faces */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center" aria-label="Energy cube settings visualization">
        <div className="text-white/60 text-sm font-mono">
          <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-premium">
            Mode
          </div>
          <div className="absolute top-1/2 right-1/4 transform translate-x-1/2 -translate-y-1/2 transition-premium">
            Experience
          </div>
          <div className="absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2 transition-premium">
            Privacy
          </div>
          <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 translate-y-1/2 transition-premium">
            Integrations
          </div>
        </div>
      </div>
    </div>
  )
}
