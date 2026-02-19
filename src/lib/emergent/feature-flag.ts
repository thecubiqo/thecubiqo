/**
 * Feature Flag management for Emergent Platform
 */

import { createClient } from '@/lib/supabase/server';

export async function isEmergentEnabled(): Promise<boolean> {
    // 1. Check environment variable override
    if (process.env.FORCE_ENABLE_EMERGENT === 'true') return true;
    if (process.env.ENABLE_EMERGENT_PLATFORM === 'false') return false;

    // 2. Check feature flags table in DB (if caching allows)
    try {
        const supabase = await createClient();
        const { data } = await supabase
            .from('feature_flags')
            .select('enabled')
            .eq('name', 'emergent_platform')
            .single();

        if (data) return data.enabled;
    } catch (e) {
        // Ignore DB errors and fallback to env
        console.warn('Failed to check emergent feature flag:', e);
    }

    // 3. Default to env var or false
    return process.env.ENABLE_EMERGENT_PLATFORM === 'true';
}

export async function checkEmergentAccess(userId: string): Promise<boolean> {
    const enabled = await isEmergentEnabled();
    if (!enabled) return false;

    // Additional RBAC checks can go here
    // e.g. check if user has 'emergent_access' permission
    return true;
}
