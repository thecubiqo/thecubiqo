import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { ClassifyOutcome, ClassifyResult, MemoryEventType, PermissionState } from '@/next/types/cubiqo';
import { classifyRgyActivity, capsuleOnly, type RgyClassification } from '@/next/lib/rgy/classifier';
import { getBearerToken, getSupabaseAdmin, safeTableMissing } from '../../_lib/supabase-admin';
import { canWriteSignalColor } from '../../_lib/rgy-age-gate';
import { guardPermission } from '@/next/lib/agent/permission-guard';

export const runtime = 'nodejs';
export const maxDuration = 30;

const FRESHNESS_RE = /\b(latest|current|news|price today|right now|today|what'?s happening|this morning|this week|as of now|recent)\b/i;
const JOURNAL_RE = /\b(journal|diary|reflect|reflection|mood|felt|feeling)\b/i;
const COMMITMENT_RE = /\b(i will|i'll|i am going to|i'm going to|by (monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|tonight|next week)|deadline|commit|committed)\b/i;
const BLOCKER_RE = /\b(stuck|blocked|blocker|overwhelmed|confused|can't decide|cannot decide|struggling|problem|issue)\b/i;
const PREFERENCE_RE = /\b(i prefer|i like|i hate|i usually|works for me|doesn't work for me|my style|i want you to)\b/i;
const GOAL_RE = /\b(i want to|i need to|my goal|trying to|planning to|launch|build|create|start|ship|apply|learn)\b/i;

const signalSelect =
  'id,signal_id,user_id,color,keyword,normalized_keyword,intent_status,suggested_intents,confirmed_intents,matching_enabled,confidence,shown_in_panel,editable_by_user,source,display_state,metadata,created_at,updated_at,corrected_at,raw_input';

const understandBodySchema = z.object({
  input: z.string().max(8000).optional(),
  text: z.string().max(8000).optional(),
  message: z.string().max(8000).optional(),
  source: z.string().max(80).optional(),
  permissions: z.record(z.enum(['granted', 'denied', 'pending'])).optional(),
  visual_context: z.unknown().optional(),
  structured_context: z.unknown().optional(),
}).passthrough();

type AuthedContext =
  | { status: 'anonymous'; supabase: ReturnType<typeof getSupabaseAdmin>; user: null }
  | { status: 'authenticated'; supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>; user: { id: string; email?: string | null } };

type PermissionPatch = Partial<Record<'mic' | 'camera' | 'memory' | 'location' | 'push' | 'tracking', PermissionState>>;

function normalizeKeyword(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'signal';
}

function cleanKeyword(value: unknown) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

function extractKeywords(input: string) {
  return [...new Set(
    input
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 12)
  )];
}

function emotionalTone(input: string): ClassifyResult['emotionalTone'] {
  const lower = input.toLowerCase();
  if (/\b(stuck|blocked|lost|confused|overwhelmed|tired)\b/.test(lower)) return 'stuck';
  if (/\b(frustrated|angry|annoyed|upset|hate)\b/.test(lower)) return 'frustrated';
  if (/\b(excited|great|love|ready|let'?s go)\b/.test(lower)) return 'excited';
  if (/\b(why|how|what|curious|wondering)\b/.test(lower)) return 'curious';
  return 'neutral';
}

function memoryEventType(input: string): MemoryEventType {
  if (COMMITMENT_RE.test(input)) return 'commitment';
  if (BLOCKER_RE.test(input)) return 'blocker';
  if (PREFERENCE_RE.test(input)) return 'preference';
  if (GOAL_RE.test(input)) return 'goal_update';
  return 'session_summary';
}

function memorySummary(input: string) {
  return input.trim().replace(/\s+/g, ' ').slice(0, 800);
}

function shouldWriteMemory(input: string) {
  return COMMITMENT_RE.test(input) || BLOCKER_RE.test(input) || PREFERENCE_RE.test(input) || GOAL_RE.test(input);
}

function isOnboardingCandidate(input: string, onboardingDone: boolean, explicit: boolean) {
  if (onboardingDone && !explicit) return false;
  return explicit || GOAL_RE.test(input) || BLOCKER_RE.test(input);
}

function classifyOutcome(input: string, onboardingDone: boolean, explicitOnboarding: boolean, rgy: RgyClassification): ClassifyOutcome {
  if (JOURNAL_RE.test(input)) return 'journal_insight';
  if (isOnboardingCandidate(input, onboardingDone, explicitOnboarding)) return 'onboarding_fact';
  if (rgy.confidence >= 0.7 && rgy.keyword && !/ambiguous/i.test(rgy.keyword)) return 'rgy_signal';
  if (shouldWriteMemory(input)) return 'memory_update';
  return 'conversation';
}

async function getAuthContext(request: NextRequest): Promise<AuthedContext> {
  const supabase = getSupabaseAdmin();
  const token = getBearerToken(request);
  if (!supabase || !token) return { status: 'anonymous', supabase, user: null };

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { status: 'anonymous', supabase, user: null };

  return {
    status: 'authenticated',
    supabase,
    user: {
      id: data.user.id,
      email: data.user.email || null
    }
  };
}

async function readProfile(auth: AuthedContext) {
  if (auth.status !== 'authenticated') return null;
  const { data, error } = await auth.supabase
    .from('profiles')
    .select('id,onboarding_done,primary_goal,goal_domain,language_preference,timezone,city,country,last_seen_at,visit_count')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (error && !safeTableMissing(error)) {
    console.warn('[understand-classify] profile read failed:', error.message);
  }
  return data || null;
}

async function upsertPermissions(auth: AuthedContext, permissions: PermissionPatch) {
  if (auth.status !== 'authenticated') return null;
  const allowed = Object.fromEntries(
    Object.entries(permissions)
      .filter((entry): entry is [keyof PermissionPatch, PermissionState] =>
        ['mic', 'camera', 'memory', 'location', 'push', 'tracking'].includes(entry[0]) &&
        ['granted', 'denied', 'pending'].includes(String(entry[1]))
      )
  );
  if (!Object.keys(allowed).length) return null;

  const now = new Date().toISOString();
  const stampEntries = Object.entries(allowed)
    .filter(([, value]) => value === 'granted')
    .map(([key]) => [`${key}_granted_at`, now]);

  const { data, error } = await auth.supabase
    .from('user_permissions')
    .upsert({
      user_id: auth.user.id,
      ...allowed,
      ...Object.fromEntries(stampEntries),
      updated_at: now
    }, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) return { error: error.message };
  return data;
}

async function writeMemory(auth: AuthedContext, input: string, outcome: ClassifyOutcome) {
  if (auth.status !== 'authenticated') return null;
  const eventType = outcome === 'journal_insight' ? 'journal_insight' : memoryEventType(input);
  const { data, error } = await auth.supabase
    .from('memory_events')
    .insert({
      user_id: auth.user.id,
      event_type: eventType,
      summary: memorySummary(input),
      keywords: extractKeywords(input),
      weight: eventType === 'goal_update' || eventType === 'episode' ? 3 : eventType === 'commitment' || eventType === 'blocker' ? 2 : 1,
      signal_ids: null
    })
    .select('id,event_type,summary,keywords,weight,created_at')
    .single();

  if (error) return { error: error.message };
  return data;
}

async function bootstrapOnboarding(auth: AuthedContext, input: string) {
  if (auth.status !== 'authenticated') return null;
  const keywords = extractKeywords(input);
  const primaryGoal = cleanKeyword(input).slice(0, 160);
  const goalDomain = inferDomain(input);
  const now = new Date().toISOString();

  const [profileResult, aiProfileResult, memoryResult] = await Promise.all([
    auth.supabase
      .from('profiles')
      .update({
        primary_goal: primaryGoal,
        goal_domain: goalDomain,
        onboarding_done: true,
        onboarding_summary: memorySummary(input),
        last_seen_at: now
      })
      .eq('id', auth.user.id)
      .select('id,primary_goal,goal_domain,onboarding_done')
      .single(),
    auth.supabase
      .from('user_ai_profile')
      .upsert({
        user_id: auth.user.id,
        primary_drive: primaryGoal,
        current_phase: 'early_context_collection',
        communication_style: 'unknown',
        open_loops: keywords.slice(0, 6),
        session_count: 1,
        last_updated: now
      }, { onConflict: 'user_id' })
      .select('user_id,primary_drive,current_phase,open_loops,last_updated')
      .single(),
    auth.supabase
      .from('memory_events')
      .insert({
        user_id: auth.user.id,
        event_type: 'goal_update',
        summary: memorySummary(input),
        keywords,
        weight: 3,
        signal_ids: null
      })
      .select('id,event_type,summary,created_at')
      .single()
  ]);

  return {
    profile: profileResult.error ? { error: profileResult.error.message } : profileResult.data,
    user_ai_profile: aiProfileResult.error ? { error: aiProfileResult.error.message } : aiProfileResult.data,
    memory: memoryResult.error ? { error: memoryResult.error.message } : memoryResult.data
  };
}

async function saveSignal(auth: AuthedContext, input: string, result: RgyClassification) {
  if (auth.status !== 'authenticated') return null;
  // HARD RULE: red signals are only written for age-confirmed adults.
  // If red and not confirmed, persist nothing (the capsule is still returned).
  if (!(await canWriteSignalColor(auth.supabase, auth.user.id, result.color))) return null;
  const normalized = normalizeKeyword(result.keyword);
  const payload = {
    user_id: auth.user.id,
    color: result.color,
    keyword: result.keyword,
    normalized_keyword: normalized,
    intent_status: result.intent_status,
    suggested_intents: result.color === 'red' ? [] : result.suggested_intents,
    confirmed_intents: [],
    matching_enabled: false,
    confidence: result.confidence,
    shown_in_panel: true,
    editable_by_user: true,
    source: result.source,
    display_state: 'visible',
    raw_input: input,
    metadata: {
      reasoning: result.reasoning,
      age_gate_required: result.age_gate_required
    }
  };

  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data: existing, error: existingError } = await auth.supabase
    .from('signals')
    .select('id')
    .eq('user_id', auth.user.id)
    .eq('color', result.color)
    .eq('normalized_keyword', normalized)
    .gte('created_at', thirtyMinAgo)
    .neq('display_state', 'deleted')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError && !safeTableMissing(existingError)) return { error: existingError.message };

  const query = existing?.id
    ? auth.supabase.from('signals').update(payload).eq('id', existing.id).eq('user_id', auth.user.id)
    : auth.supabase.from('signals').insert(payload);

  const { data, error } = await query.select(signalSelect).single();
  if (error) return { error: error.message };
  return data;
}

function inferDomain(input: string) {
  const lower = input.toLowerCase();
  if (/\b(job|career|resume|interview|apply)\b/.test(lower)) return 'career';
  if (/\b(shopify|pod|printify|store|ecommerce|product)\b/.test(lower)) return 'ecommerce';
  if (/\b(content|marketing|post|social)\b/.test(lower)) return 'marketing';
  if (/\b(startup|business|launch|founder)\b/.test(lower)) return 'startup';
  if (/\b(health|gym|wellness|yoga|meditation)\b/.test(lower)) return 'health';
  return 'general';
}

function responseResult(
  outcome: ClassifyOutcome,
  input: string,
  rgy: RgyClassification,
  freshnessNeeded: boolean
): ClassifyResult {
  return {
    outcome,
    color: outcome === 'rgy_signal' ? rgy.color : undefined,
    keyword: outcome === 'rgy_signal' ? rgy.keyword : undefined,
    confidence: outcome === 'rgy_signal' ? rgy.confidence : shouldWriteMemory(input) ? 0.76 : 0.52,
    freshnessNeeded,
    emotionalTone: emotionalTone(input),
    riskLevel: rgy.age_gate_required || rgy.color === 'red' ? 'medium' : 'low',
    intentSummary: memorySummary(input).slice(0, 220)
  };
}

export async function POST(request: NextRequest) {
  const parsed = understandBodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid classify payload', issues: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;
  const input = String(body.input || body.message || '').trim();
  if (!input) {
    return NextResponse.json({ error: 'input is required' }, { status: 400 });
  }

  const auth = await getAuthContext(request);
  const profile = await readProfile(auth);
  const permissions = body.permissions && typeof body.permissions === 'object'
    ? await upsertPermissions(auth, body.permissions as PermissionPatch)
    : null;

  const rgy = await classifyRgyActivity(input, auth.supabase || undefined);
  if ('status' in rgy) {
    return NextResponse.json({
      status: rgy.status,
      outcome: 'conversation',
      safety: rgy,
      stored: false,
      permissions
    });
  }

  const freshnessNeeded = FRESHNESS_RE.test(input);
  const outcome = classifyOutcome(input, Boolean(profile?.onboarding_done), Boolean(body.onboarding), rgy);
  const result = responseResult(outcome, input, rgy, freshnessNeeded);

  const writes: Record<string, unknown> = {};
  if (outcome === 'memory_update' || outcome === 'journal_insight') {
    // ── Permission gate: check memory permission before writing ──────────────
    const userId = auth.status === 'authenticated' ? auth.user.id : null;
    const memDenied = await guardPermission(auth.supabase, userId, 'memory');
    if (!memDenied) {
      writes.memory = await writeMemory(auth, input, outcome);
    } else {
      writes.memory = { skipped: true, reason: 'memory_permission_denied' };
    }
  }
  if (outcome === 'onboarding_fact') {
    writes.onboarding = await bootstrapOnboarding(auth, input);
  }
  if (outcome === 'rgy_signal') {
    writes.signal = await saveSignal(auth, input, rgy);
  }

  return NextResponse.json({
    ...result,
    authenticated: auth.status === 'authenticated',
    capsule: outcome === 'rgy_signal' ? capsuleOnly(rgy) : null,
    suggested_intents: outcome === 'rgy_signal' ? rgy.suggested_intents : [],
    freshness: {
      needed: freshnessNeeded,
      liveSearchShouldRun: freshnessNeeded
    },
    writes,
    permissions
  });
}
