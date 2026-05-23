import type { ChatroomRGYAggregate } from '@/next/types/rgy';

type ChatroomRGYBarProps = {
  aggregate: ChatroomRGYAggregate;
  showCounts?: boolean;
};

function pct(count: number, total: number) {
  return total > 0 ? Math.max(0, Math.min(100, (count / total) * 100)) : 0;
}

export function ChatroomRGYBar({ aggregate, showCounts = true }: ChatroomRGYBarProps) {
  const greenPct = pct(aggregate.greenCount, aggregate.total);
  const yellowPct = pct(aggregate.yellowCount, aggregate.total);
  const redPct = pct(aggregate.redCount, aggregate.total);

  return (
    <div className="space-y-2">
      <div className="flex h-2 overflow-hidden rounded-lg bg-slate-800" aria-label="Chatroom RGY distribution">
        <div className="bg-emerald-400 transition-all" style={{ width: `${greenPct}%` }} />
        <div className="bg-amber-300 transition-all" style={{ width: `${yellowPct}%` }} />
        <div className="bg-rose-400 transition-all" style={{ width: `${redPct}%` }} />
      </div>
      {showCounts && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" />{aggregate.greenCount}</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-300" />{aggregate.yellowCount}</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" />{aggregate.redCount}</span>
          <span className="ml-auto font-medium text-slate-300">Health {aggregate.healthScore}/100</span>
        </div>
      )}
    </div>
  );
}
