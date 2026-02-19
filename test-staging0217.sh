#!/bin/bash
# Staging0217 Automated Testing Script
# This script performs automated checks on staging0217 branch

set -e

echo "🧪 Staging0217 Automated Testing Script"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Test function
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -n "Testing: $test_name ... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
        return 1
    fi
}

# Warning function
run_warning() {
    local test_name=$1
    local test_command=$2
    
    echo -n "Checking: $test_name ... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ WARNING${NC}"
        ((WARNINGS++))
        return 1
    fi
}

echo "1. Environment Checks"
echo "---------------------"
run_test "Node.js installed" "command -v node"
run_test "npm installed" "command -v npm"
run_test "Git installed" "command -v git"
echo ""

echo "2. Repository State"
echo "-------------------"
run_test "In git repository" "git rev-parse --git-dir"
run_test "Can access staging0217" "git show-ref --verify --quiet refs/heads/staging0217 || git show-ref --verify --quiet refs/remotes/origin/staging0217"
echo ""

echo "3. Dependencies"
echo "---------------"
if [ -f "package.json" ]; then
    if [ -d "node_modules" ]; then
        run_test "node_modules exists" "test -d node_modules"
    else
        echo -e "${YELLOW}⚠ WARNING: node_modules not found. Run 'npm install'${NC}"
        ((WARNINGS++))
    fi
    
    run_test "package-lock.json exists" "test -f package-lock.json"
else
    echo -e "${RED}✗ FAIL: package.json not found${NC}"
    ((FAILED++))
fi
echo ""

echo "4. Configuration Files"
echo "----------------------"
run_test ".env.example exists" "test -f .env.example"
run_warning ".env.local exists" "test -f .env.local"
run_test "next.config.js exists" "test -f next.config.js"
run_test "tsconfig.json exists" "test -f tsconfig.json"
echo ""

echo "5. Critical Files from Staging0217"
echo "-----------------------------------"
run_test "Health check API exists" "test -f src/app/api/health/route.ts"
run_test "Session API exists" "test -f src/app/api/session/route.ts"
run_test "useSession hook exists" "test -f src/hooks/useSession.ts"
echo ""

echo "6. Database Scripts"
echo "-------------------"
run_test "Master production script exists" "test -f supabase/MASTER_PRODUCTION_SETUP.sql"
run_test "Staging reset script exists" "test -f supabase/RESET_STAGING_DATA.sql"
echo ""

echo "7. Documentation"
echo "----------------"
run_test "README.md exists" "test -f README.md"
run_test "BRANCH_MERGE_ANALYSIS.md exists" "test -f BRANCH_MERGE_ANALYSIS.md"
run_test "STAGING0217_TESTING_GUIDE.md exists" "test -f STAGING0217_TESTING_GUIDE.md"
run_test "STAGING0217_BUG_REPORTS.md exists" "test -f STAGING0217_BUG_REPORTS.md"
echo ""

echo "8. Conflict Markers Check"
echo "-------------------------"
if grep -r "<<<<<<< HEAD" --include="*.js" --include="*.ts" --include="*.tsx" --include="*.jsx" . 2>/dev/null | grep -v node_modules | grep -v .git; then
    echo -e "${RED}✗ FAIL: Conflict markers found in code${NC}"
    ((FAILED++))
else
    echo -e "${GREEN}✓ PASS: No conflict markers found${NC}"
    ((PASSED++))
fi
echo ""

echo "9. TypeScript Check (if available)"
echo "-----------------------------------"
if command -v tsc &> /dev/null; then
    if npx tsc --noEmit 2>&1 | head -20; then
        echo -e "${GREEN}✓ TypeScript check passed${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ TypeScript has warnings/errors${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠ TypeScript not available${NC}"
    ((WARNINGS++))
fi
echo ""

echo "10. Lint Check (if available)"
echo "-----------------------------"
if npm run lint --if-present 2>&1 | head -20; then
    echo -e "${GREEN}✓ Lint check completed${NC}"
else
    echo -e "${YELLOW}⚠ Lint check has warnings${NC}"
    ((WARNINGS++))
fi
echo ""

# Summary
echo ""
echo "========================================"
echo "📊 Test Summary"
echo "========================================"
echo -e "✓ Passed:   ${GREEN}$PASSED${NC}"
echo -e "✗ Failed:   ${RED}$FAILED${NC}"
echo -e "⚠ Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review STAGING0217_TESTING_GUIDE.md for manual testing"
    echo "2. Start with visual/UI testing"
    echo "3. Document any bugs in STAGING0217_BUG_REPORTS.md"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review and fix.${NC}"
    exit 1
fi
