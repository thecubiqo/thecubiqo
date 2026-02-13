import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Particle system with plasma wave effect
const ParticleWave = ({ mousePosition, audioLevel, aiState, particleCount = 12000 }) => {
  const pointsRef = useRef();
  const { viewport } = useThree();
  
  // Store persistent data
  const dataRef = useRef({
    phases: new Float32Array(particleCount),
    baseY: new Float32Array(particleCount),
    initialSizes: new Float32Array(particleCount),
    initialized: false
  });
  
  // Color palettes for different AI states
  const colorPalettes = useMemo(() => ({
    neutral: ['#00d4ff', '#7b2cbf', '#e040fb', '#ff1744'],
    thinking: ['#00e5ff', '#651fff', '#d500f9', '#ff9100'],
    speaking: ['#00ffc6', '#536dfe', '#f50057', '#ffea00'],
    listening: ['#18ffff', '#7c4dff', '#ff4081', '#ff6e40'],
    error: ['#ff1744', '#d50000', '#ff5252', '#ff8a80']
  }), []);

  // Initialize geometry
  const geometry = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const palette = colorPalettes.neutral.map(c => new THREE.Color(c));
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Distribute particles
      positions[i3] = (Math.random() - 0.5) * 20;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = (Math.random() - 0.5) * 15;
      
      // Store persistent data
      dataRef.current.phases[i] = Math.random() * Math.PI * 2;
      dataRef.current.baseY[i] = (Math.random() - 0.5) * 2;
      dataRef.current.initialSizes[i] = Math.random() * 0.08 + 0.02;
      
      // Initial colors
      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      
      sizes[i] = dataRef.current.initialSizes[i];
    }
    
    dataRef.current.initialized = true;
    
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    
    return geom;
  }, [particleCount, colorPalettes]);

  // Shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {},
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

  // Animation
  useFrame((state) => {
    if (!pointsRef.current || !dataRef.current.initialized) return;
    
    const time = state.clock.elapsedTime;
    const geom = pointsRef.current.geometry;
    const posAttr = geom.attributes.position;
    const colorAttr = geom.attributes.color;
    const sizeAttr = geom.attributes.size;
    
    const palette = (colorPalettes[aiState] || colorPalettes.neutral).map(c => new THREE.Color(c));
    const audioMult = 1 + (audioLevel * 3);
    const { phases, baseY, initialSizes } = dataRef.current;
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const x = posAttr.array[i3];
      const z = posAttr.array[i3 + 2];
      
      // Waves
      const wave1 = Math.sin(x * 0.5 + time * 0.8 + phases[i]) * 1.5;
      const wave2 = Math.cos(z * 0.3 + time * 0.6) * 1.2;
      const wave3 = Math.sin((x + z) * 0.2 + time * 1.2) * 0.8;
      
      // Mouse
      const dx = x - (mousePosition.x * viewport.width * 0.5);
      const dz = z - (mousePosition.y * viewport.height * 0.5);
      const dist = Math.sqrt(dx * dx + dz * dz);
      const mouseInf = Math.max(0, 1 - dist / 4) * 2;
      
      // Y position
      posAttr.array[i3 + 1] = (wave1 + wave2 + wave3) * audioMult + baseY[i] + mouseInf * Math.sin(time * 3 + phases[i]);
      
      // Colors
      const t = (Math.sin(time * 0.5 + x * 0.1 + z * 0.1) * 0.5 + 0.5);
      const idx = Math.floor(t * (palette.length - 1));
      const nextIdx = (idx + 1) % palette.length;
      const blend = t % (1 / palette.length) * palette.length;
      
      colorAttr.array[i3] = THREE.MathUtils.lerp(palette[idx].r, palette[nextIdx].r, blend);
      colorAttr.array[i3 + 1] = THREE.MathUtils.lerp(palette[idx].g, palette[nextIdx].g, blend);
      colorAttr.array[i3 + 2] = THREE.MathUtils.lerp(palette[idx].b, palette[nextIdx].b, blend);
      
      // Sizes
      sizeAttr.array[i] = initialSizes[i] * (1 + audioLevel * 2 + mouseInf * 0.5);
    }
    
    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
};

// Ambient particles
const AmbientParticles = ({ count = 400 }) => {
  const pointsRef = useRef();
  
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geom;
  }, [count]);
  
  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.elapsedTime;
    const posAttr = pointsRef.current.geometry.attributes.position;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      posAttr.array[i3 + 1] += Math.sin(time + i) * 0.002;
      posAttr.array[i3] += Math.cos(time * 0.5 + i) * 0.001;
    }
    posAttr.needsUpdate = true;
  });
  
  return (
    <points ref={pointsRef} geometry={geometry}>
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

// Scene component
const Scene = ({ mousePosition, audioLevel, aiState }) => {
  return (
    <>
      <ambientLight intensity={0.1} />
      <ParticleWave mousePosition={mousePosition} audioLevel={audioLevel} aiState={aiState} />
      <AmbientParticles />
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={5}
        maxDistance={25}
        autoRotate
        autoRotateSpeed={0.3}
      />
      <fog attach="fog" args={['#050510', 10, 30]} />
    </>
  );
};

// Main component
const PlasmaField = ({ aiState = 'neutral', onAudioLevelChange }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [audioLevel, setAudioLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // Mouse tracking
  useEffect(() => {
    const handleMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);
  
  // Audio
  const startAudio = useCallback(async () => {
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
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const level = avg / 255;
        setAudioLevel(level);
        if (onAudioLevelChange) onAudioLevelChange(level);
        animationFrameRef.current = requestAnimationFrame(analyze);
      };
      
      analyze();
      setIsListening(true);
    } catch (err) {
      console.log('Mic unavailable');
    }
  }, [onAudioLevelChange]);
  
  const stopAudio = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsListening(false);
    setAudioLevel(0);
  }, []);
  
  useEffect(() => () => stopAudio(), [stopAudio]);
  
  return (
    <div style={{ width: '100%', height: '100vh', background: '#050510', position: 'relative' }}>
      {/* Audio button */}
      <button
        data-testid="audio-toggle-btn"
        onClick={isListening ? stopAudio : startAudio}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          zIndex: 100,
          padding: '12px 24px',
          background: isListening ? 'rgba(255, 23, 68, 0.3)' : 'rgba(0, 212, 255, 0.3)',
          border: `1px solid ${isListening ? '#ff1744' : '#00d4ff'}`,
          borderRadius: 30,
          color: '#fff',
          cursor: 'pointer',
          fontSize: 14,
          backdropFilter: 'blur(10px)',
        }}
      >
        {isListening ? '🎤 Stop' : '🎙️ Audio React'}
      </button>
      
      {/* State indicator */}
      <div
        data-testid="ai-state-indicator"
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 100,
          padding: '8px 16px',
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: 20,
          color: '#fff',
          fontSize: 12,
          backdropFilter: 'blur(10px)',
          textTransform: 'uppercase',
          letterSpacing: 2,
        }}
      >
        AI: {aiState}
      </div>
      
      {/* Audio level */}
      {isListening && (
        <div style={{
          position: 'absolute',
          bottom: 80,
          right: 20,
          zIndex: 100,
          width: 150,
          height: 8,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${audioLevel * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #00d4ff, #e040fb, #ff1744)',
          }} />
        </div>
      )}
      
      <Canvas camera={{ position: [0, 5, 12], fov: 60 }} dpr={[1, 2]}>
        <Scene mousePosition={mousePosition} audioLevel={audioLevel} aiState={aiState} />
      </Canvas>
    </div>
  );
};

export default PlasmaField;
