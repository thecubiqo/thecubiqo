/**
 * Projects API - Create and List Projects
 * 
 * POST /api/emergent/projects - Create project
 * GET /api/emergent/projects - List projects
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireOrgPermission } from '@/lib/emergent/security/rbac'
import { logAudit, getIpAddress, getUserAgent } from '@/lib/emergent/security/audit-logger'
import { z } from 'zod'

const CreateProjectSchema = z.object({
  orgId: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  stack: z.enum(['nextjs', 'react', 'vue', 'svelte', 'vanilla']),
  framework: z.string().max(50).optional(),
  language: z.enum(['typescript', 'javascript', 'python']).default('typescript')
})

export async function POST(request: NextRequest) {
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
    
    // 2. Parse and validate request body
    const body = await request.json()
    const validation = CreateProjectSchema.safeParse(body)
    
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
    
    const { orgId, name, slug, description, stack, framework, language } = validation.data
    
    // 3. Check permissions (must be member or higher)
    try {
      await requireOrgPermission(user.id, orgId, 'member')
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', data: null },
        { status: 403 }
      )
    }
    
    // 4. Check if slug is available in org
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('org_id', orgId)
      .eq('slug', slug)
      .single()
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Project slug already taken in this organization', data: null },
        { status: 409 }
      )
    }
    
    // 5. Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        org_id: orgId,
        name,
        slug,
        description: description || null,
        stack,
        framework: framework || null,
        language,
        status: 'active'
      })
      .select()
      .single()
    
    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Failed to create project', data: null },
        { status: 500 }
      )
    }
    
    // 6. Log audit event
    await logAudit({
      userId: user.id,
      orgId,
      action: 'create',
      resourceType: 'project',
      resourceId: project.id,
      metadata: { name, slug, stack, language },
      ipAddress: getIpAddress(request.headers),
      userAgent: getUserAgent(request.headers)
    })
    
    // 7. Return success
    return NextResponse.json({
      success: true,
      data: {
        id: project.id,
        orgId: project.org_id,
        name: project.name,
        slug: project.slug,
        description: project.description,
        stack: project.stack,
        framework: project.framework,
        language: project.language,
        status: project.status,
        createdAt: project.created_at
      },
      error: null
    }, { status: 201 })
    
  } catch (error) {
    console.error('Project creation error:', error)
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
 * List projects (optionally filtered by orgId)
 * 
 * GET /api/emergent/projects?orgId=xxx
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
    
    // 2. Get query params
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')
    
    // 3. Build query
    let query = supabase
      .from('projects')
      .select(`
        id,
        org_id,
        name,
        slug,
        description,
        stack,
        framework,
        language,
        repository,
        status,
        created_at,
        updated_at,
        last_built_at
      `)
      .order('created_at', { ascending: false })
    
    // Filter by org if provided
    if (orgId) {
      // Check permission
      try {
        await requireOrgPermission(user.id, orgId, 'viewer')
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Forbidden', data: null },
          { status: 403 }
        )
      }
      
      query = query.eq('org_id', orgId)
    } else {
      // Get all orgs user has access to
      const { data: memberships } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .not('joined_at', 'is', null) // Only include members who have joined
      
      if (memberships && memberships.length > 0) {
        const orgIds = memberships.map(m => m.org_id)
        query = query.in('org_id', orgIds)
      } else {
        // No orgs, return empty
        return NextResponse.json({
          success: true,
          data: [],
          error: null,
          metadata: { total: 0 }
        })
      }
    }
    
    // 4. Execute query
    const { data: projects, error: queryError } = await query
    
    if (queryError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch projects', data: null },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: projects || [],
      error: null,
      metadata: {
        total: projects?.length || 0
      }
    })
    
  } catch (error) {
    console.error('List projects error:', error)
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
