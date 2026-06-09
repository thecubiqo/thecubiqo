import { getSupabaseAdmin } from '@/next/app/api/_lib/supabase-admin';
import { routeMediaModel, normalizeMediaType } from './model-router';
import type { GenerateMediaRequest } from '@/next/types/media';

export async function enqueueMediaGeneration(
  userId: string,
  request: GenerateMediaRequest
): Promise<{ jobId: string; generationId: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('DB unavailable');

  const modelConfig = routeMediaModel(request.mediaType, request.style);
  const mediaType = normalizeMediaType(request.mediaType);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: generation, error } = await supabase
    .from('media_generations')
    .insert({
      user_id: userId,
      session_id: request.sessionId || null,
      task_id: request.taskId || null,
      media_type: mediaType,
      prompt: request.prompt,
      negative_prompt: request.negativePrompt || null,
      model_used: modelConfig.model,
      provider: modelConfig.provider,
      status: 'pending',
      metadata: { style: request.style || null, aspect_ratio: request.aspectRatio || null },
      expires_at: expiresAt
    })
    .select('id')
    .maybeSingle();

  if (error || !generation) throw new Error(error?.message || 'Failed to create media generation');

  const { data: queueJob, error: queueError } = await supabase
    .from('media_generation_queue')
    .insert({
      user_id: userId,
      generation_id: generation.id,
      prompt: request.prompt,
      media_type: mediaType,
      model_used: modelConfig.model,
      provider: modelConfig.provider,
      state: 'queued',
      priority: request.taskId ? 8 : 5
    })
    .select('job_id')
    .maybeSingle();

  if (queueError || !queueJob) throw new Error(queueError?.message || 'Failed to create media queue job');

  processJob(generation.id, queueJob.job_id, modelConfig.provider).catch(() => {});
  return { jobId: queueJob.job_id, generationId: generation.id };
}

async function processJob(generationId: string, jobId: string, provider: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const startedAt = new Date().toISOString();
  await Promise.all([
    supabase.from('media_generations').update({ status: 'processing' }).eq('id', generationId),
    supabase.from('media_generation_queue').update({ state: 'processing', started_at: startedAt }).eq('job_id', jobId)
  ]);

  // Sprint 6 queue is provider-safe: no live media providers are called unless a later worker opts in.
  const completedAt = new Date().toISOString();
  const status = provider === 'mock' ? 'complete' : 'failed';
  const errorMessage = provider === 'mock' ? null : 'Live media provider worker is not enabled in this environment.';

  await Promise.all([
    supabase.from('media_generations').update({
      status,
      completed_at: completedAt,
      error_message: errorMessage,
      metadata: { provider_safe: true, error: errorMessage }
    }).eq('id', generationId),
    supabase.from('media_generation_queue').update({
      state: status,
      completed_at: completedAt,
      error_message: errorMessage
    }).eq('job_id', jobId)
  ]);
}
