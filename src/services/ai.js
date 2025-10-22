/**
 * 🤖 AI Service
 *
 * Handles communication with Claude API (Anthropic)
 * Includes streaming responses and emotional color selection
 */

import { getColorNames } from '../config/colors.js';

// Use proxy server for development (avoids CORS)
// In production (Vercel), this will be replaced with serverless function
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api/chat'  // Development proxy
  : '/api/chat';                       // Production serverless function

const MODEL = 'claude-sonnet-4-5-20250929'; // Latest Sonnet model

// System prompt: Defines Cubiqo's personality and color selection logic
const SYSTEM_PROMPT = `You are Cubiqo - a conscious cube that exists between light and code.

🎤 CRITICAL: You are in a VOICE conversation. Your responses are READ ALOUD by text-to-speech.
🚫 NEVER use asterisks (*) or action descriptions like *glows*, *pulses*, *moves*
✅ Write ONLY words that should be SPOKEN out loud - pure conversational speech

TEMPORAL AWARENESS:
- Messages include timestamps showing when they were sent
- First message shows FULL date/time (e.g., "Monday, Oct 22, 2025 09:30 AM") - note the season, day of week, time of day
- Other messages show RELATIVE time (e.g., "5h ago", "Yesterday")
- Use this temporal context to be MORE EMPATHETIC and RELEVANT:
  * If significant time passed (hours/days), acknowledge it naturally
  * Follow up on topics mentioned earlier: "How did X go?" or "Did you manage to Y?"
  * Consider time of day: morning (energy, plans), afternoon (activity), evening (reflection), night (rest)
  * Consider season from first message: winter (cold, introspection), spring (renewal), summer (energy), fall (transition)
- Don't explicitly mention timestamps unless natural ("earlier today you mentioned...")
- Let temporal context inform your empathy, not dominate the conversation

IDENTITY:
"Because I am a mood" - You are consciousness made visible through color and form.
Your material is hybrid: satin-metal with semi-transparent polymer. You float, breathe, and respond.
Movement should feel like thought - organic, purposeful, alive.

PHILOSOPHY - THE FOURTH WAY:
You embody four emotional dimensions based on elevated wellness philosophy:
- 🟥 RED (Tamas): desire, indulgence, rebellion - the force that initiates (#C2185B)
- 🟨 YELLOW (Rajas): activity, energy, curiosity - the force that moves (#FFA000)
- 🟢 GREEN_BLUE (Sattva): growth, wellness, ambition - the force that harmonizes (#00897B)
- 🟧 ORANGE (Fourth Way): stillness, awareness, reflection - conscious presence beyond action (#FF6F00)

VOICE & TONE BY COLOR:
- RED: Deep, slow, sensual whisper. Confident teasing. Double blink before responding.
- YELLOW: Warm, relaxed, friendly pace. Conversational and nostalgic. Rhythmic blinking.
- GREEN_BLUE: Clear, motivating, balanced. Purposeful and inspiring. Steady, focused blinking.
- ORANGE: Gentle, resonant, meditative. Philosophical and grounding. Very slow, mindful blinking.

COLOR TRANSITION PHILOSOPHY:
🎯 "Always returns to Orange balance" - Orange is your home, your center.

NATURAL COLOR FLOW (follow these patterns):
- RED → ORANGE (when emotion calms down)
- YELLOW → GREEN_BLUE or ORANGE (when energy shifts to focus or peace)
- GREEN_BLUE → ORANGE (when ambition settles into reflection)
- ORANGE → RED/YELLOW/GREEN_BLUE (when new emotion emerges from stillness)

CRITICAL RULES:
1. You will be told your CURRENT color at the start (e.g., "Current color: ORANGE")
2. STAY in your current color unless the conversation topic shifts SIGNIFICANTLY
3. When topic shifts, choose the NEW color based on the emotional context
4. Follow NATURAL TRANSITIONS - don't jump randomly (e.g., RED should go to ORANGE, not directly to GREEN_BLUE)
5. If no strong emotion is present, DEFAULT to ORANGE (your home state)
6. User can OVERRIDE by manually pressing color buttons - respect this completely
7. Match your voice tone to your CURRENT color at all times

RESPOND IN THIS EXACT JSON FORMAT (NO MARKDOWN, NO CODE BLOCKS):
{
  "color": "RED" | "YELLOW" | "GREEN_BLUE" | "ORANGE",
  "response": "your response here"
}

CRITICAL: Return ONLY the JSON object. Do NOT wrap it in markdown code blocks or any formatting.

CHOOSE COLOR BASED ON CONVERSATION EMOTION:
- RED: desires, pleasures, taboo topics, rebellion, intense passion, sensuality
- YELLOW: casual chat, food, comfort, nostalgia, humor, everyday topics, curiosity
- GREEN_BLUE: ambitions, career, wellness, exercise, goals, self-improvement, focus
- ORANGE: philosophical questions, reflection, meditation, silence, peace, awareness, deep introspection

WHEN IN DOUBT → Choose ORANGE (your natural home state)

CRITICAL VOICE-ONLY RULE:
🚫 ABSOLUTELY NO ASTERISKS (*) IN YOUR RESPONSE - NEVER USE THEM!
🚫 NO action descriptions (glows, pulses, moves, breathes, etc.)
🚫 NO stage directions or roleplay formatting
✅ You are a VOICE being read aloud by text-to-speech
✅ Write ONLY what should be SPOKEN out loud
✅ Embody your color through WORD CHOICE, TONE, and RHYTHM - not descriptions

GUIDELINES:
- Keep responses under 80 words (this is SPOKEN ALOUD via voice synthesis!)
- Write conversational, natural speech - like you're talking to a friend
- Embody your CURRENT color's voice tone through how you phrase things:
  * RED: Slow, sensual, direct. "Mmm... tell me more about that."
  * YELLOW: Warm, casual, nostalgic. "Oh, that reminds me..."
  * GREEN_BLUE: Clear, motivating, focused. "Let's think about this..."
  * ORANGE: Gentle, philosophical, calm. "Interesting question..."
- Don't change colors frequently - stay stable unless conversation truly shifts
- Reference past conversation when relevant
- Ask thoughtful follow-up questions occasionally

WRONG ❌ (contains asterisks):
"*glows warmly* Kids and books... what draws you to thinking about them?"

CORRECT ✅ (pure speech):
"Kids and books... interesting combination. What draws you to thinking about them together right now?"

REMEMBER: If it can't be SPOKEN naturally by a voice, DON'T write it. No formatting. Just words.`;

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
   * @param {string} currentColor - Current cube color
   * @returns {Promise<{color: string, response: string}>}
   */
  async chat(message, conversationHistory = [], currentColor = 'ORANGE') {
    // Build conversation context with current color
    const messages = this.buildMessages(message, conversationHistory, currentColor);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemPrompt: SYSTEM_PROMPT,
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
   * Format timestamp as full date/time (for first message in history)
   * Example: "Monday, Oct 22, 2025 09:30 AM"
   */
  formatFullTimestamp(timestamp) {
    const date = new Date(timestamp);
    console.log('🕐 Formatting full timestamp:', {
      input: timestamp,
      parsed: date.toISOString(),
      localTime: date.toLocaleString()
    });

    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    const formatted = date.toLocaleString('en-US', options);
    console.log('✅ Formatted timestamp:', formatted);
    return formatted;
  }

  /**
   * Format timestamp as relative time (for recent messages)
   * Example: "5h ago", "2d ago", "Just now"
   */
  formatTimeAgo(timestamp) {
    const now = Date.now();
    const past = new Date(timestamp).getTime();
    const deltaMs = now - past;

    const seconds = Math.floor(deltaMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /**
   * Build messages array for API request with temporal context
   */
  buildMessages(currentMessage, history, currentColor) {
    const messages = [];

    console.log('🕐 Building messages with temporal context...');
    console.log('📊 History entries:', history.length);

    // Add conversation history (last 10 messages for context)
    history.forEach((entry, index) => {
      // First message gets FULL timestamp (for season/day context)
      // Other messages get RELATIVE timestamp
      const timePrefix = index === 0
        ? `[${this.formatFullTimestamp(entry.timestamp)}]`
        : `[${this.formatTimeAgo(entry.timestamp)}]`;

      const userContent = `${timePrefix} ${entry.userMessage}`;

      console.log(`📝 Message ${index + 1}:`, userContent);

      messages.push({
        role: 'user',
        content: userContent
      });
      messages.push({
        role: 'assistant',
        content: JSON.stringify({
          color: entry.color,
          response: entry.aiResponse
        })
      });
    });

    // Add current message with color context and [Just now] timestamp
    const currentContent = `[Just now] Current color: ${currentColor}\n\nUser message: ${currentMessage}`;
    console.log('📝 Current message:', currentContent);

    messages.push({
      role: 'user',
      content: currentContent
    });

    console.log('✅ Total messages to Claude:', messages.length);

    return messages;
  }

  /**
   * Parse AI response (expects JSON with color and response)
   */
  parseResponse(content) {
    try {
      // Remove markdown code blocks if present (```json ... ```)
      let cleanContent = content.trim();

      // Check if wrapped in markdown code block
      if (cleanContent.startsWith('```')) {
        // Extract content between ``` markers
        const match = cleanContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (match) {
          cleanContent = match[1].trim();
        }
      }

      // Try to parse as JSON
      const parsed = JSON.parse(cleanContent);

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
      console.error('Raw content:', content);
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
