import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Particle system with plasma wave effect
const ParticleWave = ({ mousePosition, audioLevel, aiState, particleCount = 15000 }) => {
  const meshRef = useRef();
  const { viewport } = useThree();
  
  // Color palettes for different AI states
  const colorPalettes = useMemo(() => ({
    neutral: [
      new THREE.Color('#00d4ff'), // Cyan
      new THREE.Color('#7b2cbf'), // Purple
      new THREE.Color('#e040fb'), // Magenta
      new THREE.Color('#ff1744'), // Red
    ],
    thinking: [
      new THREE.Color('#00e5ff'), // Bright cyan
      new THREE.Color('#651fff'), // Deep purple
      new THREE.Color('#d500f9'), // Bright magenta
      new THREE.Color('#ff9100'), // Orange
    ],
    speaking: [
      new THREE.Color('#00ffc6'), // Teal
      new THREE.Color('#536dfe'), // Indigo
      new THREE.Color('#f50057'), // Pink
      new THREE.Color('#ffea00'), // Yellow
    ],
    listening: [
      new THREE.Color('#18ffff'), // Aqua
      new THREE.Color('#7c4dff'), // Violet
      new THREE.Color('#ff4081'), // Pink
      new THREE.Color('#ff6e40'), // Deep orange
    ],
    error: [
      new THREE.Color('#ff1744'), // Red
      new THREE.Color('#d50000'), // Dark red
      new THREE.Color('#ff5252'), // Light red
      new THREE.Color('#ff8a80'), // Pale red
    ]
  }), []);

  // Create particle geometry
  const { positions, colors, sizes, phases, baseY } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);
    const baseY = new Float32Array(particleCount);
    
    const palette = colorPalettes.neutral;
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Distribute particles in a wave-like grid
      const x = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 15;
      const y = 0;
      
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      
      baseY[i] = (Math.random() - 0.5) * 2;
      
      // Random color from palette
      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      
      // Random sizes
      sizes[i] = Math.random() * 0.08 + 0.02;
      
      // Random phase for wave animation
      phases[i] = Math.random() * Math.PI * 2;
    }
    
    return { positions, colors, sizes, phases, baseY };
  }, [particleCount, colorPalettes]);

  // Update particles each frame
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    const positionAttr = meshRef.current.geometry.attributes.position;
    const colorAttr = meshRef.current.geometry.attributes.color;
    const sizeAttr = meshRef.current.geometry.attributes.size;
    
    const palette = colorPalettes[aiState] || colorPalettes.neutral;
    const audioMultiplier = 1 + (audioLevel * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      const x = positionAttr.array[i3];
      const z = positionAttr.array[i3 + 2];
      
      // Wave calculation with multiple frequencies
      const wave1 = Math.sin(x * 0.5 + time * 0.8 + phases[i]) * 1.5;
      const wave2 = Math.cos(z * 0.3 + time * 0.6) * 1.2;
      const wave3 = Math.sin((x + z) * 0.2 + time * 1.2) * 0.8;
      
      // Mouse influence
      const dx = x - (mousePosition.x * viewport.width * 0.5);
      const dz = z - (mousePosition.y * viewport.height * 0.5);
      const dist = Math.sqrt(dx * dx + dz * dz);
      const mouseInfluence = Math.max(0, 1 - dist / 4) * 2;
      
      // Combine waves with audio and mouse
      const y = (wave1 + wave2 + wave3) * audioMultiplier + 
                baseY[i] + 
                mouseInfluence * Math.sin(time * 3 + phases[i]);
      
      positionAttr.array[i3 + 1] = y;
      
      // Update colors based on AI state and position
      const colorIndex = Math.floor((Math.sin(time * 0.5 + x * 0.1 + z * 0.1) * 0.5 + 0.5) * (palette.length - 1));
      const nextColorIndex = (colorIndex + 1) % palette.length;
      const blend = (Math.sin(time * 0.5 + x * 0.1 + z * 0.1) * 0.5 + 0.5) % 1;
      
      const color1 = palette[colorIndex];
      const color2 = palette[nextColorIndex];
      
      colorAttr.array[i3] = THREE.MathUtils.lerp(color1.r, color2.r, blend);
      colorAttr.array[i3 + 1] = THREE.MathUtils.lerp(color1.g, color2.g, blend);
      colorAttr.array[i3 + 2] = THREE.MathUtils.lerp(color1.b, color2.b, blend);
      
      // Pulse sizes with audio
      sizeAttr.array[i] = sizes[i] * (1 + audioLevel * 2 + mouseInfluence * 0.5);
    }
    
    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  });

  // Custom shader material for glowing particles
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          float glow = exp(-dist * 3.0);
          
          vec3 finalColor = vColor * (1.0 + glow * 0.5);
          gl_FragColor = vec4(finalColor, alpha * 0.8);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  return (
    <points ref={meshRef} material={shaderMaterial}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
    </points>
  );
};

