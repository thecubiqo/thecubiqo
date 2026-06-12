'use client';

import { useEffect, useRef, useState } from 'react';
import { getBrowserSupabase } from '@/next/lib/supabase-browser';

const SUCCESS_PATH = '/chat';
const FAILURE_PATH = '/login?error=callback_failed';

export default function AuthCallbackPage() {
  const didRun = useRef(false);
  const [status, setStatus] = useState('Signing you in...');

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    async function completeSignIn() {
      const supabase = getBrowserSupabase();
      if (!supabase) {
        setStatus('Sign-in configuration is unavailable. Redirecting...');
        window.location.replace(FAILURE_PATH);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data.session?.user) {
          setStatus('Signed in. Opening CubiQo...');
          window.location.replace(SUCCESS_PATH);
          return;
        }

        throw new Error('No active session found after OAuth callback.');
      } catch {
        setStatus('Sign-in failed. Redirecting...');
        window.location.replace(FAILURE_PATH);
      }
    }

    completeSignIn();
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-neutral-950 px-6 text-slate-100">
      <section
        aria-live="polite"
        className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950/80 p-6 text-center shadow-2xl"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">CubiQo</p>
        <h1 className="mt-3 text-2xl font-semibold">{status}</h1>
      </section>
    </main>
  );
}
