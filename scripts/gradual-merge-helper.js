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
  // PHASE 1: SAFE / IMMEDIATE (15 PRs)
  // Documentation & Analysis
  {
    id: 173,
    name: 'docs: add branch merge statistics',
    type: 'documentation',
    phase: 1,
    priority: 1,
    safe: true
  },
  {
    id: 161,
    name: 'Analyze database requirements',
    type: 'documentation',
    phase: 1,
    priority: 2,
    safe: true
  },
  {
    id: 160,
    name: 'PR merge readiness assessment',
    type: 'documentation',
    phase: 1,
    priority: 3,
    safe: true
  },
  {
    id: 149,
    name: 'feat: staging readiness report',
    type: 'documentation',
    phase: 1,
    priority: 4,
    safe: true
  },
  {
    id: 137,
    name: 'Add JO feature readiness validation',
    type: 'documentation',
    phase: 1,
    priority: 5,
    safe: true
  },
  // Test Suites & Fixes
  {
    id: 172,
    name: 'fix: resolve 5 failing test suites',
    type: 'test',
    phase: 1,
    priority: 6,
    safe: true
  },
  {
    id: 167,
    name: 'fix: resolve all vitest failures blocking staging merge',
    type: 'test',
    phase: 1,
    priority: 7,
    safe: true
  },
  {
    id: 163,
    name: 'Add comprehensive test suite: unit, integration, performance',
    type: 'test',
    phase: 1,
    priority: 8,
    safe: true
  },
  {
    id: 162,
    name: 'Add comprehensive test coverage',
    type: 'test',
    phase: 1,
    priority: 9,
    safe: true,
    notes: 'Already targets staging0217'
  },
  {
    id: 131,
    name: 'Add API database validation test suite (67 tests)',
    type: 'test',
    phase: 1,
    priority: 10,
    safe: true
  },
  {
    id: 129,
    name: 'fix(tests): resolve 8 failing tests',
    type: 'test',
    phase: 1,
    priority: 11,
    safe: true
  },
  // Verification & Scripts
  {
    id: 143,
    name: 'Verify presence of Companion Mode, Browser Control, Duo Mode',
    type: 'verification',
    phase: 1,
    priority: 12,
    safe: true
  },
  {
    id: 142,
    name: 'fix: align RGY colors to canonical system',
    type: 'ui-fix',
    phase: 1,
    priority: 13,
    safe: true
  },
  {
    id: 136,
    name: 'Add automated conflict resolution script',
    type: 'script',
    phase: 1,
    priority: 14,
    safe: true
  },
  {
    id: 121,
    name: '[WIP] Conduct testing for all open pull requests',
    type: 'test',
    phase: 1,
    priority: 15,
    safe: true,
    notes: 'Check if ready, may need completion'
  },

  // PHASE 2: MODERATE / AFTER TESTING (18 PRs)
  // CI/CD & Infrastructure
  {
    id: 170,
    name: 'feat(ci): monitor emergent environment changes',
    type: 'ci',
    phase: 2,
    priority: 16,
    safe: false
  },
  {
    id: 166,
    name: 'feat(ci): full pipeline coverage',
    type: 'ci',
    phase: 2,
    priority: 17,
    safe: false
  },
  {
    id: 134,
    name: 'Add staging CI gate with API route and database schema validation',
    type: 'ci',
    phase: 2,
    priority: 18,
    safe: false,
    notes: 'Important for staging process'
  },
  {
    id: 126,
    name: 'Add staging0217 branch to CI/CD pipelines',
    type: 'ci',
    phase: 2,
    priority: 19,
    safe: false,
    notes: 'Important for CI'
  },
  {
    id: 125,
    name: 'Fix CI test failures blocking deployment',
    type: 'ci',
    phase: 2,
    priority: 20,
    safe: false,
    notes: 'Important'
  },
  // Bug Fixes & Improvements
  {
    id: 164,
    name: 'Fix test infra, harden API auth, align RGY colors, fix Social Army config',
    type: 'fix',
    phase: 2,
    priority: 21,
    safe: false
  },
  {
    id: 158,
    name: 'Fix Social Army: broken config, missing methods',
    type: 'fix',
    phase: 2,
    priority: 22,
    safe: false
  },
  {
    id: 155,
    name: 'Enhance self-heal system',
    type: 'enhancement',
    phase: 2,
    priority: 23,
    safe: false
  },
  {
    id: 154,
    name: 'Harden terminal API security',
    type: 'security',
    phase: 2,
    priority: 24,
    safe: false
  },
  {
    id: 152,
    name: 'Add missing engine modules',
    type: 'enhancement',
    phase: 2,
    priority: 25,
    safe: false
  },
  {
    id: 148,
    name: 'Add UI components: voice-modulation, spending-caps',
    type: 'ui',
    phase: 2,
    priority: 26,
    safe: false
  },
  {
    id: 147,
    name: 'Fix UI component conflicts',
    type: 'fix',
    phase: 2,
    priority: 27,
    safe: false
  },
  // UI & Extensions
  {
    id: 145,
    name: 'Fix chrome extension for cross-screen user following',
    type: 'extension',
    phase: 2,
    priority: 28,
    safe: false
  },
  {
    id: 141,
    name: 'Add admin UI pages for events, journal, health',
    type: 'ui',
    phase: 2,
    priority: 29,
    safe: false
  },
  {
    id: 138,
    name: 'Add front/back camera toggle and DB API efficiency fixes',
    type: 'ui',
    phase: 2,
    priority: 30,
    safe: false
  },
  {
    id: 127,
    name: 'Consolidate admin route auth into shared withAdminAuth guard',
    type: 'refactor',
    phase: 2,
    priority: 31,
    safe: false
  },
  {
    id: 118,
    name: 'Add UI verification for Job Hunt Mode merge to staging0217',
    type: 'ui',
    phase: 2,
    priority: 32,
    safe: false
  },
  // Database
  {
    id: 165,
    name: 'feat(db): add missing staging migration',
    type: 'database',
    phase: 2,
    priority: 33,
    safe: false,
    notes: 'Test database changes carefully'
  },

  // PHASE 3: COMPLEX / LATER (16 PRs)
  // Security & Critical Updates
  {
    id: 171,
    name: 'fix(security): upgrade next 14.2.35→15.2.9; fix all test failures',
    type: 'security',
    phase: 3,
    priority: 35,
    safe: false,
    notes: 'CRITICAL - Major version upgrade, test extensively'
  },
  // Major Features
  {
    id: 169,
    name: 'Connect Control Room admin dashboard to real data',
    type: 'feature',
    phase: 3,
    priority: 36,
    safe: false
  },
  {
    id: 168,
    name: 'feat: SaaS & Business Integration Ecosystem catalog page',
    type: 'feature',
    phase: 3,
    priority: 37,
    safe: false
  },
  {
    id: 159,
    name: 'Add AI & database usage monitoring admin dashboard',
    type: 'feature',
    phase: 3,
    priority: 38,
    safe: false
  },
  {
    id: 157,
    name: 'feat: CubiQo Autopilot',
    type: 'feature',
    phase: 3,
    priority: 39,
    safe: false
  },
  {
    id: 156,
    name: 'Add adaptive learning engine and conversion strategy',
    type: 'feature',
    phase: 3,
    priority: 40,
    safe: false
  },
  {
    id: 153,
    name: 'feat: add image and video generation API + UI',
    type: 'feature',
    phase: 3,
    priority: 41,
    safe: false
  },
  {
    id: 151,
    name: 'feat: Add missing Tools API, Channels API, Admin API',
    type: 'feature',
    phase: 3,
    priority: 42,
    safe: false
  },
  {
    id: 150,
    name: 'Add workspace isolation and agent-to-agent messaging',
    type: 'feature',
    phase: 3,
    priority: 43,
    safe: false
  },
  {
    id: 146,
    name: 'Add PWA install prompt with iOS fallback',
    type: 'feature',
    phase: 3,
    priority: 44,
    safe: false
  },
  {
    id: 144,
    name: 'Add Agent Hub UI',
    type: 'feature',
    phase: 3,
    priority: 45,
    safe: false
  },
  {
    id: 140,
    name: 'Add emergent capabilities dashboard, security/antivirus UI',
    type: 'feature',
    phase: 3,
    priority: 46,
    safe: false
  },
  {
    id: 139,
    name: 'feat: contextual deals/offers integration',
    type: 'feature',
    phase: 3,
    priority: 47,
    safe: false
  },
  {
    id: 120,
    name: 'Add multimodal AI: vision and hearing',
    type: 'feature',
    phase: 3,
    priority: 48,
    safe: false
  },
  {
    id: 117,
    name: 'Implement RGY intelligent matching: hybrid chat rooms + AI discovery',
    type: 'feature',
    phase: 3,
    priority: 49,
    safe: false,
    notes: 'COMPLEX - has dependencies, merge last'
  },
  {
    id: 116,
    name: 'Implement enterprise security infrastructure',
    type: 'feature',
    phase: 3,
    priority: 50,
    safe: false,
    notes: 'COMPLEX'
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
  console.log(`Total PRs: ${PRS.length}\n`);
  
  // Phase 1
  const phase1 = PRS.filter(p => p.phase === 1);
  console.log('🟢 PHASE 1: SAFE / IMMEDIATE');
  console.log('----------------------------');
  console.log(`PRs: ${phase1.length} | Risk: LOW | Timeline: Days 1-5\n`);
  phase1.forEach(pr => {
    console.log(`  ${pr.priority}. PR #${pr.id} - ${pr.name}`);
    if (pr.notes) console.log(`     📝 ${pr.notes}`);
  });
  
  // Phase 2
  const phase2 = PRS.filter(p => p.phase === 2);
  console.log('\n🟡 PHASE 2: MODERATE / AFTER TESTING');
  console.log('------------------------------------');
  console.log(`PRs: ${phase2.length} | Risk: MODERATE | Timeline: Days 6-14\n`);
  phase2.forEach(pr => {
    console.log(`  ${pr.priority}. PR #${pr.id} - ${pr.name}`);
    if (pr.notes) console.log(`     📝 ${pr.notes}`);
  });
  
  // Phase 3
  const phase3 = PRS.filter(p => p.phase === 3);
  console.log('\n🔴 PHASE 3: COMPLEX / LATER');
  console.log('---------------------------');
  console.log(`PRs: ${phase3.length} | Risk: HIGH | Timeline: Days 15-35+\n`);
  phase3.forEach(pr => {
    console.log(`  ${pr.priority}. PR #${pr.id} - ${pr.name}`);
    if (pr.notes) console.log(`     📝 ${pr.notes}`);
  });
  
  console.log('\n🎯 KEY MILESTONES:');
  console.log('Phase 1 Complete: All tests & docs merged (Day 5)');
  console.log('Phase 2 Complete: CI/CD & fixes stable (Day 14)');
  console.log('Phase 3 Complete: All features tested (Day 35+)');
  console.log('\n📖 Full details: STAGING_MERGE_PREPARATION.md');
}

