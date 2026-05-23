import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';
import { writeTimeline } from '@/next/lib/agent/common';

export const runtime = 'nodejs';

const ParamsSchema = z.object({ id: z.string().uuid() });
const BodySchema = z.object({ answer: z.string().min(1).max(4000) });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const parsedParams = ParamsSchema.safeParse(await params);
  const parsedBody = BodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsedParams.success) return NextResponse.json({ error: 'Invalid task id' }, { status: 400 });
  if (!parsedBody.success) return NextResponse.json({ error: 'Invalid answer payload', issues: parsedBody.error.flatten() }, { status: 400 });

  const { data: task } = await auth.supabase
    .from('duo_tasks')
    .select('id,project_id,trace_id,status')
    .eq('id', parsedParams.data.id)
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  if (task.status !== 'awaiting_user') return NextResponse.json({ error: 'Task is not awaiting a user answer' }, { status: 409 });

  const metadata = { user_answer: parsedBody.data.answer, answered_at: new Date().toISOString() };
  const { data, error } = await auth.supabase
    .from('duo_tasks')
    .update({ status: 'done', result: metadata, updated_at: new Date().toISOString() })
    .eq('id', task.id)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeTimeline(auth, {
    projectId: task.project_id,
    taskId: task.id,
    traceId: task.trace_id || crypto.randomUUID(),
    eventType: 'question_answered',
    message: 'User answered a DuoMode question.',
    payload: metadata,
  });

  return NextResponse.json({ task: data });
}
