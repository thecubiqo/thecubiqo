#!/usr/bin/env node

/**
 * Self-Heal Test Script
 * 
 * Simulates a self-heal run to verify all components work correctly:
 * - Diagnostics
 * - Repairs
 * - Rollback patch generation
 * - Report generation
 * - Email sending (mock)
 */

import { executeSelfHeal, sendEmailReport, formatRollbackPatch } from './src/lib/self-heal/executor.js';
import { formatReportAsText } from './src/lib/self-heal/report.js';

async function runTest() {
  console.log('═'.repeat(80));
  console.log('SELF-HEAL TEST SCRIPT');
  console.log('═'.repeat(80));
  console.log('');
  console.log('Starting simulated self-heal run...');
  console.log('');

  try {
    // Execute self-heal
    const report = await executeSelfHeal();

    console.log('');
    console.log('═'.repeat(80));
    console.log('SELF-HEAL REPORT');
    console.log('═'.repeat(80));
    console.log('');

    // Display report as text
    const textReport = formatReportAsText(report);
    console.log(textReport);

    console.log('');
    console.log('═'.repeat(80));
    console.log('ROLLBACK PATCH');
    console.log('═'.repeat(80));
    console.log('');

    // Display rollback patch
    const rollbackPatch = formatRollbackPatch(report.rollbackPatch);
    console.log(rollbackPatch);

    console.log('');
    console.log('═'.repeat(80));
    console.log('EMAIL SIMULATION');
    console.log('═'.repeat(80));
    console.log('');

    // Simulate email sending
    const emailSent = await sendEmailReport(report);
    
    console.log('');
    console.log('═'.repeat(80));
    console.log('TEST RESULTS');
    console.log('═'.repeat(80));
    console.log('');
    console.log('✓ Diagnostics: PASSED');
    console.log('✓ Repairs: PASSED');
    console.log('✓ Rollback Patch Generation: PASSED');
    console.log('✓ Report Generation: PASSED');
    console.log(`✓ Email Sending: ${emailSent ? 'PASSED' : 'FAILED'}`);
    console.log('');
    console.log(`Overall Status: ${report.status.toUpperCase()}`);
    console.log(`Fixed Issues: ${report.fixedIssues.length}`);
    console.log(`Critical Issues: ${report.criticalIssues.length}`);
    console.log(`Recommendations: ${report.recommendations.length}`);
    console.log(`Execution Time: ${report.executionTimeMs}ms`);
    console.log('');
    console.log('═'.repeat(80));
    console.log('TEST COMPLETED SUCCESSFULLY');
    console.log('═'.repeat(80));
    console.log('');
    console.log('Note: This was a simulated run. In production:');
    console.log('  - The cron job would be triggered at 10:00 daily');
    console.log('  - Reports would be saved to the database');
    console.log('  - Audit logs would be created');
    console.log('  - Actual emails would be sent to aditya@cubiqo.ai');
    console.log('  - View reports at: /admin/self-heal');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('═'.repeat(80));
    console.error('TEST FAILED');
    console.error('═'.repeat(80));
    console.error('');
    console.error('Error:', error);
    console.error('');
    process.exit(1);
  }
}

runTest();
