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
            <Link href="/" className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-full border border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.15)] group transition-all duration-500 hover:scale-105">
              <svg
                viewBox="0 0 24 24"
                className="w-7 h-7 sm:w-10 sm:h-10 text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 22V12" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20 7l-8 5-8-5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 12l8-5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 12l-8-5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="2" className="fill-orange-500/20" />
              </svg>
            </Link>
            <div className="flex items-start">
              <span className={`text-2xl sm:text-3xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                CubiQo
              </span>
              <span className={`text-[10px] sm:text-[12px] font-medium ml-0.5 -mt-0.5 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                TM
              </span>
            </div>

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
          <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} border transition-all hover:scale-110`}>
            <svg className="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          </div>
          <span className="text-[10px] font-medium tracking-widest uppercase opacity-40 group-hover:opacity-100">Keywords</span>
        </button>
      </div>

      {/* Voice Enable Control - As low as possible on screen */}
      <div className="fixed bottom-[40px] left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center">
        <button
          onClick={handleVoiceClick}
          disabled={!voiceSupported}
          data-testid="voice-control-button"
          className={`group flex flex-col items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 ${voiceSupported
            ? 'hover:bg-white/[0.04] cursor-pointer'
            : 'cursor-default'
            }`}
        >
          {/* Speaker Icon */}
          <div className={`relative p-3.5 rounded-full transition-all duration-300 ${voiceEnabled
            ? 'bg-white/[0.12] shadow-[0_0_20px_rgba(255,255,255,0.06)]'
            : 'bg-white/[0.04] group-hover:bg-white/[0.07] border border-white/[0.06]'
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
                <div className="absolute inset-0 rounded-full border border-white/20 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-[-4px] rounded-full border border-white/10 animate-pulse" />
              </>
            )}
          </div>

          {/* Label - Only show browser unsupported message */}
          {!voiceSupported && (
            <span
              className="text-[13px] tracking-wide text-white/40"
            >
              Voice access is controlled by your browser.
            </span>
          )}
        </button>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-2 left-0 right-0 z-50">
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] text-white/20 tracking-wider text-center font-light">
            All conversations are confidential. CubiQo never retains user voice by policy.
            <span className="mx-2">·</span>
            <button
              onClick={() => setMenuOpen(true)}
              className="text-white/30 hover:text-white/50 transition-colors"
            >
              Try BYO Mode
            </button>
            <span className="mx-1">—</span>
            <span className="text-white/20">Your data · Your storage · Your API key</span>
            <span className="mx-2">·</span>
            <span className="text-white/15">© 2025 Cubiqo United Inc.</span>
          </p>
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
                  <a
                    href="/journal"
                    className={`flex items-center justify-between py-3 px-4 rounded-xl transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'
                      }`}
                  >
                    <span className={`text-[14px] ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Daily Journal</span>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'
                      }`}>new</span>
                  </a>
                </div >
              </div >

              {/* Soft Divider */}
              < div className={`h-px bg-gradient-to-r from-transparent ${isDark ? 'via-white/[0.06]' : 'via-gray-200'} to-transparent`
              } />

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

              {/* 2.5 RGY Matching */}
              <div>
                <h3 className={`text-[11px] uppercase tracking-[0.15em] mb-4 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>RGY Matching</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setShowOpportunityFeed(true)
                      setMenuOpen(false)
                    }}
                    className={`w-full flex items-center justify-between py-3 px-4 rounded-xl transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'
                      }`}
                  >
                    <span className={`text-[14px] ${isDark ? 'text-white/70' : 'text-gray-700'}`}>Discover Opportunities</span>
                    <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>

                  <button
                    onClick={() => {
                      setShowProMatchSettings(true)
                      setMenuOpen(false)
                    }}
                    className={`w-full flex items-center justify-between py-3 px-4 rounded-xl transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-[14px] ${isDark ? 'text-white/70' : 'text-gray-700'}`}>Pro Match Settings</span>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                        }`}>AI</span>
                    </div>
                    <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
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

              {/* 4. Account (only when authenticated) */}
              {
                isAuthenticated && (
                  <>
                    {/* Soft Divider */}
                    <div className={`h-px bg-gradient-to-r from-transparent ${isDark ? 'via-white/[0.06]' : 'via-gray-200'} to-transparent`} />

                    <div>
                      <h3 className={`text-[11px] uppercase tracking-[0.15em] mb-4 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Account</h3>
                      <div className="space-y-2">
                        {/* User email display */}
                        <div className={`py-3 px-4 rounded-xl ${isDark ? 'bg-white/[0.02]' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {user?.email?.charAt(0).toUpperCase()}
                            </div>
                            <span className={`text-[13px] truncate ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                              {user?.email}
                            </span>
                          </div>
                        </div>

                        {/* Sign Out button */}
                        <button
                          onClick={() => signOut()}
                          className={`w-full py-3 px-4 rounded-xl transition-colors ${isDark
                            ? 'bg-red-600/10 hover:bg-red-600/20 text-red-400'
                            : 'bg-red-50 hover:bg-red-100 text-red-600'
                            }`}
                          data-testid="sign-out-button"
                        >
                          <span className="text-[14px] font-medium">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )
              }
              {/* 5. Admin (only for admins) */}
              {isAuthenticated && (user?.email === 'aditya@cubiqo.ai' || user?.email === 'admin@cubiqo.ai' || process.env.NODE_ENV === 'development') && (
                <>
                  <div className={`h-px bg-gradient-to-r from-transparent ${isDark ? 'via-white/[0.06]' : 'via-gray-200'} to-transparent`} />
                  <div>
                    <h3 className={`text-[11px] uppercase tracking-[0.15em] mb-4 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Admin</h3>
                    <a
                      href="/admin"
                      className={`w-full flex items-center justify-between py-3 px-4 rounded-xl transition-colors ${isDark
                        ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20'
                        : 'bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200'
                        }`}
                    >
                      <span className="text-[14px] font-medium">Control Room</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  </div>
                </>
              )}
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
        </div >
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

      {/* Intent Setup Modal */}
      {selectedRGYContext && (
        <IntentSetup
          isOpen={showIntentSetup}
          onClose={() => {
            setShowIntentSetup(false)
            setSelectedRGYContext(null)
          }}
          isDark={isDark}
          rgyContext={selectedRGYContext}
          onComplete={handleIntentSetupComplete}
        />
      )}

      {/* Opportunity Feed Modal */}
      <OpportunityFeed
        isOpen={showOpportunityFeed}
        onClose={handleBackFromShortlist}
        isDark={isDark}
        rgyContext={selectedRGYContext || undefined}
      />

      {/* Pro Match Settings Modal */}
      <ProMatchSettings
        isOpen={showProMatchSettings}
        onClose={() => setShowProMatchSettings(false)}
        isDark={isDark}
      />

      {/* RGY Color Selector Modal (rgynext) */}
      {showColorSelector && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowColorSelector(false)}
                  className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="font-display text-lg font-semibold tracking-tight">
                  RGY Chats
                </h1>
              </div>
            </div>
          </div>
          <RGYColorSelector
            onColorSelect={handleColorSelect}
            showProMatchBadge={proMatchEnabled}
            proMatchCount={proMatchCount}
          />
        </div>
      )}

      {/* RGY Room List Modal (rgynext) */}
      {showRoomList && selectedChatColor && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackFromRoomList}
                  className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-lg font-semibold tracking-tight">
                    RGY Chats
                  </h1>
                  <span className="text-muted-foreground font-mono text-sm">/</span>
                  <span className={`text-sm font-medium text-rgy-${selectedChatColor}`}>
                    {selectedChatColor === 'green' ? 'Work' : selectedChatColor === 'yellow' ? 'Social' : 'Dating'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <RGYIntentKeywordList
            color={selectedChatColor}
            onRoomSelect={handleRoomSelect}
            onViewProMatchShortlist={proMatchCount > 0 ? handleViewProMatchShortlist : undefined}
            proMatchCount={proMatchCount}
          />
        </div>
      )}

      {/* RGY Room Chat View (rgynext Step 3) */}
      {showRoomChat && selectedRoom && selectedChatColor && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackFromRoomChat}
                  className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-lg font-semibold tracking-tight">
                    RGY Chats
                  </h1>
                  <span className="text-muted-foreground font-mono text-sm">/</span>
                  <span className={`text-sm font-medium text-rgy-${selectedChatColor}`}>
                    {selectedRoom.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <RGYRoomView
            room={selectedRoom}
            color={selectedChatColor}
            onBack={handleBackFromRoomChat}
          />
        </div>
      )}

      {/* Landing Cube - Shown once per day or after 4+ hours 
          Two designs available:
          1. LandingCube (current) - Plasma wave field
          2. TechLandingCube - Wireframe energy cube
          See LANDING_UI_GUIDE.md for switching instructions
      */}
      {/* Landing Cube - Shown once per day or after 4+ hours 
          Two designs available:
          1. LandingCube (current) - Plasma wave field
      {/* Landing UI logic moved to background and overlay components */}


      {/* Journey Memory Prompt - Shown when feature enabled and user not opted in */}
      <JourneyMemoryPrompt position="bottom-left" />

      {/* CQ Connect Side Panel */}
      <SidePanel isOpen={showCQPanel} onClose={() => setShowCQPanel(false)} />

      {/* Top Right CTA - Biometric Auth / Register */}
      {showTopRightCTA && (
        <div className="absolute top-24 right-8 z-[60] pointer-events-auto">
          <TopRightCTA />
        </div>
      )}

    </div >
  )
}
