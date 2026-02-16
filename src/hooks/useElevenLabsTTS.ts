'use client'

/**
 * useElevenLabsTTS - Voice output using ElevenLabs API via backend
 * Falls back to browser speech synthesis if ElevenLabs fails
 * 
 * CubiQo's Voice Character:
 * - NOT robotic - warm and expressive
 * - NOT fully human - has a unique, ethereal quality  
 * - An AI entity with personality - curious, warm, slightly mystical
 * 
 * Voice: "Adam" - smooth, warm, versatile male voice
 * Settings tuned per color zone for mood variation:
 * - GREEN (office): Focused, clear, professional
 * - YELLOW (cafe): Warm, friendly, conversational
 * - RED (intimate): Soft, thoughtful, personal
 * - ORANGE (landing): Balanced, welcoming, curious
 * 
 * Rate limited: 10 requests/minute per session (handled by backend)
 * 
 * BROWSER AUDIO FIX:
 * - Uses AudioContext for reliable playback
 * - Must call initAudioContext() on user gesture before playing
 * - Handles tab visibility changes and browser auto-pause
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type { ColorName } from '@/config/colors'
import { useSession } from '@/hooks/useSession'
import { initAudioContext, isAudioContextReady, getAudioContext } from '@/lib/audio/audioContext'

/**
 * CubiQo's Voice - "Adam" (pNInz6obpgDQGcFmaJgB)
 * A warm, smooth voice that feels approachable yet distinct
 * 
 * Voice settings create CubiQo's unique character:
 * - Lower stability (0.3-0.5) = more expressive, less monotone
 * - Moderate similarity (0.6-0.8) = consistent but not robotic
 * - Higher style (0.4-0.7) = more personality and character
 * - Speaker boost off = softer, more intimate feel
 */
const CUBIQO_VOICE_ID = 'pNInz6obpgDQGcFmaJgB' // Adam - warm, smooth, versatile

const VOICE_SETTINGS: Record<string, {
  voiceId: string
  stability: number
  similarity_boost: number
  style: number
  use_speaker_boost: boolean
}> = {
  GREEN_BLUE: {
    // Office mode - Focused, clear, but still warm
    voiceId: CUBIQO_VOICE_ID,
    stability: 0.45,          // Moderate stability for clarity
    similarity_boost: 0.75,   // Good consistency
    style: 0.45,              // Professional but personable
    use_speaker_boost: false  // Softer presence
  },
  YELLOW: {
    // Cafe mode - Warm, friendly, conversational
    voiceId: CUBIQO_VOICE_ID,
    stability: 0.35,          // More expressive variation
    similarity_boost: 0.65,   // Natural flow
    style: 0.55,              // Friendly and engaging
    use_speaker_boost: false  // Intimate feel
  },
  RED: {
    // Intimate mode - Soft, thoughtful, personal
    voiceId: CUBIQO_VOICE_ID,
    stability: 0.30,          // Most expressive
    similarity_boost: 0.70,   // Warm consistency
    style: 0.65,              // Deep personality
    use_speaker_boost: false  // Very soft, personal
  },
  ORANGE: {
    // Landing/Default - Balanced, welcoming, curious
    voiceId: CUBIQO_VOICE_ID,
    stability: 0.40,          // Expressive but stable
    similarity_boost: 0.70,   // Consistent character
    style: 0.50,              // Balanced personality
    use_speaker_boost: false  // Warm, not booming
  }
}

const DEFAULT_VOICE_ID = CUBIQO_VOICE_ID

interface UseElevenLabsTTSOptions {
  voiceId?: string
  colorName?: ColorName
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: string) => void
}

interface TTSState {
  isSpeaking: boolean
  isLoading: boolean
  error: string | null
  remainingRequests: number
  usingFallback: boolean
  audioUnlocked: boolean
}

