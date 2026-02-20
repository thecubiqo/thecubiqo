'use client'

/**
 * LandingCube - Plasma Wave Landing Screen
 * 
 * Shows beautiful flowing plasma waves on the landing page.
 * User taps anywhere to enter the main app with a zoom-in transition.
 */

import { useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { PlasmaWaveField } from './cube/PlasmaWaveField'

interface LandingCubeProps {
  onComplete: () => void
  detectedColor?: 'RED' | 'YELLOW' | 'GREEN_BLUE' | 'ORANGE'
}

export function LandingCube({ onComplete }: LandingCubeProps) {
  const [isExiting, setIsExiting] = useState(false)

  const handleTap = useCallback(() => {
    if (isExiting) return
    setIsExiting(true)
    // Allow the zoom-in animation to play, then complete
    setTimeout(onComplete, 700)
  }, [isExiting, onComplete])

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center cursor-pointer transition-all duration-700 ease-in ${
        isExiting ? 'scale-[3] opacity-0' : 'scale-100 opacity-100'
      }`}
      onClick={handleTap}
      data-testid="landing-cube-screen"
    >
      {/* Deep space background */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/20 via-black to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(100,50,180,0.1)_0%,_transparent_70%)]" />
      
      {/* 3D Canvas with Plasma Waves */}
      <div className="w-full h-[70vh] max-w-5xl relative z-10">
        <Canvas 
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={0.2} />
          <pointLight position={[5, 5, 5]} intensity={0.3} color="#00ffff" />
          <pointLight position={[-5, -5, -5]} intensity={0.2} color="#ff00ff" />
          
          <PlasmaWaveField isEnabled={false} aiState="neutral" />
        </Canvas>
      </div>
      
      {/* Welcome text */}
      <div className="text-center mt-2 relative z-10">
        <h1 className="text-white/90 text-4xl font-extralight tracking-[0.4em] mb-3">
          CUBIQO
        </h1>
        <p className="text-cyan-300/60 text-base font-light tracking-wider mb-10">
          One Mind. Many Dimensions.
        </p>
        <p className="text-white/25 text-xs tracking-wide uppercase">
          you may tap now
        </p>
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
