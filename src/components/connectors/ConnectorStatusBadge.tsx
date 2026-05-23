import type { HealthStatus } from '@/next/types/connectors';

interface Props {
  connected: boolean;
  healthStatus: HealthStatus;
}

const statusMap: Record<HealthStatus, { dot: string; label: string }> = {
  healthy: { dot: 'bg-emerald-500', label: 'Live' },
  degraded: { dot: 'bg-amber-500', label: 'Degraded' },
  broken: { dot: 'bg-red-500', label: 'Broken' },
  unknown: { dot: 'bg-slate-400', label: 'Connected' },
};

export function ConnectorStatusBadge({ connected, healthStatus }: Props) {
  if (!connected) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
        Not connected
      </span>
    );
  }

  const status = statusMap[healthStatus] || statusMap.unknown;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
      {status.label}
    </span>
  );
}
