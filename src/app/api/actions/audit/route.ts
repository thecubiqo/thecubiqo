import { NextRequest, NextResponse } from 'next/server';
import { missingMigrationResponse, requireApiUser, safeTableMissing } from '../../_lib/supabase-admin';
import { mapAudit } from '../../_lib/v2-actions';

const auditSelect = '*';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 30), 100);
  const { data, error } = await auth.supabase
    .from('action_audit_logs')
    .select(auditSelect)
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('v2-actions', 'action_audit_logs');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ auditLogs: (data || []).map(mapAudit) });
}
