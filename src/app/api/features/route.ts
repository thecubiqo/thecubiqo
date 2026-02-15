import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabase = await createClient()

        const { data: features, error } = await (supabase as any)
            .from('feature_flags')
            .select('feature_id, enabled_for_production, category')
            .eq('enabled_for_production', true)

        if (error) {
            console.error('[API/Features] DB Error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Return as a map for easy lookup
        const enabledMap: Record<string, boolean> = {}
        features.forEach((f: any) => {
            enabledMap[f.feature_id] = true
        })

        return NextResponse.json({
            features: enabledMap,
            timestamp: new Date().toISOString()
        })
    } catch (e: any) {
        console.error('[API/Features] Exception:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
