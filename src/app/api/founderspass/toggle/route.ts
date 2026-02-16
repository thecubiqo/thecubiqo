/**
 * FoundersPass Toggle API
 * Handles user feature toggle updates with audit logging
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface ToggleRequest {
  feature_key: string
  enabled: boolean
  is_design_variant?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body: ToggleRequest = await request.json()
    const { feature_key, enabled, is_design_variant } = body
    
    if (!feature_key || enabled === undefined) {
      return NextResponse.json(
        { error: 'Missing feature_key or enabled' },
        { status: 400 }
      )
    }
    
    // TODO: Remove type casting once Supabase types are regenerated with new tables
    // Run: supabase gen types typescript --local > src/types/supabase.ts
    // Verify feature exists in catalog
    const { data: catalogEntry, error: catalogError } = await (supabase as any)
      .from('features_catalog')
      .select('*')
      .eq('feature_key', feature_key)
      .single()
    
    if (catalogError || !catalogEntry) {
      return NextResponse.json(
        { error: 'Feature not found in catalog' },
        { status: 404 }
      )
    }
    
    // If this is a design variant, disable other design variants first
    if (is_design_variant && enabled) {
      // Get all design variants
      const { data: designVariants } = await (supabase as any)
        .from('features_catalog')
        .select('feature_key')
        .eq('feature_type', 'design_variant')
      
      if (designVariants && designVariants.length > 0) {
        // Disable all other design variants for this user
        for (const variant of designVariants) {
          if (variant.feature_key !== feature_key) {
            await (supabase as any)
              .from('user_feature_toggles')
              .upsert({
                user_id: user.id,
                feature_key: variant.feature_key,
                enabled: false,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id,feature_key'
              })
          }
        }
      }
    }
    
    // Upsert user toggle
    const { data: toggle, error: toggleError } = await (supabase as any)
      .from('user_feature_toggles')
      .upsert({
        user_id: user.id,
        feature_key,
        enabled,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,feature_key'
      })
      .select()
      .single()
    
    if (toggleError) {
      console.error('Toggle error:', toggleError)
      return NextResponse.json(
        { error: 'Failed to update toggle', details: toggleError.message },
        { status: 500 }
      )
    }
    
    // Create audit log entry
    await supabase
      .from('feature_flag_audit')
      .insert({
        flag_name: feature_key,
        action: 'toggled',
        changed_by: user.id,
        changes: {
          user_toggle: true,
          enabled,
          feature_label: catalogEntry.label
        },
        metadata: {
          user_agent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          timestamp: new Date().toISOString()
        }
      })
    
    return NextResponse.json({
      success: true,
      feature_key,
      enabled,
      label: catalogEntry.label
    })
    
  } catch (error: any) {
    console.error('Toggle API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
