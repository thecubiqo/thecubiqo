'use client'

/**
 * SilverWireLandingCube - Chrome/silver wireframe morph landing screen
 *
 * Aesthetic: pure silver/chrome geometric lines on near-black background.
 * Animation: continuous cube → sphere morph driven by a sine wave, with
 * gentle rotation and edge-opacity breathing.
 *
 * Palette:
 *   #E8E8E8 — primary silver
 *   #C0C0C0 — mid chrome
 *   #A8B8D0 — cool blue-silver accent
 *   #FFFFFF — specular highlight
 */

import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ---------------------------------------------------------------------------
// Helper: lerp between two BufferAttribute position arrays
// ---------------------------------------------------------------------------

function lerpPositions(
  from: Float32Array,
  to: Float32Array,
  t: number,
  out: Float32Array
) {
  for (let i = 0; i < from.length; i++) {
    out[i] = from[i] + (to[i] - from[i]) * t
  }
}

// ---------------------------------------------------------------------------
// Build a sphere with the SAME vertex count as BoxGeometry(1,1,1, 2,2,2)
// We use a simple icosphere-style mapping: project box vertices onto sphere.
// ---------------------------------------------------------------------------
function buildSpherePositions(boxPositions: Float32Array, radius: number): Float32Array {
  const sphere = new Float32Array(boxPositions.length)
  for (let i = 0; i < boxPositions.length; i += 3) {
    const x = boxPositions[i]
    const y = boxPositions[i + 1]
    const z = boxPositions[i + 2]
    const len = Math.sqrt(x * x + y * y + z * z) || 1
    sphere[i] = (x / len) * radius
    sphere[i + 1] = (y / len) * radius
    sphere[i + 2] = (z / len) * radius
  }
  return sphere
}

// ---------------------------------------------------------------------------
// Silver morph mesh inner component
// ---------------------------------------------------------------------------
function SilverMorphCube() {
  const meshRef = useRef<THREE.Mesh>(null)
  const outerEdgesRef = useRef<THREE.LineSegments>(null)
  const groupRef = useRef<THREE.Group>(null)

  // Build base geometry once
  const { geometry, boxPos, spherePos, morphBuf } = useMemo(() => {
    const geo = new THREE.BoxGeometry(1.6, 1.6, 1.6, 3, 3, 3)
    geo.computeVertexNormals()

    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute
    const boxPos = new Float32Array(posAttr.array)
    const spherePos = buildSpherePositions(boxPos, 1.0)
    const morphBuf = new Float32Array(boxPos.length)

    return { geometry: geo, boxPos, spherePos, morphBuf }
  }, [])

  // Silver shiny material
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#C8C8D0'),
        metalness: 0.92,
        roughness: 0.08,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        wireframe: true,
      }),
    []
  )

  // Edge geometry for the clean wireframe lines
  const edgeGeo = useMemo(() => {
    const base = new THREE.BoxGeometry(1.6, 1.6, 1.6)
    return new THREE.EdgesGeometry(base)
  }, [])

  const edgeMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color('#D8E4F0'),
        transparent: true,
        opacity: 0.85,
      }),
    []
  )

  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    // Morph factor: 0 = cube, 1 = sphere, oscillates every 4 s
    const morphT = (Math.sin(t * 0.5) * 0.5 + 0.5) // smooth 0→1→0

    // Apply morph to geometry positions
    lerpPositions(boxPos, spherePos, morphT, morphBuf)
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute
    posAttr.set(morphBuf)
    posAttr.needsUpdate = true
    geometry.computeVertexNormals()

    // Group rotation — slow elegant spin
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.18
      groupRef.current.rotation.x = Math.sin(t * 0.09) * 0.18
      groupRef.current.rotation.z = Math.sin(t * 0.07) * 0.09
      groupRef.current.position.y = Math.sin(t * 0.35) * 0.07
    }

    // Edge opacity breathing
    if (outerEdgesRef.current) {
      const mat = outerEdgesRef.current.material as THREE.LineBasicMaterial
      mat.opacity = 0.55 + Math.sin(t * 1.6) * 0.18
    }
  })

  return (
    <group ref={groupRef}>
      {/* Morphing filled wireframe — very subtle fill */}
      <mesh ref={meshRef} geometry={geometry} material={material} />

      {/* Hard crisp outer edges — the iconic silver wire look */}
      <lineSegments ref={outerEdgesRef} geometry={edgeGeo} material={edgeMaterial} />

      {/* Corner accent spheres */}
      {[
        [0.8, 0.8, 0.8], [-0.8, 0.8, 0.8], [0.8, -0.8, 0.8], [-0.8, -0.8, 0.8],
        [0.8, 0.8, -0.8], [-0.8, 0.8, -0.8], [0.8, -0.8, -0.8], [-0.8, -0.8, -0.8],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.028, 12, 12]} />
          <meshStandardMaterial
            color="#E8F0FF"
            metalness={0.98}
            roughness={0.02}
            emissive="#A8C0FF"
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}

      {/* Subtle inner cross-axis rings */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.72, 0.006, 8, 64]} />
        <meshBasicMaterial color="#B0C8E8" transparent opacity={0.35} />
      </mesh>
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[0.72, 0.006, 8, 64]} />
        <meshBasicMaterial color="#B0C8E8" transparent opacity={0.28} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.72, 0.006, 8, 64]} />
        <meshBasicMaterial color="#B0C8E8" transparent opacity={0.28} />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------
