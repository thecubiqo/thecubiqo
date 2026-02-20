/**
 * Secret Rotation API
 * 
 * PUT /api/emergent/secrets/[id]/rotate - Rotate secret
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireProjectPermission } from '@/lib/emergent/security/rbac'
import { decryptSecret, encryptSecret } from '@/lib/emergent/security/secrets-manager'
import { logAudit, logSecretAccess, getIpAddress, getUserAgent } from '@/lib/emergent/security/audit-logger'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // 2. Get secret
    const { data: secret, error: getError } = await supabase
      .from('project_secrets')
      .select('*')
      .eq('id', params.id)
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
    
    // 4. Decrypt old value
    const plaintext = decryptSecret({
      encryptedValue: secret.encrypted_value,
      iv: secret.iv,
      authTag: secret.auth_tag
    })
    
    // 5. Re-encrypt with new IV
    const encrypted = encryptSecret(plaintext)
    
    // 6. Update secret
    const { data: updated, error: updateError } = await supabase
      .from('project_secrets')
      .update({
        encrypted_value: encrypted.encryptedValue,
        iv: encrypted.iv,
        auth_tag: encrypted.authTag,
        last_rotated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select('id, project_id, key, description, last_rotated_at, created_at, updated_at')
      .single()
    
    if (updateError || !updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to rotate secret', data: null },
        { status: 500 }
      )
    }
    
    // 7. Get project's org_id for audit log
    const { data: project } = await supabase
      .from('projects')
      .select('org_id')
      .eq('id', secret.project_id)
      .single()
    
    // 8. Log audit event
    if (project) {
      await logAudit({
        userId: user.id,
        orgId: project.org_id,
        action: 'rotate_secret',
        resourceType: 'secret',
        resourceId: params.id,
        metadata: { key: secret.key, projectId: secret.project_id },
        ipAddress: getIpAddress(request.headers),
        userAgent: getUserAgent(request.headers)
      })
    }
    
    // 9. Log secret access
    await logSecretAccess({
      secretId: params.id,
      userId: user.id,
      action: 'rotate',
      ipAddress: getIpAddress(request.headers)
    })
    
    return NextResponse.json({
      success: true,
      data: updated,
      error: null
    })
    
  } catch (error) {
    console.error('Secret rotation error:', error)
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
