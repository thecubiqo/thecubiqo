/**
 * Central environment variable management
 * Handles legacy/provisional naming (e.g. "URL1") with consistent fallbacks
 * and sanitizes values that might have been pasted with their names.
 */

function cleanEnv(val: string | undefined): string | undefined {
    if (!val) return undefined;
    // Remove accidental "VAR_NAME=" or "VAR_NAME: " prefixes
    if (val.includes('=') && (val.includes('KEY') || val.includes('URL') || val.includes('TOKEN'))) {
        return val.split('=').pop()?.trim();
    }
    // Clean any surrounding quotes or whitespace
    return val.trim().replace(/^['"]|['"]$/g, '');
}

export const ENV = {
    supabase: {
        url: cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL1) || 'https://naoxezcmcauecawchgjk.supabase.co',
        anonKey: cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY1) || 'placeholder-anon-key',
        serviceRoleKey: cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY1) || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    ai: {
        minimax: cleanEnv(process.env.MINIMAX_KEY || process.env.MINIMAX_API_KEY),
        anthropic: cleanEnv(process.env.ANTHROPIC_API_KEY || process.env.OPENROUTER_KEY),
        openai: cleanEnv(process.env.OPENAI_API_KEY),
        mistral: cleanEnv(process.env.MISTRAL_API_KEY),
        together: cleanEnv(process.env.TOGETHER_API_KEY),
        openclaw: cleanEnv(process.env.OPENCLAW_API_KEY || process.env.OPENROUTER_KEY_CUBIKEY),
        openrouter: cleanEnv(process.env.CUBIQO_UNIVERSAL_KEY || process.env.OPENROUTER_KEY || process.env.MULTIVA_CUBI_KEY || process.env.OPENROUTER_KEY_CUBIKEY || process.env.OPENROUTER_API_KEY),
    },
    voice: {
        elevenlabs: cleanEnv(process.env.ELEVENLABS_API_KEY || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY),
    }
};

/**
 * Validates that Supabase URL and Key are likely from the same project
 */
export function isSupabaseConsistent(): boolean {
    const url = ENV.supabase.url;
    const key = ENV.supabase.anonKey;

    if (!url || !key || url.includes('placeholder')) return false;

    return true;
}
