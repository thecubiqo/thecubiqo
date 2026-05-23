import { createClient } from '@supabase/supabase-js';

type SupabaseClient = any;

const cleanEnv = (...values: Array<string | undefined>) => {
  const value = values.find(Boolean);
  return value
    ? value.trim().replace(/^['"]|['"]$/g, '').replace(/\\r\\n|\\n|\\r/g, '').trim()
    : undefined;
};

const supabaseUrl = cleanEnv(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_URL
);
const serviceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

const INTENTS = ['socialize', 'collaborate', 'trade'] as const;
const COLORS = ['green', 'yellow', 'red'] as const;

type Intent = (typeof INTENTS)[number];
type SignalColor = (typeof COLORS)[number];

let cachedClient: SupabaseClient | null = null;

function adminClient() {
  if (!supabaseUrl || !serviceRoleKey) return null;
  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return cachedClient;
}

function safeTableMissing(error: { code?: string; message?: string } | null | undefined) {
  return Boolean(
    error &&
      (error.code === 'PGRST205' ||
        error.code === '42P01' ||
        /Could not find the table|relation .* does not exist/i.test(error.message || ''))
  );
}

async function authContext(authToken?: string) {
  const supabase = adminClient();
  if (!supabase) {
    return { status: 'blocked' as const, reason: 'Supabase server configuration is missing' };
  }
  if (!authToken) {
    return { status: 'auth_required' as const, reason: 'Sign in is required for user-owned context.' };
  }

  const { data, error } = await supabase.auth.getUser(authToken);
  if (error || !data.user) {
    return { status: 'auth_required' as const, reason: 'The current session is invalid or expired.' };
  }

  return {
    status: 'authenticated' as const,
    supabase,
    user: {
      id: data.user.id,
      email: data.user.email || null
    }
  };
}

function normalizeIntentSet(value: unknown) {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(raw
    .map(item => String(item || '').trim().toLowerCase())
    .filter((item): item is Intent => INTENTS.includes(item as Intent)))];
}

function normalizeColor(value: unknown): SignalColor {
  const color = String(value || '').trim().toLowerCase();
  return COLORS.includes(color as SignalColor) ? color as SignalColor : 'yellow';
}

function normalizeKeyword(value: unknown) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

function redactSensitiveText(value: string) {
  return value
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, '[redacted-openai-key]')
    .replace(/sb_secret_[A-Za-z0-9_-]{8,}/g, '[redacted-supabase-secret]')
    .replace(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g, '[redacted-jwt]')
    .slice(0, 4000);
}

function hasSensitiveText(value: string) {
  return /(sk-[A-Za-z0-9_-]{12,}|sb_secret_|BEGIN (RSA |OPENSSH |PRIVATE )?KEY|service_role|password\s*=)/i.test(value);
}

async function countRows(supabase: SupabaseClient, table: string, userId: string) {
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    return {
      count: null,
      missing: safeTableMissing(error),
      error: error.message
    };
  }

  return { count: count || 0, missing: false, error: null };
}

export async function dashboardSummary(authToken?: string) {
  const auth = await authContext(authToken);
  if (auth.status !== 'authenticated') return auth;

  const [conversations, keywords, signals, journals, tasks, reports] = await Promise.all([
    countRows(auth.supabase, 'conversation_events', auth.user.id),
    countRows(auth.supabase, 'user_activity_keywords', auth.user.id),
    countRows(auth.supabase, 'signals', auth.user.id),
    countRows(auth.supabase, 'journal_entries', auth.user.id),
    countRows(auth.supabase, 'user_tasks', auth.user.id),
    countRows(auth.supabase, 'daily_reports', auth.user.id)
  ]);

  return {
    status: 'completed',
    user: auth.user,
    stats: {
      conversations: conversations.count || 0,
      keywords: keywords.count || 0,
      signals: signals.count || 0,
      journals: journals.count || 0,
      tasks: tasks.count || 0,
      reports: reports.count || 0
    },
    warnings: [conversations, keywords, signals, journals, tasks, reports]
      .filter(item => item.error)
      .map(item => item.error)
  };
}

