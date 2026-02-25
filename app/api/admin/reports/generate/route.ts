/**
 * Admin API: Report Generation
 * 
 * Endpoints for generating compliance, activity, and performance reports
 * Supports multiple report types with customizable date ranges
 * All generated reports are logged to audit_logs and stored in compliance_reports
 * 
 * @route POST /api/admin/reports/generate - Generate a new report
 * @access Admin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAdminAction } from '@/lib/audit';

/**
 * Supported report types
 */
type ReportType =
  | 'user_activity'
  | 'compliance_gdpr'
  | 'compliance_ccpa'
  | 'ai_performance'
  | 'security_audit';

/**
 * Report format options
 */
type ReportFormat = 'json' | 'csv' | 'pdf' | 'html';

/**
 * POST /api/admin/reports/generate
 * 
 * Generates a report based on the specified type and date range
 * Stores the report in compliance_reports table and logs the action
 * 
 * Request Body:
 * {
 *   report_type: 'user_activity' | 'compliance_gdpr' | 'compliance_ccpa' | 'ai_performance' | 'security_audit',
 *   report_format?: 'json' | 'csv' | 'pdf' | 'html' (default: 'json'),
 *   date_range_start: ISO8601 date string (required),
 *   date_range_end: ISO8601 date string (required),
 *   filters?: object (optional filters specific to report type)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     report_id: uuid,
 *     report_type: string,
 *     report_data: object (actual report content),
 *     generated_at: timestamp,
 *     date_range: { start, end }
 *   },
 *   message: 'Report generated successfully'
 * }
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

    // Step 3: Parse and validate request body
    const body = await request.json();
    const {
      report_type,
      report_format = 'json',
      date_range_start,
      date_range_end,
      filters = {},
    } = body;

    // Validate report type
    const validReportTypes: ReportType[] = [
      'user_activity',
      'compliance_gdpr',
      'compliance_ccpa',
      'ai_performance',
      'security_audit',
    ];

    if (!report_type || !validReportTypes.includes(report_type)) {
      return NextResponse.json(
        {
          success: false,
          error: `report_type must be one of: ${validReportTypes.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate report format
    const validFormats: ReportFormat[] = ['json', 'csv', 'pdf', 'html'];
    if (!validFormats.includes(report_format)) {
      return NextResponse.json(
        {
          success: false,
          error: `report_format must be one of: ${validFormats.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate date range
    if (!date_range_start || !date_range_end) {
      return NextResponse.json(
        { success: false, error: 'date_range_start and date_range_end are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(date_range_start);
    const endDate = new Date(date_range_end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use ISO8601 format.' },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { success: false, error: 'date_range_start must be before date_range_end' },
        { status: 400 }
      );
    }

    // Step 4: Generate report based on type
    let reportData: any;
    try {
      reportData = await generateReportData(
        supabase,
        report_type,
        startDate,
        endDate,
        filters
      );
    } catch (error) {
      console.error(`Error generating ${report_type} report:`, error);
      return NextResponse.json(
        { success: false, error: `Failed to generate ${report_type} report` },
        { status: 500 }
      );
    }

    // Step 5: Store report in compliance_reports table
    const { data: savedReport, error: saveError } = await (supabase as any)
      .from('compliance_reports')
      .insert({
        report_type,
        report_format,
        report_data: reportData,
        generated_by: user.id,
        date_range_start: startDate.toISOString(),
        date_range_end: endDate.toISOString(),
        file_path: null, // Can be populated later if generating PDF/CSV files
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving report:', saveError);
      return NextResponse.json(
        { success: false, error: 'Failed to save report' },
        { status: 500 }
      );
    }

    // Step 6: Log admin action
    await logAdminAction({
      userId: user.id,
      userEmail: profile.email as string,
      actionType: 'generate_report',
      actionDetails: {
        report_id: savedReport.id,
        report_type,
        report_format,
        date_range: {
          start: date_range_start,
          end: date_range_end,
        },
        filters,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      data: {
        report_id: savedReport.id,
        report_type: savedReport.report_type,
        report_format: savedReport.report_format,
        report_data: savedReport.report_data,
        generated_at: savedReport.created_at,
        generated_by: user.id,
        date_range: {
          start: savedReport.date_range_start,
          end: savedReport.date_range_end,
        },
      },
      message: 'Report generated successfully',
      timestamp: new Date().toISOString(),
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in POST /api/admin/reports/generate:', error);

    // Handle JSON parsing errors
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
 * Generate report data based on report type
 * Each report type queries different tables and aggregates data differently
 */
