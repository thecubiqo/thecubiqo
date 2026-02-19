const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📚 MERGING DOCUMENTATION ONLY');
console.log('=============================\n');

// First, make sure we're on staging0217
try {
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  console.log(`Current branch: ${currentBranch}`);
  
  if (currentBranch !== 'staging0217') {
    console.log('❌ Please switch to staging0217 branch first');
    console.log('git checkout staging0217');
    process.exit(1);
  }
  
  // Check if staging is clean
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  if (status.trim()) {
    console.log('❌ Staging branch has uncommitted changes');
    console.log('Please commit or stash them first');
    process.exit(1);
  }
  
  console.log('✅ Staging branch is clean\n');
  
  // List documentation files to merge
  console.log('📄 DOCUMENTATION FILES TO MERGE:');
  console.log('--------------------------------\n');
  
  const docFiles = [
    // PR #132 - Monetisation
    'docs/MONETIZATION_STRATEGY.md',
    
    // PR #133 - Emergent Docs
    'EMERGENT_REQUIREMENTS_SUMMARY.md',
    'EMERGENT_REQUIREMENTS_EXTRACTED.md',
    'docs/emergent-architecture.md',
    'docs/emergent-database-schema.md',
    'docs/emergent-security.md',
    'docs/emergent-testing.md',
    'docs/emergent-tool-api.md',
    
    // Our added docs (renamed to match what we have)
    'API_DOCUMENTATION.md',  // This is our API.md
    'CONTRIBUTING.md',
    'DEPLOYMENT_CHECKLIST.md',
    'DEPLOYMENT_VERIFICATION_SUMMARY.md',
    'DEPLOYMENT-2-SUMMARY.md',
    'docs/DEPLOYMENT_GUIDE_FINAL.md',
    'docs/DEPLOYMENT_STRATEGY.md',
    'docs/CODING_AGENT_API.md',
    'docs/LANDING_UI_DEPLOYMENT.md',
    'docs/SOCIAL_ARMY_DEPLOYMENT_DIAGRAM.md',
    'VERCEL_DEPLOYMENT_MAP.md'
  ];
  
  // Check which files exist
  const existingFiles = docFiles.filter(file => fs.existsSync(file));
  
  console.log(`Found ${existingFiles.length} documentation files:\n`);
  existingFiles.forEach(file => {
    const size = fs.statSync(file).size;
    console.log(`  📄 ${file.padEnd(50)} ${(size / 1024).toFixed(1)}KB`);
  });
  
  console.log('\n🚀 MERGE OPTIONS:');
  console.log('1. Merge all documentation at once (recommended - all are docs)');
  console.log('2. Merge PR by PR');
  console.log('3. Review files first');
  
  // For now, let's merge all documentation
  console.log('\n📦 Merging all documentation files...');
  
  // Create a temporary branch with just docs
  console.log('\n1. Creating temporary docs branch...');
  execSync('git checkout -b temp-docs-merge', { stdio: 'pipe' });
  
  // Checkout files from safe-merge-only
  console.log('2. Checking out documentation files from safe-merge-only...');
  existingFiles.forEach(file => {
    try {
      execSync(`git checkout safe-merge-only -- "${file}"`, { stdio: 'pipe' });
      console.log(`   ✅ ${file}`);
    } catch (error) {
      console.log(`   ❌ ${file} - ${error.message}`);
    }
  });
  
  // Commit the documentation
  console.log('\n3. Committing documentation changes...');
  execSync('git add .', { stdio: 'pipe' });
  execSync('git commit -m "docs: merge all documentation (PR #132, #133, our docs)"', { stdio: 'pipe' });
  
  console.log('\n✅ Documentation committed to temp-docs-merge branch');
  
  // Go back to staging and merge
  console.log('\n4. Merging into staging0217...');
  execSync('git checkout staging0217', { stdio: 'pipe' });
  
  try {
    execSync('git merge --no-ff temp-docs-merge -m "Merge documentation: monetisation, emergent docs, API/deployment guides"', { stdio: 'inherit' });
    console.log('\n🎉 SUCCESS: Documentation merged to staging0217!');
    
    // Clean up
    execSync('git branch -d temp-docs-merge', { stdio: 'pipe' });
    
    console.log('\n📤 Next steps:');
    console.log('   git push origin staging0217');
    console.log('   Wait for staging deployment');
    console.log('   Verify documentation is accessible');
    
  } catch (error) {
    console.log('\n❌ Merge conflict detected!');
    console.log('Resolve conflicts and then:');
    console.log('   git add .');
    console.log('   git commit -m "Resolve documentation merge conflicts"');
    console.log('   git push origin staging0217');
    
    // Don't delete temp branch if conflict
    console.log('\n⚠️  Temp branch preserved: temp-docs-merge');
  }
  
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
}