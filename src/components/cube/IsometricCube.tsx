'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'

/**
 * IsometricCube - Purple Plasma Cuboid with Orange Energy Lines
 * 
 * Features:
 * - Proper cuboid shape (not spherical)
 * - Purple/blue/pink ethereal plasma
 * - Orange energy lines flowing through
 * - Glass-like transparency
 * - Sparkle particles
 */

interface IsometricCubeProps {
  transitionProgress?: number
  targetColor?: THREE.Color
  reducedMotion?: boolean
}

const vertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  
  uniform float uTime;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    
    // Subtle breathing
    float breathe = sin(uTime * 0.4) * 0.015;
    vec3 displaced = position * (1.0 + breathe);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  
  uniform float uTime;
  uniform float uTransitionProgress;
  uniform vec3 uTargetColor;
  
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
    for (int i = 0; i < 5; i++) {
      value += amplitude * snoise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
  
  void main() {
    vec3 viewDir = normalize(vViewPosition);
    vec3 normal = normalize(vNormal);
    float time = uTime * 0.15;
    vec3 pos = vPosition * 2.5;
    
    // Multiple flowing plasma layers
    float flow1 = fbm(pos + vec3(time * 0.5, time * 0.3, time * 0.2));
    float flow2 = fbm(pos * 1.2 + vec3(-time * 0.4, time * 0.6, 0.0));
    float flow3 = fbm(pos * 0.8 - vec3(0.0, time * 0.5, time * 0.4));
    float flow4 = fbm(pos * 1.5 + vec3(time * 0.3, -time * 0.2, time * 0.4));
    
    // Combined energy pattern
    float energy = flow1 * 0.3 + flow2 * 0.25 + flow3 * 0.25 + flow4 * 0.2;
    energy = smoothstep(-0.4, 0.7, energy);
    
    // Purple/blue/pink plasma colors
    vec3 deepPurple = vec3(0.35, 0.1, 0.85);
    vec3 electricBlue = vec3(0.2, 0.45, 1.0);
    vec3 hotPink = vec3(1.0, 0.3, 0.65);
    vec3 cyan = vec3(0.3, 0.85, 1.0);
    vec3 magenta = vec3(0.85, 0.2, 0.75);
    
    // Orange energy line colors
    vec3 deepOrange = vec3(1.0, 0.4, 0.1);
    vec3 brightOrange = vec3(1.0, 0.6, 0.2);
    vec3 warmYellow = vec3(1.0, 0.85, 0.4);
    
    vec3 white = vec3(1.0, 0.98, 0.95);
    
    // Build purple plasma base
    vec3 plasmaColor = mix(deepPurple, electricBlue, smoothstep(-0.3, 0.5, flow1));
    plasmaColor = mix(plasmaColor, hotPink, smoothstep(-0.2, 0.6, flow2) * 0.6);
    plasmaColor = mix(plasmaColor, cyan, smoothstep(0.0, 0.7, flow3) * 0.4);
    plasmaColor = mix(plasmaColor, magenta, smoothstep(-0.1, 0.5, flow4) * 0.35);
    
    // Orange energy lines - flowing through the cube
    float orangeFlow1 = snoise(pos * 3.0 + vec3(time * 2.0, 0.0, 0.0));
    float orangeFlow2 = snoise(pos * 2.5 + vec3(0.0, time * 1.8, time));
    float orangeFlow3 = snoise(pos * 2.0 - vec3(time * 1.5, time, 0.0));
    
    // Create energy line effect
    float orangeLines = smoothstep(0.5, 0.85, orangeFlow1) * 0.5;
    orangeLines += smoothstep(0.55, 0.9, orangeFlow2) * 0.3;
    orangeLines += smoothstep(0.6, 0.92, orangeFlow3) * 0.2;
    
    // Mix orange energy into plasma
    vec3 orangeEnergy = mix(deepOrange, brightOrange, orangeFlow1 * 0.5 + 0.5);
    orangeEnergy = mix(orangeEnergy, warmYellow, pow(orangeLines, 2.0) * 0.5);
    
    // Combine plasma and orange energy
    vec3 color = mix(plasmaColor, orangeEnergy, orangeLines * 0.7);
    
    // Bright energy cores
    float veins = pow(energy, 2.0);
    color = mix(color, white, veins * 0.3);
    
    // Center glow
    float centerDist = length(vPosition);
    float coreGlow = smoothstep(0.9, 0.0, centerDist);
    color = mix(color, mix(deepOrange, hotPink, 0.5), coreGlow * 0.3);
    
    // Sparkle effect
    float sparkle = snoise(pos * 12.0 + vec3(time * 4.0));
    float sparkleIntensity = smoothstep(0.78, 0.95, sparkle);
    color += white * sparkleIntensity * 0.5;
    
    // Pulsing intensity
    float pulse = sin(uTime * 0.5) * 0.5 + 0.5;
    color *= 0.85 + pulse * 0.15;
    
    // Fresnel rim glow
    float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 2.5);
    vec3 rimColor = mix(cyan, hotPink, sin(uTime * 0.3) * 0.5 + 0.5);
    color += rimColor * fresnel * 0.45;
    
    // Mix with target color during transition
    vec3 finalColor = mix(color, uTargetColor, uTransitionProgress);
    
    // Alpha - semi-transparent with brighter core
    float alpha = 0.5 + energy * 0.3 + coreGlow * 0.2 + orangeLines * 0.15;
    alpha = clamp(alpha, 0.35, 0.9);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// Glass shell shader
const glassFragmentShader = `
  precision highp float;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  
  uniform float uTime;
  
  void main() {
    vec3 viewDir = normalize(vViewPosition);
    vec3 normal = normalize(vNormal);
    float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 3.5);
    
    // Iridescent edge glow
    vec3 edgeColor = mix(
      vec3(0.6, 0.3, 1.0),
      vec3(0.3, 0.7, 1.0),
      sin(uTime * 0.4 + vPosition.y * 2.0) * 0.5 + 0.5
    );
    
    vec3 color = edgeColor * fresnel * 0.35;
    float alpha = fresnel * 0.18;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export function IsometricCube({ 
  transitionProgress = 0, 
  targetColor = new THREE.Color(1.0, 0.5, 0.15),
  reducedMotion = false 
}: IsometricCubeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const plasmaRef = useRef<THREE.Mesh>(null)
  
  const plasmaUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uTransitionProgress: { value: transitionProgress },
    uTargetColor: { value: targetColor },
  }), [])
  
  const glassUniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), [])
  
  useFrame((state) => {
    const time = reducedMotion ? state.clock.getElapsedTime() * 0.3 : state.clock.getElapsedTime()
    
    plasmaUniforms.uTime.value = time
    plasmaUniforms.uTransitionProgress.value = transitionProgress
    plasmaUniforms.uTargetColor.value = targetColor
    glassUniforms.uTime.value = time
    
    if (groupRef.current) {
      // Gentle rotation
      groupRef.current.rotation.y = time * 0.12
      groupRef.current.rotation.x = Math.sin(time * 0.08) * 0.1
      groupRef.current.rotation.z = Math.sin(time * 0.1) * 0.05
      // Floating motion
      groupRef.current.position.y = Math.sin(time * 0.4) * 0.05
    }
  })
  
  return (
    <group ref={groupRef}>
      {/* Inner plasma layer */}
      <RoundedBox args={[1.8, 1.8, 1.8]} radius={0.2} smoothness={8} ref={plasmaRef}>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={plasmaUniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </RoundedBox>
      
      {/* Secondary depth layer */}
      <RoundedBox args={[1.5, 1.5, 1.5]} radius={0.15} smoothness={8}>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={plasmaUniforms}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </RoundedBox>
      
      {/* Core glow */}
      <mesh scale={0.25}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          color="#ff6622" 
          transparent 
          opacity={0.5}
        />
      </mesh>
      
      {/* Outer glass shell */}
      <RoundedBox args={[1.85, 1.85, 1.85]} radius={0.22} smoothness={8}>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={glassFragmentShader}
          uniforms={glassUniforms}
          transparent
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </RoundedBox>
    </group>
  )
}

export default IsometricCube
