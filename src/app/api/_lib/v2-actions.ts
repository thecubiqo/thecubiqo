import { NextResponse } from 'next/server';
import { ApiUserContext, missingMigrationResponse, safeTableMissing } from './supabase-admin';
import { ACTION_TYPES, FOUNDATION_ACTION_TYPES } from './v2-capabilities';

export { ACTION_TYPES, FOUNDATION_ACTION_TYPES };

export type ActionStatus = 'requested' | 'approved' | 'denied' | 'cancelled' | 'expired' | 'completed' | 'failed';

export function normalizeActionType(value: unknown) {
  const actionType = String(value || '').trim();
  return ACTION_TYPES.includes(actionType) ? actionType : null;
}

export function normalizeFoundationActionType(value: unknown) {
  const actionType = normalizeActionType(value);
  return actionType && FOUNDATION_ACTION_TYPES.includes(actionType) ? actionType : null;
}

export function normalizeToolName(value: unknown, fallback = 'cubiqo_v2') {
  return String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 80) || fallback;
}

export function normalizePayload(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function mapApproval(row: Record<string, any>) {
  return {
    id: row.id,
    actionType: row.action_type,
    toolName: row.tool_name,
    status: row.status,
    title: row.title,
    summary: row.summary,
    payload: row.payload || {},
    browserSessionId: row.browser_session_id || row.payload?.browser_session_id || null,
    requiresUserConfirmation: Boolean(row.requires_user_confirmation || row.payload?.requires_user_confirmation),
    userConfirmationState: row.user_confirmation_state || row.payload?.user_confirmation_state || 'not_required',
    warningMessage: row.warning_message || row.payload?.warning_message || null,
    riskLevel: row.risk_level,
    expiresAt: row.expires_at,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapAudit(row: Record<string, any>) {
  return {
    id: row.id,
    approvalId: row.approval_id,
    browserSessionId: row.browser_session_id,
    actionType: row.action_type,
    toolName: row.tool_name,
    status: row.status,
    message: row.message,
    input: row.input || {},
    result: row.result || {},
    accessibilityTreeSnapshot: row.accessibility_tree_snapshot || null,
    blockReason: row.block_reason || null,
    screenshotUrl: row.screenshot_url || row.result?.screenshotUrl || row.result?.screenshot_url || null,
    createdAt: row.created_at
  };
}

export async function writeAudit(
  auth: ApiUserContext,
  input: {
    approvalId?: string | null;
    browserSessionId?: string | null;
    actionType: string;
    toolName: string;
    status: 'requested' | 'approved' | 'denied' | 'cancelled' | 'blocked' | 'completed' | 'failed';
    message: string;
    input?: Record<string, unknown>;
    result?: Record<string, unknown>;
    accessibilityTreeSnapshot?: Record<string, unknown> | unknown[] | string | null;
    blockReason?: string | null;
    screenshotUrl?: string | null;
  }
) {
  const auditRow = {
    user_id: auth.user.id,
    approval_id: input.approvalId || null,
    ...(input.browserSessionId !== undefined ? { browser_session_id: input.browserSessionId || null } : {}),
    action_type: input.actionType,
    tool_name: input.toolName,
    status: input.status,
    message: input.message.slice(0, 500),
    input: input.input || {},
    result: input.result || {},
    ...(input.accessibilityTreeSnapshot !== undefined
      ? { accessibility_tree_snapshot: input.accessibilityTreeSnapshot }
      : {}),
    ...(input.blockReason !== undefined ? { block_reason: input.blockReason } : {}),
    ...(input.screenshotUrl !== undefined ? { screenshot_url: input.screenshotUrl } : {})
  };

  const { error } = await auth.supabase.from('action_audit_logs').insert(auditRow);
  if (error && /column .* does not exist|Could not find .* column/i.test(error.message)) {
    const { accessibility_tree_snapshot, block_reason, screenshot_url, ...legacyAuditRow } = auditRow;
    return auth.supabase.from('action_audit_logs').insert(legacyAuditRow);
  }

  return { error };
}

export async function requireApprovedAction(
  auth: ApiUserContext,
  approvalId: string,
  actionType: string
) {
  if (!approvalId) {
    await writeAudit(auth, {
      actionType,
      toolName: actionType,
      status: 'blocked',
      message: 'Action blocked because approval_id was missing',
      blockReason: 'no_approval_record'
    });
    return {
      error: NextResponse.json(
        { error: 'Approval is required before this action can run', approvalRequired: true },
        { status: 403 }
      )
    };
  }

  const { data, error } = await auth.supabase
    .from('action_approvals')
    .select('*')
    .eq('id', approvalId)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (error) {
    if (safeTableMissing(error)) {
      return { error: missingMigrationResponse('v2-actions', 'action_approvals') };
    }
    return { error: NextResponse.json({ error: error.message }, { status: 500 }) };
  }

  if (!data || data.action_type !== actionType || data.status !== 'approved') {
    await writeAudit(auth, {
      approvalId,
      actionType,
      toolName: actionType,
      status: 'blocked',
      message: 'Action blocked because approval was missing, mismatched, or not approved',
      blockReason: !data ? 'no_approval_record' : 'approval_not_approved',
      result: { approvalStatus: data?.status || null, approvalActionType: data?.action_type || null }
    });
    return {
      error: NextResponse.json(
        { error: 'Approved action request not found for this operation', approvalRequired: true },
        { status: 403 }
      )
    };
  }

  const requiresUserConfirmation = Boolean(data.requires_user_confirmation || data.payload?.requires_user_confirmation);
  const userConfirmationState = data.user_confirmation_state || data.payload?.user_confirmation_state || 'not_required';
  if (requiresUserConfirmation && userConfirmationState !== 'confirmed') {
    await writeAudit(auth, {
      approvalId,
      actionType,
      toolName: data.tool_name || actionType,
      status: 'blocked',
      message: 'Action blocked because the extra user confirmation was not completed',
      blockReason: 'missing_secondary_confirmation',
      result: {
        userConfirmationState,
        warningMessage: data.warning_message || data.payload?.warning_message || null
      }
    });
    return {
      error: NextResponse.json(
        { error: 'Secondary user confirmation is required before this action can run', approvalRequired: true },
        { status: 403 }
      )
    };
  }

  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    await auth.supabase
      .from('action_approvals')
      .update({ status: 'expired', decided_at: new Date().toISOString() })
      .eq('id', approvalId)
      .eq('user_id', auth.user.id);
    await writeAudit(auth, {
      approvalId,
      actionType,
      toolName: data.tool_name || actionType,
      status: 'blocked',
      message: 'Action blocked because approval expired'
    });
    return {
      error: NextResponse.json({ error: 'Approval expired', approvalRequired: true }, { status: 403 })
    };
  }

  return { approval: data };
}

export async function completeApproval(auth: ApiUserContext, approvalId: string, success = true) {
  if (!approvalId) return;
  await auth.supabase
    .from('action_approvals')
    .update({
      status: success ? 'completed' : 'failed',
      decided_at: new Date().toISOString()
    })
    .eq('id', approvalId)
    .eq('user_id', auth.user.id);
}
