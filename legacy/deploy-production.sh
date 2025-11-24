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
PUSH_TIME=$(date +%s)
git push origin main

# Wait for NEW deployment with polling
echo ""
echo "⏳ Waiting for new deployment (checking every 20s, max 5 minutes)..."
MAX_WAIT=300  # 5 minutes
ELAPSED=0
LATEST_DEPLOYMENT=""

while [ $ELAPSED -lt $MAX_WAIT ]; do
    sleep 20
    ELAPSED=$((ELAPSED + 20))

    echo "🔍 Checking for new deployment... (${ELAPSED}s elapsed)"

    # Get all production deployments with timestamps
    DEPLOYMENTS=$(vercel ls --prod 2>/dev/null)

    # Extract first deployment URL (most recent)
    NEW_DEPLOYMENT=$(echo "$DEPLOYMENTS" | grep -oE "cubiqo-[a-z0-9]+-cubiqo-projects-[a-z0-9]+\.vercel\.app" | head -1)

    if [ -n "$NEW_DEPLOYMENT" ]; then
        # Check if deployment is new (created after push)
        DEPLOYMENT_AGE=$(echo "$DEPLOYMENTS" | grep "$NEW_DEPLOYMENT" | awk '{print $3}')

        # If age is in seconds (s) or minutes (m) and less than elapsed time, it's new
        if echo "$DEPLOYMENT_AGE" | grep -qE "^[0-9]+s$"; then
            # Age in seconds
            AGE_SECONDS=$(echo "$DEPLOYMENT_AGE" | sed 's/s//')
            if [ $AGE_SECONDS -lt $ELAPSED ]; then
                LATEST_DEPLOYMENT=$NEW_DEPLOYMENT
                echo "✅ Found new deployment: $LATEST_DEPLOYMENT (age: ${DEPLOYMENT_AGE})"
                break
            fi
        elif echo "$DEPLOYMENT_AGE" | grep -qE "^[0-9]+m$"; then
            # Age in minutes
            AGE_MINUTES=$(echo "$DEPLOYMENT_AGE" | sed 's/m//')
            AGE_SECONDS=$((AGE_MINUTES * 60))
            if [ $AGE_SECONDS -lt $ELAPSED ]; then
                LATEST_DEPLOYMENT=$NEW_DEPLOYMENT
                echo "✅ Found new deployment: $LATEST_DEPLOYMENT (age: ${DEPLOYMENT_AGE})"
                break
            fi
        fi
    fi

    echo "   No new deployment yet, waiting..."
done

if [ -z "$LATEST_DEPLOYMENT" ]; then
    echo "❌ Error: Timeout waiting for deployment (5 minutes)"
    echo "Please check Vercel dashboard manually: https://vercel.com/cubiqo-projects-d7156840/cubiqo"
    git checkout $CURRENT_BRANCH
    exit 1
fi

# Note: Domain alias is now set automatically by GitHub Actions workflow
echo ""
echo "ℹ️  Domain alias will be set automatically by GitHub Actions"
echo "   (No manual alias update needed - workflow handles this now)"

# Return to original branch
echo ""
echo "🔙 Returning to $CURRENT_BRANCH..."
git checkout $CURRENT_BRANCH

echo ""
echo "✅ Production deployment complete!"
echo ""
echo "🌐 Check: https://cubiqo.ai (do hard refresh: Cmd+Shift+R)"
echo "📊 Status: https://github.com/thecubiqo/thecubiqo/actions"
echo ""
