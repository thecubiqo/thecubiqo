/**
 * PR-Triage Agent
 *
 * Lists all Draft PRs and evaluates each against five readiness checks:
 *   1. No WIP label
 *   2. CI checks green (lint / typecheck / tests / build)
 *   3. No merge conflicts
 *   4. At least one reviewer assigned
 *   5. PR description contains "AUTO_CONVERT_OK"
 *
 * Posts a comment on each PR summarizing pass/fail.
 * When all checks pass, converts the Draft PR to "Ready for Review".
 * Pass --dry-run to only report without converting.
 */

import { Octokit } from "@octokit/rest";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

interface TriageResult {
  prNumber: number;
  prTitle: string;
  prUrl: string;
  checks: CheckResult[];
  wouldConvert: boolean;
  converted: boolean;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.error("Error: GITHUB_TOKEN environment variable is required.");
  process.exit(1);
}

const OWNER = process.env.PR_TRIAGE_OWNER ?? "thecubiqo";
const REPO = process.env.PR_TRIAGE_REPO ?? "thecubiqo";

const octokit = new Octokit({ auth: GITHUB_TOKEN });

const DRY_RUN = process.argv.includes("--dry-run");

// ---------------------------------------------------------------------------
// Convert Draft → Ready for Review (GraphQL mutation)
// ---------------------------------------------------------------------------

async function markReadyForReview(pullRequestNodeId: string): Promise<void> {
  await octokit.graphql(
    `mutation($id: ID!) {
      markPullRequestReadyForReview(input: { pullRequestId: $id }) {
        pullRequest { id }
      }
    }`,
    { id: pullRequestNodeId }
  );
}

// ---------------------------------------------------------------------------
// Individual checks
// ---------------------------------------------------------------------------

function checkNoWipLabel(labels: { name: string }[]): CheckResult {
  const hasWip = labels.some(
    (l) => l.name.toLowerCase() === "wip"
  );
  return {
    name: "No WIP label",
    passed: !hasWip,
    detail: hasWip ? "PR has a WIP label" : "No WIP label found",
  };
}

async function checkCiGreen(
  owner: string,
  repo: string,
  ref: string
): Promise<CheckResult> {
  try {
    const { data: combined } = await octokit.repos.getCombinedStatusForRef({
      owner,
      repo,
      ref,
    });

    const { data: checkRuns } = await octokit.checks.listForRef({
      owner,
      repo,
      ref,
      per_page: 100,
    });

    // Collect all statuses
    const statusPassed =
      combined.state === "success" || combined.statuses.length === 0;

    const checkRunsPassed = checkRuns.check_runs.every(
      (cr) => cr.conclusion === "success" || cr.conclusion === "skipped"
    );

    const allGreen = statusPassed && checkRunsPassed;

    const failedChecks = [
      ...combined.statuses
        .filter((s) => s.state !== "success")
        .map((s) => s.context),
      ...checkRuns.check_runs
        .filter(
          (cr) => cr.conclusion !== "success" && cr.conclusion !== "skipped"
        )
        .map((cr) => cr.name),
    ];

    return {
      name: "CI checks green",
      passed: allGreen,
      detail: allGreen
        ? "All CI checks passed"
        : `Failed/pending checks: ${failedChecks.join(", ") || combined.state}`,
    };
  } catch {
    return {
      name: "CI checks green",
      passed: false,
      detail: "Unable to retrieve CI status",
    };
  }
}

function checkNoMergeConflicts(mergeable: boolean | null): CheckResult {
  if (mergeable === null) {
    return {
      name: "No merge conflicts",
      passed: false,
      detail: "Mergeability unknown (GitHub is still computing)",
    };
  }
  return {
    name: "No merge conflicts",
    passed: mergeable,
    detail: mergeable ? "No merge conflicts" : "PR has merge conflicts",
  };
}

function checkReviewerAssigned(
  requestedReviewers: unknown[],
  requestedTeams: unknown[]
): CheckResult {
  const hasReviewer =
    requestedReviewers.length > 0 || requestedTeams.length > 0;
  return {
    name: "Reviewer assigned",
    passed: hasReviewer,
    detail: hasReviewer
      ? `${requestedReviewers.length + requestedTeams.length} reviewer(s) assigned`
      : "No reviewers assigned",
  };
}

function checkAutoConvertMarker(body: string | null): CheckResult {
  const hasMarker = !!body && body.includes("AUTO_CONVERT_OK");
  return {
    name: "AUTO_CONVERT_OK in description",
    passed: hasMarker,
    detail: hasMarker
      ? "Marker found in PR description"
      : "AUTO_CONVERT_OK not found in PR description",
  };
}

// ---------------------------------------------------------------------------
// Comment formatting
// ---------------------------------------------------------------------------

