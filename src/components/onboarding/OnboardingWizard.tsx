'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Check, ChevronRight, ArrowRight, Zap } from 'lucide-react';
import { ONBOARDING_STEPS, STEP_ORDER } from '@/next/lib/onboarding/step-config';
import type { OnboardingStepId } from '@/next/types/onboarding';
import { authHeaders } from '@/next/lib/supabase-browser';

type Progress = {
  completedSteps: OnboardingStepId[];
  skippedSteps: OnboardingStepId[];
  isComplete: boolean;
};

type ProfileDraft = {
  // Step: right_now
  rightNow: string;       // "what are you actively working on"
  blocker: string;        // "what's in the way"
  // Step: about_you
  occupation: string;
  interests: string;
  // Step: how_you_work
  tone: string;           // direct | warm | structured
  constraints: string;    // budget, tools, things to avoid
  timezone: string;
  languagePreference: string;
  // Derived
  primaryGoal: string;
  goalDomain: string;
  primaryDrive: string;
  whatBlocks: string;
};

type Props = {
  onComplete?: (firstMessage?: string) => void;
};

const defaultProfile = (): ProfileDraft => ({
  rightNow: '',
  blocker: '',
  occupation: '',
  interests: '',
  tone: 'direct',
  constraints: '',
  timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' : 'UTC',
  languagePreference: typeof navigator !== 'undefined' ? navigator.language || 'en' : 'en',
  primaryGoal: '',
  goalDomain: '',
  primaryDrive: '',
  whatBlocks: '',
});

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = await authHeaders();
  if (!headers.Authorization) throw new Error('Authentication required');
  const response = await fetch(url, {
    ...init,
    headers: {
      ...headers,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Onboarding request failed');
  return data as T;
}

function field(label: string, children: React.ReactNode, hint?: string) {
  return (
    <label className="grid gap-1 text-sm text-slate-300">
      <span className="font-medium">{label}</span>
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
      {children}
    </label>
  );
}

const inputCls =
  'rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400 placeholder:text-slate-600';
const textareaCls = `${inputCls} min-h-[90px] resize-y`;

export function OnboardingWizard({ onComplete }: Props) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [activeStep, setActiveStep] = useState<OnboardingStepId>('welcome');
  const [profile, setProfile] = useState<ProfileDraft>(() => defaultProfile());
  const [firstMessage, setFirstMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const stepIndex = Math.max(0, STEP_ORDER.indexOf(activeStep));
  const currentStep = ONBOARDING_STEPS.find(s => s.id === activeStep) || ONBOARDING_STEPS[0];
  const progressPct = ((stepIndex + 1) / ONBOARDING_STEPS.length) * 100;

  // Derive legacy fields from new fields so the API stays compatible
  function buildApiProfile() {
    const interests = profile.interests.split(',').map(s => s.trim()).filter(Boolean);
    return {
      occupation: profile.occupation,
      primaryGoal: profile.rightNow || profile.primaryGoal,
      goalDomain: profile.goalDomain,
      primaryDrive: profile.rightNow,
      whatBlocks: profile.blocker || profile.whatBlocks,
      interests,
      tone: profile.tone,
      timezone: profile.timezone,
      languagePreference: profile.languagePreference,
      constraints: profile.constraints,
      contextSummary: [
        profile.occupation ? `Role: ${profile.occupation}` : '',
        profile.rightNow ? `Working on: ${profile.rightNow}` : '',
        profile.blocker ? `Blocker: ${profile.blocker}` : '',
        profile.constraints ? `Constraints: ${profile.constraints}` : '',
      ].filter(Boolean).join(' | '),
    };
  }

  async function load() {
    try {
      const data = await requestJson<Progress>('/api/onboarding/progress');
      setProgress(data);
      const next = STEP_ORDER.find(
        s => !data.completedSteps.includes(s) && !data.skippedSteps.includes(s)
      );
      if (next) setActiveStep(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load onboarding');
    }
  }

  useEffect(() => { load(); }, []);

  async function advance(skip = false) {
    setLoading(true);
    setError('');
    try {
      await requestJson('/api/onboarding/progress', {
        method: 'POST',
        body: JSON.stringify({ step: activeStep, skipped: skip, data: buildApiProfile() }),
      });
      await load();
      const idx = STEP_ORDER.indexOf(activeStep);
      if (idx >= 0 && STEP_ORDER[idx + 1]) setActiveStep(STEP_ORDER[idx + 1]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save step');
    } finally {
      setLoading(false);
    }
  }

  async function finish(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Carry the anonymous pre-signup session into the new account (best-effort).
      let anonSession: unknown;
      try {
        const { getSession } = await import('@/next/lib/memory/local-session');
        const s = getSession();
        if (s) anonSession = { signals: s.signals, last_summary: s.last_summary, permissions: s.permissions };
      } catch { /* no local session — ignore */ }

      const result = await requestJson<{ ok: boolean; firstMessage?: string; redirectTo?: string }>(
        '/api/onboarding/complete',
        {
          method: 'POST',
          body: JSON.stringify({ profile: buildApiProfile(), firstMessage, anonSession }),
        }
      );
      await load();
      onComplete?.(result.firstMessage || firstMessage || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete onboarding');
    } finally {
      setLoading(false);
    }
  }

  // ── Step content ──────────────────────────────────────────────────────────
  function renderStepContent() {
    switch (activeStep) {
      case 'welcome':
        return (
          <div className="flex flex-col gap-4">
            <p className="text-slate-300 leading-relaxed">
              CubiQo is your agentic AI companion — it can converse, remember, and act across your tools.
              The more context you give it upfront, the more useful every session becomes.
            </p>
            <p className="text-slate-400 text-sm">
              This takes about 2 minutes. Most steps are optional. You can always update later.
            </p>
            <button
              type="button"
              onClick={() => advance()}
              disabled={loading}
              className="inline-flex items-center gap-2 self-start rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              <ArrowRight className="h-4 w-4" />
              Get started
            </button>
          </div>
        );

      case 'right_now':
        return (
          <div className="grid gap-4">
            <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-xs text-cyan-300">
              This is the most important step. What you tell CubiQo here gets injected into every conversation.
            </div>
            {field(
              'What are you actively working on right now?',
              <textarea
                value={profile.rightNow}
                onChange={e => setProfile({ ...profile, rightNow: e.target.value })}
                className={textareaCls}
                placeholder="e.g. Building a Shopify store for print-on-demand. Trying to launch within 3 weeks."
              />,
              'Be specific — project name, goal, deadline if any'
            )}
            {field(
              "What's getting in the way?",
              <textarea
                value={profile.blocker}
                onChange={e => setProfile({ ...profile, blocker: e.target.value })}
                className={textareaCls}
                placeholder="e.g. Don't know how to set up fulfilment. Stuck on pricing strategy."
              />,
              'Your current biggest blocker — CubiQo will prioritise helping with this'
            )}
          </div>
        );

      case 'about_you':
        return (
          <div className="grid gap-4">
            {field(
              'Occupation / role',
              <input
                value={profile.occupation}
                onChange={e => setProfile({ ...profile, occupation: e.target.value })}
                className={inputCls}
                placeholder="e.g. Freelance designer, founder, student…"
              />
            )}
            {field(
              'Interests (comma-separated)',
              <input
                value={profile.interests}
                onChange={e => setProfile({ ...profile, interests: e.target.value })}
                className={inputCls}
                placeholder="e.g. e-commerce, fitness, music production"
              />
            )}
          </div>
        );

      case 'how_you_work':
        return (
          <div className="grid gap-4">
            {field(
              'How should CubiQo sound?',
              <select
                value={profile.tone}
                onChange={e => setProfile({ ...profile, tone: e.target.value })}
                className={inputCls}
              >
                <option value="direct">Direct — concise, action-first, no filler</option>
                <option value="warm">Warm — conversational, encouraging, like a friend</option>
                <option value="structured">Structured — clear headers, bullet points, thorough</option>
              </select>
            )}
            {field(
              'Constraints CubiQo should respect',
              <textarea
                value={profile.constraints}
                onChange={e => setProfile({ ...profile, constraints: e.target.value })}
                className={textareaCls}
                placeholder="e.g. Budget under £500. No Puppeteer (account ban risk). UK-based. Prefer free tools where possible."
              />,
              'Budget, tools to avoid, location, legal, anything relevant'
            )}
          </div>
        );

      case 'connector_setup':
        return (
          <div className="flex flex-col gap-4">
            <p className="text-slate-400 text-sm">
              Connect accounts so CubiQo can act — not just advise. Gmail, LinkedIn, GitHub, Notion and more.
              You can skip this and connect later when a task needs it.
            </p>
            <a
              href="/connectors"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900"
            >
              <Zap className="h-4 w-4 text-cyan-300" />
              Open connector settings
            </a>
          </div>
        );

      case 'first_message':
        return (
          <div className="grid gap-4">
            <p className="text-slate-400 text-sm">
              Send your first message. CubiQo already has your context loaded — just tell it what you need.
            </p>
            {field(
              'Your first message',
              <textarea
                value={firstMessage}
                onChange={e => setFirstMessage(e.target.value)}
                className={textareaCls}
                placeholder="e.g. Help me plan the first 7 days of my Shopify launch…"
              />,
              'This fires immediately into the chat when you click Finish'
            )}
          </div>
        );

      default:
        return null;
    }
  }

  const isLastStep = activeStep === STEP_ORDER[STEP_ORDER.length - 1];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Setup</p>
        <h2 className="text-2xl font-semibold text-slate-50">Onboarding</h2>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        {/* Sidebar nav */}
        <aside className="space-y-1.5">
          {ONBOARDING_STEPS.map(step => {
            const done = progress?.completedSteps.includes(step.id);
            const skipped = progress?.skippedSteps.includes(step.id);
            const active = activeStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                  active
                    ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-50'
                    : 'border-slate-800 bg-neutral-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{step.title}</span>
                {done ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : skipped ? (
                  <span className="text-xs text-slate-600">Skipped</span>
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                )}
              </button>
            );
          })}
        </aside>

        {/* Step content */}
        <form onSubmit={finish} className="rounded-xl border border-slate-800 bg-neutral-950 p-5">
          {/* Progress bar */}
          <div className="mb-5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-100">{currentStep.title}</span>
              <span className="text-xs text-slate-500">
                {stepIndex + 1} / {ONBOARDING_STEPS.length}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-cyan-400 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">{currentStep.description}</p>
          </div>

          {/* Dynamic step body */}
          <div className="mb-6">{renderStepContent()}</div>

          {/* Actions — only show advance/skip for non-welcome steps */}
          {activeStep !== 'welcome' && (
            <div className="flex flex-wrap gap-2">
              {currentStep.skippable && (
                <button
                  type="button"
                  onClick={() => advance(true)}
                  disabled={loading}
                  className="rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-400 hover:bg-slate-900 disabled:opacity-60"
                >
                  Skip
                </button>
              )}
              {isLastStep ? (
                <button
                  type="submit"
                  disabled={loading || !firstMessage.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
                >
                  <ArrowRight className="h-4 w-4" />
                  {loading ? 'Starting…' : 'Finish & open chat'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => advance()}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-60"
                >
                  <Check className="h-4 w-4" />
                  {loading ? 'Saving…' : 'Continue'}
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
