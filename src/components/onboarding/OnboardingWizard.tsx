'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Check, ChevronRight, Save } from 'lucide-react';
import { ONBOARDING_STEPS, STEP_ORDER } from '@/next/lib/onboarding/step-config';
import type { OnboardingStepId } from '@/next/types/onboarding';
import { authHeaders } from '@/next/lib/supabase-browser';

type Progress = {
  completedSteps: OnboardingStepId[];
  skippedSteps: OnboardingStepId[];
  isComplete: boolean;
};

type ProfileDraft = {
  occupation: string;
  primaryGoal: string;
  goalDomain: string;
  primaryDrive: string;
  whatBlocks: string;
  interests: string;
  tone: string;
  timezone: string;
  languagePreference: string;
};

type Props = {
  onComplete?: () => void;
};

const defaultProfile = (): ProfileDraft => ({
  occupation: '',
  primaryGoal: '',
  goalDomain: '',
  primaryDrive: '',
  whatBlocks: '',
  interests: '',
  tone: 'direct',
  timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' : 'UTC',
  languagePreference: typeof navigator !== 'undefined' ? navigator.language || 'en' : 'en'
});

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = await authHeaders();
  if (!headers.Authorization) {
    throw new Error('Authentication required');
  }
  const response = await fetch(url, {
    ...init,
    headers: {
      ...headers,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Onboarding request failed');
  return data as T;
}

export function OnboardingWizard({ onComplete }: Props) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [activeStep, setActiveStep] = useState<OnboardingStepId>('welcome');
  const [profile, setProfile] = useState<ProfileDraft>(() => defaultProfile());
  const [firstMessage, setFirstMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const stepIndex = Math.max(0, STEP_ORDER.indexOf(activeStep));
  const currentStep = ONBOARDING_STEPS.find(step => step.id === activeStep) || ONBOARDING_STEPS[0];
  const progressPct = ((stepIndex + 1) / ONBOARDING_STEPS.length) * 100;

  const completionProfile = useMemo(() => ({
    ...profile,
    interests: profile.interests.split(',').map(item => item.trim()).filter(Boolean),
    contextSummary: `${profile.occupation}. Goal: ${profile.primaryGoal}. Blocker: ${profile.whatBlocks}.`
  }), [profile]);

  async function load() {
    try {
      const data = await requestJson<Progress>('/api/onboarding/progress');
      setProgress(data);
      const next = STEP_ORDER.find(step => !data.completedSteps.includes(step) && !data.skippedSteps.includes(step));
      if (next) setActiveStep(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load onboarding');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function completeStep(step: OnboardingStepId, skipped = false) {
    setLoading(true);
    setError('');
    try {
      await requestJson('/api/onboarding/progress', {
        method: 'POST',
        body: JSON.stringify({ step, skipped, data: completionProfile })
      });
      await load();
      const index = STEP_ORDER.indexOf(step);
      if (index >= 0 && STEP_ORDER[index + 1]) setActiveStep(STEP_ORDER[index + 1]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update onboarding');
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await requestJson('/api/onboarding/complete', {
        method: 'POST',
        body: JSON.stringify({ profile: completionProfile, firstMessage })
      });
      await load();
      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete onboarding');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Setup</p>
        <h2 className="text-2xl font-semibold text-slate-50">Onboarding</h2>
      </div>

      {error && <div className="mb-4 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-2">
          {ONBOARDING_STEPS.map(step => {
            const done = progress?.completedSteps.includes(step.id);
            const skipped = progress?.skippedSteps.includes(step.id);
            const active = activeStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left text-sm ${
                  active ? 'border-cyan-300 bg-cyan-300/10 text-cyan-50' : 'border-slate-800 bg-neutral-950 text-slate-300'
                }`}
              >
                <span>{step.title}</span>
                {done ? <Check className="h-4 w-4 text-emerald-300" /> : skipped ? <span className="text-xs text-slate-500">Skip</span> : <ChevronRight className="h-4 w-4 text-slate-500" />}
              </button>
            );
          })}
        </aside>

        <form onSubmit={submit} className="rounded-lg border border-slate-800 bg-neutral-950 p-4">
          <div className="mb-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-100">{currentStep.title}</span>
              <span className="text-xs text-slate-500">Step {stepIndex + 1} of {ONBOARDING_STEPS.length}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-lg bg-slate-800">
              <div className="h-full rounded-lg bg-cyan-300 transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="mt-2 text-sm text-slate-400">{currentStep.description}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm text-slate-300">
              Occupation
              <input value={profile.occupation} onChange={event => setProfile({ ...profile, occupation: event.target.value })} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400" />
            </label>
            <label className="grid gap-1 text-sm text-slate-300">
              Goal domain
              <input value={profile.goalDomain} onChange={event => setProfile({ ...profile, goalDomain: event.target.value })} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400" />
            </label>
            <label className="grid gap-1 text-sm text-slate-300 md:col-span-2">
              Primary goal
              <textarea value={profile.primaryGoal} onChange={event => setProfile({ ...profile, primaryGoal: event.target.value })} className="min-h-24 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400" />
            </label>
            <label className="grid gap-1 text-sm text-slate-300">
              Drive
              <input value={profile.primaryDrive} onChange={event => setProfile({ ...profile, primaryDrive: event.target.value })} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400" />
            </label>
            <label className="grid gap-1 text-sm text-slate-300">
              Blocker
              <input value={profile.whatBlocks} onChange={event => setProfile({ ...profile, whatBlocks: event.target.value })} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400" />
            </label>
            <label className="grid gap-1 text-sm text-slate-300">
              Interests
              <input value={profile.interests} onChange={event => setProfile({ ...profile, interests: event.target.value })} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400" />
            </label>
            <label className="grid gap-1 text-sm text-slate-300">
              Tone
              <select value={profile.tone} onChange={event => setProfile({ ...profile, tone: event.target.value })} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400">
                <option value="direct">Direct</option>
                <option value="warm">Warm</option>
                <option value="structured">Structured</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm text-slate-300 md:col-span-2">
              First message
              <textarea value={firstMessage} onChange={event => setFirstMessage(event.target.value)} className="min-h-24 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400" />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {currentStep.skippable && (
              <button type="button" onClick={() => completeStep(activeStep, true)} disabled={loading} className="rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900 disabled:opacity-60">
                Skip
              </button>
            )}
            <button type="button" onClick={() => completeStep(activeStep)} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900 disabled:opacity-60">
              <Check className="h-4 w-4" />
              Step done
            </button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60">
              <Save className="h-4 w-4" />
              Finish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
