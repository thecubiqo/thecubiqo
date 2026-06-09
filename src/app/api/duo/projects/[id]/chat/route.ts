import { anthropic } from '@ai-sdk/anthropic';
import { getModel } from '@/next/lib/config/llm';
import { generateObject } from 'ai';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const maxDuration = 60;
export const runtime = 'nodejs';

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserId(authHeader: string | null) {
  if (!authHeader) return null;
  const { data } = await db().auth.getUser(authHeader.replace('Bearer ', ''));
  return data?.user?.id ?? null;
}

const BoardUpdateSchema = z.object({
  reply: z.string().describe('CubiQo\'s response to the user message'),
  task_updates: z.array(z.object({
    task_id: z.string(),
    status: z.enum(['pending', 'working', 'done', 'blocked', 'skipped']),
    detail: z.string().optional(),
  })).optional(),
  new_questions: z.array(z.object({
    prompt: z.string(),
    subtext: z.string().optional(),
    input_type: z.enum(['text', 'select', 'confirm']).default('text'),
    options: z.array(z.string()).optional(),
    is_blocking: z.boolean().default(false),
    task_id: z.string().optional(),
  })).optional(),
  new_blockers: z.array(z.object({
    title: z.string(),
    reason: z.string().optional(),
    blocker_type: z.enum(['missing_access', 'missing_info', 'approval_needed', 'external_dependency', 'error', 'unknown']).default('unknown'),
    task_id: z.string().optional(),
  })).optional(),
  new_approvals: z.array(z.object({
    title: z.string(),
    action_summary: z.string(),
    platform: z.string().optional(),
    payload_preview: z.string().optional(),
    risk_level: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    is_reversible: z.boolean().default(true),
    if_approved: z.string(),
    if_denied: z.string(),
    task_id: z.string().optional(),
  })).optional(),
  new_artifacts: z.array(z.object({
    title: z.string(),
    artifact_type: z.enum(['document', 'image', 'code', 'data', 'url', 'file', 'report', 'draft', 'plan']),
    content: z.string().optional(),
    external_url: z.string().optional(),
    task_id: z.string().optional(),
  })).optional(),
  timeline_note: z.string().optional(),
  resolve_blocker_ids: z.array(z.string()).optional(),
});

