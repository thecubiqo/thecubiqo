import { NextRequest, NextResponse } from 'next/server';
import { closeBrowserSession, createBrowserSession } from '../../../_lib/browser-sessions';
import { getActionCapability } from '../../../_lib/v2-capabilities';
import { type ApiUserContext, missingMigrationResponse, requireApiUser, safeTableMissing } from '../../../_lib/supabase-admin';
import { normalizePayload, writeAudit } from '../../../_lib/v2-actions';
import { postViaSocialApi, socialApiCredentialStatus, type SocialApiPlatform } from '../../../_lib/social-api-client';
import {
  auditedSocialAct,
  canonicalPlatform,
  captureQueueReceipt,
  platformStartUrl,
  type SocialQueuePlatform
} from '../platforms/shared';
import { getSocialPlatform, normalizeSocialQueuePlatform } from '@/next/lib/social/social-platform-registry';

export const runtime = 'nodejs';

function normalizeText(value: unknown, max = 1000) {
  return String(value || '').trim().slice(0, max);
}

function normalizeMediaUrls(value: unknown) {
  const input = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];
  return input.map(item => normalizeText(item, 1600)).filter(Boolean).slice(0, 10);
}

function normalizePlatform(value: unknown): SocialQueuePlatform | null {
  return normalizeSocialQueuePlatform(value);
}

type CanonicalSocialQueuePlatform = Exclude<SocialQueuePlatform, 'twitter'>;
type PublishInstructionBuilder = (content: string) => string[];

const SOCIAL_PUBLISH_INSTRUCTIONS: Partial<Record<CanonicalSocialQueuePlatform, PublishInstructionBuilder>> = {
  linkedin: content => [
    'Click the Start a post button.',
    `Type this exact content into the LinkedIn post composer: ${content}`,
  ],
  instagram: content => [
    'Open the Instagram create post composer.',
    `Use the provided media URL and type this caption without publishing: ${content}`,
  ],
  threads: content => [
    'Open the Threads composer.',
    `Type this exact content into the Threads composer: ${content}`,
  ],
  x: content => [
    'Open the X/Twitter compose box.',
    `Type this exact content into the X/Twitter composer: ${content}`,
  ],
};

async function getConnectedSocialAccount(auth: ApiUserContext, platform: Exclude<SocialQueuePlatform, 'twitter'>) {
  const { data, error } = await auth.supabase
    .from('social_accounts')
    .select('id,platform,account_label,account_handle,status,connection_type,scopes,metadata,connected_at,last_used_at')
    .eq('user_id', auth.user.id)
    .eq('platform', platform)
    .eq('status', 'active')
    .order('connected_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('social-post-queue', 'social_accounts') };
    return { error };
  }
  return { account: data || null };
}

async function loadPost(auth: ApiUserContext, postId: string) {
  const { data, error } = await auth.supabase
    .from('social_posts')
    .select('id,user_id,approval_id,browser_session_id,platform,content,media_urls,status,preview_screenshot_url,published_url,accessibility_tree_snapshot,error,metadata,created_at,updated_at,published_at,cancelled_at')
    .eq('id', postId)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('social-post-queue', 'social_posts') };
    return { error };
  }
  if (!data) return { blocked: 'Queued social post not found', status: 404 };
  return { post: data };
}

async function updatePost(auth: ApiUserContext, postId: string, values: Record<string, unknown>) {
  const { data, error } = await auth.supabase
    .from('social_posts')
    .update(values)
    .eq('id', postId)
    .eq('user_id', auth.user.id)
    .select('id,approval_id,browser_session_id,platform,content,media_urls,status,preview_screenshot_url,published_url,accessibility_tree_snapshot,error,metadata,created_at,updated_at,published_at,cancelled_at')
    .single();
  return { data, error };
}

async function createPublishApproval(auth: ApiUserContext, post: Record<string, any>, browserSessionId: string) {
  const { data, error } = await auth.supabase
    .from('action_approvals')
    .insert({
      user_id: auth.user.id,
      action_type: 'social_post_queue',
      tool_name: 'social_post_queue',
      status: 'approved',
      title: 'User-confirmed social publish',
      summary: `User pressed Publish for the queued ${post.platform} post.`,
      payload: {
        social_post_id: post.id,
        user_publish_button_confirmed: true,
        autonomous_publish: false
      },
      risk_level: 'high',
      browser_session_id: browserSessionId,
      requires_user_confirmation: false,
      user_confirmation_state: 'not_required',
      decided_at: new Date().toISOString()
    })
    .select('*')
    .single();

  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('v2-actions', 'action_approvals') };
    return { error };
  }
  return { approval: data };
}

