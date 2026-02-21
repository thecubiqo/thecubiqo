'use client'

import * as THREE from 'three'
import React, { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float, Text } from '@react-three/drei'

/**
 * Premium animated "threads" using a custom shader on a line field:
 * - feels like breath / nature (slow, smooth)
 * - still tech (structured grid, metallic sheen)
 */

const vertexShader = `
  uniform float uTime;
  uniform float uAmp;
  uniform float uFreq;
  uniform float uSpeed;

  attribute float aRow;
  attribute float aCol;

  varying float vGlow;

  void main() {
    vec3 p = position;

    float row = aRow;
    float col = aCol;

    float t = uTime * uSpeed;
    float wave1 = sin((p.x * uFreq) + (row * 0.18) + t);
    float wave2 = cos((p.z * (uFreq * 0.85)) + (col * 0.10) + t * 0.85);

    p.y += (wave1 * 0.55 + wave2 * 0.45) * uAmp;
    p.x += sin(t * 0.25 + row * 0.12) * (uAmp * 0.12);

    vGlow = abs(wave1) * 0.6 + abs(wave2) * 0.4;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const fragmentShader = `
  uniform vec3 uSilverA;
  uniform vec3 uSilverB;
  uniform float uAlpha;
  uniform float uContrast;

  varying float vGlow;

  void main() {
    float g = clamp(pow(vGlow, uContrast), 0.0, 1.0);
    vec3 col = mix(uSilverA, uSilverB, g);
    float a = uAlpha * (0.55 + g * 0.65);
    gl_FragColor = vec4(col, a);
  }
`

function WaveThreads() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const { geometry } = useMemo(() => {
    const rows = 42
    const cols = 180
    const width = 9.2
    const depth = 4.4

    const positions: number[] = []
    const aRow: number[] = []
    const aCol: number[] = []

    for (let r = 0; r < rows; r++) {
      const z = THREE.MathUtils.lerp(-depth / 2, depth / 2, r / (rows - 1))
      for (let c = 0; c < cols; c++) {
        const x = THREE.MathUtils.lerp(-width / 2, width / 2, c / (cols - 1))
        positions.push(x, 0, z)
        aRow.push(r)
        aCol.push(c)
      }
    }

    const indices: number[] = []
    for (let r = 0; r < rows; r++) {
      const rowStart = r * cols
      for (let c = 0; c < cols - 1; c++) {
        indices.push(rowStart + c, rowStart + c + 1)
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('aRow', new THREE.Float32BufferAttribute(aRow, 1))
    geo.setAttribute('aCol', new THREE.Float32BufferAttribute(aCol, 1))
    geo.setIndex(indices)

    return { geometry: geo }
  }, [])

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  return (
    <lineSegments geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime:     { value: 0 },
          uAmp:      { value: 0.52 },
          uFreq:     { value: 1.15 },
          uSpeed:    { value: 0.42 },
          uSilverA:  { value: new THREE.Color(0.62, 0.64, 0.72) },
          uSilverB:  { value: new THREE.Color(0.90, 0.91, 0.95) },
          uAlpha:    { value: 0.75 },
          uContrast: { value: 1.6 },
        }}
        transparent
        depthWrite={false}
      />
    </lineSegments>
  )
}

function SoulCore() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(t * 1.1) * 0.05)
      meshRef.current.rotation.y = t * 0.25
    }
  })

  return (
    <mesh ref={meshRef} position={[0.2, 0.18, 0]}>
      <sphereGeometry args={[0.22, 64, 64]} />
      <meshStandardMaterial
        metalness={1}
        roughness={0.22}
        color="#e85c00"
        emissive="#ff6a00"
        emissiveIntensity={0.65}
      />
    </mesh>
  )
}

function Wordmark3D() {
  const spacing = 0.58
  const y = 1.72

  return (
    <group position={[-1.35, y, 0]}>
      <Float speed={0.65} rotationIntensity={0.08} floatIntensity={0.08}>
        <Text fontSize={0.55} anchorX="left" anchorY="middle" position={[0 * spacing, 0, 0]}>
          {'C'}
          <meshStandardMaterial metalness={1} roughness={0.16} color="#e85c00" emissive="#ff6a00" emissiveIntensity={0.18} />
        </Text>

        <Text fontSize={0.55} anchorX="left" anchorY="middle" position={[1 * spacing, 0, 0]}>
          {'u'}
          <meshStandardMaterial metalness={1} roughness={0.18} color="#d9d9d9" />
        </Text>

        <Text fontSize={0.55} anchorX="left" anchorY="middle" position={[2 * spacing, 0, 0]}>
          {'b'}
          <meshStandardMaterial metalness={1} roughness={0.18} color="#d9d9d9" />
        </Text>

        <Text fontSize={0.55} anchorX="left" anchorY="middle" position={[3 * spacing, 0, 0]}>
          {'i'}
          <meshStandardMaterial metalness={1} roughness={0.18} color="#d9d9d9" />
        </Text>

        <Text fontSize={0.55} anchorX="left" anchorY="middle" position={[4 * spacing, 0, 0]}>
          {'Q'}
          <meshStandardMaterial metalness={1} roughness={0.16} color="#e85c00" emissive="#ff6a00" emissiveIntensity={0.18} />
        </Text>

        <Text fontSize={0.55} anchorX="left" anchorY="middle" position={[5 * spacing, 0, 0]}>
          {'o'}
          <meshStandardMaterial metalness={1} roughness={0.18} color="#d9d9d9" />
        </Text>

        <Text fontSize={0.18} anchorX="left" anchorY="middle" position={[5.8 * spacing, 0.22, 0]}>
          {'™'}
          <meshStandardMaterial metalness={0.4} roughness={0.6} color="#8a8a8a" />
        </Text>
      </Float>
    </group>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 5, 2]} intensity={1.1} />
      <pointLight position={[-3, 2, 2]} intensity={0.8} />

      <Environment preset="city" />

      <group position={[0, -0.25, 0]}>
        <Wordmark3D />
        <WaveThreads />
        <SoulCore />
      </group>
    </>
  )
}

interface HeroWebGLProps {
  height?: string | number
}

export default function HeroWebGL({ height = '520px' }: HeroWebGLProps) {
  return (
    <div style={{ width: '100%', height, background: '#000' }}>
      <Canvas
        camera={{ position: [0, 1.6, 6.4], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Scene />
      </Canvas>
    </div>
  )
}
