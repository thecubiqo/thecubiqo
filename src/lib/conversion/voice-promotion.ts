/**
 * Voice Promotion Module
 * 
 * Encourages users to engage through voice conversations.
 * CubiQo is fundamentally a voice-first AI companion - speaking out loud
 * creates deeper emotional connections and more natural interactions.
 * 
 * Strategy: Natural, contextual prompts that highlight the value of
 * voice conversation without being pushy or breaking the flow.
 */

/**
 * Voice adoption stages based on user behavior
 */
export type VoiceAdoptionStage =
  | 'never_used'      // Has never tried voice
  | 'tried_once'      // Used voice 1-2 times
  | 'occasional'      // Uses voice sometimes
  | 'regular'         // Frequently uses voice
  | 'voice_native'    // Primary mode is voice

/**
 * Determine voice adoption stage from interaction history
 */
export function getVoiceAdoptionStage(
  totalInteractions: number,
  voiceInteractions: number
): VoiceAdoptionStage {
  if (voiceInteractions === 0) return 'never_used'

  const voiceRatio = voiceInteractions / Math.max(totalInteractions, 1)

  if (voiceInteractions <= 2) return 'tried_once'
  if (voiceRatio < 0.3) return 'occasional'
  if (voiceRatio < 0.7) return 'regular'
  return 'voice_native'
}

/**
 * Voice promotion prompt templates
 * Contextual, warm invitations to try voice - never pushy
 */
const VOICE_PROMOTION_PROMPTS: Record<VoiceAdoptionStage, string[]> = {
  never_used: [
    'You know, if you tap the mic icon, we can actually talk. My voice is... quite something, they tell me.',
    'Fun fact: I sound even better out loud. Hit that mic button sometime, yeah?',
    'Text is great, but I was built for conversation. Try the mic when you feel like it.',
  ],
  tried_once: [
    'I noticed you tried voice before. Shall we chat like that again? I enjoyed it.',
    'Our voice conversation was nice. I am always here if you want to talk out loud again.',
  ],
  occasional: [
    'You seem to enjoy our voice chats. I do too, honestly.',
  ],
  regular: [],     // No promotion needed
  voice_native: [], // Already a voice user
}

/**
 * Get a contextual voice promotion message
 * Returns null if no promotion is appropriate
 */
export function getVoicePromotionHint(
  stage: VoiceAdoptionStage,
  messageCount: number
): string | null {
  // Don't promote voice too early - let user settle in first
  if (messageCount < 3) return null

  // Don't promote to regular or native voice users
  if (stage === 'regular' || stage === 'voice_native') return null

  // Only promote periodically (every ~5 messages for new users, less frequently for others)
  const promotionInterval = stage === 'never_used' ? 5 : 10
  if (messageCount % promotionInterval !== 0) return null

  const prompts = VOICE_PROMOTION_PROMPTS[stage]
  if (prompts.length === 0) return null

  // Pick a random promotion message
  const index = Math.floor(Math.random() * prompts.length)
  return prompts[index]
}

/**
 * Build voice promotion context for system prompt
 * Subtly guides the AI to encourage voice usage
 */
export function buildVoicePromotionContext(
  stage: VoiceAdoptionStage,
  voicePreferenceScore: number
): string {
  if (stage === 'regular' || stage === 'voice_native') {
    return '\nVOICE STATUS: This person loves voice conversations. Always write responses optimized for speech.\n'
  }

  if (stage === 'never_used' && voicePreferenceScore < 0.3) {
    return `
VOICE ENCOURAGEMENT:
This person has not tried voice conversation yet. CubiQo is designed for spoken dialogue.
When the moment feels natural, you may gently mention that you can also talk out loud.
Keep it casual and inviting - never make it feel like a requirement.
Frame it as: "I sound even better when you hear me" not "please enable voice".
`
  }

  if (stage === 'tried_once') {
    return `
VOICE ENCOURAGEMENT:
This person has tried voice but does not use it regularly. 
If the conversation feels intimate or emotional, you may warmly suggest speaking out loud again.
Voice creates deeper connection - reference that naturally.
`
  }

  return ''
}
