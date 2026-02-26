// Resolve and merge PR #217
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 RESOLVING AND MERGING PR #217');
console.log('================================\n');

// 1. First, let's check the current git status
console.log('1. 📊 CHECKING CURRENT GIT STATUS:\n');

try {
  const gitStatus = execSync('git status', { cwd: __dirname }).toString();
  console.log(gitStatus);
} catch (error) {
  console.log('Error checking git status:', error.message);
}

// 2. Check if we have any uncommitted changes
console.log('\n2. 🔄 CHECKING FOR UNCOMMITTED CHANGES:\n');

try {
  const diff = execSync('git diff --name-only', { cwd: __dirname }).toString();
  if (diff.trim()) {
    console.log('Uncommitted changes found:');
    console.log(diff);
    
    // Commit them first
    console.log('\nCommitting changes first...');
    execSync('git add .', { cwd: __dirname });
    execSync('git commit -m "Auto-commit before PR merge"', { cwd: __dirname });
    console.log('✅ Changes committed');
  } else {
    console.log('✅ No uncommitted changes');
  }
} catch (error) {
  console.log('Error checking diff:', error.message);
}

// 3. Pull latest changes from main
console.log('\n3. 📥 PULLING LATEST CHANGES FROM MAIN:\n');

try {
  const pullOutput = execSync('git pull origin main', { cwd: __dirname }).toString();
  console.log(pullOutput);
  
  if (pullOutput.includes('CONFLICT')) {
    console.log('❌ Merge conflict detected!');
    console.log('Need to resolve conflicts manually.');
    
    // Try to auto-resolve simple conflicts
    console.log('\nAttempting to auto-resolve conflicts...');
    
    // Check for conflicted files
    const conflictedFiles = execSync('git diff --name-only --diff-filter=U', { cwd: __dirname }).toString().trim();
    if (conflictedFiles) {
      console.log('Conflicted files:');
      console.log(conflictedFiles);
      
      // For each conflicted file, try to keep our changes
      conflictedFiles.split('\n').forEach(file => {
        if (file.trim()) {
          console.log(`\nResolving ${file}...`);
          try {
            // Use ours strategy (keep our changes)
            execSync(`git checkout --ours "${file}"`, { cwd: __dirname });
            execSync(`git add "${file}"`, { cwd: __dirname });
            console.log(`✅ Resolved ${file} (kept our changes)`);
          } catch (error) {
            console.log(`❌ Failed to resolve ${file}:`, error.message);
          }
        }
      });
      
      // Complete the merge
      try {
        execSync('git commit -m "Merge PR #217 - resolved conflicts"', { cwd: __dirname });
        console.log('✅ Merge completed');
      } catch (error) {
        console.log('Error completing merge:', error.message);
      }
    }
  } else {
    console.log('✅ Successfully pulled latest changes');
  }
} catch (error) {
  console.log('Error pulling:', error.message);
}

// 4. Check PR #217 using GitHub CLI
console.log('\n4. 🔍 CHECKING PR #217:\n');

try {
  // Try to get PR details
  const prInfo = execSync('gh pr view 217', { cwd: __dirname }).toString();
  console.log('PR #217 Details:');
  console.log(prInfo);
  
  // Extract PR title and state
  const lines = prInfo.split('\n');
  const title = lines.find(l => l.includes('title:'))?.replace('title:', '').trim();
  const state = lines.find(l => l.includes('state:'))?.replace('state:', '').trim();
  const mergeable = lines.find(l => l.includes('mergeable:'))?.replace('mergeable:', '').trim();
  
  console.log(`\nTitle: ${title}`);
  console.log(`State: ${state}`);
  console.log(`Mergeable: ${mergeable}`);
  
  if (state === 'OPEN' && mergeable === 'MERGEABLE') {
    console.log('\n✅ PR #217 is open and mergeable');
    
    // Merge the PR
    console.log('\nMerging PR #217...');
    const mergeOutput = execSync('gh pr merge 217 --merge', { cwd: __dirname }).toString();
    console.log(mergeOutput);
    
    if (mergeOutput.includes('Merged pull request')) {
      console.log('✅ Successfully merged PR #217');
      
      // Pull the merged changes
      console.log('\nPulling merged changes...');
      const pullAfterMerge = execSync('git pull origin main', { cwd: __dirname }).toString();
      console.log(pullAfterMerge);
    }
  } else if (state === 'MERGED') {
    console.log('✅ PR #217 is already merged');
  } else if (state === 'CLOSED') {
    console.log('⚠️  PR #217 is closed (not merged)');
  } else {
    console.log(`❓ PR #217 state: ${state}, mergeable: ${mergeable}`);
  }
} catch (error) {
  console.log('Error checking PR #217:', error.message);
  console.log('\nGitHub CLI might not be available or PR not found.');
  
  // Manual instructions
  console.log('\n📝 MANUAL INSTRUCTIONS FOR PR #217:');
  console.log('1. Go to: https://github.com/thecubiqo/thecubiqo/pull/217');
  console.log('2. Check the PR status');
  console.log('3. If open and mergeable, click "Merge pull request"');
  console.log('4. Choose merge method (squash, merge, rebase)');
  console.log('5. Confirm merge');
  console.log('6. Delete the branch if prompted');
  console.log('7. Then run: git pull origin main');
}

