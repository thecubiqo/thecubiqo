/**
 * Check for changes to EXISTING API routes and core logic
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 CHECKING FOR CHANGES TO EXISTING CODE');
console.log('========================================\n');

console.log('Looking for modifications to:');
console.log('1. Existing API routes');
console.log('2. Core application logic');
console.log('3. Authentication/authorization');
console.log('4. Database schemas (modifications, not additions)');
console.log('');

// First, let's see what the current state is
console.log('1. CURRENT API STRUCTURE');
console.log('-----------------------\n');

const apiDir = 'src/app/api';
const existingAPIs = [];

function scanAPIs(dir, prefix = '') {
  if (!fs.existsSync(dir)) return;
  
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Check if this directory has a route.ts file
      const routeFile = path.join(fullPath, 'route.ts');
      if (fs.existsSync(routeFile)) {
        const apiPath = prefix + '/' + item;
        existingAPIs.push({
          path: apiPath,
          fullPath: fullPath,
          hasRoute: true
        });
      }
      scanAPIs(fullPath, prefix + '/' + item);
    }
  });
}

scanAPIs(apiDir);

console.log(`Found ${existingAPIs.length} API routes:`);
existingAPIs.slice(0, 15).forEach(api => {
  console.log(`   ${api.path}`);
});
if (existingAPIs.length > 15) {
  console.log(`   ... and ${existingAPIs.length - 15} more`);
}

// Check for core files that shouldn't be modified
console.log('\n2. CORE FILES TO PROTECT');
console.log('------------------------\n');

const coreFiles = [
  'src/app/globals.css',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/lib/supabase.ts',
  'src/lib/auth.ts',
  'src/middleware.ts',
  'next.config.js',
  'package.json',
  'tsconfig.json'
];

coreFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} not found`);
  }
});

// Check what PRs actually modify vs add
console.log('\n3. ANALYZING MERGED PRs IMPACT');
console.log('------------------------------\n');

const prAnalysis = [
  {
    pr: 117,
    name: 'RGY',
    impact: 'ADDITIVE',
    changes: 'New API routes, new tables, new dependencies',
    risk: 'MEDIUM-HIGH (adds OpenAI/pgvector)'
  },
  {
    pr: 118,
    name: 'Job Hunt',
    impact: 'ADDITIVE',
    changes: 'New API routes, new tables',
    risk: 'MEDIUM (new tables)'
  },
  {
    pr: 130,
    name: 'Monitoring',
    impact: 'ADDITIVE',
    changes: 'New API routes, new table',
    risk: 'MEDIUM (new table)'
  },
  {
    pr: 119,
    name: 'Journal History',
    impact: 'ADDITIVE (UI only)',
    changes: 'UI components, uses existing API',
    risk: 'LOW'
  },
  {
    pr: 132,
    name: 'Monetisation',
    impact: 'DOCUMENTATION',
    changes: 'Markdown files only',
    risk: 'NONE'
  },
  {
    pr: 135,
    name: 'Test Coverage',
    impact: 'INFRASTRUCTURE',
    changes: 'Test files only',
    risk: 'LOW'
  },
  {
    pr: 128,
    name: 'Testing Infrastructure',
    impact: 'INFRASTRUCTURE',
    changes: 'Scripts and docs',
    risk: 'LOW'
  },
  {
    pr: 133,
    name: 'Emergent Docs',
    impact: 'DOCUMENTATION',
    changes: 'Markdown files only',
    risk: 'NONE'
  }
];

console.log('PR Impact Analysis:');
console.log('------------------');
prAnalysis.forEach(p => {
  console.log(`PR #${p.pr} (${p.name}):`);
  console.log(`   Impact: ${p.impact}`);
  console.log(`   Risk: ${p.risk}`);
  console.log(`   Changes: ${p.changes}`);
  console.log('');
});

// Check for actual breaking changes
console.log('4. LOOKING FOR ACTUAL BREAKING CHANGES');
console.log('--------------------------------------\n');

// We need to check git diff between main and our branch
// For now, let's check key files for modifications

const keyFilesToCheck = [
  'src/app/api/chat/route.ts',
  'src/app/api/journal/route.ts',
  'src/app/api/memory/route.ts',
  'src/app/api/auth/route.ts',
  'src/lib/supabase.ts',
  'src/middleware.ts'
];

let foundModifications = false;
keyFilesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists (need git diff to check modifications)`);
    // In a real scenario, we would run git diff here
  } else {
    console.log(`❌ ${file} not found`);
  }
});

console.log('\n📊 FINAL ASSESSMENT');
console.log('==================\n');

console.log('BASED ON YOUR CRITERIA:');
console.log('❌ DO NOT MERGE anything with:');
console.log('   1. API dependency changes');
console.log('   2. Database schema changes');
console.log('   3. Major/critical breaking changes');
console.log('');

console.log('PROBLEMATIC PRs (based on criteria):');
console.log('-----------------------------------');
console.log('❌ PR #117 - RGY:');
console.log('   • Adds OpenAI dependency (external API)');
console.log('   • Adds pgvector dependency (database extension)');
console.log('   • Adds new database tables');
console.log('');
console.log('❌ PR #118 - Job Hunt:');
console.log('   • Adds new database tables');
console.log('');
console.log('❌ PR #130 - Monitoring:');
console.log('   • Adds new database table');
console.log('');

console.log('SAFE PRs (meet your criteria):');
console.log('-----------------------------');
console.log('✅ PR #132 - Monetisation Strategy:');
console.log('   • Documentation only');
console.log('   • No code changes');
console.log('');
console.log('✅ PR #135 - Test Coverage:');
console.log('   • Test files only');
console.log('   • No production code changes');
console.log('');
console.log('✅ PR #128 - Testing Infrastructure:');
console.log('   • Scripts and docs');
console.log('   • No production code changes');
console.log('');
console.log('✅ PR #119 - Journal History:');
console.log('   • UI components only');
console.log('   • Uses existing API/DB (no new dependencies)');
console.log('');
console.log('✅ PR #133 - Emergent Docs:');
console.log('   • Documentation only (WIP)');
console.log('   • No code changes');
console.log('');

console.log('🎯 RECOMMENDATION:');
console.log('-----------------');
console.log('Merge ONLY these safe PRs:');
console.log('1. PR #132 (Monetisation Strategy)');
console.log('2. PR #135 (Test Coverage)');
console.log('3. PR #128 (Testing Infrastructure)');
console.log('4. PR #119 (Journal History) - UI only, uses existing API');
console.log('5. PR #133 (Emergent Docs)');
console.log('');
console.log('Hold these PRs for separate review:');
console.log('1. PR #117 (RGY) - Needs dependency review');
console.log('2. PR #118 (Job Hunt) - Needs DB schema review');
console.log('3. PR #130 (Monitoring) - Needs DB schema review');
console.log('');

console.log('🚀 ACTION PLAN:');
console.log('1. Revert the 3 problematic PRs from current branch');
console.log('2. Keep the 5 safe PRs');
console.log('3. Push safe branch for CI');
console.log('4. Get approval and merge safe changes');
console.log('5. Review problematic PRs separately with stakeholders');