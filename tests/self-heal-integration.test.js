#!/usr/bin/env node
/**
 * Integration test for self-heal job
 * Tests the complete flow: diagnostics → fixes → report → artifacts
 */

import { executeSelfHeal } from '../src/lib/self-heal/core.ts';
import { readFile, access } from 'fs/promises';
import { constants } from 'fs';

async function fileExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function testSelfHealIntegration() {
  console.log('🧪 Self-Heal Integration Test\n');
  
  const tests = [];
  let passed = 0;
  let failed = 0;

  // Test 1: Execute self-heal
  console.log('Test 1: Execute self-heal job...');
  try {
    const result = await executeSelfHeal();
    tests.push({ name: 'Execute self-heal', passed: true });
    passed++;
    console.log('✅ Self-heal executed successfully\n');
    
    // Test 2: Verify result structure
    console.log('Test 2: Verify result structure...');
    const requiredFields = ['diagnostics', 'fixesApplied', 'issuesFound', 'status', 'duration_ms', 'reportPath', 'rollbackPatchPath', 'signature'];
    const hasAllFields = requiredFields.every(field => field in result);
    if (hasAllFields) {
      tests.push({ name: 'Result structure', passed: true });
      passed++;
      console.log('✅ Result has all required fields\n');
    } else {
      tests.push({ name: 'Result structure', passed: false, error: 'Missing required fields' });
      failed++;
      console.log('❌ Result missing required fields\n');
    }

    // Test 3: Verify diagnostics ran
    console.log('Test 3: Verify diagnostics...');
    if (result.diagnostics.length >= 4) {
      const diagnosticNames = result.diagnostics.map(d => d.name);
      const expectedDiagnostics = ['memory', 'uptime', 'environment', 'process'];
      const hasAllDiagnostics = expectedDiagnostics.every(name => diagnosticNames.includes(name));
      
      if (hasAllDiagnostics) {
        tests.push({ name: 'Diagnostics', passed: true });
        passed++;
        console.log('✅ All expected diagnostics ran\n');
      } else {
        tests.push({ name: 'Diagnostics', passed: false, error: 'Missing expected diagnostics' });
        failed++;
        console.log('❌ Missing expected diagnostics\n');
      }
    } else {
      tests.push({ name: 'Diagnostics', passed: false, error: 'Too few diagnostics' });
      failed++;
      console.log('❌ Too few diagnostics ran\n');
    }

    // Test 4: Verify report file created
    console.log('Test 4: Verify report file...');
    const reportExists = await fileExists(result.reportPath);
    if (reportExists) {
      tests.push({ name: 'Report file', passed: true });
      passed++;
      console.log('✅ Report file created\n');

      // Test 5: Verify report content
      console.log('Test 5: Verify report content...');
      try {
        const reportContent = await readFile(result.reportPath, 'utf-8');
        const report = JSON.parse(reportContent);
        
        if (report.title && report.timestamp && report.status && report.summary && report.diagnostics) {
          tests.push({ name: 'Report content', passed: true });
          passed++;
          console.log('✅ Report content is valid JSON with expected structure\n');
        } else {
          tests.push({ name: 'Report content', passed: false, error: 'Invalid report structure' });
          failed++;
          console.log('❌ Report structure is invalid\n');
        }
      } catch (error) {
        tests.push({ name: 'Report content', passed: false, error: error.message });
        failed++;
        console.log('❌ Failed to parse report:', error.message, '\n');
      }
    } else {
      tests.push({ name: 'Report file', passed: false, error: 'File not found' });
      failed++;
      console.log('❌ Report file not created\n');
    }

    // Test 6: Verify rollback patch created
    console.log('Test 6: Verify rollback patch...');
    const patchExists = await fileExists(result.rollbackPatchPath);
    if (patchExists) {
      tests.push({ name: 'Rollback patch file', passed: true });
      passed++;
      console.log('✅ Rollback patch file created\n');

      // Test 7: Verify patch content
      console.log('Test 7: Verify patch content...');
      try {
        const patchContent = await readFile(result.rollbackPatchPath, 'utf-8');
        
        if (patchContent.includes('#!/bin/bash') || patchContent.includes('No rollback actions needed')) {
          tests.push({ name: 'Rollback patch content', passed: true });
          passed++;
          console.log('✅ Rollback patch content is valid\n');
        } else {
          tests.push({ name: 'Rollback patch content', passed: false, error: 'Invalid patch content' });
          failed++;
          console.log('❌ Rollback patch content is invalid\n');
        }
      } catch (error) {
        tests.push({ name: 'Rollback patch content', passed: false, error: error.message });
        failed++;
        console.log('❌ Failed to read patch:', error.message, '\n');
      }
    } else {
      tests.push({ name: 'Rollback patch file', passed: false, error: 'File not found' });
      failed++;
      console.log('❌ Rollback patch file not created\n');
    }

    // Test 8: Verify signature
    console.log('Test 8: Verify signature...');
    if (result.signature && result.signature.length === 64) { // SHA-256 produces 64 hex chars
      tests.push({ name: 'Signature', passed: true });
      passed++;
      console.log('✅ Signature generated correctly\n');
    } else {
      tests.push({ name: 'Signature', passed: false, error: 'Invalid signature format' });
      failed++;
      console.log('❌ Invalid signature\n');
    }

    // Test 9: Verify execution time
    console.log('Test 9: Verify execution time...');
    if (result.duration_ms > 0 && result.duration_ms < 10000) { // Should complete in under 10 seconds
      tests.push({ name: 'Execution time', passed: true });
      passed++;
      console.log(`✅ Execution time: ${result.duration_ms}ms\n`);
    } else {
      tests.push({ name: 'Execution time', passed: false, error: 'Execution time out of expected range' });
      failed++;
      console.log(`❌ Execution time out of range: ${result.duration_ms}ms\n`);
    }

  } catch (error) {
    tests.push({ name: 'Execute self-heal', passed: false, error: error.message });
    failed++;
    console.log('❌ Self-heal execution failed:', error.message, '\n');
  }

  // Summary
  console.log('='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total: ${tests.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log();

  if (failed > 0) {
    console.log('Failed tests:');
    tests.filter(t => !t.passed).forEach(t => {
      console.log(`  ❌ ${t.name}: ${t.error}`);
    });
    console.log();
    process.exit(1);
  } else {
    console.log('🎉 All tests passed!');
    process.exit(0);
  }
}

testSelfHealIntegration();