function mergePR(prId) {
  const pr = PRS.find(p => p.id === prId);
  if (!pr) {
    console.log(`❌ PR #${prId} not found in list`);
    console.log('Run "node gradual-merge-helper.js plan" to see available PRs');
    return false;
  }
  
  console.log(`\n🔄 Merging PR #${prId} - ${pr.name}`);
  console.log('='.repeat(50));
  console.log(`Phase: ${pr.phase} | Type: ${pr.type} | Priority: ${pr.priority}`);
  if (pr.notes) {
    console.log(`📝 Notes: ${pr.notes}`);
  }
  console.log('');
  
  try {
    // Fetch latest from remote
    console.log('Fetching latest from remote...');
    execSync('git fetch origin', { stdio: 'pipe' });
    
    // Check current branch
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    if (currentBranch !== 'staging') {
      console.log(`⚠️  Currently on ${currentBranch}, switching to staging...`);
      execSync('git checkout staging', { stdio: 'inherit' });
    }
    
    // Pull latest staging
    console.log('Pulling latest staging...');
    execSync('git pull origin staging', { stdio: 'pipe' });
    
    // Note: In real usage, PRs should be retargeted to staging first
    console.log(`\n⚠️  IMPORTANT: Make sure PR #${prId} is retargeted to staging first:`);
    console.log(`   gh pr edit ${prId} --base staging`);
    console.log('');
    console.log('Once retargeted, merge via GitHub UI or:');
    console.log(`   gh pr merge ${prId} --merge`);
    console.log('');
    console.log('After merge, test in staging and run:');
    console.log(`   node scripts/gradual-merge-helper.js report ${prId} pass "test notes"`);
    
    return true;
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    
    if (error.message.includes('conflict')) {
      console.log('\n⚡ CONFLICT DETECTED');
      console.log('Resolve conflicts and then:');
      console.log('  git add .');
      console.log(`  git commit -m "Resolve conflicts for PR #${prId}"`);
      console.log('  git push origin staging');
    }
    
    return false;
  }
}

