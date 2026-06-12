import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';
import { writeTimeline } from '@/next/lib/agent/common';
import { ensureInitialView } from '@/next/lib/agent/capsule-engine';

export const runtime = 'nodejs';

const ParamsSchema = z.object({ id: z.string().uuid() });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const parsed = ParamsSchema.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });

  const { data: project, error } = await auth.supabase
    .from('duo_projects')
    .select('id,status,trace_id')
    .eq('id', parsed.data.id)
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  if (project.status !== 'planning') return NextResponse.json({ error: 'Project already approved', code: 'ALREADY_APPROVED' }, { status: 409 });

  const now = new Date().toISOString();
  const { error: statusError } = await auth.supabase
    .from('duo_projects').update({ status: 'active', updated_at: now }).eq('id', project.id);
  if (statusError) {
    // Never swallow this — a failed status flip silently severs the whole
    // plan-approval → execution arrow (the worker guards on project status).
    return NextResponse.json({ error: `Could not activate project: ${statusError.message}` }, { status: 500 });
  }
  await auth.supabase
    .from('duo_tasks')
    .update({ status: 'ready', updated_at: now })
    .eq('project_id', project.id)
    .eq('user_id', auth.user.id)
    .eq('status', 'pending')
    .eq('approval_required', false);

  // Enqueue the initial execution wave: ready tasks with NO unmet prerequisites
  // (roots of the dependency graph). Dependents are enqueued automatically as
  // their prerequisites complete (worker.enqueueUnblockedDependents).
  const [{ data: readyTasks }, { data: edges }] = await Promise.all([
    auth.supabase.from('duo_tasks').select('id').eq('project_id', project.id).eq('user_id', auth.user.id).eq('status', 'ready'),
    auth.supabase.from('duo_task_edges').select('to_task_id').eq('project_id', project.id).eq('edge_type', 'blocks'),
  ]);
  const blocked = new Set((edges || []).map((e: any) => e.to_task_id).filter(Boolean));
  const roots = (readyTasks || []).filter((t: any) => !blocked.has(t.id));
  if (roots.length) {
    await auth.supabase.from('agent_job_queue').upsert(
      roots.map((t: any) => ({
        user_id: auth.user.id,
        project_id: project.id,
        task_id: t.id,
        trace_id: project.trace_id,
        job_type: 'execute_task',
        state: 'queued',
        status: 'queued',
        locked_by: null,
        payload: { userId: auth.user.id, taskId: t.id },
        idempotency_key: `execute-task:${t.id}`,
      })),
      { onConflict: 'idempotency_key' }
    );
  }

  // Refresh the dashboard for the now-active project.
  await ensureInitialView(auth, project.id).catch(() => null);

  await writeTimeline(auth, {
    projectId: project.id,
    traceId: project.trace_id || crypto.randomUUID(),
    eventType: 'plan_approved',
    message: 'Plan Review Gate approved.',
  });

  return NextResponse.json({ ok: true, projectId: project.id, status: 'active', queued: roots.length });
}