// POST /api/duo/projects/[id]/chat — chat that reads + writes project board state
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request.headers.get('authorization'));
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { message, question_id, approval_id, approval_decision } = await request.json();
  const supabase = db();
  const { id: projectId } = await params;

  // Load full project state for context
  const [
    { data: project },
    { data: tasks },
    { data: questions },
    { data: blockers },
    { data: approvals },
  ] = await Promise.all([
    supabase.from('duo_projects').select('*').eq('id', projectId).eq('user_id', userId).single(),
    supabase.from('duo_tasks').select('*').eq('project_id', projectId).order('created_at'),
    supabase.from('duo_questions').select('*').eq('project_id', projectId).eq('status', 'open'),
    supabase.from('duo_blockers').select('*').eq('project_id', projectId).eq('status', 'open'),
    supabase.from('duo_approvals').select('*').eq('project_id', projectId).eq('status', 'requested'),
  ]);

  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

  // Handle approval decision directly
  if (approval_id && approval_decision) {
    await supabase.from('duo_approvals').update({
      status: approval_decision,
      decided_at: new Date().toISOString(),
    }).eq('id', approval_id);

    await supabase.from('duo_timeline_events').insert({
      project_id: projectId, user_id: userId,
      event_type: 'approval_decided',
      message: `Approval ${approval_decision}`,
    });
  }

  // Handle question answer directly
  if (question_id && message) {
    await supabase.from('duo_questions').update({
      status: 'answered',
      answer: message,
      answered_at: new Date().toISOString(),
    }).eq('id', question_id);

    await supabase.from('duo_timeline_events').insert({
      project_id: projectId, user_id: userId,
      event_type: 'question_answered',
      message: `Question answered`,
      description: message.slice(0, 200),
    });
  }

  const userMessage = message || (approval_decision ? `Decision: ${approval_decision}` : 'Continue');

  const { object: update } = await generateObject({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: anthropic(getModel('claude_agent')) as any, // claude_agent = Sonnet — duo chat needs full reasoning capability
    system: `You are CubiQo operating in DuoMode for project: "${project.goal}"

Current board state:
TASKS: ${JSON.stringify(tasks?.map(t => ({ id: t.id, title: t.title, status: t.status })))}
BLOCKERS: ${JSON.stringify(blockers?.map(b => ({ id: b.id, description: b.description })))}
PENDING QUESTIONS: ${JSON.stringify(questions?.map(q => ({ id: q.id, question: q.question })))}
PENDING APPROVALS: ${JSON.stringify(approvals?.map(a => ({ id: a.id, preview: a.preview_content })))}

Rules:
- Update task statuses to reflect actual progress
- Add blockers only when genuinely blocked — not speculatively
- Add approvals only for irreversible external actions (send/publish/pay/delete)
- Add questions only when you need something you cannot infer
- Create artifacts when you produce actual content
- Be specific in your reply — reference what you've done or what changed
- Always explain what happens next`,
    prompt: userMessage,
    schema: BoardUpdateSchema,
  });

  // Apply all board updates — Supabase returns PromiseLike (PostgrestFilterBuilder), not full Promise
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const writes: PromiseLike<any>[] = [];

  // Map the LLM's board vocabulary to the actual duo_tasks status CHECK values.
  const TASK_STATUS_MAP: Record<string, string> = {
    pending: 'pending', working: 'running', done: 'completed', blocked: 'blocked', skipped: 'skipped',
  };

  if (update.task_updates?.length) {
    for (const tu of update.task_updates) {
      const dbStatus = TASK_STATUS_MAP[tu.status] ?? 'pending';
      writes.push(
        supabase.from('duo_tasks').update({
          status: dbStatus,
          ...(dbStatus === 'completed' ? { completed_at: new Date().toISOString() } : {}),
          updated_at: new Date().toISOString(),
        }).eq('id', tu.task_id).eq('project_id', projectId)
      );
      writes.push(
        supabase.from('duo_timeline_events').insert({
          project_id: projectId, user_id: userId, task_id: tu.task_id,
          event_type: dbStatus === 'completed' ? 'task_done' : dbStatus === 'blocked' ? 'task_blocked' : 'task_started',
          message: `Task ${dbStatus}: ${tu.detail || ''}`,
        })
      );
    }
  }

  if (update.new_questions?.length) {
    writes.push(supabase.from('duo_questions').insert(
      update.new_questions.map(q => ({
        project_id: projectId, user_id: userId, task_id: q.task_id ?? null,
        question: q.prompt, reason: q.subtext ?? null, status: 'open',
      }))
    ));
  }

  if (update.new_blockers?.length) {
    writes.push(supabase.from('duo_blockers').insert(
      update.new_blockers.map(b => ({
        project_id: projectId, user_id: userId, task_id: b.task_id ?? null,
        blocker_type: b.blocker_type, description: b.reason || b.title,
        severity: 'medium', status: 'open',
      }))
    ));
  }

  if (update.new_approvals?.length) {
    writes.push(supabase.from('duo_approvals').insert(
      update.new_approvals.map(a => ({
        project_id: projectId, user_id: userId, task_id: a.task_id ?? null,
        approval_type: 'external_action', status: 'requested',
        preview_content: a.action_summary, platform: a.platform ?? null,
        risk_level: a.risk_level, reversible: a.is_reversible,
        warning_message: a.if_denied ?? null,
        metadata: { title: a.title, payload_preview: a.payload_preview, if_approved: a.if_approved, if_denied: a.if_denied },
      }))
    ));
    writes.push(supabase.from('duo_timeline_events').insert({
      project_id: projectId, user_id: userId,
      event_type: 'approval_requested',
      message: `Approval needed: ${update.new_approvals[0].title}`,
    }));
  }

  if (update.new_artifacts?.length) {
    writes.push(supabase.from('duo_artifacts').insert(
      update.new_artifacts.map(a => ({
        project_id: projectId, user_id: userId, task_id: a.task_id ?? null,
        artifact_type: a.artifact_type, title: a.title,
        content: a.content ?? null, url: a.external_url ?? null,
      }))
    ));
    writes.push(supabase.from('duo_timeline_events').insert({
      project_id: projectId, user_id: userId,
      event_type: 'artifact_created',
      message: `Artifact: ${update.new_artifacts[0].title}`,
    }));
  }

  if (update.resolve_blocker_ids?.length) {
    writes.push(supabase.from('duo_blockers').update({
      status: 'resolved', resolved_at: new Date().toISOString(),
    }).in('id', update.resolve_blocker_ids));
  }

  if (update.timeline_note) {
    writes.push(supabase.from('duo_timeline_events').insert({
      project_id: projectId, user_id: userId,
      event_type: 'agent_note',
      message: update.timeline_note.slice(0, 200),
    }));
  }

  await Promise.all(writes);

  return Response.json({ reply: update.reply });
}
