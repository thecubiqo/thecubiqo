import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = await createClient()

    // Verify founder status
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== 'aditya@cubiqo.ai') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: features, error } = await (supabase as any)
        .from('feature_flags')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ features, timestamp: new Date().toISOString() })
}

export async function POST(req: NextRequest) {
    const supabase = await createClient()

    // Verify founder status
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== 'aditya@cubiqo.ai') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
}
