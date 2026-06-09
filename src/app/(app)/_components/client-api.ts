'use client';

import { authHeaders } from '@/next/lib/supabase-browser';

export async function apiGet<T>(path: string): Promise<T> {
  const headers = await authHeaders();
  if (!headers.Authorization && path !== '/api/billing/status') {
    throw new Error('Authentication required');
  }
  const res = await fetch(path, { headers, cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data as T;
}

export async function apiSend<T>(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> {
  const headers = await authHeaders();
  if (!headers.Authorization) {
    throw new Error('Authentication required');
  }
  const res = await fetch(path, {
    method,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data as T;
}

export function formatDate(value?: string | null) {
  if (!value) return 'Not set';
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function statusTone(status?: string | null) {
  if (status === 'green' || status === 'active' || status === 'completed' || status === 'succeeded') {
    return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100';
  }
  if (status === 'red' || status === 'failed' || status === 'blocked' || status === 'past_due') {
    return 'border-rose-400/40 bg-rose-400/10 text-rose-100';
  }
  if (status === 'yellow' || status === 'paused' || status === 'waiting_approval' || status === 'trialing') {
    return 'border-amber-400/40 bg-amber-400/10 text-amber-100';
  }
  return 'border-slate-500/40 bg-slate-700/40 text-slate-100';
}
