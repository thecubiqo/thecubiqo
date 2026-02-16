import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Get self-heal reports
 * 
 * Query parameters:
 * - limit: Number of reports to fetch (default: 30)
 * - status: Filter by status (success/partial/failed)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const statusFilter = searchParams.get('status');

    const supabase = await createClient();

    // Build query
    let query = (supabase as any)
      .from('self_heal_reports')
      .select('*')
      .order('run_date', { ascending: false })
      .limit(Math.min(limit, 100)); // Cap at 100

    // Apply status filter if provided
    if (statusFilter && ['success', 'partial', 'failed'].includes(statusFilter)) {
      query = query.eq('status', statusFilter);
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error('[Admin Self-Heal API] Failed to fetch reports:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reports', details: error.message },
        { status: 500 }
      );
    }

    // Get audit logs for each report (optional, can be loaded on demand)
    // For now, we'll just return the reports
    
    return NextResponse.json({
      reports: reports || [],
      count: reports?.length || 0,
    });

  } catch (error) {
    console.error('[Admin Self-Heal API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
