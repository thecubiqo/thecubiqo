import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const maxDuration = 60;
export const runtime = 'nodejs';

const supabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserId(authHeader: string | null) {
  if (!authHeader) return null;
  const { data } = await supabaseAdmin().auth.getUser(authHeader.replace('Bearer ', ''));
  return data?.user?.id ?? null;
}

async function loadPersona(userId: string) {
  const db = supabaseAdmin();
  const [{ data: profile }, { data: aiProfile }, { data: signals }, { data: memories }] = await Promise.all([
    db.from('profiles').select('city,country,primary_goal,goal_domain,daily_context,display_name').eq('id', userId).single(),
    db.from('user_ai_profile').select('personality_read,primary_drive,communication_style,current_phase,what_motivates,what_blocks,open_loops').eq('user_id', userId).single(),
    db.from('signals').select('color,keyword,confirmed_intents').eq('user_id', userId).eq('intent_status', 'confirmed').limit(12),
    db.from('memory_events').select('summary,event_type,weight').eq('user_id', userId).order('weight', { ascending: false }).limit(6),
  ]);
  return { profile, aiProfile, signals, memories };
}

function personaToString(p: Awaited<ReturnType<typeof loadPersona>>) {
  const parts: string[] = [];
  if (p.profile?.display_name) parts.push(`Name: ${p.profile.display_name}`);
  if (p.profile?.city || p.profile?.country) parts.push(`Location: ${[p.profile?.city, p.profile?.country].filter(Boolean).join(', ')}`);
  if (p.profile?.primary_goal) parts.push(`Primary goal: ${p.profile.primary_goal}`);
  if (p.profile?.daily_context) parts.push(`Context: ${p.profile.daily_context}`);
  if (p.aiProfile?.personality_read) parts.push(`Personality: ${p.aiProfile.personality_read}`);
  if (p.aiProfile?.primary_drive) parts.push(`Drive: ${p.aiProfile.primary_drive}`);
  if (p.aiProfile?.what_motivates) parts.push(`Motivated by: ${p.aiProfile.what_motivates}`);
  if (p.aiProfile?.what_blocks) parts.push(`Blocked by: ${p.aiProfile.what_blocks}`);
  if (p.aiProfile?.current_phase) parts.push(`Phase: ${p.aiProfile.current_phase}`);
  if (p.signals?.length) parts.push(`Signals: ${p.signals.map((s: { color: string; keyword: string }) => `${s.color}/${s.keyword}`).join(', ')}`);
  if (p.memories?.length) parts.push(`Memories: ${p.memories.map((m: { summary: string }) => m.summary).join(' | ')}`);
  return parts.join('\n') || 'New user — no persona data yet.';
}

const ProjectPlanSchema = z.object({
  goal_type: z.string(),
  domain: z.string(),
  success_criteria: z.array(z.string()),
  known_context: z.array(z.string()),
  risk_level: z.enum(['low', 'medium', 'high']),
  tasks: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    risk_level: z.enum(['low', 'medium', 'high']).default('low'),
    requires_connector: z.string().optional(),
    requires_approval: z.boolean().default(false),
    artifact_expected: z.boolean().default(false),
    sort_order: z.number(),
  })),
  widgets: z.array(z.object({
    slot: z.string(),
    widget_type: z.string(),
    title: z.string().optional(),
    config: z.record(z.unknown()).optional(),
    sort_order: z.number(),
  })),
  opening_message: z.string(),
  first_question: z.object({
    prompt: z.string(),
    subtext: z.string().optional(),
    input_type: z.enum(['text', 'select', 'confirm']).default('text'),
    options: z.array(z.string()).optional(),
  }).optional(),
});

// POST /api/duo/projects — create a new DuoMode project
export async function POST(request: Request) {
  const userId = await getUserId(request.headers.get('authorization'));
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { goal } = await request.json();
  if (!goal?.trim()) return Response.json({ error: 'goal is required' }, { status: 400 });

  const persona = await loadPersona(userId);
  const personaStr = personaToString(persona);

  const { object: plan } = await generateObject({
    model: anthropic('claude-sonnet-4-6'),
    system: `You are CubiQo's DuoMode project planner. You create universal project plans that work for any goal.

USER PERSONA:
${personaStr}

Rules:
- Build a 3-7 task plan. First task should always be safe (research, analysis, draft — never irreversible action).
- Widgets must use slots from: goal, task_graph, questions, blockers, access_requests, approvals, artifacts, timeline, metrics, cost
- Widget types: summary, dag, input_queue, connector_cards, artifact_gallery, kpi_strip, timeline_feed, cost_bar, approval_queue, blocker_list
- opening_message: personalised greeting that shows you know the user — reference their location, goal, or personality
- If you need critical info to start, set first_question. Otherwise start working immediately.
- Risk assessment must reflect actual consequences, not theatre.`,
    prompt: `Create a DuoMode project plan for this goal: "${goal}"`,
    schema: ProjectPlanSchema,
  });

  const db = supabaseAdmin();

  // Create project
  const { data: project, error: projErr } = await db.from('duo_projects').insert({
    user_id: userId,
    title: goal.slice(0, 120),
    goal,
    goal_type: plan.goal_type,
    domain: plan.domain,
    success_criteria: plan.success_criteria,
    known_context: plan.known_context,
    risk_level: plan.risk_level,
  }).select().single();

  if (projErr || !project) return Response.json({ error: projErr?.message }, { status: 500 });

  // Insert tasks
  await db.from('duo_tasks').insert(
    plan.tasks.map(t => ({ ...t, project_id: project.id, user_id: userId, status: 'pending' }))
  );

  // Insert widgets
  await db.from('duo_dashboard_widgets').insert(
    plan.widgets.map(w => ({ ...w, project_id: project.id, config: w.config ?? {} }))
  );

  // Insert first question if any
  if (plan.first_question) {
    await db.from('duo_questions').insert({
      project_id: project.id,
      user_id: userId,
      prompt: plan.first_question.prompt,
      subtext: plan.first_question.subtext,
      input_type: plan.first_question.input_type,
      options: plan.first_question.options,
      is_blocking: true,
    });
  }

  // Timeline: project created
  await db.from('duo_timeline_events').insert({
    project_id: project.id,
    user_id: userId,
    event_type: 'project_created',
    title: `Project created: ${goal.slice(0, 80)}`,
  });

  // Mark first task as working
  const { data: tasks } = await db.from('duo_tasks').select('id').eq('project_id', project.id).order('sort_order').limit(1);
  if (tasks?.[0] && !plan.first_question) {
    await db.from('duo_tasks').update({ status: 'working', started_at: new Date().toISOString() }).eq('id', tasks[0].id);
    await db.from('duo_timeline_events').insert({ project_id: project.id, user_id: userId, task_id: tasks[0].id, event_type: 'task_started', title: plan.tasks[0].title });
  }

  return Response.json({ project, opening_message: plan.opening_message });
}

// GET /api/duo/projects — list user's projects
export async function GET(request: Request) {
  const userId = await getUserId(request.headers.get('authorization'));
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabaseAdmin()
    .from('duo_projects')
    .select('id,title,goal,status,cost_used,cost_budget,created_at,updated_at')
    .eq('user_id', userId)
    .in('status', ['active', 'paused'])
    .order('updated_at', { ascending: false })
    .limit(20);

  return Response.json({ projects: data ?? [] });
}
