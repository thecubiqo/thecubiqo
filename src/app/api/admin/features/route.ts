import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin-guard'

export const GET = withAdminAuth(async (_request, { supabase }) => {
    const { data: features, error } = await (supabase as any)
        .from('feature_flags')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ features, timestamp: new Date().toISOString() })
})

export const POST = withAdminAuth(async (req, { supabase }) => {
    const { featureName, isReleased } = await req.json()

    const { error } = await (supabase as any)
        .from('feature_flags')
        .update({
            enabled_for_production: isReleased,
            updated_at: new Date().toISOString()
        })
        .eq('feature_id', featureName)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
})
