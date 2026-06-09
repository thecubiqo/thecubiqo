'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserSupabase } from '@/next/lib/supabase-browser';

// Root entry: route into the (new) Next app — /chat when signed in, /login if not.
// (Previously rendered the legacy CRA via CubiQoNextShell.)
export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      router.replace('/login');
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      router.replace(data.session ? '/chat' : '/login');
    });
  }, [router]);

  return (
    <div className="grid min-h-screen place-items-center bg-neutral-950 text-sm text-slate-400">
      Loading CubiQo…
    </div>
  );
}
