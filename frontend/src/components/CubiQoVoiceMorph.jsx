import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';

const PARTICLE_COUNT = 60000;

const MorphParticleMaterial = shaderMaterial(
  {
    uTime: 0,
    uMorph: 0, // 0 = ambient waves, 1 = cuboid
    uSignalStrength: 0,
    uAudioLevel: 0,
    uColorBlue: new THREE.Color('#00ffff'),
    uColorPink: new THREE.Color('#ff00ff'),
    uColorOrange: new THREE.Color('#ff8800'),
    uColorPurple: new THREE.Color('#8800ff'),
    uPixelData: null,
  },
  // Vertex Shader
  `
    uniform float uTime;
    uniform float uMorph;
    uniform float uAudioLevel;
    
    attribute vec3 targetPosition; // Cuboid position
    attribute vec2 waveParams;     // unique params for wave motion
    attribute vec3 colorSide;      // hints for coloring
    
    varying vec3 vColor;
    varying float vMorph;
    varying vec3 vPos;
    
    // Simplex noise function placeholder (using sin/cos for simplicity here)
    float noise(vec3 p) {
      return sin(p.x * 2.0 + uTime) * cos(p.y * 2.0 + uTime) * sin(p.z * 2.0);
    }
    
    void main() {
      vMorph = uMorph;
      
      // -- Ambient Wave Logic --
      // Base wave shape
      float x = position.x;
      float z = position.z;
      
      // Moving through 7 states (simplified into a continuous flowing system)
      // We use waveParams.x (phase) and waveParams.y (frequency)
      float yWave = sin(x * waveParams.y + uTime * 0.5 + waveParams.x) * 1.5;
      yWave += cos(z * 2.0 - uTime * 0.3) * 0.5;
      
      // Plasma ribbon effect / turbulence
      float turb = noise(vec3(x, yWave, z)) * 0.5;
      vec3 wavePos = vec3(x, yWave + turb, z);
      
      // -- Cuboid Logic --
      // Compression of intelligence: particles are drawn inward, filaments align
      // Audio level pulses the cuboid slightly
      float pulse = 1.0 + (uAudioLevel * 0.1 * sin(uTime * 10.0));
      vec3 cubePos = targetPosition * pulse;
      
      // Morph interpolation
      vec3 finalPos = mix(wavePos, cubePos, smoothstep(0.0, 1.0, uMorph));
      vPos = finalPos;
      
      // -- Color logic --
      vec3 waveColor = mix(vec3(0.0, 1.0, 1.0), vec3(1.0, 0.0, 1.0), (x + 3.0) / 6.0); 
      // Add orange/pink warmth
      if (colorSide.x > 0.5) waveColor = mix(waveColor, vec3(1.0, 0.5, 0.0), 0.5);
      
      // Purple blending for cuboid
      vec3 cubeColor = mix(vec3(0.5, 0.0, 1.0), vec3(0.8, 0.0, 0.8), (finalPos.y + 2.0)/4.0);
      
      vColor = mix(waveColor, cubeColor, uMorph);
      
      vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
      gl_PointSize = mix(3.0, 1.5, uMorph) * (10.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader
  `
    varying vec3 vColor;
    varying float vMorph;
    varying vec3 vPos;
    
    uniform float uSignalStrength;
    
    void main() {
      // Soft particle glow
      vec2 xy = gl_PointCoord.xy - vec2(0.5);
      float ll = length(xy);
      if (ll > 0.5) discard;
      
      float intensity = pow((0.5 - ll) * 2.0, 1.5);
      
      vec3 finalColor = vColor * intensity;
      
      gl_FragColor = vec4(finalColor, intensity * mix(0.6, 0.9, vMorph));
    }
  `
);

extend({ MorphParticleMaterial });

// Tri-color Signal for the Cuboid
const VoiceSignal = ({ morph, audioLevel, isSpeaking }) => {
  const groupRef = useRef();
  
  // Signal colors: ruby, teal, pale yellow
  const colors = useMemo(() => [
    new THREE.Color('#e0115f'), // Ruby
    new THREE.Color('#008080'), // Teal
    new THREE.Color('#ffff99')  // Pale Yellow
  ], []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.children.forEach((mesh, i) => {
        // Pulse gently while idle, stronger amplitude when speaking
        const amp = isSpeaking ? 0.8 + audioLevel * 1.5 : 0.2 + Math.sin(t * 2 + i) * 0.1;
        mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, amp, 0.1);
        mesh.material.opacity = morph * (0.5 + audioLevel * 0.5);
      });
    }
  });

  return (
    <group ref={groupRef} visible={morph > 0.1} position={[0, 0, 0]}>
      {colors.map((color, i) => (
        <mesh key={i} position={[(i - 1) * 0.6, 0, 0]}>
          <boxGeometry args={[0.2, 1, 0.2]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
};

export const CubiQoVoiceMorph = ({ 
  isVoiceMode = false, 
  audioLevel = 0, 
  isSpeaking = false 
}) => {
  const pointsRef = useRef();
  const materialRef = useRef();
  const [morphValue, setMorphValue] = useState(0);
  
  // Generate geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const targetPositions = new Float32Array(PARTICLE_COUNT * 3);
    const waveParams = new Float32Array(PARTICLE_COUNT * 2);
    const colorSide = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Wave ambient starting positions (distributed field)
      const x = (Math.random() - 0.5) * 12;
      const y = (Math.random() - 0.5) * 2;
      const z = (Math.random() - 0.5) * 8;
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Target Cuboid positions (restrained, mathematical)
      const cx = (Math.random() - 0.5) * 3;
      const cy = (Math.random() - 0.5) * 3;
      const cz = (Math.random() - 0.5) * 3;
      
      // Push some to the edges to form a shell
      let edgeCx = cx, edgeCy = cy, edgeCz = cz;
      const shellProb = Math.random();
      if (shellProb > 0.8) {
        if (Math.random() > 0.5) edgeCx = Math.sign(cx) * 1.5;
        else if (Math.random() > 0.5) edgeCy = Math.sign(cy) * 1.5;
        else edgeCz = Math.sign(cz) * 1.5;
      }

      targetPositions[i * 3] = edgeCx;
      targetPositions[i * 3 + 1] = edgeCy;
      targetPositions[i * 3 + 2] = edgeCz;

      // Wave motion params
      waveParams[i * 2] = Math.random() * Math.PI * 2; // Phase
      waveParams[i * 2 + 1] = 0.5 + Math.random() * 1.5; // Freq
      
      // Color hints (cool cyan vs warm orange/pink)
      colorSide[i * 3] = x > 0 ? 1 : 0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('targetPosition', new THREE.BufferAttribute(targetPositions, 3));
    geo.setAttribute('waveParams', new THREE.BufferAttribute(waveParams, 2));
    geo.setAttribute('colorSide', new THREE.BufferAttribute(colorSide, 3));
    
    return geo;
  }, []);

  useFrame((state, delta) => {
    // Smooth morph transition
    const targetMorph = isVoiceMode ? 1.0 : 0.0;
    const newMorph = THREE.MathUtils.lerp(morphValue, targetMorph, delta * 2.0);
    setMorphValue(newMorph);

    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      materialRef.current.uMorph = newMorph;
      materialRef.current.uAudioLevel = audioLevel;
    }
  });

  return (
    <group>
      {/* Charcoal black background handled by Canvas styling/clearColor in parent */}
      
      {/* Main Intelligence Field */}
      <points ref={pointsRef} geometry={geometry}>
        <morphParticleMaterial 
          ref={materialRef} 
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Internal Tri-Color Signal (Visible during Voice Mode) */}
      <VoiceSignal morph={morphValue} audioLevel={audioLevel} isSpeaking={isSpeaking} />
    </group>
  );
};

export default CubiQoVoiceMorph;
