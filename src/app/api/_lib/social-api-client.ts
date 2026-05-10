import { cleanEnv } from './supabase-admin';

export type SocialApiPlatform = 'linkedin' | 'x' | 'instagram' | 'threads';

export type SocialPostPayload = {
  content: string;
  mediaUrls?: string[];
  platform: SocialApiPlatform;
  userId: string;
};

export type SocialPostResult = {
  posted: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
  provider: 'api' | 'blocked';
};

// ── LinkedIn Graph API ──────────────────────────────────────────────────────

async function postLinkedIn(payload: SocialPostPayload): Promise<SocialPostResult> {
  const token = cleanEnv(process.env.LINKEDIN_ACCESS_TOKEN);
  const authorId = cleanEnv(process.env.LINKEDIN_AUTHOR_URN); // e.g. urn:li:person:xxx
  if (!token || !authorId) {
    return { posted: false, error: 'LINKEDIN_ACCESS_TOKEN or LINKEDIN_AUTHOR_URN not configured', provider: 'blocked' };
  }

  const body: Record<string, any> = {
    author: authorId,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: payload.content },
        shareMediaCategory: 'NONE'
      }
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
  };

  try {
    const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text();
      return { posted: false, error: `LinkedIn API ${res.status}: ${text.slice(0, 200)}`, provider: 'api' };
    }

    const postId = res.headers.get('x-restli-id') || '';
    return { posted: true, postId, provider: 'api' };
  } catch (err: any) {
    return { posted: false, error: err.message, provider: 'api' };
  }
}

// ── X (Twitter) API v2 ──────────────────────────────────────────────────────

async function postX(payload: SocialPostPayload): Promise<SocialPostResult> {
  const bearerToken = cleanEnv(process.env.X_BEARER_TOKEN);
  const apiKey = cleanEnv(process.env.X_API_KEY);
  const apiSecret = cleanEnv(process.env.X_API_SECRET);
  const accessToken = cleanEnv(process.env.X_ACCESS_TOKEN);
  const accessSecret = cleanEnv(process.env.X_ACCESS_TOKEN_SECRET);

  if (!bearerToken && !(apiKey && apiSecret && accessToken && accessSecret)) {
    return { posted: false, error: 'X API credentials not configured', provider: 'blocked' };
  }

  try {
    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken || accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: payload.content.slice(0, 280) })
    });

    if (!res.ok) {
      const text = await res.text();
      return { posted: false, error: `X API ${res.status}: ${text.slice(0, 200)}`, provider: 'api' };
    }

    const json = await res.json();
    const tweetId = json.data?.id || '';
    return {
      posted: true,
      postId: tweetId,
      postUrl: tweetId ? `https://x.com/i/web/status/${tweetId}` : undefined,
      provider: 'api'
    };
  } catch (err: any) {
    return { posted: false, error: err.message, provider: 'api' };
  }
}

// ── Instagram Graph API ─────────────────────────────────────────────────────

async function postInstagram(payload: SocialPostPayload): Promise<SocialPostResult> {
  const token = cleanEnv(process.env.INSTAGRAM_ACCESS_TOKEN);
  const accountId = cleanEnv(process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID);
  if (!token || !accountId) {
    return { posted: false, error: 'INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_BUSINESS_ACCOUNT_ID not configured', provider: 'blocked' };
  }

  const mediaUrl = payload.mediaUrls?.[0];
  if (!mediaUrl) {
    return { posted: false, error: 'Instagram requires at least one media URL', provider: 'blocked' };
  }

  try {
    // Step 1: create media container
    const createRes = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}/media?image_url=${encodeURIComponent(mediaUrl)}&caption=${encodeURIComponent(payload.content)}&access_token=${token}`,
      { method: 'POST' }
    );
    if (!createRes.ok) {
      const text = await createRes.text();
      return { posted: false, error: `Instagram media create ${createRes.status}: ${text.slice(0, 200)}`, provider: 'api' };
    }
    const { id: creationId } = await createRes.json();

    // Step 2: publish
    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}/media_publish?creation_id=${creationId}&access_token=${token}`,
      { method: 'POST' }
    );
    if (!publishRes.ok) {
      const text = await publishRes.text();
      return { posted: false, error: `Instagram publish ${publishRes.status}: ${text.slice(0, 200)}`, provider: 'api' };
    }
    const { id: mediaId } = await publishRes.json();
    return { posted: true, postId: mediaId, provider: 'api' };
  } catch (err: any) {
    return { posted: false, error: err.message, provider: 'api' };
  }
}

// ── Threads API ─────────────────────────────────────────────────────────────

async function postThreads(payload: SocialPostPayload): Promise<SocialPostResult> {
  const token = cleanEnv(process.env.THREADS_ACCESS_TOKEN);
  const userId = cleanEnv(process.env.THREADS_USER_ID);
  if (!token || !userId) {
    return { posted: false, error: 'THREADS_ACCESS_TOKEN or THREADS_USER_ID not configured', provider: 'blocked' };
  }

  try {
    // Step 1: create container
    const createRes = await fetch(
      `https://graph.threads.net/v1.0/${userId}/threads?media_type=TEXT&text=${encodeURIComponent(payload.content)}&access_token=${token}`,
      { method: 'POST' }
    );
    if (!createRes.ok) {
      const text = await createRes.text();
      return { posted: false, error: `Threads create ${createRes.status}: ${text.slice(0, 200)}`, provider: 'api' };
    }
    const { id: creationId } = await createRes.json();

    // Step 2: publish
    const publishRes = await fetch(
      `https://graph.threads.net/v1.0/${userId}/threads_publish?creation_id=${creationId}&access_token=${token}`,
      { method: 'POST' }
    );
    if (!publishRes.ok) {
      const text = await publishRes.text();
      return { posted: false, error: `Threads publish ${publishRes.status}: ${text.slice(0, 200)}`, provider: 'api' };
    }
    const { id: postId } = await publishRes.json();
    return { posted: true, postId, provider: 'api' };
  } catch (err: any) {
    return { posted: false, error: err.message, provider: 'api' };
  }
}

// ── Dispatcher ───────────────────────────────────────────────────────────────

export async function postViaSocialApi(payload: SocialPostPayload): Promise<SocialPostResult> {
  switch (payload.platform) {
    case 'linkedin': return postLinkedIn(payload);
    case 'x': return postX(payload);
    case 'instagram': return postInstagram(payload);
    case 'threads': return postThreads(payload);
    default: return { posted: false, error: `Unsupported platform: ${payload.platform}`, provider: 'blocked' };
  }
}

export function socialApiCredentialStatus(platform: SocialApiPlatform): { configured: boolean; missingVars: string[] } {
  const checks: Record<SocialApiPlatform, string[]> = {
    linkedin: ['LINKEDIN_ACCESS_TOKEN', 'LINKEDIN_AUTHOR_URN'],
    x: ['X_BEARER_TOKEN'],
    instagram: ['INSTAGRAM_ACCESS_TOKEN', 'INSTAGRAM_BUSINESS_ACCOUNT_ID'],
    threads: ['THREADS_ACCESS_TOKEN', 'THREADS_USER_ID']
  };
  const required = checks[platform] || [];
  const missingVars = required.filter(v => !cleanEnv(process.env[v]));
  return { configured: missingVars.length === 0, missingVars };
}
