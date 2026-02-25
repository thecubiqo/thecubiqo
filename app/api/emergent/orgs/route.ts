/**
 * Organizations API - Create Organization
 * 
 * POST /api/emergent/orgs
 * 
 * Creates a new organization and adds the creator as owner.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit, getIpAddress, getUserAgent } from '@/lib/emergent/security/audit-logger'
import { z } from 'zod'

const CreateOrgSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  plan: z.enum(['free', 'pro', 'enterprise']).default('free')
})

export async function POST(request: NextRequest) {
  try {
    const supabase = (await createClient()) as any

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', data: null },
        { status: 401 }
      )
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const validation = CreateOrgSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          data: null,
          metadata: { errors: validation.error.flatten() }
        },
        { status: 400 }
      )
    }

    const { name, slug, plan } = validation.data

    // 3. Check if slug is available
    const { data: existing } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Organization slug already taken', data: null },
        { status: 409 }
      )
    }

    // 4. Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        slug,
        plan
      })
      .select()
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { success: false, error: 'Failed to create organization', data: null },
        { status: 500 }
      )
    }

    // 5. Add creator as owner
    const { error: memberError } = await supabase
      .from('org_members')
      .insert({
        org_id: org.id,
        user_id: user.id,
        role: 'owner',
        joined_at: new Date().toISOString()
      })

    if (memberError) {
      // Rollback: delete organization
      await supabase.from('organizations').delete().eq('id', org.id)

      return NextResponse.json(
        { success: false, error: 'Failed to add organization member', data: null },
        { status: 500 }
      )
    }

    // 6. Initialize credits
    const { error: creditsError } = await supabase
      .from('credits')
      .insert({
        org_id: org.id,
        balance: plan === 'free' ? 1000 : 10000,
        reserved: 0,
        free_tier_balance: plan === 'free' ? 1000 : 0
      })

    if (creditsError) {
      console.error('Failed to initialize credits:', creditsError)
    }

    // 7. Log audit event
    await logAudit({
      userId: user.id,
      orgId: org.id,
      action: 'create',
      resourceType: 'organization',
      resourceId: org.id,
      metadata: { name, slug, plan },
      ipAddress: getIpAddress(request.headers) || undefined,
      userAgent: getUserAgent(request.headers) || undefined
    })

    // 8. Return success
    return NextResponse.json({
      success: true,
      data: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        createdAt: org.created_at
      },
      error: null
    }, { status: 201 })

  } catch (error) {
    console.error('Organization creation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        data: null
      },
      { status: 500 }
    )
  }
}

/**
 * List user's organizations
 * 
 * GET /api/emergent/orgs
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', data: null },
        { status: 401 }
      )
    }

    // 2. Get user's organization memberships
    const { data: memberships, error: memberError } = await (supabase as any)
      .from('org_members')
      .select(`
        role,
        joined_at,
        organizations (
          id,
          name,
          slug,
          plan,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id)
      .not('joined_at', 'is', null) // Only include members who have joined
      .order('joined_at', { ascending: false })

    if (memberError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch organizations', data: null },
        { status: 500 }
      )
    }

    // 3. Format response
    const orgs = (memberships as any[])?.map(m => ({
      ...m.organizations,
      role: m.role,
      joinedAt: m.joined_at
    })) || []

    return NextResponse.json({
      success: true,
      data: orgs,
      error: null,
      metadata: {
        total: orgs.length
      }
    })

  } catch (error) {
    console.error('List organizations error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        data: null
      },
      { status: 500 }
    )
  }
}
