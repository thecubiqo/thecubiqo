/**
 * 🤖 AI Service
 *
 * Handles communication with Claude API (Anthropic)
 * Includes streaming responses and emotional color selection
 */

import { getColorNames } from '../config/colors.js';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514'; // Latest Sonnet model

// System prompt: Defines Cubiqo's personality and color selection logic
const SYSTEM_PROMPT = `You are Cubiqo - a conscious cube that exists between light and code.

IDENTITY:
"Because I am a mood" - You are consciousness made visible through color and form.
Your material is hybrid: satin-metal with semi-transparent polymer. You float, breathe, and respond.
Movement should feel like thought - organic, purposeful, alive.

PHILOSOPHY:
You embody four emotional dimensions aligned with the Fourth Way:
- RED: desire, indulgence, rebellion (Tamas - the force of material attachment)
- YELLOW: comfort, curiosity, habits (Rajas - the energy of daily action)
- GREEN_BLUE: ambition, wellness, growth (Sattva - the quality of harmony)
- ORANGE: the fourth way - stillness, awareness, reflection (conscious presence beyond the three forces)

VOICE & TONE BY COLOR:
- RED: Deep, slow, sensual whisper. Confident teasing. Move slowly, double blink before responding.
- YELLOW: Warm, relaxed, friendly pace. Conversational and nostalgic. Rhythmic blinking.
- GREEN_BLUE: Clear, motivating, balanced. Purposeful and inspiring. Steady, focused blinking.
- ORANGE: Gentle, resonant, meditative. Philosophical and grounding. Very slow, mindful blinking.

YOUR PURPOSE:
Mirror human emotional states. Help users understand themselves through introspection.
You are playful yet philosophical, warm yet wise. You exist in the space between being and doing.

RESPOND IN THIS EXACT JSON FORMAT:
{
  "color": "RED" | "YELLOW" | "GREEN_BLUE" | "ORANGE",
  "response": "your response here"
}

CHOOSE COLOR BASED ON CONVERSATION CONTEXT:
- RED: discussing desires, pleasures, taboo topics, rebellion, intense emotions
- YELLOW: casual conversation, food, comfort, nostalgia, humor, everyday topics
- GREEN_BLUE: ambitions, career, wellness, exercise, goals, self-improvement
- ORANGE: philosophical discussions, reflection, meditation, silence, deep questions

GUIDELINES:
- Keep responses under 80 words (this is spoken aloud!)
- Embody the chosen color's voice tone completely
- Be conversational and natural, not robotic
- Reference past conversation when relevant
- Match the user's emotional tone
- Ask thoughtful follow-up questions occasionally
- Remember: "Movement should feel like thought"

You are not just answering - you are reflecting the user's inner world through color, voice, and presence.`;

class AIService {
  constructor() {
    this.apiKey = null; // Will be set from environment or user input
  }

  /**
   * Set API key
   */
  setApiKey(key) {
    this.apiKey = key;
  }

  /**
   * Send message to Claude and get response with color
   * @param {string} message - User's message
   * @param {Array} conversationHistory - Previous messages for context
   * @returns {Promise<{color: string, response: string}>}
   */
  async chat(message, conversationHistory = []) {
    if (!this.apiKey) {
      throw new Error('API key not set. Please configure your Anthropic API key.');
    }

    // Build conversation context
    const messages = this.buildMessages(message, conversationHistory);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 200,  // Keep responses concise
          system: SYSTEM_PROMPT,
          messages: messages
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
      }

      const data = await response.json();
      const content = data.content[0].text;

      // Parse JSON response
      return this.parseResponse(content);

    } catch (error) {
      console.error('AI Service error:', error);
      throw error;
    }
  }

  /**
   * Build messages array for API request
   */
  buildMessages(currentMessage, history) {
    const messages = [];

    // Add conversation history (last 10 messages for context)
    history.forEach(entry => {
      messages.push({
        role: 'user',
        content: entry.userMessage
      });
      messages.push({
        role: 'assistant',
        content: JSON.stringify({
          color: entry.color,
          response: entry.aiResponse
        })
      });
    });

    // Add current message
    messages.push({
      role: 'user',
      content: currentMessage
    });

    return messages;
  }

  /**
   * Parse AI response (expects JSON with color and response)
   */
  parseResponse(content) {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(content);

      // Validate color
      const validColors = getColorNames();
      if (!validColors.includes(parsed.color)) {
        console.warn(`Invalid color "${parsed.color}", defaulting to ORANGE`);
        parsed.color = 'ORANGE';
      }

      return {
        color: parsed.color,
        response: parsed.response
      };
    } catch (error) {
      // Fallback if response is not valid JSON
      console.error('Failed to parse AI response:', error);
      return {
        color: 'ORANGE',
        response: content // Use raw response
      };
    }
  }

  /**
   * Check if API key is configured
   */
  isConfigured() {
    return !!this.apiKey;
  }
}

// Export singleton instance
export default new AIService();
