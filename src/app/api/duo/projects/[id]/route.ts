import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '../../../_lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const { data: project, error } = await auth.supabase
    .from('duo_projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const [tasks, edges, timeline, outcomes, artifacts, approvals, questions] = await Promise.all([
    auth.supabase.from('duo_tasks').select('*').eq('project_id', id).eq('user_id', auth.user.id).order('created_at'),
    auth.supabase.from('duo_task_edges').select('*').eq('project_id', id),
    auth.supabase.from('duo_timeline_events').select('*').eq('project_id', id).order('created_at', { ascending: false }).limit(50),
    auth.supabase.from('duo_outcomes').select('*').eq('project_id', id).eq('user_id', auth.user.id).order('created_at', { ascending: false }),
    auth.supabase.from('duo_artifacts').select('*').eq('project_id', id).eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(30),
    auth.supabase.from('duo_approvals').select('*').eq('project_id', id).eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(20),
    auth.supabase.from('duo_questions').select('*').eq('project_id', id).order('created_at', { ascending: false }).limit(20)
  ]);

  // The /app capsule overlay treats 'pending' as the undecided approval state;
  // the schema value is 'requested'. Normalize so the cards render.
  const normalizedApprovals = (approvals.data || []).map((a: any) => ({
    ...a,
    status: a.status === 'requested' ? 'pending' : a.status,
  }));

  return NextResponse.json({
    project,
    tasks: tasks.data || [],
    edges: edges.data || [],
    timeline: timeline.data || [],
    outcomes: outcomes.data || [],
    artifacts: artifacts.data || [],
    approvals: normalizedApprovals,
    questions: questions.data || []
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const allowed = ['status', 'verbosity', 'budget_gate_gbp', 'constraints', 'metadata'];
  const patch = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));

  const { data, error } = await auth.supabase
    .from('duo_projects')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ project: data });
}
