'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera, Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';

const Filament = () => {
    const meshRef = useRef<THREE.Mesh>(null);

    // Create a complex path for the filaments
    const curve = useMemo(() => {
        const points = [];
        for (let i = 0; i < 20; i++) {
            points.push(new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 2
            ));
        }
        return new THREE.CatmullRomCurve3(points);
    }, []);

    useFrame((state) => {
        if (meshRef.current) {
            const t = state.clock.getElapsedTime();
            // Organic breathing (0.2Hz)
            const scale = 1 + Math.sin(t * 0.2 * Math.PI * 2) * 0.05;
            meshRef.current.scale.set(scale, scale, scale);

            // Micro drift
            meshRef.current.rotation.y = t * 0.05;
        }
    });

    return (
        <mesh ref={meshRef}>
            <tubeGeometry args={[curve, 100, 0.005, 8, false]} />
            <meshBasicMaterial color="#F2EFE8" transparent opacity={0.3} />
        </mesh>
    );
};

const Creature = () => {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            const t = state.clock.getElapsedTime();
            // Slight camera drift (0.04-0.06 radian oscillation)
            groupRef.current.rotation.y = Math.sin(t * 0.1) * 0.05;
            groupRef.current.rotation.x = Math.cos(t * 0.08) * 0.04;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Central Soul Core */}
            <Sphere args={[0.8, 64, 64]}>
                <MeshDistortMaterial
                    color="#F2EFE8"
                    roughness={0.1}
                    metalness={1}
                    distort={0.3}
                    speed={0.5}
                    transparent
                    opacity={0.15}
                />
            </Sphere>

            {/* Filaments */}
            {Array.from({ length: 12 }).map((_, i) => (
                <group key={i} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}>
                    <Filament />
                </group>
            ))}

            {/* Rim Lighting (Simulated with additional spheres or emissive material) */}
            <Sphere args={[0.82, 64, 64]}>
                <meshBasicMaterial color="#F2EFE8" transparent opacity={0.05} side={THREE.BackSide} />
            </Sphere>
        </group>
    );
};

export default function VollebakHero() {
    return (
        <div className="w-full h-screen bg-black relative overflow-hidden">
            <Canvas dpr={[1, 2]} flat>
                <color attach="background" args={['#000000']} />

                <OrthographicCamera
                    makeDefault
                    position={[0, 0, 10]}
                    zoom={150}
                />

                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={0.5} />
                <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} color="#F2EFE8" />

                <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                    <Creature />
                </Float>

                <EffectComposer disableNormalPass>
                    <Bloom
                        intensity={0.15}
                        luminanceThreshold={0.8}
                        mipmapBlur
                    />
                    <ChromaticAberration
                        offset={new THREE.Vector2(0.0015, 0.0015)}
                    />
                    <Noise opacity={0.02} />
                </EffectComposer>
            </Canvas>

            {/* Subtle radial haze */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%)',
                    opacity: 0.5
                }}
            />

            {/* Title Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                <h1 className="v-headline text-7xl md:text-9xl mb-4 text-center">
                    SCALAR<br />NEBULA
                </h1>
                <p className="v-label opacity-60">Architect of Digital Silence</p>
            </div>
        </div>
    );
}
