/**
 * Capability Config — S4-G
 * DB-driven capability status/approval/endpoint with 5-min cache.
 * Insert a row in capability_overrides to unlock/lock/reroute — no deploy.
 *
 * Empty table = all defaults = identical to current hardcoded behaviour.
 */

interface CapabilityDefaults {
  status: string;
  approvalRequired: boolean;
  endpoint: string | null;
}

interface CapabilityOverride {
  capability: string;
  status: string | null;
  approval_required: boolean | null;
  endpoint: string | null;
}

interface CachedConfig {
  data: Record<string, CapabilityOverride>;
  loadedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let capabilityCache: CachedConfig | null = null;

async function loadCapabilityCache(supabase: any): Promise<Record<string, CapabilityOverride>> {
  if (capabilityCache && Date.now() - capabilityCache.loadedAt < CACHE_TTL_MS) {
    return capabilityCache.data;
  }

  try {
    const { data, error } = await supabase
      .from('capability_overrides')
      .select('capability, status, approval_required, endpoint');

    if (error || !data) {
      return capabilityCache?.data || {};
    }

    const indexed = Object.fromEntries(
      (data as CapabilityOverride[]).map(r => [r.capability, r])
    );
    capabilityCache = { data: indexed, loadedAt: Date.now() };
    return indexed;
  } catch {
    return capabilityCache?.data || {};
  }
}

export async function getCapabilityConfig(
  toolName: string,
  defaults: CapabilityDefaults,
  supabase: any
): Promise<CapabilityDefaults> {
  const overrides = await loadCapabilityCache(supabase);
  const override = overrides[toolName];

  return {
    status:           override?.status           ?? defaults.status,
    approvalRequired: override?.approval_required ?? defaults.approvalRequired,
    endpoint:         override?.endpoint          ?? defaults.endpoint,
  };
}

export function bustCapabilityCache() {
  capabilityCache = null;
}