function createTestReport(prId, result, notes = '') {
  const reportFile = 'STAGING_TEST_REPORTS.md';
  const timestamp = new Date().toISOString().split('T')[0]; // Just the date
  
  let report = '';
  if (fs.existsSync(reportFile)) {
    report = fs.readFileSync(reportFile, 'utf8');
  } else {
    report = '# STAGING TEST REPORTS\n\n';
    report += 'Track the testing results of each PR merged to staging.\n\n';
    report += '## Test Results\n\n';
  }
  
  const pr = PRS.find(p => p.id === prId);
  const prName = pr ? pr.name : `PR #${prId}`;
  const prPhase = pr ? pr.phase : 'Unknown';
  
  const emoji = result === 'pass' ? '✅' : result === 'fail' ? '❌' : '⚠️';
  
  report += `### ${timestamp} - PR #${prId} (Phase ${prPhase})\n`;
  report += `${emoji} **${prName}**: ${result.toUpperCase()}\n`;
  if (notes) {
    report += `**Notes:** ${notes}\n`;
  }
  report += '\n';
  
  fs.writeFileSync(reportFile, report, 'utf8');
  console.log(`📝 Test report updated: ${reportFile}`);
}

function showStats() {
  console.log('📊 STAGING MERGE STATISTICS');
  console.log('===========================\n');
  
  const phase1 = PRS.filter(p => p.phase === 1);
  const phase2 = PRS.filter(p => p.phase === 2);
  const phase3 = PRS.filter(p => p.phase === 3);
  
  console.log(`Total PRs: ${PRS.length}`);
  console.log(`Phase 1 (Safe): ${phase1.length} PRs`);
  console.log(`Phase 2 (Moderate): ${phase2.length} PRs`);
  console.log(`Phase 3 (Complex): ${phase3.length} PRs`);
  console.log('');
  
  // Check for test reports
  if (fs.existsSync('STAGING_TEST_REPORTS.md')) {
    const content = fs.readFileSync('STAGING_TEST_REPORTS.md', 'utf8');
    const passed = (content.match(/✅/g) || []).length;
    const failed = (content.match(/❌/g) || []).length;
    const warning = (content.match(/⚠️/g) || []).length;
    
    console.log('Test Results:');
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  ⚠️  Warning: ${warning}`);
    console.log(`  📋 Total Tested: ${passed + failed + warning}`);
    console.log(`  🔄 Remaining: ${PRS.length - (passed + failed + warning)}`);
    console.log('');
  }
  
  // By type
  const typeCount = {};
  PRS.forEach(pr => {
    typeCount[pr.type] = (typeCount[pr.type] || 0) + 1;
  });
  
  console.log('By Type:');
  Object.entries(typeCount).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
  console.log('');
  
  // Next PRs to merge
  console.log('🎯 Next 5 PRs to Merge:');
  const sortedPRs = [...PRS].sort((a, b) => a.priority - b.priority);
  sortedPRs.slice(0, 5).forEach(pr => {
    console.log(`  ${pr.priority}. PR #${pr.id} - ${pr.name} (Phase ${pr.phase})`);
  });
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🚀 GRADUAL STAGING MERGE HELPER');
    console.log('================================\n');
    console.log('Usage:');
    console.log('  node gradual-merge-helper.js check         - Check git status');
    console.log('  node gradual-merge-helper.js plan          - Show merge plan (all phases)');
    console.log('  node gradual-merge-helper.js stats         - Show merge statistics');
    console.log('  node gradual-merge-helper.js merge <pr-id> - Merge specific PR');
    console.log('  node gradual-merge-helper.js report <pr-id> <pass|fail> [notes] - Create test report');
    console.log('');
    console.log('Examples:');
    console.log('  node gradual-merge-helper.js plan');
    console.log('  node gradual-merge-helper.js merge 173');
    console.log('  node gradual-merge-helper.js report 173 pass "Documentation looks good"');
    console.log('');
    console.log('📖 See STAGING_MERGE_PREPARATION.md for complete details');
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
      
    case 'stats':
      showStats();
      break;
      
    case 'merge':
      if (args.length < 2) {
        console.log('❌ Please specify PR ID to merge');
        console.log('Example: node gradual-merge-helper.js merge 173');
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
        console.log('Example: node gradual-merge-helper.js report 173 pass "Looks good"');
        return;
      }
      createTestReport(parseInt(args[1]), args[2], args.slice(3).join(' '));
      break;
      
    default:
      console.log(`❌ Unknown command: ${command}`);
      console.log('Run without arguments to see usage');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  PRS,
  checkGitStatus,
  showMergePlan,
  showStats,
  mergePR,
  createTestReport
};