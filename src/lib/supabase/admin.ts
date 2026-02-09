import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Note: SUPABASE_SERVICE_ROLE_KEY should be in .env.local
// It bypasses Row Level Security (RLS), so use with caution.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const createAdminClient = () => {
    return createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
