import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAdminAction, type AuditActionType } from '@/lib/audit';
import { isFeatureEnabled } from '@/config/feature-flags';
import { requireAdmin } from '@/lib/auth/admin';

/**
 * POST /api/admin/audit
 * Log a privileged admin action
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin(request)
    if (!authResult.authorized) {
      return authResult.response
    }

    // Check if audit logging is enabled
    if (!isFeatureEnabled('ADMIN_AUDIT_LOGGING')) {
      return NextResponse.json(
        { error: 'Audit logging is not enabled' },
        { status: 503 }
      );
    }

    // Get the current user from auth result
    const { user } = authResult

    // Get user profile for email
    const supabase = await createClient();
    const { data: profile, error: profileError } = await (supabase as any)
      .from('profiles')
      .select('email')
      .eq('id', user!.id)
      .single();

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
      userId: user!.id,
      userEmail: profile?.email || user!.email || 'unknown',
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
  } catch (error) {

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/audit
 * Retrieve audit logs (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin(request)
    if (!authResult.authorized) {
      return authResult.response
    }

    const supabase = await createClient();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const actionType = searchParams.get('actionType') || undefined;

    // Fetch audit logs
    let query = (supabase as any)
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
  } catch (error) {

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
