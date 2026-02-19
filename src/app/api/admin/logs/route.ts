import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    
    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const level = searchParams.get('level'); // optional filter: error, warn, info, debug
    
    // Build query
    let query = supabase
      .from('admin_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply level filter if provided
    if (level) {
      query = query.eq('level', level);
    }
    
    const { data: logs, error: logsError, count } = await query;
    
    // If admin_logs doesn't exist, try audit_logs as fallback
    if (logsError && logsError.message.includes('does not exist')) {
      let auditQuery = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      const { data: auditLogs, error: auditError, count: auditCount } = await auditQuery;
      
      if (auditError) {
        throw new Error(`Failed to fetch logs: ${auditError.message}`);
      }
      
      // Map audit logs to a consistent format
      const mappedLogs = (auditLogs || []).map(log => ({
        id: log.id,
        level: 'info',
        message: log.action || 'Audit log entry',
        metadata: {
          user_id: log.user_id,
          action: log.action,
          resource_type: log.resource_type,
          resource_id: log.resource_id,
          details: log.details,
          ip_address: log.ip_address,
        },
        created_at: log.created_at,
      }));
      
      return NextResponse.json({
        logs: mappedLogs,
        total: auditCount || mappedLogs.length,
        limit,
        offset,
        source: 'audit_logs',
        timestamp: new Date(),
      });
    }
    
    if (logsError) {
      throw new Error(`Failed to fetch logs: ${logsError.message}`);
    }
    
    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      limit,
      offset,
      source: 'admin_logs',
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
