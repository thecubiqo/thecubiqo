/**
 * Permission Guard — enforces user_permissions before any sensor, memory, or external access.
 *
 * Phase A doc mandates: permission check fires BEFORE sensors or memory operations.
 * This module provides a single checkPermission() function used at the top of every
 * route that touches mic, camera, memory, location, push, tracking, browser, or file.
 *
 * Usage:
 *   const guard = await checkPermission(supabase, userId, 'memory');
 *   if (!guard.allowed) return guard.response; // 403 with reason
 */

import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export type PermissionKey =
  | 'mic'
  | 'camera'
  | 'memory'
  | 'location'
  | 'push'
  | 'tracking'
  | 'browser_access'
  | 'file_access'
  | 'external_app_access';

// DB columns map (browser_access, file_access, external_app_access are logical guards
// backed by the 'tracking' column or user_connectors — no separate DB column needed for now)
const DB_COLUMN_MAP: Partial<Record<PermissionKey, string>> = {
  mic:        'mic',
  camera:     'camera',
  memory:     'memory',
  location:   'location',
  push:       'push',
  tracking:   'tracking',
};

type GuardAllowed = { allowed: true };
type GuardBlocked = { allowed: false; reason: string; permission: PermissionKey; response: NextResponse };

export type PermissionGuardResult = GuardAllowed | GuardBlocked;

/**
 * Check a single permission for a user.
 * - Returns { allowed: true } if granted or if DB is unreachable (fail-open for UX).
 * - Returns { allowed: false, response } if explicitly denied or if 'pending' and strict=true.
 *
 * @param supabase  Supabase admin client
 * @param userId    Authenticated user ID
 * @param permission  The permission to check
 * @param strict    If true, 'pending' (not yet asked) is treated as denied. Default false.
 */
export async function checkPermission(
  supabase: SupabaseClient | null,
  userId: string | null | undefined,
  permission: PermissionKey,
  strict = false
): Promise<PermissionGuardResult> {
  // Unauthenticated users — block memory writes, allow reads
  if (!userId || !supabase) {
    if (['memory', 'mic', 'camera', 'location', 'file_access', 'external_app_access'].includes(permission)) {
      return denied(permission, 'Authentication required for this operation');
    }
    return { allowed: true };
  }

  const dbColumn = DB_COLUMN_MAP[permission];

  // Permissions without a DB column (browser_access, file_access, external_app_access)
  // are gated by connector presence — check user_connectors instead
  if (!dbColumn) {
    if (permission === 'browser_access') {
      // Browser access: allowed if any connector has browser capability, or BROWSERBASE keys set
      const hasBrowserbase = !!(process.env.BROWSERBASE_API_KEY && process.env.BROWSERBASE_PROJECT_ID);
      if (!hasBrowserbase) {
        return denied(permission, 'Browser access is not configured for this account');
      }
      return { allowed: true };
    }
    if (permission === 'file_access' || permission === 'external_app_access') {
      // These rely on connector presence — always allowed at this layer; connectors handle their own auth
      return { allowed: true };
    }
    return { allowed: true };
  }

  try {
    const { data, error } = await supabase
      .from('user_permissions')
      .select(dbColumn)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      // No row = permissions never set. For sensitive sensors (strict callers,
      // e.g. camera/mic/location), fail CLOSED — a missing grant must not read as
      // permission. Non-strict UX permissions keep the don't-block-new-users path.
      if (strict) return denied(permission, `${permission} permission has not been granted`);
      return { allowed: true };
    }

    const state = String((data as unknown as Record<string, unknown>)[dbColumn] ?? 'pending');

    if (state === 'granted') return { allowed: true };
    if (state === 'denied') return denied(permission, `${permission} permission was explicitly denied`);
    // 'pending' = never asked
    if (strict) return denied(permission, `${permission} permission has not been granted`);
    // Non-strict: pending = allowed (first-time UX — we ask in the UI, don't hard-block the API)
    return { allowed: true };

  } catch {
    // DB error: fail CLOSED for strict (sensitive) callers, fail-open otherwise.
    if (strict) return denied(permission, `${permission} permission check failed`);
    return { allowed: true };
  }
}

function denied(permission: PermissionKey, reason: string): GuardBlocked {
  return {
    allowed: false,
    permission,
    reason,
    response: NextResponse.json(
      { error: reason, permission, code: 'PERMISSION_DENIED' },
      { status: 403 }
    ),
  };
}

/**
 * Check multiple permissions at once. Returns the first denial or allowed if all pass.
 */
export async function checkPermissions(
  supabase: SupabaseClient | null,
  userId: string | null | undefined,
  permissions: PermissionKey[],
  strict = false
): Promise<PermissionGuardResult> {
  for (const perm of permissions) {
    const result = await checkPermission(supabase, userId, perm, strict);
    if (!result.allowed) return result;
  }
  return { allowed: true };
}

/**
 * Inline guard for use in route handlers. Returns the 403 response if blocked, null if allowed.
 *
 * Usage:
 *   const denied = await guardPermission(supabase, userId, 'memory');
 *   if (denied) return denied;
 */
export async function guardPermission(
  supabase: SupabaseClient | null,
  userId: string | null | undefined,
  permission: PermissionKey,
  strict = false
): Promise<NextResponse | null> {
  const result = await checkPermission(supabase, userId, permission, strict);
  return result.allowed ? null : result.response;
}
