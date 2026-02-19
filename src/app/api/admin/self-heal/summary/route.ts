/**
 * Self-Heal Daily Summary API
 * GET /api/admin/self-heal/summary
 * 
 * Returns aggregated metrics from the most recent self-heal reports,
 * including health score trends, repair success rates, and performance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Round a number to one decimal place */
function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Math.min(parseInt(searchParams.get('days') || '7', 10), 90);

    const supabase = await createClient();

    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: reports, error } = await (supabase as any)
      .from('self_heal_reports')
      .select('status, diagnostics, repairs, execution_time_ms, fixed_issues, critical_issues, run_date')
      .gte('run_date', since.toISOString())
      .order('run_date', { ascending: false });

    if (error) {
      console.error('[Self-Heal Summary] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reports', details: error.message },
        { status: 500 }
      );
    }

    const reportList = reports || [];
    const totalRuns = reportList.length;

    if (totalRuns === 0) {
      return NextResponse.json({
        period: { days, since: since.toISOString() },
        totalRuns: 0,
        successRate: 0,
        avgExecutionMs: 0,
        statusBreakdown: { success: 0, partial: 0, failed: 0 },
        avgHealthScore: 0,
        totalRepairsAttempted: 0,
        totalRepairsSucceeded: 0,
        repairSuccessRate: 0,
        totalFixedIssues: 0,
        totalCriticalIssues: 0,
      });
    }

    const statusBreakdown = { success: 0, partial: 0, failed: 0 };
    let totalExecutionMs = 0;
    let totalRepairs = 0;
    let totalRepairsOk = 0;
    let totalFixed = 0;
    let totalCritical = 0;
    let healthScoreSum = 0;

    for (const r of reportList) {
      statusBreakdown[r.status as keyof typeof statusBreakdown] =
        (statusBreakdown[r.status as keyof typeof statusBreakdown] || 0) + 1;
      totalExecutionMs += r.execution_time_ms || 0;

      const diags = Array.isArray(r.diagnostics) ? r.diagnostics : [];
      const healthyCount = diags.filter((d: any) => d.status === 'healthy').length;
      healthScoreSum += diags.length > 0 ? (healthyCount / diags.length) * 100 : 0;

      const repairs = Array.isArray(r.repairs) ? r.repairs : [];
      totalRepairs += repairs.length;
      totalRepairsOk += repairs.filter((rep: any) => rep.status === 'success').length;

      totalFixed += Array.isArray(r.fixed_issues) ? r.fixed_issues.length : 0;
      totalCritical += Array.isArray(r.critical_issues) ? r.critical_issues.length : 0;
    }

    return NextResponse.json({
      period: { days, since: since.toISOString() },
      totalRuns,
      successRate: roundOne((statusBreakdown.success / totalRuns) * 100),
      avgExecutionMs: Math.round(totalExecutionMs / totalRuns),
      statusBreakdown,
      avgHealthScore: roundOne(healthScoreSum / totalRuns),
      totalRepairsAttempted: totalRepairs,
      totalRepairsSucceeded: totalRepairsOk,
      repairSuccessRate: totalRepairs > 0
        ? roundOne((totalRepairsOk / totalRepairs) * 100)
        : 100,
      totalFixedIssues: totalFixed,
      totalCriticalIssues: totalCritical,
    });
  } catch (error) {
    console.error('[Self-Heal Summary] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
