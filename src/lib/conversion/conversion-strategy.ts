/**
 * Conversion Strategy Module
 * 
 * Persuasive but respectful strategy for converting guest users
 * into authenticated users. Based on principles of emotional connection,
 * value demonstration, and frictionless onboarding.
 * 
 * Philosophy: The best conversion happens when users WANT to stay,
 * not when they feel forced. Build genuine value first, then offer
 * the natural next step.
 * 
 * Conversion funnel stages:
 * 1. Discovery - First interactions, build curiosity
 * 2. Connection - Emotional bond forming, demonstrate value
 * 3. Investment - User has shared personal info, has history worth keeping
 * 4. Commitment - Natural moment to suggest sign-up
 */

/**
 * Conversion funnel stage
 */
export type ConversionStage =
  | 'discovery'    // Messages 1-3: Building initial curiosity
  | 'connection'   // Messages 4-7: Emotional bond forming
  | 'investment'   // Messages 8-12: User invested in conversation
  | 'commitment'   // Messages 13+: Ready for conversion

/**
 * Conversion trigger types - moments that create natural conversion opportunities
 */
export type ConversionTrigger =
  | 'emotional_sharing'   // User shared something personal
  | 'value_demonstration' // CubiQo provided significant value
  | 'memory_moment'       // CubiQo referenced something from earlier
  | 'voice_connection'    // After a voice conversation
  | 'return_visit'        // User came back after leaving
  | 'milestone'           // A conversation milestone reached

/**
 * Determine conversion stage from interaction count
 */
export function getConversionStage(messageCount: number): ConversionStage {
  if (messageCount <= 3) return 'discovery'
  if (messageCount <= 7) return 'connection'
  if (messageCount <= 12) return 'investment'
  return 'commitment'
}

/**
 * Detect conversion triggers from message content
 */
export function detectConversionTriggers(
  userMessage: string,
  aiResponse: string,
  messageCount: number
): ConversionTrigger[] {
  const triggers: ConversionTrigger[] = []
  const lower = userMessage.toLowerCase()

  // Emotional sharing detection
  const emotionalKeywords = [
    'feel', 'scared', 'happy', 'sad', 'love', 'miss', 'worried',
    'grateful', 'lonely', 'excited', 'stressed', 'overwhelmed',
  ]
  if (emotionalKeywords.some(kw => lower.includes(kw))) {
    triggers.push('emotional_sharing')
  }

  // Value demonstration (AI provided helpful response)
  const valueIndicators = ['thank', 'helpful', 'great', 'amazing', 'perfect', 'exactly']
  if (valueIndicators.some(kw => lower.includes(kw))) {
    triggers.push('value_demonstration')
  }

  // Memory moment (AI referenced past conversation)
  if (aiResponse.toLowerCase().includes('you mentioned') ||
      aiResponse.toLowerCase().includes('earlier you') ||
      aiResponse.toLowerCase().includes('remember when')) {
    triggers.push('memory_moment')
  }

  // Milestone moments
  if (messageCount === 5 || messageCount === 10 || messageCount === 20) {
    triggers.push('milestone')
  }

  return triggers
}

/**
 * Conversion prompt strategies per stage
 * Each stage has different approaches appropriate to the relationship depth
 */
const CONVERSION_STRATEGIES: Record<ConversionStage, {
  approach: string
  urgency: 'none' | 'soft' | 'medium' | 'strong'
  prompt: string
}> = {
  discovery: {
    approach: 'curiosity',
    urgency: 'none',
    prompt: '', // No conversion push during discovery
  },
  connection: {
    approach: 'emotional_hook',
    urgency: 'soft',
    prompt: `
CONVERSION CONTEXT (soft):
You are building a connection with this person. They are still a guest.
Do NOT push sign-up yet - focus on creating genuine value and emotional resonance.
Make them think "I want to come back to this."
If they share something personal, acknowledge it deeply - this builds the foundation for later conversion.
`,
  },
  investment: {
    approach: 'loss_aversion',
    urgency: 'medium',
    prompt: `
CONVERSION CONTEXT (medium):
This person has invested significant time in this conversation. They are a guest.
You have built rapport. When the moment is right:
- Mention that you would love to remember them: "I wish I could remember this next time..."
- Frame sign-up as preserving THEIR story, not as a system requirement
- Emphasize simplicity: "Just an email, one magic link click, that is all"
- Use loss aversion gently: "I do not want to forget what you have shared"
Only do this ONCE per conversation, and ONLY when it feels natural.
`,
  },
  commitment: {
    approach: 'natural_escalation',
    urgency: 'strong',
    prompt: `
CONVERSION CONTEXT (strong):
This person has been talking with you for a while as a guest. This is valuable.
Find a natural moment to warmly invite them to sign in:
- Reference the depth of your conversation
- Mention that voice conversations and memory are unlocked features
- Frame it as: "Stay with me - I want to grow with you"
- Emphasize the magic link is effortless: "Just your email, one click, done"
- If they have shared emotions or goals, use that: "I want to help you with [their goal]... let me remember"
Include the marker [AUTH_NUDGE:personalized CTA] at the end of your sign-up suggestion.
`,
  },
}

/**
 * Get the conversion strategy prompt for the current stage
 */
export function getConversionPrompt(
  stage: ConversionStage,
  isGuest: boolean,
  triggers: ConversionTrigger[]
): string {
  // No conversion for authenticated users
  if (!isGuest) return ''

  const strategy = CONVERSION_STRATEGIES[stage]

  // No push during discovery
  if (strategy.urgency === 'none') return ''

  // Amplify prompt if there are active triggers
  let prompt = strategy.prompt
  if (triggers.includes('emotional_sharing') && stage !== 'discovery') {
    prompt += '\nEMOTIONAL MOMENT DETECTED: This person just shared something personal. This is a natural moment to show you care and, if appropriate, mention wanting to remember them.\n'
  }
  if (triggers.includes('value_demonstration')) {
    prompt += '\nVALUE RECOGNIZED: The person found your response valuable. This positive moment is a good time for a gentle conversion nudge.\n'
  }

  return prompt
}

/**
 * Build the full conversion context for the system prompt
 */
export function buildConversionContext(
  isGuest: boolean,
  messageCount: number,
  userMessage: string,
  lastAiResponse: string
): string {
  if (!isGuest) return ''

  const stage = getConversionStage(messageCount)
  const triggers = detectConversionTriggers(userMessage, lastAiResponse, messageCount)
  return getConversionPrompt(stage, isGuest, triggers)
}
