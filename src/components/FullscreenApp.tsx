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
import { LandingCube } from './LandingCube'
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
  const [cubeSize, setCubeSize] = useState(100) // Cube size percentage (50-150)
  
  // UI panels
  const [showKeywordPanel, setShowKeywordPanel] = useState(false)
  const [showRGYChats, setShowRGYChats] = useState(false)
  const [showLandingCube, setShowLandingCube] = useState(false)

  // Load cube size from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('cubiqo_cube_size')
    if (stored) setCubeSize(parseInt(stored))
  }, [])

  // Save cube size to localStorage
  const handleCubeSizeChange = (size: number) => {
    setCubeSize(size)
    localStorage.setItem('cubiqo_cube_size', size.toString())
  }

  // Check if we should show landing cube (once per day or after 4+ hours)
  useEffect(() => {
    const LANDING_STORAGE_KEY = 'cubiqo_last_landing'
    const HOURS_THRESHOLD = 4
    
    const lastLanding = localStorage.getItem(LANDING_STORAGE_KEY)
    const now = Date.now()
    
    if (!lastLanding) {
      // First visit ever
      setShowLandingCube(true)
      localStorage.setItem(LANDING_STORAGE_KEY, now.toString())
    } else {
      const hoursSince = (now - parseInt(lastLanding)) / (1000 * 60 * 60)
      if (hoursSince >= HOURS_THRESHOLD) {
        setShowLandingCube(true)
        localStorage.setItem(LANDING_STORAGE_KEY, now.toString())
      }
    }
  }, [])

  const handleLandingComplete = useCallback(() => {
    setShowLandingCube(false)
  }, [])

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
  const { speak, stop: stopSpeaking, isSpeaking, error: ttsError, unlockAudio } = useElevenLabsTTS({
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
  const handleVoiceClick = useCallback(async () => {
    // Don't allow voice input if chat isn't initialized
    if (!chatInitialized) return

    // CRITICAL: Unlock audio on user gesture (browser requires this)
    // Must be done on every click to ensure audio context stays active
    await unlockAudio()

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
  }, [chatInitialized, startListening, stopListening, stopSpeaking, unlockAudio])

  const bgColor = isDark ? '#050505' : '#ffffff'
  const textColor = isDark ? '#ffffff' : '#111111'

  return (
    <div
      className="fixed inset-0 overflow-hidden transition-colors duration-400"
      style={{ background: bgColor, color: textColor }}
    >
      {/* Fullscreen Energy Cube Canvas */}
      <div 
        className="absolute inset-0 z-[1] flex items-center justify-center"
        style={{ transform: `scale(${cubeSize / 100})` }}
      >
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

          {/* Center - Keywords */}
          <div className="flex items-center">
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
          </div>

          {/* Right side - Empty for balance */}
          <div className="w-24 sm:w-32" />
        </div>
      </header>

      {/* Settings Gear Icon + Label - Top Left Below Header */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        data-testid="settings-gear-button"
        className={`fixed left-5 top-24 z-[60] flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 ${
          isDark 
            ? 'text-white/50 hover:text-white/80 hover:bg-white/5' 
            : 'text-gray-500 hover:text-gray-700 hover:bg-black/5'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
        <span className="text-[13px] font-medium">Settings</span>
      </button>

      {/* RGY Signal Button - Right side */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-[60]">
        <RGYSignalButton 
          onClick={() => setShowRGYChats(true)} 
          isDark={isDark}
        />
      </div>

      {/* Voice Button - Vintage Golden Microphone */}
      <div className="fixed bottom-[90px] left-1/2 -translate-x-1/2 z-[60]">
        <button
          onClick={handleVoiceClick}
          disabled={!voiceSupported}
          className={`
            w-[72px] h-[72px] sm:w-[88px] sm:h-[88px]
            rounded-full flex items-center justify-center
            transition-all duration-300 cursor-pointer
            ${appState === 'listening'
              ? 'scale-110 animate-pulse'
              : appState === 'thinking'
              ? 'scale-105'
              : appState === 'speaking'
              ? 'scale-105'
              : 'hover:scale-105'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, #ffd700 0%, #daa520 25%, #b8860b 50%, #8b6914 75%, #704214 100%)',
            boxShadow: appState === 'idle' 
              ? '0 8px 32px rgba(212, 175, 55, 0.5), 0 4px 16px rgba(0,0,0,0.3), inset 0 4px 8px rgba(255,255,255,0.4), inset 0 -4px 8px rgba(0,0,0,0.3)'
              : '0 12px 48px rgba(255, 215, 0, 0.6), 0 6px 24px rgba(0,0,0,0.4), inset 0 4px 8px rgba(255,255,255,0.4), inset 0 -4px 8px rgba(0,0,0,0.3)',
            border: '3px solid rgba(255, 223, 0, 0.6)'
          }}
        >
          {/* Vintage Golden Mic SVG - Inspired by classic 50s microphones */}
          <svg 
            className="w-10 h-10 sm:w-12 sm:h-12" 
            viewBox="0 0 48 48" 
            fill="none"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
          >
            {/* Mic head - oval vintage shape */}
            <ellipse cx="24" cy="16" rx="10" ry="14" fill="url(#vintageGold)" />
            
            {/* Grille pattern - horizontal lines */}
            <line x1="16" y1="8" x2="32" y2="8" stroke="rgba(139,69,19,0.5)" strokeWidth="1" />
            <line x1="15" y1="11" x2="33" y2="11" stroke="rgba(139,69,19,0.5)" strokeWidth="1" />
            <line x1="14.5" y1="14" x2="33.5" y2="14" stroke="rgba(139,69,19,0.5)" strokeWidth="1" />
            <line x1="14.5" y1="17" x2="33.5" y2="17" stroke="rgba(139,69,19,0.5)" strokeWidth="1" />
            <line x1="15" y1="20" x2="33" y2="20" stroke="rgba(139,69,19,0.5)" strokeWidth="1" />
            <line x1="16" y1="23" x2="32" y2="23" stroke="rgba(139,69,19,0.5)" strokeWidth="1" />
            <line x1="18" y1="26" x2="30" y2="26" stroke="rgba(139,69,19,0.5)" strokeWidth="1" />
            
            {/* Decorative ring at bottom of head */}
            <ellipse cx="24" cy="29" rx="8" ry="2" fill="url(#goldRing)" />
            
            {/* Neck connector */}
            <rect x="20" y="30" width="8" height="6" rx="1" fill="url(#vintageGold)" />
            
            {/* Stand connector ring */}
            <ellipse cx="24" cy="36" rx="6" ry="2" fill="url(#goldRing)" />
            
            {/* Stand */}
            <rect x="22" y="36" width="4" height="8" fill="url(#vintageGold)" />
            
            {/* Base */}
            <ellipse cx="24" cy="44" rx="8" ry="3" fill="url(#goldRing)" />
            
            {/* Highlight on mic head */}
            <ellipse cx="20" cy="12" rx="3" ry="6" fill="rgba(255,255,255,0.25)" />
            
            {/* Gradient definitions */}
            <defs>
              <linearGradient id="vintageGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff8dc" />
                <stop offset="20%" stopColor="#ffd700" />
                <stop offset="50%" stopColor="#daa520" />
                <stop offset="80%" stopColor="#b8860b" />
                <stop offset="100%" stopColor="#8b6914" />
              </linearGradient>
              <linearGradient id="goldRing" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffd700" />
                <stop offset="50%" stopColor="#b8860b" />
                <stop offset="100%" stopColor="#8b6914" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* State indicators */}
          {appState === 'listening' && (
            <div className="absolute inset-0 rounded-full border-4 border-yellow-400/60 animate-ping" />
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

      {/* Settings Panel - Premium Frosted Glass */}
      {menuOpen && (
        <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[2px]" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute left-0 top-0 bottom-0 w-[320px] max-w-[90vw] flex flex-col"
            style={{ 
              animation: 'slideInLeft 0.3s ease-out',
              background: isDark 
                ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,245,0.98) 100%)',
              backdropFilter: 'blur(24px) saturate(1.2)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
              borderRight: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)',
              boxShadow: isDark 
                ? '0 0 80px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
                : '0 0 80px rgba(0,0,0,0.15), 4px 0 24px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Just close button */}
            <div className="flex items-center justify-end px-7 py-5">
              <button 
                onClick={() => setMenuOpen(false)} 
                className={`p-1.5 rounded-full transition-all ${
                  isDark 
                    ? 'text-white/40 hover:text-white/70 hover:bg-white/5' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-black/5'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content - Clean Sections (no scrollbar) */}
            <div className="flex-1 overflow-y-auto px-7 pb-8 space-y-7 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              
              {/* 1. Mode */}
              <div>
                <h3 className={`text-[11px] uppercase tracking-[0.15em] mb-4 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Mode</h3>
                <div className="space-y-2">
                  <div className={`flex items-center justify-between py-3 px-4 rounded-xl ${
                    isDark ? 'bg-white/[0.04] border border-white/[0.04]' : 'bg-gray-100 border border-gray-200'
                  }`}>
                    <span className={`text-[14px] ${isDark ? 'text-white/80' : 'text-gray-800'}`}>Voice Mode</span>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full ${
                      isDark ? 'bg-white/[0.08] text-white/50' : 'bg-gray-200 text-gray-500'
                    }`}>active</span>
                  </div>
                  <a
                    href="/chat"
                    className={`flex items-center justify-between py-3 px-4 rounded-xl transition-colors ${
                      isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-[14px] ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Chat Mode</span>
                  </a>
                </div>
              </div>

              {/* Soft Divider */}
              <div className={`h-px bg-gradient-to-r from-transparent ${isDark ? 'via-white/[0.06]' : 'via-gray-200'} to-transparent`} />

              {/* 2. Experience */}
              <div>
                <h3 className={`text-[11px] uppercase tracking-[0.15em] mb-4 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Experience</h3>
                <div className="space-y-2">
                  <button
                    onClick={toggleTheme}
                    className={`w-full flex items-center justify-between py-3 px-4 rounded-xl transition-colors ${
                      isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-[14px] ${isDark ? 'text-white/70' : 'text-gray-700'}`}>Theme</span>
                    <span className={`text-[13px] ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{isDark ? 'Dark' : 'Light'}</span>
                  </button>
                  
                  <div className={`py-3 px-4 rounded-xl ${isDark ? 'bg-white/[0.02]' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[14px] ${isDark ? 'text-white/70' : 'text-gray-700'}`}>Cube Size</span>
                      <span className={`text-[13px] ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{cubeSize}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={cubeSize}
                      onChange={(e) => handleCubeSizeChange(parseInt(e.target.value))}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: isDark 
                          ? `linear-gradient(to right, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.25) ${(cubeSize - 50) / 100 * 100}%, rgba(255,255,255,0.08) ${(cubeSize - 50) / 100 * 100}%, rgba(255,255,255,0.08) 100%)`
                          : `linear-gradient(to right, rgba(100,100,100,0.4) 0%, rgba(100,100,100,0.4) ${(cubeSize - 50) / 100 * 100}%, rgba(200,200,200,0.5) ${(cubeSize - 50) / 100 * 100}%, rgba(200,200,200,0.5) 100%)`
                      }}
                      data-testid="cube-size-slider"
                    />
                  </div>
                </div>
              </div>

              {/* Soft Divider */}
              <div className={`h-px bg-gradient-to-r from-transparent ${isDark ? 'via-white/[0.06]' : 'via-gray-200'} to-transparent`} />

              {/* 3. Privacy */}
              <div>
                <h3 className={`text-[11px] uppercase tracking-[0.15em] mb-4 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Privacy</h3>
                <button
                  onClick={() => setShowBYOSettings(!showBYOSettings)}
                  className={`w-full flex items-center justify-between py-3 px-4 rounded-xl transition-colors ${
                    isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-[14px] ${isDark ? 'text-white/70' : 'text-gray-700'}`}>BYO Mode</span>
                  <span className={`text-[13px] ${isBYOEnabled ? (isDark ? 'text-white/60' : 'text-gray-600') : (isDark ? 'text-white/30' : 'text-gray-400')}`}>
                    {isBYOEnabled ? 'On' : 'Off'}
                  </span>
                </button>

                {showBYOSettings && (
                  <div className={`mt-2 rounded-xl overflow-hidden ${isDark ? 'bg-white/[0.02] border border-white/[0.04]' : 'bg-gray-50 border border-gray-200'}`}>
                    <BYOSettings onClose={() => setShowBYOSettings(false)} />
                  </div>
                )}
              </div>

              {/* Soft Divider */}
              <div className={`h-px bg-gradient-to-r from-transparent ${isDark ? 'via-white/[0.06]' : 'via-gray-200'} to-transparent`} />

              {/* 4. Account */}
              <div>
                <h3 className={`text-[11px] uppercase tracking-[0.15em] mb-4 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Account</h3>

                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className={`py-3 px-4 rounded-xl ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                      <span className={`text-[13px] truncate block ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{user?.email}</span>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className={`w-full text-left py-3 px-4 rounded-xl text-[14px] transition-colors ${
                        isDark ? 'text-white/40 hover:text-red-400/80 hover:bg-red-500/[0.05]' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                      }`}
                    >
                      Sign Out
                    </button>
                  </div>
                ) : showAuthForm ? (
                  <div className="space-y-4">
                    <div className={`rounded-xl overflow-hidden p-4 ${isDark ? 'bg-white/[0.02]' : 'bg-gray-50'}`}>
                      <LoginForm />
                    </div>
                    <button
                      onClick={() => setShowAuthForm(false)}
                      className={`w-full text-center text-[12px] transition-colors ${
                        isDark ? 'text-white/30 hover:text-white/50' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowAuthForm(true)}
                      className={`w-full flex items-center justify-between py-3 px-4 rounded-xl transition-colors ${
                        isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-[14px] ${isDark ? 'text-white/70' : 'text-gray-700'}`}>Email</span>
                    </button>
                    <button
                      onClick={() => setShowAuthForm(true)}
                      className={`w-full flex items-center justify-between py-3 px-4 rounded-xl transition-colors ${
                        isDark ? 'bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.04]' : 'bg-gray-100 hover:bg-gray-150 border border-gray-200'
                      }`}
                    >
                      <span className={`text-[14px] ${isDark ? 'text-white/80' : 'text-gray-800'}`}>Send Magic Link</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <style jsx global>{`
            @keyframes slideInLeft {
              from { transform: translateX(-100%); }
              to { transform: translateX(0); }
            }
            @keyframes slideInRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background: rgba(255,255,255,0.8);
              cursor: pointer;
              border: none;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            }
            input[type="range"]::-moz-range-thumb {
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background: rgba(255,255,255,0.8);
              cursor: pointer;
              border: none;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
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

      {/* Landing Cube - Shown once per day or after 4+ hours */}
      {showLandingCube && (
        <LandingCube 
          onComplete={handleLandingComplete}
          detectedColor={colorName}
        />
      )}
    </div>
  )
}