export async function journalRead(authToken?: string, limit = 5) {
  const auth = await authContext(authToken);
  if (auth.status !== 'authenticated') return auth;

  const { data, error } = await auth.supabase
    .from('journal_entries')
    .select('id,title,content,mood,tags,rgy_color,word_count,created_at,updated_at')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 10));

  if (error) {
    return safeTableMissing(error)
      ? { status: 'blocked', reason: 'journal_entries table is not available yet' }
      : { status: 'failed', error: error.message };
  }

  return {
    status: 'completed',
    entries: (data || []).map((entry: any) => ({
      ...entry,
      content: String(entry.content || '').slice(0, 1200)
    }))
  };
}

export async function journalWriteSummary(
  authToken: string | undefined,
  input: { title?: string; summary: string; tags?: string[] }
) {
  const auth = await authContext(authToken);
  if (auth.status !== 'authenticated') return auth;

  const summary = redactSensitiveText(String(input.summary || '').trim());
  if (!summary) return { status: 'blocked', reason: 'Journal summary is empty' };
  if (hasSensitiveText(input.summary)) {
    return { status: 'blocked', reason: 'Journal summary looked like it contained credentials or secrets' };
  }

  const tags = Array.isArray(input.tags)
    ? input.tags.map(tag => String(tag).trim().toLowerCase()).filter(Boolean).slice(0, 10)
    : ['guided-summary'];

  const { data, error } = await auth.supabase
    .from('journal_entries')
    .insert({
      user_id: auth.user.id,
      title: String(input.title || 'CubiQo Journal Summary').slice(0, 120),
      content: summary,
      responses: [],
      rgy_color: 'yellow',
      mood: null,
      tags,
      word_count: summary.split(/\s+/).filter(Boolean).length,
      metadata: {
        source: 'agent_v1_journal_summary',
        write_scope: 'user_owned_journal'
      }
    })
    .select('id,title,created_at')
    .single();

  if (error) {
    return safeTableMissing(error)
      ? { status: 'blocked', reason: 'journal_entries table is not available yet' }
      : { status: 'failed', error: error.message };
  }

  return { status: 'completed', entry: data };
}

export async function rgySignalRead(authToken?: string, limit = 12) {
  const auth = await authContext(authToken);
  if (auth.status !== 'authenticated') return auth;

  const { data, error } = await auth.supabase
    .from('signals')
    .select('id,color,keyword,intent_status,suggested_intents,confirmed_intents,source,created_at,updated_at')
    .eq('user_id', auth.user.id)
    .neq('display_state', 'deleted')
    .order('updated_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 25));

  if (error) {
    return safeTableMissing(error)
      ? { status: 'blocked', reason: 'signals table is not available yet' }
      : { status: 'failed', error: error.message };
  }

  return { status: 'completed', signals: data || [] };
}

export async function rgySignalWrite(
  authToken: string | undefined,
  input: {
    color: string;
    keyword: string;
    suggestedIntents?: string[];
    confirmedIntents?: string[];
  }
) {
  const auth = await authContext(authToken);
  if (auth.status !== 'authenticated') return auth;

  const keyword = normalizeKeyword(input.keyword);
  if (!keyword) return { status: 'blocked', reason: 'RGY keyword is required' };

  const suggestedIntents = normalizeIntentSet(input.suggestedIntents);
  const confirmedIntents = normalizeIntentSet(input.confirmedIntents);
  const intentStatus = confirmedIntents.length
    ? 'confirmed'
    : suggestedIntents.length > 1
      ? 'ambiguous'
      : suggestedIntents.length === 1
        ? 'suggested'
        : 'pending';

  const { data, error } = await auth.supabase
    .from('signals')
    .insert({
      user_id: auth.user.id,
      color: normalizeColor(input.color),
      keyword,
      normalized_keyword: keyword.replace(/\s+/g, '-'),
      intent_status: intentStatus,
      suggested_intents: suggestedIntents,
      confirmed_intents: confirmedIntents,
      source: 'agent_v1',
      display_state: 'visible',
      metadata: {
        capsule: ['color', 'keyword', 'intent'],
        matching_enabled: confirmedIntents.length > 0
      }
    })
    .select('id,color,keyword,intent_status,suggested_intents,confirmed_intents,created_at')
    .single();

  if (error) {
    return safeTableMissing(error)
      ? { status: 'blocked', reason: 'signals table is not available yet' }
      : { status: 'failed', error: error.message };
  }

  return { status: 'completed', signal: data };
}

export async function memoryRead(authToken?: string, limit = 6) {
  const auth = await authContext(authToken);
  if (auth.status !== 'authenticated') return auth;

  const { data: subscription } = await auth.supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', auth.user.id)
    .maybeSingle();
  const proMemory = subscription?.status === 'active' || subscription?.status === 'trialing';
  const maxLimit = proMemory ? 50 : 5;

  const { data, error } = await auth.supabase
    .from('memory_events')
    .select('id,event_type,summary,keywords,weight,created_at')
    .eq('user_id', auth.user.id)
    .is('archived_at', null)
    .is('deleted_at', null)
    .order('weight', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), maxLimit));

  if (error) {
    return safeTableMissing(error)
      ? { status: 'blocked', reason: 'memory_events table is not available yet' }
      : { status: 'failed', error: error.message };
  }

  return {
    status: 'completed',
    memory: (data || []).map((item: any) => ({
      ...item,
      summary: String(item.summary || '').slice(0, 800)
    }))
  };
}

