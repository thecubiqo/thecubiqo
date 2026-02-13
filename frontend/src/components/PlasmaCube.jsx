import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

// Plasma Cube Component - Isometric glowing cube with plasma material
const PlasmaCube = ({ isActive, onReady }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const animationRef = useRef(null);
  const cubeParticlesRef = useRef(null);
  const timeRef = useRef(0);
  const transitionRef = useRef(0);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Scene
    const scene = new THREE.Scene();
    scene.background = null; // Transparent
    sceneRef.current = scene;
    
    // Camera - isometric angle
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(4, 5, 6);
    camera.lookAt(0, 0, 0);
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      premultipliedAlpha: false
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    
    // Create cube wireframe edges with glow
    const cubeSize = 2.5;
    const edgeParticles = [];
    
    // Create particles along cube edges
    const createEdgeParticles = () => {
      const particleCount = 30000;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      const phases = new Float32Array(particleCount);
      const edgeIndex = new Float32Array(particleCount);
      
      // Cube vertices
      const half = cubeSize / 2;
      const vertices = [
        [-half, -half, -half], [half, -half, -half], [half, half, -half], [-half, half, -half],
        [-half, -half, half], [half, -half, half], [half, half, half], [-half, half, half]
      ];
      
      // Cube edges (pairs of vertex indices)
      const edges = [
        [0,1], [1,2], [2,3], [3,0], // Back face
        [4,5], [5,6], [6,7], [7,4], // Front face
        [0,4], [1,5], [2,6], [3,7]  // Connecting edges
      ];
      
      // Also fill faces with particles
      const faces = [
        [0,1,2,3], // Back
        [4,5,6,7], // Front
        [0,1,5,4], // Bottom
        [2,3,7,6], // Top
        [0,3,7,4], // Left
        [1,2,6,5]  // Right
      ];
      
      // Color palette - blue, purple, pink with orange soul nodes
      const baseColors = [
        new THREE.Color('#00d4ff'),
        new THREE.Color('#6366f1'),
        new THREE.Color('#a855f7'),
        new THREE.Color('#ec4899'),
        new THREE.Color('#ff6b35'), // Orange for soul
      ];
      
      let idx = 0;
      
      // Particles along edges (bright lines)
      const edgeParticleCount = Math.floor(particleCount * 0.3);
      for (let i = 0; i < edgeParticleCount; i++) {
        const edgeIdx = Math.floor(Math.random() * edges.length);
        const edge = edges[edgeIdx];
        const t = Math.random();
        
        const v1 = vertices[edge[0]];
        const v2 = vertices[edge[1]];
        
        const x = v1[0] + (v2[0] - v1[0]) * t + (Math.random() - 0.5) * 0.15;
        const y = v1[1] + (v2[1] - v1[1]) * t + (Math.random() - 0.5) * 0.15;
        const z = v1[2] + (v2[2] - v1[2]) * t + (Math.random() - 0.5) * 0.15;
        
        positions[idx * 3] = x;
        positions[idx * 3 + 1] = y;
        positions[idx * 3 + 2] = z;
        
        // Edge particles are bright white/blue
        const colorRand = Math.random();
        const c = colorRand < 0.8 ? baseColors[0] : baseColors[Math.floor(Math.random() * 4)];
        colors[idx * 3] = c.r;
        colors[idx * 3 + 1] = c.g;
        colors[idx * 3 + 2] = c.b;
        
        sizes[idx] = 0.03 + Math.random() * 0.04;
        phases[idx] = Math.random() * Math.PI * 2;
        edgeIndex[idx] = edgeIdx;
        idx++;
      }
      
      // Particles on faces (plasma swirls)
      const faceParticleCount = Math.floor(particleCount * 0.5);
      for (let i = 0; i < faceParticleCount && idx < particleCount; i++) {
        const faceIdx = Math.floor(Math.random() * faces.length);
        const face = faces[faceIdx];
        
        // Random point on quad face
        const u = Math.random();
        const v = Math.random();
        
        const v0 = vertices[face[0]];
        const v1 = vertices[face[1]];
        const v2 = vertices[face[2]];
        const v3 = vertices[face[3]];
        
        // Bilinear interpolation
        const x = (1-u)*(1-v)*v0[0] + u*(1-v)*v1[0] + u*v*v2[0] + (1-u)*v*v3[0];
        const y = (1-u)*(1-v)*v0[1] + u*(1-v)*v1[1] + u*v*v2[1] + (1-u)*v*v3[1];
        const z = (1-u)*(1-v)*v0[2] + u*(1-v)*v1[2] + u*v*v2[2] + (1-u)*v*v3[2];
        
        // Slight inward offset for depth
        const inset = 0.95 + Math.random() * 0.1;
        positions[idx * 3] = x * inset;
        positions[idx * 3 + 1] = y * inset;
        positions[idx * 3 + 2] = z * inset;
        
        // Mix of colors based on position
        const colorT = Math.max(0, Math.min(1, y / cubeSize + 0.5));
        const cIdx = Math.min(Math.floor(colorT * 4), 3);
        const c = baseColors[cIdx];
        colors[idx * 3] = c.r;
        colors[idx * 3 + 1] = c.g;
        colors[idx * 3 + 2] = c.b;
        
        sizes[idx] = 0.02 + Math.random() * 0.03;
        phases[idx] = Math.random() * Math.PI * 2;
        edgeIndex[idx] = -1; // Face particle
        idx++;
      }
      
      // Orange soul nodes inside the cube
      const soulParticleCount = particleCount - idx;
      for (let i = 0; i < soulParticleCount && idx < particleCount; i++) {
        // Random position inside cube
        const x = (Math.random() - 0.5) * cubeSize * 0.8;
        const y = (Math.random() - 0.5) * cubeSize * 0.8;
        const z = (Math.random() - 0.5) * cubeSize * 0.8;
        
        positions[idx * 3] = x;
        positions[idx * 3 + 1] = y;
        positions[idx * 3 + 2] = z;
        
        // Mostly orange/warm colors for soul
        const isOrange = Math.random() < 0.7;
        const c = isOrange ? baseColors[4] : baseColors[Math.floor(Math.random() * 4)];
        colors[idx * 3] = c.r;
        colors[idx * 3 + 1] = c.g;
        colors[idx * 3 + 2] = c.b;
        
        sizes[idx] = 0.04 + Math.random() * 0.06;
        phases[idx] = Math.random() * Math.PI * 2;
        edgeIndex[idx] = -2; // Soul particle
        idx++;
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      geometry.userData = { phases, edgeIndex, originalPositions: positions.slice() };
      
      return geometry;
    };
    
    const cubeGeometry = createEdgeParticles();
    
    // Glowing shader material
    const cubeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTransition: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        uniform float uTime;
        uniform float uTransition;
        varying vec3 vColor;
        varying float vGlow;
        
        void main() {
          vColor = color;
          
          // Pulse effect
          float pulse = 1.0 + sin(uTime * 2.0 + position.y * 3.0) * 0.15;
          vGlow = pulse;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * pulse * (250.0 / -mvPosition.z) * (0.5 + uTransition * 0.5);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vGlow;
        
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float dist = length(uv);
          if (dist > 0.5) discard;
          
          // Soft glow
          float core = 1.0 - smoothstep(0.0, 0.15, dist);
          float glow = exp(-dist * 4.0);
          float outer = exp(-dist * 2.0) * 0.4;
          
          float intensity = (core + glow + outer) * vGlow;
          vec3 finalColor = vColor * intensity * 1.5;
          finalColor += vec3(1.0) * core * 0.4;
          
          gl_FragColor = vec4(finalColor, intensity * 0.9);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    const cubeParticles = new THREE.Points(cubeGeometry, cubeMaterial);
    scene.add(cubeParticles);
    cubeParticlesRef.current = cubeParticles;
    
    // Animation
    const animate = () => {
      timeRef.current += 0.016;
      const time = timeRef.current;
      
      // Update transition
      const targetTransition = isActive ? 1 : 0;
      transitionRef.current += (targetTransition - transitionRef.current) * 0.05;
      
      if (cubeParticlesRef.current) {
        const material = cubeParticlesRef.current.material;
        material.uniforms.uTime.value = time;
        material.uniforms.uTransition.value = transitionRef.current;
        
        // Animate particles
        const geom = cubeParticlesRef.current.geometry;
        const posAttr = geom.attributes.position;
        const { phases, edgeIndex, originalPositions } = geom.userData;
        
        for (let i = 0; i < posAttr.count; i++) {
          const i3 = i * 3;
          const phase = phases[i];
          const eIdx = edgeIndex[i];
          
          // Soul particles swirl inside
          if (eIdx === -2) {
            const origX = originalPositions[i3];
            const origY = originalPositions[i3 + 1];
            const origZ = originalPositions[i3 + 2];
            
            const swirl = Math.sin(time + phase) * 0.1;
            posAttr.array[i3] = origX + Math.sin(time * 0.5 + phase) * 0.2;
            posAttr.array[i3 + 1] = origY + Math.cos(time * 0.3 + phase) * 0.15;
            posAttr.array[i3 + 2] = origZ + Math.sin(time * 0.4 + phase) * 0.2;
          }
          // Face particles wave
          else if (eIdx === -1) {
            const origY = originalPositions[i3 + 1];
            posAttr.array[i3 + 1] = origY + Math.sin(time + phase) * 0.05;
          }
        }
        
        posAttr.needsUpdate = true;
        
        // Rotate cube slowly
        cubeParticlesRef.current.rotation.y = time * 0.15;
        cubeParticlesRef.current.rotation.x = Math.sin(time * 0.1) * 0.1;
      }
      
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    if (onReady) onReady();
    
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
      cubeGeometry.dispose();
      cubeMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isActive, onReady]);
  
  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        opacity: isActive ? 1 : 0,
        transition: 'opacity 0.5s ease',
        pointerEvents: isActive ? 'auto' : 'none'
      }} 
    />
  );
};

export default PlasmaCube;
