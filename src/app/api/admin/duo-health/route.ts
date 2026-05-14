import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRequest } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireAdminRequest(request);
  if ('error' in auth) return auth.error;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [projects, activeProjects, failedTasks, queuedJobs, deadJobs, approvals] = await Promise.all([
    auth.supabase.from('duo_projects').select('*', { count: 'exact', head: true }).gte('created_at', since),
    auth.supabase.from('duo_projects').select('*', { count: 'exact', head: true }).in('status', ['planning', 'working', 'paused', 'blocked']),
    auth.supabase.from('duo_tasks').select('*', { count: 'exact', head: true }).eq('status', 'failed').gte('updated_at', since),
    auth.supabase.from('agent_job_queue').select('*', { count: 'exact', head: true }).eq('status', 'queued'),
    auth.supabase.from('dead_letter_jobs').select('*', { count: 'exact', head: true }).gte('created_at', since),
    auth.supabase.from('action_approvals').select('*', { count: 'exact', head: true }).eq('status', 'requested')
  ]);

  return NextResponse.json({
    window: '24h',
    projectsCreated: projects.count || 0,
    activeProjects: activeProjects.count || 0,
    failedTasks: failedTasks.count || 0,
    queuedJobs: queuedJobs.count || 0,
    deadLetterJobs: deadJobs.count || 0,
    pendingApprovals: approvals.count || 0
  });
}
