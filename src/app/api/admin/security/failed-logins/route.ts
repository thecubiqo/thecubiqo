import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Threshold for creating security alert
const FAILED_LOGIN_THRESHOLD = 5;
const THRESHOLD_WINDOW_MINUTES = 10;

/**
 * GET /api/admin/security/failed-logins
 * List recent failed login attempts
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
      .select('is_admin')
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
    const email = searchParams.get('email');
    const ipAddress = searchParams.get('ip');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const offset = (page - 1) * limit;

    // Build query - failed logins are stored as security alerts with type 'failed_login'
    let query = (supabase as any)
      .from('security_alerts')
      .select('*', { count: 'exact' })
      .eq('alert_type', 'failed_login');

    // Apply filters
    if (email) {
      query = query.ilike('user_email', `%${email}%`);
    }

    if (ipAddress) {
      query = query.eq('ip_address', ipAddress);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply sorting and pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: failedLogins, error, count } = await query;

    if (error) {
      console.error('Error fetching failed logins:', error);
      return NextResponse.json(
        { error: 'Failed to fetch failed login attempts' },
        { status: 500 }
      );
    }

    // Get top offenders (by email and IP)
    const { data: topEmails } = await (supabase as any)
      .from('security_alerts')
      .select('user_email')
      .eq('alert_type', 'failed_login')
      .not('user_email', 'is', null);

    const { data: topIPs } = await (supabase as any)
      .from('security_alerts')
      .select('ip_address')
      .eq('alert_type', 'failed_login')
      .not('ip_address', 'is', null);

    // Count occurrences
    const emailCounts: Record<string, number> = {};
    const ipCounts: Record<string, number> = {};

    topEmails?.forEach((item: any) => {
      if (item.user_email) {
        emailCounts[item.user_email] = (emailCounts[item.user_email] || 0) + 1;
      }
    });

    topIPs?.forEach((item: any) => {
      if (item.ip_address) {
        ipCounts[item.ip_address] = (ipCounts[item.ip_address] || 0) + 1;
      }
    });

    // Sort and get top 10
    const topOffendersByEmail = Object.entries(emailCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([email, count]) => ({ email, count }));

    const topOffendersByIP = Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    return NextResponse.json({
      success: true,
      data: failedLogins,
      topOffenders: {
        byEmail: topOffendersByEmail,
        byIP: topOffendersByIP,
      },
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /api/admin/security/failed-logins:', error);
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
 * POST /api/admin/security/failed-logins
 * Log failed login attempt
 * Auto-creates security alert if threshold exceeded
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const body = await request.json();
    const { email, ip_address, user_agent } = body;

    // Validate required fields
    if (!email && !ip_address) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either email or ip_address is required',
        },
        { status: 400 }
      );
    }

    // Check recent failed login attempts for this email/IP
    const windowStart = new Date(
      Date.now() - THRESHOLD_WINDOW_MINUTES * 60 * 1000
    ).toISOString();

    let recentAttemptsQuery = (supabase as any)
      .from('security_alerts')
      .select('id', { count: 'exact' })
      .eq('alert_type', 'failed_login')
      .gte('created_at', windowStart);

    if (email) {
      recentAttemptsQuery = recentAttemptsQuery.eq('user_email', email);
    } else if (ip_address) {
      recentAttemptsQuery = recentAttemptsQuery.eq('ip_address', ip_address);
    }

    const { count: recentAttempts } = await recentAttemptsQuery;

    // Determine severity based on attempt count
    let severity = 'low';
    if (recentAttempts && recentAttempts >= FAILED_LOGIN_THRESHOLD) {
      severity = 'high';
    } else if (recentAttempts && recentAttempts >= FAILED_LOGIN_THRESHOLD / 2) {
      severity = 'medium';
    }

    // Log the failed login attempt
    const { data: alertId, error: createError } = await (supabase as any).rpc(
      'create_security_alert',
      {
        p_alert_type: 'failed_login',
        p_severity: severity,
        p_user_id: null,
        p_user_email: email || null,
        p_ip_address: ip_address || null,
        p_user_agent: user_agent || null,
        p_alert_data: {
          attempt_number: (recentAttempts || 0) + 1,
          window_minutes: THRESHOLD_WINDOW_MINUTES,
        },
      }
    );

    if (createError) {
      console.error('Error logging failed login:', createError);
      return NextResponse.json(
        { success: false, error: 'Failed to log failed login attempt' },
        { status: 500 }
      );
    }

    // If threshold exceeded, create a brute force alert
    if (recentAttempts && recentAttempts >= FAILED_LOGIN_THRESHOLD) {
      await (supabase as any).rpc('create_security_alert', {
        p_alert_type: 'brute_force',
        p_severity: 'critical',
        p_user_id: null,
        p_user_email: email || null,
        p_ip_address: ip_address || null,
        p_user_agent: user_agent || null,
        p_alert_data: {
          failed_attempts: recentAttempts + 1,
          window_minutes: THRESHOLD_WINDOW_MINUTES,
          threshold: FAILED_LOGIN_THRESHOLD,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        alert_id: alertId,
        severity,
        recent_attempts: (recentAttempts || 0) + 1,
        threshold_exceeded: recentAttempts && recentAttempts >= FAILED_LOGIN_THRESHOLD,
      },
      message: 'Failed login attempt logged',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in POST /api/admin/security/failed-logins:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
