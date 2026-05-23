type SupabaseLike = {
  from: (table: string) => any;
};

export type ProactiveTriggerType =
  | 'commitment_due'
  | 'stale_capsule'
  | 'rgy_drift'
  | 'capsule_at_risk'
  | 'win_detection'
  | 'crisis_followup'
  | 'memory_recall'
  | 'social_nudge';

export interface ProactiveTrigger {
  type: ProactiveTriggerType;
  userId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reason: string;
  actionUrl: string;
  signalId?: string | null;
  projectId?: string | null;
  metadata: Record<string, unknown>;
}

const ACTIVE_PROJECT_STATUSES = ['planning', 'working', 'paused', 'blocked', 'waiting_user', 'waiting_approval'];
const DONE_PROJECT_STATUSES = ['done', 'completed'];

function isoHoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function isoHoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

async function recentlyNudged(supabase: SupabaseLike, userId: string, type: string, hours = 72) {
  const { data } = await supabase
    .from('interventions_log')
    .select('id')
    .eq('user_id', userId)
    .eq('intervention_type', type)
    .gte('created_at', isoHoursAgo(hours))
    .limit(1);

  return Boolean(data?.length);
}

async function commitmentDue(supabase: SupabaseLike, userId: string): Promise<ProactiveTrigger | null> {
  if (await recentlyNudged(supabase, userId, 'commitment_due', 24)) return null;

  const now = new Date().toISOString();
  const { data } = await supabase
    .from('memory_events')
    .select('id,summary,expires_at')
    .eq('user_id', userId)
    .eq('event_type', 'commitment')
    .gte('expires_at', now)
    .lte('expires_at', isoHoursFromNow(24))
    .order('expires_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    type: 'commitment_due',
    userId,
    priority: 'high',
    reason: `Commitment due soon: ${data.summary}`,
    actionUrl: '/chat',
    metadata: { memoryEventId: data.id, expiresAt: data.expires_at, summary: data.summary }
  };
}

async function crisisFollowup(supabase: SupabaseLike, userId: string): Promise<ProactiveTrigger | null> {
  if (await recentlyNudged(supabase, userId, 'crisis_followup', 72)) return null;

  const { data } = await supabase
    .from('memory_events')
    .select('id,summary,created_at')
    .eq('user_id', userId)
    .eq('event_type', 'crisis_signal')
    .gte('created_at', isoHoursAgo(72))
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    type: 'crisis_followup',
    userId,
    priority: 'urgent',
    reason: 'Recent crisis signal needs a gentle follow-up.',
    actionUrl: '/chat',
    metadata: { memoryEventId: data.id, summary: data.summary }
  };
}

