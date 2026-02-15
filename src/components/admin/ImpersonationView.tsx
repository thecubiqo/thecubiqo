'use client';

/**
 * Admin Impersonation View Component
 * 
 * Allows admins to view sessions in read-only mode for debugging.
 * Does NOT allow making changes - strictly read-only.
 * All access is logged to audit trail.
 */

import { useState, useCallback } from 'react';
import { useAdmin } from '@/hooks';

interface ImpersonationState {
  isImpersonating: boolean;
  targetUserId: string | null;
  targetEmail: string | null;
}

export function ImpersonationView() {
  const { isAdmin, elevatedControlsEnabled, logAction } = useAdmin();
  const [state, setState] = useState<ImpersonationState>({
    isImpersonating: false,
    targetUserId: null,
    targetEmail: null,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [userIdInput, setUserIdInput] = useState('');

  const canImpersonate = isAdmin && elevatedControlsEnabled;

  const startImpersonation = useCallback(
    async (userId: string, email?: string) => {
      if (!canImpersonate) return;

      // Log the start of impersonation
      await logAction('impersonation_started', {
        targetUserId: userId,
        targetEmail: email || 'unknown',
        timestamp: new Date().toISOString(),
      });

      setState({
        isImpersonating: true,
        targetUserId: userId,
        targetEmail: email || null,
      });

      setIsOpen(false);
    },
    [canImpersonate, logAction]
  );

  const stopImpersonation = useCallback(async () => {
    if (!canImpersonate) return;

    // Log the end of impersonation
    await logAction('impersonation_ended', {
      targetUserId: state.targetUserId,
      targetEmail: state.targetEmail,
      timestamp: new Date().toISOString(),
    });

    setState({
      isImpersonating: false,
      targetUserId: null,
      targetEmail: null,
    });
  }, [canImpersonate, logAction, state.targetUserId, state.targetEmail]);

  if (!canImpersonate) {
    return null;
  }

  return (
    <>
      {/* Impersonation Banner */}
      {state.isImpersonating && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">👁️</span>
            <div>
              <div className="font-bold">Read-Only Impersonation Active</div>
              <div className="text-sm opacity-90">
                Viewing: {state.targetEmail || state.targetUserId}
              </div>
            </div>
          </div>
          <button
            onClick={stopImpersonation}
            className="bg-white text-red-600 px-4 py-1 rounded font-semibold hover:bg-gray-100 transition-colors"
          >
            Exit Impersonation
          </button>
        </div>
      )}

      {/* Impersonation Control Button */}
      {!state.isImpersonating && (
        <div className="fixed top-20 right-4 z-50">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
            title="Admin Impersonation View"
          >
            <span className="text-lg">👁️</span>
            <span>Impersonate</span>
          </button>

          {isOpen && (
            <div className="absolute top-full mt-2 right-0 bg-gray-900 text-white rounded-lg shadow-2xl border border-blue-500 w-80">
              <div className="bg-blue-600 px-4 py-2 rounded-t-lg">
                <h3 className="font-bold">Read-Only Impersonation</h3>
              </div>

              <div className="p-4">
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">
                    User ID or Email
                  </label>
                  <input
                    type="text"
                    value={userIdInput}
                    onChange={(e) => setUserIdInput(e.target.value)}
                    placeholder="Enter user ID or email"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (userIdInput.trim()) {
                        startImpersonation(userIdInput.trim());
                        setUserIdInput('');
                      }
                    }}
                    disabled={!userIdInput.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-semibold transition-colors"
                  >
                    Start
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                <div className="mt-4 text-xs text-gray-400 border-t border-gray-700 pt-3">
                  ⚠️ Read-only mode - Cannot make changes
                  <br />
                  🔒 All access is logged to audit trail
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
