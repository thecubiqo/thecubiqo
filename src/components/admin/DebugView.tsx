'use client';

/**
 * Admin Debug View Component
 * 
 * Displays debug information for admin users.
 * Gated by feature flag and admin status.
 * Logs access to audit trail.
 */

import { useEffect, useState } from 'react';
import { useAdmin } from '@/hooks';
import { useSession } from '@/hooks/useSession';

export function DebugView() {
  const { isAdmin, elevatedControlsEnabled, logAction } = useAdmin();
  const { sessionId } = useSession();
  const [debugData, setDebugData] = useState<Record<string, unknown>>({});
  const [isVisible, setIsVisible] = useState(false);

  // Check if admin can see debug view
  const canSeeDebugView = isAdmin && elevatedControlsEnabled;

  useEffect(() => {
    if (canSeeDebugView && isVisible) {
      // Log access to debug view
      logAction('debug_view_accessed', {
        timestamp: new Date().toISOString(),
        sessionId,
      });

      // Collect debug data
      setDebugData({
        sessionId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        locale: navigator.language,
        cookiesEnabled: navigator.cookieEnabled,
        onlineStatus: navigator.onLine,
      });
    }
  }, [canSeeDebugView, isVisible, sessionId, logAction]);

  if (!canSeeDebugView) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isVisible ? (
        <button
          onClick={() => setIsVisible(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
          title="Admin Debug View"
        >
          <span className="text-lg">🐛</span>
          <span>Debug</span>
        </button>
      ) : (
        <div className="bg-gray-900 text-white rounded-lg shadow-2xl border border-purple-500 max-w-md">
          <div className="flex items-center justify-between bg-purple-600 px-4 py-2 rounded-t-lg">
            <div className="flex items-center gap-2">
              <span className="text-lg">🐛</span>
              <h3 className="font-bold">Admin Debug View</h3>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close debug view"
            >
              ✕
            </button>
          </div>
          
          <div className="p-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {Object.entries(debugData).map(([key, value]) => (
                <div key={key} className="border-b border-gray-700 pb-2">
                  <div className="text-xs text-gray-400 uppercase">{key}</div>
                  <div className="text-sm font-mono break-all">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 px-4 py-2 rounded-b-lg text-xs text-gray-400">
            🔒 Admin Only - All access is audited
          </div>
        </div>
      )}
    </div>
  );
}