export async function memoryWriteSafeSummary(authToken: string | undefined, summaryInput: string) {
  const auth = await authContext(authToken);
  if (auth.status !== 'authenticated') return auth;

  const summary = redactSensitiveText(String(summaryInput || '').trim());
  if (!summary) return { status: 'blocked', reason: 'Memory summary is empty' };
  if (hasSensitiveText(summaryInput)) {
    return { status: 'blocked', reason: 'Memory summary looked like it contained credentials or secrets' };
  }

  const { data, error } = await auth.supabase
    .from('memory_events')
    .insert({
      user_id: auth.user.id,
      event_type: 'session_summary',
      summary,
      keywords: ['memory'],
      weight: 1,
      signal_ids: null
    })
    .select('id,created_at')
    .single();

  if (error) {
    return safeTableMissing(error)
      ? { status: 'blocked', reason: 'memory_events table is not available yet' }
      : { status: 'failed', error: error.message };
  }

  return { status: 'completed', memory: data };
}

export function taskPlanCreate(input: { goal: string; horizon?: string }) {
  const goal = String(input.goal || '').trim().slice(0, 500);
  const horizon = String(input.horizon || 'next 7 days').trim().slice(0, 80);
  return {
    status: 'completed',
    persisted: false,
    plan: {
      goal,
      horizon,
      steps: [
        'Clarify the target outcome and constraints.',
        'Split the work into the smallest useful next actions.',
        'Identify which actions are V1 planning versus V2 approved execution.',
        'Prepare artifacts or checklists before any external submission/post/send action.',
        'Review results and update the plan.'
      ]
    }
  };
}

export function contentBriefCreate(input: { topic: string; channel?: string; audience?: string }) {
  const topic = String(input.topic || '').trim().slice(0, 500);
  const channel = String(input.channel || 'social/content').trim().slice(0, 80);
  const audience = String(input.audience || 'target customers').trim().slice(0, 120);

  return {
    status: 'completed',
    externalActionTaken: false,
    brief: {
      topic,
      channel,
      audience,
      angle: 'Lead with the concrete user problem, then show the practical outcome.',
      creativeDirection: [
        'Use one clear offer or promise per asset.',
        'Keep the visual prompt specific enough for GFXTools or image generation.',
        'Prepare variants for awareness, proof, and conversion.'
      ],
      deliverables: [
        '1 hero concept',
        '3 hooks',
        '3 caption/ad variants',
        '1 call-to-action',
        'tracking notes for follow-up'
      ],
      v2ExecutionNeeds: [
        'GFXTools or creative API credentials',
        'approval before creating external jobs',
        'approval before scheduling or posting'
      ]
    }
  };
}

