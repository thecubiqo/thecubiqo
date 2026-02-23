/**
 * TFR-007: Voice Personas — RGY Zone → ElevenLabs Voice ID + Micro-Interaction config
 *
 * Each RGY zone maps to:
 * - A distinct ElevenLabs voice ID
 * - Characteristic stability / similarity_boost values
 * - Wake chime + UI micro-interaction behavior
 */

export type RGYZone = 'TEAL' | 'RED' | 'YELLOW' | 'ORANGE'

export interface VoicePersona {
    zoneLabel: string
    voiceId: string              // ElevenLabs voice ID
    stability: number            // 0.0–1.0: higher = more consistent
    similarity_boost: number     // 0.0–1.0: higher = more like the voice sample
    style: number                // 0.0–1.0: expressiveness
    wakeSound: string            // audio cue path or tone descriptor
    description: string
}

/**
 * Zone → Voice Persona mapping
 * Default voice IDs use ElevenLabs public voices;
 * override with custom clones via VOICE_IDs env vars.
 */
export const VOICE_PERSONAS: Record<RGYZone, VoicePersona> = {
    TEAL: {
        zoneLabel: 'Office — Professional',
        voiceId: process.env.NEXT_PUBLIC_VOICE_TEAL || 'pNInz6obpgDQGcFmaJgB', // Adam
        stability: 0.82,
        similarity_boost: 0.75,
        style: 0.15,
        wakeSound: 'teal-chime', // soft synth chord
        description: 'Calm, precise, sincere. The executive assistant persona.'
    },
    RED: {
        zoneLabel: 'Intimate — Direct',
        voiceId: process.env.NEXT_PUBLIC_VOICE_RED || 'VR6AewLTigWG4xSOukaG', // Arnold
        stability: 0.55,
        similarity_boost: 0.85,
        style: 0.65,
        wakeSound: 'red-pulse',  // low bass pulse
        description: 'Intense, direct, whisper-close. Uncensored mode (18+ only).'
    },
    YELLOW: {
        zoneLabel: 'Cafe — Warm Friend',
        voiceId: process.env.NEXT_PUBLIC_VOICE_YELLOW || 'EXAVITQu4vr4xnSDxMaL', // Bella
        stability: 0.70,
        similarity_boost: 0.65,
        style: 0.55,
        wakeSound: 'yellow-chime', // warm marimba tap
        description: 'Warm, candid, laughs easily. The cafe-table best friend.'
    },
    ORANGE: {
        zoneLabel: 'Landing — Mythical',
        voiceId: process.env.NEXT_PUBLIC_VOICE_ORANGE || 'pNInz6obpgDQGcFmaJgB', // neutral
        stability: 0.75,
        similarity_boost: 0.70,
        style: 0.30,
        wakeSound: 'orange-shimmer', // ambient shimmer
        description: 'Transitional, ethereal. Pre-intent state at landing/onboarding.'
    }
}

/**
 * Get voice persona for the current RGY zone.
 * Falls back to ORANGE if zone is unknown.
 */
export function getVoicePersona(zone: string): VoicePersona {
    return VOICE_PERSONAS[(zone.toUpperCase() as RGYZone)] || VOICE_PERSONAS.ORANGE
}

/**
 * Build TTS request body from persona + text
 */
export function buildTTSPayload(zone: string, text: string) {
    const persona = getVoicePersona(zone)
    return {
        text,
        voiceId: persona.voiceId,
        stability: persona.stability,
        similarity_boost: persona.similarity_boost,
        style: persona.style
    }
}
