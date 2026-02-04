'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'

/**
 * IsometricCube - Ethereal Plasma Cuboid (Landing State)
 * 
 * Features:
 * - Beautiful purple/blue/pink/cyan plasma effect
 * - STATIC when idle - plasma frozen/subtle
 * - FLOWS when speaking - plasma animates beautifully
 * - Orange energy fluid ball at center
 * - Glass-like transparency with hint of orange tint
 */

interface IsometricCubeProps {
  transitionProgress?: number
  targetColor?: THREE.Color
  reducedMotion?: boolean
  animationState?: 'idle' | 'listening' | 'thinking' | 'speaking'
}

const vertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  
  uniform float uTime;
  uniform float uSpeakingIntensity;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    
    // Only breathe when speaking
    float breathe = sin(uTime * 0.5) * 0.012 * uSpeakingIntensity;
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
  uniform float uSpeakingIntensity;
  
  // Simplex noise for plasma effect
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
    
    // Time moves ONLY when speaking - otherwise frozen
    float animatedTime = uTime * uSpeakingIntensity * 0.15;
    // Small ambient movement even when static
    float ambientTime = uTime * 0.02;
    float effectiveTime = animatedTime + ambientTime;
    
    vec3 pos = vPosition * 2.5;
    
    // Multiple flowing plasma layers - speed based on speaking
    float flow1 = fbm(pos + vec3(effectiveTime * 0.5, effectiveTime * 0.3, effectiveTime * 0.2));
    float flow2 = fbm(pos * 1.2 + vec3(-effectiveTime * 0.4, effectiveTime * 0.6, 0.0));
    float flow3 = fbm(pos * 0.8 - vec3(0.0, effectiveTime * 0.5, effectiveTime * 0.4));
    float flow4 = fbm(pos * 1.5 + vec3(effectiveTime * 0.3, -effectiveTime * 0.2, effectiveTime * 0.4));
    
    // Combined energy pattern
    float energy = flow1 * 0.3 + flow2 * 0.25 + flow3 * 0.25 + flow4 * 0.2;
    energy = smoothstep(-0.4, 0.7, energy);
    
    // Beautiful ethereal colors - purple/blue/pink/cyan
    vec3 deepPurple = vec3(0.35, 0.1, 0.85);
    vec3 electricBlue = vec3(0.2, 0.5, 1.0);
    vec3 hotPink = vec3(1.0, 0.3, 0.65);
    vec3 cyan = vec3(0.3, 0.85, 1.0);
    vec3 magenta = vec3(0.85, 0.2, 0.75);
    vec3 white = vec3(1.0, 0.98, 0.95);
    
    // Hint of orange tint
    vec3 orangeTint = vec3(1.0, 0.5, 0.2);
    
    // Build purple plasma base
    vec3 plasmaColor = mix(deepPurple, electricBlue, smoothstep(-0.3, 0.5, flow1));
    plasmaColor = mix(plasmaColor, hotPink, smoothstep(-0.2, 0.6, flow2) * 0.6);
    plasmaColor = mix(plasmaColor, cyan, smoothstep(0.0, 0.7, flow3) * 0.4);
    plasmaColor = mix(plasmaColor, magenta, smoothstep(-0.1, 0.5, flow4) * 0.35);
    
    // Add subtle orange tint overall
    plasmaColor = mix(plasmaColor, orangeTint, 0.08);
    
    // Bright energy veins
    float veins = pow(energy, 2.0);
    plasmaColor = mix(plasmaColor, white, veins * 0.3);
    
    // Center distance for core effect
    float centerDist = length(vPosition);
    float coreGlow = smoothstep(0.9, 0.0, centerDist);
    
    // Sparkle effect - more when speaking
    float sparkleSpeed = 4.0 + uSpeakingIntensity * 4.0;
    float sparkle = snoise(pos * 12.0 + vec3(uTime * sparkleSpeed));
    float sparkleIntensity = smoothstep(0.78, 0.95, sparkle) * (0.3 + uSpeakingIntensity * 0.5);
    plasmaColor += white * sparkleIntensity;
    
    // Pulsing when speaking
    float pulse = sin(uTime * 2.0) * 0.5 + 0.5;
    float pulseEffect = 0.85 + (pulse * 0.15 * uSpeakingIntensity);
    plasmaColor *= pulseEffect;
    
    // Fresnel rim glow - purple/pink
    float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 2.5);
    vec3 rimColor = mix(cyan, hotPink, sin(uTime * 0.3) * 0.5 + 0.5);
    plasmaColor += rimColor * fresnel * 0.45;
    
    // Mix with target color during transition
    vec3 finalColor = mix(plasmaColor, uTargetColor, uTransitionProgress);
    
    // Alpha - semi-transparent
    float alpha = 0.5 + energy * 0.3 + coreGlow * 0.15;
    alpha = clamp(alpha, 0.35, 0.85);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// Glass shell shader with orange tint
