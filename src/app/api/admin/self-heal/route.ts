import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth/admin-guard';

export const dynamic = 'force-dynamic';

/**
 * Get self-heal reports (admin only)
 * 
 * Query parameters:
 * - limit: Number of reports to fetch (default: 30)
 * - status: Filter by status (success/partial/failed)
 */
export const GET = withAdminAuth(async (req, { supabase }) => {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '30', 10);
  const statusFilter = searchParams.get('status');

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
  
  return NextResponse.json({
    reports: reports || [],
    count: reports?.length || 0,
  });
});
