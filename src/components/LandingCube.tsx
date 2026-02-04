'use client'

/**
 * LandingCube - Ethereal Plasma Energy Cube
 * 
 * A stunning transparent cuboid with purple/blue/pink/orange plasma energy flowing inside.
 * Features sparkle particles, strong bloom glow, and responds to user's voice color.
 * Shown once per day or after prolonged inactivity.
 */

import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { RoundedBox } from '@react-three/drei'

// Plasma energy shader - purple/blue/pink/orange flowing energy
const plasmaVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  
  uniform float uTime;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    
    // Gentle breathing
    float breathe = sin(uTime * 0.4) * 0.02;
    vec3 displaced = position * (1.0 + breathe);
    
    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = worldPos.xyz;
    
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const plasmaFragmentShader = `
  precision highp float;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  
  uniform float uTime;
  uniform vec3 uTargetColor;
  uniform float uColorMix;
  
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
    
    // Multiple flowing energy layers
    float flow1 = fbm(pos + vec3(time * 0.5, time * 0.3, time * 0.2));
    float flow2 = fbm(pos * 1.2 + vec3(-time * 0.4, time * 0.6, 0.0));
    float flow3 = fbm(pos * 0.8 - vec3(0.0, time * 0.5, time * 0.4));
    float flow4 = fbm(pos * 1.5 + vec3(time * 0.3, -time * 0.2, time * 0.4));
    
    // Combine flows for complex energy pattern
    float energy = flow1 * 0.35 + flow2 * 0.25 + flow3 * 0.25 + flow4 * 0.15;
    energy = smoothstep(-0.4, 0.7, energy);
    
    // Beautiful ethereal colors - purple, blue, pink, cyan, orange
    vec3 deepPurple = vec3(0.4, 0.1, 0.9);
    vec3 electricBlue = vec3(0.2, 0.5, 1.0);
    vec3 hotPink = vec3(1.0, 0.3, 0.7);
    vec3 cyan = vec3(0.3, 0.9, 1.0);
    vec3 warmOrange = vec3(1.0, 0.55, 0.2);
    vec3 magenta = vec3(0.9, 0.2, 0.8);
    vec3 white = vec3(1.0, 0.95, 0.98);
    
    // Build complex color gradient based on flows
    vec3 color = mix(deepPurple, electricBlue, smoothstep(-0.3, 0.5, flow1));
    color = mix(color, hotPink, smoothstep(-0.2, 0.6, flow2) * 0.7);
    color = mix(color, cyan, smoothstep(0.0, 0.7, flow3) * 0.5);
    color = mix(color, magenta, smoothstep(-0.1, 0.5, flow4) * 0.4);
    
    // Add warm orange core
    float centerDist = length(vPosition);
    float coreGlow = smoothstep(0.9, 0.0, centerDist);
    color = mix(color, warmOrange, coreGlow * 0.5);
    
    // Bright energy veins
    float veins = pow(energy, 2.0);
    color = mix(color, white, veins * 0.4);
    
    // Sparkle effect - bright points
    float sparkle = snoise(pos * 12.0 + vec3(time * 3.0));
    float sparkleIntensity = smoothstep(0.75, 0.95, sparkle);
    color += white * sparkleIntensity * 0.6;
    
    // Mix with target color based on voice detection
    vec3 finalColor = mix(color, uTargetColor, uColorMix * 0.6);
    
    // Pulsing
    float pulse = sin(uTime * 0.5) * 0.5 + 0.5;
    finalColor *= 0.85 + pulse * 0.15;
    
    // Fresnel rim glow
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.5);
    vec3 rimColor = mix(cyan, hotPink, sin(uTime * 0.3) * 0.5 + 0.5);
    finalColor += rimColor * fresnel * 0.5;
    
    // Alpha - core is more opaque
    float alpha = 0.45 + energy * 0.35 + coreGlow * 0.2;
    alpha = clamp(alpha, 0.3, 0.85);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// Glass shell shader
const glassFragmentShader = `
  precision highp float;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  
  uniform float uTime;
  
  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 3.5);
    
    // Subtle iridescent edge
    vec3 edgeColor = mix(
      vec3(0.6, 0.4, 1.0),
      vec3(0.4, 0.8, 1.0),
      sin(uTime * 0.4 + vPosition.y * 2.0) * 0.5 + 0.5
    );
    
    vec3 color = edgeColor * fresnel * 0.4;
    float alpha = fresnel * 0.2;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

interface PlasmaCubeProps {
  targetColor?: THREE.Color
  colorMix?: number
}