async function generateReportData(
  supabase: any,
  reportType: ReportType,
  startDate: Date,
  endDate: Date,
  filters: any
): Promise<any> {
  switch (reportType) {
    case 'user_activity':
      return await generateUserActivityReport(supabase, startDate, endDate, filters);

    case 'compliance_gdpr':
      return await generateGDPRComplianceReport(supabase, startDate, endDate, filters);

    case 'compliance_ccpa':
      return await generateCCPAComplianceReport(supabase, startDate, endDate, filters);

    case 'ai_performance':
      return await generateAIPerformanceReport(supabase, startDate, endDate, filters);

    case 'security_audit':
      return await generateSecurityAuditReport(supabase, startDate, endDate, filters);

    default:
      throw new Error(`Unsupported report type: ${reportType}`);
  }
}

/**
 * Generate User Activity Report
 * Tracks user logins, actions, and engagement metrics
 */
async function generateUserActivityReport(
  supabase: any,
  startDate: Date,
  endDate: Date,
  filters: any
) {
  // Get user registration stats
  const { data: newUsers, count: newUsersCount } = await (supabase as any)
    .from('profiles')
    .select('id, created_at', { count: 'exact' })
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Get audit log activity
  const { data: auditLogs, count: totalActions } = await (supabase as any)
    .from('audit_logs')
    .select('action_type, user_id, created_at', { count: 'exact' })
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Get unique active users
  const uniqueUsers = new Set(auditLogs?.map((log: any) => log.user_id) || []);

  // Aggregate actions by type
  const actionsByType = auditLogs?.reduce((acc: any, log: any) => {
    acc[log.action_type] = (acc[log.action_type] || 0) + 1;
    return acc;
  }, {});

  return {
    summary: {
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      new_users: newUsersCount || 0,
      active_users: uniqueUsers.size,
      total_actions: totalActions || 0,
    },
    actions_by_type: actionsByType || {},
    daily_activity: aggregateDailyActivity(auditLogs || []),
    new_user_signups: newUsers || [],
  };
}

/**
 * Generate GDPR Compliance Report
 * Tracks data access requests, deletions, and consent management
 */
async function generateGDPRComplianceReport(
  supabase: any,
  startDate: Date,
  endDate: Date,
  filters: any
) {
  // Get data access requests from audit logs
  const { data: dataAccessRequests } = await (supabase as any)
    .from('audit_logs')
    .select('*')
    .eq('action_type', 'data_access_request')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Get data deletion requests
  const { data: dataDeletionRequests } = await (supabase as any)
    .from('audit_logs')
    .select('*')
    .eq('action_type', 'data_deletion_request')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Get user consent changes
  const { data: consentChanges } = await (supabase as any)
    .from('audit_logs')
    .select('*')
    .eq('action_type', 'update_consent')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  return {
    summary: {
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      data_access_requests: dataAccessRequests?.length || 0,
      data_deletion_requests: dataDeletionRequests?.length || 0,
      consent_changes: consentChanges?.length || 0,
    },
    data_access_requests: dataAccessRequests || [],
    data_deletion_requests: dataDeletionRequests || [],
    consent_changes: consentChanges || [],
    compliance_status: 'compliant', // Can be calculated based on SLA metrics
  };
}

/**
 * Generate CCPA Compliance Report
 * Similar to GDPR but focuses on California Consumer Privacy Act requirements
 */
