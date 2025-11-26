'use client'

/**
 * FullscreenApp - Exact replica of legacy cubiqo.ai design
 */

import { useState, useCallback, useEffect } from 'react'
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
  const [isDark, setIsDark] = useState(true)

  const { sendMessage, isLoading } = useChat({
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

  // Theme persistence
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDark(stored === 'dark' || (!stored && prefersDark))
  }, [])

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const newValue = !prev
      localStorage.setItem('theme', newValue ? 'dark' : 'light')
      return newValue
    })
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

  const bgColor = isDark ? '#050505' : '#ffffff'
  const textColor = isDark ? '#ffffff' : '#111111'

  return (
    <div
      className="fixed inset-0 overflow-hidden transition-colors duration-400"
      style={{ background: bgColor, color: textColor }}
    >
      {/* Fullscreen Cube Canvas */}
      <div className="absolute inset-0 z-[1]">
        <CubeScene colorName={colorName} animationState={animationState} />
      </div>

      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-[12px] transition-colors duration-400 ${
          isDark
            ? 'bg-[rgba(5,5,5,0.7)] border-b border-white/10'
            : 'bg-[rgba(255,255,255,0.8)] border-b border-black/10'
        }`}
      >
        <div className="flex justify-between items-center w-full">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <span className="text-white text-xs sm:text-sm font-bold">Q</span>
            </div>
            <span className="font-bold tracking-widest text-sm sm:text-base">CubiQo™</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-4">
            <span className={`text-xs hidden md:block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              CubiQo™ for simulating conversations
            </span>

            {/* Menu Button (for chat/auth) */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`text-xs font-medium px-3 py-2 rounded-lg transition-all ${
                isDark
                  ? 'bg-white/[0.08] border border-white/20 text-white hover:bg-white/15'
                  : 'bg-black/[0.05] border border-black/15 text-gray-800 hover:bg-black/10'
              }`}
            >
              Menu
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`text-xs font-medium px-3 py-2 rounded-lg backdrop-blur-lg transition-all flex items-center gap-1.5 ${
                isDark
                  ? 'bg-white/[0.08] border border-white/20 text-white hover:bg-white/15'
                  : 'bg-black/[0.05] border border-black/15 text-gray-800 hover:bg-black/10'
              }`}
            >
              <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>

        {/* Mobile subtitle */}
        <div className={`text-xs text-center mt-2 md:hidden ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          CubiQo™ for simulating conversations
        </div>
      </header>

      {/* Voice Button */}
      <div className="fixed bottom-[90px] left-1/2 -translate-x-1/2 z-[60]">
        <button
          onClick={toggleMic}
          disabled={isLoading || !voiceSupported}
          className={`
            w-[56px] h-[56px] sm:w-[72px] sm:h-[72px]
            rounded-full flex items-center justify-center
            transition-all duration-300 cursor-pointer
            ${isListening
              ? 'scale-105 shadow-[0_0_0_8px_rgba(59,130,246,0.2)]'
              : 'hover:scale-105'
            }
            ${isDark
              ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/40 text-white/95 shadow-[0_8px_32px_rgba(59,130,246,0.3)]'
              : 'bg-gradient-to-br from-blue-500/15 to-purple-500/15 border-2 border-blue-500/50 text-blue-800 shadow-[0_8px_32px_rgba(59,130,246,0.25)]'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          style={{
            boxShadow: isListening
              ? '0 8px 32px rgba(59, 130, 246, 0.4), 0 0 0 8px rgba(59, 130, 246, 0.1)'
              : undefined
          }}
        >
          {isLoading ? (
            <svg className="w-6 h-6 sm:w-7 sm:h-7 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 1.5a3 3 0 013 3v7a3 3 0 01-6 0v-7a3 3 0 013-3zM19.5 10.5a7.5 7.5 0 01-15 0M12 19.5v3" />
            </svg>
          )}
        </button>
      </div>

      {/* Talk to Cubiqo text */}
      <div
        className={`fixed bottom-[55px] sm:bottom-[55px] left-1/2 -translate-x-1/2 z-50 text-[13px] sm:text-[15px] font-medium tracking-wide pointer-events-none ${
          isDark ? 'text-white/90' : 'text-black/80'
        }`}
      >
        {isListening ? (transcript || 'Listening...') : 'Talk to Cubiqo™'}
      </div>

      {/* Footer */}
      <footer
        className={`fixed bottom-4 right-4 sm:right-6 z-50 text-right text-[9px] sm:text-[11px] leading-relaxed pointer-events-none ${
          isDark ? 'text-white/50' : 'text-black/70'
        }`}
      >
        <p>Providing temporary use of online non-downloadable<br />AI chatbot software.</p>
        <p>© 2025 Cubiqo United Inc., Jersey City, NJ.</p>
        <p>All rights reserved.</p>
      </footer>

      {/* Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>
          <div
            className={`absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] p-6 overflow-y-auto ${
              isDark ? 'bg-zinc-900' : 'bg-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button onClick={() => setMenuOpen(false)} className="opacity-60 hover:opacity-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Auth Section */}
            <div className={`border-t pt-6 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              <h3 className="text-sm opacity-60 mb-4">Account</h3>
              {isAuthenticated ? (
                <div className="space-y-3">
                  <p className="text-sm">{user?.email}</p>
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

            {/* Chat Section */}
            <div className={`border-t pt-6 mt-6 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              <h3 className="text-sm opacity-60 mb-4">Chat History</h3>
              <div className="h-[300px]">
                <ChatContainer
                  sessionId={session?.id ?? null}
                  currentColor={colorName}
                  onColorChange={setColorName}
                  onSpeakingChange={handleSpeakingChange}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
