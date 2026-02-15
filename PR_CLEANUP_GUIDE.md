# Pull Request Cleanup Guide

**Generated:** 2026-02-15T17:28:37.480Z  
**Purpose:** Clean up 27 open PRs to improve repository hygiene

## Executive Summary

- **Total open PRs:** 27
- **Confirmed merged (should close):** 1
- **Likely superseded (review & close):** 4
- **Documentation/clarification PRs:** 0
- **Draft PRs needing review:** 8
- **Ready PRs (non-draft):** 13

## 🔴 Priority 1: Close Confirmed Merged PRs

These PRs are already merged into main but still showing as open:

### PR #34: Fix voice conversations: remove OpenAI/Emergent, implement new provider chain with classification

- **Status:** ✅ Merged on 2026-02-15T15:34:09Z
- **Action:** Close immediately
- **Comment to add:** "This PR was successfully merged and is now showing incorrectly as open. Closing to clean up the PR list."

[View PR #34](https://github.com/thecubiqo/thecubiqo/pull/34)

## 🟡 Priority 2: Review and Close Likely Superseded PRs

These PRs appear to be superseded by other work or are consolidation PRs:

### PR #44: Consolidate middleware to resolve Vercel deployment conflicts

- **Reason:** Superseded by PR #47
- **Action:** Review and likely close
- **Steps:**
  1. Check if the feature/fix was implemented elsewhere
  2. If superseded, close with comment explaining which PR replaced it
  3. If still relevant, update the PR or merge it

[View PR #44](https://github.com/thecubiqo/thecubiqo/pull/44)

### PR #40: Merge critical features from merge-all-features: AI providers, experiments, WebRTC, browser automation

- **Reason:** Consolidation PR - features likely merged individually
- **Action:** Review and likely close
- **Steps:**
  1. Check if the feature/fix was implemented elsewhere
  2. If superseded, close with comment explaining which PR replaced it
  3. If still relevant, update the PR or merge it

[View PR #40](https://github.com/thecubiqo/thecubiqo/pull/40)

### PR #33: [WIP] Investigate why the voice conversation with Cubiqo is not working

- **Reason:** Likely superseded by merged PR #34
- **Action:** Review and likely close
- **Steps:**
  1. Check if the feature/fix was implemented elsewhere
  2. If superseded, close with comment explaining which PR replaced it
  3. If still relevant, update the PR or merge it

[View PR #33](https://github.com/thecubiqo/thecubiqo/pull/33)

### PR #31: Merge all open PRs to main: resolve conflicts, consolidate features, secure admin routes

- **Reason:** Consolidation PR - features likely merged individually
- **Action:** Review and likely close
- **Steps:**
  1. Check if the feature/fix was implemented elsewhere
  2. If superseded, close with comment explaining which PR replaced it
  3. If still relevant, update the PR or merge it

[View PR #31](https://github.com/thecubiqo/thecubiqo/pull/31)

## 📄 Priority 3: Documentation and Clarification PRs

### PR #20: Clarify PR #20 vs #27: competing implementations, not duplicates

- **Type:** Clarification
- **Action:** Review content, merge if valuable, otherwise close
- **Note:** Documentation PRs should be quick to review and merge or close

[View PR #20](https://github.com/thecubiqo/thecubiqo/pull/20)

## 🔵 Priority 4: Review Draft PRs

These 8 PRs are marked as drafts. Review each to determine if they should be:
- Completed and marked ready for review
- Closed as no longer needed
- Kept as draft for future work

- [ ] [PR #47](https://github.com/thecubiqo/thecubiqo/pull/47): [WIP] Consolidate middleware to resolve Vercel deployment conflicts
- [ ] [PR #46](https://github.com/thecubiqo/thecubiqo/pull/46): feat: Biometric Authentication (Passkeys)
- [ ] [PR #45](https://github.com/thecubiqo/thecubiqo/pull/45): No changes required - clarification on access question
- [ ] [PR #43](https://github.com/thecubiqo/thecubiqo/pull/43): Add environment variable fallback patterns for Vercel production compatibility
- [ ] [PR #42](https://github.com/thecubiqo/thecubiqo/pull/42): Add design toggle system with admin dashboard and env var fallback support
- [ ] [PR #41](https://github.com/thecubiqo/thecubiqo/pull/41): Add Spark AI comparison document
- [ ] [PR #39](https://github.com/thecubiqo/thecubiqo/pull/39): Fix critical production 404s: auth, dashboard, health API, and admin timeout
- [ ] [PR #38](https://github.com/thecubiqo/thecubiqo/pull/38): Implement CQ-to-CQ communication system with voice message delivery

## ✅ Priority 5: Review Ready (Non-Draft) PRs

These 13 PRs are marked as ready for review. They should be:
- Reviewed and merged if approved
- Closed if no longer needed
- Converted back to draft if more work is needed

- [ ] [PR #37](https://github.com/thecubiqo/thecubiqo/pull/37): fix(landing): Set Particle Scene as main landing page
- [ ] [PR #36](https://github.com/thecubiqo/thecubiqo/pull/36): feat(ui): Add AI model footer to landing page
- [ ] [PR #35](https://github.com/thecubiqo/thecubiqo/pull/35): fix(auth): Enable session persistence on API routes
- [ ] [PR #30](https://github.com/thecubiqo/thecubiqo/pull/30): PR-Triage agent: convert Draft PRs to Ready for Review when all checks pass
- [ ] [PR #29](https://github.com/thecubiqo/thecubiqo/pull/29): Upgrade design system to Apple-grade premium, force-apply globally
- [ ] [PR #28](https://github.com/thecubiqo/thecubiqo/pull/28): Centralize auth state with context provider pattern
- [ ] [PR #27](https://github.com/thecubiqo/thecubiqo/pull/27): Add configurable FROM/TO email addresses for self-heal reports
- [ ] [PR #25](https://github.com/thecubiqo/thecubiqo/pull/25): Add Gmail/Outlook quick-access buttons with analytics tracking
- [ ] [PR #22](https://github.com/thecubiqo/thecubiqo/pull/22): Add user-facing Journey Memory opt-in prompt when feature is enabled
- [ ] [PR #21](https://github.com/thecubiqo/thecubiqo/pull/21): Add agent registry enhancements, onboarding flow, and marketing agent template
- [ ] [PR #17](https://github.com/thecubiqo/thecubiqo/pull/17): fix(auth): reactive session UI via AuthProvider and AuthButton client component
- [ ] [PR #15](https://github.com/thecubiqo/thecubiqo/pull/15): feat: Founders Pass admin portal — feature flags, sites, OAuth integrations, actions cards
- [ ] [PR #14](https://github.com/thecubiqo/thecubiqo/pull/14): Add client-side rate limiting for magic-link authentication

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
   ```
   This PR is being closed as part of repository cleanup. 
   [Reason: Already merged / Superseded by #X / No longer needed]
   ```

4. **Click "Close pull request"**

5. **Update your tracking:** Check off the PR in this guide

## Automation Recommendations

To prevent this from happening again, consider:

### 1. GitHub Actions Workflow for Auto-Closing Merged PRs

```yaml
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
```

### 2. Stale PR Management

Install and configure the [Stale Bot](https://github.com/marketplace/stale):

- Mark PRs as stale after 60 days of inactivity
- Close stale PRs after 7 more days
- Allow exemptions via labels

### 3. PR Lifecycle Labels

Create labels to track PR status:
- `status:waiting-review`
- `status:changes-requested`
- `status:approved`
- `status:superseded`
- `status:wont-fix`

## Quick Stats

```
Total PRs to process:        27
├─ Confirmed merged:         1
├─ Likely superseded:        4
├─ Documentation:            1
├─ Draft PRs:                8
└─ Ready PRs:                13
```

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
