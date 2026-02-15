#!/usr/bin/env node

/**
 * PR Analysis Script
 * 
 * This script analyzes all open PRs in the repository to identify:
 * - Which PRs are actually merged but still showing as open
 * - Which PRs are stale/outdated
 * - Which PRs should be closed
 * 
 * Note: This is an analysis tool only. It cannot close PRs directly.
 * The output should be reviewed by a maintainer who can then close PRs via GitHub UI.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// List of PRs mentioned in the issue
const PR_NUMBERS = [
  47, 46, 45, 44, 43, 42, 41, 40, 39, 38, 37, 36, 35, 
  33, 31, 30, 29, 28, 27, 25, 22, 21, 20, 17, 15, 14
];

async function analyzeGitHistory() {
  console.log('Analyzing git history for merged PR references...\n');
  
  const results = {
    totalPRs: PR_NUMBERS.length,
    merged: [],
    likelyMerged: [],
    needsReview: [],
    recommendations: []
  };

  // Check git log for PR merge commits
  try {
    const gitLog = execSync('git log --all --oneline --grep="(#[0-9]\\+)" -100', { 
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024 
    });
    
    const lines = gitLog.split('\n');
    const mergedPRs = new Set();
    
    for (const line of lines) {
      const match = line.match(/#(\d+)\)/);
      if (match) {
        const prNum = parseInt(match[1]);
        if (PR_NUMBERS.includes(prNum)) {
          mergedPRs.add(prNum);
          results.merged.push(prNum);
        }
      }
    }
    
    console.log('Found merged PRs in git history:');
    if (results.merged.length > 0) {
      results.merged.sort((a, b) => a - b);
      results.merged.forEach(pr => console.log(`  - PR #${pr} - Found in git history`));
    } else {
      console.log('  None found');
    }
    
    // Check for PRs not in git history
    results.needsReview = PR_NUMBERS.filter(pr => !mergedPRs.has(pr));
    
  } catch (error) {
    console.error('Error analyzing git history:', error.message);
  }

  return results;
}

async function analyzeBranches() {
  console.log('\n\nAnalyzing branches...\n');
  
  try {
    const branches = execSync('git branch -r', { encoding: 'utf-8' });
    const branchLines = branches.split('\n').filter(b => b.trim());
    
    console.log(`Found ${branchLines.length} remote branches`);
    
    // Look for PR-related branches
    const prBranches = branchLines.filter(b => 
      b.includes('copilot/') || b.includes('feature/') || b.includes('fix/')
    );
    
    console.log(`\nPR-related branches (${prBranches.length}):`);
    prBranches.slice(0, 10).forEach(b => console.log(`  ${b.trim()}`));
    if (prBranches.length > 10) {
      console.log(`  ... and ${prBranches.length - 10} more`);
    }
    
  } catch (error) {
    console.error('Error analyzing branches:', error.message);
  }
}

function generateReport(results) {
  console.log('\n\n' + '='.repeat(80));
  console.log('PR CLEANUP ANALYSIS REPORT');
  console.log('='.repeat(80));
  
  console.log(`\nTotal PRs to analyze: ${results.totalPRs}`);
  console.log(`Confirmed merged in git history: ${results.merged.length}`);
  console.log(`Need manual review: ${results.needsReview.length}`);
  
  console.log('\n' + '-'.repeat(80));
  console.log('RECOMMENDATIONS');
  console.log('-'.repeat(80));
  
  if (results.merged.length > 0) {
    console.log('\n✅ These PRs appear to be merged and can be closed:');
    results.merged.forEach(pr => {
      console.log(`   - PR #${pr}`);
    });
  }
  
  if (results.needsReview.length > 0) {
    console.log('\n⚠️  These PRs need manual review via GitHub UI:');
    results.needsReview.forEach(pr => {
      console.log(`   - PR #${pr}`);
    });
  }
  
  console.log('\n' + '-'.repeat(80));
  console.log('NEXT STEPS');
  console.log('-'.repeat(80));
  console.log(`
1. Review the list of merged PRs above
2. Go to GitHub UI: https://github.com/thecubiqo/thecubiqo/pulls
3. For each merged PR, manually close it with a comment like:
   "This PR was already merged. Closing to clean up the PR list."
4. For PRs needing review, check their status individually and:
   - Close if obsolete/superseded
   - Close if already merged but not detected
   - Keep open if still actively being worked on
5. Consider setting up automated PR cleanup for future use

Note: This script cannot close PRs programmatically due to API limitations.
A repository maintainer with appropriate permissions must close them manually.
`);

  // Write results to a file
  const reportPath = path.join(__dirname, '..', 'PR_CLEANUP_REPORT.md');
  const markdown = generateMarkdownReport(results);
  fs.writeFileSync(reportPath, markdown);
  console.log(`\n📄 Full report written to: ${reportPath}`);
}

function generateMarkdownReport(results) {
  return `# PR Cleanup Analysis Report

Generated: ${new Date().toISOString()}

## Summary

- **Total PRs analyzed:** ${results.totalPRs}
- **Confirmed merged:** ${results.merged.length}
- **Need manual review:** ${results.needsReview.length}

## Merged PRs (Can be closed)

${results.merged.length > 0 ? results.merged.map(pr => `- [ ] PR #${pr} - Close via GitHub UI`).join('\n') : 'None detected in git history'}

## PRs Needing Manual Review

${results.needsReview.length > 0 ? results.needsReview.map(pr => `- [ ] PR #${pr} - Review status on GitHub`).join('\n') : 'None'}

## How to Close PRs

Since these PRs cannot be closed programmatically, follow these steps:

1. Go to https://github.com/thecubiqo/thecubiqo/pulls
2. Filter to show open PRs
3. For each PR marked as merged above:
   - Open the PR
   - Verify it was merged (look for "Merged" badge)
   - Add a comment: "This PR was already merged. Closing to clean up the PR list."
   - Click "Close pull request"

## Automation Suggestions

Consider implementing:
- GitHub Actions workflow to auto-close merged PRs
- Stale PR detector and notifier
- PR lifecycle management bot

## Notes

- This analysis is based on git history only
- Some PRs may need additional verification via GitHub API
- Draft PRs might be intentionally left open for future work
`;
}

// Main execution
async function main() {
  console.log('Starting PR analysis...\n');
  
  const results = await analyzeGitHistory();
  await analyzeBranches();
  generateReport(results);
  
  console.log('\n✅ Analysis complete!\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
