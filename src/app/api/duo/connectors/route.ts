import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '../../_lib/supabase-admin';
import { listConnectorReadiness, markConnectorNeedsAuth } from '@/next/lib/agent/tool-onboarding';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const readiness = await listConnectorReadiness(auth);
  return NextResponse.json(readiness);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const platform = String(body.platform || '').trim().toLowerCase();
  if (!platform) return NextResponse.json({ error: 'platform required' }, { status: 400 });

  const result = await markConnectorNeedsAuth(auth, platform, String(body.reason || 'User requested connector setup'));
  if (result.status === 'failed') return NextResponse.json({ error: result.reason }, { status: 500 });
  return NextResponse.json(result);
}
