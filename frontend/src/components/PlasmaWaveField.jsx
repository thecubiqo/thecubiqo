'use client'

/**
 * PlasmaWaveField - HD Plasma Wave Animation with Morph to Cube
 * 
 * Features:
 * - Default: Flowing 3D plasma pipes with interactive waves
 * - Active: Smooth morph transition to isometric rotating plasma cube
 * - AI state color palette support
 * - 3D Instanced rendering for performance
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Color palettes for different AI states
const COLOR_PALETTES = {
  neutral: [
    new THREE.Color('#00ffff'),  // Cyan
    new THREE.Color('#0088ff'),  // Blue
    new THREE.Color('#8800ff'),  // Purple
    new THREE.Color('#ff00ff'),  // Magenta
    new THREE.Color('#ff0088'),  // Pink
    new THREE.Color('#ff4400'),  // Red-Orange
  ],
  thinking: [
    new THREE.Color('#00ffff'),  // Cyan
    new THREE.Color('#00aa88'),  // Teal
    new THREE.Color('#4400ff'),  // Indigo
    new THREE.Color('#8800ff'),  // Violet
    new THREE.Color('#ff8800'),  // Orange
    new THREE.Color('#ffaa00'),  // Amber
  ],
  speaking: [
    new THREE.Color('#00ff88'),  // Emerald
    new THREE.Color('#00aa88'),  // Teal
    new THREE.Color('#0088ff'),  // Blue
    new THREE.Color('#8800ff'),  // Violet
    new THREE.Color('#ff0088'),  // Pink
    new THREE.Color('#ffff00'),  // Yellow
  ],
  listening: [
    new THREE.Color('#00ffcc'),  // Aqua
    new THREE.Color('#00ffff'),  // Cyan
    new THREE.Color('#0088ff'),  // Blue
    new THREE.Color('#8800ff'),  // Violet
    new THREE.Color('#ff00ff'),  // Magenta
    new THREE.Color('#ff0088'),  // Pink
    new THREE.Color('#ff8800'),  // Orange
  ],
  error: [
    new THREE.Color('#ff0000'),
    new THREE.Color('#ff2200'),
    new THREE.Color('#ff4400'),
    new THREE.Color('#ff0044'),
    new THREE.Color('#ff0088'),
    new THREE.Color('#ff4488'),
  ],
}

// AIState type removed for JS
// PlasmaWaveFieldProps interface removed for JS

// Pre-allocate objects outside render loop for performance
const _m = new THREE.Matrix4()
const _p0 = new THREE.Vector3()
const _p1 = new THREE.Vector3()
const _center = new THREE.Vector3()
const _q = new THREE.Quaternion()
const _up = new THREE.Vector3(0, 1, 0)
const _vec = new THREE.Vector3()

// Single shared temp array for faster point computation
const tempPos = new Float32Array(500 * 3)

export function PlasmaWaveField({
  isEnabled = false,
  aiState = 'neutral'
}) {
  const cylinderInstancedRef = useRef(null)
  const sphereInstancedRef = useRef(null)
  const soulNodesRef = useRef(null)

  const morphProgress = useRef(0)
  const targetMorph = useRef(0)

  // Configuration
  const RIBBON_COUNT = 30
  const POINTS_PER_RIBBON = 50
  const TOTAL_POINTS = RIBBON_COUNT * POINTS_PER_RIBBON
  const TOTAL_SEGMENTS = RIBBON_COUNT * (POINTS_PER_RIBBON - 1)
  const CUBE_SIZE = 1.4
  const PIPE_RADIUS = 0.012
  const SOUL_NODE_COUNT = 50

  // Generate wave data
  const { ribbonsData, pointColors, segmentColors } = useMemo(() => {
    const palette = COLOR_PALETTES[aiState] || COLOR_PALETTES.neutral

    const data = []
    const pCols = new Float32Array(TOTAL_POINTS * 3)
    const sCols = new Float32Array(TOTAL_SEGMENTS * 3)

    let pIdx = 0
    let sIdx = 0

    for (let r = 0; r < RIBBON_COUNT; r++) {
      const ribbonY = (r / RIBBON_COUNT - 0.5) * 2.5 // Tighter vertical spread
      const layerDepth = (Math.random() - 0.5) * 1.5 // Tighter depth
      const waveFreq = 1.2 + r * 0.04

      const ribbon = []
      for (let p = 0; p < POINTS_PER_RIBBON; p++) {
        const t = p / (POINTS_PER_RIBBON - 1)
        const x = (t - 0.5) * 9.0
        const y = ribbonY
        const z = layerDepth

        // Cube position - mix surface and interior
        const isInterior = Math.random() < 0.2
        let cx = 0, cy = 0, cz = 0
        if (isInterior) {
          cx = (Math.random() - 0.5) * CUBE_SIZE
          cy = (Math.random() - 0.5) * CUBE_SIZE
          cz = (Math.random() - 0.5) * CUBE_SIZE
        } else {
          const face = Math.floor(Math.random() * 6)
          const u = (Math.random() - 0.5) * CUBE_SIZE
          const v = (Math.random() - 0.5) * CUBE_SIZE
          const half = CUBE_SIZE / 2
          switch (face) {
            case 0: cx = half; cy = u; cz = v; break
            case 1: cx = -half; cy = u; cz = v; break
            case 2: cx = u; cy = half; cz = v; break
            case 3: cx = u; cy = -half; cz = v; break
            case 4: cx = u; cy = v; cz = half; break
            case 5: cx = u; cy = v; cz = -half; break
          }
        }

        ribbon.push({ wX: x, wY: y, wZ: z, cX: cx, cY: cy, cZ: cz, freq: waveFreq, phase: r })

        // Assign colors based on position in ribbon
        const colorIdx = Math.floor(t * (palette.length - 1))
        const nextColorIdx = Math.min(colorIdx + 1, palette.length - 1)
        const colorT = (t * (palette.length - 1)) % 1

        const c = new THREE.Color().lerpColors(palette[colorIdx], palette[nextColorIdx], colorT)
        // Depth-based brightness
        const depthFactor = 0.5 + ((layerDepth + 1.0) / 2.0) * 0.5
        c.multiplyScalar(depthFactor)

        pCols[pIdx * 3] = c.r
        pCols[pIdx * 3 + 1] = c.g
        pCols[pIdx * 3 + 2] = c.b

        if (p < POINTS_PER_RIBBON - 1) {
          sCols[sIdx * 3] = c.r
          sCols[sIdx * 3 + 1] = c.g
          sCols[sIdx * 3 + 2] = c.b
          sIdx++
        }
        pIdx++
      }
      data.push(ribbon)
    }

    return { ribbonsData: data, pointColors: pCols, segmentColors: sCols }
  }, [aiState])

  // Efficiently push colors to Instances
  useEffect(() => {
    if (cylinderInstancedRef.current && segmentColors) {
      const color = new THREE.Color()
      for (let i = 0; i < TOTAL_SEGMENTS; i++) {
        color.setRGB(segmentColors[i * 3], segmentColors[i * 3 + 1], segmentColors[i * 3 + 2])
        cylinderInstancedRef.current.setColorAt(i, color)
      }
      if (cylinderInstancedRef.current.instanceColor) {
        cylinderInstancedRef.current.instanceColor.needsUpdate = true
      }
    }

    if (sphereInstancedRef.current && pointColors) {
      const color = new THREE.Color()
      for (let i = 0; i < TOTAL_POINTS; i++) {
        color.setRGB(pointColors[i * 3], pointColors[i * 3 + 1], pointColors[i * 3 + 2])
        sphereInstancedRef.current.setColorAt(i, color)
      }
      if (sphereInstancedRef.current.instanceColor) {
        sphereInstancedRef.current.instanceColor.needsUpdate = true
      }
    }
  }, [segmentColors, pointColors])

  // Soul nodes (orange floating interactive elements)
  const soulNodeData = useMemo(() => {
    const data = []
    for (let i = 0; i < SOUL_NODE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = Math.random() * 1.5

      data.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        vx: (Math.random() - 0.5) * 0.02,
        vy: (Math.random() - 0.5) * 0.02,
        vz: (Math.random() - 0.5) * 0.02,
      })
    }
    return data
  }, [])

  // Update morph target smoothly
  useEffect(() => {
    targetMorph.current = isEnabled ? 1 : 0
  }, [isEnabled])

  useFrame((state) => {
    const time = state.clock.elapsedTime
    // Subtle mouse interaction
    const mouseX = (state.pointer.x * state.viewport.width) / 2
    const mouseY = (state.pointer.y * state.viewport.height) / 2

    // Morph interpolation
    const morphSpeed = 0.015
    if (morphProgress.current < targetMorph.current) {
      morphProgress.current = Math.min(morphProgress.current + morphSpeed, 1)
    } else if (morphProgress.current > targetMorph.current) {
      morphProgress.current = Math.max(morphProgress.current - morphSpeed, 0)
    }

    const morph = morphProgress.current
    let segIdx = 0
    let ptIdx = 0

    // Dynamic movement based on AI state
    let rotSpeed = 0.05; // neutral
    let pulseSpeed = 1;
    let pulseAmount = 0.02;
    let orbitMultiplier = 0.01;

    if (aiState === 'listening') {
      rotSpeed = 0.2;
      pulseSpeed = 3;
      pulseAmount = 0.06;
      orbitMultiplier = 0.03;
    } else if (aiState === 'thinking') {
      rotSpeed = 0.8;
      pulseSpeed = 8;
      pulseAmount = 0.03;
      orbitMultiplier = 0.08;
    } else if (aiState === 'speaking') {
      rotSpeed = 0.3;
      pulseSpeed = 6;
      pulseAmount = 0.1;
      orbitMultiplier = 0.04;
    }

    // Core rotation and breathing pulse for cube mode
    const pulse = isEnabled ? Math.sin(time * pulseSpeed) * pulseAmount : 0
    const rotY = time * rotSpeed
    const cosY = Math.cos(rotY)
    const sinY = Math.sin(rotY)

    for (let r = 0; r < RIBBON_COUNT; r++) {
      const ribbon = ribbonsData[r]

      for (let p = 0; p < POINTS_PER_RIBBON; p++) {
        const pt = ribbon[p]

        // Influence field near cursor
        const dx = pt.wX - mouseX
        const dy = pt.wY - mouseY
        const distSq = dx * dx + dy * dy
        const influence = Math.max(0, 1 - distSq / 9) * 0.4

        // Fluid wave formula (interactive)
        const animatedWaveY = pt.wY + Math.sin(time * pt.freq + pt.wX * 0.6) * (0.35 + influence) + dy * influence * 0.15
        const animatedWaveZ = pt.wZ + Math.sin(time * 0.5 + pt.phase) * (0.2 + influence)

        // Cube position with Y-axis rotation
        const cx = pt.cX * cosY - pt.cZ * sinY
        const cz = pt.cX * sinY + pt.cZ * cosY

        // Interpolate between flowing wave layout and rotating cube layout
        const curX = THREE.MathUtils.lerp(pt.wX, cx * (1 + pulse), morph)
        const curY = THREE.MathUtils.lerp(animatedWaveY, pt.cY * (1 + pulse), morph)
        const curZ = THREE.MathUtils.lerp(animatedWaveZ, cz * (1 + pulse), morph)

        tempPos[p * 3] = curX
        tempPos[p * 3 + 1] = curY
        tempPos[p * 3 + 2] = curZ

        // Apply position to Sphere joint
        if (sphereInstancedRef.current) {
          _m.makeTranslation(curX, curY, curZ)
          // Add a subtle wave-driven scale pulse to the joints
          const scale = 1.0 + Math.sin(time * 4.0 + pt.wX) * 0.15
          _m.scale(new THREE.Vector3(scale, scale, scale))
          sphereInstancedRef.current.setMatrixAt(ptIdx++, _m)
        }
      }

      // Apply positions to Connecting Cylinders
      if (cylinderInstancedRef.current) {
        for (let p = 0; p < POINTS_PER_RIBBON - 1; p++) {
          _p0.set(tempPos[p * 3], tempPos[p * 3 + 1], tempPos[p * 3 + 2])
          _p1.set(tempPos[(p + 1) * 3], tempPos[(p + 1) * 3 + 1], tempPos[(p + 1) * 3 + 2])

          const dist = _p0.distanceTo(_p1)
          if (dist > 0.0001) {
            _center.addVectors(_p0, _p1).multiplyScalar(0.5)
            _vec.subVectors(_p1, _p0).normalize()

            _q.setFromUnitVectors(_up, _vec)
            _m.compose(_center, _q, new THREE.Vector3(1, dist, 1))

            cylinderInstancedRef.current.setMatrixAt(segIdx++, _m)
          } else {
            // Collapse segment completely if dist is somehow 0
            _m.makeScale(0, 0, 0)
            cylinderInstancedRef.current.setMatrixAt(segIdx++, _m)
          }
        }
      }
    } // End ribbon loop

    if (cylinderInstancedRef.current) cylinderInstancedRef.current.instanceMatrix.needsUpdate = true
    if (sphereInstancedRef.current) sphereInstancedRef.current.instanceMatrix.needsUpdate = true

    // Animate Soul Nodes
    if (soulNodesRef.current) {
      for (let i = 0; i < SOUL_NODE_COUNT; i++) {
        const node = soulNodeData[i]
        node.x += node.vx
        node.y += node.vy
        node.z += node.vz

        // Bounding box limits (tighter during cube mode and tighter overall)
        const bounds = isEnabled ? CUBE_SIZE * 0.45 : 1.2
        if (Math.abs(node.x) > bounds) { node.vx *= -0.7; node.x = Math.sign(node.x) * bounds }
        if (Math.abs(node.y) > bounds) { node.vy *= -0.7; node.y = Math.sign(node.y) * bounds }
        if (Math.abs(node.z) > bounds) { node.vz *= -0.7; node.z = Math.sign(node.z) * bounds }

        // Spring attraction to center
        node.vx += -node.x * 0.0005
        node.vy += -node.y * 0.0005
        node.vz += -node.z * 0.0005

        // Vortex spin in cube mode
        if (isEnabled) {
          node.vx += -node.z * orbitMultiplier
          node.vz += node.x * orbitMultiplier
        }

        _m.makeTranslation(node.x, node.y, node.z)
        soulNodesRef.current.setMatrixAt(i, _m)
      }
      soulNodesRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      {/* 3D Connecting Pipes using InstancedMesh */}
      <instancedMesh ref={cylinderInstancedRef} args={[undefined, undefined, TOTAL_SEGMENTS]}>
        <cylinderGeometry args={[PIPE_RADIUS, PIPE_RADIUS, 1.0, 5]} />
        <meshStandardMaterial
          metalness={0.7}
          roughness={0.2}
          transparent
          opacity={0.85}
        />
      </instancedMesh>

      {/* 3D Joints using InstancedMesh (Spheres for smooth continuous pipes) */}
      <instancedMesh ref={sphereInstancedRef} args={[undefined, undefined, TOTAL_POINTS]}>
        <sphereGeometry args={[PIPE_RADIUS * 1.1, 8, 8]} />
        <meshStandardMaterial
          metalness={0.7}
          roughness={0.2}
          transparent
          opacity={0.85}
        />
      </instancedMesh>

      {/* Soul nodes (orange plasma particles) */}
      <instancedMesh ref={soulNodesRef} args={[undefined, undefined, SOUL_NODE_COUNT]}>
        <sphereGeometry args={[0.022, 12, 12]} />
        <meshStandardMaterial color="#ff8844" emissive="#ff6600" emissiveIntensity={2} />
      </instancedMesh>

      {/* Core glow behind the structure */}
      <mesh scale={isEnabled ? 0.35 : 0.1}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#ff4400" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

export default PlasmaWaveField
