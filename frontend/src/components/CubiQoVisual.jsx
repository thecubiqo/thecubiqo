import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const PARTICLE_COUNT = 40000;
const CORE_COLOR = new THREE.Color('#ff8800'); // Orange core for journal

export const CubiQoVisual = ({ isEnabled, aiState = 'neutral' }) => {
  const containerRef = useRef(null);
  const pointsRef = useRef();
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    camera.position.z = 15;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      // Focus on a central "soul" core for the journal
      const r = Math.pow(Math.random(), 2) * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);
      
      const c = CORE_COLOR.clone().lerp(new THREE.Color('#ffcc00'), Math.random() * 0.5);
      colors[i3] = c.r; colors[i3 + 1] = c.g; colors[i3 + 2] = c.b;
      sizes[i] = 0.05 + Math.random() * 0.1;
      phases[i] = Math.random() * Math.PI * 2;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.8
    });
    
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    pointsRef.current = points;
    
    let time = 0;
    const animate = () => {
      time += 0.01;
      if (pointsRef.current) {
        const posAttr = pointsRef.current.geometry.attributes.position;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const i3 = i * 3;
          const p = phases[i];
          // Breathing motion
          const s = 1 + Math.sin(time + p) * 0.1;
          posAttr.array[i3] *= s;
          posAttr.array[i3+1] *= s;
          posAttr.array[i3+2] *= s;
          // Slowly bring back
          const drag = 0.99;
          posAttr.array[i3] *= drag;
          posAttr.array[i3+1] *= drag;
          posAttr.array[i3+2] *= drag;
        }
        posAttr.needsUpdate = true;
        pointsRef.current.rotation.y += 0.005;
      }
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();
    
    return () => {
      renderer.dispose();
      if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};

export default CubiQoVisual;