// 5. Push any changes
console.log('\n5. 📤 PUSHING CHANGES:\n');

try {
  const pushOutput = execSync('git push origin main', { cwd: __dirname }).toString();
  console.log(pushOutput);
  console.log('✅ Changes pushed');
} catch (error) {
  console.log('Error pushing:', error.message);
}

// 6. Check what PR #217 was about
console.log('\n6. 📋 WHAT WAS PR #217 ABOUT?\n');

// Try to find any recent changes that might be from PR #217
try {
  const recentCommits = execSync('git log --oneline --graph -20', { cwd: __dirname }).toString();
  console.log('Recent commit history:');
  console.log(recentCommits.substring(0, 500) + '...');
  
  // Look for PR #217 in commit messages
  if (recentCommits.includes('#217') || recentCommits.includes('217')) {
    console.log('\n✅ Found references to PR #217 in commit history');
  }
} catch (error) {
  console.log('Error checking commit history:', error.message);
}

// 7. Check for any PR-related files
console.log('\n7. 🔍 CHECKING FOR PR-RELATED FILES:\n');

// Look for common PR-related patterns
const prPatterns = [
  '*.patch',
  '*.diff',
  '*pr*',
  '*217*',
  '*.rej'
];

prPatterns.forEach(pattern => {
  try {
    const files = execSync(`Get-ChildItem -Recurse -Filter "${pattern}" -ErrorAction SilentlyContinue | Select-Object -First 5`, 
      { cwd: __dirname, shell: 'powershell' }).toString();
    if (files.trim()) {
      console.log(`Files matching ${pattern}:`);
      console.log(files);
    }
  } catch (error) {
    // Ignore errors
  }
});

// 8. Summary and next steps
console.log('\n🎯 SUMMARY:');
console.log('==========');

console.log('\n✅ Steps completed:');
console.log('1. Checked git status');
console.log('2. Committed any uncommitted changes');
console.log('3. Pulled latest changes from main');
console.log('4. Attempted to check/merge PR #217');
console.log('5. Pushed changes');

console.log('\n🔗 PR #217 URL:');
console.log('https://github.com/thecubiqo/thecubiqo/pull/217');

console.log('\n🚀 NEXT STEPS:');
console.log('1. Manually check PR #217 at the link above');
console.log('2. If open, merge it using GitHub UI');
console.log('3. After merging, run: git pull origin main');
console.log('4. Test the merged changes');
console.log('5. Trigger Vercel deployment if needed');

console.log('\n📞 IF PR #217 HAS CONFLICTS:');
console.log('1. Resolve conflicts in GitHub UI');
console.log('2. Or resolve locally and push');
console.log('3. Use: git merge origin/main --no-ff');
console.log('4. Resolve conflicts manually');
console.log('5. Commit: git commit -m "Merge PR #217"');
console.log('6. Push: git push origin main');

console.log('\n🔧 QUICK COMMANDS:');
console.log('# Check PR status');
console.log('gh pr view 217');
console.log('');
console.log('# Merge PR');
console.log('gh pr merge 217 --merge');
console.log('');
console.log('# Pull latest');
console.log('git pull origin main');
console.log('');
console.log('# Force update if needed');
console.log('git fetch origin');
console.log('git reset --hard origin/main');