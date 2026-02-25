import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/security/alerts
 * List security alerts with filtering (severity, status, type, date range)
 * Admin-only access
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Check admin authorization
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('is_admin, email')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const severity = searchParams.get('severity'); // 'low' | 'medium' | 'high' | 'critical'
    const status = searchParams.get('status'); // 'open' | 'investigating' | 'resolved' | 'false_positive'
    const alertType = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const offset = (page - 1) * limit;

    // Build query
    let query = (supabase as any)
      .from('security_alerts')
      .select('*', { count: 'exact' });

    // Apply filters
    if (severity) {
      query = query.eq('severity', severity);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (alertType) {
      query = query.eq('alert_type', alertType);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: alerts, error, count } = await query;

    if (error) {
      console.error('Error fetching security alerts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch security alerts' },
        { status: 500 }
      );
    }

    // Get aggregate stats
    const { data: stats } = await (supabase as any)
      .from('security_alerts')
      .select('severity, status')
      .then((result: any) => {
        if (!result.data) return { data: null };

        const statsSummary = {
          bySeverity: {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0,
          },
          byStatus: {
            open: 0,
            investigating: 0,
            resolved: 0,
            false_positive: 0,
          },
        };

        result.data.forEach((alert: any) => {
          if (alert.severity) {
            statsSummary.bySeverity[alert.severity as keyof typeof statsSummary.bySeverity]++;
          }
          if (alert.status) {
            statsSummary.byStatus[alert.status as keyof typeof statsSummary.byStatus]++;
          }
        });

        return { data: statsSummary };
      });

    return NextResponse.json({
      success: true,
      data: alerts,
      stats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /api/admin/security/alerts:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/security/alerts
 * Create new security alert
 * Admin-only access
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check admin authorization
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('is_admin, email')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      alert_type,
      severity,
      user_id,
      user_email,
      ip_address,
      user_agent,
      alert_data = {},
    } = body;

    // Validate required fields
    if (!alert_type) {
      return NextResponse.json(
        { success: false, error: 'alert_type is required' },
        { status: 400 }
      );
    }

    if (!severity) {
      return NextResponse.json(
        { success: false, error: 'severity is required' },
        { status: 400 }
      );
    }

    // Validate severity value
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        {
          success: false,
          error: `severity must be one of: ${validSeverities.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Create security alert using RPC function
    const { data: alertId, error: createError } = await (supabase as any).rpc(
      'create_security_alert',
      {
        p_alert_type: alert_type,
        p_severity: severity,
        p_user_id: user_id || null,
        p_user_email: user_email || null,
        p_ip_address: ip_address || null,
        p_user_agent: user_agent || null,
        p_alert_data: alert_data,
      }
    );

    if (createError) {
      console.error('Error creating security alert:', createError);
      return NextResponse.json(
        { success: false, error: 'Failed to create security alert' },
        { status: 500 }
      );
    }

    // Log admin action
    await (supabase as any).rpc('log_admin_action', {
      p_user_id: user.id,
      p_user_email: profile?.email || '',
      p_action_type: 'security_alert_created',
      p_action_details: { alert_id: alertId, alert_type, severity },
    });

    // Fetch the created alert
    const { data: alert, error: fetchError } = await (supabase as any)
      .from('security_alerts')
      .select('*')
      .eq('id', alertId)
      .single();

    if (fetchError) {
      console.error('Error fetching created alert:', fetchError);
    }

    return NextResponse.json({
      success: true,
      data: alert,
      message: 'Security alert created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in POST /api/admin/security/alerts:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
