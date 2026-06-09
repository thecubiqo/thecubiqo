import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, getSupabaseAdmin, cleanEnv } from '../../_lib/supabase-admin';
import { cfg } from '@/next/lib/config/runtime';

export const runtime = 'nodejs';

// Send push notification to all active subscriptions for a user.
// Requires VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY (ES256 PEM) for real delivery.
// Falls back to in-app notification log when VAPID is not configured.
// Generate VAPID keys: npx web-push generate-vapid-keys

async function buildVapidJwt(endpoint: string, subject: string, privateKeyPem: string, publicKeyB64u: string): Promise<string> {
  const { createSign } = await import('crypto');
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const exp = Math.floor(Date.now() / 1000) + cfg.vapidJwtExpiry;

  const b64u = (s: string) => Buffer.from(s).toString('base64url');
  const header = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const payload = b64u(JSON.stringify({ aud: audience, exp, sub: subject }));
  const input = `${header}.${payload}`;

  const sign = createSign('SHA256');
  sign.update(input);
  const sig = sign.sign(privateKeyPem);

  // DER ECDSA sig → raw r+s (64 bytes)
  const sigBuf = Buffer.from(sig);
  let offset = 2;
  const rLen = sigBuf[offset + 1];
  const r = sigBuf.slice(offset + 2, offset + 2 + rLen).slice(-32);
  offset += 2 + rLen;
  const sLen = sigBuf[offset + 1];
  const s = sigBuf.slice(offset + 2, offset + 2 + sLen).slice(-32);
  const raw = Buffer.concat([Buffer.alloc(32 - r.length), r, Buffer.alloc(32 - s.length), s]);
  const signature = raw.toString('base64url');

  return `${input}.${signature}`;
}

async function deliverPush(
  endpoint: string,
  p256dh: string,
  authKey: string,
  payload: string,
  vapidPublic: string,
  vapidPrivatePem: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const jwt = await buildVapidJwt(endpoint, cleanEnv(process.env.VAPID_SUBJECT) || '', vapidPrivatePem, vapidPublic);

    const body = Buffer.from(payload, 'utf8');
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${jwt},k=${vapidPublic}`,
        'Content-Type': 'application/octet-stream',
        'TTL': String(cfg.pushTtl),
        'Content-Length': String(body.length)
      },
      body
    });

    if (res.status === 404 || res.status === 410) {
      return { ok: false, status: res.status, error: 'subscription_expired' };
    }
    return { ok: res.ok, status: res.status };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export async function POST(request: NextRequest) {
  // Two legitimate callers:
  //   1. Real user requests — authenticated with a Bearer JWT (requireApiUser).
  //   2. Internal fan-out from crons / the agent — authenticated with
  //      `x-cubiqo-internal: CRON_SECRET` + `x-user-id` (or body.userId).
  // Previously only path (1) was accepted, so EVERY cron-originated push 401'd
  // silently and the entire proactive-notification surface was dead. Support both.
  const body = await request.json().catch(() => ({} as Record<string, any>));

  const cronSecret = cleanEnv(process.env.CRON_SECRET);
  const internalHeader = request.headers.get('x-cubiqo-internal');

  let supabase: ReturnType<typeof getSupabaseAdmin>;
  let userId: string;

  if (cronSecret && internalHeader === cronSecret) {
    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    const target = request.headers.get('x-user-id') || body.userId;
    if (!target) return NextResponse.json({ error: 'x-user-id required for internal push' }, { status: 400 });
    supabase = admin;
    userId = String(target);
  } else {
    const auth = await requireApiUser(request);
    if (auth.error) return auth.error;
    supabase = auth.supabase;
    userId = auth.user.id;
  }

  const title = String(body.title || 'CubiQo').slice(0, cfg.pushTitleMaxLength);
  const message = String(body.message || '').slice(0, cfg.pushMessageMaxLength);
  const actionUrl = body.url ? String(body.url).slice(0, 500) : '/';

  const vapidPublic = cleanEnv(process.env.VAPID_PUBLIC_KEY);
  const vapidPrivatePem = cleanEnv(process.env.VAPID_PRIVATE_KEY_PEM);
  const vapidSubject = cleanEnv(process.env.VAPID_SUBJECT);

  // Always log the notification in DB
  await supabase.from('push_notifications').insert({
    user_id: userId,
    title,
    message,
    action_url: actionUrl,
    delivered: false
  });

  if (!vapidPublic || !vapidPrivatePem || !vapidSubject) {
    return NextResponse.json({
      queued: true,
      method: 'in_app_only',
      reason: 'VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY_PEM, or VAPID_SUBJECT not configured — in-app log only'
    });
  }

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id,endpoint,p256dh,auth_key,max_per_day,quiet_hours_start,quiet_hours_end,timezone')
    .eq('user_id', userId)
    .eq('active', true);

  if (!subs?.length) {
    return NextResponse.json({ sent: 0, queued: true, reason: 'No active push subscriptions' });
  }

  // F7-D: Rate limiting + quiet hours
  const maxPerDay = subs[0]?.max_per_day ?? 3;
  const quietStart = subs[0]?.quiet_hours_start ?? 22; // 10pm
  const quietEnd   = subs[0]?.quiet_hours_end   ?? 8;  // 8am
  const userTz     = subs[0]?.timezone || 'UTC';

  // Check daily push count
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const { count: todayCount } = await supabase
    .from('push_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', dayStart.toISOString());

  if ((todayCount ?? 0) >= maxPerDay) {
    return NextResponse.json({ sent: 0, queued: true, reason: `Daily push limit reached (${maxPerDay}/day)` });
  }

  // Check quiet hours
  try {
    const nowInTz = new Date().toLocaleString('en-US', { timeZone: userTz, hour: 'numeric', hour12: false });
    const currentHour = parseInt(nowInTz, 10);
    const inQuietHours = quietStart > quietEnd
      ? currentHour >= quietStart || currentHour < quietEnd   // e.g. 22–8 wraps midnight
      : currentHour >= quietStart && currentHour < quietEnd;
    if (inQuietHours) {
      return NextResponse.json({ sent: 0, queued: true, reason: 'Quiet hours — notification queued for morning' });
    }
  } catch {
    // Timezone parse failure — deliver anyway
  }

  const payloadStr = JSON.stringify({ title, body: message, url: actionUrl, timestamp: Date.now() });

  const results = await Promise.all(
    subs.map(async (sub: { id: string; endpoint: string; p256dh: string; auth_key: string }) => {
      const r = await deliverPush(sub.endpoint, sub.p256dh, sub.auth_key, payloadStr, vapidPublic, vapidPrivatePem);
      if (!r.ok && r.error === 'subscription_expired') {
        await supabase.from('push_subscriptions').update({ active: false }).eq('id', sub.id);
      }
      return { endpoint: sub.endpoint.slice(-30), ...r };
    })
  );

  const sent = results.filter(r => r.ok).length;

  if (sent > 0) {
    await supabase.from('push_notifications').update({ delivered: true }).eq('user_id', userId).eq('title', title);
  }

  return NextResponse.json({ sent, total: subs.length, results });
}

// GET ?vapid_public_key=1 — return public key for frontend subscription setup
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  if (url.searchParams.has('vapid_public_key')) {
    const key = cleanEnv(process.env.VAPID_PUBLIC_KEY) || null;
    return NextResponse.json({ vapidPublicKey: key, configured: !!key });
  }
  return NextResponse.json({ error: 'Use ?vapid_public_key=1' }, { status: 400 });
}
