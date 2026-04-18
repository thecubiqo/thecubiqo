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
  
  // Color palettes matching the reference images (Teal/Blue -> Purple -> Magenta)
  const colorPalettes = {
    neutral: ['#00d4ff', '#00b4d8', '#7b2cbf', '#9d4edd', '#c77dff', '#e0aaff', '#ff006e'],
    thinking: ['#00d4ff', '#4895ef', '#7209b7', '#b5179e', '#f72585'],
    speaking: ['#4cc9f0', '#4361ee', '#3a0ca3', '#7209b7', '#f72585'],
    listening: ['#4895ef', '#560bad', '#b5179e', '#f72585', '#ff4d6d'],
    error: ['#ff4d6d', '#ff0000', '#c9184a', '#800f2f']
  };
  
  // Reddish-orange soul color as seen in the images
  const orangeSoulColor = new THREE.Color('#ff4d00');
  
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
    const particleCount = 200000;
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
    
    // Add amorphous state storage
    const amorphousX = new Float32Array(particleCount);
    const amorphousY = new Float32Array(particleCount);
    const amorphousZ = new Float32Array(particleCount);

    geometry.userData = {
      wavePositions,
      cubePositions,
      amorphousX,
      amorphousY,
      amorphousZ,
      phases,
      ribbonIndex,
      isSoulNode
    };
    
    // Cube definitions for morphing
    const cubeVertices = [
      [-half, -half, -half], [half, -half, -half], [half, half, -half], [-half, half, -half],
      [-half, -half, half], [half, -half, half], [half, half, half], [-half, half, half]
    ];
    const cubeFaces = [[0,1,2,3], [4,5,6,7], [0,1,5,4], [2,3,7,6], [0,3,7,4], [1,2,6,5]];
    
    // Create particles with 3 state targets
    const ribbonCount = 20;
    const perRibbon = Math.floor(particleCount / ribbonCount);
    
    let idx = 0;
    for (let r = 0; r < ribbonCount; r++) {
      const ribbonY = (r / (ribbonCount - 1) - 0.5) * 3;
      
      for (let p = 0; p < perRibbon; p++) {
        const i3 = idx * 3;
        const xNorm = p / perRibbon;
        const x = (xNorm - 0.5) * 32;
        const spineCurve = Math.sin(xNorm * Math.PI * 2) * 2.5;
        
        // Central Soul Cluster Logic
        // We dedicate the first 5% of particles to be the central "Soul" cluster
        const isCoreSoul = (idx < particleCount * 0.05);
        
        if (isCoreSoul) {
          // Concentrate soul nodes in a central spherical cluster
          const radius = Math.random() * 2.5; // Tighter core radius
          const theta = Math.random() * 2 * Math.PI;
          const phi = Math.acos((Math.random() * 2) - 1);
          
          const cx = radius * Math.sin(phi) * Math.cos(theta);
          const cy = radius * Math.sin(phi) * Math.sin(theta);
          const cz = radius * Math.cos(phi);

          wavePositions[i3] = cx;
          wavePositions[i3 + 1] = cy;
          wavePositions[i3 + 2] = cz;

          // Amorphous target for soul is also a cluster
          geometry.userData.amorphousX[idx] = cx * 1.5;
          geometry.userData.amorphousY[idx] = cy * 1.5;
          geometry.userData.amorphousZ[idx] = cz * 1.5;
          
          isSoulNode[idx] = 1;
          
          // Soul nodes stay within the core during cuboid morph
          cubePositions[i3] = cx * 0.8;
          cubePositions[i3 + 1] = cy * 0.8;
          cubePositions[i3 + 2] = cz * 0.8;
        } else {
          // Clean Ribbon Wave logic (Original design as requested)
          wavePositions[i3] = x;
          wavePositions[i3 + 1] = ribbonY + spineCurve;
          wavePositions[i3 + 2] = 0;
          
          geometry.userData.amorphousX[idx] = x;
          geometry.userData.amorphousY[idx] = ribbonY * 1.5 + spineCurve;
          geometry.userData.amorphousZ[idx] = 0;
          
          isSoulNode[idx] = 0;
          
          // Target C: Cuboid (Restored)
          const faceIdx = Math.floor(Math.random() * cubeFaces.length);
          const face = cubeFaces[faceIdx];
          const u = Math.random(), v = Math.random();
          const v0 = cubeVertices[face[0]], v1 = cubeVertices[face[1]];
          const v2 = cubeVertices[face[2]], v3 = cubeVertices[face[3]];
          const inset = 0.95 + Math.random() * 0.1;
          cubePositions[i3] = ((1-u)*(1-v)*v0[0] + u*(1-v)*v1[0] + u*v*v2[0] + (1-u)*v*v3[0]) * inset;
          cubePositions[i3 + 1] = ((1-u)*(1-v)*v0[1] + u*(1-v)*v1[1] + u*v*v2[1] + (1-u)*v*v3[1]) * inset;
          cubePositions[i3 + 2] = ((1-u)*(1-v)*v0[2] + u*(1-v)*v1[2] + u*v*v2[2] + (1-u)*v*v3[2]) * inset;
        }
        
        positions[i3] = wavePositions[i3];
        positions[i3 + 1] = wavePositions[i3 + 1];
        positions[i3 + 2] = wavePositions[i3 + 2];
        
        const cIdx = Math.min(Math.floor(xNorm * (palette.length - 1)), palette.length - 2);
        const cBlend = (xNorm * (palette.length - 1)) % 1;
        const c1 = new THREE.Color(palette[cIdx]);
        const c2 = new THREE.Color(palette[cIdx + 1]);
        
        colors[i3] = THREE.MathUtils.lerp(c1.r, c2.r, cBlend);
        colors[i3 + 1] = THREE.MathUtils.lerp(c1.g, c2.g, cBlend);
        colors[i3 + 2] = THREE.MathUtils.lerp(c1.b, c2.b, cBlend);
        
        sizes[idx] = 0.03 + Math.random() * 0.04;
        phases[idx] = xNorm * Math.PI * 4 + r * 0.5 + Math.random();
        ribbonIndex[idx] = r;
        
        if (isSoulNode[idx]) {
          colors[i3] = orangeSoulColor.r;
          colors[i3 + 1] = orangeSoulColor.g;
          colors[i3 + 2] = orangeSoulColor.b;
          sizes[idx] *= 1.8; // Make soul particles slightly larger for visibility
        }
        
        idx++;
      }
    }
    
    // Removed soul node separate loop as it's merged into the main misty creation loop above
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uMorph: { value: 0 },
        uTime: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        uniform float uMorph;
        uniform float uTime;
        varying vec3 vColor;
        varying float vMorph;
        varying float vDepth;
        
        void main() {
          vColor = color;
          vMorph = uMorph;
          
          // Subtle shimmer based on time
          float shimmer = 1.0 + 0.3 * sin(uTime * 2.0 + position.x * 0.1);
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vDepth = -mvPosition.z;
          gl_PointSize = size * shimmer * (500.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vMorph;
        varying float vDepth;
        
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float dist = length(uv);
          if (dist > 0.5) discard;
          
          // Ultra-soft nebula glow
          float core = 1.0 - smoothstep(0.0, 0.15, dist);
          float glow = exp(-dist * 4.0) * 0.8;
          float outer = exp(-dist * 2.0) * 0.3;
          
          float intensity = core * 1.2 + glow + outer;
          
          // Chromatic aberration feel - shift colors based on depth
          vec3 shiftColor = vColor;
          if (vDepth > 15.0) shiftColor.r *= 1.1;
          else if (vDepth < 8.0) shiftColor.b *= 1.1;
          
          vec3 finalColor = shiftColor * intensity * 3.5;
          finalColor += vec3(1.0) * core * 0.8; // Much brighter core
          
          gl_FragColor = vec4(finalColor, intensity * 0.95);
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
        const { wavePositions, cubePositions, amorphousX, amorphousY, amorphousZ, phases, ribbonIndex, isSoulNode } = geom.userData;
        
        // Update material uniforms
        particlesRef.current.material.uniforms.uMorph.value = morph;
        particlesRef.current.material.uniforms.uTime.value = time;
        
        for (let i = 0; i < posAttr.count; i++) {
          const i3 = i * 3;
          const phase = phases[i];
          const ribbon = ribbonIndex[i];
          const isSoul = isSoulNode[i];
          
          // Harmonious Movement Balance: Soft pendulum between Wave and Soul dominance
          const cycle = Math.sin(time * 0.4);
          const waveMovement = 0.2 + 0.8 * Math.max(0, cycle);      // Never fully stops, peaks smoothly
          const soulMovement = 0.2 + 0.8 * Math.max(0, -cycle);     // Takes over smoothly when wave subsides
          
          // Stay strictly as the structured ribbon wave (no amorphous morphing)
          let waveX = wavePositions[i3];
          let waveY = wavePositions[i3 + 1];
          let waveZ = wavePositions[i3 + 2];
          
          if (ribbon >= 0 && isSoul === 0) {
            // Smooth Ribbon wave movement
            const wave1 = Math.sin(phase + time * 0.4) * 0.8;
            const wave2 = Math.sin(phase * 0.3 + time * 0.6) * 0.5;
            
            // Mouse influence
            const dx = waveX - mouseRef.current.x * 12;
            const dz = waveZ - mouseRef.current.y * 8;
            const mDist = Math.sqrt(dx * dx + dz * dz);
            const mouseWave = Math.max(0, 1 - mDist / 12) * 1.5 * Math.sin(time * 3 + mDist * 0.3);
            
            waveY += (wave1 + wave2) * audioMult * waveMovement + mouseWave;
            waveZ += Math.sin(phase * 0.5 + time * 0.5) * 1.5 * waveMovement;
          } else if (isSoul > 0) {
            // Central "soul" cluster movement
            // Create a harmonious breathing cluster that beats harder when dominant
            const beatIntensity = 0.05 + 0.15 * soulMovement;
            const beat = 1.0 + beatIntensity * Math.sin(time * (3.0 + soulMovement * 2.0)); // Beats faster and larger when dominant
            
            // Cluster swirls around the center
            const swirlX = Math.sin(time * 0.8 + phase) * 1.2 * soulMovement;
            const swirlY = Math.cos(time * 0.6 + phase) * 1.2 * soulMovement;
            const swirlZ = Math.sin(time * 0.9 + phase) * 1.2 * soulMovement;
            
            waveX = targetX * beat + swirlX;
            waveY = targetY * beat + swirlY;
            waveZ = targetZ * beat + swirlZ;
          }
          
          // Cube animation
          let cubeX = cubePositions[i3];
          let cubeY = cubePositions[i3 + 1];
          let cubeZ = cubePositions[i3 + 2];
          
          if (isSoul > 0) {
            // Soul nodes pulse inside the cube
            cubeX = cubePositions[i3] * (1 + Math.sin(time * 3 + phase) * 0.15);
            cubeY = cubePositions[i3 + 1] * (1 + Math.cos(time * 3 + phase) * 0.15);
            cubeZ = cubePositions[i3 + 2] * (1 + Math.sin(time * 3 + phase) * 0.15);
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
