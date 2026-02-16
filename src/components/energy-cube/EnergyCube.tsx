'use client'

/**
 * EnergyCube - Wireframe Energy Cube with flowing energy lines
 * High-tech aesthetic matching the mockup design
 */

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export type EnergyCubeColor = 'orange' | 'red' | 'green' | 'yellow'
export type EnergyCubeMode = 'listening' | 'speaking' | 'processing'

const energyVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  
  uniform float uTime;
  uniform float uModeIntensity;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    
    // Mode-reactive breathing
    float breathe = sin(uTime * 0.6) * 0.02;
    float modePulse = uModeIntensity * 0.08;
    vec3 displaced = position * (1.0 + breathe + modePulse);
    
    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = worldPos.xyz;
    
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const energyFragmentShader = `
  precision highp float;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  
  uniform float uTime;
  uniform float uModeIntensity;
  uniform vec3 uPrimaryColor;
  uniform vec3 uSecondaryColor;
  uniform vec3 uAccentColor;
  
  // Simplex noise
  vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
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
    
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
            
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
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
  
  void main() {
    float time = uTime * 0.2;
    
    // Energy flow along the surface
    float flow1 = snoise(vPosition * 3.0 + vec3(time, 0.0, 0.0));
    float flow2 = snoise(vPosition * 2.0 + vec3(0.0, time * 0.8, time * 0.5));
    
    // Wireframe-like grid pattern
    vec3 gridPos = vPosition * 8.0;
    float gridX = abs(fract(gridPos.x) - 0.5);
    float gridY = abs(fract(gridPos.y) - 0.5);
    float gridZ = abs(fract(gridPos.z) - 0.5);
    float grid = min(min(gridX, gridY), gridZ);
    float wireframe = smoothstep(0.48, 0.45, grid);
    
    // Energy veins
    float veins = (flow1 + flow2) * 0.5;
    veins = smoothstep(-0.3, 0.8, veins);
    
    // Build color
    vec3 color = mix(uPrimaryColor, uSecondaryColor, smoothstep(-0.5, 0.5, flow1));
    color = mix(color, uAccentColor, smoothstep(0.0, 0.8, flow2) * 0.6);
    color = mix(color, vec3(0.2, 0.7, 1.0), wireframe * 0.4);
    
    // Orange accent on energy peaks
    float energyPeak = smoothstep(0.6, 0.9, veins);
    color = mix(color, uAccentColor, energyPeak * 0.5);
    
    // Mode reactive - add glow
    color = mix(color, uAccentColor, uModeIntensity * 0.4);
    
    // Bright wireframe lines
    color = mix(color, vec3(1.0, 0.95, 1.0), wireframe * veins * 0.6);
    
    // Fresnel glow (boosted for no bloom)
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.2);
    color += vec3(0.2, 0.7, 1.0) * fresnel * 1.2;
    color += uAccentColor * fresnel * 0.5 * uModeIntensity;
    
    // Extra glow for energy
    color *= 1.3;
    
    // Pulsing
    float pulse = sin(uTime * 0.6) * 0.5 + 0.5;
    color *= 0.9 + pulse * 0.1;
    
    // Alpha
    float alpha = 0.6 + veins * 0.3 + wireframe * 0.2;
    alpha = clamp(alpha, 0.4, 0.95);
    
    gl_FragColor = vec4(color, alpha);
  }
`

interface EnergyCubeProps {
  color?: EnergyCubeColor
  mode?: EnergyCubeMode
  className?: string
}

