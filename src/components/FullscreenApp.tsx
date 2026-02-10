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
import { GettingStartedPanel } from './GettingStartedPanel'
import { LandingCube } from './LandingCube'
import { PoweredByLogosCompact } from './PoweredByLogos'
import { FounderPortal } from './FounderPortal'
import { MultivaCubiKey } from './MultivaCubiKey'
import { useSession } from '@/hooks/useSession'
import { useAuth } from '@/hooks/useAuth'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useElevenLabsTTS } from '@/hooks/useElevenLabsTTS'
import { useChat } from '@/hooks/useChat'
import { useBYO } from '@/hooks/useBYO'
import type { ColorName } from '@/config/colors'
import CodePanel from './CodePanel'
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
  const [showGettingStarted, setShowGettingStarted] = useState(false)
  const [devMode, setDevMode] = useState(false)

  // RGY Signal pulse state - triggers brief pulse when keyword is saved
  const [rgyPulseColor, setRgyPulseColor] = useState<'RED' | 'YELLOW' | 'GREEN' | null>(null)

  // Early access signup
  const [earlyAccessEmail, setEarlyAccessEmail] = useState('')
  const [earlyAccessSubmitted, setEarlyAccessSubmitted] = useState(false)
  const [showEarlyAccess, setShowEarlyAccess] = useState(true)

  // Combined Founder Check (Email OR PIN)
  const [isFounderMode, setIsFounderMode] = useState(false)

  useEffect(() => {
    const checkFounder = () => {
      const isEmail = user?.email === 'aditya@cubiqo.ai'
      const isPin = typeof window !== 'undefined' && sessionStorage.getItem('founders_pass_auth') === 'true'
      setIsFounderMode(isEmail || isPin)
    }
    checkFounder()
    // Listen for storage changes in case they log in via another tab/window logic
    window.addEventListener('storage', checkFounder)
    return () => window.removeEventListener('storage', checkFounder)
  }, [user])

  const handleEarlyAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!earlyAccessEmail.trim()) return

    const testers = JSON.parse(localStorage.getItem('cubiqo_early_access') || '[]')
    testers.push({ email: earlyAccessEmail, timestamp: Date.now() })
    localStorage.setItem('cubiqo_early_access', JSON.stringify(testers))

    setEarlyAccessSubmitted(true)
    setTimeout(() => {
      setShowEarlyAccess(false)
    }, 2000)
  }

  // Function to trigger RGY pulse (call this when a keyword is saved)
  const triggerRgyPulse = (color: 'RED' | 'YELLOW' | 'GREEN') => {
    setRgyPulseColor(color)
    // Reset after animation completes
    setTimeout(() => setRgyPulseColor(null), 500)
  }

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

  // Voice enabled toggle - stays ON until manually turned OFF
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const voiceEnabledRef = useRef(false)
  const startListeningRef = useRef<(() => void) | null>(null)

  // Keep refs in sync for callbacks
  useEffect(() => {
    appStateRef.current = appState
  }, [appState])

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled
  }, [voiceEnabled])

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
      // Show auth nudge modal if AI suggested sign-in
      if (nudgeCtaRef.current) {
        setNudgeCta(nudgeCtaRef.current)
        setShowNudgeModal(true)
        nudgeCtaRef.current = null
      }

      // If voice is still enabled, go back to listening for seamless conversation
      if (voiceEnabledRef.current && startListeningRef.current) {
        setAppState('listening')
        setAnimationState('listening')
        startListeningRef.current()
      } else {
        setAppState('idle')
        setAnimationState('idle')
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
          // No response - if voice enabled, go back to listening
          if (voiceEnabledRef.current && startListeningRef.current) {
            setAppState('listening')
            setAnimationState('listening')
            startListeningRef.current()
          } else {
            setAppState('idle')
            setAnimationState('idle')
          }
        }
      } catch (error) {
        console.error('AI Error:', error)
        // On error - if voice enabled, go back to listening
        if (voiceEnabledRef.current && startListeningRef.current) {
          setAppState('listening')
          setAnimationState('listening')
          startListeningRef.current()
        } else {
          setAppState('idle')
          setAnimationState('idle')
        }
      }
    },
    onEnd: () => {
      // Speech recognition ended (timeout or no result)
      // If voice is still enabled, restart listening for continuous conversation
      if (voiceEnabledRef.current && startListeningRef.current && appStateRef.current === 'listening') {
        // Small delay to avoid rapid restarts
        setTimeout(() => {
          if (voiceEnabledRef.current && startListeningRef.current) {
            startListeningRef.current()
          }
        }, 100)
      } else if (appStateRef.current === 'listening') {
        // Voice was turned off, go to idle
        setAppState('idle')
        setAnimationState('idle')
      }
    }
  })

  // Store startListening in ref for use in TTS callback
  useEffect(() => {
    startListeningRef.current = startListening
  }, [startListening])

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

  // Voice button click handler - Toggle ON/OFF for seamless conversation
  const handleVoiceClick = useCallback(async () => {
    // Don't allow voice input if chat isn't initialized
    if (!chatInitialized) return

    // CRITICAL: Unlock audio on user gesture (browser requires this)
    await unlockAudio()

    if (!voiceEnabled) {
      // Turn ON - Start listening and enable continuous conversation
      setVoiceEnabled(true)
      setAppState('listening')
      setAnimationState('listening')
      startListening()
    } else {
      // Turn OFF - Stop everything and go to idle
      setVoiceEnabled(false)
      setAppState('idle')
      setAnimationState('idle')
      stopListening()
      stopSpeaking()
    }
  }, [chatInitialized, voiceEnabled, startListening, stopListening, stopSpeaking, unlockAudio])

  const bgColor = isDark ? '#0f0f12' : '#ffffff'
  const textColor = isDark ? '#ffffff' : '#111111'

  return (
    <div
      className="fixed inset-0 overflow-hidden transition-colors duration-400"
      style={{ background: bgColor, color: textColor }}
    >
      {/* Energy Cube - Perfectly centered, industry standard */}
      <div
        className="fixed left-1/2 z-[1]"
        style={{
          top: '42%',
          transform: `translate(-50%, -50%) scale(${cubeSize / 100})`,
          width: '600px',
          height: '600px'
        }}
      >
        <EnergyCubeScene colorName={colorName} animationState={animationState} />
      </div>

      {/* Floating Questions - Slow Scroll */}
      <div className="fixed left-8 top-1/2 -translate-y-1/2 z-[40] w-[400px] h-[300px] overflow-hidden pointer-events-none">
        <div className="animate-float-questions space-y-8">
          {[
            "What's a good book for understanding psychology?",
            "Help me plan a weekend trip to Paris",
            "I need motivation to start working out",
            "Explain quantum computing like I'm five",
            "Best restaurants in Brooklyn?",
            "How do I learn Spanish fast?",
            "What's the meaning of life?",
            "Recommend a morning routine",
            "What's a good book for understanding psychology?",
            "Help me plan a weekend trip to Paris",
          ].map((question, i) => (
            <div
              key={i}
              className="text-white/30 text-sm leading-relaxed"
            >
              "{question}"
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float-questions {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-float-questions {
          animation: float-questions 60s linear infinite;
        }
      `}} />


      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-[12px] transition-colors duration-400 ${isDark
          ? 'bg-[rgba(5,5,5,0.7)]'
          : 'bg-[rgba(255,255,255,0.8)]'
          }`}
      >
        <div className="flex justify-between items-center w-full">
          {/* Left - CubiQo Logo Icon Only */}
          <div className="flex items-center">
            <img
              src="https://customer-assets.emergentagent.com/job_signal-ai-chat/artifacts/ay0gj2sk_ChatGPT%20Image%20Feb%205%2C%202026%2C%2003_14_37%20PM.png"
              alt="CubiQo"
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
            />
          </div>

          {/* Center - CubiQo Text */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-start">
            <span className={`text-2xl sm:text-3xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'
              }`}>
              CubiQo
            </span>
            <span className={`text-[10px] sm:text-[12px] font-medium ml-0.5 -mt-0.5 ${isDark ? 'text-white/60' : 'text-gray-500'
              }`}>
              TM
            </span>
          </div>

          {/* Right side - SIGNAL Logo - Clickable */}
          <button
            onClick={() => setShowRGYChats(true)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img
              src="https://customer-assets.emergentagent.com/job_signal-ai-chat/artifacts/1lhd76s4_signal_s_exact%20%281%29.png"
              alt="SIGNAL"
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
            />
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-semibold tracking-[0.08em] text-white leading-tight">SIGNAL</span>
              <span className="text-[10px] sm:text-[11px] text-white/60 tracking-wide">One is enough.</span>
            </div>
          </button>
        </div>
      </header>

      <div className="fixed left-6 bottom-6 z-[55] flex flex-col gap-3">
        {/* Dev Mode Toggle - Founders Only */}
        {isFounderMode && (
          <button
            onClick={() => setDevMode(!devMode)}
            className={`flex items-center gap-2 text-[13px] transition-colors ${isDark
              ? 'text-white/40 hover:text-white/60'
              : 'text-gray-500 hover:text-gray-700'
              } ${devMode ? 'text-blue-400 hover:text-blue-300' : ''}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 18" />
            </svg>
            <span className="font-medium">Dev Panel</span>
          </button>
        )}

        {/* Settings */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          data-testid="settings-gear-button"
          className={`flex items-center gap-2 text-[13px] transition-colors ${isDark
            ? 'text-white/40 hover:text-white/60'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          <span className="font-medium">Settings</span>
        </button>

        {/* Sign In with profile icon */}
        {isAuthenticated ? (
          <button
            onClick={() => setMenuOpen(true)}
            className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white/60 transition-colors"
            data-testid="user-profile-button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <span className="truncate max-w-[100px]">{user?.email?.split('@')[0]}</span>
          </button>
        ) : (
          <button
            onClick={() => setShowAuthForm(true)}
            className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white/60 transition-colors"
            data-testid="sign-in-button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <span className="font-medium">Sign In</span>
          </button>
        )}
      </div>

      {/* Right side - RGY Signal + Keywords underneath */}
      <div className="fixed right-[4.5rem] top-1/2 -translate-y-1/2 z-[60] flex flex-col items-center gap-4">
        {/* RGY Traffic Light - Opens Keywords Panel */}
        <RGYSignalButton
          onClick={() => setShowKeywordPanel(true)}
          isDark={isDark}
          pulseColor={rgyPulseColor}
        />

        {/* Keywords text underneath */}
        <button
          onClick={() => setShowKeywordPanel(true)}
          data-testid="keywords-button"
          className={`flex flex-col items-center gap-1 transition-all duration-200 ${isDark
            ? 'text-white/40 hover:text-white/60'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
          </svg>
          <span className="text-[11px] font-medium">Keywords</span>
        </button>
      </div>

      {/* Voice Enable Control - As low as possible on screen */}
      <div className="fixed bottom-[40px] left-1/2 -translate-x-1/2 z-[55] flex flex-col items-center">
        <button
          onClick={handleVoiceClick}
          disabled={!voiceSupported}
          data-testid="voice-control-button"
          className={`group flex flex-col items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-200 ${voiceSupported
            ? 'hover:bg-white/[0.03] cursor-pointer'
            : 'cursor-default'
            }`}
        >
          {/* Speaker Icon - Smaller */}
          <div className={`relative p-3 rounded-full transition-all duration-300 ${voiceEnabled
            ? 'bg-white/15'
            : 'bg-white/[0.03] group-hover:bg-white/[0.06]'
            }`}>
            <svg
              className={`w-6 h-6 transition-all duration-200 ${voiceEnabled
                ? 'text-white'
                : 'text-white/50 group-hover:text-white/70'
                }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              {/* Speaker/Audio waveform icon */}
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
            </svg>

            {/* Light pulse rings when voice is ON */}
            {voiceEnabled && (
              <>
                <div className="absolute inset-0 rounded-full border border-white/30 animate-ping" style={{ animationDuration: '1.5s' }} />
                <div className="absolute inset-[-4px] rounded-full border border-white/20 animate-pulse" />
              </>
            )}
          </div>

          {/* Label - Simplified to just "Enable" */}
          <span
            className={`text-[13px] tracking-wide transition-all duration-300 ${voiceEnabled
              ? 'opacity-0 h-0 overflow-hidden'
              : 'opacity-100 text-white/40 group-hover:text-white/60'
              }`}
          >
            {!voiceSupported
              ? 'Voice access is controlled by your browser.'
              : 'Enable'
            }
          </span>
        </button>
      </div>

      {/* Footer - Much lower on screen */}
      <footer className="fixed bottom-2 left-0 right-0 z-50 pointer-events-none">
        <div className="flex flex-col items-center gap-4 pointer-events-auto">



          <p className="text-[10px] text-white/25 tracking-wide text-center">
            All conversations are confidential. CubiQo never retains user voice by policy.
            <span className="mx-2">·</span>
            <button
              onClick={() => setMenuOpen(true)}
              className="text-white/40 hover:text-white/60 transition-colors"
            >
              Try BYO Mode
            </button>
            <span className="mx-1">—</span>
            <span className="text-white/25">Your data · Your storage · Your API key</span>
            <span className="mx-2">·</span>
            <span className="text-white/20">© 2025 Cubiqo United Inc.</span>
          </p>

          {/* Mother AI Models Text */}
          <div className={`text-[10px] tracking-widest uppercase ${isDark ? 'text-white/20' : 'text-gray-400/50'}`}>
            Anthropic · OpenAI · Llama · Mistral · Gemini · DeepSeek
          </div>
        </div>
      </footer>

      {/* Sign In Modal - Premium Apple Style */}
      {showAuthForm && !isAuthenticated && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)' }}
          onClick={() => setShowAuthForm(false)}
          data-testid="sign-in-modal-overlay"
        >
          <div
            className="w-[340px] max-w-[85vw] rounded-[24px] px-8 py-7"
            style={{
              background: 'rgba(38,38,40,0.95)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(255,255,255,0.08)'
            }}
            onClick={(e) => e.stopPropagation()}
            data-testid="sign-in-modal"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-7">
              <h2 className="text-[19px] font-normal text-white/90 tracking-tight">Sign In</h2>
              <button
                onClick={() => setShowAuthForm(false)}
                className="p-1 -mr-1 text-white/30 hover:text-white/50 transition-colors"
                data-testid="sign-in-modal-close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Login Form */}
            <LoginForm />
          </div>
        </div>
      )}

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
                className={`p-1.5 rounded-full transition-all ${isDark
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
                  <div className={`flex items-center justify-between py-3 px-4 rounded-xl ${isDark ? 'bg-white/[0.04] border border-white/[0.04]' : 'bg-gray-100 border border-gray-200'
                    }`}>
                    <span className={`text-[14px] ${isDark ? 'text-white/80' : 'text-gray-800'}`}>Voice Mode</span>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full ${isDark ? 'bg-white/[0.08] text-white/50' : 'bg-gray-200 text-gray-500'
                      }`}>active</span>
                  </div>
                  <a
                    href="/chat"
                    className={`flex items-center justify-between py-3 px-4 rounded-xl transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'
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
                    className={`w-full flex items-center justify-between py-3 px-4 rounded-xl transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'
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
                  className={`w-full flex items-center justify-between py-3 px-4 rounded-xl transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'
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

              {/* 4. API Access */}
              <div>
                <h3 className={`text-[11px] uppercase tracking-[0.15em] mb-4 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>API Access</h3>
                <MultivaCubiKey isDark={isDark} />
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

      {/* Getting Started Panel (Left side) */}
      <GettingStartedPanel
        isOpen={showGettingStarted}
        onClose={() => setShowGettingStarted(false)}
        isDark={isDark}
        onExampleClick={(text) => {
          // TODO: Send example text to chat
          console.log('Example clicked:', text)
          setShowGettingStarted(false)
        }}
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

      {/* Founder Portal - Only visible for founders */}
      {isFounderMode && <FounderPortal override={true} />}

      {/* Dev Mode Code Panel Overlay */}
      {devMode && isFounderMode && (
        <div
          className="fixed right-0 top-[70px] bottom-0 w-[500px] max-w-[90vw] z-[45] shadow-2xl transition-transform duration-300 transform translate-x-0"
          style={{
            borderLeft: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <CodePanel agentId="a2" onClose={() => setDevMode(false)} />
        </div>
      )}
    </div>
  )
}
