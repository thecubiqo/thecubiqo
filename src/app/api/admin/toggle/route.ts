import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase with Service Role Key for Admin Access
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL1!,
    process.env.SUPABASE_SERVICE_ROLE_KEY1!
)

export async function POST(req: Request) {
    try {
        const { featureId, target, enabled } = await req.json()
        const founderAuth = req.headers.get('x-founder-auth')

        // START SIMPLE SECURITY CHECK
        // In production, you'd validate a real session or a secret hash.
        // For this "PIN" mode, we trust the client if they have the specific local storage flag
        // But since this is an API, we need something verifiable.
        // The user is "aditya@cubiqo.ai" implicitly if they have the PIN.
        if (founderAuth !== 'true') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        // END SIMPLE SECURITY CHECK

        const field = target === 'production' ? 'enabled_for_production' : 'enabled_for_founders'

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
