'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

export type EnergyCubeColor = 'orange' | 'red' | 'green' | 'yellow'
export type EnergyCubeMode = 'listening' | 'speaking' | 'processing'

/**
 * Minimal port of the Emergent EnergyCube.
 *
 * Notes:
 * - We support an explicit `orange` color so Cubiqo's default ORANGE doesn't
 *   silently map to green.
 * - We keep the shaders as-is (with added orange config).
 */

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
`;

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
`;

const COLOR_CONFIGS: Record<EnergyCubeColor, {
  primary: THREE.Color
  secondary: THREE.Color
  accent: THREE.Color
  shadowColor: THREE.Color | null
  floats: boolean
  floatHeight: number
}> = {
  orange: {
    primary: new THREE.Color(1.0, 0.55, 0.15),
    secondary: new THREE.Color(0.9, 0.25, 0.1),
    accent: new THREE.Color(1.0, 0.85, 0.35),
    shadowColor: new THREE.Color(1.0, 0.55, 0.15),
    floats: true,
    floatHeight: 0.22
  },
  red: {
    primary: new THREE.Color(0.9, 0.15, 0.2),
    secondary: new THREE.Color(0.6, 0.08, 0.15),
    accent: new THREE.Color(1.0, 0.3, 0.25),
    shadowColor: null,
    floats: true,
    floatHeight: 0.3
  },
  green: {
    primary: new THREE.Color(0.1, 0.85, 0.5),
    secondary: new THREE.Color(0.05, 0.6, 0.7),
    accent: new THREE.Color(0.2, 0.95, 0.8),
    shadowColor: new THREE.Color(0.1, 0.7, 0.6),
    floats: true,
    floatHeight: 0.25
  },
  yellow: {
    primary: new THREE.Color(1.0, 0.85, 0.2),
    secondary: new THREE.Color(1.0, 0.6, 0.15),
    accent: new THREE.Color(1.0, 0.95, 0.5),
    shadowColor: null,
    floats: false,
    floatHeight: -0.15
  }
}

const MODE_CONFIGS: Record<EnergyCubeMode, {
  intensity: number
  colorIntensity: number
  rotationSpeed: number
  processing: number
}> = {
  listening: { intensity: 0.0, colorIntensity: 0.7, rotationSpeed: 0.02, processing: 0.0 },
  speaking: { intensity: 1.0, colorIntensity: 1.2, rotationSpeed: 0.08, processing: 0.0 },
  processing: { intensity: 0.5, colorIntensity: 0.9, rotationSpeed: 0.04, processing: 1.0 }
}

export function EnergyCube({
  color = 'orange',
  mode = 'listening',
  reducedMotion = false
}: {
  color?: EnergyCubeColor
  mode?: EnergyCubeMode
  reducedMotion?: boolean
}) {
  const groupRef = useRef<THREE.Group | null>(null)

  // Used for mode transitions
  const transitionRef = useRef({ mode: 0 })

  // Used for one-time shuffle effect on color change
  const shuffleRef = useRef({ active: false, progress: 0, axis: 'y' as 'x' | 'y' | 'z' })

  const [prevColor, setPrevColor] = useState<EnergyCubeColor>(color)

  const colorConfig = COLOR_CONFIGS[color] ?? COLOR_CONFIGS.orange
  const modeConfig = MODE_CONFIGS[mode] ?? MODE_CONFIGS.listening

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uModeIntensity: { value: 0 },
      uModeTransition: { value: 0 },
      uProcessing: { value: 0 },
      uPrimaryColor: { value: colorConfig.primary.clone() },
      uSecondaryColor: { value: colorConfig.secondary.clone() },
      uAccentColor: { value: colorConfig.accent.clone() },
      uColorIntensity: { value: 0.7 }
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // Trigger shuffle animation on color change
  useEffect(() => {
    if (prevColor !== color) {
      const axes: Array<'x' | 'y' | 'z'> = ['x', 'y', 'z']
      shuffleRef.current = {
        active: true,
        progress: 0,
        axis: axes[Math.floor(Math.random() * 3)]
      }
      setPrevColor(color)
    }
  }, [color, prevColor])

  // Update uniforms when color changes
  useEffect(() => {
    uniforms.uPrimaryColor.value.copy(colorConfig.primary)
    uniforms.uSecondaryColor.value.copy(colorConfig.secondary)
    uniforms.uAccentColor.value.copy(colorConfig.accent)
  }, [colorConfig, uniforms])

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

    // Shuffle effect (Rubik-like)
    if (shuffleRef.current.active) {
      shuffleRef.current.progress += delta * 3.0
      if (shuffleRef.current.progress >= 1.0) {
        shuffleRef.current.active = false
        shuffleRef.current.progress = 1.0
      }

      const t = shuffleRef.current.progress
      const angle = Math.sin(t * Math.PI) * Math.PI * 0.5
      const axis = shuffleRef.current.axis
      if (axis === 'x') groupRef.current.rotation.x = angle
      if (axis === 'y') groupRef.current.rotation.y = angle
      if (axis === 'z') groupRef.current.rotation.z = angle

      uniforms.uModeTransition.value = 0.3 + t * 0.7
    } else {
      // Return to base rotation behavior
      uniforms.uModeTransition.value = THREE.MathUtils.lerp(
        uniforms.uModeTransition.value,
        modeConfig.intensity,
        delta * 2.0
      )
    }

    // Floating vs grounded
    if (colorConfig.floats) {
      const floatSpeed = 0.6
      groupRef.current.position.y =
        colorConfig.floatHeight +
        Math.sin(elapsedTime * floatSpeed) * 0.05 * motionMultiplier
    } else {
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        colorConfig.floatHeight,
        delta * 2.0
      )
    }

    // Gentle base rotation
    groupRef.current.rotation.y += modeConfig.rotationSpeed * delta * motionMultiplier

    // Update uniforms
    uniforms.uTime.value = elapsedTime
    uniforms.uModeIntensity.value = transitionRef.current.mode
    uniforms.uProcessing.value = modeConfig.processing
    uniforms.uColorIntensity.value = THREE.MathUtils.lerp(
      uniforms.uColorIntensity.value,
      modeConfig.colorIntensity,
      delta * 2.0
    )
  })

  return (
    <group ref={groupRef}>
      <RoundedBox args={[1.6, 1.6, 1.6]} radius={0.18} smoothness={6}>
        <shaderMaterial
          transparent
          depthWrite={false}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          blending={THREE.AdditiveBlending}
        />
      </RoundedBox>

      {/* Subtle orange "border" placeholder effect via wireframe edges (cheap + readable) */}
      <RoundedBox args={[1.62, 1.62, 1.62]} radius={0.18} smoothness={6}>
        <meshBasicMaterial
          color={color === 'orange' ? '#ff7a2f' : '#ffffff'}
          wireframe
          transparent
          opacity={0.12}
        />
      </RoundedBox>
    </group>
  )
}
