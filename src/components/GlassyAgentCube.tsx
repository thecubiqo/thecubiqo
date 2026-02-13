'use client'

import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Edges, Text } from '@react-three/drei'
import * as THREE from 'three'

interface ParticleSystemProps {
  agentStatus: string
}

function ParticleCloud({ agentStatus }: ParticleSystemProps) {
  const particlesRef = useRef<THREE.Points>(null)
  
  const particles = useMemo(() => {
    const count = 1000
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    
    // Color based on agent status
    const baseColor = 
      agentStatus === 'running' ? new THREE.Color(0x3b82f6) : // blue
      agentStatus === 'success' ? new THREE.Color(0x10b981) : // green
      agentStatus === 'error' ? new THREE.Color(0xef4444) : // red
      new THREE.Color(0x8b5cf6) // purple idle
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      
      // Random position inside cube
      positions[i3] = (Math.random() - 0.5) * 1.5
      positions[i3 + 1] = (Math.random() - 0.5) * 1.5
      positions[i3 + 2] = (Math.random() - 0.5) * 1.5
      
      // Color variation
      const colorVar = new THREE.Color()
      colorVar.copy(baseColor)
      colorVar.offsetHSL(Math.random() * 0.1 - 0.05, 0, Math.random() * 0.2)
      
      colors[i3] = colorVar.r
      colors[i3 + 1] = colorVar.g
      colors[i3 + 2] = colorVar.b
    }
    
    return { positions, colors }
  }, [agentStatus])
  
  useFrame((state) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      
      for (let i = 0; i < positions.length; i += 3) {
        // Slow upward drift
        positions[i + 1] += 0.001
        
        // Wrap around
        if (positions[i + 1] > 0.75) {
          positions[i + 1] = -0.75
        }
        
        // Gentle swirl
        const angle = state.clock.elapsedTime * 0.5
        positions[i] += Math.sin(angle + i) * 0.0001
        positions[i + 2] += Math.cos(angle + i) * 0.0001
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true
    }
  })
  
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(particles.positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(particles.colors, 3))
    return geo
  }, [particles])

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial
        size={0.02}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

function CodeSnippet({ position, rotation, text }: { 
  position: [number, number, number]
  rotation: [number, number, number]
  text: string 
}) {
  return (
    <group position={position} rotation={rotation}>
      <Text
        fontSize={0.08}
        color="#00ff88"
        anchorX="left"
        anchorY="top"
        maxWidth={1.5}
        font="/fonts/jetbrains-mono.woff"
        outlineWidth={0.002}
        outlineColor="#000000"
      >
        {text}
      </Text>
    </group>
  )
}

function GlassyCube({ agents }: { agents: any[] }) {
  const glassRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (glassRef.current) {
      glassRef.current.rotation.y = state.clock.elapsedTime * 0.1
    }
  })
  
  const mainAgent = agents[0] || { status: 'idle', currentTask: 'Waiting...' }
  
  // Code snippets for different faces
  const codeSnippets = [
    "async function spawn() {\n  const agent = await\n  createAgent(...)",
    "interface Agent {\n  id: string\n  status: 'running'\n}",
    "export const henry =\n  new AgentInstance({\n    tools: [...]})",
    "const result = await\n  agent.run(prompt)\nreturn result",
  ]
  
  return (
    <group ref={glassRef}>
      {/* Main glass cube */}
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshPhysicalMaterial
          color={0x1a1a3e}
          transparent
          opacity={0.15}
          roughness={0.05}
          metalness={0.1}
          transmission={0.9}
          thickness={0.5}
          envMapIntensity={1}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
        <Edges
          scale={1}
          threshold={15}
          color="#00ffff"
          linewidth={1.5}
        />
      </mesh>
      
      {/* Particle clouds */}
      <ParticleCloud agentStatus={mainAgent.status} />
      
      {/* Code snippets on faces */}
      {codeSnippets.map((code, i) => {
        const positions: [number, number, number][] = [
          [0.5, 0.5, 1.01],
          [-1.01, 0.5, 0.5],
          [0.5, 0.5, -1.01],
          [1.01, 0.5, 0.5],
        ]
        const rotations: [number, number, number][] = [
          [0, 0, 0],
          [0, Math.PI / 2, 0],
          [0, Math.PI, 0],
          [0, -Math.PI / 2, 0],
        ]
        
        return (
          <CodeSnippet
            key={i}
            position={positions[i]}
            rotation={rotations[i]}
            text={code}
          />
        )
      })}
      
      {/* Central status text */}
      <Text
        position={[0, 0, 0]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.woff"
      >
        {agents.filter(a => a.status === 'running').length} AGENTS CODING
      </Text>
    </group>
  )
}

export function GlassyAgentCubeApp() {
  const [agents, setAgents] = useState<any[]>([])

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch('/api/agents')
        const data = await res.json()
        setAgents(data.agents || [])
      } catch (error) {
        console.error('Failed to fetch agents:', error)
      }
    }

    fetchAgents()
    const interval = setInterval(fetchAgents, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-screen bg-gradient-to-b from-gray-900 via-blue-900/20 to-gray-900">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
      >
        <color attach="background" args={['#0a0a1a']} />
        
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#4080ff" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff40ff" />
        <spotLight
          position={[0, 5, 0]}
          angle={0.3}
          penumbra={1}
          intensity={2}
          color="#00ffff"
        />
        
        <GlassyCube agents={agents} />
        
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={3}
          maxDistance={8}
          autoRotate={false}
        />
        
        <Environment preset="night" />
      </Canvas>
      
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm p-4 rounded-lg border border-cyan-500/30">
        <h2 className="text-lg font-bold text-cyan-400 mb-2">LIVE AGENT ACTIVITY</h2>
        <div className="space-y-1 text-sm font-mono">
          {agents.map((agent) => (
            <div key={agent.id} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                agent.status === 'running' ? 'bg-blue-400 animate-pulse' :
                agent.status === 'success' ? 'bg-green-400' :
                agent.status === 'error' ? 'bg-red-400' :
                'bg-purple-400'
              }`} />
              <span className="text-cyan-300">{agent.name}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-300 text-xs">
                {agent.currentTasks[0]?.description?.slice(0, 40) || 'Idle'}...
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
