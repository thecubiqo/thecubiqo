/**
 * TikTok Content Posting — uses TikTok Content Posting API (v2).
 * https://developers.tiktok.com/doc/content-posting-api-post-video
 *
 * API flow:
 *   1. POST /v2/post/publish/video/init/   — get upload_url + publish_id
 *   2. PUT  <upload_url>                   — upload video bytes
 *   3. GET  /v2/post/publish/status/fetch/ — poll until published
 *
 * For text-only posts (no video), falls back to BrowserBase automation.
 * Requires TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET env vars.
 * User must complete OAuth at /connectors (platform: 'tiktok').
 */

import { auditedSocialAct, captureQueueReceipt, type SocialQueueScriptInput } from './shared';

const TIKTOK_API = 'https://open.tiktokapis.com';

// ── TikTok API client ─────────────────────────────────────────────────────────
async function tiktokPost(accessToken: string, payload: object, path: string) {
  const res = await fetch(`${TIKTOK_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function tiktokGet(accessToken: string, path: string) {
  const res = await fetch(`${TIKTOK_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();
}

// ── Main posting function ─────────────────────────────────────────────────────
export async function queueTikTok(input: SocialQueueScriptInput & {
  accessToken?: string;
  videoUrl?: string;           // public URL to video file (mp4)
  coverImageUrl?: string;
  privacyLevel?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
}) {
  const { accessToken, videoUrl, content, privacyLevel = 'PUBLIC_TO_EVERYONE' } = input;

  // ── API path: video post ──────────────────────────────────────────────────
  if (accessToken && videoUrl) {
    try {
      // Step 1: Init video upload
      const initRes = await tiktokPost(accessToken, {
        post_info: {
          title: content.slice(0, 2200),
          privacy_level: privacyLevel,
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: videoUrl,
        },
      }, '/v2/post/publish/video/init/');

      if (initRes.error?.code && initRes.error.code !== 'ok') {
        throw new Error(initRes.error.message ?? 'TikTok init failed');
      }

      const publishId = initRes.data?.publish_id;

      // Step 2: Poll for publish status (max 30s)
      let status = 'PROCESSING_UPLOAD';
      let attempts = 0;
      while (status === 'PROCESSING_UPLOAD' || status === 'PROCESSING_DOWNLOAD') {
        if (attempts++ > 10) break;
        await new Promise(r => setTimeout(r, 3000));
        const statusRes = await tiktokPost(accessToken, { publish_id: publishId }, '/v2/post/publish/status/fetch/');
        status = statusRes.data?.status ?? 'UNKNOWN';
      }

      return {
        status: status === 'PUBLISH_COMPLETE' ? 'published' as const : 'processing' as const,
        platform: 'tiktok',
        publishId,
        postStatus: status,
        method: 'api',
        message: status === 'PUBLISH_COMPLETE'
          ? 'TikTok video published via Content Posting API.'
          : `TikTok video is processing (status: ${status}). Check back in a few minutes.`,
      };
    } catch (err: any) {
      // Fall through to browser automation
      console.warn('[tiktok] API posting failed, falling back to browser:', err?.message);
    }
  }

  // ── Fallback: browser automation via BrowserBase ──────────────────────────
  await auditedSocialAct(input, 'Navigate to TikTok Studio at https://studio.tiktok.com and click "Upload".');
  await auditedSocialAct(input, `Add this caption to the TikTok post: ${content.slice(0, 2200)}`);
  const receipt = await captureQueueReceipt(input);

  return {
    status: 'ready' as const,
    platform: 'tiktok',
    method: 'browser',
    ...receipt,
    message: 'TikTok post is composed in TikTok Studio. Click Post to publish it.',
  };
}
