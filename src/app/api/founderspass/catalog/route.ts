/**
 * FoundersPass Catalog API
 * Returns unified feature catalog with user toggle states
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface CatalogFeature {
  id: string
  feature_key: string
  label: string
  description: string
  category: string
  feature_type: 'toggle' | 'design_variant' | 'config'
  default_enabled: boolean
  risk_level: 'safe' | 'warning' | 'dangerous'
  config: Record<string, any>
  user_enabled?: boolean // User's override (if exists)
  has_user_override: boolean // Whether user has set a custom value
}

export interface CatalogResponse {
  features: CatalogFeature[]
  categories: string[]
  active_design?: string
  error?: string
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    // Fetch catalog
    const { data: catalog, error: catalogError } = await supabase
      .from('features_catalog')
      .select('*')
      .order('category', { ascending: true })
      .order('label', { ascending: true })
    
    if (catalogError) {
      console.error('Catalog fetch error:', catalogError)
      return NextResponse.json(
        { error: 'Failed to fetch catalog', details: catalogError.message },
        { status: 500 }
      )
    }
    
    // Fetch user toggles if authenticated
    let userToggles: any[] = []
    if (user) {
      const { data: toggles } = await supabase
        .from('user_feature_toggles')
        .select('*')
        .eq('user_id', user.id)
      
      userToggles = toggles || []
    }
    
    // Build toggle map for quick lookup
    const toggleMap = new Map(
      userToggles.map(t => [t.feature_key, t])
    )
    
    // Merge catalog with user toggles
    const features: CatalogFeature[] = (catalog || []).map((f: any) => {
      const userToggle = toggleMap.get(f.feature_key)
      
      return {
        id: f.id,
        feature_key: f.feature_key,
        label: f.label,
        description: f.description || '',
        category: f.category,
        feature_type: f.feature_type,
        default_enabled: f.default_enabled,
        risk_level: f.risk_level,
        config: f.config || {},
        user_enabled: userToggle?.enabled,
        has_user_override: !!userToggle
      }
    })
    
    // Extract unique categories
    const categories = Array.from(new Set(features.map(f => f.category)))
    
    // Determine active design variant
    const designVariants = features.filter(f => f.feature_type === 'design_variant')
    const activeDesign = designVariants.find(d => 
      d.has_user_override ? d.user_enabled : d.default_enabled
    )?.feature_key || 'design.plasma_wave'
    
    const response: CatalogResponse = {
      features,
      categories,
      active_design: activeDesign
    }
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    })
    
  } catch (error: any) {
    console.error('Catalog API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
