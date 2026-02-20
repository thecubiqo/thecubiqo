import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/admin-guard'
import { toggleFeatureFlag } from '@/lib/feature-flags/server'
import { logAdminAction } from '@/lib/audit'

export const GET = withAdminAuth(async (request, { supabase, user, profile }) => {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action') // 'enable' | 'disable' | 'check'
  const flagName = searchParams.get('name') || 'ui.topRightCTA.v1'

  // 1. Get Flag ID by Name
  const { data: flag } = await supabase
    .from('feature_flags')
    .select('id, enabled')
    .eq('name', flagName)
    .single()

  if (!flag) {
    return NextResponse.json({ error: 'Flag not found' }, { status: 404 })
  }

  if (action === 'check') {
    return NextResponse.json({ status: 'ok', flag })
  }

  if (action === 'enable' || action === 'disable') {
    const enabled = action === 'enable'
    const result = await toggleFeatureFlag(flag.id, enabled)

    // Log the action using shared audit utility
    await logAdminAction({
      userId: user.id,
      userEmail: profile.email,
      actionType: 'feature_flag_toggled',
      actionDetails: { flag: flagName, action, enabled },
    })

    return NextResponse.json({ result })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
})
