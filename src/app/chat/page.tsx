'use client'

/**
 * Chat Page - Text-based chat interface
 */

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ChatContainer } from '@/components/chat'
import { CubeScene } from '@/components/cube'
import { AdminControls } from '@/components/admin'
import { JourneyMemoryPrompt } from '@/components/journey'
import { useSession } from '@/hooks/useSession'
import type { ColorName } from '@/config/colors'
import type { AnimationState } from '@/components/cube/Cube'

export default function ChatPage() {
  const { session } = useSession()
  const [colorName, setColorName] = useState<ColorName>('ORANGE')
  const [animationState, setAnimationState] = useState<AnimationState>('idle')

  const handleSpeakingChange = useCallback((isSpeaking: boolean) => {
    setAnimationState(isSpeaking ? 'speaking' : 'idle')
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Admin Controls */}
      <AdminControls />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-[rgba(10,10,15,0.75)] backdrop-blur-[16px] border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">Q</span>
            </div>
            <span className="font-bold tracking-widest text-sm">CubiQo™</span>
          </Link>

          <Link
            href="/"
            className="text-xs px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] transition-colors"
          >
            Voice Mode
          </Link>
          <Link
            href="/journal"
            className="text-xs px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500/80 to-orange-600/80 hover:from-orange-500 hover:to-orange-600 border border-orange-400/30 transition-colors font-medium"
          >
            📝 Journal
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
            />
          </div>
        </div>
        
        {/* Journey Memory Prompt */}
        <JourneyMemoryPrompt position="bottom-left" />
      </main>
    </div>
  )
}
