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
import { RGYChatGatewayButton, RGYChatGatewayModal } from './RGYChatGateway'
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
  
  // New UI panels
  const [showKeywordPanel, setShowKeywordPanel] = useState(false)
  const [showRGYGateway, setShowRGYGateway] = useState(false)

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
          {/* Logo - Bigger & More Legible */}
          <div className="flex items-center">
            <div 
              className="relative transition-opacity duration-200 hover:opacity-96"
              style={{
                filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5))'
              }}
            >
              <img 
                src="https://customer-assets.emergentagent.com/job_react-energy-cube/artifacts/3fc6c2dr_Copilot_20260120_084239.png" 
                alt="CubiQo" 
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                style={{
                  imageRendering: 'crisp-edges'
                }}
              />
            </div>
          </div>

          {/* Right side - Tabs (not buttons) */}
          <div className="flex items-center gap-6 sm:gap-8">
            {/* Keywords Tab */}
            <div className="relative group">
              <button
                onClick={() => setShowKeywordPanel(true)}
                data-testid="keywords-button"
                className={`text-sm font-medium transition-all border-b-2 border-transparent hover:border-current pb-1 ${
                  isDark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Keywords
              </button>
              {/* Tooltip */}
              <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${
                isDark ? 'bg-white/10 text-white/80' : 'bg-black/10 text-gray-700'
              }`}>
                the way cubiqo knows you
              </div>
            </div>

            {/* Menu Tab */}
            <div className="relative group">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                data-testid="menu-button"
                className={`text-sm font-medium transition-all border-b-2 border-transparent hover:border-current pb-1 ${
                  isDark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Menu
              </button>
              {/* Tooltip */}
              <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${
                isDark ? 'bg-white/10 text-white/80' : 'bg-black/10 text-gray-700'
              }`}>
                check out buy your own mode
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* RGY Gateway Button - Moved UP on the page */}
      <div className="fixed right-4 top-32 z-[60]">
        <RGYChatGatewayButton 
          onOpen={() => setShowRGYGateway(true)} 
          isDark={isDark} 
        />
      </div>

      {/* Voice Button - State-based visual feedback */}
      <div className="fixed bottom-[90px] left-1/2 -translate-x-1/2 z-[60]">
        <button
          onClick={handleVoiceClick}
          disabled={!voiceSupported}
          className={`
            w-[56px] h-[56px] sm:w-[72px] sm:h-[72px]
            rounded-full flex items-center justify-center
            transition-all duration-300 cursor-pointer
            text-2xl sm:text-3xl
            ${appState === 'listening'
              ? 'scale-110 shadow-[0_0_0_8px_rgba(59,130,246,0.3)] animate-pulse'
              : appState === 'thinking'
              ? 'scale-105'
              : appState === 'speaking'
              ? 'scale-105 shadow-[0_0_0_8px_rgba(34,197,94,0.2)]'
              : 'hover:scale-105'
            }
            ${isDark
              ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/40 shadow-[0_8px_32px_rgba(59,130,246,0.3)]'
              : 'bg-gradient-to-br from-blue-500/15 to-purple-500/15 border-2 border-blue-500/50 shadow-[0_8px_32px_rgba(59,130,246,0.25)]'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {appState === 'idle' && (
            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 1.5a3 3 0 013 3v7a3 3 0 01-6 0v-7a3 3 0 013-3zM19.5 10.5a7.5 7.5 0 01-15 0M12 19.5v3" />
            </svg>
          )}
          {appState === 'listening' && '🎙️'}
          {appState === 'thinking' && '💭'}
          {appState === 'speaking' && '🗣️'}
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
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>
          <div
            className={`absolute right-0 top-0 bottom-0 w-72 max-w-[85vw] flex flex-col ${
              isDark ? 'bg-zinc-900' : 'bg-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Fixed */}
            <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button onClick={() => setMenuOpen(false)} className="opacity-60 hover:opacity-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">

            {/* Navigation */}
            <nav className="space-y-2 mb-8">
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                  isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black'
                }`}
              >
                <span>🎤</span>
                <span className="font-medium">Voice Mode</span>
                <span className="ml-auto text-xs opacity-50">current</span>
              </div>

              <a
                href="/chat"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-white/10 text-white/70' : 'hover:bg-black/5 text-black/70'
                }`}
              >
                <span>💬</span>
                <span>Chat Mode</span>
              </a>
            </nav>

            {/* Settings */}
            <div className={`border-t pt-6 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              <h3 className="text-xs uppercase tracking-wider opacity-50 mb-4">Settings</h3>

              <button
                onClick={toggleTheme}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span>{isDark ? '🌙' : '☀️'}</span>
                  <span>Theme</span>
                </span>
                <span className="text-sm opacity-60">{isDark ? 'Dark' : 'Light'}</span>
              </button>

              {/* BYO Mode */}
              <button
                onClick={() => setShowBYOSettings(!showBYOSettings)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span>🔑</span>
                  <span>BYO Mode</span>
                </span>
                <span className={`text-sm ${isBYOEnabled ? 'text-green-400' : 'opacity-50'}`}>
                  {isBYOEnabled ? 'ON' : 'OFF'}
                </span>
              </button>

              {showBYOSettings && (
                <div className={`mt-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                  <BYOSettings onClose={() => setShowBYOSettings(false)} />
                </div>
              )}
            </div>

            {/* Account */}
            <div className={`border-t pt-6 mt-6 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              <h3 className="text-xs uppercase tracking-wider opacity-50 mb-4">Account</h3>

              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span>👤</span>
                    <span className="text-sm truncate">{user?.email}</span>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className={`w-full text-left px-4 py-3 rounded-lg text-red-400 transition-colors ${
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
                <button
                  onClick={() => setShowAuthForm(true)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                  }`}
                >
                  <span>🔑</span>
                  <span>Sign In</span>
                  <span className="ml-auto text-xs opacity-50">Save history</span>
                </button>
              )}
            </div>
            </div>{/* End Scrollable Content */}
          </div>
        </div>
      )}

      {/* Auth Nudge Modal */}
      <AuthNudgeModal
        isOpen={showNudgeModal}
        onClose={() => setShowNudgeModal(false)}
        cta={nudgeCta}
      />

      {/* Keyword Panel (Left side) */}
      <KeywordPanel
        isOpen={showKeywordPanel}
        onClose={() => setShowKeywordPanel(false)}
        isDark={isDark}
      />

      {/* RGY Chat Gateway Modal */}
      <RGYChatGatewayModal
        isOpen={showRGYGateway}
        onClose={() => setShowRGYGateway(false)}
        isDark={isDark}
      />

      {/* Bottom Center Tagline */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[40] text-center ${
        isDark ? 'text-white/50' : 'text-gray-500'
      }`}>
        <p className="text-xs sm:text-sm tracking-wide">
          CubiQo™ for simulating conversations
        </p>
      </div>
    </div>
  )
}
