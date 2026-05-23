import type { RGYStatus } from '@/next/types/rgy';

type RGYBadgeProps = {
  status?: RGYStatus | string | null;
  score?: number | null;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const STATUS_CONFIG: Record<RGYStatus, { label: string; dot: string; tone: string }> = {
  green: {
    label: 'Active',
    dot: 'bg-emerald-400',
    tone: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100'
  },
  yellow: {
    label: 'Idle',
    dot: 'bg-amber-300',
    tone: 'border-amber-300/40 bg-amber-300/10 text-amber-100'
  },
  red: {
    label: 'Dormant',
    dot: 'bg-rose-400',
    tone: 'border-rose-400/40 bg-rose-400/10 text-rose-100'
  }
};

const SIZE_CONFIG = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base'
};

function normalizeStatus(status: RGYBadgeProps['status']): RGYStatus {
  return status === 'green' || status === 'yellow' || status === 'red' ? status : 'yellow';
}

export function RGYBadge({ status, score, showScore = false, size = 'md' }: RGYBadgeProps) {
  const normalized = normalizeStatus(status);
  const cfg = STATUS_CONFIG[normalized];

  return (
    <span className={`inline-flex items-center gap-2 rounded-lg border font-medium ${cfg.tone} ${SIZE_CONFIG[size]}`}>
      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} aria-hidden="true" />
      <span>{cfg.label}</span>
      {showScore && score != null && <span className="text-current/70">{Math.round(score)}</span>}
    </span>
  );
}
