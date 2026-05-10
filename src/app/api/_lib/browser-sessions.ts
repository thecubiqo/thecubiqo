import { NextResponse } from 'next/server';
import {
  accessibilitySnapshot,
  act as stagehandAct,
  closeSession as closeStagehandSession,
  extract as stagehandExtract,
  openSession as openStagehandSession,
  screenshot as stagehandScreenshot,
  type BrowserSessionMode
} from './stagehand-client';
import { ApiUserContext, missingMigrationResponse, safeTableMissing } from './supabase-admin';
import { writeAudit } from './v2-actions';

export const BROWSER_ACTION_TYPES = [
  'browser_open',
  'browser_click',
  'browser_type',
  'browser_extract',
  'browser_screenshot',
  'browser_act'
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

function normalizeSessionMode(value: unknown): BrowserSessionMode {
  return value === 'persistent' ? 'persistent' : 'disposable';
}

function isMissingColumn(error: { message?: string } | null) {
  return Boolean(error?.message && /column .* does not exist|Could not find .* column/i.test(error.message));
}

function minutesSince(value: string | null | undefined) {
  if (!value) return 0;
  const at = new Date(value).getTime();
  if (!Number.isFinite(at)) return 0;
  return (Date.now() - at) / 60000;
}

export function mapBrowserSession(row: Record<string, any>) {
  return {
    id: row.id,
    approvalId: row.approval_id,
    status: row.status,
    sessionMode: row.session_mode || row.metadata?.session_mode || 'disposable',
    targetUrl: row.target_url,
    currentUrl: row.current_url,
    allowedOrigin: row.allowed_origin,
    providerSessionId: row.provider_session_id || row.metadata?.provider_session_id || null,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    expiredAt: row.expired_at || null,
    lastActivityAt: row.last_active_at || row.last_activity_at,
    metadata: row.metadata || {}
  };
}

type BrowserSession = ReturnType<typeof mapBrowserSession>;
type BrowserErrorResult = { error: Response | Error };
type BrowserBlockedResult = { blocked: string; code?: string };

async function updateSessionRow(
  auth: ApiUserContext,
  browserSessionId: string,
  values: Record<string, unknown>
) {
  const { data, error } = await auth.supabase
    .from('browser_sessions')
    .update(values)
    .eq('id', browserSessionId)
    .eq('user_id', auth.user.id)
    .select('*')
    .maybeSingle();

  if (!isMissingColumn(error)) return { data, error };

  const {
    session_mode,
    last_active_at,
    expired_at,
    provider_session_id,
    ...legacyValues
  } = values;
  return auth.supabase
    .from('browser_sessions')
    .update(legacyValues)
    .eq('id', browserSessionId)
    .eq('user_id', auth.user.id)
    .select('*')
    .maybeSingle();
}

export async function listBrowserSessions(
  auth: ApiUserContext,
  status = 'active'
): Promise<{ sessions: BrowserSession[] } | BrowserErrorResult> {
  const { data, error } = await auth.supabase
    .from('browser_sessions')
    .select('*')
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
  const sessionMode = normalizeSessionMode(payload.session_mode || payload.sessionMode);
  const browserSessionId =
    typeof payload.browser_session_id === 'string' && payload.browser_session_id.trim()
      ? payload.browser_session_id.trim()
      : crypto.randomUUID();

  const metadata = {
    runtime: 'stagehand_browserbase',
    isolation: 'user-session',
    session_mode: sessionMode,
    requested_action: 'browser_open'
  };

  const insertRow = {
    id: browserSessionId,
    user_id: auth.user.id,
    approval_id: approvalId,
    status: 'active',
    target_url: target.url,
    current_url: target.url,
    allowed_origin: target.origin,
    session_mode: sessionMode,
    last_active_at: new Date().toISOString(),
    metadata
  };

  let { data, error } = await auth.supabase
    .from('browser_sessions')
    .insert(insertRow)
    .select('*')
    .single();

  if (isMissingColumn(error)) {
    const { session_mode, last_active_at, ...legacyInsertRow } = insertRow;
    const retry = await auth.supabase.from('browser_sessions').insert(legacyInsertRow).select('*').single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('browser-control', 'browser_sessions') };
    return { error };
  }

  try {
    const opened = await openStagehandSession({
      browser_session_id: browserSessionId,
      sessionMode,
      url: target.url
    });
    const update = await updateSessionRow(auth, browserSessionId, {
      provider_session_id: opened.provider_session_id,
      last_active_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      metadata: {
        ...(data.metadata || metadata),
        provider_session_id: opened.provider_session_id,
        debug_url: opened.debug_url,
        opened_at: new Date().toISOString()
      }
    });
    if (update.error) return { error: update.error };
    return { session: mapBrowserSession(update.data || data) };
  } catch (error) {
    await updateSessionRow(auth, browserSessionId, {
      status: 'failed',
      ended_at: new Date().toISOString(),
      metadata: {
        ...(data.metadata || metadata),
        error: error instanceof Error ? error.message : String(error)
      }
    });
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}

export async function getActiveBrowserSession(
  auth: ApiUserContext,
  browserSessionId: string
): Promise<{ session: BrowserSession } | BrowserErrorResult | BrowserBlockedResult> {
  const { data, error } = await auth.supabase
    .from('browser_sessions')
    .select('*')
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

  const session = mapBrowserSession(data);
  const limit = session.sessionMode === 'persistent' ? 5 : 2;
  if (minutesSince(session.lastActivityAt) > limit) {
    await closeBrowserSession(auth, browserSessionId, {
      status: 'closed',
      reason: 'session_expired_heartbeat'
    });
    return {
      blocked: 'Browser session expired from inactivity',
      code: 'SESSION_EXPIRED'
    };
  }

  return { session };
}

function browserActionInstruction(actionType: BrowserActionType, payload: Record<string, unknown>) {
  if (actionType === 'browser_click') {
    return String(payload.action || payload.description || `click ${payload.selector || payload.label || 'the requested element'}`);
  }
  if (actionType === 'browser_type') {
    const text = String(payload.text || payload.value || '');
    const target = String(payload.selector || payload.field || payload.description || 'the requested field');
    return String(payload.action || `type "${text}" into ${target}`);
  }
  return String(payload.action || payload.description || payload.intent || '').trim();
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
    description: String(actionPayload.description || actionPayload.intent || actionPayload.action || '').slice(0, 240) || null
  };

  let actionResult: Record<string, unknown>;
  try {
    if (actionType === 'browser_extract') {
      const instruction = String(actionPayload.instruction || actionPayload.description || 'extract the key page content');
      actionResult = {
        extractedContent: await stagehandExtract({ browser_session_id: browserSessionId, instruction })
      };
    } else if (actionType === 'browser_screenshot') {
      const receipt = await stagehandScreenshot({ auth, browser_session_id: browserSessionId });
      actionResult = {
        screenshotUrl: receipt.signed_url,
        storagePath: receipt.storage_path
      };
    } else {
      const action = browserActionInstruction(actionType, actionPayload);
      if (!action) throw new Error('Browser action description is required');
      actionResult = {
        stagehandResult: await stagehandAct({ browser_session_id: browserSessionId, action })
      };
    }
  } catch (error) {
    let snapshot: unknown = null;
    try {
      snapshot = await accessibilitySnapshot(browserSessionId);
    } catch {
      snapshot = null;
    }
    await writeAudit(auth, {
      approvalId: session.approvalId,
      browserSessionId,
      actionType,
      toolName: actionType,
      status: 'failed',
      message: error instanceof Error ? error.message : String(error),
      input: actionPayload,
      accessibilityTreeSnapshot: (snapshot || null) as Record<string, unknown> | string | null
    });
    throw error;
  }

  const update = await updateSessionRow(auth, browserSessionId, {
    last_active_at: now,
    last_activity_at: now,
    metadata: {
      ...session.metadata,
      last_action: nextAction,
      last_actions: [...lastActions.slice(-9), nextAction]
    }
  });

  if (update.error) return { error: update.error };
  if (!update.data) return { blocked: 'Active browser session not found' };

  return {
    session: mapBrowserSession(update.data),
    action: {
      actionType,
      browserSessionId,
      executionMode: 'stagehand_browserbase',
      performedExternalBrowserAction: true,
      ...actionResult
    }
  };
}

