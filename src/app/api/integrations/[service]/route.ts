/**
 * Integration Management API
 * GET /api/integrations/[service] - Get specific integration
 * PATCH /api/integrations/[service] - Update integration
 * DELETE /api/integrations/[service] - Disconnect integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ServiceType } from '@/types/integrations'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  try {
    const supabase = await createClient()
    const { service: serviceParam } = await params
    const service = serviceParam as ServiceType
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch integration
    const { data: integration, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('service', service)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
      }
      console.error('Failed to fetch integration:', error)
      return NextResponse.json({ error: 'Failed to fetch integration' }, { status: 500 })
    }

    return NextResponse.json({ integration })
  } catch (error) {
    console.error('Integration GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  try {
    const supabase = await createClient()
    const { service: serviceParam } = await params
    const service = serviceParam as ServiceType
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { read_enabled, write_enabled, config } = body

    // Build update object
    const updates: any = { updated_at: new Date().toISOString() }
    if (typeof read_enabled === 'boolean') updates.read_enabled = read_enabled
    if (typeof write_enabled === 'boolean') updates.write_enabled = write_enabled
    if (config !== undefined) updates.config = config

    // Check if integration exists
    const { data: existing } = await supabase
      .from('user_integrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('service', service)
      .single()

    let integration
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('user_integrations')
        .update(updates)
        .eq('user_id', user.id)
        .eq('service', service)
        .select()
        .single()

      if (error) throw error
      integration = data
    } else {
      // Create new entry (for services without OAuth)
      const { data, error } = await supabase
        .from('user_integrations')
        .insert({
          user_id: user.id,
          service,
          ...updates
        })
        .select()
        .single()

      if (error) throw error
      integration = data
    }

    return NextResponse.json({ integration })
  } catch (error) {
    console.error('Integration PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  try {
    const supabase = await createClient()
    const { service: serviceParam } = await params
    const service = serviceParam as ServiceType
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Soft disconnect: clear tokens but keep toggles
    const { error } = await supabase
      .from('user_integrations')
      .update({
        is_connected: false,
        access_token: null,
        refresh_token: null,
        token_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('service', service)

    if (error) {
      console.error('Failed to disconnect integration:', error)
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Integration DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
