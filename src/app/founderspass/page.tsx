'use client';

import { useState } from 'react';
import { useFeatureFlags } from '@/hooks/useFeatureFlag';
import { PreviewModeBanner } from '@/components/feature-flags/FeatureFlagDemo';
import { GmailToggles } from '@/components/founderspass/GmailToggles';
import { UserPanel } from '@/components/founderspass/UserPanel';

export default function FoundersPassPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [gmailPermissions, setGmailPermissions] = useState({
    read: false,
    write: false,
  });

  // Check feature flags
  const { flags, loading: flagsLoading } = useFeatureFlags(
    ['founders_pass_enabled', 'gmail_read_access', 'gmail_write_access'],
    { enablePreview: true }
  );

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '2026') {
      setIsAuthenticated(true);
      setError('');
      // Set auth cookie
      document.cookie = "founders-pass-auth=true; path=/; max-age=86400; SameSite=Lax; Secure";
    } else {
      setError('Invalid PIN. Please try 2026.');
    }
  };

  const handleToggleGmail = (permission: 'read' | 'write', enabled: boolean) => {
    setGmailPermissions((prev) => ({
      ...prev,
      [permission]: enabled,
    }));
  };

  // Check if Founders Pass is enabled via feature flag
  if (flagsLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!flags.founders_pass_enabled) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">🔒 Access Restricted</h1>
          <p className="text-gray-400">
            Founders Pass is currently not available. Please check back later.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Tip: Enable the "founders_pass_enabled" feature flag to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white">
      <PreviewModeBanner />

      <div className="max-w-4xl mx-auto p-8 pt-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-6xl">👑</span>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Founders Pass
            </h1>
          </div>
          <p className="text-gray-300 text-lg">
            Exclusive access to advanced features and integrations
          </p>
        </div>

        {!isAuthenticated ? (
          /* Login Form */
          <div className="max-w-md mx-auto">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-center">Enter Your PIN</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Founders PIN
                  </label>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-center text-2xl tracking-widest"
                    placeholder="••••"
                    maxLength={4}
                  />
                </div>
                {error && (
                  <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
                >
                  Access Founders Pass
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Hint: Try PIN 2026
                </p>
              </form>
            </div>
          </div>
        ) : (
          /* Dashboard */
          <div className="space-y-8">
            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-2">Welcome, Founder! 🎉</h2>
              <p className="text-gray-300">
                You now have access to exclusive integrations and features.
              </p>
            </div>

            {/* Gmail Integration Toggles */}
            <GmailToggles
              permissions={gmailPermissions}
              onToggle={handleToggleGmail}
              readEnabled={flags.gmail_read_access}
              writeEnabled={flags.gmail_write_access}
            />

            {/* User Panel */}
            <UserPanel permissions={gmailPermissions} />

            {/* Dashboard Link */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 flex flex-col items-center text-center">
              <h3 className="text-xl font-bold mb-2">🚀 Global Control Center</h3>
              <p className="text-gray-400 mb-4 text-sm">
                Manage feature gates, view live activity, and monitor system stats.
              </p>
              <a
                href="/founderspass/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition-all transform hover:scale-105"
              >
                <span>Open Advanced Dashboard</span>
                <span>→</span>
              </a>

              <div className="mt-4 pt-4 border-t border-gray-700 w-full flex justify-center">
                <a href="/founders-pass" className="text-sm text-gray-400 hover:text-white underline">
                  Go to Admin Portal (Flags & Sites)
                </a>
              </div>
            </div>

            {/* Feature Flags Info */}
            <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">🎯 Feature Flags Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Founders Pass</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${flags.founders_pass_enabled
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-700 text-gray-400'
                    }`}>
                    {flags.founders_pass_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Gmail Read Access</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${flags.gmail_read_access
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-700 text-gray-400'
                    }`}>
                    {flags.gmail_read_access ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Gmail Write Access</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${flags.gmail_write_access
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-700 text-gray-400'
                    }`}>
                    {flags.gmail_write_access ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                💡 Tip: Visit <a href="/admin/feature-flags" className="text-purple-400 hover:underline">/admin/feature-flags</a> to manage these flags
              </p>
            </div>

            {/* Logout Button */}
            <div className="text-center">
              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  setPin('');
                  setGmailPermissions({ read: false, write: false });
                  document.cookie = "founders-pass-auth=; path=/; max-age=0;";
                }}
                className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
