'use client'

/**
 * RGYChatsModal - Choose Your Context screen
 * Opens when tapping the RGY signal icon
 */

import { useState, useEffect } from 'react'

interface RGYChatsModalProps {
  isOpen: boolean
  onClose: () => void
  isDark?: boolean
}

const ZONES = [
  {
    id: 'green',
    name: 'Progressive',
    tagline: 'Growth & Achievement',
    color: '#22c55e',
    borderColor: 'rgba(34, 197, 94, 0.5)',
    bgGradient: 'linear-gradient(180deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.02) 100%)',
    icon1: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
      </svg>
    ),
    icon2: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    tags: ['Wellness', 'Career', 'Ambitions'],
  },
  {
    id: 'yellow',
    name: 'Sit back',
    tagline: 'Relax & Connect',
    color: '#eab308',
    borderColor: 'rgba(234, 179, 8, 0.5)',
    bgGradient: 'linear-gradient(180deg, rgba(234, 179, 8, 0.1) 0%, rgba(234, 179, 8, 0.02) 100%)',
    icon1: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    icon2: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    tags: ['Platonic', 'Popcorn', 'OnlyFriends', 'Hangouts'],
  },
  {
    id: 'red',
    name: 'Indulge',
    tagline: 'Desire & Exploration',
    color: '#ef4444',
    borderColor: 'rgba(239, 68, 68, 0.5)',
    bgGradient: 'linear-gradient(180deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.02) 100%)',
    icon1: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    icon2: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    tags: ['Adult', 'Connection', 'Accomplice'],
  },
]

export function RGYChatsModal({ isOpen, onClose, isDark = true }: RGYChatsModalProps) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    // Store in localStorage for now
    const testers = JSON.parse(localStorage.getItem('signal_early_access') || '[]')
    testers.push({ email, timestamp: Date.now() })
    localStorage.setItem('signal_early_access', JSON.stringify(testers))

    setIsSubmitted(true)
    setTimeout(() => setIsSubmitted(false), 3000)
    setEmail('')
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[90] bg-[#0a0a0a] overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-screen" onClick={e => e.stopPropagation()}>
        {/* Header - Signal Branding */}
        <header className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col gap-0.5">
              <div className="w-8 h-1.5 rounded-full bg-[#ef4444]"></div>
              <div className="w-8 h-1.5 rounded-full bg-[#eab308]"></div>
              <div className="w-8 h-1.5 rounded-full bg-[#22c55e]"></div>
            </div>
            <div>
              <div className="font-semibold text-white text-lg tracking-tight">SIGNAL</div>
              <div className="text-[10px] text-white/40 tracking-wide">One is enough.</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="fixed top-5 right-6 z-[100] p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors bg-black/50 backdrop-blur-md border border-white/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Choose Your Context</h1>
            <p className="text-white/60">
              Select a zone to set your identity and discover intent-based rooms.
            </p>
          </div>

          {/* Zone Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {ZONES.map(zone => (
              <button
                key={zone.id}
                onClick={() => setSelectedZone(zone.id)}
                className={`relative p-6 rounded-2xl text-left transition-all duration-200 ${selectedZone === zone.id ? 'scale-[1.02]' : 'hover:scale-[1.01]'
                  }`}
                style={{
                  background: zone.bgGradient,
                  border: `1px solid ${selectedZone === zone.id ? zone.color : zone.borderColor}`,
                  boxShadow: selectedZone === zone.id ? `0 0 30px ${zone.borderColor}` : undefined,
                }}
              >
                {/* Icons */}
                <div className="flex items-center gap-3 mb-6 text-white/60">
                  {zone.icon1}
                  {zone.icon2}
                </div>

                {/* Zone Name */}
                <h3 className="text-xl font-semibold text-white mb-1">{zone.name}</h3>
                <p className="text-white/50 text-sm mb-4">{zone.tagline}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {zone.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-sm bg-white/5 text-white/70 border border-white/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Bottom accent line */}
                <div
                  className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                  style={{ backgroundColor: zone.color }}
                />
              </button>
            ))}
          </div>

          {/* Bottom text */}
          <p className="text-center text-white/40 text-sm">
            Click a zone to enter and set up your profile
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * RGY Signal Icon Button - Tri-color dots
 * 
 * Signals keyword saves with brief pulse on active color:
 * - Default: muted/dim
 * - On keyword save: brief pulse (300-500ms)
 * - No animation loops, no constant glow
 */
interface RGYSignalButtonProps {
  onClick: () => void
  isDark?: boolean
  pulseColor?: 'RED' | 'YELLOW' | 'GREEN' | null
  compact?: boolean
}

export function RGYSignalButton({ onClick, isDark = true, pulseColor = null, compact = false }: RGYSignalButtonProps) {
  const [activePulse, setActivePulse] = useState<'RED' | 'YELLOW' | 'GREEN' | null>(null)

  // Handle pulse when pulseColor changes
  useEffect(() => {
    if (pulseColor) {
      setActivePulse(pulseColor)
      // Clear pulse after 400ms
      const timer = setTimeout(() => {
        setActivePulse(null)
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [pulseColor])

  const isRedActive = activePulse === 'RED'
  const isYellowActive = activePulse === 'YELLOW'
  const isGreenActive = activePulse === 'GREEN'

  return (
    <button
      onClick={onClick}
      data-testid="rgy-signal-button"
      className={`
        ${compact ? 'w-8 h-16 gap-1' : 'w-10 h-20 gap-1.5'}
        rounded-full
        flex flex-col items-center justify-center
        transition-all duration-200
        ${isDark
          ? 'bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] hover:bg-white/[0.05]'
          : 'bg-black/[0.03] backdrop-blur-sm border border-black/[0.06] hover:bg-black/[0.05]'
        }
      `}
    >
      {/* Red dot */}
      <div
        className="w-2.5 h-2.5 rounded-full transition-all duration-300"
        style={{
          backgroundColor: isRedActive ? '#ef4444' : 'rgba(239, 68, 68, 0.25)',
          boxShadow: isRedActive ? '0 0 12px rgba(239, 68, 68, 0.8)' : 'none',
          transform: isRedActive ? 'scale(1.3)' : 'scale(1)',
        }}
      />

      {/* Yellow dot */}
      <div
        className="w-2.5 h-2.5 rounded-full transition-all duration-300"
        style={{
          backgroundColor: isYellowActive ? '#eab308' : 'rgba(234, 179, 8, 0.25)',
          boxShadow: isYellowActive ? '0 0 12px rgba(234, 179, 8, 0.8)' : 'none',
          transform: isYellowActive ? 'scale(1.3)' : 'scale(1)',
        }}
      />

      {/* Green dot */}
      <div
        className="w-2.5 h-2.5 rounded-full transition-all duration-300"
        style={{
          backgroundColor: isGreenActive ? '#22c55e' : 'rgba(34, 197, 94, 0.25)',
          boxShadow: isGreenActive ? '0 0 12px rgba(34, 197, 94, 0.8)' : 'none',
          transform: isGreenActive ? 'scale(1.3)' : 'scale(1)',
        }}
      />
    </button>
  )
}

export default RGYChatsModal
