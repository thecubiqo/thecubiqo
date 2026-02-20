import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'

// Initialize Supabase with Service Role Key for Admin Access
let supabaseAdmin: SupabaseClient | null = null
if (process.env.NEXT_PUBLIC_SUPABASE_URL1 && process.env.SUPABASE_SERVICE_ROLE_KEY1) {
    supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL1,
        process.env.SUPABASE_SERVICE_ROLE_KEY1
    )
}

export async function POST(req: NextRequest) {
    try {
        // Require admin authentication
        const authResult = await requireAdmin(req)
        if (!authResult.authorized) {
            return authResult.response
        }

        const { featureId, target, enabled } = await req.json()

        const field = target === 'production' ? 'enabled_for_production' : 'enabled_for_founders'

        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
        }

        // Update using Service Role (bypasses RLS)
        const { data, error } = await supabaseAdmin
            .from('feature_flags')
            .update({ [field]: enabled, updated_at: new Date().toISOString() })
            .eq('feature_id', featureId)
            .select()

        if (error) throw error

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('[API] Toggle failed:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
