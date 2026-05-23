'use client';

import { useEffect, useState } from 'react';
import { authHeaders } from '@/next/lib/supabase-browser';
import { usePlaidLink } from '@/next/hooks/connectors/usePlaidLink';
import { ApiKeyForm } from './ApiKeyForm';
import { ConnectorStatusBadge } from './ConnectorStatusBadge';
import { TosRiskModal } from './TosRiskModal';
import type { Connector } from '@/next/types/connectors';

interface Props {
  connector: Connector;
  isConnecting: boolean;
  onOAuthConnect: (platform: string) => void;
  onDisconnect: (platform: string) => void;
  onRefresh: () => void;
}

const adapterLabel = {
  oauth2: 'OAuth',
  api_key: 'API key',
  open_banking: 'Bank link',
  extension: 'Extension',
} as const;

export function ConnectorCard({ connector, isConnecting, onOAuthConnect, onDisconnect, onRefresh }: Props) {
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [showTosModal, setShowTosModal] = useState(false);
  const { connect: plaidConnect, linkToken, ready, openPlaid } = usePlaidLink(onRefresh);

  useEffect(() => {
    if (linkToken && ready) openPlaid();
  }, [linkToken, ready, openPlaid]);

  function triggerConnect(tosConsent = false) {
    switch (connector.adapterType) {
      case 'oauth2':
        onOAuthConnect(connector.platform);
        break;
      case 'api_key':
        setShowApiKeyForm(true);
        break;
      case 'open_banking':
        void plaidConnect();
        break;
      case 'extension':
        void enableExtensionConnector(tosConsent);
        break;
    }
  }

  async function enableExtensionConnector(tosConsent: boolean) {
    const headers = await authHeaders();
    if (!headers.Authorization) return;
    await fetch('/api/connectors/extension/enable', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: connector.platform, tosConsent }),
    });
    onRefresh();
  }

  async function handleDisconnect() {
    const headers = await authHeaders();
    if (!headers.Authorization) return;
    await fetch(`/api/connectors/${connector.platform}/disconnect`, { method: 'DELETE', headers });
    onDisconnect(connector.platform);
  }

  return (
    <>
      <div className={`flex min-h-[156px] flex-col gap-2 rounded-lg border p-3 transition ${
        connector.connected ? 'border-emerald-200 bg-emerald-50/50' : 'border-border bg-card hover:border-muted-foreground/40'
      }`}>
        <div className="flex items-start gap-2">
          {connector.logoUrl ? (
            <img src={connector.logoUrl} alt="" className="h-8 w-8 rounded object-contain" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary">
              {connector.displayName.slice(0, 1)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{connector.displayName}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{connector.category}</div>
          </div>
        </div>

        <p className="line-clamp-3 min-h-[48px] text-xs leading-4 text-muted-foreground">{connector.description}</p>

        <div className="mt-auto flex items-center justify-between gap-2">
          <ConnectorStatusBadge connected={connector.connected} healthStatus={connector.healthStatus} />
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{adapterLabel[connector.adapterType]}</span>
        </div>

        <div className="flex gap-2 pt-1">
          {connector.connected ? (
            <button type="button" onClick={handleDisconnect} className="flex-1 rounded-lg border px-2 py-1.5 text-xs hover:bg-muted">
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              disabled={isConnecting}
              onClick={() => connector.tosRisk ? setShowTosModal(true) : triggerConnect(false)}
              className="flex-1 rounded-lg bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              {isConnecting ? 'Connecting' : 'Connect'}
            </button>
          )}
        </div>

        {connector.neverAutomateWrites && <p className="text-[10px] text-muted-foreground">Writes require approval.</p>}
      </div>

      {showApiKeyForm && (
        <ApiKeyForm
          platform={connector.platform}
          displayName={connector.displayName}
          onClose={() => setShowApiKeyForm(false)}
          onSaved={() => {
            setShowApiKeyForm(false);
            onRefresh();
          }}
        />
      )}

      {showTosModal && (
        <TosRiskModal
          connector={connector}
          onConfirm={() => {
            setShowTosModal(false);
            triggerConnect(true);
          }}
          onCancel={() => setShowTosModal(false)}
        />
      )}
    </>
  );
}
