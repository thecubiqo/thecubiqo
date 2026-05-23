'use client';

import { useEffect, useRef, useState } from 'react';
import { getBrowserSupabase } from '@/next/lib/supabase-browser';

export function useDuoBoardRealtime(projectId: string | null, onChange?: () => void) {
  const [connected, setConnected] = useState(false);
  const retryRef = useRef(1000);

  useEffect(() => {
    if (!projectId) return;
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const client = supabase;
    let stopped = false;
    let channel: ReturnType<typeof client.channel> | null = null;

    function subscribe() {
      channel = client
        .channel(`duo-board:${projectId}`, { config: { broadcast: { self: false }, presence: { key: projectId }, private: false } as any })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'duo_tasks', filter: `project_id=eq.${projectId}` }, () => onChange?.())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'stream_events', filter: `project_id=eq.${projectId}` }, () => onChange?.())
        .subscribe(status => {
          const ok = status === 'SUBSCRIBED';
          setConnected(ok);
          if (ok) retryRef.current = 1000;
          if (!ok && !stopped) {
            const delay = Math.min(retryRef.current, 300_000);
            retryRef.current *= 2;
            window.setTimeout(subscribe, delay);
          }
        });
    }

    subscribe();
    const visibility = () => {
      if (document.visibilityState === 'visible') onChange?.();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      stopped = true;
      document.removeEventListener('visibilitychange', visibility);
      if (channel) void client.removeChannel(channel);
    };
  }, [projectId, onChange]);

  return { connected };
}
