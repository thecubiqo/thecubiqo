/**
 * Voice Modulation System - Madhyama Marg (Middle Path)
 * 
 * Dynamically shifts voice between sincere, candid, and intimate tones
 * while maintaining the same voice identity. Balances between too-human
 * (sounds fake) and too-robotic (sounds cold).
 * 
 * Philosophy: The voice should adapt to content naturally, like a real person
 * shifts between serious, playful, and intimate modes - but with subtle AI signature.
 */

export type VoiceMood = 'sincere' | 'candid' | 'intimate' | 'neutral'

export interface VoiceSettings {
  stability: number        // 0-1: Lower = more expressive/varied, Higher = consistent
  similarity_boost: number // 0-1: How much to match original voice
  style: number           // 0-1: Exaggeration of speaking style
  use_speaker_boost: boolean
}

/**
 * Voice configurations for different emotional contexts
 * 
 * The madhyama marg balance:
 * - Not perfectly stable (would sound robotic)
 * - Not too wild (would sound fake/over-acted)
 * - Similarity stays high to maintain voice identity
 * - Style varies to add natural expressiveness
 */
export const VOICE_MOODS: Record<VoiceMood, VoiceSettings> = {
  // Professional, sincere, focused - like explaining something important
  sincere: {
    stability: 0.75,        // Quite stable, but not robotic
    similarity_boost: 0.75, // Strong voice identity
    style: 0.15,           // Minimal style exaggeration
    use_speaker_boost: true
  },
  
  // Playful, conversational, laughing - casual friend energy
  candid: {
    stability: 0.40,        // More varied/expressive
    similarity_boost: 0.70, // Still recognizable
    style: 0.65,           // High expressiveness for laughter/playfulness
    use_speaker_boost: true
  },
  
  // Whisper-like, intimate, close - romantic/vulnerable moments
  intimate: {
    stability: 0.60,        // Medium - intimate but not monotone
    similarity_boost: 0.85, // Very close to original voice for intimacy
    style: 0.25,           // Subtle style for natural whisper
    use_speaker_boost: false // No boost for softer, intimate sound
  },
  
  // Balanced default - madhyama marg baseline
  neutral: {
    stability: 0.65,
    similarity_boost: 0.75,
    style: 0.30,
    use_speaker_boost: true
  }
}

/**
 * Detect mood from message content using keyword analysis
 */
export function detectVoiceMood(text: string): VoiceMood {
  const lowerText = text.toLowerCase()
  
  // Intimate/whisper markers
  const intimateMarkers = [
    'whisper', 'softly', 'quietly', 'secret', 'between us', 
    'confession', 'vulnerable', 'intimate', 'close', 'personal',
    '❤️', '💕', '🥺'
  ]
  
  // Candid/playful markers
  const candidMarkers = [
    'haha', 'lol', 'hehe', 'funny', 'joke', 'kidding',
    'casual', 'honestly', 'by the way', 'btw', 'anyway',
    'literally', 'basically', 'like,', 'so,', 
    '😂', '😄', '🤣', '😅'
  ]
  
  // Sincere/serious markers
  const sincereMarkers = [
    'important', 'serious', 'understand', 'explain', 'however',
    'therefore', 'consequently', 'significant', 'crucial',
    'analysis', 'data', 'research', 'study', 'evidence'
  ]
  
  // Count matches
  const intimateScore = intimateMarkers.reduce((sum, marker) => 
    sum + (lowerText.includes(marker) ? 1 : 0), 0
  )
  const candidScore = candidMarkers.reduce((sum, marker) => 
    sum + (lowerText.includes(marker) ? 1 : 0), 0
  )
  const sincereScore = sincereMarkers.reduce((sum, marker) => 
    sum + (lowerText.includes(marker) ? 1 : 0), 0
  )
  
  // Detect based on highest score
  const maxScore = Math.max(intimateScore, candidScore, sincereScore)
  
  if (maxScore === 0) return 'neutral'
  if (intimateScore === maxScore) return 'intimate'
  if (candidScore === maxScore) return 'candid'
  if (sincereScore === maxScore) return 'sincere'
  
  return 'neutral'
}

/**
 * Add subtle randomness to prevent sounding too mechanical
 * Madhyama marg: small variations that feel natural, not jarring
 */
export function addNaturalVariation(settings: VoiceSettings): VoiceSettings {
  const variance = 0.05 // 5% variance
  
  return {
    stability: Math.max(0, Math.min(1, 
      settings.stability + (Math.random() - 0.5) * variance
    )),
    similarity_boost: Math.max(0, Math.min(1,
      settings.similarity_boost + (Math.random() - 0.5) * variance * 0.5 // Less variance for identity
    )),
    style: Math.max(0, Math.min(1,
      settings.style + (Math.random() - 0.5) * variance
    )),
    use_speaker_boost: settings.use_speaker_boost
  }
}

/**
 * Get voice settings with optional mood override and natural variation
 */
export function getVoiceSettings(
  text: string,
  moodOverride?: VoiceMood,
  addVariation: boolean = true
): VoiceSettings {
  const mood = moodOverride || detectVoiceMood(text)
  const baseSettings = VOICE_MOODS[mood]
  
  return addVariation ? addNaturalVariation(baseSettings) : baseSettings
}