export async function closeBrowserSession(
  auth: ApiUserContext,
  browserSessionId: string,
  options: {
    status?: 'cancelled' | 'closed' | 'failed';
    reason?: string;
    persistentMidAuth?: boolean;
  } = {}
): Promise<{ session: BrowserSession } | BrowserErrorResult | BrowserBlockedResult> {
  const now = new Date().toISOString();
  const reason = options.reason || (options.status === 'closed' ? 'session_closed' : 'session_cancelled');

  await closeStagehandSession({ browser_session_id: browserSessionId, force: true });

  const update = await updateSessionRow(auth, browserSessionId, {
    status: options.status || 'cancelled',
    ended_at: now,
    expired_at: reason === 'session_expired_heartbeat' ? now : null,
    last_active_at: now,
    last_activity_at: now
  });

  if (update.error) {
    if (safeTableMissing(update.error)) return { error: missingMigrationResponse('browser-control', 'browser_sessions') };
    return { error: update.error };
  }

  if (!update.data) return { blocked: 'Active browser session not found' };

  const session = mapBrowserSession(update.data);
  await writeAudit(auth, {
    approvalId: session.approvalId,
    browserSessionId,
    actionType: 'browser_close',
    toolName: 'browser_close',
    status: options.status === 'failed' ? 'failed' : 'completed',
    message: reason,
    result: { sessionStatus: session.status },
    blockReason: reason === 'session_expired_heartbeat' ? reason : null
  });

  if (options.persistentMidAuth) {
    await writeAudit(auth, {
      approvalId: session.approvalId,
      browserSessionId,
      actionType: 'browser_close',
      toolName: 'browser_close',
      status: 'cancelled',
      message: 'persistent_session_cancelled_mid_auth'
    });
  }

  return { session };
}

export function browserErrorResponse(error: Response | Error) {
  if (error instanceof Response) return error;
  return NextResponse.json({ error: error.message }, { status: 500 });
}
