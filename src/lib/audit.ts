/**
 * Audit Logging Server Utility
 * 
 * Server-side utilities for logging admin actions to the audit_logs table.
 * All admin actions should be logged for security and compliance.
 */

import { createClient } from '@/lib/supabase/server';

export type AuditActionType =
  | 'debug_view_accessed'
  | 'confirmation_bypassed'
  | 'impersonation_started'
  | 'impersonation_ended'
  | 'admin_dashboard_accessed'
  | 'sensitive_data_viewed'
  | 'view_integration_health'
  | 'update_integration_health'
  | 'view_integrations'
  | 'generate_report'
  | 'view_reports';

export interface AuditLogData {
  userId: string;
  userEmail: string;
  actionType: AuditActionType;
  actionDetails?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Server-side: Log a privileged admin action to the audit table
 */
export async function logAdminAction(data: AuditLogData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    // Call the database function to log the action
    const { data: result, error } = await supabase.rpc('log_admin_action', {
      p_user_id: data.userId,
      p_user_email: data.userEmail,
      p_action_type: data.actionType,
      p_action_details: (data.actionDetails || {}) as any,
      p_ip_address: data.ipAddress || undefined,
      p_user_agent: data.userAgent || undefined,
    });

    if (error) {
      console.error('Failed to log admin action:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception while logging admin action:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Server-side: Get audit logs for a specific user (admin only)
 */
export async function getAuditLogs(options?: {
  userId?: string;
  actionType?: AuditActionType;
  limit?: number;
  offset?: number;
}): Promise<{ logs: any[]; error?: string }> {
  try {
    const supabase = await createClient();
    
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options?.actionType) {
      query = query.eq('action_type', options.actionType);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch audit logs:', error);
      return { logs: [], error: error.message };
    }

    return { logs: data || [] };
  } catch (error) {
    console.error('Exception while fetching audit logs:', error);
    return { 
      logs: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
