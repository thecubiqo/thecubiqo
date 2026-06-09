import { NextRequest, NextResponse } from 'next/server';
import { missingMigrationResponse, requireApiUser, safeTableMissing } from '../../_lib/supabase-admin';
import { ACTION_TYPES, normalizePayload, normalizeToolName, writeAudit } from '../../_lib/v2-actions';

const settingsSelect = 'id,tool_name,enabled,action_types,metadata,created_at,updated_at';

function normalizeActionTypes(value: unknown) {
  const raw = Array.isArray(value) ? value : [];
  return [...new Set(raw.map(item => String(item || '').trim()).filter(item => ACTION_TYPES.includes(item as any)))];
}

function mapSetting(row: Record<string, any>) {
  return {
    id: row.id,
    toolName: row.tool_name,
    enabled: Boolean(row.enabled),
    actionTypes: Array.isArray(row.action_types) ? row.action_types : [],
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const { data, error } = await auth.supabase
    .from('user_tool_settings')
    .select(settingsSelect)
    .eq('user_id', auth.user.id)
    .order('tool_name', { ascending: true });

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('v2-actions', 'user_tool_settings');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: (data || []).map(mapSetting) });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const toolName = normalizeToolName(body.toolName ?? body.tool_name, '');
  if (!toolName) return NextResponse.json({ error: 'toolName is required' }, { status: 400 });

  const enabled = body.enabled === true;
  const actionTypes = normalizeActionTypes(body.actionTypes ?? body.action_types);
  const metadata = normalizePayload(body.metadata);

  const { data, error } = await auth.supabase
    .from('user_tool_settings')
    .upsert({
      user_id: auth.user.id,
      tool_name: toolName,
      enabled,
      action_types: actionTypes,
      metadata
    }, { onConflict: 'user_id,tool_name' })
    .select(settingsSelect)
    .single();

  if (error) {
    if (safeTableMissing(error)) return missingMigrationResponse('v2-actions', 'user_tool_settings');
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAudit(auth, {
    actionType: 'approval_status',
    toolName,
    status: 'completed',
    message: `Tool ${enabled ? 'enabled' : 'disabled'} by user setting`,
    input: { actionTypes },
    result: { enabled }
  });

  return NextResponse.json({ setting: mapSetting(data) });
}
