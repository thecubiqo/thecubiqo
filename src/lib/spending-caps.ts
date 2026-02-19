/**
 * Admin Spending Caps - Cost tracking and limits for API usage
 * 
 * CAPS:
 * - Anthropic (Claude): $200 max
 * - ElevenLabs TTS: $200 max
 * 
 * Costs are estimated based on token/character usage.
 * Resets monthly or when manually reset by admin.
 */

// Spending caps in dollars
export const SPENDING_CAPS = {
  anthropic: 200,  // $200 max for Claude
  elevenlabs: 200  // $200 max for ElevenLabs TTS
} as const

// Approximate costs per unit (conservative estimates)
// Claude: ~$15/1M input tokens, ~$75/1M output tokens (Sonnet)
// ElevenLabs: ~$0.30 per 1000 characters
export const COST_PER_UNIT = {
  anthropic_input: 0.000015,    // $15 per 1M tokens = $0.000015 per token
  anthropic_output: 0.000075,   // $75 per 1M tokens = $0.000075 per token
  elevenlabs_char: 0.0003       // $0.30 per 1000 chars = $0.0003 per char
} as const

// In-memory spending tracker (in production, use database/Redis)
// This persists across requests but resets on server restart
// For production, store in Supabase or Redis
interface SpendingRecord {
  anthropic: number
  elevenlabs: number
  lastReset: number  // Timestamp of last reset
  monthStart: number // Start of current billing month
}

let spendingRecord: SpendingRecord = {
  anthropic: 0,
  elevenlabs: 0,
  lastReset: Date.now(),
  monthStart: getMonthStart()
}

function getMonthStart(): number {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime()
}

// Check if we need to reset for a new month
function checkMonthlyReset(): void {
  const currentMonthStart = getMonthStart()
  if (currentMonthStart > spendingRecord.monthStart) {
    console.log('[SpendingCaps] Monthly reset - new billing period')
    spendingRecord = {
      anthropic: 0,
      elevenlabs: 0,
      lastReset: Date.now(),
      monthStart: currentMonthStart
    }
  }
}

/**
 * Check if spending is within cap for a provider
 */
export function checkSpendingCap(provider: 'anthropic' | 'elevenlabs'): {
  allowed: boolean
  currentSpend: number
  cap: number
  remaining: number
} {
  checkMonthlyReset()
  
  const cap = SPENDING_CAPS[provider]
  const currentSpend = spendingRecord[provider]
  const remaining = Math.max(0, cap - currentSpend)
  
  return {
    allowed: currentSpend < cap,
    currentSpend: Math.round(currentSpend * 100) / 100,
    cap,
    remaining: Math.round(remaining * 100) / 100
  }
}

/**
 * Record spending for a provider
 */
export function recordSpending(
  provider: 'anthropic' | 'elevenlabs',
  cost: number
): void {
  checkMonthlyReset()
  spendingRecord[provider] += cost
  
  console.log(`[SpendingCaps] ${provider}: +$${cost.toFixed(4)} | Total: $${spendingRecord[provider].toFixed(2)} / $${SPENDING_CAPS[provider]}`)
}

/**
 * Estimate cost for Claude (Anthropic) API call
 */
export function estimateAnthropicCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * COST_PER_UNIT.anthropic_input) + 
         (outputTokens * COST_PER_UNIT.anthropic_output)
}

/**
 * Estimate cost for ElevenLabs TTS
 */
export function estimateElevenLabsCost(characterCount: number): number {
  return characterCount * COST_PER_UNIT.elevenlabs_char
}

/**
 * Rough token estimation (4 chars ≈ 1 token)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Get current spending status for all providers
 */
export function getSpendingStatus(): Record<string, {
  spent: number
  cap: number
  remaining: number
  percentUsed: number
}> {
  checkMonthlyReset()
  
  return {
    anthropic: {
      spent: Math.round(spendingRecord.anthropic * 100) / 100,
      cap: SPENDING_CAPS.anthropic,
      remaining: Math.round((SPENDING_CAPS.anthropic - spendingRecord.anthropic) * 100) / 100,
      percentUsed: Math.round((spendingRecord.anthropic / SPENDING_CAPS.anthropic) * 100)
    },
    elevenlabs: {
      spent: Math.round(spendingRecord.elevenlabs * 100) / 100,
      cap: SPENDING_CAPS.elevenlabs,
      remaining: Math.round((SPENDING_CAPS.elevenlabs - spendingRecord.elevenlabs) * 100) / 100,
      percentUsed: Math.round((spendingRecord.elevenlabs / SPENDING_CAPS.elevenlabs) * 100)
    }
  }
}

/**
 * Admin function to manually reset spending
 */
export function resetSpending(provider?: 'anthropic' | 'elevenlabs'): void {
  if (provider) {
    spendingRecord[provider] = 0
    console.log(`[SpendingCaps] Reset ${provider} spending to $0`)
  } else {
    spendingRecord = {
      anthropic: 0,
      elevenlabs: 0,
      lastReset: Date.now(),
      monthStart: getMonthStart()
    }
    console.log('[SpendingCaps] Reset all spending to $0')
  }
}

// --- Usage Lock Controls ---
// Admin can manually lock AI or database usage to keep costs low

interface UsageLocks {
  ai: boolean
  database: boolean
}

let usageLocks: UsageLocks = {
  ai: false,
  database: false
}

/**
 * Check if a usage type is locked by admin
 */
export function isUsageLocked(type: 'ai' | 'database'): boolean {
  return usageLocks[type]
}

/**
 * Set the lock state for AI or database usage
 */
export function setUsageLock(type: 'ai' | 'database', locked: boolean): void {
  usageLocks[type] = locked
  console.log(`[UsageLock] ${type} usage ${locked ? 'LOCKED' : 'UNLOCKED'}`)
}

/**
 * Get all usage lock states
 */
export function getUsageLocks(): UsageLocks {
  return { ...usageLocks }
}
