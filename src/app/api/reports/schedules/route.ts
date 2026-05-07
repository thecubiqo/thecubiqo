import { NextRequest, NextResponse } from 'next/server';
import { missingMigrationResponse, requireApiUser, safeTableMissing } from '../../_lib/supabase-admin';
import { completeApproval, normalizePayload, requireApprovedAction, writeAudit } from '../../_lib/v2-actions';

const scheduleSelect =
  'id,approval_id,name,cadence,delivery_method,status,timezone,next_run_at,summary_scope,metadata,created_at,updated_at';

function normalizeCadence(value: unknown) {
  const cadence = String(value || '').trim().toLowerCase();
  return ['daily', 'weekly'].includes(cadence) ? cadence : 'daily';
}

function normalizeScheduleStatus(value: unknown) {
  const status = String(value || '').trim().toLowerCase();
  return ['active', 'paused', 'cancelled'].includes(status) ? status : 'active';
}

function normalizeScope(value: unknown) {
  const raw = Array.isArray(value) ? value : ['journal', 'signals', 'tasks'];
  return [...new Set(raw.map(item => String(item || '').trim().toLowerCase()).filter(Boolean))].slice(0, 12);
}

function mapSchedule(row: Record<string, any>) {
  return {
    id: row.id,
    approvalId: row.approval_id,
    name: row.name,
    cadence: row.cadence,
    deliveryMethod: row.delivery_method,
    status: row.status,
    timezone: row.timezone,
    nextRunAt: row.next_run_at,
    summaryScope: Array.isArray(row.summary_scope) ? row.summary_scope : [],
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { data, error } = await auth.supabase
    .from('report_schedules')
    .select(scheduleSelect)
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(Math.min(Number(request.nextUrl.searchParams.get('limit') || 20), 50));

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('v2-actions', 'report_schedules');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ schedules: (data || []).map(mapSchedule) });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const approvalId = String(body.approvalId ?? body.approval_id ?? '').trim();
  const approvalCheck = await requireApprovedAction(auth, approvalId, 'cron_schedule_create');
  if (approvalCheck.error) return approvalCheck.error;

  const name = String(body.name || 'Daily CubiQo Report').trim().slice(0, 140);
  const deliveryMethod = String(body.deliveryMethod ?? body.delivery_method ?? 'in_app').trim();
  if (deliveryMethod !== 'in_app') {
    await writeAudit(auth, {
      approvalId,
      actionType: 'cron_schedule_create',
      toolName: 'cron_schedule_create',
      status: 'blocked',
      message: 'External report delivery is not enabled in V2 foundation'
    });
    return NextResponse.json(
      { error: 'Only in-app report schedules are enabled in V2 foundation', externalDeliveryEnabled: false },
      { status: 403 }
    );
  }

  const nextRunAt = body.nextRunAt || body.next_run_at
    ? new Date(String(body.nextRunAt || body.next_run_at)).toISOString()
    : null;

  const { data, error } = await auth.supabase
    .from('report_schedules')
    .insert({
      user_id: auth.user.id,
      approval_id: approvalId,
      name,
      cadence: normalizeCadence(body.cadence),
      delivery_method: 'in_app',
      status: normalizeScheduleStatus(body.status),
      timezone: String(body.timezone || 'America/New_York').slice(0, 80),
      next_run_at: nextRunAt,
      summary_scope: normalizeScope(body.summaryScope ?? body.summary_scope),
      metadata: normalizePayload(body.metadata)
    })
    .select(scheduleSelect)
    .single();

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('v2-actions', 'report_schedules');
    await completeApproval(auth, approvalId, false);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await completeApproval(auth, approvalId, true);
  await writeAudit(auth, {
    approvalId,
    actionType: 'cron_schedule_create',
    toolName: 'cron_schedule_create',
    status: 'completed',
    message: 'In-app report schedule created',
    result: { scheduleId: data.id }
  });

  return NextResponse.json({ schedule: mapSchedule(data) }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const id = String(body.id || '').trim();
  if (!id) return NextResponse.json({ error: 'Schedule id is required' }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = String(body.name).trim().slice(0, 140);
  if (body.status !== undefined) updates.status = normalizeScheduleStatus(body.status);
  if (body.cadence !== undefined) updates.cadence = normalizeCadence(body.cadence);
  if (body.nextRunAt !== undefined || body.next_run_at !== undefined) {
    const value = body.nextRunAt ?? body.next_run_at;
    updates.next_run_at = value ? new Date(String(value)).toISOString() : null;
  }
  if (!Object.keys(updates).length) return NextResponse.json({ error: 'No schedule updates provided' }, { status: 400 });

  const { data, error } = await auth.supabase
    .from('report_schedules')
    .update(updates)
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select(scheduleSelect)
    .maybeSingle();

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('v2-actions', 'report_schedules');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });

  await writeAudit(auth, {
    approvalId: data.approval_id,
    actionType: 'cron_schedule_create',
    toolName: 'cron_schedule_create',
    status: 'completed',
    message: 'Report schedule updated',
    input: { id, fields: Object.keys(updates) }
  });

  return NextResponse.json({ schedule: mapSchedule(data) });
}
