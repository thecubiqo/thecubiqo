'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, UserPlus } from 'lucide-react';
import { getBrowserSupabase } from '@/next/lib/supabase-browser';

const AUTH_RETURN_KEY = 'cubiqo_auth_return_to';
const CALLBACK_ERROR_MESSAGE = 'Sign-in could not be completed. Try Google again or use email.';

function safeReturnPath(value: string | null | undefined, fallback = '/chat') {
  if (!value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('://')) return fallback;
  return value;
}

function readInitialError() {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return params.get('error') === 'callback_failed' ? CALLBACK_ERROR_MESSAGE : '';
}

export function AuthPanel({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const isRegister = mode === 'register';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(readInitialError);

  function authReturnPath() {
    if (typeof window === 'undefined') return '/chat';
    const params = new URLSearchParams(window.location.search);
    return safeReturnPath(params.get('next'), '/chat');
  }

  function rememberAuthReturnPath() {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(AUTH_RETURN_KEY, authReturnPath());
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }

    rememberAuthReturnPath();
    const emailRedirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : undefined;
    const result =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo }
          });

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (mode === 'register' && !result.data.session) {
      setMessage('Check your email.');
      return;
    }
    router.push(authReturnPath());
  }

  async function magicLink() {
    setError('');
    setMessage('');
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }
    rememberAuthReturnPath();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    });
    if (otpError) setError(otpError.message);
    else setMessage('Check your email.');
  }

  async function googleSignIn() {
    setError('');
    setMessage('');
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }
    rememberAuthReturnPath();
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : undefined;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    });
    if (oauthError) {
      setError(
        /not enabled|not configured/i.test(oauthError.message)
          ? "Google sign-in isn't enabled yet. Use email + password for now."
          : oauthError.message
      );
    }
  }

  const accent = isRegister
    ? {
        border: 'border-violet-500/40',
        glow: 'shadow-[0_0_42px_rgba(139,92,246,0.12)]',
        badge: 'bg-violet-500/10 text-violet-100 border-violet-400/30',
        button: 'bg-violet-300 text-slate-950',
        title: 'Create your CubiQo account',
        subtitle: 'Start syncing memory, journal, and settings.',
        badgeText: 'New account'
      }
    : {
        border: 'border-cyan-500/35',
        glow: 'shadow-[0_0_42px_rgba(34,211,238,0.10)]',
        badge: 'bg-cyan-500/10 text-cyan-100 border-cyan-400/30',
        button: 'bg-cyan-300 text-slate-950',
        title: 'Welcome back',
        subtitle: 'Sign in to continue to CubiQo.',
        badgeText: 'Returning user'
      };

  return (
    <div className="grid min-h-screen place-items-center bg-neutral-950 px-4 text-slate-100">
      <form onSubmit={submit} className={`w-full max-w-md rounded-lg border bg-neutral-950 p-5 ${accent.border} ${accent.glow}`}>
        <div className="mb-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">CubiQo</p>
            <span className={`rounded-full border px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] ${accent.badge}`}>
              {accent.badgeText}
            </span>
          </div>
          <h1 className="text-2xl font-semibold">{accent.title}</h1>
          <p className="mt-2 text-sm text-slate-400">{accent.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={googleSignIn}
          className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
          </svg>
          Continue with Google
        </button>

        <div className="mb-4 flex items-center gap-3 text-xs text-slate-500">
          <span className="h-px flex-1 bg-slate-800" />
          or
          <span className="h-px flex-1 bg-slate-800" />
        </div>

        <div className="grid gap-3">
          <label className="grid gap-1 text-sm text-slate-300">
            Email
            <input type="email" value={email} onChange={event => setEmail(event.target.value)} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400" required />
          </label>
          <label className="grid gap-1 text-sm text-slate-300">
            Password
            <input type="password" value={password} onChange={event => setPassword(event.target.value)} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400" />
          </label>
        </div>

        {error && <div className="mt-3 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</div>}
        {message && <div className="mt-3 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{message}</div>}

        <div className="mt-5 grid gap-2">
          <button type="submit" className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${accent.button}`}>
            {mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
          <button type="button" onClick={magicLink} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900">
            <Mail className="h-4 w-4" />
            Email link
          </button>
        </div>

        <div className="mt-5 text-sm text-slate-400">
          {mode === 'login' ? (
            <Link className="text-cyan-200" href="/register">Need a new account? Create one</Link>
          ) : (
            <Link className="text-violet-200" href="/login">Already have an account? Sign in</Link>
          )}
        </div>
      </form>
    </div>
  );
}