interface SilverWireLandingCubeProps {
  onComplete: () => void
  isVoiceActive?: boolean
}

export function SilverWireLandingCube({
  onComplete,
}: SilverWireLandingCubeProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer"
      style={{ background: '#080A0F' }}
      onClick={onComplete}
      data-testid="silver-wire-landing-cube"
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(160,180,220,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Horizontal rule accent lines */}
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      >
        <div
          style={{
            height: '1px',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(180,200,230,0.15) 20%, rgba(180,200,230,0.15) 80%, transparent 100%)',
          }}
        />
      </div>

      {/* 3D Canvas */}
      <div className="w-full relative z-10" style={{ height: '62vh', maxWidth: '900px' }}>
        <Canvas
          camera={{ position: [0, 0, 3.8], fov: 48 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
          dpr={[1, 2]}
        >
          {/* Lighting for metalness to show */}
          <ambientLight intensity={0.6} color="#D8E8FF" />
          <pointLight position={[4, 4, 4]} intensity={1.8} color="#FFFFFF" />
          <pointLight position={[-4, -2, 3]} intensity={0.8} color="#A0B8D8" />
          <pointLight position={[0, -4, -3]} intensity={0.5} color="#C8D8F0" />

          <SilverMorphCube />
        </Canvas>
      </div>

      {/* Wordmark */}
      <div className="text-center mt-5 relative z-10" style={{ letterSpacing: '0.05em' }}>
        <h1
          style={{
            fontWeight: 200,
            fontSize: '2.6rem',
            letterSpacing: '0.45em',
            color: 'rgba(220,228,240,0.92)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          CUBIQO
        </h1>
        <p
          style={{
            marginTop: '0.5rem',
            fontSize: '0.82rem',
            letterSpacing: '0.3em',
            color: 'rgba(160,180,210,0.6)',
            fontWeight: 300,
            textTransform: 'uppercase',
          }}
        >
          One Mind. Many Dimensions.
        </p>
        <p
          style={{
            marginTop: '2.2rem',
            fontSize: '0.65rem',
            letterSpacing: '0.22em',
            color: 'rgba(160,180,210,0.3)',
            textTransform: 'uppercase',
          }}
        >
          Tap anywhere to begin
        </p>
      </div>

      {/* Corner decorative marks */}
      {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
        <div
          key={corner}
          className="absolute pointer-events-none"
          style={{
            top: corner.startsWith('t') ? '24px' : undefined,
            bottom: corner.startsWith('b') ? '24px' : undefined,
            left: corner.endsWith('l') ? '24px' : undefined,
            right: corner.endsWith('r') ? '24px' : undefined,
            width: '18px',
            height: '18px',
            borderTop: corner.startsWith('t')
              ? '1px solid rgba(180,200,230,0.3)'
              : undefined,
            borderBottom: corner.startsWith('b')
              ? '1px solid rgba(180,200,230,0.3)'
              : undefined,
            borderLeft: corner.endsWith('l')
              ? '1px solid rgba(180,200,230,0.3)'
              : undefined,
            borderRight: corner.endsWith('r')
              ? '1px solid rgba(180,200,230,0.3)'
              : undefined,
          }}
        />
      ))}
    </div>
  )
}

export default SilverWireLandingCube
