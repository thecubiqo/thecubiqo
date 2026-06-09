import { NextRequest, NextResponse } from 'next/server';
import { missingMigrationResponse, requireApiUser, safeTableMissing } from '../_lib/supabase-admin';
import { completeApproval, normalizePayload, requireApprovedAction, writeAudit } from '../_lib/v2-actions';

const taskSelect = 'id,approval_id,title,notes,status,due_at,source,metadata,created_at,updated_at';

function normalizeStatus(value: unknown) {
  const status = String(value || '').trim().toLowerCase();
  return ['open', 'in_progress', 'done', 'cancelled'].includes(status) ? status : 'open';
}

function mapTask(row: Record<string, any>) {
  return {
    id: row.id,
    approvalId: row.approval_id,
    title: row.title,
    notes: row.notes,
    status: row.status,
    dueAt: row.due_at,
    source: row.source,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const status = request.nextUrl.searchParams.get('status');
  let query = auth.supabase
    .from('user_tasks')
    .select(taskSelect)
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(Math.min(Number(request.nextUrl.searchParams.get('limit') || 30), 100));

  if (status) query = query.eq('status', normalizeStatus(status));

  const { data, error } = await query;
  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('v2-actions', 'user_tasks');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: (data || []).map(mapTask) });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const approvalId = String(body.approvalId ?? body.approval_id ?? '').trim();
  const approvalCheck = await requireApprovedAction(auth, approvalId, 'task_write');
  if (approvalCheck.error) return approvalCheck.error;

  const title = String(body.title || '').trim().slice(0, 180);
  if (!title) return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
  const dueAt = body.dueAt || body.due_at ? new Date(String(body.dueAt || body.due_at)).toISOString() : null;

  const { data, error } = await auth.supabase
    .from('user_tasks')
    .insert({
      user_id: auth.user.id,
      approval_id: approvalId,
      title,
      notes: body.notes ? String(body.notes).slice(0, 2000) : null,
      status: normalizeStatus(body.status),
      due_at: dueAt,
      source: 'cubiqo_v2_task_write',
      metadata: normalizePayload(body.metadata)
    })
    .select(taskSelect)
    .single();

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('v2-actions', 'user_tasks');
    await completeApproval(auth, approvalId, false);
    await writeAudit(auth, {
      approvalId,
      actionType: 'task_write',
      toolName: 'task_write',
      status: 'failed',
      message: error.message
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await completeApproval(auth, approvalId, true);
  await writeAudit(auth, {
    approvalId,
    actionType: 'task_write',
    toolName: 'task_write',
    status: 'completed',
    message: 'Task created',
    result: { taskId: data.id }
  });

  return NextResponse.json({ task: mapTask(data) }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const id = String(body.id || '').trim();
  if (!id) return NextResponse.json({ error: 'Task id is required' }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = String(body.title).trim().slice(0, 180);
  if (body.notes !== undefined) updates.notes = body.notes ? String(body.notes).slice(0, 2000) : null;
  if (body.status !== undefined) updates.status = normalizeStatus(body.status);
  if (body.dueAt !== undefined || body.due_at !== undefined) {
    const value = body.dueAt ?? body.due_at;
    updates.due_at = value ? new Date(String(value)).toISOString() : null;
  }
  if (!Object.keys(updates).length) return NextResponse.json({ error: 'No task updates provided' }, { status: 400 });

  const { data, error } = await auth.supabase
    .from('user_tasks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select(taskSelect)
    .maybeSingle();

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('v2-actions', 'user_tasks');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  await writeAudit(auth, {
    approvalId: data.approval_id,
    actionType: 'task_write',
    toolName: 'task_write',
    status: 'completed',
    message: 'Task updated',
    input: { id, fields: Object.keys(updates) }
  });

  return NextResponse.json({ task: mapTask(data) });
}
