import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

// HD Plasma Field - Flowing Wave Ribbons
const PlasmaField = ({ aiState = 'neutral', onAudioLevelChange }) => {
  const containerRef = useRef(null);
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
  
  useEffect(() => { currentAiStateRef.current = aiState; }, [aiState]);
  
  const colorPalettes = {
    neutral: ['#00ffff', '#00d4ff', '#0099ff', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#ef4444'],
    thinking: ['#00ffff', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#f59e0b', '#f97316', '#ef4444'],
    speaking: ['#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e', '#fbbf24'],
    listening: ['#22d3ee', '#06b6d4', '#3b82f6', '#8b5cf6', '#c026d3', '#ec4899', '#f97316', '#f59e0b'],
    error: ['#f43f5e', '#ef4444', '#dc2626', '#b91c1c', '#f43f5e', '#ec4899', '#ef4444']
  };
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#020208');
    
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 5, 16);
    camera.lookAt(0, 0, 0);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    
    const waveLayers = [];
    
    // Main wave ribbons with high particle density
    const createWaveRibbon = (config) => {
      const { particleCount, yOffset, zOffset, waveAmplitude, waveSpeed, spread, brightness } = config;
      
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      
      const ribbonCount = 15;
      const perRibbon = Math.floor(particleCount / ribbonCount);
      const palette = colorPalettes.neutral;
      
      const userData = {
        wavePhase: new Float32Array(particleCount),
        ribbonId: new Float32Array(particleCount),
        xNorm: new Float32Array(particleCount),
        localY: new Float32Array(particleCount),
        waveAmplitude, waveSpeed, yOffset
      };
      
      for (let r = 0; r < ribbonCount; r++) {
        const ribbonY = (r / (ribbonCount - 1) - 0.5) * spread;
        
        for (let p = 0; p < perRibbon; p++) {
          const i = r * perRibbon + p;
          if (i >= particleCount) break;
          const i3 = i * 3;
          
          const xNorm = p / perRibbon;
          const x = (xNorm - 0.5) * 40;
          
          // Ribbon thickness
          const thickness = 0.3 + Math.random() * 0.4;
          const yVar = (Math.random() - 0.5) * thickness;
          const zVar = (Math.random() - 0.5) * thickness * 2;
          
          positions[i3] = x;
          positions[i3 + 1] = yOffset + ribbonY + yVar;
          positions[i3 + 2] = zOffset + zVar;
          
          userData.wavePhase[i] = xNorm * Math.PI * 4 + r * 0.6 + Math.random() * 0.5;
          userData.ribbonId[i] = r;
          userData.xNorm[i] = xNorm;
          userData.localY[i] = ribbonY + yVar;
          
          // Color gradient left to right
          const cIdx = Math.min(Math.floor(xNorm * (palette.length - 1)), palette.length - 2);
          const cBlend = (xNorm * (palette.length - 1)) % 1;
          const c1 = new THREE.Color(palette[cIdx]);
          const c2 = new THREE.Color(palette[cIdx + 1]);
          
          colors[i3] = THREE.MathUtils.lerp(c1.r, c2.r, cBlend);
          colors[i3 + 1] = THREE.MathUtils.lerp(c1.g, c2.g, cBlend);
          colors[i3 + 2] = THREE.MathUtils.lerp(c1.b, c2.b, cBlend);
          
          // Larger particles near peaks
          sizes[i] = 0.07 + Math.random() * 0.05;
        }
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      geometry.userData = userData;
      
      const material = new THREE.ShaderMaterial({
        uniforms: { uBrightness: { value: brightness } },
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
          uniform float uBrightness;
          varying vec3 vColor;
          varying float vSize;
          void main() {
            vec2 uv = gl_PointCoord - vec2(0.5);
            float dist = length(uv);
            if (dist > 0.5) discard;
            
            // Bright glowing particles
            float core = 1.0 - smoothstep(0.0, 0.1, dist);
            float innerGlow = exp(-dist * 6.0);
            float midGlow = exp(-dist * 3.0) * 0.7;
            float outerGlow = exp(-dist * 1.5) * 0.3;
            
            float glow = core + innerGlow + midGlow + outerGlow;
            
            vec3 brightColor = vColor * uBrightness;
            vec3 whiteCore = vec3(1.0) * core * 0.5;
            
            gl_FragColor = vec4(brightColor * glow + whiteCore, glow * 0.9);
          }
        `,
        transparent: true,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      
      return new THREE.Points(geometry, material);
    };
    
    // Multiple wave layers for depth
    const layerConfigs = [
      { particleCount: 50000, yOffset: 0, zOffset: 0, waveAmplitude: 3.0, waveSpeed: 1.0, spread: 8, brightness: 1.4 },
      { particleCount: 30000, yOffset: 3, zOffset: -5, waveAmplitude: 2.2, waveSpeed: 0.7, spread: 6, brightness: 0.8 },
      { particleCount: 25000, yOffset: -2, zOffset: 3, waveAmplitude: 1.8, waveSpeed: 1.2, spread: 5, brightness: 0.9 },
      { particleCount: 15000, yOffset: 5, zOffset: -8, waveAmplitude: 1.5, waveSpeed: 0.5, spread: 4, brightness: 0.5 },
    ];
    
    layerConfigs.forEach(cfg => {
      const layer = createWaveRibbon(cfg);
      scene.add(layer);
      waveLayers.push(layer);
    });
    
    waveSystemsRef.current = waveLayers;
    
    // Floating particles (bokeh)
    const floatCount = 2000;
    const floatGeo = new THREE.BufferGeometry();
    const floatPos = new Float32Array(floatCount * 3);
    const floatCol = new Float32Array(floatCount * 3);
    const floatSizes = new Float32Array(floatCount);
    
    for (let i = 0; i < floatCount; i++) {
      const i3 = i * 3;
      floatPos[i3] = (Math.random() - 0.5) * 60;
      floatPos[i3 + 1] = (Math.random() - 0.5) * 35;
      floatPos[i3 + 2] = (Math.random() - 0.5) * 50;
      
      const palette = colorPalettes.neutral;
      const c = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
      floatCol[i3] = c.r; floatCol[i3 + 1] = c.g; floatCol[i3 + 2] = c.b;
      floatSizes[i] = 0.03 + Math.random() * 0.15;
    }
    
    floatGeo.setAttribute('position', new THREE.BufferAttribute(floatPos, 3));
    floatGeo.setAttribute('color', new THREE.BufferAttribute(floatCol, 3));
    floatGeo.setAttribute('size', new THREE.BufferAttribute(floatSizes, 1));
    
    const floatMat = new THREE.ShaderMaterial({
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
          float glow = exp(-dist * 4.0);
          gl_FragColor = vec4(vColor * 1.2, glow * 0.6);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    const floatParticles = new THREE.Points(floatGeo, floatMat);
    scene.add(floatParticles);
    
    // Animation
    const animate = () => {
      timeRef.current += 0.008;
      const time = timeRef.current;
      const palette = colorPalettes[currentAiStateRef.current] || colorPalettes.neutral;
      const audioMult = 1 + audioLevelRef.current * 2.5;
      
      waveSystemsRef.current.forEach((layer) => {
        const geom = layer.geometry;
        const posAttr = geom.attributes.position;
        const colorAttr = geom.attributes.color;
        const sizeAttr = geom.attributes.size;
        const { wavePhase, xNorm, localY, waveAmplitude, waveSpeed, yOffset } = geom.userData;
        
        for (let i = 0; i < posAttr.count; i++) {
          const i3 = i * 3;
          const x = posAttr.array[i3];
          const phase = wavePhase[i];
          const xN = xNorm[i];
          const ly = localY[i];
          
          // Multi-frequency waves for organic motion
          const w1 = Math.sin(phase + time * waveSpeed) * waveAmplitude;
          const w2 = Math.sin(phase * 0.6 + time * waveSpeed * 0.8) * waveAmplitude * 0.5;
          const w3 = Math.cos(phase * 0.4 + time * waveSpeed * 1.2) * waveAmplitude * 0.3;
          const w4 = Math.sin(xN * Math.PI * 2 + time * waveSpeed * 0.5) * waveAmplitude * 0.4;
          
          // Mouse ripple
          const mx = x - mouseRef.current.x * 20;
          const mz = posAttr.array[i3 + 2] - mouseRef.current.y * 12;
          const mDist = Math.sqrt(mx * mx + mz * mz);
          const mouseRipple = Math.max(0, 1 - mDist / 10) * 3 * Math.sin(time * 5 + mDist * 0.3);
          
          posAttr.array[i3 + 1] = yOffset + ly + (w1 + w2 + w3 + w4) * audioMult * 0.35 + mouseRipple;
          
          // Dynamic colors
          const cIdx = Math.min(Math.floor(xN * (palette.length - 1)), palette.length - 2);
          const cBlend = (xN * (palette.length - 1)) % 1;
          const c1 = new THREE.Color(palette[cIdx]);
          const c2 = new THREE.Color(palette[cIdx + 1]);
          
          const heightBoost = 1 + Math.abs(w1) * 0.15;
          colorAttr.array[i3] = THREE.MathUtils.lerp(c1.r, c2.r, cBlend) * heightBoost;
          colorAttr.array[i3 + 1] = THREE.MathUtils.lerp(c1.g, c2.g, cBlend) * heightBoost;
          colorAttr.array[i3 + 2] = THREE.MathUtils.lerp(c1.b, c2.b, cBlend) * heightBoost;
          
          // Pulsing size
          sizeAttr.array[i] = (0.07 + Math.random() * 0.03) * (1 + audioLevelRef.current * 0.5 + Math.abs(w1) * 0.05);
        }
        
        posAttr.needsUpdate = true;
        colorAttr.needsUpdate = true;
        sizeAttr.needsUpdate = true;
      });
      
      // Float animation
      const fp = floatParticles.geometry.attributes.position;
      for (let i = 0; i < floatCount; i++) {
        const i3 = i * 3;
        fp.array[i3 + 1] += Math.sin(time * 0.3 + i * 0.1) * 0.005;
        fp.array[i3] += Math.cos(time * 0.25 + i * 0.05) * 0.003;
      }
      fp.needsUpdate = true;
      
      // Camera
      camera.position.x = Math.sin(time * 0.05) * 2;
      camera.position.y = 5 + Math.sin(time * 0.07) * 0.5;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    const handleResize = () => {
      const w = container.clientWidth, h = container.clientHeight;
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
      floatGeo.dispose(); floatMat.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  useEffect(() => {
    const handleMove = (e) => {
      mouseRef.current = { x: (e.clientX / window.innerWidth) * 2 - 1, y: -(e.clientY / window.innerHeight) * 2 + 1 };
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);
  
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
    audioLevelRef.current = 0; setIsListening(false); setAudioLevel(0);
  }, []);
  
  useEffect(() => () => stopAudio(), [stopAudio]);
  
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', background: '#020208' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default PlasmaField;
