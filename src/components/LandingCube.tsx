'use client'

/**
 * LandingCube - High-Definition Plasma Wave Landing Screen
 * 
 * Shows beautiful full-screen flowing plasma waves on the landing page.
 * Controlled by LandingOverlay for interactions.
 */

import { Canvas } from '@react-three/fiber'
import { PlasmaWaveField } from './cube/PlasmaWaveField'
import { Suspense } from 'react'

interface LandingCubeProps {
  onComplete: () => void
}

export function LandingCube({ onComplete }: LandingCubeProps) {
  return (
    <div
      className="fixed inset-0 z-[0] bg-black"
      onClick={onComplete}
      data-testid="landing-cube-screen"
    >
      {/* FULL SCREEN 3D Canvas with Plasma Waves */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.4} />
            <pointLight position={[5, 5, 5]} intensity={0.5} color="#00ffff" />
            <pointLight position={[-5, -5, -5]} intensity={0.3} color="#ff00ff" />

            <PlasmaWaveField isEnabled={false} aiState="neutral" />
          </Suspense>
        </Canvas>
      </div>

      {/* Ambient floating particles (Subtle Cinematic Layer) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              background: i % 3 === 0
                ? `rgba(255, 150, 80, ${0.4 + Math.random() * 0.4})`
                : `rgba(${100 + Math.random() * 100}, ${150 + Math.random() * 100}, 255, ${0.4 + Math.random() * 0.4})`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-particle ${10 + Math.random() * 8}s linear infinite`,
              animationDelay: `${Math.random() * 10}s`,
              boxShadow: `0 0 ${6 + Math.random() * 10}px currentColor`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          50% {
            transform: translateY(-200px) translateX(50px) scale(0.6);
          }
          90% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  )
}

export default LandingCube
