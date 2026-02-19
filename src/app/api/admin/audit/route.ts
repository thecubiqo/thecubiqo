import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-guard';
import { logAdminAction, type AuditActionType } from '@/lib/audit';
import { isFeatureEnabled } from '@/config/feature-flags';

/**
 * POST /api/admin/audit
 * Log a privileged admin action
 */
export const POST = withAdminAuth(async (request, { user, profile }) => {
  // Check if audit logging is enabled
  if (!isFeatureEnabled('ADMIN_AUDIT_LOGGING')) {
    return NextResponse.json(
      { error: 'Audit logging is not enabled' },
      { status: 503 }
    );
  }

  // Parse request body
  const body = await request.json();
  const { actionType, actionDetails } = body;

  if (!actionType) {
    return NextResponse.json(
      { error: 'Missing actionType' },
      { status: 400 }
    );
  }

  // Get IP and user agent from request
  const ipAddress = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Log the action
  const result = await logAdminAction({
    userId: user.id,
    userEmail: profile.email,
    actionType: actionType as AuditActionType,
    actionDetails: actionDetails || {},
    ipAddress,
    userAgent,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || 'Failed to log action' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
});

/**
 * GET /api/admin/audit
 * Retrieve audit logs (admin only)
 */
export const GET = withAdminAuth(async (request, { supabase }) => {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const actionType = searchParams.get('actionType') || undefined;

  // Fetch audit logs
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (actionType) {
    query = query.eq('action_type', actionType);
  }

  const { data: logs, error: logsError } = await query;

  if (logsError) {
    return NextResponse.json(
      { error: logsError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ logs: logs || [] });
});
