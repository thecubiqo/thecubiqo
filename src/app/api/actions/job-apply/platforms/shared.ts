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
  stepReceipts?: JobApplyStepReceipt[];
  userInputPrompts?: JobApplyUserInputPrompt[];
};

export type JobApplyStepReceipt = {
  stepId: string;
  label: string;
  screenshotUrl: string;
  storagePath?: string;
  completedAt: string;
};

export type JobApplyUserInputPrompt = {
  field: string;
  reason: string;
  requiredBeforeSubmit: boolean;
};

function safeProfileText(profileData: Record<string, unknown> | undefined) {
  return profileData && Object.keys(profileData).length ? JSON.stringify(profileData).toLowerCase() : '';
}

export function buildUserInputPrompts(input: JobApplyScriptInput, extra: JobApplyUserInputPrompt[] = []) {
  const profile = safeProfileText(input.profileData);
  const prompts: JobApplyUserInputPrompt[] = [];
  if (!profile.includes('email') && !profile.includes('phone')) {
    prompts.push({
      field: 'Contact details',
      reason: 'Application forms commonly require email and phone. CubiQo will not invent contact details.',
      requiredBeforeSubmit: true
    });
  }
  if (!profile.includes('resume')) {
    prompts.push({
      field: 'Resume version',
      reason: 'A selected resume version is needed before a complete application can be reviewed.',
      requiredBeforeSubmit: true
    });
  }
  prompts.push(
    {
      field: 'Salary expectation',
      reason: 'Salary fields are user decisions and must be confirmed by the user for each role.',
      requiredBeforeSubmit: true
    },
    {
      field: 'Work authorization',
      reason: 'Eligibility and sponsorship answers are legal/identity-sensitive and must come from the user.',
      requiredBeforeSubmit: true
    },
    {
      field: 'Custom essay questions',
      reason: 'Long-form or employer-specific answers require user confirmation before final submit.',
      requiredBeforeSubmit: true
    }
  );

  const seen = new Set<string>();
  return [...prompts, ...extra].filter(prompt => {
    const key = prompt.field.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

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

export async function auditedBrowserStep(
  input: JobApplyScriptInput,
  step: {
    stepId: string;
    label: string;
    action: string;
    userInputPrompts?: JobApplyUserInputPrompt[];
  }
): Promise<JobApplyStepReceipt> {
  await auditedAct(input, step.action);
  const receipt = await captureReviewReceipt(input);
  const completedAt = new Date().toISOString();
  await writeAudit(input.auth, {
    browserSessionId: input.browser_session_id,
    actionType: 'job_apply_step_receipt',
    toolName: 'job_apply',
    status: 'completed',
    message: step.label,
    input: {
      platform: input.platform,
      jobUrl: input.jobUrl,
      stepId: step.stepId,
      action: step.action
    },
    result: {
      stepId: step.stepId,
      label: step.label,
      userInputPrompts: step.userInputPrompts || []
    },
    screenshotUrl: receipt.screenshot
  });

  return {
    stepId: step.stepId,
    label: step.label,
    screenshotUrl: receipt.screenshot,
    storagePath: receipt.storagePath,
    completedAt
  };
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
