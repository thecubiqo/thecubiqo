/**
 * Fresh Test Run Across Environments
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 FRESH TEST RUN - ' + new Date().toLocaleTimeString());
console.log('===================================\n');

// Test function for a branch
function testBranch(branchName, description) {
  console.log(`🧪 TESTING: ${description} (${branchName})`);
  console.log('-----------------------------------');
  
  try {
    // Checkout branch
    execSync(`git checkout ${branchName}`, { stdio: 'pipe' });
    console.log(`  ✅ Switched to ${branchName}`);
  } catch (error) {
    console.log(`  ❌ Failed to switch to ${branchName}: ${error.message}`);
    return null;
  }
  
  const results = {
    branch: branchName,
    description: description,
    features: 0,
    totalFeatures: 8,
    migrations: 0,
    monetisationFiles: 0,
    components: 0,
    timestamp: new Date().toISOString()
  };
  
  // Check feature directories
  const featureDirs = [
    'src/app/api/rgy',
    'src/app/api/job-hunt',
    'src/app/api/emergent',
    'src/app/api/monitoring',
    'src/app/api/privacy',
    'src/app/founders-pass',
    'src/app/journal',
    'src/app/api/admin'
  ];
  
  featureDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      results.features++;
    }
  });
  
  // Check migrations
  if (fs.existsSync('supabase/migrations')) {
    const migrations = fs.readdirSync('supabase/migrations')
      .filter(f => f.endsWith('.sql'));
    results.migrations = migrations.length;
  }
  
  // Check for monetisation references (simplified)
  if (fs.existsSync('src')) {
    // Just count files with monetisation in name
    const monetisationFiles = getAllFiles('src')
      .filter(f => {
        const filename = path.basename(f).toLowerCase();
        return filename.includes('pricing') || 
               filename.includes('subscription') ||
               filename.includes('premium') ||
               filename.includes('enterprise');
      });
    results.monetisationFiles = monetisationFiles.length;
  }
  
  // Check UI components
  if (fs.existsSync('src/components')) {
    const components = getAllFiles('src/components')
      .filter(f => f.endsWith('.tsx'));
    results.components = components.length;
  }
  
  console.log(`  Features: ${results.features}/8`);
  console.log(`  Migrations: ${results.migrations}`);
  console.log(`  Monetisation files: ${results.monetisationFiles}`);
  console.log(`  UI components: ${results.components}`);
  console.log('');
  
  return results;
}

// Run tests
console.log('1. TESTING MAIN BRANCH\n');
const mainResults = testBranch('main', 'Production');

console.log('2. TESTING STAGING0217 BRANCH\n');
const stagingResults = testBranch('staging0217', 'Staging');

console.log('3. TESTING PR READINESS BRANCH\n');
const prResults = testBranch('origin/copilot/check-pr-readiness', 'PR Analysis');

// Summary
console.log('📊 TEST SUMMARY');
console.log('==============\n');

if (mainResults && stagingResults && prResults) {
  console.log('Environment Comparison:');
  console.log('----------------------');
  console.log('| Metric          | Main | Staging | PR Readiness |');
  console.log('|-----------------|------|---------|--------------|');
  console.log(`| Features        | ${mainResults.features.toString().padEnd(4)} | ${stagingResults.features.toString().padEnd(7)} | ${prResults.features.toString().padEnd(12)} |`);
  console.log(`| Migrations      | ${mainResults.migrations.toString().padEnd(4)} | ${stagingResults.migrations.toString().padEnd(7)} | ${prResults.migrations.toString().padEnd(12)} |`);
  console.log(`| Monetisation    | ${mainResults.monetisationFiles.toString().padEnd(4)} | ${stagingResults.monetisationFiles.toString().padEnd(7)} | ${prResults.monetisationFiles.toString().padEnd(12)} |`);
  console.log(`| UI Components   | ${mainResults.components.toString().padEnd(4)} | ${stagingResults.components.toString().padEnd(7)} | ${prResults.components.toString().padEnd(12)} |`);
  
  console.log('\n🎯 Key Findings:');
  console.log('---------------');
  
  if (mainResults.features === 0 && stagingResults.features === 0) {
    console.log('❌ NO FEATURES IN PRODUCTION/STAGING');
    console.log('   All PR features are still unmerged');
  }
  
  if (mainResults.monetisationFiles === 0 && stagingResults.monetisationFiles === 0) {
    console.log('⚠️  LIMITED MONETISATION IN DEPLOYED CODE');
    console.log('   Need to tie features to revenue');
  }
  
  if (prResults.features === 0) {
    console.log('ℹ️  PR READINESS BRANCH IS ANALYSIS ONLY');
    console.log('   Contains reports, not feature code');
  }
  
  console.log('\n🚀 Recommended Actions:');
  console.log('---------------------');
  console.log('1. Merge PR #132 (Monetisation Strategy) first');
  console.log('2. Fix monetisation gaps in feature PRs');
  console.log('3. Resolve merge conflicts in blocked PRs');
  console.log('4. Deploy features incrementally with monitoring');
  
} else {
  console.log('❌ Some tests failed to run');
}

console.log('\n✅ Tests completed at: ' + new Date().toLocaleTimeString());

// Helper function
function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });
  
  return arrayOfFiles;
}