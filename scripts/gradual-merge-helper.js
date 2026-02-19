#!/usr/bin/env node

/**
 * Gradual Merge Helper
 * Helps merge PRs one by one to staging
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 GRADUAL STAGING MERGE HELPER');
console.log('================================\n');

const PRS = [
  {
    id: 132,
    name: 'Monetisation Strategy',
    type: 'documentation',
    branch: 'pr-132', // Assuming branch name
    safe: true
  },
  {
    id: 133,
    name: 'Emergent Docs',
    type: 'documentation',
    branch: 'pr-133',
    safe: true
  },
  {
    id: 128,
    name: 'Testing Infrastructure',
    type: 'infrastructure',
    branch: 'pr-128',
    safe: true
  },
  {
    id: 135,
    name: 'Test Coverage',
    type: 'infrastructure',
    branch: 'pr-135',
    safe: true
  },
  {
    id: 119,
    name: 'Journal History',
    type: 'ui',
    branch: 'pr-119',
    safe: true
  },
  {
    id: 'our-docs',
    name: 'Our Documentation',
    type: 'documentation',
    branch: 'safe-merge-only', // Contains our docs
    safe: true
  },
  {
    id: 130,
    name: 'Monitoring',
    type: 'complex',
    branch: 'pr-130',
    safe: false,
    notes: 'Needs UI completion'
  },
  {
    id: 118,
    name: 'Job Hunt',
    type: 'complex',
    branch: 'pr-118',
    safe: false,
    notes: 'Has database changes'
  },
  {
    id: 117,
    name: 'RGY',
    type: 'complex',
    branch: 'pr-117',
    safe: false,
    notes: 'Has OpenAI/pgvector dependencies'
  }
];

function checkGitStatus() {
  console.log('🔍 Checking Git status...\n');
  
  try {
    // Check current branch
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    console.log(`Current branch: ${currentBranch}`);
    
    // Check if staging branch exists
    const branches = execSync('git branch -a', { encoding: 'utf8' });
    const hasStaging = branches.includes('staging') || branches.includes('origin/staging');
    
    if (!hasStaging) {
      console.log('\n⚠️  Staging branch does not exist.');
      console.log('To create it:');
      console.log('  git checkout main');
      console.log('  git pull origin main');
      console.log('  git checkout -b staging');
      console.log('  git push origin staging');
      return false;
    }
    
    // Check if on staging
    if (currentBranch !== 'staging') {
      console.log(`\n⚠️  Not on staging branch. Current: ${currentBranch}`);
      console.log('To switch: git checkout staging');
      return false;
    }
    
    // Check if staging is up to date
    execSync('git fetch origin', { stdio: 'pipe' });
    const status = execSync('git status -uno', { encoding: 'utf8' });
    
    if (status.includes('Your branch is behind')) {
      console.log('\n⚠️  Staging branch is behind remote.');
      console.log('To update: git pull origin staging');
      return false;
    }
    
    if (status.includes('Your branch is ahead')) {
      console.log('\n⚠️  Staging branch has unpushed changes.');
      console.log('Consider: git push origin staging');
    }
    
    console.log('\n✅ Git status OK');
    return true;
    
  } catch (error) {
    console.log(`❌ Git error: ${error.message}`);
    return false;
  }
}

function showMergePlan() {
  console.log('📋 GRADUAL MERGE PLAN');
  console.log('=====================\n');
  
  console.log('SAFE PRs (Merge first):');
  console.log('----------------------');
  PRS.filter(p => p.safe).forEach((pr, i) => {
    console.log(`${i + 1}. PR #${pr.id} - ${pr.name} (${pr.type})`);
  });
  
  console.log('\nCOMPLEX PRs (Merge after testing):');
  console.log('---------------------------------');
  PRS.filter(p => !p.safe).forEach((pr, i) => {
    console.log(`${i + 1}. PR #${pr.id} - ${pr.name} (${pr.type})`);
    console.log(`   ⚠️  ${pr.notes}`);
  });
  
  console.log('\n🎯 RECOMMENDED ORDER:');
  console.log('1. Documentation PRs (#132, #133, our-docs)');
  console.log('2. Infrastructure PRs (#128, #135)');
  console.log('3. UI PR (#119)');
  console.log('4. Complex PRs (#130, #118, #117)');
}

function mergePR(prId) {
  const pr = PRS.find(p => p.id === prId);
  if (!pr) {
    console.log(`❌ PR #${prId} not found in list`);
    return false;
  }
  
  console.log(`\n🔄 Merging PR #${prId} - ${pr.name}`);
  console.log('='.repeat(40));
  
  try {
    // Check if branch exists locally
    const branches = execSync('git branch -a', { encoding: 'utf8' });
    const branchExists = branches.includes(pr.branch) || branches.includes(`remotes/origin/${pr.branch}`);
    
    if (!branchExists) {
      console.log(`⚠️  Branch ${pr.branch} not found locally.`);
      console.log(`Fetching from remote...`);
      execSync('git fetch origin', { stdio: 'pipe' });
    }
    
    // Merge the PR
    console.log(`Merging ${pr.branch} into staging...`);
    execSync(`git merge --no-ff origin/${pr.branch}`, { stdio: 'inherit' });
    
    console.log(`\n✅ PR #${prId} merged successfully`);
    
    // Ask to push
    console.log('\n📤 Push to remote staging? (y/n)');
    // In real implementation, would read from stdin
    console.log('Run: git push origin staging');
    
    return true;
    
  } catch (error) {
    console.log(`❌ Merge failed: ${error.message}`);
    
    if (error.message.includes('conflict')) {
      console.log('\n⚡ CONFLICT DETECTED');
      console.log('Resolve conflicts and then:');
      console.log('  git add .');
      console.log('  git commit -m "Resolve conflicts for PR #${prId}"');
      console.log('  git push origin staging');
    }
    
    return false;
  }
}

function createTestReport(prId, result, notes = '') {
  const reportFile = 'STAGING_TEST_REPORTS.md';
  const timestamp = new Date().toISOString();
  
  let report = '';
  if (fs.existsSync(reportFile)) {
    report = fs.readFileSync(reportFile, 'utf8');
  } else {
    report = '# STAGING TEST REPORTS\n\n';
  }
  
  const pr = PRS.find(p => p.id === prId);
  const prName = pr ? pr.name : `PR #${prId}`;
  
  const emoji = result === 'pass' ? '✅' : result === 'fail' ? '❌' : '⚠️';
  
  report += `### ${timestamp}\n`;
  report += `${emoji} **PR #${prId} - ${prName}**: ${result.toUpperCase()}\n`;
  if (notes) {
    report += `Notes: ${notes}\n`;
  }
  report += '\n';
  
  fs.writeFileSync(reportFile, report, 'utf8');
  console.log(`📝 Test report updated: ${reportFile}`);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node gradual-merge-helper.js check    - Check git status');
    console.log('  node gradual-merge-helper.js plan     - Show merge plan');
    console.log('  node gradual-merge-helper.js merge <pr-id> - Merge specific PR');
    console.log('  node gradual-merge-helper.js report <pr-id> <pass|fail> [notes] - Create test report');
    console.log('');
    console.log('Examples:');
    console.log('  node gradual-merge-helper.js merge 132');
    console.log('  node gradual-merge-helper.js report 132 pass "Documentation looks good"');
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'check':
      checkGitStatus();
      break;
      
    case 'plan':
      showMergePlan();
      break;
      
    case 'merge':
      if (args.length < 2) {
        console.log('❌ Please specify PR ID to merge');
        console.log('Example: node gradual-merge-helper.js merge 132');
        return;
      }
      if (!checkGitStatus()) {
        console.log('\n❌ Cannot merge - fix git issues first');
        return;
      }
      mergePR(parseInt(args[1]) || args[1]);
      break;
      
    case 'report':
      if (args.length < 3) {
        console.log('❌ Please specify PR ID and result');
        console.log('Example: node gradual-merge-helper.js report 132 pass');
        return;
      }
      createTestReport(args[1], args[2], args.slice(3).join(' '));
      break;
      
    default:
      console.log(`❌ Unknown command: ${command}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  PRS,
  checkGitStatus,
  showMergePlan,
  mergePR,
  createTestReport
};