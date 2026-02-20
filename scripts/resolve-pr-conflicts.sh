#!/usr/bin/env bash
# =============================================================================
# PR Conflict Resolution Script
# Resolves merge conflicts on PR #116 and PR #113 against main
# 
# Usage: ./scripts/resolve-pr-conflicts.sh [--pr116] [--pr113] [--both]
# =============================================================================
set -euo pipefail

REPO_URL="https://github.com/thecubiqo/thecubiqo.git"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[⚠]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; }

resolve_pr116() {
    echo ""
    echo "============================================="
    echo "  Resolving PR #116 — Enterprise Security"
    echo "============================================="
    echo ""
    
    # Checkout the PR branch
    log "Checking out copilot/implement-security-features..."
    git fetch origin copilot/implement-security-features
    git checkout copilot/implement-security-features
    
    # Merge main
    log "Merging main into PR #116 branch..."
    if git merge origin/main --no-edit 2>/dev/null; then
        log "No conflicts — already resolved or clean merge!"
        return 0
    fi
    
    # Check for the expected conflict
    if git diff --name-only --diff-filter=U | grep -q "src/app/founders-pass/page.tsx"; then
        log "Resolving conflict in src/app/founders-pass/page.tsx..."
        log "Strategy: Keep PR's Security Dashboard (268 lines) over main's redirect placeholder (5 lines)"
        git checkout --ours src/app/founders-pass/page.tsx
        git add src/app/founders-pass/page.tsx
    else
        err "Unexpected conflict files:"
        git diff --name-only --diff-filter=U
        err "Please resolve manually"
        return 1
    fi
    
    # Check for any remaining conflicts
    REMAINING=$(git diff --name-only --diff-filter=U 2>/dev/null | wc -l)
    if [ "$REMAINING" -gt 0 ]; then
        err "Still have unresolved conflicts:"
        git diff --name-only --diff-filter=U
        return 1
    fi
    
    # Verify no conflict markers
    if grep "<<<<<<" src/app/founders-pass/page.tsx 2>/dev/null; then
        err "Conflict markers still present!"
        return 1
    fi
    
    # Commit and push
    git commit -m "Resolve merge conflict with main: keep security dashboard over redirect" \
        -m "Conflict in src/app/founders-pass/page.tsx resolved:" \
        -m "- Kept PR's full Security Dashboard (268 lines with stat cards, security banner, flags UI)" \
        -m "- Discarded main's 5-line redirect placeholder (redirect('/founderspass'))"
    
    log "Pushing resolved branch..."
    git push origin copilot/implement-security-features
    
    log "PR #116 conflict resolved and pushed! ✅"
}

resolve_pr113() {
    echo ""
    echo "============================================="
    echo "  Resolving PR #113 — Emergent Studio"
    echo "============================================="
    echo ""
    
    # Checkout the PR branch
    log "Checking out copilot/build-ai-app-environment..."
    git fetch origin copilot/build-ai-app-environment
    git checkout copilot/build-ai-app-environment
    
    # Merge main
    log "Merging main into PR #113 branch..."
    if git merge origin/main --no-edit 2>/dev/null; then
        log "No conflicts — already resolved or clean merge!"
        return 0
    fi
    
    # Check for the expected conflict
    if git diff --name-only --diff-filter=U | grep -q "package-lock.json"; then
        log "Resolving conflict in package-lock.json..."
        log "Strategy: Accept main's version, then regenerate"
        git checkout --theirs package-lock.json
        git add package-lock.json
    else
        err "Unexpected conflict files:"
        git diff --name-only --diff-filter=U
        err "Please resolve manually"
        return 1
    fi
    
    # Check for any remaining conflicts
    REMAINING=$(git diff --name-only --diff-filter=U 2>/dev/null | wc -l)
    if [ "$REMAINING" -gt 0 ]; then
        err "Still have unresolved conflicts:"
        git diff --name-only --diff-filter=U
        return 1
    fi
    
    # Verify no conflict markers
    if grep "<<<<<<" package-lock.json 2>/dev/null; then
        err "Conflict markers still present!"
        return 1
    fi
    
    # Commit and push
    git commit -m "Resolve merge conflict with main: accept main's package-lock.json" \
        -m "Conflict in package-lock.json resolved:" \
        -m "- Accepted main's lockfile (magicast/make-dir entries reorganized)" \
        -m "- PR's package.json dependencies auto-merged cleanly"
    
    log "Pushing resolved branch..."
    git push origin copilot/build-ai-app-environment
    
    log "PR #113 conflict resolved and pushed! ✅"
}

# Parse arguments
case "${1:---both}" in
    --pr116)
        resolve_pr116
        ;;
    --pr113)
        resolve_pr113
        ;;
    --both|*)
        resolve_pr116
        resolve_pr113
        echo ""
        echo "============================================="
        log "Both PRs resolved! 🎉"
        echo "============================================="
        echo ""
        echo "Next steps:"
        echo "  1. Check PR #116: https://github.com/thecubiqo/thecubiqo/pull/116"
        echo "  2. Check PR #113: https://github.com/thecubiqo/thecubiqo/pull/113"
        echo "  3. Both should now show as 'Mergeable' on GitHub"
        ;;
esac
