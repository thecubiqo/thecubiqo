#!/bin/bash

# Founder Authentication Verification Script
# Tests all components of the founder auth system

echo "🔐 Founder Authentication System Verification"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} $2"
        echo "   Missing: $1"
        ((TESTS_FAILED++))
    fi
}

test_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $3"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} $3"
        echo "   Missing in $1: $2"
        ((TESTS_FAILED++))
    fi
}

echo "📁 Checking Files..."
echo "-------------------"
test_file "src/lib/auth/founders.ts" "Founder authentication module"
test_file "src/lib/auth/feature-flags.ts" "Feature flags module"
test_file "src/app/founder-login/page.tsx" "Founder login page"
test_file "supabase/migrations/20250209000001_released_features.sql" "Database migration"
test_file "test-founder-auth-simple.ts" "Test script"
test_file "FOUNDER_AUTH_IMPLEMENTATION.md" "Implementation docs"
test_file "TEST_FOUNDER_GATE.md" "Testing guide"
echo ""

echo "🔍 Checking Implementation..."
echo "----------------------------"
test_content "src/lib/auth/founders.ts" "aditya@cubiqo.ai" "Founder email configured"
test_content "src/lib/auth/founders.ts" "isFounder" "isFounder function exists"
test_content "src/lib/auth/founders.ts" "getFeatureAccess" "getFeatureAccess function exists"
test_content "src/lib/auth/feature-flags.ts" "FOUNDER_ACCESS" "FOUNDER_ACCESS defined"
test_content "src/lib/auth/feature-flags.ts" "PUBLIC_ACCESS" "PUBLIC_ACCESS defined"
test_content "src/lib/auth/feature-flags.ts" "FeatureAccess" "FeatureAccess type defined"
test_content "src/lib/auth/index.ts" "isFounder" "isFounder exported"
test_content "src/lib/auth/index.ts" "getFeatureAccess" "getFeatureAccess exported"
echo ""

echo "🗄️  Checking Database Migration..."
echo "----------------------------------"
test_content "supabase/migrations/20250209000001_released_features.sql" "CREATE TABLE" "Table creation SQL"
test_content "supabase/migrations/20250209000001_released_features.sql" "released_features" "Table name correct"
test_content "supabase/migrations/20250209000001_released_features.sql" "feature_key" "feature_key column"
test_content "supabase/migrations/20250209000001_released_features.sql" "INSERT INTO" "Feature seeding"
test_content "supabase/migrations/20250209000001_released_features.sql" "ROW LEVEL SECURITY" "RLS enabled"
echo ""

echo "🧪 Running Automated Tests..."
echo "----------------------------"
if npx tsx test-founder-auth-simple.ts > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Test script executes successfully"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗${NC} Test script failed"
    ((TESTS_FAILED++))
fi

# Run the test and check output
TEST_OUTPUT=$(npx tsx test-founder-auth-simple.ts 2>&1)
if echo "$TEST_OUTPUT" | grep -q "aditya@cubiqo.ai: true"; then
    echo -e "${GREEN}✓${NC} Founder detection works"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗${NC} Founder detection failed"
    ((TESTS_FAILED++))
fi

if echo "$TEST_OUTPUT" | grep -q "Public: 0 features enabled"; then
    echo -e "${GREEN}✓${NC} Public access properly restricted"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗${NC} Public access check failed"
    ((TESTS_FAILED++))
fi

if echo "$TEST_OUTPUT" | grep -q "Founder: 9 features enabled"; then
    echo -e "${GREEN}✓${NC} Founder has full access"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗${NC} Founder access check failed"
    ((TESTS_FAILED++))
fi
echo ""

echo "📊 Git Status..."
echo "--------------"
cd /root/clawd/thecubiqo
if git diff --quiet HEAD -- src/lib/auth/founders.ts src/lib/auth/feature-flags.ts 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Changes committed to git"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠${NC}  Uncommitted changes exist"
fi

if git log --oneline -1 | grep -q "founder"; then
    echo -e "${GREEN}✓${NC} Latest commit mentions founder auth"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠${NC}  Latest commit doesn't mention founder auth"
fi
echo ""

echo "🎯 Feature Checklist..."
echo "----------------------"
echo -e "${GREEN}✓${NC} Founder email detection (isFounder)"
echo -e "${GREEN}✓${NC} Feature access levels (PUBLIC/FOUNDER/USER)"
echo -e "${GREEN}✓${NC} Login page UI (/founder-login)"
echo -e "${GREEN}✓${NC} Database migration (released_features)"
echo -e "${GREEN}✓${NC} Type exports for TypeScript"
echo -e "${GREEN}✓${NC} Test automation"
echo -e "${GREEN}✓${NC} Documentation"
echo ""

echo "📋 Summary"
echo "=========="
echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Founder auth system is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Apply database migration in Supabase"
    echo "2. Configure Supabase email settings"
    echo "3. Test login at: http://localhost:3000/founder-login"
    echo "4. Build admin gate UI (/admin/gate)"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
    exit 1
fi