export async function duoProjectCreate(
  authToken: string | undefined,
  input: { title: string; domain: string; successCriteria?: string[]; metadata?: any }
) {
  const auth = await authContext(authToken);
  if (auth.status !== 'authenticated') return auth;

  const { data, error } = await auth.supabase
    .from('duo_projects')
    .insert({
      user_id: auth.user.id,
      goal: input.title,
      title: input.title,
      domain: input.domain,
      status: 'planning',
      success_criteria: input.successCriteria || [],
      goal_interpretation: {
        goal: input.title,
        domain: input.domain,
        source: 'agent_tool'
      },
      metadata: input.metadata || {}
    })
    .select('id,trace_id,goal,title,created_at')
    .single();

  if (error) {
    return safeTableMissing(error)
      ? { status: 'blocked', reason: 'duo_projects table is not available yet' }
      : { status: 'failed', error: error.message };
  }

  return { status: 'completed', project: data };
}

export async function duoTaskCreate(
  authToken: string | undefined,
  input: { 
    projectId: string; 
    traceId: string; 
    title: string; 
    description?: string; 
    routePreference?: string[];
    dependencies?: string[];
    approvalRequired?: boolean;
  }
) {
  const auth = await authContext(authToken);
  if (auth.status !== 'authenticated') return auth;

  const { data, error } = await auth.supabase
    .from('duo_tasks')
    .insert({
      project_id: input.projectId,
      user_id: auth.user.id,
      trace_id: input.traceId,
      title: input.title,
      description: input.description,
      status: 'pending',
      route_preference: input.routePreference || [],
      preferred_route: input.routePreference?.[0] || null,
      dependencies: input.dependencies || [],
      approval_required: input.approvalRequired || false,
      risk_level: input.approvalRequired ? 'high' : 'low',
      idempotency_key: `${input.projectId}:${input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    })
    .select('id,created_at')
    .single();

  if (error) {
    return safeTableMissing(error)
      ? { status: 'blocked', reason: 'duo_tasks table is not available yet' }
      : { status: 'failed', error: error.message };
  }

  return { status: 'completed', task: data };
}

export async function duoTaskUpdate(
  authToken: string | undefined,
  taskId: string,
  updates: { 
    status?: string; 
    assignedRoute?: string; 
    evidence?: any; 
    result?: string;
    metadata?: any;
  }
) {
  const auth = await authContext(authToken);
  if (auth.status !== 'authenticated') return auth;

  const { data, error } = await auth.supabase
    .from('duo_tasks')
    .update({
      ...(updates.status !== undefined ? { status: updates.status } : {}),
      ...(updates.assignedRoute !== undefined ? { assigned_route: updates.assignedRoute, selected_route: updates.assignedRoute } : {}),
      ...(updates.evidence !== undefined ? { evidence: updates.evidence } : {}),
      ...(updates.result !== undefined ? { result: updates.result } : {}),
      ...(updates.metadata !== undefined ? { metadata: updates.metadata } : {}),
      ...(updates.status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .eq('user_id', auth.user.id)
    .select('id,status,updated_at')
    .single();

  if (error) {
    return { status: 'failed', error: error.message };
  }

  return { status: 'completed', task: data };
}

export async function duoTimelineLog(
  authToken: string | undefined,
  input: {
    projectId: string;
    traceId: string;
    eventType: string;
    message: string;
    payload?: any;
  }
) {
  const auth = await authContext(authToken);
  if (auth.status !== 'authenticated') return auth;

  const { data, error } = await auth.supabase
    .from('duo_timeline_events')
    .insert({
      user_id: auth.user.id,
      project_id: input.projectId,
      trace_id: input.traceId,
      event_type: input.eventType,
      message: input.message,
      description: input.message,
      metadata: input.payload || {},
      payload: input.payload || {}
    })
    .select('id,created_at')
    .single();

  if (error) {
    return { status: 'failed', error: error.message };
  }

  return { status: 'completed', event: data };
}
