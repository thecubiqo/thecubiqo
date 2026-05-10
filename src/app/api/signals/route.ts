import { NextRequest, NextResponse } from 'next/server';
import { missingMigrationResponse, requireApiUser, safeTableMissing } from '../_lib/supabase-admin';

const COLORS = ['green', 'yellow', 'red'] as const;
const INTENTS = ['socialize', 'collaborate', 'trade'] as const;
const INTENT_STATUSES = ['pending', 'suggested', 'ambiguous', 'confirmed'] as const;

const signalSelect =
  'id,signal_id,color,keyword,normalized_keyword,intent_status,suggested_intents,confirmed_intents,matching_enabled,confidence,shown_in_panel,editable_by_user,source,display_state,metadata,created_at,updated_at,corrected_at,raw_input';

// This route is the panel/edit surface. Classification creation lives in
// /api/rgy/classify; corrections here update the existing signal and mark it
// as user_correction so future agents can tell machine reads from user edits.
function normalizeKeyword(value: unknown) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

function normalizeColor(value: unknown) {
  const color = String(value || '').toLowerCase();
  return COLORS.includes(color as (typeof COLORS)[number]) ? color : 'yellow';
}

function normalizeIntent(value: unknown) {
  const intent = String(value || '').trim().toLowerCase();
  return INTENTS.includes(intent as (typeof INTENTS)[number]) ? intent : null;
}

function normalizeIntentSet(value: unknown) {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(raw.map(normalizeIntent).filter((intent): intent is string => Boolean(intent)))];
}

function normalizeIntentStatus(value: unknown, confirmedIntents: string[], suggestedIntents: string[]) {
  const status = String(value || '').trim().toLowerCase();
  if (confirmedIntents.length) return 'confirmed';
  if (INTENT_STATUSES.includes(status as (typeof INTENT_STATUSES)[number])) return status;
  if (suggestedIntents.length > 1) return 'ambiguous';
  if (suggestedIntents.length === 1) return 'suggested';
  return 'pending';
}

function parseSignalPayload(body: Record<string, unknown>) {
  const keyword = normalizeKeyword(body.keyword);
  const suggestedIntents = normalizeIntentSet(body.suggestedIntents ?? body.suggested_intents);
  const confirmedIntents = normalizeIntentSet(body.confirmedIntents ?? body.confirmed_intents);
  const intentStatus = normalizeIntentStatus(body.intentStatus ?? body.intent_status, confirmedIntents, suggestedIntents);

  return {
    color: normalizeColor(body.color),
    keyword,
    normalized_keyword: keyword.replace(/\s+/g, '-'),
    intent_status: intentStatus,
    suggested_intents: suggestedIntents,
    confirmed_intents: confirmedIntents,
    matching_enabled: confirmedIntents.length > 0,
    source: String(body.source || 'conversation').trim().slice(0, 40) || 'conversation',
    display_state: body.displayState === 'hidden' ? 'hidden' : 'visible',
    shown_in_panel: body.shownInPanel === false || body.shown_in_panel === false ? false : true,
    editable_by_user: body.editableByUser === false || body.editable_by_user === false ? false : true,
    confidence: typeof body.confidence === 'number' ? body.confidence : null,
    raw_input: typeof body.rawInput === 'string' ? body.rawInput : typeof body.raw_input === 'string' ? body.raw_input : null,
    metadata: typeof body.metadata === 'object' && body.metadata ? body.metadata : {}
  };
}

function mapSignal(row: Record<string, any>) {
  const confirmedIntents = Array.isArray(row.confirmed_intents) ? row.confirmed_intents : [];
  const suggestedIntents = Array.isArray(row.suggested_intents) ? row.suggested_intents : [];
  return {
    id: row.id,
    signal_id: row.signal_id,
    color: row.color,
    keyword: row.keyword,
    normalizedKeyword: row.normalized_keyword,
    intentStatus: row.intent_status,
    intent_status: row.intent_status,
    // Keep camelCase and snake_case during the transition: existing React code
    // consumes snake_case, while some older API callers still expect camelCase.
    suggestedIntents,
    suggested_intents: suggestedIntents,
    confirmedIntents,
    confirmed_intents: confirmedIntents,
    matchingEnabled: Boolean(row.matching_enabled),
    matching_enabled: Boolean(row.matching_enabled),
    confidence: row.confidence,
    shown_in_panel: row.shown_in_panel,
    editable_by_user: row.editable_by_user,
    source: row.source,
    displayState: row.display_state,
    display_state: row.display_state,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at,
    corrected_at: row.corrected_at,
    raw_input: row.raw_input
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 24), 50);
  const { data, error } = await auth.supabase
    .from('signals')
    .select(signalSelect)
    .eq('user_id', auth.user.id)
    .neq('display_state', 'deleted')
    .eq('shown_in_panel', true)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('rgy-signals', 'signals');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ signals: (data || []).map(mapSignal) });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const payload = parseSignalPayload(body);
  if (!payload.keyword) {
    return NextResponse.json({ error: 'Signal keyword is required' }, { status: 400 });
  }

  const existing = await auth.supabase
    .from('signals')
    .select('id')
    .eq('user_id', auth.user.id)
    .eq('color', payload.color)
    .eq('normalized_keyword', payload.normalized_keyword)
    .neq('display_state', 'deleted')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.error && safeTableMissing(existing.error)) return missingMigrationResponse('rgy-signals', 'signals');
  if (existing.error) return NextResponse.json({ error: existing.error.message }, { status: 500 });

  const query = existing.data?.id
    ? auth.supabase
      .from('signals')
      .update({
        ...payload,
        source: payload.source === 'user_correction' ? 'user_correction' : payload.source
      })
      .eq('id', existing.data.id)
      .eq('user_id', auth.user.id)
    : auth.supabase
      .from('signals')
      .insert({
        ...payload,
        user_id: auth.user.id
      });

  const { data, error } = await query
    .select(signalSelect)
    .single();

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('rgy-signals', 'signals');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ signal: mapSignal(data) }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const id = String(body.id || '').trim();
  if (!id) return NextResponse.json({ error: 'Signal id is required' }, { status: 400 });

  const payload = {
    ...parseSignalPayload(body),
    source: 'user_correction',
    corrected_at: new Date().toISOString()
  };
  const { data, error } = await auth.supabase
    .from('signals')
    .update(payload)
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select(signalSelect)
    .single();

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('rgy-signals', 'signals');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ signal: mapSignal(data) });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const id = String(body.id || request.nextUrl.searchParams.get('id') || '').trim();
  if (!id) return NextResponse.json({ error: 'Signal id is required' }, { status: 400 });

  const { error } = await auth.supabase
    .from('signals')
    .update({ display_state: 'deleted' })
    .eq('id', id)
    .eq('user_id', auth.user.id);

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('rgy-signals', 'signals');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
