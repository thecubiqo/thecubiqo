import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const jobId = request.nextUrl.searchParams.get('jobId');
  let generationId = request.nextUrl.searchParams.get('generationId');
  if (!jobId && !generationId) return NextResponse.json({ error: 'jobId or generationId required' }, { status: 400 });

  if (jobId) {
    const { data: queue, error } = await auth.supabase
      .from('media_generation_queue')
      .select('job_id,generation_id,state,error_message,created_at,started_at,completed_at')
      .eq('job_id', jobId)
      .eq('user_id', auth.user.id)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!queue) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    generationId ||= queue.generation_id;
  }

  const { data: job, error } = await auth.supabase
    .from('media_generations')
    .select('id,status,media_type,storage_url,storage_path,completed_at,expires_at,error_message,metadata')
    .eq('id', generationId)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    generationId: job.id,
    jobId,
    status: job.status,
    mediaType: job.media_type,
    url: job.storage_url,
    storagePath: job.storage_path,
    completedAt: job.completed_at,
    expiresAt: job.expires_at,
    error: job.error_message,
    metadata: job.metadata || {}
  });
}
