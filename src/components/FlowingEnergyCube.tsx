'use client'

/**
 * FlowingEnergyCube - Energy ribbons flowing through cube structure
 * Matches mockup: blue/purple/pink/orange flowing ribbons with sparkles
 */

import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'

// Energy ribbon shader - flowing aurora-like streams
const ribbonVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  
  uniform float uTime;
  uniform float uIntensity;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    
    // Gentle wave motion
    float wave = sin(position.x * 2.0 + uTime * 0.5) * 0.02;
    wave += sin(position.y * 2.0 + uTime * 0.3) * 0.02;
    vec3 displaced = position + normal * wave * uIntensity;
    
    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = worldPos.xyz;
    
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const ribbonFragmentShader = `
  precision highp float;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  
  uniform float uTime;
  uniform float uIntensity;
  
  // Simplex noise for organic flow
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i  = floor(v + dot(v, C.yyy));
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
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
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
    float time = uTime * 0.3;
    
    // Create flowing ribbon patterns
    vec3 flowPos = vPosition * 2.0;
    
    // Main flow direction
    float flow1 = snoise(flowPos + vec3(time * 0.5, time * 0.3, 0.0));
    float flow2 = snoise(flowPos * 1.3 + vec3(time * 0.4, -time * 0.2, time * 0.3));
    float flow3 = snoise(flowPos * 0.8 + vec3(-time * 0.3, time * 0.5, time * 0.2));
    
    // Combine into ribbon-like structures
    float ribbons = flow1 * 0.4 + flow2 * 0.35 + flow3 * 0.25;
    ribbons = smoothstep(-0.3, 0.8, ribbons);
    
    // Create defined energy paths
    float paths = abs(fract(ribbons * 3.0 + time * 0.2) - 0.5) * 2.0;
    paths = 1.0 - smoothstep(0.4, 0.9, paths);
    
    // Color gradient: blue → purple → pink → orange
    vec3 deepBlue = vec3(0.2, 0.4, 1.0);
    vec3 electricPurple = vec3(0.5, 0.2, 0.9);
    vec3 hotPink = vec3(1.0, 0.3, 0.6);
    vec3 warmOrange = vec3(1.0, 0.55, 0.2);
    vec3 brightCyan = vec3(0.3, 0.8, 1.0);
    vec3 white = vec3(1.0, 0.95, 1.0);
    
    // Build flowing color
    float colorFlow = fract(ribbons + time * 0.15);
    vec3 color;
    
    if (colorFlow < 0.25) {
      color = mix(deepBlue, electricPurple, colorFlow * 4.0);
    } else if (colorFlow < 0.5) {
      color = mix(electricPurple, hotPink, (colorFlow - 0.25) * 4.0);
    } else if (colorFlow < 0.75) {
      color = mix(hotPink, warmOrange, (colorFlow - 0.5) * 4.0);
    } else {
      color = mix(warmOrange, brightCyan, (colorFlow - 0.75) * 4.0);
    }
    
    // Brighten the paths
    color = mix(color, white, paths * 0.6);
    
    // Add glow based on intensity
    color *= 1.2 + uIntensity * 0.5;
    
    // Fresnel edge glow
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0);
    color += mix(brightCyan, hotPink, sin(time) * 0.5 + 0.5) * fresnel * 1.5;
    
    // Pulse
    float pulse = sin(uTime * 0.6) * 0.15 + 0.85;
    color *= pulse;
    
    // Alpha - make ribbons visible
    float alpha = ribbons * 0.6 + paths * 0.3 + fresnel * 0.2;
    alpha = clamp(alpha, 0.2, 0.9);
    
    gl_FragColor = vec4(color, alpha);
  }
`

interface FlowingEnergyCubeProps {
  intensity?: number
}

export function FlowingEnergyCube({ intensity = 0.5 }: FlowingEnergyCubeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const innerRef = useRef<THREE.Mesh>(null)
  const middleRef = useRef<THREE.Mesh>(null)
  const outerRef = useRef<THREE.Mesh>(null)
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uIntensity: { value: intensity },
  }), [])
  
  useEffect(() => {
    uniforms.uIntensity.value = intensity
  }, [intensity, uniforms])
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    uniforms.uTime.value = time
    
    if (groupRef.current) {
      // Slow elegant rotation
      groupRef.current.rotation.y = time * 0.1
      groupRef.current.rotation.x = Math.sin(time * 0.07) * 0.1
      groupRef.current.rotation.z = Math.sin(time * 0.05) * 0.05
      // Floating
      groupRef.current.position.y = Math.sin(time * 0.35) * 0.08
    }
  })
  
  return (
    <group ref={groupRef}>
      {/* Inner energy core - brightest layer */}
      <RoundedBox args={[1.3, 1.3, 1.3]} radius={0.18} smoothness={12} ref={innerRef}>
        <shaderMaterial
          vertexShader={ribbonVertexShader}
          fragmentShader={ribbonFragmentShader}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </RoundedBox>
      
      {/* Middle layer - adds depth */}
      <RoundedBox args={[1.45, 1.45, 1.45]} radius={0.19} smoothness={12} ref={middleRef}>
        <shaderMaterial
          vertexShader={ribbonVertexShader}
          fragmentShader={ribbonFragmentShader}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </RoundedBox>
      
      {/* Outer layer - softer glow */}
      <RoundedBox args={[1.55, 1.55, 1.55]} radius={0.2} smoothness={12} ref={outerRef}>
        <shaderMaterial
          vertexShader={ribbonVertexShader}
          fragmentShader={ribbonFragmentShader}
          uniforms={{
            uTime: uniforms.uTime,
            uIntensity: { value: uniforms.uIntensity.value * 0.6 }
          }}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </RoundedBox>
      
      {/* Orange core glow */}
      <mesh scale={0.2}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          color="#ff7733" 
          transparent 
          opacity={0.7 + intensity * 0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Sparkle particles */}
      {[...Array(60)].map((_, i) => {
        const angle1 = (i / 60) * Math.PI * 2
        const angle2 = Math.sin(i * 0.5) * Math.PI
        const radius = 0.5 + Math.random() * 0.3
        
        const x = Math.cos(angle1) * Math.cos(angle2) * radius
        const y = Math.sin(angle2) * radius
        const z = Math.sin(angle1) * Math.cos(angle2) * radius
        
        const isOrange = i % 5 === 0
        const color = isOrange ? "#ff9944" : (i % 3 === 0 ? "#66ddff" : "#ff66cc")
        
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshBasicMaterial 
              color={color}
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        )
      })}
    </group>
  )
}
