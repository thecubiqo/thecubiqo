'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'

interface CubeProps {
  position: [number, number, number]
  scale: number
  rotationSpeed: number
  floatSpeed: number
  floatAmplitude: number
  delay: number
}

function MetallicCube({ position, scale, rotationSpeed, floatSpeed, floatAmplitude, delay }: CubeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const initialY = position[1]

  useFrame((state) => {
    if (!meshRef.current) return
    const time = state.clock.elapsedTime + delay

    // Slow rotation
    meshRef.current.rotation.x = time * rotationSpeed * 0.3
    meshRef.current.rotation.y = time * rotationSpeed * 0.5

    // Floating motion
    meshRef.current.position.y = initialY + Math.sin(time * floatSpeed) * floatAmplitude
  })

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#1a1a2e"
        metalness={0.9}
        roughness={0.1}
        envMapIntensity={1.5}
      />
    </mesh>
  )
}

function Scene() {
  // Generate random cube positions
  const cubes = useMemo(() => {
    const result: CubeProps[] = []
    const count = 30

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 20
      const y = (Math.random() - 0.5) * 10
      const z = -5 - Math.random() * 15

      result.push({
        position: [x, y, z],
        scale: 0.3 + Math.random() * 1.2,
        rotationSpeed: 0.1 + Math.random() * 0.3,
        floatSpeed: 0.3 + Math.random() * 0.5,
        floatAmplitude: 0.2 + Math.random() * 0.5,
        delay: Math.random() * 10,
      })
    }
    return result
  }, [])

  return (
    <>
      {/* Environment for reflections */}
      <Environment preset="night" />

      {/* Ambient light */}
      <ambientLight intensity={0.2} />

      {/* Directional lights for metallic highlights */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={0.8}
        color="#4a9eff"
      />
      <directionalLight
        position={[-5, 3, -5]}
        intensity={0.5}
        color="#ff4a8d"
      />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#ffffff" />

      {/* Metallic cubes */}
      {cubes.map((cube, i) => (
        <MetallicCube key={i} {...cube} />
      ))}

      {/* Reflective floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6, -10]}>
        <planeGeometry args={[50, 50]} />
        <MeshReflectorMaterial
          blur={[400, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={0.3}
          roughness={0.8}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0a0a0f"
          metalness={0.8}
          mirror={0.3}
        />
      </mesh>

      {/* Grid lines for structural feel */}
      <gridHelper
        args={[50, 50, '#1a1a2e', '#1a1a2e']}
        position={[0, -5.9, -10]}
        rotation={[0, 0, 0]}
      />
    </>
  )
}

export function MetallicBackground() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#050508']} />
        <fog attach="fog" args={['#050508', 10, 30]} />
        <Scene />
      </Canvas>
    </div>
  )
}

