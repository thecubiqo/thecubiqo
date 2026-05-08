import { NextRequest, NextResponse } from 'next/server';
import { missingMigrationResponse, requireApiUser, safeTableMissing } from '../../_lib/supabase-admin';
import { getActionCapability, isApprovalRequestable } from '../../_lib/v2-capabilities';
import {
  mapApproval,
  normalizeActionType,
  normalizePayload,
  normalizeToolName,
  writeAudit
} from '../../_lib/v2-actions';

const approvalSelect =
  'id,action_type,tool_name,status,title,summary,payload,risk_level,expires_at,decided_at,created_at,updated_at';

function normalizeRisk(value: unknown) {
  const risk = String(value || '').toLowerCase();
  return ['low', 'medium', 'high'].includes(risk) ? risk : 'low';
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const id = request.nextUrl.searchParams.get('id');
  let query = auth.supabase
    .from('action_approvals')
    .select(approvalSelect)
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(Math.min(Number(request.nextUrl.searchParams.get('limit') || 20), 50));

  if (id) query = query.eq('id', id);

  const { data, error } = await query;
  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('v2-actions', 'action_approvals');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const approvals = (data || []).map(mapApproval);
  return NextResponse.json({ approvals, approval: id ? approvals[0] || null : undefined });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const actionType = normalizeActionType(body.actionType ?? body.action_type);
  if (!actionType) return NextResponse.json({ error: 'Valid actionType is required' }, { status: 400 });
  const capability = getActionCapability(actionType);
  if (!capability || !isApprovalRequestable(actionType)) {
    await writeAudit(auth, {
      actionType,
      toolName: normalizeToolName(body.toolName ?? body.tool_name, actionType),
      status: 'blocked',
      message: 'Approval request blocked because this V2 capability is not end-to-end enabled',
      input: { actionType },
      result: {
        capabilityStatus: capability?.status || 'unknown',
        requirements: capability?.requirements || []
      }
    });
    return NextResponse.json(
      {
        error: 'This V2 capability is not end-to-end enabled yet',
        capability,
        approvalCreated: false
      },
      { status: 501 }
    );
  }

  const toolName = normalizeToolName(body.toolName ?? body.tool_name, actionType);
  const title = String(body.title || `${actionType} approval`).trim().slice(0, 140);
  const summary = String(body.summary || '').trim().slice(0, 700);
  if (!summary) return NextResponse.json({ error: 'Approval summary is required' }, { status: 400 });

  const { data, error } = await auth.supabase
    .from('action_approvals')
    .insert({
      user_id: auth.user.id,
      action_type: actionType,
      tool_name: toolName,
      status: 'requested',
      title,
      summary,
      payload: normalizePayload(body.payload),
      risk_level: normalizeRisk(body.riskLevel ?? body.risk_level)
    })
    .select(approvalSelect)
    .single();

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('v2-actions', 'action_approvals');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ approval: mapApproval(data) }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const id = String(body.id || '').trim();
  const status = String(body.status || '').trim().toLowerCase() as 'approved' | 'denied' | 'cancelled';
  if (!id) return NextResponse.json({ error: 'Approval id is required' }, { status: 400 });
  if (!['approved', 'denied', 'cancelled'].includes(status)) {
    return NextResponse.json({ error: 'Status must be approved, denied, or cancelled' }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from('action_approvals')
    .update({ status, decided_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .eq('status', 'requested')
    .select(approvalSelect)
    .maybeSingle();

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('v2-actions', 'action_approvals');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Requested approval not found' }, { status: 404 });

  return NextResponse.json({ approval: mapApproval(data) });
}
