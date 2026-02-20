import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toggleFeatureFlag } from '@/lib/feature-flags/server'
import { requireAdmin } from '@/lib/auth/admin'

export async function GET(request: NextRequest) {
  // Require admin authentication
  const authResult = await requireAdmin(request)
  if (!authResult.authorized) {
      return authResult.response
  }

  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action') // 'enable' | 'disable' | 'check'
  const flagName = searchParams.get('name') || 'ui.topRightCTA.v1'

  const supabase = await createClient(); // Await the promise

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
    return NextResponse.json({ result })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
