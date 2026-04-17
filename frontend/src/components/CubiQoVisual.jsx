import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

/**
 * CubiQo AI Visual Component
 * 
 * A standalone Three.js component for the CubiQo app that:
 * 1. Shows plasma waves with orange soul nodes (default state)
 * 2. Morphs into a glowing plasma cube when enabled
 * 
 * Props:
 * - isEnabled: boolean - When true, morphs from waves to cube
 * - aiState: 'neutral' | 'thinking' | 'speaking' | 'listening' | 'error'
 * - onAudioLevelChange: (level: number) => void
 * - width: number (optional, defaults to container)
 * - height: number (optional, defaults to container)
 */
const CubiQoVisual = ({ 
  isEnabled = false, 
  aiState = 'neutral',
  onAudioLevelChange,
  width,
  height 
}) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const particlesRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);
  const morphProgressRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const audioLevelRef = useRef(0);
  
  // Store state refs for animation access
  const isEnabledRef = useRef(isEnabled);
  const aiStateRef = useRef(aiState);
  
  useEffect(() => { isEnabledRef.current = isEnabled; }, [isEnabled]);
  useEffect(() => { aiStateRef.current = aiState; }, [aiState]);
  
  // Color palettes
  const colorPalettes = {
    neutral: ['#00ffff', '#00d4ff', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'],
    thinking: ['#00ffff', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#f59e0b', '#f97316'],
    speaking: ['#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#fbbf24'],
    listening: ['#22d3ee', '#06b6d4', '#3b82f6', '#8b5cf6', '#c026d3', '#ec4899', '#f97316'],
    error: ['#f43f5e', '#ef4444', '#dc2626', '#b91c1c', '#ec4899']
  };
  
  const orangeSoulColor = new THREE.Color('#ff6b35');
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const w = width || container.clientWidth;
    const h = height || container.clientHeight;
    
    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Camera
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    camera.position.set(0, 5, 14);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      premultipliedAlpha: false
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Create unified particle system for both states
    const particleCount = 50000;
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    // Store both wave and cube target positions
    const wavePositions = new Float32Array(particleCount * 3);
    const cubePositions = new Float32Array(particleCount * 3);
    const phases = new Float32Array(particleCount);
    const ribbonIndex = new Float32Array(particleCount);
    const isSoulNode = new Float32Array(particleCount);
    
    const palette = colorPalettes.neutral;
    const cubeSize = 3;
    const half = cubeSize / 2;
    
    // Cube vertices and edges for target positions
    const cubeVertices = [
      [-half, -half, -half], [half, -half, -half], [half, half, -half], [-half, half, -half],
      [-half, -half, half], [half, -half, half], [half, half, half], [-half, half, half]
    ];
    const cubeEdges = [[0,1], [1,2], [2,3], [3,0], [4,5], [5,6], [6,7], [7,4], [0,4], [1,5], [2,6], [3,7]];
    const cubeFaces = [[0,1,2,3], [4,5,6,7], [0,1,5,4], [2,3,7,6], [0,3,7,4], [1,2,6,5]];
    
    // Create particles
    const ribbonCount = 15;
    const perRibbon = Math.floor(particleCount * 0.85 / ribbonCount);
    const soulNodeCount = Math.floor(particleCount * 0.1);
    const cubeEdgeCount = Math.floor(particleCount * 0.05);
    
    let idx = 0;
    
    // Wave ribbons (main particles)
    for (let r = 0; r < ribbonCount && idx < particleCount - soulNodeCount; r++) {
      const ribbonY = (r / (ribbonCount - 1) - 0.5) * 8;
      
      for (let p = 0; p < perRibbon && idx < particleCount - soulNodeCount; p++) {
        const i3 = idx * 3;
        
        const xNorm = p / perRibbon;
        const x = (xNorm - 0.5) * 25;
        const thickness = 0.3 + Math.random() * 0.3;
        const yVar = (Math.random() - 0.5) * thickness;
        const zVar = (Math.random() - 0.5) * thickness * 2;
        
        // Wave position
        wavePositions[i3] = x;
        wavePositions[i3 + 1] = ribbonY + yVar;
        wavePositions[i3 + 2] = zVar;
        
        // Cube target position (on surface or inside)
        const isEdge = Math.random() < 0.2;
        if (isEdge) {
          // Edge particle
          const edgeIdx = Math.floor(Math.random() * cubeEdges.length);
          const edge = cubeEdges[edgeIdx];
          const t = Math.random();
          const v1 = cubeVertices[edge[0]];
          const v2 = cubeVertices[edge[1]];
          cubePositions[i3] = v1[0] + (v2[0] - v1[0]) * t + (Math.random() - 0.5) * 0.1;
          cubePositions[i3 + 1] = v1[1] + (v2[1] - v1[1]) * t + (Math.random() - 0.5) * 0.1;
          cubePositions[i3 + 2] = v1[2] + (v2[2] - v1[2]) * t + (Math.random() - 0.5) * 0.1;
        } else {
          // Face particle
          const faceIdx = Math.floor(Math.random() * cubeFaces.length);
          const face = cubeFaces[faceIdx];
          const u = Math.random(), v = Math.random();
          const v0 = cubeVertices[face[0]], v1 = cubeVertices[face[1]];
          const v2 = cubeVertices[face[2]], v3 = cubeVertices[face[3]];
          const inset = 0.9 + Math.random() * 0.2;
          cubePositions[i3] = ((1-u)*(1-v)*v0[0] + u*(1-v)*v1[0] + u*v*v2[0] + (1-u)*v*v3[0]) * inset;
          cubePositions[i3 + 1] = ((1-u)*(1-v)*v0[1] + u*(1-v)*v1[1] + u*v*v2[1] + (1-u)*v*v3[1]) * inset;
          cubePositions[i3 + 2] = ((1-u)*(1-v)*v0[2] + u*(1-v)*v1[2] + u*v*v2[2] + (1-u)*v*v3[2]) * inset;
        }
        
        // Initial position = wave
        positions[i3] = wavePositions[i3];
        positions[i3 + 1] = wavePositions[i3 + 1];
        positions[i3 + 2] = wavePositions[i3 + 2];
        
        // Color based on x position
        const cIdx = Math.min(Math.floor(xNorm * (palette.length - 1)), palette.length - 2);
        const cBlend = (xNorm * (palette.length - 1)) % 1;
        const c1 = new THREE.Color(palette[cIdx]);
        const c2 = new THREE.Color(palette[cIdx + 1]);
        colors[i3] = THREE.MathUtils.lerp(c1.r, c2.r, cBlend);
        colors[i3 + 1] = THREE.MathUtils.lerp(c1.g, c2.g, cBlend);
        colors[i3 + 2] = THREE.MathUtils.lerp(c1.b, c2.b, cBlend);
        
        sizes[idx] = 0.06 + Math.random() * 0.04;
        phases[idx] = xNorm * Math.PI * 4 + r * 0.5 + Math.random() * 0.5;
        ribbonIndex[idx] = r;
        isSoulNode[idx] = 0;
        
        idx++;
      }
    }
    
    // Orange soul nodes (scattered in both states)
    for (let i = 0; i < soulNodeCount && idx < particleCount; i++) {
      const i3 = idx * 3;
      
      // Wave position - scattered among waves
      wavePositions[i3] = (Math.random() - 0.5) * 20;
      wavePositions[i3 + 1] = (Math.random() - 0.5) * 6;
      wavePositions[i3 + 2] = (Math.random() - 0.5) * 4;
      
      // Cube position - inside the cube
      cubePositions[i3] = (Math.random() - 0.5) * cubeSize * 0.7;
      cubePositions[i3 + 1] = (Math.random() - 0.5) * cubeSize * 0.7;
      cubePositions[i3 + 2] = (Math.random() - 0.5) * cubeSize * 0.7;
      
      // Initial position
      positions[i3] = wavePositions[i3];
      positions[i3 + 1] = wavePositions[i3 + 1];
      positions[i3 + 2] = wavePositions[i3 + 2];
      
      // Orange color
      colors[i3] = orangeSoulColor.r;
      colors[i3 + 1] = orangeSoulColor.g;
      colors[i3 + 2] = orangeSoulColor.b;
      
      sizes[idx] = 0.08 + Math.random() * 0.06;
      phases[idx] = Math.random() * Math.PI * 2;
      ribbonIndex[idx] = -1;
      isSoulNode[idx] = 1;
      
      idx++;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.userData = { wavePositions, cubePositions, phases, ribbonIndex, isSoulNode };
    
    // Shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uMorph: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        uniform float uMorph;
        varying vec3 vColor;
        varying float vMorph;
        
        void main() {
          vColor = color;
          vMorph = uMorph;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (350.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vMorph;
        
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float dist = length(uv);
          if (dist > 0.5) discard;
          
          // Soft glow with bright center
          float core = 1.0 - smoothstep(0.0, 0.12, dist);
          float innerGlow = exp(-dist * 5.0);
          float outerGlow = exp(-dist * 2.5) * 0.5;
          
          float intensity = core * 0.5 + innerGlow + outerGlow;
          vec3 finalColor = vColor * intensity * 1.4;
          finalColor += vec3(1.0) * core * 0.3;
          
          gl_FragColor = vec4(finalColor, intensity * 0.9);
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
    
    // Animation loop
    const animate = () => {
      timeRef.current += 0.012;
      const time = timeRef.current;
      
      // Smooth morph transition
      const targetMorph = isEnabledRef.current ? 1 : 0;
      morphProgressRef.current += (targetMorph - morphProgressRef.current) * 0.08;
      const morph = morphProgressRef.current;
      
      const currentPaletteStrings = colorPalettes[aiStateRef.current] || colorPalettes.neutral;
      // Pre-parse colors to avoid creating 100k objects per frame
      const currentPalette = currentPaletteStrings.map(c => new THREE.Color(c));
      
      const audioMult = 1 + audioLevelRef.current * 2;
      
      if (particlesRef.current) {
        const geom = particlesRef.current.geometry;
        const posAttr = geom.attributes.position;
        const colorAttr = geom.attributes.color;
        const { wavePositions, cubePositions, phases, ribbonIndex, isSoulNode } = geom.userData;
        
        // Update material uniform
        particlesRef.current.material.uniforms.uMorph.value = morph;
        
        for (let i = 0; i < posAttr.count; i++) {
          const i3 = i * 3;
          const phase = phases[i];
          const ribbon = ribbonIndex[i];
          const isSoul = isSoulNode[i];
          
          // Wave animation
          let waveX = wavePositions[i3];
          let waveY = wavePositions[i3 + 1];
          let waveZ = wavePositions[i3 + 2];
          
          if (ribbon >= 0) {
            // Ribbon wave motion
            const xNorm = (waveX / 25) + 0.5;
            const wave1 = Math.sin(phase + time * 0.8) * 2.5;
            const wave2 = Math.sin(phase * 0.5 + time * 0.6) * 1.5;
            const wave3 = Math.cos(phase * 0.3 + time * 1.0) * 1.0;
            
            // Mouse influence on waves
            const dx = waveX - mouseRef.current.x * 12;
            const dz = waveZ - mouseRef.current.y * 8;
            const mDist = Math.sqrt(dx * dx + dz * dz);
            const mouseWave = Math.max(0, 1 - mDist / 8) * 2 * Math.sin(time * 4 + mDist * 0.3);
            
            waveY = wavePositions[i3 + 1] + (wave1 + wave2 + wave3) * audioMult * 0.4 + mouseWave;
          } else if (isSoul > 0) {
            // Soul node floating
            waveX = wavePositions[i3] + Math.sin(time * 0.5 + phase) * 0.5;
            waveY = wavePositions[i3 + 1] + Math.cos(time * 0.3 + phase) * 0.4;
            waveZ = wavePositions[i3 + 2] + Math.sin(time * 0.4 + phase) * 0.3;
          }
          
          // Cube animation
          let cubeX = cubePositions[i3];
          let cubeY = cubePositions[i3 + 1];
          let cubeZ = cubePositions[i3 + 2];
          
          if (isSoul > 0) {
            // Soul nodes swirl inside cube
            cubeX = cubePositions[i3] + Math.sin(time + phase) * 0.3;
            cubeY = cubePositions[i3 + 1] + Math.cos(time * 0.8 + phase) * 0.25;
            cubeZ = cubePositions[i3 + 2] + Math.sin(time * 0.6 + phase) * 0.3;
          } else {
            // Cube surface pulsing
            const pulse = Math.sin(time * 2 + phase) * 0.05;
            cubeX *= (1 + pulse);
            cubeY *= (1 + pulse);
            cubeZ *= (1 + pulse);
          }
          
          // Interpolate between wave and cube positions
          posAttr.array[i3] = THREE.MathUtils.lerp(waveX, cubeX, morph);
          posAttr.array[i3 + 1] = THREE.MathUtils.lerp(waveY, cubeY, morph);
          posAttr.array[i3 + 2] = THREE.MathUtils.lerp(waveZ, cubeZ, morph);
          
          // Update colors (except soul nodes)
          if (isSoul === 0 && ribbon >= 0) {
            const xNorm = Math.max(0, Math.min(1, (wavePositions[i3] / 25) + 0.5));
            const cIdx = Math.min(Math.floor(xNorm * (currentPalette.length - 1)), currentPalette.length - 2);
            const cBlend = (xNorm * (currentPalette.length - 1)) % 1;
            const c1 = currentPalette[cIdx];
            const c2 = currentPalette[cIdx + 1];
            
            colorAttr.array[i3] = THREE.MathUtils.lerp(c1.r, c2.r, cBlend);
            colorAttr.array[i3 + 1] = THREE.MathUtils.lerp(c1.g, c2.g, cBlend);
            colorAttr.array[i3 + 2] = THREE.MathUtils.lerp(c1.b, c2.b, cBlend);
          }
        }
        
        posAttr.needsUpdate = true;
        colorAttr.needsUpdate = true;
        
        // Rotate when in cube mode
        particles.rotation.y = morph * time * 0.2;
        particles.rotation.x = morph * Math.sin(time * 0.1) * 0.15;
      }
      
      // Camera adjusts based on morph
      camera.position.z = THREE.MathUtils.lerp(14, 10, morph);
      camera.position.y = THREE.MathUtils.lerp(5, 4, morph);
      camera.position.x = Math.sin(time * 0.1) * (1 - morph * 0.5);
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Mouse tracking
    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1
      };
    };
    
    container.addEventListener('mousemove', handleMouseMove);
    
    // Resize
    const handleResize = () => {
      const newW = width || container.clientWidth;
      const newH = height || container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [width, height]);
  
  return (
    <div 
      ref={containerRef} 
      data-testid="cubiqo-visual"
      style={{ 
        width: width || '100%', 
        height: height || '100%',
        background: 'transparent'
      }} 
    />
  );
};

export default CubiQoVisual;
