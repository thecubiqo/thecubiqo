import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing, missingMigrationResponse } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const { endpoint, keys } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'endpoint and keys (p256dh, auth) required' }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: auth.user.id,
        endpoint: String(endpoint).slice(0, 2000),
        p256dh: String(keys.p256dh).slice(0, 500),
        auth_key: String(keys.auth).slice(0, 100),
        user_agent: request.headers.get('user-agent')?.slice(0, 300) || null,
        active: true
      },
      { onConflict: 'endpoint' }
    )
    .select('id,endpoint,active,created_at')
    .single();

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('push', 'push_subscriptions');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ subscribed: true, subscription: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const endpoint = body.endpoint ? String(body.endpoint) : null;

  if (!endpoint) return NextResponse.json({ error: 'endpoint required' }, { status: 400 });

  const { error } = await auth.supabase
    .from('push_subscriptions')
    .update({ active: false })
    .eq('user_id', auth.user.id)
    .eq('endpoint', endpoint);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ unsubscribed: true });
}
