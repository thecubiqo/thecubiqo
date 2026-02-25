import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient() as any;
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const actionType = searchParams.get('actionType');

    // Query audit_logs table
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply action type filter if provided
    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    const { data: logs, error: logsError, count } = await query;

    if (logsError) {
      throw new Error(`Failed to fetch logs: ${logsError.message}`);
    }

    // Map audit logs to a consistent format
    const mappedLogs = (logs || []).map((log: any) => ({
      id: log.id,
      action_type: log.action_type,
      action_details: log.action_details,
      user_id: log.user_id,
      user_email: log.user_email,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      created_at: log.created_at,
    }));

    return NextResponse.json({
      logs: mappedLogs,
      total: count || 0,
      limit,
      offset,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Admin logs error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch logs',
        logs: [],
        total: 0,
        limit: 50,
        offset: 0,
      },
      { status: 500 }
    );
  }
}
