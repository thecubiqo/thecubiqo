/**
 * Self-Heal Job Core Logic
 * 
 * Performs diagnostics, auto-fixes, generates reports, and handles rollback patches
 */

import { createHmac } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export interface DiagnosticResult {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  details: Record<string, any>;
  timestamp: string;
}

export interface AutoFix {
  name: string;
  applied: boolean;
  description: string;
  rollbackCommand?: string;
  timestamp: string;
}

export interface SelfHealResult {
  diagnostics: DiagnosticResult[];
  fixesApplied: AutoFix[];
  issuesFound: string[];
  status: 'success' | 'partial' | 'failed';
  duration_ms: number;
  reportPath: string;
  rollbackPatchPath: string;
  signature: string;
}

/**
 * Run diagnostics on the system
 */
export async function runDiagnostics(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  // 1. Memory diagnostics
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  results.push({
    name: 'memory',
    status: heapUsedPercent > 90 ? 'critical' : heapUsedPercent > 70 ? 'warning' : 'healthy',
    details: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsedPercent: Math.round(heapUsedPercent),
      rss: Math.round(memUsage.rss / 1024 / 1024),
    },
    timestamp: new Date().toISOString(),
  });

  // 2. Uptime check
  const uptime = process.uptime();
  results.push({
    name: 'uptime',
    status: 'healthy',
    details: {
      uptime_seconds: Math.floor(uptime),
      uptime_hours: Math.floor(uptime / 3600),
    },
    timestamp: new Date().toISOString(),
  });

  // 3. Environment check
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
  results.push({
    name: 'environment',
    status: missingEnvVars.length > 0 ? 'critical' : 'healthy',
    details: {
      required_vars: requiredEnvVars.length,
      missing_vars: missingEnvVars.length,
      missing: missingEnvVars,
    },
    timestamp: new Date().toISOString(),
  });

  // 4. Process health
  const cpuUsage = process.cpuUsage();
  results.push({
    name: 'process',
    status: 'healthy',
    details: {
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version,
      cpuUsage: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
    },
    timestamp: new Date().toISOString(),
  });

  return results;
}

/**
 * Attempt safe auto-fixes based on diagnostic results
 */
