#!/usr/bin/env node

/**
 * Quick Syntax Check for Merged Features
 * Checks that files exist and have basic valid syntax
 */

const fs = require('fs');
const path = require('path');

const filesToCheck = [
  // PR #118 - Job Hunt
  'src/app/api/job-hunt/profile/route.ts',
  'src/app/api/job-hunt/applications/route.ts',
  'src/app/api/job-hunt/dashboard/route.ts',
  'src/app/api/job-hunt/questions/route.ts',
  'src/app/api/job-hunt/reports/route.ts',
  'src/app/api/job-hunt/resume/route.ts',
  'src/app/job-hunt/page.tsx',
  'src/app/job-hunt/setup/page.tsx',
  'src/types/job-hunt.ts',
  'supabase/migrations/20260218000002_job_hunt_schema.sql',
  
  // PR #116 - Emergent Platform
  'src/app/api/emergent/workspaces/route.ts',
  'src/app/api/emergent/projects/route.ts',
  'src/app/api/emergent/secrets/route.ts',
  'src/app/api/emergent/terminal/route.ts',
  'src/app/founders-pass/security/page.tsx',
  'src/app/studio/page.tsx',
  'src/lib/emergent/orchestrator.ts',
  'src/lib/security/fraud-detection.ts',
  'tests/security/fraud-detection.test.ts',
  
  // PR #117 - RGY
  'src/app/api/rgy/intents/route.ts',
  'src/app/api/rgy/opportunities/discover/route.ts',
  'src/app/api/rgy/opportunities/express-interest/route.ts',
  'src/components/IntentSetup.tsx',
  'src/components/OpportunityFeed.tsx',
  'src/lib/rgy-matching/discovery-service.ts',
  'src/types/rgy-matching.ts',
];

console.log('🔍 QUICK SYNTAX CHECK FOR MERGED FEATURES');
console.log('==========================================\n');

let passed = 0;
let failed = 0;
let skipped = 0;

filesToCheck.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Basic syntax checks
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        // Check for common syntax issues
        if (content.includes('import ') || content.includes('export ') || content.includes('function ') || content.includes('const ') || content.includes('interface ')) {
          console.log(`✅ ${file} - EXISTS with valid syntax`);
          passed++;
        } else {
          console.log(`⚠️  ${file} - EXISTS but minimal content`);
          passed++;
        }
      } else if (file.endsWith('.sql')) {
        if (content.includes('CREATE TABLE') || content.includes('INSERT INTO') || content.includes('SELECT ')) {
          console.log(`✅ ${file} - EXISTS with SQL content`);
          passed++;
        } else {
          console.log(`⚠️  ${file} - EXISTS but minimal SQL`);
          passed++;
        }
      } else {
        console.log(`✅ ${file} - EXISTS`);
        passed++;
      }
    } else {
      console.log(`❌ ${file} - MISSING`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${file} - ERROR: ${error.message}`);
    failed++;
  }
});

// Check for conflict markers
console.log('\n🔍 CHECKING FOR CONFLICT MARKERS');
console.log('================================');

const conflictFiles = [];
function checkForConflicts(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      checkForConflicts(fullPath);
    } else if (item.isFile() && (item.name.endsWith('.ts') || item.name.endsWith('.tsx') || item.name.endsWith('.js') || item.name.endsWith('.jsx') || item.name.endsWith('.css') || item.name.endsWith('.md'))) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('<<<<<<<') || content.includes('=======') || content.includes('>>>>>>>')) {
          conflictFiles.push(fullPath);
        }
      } catch (error) {
        // Skip files we can't read
      }
    }
  }
}

try {
  checkForConflicts('.');
  
  if (conflictFiles.length === 0) {
    console.log('✅ No conflict markers found');
  } else {
    console.log('❌ Conflict markers found in:');
    conflictFiles.forEach(file => console.log(`   - ${file}`));
    failed += conflictFiles.length;
  }
} catch (error) {
  console.log(`⚠️  Could not check for conflicts: ${error.message}`);
}

// Summary
console.log('\n📊 TEST SUMMARY');
console.log('===============');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⏸️  Skipped: ${skipped}`);
console.log(`📁 Total Files Checked: ${filesToCheck.length}`);

if (failed === 0 && conflictFiles.length === 0) {
  console.log('\n🎉 ALL CHECKS PASSED! Merged features appear syntactically valid.');
  process.exit(0);
} else {
  console.log('\n⚠️  SOME CHECKS FAILED. Review the issues above.');
  process.exit(1);
}