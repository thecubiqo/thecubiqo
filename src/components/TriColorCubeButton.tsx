'use client'

/**
 * TriColorCubeButton - 3D wireframe cube with R/G/Y NEON glowing edges
 * Matching the reference: Red left face, Cyan/Teal connecting edges, Yellow right face
 */

import { useState, useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

interface WireframeCubeProps {
  isHovered: boolean
}

function WireframeCube({ isHovered }: WireframeCubeProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (!groupRef.current) return
    const time = state.clock.getElapsedTime()
    
    // Slow rotation
    groupRef.current.rotation.y = time * 0.4
    groupRef.current.rotation.x = Math.sin(time * 0.2) * 0.15 + 0.2
    
    // Pulse on hover
    const scale = isHovered ? 1.2 + Math.sin(time * 4) * 0.08 : 1
    groupRef.current.scale.setScalar(scale)
  })

  const size = 0.45

  // Create thick tube-like edges for neon glow effect
  const edgeGeometries = useMemo(() => {
    const tubeRadius = 0.025
    const edges: { start: THREE.Vector3; end: THREE.Vector3; color: string }[] = []
    
    // RED edges (left face - X = -size)
    const red = '#ff2222'
    edges.push({ start: new THREE.Vector3(-size, -size, -size), end: new THREE.Vector3(-size, size, -size), color: red })
    edges.push({ start: new THREE.Vector3(-size, size, -size), end: new THREE.Vector3(-size, size, size), color: red })
    edges.push({ start: new THREE.Vector3(-size, size, size), end: new THREE.Vector3(-size, -size, size), color: red })
    edges.push({ start: new THREE.Vector3(-size, -size, size), end: new THREE.Vector3(-size, -size, -size), color: red })
    
    // YELLOW edges (right face - X = +size)
    const yellow = '#ffdd00'
    edges.push({ start: new THREE.Vector3(size, -size, -size), end: new THREE.Vector3(size, size, -size), color: yellow })
    edges.push({ start: new THREE.Vector3(size, size, -size), end: new THREE.Vector3(size, size, size), color: yellow })
    edges.push({ start: new THREE.Vector3(size, size, size), end: new THREE.Vector3(size, -size, size), color: yellow })
    edges.push({ start: new THREE.Vector3(size, -size, size), end: new THREE.Vector3(size, -size, -size), color: yellow })
    
    // CYAN/TEAL edges (connecting edges)
    const cyan = '#00ffcc'
    edges.push({ start: new THREE.Vector3(-size, size, -size), end: new THREE.Vector3(size, size, -size), color: cyan })
    edges.push({ start: new THREE.Vector3(-size, size, size), end: new THREE.Vector3(size, size, size), color: cyan })
    edges.push({ start: new THREE.Vector3(-size, -size, -size), end: new THREE.Vector3(size, -size, -size), color: cyan })
    edges.push({ start: new THREE.Vector3(-size, -size, size), end: new THREE.Vector3(size, -size, size), color: cyan })
    
    return edges.map(edge => {
      const direction = new THREE.Vector3().subVectors(edge.end, edge.start)
      const length = direction.length()
      const midpoint = new THREE.Vector3().addVectors(edge.start, edge.end).multiplyScalar(0.5)
      
      return {
        geometry: new THREE.CylinderGeometry(tubeRadius, tubeRadius, length, 8),
        position: midpoint,
        rotation: new THREE.Euler(
          Math.atan2(direction.z, Math.sqrt(direction.x * direction.x + direction.y * direction.y)),
          0,
          Math.atan2(-direction.x, direction.y)
        ),
        color: edge.color
      }
    })
  }, [])

  return (
    <group ref={groupRef}>
      {edgeGeometries.map((edge, i) => (
        <mesh
          key={i}
          geometry={edge.geometry}
          position={edge.position}
          rotation={edge.rotation}
        >
          <meshBasicMaterial 
            color={edge.color}
            toneMapped={false}
          />
        </mesh>
      ))}
      
      {/* Corner spheres for smoother joints */}
      {[
        { pos: [-size, -size, -size], colors: ['#ff2222', '#00ffcc'] },
        { pos: [-size, -size, size], colors: ['#ff2222', '#00ffcc'] },
        { pos: [-size, size, -size], colors: ['#ff2222', '#00ffcc'] },
        { pos: [-size, size, size], colors: ['#ff2222', '#00ffcc'] },
        { pos: [size, -size, -size], colors: ['#ffdd00', '#00ffcc'] },
        { pos: [size, -size, size], colors: ['#ffdd00', '#00ffcc'] },
        { pos: [size, size, -size], colors: ['#ffdd00', '#00ffcc'] },
        { pos: [size, size, size], colors: ['#ffdd00', '#00ffcc'] },
      ].map((corner, i) => (
        <mesh key={`corner-${i}`} position={corner.pos as [number, number, number]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color={corner.colors[i % 2 === 0 ? 0 : 1]} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

function Scene({ isHovered }: { isHovered: boolean }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <WireframeCube isHovered={isHovered} />
      <EffectComposer>
        <Bloom 
          intensity={1.5}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}

interface TriColorCubeButtonProps {
  onClick: () => void
  isDark?: boolean
}

export function TriColorCubeButton({ onClick, isDark = true }: TriColorCubeButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-[60] flex items-center gap-2">
      {/* Arrow indicator pointing left */}
      <div 
        className={`
          flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
          transition-all duration-300 animate-pulse
          ${isDark ? 'bg-white/10 text-white/70' : 'bg-black/10 text-black/70'}
          ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-60 translate-x-1'}
        `}
      >
        <svg 
          className="w-4 h-4 animate-bounce-horizontal" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ animation: 'bounceHorizontal 1.5s ease-in-out infinite' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="hidden sm:inline">tap</span>
      </div>
      
      {/* The 3D Cube Button */}
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-testid="tricolor-cube-button"
        className={`
          w-20 h-20 rounded-xl
          transition-all duration-300
          ${isHovered ? 'scale-110' : ''}
          ${isDark 
            ? 'bg-black/60 backdrop-blur-md border border-white/5' 
            : 'bg-white/60 backdrop-blur-md border border-black/5'
          }
        `}
        style={{
          boxShadow: isHovered 
            ? '0 0 40px rgba(0, 255, 204, 0.4), 0 0 60px rgba(255, 34, 34, 0.3), 0 0 60px rgba(255, 221, 0, 0.3)' 
            : '0 0 20px rgba(0, 255, 204, 0.2), 0 0 30px rgba(255, 34, 34, 0.15), 0 0 30px rgba(255, 221, 0, 0.15)'
        }}
      >
        <Canvas 
          camera={{ position: [0, 0, 2.2], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Scene isHovered={isHovered} />
        </Canvas>
      </button>
      
      {/* Add keyframes for horizontal bounce */}
      <style jsx global>{`
        @keyframes bounceHorizontal {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-4px); }
        }
      `}</style>
    </div>
  )
}

export default TriColorCubeButton