const glassFragmentShader = `
  precision highp float;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  
  uniform float uTime;
  uniform float uSpeakingIntensity;
  
  void main() {
    vec3 viewDir = normalize(vViewPosition);
    vec3 normal = normalize(vNormal);
    float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 3.5);
    
    // Iridescent edge with hint of orange
    vec3 purpleEdge = vec3(0.6, 0.3, 1.0);
    vec3 cyanEdge = vec3(0.3, 0.7, 1.0);
    vec3 orangeHint = vec3(1.0, 0.6, 0.3);
    
    vec3 edgeColor = mix(purpleEdge, cyanEdge, sin(uTime * 0.4 + vPosition.y * 2.0) * 0.5 + 0.5);
    edgeColor = mix(edgeColor, orangeHint, 0.15); // Subtle orange tint
    
    vec3 color = edgeColor * fresnel * 0.35;
    float alpha = fresnel * 0.18;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export function IsometricCube({ 
  transitionProgress = 0, 
  targetColor = new THREE.Color(1.0, 0.5, 0.15),
  reducedMotion = false,
  animationState = 'idle'
}: IsometricCubeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const baseRotationRef = useRef({ y: 0, x: 0, z: 0 })
  
  // Track speaking intensity for smooth transitions
  const speakingIntensityRef = useRef(0)
  
  const plasmaUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uTransitionProgress: { value: transitionProgress },
    uTargetColor: { value: targetColor },
    uSpeakingIntensity: { value: 0 },
  }), [])
  
  const glassUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSpeakingIntensity: { value: 0 },
  }), [])
  
  useFrame((state) => {
    const time = reducedMotion ? state.clock.getElapsedTime() * 0.3 : state.clock.getElapsedTime()
    const isActive = animationState === 'listening' || animationState === 'speaking'
    const isSpeaking = animationState === 'speaking'
    
    // Smooth speaking intensity transition
    const targetIntensity = isSpeaking ? 1.0 : (animationState === 'listening' ? 0.3 : 0.0)
    speakingIntensityRef.current += (targetIntensity - speakingIntensityRef.current) * 0.08
    
    plasmaUniforms.uTime.value = time
    plasmaUniforms.uTransitionProgress.value = transitionProgress
    plasmaUniforms.uTargetColor.value = targetColor
    plasmaUniforms.uSpeakingIntensity.value = speakingIntensityRef.current
    glassUniforms.uTime.value = time
    glassUniforms.uSpeakingIntensity.value = speakingIntensityRef.current
    
    if (groupRef.current) {
      if (isActive) {
        // STOP rotation when active - just subtle breathing
        const breathe = Math.sin(time * 2.0) * 0.015 * speakingIntensityRef.current
        groupRef.current.scale.setScalar(1 + breathe)
        // Hold current rotation
        groupRef.current.rotation.y = baseRotationRef.current.y
        groupRef.current.rotation.x = baseRotationRef.current.x
        groupRef.current.rotation.z = baseRotationRef.current.z
        groupRef.current.position.y = 0
      } else {
        // Idle: very gentle, slow rotation (AI presence)
        const idleSpeed = 0.05 // Very slow when idle
        baseRotationRef.current.y = time * idleSpeed
        baseRotationRef.current.x = Math.sin(time * 0.03) * 0.05
        baseRotationRef.current.z = Math.sin(time * 0.04) * 0.03
        
        groupRef.current.rotation.y = baseRotationRef.current.y
        groupRef.current.rotation.x = baseRotationRef.current.x
        groupRef.current.rotation.z = baseRotationRef.current.z
        groupRef.current.position.y = Math.sin(time * 0.2) * 0.02 // Very subtle float
        groupRef.current.scale.setScalar(1)
      }
    }
    
    // Orange energy core - pulses when speaking
    if (coreRef.current) {
      const material = coreRef.current.material as THREE.MeshBasicMaterial
      if (isSpeaking) {
        // Energetic pulse when speaking
        const speakPulse = Math.sin(time * 6) * 0.4 + 0.6
        material.opacity = 0.6 + speakPulse * 0.4
        const coreScale = 0.3 + speakPulse * 0.2
        coreRef.current.scale.setScalar(coreScale)
      } else {
        // Calm glow when idle
        const idlePulse = Math.sin(time * 0.8) * 0.1 + 0.5
        material.opacity = idlePulse
        coreRef.current.scale.setScalar(0.3)
      }
    }
  })
  
  return (
    <group ref={groupRef}>
      {/* Inner plasma layer */}
      <RoundedBox args={[1.8, 1.8, 1.8]} radius={0.2} smoothness={8}>
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
      
      {/* Orange energy fluid ball at center */}
      <mesh ref={coreRef} scale={0.3}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          color="#ff6622" 
          transparent 
          opacity={0.5}
        />
      </mesh>
      
      {/* Inner orange glow ring */}
      <mesh scale={0.35}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial 
          color="#ff8844" 
          transparent 
          opacity={0.2}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Outer glass shell with orange tint */}
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
