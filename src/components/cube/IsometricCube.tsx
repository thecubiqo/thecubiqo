'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * IsometricCube - Special landing state geometry
 * 
 * Different from the rounded cube - isometric/diamond shape
 * with free-flowing energy inside with ORANGE accent (life/consciousness).
 * No shadow, ethereal, mythical.
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
  
  uniform float uTime;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    vDistFromCenter = length(position);
    
    // Subtle breathing
    float breathe = sin(uTime * 0.3) * 0.008;
    vec3 displaced = position * (1.0 + breathe);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vDistFromCenter;
  
  uniform float uTime;
  uniform float uTransitionProgress; // 0 = landing, 1 = transitioning to color
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
    for (int i = 0; i < 4; i++) {
      value += amplitude * snoise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
  
  void main() {
    vec3 viewDir = normalize(vViewPosition);
    vec3 normal = normalize(vNormal);
    
    // Free-flowing energy - slow, meditative
    float slowTime = uTime * 0.15;
    vec3 noisePos = vPosition * 1.5;
    
    // Multiple layers of flowing energy
    float flow1 = fbm(noisePos + vec3(slowTime * 0.3, slowTime * 0.2, 0.0));
    float flow2 = fbm(noisePos * 1.3 + vec3(0.0, slowTime * 0.25, slowTime * 0.15));
    float flow3 = fbm(noisePos * 0.8 - vec3(slowTime * 0.1, 0.0, slowTime * 0.2));
    
    float energy = flow1 * 0.4 + flow2 * 0.35 + flow3 * 0.25;
    energy = smoothstep(-0.3, 0.7, energy);
    
    // Base colors - warm white with ORANGE as life/consciousness accent
    vec3 pureWhite = vec3(1.0, 0.95, 0.9);
    vec3 lifeOrange = vec3(1.0, 0.45, 0.05);   // Deep vibrant orange = life, consciousness
    vec3 warmGlow = vec3(1.0, 0.65, 0.25);     // Warm orange transition
    
    // Orange flows through - pulsing life force
    float centerFlow = smoothstep(0.8, 0.1, vDistFromCenter);
    float orangePulse = sin(uTime * 0.6) * 0.5 + 0.5;
    float energyWave = sin(vPosition.y * 3.0 + uTime * 0.8) * 0.5 + 0.5;
    float orangeAmount = centerFlow * 0.7 + energy * 0.4 + orangePulse * 0.2 + energyWave * 0.15;
    
    // Mix: mostly white with visible orange energy flowing
    vec3 baseColor = mix(pureWhite, warmGlow, energy * 0.5 + 0.1);
    baseColor = mix(baseColor, lifeOrange, orangeAmount * 0.55);
    
    // Mix in target color based on transition (when user activates)
    vec3 finalColor = mix(baseColor, uTargetColor, uTransitionProgress);
    
    // Fresnel for glass effect - subtle orange rim
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);
    finalColor += mix(pureWhite, lifeOrange, 0.3) * fresnel * 0.25;
    
    // Internal glow - orange core representing consciousness
    float innerGlow = smoothstep(0.9, 0.0, vDistFromCenter) * 0.6;
    finalColor += lifeOrange * innerGlow * (1.0 - uTransitionProgress) * 0.6;
    
    // Soft pulsing - breathing of life
    float pulse = sin(uTime * 0.4) * 0.5 + 0.5;
    finalColor *= 0.85 + pulse * 0.15;
    
    // Alpha - ethereal but present
    float alpha = 0.28 + energy * 0.3 + fresnel * 0.22;
    alpha = clamp(alpha, 0.22, 0.72);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// Create isometric octahedron geometry (diamond shape)
function createIsometricGeometry() {
  const geometry = new THREE.OctahedronGeometry(1.2, 2);
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
    
    // Slow, meditative rotation
    groupRef.current.rotation.y += 0.008 * motionMult;
    groupRef.current.rotation.x = Math.sin(time * 0.1) * 0.05 * motionMult;
    
    // Gentle float
    groupRef.current.position.y = Math.sin(time * 0.3) * 0.02 * motionMult + 0.1;
  });
  
  return (
    <group ref={groupRef}>
      {/* Main isometric shape */}
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
      
      {/* Inner glow */}
      <mesh geometry={geometry} scale={0.75}>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Core */}
      <mesh geometry={geometry} scale={0.4}>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
          side={THREE.FrontSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* NO SHADOW for landing state */}
    </group>
  );
}

export default IsometricCube;
