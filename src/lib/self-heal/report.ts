/**
 * Self-Heal Report Generation
 * 
 * Creates comprehensive reports of self-heal operations
 */

import { SelfHealReport, DiagnosticResult, RepairAction, RollbackPatch } from './types';

/**
 * Generate a self-heal report from diagnostics and repairs
 */
export function generateReport(
  diagnostics: DiagnosticResult[],
  repairs: RepairAction[],
  rollbackPatch: RollbackPatch,
  executionTimeMs: number
): SelfHealReport {
  const fixedIssues: string[] = [];
  const criticalIssues: string[] = [];
  const recommendations: string[] = [];

  // Analyze diagnostics
  for (const diagnostic of diagnostics) {
    if (diagnostic.status === 'critical') {
      criticalIssues.push(`${diagnostic.name}: ${diagnostic.message}`);
      recommendations.push(`CRITICAL: Immediate attention required for ${diagnostic.name}`);
    } else if (diagnostic.status === 'warning') {
      const wasFixed = repairs.some(
        r => r.description.toLowerCase().includes(diagnostic.name.toLowerCase()) && 
             r.status === 'success'
      );
      
      if (wasFixed) {
        fixedIssues.push(`${diagnostic.name}: ${diagnostic.message}`);
      } else {
        recommendations.push(`Monitor ${diagnostic.name}: ${diagnostic.message}`);
      }
    }
  }

  // Analyze repairs
  for (const repair of repairs) {
    if (repair.status === 'success') {
      if (!fixedIssues.some(issue => issue.includes(repair.description))) {
        fixedIssues.push(repair.description);
      }
    } else if (repair.status === 'failed') {
      criticalIssues.push(`Failed repair: ${repair.description} - ${repair.errorMessage}`);
      recommendations.push(`Manual intervention required: ${repair.description}`);
    }
  }

  // Determine overall status
  let status: 'success' | 'partial' | 'failed';
  if (criticalIssues.length > 0 || repairs.some(r => r.status === 'failed')) {
    status = repairs.some(r => r.status === 'success') ? 'partial' : 'failed';
  } else {
    status = 'success';
  }

  // Get email configuration from environment or use defaults
  const emailFrom = process.env.SELF_HEAL_EMAIL_FROM || 'noreply@cubiqo.ai';
  const emailTo = process.env.SELF_HEAL_EMAIL_TO || 'aditya@cubiqo.ai';

  return {
    runDate: new Date(),
    status,
    diagnostics,
    repairs,
    rollbackPatch,
    fixedIssues,
    criticalIssues,
    recommendations,
    emailSent: false,
    emailFrom,
    emailTo,
    executionTimeMs,
  };
}

/**
 * Format report as HTML for email
 */
