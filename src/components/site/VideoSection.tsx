'use client'

const thumbnails = [
  { id: 1, label: 'Getting Started' },
  { id: 2, label: 'Voice Commands' },
  { id: 3, label: 'Memory Features' },
  { id: 4, label: 'Multi-World' },
]

export function VideoSection() {
  return (
    <section id="demo" className="py-24 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-orange-400 text-sm tracking-widest uppercase mb-4">
            See It In Action
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Meet Qboid &
            </span>{' '}
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              System
            </span>
          </h2>
          <p className="mt-4 text-white/60 max-w-2xl mx-auto">
            Watch how CubiQo transforms your daily interactions with AI.
          </p>
        </div>

        {/* Main Video Placeholder */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="aspect-video bg-zinc-900/50 rounded-2xl border border-white/10 flex items-center justify-center backdrop-blur-sm overflow-hidden group cursor-pointer hover:border-orange-500/30 transition-colors">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="text-white/40 text-sm">[VIDEO_DEMO]</span>
              <p className="text-white/60 mt-2">Click to play demo</p>
            </div>
          </div>
        </div>

        {/* Thumbnail Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {thumbnails.map((thumb) => (
            <div
              key={thumb.id}
              className="aspect-video bg-zinc-900/30 rounded-xl border border-white/5 flex items-center justify-center hover:border-orange-500/30 cursor-pointer transition-all hover:scale-105"
            >
              <div className="text-center p-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
                  <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span className="text-xs text-white/60">{thumb.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
