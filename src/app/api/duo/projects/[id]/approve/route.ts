import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';
import { writeTimeline } from '@/next/lib/agent/common';

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
  await auth.supabase.from('duo_projects').update({ status: 'active', updated_at: now }).eq('id', project.id);
  await auth.supabase
    .from('duo_tasks')
    .update({ status: 'ready', updated_at: now })
    .eq('project_id', project.id)
    .eq('user_id', auth.user.id)
    .eq('status', 'pending')
    .eq('approval_required', false);

  await writeTimeline(auth, {
    projectId: project.id,
    traceId: project.trace_id || crypto.randomUUID(),
    eventType: 'plan_approved',
    message: 'Plan Review Gate approved.',
  });

  return NextResponse.json({ ok: true, projectId: project.id, status: 'active' });
}
