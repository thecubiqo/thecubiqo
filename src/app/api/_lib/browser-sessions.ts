import { ApiUserContext, missingMigrationResponse, safeTableMissing } from './supabase-admin';

export const BROWSER_ACTION_TYPES = [
  'browser_open',
  'browser_click',
  'browser_type',
  'browser_extract',
  'browser_screenshot'
] as const;

export type BrowserActionType = typeof BROWSER_ACTION_TYPES[number];

export function isBrowserAction(actionType: string): actionType is BrowserActionType {
  return BROWSER_ACTION_TYPES.includes(actionType as BrowserActionType);
}

export function normalizeBrowserSessionId(value: unknown) {
  return String(value || '').trim();
}

export function normalizeBrowserPayload(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function sanitizeUrl(value: unknown) {
  const raw = String(value || '').trim();
  if (!raw) throw new Error('A browser URL is required');
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Browser sessions only allow http or https URLs');
  }
  return {
    url: url.toString(),
    origin: url.origin
  };
}

export function mapBrowserSession(row: Record<string, any>) {
  return {
    id: row.id,
    approvalId: row.approval_id,
    status: row.status,
    targetUrl: row.target_url,
    currentUrl: row.current_url,
    allowedOrigin: row.allowed_origin,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    lastActivityAt: row.last_activity_at,
    metadata: row.metadata || {}
  };
}

type BrowserSession = ReturnType<typeof mapBrowserSession>;
type BrowserErrorResult = { error: Response | Error };
type BrowserBlockedResult = { blocked: string };

export async function listBrowserSessions(auth: ApiUserContext, status = 'active'): Promise<{ sessions: BrowserSession[] } | BrowserErrorResult> {
  const { data, error } = await auth.supabase
    .from('browser_sessions')
    .select('id,approval_id,status,target_url,current_url,allowed_origin,started_at,ended_at,last_activity_at,metadata')
    .eq('user_id', auth.user.id)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('browser-control', 'browser_sessions') };
    return { error };
  }

  return { sessions: (data || []).map(mapBrowserSession) };
}

export async function createBrowserSession(
  auth: ApiUserContext,
  approvalId: string,
  payload: Record<string, unknown>
): Promise<{ session: BrowserSession } | BrowserErrorResult> {
  const target = sanitizeUrl(payload.url || payload.targetUrl || payload.target_url);
  const metadata = {
    runtime: 'foundation',
    isolation: 'user-session',
    note: 'Browser runtime is approval-gated. This foundation records the container before a visible browser engine attaches.',
    requested_action: 'browser_open'
  };

  const { data, error } = await auth.supabase
    .from('browser_sessions')
    .insert({
      user_id: auth.user.id,
      approval_id: approvalId,
      status: 'active',
      target_url: target.url,
      current_url: target.url,
      allowed_origin: target.origin,
      metadata
    })
    .select('id,approval_id,status,target_url,current_url,allowed_origin,started_at,ended_at,last_activity_at,metadata')
    .single();

  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('browser-control', 'browser_sessions') };
    return { error };
  }

  return { session: mapBrowserSession(data) };
}

export async function getActiveBrowserSession(
  auth: ApiUserContext,
  browserSessionId: string
): Promise<{ session: BrowserSession } | BrowserErrorResult | BrowserBlockedResult> {
  const { data, error } = await auth.supabase
    .from('browser_sessions')
    .select('id,approval_id,status,target_url,current_url,allowed_origin,started_at,ended_at,last_activity_at,metadata')
    .eq('id', browserSessionId)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('browser-control', 'browser_sessions') };
    return { error };
  }

  if (!data || data.status !== 'active') {
    return { blocked: 'Active browser session not found' };
  }

  return { session: mapBrowserSession(data) };
}

export async function recordBrowserAction(
  auth: ApiUserContext,
  browserSessionId: string,
  actionType: BrowserActionType,
  payload: Record<string, unknown>
): Promise<{ session: BrowserSession; action: Record<string, unknown> } | BrowserErrorResult | BrowserBlockedResult> {
  const sessionResult = await getActiveBrowserSession(auth, browserSessionId);
  if (!('session' in sessionResult)) return sessionResult;
  const session = sessionResult.session;
  const actionPayload = normalizeBrowserPayload(payload);
  const now = new Date().toISOString();
  const lastActions = Array.isArray(session.metadata.last_actions) ? session.metadata.last_actions : [];
  const nextAction = {
    actionType,
    at: now,
    selector: String(actionPayload.selector || '').slice(0, 180) || null,
    description: String(actionPayload.description || actionPayload.intent || '').slice(0, 240) || null
  };

  const { data, error } = await auth.supabase
    .from('browser_sessions')
    .update({
      last_activity_at: now,
      metadata: {
        ...session.metadata,
        last_action: nextAction,
        last_actions: [...lastActions.slice(-9), nextAction]
      }
    })
    .eq('id', browserSessionId)
    .eq('user_id', auth.user.id)
    .eq('status', 'active')
    .select('id,approval_id,status,target_url,current_url,allowed_origin,started_at,ended_at,last_activity_at,metadata')
    .maybeSingle();

  if (error) return { error };
  if (!data) return { blocked: 'Active browser session not found' };

  return {
    session: mapBrowserSession(data),
    action: {
      actionType,
      browserSessionId,
      executionMode: 'foundation_recorded',
      performedExternalBrowserAction: false,
      message: 'Browser action was approval-gated and recorded in the isolated session container. A visible browser runtime can attach to this foundation later.'
    }
  };
}

export async function closeBrowserSession(
  auth: ApiUserContext,
  browserSessionId: string
): Promise<{ session: BrowserSession } | BrowserErrorResult | BrowserBlockedResult> {
  const now = new Date().toISOString();
  const { data, error } = await auth.supabase
    .from('browser_sessions')
    .update({
      status: 'cancelled',
      ended_at: now,
      last_activity_at: now
    })
    .eq('id', browserSessionId)
    .eq('user_id', auth.user.id)
    .in('status', ['active', 'closing'])
    .select('id,approval_id,status,target_url,current_url,allowed_origin,started_at,ended_at,last_activity_at,metadata')
    .maybeSingle();

  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('browser-control', 'browser_sessions') };
    return { error };
  }

  if (!data) return { blocked: 'Active browser session not found' };
  return { session: mapBrowserSession(data) };
}
