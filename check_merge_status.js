const { execSync } = require('child_process');

console.log('🔍 CHECKING MERGE STATUS');
console.log('========================\n');

try {
  // Check current branch
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  console.log(`1. Current branch: ${currentBranch}`);
  
  // Check recent commits
  console.log('\n2. Recent commits (last 5):');
  const commits = execSync('git log --oneline -5', { encoding: 'utf8' });
  console.log(commits);
  
  // Check if we've pushed
  console.log('3. Checking remote status...');
  execSync('git fetch origin', { stdio: 'pipe' });
  
  // Compare with main
  const ahead = execSync('git log --oneline origin/main..HEAD 2>&1', { encoding: 'utf8' });
  const behind = execSync('git log --oneline HEAD..origin/main 2>&1', { encoding: 'utf8' });
  
  console.log(`\n4. Compared to origin/main:`);
  console.log(`   Commits ahead: ${ahead.trim() ? ahead.split('\n').filter(l => l.trim()).length : '0'}`);
  console.log(`   Commits behind: ${behind.trim() ? behind.split('\n').filter(l => l.trim()).length : '0'}`);
  
  if (ahead.trim()) {
    console.log('\n📊 COMMITS NOT YET IN MAIN:');
    console.log(ahead);
    
    console.log('\n❌ STATUS: NOT MERGED YET');
    console.log('   The safe-merge-only branch has NOT been merged to main.');
    console.log('   These commits are still only in the safe-merge-only branch.');
  } else if (behind.trim()) {
    console.log('\n✅ STATUS: MERGED (or behind main)');
    console.log('   Either:');
    console.log('   1. The branch was merged to main');
    console.log('   2. Or main has new commits we don\'t have');
  } else {
    console.log('\n⚡ STATUS: IN SYNC WITH MAIN');
    console.log('   Branch is up to date with main');
  }
  
  // Check if PR was created
  console.log('\n5. PR Status:');
  console.log('   PR URL was: https://github.com/thecubiqo/thecubiqo/pull/new/safe-merge-only');
  console.log('   This creates a NEW PR - you need to visit that URL and create it.');
  console.log('   The branch was pushed, but no PR was automatically created.');
  
} catch (error) {
  console.log(`Error: ${error.message}`);
}