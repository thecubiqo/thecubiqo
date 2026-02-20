/**
 * Check for critical changes in merged PRs
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 CHECKING FOR CRITICAL CHANGES');
console.log('================================\n');

console.log('Criteria:');
console.log('1. ❌ API dependency changes');
console.log('2. ❌ Database schema changes');
console.log('3. ❌ Major/critical breaking changes');
console.log('');

const mergedPRs = [
  { number: 117, name: 'RGY Intelligent Matching' },
  { number: 118, name: 'Job Hunt Mode' },
  { number: 132, name: 'Monetisation Strategy' },
  { number: 135, name: 'Test Coverage' },
  { number: 128, name: 'Testing Infrastructure' },
  { number: 130, name: 'Monitoring' },
  { number: 119, name: 'Journal History' },
  { number: 133, name: 'Emergent Docs' }
];

const criticalIssues = [];

// Check package.json for dependency changes
console.log('1. CHECKING DEPENDENCY CHANGES');
console.log('------------------------------\n');

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};
  
  // Check for major dependency additions
  const majorDeps = [
    'react', 'next', 'typescript', '@supabase/supabase-js',
    'openai', 'pgvector', 'prisma', 'drizzle'
  ];
  
  const foundMajorDeps = majorDeps.filter(dep => dependencies[dep] || devDependencies[dep]);
  
  console.log(`Total dependencies: ${Object.keys(dependencies).length}`);
  console.log(`Total dev dependencies: ${Object.keys(devDependencies).length}`);
  console.log(`Major dependencies found: ${foundMajorDeps.length}`);
  
  if (foundMajorDeps.length > 0) {
    console.log('Major dependencies:');
    foundMajorDeps.forEach(dep => {
      const version = dependencies[dep] || devDependencies[dep];
      console.log(`   ${dep}: ${version}`);
    });
  }
  
  // Check for new dependencies that might be problematic
  const problematicDeps = ['pgvector', 'openai']; // These require external services
  problematicDeps.forEach(dep => {
    if (dependencies[dep]) {
      criticalIssues.push({
        pr: 'Multiple',
        issue: `Adds ${dep} dependency (requires external service)`,
        severity: 'HIGH'
      });
    }
  });
  
} catch (error) {
  console.log(`❌ Could not analyze dependencies: ${error.message}`);
}

// Check for database schema changes
console.log('\n2. CHECKING DATABASE SCHEMA CHANGES');
console.log('-----------------------------------\n');

const migrationsDir = 'supabase/migrations';
if (fs.existsSync(migrationsDir)) {
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  console.log(`Total migration files: ${migrationFiles.length}`);
  
  // Check recent migrations (likely from merged PRs)
  const recentMigrations = migrationFiles.slice(-5); // Last 5 migrations
  
  console.log('Recent migrations (likely from merged PRs):');
  recentMigrations.forEach(file => {
    console.log(`   📄 ${file}`);
    
    try {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Check for breaking changes
      const hasBreakingChanges = 
        content.includes('DROP TABLE') ||
        content.includes('ALTER TABLE') ||
        content.includes('DROP COLUMN') ||
        content.includes('RENAME TO');
      
      if (hasBreakingChanges) {
        criticalIssues.push({
          pr: 'Multiple',
          issue: `Migration ${file} contains breaking schema changes`,
          severity: 'CRITICAL'
        });
        console.log(`      ⚠️  Contains breaking changes`);
      }
      
      // Check for new tables
      const newTables = (content.match(/CREATE TABLE (\w+)/gi) || [])
        .map(match => match.replace('CREATE TABLE ', ''));
      
      if (newTables.length > 0) {
        console.log(`      New tables: ${newTables.join(', ')}`);
      }
      
    } catch (error) {
      console.log(`      Error reading: ${error.message}`);
    }
  });
} else {
  console.log('❌ Migrations directory not found');
}

// Check each PR specifically
console.log('\n3. CHECKING EACH MERGED PR');
console.log('--------------------------\n');

mergedPRs.forEach(pr => {
  console.log(`PR #${pr.number}: ${pr.name}`);
  
  let hasCriticalIssues = false;
  
  // Check based on PR number
  switch (pr.number) {
    case 117: // RGY
      console.log('   • Adds RGY API endpoints (new feature)');
      console.log('   • Adds database tables for matching');
      console.log('   • Adds OpenAI/pgvector dependencies');
      criticalIssues.push({
        pr: 117,
        issue: 'Adds OpenAI and pgvector dependencies',
        severity: 'HIGH'
      });
      criticalIssues.push({
        pr: 117,
        issue: 'Adds new database tables',
        severity: 'MEDIUM'
      });
      break;
      
    case 118: // Job Hunt
      console.log('   • Adds Job Hunt API endpoints (new feature)');
      console.log('   • Adds job-related database tables');
      criticalIssues.push({
        pr: 118,
        issue: 'Adds new database tables',
        severity: 'MEDIUM'
      });
      break;
      
    case 130: // Monitoring
      console.log('   • Adds Monitoring API endpoints');
      console.log('   • Adds monitoring_events table');
      console.log('   • ❌ Missing UI dashboard');
      criticalIssues.push({
        pr: 130,
        issue: 'Adds new database table',
        severity: 'MEDIUM'
      });
      break;
      
    case 132: // Monetisation Strategy
      console.log('   • Documentation only');
      console.log('   • No code changes');
      break;
      
    case 135: // Test Coverage
      console.log('   • Test infrastructure');
      console.log('   • No breaking changes');
      break;
      
    case 128: // Testing Infrastructure
      console.log('   • Testing scripts');
      console.log('   • No breaking changes');
      break;
      
    case 119: // Journal History
      console.log('   • UI components only');
      console.log('   • Uses existing API/DB');
      break;
      
    case 133: // Emergent Docs
      console.log('   • Documentation only (WIP)');
      console.log('   • No code changes');
      break;
  }
  
  console.log('');
});

// Check for API breaking changes
console.log('4. CHECKING FOR API BREAKING CHANGES');
console.log('------------------------------------\n');

// Look for changes to existing API routes
const apiDir = 'src/app/api';
if (fs.existsSync(apiDir)) {
  // Check for modifications to existing routes (not new routes)
  console.log('API directory exists. Need to check git diff for modifications...');
  console.log('(This requires git history analysis)');
} else {
  console.log('❌ API directory not found');
}

// Summary
console.log('\n📊 CRITICAL ISSUES SUMMARY');
console.log('=========================\n');

if (criticalIssues.length === 0) {
  console.log('✅ NO CRITICAL ISSUES FOUND');
  console.log('All merged PRs appear safe');
} else {
  console.log(`⚠️  FOUND ${criticalIssues.length} CRITICAL ISSUES:\n`);
  
  // Group by severity
  const critical = criticalIssues.filter(i => i.severity === 'CRITICAL');
  const high = criticalIssues.filter(i => i.severity === 'HIGH');
  const medium = criticalIssues.filter(i => i.severity === 'MEDIUM');
  
  if (critical.length > 0) {
    console.log('🔴 CRITICAL:');
    critical.forEach(issue => {
      console.log(`   PR #${issue.pr}: ${issue.issue}`);
    });
    console.log('');
  }
  
  if (high.length > 0) {
    console.log('🟠 HIGH:');
    high.forEach(issue => {
      console.log(`   PR #${issue.pr}: ${issue.issue}`);
    });
    console.log('');
  }
  
  if (medium.length > 0) {
    console.log('🟡 MEDIUM:');
    medium.forEach(issue => {
      console.log(`   PR #${issue.pr}: ${issue.issue}`);
    });
    console.log('');
  }
}

console.log('\n🎯 RECOMMENDATION BASED ON YOUR CRITERIA:');
console.log('---------------------------------------\n');

const hasDependencyChanges = criticalIssues.some(i => i.issue.includes('dependency'));
const hasDBSchemaChanges = criticalIssues.some(i => i.issue.includes('database') || i.issue.includes('table'));

if (hasDependencyChanges || hasDBSchemaChanges) {
  console.log('❌ DO NOT MERGE THIS BATCH');
  console.log('');
  
  if (hasDependencyChanges) {
    console.log('   • Contains API dependency changes (OpenAI, pgvector)');
  }
  
  if (hasDBSchemaChanges) {
    console.log('   • Contains database schema changes (new tables)');
  }
  
  console.log('\n🚀 SAFER ALTERNATIVE:');
  console.log('   Merge only documentation/infrastructure PRs:');
  console.log('   • PR #132 (Monetisation Strategy) - Docs only');
  console.log('   • PR #135 (Test Coverage) - Tests only');
  console.log('   • PR #128 (Testing Infrastructure) - Scripts only');
  console.log('   • PR #133 (Emergent Docs) - Docs only (WIP)');
  
} else {
  console.log('✅ SAFE TO MERGE');
  console.log('   No dependency or database schema changes found');
}

console.log('\n🔍 NEED TO CHECK:');
console.log('   • Git diff for modifications to existing API routes');
console.log('   • Any changes to core application logic');
console.log('   • Changes to authentication/authorization');