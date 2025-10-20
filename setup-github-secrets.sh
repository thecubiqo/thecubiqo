#!/bin/bash

# 🔧 CUBIQO - Quick GitHub Secrets Setup
# This script helps you add required secrets to GitHub for automatic deployments

echo "🚀 CUBIQO - GitHub Secrets Setup"
echo "================================"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Install it with: brew install gh"
    echo "Or visit: https://cli.github.com/"
    exit 1
fi

# Check if user is logged in to GitHub CLI
if ! gh auth status &> /dev/null; then
    echo "🔐 Please login to GitHub CLI first:"
    gh auth login
fi

echo "📋 Getting Vercel credentials..."
echo ""

# Get project details from .vercel/project.json
if [ ! -f ".vercel/project.json" ]; then
    echo "❌ .vercel/project.json not found!"
    echo "Run 'vercel link' first to connect this project to Vercel."
    exit 1
fi

VERCEL_PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
VERCEL_ORG_ID=$(cat .vercel/project.json | grep -o '"orgId":"[^"]*' | cut -d'"' -f4)

echo "✅ Found Project ID: $VERCEL_PROJECT_ID"
echo "✅ Found Org ID: $VERCEL_ORG_ID"
echo ""

# Ask for Vercel token
echo "🔑 Now we need your Vercel token."
echo "To create one, run: vercel token create"
echo ""
read -sp "Paste your VERCEL_TOKEN here: " VERCEL_TOKEN
echo ""
echo ""

if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ Token cannot be empty!"
    exit 1
fi

echo "📤 Adding secrets to GitHub..."
echo ""

# Add secrets to GitHub
gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN"
gh secret set VERCEL_PROJECT_ID --body "$VERCEL_PROJECT_ID"
gh secret set VERCEL_ORG_ID --body "$VERCEL_ORG_ID"

echo ""
echo "✅ All secrets added successfully!"
echo ""
echo "📋 Summary:"
echo "  - VERCEL_TOKEN: ✅ Set"
echo "  - VERCEL_PROJECT_ID: $VERCEL_PROJECT_ID"
echo "  - VERCEL_ORG_ID: $VERCEL_ORG_ID"
echo ""
echo "🎉 Setup complete!"
echo ""
echo "Now you can:"
echo "  1. Push to 'develop' branch → auto-deploy to staging.cubiqo.ai"
echo "  2. Push to 'main' branch → auto-deploy to cubiqo.ai"
echo ""
echo "Test it: git push origin develop"
