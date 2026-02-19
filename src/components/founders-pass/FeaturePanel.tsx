// Feature Panel - Side panel showing feature flags and integration toggles
'use client';

import { useEffect, useState, useCallback } from 'react';
import { OAUTH_PROVIDERS, type OAuthProvider } from '@/lib/founders-pass/types';

interface FeaturePanelProps {
  siteId: string;
  siteSlug: string;
  userId?: string;
}

const INTEGRATION_FLAGS: Record<string, { provider: OAuthProvider; label: string; icon: string }> = {
  gmail_read: { provider: 'gmail', label: 'Gmail Read', icon: '📧' },
  gmail_send: { provider: 'gmail', label: 'Gmail Send', icon: '✉️' },
  shopify: { provider: 'shopify', label: 'Shopify', icon: '🛍️' },
  printify: { provider: 'printify', label: 'Printify', icon: '🖨️' },
  printful: { provider: 'printful', label: 'Printful', icon: '📦' },
  stripe: { provider: 'stripe', label: 'Stripe', icon: '💳' },
  uber: { provider: 'uber', label: 'Uber', icon: '🚗' },
};

export default function FeaturePanel({ siteId, siteSlug, userId }: FeaturePanelProps) {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const loadFlags = useCallback(async () => {
    try {
      const params = new URLSearchParams({ siteId });
      if (userId) params.set('userId', userId);
      const res = await fetch(`/api/founders-pass/flags/overrides?${params}`);
      const data = await res.json();
      setFlags(data.flags ?? {});
    } catch (err) {
      
    } finally {
      setLoading(false);
    }
  }, [siteId, userId]);

  useEffect(() => {
    loadFlags();
    // Poll for flag updates every 5 seconds (preview propagation)
    const interval = setInterval(loadFlags, 5000);
    return () => clearInterval(interval);
  }, [loadFlags]);

  const enabledIntegrations = Object.entries(INTEGRATION_FLAGS).filter(
    ([key]) => flags[key] === true,
  );

  const handleOAuthConnect = (provider: OAuthProvider) => {
    const state = `${provider}:${userId ?? 'anon'}:${siteId}`;
    const redirectUri = `${window.location.origin}/api/founders-pass/oauth/callback`;
    const cfg = OAUTH_PROVIDERS[provider];
    const scopes = cfg.scopes.join(' ');

    // In production, the OAuth flow would be initiated server-side
    // with the actual client_id from environment variables.
    // Demo mode: show the intended flow.
    alert(
      `OAuth flow would redirect to:\n${cfg.authUrl}?redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scopes)}\n\nDemo mode: connection simulated.`,
    );

    // Emit event
    fetch('/api/founders-pass/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site_id: siteId,
        user_id: userId,
        event_type: 'oauth_connected',
        event_data: { provider },
      }),
    });
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-50 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-l-lg shadow-lg"
        title="Feature Panel"
      >
        {open ? '→' : '←'}
      </button>

      {/* Side panel */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-zinc-900 border-l border-zinc-800 z-40 transform transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-5 h-full overflow-y-auto">
          <h2 className="text-lg font-bold mb-1">Features</h2>
          <p className="text-xs text-zinc-500 mb-4">
            Integrations available for {siteSlug}
          </p>

          {loading ? (
            <div className="animate-pulse text-zinc-500 text-sm">Loading features…</div>
          ) : enabledIntegrations.length === 0 ? (
            <div className="text-zinc-500 text-sm">
              No integrations enabled for this site yet.
            </div>
          ) : (
            <div className="space-y-3">
              {enabledIntegrations.map(([key, info]) => (
                <div
                  key={key}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2">
                      <span>{info.icon}</span>
                      <span className="font-medium text-sm">{info.label}</span>
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <button
                    onClick={() => handleOAuthConnect(info.provider)}
                    className="w-full px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-xs font-medium"
                  >
                    Connect {info.label}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* All available flags */}
          <div className="mt-6 pt-4 border-t border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-400 mb-2">All Flags</h3>
            <div className="space-y-1">
              {Object.entries(flags).map(([key, enabled]) => (
                <div
                  key={key}
                  className="flex items-center justify-between text-xs py-1"
                >
                  <span className="font-mono text-zinc-400">{key}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      enabled ? 'bg-emerald-400' : 'bg-zinc-600'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
