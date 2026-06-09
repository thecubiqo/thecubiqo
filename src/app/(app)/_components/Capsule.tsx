'use client';

// The CubiQo RGY capsule — the atomic signal unit: COLOR (R/G/Y) · KEYWORD · INTENT.
// Used in the right panel and anywhere a live signal is surfaced.

const RGY: Record<string, { dot: string; ring: string; bg: string; text: string; chip: string }> = {
  green: {
    dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]',
    ring: 'border-emerald-400/40', bg: 'bg-emerald-400/5',
    text: 'text-emerald-100', chip: 'bg-emerald-400/15 text-emerald-200',
  },
  yellow: {
    dot: 'bg-amber-400 shadow-[0_0_8px_rgba(250,204,21,0.7)]',
    ring: 'border-amber-400/40', bg: 'bg-amber-400/5',
    text: 'text-amber-100', chip: 'bg-amber-400/15 text-amber-200',
  },
  red: {
    dot: 'bg-rose-400 shadow-[0_0_8px_rgba(244,114,114,0.7)]',
    ring: 'border-rose-400/40', bg: 'bg-rose-400/5',
    text: 'text-rose-100', chip: 'bg-rose-400/15 text-rose-200',
  },
};

const INTENT_LABEL: Record<string, string> = {
  socialize: 'Socialize',
  collaborate: 'Collaborate',
  trade: 'Trade',
};

export type CapsuleData = {
  id?: string;
  color?: string | null;
  keyword?: string | null;
  intent?: string | null;
};

/** Derive the display intent from a signal row (confirmed > suggested). */
export function signalIntent(s: { confirmed_intents?: string[] | null; suggested_intents?: string[] | null }): string | null {
  return s.confirmed_intents?.[0] || s.suggested_intents?.[0] || null;
}

export function Capsule({ color, keyword, intent }: { color?: string | null; keyword?: string | null; intent?: string | null }) {
  const c = RGY[String(color || 'yellow').toLowerCase()] || RGY.yellow;
  const intentLabel = intent ? (INTENT_LABEL[String(intent).toLowerCase()] || intent) : null;
  return (
    <div className={`flex items-center gap-2 rounded-full border ${c.ring} ${c.bg} px-3 py-1.5`}>
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${c.dot}`} />
      <span className={`min-w-0 flex-1 truncate text-sm font-medium ${c.text}`}>{keyword || 'signal'}</span>
      {intentLabel && (
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wider ${c.chip}`}>
          {intentLabel}
        </span>
      )}
    </div>
  );
}
