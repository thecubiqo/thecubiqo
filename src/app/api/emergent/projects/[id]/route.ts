/**
 * Project Details API
 * 
 * GET /api/emergent/projects/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireProjectPermission } from '@/lib/emergent/security/rbac'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const projectId = id

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', data: null },
        { status: 401 }
      )
    }

    // 2. Check permissions
    try {
      await requireProjectPermission(user.id, projectId, 'viewer')
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', data: null },
        { status: 403 }
      )
    }

    // 3. Get project details
    const { data: project, error: projectError } = await (supabase as any)
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
        last_built_at,
        organizations (
          id,
          name,
          slug,
          plan
        )
      `)
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Project not found', data: null },
        { status: 404 }
      )
    }

    // 4. Get deployment stats
    const { data: deployments } = await (supabase as any)
      .from('deployments')
      .select('id, status, environment, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(5)

    // 5. Get workspace status
    const { data: workspace } = await (supabase as any)
      .from('workspaces')
      .select('id, status, last_activity_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        recentDeployments: deployments || [],
        workspace: workspace || null
      },
      error: null
    })

  } catch (error) {
    console.error('Get project error:', error)
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
