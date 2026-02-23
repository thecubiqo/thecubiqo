'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useMemo, useRef, Suspense } from 'react';

function ParallaxPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const tex = useTexture('/hero/creature.png');
  tex.colorSpace = THREE.SRGBColorSpace;

  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.92 }),
    [tex]
  );

  useFrame(({ clock, mouse }) => {
    const t = clock.getElapsedTime();
    const m = meshRef.current;
    if (!m) return;
    const breath = 1 + Math.sin(t * 0.35) * 0.008;
    const driftX = Math.sin(t * 0.12) * 0.03;
    const driftY = Math.cos(t * 0.10) * 0.02;
    m.scale.set(1.55 * breath, 1.55 * breath, 1);
    m.position.x = driftX + (mouse.x ?? 0) * 0.03;
    m.position.y = driftY + (mouse.y ?? 0) * 0.02;
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1.2, 1.2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function FallbackPlane() {
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial color="#0B0B0D" />
    </mesh>
  );
}

export default function CreatureScene() {
  return (
    <Canvas
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={240} />
      <ambientLight intensity={1.2} />
      <Suspense fallback={<FallbackPlane />}>
        <ParallaxPlane />
      </Suspense>
    </Canvas>
  );
}
