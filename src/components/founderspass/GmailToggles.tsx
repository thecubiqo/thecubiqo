'use client';

interface GmailTogglesProps {
  permissions: {
    read: boolean;
    write: boolean;
  };
  onToggle: (permission: 'read' | 'write', enabled: boolean) => void;
  readEnabled: boolean;
  writeEnabled: boolean;
}

export function GmailToggles({
  permissions,
  onToggle,
  readEnabled,
  writeEnabled,
}: GmailTogglesProps) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl">📧</span>
        <h2 className="text-2xl font-bold">Gmail Integration</h2>
      </div>
      
      <p className="text-gray-400 mb-6">
        Configure your Gmail permissions. These settings control what CubiQo can access.
      </p>

      <div className="space-y-4">
        {/* Read Permission Toggle */}
        <div className={`border rounded-xl p-4 transition-all ${
          readEnabled
            ? 'border-blue-500/50 bg-blue-900/10'
            : 'border-gray-700 bg-gray-800/50 opacity-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold">Gmail Read Access</h3>
                {!readEnabled && (
                  <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">
                    Feature Disabled
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400">
                Allow CubiQo to read your emails, labels, and inbox.
              </p>
              <ul className="mt-2 text-xs text-gray-500 space-y-1">
                <li>• View email subject and content</li>
                <li>• Access labels and folders</li>
                <li>• Check inbox status</li>
              </ul>
            </div>
            <div className="ml-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.read}
                  onChange={(e) => onToggle('read', e.target.checked)}
                  disabled={!readEnabled}
                  className="sr-only peer"
                />
                <div className={`w-14 h-7 rounded-full peer transition-all ${
                  readEnabled
                    ? 'bg-gray-700 peer-checked:bg-blue-600'
                    : 'bg-gray-800 cursor-not-allowed'
                } peer-focus:ring-2 peer-focus:ring-blue-300`}>
                  <div className={`absolute top-0.5 left-0.5 bg-white rounded-full h-6 w-6 transition-transform ${
                    permissions.read ? 'translate-x-7' : ''
                  }`}></div>
                </div>
              </label>
            </div>
          </div>
          {permissions.read && readEnabled && (
            <div className="mt-3 pt-3 border-t border-blue-500/20">
              <span className="text-xs text-green-400 flex items-center gap-1">
                <span>✓</span>
                <span>Read access granted</span>
              </span>
            </div>
          )}
        </div>

        {/* Write Permission Toggle */}
        <div className={`border rounded-xl p-4 transition-all ${
          writeEnabled
            ? 'border-purple-500/50 bg-purple-900/10'
            : 'border-gray-700 bg-gray-800/50 opacity-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold">Gmail Write Access</h3>
                {!writeEnabled && (
                  <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">
                    Feature Disabled
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400">
                Allow CubiQo to send emails and manage your inbox.
              </p>
              <ul className="mt-2 text-xs text-gray-500 space-y-1">
                <li>• Send emails on your behalf</li>
                <li>• Create and modify labels</li>
                <li>• Archive and delete messages</li>
              </ul>
            </div>
            <div className="ml-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.write}
                  onChange={(e) => onToggle('write', e.target.checked)}
                  disabled={!writeEnabled}
                  className="sr-only peer"
                />
                <div className={`w-14 h-7 rounded-full peer transition-all ${
                  writeEnabled
                    ? 'bg-gray-700 peer-checked:bg-purple-600'
                    : 'bg-gray-800 cursor-not-allowed'
                } peer-focus:ring-2 peer-focus:ring-purple-300`}>
                  <div className={`absolute top-0.5 left-0.5 bg-white rounded-full h-6 w-6 transition-transform ${
                    permissions.write ? 'translate-x-7' : ''
                  }`}></div>
                </div>
              </label>
            </div>
          </div>
          {permissions.write && writeEnabled && (
            <div className="mt-3 pt-3 border-t border-purple-500/20">
              <span className="text-xs text-green-400 flex items-center gap-1">
                <span>✓</span>
                <span>Write access granted</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Warning when neither is enabled */}
      {!readEnabled && !writeEnabled && (
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-yellow-400 flex items-center gap-2">
            <span>⚠️</span>
            <span>
              Gmail features are currently disabled. Enable them via the{' '}
              <a href="/admin/feature-flags" className="underline hover:text-yellow-300">
                feature flags admin
              </a>
              .
            </span>
          </p>
        </div>
      )}

      {/* Info about feature flags */}
      {(readEnabled || writeEnabled) && (
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <p className="text-xs text-blue-400">
            ℹ️ These toggles are controlled by feature flags. Administrators can enable/disable
            Gmail access for all users or specific groups.
          </p>
        </div>
      )}
    </div>
  );
}
