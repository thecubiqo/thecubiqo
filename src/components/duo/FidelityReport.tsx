import { CheckCircle2, CircleDashed, XCircle } from 'lucide-react';
import type { FidelityCriterionStatus, FidelityReport as FidelityReportData } from '@/next/types/duo-fidelity';

type Props = {
  report: FidelityReportData;
};

const STATUS_TONE: Record<FidelityCriterionStatus, string> = {
  pass: 'text-emerald-300',
  fail: 'text-rose-300',
  untested: 'text-slate-400'
};

function StatusIcon({ status }: { status: FidelityCriterionStatus }) {
  if (status === 'pass') return <CheckCircle2 className="h-4 w-4 text-emerald-300" />;
  if (status === 'fail') return <XCircle className="h-4 w-4 text-rose-300" />;
  return <CircleDashed className="h-4 w-4 text-slate-400" />;
}

function scoreTone(score: number) {
  if (score >= 80) return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100';
  if (score >= 50) return 'border-amber-300/40 bg-amber-300/10 text-amber-100';
  return 'border-rose-400/40 bg-rose-400/10 text-rose-100';
}

export function FidelityReport({ report }: Props) {
  return (
    <div className="space-y-3">
      <div className={`rounded-lg border p-3 ${scoreTone(report.overallScore)}`}>
        <div className="text-2xl font-semibold">{report.overallScore}%</div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-black/15 p-2">{report.passCount} pass</div>
          <div className="rounded-lg bg-black/15 p-2">{report.failCount} fail</div>
          <div className="rounded-lg bg-black/15 p-2">{report.untestedCount} open</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-800">
        {report.criteria.map(criterion => (
          <div key={criterion.id || criterion.testId} className="flex items-start gap-3 border-b border-slate-800 px-3 py-3 last:border-b-0">
            <StatusIcon status={criterion.status} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-100">{criterion.criterion}</div>
              {criterion.evidence && <p className="mt-1 text-xs leading-5 text-slate-400">{criterion.evidence}</p>}
            </div>
            <span className={`text-xs font-medium uppercase ${STATUS_TONE[criterion.status]}`}>{criterion.testerType}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
