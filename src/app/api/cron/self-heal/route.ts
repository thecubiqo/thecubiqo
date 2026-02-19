import { NextRequest, NextResponse } from 'next/server';
import { executeSelfHeal, sendEmailReport, formatRollbackPatch } from '@/lib/self-heal';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes timeout for cron job

/**
 * Self-Heal Cron Job Endpoint
 * 
 * This endpoint is designed to be triggered by a cron service (e.g., Vercel Cron, GitHub Actions)
 * Runs at 10:00 local time daily
 * 
 * Authentication: Should be protected by a secret token in production
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authorization (optional but recommended)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Self-Heal API] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Self-Heal API] Starting self-heal job...');

    // Execute self-heal process
    const report = await executeSelfHeal();

    // Initialize Supabase client
    const supabase = await createClient();

    // Save report to database
    const rollbackPatchText = formatRollbackPatch(report.rollbackPatch);
    
    const { data: savedReport, error: reportError } = await (supabase as any)
      .from('self_heal_reports')
      .insert({
        run_date: report.runDate.toISOString(),
        status: report.status,
        diagnostics: report.diagnostics,
        repairs: report.repairs,
        rollback_patch: rollbackPatchText,
        fixed_issues: report.fixedIssues,
        critical_issues: report.criticalIssues,
        recommendations: report.recommendations,
        email_sent: false,
        email_from: report.emailFrom,
        email_to: report.emailTo,
        execution_time_ms: report.executionTimeMs,
      })
      .select()
      .single();

    if (reportError) {
      console.error('[Self-Heal API] Failed to save report:', reportError);
      return NextResponse.json(
        { 
          error: 'Failed to save report',
          details: reportError.message,
          report: report,
        },
        { status: 500 }
      );
    }

    const reportId = savedReport.id;
    console.log('[Self-Heal API] Report saved with ID:', reportId);

    // Save audit logs
    const auditLogs = report.repairs.map(repair => ({
      report_id: reportId,
      action_type: repair.type,
      action_details: repair.details || {},
      status: repair.status,
      error_message: repair.errorMessage || null,
      rollback_command: repair.rollbackCommand || null,
      executed_at: repair.executedAt.toISOString(),
    }));

    if (auditLogs.length > 0) {
      const { error: auditError } = await (supabase as any)
        .from('self_heal_audit_logs')
        .insert(auditLogs);

      if (auditError) {
        console.error('[Self-Heal API] Failed to save audit logs:', auditError);
      } else {
        console.log(`[Self-Heal API] Saved ${auditLogs.length} audit logs`);
      }
    }

    // Send email report
    const emailSent = await sendEmailReport(report);
    
    if (emailSent) {
      // Update report with email status
      await (supabase as any)
        .from('self_heal_reports')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString(),
        })
        .eq('id', reportId);
      
      console.log('[Self-Heal API] Email report sent successfully');
    }

    const totalTime = Date.now() - startTime;
    console.log(`[Self-Heal API] Self-heal job completed in ${totalTime}ms`);

    return NextResponse.json({
      success: true,
      reportId,
      status: report.status,
      summary: {
        fixedIssues: report.fixedIssues.length,
        criticalIssues: report.criticalIssues.length,
        recommendations: report.recommendations.length,
        repairsPerformed: report.repairs.filter(r => r.status === 'success').length,
        emailSent,
        ...(report.summary ? {
          healthScore: report.summary.uptimePercentage,
          totalChecks: report.summary.totalChecks,
          healthyChecks: report.summary.healthyChecks,
          avgCheckTimeMs: report.summary.avgDiagnosticDurationMs,
        } : {}),
      },
      executionTimeMs: totalTime,
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('[Self-Heal API] Self-heal job failed:', error);
    
    return NextResponse.json(
      {
        error: 'Self-heal job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: totalTime,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for manual trigger (testing only)
 */
export async function GET(req: NextRequest) {
  // Check if this is a development environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'GET method not allowed in production. Use POST.' },
      { status: 405 }
    );
  }

  // In development, allow GET for easy testing
  console.log('[Self-Heal API] Manual trigger via GET (dev only)');
  return POST(req);
}
