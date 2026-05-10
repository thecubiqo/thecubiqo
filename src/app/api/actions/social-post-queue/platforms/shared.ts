import { accessibilitySnapshot, act as stagehandAct, screenshot as stagehandScreenshot } from '../../../_lib/stagehand-client';
import type { ApiUserContext } from '../../../_lib/supabase-admin';
import { writeAudit } from '../../../_lib/v2-actions';

export type SocialQueuePlatform = 'linkedin' | 'x' | 'twitter' | 'instagram' | 'threads';

export type SocialQueueScriptInput = {
  auth: ApiUserContext;
  browser_session_id: string;
  platform: SocialQueuePlatform;
  content: string;
  mediaUrls: string[];
};

export type SocialQueueScriptResult = {
  status: 'ready';
  screenshot: string;
  storagePath?: string;
  message: string;
};

export function canonicalPlatform(platform: SocialQueuePlatform): Exclude<SocialQueuePlatform, 'twitter'> {
  return platform === 'twitter' ? 'x' : platform;
}

export function platformStartUrl(platform: SocialQueuePlatform) {
  const canonical = canonicalPlatform(platform);
  if (canonical === 'linkedin') return 'https://www.linkedin.com/feed/';
  if (canonical === 'x') return 'https://x.com/compose/post';
  if (canonical === 'instagram') return 'https://www.instagram.com/';
  return 'https://www.threads.net/';
}

export async function auditedSocialAct(input: SocialQueueScriptInput, action: string) {
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
      actionType: 'social_post_act_failed',
      toolName: 'social_post_queue',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Social post browser action failed',
      input: {
        platform: input.platform,
        action
      },
      accessibilityTreeSnapshot: snapshot as Record<string, unknown> | string | null
    });
    throw error;
  }
}

export async function captureQueueReceipt(input: SocialQueueScriptInput) {
  const receipt = await stagehandScreenshot({
    auth: input.auth,
    browser_session_id: input.browser_session_id
  });
  return {
    screenshot: receipt.signed_url,
    storagePath: receipt.storage_path
  };
}

export async function publishComposedPost(input: SocialQueueScriptInput) {
  await auditedSocialAct(input, 'Click the final Post or Publish button now. This click is explicitly requested by the user.');
  return captureQueueReceipt(input);
}
