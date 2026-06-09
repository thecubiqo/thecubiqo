import type { AgentAuth } from './common';

export async function listConnectorReadiness(auth: AgentAuth) {
  const [{ data: connectors }, { data: candidates }, { data: capabilities }] = await Promise.all([
    auth.supabase
      .from('user_connectors')
      .select('id,platform,status,auth_type,scopes,metadata,last_checked_at,created_at,updated_at')
      .eq('user_id', auth.user.id)
      .order('platform'),
    auth.supabase
      .from('tool_candidates')
      .select('id,platform,tool_name,reason,status,metadata,created_at')
      .or(`user_id.eq.${auth.user.id},user_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(20),
    auth.supabase
      .from('tool_capabilities')
      .select('platform,action,route_type,risk_level,requires_approval,description')
      .order('platform')
  ]);

  return {
    connectors: connectors || [],
    candidates: candidates || [],
    capabilities: capabilities || []
  };
}

export async function markConnectorNeedsAuth(auth: AgentAuth, platform: string, reason = 'User authorization required') {
  const { data, error } = await auth.supabase
    .from('user_connectors')
    .upsert({
      user_id: auth.user.id,
      platform,
      status: 'needs_auth',
      auth_type: 'oauth',
      metadata: { reason },
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,platform' })
    .select('*')
    .single();

  if (error) return { status: 'failed' as const, reason: error.message };
  return { status: 'completed' as const, connector: data };
}
