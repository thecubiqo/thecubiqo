'use client';

/**
 * useAdmin Hook
 * Provides admin-specific functionality and state
 */

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { isFeatureEnabled } from '@/config/feature-flags';
import { logAdminActionClient, type AuditActionType } from '@/lib/audit-client';

export interface AdminState {
  isAdmin: boolean;
  elevatedControlsEnabled: boolean;
  auditLoggingEnabled: boolean;
}

export function useAdmin() {
  const { profile, isLoading, isAuthenticated } = useAuth();
  const [state, setState] = useState<AdminState>({
    isAdmin: false,
    elevatedControlsEnabled: false,
    auditLoggingEnabled: false,
  });

  useEffect(() => {
    const isAdmin = !!profile?.is_admin;
    const elevatedControlsEnabled = isAdmin && isFeatureEnabled('ADMIN_ELEVATED_CONTROLS');
    const auditLoggingEnabled = isAdmin && isFeatureEnabled('ADMIN_AUDIT_LOGGING');

    setState({
      isAdmin,
      elevatedControlsEnabled,
      auditLoggingEnabled,
    });
  }, [profile]);

  /**
   * Log an admin action to the audit trail
   */
  const logAction = async (
    actionType: AuditActionType,
    actionDetails?: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!state.isAdmin || !state.auditLoggingEnabled) {
      return { success: false, error: 'Not authorized or audit logging disabled' };
    }

    return logAdminActionClient(actionType, actionDetails);
  };

  return {
    ...state,
    isLoading,
    isAuthenticated,
    logAction,
  };
}
