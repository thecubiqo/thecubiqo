#!/bin/bash
# Quick test script to verify Chromatic token is working
# This simulates what GitHub Actions will do

echo "🔍 Testing Chromatic Token..."
echo ""

# Check if token is provided
if [ -z "$CHROMATIC_PROJECT_TOKEN" ]; then
    echo "❌ CHROMATIC_PROJECT_TOKEN environment variable is not set"
    echo ""
    echo "Usage:"
    echo "  export CHROMATIC_PROJECT_TOKEN='your-token-here'"
    echo "  ./test-chromatic-token.sh"
    echo ""
    echo "Or run directly:"
    echo "  CHROMATIC_PROJECT_TOKEN='your-token-here' ./test-chromatic-token.sh"
    exit 1
fi

echo "✅ Token is set (length: ${#CHROMATIC_PROJECT_TOKEN} characters)"
echo ""

# Check if storybook-static exists, if not build it
if [ ! -d "storybook-static" ]; then
    echo "📦 Building Storybook first..."
    npm run build-storybook
    echo ""
fi

# Run Chromatic with the token
echo "🚀 Running Chromatic..."
echo ""

npx chromatic \
  --project-token="$CHROMATIC_PROJECT_TOKEN" \
  --exit-zero-on-changes \
  --exit-once-uploaded

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ SUCCESS! Chromatic token is working correctly!"
    echo ""
    echo "Your visual regression testing is now active! 🎉"
else
    echo "❌ FAILED! There was an issue with the Chromatic upload."
    echo ""
    echo "Common issues:"
    echo "  - Invalid token format"
    echo "  - Expired token"
    echo "  - Network connectivity"
    echo ""
    echo "Please check the error message above for details."
    exit 1
fi
