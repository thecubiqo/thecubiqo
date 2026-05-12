import { NextRequest, NextResponse } from 'next/server';
import { getUrlAllowlistDecision } from '../../_lib/guardrails';
import { closeBrowserSession, createBrowserSession, normalizeBrowserSessionId } from '../../_lib/browser-sessions';
import { getActionCapability } from '../../_lib/v2-capabilities';
import { type ApiUserContext, missingMigrationResponse, requireApiUser, safeTableMissing } from '../../_lib/supabase-admin';
import { completeApproval, normalizePayload, requireApprovedAction, writeAudit } from '../../_lib/v2-actions';
import { queueInstagram } from './platforms/instagram';
import { queueLinkedIn } from './platforms/linkedin';
import { canonicalPlatform, platformStartUrl, type SocialQueuePlatform, type SocialQueueScriptInput } from './platforms/shared';
import { queueThreads } from './platforms/threads';
import { queueTwitter } from './platforms/twitter';
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
  return input
    .map(item => normalizeText(item, 1600))
    .filter(Boolean)
    .filter(item => {
      try {
        const url = new URL(item);
        return ['http:', 'https:'].includes(url.protocol);
      } catch {
        return false;
      }
    })
    .slice(0, 10);
}

function normalizePlatform(value: unknown): SocialQueuePlatform | null {
  return normalizeSocialQueuePlatform(value);
}

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

async function insertSocialPost(
  auth: ApiUserContext,
  input: {
    approvalId: string;
    browserSessionId: string;
    platform: Exclude<SocialQueuePlatform, 'twitter'>;
    content: string;
    mediaUrls: string[];
  }
) {
  const { data, error } = await auth.supabase
    .from('social_posts')
    .insert({
      user_id: auth.user.id,
      approval_id: input.approvalId,
      browser_session_id: input.browserSessionId,
      platform: input.platform,
      content: input.content,
      media_urls: input.mediaUrls,
      status: 'draft',
      metadata: {
        final_publish_requires_user_button: true,
        autonomous_publish: false
      }
    })
    .select('id,approval_id,browser_session_id,platform,content,media_urls,status,preview_screenshot_url,published_url,accessibility_tree_snapshot,error,metadata,created_at,updated_at,published_at,cancelled_at')
    .single();

  if (error) {
    if (safeTableMissing(error)) return { error: missingMigrationResponse('social-post-queue', 'social_posts') };
    return { error };
  }
  return { post: data };
}

async function updateSocialPost(
  auth: ApiUserContext,
  postId: string,
  values: Record<string, unknown>
) {
  const { data, error } = await auth.supabase
    .from('social_posts')
    .update(values)
    .eq('id', postId)
    .eq('user_id', auth.user.id)
    .select('id,approval_id,browser_session_id,platform,content,media_urls,status,preview_screenshot_url,published_url,accessibility_tree_snapshot,error,metadata,created_at,updated_at,published_at,cancelled_at')
    .single();
  return { data, error };
}

