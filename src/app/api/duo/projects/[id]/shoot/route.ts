import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '../../../../_lib/supabase-admin';
import { writeOutcome } from '@/next/lib/agent/outcome-writer';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const summary = String(body.reason || body.summary || 'User shot the project before completion').slice(0, 1000);
  const result = await writeOutcome(auth, {
    projectId: id,
    outcome: 'shot',
    summary,
    evidence: { source: 'shoot_route' }
  });

  if (result.status === 'failed') return NextResponse.json({ error: result.reason }, { status: 500 });
  return NextResponse.json(result);
}
