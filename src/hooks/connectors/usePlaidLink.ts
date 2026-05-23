'use client';

import { useCallback, useState } from 'react';
import { usePlaidLink as usePlaidLinkSDK } from 'react-plaid-link';
import { authHeaders } from '@/next/lib/supabase-browser';

export function usePlaidLink(onSuccess?: () => void) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLinkToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      if (!headers.Authorization) throw new Error('Authentication required');
      const res = await fetch('/api/connectors/plaid/link-token', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: ['transactions', 'auth', 'investments'] }),
      });
      if (!res.ok) throw new Error('Could not initialise bank connection');
      const data = (await res.json()) as { linkToken: string };
      setLinkToken(data.linkToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not initialise bank connection');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSuccess = useCallback(async (publicToken: string) => {
    try {
      const headers = await authHeaders();
      if (!headers.Authorization) throw new Error('Authentication required');
      const res = await fetch('/api/connectors/plaid/exchange', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicToken }),
      });
      if (!res.ok) throw new Error('Failed to link bank account');
      setLinkToken(null);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link bank account');
    }
  }, [onSuccess]);

  const { open: openPlaidLink, ready } = usePlaidLinkSDK({
    token: linkToken,
    onSuccess: publicToken => {
      void handleSuccess(publicToken);
    },
    onExit: () => setLinkToken(null),
  });

  const connect = useCallback(async () => {
    await fetchLinkToken();
  }, [fetchLinkToken]);

  const openPlaid = useCallback(() => {
    if (linkToken && ready) openPlaidLink();
  }, [linkToken, ready, openPlaidLink]);

  return { connect, openPlaid, linkToken, ready, loading, error };
}
