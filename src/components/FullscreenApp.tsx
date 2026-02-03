'use client'

/**
 * FullscreenApp - Exact replica of legacy cubiqo.ai design
 * With proper state machine: idle → listening → thinking → speaking → idle
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { CubeScene, EnergyCubeScene } from './cube'
import { LoginForm, AuthNudgeModal } from './auth'
import { BYOSettings } from './byo'
import { KeywordPanel } from './KeywordPanel'
import { RGYSignalButton, RGYChatsModal } from './RGYChatsModal'
import { useSession } from '@/hooks/useSession'
import { useAuth } from '@/hooks/useAuth'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useElevenLabsTTS } from '@/hooks/useElevenLabsTTS'
import { useChat } from '@/hooks/useChat'
import { useBYO } from '@/hooks/useBYO'
import type { ColorName } from '@/config/colors'
import type { AnimationState } from './cube/Cube'

// App states matching legacy
type AppState = 'idle' | 'listening' | 'thinking' | 'speaking'

export function FullscreenApp() {
  const { session, isGuest, isLoading: sessionLoading } = useSession()
  const { user, isAuthenticated, signOut } = useAuth()

  const [colorName, setColorName] = useState<ColorName>('ORANGE')
  const [animationState, setAnimationState] = useState<AnimationState>('idle')
  const [menuOpen, setMenuOpen] = useState(false)
  const [showAuthForm, setShowAuthForm] = useState(false)
  const [showNudgeModal, setShowNudgeModal] = useState(false)
  const [nudgeCta, setNudgeCta] = useState('')
  const [isDark, setIsDark] = useState(true)
  const [showBYOSettings, setShowBYOSettings] = useState(false)
  
  // UI panels
  const [showKeywordPanel, setShowKeywordPanel] = useState(false)
  const [showRGYChats, setShowRGYChats] = useState(false)

  // BYO Mode
  const { isBYOEnabled } = useBYO()

  // State machine (matching legacy)
  const [appState, setAppState] = useState<AppState>('idle')
  const appStateRef = useRef<AppState>('idle')

  // Keep ref in sync for callbacks
  useEffect(() => {
    appStateRef.current = appState
  }, [appState])

  const { sendMessage, isInitialized: chatInitialized } = useChat({
    sessionId: session?.id ?? null,
    isGuest,
    onColorChange: setColorName
  })

  // Track if we should show auth nudge modal after speaking
  const nudgeCtaRef = useRef<string | null>(null)

  // TTS for AI responses - Using ElevenLabs for natural voice
  const { speak, stop: stopSpeaking, isSpeaking, error: ttsError } = useElevenLabsTTS({
    colorName,
    onStart: () => {
      setAppState('speaking')
      setAnimationState('speaking')
    },
    onEnd: () => {
      setAppState('idle')
      setAnimationState('idle')

      // Show auth nudge modal if AI suggested sign-in
      if (nudgeCtaRef.current) {
        setNudgeCta(nudgeCtaRef.current)
        setShowNudgeModal(true)
        nudgeCtaRef.current = null
      }
    }
  })

  // Log TTS errors
  useEffect(() => {
    if (ttsError) console.error('[TTS] Error:', ttsError)
  }, [ttsError])

  const {
    startListening,
    stopListening,
    isSupported: voiceSupported,
    transcript
  } = useSpeechRecognition({
    lang: 'en-US',
    onResult: async (text) => {
      // Transition: listening → thinking
      setAppState('thinking')
      setAnimationState('thinking')

      try {
        const response = await sendMessage(text, colorName)

        if (response?.response) {
          let responseText = response.response

          // Check for auth nudge marker [AUTH_NUDGE:CTA]
          const nudgeMatch = responseText.match(/\[AUTH_NUDGE:([^\]]+)\]/)
          if (nudgeMatch) {
            nudgeCtaRef.current = nudgeMatch[1].trim()
            responseText = responseText.replace(nudgeMatch[0], '').trim()
          } else if (responseText.includes('[AUTH_NUDGE]')) {
            // Fallback for old format
            nudgeCtaRef.current = "Let's stay connected"
            responseText = responseText.replace('[AUTH_NUDGE]', '').trim()
          }

          // Transition: thinking → speaking (handled by TTS onStart)
          speak(responseText)
        } else {
          // No response, back to idle
          setAppState('idle')
          setAnimationState('idle')
        }
      } catch (error) {
        console.error('AI Error:', error)
        setAppState('idle')
        setAnimationState('idle')
      }
    },
    onEnd: () => {
      // If still in listening state when recognition ends (no result)
      if (appStateRef.current === 'listening') {
        setAppState('idle')
        setAnimationState('idle')
      }
    }
  })

  // Theme persistence - default to dark
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    setIsDark(stored !== 'light') // Dark by default unless explicitly set to light
  }, [])

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const newValue = !prev
      localStorage.setItem('theme', newValue ? 'dark' : 'light')
      return newValue
    })
  }, [])

  // Voice button click handler - state machine logic (matching legacy)
  const handleVoiceClick = useCallback(() => {
    // Don't allow voice input if chat isn't initialized
    if (!chatInitialized) return

    switch (appStateRef.current) {
      case 'idle':
        // Start listening
        setAppState('listening')
        setAnimationState('listening')
        startListening()
        break

      case 'listening':
        // Stop listening, return to idle
        setAppState('idle')
        setAnimationState('idle')
        stopListening()
        break

      case 'thinking':
        // Cannot interrupt AI thinking
        break

      case 'speaking':
        // Stop speaking, return to idle
        setAppState('idle')
        setAnimationState('idle')
        stopSpeaking()
        break
    }
  }, [chatInitialized, startListening, stopListening, stopSpeaking])

  const bgColor = isDark ? '#050505' : '#ffffff'
  const textColor = isDark ? '#ffffff' : '#111111'

  return (
    <div
      className="fixed inset-0 overflow-hidden transition-colors duration-400"
      style={{ background: bgColor, color: textColor }}
    >
      {/* Fullscreen Energy Cube Canvas */}
      <div className="absolute inset-0 z-[1]">
        <EnergyCubeScene colorName={colorName} animationState={animationState} />
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
          {/* Logo - Colorful Cube Icon + CubiQo Text */}
          <div className="flex items-center gap-3">
            <img 
              src="https://customer-assets.emergentagent.com/job_react-energy-cube/artifacts/zuvwrv2g_cubiqo_favicon_512.png" 
              alt="CubiQo" 
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
            />
            <div className="flex items-start">
              <span className={`text-xl sm:text-2xl font-semibold tracking-tight ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                CubiQo
              </span>
              <span className={`text-[8px] sm:text-[10px] font-medium ml-0.5 -mt-0.5 ${
                isDark ? 'text-white/60' : 'text-gray-500'
              }`}>
                TM
              </span>
            </div>
          </div>

          {/* Center - Keywords & Menu (more intuitive placement) */}
          <div className="flex items-center gap-8 sm:gap-12">
            {/* Keywords */}
            <div className="relative group">
              <button
                onClick={() => setShowKeywordPanel(true)}
                data-testid="keywords-button"
                className={`text-sm font-medium transition-all pb-0.5 ${
                  isDark ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Keywords
              </button>
              {/* Tooltip */}
              <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 ${
                isDark ? 'bg-zinc-800 text-white/80 border border-white/10' : 'bg-white text-gray-700 border border-gray-200 shadow-lg'
              }`}>
                the way cubiqo knows you
              </div>
            </div>

            {/* Menu */}
            <div className="relative group">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                data-testid="menu-button"
                className={`text-sm font-medium transition-all pb-0.5 ${
                  isDark ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Menu
              </button>
              {/* Tooltip */}
              <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 ${
                isDark ? 'bg-zinc-800 text-white/80 border border-white/10' : 'bg-white text-gray-700 border border-gray-200 shadow-lg'
              }`}>
                check out buy your own mode
              </div>
            </div>
          </div>

          {/* Right side - Empty for balance */}
          <div className="w-24 sm:w-32" />
        </div>
      </header>

      {/* RGY Signal Button - Right side */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-[60]">
        <RGYSignalButton 
          onClick={() => setShowRGYChats(true)} 
          isDark={isDark}
        />
      </div>

      {/* Voice Button - Fancy Golden Mic */}
      <div className="fixed bottom-[90px] left-1/2 -translate-x-1/2 z-[60]">
        <button
          onClick={handleVoiceClick}
          disabled={!voiceSupported}
          className={`
            w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]
            rounded-full flex items-center justify-center
            transition-all duration-300 cursor-pointer
            ${appState === 'listening'
              ? 'scale-110 shadow-[0_0_0_8px_rgba(212,175,55,0.4)] animate-pulse'
              : appState === 'thinking'
              ? 'scale-105'
              : appState === 'speaking'
              ? 'scale-105 shadow-[0_0_0_8px_rgba(212,175,55,0.3)]'
              : 'hover:scale-105'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          style={{
            background: 'linear-gradient(145deg, #d4af37, #b8860b, #8b6914)',
            boxShadow: appState === 'idle' 
              ? '0 8px 32px rgba(212, 175, 55, 0.4), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)'
              : '0 12px 40px rgba(212, 175, 55, 0.5), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)',
            border: '2px solid rgba(255, 215, 0, 0.5)'
          }}
        >
          {/* Golden Mic SVG */}
          <svg 
            className="w-7 h-7 sm:w-9 sm:h-9" 
            viewBox="0 0 24 24" 
            fill="none"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
          >
            {/* Mic body */}
            <rect x="9" y="2" width="6" height="12" rx="3" fill="url(#goldGradient)" />
            {/* Mic grille lines */}
            <line x1="10" y1="5" x2="14" y2="5" stroke="rgba(139,69,19,0.4)" strokeWidth="0.5" />
            <line x1="10" y1="7" x2="14" y2="7" stroke="rgba(139,69,19,0.4)" strokeWidth="0.5" />
            <line x1="10" y1="9" x2="14" y2="9" stroke="rgba(139,69,19,0.4)" strokeWidth="0.5" />
            {/* Mic stand curve */}
            <path 
              d="M5 11a7 7 0 0014 0" 
              stroke="url(#goldGradient)" 
              strokeWidth="2" 
              strokeLinecap="round"
              fill="none"
            />
            {/* Mic stand */}
            <line x1="12" y1="18" x2="12" y2="22" stroke="url(#goldGradient)" strokeWidth="2" strokeLinecap="round" />
            {/* Base */}
            <line x1="8" y1="22" x2="16" y2="22" stroke="url(#goldGradient)" strokeWidth="2" strokeLinecap="round" />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff8dc" />
                <stop offset="50%" stopColor="#ffd700" />
                <stop offset="100%" stopColor="#b8860b" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* State indicators */}
          {appState === 'listening' && (
            <div className="absolute inset-0 rounded-full border-4 border-yellow-300 animate-ping opacity-30" />
          )}
        </button>
      </div>

      {/* Status text - state-based */}
      <div
        className={`fixed bottom-[55px] sm:bottom-[55px] left-1/2 -translate-x-1/2 z-50 text-[13px] sm:text-[15px] font-medium tracking-wide pointer-events-none ${
          isDark ? 'text-white' : 'text-black'
        }`}
        style={{ textShadow: isDark ? '0 2px 8px rgba(0,0,0,0.8)' : '0 2px 8px rgba(255,255,255,0.8)' }}
      >
        {!chatInitialized && 'Connecting...'}
        {chatInitialized && appState === 'idle' && 'Talk to Cubiqo™'}
        {chatInitialized && appState === 'listening' && (transcript || 'Listening...')}
        {chatInitialized && appState === 'thinking' && 'Thinking...'}
        {chatInitialized && appState === 'speaking' && 'Speaking...'}
      </div>

      {/* Footer */}
      <footer
        className={`fixed bottom-4 right-4 sm:right-6 z-50 text-right text-[9px] sm:text-[11px] leading-relaxed pointer-events-none ${
          isDark ? 'text-white/70' : 'text-black/80'
        }`}
        style={{ textShadow: isDark ? '0 1px 4px rgba(0,0,0,0.9)' : '0 1px 4px rgba(255,255,255,0.9)' }}
      >
        <p>Providing temporary use of online non-downloadable<br />AI chatbot software.</p>
        <p>© 2025 Cubiqo United Inc., Jersey City, NJ.</p>
        <p>All rights reserved.</p>
      </footer>

      {/* Menu Overlay - Simplified */}
      {menuOpen && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>
          <div
            className={`absolute right-0 top-0 bottom-0 w-80 max-w-[90vw] flex flex-col transform transition-transform duration-300 ease-out ${
              isDark ? 'bg-zinc-900' : 'bg-white'
            }`}
            style={{ animation: 'slideInRight 0.3s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button 
                onClick={() => setMenuOpen(false)} 
                className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-white/10 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Mode Selection */}
              <div>
                <h3 className={`text-xs uppercase tracking-wider mb-3 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                  Mode
                </h3>
                <div className="space-y-1">
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                      isDark ? 'bg-white/10 text-white' : 'bg-blue-50 text-blue-900'
                    }`}
                  >
                    <span className="text-lg">🎤</span>
                    <span className="font-medium">Voice Mode</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                    }`}>active</span>
                  </div>
                  <a
                    href="/chat"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isDark ? 'hover:bg-white/5 text-white/70' : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <span className="text-lg">💬</span>
                    <span>Chat Mode</span>
                  </a>
                </div>
              </div>

              {/* Theme */}
              <div>
                <h3 className={`text-xs uppercase tracking-wider mb-3 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                  Appearance
                </h3>
                <button
                  onClick={toggleTheme}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                    isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-lg">{isDark ? '🌙' : '☀️'}</span>
                    <span>Theme</span>
                  </span>
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    isDark ? 'bg-white/10 text-white/70' : 'bg-gray-200 text-gray-600'
                  }`}>{isDark ? 'Dark' : 'Light'}</span>
                </button>
              </div>

              {/* BYO Mode */}
              <div>
                <h3 className={`text-xs uppercase tracking-wider mb-3 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                  Advanced
                </h3>
                <button
                  onClick={() => setShowBYOSettings(!showBYOSettings)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                    isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-lg">🔑</span>
                    <span>BYO Mode</span>
                  </span>
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    isBYOEnabled 
                      ? 'bg-green-500/20 text-green-400' 
                      : isDark ? 'bg-white/10 text-white/50' : 'bg-gray-200 text-gray-500'
                  }`}>{isBYOEnabled ? 'ON' : 'OFF'}</span>
                </button>

                {showBYOSettings && (
                  <div className={`mt-2 rounded-xl overflow-hidden ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <BYOSettings onClose={() => setShowBYOSettings(false)} />
                  </div>
                )}
              </div>

              {/* Account */}
              <div className={`border-t pt-6 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <h3 className={`text-xs uppercase tracking-wider mb-3 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                  Account
                </h3>

                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                      isDark ? 'bg-white/5' : 'bg-gray-50'
                    }`}>
                      <span className="text-lg">👤</span>
                      <span className="text-sm truncate">{user?.email}</span>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className={`w-full text-left px-4 py-3 rounded-xl text-red-400 transition-colors ${
                        isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                      }`}
                    >
                      Sign Out
                    </button>
                  </div>
                ) : showAuthForm ? (
                  <div className="space-y-4">
                    <LoginForm />
                    <button
                      onClick={() => setShowAuthForm(false)}
                      className="w-full text-center text-xs opacity-50 hover:opacity-80"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowAuthForm(true)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-lg">✉️</span>
                      <span>Email</span>
                    </button>
                    <button
                      onClick={() => setShowAuthForm(true)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        isDark ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400' : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                      }`}
                    >
                      <span className="text-lg">✨</span>
                      <span>Send Magic Link</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <style jsx global>{`
            @keyframes slideInRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>
        </div>
      )}

      {/* Auth Nudge Modal */}
      <AuthNudgeModal
        isOpen={showNudgeModal}
        onClose={() => setShowNudgeModal(false)}
        cta={nudgeCta}
      />

      {/* Keyword Panel (Right side - slides in smoothly) */}
      <KeywordPanel
        isOpen={showKeywordPanel}
        onClose={() => setShowKeywordPanel(false)}
        isDark={isDark}
      />

      {/* RGY Chats Modal */}
      <RGYChatsModal
        isOpen={showRGYChats}
        onClose={() => setShowRGYChats(false)}
        isDark={isDark}
      />
    </div>
  )
}
