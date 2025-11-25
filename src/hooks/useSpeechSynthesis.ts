'use client'

/**
 * useSpeechSynthesis - Voice output using Web Speech API
 */

import { useState, useCallback, useRef, useEffect } from 'react'

interface UseSpeechSynthesisOptions {
  lang?: string
  rate?: number
  pitch?: number
  volume?: number
  onStart?: () => void
  onEnd?: () => void
}

interface SpeechSynthesisState {
  isSpeaking: boolean
  isSupported: boolean
  error: string | null
}

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}) {
  const {
    lang = 'en-US',
    rate = 1,
    pitch = 1,
    volume = 1,
    onStart,
    onEnd
  } = options

  const [state, setState] = useState<SpeechSynthesisState>({
    isSpeaking: false,
    isSupported: false,
    error: null
  })

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Check browser support
  useEffect(() => {
    const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
    setState(prev => ({ ...prev, isSupported }))
  }, [])

  const speak = useCallback((text: string) => {
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
  }, [state.isSupported, lang, rate, pitch, volume, onStart, onEnd])

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

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking: state.isSpeaking,
    isSupported: state.isSupported,
    error: state.error
  }
}
