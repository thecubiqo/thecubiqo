'use client';

import { useEffect, useState } from 'react';

type SiteState =
  | { status: 'loading'; site: null; error: null }
  | { status: 'ready'; site: { title: string; status: string; content?: Record<string, unknown> }; error: null }
  | { status: 'error'; site: null; error: string };

export default function SitePreviewPage({ slug }: { slug: string }) {
  const [state, setState] = useState<SiteState>({ status: 'loading', site: null, error: null });

  useEffect(() => {
    let active = true;
    fetch(`/api/sites/${encodeURIComponent(slug)}`)
      .then(async response => {
        const payload = await response.json().catch(() => ({}));
        if (!active) return;
        if (!response.ok || payload.error) {
          setState({ status: 'error', site: null, error: payload.error || `Site request failed with ${response.status}` });
          return;
        }
        setState({ status: 'ready', site: payload.site, error: null });
      })
      .catch(error => {
        if (active) {
          setState({ status: 'error', site: null, error: error instanceof Error ? error.message : 'Unable to load site' });
        }
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const title = state.status === 'ready' ? state.site.title : 'CubiQo Site';

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#06070d',
        color: '#f5f7ff',
        padding: '52px clamp(18px, 5vw, 72px)',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
      }}
    >
      <a href="/launchpad" style={{ color: '#cfd4df', textDecoration: 'none' }}>
        Launchpad
      </a>
      <section style={{ marginTop: 64, maxWidth: 880 }}>
        <p style={{ margin: 0, color: '#f7c46a', textTransform: 'uppercase', letterSpacing: 0, fontSize: 12 }}>
          Site Preview
        </p>
        <h1 style={{ margin: '12px 0', fontSize: 52, letterSpacing: 0, lineHeight: 1 }}>{title}</h1>
        <p style={{ color: '#aeb5c6', fontSize: 18, lineHeight: 1.6 }}>
          {state.status === 'loading'
            ? 'Loading site...'
            : state.status === 'error'
              ? state.error
              : `Status: ${state.site.status}. This is the safe dynamic preview route; production domain deployment is not enabled yet.`}
        </p>
      </section>
    </main>
  );
}
