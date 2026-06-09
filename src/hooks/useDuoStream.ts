'use client';

import { useEffect, useRef, useState } from 'react';
import { authHeaders } from '@/next/lib/supabase-browser';

export type DuoStreamMessage = {
  type: 'connected' | 'task_update' | 'question' | 'blocker' | 'done' | 'error' | string;
  taskId?: string;
  payload?: unknown;
  id?: string;
  createdAt?: string;
  [key: string]: unknown;
};

export function useDuoStream(projectId?: string | null) {
  const [messages, setMessages] = useState<DuoStreamMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!projectId) return undefined;

    const controller = new AbortController();
    abortRef.current = controller;
    let active = true;

    async function connect() {
      try {
        const headers = await authHeaders();
        if (!headers.Authorization) {
          setConnected(false);
          return;
        }
        const response = await fetch(`/api/duo/stream/${projectId}`, {
          headers,
          signal: controller.signal
        });
        if (!response.ok || !response.body) {
          if (active) setConnected(false);
          return;
        }

        if (active) setConnected(true);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (active) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split('\n\n');
          buffer = chunks.pop() || '';

          for (const chunk of chunks) {
            const line = chunk.split('\n').find(part => part.startsWith('data:'));
            if (!line) continue;
            try {
              const message = JSON.parse(line.slice(5).trim()) as DuoStreamMessage;
              setMessages(prev => [...prev.slice(-99), message]);
            } catch {
              // Ignore malformed SSE payloads; the stream should stay alive.
            }
          }
        }
      } catch (error) {
        if (active && !(error instanceof DOMException && error.name === 'AbortError')) {
          setConnected(false);
        }
      } finally {
        if (active) setConnected(false);
      }
    }

    connect();

    return () => {
      active = false;
      controller.abort();
      setConnected(false);
    };
  }, [projectId]);

  return {
    messages,
    connected,
    reset: () => setMessages([]),
    close: () => abortRef.current?.abort()
  };
}
