import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * CubiQo AI Visual Component
 * High-fidelity, mathematical ribbon design with extreme particle density.
 * Matches the reference aesthetic with multi-harmonic sine waves and a glowing soul core.
 */
const CubiQoVisual = ({ 
  isEnabled = false, 
  aiState = 'neutral',
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
  
  const isEnabledRef = useRef(isEnabled);
  const aiStateRef = useRef(aiState);
  
  useEffect(() => { isEnabledRef.current = isEnabled; }, [isEnabled]);
  useEffect(() => { aiStateRef.current = aiState; }, [aiState]);
  
  // Cinematic, high-contrast palettes from reference images
  const colorPalettes = {
    neutral: ['#00f5ff', '#a020f0', '#ff00ff', '#ff1493', '#ff4500'], // Cyan -> Purple -> Magenta -> Pink -> Red
    thinking: ['#00ffff', '#00d4ff', '#3b82f6', '#8b5cf6', '#d946ef'],
    speaking: ['#00ff88', '#00d4ff', '#8b5cf6', '#ff0088', '#ffff00'],
    listening: ['#00ffff', '#8b5cf6', '#ec4899', '#f97316', '#ff0000'],
    error: ['#ff0000', '#ff4400', '#ff0088', '#ff0000']
  };
  
  const coreColor = new THREE.Color('#ffcc33'); // Brilliant yellow core
  const scatterColor = new THREE.Color('#ff8844'); // Orange scattered fragments
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const w = width || container.clientWidth;
    const h = height || container.clientHeight;
    
    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Camera
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 0, 22);
    cameraRef.current = camera;
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // High-Density Particles (80k for extreme fidelity)
    const particleCount = 80000;
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const isSoul = new Float32Array(particleCount); // 0=ribbon, 1=core, 2=scatter
    
    const wavePositions = new Float32Array(particleCount * 3);
    const cubePositions = new Float32Array(particleCount * 3);
    const phases = new Float32Array(particleCount);
    const ribbonOffsets = new Float32Array(particleCount);
    
    const palette = colorPalettes.neutral;
    const cubeSize = 4.0;
    const half = cubeSize / 2;
    
    const cubeVertices = [
      [-half, -half, -half], [half, -half, -half], [half, half, -half], [-half, half, -half],
      [-half, -half, half], [half, -half, half], [half, half, half], [-half, half, half]
    ];
    const cubeEdges = [[0,1], [1,2], [2,3], [3,0], [4,5], [5,6], [6,7], [7,4], [0,4], [1,5], [2,6], [3,7]];
    
    const ribbonCount = 50; // More ribbons for "collected" look
    const perRibbon = Math.floor(particleCount * 0.9 / ribbonCount);
    const coreCount = Math.floor(particleCount * 0.05);
    const scatterCount = Math.floor(particleCount * 0.05);
    
    let idx = 0;
    
    // 1. MATHEMATICAL RIBBONS
    for (let r = 0; r < ribbonCount; r++) {
      const rY = (r / (ribbonCount - 1) - 0.5) * 14;
      const rPhase = r * 0.15;
      
      for (let p = 0; p < perRibbon && idx < particleCount - coreCount - scatterCount; p++) {
        const i3 = idx * 3;
        const xNorm = p / perRibbon;
        const x = (xNorm - 0.5) * 45;
        
        wavePositions[i3] = x;
        wavePositions[i3 + 1] = rY;
        wavePositions[i3 + 2] = (Math.random() - 0.5) * 0.2;
        
        // Cube Morph Targets (Distribution on faces and edges)
        const edge = cubeEdges[Math.floor(Math.random() * cubeEdges.length)];
        const t = Math.random();
        const v1 = cubeVertices[edge[0]];
        const v2 = cubeVertices[edge[1]];
        cubePositions[i3] = v1[0] + (v2[0] - v1[0]) * t;
        cubePositions[i3 + 1] = v1[1] + (v2[1] - v1[1]) * t;
        cubePositions[i3 + 2] = v1[2] + (v2[2] - v1[2]) * t;
        
        positions[i3] = wavePositions[i3];
        positions[i3 + 1] = wavePositions[i3 + 1];
        positions[i3 + 2] = wavePositions[i3 + 2];
        
        // Color Gradient matching reference
        const cIdx = Math.min(Math.floor(xNorm * (palette.length - 1)), palette.length - 2);
        const cBlend = (xNorm * (palette.length - 1)) % 1;
        const c1 = new THREE.Color(palette[cIdx]);
        const c2 = new THREE.Color(palette[cIdx + 1]);
        colors[i3] = THREE.MathUtils.lerp(c1.r, c2.r, cBlend);
        colors[i3 + 1] = THREE.MathUtils.lerp(c1.g, c2.g, cBlend);
        colors[i3 + 2] = THREE.MathUtils.lerp(c1.b, c2.b, cBlend);
        
        sizes[idx] = 0.05 + Math.random() * 0.05;
        phases[idx] = xNorm * Math.PI * 6 + rPhase;
        ribbonOffsets[idx] = rY;
        isSoul[idx] = 0.0;
        idx++;
      }
    }
    
    // 2. SOUL CORE (Glowing center)
    for (let i = 0; i < coreCount && idx < particleCount; i++) {
      const i3 = idx * 3;
      const r = Math.pow(Math.random(), 1.5) * 1.5;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const cx = r * Math.sin(phi) * Math.cos(theta);
      const cy = r * Math.sin(phi) * Math.sin(theta);
      const cz = r * Math.cos(phi);
      
      wavePositions[i3] = cx; wavePositions[i3+1] = cy; wavePositions[i3+2] = cz;
      cubePositions[i3] = cx * 0.4; cubePositions[i3+1] = cy * 0.4; cubePositions[i3+2] = cz * 0.4;
      
      colors[i3] = coreColor.r; colors[i3+1] = coreColor.g; colors[i3+2] = coreColor.b;
      sizes[idx] = 0.4 + Math.random() * 0.4;
      isSoul[idx] = 1.0;
      idx++;
    }

    // 3. SCATTER FRAGMENTS (Square-ish particles)
    for (let i = 0; i < scatterCount && idx < particleCount; i++) {
      const i3 = idx * 3;
      const r = 1.2 + Math.random() * 4.0;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      wavePositions[i3] = r * Math.sin(phi) * Math.cos(theta);
      wavePositions[i3+1] = r * Math.sin(phi) * Math.sin(theta) * 0.4;
      wavePositions[i3+2] = r * Math.cos(phi);
      
      cubePositions[i3] = wavePositions[i3] * 0.5;
      cubePositions[i3+1] = wavePositions[i3+1] * 0.5;
      cubePositions[i3+2] = wavePositions[i3+2] * 0.5;
      
      colors[i3] = scatterColor.r; colors[i3+1] = scatterColor.g; colors[i3+2] = scatterColor.b;
      sizes[idx] = 0.12 + Math.random() * 0.1;
      isSoul[idx] = 2.0;
      idx++;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('isSoul', new THREE.BufferAttribute(isSoul, 1));
    geometry.userData = { wavePositions, cubePositions, phases, ribbonOffsets, isSoul };
    
    // Advanced Shader for Cinematic Look
    const material = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uMorph: { value: 0 } },
      vertexShader: `
        attribute float size;
        attribute float isSoul;
        varying vec3 vColor;
        varying float vIsSoul;
        void main() {
          vColor = color;
          vIsSoul = isSoul;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (350.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vIsSoul;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float dist = length(uv);
          if (vIsSoul > 1.5) { // Scatter square fragments
            float glow = 1.0 - max(abs(uv.x), abs(uv.y)) * 2.0;
            if (glow <= 0.0) discard;
            gl_FragColor = vec4(vColor * 3.0, glow * 0.8);
          } else if (vIsSoul > 0.5) { // Intense core
            if (dist > 0.5) discard;
            float core = 1.0 - smoothstep(0.0, 0.25, dist);
            float glow = exp(-dist * 8.0);
            gl_FragColor = vec4(vColor * (core * 2.5 + glow * 2.0), 1.0);
          } else { // Ribbon particles
            if (dist > 0.5) discard;
            float glow = exp(-dist * 6.0);
            gl_FragColor = vec4(vColor * 2.2 * glow, glow * 0.95);
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
    
    // Animation Loop
    const animate = () => {
      timeRef.current += 0.01;
      const time = timeRef.current;
      
      const targetMorph = isEnabledRef.current ? 1 : 0;
      morphProgressRef.current += (targetMorph - morphProgressRef.current) * 0.06;
      const morph = morphProgressRef.current;
      
      const currentPaletteStrings = colorPalettes[aiStateRef.current] || colorPalettes.neutral;
      const currentPalette = currentPaletteStrings.map(c => new THREE.Color(c));
      
      if (particlesRef.current) {
        const geom = particlesRef.current.geometry;
        const posAttr = geom.attributes.position;
        const colorAttr = geom.attributes.color;
        const { wavePositions, cubePositions, phases, ribbonOffsets, isSoul } = geom.userData;
        
        particlesRef.current.material.uniforms.uTime.value = time;
        
        for (let i = 0; i < posAttr.count; i++) {
          const i3 = i * 3;
          const type = isSoul[i];
          const phase = phases[i];
          
          let wX = wavePositions[i3];
          let wY = wavePositions[i3 + 1];
          let wZ = wavePositions[i3 + 2];
          
          if (type === 0.0) {
            // "Collected Together" Mathematical Waves
            // Sum of harmonics for that precise rhythmic look
            const h1 = Math.sin(phase + time * 1.2) * 3.2;
            const h2 = Math.sin(phase * 0.5 - time * 0.8) * 1.5;
            const h3 = Math.cos(phase * 1.2 + time * 2.0) * 0.6;
            
            wY = ribbonOffsets[i] + h1 + h2 + h3;
            wZ += Math.sin(time * 0.5 + phase) * 0.4;
          } else if (type === 1.0) {
            // Core breathing
            const pulse = 1 + Math.sin(time * 3 + phase) * 0.05;
            wX *= pulse; wY *= pulse; wZ *= pulse;
          } else {
            // Scatter orbiting
            const r = Math.sqrt(wavePositions[i3]**2 + wavePositions[i3+2]**2);
            const angle = Math.atan2(wavePositions[i3+2], wavePositions[i3]) + time * 0.6;
            wX = r * Math.cos(angle);
            wZ = r * Math.sin(angle);
            wY += Math.sin(time * 2 + phase) * 0.2;
          }
          
          const cX = cubePositions[i3];
          const cY = cubePositions[i3 + 1];
          const cZ = cubePositions[i3 + 2];
          
          posAttr.array[i3] = THREE.MathUtils.lerp(wX, cX, morph);
          posAttr.array[i3+1] = THREE.MathUtils.lerp(wY, cY, morph);
          posAttr.array[i3+2] = THREE.MathUtils.lerp(wZ, cZ, morph);
          
          // Color update for ribbons based on X position
          if (type === 0.0) {
            const xNorm = Math.max(0, Math.min(1, (posAttr.array[i3] / 45) + 0.5));
            const cIdx = Math.min(Math.floor(xNorm * (currentPalette.length - 1)), currentPalette.length - 2);
            const cBlend = (xNorm * (currentPalette.length - 1)) % 1;
            const c1 = currentPalette[cIdx];
            const c2 = currentPalette[cIdx + 1];
            colorAttr.array[i3] = THREE.MathUtils.lerp(c1.r, c2.r, cBlend);
            colorAttr.array[i3+1] = THREE.MathUtils.lerp(c1.g, c2.g, cBlend);
            colorAttr.array[i3+2] = THREE.MathUtils.lerp(c1.b, c2.b, cBlend);
          }
        }
        
        posAttr.needsUpdate = true;
        colorAttr.needsUpdate = true;
        
        particles.rotation.y = morph * time * 0.15;
        particles.rotation.x = morph * Math.sin(time * 0.1) * 0.1;
      }
      
      camera.position.z = THREE.MathUtils.lerp(22, 14, morph);
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    const handleResize = () => {
      const newW = width || container.clientWidth;
      const newH = height || container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [width, height]);
  
  return <div ref={containerRef} style={{ width: width || '100%', height: height || '100%', background: 'transparent' }} />;
};

export default CubiQoVisual;
