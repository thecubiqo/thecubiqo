import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { ENV } from '@/lib/config/env'

export const createAdminClient = () => {
    return createClient<Database>(
        ENV.supabase.url || 'https://placeholder.supabase.co',
        ENV.supabase.serviceRoleKey || 'placeholder-key',
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    )
}
