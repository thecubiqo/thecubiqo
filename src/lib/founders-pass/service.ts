// Founders Pass: Feature flag service (CRUD + resolution + caching)

import type {
  FeatureFlag,
  FlagOverride,
  Site,
  AuditLogEntry,
  ActionTemplate,
  FeatureEvent,
  IntegrationConfig,
  EventType,
} from './types';

// ---------------------------------------------------------------------------
// In-memory cache (Redis replacement for dev / edge)
// ---------------------------------------------------------------------------
const flagCache = new Map<string, { data: FeatureFlag[]; ts: number }>();
const CACHE_TTL_MS = 5_000; // 5-second TTL for preview propagation

function getCachedFlags(cacheKey: string): FeatureFlag[] | null {
  const entry = flagCache.get(cacheKey);
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) return entry.data;
  return null;
}

function setCachedFlags(cacheKey: string, data: FeatureFlag[]) {
  flagCache.set(cacheKey, { data, ts: Date.now() });
}

export function invalidateFlagCache() {
  flagCache.clear();
}

// ---------------------------------------------------------------------------
// Supabase client helper (service role for admin ops)
// ---------------------------------------------------------------------------
function getServiceClient() {
  // Dynamic import to avoid pulling Supabase into edge bundles unconditionally
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ---------------------------------------------------------------------------
// Feature Flags CRUD
// ---------------------------------------------------------------------------
export async function listFlags(): Promise<FeatureFlag[]> {
  const cached = getCachedFlags('all');
  if (cached) return cached;

  const sb = getServiceClient();
  const { data, error } = await sb
    .from('feature_flags')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`listFlags: ${error.message}`);
  setCachedFlags('all', data ?? []);
  return data ?? [];
}

export async function getFlag(id: string): Promise<FeatureFlag | null> {
  const sb = getServiceClient();
  const { data, error } = await sb.from('feature_flags').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function getFlagByKey(key: string): Promise<FeatureFlag | null> {
  const sb = getServiceClient();
  const { data, error } = await sb.from('feature_flags').select('*').eq('key', key).single();
  if (error) return null;
  return data;
}

export async function createFlag(
  flag: Omit<FeatureFlag, 'id' | 'created_at' | 'updated_at'>,
): Promise<FeatureFlag> {
  const sb = getServiceClient();
  const { data, error } = await sb.from('feature_flags').insert(flag).select().single();
  if (error) throw new Error(`createFlag: ${error.message}`);
  invalidateFlagCache();
  return data;
}

export async function updateFlag(
  id: string,
  patch: Partial<Omit<FeatureFlag, 'id' | 'created_at'>>,
): Promise<FeatureFlag> {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from('feature_flags')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`updateFlag: ${error.message}`);
  invalidateFlagCache();
  return data;
}

export async function deleteFlag(id: string): Promise<void> {
  const sb = getServiceClient();
  const { error } = await sb.from('feature_flags').delete().eq('id', id);
  if (error) throw new Error(`deleteFlag: ${error.message}`);
  invalidateFlagCache();
}

