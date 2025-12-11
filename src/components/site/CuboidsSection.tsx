'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float } from '@react-three/drei'
import * as THREE from 'three'

interface CubeData {
  position: [number, number, number]
  scale: number
  rotationSpeed: number
  color: string
  emissiveIntensity: number
}

function FloatingCube({ position, scale, rotationSpeed, color, emissiveIntensity }: CubeData) {
  const meshRef = useRef<THREE.Mesh>(null)
  const edgesRef = useRef<THREE.LineSegments>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    const time = state.clock.elapsedTime
    meshRef.current.rotation.x = time * rotationSpeed * 0.2
    meshRef.current.rotation.y = time * rotationSpeed * 0.3
    if (edgesRef.current) {
      edgesRef.current.rotation.copy(meshRef.current.rotation)
    }
  })

  return (
    <Float
      speed={1.5}
      rotationIntensity={0.5}
      floatIntensity={1}
      floatingRange={[-0.3, 0.3]}
    >
      <group position={position} scale={scale}>
        {/* Main cube with bright glow */}
        <mesh ref={meshRef}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={color}
            metalness={0.3}
            roughness={0.1}
            emissive={color}
            emissiveIntensity={emissiveIntensity * 3}
            envMapIntensity={1}
            transparent
            opacity={0.9}
          />
        </mesh>
        {/* Purple/magenta edges */}
        <lineSegments ref={edgesRef}>
          <edgesGeometry args={[new THREE.BoxGeometry(1.02, 1.02, 1.02)]} />
          <lineBasicMaterial color="#ff00ff" linewidth={2} transparent opacity={0.8} />
        </lineSegments>
        {/* Inner glow sphere */}
        <mesh>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
      </group>
    </Float>
  )
}

function CuboidsScene() {
  const cubes = useMemo<CubeData[]>(() => {
    const result: CubeData[] = []
    const colors = ['#00e5ff', '#00bfff', '#00ffff', '#40e0ff', '#00d4ff', '#66ffff']

    // More cubes spread across the scene - brighter!
    for (let i = 0; i < 60; i++) {
      const x = (Math.random() - 0.5) * 18
      const y = (Math.random() - 0.5) * 10
      const z = -1 - Math.random() * 12

      result.push({
        position: [x, y, z],
        scale: 0.2 + Math.random() * 0.7,
        rotationSpeed: 0.15 + Math.random() * 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
        emissiveIntensity: 0.5 + Math.random() * 0.8,
      })
    }

    return result
  }, [])

  return (
    <>
      <Environment preset="night" />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} color="#00ffff" />
      <directionalLight position={[-5, 3, -5]} intensity={0.8} color="#ff00ff" />
      <pointLight position={[0, 0, 8]} intensity={2} color="#00ffff" distance={20} />
      <pointLight position={[-5, 2, 3]} intensity={1} color="#8000ff" distance={15} />
      <pointLight position={[5, -2, 3]} intensity={1} color="#00e5ff" distance={15} />

      {cubes.map((cube, i) => (
        <FloatingCube key={i} {...cube} />
      ))}

      {/* Fog for depth - lighter */}
      <fog attach="fog" args={['#0a0020', 8, 25]} />
    </>
  )
}

export function CuboidsSection() {
  return (
    <section className="relative h-[600px] md:h-[700px] overflow-hidden bg-[#050515]">
      {/* Hexagon/Honeycomb background pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%238000ff' fill-opacity='0.4'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <color attach="background" args={['#050515']} />
          <CuboidsScene />
        </Canvas>
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 pointer-events-none z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-blue-900/20 pointer-events-none z-10" />

      {/* Content overlay */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center px-4">
        {/* CoQo Mascot - brighter */}
        <div className="mb-8">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-400/50 to-purple-500/50 border-2 border-cyan-400/50 flex items-center justify-center backdrop-blur-sm shadow-lg shadow-cyan-500/30">
            <span className="text-4xl font-bold bg-gradient-to-br from-cyan-300 to-purple-300 bg-clip-text text-transparent drop-shadow-lg">
              Q
            </span>
          </div>
        </div>

        {/* Text - brighter */}
        <h3 className="text-3xl md:text-4xl font-bold text-center mb-4">
          <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent drop-shadow-lg">
            Meet CoQo
          </span>
        </h3>
        <p className="text-white/70 text-center max-w-md text-sm md:text-base">
          Your AI companion in the CUBIQO ecosystem
        </p>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />
    </section>
  )
}
