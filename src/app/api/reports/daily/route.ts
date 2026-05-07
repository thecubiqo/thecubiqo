import { NextRequest, NextResponse } from 'next/server';
import { missingMigrationResponse, requireApiUser, safeTableMissing } from '../../_lib/supabase-admin';
import { completeApproval, normalizePayload, requireApprovedAction, writeAudit } from '../../_lib/v2-actions';

const reportSelect =
  'id,approval_id,schedule_id,title,content,status,period_start,period_end,metadata,created_at,updated_at';

function mapReport(row: Record<string, any>) {
  return {
    id: row.id,
    approvalId: row.approval_id,
    scheduleId: row.schedule_id,
    title: row.title,
    content: row.content,
    status: row.status,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { data, error } = await auth.supabase
    .from('daily_reports')
    .select(reportSelect)
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(Math.min(Number(request.nextUrl.searchParams.get('limit') || 20), 50));

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('v2-actions', 'daily_reports');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reports: (data || []).map(mapReport) });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const approvalId = String(body.approvalId ?? body.approval_id ?? '').trim();
  const actionType = String(body.actionType ?? body.action_type ?? 'self_report_create').trim();
  if (!['self_report_create', 'daily_report_send'].includes(actionType)) {
    return NextResponse.json({ error: 'actionType must be self_report_create or daily_report_send' }, { status: 400 });
  }

  const approvalCheck = await requireApprovedAction(auth, approvalId, actionType);
  if (approvalCheck.error) return approvalCheck.error;

  const deliveryMethod = String(body.deliveryMethod ?? body.delivery_method ?? 'in_app').trim();
  if (deliveryMethod !== 'in_app') {
    await writeAudit(auth, {
      approvalId,
      actionType,
      toolName: actionType,
      status: 'blocked',
      message: 'External daily report sending is not enabled in V2 foundation'
    });
    return NextResponse.json(
      { error: 'Only in-app daily reports are enabled in V2 foundation', externalDeliveryEnabled: false },
      { status: 403 }
    );
  }

  const content = String(body.content || '').trim();
  if (!content) return NextResponse.json({ error: 'Report content is required' }, { status: 400 });

  const status = actionType === 'daily_report_send' ? 'sent_in_app' : 'ready';
  const { data, error } = await auth.supabase
    .from('daily_reports')
    .insert({
      user_id: auth.user.id,
      approval_id: approvalId,
      schedule_id: body.scheduleId || body.schedule_id || null,
      title: String(body.title || 'Daily CubiQo Report').trim().slice(0, 140),
      content,
      status,
      period_start: body.periodStart || body.period_start ? new Date(String(body.periodStart || body.period_start)).toISOString() : null,
      period_end: body.periodEnd || body.period_end ? new Date(String(body.periodEnd || body.period_end)).toISOString() : null,
      metadata: {
        ...normalizePayload(body.metadata),
        delivery_method: 'in_app',
        truthful_delivery_note: actionType === 'daily_report_send'
          ? 'Stored as in-app report; no external delivery connector is enabled.'
          : 'Prepared as in-app report.'
      }
    })
    .select(reportSelect)
    .single();

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('v2-actions', 'daily_reports');
    await completeApproval(auth, approvalId, false);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await completeApproval(auth, approvalId, true);
  await writeAudit(auth, {
    approvalId,
    actionType,
    toolName: actionType,
    status: 'completed',
    message: actionType === 'daily_report_send' ? 'Daily report stored in-app' : 'Self-report created',
    result: { reportId: data.id, status }
  });

  return NextResponse.json({ report: mapReport(data) }, { status: 201 });
}
