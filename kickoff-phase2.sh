#!/bin/bash

# Kickoff Phase 2 with Henry coordinating all agents

PROD_URL="https://thecubiqo-l0a966fqc-cubiqo-projects-d7156840.vercel.app"

echo "🚀 Kicking off Phase 2 with Henry..."
echo ""

# Send coordination task to Henry
curl -X POST "$PROD_URL/api/agents/henry/run" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Read HENRY_PHASE2_COORDINATION.md and execute the plan. Spawn all 5 tasks in parallel: Supabase integration (Dev), Swift support (Dev), API docs (Writer), Test suite (Tester), Landing page copy (Marketing). Report progress every 5 minutes."
  }' | jq .

echo ""
echo "✅ Phase 2 coordination started!"
echo "Henry will now spawn and coordinate all agents."
echo ""
echo "Monitor progress at: $PROD_URL/agents"
