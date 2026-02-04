'use client'

/**
 * Audio Context Manager
 * Handles browser audio context initialization for uninterrupted playback
 * Must be initialized on user gesture (click) to avoid browser blocking
 */

let audioContext: AudioContext | null = null

/**
 * Initialize or resume the AudioContext
 * Call this on user gesture (e.g., clicking "Talk to CubiQo")
 */
export function initAudioContext(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Create AudioContext if not exists
      if (!audioContext) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (!AudioContextClass) {
          console.warn('[AudioContext] Not supported in this browser')
          resolve()
          return
        }
        audioContext = new AudioContextClass()
        console.log('[AudioContext] Created new AudioContext')
      }

      // Resume if suspended (browser blocks audio until user gesture)
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          console.log('[AudioContext] Resumed - CubiQo Audio Active')
          resolve()
        }).catch(reject)
      } else {
        console.log('[AudioContext] Already active:', audioContext.state)
        resolve()
      }
    } catch (error) {
      console.error('[AudioContext] Initialization error:', error)
      reject(error)
    }
  })
}

/**
 * Get the current AudioContext instance
 */
export function getAudioContext(): AudioContext | null {
  return audioContext
}

/**
 * Check if AudioContext is ready for playback
 */
export function isAudioContextReady(): boolean {
  return audioContext !== null && audioContext.state === 'running'
}

/**
 * Play audio through the AudioContext (for better browser compatibility)
 * @param audioBuffer ArrayBuffer of audio data
 * @returns Promise that resolves when audio finishes playing
 */
export async function playAudioBuffer(audioBuffer: ArrayBuffer): Promise<void> {
  if (!audioContext) {
    await initAudioContext()
  }
  
  if (!audioContext) {
    throw new Error('AudioContext not available')
  }
  
  // Ensure context is running
  if (audioContext.state === 'suspended') {
    await audioContext.resume()
  }
  
  return new Promise((resolve, reject) => {
    audioContext!.decodeAudioData(
      audioBuffer,
      (buffer) => {
        const source = audioContext!.createBufferSource()
        source.buffer = buffer
        source.connect(audioContext!.destination)
        source.onended = () => resolve()
        source.start(0)
      },
      (error) => {
        console.error('[AudioContext] Decode error:', error)
        reject(error)
      }
    )
  })
}

export default {
  initAudioContext,
  getAudioContext,
  isAudioContextReady,
  playAudioBuffer
}
