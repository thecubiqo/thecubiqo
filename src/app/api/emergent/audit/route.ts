/**
 * Audit Logs API
 * 
 * GET /api/emergent/audit - Query audit logs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireOrgPermission } from '@/lib/emergent/security/rbac'
import { queryAuditLogs } from '@/lib/emergent/security/audit-logger'

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
    const resourceType = searchParams.get('resourceType')
    const resourceId = searchParams.get('resourceId')
    const action = searchParams.get('action')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'orgId query parameter required', data: null },
        { status: 400 }
      )
    }
    
    // 3. Check permissions (must be admin or higher to view audit logs)
    try {
      await requireOrgPermission(user.id, orgId, 'admin')
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - admin role required', data: null },
        { status: 403 }
      )
    }
    
    // 4. Query audit logs
    const result = await queryAuditLogs({
      orgId,
      resourceType: resourceType as any,
      resourceId: resourceId || undefined,
      action: action as any,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset
    })
    
    return NextResponse.json({
      success: true,
      data: result.logs,
      error: null,
      metadata: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.offset + result.limit < result.total
      }
    })
    
  } catch (error) {
    console.error('Query audit logs error:', error)
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
