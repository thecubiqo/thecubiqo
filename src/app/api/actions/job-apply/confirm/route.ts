import { NextRequest, NextResponse } from 'next/server';
import { closeBrowserSession, getActiveBrowserSession } from '../../../_lib/browser-sessions';
import { act as stagehandAct, accessibilitySnapshot, screenshot as stagehandScreenshot } from '../../../_lib/stagehand-client';
import { type ApiUserContext, requireApiUser, safeTableMissing, missingMigrationResponse } from '../../../_lib/supabase-admin';
import { writeAudit } from '../../../_lib/v2-actions';

export const runtime = 'nodejs';

function normalizeText(value: unknown, max = 500) {
  return String(value || '').trim().slice(0, max);
}

async function loadApplication(auth: ApiUserContext, applicationId: string) {
  const { data, error } = await auth.supabase
    .from('job_applications')
    .select('id,user_id,approval_id,browser_session_id,platform,job_url,job_title,company,status,screenshot_url,metadata')
    .eq('id', applicationId)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('job-apply', 'job_applications') };
    return { error };
  }
  if (!data) return { blocked: 'Job application not found', status: 404 };
  return { application: data };
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const applicationId = normalizeText(body.applicationId ?? body.application_id, 80);
  const decision = normalizeText(body.decision, 20).toLowerCase() || 'submit';
  if (!applicationId) return NextResponse.json({ error: 'application_id is required' }, { status: 400 });
  if (!['submit', 'cancel'].includes(decision)) return NextResponse.json({ error: 'decision must be submit or cancel' }, { status: 400 });

  const loaded = await loadApplication(auth, applicationId);
  if ('error' in loaded && loaded.error) {
    return loaded.error instanceof Response ? loaded.error : NextResponse.json({ error: loaded.error.message }, { status: 500 });
  }
  if (!('application' in loaded)) {
    return NextResponse.json({ error: loaded.blocked }, { status: loaded.status || 404 });
  }

  const application = loaded.application;
  const browserSessionId = application.browser_session_id;
  const approvalId = application.approval_id;

  if (decision === 'cancel') {
    await auth.supabase
      .from('job_applications')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', application.id)
      .eq('user_id', auth.user.id);
    await closeBrowserSession(auth, browserSessionId, { status: 'cancelled', reason: 'job_apply_cancelled' }).catch(() => null);
    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType: 'job_apply_cancelled',
      toolName: 'job_apply',
      status: 'cancelled',
      message: 'User cancelled the job application before final submit',
      input: { applicationId: application.id, platform: application.platform, jobUrl: application.job_url }
    });
    return NextResponse.json({ executed: true, status: 'cancelled', applicationId: application.id });
  }

  if (application.status !== 'ready_to_submit') {
    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType: 'job_apply_user_confirmed_submit',
      toolName: 'job_apply',
      status: 'blocked',
      message: `Final submit blocked because application is ${application.status}, not ready_to_submit`,
      blockReason: 'application_not_ready_to_submit',
      input: { applicationId: application.id }
    });
    return NextResponse.json({ error: 'Application is not ready to submit', status: application.status }, { status: 409 });
  }

  const session = await getActiveBrowserSession(auth, browserSessionId);
  if (!('session' in session)) {
    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType: 'job_apply_user_confirmed_submit',
      toolName: 'job_apply',
      status: 'blocked',
      message: 'Final submit blocked because browser session is not active',
      blockReason: 'SESSION_EXPIRED',
      input: { applicationId: application.id }
    });
    return NextResponse.json({ error: 'Browser session expired before final submit', code: 'SESSION_EXPIRED' }, { status: 409 });
  }

  try {
    await stagehandAct({
      browser_session_id: browserSessionId,
      action: 'Click the final Submit Application button now. This click is explicitly requested by the user.'
    });
    const receipt = await stagehandScreenshot({ auth, browser_session_id: browserSessionId });
    const now = new Date().toISOString();
    const { data, error } = await auth.supabase
      .from('job_applications')
      .update({
        status: 'submitted',
        submitted_at: now,
        screenshot_url: receipt.signed_url,
        metadata: {
          ...(application.metadata || {}),
          final_submit_user_confirmed_at: now,
          final_submit_storage_path: receipt.storage_path
        }
      })
      .eq('id', application.id)
      .eq('user_id', auth.user.id)
      .select('id,approval_id,browser_session_id,platform,job_url,job_title,company,status,screenshot_url,metadata,submitted_at')
      .single();
    if (error) throw error;

    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType: 'job_apply_user_confirmed_submit',
      toolName: 'job_apply',
      status: 'completed',
      message: 'User confirmed final job application submit',
      input: { applicationId: application.id, platform: application.platform, jobUrl: application.job_url },
      result: { application: data, screenshotUrl: receipt.signed_url },
      screenshotUrl: receipt.signed_url
    });
    await closeBrowserSession(auth, browserSessionId, { status: 'closed', reason: 'job_apply_submitted' });
    return NextResponse.json({ executed: true, status: 'submitted', application: data, screenshotUrl: receipt.signed_url });
  } catch (error) {
    let snapshot: unknown = null;
    try {
      snapshot = await accessibilitySnapshot(browserSessionId);
    } catch {
      snapshot = null;
    }
    const message = error instanceof Error ? error.message : 'Final submit failed';
    await auth.supabase
      .from('job_applications')
      .update({
        status: 'failed',
        error: message,
        accessibility_tree_snapshot: snapshot || null
      })
      .eq('id', application.id)
      .eq('user_id', auth.user.id);
    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType: 'job_apply_user_confirmed_submit',
      toolName: 'job_apply',
      status: 'failed',
      message,
      input: { applicationId: application.id },
      accessibilityTreeSnapshot: snapshot as Record<string, unknown> | string | null
    });
    await closeBrowserSession(auth, browserSessionId, { status: 'failed', reason: 'job_apply_submit_failed' }).catch(() => null);
    return NextResponse.json({ error: message, executed: false }, { status: 500 });
  }
}
