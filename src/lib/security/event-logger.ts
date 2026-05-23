import { getSupabaseAdmin } from '@/next/app/api/_lib/supabase-admin';
import type { SecurityEventType, ThreatSeverity } from '@/next/types/security';

export interface LogSecurityEventArgs {
  userId?: string | null;
  eventType: SecurityEventType;
  severity: ThreatSeverity;
  ipAddress?: string | null;
  userAgent?: string | null;
  surfaceType?: string | null;
  actionTaken?: string | null;
  payload?: Record<string, unknown>;
}

async function hashIpAddress(ipAddress?: string | null): Promise<string | null> {
  if (!ipAddress || ipAddress === 'unknown') return null;
  try {
    const data = new TextEncoder().encode(ipAddress);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return ipAddress.slice(0, 12);
  }
}

export async function logSecurityEvent(args: LogSecurityEventArgs): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    await supabase.from('security_events').insert({
      user_id: args.userId ?? null,
      event_type: args.eventType,
      severity: args.severity,
      ip_address: await hashIpAddress(args.ipAddress),
      user_agent: args.userAgent ?? null,
      surface_type: args.surfaceType ?? 'web',
      action_taken: args.actionTaken ?? null,
      payload: args.payload ?? {},
    });

    if (args.severity === 'critical') {
      notifyAdmin(args).catch(() => {});
    }
  } catch {
    // Security logging must never break the user request path.
  }
}

async function notifyAdmin(args: LogSecurityEventArgs): Promise<void> {
  const webhook = process.env.SECURITY_ALERT_WEBHOOK;
  if (!webhook) return;

  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `CubiQo critical security event: ${args.eventType} from ${args.ipAddress ?? 'unknown IP'}`,
    }),
  }).catch(() => {});
}
