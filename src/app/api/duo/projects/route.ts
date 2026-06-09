import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser } from '../../_lib/supabase-admin';
import { createDuoProject } from '@/next/lib/agent/entry-gate';

export const runtime = 'nodejs';

const createProjectSchema = z.object({
  goal: z.string().max(4000).optional(),
  capsuleId: z.string().uuid().optional(),
  signalId: z.string().uuid().optional(),
  domain: z.string().max(80).optional(),
  verbosity: z.enum(['concise', 'normal', 'detailed']).optional(),
  budgetGateGbp: z.number().min(0).max(500).optional(),
  constraints: z.record(z.unknown()).optional(),
});

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

  const parsed = createProjectSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid Duo project payload', issues: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;
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
