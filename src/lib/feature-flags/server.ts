/**
 * Feature Flags Server Library
 * Server-side utilities for checking and managing feature flags
 */

import { createClient } from '@/lib/supabase/server';
import type {
  FeatureFlag,
  FeatureFlagCheckRequest,
  FeatureFlagCheckResponse,
  CreateFeatureFlagRequest,
  UpdateFeatureFlagRequest,
} from '@/types/feature-flags';

/**
 * Check if a feature flag is enabled for a given context
 */
export async function checkFeatureFlag(
  request: FeatureFlagCheckRequest
): Promise<FeatureFlagCheckResponse> {
  const supabase = await createClient();

  try {
    // Get the flag from database
    const { data: flag, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('name', request.flag_name)
      .single();

    if (error || !flag) {
      return {
        enabled: false,
        reason: 'Flag not found',
      };
    }

    // Master switch check
    if (!flag.enabled) {
      return {
        enabled: false,
        flag,
        reason: 'Flag is disabled',
      };
    }

    // Check scope
    if (flag.scope === 'global') {
      // Check percentage rollout
      const percentage = flag.config?.percentage ?? 100;
      
      if (percentage === 100) {
        return { enabled: true, flag };
      }

      // If user_id provided, use consistent hashing for percentage rollout
      if (request.user_id && percentage < 100) {
        const hash = simpleHash(request.user_id);
        const bucket = hash % 100;
        const enabled = bucket < percentage;
        
        return {
          enabled,
          flag,
          reason: enabled
            ? `User in rollout bucket (${bucket} < ${percentage})`
            : `User not in rollout bucket (${bucket} >= ${percentage})`,
        };
      }

      return { enabled: true, flag };
    }

    if (flag.scope === 'site') {
      const enabled = flag.target_id === request.site_id;
      return {
        enabled,
        flag,
        reason: enabled ? 'Site matches target' : 'Site does not match target',
      };
    }

    if (flag.scope === 'user') {
      const enabled = flag.target_id === request.user_id;
      return {
        enabled,
        flag,
        reason: enabled ? 'User matches target' : 'User does not match target',
      };
    }

    return {
      enabled: false,
      flag,
      reason: 'Unknown scope',
    };
  } catch (error) {
    console.error('Error checking feature flag:', error);
    return {
      enabled: false,
      reason: 'Error checking flag',
    };
  }
}

/**
 * Get all feature flags
 */
export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching feature flags:', error);
    return [];
  }

  return data as FeatureFlag[];
}

/**
 * Get a single feature flag by ID
 */
export async function getFeatureFlag(id: string): Promise<FeatureFlag | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching feature flag:', error);
    return null;
  }

  return data as FeatureFlag;
}

/**
 * Create a new feature flag
 */
export async function createFeatureFlag(
  request: CreateFeatureFlagRequest,
  created_by?: string
): Promise<{ data: FeatureFlag | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('feature_flags')
    .insert({
      name: request.name,
      description: request.description || null,
      enabled: request.enabled ?? false,
      scope: request.scope || 'global',
      target_id: request.target_id || null,
      config: request.config || {},
      created_by: created_by || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating feature flag:', error);
    return { data: null, error: error.message };
  }

  return { data: data as FeatureFlag, error: null };
}

/**
 * Update an existing feature flag
 */
export async function updateFeatureFlag(
  id: string,
  request: UpdateFeatureFlagRequest
): Promise<{ data: FeatureFlag | null; error: string | null }> {
  const supabase = await createClient();

  const updateData: any = {};
  if (request.description !== undefined) updateData.description = request.description;
  if (request.enabled !== undefined) updateData.enabled = request.enabled;
  if (request.scope !== undefined) updateData.scope = request.scope;
  if (request.target_id !== undefined) updateData.target_id = request.target_id;
  if (request.config !== undefined) updateData.config = request.config;

  const { data, error } = await supabase
    .from('feature_flags')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating feature flag:', error);
    return { data: null, error: error.message };
  }

  return { data: data as FeatureFlag, error: null };
}

/**
 * Delete a feature flag
 */
export async function deleteFeatureFlag(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('feature_flags')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting feature flag:', error);
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Toggle a feature flag on/off
 */
export async function toggleFeatureFlag(
  id: string,
  enabled: boolean
): Promise<{ data: FeatureFlag | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('feature_flags')
    .update({ enabled })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error toggling feature flag:', error);
    return { data: null, error: error.message };
  }

  return { data: data as FeatureFlag, error: null };
}

/**
 * Get audit logs for a feature flag
 */
export async function getFeatureFlagAuditLogs(flagId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('feature_flag_audit')
    .select('*')
    .order('created_at', { ascending: false });

  if (flagId) {
    query = query.eq('flag_id', flagId);
  }

  const { data, error } = await query.limit(100);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }

  return data;
}

/**
 * Simple hash function for consistent user bucketing
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
