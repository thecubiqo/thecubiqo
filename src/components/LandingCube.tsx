'use client'

/**
 * LandingCube - Plasma Wave Landing Screen
 * Uses Standalone Visuals
 */

import { PlasmaFieldStandalone } from './cube/PlasmaFieldStandalone'

interface LandingCubeProps {
  onComplete: () => void
}

export function LandingCube({ onComplete }: LandingCubeProps) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center cursor-pointer"
      onClick={onComplete}
      data-testid="landing-cube-screen"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/20 via-black to-black" />

      {/* 3D Visual - Standalone Renderer */}
      <div className="w-full h-[70vh] max-w-5xl relative z-10">
        <PlasmaFieldStandalone isEnabled={true} aiState="neutral" />
      </div>

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
    </div>
  )
}

export default LandingCube
