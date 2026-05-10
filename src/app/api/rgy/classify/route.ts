import { NextRequest, NextResponse } from 'next/server';
import { capsuleOnly, classifyRgyActivity, type RgyClassification } from '@/next/lib/rgy/classifier';
import { missingMigrationResponse, requireApiUser, safeTableMissing } from '../../_lib/supabase-admin';

export const runtime = 'nodejs';
export const maxDuration = 30;

const signalSelect =
  'id,signal_id,user_id,color,keyword,normalized_keyword,intent_status,suggested_intents,confirmed_intents,matching_enabled,confidence,shown_in_panel,editable_by_user,source,display_state,metadata,created_at,updated_at,corrected_at,raw_input';

type AuthenticatedApiUser = Awaited<ReturnType<typeof requireApiUser>> & { error?: undefined };

function toNormalizedKeyword(keyword: string) {
  return keyword
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'signal';
}

function mapSignal(row: Record<string, any>) {
  return {
    id: row.id,
    signal_id: row.signal_id,
    color: row.color,
    keyword: row.keyword,
    normalized_keyword: row.normalized_keyword,
    intent_status: row.intent_status,
    suggested_intents: Array.isArray(row.suggested_intents) ? row.suggested_intents : [],
    confirmed_intents: Array.isArray(row.confirmed_intents) ? row.confirmed_intents : [],
    matching_enabled: Boolean(row.matching_enabled),
    confidence: row.confidence,
    shown_in_panel: row.shown_in_panel,
    editable_by_user: row.editable_by_user,
    source: row.source,
    display_state: row.display_state,
    metadata: row.metadata || {},
    created_at: row.created_at,
    updated_at: row.updated_at,
    corrected_at: row.corrected_at,
    raw_input: row.raw_input
  };
}

async function saveClassification(
  auth: AuthenticatedApiUser,
  input: string,
  result: RgyClassification
) {
  // The classifier may suggest intent, but never confirms intent and never
  // enables matching. The DB trigger enforces the same gate as a backstop.
  const payload = {
    user_id: auth.user.id,
    color: result.color,
    keyword: result.keyword,
    normalized_keyword: toNormalizedKeyword(result.keyword),
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

  const { data: existing, error: existingError } = await auth.supabase
    .from('signals')
    .select('id')
    .eq('user_id', auth.user.id)
    .eq('color', payload.color)
    .eq('normalized_keyword', payload.normalized_keyword)
    .neq('display_state', 'deleted')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError && !safeTableMissing(existingError)) {
    return { data: null, error: existingError };
  }

  if (existing?.id) {
    return auth.supabase
      .from('signals')
      .update(payload)
      .eq('id', existing.id)
      .eq('user_id', auth.user.id)
      .select(signalSelect)
      .single();
  }

  return auth.supabase
    .from('signals')
    .insert(payload)
    .select(signalSelect)
    .single();
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const input = String(body.input || '').trim();
  const bodyUserId = String(body.user_id || body.userId || '').trim();

  if (!input) {
    return NextResponse.json({ error: 'input is required' }, { status: 400 });
  }
  if (bodyUserId && bodyUserId !== auth.user.id) {
    return NextResponse.json({ error: 'user_id must match the authenticated user' }, { status: 403 });
  }

  const result = await classifyRgyActivity(input);

  // Safety stops are terminal by design: no Supabase row, no panel capsule.
  if ('status' in result) {
    return NextResponse.json(result);
  }

  const save = await saveClassification(auth, input, result);
  if (save.error) {
    if (safeTableMissing(save.error)) return missingMigrationResponse('rgy-classifier', 'signals');
    return NextResponse.json({ error: save.error.message }, { status: 500 });
  }

  const signal = mapSignal(save.data);
  return NextResponse.json({
    capsule: capsuleOnly(result),
    suggested_intents: result.suggested_intents,
    confirmed_intents: [],
    matching_enabled: false,
    confidence: result.confidence,
    reasoning: result.reasoning,
    source: result.source,
    age_gate_required: result.age_gate_required,
    signal
  });
}
