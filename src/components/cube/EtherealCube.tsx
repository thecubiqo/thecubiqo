'use client'

/**
 * EtherealCube - Refractive Glass Solid
 * 
 * NOT an animated volume. A REFRACTIVE SOLID with:
 * - Strong Fresnel edge glow
 * - Clear glass-like shell
 * - Darker interior for contrast
 * - Internal energy visible at edges/corners only
 * - Motion from view-dependent distortion, not noise
 * - Calm faces, energized edges/corners
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface EtherealCubeProps {
  state?: 'idle' | 'listening' | 'thinking' | 'speaking'
}

// Vertex shader
const vertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vViewDirection;
  varying vec3 vWorldPosition;
  varying float vEdgeFactor;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vViewDirection = normalize(cameraPosition - worldPos.xyz);
    
    // Edge factor - how close to an edge/corner (0 = face center, 1 = edge/corner)
    vec3 absPos = abs(position);
    float maxCoord = max(max(absPos.x, absPos.y), absPos.z);
    float midCoord = absPos.x + absPos.y + absPos.z - maxCoord - min(min(absPos.x, absPos.y), absPos.z);
    
    // Higher at edges and corners
    vEdgeFactor = smoothstep(0.5, 0.9, (absPos.x + absPos.y + absPos.z) / 2.7);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Fragment shader - refractive glass solid
const fragmentShader = `
  precision highp float;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vViewDirection;
  varying vec3 vWorldPosition;
  varying float vEdgeFactor;
  
  uniform float uTime;
  uniform float uIntensity; // State-based intensity (0.0 - 1.0)
  uniform float uPulse;     // Breathing pulse for listening state
  
  // Fresnel calculation
  float fresnel(vec3 viewDir, vec3 normal, float power) {
    return pow(1.0 - max(dot(viewDir, normal), 0.0), power);
  }
  
  // Fake refraction - distorts background based on normal
  vec3 refract2(vec3 I, vec3 N, float ior) {
    float cosi = clamp(dot(I, N), -1.0, 1.0);
    float etai = 1.0, etat = ior;
    vec3 n = N;
    if (cosi < 0.0) { 
      cosi = -cosi; 
    } else { 
      float temp = etai;
      etai = etat;
      etat = temp;
      n = -N; 
    }
    float eta = etai / etat;
    float k = 1.0 - eta * eta * (1.0 - cosi * cosi);
    return k < 0.0 ? vec3(0.0) : eta * I + (eta * cosi - sqrt(k)) * n;
  }
  
  void main() {
    vec3 viewDir = normalize(vViewDirection);
    vec3 normal = normalize(vNormal);
    
    // ============ FRESNEL - Strong edge glow ============
    float fres = fresnel(viewDir, normal, 2.5);
    float fresStrong = fresnel(viewDir, normal, 4.0);
    
    // ============ REFRACTION DIRECTION ============
    vec3 refractDir = refract2(-viewDir, normal, 1.45); // Glass IOR ~1.45
    
    // View-dependent distortion (subtle movement feel)
    float viewDistortion = dot(refractDir, vec3(sin(uTime * 0.3), cos(uTime * 0.25), sin(uTime * 0.35)));
    viewDistortion *= 0.15 * uIntensity;
    
    // ============ COLOR PALETTE ============
    vec3 purple = vec3(0.45, 0.15, 0.85);
    vec3 blue = vec3(0.2, 0.4, 0.95);
    vec3 pink = vec3(0.9, 0.3, 0.6);
    vec3 orange = vec3(0.95, 0.5, 0.25);
    vec3 cyan = vec3(0.3, 0.8, 0.95);
    vec3 white = vec3(1.0, 0.98, 1.0);
    vec3 dark = vec3(0.02, 0.01, 0.04);
    
    // ============ EDGE/CORNER ENERGY ============
    // Energy only at edges and corners, faces stay calm
    float edgeEnergy = vEdgeFactor * fres;
    
    // Slight shimmer at edges based on view
    float edgeShimmer = sin(vWorldPosition.x * 8.0 + vWorldPosition.y * 8.0 + uTime * 2.0) * 0.5 + 0.5;
    edgeShimmer = edgeShimmer * vEdgeFactor * 0.3;
    
    // ============ RIM/EDGE COLOR ============
    // Iridescent edge colors based on normal direction
    float normalY = vWorldNormal.y * 0.5 + 0.5;
    float normalX = abs(vWorldNormal.x);
    float normalZ = abs(vWorldNormal.z);
    
    vec3 rimColor = mix(purple, blue, normalY);
    rimColor = mix(rimColor, pink, normalX * 0.5);
    rimColor = mix(rimColor, orange, normalZ * 0.4);
    rimColor = mix(rimColor, cyan, edgeShimmer);
    
    // Brighter at corners
    rimColor = mix(rimColor, white, vEdgeFactor * fresStrong * 0.4);
    
    // ============ INTERIOR - Dark with subtle depth ============
    // The interior should be dark, giving contrast
    vec3 interiorColor = dark;
    
    // Very subtle internal glow near edges only
    float internalGlow = vEdgeFactor * (1.0 - fres) * 0.15;
    interiorColor += purple * internalGlow;
    
    // ============ GLASS SHELL ============
    // Clear glass - mostly transparent, color at edges
    float shellOpacity = fres * 0.6 + fresStrong * 0.3;
    
    // ============ COMBINE ============
    vec3 finalColor = vec3(0.0);
    
    // Rim glow (strongest visual element)
    finalColor += rimColor * fres * (1.2 + uPulse * 0.3);
    
    // Edge energy (corners and edges glow more)
    finalColor += rimColor * edgeEnergy * (0.8 + uIntensity * 0.5);
    
    // Subtle interior (dark with hint of depth)
    finalColor = mix(interiorColor, finalColor, fres + vEdgeFactor * 0.3);
    
    // View-dependent color shift (creates subtle "life")
    vec3 viewShift = vec3(
      sin(viewDistortion * 3.14159 + 0.0) * 0.1,
      sin(viewDistortion * 3.14159 + 2.09) * 0.1,
      sin(viewDistortion * 3.14159 + 4.18) * 0.1
    );
    finalColor += viewShift * fres * uIntensity;
    
    // ============ ALPHA ============
    // More opaque at edges (glass effect), transparent at face centers
    float alpha = shellOpacity + vEdgeFactor * 0.2;
    alpha = clamp(alpha, 0.1, 0.92);
    
    // Pulse effect for listening state
    alpha += uPulse * 0.08 * fres;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`

// Create rounded box geometry
function createRoundedBoxGeometry(
  width: number,
  height: number,
  depth: number,
  radius: number,
  segments: number
): THREE.BufferGeometry {
  const shape = new THREE.Shape()
  const w = width / 2 - radius
  const h = height / 2 - radius
  
  // This creates a proper rounded box using BoxGeometry and modifying vertices
  const geometry = new THREE.BoxGeometry(width, height, depth, segments, segments, segments)
  
  const pos = geometry.getAttribute('position')
  const norm = geometry.getAttribute('normal')
  
  const v = new THREE.Vector3()
  const n = new THREE.Vector3()
  
  const halfW = width / 2
  const halfH = height / 2
  const halfD = depth / 2
  const innerW = halfW - radius
  const innerH = halfH - radius
  const innerD = halfD - radius
  
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    
    // Clamp to inner box
    const clampedX = Math.max(-innerW, Math.min(innerW, v.x))
    const clampedY = Math.max(-innerH, Math.min(innerH, v.y))
    const clampedZ = Math.max(-innerD, Math.min(innerD, v.z))
    
    // Direction from clamped point to original
    const dx = v.x - clampedX
    const dy = v.y - clampedY
    const dz = v.z - clampedZ
    
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
    
    if (dist > 0.001) {
      // Outside inner box - project onto rounded corner
      const scale = radius / dist
      v.x = clampedX + dx * scale
      v.y = clampedY + dy * scale
      v.z = clampedZ + dz * scale
      
      // Normal points outward from corner
      n.set(dx, dy, dz).normalize()
    } else {
      // On face - keep normal from original geometry
      n.fromBufferAttribute(norm, i)
    }
    
    pos.setXYZ(i, v.x, v.y, v.z)
    norm.setXYZ(i, n.x, n.y, n.z)
  }
  
  geometry.computeVertexNormals()
  
  return geometry
}

export function EtherealCube({ state = 'idle' }: EtherealCubeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Smooth transition values
  const intensityRef = useRef(0.3)
  const pulseRef = useRef(0)
  
  // Create geometry
  const geometry = useMemo(() => {
    return createRoundedBoxGeometry(1.7, 1.7, 1.7, 0.2, 24)
  }, [])
  
  // Uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uIntensity: { value: 0.3 },
    uPulse: { value: 0 }
  }), [])
  
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    
    // State-based targets
    let targetIntensity = 0.3
    let pulseSpeed = 0
    
    switch (state) {
      case 'listening':
        targetIntensity = 0.6
        pulseSpeed = 1.5
        break
      case 'thinking':
        targetIntensity = 0.8
        pulseSpeed = 2.5
        break
      case 'speaking':
        targetIntensity = 1.0
        pulseSpeed = 3.0
        break
      default: // idle
        targetIntensity = 0.3
        pulseSpeed = 0.5
    }
    
    // Smooth intensity transition
    intensityRef.current += (targetIntensity - intensityRef.current) * 0.03
    
    // Breathing pulse
    const pulse = Math.sin(t * pulseSpeed) * 0.5 + 0.5
    pulseRef.current = pulse * intensityRef.current
    
    // Update uniforms
    uniforms.uTime.value = t
    uniforms.uIntensity.value = intensityRef.current
    uniforms.uPulse.value = pulseRef.current
    
    // Very subtle rotation in idle state
    if (meshRef.current && state === 'idle') {
      meshRef.current.rotation.y = Math.sin(t * 0.1) * 0.03
    }
  })
  
  return (
    <mesh ref={meshRef} geometry={geometry}>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.FrontSide}
        depthWrite={false}
      />
    </mesh>
  )
}

export default EtherealCube
