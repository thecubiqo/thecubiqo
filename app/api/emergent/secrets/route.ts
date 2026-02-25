/**
 * Secrets API - Create and List Secrets
 * 
 * POST /api/emergent/secrets - Create secret
 * GET /api/emergent/secrets - List secrets (metadata only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireProjectPermission } from '@/lib/emergent/security/rbac'
import { encryptSecret, maskSecret } from '@/lib/emergent/security/secrets-manager'
import { logAudit, logSecretAccess, getIpAddress, getUserAgent } from '@/lib/emergent/security/audit-logger'
import { z } from 'zod'

const CreateSecretSchema = z.object({
  projectId: z.string().uuid(),
  key: z.string().min(1).max(100).regex(/^[A-Z][A-Z0-9_]*$/),
  value: z.string().min(1).max(10000),
  description: z.string().max(500).optional()
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
    const validation = CreateSecretSchema.safeParse(body)

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

    const { projectId, key, value, description } = validation.data

    // 3. Check permissions (must be admin or higher)
    try {
      await requireProjectPermission(user.id, projectId, 'admin')
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - admin role required', data: null },
        { status: 403 }
      )
    }

    // 4. Check if key already exists
    const { data: existing } = await supabase
      .from('project_secrets')
      .select('id')
      .eq('project_id', projectId)
      .eq('key', key)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Secret key already exists', data: null },
        { status: 409 }
      )
    }

    // 5. Encrypt secret value
    const encrypted = encryptSecret(value)

    // 6. Store encrypted secret
    const { data: secret, error: secretError } = await supabase
      .from('project_secrets')
      .insert({
        project_id: projectId,
        key,
        encrypted_value: encrypted.encryptedValue,
        iv: encrypted.iv,
        auth_tag: encrypted.authTag,
        description: description || null
      })
      .select('id, project_id, key, description, created_at, updated_at')
      .single()

    if (secretError || !secret) {
      return NextResponse.json(
        { success: false, error: 'Failed to create secret', data: null },
        { status: 500 }
      )
    }

    // 7. Get project's org_id for audit log
    const { data: project } = await supabase
      .from('projects')
      .select('org_id')
      .eq('id', projectId)
      .single()

    // 8. Log audit event
    if (project) {
      await logAudit({
        userId: user.id,
        orgId: project.org_id,
        action: 'create',
        resourceType: 'secret',
        resourceId: secret.id,
        metadata: { key, projectId },
        ipAddress: getIpAddress(request.headers) as any,
        userAgent: getUserAgent(request.headers) as any
      })
    }

    // 9. Log secret access
    await logSecretAccess({
      secretId: secret.id,
      userId: user.id,
      action: 'write',
      ipAddress: getIpAddress(request.headers) as any
    })

    // 10. Return success (without value!)
    return NextResponse.json({
      success: true,
      data: {
        ...secret,
        maskedValue: maskSecret(value)
      },
      error: null
    }, { status: 201 })

  } catch (error) {
    console.error('Secret creation error:', error)
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
 * List secrets for a project (metadata only, no values)
 * 
 * GET /api/emergent/secrets?projectId=xxx
 */
export async function GET(request: NextRequest) {
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

    // 2. Get query params
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'projectId query parameter required', data: null },
        { status: 400 }
      )
    }

    // 3. Check permissions
    try {
      await requireProjectPermission(user.id, projectId, 'viewer')
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', data: null },
        { status: 403 }
      )
    }

    // 4. Get secrets (metadata only)
    const { data: secrets, error: queryError } = await supabase
      .from('project_secrets')
      .select('id, project_id, key, description, last_rotated_at, created_at, updated_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (queryError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch secrets', data: null },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: secrets || [],
      error: null,
      metadata: {
        total: secrets?.length || 0,
        warning: 'Secret values are not included. Use individual secret endpoints to access values.'
      }
    })

  } catch (error) {
    console.error('List secrets error:', error)
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
