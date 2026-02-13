import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

// High Definition Plasma Field Component - Ribbon Wave Version
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
  
  // Color palettes with smooth gradient
  const colorPalettes = {
    neutral: ['#00e5ff', '#00bcd4', '#2196f3', '#673ab7', '#9c27b0', '#e91e63', '#f44336', '#ff5722'],
    thinking: ['#00e5ff', '#00bcd4', '#651fff', '#7c4dff', '#aa00ff', '#d500f9', '#ff9100', '#ffab00'],
    speaking: ['#00ffc6', '#1de9b6', '#00bcd4', '#536dfe', '#7c4dff', '#e040fb', '#f50057', '#ffea00'],
    listening: ['#18ffff', '#00e5ff', '#2979ff', '#7c4dff', '#aa00ff', '#ff4081', '#ff5722', '#ff6e40'],
    error: ['#ff1744', '#f44336', '#e91e63', '#d50000', '#ff5252', '#ff8a80', '#ff1744', '#d50000']
  };
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#040412');
    sceneRef.current = scene;
    
    // Camera - slightly above looking down at the waves
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.set(0, 8, 18);
    camera.lookAt(0, -1, 0);
    cameraRef.current = camera;
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    const waveLayers = [];
    
    // Create ribbon-structured wave layers
    const createWaveLayer = (config) => {
      const { ribbonCount, particlesPerRibbon, yBase, zBase, amplitude, speed, thickness, opacity } = config;
      const totalParticles = ribbonCount * particlesPerRibbon;
      
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(totalParticles * 3);
      const colors = new Float32Array(totalParticles * 3);
      const sizes = new Float32Array(totalParticles);
      const userData = {
        ribbonData: new Float32Array(totalParticles),
        xProgress: new Float32Array(totalParticles),
        randomOffset: new Float32Array(totalParticles),
        baseY: new Float32Array(totalParticles),
        ribbonCount,
        particlesPerRibbon,
        amplitude,
        speed,
        yBase,
        zBase
      };
      
      const palette = colorPalettes.neutral;
      
      for (let r = 0; r < ribbonCount; r++) {
        const ribbonYOffset = (r / ribbonCount - 0.5) * 6; // Spread ribbons vertically
        const ribbonPhase = r * 0.8; // Phase offset per ribbon
        
        for (let p = 0; p < particlesPerRibbon; p++) {
          const i = r * particlesPerRibbon + p;
          const i3 = i * 3;
          
          // X position - spread across width
          const xProgress = p / particlesPerRibbon;
          const x = (xProgress - 0.5) * 36;
          
          // Add thickness variation within ribbon
          const thicknessVar = (Math.random() - 0.5) * thickness;
          const depthVar = (Math.random() - 0.5) * thickness * 1.5;
          
          positions[i3] = x;
          positions[i3 + 1] = yBase + ribbonYOffset + thicknessVar;
          positions[i3 + 2] = zBase + depthVar;
          
          // Store animation data
          userData.ribbonData[i] = r + ribbonPhase;
          userData.xProgress[i] = xProgress;
          userData.randomOffset[i] = Math.random() * Math.PI * 2;
          userData.baseY[i] = ribbonYOffset + thicknessVar;
          
          // Color based on x position (gradient across)
          const colorIdx = Math.floor(xProgress * (palette.length - 1));
          const colorBlend = (xProgress * (palette.length - 1)) % 1;
          const c1 = new THREE.Color(palette[Math.min(colorIdx, palette.length - 1)]);
          const c2 = new THREE.Color(palette[Math.min(colorIdx + 1, palette.length - 1)]);
          
          colors[i3] = THREE.MathUtils.lerp(c1.r, c2.r, colorBlend);
          colors[i3 + 1] = THREE.MathUtils.lerp(c1.g, c2.g, colorBlend);
          colors[i3 + 2] = THREE.MathUtils.lerp(c1.b, c2.b, colorBlend);
          
          // Size - vary for depth effect
          sizes[i] = 0.06 + Math.random() * 0.06;
        }
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      geometry.userData = userData;
      
      // Refined glow shader
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uOpacity: { value: opacity }
        },
        vertexShader: `
          attribute float size;
          varying vec3 vColor;
          
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (350.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float uOpacity;
          varying vec3 vColor;
          
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            
            // Soft glow with bright center
            float core = 1.0 - smoothstep(0.0, 0.12, dist);
            float innerGlow = exp(-dist * 5.0);
            float outerGlow = exp(-dist * 2.5) * 0.4;
            
            float intensity = core * 0.6 + innerGlow + outerGlow;
            vec3 finalColor = vColor * intensity * 1.3;
            
            // Add white core for brightness
            finalColor += vec3(1.0) * core * 0.3;
            
            gl_FragColor = vec4(finalColor, intensity * uOpacity);
          }
        `,
        transparent: true,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      
      return new THREE.Points(geometry, material);
    };
    
    // Create multiple wave layers with different configurations
    const layerConfigs = [
      // Main prominent waves
      { ribbonCount: 12, particlesPerRibbon: 3000, yBase: 0, zBase: 0, amplitude: 2.5, speed: 1.0, thickness: 0.5, opacity: 0.85 },
      // Back layer - softer
      { ribbonCount: 8, particlesPerRibbon: 2000, yBase: 2, zBase: -6, amplitude: 2.0, speed: 0.7, thickness: 0.6, opacity: 0.45 },
      // Front layer
      { ribbonCount: 6, particlesPerRibbon: 1500, yBase: -2, zBase: 4, amplitude: 1.5, speed: 1.3, thickness: 0.4, opacity: 0.55 },
      // Far background
      { ribbonCount: 5, particlesPerRibbon: 1000, yBase: 4, zBase: -10, amplitude: 1.2, speed: 0.5, thickness: 0.7, opacity: 0.3 },
    ];
    
    layerConfigs.forEach(config => {
      const layer = createWaveLayer(config);
      scene.add(layer);
      waveLayers.push(layer);
    });
    
    waveSystemsRef.current = waveLayers;
    
    // Scattered bokeh particles
    const scatterCount = 1500;
    const scatterGeo = new THREE.BufferGeometry();
    const scatterPos = new Float32Array(scatterCount * 3);
    const scatterColors = new Float32Array(scatterCount * 3);
    const scatterSizes = new Float32Array(scatterCount);
    
    for (let i = 0; i < scatterCount; i++) {
      const i3 = i * 3;
      scatterPos[i3] = (Math.random() - 0.5) * 50;
      scatterPos[i3 + 1] = (Math.random() - 0.5) * 30;
      scatterPos[i3 + 2] = (Math.random() - 0.5) * 40;
      
      // Varied colors
      const colorChoice = Math.random();
      let color;
      if (colorChoice < 0.25) color = new THREE.Color('#00e5ff');
      else if (colorChoice < 0.45) color = new THREE.Color('#7c4dff');
      else if (colorChoice < 0.65) color = new THREE.Color('#e040fb');
      else if (colorChoice < 0.85) color = new THREE.Color('#ff4081');
      else color = new THREE.Color('#ff5722');
      
      scatterColors[i3] = color.r;
      scatterColors[i3 + 1] = color.g;
      scatterColors[i3 + 2] = color.b;
      
      scatterSizes[i] = 0.04 + Math.random() * 0.12;
    }
    
    scatterGeo.setAttribute('position', new THREE.BufferAttribute(scatterPos, 3));
    scatterGeo.setAttribute('color', new THREE.BufferAttribute(scatterColors, 3));
    scatterGeo.setAttribute('size', new THREE.BufferAttribute(scatterSizes, 1));
    
    const scatterMat = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (150.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float glow = exp(-dist * 3.5);
          gl_FragColor = vec4(vColor * 1.1, glow * 0.5);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    const scatterParticles = new THREE.Points(scatterGeo, scatterMat);
    scene.add(scatterParticles);
    
    // Animation
    const animate = () => {
      timeRef.current += 0.01;
      const time = timeRef.current;
      
      const palette = colorPalettes[currentAiStateRef.current] || colorPalettes.neutral;
      const audioMult = 1 + audioLevelRef.current * 2;
      
      // Animate wave layers
      waveSystemsRef.current.forEach((layer) => {
        const geom = layer.geometry;
        const posAttr = geom.attributes.position;
        const colorAttr = geom.attributes.color;
        const { ribbonData, xProgress, randomOffset, baseY, amplitude, speed, yBase } = geom.userData;
        
        for (let i = 0; i < posAttr.count; i++) {
          const i3 = i * 3;
          const x = posAttr.array[i3];
          const ribbon = ribbonData[i];
          const xProg = xProgress[i];
          const randOff = randomOffset[i];
          const bY = baseY[i];
          
          // Complex wave motion
          const wave1 = Math.sin(xProg * Math.PI * 3 + time * speed + ribbon * 0.5) * amplitude;
          const wave2 = Math.cos(xProg * Math.PI * 2 + time * speed * 0.7 + randOff) * amplitude * 0.6;
          const wave3 = Math.sin(xProg * Math.PI * 5 + time * speed * 1.3) * amplitude * 0.3;
          
          // Mouse ripple
          const dx = x - mouseRef.current.x * 18;
          const dz = posAttr.array[i3 + 2] - mouseRef.current.y * 10;
          const mDist = Math.sqrt(dx * dx + dz * dz);
          const mouseWave = Math.max(0, 1 - mDist / 8) * 2 * Math.sin(time * 4 + mDist * 0.4);
          
          // Combined Y
          const y = yBase + bY + (wave1 + wave2 + wave3) * audioMult * 0.5 + mouseWave;
          posAttr.array[i3 + 1] = y;
          
          // Update colors
          const cIdx = Math.floor(xProg * (palette.length - 1));
          const cBlend = (xProg * (palette.length - 1)) % 1;
          const c1 = new THREE.Color(palette[Math.min(cIdx, palette.length - 1)]);
          const c2 = new THREE.Color(palette[Math.min(cIdx + 1, palette.length - 1)]);
          
          const heightBoost = 1 + Math.abs(wave1) * 0.08;
          colorAttr.array[i3] = THREE.MathUtils.lerp(c1.r, c2.r, cBlend) * heightBoost;
          colorAttr.array[i3 + 1] = THREE.MathUtils.lerp(c1.g, c2.g, cBlend) * heightBoost;
          colorAttr.array[i3 + 2] = THREE.MathUtils.lerp(c1.b, c2.b, cBlend) * heightBoost;
        }
        
        posAttr.needsUpdate = true;
        colorAttr.needsUpdate = true;
      });
      
      // Animate scatter
      const sp = scatterParticles.geometry.attributes.position;
      for (let i = 0; i < scatterCount; i++) {
        const i3 = i * 3;
        sp.array[i3 + 1] += Math.sin(time * 0.4 + i * 0.1) * 0.004;
        sp.array[i3] += Math.cos(time * 0.3 + i * 0.05) * 0.002;
      }
      sp.needsUpdate = true;
      
      // Camera sway
      camera.position.x = Math.sin(time * 0.06) * 2;
      camera.position.y = 8 + Math.sin(time * 0.08) * 0.5;
      camera.lookAt(0, -0.5, 0);
      
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
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
      waveLayers.forEach(l => { l.geometry.dispose(); l.material.dispose(); });
      scatterGeo.dispose();
      scatterMat.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
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
        const level = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
        audioLevelRef.current = level;
        setAudioLevel(level);
        if (onAudioLevelChange) onAudioLevelChange(level);
        audioAnimationRef.current = requestAnimationFrame(analyze);
      };
      analyze();
      setIsListening(true);
    } catch (err) { console.log('Mic error:', err); }
  }, [onAudioLevelChange]);
  
  const stopAudio = useCallback(() => {
    if (audioAnimationRef.current) cancelAnimationFrame(audioAnimationRef.current);
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    audioLevelRef.current = 0;
    setIsListening(false);
    setAudioLevel(0);
  }, []);
  
  useEffect(() => () => stopAudio(), [stopAudio]);
  
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', background: '#040412' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      
      <button
        data-testid="audio-toggle-btn"
        onClick={isListening ? stopAudio : startAudio}
        style={{
          position: 'absolute', bottom: 80, right: 20, zIndex: 1000,
          padding: '12px 24px',
          background: isListening ? 'rgba(255, 23, 68, 0.3)' : 'rgba(0, 212, 255, 0.3)',
          border: `1px solid ${isListening ? '#ff1744' : '#00d4ff'}`,
          borderRadius: 30, color: '#fff', cursor: 'pointer', fontSize: 14,
          backdropFilter: 'blur(10px)', fontFamily: 'Inter, sans-serif',
        }}
      >
        {isListening ? '🎤 Stop Listening' : '🎙️ Enable Audio React'}
      </button>
      
      <div
        data-testid="ai-state-indicator"
        style={{
          position: 'absolute', top: 20, left: 20, zIndex: 1000,
          padding: '8px 16px', background: 'rgba(0, 0, 0, 0.6)',
          borderRadius: 20, color: '#fff', fontSize: 12,
          backdropFilter: 'blur(10px)', textTransform: 'uppercase',
          letterSpacing: 2, fontFamily: 'Inter, sans-serif',
        }}
      >
        AI: {aiState}
      </div>
      
      {isListening && (
        <div style={{
          position: 'absolute', bottom: 140, right: 20, zIndex: 1000,
          width: 180, height: 8, background: 'rgba(255,255,255,0.1)',
          borderRadius: 4, overflow: 'hidden',
        }}>
          <div style={{
            width: `${audioLevel * 100}%`, height: '100%',
            background: 'linear-gradient(90deg, #00d4ff, #7b2cbf, #e040fb, #ff1744)',
          }} />
        </div>
      )}
    </div>
  );
};

export default PlasmaField;
