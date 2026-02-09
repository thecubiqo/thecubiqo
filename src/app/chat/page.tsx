'use client'

/**
 * Chat Page - Text-based chat interface with navigation
 */

import { useState, useCallback } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { ChatContainer } from '@/components/chat'
import { CubeScene } from '@/components/cube'
import { PoweredByLogosCompact } from '@/components/PoweredByLogos'
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
    <AppLayout>
      <div className="min-h-screen text-white">
        {/* Main Content */}
        <main className="p-4">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-4 h-[calc(100vh-2rem)]">
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
          
          {/* Powered By Logos - Bottom Center */}
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
            <PoweredByLogosCompact isDark={true} />
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
