'use client'

/**
 * Agent Activity Cube
 * Beautiful isometric glassmorphic cube with code on faces and glowing particles
 */

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { extend } from '@react-three/fiber'

// Sample code snippets for cube faces
const CODE_SNIPPETS = [
  `interface AgentConfig {
  name: string
  model: 'gpt-4' | 'claude'
  tools: Tool[]
}

async function execute() {
  const result = await 
    agent.run(task)
  return result
}`,
  `export class CubiQo {
  private memory: Memory
  private voice: Voice
  
  async think(input: string) {
    const context = 
      await this.memory.get()
    return this.reason(
      input, context
    )
  }
}`,
  `const tools = {
  bash: async (cmd) => {
    return exec(cmd)
  },
  file: async (path) => {
    return read(path)
  },
  search: async (q) => {
    return web.search(q)
  }
}`,
  `function useAgent() {
  const [state, set] = 
    useState<AgentState>()
  
  const run = async (task) => {
    set({ status: 'running' })
    const result = await
      execute(task)
    set({ status: 'done' })
  }
}`,
  `// Agent Loop
while (!complete) {
  const action = think()
  const result = act(action)
  observe(result)
  
  if (verify(result)) {
    complete = true
  }
}`,
  `type Tool = {
  name: string
  exec: Function
  params: Param[]
}

const registry = new Map<
  string, 
  Tool
>()`
]

// Floating particle component
function Particles({ count = 100 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const radius = 2 + Math.random() * 3
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      temp.push({
        position: new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        ),
        scale: 0.02 + Math.random() * 0.06,
        speed: 0.2 + Math.random() * 0.5,
        offset: Math.random() * Math.PI * 2,
        color: ['#ff6b9d', '#00d4ff', '#7c3aed', '#10b981', '#f59e0b'][Math.floor(Math.random() * 5)]
      })
    }
    return temp
  }, [count])

  useFrame((state) => {
    if (!mesh.current) return
    const time = state.clock.elapsedTime
    
    particles.forEach((particle, i) => {
      const t = time * particle.speed + particle.offset
      dummy.position.copy(particle.position)
      dummy.position.x += Math.sin(t) * 0.3
      dummy.position.y += Math.cos(t * 0.8) * 0.3
      dummy.position.z += Math.sin(t * 0.6) * 0.3
      dummy.scale.setScalar(particle.scale * (0.8 + Math.sin(t * 2) * 0.2))
      dummy.updateMatrix()
      mesh.current!.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#ff6b9d" transparent opacity={0.8} />
    </instancedMesh>
  )
}

// Colored particles with different colors
function ColoredParticles() {
  const colors = ['#ff6b9d', '#00d4ff', '#7c3aed', '#10b981', '#f59e0b']
  
  return (
    <>
      {colors.map((color, i) => (
        <ParticleGroup key={i} color={color} count={20} offset={i * 0.5} />
      ))}
    </>
  )
}

function ParticleGroup({ color, count, offset }: { color: string, count: number, offset: number }) {
  const groupRef = useRef<THREE.Group>(null)
  
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const radius = 1.5 + Math.random() * 2
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      temp.push({
        position: [
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        ] as [number, number, number],
        scale: 0.03 + Math.random() * 0.08,
        speed: 0.3 + Math.random() * 0.4
      })
    }
    return temp
  }, [count])

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.1 + offset
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
  })

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i} position={p.position}>
          <sphereGeometry args={[p.scale, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  )
}

// Glass cube face with code
function CodeFace({ 
  position, 
  rotation, 
  code,
  color = '#1e3a5f'
}: { 
  position: [number, number, number]
  rotation: [number, number, number]
  code: string
  color?: string
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Glass background */}
      <mesh>
        <planeGeometry args={[2, 2]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.6}
          roughness={0.1}
          metalness={0.1}
          transmission={0.5}
          thickness={0.5}
          envMapIntensity={1}
        />
      </mesh>
      
      {/* Code text */}
      <Text
        position={[0, 0, 0.02]}
        fontSize={0.08}
        color="#4ade80"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.8}
        lineHeight={1.4}
        font="/fonts/JetBrainsMono-Regular.woff2"
        characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}[]()=><:;,./'&|!?@#$%^*+-_"
      >
        {code}
      </Text>
    </group>
  )
}

