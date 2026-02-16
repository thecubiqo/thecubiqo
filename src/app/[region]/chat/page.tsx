'use client'

/**
 * Regional Chat Page - Text-based chat interface with regional context
 */

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ChatContainer } from '@/components/chat'
import { CubeScene } from '@/components/cube'
import { RegionBadge } from '@/components/RegionBadge'
import { JourneyMemoryPrompt } from '@/components/journey'
import { AdminControls } from '@/components/admin'
import { useSession } from '@/hooks/useSession'
import { useRegion } from '@/contexts/RegionContext'
import type { ColorName } from '@/config/colors'
import type { AnimationState } from '@/components/cube/Cube'

export default function RegionalChatPage() {
  const { session } = useSession()
  const { regionId, config } = useRegion()
  const [colorName, setColorName] = useState<ColorName>(
    config?.appearance.defaultColor || 'ORANGE'
  )
  const [animationState, setAnimationState] = useState<AnimationState>('idle')

  const handleSpeakingChange = useCallback((isSpeaking: boolean) => {
    setAnimationState(isSpeaking ? 'speaking' : 'idle')
  }, [])

  // Back link goes to regional home
  const homeLink = regionId ? `/${regionId}` : '/'

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Admin Controls */}
      <AdminControls />
      
      {/* Region Badge (dev only) */}
      <RegionBadge />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-zinc-950/90 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href={homeLink} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">Q</span>
            </div>
            <span className="font-bold tracking-widest text-sm">CubiQo™</span>
          </Link>

          <Link
            href={homeLink}
            className="text-xs px-3 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/15 transition-colors"
          >
            Voice Mode
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 pb-4 px-4">
        <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-4 h-[calc(100vh-5rem)]">
          {/* Mini Cube */}
          <div className="hidden lg:flex flex-col">
            <div className="flex-1 rounded-xl overflow-hidden bg-black/50 border border-white/10">
              <CubeScene colorName={colorName} animationState={animationState} />
            </div>
            <div className="mt-2 text-center text-xs text-white/50">
              Mood: <span className="text-white/80">{colorName === 'GREEN_BLUE' ? 'Sattva' : colorName === 'ORANGE' ? 'Fourth Way' : colorName === 'RED' ? 'Tamas' : 'Rajas'}</span>
            </div>
          </div>

          {/* Chat */}
          <div className="flex flex-col h-full">
            <ChatContainer
              sessionId={session?.id ?? null}
              currentColor={colorName}
              onColorChange={setColorName}
              onSpeakingChange={handleSpeakingChange}
              regionId={regionId}
            />
          </div>
        </div>

        {/* Journey Memory Prompt */}
        <JourneyMemoryPrompt position="bottom-left" />
      </main>
    </div>
  )
}
