'use client';

/**
 * VerifyContact — shown post-onboarding.
 * Collects + verifies phone number and confirms email is verified.
 * Compact — designed to slot into settings/profile page or as a banner.
 */

import { useState } from 'react';
import { CheckCircle, Mail, Phone, ShieldCheck } from 'lucide-react';
import { authHeaders } from '@/next/lib/supabase-browser';

type Status = { phone: { number: string | null; verified: boolean }; email: { address: string | null; verified: boolean } };

async function call(action: string, extra: object = {}) {
  const headers = await authHeaders();
  const res = await fetch('/api/profile/verify', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...extra }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export function VerifyContact({ onComplete }: { onComplete?: () => void }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'idle' | 'otp_sent' | 'done'>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function checkStatus() {
    setLoading(true);
    try { setStatus(await call('check')); } catch {}
    setLoading(false);
  }

  if (!status) {
    return (
      <button onClick={checkStatus} disabled={loading}
        className="text-sm text-cyan-400 underline-offset-2 hover:underline disabled:opacity-50">
        {loading ? 'Checking…' : 'Check verification status'}
      </button>
    );
  }

  const allVerified = status.phone.verified && status.email.verified;

  if (allVerified) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-sm text-emerald-300">
        <ShieldCheck className="h-4 w-4" /> Email and phone verified
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-100">Verify your contact details</h3>
      <p className="text-xs text-slate-400">Required for account recovery and critical alerts.</p>

      {error && <p className="rounded-lg bg-rose-500/10 border border-rose-400/30 px-3 py-2 text-xs text-rose-300">{error}</p>}
      {msg && <p className="rounded-lg bg-emerald-500/10 border border-emerald-400/30 px-3 py-2 text-xs text-emerald-300">{msg}</p>}

      {/* Email */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-neutral-950 p-3">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-slate-400" />
          <div>
            <p className="text-sm text-slate-100">{status.email.address || 'No email'}</p>
            <p className="text-xs text-slate-500">Email</p>
          </div>
        </div>
        {status.email.verified ? (
          <CheckCircle className="h-4 w-4 text-emerald-400" />
        ) : (
          <button
            onClick={async () => {
              setLoading(true); setError('');
              try {
                const r = await call('resend_email');
                setMsg(r.message);
              } catch (e: any) { setError(e.message); }
              setLoading(false);
            }}
            disabled={loading}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-900 disabled:opacity-60">
            Resend verification
          </button>
        )}
      </div>

      {/* Phone */}
      <div className="rounded-lg border border-slate-800 bg-neutral-950 p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-slate-400" />
          <div>
            <p className="text-sm text-slate-100">{status.phone.number || 'No phone number'}</p>
            <p className="text-xs text-slate-500">Phone</p>
          </div>
          {status.phone.verified && <CheckCircle className="h-4 w-4 ml-auto text-emerald-400" />}
        </div>

        {!status.phone.verified && (
          <>
            {step === 'idle' && (
              <div className="flex gap-2">
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+447700900000"
                  className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                />
                <button
                  onClick={async () => {
                    setLoading(true); setError('');
                    try {
                      await call('send_phone_otp', { phone });
                      setStep('otp_sent');
                      setMsg('OTP sent. Check your messages.');
                    } catch (e: any) { setError(e.message); }
                    setLoading(false);
                  }}
                  disabled={loading || !phone.startsWith('+')}
                  className="rounded-lg bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">
                  Send OTP
                </button>
              </div>
            )}

            {step === 'otp_sent' && (
              <div className="flex gap-2">
                <input
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  maxLength={8}
                  className="w-32 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                />
                <button
                  onClick={async () => {
                    setLoading(true); setError('');
                    try {
                      await call('verify_phone_otp', { phone, token: otp });
                      setStatus(await call('check'));
                      setStep('done');
                      setMsg('Phone verified ✓');
                      if (status.email.verified) onComplete?.();
                    } catch (e: any) { setError(e.message); }
                    setLoading(false);
                  }}
                  disabled={loading || otp.length < 4}
                  className="rounded-lg bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">
                  Verify
                </button>
                <button onClick={() => setStep('idle')} className="text-xs text-slate-500 hover:text-slate-300">
                  Change number
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
