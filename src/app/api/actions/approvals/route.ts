import { NextRequest, NextResponse } from 'next/server';
import {
  getHardStopReason,
  getUrlAllowlistDecision,
  requiresSoftConfirmation
} from '../../_lib/guardrails';
import { missingMigrationResponse, requireApiUser, safeTableMissing } from '../../_lib/supabase-admin';
import { getActionCapability, isApprovalRequestable } from '../../_lib/v2-capabilities';
import {
  mapApproval,
  normalizeActionType,
  normalizePayload,
  normalizeToolName,
  writeAudit
} from '../../_lib/v2-actions';

const approvalSelect = '*';

function normalizeRisk(value: unknown) {
  const risk = String(value || '').toLowerCase();
  return ['low', 'medium', 'high'].includes(risk) ? risk : 'low';
}

function isMissingColumn(error: { message?: string } | null) {
  return Boolean(error?.message && /column .* does not exist|Could not find .* column/i.test(error.message));
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

  const toolName = normalizeToolName(body.toolName ?? body.tool_name, actionType);
  const payload = normalizePayload(body.payload);
  const hardStopReason = getHardStopReason(actionType, payload);
  if (hardStopReason) {
    await writeAudit(auth, {
      actionType,
      toolName,
      status: 'blocked',
      message: `Approval request blocked by hard stop: ${hardStopReason}`,
      input: { actionType, payload },
      blockReason: hardStopReason
    });
    return NextResponse.json(
      { error: 'This action is blocked by non-overridable safety guardrails', blockReason: hardStopReason },
      { status: 403 }
    );
  }

  const capability = getActionCapability(actionType);
  if (!capability || !isApprovalRequestable(actionType)) {
    await writeAudit(auth, {
      actionType,
      toolName,
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

  const title = String(body.title || `${actionType} approval`).trim().slice(0, 140);
  const summary = String(body.summary || '').trim().slice(0, 700);
  if (!summary) return NextResponse.json({ error: 'Approval summary is required' }, { status: 400 });

  const nextPayload = { ...payload };
  let browserSessionId =
    typeof nextPayload.browser_session_id === 'string' ? nextPayload.browser_session_id : null;

  if ((actionType === 'browser_open' || actionType === 'browser_demo') && !browserSessionId) {
    browserSessionId = crypto.randomUUID();
  }
  if (browserSessionId) {
    nextPayload.browser_session_id = browserSessionId;
  }

  const urlDecision = actionType === 'browser_open' ? getUrlAllowlistDecision(nextPayload) : null;
  const needsSecondaryConfirmation =
    Boolean(urlDecision && !urlDecision.ok) || requiresSoftConfirmation(actionType, nextPayload);
  const warningMessage =
    urlDecision && !urlDecision.ok
      ? 'This domain is not on your trusted list. Do you really want to navigate here?'
      : needsSecondaryConfirmation
        ? 'This action needs one extra confirmation before it can run.'
        : null;

  if (needsSecondaryConfirmation) {
    nextPayload.requires_user_confirmation = true;
    nextPayload.user_confirmation_state = 'pending';
    nextPayload.warning_message = warningMessage;
  }

  if (urlDecision && !urlDecision.ok) {
    await writeAudit(auth, {
      actionType,
      toolName,
      status: 'blocked',
      message: 'Browser navigation approval marked for untrusted URL confirmation',
      input: { url: urlDecision.rawUrl, hostname: urlDecision.hostname },
      blockReason: urlDecision.reason || 'suspicious_url'
    });
  }

  const sessionStartsAfterApproval = actionType === 'browser_open' || actionType === 'browser_demo';
  const approvalBrowserSessionId = sessionStartsAfterApproval ? null : browserSessionId;
  const insertPayload = { ...nextPayload };
  if (sessionStartsAfterApproval) {
    delete insertPayload.browser_session_id;
  }

  const insertRow = {
    user_id: auth.user.id,
    action_type: actionType,
    tool_name: toolName,
    status: 'requested',
    title,
    summary,
    payload: insertPayload,
    risk_level: normalizeRisk(body.riskLevel ?? body.risk_level),
    browser_session_id: approvalBrowserSessionId,
    requires_user_confirmation: needsSecondaryConfirmation,
    user_confirmation_state: needsSecondaryConfirmation ? 'pending' : 'not_required',
    warning_message: warningMessage
  };

  let { data, error } = await auth.supabase
    .from('action_approvals')
    .insert(insertRow)
    .select(approvalSelect)
    .single();

  if (isMissingColumn(error)) {
    const {
      browser_session_id,
      requires_user_confirmation,
      user_confirmation_state,
      warning_message,
      ...legacyInsertRow
    } = insertRow;
    const retry = await auth.supabase
      .from('action_approvals')
      .insert({ ...legacyInsertRow, payload: sessionStartsAfterApproval ? insertPayload : nextPayload })
      .select(approvalSelect)
      .single();
    data = retry.data;
    error = retry.error;
  }

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

  const { data: existing, error: readError } = await auth.supabase
    .from('action_approvals')
    .select(approvalSelect)
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .eq('status', 'requested')
    .maybeSingle();

  if (readError) {
    if (safeTableMissing(readError)) return missingMigrationResponse('v2-actions', 'action_approvals');
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }
  if (!existing) return NextResponse.json({ error: 'Requested approval not found' }, { status: 404 });

  const requiresUserConfirmation = Boolean(existing.requires_user_confirmation || existing.payload?.requires_user_confirmation);
  const userConfirmationState = existing.user_confirmation_state || existing.payload?.user_confirmation_state || 'not_required';

  if (requiresUserConfirmation && userConfirmationState !== 'confirmed' && status === 'approved') {
    let update = await auth.supabase
      .from('action_approvals')
      .update({ user_confirmation_state: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .select(approvalSelect)
      .single();

    if (isMissingColumn(update.error)) {
      const nextPayload = {
        ...(existing.payload || {}),
        user_confirmation_state: 'confirmed'
      };
      update = await auth.supabase
        .from('action_approvals')
        .update({ payload: nextPayload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', auth.user.id)
        .select(approvalSelect)
        .single();
    }

    if (update.error) {
      if (safeTableMissing(update.error)) return missingMigrationResponse('v2-actions', 'action_approvals');
      return NextResponse.json({ error: update.error.message }, { status: 500 });
    }

    await writeAudit(auth, {
      approvalId: id,
      browserSessionId: existing.browser_session_id || existing.payload?.browser_session_id || null,
      actionType: existing.action_type,
      toolName: existing.tool_name || existing.action_type,
      status: 'approved',
      message: 'User confirmed the extra warning prompt for this action',
      blockReason: 'untrusted_url_user_confirmed',
      input: { warningMessage: existing.warning_message || existing.payload?.warning_message || null }
    });

    return NextResponse.json({
      approval: mapApproval(update.data),
      secondaryConfirmationComplete: true,
      message: 'Extra confirmation captured. Approve again to run this action.'
    });
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
