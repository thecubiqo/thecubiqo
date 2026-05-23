'use client';

import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { trackFunnelEvent } from '@/next/lib/analytics/funnel-tracker';

export function ExitIntentModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const onMouseLeave = (event: MouseEvent) => {
      if (event.clientY >= 0) return;
      if (sessionStorage.getItem('cq_exit_intent_shown') || sessionStorage.getItem('cq_cta_clicked')) return;
      sessionStorage.setItem('cq_exit_intent_shown', '1');
      setOpen(true);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="w-full max-w-[420px] rounded-xl border border-neutral-700 bg-neutral-900 p-5 text-white shadow-xl" onClick={event => event.stopPropagation()}>
        <button type="button" onClick={() => setOpen(false)} className="float-right rounded p-1 text-neutral-500 hover:text-white" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-2xl font-semibold">Get your personal AI</h2>
        <p className="mt-2 text-sm text-neutral-400">Free to start. No credit card.</p>
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem('cq_cta_clicked', '1');
            void trackFunnelEvent('cta_click', { cta_location: 'exit_intent' });
            router.push('/register');
          }}
          className="mt-5 w-full rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
        >
          Start for free
        </button>
      </div>
    </div>
  );
}
