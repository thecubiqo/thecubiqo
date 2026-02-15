/**
 * Feature Flags Types
 * TypeScript definitions for Founders Pass feature flag system
 */

export type FeatureFlagScope = 'global' | 'site' | 'user';

export type FeatureFlagAction = 'created' | 'updated' | 'deleted' | 'toggled';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  scope: FeatureFlagScope;
  target_id: string | null;
  config: FeatureFlagConfig;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlagConfig {
  percentage?: number;              // Percentage rollout (0-100)
  user_whitelist?: string[];        // User IDs to always enable
  user_blacklist?: string[];        // User IDs to always disable
  start_date?: string;              // ISO date to start rollout
  end_date?: string;                // ISO date to end rollout
  environment?: string[];           // Environments to enable (e.g., ['production', 'staging'])
  metadata?: Record<string, any>;   // Additional metadata
}

export interface FeatureFlagAudit {
  id: string;
  flag_id: string | null;
  flag_name: string;
  action: FeatureFlagAction;
  changed_by: string | null;
  changes: {
    old?: Partial<FeatureFlag>;
    new?: Partial<FeatureFlag>;
  };
  metadata: Record<string, any>;
  created_at: string;
}

export interface FeatureFlagWebhook {
  id: string;
  flag_id: string | null;
  url: string;
  secret: string | null;
  enabled: boolean;
  events: string[];
  retry_config: {
    max_retries: number;
    backoff_ms: number;
  };
  created_at: string;
  updated_at: string;
}

export interface FeatureFlagWebhookLog {
  id: string;
  webhook_id: string | null;
  flag_id: string | null;
  url: string;
  event: string;
  payload: Record<string, any>;
  status_code: number | null;
  response_body: string | null;
  error: string | null;
  attempt_number: number;
  delivered_at: string;
}

export interface FeatureFlagCheckRequest {
  flag_name: string;
  user_id?: string;
  site_id?: string;
}

export interface FeatureFlagCheckResponse {
  enabled: boolean;
  flag?: FeatureFlag;
  reason?: string;
}

export interface FeatureFlagWebhookPayload {
  event: string;
  flag: FeatureFlag;
  timestamp: string;
  changed_by?: string;
  changes?: {
    old?: Partial<FeatureFlag>;
    new?: Partial<FeatureFlag>;
  };
}

export interface CreateFeatureFlagRequest {
  name: string;
  description?: string;
  enabled?: boolean;
  scope?: FeatureFlagScope;
  target_id?: string;
  config?: FeatureFlagConfig;
}

export interface UpdateFeatureFlagRequest {
  description?: string;
  enabled?: boolean;
  scope?: FeatureFlagScope;
  target_id?: string;
  config?: FeatureFlagConfig;
}
