#!/bin/bash
# Chromatic Token Verification Script
# This script verifies that the Chromatic integration is properly configured

set -e

echo "=========================================="
echo "Chromatic Integration Verification"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this from the project root."
    exit 1
fi

# Check if chromatic is installed
echo "1. Checking Chromatic installation..."
if npm list chromatic --depth=0 > /dev/null 2>&1; then
    VERSION=$(npm list chromatic --depth=0 | grep chromatic | awk '{print $2}' | sed 's/@//')
    echo "✅ Chromatic is installed (version $VERSION)"
else
    echo "❌ Chromatic is not installed"
    exit 1
fi

# Check if Storybook is configured
echo ""
echo "2. Checking Storybook configuration..."
if [ -d ".storybook" ]; then
    echo "✅ Storybook is configured (.storybook/ directory exists)"
else
    echo "❌ Storybook is not configured"
    exit 1
fi

# Check if stories exist
echo ""
echo "3. Checking for component stories..."
STORY_COUNT=$(find src -name "*.stories.tsx" -o -name "*.stories.ts" -o -name "*.stories.jsx" -o -name "*.stories.js" 2>/dev/null | wc -l)
if [ "$STORY_COUNT" -gt 0 ]; then
    echo "✅ Found $STORY_COUNT story file(s)"
else
    echo "❌ No story files found"
    exit 1
fi

# Build Storybook
echo ""
echo "4. Building Storybook..."
if npm run build-storybook > /tmp/storybook-build.log 2>&1; then
    echo "✅ Storybook build successful"
else
    echo "❌ Storybook build failed. Check /tmp/storybook-build.log for details"
    exit 1
fi

# Check if CHROMATIC_PROJECT_TOKEN is set
echo ""
echo "5. Checking for Chromatic project token..."
if [ -n "$CHROMATIC_PROJECT_TOKEN" ]; then
    echo "✅ CHROMATIC_PROJECT_TOKEN is set in environment"
    
    # Try to run Chromatic
    echo ""
    echo "6. Testing Chromatic connection..."
    echo "   (This will create a build in your Chromatic project)"
    
    if npx chromatic --exit-zero-on-changes --exit-once-uploaded 2>&1 | tee /tmp/chromatic-test.log; then
        echo "✅ Chromatic upload successful!"
        echo ""
        echo "Check the output above for the Chromatic build URL."
    else
        echo "❌ Chromatic upload failed. Check /tmp/chromatic-test.log for details"
        exit 1
    fi
else
    echo "⚠️  CHROMATIC_PROJECT_TOKEN is NOT set in environment"
    echo ""
    echo "For local testing, you can set it with:"
    echo "  export CHROMATIC_PROJECT_TOKEN='your-token-here'"
    echo ""
    echo "For GitHub Actions, the token should be set as a repository secret."
    echo "The GitHub Actions workflow will automatically use secrets.CHROMATIC_PROJECT_TOKEN"
    echo ""
    echo "To verify GitHub Actions integration:"
    echo "  1. Push changes to a branch"
    echo "  2. Create a pull request"
    echo "  3. Check the 'Chromatic Visual Tests' workflow run"
fi

echo ""
echo "=========================================="
echo "Verification Complete!"
echo "=========================================="
