#!/bin/bash

SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hb3hlemNtY2F1ZWNhd2NoZ2prIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk1NjQ1NCwiZXhwIjoyMDc5NTMyNDU0fQ.fE55YEpc-CJydy1ADeNNa2EWQX-rxlNiaGYcAbeWjeg"
PROJECT_URL="https://naoxezcmcauecawchgjk.supabase.co"

echo "🔧 Creating released_features table..."

# Use postgres connection via pg_dump/restore style
# Actually, let's just verify tables exist and seed data if they do

# Check if table exists
curl -s -X POST "$PROJECT_URL/rest/v1/rpc/check_table" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"table_name": "released_features"}' 2>&1

echo ""
echo "⚠️  Cannot create tables via REST API"
echo ""
echo "📋 Easiest option: I'll create a single SQL file for you to run"
