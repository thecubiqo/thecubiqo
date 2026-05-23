import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getBearerToken, getSupabaseAdmin } from '@/next/app/api/_lib/supabase-admin';
import type { QueuedAction } from '@/next/lib/surfaces/offline-queue';

export const runtime = 'nodejs';

const queuedActionSchema = z.object({
  idempotency_key: z.string().min(1).max(200),
  action_type: z.string().min(1).max(80),
  endpoint: z.string().min(1).max(300),
  method: z.enum(['POST', 'PATCH', 'PUT', 'DELETE']),
  payload: z.record(z.unknown()),
  queued_at: z.string().datetime(),
  attempt_count: z.number().int().min(0),
  last_error: z.string().nullable()
});

const syncSchema = z.object({
  actions: z.array(queuedActionSchema).max(50).default([])
});

interface SyncResponse {
  processed: number;
  failed: number;
  errors: Array<{ idempotency_key: string; error: string }>;
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  const token = getBearerToken(request);
  if (!token || !supabase) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = syncSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid sync payload' }, { status: 400 });
  }

  const { actions } = parsed.data as { actions: QueuedAction[] };
  if (!Array.isArray(actions) || actions.length === 0) {
    return NextResponse.json<SyncResponse>({ processed: 0, failed: 0, errors: [] });
  }

  const seen = new Set<string>();
  const deduped = actions.filter((action) => {
    if (seen.has(action.idempotency_key)) return false;
    seen.add(action.idempotency_key);
    return true;
  });

  let processed = 0;
  let failed = 0;
  const errors: Array<{ idempotency_key: string; error: string }> = [];

  for (const action of deduped) {
    try {
      await processAction(supabase, user.id, action);
      processed++;
    } catch (err) {
      failed++;
      errors.push({
        idempotency_key: action.idempotency_key,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }

  return NextResponse.json<SyncResponse>({ processed, failed, errors });
}

type SupabaseAdmin = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

async function processAction(
  supabase: SupabaseAdmin,
  userId: string,
  action: QueuedAction
): Promise<void> {
  switch (action.action_type) {
    case 'heartbeat':
      await processHeartbeat(supabase, userId, action);
      break;
    case 'task_status_update':
      await processTaskStatusUpdate(supabase, userId, action);
      break;
    case 'memory_write':
      await processMemoryWrite(supabase, userId, action);
      break;
    case 'artifact_write':
      await processArtifactWrite(supabase, userId, action);
      break;
    default:
      throw new Error(`Unknown action_type: ${action.action_type}`);
  }
}

async function processHeartbeat(
  supabase: SupabaseAdmin,
  userId: string,
  action: QueuedAction
): Promise<void> {
  const { surface_type, session_id, capabilities, device_id, app_version, os_platform } =
    action.payload as {
      surface_type: string;
      session_id: string;
      capabilities: Record<string, boolean>;
      device_id?: string;
      app_version?: string;
      os_platform?: string;
    };

  const { error } = await supabase.from('surface_sessions').upsert(
    {
      user_id: userId,
      surface_type,
      session_id,
      capabilities,
      device_id: device_id ?? null,
      app_version: app_version ?? null,
      os_platform: os_platform ?? null,
      last_heartbeat: action.queued_at,
      last_seen: action.queued_at,
      is_online: false,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'user_id,surface_type', ignoreDuplicates: false }
  );

  if (error) throw new Error(`Heartbeat sync failed: ${error.message}`);
}

async function processTaskStatusUpdate(
  supabase: SupabaseAdmin,
  userId: string,
  action: QueuedAction
): Promise<void> {
  const { task_id, status, error_message } = action.payload as {
    task_id: string;
    status: string;
    error_message?: string;
  };

  const { data: task } = await supabase
    .from('duo_tasks')
    .select('id, project_id')
    .eq('id', task_id)
    .maybeSingle();

  if (!task) throw new Error(`Task ${task_id} not found`);

  const { data: project } = await supabase
    .from('duo_projects')
    .select('id')
    .eq('id', task.project_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!project) throw new Error(`Access denied for task ${task_id}`);

  const { error } = await supabase
    .from('duo_tasks')
    .update({
      status,
      error_message: error_message ?? null,
      updated_at: new Date().toISOString()
    })
    .eq('id', task_id);

  if (error) throw new Error(`Task status update failed: ${error.message}`);
}

async function processMemoryWrite(
  supabase: SupabaseAdmin,
  userId: string,
  action: QueuedAction
): Promise<void> {
  const { event_type, summary, weight, signal_ids, expires_at } = action.payload as {
    event_type: string;
    summary: string;
    weight?: number;
    signal_ids?: string[];
    expires_at?: string | null;
  };

  const { error } = await supabase.from('memory_events').insert({
    user_id: userId,
    event_type,
    summary,
    weight: weight ?? 1,
    signal_ids: signal_ids ?? null,
    expires_at: expires_at ?? null,
    created_at: action.queued_at
  });

  if (error && error.code !== '23505') {
    throw new Error(`Memory write failed: ${error.message}`);
  }
}

async function processArtifactWrite(
  supabase: SupabaseAdmin,
  userId: string,
  action: QueuedAction
): Promise<void> {
  const { project_id, task_id, type, content, produced_by, storage_path, title } = action.payload as {
    project_id: string;
    task_id?: string;
    type: string;
    content: Record<string, unknown>;
    produced_by?: string;
    storage_path?: string;
    title?: string;
  };

  const { data: project } = await supabase
    .from('duo_projects')
    .select('id')
    .eq('id', project_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!project) throw new Error(`Access denied for project ${project_id}`);

  const { error } = await supabase.from('duo_artifacts').insert({
    user_id: userId,
    project_id,
    task_id: task_id ?? null,
    trace_id: crypto.randomUUID(),
    artifact_type: type,
    type,
    title: title ?? `Offline ${type} artifact`,
    content: JSON.stringify(content),
    metadata: content,
    produced_by: produced_by ?? 'offline_queue',
    storage_path: storage_path ?? null,
    consumed_by: [],
    created_at: action.queued_at
  });

  if (error && error.code !== '23505') {
    throw new Error(`Artifact write failed: ${error.message}`);
  }
}
