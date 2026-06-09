export type SecurityEventType =
  | 'auth_failure'
  | 'rate_limit_exceeded'
  | 'injection_attempt'
  | 'suspicious_payload'
  | 'token_reuse'
  | 'ip_blocked'
  | 'admin_action'
  | 'data_export'
  | 'file_blocked'
  | 'network_anomaly'
  | 'unexpected_process'
  | 'hash_match_threat'
  | 'mime_spoof'
  | 'budget_exceeded'
  | 'rls_violation'
  | 'cron_unauthorized'
  | 'output_flagged';

export type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityEvent {
  id: string;
  userId: string | null;
  eventType: SecurityEventType;
  severity: ThreatSeverity;
  ipAddress: string | null;
  userAgent: string | null;
  payload: Record<string, unknown>;
  resolvedAt: string | null;
  createdAt: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}
