import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserId(authHeader: string | null) {
  if (!authHeader) return null;
  const { data } = await db().auth.getUser(authHeader.replace('Bearer ', ''));
  return data?.user?.id ?? null;
}

// GET /api/duo/projects/[id] — full project state for rendering
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId(request.headers.get('authorization'));
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = db();
  const projectId = params.id;

  const [
    { data: project },
    { data: tasks },
    { data: questions },
    { data: blockers },
    { data: accessRequests },
    { data: approvals },
    { data: artifacts },
    { data: externalRefs },
    { data: timeline },
    { data: widgets },
    { data: toolCalls },
  ] = await Promise.all([
    supabase.from('duo_projects').select('*').eq('id', projectId).eq('user_id', userId).single(),
    supabase.from('duo_tasks').select('*').eq('project_id', projectId).order('sort_order'),
    supabase.from('duo_questions').select('*').eq('project_id', projectId).order('created_at'),
    supabase.from('duo_blockers').select('*').eq('project_id', projectId).eq('status', 'open').order('created_at', { ascending: false }),
    supabase.from('duo_access_requests').select('*').eq('project_id', projectId).eq('status', 'pending').order('created_at'),
    supabase.from('duo_approvals').select('*').eq('project_id', projectId).eq('status', 'pending').order('created_at'),
    supabase.from('duo_artifacts').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(20),
    supabase.from('duo_external_refs').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(20),
    supabase.from('duo_timeline_events').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(30),
    supabase.from('duo_dashboard_widgets').select('*').eq('project_id', projectId).eq('visible', true).order('sort_order'),
    supabase.from('agent_tool_calls').select('tool_name,status,cost,created_at').eq('project_id', projectId).order('created_at', { ascending: false }).limit(10),
  ]);

  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

  return Response.json({
    project,
    tasks: tasks ?? [],
    questions: questions ?? [],
    blockers: blockers ?? [],
    access_requests: accessRequests ?? [],
    approvals: approvals ?? [],
    artifacts: artifacts ?? [],
    external_refs: externalRefs ?? [],
    timeline: timeline ?? [],
    widgets: widgets ?? [],
    tool_calls: toolCalls ?? [],
  });
}

// PATCH /api/duo/projects/[id] — update project status
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId(request.headers.get('authorization'));
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { status } = body;

  const { data } = await db()
    .from('duo_projects')
    .update({ status, ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}) })
    .eq('id', params.id)
    .eq('user_id', userId)
    .select()
    .single();

  return Response.json({ project: data });
}
