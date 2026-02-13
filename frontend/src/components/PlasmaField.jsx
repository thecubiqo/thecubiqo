import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

// Pure Three.js Plasma Field Component
const PlasmaField = ({ aiState = 'neutral', onAudioLevelChange }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const particlesRef = useRef(null);
  const animationRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const audioLevelRef = useRef(0);
  const timeRef = useRef(0);
  const currentAiStateRef = useRef(aiState);
  
  const [audioLevel, setAudioLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioAnimationRef = useRef(null);
  
  // Update aiState ref
  useEffect(() => {
    currentAiStateRef.current = aiState;
  }, [aiState]);
  
  // Color palettes for different AI states
  const colorPalettes = {
    neutral: ['#00d4ff', '#7b2cbf', '#e040fb', '#ff1744', '#ff69b4'],
    thinking: ['#00e5ff', '#651fff', '#d500f9', '#ff9100', '#00bcd4'],
    speaking: ['#00ffc6', '#536dfe', '#f50057', '#ffea00', '#76ff03'],
    listening: ['#18ffff', '#7c4dff', '#ff4081', '#ff6e40', '#ea80fc'],
    error: ['#ff1744', '#d50000', '#ff5252', '#ff8a80', '#ff1744']
  };
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050510');
    sceneRef.current = scene;
    
    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 8, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Main Plasma Particles
    const particleCount = 20000;
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);
    const baseY = new Float32Array(particleCount);
    const initialSizes = new Float32Array(particleCount);
    const velocityY = new Float32Array(particleCount);
    
    const palette = colorPalettes.neutral.map(c => new THREE.Color(c));
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Distribute in a wider grid pattern for wave effect
      positions[i3] = (Math.random() - 0.5) * 30;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = (Math.random() - 0.5) * 20;
      
      phases[i] = Math.random() * Math.PI * 2;
      baseY[i] = (Math.random() - 0.5) * 1.5;
      velocityY[i] = (Math.random() - 0.5) * 0.5;
      
      // Larger particles for more visible plasma effect
      initialSizes[i] = Math.random() * 0.15 + 0.05;
      sizes[i] = initialSizes[i];
      
      // Initial colors
      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Store extra data
    geometry.userData = { phases, baseY, initialSizes, velocityY };
    
    // Enhanced Shader material for glowing plasma effect
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        varying float vSize;
        
        void main() {
          vColor = color;
          vSize = size;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (400.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vSize;
        
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          if (dist > 0.5) discard;
          
          // Soft glow with bright core
          float core = 1.0 - smoothstep(0.0, 0.15, dist);
          float glow = exp(-dist * 4.0);
          float outer = exp(-dist * 2.0) * 0.5;
          
          float alpha = core + glow * 0.8 + outer;
          vec3 finalColor = vColor * (1.0 + core * 2.0 + glow);
          
          gl_FragColor = vec4(finalColor, alpha * 0.9);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;
    
    // Floating ambient particles (stars)
    const ambientGeo = new THREE.BufferGeometry();
    const ambientCount = 600;
    const ambientPositions = new Float32Array(ambientCount * 3);
    const ambientColors = new Float32Array(ambientCount * 3);
    
    for (let i = 0; i < ambientCount; i++) {
      const i3 = i * 3;
      ambientPositions[i3] = (Math.random() - 0.5) * 40;
      ambientPositions[i3 + 1] = (Math.random() - 0.5) * 25;
      ambientPositions[i3 + 2] = (Math.random() - 0.5) * 30;
      
      // Random colors
      const hue = Math.random();
      const color = new THREE.Color().setHSL(hue, 0.8, 0.6);
      ambientColors[i3] = color.r;
      ambientColors[i3 + 1] = color.g;
      ambientColors[i3 + 2] = color.b;
    }
    
    ambientGeo.setAttribute('position', new THREE.BufferAttribute(ambientPositions, 3));
    ambientGeo.setAttribute('color', new THREE.BufferAttribute(ambientColors, 3));
    
    const ambientMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    const ambientParticles = new THREE.Points(ambientGeo, ambientMat);
    scene.add(ambientParticles);
    
    // Animation loop
    const animate = () => {
      timeRef.current += 0.016;
      const time = timeRef.current;
      
      if (particlesRef.current) {
        const geom = particlesRef.current.geometry;
        const posAttr = geom.attributes.position;
        const colorAttr = geom.attributes.color;
        const sizeAttr = geom.attributes.size;
        const { phases, baseY, initialSizes, velocityY } = geom.userData;
        
        const currentPalette = colorPalettes[currentAiStateRef.current] || colorPalettes.neutral;
        const paletteColors = currentPalette.map(c => new THREE.Color(c));
        const audioMult = 1 + (audioLevelRef.current * 4);
        
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          const x = posAttr.array[i3];
          const z = posAttr.array[i3 + 2];
          
          // Multiple wave frequencies for organic plasma flow
          const wave1 = Math.sin(x * 0.3 + time * 0.8 + phases[i]) * 2.5;
          const wave2 = Math.cos(z * 0.25 + time * 0.6 + phases[i] * 0.5) * 2.0;
          const wave3 = Math.sin((x + z) * 0.15 + time * 1.2) * 1.5;
          const wave4 = Math.cos(x * 0.4 - time * 0.4) * Math.sin(z * 0.3 + time * 0.5) * 1.2;
          
          // Mouse influence - creates ripple effect
          const dx = x - (mouseRef.current.x * 15);
          const dz = z - (mouseRef.current.y * 10);
          const dist = Math.sqrt(dx * dx + dz * dz);
          const mouseInf = Math.max(0, 1 - dist / 6) * 3;
          const mouseWave = mouseInf * Math.sin(time * 5 + dist * 0.5);
          
          // Combined Y position with all effects
          const y = (wave1 + wave2 + wave3 + wave4) * audioMult * 0.5 + 
                    baseY[i] + 
                    mouseWave +
                    Math.sin(time * 2 + i * 0.01) * velocityY[i];
          
          posAttr.array[i3 + 1] = y;
          
          // Dynamic color blending based on position and time
          const colorPhase = (Math.sin(time * 0.3 + x * 0.08 + z * 0.08 + phases[i]) * 0.5 + 0.5);
          const idx = Math.floor(colorPhase * (paletteColors.length - 1));
          const nextIdx = (idx + 1) % paletteColors.length;
          const blend = (colorPhase * (paletteColors.length - 1)) % 1;
          
          // Add intensity based on Y height
          const heightIntensity = 1 + Math.abs(y) * 0.1;
          
          colorAttr.array[i3] = THREE.MathUtils.lerp(paletteColors[idx].r, paletteColors[nextIdx].r, blend) * heightIntensity;
          colorAttr.array[i3 + 1] = THREE.MathUtils.lerp(paletteColors[idx].g, paletteColors[nextIdx].g, blend) * heightIntensity;
          colorAttr.array[i3 + 2] = THREE.MathUtils.lerp(paletteColors[idx].b, paletteColors[nextIdx].b, blend) * heightIntensity;
          
          // Pulsing sizes based on audio and position
          const sizePulse = 1 + Math.sin(time * 3 + phases[i]) * 0.3;
          sizeAttr.array[i] = initialSizes[i] * (sizePulse + audioLevelRef.current * 2 + mouseInf * 0.3);
        }
        
        posAttr.needsUpdate = true;
        colorAttr.needsUpdate = true;
        sizeAttr.needsUpdate = true;
      }
      
      // Gentle camera movement
      camera.position.x = Math.sin(time * 0.1) * 3;
      camera.position.y = 8 + Math.sin(time * 0.15) * 1;
      camera.lookAt(0, 0, 0);
      
      // Animate ambient particles
      const ambientPos = ambientParticles.geometry.attributes.position;
      for (let i = 0; i < ambientCount; i++) {
        const i3 = i * 3;
        ambientPos.array[i3 + 1] += Math.sin(time * 0.5 + i * 0.1) * 0.003;
        ambientPos.array[i3] += Math.cos(time * 0.3 + i * 0.05) * 0.002;
      }
      ambientPos.needsUpdate = true;
      
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Resize handler
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      ambientGeo.dispose();
      ambientMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);
  
  // Mouse tracking
  useEffect(() => {
    const handleMove = (e) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);
  
  // Audio analysis
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
        audioLevelRef.current = level;
        setAudioLevel(level);
        if (onAudioLevelChange) onAudioLevelChange(level);
        audioAnimationRef.current = requestAnimationFrame(analyze);
      };
      
      analyze();
      setIsListening(true);
    } catch (err) {
      console.log('Mic unavailable:', err);
    }
  }, [onAudioLevelChange]);
  
  const stopAudio = useCallback(() => {
    if (audioAnimationRef.current) cancelAnimationFrame(audioAnimationRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    audioLevelRef.current = 0;
    setIsListening(false);
    setAudioLevel(0);
  }, []);
  
  useEffect(() => () => stopAudio(), [stopAudio]);
  
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', background: '#050510' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Audio button */}
      <button
        data-testid="audio-toggle-btn"
        onClick={isListening ? stopAudio : startAudio}
        style={{
          position: 'absolute',
          bottom: 80,
          right: 20,
          zIndex: 1000,
          padding: '12px 24px',
          background: isListening ? 'rgba(255, 23, 68, 0.3)' : 'rgba(0, 212, 255, 0.3)',
          border: `1px solid ${isListening ? '#ff1744' : '#00d4ff'}`,
          borderRadius: 30,
          color: '#fff',
          cursor: 'pointer',
          fontSize: 14,
          backdropFilter: 'blur(10px)',
          fontFamily: 'Inter, sans-serif',
          transition: 'all 0.3s ease',
        }}
      >
        {isListening ? '🎤 Stop Listening' : '🎙️ Enable Audio React'}
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
          fontFamily: 'Inter, sans-serif',
        }}
      >
        AI: {aiState}
      </div>
      
      {/* Audio level indicator */}
      {isListening && (
        <div style={{
          position: 'absolute',
          bottom: 140,
          right: 20,
          zIndex: 1000,
          width: 180,
          height: 8,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${audioLevel * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #00d4ff, #7b2cbf, #e040fb, #ff1744)',
            transition: 'width 0.05s ease',
          }} />
        </div>
      )}
    </div>
  );
};

export default PlasmaField;
