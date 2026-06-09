import { NextRequest, NextResponse } from 'next/server';
import { missingMigrationResponse, requireApiUser, safeTableMissing } from '@/next/app/api/_lib/supabase-admin';
import { computeRGYScore } from '@/next/lib/rgy/rgy-engine';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { data: stored, error } = await auth.supabase
    .from('rgy_status')
    .select('status,score,reason,changed_at,evaluated_at')
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (error && safeTableMissing(error)) return missingMigrationResponse('rgy-status', 'rgy_status');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (stored) return NextResponse.json(stored);

  const computed = await computeRGYScore(auth.user.id);
  return NextResponse.json({
    status: computed.status,
    score: computed.score,
    reason: computed.reason,
    changed_at: null,
    evaluated_at: computed.evaluatedAt
  });
}
