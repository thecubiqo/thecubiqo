
import { createClient } from '@supabase/supabase-js'

// Simple direct Supabase client for caching (bypassing the heavy service-role one if possible, 
// or reusing the one from env if we want to keep it simple)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
// Note: In real prod, we might use a dedicated cache service or Redis. 
// For now, we use a 'cache_entries' table in Supabase.

export class SemanticCache {
    private static client = createClient(supabaseUrl, supabaseKey)

    /**
     * Check if a prompt exists in cache
     * For MVP: Exact string match or simple fuzzy match logic if DB supports it.
     * "Semantic" usually implies vector search, but let's start with Deterministic Cache 
     * to save 100% on identical repeats (common in testing/demos).
     */
    static async get(prompt: string, zone: string): Promise<string | null> {
        try {
            // Hash the prompt to use as index? Or just text match for short prompts.
            // Let's assume we have a table 'cache_entries' { hash: string, content: string, zone: string }
            // For this MVP without migrations, we might skip actual DB call if table doesn't exist yet, 
            // to avoid breaking the app.

            // Mock implementation until Table is confirmed created:
            // return null 

            // Uncomment when table exists:
            /*
            const { data } = await this.client
                .from('cache_entries')
                .select('response')
                .eq('prompt_hash', this.hash(prompt))
                .eq('zone', zone)
                .single()
            
            if (data) return data.response
            */
            return null
        } catch (e) {
            return null
        }
    }

    static async set(prompt: string, response: string, zone: string): Promise<void> {
        try {
            /*
            await this.client.from('cache_entries').upsert({
                prompt_hash: this.hash(prompt),
                prompt_text: prompt.substring(0, 500), // logging
                response,
                zone,
                created_at: new Date().toISOString()
            })
            */
        } catch (e) {
            // silent fail
        }
    }

    private static hash(str: string): string {
        // Simple hash for lookup
        let hash = 0, i, chr;
        if (str.length === 0) return hash.toString();
        for (i = 0; i < str.length; i++) {
            chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash.toString();
    }
}
