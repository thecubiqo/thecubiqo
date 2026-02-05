'use client'

/**
 * EtherealCube - Shader-Driven Ethereal Energy Cube
 * 
 * All visual effects are shader-driven:
 * - Fresnel edge glow (purple/pink/blue/orange rim)
 * - Internal flowing 3D noise energy
 * - View-dependent refraction effect
 * - Soft ethereal glow
 * 
 * NO mesh animation, NO particles, NO baked animation
 * States controlled via uniforms
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface EtherealCubeProps {
  isTalking?: boolean
  isListening?: boolean
  isThinking?: boolean
}

// Vertex shader - passes position, normal, UV to fragment
const vertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewDirection;
  varying vec2 vUv;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vViewDirection = normalize(cameraPosition - worldPos.xyz);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Fragment shader - creates all visual effects
const fragmentShader = `
  precision highp float;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewDirection;
  varying vec2 vUv;
  
  uniform float uTime;
  uniform float uNoiseSpeed;
  uniform float uEmissiveIntensity;
  uniform float uGlowStrength;
  uniform float uState; // 0=idle, 1=listening, 2=thinking, 3=responding
  
  // ============ NOISE FUNCTIONS ============
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  // 3D Simplex Noise
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  // Fractal Brownian Motion for smoother noise
  float fbm(vec3 p, float time) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for(int i = 0; i < 4; i++) {
      value += amplitude * snoise(p * frequency + vec3(time * 0.1, time * 0.15, time * 0.12));
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }
  
  void main() {
    // Animated time based on noise speed
    float t = uTime * uNoiseSpeed;
    
    // ============ FRESNEL RIM GLOW ============
    float fresnel = pow(1.0 - max(dot(vNormal, vViewDirection), 0.0), 3.0);
    
    // ============ INTERNAL FLOWING ENERGY ============
    vec3 noisePos = vPosition * 1.5;
    
    // Multiple noise layers for flowing effect
    float noise1 = fbm(noisePos + vec3(t * 0.3, t * 0.2, -t * 0.1), t);
    float noise2 = fbm(noisePos * 0.8 - vec3(t * 0.2, -t * 0.15, t * 0.25), t * 0.8);
    float noise3 = snoise(noisePos * 2.0 + vec3(t * 0.4, t * 0.3, t * 0.2));
    
    float energy = noise1 * 0.4 + noise2 * 0.35 + noise3 * 0.25;
    energy = smoothstep(-0.3, 0.6, energy);
    
    // ============ COLOR PALETTE ============
    vec3 purple = vec3(0.55, 0.15, 0.95);
    vec3 blue = vec3(0.25, 0.45, 1.0);
    vec3 pink = vec3(0.95, 0.35, 0.65);
    vec3 orange = vec3(1.0, 0.5, 0.2);
    vec3 cyan = vec3(0.3, 0.85, 1.0);
    vec3 white = vec3(1.0, 0.98, 1.0);
    
    // ============ RIM COLOR (view-dependent) ============
    // Color changes based on viewing angle for iridescent effect
    float viewAngle = dot(vNormal, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
    float sideAngle = abs(dot(vNormal, vec3(1.0, 0.0, 0.0)));
    
    vec3 rimColor = mix(purple, blue, viewAngle);
    rimColor = mix(rimColor, pink, sideAngle * 0.6);
    rimColor = mix(rimColor, orange, pow(fresnel, 2.0) * 0.3);
    rimColor = mix(rimColor, cyan, sin(uTime * 0.5 + vPosition.y * 2.0) * 0.2 + 0.2);
    
    // ============ INTERNAL ENERGY COLOR ============
    vec3 energyColor = mix(purple, blue, noise1 * 0.5 + 0.5);
    energyColor = mix(energyColor, pink, noise2 * 0.4 + 0.3);
    energyColor = mix(energyColor, cyan, noise3 * 0.3 + 0.2);
    
    // Bright cores in energy
    float brightCore = pow(energy, 2.5);
    energyColor = mix(energyColor, white, brightCore * 0.6);
    
    // ============ SPARKLES ============
    float sparkle = snoise(vPosition * 15.0 + vec3(uTime * 3.0));
    float sparkleMask = smoothstep(0.88, 0.95, sparkle) * energy;
    
    // ============ COMBINE EFFECTS ============
    // Rim glow (stronger at edges)
    vec3 finalColor = rimColor * fresnel * uGlowStrength;
    
    // Internal energy (visible through the cube)
    float energyVisibility = energy * (0.3 + fresnel * 0.4);
    finalColor += energyColor * energyVisibility * uEmissiveIntensity;
    
    // Sparkles
    finalColor += white * sparkleMask * 0.8;
    
    // Subtle refraction-like distortion on color
    float refraction = snoise(vPosition * 3.0 + vViewDirection * 2.0 + vec3(uTime * 0.2));
    finalColor += vec3(0.1, 0.05, 0.15) * refraction * fresnel * 0.3;
    
    // ============ STATE-BASED PULSING ============
    float pulse = sin(uTime * 2.5) * 0.5 + 0.5;
    float statePulse = mix(0.0, pulse * 0.4, uState / 3.0);
    finalColor *= 1.0 + statePulse;
    
    // ============ ALPHA ============
    // Transparent in center, more visible at edges and where energy flows
    float alpha = fresnel * 0.7 + energy * 0.25 + sparkleMask * 0.3;
    alpha = clamp(alpha, 0.0, 0.95);
    
    // Boost alpha based on glow strength
    alpha *= 0.8 + uGlowStrength * 0.3;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`

// Rounded box geometry with proper normals
function createRoundedBoxGeometry(
  width: number,
  height: number,
  depth: number,
  radius: number,
  segments: number
): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(width, height, depth, segments, segments, segments)
  
  const positionAttr = geometry.getAttribute('position')
  const normalAttr = geometry.getAttribute('normal')
  
  const vertex = new THREE.Vector3()
  const normal = new THREE.Vector3()
  
  const hw = width / 2 - radius
  const hh = height / 2 - radius
  const hd = depth / 2 - radius
  
  for (let i = 0; i < positionAttr.count; i++) {
    vertex.fromBufferAttribute(positionAttr, i)
    
    // Round the corners
    const signX = Math.sign(vertex.x) || 1
    const signY = Math.sign(vertex.y) || 1
    const signZ = Math.sign(vertex.z) || 1
    
    const cornerX = Math.abs(vertex.x) > hw
    const cornerY = Math.abs(vertex.y) > hh
    const cornerZ = Math.abs(vertex.z) > hd
    
    if (cornerX || cornerY || cornerZ) {
      const clampedX = Math.max(-hw, Math.min(hw, vertex.x))
      const clampedY = Math.max(-hh, Math.min(hh, vertex.y))
      const clampedZ = Math.max(-hd, Math.min(hd, vertex.z))
      
      const dx = vertex.x - clampedX
      const dy = vertex.y - clampedY
      const dz = vertex.z - clampedZ
      
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      
      if (dist > 0) {
        const scale = radius / dist
        vertex.x = clampedX + dx * scale
        vertex.y = clampedY + dy * scale
        vertex.z = clampedZ + dz * scale
        
        normal.set(dx, dy, dz).normalize()
        normalAttr.setXYZ(i, normal.x, normal.y, normal.z)
      }
    }
    
    positionAttr.setXYZ(i, vertex.x, vertex.y, vertex.z)
  }
  
  positionAttr.needsUpdate = true
  normalAttr.needsUpdate = true
  geometry.computeVertexNormals()
  
  return geometry
}

export function EtherealCube({ isTalking = false, isListening = false, isThinking = false }: EtherealCubeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Smooth transition refs
  const noiseSpeedRef = useRef(0.3)
  const emissiveRef = useRef(0.6)
  const glowRef = useRef(1.0)
  const stateRef = useRef(0)
  
  // Create geometry once
  const geometry = useMemo(() => {
    return createRoundedBoxGeometry(1.8, 1.8, 1.8, 0.25, 32)
  }, [])
  
  // Uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uNoiseSpeed: { value: 0.3 },
    uEmissiveIntensity: { value: 0.6 },
    uGlowStrength: { value: 1.0 },
    uState: { value: 0 }
  }), [])
  
  useFrame((state) => {
    const t = state.clock.elapsedTime
    
    // Determine target values based on state
    let targetNoiseSpeed = 0.3
    let targetEmissive = 0.6
    let targetGlow = 1.0
    let targetState = 0
    
    if (isTalking) {
      targetNoiseSpeed = 1.2
      targetEmissive = 1.2
      targetGlow = 1.5
      targetState = 3
    } else if (isThinking) {
      targetNoiseSpeed = 0.8
      targetEmissive = 0.9
      targetGlow = 1.3
      targetState = 2
    } else if (isListening) {
      targetNoiseSpeed = 0.6
      targetEmissive = 0.8
      targetGlow = 1.2
      targetState = 1
    }
    
    // Smooth transitions
    const lerpSpeed = 0.04
    noiseSpeedRef.current += (targetNoiseSpeed - noiseSpeedRef.current) * lerpSpeed
    emissiveRef.current += (targetEmissive - emissiveRef.current) * lerpSpeed
    glowRef.current += (targetGlow - glowRef.current) * lerpSpeed
    stateRef.current += (targetState - stateRef.current) * lerpSpeed
    
    // Update uniforms
    uniforms.uTime.value = t
    uniforms.uNoiseSpeed.value = noiseSpeedRef.current
    uniforms.uEmissiveIntensity.value = emissiveRef.current
    uniforms.uGlowStrength.value = glowRef.current
    uniforms.uState.value = stateRef.current
    
    // Very subtle idle rotation
    if (meshRef.current && !isTalking && !isListening && !isThinking) {
      meshRef.current.rotation.y = t * 0.05
      meshRef.current.rotation.x = Math.sin(t * 0.03) * 0.02
    }
  })
  
  return (
    <mesh ref={meshRef} geometry={geometry}>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

export default EtherealCube
