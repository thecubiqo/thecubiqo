'use client'

/**
 * Agent Activity Cube
 * Live 3D visualization of agent coding activity
 */

import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, ContactShadows, OrbitControls, Text, Box } from '@react-three/drei'
import * as THREE from 'three'

interface AgentActivity {
  agentId: string
  agentName: string
  status: 'idle' | 'running' | 'success' | 'error'
  currentTask?: string
  taskCount: number
}

function AgentFace({ 
  position, 
  rotation, 
  agent 
}: { 
  position: [number, number, number]
  rotation: [number, number, number]
  agent: AgentActivity 
}) {
  const color = 
    agent.status === 'running' ? '#3b82f6' : // blue
    agent.status === 'success' ? '#10b981' : // green
    agent.status === 'error' ? '#ef4444' : // red
    '#6b7280' // gray (idle)

  return (
    <group position={position} rotation={rotation}>
      {/* Face background */}
      <Box args={[1.8, 1.8, 0.05]}>
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={0.9}
          emissive={color}
          emissiveIntensity={agent.status === 'running' ? 0.3 : 0.1}
        />
      </Box>

      {/* Agent name */}
      <Text
        position={[0, 0.6, 0.03]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.woff"
      >
        {agent.agentName}
      </Text>

      {/* Status indicator */}
      <mesh position={[-0.7, 0.6, 0.03]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={agent.status === 'running' ? 1 : 0.3}
        />
      </mesh>

      {/* Task count */}
      <Text
        position={[0, 0.2, 0.03]}
        fontSize={0.35}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.woff"
      >
        {agent.taskCount}
      </Text>

      <Text
        position={[0, -0.1, 0.03]}
        fontSize={0.12}
        color="rgba(255,255,255,0.7)"
        anchorX="center"
        anchorY="middle"
      >
        tasks
      </Text>

      {/* Current task (truncated) */}
      {agent.currentTask && (
        <Text
          position={[0, -0.5, 0.03]}
          fontSize={0.1}
          color="rgba(255,255,255,0.8)"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.6}
        >
          {agent.currentTask.slice(0, 50)}...
        </Text>
      )}
    </group>
  )
}

function ActivityCube({ agents }: { agents: AgentActivity[] }) {
  // Position faces of cube (front, back, left, right, top, bottom)
  const facePositions: [number, number, number][] = [
    [0, 0, 1], // front
    [0, 0, -1], // back
    [-1, 0, 0], // left
    [1, 0, 0], // right
    [0, 1, 0], // top
    [0, -1, 0], // bottom
  ]

  const faceRotations: [number, number, number][] = [
    [0, 0, 0], // front
    [0, Math.PI, 0], // back
    [0, -Math.PI / 2, 0], // left
    [0, Math.PI / 2, 0], // right
    [-Math.PI / 2, 0, 0], // top
    [Math.PI / 2, 0, 0], // bottom
  ]

  return (
    <group>
      {agents.slice(0, 6).map((agent, i) => (
        <AgentFace
          key={agent.agentId}
          position={facePositions[i]}
          rotation={faceRotations[i]}
          agent={agent}
        />
      ))}
    </group>
  )
}

export function AgentActivityCubeApp() {
  const [agents, setAgents] = useState<AgentActivity[]>([])

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch('/api/agents')
        const data = await res.json()

        const activities: AgentActivity[] = data.agents.map((agent: any) => ({
          agentId: agent.id,
          agentName: agent.name,
          status: agent.status,
          currentTask: agent.currentTasks[0]?.description,
          taskCount: agent.currentTasks.length,
        }))

        setAgents(activities)
      } catch (error) {
        console.error('Failed to fetch agents:', error)
      }
    }

    fetchAgents()
    const interval = setInterval(fetchAgents, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-black text-white">
      {/* Header */}
      <header className="p-4 border-b border-green-900/50 bg-black/80">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-wider">🔴 Live Agent Activity</h1>
            <p className="text-xs text-green-600/80 mt-1">
              Real-time coding visualization
            </p>
          </div>
          <div className="text-right text-sm">
            <div className="text-green-600">
              {agents.filter(a => a.status === 'running').length} agents coding
            </div>
            <div className="text-green-600/60 text-xs mt-1">
              {agents.reduce((sum, a) => sum + a.taskCount, 0)} total tasks
            </div>
          </div>
        </div>
      </header>

      {/* 3D Cube View */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [3, 2, 3], fov: 50 }}
          gl={{ alpha: true, antialias: true }}
        >
          <color attach="background" args={['#000000']} />
          
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />

          <ActivityCube agents={agents} />

          <OrbitControls 
            enableZoom={true}
            enablePan={false}
            minDistance={3}
            maxDistance={8}
            autoRotate
            autoRotateSpeed={1}
          />

          <Environment preset="night" />
          <ContactShadows
            position={[0, -2, 0]}
            opacity={0.4}
            scale={10}
            blur={2}
            far={4}
          />
        </Canvas>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-black/80 p-4 rounded border border-green-900/50">
          <div className="text-xs space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Running</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Success</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Error</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500" />
              <span>Idle</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="h-48 border-t border-green-900/50 bg-black/80 overflow-y-auto p-4 font-mono text-xs">
        {agents.map((agent) => (
          <div key={agent.agentId} className="mb-2 flex items-start gap-2">
            <span className={`
              w-2 h-2 rounded-full mt-1
              ${agent.status === 'running' ? 'bg-blue-500 animate-pulse' : 
                agent.status === 'success' ? 'bg-green-500' : 
                agent.status === 'error' ? 'bg-red-500' : 'bg-gray-500'}
            `} />
            <div>
              <span className="text-green-400">{agent.agentName}</span>
              <span className="text-gray-500 mx-2">•</span>
              <span className="text-gray-300">
                {agent.currentTask || 'Idle'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
