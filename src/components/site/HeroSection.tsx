'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

// Dynamic import for 3D background to avoid SSR issues
const MetallicBackground = dynamic(
  () => import('./MetallicBackground').then(mod => mod.MetallicBackground),
  { ssr: false }
)

export function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [showText, setShowText] = useState(false)
  const [showCTA, setShowCTA] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    // Animation sequence
    const loadTimer = setTimeout(() => setIsLoaded(true), 500)
    const textTimer = setTimeout(() => setShowText(true), 1200)
    const ctaTimer = setTimeout(() => setShowCTA(true), 2000)

    return () => {
      clearTimeout(loadTimer)
      clearTimeout(textTimer)
      clearTimeout(ctaTimer)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden"
    >
      {/* 3D Metallic Background */}
      <MetallicBackground />

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 z-10 pointer-events-none" />

      {/* Content - centered */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center px-4">
        {/* Main text */}
        <div
          className={`text-center transition-all duration-1000 ease-out ${
            showText
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Tagline */}
          <p
            className={`text-cyan-400 text-xs sm:text-sm tracking-[0.3em] uppercase mb-6 transition-all duration-700 delay-300 ${
              showText ? 'opacity-100' : 'opacity-0'
            }`}
          >
            The Cooperative Virtual Assistant
          </p>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 leading-tight">
            <span className="block bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              Cuz life is
            </span>
            <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              three dimensional
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className={`text-base sm:text-lg md:text-xl text-white/50 max-w-xl mx-auto mb-10 transition-all duration-700 delay-500 ${
              showText ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Privacy-first AI companion with infinite memory
          </p>
        </div>

        {/* CTA Buttons */}
        <div
          className={`flex flex-col items-center gap-6 transition-all duration-700 ${
            showCTA
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Primary buttons row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/"
              className="group px-8 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:from-cyan-400 hover:to-blue-500 transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/25"
            >
              <span className="flex items-center gap-2">
                Start Talking
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </a>
            <a
              href="#demo"
              className="px-8 py-3.5 rounded-full border border-white/20 text-white/80 font-medium hover:bg-white/10 hover:border-white/30 transition-all backdrop-blur-sm"
            >
              Watch Demo
            </a>
          </div>

          {/* 15 sec preview - centered below */}
          <button
            className="group flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 hover:border-cyan-500/30 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/40 to-purple-500/40 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/20">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="text-left">
              <span className="block text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                15 sec preview
              </span>
              <span className="block text-xs text-white/50">
                See CubiQo in action
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-20 transition-all duration-700 delay-1000 ${
          showCTA ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-white/40 tracking-widest uppercase">Scroll</span>
          <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* Gradient fade at bottom for smooth transition */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />
    </section>
  )
}
