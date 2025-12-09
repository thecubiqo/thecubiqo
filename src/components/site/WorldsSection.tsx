'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'

const CubeScene = dynamic(
  () => import('@/components/cube').then(mod => mod.CubeScene),
  { ssr: false }
)

const worlds = [
  {
    id: 'cubiqo',
    name: 'CubiQo',
    description: 'Main emotional AI companion',
    color: 'ORANGE' as const,
    href: '/',
  },
  {
    id: 'headlines',
    name: 'Headlines',
    description: 'News debate with Hari & Ingle',
    color: 'RED' as const,
    href: '/headlines',
  },
  {
    id: 'vocspad',
    name: 'Vocspad',
    description: 'Voice + keyboard notepad',
    color: 'YELLOW' as const,
    href: '/vocspad',
  },
  {
    id: 'dicey',
    name: 'Dicey',
    description: 'Coming soon',
    color: 'GREEN_BLUE' as const,
    href: '#',
    disabled: true,
  },
  {
    id: 'coqo',
    name: 'CoQo',
    description: 'Coming soon',
    color: 'ORANGE' as const,
    href: '#',
    disabled: true,
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'System configuration',
    color: 'GREEN_BLUE' as const,
    href: '#',
    disabled: true,
  },
]

export function WorldsSection() {
  return (
    <section id="worlds" className="py-24 bg-gradient-to-b from-black to-zinc-950 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-orange-400 text-sm tracking-widest uppercase mb-4">
            Explore Different Modes
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              CUBIQO WORLDS
            </span>
          </h2>
          <p className="mt-4 text-white/60 max-w-2xl mx-auto">
            Each world is a unique AI experience tailored for specific tasks.
          </p>
        </div>

        {/* Worlds Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {worlds.map((world) => (
            <Link
              key={world.id}
              href={world.href}
              className={`group relative rounded-2xl border border-white/10 overflow-hidden transition-all hover:border-orange-500/30 hover:scale-105 ${
                world.disabled ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              {/* Mini Cube */}
              <div className="aspect-square p-4">
                <CubeScene colorName={world.color} animationState="idle" />
              </div>

              {/* Info */}
              <div className="p-4 bg-zinc-950/80 border-t border-white/5">
                <h3 className="text-white font-semibold">{world.name}</h3>
                <p className="text-xs text-white/50">{world.description}</p>
              </div>

              {/* Hover overlay */}
              {!world.disabled && (
                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </Link>
          ))}
        </div>

        {/* Chat Bubble Hint */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="text-white/70 text-sm">
              Each world has voice and chat modes
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
