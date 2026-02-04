'use client'

/**
 * useElevenLabsTTS - Voice output using ElevenLabs API via backend
 * Falls back to browser speech synthesis if ElevenLabs fails
 * 
 * Provides natural human-like voice with mood-based settings:
 * - GREEN (office): Professional, measured
 * - YELLOW (cafe): Warm, relaxed
 * - RED (intimate): Deep, whisper-like
 * - ORANGE (landing): Neutral, balanced
 * 
 * Rate limited: 10 requests/minute per session (handled by backend)
 * 
 * BROWSER AUDIO FIX:
 * - Uses AudioContext for reliable playback
 * - Must call initAudioContext() on user gesture before playing
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type { ColorName } from '@/config/colors'
import { useSession } from '@/hooks/useSession'
import { initAudioContext, isAudioContextReady } from '@/lib/audio/audioContext'

/**
 * Voice settings per color zone
 * SAME VOICE (Daniel - British, husky, butler-like) with different tempo/mood:
 * - GREEN: Office-like, focused, direct
 * - YELLOW: Candid, relaxed, friendly
 * - RED: Intimate, whisper-like, soft
 * - ORANGE: Balanced, default
 */
const VOICE_SETTINGS: Record<string, {
  voiceId: string  // Same voice with different settings
  stability: number
  similarity_boost: number
  style: number
  use_speaker_boost: boolean
}> = {
  GREEN_BLUE: {
    // Office/Focused - Direct, professional tempo
    voiceId: 'onwK4e9ZLuTAKqWW03F9',  // Daniel - British, sophisticated
    stability: 0.8,           // More stable, controlled
    similarity_boost: 0.85,   // High clarity
    style: 0.15,              // Less expressive, more direct
    use_speaker_boost: true   // Clear enunciation
  },
  YELLOW: {
    // Relaxed/Candid - Warm, friendly tempo
    voiceId: 'onwK4e9ZLuTAKqWW03F9',  // Same Daniel voice
    stability: 0.55,          // More natural variation
    similarity_boost: 0.7,    // Balanced
    style: 0.35,              // More expressive, relaxed
    use_speaker_boost: true   // Keep clarity
  },
  RED: {
    // Intimate/Whisper - Soft, thoughtful, husky
    voiceId: 'onwK4e9ZLuTAKqWW03F9',  // Same Daniel voice
    stability: 0.9,           // Very smooth
    similarity_boost: 0.95,   // Maximum similarity for intimacy
    style: 0.6,               // Maximum expressiveness
    use_speaker_boost: false  // Softer, more intimate
  },
  ORANGE: {
    // Default/Landing - Balanced butler-like
    voiceId: 'onwK4e9ZLuTAKqWW03F9',  // Same Daniel voice
    stability: 0.7,
    similarity_boost: 0.75,
    style: 0.25,
    use_speaker_boost: true
  }
}

// Single voice - Daniel (British, husky, butler-like)
const DEFAULT_VOICE_ID = 'onwK4e9ZLuTAKqWW03F9'

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

  /**
   * Unlock audio playback - MUST be called on user gesture (click)
   * This initializes the AudioContext to allow audio playback
   */
  const unlockAudio = useCallback(async () => {
    try {
      await initAudioContext()
      setState(prev => ({ ...prev, audioUnlocked: true }))
      console.log('[TTS] Audio unlocked - ready for playback')
      return true
    } catch (error) {
      console.error('[TTS] Failed to unlock audio:', error)
      return false
    }
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
  }, [onStart, onEnd, onError])

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return

    // Cancel any ongoing speech
    stop()

    // Ensure audio is unlocked (should already be from user gesture)
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
      
      console.log('[TTS] Using voice:', selectedVoiceId, 'Settings:', settings)

      // Call our backend TTS API (uses streaming endpoint)
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
        // If ElevenLabs fails, fall back to browser TTS
        const errorText = await response.text()
        console.warn('[TTS] ElevenLabs failed:', response.status, errorText, '- falling back to browser TTS')
        speakWithBrowserTTS(text)
        return
      }

      console.log('[TTS] ElevenLabs success, playing audio...')
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      // Create audio element with explicit settings for autoplay
      const audio = new Audio()
      audio.preload = 'auto'
      audio.src = audioUrl
      audioRef.current = audio

      // Ensure audio context is active
      if (!isAudioContextReady()) {
        await initAudioContext()
      }

      audio.onplay = () => {
        console.log('[TTS] Audio started playing')
        setState(prev => ({ ...prev, isSpeaking: true, isLoading: false }))
        onStart?.()
      }

      audio.onpause = () => {
        // Handle browser auto-pause (e.g., tab switch)
        console.log('[TTS] Audio paused, attempting resume...')
        // Try to resume after a brief delay
        setTimeout(() => {
          if (audioRef.current && audioRef.current.paused && !audioRef.current.ended) {
            audioRef.current.play().catch(e => console.log('[TTS] Resume failed:', e))
          }
        }, 100)
      }

      audio.onended = () => {
        console.log('[TTS] Audio ended')
        setState(prev => ({ ...prev, isSpeaking: false }))
        URL.revokeObjectURL(audioUrl)
        onEnd?.()
      }

      audio.onerror = (e) => {
        console.error('[TTS] Audio playback error:', e)
        URL.revokeObjectURL(audioUrl)
        // Fall back to browser TTS on playback error
        console.warn('[TTS] Falling back to browser TTS')
        speakWithBrowserTTS(text)
      }

      // Play with user interaction context
      try {
        await audio.play()
      } catch (playError) {
        console.warn('[TTS] Initial play failed, retrying...', playError)
        // Retry after ensuring audio context
        await initAudioContext()
        await audio.play()
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      
      // Fall back to browser TTS on any error
      console.warn('[TTS] Error, falling back to browser TTS:', err)
      speakWithBrowserTTS(text)
    }
  }, [voiceId, colorName, session?.id, onStart, onEnd, speakWithBrowserTTS])

  const stop = useCallback(() => {
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

    // Stop browser TTS
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    setState(prev => ({ ...prev, isSpeaking: false, isLoading: false }))
  }, [])

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause()
    }
  }, [])

  const resume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play()
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
    unlockAudio,  // Call this on user gesture to enable audio
    isSpeaking: state.isSpeaking,
    isLoading: state.isLoading,
    error: state.error,
    remainingRequests: state.remainingRequests,
    usingFallback: state.usingFallback,
    audioUnlocked: state.audioUnlocked
  }
}

export default useElevenLabsTTS
