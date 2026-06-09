'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserSupabase } from '@/next/lib/supabase-browser';

// OAuth / magic-link callback. The Supabase browser client auto-detects the
// session from the URL (detectSessionInUrl); once it lands we route into the app.
// (Previously rendered the legacy CRA via CubiQoNextShell.)
export default function AuthCallbackPage() {
  const router = useRouter();
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      router.replace('/login');
      return;
    }
    let done = false;
    const go = (path: string) => {
      if (done) return;
      done = true;
      router.replace(path);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) go('/chat');
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) go('/chat');
      else setTimeout(() => {
        supabase.auth.getSession().then(({ data: d }) => go(d.session ? '/chat' : '/login'));
      }, 2000);
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  return (
    <div className="grid min-h-screen place-items-center bg-neutral-950 text-sm text-slate-400">
      Signing you in…
    </div>
  );
}
