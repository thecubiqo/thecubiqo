'use client'

/**
 * TechLandingCube - High-tech wireframe energy cube
 * 
 * Matches the mockup: defined cubic geometry with glowing energy lines,
 * blue/purple/pink flows with orange accents, voice-reactive animations
 */

import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

// Energy wireframe shader
const energyVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  
  uniform float uTime;
  uniform float uVoiceIntensity;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    
    // Voice-reactive breathing
    float breathe = sin(uTime * 0.6) * 0.02;
    float voicePulse = uVoiceIntensity * 0.08;
    vec3 displaced = position * (1.0 + breathe + voicePulse);
    
    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = worldPos.xyz;
    
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const energyFragmentShader = `
  precision highp float;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  
  uniform float uTime;
  uniform float uVoiceIntensity;
  
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
    float time = uTime * 0.2;
    
    // Energy flow along the surface
    float flow1 = snoise(vPosition * 3.0 + vec3(time, 0.0, 0.0));
    float flow2 = snoise(vPosition * 2.0 + vec3(0.0, time * 0.8, time * 0.5));
    
    // Wireframe-like grid pattern
    vec3 gridPos = vPosition * 8.0;
    float gridX = abs(fract(gridPos.x) - 0.5);
    float gridY = abs(fract(gridPos.y) - 0.5);
    float gridZ = abs(fract(gridPos.z) - 0.5);
    float grid = min(min(gridX, gridY), gridZ);
    float wireframe = smoothstep(0.48, 0.45, grid);
    
    // Energy veins
    float veins = (flow1 + flow2) * 0.5;
    veins = smoothstep(-0.3, 0.8, veins);
    
    // Color palette - blue to purple to pink with orange accents
    vec3 deepBlue = vec3(0.15, 0.3, 0.9);
    vec3 purple = vec3(0.6, 0.2, 0.9);
    vec3 hotPink = vec3(1.0, 0.3, 0.7);
    vec3 cyan = vec3(0.2, 0.7, 1.0);
    vec3 orange = vec3(1.0, 0.5, 0.15);
    vec3 white = vec3(1.0, 0.95, 1.0);
    
    // Build color
    vec3 color = mix(deepBlue, purple, smoothstep(-0.5, 0.5, flow1));
    color = mix(color, hotPink, smoothstep(0.0, 0.8, flow2) * 0.6);
    color = mix(color, cyan, wireframe * 0.4);
    
    // Orange accent on energy peaks
    float energyPeak = smoothstep(0.6, 0.9, veins);
    color = mix(color, orange, energyPeak * 0.5);
    
    // Voice reactive - add orange glow
    color = mix(color, orange, uVoiceIntensity * 0.4);
    
    // Bright wireframe lines
    color = mix(color, white, wireframe * veins * 0.6);
    
    // Fresnel glow
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.2);
    color += cyan * fresnel * 0.5;
    color += orange * fresnel * 0.2 * uVoiceIntensity;
    
    // Pulsing
    float pulse = sin(uTime * 0.6) * 0.5 + 0.5;
    color *= 0.9 + pulse * 0.1;
    
    // Alpha
    float alpha = 0.6 + veins * 0.3 + wireframe * 0.2;
    alpha = clamp(alpha, 0.4, 0.95);
    
    gl_FragColor = vec4(color, alpha);
  }
`

interface TechCubeProps {
  voiceIntensity?: number
}

