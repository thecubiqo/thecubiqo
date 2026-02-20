/**
 * Admin API: Generated Reports List
 * 
 * Endpoints for viewing previously generated compliance and activity reports
 * Supports filtering, searching, and pagination
 * 
 * @route GET /api/admin/reports/list - List all generated reports
 * @access Admin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAdminAction } from '@/lib/audit';

/**
 * GET /api/admin/reports/list
 * 
 * Retrieves all previously generated reports from compliance_reports table
 * Supports filtering by report type, date range, and generator
 * 
 * Query Parameters:
 * - report_type: Filter by report type (user_activity/compliance_gdpr/etc)
 * - generated_by: Filter by user ID who generated the report
 * - date_from: Filter reports generated after this date
 * - date_to: Filter reports generated before this date
 * - date_range_start: Filter by report's data date range start
 * - date_range_end: Filter by report's data date range end
 * - include_data: Include full report_data in response (default: false)
 * - limit: Results per page (default: 20, max: 100)
 * - offset: Pagination offset (default: 0)
 * - sort: Sort field (created_at/report_type) (default: created_at)
 * - order: Sort order (asc/desc) (default: desc)
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     reports: [...],
 *     summary: { total, by_type, recent_count }
 *   },
 *   pagination: { limit, offset, total, hasMore }
 * }
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

    // Step 3: Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('report_type');
    const generatedBy = searchParams.get('generated_by');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const dateRangeStart = searchParams.get('date_range_start');
    const dateRangeEnd = searchParams.get('date_range_end');
    const includeData = searchParams.get('include_data') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';

    // Validate sort and order
    const validSortFields = ['created_at', 'report_type', 'date_range_start', 'date_range_end'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    const ascending = order === 'asc';

    // Step 4: Build query
    let selectFields = 'id, report_type, report_format, generated_by, date_range_start, date_range_end, file_path, created_at';
    if (includeData) {
      selectFields += ', report_data';
    }

    let query = (supabase as any)
      .from('compliance_reports')
      .select(selectFields, { count: 'exact' });

    // Apply filters
    if (reportType) {
      query = query.eq('report_type', reportType);
    }

    if (generatedBy) {
      query = query.eq('generated_by', generatedBy);
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      if (!isNaN(fromDate.getTime())) {
        query = query.gte('created_at', fromDate.toISOString());
      }
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      if (!isNaN(toDate.getTime())) {
        query = query.lte('created_at', toDate.toISOString());
      }
    }

    if (dateRangeStart) {
      const rangeStart = new Date(dateRangeStart);
      if (!isNaN(rangeStart.getTime())) {
        query = query.gte('date_range_start', rangeStart.toISOString());
      }
    }

    if (dateRangeEnd) {
      const rangeEnd = new Date(dateRangeEnd);
      if (!isNaN(rangeEnd.getTime())) {
        query = query.lte('date_range_end', rangeEnd.toISOString());
      }
    }

    // Apply sorting and pagination
    query = query
      .order(sortField, { ascending })
      .range(offset, offset + limit - 1);

    const { data: reports, error: queryError, count } = await query;

    if (queryError) {
      console.error('Error fetching reports:', queryError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch reports' },
        { status: 500 }
      );
    }

    // Step 5: Enrich reports with generator information
    const userIds = [...new Set((reports as any[])?.map((r: any) => r.generated_by) || [])];
    const { data: generators } = await (supabase as any)
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    const generatorMap = (generators as any[])?.reduce((acc: any, gen: any) => {
      acc[gen.id] = gen;
      return acc;
    }, {} as Record<string, any>) || {};

    const enrichedReports = (reports as any[])?.map((report: any) => ({
      ...report,
      generated_by_user: generatorMap[report.generated_by] || null,
      data_summary: !includeData && report.report_data ? {
        has_data: true,
        summary: report.report_data?.summary || null,
      } : undefined,
    }));

    // Step 6: Generate summary statistics
    const { data: summaryData } = await (supabase as any)
      .from('compliance_reports')
      .select('report_type, created_at');

    const byType = (summaryData as any[])?.reduce((acc: any, r: any) => {
      acc[r.report_type] = (acc[r.report_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = (summaryData as any[])?.filter(
      (r: any) => new Date(r.created_at) > last24Hours
    ).length || 0;

    const summary = {
      total: count || 0,
      by_type: byType,
      recent_count: recentCount,
      last_generated: reports?.[0]?.created_at || null,
    };

    // Step 7: Log admin action
    await logAdminAction({
      userId: user.id,
      userEmail: profile.email as string,
      actionType: 'view_reports',
      actionDetails: {
        filters: {
          report_type: reportType,
          generated_by: generatedBy,
          date_from: dateFrom,
          date_to: dateTo,
        },
        results_count: enrichedReports?.length || 0,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      data: {
        reports: enrichedReports || [],
        summary,
      },
      pagination: {
        limit,
        offset,
        total: count || 0,
        hasMore: (offset + limit) < (count || 0),
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil((count || 0) / limit),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/admin/reports/list:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
