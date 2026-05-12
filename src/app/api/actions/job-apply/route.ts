import { NextRequest, NextResponse } from 'next/server';
import { getUrlAllowlistDecision } from '../../_lib/guardrails';
import { closeBrowserSession, createBrowserSession, normalizeBrowserSessionId } from '../../_lib/browser-sessions';
import { getActionCapability } from '../../_lib/v2-capabilities';
import { type ApiUserContext, missingMigrationResponse, requireApiUser, safeTableMissing } from '../../_lib/supabase-admin';
import { completeApproval, normalizePayload, requireApprovedAction, writeAudit } from '../../_lib/v2-actions';
import { applyAts } from './platforms/ats';
import { applyDice } from './platforms/dice';
import { applyGenericCompanySite } from './platforms/generic';
import { applyIndeed } from './platforms/indeed';
import { applyLinkedIn } from './platforms/linkedin';
import type { JobApplyPlatform, JobApplyScriptInput, JobApplyScriptResult } from './platforms/shared';
import { buildJobApplicationHandoffChecklist } from '@/next/lib/jobs/application-handoff';
import {
  getApplyProviders,
  getJobProvider,
  resolveJobProviderForUrl,
  type JobProvider,
  type JobProviderAdapter,
  type JobProviderId
} from '@/next/lib/jobs/job-provider-registry';

export const runtime = 'nodejs';

function normalizeText(value: unknown, max = 500) {
  return String(value || '').trim().slice(0, max);
}

function normalizeJobUrl(value: unknown) {
  const raw = normalizeText(value, 1400);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function detectProvider(inputPlatform: unknown, jobUrl: string): JobProvider | null {
  const requested = normalizeText(inputPlatform, 40).toLowerCase();
  const requestedProvider = getJobProvider(requested);
  if (requestedProvider) return requestedProvider;
  return resolveJobProviderForUrl(jobUrl) || getJobProvider('company_site');
}

function envFlag(name: string) {
  return ['1', 'true', 'yes', 'on', 'enabled', 'active'].includes(String(process.env[name] || '').trim().toLowerCase());
}

function getPlatformFlag(platform: JobApplyPlatform) {
  const envName = `JOB_APPLY_${platform.toUpperCase()}_ENABLED`;
  const enabled = envFlag(envName);
  return {
    platform,
    envName,
    enabled,
    code: `${platform}_apply_enabled`
  };
}

async function insertApplication(
  auth: ApiUserContext,
  input: {
    approvalId: string;
    browserSessionId: string;
    platform: JobApplyPlatform;
    jobUrl: string;
    jobTitle?: string | null;
    company?: string | null;
  }
) {
  const { data, error } = await auth.supabase
    .from('job_applications')
    .insert({
      user_id: auth.user.id,
      approval_id: input.approvalId,
      browser_session_id: input.browserSessionId,
      platform: input.platform,
      job_url: input.jobUrl,
      job_title: input.jobTitle || null,
      company: input.company || null,
      status: 'in_progress',
      metadata: {
        stop_before_submit: true,
        final_submit_requires_user_button: true
      }
    })
    .select('id,approval_id,browser_session_id,platform,job_url,job_title,company,status,screenshot_url,accessibility_tree_snapshot,error,metadata,created_at,updated_at,submitted_at,cancelled_at')
    .single();

  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('job-apply', 'job_applications') };
    return { error };
  }

  return { application: data };
}

async function updateApplication(
  auth: ApiUserContext,
  applicationId: string,
  values: Record<string, unknown>
) {
  const { data, error } = await auth.supabase
    .from('job_applications')
    .update(values)
    .eq('id', applicationId)
    .eq('user_id', auth.user.id)
    .select('id,approval_id,browser_session_id,platform,job_url,job_title,company,status,screenshot_url,accessibility_tree_snapshot,error,metadata,created_at,updated_at,submitted_at,cancelled_at')
    .single();
  return { data, error };
}

type JobApplyAdapter = (input: JobApplyScriptInput) => Promise<JobApplyScriptResult>;

const JOB_APPLY_PROVIDER_ADAPTERS: Partial<Record<JobProviderId, JobApplyAdapter>> = {
  linkedin: applyLinkedIn,
  indeed: applyIndeed,
  dice: applyDice,
  greenhouse: applyAts,
  lever: applyAts,
  company_site: applyGenericCompanySite,
};

const JOB_APPLY_MODE_ADAPTERS: Partial<Record<JobProviderAdapter, JobApplyAdapter>> = {
  ats: applyAts,
  generic_browser: applyGenericCompanySite,
};

