'use client'

/**
 * useSpeechRecognition - Voice input using Web Speech API
 */

import { useState, useCallback, useRef, useEffect } from 'react'

interface UseSpeechRecognitionOptions {
  lang?: string
  continuous?: boolean
  onResult?: (transcript: string) => void
  onEnd?: () => void
}

interface SpeechRecognitionState {
  isListening: boolean
  isSupported: boolean
  transcript: string
  error: string | null
}

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message?: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const {
    lang = 'en-US',
    continuous = false,
    onResult,
    onEnd
  } = options

  const [state, setState] = useState<SpeechRecognitionState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    error: null
  })

  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Check browser support
  useEffect(() => {
    const isSupported = typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    setState(prev => ({ ...prev, isSupported }))
  }, [])

  const startListening = useCallback(() => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Speech recognition not supported' }))
      return
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognitionClass()

    recognition.continuous = continuous
    recognition.interimResults = true
    recognition.lang = lang

    recognition.onstart = () => {
      setState(prev => ({ ...prev, isListening: true, error: null, transcript: '' }))
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      const currentTranscript = finalTranscript || interimTranscript
      setState(prev => ({ ...prev, transcript: currentTranscript }))

      if (finalTranscript && onResult) {
        onResult(finalTranscript)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessage = event.error === 'no-speech'
        ? 'No speech detected'
        : event.error === 'not-allowed'
        ? 'Microphone access denied'
        : `Speech error: ${event.error}`

      setState(prev => ({ ...prev, error: errorMessage, isListening: false }))
    }

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }))
      onEnd?.()
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [state.isSupported, continuous, lang, onResult, onEnd])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  const clearTranscript = useCallback(() => {
    setState(prev => ({ ...prev, transcript: '', error: null }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  return {
    startListening,
    stopListening,
    clearTranscript,
    isListening: state.isListening,
    isSupported: state.isSupported,
    transcript: state.transcript,
    error: state.error
  }
}
