'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * IsometricCube - Special landing state geometry
 * 
 * Enhanced with:
 * - Doppler/shimmer effect
 * - Flowing orange energy currents
 * - Internal particle-like motion
 * - Ethereal, conscious presence
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
  varying float vDistFromCenter;
  varying vec2 vUv;
  
  uniform float uTime;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    vDistFromCenter = length(position);
    
    // Subtle breathing with micro-vibration
    float breathe = sin(uTime * 0.3) * 0.01;
    float vibrate = sin(uTime * 8.0 + position.y * 5.0) * 0.002;
    vec3 displaced = position * (1.0 + breathe + vibrate);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vDistFromCenter;
  varying vec2 vUv;
  
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
  
  // Doppler/shimmer effect
  float doppler(vec3 p, float t) {
    float wave1 = sin(p.x * 4.0 + p.y * 3.0 + t * 2.0) * 0.5 + 0.5;
    float wave2 = sin(p.y * 5.0 - p.z * 2.0 + t * 1.5) * 0.5 + 0.5;
    float wave3 = sin(p.z * 3.0 + p.x * 4.0 - t * 1.8) * 0.5 + 0.5;
    return (wave1 + wave2 + wave3) / 3.0;
  }
  
  // Flowing current effect
  float flowingCurrent(vec3 p, float t) {
    vec3 flowDir = vec3(
      sin(t * 0.3 + p.y * 2.0),
      cos(t * 0.25),
      sin(t * 0.35 + p.x * 1.5)
    );
    float flow = snoise(p * 3.0 + flowDir * t * 0.5);
    return smoothstep(-0.3, 0.8, flow);
  }
  
  void main() {
    vec3 viewDir = normalize(vViewPosition);
    vec3 normal = normalize(vNormal);
    
    float slowTime = uTime * 0.2;
    vec3 noisePos = vPosition * 1.8;
    
    // Multiple layers of flowing energy
    float flow1 = fbm(noisePos + vec3(slowTime * 0.3, slowTime * 0.2, 0.0));
    float flow2 = fbm(noisePos * 1.3 + vec3(0.0, slowTime * 0.25, slowTime * 0.15));
    float flow3 = fbm(noisePos * 0.8 - vec3(slowTime * 0.1, 0.0, slowTime * 0.2));
    
    float energy = flow1 * 0.35 + flow2 * 0.35 + flow3 * 0.3;
    energy = smoothstep(-0.2, 0.6, energy);
    
    // Doppler shimmer effect
    float shimmer = doppler(vPosition, uTime);
    
    // Flowing orange currents
    float currents = flowingCurrent(vPosition, uTime);
    
    // Base colors - less white, more layered gradients
    vec3 darkCore = vec3(0.15, 0.08, 0.02);       // Dark warm center
    vec3 midOrange = vec3(0.8, 0.35, 0.1);        // Mid orange
    vec3 lifeOrange = vec3(1.0, 0.5, 0.1);        // Vibrant orange
    vec3 deepOrange = vec3(0.95, 0.35, 0.05);     // Deep orange
    vec3 warmGold = vec3(1.0, 0.7, 0.3);          // Warm gold accent
    vec3 softCream = vec3(0.95, 0.88, 0.75);      // Soft cream (not pure white)
    
    // Center to edge gradient - creates depth
    float centerGlow = smoothstep(0.9, 0.1, vDistFromCenter);
    float edgeFade = smoothstep(0.1, 0.8, vDistFromCenter);
    
    // Pulsing life force
    float pulse1 = sin(uTime * 0.5) * 0.5 + 0.5;
    float pulse2 = sin(uTime * 0.7 + 1.5) * 0.5 + 0.5;
    float combinedPulse = pulse1 * 0.6 + pulse2 * 0.4;
    
    // Spiral energy wave
    float angle = atan(vPosition.z, vPosition.x);
    float spiral = sin(angle * 3.0 + vPosition.y * 4.0 - uTime * 0.8) * 0.5 + 0.5;
    
    // Layered gradient from dark center to glowing orange edge
    vec3 baseColor = mix(darkCore, midOrange, centerGlow * 0.7 + energy * 0.3);
    baseColor = mix(baseColor, lifeOrange, currents * 0.6 + spiral * 0.3);
    baseColor = mix(baseColor, warmGold, shimmer * 0.4 * edgeFade);
    baseColor = mix(baseColor, deepOrange, combinedPulse * 0.3 * centerGlow);
    
    // Edge glow - softer, not pure white
    baseColor = mix(baseColor, softCream, edgeFade * 0.35 * (1.0 - energy));
    
    // Add shimmer highlights - reduced white
    baseColor += warmGold * shimmer * 0.12;
    
    // Mix in target color during transition
    vec3 finalColor = mix(baseColor, uTargetColor, uTransitionProgress);
    
    // Fresnel for glass effect with orange rim
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
    vec3 rimColor = mix(warmGold, lifeOrange, 0.5);
    finalColor += rimColor * fresnel * 0.35;
    
    // Internal consciousness glow - orange core, not white
    float innerGlow = smoothstep(0.95, 0.0, vDistFromCenter) * 0.8;
    finalColor += mix(deepOrange, lifeOrange, pulse1) * innerGlow * (1.0 - uTransitionProgress) * 0.6;
    
    // Subtle sparkle points (particle-like) - gold not white
    float sparkle = pow(snoise(vPosition * 15.0 + uTime * 2.0), 8.0);
    finalColor += warmGold * sparkle * 0.35;
    
    // Breathing luminosity
    float breathe = sin(uTime * 0.35) * 0.5 + 0.5;
    finalColor *= 0.85 + breathe * 0.15;
    
    // Alpha with ethereal presence
    float alpha = 0.3 + energy * 0.25 + fresnel * 0.2 + shimmer * 0.08;
    alpha = clamp(alpha, 0.25, 0.7);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// Create isometric octahedron geometry
function createIsometricGeometry() {
  const geometry = new THREE.OctahedronGeometry(1.15, 3);
  return geometry;
}

export function IsometricCube({ 
  transitionProgress = 0,
  targetColor = new THREE.Color(1.0, 0.5, 0.1),
  reducedMotion = false 
}: IsometricCubeProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  const geometry = useMemo(() => createIsometricGeometry(), []);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uTransitionProgress: { value: 0 },
    uTargetColor: { value: targetColor.clone() },
  }), []);
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const motionMult = reducedMotion ? 0.2 : 1.0;
    
    uniforms.uTime.value = time;
    uniforms.uTransitionProgress.value = THREE.MathUtils.lerp(
      uniforms.uTransitionProgress.value,
      transitionProgress,
      delta * 2
    );
    uniforms.uTargetColor.value.lerp(targetColor, delta * 3);
    
    // Slow, meditative rotation with subtle wobble
    groupRef.current.rotation.y += 0.006 * motionMult;
    groupRef.current.rotation.x = Math.sin(time * 0.12) * 0.06 * motionMult;
    groupRef.current.rotation.z = Math.cos(time * 0.1) * 0.03 * motionMult;
    
    // Gentle float with micro-movements
    groupRef.current.position.y = Math.sin(time * 0.35) * 0.025 * motionMult + 0.08;
    groupRef.current.position.x = Math.sin(time * 0.2) * 0.01 * motionMult;
  });
  
  return (
    <group ref={groupRef}>
      {/* Main outer shell */}
      <mesh geometry={geometry}>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Middle layer - energy currents - normal blending to avoid white */}
      <mesh geometry={geometry} scale={0.75}>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </mesh>
      
      {/* Inner glow layer - darker */}
      <mesh geometry={geometry} scale={0.5}>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </mesh>
      
      {/* Core consciousness - smallest, darkest */}
      <mesh geometry={geometry} scale={0.25}>
        <meshBasicMaterial 
          color={new THREE.Color(0.3, 0.15, 0.05)}
          transparent={true}
          opacity={0.6}
        />
      </mesh>
    </group>
  );
}

export default IsometricCube;