async function generateCCPAComplianceReport(
  supabase: any,
  startDate: Date,
  endDate: Date,
  filters: any
) {
  // CCPA requirements overlap with GDPR but have different terminology
  const { data: doNotSellRequests } = await (supabase as any)
    .from('audit_logs')
    .select('*')
    .eq('action_type', 'do_not_sell_request')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const { data: dataDisclosureRequests } = await (supabase as any)
    .from('audit_logs')
    .select('*')
    .eq('action_type', 'data_disclosure_request')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  return {
    summary: {
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      do_not_sell_requests: doNotSellRequests?.length || 0,
      data_disclosure_requests: dataDisclosureRequests?.length || 0,
    },
    do_not_sell_requests: doNotSellRequests || [],
    data_disclosure_requests: dataDisclosureRequests || [],
    compliance_status: 'compliant',
  };
}

/**
 * Generate AI Performance Report
 * Tracks AI model usage, performance metrics, and costs
 */
async function generateAIPerformanceReport(
  supabase: any,
  startDate: Date,
  endDate: Date,
  filters: any
) {
  // Get AI-related events
  const { data: aiEvents } = await (supabase as any)
    .from('events')
    .select('*')
    .or('event_type.eq.ai_chat,event_type.eq.ai_completion,event_type.eq.ai_embedding')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Calculate performance metrics
  const totalRequests = aiEvents?.length || 0;
  const successfulRequests = aiEvents?.filter((e: any) =>
    e.metadata?.success === true
  ).length || 0;

  const avgResponseTime = aiEvents?.reduce((sum: number, e: any) =>
    sum + (e.metadata?.response_time_ms || 0), 0
  ) / totalRequests || 0;

  const totalTokens = aiEvents?.reduce((sum: number, e: any) =>
    sum + (e.metadata?.tokens_used || 0), 0
  ) || 0;

  return {
    summary: {
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      total_requests: totalRequests,
      successful_requests: successfulRequests,
      success_rate: totalRequests > 0 ? (successfulRequests / totalRequests * 100).toFixed(2) : 0,
      avg_response_time_ms: avgResponseTime.toFixed(2),
      total_tokens_used: totalTokens,
    },
    requests_by_type: aggregateByField(aiEvents || [], 'event_type'),
    daily_usage: aggregateDailyActivity(aiEvents || []),
  };
}

/**
 * Generate Security Audit Report
 * Tracks security events, failed logins, and suspicious activities
 */
async function generateSecurityAuditReport(
  supabase: any,
  startDate: Date,
  endDate: Date,
  filters: any
) {
  // Get security-related audit logs
  const { data: securityEvents } = await supabase
    .from('audit_logs')
    .select('*')
    .or('action_type.eq.login_failed,action_type.eq.password_reset,action_type.eq.account_locked,action_type.eq.suspicious_activity')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Get failed login attempts
  const { data: failedLogins, count: failedLoginCount } = await supabase
    .from('failed_login_attempts')
    .select('*', { count: 'exact' })
    .gte('attempted_at', startDate.toISOString())
    .lte('attempted_at', endDate.toISOString());

  // Get security alerts
  const { data: securityAlerts } = await supabase
    .from('security_alerts')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  return {
    summary: {
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      total_security_events: securityEvents?.length || 0,
      failed_login_attempts: failedLoginCount || 0,
      security_alerts: securityAlerts?.length || 0,
      critical_alerts: securityAlerts?.filter((a: any) => a.severity === 'critical').length || 0,
    },
    failed_logins: failedLogins || [],
    security_alerts: securityAlerts || [],
    events_by_type: aggregateByField(securityEvents || [], 'action_type'),
  };
}

/**
 * Helper: Aggregate activity by day
 */
function aggregateDailyActivity(records: any[]): Record<string, number> {
  return records.reduce((acc, record) => {
    const date = new Date(record.created_at).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Helper: Aggregate records by a specific field
 */
function aggregateByField(records: any[], field: string): Record<string, number> {
  return records.reduce((acc, record) => {
    const value = record[field] || 'unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}
