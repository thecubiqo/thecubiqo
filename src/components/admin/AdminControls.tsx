'use client';

/**
 * Admin Controls Provider
 * 
 * Provides admin UI controls across the application.
 * Only renders for admin users with elevated controls enabled.
 */

import { DebugView, ImpersonationView, ConfirmationBypassBadge } from '@/components/admin';

export function AdminControls() {
  return (
    <>
      <DebugView />
      <ImpersonationView />
      <ConfirmationBypassBadge />
    </>
  );
}
