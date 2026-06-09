'use client';

import { useCallback, useState } from 'react';
import { authHeaders } from '@/next/lib/supabase-browser';

export function useApiKeySubmit(onSaved?: () => void) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async (platform: string, apiKey: string, apiSecret?: string) => {
    setSaving(true);
    setError(null);
    try {
      const headers = await authHeaders();
      if (!headers.Authorization) throw new Error('Authentication required');
      const res = await fetch('/api/connectors/api-key/save', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, apiKey, apiSecret }),
      });
      if (!res.ok) throw new Error('Failed to save key');
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save key');
    } finally {
      setSaving(false);
    }
  }, [onSaved]);

  return { save, saving, error };
}
