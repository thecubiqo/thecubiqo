'use client'

import dynamic from 'next/dynamic'

const CubeScene = dynamic(
  () => import('@/components/cube').then(mod => mod.CubeScene),
  { ssr: false }
)

const capabilities = [
  {
    title: 'Emotional Intelligence',
    description: 'Understands context, mood, and nuance. Responds with empathy.',
  },
  {
    title: 'Voice-First Design',
    description: 'Natural conversations with multi-voice support.',
  },
  {
    title: 'Context Awareness',
    description: 'Remembers your preferences, history, and patterns.',
  },
  {
    title: 'Regional Adaptation',
    description: 'Adapts language, culture, and references to your region.',
  },
]

export function IntelligenceSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-black to-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-orange-400 text-sm tracking-widest uppercase mb-4">
            Beyond Artificial
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Intelligence,
            </span>{' '}
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              Reimagined
            </span>
          </h2>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* 3D Cuboid */}
          <div className="relative aspect-square max-w-md mx-auto lg:mx-0">
            <CubeScene colorName="RED" animationState="thinking" />
          </div>

          {/* Text Content */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">
                The Cooperative Virtual Assistant
              </h3>
              <p className="text-white/60 leading-relaxed">
                CubiQo is not just another AI. It&apos;s a cooperative companion that learns,
                adapts, and grows with you. Built on principles of privacy, empathy, and
                genuine understanding.
              </p>
            </div>

            {/* Capability Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {capabilities.map((cap, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-colors"
                >
                  <h4 className="text-white font-medium mb-1">{cap.title}</h4>
                  <p className="text-sm text-white/50">{cap.description}</p>
                </div>
              ))}
            </div>

            {/* CO-OP Badge Link */}
            <div className="pt-4">
              <a
                href="https://coop.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
              >
                <span className="text-white/80">Learn about CO-OP</span>
                <svg className="w-4 h-4 text-white/60 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
