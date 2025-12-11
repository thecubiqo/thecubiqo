'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox, Float } from '@react-three/drei'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

const CubeScene = dynamic(
  () => import('@/components/cube').then(mod => mod.CubeScene),
  { ssr: false }
)

// Dice cube with dots
function DiceCube() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.3
  })

  // Create dot positions for each face (standard dice)
  const dotMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#00ffff',
    emissiveIntensity: 0.5,
  }), [])

  const createDots = (face: 'front' | 'back' | 'top' | 'bottom' | 'left' | 'right') => {
    const dotPositions: Record<string, [number, number, number][]> = {
      front: [[0, 0, 0.52]], // 1
      back: [[0.2, 0.2, -0.52], [-0.2, -0.2, -0.52]], // 2
      top: [[-0.2, 0.52, -0.2], [0, 0.52, 0], [0.2, 0.52, 0.2]], // 3
      bottom: [[-0.2, -0.52, -0.2], [0.2, -0.52, -0.2], [-0.2, -0.52, 0.2], [0.2, -0.52, 0.2]], // 4
      right: [[-0.2, 0.2, 0], [0.52, 0, 0], [0.2, -0.2, 0], [-0.2, -0.2, 0], [0.2, 0.2, 0]], // 5 (rotated)
      left: [[-0.52, 0.2, -0.2], [-0.52, 0.2, 0.2], [-0.52, 0, 0], [-0.52, -0.2, -0.2], [-0.52, -0.2, 0.2], [-0.52, 0, 0]], // 6
    }
    return dotPositions[face]?.map((pos, i) => (
      <mesh key={i} position={pos} material={dotMaterial}>
        <sphereGeometry args={[0.08, 16, 16]} />
      </mesh>
    ))
  }

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <group ref={groupRef}>
        <RoundedBox args={[1, 1, 1]} radius={0.1} smoothness={4}>
          <meshStandardMaterial
            color="#0a2030"
            metalness={0.8}
            roughness={0.2}
            emissive="#004455"
            emissiveIntensity={0.3}
          />
        </RoundedBox>
        {createDots('front')}
        {createDots('back')}
        {createDots('top')}
        {createDots('bottom')}
        {createDots('right')}
        {createDots('left')}
      </group>
    </Float>
  )
}

// Settings cube with code panels
function SettingsCubePreview() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.2
  })

  // Create code lines texture
  const codeTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#0a1520'
      ctx.fillRect(0, 0, 256, 256)

      ctx.font = '10px monospace'
      ctx.fillStyle = '#00ff88'
      const lines = [
        'cubiqo.color.lock()',
        'cubiqo.animation.set()',
        'cubiqo.voice.enable()',
        'cubiqo.memory.sync()',
        'cubiqo.theme.dark()',
        'cubiqo.reset()',
      ]
      lines.forEach((line, i) => {
        ctx.fillText(line, 10, 30 + i * 35)
      })
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <group ref={groupRef}>
        <RoundedBox args={[1, 1, 1]} radius={0.1} smoothness={4}>
          <meshStandardMaterial
            color="#1a1a2e"
            metalness={0.7}
            roughness={0.3}
            emissive="#00ff88"
            emissiveIntensity={0.1}
          />
        </RoundedBox>
        {/* Code panels on sides */}
        {[
          { pos: [0, 0, 0.51] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
          { pos: [0, 0, -0.51] as [number, number, number], rot: [0, Math.PI, 0] as [number, number, number] },
          { pos: [0.51, 0, 0] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number] },
          { pos: [-0.51, 0, 0] as [number, number, number], rot: [0, -Math.PI / 2, 0] as [number, number, number] },
        ].map((face, i) => (
          <mesh key={i} position={face.pos} rotation={face.rot}>
            <planeGeometry args={[0.9, 0.9]} />
            <meshStandardMaterial
              map={codeTexture}
              transparent
              opacity={0.9}
              emissive="#00ff88"
              emissiveIntensity={0.2}
            />
          </mesh>
        ))}
      </group>
    </Float>
  )
}

// Mini scene wrapper for custom cubes
function MiniScene({ children }: { children: React.ReactNode }) {
  return (
    <Canvas camera={{ position: [0, 0, 3], fov: 40 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-3, -3, -3]} intensity={0.3} color="#00ffff" />
      {children}
    </Canvas>
  )
}

type WorldType = {
  id: string
  name: string
  description: string
  color: 'ORANGE' | 'RED' | 'YELLOW' | 'GREEN_BLUE'
  href: string
  disabled?: boolean
  customCube?: 'dice' | 'settings'
}

const worlds: WorldType[] = [
  {
    id: 'cubiqo',
    name: 'CubiQo',
    description: 'Main emotional AI companion',
    color: 'ORANGE',
    href: '/',
  },
  {
    id: 'headlines',
    name: 'Headlines',
    description: 'News debate with Hari & Ingle',
    color: 'RED',
    href: '/headlines',
  },
  {
    id: 'vocspad',
    name: 'Vocspad',
    description: 'Voice + keyboard notepad',
    color: 'YELLOW',
    href: '/vocspad',
  },
  {
    id: 'dicey',
    name: 'Dicey',
    description: 'Decision helper',
    color: 'GREEN_BLUE',
    href: '/dicey',
    customCube: 'dice',
  },
  {
    id: 'coqo',
    name: 'CoQo',
    description: 'Coming soon',
    color: 'ORANGE',
    href: '#',
    disabled: true,
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'System configuration',
    color: 'GREEN_BLUE',
    href: '/settings-cube',
    customCube: 'settings',
  },
]

export function WorldsSection() {
  const renderCube = (world: WorldType) => {
    if (world.customCube === 'dice') {
      return (
        <MiniScene>
          <DiceCube />
        </MiniScene>
      )
    }
    if (world.customCube === 'settings') {
      return (
        <MiniScene>
          <SettingsCubePreview />
        </MiniScene>
      )
    }
    return <CubeScene colorName={world.color} animationState="idle" />
  }

  return (
    <section id="worlds" className="py-24 bg-gradient-to-b from-black to-zinc-950 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-orange-400 text-sm tracking-widest uppercase mb-4">
            Explore Different Modes
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              CUBIQO WORLDS
            </span>
          </h2>
          <p className="mt-4 text-white/60 max-w-2xl mx-auto">
            Each world is a unique AI experience tailored for specific tasks.
          </p>
        </div>

        {/* Worlds Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {worlds.map((world) => (
            <Link
              key={world.id}
              href={world.href}
              className={`group relative rounded-2xl border border-white/10 overflow-hidden transition-all hover:border-orange-500/30 hover:scale-105 ${
                world.disabled ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              {/* Mini Cube */}
              <div className="aspect-square p-4">
                {renderCube(world)}
              </div>

              {/* Info */}
              <div className="p-4 bg-zinc-950/80 border-t border-white/5">
                <h3 className="text-white font-semibold">{world.name}</h3>
                <p className="text-xs text-white/50">{world.description}</p>
              </div>

              {/* Hover overlay */}
              {!world.disabled && (
                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </Link>
          ))}
        </div>

        {/* Chat Bubble Hint */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="text-white/70 text-sm">
              Each world has voice and chat modes
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
