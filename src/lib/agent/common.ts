import type { ApiUserContext } from '@/next/app/api/_lib/supabase-admin';

export type AgentAuth = ApiUserContext;

export function slugTitle(value: string) {
  return value.trim().replace(/\s+/g, ' ').slice(0, 120) || 'Untitled Duo project';
}

export function inferDomainFromText(value: string) {
  const text = value.toLowerCase();
  if (/\b(shopify|store|ecommerce|commerce|printify|pod|product|amazon)\b/.test(text)) return 'ecommerce';
  if (/\b(job|career|resume|cv|interview|application)\b/.test(text)) return 'career';
  if (/\b(marketing|content|social|linkedin|campaign|brand)\b/.test(text)) return 'marketing';
  if (/\b(sales|lead|crm|pipeline|outreach)\b/.test(text)) return 'sales';
  if (/\b(code|repo|bug|build|deploy|test|github)\b/.test(text)) return 'software';
  return 'general';
}

export function normalizeTraceId(value?: string | null) {
  return value || crypto.randomUUID();
}

export async function writeTimeline(
  auth: AgentAuth,
  input: {
    projectId: string;
    traceId: string;
    eventType: string;
    message: string;
    taskId?: string | null;
    payload?: Record<string, unknown>;
    apiCostGbp?: number;
  }
) {
  // NOTE: duo_timeline_events has NO `summary` column (see migration
  // 20260514000000). Writing one made PostgREST reject every insert silently,
  // wiping the durable activity/audit trail. Columns below all exist; we also
  // capture the error so future schema drift surfaces instead of vanishing.
  const { error: timelineError } = await auth.supabase.from('duo_timeline_events').insert({
    project_id: input.projectId,
    user_id: auth.user.id,
    task_id: input.taskId || null,
    trace_id: input.traceId,
    event_type: input.eventType,
    message: input.message,
    description: input.message,
    payload: input.payload || {},
    metadata: input.payload || {},
    api_cost_gbp: input.apiCostGbp || 0
  });
  if (timelineError) {
    console.warn('[writeTimeline] duo_timeline_events insert failed:', timelineError.message);
  }

  await auth.supabase.from('stream_events').insert({
    project_id: input.projectId,
    trace_id: input.traceId,
    event_type: input.eventType,
    payload: {
      message: input.message,
      ...(input.payload || {})
    }
  });
}

export async function writeToolCall(
  auth: AgentAuth,
  input: {
    projectId: string;
    taskId?: string | null;
    traceId: string;
    toolName: string;
    route?: string | null;
    status: 'started' | 'completed' | 'failed' | 'blocked' | 'skipped';
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    error?: string | null;
    apiCostGbp?: number;
  }
) {
  await auth.supabase.from('agent_tool_calls').insert({
    user_id: auth.user.id,
    project_id: input.projectId,
    task_id: input.taskId || null,
    trace_id: input.traceId,
    tool_name: input.toolName,
    route_used: input.route || 'manual',
    attempt_number: 1,
    status: input.status,
    input: input.input || {},
    output: input.output || {},
    failure_reason: input.error || null,
    fallback_tool: null,
    evidence: input.output || {},
    api_cost_gbp: input.apiCostGbp || 0,
    completed_at: input.status === 'started' ? null : new Date().toISOString()
  });
}

export async function recordBudgetEvent(
  auth: AgentAuth,
  input: {
    projectId?: string | null;
    taskId?: string | null;
    traceId?: string | null;
    eventType: string;
    amountGbp?: number;
    reason?: string;
    metadata?: Record<string, unknown>;
  }
) {
  // budget_events real schema (migration 20260514000000): user_id, project_id,
  // task_id, trace_id, event_type (NOT NULL), amount_gbp, reason, metadata.
  // The previous insert used provider/tool_name/cost_gbp (which don't exist) and
  // omitted the NOT NULL event_type, so every spend-ledger write was silently
  // rejected. This is the audit trail behind cost-spike alerting — it must land.
  const { error } = await auth.supabase.from('budget_events').insert({
    user_id: auth.user.id,
    project_id: input.projectId || null,
    task_id: input.taskId || null,
    trace_id: input.traceId || null,
    event_type: input.eventType,
    amount_gbp: input.amountGbp || 0,
    reason: input.reason || null,
    metadata: input.metadata || {},
  });
  if (error) {
    console.warn('[recordBudgetEvent] budget_events insert failed:', error.message);
  }
}
