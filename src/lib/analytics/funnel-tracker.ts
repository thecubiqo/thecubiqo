'use client';

import { authHeaders } from '@/next/lib/supabase-browser';

type FunnelEvent = {
  event_type: string;
  properties?: Record<string, unknown>;
  anon_session_id?: string;
  created_at?: string;
};

const EVENT_KEY = 'cq_anon_events';
const SESSION_KEY = 'cq_anon_session';

export function getAnonSession() {
  if (typeof window === 'undefined') return '';
  let value = sessionStorage.getItem(SESSION_KEY);
  if (!value) {
    value = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, value);
  }
  return value;
}

export async function trackFunnelEvent(eventType: string, properties: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  const event: FunnelEvent = {
    event_type: eventType,
    properties,
    anon_session_id: getAnonSession(),
    created_at: new Date().toISOString(),
  };

  if (eventType === 'landing_view') localStorage.setItem('cq_visited', 'true');

  const headers = await authHeaders();
  if (!headers.Authorization) {
    const existing = JSON.parse(sessionStorage.getItem(EVENT_KEY) || '[]') as FunnelEvent[];
    sessionStorage.setItem(EVENT_KEY, JSON.stringify([...existing, event].slice(-100)));
    return;
  }

  await fetch('/api/analytics/funnel', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  }).catch(() => {
    const existing = JSON.parse(sessionStorage.getItem(EVENT_KEY) || '[]') as FunnelEvent[];
    sessionStorage.setItem(EVENT_KEY, JSON.stringify([...existing, event].slice(-100)));
  });
}

export async function flushAnonEvents() {
  if (typeof window === 'undefined') return;
  const events = JSON.parse(sessionStorage.getItem(EVENT_KEY) || '[]') as FunnelEvent[];
  if (!events.length) return;
  const headers = await authHeaders();
  if (!headers.Authorization) return;
  const res = await fetch('/api/analytics/funnel', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ events }),
  });
  if (res.ok) sessionStorage.removeItem(EVENT_KEY);
}

export function initLandingTracking() {
  if (typeof window === 'undefined') return () => {};
  const params = new URLSearchParams(window.location.search);
  void trackFunnelEvent('landing_view', {
    referrer: document.referrer || null,
    utm_source: params.get('utm_source'),
    utm_campaign: params.get('utm_campaign'),
    return_visitor: localStorage.getItem('cq_visited') === 'true',
  });

  let scrolled = false;
  const onScroll = () => {
    const depth = (window.scrollY + window.innerHeight) / Math.max(document.documentElement.scrollHeight, 1);
    if (!scrolled && depth >= 0.6) {
      scrolled = true;
      void trackFunnelEvent('scroll_depth_60');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  const idle = window.setTimeout(() => void trackFunnelEvent('idle_30s'), 30_000);
  return () => {
    window.removeEventListener('scroll', onScroll);
    window.clearTimeout(idle);
  };
}
