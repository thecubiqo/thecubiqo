import type { AgentAuth } from './common';
import { writeTimeline } from './common';

function removeOpenLoop(openLoops: unknown, goal: string) {
  if (!Array.isArray(openLoops)) return [];
  const goalWords = goal.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return openLoops.filter(loop => {
    const text = String(loop).toLowerCase();
    return !goalWords.some(word => word.length > 4 && text.includes(word));
  });
}

export async function writeOutcome(
  auth: AgentAuth,
  input: { projectId: string; outcome: 'success' | 'partial' | 'failed' | 'shot' | 'abandoned'; summary: string; evidence?: Record<string, unknown> }
) {
  const { data: project, error } = await auth.supabase
    .from('duo_projects')
    .select('*')
    .eq('id', input.projectId)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (error || !project) return { status: 'failed' as const, reason: error?.message || 'Project not found' };

  const eventType = input.outcome === 'shot' ? 'project_shot' : 'project_outcome';
  const { data: memory } = await auth.supabase
    .from('memory_events')
    .insert({
      user_id: auth.user.id,
      event_type: eventType,
      summary: input.summary,
      keywords: String(project.goal || project.title || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).slice(0, 12),
      weight: input.outcome === 'success' ? 3 : 2,
      source: 'duo',
      user_confirmed: true,
      metadata: { projectId: project.id, outcome: input.outcome }
    })
    .select('id')
    .single();

  const { data: outcome, error: outcomeError } = await auth.supabase
    .from('duo_outcomes')
    .insert({
      user_id: auth.user.id,
      project_id: project.id,
      trace_id: project.trace_id,
      outcome: input.outcome,
      summary: input.summary,
      evidence: input.evidence || {},
      memory_event_id: memory?.id || null
    })
    .select('*')
    .single();

  if (outcomeError) return { status: 'failed' as const, reason: outcomeError.message };

  // status check constraint: planning|working|paused|blocked|done|failed
  // 'shot' and 'abandoned' map to 'failed'; actual outcome is in duo_outcomes
  const dbStatus = input.outcome === 'done' || input.outcome === 'success' || input.outcome === 'partial' ? 'done' : 'failed';
  const now = new Date().toISOString();
  await auth.supabase
    .from('duo_projects')
    .update({
      status: dbStatus,
      closed_at: now,
      updated_at: now,
      metadata: {
        ...(project.metadata || {}),
        outcome: input.outcome,
        outcomeAt: now,
        ...(input.outcome === 'shot' ? { shotReason: input.summary } : {})
      }
    })
    .eq('id', project.id)
    .eq('user_id', auth.user.id);

  if (input.outcome === 'success') {
    const { data: profile } = await auth.supabase
      .from('user_ai_profile')
      .select('open_loops')
      .eq('user_id', auth.user.id)
      .maybeSingle();
    await auth.supabase
      .from('user_ai_profile')
      .update({
        open_loops: removeOpenLoop(profile?.open_loops, project.goal || project.title || ''),
        last_updated: new Date().toISOString()
      })
      .eq('user_id', auth.user.id);
  }

  if (project.playbook_id) {
    const { data: playbook } = await auth.supabase
      .from('playbooks')
      .select('use_count,success_rate')
      .eq('id', project.playbook_id)
      .maybeSingle();
    const prevCount = Number(playbook?.use_count || 0);
    const prevRate  = Number(playbook?.success_rate ?? 0.5);
    const newCount  = prevCount + 1;
    const isSuccess = input.outcome === 'success' || input.outcome === 'done';
    // Rolling average: new_rate = (prev_rate * prev_count + this_result) / new_count
    const newRate = (prevRate * prevCount + (isSuccess ? 1 : 0)) / newCount;
    await auth.supabase
      .from('playbooks')
      .update({
        use_count:        newCount,
        success_rate:     Math.round(newRate * 1000) / 1000,
        last_reviewed_at: new Date().toISOString()
      })
      .eq('id', project.playbook_id);
  }

  await writeTimeline(auth, {
    projectId: project.id,
    traceId: project.trace_id,
    eventType: 'project_closed',
    message: `Project closed as ${input.outcome}: ${input.summary}`,
    payload: { outcomeId: outcome.id, outcome: input.outcome }
  });

  return { status: 'completed' as const, outcome };
}
