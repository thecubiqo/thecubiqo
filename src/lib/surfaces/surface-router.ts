import { getSupabaseAdmin } from '@/next/app/api/_lib/supabase-admin';

export const HARD_BLOCK_CAPABILITIES = new Set(['local_files', 'shell', 'camera']);

export const CAPABILITY_FALLBACKS: Record<string, string | null> = {
  local_ai: 'cloud_ai',
  push_notify: 'notifications',
  auth_browser_session: null,
  headless_browser: null,
  api_connector: null,
  cloud_ai: null
};

const SURFACE_PRIORITY: Record<string, number> = {
  desktop: 100,
  web: 60,
  mobile: 40,
  extension: 50,
  cloud_browser: 30
};

export interface SurfaceSession {
  id: string;
  surface_type: string;
  session_id: string;
  device_id: string | null;
  capabilities: Record<string, boolean | string | string[]>;
  last_heartbeat: string;
  is_online: boolean;
}

export interface SurfaceRouterResult {
  surface: string;
  session_id: string;
  device_id: string | null;
  handoffRequired: boolean;
  score: number;
  explanation: string;
}

export interface UserConstraints {
  local_only?: boolean;
  cloud_only?: boolean;
  no_shell?: boolean;
  no_browser_automation?: boolean;
  approval_required?: boolean;
  dont_use_desktop?: boolean;
  preferred_device_id?: string;
}

export class SurfaceUnavailableError extends Error {
  public readonly requiredCapabilities: string[];
  public readonly onlineSurfaces: string[];

  constructor(requiredCapabilities: string[], onlineSurfaces: string[], message?: string) {
    super(
      message ??
        `No online surface can satisfy capabilities: [${requiredCapabilities.join(', ')}]. ` +
          `Online surfaces: [${onlineSurfaces.join(', ')}]`
    );
    this.name = 'SurfaceUnavailableError';
    this.requiredCapabilities = requiredCapabilities;
    this.onlineSurfaces = onlineSurfaces;
  }
}

export async function selectSurface(
  userId: string,
  requiresCapabilities: string[],
  userConstraints: UserConstraints = {},
  currentSurfaceType?: string
): Promise<SurfaceRouterResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase admin client unavailable');

  const thresholdIso = new Date(Date.now() - 60 * 1000).toISOString();

  const { data: sessions, error } = await supabase
    .from('surface_sessions')
    .select('id, surface_type, session_id, device_id, capabilities, last_heartbeat, is_online')
    .eq('user_id', userId)
    .eq('is_online', true)
    .gte('last_heartbeat', thresholdIso)
    .order('last_heartbeat', { ascending: false });

  if (error) {
    throw new Error(`Surface Router: failed to query surface_sessions: ${error.message}`);
  }

  const onlineSessions = (sessions ?? []) as SurfaceSession[];
  const onlineSurfaceTypes = [...new Set(onlineSessions.map((session) => session.surface_type))];

  const candidates = onlineSessions.filter((session) => {
    if (userConstraints.dont_use_desktop && session.surface_type === 'desktop') return false;
    if (userConstraints.cloud_only && session.surface_type === 'desktop') return false;
    if (
      userConstraints.preferred_device_id &&
      session.device_id &&
      session.device_id !== userConstraints.preferred_device_id
    ) {
      return false;
    }
    return true;
  });

  const effectiveCapabilities = requiresCapabilities.filter((capability) => {
    if (capability === 'shell' && userConstraints.no_shell) return false;
    if (capability === 'local_ai' && userConstraints.cloud_only) return false;
    return true;
  });

  const capable = candidates.filter((session) =>
    capabilitiesSatisfied(session.capabilities, effectiveCapabilities)
  );

  const hardBlockMissing = effectiveCapabilities.filter(
    (capability) =>
      HARD_BLOCK_CAPABILITIES.has(capability) &&
      !capable.some((session) => capabilityValue(session.capabilities, capability))
  );

  if (capable.length === 0 || hardBlockMissing.length > 0) {
    throw new SurfaceUnavailableError(
      hardBlockMissing.length > 0 ? hardBlockMissing : effectiveCapabilities,
      onlineSurfaceTypes
    );
  }

  const scored = capable.map((session) => ({
    session,
    score: computeScore(session, effectiveCapabilities, userConstraints)
  }));

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  const handoffRequired = Boolean(
    currentSurfaceType && best.session.surface_type !== currentSurfaceType
  );

  const skipped = candidates
    .filter((session) => !capable.includes(session))
    .map((session) => session.surface_type);

  return {
    surface: best.session.surface_type,
    session_id: best.session.session_id,
    device_id: best.session.device_id,
    handoffRequired,
    score: best.score,
    explanation:
      `Selected '${best.session.surface_type}' (score ${best.score.toFixed(2)}) ` +
      `for capabilities [${effectiveCapabilities.join(', ')}]. ` +
      (skipped.length ? `Skipped (capability gap): [${skipped.join(', ')}].` : '')
  };
}

function capabilitiesSatisfied(
  surfaceCaps: Record<string, boolean | string | string[]>,
  required: string[]
): boolean {
  return required.every((capability) => capabilityValue(surfaceCaps, capability));
}

function capabilityValue(caps: Record<string, boolean | string | string[]>, capability: string) {
  const value = caps[capability];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

function computeScore(
  session: SurfaceSession,
  requiredCaps: string[],
  constraints: UserConstraints
): number {
  let score = 0;

  const ageMs = Date.now() - new Date(session.last_heartbeat).getTime();
  score += Math.max(0, 30 * (1 - ageMs / 60_000));

  const totalCaps = Object.values(session.capabilities).filter(Boolean).length;
  score += Math.min(20, totalCaps * 1.5);

  const hasLocalAI = requiredCaps.includes('local_ai') || requiredCaps.includes('local_files');
  const priorityBase = SURFACE_PRIORITY[session.surface_type] ?? 20;
  score += hasLocalAI ? (priorityBase / 100) * 30 : (priorityBase / 100) * 15;

  if (constraints.preferred_device_id && session.device_id === constraints.preferred_device_id) {
    score += 20;
  }

  return score;
}

export async function assignSurfaceToTask(
  taskId: string,
  userId: string,
  userConstraints: UserConstraints = {},
  currentSurfaceType?: string
): Promise<SurfaceRouterResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase admin client unavailable');

  const { data: task, error } = await supabase
    .from('duo_tasks')
    .select('id, requires_capabilities, user_constraint')
    .eq('id', taskId)
    .maybeSingle();

  if (error || !task) {
    throw new Error(`assignSurfaceToTask: task ${taskId} not found`);
  }

  const caps = (task.requires_capabilities as string[]) ?? [];
  const effectiveConstraints: UserConstraints = { ...userConstraints };
  if (task.user_constraint === 'local_only') effectiveConstraints.local_only = true;
  if (task.user_constraint === 'no_shell') effectiveConstraints.no_shell = true;

  const result = await selectSurface(userId, caps, effectiveConstraints, currentSurfaceType);

  await supabase
    .from('duo_tasks')
    .update({
      assigned_surface: result.session_id,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId);

  return result;
}