// Ambient floating particles
const AmbientParticles = ({ count = 500 }) => {
  const meshRef = useRef();
  
  const { positions, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      sizes[i] = Math.random() * 0.05 + 0.01;
    }
    
    return { positions, sizes };
  }, [count]);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const posAttr = meshRef.current.geometry.attributes.position;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      posAttr.array[i3 + 1] += Math.sin(time + i) * 0.002;
      posAttr.array[i3] += Math.cos(time * 0.5 + i) * 0.001;
    }
    posAttr.needsUpdate = true;
  });
  
  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#ff69b4"
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// Main Plasma Field component
const PlasmaField = ({ aiState = 'neutral', onAudioLevelChange }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [audioLevel, setAudioLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // Mouse tracking
  const handleMouseMove = useCallback((e) => {
    setMousePosition({
      x: (e.clientX / window.innerWidth) * 2 - 1,
      y: -(e.clientY / window.innerHeight) * 2 + 1,
    });
  }, []);
  
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);
  
  // Audio analysis
  const startAudioAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const analyze = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalizedLevel = average / 255;
        
        setAudioLevel(normalizedLevel);
        if (onAudioLevelChange) onAudioLevelChange(normalizedLevel);
        
        animationFrameRef.current = requestAnimationFrame(analyze);
      };
      
      analyze();
      setIsListening(true);
    } catch (err) {
      console.log('Microphone access denied or unavailable');
    }
  }, [onAudioLevelChange]);
  
  const stopAudioAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsListening(false);
    setAudioLevel(0);
  }, []);
  
  useEffect(() => {
    return () => stopAudioAnalysis();
  }, [stopAudioAnalysis]);
  
  return (
    <div className="plasma-container" style={{ width: '100%', height: '100vh', background: '#050510' }}>
      {/* Audio toggle button */}
      <button
        data-testid="audio-toggle-btn"
        onClick={isListening ? stopAudioAnalysis : startAudioAnalysis}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 100,
          padding: '12px 24px',
          background: isListening ? 'rgba(255, 23, 68, 0.3)' : 'rgba(0, 212, 255, 0.3)',
          border: `1px solid ${isListening ? '#ff1744' : '#00d4ff'}`,
          borderRadius: '30px',
          color: '#fff',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: '14px',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
        }}
      >
        {isListening ? '🎤 Stop Listening' : '🎙️ Enable Audio React'}
      </button>
      
      {/* AI State indicator */}
      <div
        data-testid="ai-state-indicator"
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 100,
          padding: '8px 16px',
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '20px',
          color: '#fff',
          fontSize: '12px',
          backdropFilter: 'blur(10px)',
          textTransform: 'uppercase',
          letterSpacing: '2px',
        }}
      >
        AI State: {aiState}
      </div>
      
      {/* Audio level indicator */}
      {isListening && (
        <div
          data-testid="audio-level-indicator"
          style={{
            position: 'absolute',
            bottom: '80px',
            right: '20px',
            zIndex: 100,
            width: '150px',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${audioLevel * 100}%`,
              height: '100%',
              background: `linear-gradient(90deg, #00d4ff, #e040fb, #ff1744)`,
              transition: 'width 0.05s ease',
            }}
          />
        </div>
      )}
      
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 5, 12]} fov={60} />
        <ambientLight intensity={0.1} />
        
        <ParticleWave
          mousePosition={mousePosition}
          audioLevel={audioLevel}
          aiState={aiState}
        />
        <AmbientParticles />
        
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={5}
          maxDistance={25}
          autoRotate
          autoRotateSpeed={0.3}
        />
        
        {/* Fog for depth */}
        <fog attach="fog" args={['#050510', 10, 30]} />
      </Canvas>
    </div>
  );
};

export default PlasmaField;
