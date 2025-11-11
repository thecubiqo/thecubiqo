/**
 * 🎨 Cubiqo Color System
 *
 * Each color represents an emotional dimension aligned with the philosophy of the Fourth Way.
 * The cube's color reflects the emotional context of the conversation.
 */

export const COLORS = {
  WHITE: {
    name: "WHITE",
    displayName: "WHITE",
  },

  BLACK: {
    name: "BLACK",
    displayName: "BLACK",
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
