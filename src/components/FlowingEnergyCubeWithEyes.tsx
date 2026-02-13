'use client'

/**
 * FlowingEnergyCubeWithEyes - Energy cube with animated eyes
 * Extension of FlowingEnergyCube with eye features from Cube.tsx
 */

import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'

// Same shaders as FlowingEnergyCube
const flowingVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  
  uniform float uTime;
  uniform float uIntensity;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    
    // Gentle breathing
    float breathe = sin(uTime * 0.5) * 0.015 * uIntensity;
    vec3 displaced = position * (1.0 + breathe);
    
    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = worldPos.xyz;
    
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const flowingFragmentShader = `
  precision highp float;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  
  uniform float uTime;
  uniform float uIntensity;
  
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
  
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 6; i++) {
      value += amplitude * snoise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
  
  void main() {
    float time = uTime * 0.15;
    vec3 pos = vPosition * 2.5;
    
    float flow1 = fbm(pos + vec3(time * 0.5, time * 0.3, time * 0.2));
    float flow2 = fbm(pos * 1.2 + vec3(-time * 0.4, time * 0.6, 0.0));
    float flow3 = fbm(pos * 0.8 - vec3(0.0, time * 0.5, time * 0.4));
    float flow4 = fbm(pos * 1.5 + vec3(time * 0.3, -time * 0.2, time * 0.4));
    
    float energy = flow1 * 0.35 + flow2 * 0.25 + flow3 * 0.25 + flow4 * 0.15;
    energy = smoothstep(-0.4, 0.7, energy);
    
    vec3 deepBlue = vec3(0.2, 0.4, 1.0);
    vec3 purple = vec3(0.5, 0.2, 0.9);
    vec3 hotPink = vec3(1.0, 0.3, 0.7);
    vec3 cyan = vec3(0.3, 0.9, 1.0);
    vec3 orange = vec3(1.0, 0.55, 0.2);
    vec3 white = vec3(1.0, 0.95, 0.98);
    
    vec3 color = mix(deepBlue, purple, smoothstep(-0.3, 0.5, flow1));
    color = mix(color, hotPink, smoothstep(-0.2, 0.6, flow2) * 0.7);
    color = mix(color, cyan, smoothstep(0.0, 0.7, flow3) * 0.5);
    
    float centerDist = length(vPosition);
    float coreGlow = smoothstep(0.9, 0.0, centerDist);
    color = mix(color, orange, coreGlow * 0.5);
    
    float veins = pow(energy, 2.0);
    color = mix(color, white, veins * 0.4);
    
    float sparkle = snoise(pos * 12.0 + vec3(time * 3.0));
    float sparkleIntensity = smoothstep(0.75, 0.95, sparkle);
    color += white * sparkleIntensity * 0.6;
    
    color *= 0.85 + uIntensity * 0.3;
    
    float pulse = sin(uTime * 0.5) * 0.5 + 0.5;
    color *= 0.85 + pulse * 0.15;
    
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.5);
    vec3 rimColor = mix(cyan, hotPink, sin(uTime * 0.3) * 0.5 + 0.5);
    color += rimColor * fresnel * 0.8;
    
    float alpha = 0.5 + energy * 0.35 + coreGlow * 0.15;
    alpha = clamp(alpha, 0.35, 0.85);
    
    gl_FragColor = vec4(color, alpha);
  }
`

interface FlowingEnergyCubeWithEyesProps {
  intensity?: number
  showEyes?: boolean
}

