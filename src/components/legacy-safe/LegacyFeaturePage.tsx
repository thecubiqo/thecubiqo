'use client';

import { createClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useState } from 'react';

type FeatureCard = {
  title: string;
  status: string;
  body: string;
};

type FeaturePageProps = {
  eyebrow: string;
  title: string;
  summary: string;
  apiPath: string;
  publicApi?: boolean;
  cards: FeatureCard[];
  blockers?: string[];
};

type LoadState =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: Record<string, unknown>; error: null }
  | { status: 'unauthenticated'; data: null; error: string }
  | { status: 'error'; data: null; error: string };

declare global {
  interface Window {
    __CUBIQO_ENV__?: {
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
    };
  }
}

const cardStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  background: 'rgba(255,255,255,0.045)',
  padding: 18
};

const buttonStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.08)',
  color: '#f3f5ff',
  padding: '10px 14px',
  cursor: 'pointer',
  letterSpacing: 0
};

function summarizeData(data: Record<string, unknown>) {
  const keys = Object.keys(data).filter(key => !['error'].includes(key));
  if (!keys.length) return 'No API payload yet.';

  return keys
    .slice(0, 8)
    .map(key => {
      const value = data[key];
      if (Array.isArray(value)) return `${key}: ${value.length}`;
      if (typeof value === 'object' && value !== null) return `${key}: ready`;
      return `${key}: ${String(value)}`;
    })
    .join(' | ');
}

export default function LegacyFeaturePage({
  eyebrow,
  title,
  summary,
  apiPath,
  publicApi = false,
  cards,
  blockers = []
}: FeaturePageProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading', data: null, error: null });

  const supabase = useMemo(() => {
    if (typeof window === 'undefined' || publicApi) return null;
    const env = window.__CUBIQO_ENV__;
    if (!env?.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
    return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }, [publicApi]);

  const load = useCallback(async () => {
    setState({ status: 'loading', data: null, error: null });
    try {
      const headers: HeadersInit = {};
      if (!publicApi) {
        if (!supabase) {
          setState({ status: 'unauthenticated', data: null, error: 'Supabase browser auth is not configured.' });
          return;
        }
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          setState({ status: 'unauthenticated', data: null, error: 'Sign in to use this feature.' });
          return;
        }
        headers.authorization = `Bearer ${token}`;
      }

      const response = await fetch(apiPath, { headers });
      const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (response.status === 401 || response.status === 403) {
        setState({
          status: 'unauthenticated',
          data: null,
          error: typeof payload.error === 'string' ? payload.error : 'Access is required.'
        });
        return;
      }
      if (!response.ok) {
        setState({
          status: 'error',
          data: null,
          error: typeof payload.error === 'string' ? payload.error : `Request failed with ${response.status}`
        });
        return;
      }
      setState({ status: 'ready', data: payload, error: null });
    } catch (error) {
      setState({
        status: 'error',
        data: null,
        error: error instanceof Error ? error.message : 'Unknown feature load error'
      });
    }
  }, [apiPath, publicApi, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 20%, rgba(255,195,77,0.12), transparent 34%), #06070d',
        color: '#f4f6fb',
        padding: '44px clamp(18px, 5vw, 72px)',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
      }}
    >
      <nav style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 36 }}>
        <a href="/app" style={{ color: '#cfd4df', textDecoration: 'none' }}>
          CubiQo
        </a>
        <span style={{ color: 'rgba(255,255,255,0.28)' }}>/</span>
        <span style={{ color: 'rgba(255,255,255,0.64)' }}>{eyebrow}</span>
      </nav>

      <section style={{ maxWidth: 1060 }}>
        <p style={{ margin: 0, color: '#f7c46a', textTransform: 'uppercase', letterSpacing: 0, fontSize: 12 }}>
          {eyebrow}
        </p>
        <h1 style={{ margin: '12px 0 12px', fontSize: 52, letterSpacing: 0, lineHeight: 1 }}>
          {title}
        </h1>
        <p style={{ margin: 0, maxWidth: 780, color: '#aeb5c6', fontSize: 18, lineHeight: 1.6 }}>{summary}</p>
      </section>

      <section
        style={{
          marginTop: 34,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
          maxWidth: 1120
        }}
      >
        {cards.map(card => (
          <article key={card.title} style={cardStyle}>
            <p style={{ margin: '0 0 10px', color: '#9be7c2', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0 }}>
              {card.status}
            </p>
            <h2 style={{ margin: '0 0 10px', fontSize: 18, letterSpacing: 0 }}>{card.title}</h2>
            <p style={{ margin: 0, color: '#aeb5c6', lineHeight: 1.5 }}>{card.body}</p>
          </article>
        ))}
      </section>

      <section style={{ ...cardStyle, maxWidth: 1120, marginTop: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: '0 0 8px', color: '#aeb5c6' }}>Current API State</p>
            <strong style={{ fontSize: 18 }}>
              {state.status === 'loading'
                ? 'Checking...'
                : state.status === 'ready'
                  ? summarizeData(state.data)
                  : state.error}
            </strong>
          </div>
          <button type="button" style={buttonStyle} onClick={() => void load()}>
            Recheck
          </button>
        </div>
        {state.status === 'ready' && state.data.migrationPending ? (
          <p style={{ margin: '14px 0 0', color: '#ffd58a' }}>
            Database migration is pending for this feature; the code path is present but Supabase must be updated.
          </p>
        ) : null}
      </section>

      {blockers.length ? (
        <section style={{ maxWidth: 1120, marginTop: 18 }}>
          {blockers.map(blocker => (
            <p key={blocker} style={{ margin: '8px 0', color: '#ffb2b2' }}>
              {blocker}
            </p>
          ))}
        </section>
      ) : null}
    </main>
  );
}