function PlasmaCube({ targetColor, colorMix = 0 }: PlasmaCubeProps) {
  const plasmaRef = useRef<THREE.Mesh>(null)
  const glassRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const particlesRef = useRef<THREE.Points>(null)
  
  const plasmaUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uTargetColor: { value: targetColor || new THREE.Color(0.5, 0.3, 1.0) },
    uColorMix: { value: colorMix },
  }), [])
  
  const glassUniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), [])
  
  // Sparkle particles
  const particleCount = 80
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1.4
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1.4
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.4
    }
    return positions
  }, [])
  
  // Update target color
  useEffect(() => {
    if (targetColor) {
      plasmaUniforms.uTargetColor.value = targetColor
    }
  }, [targetColor, plasmaUniforms])
  
  // Update color mix
  useEffect(() => {
    plasmaUniforms.uColorMix.value = colorMix
  }, [colorMix, plasmaUniforms])
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    plasmaUniforms.uTime.value = time
    glassUniforms.uTime.value = time
    
    if (groupRef.current) {
      // Slow elegant rotation
      groupRef.current.rotation.y = time * 0.1
      groupRef.current.rotation.x = Math.sin(time * 0.06) * 0.12
      groupRef.current.rotation.z = Math.sin(time * 0.08) * 0.05
      // Gentle floating
      groupRef.current.position.y = Math.sin(time * 0.35) * 0.06
    }
    
    // Animate particles
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        positions[i3 + 1] += Math.sin(time * 2 + i) * 0.001
        positions[i3] += Math.cos(time * 1.5 + i * 0.5) * 0.0005
        
        // Keep particles inside cube
        if (Math.abs(positions[i3]) > 0.7) positions[i3] *= 0.95
        if (Math.abs(positions[i3 + 1]) > 0.7) positions[i3 + 1] *= 0.95
        if (Math.abs(positions[i3 + 2]) > 0.7) positions[i3 + 2] *= 0.95
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true
    }
  })
  
  return (
    <group ref={groupRef}>
      {/* Inner plasma energy - main layer */}
      <RoundedBox args={[1.5, 1.5, 1.5]} radius={0.15} smoothness={8} ref={plasmaRef}>
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
      
      {/* Secondary plasma layer - adds depth */}
      <RoundedBox args={[1.2, 1.2, 1.2]} radius={0.12} smoothness={8}>
        <shaderMaterial
          vertexShader={plasmaVertexShader}
          fragmentShader={plasmaFragmentShader}
          uniforms={plasmaUniforms}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </RoundedBox>
      
      {/* Core glow sphere */}
      <mesh scale={0.2}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          color="#ff8844" 
          transparent 
          opacity={0.6}
        />
      </mesh>
      
      {/* Sparkle particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          color="#ffffff"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      
      {/* Outer glass shell */}
      <RoundedBox args={[1.55, 1.55, 1.55]} radius={0.16} smoothness={8} ref={glassRef}>
        <shaderMaterial
          vertexShader={plasmaVertexShader}
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

// Color mapping for voice detection
const VOICE_COLORS = {
  GREEN: new THREE.Color(0.2, 0.9, 0.5),
  YELLOW: new THREE.Color(1.0, 0.85, 0.3),
  RED: new THREE.Color(0.95, 0.25, 0.4),
  ORANGE: new THREE.Color(1.0, 0.55, 0.2),
}

interface LandingCubeProps {
  onComplete: () => void
  detectedColor?: 'GREEN' | 'YELLOW' | 'RED' | 'ORANGE'
}

export function LandingCube({ onComplete, detectedColor }: LandingCubeProps) {
  const [colorMix, setColorMix] = useState(0)
  const [targetColor, setTargetColor] = useState<THREE.Color>(new THREE.Color(0.5, 0.3, 1.0))
  
  // Animate color transition when voice is detected
  useEffect(() => {
    if (detectedColor) {
      setTargetColor(VOICE_COLORS[detectedColor])
      // Animate color mix
      let progress = 0
      const animate = () => {
        progress += 0.025
        setColorMix(Math.min(progress, 1))
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      animate()
    } else {
      // Slowly reset
      setColorMix(prev => Math.max(prev - 0.01, 0))
    }
  }, [detectedColor])
  
  return (
    <div 
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center cursor-pointer"
      onClick={onComplete}
      data-testid="landing-cube-screen"
    >
      {/* Deep space background */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/30 via-black to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(120,50,200,0.15)_0%,_transparent_70%)]" />
      
      {/* 3D Canvas */}
      <div className="w-full h-[60vh] max-w-3xl relative z-10">
        <Canvas 
          camera={{ position: [0, 0, 3.5], fov: 45 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <PlasmaCube targetColor={targetColor} colorMix={colorMix} />
          <EffectComposer>
            <Bloom 
              intensity={2.0}
              luminanceThreshold={0.1}
              luminanceSmoothing={0.95}
              mipmapBlur
            />
          </EffectComposer>
        </Canvas>
      </div>
      
      {/* Welcome text */}
      <div className="text-center mt-4 relative z-10">
        <h1 className="text-white/90 text-3xl font-extralight tracking-[0.3em] mb-2">
          CUBIQO
        </h1>
        <p className="text-purple-300/60 text-sm font-light tracking-wider mb-8">
          One Mind. Many Dimensions.
        </p>
        <p className="text-white/30 text-xs tracking-wide">
          Tap anywhere to begin
        </p>
      </div>
      
      {/* Ambient floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float-particle"
            style={{
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              background: `rgba(${150 + Math.random() * 100}, ${100 + Math.random() * 100}, ${200 + Math.random() * 55}, ${0.3 + Math.random() * 0.4})`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${8 + Math.random() * 6}s`,
              boxShadow: `0 0 ${4 + Math.random() * 6}px currentColor`,
            }}
          />
        ))}
      </div>
      
      <style jsx>{`
        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          50% {
            transform: translateY(-120px) translateX(${Math.random() > 0.5 ? '' : '-'}30px) scale(0.8);
          }
          90% {
            opacity: 0.8;
          }
        }
        .animate-float-particle {
          animation: float-particle linear infinite;
        }
      `}</style>
    </div>
  )
}

export default LandingCube