async function capsuleAtRisk(supabase: SupabaseLike, userId: string): Promise<ProactiveTrigger | null> {
  if (await recentlyNudged(supabase, userId, 'capsule_at_risk', 48)) return null;

  const { data } = await supabase
    .from('duo_projects')
    .select('id,goal,title,success_status,success_notes,updated_at')
    .eq('user_id', userId)
    .in('success_status', ['at_risk', 'off_track'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    type: 'capsule_at_risk',
    userId,
    priority: data.success_status === 'off_track' ? 'high' : 'medium',
    reason: `${data.goal || data.title || 'A Duo project'} is ${data.success_status}.`,
    actionUrl: `/duo/${data.id}`,
    projectId: data.id,
    metadata: {
      projectId: data.id,
      projectTitle: data.goal || data.title,
      successStatus: data.success_status,
      successNotes: data.success_notes
    }
  };
}

async function staleCapsule(supabase: SupabaseLike, userId: string): Promise<ProactiveTrigger | null> {
  if (await recentlyNudged(supabase, userId, 'stale_capsule', 72)) return null;

  const { data } = await supabase
    .from('duo_projects')
    .select('id,goal,title,status,updated_at')
    .eq('user_id', userId)
    .in('status', ACTIVE_PROJECT_STATUSES)
    .lt('updated_at', isoHoursAgo(5 * 24))
    .order('updated_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    type: 'stale_capsule',
    userId,
    priority: 'medium',
    reason: `${data.goal || data.title || 'A Duo project'} has not moved in five days.`,
    actionUrl: `/duo/${data.id}`,
    projectId: data.id,
    metadata: { projectId: data.id, projectTitle: data.goal || data.title, status: data.status, updatedAt: data.updated_at }
  };
}

async function winDetection(supabase: SupabaseLike, userId: string): Promise<ProactiveTrigger | null> {
  if (await recentlyNudged(supabase, userId, 'win_detection', 168)) return null;

  const { data } = await supabase
    .from('duo_projects')
    .select('id,goal,title,status,completed_at,closed_at,updated_at')
    .eq('user_id', userId)
    .in('status', DONE_PROJECT_STATUSES)
    .gte('updated_at', isoHoursAgo(48))
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const { data: outcome } = await supabase
    .from('capsule_outcomes')
    .select('id')
    .eq('project_id', data.id)
    .limit(1)
    .maybeSingle();

  return {
    type: 'win_detection',
    userId,
    priority: 'medium',
    reason: `${data.goal || data.title || 'A Duo project'} was completed.`,
    actionUrl: `/duo/${data.id}`,
    projectId: data.id,
    metadata: { projectId: data.id, projectTitle: data.goal || data.title, outcomeWritten: Boolean(outcome?.id) }
  };
}

async function rgyDrift(supabase: SupabaseLike, userId: string): Promise<ProactiveTrigger | null> {
  if (await recentlyNudged(supabase, userId, 'rgy_drift', 96)) return null;

  const { data } = await supabase
    .from('rgy_status')
    .select('status,score,reason,evaluated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data || data.status === 'green' || Number(data.score) >= 45) return null;
  return {
    type: 'rgy_drift',
    userId,
    priority: data.status === 'red' ? 'high' : 'medium',
    reason: data.reason || `RGY status is ${data.status} at ${data.score}.`,
    actionUrl: '/chat',
    metadata: { status: data.status, score: Number(data.score), evaluatedAt: data.evaluated_at }
  };
}

async function socialNudge(supabase: SupabaseLike, userId: string): Promise<ProactiveTrigger | null> {
  if (await recentlyNudged(supabase, userId, 'social_nudge', 168)) return null;

  const { data: rgy } = await supabase
    .from('rgy_status')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle();

  if (rgy?.status !== 'yellow') return null;

  const { data: activity } = await supabase
    .from('social_activity_feed')
    .select('id,activity_type,summary,created_at')
    .eq('user_id', userId)
    .gte('created_at', isoHoursAgo(7 * 24))
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!activity) return null;
  return {
    type: 'social_nudge',
    userId,
    priority: 'low',
    reason: activity.summary || 'There is recent social activity to review.',
    actionUrl: '/chat',
    metadata: { activityId: activity.id, activityType: activity.activity_type }
  };
}

async function memoryRecall(supabase: SupabaseLike, userId: string): Promise<ProactiveTrigger | null> {
  if (await recentlyNudged(supabase, userId, 'memory_recall', 72)) return null;

  const { data } = await supabase
    .from('memory_events')
    .select('id,event_type,summary,weight,created_at')
    .eq('user_id', userId)
    .gte('weight', 2)
    .lt('created_at', isoHoursAgo(72))
    .is('archived_at', null)
    .order('weight', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    type: 'memory_recall',
    userId,
    priority: 'low',
    reason: `Important memory to resurface: ${data.summary}`,
    actionUrl: '/chat',
    metadata: { memoryEventId: data.id, eventType: data.event_type, weight: data.weight }
  };
}

export async function evaluateProactiveTriggers(
  supabase: SupabaseLike,
  user: { id: string }
): Promise<ProactiveTrigger[]> {
  const evaluators = [
    crisisFollowup,
    commitmentDue,
    capsuleAtRisk,
    winDetection,
    staleCapsule,
    rgyDrift,
    socialNudge,
    memoryRecall
  ];

  const triggers: ProactiveTrigger[] = [];
  for (const evaluate of evaluators) {
    try {
      const trigger = await evaluate(supabase, user.id);
      if (trigger) triggers.push(trigger);
    } catch {
      // Missing optional tables should not take down the whole proactive pass.
    }
  }

  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  return triggers.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
