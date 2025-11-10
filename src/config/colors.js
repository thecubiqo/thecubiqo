/**
 * 🎨 Cubiqo Color System
 *
 * Each color represents an emotional dimension aligned with the philosophy of the Fourth Way.
 * The cube's color reflects the emotional context of the conversation.
 */

export const COLORS = {
  WHITE: {
    name: "WHITE",
    displayName: "Tamas",
    hex: 0xc2185b, // Brand: Tamas (#C2185B) - Indulgence • Desire
    emotion: "desire, indulgence, rebellion",
    tone: "seductive, slow, impulsive",
    voiceTone: "deep, slow, sensual whisper; confident teasing",
    description: "Tamas - The force of desire and material attachment",
  },

  BLACK: {
    name: "BLACK",
    displayName: "Rajas",
    hex: 0xffa000, // Brand: Rajas (#FFA000) - Activity • Energy
    emotion: "activity, energy, curiosity",
    tone: "warm, conversational, energetic",
    voiceTone: "warm, relaxed, friendly pace",
    description: "Rajas - The energy of action and daily life",
  },
};

/**
 * Get color configuration by name
 * @param {string} colorName - 
 * @returns {Object} Color configuration
 */
export function getColor(colorName) {
  return COLORS[colorName] || COLORS.WHITE; 
}

/**
 * Get all available color names
 * @returns {Array<string>} Array of color names
 */
export function getColorNames() {
  return Object.keys(COLORS);
}
