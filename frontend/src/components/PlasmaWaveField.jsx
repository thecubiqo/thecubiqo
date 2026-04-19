import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 80000 // High density for plasma look
const CUBE_SIZE = 2.4

// Color Palettes matching the new reference images
const COLOR_PALETTES = {
  neutral: [
    new THREE.Color('#00ffff'), // Cyan
    new THREE.Color('#0088ff'), // Blue
    new THREE.Color('#8800ff'), // Purple
    new THREE.Color('#ff00ff'), // Magenta
    new THREE.Color('#ff0088'), // Pink
  ],
  listening: [
    new THREE.Color('#00ffcc'),
    new THREE.Color('#00ccff'),
    new THREE.Color('#3366ff'),
    new THREE.Color('#9933ff'),
  ],
  thinking: [
    new THREE.Color('#ff00ff'),
    new THREE.Color('#8800ff'),
    new THREE.Color('#ff6600'), // Orange highlights
    new THREE.Color('#ffcc00'),
  ],
  speaking: [
    new THREE.Color('#00ffff'),
    new THREE.Color('#ffffff'),
    new THREE.Color('#0088ff'),
  ]
}

export function PlasmaWaveField({ isEnabled, aiState = 'neutral' }) {
  const pointsRef = useRef()
  const morphProgress = useRef(0)
  
  // Create geometry and initial data
  const { positions, colors, sizes, userData } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    const cols = new Float32Array(PARTICLE_COUNT * 3)
    const szs = new Float32Array(PARTICLE_COUNT)
    
    // Target positions for morphing
    const wavePos = new Float32Array(PARTICLE_COUNT * 3)
    const cubePos = new Float32Array(PARTICLE_COUNT * 3)
    const phases = new Float32Array(PARTICLE_COUNT)
    const types = new Float32Array(PARTICLE_COUNT) // 0: wave, 1: wisp
    
    const palette = COLOR_PALETTES[aiState] || COLOR_PALETTES.neutral

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      
      // 1. WAVE TARGET (Matches Pic 1)
      // We create a "ribbon" structure with some noise
      const t = Math.random()
      const x = (t - 0.5) * 12
      const layer = Math.floor(Math.random() * 5)
      const yOffset = (layer - 2) * 0.4
      const z = (Math.random() - 0.5) * 2.0
      
      wavePos[i3] = x
      wavePos[i3 + 1] = yOffset
      wavePos[i3 + 2] = z
      
      // 2. CUBE TARGET (Matches Pic 2)
      // Mix of surface and interior wisps
      const isWisp = Math.random() < 0.4
      types[i] = isWisp ? 1 : 0
      
      let cx, cy, cz
      if (isWisp) {
        // Internal wisps - swirling around center
        const r = Math.random() * CUBE_SIZE * 0.5
        const theta = Math.random() * Math.PI * 2
        const phi = Math.random() * Math.PI
        cx = r * Math.sin(phi) * Math.cos(theta)
        cy = r * Math.sin(phi) * Math.sin(theta)
        cz = r * Math.cos(phi)
      } else {
        // Cube faces
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
        
        // Add some "plasma" bowing
        const bulge = 1.0 + Math.exp(-(cx*cx + cy*cy + cz*cz)) * 0.2
        cx *= bulge; cy *= bulge; cz *= bulge;
      }
      
      cubePos[i3] = cx
      cubePos[i3 + 1] = cy
      cubePos[i3 + 2] = cz
      
      // Initial state
      pos[i3] = wavePos[i3]
      pos[i3 + 1] = wavePos[i3 + 1]
      pos[i3 + 2] = wavePos[i3 + 2]
      
      // Colors - Gradient Blue -> Purple -> Pink
      const colorT = t // Horizontal gradient
      const colorIdx = Math.floor(colorT * (palette.length - 1))
      const nextColorIdx = Math.min(colorIdx + 1, palette.length - 1)
      const lerpT = (colorT * (palette.length - 1)) % 1
      const c = new THREE.Color().lerpColors(palette[colorIdx], palette[nextColorIdx], lerpT)
      
      // Add some color variation for cube wisps (orange/pink)
      if (isWisp) {
        c.lerp(new THREE.Color('#ff6b35'), Math.random() * 0.3)
      }
      
      cols[i3] = c.r
      cols[i3 + 1] = c.g
      cols[i3 + 2] = c.b
      
      szs[i] = 0.02 + Math.random() * 0.04
      phases[i] = Math.random() * Math.PI * 2
    }
    
    return { positions: pos, colors: cols, sizes: szs, userData: { wavePos, cubePos, phases, types } }
  }, [aiState])

  useFrame((state) => {
    if (!pointsRef.current) return
    const time = state.clock.elapsedTime
    
    // Smooth morphing
    const targetMorph = isEnabled ? 1 : 0
    morphProgress.current = THREE.MathUtils.lerp(morphProgress.current, targetMorph, 0.06)
    const morph = morphProgress.current
    
    const posAttr = pointsRef.current.geometry.attributes.position
    const { wavePos, cubePos, phases, types } = userData
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      const phase = phases[i]
      const type = types[i]
      
      // WAVE ANIMATION
      let wx = wavePos[i3]
      let wy = wavePos[i3 + 1]
      let wz = wavePos[i3 + 2]
      
      // Multi-sine wave motion
      const wave1 = Math.sin(wx * 0.6 + time * 1.2 + phase) * 0.8
      const wave2 = Math.sin(wx * 0.3 - time * 0.8 + phase * 0.5) * 0.5
      const wave3 = Math.cos(wz * 0.5 + time * 0.5) * 0.3
      
      wy += wave1 + wave2 + wave3
      wz += Math.sin(time * 0.4 + phase) * 0.2
      
      // CUBE ANIMATION
      let cx = cubePos[i3]
      let cy = cubePos[i3 + 1]
      let cz = cubePos[i3 + 2]
      
      if (type === 1) {
        // Wisp swirling
        const r = Math.sqrt(cx*cx + cz*cz)
        const angle = Math.atan2(cz, cx) + time * 0.5 + phase * 0.1
        cx = r * Math.cos(angle)
        cz = r * Math.sin(angle)
        cy += Math.sin(time + phase) * 0.1
      } else {
        // Face breathing
        const pulse = 1.0 + Math.sin(time * 1.5 + phase) * 0.03
        cx *= pulse; cy *= pulse; cz *= pulse
      }
      
      // Interpolate
      posAttr.array[i3] = THREE.MathUtils.lerp(wx, cx, morph)
      posAttr.array[i3 + 1] = THREE.MathUtils.lerp(wy, cy, morph)
      posAttr.array[i3 + 2] = THREE.MathUtils.lerp(wz, cz, morph)
    }
    
    posAttr.needsUpdate = true
    
    // Slow rotation
    pointsRef.current.rotation.y = time * 0.1
    if (morph > 0.5) {
      pointsRef.current.rotation.y += (morph - 0.5) * time * 0.3
      pointsRef.current.rotation.x = Math.sin(time * 0.2) * 0.1
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={PARTICLE_COUNT}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={PARTICLE_COUNT}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`
          attribute float size;
          varying vec3 vColor;
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          void main() {
            float r = distance(gl_PointCoord, vec2(0.5));
            if (r > 0.5) discard;
            float strength = pow(1.0 - r * 2.0, 3.0);
            gl_FragColor = vec4(vColor, strength * 0.8);
          }
        `}
        vertexColors
      />
    </points>
  )
}

export default PlasmaWaveField