export function FlowingEnergyCubeWithEyes({ 
  intensity = 0.5, 
  showEyes = false 
}: FlowingEnergyCubeWithEyesProps) {
  const innerRef = useRef<THREE.Mesh>(null)
  const outerRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const edgesRef = useRef<THREE.LineSegments>(null)
  
  // Eye refs
  const leftEyeRef = useRef<THREE.Mesh>(null)
  const rightEyeRef = useRef<THREE.Mesh>(null)
  const leftPupilRef = useRef<THREE.Mesh>(null)
  const rightPupilRef = useRef<THREE.Mesh>(null)
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uIntensity: { value: intensity },
  }), [])
  
  useEffect(() => {
    uniforms.uIntensity.value = intensity
  }, [intensity, uniforms])
  
  const edges = useMemo(() => {
    const geometry = new THREE.BoxGeometry(1.52, 1.52, 1.52)
    return new THREE.EdgesGeometry(geometry)
  }, [])
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    uniforms.uTime.value = time
    
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.12
      groupRef.current.rotation.x = Math.sin(time * 0.08) * 0.1
      groupRef.current.rotation.z = Math.sin(time * 0.06) * 0.06
      groupRef.current.position.y = Math.sin(time * 0.4) * 0.06
    }
    
    if (edgesRef.current) {
      const material = edgesRef.current.material as THREE.LineBasicMaterial
      material.opacity = 0.7 + Math.sin(time * 1.5) * 0.3
    }
    
    // Eye tracking (if visible)
    if (showEyes && leftPupilRef.current && rightPupilRef.current) {
      const pupilRange = 0.04
      const mouseX = state.pointer.x
      const mouseY = state.pointer.y
      
      leftPupilRef.current.position.x = -0.4 + mouseX * pupilRange
      leftPupilRef.current.position.y = 0.4 + mouseY * pupilRange
      rightPupilRef.current.position.x = 0.4 + mouseX * pupilRange
      rightPupilRef.current.position.y = 0.4 + mouseY * pupilRange
    }
  })
  
  return (
    <group ref={groupRef}>
      {/* Inner energy core */}
      <RoundedBox args={[1.5, 1.5, 1.5]} radius={0.15} smoothness={10} ref={innerRef}>
        <shaderMaterial
          vertexShader={flowingVertexShader}
          fragmentShader={flowingFragmentShader}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </RoundedBox>
      
      {/* Secondary layer */}
      <RoundedBox args={[1.3, 1.3, 1.3]} radius={0.13} smoothness={10}>
        <shaderMaterial
          vertexShader={flowingVertexShader}
          fragmentShader={flowingFragmentShader}
          uniforms={uniforms}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </RoundedBox>
      
      {/* Bright edges */}
      <lineSegments ref={edgesRef} geometry={edges}>
        <lineBasicMaterial
          color="#66ccff"
          transparent
          opacity={0.8}
          linewidth={3}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
      
      {/* Core glow */}
      <mesh scale={0.25}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          color="#ff8844" 
          transparent 
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Sparkle particles */}
      {[...Array(50)].map((_, i) => {
        const x = (Math.random() - 0.5) * 1.3
        const y = (Math.random() - 0.5) * 1.3
        const z = (Math.random() - 0.5) * 1.3
        const isOrange = i % 4 === 0
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshBasicMaterial 
              color={isOrange ? "#ff9944" : "#66ddff"}
              transparent
              opacity={0.8}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        )
      })}
      
      {/* Glass shell */}
      <RoundedBox args={[1.52, 1.52, 1.52]} radius={0.16} smoothness={10} ref={outerRef}>
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.08}
          roughness={0.1}
          metalness={0.1}
          transmission={0.95}
          thickness={0.5}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </RoundedBox>
      
      {/* Eyes (optional) */}
      {showEyes && (
        <group position={[0, 0, 0.77]}>
          {/* Left Eye */}
          <mesh ref={leftEyeRef} position={[-0.4, 0.4, 0]}>
            <circleGeometry args={[0.12, 32]} />
            <meshBasicMaterial 
              color={0x000000} 
              transparent 
              opacity={0.8}
              depthWrite={false}
            />
          </mesh>
          
          {/* Right Eye */}
          <mesh ref={rightEyeRef} position={[0.4, 0.4, 0]}>
            <circleGeometry args={[0.12, 32]} />
            <meshBasicMaterial 
              color={0x000000} 
              transparent 
              opacity={0.8}
              depthWrite={false}
            />
          </mesh>
          
          {/* Left Pupil */}
          <mesh ref={leftPupilRef} position={[-0.4, 0.4, 0.01]}>
            <circleGeometry args={[0.06, 32]} />
            <meshBasicMaterial 
              color="#66ddff" 
              transparent 
              opacity={0.9}
              depthWrite={false}
            />
          </mesh>
          
          {/* Right Pupil */}
          <mesh ref={rightPupilRef} position={[0.4, 0.4, 0.01]}>
            <circleGeometry args={[0.06, 32]} />
            <meshBasicMaterial 
              color="#66ddff" 
              transparent 
              opacity={0.9}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}
    </group>
  )
}