// ---------------------------------------------------------------------------
// Flag overrides (per-site / per-user)
// ---------------------------------------------------------------------------
export async function setFlagOverride(
  flagId: string,
  opts: { siteId?: string; userId?: string; enabled: boolean },
): Promise<FlagOverride> {
  const sb = getServiceClient();
  const payload = {
    flag_id: flagId,
    site_id: opts.siteId ?? null,
    user_id: opts.userId ?? null,
    enabled: opts.enabled,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await sb
    .from('flag_overrides')
    .upsert(payload, { onConflict: 'flag_id,site_id,user_id' })
    .select()
    .single();
  if (error) throw new Error(`setFlagOverride: ${error.message}`);
  invalidateFlagCache();
  return data;
}

export async function getFlagOverrides(flagId: string): Promise<FlagOverride[]> {
  const sb = getServiceClient();
  const { data, error } = await sb.from('flag_overrides').select('*').eq('flag_id', flagId);
  if (error) throw new Error(`getFlagOverrides: ${error.message}`);
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Resolve effective flag value for a site + user
// ---------------------------------------------------------------------------
export async function resolveFlag(
  flagKey: string,
  opts?: { siteId?: string; userId?: string },
): Promise<boolean> {
  const flag = await getFlagByKey(flagKey);
  if (!flag) return false;

  const sb = getServiceClient();

  // Check user-level override first
  if (opts?.userId) {
    const { data: userOverride } = await sb
      .from('flag_overrides')
      .select('enabled')
      .eq('flag_id', flag.id)
      .eq('user_id', opts.userId)
      .maybeSingle();
    if (userOverride) return userOverride.enabled;
  }

  // Check site-level override
  if (opts?.siteId) {
    const { data: siteOverride } = await sb
      .from('flag_overrides')
      .select('enabled')
      .eq('flag_id', flag.id)
      .eq('site_id', opts.siteId)
      .is('user_id', null)
      .maybeSingle();
    if (siteOverride) return siteOverride.enabled;
  }

  // Fall back to global default
  return flag.default_value;
}

// Resolve all flags for a site (for the feature panel)
export async function resolveFlagsForSite(
  siteId: string,
  userId?: string,
): Promise<Record<string, boolean>> {
  const flags = await listFlags();
  const result: Record<string, boolean> = {};
  for (const flag of flags) {
    result[flag.key] = await resolveFlag(flag.key, { siteId, userId });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Sites CRUD
// ---------------------------------------------------------------------------
export async function listSites(): Promise<Site[]> {
  const sb = getServiceClient();
  const { data, error } = await sb.from('sites').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(`listSites: ${error.message}`);
  return data ?? [];
}

export async function getSite(id: string): Promise<Site | null> {
  const sb = getServiceClient();
  const { data, error } = await sb.from('sites').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function getSiteBySlug(slug: string): Promise<Site | null> {
  const sb = getServiceClient();
  const { data, error } = await sb.from('sites').select('*').eq('slug', slug).single();
  if (error) return null;
  return data;
}

export async function createSite(
  site: Omit<Site, 'id' | 'created_at' | 'updated_at'>,
): Promise<Site> {
  const sb = getServiceClient();
  const { data, error } = await sb.from('sites').insert(site).select().single();
  if (error) throw new Error(`createSite: ${error.message}`);
  return data;
}

export async function updateSite(
  id: string,
  patch: Partial<Omit<Site, 'id' | 'created_at'>>,
): Promise<Site> {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from('sites')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`updateSite: ${error.message}`);
  return data;
}

export async function deleteSite(id: string): Promise<void> {
  const sb = getServiceClient();
  const { error } = await sb.from('sites').delete().eq('id', id);
  if (error) throw new Error(`deleteSite: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Action Templates CRUD
// ---------------------------------------------------------------------------
export async function listActionTemplates(): Promise<ActionTemplate[]> {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from('action_templates')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`listActionTemplates: ${error.message}`);
  return data ?? [];
}

export async function createActionTemplate(
  tpl: Omit<ActionTemplate, 'id' | 'created_at' | 'updated_at'>,
): Promise<ActionTemplate> {
  const sb = getServiceClient();
  const { data, error } = await sb.from('action_templates').insert(tpl).select().single();
  if (error) throw new Error(`createActionTemplate: ${error.message}`);
  return data;
}

export async function updateActionTemplate(
  id: string,
  patch: Partial<Omit<ActionTemplate, 'id' | 'created_at'>>,
): Promise<ActionTemplate> {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from('action_templates')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`updateActionTemplate: ${error.message}`);
  return data;
}

// ---------------------------------------------------------------------------
// Integration Configs
// ---------------------------------------------------------------------------
export async function listIntegrations(siteId: string): Promise<IntegrationConfig[]> {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from('integration_configs')
    .select('*')
    .eq('site_id', siteId);
  if (error) throw new Error(`listIntegrations: ${error.message}`);
  return data ?? [];
}

export async function upsertIntegration(
  siteId: string,
  provider: string,
  config: Partial<IntegrationConfig>,
): Promise<IntegrationConfig> {
  const sb = getServiceClient();
  const payload = {
    site_id: siteId,
    provider,
    ...config,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await sb
    .from('integration_configs')
    .upsert(payload, { onConflict: 'site_id,provider' })
    .select()
    .single();
  if (error) throw new Error(`upsertIntegration: ${error.message}`);
  return data;
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------
export async function writeAuditLog(entry: Omit<AuditLogEntry, 'id' | 'created_at'>): Promise<void> {
  const sb = getServiceClient();
  await sb.from('audit_log').insert(entry);
}

export async function listAuditLog(limit = 50): Promise<AuditLogEntry[]> {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`listAuditLog: ${error.message}`);
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Events / Analytics
// ---------------------------------------------------------------------------
export async function emitEvent(event: {
  siteId?: string;
  userId?: string;
  eventType: EventType;
  eventData?: Record<string, unknown>;
}): Promise<void> {
  const sb = getServiceClient();
  await sb.from('feature_events').insert({
    site_id: event.siteId ?? null,
    user_id: event.userId ?? null,
    event_type: event.eventType,
    event_data: event.eventData ?? {},
  });
}

export async function listEvents(opts?: {
  siteId?: string;
  eventType?: string;
  limit?: number;
}): Promise<FeatureEvent[]> {
  const sb = getServiceClient();
  let q = sb.from('feature_events').select('*').order('created_at', { ascending: false });
  if (opts?.siteId) q = q.eq('site_id', opts.siteId);
  if (opts?.eventType) q = q.eq('event_type', opts.eventType);
  q = q.limit(opts?.limit ?? 100);
  const { data, error } = await q;
  if (error) throw new Error(`listEvents: ${error.message}`);
  return data ?? [];
}
