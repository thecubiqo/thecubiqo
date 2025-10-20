/**
 * 🎨 Cubiqo Color System
 *
 * Each color represents an emotional dimension aligned with the philosophy of the Fourth Way.
 * The cube's color reflects the emotional context of the conversation.
 */

export const COLORS = {
  RED: {
    name: 'RED',
    displayName: 'Tamas',
    hex: 0xC2185B,           // Brand: Tamas (#C2185B) - Indulgence • Desire
    emissive: 0x8B0A3D,      // Deeper magenta glow
    emotion: 'desire, indulgence, rebellion',
    tone: 'seductive, slow, impulsive',
    voiceTone: 'deep, slow, sensual whisper; confident teasing',
    description: 'Tamas - The force of desire and material attachment',
    animationSpeed: 0.2,     // Very slow, sensual movements
    glowIntensity: 0.9,      // Strong, passionate glow
    breathingSpeed: 1.0,     // Slower breathing effect
    blinkStyle: 'double',    // Double blink before responding
    blinkSpeed: 0.3          // Slow, seductive blink
  },

  YELLOW: {
    name: 'YELLOW',
    displayName: 'Rajas',
    hex: 0xFFA000,           // Brand: Rajas (#FFA000) - Activity • Energy
    emissive: 0xE68A00,      // Deeper amber glow
    emotion: 'activity, energy, curiosity',
    tone: 'warm, conversational, energetic',
    voiceTone: 'warm, relaxed, friendly pace',
    description: 'Rajas - The energy of action and daily life',
    animationSpeed: 0.5,     // Medium, bouncy movements
    glowIntensity: 0.7,      // Warm, inviting glow
    breathingSpeed: 1.5,     // Normal breathing
    blinkStyle: 'rhythmic',  // Rhythmic blinking
    blinkSpeed: 0.15         // Normal blink speed
  },

  GREEN_BLUE: {
    name: 'GREEN_BLUE',
    displayName: 'Sattva',
    hex: 0x00897B,           // Brand: Sattva (#00897B) - Growth • Wellness
    emissive: 0x005A52,      // Deeper teal glow
    emotion: 'growth, wellness, ambition',
    tone: 'purposeful, clear, inspired',
    voiceTone: 'clear, motivating, balanced',
    description: 'Sattva - The quality of harmony and growth',
    animationSpeed: 0.4,     // Steady, purposeful movements
    glowIntensity: 0.6,      // Clear, focused glow
    breathingSpeed: 1.4,     // Calm, steady breathing
    blinkStyle: 'steady',    // Steady, focused blinking
    blinkSpeed: 0.15         // Normal blink speed
  },

  ORANGE: {
    name: 'ORANGE',
    displayName: 'Fourth Way',
    hex: 0xFF6F00,           // Brand: Fourth Way (#FF6F00) - Stillness • Awareness
    emissive: 0xCC5900,      // Deeper burnt orange glow
    emotion: 'stillness, awareness, reflection',
    tone: 'philosophical, calm, grounding',
    voiceTone: 'gentle, resonant, meditative',
    description: 'The Fourth Way - Conscious presence beyond the three forces',
    animationSpeed: 0.15,    // Minimal, meditative movements
    glowIntensity: 0.5,      // Soft, grounding glow
    breathingSpeed: 0.8,     // Very slow, meditative breathing
    blinkStyle: 'slow',      // Very slow, mindful blinking
    blinkSpeed: 0.25         // Slow, meditative blink
  }
};

/**
 * Get color configuration by name
 * @param {string} colorName - RED, YELLOW, GREEN_BLUE, or ORANGE
 * @returns {Object} Color configuration
 */
export function getColor(colorName) {
  return COLORS[colorName] || COLORS.ORANGE; // Default to ORANGE (Fourth Way)
}

/**
 * Get all available color names
 * @returns {Array<string>} Array of color names
 */
export function getColorNames() {
  return Object.keys(COLORS);
}
