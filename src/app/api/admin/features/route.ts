/**
 * API endpoint for managing feature releases
 * GET: List all features and their release status
 * POST: Update feature release status (founder-only)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { isFounder } from '@/lib/auth/founders'
import { FEATURE_METADATA, PERMANENTLY_FOUNDER_ONLY } from '@/lib/auth/feature-flags'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/features
 * Returns all features with their release status
 * Accessible to all (but actual toggling requires founder)
 */
export async function GET() {
  try {
    // TODO: Remove this mock data after migrations are applied
    const mockFeatures = FEATURE_METADATA.map(meta => ({
      feature_name: meta.key,
      released: false,
      released_at: null,
      released_by: null
    }))

    // Enrich with metadata
    const enrichedFeatures = mockFeatures.map((feature) => {
      const metadata = FEATURE_METADATA.find((m) => m.key === feature.feature_name)
      const featureKey = feature.feature_name as keyof typeof PERMANENTLY_FOUNDER_ONLY
      return {
        ...feature,
        metadata,
        canRelease: !PERMANENTLY_FOUNDER_ONLY.includes(featureKey as never),
      }
    })

    return NextResponse.json({
      features: enrichedFeatures,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in GET /api/admin/features:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/features
 * Update feature release status
 * Body: { featureName: string, isReleased: boolean }
 * Founder-only
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check founder status
    if (!isFounder(user.email)) {
      return NextResponse.json(
        { error: 'Forbidden: Founder access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { featureName, isReleased } = body

    if (!featureName || typeof isReleased !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request: featureName and isReleased required' },
        { status: 400 }
      )
    }

    // Prevent releasing permanently founder-only features
    if (PERMANENTLY_FOUNDER_ONLY.includes(featureName)) {
      return NextResponse.json(
        { error: `Feature "${featureName}" cannot be released (founder-only)` },
        { status: 400 }
      )
    }

    // TODO: Update database after migrations applied
    // For now, just return success (features controlled by isFounder check)
    console.log(`[MOCK] Would toggle feature: ${featureName} to ${isReleased}`)
    
    return NextResponse.json({
      success: true,
      feature: {
        feature_name: featureName,
        is_released: isReleased,
        updated_at: new Date().toISOString(),
        released_by: isReleased ? user.id : null,
      },
      timestamp: new Date().toISOString(),
      note: 'Mock mode - apply Supabase migrations to enable persistence'
    })
  } catch (error) {
    console.error('Error in POST /api/admin/features:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
