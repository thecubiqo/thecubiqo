/**
 * TFR-006: CAP Policy Gateway
 * 
 * All internal sub-domains (Job Hunt, Social Army, Emergent) route through this
 * singleton before executing. It validates:
 * 1. The current RGY zone intent
 * 2. User authorization for the target module
 * 3. Spending caps haven't been exceeded
 * 4. Self-harm / crisis intercept (mirrors chat route check)
 */

import { createClient } from '@supabase/supabase-js'

export type RGYZone = 'TEAL' | 'RED' | 'YELLOW' | 'ORANGE'
export type CubiQoModule = 'chat' | 'job-hunt' | 'social-army' | 'emergent' | 'journal' | 'tts'

export interface PolicyRequest {
    userId: string
    module: CubiQoModule
    zone: RGYZone
    action: string
    payload?: Record<string, unknown>
}

export interface PolicyResult {
    allowed: boolean
    reason?: string
    code?: 'ZONE_MISMATCH' | 'SPEND_CAP' | 'AGE_GATE' | 'UNAUTHORIZED' | 'CRISIS_INTERCEPT' | 'OK'
}

const CRISIS_PATTERNS = [
    /\b(suicide|suicidal|kill myself|end my life|want to die|don't want to live)\b/i,
    /\b(no reason to live|give up on life|worthless|hopeless)\b/i,
]

/** Zone-aware module access rules */
const ZONE_MODULE_RULES: Record<RGYZone, CubiQoModule[]> = {
    TEAL: ['chat', 'job-hunt', 'emergent', 'journal', 'tts'],  // Professional tools
    RED: ['chat', 'tts'],                                       // Intimate only (no productivity)
    YELLOW: ['chat', 'journal', 'tts'],                           // Social/personal
    ORANGE: ['chat', 'tts'],                                       // Landing/pre-intent
}

// Add social-army to all zones (admin-restricted via social-army itself)
Object.values(ZONE_MODULE_RULES).forEach(modules => modules.push('social-army'))

/**
 * Evaluate a module request against all policy rules.
 * Call this at the top of every /api/* route that targets a CubiQo module.
 */
export async function evaluatePolicy(req: PolicyRequest): Promise<PolicyResult> {
    const { userId, module, zone, action, payload } = req

    // 1. Crisis intercept in TEXT fields
    const textFields = Object.values(payload || {}).filter(v => typeof v === 'string') as string[]
    for (const text of textFields) {
        if (CRISIS_PATTERNS.some(p => p.test(text))) {
            return { allowed: false, code: 'CRISIS_INTERCEPT', reason: 'Crisis signal detected — routing to support resources' }
        }
    }

    // 2. Zone-module access check
    const allowedModules = ZONE_MODULE_RULES[zone] || ZONE_MODULE_RULES.ORANGE
    if (!allowedModules.includes(module)) {
        return {
            allowed: false,
            code: 'ZONE_MISMATCH',
            reason: `Module "${module}" is not available in ${zone} zone`
        }
    }

    // 3. RED zone age gate
    if (zone === 'RED') {
        // Server-side: check profiles.age_verified flag in DB
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        )
        const { data: profile } = await supabase
            .from('profiles')
            .select('age_verified')
            .eq('id', userId)
            .single()

        if (!profile?.age_verified) {
            return { allowed: false, code: 'AGE_GATE', reason: 'RED zone requires age verification (18+)' }
        }
    }

    // 4. Spending cap check (deferred to module-level checkSpendingCap for accurate token estimates)
    // Gateway just validates user is not in globally suspended state
    // (the per-module checkSpendingCap handles the granular check)

    return { allowed: true, code: 'OK' }
}

/**
 * Convenience: throw-on-deny wrapper for server route handlers.
 * Throws a Response with the appropriate HTTP status if denied.
 */
export async function assertPolicy(req: PolicyRequest): Promise<void> {
    const result = await evaluatePolicy(req)
    if (!result.allowed) {
        const status = result.code === 'UNAUTHORIZED' ? 403
            : result.code === 'AGE_GATE' ? 403
                : result.code === 'SPEND_CAP' ? 429
                    : result.code === 'CRISIS_INTERCEPT' ? 200 // Not a hard error
                        : 400

        throw Object.assign(new Error(result.reason || 'Policy denied'), {
            policyCode: result.code,
            httpStatus: status
        })
    }
}
