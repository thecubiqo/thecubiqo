'use client';

import { useState } from 'react';
import { useApiKeySubmit } from '@/next/hooks/connectors/useApiKeySubmit';

interface Props {
  platform: string;
  displayName: string;
  onClose: () => void;
  onSaved: () => void;
}

export function ApiKeyForm({ platform, displayName, onClose, onSaved }: Props) {
  const [key, setKey] = useState('');
  const [secret, setSecret] = useState('');
  const { save, saving, error } = useApiKeySubmit(onSaved);
  const needsSecret = ['binance_us', 'kraken', 'kucoin', 'okx', 'bybit'].includes(platform);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={event => {
          event.preventDefault();
          void save(platform, key.trim(), needsSecret ? secret.trim() : undefined);
        }}
        className="w-full max-w-sm rounded-lg border bg-background p-4 shadow-xl"
      >
        <h2 className="text-sm font-semibold">Connect {displayName}</h2>
        <p className="mt-1 text-xs text-muted-foreground">Your API key is encrypted before storage and never returned to the browser.</p>

        <label className="mt-4 block text-xs font-medium">
          API Key
          <input
            type="password"
            value={key}
            onChange={event => setKey(event.target.value)}
            autoComplete="off"
            className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm outline-none ring-primary/20 focus:ring-2"
          />
        </label>

        {needsSecret && (
          <label className="mt-3 block text-xs font-medium">
            API Secret
            <input
              type="password"
              value={secret}
              onChange={event => setSecret(event.target.value)}
              autoComplete="off"
              className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm outline-none ring-primary/20 focus:ring-2"
            />
          </label>
        )}

        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border py-2 text-sm hover:bg-muted">
            Cancel
          </button>
          <button type="submit" disabled={saving || !key.trim()} className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {saving ? 'Saving' : 'Save and connect'}
          </button>
        </div>
      </form>
    </div>
  );
}
