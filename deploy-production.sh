#!/bin/bash

# 🚀 CUBIQO Production Deployment Script
# Automates: merge develop → main → deploy → update alias

set -e  # Exit on error

echo "🚀 Starting production deployment..."
echo ""

# Save current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Switch to main and merge develop
echo ""
echo "🔀 Merging develop into main..."
git checkout main
git merge develop

# Push to main (triggers GitHub Actions)
echo ""
echo "📤 Pushing to main..."
git push origin main

# Wait for Vercel deployment to complete
echo ""
echo "⏳ Waiting for Vercel deployment (30 seconds)..."
sleep 30

# Get latest production deployment URL
echo ""
echo "🔍 Finding latest production deployment..."
LATEST_DEPLOYMENT=$(vercel ls --prod 2>/dev/null | grep -E "cubiqo-[a-z0-9]+-denis-projects" | head -1 | awk '{print $1}')

if [ -z "$LATEST_DEPLOYMENT" ]; then
    echo "❌ Error: Could not find latest deployment"
    echo "Please check Vercel dashboard manually: https://vercel.com/denis-projects-d7156840/cubiqo"
    git checkout $CURRENT_BRANCH
    exit 1
fi

echo "✅ Latest deployment: $LATEST_DEPLOYMENT"

# Update cubiqo.ai alias
echo ""
echo "🔗 Updating cubiqo.ai alias..."
vercel alias set $LATEST_DEPLOYMENT cubiqo.ai

# Return to original branch
echo ""
echo "🔙 Returning to $CURRENT_BRANCH..."
git checkout $CURRENT_BRANCH

echo ""
echo "✅ Production deployment complete!"
echo ""
echo "🌐 Check: https://cubiqo.ai (do hard refresh: Cmd+Shift+R)"
echo "📊 Status: https://github.com/devStar0604/cubiqo/actions"
echo ""
