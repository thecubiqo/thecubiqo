#!/bin/bash

# Test script for session compaction API
# Requires the dev server to be running

BASE_URL="http://localhost:3000"

echo "=== Session Compaction API Test ==="
echo ""

# First, create an agent (assuming one exists with id 'test-agent')
# You may need to adjust this based on your actual agent setup

AGENT_ID="your-agent-id"
SESSION_ID="test-session-id"

echo "Testing API endpoint: POST /api/sessions/[id]/compact"
echo ""

# Test 1: Get compaction stats
echo "1. Getting compaction stats..."
curl -X GET "${BASE_URL}/api/sessions/${SESSION_ID}/compact?agentId=${AGENT_ID}" \
  -H "Content-Type: application/json" \
  2>/dev/null | jq '.' || echo "Failed to get stats"

echo ""
echo "---"
echo ""

# Test 2: Trigger compaction
echo "2. Triggering compaction..."
curl -X POST "${BASE_URL}/api/sessions/${SESSION_ID}/compact" \
  -H "Content-Type: application/json" \
  -d "{
    \"agentId\": \"${AGENT_ID}\",
    \"forceCompact\": true,
    \"keepRecentCount\": 10
  }" \
  2>/dev/null | jq '.' || echo "Failed to trigger compaction"

echo ""
echo "---"
echo ""

echo "✓ API test complete"
echo ""
echo "Note: Update AGENT_ID and SESSION_ID variables with actual values"
echo "      or create them via the agent API first"
