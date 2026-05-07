import { NextResponse } from 'next/server';
import { ApiUserContext, missingMigrationResponse, safeTableMissing } from './supabase-admin';

export const ACTION_TYPES = [
  'approval_request',
  'approval_status',
  'action_audit_log',
  'task_write',
  'cron_schedule_create',
  'daily_report_send',
  'self_report_create',
  'job_profile_write',
  'job_search_save',
  'job_application_prepare',
  'job_application_submit_approved',
  'resume_version_write',
  'pod_design_brief_create',
  'gfxtools_job_create',
  'shopify_connector_status',
  'printify_connector_status',
  'social_post_prepare',
  'social_post_schedule_approved',
  'camera_permission_check',
  'camera_context_read',
  'diagnostics_run'
] as const;

export const FOUNDATION_ACTION_TYPES = [
  'task_write',
  'cron_schedule_create',
  'daily_report_send',
  'self_report_create'
] as const;

export type ActionStatus = 'requested' | 'approved' | 'denied' | 'cancelled' | 'expired' | 'completed' | 'failed';

export function normalizeActionType(value: unknown) {
  const actionType = String(value || '').trim();
  return ACTION_TYPES.includes(actionType as (typeof ACTION_TYPES)[number]) ? actionType : null;
}

export function normalizeFoundationActionType(value: unknown) {
  const actionType = normalizeActionType(value);
  return FOUNDATION_ACTION_TYPES.includes(actionType as (typeof FOUNDATION_ACTION_TYPES)[number]) ? actionType : null;
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
    actionType: row.action_type,
    toolName: row.tool_name,
    status: row.status,
    message: row.message,
    input: row.input || {},
    result: row.result || {},
    createdAt: row.created_at
  };
}

export async function writeAudit(
  auth: ApiUserContext,
  input: {
    approvalId?: string | null;
    actionType: string;
    toolName: string;
    status: 'requested' | 'approved' | 'denied' | 'cancelled' | 'blocked' | 'completed' | 'failed';
    message: string;
    input?: Record<string, unknown>;
    result?: Record<string, unknown>;
  }
) {
  const { error } = await auth.supabase.from('action_audit_logs').insert({
    user_id: auth.user.id,
    approval_id: input.approvalId || null,
    action_type: input.actionType,
    tool_name: input.toolName,
    status: input.status,
    message: input.message.slice(0, 500),
    input: input.input || {},
    result: input.result || {}
  });

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
      message: 'Action blocked because approval_id was missing'
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
    .select('id,action_type,tool_name,status,expires_at')
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
      result: { approvalStatus: data?.status || null, approvalActionType: data?.action_type || null }
    });
    return {
      error: NextResponse.json(
        { error: 'Approved action request not found for this operation', approvalRequired: true },
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
