'use client'

/**
 * AG-UI-1: useAudioAnalyser — Web Audio API hook
 * 
 * Captures TTS audio playback through an AnalyserNode and returns
 * real-time amplitude data so the 3D cube can pulse to the TTS voice.
 * 
 * Usage:
 *   const { amplitude, connectAudio, disconnectAudio } = useAudioAnalyser()
 *   // amplitude: 0.0–1.0 normalised frequency energy
 *   // connectAudio(audioElement) — call when TTS starts playing
 *   // disconnectAudio() — call when TTS finishes
 */

import { useRef, useCallback, useEffect, useState } from 'react'

export interface AudioAnalyserState {
    amplitude: number        // 0.0–1.0, current loudness
    isSpeaking: boolean      // true while TTS audio is above silence threshold
    connectAudio: (source: HTMLAudioElement | MediaStream) => void
    disconnectAudio: () => void
}

const SILENCE_THRESHOLD = 0.02
const FFT_SIZE = 512

export function useAudioAnalyser(): AudioAnalyserState {
    const contextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const sourceRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null)
    const rafRef = useRef<number | null>(null)
    const dataRef = useRef<Uint8Array | null>(null)

    const [amplitude, setAmplitude] = useState(0)
    const [isSpeaking, setIsSpeaking] = useState(false)

    const stopLoop = useCallback(() => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
        setAmplitude(0)
        setIsSpeaking(false)
    }, [])

    const startLoop = useCallback(() => {
        const analyser = analyserRef.current
        if (!analyser) return

        const data = new Uint8Array(analyser.frequencyBinCount)
        dataRef.current = data

        const tick = () => {
            analyser.getByteFrequencyData(data)

            // Average frequency energy across all bins, normalised to 0–1
            let sum = 0
            for (let i = 0; i < data.length; i++) sum += data[i]
            const avg = sum / (data.length * 255)

            setAmplitude(avg)
            setIsSpeaking(avg > SILENCE_THRESHOLD)
            rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)
    }, [])

    const connectAudio = useCallback((source: HTMLAudioElement | MediaStream) => {
        // Reuse existing AudioContext if available
        if (!contextRef.current || contextRef.current.state === 'closed') {
            contextRef.current = new AudioContext()
        }

        const ctx = contextRef.current

        // Resume suspended context (browsers require user gesture)
        if (ctx.state === 'suspended') ctx.resume()

        // Disconnect previous source
        if (sourceRef.current) {
            try { sourceRef.current.disconnect() } catch { }
        }

        const analyser = ctx.createAnalyser()
        analyser.fftSize = FFT_SIZE
        analyser.smoothingTimeConstant = 0.75
        analyserRef.current = analyser

        if (source instanceof HTMLAudioElement) {
            const mediaSource = ctx.createMediaElementSource(source)
            mediaSource.connect(analyser)
            analyser.connect(ctx.destination)
            sourceRef.current = mediaSource
        } else {
            // MediaStream (e.g. from WebRTC or Web Speech)
            const streamSource = ctx.createMediaStreamSource(source)
            streamSource.connect(analyser)
            sourceRef.current = streamSource
        }

        startLoop()
    }, [startLoop])

    const disconnectAudio = useCallback(() => {
        stopLoop()
        if (sourceRef.current) {
            try { sourceRef.current.disconnect() } catch { }
            sourceRef.current = null
        }
        if (analyserRef.current) {
            try { analyserRef.current.disconnect() } catch { }
            analyserRef.current = null
        }
    }, [stopLoop])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopLoop()
            if (contextRef.current && contextRef.current.state !== 'closed') {
                contextRef.current.close()
            }
        }
    }, [stopLoop])

    return { amplitude, isSpeaking, connectAudio, disconnectAudio }
}
