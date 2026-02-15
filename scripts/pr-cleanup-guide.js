#!/usr/bin/env node

/**
 * PR Cleanup Guide Generator
 * 
 * This script generates a comprehensive guide for cleaning up stale PRs.
 * It provides instructions and recommendations based on PR analysis.
 */

const fs = require('fs');
const path = require('path');

// All PRs from the issue
const ALL_PRS = [
  { number: 47, title: "[WIP] Consolidate middleware to resolve Vercel deployment conflicts", draft: true },
  { number: 46, title: "feat: Biometric Authentication (Passkeys)", draft: true },
  { number: 45, title: "No changes required - clarification on access question", draft: true },
  { number: 44, title: "Consolidate middleware to resolve Vercel deployment conflicts", draft: true },
  { number: 43, title: "Add environment variable fallback patterns for Vercel production compatibility", draft: true },
  { number: 42, title: "Add design toggle system with admin dashboard and env var fallback support", draft: true },
  { number: 41, title: "Add Spark AI comparison document", draft: true },
  { number: 40, title: "Merge critical features from merge-all-features: AI providers, experiments, WebRTC, browser automation", draft: true },
  { number: 39, title: "Fix critical production 404s: auth, dashboard, health API, and admin timeout", draft: true },
  { number: 38, title: "Implement CQ-to-CQ communication system with voice message delivery", draft: true },
  { number: 37, title: "fix(landing): Set Particle Scene as main landing page", draft: false },
  { number: 36, title: "feat(ui): Add AI model footer to landing page", draft: false },
  { number: 35, title: "fix(auth): Enable session persistence on API routes", draft: false },
  { number: 34, title: "Fix voice conversations: remove OpenAI/Emergent, implement new provider chain with classification", draft: false, merged: true, mergedAt: "2026-02-15T15:34:09Z" },
  { number: 33, title: "[WIP] Investigate why the voice conversation with Cubiqo is not working", draft: true },
  { number: 31, title: "Merge all open PRs to main: resolve conflicts, consolidate features, secure admin routes", draft: true },
  { number: 30, title: "PR-Triage agent: convert Draft PRs to Ready for Review when all checks pass", draft: false },
  { number: 29, title: "Upgrade design system to Apple-grade premium, force-apply globally", draft: false },
  { number: 28, title: "Centralize auth state with context provider pattern", draft: false },
  { number: 27, title: "Add configurable FROM/TO email addresses for self-heal reports", draft: false },
  { number: 25, title: "Add Gmail/Outlook quick-access buttons with analytics tracking", draft: false },
  { number: 22, title: "Add user-facing Journey Memory opt-in prompt when feature is enabled", draft: false },
  { number: 21, title: "Add agent registry enhancements, onboarding flow, and marketing agent template", draft: false },
  { number: 20, title: "Clarify PR #20 vs #27: competing implementations, not duplicates", draft: false },
  { number: 17, title: "fix(auth): reactive session UI via AuthProvider and AuthButton client component", draft: false },
  { number: 15, title: "feat: Founders Pass admin portal — feature flags, sites, OAuth integrations, actions cards", draft: false },
  { number: 14, title: "Add client-side rate limiting for magic-link authentication", draft: false },
];

function categorizePRs() {
  // Categorization priority order (checked in sequence):
  // 1. Confirmed merged PRs
  // 2. Documentation/clarification PRs
  // 3. Superseded PRs
  // 4. Draft PRs
  // 5. Ready PRs (default)
  
  const categories = {
    confirmed_merged: [],
    likely_superseded: [],
    documentation_only: [],
    drafts_needing_review: [],
    ready_prs: [],
    clarification_needed: [],
  };

  // Latest active PR number for middleware consolidation
  const CURRENT_MIDDLEWARE_PR = 47;

  ALL_PRS.forEach(pr => {
    // Confirmed merged
    if (pr.merged) {
      categories.confirmed_merged.push(pr);
      return;
    }

    // Documentation/clarification PRs (non-draft only for quick review)
    if (!pr.draft && (pr.title.includes('clarification') || pr.title.includes('Clarify'))) {
      categories.clarification_needed.push(pr);
      return;
    }

    if (!pr.draft && (pr.title.includes('document') || pr.title.includes('comparison document'))) {
      categories.documentation_only.push(pr);
      return;
    }

    // Superseded PRs (multiple PRs addressing same thing)
    if (pr.title.includes('Consolidate middleware') && pr.number !== CURRENT_MIDDLEWARE_PR) {
      categories.likely_superseded.push({ ...pr, reason: `Superseded by PR #${CURRENT_MIDDLEWARE_PR}` });
      return;
    }

    // Voice-related (superseded by #34 which is merged)
    if (pr.number === 33 && pr.title.includes('voice conversation')) {
      categories.likely_superseded.push({ ...pr, reason: 'Likely superseded by merged PR #34' });
      return;
    }

    // Merge-all type PRs (likely superseded by actual merges)
    if (pr.title.includes('Merge all') || pr.title.includes('merge-all')) {
      categories.likely_superseded.push({ ...pr, reason: 'Consolidation PR - features likely merged individually' });
      return;
    }

    // Drafts
    if (pr.draft) {
      categories.drafts_needing_review.push(pr);
      return;
    }

    // Ready PRs (not draft, not merged)
    categories.ready_prs.push(pr);
  });

  return categories;
}