export function formatReportAsHtml(report: SelfHealReport): string {
  const statusColor = report.status === 'success' ? '#10b981' : 
                      report.status === 'partial' ? '#f59e0b' : '#ef4444';
  const statusIcon = report.status === 'success' ? '✓' : 
                     report.status === 'partial' ? '⚠' : '✗';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid ${statusColor};
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      background: ${statusColor};
      color: white;
      border-radius: 4px;
      font-weight: bold;
      font-size: 18px;
    }
    .section {
      margin: 30px 0;
    }
    .section-title {
      font-size: 20px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 15px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 8px;
    }
    .issue-list {
      list-style: none;
      padding: 0;
    }
    .issue-item {
      padding: 12px;
      margin: 8px 0;
      border-radius: 4px;
      background: #f9fafb;
      border-left: 4px solid #6b7280;
    }
    .issue-item.fixed {
      background: #ecfdf5;
      border-left-color: #10b981;
    }
    .issue-item.critical {
      background: #fef2f2;
      border-left-color: #ef4444;
    }
    .issue-item.warning {
      background: #fffbeb;
      border-left-color: #f59e0b;
    }
    .diagnostic-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    .diagnostic-table th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e5e7eb;
    }
    .diagnostic-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .status-healthy { color: #10b981; font-weight: bold; }
    .status-warning { color: #f59e0b; font-weight: bold; }
    .status-critical { color: #ef4444; font-weight: bold; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
    }
    .metadata {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      font-size: 14px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔧 Self-Heal Daily Report</h1>
      <div class="status-badge">${statusIcon} Status: ${report.status.toUpperCase()}</div>
      <div class="metadata">
        <span>📅 Run Date: ${report.runDate.toLocaleString()}</span>
        <span>⏱️ Execution Time: ${report.executionTimeMs}ms</span>
      </div>
    </div>

    ${report.fixedIssues.length > 0 ? `
    <div class="section">
      <div class="section-title">✅ Fixed Issues</div>
      <ul class="issue-list">
        ${report.fixedIssues.map(issue => `<li class="issue-item fixed">${issue}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    ${report.criticalIssues.length > 0 ? `
    <div class="section">
      <div class="section-title">🚨 Critical Issues</div>
      <ul class="issue-list">
        ${report.criticalIssues.map(issue => `<li class="issue-item critical">${issue}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    ${report.recommendations.length > 0 ? `
    <div class="section">
      <div class="section-title">💡 Recommendations</div>
      <ul class="issue-list">
        ${report.recommendations.map(rec => `<li class="issue-item warning">${rec}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">🔍 Diagnostic Results</div>
      <table class="diagnostic-table">
        <thead>
          <tr>
            <th>Check</th>
            <th>Status</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          ${report.diagnostics.map(d => `
            <tr>
              <td>${d.name}</td>
              <td class="status-${d.status}">${d.status.toUpperCase()}</td>
              <td>${d.message}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    ${report.repairs.length > 0 ? `
    <div class="section">
      <div class="section-title">🔧 Repair Actions</div>
      <table class="diagnostic-table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${report.repairs.map(r => `
            <tr>
              <td>${r.description}</td>
              <td>${r.type}</td>
              <td class="status-${r.status === 'success' ? 'healthy' : r.status === 'failed' ? 'critical' : 'warning'}">
                ${r.status.toUpperCase()}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="footer">
      <p><strong>Rollback Available:</strong> A rollback patch has been generated and stored for this run.</p>
      <p><strong>View Reports:</strong> <a href="https://cubiqo.ai/admin/self-heal">https://cubiqo.ai/admin/self-heal</a></p>
      <p>This is an automated report from the CubiQo Self-Heal System.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Format report as plain text for logging
 */
export function formatReportAsText(report: SelfHealReport): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push('SELF-HEAL DAILY REPORT');
  lines.push('='.repeat(80));
  lines.push(`Run Date: ${report.runDate.toISOString()}`);
  lines.push(`Status: ${report.status.toUpperCase()}`);
  lines.push(`Execution Time: ${report.executionTimeMs}ms`);
  lines.push('');

  if (report.fixedIssues.length > 0) {
    lines.push('FIXED ISSUES:');
    lines.push('-'.repeat(80));
    report.fixedIssues.forEach(issue => lines.push(`  ✓ ${issue}`));
    lines.push('');
  }

  if (report.criticalIssues.length > 0) {
    lines.push('CRITICAL ISSUES:');
    lines.push('-'.repeat(80));
    report.criticalIssues.forEach(issue => lines.push(`  ✗ ${issue}`));
    lines.push('');
  }

  if (report.recommendations.length > 0) {
    lines.push('RECOMMENDATIONS:');
    lines.push('-'.repeat(80));
    report.recommendations.forEach(rec => lines.push(`  ⚠ ${rec}`));
    lines.push('');
  }

  lines.push('DIAGNOSTIC RESULTS:');
  lines.push('-'.repeat(80));
  report.diagnostics.forEach(d => {
    lines.push(`  ${d.name}: ${d.status.toUpperCase()} - ${d.message}`);
  });
  lines.push('');

  if (report.repairs.length > 0) {
    lines.push('REPAIR ACTIONS:');
    lines.push('-'.repeat(80));
    report.repairs.forEach(r => {
      lines.push(`  [${r.type}] ${r.description}: ${r.status.toUpperCase()}`);
      if (r.errorMessage) {
        lines.push(`    Error: ${r.errorMessage}`);
      }
    });
    lines.push('');
  }

  lines.push('='.repeat(80));

  return lines.join('\n');
}
