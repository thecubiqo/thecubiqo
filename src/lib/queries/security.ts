/**
 * Security Query Utilities
 * 
 * Shared query logic for security-related database operations.
 * Removes duplication across admin security routes.
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface SecurityAlert {
  id: string
  alert_type: string
  user_id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  metadata?: Record<string, unknown>
  resolved: boolean
  created_at: string
  resolved_at?: string
}

export interface SecurityAlertsOptions {
  userId?: string
  alertType?: string
  severity?: string[]
  resolved?: boolean
  limit?: number
  offset?: number
}

/**
 * Get security alerts with optional filtering
 */
export async function getSecurityAlerts(
  supabase: SupabaseClient,
  options: SecurityAlertsOptions = {}
): Promise<{ data: SecurityAlert[]; error?: string }> {
  try {
    let query = supabase
      .from('security_alerts')
      .select('*')
      .order('created_at', { ascending: false })

    if (options.userId) {
      query = query.eq('user_id', options.userId)
    }

    if (options.alertType) {
      query = query.eq('alert_type', options.alertType)
    }

    if (options.severity && options.severity.length > 0) {
      query = query.in('severity', options.severity)
    }

    if (options.resolved !== undefined) {
      query = query.eq('resolved', options.resolved)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch security alerts:', error)
      return { data: [], error: error.message }
    }

    return { data: data || [] }
  } catch (error) {
    console.error('Exception while fetching security alerts:', error)
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get failed login attempts (filtered security alerts)
 */
export async function getFailedLogins(
  supabase: SupabaseClient,
  options: Omit<SecurityAlertsOptions, 'alertType'> = {}
): Promise<{ data: SecurityAlert[]; error?: string }> {
  return getSecurityAlerts(supabase, {
    ...options,
    alertType: 'failed_login',
  })
}

/**
 * Get security alerts for a specific user
 */
export async function getUserSecurityAlerts(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 50
): Promise<{ data: SecurityAlert[]; error?: string }> {
  return getSecurityAlerts(supabase, {
    userId,
    limit,
  })
}

/**
 * Mark security alert as resolved
 */
export async function resolveSecurityAlert(
  supabase: SupabaseClient,
  alertId: string,
  resolvedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('security_alerts')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
      })
      .eq('id', alertId)

    if (error) {
      console.error('Failed to resolve security alert:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Exception while resolving security alert:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
