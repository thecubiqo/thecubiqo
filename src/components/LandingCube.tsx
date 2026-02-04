'use client'

/**
 * LandingCube - Golden Plasma Energy Cube
 * 
 * A transparent cuboid with yellow/golden plasma energy flowing inside.
 * The energy responds to user's voice color and transforms accordingly.
 * Shown once per day or after prolonged inactivity.
 */

import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

// Vertex shader - glass cube with subtle distortion
const vertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  
  uniform float uTime;
  
  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    
    // Subtle breathing effect
    float breathe = sin(uTime * 0.5) * 0.015;
    vec3 displaced = position * (1.0 + breathe);
    
    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = worldPos.xyz;
    
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

// Fragment shader - golden plasma energy
const plasmaFragmentShader = `
  precision highp float;
  
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  
  uniform float uTime;
  uniform vec3 uTargetColor; // Color to transition to based on voice
  uniform float uColorMix;   // 0-1 transition progress
  
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
    float time = uTime * 0.2;
    vec3 pos = vPosition * 2.5;
    
    // Multiple energy flow layers
    float flow1 = fbm(pos + vec3(time * 0.4, time * 0.3, time * 0.2));
    float flow2 = fbm(pos * 1.3 + vec3(-time * 0.3, time * 0.5, 0.0));
    float flow3 = fbm(pos * 0.7 - vec3(0.0, time * 0.4, time * 0.3));
    
    // Combine flows
    float energy = flow1 * 0.4 + flow2 * 0.35 + flow3 * 0.25;
    energy = smoothstep(-0.4, 0.6, energy);
    
    // Golden base colors
    vec3 deepGold = vec3(0.7, 0.45, 0.0);
    vec3 brightYellow = vec3(1.0, 0.85, 0.2);
    vec3 orange = vec3(1.0, 0.5, 0.1);
    vec3 white = vec3(1.0, 0.98, 0.9);
    
    // Build golden plasma color
    vec3 plasmaColor = mix(deepGold, brightYellow, energy);
    plasmaColor = mix(plasmaColor, orange, flow2 * 0.5 + 0.3);
    
    // Bright energy streaks
    float streaks = pow(energy, 2.5);
    plasmaColor = mix(plasmaColor, white, streaks * 0.5);
    
    // Distance from center - core glow
    float centerDist = length(vPosition);
    float coreIntensity = smoothstep(0.9, 0.0, centerDist);
    plasmaColor = mix(plasmaColor, brightYellow, coreIntensity * 0.4);
    
    // Mix with target color based on voice detection
    vec3 finalColor = mix(plasmaColor, uTargetColor, uColorMix * 0.7);
    
    // Add energy cubes effect - small bright spots
    float cubeNoise = snoise(pos * 8.0 + vec3(time * 2.0));
    float cubes = smoothstep(0.7, 0.9, cubeNoise);
    finalColor += white * cubes * 0.3;
    
    // Pulsing intensity
    float pulse = sin(uTime * 0.6) * 0.5 + 0.5;
    finalColor *= 0.85 + pulse * 0.15;
    
    // Fresnel rim
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.5);
    finalColor += mix(brightYellow, uTargetColor, uColorMix) * fresnel * 0.4;
    
    // Alpha - more transparent at edges
    float alpha = 0.5 + energy * 0.35 + coreIntensity * 0.15;
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
    float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0);
    
    // Subtle edge glow
    vec3 edgeColor = vec3(1.0, 0.9, 0.6);
    vec3 color = edgeColor * fresnel * 0.3;
    
    // Very transparent with edge highlights
    float alpha = fresnel * 0.15;
    
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
  
  const plasmaUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uTargetColor: { value: targetColor || new THREE.Color(1.0, 0.85, 0.2) },
    uColorMix: { value: colorMix },
  }), [])
  
  const glassUniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), [])
  
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
  
  // Rounded box geometry
  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(1.6, 1.6, 1.6, 48, 48, 48)
  }, [])
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    plasmaUniforms.uTime.value = time
    glassUniforms.uTime.value = time
    
    if (groupRef.current) {
      // Slow rotation
      groupRef.current.rotation.y = time * 0.12
      groupRef.current.rotation.x = Math.sin(time * 0.08) * 0.15
      // Gentle floating
      groupRef.current.position.y = Math.sin(time * 0.4) * 0.08
    }
  })
  
  return (
    <group ref={groupRef}>
      {/* Inner plasma energy */}
      <mesh ref={plasmaRef} geometry={geometry} scale={0.85}>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={plasmaFragmentShader}
          uniforms={plasmaUniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Middle plasma layer */}
      <mesh geometry={geometry} scale={0.7}>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={plasmaFragmentShader}
          uniforms={plasmaUniforms}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Core glow */}
      <mesh scale={0.25}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          color="#ffaa00" 
          transparent 
          opacity={0.7}
        />
      </mesh>
      
      {/* Outer glass shell */}
      <mesh ref={glassRef} geometry={geometry}>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={glassFragmentShader}
          uniforms={glassUniforms}
          transparent
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* Edge wireframe for definition */}
      <mesh geometry={geometry} scale={1.001}>
        <meshBasicMaterial 
          color="#ffd700"
          wireframe
          transparent
          opacity={0.05}
        />
      </mesh>
    </group>
  )
}

// Color mapping for voice detection
const VOICE_COLORS = {
  GREEN: new THREE.Color(0.2, 0.8, 0.4),
  YELLOW: new THREE.Color(1.0, 0.85, 0.2),
  RED: new THREE.Color(0.9, 0.2, 0.3),
  ORANGE: new THREE.Color(1.0, 0.5, 0.1),
}

interface LandingCubeProps {
  onComplete: () => void
  detectedColor?: 'GREEN' | 'YELLOW' | 'RED' | 'ORANGE'
}

export function LandingCube({ onComplete, detectedColor }: LandingCubeProps) {
  const [colorMix, setColorMix] = useState(0)
  const [targetColor, setTargetColor] = useState<THREE.Color>(VOICE_COLORS.YELLOW)
  
  // Animate color transition when voice is detected
  useEffect(() => {
    if (detectedColor && detectedColor !== 'YELLOW') {
      setTargetColor(VOICE_COLORS[detectedColor])
      // Animate color mix
      let progress = 0
      const animate = () => {
        progress += 0.02
        setColorMix(Math.min(progress, 1))
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      animate()
    } else {
      // Reset to golden
      setColorMix(0)
      setTargetColor(VOICE_COLORS.YELLOW)
    }
  }, [detectedColor])
  
  return (
    <div 
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center cursor-pointer"
      onClick={onComplete}
      data-testid="landing-cube-screen"
    >
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-yellow-900/20 via-black to-black" />
      
      <div className="w-full h-[55vh] max-w-2xl relative z-10">
        <Canvas 
          camera={{ position: [0, 0, 4], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
        >
          <PlasmaCube targetColor={targetColor} colorMix={colorMix} />
          <EffectComposer>
            <Bloom 
              intensity={1.5}
              luminanceThreshold={0.15}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
          </EffectComposer>
        </Canvas>
      </div>
      
      {/* Welcome text */}
      <div className="text-center mt-6 relative z-10">
        <h1 className="text-white/90 text-3xl font-light tracking-widest mb-3">
          CUBIQO
        </h1>
        <p className="text-yellow-500/70 text-sm font-light tracking-wide mb-6">
          One Mind. Many Dimensions.
        </p>
        <p className="text-white/40 text-xs">
          Tap anywhere to enter
        </p>
      </div>
      
      {/* Animated particles/dust (CSS) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          />
        ))}
      </div>
      
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          50% {
            transform: translateY(-100px) translateX(20px);
          }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .bg-gradient-radial {
          background: radial-gradient(ellipse at center, var(--tw-gradient-from), var(--tw-gradient-via), var(--tw-gradient-to));
        }
      `}</style>
    </div>
  )
}

export default LandingCube
