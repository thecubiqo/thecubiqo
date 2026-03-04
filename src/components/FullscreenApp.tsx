'use client'

/**
 * FullscreenApp - Exact replica of legacy cubiqo.ai design
 * With proper state machine: idle → listening → thinking → speaking → idle
 */

import React from 'react';
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
        speak("I am listening.")
        // Note: the TTS 'onEnd' handler automatically cascades into startListeningRef.current()
        // if voiceEnabledRef.current is true, which gives a seamless transition from speaking 
        // "I am listening" right into transcription listening state.
      }
    } else {
      // Turn OFF - Stop everything and go to idle
      setVoiceEnabled(false)
      setAppState('idle')
      setAnimationState('idle')
      stopListening()
      stopSpeaking()
    }
  }, [chatInitialized, voiceEnabled, startListening, stopListening, stopSpeaking, unlockAudio, speak])

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

      {/* Energy Cube - Centered Hero Section */}
      <div
        className="fixed top-1/2 left-1/2 z-[1] flex items-center justify-center w-[90vw] max-w-6xl h-[65vh]"
        style={{
          transform: `translate(-50%, -50%) ${cubeSize !== 100 ? `scale(${cubeSize / 100})` : ''}`,
          transformOrigin: 'center center',
          maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
        }}
        onClick={handleVoiceClick}
      >
        <EnergyCubeScene
          colorName={colorName}
          animationState={animationState}
          isWatching={isWatching}
          facePosition={facePos}
          engagement={aiContext?.userState?.engagement || 'medium'}
        />
      </div>

      {/* Background click layer to wake */}
      {showFloatingQuestions && <div onClick={handleVoiceClick} className="absolute inset-0 z-[0] cursor-pointer" title="Tap to wake" />}

      {/* Floating Questions - Slow Scroll */}
      {showFloatingQuestions && (
        <div className="fixed left-8 top-1/2 -translate-y-1/2 z-[8] w-[400px] h-[300px] overflow-hidden pointer-events-none">
          <button
            onClick={() => setShowFloatingQuestions(false)}
            className="absolute top-0 right-0 z-10 p-1.5 rounded-full text-white/30 hover:text-white/60 hover:bg-white/10 transition-all duration-200 pointer-events-auto"
            aria-label="Dismiss questions"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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
          <div className="flex items-center gap-4">
            {/* The orange logo SVG */}
            <div className="flex justify-center items-center w-12 h-12 rounded-full border border-[#FF6600]/30 bg-black/40 shadow-[0_0_15px_rgba(255,102,0,0.2)]">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#FF6600]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
          </div>

          {/* Right side - Contextual Branding */}
          <div className="flex items-center gap-6 ml-auto">
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

      {/* Center Speaker Morph Target */}
      {!showLandingCube && appState !== 'listening' && appState !== 'speaking' && appState !== 'thinking' && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100]">
          <button
            onClick={handleVoiceClick}
            className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:scale-110 hover:border-orange-500/50 transition-all duration-500 shadow-[0_0_30px_rgba(255,165,0,0)] hover:shadow-[0_0_30px_rgba(255,165,0,0.3)] group"
          >
            <svg className="w-8 h-8 text-white/50 group-hover:text-orange-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
            </svg>
          </button>
        </div>
      )}

      {/* Bottom Left Stack: Settings & Sign In */}
      <div className="fixed left-8 bottom-8 z-[100] flex flex-col gap-4">
        {/* Settings Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-3 text-[13px] font-medium transition-colors text-white/50 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          Settings
        </button>

        {/* Sign In Button / User */}
        <button
          onClick={() => {
            if (!isAuthenticated) setShowAuthForm(true)
          }}
          className="flex items-center gap-3 text-[13px] font-medium transition-colors text-white/50 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
          {isAuthenticated && user ? user.email?.split('@')[0] : 'Sign In'}
        </button>

        {/* User Menu Dialog (Settings) */}
        {menuOpen && (
          <div className="absolute bottom-full left-0 mb-4 w-64 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-2">
            <Link href="/journal" className="flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <span>📓</span> Daily Journal
            </Link>
            <Link href="/journey" className="flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <span>✨</span> The Journey Program
            </Link>
            <Link href="/job-hunt" className="flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <span>🎯</span> Job Hunt Tracker
            </Link>
            <Link href="/agents" className="flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <span>🤖</span> AI Agents
            </Link>
            <Link href="/admin/ecomm" className="flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <span>🛍️</span> Merchandise / Ecomm
            </Link>
            {isAuthenticated && (
              <>
                <div className="h-px bg-white/10 my-2" />
                <button onClick={() => { signOut(); setMenuOpen(false) }} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-colors">
                  Sign Out
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Right Stack: CQ Connect */}
      <div className="fixed right-8 bottom-8 z-[100]">
        <button
          onClick={() => setShowCQPanel(true)}
          className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 bg-zinc-800/80 hover:bg-zinc-700/80 text-purple-500 hover:text-purple-400 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.2)] border border-purple-500/30 hover:scale-110`}
          title="CQ Connect"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
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
      </div>

      {/* Right side - RGY Window / Keywords */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-[100] flex flex-col items-center gap-4">
        {/* RGY Signal Traffic Lights */}
        <button
          onClick={() => setShowRGYChats(true)}
          className="flex flex-col gap-1.5 p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:border-white/30 transition-all hover:scale-105"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
        </button>

        <button
          onClick={() => setShowKeywordPanel(!showKeywordPanel)}
          className="flex flex-col items-center gap-1 group mt-4"
        >
          <div className="w-10 h-10 rounded-full border border-white/10 bg-black/40 flex items-center justify-center hover:bg-black/60 hover:border-white/30 transition-all">
            <span className="text-white/50 group-hover:text-white transition-colors text-lg font-bold">#</span>
          </div>
          <span className="text-[9px] uppercase tracking-widest text-white/30 group-hover:text-white/60">Keywords</span>
        </button>
      </div>

      {/* RENDER MODALS */}
      {
        showAuthForm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="relative bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm">
              <button
                onClick={() => setShowAuthForm(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white"
              >
                ✕
              </button>
              <LoginForm />
            </div>
          </div>
        )
      }
      <SidePanel isOpen={showCQPanel} onClose={() => setShowCQPanel(false)} />
      {showKeywordPanel && <KeywordPanel isOpen={showKeywordPanel} onClose={() => setShowKeywordPanel(false)} />}
      {showRGYChats && <RGYChatsModal isOpen={showRGYChats} onClose={() => setShowRGYChats(false)} />}
      <AuthNudgeModal isOpen={showNudgeModal} onClose={() => setShowNudgeModal(false)} cta={nudgeCta} />
    </div >
  )
}
