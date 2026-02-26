'use client'

/**
 * FullscreenApp - Exact replica of legacy cubiqo.ai design
 * With proper state machine: idle → listening → thinking → speaking → idle
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { CubeScene, EnergyCubeScene } from './cube'
import { LoginForm, AuthNudgeModal } from './auth'
import { AuthButton } from './AuthButton.client'
import { BYOSettings } from './byo'
import { KeywordPanel } from './KeywordPanel'
import { RGYSignalButton, RGYChatsModal } from './RGYChatsModal'
import { IntentSetup } from './IntentSetup'
import { OpportunityFeed } from './OpportunityFeed'
import { ProMatchSettings } from './ProMatchSettings'
import { RGYColorSelector } from './RGYColorSelector'
import { RGYIntentKeywordList } from './RGYIntentKeywordList'
import { RGYRoomView } from './RGYRoomView'
import { GettingStartedPanel } from './GettingStartedPanel'
import { LandingCubeRouter } from './LandingCubeRouter'
import { PoweredByLogosCompact } from './PoweredByLogos'
import { JourneyMemoryPrompt } from './journey'
import { AdminControls } from './admin'
import { SidePanel } from './cq'
import { TopRightCTA } from '@/components/TopRightCTA.client'
import type { RGYContext } from '@/types/rgy-matching'
import { useSession } from '@/hooks/useSession'
import { useAuth } from '@/hooks/useAuth'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useElevenLabsTTS } from '@/hooks/useElevenLabsTTS'
import { useChat } from '@/hooks/useChat'
import { useBYO } from '@/hooks/useBYO'
import { useDirectMessages } from '@/hooks/useDirectMessages'
import type { ColorName } from '@/config/colors'
import type { AnimationState } from './cube/Cube'
import Link from 'next/link'
import { Eye, EyeOff, Code2, Monitor, Zap } from 'lucide-react'
import { useMultimodalAI } from '@/hooks/useMultimodalAI'

// App states matching legacy
type AppState = 'idle' | 'listening' | 'thinking' | 'speaking'

interface FullscreenAppProps {
  showTopRightCTA?: boolean
  showParticleLanding?: boolean
}

export function FullscreenApp({
  showTopRightCTA = false,
  showParticleLanding = false
}: FullscreenAppProps) {
  const { session, isGuest, isLoading: sessionLoading } = useSession()
  const { user, isAuthenticated, signOut } = useAuth()
  const { unreadCount } = useDirectMessages()

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
  const [showCQPanel, setShowCQPanel] = useState(false)
  const [showFloatingQuestions, setShowFloatingQuestions] = useState(true)
  // RGY Signal pulse state - triggers brief pulse when keyword is saved
  const [rgyPulseColor, setRgyPulseColor] = useState<'RED' | 'YELLOW' | 'GREEN' | null>(null)

  // RGY Matching flow state
  const [showIntentSetup, setShowIntentSetup] = useState(false)
  const [showOpportunityFeed, setShowOpportunityFeed] = useState(false)
  const [showProMatchSettings, setShowProMatchSettings] = useState(false)
  const [selectedRGYContext, setSelectedRGYContext] = useState<RGYContext | null>(null)

  // RGY Chat Room flow state (rgynext design)
  const [showColorSelector, setShowColorSelector] = useState(false)
  const [showRoomList, setShowRoomList] = useState(false)
  const [showRoomChat, setShowRoomChat] = useState(false)
  const [selectedChatColor, setSelectedChatColor] = useState<'green' | 'yellow' | 'red' | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<any>(null)

  // ProMatch state
  const [proMatchEnabled, setProMatchEnabled] = useState(false)
  const [proMatchCount, setProMatchCount] = useState(0)

  // Biometric / Emergent HUD state
  const [isWatching, setIsWatching] = useState(false)
  const { context: aiContext, initialize: initAI, stop: stopAI } = useMultimodalAI({
    enableVision: true,
    autoStart: false
  })

  const toggleWatch = async () => {
    if (!isWatching) {
      await initAI()
      setIsWatching(true)
    } else {
      stopAI()
      setIsWatching(false)
    }
  }

  const facePos = (isWatching && aiContext?.vision?.faces && aiContext.vision.faces.length > 0)
    ? {
      x: (aiContext.vision.faces[0].bbox.x + aiContext.vision.faces[0].bbox.width / 2 - 0.5) * 2,
      y: -(aiContext.vision.faces[0].bbox.y + aiContext.vision.faces[0].bbox.height / 2 - 0.5) * 2
    }
    : { x: 0, y: 0 }

  // Simulate ProMatch working in background (for demo)
  useEffect(() => {
    // Check if ProMatch is enabled
    const checkProMatch = async () => {
      try {
        if (isAuthenticated && user) {
          const response = await fetch('/api/rgy/subscription')
          const data = await response.json()
          if (data.subscription?.is_active) {
            setProMatchEnabled(true)
            // Simulate finding matches (in real app, this comes from discovery service)
            const mockCount = Math.floor(Math.random() * 8) + 3 // 3-10 matches
            setProMatchCount(mockCount)
          }
        }
      } catch (error) {
        console.error('Error checking ProMatch:', error)
      }
    }

    checkProMatch()
    // Check periodically (every 5 minutes)
    const interval = setInterval(checkProMatch, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [isAuthenticated, user])

  // Simulate ProMatch working in background (for demo)

  // Early access signup
  const [earlyAccessEmail, setEarlyAccessEmail] = useState('')
  const [earlyAccessSubmitted, setEarlyAccessSubmitted] = useState(false)
  const [showEarlyAccess, setShowEarlyAccess] = useState(true)

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

  // Handle RGY SIGNAL click - Show color selector for chat rooms
  const handleSignalClick = () => {
    setShowRGYChats(false)
    setShowColorSelector(true)
  }

  // Handle color selection from color selector (rgynext)
  const handleColorSelect = (color: 'green' | 'yellow' | 'red') => {
    setSelectedChatColor(color)
    setShowColorSelector(false)
    setShowRoomList(true)
  }

  // Handle room selection
  const handleRoomSelect = (room: any) => {
    setSelectedRoom(room)
    setShowRoomList(false)
    setShowRoomChat(true)
  }

  // Handle back from room list
  const handleBackFromRoomList = () => {
    setShowRoomList(false)
    setShowColorSelector(true)
  }

  // Handle back from room chat
  const handleBackFromRoomChat = () => {
    setShowRoomChat(false)
    setShowRoomList(true)
  }

  // Handle viewing ProMatch shortlist
  const handleViewProMatchShortlist = () => {
    setShowRoomList(false)
    setShowOpportunityFeed(true)
  }

  // Handle back from ProMatch shortlist
  const handleBackFromShortlist = () => {
    setShowOpportunityFeed(false)
    if (selectedChatColor) {
      setShowRoomList(true)
    } else {
      setShowColorSelector(true)
    }
  }

  // Legacy handlers (kept for backwards compatibility)
  const handleZoneSelection = (context: RGYContext) => {
    setSelectedRGYContext(context)
    setShowRGYChats(false)
    setShowIntentSetup(true)
  }

  // Handle intent setup completion
  const handleIntentSetupComplete = () => {
    setShowIntentSetup(false)
    setShowOpportunityFeed(true)
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

  // Check if we should show landing cube (respecting feature flag and local storage)
  const searchParams = useSearchParams()
  const forceLanding = searchParams.get('landing') === 'true'

  useEffect(() => {
    // If explicitly forced via URL, show it
    if (forceLanding) {
      setShowLandingCube(true)
      return
    }

    // If feature flag is disabled (and not forced), don't show
    if (!showParticleLanding) return;

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
  }, [showParticleLanding, forceLanding])

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
          // No response (API error) - speak an error message so user knows
          speak("I'm having trouble connecting right now. Please try again in a moment.")
        }
      } catch (error) {
        console.error('AI Error:', error)
        // On error - speak error message and return to appropriate state
        speak("Sorry, I couldn't process that. Please try again.")
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
    // CRITICAL: Unlock audio on user gesture (browser requires this)
    // Call synchronously (not awaited) to ensure it happens in the same event loop tick
    // as the user's click event. Browsers require AudioContext to be initialized
    // within a user gesture handler for security reasons. Awaiting would break this requirement.
    unlockAudio()

    if (!voiceEnabled) {
      // Turn ON - Start listening and enable continuous conversation
      setVoiceEnabled(true)
      setAppState('listening')
      setAnimationState('listening')
      if (chatInitialized) {
        startListening()
      }
    } else {
      // Turn OFF - Stop everything and go to idle
      setVoiceEnabled(false)
      setAppState('idle')
      setAnimationState('idle')
      stopListening()
      stopSpeaking()
    }
  }, [chatInitialized, voiceEnabled, startListening, stopListening, stopSpeaking, unlockAudio])

  const bgColor = isDark ? '#0a0a0f' : '#fafafa'
  const textColor = isDark ? '#ffffff' : '#111111'

  return (
    <div
      className="fixed inset-0 overflow-hidden transition-colors duration-1000"
      style={{
        background: showLandingCube ? 'transparent' : bgColor,
        color: textColor
      }}
    >
      {/* Immersive Landing Background - Full Screen */}
      {showLandingCube && (
        <div className="fixed inset-0 z-[-2]">
          <LandingCubeRouter
            onComplete={handleLandingComplete}
            showTopRightCTA={showTopRightCTA}
            variant={showParticleLanding ? 'particle' : undefined}
          />
        </div>
      )}

      {/* Background layer for main app */}
      {!showLandingCube && (
        <div className="fixed inset-0 z-[-1]" style={{ background: bgColor }} />
      )}
      {/* Admin Controls */}
      <AdminControls />

      {/* Energy Cube - Full viewport background */}
      <div
        className="fixed inset-0 z-[1]"
        style={{
          transform: cubeSize !== 100 ? `scale(${cubeSize / 100})` : undefined,
          transformOrigin: 'center center'
        }}
      >
        <EnergyCubeScene
          colorName={colorName}
          animationState={animationState}
          isWatching={isWatching}
          facePosition={facePos}
          engagement={aiContext?.userState?.engagement || 'medium'}
        />
      </div>

      {/* Floating Questions - Slow Scroll */}
      {showFloatingQuestions && (
        <div className="fixed left-8 top-1/2 -translate-y-1/2 z-[60] w-[400px] h-[300px] overflow-hidden">
          <button
            onClick={() => setShowFloatingQuestions(false)}
            className="absolute top-0 right-0 z-10 p-1.5 rounded-full text-white/30 hover:text-white/60 hover:bg-white/10 transition-all duration-200"
            aria-label="Dismiss questions"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="animate-float-questions space-y-8 pointer-events-none">
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
                {"\u201C"}{question}{"\u201D"}
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
        className={`fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-3 sm:py-4 transition-all duration-400 ${showLandingCube
          ? 'bg-transparent border-none'
          : (isDark
            ? 'bg-[rgba(10,10,15,0.75)] border-b border-white/[0.06] backdrop-blur-[16px]'
            : 'bg-[rgba(250,250,250,0.85)] border-b border-black/[0.06] backdrop-blur-[16px]')
          }`}
      >
        <div className="flex justify-between items-center w-full relative">
          {/* Left side - Branded Logo */}
          {/* Left side - Branded Logo + Dynamic HUD Toggles */}
          <div className="flex items-center gap-4">

            {!showLandingCube && (
              <div className="flex items-center gap-2 ml-4">
                {/* BIG EYE TOGGLE (UPLINK) */}
                <div className="flex flex-col items-center gap-1 group">
                  <button
                    onClick={toggleWatch}
                    className={`relative h-12 w-12 rounded-xl border transition-all duration-700 flex items-center justify-center overflow-hidden
                      ${isWatching
                        ? 'bg-orange-500/20 border-orange-500/60 shadow-[0_0_20px_rgba(255,165,0,0.3)]'
                        : 'bg-white/5 border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5 hover:scale-105'}`}
                    title={isWatching ? 'Disable Biometric Uplink' : 'Enable Biometric Uplink'}
                  >
                    <div className="absolute inset-0 pointer-events-none">
                      <div className={`absolute inset-0 bg-orange-500/5 ${isWatching ? 'animate-pulse' : 'opacity-0'}`} />
                    </div>
                    {isWatching ? (
                      <Eye className="w-6 h-6 text-orange-400 relative z-10 animate-pulse" />
                    ) : (
                      <EyeOff className="w-6 h-6 text-white/30 group-hover:text-orange-400/60 transition-colors relative z-10" />
                    )}
                    {isWatching && <div className="absolute top-0 left-0 w-full h-[1px] bg-orange-400/50 animate-scan z-20" />}
                  </button>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isWatching ? 'text-orange-400' : 'text-white/20'}`}>
                    UPLINK
                  </span>
                </div>

                {/* CODER / STUDIO LINK */}
                <div className="flex flex-col items-center gap-1 group">
                  <Link
                    href="/coder"
                    className="relative h-12 w-12 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-500/40 flex items-center justify-center transition-all hover:scale-105"
                    title="Open CubiQo Studio"
                  >
                    <Code2 className="w-6 h-6 text-white/30 group-hover:text-cyan-400 transition-colors" />
                    <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_5px_cyan] translate-x-1/2 -translate-y-1/2" />
                  </Link>
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/20 group-hover:text-cyan-400/80 transition-colors">
                    STUDIO
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right side - Contextual Branding */}
          <div className="flex items-center gap-6">
            {!showLandingCube ? (
              <button
                onClick={handleSignalClick}
                className="group flex flex-col items-end cursor-pointer no-underline"
              >
                <div className="text-2xl sm:text-3xl font-black tracking-[-0.05em] flex select-none">
                  <span className="text-[#E84343]">S</span>
                  <span className="text-[#2D994E] ml-[1px]">I</span>
                  <span className="text-[#F2C94C] ml-[1px]">G</span>
                  <span className="text-white ml-[1px]">NAL</span>
                </div>
                <span className={`text-[10px] uppercase tracking-[0.2em] opacity-40 group-hover:opacity-70 transition-opacity ${isDark ? 'text-white' : 'text-black'}`}>
                  One is enough
                </span>
              </button>
            ) : null}
          </div>
        </div>
      </header>



      {/* Bottom Left Stack: Settings above Sign In */}
      <div className="fixed left-6 bottom-6 z-[55] flex flex-col gap-3">
        {/* CQ Connect Button */}
        <button
          onClick={() => setShowCQPanel(true)}
          className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${isDark
            ? 'bg-zinc-800/80 hover:bg-zinc-700/80 text-orange-500 hover:text-orange-400'
            : 'bg-white/80 hover:bg-white text-orange-600 hover:text-orange-500'
            } backdrop-blur-md shadow-[0_0_15px_rgba(249,115,22,0.1)] border border-orange-500/20 hover:scale-110`}
          title="CQ Connect"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L22 4l-1.5 6.5Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#FF6F00] text-white text-[11px] font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </button>

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
        <AuthButton
          onSignInClick={() => setShowAuthForm(true)}
          onUserClick={() => setMenuOpen(true)}
        />
      </div>

      {/* Right side - CQ Connect + RGY Signal + Keywords underneath */}
      <div className="fixed right-[4.5rem] top-1/2 -translate-y-1/2 z-[60] flex flex-col items-center gap-4">
        {/* Eye Icon for AI Visual Interaction */}
            console.log('AI Visual Interaction activated');
          title="AI Visual Interaction"
        {/* Coding Panel Access Button */}
          href="/coder"
          title="CubiQo Coding Panel"
