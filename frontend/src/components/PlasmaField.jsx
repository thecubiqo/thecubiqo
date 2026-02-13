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
  
  const [audioLevel, setAudioLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioAnimationRef = useRef(null);
  
  // Color palettes
  const colorPalettes = {
    neutral: ['#00d4ff', '#7b2cbf', '#e040fb', '#ff1744'],
    thinking: ['#00e5ff', '#651fff', '#d500f9', '#ff9100'],
    speaking: ['#00ffc6', '#536dfe', '#f50057', '#ffea00'],
    listening: ['#18ffff', '#7c4dff', '#ff4081', '#ff6e40'],
    error: ['#ff1744', '#d50000', '#ff5252', '#ff8a80']
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
    camera.position.set(0, 5, 12);
    cameraRef.current = camera;
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Particles
    const particleCount = 12000;
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);
    const baseY = new Float32Array(particleCount);
    const initialSizes = new Float32Array(particleCount);
    
    const palette = colorPalettes.neutral.map(c => new THREE.Color(c));
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      positions[i3] = (Math.random() - 0.5) * 20;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = (Math.random() - 0.5) * 15;
      
      phases[i] = Math.random() * Math.PI * 2;
      baseY[i] = (Math.random() - 0.5) * 2;
      initialSizes[i] = Math.random() * 0.08 + 0.02;
      sizes[i] = initialSizes[i];
      
      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Store extra data
    geometry.userData = { phases, baseY, initialSizes };
    
    // Shader material
    const material = new THREE.ShaderMaterial({
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
    
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;
    
    // Ambient particles
    const ambientGeo = new THREE.BufferGeometry();
    const ambientCount = 400;
    const ambientPositions = new Float32Array(ambientCount * 3);
    
    for (let i = 0; i < ambientCount; i++) {
      ambientPositions[i * 3] = (Math.random() - 0.5) * 25;
      ambientPositions[i * 3 + 1] = (Math.random() - 0.5) * 15;
      ambientPositions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    
    ambientGeo.setAttribute('position', new THREE.BufferAttribute(ambientPositions, 3));
    
    const ambientMat = new THREE.PointsMaterial({
      size: 0.03,
      color: '#ff69b4',
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    const ambientParticles = new THREE.Points(ambientGeo, ambientMat);
    scene.add(ambientParticles);
    
    // Animation
    const animate = () => {
      timeRef.current += 0.016;
      const time = timeRef.current;
      
      if (particlesRef.current) {
        const geom = particlesRef.current.geometry;
        const posAttr = geom.attributes.position;
        const colorAttr = geom.attributes.color;
        const sizeAttr = geom.attributes.size;
        const { phases, baseY, initialSizes } = geom.userData;
        
        const currentPalette = colorPalettes[aiState] || colorPalettes.neutral;
        const paletteColors = currentPalette.map(c => new THREE.Color(c));
        const audioMult = 1 + (audioLevelRef.current * 3);
        
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          const x = posAttr.array[i3];
          const z = posAttr.array[i3 + 2];
          
          // Waves
          const wave1 = Math.sin(x * 0.5 + time * 0.8 + phases[i]) * 1.5;
          const wave2 = Math.cos(z * 0.3 + time * 0.6) * 1.2;
          const wave3 = Math.sin((x + z) * 0.2 + time * 1.2) * 0.8;
          
          // Mouse influence
          const dx = x - (mouseRef.current.x * 10);
          const dz = z - (mouseRef.current.y * 7.5);
          const dist = Math.sqrt(dx * dx + dz * dz);
          const mouseInf = Math.max(0, 1 - dist / 4) * 2;
          
          // Y position
          posAttr.array[i3 + 1] = (wave1 + wave2 + wave3) * audioMult + baseY[i] + mouseInf * Math.sin(time * 3 + phases[i]);
          
          // Colors
          const t = (Math.sin(time * 0.5 + x * 0.1 + z * 0.1) * 0.5 + 0.5);
          const idx = Math.floor(t * (paletteColors.length - 1));
          const nextIdx = (idx + 1) % paletteColors.length;
          const blend = (t * (paletteColors.length - 1)) % 1;
          
          colorAttr.array[i3] = THREE.MathUtils.lerp(paletteColors[idx].r, paletteColors[nextIdx].r, blend);
          colorAttr.array[i3 + 1] = THREE.MathUtils.lerp(paletteColors[idx].g, paletteColors[nextIdx].g, blend);
          colorAttr.array[i3 + 2] = THREE.MathUtils.lerp(paletteColors[idx].b, paletteColors[nextIdx].b, blend);
          
          // Sizes
          sizeAttr.array[i] = initialSizes[i] * (1 + audioLevelRef.current * 2 + mouseInf * 0.5);
        }
        
        posAttr.needsUpdate = true;
        colorAttr.needsUpdate = true;
        sizeAttr.needsUpdate = true;
      }
      
      // Rotate camera slowly
      camera.position.x = Math.sin(time * 0.1) * 2;
      camera.lookAt(0, 0, 0);
      
      // Animate ambient particles
      const ambientPos = ambientParticles.geometry.attributes.position;
      for (let i = 0; i < ambientCount; i++) {
        const i3 = i * 3;
        ambientPos.array[i3 + 1] += Math.sin(time + i) * 0.002;
        ambientPos.array[i3] += Math.cos(time * 0.5 + i) * 0.001;
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
      container.removeChild(renderer.domElement);
    };
  }, [aiState]);
  
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
      console.log('Mic unavailable');
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
          fontFamily: 'Inter, sans-serif',
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
          fontFamily: 'Inter, sans-serif',
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
            transition: 'width 0.05s ease',
          }} />
        </div>
      )}
    </div>
  );
};

export default PlasmaField;
