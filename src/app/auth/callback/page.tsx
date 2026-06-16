'use client';

import { useEffect, useRef, useState } from 'react';
import { getBrowserSupabase } from '@/next/lib/supabase-browser';

const AUTH_RETURN_KEY = 'cubiqo_auth_return_to';
const AUTH_CALLBACK_STATUS_KEY = 'cubiqo_auth_callback_status';
const DEFAULT_SUCCESS_PATH = '/chat';
const FAILURE_PATH = '/login?error=callback_failed';

function safeReturnPath(value: string | null | undefined, fallback = DEFAULT_SUCCESS_PATH) {
  if (!value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('://')) return fallback;
  return value;
}

function consumeReturnPath(params: URLSearchParams) {
  const queryReturn = safeReturnPath(params.get('next'), '');
  if (queryReturn) return queryReturn;

  const storedReturn = window.sessionStorage.getItem(AUTH_RETURN_KEY);
  window.sessionStorage.removeItem(AUTH_RETURN_KEY);
  return safeReturnPath(storedReturn, DEFAULT_SUCCESS_PATH);
}

function withAppCallbackMarker(path: string) {
  if (path !== '/app' && !path.startsWith('/app?')) return path;
  const [pathname, query = ''] = path.split('?');
  const params = new URLSearchParams(query);
  params.set('auth', 'callback');
  return `${pathname}?${params.toString()}`;
}

function writeCallbackStatus(status: Record<string, unknown>) {
  try {
    window.localStorage.setItem(
      AUTH_CALLBACK_STATUS_KEY,
      JSON.stringify({ ...status, at: Date.now() })
    );
  } catch {
    // localStorage can be unavailable in locked-down browser modes; auth still proceeds.
  }
}

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
      const returnPath = consumeReturnPath(params);

      try {
        if (code) {
          const { data: exchangeData, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          // Force the returned PKCE session into the shared Supabase storage key before /app hydrates.
          // This keeps the Next.js callback and legacy app shell reading the same browser session.
          if (exchangeData.session?.access_token && exchangeData.session?.refresh_token) {
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: exchangeData.session.access_token,
              refresh_token: exchangeData.session.refresh_token
            });
            if (setSessionError) throw setSessionError;
          }
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data.session?.user) {
          setStatus('Signed in. Opening CubiQo...');
          const nextPath = withAppCallbackMarker(returnPath);
          writeCallbackStatus({ ok: true, nextPath });
          window.location.replace(nextPath);
          return;
        }

        throw new Error('No active session found after OAuth callback.');
      } catch (error) {
        writeCallbackStatus({
          ok: false,
          error: error instanceof Error ? error.message.slice(0, 240) : 'OAuth callback failed'
        });
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
