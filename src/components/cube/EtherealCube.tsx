'use client'

/**
 * EtherealCube - Transparent Glass Cube with Flowing Plasma
 * 
 * Matching reference: Transparent glass cube with wispy purple/blue/pink
 * aurora plasma flowing inside, sparkles, neon glow edges.
 * 
 * - OuterGlass: Transparent, see-through, subtle edge glow
 * - InnerPlasma: Wispy flowing energy, NOT solid
 * - Idle: Nearly still, subtle ambient glow
 * - Talking: Plasma flows actively, intensifies
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'

interface EtherealCubeProps {
  isTalking?: boolean
  isListening?: boolean
}

// Plasma shader - creates wispy aurora effect
const plasmaVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const plasmaFragmentShader = `
  precision highp float;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  
  uniform float uTime;
  uniform float uFlow;
  
  // Noise functions for plasma effect
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
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
    // Animated time based on flow (fast when talking, slow when idle)
    float t = uTime * uFlow;
    vec3 p = vPosition * 2.0;
    
    // Multiple wispy plasma layers
    float wisp1 = snoise(p + vec3(t * 0.3, t * 0.2, 0.0));
    float wisp2 = snoise(p * 1.5 - vec3(0.0, t * 0.4, t * 0.3));
    float wisp3 = snoise(p * 0.8 + vec3(t * 0.25, 0.0, t * 0.35));
    
    // Combine wisps - creates flowing tendrils
    float plasma = wisp1 * 0.4 + wisp2 * 0.35 + wisp3 * 0.25;
    plasma = smoothstep(-0.5, 0.8, plasma);
    
    // Only show plasma in wispy areas (not solid fill)
    float wispMask = smoothstep(0.3, 0.7, plasma);
    
    // Neon colors
    vec3 purple = vec3(0.6, 0.2, 1.0);
    vec3 blue = vec3(0.3, 0.5, 1.0);
    vec3 pink = vec3(1.0, 0.3, 0.7);
    vec3 cyan = vec3(0.3, 0.9, 1.0);
    vec3 white = vec3(1.0, 0.95, 1.0);
    
    // Color mixing based on plasma flow
    vec3 color = mix(purple, blue, wisp1 * 0.5 + 0.5);
    color = mix(color, pink, wisp2 * 0.4 + 0.3);
    color = mix(color, cyan, wisp3 * 0.3 + 0.2);
    
    // Bright cores
    color = mix(color, white, pow(plasma, 3.0) * 0.5);
    
    // Sparkles
    float sparkle = snoise(p * 10.0 + vec3(uTime * 2.0));
    float sparkleMask = smoothstep(0.85, 0.95, sparkle);
    color += white * sparkleMask * 0.8;
    
    // Pulsing intensity when talking
    float pulse = sin(uTime * 3.0) * 0.5 + 0.5;
    color *= 1.0 + pulse * 0.3 * uFlow;
    
    // Alpha - transparent where no plasma, visible where wisps are
    float alpha = wispMask * (0.4 + plasma * 0.4);
    alpha *= 0.8; // Overall transparency
    
    // Fresnel edge glow
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.5);
    color += mix(purple, pink, fresnel) * fresnel * 0.4;
    alpha += fresnel * 0.2;
    
    gl_FragColor = vec4(color, alpha);
  }
`

// Glass shader - transparent with edge glow
const glassFragmentShader = `
  precision highp float;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  uniform float uTime;
  
  void main() {
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 4.0);
    
    // Iridescent edge colors
    vec3 purple = vec3(0.5, 0.2, 1.0);
    vec3 cyan = vec3(0.3, 0.8, 1.0);
    vec3 edgeColor = mix(purple, cyan, sin(uTime * 0.5 + vPosition.y * 2.0) * 0.5 + 0.5);
    
    // Only visible at edges (fresnel)
    vec3 color = edgeColor * fresnel * 0.6;
    float alpha = fresnel * 0.25;
    
    gl_FragColor = vec4(color, alpha);
  }
`

export function EtherealCube({ isTalking = false, isListening = false }: EtherealCubeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const flowRef = useRef(0.1)
  
  const plasmaUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uFlow: { value: 0.1 }
  }), [])
  
  const glassUniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), [])
  
  useFrame((state) => {
    const t = state.clock.elapsedTime
    
    // Smooth flow transition
    const targetFlow = isTalking ? 1.0 : (isListening ? 0.4 : 0.1)
    flowRef.current += (targetFlow - flowRef.current) * 0.06
    
    plasmaUniforms.uTime.value = t
    plasmaUniforms.uFlow.value = flowRef.current
    glassUniforms.uTime.value = t
    
    // No rotation - cube stays static
  })
  
  return (
    <group ref={groupRef}>
      {/* Inner plasma - wispy flowing energy */}
      <RoundedBox args={[1.6, 1.6, 1.6]} radius={0.15} smoothness={8}>
        <shaderMaterial
          vertexShader={plasmaVertexShader}
          fragmentShader={plasmaFragmentShader}
          uniforms={plasmaUniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </RoundedBox>
      
      {/* Outer glass shell - transparent with edge glow */}
      <RoundedBox args={[1.7, 1.7, 1.7]} radius={0.18} smoothness={8}>
        <shaderMaterial
          vertexShader={plasmaVertexShader}
          fragmentShader={glassFragmentShader}
          uniforms={glassUniforms}
          transparent
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </RoundedBox>
      
      {/* Edge wireframe for cube definition */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.72, 1.72, 1.72)]} />
        <lineBasicMaterial color="#8844ff" transparent opacity={0.4} />
      </lineSegments>
    </group>
  )
}

export default EtherealCube
