import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

const ParamsSchema = z.object({ taskId: z.string().uuid() });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const parsed = ParamsSchema.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid task id' }, { status: 400 });

  const { data: task } = await auth.supabase
    .from('duo_tasks')
    .select('id,project_id')
    .eq('id', parsed.data.taskId)
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (!task) return NextResponse.json({ artifact: null }, { status: 404 });

  const { data, error } = await auth.supabase
    .from('duo_artifacts')
    .select('*')
    .eq('task_id', parsed.data.taskId)
    .eq('project_id', task.project_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ artifact: data || null });
}
