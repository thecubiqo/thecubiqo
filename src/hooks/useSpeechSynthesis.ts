'use client'

/**
 * useSpeechSynthesis - Voice output using Web Speech API
 *
 * Supports gender-based voice selection for multi-voice worlds (Headlines)
 */

import { useState, useCallback, useRef, useEffect } from 'react'

export type VoiceGender = 'male' | 'female' | 'neutral'

interface UseSpeechSynthesisOptions {
  lang?: string
  rate?: number
  pitch?: number
  volume?: number
  gender?: VoiceGender
  onStart?: () => void
  onEnd?: () => void
}

interface SpeechSynthesisState {
  isSpeaking: boolean
  isSupported: boolean
  error: string | null
  availableVoices: SpeechSynthesisVoice[]
}

// Voice name patterns for gender detection
const MALE_PATTERNS = [
  /\bmale\b/i,
  /\bman\b/i,
  /\bguy\b/i,
  /\bdavid\b/i,
  /\bjames\b/i,
  /\bjohn\b/i,
  /\bdaniel\b/i,
  /\bmark\b/i,
  /\btom\b/i,
  /\balex\b/i,
  /\bgeorge\b/i,
  /\brishi\b/i,
  /\baarav\b/i,
]

const FEMALE_PATTERNS = [
  /\bfemale\b/i,
  /\bwoman\b/i,
  /\bgirl\b/i,
  /\bsamantha\b/i,
  /\bsiri\b/i,
  /\bkaren\b/i,
  /\bvictoria\b/i,
  /\bkate\b/i,
  /\bfiona\b/i,
  /\bmoira\b/i,
  /\bzira\b/i,
  /\bsara\b/i,
  /\banna\b/i,
  /\blekha\b/i,
  /\bpriya\b/i,
]

/**
 * Detect voice gender from voice name
 */
function detectVoiceGender(voice: SpeechSynthesisVoice): VoiceGender {
  const name = voice.name.toLowerCase()

  if (FEMALE_PATTERNS.some(p => p.test(name))) return 'female'
  if (MALE_PATTERNS.some(p => p.test(name))) return 'male'

  return 'neutral'
}

/**
 * Find best matching voice for language and gender
 */
function findVoice(
  voices: SpeechSynthesisVoice[],
  lang: string,
  gender: VoiceGender
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null

  // Filter by language (match 'en' for 'en-US', 'en-GB', etc.)
  const langPrefix = lang.split('-')[0]
  const langVoices = voices.filter(v =>
    v.lang.startsWith(langPrefix) || v.lang.startsWith(lang)
  )

  const searchVoices = langVoices.length > 0 ? langVoices : voices

  // If neutral, return first matching voice
  if (gender === 'neutral') {
    return searchVoices[0]
  }

  // Find voice matching gender
  const genderMatch = searchVoices.find(v => detectVoiceGender(v) === gender)
  if (genderMatch) return genderMatch

  // Fallback to first voice
  return searchVoices[0]
}

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}) {
  const {
    lang = 'en-US',
    rate = 1,
    pitch = 1,
    volume = 1,
    gender = 'neutral',
    onStart,
    onEnd
  } = options

  const [state, setState] = useState<SpeechSynthesisState>({
    isSpeaking: false,
    isSupported: false,
    error: null,
    availableVoices: []
  })

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Check browser support and load voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return
    }

    setState(prev => ({ ...prev, isSupported: true }))

    // Load voices (may be async)
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        setState(prev => ({ ...prev, availableVoices: voices }))
      }
    }

    loadVoices()

    // Chrome loads voices async
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  /**
   * Speak text with optional gender override
   * @param text - Text to speak
   * @param overrideGender - Override the default gender for this utterance
   */
  const speak = useCallback((text: string, overrideGender?: VoiceGender) => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Speech synthesis not supported' }))
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume

    // Select voice based on gender
    const targetGender = overrideGender || gender
    const selectedVoice = findVoice(state.availableVoices, lang, targetGender)
    if (selectedVoice) {
      utterance.voice = selectedVoice
    }

    utterance.onstart = () => {
      setState(prev => ({ ...prev, isSpeaking: true, error: null }))
      onStart?.()
    }

    utterance.onend = () => {
      setState(prev => ({ ...prev, isSpeaking: false }))
      onEnd?.()
    }

    utterance.onerror = (event) => {
      setState(prev => ({
        ...prev,
        isSpeaking: false,
        error: `Speech error: ${event.error}`
      }))
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [state.isSupported, state.availableVoices, lang, rate, pitch, volume, gender, onStart, onEnd])

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setState(prev => ({ ...prev, isSpeaking: false }))
    }
  }, [])

  const pause = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause()
    }
  }, [])

  const resume = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume()
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  /**
   * Speak multi-voice text (for Headlines with [HARI]: and [INGLE]: markers)
   * Parses text for voice markers and speaks each part with appropriate gender
   */
  const speakMultiVoice = useCallback((text: string) => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Speech synthesis not supported' }))
      return
    }

    // Parse voice markers: [HARI]: text [INGLE]: text
    const segments: Array<{ text: string; gender: VoiceGender }> = []

    // Regex to match [NAME]: patterns
    const voicePattern = /\[([A-Z]+)\]:\s*/g
    let lastIndex = 0
    let currentGender: VoiceGender = 'neutral'
    let match

    while ((match = voicePattern.exec(text)) !== null) {
      // Add text before this marker (if any)
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index).trim()
        if (beforeText) {
          segments.push({ text: beforeText, gender: currentGender })
        }
      }

      // Determine gender from marker
      const voiceName = match[1].toUpperCase()
      if (voiceName === 'HARI') {
        currentGender = 'male'
      } else if (voiceName === 'INGLE') {
        currentGender = 'female'
      }

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex).trim()
      if (remainingText) {
        segments.push({ text: remainingText, gender: currentGender })
      }
    }

    // If no markers found, speak entire text with default gender
    if (segments.length === 0) {
      speak(text)
      return
    }

    // Speak segments sequentially
    let currentIndex = 0

    const speakNext = () => {
      if (currentIndex >= segments.length) {
        setState(prev => ({ ...prev, isSpeaking: false }))
        onEnd?.()
        return
      }

      const segment = segments[currentIndex]
      currentIndex++

      const utterance = new SpeechSynthesisUtterance(segment.text)
      utterance.lang = lang
      utterance.rate = rate
      utterance.pitch = pitch
      utterance.volume = volume

      const selectedVoice = findVoice(state.availableVoices, lang, segment.gender)
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }

      utterance.onstart = () => {
        if (currentIndex === 1) {
          setState(prev => ({ ...prev, isSpeaking: true, error: null }))
          onStart?.()
        }
      }

      utterance.onend = () => {
        speakNext()
      }

      utterance.onerror = (event) => {
        setState(prev => ({
          ...prev,
          isSpeaking: false,
          error: `Speech error: ${event.error}`
        }))
      }

      window.speechSynthesis.speak(utterance)
    }

    // Cancel any ongoing speech and start
    window.speechSynthesis.cancel()
    speakNext()
  }, [state.isSupported, state.availableVoices, lang, rate, pitch, volume, speak, onStart, onEnd])

  return {
    speak,
    speakMultiVoice,
    stop,
    pause,
    resume,
    isSpeaking: state.isSpeaking,
    isSupported: state.isSupported,
    availableVoices: state.availableVoices,
    error: state.error
  }
}
