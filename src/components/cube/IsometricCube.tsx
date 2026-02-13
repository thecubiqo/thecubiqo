'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * IsometricCube - Ethereal Aurora Plasma Cube
 * 
 * DESIGN GOALS (matching reference):
 * - Transparent/hollow center - you can see THROUGH it
 * - Wispy aurora-like energy flowing along edges and faces
 * - Glowing neon purple/blue/pink edges
 * - Sparkle particles inside
 * - Dark interior with bright glowing edges
 * - Glass-like transparency
 */

interface IsometricCubeProps {
  transitionProgress?: number
  targetColor?: THREE.Color
  reducedMotion?: boolean
  animationState?: 'idle' | 'listening' | 'thinking' | 'speaking'
}

// Edge glow shader - creates the glowing wireframe effect
const edgeVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  
  uniform float uTime;
  uniform float uSpeakingIntensity;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Main plasma shader - transparent with edge glow and aurora wisps
const plasmaFragmentShader = `
  precision highp float;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  
  uniform float uTime;
  uniform float uSpeakingIntensity;
  uniform vec3 uTargetColor;
  uniform float uTransitionProgress;
  
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
    // Time - flows when speaking, subtle ambient otherwise
    float flowTime = uTime * (0.05 + uSpeakingIntensity * 0.25);
    
    vec3 pos = vPosition;
    
    // Distance from edges - key for the hollow/transparent effect
    float edgeX = 1.0 - abs(pos.x) / 0.9;
    float edgeY = 1.0 - abs(pos.y) / 0.9;
    float edgeZ = 1.0 - abs(pos.z) / 0.9;
    
    // How close to ANY edge (0 = at edge, 1 = at center)
    float edgeDist = min(min(edgeX, edgeY), edgeZ);
    
    // HOLLOW CENTER - transparent in the middle
    float hollowness = smoothstep(0.0, 0.4, edgeDist);
    
    // Aurora wisp effect - flowing energy along surfaces
    float wisp1 = snoise(pos * 3.0 + vec3(flowTime, 0.0, flowTime * 0.7));
    float wisp2 = snoise(pos * 2.0 - vec3(0.0, flowTime * 0.8, flowTime));
    float wisp3 = snoise(pos * 4.0 + vec3(flowTime * 0.5, flowTime * 0.6, 0.0));
    
    // Combine wisps
    float wisps = wisp1 * 0.4 + wisp2 * 0.35 + wisp3 * 0.25;
    wisps = smoothstep(-0.3, 0.6, wisps);
    
    // Colors - neon purple/blue/pink/cyan
    vec3 neonPurple = vec3(0.6, 0.2, 1.0);
    vec3 neonBlue = vec3(0.3, 0.5, 1.0);
    vec3 neonPink = vec3(1.0, 0.3, 0.8);
    vec3 neonCyan = vec3(0.2, 0.9, 1.0);
    vec3 warmOrange = vec3(1.0, 0.5, 0.2);
    vec3 white = vec3(1.0);
    
    // Mix colors based on position and wisps
    vec3 color = mix(neonPurple, neonBlue, wisp1 * 0.5 + 0.5);
    color = mix(color, neonPink, wisp2 * 0.4 + 0.3);
    color = mix(color, neonCyan, wisp3 * 0.3 + 0.2);
    
    // Add orange hints
    color = mix(color, warmOrange, smoothstep(0.5, 0.8, wisps) * 0.25);
    
    // Bright spots where wisps concentrate
    float brightness = pow(wisps, 1.5);
    color = mix(color, white, brightness * 0.4);
    
    // Edge glow - brighter at edges
    float edgeGlow = 1.0 - edgeDist;
    edgeGlow = pow(edgeGlow, 2.0);
    color *= (1.0 + edgeGlow * 1.5);
    
    // Sparkles
    float sparkle = snoise(pos * 15.0 + vec3(uTime * 3.0));
    float sparkleIntensity = smoothstep(0.8, 0.95, sparkle);
    color += white * sparkleIntensity * 0.8;
    
    // Pulsing when speaking
    float pulse = sin(uTime * 3.0) * 0.5 + 0.5;
    float pulseEffect = 1.0 + pulse * 0.3 * uSpeakingIntensity;
    color *= pulseEffect;
    
    // ALPHA - transparent in center, visible at edges and wisps
    float alpha = (1.0 - hollowness * 0.85) * (0.3 + wisps * 0.5 + edgeGlow * 0.4);
    alpha = clamp(alpha, 0.0, 0.9);
    
    // Fresnel for glass edge effect
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), 3.0);
    alpha += fresnel * 0.3;
    color += mix(neonCyan, neonPink, fresnel) * fresnel * 0.5;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// Sparkle particles component
function SparkleParticles({ count = 50, speakingIntensity = 0 }: { count?: number, speakingIntensity?: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // Distribute particles within cube bounds
      pos[i * 3] = (Math.random() - 0.5) * 1.6
      pos[i * 3 + 1] = (Math.random() - 0.5) * 1.6
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.6
    }
    return pos
  }, [count])
  
  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.getElapsedTime()
      const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        // Gentle floating movement
        posArray[i3 + 1] += Math.sin(time + i) * 0.001 * (1 + speakingIntensity)
        posArray[i3] += Math.cos(time * 0.5 + i * 0.5) * 0.0005
        
        // Keep within bounds
        if (Math.abs(posArray[i3]) > 0.8) posArray[i3] *= 0.98
        if (Math.abs(posArray[i3 + 1]) > 0.8) posArray[i3 + 1] *= 0.98
        if (Math.abs(posArray[i3 + 2]) > 0.8) posArray[i3 + 2] *= 0.98
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#ffffff"
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

export function IsometricCube({ 
  transitionProgress = 0, 
  targetColor = new THREE.Color(1.0, 0.5, 0.15),
  reducedMotion = false,
  animationState = 'idle'
}: IsometricCubeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const baseRotationRef = useRef({ y: 0, x: 0, z: 0 })
  const speakingIntensityRef = useRef(0)
  
  const plasmaUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSpeakingIntensity: { value: 0 },
    uTargetColor: { value: targetColor },
    uTransitionProgress: { value: transitionProgress },
  }), [])
  
  useFrame((state) => {
    const time = reducedMotion ? state.clock.getElapsedTime() * 0.3 : state.clock.getElapsedTime()
    const isActive = animationState === 'listening' || animationState === 'speaking'
    const isSpeaking = animationState === 'speaking'
    
    // Smooth speaking intensity
    const targetIntensity = isSpeaking ? 1.0 : (animationState === 'listening' ? 0.4 : 0.0)
    speakingIntensityRef.current += (targetIntensity - speakingIntensityRef.current) * 0.08
    
    plasmaUniforms.uTime.value = time
    plasmaUniforms.uSpeakingIntensity.value = speakingIntensityRef.current
    plasmaUniforms.uTransitionProgress.value = transitionProgress
    plasmaUniforms.uTargetColor.value = targetColor
    
    if (groupRef.current) {
      if (isActive) {
        // Stop rotation when active
        const breathe = Math.sin(time * 2.0) * 0.01 * speakingIntensityRef.current
        groupRef.current.scale.setScalar(1 + breathe)
        groupRef.current.rotation.y = baseRotationRef.current.y
        groupRef.current.rotation.x = baseRotationRef.current.x
        groupRef.current.position.y = 0
      } else {
        // Very slow rotation when idle
        baseRotationRef.current.y = time * 0.06
        baseRotationRef.current.x = Math.sin(time * 0.04) * 0.08
        
        groupRef.current.rotation.y = baseRotationRef.current.y
        groupRef.current.rotation.x = baseRotationRef.current.x
        groupRef.current.position.y = Math.sin(time * 0.25) * 0.03
        groupRef.current.scale.setScalar(1)
      }
    }
    
    // Orange core glow
    if (coreRef.current) {
      const mat = coreRef.current.material as THREE.MeshBasicMaterial
      if (isSpeaking) {
        const pulse = Math.sin(time * 5) * 0.3 + 0.7
        mat.opacity = 0.4 + pulse * 0.4
        coreRef.current.scale.setScalar(0.15 + pulse * 0.08)
      } else {
        mat.opacity = 0.3
        coreRef.current.scale.setScalar(0.15)
      }
    }
  })
  
  return (
    <group ref={groupRef}>
      {/* Main plasma cube - transparent with edge glow */}
      <mesh>
        <boxGeometry args={[1.8, 1.8, 1.8, 32, 32, 32]} />
        <shaderMaterial
          vertexShader={edgeVertexShader}
          fragmentShader={plasmaFragmentShader}
          uniforms={plasmaUniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Glowing wireframe edges */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.82, 1.82, 1.82)]} />
        <lineBasicMaterial color="#8844ff" transparent opacity={0.6} />
      </lineSegments>
      
      {/* Inner wireframe */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.5, 1.5, 1.5)]} />
        <lineBasicMaterial color="#44aaff" transparent opacity={0.3} />
      </lineSegments>
      
      {/* Orange energy core */}
      <mesh ref={coreRef} scale={0.15}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial 
          color="#ff6622" 
          transparent 
          opacity={0.3}
        />
      </mesh>
      
      {/* Sparkle particles */}
      <SparkleParticles count={60} speakingIntensity={speakingIntensityRef.current} />
    </group>
  )
}

export default IsometricCube
