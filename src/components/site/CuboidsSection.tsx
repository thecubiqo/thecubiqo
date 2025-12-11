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

  useFrame((state) => {
    if (!meshRef.current) return
    const time = state.clock.elapsedTime
    meshRef.current.rotation.x = time * rotationSpeed * 0.2
    meshRef.current.rotation.y = time * rotationSpeed * 0.3
  })

  return (
    <Float
      speed={1.5}
      rotationIntensity={0.5}
      floatIntensity={1}
      floatingRange={[-0.3, 0.3]}
    >
      <mesh ref={meshRef} position={position} scale={scale}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={color}
          metalness={0.8}
          roughness={0.1}
          emissive={color}
          emissiveIntensity={emissiveIntensity * 1.5}
          envMapIntensity={3}
          toneMapped={false}
        />
      </mesh>
    </Float>
  )
}

function CuboidsScene() {
  const cubes = useMemo<CubeData[]>(() => {
    const result: CubeData[] = []
    const colors = ['#00ffff', '#00d4ff', '#4080ff', '#8040ff', '#ff00ff', '#00ff80', '#ffff00']

    // More cubes spread across the scene
    for (let i = 0; i < 60; i++) {
      const x = (Math.random() - 0.5) * 18
      const y = (Math.random() - 0.5) * 10
      const z = -1 - Math.random() * 8

      result.push({
        position: [x, y, z],
        scale: 0.2 + Math.random() * 0.7,
        rotationSpeed: 0.2 + Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        emissiveIntensity: 0.4 + Math.random() * 0.6,
      })
    }

    return result
  }, [])

  return (
    <>
      <Environment preset="night" />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#00d4ff" />
      <directionalLight position={[-5, 3, -5]} intensity={0.8} color="#ff00ff" />
      <pointLight position={[0, 0, 8]} intensity={2} color="#00ffff" distance={20} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#8040ff" distance={15} />

      {cubes.map((cube, i) => (
        <FloatingCube key={i} {...cube} />
      ))}

      {/* Fog for depth */}
      <fog attach="fog" args={['#000010', 5, 20]} />
    </>
  )
}

export function CuboidsSection() {
  return (
    <section className="relative h-[600px] md:h-[700px] overflow-hidden bg-[#000008]">
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <color attach="background" args={['#000008']} />
          <CuboidsScene />
        </Canvas>
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50 pointer-events-none z-10" />

      {/* Content overlay */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center px-4">
        {/* CoQo Mascot */}
        <div className="mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-purple-600/30 border border-cyan-400/30 flex items-center justify-center backdrop-blur-sm">
            <span className="text-3xl font-bold bg-gradient-to-br from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Q
            </span>
          </div>
        </div>

        {/* Text */}
        <h3 className="text-2xl md:text-3xl font-bold text-center mb-4">
          <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Meet CoQo
          </span>
        </h3>
        <p className="text-white/50 text-center max-w-md text-sm md:text-base">
          Your AI companion in the CUBIQO ecosystem
        </p>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />
    </section>
  )
}
