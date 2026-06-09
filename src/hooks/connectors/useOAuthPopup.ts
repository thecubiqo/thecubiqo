'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { authHeaders } from '@/next/lib/supabase-browser';

// Composio-managed platforms — these go through /api/composio/connect
// and use managed OAuth credentials, not our own OAuth app credentials.
const COMPOSIO_PLATFORMS = new Set([
  'gmail', 'linkedin', 'googledrive', 'github', 'slack', 'notion', 'twitter',
  'supabase', 'googlecalendar', 'canva', 'figma', 'instagram', 'youtube',
]);

type OAuthStatus = 'idle' | 'opening' | 'waiting' | 'success' | 'error';

export function useOAuthPopup(onSuccess?: (platform: string) => void) {
  const [status, setStatus] = useState<OAuthStatus>('idle');
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'OAUTH_SUCCESS') {
        setStatus('success');
        setActivePlatform(null);
        popupRef.current?.close();
        onSuccess?.(String(event.data.platform || ''));
      }
      if (event.data?.type === 'OAUTH_ERROR') {
        setStatus('error');
        setActivePlatform(null);
        popupRef.current?.close();
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess]);

  const connect = useCallback(async (platform: string, shopName?: string) => {
    setStatus('opening');
    setActivePlatform(platform);

    try {
      const headers = await authHeaders();
      if (!headers.Authorization) throw new Error('Authentication required');

      // Route Composio-managed platforms to /api/composio/connect
      let authUrl: string;
      if (COMPOSIO_PLATFORMS.has(platform.toLowerCase())) {
        const res = await fetch('/api/composio/connect', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ app: platform.toLowerCase() }),
        });
        if (!res.ok) throw new Error('Failed to start Composio OAuth');
        const data = (await res.json()) as { oauthUrl?: string; error?: string };
        if (!data.oauthUrl) throw new Error(data.error || 'No OAuth URL returned');
        authUrl = data.oauthUrl;
      } else {
        const res = await fetch('/api/connectors/oauth/start', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform, shopName }),
        });
        if (!res.ok) throw new Error('Failed to start OAuth');
        const data = (await res.json()) as { authUrl: string };
        authUrl = data.authUrl;
      }

      const width = 520;
      const height = 680;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const popup = window.open(authUrl, `cubiqo_oauth_${platform}`, `width=${width},height=${height},left=${left},top=${top},popup=1`);
      if (!popup) {
        window.location.href = authUrl;
        return;
      }

      popupRef.current = popup;
      setStatus('waiting');

      const pollClose = window.setInterval(() => {
        if (popup.closed) {
          window.clearInterval(pollClose);
          setStatus(current => (current === 'waiting' ? 'idle' : current));
          setActivePlatform(null);
        }
      }, 500);
    } catch {
      setStatus('error');
      setActivePlatform(null);
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setActivePlatform(null);
  }, []);

  return { connect, status, activePlatform, reset };
}