function formatComment(results: CheckResult[], dryRun: boolean): string {
  const modeLabel = dryRun ? "Dry-Run Report" : "Triage Report";
  const lines: string[] = [
    `## 🤖 PR-Triage Agent — ${modeLabel}`,
    "",
  ];

  const allPassed = results.every((r) => r.passed);

  for (const r of results) {
    const icon = r.passed ? "✅" : "❌";
    lines.push(`${icon} **${r.name}**: ${r.detail}`);
  }

  lines.push("");

  if (allPassed && !dryRun) {
    lines.push(
      "**Result**: All checks passed — this PR has been **converted from Draft to Ready for Review**. 🎉"
    );
  } else if (allPassed && dryRun) {
    lines.push(
      "**Result**: All checks passed — this PR **would be converted** from Draft to Ready for Review."
    );
  } else {
    lines.push(
      "**Result**: One or more checks failed — this PR would **not** be converted."
    );
  }

  if (dryRun) {
    lines.push("");
    lines.push("_ℹ️ This is a dry-run. No changes were made to the PR._");
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run(): Promise<void> {
  const operationMode = DRY_RUN ? "dry-run" : "active";
  console.log(`\n🔍 PR-Triage Agent (${operationMode}) — ${OWNER}/${REPO}\n`);

  // 1. Fetch all open Draft PRs
  const { data: pullRequests } = await octokit.pulls.list({
    owner: OWNER,
    repo: REPO,
    state: "open",
    per_page: 100,
  });

  const draftPrs = pullRequests.filter((pr) => pr.draft);

  if (draftPrs.length === 0) {
    console.log("No Draft PRs found. Nothing to triage.");
    return;
  }

  console.log(`Found ${draftPrs.length} Draft PR(s).\n`);

  const triageResults: TriageResult[] = [];

  for (const pr of draftPrs) {
    console.log(`── PR #${pr.number}: ${pr.title}`);

    // Fetch full PR details (for mergeable status)
    const { data: fullPr } = await octokit.pulls.get({
      owner: OWNER,
      repo: REPO,
      pull_number: pr.number,
    });

    const checks: CheckResult[] = [
      checkNoWipLabel(fullPr.labels.map((l) => ({ name: l.name ?? "" }))),
      await checkCiGreen(OWNER, REPO, fullPr.head.sha),
      checkNoMergeConflicts(fullPr.mergeable),
      checkReviewerAssigned(
        fullPr.requested_reviewers ?? [],
        fullPr.requested_teams ?? []
      ),
      checkAutoConvertMarker(fullPr.body),
    ];

    const wouldConvert = checks.every((c) => c.passed);
    let converted = false;

    // Convert Draft → Ready for Review when all checks pass (unless dry-run)
    if (wouldConvert && !DRY_RUN) {
      try {
        await markReadyForReview(fullPr.node_id);
        converted = true;
        console.log("   ✅ Converted to Ready for Review.");
      } catch (conversionError) {
        console.error("   ⚠️  Failed to convert PR:", conversionError);
      }
    }

    triageResults.push({
      prNumber: pr.number,
      prTitle: pr.title,
      prUrl: fullPr.html_url,
      checks,
      wouldConvert,
      converted,
    });

    // Post comment on the PR
    const comment = formatComment(checks, DRY_RUN);
    await octokit.issues.createComment({
      owner: OWNER,
      repo: REPO,
      issue_number: pr.number,
      body: comment,
    });

    console.log("   Comment posted.\n");
  }

  // ---------------------------------------------------------------------------
  // Final summary
  // ---------------------------------------------------------------------------

  console.log("═══════════════════════════════════════════════════════");
  console.log(`  PR-Triage ${DRY_RUN ? "Dry-Run " : ""}Summary`);
  console.log("═══════════════════════════════════════════════════════\n");

  const convertible = triageResults.filter((r) => r.wouldConvert);
  const notConvertible = triageResults.filter((r) => !r.wouldConvert);

  if (convertible.length > 0) {
    const verb = DRY_RUN ? "WOULD be converted" : "converted to Ready for Review";
    console.log(`PRs ${verb}:\n`);
    for (const r of convertible) {
      const icon = r.converted ? "🎉" : "✅";
      console.log(`  ${icon} #${r.prNumber} — ${r.prTitle}`);
      console.log(`     ${r.prUrl}`);
      console.log(
        `     Reason: all ${r.checks.length} checks passed`
      );
    }
    console.log();
  }

  if (notConvertible.length > 0) {
    console.log("PRs that would NOT be converted:\n");
    for (const r of notConvertible) {
      const failures = r.checks.filter((c) => !c.passed);
      console.log(`  ❌ #${r.prNumber} — ${r.prTitle}`);
      console.log(`     ${r.prUrl}`);
      console.log(
        `     Failed: ${failures.map((f) => f.name).join(", ")}`
      );
    }
    console.log();
  }

  const convertedCount = triageResults.filter((r) => r.converted).length;

  if (DRY_RUN) {
    console.log(
      `Total: ${triageResults.length} Draft PR(s), ${convertible.length} would convert, ${notConvertible.length} would not.\n`
    );
    console.log("ℹ️  Dry-run complete. No PRs were converted.\n");
  } else {
    console.log(
      `Total: ${triageResults.length} Draft PR(s), ${convertedCount} converted, ${notConvertible.length} not converted.\n`
    );
  }
}

run().catch((err) => {
  console.error("PR-Triage Agent failed:", err);
  process.exit(1);
});