// Main isometric cube
function IsometricCodeCube() {
  const groupRef = useRef<THREE.Group>(null)
  
  // Face positions and rotations for cube
  const faces = [
    { position: [0, 0, 1.01] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] },
    { position: [0, 0, -1.01] as [number, number, number], rotation: [0, Math.PI, 0] as [number, number, number] },
    { position: [-1.01, 0, 0] as [number, number, number], rotation: [0, -Math.PI / 2, 0] as [number, number, number] },
    { position: [1.01, 0, 0] as [number, number, number], rotation: [0, Math.PI / 2, 0] as [number, number, number] },
    { position: [0, 1.01, 0] as [number, number, number], rotation: [-Math.PI / 2, 0, 0] as [number, number, number] },
    { position: [0, -1.01, 0] as [number, number, number], rotation: [Math.PI / 2, 0, 0] as [number, number, number] },
  ]

  useFrame((state) => {
    if (!groupRef.current) return
    // Slow gentle rotation
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1 + state.clock.elapsedTime * 0.05
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.05 + 0.4
  })

  return (
    <group ref={groupRef}>
      {/* Inner glowing core */}
      <mesh>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshBasicMaterial color="#1e40af" transparent opacity={0.3} />
      </mesh>
      
      {/* Glass cube shell */}
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshPhysicalMaterial
          color="#1e3a5f"
          transparent
          opacity={0.2}
          roughness={0}
          metalness={0.2}
          transmission={0.8}
          thickness={1}
          envMapIntensity={2}
          clearcoat={1}
          clearcoatRoughness={0}
        />
      </mesh>

      {/* Cube edges glow */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(2, 2, 2)]} />
        <lineBasicMaterial color="#60a5fa" transparent opacity={0.6} />
      </lineSegments>

      {/* Code faces */}
      {faces.map((face, i) => (
        <CodeFace
          key={i}
          position={face.position}
          rotation={face.rotation}
          code={CODE_SNIPPETS[i]}
        />
      ))}
    </group>
  )
}

// Background gradient plane
function Background() {
  return (
    <mesh position={[0, 0, -10]} scale={[50, 50, 1]}>
      <planeGeometry />
      <meshBasicMaterial color="#0a0f1a" />
    </mesh>
  )
}

// Point lights for glow effect
function GlowLights() {
  const light1 = useRef<THREE.PointLight>(null)
  const light2 = useRef<THREE.PointLight>(null)
  const light3 = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (light1.current) {
      light1.current.position.x = Math.sin(t * 0.5) * 3
      light1.current.position.y = Math.cos(t * 0.3) * 2
    }
    if (light2.current) {
      light2.current.position.x = Math.cos(t * 0.4) * 3
      light2.current.position.z = Math.sin(t * 0.6) * 2
    }
    if (light3.current) {
      light3.current.position.y = Math.sin(t * 0.5) * 3
      light3.current.position.z = Math.cos(t * 0.4) * 2
    }
  })

  return (
    <>
      <pointLight ref={light1} color="#ff6b9d" intensity={2} distance={10} />
      <pointLight ref={light2} color="#00d4ff" intensity={2} distance={10} />
      <pointLight ref={light3} color="#7c3aed" intensity={2} distance={10} />
    </>
  )
}

export function AgentActivityCubeApp() {
  return (
    <div className="h-screen w-screen bg-[#0a0f1a] overflow-hidden">
      <Canvas
        camera={{ 
          position: [4, 3, 4], 
          fov: 45,
          near: 0.1,
          far: 100
        }}
        gl={{ 
          alpha: false, 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2
        }}
      >
        {/* Dark blue gradient background */}
        <color attach="background" args={['#0a0f1a']} />
        <fog attach="fog" args={['#0a0f1a', 8, 20]} />
        
        {/* Ambient and directional lights */}
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} color="#ffffff" />
        
        {/* Colored moving point lights */}
        <GlowLights />

        {/* Main isometric cube with code */}
        <IsometricCodeCube />

        {/* Floating colorful particles */}
        <ColoredParticles />

        {/* Camera controls */}
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          minDistance={5}
          maxDistance={12}
          autoRotate={false}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>

      {/* Subtle vignette overlay */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(10,15,26,0.4) 100%)'
        }}
      />
    </div>
  )
}
