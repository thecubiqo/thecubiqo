'use client'

/**
 * TFR-008: Vocspad — Unified Voice + Text Input
 *
 * Merges voice and text into a single cohesive input surface.
 * - Web Speech API streams interim STT results live into the text box
 * - On final result, auto-submits (or awaits manual confirmation)
 * - Microphone button morphs between recording/idle states
 * - Works alongside the existing text input without duplication
 */

import { useState, useRef, useCallback, useEffect } from 'react'

interface VocspadProps {
    onSubmit: (text: string) => void
    isLoading?: boolean
    placeholder?: string
    /** Zone colour accent 'TEAL' | 'RED' | 'YELLOW' | 'ORANGE' */
    zone?: string
    /** If true, automatically submits on final speech result */
    autoSubmit?: boolean
}

// Colour map for zone accents
const ZONE_COLORS: Record<string, string> = {
    TEAL: 'from-teal-600 to-cyan-600',
    RED: 'from-red-600 to-pink-600',
    YELLOW: 'from-yellow-500 to-amber-500',
    ORANGE: 'from-purple-600 to-indigo-600',
}

// SpeechRecognition accessed via (window as any) to avoid lib.dom conflicts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognizer = any

export function Vocspad({
    onSubmit,
    isLoading = false,
    placeholder = 'Type or speak\u2026',
    zone = 'ORANGE',
    autoSubmit = false
}: VocspadProps) {
    const [text, setText] = useState('')
    const [isListening, setIsListening] = useState(false)
    const [interim, setInterim] = useState('')
    const [hasSTT, setHasSTT] = useState(false)
    const recognizerRef = useRef<AnySpeechRecognizer>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Check for browser STT support on mount
    useEffect(() => {
        const w = window as any
        const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition
        setHasSTT(!!SpeechRec)
    }, [])

    const stopListening = useCallback(() => {
        recognizerRef.current?.stop()
        recognizerRef.current = null
        setIsListening(false)
        setInterim('')
    }, [])

    const startListening = useCallback(() => {
        const w = window as any
        const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition
        if (!SpeechRec) return

        const recognizer = new SpeechRec()
        recognizerRef.current = recognizer
        recognizer.lang = 'en-US'
        recognizer.continuous = true
        recognizer.interimResults = true

        recognizer.onstart = () => setIsListening(true)
        recognizer.onend = () => {
            setIsListening(false)
            setInterim('')
        }

        recognizer.onresult = (event: any) => {
            let finalText = ''
            let interimText = ''

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript
                if (event.results[i].isFinal) {
                    finalText += transcript
                } else {
                    interimText += transcript
                }
            }

            if (finalText) {
                setText(prev => {
                    const newText = prev ? `${prev} ${finalText}`.trim() : finalText.trim()
                    if (autoSubmit) {
                        setTimeout(() => {
                            onSubmit(newText)
                            setText('')
                        }, 200)
                    }
                    return newText
                })
                setInterim('')
            } else {
                setInterim(interimText)
            }
        }

        recognizer.onerror = () => {
            setIsListening(false)
            setInterim('')
        }

        recognizer.start()
    }, [autoSubmit, onSubmit])

    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening()
        } else {
            startListening()
        }
    }, [isListening, startListening, stopListening])

    const handleSubmit = useCallback(() => {
        const value = text.trim()
        if (!value || isLoading) return
        stopListening()
        onSubmit(value)
        setText('')
        setInterim('')
    }, [text, isLoading, stopListening, onSubmit])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const gradientClass = ZONE_COLORS[zone] || ZONE_COLORS.ORANGE
    const displayText = text + (interim ? ` ${interim}` : '')

    return (
        <div className="relative w-full">
            {/* Interim transcript hint */}
            {interim && (
                <div className="absolute -top-7 left-0 text-xs text-zinc-500 italic truncate max-w-full">
                    🎙 {interim}
                </div>
            )}

            <div className={`flex items-end gap-2 p-2 rounded-2xl bg-zinc-900 border ${isListening ? 'border-indigo-500/70' : 'border-zinc-800'} transition-colors shadow-sm`}>
                <textarea
                    id="vocspad-input"
                    ref={textareaRef}
                    value={displayText}
                    onChange={e => setText(e.target.value.replace(interim, '').trimStart())}
                    onKeyDown={handleKeyDown}
                    placeholder={isListening ? '🎙 Listening…' : placeholder}
                    rows={1}
                    disabled={isLoading}
                    className="flex-1 bg-transparent text-zinc-100 text-sm placeholder-zinc-600 resize-none outline-none min-h-[36px] max-h-[120px] overflow-y-auto py-2 px-2"
                    style={{ scrollbarWidth: 'none' }}
                />

                <div className="flex items-center gap-1 shrink-0 pb-1">
                    {/* Mic button */}
                    {hasSTT && (
                        <button
                            id="vocspad-mic-btn"
                            onClick={toggleListening}
                            disabled={isLoading}
                            title={isListening ? 'Stop listening' : 'Start voice input'}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isListening
                                ? 'bg-red-500/20 border border-red-500/50 text-red-400 animate-pulse'
                                : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
                                }`}
                        >
                            {isListening ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <rect x="6" y="6" width="12" height="12" rx="2" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            )}
                        </button>
                    )}

                    {/* Send button */}
                    <button
                        id="vocspad-send-btn"
                        onClick={handleSubmit}
                        disabled={!text.trim() || isLoading}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradientClass} text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-sm`}
                    >
                        {isLoading ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
