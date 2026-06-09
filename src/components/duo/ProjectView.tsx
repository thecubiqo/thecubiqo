'use client';

/**
 * ProjectView — renders a capsule's structured "live view" (DuoProjectView)
 * as the screenshot-style dashboard: a headline + status, a row of stat cards,
 * a results table with status badges, optional prose sections, a proactive
 * "what CubiQo is doing next" list, and a money-angle callout.
 *
 * It is injection-safe by construction: everything is plain text rendered by
 * React (no model-authored HTML), so a capsule view can never inject markup.
 * Mounted by <ArtifactPane> whenever an artifact has type 'view'.
 */

import { ArrowUpRight, Sparkles, TrendingUp } from 'lucide-react';
import type { DuoProjectView, ViewTone } from '@/next/types/duo-view';

function toneClasses(tone?: ViewTone): string {
  switch (tone) {
    case 'positive':
      return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
    case 'warning':
      return 'border-amber-400/30 bg-amber-400/10 text-amber-200';
    case 'danger':
      return 'border-rose-400/30 bg-rose-400/10 text-rose-200';
    case 'info':
      return 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200';
    default:
      return 'border-slate-700/50 bg-slate-900 text-slate-300';
  }
}

function statValueTone(tone?: ViewTone): string {
  switch (tone) {
    case 'positive':
      return 'text-emerald-300';
    case 'warning':
      return 'text-amber-300';
    case 'danger':
      return 'text-rose-300';
    case 'info':
      return 'text-cyan-300';
    default:
      return 'text-slate-100';
  }
}

export function ProjectView({ view }: { view: DuoProjectView }) {
  const generated = view.generatedAt ? new Date(view.generatedAt) : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-100">{view.headline}</h2>
          {view.subtitle && <p className="mt-0.5 text-sm text-slate-400">{view.subtitle}</p>}
        </div>
        {view.status && (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
            {view.status}
          </span>
        )}
      </div>

      {/* Stat cards */}
      {view.stats?.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {view.stats.slice(0, 4).map((stat, i) => (
            <div key={i} className="rounded-xl border border-slate-800 bg-neutral-950 p-3.5">
              <div className={`text-2xl font-bold ${statValueTone(stat.tone)}`}>{stat.value}</div>
              <div className="mt-1 text-xs text-slate-400">{stat.label}</div>
              {stat.hint && <div className="mt-0.5 text-[0.65rem] text-slate-600">{stat.hint}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Results table */}
      {view.columns?.length && view.rows?.length ? (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-neutral-950">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-[0.6rem] uppercase tracking-[0.12em] text-slate-500">
                {view.columns.map((col, i) => (
                  <th key={i} className="px-3 py-2 font-semibold">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {view.rows.slice(0, 50).map((row, ri) => (
                <tr key={ri} className="hover:bg-slate-900/50">
                  {view.columns!.map((_, ci) => {
                    const isLast = ci === view.columns!.length - 1;
                    const cell = row.cells[ci] ?? '';
                    return (
                      <td key={ci} className="px-3 py-2.5 align-top text-slate-200">
                        {isLast && row.badge ? (
                          <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs ${toneClasses(row.badge.tone)}`}>
                            {row.badge.label}
                          </span>
                        ) : row.href && ci === 0 ? (
                          <a href={row.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200">
                            {cell} <ArrowUpRight className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className={ci === 0 ? 'font-medium text-slate-100' : 'text-slate-400'}>{cell}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Prose sections */}
      {view.sections?.map((section, i) => (
        <div key={i} className="rounded-xl border border-slate-800 bg-neutral-950 p-4">
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{section.heading}</div>
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{section.body}</p>
        </div>
      ))}

      {/* Proactive next actions */}
      {view.nextActions?.length ? (
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" /> What CubiQo is doing next
          </div>
          <ul className="space-y-1.5">
            {view.nextActions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-200">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Money angle */}
      {view.moneyAngle && (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
          <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
          <p className="text-sm leading-6 text-emerald-100">{view.moneyAngle}</p>
        </div>
      )}

      {generated && (
        <p className="text-right text-[0.65rem] text-slate-600">
          Live view · updated {generated.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
