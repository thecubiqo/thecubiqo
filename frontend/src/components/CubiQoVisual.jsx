import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

/**
 * CubiQo AI Visual Component
 * Striking, crisp ribbon design matching the reference aesthetic
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
  
  const isEnabledRef = useRef(isEnabled);
  const aiStateRef = useRef(aiState);
  
  useEffect(() => { isEnabledRef.current = isEnabled; }, [isEnabled]);
  useEffect(() => { aiStateRef.current = aiState; }, [aiState]);
  
  // High-contrast, striking palettes
  const colorPalettes = {
    neutral: ['#00ffff', '#00d4ff', '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#fbbf24'],
    thinking: ['#00ffff', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'],
    speaking: ['#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'],
    listening: ['#22d3ee', '#06b6d4', '#3b82f6', '#8b5cf6', '#c026d3', '#ec4899', '#f97316'],
    error: ['#f43f5e', '#ef4444', '#dc2626', '#b91c1c', '#f43f5e']
  };
  
  const coreColor = new THREE.Color('#ffb050'); // Bright yellow-orange core
  const scatterColor = new THREE.Color('#ff8030'); // Orange for scattered squares
  
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
    camera.position.set(0, 5, 18);
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
    
    // Particles
    const particleCount = 60000;
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const isSoulNode = new Float32Array(particleCount); // 0=ribbon, 1=core, 2=scatter
    
    const wavePositions = new Float32Array(particleCount * 3);
    const cubePositions = new Float32Array(particleCount * 3);
    const phases = new Float32Array(particleCount);
    const ribbonIndex = new Float32Array(particleCount);
    
    const palette = colorPalettes.neutral;
    const cubeSize = 3.5;
    const half = cubeSize / 2;
    
    const cubeVertices = [
      [-half, -half, -half], [half, -half, -half], [half, half, -half], [-half, half, -half],
      [-half, -half, half], [half, -half, half], [half, half, half], [-half, half, half]
    ];
    const cubeEdges = [[0,1], [1,2], [2,3], [3,0], [4,5], [5,6], [6,7], [7,4], [0,4], [1,5], [2,6], [3,7]];
    const cubeFaces = [[0,1,2,3], [4,5,6,7], [0,1,5,4], [2,3,7,6], [0,3,7,4], [1,2,6,5]];
    
    const ribbonCount = 35; // Many distinct crisp lines
    const perRibbon = Math.floor(particleCount * 0.85 / ribbonCount);
    const tightCoreCount = Math.floor(particleCount * 0.05);
    const scatterCount = Math.floor(particleCount * 0.05);
    
    let idx = 0;
    
    // 1. WAVE RIBBONS (Type 0)
    for (let r = 0; r < ribbonCount && idx < particleCount - tightCoreCount - scatterCount; r++) {
      const ribbonY = (r / (ribbonCount - 1) - 0.5) * 12; // Spread vertically
      
      for (let p = 0; p < perRibbon && idx < particleCount - tightCoreCount - scatterCount; p++) {
        const i3 = idx * 3;
        const xNorm = p / perRibbon;
        const x = (xNorm - 0.5) * 35; // Wide spread horizontally
        
        // Crisp lines - zero noise on Y/Z
        wavePositions[i3] = x;
        wavePositions[i3 + 1] = ribbonY;
        wavePositions[i3 + 2] = (Math.random() - 0.5) * 0.5; // Tiny Z offset for depth sorting
        
        // Cube morph targets
        const isEdge = Math.random() < 0.2;
        if (isEdge) {
          const edge = cubeEdges[Math.floor(Math.random() * cubeEdges.length)];
          const t = Math.random();
          const v1 = cubeVertices[edge[0]];
          const v2 = cubeVertices[edge[1]];
          cubePositions[i3] = v1[0] + (v2[0] - v1[0]) * t;
          cubePositions[i3 + 1] = v1[1] + (v2[1] - v1[1]) * t;
          cubePositions[i3 + 2] = v1[2] + (v2[2] - v1[2]) * t;
        } else {
          const face = cubeFaces[Math.floor(Math.random() * cubeFaces.length)];
          const u = Math.random(), v = Math.random();
          const v0 = cubeVertices[face[0]], v1 = cubeVertices[face[1]], v2 = cubeVertices[face[2]], v3 = cubeVertices[face[3]];
          cubePositions[i3] = (1-u)*(1-v)*v0[0] + u*(1-v)*v1[0] + u*v*v2[0] + (1-u)*v*v3[0];
          cubePositions[i3 + 1] = (1-u)*(1-v)*v0[1] + u*(1-v)*v1[1] + u*v*v2[1] + (1-u)*v*v3[1];
          cubePositions[i3 + 2] = (1-u)*(1-v)*v0[2] + u*(1-v)*v1[2] + u*v*v2[2] + (1-u)*v*v3[2];
        }
        
        positions[i3] = wavePositions[i3];
        positions[i3 + 1] = wavePositions[i3 + 1];
        positions[i3 + 2] = wavePositions[i3 + 2];
        
        // Gradient color
        const cIdx = Math.min(Math.floor(xNorm * (palette.length - 1)), palette.length - 2);
        const cBlend = (xNorm * (palette.length - 1)) % 1;
        const c1 = new THREE.Color(palette[cIdx]);
        const c2 = new THREE.Color(palette[cIdx + 1]);
        colors[i3] = THREE.MathUtils.lerp(c1.r, c2.r, cBlend);
        colors[i3 + 1] = THREE.MathUtils.lerp(c1.g, c2.g, cBlend);
        colors[i3 + 2] = THREE.MathUtils.lerp(c1.b, c2.b, cBlend);
        
        sizes[idx] = 0.08; // Very small for crisp lines
        phases[idx] = xNorm * Math.PI * 5 + r * 0.2; // Smooth wave propagation
        ribbonIndex[idx] = r;
        isSoulNode[idx] = 0.0;
        idx++;
      }
    }
    
    // 2. TIGHT CORE (Type 1)
    for (let i = 0; i < tightCoreCount && idx < particleCount; i++) {
      const i3 = idx * 3;
      const r = Math.pow(Math.random(), 1/3) * 1.2; // Very tight glowing core
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const cx = r * Math.sin(phi) * Math.cos(theta);
      const cy = r * Math.sin(phi) * Math.sin(theta);
      const cz = r * Math.cos(phi);
      
      wavePositions[i3] = cx; wavePositions[i3 + 1] = cy; wavePositions[i3 + 2] = cz;
      cubePositions[i3] = cx * 0.5; cubePositions[i3 + 1] = cy * 0.5; cubePositions[i3 + 2] = cz * 0.5;
      
      positions[i3] = cx; positions[i3 + 1] = cy; positions[i3 + 2] = cz;
      colors[i3] = coreColor.r; colors[i3 + 1] = coreColor.g; colors[i3 + 2] = coreColor.b;
      sizes[idx] = 0.3 + Math.random() * 0.2;
      phases[idx] = Math.random() * Math.PI * 2;
      ribbonIndex[idx] = -1;
      isSoulNode[idx] = 1.0;
      idx++;
    }

    // 3. SCATTERED SQUARE PARTICLES (Type 2)
    for (let i = 0; i < scatterCount && idx < particleCount; i++) {
      const i3 = idx * 3;
      const r = 1.5 + Math.random() * 3.5; // Spread outwards from core
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const cx = r * Math.sin(phi) * Math.cos(theta);
      const cy = r * Math.sin(phi) * Math.sin(theta) * 0.5; // Flattened scatter
      const cz = r * Math.cos(phi);
      
      wavePositions[i3] = cx; wavePositions[i3 + 1] = cy; wavePositions[i3 + 2] = cz;
      cubePositions[i3] = cx * 0.6; cubePositions[i3 + 1] = cy * 0.6; cubePositions[i3 + 2] = cz * 0.6;
      
      positions[i3] = cx; positions[i3 + 1] = cy; positions[i3 + 2] = cz;
      colors[i3] = scatterColor.r; colors[i3 + 1] = scatterColor.g; colors[i3 + 2] = scatterColor.b;
      sizes[idx] = 0.08 + Math.random() * 0.08; // Small blocks
      phases[idx] = Math.random() * Math.PI * 2;
      ribbonIndex[idx] = -1;
      isSoulNode[idx] = 2.0;
      idx++;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('isSoul', new THREE.BufferAttribute(isSoulNode, 1));
    geometry.userData = { wavePositions, cubePositions, phases, ribbonIndex, isSoulNode };
    
    // Custom Shader
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uMorph: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute float isSoul;
        uniform float uMorph;
        varying vec3 vColor;
        varying float vIsSoul;
        
        void main() {
          vColor = color;
          vIsSoul = isSoul;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (400.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vIsSoul;
        
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float dist = length(uv);
          
          if (vIsSoul > 1.5) { 
            // Type 2: Scattered square particles (No discard!)
            float glow = 1.0 - max(abs(uv.x), abs(uv.y)) * 2.0;
            if (glow <= 0.0) discard;
            gl_FragColor = vec4(vColor * 2.5, glow);
          } 
          else if (vIsSoul > 0.5) { 
            // Type 1: Intense tight core sphere
            if (dist > 0.5) discard;
            float core = 1.0 - smoothstep(0.0, 0.2, dist);
            float glow = exp(-dist * 6.0) * 1.5;
            vec3 finalColor = vColor * (core * 2.0 + glow) * 1.5;
            gl_FragColor = vec4(finalColor, 1.0);
          } 
          else { 
            // Type 0: Crisp smooth ribbons
            if (dist > 0.5) discard;
            float glow = exp(-dist * 5.0);
            gl_FragColor = vec4(vColor * 1.8 * glow, glow * 0.9);
          }
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
    
    // Animation
    const animate = () => {
      timeRef.current += 0.012;
      const time = timeRef.current;
      
      const targetMorph = isEnabledRef.current ? 1 : 0;
      morphProgressRef.current += (targetMorph - morphProgressRef.current) * 0.08;
      const morph = morphProgressRef.current;
      
      const currentPaletteStrings = colorPalettes[aiStateRef.current] || colorPalettes.neutral;
      const currentPalette = currentPaletteStrings.map(c => new THREE.Color(c));
      const audioMult = 1 + audioLevelRef.current * 2;
      
      if (particlesRef.current) {
        const geom = particlesRef.current.geometry;
        const posAttr = geom.attributes.position;
        const colorAttr = geom.attributes.color;
        const { wavePositions, cubePositions, phases, ribbonIndex, isSoulNode } = geom.userData;
        
        particlesRef.current.material.uniforms.uMorph.value = morph;
        
        for (let i = 0; i < posAttr.count; i++) {
          const i3 = i * 3;
          const phase = phases[i];
          const ribbon = ribbonIndex[i];
          const type = isSoulNode[i];
          
          let waveX = wavePositions[i3];
          let waveY = wavePositions[i3 + 1];
          let waveZ = wavePositions[i3 + 2];
          
          if (type === 0) {
            // Ribbons: elegant multi-sine waves
            const wave1 = Math.sin(phase + time * 0.8) * 3.5;
            const wave2 = Math.sin(phase * 0.6 + time * 0.5) * 2.0;
            const wave3 = Math.cos(phase * 0.3 + time * 1.2) * 1.0;
            
            // Mouse interaction
            const dx = waveX - mouseRef.current.x * 15;
            const dz = waveZ - mouseRef.current.y * 10;
            const mDist = Math.sqrt(dx * dx + dz * dz);
            const mouseWave = Math.max(0, 1 - mDist / 10) * 2 * Math.sin(time * 3 + mDist * 0.5);
            
            waveY = wavePositions[i3 + 1] + (wave1 + wave2 + wave3) * audioMult * 0.5 + mouseWave;
          } else if (type === 1) {
            // Tight Core: subtle breathing
            waveX *= (1 + Math.sin(time * 2 + phase) * 0.05);
            waveY *= (1 + Math.sin(time * 2 + phase) * 0.05);
            waveZ *= (1 + Math.sin(time * 2 + phase) * 0.05);
          } else if (type === 2) {
            // Scattered squares: orbiting around center
            const r = Math.sqrt(wavePositions[i3]*wavePositions[i3] + wavePositions[i3+2]*wavePositions[i3+2]);
            const angle = Math.atan2(wavePositions[i3+2], wavePositions[i3]) + time * 0.8;
            
            waveX = r * Math.cos(angle) + Math.sin(time * 3.0 + phase) * 0.2;
            waveY = wavePositions[i3 + 1] + Math.cos(time * 2.0 + phase) * 0.2;
            waveZ = r * Math.sin(angle) + Math.sin(time * 2.5 + phase) * 0.2;
          }
          
          let cubeX = cubePositions[i3];
          let cubeY = cubePositions[i3 + 1];
          let cubeZ = cubePositions[i3 + 2];
          
          if (type > 0) {
            // Soul nodes swirl inside cube
            cubeX = cubePositions[i3] + Math.sin(time + phase) * 0.2;
            cubeY = cubePositions[i3 + 1] + Math.cos(time * 0.8 + phase) * 0.2;
            cubeZ = cubePositions[i3 + 2] + Math.sin(time * 0.6 + phase) * 0.2;
          } else {
            // Cube surface
            const pulse = Math.sin(time * 2 + phase) * 0.05;
            cubeX *= (1 + pulse);
            cubeY *= (1 + pulse);
            cubeZ *= (1 + pulse);
          }
          
          posAttr.array[i3] = THREE.MathUtils.lerp(waveX, cubeX, morph);
          posAttr.array[i3 + 1] = THREE.MathUtils.lerp(waveY, cubeY, morph);
          posAttr.array[i3 + 2] = THREE.MathUtils.lerp(waveZ, cubeZ, morph);
          
          // Color update for ribbons
          if (type === 0) {
            const xNorm = Math.max(0, Math.min(1, (wavePositions[i3] / 35) + 0.5));
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
        
        particles.rotation.y = morph * time * 0.2;
        particles.rotation.x = morph * Math.sin(time * 0.1) * 0.15;
      }
      
      camera.position.z = THREE.MathUtils.lerp(18, 12, morph);
      camera.position.y = THREE.MathUtils.lerp(5, 4, morph);
      camera.position.x = Math.sin(time * 0.1) * (1 - morph * 0.5);
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1
      };
    };
    
    container.addEventListener('mousemove', handleMouseMove);
    
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
