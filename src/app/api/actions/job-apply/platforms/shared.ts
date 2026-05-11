import { accessibilitySnapshot, act as stagehandAct, screenshot as stagehandScreenshot } from '../../../_lib/stagehand-client';
import type { ApiUserContext } from '../../../_lib/supabase-admin';
import { writeAudit } from '../../../_lib/v2-actions';

export type JobApplyPlatform = 'linkedin' | 'indeed' | 'dice' | 'greenhouse' | 'lever' | 'company_site';

export type JobApplyScriptInput = {
  auth: ApiUserContext;
  browser_session_id: string;
  jobUrl: string;
  platform: JobApplyPlatform;
  profileData?: Record<string, unknown>;
};

export type JobApplyScriptResult = {
  status: 'ready_to_submit';
  screenshot: string;
  storagePath?: string;
  message: string;
};

export async function auditedAct(input: JobApplyScriptInput, action: string) {
  try {
    return await stagehandAct({
      browser_session_id: input.browser_session_id,
      action
    });
  } catch (error) {
    let snapshot: unknown = null;
    try {
      snapshot = await accessibilitySnapshot(input.browser_session_id);
    } catch {
      snapshot = null;
    }
    await writeAudit(input.auth, {
      browserSessionId: input.browser_session_id,
      actionType: 'job_apply_act_failed',
      toolName: 'job_apply',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Job apply browser action failed',
      input: {
        platform: input.platform,
        jobUrl: input.jobUrl,
        action
      },
      accessibilityTreeSnapshot: snapshot as Record<string, unknown> | string | null
    });
    throw error;
  }
}

export async function captureReviewReceipt(input: JobApplyScriptInput) {
  const receipt = await stagehandScreenshot({
    auth: input.auth,
    browser_session_id: input.browser_session_id
  });
  return {
    screenshot: receipt.signed_url,
    storagePath: receipt.storage_path
  };
}

export function profileInstruction(profileData: Record<string, unknown> | undefined) {
  const profile = profileData && Object.keys(profileData).length
    ? JSON.stringify(profileData).slice(0, 1800)
    : 'No saved profile data was provided. Do not invent answers; stop and surface missing fields.';

  return `Use this approved profile data only: ${profile}. Do not invent salary, legal, demographic, eligibility, or custom essay answers. Stop at fields that need the user's judgment.`;
}
