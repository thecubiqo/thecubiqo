'use client'

/**
 * LandingCube - Plasma Wave Landing Screen
 * 
 * Shows beautiful flowing plasma waves on the landing page.
 * User taps anywhere to enter the main app.
 * 
 * UPDATED: Uses standalone PlasmaWaveField (creates its own Canvas/Renderer).
 * Do NOT wrap in <Canvas>.
 */

import { PlasmaWaveField } from './cube/PlasmaWaveField'
// Removed import { Canvas } from '@react-three/fiber' (not needed for standalone component)

interface LandingCubeProps {
  onComplete: () => void
  // detectedColor prop removed as it was unused and could cause lint errors
}

export function LandingCube({ onComplete }: LandingCubeProps) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center cursor-pointer"
      onClick={onComplete}
      data-testid="landing-cube-screen"
    >
      {/* Deep space background */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/20 via-black to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(100,50,180,0.1)_0%,_transparent_70%)]" />

      {/* 3D Visual - Standalone Renderer (Matched to Emergent Design) */}
      <div className="w-full h-[70vh] max-w-5xl relative z-10">
        <PlasmaWaveField isEnabled={true} aiState="neutral" />
      </div>

      {/* Welcome text */}
      <div className="text-center mt-2 relative z-10 pointer-events-none">
        <h1 className="text-8xl md:text-[10rem] font-thin tracking-[0.4em] mb-8 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] text-white/90">
          CUBIQO
        </h1>
        <p className="text-2xl md:text-3xl font-light tracking-[0.2em] mb-16 opacity-80 text-cyan-300/60">
          One Mind. Many Dimensions.
        </p>
        <div className="animate-pulse">
          <p className="text-xl tracking-[0.1em] font-light text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
            YOU MAY TAP NOW
          </p>
        </div>
      </div>

      {/* Ambient floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              background: i % 3 === 0
                ? `rgba(255, 150, 80, ${0.3 + Math.random() * 0.4})`
                : `rgba(${100 + Math.random() * 100}, ${150 + Math.random() * 100}, 255, ${0.3 + Math.random() * 0.4})`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-particle ${8 + Math.random() * 6}s linear infinite`,
              animationDelay: `${Math.random() * 8}s`,
              boxShadow: `0 0 ${4 + Math.random() * 6}px currentColor`,
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
            transform: translateY(-120px) translateX(30px) scale(0.8);
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
