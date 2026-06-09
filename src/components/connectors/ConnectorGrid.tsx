'use client';

import { ConnectorCard } from './ConnectorCard';
import type { Connector } from '@/next/types/connectors';

interface Props {
  connectors: Connector[];
  oauthStatus: string;
  activePlatform: string | null;
  onOAuthConnect: (platform: string) => void;
  onDisconnect: (platform: string) => void;
  onRefresh: () => void;
}

export function ConnectorGrid({ connectors, oauthStatus, activePlatform, onOAuthConnect, onDisconnect, onRefresh }: Props) {
  if (!connectors.length) {
    return <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">No apps match this view.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {connectors.map(connector => (
        <ConnectorCard
          key={connector.platform}
          connector={connector}
          isConnecting={activePlatform === connector.platform && (oauthStatus === 'opening' || oauthStatus === 'waiting')}
          onOAuthConnect={onOAuthConnect}
          onDisconnect={onDisconnect}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}
