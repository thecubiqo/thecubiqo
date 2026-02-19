/**
 * Self-Heal Executor
 * 
 * Main orchestrator for self-heal operations.
 * Uses parallel diagnostics and produces a daily summary with metrics.
 */

import { runDiagnostics } from './diagnostics';
import { performRepairs, reapplyMigrations } from './repairs';
import { generateRollbackPatch, formatRollbackPatch } from './rollback';
import { generateReport, formatReportAsHtml, formatReportAsText } from './report';
import { SelfHealReport, DailySummary } from './types';

/**
 * Build a daily summary from the report data
 */
function buildDailySummary(report: SelfHealReport): DailySummary {
  const diagnostics = report.diagnostics;
  const repairs = report.repairs;

  const totalChecks = diagnostics.length;
  const healthyChecks = diagnostics.filter(d => d.status === 'healthy').length;
  const warningChecks = diagnostics.filter(d => d.status === 'warning').length;
  const criticalChecks = diagnostics.filter(d => d.status === 'critical').length;

  const repairsAttempted = repairs.length;
  const repairsSucceeded = repairs.filter(r => r.status === 'success').length;
  const repairsFailed = repairs.filter(r => r.status === 'failed').length;

  const uptimePercentage = totalChecks > 0
    ? Math.round((healthyChecks / totalChecks) * 100 * 10) / 10
    : 0;

  const durations = diagnostics
    .map(d => d.durationMs ?? 0)
    .filter(d => d > 0);
  const avgDiagnosticDurationMs = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  return {
    totalChecks,
    healthyChecks,
    warningChecks,
    criticalChecks,
    repairsAttempted,
    repairsSucceeded,
    repairsFailed,
    uptimePercentage,
    avgDiagnosticDurationMs,
    totalExecutionMs: report.executionTimeMs,
  };
}

/**
 * Execute a complete self-heal run
 */
export async function executeSelfHeal(): Promise<SelfHealReport> {
  const startTime = Date.now();

  try {
    console.log('[Self-Heal] Starting self-heal run...');

    // Step 1: Run diagnostics (parallel internally)
    console.log('[Self-Heal] Running diagnostics...');
    const diagnostics = await runDiagnostics();
    console.log(`[Self-Heal] Diagnostics completed: ${diagnostics.length} checks performed`);

    // Step 2: Perform repairs based on diagnostics (with retry + dedup)
    console.log('[Self-Heal] Performing repairs...');
    const repairs = await performRepairs(diagnostics);
    
    // Step 3: Check migrations if needed
    const migrationCheck = await reapplyMigrations();
    repairs.push(migrationCheck);
    
    console.log(`[Self-Heal] Repairs completed: ${repairs.length} actions taken`);

    // Step 4: Generate rollback patch
    console.log('[Self-Heal] Generating rollback patch...');
    const rollbackPatch = generateRollbackPatch(repairs);

    // Step 5: Generate report
    const executionTime = Date.now() - startTime;
    console.log(`[Self-Heal] Generating report (execution time: ${executionTime}ms)...`);
    const report = generateReport(diagnostics, repairs, rollbackPatch, executionTime);

    // Step 6: Compute daily summary
    report.summary = buildDailySummary(report);

    console.log(`[Self-Heal] Self-heal run completed with status: ${report.status}`);
    console.log(`[Self-Heal] Summary: ${report.summary.healthyChecks}/${report.summary.totalChecks} healthy, ${report.summary.repairsSucceeded} repairs succeeded, uptime ${report.summary.uptimePercentage}%`);
    return report;
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('[Self-Heal] Self-heal run failed:', error);
    
    // Get email configuration from environment or use defaults
    const emailFrom = process.env.SELF_HEAL_EMAIL_FROM || 'noreply@cubiqo.ai';
    const emailTo = process.env.SELF_HEAL_EMAIL_TO || 'aditya@cubiqo.ai';
    
    // Return a failed report
    const failedReport: SelfHealReport = {
      runDate: new Date(),
      status: 'failed',
      diagnostics: [],
      repairs: [],
      rollbackPatch: {
        commands: [],
        sqlStatements: [],
        description: 'Self-heal run failed',
      },
      fixedIssues: [],
      criticalIssues: [`Self-heal run failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      recommendations: ['Manual investigation required'],
      emailSent: false,
      emailFrom,
      emailTo,
      executionTimeMs: executionTime,
    };
    failedReport.summary = buildDailySummary(failedReport);
    return failedReport;
  }
}

/**
 * Send email report (mock implementation)
 */
export async function sendEmailReport(report: SelfHealReport): Promise<boolean> {
  try {
    const htmlContent = formatReportAsHtml(report);
    const textContent = formatReportAsText(report);

    // In production, this would use an email service like SendGrid, Resend, or Nodemailer
    // For now, we'll log the email content
    console.log('[Self-Heal] Email Report:');
    console.log('='.repeat(80));
    console.log(`From: ${report.emailFrom}`);
    console.log(`To: ${report.emailTo}`);
    console.log(`Subject: CubiQo Self-Heal Report - ${report.status.toUpperCase()}`);
    console.log('='.repeat(80));
    console.log(textContent);
    console.log('='.repeat(80));
    console.log('[Self-Heal] HTML version available (not shown in console)');
    console.log(`[Self-Heal] Email would be sent FROM: ${report.emailFrom} TO: ${report.emailTo}`);

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return true;
  } catch (error) {
    console.error('[Self-Heal] Failed to send email report:', error);
    return false;
  }
}

/**
 * Save report to database (to be implemented with Supabase)
 */
export async function saveReportToDatabase(report: SelfHealReport): Promise<string> {
  // This will be implemented with actual Supabase client in the API route
  // For now, return a mock ID
  const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log('[Self-Heal] Report saved to database with ID:', reportId);
  return reportId;
}

/**
 * Save audit logs to database (to be implemented with Supabase)
 */
export async function saveAuditLogs(reportId: string, report: SelfHealReport): Promise<void> {
  console.log(`[Self-Heal] Saving ${report.repairs.length} audit logs for report ${reportId}`);
  // This will be implemented with actual Supabase client in the API route
}
