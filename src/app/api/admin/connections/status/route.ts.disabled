/**
 * Connection Status API
 * 
 * Returns the status of all integrations for the current user
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Fetch all integrations for the user
    const { data: integrations, error: integrationsError } = await supabase
      .from('user_integrations')
      .select('provider, provider_username, connected_at, last_synced_at, metadata')
      .eq('user_id', user.id)

    if (integrationsError) {
      console.error('❌ Error fetching integrations:', integrationsError)
      return NextResponse.json(
        { error: 'Failed to fetch integrations' },
        { status: 500 }
      )
    }

    // Transform into a map of provider -> status
    const connections = integrations?.reduce((acc, integration) => {
      acc[integration.provider] = {
        connected: true,
        username: integration.provider_username,
        connected_at: integration.connected_at,
        last_synced_at: integration.last_synced_at,
        metadata: integration.metadata,
      }
      return acc
    }, {} as Record<string, any>) || {}

    return NextResponse.json({
      connections,
      user_id: user.id,
    })

  } catch (error) {
    console.error('❌ Error checking connection status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
