'use client'

/**
 * FullscreenApp - Fullscreen cube layout like cubiqo.ai
 */

import { useState, useCallback } from 'react'
import { CubeScene } from './cube'
import { ChatContainer } from './chat'
import { LoginForm, AuthStatus } from './auth'
import { useSession } from '@/hooks/useSession'
import { useAuth } from '@/hooks/useAuth'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useChat } from '@/hooks/useChat'
import type { ColorName } from '@/config/colors'
import type { AnimationState } from './cube/Cube'

export function FullscreenApp() {
  const { session, isGuest } = useSession()
  const { user, isAuthenticated, signOut } = useAuth()
  const [colorName, setColorName] = useState<ColorName>('ORANGE')
  const [animationState, setAnimationState] = useState<AnimationState>('idle')
  const [menuOpen, setMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  const { sendMessage, conversationHistory, isLoading } = useChat({
    sessionId: session?.id ?? null,
    onColorChange: setColorName
  })

  const {
    startListening,
    stopListening,
    isListening,
    isSupported: voiceSupported,
    transcript
  } = useSpeechRecognition({
    lang: 'en-US',
    onResult: async (text) => {
      setAnimationState('thinking')
      await sendMessage(text, colorName)
      setAnimationState('idle')
    }
  })

  const handleColorChange = useCallback((newColor: ColorName) => {
    setColorName(newColor)
  }, [])

  const handleSpeakingChange = useCallback((isSpeaking: boolean) => {
    setAnimationState(isSpeaking ? 'speaking' : 'idle')
  }, [])

  const toggleMic = useCallback(() => {
    if (isListening) {
      stopListening()
      setAnimationState('idle')
    } else {
      startListening()
      setAnimationState('listening')
    }
  }, [isListening, startListening, stopListening])

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Fullscreen Cube Canvas */}
      <div className="absolute inset-0 z-0">
        <CubeScene colorName={colorName} animationState={animationState} />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3">
        {/* Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo */}
        <h1 className="text-white font-semibold text-lg">CubiQo</h1>

        {/* Guest Badge / User */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <span className="text-xs text-white/70">{user?.email?.split('@')[0]}</span>
          ) : (
            <span className="px-2 py-1 text-xs rounded-full bg-white/10 text-white/70">
              Guest
            </span>
          )}
        </div>
      </header>

      {/* Voice Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20">
        {voiceSupported ? (
          <button
            onClick={toggleMic}
            disabled={isLoading}
            className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isListening
                ? 'bg-red-500 animate-pulse scale-110'
                : isLoading
                ? 'bg-orange-500 animate-pulse'
                : 'bg-gradient-to-br from-orange-500 to-red-500 hover:scale-105'
            }`}
          >
            {isLoading ? (
              <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
        ) : (
          <button
            onClick={() => setChatOpen(true)}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center hover:scale-105 transition-all shadow-lg"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        )}

        {/* Listening indicator */}
        {isListening && transcript && (
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/80 rounded-lg text-white text-sm max-w-xs text-center">
            {transcript}
          </div>
        )}
      </div>

      {/* Status text */}
      <div className="fixed bottom-4 right-4 z-10 text-white/40 text-xs">
        {colorName === 'GREEN_BLUE' ? 'Sattva' :
         colorName === 'ORANGE' ? 'Fourth Way' :
         colorName === 'RED' ? 'Tamas' : 'Rajas'}
      </div>

      {/* Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-zinc-900 p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-lg font-semibold">Menu</h2>
              <button onClick={() => setMenuOpen(false)} className="text-white/60 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menu Items */}
            <nav className="space-y-2 mb-6">
              <button
                onClick={() => { setChatOpen(true); setMenuOpen(false); }}
                className="w-full text-left px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Chat History
              </button>
            </nav>

            {/* Auth Section */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-white/60 text-sm mb-4">Account</h3>
              {isAuthenticated ? (
                <div className="space-y-3">
                  <p className="text-white text-sm">{user?.email}</p>
                  <button
                    onClick={() => signOut()}
                    className="w-full px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <AuthStatus />
                  <LoginForm />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Overlay */}
      {chatOpen && (
        <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm" onClick={() => setChatOpen(false)}>
          <div
            className="absolute right-0 top-0 bottom-0 w-[500px] max-w-full bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-white font-semibold">Chat</h2>
              <button onClick={() => setChatOpen(false)} className="text-white/60 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="h-[calc(100%-60px)]">
              <ChatContainer
                sessionId={session?.id ?? null}
                currentColor={colorName}
                onColorChange={handleColorChange}
                onSpeakingChange={handleSpeakingChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
