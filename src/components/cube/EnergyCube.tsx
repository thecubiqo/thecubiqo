'use client'

/**
 * EnergyCube - Advanced shader-based 3D Energy Cube
 * 
 * Color Philosophy:
 * - RED: Deep desire, urgency, whisper-like → Floating, NO shadow
 * - GREEN_BLUE: Focus, ambition, driven, sincere → Floating WITH teal shadow
 * - YELLOW: Friendly, warmth, sarcasm, candid → Grounded (sitting), NO shadow
 * - ORANGE: Fourth Way - balanced, awareness → Floating, subtle orange glow
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { ColorName } from '@/config/colors'

// Animation state type (matching existing)
export type AnimationState = 'idle' | 'listening' | 'thinking' | 'speaking'

interface EnergyCubeProps {
  colorName?: ColorName
  animationState?: AnimationState
  reducedMotion?: boolean
}

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  
  uniform float uTime;
  uniform float uModeIntensity;
  uniform float uProcessing;
  
  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    
    float breathe = sin(uTime * 0.5) * 0.012 * uModeIntensity;
    float processingPulse = sin(uTime * 2.5) * 0.008 * uProcessing;
    vec3 displacedPosition = position * (1.0 + breathe + processingPulse);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
  }
`

const fragmentShader = `
  precision highp float;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  
  uniform float uTime;
  uniform float uModeIntensity;
  uniform float uModeTransition;
  uniform float uProcessing;
  uniform vec3 uPrimaryColor;
  uniform vec3 uSecondaryColor;
  uniform vec3 uAccentColor;
  uniform float uColorIntensity;
  
  // Simplex 3D Noise
  vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
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
    
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  float fbm(vec3 p, float timeScale) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 5; i++) {
      value += amplitude * snoise(p * frequency + uTime * timeScale);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    
    return value;
  }
  
  void main() {
    vec3 viewDir = normalize(vViewPosition);
    vec3 normal = normalize(vNormal);
    
    float baseTimeScale = mix(0.06, 0.3, uModeTransition);
    float processingSpeed = uProcessing * 0.4;
    baseTimeScale += processingSpeed;
    
    vec3 noisePos = vPosition * 2.5;
    
    float ribbon1 = fbm(noisePos + uTime * baseTimeScale * 0.4, baseTimeScale);
    float ribbon2 = fbm(noisePos * 1.3 + vec3(uTime * 0.05, 0.0, 0.0), baseTimeScale * 0.7);
    float ribbon3 = fbm(noisePos * 0.7 + vec3(0.0, uTime * 0.06, uTime * 0.03), baseTimeScale * 0.5);
    
    float processingNoise = fbm(noisePos * 2.0 + uTime * 0.8, 0.5) * uProcessing * 0.3;
    
    float energyPattern = ribbon1 * 0.45 + ribbon2 * 0.35 + ribbon3 * 0.2 + processingNoise;
    energyPattern = smoothstep(-0.2, 0.8, energyPattern);
    
    float pulseSpeed = mix(0.4, 1.5, uModeTransition) + uProcessing * 1.5;
    float pulse = sin(uTime * pulseSpeed) * 0.5 + 0.5;
    float pulseIntensity = mix(0.08, 0.25, uModeTransition) + uProcessing * 0.15;
    energyPattern += pulse * pulseIntensity;
    
    float colorMix = energyPattern * 0.6 + 0.2;
    vec3 energyColor = mix(uPrimaryColor, uSecondaryColor, colorMix);
    
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
    float accentMix = fresnel * 0.5 + energyPattern * 0.2;
    
    float centerDist = length(vPosition.xz);
    float spine = smoothstep(0.4, 0.0, centerDist) * (0.5 + 0.5 * sin(vPosition.y * 4.0 + uTime * 0.5));
    accentMix += spine * 0.2;
    
    vec3 finalColor = mix(energyColor, uAccentColor, accentMix * 0.4);
    finalColor *= uColorIntensity;
    
    float glowIntensity = energyPattern * mix(0.4, 0.8, uModeTransition);
    finalColor *= (1.0 + glowIntensity * 0.5);
    
    float glassEffect = fresnel * 0.4 + 0.1;
    finalColor += vec3(1.0, 0.98, 0.95) * glassEffect * 0.12;
    
    float internalGlow = smoothstep(0.8, 0.0, length(vPosition)) * 0.3;
    finalColor += energyColor * internalGlow;
    
    float flicker = 1.0 + sin(uTime * 15.0) * 0.03 * uProcessing;
    finalColor *= flicker;
    
    float alpha = 0.35 + energyPattern * 0.35 + fresnel * 0.25;
    alpha = clamp(alpha, 0.25, 0.85);
    
    finalColor *= mix(0.7, 1.2, uModeTransition);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`

// Color configurations matching your philosophy
const COLOR_CONFIGS: Record<ColorName, {
  primary: THREE.Color
  secondary: THREE.Color
  accent: THREE.Color
  shadowColor: THREE.Color | null
  floats: boolean
  floatHeight: number
  isLanding?: boolean
}> = {
  RED: {
    // INTIMATE - Deep, intense, date/romantic context
    primary: new THREE.Color(0.76, 0.09, 0.36),      // Deep magenta-red
    secondary: new THREE.Color(0.55, 0.04, 0.24),   // Dark crimson
    accent: new THREE.Color(1.0, 0.3, 0.4),          // Bright red
    shadowColor: null,                               // NO shadow - floating
    floats: true,
    floatHeight: 0.3,
  },
  GREEN_BLUE: {
    // OFFICE - Sincere, professional, focused
    primary: new THREE.Color(0.0, 0.54, 0.48),       // Teal
    secondary: new THREE.Color(0.0, 0.35, 0.43),    // Deep teal
    accent: new THREE.Color(0.2, 0.9, 0.75),         // Bright cyan
    shadowColor: new THREE.Color(0.0, 0.6, 0.55),   // Teal shadow
    floats: true,
    floatHeight: 0.25,
  },
  YELLOW: {
    // CAFE/FRIENDS - Candid, warm, relaxed
    primary: new THREE.Color(1.0, 0.63, 0.0),        // Warm amber
    secondary: new THREE.Color(1.0, 0.45, 0.0),     // Orange
    accent: new THREE.Color(1.0, 0.85, 0.3),        // Bright yellow
    shadowColor: null,                               // NO shadow - grounded
    floats: false,                                   // Sitting down, relaxed
    floatHeight: -0.15,
  },
  ORANGE: {
    // LANDING/MYTHICAL - Stateless, ethereal, transitional (no voice modes)
    primary: new THREE.Color(1.0, 0.5, 0.1),         // Ethereal orange
    secondary: new THREE.Color(0.9, 0.4, 0.05),     // Deep amber
    accent: new THREE.Color(1.0, 0.7, 0.3),         // Golden glow
    shadowColor: new THREE.Color(1.0, 0.5, 0.15),  // Warm ethereal glow
    floats: true,
    floatHeight: 0.15,                              // Gentle float
    isLanding: true,                                 // Special flag
  },
}

// Mode configurations
const MODE_CONFIGS: Record<AnimationState, {
  intensity: number
  colorIntensity: number
  rotationSpeed: number
  processing: number
}> = {
  idle: {
    intensity: 0.0,
    colorIntensity: 0.7,
    rotationSpeed: 0.02,
    processing: 0.0
  },
  listening: {
    intensity: 0.4,
    colorIntensity: 0.85,
    rotationSpeed: 0.04,
    processing: 0.0
  },
  thinking: {
    intensity: 0.5,
    colorIntensity: 0.9,
    rotationSpeed: 0.03,
    processing: 1.0
  },
  speaking: {
    intensity: 1.0,
    colorIntensity: 1.2,
    rotationSpeed: 0.08,
    processing: 0.0
  },
}

export function EnergyCube({ 
  colorName = 'ORANGE', 
  animationState = 'idle',
  reducedMotion = false 
}: EnergyCubeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const transitionRef = useRef({ mode: 0, color: 0 })
  const shuffleRef = useRef({ 
    active: false, 
    progress: 0, 
    axis: 'y' as 'x' | 'y' | 'z',
    fromColor: COLOR_CONFIGS.ORANGE,
    toColor: COLOR_CONFIGS.ORANGE
  })
  const prevColorRef = useRef<ColorName>(colorName)
  
  const colorConfig = COLOR_CONFIGS[colorName] || COLOR_CONFIGS.ORANGE
  const modeConfig = MODE_CONFIGS[animationState] || MODE_CONFIGS.idle
  
  // Shared uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uModeIntensity: { value: 0 },
    uModeTransition: { value: 0 },
    uProcessing: { value: 0 },
    uPrimaryColor: { value: colorConfig.primary.clone() },
    uSecondaryColor: { value: colorConfig.secondary.clone() },
    uAccentColor: { value: colorConfig.accent.clone() },
    uColorIntensity: { value: 0.7 },
  }), [])
  
  // Trigger shuffle on color change
  useEffect(() => {
    if (prevColorRef.current !== colorName) {
      const fromConfig = COLOR_CONFIGS[prevColorRef.current] || COLOR_CONFIGS.ORANGE
      shuffleRef.current = {
        active: true,
        progress: 0,
        axis: (['x', 'y', 'z'] as const)[Math.floor(Math.random() * 3)],
        fromColor: fromConfig,
        toColor: colorConfig
      }
      prevColorRef.current = colorName
    }
  }, [colorName, colorConfig])
  
  // Animation loop
  useFrame((state, delta) => {
    if (!groupRef.current) return
    
    const elapsedTime = state.clock.getElapsedTime()
    const motionMultiplier = reducedMotion ? 0.2 : 1.0
    
    // Smooth mode transition
    const transitionSpeed = reducedMotion ? 0.5 : 2.5
    transitionRef.current.mode = THREE.MathUtils.lerp(
      transitionRef.current.mode,
      modeConfig.intensity,
      delta * transitionSpeed
    )
    
    // Handle Rubik's cube shuffle transition
    if (shuffleRef.current.active) {
      shuffleRef.current.progress += delta * 3.0
      
      if (shuffleRef.current.progress >= 1.0) {
        shuffleRef.current.active = false
        shuffleRef.current.progress = 1.0
      }
      
      // No rotation during shuffle - just color transition
      const t = shuffleRef.current.progress
      const fromConfig = shuffleRef.current.fromColor
      const toConfig = shuffleRef.current.toColor
      
      uniforms.uPrimaryColor.value.lerpColors(fromConfig.primary, toConfig.primary, t)
      uniforms.uSecondaryColor.value.lerpColors(fromConfig.secondary, toConfig.secondary, t)
      uniforms.uAccentColor.value.lerpColors(fromConfig.accent, toConfig.accent, t)
    } else {
      // No rotation - cube stays static
      uniforms.uPrimaryColor.value.lerp(colorConfig.primary, delta * 3)
      uniforms.uSecondaryColor.value.lerp(colorConfig.secondary, delta * 3)
      uniforms.uAccentColor.value.lerp(colorConfig.accent, delta * 3)
    }
    
    // Update uniforms
    uniforms.uTime.value = elapsedTime
    uniforms.uModeIntensity.value = transitionRef.current.mode
    uniforms.uModeTransition.value = transitionRef.current.mode
    uniforms.uProcessing.value = THREE.MathUtils.lerp(
      uniforms.uProcessing.value,
      modeConfig.processing,
      delta * 3
    )
    uniforms.uColorIntensity.value = THREE.MathUtils.lerp(
      uniforms.uColorIntensity.value,
      modeConfig.colorIntensity,
      delta * 2
    )
    
    // Float animation based on color config
    const targetY = colorConfig.floats 
      ? colorConfig.floatHeight + Math.sin(elapsedTime * 0.5) * 0.03 * motionMultiplier
      : colorConfig.floatHeight // Grounded position for yellow
    
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY,
      delta * 2
    )
    
    // Breathing scale
    const breathe = 1 + Math.sin(elapsedTime * 0.4) * 0.012 * transitionRef.current.mode * motionMultiplier
    const processingScale = 1 + Math.sin(elapsedTime * 2.5) * 0.008 * modeConfig.processing
    groupRef.current.scale.setScalar(breathe * processingScale)
  })
  
  const showShadow = colorConfig.shadowColor !== null
  const shadowColor = colorConfig.shadowColor || new THREE.Color(0.5, 0.5, 0.5)
  
  return (
    <group ref={groupRef}>
      {/* Main rounded cube */}
      <RoundedBox args={[1.8, 1.8, 1.8]} radius={0.15} smoothness={4}>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </RoundedBox>
      
      {/* Inner glow layer */}
      <RoundedBox args={[1.5, 1.5, 1.5]} radius={0.12} smoothness={4}>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </RoundedBox>
      
      {/* Core glow */}
      <RoundedBox args={[1.0, 1.0, 1.0]} radius={0.1} smoothness={4}>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
          side={THREE.FrontSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </RoundedBox>
      
      {/* Floor shadow - only for GREEN_BLUE and ORANGE */}
      {showShadow && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
          <circleGeometry args={[2.0, 64]} />
          <meshBasicMaterial
            color={shadowColor}
            transparent={true}
            opacity={0.18}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  )
}

export default EnergyCube
