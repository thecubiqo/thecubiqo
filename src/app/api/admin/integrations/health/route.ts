/**
 * Admin API: Integration Health Monitoring
 * 
 * Endpoints for monitoring the health status of external integrations
 * Provides real-time health metrics, uptime tracking, and manual health checks
 * 
 * @route GET  /api/admin/integrations/health - List all integration health statuses
 * @route POST /api/admin/integrations/health - Update/check integration health
 * @access Admin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAdminAction } from '@/lib/audit';

/**
 * GET /api/admin/integrations/health
 * 
 * Retrieves health status for all configured integrations
 * Includes current status, response times, error counts, and calculated uptime
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Step 1: Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Step 2: Verify admin access
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Step 3: Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const integrationType = searchParams.get('integration_type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Step 4: Build query with explicit casting to bypass missing type definitions in build
    let query = (supabase as any)
      .from('integration_health')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (integrationType) {
      query = query.eq('integration_type', integrationType);
    }

    // Apply pagination and ordering
    query = query
      .order('status', { ascending: false }) // Show unhealthy first
      .order('last_checked_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: integrations, error: queryError, count } = await query;

    if (queryError) {
      console.error('Error fetching integration health:', queryError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch integration health' },
        { status: 500 }
      );
    }

    // Step 5: Calculate uptime percentage for each integration
    const enrichedIntegrations = (integrations || []).map((integration: any) => {
      // Calculate uptime based on error_count and success_rate
      const uptime = integration.success_rate || 0;
      const uptimePercentage = (uptime * 100).toFixed(2);

      return {
        ...integration,
        uptime_percentage: parseFloat(uptimePercentage),
        is_healthy: integration.status === 'healthy',
        last_checked_ago: integration.last_checked_at
          ? getTimeAgo(new Date(integration.last_checked_at))
          : 'Never',
      };
    });

    // Step 6: Generate summary statistics
    const summary = {
      healthy: enrichedIntegrations.filter((i: any) => i.status === 'healthy').length,
      degraded: enrichedIntegrations.filter((i: any) => i.status === 'degraded').length,
      down: enrichedIntegrations.filter((i: any) => i.status === 'down').length,
      maintenance: enrichedIntegrations.filter((i: any) => i.status === 'maintenance').length,
      total: count || 0,
    };

    // Step 7: Log admin action
    await logAdminAction({
      userId: user.id,
      userEmail: profile.email as string,
      actionType: 'view_integration_health',
      actionDetails: {
        filters: { status, integrationType },
        results_count: enrichedIntegrations.length,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      data: {
        integrations: enrichedIntegrations,
        summary,
      },
      pagination: {
        limit,
        offset,
        total: count || 0,
        hasMore: (offset + limit) < (count || 0),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/admin/integrations/health:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/integrations/health
 * 
 * Updates integration health status
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Step 1: Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Step 2: Verify admin access
    const { data: profile, error: profileError } = await (supabase as any)
      .from('profiles')
      .select('is_admin, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Step 3: Parse and validate request body
    const body = await request.json();
    const {
      integration_name,
      integration_type,
      status,
      response_time_ms,
      error_count,
      success_rate,
      health_data,
    } = body;

    // Validate required fields
    if (!integration_name || typeof integration_name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'integration_name is required and must be a string' },
        { status: 400 }
      );
    }

    if (!integration_type || typeof integration_type !== 'string') {
      return NextResponse.json(
        { success: false, error: 'integration_type is required and must be a string' },
        { status: 400 }
      );
    }

    const validStatuses = ['healthy', 'degraded', 'down', 'maintenance'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Step 4: Upsert integration health record with explicit casting
    const healthRecord = {
      integration_name,
      integration_type,
      status,
      last_checked_at: new Date().toISOString(),
      response_time_ms: response_time_ms ?? null,
      error_count: error_count ?? 0,
      success_rate: success_rate ?? null,
      health_data: health_data ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedHealth, error: upsertError } = await (supabase as any)
      .from('integration_health')
      .upsert(healthRecord, {
        onConflict: 'integration_name',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error upserting integration health:', upsertError);
      return NextResponse.json(
        { success: false, error: 'Failed to update integration health' },
        { status: 500 }
      );
    }

    // Step 5: Calculate uptime percentage
    const uptime = updatedHealth.success_rate || 0;
    const uptimePercentage = (uptime * 100).toFixed(2);

    const enrichedHealth = {
      ...updatedHealth,
      uptime_percentage: parseFloat(uptimePercentage),
      is_healthy: updatedHealth.status === 'healthy',
    };

    // Step 6: Log admin action
    await logAdminAction({
      userId: user.id,
      userEmail: profile.email as string,
      actionType: 'update_integration_health',
      actionDetails: {
        integration_name,
        integration_type,
        status,
        previous_status: updatedHealth.status,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      data: enrichedHealth,
      message: 'Integration health updated successfully',
      timestamp: new Date().toISOString(),
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in POST /api/admin/integrations/health:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to calculate human-readable time ago
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
