'use client'

/**
 * LandingCube - Plasma Wave Landing Screen
 * 
 * Shows beautiful flowing plasma waves on the landing page.
 * User taps anywhere to enter the main app with a zoom-in transition.
 * 
 * Branding layers:
 *  - Top: scrolling adjectives (Job Hunter, Private Secretary, etc.)
 *  - Middle: Integration logos marquee scrolling under CUBIQO
 *  - Bottom: AI model names
 */

import { useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { PlasmaWaveField } from './cube/PlasmaWaveField'

// Adjectives that describe what CubiQo can be for the user
const ROLE_ADJECTIVES = [
  'Private Secretary', 'Job Hunter', 'Business Builder', 'Startup Kickstarter',
  'Portfolio Manager', 'Life Coach', 'Career Advisor', 'Creative Partner',
  'Research Assistant', 'Wellness Guide', 'Study Buddy', 'Financial Planner',
]

// Integration brand names that scroll as a marquee
const INTEGRATION_BRANDS = [
  'WhatsApp', 'Telegram', 'Instagram', 'LinkedIn', 'Slack', 'Discord',
  'Gmail', 'Notion', 'Spotify', 'Uber', 'Shopify', 'Stripe',
  'GitHub', 'Figma', 'Google Calendar', 'DoorDash',
]

// AI models powering CubiQo
const AI_MODELS = [
  'OpenAI GPT', 'Claude', 'Gemini', 'Mistral', 'LLaMA', 'ElevenLabs',
]

interface LandingCubeProps {
  onComplete: () => void
  detectedColor?: 'RED' | 'YELLOW' | 'TEAL' | 'ORANGE'
}

export function LandingCube({ onComplete }: LandingCubeProps) {
  const [isExiting, setIsExiting] = useState(false)

  const handleTap = useCallback(() => {
    if (isExiting) return
    setIsExiting(true)
    // Allow the zoom-in animation to play, then complete
    setTimeout(onComplete, 700)
  }, [isExiting, onComplete])

  // Double the arrays for seamless looping
  const rolesDouble = [...ROLE_ADJECTIVES, ...ROLE_ADJECTIVES]
  const brandsDouble = [...INTEGRATION_BRANDS, ...INTEGRATION_BRANDS]

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

      {/* TOP: Scrolling role adjectives */}
      <div className="absolute top-6 left-0 right-0 z-20 overflow-hidden pointer-events-none">
        <div className="flex whitespace-nowrap animate-scroll-left">
          {rolesDouble.map((role, i) => (
            <span key={`${role}-${i}`} className="mx-4 text-white/20 text-[11px] sm:text-xs uppercase tracking-[0.25em] font-light">
              {role}
            </span>
          ))}
        </div>
      </div>
      
      {/* 3D Canvas with Plasma Waves */}
      <div className="w-full h-[60vh] max-w-5xl relative z-10">
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
        <p className="text-cyan-300/60 text-base font-light tracking-wider mb-4">
          One Mind. Many Dimensions.
        </p>
      </div>

      {/* MIDDLE: Integration brands marquee scrolling right-to-left */}
      <div className="relative z-20 w-full overflow-hidden pointer-events-none mb-6">
        <div className="flex whitespace-nowrap animate-scroll-right">
          {brandsDouble.map((brand, i) => (
            <span key={`${brand}-${i}`} className="mx-3 sm:mx-5 text-white/15 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-light flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-white/20" />
              {brand}
            </span>
          ))}
        </div>
      </div>

      {/* Tap prompt */}
      <div className="relative z-10 text-center">
        <p className="text-white/25 text-xs tracking-wide uppercase">
          you may tap now
        </p>
      </div>

      {/* BOTTOM: AI model names */}
      <div className="absolute bottom-6 left-0 right-0 z-20 pointer-events-none">
        <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap px-4">
          <span className="text-white/15 text-[9px] sm:text-[10px] uppercase tracking-[0.15em]">Powered by</span>
          {AI_MODELS.map((model) => (
            <span key={model} className="text-white/25 text-[10px] sm:text-[11px] tracking-wider font-light">
              {model}
            </span>
          ))}
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
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-scroll-left {
          animation: scroll-left 30s linear infinite;
        }
        .animate-scroll-right {
          animation: scroll-right 35s linear infinite;
        }
      `}</style>
    </div>
  )
}

export default LandingCube
