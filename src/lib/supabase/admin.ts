import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { ENV } from '@/lib/config/env'

export const createAdminClient = () => {
    return createClient<Database>(ENV.supabase.url, ENV.supabase.serviceRoleKey!, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