export function useElevenLabsTTS(options: UseElevenLabsTTSOptions = {}) {
  const {
    voiceId = DEFAULT_VOICE_ID,
    colorName = 'ORANGE',
    onStart,
    onEnd,
    onError
  } = options

  const { session } = useSession()

  const [state, setState] = useState<TTSState>({
    isSpeaking: false,
    isLoading: false,
    error: null,
    remainingRequests: 10,
    usingFallback: false,
    audioUnlocked: false
  })

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const isUserPausedRef = useRef<boolean>(false)
  const audioUrlRef = useRef<string | null>(null)

  /**
   * Unlock audio playback - MUST be called on user gesture (click)
   */
  const unlockAudio = useCallback(async () => {
    try {
      await initAudioContext()
      
      // Also create and play a silent audio to fully unlock on iOS/Safari
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA')
      silentAudio.volume = 0.01
      try {
        await silentAudio.play()
        silentAudio.pause()
      } catch {
        // Ignore silent audio errors
      }
      
      setState(prev => ({ ...prev, audioUnlocked: true }))
      console.log('[TTS] Audio unlocked - ready for playback')
      return true
    } catch (error) {
      console.error('[TTS] Failed to unlock audio:', error)
      return false
    }
  }, [])

  // Handle visibility changes (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab became hidden - don't auto-pause, let audio continue in background
        console.log('[TTS] Tab hidden, audio continues in background')
      } else {
        // Tab became visible - ensure AudioContext is running
        const ctx = getAudioContext()
        if (ctx && ctx.state === 'suspended') {
          console.log('[TTS] Tab visible, resuming AudioContext')
          ctx.resume().catch(e => console.warn('[TTS] AudioContext resume failed:', e))
        }
        // Resume audio if it was playing
        if (audioRef.current && audioRef.current.paused && !audioRef.current.ended && !isUserPausedRef.current) {
          console.log('[TTS] Tab visible, resuming audio playback')
          audioRef.current.play().catch(e => console.warn('[TTS] Audio resume failed:', e))
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Browser fallback speech synthesis
  const speakWithBrowserTTS = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      const error = 'Speech synthesis not supported'
      setState(prev => ({ ...prev, isLoading: false, error }))
      onError?.(error)
      return
    }

    window.speechSynthesis.cancel()

    const speakText = () => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.92
      utterance.pitch = 1.05
      utterance.volume = 1

      utterance.onstart = () => {
        setState(prev => ({ ...prev, isSpeaking: true, isLoading: false, usingFallback: true }))
        onStart?.()
      }

      utterance.onend = () => {
        setState(prev => ({ ...prev, isSpeaking: false }))
        onEnd?.()
      }

      utterance.onerror = () => {
        const error = 'Browser speech error'
        setState(prev => ({ ...prev, isSpeaking: false, isLoading: false, error }))
        onError?.(error)
      }

      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    }

    // Check if voices are loaded
    const voices = window.speechSynthesis.getVoices()
    if (voices.length === 0) {
      // Wait for voices to load with timeout
      let voicesLoaded = false
      const timeout = setTimeout(() => {
        if (!voicesLoaded) {
          console.warn('[TTS] Voice loading timeout, proceeding anyway')
          speakText()
        }
      }, 2000)

      window.speechSynthesis.addEventListener('voiceschanged', () => {
        if (!voicesLoaded) {
          voicesLoaded = true
          clearTimeout(timeout)
          speakText()
        }
      }, { once: true })
    } else {
      speakText()
    }
  }, [onStart, onEnd, onError])

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return

    // Cancel any ongoing speech
    stop()
    isUserPausedRef.current = false

    // Ensure audio is unlocked
    if (!isAudioContextReady()) {
      console.log('[TTS] AudioContext not ready, attempting to unlock...')
      await initAudioContext()
    }

    console.log('[TTS] Starting speech for color:', colorName, 'Text length:', text.length)
    setState(prev => ({ ...prev, isLoading: true, error: null, usingFallback: false }))

    try {
      abortControllerRef.current = new AbortController()
      
      const settings = VOICE_SETTINGS[colorName] || VOICE_SETTINGS.ORANGE
      const selectedVoiceId = settings.voiceId || voiceId
      
      console.log('[TTS] Using voice:', selectedVoiceId)

      // Call our backend TTS API
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          voiceId: selectedVoiceId,
          sessionId: session?.id ?? 'anonymous',
          stability: settings.stability,
          similarity_boost: settings.similarity_boost,
          style: settings.style,
          use_speaker_boost: settings.use_speaker_boost
        }),
        signal: abortControllerRef.current.signal
      })

      // Check rate limit from headers
      const remaining = response.headers.get('x-ratelimit-remaining')
      if (remaining) {
        setState(prev => ({ ...prev, remainingRequests: parseInt(remaining) }))
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.warn('[TTS] ElevenLabs failed:', response.status, errorText, '- falling back to browser TTS')
        speakWithBrowserTTS(text)
        return
      }

      console.log('[TTS] ElevenLabs success, playing audio...')
      const audioBlob = await response.blob()
      console.log('[TTS] Audio blob size:', audioBlob.size, 'bytes')
      
      // Clean up previous URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
      
      const audioUrl = URL.createObjectURL(audioBlob)
      audioUrlRef.current = audioUrl

      // Create audio element
      const audio = new Audio()
      audio.preload = 'auto'
      
      // Critical: Set playsinline for iOS
      audio.setAttribute('playsinline', 'true')
      audio.setAttribute('webkit-playsinline', 'true')
      
      audioRef.current = audio

      // Ensure audio context is active
      const ctx = getAudioContext()
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume()
      }

      let hasStarted = false
      
      // Wait for audio to be fully loaded before playing
      await new Promise<void>((resolve, reject) => {
        audio.oncanplaythrough = () => {
          console.log('[TTS] Audio fully loaded, duration:', audio.duration)
          resolve()
        }
        audio.onerror = (e) => {
          console.error('[TTS] Audio load error:', e)
          reject(new Error('Audio load failed'))
        }
        // Set timeout for loading
        setTimeout(() => {
          if (audio.readyState >= 3) {
            resolve()
          } else {
            console.warn('[TTS] Audio load timeout, attempting anyway...')
            resolve()
          }
        }, 5000)
        
        // Start loading
        audio.src = audioUrl
        audio.load()
      })

      audio.onplay = () => {
        if (!hasStarted) {
          hasStarted = true
          console.log('[TTS] Audio started playing')
          setState(prev => ({ ...prev, isSpeaking: true, isLoading: false }))
          onStart?.()
        }
      }

      // Handle pause events more gracefully - don't auto-resume on every pause
      audio.onpause = () => {
        console.log('[TTS] Audio paused, ended:', audio.ended, 'user paused:', isUserPausedRef.current)
        // Only try to resume if:
        // 1. Audio hasn't ended
        // 2. User didn't manually pause
        // 3. Tab is visible
        if (!audio.ended && !isUserPausedRef.current && !document.hidden) {
          // Wait a bit to see if this is a temporary browser pause
          setTimeout(() => {
            if (audioRef.current === audio && audio.paused && !audio.ended && !isUserPausedRef.current) {
              console.log('[TTS] Attempting auto-resume...')
              audio.play().catch(e => {
                console.log('[TTS] Auto-resume failed:', e.message)
              })
            }
          }, 200)
        }
      }

      audio.onended = () => {
        console.log('[TTS] Audio ended naturally')
        setState(prev => ({ ...prev, isSpeaking: false }))
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current)
          audioUrlRef.current = null
        }
        onEnd?.()
      }

      audio.onerror = (e) => {
        console.error('[TTS] Audio playback error:', e)
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current)
          audioUrlRef.current = null
        }
        console.warn('[TTS] Falling back to browser TTS')
        speakWithBrowserTTS(text)
      }

      // Play with retry logic
      try {
        await audio.play()
      } catch (playError) {
        console.warn('[TTS] Initial play failed:', playError)
        // Retry after ensuring audio context
        await initAudioContext()
        try {
          await audio.play()
        } catch (retryError) {
          console.error('[TTS] Retry play failed:', retryError)
          speakWithBrowserTTS(text)
        }
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      
      console.warn('[TTS] Error, falling back to browser TTS:', err)
      speakWithBrowserTTS(text)
    }
  }, [voiceId, colorName, session?.id, onStart, onEnd, speakWithBrowserTTS])

  const stop = useCallback(() => {
    isUserPausedRef.current = true
    
    // Abort fetch if in progress
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    // Stop audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    
    // Clean up URL
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }

    // Stop browser TTS
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    setState(prev => ({ ...prev, isSpeaking: false, isLoading: false }))
  }, [])

  const pause = useCallback(() => {
    isUserPausedRef.current = true
    if (audioRef.current) {
      audioRef.current.pause()
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause()
    }
  }, [])

  const resume = useCallback(() => {
    isUserPausedRef.current = false
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.warn('[TTS] Resume failed:', e))
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume()
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    speak,
    stop,
    pause,
    resume,
    unlockAudio,
    isSpeaking: state.isSpeaking,
    isLoading: state.isLoading,
    error: state.error,
    remainingRequests: state.remainingRequests,
    usingFallback: state.usingFallback,
    audioUnlocked: state.audioUnlocked
  }
}

export default useElevenLabsTTS
