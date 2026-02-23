'use client'

/**
 * HDCube - High Definition 3D Cube (Design B)
 * Clean, modern 3D cube for founder dashboard toggle
 * Alternative to the plasma TechLandingCube
 */

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Mesh, MeshStandardMaterial, BoxGeometry } from 'three'
import { OrbitControls, Environment, Float } from '@react-three/drei'

// Main 3D Cube Component
function HDCubeMesh() {
  const meshRef = useRef<Mesh>(null)
  
  // Create materials with high-quality properties
  const materials = useMemo(() => {
    return {
      primary: new MeshStandardMaterial({ 
        color: '#3B82F6', // Blue
        metalness: 0.8,
        roughness: 0.2,
        emissive: '#1E40AF',
        emissiveIntensity: 0.2
      }),
      secondary: new MeshStandardMaterial({ 
        color: '#8B5CF6', // Purple
        metalness: 0.7,
        roughness: 0.3,
        emissive: '#7C3AED',
        emissiveIntensity: 0.1
      }),
      accent: new MeshStandardMaterial({ 
        color: '#10B981', // Green
        metalness: 0.6,
        roughness: 0.4,
        emissive: '#059669',
        emissiveIntensity: 0.15
      })
    }
  }, [])

  // Smooth rotation animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} scale={[1, 1, 1]}>
        <boxGeometry args={[2, 2, 2]} />
        
        {/* Apply different materials to each face for visual interest */}
        <primitive object={materials.primary} attach="material-0" /> {/* Right */}
        <primitive object={materials.secondary} attach="material-1" /> {/* Left */}
        <primitive object={materials.accent} attach="material-2" /> {/* Top */}
        <primitive object={materials.primary} attach="material-3" /> {/* Bottom */}
        <primitive object={materials.secondary} attach="material-4" /> {/* Front */}
        <primitive object={materials.accent} attach="material-5" /> {/* Back */}
      </mesh>
    </Float>
  )
}

// Wireframe overlay for high-tech look
function WireframeOverlay() {
  const wireframeRef = useRef<Mesh>(null)
  
  useFrame((state) => {
    if (wireframeRef.current) {
      wireframeRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.05
      wireframeRef.current.rotation.y = state.clock.elapsedTime * 0.25 + 0.1
    }
  })

  return (
    <mesh ref={wireframeRef} scale={[2.05, 2.05, 2.05]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial 
        color="#60A5FA" 
        wireframe={true}
        transparent={true}
        opacity={0.3}
      />
    </mesh>
  )
}

// Inner glow/core effect
function CoreGlow() {
  const coreRef = useRef<Mesh>(null)
  
  useFrame((state) => {
    if (coreRef.current) {
      coreRef.current.rotation.x = state.clock.elapsedTime * 0.5
      coreRef.current.rotation.y = state.clock.elapsedTime * 0.3
      // Pulsing scale
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.05 + 0.95
      coreRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <mesh ref={coreRef} scale={[0.3, 0.3, 0.3]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial 
        color="#60A5FA"
        transparent={true}
        opacity={0.6}
      />
    </mesh>
  )
}

// Main HDCube Component
export default function HDCube() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#3B82F6" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8B5CF6" />
        
        {/* HD Environment */}
        <Environment preset="studio" />
        
        {/* 3D Elements */}
        <HDCubeMesh />
        <WireframeOverlay />
        <CoreGlow />
        
        {/* Controls */}
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          autoRotate={true}
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  )
}

// Simple version for toggle preview
export function HDCubeSimple() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [3, 3, 3], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={1} />
        
        <mesh rotation={[0.5, 0.5, 0]}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial 
            color="#3B82F6"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
        
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  )
}
