import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, type ApiUserContext } from '../../_lib/supabase-admin';
import { getActionCapability } from '../../_lib/v2-capabilities';
import { completeApproval, normalizeActionType, normalizePayload, normalizeToolName, requireApprovedAction, writeAudit } from '../../_lib/v2-actions';
import {
  closeBrowserSession,
  createBrowserSession,
  isBrowserAction,
  listBrowserSessions,
  normalizeBrowserPayload,
  normalizeBrowserSessionId,
  recordBrowserAction
} from '../../_lib/browser-sessions';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  if (request.nextUrl.searchParams.get('browser_sessions') === 'active') {
    const result = await listBrowserSessions(auth, 'active');
    if ('error' in result && result.error) return result.error instanceof Response ? result.error : NextResponse.json({ error: result.error.message }, { status: 500 });
    return NextResponse.json({ browserSessions: 'sessions' in result ? result.sessions : [] });
  }

  return NextResponse.json({ error: 'Unsupported execute query' }, { status: 400 });
}

async function handleBrowserAction(
  auth: ApiUserContext,
  actionType: string,
  toolName: string,
  body: Record<string, any>
) {
  const control = getActionCapability('browser_control');
  if (!control || control.status !== 'active') {
    await writeAudit(auth, {
      actionType,
      toolName,
      status: 'blocked',
      message: 'Browser action blocked because browser_control is not unlocked',
      input: { actionType },
      result: { capabilityStatus: control?.status || 'missing' }
    });
    return NextResponse.json({ error: 'browser_control is not unlocked', executed: false, capability: control }, { status: 501 });
  }

  const browserSessionId = normalizeBrowserSessionId(body.browserSessionId ?? body.browser_session_id ?? body.payload?.browserSessionId ?? body.payload?.browser_session_id);
  if (actionType === 'browser_close') {
    if (!browserSessionId) {
      await writeAudit(auth, {
        actionType,
        toolName,
        status: 'blocked',
        message: 'Browser close blocked because browser_session_id was missing',
        input: { actionType }
      });
      return NextResponse.json({ error: 'browser_session_id is required', executed: false }, { status: 400 });
    }
    const closed = await closeBrowserSession(auth, browserSessionId);
    if ('error' in closed && closed.error) return closed.error instanceof Response ? closed.error : NextResponse.json({ error: closed.error.message }, { status: 500 });
    if ('blocked' in closed && closed.blocked) {
      await writeAudit(auth, {
        actionType,
        toolName,
        browserSessionId,
        status: 'blocked',
        message: closed.blocked
      });
      return NextResponse.json({ error: closed.blocked, executed: false }, { status: 404 });
    }
    if (!('session' in closed)) return NextResponse.json({ error: 'Browser session could not be stopped', executed: false }, { status: 500 });
    await writeAudit(auth, {
      approvalId: closed.session.approvalId,
      browserSessionId,
      actionType,
      toolName,
      status: 'cancelled',
      message: 'Browser session stopped by user',
      input: { browserSessionId },
      result: { session: closed.session }
    });
    return NextResponse.json({ executed: true, browserSession: closed.session });
  }

  if (!isBrowserAction(actionType)) {
    return null;
  }

  const approvalId = String(body.approvalId ?? body.approval_id ?? '').trim();
  const approvalCheck = await requireApprovedAction(auth, approvalId, actionType);
  if (approvalCheck.error) return approvalCheck.error;

  const payload = normalizeBrowserPayload(body.payload);
  try {
    if (actionType === 'browser_open') {
      const opened = await createBrowserSession(auth, approvalId, payload);
      if ('error' in opened && opened.error) return opened.error instanceof Response ? opened.error : NextResponse.json({ error: opened.error.message }, { status: 500 });
      if (!('session' in opened)) return NextResponse.json({ error: 'Browser session could not be opened', executed: false }, { status: 500 });
      await writeAudit(auth, {
        approvalId,
        browserSessionId: opened.session.id,
        actionType,
        toolName,
        status: 'completed',
        message: 'Browser session container opened',
        input: { url: opened.session.targetUrl },
        result: { session: opened.session, performedExternalBrowserAction: false }
      });
      await completeApproval(auth, approvalId, true);
      return NextResponse.json({ executed: true, browserSession: opened.session, performedExternalBrowserAction: false });
    }

    if (!browserSessionId) {
      await writeAudit(auth, {
        approvalId,
        actionType,
        toolName,
        status: 'blocked',
        message: 'Browser action blocked because browser_session_id was missing',
        input: { actionType }
      });
      return NextResponse.json({ error: 'browser_session_id is required', executed: false }, { status: 400 });
    }

    const recorded = await recordBrowserAction(auth, browserSessionId, actionType, payload);
    if ('error' in recorded && recorded.error) return recorded.error instanceof Response ? recorded.error : NextResponse.json({ error: recorded.error.message }, { status: 500 });
    if ('blocked' in recorded && recorded.blocked) {
      await writeAudit(auth, {
        approvalId,
        browserSessionId,
        actionType,
        toolName,
        status: 'blocked',
        message: recorded.blocked
      });
      return NextResponse.json({ error: recorded.blocked, executed: false }, { status: 404 });
    }
    if (!('session' in recorded) || !('action' in recorded)) return NextResponse.json({ error: 'Browser action could not be recorded', executed: false }, { status: 500 });

    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType,
      toolName,
      status: 'completed',
      message: 'Browser action recorded in isolated session container',
      input: normalizePayload(body.payload),
      result: recorded.action
    });
    await completeApproval(auth, approvalId, true);
    return NextResponse.json({ executed: true, browserSession: recorded.session, action: recorded.action });
  } catch (error) {
    await completeApproval(auth, approvalId, false);
    await writeAudit(auth, {
      approvalId,
      browserSessionId: browserSessionId || null,
      actionType,
      toolName,
      status: 'failed',
      message: error instanceof Error ? error.message : 'Browser action failed'
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Browser action failed', executed: false }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const actionType = normalizeActionType(body.actionType ?? body.action_type);
  if (!actionType) {
    return NextResponse.json({ error: 'Valid actionType is required' }, { status: 400 });
  }

  const capability = getActionCapability(actionType);
  const toolName = normalizeToolName(body.toolName ?? body.tool_name, actionType);

  const browserResponse = await handleBrowserAction(auth, actionType, toolName, body);
  if (browserResponse) return browserResponse;

  if (!capability) {
    await writeAudit(auth, {
      actionType,
      toolName,
      status: 'blocked',
      message: 'Unknown V2 action was blocked',
      input: { actionType }
    });
    return NextResponse.json({ error: 'Unknown V2 action', executed: false }, { status: 400 });
  }

  if (capability.status !== 'active') {
    await writeAudit(auth, {
      actionType,
      toolName,
      status: 'blocked',
      message: 'V2 action blocked because capability is not end-to-end enabled',
      input: { actionType, payloadPreview: body.payload || {} },
      result: {
        capabilityStatus: capability.status,
        requirements: capability.requirements
      }
    });
    return NextResponse.json(
      {
        error: 'This V2 capability is not end-to-end enabled yet',
        executed: false,
        capability
      },
      { status: 501 }
    );
  }

  await writeAudit(auth, {
    actionType,
    toolName,
    status: 'blocked',
    message: 'Use the dedicated active endpoint for this V2 action',
    input: { actionType },
    result: { endpoint: capability.endpoint }
  });

  return NextResponse.json(
    {
      error: 'Use the dedicated endpoint for this active action',
      executed: false,
      endpoint: capability.endpoint,
      capability
    },
    { status: 409 }
  );
}
