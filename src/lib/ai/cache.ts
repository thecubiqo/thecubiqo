
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time errors
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
    if (_client) return _client;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL1;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY1;
    if (url && key && url.includes('supabase')) {
        _client = createClient(url, key);
    }
    return _client;
}

export class SemanticCache {
    /**
     * Check if a prompt exists in cache
     */
    static async get(prompt: string, zone: string): Promise<string | null> {
        try {
            // Currently mocked - table doesn't exist yet
            return null
        } catch (e) {
            return null
        }
    }

    static async set(prompt: string, response: string, zone: string): Promise<void> {
        try {
            // Currently mocked - table doesn't exist yet
        } catch (e) {
            // silent fail
        }
    }

    private static hash(str: string): string {
        let hash = 0, i, chr;
        if (str.length === 0) return hash.toString();
        for (i = 0; i < str.length; i++) {
            chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0;
        }
        return hash.toString();
    }
}
