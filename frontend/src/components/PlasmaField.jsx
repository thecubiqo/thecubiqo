import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

// High Definition Plasma Field Component
const PlasmaField = ({ aiState = 'neutral', onAudioLevelChange }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const waveSystemsRef = useRef([]);
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
  
  useEffect(() => {
    currentAiStateRef.current = aiState;
  }, [aiState]);
  
  // Enhanced color palettes with gradient positions
  const colorPalettes = {
    neutral: {
      colors: ['#00d4ff', '#0099ff', '#7b2cbf', '#9c27b0', '#e040fb', '#ff1744', '#ff4081'],
      positions: [0, 0.15, 0.35, 0.5, 0.65, 0.85, 1]
    },
    thinking: {
      colors: ['#00e5ff', '#00bcd4', '#651fff', '#7c4dff', '#d500f9', '#ff9100', '#ffab00'],
      positions: [0, 0.15, 0.35, 0.5, 0.65, 0.85, 1]
    },
    speaking: {
      colors: ['#00ffc6', '#1de9b6', '#536dfe', '#7c4dff', '#f50057', '#ff5722', '#ffea00'],
      positions: [0, 0.15, 0.35, 0.5, 0.65, 0.85, 1]
    },
    listening: {
      colors: ['#18ffff', '#00e5ff', '#7c4dff', '#aa00ff', '#ff4081', '#ff6e40', '#ea80fc'],
      positions: [0, 0.15, 0.35, 0.5, 0.65, 0.85, 1]
    },
    error: {
      colors: ['#ff1744', '#d50000', '#ff5252', '#ff8a80', '#f44336', '#e91e63', '#ff1744'],
      positions: [0, 0.15, 0.35, 0.5, 0.65, 0.85, 1]
    }
  };
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030308');
    sceneRef.current = scene;
    
    // Camera
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    camera.position.set(0, 6, 14);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // High-quality renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Create multiple wave layers for depth
    const waveLayers = [];
    
    // Layer configurations [particleCount, yOffset, zOffset, amplitude, speed, opacity]
    const layerConfigs = [
      { count: 35000, yOffset: 0, zOffset: 0, amplitude: 1.0, speed: 1.0, opacity: 1.0 },      // Main wave
      { count: 25000, yOffset: 2, zOffset: -3, amplitude: 0.7, speed: 0.8, opacity: 0.6 },    // Back wave
      { count: 20000, yOffset: -1.5, zOffset: 2, amplitude: 0.5, speed: 1.2, opacity: 0.5 },  // Front wave
      { count: 15000, yOffset: 3.5, zOffset: -5, amplitude: 0.4, speed: 0.6, opacity: 0.35 }, // Far back
    ];
    
    layerConfigs.forEach((config, layerIndex) => {
      const geometry = new THREE.BufferGeometry();
      const { count, yOffset, zOffset, amplitude, speed, opacity } = config;
      
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const sizes = new Float32Array(count);
      const wavePhases = new Float32Array(count);
      const ribbonIndex = new Float32Array(count);
      const particleDepth = new Float32Array(count);
      
      const palette = colorPalettes.neutral;
      
      // Create ribbon-like wave structures
      const ribbonCount = 8 + layerIndex * 2;
      const particlesPerRibbon = Math.floor(count / ribbonCount);
      
      for (let ribbon = 0; ribbon < ribbonCount; ribbon++) {
        const ribbonYBase = (ribbon / ribbonCount - 0.5) * 4 + yOffset;
        
        for (let p = 0; p < particlesPerRibbon; p++) {
          const i = ribbon * particlesPerRibbon + p;
          if (i >= count) break;
          
          const i3 = i * 3;
          
          // X position spread across the wave
          const xProgress = p / particlesPerRibbon;
          const x = (xProgress - 0.5) * 32;
          
          // Add variation to create thickness
          const ribbonThickness = 0.4 + Math.random() * 0.6;
          const yVariation = (Math.random() - 0.5) * ribbonThickness;
          const zVariation = (Math.random() - 0.5) * ribbonThickness * 2;
          
          positions[i3] = x;
          positions[i3 + 1] = ribbonYBase + yVariation;
          positions[i3 + 2] = zOffset + zVariation + (Math.random() - 0.5) * 3;
          
          // Store ribbon data for animation
          wavePhases[i] = xProgress * Math.PI * 4 + ribbon * 0.5;
          ribbonIndex[i] = ribbon / ribbonCount;
          particleDepth[i] = Math.random();
          
          // Color based on x position (gradient from blue to purple to red)
          const colorProgress = xProgress;
          const colorIdx = Math.min(Math.floor(colorProgress * (palette.colors.length - 1)), palette.colors.length - 2);
          const colorBlend = (colorProgress * (palette.colors.length - 1)) % 1;
          
          const color1 = new THREE.Color(palette.colors[colorIdx]);
          const color2 = new THREE.Color(palette.colors[colorIdx + 1]);
          
          colors[i3] = THREE.MathUtils.lerp(color1.r, color2.r, colorBlend);
          colors[i3 + 1] = THREE.MathUtils.lerp(color1.g, color2.g, colorBlend);
          colors[i3 + 2] = THREE.MathUtils.lerp(color1.b, color2.b, colorBlend);
          
          // Size variation - smaller particles at edges, larger in center
          const centerProximity = 1 - Math.abs(xProgress - 0.5) * 2;
          sizes[i] = (0.04 + Math.random() * 0.08 + centerProximity * 0.04) * (layerIndex === 0 ? 1 : 0.7);
        }
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      
      geometry.userData = { wavePhases, ribbonIndex, particleDepth, amplitude, speed, yOffset, zOffset, opacity };
      
      // Enhanced shader for HD glow effect
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          opacity: { value: opacity },
        },
        vertexShader: `
          attribute float size;
          varying vec3 vColor;
          varying float vSize;
          varying float vDist;
          
          void main() {
            vColor = color;
            vSize = size;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vDist = -mvPosition.z;
            gl_PointSize = size * (450.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float opacity;
          varying vec3 vColor;
          varying float vSize;
          varying float vDist;
          
          void main() {
            vec2 center = gl_PointCoord - vec2(0.5);
            float dist = length(center);
            
            if (dist > 0.5) discard;
            
            // Multi-layer glow for HD effect
            float innerCore = 1.0 - smoothstep(0.0, 0.08, dist);
            float midGlow = exp(-dist * 6.0);
            float outerGlow = exp(-dist * 3.0) * 0.6;
            float softEdge = exp(-dist * 1.5) * 0.3;
            
            float totalGlow = innerCore + midGlow + outerGlow + softEdge;
            
            // Brighten colors for bloom effect
            vec3 brightColor = vColor * 1.4;
            vec3 coreColor = vec3(1.0, 1.0, 1.0) * innerCore * 0.5;
            vec3 finalColor = brightColor * (midGlow + outerGlow + softEdge) + coreColor;
            
            float alpha = totalGlow * opacity * 0.95;
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        transparent: true,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      
      const points = new THREE.Points(geometry, material);
      scene.add(points);
      waveLayers.push({ points, config });
    });
    
    waveSystemsRef.current = waveLayers;
    
    // Scattered ambient particles (bokeh effect)
    const scatterCount = 2000;
    const scatterGeo = new THREE.BufferGeometry();
    const scatterPositions = new Float32Array(scatterCount * 3);
    const scatterColors = new Float32Array(scatterCount * 3);
    const scatterSizes = new Float32Array(scatterCount);
    
    for (let i = 0; i < scatterCount; i++) {
      const i3 = i * 3;
      scatterPositions[i3] = (Math.random() - 0.5) * 50;
      scatterPositions[i3 + 1] = (Math.random() - 0.5) * 30;
      scatterPositions[i3 + 2] = (Math.random() - 0.5) * 40;
      
      // Random colors from palette
      const colorChoice = Math.random();
      let color;
      if (colorChoice < 0.3) color = new THREE.Color('#00d4ff');
      else if (colorChoice < 0.5) color = new THREE.Color('#7b2cbf');
      else if (colorChoice < 0.7) color = new THREE.Color('#e040fb');
      else if (colorChoice < 0.85) color = new THREE.Color('#ff1744');
      else color = new THREE.Color('#ff69b4');
      
      scatterColors[i3] = color.r;
      scatterColors[i3 + 1] = color.g;
      scatterColors[i3 + 2] = color.b;
      
      // Varied sizes for bokeh
      scatterSizes[i] = Math.random() * 0.15 + 0.03;
    }
    
    scatterGeo.setAttribute('position', new THREE.BufferAttribute(scatterPositions, 3));
    scatterGeo.setAttribute('color', new THREE.BufferAttribute(scatterColors, 3));
    scatterGeo.setAttribute('size', new THREE.BufferAttribute(scatterSizes, 1));
    
    const scatterMat = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (200.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float glow = exp(-dist * 4.0);
          float alpha = glow * 0.5;
          
          gl_FragColor = vec4(vColor * 1.2, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    const scatterParticles = new THREE.Points(scatterGeo, scatterMat);
    scene.add(scatterParticles);
    
    // Animation loop
    const animate = () => {
      timeRef.current += 0.012;
      const time = timeRef.current;
      
      const currentPalette = colorPalettes[currentAiStateRef.current] || colorPalettes.neutral;
      const audioMult = 1 + (audioLevelRef.current * 2);
      
      // Animate each wave layer
      waveSystemsRef.current.forEach(({ points, config }) => {
        const geom = points.geometry;
        const posAttr = geom.attributes.position;
        const colorAttr = geom.attributes.color;
        const sizeAttr = geom.attributes.size;
        const { wavePhases, ribbonIndex, particleDepth, amplitude, speed, yOffset } = geom.userData;
        
        const count = posAttr.count;
        
        for (let i = 0; i < count; i++) {
          const i3 = i * 3;
          const x = posAttr.array[i3];
          const xProgress = (x / 32) + 0.5;
          
          // Complex wave function for realistic flow
          const phase = wavePhases[i];
          const ribbon = ribbonIndex[i];
          const depth = particleDepth[i];
          
          // Multiple sine waves combined for organic movement
          const wave1 = Math.sin(phase + time * speed * 0.8) * 2.0;
          const wave2 = Math.sin(phase * 0.5 + time * speed * 0.5 + ribbon * Math.PI) * 1.5;
          const wave3 = Math.cos(phase * 0.3 + time * speed * 0.3) * 1.0;
          const wave4 = Math.sin(x * 0.2 + time * speed * 0.6) * 0.8;
          
          // Mouse influence
          const dx = x - (mouseRef.current.x * 16);
          const dz = posAttr.array[i3 + 2] - (mouseRef.current.y * 10);
          const mouseDist = Math.sqrt(dx * dx + dz * dz);
          const mouseInf = Math.max(0, 1 - mouseDist / 8) * 3 * Math.sin(time * 4 + mouseDist * 0.3);
          
          // Combined Y position
          const y = yOffset + (wave1 + wave2 + wave3 + wave4) * amplitude * audioMult * 0.4 + mouseInf + depth * 0.3;
          posAttr.array[i3 + 1] = y;
          
          // Dynamic colors based on position and state
          const colorIdx = Math.min(Math.floor(xProgress * (currentPalette.colors.length - 1)), currentPalette.colors.length - 2);
          const colorBlend = (xProgress * (currentPalette.colors.length - 1)) % 1;
          
          const c1 = new THREE.Color(currentPalette.colors[colorIdx]);
          const c2 = new THREE.Color(currentPalette.colors[colorIdx + 1]);
          
          // Add intensity based on wave height
          const heightIntensity = 1 + Math.abs(wave1 + wave2) * 0.1;
          
          colorAttr.array[i3] = THREE.MathUtils.lerp(c1.r, c2.r, colorBlend) * heightIntensity;
          colorAttr.array[i3 + 1] = THREE.MathUtils.lerp(c1.g, c2.g, colorBlend) * heightIntensity;
          colorAttr.array[i3 + 2] = THREE.MathUtils.lerp(c1.b, c2.b, colorBlend) * heightIntensity;
          
          // Pulsing sizes
          const sizePulse = 1 + Math.sin(time * 2 + phase) * 0.2 + audioLevelRef.current * 0.5;
          sizeAttr.array[i] *= 0.99;
          sizeAttr.array[i] = Math.max(sizeAttr.array[i], 0.02) * sizePulse;
        }
        
        posAttr.needsUpdate = true;
        colorAttr.needsUpdate = true;
        sizeAttr.needsUpdate = true;
      });
      
      // Animate scatter particles
      const scatterPos = scatterParticles.geometry.attributes.position;
      for (let i = 0; i < scatterCount; i++) {
        const i3 = i * 3;
        scatterPos.array[i3 + 1] += Math.sin(time * 0.3 + i * 0.1) * 0.005;
        scatterPos.array[i3] += Math.cos(time * 0.2 + i * 0.05) * 0.003;
      }
      scatterPos.needsUpdate = true;
      
      // Smooth camera movement
      camera.position.x = Math.sin(time * 0.08) * 2.5;
      camera.position.y = 6 + Math.sin(time * 0.1) * 0.8;
      camera.lookAt(0, 0.5, 0);
      
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
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      waveLayers.forEach(({ points }) => {
        points.geometry.dispose();
        points.material.dispose();
      });
      scatterGeo.dispose();
      scatterMat.dispose();
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
    <div style={{ width: '100%', height: '100vh', position: 'relative', background: '#030308' }}>
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
          zIndex: 1000,
          padding: '8px 16px',
          background: 'rgba(0, 0, 0, 0.6)',
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
