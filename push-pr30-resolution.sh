#!/bin/bash
# Script to push the resolved PR #30 branch to GitHub
# Run this script with appropriate GitHub credentials

set -e

echo "🔧 Pushing resolved PR #30 branch to GitHub..."
echo ""

# Check if we're in the right directory
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository. Please run from the repository root."
    exit 1
fi

# Check if the branch exists
if ! git show-ref --verify --quiet refs/heads/copilot/create-pr-triage-agent; then
    echo "❌ Error: Branch 'copilot/create-pr-triage-agent' not found."
    echo "   Please fetch the branch first:"
    echo "   git fetch origin copilot/create-pr-triage-agent:copilot/create-pr-triage-agent"
    exit 1
fi

# Check if the merge commit exists
if ! git cat-file -e 776ccc6 2>/dev/null; then
    echo "❌ Error: Merge commit 776ccc6 not found."
    echo "   This script expects the conflict resolution to be already committed locally."
    exit 1
fi

echo "✅ Branch and merge commit found"
echo ""

# Show what will be pushed
echo "📋 Changes to be pushed:"
git log origin/copilot/create-pr-triage-agent..copilot/create-pr-triage-agent --oneline
echo ""

# Confirm
read -p "Do you want to push these changes? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Push cancelled"
    exit 1
fi

# Push
echo ""
echo "🚀 Pushing to origin/copilot/create-pr-triage-agent..."
git push origin copilot/create-pr-triage-agent

echo ""
echo "✅ Successfully pushed resolved conflicts to PR #30!"
echo ""
echo "The PR should now be mergeable. You can verify at:"
echo "https://github.com/thecubiqo/thecubiqo/pull/30"
