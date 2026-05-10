import { NextRequest, NextResponse } from 'next/server';
import { getUrlAllowlistDecision } from '../../_lib/guardrails';
import {
  closeBrowserSession,
  createBrowserSession,
  recordBrowserAction
} from '../../_lib/browser-sessions';
import {
  type ApiUserContext,
  missingMigrationResponse,
  requireApiUser,
  safeTableMissing
} from '../../_lib/supabase-admin';
import {
  completeApproval,
  mapApproval,
  normalizePayload,
  requireApprovedAction,
  writeAudit
} from '../../_lib/v2-actions';

export const runtime = 'nodejs';

const DEMO_URL = 'https://example.com';

function isMissingColumn(error: { message?: string } | null) {
  return Boolean(error?.message && /column .* does not exist|Could not find .* column/i.test(error.message));
}

async function createDemoApproval(auth: ApiUserContext) {
  const browserSessionId = crypto.randomUUID();
  const payload = {
    url: DEMO_URL,
    session_mode: 'disposable'
  };
  const insertRow = {
    user_id: auth.user.id,
    action_type: 'browser_demo',
    tool_name: 'browser_demo',
    status: 'requested',
    title: 'Run safe browser demo',
    summary: 'Open example.com, extract the title and first paragraph, capture a signed screenshot receipt, then close the session.',
    payload,
    risk_level: 'low',
    browser_session_id: browserSessionId,
    requires_user_confirmation: false,
    user_confirmation_state: 'not_required',
    warning_message: null
  };

  let { data, error } = await auth.supabase
    .from('action_approvals')
    .insert(insertRow)
    .select('*')
    .single();

  if (isMissingColumn(error)) {
    const {
      browser_session_id,
      requires_user_confirmation,
      user_confirmation_state,
      warning_message,
      ...legacyInsertRow
    } = insertRow;
    const retry = await auth.supabase.from('action_approvals').insert(legacyInsertRow).select('*').single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('v2-actions', 'action_approvals') };
    return { error };
  }

  return { approval: mapApproval(data) };
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const approvalId = String(body.approvalId ?? body.approval_id ?? '').trim();

  if (!approvalId) {
    const created = await createDemoApproval(auth);
    if ('error' in created && created.error) {
      return created.error instanceof Response
        ? created.error
        : NextResponse.json({ error: created.error.message }, { status: 500 });
    }
    return NextResponse.json({
      approvalRequired: true,
      approval: created.approval
    }, { status: 202 });
  }

  const approvalCheck = await requireApprovedAction(auth, approvalId, 'browser_demo');
  if (approvalCheck.error) return approvalCheck.error;

  const approval = approvalCheck.approval;
  const payload: Record<string, unknown> = {
    ...normalizePayload(approval?.payload),
    url: DEMO_URL,
    session_mode: 'disposable'
  };
  const browserSessionId = String(approval?.browser_session_id || payload.browser_session_id || '').trim();
  if (!browserSessionId) {
    await writeAudit(auth, {
      approvalId,
      actionType: 'browser_demo',
      toolName: 'browser_demo',
      status: 'blocked',
      message: 'Browser demo blocked because the approval has no browser_session_id',
      blockReason: 'no_approval_record'
    });
    return NextResponse.json({ error: 'browser_session_id is required on the approval record' }, { status: 403 });
  }
  payload.browser_session_id = browserSessionId;

  const allowlist = getUrlAllowlistDecision(payload);
  if (!allowlist.ok) {
    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType: 'browser_demo',
      toolName: 'browser_demo',
      status: 'blocked',
      message: 'Browser demo blocked because example.com allowlist validation failed',
      blockReason: allowlist.reason || 'suspicious_url',
      input: { url: allowlist.rawUrl, hostname: allowlist.hostname }
    });
    return NextResponse.json({ error: 'Browser demo URL failed allowlist validation' }, { status: 403 });
  }

  try {
    const opened = await createBrowserSession(auth, approvalId, payload);
    if ('error' in opened && opened.error) {
      return opened.error instanceof Response
        ? opened.error
        : NextResponse.json({ error: opened.error.message }, { status: 500 });
    }
    if (!('session' in opened)) {
      return NextResponse.json({ error: 'Browser session could not be opened' }, { status: 500 });
    }

    const extracted = await recordBrowserAction(auth, browserSessionId, 'browser_extract', {
      instruction: 'Extract the page title and first paragraph from this page.'
    });
    if ('error' in extracted && extracted.error) {
      return extracted.error instanceof Response
        ? extracted.error
        : NextResponse.json({ error: extracted.error.message }, { status: 500 });
    }
    if ('blocked' in extracted && extracted.blocked) {
      return NextResponse.json({ error: extracted.blocked, code: extracted.code }, { status: 409 });
    }

    const receipt = await recordBrowserAction(auth, browserSessionId, 'browser_screenshot', {
      description: 'Capture visual receipt after extracting example.com content.'
    });
    if ('error' in receipt && receipt.error) {
      return receipt.error instanceof Response
        ? receipt.error
        : NextResponse.json({ error: receipt.error.message }, { status: 500 });
    }
    if ('blocked' in receipt && receipt.blocked) {
      return NextResponse.json({ error: receipt.blocked, code: receipt.code }, { status: 409 });
    }

    const screenshotUrl = 'action' in receipt && typeof receipt.action.screenshotUrl === 'string'
      ? receipt.action.screenshotUrl
      : null;
    const extractedContent = 'action' in extracted ? extracted.action.extractedContent : null;

    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType: 'browser_demo',
      toolName: 'browser_demo',
      status: 'completed',
      message: 'Safe Stagehand browser demo completed',
      input: { url: DEMO_URL },
      result: {
        extractedContent,
        screenshotUrl,
        performedExternalBrowserAction: true
      },
      screenshotUrl
    });

    const closed = await closeBrowserSession(auth, browserSessionId, { status: 'closed', reason: 'session_closed' });
    await completeApproval(auth, approvalId, true);

    return NextResponse.json({
      executed: true,
      browserSessionId,
      extractedContent,
      screenshotUrl,
      browserSession: 'session' in closed ? closed.session : null
    });
  } catch (error) {
    await completeApproval(auth, approvalId, false);
    await closeBrowserSession(auth, browserSessionId, { status: 'failed', reason: 'session_failed' }).catch(() => null);
    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType: 'browser_demo',
      toolName: 'browser_demo',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Browser demo failed',
      input: { url: DEMO_URL }
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Browser demo failed' }, { status: 500 });
  }
}
