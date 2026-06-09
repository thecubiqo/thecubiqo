import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { jobId } = await params;
  const { data: queue, error: queueError } = await auth.supabase
    .from('media_generation_queue')
    .select('job_id,generation_id,state,error_message')
    .eq('job_id', jobId)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (queueError) return NextResponse.json({ error: queueError.message }, { status: 500 });
  if (!queue) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: generation, error } = await auth.supabase
    .from('media_generations')
    .select('id,status,media_type,storage_url,storage_path,completed_at,expires_at,error_message,metadata')
    .eq('id', queue.generation_id)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!generation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    jobId: queue.job_id,
    generationId: generation.id,
    status: generation.status,
    queueState: queue.state,
    mediaType: generation.media_type,
    url: generation.storage_url,
    storagePath: generation.storage_path,
    completedAt: generation.completed_at,
    expiresAt: generation.expires_at,
    error: generation.error_message || queue.error_message,
    metadata: generation.metadata || {}
  });
}
