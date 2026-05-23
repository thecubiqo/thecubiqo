'use client';

import { useCallback, useEffect, useState } from 'react';
import { authHeaders } from '@/next/lib/supabase-browser';
import type { Connector, ConnectorListResponse } from '@/next/types/connectors';

export function useConnectors() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConnectors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = await authHeaders();
      if (!headers.Authorization) {
        setConnectors([]);
        return;
      }
      const res = await fetch('/api/connectors', { headers });
      if (!res.ok) throw new Error('Failed to load connectors');
      const data = (await res.json()) as ConnectorListResponse;
      setConnectors(data.connectors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connectors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConnectors();
  }, [fetchConnectors]);

  const markConnected = useCallback((platform: string) => {
    setConnectors(prev =>
      prev.map(connector =>
        connector.platform === platform ? { ...connector, connected: true, healthStatus: 'healthy' } : connector,
      ),
    );
  }, []);

  const markDisconnected = useCallback((platform: string) => {
    setConnectors(prev =>
      prev.map(connector =>
        connector.platform === platform ? { ...connector, connected: false, healthStatus: 'unknown' } : connector,
      ),
    );
  }, []);

  return {
    connectors,
    loading,
    error,
    refresh: fetchConnectors,
    markConnected,
    markDisconnected,
  };
}
