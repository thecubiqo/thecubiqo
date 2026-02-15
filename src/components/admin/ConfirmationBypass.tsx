'use client';

/**
 * Admin Confirmation Bypass Hook
 * 
 * Allows admins to bypass non-destructive confirmations.
 * Logs all bypassed confirmations to audit trail.
 */

import { useCallback } from 'react';
import { useAdmin } from '@/hooks';

export interface ConfirmationOptions {
  title: string;
  message: string;
  actionType?: 'default' | 'danger';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

/**
 * Hook to handle confirmations with optional admin bypass
 */
export function useAdminConfirmation() {
  const { isAdmin, elevatedControlsEnabled, logAction } = useAdmin();

  const confirm = useCallback(
    async (options: ConfirmationOptions): Promise<boolean> => {
      // Admin bypass for non-destructive actions
      const canBypass =
        isAdmin &&
        elevatedControlsEnabled &&
        options.actionType !== 'danger';

      if (canBypass) {
        // Log the bypass
        await logAction('confirmation_bypassed', {
          title: options.title,
          message: options.message,
          timestamp: new Date().toISOString(),
        });

        // Execute the action immediately
        await options.onConfirm();
        return true;
      }

      // For non-admins or danger actions, show confirmation dialog
      const confirmed = window.confirm(
        `${options.title}\n\n${options.message}`
      );

      if (confirmed) {
        await options.onConfirm();
        return true;
      } else {
        options.onCancel?.();
        return false;
      }
    },
    [isAdmin, elevatedControlsEnabled, logAction]
  );

  return {
    confirm,
    canBypassConfirmations: isAdmin && elevatedControlsEnabled,
  };
}

/**
 * Admin Confirmation Badge
 * Shows when confirmation bypass is active
 */
export function ConfirmationBypassBadge() {
  const { isAdmin, elevatedControlsEnabled } = useAdmin();

  if (!isAdmin || !elevatedControlsEnabled) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-yellow-500 text-black px-3 py-1 rounded-lg shadow-lg flex items-center gap-2 text-sm font-semibold">
        <span>⚡</span>
        <span>Confirmations Bypassed</span>
      </div>
    </div>
  );
}