export async function performAutoFixes(diagnostics: DiagnosticResult[]): Promise<AutoFix[]> {
  const fixes: AutoFix[] = [];

  for (const diagnostic of diagnostics) {
    // Fix 1: Clear cache if memory is high
    if (diagnostic.name === 'memory' && diagnostic.status === 'critical') {
      try {
        // Trigger garbage collection if available
        if (global.gc) {
          global.gc();
          fixes.push({
            name: 'memory_gc',
            applied: true,
            description: 'Forced garbage collection to free memory',
            rollbackCommand: 'N/A - automatic process',
            timestamp: new Date().toISOString(),
          });
        } else {
          fixes.push({
            name: 'memory_gc',
            applied: false,
            description: 'Garbage collection not available (run with --expose-gc flag)',
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        fixes.push({
          name: 'memory_gc',
          applied: false,
          description: `Failed to perform GC: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Fix 2: Log environment issues (no automatic fix)
    if (diagnostic.name === 'environment' && diagnostic.status === 'critical') {
      fixes.push({
        name: 'environment_alert',
        applied: false,
        description: `Missing environment variables: ${diagnostic.details.missing.join(', ')}`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return fixes;
}

/**
 * Generate a signed report
 */
export function generateReport(
  diagnostics: DiagnosticResult[],
  fixes: AutoFix[],
  issues: string[],
  status: 'success' | 'partial' | 'failed'
): { content: string; signature: string } {
  const timestamp = new Date().toISOString();
  
  const report = {
    title: 'CubiQo Self-Heal Job Report',
    timestamp,
    status,
    summary: {
      total_diagnostics: diagnostics.length,
      healthy: diagnostics.filter(d => d.status === 'healthy').length,
      warnings: diagnostics.filter(d => d.status === 'warning').length,
      critical: diagnostics.filter(d => d.status === 'critical').length,
      fixes_applied: fixes.filter(f => f.applied).length,
      fixes_attempted: fixes.length,
      issues_found: issues.length,
    },
    diagnostics,
    fixes,
    issues,
  };

  const content = JSON.stringify(report, null, 2);
  
  // Generate HMAC signature for verification
  const secret = process.env.SELF_HEAL_SECRET || 'default-secret-change-in-production';
  const signature = createHmac('sha256', secret)
    .update(content)
    .digest('hex');

  return { content, signature };
}

/**
 * Generate rollback patch
 */
export function generateRollbackPatch(fixes: AutoFix[]): string {
  const appliedFixes = fixes.filter(f => f.applied && f.rollbackCommand);
  
  if (appliedFixes.length === 0) {
    return '# No rollback actions needed - no fixes were applied\n';
  }

  let patch = '#!/bin/bash\n';
  patch += '# Rollback patch for CubiQo self-heal job\n';
  patch += `# Generated: ${new Date().toISOString()}\n`;
  patch += '# WARNING: Review before executing\n\n';
  
  patch += 'set -e\n\n';
  
  appliedFixes.forEach((fix, index) => {
    patch += `# Rollback ${index + 1}: ${fix.name}\n`;
    patch += `echo "Rolling back: ${fix.description}"\n`;
    patch += `${fix.rollbackCommand}\n\n`;
  });

  patch += 'echo "Rollback complete"\n';
  
  return patch;
}

/**
 * Save report and rollback patch to disk
 */
export async function saveArtifacts(
  report: string,
  rollbackPatch: string
): Promise<{ reportPath: string; rollbackPatchPath: string }> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const artifactsDir = join(process.cwd(), 'self-heal-artifacts');
  
  // Ensure directory exists
  try {
    await mkdir(artifactsDir, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore
  }

  const reportPath = join(artifactsDir, `report-${timestamp}.json`);
  const rollbackPatchPath = join(artifactsDir, `rollback-${timestamp}.sh`);

  await writeFile(reportPath, report, 'utf-8');
  await writeFile(rollbackPatchPath, rollbackPatch, 'utf-8');

  return { reportPath, rollbackPatchPath };
}

/**
 * Main self-heal execution
 */
export async function executeSelfHeal(): Promise<SelfHealResult> {
  const startTime = Date.now();

  // Run diagnostics
  const diagnostics = await runDiagnostics();

  // Identify issues
  const issuesFound: string[] = [];
  diagnostics.forEach(d => {
    if (d.status === 'critical') {
      issuesFound.push(`CRITICAL: ${d.name} - ${JSON.stringify(d.details)}`);
    } else if (d.status === 'warning') {
      issuesFound.push(`WARNING: ${d.name} - ${JSON.stringify(d.details)}`);
    }
  });

  // Perform auto-fixes
  const fixesApplied = await performAutoFixes(diagnostics);

  // Determine overall status
  const hasCritical = diagnostics.some(d => d.status === 'critical');
  const hasWarning = diagnostics.some(d => d.status === 'warning');
  const hasFailedFixes = fixesApplied.some(f => !f.applied && f.rollbackCommand);
  
  let status: 'success' | 'partial' | 'failed';
  if (hasCritical) {
    status = 'failed';
  } else if (hasWarning || hasFailedFixes) {
    status = 'partial';
  } else {
    status = 'success';
  }

  // Generate report and signature
  const { content: reportContent, signature } = generateReport(
    diagnostics,
    fixesApplied,
    issuesFound,
    status
  );

  // Generate rollback patch
  const rollbackPatch = generateRollbackPatch(fixesApplied);

  // Save artifacts
  const { reportPath, rollbackPatchPath } = await saveArtifacts(reportContent, rollbackPatch);

  const duration_ms = Date.now() - startTime;

  return {
    diagnostics,
    fixesApplied,
    issuesFound,
    status,
    duration_ms,
    reportPath,
    rollbackPatchPath,
    signature,
  };
}
