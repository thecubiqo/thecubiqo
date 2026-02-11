'use client'

/**
 * FullscreenApp - Exact replica of legacy cubiqo.ai design
 * With proper state machine: idle → listening → thinking → speaking → idle
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { CubeScene, EnergyCubeScene } from './cube'
import { LoginForm, AuthNudgeModal } from './auth'
import { BYOSettings } from './byo'
import { KeywordPanel } from './KeywordPanel'
import { RGYSignalButton, RGYChatsModal } from './RGYChatsModal'
import { GettingStartedPanel } from './GettingStartedPanel'
import { LandingCube } from './LandingCube'
import { HandshakeWizard } from './HandshakeWizard'
import { PoweredByLogosCompact } from './PoweredByLogos'
import { DevPromptPanel } from './DevPromptPanel'
import { FounderPortal } from './FounderPortal'
import { MultivaCubiKey } from './MultivaCubiKey'
import { ActionCardList } from './actions/ActionCard'
import { useSession } from '@/hooks/useSession'
import { useAuth } from '@/hooks/useAuth'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useElevenLabsTTS } from '@/hooks/useElevenLabsTTS'
import { useChat } from '@/hooks/useChat'
import { useBYO } from '@/hooks/useBYO'
import type { ColorName } from '@/config/colors'
import type { AnimationState } from './cube/Cube'
import type { Action } from '@/lib/actions/action-types'

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
  const [showDevPanel, setShowDevPanel] = useState(false)

  // Remote state
  const [devMode, setDevMode] = useState(false)
  const [enabledFeatures, setEnabledFeatures] = useState<Record<string, boolean>>({})
  const [userToggles, setUserToggles] = useState<Record<string, boolean>>({})

  // RGY Signal pulse state - triggers brief pulse when keyword is saved
  const [rgyPulseColor, setRgyPulseColor] = useState<'RED' | 'YELLOW' | 'GREEN' | null>(null)

  // Early access signup
  const [earlyAccessEmail, setEarlyAccessEmail] = useState('')
  const [earlyAccessSubmitted, setEarlyAccessSubmitted] = useState(false)
  const [showEarlyAccess, setShowEarlyAccess] = useState(true)

  // Visual Variant A/B Test (For Founder View)
  const [visualVariant, setVisualVariant] = useState<'A' | 'B'>('A')

  // Actions State
  const [pendingActions, setPendingActions] = useState<Action[]>([])

  // Handshake Wizard State
  const [showHandshake, setShowHandshake] = useState(false)

  // Combined Founder Check (Email OR PIN)
  const [isFounderMode, setIsFounderMode] = useState(false)

  // Feature Flags Effect
  useEffect(() => {
    // 1. Initial local read (fastest)
    const dashStored = localStorage.getItem('cubiqo_dashboard_production')
    if (dashStored) {
      try { setEnabledFeatures(JSON.parse(dashStored)) } catch { }
    }

    // 2. Global Sync (Real Push)
    const fetchGlobalFeatures = async () => {
      try {
        const res = await fetch('/api/features')
        if (res.ok) {
          const data = await res.json()
          if (data.features) {
            setEnabledFeatures(data.features)
            localStorage.setItem('cubiqo_dashboard_production', JSON.stringify(data.features))
          }
        }
      } catch (e) {
        console.warn('[CubiQo] Feature sync failed')
      }
    }
    fetchGlobalFeatures()

    // 3. Read user's personal toggle overrides
    const userStored = localStorage.getItem('cubiqo_user_toggles')
    if (userStored) {
      try { setUserToggles(JSON.parse(userStored)) } catch { }
    }
    // Listen for dashboard updates (local sync)
    const onStorage = () => {
      const d = localStorage.getItem('cubiqo_dashboard_production')
      if (d) try { setEnabledFeatures(JSON.parse(d)) } catch { }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Check Founder Mode Status
  useEffect(() => {
    const checkFounder = () => {
      const isEmail = user?.email === 'aditya@cubiqo.ai'
      const isPin = typeof window !== 'undefined' && sessionStorage.getItem('founders_pass_auth') === 'true'
      setIsFounderMode(isEmail || isPin)
    }
    checkFounder()
    window.addEventListener('storage', checkFounder)
    return () => window.removeEventListener('storage', checkFounder)
  }, [user])

  // Handshake Wizard Effect
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
    if (isAuthenticated) {
      const completed = localStorage.getItem('cubiqo_handshake_complete') === 'true'
      if (!completed) {
        setShowHandshake(true)
      }
    }
  }, [isAuthenticated])

  // Landing Cube Logic
  useEffect(() => {
    const LANDING_STORAGE_KEY = 'cubiqo_last_landing'
    const HOURS_THRESHOLD = 4

    const lastLanding = localStorage.getItem(LANDING_STORAGE_KEY)
    const now = Date.now()

    if (!lastLanding) {
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

  // Action Handlers
  const handleActionConfirm = async (id: string) => {
    setPendingActions(prev => prev.map(a => a.id === id ? { ...a, status: 'confirmed' } : a))
    setTimeout(() => {
      setPendingActions(prev => prev.filter(a => a.id !== id))
    }, 2000)
  }

  const handleActionCancel = (id: string) => {
    setPendingActions(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a))
    setTimeout(() => {
      setPendingActions(prev => prev.filter(a => a.id !== id))
    }, 2000)
  }

  // Early Access Submit
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

  // SSR-safe localStorage state
  const [hideQuestions, setHideQuestions] = useState(true)
  const [isSimulatingUser, setIsSimulatingUser] = useState(false)

  useEffect(() => {
    setHideQuestions(localStorage.getItem('cubiqo_hide_questions') === 'true')
    setIsSimulatingUser(localStorage.getItem('cubiqo_simulate_user') === 'true')
  }, [])

  // Function to trigger RGY pulse
  const triggerRgyPulse = (color: 'RED' | 'YELLOW' | 'GREEN') => {
    setRgyPulseColor(color)
    setTimeout(() => setRgyPulseColor(null), 500)
  }

  // Cube Size Persistence
  useEffect(() => {
    const stored = localStorage.getItem('cubiqo_cube_size')
    if (stored) setCubeSize(parseInt(stored))
  }, [])

  const handleCubeSizeChange = (size: number) => {
    setCubeSize(size)
    localStorage.setItem('cubiqo_cube_size', size.toString())
  }

  // BYO Mode
  const { isBYOEnabled } = useBYO()

  // State machine (matching legacy)
  const [appState, setAppState] = useState<AppState>('idle')
  const appStateRef = useRef<AppState>('idle')

  // Voice enabled toggle
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const voiceEnabledRef = useRef(false)
  const startListeningRef = useRef<(() => void) | null>(null)

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

  // Dev Prompt Handler
  const handleDevPrompt = useCallback(async (text: string) => {
    const devPrefix = "SYSTEM_OVERRIDE_INSTRUCTION: "
    await sendMessage(devPrefix + text, colorName)
    setShowDevPanel(false)
  }, [sendMessage, colorName])

  // Track if we should show auth nudge modal after speaking
  const nudgeCtaRef = useRef<string | null>(null)

  // TTS for AI responses
  const { speak, stop: stopSpeaking, isSpeaking, error: ttsError, unlockAudio } = useElevenLabsTTS({
    colorName,
    onStart: () => {
      setAppState('speaking')
      setAnimationState('speaking')
    },
    onEnd: () => {
      if (nudgeCtaRef.current) {
        setNudgeCta(nudgeCtaRef.current)
        setShowNudgeModal(true)
        nudgeCtaRef.current = null
      }
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
      setAppState('thinking')
      setAnimationState('thinking')
      try {
        const response = await sendMessage(text, colorName)
        if (response?.response) {
          let responseText = response.response
          // Check for auth nudge marker
          const nudgeMatch = responseText.match(/\[AUTH_NUDGE:([^\]]+)\]/)
          if (nudgeMatch) {
            nudgeCtaRef.current = nudgeMatch[1].trim()
            responseText = responseText.replace(nudgeMatch[0], '').trim()
          } else if (responseText.includes('[AUTH_NUDGE]')) {
            nudgeCtaRef.current = "Let's stay connected"
            responseText = responseText.replace('[AUTH_NUDGE]', '').trim()
          }

          // Check for actions
          const actionMatch = responseText.match(/\[ACTION\]([\s\S]*?)\[\/ACTION\]/)
          if (actionMatch) {
            try {
              const actionData = JSON.parse(actionMatch[1])
              const newAction: Action = {
                ...actionData,
                id: Date.now().toString(),
                status: 'pending',
                createdAt: new Date()
              }
              setPendingActions(prev => [...prev, newAction])
              responseText = responseText.replace(actionMatch[0], '').trim()
            } catch (e) {
              console.error('Failed to parse action:', e)
            }
          }

          speak(responseText)
        } else {
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
      if (voiceEnabledRef.current && startListeningRef.current && appStateRef.current === 'listening') {
        setTimeout(() => {
          if (voiceEnabledRef.current && startListeningRef.current) {
            startListeningRef.current()
          }
        }, 100)
      } else if (appStateRef.current === 'listening') {
        setAppState('idle')
        setAnimationState('idle')
      }
    }
  })

  useEffect(() => {
    startListeningRef.current = startListening
  }, [startListening])

  // Theme persistence
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    setIsDark(stored !== 'light')
  }, [])

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const newValue = !prev
      localStorage.setItem('theme', newValue ? 'dark' : 'light')
      return newValue
    })
  }, [])

  const handleVoiceClick = useCallback(async () => {
    if (!chatInitialized) return
    await unlockAudio()
    if (!voiceEnabled) {
      setVoiceEnabled(true)
      setAppState('listening')
      setAnimationState('listening')
      startListening()
    } else {
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
      {/* Energy Cube */}
      <div
        className="fixed left-1/2 z-[1]"
        style={{
          top: '42%',
          transform: `translate(-50%, -50%) scale(${cubeSize / 100})`,
          width: '600px',
          height: '600px'
        }}
      >
        <EnergyCubeScene
          colorName={colorName}
          animationState={animationState}
          visualVariant={visualVariant}
        />
      </div>

      {/* Floating Questions - Slow Scroll */}
      {!hideQuestions && (
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
      )}

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

      {/* Action Cards Overlay */}
      <div className="fixed top-24 right-6 z-[60] w-[350px] max-w-[90vw]">
        <ActionCardList
          actions={pendingActions}
          onConfirm={handleActionConfirm}
          onCancel={handleActionCancel}
        />
      </div>

      {/* RGY Traffic Light + Keywords */}
      <div className="fixed right-6 top-[22%] -translate-y-1/2 z-[40] flex flex-col items-center gap-3">
        <RGYSignalButton
          onClick={() => setShowKeywordPanel(true)}
          isDark={isDark}
          pulseColor={rgyPulseColor}
          compact={true}
        />
        <button
          onClick={() => setShowKeywordPanel(true)}
          className={`flex items-center gap-1.5 text-[11px] transition-colors ${isDark ? 'text-white/30 hover:text-white/50' : 'text-gray-400 hover:text-gray-600'
            }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
          </svg>
          Keywords
        </button>
      </div>

      {/* Bottom Left Stack: Settings & Dev Panel */}
      <div className="fixed left-6 bottom-6 z-[55] flex flex-col gap-3">
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

        {/* Dev Panel Button */}
        <button
          onClick={() => setShowDevPanel(!showDevPanel)}
          className={`flex items-center gap-2 text-[13px] transition-colors ${isDark
              ? 'text-white/40 hover:text-white/60'
              : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <span className="text-purple-400 font-mono">{'</>'}</span>
          <span className="font-medium">Dev Panel</span>
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

      {/* Dev Prompt Panel - Popover */}
      {showDevPanel && (
        <DevPromptPanel
          isOpen={showDevPanel}
          onClose={() => setShowDevPanel(false)}
          onPromptAction={handleDevPrompt}
        />
      )}

      {/* Founder Mode Toggle (Bottom Right) */}
      <div className="fixed right-6 bottom-6 z-[60]">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-1 py-1 flex items-center gap-2">
          <span className="text-[10px] font-bold text-white/50 tracking-wider pl-3 pr-1">FOUNDER MODE</span>
          <button
            onClick={() => setVisualVariant(visualVariant === 'A' ? 'B' : 'A')}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${visualVariant === 'B'
                ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                : 'bg-yellow-500 text-black'
              }`}
          >
            {visualVariant}
          </button>
        </div>
      </div>

      {/* Voice Enable Control */}
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
      <footer className="fixed bottom-2 left-0 right-0 z-50">
        <div className="flex flex-col items-center gap-2">
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

          {/* Powered By Logos */}
          <div className="flex items-center gap-3">
            <PoweredByLogosCompact isDark={isDark} />
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
            </div>
          </div>
        </div>
      )}

      {/* Auth Nudge Modal */}
      {showNudgeModal && (
        <AuthNudgeModal
          isOpen={showNudgeModal}
          onClose={() => setShowNudgeModal(false)}
          onSignIn={() => {
            setShowNudgeModal(false)
            setShowAuthForm(true)
          }}
          cta={nudgeCta}
        />
      )}

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

      {/* Handshake Wizard Overhead */}
      {showHandshake && (
        <HandshakeWizard
          onComplete={() => setShowHandshake(false)}
        />
      )}

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
