import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const maxDuration = 60;
export const runtime = 'nodejs';

const TaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['done', 'working', 'pending', 'blocked']),
  tool: z.string().optional(),
  detail: z.string().optional(),
});

const QuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  subtext: z.string().optional(),
  inputType: z.enum(['text', 'select', 'confirm']),
  options: z.array(z.string()).optional(),
  isBlocking: z.boolean(),
});

const ApprovalSchema = z.object({
  id: z.string(),
  title: z.string(),
  risk: z.string(),
  ifApproved: z.string(),
  ifDenied: z.string(),
});

const OutputSchema = z.object({
  type: z.enum(['table', 'grid', 'preview', 'report', 'list', 'empty']),
  title: z.string(),
  subtitle: z.string().optional(),
  data: z.any(),
});

const DashboardStateSchema = z.object({
  intent: z.string().describe('One-sentence summary of what CubiQo is doing for this dashboard'),
  tasks: z.array(TaskSchema),
  output: OutputSchema,
  questions: z.array(QuestionSchema),
  approvals: z.array(ApprovalSchema),
  nextStep: z.string().describe('What CubiQo will do next without being asked'),
  openingMessage: z.string().describe('Personalised first message CubiQo says when this dashboard opens — references what it knows about the user'),
});

async function loadUserPersona(authHeader: string | null) {
  if (!authHeader) return null;
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return null;

    const [{ data: profile }, { data: aiProfile }, { data: signals }, { data: memories }] =
      await Promise.all([
        supabase.from('profiles').select('city, country, primary_goal, goal_domain, daily_context, display_name').eq('id', user.id).single(),
        supabase.from('user_ai_profile').select('personality_read, primary_drive, communication_style, current_phase, what_motivates, what_blocks, open_loops').eq('user_id', user.id).single(),
        supabase.from('signals').select('color, keyword, confirmed_intents').eq('user_id', user.id).eq('intent_status', 'confirmed').limit(10),
        supabase.from('memory_events').select('summary, event_type, weight').eq('user_id', user.id).order('weight', { ascending: false }).limit(5),
      ]);

    return { profile, aiProfile, signals, memories, userId: user.id };
  } catch {
    return null;
  }
}

function buildPersonaContext(persona: Awaited<ReturnType<typeof loadUserPersona>>) {
  if (!persona) return 'Anonymous user — no persona data available yet.';
  const { profile, aiProfile, signals, memories } = persona;

  const parts: string[] = [];
  if (profile?.display_name) parts.push(`Name: ${profile.display_name}`);
  if (profile?.city || profile?.country) parts.push(`Location: ${[profile.city, profile.country].filter(Boolean).join(', ')}`);
  if (profile?.primary_goal) parts.push(`Primary goal: ${profile.primary_goal}`);
  if (profile?.goal_domain) parts.push(`Domain: ${profile.goal_domain}`);
  if (profile?.daily_context) parts.push(`Daily context: ${profile.daily_context}`);
  if (aiProfile?.personality_read) parts.push(`Personality: ${aiProfile.personality_read}`);
  if (aiProfile?.primary_drive) parts.push(`Driven by: ${aiProfile.primary_drive}`);
  if (aiProfile?.what_motivates) parts.push(`Motivated by: ${aiProfile.what_motivates}`);
  if (aiProfile?.what_blocks) parts.push(`Blocked by: ${aiProfile.what_blocks}`);
  if (aiProfile?.current_phase) parts.push(`Current phase: ${aiProfile.current_phase}`);
  if (signals?.length) parts.push(`Signals: ${signals.map(s => `${s.color}/${s.keyword}`).join(', ')}`);
  if (memories?.length) parts.push(`Key memories: ${memories.map(m => m.summary).join(' | ')}`);

  return parts.join('\n');
}

export async function POST(request: Request) {
  const body = await request.json();
  const { topic, answers = {}, approvals = {}, previousState = null } = body;
  const authHeader = request.headers.get('authorization');

  if (!topic?.trim()) {
    return Response.json({ error: 'topic is required' }, { status: 400 });
  }

  const persona = await loadUserPersona(authHeader);
  const personaContext = buildPersonaContext(persona);
  const isFirstLoad = !previousState;

  const SYSTEM = `You are CubiQo — an agentic AI companion operating in DuoMode.

You are running a personalised dashboard for the topic: "${topic}"

USER PERSONA:
${personaContext}

USER ANSWERS TO YOUR QUESTIONS (if any):
${Object.entries(answers).map(([k, v]) => `${k}: ${v}`).join('\n') || 'None yet'}

USER APPROVAL DECISIONS (if any):
${Object.entries(approvals).map(([k, v]) => `${k}: ${v}`).join('\n') || 'None yet'}

PREVIOUS STATE:
${previousState ? JSON.stringify(previousState, null, 2) : 'This is the first load — start fresh.'}

YOUR BEHAVIOUR:
- You start working IMMEDIATELY on dashboard open — never wait for the user to type first
- You reference what you know about the user in your opening message (city, goal, personality)
- You create a concrete plan of 3-7 tasks and start executing the first one
- You surface NEEDS YOUR INPUT only for information you genuinely cannot infer
- You surface NEEDS APPROVAL for any risky, irreversible, or ethically complex action
- Tasks have status: done (completed), working (currently executing), pending (queued), blocked (waiting on input/approval)
- Output type matches what's being produced: table for data, grid for cards, preview for built app/content, report for research, list for options
- Your opening message should feel like you already know the user — reference their location, goal, or personality
- Be one step ahead — always show what you'll do next

Return a complete dashboard state as structured JSON.`;

  try {
    const result = await generateObject({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: anthropic('claude-sonnet-4-6') as any,
      system: SYSTEM,
      prompt: isFirstLoad
        ? `Open the dashboard for "${topic}". Generate a personalised plan and start executing. Show what you know about the user in your opening message.`
        : `Continue executing. User has provided answers/approvals. Update task statuses and advance the plan.`,
      schema: DashboardStateSchema,
    });

    return Response.json({ state: result.object, isFirstLoad });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
