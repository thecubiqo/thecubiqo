'use client';

import { useState } from 'react';
import { FeatureFlagDemo, PreviewModeBanner } from '@/components/feature-flags/FeatureFlagDemo';
import { useFeatureFlags } from '@/hooks/useFeatureFlag';
import { enablePreviewMode, disablePreviewMode } from '@/hooks/useFeatureFlag';

export default function FeatureFlagDemoPage() {
  const [testFlags, setTestFlags] = useState(['founders_pass_v2', 'new_ui_beta']);
  const { flags, loading, previewFlags } = useFeatureFlags(testFlags, {
    enablePreview: true,
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <PreviewModeBanner />
      
      <div className="max-w-4xl mx-auto p-8 pt-16">
        <h1 className="text-4xl font-bold mb-2">Feature Flags Demo</h1>
        <p className="text-gray-400 mb-8">
          This page demonstrates the Founders Pass feature flag system with preview mode
        </p>

        {/* Preview Controls */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Preview Mode Controls</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">
                Enable preview mode to test feature flags without changing the database.
                Preview mode lasts 24 hours or until you disable it.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => enablePreviewMode(['founders_pass_v2'])}
                className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Enable Preview: founders_pass_v2
              </button>
              <button
                onClick={() => enablePreviewMode(['new_ui_beta'])}
                className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Enable Preview: new_ui_beta
              </button>
              <button
                onClick={() => disablePreviewMode()}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Disable Preview Mode
              </button>
            </div>
            {previewFlags.size > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4">
                <p className="text-yellow-400 font-semibold mb-1">
                  Preview Mode Active
                </p>
                <p className="text-sm text-gray-300">
                  Flags in preview: {Array.from(previewFlags).join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Flag Status */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Flag Status</h2>
          {loading ? (
            <div className="text-center py-4">Loading flags...</div>
          ) : (
            <div className="space-y-3">
              {testFlags.map((flagName) => (
                <div
                  key={flagName}
                  className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{flagName}</p>
                    {previewFlags.has(flagName) && (
                      <span className="text-xs text-yellow-400">
                        (Preview Mode)
                      </span>
                    )}
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      flags[flagName]
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {flags[flagName] ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Demo Features */}
        <div className="space-y-6">
          <FeatureFlagDemo
            flagName="founders_pass_v2"
            fallback={
              <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700">
                <h3 className="text-xl font-bold mb-2">Standard Features</h3>
                <p className="text-gray-400">
                  You're seeing the standard version. Enable the "founders_pass_v2" 
                  flag to see exclusive Founders Pass features.
                </p>
              </div>
            }
          >
            <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-lg p-6 border-2 border-purple-500">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-3xl">👑</span>
                <h3 className="text-2xl font-bold">Founders Pass Exclusive</h3>
              </div>
              <p className="text-gray-200 mb-4">
                This is an exclusive feature only available to Founders Pass members!
                You can see this because the "founders_pass_v2" flag is enabled.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Early access to new features</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Exclusive community access</span>
                </li>
              </ul>
            </div>
          </FeatureFlagDemo>

          <FeatureFlagDemo
            flagName="new_ui_beta"
            fallback={
              <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700">
                <h3 className="text-xl font-bold mb-2">Classic UI</h3>
                <p className="text-gray-400">
                  You're using the classic interface. Enable "new_ui_beta" to try 
                  the new design.
                </p>
              </div>
            }
          >
            <div className="bg-gradient-to-br from-pink-900 to-red-900 rounded-lg p-6 border-2 border-pink-500">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-3xl">🎨</span>
                <h3 className="text-2xl font-bold">New UI Beta</h3>
              </div>
              <p className="text-gray-200">
                You're experiencing our brand new UI! This is a beta feature being
                rolled out gradually to select users.
              </p>
            </div>
          </FeatureFlagDemo>
        </div>

        {/* Integration Example */}
        <div className="bg-gray-900 rounded-lg p-6 mt-8">
          <h2 className="text-2xl font-bold mb-4">Integration Example</h2>
          <p className="text-gray-400 mb-4">
            Here's how to integrate feature flags in your components:
          </p>
          <pre className="bg-gray-800 rounded-lg p-4 overflow-x-auto text-sm">
            <code>{`import { useFeatureFlag } from '@/hooks/useFeatureFlag';

function MyComponent() {
  const { enabled, loading } = useFeatureFlag('my_feature');
  
  if (loading) return <div>Loading...</div>;
  
  if (enabled) {
    return <div>New Feature!</div>;
  }
  
  return <div>Standard Version</div>;
}`}</code>
          </pre>
        </div>

        {/* Webhook Testing */}
        <div className="bg-gray-900 rounded-lg p-6 mt-8">
          <h2 className="text-2xl font-bold mb-4">Webhook Testing</h2>
          <p className="text-gray-400 mb-4">
            To test webhooks:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Go to the <a href="/admin/feature-flags" className="text-blue-400 hover:underline">Feature Flags Admin page</a></li>
            <li>Create or edit a feature flag</li>
            <li>Toggle the flag on/off</li>
            <li>Check your webhook endpoint for the notification</li>
            <li>Reload this page within 5 seconds to see the change</li>
          </ol>
          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
            <p className="text-sm text-blue-300">
              💡 <strong>Tip:</strong> Use services like webhook.site or requestbin.com 
              to test webhook delivery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
