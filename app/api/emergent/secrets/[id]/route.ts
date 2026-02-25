/**
 * Secret Operations API
 * 
 * DELETE /api/emergent/secrets/[id] - Delete secret
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireProjectPermission } from '@/lib/emergent/security/rbac'
import { logAudit, logSecretAccess, getIpAddress, getUserAgent } from '@/lib/emergent/security/audit-logger'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', data: null },
        { status: 401 }
      )
    }

    // 2. Get secret to verify it exists
    const { data: secret, error: getError } = await (supabase as any)
      .from('project_secrets')
      .select('id, project_id, key')
      .eq('id', id)
      .single()

    if (getError || !secret) {
      return NextResponse.json(
        { success: false, error: 'Secret not found', data: null },
        { status: 404 }
      )
    }

    // 3. Check permissions (must be admin or higher)
    try {
      await requireProjectPermission(user.id, secret.project_id, 'admin')
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - admin role required', data: null },
        { status: 403 }
      )
    }

    // 4. Delete secret
    const { error: deleteError } = await (supabase as any)
      .from('project_secrets')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete secret', data: null },
        { status: 500 }
      )
    }

    // 5. Get project's org_id for audit log
    const { data: project } = await (supabase as any)
      .from('projects')
      .select('org_id')
      .eq('id', secret.project_id)
      .single()

    // 6. Log audit event
    if (project) {
      await logAudit({
        userId: user.id,
        orgId: project.org_id,
        action: 'delete',
        resourceType: 'secret',
        resourceId: id,
        metadata: { key: secret.key, projectId: secret.project_id },
        ipAddress: getIpAddress(request.headers) || undefined,
        userAgent: getUserAgent(request.headers) || undefined
      })
    }

    // 7. Log secret access
    await logSecretAccess({
      secretId: id,
      userId: user.id,
      action: 'delete',
      ipAddress: getIpAddress(request.headers) || undefined
    })

    return NextResponse.json({
      success: true,
      data: { id },
      error: null
    })

  } catch (error) {
    console.error('Secret deletion error:', error)
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
