'use client';

import { useEffect } from 'react';
import { usePlaidLink } from '@/next/hooks/connectors/usePlaidLink';

interface Props {
  onSuccess?: () => void;
}

export function PlaidLinkButton({ onSuccess }: Props) {
  const { connect, openPlaid, linkToken, ready, loading, error } = usePlaidLink(onSuccess);

  useEffect(() => {
    if (linkToken && ready) openPlaid();
  }, [linkToken, ready, openPlaid]);

  return (
    <div className="space-y-1">
      <button type="button" onClick={() => void connect()} disabled={loading} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50">
        {loading ? 'Opening bank link' : 'Connect bank'}
      </button>
      {error && <p className="text-[10px] text-red-600">{error}</p>}
    </div>
  );
}
