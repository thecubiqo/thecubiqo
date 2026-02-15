// Founders Pass - Integrations Panel
'use client';

import { useState } from 'react';
import { OAUTH_PROVIDERS, type OAuthProvider } from '@/lib/founders-pass/types';

const providers = Object.values(OAUTH_PROVIDERS);

export default function IntegrationsPage() {
  const [selectedSite, setSelectedSite] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  const handleConfigure = async (provider: OAuthProvider) => {
    if (!selectedSite) {
      alert('Please enter a site ID first');
      return;
    }
    setSaving(provider);
    try {
      await fetch('/api/founders-pass/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: selectedSite,
          provider,
          enabled: true,
          config: {},
        }),
      });
      alert(`${provider} integration enabled for site`);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-2">Integrations</h1>
      <p className="text-zinc-400 text-sm mb-6">
        Configure OAuth clients for external services. Client IDs and secrets
        should be stored in Vercel environment variables.
      </p>

      <div className="mb-6">
        <label className="text-sm text-zinc-400">Site ID</label>
        <input
          type="text"
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
          placeholder="Enter site UUID to configure integrations"
          className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((p) => (
          <div
            key={p.provider}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">
                {p.provider === 'gmail' && '📧'}
                {p.provider === 'shopify' && '🛍️'}
                {p.provider === 'printify' && '🖨️'}
                {p.provider === 'printful' && '📦'}
                {p.provider === 'stripe' && '💳'}
                {p.provider === 'uber' && '🚗'}
              </span>
              <div>
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-xs text-zinc-500">{p.provider}</p>
              </div>
            </div>
            <div className="mb-3">
              <p className="text-xs text-zinc-400 mb-1">Scopes:</p>
              <div className="flex flex-wrap gap-1">
                {p.scopes.map((scope) => (
                  <span
                    key={scope}
                    className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400"
                  >
                    {scope}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-xs text-zinc-500 mb-3">
              <p>
                Env vars: <code className="text-indigo-400">{p.provider.toUpperCase()}_CLIENT_ID</code>,{' '}
                <code className="text-indigo-400">{p.provider.toUpperCase()}_CLIENT_SECRET</code>
              </p>
            </div>
            <button
              onClick={() => handleConfigure(p.provider)}
              disabled={saving === p.provider || !selectedSite}
              className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 rounded text-sm font-medium"
            >
              {saving === p.provider ? 'Saving…' : 'Enable'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
