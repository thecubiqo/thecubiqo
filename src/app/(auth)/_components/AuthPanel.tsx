'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, UserPlus } from 'lucide-react';
import { getBrowserSupabase } from '@/next/lib/supabase-browser';

export function AuthPanel({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }

    const result =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (mode === 'register' && !result.data.session) {
      setMessage('Check your email.');
      return;
    }
    router.push('/chat');
  }

  async function magicLink() {
    setError('');
    setMessage('');
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    });
    if (otpError) setError(otpError.message);
    else setMessage('Check your email.');
  }

  return (
    <div className="grid min-h-screen place-items-center bg-neutral-950 px-4 text-slate-100">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-slate-800 bg-neutral-950 p-5">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">CubiQo</p>
          <h1 className="text-2xl font-semibold">{mode === 'login' ? 'Login' : 'Register'}</h1>
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
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950">
            {mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {mode === 'login' ? 'Login' : 'Register'}
          </button>
          <button type="button" onClick={magicLink} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900">
            <Mail className="h-4 w-4" />
            Email link
          </button>
        </div>

        <div className="mt-5 text-sm text-slate-400">
          {mode === 'login' ? (
            <Link className="text-cyan-200" href="/register">Create account</Link>
          ) : (
            <Link className="text-cyan-200" href="/login">Login instead</Link>
          )}
        </div>
      </form>
    </div>
  );
}