async function composeThenPublish(input: {
  auth: ApiUserContext;
  browser_session_id: string;
  platform: SocialQueuePlatform;
  content: string;
  mediaUrls: string[];
}) {
  const socialInput = {
    auth: input.auth,
    browser_session_id: input.browser_session_id,
    platform: input.platform,
    content: input.content,
    mediaUrls: input.mediaUrls
  };
  const canonical = canonicalPlatform(input.platform);
  const instructions = SOCIAL_PUBLISH_INSTRUCTIONS[canonical];

  if (!instructions) {
    throw new Error(`No social publish adapter registered for ${canonical}`);
  }

  for (const instruction of instructions(input.content)) {
    await auditedSocialAct(socialInput, instruction);
  }

  await auditedSocialAct(socialInput, 'Click the final Post or Publish button now. This click is explicitly requested by the user.');
  return captureQueueReceipt(socialInput);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const postId = normalizeText(body.postId ?? body.post_id, 80);
  const decision = normalizeText(body.decision, 20).toLowerCase() || 'publish';

  if (!postId) return NextResponse.json({ error: 'post_id is required' }, { status: 400 });
  if (!['publish', 'cancel'].includes(decision)) return NextResponse.json({ error: 'decision must be publish or cancel' }, { status: 400 });

  const loaded = await loadPost(auth, postId);
  if ('error' in loaded && loaded.error) {
    return loaded.error instanceof Response ? loaded.error : NextResponse.json({ error: loaded.error.message }, { status: 500 });
  }
  if (!('post' in loaded)) return NextResponse.json({ error: loaded.blocked }, { status: loaded.status || 404 });

  const post = loaded.post;
  const originalApprovalId = post.approval_id;
  const originalBrowserSessionId = post.browser_session_id;

  if (decision === 'cancel') {
    const now = new Date().toISOString();
    await updatePost(auth, post.id, { status: 'cancelled', cancelled_at: now });
    if (originalBrowserSessionId) {
      await closeBrowserSession(auth, originalBrowserSessionId, { status: 'cancelled', reason: 'social_post_cancelled' }).catch(() => null);
    }
    await writeAudit(auth, {
      approvalId: originalApprovalId,
      browserSessionId: originalBrowserSessionId,
      actionType: 'social_post_cancelled',
      toolName: 'social_post_queue',
      status: 'cancelled',
      message: 'User cancelled the queued social post before publish',
      input: { postId: post.id, platform: post.platform }
    });
    return NextResponse.json({ executed: true, status: 'cancelled', postId: post.id });
  }

  if (body.confirm !== 'user_confirmed_publish') {
    await writeAudit(auth, {
      approvalId: originalApprovalId,
      browserSessionId: originalBrowserSessionId,
      actionType: 'social_post_user_confirmed_publish',
      toolName: 'social_post_queue',
      status: 'blocked',
      message: 'Publish blocked because the explicit user confirmation token was missing',
      input: { postId: post.id },
      blockReason: 'publish_confirmation_required'
    });
    return NextResponse.json({ error: 'Explicit user publish confirmation is required', blockReason: 'publish_confirmation_required' }, { status: 403 });
  }

  if (post.status !== 'ready') {
    await writeAudit(auth, {
      approvalId: originalApprovalId,
      browserSessionId: originalBrowserSessionId,
      actionType: 'social_post_user_confirmed_publish',
      toolName: 'social_post_queue',
      status: 'blocked',
      message: `Publish blocked because post is ${post.status}, not ready`,
      input: { postId: post.id },
      blockReason: 'post_not_ready'
    });
    return NextResponse.json({ error: 'Post is not ready to publish', status: post.status }, { status: 409 });
  }

  const platform = normalizePlatform(post.platform);
  if (!platform) return NextResponse.json({ error: 'Queued post platform is invalid' }, { status: 400 });

  const canonical = canonicalPlatform(platform);
  const platformEntry = getSocialPlatform(canonical);
  const connected = await getConnectedSocialAccount(auth, canonical);
  if ('error' in connected && connected.error) {
    return connected.error instanceof Response ? connected.error : NextResponse.json({ error: connected.error.message }, { status: 500 });
  }
  if (!('account' in connected) || !connected.account || !platformEntry?.supportsQueue) {
    await writeAudit(auth, {
      approvalId: originalApprovalId,
      browserSessionId: originalBrowserSessionId,
      actionType: 'social_post_user_confirmed_publish',
      toolName: 'social_post_queue',
      status: 'blocked',
      message: `${platformEntry?.label || canonical} publish blocked because the user has not connected that platform`,
      input: { postId: post.id, platform: canonical },
      blockReason: platformEntry?.supportsQueue ? 'platform_not_connected' : 'platform_queue_not_supported'
    });
    return NextResponse.json({
      error: platformEntry?.supportsQueue ? 'platform_not_connected' : 'platform_queue_not_supported',
      message: platformEntry?.supportsQueue
        ? `Connect a ${platformEntry.label} account before publishing queued posts.`
        : `${platformEntry?.label || canonical} does not have a publish adapter yet.`,
      platform: canonical
    }, { status: 403 });
  }

  const capability = getActionCapability('social_post_queue');
  if (!capability || capability.status !== 'active') {
    return NextResponse.json({ error: 'social_post_queue is not active', capability }, { status: 501 });
  }

  const mediaUrls = normalizeMediaUrls(post.media_urls);
  if (canonicalPlatform(platform) === 'instagram' && !mediaUrls.length) {
    return NextResponse.json({ error: 'Instagram requires media before publish', blockReason: 'media_required' }, { status: 400 });
  }

  // Prefer direct API publish over Stagehand browser automation
  const apiStatus = socialApiCredentialStatus(canonical as SocialApiPlatform);

  if (apiStatus.configured) {
    // Direct API path
    const apiResult = await postViaSocialApi({
      platform: canonical as SocialApiPlatform,
      content: post.content,
      mediaUrls,
      userId: auth.user.id
    });

    const now = new Date().toISOString();
    const newStatus = apiResult.posted ? 'published' : 'failed';
    await updatePost(auth, post.id, {
      status: newStatus,
      published_at: apiResult.posted ? now : null,
      published_url: apiResult.postUrl || null,
      metadata: {
        ...(normalizePayload(post.metadata)),
        user_publish_confirmed_at: now,
        publish_method: 'direct_api',
        api_post_id: apiResult.postId || null,
        autonomous_publish: false,
        error: apiResult.error || null
      }
    });

    await writeAudit(auth, {
      approvalId: originalApprovalId,
      actionType: 'social_post_user_confirmed_publish',
      toolName: 'social_post_queue',
      status: apiResult.posted ? 'completed' : 'failed',
      message: apiResult.posted ? `Published to ${canonical} via direct API` : `API publish failed: ${apiResult.error}`,
      result: { postId: apiResult.postId, postUrl: apiResult.postUrl, method: 'direct_api' }
    });

    return NextResponse.json({
      executed: true,
      published: apiResult.posted,
      method: 'direct_api',
      platform: canonical,
      postId: apiResult.postId,
      postUrl: apiResult.postUrl,
      error: apiResult.error || null,
      autonomous_publish: false
    });
  }

  // Fallback: Stagehand browser automation
  const publishBrowserSessionId = crypto.randomUUID();
  const publishApproval = await createPublishApproval(auth, post, publishBrowserSessionId);
  if ('error' in publishApproval && publishApproval.error) {
    return publishApproval.error instanceof Response ? publishApproval.error : NextResponse.json({ error: publishApproval.error.message }, { status: 500 });
  }
  if (!('approval' in publishApproval)) return NextResponse.json({ error: 'Publish approval could not be created' }, { status: 500 });

  const approval = publishApproval.approval;
  const targetUrl = platformStartUrl(platform);

  try {
    const opened = await createBrowserSession(auth, approval.id, {
      url: targetUrl,
      browser_session_id: publishBrowserSessionId,
      session_mode: 'disposable'
    });
    if ('error' in opened && opened.error) throw opened.error instanceof Error ? opened.error : new Error('Publish browser session could not be opened');
    if (!('session' in opened)) throw new Error('Publish browser session could not be opened');

    const receipt = await composeThenPublish({
      auth,
      browser_session_id: publishBrowserSessionId,
      platform,
      content: post.content,
      mediaUrls
    });
    const now = new Date().toISOString();
    const { data, error } = await updatePost(auth, post.id, {
      status: 'published',
      published_at: now,
      browser_session_id: publishBrowserSessionId,
      metadata: {
        ...(normalizePayload(post.metadata)),
        user_publish_confirmed_at: now,
        published_screenshot_url: receipt.screenshot,
        published_storage_path: receipt.storagePath || null,
        publish_method: 'browser_automation',
        autonomous_publish: false
      }
    });
    if (error) throw error;

    await writeAudit(auth, {
      approvalId: approval.id,
      browserSessionId: publishBrowserSessionId,
      actionType: 'social_post_user_confirmed_publish',
      toolName: 'social_post_queue',
      status: 'completed',
      message: 'User confirmed and published queued social post',
      input: { postId: post.id, platform: canonicalPlatform(platform) },
      result: { post: data, screenshotUrl: receipt.screenshot, autonomousPublish: false },
      screenshotUrl: receipt.screenshot
    });
    await closeBrowserSession(auth, publishBrowserSessionId, { status: 'closed', reason: 'social_post_published' });
    return NextResponse.json({ executed: true, status: 'published', post: data, screenshotUrl: receipt.screenshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Social publish failed';
    let snapshot: unknown = null;
    try {
      const { accessibilitySnapshot } = await import('../../../_lib/stagehand-client');
      snapshot = await accessibilitySnapshot(publishBrowserSessionId);
    } catch {
      snapshot = null;
    }
    await updatePost(auth, post.id, {
      status: 'failed',
      error: message,
      browser_session_id: publishBrowserSessionId,
      accessibility_tree_snapshot: snapshot || null
    });
    await writeAudit(auth, {
      approvalId: approval.id,
      browserSessionId: publishBrowserSessionId,
      actionType: 'social_post_user_confirmed_publish',
      toolName: 'social_post_queue',
      status: 'failed',
      message,
      input: { postId: post.id, platform: canonicalPlatform(platform) },
      accessibilityTreeSnapshot: snapshot as Record<string, unknown> | string | null
    });
    await closeBrowserSession(auth, publishBrowserSessionId, { status: 'failed', reason: 'social_post_publish_failed' }).catch(() => null);
    return NextResponse.json({ error: message, executed: false, postId: post.id }, { status: 500 });
  }
}
