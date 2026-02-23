/**
 * Admin Spending Caps - Cost tracking and limits for API usage
 * 
 * CAPS:
 * - Anthropic (Claude): $200 max per user
 * - ElevenLabs TTS: $200 max per user
 * 
 * Costs are estimated based on token/character usage.
 * Persists directly into Supabase 'usage_tracking' table to survive restarts.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export const SPENDING_CAPS = {
  anthropic: 200,  // $200 max 
  elevenlabs: 200  // $200 max 
} as const

// Approximate costs per unit (conservative estimates)
// Claude: ~$15/1M input tokens, ~$75/1M output tokens (Sonnet)
// ElevenLabs: ~$0.30 per 1000 characters
export const COST_PER_UNIT = {
  anthropic_input: 0.000015,
  anthropic_output: 0.000075,
  elevenlabs_char: 0.0003
} as const

// Get start of current month in ISO format
function getMonthStartISO(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
}

/**
 * Check if spending is within cap for a provider
 */
export async function checkSpendingCap(
  identifier: string,
  provider: 'anthropic' | 'elevenlabs'
): Promise<{
  allowed: boolean
  currentSpend: number
  cap: number
  remaining: number
}> {
  if (!identifier) {
    return { allowed: true, currentSpend: 0, cap: SPENDING_CAPS[provider], remaining: SPENDING_CAPS[provider] }
  }

  const cap = SPENDING_CAPS[provider]
  const monthStart = getMonthStartISO()

  try {
    const { data, error } = await supabaseAdmin
      .from('usage_tracking')
      .select('cost')
      .eq('identifier', identifier)
      .eq('provider', provider)
      .gte('created_at', monthStart)

    if (error) {
      console.error('[SpendingCaps] DB query error:', error.message)
      // Fail open if the DB crashes, to not break service entirely
      return { allowed: true, currentSpend: 0, cap, remaining: cap }
    }

    const currentSpend = data?.reduce((acc, row) => acc + (Number(row.cost) || 0), 0) || 0
    const remaining = Math.max(0, cap - currentSpend)

    return {
      allowed: currentSpend < cap,
      currentSpend: Math.round(currentSpend * 100) / 100,
      cap,
      remaining: Math.round(remaining * 100) / 100
    }
  } catch (err) {
    console.error('[SpendingCaps] unexpected error:', err)
    return { allowed: true, currentSpend: 0, cap, remaining: cap }
  }
}

/**
 * Record spending for a provider
 */
export function recordSpending(
  identifier: string,
  provider: 'anthropic' | 'elevenlabs',
  cost: number
): void {
  if (!identifier || cost <= 0) return

  // Fire and forget
  supabaseAdmin
    .from('usage_tracking')
    .insert([{ identifier, provider, cost }])
    .then(({ error }: any) => {
      if (error) console.error('[SpendingCaps] Failed to record:', error.message)
      else console.log(`[SpendingCaps] ${provider}: +$${cost.toFixed(4)} for ${identifier}`)
    }, (err: any) => {
      console.error(err)
    })
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

// --- Usage Lock Controls ---
// Deprecated: kept for backwards compatibility if needed locally
let usageLocks = { ai: false, database: false }

export function isUsageLocked(type: 'ai' | 'database'): boolean { return usageLocks[type] }
export function setUsageLock(type: 'ai' | 'database', locked: boolean): void { usageLocks[type] = locked }
export function getUsageLocks() { return { ...usageLocks } }
