import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin-guard'
import { logAdminAction } from '@/lib/audit'

export const POST = withAdminAuth(async (req, { user, profile, supabase }) => {
    const { featureId, target, enabled } = await req.json()

    const field = target === 'production' ? 'enabled_for_production' : 'enabled_for_founders'

    // Update using the authenticated supabase client
    const { data, error } = await supabase
        .from('feature_flags')
        .update({ [field]: enabled, updated_at: new Date().toISOString() })
        .eq('feature_id', featureId)
        .select()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log the action using shared audit utility
    await logAdminAction({
        userId: user.id,
        userEmail: profile.email,
        actionType: 'feature_flag_toggled',
        actionDetails: { featureId, target, enabled },
    })

    return NextResponse.json({ success: true, data })
})
