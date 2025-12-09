'use client'

import dynamic from 'next/dynamic'

// Dynamic import for 3D cube to avoid SSR issues
const CubeScene = dynamic(
  () => import('@/components/cube').then(mod => mod.CubeScene),
  { ssr: false }
)

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />

      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="text-center">
          {/* Tagline */}
          <p className="text-orange-400 text-sm tracking-widest uppercase mb-4">
            The Cooperative Virtual Assistant
          </p>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              Cuz life is
            </span>
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 bg-clip-text text-transparent">
              three dimensional
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-8">
            Privacy-first AI companion with infinite memory.
            Your thoughts, your data, your control.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <a
              href="/"
              className="px-8 py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium hover:from-orange-400 hover:to-red-400 transition-all transform hover:scale-105 shadow-lg shadow-orange-500/25"
            >
              Start Talking
            </a>
            <a
              href="#demo"
              className="px-8 py-3 rounded-full border border-white/20 text-white font-medium hover:bg-white/10 transition-all"
            >
              Watch Demo
            </a>
          </div>

          {/* 3D Cube */}
          <div className="relative w-full max-w-lg mx-auto aspect-square">
            <CubeScene colorName="ORANGE" animationState="idle" />
          </div>

          {/* Hero Video Placeholder */}
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="aspect-video bg-zinc-900/50 rounded-2xl border border-white/10 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span className="text-white/40 text-sm">[VIDEO_HERO]</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  )
}
