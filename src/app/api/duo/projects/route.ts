import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '../../_lib/supabase-admin';
import { createDuoProject } from '@/next/lib/agent/entry-gate';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 20), 100);
  const { data, error } = await auth.supabase
    .from('duo_projects')
    .select('id,trace_id,title,goal,domain,status,risk_level,api_cost_gbp,budget_gate_gbp,created_at,updated_at,closed_at')
    .eq('user_id', auth.user.id)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ projects: data || [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const result = await createDuoProject(auth, {
    goal: body.goal,
    capsuleId: body.capsuleId,
    signalId: body.signalId,
    domain: body.domain,
    verbosity: body.verbosity,
    budgetGateGbp: body.budgetGateGbp,
    constraints: body.constraints
  });

  if (result.status === 'rejected') {
    return NextResponse.json({ error: result.reason, capsuleStatus: result.capsuleStatus }, { status: 400 });
  }
  if (result.status === 'failed') {
    return NextResponse.json({ error: result.reason }, { status: 500 });
  }

  return NextResponse.json(result);
}
