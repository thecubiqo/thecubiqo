'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { authHeaders } from '@/next/lib/supabase-browser';
import type { NotificationRecord } from '@/next/types/notifications';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  async function load(limit = 10) {
    setError('');
    try {
      const headers = await authHeaders();
      if (!headers.Authorization) return;
      const response = await fetch(`/api/notifications?limit=${limit}`, { headers });
      if (!response.ok) throw new Error('Could not load notifications');
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load notifications');
    }
  }

  useEffect(() => {
    load(5);
  }, []);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  async function markRead(id: string, actioned = false) {
    const headers = await authHeaders();
    await fetch(`/api/notifications/${id}/read`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ actioned })
    });
    setNotifications(items => items.map(item => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
    setUnreadCount(count => Math.max(0, count - 1));
  }

  async function markVisibleRead() {
    const unread = notifications.filter(item => !item.readAt);
    await Promise.all(unread.map(item => markRead(item.id)));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen(value => !value);
          load();
        }}
        className="relative grid h-10 w-10 place-items-center rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-900"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-slate-800 bg-neutral-950 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 px-3 py-3">
            <span className="text-sm font-semibold text-slate-100">Notifications</span>
            {unreadCount > 0 && (
              <button type="button" onClick={markVisibleRead} className="inline-flex items-center gap-1 text-xs text-cyan-200 hover:text-cyan-100">
                <CheckCheck className="h-3.5 w-3.5" />
                Clear visible
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {error && <div className="px-3 py-3 text-sm text-rose-200">{error}</div>}
            {!error && notifications.length === 0 && <div className="px-3 py-6 text-center text-sm text-slate-400">No notifications</div>}
            {notifications.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (!item.readAt) markRead(item.id, Boolean(item.actionUrl));
                  if (item.actionUrl) window.location.href = item.actionUrl;
                }}
                className={`block w-full border-b border-slate-800 px-3 py-3 text-left last:border-b-0 hover:bg-slate-900 ${
                  item.readAt ? 'bg-neutral-950' : 'bg-cyan-300/5'
                }`}
              >
                <span className="block text-sm font-medium text-slate-100">{item.title}</span>
                {item.body && <span className="mt-1 block text-xs leading-5 text-slate-400">{item.body}</span>}
                <span className="mt-2 block text-[11px] text-slate-500">{new Date(item.createdAt).toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
