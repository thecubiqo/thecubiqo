import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const projectId = request.nextUrl.searchParams.get('project_id');
  const projectQuery = auth.supabase
    .from('duo_projects')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('updated_at', { ascending: false })
    .limit(1);

  const { data: project, error } = projectId
    ? await auth.supabase.from('duo_projects').select('*').eq('id', projectId).eq('user_id', auth.user.id).maybeSingle()
    : await projectQuery.maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!project) return NextResponse.json({ project: null, tasks: [], timeline: [], board_snapshot: null });

  const [tasks, approvals, artifacts, timeline] = await Promise.all([
    auth.supabase.from('duo_tasks').select('*').eq('project_id', project.id).eq('user_id', auth.user.id).order('created_at'),
    auth.supabase.from('duo_approvals').select('*').eq('project_id', project.id).eq('user_id', auth.user.id).order('created_at', { ascending: false }),
    auth.supabase.from('duo_artifacts').select('*').eq('project_id', project.id).order('created_at', { ascending: false }).limit(20),
    auth.supabase.from('duo_timeline_events').select('*').eq('project_id', project.id).order('created_at', { ascending: false }).limit(50),
  ]);

  return NextResponse.json({
    project,
    tasks: tasks.data || [],
    approvals: approvals.data || [],
    artifacts: artifacts.data || [],
    timeline: timeline.data || [],
    board_snapshot: {
      project,
      taskCount: (tasks.data || []).length,
      pendingApprovals: (approvals.data || []).filter((approval: { status: string }) => approval.status === 'pending').length,
      latestArtifact: artifacts.data?.[0] || null,
    },
  });
}