function TechCube({ voiceIntensity = 0 }: TechCubeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const edgesRef = useRef<THREE.LineSegments>(null)
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uVoiceIntensity: { value: voiceIntensity },
  }), [])
  
  // Update voice intensity
  useEffect(() => {
    uniforms.uVoiceIntensity.value = voiceIntensity
  }, [voiceIntensity, uniforms])
  
  // Create glowing edges
  const edges = useMemo(() => {
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
    const edges = new THREE.EdgesGeometry(geometry)
    return edges
  }, [])
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    uniforms.uTime.value = time
    
    if (groupRef.current) {
      // Elegant rotation
      groupRef.current.rotation.y = time * 0.15
      groupRef.current.rotation.x = Math.sin(time * 0.08) * 0.15
      groupRef.current.rotation.z = Math.sin(time * 0.06) * 0.08
      // Floating
      groupRef.current.position.y = Math.sin(time * 0.4) * 0.08
    }
    
    // Pulse edges on voice
    if (edgesRef.current) {
      const material = edgesRef.current.material as THREE.LineBasicMaterial
      material.opacity = 0.4 + voiceIntensity * 0.4 + Math.sin(time * 2) * 0.1
    }
  })
  
  return (
    <group ref={groupRef}>
      {/* Main energy cube */}
      <mesh ref={meshRef}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <shaderMaterial
          vertexShader={energyVertexShader}
          fragmentShader={energyFragmentShader}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Glowing edges */}
      <lineSegments ref={edgesRef} geometry={edges}>
        <lineBasicMaterial
          color="#88ccff"
          transparent
          opacity={0.5}
          linewidth={2}
        />
      </lineSegments>
      
      {/* Inner core sphere */}
      <mesh scale={0.3}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          color="#ff6633" 
          transparent 
          opacity={0.5 + voiceIntensity * 0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Sparkle particles inside */}
      {[...Array(40)].map((_, i) => {
        const x = (Math.random() - 0.5) * 1.2
        const y = (Math.random() - 0.5) * 1.2
        const z = (Math.random() - 0.5) * 1.2
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.01, 8, 8]} />
            <meshBasicMaterial 
              color={i % 3 === 0 ? "#ff9944" : "#66ccff"}
              transparent
              opacity={0.6}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        )
      })}
    </group>
  )
}

interface TechLandingCubeProps {
  onComplete: () => void
  isVoiceActive?: boolean
}

export function TechLandingCube({ onComplete, isVoiceActive = false }: TechLandingCubeProps) {
  const [voiceIntensity, setVoiceIntensity] = React.useState(0)
  
  // Animate voice intensity
  useEffect(() => {
    if (isVoiceActive) {
      let progress = 0
      const animate = () => {
        progress += 0.05
        setVoiceIntensity(Math.min(progress, 1))
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      animate()
    } else {
      // Fade out
      setVoiceIntensity(prev => Math.max(prev - 0.02, 0))
    }
  }, [isVoiceActive])
  
  return (
    <div 
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center cursor-pointer"
      onClick={onComplete}
      data-testid="tech-landing-cube"
    >
      {/* Deep space background */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/30 via-black to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(100,60,200,0.2)_0%,_transparent_70%)]" />
      
      {/* 3D Canvas */}
      <div className="w-full h-[65vh] max-w-4xl relative z-10">
        <Canvas 
          camera={{ position: [0, 0, 3.5], fov: 50 }}
          gl={{ 
            antialias: true, 
            alpha: true, 
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
          }}
        >
          <TechCube voiceIntensity={voiceIntensity} />
          <EffectComposer>
            <Bloom 
              intensity={2.5}
              luminanceThreshold={0.15}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
          </EffectComposer>
        </Canvas>
      </div>
      
      {/* Welcome text */}
      <div className="text-center mt-6 relative z-10">
        <h1 className="text-white/95 text-4xl font-light tracking-[0.4em] mb-3">
          CUBIQO
        </h1>
        <p className="text-cyan-300/70 text-base font-light tracking-wider mb-10">
          One Mind. Many Dimensions.
        </p>
        <p className="text-white/40 text-xs tracking-wide uppercase">
          Tap to begin
        </p>
      </div>
      
      {/* Floating particles in background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              background: i % 2 === 0 
                ? `rgba(100, 180, 255, ${0.3 + Math.random() * 0.4})` 
                : `rgba(255, 140, 80, ${0.3 + Math.random() * 0.4})`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-particle ${8 + Math.random() * 6}s linear infinite`,
              animationDelay: `${Math.random() * 8}s`,
              boxShadow: `0 0 ${6 + Math.random() * 8}px currentColor`,
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
            opacity: 1;
          }
          50% {
            transform: translateY(-150px) translateX(${Math.random() > 0.5 ? '' : '-'}40px) scale(0.7);
          }
          90% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export default TechLandingCube
