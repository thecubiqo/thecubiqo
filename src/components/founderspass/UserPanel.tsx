'use client';

interface UserPanelProps {
  permissions: {
    read: boolean;
    write: boolean;
  };
}

export function UserPanel({ permissions }: UserPanelProps) {
  const hasAnyPermission = permissions.read || permissions.write;

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl">👤</span>
        <h2 className="text-2xl font-bold">Your Active Permissions</h2>
      </div>

      {!hasAnyPermission ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-gray-400 mb-2">No permissions granted yet</p>
          <p className="text-sm text-gray-500">
            Enable Gmail toggles above to start using integrations
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-400 mb-4">
            You have granted the following permissions:
          </p>

          <div className="space-y-3">
            {permissions.read && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-xl">
                    📖
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-300">Gmail Read Access</h3>
                    <p className="text-sm text-gray-400">
                      CubiQo can read your emails and inbox
                    </p>
                  </div>
                  <div className="text-green-400 text-2xl">✓</div>
                </div>
              </div>
            )}

            {permissions.write && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-xl">
                    ✍️
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-purple-300">Gmail Write Access</h3>
                    <p className="text-sm text-gray-400">
                      CubiQo can send emails and manage your inbox
                    </p>
                  </div>
                  <div className="text-green-400 text-2xl">✓</div>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total Permissions:</span>
              <span className="text-white font-semibold">
                {[permissions.read, permissions.write].filter(Boolean).length} / 2
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-400 mb-2">What you can do now:</p>
            <ul className="text-xs text-gray-300 space-y-1">
              {permissions.read && (
                <>
                  <li>• Ask CubiQo to read and summarize your emails</li>
                  <li>• Check your inbox status via voice commands</li>
                  <li>• Get email notifications and alerts</li>
                </>
              )}
              {permissions.write && (
                <>
                  <li>• Compose and send emails through CubiQo</li>
                  <li>• Auto-reply to messages</li>
                  <li>• Organize and label emails</li>
                </>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="mt-6 p-3 bg-gray-800 border border-gray-700 rounded-lg">
        <p className="text-xs text-gray-400">
          🔒 <strong>Privacy:</strong> Your permissions are stored locally and can be revoked
          at any time. We never access your data without your explicit permission.
        </p>
      </div>
    </div>
  );
}
