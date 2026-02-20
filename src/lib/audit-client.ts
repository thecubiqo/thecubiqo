/**
 * Audit Logging Client Utility
 * 
 * Client-side utilities for logging admin actions.
 */

export type AuditActionType =
  | 'debug_view_accessed'
  | 'confirmation_bypassed'
  | 'impersonation_started'
  | 'impersonation_ended'
  | 'admin_dashboard_accessed'
  | 'sensitive_data_viewed';

/**
 * Client-side helper to log admin actions via API
 */
export async function logAdminActionClient(
  actionType: AuditActionType,
  actionDetails?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/admin/audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        actionType,
        actionDetails,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Client-side helper to fetch audit logs via API
 */
export async function getAuditLogsClient(options?: {
  limit?: number;
  offset?: number;
  actionType?: AuditActionType;
}): Promise<{ logs: any[]; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.actionType) params.append('actionType', options.actionType);

    const response = await fetch(`/api/admin/audit?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.text();
      return { logs: [], error };
    }

    const data = await response.json();
    return { logs: data.logs || [] };
  } catch (error) {

    return {
      logs: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