export function EnergyCube({ color = 'orange', mode = 'listening' }: EnergyCubeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const edgesRef = useRef<THREE.LineSegments>(null)
  
  // Color configs
  const colorConfig = useMemo(() => {
    switch (color) {
      case 'orange':
        return {
          primary: new THREE.Color(1.0, 0.5, 0.15),
          secondary: new THREE.Color(1.0, 0.7, 0.3),
          accent: new THREE.Color(1.0, 0.55, 0.2)
        }
      case 'red':
        return {
          primary: new THREE.Color(0.95, 0.25, 0.4),
          secondary: new THREE.Color(1.0, 0.3, 0.5),
          accent: new THREE.Color(0.95, 0.2, 0.4)
        }
      case 'green':
        return {
          primary: new THREE.Color(0.2, 0.9, 0.5),
          secondary: new THREE.Color(0.3, 1.0, 0.6),
          accent: new THREE.Color(0.2, 0.8, 0.5)
        }
      case 'yellow':
        return {
          primary: new THREE.Color(1.0, 0.85, 0.3),
          secondary: new THREE.Color(1.0, 0.9, 0.5),
          accent: new THREE.Color(1.0, 0.8, 0.2)
        }
    }
  }, [color])
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uModeIntensity: { value: 0 },
    uPrimaryColor: { value: colorConfig.primary },
    uSecondaryColor: { value: colorConfig.secondary },
    uAccentColor: { value: colorConfig.accent },
  }), [colorConfig])
  
  // Update colors when color changes
  useEffect(() => {
    uniforms.uPrimaryColor.value = colorConfig.primary
    uniforms.uSecondaryColor.value = colorConfig.secondary
    uniforms.uAccentColor.value = colorConfig.accent
  }, [colorConfig, uniforms])
  
  // Update mode intensity
  useEffect(() => {
    const targetIntensity = mode === 'speaking' ? 1.0 : mode === 'processing' ? 0.7 : 0.3
    let current = uniforms.uModeIntensity.value
    
    const animate = () => {
      current += (targetIntensity - current) * 0.1
      uniforms.uModeIntensity.value = current
      if (Math.abs(targetIntensity - current) > 0.01) {
        requestAnimationFrame(animate)
      }
    }
    animate()
  }, [mode, uniforms])
  
  // Create glowing edges
  const edges = useMemo(() => {
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
    const edges = new THREE.EdgesGeometry(geometry)
    return edges
  }, [])
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    uniforms.uTime.value = time
    
    if (groupRef.current) {
      // Elegant rotation
      groupRef.current.rotation.y = time * 0.15
      groupRef.current.rotation.x = Math.sin(time * 0.08) * 0.15
      groupRef.current.rotation.z = Math.sin(time * 0.06) * 0.08
      // Floating
      groupRef.current.position.y = Math.sin(time * 0.4) * 0.08
    }
    
    // Pulse edges on mode
    if (edgesRef.current) {
      const material = edgesRef.current.material as THREE.LineBasicMaterial
      material.opacity = 0.4 + uniforms.uModeIntensity.value * 0.4 + Math.sin(time * 2) * 0.1
    }
  })
  
  return (
    <group ref={groupRef}>
      {/* Main energy cube */}
      <mesh ref={meshRef}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <shaderMaterial
          vertexShader={energyVertexShader}
          fragmentShader={energyFragmentShader}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Glowing edges */}
      <lineSegments ref={edgesRef} geometry={edges}>
        <lineBasicMaterial
          color="#88ccff"
          transparent
          opacity={0.5}
          linewidth={2}
        />
      </lineSegments>
      
      {/* Inner core sphere */}
      <mesh scale={0.3}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          color={colorConfig.accent}
          transparent 
          opacity={0.5 + uniforms.uModeIntensity.value * 0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Sparkle particles inside */}
      {[...Array(40)].map((_, i) => {
        const x = (Math.random() - 0.5) * 1.2
        const y = (Math.random() - 0.5) * 1.2
        const z = (Math.random() - 0.5) * 1.2
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.01, 8, 8]} />
            <meshBasicMaterial 
              color={i % 3 === 0 ? colorConfig.accent : new THREE.Color(0.4, 0.8, 1.0)}
              transparent
              opacity={0.6}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        )
      })}
    </group>
  )
}