function generateMarkdownGuide() {
  const categories = categorizePRs();
  
  const markdown = `# Pull Request Cleanup Guide

**Generated:** ${new Date().toISOString()}  
**Purpose:** Clean up 27 open PRs to improve repository hygiene

## Executive Summary

- **Total open PRs:** ${ALL_PRS.length}
- **Confirmed merged (should close):** ${categories.confirmed_merged.length}
- **Likely superseded (review & close):** ${categories.likely_superseded.length}
- **Documentation/clarification PRs:** ${categories.documentation_only.length}
- **Draft PRs needing review:** ${categories.drafts_needing_review.length}
- **Ready PRs (non-draft):** ${categories.ready_prs.length}

## 🔴 Priority 1: Close Confirmed Merged PRs

These PRs are already merged into main but still showing as open:

${categories.confirmed_merged.length > 0 ? 
  categories.confirmed_merged.map(pr => `### PR #${pr.number}: ${pr.title}

- **Status:** ✅ Merged on ${pr.mergedAt}
- **Action:** Close immediately
- **Comment to add:** "This PR was successfully merged and is now showing incorrectly as open. Closing to clean up the PR list."

[View PR #${pr.number}](https://github.com/thecubiqo/thecubiqo/pull/${pr.number})`).join('\n\n') 
  : 'None identified (but check GitHub UI for merged status)'
}

## 🟡 Priority 2: Review and Close Likely Superseded PRs

These PRs appear to be superseded by other work or are consolidation PRs:

${categories.likely_superseded.map(pr => `### PR #${pr.number}: ${pr.title}

- **Reason:** ${pr.reason}
- **Action:** Review and likely close
- **Steps:**
  1. Check if the feature/fix was implemented elsewhere
  2. If superseded, close with comment explaining which PR replaced it
  3. If still relevant, update the PR or merge it

[View PR #${pr.number}](https://github.com/thecubiqo/thecubiqo/pull/${pr.number})`).join('\n\n')}

## 📄 Priority 3: Documentation and Clarification PRs

${categories.documentation_only.length > 0 || categories.clarification_needed.length > 0 ?
  [...categories.documentation_only, ...categories.clarification_needed].map(pr => `### PR #${pr.number}: ${pr.title}

- **Type:** ${pr.title.includes('Clarify') ? 'Clarification' : 'Documentation'}
- **Action:** Review content, merge if valuable, otherwise close
- **Note:** Documentation PRs should be quick to review and merge or close

[View PR #${pr.number}](https://github.com/thecubiqo/thecubiqo/pull/${pr.number})`).join('\n\n')
  : 'None identified'
}

## 🔵 Priority 4: Review Draft PRs

These ${categories.drafts_needing_review.length} PRs are marked as drafts. Review each to determine if they should be:
- Completed and marked ready for review
- Closed as no longer needed
- Kept as draft for future work

${categories.drafts_needing_review.map(pr => `- [ ] [PR #${pr.number}](https://github.com/thecubiqo/thecubiqo/pull/${pr.number}): ${pr.title}`).join('\n')}

## ✅ Priority 5: Review Ready (Non-Draft) PRs

These ${categories.ready_prs.length} PRs are marked as ready for review. They should be:
- Reviewed and merged if approved
- Closed if no longer needed
- Converted back to draft if more work is needed

${categories.ready_prs.map(pr => `- [ ] [PR #${pr.number}](https://github.com/thecubiqo/thecubiqo/pull/${pr.number}): ${pr.title}`).join('\n')}

## How to Close PRs

Since this script cannot close PRs via API, follow these manual steps:

### For Each PR to Close:

1. **Navigate to the PR:**
   - Go to https://github.com/thecubiqo/thecubiqo/pull/[NUMBER]

2. **Verify it should be closed:**
   - Check if it's merged (look for "Merged" badge)
   - Check if it's superseded by another PR
   - Check if the feature is already implemented

3. **Add a closing comment:**
   \`\`\`
   This PR is being closed as part of repository cleanup. 
   [Reason: Already merged / Superseded by #X / No longer needed]
   \`\`\`

4. **Click "Close pull request"**

5. **Update your tracking:** Check off the PR in this guide

## Automation Recommendations

To prevent this from happening again, consider:

### 1. GitHub Actions Workflow for Auto-Closing Merged PRs

\`\`\`yaml
name: Close Merged PRs
on:
  pull_request:
    types: [closed]
  schedule:
    - cron: '0 0 * * *'  # Daily

jobs:
  close-merged:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v7
        with:
          script: |
            const { data: prs } = await github.rest.pulls.list({
              owner: context.repo.owner,
              repo: context.repo.repo,
              state: 'open'
            });
            
            for (const pr of prs) {
              if (pr.merged_at) {
                await github.rest.pulls.update({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  pull_number: pr.number,
                  state: 'closed'
                });
                
                await github.rest.issues.createComment({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  issue_number: pr.number,
                  body: 'Automatically closing merged PR.'
                });
              }
            }
\`\`\`

### 2. Stale PR Management

Install and configure the [Stale Bot](https://github.com/marketplace/stale):

- Mark PRs as stale after 60 days of inactivity
- Close stale PRs after 7 more days
- Allow exemptions via labels

### 3. PR Lifecycle Labels

Create labels to track PR status:
- \`status:waiting-review\`
- \`status:changes-requested\`
- \`status:approved\`
- \`status:superseded\`
- \`status:wont-fix\`

## Quick Stats

\`\`\`
Total PRs to process:        ${ALL_PRS.length}
├─ Confirmed merged:         ${categories.confirmed_merged.length}
├─ Likely superseded:        ${categories.likely_superseded.length}
├─ Documentation:            ${categories.documentation_only.length + categories.clarification_needed.length}
├─ Draft PRs:                ${categories.drafts_needing_review.length}
└─ Ready PRs:                ${categories.ready_prs.length}
\`\`\`

## Checklist for Maintainer

- [ ] Review Priority 1: Close confirmed merged PRs
- [ ] Review Priority 2: Close superseded PRs
- [ ] Review Priority 3: Handle documentation PRs
- [ ] Review Priority 4: Triage draft PRs
- [ ] Review Priority 5: Review ready PRs
- [ ] Set up automation (optional)
- [ ] Document PR lifecycle process

---

**Note:** This guide was generated by an automated script. Always verify PR status on GitHub before closing.
`;

  return markdown;
}

function main() {
  console.log('Generating PR Cleanup Guide...\n');
  
  const markdown = generateMarkdownGuide();
  const outputPath = path.join(__dirname, '..', 'PR_CLEANUP_GUIDE.md');
  
  fs.writeFileSync(outputPath, markdown);
  
  console.log(`✅ Guide generated successfully!`);
  console.log(`📄 Location: ${outputPath}`);
  console.log('\nNext steps:');
  console.log('1. Review the guide: cat PR_CLEANUP_GUIDE.md');
  console.log('2. Follow the priorities outlined in the guide');
  console.log('3. Close PRs via GitHub UI as recommended\n');
  
  // Print summary
  const categories = categorizePRs();
  console.log('Summary:');
  console.log(`  Confirmed merged:    ${categories.confirmed_merged.length}`);
  console.log(`  Likely superseded:   ${categories.likely_superseded.length}`);
  console.log(`  Documentation:       ${categories.documentation_only.length + categories.clarification_needed.length}`);
  console.log(`  Draft PRs:           ${categories.drafts_needing_review.length}`);
  console.log(`  Ready PRs:           ${categories.ready_prs.length}`);
  console.log(`  TOTAL:               ${ALL_PRS.length}\n`);
}

main();
