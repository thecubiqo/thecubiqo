/**
 * 🎨 Cubiqo Color System
 *
 * Each color represents an emotional dimension aligned with the philosophy of the Fourth Way.
 * The cube's color reflects the emotional context of the conversation.
 */

export const COLORS = {
  RED: {
    name: 'RED',
    hex: 0xFF1744,           // Bright crimson
    emissive: 0xDC143C,      // Deep red glow
    emotion: 'desire, indulgence, rebellion',
    tone: 'seductive, slow, impulsive',
    voiceTone: 'deep, slow, sensual whisper; confident teasing',
    description: 'Tamas - The force of desire and material attachment',
    animationSpeed: 0.2,     // Very slow, sensual movements (reduced from 0.3)
    glowIntensity: 0.9,      // Strong, passionate glow
    breathingSpeed: 1.0,     // Slower breathing effect
    blinkStyle: 'double',    // Double blink before responding
    blinkSpeed: 0.3          // Slow, seductive blink
  },

  YELLOW: {
    name: 'YELLOW',
    hex: 0xFFD700,           // Gold
    emissive: 0xFFA500,      // Orange-gold glow
    emotion: 'comfort, curiosity, habit',
    tone: 'warm, conversational, nostalgic',
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
    hex: 0x00E5FF,           // Bright cyan
    emissive: 0x4169E1,      // Royal blue glow
    emotion: 'ambition, growth, wellness',
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
    hex: 0xFF9100,           // Bright orange
    emissive: 0xFF8C00,      // Deep orange glow
    emotion: 'stillness, awareness, reflection',
    tone: 'philosophical, calm, grounding',
    voiceTone: 'gentle, resonant, meditative',
    description: 'The Fourth Way - Conscious presence beyond the three forces',
    animationSpeed: 0.15,    // Minimal, meditative movements (reduced from 0.2)
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