function resolveJobApplyAdapter(provider: JobProvider): JobApplyAdapter | null {
  return JOB_APPLY_PROVIDER_ADAPTERS[provider.id] ?? JOB_APPLY_MODE_ADAPTERS[provider.adapter] ?? null;
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const capability = getActionCapability('job_apply');
  const browserControl = getActionCapability('browser_control');
  if (!capability || capability.status !== 'active' || !browserControl || browserControl.status !== 'active') {
    await writeAudit(auth, {
      actionType: 'job_apply',
      toolName: 'job_apply',
      status: 'blocked',
      message: 'job_apply blocked because capability or browser_control is not active',
      result: {
        jobApplyStatus: capability?.status || 'missing',
        browserControlStatus: browserControl?.status || 'missing'
      }
    });
    return NextResponse.json({ error: 'job_apply is not active', capability, browserControl }, { status: 501 });
  }

  const body = await request.json().catch(() => ({}));
  const approvalId = normalizeText(body.approvalId ?? body.approval_id, 80);
  const approvalCheck = await requireApprovedAction(auth, approvalId, 'job_apply');
  if (approvalCheck.error) return approvalCheck.error;

  const approval = approvalCheck.approval;
  const approvalPayload = normalizePayload(approval?.payload);
  const requestPayload = normalizePayload(body.payload);
  const payload = {
    ...approvalPayload,
    ...requestPayload,
    ...body
  };
  const jobUrl = normalizeJobUrl(payload.job_url ?? payload.jobUrl ?? payload.url);
  const browserSessionId = normalizeBrowserSessionId(payload.browser_session_id ?? payload.browserSessionId);
  const approvedBrowserSessionId = normalizeBrowserSessionId(approval?.browser_session_id ?? approvalPayload.browser_session_id);

  if (!jobUrl || !browserSessionId || !approvedBrowserSessionId) {
    await writeAudit(auth, {
      approvalId,
      browserSessionId: browserSessionId || null,
      actionType: 'job_apply',
      toolName: 'job_apply',
      status: 'blocked',
      message: 'job_apply blocked because job_url or browser_session_id was missing',
      blockReason: 'no_approval_record'
    });
    return NextResponse.json({ error: 'job_url and browser_session_id are required', executed: false }, { status: 400 });
  }

  if (browserSessionId !== approvedBrowserSessionId) {
    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType: 'job_apply',
      toolName: 'job_apply',
      status: 'blocked',
      message: 'job_apply blocked because browser_session_id did not match the approval record',
      input: { browserSessionId, approvedBrowserSessionId },
      blockReason: 'session_hijack_attempt'
    });
    return NextResponse.json({ error: 'Browser session approval mismatch', executed: false, blockReason: 'session_hijack_attempt' }, { status: 403 });
  }

  const provider = detectProvider(payload.platform, jobUrl);
  if (!provider) {
    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType: 'job_apply',
      toolName: 'job_apply',
      status: 'blocked',
      message: 'job_apply blocked because platform could not be detected',
      input: { jobUrl, platform: payload.platform },
      blockReason: 'unsupported_job_platform'
    });
    return NextResponse.json({
      error: `Supported apply platforms are ${getApplyProviders().map(item => item.label).join(', ')}. Unknown employer career-site URLs route through Company Site when the user confirms the domain warning.`,
      executed: false,
      supportedProviders: getApplyProviders().map(item => item.id)
    }, { status: 400 });
  }

  if (!provider.supportsApply) {
    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType: 'job_apply',
      toolName: 'job_apply',
      status: 'blocked',
      message: 'job_apply blocked because provider is registered but apply support is not active yet',
      input: {
        jobUrl,
        provider: provider.id,
        adapter: provider.adapter,
        supportsGenericForm: provider.supportsGenericForm
      },
      blockReason: 'job_provider_apply_not_active'
    });
    return NextResponse.json({
      error: `${provider.label} is registered for scanning, but apply automation is not active for this provider yet.`,
      executed: false,
      provider
    }, { status: 501 });
  }

  const platformAdapter = resolveJobApplyAdapter(provider);
  if (!platformAdapter) {
    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType: 'job_apply',
      toolName: 'job_apply',
      status: 'failed',
      message: 'job_apply blocked because no adapter is registered for this provider',
      input: {
        provider: provider.id,
        adapter: provider.adapter,
        jobUrl,
      },
    });
    return NextResponse.json({
      error: 'platform_adapter_missing',
      hint: `${provider.label} is known, but no apply adapter is registered yet.`,
      provider,
    }, { status: 501 });
  }

  const platform = provider.id as JobApplyPlatform;
  const handoffChecklist = buildJobApplicationHandoffChecklist({
    jobUrl,
    platform,
    jobTitle: payload.job_title ?? payload.jobTitle,
    company: payload.company,
    profileData: normalizePayload(payload.profileData ?? payload.profile_data)
  });

  const urlDecision = getUrlAllowlistDecision({ job_url: jobUrl });
  const untrustedUrlConfirmed = Boolean(
    (approval?.requires_user_confirmation || approvalPayload.requires_user_confirmation) &&
      (approval?.user_confirmation_state || approvalPayload.user_confirmation_state) === 'confirmed'
  );
  if (!urlDecision.ok && !untrustedUrlConfirmed) {
    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType: 'job_apply',
      toolName: 'job_apply',
      status: 'blocked',
      message: 'job_apply blocked because the job URL is not allowlisted',
      input: { url: urlDecision.rawUrl, hostname: urlDecision.hostname },
      blockReason: urlDecision.reason || 'suspicious_url'
    });
    return NextResponse.json({
      error: 'This domain is not on your trusted list. Confirm the warning approval before navigating there.',
      requiresUserConfirmation: true,
      blockReason: urlDecision.reason || 'suspicious_url',
      executed: false
    }, { status: 403 });
  }

  const platformFlag = getPlatformFlag(platform);
  if (!platformFlag.enabled) {
    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType: 'job_apply',
      toolName: 'job_apply',
      status: 'blocked',
      message: `${platform} job apply is disabled by platform flag`,
      input: { platform, jobUrl },
      blockReason: 'platform_not_enabled',
      result: platformFlag
    });
    return NextResponse.json({ error: `${platform} apply is not enabled`, executed: false, blockReason: 'platform_not_enabled', platformFlag }, { status: 403 });
  }

  const inserted = await insertApplication(auth, {
    approvalId,
    browserSessionId,
    platform,
    jobUrl,
    jobTitle: normalizeText(payload.job_title ?? payload.jobTitle, 220),
    company: normalizeText(payload.company, 220)
  });
  if ('error' in inserted && inserted.error) {
    return inserted.error instanceof Response ? inserted.error : NextResponse.json({ error: inserted.error.message }, { status: 500 });
  }
  if (!('application' in inserted)) {
    return NextResponse.json({ error: 'job_applications row could not be created', executed: false }, { status: 500 });
  }
  const application = inserted.application;

  try {
    const opened = await createBrowserSession(auth, approvalId, {
      url: jobUrl,
      browser_session_id: browserSessionId,
      session_mode: 'persistent'
    });
    if ('error' in opened && opened.error) throw opened.error instanceof Error ? opened.error : new Error('Browser session could not be opened');
    if (!('session' in opened)) throw new Error('Browser session could not be opened');

    const result = await platformAdapter({
      auth,
      browser_session_id: browserSessionId,
      jobUrl,
      platform,
      profileData: normalizePayload(payload.profileData ?? payload.profile_data)
    });

    const updated = await updateApplication(auth, application.id, {
      status: result.status,
      screenshot_url: result.screenshot,
      metadata: {
        ...(application.metadata || {}),
        platform_flag: platformFlag,
        handoff_checklist: handoffChecklist,
        step_receipts: result.stepReceipts || [],
        user_input_prompts: result.userInputPrompts || [],
        review_storage_path: result.storagePath || null,
        ready_message: result.message,
        stop_before_submit: true
      }
    });
    if (updated.error) throw updated.error;

    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType: 'job_apply_ready_to_submit',
      toolName: 'job_apply',
      status: 'completed',
      message: result.message,
      input: { platform, jobUrl },
      result: {
        application: updated.data,
        screenshotUrl: result.screenshot,
        handoffChecklist,
        stepReceipts: result.stepReceipts || [],
        userInputPrompts: result.userInputPrompts || [],
        finalSubmitAutonomous: false
      },
      screenshotUrl: result.screenshot
    });
    await completeApproval(auth, approvalId, true);

    return NextResponse.json({
      executed: true,
      status: 'ready_to_submit',
      application: updated.data,
      browserSessionId,
      screenshotUrl: result.screenshot,
      handoffChecklist,
      stepReceipts: result.stepReceipts || [],
      userInputPrompts: result.userInputPrompts || [],
      message: result.message,
      finalSubmitAutonomous: false
    });
  } catch (error) {
    let snapshot: unknown = null;
    try {
      const { accessibilitySnapshot } = await import('../../_lib/stagehand-client');
      snapshot = await accessibilitySnapshot(browserSessionId);
    } catch {
      snapshot = null;
    }
    const message = error instanceof Error ? error.message : 'job_apply failed';
    await updateApplication(auth, application.id, {
      status: 'failed',
      error: message,
      accessibility_tree_snapshot: snapshot || null
    });
    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType: 'job_apply_failed',
      toolName: 'job_apply',
      status: 'failed',
      message,
      input: { platform, jobUrl },
      accessibilityTreeSnapshot: snapshot as Record<string, unknown> | string | null
    });
    await completeApproval(auth, approvalId, false);
    await closeBrowserSession(auth, browserSessionId, { status: 'failed', reason: 'job_apply_failed' }).catch(() => null);
    return NextResponse.json({ error: message, executed: false, applicationId: application.id }, { status: 500 });
  }
}
