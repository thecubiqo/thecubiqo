/**
 * Self-Heal Job Execution API
 * POST /api/admin/self-heal/run
 * 
 * Executes the self-heal job: diagnostics, auto-fixes, generates reports, and sends email
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { executeSelfHeal } from '@/lib/self-heal/core';
import { sendSelfHealReport } from '@/lib/self-heal/email';
import { requireAdmin } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time

export async function POST(req: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin(req)
    if (!authResult.authorized) {
      return authResult.response
    }

    console.log('[Self-Heal] Starting job execution...');

    // Execute self-heal
    const result = await executeSelfHeal();

    console.log('[Self-Heal] Execution complete:', {
      status: result.status,
      duration: result.duration_ms,
      diagnostics: result.diagnostics.length,
      fixes: result.fixesApplied.length,
    });

    // Store audit entry in database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey) as any;

    const { data: auditEntry, error: dbError } = await supabase
      .from('self_heal_reports')
      .insert({
        executed_at: new Date().toISOString(),
        diagnostics: result.diagnostics,
        fixes_applied: result.fixesApplied,
        issues_found: result.issuesFound,
        status: result.status,
        rollback_patch_path: result.rollbackPatchPath,
        report_path: result.reportPath,
        report_signature: result.signature,
        duration_ms: result.duration_ms,
        email_sent: false,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Self-Heal] Database error:', dbError);
      throw new Error(`Failed to store audit entry: ${dbError.message}`);
    }

    console.log('[Self-Heal] Audit entry created:', auditEntry.id);

    // Send email report
    const emailReport = {
      timestamp: new Date().toISOString(),
      status: result.status,
      summary: {
        total_diagnostics: result.diagnostics.length,
        healthy: result.diagnostics.filter(d => d.status === 'healthy').length,
        warnings: result.diagnostics.filter(d => d.status === 'warning').length,
        critical: result.diagnostics.filter(d => d.status === 'critical').length,
        fixes_applied: result.fixesApplied.filter(f => f.applied).length,
        issues_found: result.issuesFound.length,
      },
      reportPath: result.reportPath,
      rollbackPatchPath: result.rollbackPatchPath,
      signature: result.signature,
    };

    const emailResult = await sendSelfHealReport(emailReport, 'aditya@cubiqo.ai');

    // Update audit entry with email status
    if (emailResult.success) {
      await supabase
        .from('self_heal_reports')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString(),
        })
        .eq('id', auditEntry.id);

      console.log('[Self-Heal] Email sent successfully:', emailResult.messageId);
    } else {
      console.error('[Self-Heal] Email failed:', emailResult.error);
    }

    return NextResponse.json({
      success: true,
      result: {
        id: auditEntry.id,
        status: result.status,
        duration_ms: result.duration_ms,
        diagnostics_count: result.diagnostics.length,
        fixes_applied: result.fixesApplied.filter(f => f.applied).length,
        issues_found: result.issuesFound.length,
        report_path: result.reportPath,
        rollback_patch_path: result.rollbackPatchPath,
        email_sent: emailResult.success,
        email_message_id: emailResult.messageId,
      },
    });
  } catch (error) {
    console.error('[Self-Heal] Job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Allow GET for manual triggering (useful for testing in development only)
// In production, only POST should be used to prevent CSRF
export async function GET(req: NextRequest) {
  // Only allow GET in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'GET requests not allowed in production. Use POST.' },
      { status: 405 }
    );
  }

  // Require admin authentication even in dev mode
  const authResult = await requireAdmin(req)
  if (!authResult.authorized) {
    return authResult.response
  }

  return POST(req);
}
