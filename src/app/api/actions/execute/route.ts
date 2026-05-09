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
import {
  approvePreparedJobApplication,
  isJobAction,
  listJobWorkflowState,
  prepareJobApplication,
  saveJobSearch
} from '../../_lib/job-workflows';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  if (request.nextUrl.searchParams.get('browser_sessions') === 'active') {
    const result = await listBrowserSessions(auth, 'active');
    if ('error' in result && result.error) return result.error instanceof Response ? result.error : NextResponse.json({ error: result.error.message }, { status: 500 });
    return NextResponse.json({ browserSessions: 'sessions' in result ? result.sessions : [] });
  }

  if (request.nextUrl.searchParams.get('job_state') === '1') {
    const result = await listJobWorkflowState(auth);
    if ('error' in result && result.error) return result.error instanceof Response ? result.error : NextResponse.json({ error: result.error.message }, { status: 500 });
    return NextResponse.json(result);
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

async function handleJobAction(
  auth: ApiUserContext,
  actionType: string,
  toolName: string,
  body: Record<string, any>
) {
  if (!isJobAction(actionType)) {
    return null;
  }

  const capability = getActionCapability(actionType);
  const control = getActionCapability('browser_control');
  if (!capability || capability.status !== 'active' || !control || control.status !== 'active') {
    await writeAudit(auth, {
      actionType,
      toolName,
      status: 'blocked',
      message: 'Job workflow blocked because the capability or browser_control container is locked',
      input: { actionType },
      result: {
        capabilityStatus: capability?.status || 'missing',
        browserControlStatus: control?.status || 'missing',
        requirements: capability?.requirements || []
      }
    });
    return NextResponse.json(
      {
        error: 'Job workflow is locked until browser_control and this job capability are active',
        executed: false,
        capability,
        browserControl: control
      },
      { status: 501 }
    );
  }

  const approvalId = String(body.approvalId ?? body.approval_id ?? '').trim();
  const approvalCheck = await requireApprovedAction(auth, approvalId, actionType);
  if (approvalCheck.error) return approvalCheck.error;

  const payload = normalizePayload(body.payload);
  try {
    if (actionType === 'job_search_save') {
      const saved = await saveJobSearch(auth, approvalId, payload);
      if ('error' in saved && saved.error) return saved.error instanceof Response ? saved.error : NextResponse.json({ error: saved.error.message }, { status: 500 });
      if ('blocked' in saved && saved.blocked) {
        await writeAudit(auth, {
          approvalId,
          browserSessionId: null,
          actionType,
          toolName,
          status: 'blocked',
          message: saved.blocked,
          input: payload
        });
        return NextResponse.json({ error: saved.blocked, executed: false }, { status: saved.status || 400 });
      }
      if (!('listings' in saved)) return NextResponse.json({ error: 'Job listings could not be saved', executed: false }, { status: 500 });
      await writeAudit(auth, {
        approvalId,
        browserSessionId: saved.browserSessionId,
        actionType,
        toolName,
        status: 'completed',
        message: `Saved ${saved.listings.length} job listing${saved.listings.length === 1 ? '' : 's'} from approved extraction`,
        input: { sourcePlatform: payload.sourcePlatform || payload.source_platform || payload.platform, listingCount: Array.isArray(payload.listings) ? payload.listings.length : 0 },
        result: { listings: saved.listings, performedExternalAction: false }
      });
      await completeApproval(auth, approvalId, true);
      return NextResponse.json({ executed: true, listings: saved.listings, performedExternalAction: false });
    }

    if (actionType === 'job_application_prepare') {
      const prepared = await prepareJobApplication(auth, approvalId, payload);
      if ('error' in prepared && prepared.error) return prepared.error instanceof Response ? prepared.error : NextResponse.json({ error: prepared.error.message }, { status: 500 });
      if ('blocked' in prepared && prepared.blocked) {
        await writeAudit(auth, {
          approvalId,
          actionType,
          toolName,
          status: 'blocked',
          message: prepared.blocked,
          input: payload
        });
        return NextResponse.json({ error: prepared.blocked, executed: false }, { status: prepared.status || 400 });
      }
      if (!('review' in prepared)) return NextResponse.json({ error: 'Job application review could not be prepared', executed: false }, { status: 500 });
      await writeAudit(auth, {
        approvalId,
        browserSessionId: prepared.review.browserSessionId,
        actionType,
        toolName,
        status: 'completed',
        message: 'Prepared job application review card',
        input: { jobListingId: payload.jobListingId || payload.job_listing_id },
        result: { review: prepared.review, reviewCard: prepared.reviewCard, performedExternalAction: false }
      });
      await completeApproval(auth, approvalId, true);
      return NextResponse.json({ executed: true, review: prepared.review, reviewCard: prepared.reviewCard, performedExternalAction: false });
    }

    if (actionType === 'job_application_submit_approved') {
      const approved = await approvePreparedJobApplication(auth, approvalId, payload);
      if ('error' in approved && approved.error) return approved.error instanceof Response ? approved.error : NextResponse.json({ error: approved.error.message }, { status: 500 });
      if ('blocked' in approved && approved.blocked) {
        await writeAudit(auth, {
          approvalId,
          actionType,
          toolName,
          status: 'blocked',
          message: approved.blocked,
          input: payload
        });
        return NextResponse.json({ error: approved.blocked, executed: false }, { status: approved.status || 400 });
      }
      if (!('review' in approved)) return NextResponse.json({ error: 'Prepared job application could not be approved', executed: false }, { status: 500 });
      await writeAudit(auth, {
        approvalId,
        browserSessionId: approved.review.browserSessionId,
        actionType,
        toolName,
        status: 'completed',
        message: 'Approved prepared job application package; no external auto-submit was performed',
        input: { reviewId: payload.reviewId || payload.review_id },
        result: { review: approved.review, performedExternalSubmission: false }
      });
      await completeApproval(auth, approvalId, true);
      return NextResponse.json({ executed: true, review: approved.review, performedExternalSubmission: false });
    }

    return null;
  } catch (error) {
    await completeApproval(auth, approvalId, false);
    await writeAudit(auth, {
      approvalId,
      actionType,
      toolName,
      status: 'failed',
      message: error instanceof Error ? error.message : 'Job workflow failed',
      input: payload
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Job workflow failed', executed: false }, { status: 400 });
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

  const jobResponse = await handleJobAction(auth, actionType, toolName, body);
  if (jobResponse) return jobResponse;

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
