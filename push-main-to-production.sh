#!/bin/bash
# Push main branch to production
# This will trigger Vercel deployment to www.cubiqo.ai

set -e

echo "🚀 Pushing main branch to production..."
echo ""

# Check if we're in a git repo
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Fetch latest
echo "📥 Fetching latest changes..."
git fetch origin main

# Check if main branch exists locally
if ! git show-ref --verify --quiet refs/heads/main; then
    echo "❌ Error: Main branch doesn't exist locally"
    echo "   Run: git checkout main"
    exit 1
fi

# Switch to main
echo "🔀 Switching to main branch..."
git checkout main

# Show what will be pushed
echo ""
echo "📋 Changes to be pushed:"
git log origin/main..main --oneline --graph | head -20
echo ""

# Check if there are changes to push
if [ -z "$(git log origin/main..main)" ]; then
    echo "✅ Main is already up to date with origin"
    echo "   No changes to push"
    exit 0
fi

# Confirm push
read -p "Push these changes to production? This will deploy to www.cubiqo.ai (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Push cancelled"
    exit 1
fi

# Push
echo ""
echo "🚀 Pushing to origin/main..."
git push origin main

echo ""
echo "✅ Successfully pushed to production!"
echo ""
echo "Vercel will now:"
echo "  1. Detect the push"
echo "  2. Run the build"
echo "  3. Deploy to www.cubiqo.ai"
echo ""
echo "Monitor deployment at: https://vercel.com/thecubiqo/thecubiqo"
echo "Production URL: https://www.cubiqo.ai"
