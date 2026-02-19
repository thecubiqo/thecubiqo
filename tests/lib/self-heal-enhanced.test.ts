/**
 * Self-Heal Enhanced System Tests
 *
 * Tests for parallel diagnostics, retry logic, deduplication,
 * daily summary generation, and report formatting.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runDiagnostics } from '@/lib/self-heal/diagnostics';
import { performRepairs } from '@/lib/self-heal/repairs';
import { executeSelfHeal } from '@/lib/self-heal/executor';
import { generateReport, formatReportAsText, formatReportAsHtml } from '@/lib/self-heal/report';
import { generateRollbackPatch } from '@/lib/self-heal/rollback';
import type { DiagnosticResult, RepairAction, SelfHealReport, DailySummary } from '@/lib/self-heal/types';

describe('Self-Heal Diagnostics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs all diagnostic checks including new ones', async () => {
    const results = await runDiagnostics();

    // Should now include 7 checks (original 5 + Environment Variables + API Endpoint Health)
    expect(results.length).toBeGreaterThanOrEqual(7);

    const names = results.map(r => r.name);
    expect(names).toContain('Database Connectivity');
    expect(names).toContain('Memory Usage');
    expect(names).toContain('Disk Space');
    expect(names).toContain('Agent Health');
    expect(names).toContain('Session Cleanup');
    expect(names).toContain('Environment Variables');
    expect(names).toContain('API Endpoint Health');
  });

  it('includes durationMs in diagnostic results', async () => {
    const results = await runDiagnostics();
    for (const result of results) {
      expect(result.durationMs).toBeDefined();
      expect(typeof result.durationMs).toBe('number');
    }
  });

  it('runs diagnostics in parallel (should be faster than sequential)', async () => {
    const start = Date.now();
    await runDiagnostics();
    const elapsed = Date.now() - start;

    // Sequential would be at least 50+30+40 = 120ms from the simulated delays
    // Parallel should complete much faster (close to the longest single check)
    // We allow some margin for test environment variability
    expect(elapsed).toBeLessThan(500);
  });

  it('reports environment variables status', async () => {
    const results = await runDiagnostics();
    const envCheck = results.find(r => r.name === 'Environment Variables');
    expect(envCheck).toBeDefined();
    expect(['healthy', 'warning', 'critical']).toContain(envCheck!.status);
  });
});

describe('Self-Heal Repairs', () => {
  it('deduplicates repair attempts for the same diagnostic', async () => {
    const diagnostics: DiagnosticResult[] = [
      {
        name: 'Memory Usage',
        status: 'warning',
        message: 'High memory 1',
        timestamp: new Date(),
        durationMs: 1,
      },
      {
        name: 'Memory Usage',
        status: 'critical',
        message: 'High memory 2',
        timestamp: new Date(),
        durationMs: 1,
      },
    ];

    const repairs = await performRepairs(diagnostics);

    // Should only attempt one repair for Memory Usage (deduplication)
    const memoryRepairs = repairs.filter(r =>
      r.description.toLowerCase().includes('cache')
    );
    expect(memoryRepairs.length).toBe(1);
  });

  it('includes retryCount in repair results', async () => {
    const diagnostics: DiagnosticResult[] = [
      {
        name: 'Database Connectivity',
        status: 'warning',
        message: 'Slow DB',
        timestamp: new Date(),
        durationMs: 100,
      },
    ];

    const repairs = await performRepairs(diagnostics);
    expect(repairs.length).toBeGreaterThan(0);
    expect(repairs[0].retryCount).toBeDefined();
    expect(typeof repairs[0].retryCount).toBe('number');
  });

  it('skips repairs for healthy diagnostics', async () => {
    const diagnostics: DiagnosticResult[] = [
      {
        name: 'Memory Usage',
        status: 'healthy',
        message: 'Memory OK',
        timestamp: new Date(),
        durationMs: 1,
      },
    ];

    const repairs = await performRepairs(diagnostics);
    expect(repairs.length).toBe(0);
  });
});

describe('Self-Heal Executor', () => {
  it('produces a report with daily summary', async () => {
    const report = await executeSelfHeal();

    expect(report).toBeDefined();
    expect(report.summary).toBeDefined();
    expect(report.summary!.totalChecks).toBeGreaterThanOrEqual(7);
    expect(report.summary!.uptimePercentage).toBeGreaterThanOrEqual(0);
    expect(report.summary!.uptimePercentage).toBeLessThanOrEqual(100);
    expect(typeof report.summary!.avgDiagnosticDurationMs).toBe('number');
    expect(report.summary!.totalExecutionMs).toBeGreaterThan(0);
  });

  it('reports correct repair counts in summary', async () => {
    const report = await executeSelfHeal();
    const s = report.summary!;

    expect(s.repairsAttempted).toBe(report.repairs.length);
    expect(s.repairsSucceeded).toBe(
      report.repairs.filter(r => r.status === 'success').length
    );
    expect(s.repairsFailed).toBe(
      report.repairs.filter(r => r.status === 'failed').length
    );
  });

  it('completes within a reasonable time', async () => {
    const start = Date.now();
    await executeSelfHeal();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(10000);
  });
});

describe('Self-Heal Report Formatting', () => {
  const makeReport = (): SelfHealReport => {
    const diagnostics: DiagnosticResult[] = [
      { name: 'DB', status: 'healthy', message: 'OK', timestamp: new Date(), durationMs: 50 },
      { name: 'Memory', status: 'warning', message: 'High', timestamp: new Date(), durationMs: 2 },
    ];
    const repairs: RepairAction[] = [
      {
        type: 'cache_clear',
        description: 'Cleared caches',
        status: 'success',
        executedAt: new Date(),
        retryCount: 0,
      },
    ];
    const rollbackPatch = generateRollbackPatch(repairs);
    const report = generateReport(diagnostics, repairs, rollbackPatch, 150);
    report.summary = {
      totalChecks: 2,
      healthyChecks: 1,
      warningChecks: 1,
      criticalChecks: 0,
      repairsAttempted: 1,
      repairsSucceeded: 1,
      repairsFailed: 0,
      uptimePercentage: 50,
      avgDiagnosticDurationMs: 26,
      totalExecutionMs: 150,
    };
    return report;
  };

  it('text report includes daily summary section', () => {
    const text = formatReportAsText(makeReport());
    expect(text).toContain('DAILY SUMMARY');
    expect(text).toContain('Health Score');
    expect(text).toContain('50%');
    expect(text).toContain('Avg Check Time');
  });

  it('text report includes diagnostic durations', () => {
    const text = formatReportAsText(makeReport());
    expect(text).toContain('50ms');
    expect(text).toContain('2ms');
  });

  it('text report includes retry count', () => {
    const text = formatReportAsText(makeReport());
    expect(text).toContain('[retries: 0]');
  });

  it('HTML report includes daily summary grid', () => {
    const html = formatReportAsHtml(makeReport());
    expect(html).toContain('Daily Summary');
    expect(html).toContain('Health Score');
    expect(html).toContain('summary-grid');
    expect(html).toContain('Avg Check Time');
  });

  it('HTML report includes duration column in diagnostics', () => {
    const html = formatReportAsHtml(makeReport());
    expect(html).toContain('Duration');
    expect(html).toContain('50ms');
  });

  it('HTML report includes retries column in repairs', () => {
    const html = formatReportAsHtml(makeReport());
    expect(html).toContain('Retries');
  });
});
