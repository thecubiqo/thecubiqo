'use client';

import { useCallback, useMemo, useState } from 'react';
import { useConnectors } from '@/next/hooks/connectors/useConnectors';
import { useExtensionHeartbeat } from '@/next/hooks/connectors/useExtensionHeartbeat';
import { useOAuthPopup } from '@/next/hooks/connectors/useOAuthPopup';
import { ConnectorCategoryTabs } from './ConnectorCategoryTabs';
import { ConnectorGrid } from './ConnectorGrid';
import { ConnectorSearch } from './ConnectorSearch';
import { ExtensionStatus } from './ExtensionStatus';
import type { ConnectorCategory } from '@/next/types/connectors';

export function ConnectorHub() {
  const { connectors, loading, error, refresh, markConnected, markDisconnected } = useConnectors();
  const { status: extensionStatus } = useExtensionHeartbeat();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ConnectorCategory>('all');

  const handleOAuthSuccess = useCallback((platform: string) => {
    markConnected(platform);
    void refresh();
  }, [markConnected, refresh]);

  const { connect: oauthConnect, status: oauthStatus, activePlatform } = useOAuthPopup(handleOAuthSuccess);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return connectors.filter(connector => {
      const matchesSearch = !query ||
        connector.displayName.toLowerCase().includes(query) ||
        connector.description.toLowerCase().includes(query) ||
        connector.category.toLowerCase().includes(query);
      const matchesCategory = category === 'all'
        ? true
        : category === 'connected'
          ? connector.connected
          : connector.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [connectors, search, category]);

  const connectedCount = connectors.filter(connector => connector.connected).length;

  return (
    <section className="flex h-full flex-col gap-4 overflow-hidden">
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold">Connected Apps</h1>
          <span className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">{connectedCount} connected</span>
        </div>
        <p className="text-xs text-muted-foreground">Connect once. CubiQo plans around what each app can safely do.</p>
      </header>

      <ExtensionStatus status={extensionStatus} />
      <ConnectorSearch value={search} onChange={setSearch} />
      <ConnectorCategoryTabs selected={category} onChange={setCategory} connectors={connectors} />

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {loading ? (
          <ConnectorGridSkeleton />
        ) : (
          <ConnectorGrid
            connectors={filtered}
            oauthStatus={oauthStatus}
            activePlatform={activePlatform}
            onOAuthConnect={oauthConnect}
            onDisconnect={markDisconnected}
            onRefresh={refresh}
          />
        )}
      </div>
    </section>
  );
}

function ConnectorGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-40 animate-pulse rounded-lg border bg-muted/40" />
      ))}
    </div>
  );
}
