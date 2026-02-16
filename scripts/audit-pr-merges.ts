/**
 * PR Merge Audit Script
 * 
 * Programmatically verifies that all closed PRs (#1-#80) in thecubiqo/thecubiqo
 * are fully merged into main branch. Generates a report in REPORTS/PR_MERGE_AUDIT.md
 * 
 * Usage:
 *   GITHUB_TOKEN=<token> tsx scripts/audit-pr-merges.ts
 */

import { Octokit } from "@octokit/rest";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.error("Error: GITHUB_TOKEN environment variable is required.");
  process.exit(1);
}

const OWNER = process.env.AUDIT_OWNER ?? "thecubiqo";
const REPO = process.env.AUDIT_REPO ?? "thecubiqo";
const START_PR = 1;
const END_PR = 80;
const OUTPUT_DIR = "REPORTS";
const OUTPUT_FILE = "PR_MERGE_AUDIT.md";

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PRStatus {
  number: number;
  title: string;
  state: string;
  merged: boolean;
  mergedAt: string | null;
  mergeCommitSha: string | null;
  headSha: string | null;
  baseBranch: string;
  url: string;
  author: string;
  createdAt: string;
  closedAt: string | null;
  inMainHistory: boolean | null;
  status: "merged" | "closed-without-merge" | "open" | "not-found";
  notes: string;
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

async function checkCommitInMainHistory(sha: string): Promise<boolean> {
  try {
    // Check if the commit exists in main branch history
    const { data } = await octokit.repos.getBranch({
      owner: OWNER,
      repo: REPO,
      branch: "main",
    });
    
    // Try to compare the commit with main
    try {
      const compareResult = await octokit.repos.compareCommits({
        owner: OWNER,
        repo: REPO,
        base: sha,
        head: "main",
      });
      
      // If we can compare and the commit is behind or equal to main, it's in history
      return compareResult.data.status === "ahead" || compareResult.data.status === "identical";
    } catch {
      // If comparison fails, try to get the commit directly
      try {
        await octokit.repos.getCommit({
          owner: OWNER,
          repo: REPO,
          ref: sha,
        });
        return true;
      } catch {
        return false;
      }
    }
  } catch (error) {
    console.error(`  Error checking commit ${sha} in main history:`, error);
    return false;
  }
}

async function getPRStatus(prNumber: number): Promise<PRStatus> {
  try {
    const { data: pr } = await octokit.pulls.get({
      owner: OWNER,
      repo: REPO,
      pull_number: prNumber,
    });

    let inMainHistory: boolean | null = null;
    let notes = "";
    let status: PRStatus["status"];

    if (pr.state === "open") {
      status = "open";
      notes = "PR is still open";
    } else if (pr.merged) {
      status = "merged";
      // Check if merge commit is in main history
      if (pr.merge_commit_sha) {
        inMainHistory = await checkCommitInMainHistory(pr.merge_commit_sha);
        notes = inMainHistory 
          ? "Merge commit found in main history" 
          : "⚠️ Merge commit NOT found in main history";
      } else {
        notes = "⚠️ No merge commit SHA available";
      }
    } else {
      status = "closed-without-merge";
      notes = "⚠️ PR was closed without merging";
    }

    return {
      number: prNumber,
      title: pr.title,
      state: pr.state,
      merged: pr.merged ?? false,
      mergedAt: pr.merged_at,
      mergeCommitSha: pr.merge_commit_sha,
      headSha: pr.head.sha,
      baseBranch: pr.base.ref,
      url: pr.html_url,
      author: pr.user?.login ?? "unknown",
      createdAt: pr.created_at,
      closedAt: pr.closed_at,
      inMainHistory,
      status,
      notes,
    };
  } catch (error: any) {
    if (error.status === 404) {
      return {
        number: prNumber,
        title: "N/A",
        state: "not-found",
        merged: false,
        mergedAt: null,
        mergeCommitSha: null,
        headSha: null,
        baseBranch: "N/A",
        url: `https://github.com/${OWNER}/${REPO}/pull/${prNumber}`,
        author: "N/A",
        createdAt: "N/A",
        closedAt: null,
        inMainHistory: null,
        status: "not-found",
        notes: "PR does not exist",
      };
    }
    throw error;
  }
}

function generateMarkdownReport(results: PRStatus[]): string {
  const timestamp = new Date().toISOString();
  
  const merged = results.filter(r => r.status === "merged");
  const closedWithoutMerge = results.filter(r => r.status === "closed-without-merge");
  const open = results.filter(r => r.status === "open");
  const notFound = results.filter(r => r.status === "not-found");
  const notInMainHistory = merged.filter(r => r.inMainHistory === false);
  
  let report = `# PR Merge Audit Report\n\n`;
  report += `**Repository:** ${OWNER}/${REPO}\n`;
  report += `**Report Generated:** ${timestamp}\n`;
  report += `**PR Range Audited:** #${START_PR} - #${END_PR}\n\n`;
  
  report += `## Summary\n\n`;
  report += `- **Total PRs Audited:** ${results.length}\n`;
  report += `- **Merged:** ${merged.length}\n`;
  report += `- **Closed Without Merge:** ${closedWithoutMerge.length}\n`;
  report += `- **Open:** ${open.length}\n`;
  report += `- **Not Found:** ${notFound.length}\n`;
  report += `- **Merged but NOT in Main History:** ${notInMainHistory.length} ⚠️\n\n`;
  
  // Discrepancies Section
  if (closedWithoutMerge.length > 0 || notInMainHistory.length > 0 || open.length > 0) {
    report += `## ⚠️ Discrepancies Found\n\n`;
    
    if (closedWithoutMerge.length > 0) {
      report += `### Closed Without Merge (${closedWithoutMerge.length})\n\n`;
      report += `These PRs were closed but never merged:\n\n`;
      for (const pr of closedWithoutMerge) {
        report += `- **PR #${pr.number}**: ${pr.title}\n`;
        report += `  - Author: @${pr.author}\n`;
        report += `  - Closed: ${pr.closedAt}\n`;
        report += `  - URL: ${pr.url}\n`;
        report += `  - Action: Review if changes should be re-implemented\n\n`;
      }
    }
    
    if (notInMainHistory.length > 0) {
      report += `### Merged but NOT in Main History (${notInMainHistory.length})\n\n`;
      report += `These PRs show as merged but their merge commit is not found in main branch:\n\n`;
      for (const pr of notInMainHistory) {
        report += `- **PR #${pr.number}**: ${pr.title}\n`;
        report += `  - Author: @${pr.author}\n`;
        report += `  - Merge Commit: ${pr.mergeCommitSha}\n`;
        report += `  - Merged At: ${pr.mergedAt}\n`;
        report += `  - URL: ${pr.url}\n`;
        report += `  - Action: Investigate if changes are in main through different commits\n\n`;
      }
    }
    
    if (open.length > 0) {
      report += `### Still Open (${open.length})\n\n`;
      for (const pr of open) {
        report += `- **PR #${pr.number}**: ${pr.title}\n`;
        report += `  - Author: @${pr.author}\n`;
        report += `  - Created: ${pr.createdAt}\n`;
        report += `  - URL: ${pr.url}\n\n`;
      }
    }
  } else {
    report += `## ✅ No Discrepancies Found\n\n`;
    report += `All closed PRs (#${START_PR}-#${END_PR}) are properly merged into main branch.\n\n`;
  }
  
  // Full PR List
  report += `## Complete PR List\n\n`;
  report += `| PR # | Title | Status | Merged | In Main | Author | Notes |\n`;
  report += `|------|-------|--------|--------|---------|--------|-------|\n`;
  
  for (const pr of results) {
    const statusIcon = 
      pr.status === "merged" && pr.inMainHistory ? "✅" :
      pr.status === "merged" && pr.inMainHistory === false ? "⚠️" :
      pr.status === "closed-without-merge" ? "❌" :
      pr.status === "open" ? "🔄" : "❓";
    
    const mergedText = pr.merged ? "Yes" : "No";
    const inMainText = 
      pr.inMainHistory === true ? "Yes" :
      pr.inMainHistory === false ? "No" : "N/A";
    
    report += `| ${statusIcon} [#${pr.number}](${pr.url}) | ${pr.title} | ${pr.state} | ${mergedText} | ${inMainText} | @${pr.author} | ${pr.notes} |\n`;
  }
  
  report += `\n## Actionable Steps\n\n`;
  
  if (closedWithoutMerge.length > 0) {
    report += `### For Closed Without Merge PRs:\n`;
    report += `1. Review each PR to determine if the changes are still needed\n`;
    report += `2. If changes are needed, create a new PR with the updates\n`;
    report += `3. If changes are not needed, document the reason for closure\n\n`;
  }
  
  if (notInMainHistory.length > 0) {
    report += `### For Merged but Not in Main History PRs:\n`;
    report += `1. Investigate if changes were included via different commits (rebases, cherry-picks)\n`;
    report += `2. Use \`git log --all --grep="PR #<number>"\` to search for PR references\n`;
    report += `3. If changes are missing, create a new PR to re-implement them\n\n`;
  }
  
  report += `---\n\n`;
  report += `*This report was automatically generated by \`scripts/audit-pr-merges.ts\`*\n`;
  
  return report;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run(): Promise<void> {
  console.log(`\n🔍 PR Merge Audit — ${OWNER}/${REPO}\n`);
  console.log(`Auditing PRs #${START_PR} to #${END_PR}...\n`);
  
  const results: PRStatus[] = [];
  
  for (let prNumber = START_PR; prNumber <= END_PR; prNumber++) {
    process.stdout.write(`Checking PR #${prNumber}... `);
    
    try {
      const status = await getPRStatus(prNumber);
      results.push(status);
      
      const icon = 
        status.status === "merged" && status.inMainHistory ? "✅" :
        status.status === "merged" && status.inMainHistory === false ? "⚠️" :
        status.status === "closed-without-merge" ? "❌" :
        status.status === "open" ? "🔄" : "❓";
      
      console.log(`${icon} ${status.status}`);
      
      // Rate limiting: GitHub API allows 5000 requests/hour for authenticated users
      // Add small delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`\n  Error processing PR #${prNumber}:`, error);
    }
  }
  
  console.log(`\n📊 Generating report...\n`);
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const report = generateMarkdownReport(results);
  const outputPath = path.join(OUTPUT_DIR, OUTPUT_FILE);
  
  fs.writeFileSync(outputPath, report, "utf-8");
  
  console.log(`✅ Report saved to: ${outputPath}\n`);
  
  // Print summary
  const merged = results.filter(r => r.status === "merged");
  const closedWithoutMerge = results.filter(r => r.status === "closed-without-merge");
  const notInMainHistory = merged.filter(r => r.inMainHistory === false);
  
  console.log(`Summary:`);
  console.log(`  - Total PRs: ${results.length}`);
  console.log(`  - Merged: ${merged.length}`);
  console.log(`  - Closed Without Merge: ${closedWithoutMerge.length}`);
  console.log(`  - Merged but NOT in Main: ${notInMainHistory.length}`);
  
  if (closedWithoutMerge.length > 0 || notInMainHistory.length > 0) {
    console.log(`\n⚠️  Discrepancies found! Review ${outputPath} for details.\n`);
    process.exit(1);
  } else {
    console.log(`\n✅ No discrepancies found. All closed PRs are properly merged.\n`);
  }
}

run().catch((err) => {
  console.error("PR Merge Audit failed:", err);
  process.exit(1);
});
