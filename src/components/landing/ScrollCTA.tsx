'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { trackFunnelEvent } from '@/next/lib/analytics/funnel-tracker';

export function ScrollCTA() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const depth = (window.scrollY + window.innerHeight) / Math.max(document.documentElement.scrollHeight, 1);
      if (depth >= 0.6) setVisible(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-800 bg-neutral-950/95 px-4 py-3 text-slate-100 shadow-2xl backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <p className="text-sm">Turn this into a remembered AI workspace.</p>
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem('cq_cta_clicked', '1');
            void trackFunnelEvent('cta_click', { cta_location: 'scroll_60' });
            router.push('/register');
          }}
          className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
        >
          Start free
        </button>
      </div>
    </div>
  );
}