async function runPlatformScript(input: SocialQueueScriptInput) {
  const platform = canonicalPlatform(input.platform);
  if (platform === 'linkedin') return queueLinkedIn(input);
  if (platform === 'instagram') return queueInstagram(input);
  if (platform === 'threads') return queueThreads(input);
  return queueTwitter(input);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const capability = getActionCapability('social_post_queue');
  const browserControl = getActionCapability('browser_control');
  if (!capability || capability.status !== 'active' || !browserControl || browserControl.status !== 'active') {
    await writeAudit(auth, {
      actionType: 'social_post_queue',
      toolName: 'social_post_queue',
      status: 'blocked',
      message: 'social_post_queue blocked because capability or browser_control is not active',
      result: {
        socialPostQueueStatus: capability?.status || 'missing',
        browserControlStatus: browserControl?.status || 'missing'
      }
    });
    return NextResponse.json({ error: 'social_post_queue is not active', capability, browserControl }, { status: 501 });
  }

  const body = await request.json().catch(() => ({}));
  const approvalId = normalizeText(body.approvalId ?? body.approval_id, 80);
  const approvalCheck = await requireApprovedAction(auth, approvalId, 'social_post_queue');
  if (approvalCheck.error) return approvalCheck.error;

  const approval = approvalCheck.approval;
  const approvalPayload = normalizePayload(approval?.payload);
  const requestPayload = normalizePayload(body.payload);
  const payload = {
    ...approvalPayload,
    ...requestPayload,
    ...body
  };

  const content = normalizeText(payload.content, 4000);
  const platform = normalizePlatform(payload.platform);
  const browserSessionId = normalizeBrowserSessionId(payload.browser_session_id ?? payload.browserSessionId);
  const approvedBrowserSessionId = normalizeBrowserSessionId(approval?.browser_session_id ?? approvalPayload.browser_session_id);
  const mediaUrls = normalizeMediaUrls(payload.media_urls ?? payload.mediaUrls);

  if (!platform || !content || !browserSessionId || !approvedBrowserSessionId) {
    await writeAudit(auth, {
      approvalId,
      browserSessionId: browserSessionId || null,
      actionType: 'social_post_queue',
      toolName: 'social_post_queue',
      status: 'blocked',
      message: 'social_post_queue blocked because platform, content, or browser_session_id was missing',
      blockReason: 'no_approval_record'
    });
    return NextResponse.json({ error: 'platform, content, and browser_session_id are required', executed: false }, { status: 400 });
  }

  if (browserSessionId !== approvedBrowserSessionId) {
    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType: 'social_post_queue',
      toolName: 'social_post_queue',
      status: 'blocked',
      message: 'social_post_queue blocked because browser_session_id did not match the approval record',
      input: { browserSessionId, approvedBrowserSessionId },
      blockReason: 'session_hijack_attempt'
    });
    return NextResponse.json({ error: 'Browser session approval mismatch', executed: false, blockReason: 'session_hijack_attempt' }, { status: 403 });
  }

  const canonical = canonicalPlatform(platform);
  if (canonical === 'instagram' && !mediaUrls.length) {
    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType: 'social_post_queue',
      toolName: 'social_post_queue',
      status: 'blocked',
      message: 'Instagram social_post_queue blocked because media is required',
      input: { platform: canonical },
      blockReason: 'media_required'
    });
    return NextResponse.json({ error: 'Instagram requires at least one media URL before a session opens', executed: false, blockReason: 'media_required' }, { status: 400 });
  }

  const platformEntry = getSocialPlatform(canonical);
  const connected = await getConnectedSocialAccount(auth, canonical);
  if ('error' in connected && connected.error) {
    return connected.error instanceof Response ? connected.error : NextResponse.json({ error: connected.error.message }, { status: 500 });
  }
  if (!('account' in connected) || !connected.account || !platformEntry?.supportsQueue) {
    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType: 'social_post_queue',
      toolName: 'social_post_queue',
      status: 'blocked',
      message: `${platformEntry?.label || canonical} social queue blocked because the user has not connected that platform`,
      input: { platform: canonical, socialAccountsTable: 'social_accounts' },
      blockReason: platformEntry?.supportsQueue ? 'platform_not_connected' : 'platform_queue_not_supported'
    });
    return NextResponse.json({
      error: platformEntry?.supportsQueue ? 'platform_not_connected' : 'platform_queue_not_supported',
      message: platformEntry?.supportsQueue
        ? `Connect a ${platformEntry.label} account before queueing posts.`
        : `${platformEntry?.label || canonical} does not have a browser queue adapter yet.`,
      executed: false,
      platform: canonical
    }, { status: 403 });
  }

  const targetUrl = platformStartUrl(platform);
  if (!targetUrl) {
    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType: 'social_post_queue',
      toolName: 'social_post_queue',
      status: 'blocked',
      message: `${platformEntry?.label || canonical} social queue blocked because no platform start URL is configured`,
      input: { platform: canonical },
      blockReason: 'platform_not_configured'
    });
    return NextResponse.json({
      error: 'platform_not_configured',
      message: 'Platform not configured — add account via Settings.',
      executed: false,
      platform: canonical
    }, { status: 403 });
  }
  const urlDecision = getUrlAllowlistDecision({ url: targetUrl });
  if (!urlDecision.ok) {
    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType: 'social_post_queue',
      toolName: 'social_post_queue',
      status: 'blocked',
      message: 'social_post_queue blocked because platform URL is not allowlisted',
      input: { url: urlDecision.rawUrl, hostname: urlDecision.hostname },
      blockReason: urlDecision.reason || 'suspicious_url'
    });
    return NextResponse.json({ error: 'Social platform URL is not allowlisted', executed: false, blockReason: urlDecision.reason || 'suspicious_url' }, { status: 403 });
  }

  const inserted = await insertSocialPost(auth, {
    approvalId,
    browserSessionId,
    platform: canonical,
    content,
    mediaUrls
  });
  if ('error' in inserted && inserted.error) {
    return inserted.error instanceof Response ? inserted.error : NextResponse.json({ error: inserted.error.message }, { status: 500 });
  }
  if (!('post' in inserted)) {
    return NextResponse.json({ error: 'social_posts row could not be created', executed: false }, { status: 500 });
  }
  const post = inserted.post;

  try {
    const opened = await createBrowserSession(auth, approvalId, {
      url: targetUrl,
      browser_session_id: browserSessionId,
      session_mode: 'disposable'
    });
    if ('error' in opened && opened.error) throw opened.error instanceof Error ? opened.error : new Error('Browser session could not be opened');
    if (!('session' in opened)) throw new Error('Browser session could not be opened');

    const result = await runPlatformScript({
      auth,
      browser_session_id: browserSessionId,
      platform,
      content,
      mediaUrls
    });

    const updated = await updateSocialPost(auth, post.id, {
      status: result.status,
      preview_screenshot_url: result.screenshot,
      metadata: {
        ...(post.metadata || {}),
        social_account_id: connected.account.id,
        platform_registry_id: canonical,
        preview_storage_path: result.storagePath || null,
        ready_message: result.message,
        final_publish_requires_user_button: true,
        autonomous_publish: false
      }
    });
    if (updated.error) throw updated.error;

    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType: 'social_post_ready',
      toolName: 'social_post_queue',
      status: 'completed',
      message: result.message,
      input: { platform: canonical },
      result: { post: updated.data, screenshotUrl: result.screenshot, finalPublishAutonomous: false },
      screenshotUrl: result.screenshot
    });
    await completeApproval(auth, approvalId, true);
    await closeBrowserSession(auth, browserSessionId, { status: 'closed', reason: 'social_post_ready' });

    return NextResponse.json({
      executed: true,
      status: 'ready',
      post: updated.data,
      browserSessionId,
      screenshotUrl: result.screenshot,
      message: result.message,
      finalPublishAutonomous: false
    });
  } catch (error) {
    let snapshot: unknown = null;
    try {
      const { accessibilitySnapshot } = await import('../../_lib/stagehand-client');
      snapshot = await accessibilitySnapshot(browserSessionId);
    } catch {
      snapshot = null;
    }
    const message = error instanceof Error ? error.message : 'social_post_queue failed';
    await updateSocialPost(auth, post.id, {
      status: 'failed',
      error: message,
      accessibility_tree_snapshot: snapshot || null
    });
    await writeAudit(auth, {
      approvalId,
      browserSessionId,
      actionType: 'social_post_failed',
      toolName: 'social_post_queue',
      status: 'failed',
      message,
      input: { platform: canonical },
      accessibilityTreeSnapshot: snapshot as Record<string, unknown> | string | null
    });
    await completeApproval(auth, approvalId, false);
    await closeBrowserSession(auth, browserSessionId, { status: 'failed', reason: 'social_post_failed' }).catch(() => null);
    return NextResponse.json({ error: message, executed: false, postId: post.id }, { status: 500 });
  }
}
