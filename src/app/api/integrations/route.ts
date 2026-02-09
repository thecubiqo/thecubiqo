/**
 * Integrations API
 * GET /api/integrations - List all integrations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all integrations for this user
    const { data: integrations, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .order('service', { ascending: true })

    if (error) {
      console.error('Failed to fetch integrations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch integrations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      integrations: integrations || []
    })
  } catch (error) {
    console.error('Integrations API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
